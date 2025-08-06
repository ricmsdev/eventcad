import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReportTemplate } from './report-template.entity';
import { User } from '../../auth/entities/user.entity';
import { ReportFrequency } from './report-template.entity';

export enum ScheduleStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

/**
 * Entidade ReportSchedule - Agendamento de relatórios
 *
 * Funcionalidades:
 * - Agendamento automático de relatórios
 * - Configuração de frequência e horários
 * - Controle de status e execução
 * - Histórico de agendamentos
 * - Notificações automáticas
 */
@Entity('report_schedules')
@Index(['tenantId', 'status'])
@Index(['templateId', 'status'])
@Index(['createdBy', 'status'])
@Index(['nextExecution', 'status'])
export class ReportSchedule extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do template agendado',
  })
  templateId: string;

  @ManyToOne(() => ReportTemplate, { eager: false })
  @JoinColumn({ name: 'templateId' })
  template?: ReportTemplate;

  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que criou o agendamento',
  })
  createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  createdByUser?: User;

  // Configuração de agendamento
  @Column({
    type: 'enum',
    enum: ReportFrequency,
    nullable: false,
    comment: 'Frequência de execução',
  })
  frequency: ReportFrequency;

  @Column({
    type: 'timestamp',
    nullable: false,
    comment: 'Próxima execução programada',
  })
  nextExecution: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de início do agendamento',
  })
  startDate?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de fim do agendamento',
  })
  endDate?: Date;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Intervalo personalizado em dias',
  })
  customInterval?: number;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Fuso horário',
  })
  timezone?: string;

  // Status e controle
  @Column({
    type: 'enum',
    enum: ScheduleStatus,
    default: ScheduleStatus.ACTIVE,
    comment: 'Status do agendamento',
  })
  status: ScheduleStatus;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se o agendamento está ativo',
  })
  isActive: boolean;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de execuções realizadas',
  })
  executionCount: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de execuções com sucesso',
  })
  successCount: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de execuções com falha',
  })
  failureCount: number;

  // Parâmetros e configuração
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Parâmetros padrão para execução',
  })
  parameters?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração da execução',
  })
  config?: {
    timeout?: number;
    priority?: string;
    format?: string;
    compression?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
  };

  // Configuração de notificação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificação',
  })
  notificationSettings?: {
    onExecution: boolean;
    onSuccess: boolean;
    onFailure: boolean;
    onSchedule: boolean;
    recipients: string[];
    channels: ('email' | 'sms' | 'push' | 'webhook')[];
    templates?: {
      execution?: string;
      success?: string;
      failure?: string;
      schedule?: string;
    };
  };

  // Histórico
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da última execução',
  })
  lastExecutedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da próxima execução calculada',
  })
  calculatedNextExecution?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de execuções',
  })
  executionHistory?: {
    executionId: string;
    executedAt: Date;
    status: string;
    duration?: number;
    error?: string;
  }[];

  // Configuração de retry
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se permite retry em caso de falha',
  })
  allowRetry: boolean;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Número máximo de tentativas',
  })
  maxRetries: number;

  @Column({
    type: 'int',
    default: 300,
    comment: 'Intervalo entre tentativas em segundos',
  })
  retryInterval: number;

  // Configuração de limpeza
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se limpa execuções antigas automaticamente',
  })
  autoCleanup: boolean;

  @Column({
    type: 'int',
    default: 30,
    comment: 'Dias para manter histórico',
  })
  retentionDays: number;

  // Metadados
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição do agendamento',
  })
  description?: string;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Tags para categorização',
  })
  tags?: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais',
  })
  metadata?: Record<string, any>;

  // Métodos de negócio
  get isScheduled(): boolean {
    return this.isActive && this.status === ScheduleStatus.ACTIVE;
  }

  get isPaused(): boolean {
    return this.status === ScheduleStatus.PAUSED;
  }

  get isCancelled(): boolean {
    return this.status === ScheduleStatus.CANCELLED;
  }

  get isCompleted(): boolean {
    return this.status === ScheduleStatus.COMPLETED;
  }

  get isOverdue(): boolean {
    return this.nextExecution && this.nextExecution < new Date() && this.isScheduled;
  }

  get successRate(): number {
    if (this.executionCount === 0) return 0;
    return (this.successCount / this.executionCount) * 100;
  }

  get failureRate(): number {
    if (this.executionCount === 0) return 0;
    return (this.failureCount / this.executionCount) * 100;
  }

  get shouldExecute(): boolean {
    return this.isScheduled && this.nextExecution && this.nextExecution <= new Date();
  }

  get isExpired(): boolean {
    return !!(this.endDate && this.endDate < new Date());
  }

  // Métodos de negócio
  activate(): void {
    this.status = ScheduleStatus.ACTIVE;
    this.isActive = true;
  }

  pause(): void {
    this.status = ScheduleStatus.PAUSED;
    this.isActive = false;
  }

  cancel(): void {
    this.status = ScheduleStatus.CANCELLED;
    this.isActive = false;
  }

  complete(): void {
    this.status = ScheduleStatus.COMPLETED;
    this.isActive = false;
  }

  incrementExecutionCount(success: boolean): void {
    this.executionCount++;
    if (success) {
      this.successCount++;
    } else {
      this.failureCount++;
    }
    this.lastExecutedAt = new Date();
  }

  calculateNextExecution(): void {
    if (!this.isScheduled) return;

    const now = new Date();
    let next: Date;

    switch (this.frequency) {
      case ReportFrequency.DAILY:
        next = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case ReportFrequency.WEEKLY:
        next = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case ReportFrequency.MONTHLY:
        next = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
        break;
      case ReportFrequency.QUARTERLY:
        next = new Date(now.getFullYear(), now.getMonth() + 3, now.getDate());
        break;
      case ReportFrequency.SEMI_ANNUAL:
        next = new Date(now.getFullYear(), now.getMonth() + 6, now.getDate());
        break;
      case ReportFrequency.ANNUAL:
        next = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
        break;
      case ReportFrequency.CUSTOM:
        if (this.customInterval) {
          next = new Date(now.getTime() + this.customInterval * 24 * 60 * 60 * 1000);
        } else {
          next = now;
        }
        break;
      default:
        next = now;
    }

    this.nextExecution = next;
    this.calculatedNextExecution = next;
  }

  addExecutionToHistory(executionId: string, status: string, duration?: number, error?: string): void {
    if (!this.executionHistory) {
      this.executionHistory = [];
    }

    this.executionHistory.push({
      executionId,
      executedAt: new Date(),
      status,
      duration,
      error,
    });

    // Manter apenas os últimos 100 registros
    if (this.executionHistory.length > 100) {
      this.executionHistory = this.executionHistory.slice(-100);
    }
  }

  setParameters(parameters: Record<string, any>): void {
    this.parameters = parameters;
  }

  setConfig(config: any): void {
    this.config = config;
  }

  setNotificationSettings(settings: any): void {
    this.notificationSettings = settings;
  }

  addTag(tag: string): void {
    if (!this.tags) {
      this.tags = [];
    }
    if (!this.tags.includes(tag)) {
      this.tags.push(tag);
    }
  }

  removeTag(tag: string): void {
    if (this.tags) {
      this.tags = this.tags.filter(t => t !== tag);
    }
  }

  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata?.[key];
  }

  validateSchedule(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.templateId) {
      errors.push('Template é obrigatório');
    }

    if (!this.frequency) {
      errors.push('Frequência é obrigatória');
    }

    if (!this.nextExecution) {
      errors.push('Próxima execução é obrigatória');
    }

    if (this.endDate && this.startDate && this.endDate <= this.startDate) {
      errors.push('Data de fim deve ser posterior à data de início');
    }

    if (this.frequency === ReportFrequency.CUSTOM && !this.customInterval) {
      errors.push('Intervalo personalizado é obrigatório para frequência customizada');
    }

    if (this.maxRetries < 0) {
      errors.push('Número máximo de tentativas deve ser maior ou igual a 0');
    }

    if (this.retryInterval < 0) {
      errors.push('Intervalo entre tentativas deve ser maior ou igual a 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  exportForReport(): any {
    return {
      id: this.id,
      templateId: this.templateId,
      frequency: this.frequency,
      nextExecution: this.nextExecution,
      status: this.status,
      isActive: this.isActive,
      executionCount: this.executionCount,
      successCount: this.successCount,
      failureCount: this.failureCount,
      successRate: this.successRate,
      lastExecutedAt: this.lastExecutedAt,
      createdAt: this.createdAt,
    };
  }
} 