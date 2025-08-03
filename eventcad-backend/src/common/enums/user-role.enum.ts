/**
 * Enum que define todos os papéis/roles disponíveis no sistema EventCAD+
 * Segue padrão hierárquico de permissões - do mais restrito ao mais amplo
 */
export enum UserRole {
  // Papéis básicos de acesso
  VIEWER = 'viewer', // Apenas visualização
  OPERATOR = 'operator', // Operação básica no campo

  // Papéis técnicos especializados
  TECHNICIAN = 'technician', // Técnico de montagem/infraestrutura
  ENGINEER = 'engineer', // Engenheiro responsável técnico
  SAFETY_OFFICER = 'safety_officer', // Responsável por segurança

  // Papéis de gestão
  PROJECT_MANAGER = 'project_manager', // Gerente de projeto/evento
  VENUE_MANAGER = 'venue_manager', // Gerente do pavilhão/local

  // Papéis de administração
  ADMIN = 'admin', // Administrador do tenant
  SUPER_ADMIN = 'super_admin', // Super administrador do sistema

  // Papéis de integração externa
  EXTERNAL_AUDITOR = 'external_auditor', // Auditor externo (bombeiros, etc)
  VENDOR = 'vendor', // Fornecedor/parceiro
  CLIENT = 'client', // Cliente final
}

/**
 * Mapeamento de hierarquia de permissões
 * Cada role herda as permissões dos roles anteriores
 */
export const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  [UserRole.VIEWER]: [],
  [UserRole.OPERATOR]: [UserRole.VIEWER],
  [UserRole.TECHNICIAN]: [UserRole.VIEWER, UserRole.OPERATOR],
  [UserRole.ENGINEER]: [
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
  ],
  [UserRole.SAFETY_OFFICER]: [
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
  ],
  [UserRole.PROJECT_MANAGER]: [
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
    UserRole.ENGINEER,
    UserRole.SAFETY_OFFICER,
  ],
  [UserRole.VENUE_MANAGER]: [
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
    UserRole.ENGINEER,
    UserRole.SAFETY_OFFICER,
  ],
  [UserRole.ADMIN]: [
    UserRole.VIEWER,
    UserRole.OPERATOR,
    UserRole.TECHNICIAN,
    UserRole.ENGINEER,
    UserRole.SAFETY_OFFICER,
    UserRole.PROJECT_MANAGER,
    UserRole.VENUE_MANAGER,
  ],
  [UserRole.SUPER_ADMIN]: Object.values(UserRole).filter(
    (role) => role !== UserRole.SUPER_ADMIN,
  ),
  [UserRole.EXTERNAL_AUDITOR]: [UserRole.VIEWER],
  [UserRole.VENDOR]: [UserRole.VIEWER, UserRole.OPERATOR],
  [UserRole.CLIENT]: [UserRole.VIEWER],
};

/**
 * Verifica se um usuário com determinado role tem permissão para executar ação de outro role
 * @param userRole - Role do usuário atual
 * @param requiredRole - Role necessário para a ação
 * @returns true se tem permissão, false caso contrário
 */
export function hasRolePermission(
  userRole: UserRole,
  requiredRole: UserRole,
): boolean {
  if (userRole === requiredRole) return true;
  if (userRole === UserRole.SUPER_ADMIN) return true;

  return ROLE_HIERARCHY[userRole]?.includes(requiredRole) || false;
}

/**
 * Obtém todos os roles que um usuário pode gerenciar
 * @param userRole - Role do usuário atual
 * @returns Array com roles que pode gerenciar
 */
export function getManageableRoles(userRole: UserRole): UserRole[] {
  if (userRole === UserRole.SUPER_ADMIN) {
    return Object.values(UserRole);
  }

  return ROLE_HIERARCHY[userRole] || [];
}
