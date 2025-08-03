import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as crypto from 'crypto';
import sharp from 'sharp';
// import { fileTypeFromBuffer } from 'file-type';
const fileType = require('file-type');
import * as mimeTypes from 'mime-types';
import { File } from './entities/file.entity';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
  UpdateFileDto,
  ShareFileDto,
} from './dto/upload.dto';
import {
  FileType,
  FileCategory,
  FileStatus,
  getFileCategory,
  isMimeTypeAllowed,
  getMaxFileSize,
  isForbiddenExtension,
} from '../../common/enums/file-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Serviço de upload e gestão de arquivos do EventCAD+
 *
 * Funcionalidades:
 * - Upload seguro com validação rigorosa
 * - Processamento de metadados
 * - Geração de thumbnails e previews
 * - Análise de segurança
 * - Versionamento de arquivos
 * - Controle de acesso e permissões
 * - Otimização e compressão
 * - Integração com storage externo
 */
@Injectable()
export class UploadService {
  private readonly uploadPath: string;
  private readonly maxFileSize: number;
  private readonly allowedCategories: FileCategory[];

  constructor(
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly configService: ConfigService,
  ) {
    this.uploadPath = this.configService.get<string>(
      'UPLOAD_DESTINATION',
      './uploads',
    );
    this.maxFileSize = this.configService.get<number>(
      'UPLOAD_MAX_SIZE',
      104857600,
    ); // 100MB
    this.allowedCategories = Object.values(FileCategory);

    this.ensureUploadDirectories();
  }

  /**
   * Upload de arquivo único
   * @param file - Arquivo do multer
   * @param uploadDto - Dados do upload
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Arquivo salvo
   */
  async uploadFile(
    file: Express.Multer.File,
    uploadDto: UploadFileDto,
    userId: string,
    tenantId: string,
  ): Promise<File> {
    try {
      // Validação inicial
      await this.validateFile(file, uploadDto.category);

      // Detectar tipo de arquivo real
      const fileType = await this.detectFileType(file);
      const category = uploadDto.category || getFileCategory(fileType);

      // Validações de segurança
      await this.performSecurityChecks(file, category);

      // Gerar metadados únicos
      const filename = this.generateUniqueFilename(file.originalname);
      const filepath = await this.saveFile(file.buffer, filename, category);

      // Calcular hashes
      const { sha256, md5 } = await this.calculateHashes(file.buffer);

      // Criar registro no banco
      const fileEntity = this.fileRepository.create({
        originalName: file.originalname,
        filename,
        path: filepath,
        extension: path.extname(file.originalname).slice(1).toLowerCase(),
        type: fileType,
        category,
        mimeType: file.mimetype,
        size: file.size,
        hash: sha256,
        md5,
        uploadedBy: userId,
        tenantId,
        createdBy: userId,
        entityType: uploadDto.entityType,
        entityId: uploadDto.entityId,
        isPublic: uploadDto.isPublic || false,
        expiresAt: uploadDto.expiresAt
          ? new Date(uploadDto.expiresAt)
          : undefined,
        settings: uploadDto.settings,
        status: FileStatus.UPLOADED,
        storageType: 'local',
      });

      const savedFile = await this.fileRepository.save(fileEntity);

      // Processar arquivo em background
      this.processFileAsync(savedFile.id);

      return savedFile;
    } catch (error) {
      throw new BadRequestException(`Erro no upload: ${error.message}`);
    }
  }

