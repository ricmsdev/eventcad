// Tipos base para o EventCAD+

export interface User {
  id: string;
  email: string;
  name: string;
  nome: string; // Portuguese alias for name
  role: UserRole;
  tenantId: string;
  telefone?: string;
  endereco?: string;
  bio?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  settings: TenantSettings;
  createdAt: string;
  updatedAt: string;
}

export interface TenantSettings {
  maxEvents: number;
  maxUsers: number;
  features: string[];
  subscription: SubscriptionType;
}

export interface Evento {
  id: string;
  nome: string;
  descricao?: string;
  tipo: EventoTipo;
  dataInicio: string;
  dataFim: string;
  local?: string;
  endereco?: string;
  area?: number;
  capacidadeMaxima?: number;
  publicoEsperado: number;
  observacoes?: string;
  status: EventStatus;
  tenantId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  plantas?: Planta[];
  infraObjects?: InfraObject[];
}

export interface Planta {
  id: string;
  nome: string;
  tipo?: string;
  plantaTipo: PlantaTipo;
  eventoId: string;
  fileId: string;
  fileName: string;
  fileSize: number;
  imageUrl?: string;
  thumbnailUrl?: string;
  descricao?: string;
  metadata: PlantaMetadata;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processamentoStatus: 'pending' | 'processing' | 'completed' | 'failed';
  aiProcessingStatus?: string;
  processedAt?: string;
  detectadosCount?: number;
  createdAt: string;
  updatedAt: string;
  infraObjects?: InfraObject[];
}

export interface PlantaMetadata {
  width: number;
  height: number;
  scale: number;
  units: string;
  layers: string[];
  objects: number;
}

