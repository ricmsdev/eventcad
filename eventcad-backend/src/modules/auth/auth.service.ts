import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from './entities/user.entity';
import { LoginDto, LoginResponseDto } from './dto/login.dto';
import { RegisterDto, RegisterResponseDto } from './dto/register.dto';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtPayload } from './strategies/jwt.strategy';
import * as crypto from 'crypto';

/**
 * Serviço de autenticação e autorização do EventCAD+
 *
 * Funcionalidades:
 * - Login/logout com JWT
 * - Registro de novos usuários
 * - Verificação de email
 * - Reset de senha
 * - Controle de tentativas de login
 * - MFA (Multi-Factor Authentication)
 * - Auditoria de acessos
 */
@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Valida credenciais do usuário para login
   * @param email - Email do usuário
   * @param password - Senha em texto plano
   * @param metadata - Informações de contexto (IP, User-Agent, etc.)
   * @returns User se válido, null caso contrário
   */
  async validateUser(
    email: string,
    password: string,
    metadata?: { clientIp?: string; userAgent?: string },
  ): Promise<User | null> {
    try {
      // Busca usuário por email (case-insensitive)
      const user = await this.userRepository.findOne({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        return null;
      }

      // Verifica se a conta está bloqueada
      if (user.isLocked()) {
        throw new UnauthorizedException(
          `Conta bloqueada até ${user.lockedUntil?.toLocaleString()}`,
        );
      }

      // Verifica se a conta está ativa
      if (!user.isActive) {
        throw new UnauthorizedException('Conta desativada');
      }

      // Verifica se o email foi confirmado
      if (!user.emailVerified) {
        throw new UnauthorizedException(
          'Email não verificado. Verifique sua caixa de entrada.',
        );
      }

      // Valida a senha
      const isPasswordValid = await user.validatePassword(password);
      if (!isPasswordValid) {
        // Incrementa tentativas de login falha
        user.incrementLoginAttempts();
        await this.userRepository.save(user);
        return null;
      }

      // Reset das tentativas de login e atualiza último acesso
      user.resetLoginAttempts();
      if (metadata?.clientIp) {
        user.lastLoginIp = metadata.clientIp;
      }
      await this.userRepository.save(user);

      return user;
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Erro na validação do usuário');
    }
  }

  /**
   * Valida usuário por ID (usado pelo JWT Strategy)
   * @param userId - ID do usuário
   * @returns User se encontrado e ativo
   */
  async validateUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });
  }

  /**
   * Realiza login e retorna tokens JWT
   * @param loginDto - Dados de login
   * @param metadata - Informações de contexto
   * @returns Tokens e informações do usuário
   */
  async login(
    loginDto: LoginDto,
    metadata?: { clientIp?: string; userAgent?: string },
  ): Promise<LoginResponseDto> {
    const { email, password, mfaCode, rememberMe } = loginDto;

    // Valida credenciais
    const user = await this.validateUser(email, password, metadata);
    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Verifica MFA se habilitado
    if (user.mfaEnabled) {
      if (!mfaCode) {
        throw new UnauthorizedException('Código MFA é obrigatório');
      }

      const isMfaValid = await this.validateMfaCode(user, mfaCode);
      if (!isMfaValid) {
        throw new UnauthorizedException('Código MFA inválido');
      }
    }

    // Gera tokens
    const tokens = await this.generateTokens(user, rememberMe);

    return {
      ...tokens,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        tenantId: user.tenantId,
        avatar: user.avatar,
      },
    };
  }

  /**
   * Registra novo usuário
   * @param registerDto - Dados do novo usuário
   * @param tenantId - ID do tenant (se não fornecido, usa o padrão)
   * @returns Informações do usuário criado
   */
  async register(
    registerDto: RegisterDto,
    tenantId?: string,
  ): Promise<RegisterResponseDto> {
    const { email, password, fullName, role, phone, position, company } =
      registerDto;

    // Verifica se email já existe
    const existingUser = await this.userRepository.findOne({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      throw new ConflictException('Email já está em uso');
    }

    // Cria novo usuário
    const user = this.userRepository.create({
      email: email.toLowerCase(),
      password,
      fullName,
      role: role || UserRole.VIEWER,
      phone,
      position,
      company,
      tenantId: tenantId || registerDto.tenantId || 'default',
      emailVerificationToken: this.generateEmailVerificationToken(),
      emailVerified: false,
    });

    await this.userRepository.save(user);

    // Aqui seria enviado o email de verificação
    // await this.emailService.sendVerificationEmail(user);

    return {
      message:
        'Usuário criado com sucesso. Verifique seu email para ativar a conta.',
      userId: user.id,
      email: user.email,
      requiresEmailVerification: true,
    };
  }

  /**
   * Gera tokens JWT (acesso e refresh)
   * @param user - Usuário autenticado
   * @param rememberMe - Se deve gerar token de longa duração
   * @returns Tokens e metadados
   */
  private async generateTokens(
    user: User,
    rememberMe = false,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
    };

    const expiresIn = rememberMe
      ? '30d'
      : this.configService.get<string>('JWT_EXPIRES_IN', '1h');

    const accessToken = this.jwtService.sign(payload, { expiresIn });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
    });

    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.parseExpirationTime(expiresIn),
    };
  }

  /**
   * Refresh do token de acesso
   * @param refreshToken - Token de refresh válido
   * @returns Novo token de acesso
   */
  async refreshToken(
    refreshToken: string,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.validateUserById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Token de refresh inválido');
    }
  }

  /**
   * Verifica código MFA
   * @param user - Usuário
   * @param code - Código MFA fornecido
   * @returns true se válido
   */
  private async validateMfaCode(user: User, code: string): Promise<boolean> {
    // Aqui seria implementada a validação TOTP/Google Authenticator
    // Por enquanto, simula validação
    return code.length === 6 && /^\d+$/.test(code);
  }

  /**
   * Gera token para verificação de email
   * @returns Token único
   */
  private generateEmailVerificationToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Converte string de expiração para segundos
   * @param expiresIn - String como '1h', '30d', etc.
   * @returns Segundos até expiração
   */
  private parseExpirationTime(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([hdm])$/);
    if (!match) return 3600; // 1 hora padrão

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 'h':
        return num * 3600;
      case 'd':
        return num * 24 * 3600;
      case 'm':
        return num * 60;
      default:
        return 3600;
    }
  }

  /**
   * Log de tentativa de login falhada para auditoria
   * @param email - Email tentado
   * @param clientIp - IP do cliente
   * @param userAgent - User agent do navegador
   */
  async logFailedLogin(
    email: string,
    clientIp: string,
    userAgent: string,
  ): Promise<void> {
    // Aqui seria implementado log estruturado para auditoria
    console.warn('Failed login attempt:', {
      email,
      clientIp,
      userAgent,
      timestamp: new Date().toISOString(),
    });
  }
}
