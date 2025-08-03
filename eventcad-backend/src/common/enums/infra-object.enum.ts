/**
 * Enums e configurações para sistema de objetos de infraestrutura do EventCAD+
 * Gestão de objetos detectados pela IA com edição manual e classificação
 */

/**
 * Status do objeto de infraestrutura
 */
export enum InfraObjectStatus {
  DETECTED = 'detected', // Detectado pela IA
  PENDING_REVIEW = 'pending_review', // Aguardando revisão
  UNDER_REVIEW = 'under_review', // Em revisão
  APPROVED = 'approved', // Aprovado pelo engenheiro
  REJECTED = 'rejected', // Rejeitado
  MODIFIED = 'modified', // Modificado manualmente
  CONFLICTED = 'conflicted', // Em conflito (duplicatas, etc)
  ARCHIVED = 'archived', // Arquivado
}

/**
 * Origem do objeto
 */
export enum InfraObjectSource {
  AI_DETECTION = 'ai_detection', // Detectado por IA
  MANUAL_CREATION = 'manual_creation', // Criado manualmente
  IMPORTED = 'imported', // Importado de arquivo
  TEMPLATE = 'template', // Criado a partir de template
  DUPLICATED = 'duplicated', // Duplicado de outro objeto
}

/**
 * Nível de confiança
 */
export enum ConfidenceLevel {
  VERY_LOW = 'very_low', // 0-20%
  LOW = 'low', // 21-40%
  MEDIUM = 'medium', // 41-60%
  HIGH = 'high', // 61-80%
  VERY_HIGH = 'very_high', // 81-100%
}

/**
 * Criticidade do objeto para segurança
 */
export enum SafetyCriticality {
  NONE = 'none', // Não crítico para segurança
  LOW = 'low', // Baixa criticidade
  MEDIUM = 'medium', // Média criticidade
  HIGH = 'high', // Alta criticidade
  CRITICAL = 'critical', // Crítico para segurança
}

/**
 * Tipo de validação necessária
 */
export enum ValidationType {
  VISUAL = 'visual', // Validação visual apenas
  DIMENSIONAL = 'dimensional', // Validação dimensional
  TECHNICAL = 'technical', // Validação técnica
  COMPLIANCE = 'compliance', // Validação de compliance
  STRUCTURAL = 'structural', // Validação estrutural
  ELECTRICAL = 'electrical', // Validação elétrica
  FIRE_SAFETY = 'fire_safety', // Validação de segurança contra incêndio
}

/**
 * Ações permitidas no objeto
 */
export enum ObjectAction {
  VIEW = 'view',
  EDIT = 'edit',
  DELETE = 'delete',
  APPROVE = 'approve',
  REJECT = 'reject',
  MODIFY = 'modify',
  DUPLICATE = 'duplicate',
  EXPORT = 'export',
  ANNOTATE = 'annotate',
  VALIDATE = 'validate',
}

/**
 * Categorias detalhadas de objetos por sistema
 */
