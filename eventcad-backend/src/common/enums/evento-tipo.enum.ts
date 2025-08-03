/**
 * Enum que define os tipos de eventos suportados pelo EventCAD+
 * Cada tipo tem características específicas de compliance e configuração
 */
export enum EventoTipo {
  // Eventos comerciais
  FEIRA_COMERCIAL = 'feira_comercial',
  EXPOSICAO = 'exposicao',
  CONGRESSO = 'congresso',
  SEMINARIO = 'seminario',
  WORKSHOP = 'workshop',

  // Eventos corporativos
  CONVENCAO = 'convencao',
  LANCAMENTO = 'lancamento',
  REUNIAO_CORPORATIVA = 'reuniao_corporativa',
  TREINAMENTO = 'treinamento',

  // Eventos sociais
  CASAMENTO = 'casamento',
  FESTA_PRIVADA = 'festa_privada',
  FORMATURA = 'formatura',
  ANIVERSARIO = 'aniversario',

  // Eventos culturais
  SHOW = 'show',
  CONCERTO = 'concerto',
  FESTIVAL = 'festival',
  TEATRO = 'teatro',
  CINEMA = 'cinema',

  // Eventos esportivos
  COMPETICAO = 'competicao',
  TORNEIO = 'torneio',
  JOGO = 'jogo',
  CORRIDA = 'corrida',

  // Eventos especiais
  CONFERENCIA = 'conferencia',
  SUMMIT = 'summit',
  HACKATHON = 'hackathon',
  STARTUP_PITCH = 'startup_pitch',

  // Outros
  PERSONALIZADO = 'personalizado',
}

/**
 * Configurações específicas por tipo de evento
 * Define características padrão para compliance e setup
 */
export const EVENTO_TIPO_CONFIG: Record<
  EventoTipo,
  {
    categoria: string;
    capacidadeMaximaPadrao: number;
    duracaoMediaHoras: number;
    requiresLicencaEspecial: boolean;
    riscoPadrao: 'baixo' | 'medio' | 'alto';
    complianceObrigatorio: string[];
    equipamentosObrigatorios: string[];
  }
