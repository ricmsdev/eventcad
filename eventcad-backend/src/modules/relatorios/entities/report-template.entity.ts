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

export enum ReportType {
  INSPECTION = 'inspection',
  COMPLIANCE = 'compliance',
  SAFETY = 'safety',
  ANALYTICS = 'analytics',
  CUSTOM = 'custom',
}

export enum ReportStatus {
  DRAFT = 'draft',
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum ReportFormat {
  PDF = 'pdf',
  EXCEL = 'excel',
  HTML = 'html',
  JSON = 'json',
  CSV = 'csv',
  XML = 'xml',
}

export enum ReportFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  SEMI_ANNUAL = 'semi_annual',
  ANNUAL = 'annual',
  ON_DEMAND = 'on_demand',
  CUSTOM = 'custom',
}

export enum ReportPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

/**
 * Entidade ReportTemplate - Templates de relatórios reutilizáveis
 *
 * Funcionalidades:
 * - Templates personalizáveis para diferentes tipos de relatório
 * - Configuração de layout e formatação
 * - Integração com múltiplas fontes de dados
 * - Sistema de agendamento e execução automática
 * - Controle de acesso e permissões
 * - Versionamento e histórico
 * - Exportação em múltiplos formatos
 */
@Entity('report_templates')
@Index(['tenantId', 'status'])
@Index(['type', 'tenantId'])
@Index(['plantaId', 'status'])
@Index(['createdBy', 'status'])
@Index(['category', 'tenantId'])
export class ReportTemplate extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: 'Nome do template',
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
    comment: 'Código único do template',
  })
  code: string;

  // Classificação e tipo
  @Column({
    type: 'enum',
    enum: ReportType,
    default: ReportType.ANALYTICS,
    comment: 'Tipo do relatório',
  })
  type: ReportType;

  @Column({
    type: 'enum',
    enum: ReportStatus,
    default: ReportStatus.DRAFT,
    comment: 'Status atual',
  })
  status: ReportStatus;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Categoria do relatório',
  })
  category?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Versão do template',
  })
  version?: string;

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

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'updatedBy' })
  updatedByUser?: User;

  // Configuração de dados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração das fontes de dados',
  })
  dataSources?: {
    type: 'infra_objects' | 'checklists' | 'events' | 'custom_query';
    query?: string;
    filters?: Record<string, any>;
    parameters?: Record<string, any>;
    joins?: {
      table: string;
      condition: string;
      type: 'inner' | 'left' | 'right';
    }[];
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração do layout',
  })
  layout?: {
    sections: {
      id: string;
      type: 'header' | 'content' | 'footer' | 'chart' | 'table' | 'text';
      title?: string;
      content?: string;
      config?: Record<string, any>;
      order: number;
    }[];
    pageSize: 'a4' | 'letter' | 'legal';
    orientation: 'portrait' | 'landscape';
    margins: {
      top: number;
      bottom: number;
      left: number;
      right: number;
    };
    header?: {
      enabled: boolean;
      content?: string;
      logo?: string;
    };
    footer?: {
      enabled: boolean;
      content?: string;
      pageNumbers: boolean;
    };
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração de gráficos e tabelas',
  })
  charts?: {
    id: string;
    type: 'bar' | 'line' | 'pie' | 'scatter' | 'area' | 'table';
    title: string;
    dataSource: string;
    config: Record<string, any>;
    position: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração de filtros',
  })
  filters?: {
    id: string;
    name: string;
    type: 'date' | 'select' | 'text' | 'number' | 'boolean';
    required: boolean;
    defaultValue?: any;
    options?: { value: string; label: string }[];
    validation?: Record<string, any>;
  }[];

  // Configuração de execução
  @Column({
    type: 'enum',
    enum: ReportPriority,
    default: ReportPriority.MEDIUM,
    comment: 'Prioridade de execução',
  })
  priority: ReportPriority;

  @Column({
    type: 'int',
    default: 30,
    comment: 'Timeout de execução em segundos',
  })
  executionTimeout: number;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite execução paralela',
  })
  allowParallelExecution: boolean;

  @Column({
    type: 'int',
    default: 5,
    comment: 'Número máximo de execuções paralelas',
  })
  maxParallelExecutions: number;

  // Configuração de exportação
  @Column({
    type: 'simple-array',
    default: [ReportFormat.PDF],
    comment: 'Formatos de exportação suportados',
  })
  supportedFormats: ReportFormat[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração específica por formato',
  })
  formatConfig?: {
    [key in ReportFormat]?: {
      template?: string;
      options?: Record<string, any>;
      styling?: Record<string, any>;
    };
  };

  // Configuração de segurança
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Roles permitidas para execução',
  })
  allowedRoles?: string[];

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'IPs permitidos para execução',
  })
  allowedIPs?: string[];

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se requer autenticação',
  })
  requiresAuthentication: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se adiciona watermark',
  })
  addWatermark: boolean;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Texto do watermark',
  })
  watermarkText?: string;

  // Configuração de cache
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite cache',
  })
  enableCache: boolean;

  @Column({
    type: 'int',
    default: 3600,
    comment: 'Tempo de cache em segundos',
  })
  cacheTimeout: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configuração de cache por parâmetros',
  })
  cacheConfig?: {
    keyPattern: string;
    parameters: string[];
    conditions?: Record<string, any>;
  };

  // Configuração de notificação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificação',
  })
  notificationSettings?: {
    onCompletion: boolean;
    onError: boolean;
    onTimeout: boolean;
    recipients: string[];
    channels: ('email' | 'sms' | 'push' | 'webhook')[];
    templates?: {
      completion?: string;
      error?: string;
      timeout?: string;
    };
  };

  // Configuração de performance
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite compressão',
  })
  enableCompression: boolean;

  @Column({
    type: 'int',
    default: 10,
    comment: 'Tamanho máximo em MB',
  })
  maxFileSize: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de otimização',
  })
  optimizationConfig?: {
    enablePagination: boolean;
    pageSize: number;
    enableLazyLoading: boolean;
    enableDataCompression: boolean;
  };

  // Metadados
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
  templateMetadata?: Record<string, any>;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se é relatório rápido',
  })
  isQuickReport: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se é relatório especializado',
  })
  specialized: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se é público',
  })
  isPublic: boolean;

  // Estatísticas de uso
  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de execuções',
  })
  executionCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da última execução',
  })
  lastExecutedAt?: Date;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Avaliação média',
  })
  averageRating?: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de avaliações',
  })
  ratingCount: number;

  // Relacionamentos inversos - serão definidos quando as entidades estiverem disponíveis
  executions?: any[];

  schedules?: any[];

  @ManyToMany(() => User)
  @JoinTable({
    name: 'report_template_favorites',
    joinColumn: { name: 'templateId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'userId', referencedColumnName: 'id' },
  })
  favoritedBy?: User[];

  // Métodos de negócio
  get isTemplateActive(): boolean {
    return this.status === ReportStatus.ACTIVE;
  }

  get isDraft(): boolean {
    return this.status === ReportStatus.DRAFT;
  }

  get isArchived(): boolean {
    return this.status === ReportStatus.ARCHIVED;
  }

  get canBeExecuted(): boolean {
    return this.isTemplateActive && !this.isArchived;
  }

  get hasDataSources(): boolean {
    return (this.dataSources && this.dataSources.length > 0) || false;
  }

  get hasLayout(): boolean {
    return (this.layout && this.layout.sections && this.layout.sections.length > 0) || false;
  }

  get supportedFormatsList(): ReportFormat[] {
    return this.supportedFormats || [ReportFormat.PDF];
  }

  get isPublicTemplate(): boolean {
    return this.isPublic || this.isQuickReport;
  }

  get averageExecutionTime(): number {
    // Implementar cálculo baseado no histórico
    return 0;
  }

  get successRate(): number {
    // Implementar cálculo baseado no histórico
    return 0;
  }

  // Métodos de negócio
  updateStatus(newStatus: ReportStatus, updatedBy: string): void {
    this.status = newStatus;
    this.updatedBy = updatedBy;
    this.updatedAt = new Date();
  }

  incrementExecutionCount(): void {
    this.executionCount++;
    this.lastExecutedAt = new Date();
  }

  addRating(rating: number): void {
    if (rating >= 1 && rating <= 5) {
      const totalRating = (this.averageRating || 0) * this.ratingCount + rating;
      this.ratingCount++;
      this.averageRating = totalRating / this.ratingCount;
    }
  }

  addDataSource(dataSource: any): void {
    if (!this.dataSources) {
      this.dataSources = [];
    }
    this.dataSources.push(dataSource);
  }

  addChart(chart: any): void {
    if (!this.charts) {
      this.charts = [];
    }
    this.charts.push(chart);
  }

  addFilter(filter: any): void {
    if (!this.filters) {
      this.filters = [];
    }
    this.filters.push(filter);
  }

  setLayout(layout: any): void {
    this.layout = layout;
  }

  enableFormat(format: ReportFormat): void {
    if (!this.supportedFormats.includes(format)) {
      this.supportedFormats.push(format);
    }
  }

  disableFormat(format: ReportFormat): void {
    this.supportedFormats = this.supportedFormats.filter(f => f !== format);
  }

  setCacheConfig(config: any): void {
    this.cacheConfig = config;
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
    if (!this.templateMetadata) {
      this.templateMetadata = {};
    }
    this.templateMetadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.templateMetadata?.[key];
  }

  validateConfig(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.name || this.name.trim().length === 0) {
      errors.push('Nome é obrigatório');
    }

    if (!this.code || this.code.trim().length === 0) {
      errors.push('Código é obrigatório');
    }

    if (!this.hasDataSources) {
      errors.push('Pelo menos uma fonte de dados é obrigatória');
    }

    if (!this.hasLayout) {
      errors.push('Layout é obrigatório');
    }

    if (this.executionTimeout < 1) {
      errors.push('Timeout de execução deve ser maior que 0');
    }

    if (this.maxParallelExecutions < 1) {
      errors.push('Número máximo de execuções paralelas deve ser maior que 0');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  clone(newName: string, createdBy: string): ReportTemplate {
    const clone = new ReportTemplate();
    Object.assign(clone, {
      ...this,
      id: undefined,
      name: newName,
      code: `${this.code}_copy_${Date.now()}`,
      status: ReportStatus.DRAFT,
      createdBy,
      updatedBy: undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      executionCount: 0,
      lastExecutedAt: undefined,
      averageRating: undefined,
      ratingCount: 0,
      executions: undefined,
      schedules: undefined,
      favoritedBy: undefined,
    });
    return clone;
  }

  exportForReport(): any {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      code: this.code,
      type: this.type,
      category: this.category,
      version: this.version,
      layout: this.layout,
      charts: this.charts,
      filters: this.filters,
      supportedFormats: this.supportedFormats,
      metadata: this.templateMetadata,
      tags: this.tags,
      executionCount: this.executionCount,
      averageRating: this.averageRating,
      ratingCount: this.ratingCount,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
} 