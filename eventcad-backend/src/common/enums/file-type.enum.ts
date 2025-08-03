/**
 * Enum que define os tipos de arquivos suportados pelo EventCAD+
 * Categoriza arquivos por finalidade e processamento
 */
export enum FileType {
  // Plantas e desenhos técnicos
  DWG = 'dwg', // AutoCAD Drawing
  DXF = 'dxf', // Drawing Exchange Format
  IFC = 'ifc', // Industry Foundation Classes (BIM)

  // Documentos
  PDF = 'pdf', // Portable Document Format
  DOCX = 'docx', // Microsoft Word
  DOC = 'doc', // Microsoft Word Legacy
  XLSX = 'xlsx', // Microsoft Excel
  XLS = 'xls', // Microsoft Excel Legacy
  PPTX = 'pptx', // Microsoft PowerPoint
  PPT = 'ppt', // Microsoft PowerPoint Legacy

  // Imagens
  JPEG = 'jpeg', // JPEG Image
  JPG = 'jpg', // JPEG Image
  PNG = 'png', // PNG Image
  SVG = 'svg', // Scalable Vector Graphics
  WEBP = 'webp', // WebP Image

  // Vídeos e áudio
  MP4 = 'mp4', // MPEG-4 Video
  MOV = 'mov', // QuickTime Movie
  AVI = 'avi', // Audio Video Interleave
  MP3 = 'mp3', // MPEG Audio Layer III
  WAV = 'wav', // Waveform Audio File

  // Arquivos compactados
  ZIP = 'zip', // ZIP Archive
  RAR = 'rar', // RAR Archive
  TAR = 'tar', // TAR Archive
  GZ = 'gz', // GZIP Archive

  // Outros formatos técnicos
  CSV = 'csv', // Comma-Separated Values
  TXT = 'txt', // Plain Text
  JSON = 'json', // JSON Data
  XML = 'xml', // XML Data
}

/**
 * Categorias de arquivos para processamento
 */
export enum FileCategory {
  PLANT = 'plant', // Plantas e desenhos técnicos
  DOCUMENT = 'document', // Documentos gerais
  IMAGE = 'image', // Imagens e fotos
  VIDEO = 'video', // Vídeos
  AUDIO = 'audio', // Áudio
  ARCHIVE = 'archive', // Arquivos compactados
  DATA = 'data', // Dados estruturados
}

/**
 * Status de processamento do arquivo
 */
export enum FileStatus {
  UPLOADING = 'uploading', // Upload em andamento
  UPLOADED = 'uploaded', // Upload concluído
  PROCESSING = 'processing', // Processamento em andamento
  PROCESSED = 'processed', // Processado com sucesso
  FAILED = 'failed', // Falha no processamento
  QUARANTINE = 'quarantine', // Em quarentena (suspeito)
  DELETED = 'deleted', // Marcado para exclusão
}

/**
 * Mapeamento de tipos de arquivo para categorias
 */
export const FILE_TYPE_CATEGORIES: Record<FileType, FileCategory> = {
  // Plantas
  [FileType.DWG]: FileCategory.PLANT,
  [FileType.DXF]: FileCategory.PLANT,
  [FileType.IFC]: FileCategory.PLANT,

  // Documentos
  [FileType.PDF]: FileCategory.DOCUMENT,
  [FileType.DOCX]: FileCategory.DOCUMENT,
  [FileType.DOC]: FileCategory.DOCUMENT,
  [FileType.XLSX]: FileCategory.DOCUMENT,
  [FileType.XLS]: FileCategory.DOCUMENT,
  [FileType.PPTX]: FileCategory.DOCUMENT,
  [FileType.PPT]: FileCategory.DOCUMENT,

  // Imagens
  [FileType.JPEG]: FileCategory.IMAGE,
  [FileType.JPG]: FileCategory.IMAGE,
  [FileType.PNG]: FileCategory.IMAGE,
  [FileType.SVG]: FileCategory.IMAGE,
  [FileType.WEBP]: FileCategory.IMAGE,

  // Vídeos
  [FileType.MP4]: FileCategory.VIDEO,
  [FileType.MOV]: FileCategory.VIDEO,
  [FileType.AVI]: FileCategory.VIDEO,

  // Áudio
  [FileType.MP3]: FileCategory.AUDIO,
  [FileType.WAV]: FileCategory.AUDIO,

  // Arquivos
  [FileType.ZIP]: FileCategory.ARCHIVE,
  [FileType.RAR]: FileCategory.ARCHIVE,
  [FileType.TAR]: FileCategory.ARCHIVE,
  [FileType.GZ]: FileCategory.ARCHIVE,

  // Dados
  [FileType.CSV]: FileCategory.DATA,
  [FileType.TXT]: FileCategory.DATA,
  [FileType.JSON]: FileCategory.DATA,
  [FileType.XML]: FileCategory.DATA,
};

