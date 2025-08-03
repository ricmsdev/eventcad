import {
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity as TypeOrmBaseEntity,
} from 'typeorm';

/**
 * Entidade base para todas as entidades do EventCAD+
 * Inclui campos de auditoria padrão e funcionalidades comuns
 *
 * Funcionalidades incluídas:
 * - ID único UUID
 * - Timestamps de criação, atualização e soft delete
 * - Tenant ID para multi-tenancy
 * - Campos de auditoria (quem criou/modificou)
 * - Soft delete automático
 */
export abstract class BaseEntity extends TypeOrmBaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data de criação do registro',
  })
  createdAt: Date;

  @UpdateDateColumn({
    type: 'timestamp with time zone',
    default: () => 'CURRENT_TIMESTAMP',
    comment: 'Data da última atualização do registro',
  })
  updatedAt: Date;

  @DeleteDateColumn({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de soft delete do registro',
  })
  deletedAt?: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'ID do tenant para isolamento multi-tenant',
  })
  tenantId: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que criou o registro',
  })
  createdBy?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que fez a última atualização',
  })
  updatedBy?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais em formato JSON',
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se o registro está ativo',
  })
  isActive: boolean;

  /**
   * Construtor que inicializa campos padrão
   */
  constructor() {
    super();
    this.isActive = true;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Atualiza os metadados do registro
   * @param metadata - Objeto com metadados a serem adicionados/atualizados
   */
  updateMetadata(metadata: Record<string, any>): void {
    this.metadata = {
      ...this.metadata,
      ...metadata,
    };
  }

  /**
   * Marca o registro como inativo (soft disable)
   * @param userId - ID do usuário que está desativando
   */
  deactivate(userId?: string): void {
    this.isActive = false;
    this.updatedBy = userId;
    this.updatedAt = new Date();
  }

  /**
   * Marca o registro como ativo
   * @param userId - ID do usuário que está ativando
   */
  activate(userId?: string): void {
    this.isActive = true;
    this.updatedBy = userId;
    this.updatedAt = new Date();
  }
}
