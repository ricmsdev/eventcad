import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { ReportExecution } from './report-execution.entity';
import { User } from '../../auth/entities/user.entity';
import { ReportFormat } from './report-template.entity';

export enum ExportStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Entidade ReportExport - Exportações de relatórios
 *
 * Funcionalidades:
 * - Exportação de relatórios em múltiplos formatos
 * - Rastreamento de status e progresso
 * - Armazenamento de arquivos gerados
 * - Histórico de exportações
 * - Download e compartilhamento
 */
@Entity('report_exports')
@Index(['tenantId', 'status'])
@Index(['executionId', 'status'])
@Index(['exportedBy', 'status'])
@Index(['createdAt', 'status'])
export class ReportExport extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID da execução exportada',
  })
  executionId: string;

  @ManyToOne(() => ReportExecution, { eager: false })
  @JoinColumn({ name: 'executionId' })
  execution?: ReportExecution;

  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que exportou',
  })
  exportedBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'exportedBy' })
  exportedByUser?: User;

  // Configuração de exportação
  @Column({
    type: 'enum',
    enum: ReportFormat,
    nullable: false,
    comment: 'Formato de exportação',
  })
  format: ReportFormat;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do formato',
  })
  formatConfig?: {
    template?: string;
    options?: Record<string, any>;
    styling?: Record<string, any>;
  };

  // Status e progresso
  @Column({
    type: 'enum',
    enum: ExportStatus,
    default: ExportStatus.PENDING,
    comment: 'Status da exportação',
  })
  status: ExportStatus;

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

  // Resultado da exportação
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'Caminho do arquivo gerado',
  })
  filePath?: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
    comment: 'Nome do arquivo',
  })
  fileName?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Tipo MIME do arquivo',
  })
  mimeType?: string;

  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Tamanho do arquivo em bytes',
  })
  fileSize?: number;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Hash do arquivo para verificação',
  })
  fileHash?: string;

  // Timestamps
  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de início da exportação',
  })
  startedAt?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de conclusão da exportação',
  })
  completedAt?: Date;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Duração em segundos',
  })
  duration?: number;

  // Erro e logs
  @Column({
    type: 'text',
    nullable: true,
    comment: 'Erro da exportação',
  })
  error?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Logs da exportação',
  })
  logs?: {
    level: 'info' | 'warn' | 'error';
    message: string;
    timestamp: Date;
    data?: any;
  }[];

  // Configuração de qualidade
  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se aplica compressão',
  })
  enableCompression: boolean;

  @Column({
    type: 'int',
    nullable: true,
    comment: 'Qualidade da compressão (1-100)',
  })
  compressionQuality?: number;

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

  // Configuração de segurança
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se requer autenticação para download',
  })
  requiresAuth: boolean;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Roles permitidas para download',
  })
  allowedRoles?: string[];

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de expiração do arquivo',
  })
  expiresAt?: Date;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de downloads',
  })
  downloadCount: number;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data do último download',
  })
  lastDownloadedAt?: Date;

  // Metadados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados do arquivo',
  })
  exportMetadata?: {
    pages?: number;
    resolution?: string;
    orientation?: string;
    colorMode?: string;
    [key: string]: any;
  };

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Tags para categorização',
  })
  tags?: string[];

  // Métodos de negócio
  get isExportActive(): boolean {
    return this.status === ExportStatus.PENDING || this.status === ExportStatus.PROCESSING;
  }

  get isCompleted(): boolean {
    return this.status === ExportStatus.COMPLETED;
  }

  get isFailed(): boolean {
    return this.status === ExportStatus.FAILED;
  }

  get isCancelled(): boolean {
    return this.status === ExportStatus.CANCELLED;
  }

  get hasFile(): boolean {
    return !!this.filePath && !!this.fileName;
  }

  get isExpired(): boolean {
    return !!(this.expiresAt && this.expiresAt < new Date());
  }

  get canBeDownloaded(): boolean {
    return this.isCompleted && this.hasFile && !this.isExpired;
  }

  get fileSizeInMB(): number {
    return this.fileSize ? this.fileSize / (1024 * 1024) : 0;
  }

  get exportTime(): number {
    if (this.startedAt && this.completedAt) {
      return this.completedAt.getTime() - this.startedAt.getTime();
    }
    return 0;
  }

  // Métodos de negócio
  start(): void {
    this.status = ExportStatus.PROCESSING;
    this.startedAt = new Date();
    this.progress = 0;
  }

  updateProgress(progress: number, message?: string): void {
    this.progress = Math.min(100, Math.max(0, progress));
    if (message) {
      this.statusMessage = message;
    }
  }

  complete(filePath: string, fileName: string, fileSize: number, mimeType: string): void {
    this.status = ExportStatus.COMPLETED;
    this.completedAt = new Date();
    this.progress = 100;
    this.filePath = filePath;
    this.fileName = fileName;
    this.fileSize = fileSize;
    this.mimeType = mimeType;
    this.duration = this.exportTime;
  }

  fail(error: string): void {
    this.status = ExportStatus.FAILED;
    this.completedAt = new Date();
    this.error = error;
    this.duration = this.exportTime;
  }

  cancel(): void {
    this.status = ExportStatus.CANCELLED;
    this.completedAt = new Date();
    this.statusMessage = 'Exportação cancelada pelo usuário';
    this.duration = this.exportTime;
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

  incrementDownloadCount(): void {
    this.downloadCount++;
    this.lastDownloadedAt = new Date();
  }

  setFileHash(hash: string): void {
    this.fileHash = hash;
  }

  setMetadata(metadata: any): void {
    this.exportMetadata = metadata;
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

  setExpiration(days: number): void {
    this.expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  }

  setSecuritySettings(requiresAuth: boolean, allowedRoles?: string[]): void {
    this.requiresAuth = requiresAuth;
    this.allowedRoles = allowedRoles;
  }

  setWatermark(text: string): void {
    this.addWatermark = true;
    this.watermarkText = text;
  }

  setCompression(enable: boolean, quality?: number): void {
    this.enableCompression = enable;
    if (quality !== undefined) {
      this.compressionQuality = Math.min(100, Math.max(1, quality));
    }
  }

  validateExport(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.executionId) {
      errors.push('Execução é obrigatória');
    }

    if (!this.format) {
      errors.push('Formato é obrigatório');
    }

    if (this.compressionQuality && (this.compressionQuality < 1 || this.compressionQuality > 100)) {
      errors.push('Qualidade de compressão deve estar entre 1 e 100');
    }

    if (this.expiresAt && this.expiresAt <= new Date()) {
      errors.push('Data de expiração deve ser futura');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  exportForReport(): any {
    return {
      id: this.id,
      executionId: this.executionId,
      format: this.format,
      status: this.status,
      progress: this.progress,
      fileName: this.fileName,
      fileSize: this.fileSize,
      fileSizeInMB: this.fileSizeInMB,
      downloadCount: this.downloadCount,
      startedAt: this.startedAt,
      completedAt: this.completedAt,
      duration: this.duration,
      createdAt: this.createdAt,
    };
  }
} 