  /**
   * Upload múltiplo de arquivos
   * @param files - Array de arquivos
   * @param uploadDto - Dados do upload
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Resultado do upload múltiplo
   */
  async uploadMultipleFiles(
    files: Express.Multer.File[],
    uploadDto: UploadMultipleFilesDto,
    userId: string,
    tenantId: string,
  ): Promise<{
    files: File[];
    errors: { filename: string; error: string }[];
    stats: {
      totalFiles: number;
      successCount: number;
      errorCount: number;
      totalSize: number;
    };
  }> {
    const uploadedFiles: File[] = [];
    const errors: { filename: string; error: string }[] = [];
    let totalSize = 0;

    for (const file of files) {
      try {
        const uploadedFile = await this.uploadFile(
          file,
          uploadDto,
          userId,
          tenantId,
        );
        uploadedFiles.push(uploadedFile);
        totalSize += file.size;
      } catch (error) {
        errors.push({
          filename: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      files: uploadedFiles,
      errors,
      stats: {
        totalFiles: files.length,
        successCount: uploadedFiles.length,
        errorCount: errors.length,
        totalSize,
      },
    };
  }

  /**
   * Busca arquivo por ID
   * @param id - ID do arquivo
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Arquivo encontrado
   */
  async findById(id: string, userId: string, tenantId: string): Promise<File> {
    const file = await this.fileRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: ['uploader'],
    });

    if (!file) {
      throw new NotFoundException('Arquivo não encontrado');
    }

    // Verificar permissões
    if (!file.hasPermission(userId, 'view')) {
      throw new ForbiddenException(
        'Sem permissão para visualizar este arquivo',
      );
    }

    // Marcar como acessado
    file.markAsAccessed();
    await this.fileRepository.save(file);

    return file;
  }

  /**
   * Lista arquivos com filtros
   * @param tenantId - ID do tenant
   * @param options - Opções de busca
   * @returns Lista paginada de arquivos
   */
  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      category?: FileCategory;
      status?: FileStatus;
      entityType?: string;
      entityId?: string;
      uploadedBy?: string;
      search?: string;
      isPublic?: boolean;
    } = {},
  ): Promise<{ data: File[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.fileRepository
      .createQueryBuilder('file')
      .leftJoinAndSelect('file.uploader', 'uploader')
      .where('file.tenantId = :tenantId', { tenantId })
      .andWhere('file.isActive = :isActive', { isActive: true });

    // Aplicar filtros
    if (options.category) {
      queryBuilder.andWhere('file.category = :category', {
        category: options.category,
      });
    }

    if (options.status) {
      queryBuilder.andWhere('file.status = :status', {
        status: options.status,
      });
    }

    if (options.entityType) {
      queryBuilder.andWhere('file.entityType = :entityType', {
        entityType: options.entityType,
      });
    }

    if (options.entityId) {
      queryBuilder.andWhere('file.entityId = :entityId', {
        entityId: options.entityId,
      });
    }

    if (options.uploadedBy) {
      queryBuilder.andWhere('file.uploadedBy = :uploadedBy', {
        uploadedBy: options.uploadedBy,
      });
    }

    if (options.isPublic !== undefined) {
      queryBuilder.andWhere('file.isPublic = :isPublic', {
        isPublic: options.isPublic,
      });
    }

    if (options.search) {
      queryBuilder.andWhere(
        '(file.originalName ILIKE :search OR file.filename ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    // Ordenação
    queryBuilder.orderBy('file.createdAt', 'DESC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Atualiza arquivo
   * @param id - ID do arquivo
   * @param updateDto - Dados para atualização
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Arquivo atualizado
   */
  async update(
    id: string,
    updateDto: UpdateFileDto,
    userId: string,
    tenantId: string,
  ): Promise<File> {
    const file = await this.findById(id, userId, tenantId);

    // Verificar permissões de edição
    if (!file.hasPermission(userId, 'edit')) {
      throw new ForbiddenException('Sem permissão para editar este arquivo');
    }

    // Aplicar atualizações
    Object.assign(file, {
      ...updateDto,
      expiresAt: updateDto.expiresAt
        ? new Date(updateDto.expiresAt)
        : file.expiresAt,
      updatedBy: userId,
    });

    return this.fileRepository.save(file);
  }

  /**
   * Remove arquivo (soft delete)
   * @param id - ID do arquivo
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @param userRole - Role do usuário
   */
  async remove(
    id: string,
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<void> {
    const file = await this.findById(id, userId, tenantId);

    // Verificar permissões de exclusão
    if (
      !file.hasPermission(userId, 'delete') &&
      ![UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)
    ) {
      throw new ForbiddenException('Sem permissão para excluir este arquivo');
    }

    file.deactivate(userId);
    file.status = FileStatus.DELETED;
    await this.fileRepository.save(file);
  }

  /**
   * Compartilha arquivo com outros usuários
   * @param id - ID do arquivo
   * @param shareDto - Dados do compartilhamento
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Arquivo atualizado
   */
  async shareFile(
    id: string,
    shareDto: ShareFileDto,
    userId: string,
    tenantId: string,
  ): Promise<File> {
    const file = await this.findById(id, userId, tenantId);

    // Verificar se é o dono do arquivo
    if (file.uploadedBy !== userId) {
      throw new ForbiddenException(
        'Apenas o dono do arquivo pode compartilhá-lo',
      );
    }

    // Conceder permissões
    shareDto.userIds.forEach((targetUserId) => {
      shareDto.permissions.forEach((permission) => {
        file.grantPermission(targetUserId, permission);
      });
    });

    // Atualizar expiração se fornecida
    if (shareDto.expiresAt) {
      file.expiresAt = new Date(shareDto.expiresAt);
    }

    return this.fileRepository.save(file);
  }

  /**
   * Gera URL de download segura
   * @param id - ID do arquivo
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @param duration - Duração da URL em segundos
   * @returns URL de download
   */
  async getDownloadUrl(
    id: string,
    userId: string,
    tenantId: string,
    duration = 3600,
  ): Promise<{ url: string; expiresAt: Date }> {
    const file = await this.findById(id, userId, tenantId);

    // Verificar permissões de download
    if (!file.hasPermission(userId, 'download')) {
      throw new ForbiddenException('Sem permissão para baixar este arquivo');
    }

    // Marcar como baixado
    file.markAsDownloaded();
    await this.fileRepository.save(file);

    // Gerar URL assinada (por enquanto, URL simples)
    const expiresAt = new Date(Date.now() + duration * 1000);
    const url = `/api/v1/files/${id}/download?expires=${expiresAt.getTime()}`;

    return { url, expiresAt };
  }

  // Métodos privados

  private async validateFile(
    file: Express.Multer.File,
    expectedCategory?: FileCategory,
  ): Promise<void> {
    if (!file) {
      throw new BadRequestException('Nenhum arquivo fornecido');
    }

    // Verificar tamanho
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `Arquivo muito grande. Máximo: ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    if (file.size === 0) {
      throw new BadRequestException('Arquivo vazio');
    }

    // Verificar extensão proibida
    const extension = path.extname(file.originalname).slice(1).toLowerCase();
    if (isForbiddenExtension(extension)) {
      throw new BadRequestException(
        'Tipo de arquivo não permitido por segurança',
      );
    }

    // Verificar categoria se especificada
    if (expectedCategory) {
      const maxSize = getMaxFileSize(expectedCategory);
      if (file.size > maxSize) {
        throw new BadRequestException(
          `Arquivo muito grande para categoria ${expectedCategory}. Máximo: ${maxSize / 1024 / 1024}MB`,
        );
      }

      if (!isMimeTypeAllowed(file.mimetype, expectedCategory)) {
        throw new BadRequestException(
          `Tipo MIME ${file.mimetype} não permitido para categoria ${expectedCategory}`,
        );
      }
    }
  }

  private async detectFileType(file: Express.Multer.File): Promise<FileType> {
    // Detectar tipo real do arquivo pelo conteúdo
    const detected = await fileType.fromBuffer(file.buffer);

    if (detected) {
      // Mapear extensão detectada para FileType
      const extension = detected.ext.toLowerCase();
      const fileTypeValue = Object.values(FileType).find(
        (type) => type === extension,
      );
      if (fileTypeValue) {
        return fileTypeValue;
      }
    }

    // Fallback para extensão do nome do arquivo
    const extension = path.extname(file.originalname).slice(1).toLowerCase();
    const fileTypeValue = Object.values(FileType).find(
      (type) => type === extension,
    );

    if (fileTypeValue) {
      return fileTypeValue;
    }

    throw new BadRequestException('Tipo de arquivo não suportado');
  }

  private async performSecurityChecks(
    file: Express.Multer.File,
    category: FileCategory,
  ): Promise<void> {
    // Verificar Magic Numbers (assinatura de arquivo)
    const buffer = file.buffer.slice(0, 100);

    // Verificar se não é um executável disfarçado
    const suspiciousHeaders = [
      Buffer.from([0x4d, 0x5a]), // MZ (executável Windows)
      Buffer.from([0x7f, 0x45, 0x4c, 0x46]), // ELF (executável Linux)
      Buffer.from([0xfe, 0xed, 0xfa, 0xce]), // Mach-O (executável macOS)
    ];

    for (const header of suspiciousHeaders) {
      if (buffer.indexOf(header) === 0) {
        throw new BadRequestException(
          'Arquivo executável detectado - upload rejeitado',
        );
      }
    }

    // Verificar scripts embutidos em documentos (básico)
    const content = buffer.toString('utf8', 0, Math.min(1000, buffer.length));
    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /vbscript:/i,
      /onload=/i,
      /onerror=/i,
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(content)) {
        throw new BadRequestException('Conteúdo suspeito detectado no arquivo');
      }
    }
  }

  private generateUniqueFilename(originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = path.extname(originalName);
    const basename = path.basename(originalName, extension);

    // Sanitizar nome do arquivo
    const sanitizedBasename = basename
      .replace(/[^a-zA-Z0-9._-]/g, '_')
      .substring(0, 50);

    return `${timestamp}_${random}_${sanitizedBasename}${extension}`;
  }

  private async saveFile(
    buffer: Buffer,
    filename: string,
    category: FileCategory,
  ): Promise<string> {
    const categoryDir = path.join(this.uploadPath, category);
    await this.ensureDirectory(categoryDir);

    const filepath = path.join(categoryDir, filename);
    await fs.writeFile(filepath, buffer);

    return filepath;
  }

  private async calculateHashes(
    buffer: Buffer,
  ): Promise<{ sha256: string; md5: string }> {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex');
    const md5 = crypto.createHash('md5').update(buffer).digest('hex');
    return { sha256, md5 };
  }

  private async ensureUploadDirectories(): Promise<void> {
    await this.ensureDirectory(this.uploadPath);

    // Criar diretórios para cada categoria
    for (const category of this.allowedCategories) {
      await this.ensureDirectory(path.join(this.uploadPath, category));
    }
  }

  private async ensureDirectory(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  private async processFileAsync(fileId: string): Promise<void> {
    // Processar arquivo em background
    try {
      const file = await this.fileRepository.findOne({ where: { id: fileId } });
      if (!file) return;

      file.updateProcessingStatus(FileStatus.PROCESSING, {
        startedAt: new Date(),
        steps: [
          {
            name: 'metadata_extraction',
            status: 'running',
            startedAt: new Date(),
          },
        ],
      });
      await this.fileRepository.save(file);

      // Extrair metadados baseado na categoria
      const metadata = await this.extractMetadata(file);
      file.metadata = metadata;

      // Gerar thumbnail se for imagem
      if (file.category === FileCategory.IMAGE) {
        await this.generateThumbnail(file);
      }

      file.updateProcessingStatus(FileStatus.PROCESSED);
      await this.fileRepository.save(file);
    } catch (error) {
      console.error(`Erro processando arquivo ${fileId}:`, error);

      const file = await this.fileRepository.findOne({ where: { id: fileId } });
      if (file) {
        file.updateProcessingStatus(FileStatus.FAILED, {
          errors: [error.message],
        });
        await this.fileRepository.save(file);
      }
    }
  }

  private async extractMetadata(file: File): Promise<Record<string, any>> {
    const metadata: Record<string, any> = {};

    try {
      if (file.category === FileCategory.IMAGE) {
        // Extrair metadados de imagem com Sharp
        const buffer = await fs.readFile(file.path);
        const imageMetadata = await sharp(buffer).metadata();

        metadata.dimensions = {
          width: imageMetadata.width,
          height: imageMetadata.height,
        };
        metadata.colorSpace = imageMetadata.space;
        metadata.compression = imageMetadata.compression;
        metadata.dpi = imageMetadata.density
          ? { x: imageMetadata.density, y: imageMetadata.density }
          : undefined;
      }

      // Adicionar metadados básicos do arquivo
      const stats = await fs.stat(file.path);
      metadata.fileStats = {
        birthtime: stats.birthtime,
        mtime: stats.mtime,
        size: stats.size,
      };
    } catch (error) {
      console.error('Erro extraindo metadados:', error);
      metadata.extractionError = error.message;
    }

    return metadata;
  }

  private async generateThumbnail(file: File): Promise<void> {
    try {
      if (file.category !== FileCategory.IMAGE) return;

      const buffer = await fs.readFile(file.path);
      const thumbnailBuffer = await sharp(buffer)
        .resize(300, 300, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toBuffer();

      const thumbnailFilename = `thumb_${file.filename}.jpg`;
      const thumbnailPath = path.join(
        path.dirname(file.path),
        'thumbnails',
        thumbnailFilename,
      );

      await this.ensureDirectory(path.dirname(thumbnailPath));
      await fs.writeFile(thumbnailPath, thumbnailBuffer);

      // Adicionar arquivo derivado
      file.addDerivedFile({
        type: 'thumbnail',
        filename: thumbnailFilename,
        path: thumbnailPath,
        size: thumbnailBuffer.length,
        mimeType: 'image/jpeg',
        dimensions: { width: 300, height: 300 },
      });
    } catch (error) {
      console.error('Erro gerando thumbnail:', error);
    }
  }
}
