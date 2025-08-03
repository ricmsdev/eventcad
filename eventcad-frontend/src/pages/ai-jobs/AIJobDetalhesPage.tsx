import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  Square,
  Pause,
  Play,
  FileText,
  Download,
  Eye,
  AlertTriangle,
  Zap,
  Settings,
  BarChart3,
  RefreshCw,
  Cpu
} from 'lucide-react';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  running: { label: 'Executando', color: 'bg-blue-100 text-blue-800', icon: Activity },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800', icon: Activity },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800', icon: Square },
  paused: { label: 'Pausado', color: 'bg-yellow-100 text-yellow-800', icon: Pause }
} as const;

const modelLabels = {
  fire_safety_ai: 'Fire Safety AI - Segurança contra Incêndio',
  electrical_ai: 'Electrical AI - Instalações Elétricas',
  accessibility_ai: 'Accessibility AI - Acessibilidade',
  architectural_ai: 'Architectural AI - Arquitetônico',
  general_ai: 'General AI - Geral',
  yolo_v8: 'YOLO v8 - Detecção Geral',
  detectron2: 'Detectron2 - Segmentação',
  efficientdet: 'EfficientDet - Objetos Pequenos',
  faster_rcnn: 'Faster R-CNN - Alta Precisão',
  ssd_mobilenet: 'SSD MobileNet - Rápido'
} as const;

const priorityLabels = {
  1: 'Baixa',
  2: 'Normal',
  3: 'Alta',
  4: 'Urgente',
  5: 'Crítica'
} as const;

const priorityColors = {
  1: 'bg-gray-100 text-gray-800',
  2: 'bg-blue-100 text-blue-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-orange-100 text-orange-800',
  5: 'bg-red-100 text-red-800'
} as const;

