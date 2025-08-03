/**
 * Enums e configurações para sistema de IA de reconhecimento do EventCAD+
 * Integração com serviços externos Python (FastAPI, YOLO, Detectron2, etc.)
 */

/**
 * Status do processamento de IA
 */
export enum AIProcessingStatus {
  PENDING = 'pending', // Aguardando processamento
  QUEUED = 'queued', // Na fila de processamento
  PROCESSING = 'processing', // Processando
  COMPLETED = 'completed', // Concluído com sucesso
  FAILED = 'failed', // Falhou
  CANCELLED = 'cancelled', // Cancelado
  TIMEOUT = 'timeout', // Timeout
  RETRYING = 'retrying', // Tentando novamente
}

/**
 * Tipos de modelos de IA disponíveis
 */
export enum AIModelType {
  // Modelos de detecção de objetos
  YOLO_V8 = 'yolo_v8', // YOLO v8 para detecção geral
  YOLO_V8_CUSTOM = 'yolo_v8_custom', // YOLO v8 customizado para CAD
  DETECTRON2 = 'detectron2', // Detectron2 Facebook
  DETECTRON2_CAD = 'detectron2_cad', // Detectron2 especializado CAD

  // Modelos de OCR e texto
  TESSERACT = 'tesseract', // OCR Tesseract
  PADDLE_OCR = 'paddle_ocr', // PaddleOCR
  EASY_OCR = 'easy_ocr', // EasyOCR
  TEXT_RECOGNITION = 'text_recognition', // Reconhecimento de texto customizado

  // Modelos especializados
  CAD_PARSER = 'cad_parser', // Parser específico CAD
  FLOOR_PLAN_AI = 'floor_plan_ai', // IA especializada em plantas baixas
  FIRE_SAFETY_AI = 'fire_safety_ai', // IA para detecção de segurança
  ELECTRICAL_AI = 'electrical_ai', // IA para instalações elétricas

  // Modelos de análise
  COMPLIANCE_AI = 'compliance_ai', // IA para análise de compliance
  DIMENSION_AI = 'dimension_ai', // IA para extração de dimensões
  LAYER_ANALYZER = 'layer_analyzer', // Analisador de layers CAD
}

/**
 * Categorias de objetos detectáveis
 */
export enum AIObjectCategory {
  // Elementos arquitetônicos
  ARCHITECTURAL = 'architectural', // Portas, janelas, paredes
  STRUCTURAL = 'structural', // Pilares, vigas, lajes

  // Segurança
  FIRE_SAFETY = 'fire_safety', // Extintores, saídas, sprinklers
  EMERGENCY = 'emergency', // Rotas de fuga, alarmes

  // Instalações
  ELECTRICAL = 'electrical', // Tomadas, quadros, luminárias
  PLUMBING = 'plumbing', // Tubulações, conexões, válvulas
  HVAC = 'hvac', // Ar condicionado, dutos

  // Mobiliário e equipamentos
  FURNITURE = 'furniture', // Mesas, cadeiras, armários
  EQUIPMENT = 'equipment', // Equipamentos diversos

  // Acessibilidade
  ACCESSIBILITY = 'accessibility', // Rampas, elevadores, PCD

  // Elementos técnicos
  DIMENSIONS = 'dimensions', // Cotas, medidas
  TEXT = 'text', // Textos, etiquetas
  SYMBOLS = 'symbols', // Símbolos técnicos

  // Outros
  GENERIC = 'generic', // Objetos genéricos
  UNKNOWN = 'unknown', // Objetos não identificados
}

/**
 * Tipos específicos de objetos por categoria
 */
