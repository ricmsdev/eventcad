import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Checklist } from './checklist.entity';
import { User } from '../../auth/entities/user.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  PAUSED = 'paused',
  FAILED = 'failed',
}

export enum ExecutionResult {
  PASSED = 'passed',
  FAILED = 'failed',
  PARTIAL = 'partial',
  SKIPPED = 'skipped',
  CANCELLED = 'cancelled',
}

/**
 * Entidade ChecklistExecution - Execuções de checklists
 *
 * Funcionalidades:
 * - Registro de execuções de checklists
 * - Controle de status e progresso
 * - Resultados e pontuações
 * - Histórico de execuções
 * - Validações e aprovações
 */
@Entity('checklist_executions')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'checklistId'])
@Index(['tenantId', 'executedBy'])
@Index(['tenantId', 'startedAt'])
@Index(['status', 'result'])
// @Index(['dueDate', 'status']) // Removido - coluna dueDate não existe
export class ChecklistExecution extends BaseEntity {
  @Column({
    type: 'uuid',
    comment: 'ID do checklist executado',
  })
  checklistId: string;

  @ManyToOne(() => Checklist, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist?: Checklist;

  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
    comment: 'Status da execução',
  })
  status: ExecutionStatus;

  @Column({
    type: 'enum',
    enum: ExecutionResult,
    nullable: true,
    comment: 'Resultado da execução',
  })
  result?: ExecutionResult;

  @Column({
    type: 'timestamp',
    comment: 'Data/hora de início da execução',
  })
  startedAt: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de conclusão da execução',
  })
  completedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de pausa da execução',
  })
  pausedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de retomada da execução',
  })
  resumedAt?: Date;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Duração total em segundos',
  })
  duration: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação final da execução',
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
    type: 'int',
    default: 0,
    comment: 'Número total de itens',
  })
  totalItems: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de itens completados',
  })
  completedItems: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de itens aprovados',
  })
  passedItems: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de itens reprovados',
  })
  failedItems: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de itens pulados',
  })
  skippedItems: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações da execução',
  })
  notes?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Localização da execução',
  })
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    address?: string;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Anexos da execução',
  })
  attachments?: {
    id: string;
    filename: string;
    type: string;
    size: number;
    url: string;
    uploadedAt: Date;
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
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de execução dos itens',
  })
  itemExecutions?: {
    itemId: string;
    value?: any;
    comment?: string;
    attachments?: string[];
    location?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
    };
    signature?: string;
    skipped?: boolean;
    score?: number;
    maxScore?: number;
    completedAt?: Date;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de validação',
  })
  validationSettings?: {
    requiresPhotos?: boolean;
    requiresSignature?: boolean;
    requiresLocation?: boolean;
    allowsSkip?: boolean;
    photoQuality?: 'low' | 'medium' | 'high';
    locationAccuracy?: number;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de aprovação',
  })
  approvalSettings?: {
    requiresApproval?: boolean;
    autoApprove?: boolean;
    approvalThreshold?: number;
    approvers?: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de mudanças de status',
  })
  statusHistory?: {
    status: ExecutionStatus;
    timestamp: Date;
    changedBy: string;
    reason?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados de performance',
  })
  performanceData?: {
    loadTime?: number;
    responseTime?: number;
    memoryUsage?: number;
    networkRequests?: number;
    errors?: string[];
  };

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
  };

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
    comment: 'ID do executor',
  })
  executedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'executedBy' })
  executor?: User;

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
   * Verifica se a execução está ativa
   */
  isExecutionActive(): boolean {
    return [
      ExecutionStatus.PENDING,
      ExecutionStatus.IN_PROGRESS,
      ExecutionStatus.PAUSED,
    ].includes(this.status);
  }

  /**
   * Verifica se a execução foi aprovada
   */
  isApproved(): boolean {
    return this.result === ExecutionResult.PASSED;
  }

  /**
   * Verifica se a execução foi reprovada
   */
  isFailed(): boolean {
    return this.result === ExecutionResult.FAILED;
  }

  /**
   * Calcula o progresso da execução
   */
  calculateProgress(): number {
    if (this.totalItems === 0) return 0;
    return Math.round((this.completedItems / this.totalItems) * 100);
  }

  /**
   * Calcula a pontuação percentual
   */
  calculateScorePercentage(): number {
    if (!this.score || !this.maxScore || this.maxScore === 0) return 0;
    return Math.round((this.score / this.maxScore) * 100);
  }

  /**
   * Verifica se a execução passou na pontuação mínima
   */
  passedMinimumScore(): boolean {
    if (!this.score || !this.passingScore) return false;
    return this.score >= this.passingScore;
  }

  /**
   * Inicia a execução
   */
  start(executedBy: string): void {
    this.status = ExecutionStatus.IN_PROGRESS;
    this.startedAt = new Date();
    this.executedBy = executedBy;
    this.addStatusChange(ExecutionStatus.IN_PROGRESS, executedBy, 'Execução iniciada');
  }

  /**
   * Pausa a execução
   */
  pause(pausedBy: string, reason?: string): void {
    this.status = ExecutionStatus.PAUSED;
    this.pausedAt = new Date();
    this.addStatusChange(ExecutionStatus.PAUSED, pausedBy, reason || 'Execução pausada');
  }

  /**
   * Retoma a execução
   */
  resume(resumedBy: string): void {
    this.status = ExecutionStatus.IN_PROGRESS;
    this.resumedAt = new Date();
    this.addStatusChange(ExecutionStatus.IN_PROGRESS, resumedBy, 'Execução retomada');
  }

  /**
   * Completa a execução
   */
  complete(completedBy: string, score?: number, notes?: string): void {
    this.status = ExecutionStatus.COMPLETED;
    this.completedAt = new Date();
    this.duration = this.calculateDuration();
    
    if (score !== undefined) {
      this.score = score;
    }

    if (notes) {
      this.notes = notes;
    }

    // Determinar resultado baseado na pontuação
    if (this.score !== undefined && this.passingScore !== undefined) {
      this.result = this.score >= this.passingScore 
        ? ExecutionResult.PASSED 
        : ExecutionResult.FAILED;
    } else {
      this.result = ExecutionResult.PARTIAL;
    }

    this.addStatusChange(ExecutionStatus.COMPLETED, completedBy, 'Execução completada');
  }

  /**
   * Cancela a execução
   */
  cancel(cancelledBy: string, reason?: string): void {
    this.status = ExecutionStatus.CANCELLED;
    this.result = ExecutionResult.CANCELLED;
    this.addStatusChange(ExecutionStatus.CANCELLED, cancelledBy, reason || 'Execução cancelada');
  }

  /**
   * Aprova a execução
   */
  approve(approvedBy: string, notes?: string): void {
    this.approvedBy = approvedBy;
    this.approvedAt = new Date();
    this.approvalNotes = notes;
  }

  /**
   * Revisa a execução
   */
  review(reviewedBy: string, notes?: string): void {
    this.reviewedBy = reviewedBy;
    this.reviewedAt = new Date();
    this.reviewNotes = notes;
  }

  /**
   * Adiciona mudança de status ao histórico
   */
  private addStatusChange(status: ExecutionStatus, changedBy: string, reason?: string): void {
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
   * Calcula a duração total em segundos
   */
  private calculateDuration(): number {
    if (!this.startedAt) return 0;

    const endTime = this.completedAt || new Date();
    return Math.floor((endTime.getTime() - this.startedAt.getTime()) / 1000);
  }

  /**
   * Adiciona execução de item
   */
  addItemExecution(itemExecution: any): void {
    if (!this.itemExecutions) {
      this.itemExecutions = [];
    }

    this.itemExecutions.push(itemExecution);
    this.completedItems++;

    if (itemExecution.skipped) {
      this.skippedItems++;
    } else if (itemExecution.score !== undefined) {
      if (itemExecution.score >= (itemExecution.maxScore || 0)) {
        this.passedItems++;
      } else {
        this.failedItems++;
      }
    }
  }

  /**
   * Exporta execução para relatório
   */
  exportForReport(): any {
    return {
      id: this.id,
      checklistId: this.checklistId,
      status: this.status,
      result: this.result,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      score: this.score,
      maxScore: this.maxScore,
      passingScore: this.passingScore,
      totalItems: this.totalItems,
      completedItems: this.completedItems,
      passedItems: this.passedItems,
      failedItems: this.failedItems,
      skippedItems: this.skippedItems,
      progress: this.calculateProgress(),
      scorePercentage: this.calculateScorePercentage(),
      passedMinimumScore: this.passedMinimumScore(),
      notes: this.notes,
      location: this.location,
      attachments: this.attachments?.length || 0,
      hasSignature: !!this.signature,
      executor: this.executor ? {
        id: this.executor.id,
        name: this.executor.email,
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
   * Valida dados da execução
   */
  validate(): string[] {
    const errors: string[] = [];

    if (!this.checklistId) {
      errors.push('ID do checklist é obrigatório');
    }

    if (!this.executedBy) {
      errors.push('Executor é obrigatório');
    }

    if (!this.startedAt) {
      errors.push('Data de início é obrigatória');
    }

    if (this.completedAt && this.startedAt && this.completedAt < this.startedAt) {
      errors.push('Data de conclusão não pode ser anterior à data de início');
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

    return errors;
  }
} 