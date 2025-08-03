import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

/**
 * Guard JWT para proteger rotas que precisam de autenticação
 * Estende o AuthGuard do Passport para adicionar funcionalidades customizadas
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Verifica se a rota pode ser acessada
   * @param context - Contexto de execução
   * @returns true se autorizado, false/exception caso contrário
   */
  canActivate(context: ExecutionContext) {
    // Verifica se a rota está marcada como pública
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Aplica a validação JWT padrão
    return super.canActivate(context);
  }

  /**
   * Manipula erros de autenticação
   * @param err - Erro capturado
   * @param user - Usuário (se validado)
   * @param info - Informações adicionais do erro
   * @param context - Contexto de execução
   */
  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    // Se há erro ou usuário não validado, lança exceção
    if (err || !user) {
      const request = context.switchToHttp().getRequest();

      // Log do erro para auditoria
      console.error('JWT Authentication failed:', {
        url: request.url,
        method: request.method,
        ip: request.ip,
        userAgent: request.headers['user-agent'],
        error: err?.message || info?.message || 'Token inválido',
        timestamp: new Date().toISOString(),
      });

      throw (
        err || new UnauthorizedException('Token de acesso inválido ou expirado')
      );
    }

    return user;
  }
}