export const AI_OBJECT_TYPES: Record<AIObjectCategory, string[]> = {
  [AIObjectCategory.ARCHITECTURAL]: [
    'porta',
    'janela',
    'parede',
    'parede_divisoria',
    'escada',
    'rampa',
    'elevador',
    'monta_cargas',
    'guarda_corpo',
    'corrimao',
  ],

  [AIObjectCategory.STRUCTURAL]: [
    'pilar',
    'viga',
    'laje',
    'fundacao',
    'sapata',
    'bloco_fundacao',
    'viga_baldrame',
    'cintas',
    'tirantes',
  ],

  [AIObjectCategory.FIRE_SAFETY]: [
    'extintor',
    'hidrante',
    'sprinkler',
    'detector_fumaca',
    'detector_calor',
    'acionador_manual',
    'central_alarme',
    'sirene',
    'luz_emergencia',
  ],

  [AIObjectCategory.EMERGENCY]: [
    'saida_emergencia',
    'rota_fuga',
    'ponto_encontro',
    'sinalizacao_emergencia',
    'porta_corta_fogo',
    'escada_emergencia',
  ],

  [AIObjectCategory.ELECTRICAL]: [
    'tomada',
    'interruptor',
    'quadro_eletrico',
    'luminaria',
    'spot',
    'refletor',
    'condulete',
    'caixa_passagem',
    'eletroduto',
    'cabo',
  ],

  [AIObjectCategory.PLUMBING]: [
    'vaso_sanitario',
    'pia',
    'chuveiro',
    'torneira',
    'ralo',
    'caixa_gordura',
    'caixa_inspecao',
    'tubulacao',
    'joelho',
    'te',
    'reducao',
  ],

  [AIObjectCategory.HVAC]: [
    'ar_condicionado',
    'ventilador',
    'exaustor',
    'duto',
    'grelha',
    'difusor',
    'damper',
    'filtro',
    'serpentina',
  ],

  [AIObjectCategory.FURNITURE]: [
    'mesa',
    'cadeira',
    'sofa',
    'armario',
    'estante',
    'bancada',
    'balcao',
    'reception',
    'stand',
    'display',
  ],

  [AIObjectCategory.EQUIPMENT]: [
    'projetor',
    'tela',
    'som',
    'tv',
    'monitor',
    'computador',
    'impressora',
    'equipamento_cozinha',
    'maquina_cafe',
  ],

  [AIObjectCategory.ACCESSIBILITY]: [
    'rampa_acessivel',
    'elevador_acessivel',
    'banheiro_acessivel',
    'vaga_deficiente',
    'barra_apoio',
    'piso_tatil',
    'sinalizacao_braille',
  ],

  [AIObjectCategory.DIMENSIONS]: [
    'cota_linear',
    'cota_angular',
    'cota_radial',
    'nivel',
    'escala',
    'norte_magnetico',
    'legenda',
  ],

  [AIObjectCategory.TEXT]: [
    'texto_identificacao',
    'etiqueta',
    'numero_ambiente',
    'nome_ambiente',
    'especificacao',
    'observacao',
    'titulo_prancha',
  ],

  [AIObjectCategory.SYMBOLS]: [
    'simbolo_eletrico',
    'simbolo_hidraulico',
    'simbolo_estrutural',
    'simbolo_arquitetonico',
    'hachura',
    'pattern',
  ],

  [AIObjectCategory.GENERIC]: [
    'objeto_personalizado',
    'elemento_decorativo',
    'paisagismo',
  ],

  [AIObjectCategory.UNKNOWN]: [
    'objeto_nao_identificado',
    'forma_geometrica',
    'linha_indefinida',
  ],
};

/**
 * Configurações de modelos de IA
 */
export interface AIModelConfig {
  name: string;
  type: AIModelType;
  endpoint: string;
  timeout: number; // segundos
  maxFileSize: number; // bytes
  supportedFormats: string[];
  categories: AIObjectCategory[];
  confidence_threshold: number;
  batch_size?: number;
  preprocessing?: {
    resize?: { width: number; height: number };
    normalize?: boolean;
    grayscale?: boolean;
  };
}

/**
 * Configurações padrão dos modelos
 */
