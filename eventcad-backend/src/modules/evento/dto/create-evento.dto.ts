import {
  IsString,
  IsEnum,
  IsDateString,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsEmail,
  IsPhoneNumber,
  IsUrl,
  IsArray,
  ValidateNested,
  IsUUID,
  IsObject,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EventoTipo } from '../../../common/enums/evento-tipo.enum';

/**
 * DTO para criação de um novo evento
 * Inclui validações robustas e documentação Swagger
 */
export class CreateEventoDto {
  @ApiProperty({
    description: 'Nome/título do evento',
    example: 'Feira Internacional de Tecnologia 2025',
    minLength: 3,
    maxLength: 200,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(3, { message: 'Nome deve ter pelo menos 3 caracteres' })
  @MaxLength(200, { message: 'Nome não pode ter mais que 200 caracteres' })
  nome: string;

  @ApiPropertyOptional({
    description: 'Descrição detalhada do evento',
    example:
      'A maior feira de tecnologia da América Latina, reunindo startups, grandes empresas e investidores.',
  })
  @IsOptional()
  @IsString({ message: 'Descrição deve ser uma string' })
  @MaxLength(2000, {
    message: 'Descrição não pode ter mais que 2000 caracteres',
  })
  descricao?: string;

  @ApiProperty({
    description: 'Tipo/categoria do evento',
    example: EventoTipo.FEIRA_COMERCIAL,
    enum: EventoTipo,
  })
  @IsEnum(EventoTipo, { message: 'Tipo deve ser um valor válido' })
  tipo: EventoTipo;

  @ApiProperty({
    description: 'Data e hora de início do evento (ISO 8601)',
    example: '2025-06-15T09:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'Data de início deve ser uma data válida (ISO 8601)' },
  )
  dataInicio: string;

  @ApiProperty({
    description: 'Data e hora de fim do evento (ISO 8601)',
    example: '2025-06-17T18:00:00.000Z',
  })
  @IsDateString(
    {},
    { message: 'Data de fim deve ser uma data válida (ISO 8601)' },
  )
  dataFim: string;

  @ApiPropertyOptional({
    description: 'Data limite para montagem (ISO 8601)',
    example: '2025-06-14T08:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Data limite de montagem deve ser uma data válida' },
  )
  dataLimiteMontagem?: string;

  @ApiPropertyOptional({
    description: 'Data limite para desmontagem (ISO 8601)',
    example: '2025-06-18T20:00:00.000Z',
  })
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Data limite de desmontagem deve ser uma data válida' },
  )
  dataLimiteDesmontagem?: string;

  @ApiProperty({
    description: 'Nome do local/venue do evento',
    example: 'Centro de Convenções Anhembi',
    maxLength: 300,
  })
  @IsString({ message: 'Local deve ser uma string' })
  @MinLength(3, { message: 'Local deve ter pelo menos 3 caracteres' })
  @MaxLength(300, { message: 'Local não pode ter mais que 300 caracteres' })
  local: string;

  @ApiPropertyOptional({
    description: 'Endereço completo do local',
    example: 'Av. Olavo Fontoura, 1209 - Santana, São Paulo - SP',
  })
  @IsOptional()
  @IsString({ message: 'Endereço deve ser uma string' })
  @MaxLength(500, { message: 'Endereço não pode ter mais que 500 caracteres' })
  endereco?: string;

  @ApiPropertyOptional({
    description: 'Cidade do evento',
    example: 'São Paulo',
  })
  @IsOptional()
  @IsString({ message: 'Cidade deve ser uma string' })
  @MaxLength(100, { message: 'Cidade não pode ter mais que 100 caracteres' })
  cidade?: string;

  @ApiPropertyOptional({
    description: 'Estado/região do evento',
    example: 'SP',
  })
  @IsOptional()
  @IsString({ message: 'Estado deve ser uma string' })
  @MaxLength(50, { message: 'Estado não pode ter mais que 50 caracteres' })
  estado?: string;

  @ApiPropertyOptional({
    description: 'CEP do local',
    example: '02012-010',
  })
  @IsOptional()
  @IsString({ message: 'CEP deve ser uma string' })
  @MaxLength(20, { message: 'CEP não pode ter mais que 20 caracteres' })
  cep?: string;

  @ApiProperty({
    description: 'Capacidade máxima de público',
    example: 5000,
    minimum: 1,
    maximum: 1000000,
  })
  @IsNumber({}, { message: 'Capacidade máxima deve ser um número' })
  @Min(1, { message: 'Capacidade máxima deve ser pelo menos 1' })
  @Max(1000000, { message: 'Capacidade máxima não pode exceder 1.000.000' })
  @Transform(({ value }) => parseInt(value, 10))
  capacidadeMaxima: number;

  @ApiPropertyOptional({
    description: 'Público esperado/estimado',
    example: 3500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Público esperado deve ser um número' })
  @Min(0, { message: 'Público esperado não pode ser negativo' })
  @Transform(({ value }) => parseInt(value, 10))
  publicoEsperado?: number;

  @ApiPropertyOptional({
    description: 'Área total do evento em m²',
    example: 2500.5,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Área total deve ser um número' })
  @Min(0, { message: 'Área total não pode ser negativa' })
  @Transform(({ value }) => parseFloat(value))
  areaTotal?: number;

  @ApiPropertyOptional({
    description: 'Área construída em m²',
    example: 1800.25,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Área construída deve ser um número' })
  @Min(0, { message: 'Área construída não pode ser negativa' })
  @Transform(({ value }) => parseFloat(value))
  areaConstruida?: number;

  @ApiPropertyOptional({
    description: 'Altura máxima utilizada em metros',
    example: 12.5,
    minimum: 0,
    maximum: 200,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Altura máxima deve ser um número' })
  @Min(0, { message: 'Altura máxima não pode ser negativa' })
  @Max(200, { message: 'Altura máxima não pode exceder 200 metros' })
  @Transform(({ value }) => parseFloat(value))
  alturaMaxima?: number;

  @ApiPropertyOptional({
    description: 'ID do engenheiro responsável (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, {
    message: 'ID do engenheiro responsável deve ser um UUID válido',
  })
  engenheiroResponsavelId?: string;

  @ApiPropertyOptional({
    description: 'ID do responsável pela segurança (UUID)',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsOptional()
  @IsUUID(4, {
    message: 'ID do responsável pela segurança deve ser um UUID válido',
  })
  responsavelSegurancaId?: string;

  @ApiPropertyOptional({
    description: 'Lista de IDs da equipe técnica',
    example: [
      'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
      'b2c3d4e5-f6g7-8901-bcde-f23456789012',
    ],
    type: [String],
  })
  @IsOptional()
  @IsArray({ message: 'Equipe técnica deve ser um array' })
  @IsUUID(4, {
    each: true,
    message: 'Cada ID da equipe técnica deve ser um UUID válido',
  })
  equipeTecnica?: string[];

  @ApiPropertyOptional({
    description: 'Email de contato do evento',
    example: 'contato@feiratecnologia.com.br',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email de contato deve ter formato válido' })
  @MaxLength(150, { message: 'Email não pode ter mais que 150 caracteres' })
  emailContato?: string;

  @ApiPropertyOptional({
    description: 'Telefone de contato',
    example: '+5511999999999',
  })
  @IsOptional()
  @IsPhoneNumber('BR', { message: 'Telefone deve ter formato válido' })
  telefoneContato?: string;

  @ApiPropertyOptional({
    description: 'Website ou página do evento',
    example: 'https://feiratecnologia.com.br',
  })
  @IsOptional()
  @IsUrl({}, { message: 'Website deve ser uma URL válida' })
  website?: string;

  @ApiPropertyOptional({
    description: 'Configurações técnicas específicas do evento',
    example: {
      energiaRequerida: 500,
      aguaRequerida: true,
      ar_condicionado: true,
      internet: true,
      som: true,
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações técnicas devem ser um objeto' })
  configuracoesTecnicas?: {
    energiaRequerida?: number;
    aguaRequerida?: boolean;
    esgoto?: boolean;
    ar_condicionado?: boolean;
    aquecimento?: boolean;
    internet?: boolean;
    som?: boolean;
    iluminacao_especial?: boolean;
    estruturas_temporarias?: boolean;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Orçamento total previsto',
    example: 250000.0,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Orçamento total deve ser um número' })
  @Min(0, { message: 'Orçamento total não pode ser negativo' })
  @Transform(({ value }) => parseFloat(value))
  orcamentoTotal?: number;

  @ApiPropertyOptional({
    description: 'Moeda utilizada no orçamento (código ISO 4217)',
    example: 'BRL',
    default: 'BRL',
  })
  @IsOptional()
  @IsString({ message: 'Moeda deve ser uma string' })
  @MinLength(3, { message: 'Código da moeda deve ter 3 caracteres' })
  @MaxLength(3, { message: 'Código da moeda deve ter 3 caracteres' })
  moeda?: string;

  @ApiPropertyOptional({
    description: 'Nível de risco do evento',
    example: 'medio',
    enum: ['baixo', 'medio', 'alto', 'critico'],
  })
  @IsOptional()
  @IsEnum(['baixo', 'medio', 'alto', 'critico'], {
    message: 'Nível de risco deve ser: baixo, medio, alto ou critico',
  })
  nivelRisco?: 'baixo' | 'medio' | 'alto' | 'critico';

  @ApiPropertyOptional({
    description: 'Observações gerais sobre o evento',
    example: 'Evento de grande porte com participação internacional.',
  })
  @IsOptional()
  @IsString({ message: 'Observações devem ser uma string' })
  @MaxLength(2000, {
    message: 'Observações não podem ter mais que 2000 caracteres',
  })
  observacoes?: string;

  @ApiPropertyOptional({
    description: 'Configurações de notificações',
    example: {
      email: true,
      sms: false,
      push: true,
      alertas: {
        prazo_aprovacao: 7,
        prazo_montagem: 3,
        capacidade_limite: 90,
      },
    },
  })
  @IsOptional()
  @IsObject({ message: 'Configurações de notificação devem ser um objeto' })
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    webhook?: string;
    alertas?: {
      prazo_aprovacao?: number;
      prazo_montagem?: number;
      capacidade_limite?: number;
    };
  };
}

/**
 * Classe para validação de fornecedores/parceiros
 */
export class FornecedorDto {
  @ApiProperty({
    description: 'Nome do fornecedor',
    example: 'Empresa de Estruturas Metálicas Ltda',
  })
  @IsString({ message: 'Nome do fornecedor deve ser uma string' })
  @MinLength(2, {
    message: 'Nome do fornecedor deve ter pelo menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'Nome do fornecedor não pode ter mais que 100 caracteres',
  })
  nome: string;

  @ApiProperty({
    description: 'Tipo/categoria do fornecedor',
    example: 'estruturas',
  })
  @IsString({ message: 'Tipo do fornecedor deve ser uma string' })
  tipo: string;

  @ApiPropertyOptional({
    description: 'Contato do fornecedor',
    example: 'joao@estruturas.com.br',
  })
  @IsOptional()
  @IsString({ message: 'Contato deve ser uma string' })
  contato?: string;

  @ApiPropertyOptional({
    description: 'Responsabilidade do fornecedor no evento',
    example: 'Montagem de estruturas metálicas e stands',
  })
  @IsOptional()
  @IsString({ message: 'Responsabilidade deve ser uma string' })
  responsabilidade?: string;
}
