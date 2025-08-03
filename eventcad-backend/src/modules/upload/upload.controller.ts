import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Res,
  StreamableFile,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';
import { UploadService } from './upload.service';
import {
  UploadFileDto,
  UploadMultipleFilesDto,
  UpdateFileDto,
  ShareFileDto,
  GetDownloadUrlDto,
  UploadResponseDto,
  UploadMultipleResponseDto,
} from './dto/upload.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { FileCategory, FileStatus } from '../../common/enums/file-type.enum';

/**
 * Controller para upload e gestão de arquivos do EventCAD+
 *
 * Endpoints principais:
 * - Upload de arquivo único e múltiplo
 * - Gestão de arquivos (CRUD)
 * - Download seguro com URLs assinadas
 * - Compartilhamento e permissões
 * - Metadados e processamento
 */
@ApiTags('Files & Upload')
@Controller('files')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  /**
   * Upload de arquivo único
   */
  @Post('upload')
  @Roles(UserRole.OPERATOR)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de arquivo único',
    description:
      'Realiza upload seguro de um arquivo com validação e processamento',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo a ser enviado',
        },
        category: {
          type: 'string',
          enum: Object.values(FileCategory),
          description: 'Categoria esperada do arquivo',
        },
        entityType: {
          type: 'string',
          description: 'Tipo de entidade relacionada',
        },
        entityId: {
          type: 'string',
          description: 'ID da entidade relacionada',
        },
        isPublic: {
          type: 'boolean',
          description: 'Arquivo público',
        },
        comment: {
          type: 'string',
          description: 'Comentário sobre o arquivo',
        },
      },
      required: ['file'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivo enviado com sucesso',
    type: UploadResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou dados incorretos',
  })
  @ApiResponse({
    status: 413,
    description: 'Arquivo muito grande',
  })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadFileDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const uploadedFile = await this.uploadService.uploadFile(
      file,
      uploadDto,
      userId,
      tenantId,
    );

    return {
      id: uploadedFile.id,
      originalName: uploadedFile.originalName,
      filename: uploadedFile.filename,
      size: uploadedFile.size,
      mimeType: uploadedFile.mimeType,
      category: uploadedFile.category,
      status: uploadedFile.status,
      uploadedAt: uploadedFile.createdAt,
    };
  }

  /**
   * Upload múltiplo de arquivos
   */
  @Post('upload/multiple')
  @Roles(UserRole.OPERATOR)
  @UseInterceptors(FilesInterceptor('files', 20)) // Máximo 20 arquivos
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload múltiplo de arquivos',
    description: 'Realiza upload de múltiplos arquivos simultaneamente',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
          description: 'Arquivos a serem enviados (máximo 20)',
        },
        category: {
          type: 'string',
          enum: Object.values(FileCategory),
          description: 'Categoria esperada dos arquivos',
        },
        processAsync: {
          type: 'boolean',
          description: 'Processar arquivos de forma assíncrona',
        },
        groupId: {
          type: 'string',
          description: 'ID do grupo para arquivos relacionados',
        },
      },
      required: ['files'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Arquivos enviados com sucesso',
    type: UploadMultipleResponseDto,
  })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() uploadDto: UploadMultipleFilesDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const result = await this.uploadService.uploadMultipleFiles(
      files,
      uploadDto,
      userId,
      tenantId,
    );

    return {
      files: result.files.map((file) => ({
        id: file.id,
        originalName: file.originalName,
        filename: file.filename,
        size: file.size,
        mimeType: file.mimeType,
        category: file.category,
        status: file.status,
        uploadedAt: file.createdAt,
      })),
      errors: result.errors,
      stats: result.stats,
      groupId: uploadDto.groupId,
    };
  }

  /**
   * Lista arquivos com filtros
   */
  @Get()
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar arquivos',
    description: 'Lista arquivos do tenant com filtros e paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items por página (padrão: 20, máx: 100)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    enum: FileCategory,
    description: 'Filtro por categoria',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: FileStatus,
    description: 'Filtro por status',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    description: 'Filtro por tipo de entidade',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    description: 'Filtro por ID da entidade',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome do arquivo',
  })
  @ApiQuery({
    name: 'isPublic',
    required: false,
    description: 'Filtro por arquivos públicos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de arquivos retornada com sucesso',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('category') category?: FileCategory,
    @Query('status') status?: FileStatus,
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('search') search?: string,
    @Query('isPublic') isPublic?: boolean,
  ) {
    return this.uploadService.findAll(tenantId, {
      page: page ? parseInt(page.toString(), 10) : undefined,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      category,
      status,
      entityType,
      entityId,
      search,
      isPublic,
    });
  }

  /**
   * Busca arquivo por ID
   */
  @Get(':id')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Buscar arquivo por ID',
    description: 'Retorna detalhes completos de um arquivo específico',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Arquivo não encontrado',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para visualizar este arquivo',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.uploadService.findById(id, userId, tenantId);
  }

  /**
   * Atualiza arquivo
   */
  @Patch(':id')
  @Roles(UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Atualizar arquivo',
    description: 'Atualiza metadados e configurações de um arquivo',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este arquivo',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateFileDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.uploadService.update(id, updateDto, userId, tenantId);
  }

  /**
   * Remove arquivo
   */
  @Delete(':id')
  @Roles(UserRole.OPERATOR)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover arquivo',
    description: 'Remove um arquivo do sistema (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({
    status: 204,
    description: 'Arquivo removido com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para excluir este arquivo',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.uploadService.remove(id, userId, tenantId, userRole);
  }

  /**
   * Compartilha arquivo
   */
  @Post(':id/share')
  @Roles(UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Compartilhar arquivo',
    description: 'Compartilha arquivo com outros usuários',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Arquivo compartilhado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Apenas o dono do arquivo pode compartilhá-lo',
  })
  async shareFile(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() shareDto: ShareFileDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.uploadService.shareFile(id, shareDto, userId, tenantId);
  }

  /**
   * Gera URL de download
   */
  @Post(':id/download-url')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Gerar URL de download',
    description: 'Gera URL segura para download do arquivo',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'URL de download gerada',
    schema: {
      properties: {
        url: { type: 'string' },
        expiresAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  async getDownloadUrl(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() downloadDto: GetDownloadUrlDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.uploadService.getDownloadUrl(
      id,
      userId,
      tenantId,
      downloadDto.duration || 3600,
    );
  }

  /**
   * Download direto do arquivo
   */
  @Get(':id/download')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Download direto',
    description: 'Realiza download direto do arquivo',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiQuery({
    name: 'expires',
    required: false,
    description: 'Timestamp de expiração',
  })
  @ApiResponse({
    status: 200,
    description: 'Arquivo baixado com sucesso',
  })
  async downloadFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
    @Query('expires') expires?: string,
    @Res({ passthrough: true }) res?: Response,
  ) {
    // Verificar se URL não expirou
    if (expires) {
      const expirationTime = parseInt(expires, 10);
      if (Date.now() > expirationTime) {
        throw new BadRequestException('URL de download expirada');
      }
    }

    const file = await this.uploadService.findById(id, userId, tenantId);

    // Verificar permissões
    if (!file.hasPermission(userId, 'download')) {
      throw new ForbiddenException('Sem permissão para baixar este arquivo');
    }

    // Ler arquivo do disco
    const fileBuffer = await fs.readFile(file.path);

    // Configurar headers
    if (res) {
      res.set({
        'Content-Type': file.mimeType,
        'Content-Disposition': `attachment; filename="${file.originalName}"`,
        'Content-Length': file.size.toString(),
      });
    }

    // Marcar como baixado será feito pelo service
    // O repository não é público, será tratado internamente

    return new StreamableFile(fileBuffer);
  }

  /**
   * Visualização/preview do arquivo
   */
  @Get(':id/preview')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Preview do arquivo',
    description: 'Visualização inline do arquivo (para imagens, PDFs, etc.)',
  })
  @ApiParam({ name: 'id', description: 'ID do arquivo (UUID)' })
  @ApiQuery({
    name: 'size',
    required: false,
    description: 'Tamanho do preview (thumbnail, small, medium, large)',
  })
  @ApiResponse({
    status: 200,
    description: 'Preview gerado com sucesso',
  })
  async previewFile(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
    @Query('size') size = 'medium',
    @Res({ passthrough: true }) res?: Response,
  ) {
    const file = await this.uploadService.findById(id, userId, tenantId);

    // Verificar se pode visualizar
    if (!file.hasPermission(userId, 'view')) {
      throw new ForbiddenException(
        'Sem permissão para visualizar este arquivo',
      );
    }

    let fileBuffer: Buffer;
    let contentType = file.mimeType;

    // Se tem thumbnail e foi solicitado, usar thumbnail
    if (size === 'thumbnail' && file.derivedFiles) {
      const thumbnail = file.derivedFiles.find((df) => df.type === 'thumbnail');
      if (thumbnail) {
        fileBuffer = await fs.readFile(thumbnail.path);
        contentType = thumbnail.mimeType;
      } else {
        fileBuffer = await fs.readFile(file.path);
      }
    } else {
      fileBuffer = await fs.readFile(file.path);
    }

    // Configurar headers para visualização inline
    if (res) {
      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `inline; filename="${file.originalName}"`,
        'Cache-Control': 'public, max-age=3600',
      });
    }

    // Marcar como acessado será feito pelo service
    // O repository não é público, será tratado internamente

    return new StreamableFile(fileBuffer);
  }

  /**
   * Busca arquivos por entidade
   */
  @Get('entity/:entityType/:entityId')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Arquivos por entidade',
    description: 'Lista arquivos relacionados a uma entidade específica',
  })
  @ApiParam({ name: 'entityType', description: 'Tipo da entidade' })
  @ApiParam({ name: 'entityId', description: 'ID da entidade (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Arquivos da entidade retornados',
  })
  async findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId', ParseUUIDPipe) entityId: string,
    @CurrentTenant() tenantId: string,
    @Query('category') category?: FileCategory,
  ) {
    return this.uploadService.findAll(tenantId, {
      entityType,
      entityId,
      category,
      limit: 100,
    });
  }

  /**
   * Estatísticas de upload
   */
  @Get('stats/overview')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de arquivos',
    description: 'Retorna estatísticas de uso de armazenamento e uploads',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getStats(@CurrentTenant() tenantId: string) {
    const result = await this.uploadService.findAll(tenantId, { limit: 1000 });

    const stats = {
      totalFiles: result.total,
      totalSize: result.data.reduce((sum, file) => sum + file.size, 0),
      byCategory: {},
      byStatus: {},
      recentUploads: result.data.slice(0, 10),
    };

    // Agregar por categoria
    result.data.forEach((file) => {
      stats.byCategory[file.category] =
        (stats.byCategory[file.category] || 0) + 1;
    });

    // Agregar por status
    result.data.forEach((file) => {
      stats.byStatus[file.status] = (stats.byStatus[file.status] || 0) + 1;
    });

    return stats;
  }
}
