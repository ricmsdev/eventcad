import { Entity, Column, OneToMany, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Entidade Tenant - Representa uma organização/cliente no sistema EventCAD+
 * Implementa isolamento de dados multi-tenant
 *
 * Funcionalidades:
 * - Isolamento completo de dados por tenant
 * - Configurações específicas por organização
 * - Limites de uso e billing
 * - Customização de marca e aparência
 * - Configurações de compliance específicas
 */
@Entity('tenants')
@Index(['subdomain'], { unique: true })
export class Tenant extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome da organização/empresa',
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
    nullable: false,
    comment: 'Subdomínio único para acesso (ex: empresa.eventcad.com)',
  })
  subdomain: string;

  @Column({
    type: 'varchar',
    length: 150,
    nullable: false,
    comment: 'Email de contato principal',
  })
  contactEmail: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone de contato',
  })
  contactPhone?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Endereço completo da empresa',
  })
  address?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cidade',
  })
  city?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Estado/região',
  })
  state?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'CEP/código postal',
  })
  postalCode?: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'BR',
    comment: 'Código do país (ISO 3166-1)',
  })
  country: string;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
    comment: 'Moeda padrão (ISO 4217)',
  })
  currency: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'America/Sao_Paulo',
    comment: 'Timezone padrão',
  })
  timezone: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'pt-BR',
    comment: 'Idioma padrão',
  })
  defaultLanguage: string;

  // Configurações de marca e aparência
  @Column({
    type: 'text',
    nullable: true,
    comment: 'URL do logo da empresa',
  })
  logoUrl?: string;

  @Column({
    type: 'varchar',
    length: 7,
    default: '#1976d2',
    comment: 'Cor primária da marca (hex)',
  })
  primaryColor: string;

  @Column({
    type: 'varchar',
    length: 7,
    default: '#dc004e',
    comment: 'Cor secundária da marca (hex)',
  })
  secondaryColor: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'CSS customizado para personalização',
  })
  customCss?: string;

  // Configurações de plano e limites
  @Column({
    type: 'varchar',
    length: 50,
    default: 'basic',
    comment: 'Plano contratado (basic, professional, enterprise)',
  })
  plan: string;

  @Column({
    type: 'integer',
    default: 10,
    comment: 'Limite máximo de eventos simultâneos',
  })
  maxEvents: number;

  @Column({
    type: 'integer',
    default: 50,
    comment: 'Limite máximo de usuários',
  })
  maxUsers: number;

  @Column({
    type: 'bigint',
    default: 10737418240, // 10GB
    comment: 'Limite de armazenamento em bytes',
  })
  storageLimit: number;

  @Column({
    type: 'bigint',
    default: 0,
    comment: 'Espaço de armazenamento usado em bytes',
  })
  storageUsed: number;

  // Configurações de compliance e segurança
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Normas de compliance específicas do tenant',
  })
  complianceRules?: Record<string, any>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Requer MFA obrigatório para todos os usuários',
  })
  requireMfa: boolean;

  @Column({
    type: 'integer',
    default: 90,
    comment: 'Dias para expiração de senha',
  })
  passwordExpirationDays: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de integração com sistemas externos',
  })
  integrationSettings?: Record<string, any>;

  // Configurações de notificação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de email e notificações',
  })
  notificationSettings?: {
    emailFrom?: string;
    smtpSettings?: Record<string, any>;
    webhookUrls?: string[];
    slackIntegration?: Record<string, any>;
  };

  // Configurações de billing
  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de início da assinatura',
  })
  subscriptionStartDate?: Date;

  @Column({
    type: 'date',
    nullable: true,
    comment: 'Data de fim/renovação da assinatura',
  })
  subscriptionEndDate?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Status da assinatura (active, suspended, cancelled)',
  })
  subscriptionStatus?: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Valor mensal da assinatura',
  })
  monthlyFee?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações adicionais específicas do tenant',
  })
  customSettings?: Record<string, any>;

  /**
   * Verifica se o tenant está ativo e dentro dos limites
   */
  isTenantActive(): boolean {
    return (
      this.isActive &&
      this.subscriptionStatus === 'active' &&
      (!this.subscriptionEndDate || this.subscriptionEndDate > new Date())
    );
  }

  /**
   * Verifica se pode criar mais eventos
   */
  canCreateEvent(): boolean {
    // Aqui seria implementada a lógica para contar eventos ativos
    // Por enquanto, assume que está dentro do limite
    return this.isTenantActive();
  }

  /**
   * Verifica se pode adicionar mais usuários
   */
  canAddUser(): boolean {
    // Aqui seria implementada a lógica para contar usuários ativos
    // Por enquanto, assume que está dentro do limite
    return this.isTenantActive();
  }

  /**
   * Verifica se tem espaço de armazenamento disponível
   * @param requiredBytes - Bytes necessários
   */
  hasStorageSpace(requiredBytes: number): boolean {
    return this.storageUsed + requiredBytes <= this.storageLimit;
  }

  /**
   * Atualiza o uso de armazenamento
   * @param bytes - Bytes adicionados (positivo) ou removidos (negativo)
   */
  updateStorageUsage(bytes: number): void {
    this.storageUsed = Math.max(0, this.storageUsed + bytes);
  }

  /**
   * Atualiza configurações customizadas
   * @param settings - Novas configurações
   */
  updateCustomSettings(settings: Record<string, any>): void {
    this.customSettings = {
      ...this.customSettings,
      ...settings,
    };
  }
}
