import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { TenantModule } from './modules/tenant/tenant.module';
import { EventoModule } from './modules/evento/evento.module';
import { UploadModule } from './modules/upload/upload.module';
import { PlantaModule } from './modules/planta/planta.module';
import { AIRecognitionModule } from './modules/ai-recognition/ai-recognition.module';
import { InfraObjectModule } from './modules/infra-object/infra-object.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

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
      host: process.env.DATABASE_HOST || 'postgres',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USERNAME || 'eventcad_user',
      password: process.env.DATABASE_PASSWORD || 'eventcad_password',
      database: process.env.DATABASE_NAME || 'eventcad_db',
      entities: [__dirname + '/**/*.entity{.ts,.js}'] as string[],
      migrations: [__dirname + '/database/migrations/*{.ts,.js}'] as string[],
      synchronize: true,
      logging: true,
      ssl: false,
      retryAttempts: 3,
      retryDelay: 3000,
      autoLoadEntities: true,
      extra: {
        max: 20,
        min: 5,
        acquireTimeoutMillis: 60000,
        idleTimeoutMillis: 600000,
      },
    }),

    // Rate limiting para proteção
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minuto
        limit: 100, // 100 requests por minuto
      },
    ]),

    // Módulos da aplicação
    AuthModule,
    TenantModule,
    EventoModule,
    UploadModule,
    PlantaModule,
    AIRecognitionModule,
    InfraObjectModule,
  ],
  controllers: [AppController],
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
