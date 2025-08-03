/**
 * Enum que define os tipos de plantas suportados pelo EventCAD+
 * Cada tipo tem características específicas de processamento e visualização
 */
export enum PlantaTipo {
  // Plantas Arquitetônicas
  PLANTA_BAIXA = 'planta_baixa', // Planta baixa geral
  PLANTA_COBERTURA = 'planta_cobertura', // Planta de cobertura
  PLANTA_PISO = 'planta_piso', // Planta de piso específico
  PLANTA_SUBSOLO = 'planta_subsolo', // Planta de subsolo

  // Plantas de Instalações
  INSTALACAO_ELETRICA = 'instalacao_eletrica', // Instalações elétricas
  INSTALACAO_HIDRAULICA = 'instalacao_hidraulica', // Instalações hidráulicas
  INSTALACAO_AR = 'instalacao_ar', // Ar condicionado/ventilação
  INSTALACAO_GAS = 'instalacao_gas', // Instalações de gás
  INSTALACAO_ESGOTO = 'instalacao_esgoto', // Instalações de esgoto

  // Plantas de Segurança
  SEGURANCA_INCENDIO = 'seguranca_incendio', // Prevenção de incêndio
  ROTAS_FUGA = 'rotas_fuga', // Rotas de evacuação
  SISTEMA_SPRINKLER = 'sistema_sprinkler', // Sistema de sprinklers
  ALARME_INCENDIO = 'alarme_incendio', // Sistema de alarme

  // Plantas Estruturais
  ESTRUTURAL_FUNDACAO = 'estrutural_fundacao', // Estrutura de fundação
  ESTRUTURAL_LAJE = 'estrutural_laje', // Estrutura de laje
  ESTRUTURAL_COBERTURA = 'estrutural_cobertura', // Estrutura de cobertura
  ESTRUTURAL_METALICA = 'estrutural_metalica', // Estrutura metálica

  // Plantas de Layout
  LAYOUT_MOBILIARIO = 'layout_mobiliario', // Layout de mobiliário
  LAYOUT_EQUIPAMENTOS = 'layout_equipamentos', // Layout de equipamentos
  LAYOUT_STANDS = 'layout_stands', // Layout de stands/expositores
  LAYOUT_PALCO = 'layout_palco', // Layout de palco/cenário

  // Plantas de Acessibilidade
  ACESSIBILIDADE = 'acessibilidade', // Rotas acessíveis
  ACESSIBILIDADE_SANITARIO = 'acessibilidade_sanitario', // Sanitários acessíveis
  ACESSIBILIDADE_ESTACIONAMENTO = 'acessibilidade_estacionamento', // Vagas acessíveis

  // Plantas de Evento
  SETUP_EVENTO = 'setup_evento', // Setup específico do evento
  DESMONTAGEM = 'desmontagem', // Planta de desmontagem
  LOGISTICA = 'logistica', // Logística e fluxos
  MONTAGEM = 'montagem', // Sequência de montagem

  // Plantas Técnicas Especiais
  COMUNICACAO_DADOS = 'comunicacao_dados', // Cabeamento e rede
  SONORIZACAO = 'sonorizacao', // Sistema de som
  ILUMINACAO = 'iluminacao', // Projeto de iluminação
  CENOGRAFIA = 'cenografia', // Cenografia e decoração

  // Plantas de Site/Terreno
  IMPLANTACAO = 'implantacao', // Implantação no terreno
  PAISAGISMO = 'paisagismo', // Projeto paisagístico
  TOPOGRAFIA = 'topografia', // Levantamento topográfico

  // Outros
  DETALHAMENTO = 'detalhamento', // Detalhes construtivos
  MEMORIAS_CALCULO = 'memorias_calculo', // Memórias de cálculo
  ESQUEMATICO = 'esquematico', // Desenhos esquemáticos
  AS_BUILT = 'as_built', // Como construído/executado
  REVISAO = 'revisao', // Plantas de revisão
  PERSONALIZADA = 'personalizada', // Tipo personalizado
}