> = {
  [EventoTipo.FEIRA_COMERCIAL]: {
    categoria: 'Comercial',
    capacidadeMaximaPadrao: 5000,
    duracaoMediaHoras: 72,
    requiresLicencaEspecial: true,
    riscoPadrao: 'medio',
    complianceObrigatorio: ['AVCB', 'Licença Sanitária', 'PPCI'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'iluminacao_emergencia',
    ],
  },

  [EventoTipo.EXPOSICAO]: {
    categoria: 'Cultural',
    capacidadeMaximaPadrao: 2000,
    duracaoMediaHoras: 168, // 1 semana
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.CONGRESSO]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 1500,
    duracaoMediaHoras: 48,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.SHOW]: {
    categoria: 'Entretenimento',
    capacidadeMaximaPadrao: 10000,
    duracaoMediaHoras: 4,
    requiresLicencaEspecial: true,
    riscoPadrao: 'alto',
    complianceObrigatorio: [
      'AVCB',
      'Licença de Funcionamento',
      'PPCI',
      'Laudo Estrutural',
    ],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'iluminacao_emergencia',
      'sistema_som',
    ],
  },

  [EventoTipo.CASAMENTO]: {
    categoria: 'Social',
    capacidadeMaximaPadrao: 300,
    duracaoMediaHoras: 8,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.COMPETICAO]: {
    categoria: 'Esportivo',
    capacidadeMaximaPadrao: 8000,
    duracaoMediaHoras: 12,
    requiresLicencaEspecial: true,
    riscoPadrao: 'alto',
    complianceObrigatorio: [
      'AVCB',
      'Licença Esportiva',
      'PPCI',
      'Laudo Médico',
    ],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'enfermaria',
      'seguranca',
    ],
  },

  // Configurações padrão para os demais tipos
  [EventoTipo.SEMINARIO]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 500,
    duracaoMediaHoras: 8,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.WORKSHOP]: {
    categoria: 'Educacional',
    capacidadeMaximaPadrao: 100,
    duracaoMediaHoras: 6,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.CONVENCAO]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 3000,
    duracaoMediaHoras: 24,
    requiresLicencaEspecial: false,
    riscoPadrao: 'medio',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.LANCAMENTO]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 800,
    duracaoMediaHoras: 4,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.REUNIAO_CORPORATIVA]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 200,
    duracaoMediaHoras: 4,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.TREINAMENTO]: {
    categoria: 'Educacional',
    capacidadeMaximaPadrao: 150,
    duracaoMediaHoras: 16,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.FESTA_PRIVADA]: {
    categoria: 'Social',
    capacidadeMaximaPadrao: 500,
    duracaoMediaHoras: 6,
    requiresLicencaEspecial: false,
    riscoPadrao: 'medio',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.FORMATURA]: {
    categoria: 'Social',
    capacidadeMaximaPadrao: 800,
    duracaoMediaHoras: 6,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.ANIVERSARIO]: {
    categoria: 'Social',
    capacidadeMaximaPadrao: 200,
    duracaoMediaHoras: 4,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.CONCERTO]: {
    categoria: 'Cultural',
    capacidadeMaximaPadrao: 5000,
    duracaoMediaHoras: 3,
    requiresLicencaEspecial: true,
    riscoPadrao: 'alto',
    complianceObrigatorio: ['AVCB', 'Licença de Funcionamento', 'PPCI'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'iluminacao_emergencia',
      'sistema_som',
    ],
  },

  [EventoTipo.FESTIVAL]: {
    categoria: 'Cultural',
    capacidadeMaximaPadrao: 15000,
    duracaoMediaHoras: 48,
    requiresLicencaEspecial: true,
    riscoPadrao: 'alto',
    complianceObrigatorio: [
      'AVCB',
      'Licença de Funcionamento',
      'PPCI',
      'Licença Ambiental',
    ],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'iluminacao_emergencia',
      'enfermaria',
      'seguranca',
    ],
  },

  [EventoTipo.TEATRO]: {
    categoria: 'Cultural',
    capacidadeMaximaPadrao: 800,
    duracaoMediaHoras: 2,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'iluminacao_emergencia',
    ],
  },

  [EventoTipo.CINEMA]: {
    categoria: 'Entretenimento',
    capacidadeMaximaPadrao: 300,
    duracaoMediaHoras: 2,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.TORNEIO]: {
    categoria: 'Esportivo',
    capacidadeMaximaPadrao: 3000,
    duracaoMediaHoras: 48,
    requiresLicencaEspecial: true,
    riscoPadrao: 'medio',
    complianceObrigatorio: ['AVCB', 'Licença Esportiva', 'PPCI'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia', 'enfermaria'],
  },

  [EventoTipo.JOGO]: {
    categoria: 'Esportivo',
    capacidadeMaximaPadrao: 50000,
    duracaoMediaHoras: 3,
    requiresLicencaEspecial: true,
    riscoPadrao: 'alto',
    complianceObrigatorio: [
      'AVCB',
      'Licença Esportiva',
      'PPCI',
      'Plano de Emergência',
    ],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'enfermaria',
      'seguranca',
      'sistemas_monitoramento',
    ],
  },

  [EventoTipo.CORRIDA]: {
    categoria: 'Esportivo',
    capacidadeMaximaPadrao: 5000,
    duracaoMediaHoras: 6,
    requiresLicencaEspecial: true,
    riscoPadrao: 'medio',
    complianceObrigatorio: [
      'AVCB',
      'Licença Esportiva',
      'Autorização de Trânsito',
    ],
    equipamentosObrigatorios: [
      'primeiros_socorros',
      'sinalizacao',
      'seguranca',
    ],
  },

  [EventoTipo.CONFERENCIA]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 2000,
    duracaoMediaHoras: 16,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.SUMMIT]: {
    categoria: 'Corporativo',
    capacidadeMaximaPadrao: 1000,
    duracaoMediaHoras: 12,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB', 'Acessibilidade'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.HACKATHON]: {
    categoria: 'Tecnologia',
    capacidadeMaximaPadrao: 300,
    duracaoMediaHoras: 48,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: [
      'extintores',
      'saidas_emergencia',
      'ar_condicionado',
    ],
  },

  [EventoTipo.STARTUP_PITCH]: {
    categoria: 'Tecnologia',
    capacidadeMaximaPadrao: 200,
    duracaoMediaHoras: 4,
    requiresLicencaEspecial: false,
    riscoPadrao: 'baixo',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },

  [EventoTipo.PERSONALIZADO]: {
    categoria: 'Personalizado',
    capacidadeMaximaPadrao: 1000,
    duracaoMediaHoras: 8,
    requiresLicencaEspecial: false,
    riscoPadrao: 'medio',
    complianceObrigatorio: ['AVCB'],
    equipamentosObrigatorios: ['extintores', 'saidas_emergencia'],
  },
};

/**
 * Obtém configuração padrão para um tipo de evento
 * @param tipo - Tipo do evento
 * @returns Configuração com valores padrão
 */
export function getEventoTipoConfig(tipo: EventoTipo) {
  return EVENTO_TIPO_CONFIG[tipo];
}

/**
 * Obtém todos os tipos de evento por categoria
 * @returns Mapa de categorias com seus tipos
 */
export function getEventoTiposPorCategoria(): Record<string, EventoTipo[]> {
  const categorias: Record<string, EventoTipo[]> = {};

  Object.entries(EVENTO_TIPO_CONFIG).forEach(([tipo, config]) => {
    if (!categorias[config.categoria]) {
      categorias[config.categoria] = [];
    }
    categorias[config.categoria].push(tipo as EventoTipo);
  });

  return categorias;
}
