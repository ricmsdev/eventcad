import { IsString, IsOptional, IsEnum, IsArray, IsNumber, IsBoolean, IsDateString, IsUUID, ValidateNested, IsObject } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReportType, ReportStatus, ReportFormat, ReportFrequency, ReportPriority } from '../entities/report-template.entity';

// ===== DTOs para Templates =====
export class CreateReportTemplateDto {
  @ApiProperty({ description: 'Nome do template' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descrição do template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Código único do template' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Tipo do relatório', enum: ReportType })
  @IsEnum(ReportType)
  type: ReportType;

  @ApiPropertyOptional({ description: 'Categoria do relatório' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Versão do template' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'ID da planta associada' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'Configuração das fontes de dados' })
  @IsOptional()
  @IsObject()
  dataSources?: any;

  @ApiPropertyOptional({ description: 'Configuração do layout' })
  @IsOptional()
  @IsObject()
  layout?: any;

  @ApiPropertyOptional({ description: 'Configuração de gráficos' })
  @IsOptional()
  @IsArray()
  charts?: any[];

  @ApiPropertyOptional({ description: 'Configuração de filtros' })
  @IsOptional()
  @IsArray()
  filters?: any[];

  @ApiPropertyOptional({ description: 'Prioridade de execução', enum: ReportPriority })
  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @ApiPropertyOptional({ description: 'Timeout de execução em segundos' })
  @IsOptional()
  @IsNumber()
  executionTimeout?: number;

  @ApiPropertyOptional({ description: 'Formatos suportados' })
  @IsOptional()
  @IsArray()
  supportedFormats?: ReportFormat[];

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Se é relatório rápido' })
  @IsOptional()
  @IsBoolean()
  isQuickReport?: boolean;

  @ApiPropertyOptional({ description: 'Se é relatório especializado' })
  @IsOptional()
  @IsBoolean()
  specialized?: boolean;

  @ApiPropertyOptional({ description: 'Se é público' })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}

export class UpdateReportTemplateDto {
  @ApiPropertyOptional({ description: 'Nome do template' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: 'Descrição do template' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Código único do template' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ description: 'Tipo do relatório', enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Status do template', enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Categoria do relatório' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Versão do template' })
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ description: 'ID da planta associada' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'Configuração das fontes de dados' })
  @IsOptional()
  @IsObject()
  dataSources?: any;

  @ApiPropertyOptional({ description: 'Configuração do layout' })
  @IsOptional()
  @IsObject()
  layout?: any;

  @ApiPropertyOptional({ description: 'Configuração de gráficos' })
  @IsOptional()
  @IsArray()
  charts?: any[];

  @ApiPropertyOptional({ description: 'Configuração de filtros' })
  @IsOptional()
  @IsArray()
  filters?: any[];

  @ApiPropertyOptional({ description: 'Prioridade de execução', enum: ReportPriority })
  @IsOptional()
  @IsEnum(ReportPriority)
  priority?: ReportPriority;

  @ApiPropertyOptional({ description: 'Timeout de execução em segundos' })
  @IsOptional()
  @IsNumber()
  executionTimeout?: number;

