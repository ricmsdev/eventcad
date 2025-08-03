import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  IsUUID,
  MaxLength,
  IsDateString,
  ValidateNested,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FileCategory } from '../../../common/enums/file-type.enum';

/**
 * DTO para upload de arquivo único
 */
export class UploadFileDto {
  @ApiPropertyOptional({
    description: 'Categoria esperada do arquivo',
    example: FileCategory.PLANT,
    enum: FileCategory,
  })
  @IsOptional()
  @IsEnum(FileCategory, { message: 'Categoria deve ser um valor válido' })
  category?: FileCategory;

  @ApiPropertyOptional({
    description: 'Tipo de entidade relacionada',
    example: 'evento',
  })
  @IsOptional()
  @IsString({ message: 'Tipo de entidade deve ser uma string' })
  @MaxLength(50, {
    message: 'Tipo de entidade não pode ter mais que 50 caracteres',
  })
  entityType?: string;

  @ApiPropertyOptional({
    description: 'ID da entidade relacionada (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID da entidade deve ser um UUID válido' })
  entityId?: string;

  @ApiPropertyOptional({
    description: 'Indica se o arquivo deve ser público',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic deve ser um boolean' })
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Data de expiração do arquivo (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Comentário sobre o arquivo',
    example: 'Planta baixa do pavilhão principal - versão revisada',
  })
  @IsOptional()
  @IsString({ message: 'Comentário deve ser uma string' })
  @MaxLength(500, {
    message: 'Comentário não pode ter mais que 500 caracteres',
  })
  comment?: string;

  @ApiPropertyOptional({
    description: 'Tags para categorização do arquivo',
    example: ['planta', 'pavilhao-a', 'revisao-2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Tags devem ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Configurações adicionais',
    example: { autoProcess: true, generateThumbnail: true },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações devem ser um objeto' })
  settings?: Record<string, any>;
}

/**
 * DTO para upload múltiplo
 */
export class UploadMultipleFilesDto extends UploadFileDto {
  @ApiPropertyOptional({
    description: 'Processa arquivos de forma assíncrona',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'processAsync deve ser um boolean' })
  processAsync?: boolean;

  @ApiPropertyOptional({
    description: 'Agrupa arquivos relacionados',
    example: 'plantas-pavilhao-a',
  })
  @IsOptional()
  @IsString({ message: 'ID do grupo deve ser uma string' })
  @MaxLength(100, {
    message: 'ID do grupo não pode ter mais que 100 caracteres',
  })
  groupId?: string;
}

/**
 * DTO para resposta de upload
 */
export class UploadResponseDto {
  @ApiProperty({
    description: 'ID único do arquivo',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'planta-pavilhao.dwg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Nome único gerado',
    example: '1640995200000_planta-pavilhao.dwg',
  })
  filename: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'Tipo MIME do arquivo',
    example: 'application/dwg',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Categoria do arquivo',
    example: FileCategory.PLANT,
    enum: FileCategory,
  })
  category: FileCategory;

  @ApiProperty({
    description: 'Status do processamento',
    example: 'uploaded',
  })
  status: string;

  @ApiProperty({
    description: 'URL para acesso (se disponível)',
    example: 'https://storage.eventcad.com/files/abc123.dwg',
  })
  url?: string;

  @ApiProperty({
    description: 'Data de upload',
    example: '2025-01-01T12:00:00.000Z',
  })
  uploadedAt: Date;
}

/**
 * DTO para resposta de upload múltiplo
 */
export class UploadMultipleResponseDto {
  @ApiProperty({
    description: 'Lista de arquivos enviados com sucesso',
    type: [UploadResponseDto],
  })
  @ValidateNested({ each: true })
  @Type(() => UploadResponseDto)
  files: UploadResponseDto[];

  @ApiProperty({
    description: 'Lista de erros de upload',
    example: [
      {
        filename: 'arquivo-invalido.exe',
        error: 'Tipo de arquivo não permitido',
      },
    ],
  })
  errors?: {
    filename: string;
    error: string;
  }[];

  @ApiProperty({
    description: 'Estatísticas do upload',
    example: {
      totalFiles: 5,
      successCount: 4,
      errorCount: 1,
      totalSize: 10485760,
    },
  })
  stats: {
    totalFiles: number;
    successCount: number;
    errorCount: number;
    totalSize: number;
  };

  @ApiPropertyOptional({
    description: 'ID do grupo (se fornecido)',
    example: 'plantas-pavilhao-a',
  })
  groupId?: string;
}

/**
 * DTO para atualização de arquivo
 */
export class UpdateFileDto {
  @ApiPropertyOptional({
    description: 'Novo nome de exibição',
    example: 'Planta Baixa - Pavilhão A (Revisão 3)',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MaxLength(255, { message: 'Nome não pode ter mais que 255 caracteres' })
  displayName?: string;

  @ApiPropertyOptional({
    description: 'Indica se o arquivo deve ser público',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'isPublic deve ser um boolean' })
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Data de expiração do arquivo',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Tags para categorização',
    example: ['planta', 'revisao-3', 'aprovado'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Tags devem ser um array' })
  @IsString({ each: true, message: 'Cada tag deve ser uma string' })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'Configurações adicionais',
    example: { priority: 'high', autoProcess: true },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações devem ser um objeto' })
  settings?: Record<string, any>;
}

/**
 * DTO para compartilhamento de arquivo
 */
export class ShareFileDto {
  @ApiProperty({
    description: 'IDs dos usuários com quem compartilhar',
    example: ['user1-uuid', 'user2-uuid'],
    type: [String],
  })
  @IsArray({ message: 'userIds deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  userIds: string[];

  @ApiProperty({
    description: 'Permissões a conceder',
    example: ['view', 'download'],
    type: [String],
  })
  @IsArray({ message: 'Permissões devem ser um array' })
  @IsEnum(['view', 'download', 'edit', 'delete'], {
    each: true,
    message: 'Cada permissão deve ser: view, download, edit ou delete',
  })
  permissions: ('view' | 'download' | 'edit' | 'delete')[];

  @ApiPropertyOptional({
    description: 'Data de expiração do compartilhamento',
    example: '2025-01-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data de expiração deve ser uma data válida' })
  expiresAt?: string;

  @ApiPropertyOptional({
    description: 'Mensagem para os usuários',
    example: 'Confira a nova versão da planta do pavilhão A',
  })
  @IsOptional()
  @IsString({ message: 'Mensagem deve ser uma string' })
  @MaxLength(500, { message: 'Mensagem não pode ter mais que 500 caracteres' })
  message?: string;
}

/**
 * DTO para obter URL de download
 */
export class GetDownloadUrlDto {
  @ApiPropertyOptional({
    description: 'Duração da URL em segundos',
    example: 3600,
    default: 3600,
  })
  @IsOptional()
  duration?: number;

  @ApiPropertyOptional({
    description: 'Força download ao invés de visualização',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'forceDownload deve ser um boolean' })
  forceDownload?: boolean;
}
