import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Upload, 
  Image, 
  Search, 
  Filter,
  Eye,
  Download,
  Trash2,
  Brain,
  FileText,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,

  Grid3X3,
  List,
  Layers
} from 'lucide-react';
import { apiService } from '@/services/api';
import { PlantaTipo } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
  pending: { label: 'Pendente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  processing: { label: 'Processando', color: 'bg-blue-100 text-blue-800', icon: Brain },
  completed: { label: 'Processado', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  failed: { label: 'Falhou', color: 'bg-red-100 text-red-800', icon: AlertCircle }
} as const;

interface PlantasFilters {
  search: string;
  plantaTipo: PlantaTipo | '';
  eventoId: string;
  processamento: 'pending' | 'processing' | 'completed' | 'failed' | '';
  dataUpload: string;
}

export function PlantasPage() {
  const [searchParams] = useSearchParams();
  const eventoIdFromUrl = searchParams.get('eventoId') || '';
  
  const [filters, setFilters] = useState<PlantasFilters>({
    search: '',
    plantaTipo: '',
    eventoId: eventoIdFromUrl,
    processamento: '',
    dataUpload: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: plantas, isLoading, error } = useQuery({
    queryKey: ['plantas', filters, currentPage],
    queryFn: () => apiService.getPlantas({
      page: currentPage,
      limit: 12,
      search: filters.search || undefined,
      plantaTipo: filters.plantaTipo || undefined,
      eventoId: filters.eventoId || undefined,
      processamento: filters.processamento || undefined,
      dataUpload: filters.dataUpload || undefined
    }).then(res => res.data)
  });

  const { data: eventos } = useQuery({
    queryKey: ['eventos-list'],
    queryFn: () => apiService.getEventos({ limit: 100 }).then(res => res.data.data)
  });

  const handleFilterChange = (key: keyof PlantasFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      plantaTipo: '',
      eventoId: eventoIdFromUrl, // Manter eventoId se veio da URL
      processamento: '',
      dataUpload: ''
    });
    setCurrentPage(1);
  };

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

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar plantas</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Plantas Técnicas</h1>
          <p className="text-gray-600">
            {filters.eventoId 
              ? `Plantas do evento selecionado` 
              : 'Gerencie todas as plantas técnicas'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'grid' 
                  ? "bg-white text-eventcad-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <Grid3X3 className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "p-2 rounded-md transition-colors",
                viewMode === 'list' 
                  ? "bg-white text-eventcad-600 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
            >
              <List className="h-4 w-4" />
            </button>
          </div>

          <Link
            to="/plantas/upload"
            className="btn-primary flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            Nova Planta
          </Link>
        </div>
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
                placeholder="Buscar plantas..."
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
              {/* Evento Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evento</label>
                <select
                  className="input-eventcad"
                  value={filters.eventoId}
                  onChange={(e) => handleFilterChange('eventoId', e.target.value)}
                >
                  <option value="">Todos os eventos</option>
                  {eventos?.map((evento) => (
                    <option key={evento.id} value={evento.id}>
                      {evento.nome}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tipo Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  className="input-eventcad"
                  value={filters.plantaTipo}
                  onChange={(e) => handleFilterChange('plantaTipo', e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(plantaTipoLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Status Processamento */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Processamento</label>
                <select
                  className="input-eventcad"
                  value={filters.processamento}
                  onChange={(e) => handleFilterChange('processamento', e.target.value)}
                >
                  <option value="">Todos os status</option>
                  {Object.entries(statusProcessamento).map(([key, config]) => (
                    <option key={key} value={key}>{config.label}</option>
                  ))}
                </select>
              </div>

              {/* Data Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Data Upload</label>
                <input
                  type="date"
                  className="input-eventcad"
                  value={filters.dataUpload}
                  onChange={(e) => handleFilterChange('dataUpload', e.target.value)}
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
      {plantas && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {plantas.total || 0} planta(s) encontrada(s)
            </p>
          </div>

          {/* Plants Grid/List */}
          {plantas.data?.length === 0 ? (
            <div className="card-eventcad text-center py-12">
              <Image className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma planta encontrada</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.plantaTipo || filters.processamento
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece fazendo upload da primeira planta'
                }
              </p>
              {!filters.search && !filters.plantaTipo && !filters.processamento && (
                <Link to="/plantas/upload" className="btn-primary">
                  Upload da Primeira Planta
                </Link>
              )}
            </div>
          ) : (
            <div className={cn(
              viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            )}>
              {plantas.data?.map((planta) => {
                const statusInfo = statusProcessamento[planta.processamentoStatus || 'pending'];
                const StatusIcon = statusInfo.icon;
                
                if (viewMode === 'grid') {
                  return (
                    <div key={planta.id} className="card-eventcad hover:shadow-lg transition-shadow group">
                      {/* Thumbnail */}
                      <div className="aspect-video bg-gray-100 rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                        {planta.thumbnailUrl ? (
                          <img 
                            src={planta.thumbnailUrl} 
                            alt={planta.nome}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-gray-400">
                            <FileText className="h-8 w-8 mx-auto mb-2" />
                            <p className="text-xs">{planta.fileName}</p>
                          </div>
                        )}
                        
                        {/* Overlay Actions */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <div className="flex items-center gap-2">
                            <Link
                              to={`/plantas/${planta.id}`}
                              className="p-2 bg-white rounded-full text-gray-700 hover:text-eventcad-600 transition-colors"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>
                            <button className="p-2 bg-white rounded-full text-gray-700 hover:text-blue-600 transition-colors">
                              <Download className="h-4 w-4" />
                            </button>
                            {(planta.processamentoStatus === 'pending' || planta.processamentoStatus === 'failed') && (
                              <button className="p-2 bg-white rounded-full text-gray-700 hover:text-green-600 transition-colors">
                                <Play className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900 line-clamp-1">
                            {planta.nome}
                          </h3>
                          <div className={cn(
                            "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                            statusInfo.color
                          )}>
                            <StatusIcon className="h-3 w-3" />
                            {statusInfo.label}
                          </div>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Layers className="h-3 w-3" />
                            <span>{plantaTipoLabels[planta.plantaTipo]}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <FileText className="h-3 w-3" />
                            <span>{formatFileSize(planta.fileSize)}</span>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>
                              {format(new Date(planta.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                            </span>
                          </div>
                        </div>

                        {planta.detectadosCount && planta.detectadosCount > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center gap-2 text-sm text-eventcad-600">
                              <Brain className="h-4 w-4" />
                              <span>{planta.detectadosCount} objetos detectados</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                } else {
                  // List View
                  return (
                    <div key={planta.id} className="card-eventcad hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        {/* Thumbnail */}
                        <div className="w-20 h-16 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          {planta.thumbnailUrl ? (
                            <img 
                              src={planta.thumbnailUrl} 
                              alt={planta.nome}
                              className="w-full h-full object-cover rounded-lg"
                            />
                          ) : (
                            <FileText className="h-6 w-6 text-gray-400" />
                          )}
                        </div>

                        {/* Main Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 truncate">
                              {planta.nome}
                            </h3>
                            <div className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ml-2",
                              statusInfo.color
                            )}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </div>
                          </div>

                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Layers className="h-3 w-3" />
                              <span>{plantaTipoLabels[planta.plantaTipo]}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <FileText className="h-3 w-3" />
                              <span>{formatFileSize(planta.fileSize)}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>
                                {format(new Date(planta.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                              </span>
                            </div>

                            {planta.detectadosCount && planta.detectadosCount > 0 && (
                              <div className="flex items-center gap-1 text-eventcad-600">
                                <Brain className="h-3 w-3" />
                                <span>{planta.detectadosCount} detectados</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            to={`/plantas/${planta.id}`}
                            className="p-2 text-gray-600 hover:text-eventcad-600 rounded-lg hover:bg-gray-100 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                          </Link>
                          <button className="p-2 text-gray-600 hover:text-blue-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <Download className="h-4 w-4" />
                          </button>
                          {(planta.processamentoStatus === 'pending' || planta.processamentoStatus === 'failed') && (
                            <button className="p-2 text-gray-600 hover:text-green-600 rounded-lg hover:bg-gray-100 transition-colors">
                              <Play className="h-4 w-4" />
                            </button>
                          )}
                          <button className="p-2 text-gray-600 hover:text-red-600 rounded-lg hover:bg-gray-100 transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          )}

          {/* Pagination */}
          {plantas.totalPages && plantas.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {currentPage} de {plantas.totalPages || 1}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(plantas.totalPages || 1, p + 1))}
                disabled={currentPage === (plantas.totalPages || 1)}
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