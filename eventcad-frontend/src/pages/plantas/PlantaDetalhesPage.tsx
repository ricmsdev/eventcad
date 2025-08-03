import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft,
  Download,
  Trash2,
  Brain,
  Eye,
  Edit,
  FileText,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,

  Target,
  BarChart3,
  Image as ImageIcon,
  Maximize,

  X
} from 'lucide-react';
import { apiService } from '@/services/api';

import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import toast from 'react-hot-toast';

const plantaTipoLabels = {
  planta_baixa: 'Planta Baixa',
  planta_cobertura: 'Planta de Cobertura',
  planta_situacao: 'Planta de Situação',
  planta_localizacao: 'Planta de Localização',
  corte_longitudinal: 'Corte Longitudinal',
  corte_transversal: 'Corte Transversal',
  fachada_principal: 'Fachada Principal',
  fachada_lateral: 'Fachada Lateral',
  detalhamento: 'Detalhamento',
  instalacoes_eletricas: 'Instalações Elétricas',
  instalacoes_hidraulicas: 'Instalações Hidráulicas',
  instalacoes_ar_condicionado: 'Ar Condicionado',
  layout_mobiliario: 'Layout Mobiliário',
  planta_decoracao: 'Planta Decoração',
  planta_paisagismo: 'Paisagismo',
  outros: 'Outros'
} as const;

const statusProcessamento = {
  pending: { label: 'Aguardando', color: 'bg-gray-100 text-gray-800', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800', icon: Brain },
  completed: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: AlertCircle }
} as const;