export const INFRA_OBJECT_CATEGORIES = {
  // === ARQUITETÔNICOS ===
  ARCHITECTURAL: {
    name: 'Arquitetônicos',
    types: {
      DOOR: {
        name: 'Porta',
        icon: 'door',
        properties: [
          'width',
          'height',
          'opening_direction',
          'material',
          'fire_rating',
        ],
        validations: [ValidationType.DIMENSIONAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.MEDIUM,
      },
      WINDOW: {
        name: 'Janela',
        icon: 'window',
        properties: ['width', 'height', 'glass_type', 'frame_material'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.LOW,
      },
      WALL: {
        name: 'Parede',
        icon: 'wall',
        properties: [
          'length',
          'height',
          'thickness',
          'material',
          'load_bearing',
        ],
        validations: [ValidationType.DIMENSIONAL, ValidationType.STRUCTURAL],
        criticality: SafetyCriticality.MEDIUM,
      },
      STAIR: {
        name: 'Escada',
        icon: 'stairs',
        properties: ['steps', 'rise', 'run', 'width', 'handrail'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
      ELEVATOR: {
        name: 'Elevador',
        icon: 'elevator',
        properties: ['capacity', 'floors', 'width', 'depth', 'accessible'],
        validations: [ValidationType.TECHNICAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
    },
  },

  // === SEGURANÇA CONTRA INCÊNDIO ===
  FIRE_SAFETY: {
    name: 'Segurança Contra Incêndio',
    types: {
      FIRE_EXTINGUISHER: {
        name: 'Extintor',
        icon: 'fire-extinguisher',
        properties: ['type', 'capacity', 'pressure', 'expiry_date', 'height'],
        validations: [ValidationType.COMPLIANCE, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
      EMERGENCY_EXIT: {
        name: 'Saída de Emergência',
        icon: 'exit',
        properties: ['width', 'height', 'capacity', 'illuminated', 'panic_bar'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
      SPRINKLER: {
        name: 'Sprinkler',
        icon: 'sprinkler',
        properties: ['type', 'coverage_area', 'pressure', 'temperature_rating'],
        validations: [ValidationType.TECHNICAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
      SMOKE_DETECTOR: {
        name: 'Detector de Fumaça',
        icon: 'smoke-detector',
        properties: ['type', 'sensitivity', 'coverage_area', 'battery_level'],
        validations: [ValidationType.TECHNICAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
      FIRE_ALARM: {
        name: 'Alarme de Incêndio',
        icon: 'alarm',
        properties: ['type', 'decibel_level', 'strobe', 'network_connected'],
        validations: [ValidationType.TECHNICAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
      HYDRANT: {
        name: 'Hidrante',
        icon: 'hydrant',
        properties: ['type', 'pressure', 'flow_rate', 'hose_length'],
        validations: [ValidationType.TECHNICAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.CRITICAL,
      },
    },
  },

  // === INSTALAÇÕES ELÉTRICAS ===
  ELECTRICAL: {
    name: 'Instalações Elétricas',
    types: {
      OUTLET: {
        name: 'Tomada',
        icon: 'outlet',
        properties: ['voltage', 'amperage', 'type', 'grounded', 'gfci'],
        validations: [ValidationType.ELECTRICAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.MEDIUM,
      },
      SWITCH: {
        name: 'Interruptor',
        icon: 'switch',
        properties: ['type', 'voltage', 'amperage', 'dimmer'],
        validations: [ValidationType.ELECTRICAL],
        criticality: SafetyCriticality.LOW,
      },
      ELECTRICAL_PANEL: {
        name: 'Quadro Elétrico',
        icon: 'electrical-panel',
        properties: ['capacity', 'voltage', 'circuits', 'main_breaker'],
        validations: [ValidationType.ELECTRICAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
      LIGHT_FIXTURE: {
        name: 'Luminária',
        icon: 'light',
        properties: ['type', 'wattage', 'lumens', 'color_temperature'],
        validations: [ValidationType.ELECTRICAL],
        criticality: SafetyCriticality.LOW,
      },
      EMERGENCY_LIGHT: {
        name: 'Luz de Emergência',
        icon: 'emergency-light',
        properties: ['wattage', 'battery_backup', 'runtime', 'led'],
        validations: [ValidationType.ELECTRICAL, ValidationType.FIRE_SAFETY],
        criticality: SafetyCriticality.HIGH,
      },
    },
  },

  // === INSTALAÇÕES HIDRÁULICAS ===
  PLUMBING: {
    name: 'Instalações Hidráulicas',
    types: {
      TOILET: {
        name: 'Vaso Sanitário',
        icon: 'toilet',
        properties: ['type', 'flush_volume', 'accessible', 'wall_mounted'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.LOW,
      },
      SINK: {
        name: 'Pia',
        icon: 'sink',
        properties: ['material', 'faucet_type', 'drainage', 'accessible'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.LOW,
      },
      SHOWER: {
        name: 'Chuveiro',
        icon: 'shower',
        properties: ['type', 'flow_rate', 'temperature_control', 'accessible'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.MEDIUM,
      },
      DRAIN: {
        name: 'Ralo',
        icon: 'drain',
        properties: ['diameter', 'type', 'flow_capacity', 'location'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.LOW,
      },
    },
  },

  // === ACESSIBILIDADE ===
  ACCESSIBILITY: {
    name: 'Acessibilidade',
    types: {
      ACCESSIBLE_RAMP: {
        name: 'Rampa Acessível',
        icon: 'ramp',
        properties: ['slope', 'width', 'length', 'handrails', 'landing'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
      ACCESSIBLE_PARKING: {
        name: 'Vaga Acessível',
        icon: 'accessible-parking',
        properties: ['width', 'length', 'access_aisle', 'signage'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
      GRAB_BAR: {
        name: 'Barra de Apoio',
        icon: 'grab-bar',
        properties: [
          'length',
          'diameter',
          'material',
          'height',
          'load_capacity',
        ],
        validations: [ValidationType.DIMENSIONAL, ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.HIGH,
      },
      TACTILE_PAVING: {
        name: 'Piso Tátil',
        icon: 'tactile-paving',
        properties: ['type', 'material', 'pattern', 'contrast'],
        validations: [ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.MEDIUM,
      },
    },
  },

  // === MOBILIÁRIO E EQUIPAMENTOS ===
  FURNITURE: {
    name: 'Mobiliário e Equipamentos',
    types: {
      TABLE: {
        name: 'Mesa',
        icon: 'table',
        properties: ['length', 'width', 'height', 'material', 'capacity'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.NONE,
      },
      CHAIR: {
        name: 'Cadeira',
        icon: 'chair',
        properties: ['width', 'depth', 'height', 'material', 'stackable'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.NONE,
      },
      STAGE: {
        name: 'Palco',
        icon: 'stage',
        properties: ['width', 'depth', 'height', 'load_capacity', 'railings'],
        validations: [ValidationType.DIMENSIONAL, ValidationType.STRUCTURAL],
        criticality: SafetyCriticality.HIGH,
      },
      BOOTH: {
        name: 'Stand/Estande',
        icon: 'booth',
        properties: ['width', 'depth', 'height', 'walls', 'electrical'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.LOW,
      },
    },
  },

  // === DIMENSÕES E ANOTAÇÕES ===
  ANNOTATIONS: {
    name: 'Dimensões e Anotações',
    types: {
      DIMENSION: {
        name: 'Cota/Dimensão',
        icon: 'dimension',
        properties: ['value', 'unit', 'precision', 'type'],
        validations: [ValidationType.DIMENSIONAL],
        criticality: SafetyCriticality.NONE,
      },
      TEXT_LABEL: {
        name: 'Etiqueta de Texto',
        icon: 'label',
        properties: ['text', 'font_size', 'font_family', 'rotation'],
        validations: [ValidationType.VISUAL],
        criticality: SafetyCriticality.NONE,
      },
      ROOM_NUMBER: {
        name: 'Número de Ambiente',
        icon: 'room-number',
        properties: ['number', 'name', 'area', 'occupancy'],
        validations: [ValidationType.COMPLIANCE],
        criticality: SafetyCriticality.LOW,
      },
      NORTH_ARROW: {
        name: 'Rosa dos Ventos',
        icon: 'north-arrow',
        properties: ['rotation', 'style', 'size'],
        validations: [ValidationType.VISUAL],
        criticality: SafetyCriticality.NONE,
      },
    },
  },
};

/**
 * Obtém configuração de um tipo de objeto
 */
export function getObjectTypeConfig(category: string, type: string) {
  return INFRA_OBJECT_CATEGORIES[category]?.types[type];
}

/**
 * Obtém todas as categorias
 */
export function getAllCategories() {
  return Object.keys(INFRA_OBJECT_CATEGORIES);
}

/**
 * Obtém todos os tipos de uma categoria
 */
export function getTypesForCategory(category: string) {
  return Object.keys(INFRA_OBJECT_CATEGORIES[category]?.types || {});
}

/**
 * Converte confidence numérica para nível
 */
export function getConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence <= 0.2) return ConfidenceLevel.VERY_LOW;
  if (confidence <= 0.4) return ConfidenceLevel.LOW;
  if (confidence <= 0.6) return ConfidenceLevel.MEDIUM;
  if (confidence <= 0.8) return ConfidenceLevel.HIGH;
  return ConfidenceLevel.VERY_HIGH;
}

/**
 * Determina se um objeto precisa de revisão baseado na confiança
 */
export function needsReview(
  confidence: number,
  criticality: SafetyCriticality,
): boolean {
  // Objetos críticos sempre precisam de revisão
  if (criticality === SafetyCriticality.CRITICAL) return true;

  // Objetos de alta criticidade precisam de revisão se confiança < 90%
  if (criticality === SafetyCriticality.HIGH && confidence < 0.9) return true;

  // Objetos de média criticidade precisam de revisão se confiança < 80%
  if (criticality === SafetyCriticality.MEDIUM && confidence < 0.8) return true;

  // Objetos de baixa criticidade precisam de revisão se confiança < 70%
  if (criticality === SafetyCriticality.LOW && confidence < 0.7) return true;

  return false;
}

/**
 * Obtém cor baseada no status
 */
export function getStatusColor(status: InfraObjectStatus): string {
  const colors = {
    [InfraObjectStatus.DETECTED]: '#3B82F6', // blue
    [InfraObjectStatus.PENDING_REVIEW]: '#F59E0B', // amber
    [InfraObjectStatus.UNDER_REVIEW]: '#8B5CF6', // violet
    [InfraObjectStatus.APPROVED]: '#10B981', // emerald
    [InfraObjectStatus.REJECTED]: '#EF4444', // red
    [InfraObjectStatus.MODIFIED]: '#6366F1', // indigo
    [InfraObjectStatus.CONFLICTED]: '#F97316', // orange
    [InfraObjectStatus.ARCHIVED]: '#6B7280', // gray
  };

  return colors[status] || '#6B7280';
}

/**
 * Obtém cor baseada na criticidade
 */
export function getCriticalityColor(criticality: SafetyCriticality): string {
  const colors = {
    [SafetyCriticality.NONE]: '#6B7280', // gray
    [SafetyCriticality.LOW]: '#10B981', // emerald
    [SafetyCriticality.MEDIUM]: '#F59E0B', // amber
    [SafetyCriticality.HIGH]: '#F97316', // orange
    [SafetyCriticality.CRITICAL]: '#EF4444', // red
  };

  return colors[criticality] || '#6B7280';
}

/**
 * Configurações padrão para diferentes tipos de validação
 */
export const VALIDATION_CONFIGS = {
  [ValidationType.VISUAL]: {
    name: 'Validação Visual',
    description: 'Verificação visual da existência e posicionamento',
    requiredRole: 'technician',
    estimatedTime: 30, // segundos
  },
  [ValidationType.DIMENSIONAL]: {
    name: 'Validação Dimensional',
    description: 'Verificação de dimensões e medidas',
    requiredRole: 'engineer',
    estimatedTime: 120,
  },
  [ValidationType.TECHNICAL]: {
    name: 'Validação Técnica',
    description: 'Verificação de especificações técnicas',
    requiredRole: 'engineer',
    estimatedTime: 300,
  },
  [ValidationType.COMPLIANCE]: {
    name: 'Validação de Compliance',
    description: 'Verificação de conformidade com normas',
    requiredRole: 'engineer',
    estimatedTime: 600,
  },
  [ValidationType.STRUCTURAL]: {
    name: 'Validação Estrutural',
    description: 'Verificação de aspectos estruturais',
    requiredRole: 'structural_engineer',
    estimatedTime: 900,
  },
  [ValidationType.ELECTRICAL]: {
    name: 'Validação Elétrica',
    description: 'Verificação de instalações elétricas',
    requiredRole: 'electrical_engineer',
    estimatedTime: 600,
  },
  [ValidationType.FIRE_SAFETY]: {
    name: 'Validação de Segurança',
    description: 'Verificação de segurança contra incêndio',
    requiredRole: 'safety_engineer',
    estimatedTime: 600,
  },
};

/**
 * Obtém configuração de validação
 */
export function getValidationConfig(type: ValidationType) {
  return VALIDATION_CONFIGS[type];
}

/**
 * Calcula tempo estimado total de validação
 */
export function calculateValidationTime(
  validationTypes: ValidationType[],
): number {
  return validationTypes.reduce((total, type) => {
    return total + (getValidationConfig(type)?.estimatedTime || 0);
  }, 0);
}
