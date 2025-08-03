import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save,
  Bot,
  Cpu,
  Settings,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Image as ImageIcon
} from 'lucide-react';
import { apiService } from '@/services/api';
import { AIRecognitionModel } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const aiJobSchema = z.object({
  jobName: z.string().min(1, 'Nome do job é obrigatório').max(100, 'Nome muito longo'),
  modelType: z.nativeEnum(AIRecognitionModel),
  plantaId: z.string().min(1, 'Planta é obrigatória'),
  priority: z.number().min(1).max(5),
  configuration: z.object({
    confidence_threshold: z.number().min(0.1).max(1).optional(),
    max_detections: z.number().min(1).max(1000).optional(),
    batch_size: z.number().min(1).max(32).optional(),
    use_gpu: z.boolean().optional(),
    save_intermediate: z.boolean().optional()
  }).optional()
});

type AIJobForm = z.infer<typeof aiJobSchema>;

const modelOptions = [
  { 
    value: AIRecognitionModel.YOLO_V8, 
    label: 'YOLO v8', 
    description: 'Detecção geral de objetos - Rápido e preciso',
    bestFor: 'Detecção geral de objetos arquitetônicos e mobiliário',
    avgTime: '2-5 min',
    accuracy: '95%'
  },
  { 
    value: AIRecognitionModel.DETECTRON2, 
    label: 'Detectron2', 
    description: 'Segmentação de instâncias - Máscaras precisas',
    bestFor: 'Segmentação precisa de objetos complexos',
    avgTime: '5-10 min',
    accuracy: '92%'
  },
  { 
    value: AIRecognitionModel.EFFICIENTDET, 
    label: 'EfficientDet', 
    description: 'Objetos pequenos - Otimizado para precisão',
    bestFor: 'Detecção de objetos pequenos como tomadas e interruptores',
    avgTime: '3-7 min',
    accuracy: '90%'
  },
  { 
    value: AIRecognitionModel.FASTER_RCNN, 
    label: 'Faster R-CNN', 
    description: 'Alta precisão - Melhor qualidade',
    bestFor: 'Análises críticas que requerem máxima precisão',
    avgTime: '8-15 min',
    accuracy: '97%'
  },
  { 
    value: AIRecognitionModel.SSD_MOBILENET, 
    label: 'SSD MobileNet', 
    description: 'Processamento rápido - Menor precisão',
    bestFor: 'Análises rápidas e prototipagem',
    avgTime: '1-3 min',
    accuracy: '85%'
  }
];

const priorityOptions = [
  { value: 1, label: 'Baixa', color: 'bg-gray-100 text-gray-800', description: 'Processamento quando houver recursos disponíveis' },
  { value: 2, label: 'Normal', color: 'bg-blue-100 text-blue-800', description: 'Processamento padrão na fila' },
  { value: 3, label: 'Alta', color: 'bg-yellow-100 text-yellow-800', description: 'Processamento prioritário' },
  { value: 4, label: 'Urgente', color: 'bg-orange-100 text-orange-800', description: 'Processamento imediato quando possível' },
  { value: 5, label: 'Crítica', color: 'bg-red-100 text-red-800', description: 'Máxima prioridade, interrompe outros jobs' }
];

