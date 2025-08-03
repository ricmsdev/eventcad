import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Edit, 
  Trash2,
  Package,
  MapPin,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  Settings,
  Activity,
  FileText,
  Zap,
  Eye,

} from 'lucide-react';
import { apiService } from '@/services/api';
import { ObjectStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: Edit },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  pending_review: { label: 'Em Revisão', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
  installed: { label: 'Instalado', color: 'bg-blue-100 text-blue-800', icon: Settings },
  needs_review: { label: 'Precisa Revisão', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  needs_revision: { label: 'Precisa Revisão', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  conflicted: { label: 'Em Conflito', color: 'bg-red-100 text-red-800', icon: XCircle },
  outdated: { label: 'Desatualizado', color: 'bg-gray-100 text-gray-800', icon: Clock }
} as const;

const categoryLabels = {
  fire_safety: 'Segurança contra Incêndio',
  electrical: 'Elétrico',
  plumbing: 'Hidráulico',
  accessibility: 'Acessibilidade',
  architectural: 'Arquitetônico',
  ARCHITECTURAL: 'Arquitetônico',
  FIRE_SAFETY: 'Segurança contra Incêndio',
  ELECTRICAL: 'Elétrico',
  PLUMBING: 'Hidráulico',
  ACCESSIBILITY: 'Acessibilidade',
  FURNITURE: 'Mobiliário',
  ANNOTATIONS: 'Anotações',
  furniture: 'Mobiliário',
  annotations: 'Anotações'
} as const;

const criticalityLabels = {
  none: 'Nenhum',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico'
} as const;

const criticalityColors = {
  none: 'bg-gray-50 text-gray-600',
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
} as const;

export function InfraObjectDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: objeto, isLoading, error } = useQuery({
    queryKey: ['infra-object', id],
    queryFn: () => apiService.getInfraObject(id!),
    enabled: !!id
  });

  const { data: planta } = useQuery({
    queryKey: ['planta', objeto?.data?.plantaId],
    queryFn: () => apiService.getPlanta(objeto!.data.plantaId),
    enabled: !!objeto?.data?.plantaId
  });

  const { data: history } = useQuery({
    queryKey: ['infra-object-history', id],
    queryFn: () => apiService.getInfraObjectHistory(id!),
    enabled: !!id
  });

  const deleteObjectMutation = useMutation({
    mutationFn: () => apiService.deleteInfraObject(id!),
    onSuccess: () => {
      toast.success('Objeto excluído com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['infra-objects'] });
      navigate('/infra-objects');
    },
    onError: () => {
      toast.error('Erro ao excluir objeto');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: ObjectStatus) => 
      apiService.updateInfraObject(id!, { status: newStatus }),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['infra-object', id] });
    },
    onError: () => {
      toast.error('Erro ao atualizar status');
    }
  });

  const handleDelete = () => {
    deleteObjectMutation.mutate();
    setShowDeleteModal(false);
  };

  const handleStatusChange = (newStatus: ObjectStatus) => {
    updateStatusMutation.mutate(newStatus);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !objeto?.data) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Objeto não encontrado</h3>
          <p className="text-gray-600 mb-4">O objeto solicitado não existe ou foi removido.</p>
          <Link to="/infra-objects" className="btn-primary">
            Voltar para Objetos
          </Link>
        </div>
      </div>
    );
  }

  const infraObject = objeto.data;
  const statusInfo = statusConfig[infraObject.status];
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/infra-objects"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{infraObject.name}</h1>
            <p className="text-gray-600">Detalhes do objeto de infraestrutura</p>
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

          <Link
            to={`/infra-objects/${id}/editar`}
            className="flex items-center gap-2 px-3 py-2 text-sm text-eventcad-700 bg-eventcad-50 hover:bg-eventcad-100 rounded-lg transition-colors"
          >
            <Edit className="h-4 w-4" />
            Editar
          </Link>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informações Principais */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dados Básicos */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="h-5 w-5" />
              Informações Básicas
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Nome</label>
                <p className="text-gray-900">{infraObject.name}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Categoria</label>
                <p className="text-gray-900">{categoryLabels[infraObject.objectCategory]}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Tipo</label>
                <p className="text-gray-900">{infraObject.objectType.replace(/_/g, ' ')}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Criticidade</label>
                <span className={cn(
                  "inline-flex items-center px-2 py-1 rounded-full text-xs font-medium",
                  criticalityColors[infraObject.criticality]
                )}>
                  {criticalityLabels[infraObject.criticality]}
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Planta</label>
                <p className="text-gray-900">{planta?.data?.nome || 'Carregando...'}</p>
              </div>

              {infraObject.confidence && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Confiança da IA</label>
                  <p className="text-gray-900">{Math.round(infraObject.confidence * 100)}%</p>
                </div>
              )}

              {infraObject.description && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-500 mb-1">Descrição</label>
                  <p className="text-gray-900">{infraObject.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Posição e Dimensões */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Posição e Dimensões
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Posição X</label>
                <p className="text-gray-900">{infraObject.position?.x?.toFixed(2) || 'N/A'}</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-500 mb-1">Posição Y</label>
                <p className="text-gray-900">{infraObject.position?.y?.toFixed(2) || 'N/A'}</p>
              </div>

              {infraObject.position?.z !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Posição Z</label>
                  <p className="text-gray-900">{infraObject.position.z.toFixed(2)}</p>
                </div>
              )}

              {infraObject.dimensions?.width && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Largura</label>
                  <p className="text-gray-900">{infraObject.dimensions.width.toFixed(2)}</p>
                </div>
              )}

              {infraObject.dimensions?.height && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Altura</label>
                  <p className="text-gray-900">{infraObject.dimensions.height.toFixed(2)}</p>
                </div>
              )}

              {infraObject.dimensions?.depth && (
                <div>
                  <label className="block text-sm font-medium text-gray-500 mb-1">Profundidade</label>
                  <p className="text-gray-900">{infraObject.dimensions.depth.toFixed(2)}</p>
                </div>
              )}
            </div>
          </div>

          {/* Histórico de Alterações */}
          {history?.data && history.data.length > 0 && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Histórico de Alterações
              </h3>

              <div className="space-y-4">
                {history.data.slice(0, 5).map((entry: any, index: number) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-eventcad-100 rounded-full flex items-center justify-center">
                      <Activity className="h-4 w-4 text-eventcad-600" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{entry.action}</p>
                      <p className="text-sm text-gray-600">{entry.description}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(entry.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
              {infraObject.status === 'pending_approval' && (
                <>
                  <button
                    onClick={() => handleStatusChange('approved' as ObjectStatus)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-green-700 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Aprovar
                  </button>
                  <button
                    onClick={() => handleStatusChange('rejected' as ObjectStatus)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Rejeitar
                  </button>
                </>
              )}

              {infraObject.status === 'approved' && (
                <button
                  onClick={() => handleStatusChange('installed' as ObjectStatus)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  Marcar como Instalado
                </button>
              )}

              <Link
                to={`/plantas/${infraObject.plantaId}`}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Eye className="h-4 w-4" />
                Ver na Planta
              </Link>
            </div>
          </div>

          {/* Metadados */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-500" />
              Metadados
            </h4>

            <div className="space-y-3 text-sm">
              <div>
                <span className="text-gray-500">ID:</span>
                <span className="ml-2 text-gray-900 font-mono">{infraObject.id}</span>
              </div>
              <div>
                <span className="text-gray-500">Criado em:</span>
                <span className="ml-2 text-gray-900">
                  {format(new Date(infraObject.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
              <div>
                <span className="text-gray-500">Atualizado em:</span>
                <span className="ml-2 text-gray-900">
                  {format(new Date(infraObject.updatedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </span>
              </div>
            </div>
          </div>

          {/* Conformidade */}
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-500" />
              Status de Conformidade
            </h4>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Posicionamento</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Conforme
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Documentação</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                  Pendente
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Instalação</span>
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  N/A
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação de Exclusão */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita.</p>
              </div>
            </div>

            <p className="text-gray-700 mb-6">
              Tem certeza que deseja excluir o objeto "<strong>{infraObject.name}</strong>"?
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteObjectMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteObjectMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}