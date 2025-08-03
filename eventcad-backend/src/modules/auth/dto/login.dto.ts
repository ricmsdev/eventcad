import {
  IsEmail,
  IsString,
  MinLength,
  IsOptional,
  IsBoolean,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para login de usuário
 * Valida dados de entrada para autenticação
 */
export class LoginDto {
  @ApiProperty({
    description: 'Email do usuário',
    example: 'usuario@exemplo.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Email deve ter um formato válido' })
  email: string;

  @ApiProperty({
    description: 'Senha do usuário',
    example: 'MinhaSenh@123',
    minLength: 8,
  })
  @IsString({ message: 'Senha deve ser uma string' })
  @MinLength(8, { message: 'Senha deve ter pelo menos 8 caracteres' })
  password: string;

  @ApiProperty({
    description: 'Código MFA (se habilitado)',
    example: '123456',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'Código MFA deve ser uma string' })
  mfaCode?: string;

  @ApiProperty({
    description: 'Lembrar login (manter sessão por mais tempo)',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean({ message: 'RememberMe deve ser um boolean' })
  rememberMe?: boolean;
}

/**
 * DTO para resposta de login bem-sucedido
 */
export class LoginResponseDto {
  @ApiProperty({
    description: 'Token JWT de acesso',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  accessToken: string;

  @ApiProperty({
    description: 'Token para renovação',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  refreshToken: string;

  @ApiProperty({
    description: 'Tipo do token (sempre Bearer)',
    example: 'Bearer',
  })
  tokenType: string;

  @ApiProperty({
    description: 'Tempo de expiração em segundos',
    example: 3600,
  })
  expiresIn: number;

  @ApiProperty({
    description: 'Informações básicas do usuário',
  })
  user: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    tenantId: string;
    avatar?: string;
  };
}
