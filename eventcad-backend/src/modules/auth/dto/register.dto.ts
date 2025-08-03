import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsEnum,
  IsOptional,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../../common/enums/user-role.enum';

/**
 * DTO para registro de novo usuário
 * Inclui validações robustas para todos os campos
 */
export class RegisterDto {
  @ApiProperty({
    description: 'Nome completo do usuário',
    example: 'João Silva Santos',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Nome deve ser uma string' })
  @MinLength(2, { message: 'Nome deve ter pelo menos 2 caracteres' })
  @MaxLength(100, { message: 'Nome não pode ter mais que 100 caracteres' })
  fullName: string;

  @ApiProperty({
    description: 'Email único do usuário',
    example: 'joao.silva@empresa.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  @MaxLength(150, { message: 'Email não pode ter mais que 150 caracteres' })
  email: string;

  @ApiProperty({
    description:
      'Senha segura com pelo menos 8 caracteres, incluindo maiúscula, minúscula, número e símbolo',
    example: 'MinhaSenh@123',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Senha deve conter pelo menos: 1 minúscula, 1 maiúscula, 1 número e 1 símbolo',
  })
  password: string;

  @ApiProperty({
    description: 'Role/papel do usuário no sistema',
    example: UserRole.TECHNICIAN,
    enum: UserRole,
    required: false,
  })
  @IsOptional()
  @IsEnum(UserRole, { message: 'Role deve ser um valor válido' })
  role?: UserRole;

  @ApiProperty({
    description: 'Telefone de contato',
    example: '+5511999999999',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber('BR', { message: 'Telefone deve ter um formato válido' })
  phone?: string;

  @ApiProperty({
    description: 'Cargo/função do usuário',
    example: 'Engenheiro de Segurança',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Cargo deve ser uma string' })
  @MaxLength(100, { message: 'Cargo não pode ter mais que 100 caracteres' })
  position?: string;

  @ApiProperty({
    description: 'Empresa/organização do usuário',
    example: 'EventTech Solutions Ltda',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Empresa deve ser uma string' })
  @MaxLength(100, { message: 'Empresa não pode ter mais que 100 caracteres' })
  company?: string;

  @ApiProperty({
    description:
      'ID do tenant (será automaticamente definido se não fornecido)',
    example: 'empresa-abc',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'TenantId deve ser uma string' })
  tenantId?: string;
}

/**
 * DTO para resposta de registro bem-sucedido
 */
export class RegisterResponseDto {
  @ApiProperty({
    description: 'Mensagem de sucesso',
    example:
      'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
  })
  message: string;

  @ApiProperty({
    description: 'ID do usuário criado',
    example: 'uuid-do-usuario',
  })
  userId: string;

  @ApiProperty({
    description: 'Email onde foi enviado o link de verificação',
    example: 'joao.silva@empresa.com',
  })
  email: string;

  @ApiProperty({
    description: 'Indica se precisa verificar email antes de fazer login',
    example: true,
  })
  requiresEmailVerification: boolean;
}
