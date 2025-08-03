import {
  IsString,
  IsOptional,
  IsEnum,
  IsUUID,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PlantaTipo,
  PlantaStatus,
} from '../../../common/enums/planta-tipo.enum';

/**
 * DTO para upload de planta técnica
 */
export class UploadPlantaDto {
  @ApiProperty({
    description: 'Tipo específico da planta técnica',
    example: PlantaTipo.PLANTA_BAIXA,
    enum: PlantaTipo,
  })
  @IsEnum(PlantaTipo, { message: 'Tipo de planta deve ser um valor válido' })
  plantaTipo: PlantaTipo;

  @ApiPropertyOptional({
    description: 'Escala da planta (ex: 1:100, 1:50)',
    example: '1:100',
  })
  @IsOptional()
  @IsString({ message: 'Escala deve ser uma string' })
  @MaxLength(20, { message: 'Escala não pode ter mais que 20 caracteres' })
  escala?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida utilizada',
    example: 'metros',
  })
  @IsOptional()
  @IsString({ message: 'Unidade de medida deve ser uma string' })
  @MaxLength(50, {
    message: 'Unidade de medida não pode ter mais que 50 caracteres',
  })
  unidadeMedida?: string;

  @ApiPropertyOptional({
    description: 'Sistema de coordenadas utilizado',
    example: 'SIRGAS2000',
  })
  @IsOptional()
  @IsString({ message: 'Sistema de coordenadas deve ser uma string' })
  @MaxLength(20, {
    message: 'Sistema de coordenadas não pode ter mais que 20 caracteres',
  })
  sistemaCoordenadas?: string;

  @ApiPropertyOptional({
    description: 'ID do evento relacionado (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do evento deve ser um UUID válido' })
  eventoId?: string;

  @ApiPropertyOptional({
    description: 'ID do engenheiro responsável (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do engenheiro deve ser um UUID válido' })
  engenheiroResponsavelId?: string;

  @ApiPropertyOptional({
    description: 'ID da planta base/referência (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID da planta base deve ser um UUID válido' })
  plantaBaseId?: string;

  @ApiPropertyOptional({
    description: 'Processar automaticamente com IA',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'processarIA deve ser um boolean' })
  processarIA?: boolean;

  @ApiPropertyOptional({
    description: 'Configurações específicas de processamento',
    example: {
      detectObjects: true,
      extractText: true,
      validateCompliance: true,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações de processamento devem ser um objeto' })
  processingConfig?: {
    detectObjects?: boolean;
    extractText?: boolean;
    validateCompliance?: boolean;
    analyzeCompatibility?: boolean;
    generateThumbnail?: boolean;
    extract3D?: boolean;
  };
}

/**
 * DTO para atualização de planta
 */
export class UpdatePlantaDto {
  @ApiPropertyOptional({
    description: 'Tipo específico da planta técnica',
    example: PlantaTipo.PLANTA_BAIXA,
    enum: PlantaTipo,
  })
  @IsOptional()
  @IsEnum(PlantaTipo, { message: 'Tipo de planta deve ser um valor válido' })
  plantaTipo?: PlantaTipo;

  @ApiPropertyOptional({
    description: 'Status da planta',
    example: PlantaStatus.APPROVED,
    enum: PlantaStatus,
  })
  @IsOptional()
  @IsEnum(PlantaStatus, { message: 'Status deve ser um valor válido' })
  plantaStatus?: PlantaStatus;

  @ApiPropertyOptional({
    description: 'Escala da planta',
    example: '1:50',
  })
  @IsOptional()
  @IsString({ message: 'Escala deve ser uma string' })
  @MaxLength(20, { message: 'Escala não pode ter mais que 20 caracteres' })
  escala?: string;

  @ApiPropertyOptional({
    description: 'Unidade de medida',
    example: 'milímetros',
  })
  @IsOptional()
  @IsString({ message: 'Unidade de medida deve ser uma string' })
  @MaxLength(50, {
    message: 'Unidade de medida não pode ter mais que 50 caracteres',
  })
  unidadeMedida?: string;

  @ApiPropertyOptional({
    description: 'Sistema de coordenadas',
    example: 'UTM23S',
  })
  @IsOptional()
  @IsString({ message: 'Sistema de coordenadas deve ser uma string' })
  @MaxLength(20, {
    message: 'Sistema de coordenadas não pode ter mais que 20 caracteres',
  })
  sistemaCoordenadas?: string;

  @ApiPropertyOptional({
    description: 'ID do engenheiro responsável',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do engenheiro deve ser um UUID válido' })
  engenheiroResponsavelId?: string;

  @ApiPropertyOptional({
    description: 'Configurações de visualização',
    example: {
      viewerType: '2d',
      defaultView: { center: { x: 0, y: 0 }, zoom: 1 },
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações de visualização devem ser um objeto' })
  configuracaoVisualizacao?: Record<string, any>;
}

/**
 * DTO para validação técnica de planta
 */
export class ValidacaoTecnicaDto {
  @ApiProperty({
    description: 'Tipo de validação',
    example: 'Análise Estrutural',
  })
  @IsString({ message: 'Tipo de validação deve ser uma string' })
  @MinLength(3, { message: 'Tipo deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Tipo não pode ter mais que 100 caracteres' })
  tipo: string;

  @ApiProperty({
    description: 'Status da validação',
    example: 'aprovado',
    enum: ['aprovado', 'rejeitado', 'pendente', 'condicional'],
  })
  @IsEnum(['aprovado', 'rejeitado', 'pendente', 'condicional'], {
    message: 'Status deve ser: aprovado, rejeitado, pendente ou condicional',
  })
  status: 'aprovado' | 'rejeitado' | 'pendente' | 'condicional';

  @ApiPropertyOptional({
    description: 'Observações sobre a validação',
    example: 'Estrutura aprovada conforme NBR 8800',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  @MaxLength(1000, {
    message: 'Observações não podem ter mais que 1000 caracteres',
  })
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Checklist de verificação',
    example: [
      { item: 'Dimensões conferidas', status: 'ok' },
      { item: 'Materiais especificados', status: 'ok' },
    ],
  })
  @IsOptional()
  @IsArray({ message: 'Checklist deve ser um array' })
  @ValidateNested({ each: true })
  checklist?: ChecklistItemDto[];
}

/**
 * DTO para item de checklist
 */
export class ChecklistItemDto {
  @ApiProperty({
    description: 'Descrição do item',
    example: 'Dimensões conferidas',
  })
  @IsString({ message: 'Item deve ser uma string' })
  @MinLength(3, { message: 'Item deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Item não pode ter mais que 200 caracteres' })
  item: string;

  @ApiProperty({
    description: 'Status do item',
    example: 'ok',
    enum: ['ok', 'nok', 'na'],
  })
  @IsEnum(['ok', 'nok', 'na'], {
    message: 'Status deve ser: ok, nok ou na',
  })
  status: 'ok' | 'nok' | 'na';

  @ApiPropertyOptional({
    description: 'Observação sobre o item',
    example: 'Conforme projeto arquitetônico',
  })
  @IsOptional()
  @IsString({ message: 'Observação deve ser uma string' })
  @MaxLength(500, {
    message: 'Observação não pode ter mais que 500 caracteres',
  })
  observacao?: string;
}

/**
 * DTO para revisão de planta
 */
export class RevisaoPlantaDto {
  @ApiProperty({
    description: 'Número da revisão',
    example: 'R01',
  })
  @IsString({ message: 'Número da revisão deve ser uma string' })
  @MinLength(1, { message: 'Número deve ter pelo menos 1 caractere' })
  @MaxLength(20, { message: 'Número não pode ter mais que 20 caracteres' })
  numero: string;

  @ApiProperty({
    description: 'Descrição da revisão',
    example: 'Correção de dimensões conforme solicitação do cliente',
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  @MinLength(10, { message: 'Descrição deve ter pelo menos 10 caracteres' })
  @MaxLength(500, { message: 'Descrição não pode ter mais que 500 caracteres' })
  descricao: string;

  @ApiProperty({
    description: 'Tipo de revisão',
    example: 'revisao',
    enum: ['inicial', 'revisao', 'complementacao', 'correcao'],
  })
  @IsEnum(['inicial', 'revisao', 'complementacao', 'correcao'], {
    message: 'Tipo deve ser: inicial, revisao, complementacao ou correcao',
  })
  tipo: 'inicial' | 'revisao' | 'complementacao' | 'correcao';

  @ApiPropertyOptional({
    description: 'Observações adicionais',
    example: 'Revisão urgente para liberação da obra',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  @MaxLength(1000, {
    message: 'Observações não podem ter mais que 1000 caracteres',
  })
  observacoes?: string;
}

/**
 * DTO para processamento de IA
 */
export class ProcessAIDto {
  @ApiPropertyOptional({
    description: 'Detectar objetos automaticamente',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'detectObjects deve ser um boolean' })
  detectObjects?: boolean;

  @ApiPropertyOptional({
    description: 'Extrair texto da planta',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'extractText deve ser um boolean' })
  extractText?: boolean;

  @ApiPropertyOptional({
    description: 'Validar compliance automaticamente',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'validateCompliance deve ser um boolean' })
  validateCompliance?: boolean;

  @ApiPropertyOptional({
    description: 'Analisar compatibilidade com outras plantas',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'analyzeCompatibility deve ser um boolean' })
  analyzeCompatibility?: boolean;

  @ApiPropertyOptional({
    description: 'IDs das plantas para análise de compatibilidade',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'compatibilityPlants deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  compatibilityPlants?: string[];

  @ApiPropertyOptional({
    description: 'Configurações específicas do modelo de IA',
    example: { confidence_threshold: 0.8, max_objects: 1000 },
  })
  @IsOptional()
  @IsObject({ message: 'aiConfig deve ser um objeto' })
  aiConfig?: Record<string, any>;
}

/**
 * DTO para resposta de upload de planta
 */
export class PlantaResponseDto {
  @ApiProperty({
    description: 'ID único da planta',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nome original do arquivo',
    example: 'planta-baixa-pavilhao.dwg',
  })
  originalName: string;

  @ApiProperty({
    description: 'Tipo da planta',
    example: PlantaTipo.PLANTA_BAIXA,
    enum: PlantaTipo,
  })
  plantaTipo: PlantaTipo;

  @ApiProperty({
    description: 'Status da planta',
    example: PlantaStatus.UPLOADED,
    enum: PlantaStatus,
  })
  plantaStatus: PlantaStatus;

  @ApiProperty({
    description: 'Escala da planta',
    example: '1:100',
  })
  escala?: string;

  @ApiProperty({
    description: 'Tamanho do arquivo em bytes',
    example: 2048576,
  })
  size: number;

  @ApiProperty({
    description: 'Score de qualidade (0-100)',
    example: 85,
  })
  qualityScore: number;

  @ApiProperty({
    description: 'Indica se precisa de revisão manual',
    example: false,
  })
  needsManualReview: boolean;

  @ApiProperty({
    description: 'Indica se está pronta para processamento de IA',
    example: true,
  })
  readyForAI: boolean;

  @ApiProperty({
    description: 'Data de upload',
    example: '2025-01-01T12:00:00.000Z',
  })
  uploadedAt: Date;

  @ApiPropertyOptional({
    description: 'URL para visualização',
    example: 'https://viewer.eventcad.com/plantas/123...',
  })
  viewerUrl?: string;
}

/**
 * DTO para busca de plantas
 */
export class SearchPlantasDto {
  @ApiPropertyOptional({
    description: 'Página para paginação',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Página deve ser um número' })
  @Min(1, { message: 'Página deve ser pelo menos 1' })
  page?: number;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limite deve ser um número' })
  @Min(1, { message: 'Limite deve ser pelo menos 1' })
  @Max(100, { message: 'Limite não pode exceder 100' })
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtro por tipo de planta',
    enum: PlantaTipo,
  })
  @IsOptional()
  @IsEnum(PlantaTipo, { message: 'Tipo deve ser um valor válido' })
  plantaTipo?: PlantaTipo;

  @ApiPropertyOptional({
    description: 'Filtro por status',
    enum: PlantaStatus,
  })
  @IsOptional()
  @IsEnum(PlantaStatus, { message: 'Status deve ser um valor válido' })
  plantaStatus?: PlantaStatus;

  @ApiPropertyOptional({
    description: 'Filtro por evento',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do evento deve ser um UUID válido' })
  eventoId?: string;

  @ApiPropertyOptional({
    description: 'Filtro por escala',
    example: '1:100',
  })
  @IsOptional()
  @IsString({ message: 'Escala deve ser uma string' })
  escala?: string;

  @ApiPropertyOptional({
    description: 'Busca por nome ou descrição',
    example: 'pavilhao a',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(100, { message: 'Busca não pode ter mais que 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Filtro por score mínimo de qualidade',
    example: 80,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Score mínimo deve ser um número' })
  @Min(0, { message: 'Score mínimo não pode ser negativo' })
  @Max(100, { message: 'Score mínimo não pode exceder 100' })
  minQualityScore?: number;

  @ApiPropertyOptional({
    description: 'Apenas plantas que precisam de revisão',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'needsReview deve ser um boolean' })
  needsReview?: boolean;

  @ApiPropertyOptional({
    description: 'Apenas plantas prontas para IA',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'readyForAI deve ser um boolean' })
  readyForAI?: boolean;
}
