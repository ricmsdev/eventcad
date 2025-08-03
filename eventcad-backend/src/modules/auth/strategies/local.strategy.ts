import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { User } from '../entities/user.entity';

/**
 * Estratégia Local para autenticação via email/senha
 * Usado no endpoint de login para validar credenciais
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(private readonly authService: AuthService) {
    super({
      usernameField: 'email', // Usa email como campo de username
      passwordField: 'password',
      passReqToCallback: true, // Permite acesso ao request object
    });
  }

  /**
   * Valida as credenciais do usuário
   * @param request - Request object (para capturar IP, etc.)
   * @param email - Email do usuário
   * @param password - Senha do usuário
   * @returns User object se válido, ou lança exceção
   */
  async validate(request: any, email: string, password: string): Promise<User> {
    // Captura informações do request para auditoria
    const clientIp = this.extractClientIp(request);
    const userAgent = request.headers['user-agent'] || '';

    try {
      // Valida credenciais usando o AuthService
      const user = await this.authService.validateUser(email, password, {
        clientIp,
        userAgent,
      });

      if (!user) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      return user;
    } catch (error) {
      // Log da tentativa de login falhada para auditoria
      await this.authService.logFailedLogin(email, clientIp, userAgent);

      throw new UnauthorizedException(error.message || 'Erro na autenticação');
    }
  }

  /**
   * Extrai o IP real do cliente considerando proxies e load balancers
   * @param request - Request object
   * @returns IP do cliente
   */
  private extractClientIp(request: any): string {
    return (
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.headers['x-real-ip'] ||
      request.connection.remoteAddress ||
      request.socket.remoteAddress ||
      request.ip ||
      'unknown'
    );
  }
}