export function AIJobDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showLogs, setShowLogs] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['ai-job', id],
    queryFn: () => apiService.getAIJob(id!),
    enabled: !!id,
    refetchInterval: (query) => {
      // Auto-refresh se o job estiver rodando
      return query.state.data?.data?.status === 'running' ? 2000 : false;
    }
  });

  const { data: planta } = useQuery({
    queryKey: ['planta', job?.data?.plantaId],
    queryFn: () => apiService.getPlanta(job!.data.plantaId),
    enabled: !!job?.data?.plantaId
  });

  const { data: results } = useQuery({
    queryKey: ['ai-job-results', id],
    queryFn: () => apiService.getAIJobResults(id!),
    enabled: !!id && job?.data?.status === 'completed'
  });

  const { data: logs } = useQuery({
    queryKey: ['ai-job-logs', id],
    queryFn: () => apiService.getAIJobLogs(id!),
    enabled: !!id && showLogs
  });

  const executeJobMutation = useMutation({
    mutationFn: () => apiService.executeAIJob(id!),
    onSuccess: () => {
      toast.success('Job iniciado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ai-job', id] });
    },
    onError: () => {
      toast.error('Erro ao iniciar job');
    }
  });

  const cancelJobMutation = useMutation({
    mutationFn: () => apiService.cancelAIJob(id!),
    onSuccess: () => {
      toast.success('Job cancelado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['ai-job', id] });
    },
    onError: () => {
      toast.error('Erro ao cancelar job');
    }
  });

  const handleExecute = () => {
    executeJobMutation.mutate();
  };

  const handleCancel = () => {
    cancelJobMutation.mutate();
  };

  const getProgressPercentage = () => {
    if (!job?.data) return 0;
    if (job.data.status === 'completed') return 100;
    if (job.data.status === 'running') return job.data.progress || 0;
    return 0;
  };

  const getEstimatedTimeRemaining = () => {
    if (!job?.data || job.data.status !== 'running') return null;
    const progress = job.data.progress || 0;
    if (progress === 0) return null;
    
    const elapsed = new Date().getTime() - new Date(job.data.startedAt || job.data.createdAt).getTime();
    const estimated = (elapsed / progress) * (100 - progress);
    
    return Math.round(estimated / 1000 / 60); // minutos
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !job?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Job não encontrado</h3>
          <p className="text-gray-600 mb-4">O job solicitado não existe ou foi removido.</p>
          <Link to="/ai-jobs" className="btn-primary">
            Voltar para Jobs
          </Link>
        </div>
      </div>
    );
  }

  const aiJob = job.data;
  const statusInfo = statusConfig[aiJob.status];
  const StatusIcon = statusInfo.icon;
  const progress = getProgressPercentage();
  const timeRemaining = getEstimatedTimeRemaining();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/ai-jobs"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{aiJob.jobName}</h1>
            <p className="text-gray-600">Detalhes do job de inteligência artificial</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className={cn(
            "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
            statusInfo.color
          )}>
            <StatusIcon className="h-4 w-4" />
            {statusInfo.label}
          </div>

          {aiJob.status === 'pending' && (
            <button
              onClick={handleExecute}
              disabled={executeJobMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
            >
              <Play className="h-4 w-4" />
              Executar
            </button>
          )}

          {(aiJob.status === 'running' || aiJob.status === 'pending') && (
            <button
              onClick={handleCancel}
              disabled={cancelJobMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
            >
              <Square className="h-4 w-4" />
              Cancelar
            </button>
          )}

          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['ai-job', id] })}
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Atualizar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Status e Progresso */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status e Progresso
            </h3>

            {aiJob.status === 'running' && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso do processamento</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="h-3 bg-blue-500 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {timeRemaining && (
                  <p className="text-sm text-gray-600 mt-2">
                    Tempo estimado restante: {timeRemaining} min
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Modelo de IA</label>
                <p className="text-gray-900">{modelLabels[aiJob.modelType]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Prioridade</label>
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  priorityColors[aiJob.priority as keyof typeof priorityColors]
                )}>
                  {priorityLabels[aiJob.priority as keyof typeof priorityLabels]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Planta</label>
                <p className="text-gray-900">{planta?.data?.nome || 'Carregando...'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Criado em</label>
                <p className="text-gray-900">
                  {format(new Date(aiJob.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>

              {aiJob.startedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Iniciado em</label>
                  <p className="text-gray-900">
                    {format(new Date(aiJob.startedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}

              {aiJob.completedAt && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Concluído em</label>
                  <p className="text-gray-900">
                    {format(new Date(aiJob.completedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Configurações */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {aiJob.configuration?.confidence_threshold && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Limite de Confiança</label>
                  <p className="text-gray-900">{aiJob.configuration.confidence_threshold}</p>
                </div>
              )}

              {aiJob.configuration?.max_detections && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Máximo de Detecções</label>
                  <p className="text-gray-900">{aiJob.configuration.max_detections}</p>
                </div>
              )}

              {aiJob.configuration?.batch_size && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Tamanho do Lote</label>
                  <p className="text-gray-900">{aiJob.configuration.batch_size}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Usar GPU</label>
                <p className="text-gray-900">{aiJob.configuration?.use_gpu ? 'Sim' : 'Não'}</p>
              </div>
            </div>
          </div>

          {/* Resultados */}
          {results?.data && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Resultados
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">{results.data.objectsDetected || 0}</p>
                  <p className="text-sm text-gray-600">Objetos Detectados</p>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {results.data.averageConfidence ? Math.round(results.data.averageConfidence * 100) : 0}%
                  </p>
                  <p className="text-sm text-gray-600">Confiança Média</p>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">{results.data.processingTime || 0}s</p>
                  <p className="text-sm text-gray-600">Tempo de Processamento</p>
                </div>
              </div>

              {results.data.detectionsByCategory && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Detecções por Categoria</h4>
                  <div className="space-y-2">
                    {Object.entries(results.data.detectionsByCategory).map(([category, count]) => (
                      <div key={category} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="text-sm text-gray-700 capitalize">{category.replace('_', ' ')}</span>
                        <span className="text-sm font-medium text-gray-900">{count as number}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Logs */}
          <div className="card-eventcad">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Logs de Execução
              </h3>
              <button
                onClick={() => setShowLogs(!showLogs)}
                className="text-sm text-eventcad-600 hover:text-eventcad-700"
              >
                {showLogs ? 'Ocultar' : 'Mostrar'} Logs
              </button>
            </div>

            {showLogs && (
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm max-h-64 overflow-y-auto">
                {logs?.data ? (
                  <pre className="whitespace-pre-wrap">{logs.data}</pre>
                ) : (
                  <p className="text-gray-400">Carregando logs...</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ações Rápidas */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Ações Rápidas
            </h4>

            <div className="space-y-2">
              {aiJob.status === 'completed' && results?.data && (
                <>
                  <Link
                    to={`/plantas/${aiJob.plantaId}`}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    Ver Resultados na Planta
                  </Link>
                  
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
                    <Download className="h-4 w-4" />
                    Download dos Resultados
                  </button>
                </>
              )}

              {aiJob.status === 'failed' && (
                <button
                  onClick={handleExecute}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                >
                  <RefreshCw className="h-4 w-4" />
                  Tentar Novamente
                </button>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Cpu className="h-4 w-4 text-purple-500" />
              Estatísticas
            </h4>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">ID do Job:</span>
                <span className="text-gray-900 font-mono text-xs">{aiJob.id}</span>
              </div>
              
              {aiJob.queuePosition && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Posição na Fila:</span>
                  <span className="text-gray-900">{aiJob.queuePosition}</span>
                </div>
              )}

              {aiJob.retryCount && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Tentativas:</span>
                  <span className="text-gray-900">{aiJob.retryCount}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status da Planta */}
          {planta?.data && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-green-500" />
                Informações da Planta
              </h4>

              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-600">Nome:</span>
                  <span className="ml-2 text-gray-900">{planta.data.nome}</span>
                </div>
                <div>
                  <span className="text-gray-600">Tipo:</span>
                  <span className="ml-2 text-gray-900">{planta.data.tipo}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status de Processamento:</span>
                  <span className="ml-2 text-gray-900">{planta.data.aiProcessingStatus}</span>
                </div>
                <Link
                  to={`/plantas/${planta.data.id}`}
                  className="text-eventcad-600 hover:text-eventcad-700 text-xs"
                >
                  Ver detalhes da planta →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}