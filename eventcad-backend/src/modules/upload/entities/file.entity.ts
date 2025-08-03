import { Entity, Column, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import {
  FileType,
  FileCategory,
  FileStatus,
} from '../../../common/enums/file-type.enum';
import { User } from '../../auth/entities/user.entity';

/**
 * Entidade File - Representa um arquivo no sistema EventCAD+
 * Gerencia upload, processamento, metadados e versionamento
 *
 * Funcionalidades:
 * - Upload seguro com validação
 * - Processamento de metadados
 * - Versionamento de arquivos
 * - Controle de acesso e permissões
 * - Integração com armazenamento (local/S3/MinIO)
 * - Análise de segurança e quarentena
 * - Compressão e otimização
 */
@Entity('files')
@Index(['category', 'tenantId'])
@Index(['status', 'tenantId'])
@Index(['uploadedBy', 'tenantId'])
@Index(['originalName', 'tenantId'])
export class File extends BaseEntity {
  // Informações básicas do arquivo
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
    comment: 'Nome original do arquivo',
  })
  originalName: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome único gerado para o arquivo',
  })
  filename: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'Caminho completo do arquivo no storage',
  })
  path: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: false,
    comment: 'Extensão do arquivo (sem ponto)',
  })
  extension: string;

  @Column({
    type: 'enum',
    enum: FileType,
    nullable: false,
    comment: 'Tipo específico do arquivo',
  })
  type: FileType;

  @Column({
    type: 'enum',
    enum: FileCategory,
    nullable: false,
    comment: 'Categoria do arquivo para processamento',
  })
  category: FileCategory;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'MIME type do arquivo',
  })
  mimeType: string;

  @Column({
    type: 'bigint',
    nullable: false,
    comment: 'Tamanho do arquivo em bytes',
  })
  size: number;

  @Column({
    type: 'enum',
    enum: FileStatus,
    default: FileStatus.UPLOADING,
    comment: 'Status atual do processamento',
  })
  status: FileStatus;

  // Relacionamentos
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que fez o upload',
  })
  uploadedBy: string;

  @ManyToOne(() => User, { eager: false })
  uploader: User;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Tipo de entidade relacionada (evento, planta, etc.)',
  })
  entityType?: string;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID da entidade relacionada',
  })
  entityId?: string;

  // Informações de armazenamento
  @Column({
    type: 'varchar',
    length: 20,
    default: 'local',
    comment: 'Tipo de storage (local, s3, minio)',
  })
  storageType: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Bucket/container do storage externo',
  })
  bucket?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL pública do arquivo (se aplicável)',
  })
  publicUrl?: string;

  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
    comment: 'URL privada/assinada do arquivo',
  })
  privateUrl?: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Expiração da URL assinada',
  })
  urlExpiresAt?: Date;

  // Metadados e processamento
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados extraídos do arquivo',
  })
  declare metadata?: {
    // Metadados gerais
    dimensions?: { width: number; height: number; depth?: number };
    duration?: number; // Para vídeos/áudio
    pages?: number; // Para PDFs

    // Metadados técnicos (plantas)
    dwgVersion?: string;
    units?: string;
    scale?: string;
    layers?: string[];
    blocks?: string[];

    // Metadados de imagem
    colorSpace?: string;
    compression?: string;
    dpi?: { x: number; y: number };

    // Metadados de documento
    author?: string;
    title?: string;
    subject?: string;
    keywords?: string[];
    createdDate?: Date;
    modifiedDate?: Date;

    // Outros metadados
    [key: string]: any;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações de processamento',
  })
  processingInfo?: {
    startedAt?: Date;
    completedAt?: Date;
    duration?: number; // segundos
    steps?: {
      name: string;
      status: 'pending' | 'running' | 'completed' | 'failed';
      startedAt?: Date;
      completedAt?: Date;
      error?: string;
    }[];
    errors?: string[];
    warnings?: string[];
  };

  // Versionamento
  @Column({
    type: 'integer',
    default: 1,
    comment: 'Versão do arquivo',
  })
  version: number;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID da versão anterior (para histórico)',
  })
  previousVersionId?: string;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Indica se é a versão mais recente',
  })
  isLatestVersion: boolean;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comentário sobre esta versão',
  })
  versionComment?: string;

  // Segurança e verificação
  @Column({
    type: 'varchar',
    length: 64,
    nullable: true,
    comment: 'Hash SHA-256 do arquivo para verificação de integridade',
  })
  hash: string;

  @Column({
    type: 'varchar',
    length: 32,
    nullable: true,
    comment: 'Hash MD5 do arquivo',
  })
  md5: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultado da análise de segurança',
  })
  securityScan?: {
    scannedAt?: Date;
    engine?: string;
    version?: string;
    status: 'clean' | 'suspicious' | 'malware' | 'error';
    threats?: {
      type: string;
      name: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
    }[];
    quarantineReason?: string;
  };

  // Informações de compressão/otimização
  @Column({
    type: 'bigint',
    nullable: true,
    comment: 'Tamanho original antes da compressão',
  })
  originalSize?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Taxa de compressão (0-100%)',
  })
  compressionRatio?: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Arquivos derivados (thumbnails, previews, etc.)',
  })
  derivedFiles?: {
    type: 'thumbnail' | 'preview' | 'compressed' | 'converted';
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
  }[];

  // Configurações de acesso
  @Column({
    type: 'boolean',
    default: false,
    comment: 'Indica se o arquivo é público',
  })
  isPublic: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Permissões específicas de acesso',
  })
  permissions?: {
    canView?: string[]; // IDs de usuários
    canDownload?: string[]; // IDs de usuários
    canEdit?: string[]; // IDs de usuários
    canDelete?: string[]; // IDs de usuários
  };

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data de expiração do arquivo',
  })
  expiresAt?: Date;

  // Estatísticas de uso
  @Column({
    type: 'integer',
    default: 0,
    comment: 'Número de visualizações',
  })
  viewCount: number;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Número de downloads',
  })
  downloadCount: number;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Último acesso ao arquivo',
  })
  lastAccessedAt?: Date;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações adicionais específicas do arquivo',
  })
  settings?: Record<string, any>;

  /**
   * Verifica se o arquivo está pronto para uso
   */
  get isReady(): boolean {
    return (
      this.status === FileStatus.PROCESSED ||
      this.status === FileStatus.UPLOADED
    );
  }

  /**
   * Verifica se o arquivo está em processamento
   */
  get isProcessing(): boolean {
    return (
      this.status === FileStatus.PROCESSING ||
      this.status === FileStatus.UPLOADING
    );
  }

  /**
   * Verifica se houve falha no processamento
   */
  get hasError(): boolean {
    return this.status === FileStatus.FAILED;
  }

  /**
   * Verifica se o arquivo está em quarentena
   */
  get isQuarantined(): boolean {
    return this.status === FileStatus.QUARANTINE;
  }

  /**
   * Obtém o nome amigável do arquivo
   */
  get displayName(): string {
    return this.originalName || this.filename;
  }

  /**
   * Calcula o tamanho formatado do arquivo
   */
  get formattedSize(): string {
    const bytes = this.size;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Verifica se o usuário tem permissão específica
   * @param userId - ID do usuário
   * @param permission - Tipo de permissão
   * @returns true se tem permissão
   */
  hasPermission(
    userId: string,
    permission: 'view' | 'download' | 'edit' | 'delete',
  ): boolean {
    // Uploader sempre tem todas as permissões
    if (this.uploadedBy === userId) return true;

    // Arquivo público pode ser visualizado por todos
    if (this.isPublic && permission === 'view') return true;

    // Verifica permissões específicas
    const permissionKey = `can${permission.charAt(0).toUpperCase() + permission.slice(1)}`;
    const permissionArray =
      this.permissions?.[permissionKey as keyof typeof this.permissions];
    return (permissionArray as string[])?.includes(userId) || false;
  }

  /**
   * Adiciona permissão para um usuário
   * @param userId - ID do usuário
   * @param permission - Tipo de permissão
   */
  grantPermission(
    userId: string,
    permission: 'view' | 'download' | 'edit' | 'delete',
  ): void {
    if (!this.permissions) {
      this.permissions = {};
    }

    const permissionKey =
      `can${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof typeof this.permissions;
    if (!this.permissions[permissionKey]) {
      this.permissions[permissionKey] = [];
    }

    if (!this.permissions[permissionKey].includes(userId)) {
      this.permissions[permissionKey].push(userId);
    }
  }

  /**
   * Remove permissão de um usuário
   * @param userId - ID do usuário
   * @param permission - Tipo de permissão
   */
  revokePermission(
    userId: string,
    permission: 'view' | 'download' | 'edit' | 'delete',
  ): void {
    if (!this.permissions) return;

    const permissionKey =
      `can${permission.charAt(0).toUpperCase() + permission.slice(1)}` as keyof typeof this.permissions;
    if (this.permissions[permissionKey]) {
      this.permissions[permissionKey] = this.permissions[permissionKey].filter(
        (id) => id !== userId,
      );
    }
  }

  /**
   * Marca o arquivo como acessado
   */
  markAsAccessed(): void {
    this.lastAccessedAt = new Date();
    this.viewCount++;
  }

  /**
   * Marca download do arquivo
   */
  markAsDownloaded(): void {
    this.downloadCount++;
    this.markAsAccessed();
  }

  /**
   * Atualiza status de processamento
   * @param status - Novo status
   * @param processingInfo - Informações de processamento
   */
  updateProcessingStatus(
    status: FileStatus,
    processingInfo?: Partial<File['processingInfo']>,
  ): void {
    this.status = status;

    if (processingInfo) {
      this.processingInfo = {
        ...this.processingInfo,
        ...processingInfo,
      };
    }

    if (status === FileStatus.PROCESSED) {
      this.processingInfo = {
        ...this.processingInfo,
        completedAt: new Date(),
      };
    }
  }

  /**
   * Adiciona arquivo derivado (thumbnail, preview, etc.)
   * @param derivedFile - Informações do arquivo derivado
   */
  addDerivedFile(derivedFile: {
    type: 'thumbnail' | 'preview' | 'compressed' | 'converted';
    filename: string;
    path: string;
    size: number;
    mimeType: string;
    dimensions?: { width: number; height: number };
  }): void {
    if (!this.derivedFiles) {
      this.derivedFiles = [];
    }

    // Remove arquivo derivado anterior do mesmo tipo
    this.derivedFiles = this.derivedFiles.filter(
      (file) => file.type !== derivedFile.type,
    );

    // Adiciona novo arquivo derivado
    this.derivedFiles.push(derivedFile);
  }
}
