import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  Activity,
  AlertTriangle,
  FileText,
  Eye,
  Download
} from 'lucide-react';
import { apiService } from '@/services/api';
import { EventStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const statusConfig = {
  planejamento: { label: 'Planejamento', color: 'bg-gray-100 text-gray-800', icon: Edit },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  em_execucao: { label: 'Em Execução', color: 'bg-blue-100 text-blue-800', icon: Activity },
  concluido: { label: 'Concluído', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelado: { label: 'Cancelado', color: 'bg-red-100 text-red-800', icon: XCircle }
} as const;

const tipoEventoLabels = {
  feira: 'Feira',
  congresso: 'Congresso',
  show: 'Show',
  esporte: 'Esporte',
  corporativo: 'Corporativo',
  cultural: 'Cultural'
} as const;

export function EventoDetalhesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const { data: evento, isLoading, error } = useQuery({
    queryKey: ['evento', id],
    queryFn: () => apiService.getEvento(id!).then(res => res.data),
    enabled: !!id
  });

  const { data: plantas } = useQuery({
    queryKey: ['plantas', id],
    queryFn: () => apiService.getPlantas({ eventoId: id }).then(res => res.data),
    enabled: !!id
  });

  const { data: aiJobs } = useQuery({
    queryKey: ['ai-jobs', id],
    queryFn: () => apiService.getAIJobs({ plantaId: id }).then(res => res.data),
    enabled: !!id
  });

  const deleteEventoMutation = useMutation({
    mutationFn: () => apiService.deleteEvento(id!),
    onSuccess: () => {
      toast.success('Evento excluído com sucesso!');
      navigate('/eventos');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao excluir evento');
    }
  });

  const updateStatusMutation = useMutation({
    mutationFn: (newStatus: EventStatus) => 
      apiService.updateEventoStatus(id!, newStatus),
    onSuccess: () => {
      toast.success('Status atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['evento', id] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar status');
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error || !evento) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Evento não encontrado</h3>
          <p className="text-gray-600 mb-4">O evento que você procura não existe ou foi removido.</p>
          <button
            onClick={() => navigate('/eventos')}
            className="btn-primary"
          >
            Voltar aos Eventos
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[evento.status];
  const StatusIcon = statusInfo.icon;

  const handleDeleteConfirm = () => {
    deleteEventoMutation.mutate();
    setShowDeleteModal(false);
  };

  const getStatusActions = (currentStatus: EventStatus) => {
    const actions: { label: string; status: EventStatus; variant: 'primary' | 'success' | 'danger' }[] = [];
    
    switch (currentStatus) {
      case EventStatus.PLANEJAMENTO:
        actions.push({ label: 'Enviar para Aprovação', status: EventStatus.PENDING_APPROVAL, variant: 'primary' });
        break;
      case EventStatus.PENDING_APPROVAL:
        actions.push(
          { label: 'Aprovar', status: EventStatus.APROVADO, variant: 'success' },
          { label: 'Rejeitar', status: EventStatus.CANCELADO, variant: 'danger' }
        );
        break;
      case EventStatus.APROVADO:
        actions.push({ label: 'Iniciar Execução', status: EventStatus.EM_EXECUCAO, variant: 'primary' });
        break;
      case EventStatus.EM_EXECUCAO:
        actions.push(
          { label: 'Finalizar Evento', status: EventStatus.CONCLUIDO, variant: 'success' },
          { label: 'Cancelar Evento', status: EventStatus.CANCELADO, variant: 'danger' }
        );
        break;
    }

    return actions;
  };

  const statusActions = getStatusActions(evento.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/eventos')}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{evento.nome}</h1>
            <div className="flex items-center gap-3 mt-1">
              <div className={cn(
                "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                statusInfo.color
              )}>
                <StatusIcon className="h-3 w-3" />
                {statusInfo.label}
              </div>
              <span className="badge-eventcad">
                {tipoEventoLabels[evento.tipo]}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {statusActions.map((action) => (
            <button
              key={action.status}
              onClick={() => updateStatusMutation.mutate(action.status)}
              disabled={updateStatusMutation.isPending}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                action.variant === 'primary' && "bg-eventcad-600 text-white hover:bg-eventcad-700",
                action.variant === 'success' && "bg-green-600 text-white hover:bg-green-700",
                action.variant === 'danger' && "bg-red-600 text-white hover:bg-red-700",
                updateStatusMutation.isPending && "opacity-50 cursor-not-allowed"
              )}
            >
              {action.label}
            </button>
          ))}
          
          <Link
            to={`/eventos/${id}/editar`}
            className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
          >
            <Edit className="h-5 w-5" />
          </Link>
          
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2 text-red-600 hover:text-red-900 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="xl:col-span-2 space-y-6">
          {/* Informações Básicas */}
          <div className="card-eventcad">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            
            {evento.descricao && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Descrição</h3>
                <p className="text-gray-900">{evento.descricao}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Data e Horário */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Data e Horário
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Início:</span>{' '}
                    {format(new Date(evento.dataInicio), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-medium">Fim:</span>{' '}
                    {format(new Date(evento.dataFim), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                  </div>
                  <div className="text-gray-600">
                    Duração: {Math.ceil((new Date(evento.dataFim).getTime() - new Date(evento.dataInicio).getTime()) / (1000 * 60 * 60 * 24))} dia(s)
                  </div>
                </div>
              </div>

              {/* Local */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Local
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="font-medium">{evento.local}</div>
                  {evento.endereco && (
                    <div className="text-gray-600">{evento.endereco}</div>
                  )}
                  {evento.area && (
                    <div className="text-gray-600">Área: {evento.area.toLocaleString()} m²</div>
                  )}
                </div>
              </div>

              {/* Capacidade */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Capacidade
                </h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Máxima:</span>{' '}
                    {evento.capacidadeMaxima?.toLocaleString()} pessoas
                  </div>
                  {evento.publicoEstimado && (
                    <div>
                      <span className="font-medium">Estimado:</span>{' '}
                      {evento.publicoEstimado.toLocaleString()} pessoas
                    </div>
                  )}
                  {evento.capacidadeMaxima && evento.publicoEstimado && (
                    <div className="text-gray-600">
                      Ocupação: {Math.round((evento.publicoEstimado / evento.capacidadeMaxima) * 100)}%
                    </div>
                  )}
                </div>
              </div>

              {/* Informações Adicionais */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Informações Adicionais</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Criado em:</span>{' '}
                    {format(new Date(evento.createdAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                  </div>
                  <div>
                    <span className="font-medium">Última atualização:</span>{' '}
                    {format(new Date(evento.updatedAt), 'dd/MM/yyyy - HH:mm', { locale: ptBR })}
                  </div>
                </div>
              </div>
            </div>

            {evento.observacoes && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Observações</h3>
                <p className="text-gray-900">{evento.observacoes}</p>
              </div>
            )}
          </div>

          {/* Plantas */}
          <div className="card-eventcad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Plantas ({plantas?.data?.length || 0})
              </h2>
              <Link
                to={`/plantas?eventoId=${id}`}
                className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
              >
                Ver todas
              </Link>
            </div>

            {plantas?.data?.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plantas.data.slice(0, 4).map((planta) => (
                  <div key={planta.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{planta.nome}</h4>
                      <span className="badge-secondary">
                        {planta.plantaTipo}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      Tamanho: {(planta.fileSize / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/plantas/${planta.id}`}
                        className="text-sm text-eventcad-600 hover:text-eventcad-700"
                      >
                        Visualizar
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Eye className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">Nenhuma planta adicionada</p>
                <Link
                  to={`/plantas/upload?eventoId=${id}`}
                  className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
                >
                  Adicionar primeira planta
                </Link>
              </div>
            )}
          </div>

          {/* Jobs de IA */}
          <div className="card-eventcad">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Processamento IA ({aiJobs?.data?.length || 0})
              </h2>
              <Link
                to={`/ai-jobs?eventoId=${id}`}
                className="text-sm text-eventcad-600 hover:text-eventcad-700 font-medium"
              >
                Ver todos
              </Link>
            </div>

            {aiJobs?.data?.length ? (
              <div className="space-y-3">
                {aiJobs.data.slice(0, 3).map((job) => (
                  <div key={job.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">{job.jobName}</h4>
                      <p className="text-sm text-gray-600">
                        Modelo: {job.modelType} • Prioridade: {job.priority}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className={cn(
                        "inline-block px-2 py-1 rounded-full text-xs font-medium",
                        job.status === 'completed' && "bg-green-100 text-green-800",
                        job.status === 'running' && "bg-blue-100 text-blue-800",
                        job.status === 'pending' && "bg-yellow-100 text-yellow-800",
                        job.status === 'failed' && "bg-red-100 text-red-800"
                      )}>
                        {job.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Activity className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                <p className="text-gray-600">Nenhum processamento IA</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <Link
                to={`/plantas?eventoId=${id}`}
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5" />
                <span>Gerenciar Plantas</span>
              </Link>
              <Link
                to={`/infra-objects?eventoId=${id}`}
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Eye className="h-5 w-5" />
                <span>Objetos de Infraestrutura</span>
              </Link>
              <Link
                to={`/ai-jobs?eventoId=${id}`}
                className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <Activity className="h-5 w-5" />
                <span>Processamento IA</span>
              </Link>
              <button className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full text-left">
                <FileText className="h-5 w-5" />
                <span>Gerar Relatório</span>
              </button>
              <button className="flex items-center gap-3 p-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors w-full text-left">
                <Download className="h-5 w-5" />
                <span>Download</span>
              </button>
            </div>
          </div>

          {/* Timeline de Status */}
          <div className="card-eventcad">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Progresso do Evento</h3>
            <div className="space-y-3">
              {[
                { status: 'draft', label: 'Rascunho' },
                { status: 'pending_approval', label: 'Aguardando Aprovação' },
                { status: 'approved', label: 'Aprovado' },
                { status: 'preparing', label: 'Preparando' },
                { status: 'ready', label: 'Pronto' },
                { status: 'ongoing', label: 'Em Andamento' },
                { status: 'completed', label: 'Concluído' }
              ].map((step, index) => {
                const isCurrent = step.status === evento.status;
                const isPassed = Object.keys(statusConfig).indexOf(evento.status) > index;
                
                return (
                  <div key={step.status} className="flex items-center gap-3">
                    <div className={cn(
                      "w-3 h-3 rounded-full",
                      isCurrent && "bg-eventcad-500",
                      isPassed && "bg-green-500",
                      !isCurrent && !isPassed && "bg-gray-300"
                    )} />
                    <span className={cn(
                      "text-sm",
                      isCurrent && "font-medium text-eventcad-700",
                      isPassed && "text-green-700",
                      !isCurrent && !isPassed && "text-gray-500"
                    )}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Excluir Evento</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja excluir este evento? Esta ação não pode ser desfeita.
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
                disabled={deleteEventoMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50"
              >
                {deleteEventoMutation.isPending ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}