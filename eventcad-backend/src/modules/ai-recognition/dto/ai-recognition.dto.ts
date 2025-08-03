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
  IsEmail,
  IsUrl,
  Min,
  Max,
  MinLength,
  MaxLength,
  IsInt,
  IsDateString,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AIModelType,
  AIProcessingStatus,
  AIObjectCategory,
} from '../../../common/enums/ai-recognition.enum';

/**
 * DTO para criar job de processamento de IA
 */
export class CreateAIJobDto {
  @ApiProperty({
    description: 'Nome identificador do job',
    example: 'Análise Segurança Pavilhão A',
  })
  @IsString({ message: 'Nome do job deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Nome não pode ter mais que 100 caracteres' })
  jobName: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do job',
    example:
      'Análise completa de segurança contra incêndio com detecção de extintores e rotas de fuga',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, {
    message: 'Descrição não pode ter mais que 1000 caracteres',
  })
  description?: string;

  @ApiProperty({
    description: 'ID da planta a ser processada',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsUUID(4, { message: 'ID da planta deve ser um UUID válido' })
  plantaId: string;

  @ApiProperty({
    description: 'Tipo do modelo de IA',
    example: AIModelType.FIRE_SAFETY_AI,
    enum: AIModelType,
  })
  @IsEnum(AIModelType, { message: 'Tipo de modelo deve ser válido' })
  modelType: AIModelType;

  @ApiPropertyOptional({
    description: 'Prioridade do job (1=crítica, 2=alta, 3=média, 4=baixa)',
    example: 1,
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Prioridade deve ser um número inteiro' })
  @Min(1, { message: 'Prioridade mínima é 1' })
  @Max(4, { message: 'Prioridade máxima é 4' })
  priority?: number;

  @ApiPropertyOptional({
    description: 'Data/hora agendada para início (ISO string)',
    example: '2025-01-15T10:00:00.000Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data agendada deve estar no formato ISO' })
  scheduledFor?: string;

  @ApiPropertyOptional({
    description: 'Configurações específicas do modelo',
    example: {
      confidence_threshold: 0.85,
      categories: ['fire_safety', 'emergency'],
      preprocessing: { normalize: true },
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações do modelo devem ser um objeto' })
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

  @ApiPropertyOptional({
    description: 'Parâmetros de processamento',
    example: {
      detect_objects: true,
      extract_text: true,
      validate_compliance: false,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Parâmetros de processamento devem ser um objeto' })
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

  @ApiPropertyOptional({
    description: 'Máximo de tentativas em caso de erro',
    example: 3,
    minimum: 1,
    maximum: 10,
  })
  @IsOptional()
  @IsInt({ message: 'Máximo de tentativas deve ser um número inteiro' })
  @Min(1, { message: 'Mínimo 1 tentativa' })
  @Max(10, { message: 'Máximo 10 tentativas' })
  maxAttempts?: number;

  @ApiPropertyOptional({
    description: 'URL de callback para notificação',
    example: 'https://app.eventcad.com/api/webhooks/ai-completed',
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL de callback deve ser válida' })
  callbackUrl?: string;

  @ApiPropertyOptional({
    description: 'Email para notificação de conclusão',
    example: 'engenheiro@eventcad.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser válido' })
  notificationEmail?: string;

  @ApiPropertyOptional({
    description: 'Habilitar notificação via webhook',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'enableWebhook deve ser um boolean' })
  enableWebhook?: boolean;
}

/**
 * DTO para atualizar job de IA
 */
export class UpdateAIJobDto {
  @ApiPropertyOptional({
    description: 'Nome do job',
    example: 'Análise Atualizada',
  })
  @IsOptional()
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(100, { message: 'Nome não pode ter mais que 100 caracteres' })
  jobName?: string;

  @ApiPropertyOptional({
    description: 'Descrição do job',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(1000, {
    message: 'Descrição não pode ter mais que 1000 caracteres',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Prioridade do job',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Prioridade deve ser um número inteiro' })
  @Min(1, { message: 'Prioridade mínima é 1' })
  @Max(4, { message: 'Prioridade máxima é 4' })
  priority?: number;

  @ApiPropertyOptional({
    description: 'Data agendada para processamento',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Data deve estar no formato ISO' })
  scheduledFor?: string;

  @ApiPropertyOptional({
    description: 'URL de callback',
  })
  @IsOptional()
  @IsUrl({}, { message: 'URL deve ser válida' })
  callbackUrl?: string;

  @ApiPropertyOptional({
    description: 'Email para notificação',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email deve ser válido' })
  notificationEmail?: string;

  @ApiPropertyOptional({
    description: 'Habilitar webhook',
  })
  @IsOptional()
  @IsBoolean({ message: 'enableWebhook deve ser um boolean' })
  enableWebhook?: boolean;
}

/**
 * DTO para busca de jobs de IA
 */
export class SearchAIJobsDto {
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
    description: 'Filtro por status',
    enum: AIProcessingStatus,
  })
  @IsOptional()
  @IsEnum(AIProcessingStatus, { message: 'Status deve ser válido' })
  status?: AIProcessingStatus;

  @ApiPropertyOptional({
    description: 'Filtro por tipo de modelo',
    enum: AIModelType,
  })
  @IsOptional()
  @IsEnum(AIModelType, { message: 'Tipo de modelo deve ser válido' })
  modelType?: AIModelType;

  @ApiPropertyOptional({
    description: 'Filtro por prioridade',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Prioridade deve ser um número inteiro' })
  @Min(1, { message: 'Prioridade mínima é 1' })
  @Max(4, { message: 'Prioridade máxima é 4' })
  @Transform(({ value }) => parseInt(value))
  priority?: number;

  @ApiPropertyOptional({
    description: 'Filtro por ID da planta',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID da planta deve ser um UUID válido' })
  plantaId?: string;

  @ApiPropertyOptional({
    description: 'Filtro por usuário que iniciou',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, { message: 'ID do usuário deve ser um UUID válido' })
  initiatedBy?: string;

  @ApiPropertyOptional({
    description: 'Busca por nome do job',
    example: 'análise segurança',
  })
  @IsOptional()
  @IsString({ message: 'Busca deve ser uma string' })
  @MaxLength(100, { message: 'Busca não pode ter mais que 100 caracteres' })
  search?: string;

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

  @ApiPropertyOptional({
    description: 'Apenas jobs que podem ser executados',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'canExecute deve ser um boolean' })
  @Transform(({ value }) => value === 'true')
  canExecute?: boolean;

  @ApiPropertyOptional({
    description: 'Apenas jobs falhados que podem tentar novamente',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'canRetry deve ser um boolean' })
  @Transform(({ value }) => value === 'true')
  canRetry?: boolean;
}

/**
 * DTO para processamento batch de IA
 */
export class BatchAIProcessingDto {
  @ApiProperty({
    description: 'IDs das plantas para processamento',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray({ message: 'plantaIds deve ser um array' })
  @IsUUID(4, { each: true, message: 'Cada ID deve ser um UUID válido' })
  plantaIds: string[];

  @ApiProperty({
    description: 'Tipo do modelo de IA',
    enum: AIModelType,
  })
  @IsEnum(AIModelType, { message: 'Tipo de modelo deve ser válido' })
  modelType: AIModelType;

  @ApiPropertyOptional({
    description: 'Nome base para os jobs',
    example: 'Análise Batch Pavilhão',
  })
  @IsOptional()
  @IsString({ message: 'Nome base deve ser uma string' })
  @MaxLength(80, { message: 'Nome base não pode ter mais que 80 caracteres' })
  baseJobName?: string;

  @ApiPropertyOptional({
    description: 'Prioridade para todos os jobs',
    minimum: 1,
    maximum: 4,
  })
  @IsOptional()
  @IsInt({ message: 'Prioridade deve ser um número inteiro' })
  @Min(1, { message: 'Prioridade mínima é 1' })
  @Max(4, { message: 'Prioridade máxima é 4' })
  priority?: number;

  @ApiPropertyOptional({
    description: 'Configurações do modelo para todos os jobs',
  })
  @IsOptional()
  @IsObject({ message: 'Configurações devem ser um objeto' })
  modelConfig?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Parâmetros de processamento para todos os jobs',
  })
  @IsOptional()
  @IsObject({ message: 'Parâmetros devem ser um objeto' })
  processingParams?: Record<string, any>;
}

/**
 * DTO para resposta de job de IA
 */
export class AIJobResponseDto {
  @ApiProperty({
    description: 'ID do job',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'Nome do job',
    example: 'Análise Segurança Pavilhão A',
  })
  jobName: string;

  @ApiProperty({
    description: 'Status atual',
    enum: AIProcessingStatus,
  })
  status: AIProcessingStatus;

  @ApiProperty({
    description: 'Tipo do modelo',
    enum: AIModelType,
  })
  modelType: AIModelType;

  @ApiProperty({
    description: 'Prioridade',
    example: 1,
  })
  priority: number;

  @ApiProperty({
    description: 'Progresso (0-100)',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Estágio atual',
    example: 'Detectando objetos',
  })
  currentStage: string;

  @ApiProperty({
    description: 'Data de criação',
    example: '2025-01-01T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Data de início',
    example: '2025-01-01T12:05:00.000Z',
  })
  startedAt?: Date;

  @ApiProperty({
    description: 'Data de conclusão',
    example: '2025-01-01T12:10:00.000Z',
  })
  completedAt?: Date;

  @ApiProperty({
    description: 'Tempo de processamento em segundos',
    example: 300,
  })
  processingTimeSeconds?: number;

  @ApiProperty({
    description: 'Número de tentativas',
    example: 1,
  })
  attemptCount: number;

  @ApiProperty({
    description: 'Pode tentar novamente',
    example: false,
  })
  canRetry: boolean;

  @ApiProperty({
    description: 'Pode ser executado',
    example: false,
  })
  canExecute: boolean;
}

/**
 * DTO para resultados de IA
 */
export class AIResultsDto {
  @ApiProperty({
    description: 'Objetos detectados',
    type: 'array',
  })
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
  }[];

  @ApiProperty({
    description: 'Texto extraído',
    type: 'array',
  })
  extracted_text?: {
    text: string;
    position: { x: number; y: number };
    confidence: number;
    category?: string;
  }[];

  @ApiProperty({
    description: 'Análise de layers',
    type: 'array',
  })
  layer_analysis?: {
    layer_name: string;
    object_count: number;
    object_types: string[];
    confidence: number;
  }[];

  @ApiProperty({
    description: 'Análise de compliance',
    type: 'array',
  })
  compliance_analysis?: {
    rule: string;
    status: string;
    message: string;
    confidence: number;
  }[];

  @ApiProperty({
    description: 'Estatísticas do processamento',
  })
  statistics?: {
    total_objects_detected: number;
    confidence_avg: number;
    processing_time_ms: number;
    model_version: string;
  };
}

/**
 * DTO para controle de execução
 */
export class ExecuteJobDto {
  @ApiPropertyOptional({
    description: 'Forçar execução mesmo se não estiver na fila',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'force deve ser um boolean' })
  force?: boolean;

  @ApiPropertyOptional({
    description: 'ID do worker que executará',
    example: 'worker-001',
  })
  @IsOptional()
  @IsString({ message: 'workerId deve ser uma string' })
  @MaxLength(100, { message: 'workerId não pode ter mais que 100 caracteres' })
  workerId?: string;

  @ApiPropertyOptional({
    description: 'Timeout personalizado em segundos',
    example: 600,
  })
  @IsOptional()
  @IsInt({ message: 'timeout deve ser um número inteiro' })
  @Min(30, { message: 'Timeout mínimo é 30 segundos' })
  @Max(3600, { message: 'Timeout máximo é 3600 segundos (1 hora)' })
  timeout?: number;
}

/**
 * DTO para cancelamento de job
 */
export class CancelJobDto {
  @ApiPropertyOptional({
    description: 'Motivo do cancelamento',
    example: 'Planta foi atualizada, reprocessamento necessário',
  })
  @IsOptional()
  @IsString({ message: 'Motivo deve ser uma string' })
  @MaxLength(200, { message: 'Motivo não pode ter mais que 200 caracteres' })
  reason?: string;
}

/**
 * DTO para relatório de jobs
 */
export class AIJobReportDto {
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
    description: 'Tipos de modelo para incluir',
    type: [String],
    enum: AIModelType,
  })
  @IsOptional()
  @IsArray({ message: 'modelTypes deve ser um array' })
  @IsEnum(AIModelType, { each: true, message: 'Cada tipo deve ser válido' })
  modelTypes?: AIModelType[];

  @ApiPropertyOptional({
    description: 'Status para incluir',
    type: [String],
    enum: AIProcessingStatus,
  })
  @IsOptional()
  @IsArray({ message: 'statuses deve ser um array' })
  @IsEnum(AIProcessingStatus, {
    each: true,
    message: 'Cada status deve ser válido',
  })
  statuses?: AIProcessingStatus[];

  @ApiPropertyOptional({
    description: 'Incluir detalhes dos resultados',
    example: true,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeResults deve ser um boolean' })
  includeResults?: boolean;

  @ApiPropertyOptional({
    description: 'Incluir logs de processamento',
    example: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'includeLogs deve ser um boolean' })
  includeLogs?: boolean;
}
