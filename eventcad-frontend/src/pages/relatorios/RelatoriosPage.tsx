import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  TrendingUp,
  Download,
  Settings,
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Play,
  Pause,
  Archive,
  Target,
  Award,
  Activity,
  Database,
  Layers,
  Grid,
  List,
  ExternalLink,
  MoreHorizontal,
  Shield,
  AlertTriangle
} from 'lucide-react';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';

const reportTypeConfig = {
  inspection: { label: 'Inspeção', color: 'bg-blue-100 text-blue-800', icon: Eye },
  compliance: { label: 'Compliance', color: 'bg-purple-100 text-purple-800', icon: Shield },
  safety: { label: 'Segurança', color: 'bg-red-100 text-red-800', icon: AlertTriangle },
  maintenance: { label: 'Manutenção', color: 'bg-orange-100 text-orange-800', icon: Settings },
  quality: { label: 'Qualidade', color: 'bg-green-100 text-green-800', icon: Award },
  analytics: { label: 'Analytics', color: 'bg-indigo-100 text-indigo-800', icon: BarChart3 },
  custom: { label: 'Personalizado', color: 'bg-gray-100 text-gray-800', icon: Target }
} as const;

const statusConfig = {
  draft: { label: 'Rascunho', color: 'bg-gray-100 text-gray-800', icon: Edit },
  active: { label: 'Ativo', color: 'bg-green-100 text-green-800', icon: Play },
  inactive: { label: 'Inativo', color: 'bg-red-100 text-red-800', icon: Pause },
  archived: { label: 'Arquivado', color: 'bg-gray-100 text-gray-600', icon: Archive }
} as const;

const formatConfig = {
  pdf: { label: 'PDF', color: 'bg-red-100 text-red-800', icon: FileText },
  excel: { label: 'Excel', color: 'bg-green-100 text-green-800', icon: Grid },
  word: { label: 'Word', color: 'bg-blue-100 text-blue-800', icon: FileText },
  html: { label: 'HTML', color: 'bg-orange-100 text-orange-800', icon: ExternalLink },
  json: { label: 'JSON', color: 'bg-purple-100 text-purple-800', icon: Database },
  csv: { label: 'CSV', color: 'bg-gray-100 text-gray-800', icon: List },
  xml: { label: 'XML', color: 'bg-indigo-100 text-indigo-800', icon: Layers }
} as const;

interface ReportFilters {
  search: string;
  type: string;
  status: string;
  format: string;
  createdBy: string;
  plantaId: string;
  dateRange: string;
}