export function PlantaDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>('todos');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const { data: planta, isLoading, error } = useQuery({
    queryKey: ['planta', id],
    queryFn: () => apiService.getPlanta(id!).then(res => res.data),
    enabled: !!id
  });

  const { data: objetosDetectados } = useQuery({
    queryKey: ['objetos-detectados', id],
    queryFn: () => apiService.getInfraObjects({ plantaId: id }).then(res => res.data.data),
    enabled: !!id && planta?.processamentoStatus === 'completed'
  });

  const { data: aiJobs } = useQuery({
    queryKey: ['ai-jobs-planta', id],
    queryFn: () => apiService.getAIJobs({ plantaId: id }).then(res => res.data.data),
    enabled: !!id
  });

  const deletePlantaMutation = useMutation({
    mutationFn: () => apiService.deletePlanta(id!),
    onSuccess: () => {
      toast.success('Planta excluída com sucesso!');
      navigate('/plantas');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir planta');
    }
  });

  const processarIAMutation = useMutation({
    mutationFn: () => apiService.processPlantaAI(id!),
    onSuccess: () => {
      toast.success('Processamento IA iniciado!');
      queryClient.invalidateQueries({ queryKey: ['planta', id] });
      queryClient.invalidateQueries({ queryKey: ['ai-jobs-planta', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao iniciar processamento');
    }
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !planta) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Planta não encontrada</h3>
          <p className="text-gray-600 mb-4">A planta que você procura não existe ou foi removida.</p>
          <button
            onClick={() => navigate('/plantas')}
            className="btn-primary"
          >
            Voltar às Plantas
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusProcessamento[planta.processamentoStatus || 'pending'];
  const StatusIcon = statusInfo.icon;

  const objetosFiltrados = objetosDetectados?.filter(objeto => {
    if (selectedFilter === 'todos') return true;
    return objeto.objectCategory === selectedFilter;
  }) || [];

  const categorias = [...new Set(objetosDetectados?.map(obj => obj.objectCategory) || [])];

    const estatisticas = {
    totalObjetos: objetosDetectados?.length || 0,
    objetosAprovados: objetosDetectados?.filter(obj => obj.status === 'approved').length || 0,
    objetosPendentes: objetosDetectados?.filter(obj => obj.status === 'pending_review').length || 0,
    confianciaMedia: objetosDetectados?.length
      ? Math.round(objetosDetectados.reduce((acc, obj) => acc + (obj.confidence || 0), 0) / objetosDetectados.length * 100)
      : 0
  };

  const handleDeleteConfirm = () => {
    deletePlantaMutation.mutate();
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/plantas')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{planta.nome}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                statusInfo.color
              )}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </div>
              <span className="badge-eventcad">
                {plantaTipoLabels[planta.plantaTipo]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(planta.processamentoStatus === 'pending' || planta.processamentoStatus === 'failed') && (
            <button
              onClick={() => processarIAMutation.mutate()}
              disabled={processarIAMutation.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <Play className="h-4 w-4" />
              {processarIAMutation.isPending ? 'Iniciando...' : 'Processar IA'}
            </button>
          )}
          
          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-blue-50 transition-colors">
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => navigate(`/plantas/${id}/editor`)}
            className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-green-50 transition-colors"
            title="Abrir Editor"
          >
            <Edit className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Visualização da Planta */}
          <div className="card-eventcad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Visualização</h2>
              <button
                onClick={() => setIsImageModalOpen(true)}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                <Maximize className="h-4 w-4" />
                Expandir
              </button>
            </div>

            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden">
              {planta.imageUrl || planta.thumbnailUrl ? (
                <img 
                  src={planta.imageUrl || planta.thumbnailUrl} 
                  alt={planta.nome}
                  className="w-full h-full object-contain cursor-pointer"
                  onClick={() => setIsImageModalOpen(true)}
                />
              ) : (
                <div className="text-center text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3" />
                  <p className="text-lg font-medium">Visualização não disponível</p>
                  <p className="text-sm">{planta.fileName}</p>
                </div>
              )}
            </div>
          </div>

          {/* Objetos Detectados */}
          {planta.processamentoStatus === 'completed' && (
            <div className="card-eventcad">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Objetos Detectados ({estatisticas.totalObjetos})
                </h2>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="text-sm border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="todos">Todas as categorias</option>
                    {categorias.map((categoria) => (
                      <option key={categoria} value={categoria}>
                        {categoria.replace('_', ' ').toUpperCase()}
                      </option>
                    ))}
                  </select>
                  <Link
                    to={`/infra-objects?plantaId=${id}`}
                    className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
                  >
                    Ver todos
                  </Link>
                </div>
              </div>

              {objetosFiltrados.length === 0 ? (
                <div className="text-center py-8">
                  <Target className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                  <p className="text-gray-600">
                    {selectedFilter === 'todos' 
                      ? 'Nenhum objeto detectado' 
                      : `Nenhum objeto da categoria ${selectedFilter}`
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {objetosFiltrados.slice(0, 5).map((objeto) => (
                    <div key={objeto.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-eventcad-100 rounded-lg">
                          <Target className="h-4 w-4 text-eventcad-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{objeto.name}</h4>
                          <p className="text-sm text-gray-600">
                            {objeto.objectType.replace('_', ' ')} • Confiança: {Math.round((objeto.confidence || 0) * 100)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={cn(
                          "inline-block px-2 py-1 rounded-full text-xs font-medium",
                          objeto.status === 'approved' && "bg-green-100 text-green-800",
                          objeto.status === 'pending_review' && "bg-yellow-100 text-yellow-800",
                          objeto.status === 'rejected' && "bg-red-100 text-red-800"
                        )}>
                          {objeto.status === 'approved' && 'Aprovado'}
                          {objeto.status === 'pending_review' && 'Pendente'}
                          {objeto.status === 'rejected' && 'Rejeitado'}
                        </div>
                        <Link
                          to={`/infra-objects/${objeto.id}`}
                          className="p-1 text-gray-400 hover:text-eventcad-600 rounded transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                      </div>
                    </div>
                  ))}
                  
                  {objetosFiltrados.length > 5 && (
                    <div className="text-center pt-3">
                      <Link
                        to={`/infra-objects?plantaId=${id}`}
                        className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
                      >
                        Ver mais {objetosFiltrados.length - 5} objetos
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Jobs de IA */}
          <div className="card-eventcad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Processamento IA
              </h2>
              <Link
                to={`/ai-jobs?plantaId=${id}`}
                className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
              >
                Ver histórico
              </Link>
            </div>

            {aiJobs?.length ? (
              <div className="space-y-3">
                {aiJobs.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Brain className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{job.jobName}</h4>
                        <p className="text-sm text-gray-600">
                          Modelo: {job.modelType} • Prioridade: {job.priority}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "inline-block px-2 py-1 rounded-full text-xs font-medium mb-1",
                        job.status === 'completed' && "bg-green-100 text-green-800",
                        job.status === 'running' && "bg-blue-100 text-blue-800",
                        job.status === 'pending' && "bg-yellow-100 text-yellow-800",
                        job.status === 'failed' && "bg-red-100 text-red-800"
                      )}>
                        {job.status}
                      </div>
                      <p className="text-xs text-gray-500">
                        {format(new Date(job.createdAt), 'dd/MM HH:mm', { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Brain className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600 mb-4">Nenhum processamento IA executado</p>
                <button
                  onClick={() => processarIAMutation.mutate()}
                  disabled={processarIAMutation.isPending}
                  className="btn-primary"
                >
                  Iniciar Processamento
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Informações da Planta */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informações</h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Arquivo</h4>
                <p className="text-sm text-gray-900">{planta.fileName}</p>
                <p className="text-xs text-gray-600">{formatFileSize(planta.fileSize)}</p>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Tipo</h4>
                <p className="text-sm text-gray-900">{plantaTipoLabels[planta.plantaTipo]}</p>
              </div>

              {planta.descricao && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Descrição</h4>
                  <p className="text-sm text-gray-900">{planta.descricao}</p>
                </div>
              )}

              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Upload</h4>
                <p className="text-sm text-gray-900">
                  {format(new Date(planta.createdAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                </p>
              </div>

              {planta.processamentoStatus === 'completed' && planta.processedAt && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-1">Processado em</h4>
                  <p className="text-sm text-gray-900">
                    {format(new Date(planta.processedAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Estatísticas */}
          {planta.processamentoStatus === 'completed' && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Estatísticas
              </h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total de Objetos</span>
                  <span className="font-semibold text-gray-900">{estatisticas.totalObjetos}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Aprovados</span>
                  <span className="font-semibold text-green-600">{estatisticas.objetosAprovados}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Pendentes</span>
                  <span className="font-semibold text-yellow-600">{estatisticas.objetosPendentes}</span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Confiança Média</span>
                  <span className="font-semibold text-blue-600">{estatisticas.confianciaMedia}%</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Taxa de Aprovação</span>
                    <span className="font-semibold text-gray-900">
                      {estatisticas.totalObjetos > 0 
                        ? Math.round((estatisticas.objetosAprovados / estatisticas.totalObjetos) * 100)
                        : 0
                      }%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-500 h-2 rounded-full"
                      style={{ 
                        width: `${estatisticas.totalObjetos > 0 
                          ? (estatisticas.objetosAprovados / estatisticas.totalObjetos) * 100
                          : 0
                        }%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Ações Rápidas */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <button className="flex items-center gap-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <Download className="h-5 w-5" />
                <span>Baixar Arquivo Original</span>
              </button>
              
              {planta.processamentoStatus === 'completed' && (
                <Link
                  to={`/infra-objects?plantaId=${id}`}
                  className="flex items-center gap-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
                >
                  <Target className="h-5 w-5" />
                  <span>Gerenciar Objetos</span>
                </Link>
              )}
              
              <button className="flex items-center gap-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <ImageIcon className="h-5 w-5" />
                <span>Gerar Versão Anotada</span>
              </button>
              
              <button className="flex items-center gap-3 w-full p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors text-left">
                <BarChart3 className="h-5 w-5" />
                <span>Relatório Completo</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {isImageModalOpen && (planta.imageUrl || planta.thumbnailUrl) && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
          onClick={() => setIsImageModalOpen(false)}
        >
          <div className="relative max-w-full max-h-full">
            <img 
              src={planta.imageUrl || planta.thumbnailUrl} 
              alt={planta.nome}
              className="max-w-full max-h-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Planta</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir esta planta? Todos os objetos detectados também serão removidos. 
              Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={deletePlantaMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deletePlantaMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}