/**
 * Status de processamento específico para plantas
 */
export enum PlantaStatus {
  DRAFT = 'draft', // Rascunho
  UPLOADED = 'uploaded', // Carregada
  ANALYZING = 'analyzing', // Analisando conteúdo
  PROCESSED = 'processed', // Processada com sucesso
  AI_PROCESSING = 'ai_processing', // Processamento de IA em andamento
  AI_COMPLETED = 'ai_completed', // IA completada
  REVIEW_NEEDED = 'review_needed', // Necessita revisão manual
  APPROVED = 'approved', // Aprovada para uso
  REJECTED = 'rejected', // Rejeitada
  ARCHIVED = 'archived', // Arquivada
  ERROR = 'error', // Erro no processamento
}

/**
 * Configurações específicas por tipo de planta
 */
export const PLANTA_TIPO_CONFIG: Record<
  PlantaTipo,
  {
    categoria: string;
    descricao: string;
    layersEsperados: string[];
    objetosEsperados: string[];
    validacoesObrigatorias: string[];
    compatibilidadeFormatos: string[];
    prioridadeProcessamento: 'baixa' | 'media' | 'alta' | 'critica';
    requiresAI: boolean;
    requiresManualReview: boolean;
  }
> = {
  [PlantaTipo.PLANTA_BAIXA]: {
    categoria: 'Arquitetônica',
    descricao: 'Planta baixa geral do pavimento',
    layersEsperados: ['WALLS', 'DOORS', 'WINDOWS', 'DIMENSIONS', 'TEXT'],
    objetosEsperados: ['porta', 'janela', 'parede', 'escada', 'elevador'],
    validacoesObrigatorias: ['escala', 'north_arrow', 'dimensions'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.SEGURANCA_INCENDIO]: {
    categoria: 'Segurança',
    descricao: 'Planta de prevenção e combate a incêndio',
    layersEsperados: ['FIRE_EXITS', 'EXTINGUISHERS', 'SPRINKLERS', 'ALARMS'],
    objetosEsperados: ['extintor', 'saida_emergencia', 'sprinkler', 'hidrante'],
    validacoesObrigatorias: [
      'rotas_fuga',
      'extintores_adequados',
      'sinalizacao',
    ],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'critica',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.ROTAS_FUGA]: {
    categoria: 'Segurança',
    descricao: 'Rotas de evacuação e saídas de emergência',
    layersEsperados: ['EXITS', 'ROUTES', 'ASSEMBLY_POINTS', 'SIGNAGE'],
    objetosEsperados: [
      'saida_emergencia',
      'rota_fuga',
      'ponto_encontro',
      'sinalizacao',
    ],
    validacoesObrigatorias: [
      'largura_minima',
      'distancia_maxima',
      'capacidade',
    ],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'critica',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.INSTALACAO_ELETRICA]: {
    categoria: 'Instalações',
    descricao: 'Projeto elétrico e distribuição de energia',
    layersEsperados: ['ELECTRICAL', 'OUTLETS', 'PANELS', 'LIGHTING'],
    objetosEsperados: ['tomada', 'quadro_eletrico', 'luminaria', 'interruptor'],
    validacoesObrigatorias: [
      'carga_total',
      'circuitos_protegidos',
      'aterramento',
    ],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.LAYOUT_STANDS]: {
    categoria: 'Layout',
    descricao: 'Layout de stands e expositores',
    layersEsperados: ['STANDS', 'AISLES', 'SERVICES', 'SIGNAGE'],
    objetosEsperados: ['stand', 'corredor', 'balcao', 'display'],
    validacoesObrigatorias: [
      'largura_corredores',
      'acessibilidade',
      'servicos',
    ],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.ACESSIBILIDADE]: {
    categoria: 'Acessibilidade',
    descricao: 'Rotas e facilidades para pessoas com deficiência',
    layersEsperados: ['ACCESSIBLE_ROUTES', 'RAMPS', 'ELEVATORS', 'RESTROOMS'],
    objetosEsperados: [
      'rampa',
      'elevador',
      'banheiro_acessivel',
      'vaga_deficiente',
    ],
    validacoesObrigatorias: ['nbr9050', 'inclinacao_rampas', 'largura_minima'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: true,
  },

  // Configurações padrão para os demais tipos
  [PlantaTipo.PLANTA_COBERTURA]: {
    categoria: 'Arquitetônica',
    descricao: 'Planta de cobertura e telhado',
    layersEsperados: ['ROOF', 'DRAINAGE', 'EQUIPMENT'],
    objetosEsperados: ['telha', 'calha', 'equipamento'],
    validacoesObrigatorias: ['drenagem', 'inclinacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.PLANTA_PISO]: {
    categoria: 'Arquitetônica',
    descricao: 'Planta de piso específico',
    layersEsperados: ['WALLS', 'DOORS', 'WINDOWS', 'DIMENSIONS'],
    objetosEsperados: ['porta', 'janela', 'parede'],
    validacoesObrigatorias: ['escala', 'dimensions'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.PLANTA_SUBSOLO]: {
    categoria: 'Arquitetônica',
    descricao: 'Planta de subsolo ou porão',
    layersEsperados: ['WALLS', 'FOUNDATIONS', 'UTILITIES'],
    objetosEsperados: ['parede', 'fundacao', 'instalacao'],
    validacoesObrigatorias: ['waterproofing', 'drainage'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.INSTALACAO_HIDRAULICA]: {
    categoria: 'Instalações',
    descricao: 'Instalações hidráulicas e sanitárias',
    layersEsperados: ['PLUMBING', 'FIXTURES', 'PIPES'],
    objetosEsperados: ['torneira', 'vaso', 'chuveiro', 'tubulacao'],
    validacoesObrigatorias: ['pressao_agua', 'diametros'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.INSTALACAO_AR]: {
    categoria: 'Instalações',
    descricao: 'Sistema de ar condicionado e ventilação',
    layersEsperados: ['HVAC', 'DUCTS', 'EQUIPMENT'],
    objetosEsperados: ['ar_condicionado', 'duto', 'ventilador'],
    validacoesObrigatorias: ['carga_termica', 'renovacao_ar'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.INSTALACAO_GAS]: {
    categoria: 'Instalações',
    descricao: 'Instalações de gás',
    layersEsperados: ['GAS_LINES', 'VALVES', 'METERS'],
    objetosEsperados: ['tubulacao_gas', 'valvula', 'medidor'],
    validacoesObrigatorias: ['pressao_gas', 'ventilacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.INSTALACAO_ESGOTO]: {
    categoria: 'Instalações',
    descricao: 'Sistema de esgoto e drenagem',
    layersEsperados: ['SEWAGE', 'DRAINS', 'MANHOLES'],
    objetosEsperados: ['ralo', 'tubulacao_esgoto', 'poco'],
    validacoesObrigatorias: ['inclinacao', 'diametros'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.SISTEMA_SPRINKLER]: {
    categoria: 'Segurança',
    descricao: 'Sistema de sprinklers',
    layersEsperados: ['SPRINKLERS', 'PIPES', 'VALVES'],
    objetosEsperados: ['sprinkler', 'tubulacao', 'valvula'],
    validacoesObrigatorias: ['cobertura_area', 'pressao_agua'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'critica',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.ALARME_INCENDIO]: {
    categoria: 'Segurança',
    descricao: 'Sistema de alarme de incêndio',
    layersEsperados: ['ALARMS', 'DETECTORS', 'CONTROL_PANEL'],
    objetosEsperados: ['detector', 'sirene', 'central'],
    validacoesObrigatorias: ['cobertura_detectores', 'comunicacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'critica',
    requiresAI: true,
    requiresManualReview: true,
  },

  // Adicionar configurações para todos os outros tipos...
  // (Por brevidade, vou adicionar algumas configurações padrão)

  [PlantaTipo.ESTRUTURAL_FUNDACAO]: {
    categoria: 'Estrutural',
    descricao: 'Estrutura de fundação',
    layersEsperados: ['FOUNDATIONS', 'REINFORCEMENT'],
    objetosEsperados: ['sapata', 'estaca', 'viga_baldrame'],
    validacoesObrigatorias: ['cargas', 'solo'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'alta',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.ESTRUTURAL_LAJE]: {
    categoria: 'Estrutural',
    descricao: 'Estrutura de laje',
    layersEsperados: ['SLABS', 'BEAMS', 'REINFORCEMENT'],
    objetosEsperados: ['laje', 'viga', 'armadura'],
    validacoesObrigatorias: ['cargas', 'flechas'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'alta',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.ESTRUTURAL_COBERTURA]: {
    categoria: 'Estrutural',
    descricao: 'Estrutura de cobertura',
    layersEsperados: ['ROOF_STRUCTURE', 'TRUSSES'],
    objetosEsperados: ['trelia', 'terça', 'telha'],
    validacoesObrigatorias: ['vento', 'sobrecarga'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'alta',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.ESTRUTURAL_METALICA]: {
    categoria: 'Estrutural',
    descricao: 'Estrutura metálica',
    layersEsperados: ['STEEL_STRUCTURE', 'CONNECTIONS'],
    objetosEsperados: ['perfil', 'solda', 'parafuso'],
    validacoesObrigatorias: ['conexoes', 'flambagem'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'alta',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.LAYOUT_MOBILIARIO]: {
    categoria: 'Layout',
    descricao: 'Layout de mobiliário',
    layersEsperados: ['FURNITURE', 'CIRCULATION'],
    objetosEsperados: ['mesa', 'cadeira', 'armario'],
    validacoesObrigatorias: ['circulacao', 'ergonomia'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'baixa',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.LAYOUT_EQUIPAMENTOS]: {
    categoria: 'Layout',
    descricao: 'Layout de equipamentos',
    layersEsperados: ['EQUIPMENT', 'UTILITIES'],
    objetosEsperados: ['equipamento', 'maquina', 'painel'],
    validacoesObrigatorias: ['espaco_manutencao', 'ventilacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'media',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.LAYOUT_PALCO]: {
    categoria: 'Layout',
    descricao: 'Layout de palco e cenário',
    layersEsperados: ['STAGE', 'SCENERY', 'LIGHTING'],
    objetosEsperados: ['palco', 'cenario', 'equipamento_som'],
    validacoesObrigatorias: ['visibilidade', 'seguranca'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.ACESSIBILIDADE_SANITARIO]: {
    categoria: 'Acessibilidade',
    descricao: 'Sanitários acessíveis',
    layersEsperados: ['ACCESSIBLE_RESTROOMS', 'FIXTURES'],
    objetosEsperados: ['vaso_acessivel', 'barra_apoio', 'lavatorio'],
    validacoesObrigatorias: ['nbr9050', 'espacos_minimos'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.ACESSIBILIDADE_ESTACIONAMENTO]: {
    categoria: 'Acessibilidade',
    descricao: 'Vagas de estacionamento acessíveis',
    layersEsperados: ['PARKING', 'ACCESSIBLE_SPACES'],
    objetosEsperados: ['vaga_deficiente', 'sinalizacao', 'rampa'],
    validacoesObrigatorias: ['quantidade_vagas', 'dimensoes'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.SETUP_EVENTO]: {
    categoria: 'Evento',
    descricao: 'Setup específico do evento',
    layersEsperados: ['EVENT_SETUP', 'TEMPORARY_STRUCTURES'],
    objetosEsperados: ['palco', 'stand', 'estrutura_temporaria'],
    validacoesObrigatorias: ['seguranca', 'fluxos'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.DESMONTAGEM]: {
    categoria: 'Evento',
    descricao: 'Planta de desmontagem',
    layersEsperados: ['DISMANTLING', 'SEQUENCE'],
    objetosEsperados: ['sequencia', 'equipamento', 'rota'],
    validacoesObrigatorias: ['sequencia_logica', 'seguranca'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.LOGISTICA]: {
    categoria: 'Evento',
    descricao: 'Logística e fluxos',
    layersEsperados: ['CIRCULATION', 'LOADING'],
    objetosEsperados: ['fluxo', 'carga_descarga', 'estoque'],
    validacoesObrigatorias: ['largura_corredores', 'capacidade'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: true,
    requiresManualReview: false,
  },

  [PlantaTipo.MONTAGEM]: {
    categoria: 'Evento',
    descricao: 'Sequência de montagem',
    layersEsperados: ['ASSEMBLY', 'SEQUENCE'],
    objetosEsperados: ['sequencia', 'equipamento', 'cronograma'],
    validacoesObrigatorias: ['cronograma', 'recursos'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.COMUNICACAO_DADOS]: {
    categoria: 'Técnica',
    descricao: 'Cabeamento e rede de dados',
    layersEsperados: ['DATA_CABLES', 'NETWORK'],
    objetosEsperados: ['cabo', 'switch', 'tomada_rede'],
    validacoesObrigatorias: ['topologia', 'capacidade'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.SONORIZACAO]: {
    categoria: 'Técnica',
    descricao: 'Sistema de sonorização',
    layersEsperados: ['AUDIO', 'SPEAKERS'],
    objetosEsperados: ['caixa_som', 'microfone', 'mesa_som'],
    validacoesObrigatorias: ['cobertura_audio', 'potencia'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.ILUMINACAO]: {
    categoria: 'Técnica',
    descricao: 'Projeto de iluminação',
    layersEsperados: ['LIGHTING', 'FIXTURES'],
    objetosEsperados: ['luminaria', 'refletor', 'dimmer'],
    validacoesObrigatorias: ['iluminancia', 'uniformidade'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.CENOGRAFIA]: {
    categoria: 'Técnica',
    descricao: 'Cenografia e decoração',
    layersEsperados: ['SCENERY', 'DECORATION'],
    objetosEsperados: ['cenario', 'decoracao', 'backdrop'],
    validacoesObrigatorias: ['seguranca', 'estabilidade'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'baixa',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.IMPLANTACAO]: {
    categoria: 'Site',
    descricao: 'Implantação no terreno',
    layersEsperados: ['SITE_PLAN', 'TOPOGRAPHY'],
    objetosEsperados: ['edificacao', 'via', 'paisagismo'],
    validacoesObrigatorias: ['recuos', 'drenagem'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.PAISAGISMO]: {
    categoria: 'Site',
    descricao: 'Projeto paisagístico',
    layersEsperados: ['LANDSCAPE', 'VEGETATION'],
    objetosEsperados: ['arvore', 'jardim', 'irrigacao'],
    validacoesObrigatorias: ['especies', 'irrigacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'baixa',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.TOPOGRAFIA]: {
    categoria: 'Site',
    descricao: 'Levantamento topográfico',
    layersEsperados: ['TOPOGRAPHY', 'CONTOURS'],
    objetosEsperados: ['curva_nivel', 'cota', 'marco'],
    validacoesObrigatorias: ['precisao', 'datum'],
    compatibilidadeFormatos: ['dwg', 'dxf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.DETALHAMENTO]: {
    categoria: 'Técnica',
    descricao: 'Detalhes construtivos',
    layersEsperados: ['DETAILS', 'SECTIONS'],
    objetosEsperados: ['detalhe', 'secao', 'especificacao'],
    validacoesObrigatorias: ['escala', 'dimensoes'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'baixa',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.MEMORIAS_CALCULO]: {
    categoria: 'Técnica',
    descricao: 'Memórias de cálculo',
    layersEsperados: ['CALCULATIONS', 'FORMULAS'],
    objetosEsperados: ['calculo', 'tabela', 'formula'],
    validacoesObrigatorias: ['normas', 'unidades'],
    compatibilidadeFormatos: ['pdf', 'docx'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.ESQUEMATICO]: {
    categoria: 'Técnica',
    descricao: 'Desenhos esquemáticos',
    layersEsperados: ['SCHEMATICS', 'DIAGRAMS'],
    objetosEsperados: ['diagrama', 'esquema', 'fluxo'],
    validacoesObrigatorias: ['clareza', 'legenda'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'baixa',
    requiresAI: false,
    requiresManualReview: false,
  },

  [PlantaTipo.AS_BUILT]: {
    categoria: 'Execução',
    descricao: 'Como construído/executado',
    layersEsperados: ['AS_BUILT', 'CHANGES'],
    objetosEsperados: ['alteracao', 'execucao', 'verificacao'],
    validacoesObrigatorias: ['conformidade', 'alteracoes'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc'],
    prioridadeProcessamento: 'alta',
    requiresAI: true,
    requiresManualReview: true,
  },

  [PlantaTipo.REVISAO]: {
    categoria: 'Execução',
    descricao: 'Plantas de revisão',
    layersEsperados: ['REVISIONS', 'CHANGES'],
    objetosEsperados: ['revisao', 'alteracao', 'comentario'],
    validacoesObrigatorias: ['historico', 'aprovacao'],
    compatibilidadeFormatos: ['dwg', 'dxf', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: true,
  },

  [PlantaTipo.PERSONALIZADA]: {
    categoria: 'Personalizada',
    descricao: 'Tipo personalizado definido pelo usuário',
    layersEsperados: [],
    objetosEsperados: [],
    validacoesObrigatorias: [],
    compatibilidadeFormatos: ['dwg', 'dxf', 'ifc', 'pdf'],
    prioridadeProcessamento: 'media',
    requiresAI: false,
    requiresManualReview: false,
  },
};

/**
 * Obtém configuração para um tipo de planta
 * @param tipo - Tipo da planta
 * @returns Configuração específica
 */
export function getPlantaTipoConfig(tipo: PlantaTipo) {
  return PLANTA_TIPO_CONFIG[tipo];
}

/**
 * Obtém todos os tipos de planta por categoria
 * @returns Mapa de categorias com seus tipos
 */
export function getPlantaTiposPorCategoria(): Record<string, PlantaTipo[]> {
  const categorias: Record<string, PlantaTipo[]> = {};

  Object.entries(PLANTA_TIPO_CONFIG).forEach(([tipo, config]) => {
    if (!categorias[config.categoria]) {
      categorias[config.categoria] = [];
    }
    categorias[config.categoria].push(tipo as PlantaTipo);
  });

  return categorias;
}

/**
 * Verifica se um tipo requer processamento de IA
 * @param tipo - Tipo da planta
 * @returns true se requer IA
 */
export function requiresAIProcessing(tipo: PlantaTipo): boolean {
  return PLANTA_TIPO_CONFIG[tipo].requiresAI;
}

/**
 * Verifica se um tipo requer revisão manual
 * @param tipo - Tipo da planta
 * @returns true se requer revisão
 */
export function requiresManualReview(tipo: PlantaTipo): boolean {
  return PLANTA_TIPO_CONFIG[tipo].requiresManualReview;
}

/**
 * Obtém prioridade de processamento
 * @param tipo - Tipo da planta
 * @returns Prioridade (baixa, media, alta, critica)
 */
export function getProcessingPriority(
  tipo: PlantaTipo,
): 'baixa' | 'media' | 'alta' | 'critica' {
  return PLANTA_TIPO_CONFIG[tipo].prioridadeProcessamento;
}
