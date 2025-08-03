import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './modules/auth/entities/user.entity';
import { UserRole } from './common/enums/user-role.enum';
import { hash } from 'bcrypt';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const userRepository = app.get<Repository<User>>('UserRepository');

  try {
    // Verificar se já existe um usuário admin
    const existingAdmin = await userRepository.findOne({
      where: { email: 'admin@eventcad.com' }
    });
    
    if (!existingAdmin) {
      // Criar usuário admin
      const hashedPassword = await hash('EventCAD@2025', 10);
      
      const adminUser = userRepository.create({
        fullName: 'Administrador EventCAD+',
        email: 'admin@eventcad.com',
        password: hashedPassword,
        role: UserRole.ADMIN,
        isActive: true,
        emailVerified: true,
        company: 'EventCAD+',
        position: 'Administrador',
        phone: '+55 11 99999-9999',
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        settings: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      });

      await userRepository.save(adminUser);
      console.log('✅ Usuário admin criado com sucesso!');
      console.log('📧 Email: admin@eventcad.com');
      console.log('🔑 Senha: EventCAD@2025');
    } else {
      console.log('ℹ️ Usuário admin já existe!');
    }

    // Criar usuário demo
    const existingDemo = await userRepository.findOne({
      where: { email: 'demo@eventcad.com' }
    });
    
    if (!existingDemo) {
      const hashedPassword = await hash('demo123', 10);
      
      const demoUser = userRepository.create({
        fullName: 'Usuário Demo',
        email: 'demo@eventcad.com',
        password: hashedPassword,
        role: UserRole.PROJECT_MANAGER,
        isActive: true,
        emailVerified: true,
        company: 'Empresa Demo',
        position: 'Gerente de Eventos',
        phone: '+55 11 88888-8888',
        preferredLanguage: 'pt-BR',
        timezone: 'America/Sao_Paulo',
        settings: {
          theme: 'light',
          notifications: {
            email: true,
            push: true,
            sms: false
          }
        }
      });

      await userRepository.save(demoUser);
      console.log('✅ Usuário demo criado com sucesso!');
      console.log('📧 Email: demo@eventcad.com');
      console.log('🔑 Senha: demo123');
    } else {
      console.log('ℹ️ Usuário demo já existe!');
    }

  } catch (error) {
    console.error('❌ Erro ao criar usuários:', error);
  } finally {
    await app.close();
  }
}

bootstrap(); 