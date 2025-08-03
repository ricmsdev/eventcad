import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Calendar, 
  MapPin, 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
  Sparkles,
  TrendingUp,
  Zap
} from 'lucide-react';
import { apiService } from '@/services/api';
import { EventStatus, EventoTipo } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
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

interface EventosFilters {
  search: string;
  status: EventStatus | '';
  tipo: EventoTipo | '';
  dataInicio: string;
  dataFim: string;
}

export function EventosPage() {
  const [filters, setFilters] = useState<EventosFilters>({
    search: '',
    status: '',
    tipo: '',
    dataInicio: '',
    dataFim: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: eventos, isLoading, error } = useQuery({
    queryKey: ['eventos', filters, currentPage],
    queryFn: () => apiService.getEventos({
      page: currentPage,
      limit: 10,
      search: filters.search || undefined,
      status: filters.status || undefined,
      tipo: filters.tipo || undefined,
      dataInicio: filters.dataInicio || undefined,
      dataFim: filters.dataFim || undefined
    }).then(res => res.data)
  });

  const handleFilterChange = (key: keyof EventosFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1); // Reset para primeira página
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      tipo: '',
      dataInicio: '',
      dataFim: ''
    });
    setCurrentPage(1);
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
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar eventos</h3>
          <p className="text-gray-600">Tente novamente em alguns instantes.</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header Animado */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        className="bg-gradient-to-r from-eventcad-600 to-eventcad-700 rounded-xl p-6 text-white shadow-lg"
      >
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="p-2 bg-white/20 rounded-lg"
            >
              <Calendar className="h-8 w-8" />
            </motion.div>
            <div>
              <h1 className="text-3xl font-bold">Eventos</h1>
              <p className="text-eventcad-100">Gerencie todos os seus eventos com tecnologia avançada</p>
            </div>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <Link
              to="/eventos/novo"
              className="bg-white text-eventcad-600 hover:bg-eventcad-50 font-semibold px-6 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="h-5 w-5" />
              Novo Evento
            </Link>
          </motion.div>
        </div>
        
        {/* Stats Cards */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6"
        >
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-eventcad-200" />
              <div>
                <p className="text-eventcad-200 text-sm">Total de Eventos</p>
                <p className="text-2xl font-bold">{eventos?.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Zap className="h-6 w-6 text-eventcad-200" />
              <div>
                <p className="text-eventcad-200 text-sm">Em Execução</p>
                <p className="text-2xl font-bold">{eventos?.data?.filter(e => e.status === 'em_execucao').length || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
            <div className="flex items-center gap-3">
              <Sparkles className="h-6 w-6 text-eventcad-200" />
              <div>
                <p className="text-eventcad-200 text-sm">Aprovados</p>
                <p className="text-2xl font-bold">{eventos?.data?.filter(e => e.status === 'approved').length || 0}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Search and Filters */}
      <div className="card-eventcad">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar eventos..."
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

              {/* Tipo Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="input-eventcad"
                  value={filters.tipo}
                  onChange={(e) => handleFilterChange('tipo', e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(tipoEventoLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Data Início */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
                <input
                  type="date"
                  className="input-eventcad"
                  value={filters.dataInicio}
                  onChange={(e) => handleFilterChange('dataInicio', e.target.value)}
                />
              </div>

              {/* Data Fim */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
                <input
                  type="date"
                  className="input-eventcad"
                  value={filters.dataFim}
                  onChange={(e) => handleFilterChange('dataFim', e.target.value)}
                />
              </div>
            </div>

            {/* Clear Filters */}
            <div className="mt-4 flex justify-end">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                Limpar filtros
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {eventos && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {eventos.total} evento(s) encontrado(s)
            </p>
          </div>

          {/* Events List */}
          {eventos.data.length === 0 ? (
            <div className="card-eventcad text-center py-12">
              <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status || filters.tipo 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro evento'
                }
              </p>
              {!filters.search && !filters.status && !filters.tipo && (
                <Link to="/eventos/novo" className="btn-primary">
                  Criar Primeiro Evento
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {eventos.data.map((evento) => {
                const statusInfo = statusConfig[evento.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={evento.id} className="card-eventcad hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {evento.nome}
                          </h3>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            statusInfo.color
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </div>
                        </div>

                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {evento.descricao || 'Sem descrição'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(new Date(evento.dataInicio), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                          
                          {evento.local && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <MapPin className="h-4 w-4" />
                              <span className="line-clamp-1">{evento.local}</span>
                            </div>
                          )}
                          
                          {evento.capacidadeMaxima && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Users className="h-4 w-4" />
                              <span>{evento.capacidadeMaxima.toLocaleString()} pessoas</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="badge-eventcad">
                            {tipoEventoLabels[evento.tipo]}
                          </span>
                          {evento.publicoEstimado && (
                            <span className="text-xs text-gray-500">
                              ~{evento.publicoEstimado.toLocaleString()} participantes
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <Link
                          to={`/eventos/${evento.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                        <Link
                          to={`/eventos/${evento.id}/editar`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-eventcad-700 bg-eventcad-50 hover:bg-eventcad-100 rounded-lg transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                          Editar
                        </Link>
                        <button className="flex items-center gap-2 px-3 py-2 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
                          <Trash2 className="h-4 w-4" />
                          Excluir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {eventos.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {currentPage} de {eventos.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(eventos.totalPages, p + 1))}
                disabled={currentPage === eventos.totalPages}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Próxima
              </button>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}