import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../../modules/auth/entities/user.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Seed para criar o usuário administrador padrão
 * Executado na inicialização para garantir acesso inicial ao sistema
 */
export async function seedAdminUser(dataSource: DataSource): Promise<void> {
  const userRepository = dataSource.getRepository(User);

  // Verifica se já existe o usuário admin
  const existingAdmin = await userRepository.findOne({
    where: { email: 'admin@eventcad.com' },
  });

  if (existingAdmin) {
    console.log('✅ Usuário administrador já existe, pulando seed...');
    return;
  }

  // Hash da senha padrão
  const defaultPassword = 'EventCAD@2025';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);

  // Cria o usuário administrador
  const adminUser = userRepository.create({
    fullName: 'Administrador EventCAD+',
    email: 'admin@eventcad.com',
    password: hashedPassword,
    role: UserRole.SUPER_ADMIN,
    phone: '+55 11 9999-9999',
    position: 'Super Administrador',
    company: 'EventCAD+ Technologies',
    preferredLanguage: 'pt-BR',
    timezone: 'America/Sao_Paulo',
    mfaEnabled: false,
    emailVerified: true,
    tenantId: 'default',
    isActive: true,
    settings: {
      theme: 'dark',
      notifications: {
        email: true,
        push: true,
        desktop: true,
      },
      dashboard: {
        defaultView: 'overview',
        refreshInterval: 30,
      },
      security: {
        sessionTimeout: 480, // 8 horas
        requireMfaForSensitiveActions: false,
      },
    },
  });

  await userRepository.save(adminUser);

  console.log('✅ Usuário administrador criado com sucesso:', {
    id: adminUser.id,
    email: adminUser.email,
    role: adminUser.role,
    password: '⚠️  Senha padrão: EventCAD@2025 (ALTERE IMEDIATAMENTE!)',
  });

  console.log(
    '\n🔐 IMPORTANTE: Altere a senha padrão imediatamente após o primeiro login!',
  );
}
