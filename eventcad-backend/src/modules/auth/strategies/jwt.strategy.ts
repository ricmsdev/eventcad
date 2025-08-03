import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Payload do JWT token
 */
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  role: string; // User role
  tenantId: string; // Tenant ID for multi-tenancy
  iat?: number; // Issued at
  exp?: number; // Expires at
}

/**
 * Estratégia JWT para autenticação via Bearer token
 * Valida tokens JWT e extrai informações do usuário
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'default-secret',
      algorithms: ['HS256'],
    });
  }

  /**
   * Valida o payload do JWT e retorna o usuário
   * @param payload - Dados decodificados do JWT
   * @returns User object ou lança exceção se inválido
   */
  async validate(payload: JwtPayload) {
    const { sub: userId, email, tenantId } = payload;

    // Busca o usuário no banco para verificar se ainda existe e está ativo
    const user = await this.authService.validateUserById(userId);

    if (!user) {
      throw new UnauthorizedException('Token inválido: usuário não encontrado');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Conta de usuário está inativa');
    }

    if (user.tenantId !== tenantId) {
      throw new UnauthorizedException('Token inválido: tenant não confere');
    }

    if (user.email !== email) {
      throw new UnauthorizedException('Token inválido: email não confere');
    }

    // Verifica se a conta não está bloqueada
    if (user.isLocked()) {
      throw new UnauthorizedException('Conta temporariamente bloqueada');
    }

    // Retorna dados do usuário que serão anexados ao request
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      tenantId: user.tenantId,
      lastLoginAt: user.lastLoginAt,
      settings: user.settings,
    };
  }
}
