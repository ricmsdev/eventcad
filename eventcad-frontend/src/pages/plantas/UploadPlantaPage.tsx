import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Upload,
  MapPin,
  Settings,
  Calendar,
  Ruler,
  CheckCircle,
  X,
  ArrowLeft,
  Image,
  File,
  Info,
  Zap,
  Building,
  Droplets,
  Shield,
  Target,
  Grid3X3,
  Palette,
  Type,
  AlertCircle
} from 'lucide-react';
import { PlantaTipo } from '@/types';

// Schema de validação para upload de plantas
const uploadPlantaSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  plantaTipo: z.nativeEnum(PlantaTipo),
  eventoId: z.string().optional(),
  escala: z.string().optional(),
  unidadeMedida: z.string().optional(),
  sistemaCoordenadas: z.string().optional(),
  
  // Configurações técnicas
  dwgVersion: z.string().optional(),
  cadSoftware: z.string().optional(),
  scaleFactor: z.number().optional(),
  northAngle: z.number().optional(),
  
  // Metadados específicos
  layersData: z.array(z.object({
    name: z.string(),
    color: z.string().optional(),
    lineType: z.string().optional(),
    isVisible: z.boolean().optional(),
    isFrozen: z.boolean().optional(),
    objectCount: z.number().optional(),
  })).optional(),
  
  // Configurações de processamento
  autoDetectObjects: z.boolean().default(true),
  detectText: z.boolean().default(true),
  validateCompliance: z.boolean().default(true),
  generateThumbnail: z.boolean().default(true),
  
  // Observações
  observacoes: z.string().optional(),
});

type UploadPlantaFormData = z.infer<typeof uploadPlantaSchema>;

interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export function UploadPlantaPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeStep, setActiveStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedEvento] = useState<any>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UploadPlantaFormData>({
    resolver: zodResolver(uploadPlantaSchema),
    defaultValues: {
      plantaTipo: PlantaTipo.PLANTA_BAIXA,
      autoDetectObjects: true,
      detectText: true,
      validateCompliance: true,
      generateThumbnail: true,
    },
  });

  const watchedValues = watch();

  // Dropzone para upload de arquivos
  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadedFile[] = acceptedFiles.map((file, index) => ({
      id: `file-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
      status: 'uploading' as const,
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);

    // Simular upload progress
    newFiles.forEach((file) => {
      const interval = setInterval(() => {
        setUploadedFiles(prev => 
          prev.map(f => 
            f.id === file.id 
              ? { ...f, progress: Math.min(f.progress + 10, 100) }
              : f
          )
        );

        if (file.progress >= 100) {
          clearInterval(interval);
          setUploadedFiles(prev => 
            prev.map(f => 
              f.id === file.id 
                ? { ...f, status: 'processing' as const }
                : f
            )
          );

          // Simular processamento
          setTimeout(() => {
            setUploadedFiles(prev => 
              prev.map(f => 
                f.id === file.id 
                  ? { ...f, status: 'completed' as const }
                  : f
              )
            );
          }, 2000);
        }
      }, 200);
    });

    toast.success(`${acceptedFiles.length} arquivo(s) selecionado(s)`);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.tiff'],
      'application/pdf': ['.pdf'],
      'application/dwg': ['.dwg'],
      'application/dxf': ['.dxf'],
      'application/cad': ['.cad'],
    },
    multiple: true,
    maxSize: 50 * 1024 * 1024, // 50MB
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => {
      const file = prev.find(f => f.id === fileId);
      if (file) {
        URL.revokeObjectURL(file.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const onSubmit = async (data: UploadPlantaFormData) => {
    if (uploadedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo para upload');
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Implementar upload das plantas
      console.log('Dados do upload:', data);
      console.log('Arquivos:', uploadedFiles);
      
      toast.success('Plantas enviadas com sucesso!');
      navigate('/plantas');
    } catch (error) {
      toast.error('Erro ao enviar plantas');
    } finally {
      setIsLoading(false);
    }
  };

  const steps = [
    { id: 1, title: 'Selecionar Arquivos', icon: Upload },
    { id: 2, title: 'Configurar Planta', icon: Settings },
    { id: 3, title: 'Vincular Evento', icon: Calendar },
    { id: 4, title: 'Revisar e Enviar', icon: CheckCircle },
  ];

  const plantaTipoConfig = {
    [PlantaTipo.PLANTA_BAIXA]: {
      label: 'Planta Baixa',
      description: 'Vista superior do local',
      icon: Building,
      color: 'bg-blue-500',
    },
    [PlantaTipo.PLANTA_COBERTURA]: {
      label: 'Planta de Cobertura',
      description: 'Vista da cobertura',
      icon: Building,
      color: 'bg-green-500',
    },
    [PlantaTipo.PLANTA_SITUACAO]: {
      label: 'Planta de Situação',
      description: 'Localização no terreno',
      icon: MapPin,
      color: 'bg-purple-500',
    },
    [PlantaTipo.PLANTA_LOCALIZACAO]: {
      label: 'Planta de Localização',
      description: 'Contexto urbano',
      icon: MapPin,
      color: 'bg-orange-500',
    },
    [PlantaTipo.CORTE_LONGITUDINAL]: {
      label: 'Corte Longitudinal',
      description: 'Seção longitudinal',
      icon: Ruler,
      color: 'bg-red-500',
    },
    [PlantaTipo.CORTE_TRANSVERSAL]: {
      label: 'Corte Transversal',
      description: 'Seção transversal',
      icon: Ruler,
      color: 'bg-pink-500',
    },
    [PlantaTipo.FACHADA_PRINCIPAL]: {
      label: 'Fachada Principal',
      description: 'Vista frontal',
      icon: Building,
      color: 'bg-indigo-500',
    },
    [PlantaTipo.FACHADA_LATERAL]: {
      label: 'Fachada Lateral',
      description: 'Vista lateral',
      icon: Building,
      color: 'bg-teal-500',
    },
    [PlantaTipo.DETALHAMENTO]: {
      label: 'Detalhamento',
      description: 'Detalhes construtivos',
      icon: Target,
      color: 'bg-yellow-500',
    },
    [PlantaTipo.INSTALACOES_ELETRICAS]: {
      label: 'Instalações Elétricas',
      description: 'Sistema elétrico',
      icon: Zap,
      color: 'bg-yellow-400',
    },
    [PlantaTipo.INSTALACOES_HIDRAULICAS]: {
      label: 'Instalações Hidráulicas',
      description: 'Sistema hidráulico',
      icon: Droplets,
      color: 'bg-blue-400',
    },
    [PlantaTipo.INSTALACOES_AR_CONDICIONADO]: {
      label: 'Instalações de Ar Condicionado',
      description: 'Sistema de climatização',
      icon: Building,
      color: 'bg-cyan-500',
    },
    [PlantaTipo.LAYOUT_MOBILIARIO]: {
      label: 'Layout Mobiliário',
      description: 'Disposição de móveis',
      icon: Grid3X3,
      color: 'bg-gray-500',
    },
    [PlantaTipo.PLANTA_DECORACAO]: {
      label: 'Planta de Decoração',
      description: 'Elementos decorativos',
      icon: Palette,
      color: 'bg-pink-400',
    },
    [PlantaTipo.PLANTA_PAISAGISMO]: {
      label: 'Planta de Paisagismo',
      description: 'Elementos paisagísticos',
      icon: Building,
      color: 'bg-green-400',
    },
    [PlantaTipo.OUTROS]: {
      label: 'Outros',
      description: 'Tipo personalizado',
      icon: File,
      color: 'bg-gray-400',
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/plantas')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Upload de Plantas</h1>
                <p className="text-gray-600">Envie plantas técnicas para o EventCAD+</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{showAdvanced ? 'Modo Simples' : 'Modo Avançado'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
                              {steps.map((step) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = activeStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive ? '#3B82F6' : isCompleted ? '#10B981' : '#E5E7EB',
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-white font-medium"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {steps.indexOf(step) < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Selecionar Arquivos */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 1 ? 1 : 0.5, x: activeStep >= 1 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Upload className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Selecionar Arquivos</h2>
            </div>

            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos aqui ou clique para selecionar'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Suporta PNG, JPG, PDF, DWG, DXF, CAD (máx. 50MB cada)
              </p>
              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Image className="w-4 h-4" />
                  <span>Imagens</span>
                </div>
                <div className="flex items-center space-x-1">
                  <File className="w-4 h-4" />
                  <span>PDF</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Building className="w-4 h-4" />
                  <span>CAD</span>
                </div>
              </div>
            </div>

            {/* Lista de arquivos */}
            {uploadedFiles.length > 0 && (
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Arquivos Selecionados</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <AnimatePresence>
                    {uploadedFiles.map((file) => {
                      return (
                        <motion.div
                          key={file.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          className="relative bg-gray-50 rounded-lg p-4 border border-gray-200"
                        >
                          {/* Preview */}
                          <div className="relative mb-3">
                            <img
                              src={file.preview}
                              alt={file.file.name}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Info do arquivo */}
                          <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.file.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              {(file.file.size / 1024 / 1024).toFixed(2)} MB
                            </p>

                            {/* Progress bar */}
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-300 ${
                                  file.status === 'completed'
                                    ? 'bg-green-500'
                                    : file.status === 'error'
                                    ? 'bg-red-500'
                                    : 'bg-blue-500'
                                }`}
                                style={{ width: `${file.progress}%` }}
                              />
                            </div>

                            {/* Status */}
                            <div className="flex items-center space-x-2">
                              {file.status === 'uploading' && (
                                <div className="flex items-center space-x-1 text-blue-600">
                                  <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">Enviando...</span>
                                </div>
                              )}
                              {file.status === 'processing' && (
                                <div className="flex items-center space-x-1 text-yellow-600">
                                  <div className="w-3 h-3 border-2 border-yellow-600 border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs">Processando...</span>
                                </div>
                              )}
                              {file.status === 'completed' && (
                                <div className="flex items-center space-x-1 text-green-600">
                                  <CheckCircle className="w-3 h-3" />
                                  <span className="text-xs">Concluído</span>
                                </div>
                              )}
                              {file.status === 'error' && (
                                <div className="flex items-center space-x-1 text-red-600">
                                  <AlertCircle className="w-3 h-3" />
                                  <span className="text-xs">Erro</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>
            )}
          </motion.div>

          {/* Step 2: Configurar Planta */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 2 ? 1 : 0.5, x: activeStep >= 2 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Configurar Planta</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome da Planta *
                </label>
                <input
                  {...register('nome')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Ex: Planta Baixa - Pavimento Térreo"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              {/* Tipo de Planta */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tipo de Planta *
                </label>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(plantaTipoConfig).map(([key, config]) => {
                    const Icon = config.icon;
                    const isSelected = watchedValues.plantaTipo === key;
                    
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setValue('plantaTipo', key as PlantaTipo)}
                        className={`p-3 text-left border rounded-lg transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <div className={`p-1 rounded ${config.color}`}>
                            <Icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="font-medium text-sm">{config.label}</span>
                        </div>
                        <p className="text-xs text-gray-600 line-clamp-2">
                          {config.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  className="input-eventcad"
                  placeholder="Descreva a planta..."
                />
              </div>

              {/* Configurações técnicas */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Escala
                </label>
                <input
                  {...register('escala')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Ex: 1:100"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unidade de Medida
                </label>
                <select {...register('unidadeMedida')} className="input-eventcad">
                  <option value="">Selecione...</option>
                  <option value="metros">Metros</option>
                  <option value="milimetros">Milímetros</option>
                  <option value="centimetros">Centímetros</option>
                  <option value="polegadas">Polegadas</option>
                  <option value="pes">Pés</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sistema de Coordenadas
                </label>
                <input
                  {...register('sistemaCoordenadas')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Ex: UTM, SIRGAS2000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ângulo do Norte
                </label>
                <input
                  {...register('northAngle', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="0"
                  min="0"
                  max="360"
                />
              </div>

              {/* Configurações avançadas */}
              {showAdvanced && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Versão DWG
                    </label>
                    <input
                      {...register('dwgVersion')}
                      type="text"
                      className="input-eventcad"
                      placeholder="Ex: 2018"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Software CAD
                    </label>
                    <input
                      {...register('cadSoftware')}
                      type="text"
                      className="input-eventcad"
                      placeholder="Ex: AutoCAD, Revit"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fator de Escala
                    </label>
                    <input
                      {...register('scaleFactor', { valueAsNumber: true })}
                      type="number"
                      className="input-eventcad"
                      placeholder="1.0"
                      step="0.1"
                    />
                  </div>
                </>
              )}

              {/* Configurações de processamento */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Configurações de Processamento</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'autoDetectObjects', label: 'Detectar Objetos', icon: Target },
                    { key: 'detectText', label: 'Reconhecer Texto', icon: Type },
                    { key: 'validateCompliance', label: 'Validar Compliance', icon: Shield },
                    { key: 'generateThumbnail', label: 'Gerar Thumbnail', icon: Image },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        {...register(key as keyof UploadPlantaFormData)}
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações
                </label>
                <textarea
                  {...register('observacoes')}
                  rows={3}
                  className="input-eventcad"
                  placeholder="Observações sobre a planta..."
                />
              </div>
            </div>
          </motion.div>

          {/* Step 3: Vincular Evento */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 3 ? 1 : 0.5, x: activeStep >= 3 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Vincular Evento</h2>
            </div>

            <div className="space-y-6">
              {/* Seleção de evento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Evento (Opcional)
                </label>
                <select {...register('eventoId')} className="input-eventcad">
                  <option value="">Selecione um evento...</option>
                  <option value="evento-1">Feira de Tecnologia 2025</option>
                  <option value="evento-2">Congresso de Engenharia</option>
                  <option value="evento-3">Exposição de Arquitetura</option>
                </select>
                <p className="mt-1 text-sm text-gray-500">
                  Vincular a um evento permite melhor organização e controle
                </p>
              </div>

              {/* Preview do evento selecionado */}
              {selectedEvento && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Evento Selecionado</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p><strong>Nome:</strong> {selectedEvento.nome}</p>
                    <p><strong>Data:</strong> {selectedEvento.dataInicio}</p>
                    <p><strong>Local:</strong> {selectedEvento.local}</p>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

          {/* Step 4: Revisar e Enviar */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 4 ? 1 : 0.5, x: activeStep >= 4 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <CheckCircle className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Revisar e Enviar</h2>
            </div>

            <div className="space-y-6">
              {/* Resumo */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-3">Resumo do Upload</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p><strong>Arquivos:</strong> {uploadedFiles.length}</p>
                    <p><strong>Tipo:</strong> {plantaTipoConfig[watchedValues.plantaTipo || PlantaTipo.PLANTA_BAIXA].label}</p>
                    <p><strong>Escala:</strong> {watchedValues.escala || 'Não informada'}</p>
                  </div>
                  <div>
                    <p><strong>Detecção de Objetos:</strong> {watchedValues.autoDetectObjects ? 'Sim' : 'Não'}</p>
                    <p><strong>Reconhecimento de Texto:</strong> {watchedValues.detectText ? 'Sim' : 'Não'}</p>
                    <p><strong>Validação:</strong> {watchedValues.validateCompliance ? 'Sim' : 'Não'}</p>
                  </div>
                </div>
              </div>

              {/* Termos */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-900">Importante</h4>
                    <ul className="mt-2 text-sm text-yellow-800 space-y-1">
                      <li>• As plantas serão processadas automaticamente pela IA</li>
                      <li>• Objetos de infraestrutura serão detectados e catalogados</li>
                      <li>• O processamento pode levar alguns minutos</li>
                      <li>• Você receberá notificação quando estiver pronto</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <div className="flex items-center space-x-4">
              {activeStep < steps.length ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  disabled={uploadedFiles.length === 0 && activeStep === 1}
                  className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading || uploadedFiles.length === 0}
                  className="btn-primary flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isLoading ? 'Enviando...' : 'Enviar Plantas'}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}