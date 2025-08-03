import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para injetar o tenant ID atual nos parâmetros do método
 * Obtém o tenantId do usuário autenticado para garantir isolamento multi-tenant
 *
 * Uso:
 * @Get('events')
 * getEvents(@CurrentTenant() tenantId: string) {
 *   return this.eventsService.findByTenant(tenantId);
 * }
 */
export const CurrentTenant = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.tenantId) {
      throw new Error('Tenant ID não encontrado no usuário autenticado');
    }

    return user.tenantId;
  },
);