/**
 * MIME types permitidos por categoria
 */
export const ALLOWED_MIME_TYPES: Record<FileCategory, string[]> = {
  [FileCategory.PLANT]: [
    'application/dwg',
    'application/dxf',
    'application/x-dwg',
    'application/x-dxf',
    'model/ifc',
    'application/ifc',
    'application/step',
  ],

  [FileCategory.DOCUMENT]: [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-powerpoint',
  ],

  [FileCategory.IMAGE]: [
    'image/jpeg',
    'image/png',
    'image/svg+xml',
    'image/webp',
    'image/gif',
    'image/bmp',
    'image/tiff',
  ],

  [FileCategory.VIDEO]: [
    'video/mp4',
    'video/quicktime',
    'video/x-msvideo',
    'video/avi',
    'video/webm',
  ],

  [FileCategory.AUDIO]: [
    'audio/mpeg',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/mp3',
  ],

  [FileCategory.ARCHIVE]: [
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-tar',
    'application/gzip',
    'application/x-gzip',
  ],

  [FileCategory.DATA]: [
    'text/csv',
    'text/plain',
    'application/json',
    'application/xml',
    'text/xml',
  ],
};

/**
 * Tamanhos máximos por categoria (em bytes)
 */
export const MAX_FILE_SIZES: Record<FileCategory, number> = {
  [FileCategory.PLANT]: 500 * 1024 * 1024, // 500MB para plantas
  [FileCategory.DOCUMENT]: 100 * 1024 * 1024, // 100MB para documentos
  [FileCategory.IMAGE]: 20 * 1024 * 1024, // 20MB para imagens
  [FileCategory.VIDEO]: 1024 * 1024 * 1024, // 1GB para vídeos
  [FileCategory.AUDIO]: 100 * 1024 * 1024, // 100MB para áudio
  [FileCategory.ARCHIVE]: 1024 * 1024 * 1024, // 1GB para arquivos
  [FileCategory.DATA]: 10 * 1024 * 1024, // 10MB para dados
};

/**
 * Extensões de arquivo proibidas por segurança
 */
export const FORBIDDEN_EXTENSIONS = [
  'exe',
  'bat',
  'cmd',
  'com',
  'scr',
  'pif',
  'vbs',
  'js',
  'jar',
  'msi',
  'dll',
  'sys',
  'php',
  'asp',
  'jsp',
  'py',
  'rb',
  'pl',
];

/**
 * Verifica se um tipo de arquivo é permitido
 * @param fileType - Tipo do arquivo
 * @param category - Categoria esperada
 * @returns true se permitido
 */
export function isFileTypeAllowed(
  fileType: FileType,
  category?: FileCategory,
): boolean {
  if (category) {
    return FILE_TYPE_CATEGORIES[fileType] === category;
  }
  return Object.values(FileType).includes(fileType);
}

/**
 * Obtém a categoria de um tipo de arquivo
 * @param fileType - Tipo do arquivo
 * @returns Categoria do arquivo
 */
export function getFileCategory(fileType: FileType): FileCategory {
  return FILE_TYPE_CATEGORIES[fileType];
}

/**
 * Verifica se um MIME type é permitido para uma categoria
 * @param mimeType - MIME type do arquivo
 * @param category - Categoria esperada
 * @returns true se permitido
 */
export function isMimeTypeAllowed(
  mimeType: string,
  category: FileCategory,
): boolean {
  return ALLOWED_MIME_TYPES[category]?.includes(mimeType) || false;
}

/**
 * Obtém tamanho máximo permitido para uma categoria
 * @param category - Categoria do arquivo
 * @returns Tamanho máximo em bytes
 */
export function getMaxFileSize(category: FileCategory): number {
  return MAX_FILE_SIZES[category];
}

/**
 * Verifica se uma extensão é proibida
 * @param extension - Extensão do arquivo (sem ponto)
 * @returns true se proibida
 */
export function isForbiddenExtension(extension: string): boolean {
  return FORBIDDEN_EXTENSIONS.includes(extension.toLowerCase());
}
