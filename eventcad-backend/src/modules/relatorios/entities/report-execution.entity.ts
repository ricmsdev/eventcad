import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReportTemplate } from './report-template.entity';
import { User } from '../../auth/entities/user.entity';
import { ReportExport } from './report-export.entity';

export enum ExecutionStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  TIMEOUT = 'timeout',
}

/**
 * Entidade ReportExecution - Execuções de relatórios
 *
 * Funcionalidades:
 * - Rastreamento de execuções de relatórios
 * - Status e progresso em tempo real
 * - Resultados e dados gerados
 * - Histórico de execuções
 * - Integração com exportações
 */
@Entity('report_executions')
@Index(['tenantId', 'status'])
@Index(['templateId', 'status'])
@Index(['executedBy', 'status'])
@Index(['createdAt', 'status'])
export class ReportExecution extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do template executado',
  })
  templateId: string;

  @ManyToOne(() => ReportTemplate, { eager: false })
  @JoinColumn({ name: 'templateId' })
  template?: ReportTemplate;

  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que executou',
  })
  executedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'executedBy' })
  executedByUser?: User;

  // Status e progresso
  @Column({
    type: 'enum',
    enum: ExecutionStatus,
    default: ExecutionStatus.PENDING,
    comment: 'Status da execução',
  })
  status: ExecutionStatus;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Progresso em porcentagem',
  })
  progress: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Mensagem de status',
  })
  statusMessage?: string;

  // Parâmetros e configuração
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Parâmetros da execução',
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
  };

  // Resultados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultado da execução',
  })
  result?: any;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Erro da execução',
  })
  error?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados gerados',
  })
  data?: any;

  // Timestamps
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de início da execução',
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de conclusão da execução',
  })
  completedAt?: Date;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Duração em segundos',
  })
  duration?: number;

  // Performance e recursos
  @Column({
    type: 'int',
    nullable: true,
    comment: 'Memória utilizada em MB',
  })
  memoryUsed?: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'CPU utilizado em porcentagem',
  })
  cpuUsed?: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Tamanho do resultado em bytes',
  })
  resultSize?: number;

  // Metadados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações do sistema',
  })
  systemInfo?: {
    platform?: string;
    nodeVersion?: string;
    memory?: Record<string, any>;
    cpu?: Record<string, any>;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações da requisição',
  })
  requestInfo?: {
    userAgent?: string;
    ip?: string;
    headers?: Record<string, any>;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Logs da execução',
  })
  logs?: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: Date;
    data?: any;
  }[];

  // Relacionamentos inversos
  @OneToMany(() => ReportExport, (export_) => export_.execution)
  exports?: ReportExport[];

  // Métodos de negócio
  declare isActive: boolean;

  get isExecutionActive(): boolean {
    return this.status === ExecutionStatus.PENDING || this.status === ExecutionStatus.IN_PROGRESS;
  }

  get isCompleted(): boolean {
    return this.status === ExecutionStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === ExecutionStatus.FAILED || this.status === ExecutionStatus.TIMEOUT;
  }

  get isCancelled(): boolean {
    return this.status === ExecutionStatus.CANCELLED;
  }

  get executionTime(): number {
    if (this.startedAt && this.completedAt) {
      return this.completedAt.getTime() - this.startedAt.getTime();
    }
    return 0;
  }

  get isOverdue(): boolean {
    if (!this.startedAt || this.isCompleted || this.isFailed || this.isCancelled) {
      return false;
    }
    const timeout = this.config?.timeout || 300; // 5 minutos padrão
    const elapsed = (Date.now() - this.startedAt.getTime()) / 1000;
    return elapsed > timeout;
  }

  // Métodos de negócio
  start(): void {
    this.status = ExecutionStatus.IN_PROGRESS;
    this.startedAt = new Date();
    this.progress = 0;
  }

  updateProgress(progress: number, message?: string): void {
    this.progress = Math.min(100, Math.max(0, progress));
    if (message) {
      this.statusMessage = message;
    }
  }

  complete(result: any, data?: any): void {
    this.status = ExecutionStatus.COMPLETED;
    this.completedAt = new Date();
    this.progress = 100;
    this.result = result;
    this.data = data;
    this.duration = this.executionTime;
  }

  fail(error: string): void {
    this.status = ExecutionStatus.FAILED;
    this.completedAt = new Date();
    this.error = error;
    this.duration = this.executionTime;
  }

  timeout(): void {
    this.status = ExecutionStatus.TIMEOUT;
    this.completedAt = new Date();
    this.error = 'Execução excedeu o tempo limite';
    this.duration = this.executionTime;
  }

  cancel(): void {
    this.status = ExecutionStatus.CANCELLED;
    this.completedAt = new Date();
    this.statusMessage = 'Execução cancelada pelo usuário';
    this.duration = this.executionTime;
  }

  addLog(level: 'info' | 'warn' | 'error', message: string, data?: any): void {
    if (!this.logs) {
      this.logs = [];
    }
    this.logs.push({
      level,
      message,
      timestamp: new Date(),
      data,
    });
  }

  setSystemInfo(info: any): void {
    this.systemInfo = info;
  }

  setRequestInfo(info: any): void {
    this.requestInfo = info;
  }

  setPerformanceMetrics(memory: number, cpu: number, size: number): void {
    this.memoryUsed = memory;
    this.cpuUsed = cpu;
    this.resultSize = size;
  }

  exportForReport(): any {
    return {
      id: this.id,
      templateId: this.templateId,
      status: this.status,
      progress: this.progress,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      result: this.result,
      error: this.error,
      createdAt: this.createdAt,
    };
  }
} 