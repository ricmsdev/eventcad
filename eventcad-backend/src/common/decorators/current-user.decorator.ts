import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Decorator para injetar o usuário atual nos parâmetros do método
 * Obtém os dados do usuário que foram anexados ao request pelo JwtStrategy
 *
 * Uso:
 * @Get('profile')
 * getProfile(@CurrentUser() user: any) {
 *   return user;
 * }
 *
 * Ou para obter apenas um campo específico:
 * @Get('my-events')
 * getMyEvents(@CurrentUser('id') userId: string) {
 *   return this.eventsService.findByUserId(userId);
 * }
 */
export const CurrentUser = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Se especificou um campo específico, retorna apenas esse campo
    return data ? user?.[data] : user;
  },
);
