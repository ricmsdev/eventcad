import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsDateString, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistStatus, ChecklistType, ChecklistPriority, ChecklistFrequency } from '../entities/checklist.entity';

/**
 * DTO para criação de checklist
 */
export class CreateChecklistDto {
  @ApiProperty({ description: 'Nome do checklist' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do checklist' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Código único do checklist' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiProperty({ 
    description: 'Tipo do checklist',
    enum: ChecklistType,
    example: ChecklistType.INSPECTION
  })
  @IsEnum(ChecklistType)
  type: ChecklistType;

  @ApiPropertyOptional({ 
    description: 'Status inicial do checklist',
    enum: ChecklistStatus,
    default: ChecklistStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(ChecklistStatus)
  status?: ChecklistStatus;

  @ApiPropertyOptional({ 
    description: 'Prioridade do checklist',
    enum: ChecklistPriority,
    default: ChecklistPriority.MEDIUM
  })
  @IsOptional()
  @IsEnum(ChecklistPriority)
  priority?: ChecklistPriority;

  @ApiPropertyOptional({ description: 'ID da planta associada' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'ID do usuário responsável' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'ID do aprovador' })
  @IsOptional()
  @IsUUID()
  approverId?: string;

  @ApiPropertyOptional({ 
    description: 'Frequência de execução',
    enum: ChecklistFrequency,
    default: ChecklistFrequency.ON_DEMAND
  })
  @IsOptional()
  @IsEnum(ChecklistFrequency)
  frequency?: ChecklistFrequency;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Duração estimada em minutos' })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Configurações de notificação' })
  @IsOptional()
  @IsObject()
  notificationSettings?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    reminderDays?: number[];
  };

  @ApiPropertyOptional({ description: 'Configurações de aprovação' })
  @IsOptional()
  @IsObject()
  approvalSettings?: {
    requiresApproval?: boolean;
    autoApprove?: boolean;
    approvalThreshold?: number;
  };

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Itens do checklist' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateChecklistItemDto)
  items?: CreateChecklistItemDto[];

  @ApiPropertyOptional({ description: 'IDs dos objetos de infraestrutura relacionados' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  relatedInfraObjectIds?: string[];

  @ApiPropertyOptional({ description: 'Configurações de pontuação' })
  @IsOptional()
  @IsObject()
  scoringSettings?: {
    enabled?: boolean;
    maxScore?: number;
    passingScore?: number;
    weightByPriority?: boolean;
  };

  @ApiPropertyOptional({ description: 'Configurações de validação' })
  @IsOptional()
  @IsObject()
  validationSettings?: {
    requiresPhotos?: boolean;
    requiresSignature?: boolean;
    requiresLocation?: boolean;
    allowsSkip?: boolean;
  };
}

/**
 * DTO para atualização de checklist
 */
export class UpdateChecklistDto {
  @ApiPropertyOptional({ description: 'Nome do checklist' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do checklist' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Código único do checklist' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ 
    description: 'Tipo do checklist',
    enum: ChecklistType
  })
  @IsOptional()
  @IsEnum(ChecklistType)
  type?: ChecklistType;

  @ApiPropertyOptional({ 
    description: 'Status do checklist',
    enum: ChecklistStatus
  })
  @IsOptional()
  @IsEnum(ChecklistStatus)
  status?: ChecklistStatus;

  @ApiPropertyOptional({ 
    description: 'Prioridade do checklist',
    enum: ChecklistPriority
  })
  @IsOptional()
  @IsEnum(ChecklistPriority)
  priority?: ChecklistPriority;

  @ApiPropertyOptional({ description: 'ID da planta associada' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'ID do usuário responsável' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;

  @ApiPropertyOptional({ description: 'ID do aprovador' })
  @IsOptional()
  @IsUUID()
  approverId?: string;

  @ApiPropertyOptional({ 
    description: 'Frequência de execução',
    enum: ChecklistFrequency
  })
  @IsOptional()
  @IsEnum(ChecklistFrequency)
  frequency?: ChecklistFrequency;

  @ApiPropertyOptional({ description: 'Data de vencimento' })
  @IsOptional()
  @IsDateString()
  dueDate?: string;

  @ApiPropertyOptional({ description: 'Duração estimada em minutos' })
  @IsOptional()
  @IsNumber()
  estimatedDuration?: number;

  @ApiPropertyOptional({ description: 'Configurações de notificação' })
  @IsOptional()
  @IsObject()
  notificationSettings?: {
    email?: boolean;
    push?: boolean;
    sms?: boolean;
    reminderDays?: number[];
  };

  @ApiPropertyOptional({ description: 'Configurações de aprovação' })
  @IsOptional()
  @IsObject()
  approvalSettings?: {
    requiresApproval?: boolean;
    autoApprove?: boolean;
    approvalThreshold?: number;
  };

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Itens do checklist' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateChecklistItemDto)
  items?: UpdateChecklistItemDto[];

  @ApiPropertyOptional({ description: 'IDs dos objetos de infraestrutura relacionados' })
  @IsOptional()
  @IsArray()
  @IsUUID(undefined, { each: true })
  relatedInfraObjectIds?: string[];

  @ApiPropertyOptional({ description: 'Configurações de pontuação' })
  @IsOptional()
  @IsObject()
  scoringSettings?: {
    enabled?: boolean;
    maxScore?: number;
    passingScore?: number;
    weightByPriority?: boolean;
  };

  @ApiPropertyOptional({ description: 'Configurações de validação' })
  @IsOptional()
  @IsObject()
  validationSettings?: {
    requiresPhotos?: boolean;
    requiresSignature?: boolean;
    requiresLocation?: boolean;
    allowsSkip?: boolean;
  };
}

/**
 * DTO para busca de checklists
 */
export class SearchChecklistsDto {
  @ApiPropertyOptional({ description: 'Número da página' })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({ description: 'Itens por página' })
  @IsOptional()
  @IsNumber()
  limit?: number;

  @ApiPropertyOptional({ description: 'Termo de busca' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Filtrar por status',
    enum: ChecklistStatus
  })
  @IsOptional()
  @IsEnum(ChecklistStatus)
  status?: ChecklistStatus;

  @ApiPropertyOptional({ 
    description: 'Filtrar por tipo',
    enum: ChecklistType
  })
  @IsOptional()
  @IsEnum(ChecklistType)
  type?: ChecklistType;

  @ApiPropertyOptional({ 
    description: 'Filtrar por prioridade',
    enum: ChecklistPriority
  })
  @IsOptional()
  @IsEnum(ChecklistPriority)
  priority?: ChecklistPriority;

  @ApiPropertyOptional({ 
    description: 'Filtrar por frequência',
    enum: ChecklistFrequency
  })
  @IsOptional()
  @IsEnum(ChecklistFrequency)
  frequency?: ChecklistFrequency;

  @ApiPropertyOptional({ description: 'Filtrar por planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por responsável' })
  @IsOptional()
  @IsUUID()
  assignedTo?: string;

  @ApiPropertyOptional({ description: 'Filtrar por criador' })
  @IsOptional()
  @IsUUID()
  createdBy?: string;

  @ApiPropertyOptional({ description: 'Filtrar vencidos' })
  @IsOptional()
  @IsBoolean()
  overdue?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar que precisam de atenção' })
  @IsOptional()
  @IsBoolean()
  needsAttention?: boolean;

  @ApiPropertyOptional({ description: 'Data de criação inicial' })
  @IsOptional()
  @IsDateString()
  createdFrom?: string;

  @ApiPropertyOptional({ description: 'Data de criação final' })
  @IsOptional()
  @IsDateString()
  createdTo?: string;
}

/**
 * DTO para execução de checklist
 */
export class ExecuteChecklistDto {
  @ApiPropertyOptional({ description: 'Observações da execução' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Localização da execução' })
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  @ApiPropertyOptional({ description: 'Itens da execução' })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemExecutionDto)
  items?: ChecklistItemExecutionDto[];
}

/**
 * DTO para finalização de execução
 */
export class CompleteExecutionDto {
  @ApiProperty({ description: 'Pontuação final' })
  @IsNumber()
  score: number;

  @ApiPropertyOptional({ description: 'Observações finais' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Anexos da execução' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Assinatura digital' })
  @IsOptional()
  @IsString()
  signature?: string;
}

/**
 * DTO para rejeição de checklist
 */
export class RejectChecklistDto {
  @ApiProperty({ description: 'Motivo da rejeição' })
  @IsString()
  reason: string;

  @ApiPropertyOptional({ description: 'Sugestões de correção' })
  @IsOptional()
  @IsString()
  suggestions?: string;
}

/**
 * DTO para relatório de checklists
 */
export class ChecklistReportDto {
  @ApiPropertyOptional({ description: 'Data inicial do período' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data final do período' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Tipos de checklist para incluir' })
  @IsOptional()
  @IsArray()
  @IsEnum(ChecklistType, { each: true })
  types?: ChecklistType[];

  @ApiPropertyOptional({ description: 'Status para incluir' })
  @IsOptional()
  @IsArray()
  @IsEnum(ChecklistStatus, { each: true })
  statuses?: ChecklistStatus[];

  @ApiPropertyOptional({ description: 'Incluir análise de qualidade' })
  @IsOptional()
  @IsBoolean()
  includeQualityAnalysis?: boolean;

  @ApiPropertyOptional({ description: 'Incluir detalhes dos checklists' })
  @IsOptional()
  @IsBoolean()
  includeDetails?: boolean;

  @ApiPropertyOptional({ description: 'Filtrar por planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;
}

/**
 * DTO para atualização em lote
 */
export class BulkUpdateChecklistsDto {
  @ApiProperty({ description: 'Critérios de filtro' })
  @IsObject()
  filterCriteria: {
    status?: ChecklistStatus;
    type?: ChecklistType;
    priority?: ChecklistPriority;
    plantaId?: string;
  };

  @ApiProperty({ description: 'Dados para atualização' })
  @IsObject()
  updateData: Partial<UpdateChecklistDto>;
}

// DTOs para itens de checklist

/**
 * DTO para criação de item de checklist
 */
export class CreateChecklistItemDto {
  @ApiProperty({ description: 'Texto do item' })
  @IsString()
  text: string;

  @ApiPropertyOptional({ description: 'Descrição detalhada' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Ordem do item' })
  @IsOptional()
  @IsNumber()
  order?: number;

  @ApiProperty({ 
    description: 'Tipo do item',
    enum: ['boolean', 'text', 'number', 'select', 'multi_select', 'date', 'file', 'location', 'signature', 'custom']
  })
  @IsString()
  type: string;

  @ApiPropertyOptional({ 
    description: 'Status do item',
    enum: ['active', 'inactive', 'conditional']
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ 
    description: 'Prioridade do item',
    enum: ['low', 'medium', 'high', 'critical']
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({ description: 'Peso para pontuação' })
  @IsOptional()
  @IsNumber()
  weight?: number;

  @ApiPropertyOptional({ description: 'Valor padrão' })
  @IsOptional()
  defaultValue?: any;

  @ApiPropertyOptional({ description: 'Item é obrigatório' })
  @IsOptional()
  @IsBoolean()
  required?: boolean;

  @ApiPropertyOptional({ description: 'Permite comentários' })
  @IsOptional()
  @IsBoolean()
  allowComments?: boolean;

  @ApiPropertyOptional({ description: 'Permite anexos' })
  @IsOptional()
  @IsBoolean()
  allowAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Permite pular' })
  @IsOptional()
  @IsBoolean()
  allowSkip?: boolean;

  @ApiPropertyOptional({ description: 'Opções para itens do tipo select' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiPropertyOptional({ description: 'Regras de validação' })
  @IsOptional()
  @IsObject()
  validationRules?: {
    minValue?: number;
    maxValue?: number;
    pattern?: string;
    customValidation?: string;
  };

  @ApiPropertyOptional({ description: 'Regras condicionais' })
  @IsOptional()
  @IsObject()
  conditionalRules?: {
    dependsOn?: string;
    condition?: string;
    showWhen?: any;
    hideWhen?: any;
  };

  @ApiPropertyOptional({ description: 'Configurações específicas do tipo' })
  @IsOptional()
  @IsObject()
  typeConfig?: {
    minLength?: number;
    maxLength?: number;
    allowedFileTypes?: string[];
    locationAccuracy?: number;
    signatureRequired?: boolean;
  };
}

/**
 * DTO para atualização de item de checklist
 */
export class UpdateChecklistItemDto extends CreateChecklistItemDto {
  @ApiPropertyOptional({ description: 'ID do item' })
  @IsOptional()
  @IsUUID()
  id?: string;
}

/**
 * DTO para execução de item de checklist
 */
export class ChecklistItemExecutionDto {
  @ApiProperty({ description: 'ID do item' })
  @IsUUID()
  itemId: string;

  @ApiPropertyOptional({ description: 'Valor da resposta' })
  @IsOptional()
  value?: any;

  @ApiPropertyOptional({ description: 'Comentário da resposta' })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: 'Anexos da resposta' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];

  @ApiPropertyOptional({ description: 'Localização da resposta' })
  @IsOptional()
  @IsObject()
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };

  @ApiPropertyOptional({ description: 'Assinatura digital' })
  @IsOptional()
  @IsString()
  signature?: string;

  @ApiPropertyOptional({ description: 'Item foi pulado' })
  @IsOptional()
  @IsBoolean()
  skipped?: boolean;

  @ApiPropertyOptional({ description: 'Pontuação do item' })
  @IsOptional()
  @IsNumber()
  score?: number;
} 