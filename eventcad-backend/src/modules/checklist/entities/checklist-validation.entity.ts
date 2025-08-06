import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Checklist } from './checklist.entity';
import { User } from '../../auth/entities/user.entity';

export enum ValidationStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  CANCELLED = 'cancelled',
}

export enum ValidationType {
  TECHNICAL = 'technical',
  SAFETY = 'safety',
  QUALITY = 'quality',
  COMPLIANCE = 'compliance',
  OPERATIONAL = 'operational',
  CUSTOM = 'custom',
}

export enum ValidationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Entidade ChecklistValidation - Validações de checklists
 *
 * Funcionalidades:
 * - Validações técnicas e de segurança
 * - Workflow de aprovação
 * - Controle de qualidade
 * - Auditoria e compliance
 * - Histórico de validações
 */
@Entity('checklist_validations')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'checklistId'])
@Index(['tenantId', 'validatorId'])
@Index(['tenantId', 'type'])
@Index(['tenantId', 'priority'])
@Index(['status', 'priority'])
@Index(['dueDate', 'status'])
export class ChecklistValidation extends BaseEntity {
  @Column({
    type: 'uuid',
    comment: 'ID do checklist validado',
  })
  checklistId: string;

  @ManyToOne(() => Checklist, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist?: Checklist;

  @Column({
    type: 'enum',
    enum: ValidationType,
    default: ValidationType.TECHNICAL,
    comment: 'Tipo de validação',
  })
  type: ValidationType;

  @Column({
    type: 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.PENDING,
    comment: 'Status da validação',
  })
  status: ValidationStatus;

  @Column({
    type: 'enum',
    enum: ValidationPriority,
    default: ValidationPriority.MEDIUM,
    comment: 'Prioridade da validação',
  })
  priority: ValidationPriority;

  @Column({
    type: 'varchar',
    length: 255,
    comment: 'Título da validação',
  })
  title: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição da validação',
  })
  description?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Critérios de validação',
  })
  criteria?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de validação',
  })
  validationConfig?: {
    requiredFields?: string[];
    minScore?: number;
    maxScore?: number;
    passingScore?: number;
    timeLimit?: number;
    retries?: number;
    autoApprove?: boolean;
    requiresSignature?: boolean;
    requiresPhotos?: boolean;
    requiresLocation?: boolean;
  };

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação da validação',
  })
  score?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação máxima possível',
  })
  maxScore?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação mínima para aprovação',
  })
  passingScore?: number;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Validação aprovada',
  })
  isApproved: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações da validação',
  })
  notes?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultados detalhados',
  })
  results?: {
    passed?: boolean;
    score?: number;
    maxScore?: number;
    criteria?: {
      name: string;
      passed: boolean;
      score?: number;
      notes?: string;
    }[];
    issues?: {
      type: string;
      severity: string;
      description: string;
      recommendation?: string;
    }[];
    recommendations?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Anexos da validação',
  })
  attachments?: {
    id: string;
    filename: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
    description?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Assinatura digital',
  })
  signature?: {
    data: string;
    timestamp: Date;
    signer: string;
    ipAddress?: string;
    userAgent?: string;
  };

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de início da validação',
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de conclusão da validação',
  })
  completedAt?: Date;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Duração em segundos',
  })
  duration: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de tentativas',
  })
  attempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora limite para validação',
  })
  dueDate?: Date;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Validação está vencida',
  })
  isOverdue: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificação',
  })
  notificationSettings?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    recipients?: string[];
    templates?: {
      email?: string;
      push?: string;
      sms?: string;
    };
    reminderDays?: number[];
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
    escalations?: {
      condition: string;
      action: string;
      recipients: string[];
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de mudanças de status',
  })
  statusHistory?: {
    status: ValidationStatus;
    timestamp: Date;
    changedBy: string;
    reason?: string;
    notes?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de auditoria',
  })
  auditData?: {
    ipAddress?: string;
    userAgent?: string;
    deviceInfo?: {
      type: string;
      os: string;
      browser: string;
      version: string;
    };
    sessionId?: string;
    loginTime?: Date;
    actions?: {
      action: string;
      timestamp: Date;
      details?: any;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de integração',
  })
  integrationData?: {
    externalId?: string;
    system?: string;
    syncStatus?: 'pending' | 'synced' | 'failed';
    lastSync?: Date;
    webhooks?: {
      url: string;
      status: 'pending' | 'sent' | 'failed';
      response?: any;
      retries?: number;
    }[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de relatório',
  })
  reportData?: {
    generated?: boolean;
    format?: string;
    url?: string;
    generatedAt?: Date;
    sections?: string[];
    charts?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de backup',
  })
  backupData?: {
    backedUp?: boolean;
    backupId?: string;
    backupLocation?: string;
    backupAt?: Date;
    retention?: number;
  };

  // Relacionamentos

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do validador',
  })
  validatorId?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'validatorId' })
  validator?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do aprovador',
  })
  approvedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'approvedBy' })
  approver?: User;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora da aprovação',
  })
  approvedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comentário da aprovação',
  })
  approvalNotes?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do revisor',
  })
  reviewedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'reviewedBy' })
  reviewer?: User;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora da revisão',
  })
  reviewedAt?: Date;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comentário da revisão',
  })
  reviewNotes?: string;

  // Métodos de negócio

  /**
   * Verifica se a validação está ativa
   */
  isValidationActive(): boolean {
    return [
      ValidationStatus.PENDING,
      ValidationStatus.IN_PROGRESS,
    ].includes(this.status);
  }

  /**
   * Verifica se a validação foi aprovada
   */
  isValidationApproved(): boolean {
    return this.status === ValidationStatus.APPROVED;
  }

  /**
   * Verifica se a validação foi reprovada
   */
  isValidationRejected(): boolean {
    return this.status === ValidationStatus.REJECTED;
  }

  /**
   * Verifica se a validação está vencida
   */
  isValidationOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate && this.status !== ValidationStatus.COMPLETED;
  }

  /**
   * Calcula a pontuação percentual
   */
  calculateScorePercentage(): number {
    if (!this.score || !this.maxScore || this.maxScore === 0) return 0;
    return Math.round((this.score / this.maxScore) * 100);
  }

  /**
   * Verifica se a validação passou na pontuação mínima
   */
  passedMinimumScore(): boolean {
    if (!this.score || !this.passingScore) return false;
    return this.score >= this.passingScore;
  }

  /**
   * Inicia a validação
   */
  start(validatorId: string): void {
    this.status = ValidationStatus.IN_PROGRESS;
    this.validatorId = validatorId;
    this.startedAt = new Date();
    this.attempts++;
    this.addStatusChange(ValidationStatus.IN_PROGRESS, validatorId, 'Validação iniciada');
  }

  /**
   * Completa a validação
   */
  complete(completedBy: string, score?: number, notes?: string): void {
    this.status = ValidationStatus.COMPLETED;
    this.completedAt = new Date();
    this.duration = this.calculateDuration();
    
    if (score !== undefined) {
      this.score = score;
    }

    if (notes) {
      this.notes = notes;
    }

    // Determinar se foi aprovada baseado na pontuação
    if (this.score !== undefined && this.passingScore !== undefined) {
      this.isApproved = this.score >= this.passingScore;
    }

    this.addStatusChange(ValidationStatus.COMPLETED, completedBy, 'Validação completada');
  }

  /**
   * Aprova a validação
   */
  approve(approvedBy: string, notes?: string): void {
    this.status = ValidationStatus.APPROVED;
    this.isApproved = true;
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
    this.addStatusChange(ValidationStatus.APPROVED, approvedBy, notes || 'Validação aprovada');
  }

  /**
   * Rejeita a validação
   */
  reject(rejectedBy: string, reason?: string): void {
    this.status = ValidationStatus.REJECTED;
    this.isApproved = false;
    this.addStatusChange(ValidationStatus.REJECTED, rejectedBy, reason || 'Validação rejeitada');
  }

  /**
   * Cancela a validação
   */
  cancel(cancelledBy: string, reason?: string): void {
    this.status = ValidationStatus.CANCELLED;
    this.addStatusChange(ValidationStatus.CANCELLED, cancelledBy, reason || 'Validação cancelada');
  }

  /**
   * Revisa a validação
   */
  review(reviewedBy: string, notes?: string): void {
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
  }

  /**
   * Adiciona resultado detalhado
   */
  addResult(result: any): void {
    if (!this.results) {
      this.results = {};
    }

    Object.assign(this.results, result);
  }

  /**
   * Adiciona anexo
   */
  addAttachment(attachment: any): void {
    if (!this.attachments) {
      this.attachments = [];
    }

    this.attachments.push({
      ...attachment,
      uploadedAt: new Date(),
    });
  }

  /**
   * Adiciona mudança de status ao histórico
   */
  private addStatusChange(status: ValidationStatus, changedBy: string, reason?: string): void {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }

    this.statusHistory.push({
      status,
      timestamp: new Date(),
      changedBy,
      reason,
    });
  }

  /**
   * Calcula a duração em segundos
   */
  private calculateDuration(): number {
    if (!this.startedAt) return 0;

    const endTime = this.completedAt || new Date();
    return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 1000);
  }

  /**
   * Exporta validação para relatório
   */
  exportForReport(): any {
    return {
      id: this.id,
      checklistId: this.checklistId,
      type: this.type,
      status: this.status,
      priority: this.priority,
      title: this.title,
      score: this.score,
      maxScore: this.maxScore,
      passingScore: this.passingScore,
      isApproved: this.isApproved,
      scorePercentage: this.calculateScorePercentage(),
      passedMinimumScore: this.passedMinimumScore(),
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      attempts: this.attempts,
      dueDate: this.dueDate,
      isOverdue: this.isValidationOverdue(),
      notes: this.notes,
      attachments: this.attachments?.length || 0,
      hasSignature: !!this.signature,
      validator: this.validator ? {
        id: this.validator.id,
        name: this.validator.email,
      } : null,
      approver: this.approver ? {
        id: this.approver.id,
        name: this.approver.email,
      } : null,
      approvedAt: this.approvedAt,
      reviewer: this.reviewer ? {
        id: this.reviewer.id,
        name: this.reviewer.email,
      } : null,
      reviewedAt: this.reviewedAt,
    };
  }

  /**
   * Valida dados da validação
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.checklistId) {
      errors.push('ID do checklist é obrigatório');
    }

    if (!this.title || this.title.trim().length === 0) {
      errors.push('Título da validação é obrigatório');
    }

    if (this.score !== undefined && this.score < 0) {
      errors.push('Pontuação não pode ser negativa');
    }

    if (this.maxScore !== undefined && this.maxScore <= 0) {
      errors.push('Pontuação máxima deve ser maior que zero');
    }

    if (this.score !== undefined && this.maxScore !== undefined && this.score > this.maxScore) {
      errors.push('Pontuação não pode ser maior que a pontuação máxima');
    }

    if (this.completedAt && this.startedAt && this.completedAt < this.startedAt) {
      errors.push('Data de conclusão não pode ser anterior à data de início');
    }

    return errors;
  }
} 