/**
 * Enum que define todos os status possíveis de um evento no EventCAD+
 * Representa o ciclo de vida completo desde planejamento até finalização
 */
export enum EventStatus {
  // Fase de planejamento
  DRAFT = 'draft', // Rascunho inicial
  PLANNING = 'planning', // Em planejamento
  AWAITING_APPROVAL = 'awaiting_approval', // Aguardando aprovação

  // Fase de aprovação
  UNDER_REVIEW = 'under_review', // Em análise pelos órgãos
  APPROVED = 'approved', // Aprovado para execução
  REJECTED = 'rejected', // Rejeitado, precisa correções

  // Fase de preparação
  PREPARING = 'preparing', // Preparando infraestrutura
  READY = 'ready', // Pronto para início

  // Fase de execução
  ONGOING = 'ongoing', // Em andamento
  PAUSED = 'paused', // Pausado temporariamente

  // Fase de finalização
  COMPLETED = 'completed', // Concluído com sucesso
  CANCELLED = 'cancelled', // Cancelado
  FAILED = 'failed', // Falhou durante execução

  // Status de manutenção
  ARCHIVED = 'archived', // Arquivado
}

/**
 * Mapeamento de transições válidas entre status
 * Define quais mudanças de status são permitidas
 */
export const STATUS_TRANSITIONS: Record<EventStatus, EventStatus[]> = {
  [EventStatus.DRAFT]: [EventStatus.PLANNING, EventStatus.CANCELLED],

  [EventStatus.PLANNING]: [
    EventStatus.DRAFT,
    EventStatus.AWAITING_APPROVAL,
    EventStatus.CANCELLED,
  ],

  [EventStatus.AWAITING_APPROVAL]: [
    EventStatus.PLANNING,
    EventStatus.UNDER_REVIEW,
    EventStatus.CANCELLED,
  ],

  [EventStatus.UNDER_REVIEW]: [
    EventStatus.AWAITING_APPROVAL,
    EventStatus.APPROVED,
    EventStatus.REJECTED,
  ],

  [EventStatus.APPROVED]: [EventStatus.PREPARING, EventStatus.CANCELLED],

  [EventStatus.REJECTED]: [EventStatus.PLANNING, EventStatus.CANCELLED],

  [EventStatus.PREPARING]: [EventStatus.READY, EventStatus.CANCELLED],

  [EventStatus.READY]: [EventStatus.ONGOING, EventStatus.CANCELLED],

  [EventStatus.ONGOING]: [
    EventStatus.PAUSED,
    EventStatus.COMPLETED,
    EventStatus.FAILED,
    EventStatus.CANCELLED,
  ],

  [EventStatus.PAUSED]: [
    EventStatus.ONGOING,
    EventStatus.CANCELLED,
    EventStatus.FAILED,
  ],

  [EventStatus.COMPLETED]: [EventStatus.ARCHIVED],

  [EventStatus.CANCELLED]: [EventStatus.ARCHIVED],

  [EventStatus.FAILED]: [EventStatus.PLANNING, EventStatus.ARCHIVED],

  [EventStatus.ARCHIVED]: [],
};

/**
 * Verifica se uma transição de status é válida
 * @param currentStatus - Status atual do evento
 * @param newStatus - Novo status desejado
 * @returns true se a transição é válida, false caso contrário
 */
export function isValidStatusTransition(
  currentStatus: EventStatus,
  newStatus: EventStatus,
): boolean {
  if (currentStatus === newStatus) return true;
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false;
}

/**
 * Obtém próximos status possíveis para um evento
 * @param currentStatus - Status atual do evento
 * @returns Array com status possíveis
 */
export function getNextPossibleStatuses(
  currentStatus: EventStatus,
): EventStatus[] {
  return STATUS_TRANSITIONS[currentStatus] || [];
}

/**
 * Verifica se o evento está em fase ativa (não finalizado)
 * @param status - Status do evento
 * @returns true se está ativo, false se finalizado
 */
export function isActiveStatus(status: EventStatus): boolean {
  const finalizedStatuses = [
    EventStatus.COMPLETED,
    EventStatus.CANCELLED,
    EventStatus.FAILED,
    EventStatus.ARCHIVED,
  ];

  return !finalizedStatuses.includes(status);
}
