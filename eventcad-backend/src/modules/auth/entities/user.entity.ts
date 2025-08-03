import { Entity, Column, BeforeInsert, BeforeUpdate, OneToMany } from 'typeorm';
import { Exclude } from 'class-transformer';
import * as bcrypt from 'bcrypt';
import { BaseEntity } from '../../../common/entities/base.entity';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * Entidade User - Representa um usuário do sistema EventCAD+
 * Inclui autenticação, autorização e informações de perfil
 *
 * Funcionalidades:
 * - Autenticação via email/senha com hash bcrypt
 * - Sistema de roles hierárquico (RBAC)
 * - Informações de perfil e contato
 * - Multi-factor authentication (MFA)
 * - Controle de sessões e tokens
 * - Auditoria de acessos
 */
@Entity('users')
export class User extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome completo do usuário',
  })
  fullName: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: false,
    comment: 'Email único do usuário para login',
  })
  email: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Senha hash (bcrypt)',
  })
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.VIEWER,
    comment: 'Role/papel do usuário no sistema',
  })
  role: UserRole;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone de contato',
  })
  phone?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cargo/função do usuário',
  })
  position?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Empresa/organização do usuário',
  })
  company?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'URL da foto do usuário',
  })
  avatar?: string;

  @Column({
    type: 'varchar',
    length: 10,
    default: 'pt-BR',
    comment: 'Idioma preferido do usuário',
  })
  preferredLanguage: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'America/Sao_Paulo',
    comment: 'Timezone do usuário',
  })
  timezone: string;

  // Campos de segurança e autenticação
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se MFA está habilitado',
  })
  mfaEnabled: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Secret para TOTP/Google Authenticator',
  })
  @Exclude({ toPlainOnly: true })
  mfaSecret?: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o email foi verificado',
  })
  emailVerified: boolean;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para verificação de email',
  })
  @Exclude({ toPlainOnly: true })
  emailVerificationToken?: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    comment: 'Token para reset de senha',
  })
  @Exclude({ toPlainOnly: true })
  passwordResetToken?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Expiração do token de reset de senha',
  })
  passwordResetExpires?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Último login do usuário',
  })
  lastLoginAt?: Date;

  @Column({
    type: 'inet',
    nullable: true,
    comment: 'IP do último login',
  })
  lastLoginIp?: string;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Número de tentativas de login falharam',
  })
  loginAttempts: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Bloqueio temporário após muitas tentativas',
  })
  lockedUntil?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações personalizadas do usuário',
  })
  settings?: Record<string, any>;

  /**
   * Hash da senha antes de salvar no banco
   */
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    if (this.password && !this.password.startsWith('$2b$')) {
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  /**
   * Verifica se a senha fornecida está correta
   * @param plainPassword - Senha em texto plano
   * @returns Promise<boolean> - true se a senha está correta
   */
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  /**
   * Verifica se o usuário tem um role específico ou superior
   * @param requiredRole - Role necessário
   * @returns boolean - true se tem permissão
   */
  hasRole(requiredRole: UserRole): boolean {
    // Super admin tem acesso a tudo
    if (this.role === UserRole.SUPER_ADMIN) return true;

    // Verifica se tem o role exato ou superior na hierarquia
    const roleHierarchy = [
      UserRole.VIEWER,
      UserRole.OPERATOR,
      UserRole.TECHNICIAN,
      UserRole.ENGINEER,
      UserRole.SAFETY_OFFICER,
      UserRole.PROJECT_MANAGER,
      UserRole.VENUE_MANAGER,
      UserRole.ADMIN,
    ];

    const userRoleIndex = roleHierarchy.indexOf(this.role);
    const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

    return userRoleIndex >= requiredRoleIndex;
  }

  /**
   * Incrementa tentativas de login e bloqueia se necessário
   */
  incrementLoginAttempts(): void {
    this.loginAttempts += 1;

    // Bloqueia por 30 minutos após 5 tentativas
    if (this.loginAttempts >= 5) {
      this.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
    }
  }

  /**
   * Reset das tentativas de login após sucesso
   */
  resetLoginAttempts(): void {
    this.loginAttempts = 0;
    this.lockedUntil = undefined;
    this.lastLoginAt = new Date();
  }

  /**
   * Verifica se a conta está bloqueada
   */
  isLocked(): boolean {
    return Boolean(this.lockedUntil && this.lockedUntil > new Date());
  }

  /**
   * Atualiza configurações do usuário
   * @param newSettings - Novas configurações
   */
  updateSettings(newSettings: Record<string, any>): void {
    this.settings = {
      ...this.settings,
      ...newSettings,
    };
  }
}
