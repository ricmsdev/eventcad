import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Edit,
  Trash2,
  XCircle,
  Plus,
  Search,
  Filter,
  Package,
  MapPin,
  Eye
} from 'lucide-react';
import { apiService } from '@/services/api';
import { ObjectStatus, ObjectCategory, CriticalityLevel } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

const statusConfig = {
  pending_review: { label: 'Pendente Revisão', color: 'bg-gray-100 text-gray-800', icon: Edit },
  pending_approval: { label: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  approved: { label: 'Aprovado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  rejected: { label: 'Rejeitado', color: 'bg-red-100 text-red-800', icon: XCircle },
  needs_revision: { label: 'Precisa Revisão', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle }
} as const;

const categoryLabels = {
  ARCHITECTURAL: 'Arquitetônico',
  FIRE_SAFETY: 'Segurança contra Incêndio',
  ELECTRICAL: 'Elétrico',
  PLUMBING: 'Hidráulico',
  ACCESSIBILITY: 'Acessibilidade',
  FURNITURE: 'Mobiliário',
  ANNOTATIONS: 'Anotações'
} as const;

const criticalityLabels = {
  none: 'Nenhum',
  low: 'Baixo',
  medium: 'Médio',
  high: 'Alto',
  critical: 'Crítico'
} as const;

const criticalityColors = {
  none: 'bg-gray-100 text-gray-800',
  low: 'bg-gray-100 text-gray-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-orange-100 text-orange-800',
  critical: 'bg-red-100 text-red-800'
} as const;

interface InfraObjectFilters {
  search: string;
  status: ObjectStatus | '';
  category: ObjectCategory | '';
  criticality: CriticalityLevel | '';
  plantaId: string;
}

export function InfraObjectsPage() {
  const [filters, setFilters] = useState<InfraObjectFilters>({
    search: '',
    status: '',
    category: '',
    criticality: '',
    plantaId: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const { data: infraObjects, isLoading, error } = useQuery({
    queryKey: ['infra-objects', filters, currentPage],
    queryFn: () => apiService.getInfraObjects({
      search: filters.search || undefined,
      status: filters.status || undefined,
      objectCategory: filters.category || undefined,
      criticality: filters.criticality || undefined,
      plantaId: filters.plantaId || undefined
    }).then(res => res.data)
  });

  // Buscar plantas para o filtro
  const { data: plantas } = useQuery({
    queryKey: ['plantas-for-filter'],
    queryFn: () => apiService.getPlantas({ limit: 100 })
  });

  const handleFilterChange = (key: keyof InfraObjectFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: '',
      category: '',
      criticality: '',
      plantaId: ''
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
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar objetos</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Objetos de Infraestrutura</h1>
          <p className="text-gray-600">Gerencie objetos detectados nas plantas baixas</p>
        </div>
        <Link
          to="/infra-objects/novo"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Novo Objeto
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="card-eventcad">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar objetos..."
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

              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
                <select
                  className="input-eventcad"
                  value={filters.category}
                  onChange={(e) => handleFilterChange('category', e.target.value)}
                >
                  <option value="">Todas as categorias</option>
                  {Object.entries(categoryLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Criticality Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Criticidade</label>
                <select
                  className="input-eventcad"
                  value={filters.criticality}
                  onChange={(e) => handleFilterChange('criticality', e.target.value)}
                >
                  <option value="">Todas</option>
                  {Object.entries(criticalityLabels).map(([key, label]) => (
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
      {infraObjects && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {infraObjects.total} objeto(s) encontrado(s)
            </p>
          </div>

          {/* Objects List */}
          {infraObjects.data.length === 0 ? (
            <div className="card-eventcad text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum objeto encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.status || filters.category 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece adicionando seu primeiro objeto'
                }
              </p>
              {!filters.search && !filters.status && !filters.category && (
                <Link to="/infra-objects/novo" className="btn-primary">
                  Criar Primeiro Objeto
                </Link>
              )}
            </div>
          ) : (
            <div className="grid gap-4">
              {infraObjects.data.map((objeto) => {
                const statusInfo = statusConfig[objeto.status];
                const StatusIcon = statusInfo.icon;
                
                return (
                  <div key={objeto.id} className="card-eventcad hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row justify-between gap-4">
                      {/* Main Info */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                            {objeto.name}
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
                          {objeto.description || 'Sem descrição'}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <Package className="h-4 w-4" />
                            <span>{categoryLabels[objeto.objectCategory]}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="h-4 w-4" />
                            <span>{objeto.position?.x?.toFixed(1)}, {objeto.position?.y?.toFixed(1)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              criticalityColors[objeto.criticality]
                            )}>
                              {criticalityLabels[objeto.criticality]}
                            </span>
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-2">
                          <span className="badge-eventcad">
                            {objeto.objectType.replace(/_/g, ' ')}
                          </span>
                          {objeto.confidence && (
                            <span className="text-xs text-gray-500">
                              {Math.round(objeto.confidence * 100)}% confiança
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex lg:flex-col gap-2">
                        <Link
                          to={`/infra-objects/${objeto.id}`}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <Eye className="h-4 w-4" />
                          Ver
                        </Link>
                        <Link
                          to={`/infra-objects/${objeto.id}/editar`}
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
          {infraObjects.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {currentPage} de {infraObjects.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(infraObjects.totalPages, p + 1))}
                disabled={currentPage === infraObjects.totalPages}
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