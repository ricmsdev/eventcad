import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Play,
  Pause,
  Square,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Activity,
  Bot,
  Cpu
} from 'lucide-react';
import { apiService } from '@/services/api';
import { AIJob, AIJobStatus, AIRecognitionModel } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
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

interface AIJobFilters {
  search: string;
  status: AIJobStatus | '';
  modelType: AIRecognitionModel | '';
  priority: number | '';
  plantaId: string;
}

export function AIJobsPage() {
  const [filters, setFilters] = useState<AIJobFilters>({
    search: '',
    status: '',
    modelType: '',
    priority: '',
    plantaId: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: aiJobs, isLoading, error } = useQuery({
    queryKey: ['ai-jobs', filters, currentPage],
    queryFn: () => apiService.getAIJobs({
      search: filters.search || undefined,
      status: filters.status || undefined,
      modelType: filters.modelType || undefined,
      plantaId: filters.plantaId || undefined
    })
  });

  // Buscar plantas para o filtro
  const { data: plantas } = useQuery({
    queryKey: ['plantas-for-filter'],
    queryFn: () => apiService.getPlantas({ limit: 100 })
  });

  // Stats dos jobs
  const { data: aiStats } = useQuery({
    queryKey: ['ai-stats'],
    queryFn: () => apiService.getAIStats()
  });

  const handleFilterChange = (key: keyof AIJobFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      modelType: '',
      priority: '',
      plantaId: ''
    });
    setCurrentPage(1);
  };

  const getProgressPercentage = (job: AIJob) => {
    if (job.status === 'completed') return 100;
    if (job.status === 'running') return job.progress || 0;
    if (job.status === 'failed' || job.status === 'cancelled') return 0;
    return 0;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar jobs</h3>
          <p className="text-gray-600">Tente novamente em alguns instantes.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Jobs de IA</h1>
          <p className="text-gray-600">Monitore e gerencie processamentos de inteligência artificial</p>
        </div>
        <Link
          to="/ai-jobs/novo"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Job
        </Link>
      </div>

      {/* Stats Cards */}
      {aiStats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total de Jobs</p>
                <p className="text-2xl font-semibold text-gray-900">{aiStats.data.totalJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Concluídos</p>
                <p className="text-2xl font-semibold text-gray-900">{aiStats.data.completedJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-yellow-50">
                <Activity className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Em Execução</p>
                <p className="text-2xl font-semibold text-gray-900">{aiStats.data.runningJobs || 0}</p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-50">
                <Cpu className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Taxa de Sucesso</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {aiStats.data.successRate ? Math.round(aiStats.data.successRate * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="card-eventcad">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar jobs..."
                className="input-eventcad pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors",
              showFilters 
                ? "bg-eventcad-600 text-white border-eventcad-600" 
                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
            )}
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="input-eventcad"
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Model Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                <select
                  className="input-eventcad"
                  value={filters.modelType}
                  onChange={(e) => handleFilterChange('modelType', e.target.value)}
                >
                  <option value="">Todos os modelos</option>
                  {Object.entries(modelLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Priority Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  className="input-eventcad"
                  value={filters.priority}
                  onChange={(e) => handleFilterChange('priority', e.target.value)}
                >
                  <option value="">Todas</option>
                  {Object.entries(priorityLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Planta Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Planta</label>
                <select
                  className="input-eventcad"
                  value={filters.plantaId}
                  onChange={(e) => handleFilterChange('plantaId', e.target.value)}
                >
                  <option value="">Todas as plantas</option>
                  {plantas?.data?.data?.map((planta) => (
                    <option key={planta.id} value={planta.id}>{planta.nome}</option>
                  ))}
                </select>
              </div>

              {/* Clear Filters */}
              <div className="flex items-end">
                <button
                  onClick={clearFilters}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Limpar filtros
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {aiJobs && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {aiJobs.data?.total || 0} job(s) encontrado(s)
            </p>
          </div>

          {/* Jobs List */}
          {aiJobs.data?.data?.length === 0 ? (
            <div className="card-eventcad text-center py-12">
              <Bot className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum job encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status || filters.modelType 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro job de IA'
                }
              </p>
              {!filters.search && !filters.status && !filters.modelType && (
                <Link to="/ai-jobs/novo" className="btn-primary">
                  Criar Primeiro Job
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {aiJobs.data?.data?.map((job) => {
                const statusInfo = statusConfig[job.status];
                const StatusIcon = statusInfo.icon;
                const progress = getProgressPercentage(job);
                
                return (
                  <div key={job.id} className="card-eventcad hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {job.jobName}
                          </h3>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            statusInfo.color
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Bot className="h-4 w-4" />
                            <span>{modelLabels[job.modelType]}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(new Date(job.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              priorityColors[job.priority as keyof typeof priorityColors]
                            )}>
                              {priorityLabels[job.priority as keyof typeof priorityLabels]}
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        {(job.status === 'running' || job.status === 'completed') && (
                          <div className="mb-3">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>Progresso</span>
                              <span>{Math.round(progress)}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className={cn(
                                  "h-2 rounded-full transition-all duration-300",
                                  job.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
                                )}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        )}

                        {/* Results Summary */}
                        {job.results && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span>{job.results.objectsDetected || 0} objetos detectados</span>
                            <span>{job.results.processingTime || 0}s processamento</span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <Link
                          to={`/ai-jobs/${job.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                        
                        {job.status === 'pending' && (
                          <button className="flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
                            <Play className="h-4 w-4" />
                            Executar
                          </button>
                        )}

                        {job.status === 'running' && (
                          <button className="flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 bg-yellow-50 hover:bg-yellow-100 rounded-lg transition-colors">
                            <Pause className="h-4 w-4" />
                            Pausar
                          </button>
                        )}

                        {(job.status === 'pending' || job.status === 'running') && (
                          <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                            <Square className="h-4 w-4" />
                            Cancelar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {aiJobs.data?.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {currentPage} de {aiJobs.data?.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(aiJobs.data?.totalPages || 1, p + 1))}
                disabled={currentPage === aiJobs.data?.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}