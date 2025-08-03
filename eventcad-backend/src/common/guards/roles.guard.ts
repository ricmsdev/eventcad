import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, hasRolePermission } from '../enums/user-role.enum';

/**
 * Guard para controle de acesso baseado em roles (RBAC)
 * Verifica se o usuário tem permissão para acessar determinada rota
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Verifica se o usuário tem o role necessário para acessar a rota
   * @param context - Contexto de execução
   * @returns true se autorizado, lança exceção caso contrário
   */
  canActivate(context: ExecutionContext): boolean {
    // Obtém os roles requeridos da metadata do decorator
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      'roles',
      [context.getHandler(), context.getClass()],
    );

    // Se não há roles definidos, permite acesso
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Se não há usuário (não passou pelo JwtAuthGuard), nega acesso
    if (!user) {
      throw new ForbiddenException('Usuário não autenticado');
    }

    // Verifica se o usuário tem pelo menos um dos roles necessários
    const hasPermission = requiredRoles.some((requiredRole) =>
      hasRolePermission(user.role, requiredRole),
    );

    if (!hasPermission) {
      // Log da tentativa de acesso negado para auditoria
      console.warn('Access denied - Insufficient permissions:', {
        userId: user.id,
        userRole: user.role,
        requiredRoles,
        url: request.url,
        method: request.method,
        ip: request.ip,
        timestamp: new Date().toISOString(),
      });

      throw new ForbiddenException(
        `Acesso negado. Roles necessários: ${requiredRoles.join(', ')}`,
      );
    }

    return true;
  }
}