export const AI_MODEL_CONFIGS: Record<AIModelType, AIModelConfig> = {
  [AIModelType.YOLO_V8]: {
    name: 'YOLO v8 General',
    type: AIModelType.YOLO_V8,
    endpoint: '/api/v1/ai/yolo/detect',
    timeout: 120,
    maxFileSize: 50 * 1024 * 1024, // 50MB
    supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    categories: [
      AIObjectCategory.ARCHITECTURAL,
      AIObjectCategory.FURNITURE,
      AIObjectCategory.EQUIPMENT,
    ],
    confidence_threshold: 0.7,
    batch_size: 1,
  },

  [AIModelType.YOLO_V8_CUSTOM]: {
    name: 'YOLO v8 CAD Specialized',
    type: AIModelType.YOLO_V8_CUSTOM,
    endpoint: '/api/v1/ai/yolo/detect-cad',
    timeout: 180,
    maxFileSize: 100 * 1024 * 1024, // 100MB
    supportedFormats: ['dwg', 'dxf', 'pdf', 'jpg', 'png'],
    categories: Object.values(AIObjectCategory),
    confidence_threshold: 0.8,
    batch_size: 1,
    preprocessing: {
      resize: { width: 1024, height: 1024 },
      normalize: true,
    },
  },

  [AIModelType.DETECTRON2]: {
    name: 'Detectron2 Facebook',
    type: AIModelType.DETECTRON2,
    endpoint: '/api/v1/ai/detectron2/detect',
    timeout: 300,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    categories: [
      AIObjectCategory.ARCHITECTURAL,
      AIObjectCategory.STRUCTURAL,
      AIObjectCategory.EQUIPMENT,
    ],
    confidence_threshold: 0.75,
  },

  [AIModelType.DETECTRON2_CAD]: {
    name: 'Detectron2 CAD Specialized',
    type: AIModelType.DETECTRON2_CAD,
    endpoint: '/api/v1/ai/detectron2/detect-cad',
    timeout: 600,
    maxFileSize: 200 * 1024 * 1024, // 200MB
    supportedFormats: ['dwg', 'dxf', 'ifc', 'pdf'],
    categories: Object.values(AIObjectCategory),
    confidence_threshold: 0.85,
    preprocessing: {
      normalize: true,
    },
  },

  [AIModelType.TESSERACT]: {
    name: 'Tesseract OCR',
    type: AIModelType.TESSERACT,
    endpoint: '/api/v1/ai/ocr/tesseract',
    timeout: 60,
    maxFileSize: 50 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    categories: [AIObjectCategory.TEXT, AIObjectCategory.DIMENSIONS],
    confidence_threshold: 0.6,
    preprocessing: {
      grayscale: true,
    },
  },

  [AIModelType.PADDLE_OCR]: {
    name: 'PaddleOCR',
    type: AIModelType.PADDLE_OCR,
    endpoint: '/api/v1/ai/ocr/paddle',
    timeout: 90,
    maxFileSize: 50 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png', 'pdf'],
    categories: [AIObjectCategory.TEXT, AIObjectCategory.DIMENSIONS],
    confidence_threshold: 0.7,
  },

  [AIModelType.EASY_OCR]: {
    name: 'EasyOCR',
    type: AIModelType.EASY_OCR,
    endpoint: '/api/v1/ai/ocr/easy',
    timeout: 60,
    maxFileSize: 30 * 1024 * 1024,
    supportedFormats: ['jpg', 'jpeg', 'png'],
    categories: [AIObjectCategory.TEXT],
    confidence_threshold: 0.65,
  },

  [AIModelType.TEXT_RECOGNITION]: {
    name: 'Custom Text Recognition',
    type: AIModelType.TEXT_RECOGNITION,
    endpoint: '/api/v1/ai/text/recognize',
    timeout: 120,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'pdf'],
    categories: [AIObjectCategory.TEXT, AIObjectCategory.DIMENSIONS],
    confidence_threshold: 0.8,
  },

  [AIModelType.CAD_PARSER]: {
    name: 'CAD Parser',
    type: AIModelType.CAD_PARSER,
    endpoint: '/api/v1/ai/cad/parse',
    timeout: 300,
    maxFileSize: 500 * 1024 * 1024, // 500MB
    supportedFormats: ['dwg', 'dxf', 'ifc'],
    categories: Object.values(AIObjectCategory),
    confidence_threshold: 0.9,
  },

  [AIModelType.FLOOR_PLAN_AI]: {
    name: 'Floor Plan AI',
    type: AIModelType.FLOOR_PLAN_AI,
    endpoint: '/api/v1/ai/floorplan/analyze',
    timeout: 240,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'pdf', 'jpg', 'png'],
    categories: [
      AIObjectCategory.ARCHITECTURAL,
      AIObjectCategory.ACCESSIBILITY,
      AIObjectCategory.DIMENSIONS,
    ],
    confidence_threshold: 0.85,
  },

  [AIModelType.FIRE_SAFETY_AI]: {
    name: 'Fire Safety AI',
    type: AIModelType.FIRE_SAFETY_AI,
    endpoint: '/api/v1/ai/fire-safety/analyze',
    timeout: 180,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'pdf'],
    categories: [AIObjectCategory.FIRE_SAFETY, AIObjectCategory.EMERGENCY],
    confidence_threshold: 0.9,
  },

  [AIModelType.ELECTRICAL_AI]: {
    name: 'Electrical Systems AI',
    type: AIModelType.ELECTRICAL_AI,
    endpoint: '/api/v1/ai/electrical/analyze',
    timeout: 200,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'pdf'],
    categories: [AIObjectCategory.ELECTRICAL],
    confidence_threshold: 0.85,
  },

  [AIModelType.COMPLIANCE_AI]: {
    name: 'Compliance Analyzer AI',
    type: AIModelType.COMPLIANCE_AI,
    endpoint: '/api/v1/ai/compliance/check',
    timeout: 400,
    maxFileSize: 200 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'ifc', 'pdf'],
    categories: Object.values(AIObjectCategory),
    confidence_threshold: 0.95,
  },

  [AIModelType.DIMENSION_AI]: {
    name: 'Dimension Extractor AI',
    type: AIModelType.DIMENSION_AI,
    endpoint: '/api/v1/ai/dimensions/extract',
    timeout: 150,
    maxFileSize: 100 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'pdf'],
    categories: [AIObjectCategory.DIMENSIONS, AIObjectCategory.TEXT],
    confidence_threshold: 0.8,
  },

  [AIModelType.LAYER_ANALYZER]: {
    name: 'CAD Layer Analyzer',
    type: AIModelType.LAYER_ANALYZER,
    endpoint: '/api/v1/ai/layers/analyze',
    timeout: 120,
    maxFileSize: 200 * 1024 * 1024,
    supportedFormats: ['dwg', 'dxf', 'ifc'],
    categories: Object.values(AIObjectCategory),
    confidence_threshold: 0.7,
  },
};

