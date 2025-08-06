import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Planta } from '../../planta/entities/planta.entity';
import { User } from '../../auth/entities/user.entity';

export enum TemplateStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum TemplateCategory {
  INSPECTION = 'inspection',
  MAINTENANCE = 'maintenance',
  SAFETY = 'safety',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  CUSTOM = 'custom',
}

/**
 * Entidade ChecklistTemplate - Templates reutilizáveis de checklists
 *
 * Funcionalidades:
 * - Templates base para criação de checklists
 * - Reutilização de configurações comuns
 * - Versionamento de templates
 * - Categorização e organização
 * - Configurações padrão para diferentes tipos
 */
@Entity('checklist_templates')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'category'])
@Index(['tenantId', 'isPublic'])
@Index(['code', 'tenantId'])
export class ChecklistTemplate extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Nome do template',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição do template',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
    comment: 'Código único do template',
  })
  code: string;

  @Column({
    type: 'enum',
    enum: TemplateCategory,
    default: TemplateCategory.CUSTOM,
    comment: 'Categoria do template',
  })
  category: TemplateCategory;

  @Column({
    type: 'enum',
    enum: TemplateStatus,
    default: TemplateStatus.DRAFT,
    comment: 'Status do template',
  })
  status: TemplateStatus;

  @Column({
    type: 'int',
    default: 1,
    comment: 'Versão do template',
  })
  version: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Template é público',
  })
  isPublic: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações padrão do template',
  })
  defaultSettings?: {
    priority?: string;
    frequency?: string;
    estimatedDuration?: number;
    notificationSettings?: {
      email?: boolean;
      push?: boolean;
      sms?: boolean;
      reminderDays?: number[];
    };
    approvalSettings?: {
      requiresApproval?: boolean;
      autoApprove?: boolean;
      approvalThreshold?: number;
    };
    scoringSettings?: {
      enabled?: boolean;
      maxScore?: number;
      passingScore?: number;
      weightByPriority?: boolean;
    };
    validationSettings?: {
      requiresPhotos?: boolean;
      requiresSignature?: boolean;
      requiresLocation?: boolean;
      allowsSkip?: boolean;
    };
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados do template',
  })
  templateMetadata?: {
    industry?: string;
    equipment?: string[];
    standards?: string[];
    tags?: string[];
    complexity?: 'simple' | 'medium' | 'complex';
    estimatedTime?: number;
    requiredSkills?: string[];
    certifications?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de workflow',
  })
  workflowConfig?: {
    steps?: {
      name: string;
      order: number;
      required: boolean;
      assignee?: string;
      estimatedTime?: number;
    }[];
    approvals?: {
      level: number;
      role: string;
      required: boolean;
    }[];
    notifications?: {
      event: string;
      recipients: string[];
      template: string;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de integração',
  })
  integrationConfig?: {
    systems?: string[];
    webhooks?: {
      url: string;
      events: string[];
      headers?: Record<string, string>;
    }[];
    apiEndpoints?: {
      method: string;
      url: string;
      headers?: Record<string, string>;
      body?: any;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de relatórios',
  })
  reportConfig?: {
    templates?: {
      name: string;
      format: string;
      sections: string[];
    }[];
    schedules?: {
      frequency: string;
      recipients: string[];
      format: string;
    }[];
    analytics?: {
      metrics: string[];
      charts: string[];
      dashboards: string[];
    };
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de segurança',
  })
  securityConfig?: {
    roles?: string[];
    permissions?: string[];
    ipWhitelist?: string[];
    auditLog?: boolean;
    encryption?: {
      enabled: boolean;
      algorithm: string;
    };
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de performance',
  })
  performanceConfig?: {
    cache?: {
      enabled: boolean;
      ttl: number;
    };
    compression?: {
      enabled: boolean;
      algorithm: string;
    };
    optimization?: {
      lazyLoading: boolean;
      pagination: boolean;
      indexing: boolean;
    };
  };

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de vezes que o template foi usado',
  })
  usageCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da última utilização',
  })
  lastUsedAt?: Date;

  @Column({
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0,
    comment: 'Avaliação média do template',
  })
  averageRating: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de avaliações',
  })
  ratingCount: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de versões',
  })
  versionHistory?: {
    version: number;
    changes: string[];
    date: Date;
    author: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de backup',
  })
  backupConfig?: {
    frequency: string;
    retention: number;
    location: string;
    encryption: boolean;
  };

  // Relacionamentos

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID da planta associada',
  })
  plantaId?: string;

  @ManyToOne(() => Planta, { eager: false })
  @JoinColumn({ name: 'plantaId' })
  planta?: Planta;

  @Column({
    type: 'uuid',
    comment: 'ID do criador do template',
  })
  templateCreatedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do último modificador',
  })
  lastModifiedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'lastModifiedBy' })
  lastModifier?: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'checklist_template_favorites',
    joinColumn: { name: 'templateId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  favoritedBy?: User[];

  // Métodos de negócio

  /**
   * Verifica se o template está ativo
   */
  isTemplateActive(): boolean {
    return this.status === TemplateStatus.ACTIVE && this.isPublic;
  }

  /**
   * Incrementa o contador de uso
   */
  incrementUsage(): void {
    this.usageCount++;
    this.lastUsedAt = new Date();
  }

  /**
   * Adiciona uma avaliação
   */
  addRating(rating: number): void {
    const totalRating = this.averageRating * this.ratingCount + rating;
    this.ratingCount++;
    this.averageRating = totalRating / this.ratingCount;
  }

  /**
   * Cria nova versão do template
   */
  createNewVersion(changes: string[], author: string): void {
    if (!this.versionHistory) {
      this.versionHistory = [];
    }

    this.versionHistory.push({
      version: this.version,
      changes,
      date: new Date(),
      author,
    });

    this.version++;
  }

  /**
   * Exporta template para relatório
   */
  exportForReport(): any {
    return {
      id: this.id,
      name: this.name,
      code: this.code,
      category: this.category,
      status: this.status,
      version: this.version,
      isPublic: this.isPublic,
      usageCount: this.usageCount,
      averageRating: this.averageRating,
      ratingCount: this.ratingCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      planta: this.planta ? {
        id: this.planta.id,
        name: this.planta.originalName,
      } : null,
      createdBy: this.createdByUser ? {
        id: this.createdByUser.id,
        name: this.createdByUser.email,
      } : null,
    };
  }

  /**
   * Valida configurações do template
   */
  validateConfig(): string[] {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Nome do template é obrigatório');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Código do template é obrigatório');
    }

    if (this.isPublic && !this.description) {
      errors.push('Templates públicos devem ter descrição');
    }

    if (this.defaultSettings?.estimatedDuration && this.defaultSettings.estimatedDuration <= 0) {
      errors.push('Duração estimada deve ser maior que zero');
    }

    if (this.defaultSettings?.scoringSettings?.maxScore && 
        this.defaultSettings.scoringSettings.maxScore <= 0) {
      errors.push('Pontuação máxima deve ser maior que zero');
    }

    return errors;
  }

  /**
   * Clona template para nova versão
   */
  clone(newName: string, newCode: string, createdBy: string): ChecklistTemplate {
    const clone = new ChecklistTemplate();
    
    Object.assign(clone, {
      ...this,
      id: undefined,
      name: newName,
      code: newCode,
      version: 1,
      status: TemplateStatus.DRAFT,
      usageCount: 0,
      averageRating: 0,
      ratingCount: 0,
      lastUsedAt: undefined,
      versionHistory: [],
      createdBy,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return clone;
  }
} 