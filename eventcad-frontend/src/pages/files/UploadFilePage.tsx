import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Upload, 
  X,
  FileText,
  FileImage,
  FileSpreadsheet,
  FileIcon,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
import { apiService } from '@/services/api';
import { FileType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const uploadSchema = z.object({
  entityType: z.string().min(1, 'Tipo de entidade é obrigatório'),
  entityId: z.string().min(1, 'ID da entidade é obrigatório'),
  description: z.string().optional(),
  tags: z.string().optional()
});

type UploadForm = z.infer<typeof uploadSchema>;

interface FileWithPreview extends File {
  preview?: string;
  progress?: number;
  error?: string;
  uploaded?: boolean;
}

const entityTypeOptions = [
  { value: 'evento', label: 'Evento' },
  { value: 'planta', label: 'Planta' },
  { value: 'infra_object', label: 'Objeto de Infraestrutura' },
  { value: 'ai_job', label: 'Job de IA' },
  { value: 'user', label: 'Usuário' }
];

const getFileType = (file: File): FileType => {
  const { type, name } = file;
  
  if (type.startsWith('image/')) return FileType.IMAGE;
  if (type === 'application/pdf') return FileType.PDF;
  if (type.includes('spreadsheet') || type.includes('excel') || name.endsWith('.xlsx') || name.endsWith('.xls')) return FileType.SPREADSHEET;
  if (type.includes('document') || type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return FileType.DOCUMENT;
  if (name.endsWith('.dwg') || name.endsWith('.dxf') || name.endsWith('.step') || name.endsWith('.iges')) return FileType.CAD;
  
  return FileType.OTHER;
};

const getFileIcon = (fileType: FileType) => {
  switch (fileType) {
    case FileType.IMAGE: return FileImage;
    case FileType.DOCUMENT: return FileText;
    case FileType.SPREADSHEET: return FileSpreadsheet;
    case FileType.PDF: return FileText;
    case FileType.CAD: return FileIcon;
    default: return FileIcon;
  }
};

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const getEntityDisplayName = (entity: any, entityType: string): string => {
  switch (entityType) {
    case 'evento':
      return entity.nome || `Evento ${entity.id}`;
    case 'planta':
      return entity.nome || `Planta ${entity.id}`;
    case 'infra_object':
      return entity.name || entity.nome || `Objeto ${entity.id}`;
    case 'ai_job':
      return entity.jobName || `Job ${entity.id}`;
    default:
      return entity.nome || entity.name || entity.jobName || entity.filename || `ID: ${entity.id}`;
  }
};

export function UploadFilePage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors }
  } = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema)
  });

  const watchedEntityType = watch('entityType');
  const watchedEntityId = watch('entityId');

  // Buscar entidades baseado no tipo selecionado
  const { data: entities, isLoading: entitiesLoading } = useQuery({
    queryKey: ['entities', watchedEntityType],
    queryFn: async () => {
      if (!watchedEntityType) return null;
      
      switch (watchedEntityType) {
        case 'evento':
          return apiService.getEventos({ limit: 100 });
        case 'planta':
          return apiService.getPlantas({ limit: 100 });
        case 'infra_object':
          return apiService.getInfraObjects({});
        case 'ai_job':
          return apiService.getAIJobs({});
        default:
          return null;
      }
    },
    enabled: !!watchedEntityType
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => {
      const preview = file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined;
      return Object.assign(file, { preview });
    });
    
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
      'text/*': ['.txt', '.csv'],
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar']
    },
    maxSize: 50 * 1024 * 1024 // 50MB
  });

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadFiles = async (data: UploadForm) => {
    if (files.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }

    setIsUploading(true);
    
    try {
      const uploadPromises = files.map(async (file, index) => {
        try {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 0 } : f
          ));

          if (files.length === 1) {
            // Upload único
            await apiService.uploadFile(file, data.entityType, data.entityId);
          } else {
            // Upload múltiplo
            await apiService.uploadMultipleFiles([file], data.entityType, data.entityId);
          }

          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, progress: 100, uploaded: true } : f
          ));
        } catch (error) {
          setFiles(prev => prev.map((f, i) => 
            i === index ? { ...f, error: 'Erro no upload' } : f
          ));
          throw error;
        }
      });

      await Promise.all(uploadPromises);
      
      toast.success(`${files.length} arquivo(s) enviado(s) com sucesso!`);
      
      // Aguardar um pouco para mostrar o sucesso e depois navegar
      setTimeout(() => {
        navigate('/files');
      }, 1500);
      
    } catch (error) {
      toast.error('Erro ao fazer upload dos arquivos');
      console.error('Erro:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/files"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Upload de Arquivo</h1>
          <p className="text-gray-600">Envie documentos, imagens e outros arquivos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(uploadFiles)} className="space-y-6">
            {/* Configuração do Upload */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Configuração
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Entidade *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.entityType && "border-red-300")}
                    {...register('entityType')}
                  >
                    <option value="">Selecione o tipo</option>
                    {entityTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.entityType && (
                    <p className="mt-1 text-sm text-red-600">{errors.entityType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Entidade *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.entityId && "border-red-300")}
                    {...register('entityId')}
                    disabled={!watchedEntityType || entitiesLoading}
                  >
                    <option value="">
                      {!watchedEntityType 
                        ? 'Selecione o tipo primeiro' 
                        : entitiesLoading 
                        ? 'Carregando...' 
                        : 'Selecione a entidade'
                      }
                    </option>
                    {entities?.data?.data?.map((entity: any) => (
                      <option key={entity.id} value={entity.id}>
                        {getEntityDisplayName(entity, watchedEntityType)}
                      </option>
                    ))}
                  </select>
                  {errors.entityId && (
                    <p className="mt-1 text-sm text-red-600">{errors.entityId.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    className="input-eventcad"
                    placeholder="Descrição opcional dos arquivos..."
                    {...register('description')}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tags
                  </label>
                  <input
                    type="text"
                    className="input-eventcad"
                    placeholder="Tags separadas por vírgula (ex: planta, segurança, revisão)"
                    {...register('tags')}
                  />
                </div>
              </div>
            </div>

            {/* Área de Upload */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Arquivos
              </h3>

              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={cn(
                  "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                  isDragActive 
                    ? "border-eventcad-400 bg-eventcad-50" 
                    : "border-gray-300 hover:border-gray-400"
                )}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive 
                    ? 'Solte os arquivos aqui'
                    : 'Arraste arquivos ou clique para selecionar'
                  }
                </p>
                <p className="text-sm text-gray-600">
                  Suporte para imagens, PDFs, documentos, planilhas e arquivos CAD (máx. 50MB)
                </p>
              </div>

              {/* Lista de Arquivos */}
              {files.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-medium text-gray-900 mb-3">
                    Arquivos selecionados ({files.length})
                  </h4>
                  <div className="space-y-3">
                    {files.map((file, index) => {
                      const fileType = getFileType(file);
                      const FileIcon = getFileIcon(fileType);
                      
                      return (
                        <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-shrink-0">
                            {file.preview ? (
                              <img
                                src={file.preview}
                                alt={file.name}
                                className="h-10 w-10 object-cover rounded"
                              />
                            ) : (
                              <div className="h-10 w-10 bg-gray-200 rounded flex items-center justify-center">
                                <FileIcon className="h-5 w-5 text-gray-500" />
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)} • {fileType}
                            </p>
                            
                            {/* Progress Bar */}
                            {file.progress !== undefined && (
                              <div className="mt-1">
                                <div className="w-full bg-gray-200 rounded-full h-1">
                                  <div 
                                    className={cn(
                                      "h-1 rounded-full transition-all",
                                      file.uploaded ? 'bg-green-500' : file.error ? 'bg-red-500' : 'bg-blue-500'
                                    )}
                                    style={{ width: `${file.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}
                            
                            {file.error && (
                              <p className="text-xs text-red-600 mt-1">{file.error}</p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {file.uploaded && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {file.error && (
                              <AlertTriangle className="h-5 w-5 text-red-500" />
                            )}
                            {!isUploading && (
                              <button
                                type="button"
                                onClick={() => removeFile(index)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link
                to="/files"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isUploading || files.length === 0 || !watchedEntityType || !watchedEntityId}
                className="btn-primary flex items-center gap-2"
              >
                {isUploading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isUploading ? 'Enviando...' : `Enviar ${files.length > 0 ? `(${files.length})` : ''}`}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar com Informações */}
        <div className="space-y-6">
          {/* Tipos de Arquivo Suportados */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-500" />
              Tipos Suportados
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FileImage className="h-4 w-4" />
                <span>Imagens (PNG, JPG, GIF, SVG)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Documentos (DOC, DOCX, PDF)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Planilhas (XLS, XLSX, CSV)</span>
              </div>
              <div className="flex items-center gap-2">
                <FileIcon className="h-4 w-4" />
                <span>CAD (DWG, DXF, STEP)</span>
              </div>
            </div>
          </div>

          {/* Dicas de Upload */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Dicas Importantes
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Tamanho máximo por arquivo: 50MB</p>
              <p>• Use nomes descritivos para facilitar a busca</p>
              <p>• Associe arquivos à entidade correta</p>
              <p>• Adicione tags para melhor organização</p>
              <p>• Evite caracteres especiais nos nomes</p>
            </div>
          </div>

          {/* Preview da Entidade Selecionada */}
          {watchedEntityType && entities?.data?.data && watchedEntityId && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Entidade Selecionada
              </h4>
              {(() => {
                const selectedEntity = entities.data.data.find((e: any) => e.id === watchedEntityId);
                if (!selectedEntity) return null;
                
                return (
                  <div className="text-sm">
                    <p className="font-medium text-gray-900">
                      {getEntityDisplayName(selectedEntity, watchedEntityType)}
                    </p>
                    <p className="text-gray-600">
                      {entityTypeOptions.find(opt => opt.value === watchedEntityType)?.label}
                    </p>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}