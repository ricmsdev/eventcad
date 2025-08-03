import { useQuery } from '@tanstack/react-query';
import { 
  Calendar, 
  FileText, 
  Settings, 
  Zap, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { apiService } from '@/services/api';
import { EventStatus } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function DashboardPage() {
  // Buscar estatísticas do dashboard
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => apiService.getDashboardStats().then(res => res.data),
  });

  // Buscar próximos eventos
  const { data: proximosEventos, isLoading: eventosLoading } = useQuery({
    queryKey: ['proximos-eventos'],
    queryFn: () => apiService.getEventos({ 
      limit: 5, 
      status: 'approved' as EventStatus,
      sortBy: 'dataInicio',
      sortOrder: 'asc'
    }).then(res => res.data.data),
  });

  // Buscar eventos que precisam de atenção
  const { data: eventosAtencao, isLoading: atencaoLoading } = useQuery({
    queryKey: ['eventos-atencao'],
    queryFn: () => apiService.getEventos({ 
      limit: 5, 
      status: 'awaiting_approval' as EventStatus
    }).then(res => res.data.data),
  });

  if (statsLoading || eventosLoading || atencaoLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const statCards = [
    {
      name: 'Total de Eventos',
      value: stats?.totalEventos || 0,
      icon: Calendar,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Eventos Ativos',
      value: stats?.eventosAtivos || 0,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Plantas',
      value: stats?.totalPlantas || 0,
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      name: 'Objetos de Infraestrutura',
      value: stats?.totalObjetos || 0,
      icon: Settings,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      name: 'Jobs de IA',
      value: stats?.jobsIA || 0,
      icon: Zap,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
    {
      name: 'Jobs Concluídos',
      value: stats?.jobsConcluidos || 0,
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">
          Visão geral do EventCAD+ - {format(new Date(), "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
        </p>
      </div>

      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {statCards.map((stat) => (
          <div key={stat.name} className="card-eventcad">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Seção de eventos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Próximos eventos */}
        <div className="card-eventcad">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Próximos Eventos</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {proximosEventos && proximosEventos.length > 0 ? (
              proximosEventos.slice(0, 5).map((evento) => (
                <div key={evento.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{evento.nome}</p>
                    <p className="text-sm text-gray-500">
                      {format(new Date(evento.dataInicio), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    evento.status === EventStatus.APPROVED ? 'bg-green-100 text-green-800' :
                    evento.status === EventStatus.PLANNING ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {evento.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum evento próximo</p>
            )}
          </div>
        </div>

        {/* Eventos que precisam de atenção */}
        <div className="card-eventcad">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Eventos com Atenção</h3>
            <AlertTriangle className="h-5 w-5 text-warning-500" />
          </div>
          <div className="space-y-3">
            {eventosAtencao && eventosAtencao.length > 0 ? (
              eventosAtencao.slice(0, 5).map((evento) => (
                <div key={evento.id} className="flex items-center justify-between p-3 bg-warning-50 rounded-lg border border-warning-200">
                  <div>
                    <p className="font-medium text-gray-900">{evento.nome}</p>
                    <p className="text-sm text-warning-700">
                      {evento.publicoEsperado} pessoas estimadas
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-warning-100 text-warning-800">
                    Atenção
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">Nenhum evento precisa de atenção</p>
            )}
          </div>
        </div>
      </div>

      {/* Seção de atividades recentes */}
      <div className="card-eventcad">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Atividades Recentes</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-eventcad-100 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-eventcad-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Nova planta carregada</p>
              <p className="text-sm text-gray-500">Planta baixa do evento "Feira Tecnológica 2024"</p>
            </div>
            <span className="text-xs text-gray-400">2h atrás</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Objeto aprovado</p>
              <p className="text-sm text-gray-500">Extintor PQS 001 foi aprovado automaticamente</p>
            </div>
            <span className="text-xs text-gray-400">4h atrás</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                <Zap className="h-4 w-4 text-purple-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Job de IA iniciado</p>
              <p className="text-sm text-gray-500">Análise de segurança contra incêndio em andamento</p>
            </div>
            <span className="text-xs text-gray-400">6h atrás</span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="h-4 w-4 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Novo usuário registrado</p>
              <p className="text-sm text-gray-500">João Silva foi adicionado como Técnico</p>
            </div>
            <span className="text-xs text-gray-400">1 dia atrás</span>
          </div>
        </div>
      </div>

      {/* Seção de métricas de qualidade */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-eventcad">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Taxa de Aprovação</h4>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-gray-900">
              {stats?.objetosAprovados && stats?.totalObjetos 
                ? Math.round((stats.objetosAprovados / stats.totalObjetos) * 100)
                : 0}%
            </span>
            <span className="ml-2 text-sm text-gray-500">dos objetos</span>
          </div>
        </div>

        <div className="card-eventcad">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Objetos Pendentes</h4>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-warning-600">
              {stats?.objetosPendentes || 0}
            </span>
            <span className="ml-2 text-sm text-gray-500">aguardando revisão</span>
          </div>
        </div>

        <div className="card-eventcad">
          <h4 className="text-sm font-medium text-gray-500 mb-2">Eficiência da IA</h4>
          <div className="flex items-baseline">
            <span className="text-2xl font-semibold text-emerald-600">
              {stats?.jobsConcluidos && stats?.jobsIA 
                ? Math.round((stats.jobsConcluidos / stats.jobsIA) * 100)
                : 0}%
            </span>
            <span className="ml-2 text-sm text-gray-500">de sucesso</span>
          </div>
        </div>
      </div>
    </div>
  );
} 