import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../enums/user-role.enum';

/**
 * Decorator para definir roles necessários para acessar uma rota
 *
 * Uso:
 * @Roles(UserRole.ADMIN, UserRole.MANAGER)
 * @Get('admin-only')
 * getAdminData() { ... }
 *
 * @param ...roles - Lista de roles que podem acessar a rota
 */
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
