import { SetMetadata } from '@nestjs/common';

/**
 * Decorator para marcar rotas como públicas (não precisam de autenticação)
 *
 * Uso:
 * @Public()
 * @Get('health')
 * getHealth() { ... }
 */
export const Public = () => SetMetadata('isPublic', true);