export interface InfraObject {
  id: string;
  name: string;
  nome?: string; // Portuguese alias
  plantaId: string;
  aiJobId?: string;
  objectCategory: ObjectCategory;
  objectType: ObjectType;
  geometry: ObjectGeometry;
  properties: Record<string, any>;
  confidence: number;
  criticality: CriticalityLevel;
  status: ObjectStatus;
  qualityScore: number;
  requiresReview: boolean;
  manuallyValidated: boolean;
  validationResults: ValidationResult[];
  annotations: Annotation[];
  description?: string;
  position?: {
    x: number;
    y: number;
    z?: number;
  };
  dimensions?: {
    width: number;
    height: number;
    depth?: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ObjectGeometry {
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  center: {
    x: number;
    y: number;
  };
  rotation?: number;
}

export interface ValidationResult {
  id: string;
  type: ValidationType;
  status: 'passed' | 'failed' | 'pending';
  score: number;
  notes?: string;
  validatedBy?: string;
  validatedAt?: string;
}

export interface Annotation {
  id: string;
  type: 'comment' | 'issue' | 'suggestion';
  text: string;
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'resolved';
  createdBy: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface AIJob {
  id: string;
  jobName: string;
  modelType: AIRecognitionModel;
  plantaId: string;
  status: AIJobStatus;
  priority: number;
  progress: number;
  queuePosition?: number;
  retryCount?: number;
  startedAt?: string;
  configuration?: {
    confidence_threshold?: number;
    max_detections?: number;
    batch_size?: number;
    use_gpu?: boolean;
  };
  results?: AIJobResults;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AIJobResults {
  detectedObjects: number;
  objectsDetected: number;
  confidence: number;
  processingTime: number;
  recommendations: string[];
}

export interface FileData {
  id: string;
  originalName: string;
  filename: string;
  mimetype: string;
  size: number;
  path: string;
  entityType: string;
  entityId: string;
  uploadedBy: string;
  createdAt: string;
  updatedAt?: string;
  tags?: string[];
  downloadCount?: number;
  viewCount?: number;
  shareCount?: number;
  description?: string;
  thumbnail?: string;
  url?: string;
  fileType?: FileType;
}

// Enums
export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  ENGINEER = 'engineer',
  TECHNICIAN = 'technician',
  VIEWER = 'viewer'
}

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

export enum EventStatus {
  DRAFT = 'draft',
  PLANNING = 'planning',
  AWAITING_APPROVAL = 'awaiting_approval',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PREPARING = 'preparing',
  READY = 'ready',
  ONGOING = 'ongoing',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ARCHIVED = 'archived'
}

export enum PlantaTipo {
  PLANTA_BAIXA = 'planta_baixa',
  PLANTA_COBERTURA = 'planta_cobertura',
  PLANTA_SITUACAO = 'planta_situacao',
  PLANTA_LOCALIZACAO = 'planta_localizacao',
  CORTE_LONGITUDINAL = 'corte_longitudinal',
  CORTE_TRANSVERSAL = 'corte_transversal',
  FACHADA_PRINCIPAL = 'fachada_principal',
  FACHADA_LATERAL = 'fachada_lateral',
  DETALHAMENTO = 'detalhamento',
  INSTALACOES_ELETRICAS = 'instalacoes_eletricas',
  INSTALACOES_HIDRAULICAS = 'instalacoes_hidraulicas',
  INSTALACOES_AR_CONDICIONADO = 'instalacoes_ar_condicionado',
  LAYOUT_MOBILIARIO = 'layout_mobiliario',
  PLANTA_DECORACAO = 'planta_decoracao',
  PLANTA_PAISAGISMO = 'planta_paisagismo',
  OUTROS = 'outros'
}

export enum ObjectCategory {
  ARCHITECTURAL = 'ARCHITECTURAL',
  FIRE_SAFETY = 'FIRE_SAFETY',
  ELECTRICAL = 'ELECTRICAL',
  PLUMBING = 'PLUMBING',
  ACCESSIBILITY = 'ACCESSIBILITY',
  FURNITURE = 'FURNITURE',
  ANNOTATIONS = 'ANNOTATIONS'
}

export enum ObjectType {
  // Arquitetônicos
  DOOR = 'DOOR',
  WINDOW = 'WINDOW',
  WALL = 'WALL',
  STAIR = 'STAIR',
  ELEVATOR = 'ELEVATOR',
  
  // Segurança contra incêndio
  FIRE_EXTINGUISHER = 'FIRE_EXTINGUISHER',
  EMERGENCY_EXIT = 'EMERGENCY_EXIT',
  SPRINKLER = 'SPRINKLER',
  SMOKE_DETECTOR = 'SMOKE_DETECTOR',
  HYDRANT = 'HYDRANT',
  
  // Elétricos
  OUTLET = 'OUTLET',
  SWITCH = 'SWITCH',
  ELECTRICAL_PANEL = 'ELECTRICAL_PANEL',
  LIGHT_FIXTURE = 'LIGHT_FIXTURE',
  EMERGENCY_LIGHT = 'EMERGENCY_LIGHT',
  
  // Hidráulicos
  TOILET = 'TOILET',
  SINK = 'SINK',
  SHOWER = 'SHOWER',
  DRAIN = 'DRAIN',
  
  // Acessibilidade
  ACCESSIBLE_RAMP = 'ACCESSIBLE_RAMP',
  ACCESSIBLE_PARKING = 'ACCESSIBLE_PARKING',
  GRAB_BAR = 'GRAB_BAR',
  TACTILE_PAVING = 'TACTILE_PAVING',
  
  // Mobiliário
  TABLE = 'TABLE',
  CHAIR = 'CHAIR',
  STAGE = 'STAGE',
  BOOTH = 'BOOTH',
  
  // Anotações
  DIMENSION = 'DIMENSION',
  TEXT_LABEL = 'TEXT_LABEL',
  ROOM_NUMBER = 'ROOM_NUMBER',
  NORTH_ARROW = 'NORTH_ARROW'
}

export enum CriticalityLevel {
  NONE = 'none',
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export enum ObjectStatus {
  PENDING_REVIEW = 'pending_review',
  AWAITING_APPROVAL = 'awaiting_approval',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  NEEDS_REVISION = 'needs_revision'
}

export enum ValidationType {
  VISUAL = 'visual',
  DIMENSIONAL = 'dimensional',
  TECHNICAL = 'technical',
  COMPLIANCE = 'compliance',
  STRUCTURAL = 'structural',
  ELECTRICAL = 'electrical',
  FIRE_SAFETY = 'fire_safety'
}

export enum AIRecognitionModel {
  FIRE_SAFETY_AI = 'fire_safety_ai',
  ELECTRICAL_AI = 'electrical_ai',
  ACCESSIBILITY_AI = 'accessibility_ai',
  ARCHITECTURAL_AI = 'architectural_ai',
  GENERAL_AI = 'general_ai',
  EFFICIENTDET = 'efficientdet',
  FASTER_RCNN = 'faster_rcnn',
  SSD_MOBILENET = 'ssd_mobilenet',
  YOLO_V8 = 'yolo_v8',
  DETECTRON2 = 'detectron2'
}

export enum AIJobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum FileType {
  IMAGE = 'image',
  PDF = 'pdf',
  DWG = 'dwg',
  CAD = 'cad',
  DOCUMENT = 'document',
  SPREADSHEET = 'spreadsheet',
  OTHER = 'other'
}

export enum SubscriptionType {
  FREE = 'free',
  BASIC = 'basic',
  PROFESSIONAL = 'professional',
  ENTERPRISE = 'enterprise'
}

// Tipos para formulários
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface CreateEventoForm {
  nome: string;
  tipo: EventoTipo;
  dataInicio: string;
  dataFim: string;
  publicoEsperado: number;
}

export interface CreateInfraObjectForm {
  name: string;
  plantaId: string;
  objectCategory: ObjectCategory;
  objectType: ObjectType;
  geometry: ObjectGeometry;
  properties: Record<string, any>;
  confidence: number;
  criticality: CriticalityLevel;
  status?: ObjectStatus;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}

// Tipos para filtros
export interface EventoFilters {
  tipo?: EventoTipo;
  status?: EventStatus;
  dataInicio?: string;
  dataFim?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface InfraObjectFilters {
  plantaId?: string;
  objectCategory?: ObjectCategory;
  objectType?: ObjectType;
  criticality?: CriticalityLevel;
  status?: ObjectStatus;
  search?: string;
}

export interface AIJobFilters {
  modelType?: AIRecognitionModel;
  status?: AIJobStatus;
  plantaId?: string;
  search?: string;
}

// Tipos para estatísticas
export interface DashboardStats {
  totalEventos: number;
  eventosAtivos: number;
  totalPlantas: number;
  totalObjetos: number;
  objetosPendentes: number;
  objetosAprovados: number;
  jobsIA: number;
  jobsConcluidos: number;
}

export interface EventoStats {
  total: number;
  byStatus: Record<EventStatus, number>;
  byTipo: Record<EventoTipo, number>;
  proximosEventos: Evento[];
  eventosAtencao: Evento[];
}

export interface InfraObjectStats {
  total: number;
  byStatus: Record<ObjectStatus, number>;
  byCriticality: Record<CriticalityLevel, number>;
  avgQualityScore: number;
  validationRate: number;
}

// Tipos para notificações
export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
} 