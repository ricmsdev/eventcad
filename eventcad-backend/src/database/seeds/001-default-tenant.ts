import { DataSource } from 'typeorm';
import { Tenant } from '../../modules/tenant/entities/tenant.entity';

/**
 * Seed para criar o tenant padrão do sistema
 * Executado na inicialização para garantir que existe pelo menos um tenant
 */
export async function seedDefaultTenant(dataSource: DataSource): Promise<void> {
  const tenantRepository = dataSource.getRepository(Tenant);

  // Verifica se já existe o tenant padrão
  const existingTenant = await tenantRepository.findOne({
    where: { subdomain: 'default' },
  });

  if (existingTenant) {
    console.log('✅ Tenant padrão já existe, pulando seed...');
    return;
  }

  // Cria o tenant padrão
  const defaultTenant = tenantRepository.create({
    name: 'EventCAD+ Demo',
    subdomain: 'default',
    contactEmail: 'admin@eventcad.com',
    contactPhone: '+55 11 9999-9999',
    address: 'Rua das Tecnologias, 1000',
    city: 'São Paulo',
    state: 'SP',
    postalCode: '01000-000',
    country: 'BR',
    currency: 'BRL',
    timezone: 'America/Sao_Paulo',
    defaultLanguage: 'pt-BR',
    plan: 'enterprise',
    maxEvents: 100,
    maxUsers: 200,
    storageLimit: 107374182400, // 100GB
    storageUsed: 0,
    subscriptionStatus: 'active',
    subscriptionStartDate: new Date(),
    subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 ano
    monthlyFee: 499.99,
    tenantId: 'default',
    isActive: true,
    complianceRules: {
      nfpa: {
        enabled: true,
        version: '2021',
      },
      abnt: {
        enabled: true,
        version: '2023',
      },
      ada: {
        enabled: true,
        version: '2010',
      },
      iso: {
        enabled: true,
        standards: ['ISO 9001', 'ISO 14001', 'ISO 45001'],
      },
    },
    notificationSettings: {
      emailFrom: 'noreply@eventcad.com',
      webhookUrls: [],
    },
    customSettings: {
      enableAiRecognition: true,
      enableComplianceEngine: true,
      enableRealtimeCollaboration: true,
      enableMobileApp: true,
      defaultEventType: 'feira',
      autoBackup: true,
      backupFrequency: 'daily',
    },
  });

  await tenantRepository.save(defaultTenant);

  console.log('✅ Tenant padrão criado com sucesso:', {
    id: defaultTenant.id,
    name: defaultTenant.name,
    subdomain: defaultTenant.subdomain,
  });
}