export function NovoAIJobPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<AIJobForm>({
    resolver: zodResolver(aiJobSchema),
    defaultValues: {
      priority: 2,
      configuration: {
        confidence_threshold: 0.5,
        max_detections: 100,
        batch_size: 8,
        use_gpu: true,
        save_intermediate: false
      }
    }
  });

  const watchedModelType = watch('modelType');
  const watchedPriority = watch('priority');

  // Buscar plantas disponíveis
  const { data: plantas } = useQuery({
    queryKey: ['plantas'],
    queryFn: () => apiService.getPlantas({ limit: 100 })
  });

  // Buscar status da fila de IA
  const { data: aiQueue } = useQuery({
    queryKey: ['ai-queue'],
    queryFn: () => apiService.getAIQueue()
  });

  const onSubmit = async (data: AIJobForm) => {
    setIsSubmitting(true);
    try {
      await apiService.createAIJob(data);
      toast.success('Job de IA criado com sucesso!');
      navigate('/ai-jobs');
    } catch (error) {
      toast.error('Erro ao criar job de IA');
      console.error('Erro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedModelInfo = modelOptions.find(m => m.value === watchedModelType);
  const selectedPriorityInfo = priorityOptions.find(p => p.value === watchedPriority);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/ai-jobs"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Job de IA</h1>
          <p className="text-gray-600">Configure um novo processamento de inteligência artificial</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Configuração Básica */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Bot className="h-5 w-5" />
                Configuração Básica
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Job *
                  </label>
                  <input
                    type="text"
                    className={cn("input-eventcad", errors.jobName && "border-red-300")}
                    placeholder="Ex: Análise de Segurança - Planta Principal"
                    {...register('jobName')}
                  />
                  {errors.jobName && (
                    <p className="mt-1 text-sm text-red-600">{errors.jobName.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planta a ser Analisada *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.plantaId && "border-red-300")}
                    {...register('plantaId')}
                  >
                    <option value="">Selecione uma planta</option>
                    {plantas?.data?.data?.map((planta) => (
                      <option key={planta.id} value={planta.id}>
                        {planta.nome} - {planta.tipo}
                      </option>
                    ))}
                  </select>
                  {errors.plantaId && (
                    <p className="mt-1 text-sm text-red-600">{errors.plantaId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prioridade *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
                    {priorityOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setValue('priority', option.value)}
                        className={cn(
                          "p-3 rounded-lg border-2 transition-all text-center",
                          watchedPriority === option.value
                            ? "border-eventcad-600 bg-eventcad-50"
                            : "border-gray-200 hover:border-gray-300"
                        )}
                      >
                        <div className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mb-1",
                          option.color
                        )}>
                          {option.label}
                        </div>
                        <p className="text-xs text-gray-600">{option.description}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Seleção de Modelo */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Cpu className="h-5 w-5" />
                Modelo de IA
              </h3>

              <div className="grid grid-cols-1 gap-4">
                {modelOptions.map((model) => (
                  <div
                    key={model.value}
                    className={cn(
                      "p-4 rounded-lg border-2 cursor-pointer transition-all",
                      watchedModelType === model.value
                        ? "border-eventcad-600 bg-eventcad-50"
                        : "border-gray-200 hover:border-gray-300"
                    )}
                    onClick={() => setValue('modelType', model.value)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold text-gray-900">{model.label}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Clock className="h-4 w-4" />
                            {model.avgTime}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <CheckCircle className="h-4 w-4" />
                            {model.accuracy}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{model.description}</p>
                        <p className="text-xs text-gray-500"><strong>Melhor para:</strong> {model.bestFor}</p>
                      </div>
                      <input
                        type="radio"
                        value={model.value}
                        checked={watchedModelType === model.value}
                        onChange={() => setValue('modelType', model.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                ))}
              </div>
              {errors.modelType && (
                <p className="mt-1 text-sm text-red-600">{errors.modelType.message}</p>
              )}
            </div>

            {/* Configurações Avançadas */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configurações Avançadas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Limite de Confiança
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="1"
                    className="input-eventcad"
                    {...register('configuration.confidence_threshold', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Mínimo de confiança para aceitar detecções (0.1 - 1.0)</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Máximo de Detecções
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    className="input-eventcad"
                    {...register('configuration.max_detections', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Número máximo de objetos a detectar</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tamanho do Lote
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="32"
                    className="input-eventcad"
                    {...register('configuration.batch_size', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-gray-500 mt-1">Quantidade de imagens processadas simultaneamente</p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="use_gpu"
                      className="rounded border-gray-300"
                      {...register('configuration.use_gpu')}
                    />
                    <label htmlFor="use_gpu" className="text-sm font-medium text-gray-700">
                      Usar GPU (mais rápido)
                    </label>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="save_intermediate"
                      className="rounded border-gray-300"
                      {...register('configuration.save_intermediate')}
                    />
                    <label htmlFor="save_intermediate" className="text-sm font-medium text-gray-700">
                      Salvar resultados intermediários
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link
                to="/ai-jobs"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? 'Criando...' : 'Criar Job'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar com Informações */}
        <div className="space-y-6">
          {/* Preview do Modelo Selecionado */}
          {selectedModelInfo && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                Modelo Selecionado
              </h4>
              <div className="space-y-3">
                <div>
                  <h5 className="font-medium text-gray-900">{selectedModelInfo.label}</h5>
                  <p className="text-sm text-gray-600">{selectedModelInfo.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Tempo médio:</span>
                    <span className="ml-2 text-gray-900">{selectedModelInfo.avgTime}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Precisão:</span>
                    <span className="ml-2 text-gray-900">{selectedModelInfo.accuracy}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Preview da Prioridade */}
          {selectedPriorityInfo && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                Prioridade
              </h4>
              <div className="space-y-3">
                <div className={cn(
                  "inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium",
                  selectedPriorityInfo.color
                )}>
                  {selectedPriorityInfo.label}
                </div>
                <p className="text-sm text-gray-600">{selectedPriorityInfo.description}</p>
              </div>
            </div>
          )}

          {/* Status da Fila */}
          {aiQueue?.data && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Clock className="h-4 w-4 text-purple-500" />
                Fila de Processamento
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Jobs na fila:</span>
                  <span className="text-gray-900">{aiQueue.data.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tempo estimado:</span>
                  <span className="text-gray-900">
                    {aiQueue.data.length * 5} min
                  </span>
                </div>
                {aiQueue.data.length > 0 && (
                  <div>
                    <p className="text-gray-600 mb-1">Próximos jobs:</p>
                    <div className="space-y-1">
                      {aiQueue.data.slice(0, 3).map((job: any, index: number) => (
                        <div key={job.id} className="text-xs text-gray-500">
                          {index + 1}. {job.jobName}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Dicas */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-green-500" />
              Dicas de Otimização
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Use YOLO v8 para análises gerais rápidas</p>
              <p>• Faster R-CNN oferece máxima precisão para casos críticos</p>
              <p>• Ajuste o limite de confiança baseado na qualidade da planta</p>
              <p>• Jobs de alta prioridade podem interromper outros processamentos</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}