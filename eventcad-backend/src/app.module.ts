import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { EventoModule } from './modules/evento/evento.module';
import { UploadModule } from './modules/upload/upload.module';
import { PlantaModule } from './modules/planta/planta.module';
import { AIRecognitionModule } from './modules/ai-recognition/ai-recognition.module';
import { InfraObjectModule } from './modules/infra-object/infra-object.module';
import { ChecklistModule } from './modules/checklist/checklist.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { MonitoringModule } from './modules/monitoring/monitoring.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';
import { TestController } from './test.controller';

/**
 * Módulo principal da aplicação EventCAD+
 */
@Module({
  imports: [
    // Configuração de ambiente
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),

    // Configuração do banco de dados
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      username: process.env.DB_USERNAME || 'eventcad_user',
      password: process.env.DB_PASSWORD || 'eventcad_password',
      database: process.env.DB_DATABASE || 'eventcad_dev',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      logging: process.env.NODE_ENV !== 'production',
      namingStrategy: new SnakeNamingStrategy(),
    }),

    // Rate limiting para proteção
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Agendamento de tarefas
    ScheduleModule.forRoot(),

    // Módulos da aplicação
    AuthModule,
    TenantModule,
    EventoModule,
    UploadModule,
    PlantaModule,
    AIRecognitionModule,
    InfraObjectModule,
    ChecklistModule,
    RelatoriosModule,
    MonitoringModule,
  ],
  controllers: [AppController, TestController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule {}