  @ApiPropertyOptional({ description: 'Formatos suportados' })
  @IsOptional()
  @IsArray()
  supportedFormats?: ReportFormat[];

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class SearchReportTemplatesDto {
  @ApiPropertyOptional({ description: 'Filtrar por tipo', enum: ReportType })
  @IsOptional()
  @IsEnum(ReportType)
  type?: ReportType;

  @ApiPropertyOptional({ description: 'Filtrar por status', enum: ReportStatus })
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @ApiPropertyOptional({ description: 'Buscar por nome/descrição' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filtrar por planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;
}

// ===== DTOs para Execuções =====
export class ExecuteReportDto {
  @ApiPropertyOptional({ description: 'Parâmetros da execução' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração da execução' })
  @IsOptional()
  @IsObject()
  config?: {
    timeout?: number;
    priority?: string;
    format?: string;
    compression?: boolean;
  };
}

export class SearchExecutionsDto {
  @ApiPropertyOptional({ description: 'Filtrar por template' })
  @IsOptional()
  @IsUUID()
  templateId?: string;

  @ApiPropertyOptional({ description: 'Filtrar por status' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: 'Filtrar por executor' })
  @IsOptional()
  @IsUUID()
  executedBy?: string;

  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

// ===== DTOs para Agendamentos =====
export class ScheduleReportDto {
  @ApiProperty({ description: 'Frequência de execução', enum: ReportFrequency })
  @IsEnum(ReportFrequency)
  frequency: ReportFrequency;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Intervalo personalizado em dias' })
  @IsOptional()
  @IsNumber()
  customInterval?: number;

  @ApiPropertyOptional({ description: 'Fuso horário' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Parâmetros padrão' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração da execução' })
  @IsOptional()
  @IsObject()
  config?: {
    timeout?: number;
    priority?: string;
    format?: string;
    compression?: boolean;
    retryOnFailure?: boolean;
    maxRetries?: number;
  };

  @ApiPropertyOptional({ description: 'Configurações de notificação' })
  @IsOptional()
  @IsObject()
  notificationSettings?: {
    onExecution: boolean;
    onSuccess: boolean;
    onFailure: boolean;
    onSchedule: boolean;
    recipients: string[];
    channels: ('email' | 'sms' | 'push' | 'webhook')[];
  };

  @ApiPropertyOptional({ description: 'Descrição do agendamento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateScheduleDto {
  @ApiPropertyOptional({ description: 'Frequência de execução', enum: ReportFrequency })
  @IsOptional()
  @IsEnum(ReportFrequency)
  frequency?: ReportFrequency;

  @ApiPropertyOptional({ description: 'Data de início' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Data de fim' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Intervalo personalizado em dias' })
  @IsOptional()
  @IsNumber()
  customInterval?: number;

  @ApiPropertyOptional({ description: 'Fuso horário' })
  @IsOptional()
  @IsString()
  timezone?: string;

  @ApiPropertyOptional({ description: 'Parâmetros padrão' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração da execução' })
  @IsOptional()
  @IsObject()
  config?: any;

  @ApiPropertyOptional({ description: 'Configurações de notificação' })
  @IsOptional()
  @IsObject()
  notificationSettings?: any;

  @ApiPropertyOptional({ description: 'Descrição do agendamento' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Tags para categorização' })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

// ===== DTOs para Exportações =====
export class ExportReportDto {
  @ApiProperty({ description: 'Formato de exportação', enum: ReportFormat })
  @IsEnum(ReportFormat)
  format: ReportFormat;

  @ApiPropertyOptional({ description: 'Configurações específicas do formato' })
  @IsOptional()
  @IsObject()
  formatConfig?: {
    template?: string;
    options?: Record<string, any>;
    styling?: Record<string, any>;
  };

  @ApiPropertyOptional({ description: 'Se aplica compressão' })
  @IsOptional()
  @IsBoolean()
  enableCompression?: boolean;

  @ApiPropertyOptional({ description: 'Qualidade da compressão (1-100)' })
  @IsOptional()
  @IsNumber()
  compressionQuality?: number;

  @ApiPropertyOptional({ description: 'Se adiciona watermark' })
  @IsOptional()
  @IsBoolean()
  addWatermark?: boolean;

  @ApiPropertyOptional({ description: 'Texto do watermark' })
  @IsOptional()
  @IsString()
  watermarkText?: string;

  @ApiPropertyOptional({ description: 'Se requer autenticação para download' })
  @IsOptional()
  @IsBoolean()
  requiresAuth?: boolean;

  @ApiPropertyOptional({ description: 'Roles permitidas para download' })
  @IsOptional()
  @IsArray()
  allowedRoles?: string[];

  @ApiPropertyOptional({ description: 'Dias para expiração' })
  @IsOptional()
  @IsNumber()
  expirationDays?: number;
}

// ===== DTOs para Analytics =====
export class AnalyticsFiltersDto {
  @ApiPropertyOptional({ description: 'Data inicial' })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Data final' })
  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @ApiPropertyOptional({ description: 'Tipo de analytics' })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ description: 'Filtrar por categoria' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ description: 'Filtrar por planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;
}

// ===== DTOs para Relatórios Rápidos =====
export class QuickReportDto {
  @ApiPropertyOptional({ description: 'Parâmetros do relatório' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração da execução' })
  @IsOptional()
  @IsObject()
  config?: {
    timeout?: number;
    priority?: string;
    format?: string;
    compression?: boolean;
  };

  @ApiPropertyOptional({ description: 'ID da planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'Filtros adicionais' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;
}

// ===== DTOs para Relatórios Especializados =====
export class SpecializedReportDto {
  @ApiPropertyOptional({ description: 'Parâmetros do relatório' })
  @IsOptional()
  @IsObject()
  parameters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configuração da execução' })
  @IsOptional()
  @IsObject()
  config?: {
    timeout?: number;
    priority?: string;
    format?: string;
    compression?: boolean;
  };

  @ApiPropertyOptional({ description: 'ID da planta' })
  @IsOptional()
  @IsUUID()
  plantaId?: string;

  @ApiPropertyOptional({ description: 'Filtros específicos' })
  @IsOptional()
  @IsObject()
  filters?: Record<string, any>;

  @ApiPropertyOptional({ description: 'Configurações de analytics' })
  @IsOptional()
  @IsObject()
  analytics?: {
    includeCharts?: boolean;
    includeTrends?: boolean;
    includeComparisons?: boolean;
    timeRange?: string;
  };
} 