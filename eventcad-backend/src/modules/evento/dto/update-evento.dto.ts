import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsEnum,
  IsString,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CreateEventoDto } from './create-evento.dto';
import { EventStatus } from '../../../common/enums/event-status.enum';

/**
 * DTO para atualização de evento
 * Herda de CreateEventoDto mas torna todos os campos opcionais
 */
export class UpdateEventoDto extends PartialType(CreateEventoDto) {
  @ApiPropertyOptional({
    description: 'Status do evento no workflow',
    example: EventStatus.PLANNING,
    enum: EventStatus,
  })
  @IsOptional()
  @IsEnum(EventStatus, { message: 'Status deve ser um valor válido' })
  status?: EventStatus;
}

/**
 * DTO para atualização de status específica
 */
export class UpdateEventoStatusDto {
  @ApiPropertyOptional({
    description: 'Novo status do evento',
    example: EventStatus.APPROVED,
    enum: EventStatus,
  })
  @IsEnum(EventStatus, { message: 'Status deve ser um valor válido' })
  status: EventStatus;

  @ApiPropertyOptional({
    description: 'Observações sobre a mudança de status',
    example: 'Aprovado pelo responsável técnico após análise completa',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  observacoes?: string;
}

/**
 * DTO para adição de marco na timeline
 */
export class AddMarcoTimelineDto {
  @ApiPropertyOptional({
    description: 'Título do marco',
    example: 'Início da montagem',
  })
  @IsString({ message: 'Título deve ser uma string' })
  titulo: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do marco',
    example: 'Início da montagem de estruturas e stands',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  descricao?: string;

  @ApiPropertyOptional({
    description: 'Data do marco (ISO 8601)',
    example: '2025-06-14T08:00:00.000Z',
  })
  @IsString({ message: 'Data deve ser uma string' })
  data: string;

  @ApiPropertyOptional({
    description: 'ID do responsável pelo marco',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString({ message: 'Responsável deve ser uma string' })
  responsavel?: string;

  @ApiPropertyOptional({
    description: 'Tipo do marco',
    example: 'montagem',
    enum: ['planejamento', 'aprovacao', 'montagem', 'evento', 'desmontagem'],
  })
  @IsEnum(['planejamento', 'aprovacao', 'montagem', 'evento', 'desmontagem'], {
    message:
      'Tipo deve ser: planejamento, aprovacao, montagem, evento ou desmontagem',
  })
  tipo: 'planejamento' | 'aprovacao' | 'montagem' | 'evento' | 'desmontagem';
}

/**
 * DTO para atualização de marco na timeline
 */
export class UpdateMarcoTimelineDto {
  @ApiPropertyOptional({
    description: 'ID do marco na timeline',
    example: 'marco_1640995200000',
  })
  @IsString({ message: 'ID do marco deve ser uma string' })
  marcoId: string;

  @ApiPropertyOptional({
    description: 'Novo status do marco',
    example: 'concluido',
    enum: ['pendente', 'em_andamento', 'concluido', 'atrasado'],
  })
  @IsEnum(['pendente', 'em_andamento', 'concluido', 'atrasado'], {
    message: 'Status deve ser: pendente, em_andamento, concluido ou atrasado',
  })
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
}

/**
 * DTO para adição de risco
 */
export class AddRiscoDto {
  @ApiPropertyOptional({
    description: 'Categoria do risco',
    example: 'Estrutural',
  })
  @IsString({ message: 'Categoria deve ser uma string' })
  categoria: string;

  @ApiPropertyOptional({
    description: 'Descrição do risco',
    example: 'Sobrecarga na estrutura metálica devido ao peso dos equipamentos',
  })
  @IsString({ message: 'Descrição deve ser uma string' })
  descricao: string;

  @ApiPropertyOptional({
    description: 'Probabilidade de ocorrência',
    example: 'media',
    enum: ['baixa', 'media', 'alta'],
  })
  @IsEnum(['baixa', 'media', 'alta'], {
    message: 'Probabilidade deve ser: baixa, media ou alta',
  })
  probabilidade: 'baixa' | 'media' | 'alta';

  @ApiPropertyOptional({
    description: 'Impacto se o risco se materializar',
    example: 'alto',
    enum: ['baixo', 'medio', 'alto'],
  })
  @IsEnum(['baixo', 'medio', 'alto'], {
    message: 'Impacto deve ser: baixo, medio ou alto',
  })
  impacto: 'baixo' | 'medio' | 'alto';

  @ApiPropertyOptional({
    description: 'Plano de mitigação',
    example: 'Realizar cálculo estrutural e reforçar pontos críticos',
  })
  @IsOptional()
  @IsString({ message: 'Mitigação deve ser uma string' })
  mitigacao?: string;

  @ApiPropertyOptional({
    description: 'ID do responsável pela mitigação',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsString({ message: 'Responsável deve ser uma string' })
  responsavel?: string;
}

/**
 * DTO para adição de documento
 */
export class AddDocumentoDto {
  @ApiPropertyOptional({
    description: 'Nome do documento',
    example: 'Planta baixa - Pavilhão A',
  })
  @IsString({ message: 'Nome deve ser uma string' })
  nome: string;

  @ApiPropertyOptional({
    description: 'Tipo do documento',
    example: 'planta',
  })
  @IsString({ message: 'Tipo deve ser uma string' })
  tipo: string;

  @ApiPropertyOptional({
    description: 'URL do documento',
    example: 'https://storage.eventcad.com/docs/planta-pavilhao-a.dwg',
  })
  @IsString({ message: 'URL deve ser uma string' })
  url: string;

  @ApiPropertyOptional({
    description: 'Tamanho do arquivo em bytes',
    example: 2048576,
  })
  @IsString({ message: 'Tamanho deve ser um número' })
  tamanho: number;
}

/**
 * DTO para atualização de aprovação
 */
export class UpdateAprovacaoDto {
  @ApiPropertyOptional({
    description: 'Tipo de aprovação',
    example: 'bombeiros',
    enum: ['bombeiros', 'prefeitura', 'vigilancia_sanitaria', 'engenharia'],
  })
  @IsEnum(['bombeiros', 'prefeitura', 'vigilancia_sanitaria', 'engenharia'], {
    message:
      'Tipo deve ser: bombeiros, prefeitura, vigilancia_sanitaria ou engenharia',
  })
  tipo: 'bombeiros' | 'prefeitura' | 'vigilancia_sanitaria' | 'engenharia';

  @ApiPropertyOptional({
    description: 'Status da aprovação',
    example: 'aprovado',
    enum: ['pendente', 'aprovado', 'rejeitado'],
  })
  @IsEnum(['pendente', 'aprovado', 'rejeitado'], {
    message: 'Status deve ser: pendente, aprovado ou rejeitado',
  })
  status: 'pendente' | 'aprovado' | 'rejeitado';

  @ApiPropertyOptional({
    description: 'Número/código do documento de aprovação',
    example: 'AVCB-2025-001234',
  })
  @IsOptional()
  @IsString({ message: 'Documento deve ser uma string' })
  documento?: string;

  @ApiPropertyOptional({
    description: 'Observações sobre a aprovação',
    example: 'Aprovado com ressalvas sobre saídas de emergência',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  observacoes?: string;
}