/**
 * Obtém configuração de um modelo
 */
export function getAIModelConfig(modelType: AIModelType): AIModelConfig {
  return AI_MODEL_CONFIGS[modelType];
}

/**
 * Obtém modelos recomendados para um tipo de planta
 */
export function getRecommendedModels(plantaTipo: string): AIModelType[] {
  const recommendations: Record<string, AIModelType[]> = {
    // Plantas de segurança - modelos especializados
    seguranca_incendio: [
      AIModelType.FIRE_SAFETY_AI,
      AIModelType.DETECTRON2_CAD,
      AIModelType.COMPLIANCE_AI,
    ],
    rotas_fuga: [
      AIModelType.FIRE_SAFETY_AI,
      AIModelType.FLOOR_PLAN_AI,
      AIModelType.COMPLIANCE_AI,
    ],

    // Plantas elétricas
    instalacao_eletrica: [
      AIModelType.ELECTRICAL_AI,
      AIModelType.YOLO_V8_CUSTOM,
      AIModelType.DIMENSION_AI,
    ],

    // Plantas baixas
    planta_baixa: [
      AIModelType.FLOOR_PLAN_AI,
      AIModelType.DETECTRON2_CAD,
      AIModelType.YOLO_V8_CUSTOM,
      AIModelType.TEXT_RECOGNITION,
    ],

    // Layouts
    layout_stands: [
      AIModelType.YOLO_V8_CUSTOM,
      AIModelType.DETECTRON2,
      AIModelType.DIMENSION_AI,
    ],

    // Acessibilidade
    acessibilidade: [
      AIModelType.FLOOR_PLAN_AI,
      AIModelType.COMPLIANCE_AI,
      AIModelType.DETECTRON2_CAD,
    ],

    // Padrão para outros tipos
    default: [
      AIModelType.YOLO_V8_CUSTOM,
      AIModelType.CAD_PARSER,
      AIModelType.TEXT_RECOGNITION,
    ],
  };

  return recommendations[plantaTipo] || recommendations['default'];
}

/**
 * Obtém tipos de objetos esperados para uma categoria
 */
export function getExpectedObjectTypes(category: AIObjectCategory): string[] {
  return AI_OBJECT_TYPES[category] || [];
}

/**
 * Obtém todas as categorias suportadas por um modelo
 */
export function getSupportedCategories(
  modelType: AIModelType,
): AIObjectCategory[] {
  return getAIModelConfig(modelType).categories;
}

/**
 * Verifica se um formato é suportado por um modelo
 */
export function isFormatSupported(
  modelType: AIModelType,
  format: string,
): boolean {
  const config = getAIModelConfig(modelType);
  return config.supportedFormats.includes(format.toLowerCase());
}

/**
 * Calcula prioridade de processamento baseada no tipo de planta
 */
export function calculateProcessingPriority(plantaTipo: string): number {
  const priorities: Record<string, number> = {
    // Críticas (prioridade 1)
    seguranca_incendio: 1,
    rotas_fuga: 1,
    sistema_sprinkler: 1,
    alarme_incendio: 1,

    // Altas (prioridade 2)
    instalacao_eletrica: 2,
    instalacao_gas: 2,
    acessibilidade: 2,
    estrutural_fundacao: 2,

    // Médias (prioridade 3)
    planta_baixa: 3,
    layout_stands: 3,
    instalacao_hidraulica: 3,

    // Baixas (prioridade 4)
    layout_mobiliario: 4,
    cenografia: 4,
    paisagismo: 4,
  };

  return priorities[plantaTipo] || 3; // Default média
}
