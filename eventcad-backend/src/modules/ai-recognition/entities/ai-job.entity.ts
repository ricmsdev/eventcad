import { Entity, Column, ManyToOne, Index, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Planta } from '../../planta/entities/planta.entity';
import { User } from '../../auth/entities/user.entity';
import {
  AIProcessingStatus,
  AIModelType,
  AIObjectCategory,
} from '../../../common/enums/ai-recognition.enum';

/**
 * Entidade AIJob - Gerencia jobs de processamento de IA
 *
 * Funcionalidades:
 * - Queue de processamento assíncrono
 * - Retry automático com backoff
 * - Monitoramento de progresso em tempo real
 * - Múltiplos modelos por job
 * - Callbacks e webhooks
 * - Auditoria completa de processamento
 */
@Entity('ai_jobs')
@Index(['status', 'tenantId'])
@Index(['modelType', 'tenantId'])
@Index(['priority', 'createdAt'])
@Index(['plantaId', 'tenantId'])
@Index(['status', 'scheduledFor'])
export class AIJob extends BaseEntity {
  // Identificação do job
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome identificador do job',
  })
  jobName: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada do job',
  })
  description?: string;

  // Relacionamentos
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID da planta a ser processada',
  })
  plantaId: string;

  @ManyToOne(() => Planta, { eager: false })
  @JoinColumn({ name: 'plantaId' })
  planta?: Planta;

  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que iniciou o job',
  })
  initiatedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'initiatedBy' })
  initiator?: User;

  // Configuração do processamento
  @Column({
    type: 'enum',
    enum: AIModelType,
    nullable: false,
    comment: 'Tipo do modelo de IA a ser usado',
  })
  modelType: AIModelType;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Prioridade do job (1=crítica, 2=alta, 3=média, 4=baixa)',
  })
  priority: number;

  @Column({
    type: 'enum',
    enum: AIProcessingStatus,
    default: AIProcessingStatus.PENDING,
    comment: 'Status atual do processamento',
  })
  status: AIProcessingStatus;

  // Configurações específicas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do modelo',
  })
  modelConfig?: {
    confidence_threshold?: number;
    categories?: AIObjectCategory[];
    preprocessing?: {
      resize?: { width: number; height: number };
      normalize?: boolean;
      grayscale?: boolean;
      enhance?: boolean;
    };
    postprocessing?: {
      filter_duplicates?: boolean;
      merge_overlapping?: boolean;
      min_area?: number;
    };
    advanced?: Record<string, any>;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Parâmetros específicos do processamento',
  })
  processingParams?: {
    detect_objects?: boolean;
    extract_text?: boolean;
    analyze_layers?: boolean;
    extract_dimensions?: boolean;
    validate_compliance?: boolean;
    generate_report?: boolean;
    create_thumbnails?: boolean;
    extract_metadata?: boolean;
  };

  // Agendamento
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora agendada para início do processamento',
  })
  scheduledFor?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de início do processamento',
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora de conclusão do processamento',
  })
  completedAt?: Date;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Tempo de processamento em segundos',
  })
  processingTimeSeconds?: number;

  // Progresso e monitoramento
  @Column({
    type: 'int',
    default: 0,
    comment: 'Progresso do processamento (0-100)',
  })
  progress: number;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Estágio atual do processamento',
  })
  currentStage?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Log detalhado do processamento',
  })
  processingLog?: {
    timestamp: Date;
    stage: string;
    message: string;
    level: 'info' | 'warning' | 'error' | 'debug';
    data?: Record<string, any>;
  }[];

  // Retry e controle de erro
  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de tentativas realizadas',
  })
  attemptCount: number;

  @Column({
    type: 'int',
    default: 3,
    comment: 'Máximo de tentativas permitidas',
  })
  maxAttempts: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data/hora da próxima tentativa (para retry)',
  })
  nextRetryAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de erros',
  })
  errorHistory?: {
    attempt: number;
    timestamp: Date;
    error: string;
    stackTrace?: string;
    context?: Record<string, any>;
  }[];

  // Resultados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultados do processamento de IA',
  })
  results?: {
    // Objetos detectados
    detected_objects?: {
      id: string;
      type: string;
      category: AIObjectCategory;
      confidence: number;
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      properties?: Record<string, any>;
      metadata?: Record<string, any>;
    }[];

    // Texto extraído
    extracted_text?: {
      text: string;
      position: { x: number; y: number };
      confidence: number;
      category?: 'dimension' | 'label' | 'annotation' | 'title';
      font_size?: number;
      font_family?: string;
    }[];

    // Análise de layers
    layer_analysis?: {
      layer_name: string;
      object_count: number;
      object_types: string[];
      confidence: number;
      properties?: Record<string, any>;
    }[];

    // Dimensões extraídas
    dimensions?: {
      type: 'linear' | 'angular' | 'radial' | 'area';
      value: number;
      unit: string;
      position: { x: number; y: number };
      confidence: number;
      formatted_text?: string;
    }[];

    // Análise de compliance
    compliance_analysis?: {
      rule: string;
      status: 'pass' | 'fail' | 'warning' | 'not_applicable';
      message: string;
      confidence: number;
      references?: string[];
    }[];

    // Metadados extraídos
    extracted_metadata?: {
      cad_version?: string;
      software?: string;
      scale?: string;
      units?: string;
      layers?: string[];
      blocks?: string[];
      total_objects?: number;
    };

    // Estatísticas
    statistics?: {
      total_objects_detected: number;
      confidence_avg: number;
      confidence_min: number;
      confidence_max: number;
      processing_time_ms: number;
      model_version: string;
    };

    // Arquivos gerados
    generated_files?: {
      type: 'thumbnail' | 'report' | 'annotated_image' | 'json' | 'xml';
      path: string;
      size: number;
      created_at: Date;
    }[];
  };

  // Callbacks e notificações
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL de callback para notificar conclusão',
  })
  callbackUrl?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Email para notificação de conclusão',
  })
  notificationEmail?: string;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se deve notificar via webhook',
  })
  enableWebhook: boolean;

  // Controle de recursos
  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID do worker que está processando',
  })
  workerId?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'ID da sessão de processamento',
  })
  sessionId?: string;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Memória estimada necessária em MB',
  })
  estimatedMemoryMB?: number;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Tempo estimado de processamento em segundos',
  })
  estimatedTimeSeconds?: number;

  // Métodos de conveniência

  /**
   * Verifica se o job pode ser executado
   */
  get canExecute(): boolean {
    return (
      this.status === AIProcessingStatus.PENDING ||
      this.status === AIProcessingStatus.QUEUED ||
      (this.status === AIProcessingStatus.FAILED && this.canRetry)
    );
  }

  /**
   * Verifica se o job pode ser tentado novamente
   */
  get canRetry(): boolean {
    return (
      this.attemptCount < this.maxAttempts &&
      this.status === AIProcessingStatus.FAILED &&
      (!this.nextRetryAt || this.nextRetryAt <= new Date())
    );
  }

  /**
   * Verifica se o job está em processamento
   */
  get isProcessing(): boolean {
    return (
      this.status === AIProcessingStatus.PROCESSING ||
      this.status === AIProcessingStatus.QUEUED
    );
  }

  /**
   * Verifica se o job foi concluído com sucesso
   */
  get isCompleted(): boolean {
    return this.status === AIProcessingStatus.COMPLETED;
  }

  /**
   * Verifica se o job falhou
   */
  get isFailed(): boolean {
    return this.status === AIProcessingStatus.FAILED;
  }

  /**
   * Obtém duração total do processamento
   */
  get duration(): number | null {
    if (!this.startedAt || !this.completedAt) return null;
    return Math.round(
      (this.completedAt.getTime() - this.startedAt.getTime()) / 1000,
    );
  }

  /**
   * Adiciona entrada ao log de processamento
   */
  addLogEntry(
    stage: string,
    message: string,
    level: 'info' | 'warning' | 'error' | 'debug' = 'info',
    data?: Record<string, any>,
  ): void {
    if (!this.processingLog) {
      this.processingLog = [];
    }

    this.processingLog.push({
      timestamp: new Date(),
      stage,
      message,
      level,
      data,
    });

    // Manter apenas os últimos 100 logs
    if (this.processingLog.length > 100) {
      this.processingLog = this.processingLog.slice(-100);
    }
  }

  /**
   * Registra erro
   */
  addError(
    error: string,
    stackTrace?: string,
    context?: Record<string, any>,
  ): void {
    if (!this.errorHistory) {
      this.errorHistory = [];
    }

    this.errorHistory.push({
      attempt: this.attemptCount + 1,
      timestamp: new Date(),
      error,
      stackTrace,
      context,
    });

    this.addLogEntry('error', error, 'error', { stackTrace, context });
  }

  /**
   * Inicia o processamento
   */
  start(workerId?: string, sessionId?: string): void {
    this.status = AIProcessingStatus.PROCESSING;
    this.startedAt = new Date();
    this.attemptCount += 1;
    this.workerId = workerId;
    this.sessionId = sessionId;
    this.progress = 0;
    this.currentStage = 'Iniciando processamento';

    this.addLogEntry(
      'start',
      `Iniciando processamento (tentativa ${this.attemptCount})`,
      'info',
      {
        workerId,
        sessionId,
      },
    );
  }

  /**
   * Atualiza progresso
   */
  updateProgress(
    progress: number,
    stage: string,
    details?: Record<string, any>,
  ): void {
    this.progress = Math.max(0, Math.min(100, progress));
    this.currentStage = stage;

    this.addLogEntry(
      'progress',
      `Progresso: ${progress}% - ${stage}`,
      'info',
      details,
    );
  }

  /**
   * Completa o processamento com sucesso
   */
  complete(results: AIJob['results']): void {
    this.status = AIProcessingStatus.COMPLETED;
    this.completedAt = new Date();
    this.progress = 100;
    this.currentStage = 'Concluído';
    this.results = results;

    if (this.startedAt) {
      this.processingTimeSeconds = Math.round(
        (this.completedAt.getTime() - this.startedAt.getTime()) / 1000,
      );
    }

    this.addLogEntry(
      'complete',
      'Processamento concluído com sucesso',
      'info',
      {
        processingTime: this.processingTimeSeconds,
        objectsDetected: results?.detected_objects?.length || 0,
        textExtracted: results?.extracted_text?.length || 0,
      },
    );
  }

  /**
   * Marca como falhou
   */
  fail(error: string, stackTrace?: string): void {
    this.status = AIProcessingStatus.FAILED;
    this.completedAt = new Date();
    this.currentStage = 'Falhou';

    this.addError(error, stackTrace);

    // Calcular próxima tentativa com backoff exponencial
    if (this.canRetry) {
      const backoffSeconds = Math.pow(2, this.attemptCount) * 60; // 2^n minutos
      this.nextRetryAt = new Date(Date.now() + backoffSeconds * 1000);
      this.status = AIProcessingStatus.PENDING; // Permitir retry

      this.addLogEntry(
        'retry_scheduled',
        `Próxima tentativa agendada para ${this.nextRetryAt.toISOString()}`,
        'warning',
        {
          backoffSeconds,
          attempt: this.attemptCount,
          maxAttempts: this.maxAttempts,
        },
      );
    } else {
      this.addLogEntry(
        'failed',
        'Processamento falhou - máximo de tentativas excedido',
        'error',
        {
          finalAttempt: this.attemptCount,
          maxAttempts: this.maxAttempts,
        },
      );
    }
  }

  /**
   * Cancela o processamento
   */
  cancel(reason?: string): void {
    this.status = AIProcessingStatus.CANCELLED;
    this.completedAt = new Date();
    this.currentStage = 'Cancelado';

    this.addLogEntry(
      'cancel',
      `Processamento cancelado${reason ? ': ' + reason : ''}`,
      'warning',
      { reason },
    );
  }

  /**
   * Define timeout
   */
  timeout(): void {
    this.status = AIProcessingStatus.TIMEOUT;
    this.completedAt = new Date();
    this.currentStage = 'Timeout';

    this.addLogEntry(
      'timeout',
      'Processamento interrompido por timeout',
      'error',
      {
        timeoutAfter: this.processingTimeSeconds,
      },
    );
  }

  /**
   * Obtém resumo do status
   */
  getStatusSummary(): {
    status: AIProcessingStatus;
    progress: number;
    stage: string;
    canRetry: boolean;
    duration: number | null;
    attempts: number;
    lastError?: string;
  } {
    return {
      status: this.status,
      progress: this.progress,
      stage: this.currentStage || 'Aguardando',
      canRetry: this.canRetry,
      duration: this.duration,
      attempts: this.attemptCount,
      lastError: this.errorHistory?.[this.errorHistory.length - 1]?.error,
    };
  }

  /**
   * Exporta dados para relatório
   */
  exportForReport(): Record<string, any> {
    return {
      id: this.id,
      jobName: this.jobName,
      modelType: this.modelType,
      status: this.status,
      priority: this.priority,
      progress: this.progress,
      currentStage: this.currentStage,
      createdAt: this.createdAt,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      processingTimeSeconds: this.processingTimeSeconds,
      attemptCount: this.attemptCount,
      maxAttempts: this.maxAttempts,
      results: this.results,
      modelConfig: this.modelConfig,
      processingParams: this.processingParams,
    };
  }
}
