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
  Min,
  Max,
  MinLength,
  MaxLength,
  IsInt,
  IsDateString,
  IsDecimal,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  InfraObjectStatus,
  InfraObjectSource,
  SafetyCriticality,
  ValidationType,
  ConfidenceLevel,
} from '../../../common/enums/infra-object.enum';

/**
 * DTO para geometria do objeto
 */
export class GeometryDto {
  @ApiProperty({
    description: 'Bounding box do objeto',
    example: { x: 100, y: 200, width: 50, height: 30 },
  })
  @IsObject({ message: 'BoundingBox deve ser um objeto' })
  @ValidateNested()
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };

  @ApiProperty({
    description: 'Centro do objeto',
    example: { x: 125, y: 215 },
  })
  @IsObject({ message: 'Center deve ser um objeto' })
  @ValidateNested()
  center: {
    x: number;
    y: number;
  };

  @ApiPropertyOptional({
    description: 'Rotação em graus',
    example: 45,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Rotação deve ser um número' })
  @Min(-360, { message: 'Rotação mínima é -360°' })
  @Max(360, { message: 'Rotação máxima é 360°' })
  rotation?: number;

  @ApiPropertyOptional({
    description: 'Pontos específicos do objeto',
    example: [{ x: 100, y: 200, type: 'anchor' }],
  })
  @IsOptional()
  @IsArray({ message: 'Points deve ser um array' })
  points?: {
    x: number;
    y: number;
    type?: 'anchor' | 'control' | 'reference';
  }[];

  @ApiPropertyOptional({
    description: 'Área calculada',
    example: 1500,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Área deve ser um número' })
  @Min(0, { message: 'Área não pode ser negativa' })
  area?: number;

  @ApiPropertyOptional({
    description: 'Perímetro calculado',
    example: 160,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Perímetro deve ser um número' })
  @Min(0, { message: 'Perímetro não pode ser negativo' })
  perimeter?: number;
}

/**
 * DTO para criar objeto de infraestrutura
 */
export class CreateInfraObjectDto {
  @ApiProperty({
    description: 'Nome/identificador do objeto',
    example: 'Extintor PQS 001',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome não pode ter mais que 100 caracteres' })
  name: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do objeto',
    example:
      'Extintor de pó químico seco localizado próximo à entrada principal',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, {
    message: 'Descrição não pode ter mais que 1000 caracteres',
  })
  description?: string;

  @ApiProperty({
    description: 'ID da planta onde está o objeto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID(4, { message: 'ID da planta deve ser um UUID válido' })
  plantaId: string;

  @ApiPropertyOptional({
    description: 'ID do job de IA que detectou o objeto',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do job de IA deve ser um UUID válido' })
  aiJobId?: string;

  @ApiProperty({
    description: 'Categoria do objeto',
    example: 'FIRE_SAFETY',
  })
  @IsString({ message: 'Categoria deve ser uma string' })
  @MinLength(1, { message: 'Categoria não pode estar vazia' })
  @MaxLength(50, { message: 'Categoria não pode ter mais que 50 caracteres' })
  objectCategory: string;

  @ApiProperty({
    description: 'Tipo específico do objeto',
    example: 'FIRE_EXTINGUISHER',
  })
  @IsString({ message: 'Tipo deve ser uma string' })
  @MinLength(1, { message: 'Tipo não pode estar vazio' })
  @MaxLength(50, { message: 'Tipo não pode ter mais que 50 caracteres' })
  objectType: string;

  @ApiPropertyOptional({
    description: 'Subtipo ou variação específica',
    example: 'PQS_6KG',
  })
  @IsOptional()
  @IsString({ message: 'Subtipo deve ser uma string' })
  @MaxLength(50, { message: 'Subtipo não pode ter mais que 50 caracteres' })
  objectSubtype?: string;

  @ApiPropertyOptional({
    description: 'Origem do objeto',
    example: InfraObjectSource.AI_DETECTION,
    enum: InfraObjectSource,
  })
  @IsOptional()
  @IsEnum(InfraObjectSource, { message: 'Origem deve ser um valor válido' })
  source?: InfraObjectSource;

  @ApiProperty({
    description: 'Geometria e posicionamento do objeto',
    type: GeometryDto,
  })
  @IsObject({ message: 'Geometria deve ser um objeto' })
  @ValidateNested()
  @Type(() => GeometryDto)
  geometry: GeometryDto;

  @ApiPropertyOptional({
    description: 'Propriedades específicas do objeto',
    example: { capacity: '6kg', type: 'PQS', pressure: '12bar' },
  })
  @IsOptional()
  @IsObject({ message: 'Propriedades devem ser um objeto' })
  properties?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Nível de confiança da IA (0.0 a 1.0)',
    example: 0.95,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Confiança deve ser um número' })
  @Min(0, { message: 'Confiança mínima é 0' })
  @Max(1, { message: 'Confiança máxima é 1' })
  confidence?: number;

  @ApiPropertyOptional({
    description: 'Criticidade para segurança',
    example: SafetyCriticality.CRITICAL,
    enum: SafetyCriticality,
  })
  @IsOptional()
  @IsEnum(SafetyCriticality, {
    message: 'Criticidade deve ser um valor válido',
  })
  criticality?: SafetyCriticality;

  @ApiPropertyOptional({
    description: 'Tipos de validação necessários',
    example: [ValidationType.FIRE_SAFETY, ValidationType.COMPLIANCE],
    enum: ValidationType,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Validações deve ser um array' })
  @IsEnum(ValidationType, {
    each: true,
    message: 'Cada validação deve ser válida',
  })
  requiredValidations?: ValidationType[];

  @ApiPropertyOptional({
    description: 'ID do objeto pai (para hierarquias)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do objeto pai deve ser um UUID válido' })
  parentObjectId?: string;

  @ApiPropertyOptional({
    description: 'IDs de objetos relacionados',
    example: ['uuid1', 'uuid2'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Objetos relacionados deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  relatedObjectIds?: string[];

  @ApiPropertyOptional({
    description: 'Metadados da detecção por IA',
    example: {
      model: 'fire_safety_ai',
      modelVersion: '1.2.0',
      processingTime: 120,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Metadados devem ser um objeto' })
  detectionMetadata?: Record<string, any>;
}

/**
 * DTO para atualizar objeto
 */
export class UpdateInfraObjectDto {
  @ApiPropertyOptional({
    description: 'Nome do objeto',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome não pode ter mais que 100 caracteres' })
  name?: string;

  @ApiPropertyOptional({
    description: 'Descrição do objeto',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, {
    message: 'Descrição não pode ter mais que 1000 caracteres',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Status do objeto',
    enum: InfraObjectStatus,
  })
  @IsOptional()
  @IsEnum(InfraObjectStatus, { message: 'Status deve ser um valor válido' })
  status?: InfraObjectStatus;

  @ApiPropertyOptional({
    description: 'Subtipo do objeto',
  })
  @IsOptional()
  @IsString({ message: 'Subtipo deve ser uma string' })
  @MaxLength(50, { message: 'Subtipo não pode ter mais que 50 caracteres' })
  objectSubtype?: string;

  @ApiPropertyOptional({
    description: 'Nova geometria do objeto',
    type: GeometryDto,
  })
  @IsOptional()
  @IsObject({ message: 'Geometria deve ser um objeto' })
  @ValidateNested()
  @Type(() => GeometryDto)
  geometry?: GeometryDto;

  @ApiPropertyOptional({
    description: 'Propriedades atualizadas',
  })
  @IsOptional()
  @IsObject({ message: 'Propriedades devem ser um objeto' })
  properties?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Criticidade atualizada',
    enum: SafetyCriticality,
  })
  @IsOptional()
  @IsEnum(SafetyCriticality, {
    message: 'Criticidade deve ser um valor válido',
  })
  criticality?: SafetyCriticality;

  @ApiPropertyOptional({
    description: 'Validações necessárias',
    enum: ValidationType,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Validações deve ser um array' })
  @IsEnum(ValidationType, {
    each: true,
    message: 'Cada validação deve ser válida',
  })
  requiredValidations?: ValidationType[];

  @ApiPropertyOptional({
    description: 'IDs de objetos relacionados',
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Objetos relacionados deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  relatedObjectIds?: string[];
}

/**
 * DTO para mover objeto
 */
export class MoveObjectDto {
  @ApiProperty({
    description: 'Nova posição X',
    example: 150,
  })
  @IsNumber({}, { message: 'X deve ser um número' })
  x: number;

  @ApiProperty({
    description: 'Nova posição Y',
    example: 250,
  })
  @IsNumber({}, { message: 'Y deve ser um número' })
  y: number;

  @ApiPropertyOptional({
    description: 'Motivo da movimentação',
    example: 'Ajuste de posicionamento conforme planta atualizada',
  })
  @IsOptional()
  @IsString({ message: 'Motivo deve ser uma string' })
  @MaxLength(200, { message: 'Motivo não pode ter mais que 200 caracteres' })
  reason?: string;
}

/**
 * DTO para redimensionar objeto
 */
export class ResizeObjectDto {
  @ApiProperty({
    description: 'Nova largura',
    example: 60,
  })
  @IsNumber({}, { message: 'Largura deve ser um número' })
  @Min(1, { message: 'Largura mínima é 1' })
  width: number;

  @ApiProperty({
    description: 'Nova altura',
    example: 40,
  })
  @IsNumber({}, { message: 'Altura deve ser um número' })
  @Min(1, { message: 'Altura mínima é 1' })
  height: number;

  @ApiPropertyOptional({
    description: 'Motivo do redimensionamento',
    example: 'Correção de dimensões conforme medições reais',
  })
  @IsOptional()
  @IsString({ message: 'Motivo deve ser uma string' })
  @MaxLength(200, { message: 'Motivo não pode ter mais que 200 caracteres' })
  reason?: string;
}

/**
 * DTO para adicionar anotação
 */
export class AddAnnotationDto {
  @ApiProperty({
    description: 'Tipo da anotação',
    example: 'comment',
    enum: ['comment', 'issue', 'note', 'reminder'],
  })
  @IsEnum(['comment', 'issue', 'note', 'reminder'], {
    message: 'Tipo deve ser: comment, issue, note ou reminder',
  })
  type: 'comment' | 'issue' | 'note' | 'reminder';

  @ApiProperty({
    description: 'Texto da anotação',
    example: 'Verificar se a altura está conforme NBR 12693',
  })
  @IsString({ message: 'Texto deve ser uma string' })
  @MinLength(1, { message: 'Texto não pode estar vazio' })
  @MaxLength(1000, { message: 'Texto não pode ter mais que 1000 caracteres' })
  text: string;

  @ApiPropertyOptional({
    description: 'Posição da anotação na planta',
    example: { x: 125, y: 215 },
  })
  @IsOptional()
  @IsObject({ message: 'Posição deve ser um objeto' })
  position?: { x: number; y: number };

  @ApiPropertyOptional({
    description: 'Prioridade da anotação',
    example: 'high',
    enum: ['low', 'medium', 'high'],
  })
  @IsOptional()
  @IsEnum(['low', 'medium', 'high'], {
    message: 'Prioridade deve ser: low, medium ou high',
  })
  priority?: 'low' | 'medium' | 'high';
}

/**
 * DTO para validação técnica
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Tipo de validação',
    example: ValidationType.FIRE_SAFETY,
    enum: ValidationType,
  })
  @IsEnum(ValidationType, { message: 'Tipo de validação deve ser válido' })
  type: ValidationType;

  @ApiProperty({
    description: 'Status da validação',
    example: 'passed',
    enum: ['passed', 'failed', 'not_applicable'],
  })
  @IsEnum(['passed', 'failed', 'not_applicable'], {
    message: 'Status deve ser: passed, failed ou not_applicable',
  })
  status: 'passed' | 'failed' | 'not_applicable';

  @ApiPropertyOptional({
    description: 'Notas da validação',
    example: 'Extintor em conformidade com NBR 12693, pressão adequada',
  })
  @IsOptional()
  @IsString({ message: 'Notas devem ser uma string' })
  @MaxLength(1000, { message: 'Notas não podem ter mais que 1000 caracteres' })
  notes?: string;

  @ApiPropertyOptional({
    description: 'Score da validação (0-100)',
    example: 95,
  })
  @IsOptional()
  @IsInt({ message: 'Score deve ser um número inteiro' })
  @Min(0, { message: 'Score mínimo é 0' })
  @Max(100, { message: 'Score máximo é 100' })
  score?: number;

  @ApiPropertyOptional({
    description: 'Anexos da validação',
    example: ['photo1.jpg', 'certificate.pdf'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Anexos deve ser um array' })
  @IsString({ each: true, message: 'Cada anexo deve ser uma string' })
  attachments?: string[];
}

/**
 * DTO para busca de objetos
 */
export class SearchInfraObjectsDto {
  @ApiPropertyOptional({
    description: 'Página para paginação',
    example: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Página deve ser um número inteiro' })
  @Min(1, { message: 'Página deve ser pelo menos 1' })
  @Transform(({ value }) => parseInt(value))
  page?: number;

  @ApiPropertyOptional({
    description: 'Limite de itens por página',
    example: 20,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsInt({ message: 'Limite deve ser um número inteiro' })
  @Min(1, { message: 'Limite deve ser pelo menos 1' })
  @Max(100, { message: 'Limite não pode exceder 100' })
  @Transform(({ value }) => parseInt(value))
  limit?: number;

  @ApiPropertyOptional({
    description: 'Filtro por ID da planta',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID da planta deve ser um UUID válido' })
  plantaId?: string;

  @ApiPropertyOptional({
    description: 'Filtro por status',
    enum: InfraObjectStatus,
  })
  @IsOptional()
  @IsEnum(InfraObjectStatus, { message: 'Status deve ser válido' })
  status?: InfraObjectStatus;

  @ApiPropertyOptional({
    description: 'Filtro por categoria',
    example: 'FIRE_SAFETY',
  })
  @IsOptional()
  @IsString({ message: 'Categoria deve ser uma string' })
  objectCategory?: string;

  @ApiPropertyOptional({
    description: 'Filtro por tipo',
    example: 'FIRE_EXTINGUISHER',
  })
  @IsOptional()
  @IsString({ message: 'Tipo deve ser uma string' })
  objectType?: string;

  @ApiPropertyOptional({
    description: 'Filtro por criticidade',
    enum: SafetyCriticality,
  })
  @IsOptional()
  @IsEnum(SafetyCriticality, { message: 'Criticidade deve ser válida' })
  criticality?: SafetyCriticality;

  @ApiPropertyOptional({
    description: 'Filtro por origem',
    enum: InfraObjectSource,
  })
  @IsOptional()
  @IsEnum(InfraObjectSource, { message: 'Origem deve ser válida' })
  source?: InfraObjectSource;

  @ApiPropertyOptional({
    description: 'Busca por nome ou descrição',
    example: 'extintor',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(100, { message: 'Busca não pode ter mais que 100 caracteres' })
  search?: string;

  @ApiPropertyOptional({
    description: 'Confiança mínima (0.0 a 1.0)',
    example: 0.8,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Confiança mínima deve ser um número' })
  @Min(0, { message: 'Confiança mínima não pode ser negativa' })
  @Max(1, { message: 'Confiança mínima não pode exceder 1' })
  @Transform(({ value }) => parseFloat(value))
  minConfidence?: number;

  @ApiPropertyOptional({
    description: 'Score mínimo de qualidade (0-100)',
    example: 80,
  })
  @IsOptional()
  @IsInt({ message: 'Score mínimo deve ser um número inteiro' })
  @Min(0, { message: 'Score mínimo não pode ser negativo' })
  @Max(100, { message: 'Score mínimo não pode exceder 100' })
  @Transform(({ value }) => parseInt(value))
  minQualityScore?: number;

  @ApiPropertyOptional({
    description: 'Apenas objetos que precisam de atenção',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  needsAttention?: boolean;

  @ApiPropertyOptional({
    description: 'Apenas objetos validados manualmente',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  manuallyValidated?: boolean;

  @ApiPropertyOptional({
    description: 'Apenas objetos com conflitos',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  hasConflicts?: boolean;

  @ApiPropertyOptional({
    description: 'Filtro por nível de confiança',
    enum: ConfidenceLevel,
  })
  @IsOptional()
  @IsEnum(ConfidenceLevel, { message: 'Nível de confiança deve ser válido' })
  confidenceLevel?: ConfidenceLevel;

  @ApiPropertyOptional({
    description: 'Filtro por usuário criador',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do criador deve ser um UUID válido' })
  createdBy?: string;

  @ApiPropertyOptional({
    description: 'Data de criação desde (ISO string)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  createdFrom?: string;

  @ApiPropertyOptional({
    description: 'Data de criação até (ISO string)',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  createdTo?: string;
}

/**
 * DTO para análise de conflitos
 */
export class ConflictAnalysisDto {
  @ApiPropertyOptional({
    description: 'IDs dos objetos para analisar conflitos',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'ObjectIds deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  objectIds?: string[];

  @ApiPropertyOptional({
    description: 'Tipos de conflito para verificar',
    example: ['duplicate', 'overlap'],
    enum: ['duplicate', 'overlap', 'inconsistency', 'missing_dependency'],
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'ConflictTypes deve ser um array' })
  @IsEnum(['duplicate', 'overlap', 'inconsistency', 'missing_dependency'], {
    each: true,
    message: 'Cada tipo deve ser válido',
  })
  conflictTypes?: (
    | 'duplicate'
    | 'overlap'
    | 'inconsistency'
    | 'missing_dependency'
  )[];

  @ApiPropertyOptional({
    description: 'Tolerância para detecção de sobreposição (pixels)',
    example: 5,
  })
  @IsOptional()
  @IsInt({ message: 'Tolerância deve ser um número inteiro' })
  @Min(0, { message: 'Tolerância não pode ser negativa' })
  overlapTolerance?: number;

  @ApiPropertyOptional({
    description: 'Tentar resolver automaticamente conflitos simples',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  autoResolve?: boolean;
}

/**
 * DTO para relatório de objetos
 */
export class InfraObjectReportDto {
  @ApiPropertyOptional({
    description: 'Data de início do relatório',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Data de fim do relatório',
    example: '2025-01-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Categorias para incluir',
    example: ['FIRE_SAFETY', 'ELECTRICAL'],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Categories deve ser um array' })
  @IsString({ each: true, message: 'Cada categoria deve ser uma string' })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Status para incluir',
    enum: InfraObjectStatus,
    isArray: true,
  })
  @IsOptional()
  @IsArray({ message: 'Statuses deve ser um array' })
  @IsEnum(InfraObjectStatus, {
    each: true,
    message: 'Cada status deve ser válido',
  })
  statuses?: InfraObjectStatus[];

  @ApiPropertyOptional({
    description: 'Incluir detalhes dos objetos',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeDetails?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir histórico de modificações',
    example: false,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeHistory?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir análise de qualidade',
    example: true,
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true')
  includeQualityAnalysis?: boolean;
}