export function RelatoriosPage() {
  const [filters, setFilters] = useState<ReportFilters>({
    search: '',
    type: '',
    status: '',
    format: '',
    createdBy: '',
    plantaId: '',
    dateRange: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedReports, setSelectedReports] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: reports, isLoading, error } = useQuery({
    queryKey: ['reports', filters, currentPage],
    queryFn: () => apiService.getReports({
      search: filters.search || undefined,
      type: filters.type || undefined,
      status: filters.status || undefined,
      format: filters.format || undefined,
      createdBy: filters.createdBy || undefined,
      plantaId: filters.plantaId || undefined,
      dateRange: filters.dateRange || undefined,
      page: currentPage,
      limit: 20
    }).then(res => res.data)
  });

  // Buscar plantas para o filtro
  const { data: plantasResponse } = useQuery({
    queryKey: ['plantas-for-report-filter'],
    queryFn: () => apiService.getPlantas({ limit: 100 })
  });
  const plantas = plantasResponse?.data;

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      type: '',
      status: '',
      format: '',
      createdBy: '',
      plantaId: '',
      dateRange: ''
    });
    setCurrentPage(1);
  };

  const handleSelectAll = () => {
    if (reports?.data) {
      if (selectedReports.length === reports.data.length) {
        setSelectedReports([]);
      } else {
        setSelectedReports(reports.data.map((r: any) => r.id));
      }
    }
  };

  const handleSelectReport = (reportId: string) => {
    setSelectedReports(prev => 
      prev.includes(reportId) 
        ? prev.filter(id => id !== reportId)
        : [...prev, reportId]
    );
  };

  const getTypeIcon = (type: keyof typeof reportTypeConfig) => {
    const config = reportTypeConfig[type];
    const IconComponent = config.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const getStatusIcon = (status: keyof typeof statusConfig) => {
    const config = statusConfig[status];
    const IconComponent = config.icon;
    return <IconComponent className="w-4 h-4" />;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div className="text-red-600">Erro ao carregar relatórios</div>;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seus relatórios e análises avançadas
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/relatorios/novo"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Novo Relatório
          </Link>
          <button className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports?.total || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Ativos</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports?.data?.filter(r => r.status === 'active').length || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <BarChart3 className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Execuções</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports?.data?.reduce((sum, r) => sum + (r.executionCount || 0), 0) || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Agendados</p>
              <p className="text-2xl font-bold text-gray-900">
                {reports?.data?.filter(r => r.hasScheduledReports).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar relatórios..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "inline-flex items-center px-3 py-2 border rounded-lg transition-colors",
                showFilters 
                  ? "bg-blue-50 border-blue-200 text-blue-700" 
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            <div className="flex items-center border border-gray-300 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'grid' 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={cn(
                  "p-2 transition-colors",
                  viewMode === 'list' 
                    ? "bg-blue-50 text-blue-600" 
                    : "text-gray-400 hover:text-gray-600"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
          <button
            onClick={clearFilters}
            className="text-sm text-gray-600 hover:text-gray-800"
          >
            Limpar filtros
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            <select
              value={filters.type}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os tipos</option>
              {Object.entries(reportTypeConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os status</option>
              {Object.entries(statusConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.format}
              onChange={(e) => handleFilterChange('format', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos os formatos</option>
              {Object.entries(formatConfig).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>

            <select
              value={filters.plantaId}
              onChange={(e) => handleFilterChange('plantaId', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas as plantas</option>
              {plantas?.data?.map((planta: any) => (
                <option key={planta.id} value={planta.id}>{planta.originalName || planta.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedReports.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-blue-800">
              {selectedReports.length} relatório(s) selecionado(s)
            </p>
            <div className="flex gap-2">
              <button className="inline-flex items-center px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                <Play className="w-4 h-4 mr-1" />
                Executar
              </button>
              <button className="inline-flex items-center px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700">
                <Download className="w-4 h-4 mr-1" />
                Exportar
              </button>
              <button className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700">
                <Trash2 className="w-4 h-4 mr-1" />
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Grid/List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {reports?.data?.map((report: any) => (
            <div key={report.id} className="bg-white rounded-lg shadow-sm border overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    {getTypeIcon(report.type as keyof typeof reportTypeConfig)}
                    <span className={cn(
                      "ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                      reportTypeConfig[report.type as keyof typeof reportTypeConfig]?.color
                    )}>
                      {reportTypeConfig[report.type as keyof typeof reportTypeConfig]?.label}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedReports.includes(report.id)}
                    onChange={() => handleSelectReport(report.id)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  <Link
                    to={`/relatorios/${report.id}`}
                    className="hover:text-blue-600 transition-colors"
                  >
                    {report.name}
                  </Link>
                </h3>

                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {report.description}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Status:</span>
                    <div className="flex items-center">
                      {getStatusIcon(report.status as keyof typeof statusConfig)}
                      <span className={cn(
                        "ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                        statusConfig[report.status as keyof typeof statusConfig]?.color
                      )}>
                        {statusConfig[report.status as keyof typeof statusConfig]?.label}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Formatos:</span>
                    <div className="flex gap-1">
                      {report.exportFormats?.slice(0, 2).map((format: string) => (
                        <span
                          key={format}
                          className={cn(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            formatConfig[format as keyof typeof formatConfig]?.color
                          )}
                        >
                          {formatConfig[format as keyof typeof formatConfig]?.label}
                        </span>
                      ))}
                      {report.exportFormats?.length > 2 && (
                        <span className="text-xs text-gray-500">
                          +{report.exportFormats.length - 2}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Execuções:</span>
                    <span className="text-gray-900">{report.executionCount || 0}</span>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Criado:</span>
                    <span className="text-gray-900">{formatDate(report.createdAt)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/relatorios/${report.id}`}
                      className="text-gray-400 hover:text-gray-600"
                      title="Visualizar"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/relatorios/${report.id}/editar`}
                      className="text-gray-400 hover:text-blue-600"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      className="text-gray-400 hover:text-green-600"
                      title="Executar"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-600"
                    title="Mais opções"
                  >
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedReports.length === reports?.data?.length}
                      onChange={handleSelectAll}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Relatório
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Formatos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Execuções
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reports?.data?.map((report: any) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <input
                        type="checkbox"
                        checked={selectedReports.includes(report.id)}
                        onChange={() => handleSelectReport(report.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <Link
                          to={`/relatorios/${report.id}`}
                          className="text-sm font-medium text-gray-900 hover:text-blue-600"
                        >
                          {report.name}
                        </Link>
                        <p className="text-sm text-gray-500">{report.description}</p>
                        {report.isPublic && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 mt-1">
                            Público
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getTypeIcon(report.type as keyof typeof reportTypeConfig)}
                        <span className="ml-2 text-sm text-gray-900">
                          {reportTypeConfig[report.type as keyof typeof reportTypeConfig]?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(report.status as keyof typeof statusConfig)}
                        <span className={cn(
                          "ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                          statusConfig[report.status as keyof typeof statusConfig]?.color
                        )}>
                          {statusConfig[report.status as keyof typeof statusConfig]?.label}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1">
                        {report.exportFormats?.map((format: string) => (
                          <span
                            key={format}
                            className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                              formatConfig[format as keyof typeof formatConfig]?.color
                            )}
                          >
                            {formatConfig[format as keyof typeof formatConfig]?.label}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{report.executionCount || 0}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900">{formatDate(report.createdAt)}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <Link
                          to={`/relatorios/${report.id}`}
                          className="text-gray-400 hover:text-gray-600"
                          title="Visualizar"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <Link
                          to={`/relatorios/${report.id}/editar`}
                          className="text-gray-400 hover:text-blue-600"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          className="text-gray-400 hover:text-green-600"
                          title="Executar"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                        <button
                          className="text-gray-400 hover:text-gray-600"
                          title="Mais opções"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {reports && reports.total > 20 && (
            <div className="bg-white px-6 py-3 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                  Mostrando {((currentPage - 1) * 20) + 1} a {Math.min(currentPage * 20, reports.total)} de {reports.total} resultados
                </p>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <span className="px-3 py-1 text-sm text-gray-700">
                    Página {currentPage}
                  </span>
                  <button
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    disabled={currentPage * 20 >= reports.total}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
} 