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
import { InfraObject } from '../../infra-object/entities/infra-object.entity';
import { User } from '../../auth/entities/user.entity';
import { ChecklistItem } from './checklist-item.entity';
import { ChecklistExecution } from './checklist-execution.entity';
import { ChecklistValidation } from './checklist-validation.entity';

export enum ChecklistStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
  PENDING_APPROVAL = 'pending_approval',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum ChecklistType {
  INSPECTION = 'inspection',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety',
  MAINTENANCE = 'maintenance',
  QUALITY = 'quality',
  CUSTOM = 'custom',
}

export enum ChecklistPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ChecklistFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
  ON_DEMAND = 'on_demand',
  CUSTOM = 'custom',
}

/**
 * Entidade Checklist - Sistema avançado de listas de verificação
 *
 * Funcionalidades:
 * - Templates reutilizáveis de checklists
 * - Execução programada e manual
 * - Validação automática e manual
 * - Integração com objetos de infraestrutura
 * - Sistema de aprovação e workflow
 * - Relatórios e analytics
 * - Compliance e auditoria
 */
@Entity('checklists')
@Index(['tenantId', 'status'])
@Index(['type', 'tenantId'])
@Index(['plantaId', 'status'])
@Index(['assignedTo', 'status'])
@Index(['priority', 'dueDate'])
@Index(['templateId', 'tenantId'])
export class Checklist extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: 'Nome do checklist',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada',
  })
  description?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Código único do checklist',
  })
  code: string;

  // Classificação e tipo
  @Column({
    type: 'enum',
    enum: ChecklistType,
    default: ChecklistType.INSPECTION,
    comment: 'Tipo do checklist',
  })
  type: ChecklistType;

  @Column({
    type: 'enum',
    enum: ChecklistStatus,
    default: ChecklistStatus.DRAFT,
    comment: 'Status atual',
  })
  status: ChecklistStatus;

  @Column({
    type: 'enum',
    enum: ChecklistPriority,
    default: ChecklistPriority.MEDIUM,
    comment: 'Prioridade de execução',
  })
  priority: ChecklistPriority;

  // Relacionamentos principais
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
    nullable: false,
    comment: 'ID do usuário responsável',
  })
  assignedTo: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assignedTo' })
  assignee?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do template base (referência externa)',
  })
  templateId?: string;

  // Configuração de execução
  @Column({
    type: 'enum',
    enum: ChecklistFrequency,
    default: ChecklistFrequency.ON_DEMAND,
    comment: 'Frequência de execução',
  })
  frequency: ChecklistFrequency;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Intervalo personalizado em dias',
  })
  customInterval?: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de vencimento',
  })
  dueDate?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da última execução',
  })
  lastExecutedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da próxima execução programada',
  })
  nextExecutionAt?: Date | null;

  // Propriedades de aprovação
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que aprovou',
  })
  approvedBy?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de aprovação',
  })
  approvedAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que rejeitou',
  })
  rejectedBy?: string;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de rejeição',
  })
  rejectedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Motivo da rejeição',
  })
  rejectionReason?: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação final',
  })
  score?: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de conclusão',
  })
  completedAt?: Date;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se deve agendar próxima execução',
  })
  shouldScheduleNext: boolean;

  // Configurações de validação
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se requer aprovação após execução',
  })
  requiresApproval: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se permite execução parcial',
  })
  allowPartialExecution: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite comentários nos itens',
  })
  allowComments: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite anexos',
  })
  allowAttachments: boolean;

  @Column({
    type: 'int',
    default: 100,
    comment: 'Pontuação mínima para aprovação (%)',
  })
  minimumScore: number;

  // Objetos de infraestrutura relacionados
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'IDs dos objetos de infraestrutura relacionados',
  })
  relatedInfraObjectIds?: string[];

  @ManyToMany(() => InfraObject)
  @JoinTable({
    name: 'checklist_infra_objects',
    joinColumn: { name: 'checklistId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'infraObjectId', referencedColumnName: 'id' },
  })
  relatedInfraObjects?: InfraObject[];

  // Configurações de compliance
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Padrões de compliance aplicáveis',
  })
  complianceStandards?: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Regras específicas de compliance',
  })
  complianceRules?: {
    standard: string;
    rule: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  }[];

  // Configurações de workflow
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração do workflow de aprovação',
  })
  approvalWorkflow?: {
    steps: {
      order: number;
      role: string;
      action: 'approve' | 'review' | 'validate';
      required: boolean;
      timeout?: number; // em horas
    }[];
    autoEscalate: boolean;
    escalationRole?: string;
  };

  // Configurações de notificação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificação',
  })
  notificationSettings?: {
    onDue: boolean;
    onOverdue: boolean;
    onCompletion: boolean;
    onApproval: boolean;
    recipients: string[];
    channels: ('email' | 'sms' | 'push' | 'webhook')[];
  };

  // Metadados e configurações
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do tipo',
  })
  typeSpecificConfig?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Tags e categorização',
  })
  tags?: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de exportação',
  })
  exportConfig?: {
    formats: string[];
    includeAttachments: boolean;
    includeComments: boolean;
    includeHistory: boolean;
  };

  // Relacionamentos
  @OneToMany(() => ChecklistItem, (item) => item.checklist, {
    cascade: true,
  })
  items?: ChecklistItem[];

  @OneToMany(() => ChecklistExecution, (execution) => execution.checklist)
  executions?: ChecklistExecution[];

  @OneToMany(() => ChecklistValidation, (validation) => validation.checklist)
  validations?: ChecklistValidation[];

  // Métodos de negócio
  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate;
  }

  get isDueSoon(): boolean {
    if (!this.dueDate) return false;
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return this.dueDate <= threeDaysFromNow;
  }

  get totalItems(): number {
    return this.items?.length || 0;
  }

  get completedItems(): number {
    return this.items?.filter(item => item.isCompleted)?.length || 0;
  }

  get completionPercentage(): number {
    if (this.totalItems === 0) return 0;
    return Math.round((this.completedItems / this.totalItems) * 100);
  }

  get isFullyCompleted(): boolean {
    return this.completionPercentage >= this.minimumScore;
  }

  get canBeExecuted(): boolean {
    return this.status === ChecklistStatus.ACTIVE;
  }

  get requiresManualApproval(): boolean {
    return this.requiresApproval && this.isFullyCompleted;
  }

  // Métodos de atualização
  updateStatus(newStatus: ChecklistStatus, updatedBy: string): void {
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  scheduleNextExecution(): void {
    if (this.frequency === ChecklistFrequency.ON_DEMAND) {
      this.nextExecutionAt = null;
      return;
    }

    const now = new Date();
    let nextDate = new Date(now);

    switch (this.frequency) {
      case ChecklistFrequency.DAILY:
        nextDate.setDate(nextDate.getDate() + 1);
        break;
      case ChecklistFrequency.WEEKLY:
        nextDate.setDate(nextDate.getDate() + 7);
        break;
      case ChecklistFrequency.MONTHLY:
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case ChecklistFrequency.QUARTERLY:
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case ChecklistFrequency.SEMI_ANNUAL:
        nextDate.setMonth(nextDate.getMonth() + 6);
        break;
      case ChecklistFrequency.ANNUAL:
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
      case ChecklistFrequency.CUSTOM:
        if (this.customInterval) {
          nextDate.setDate(nextDate.getDate() + this.customInterval);
        }
        break;
    }

    this.nextExecutionAt = nextDate;
  }

  markAsExecuted(executedBy: string): void {
    this.lastExecutedAt = new Date();
    this.updatedAt = new Date();
    this.scheduleNextExecution();
  }

  addRelatedInfraObject(infraObjectId: string): void {
    if (!this.relatedInfraObjectIds) {
      this.relatedInfraObjectIds = [];
    }
    if (!this.relatedInfraObjectIds.includes(infraObjectId)) {
      this.relatedInfraObjectIds.push(infraObjectId);
    }
  }

  removeRelatedInfraObject(infraObjectId: string): void {
    if (this.relatedInfraObjectIds) {
      this.relatedInfraObjectIds = this.relatedInfraObjectIds.filter(
        id => id !== infraObjectId
      );
    }
  }
} 