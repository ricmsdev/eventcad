import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter,
  Download,
  Share2,
  Trash2,
  Eye,
  FileImage,
  FileSpreadsheet,
  FileIcon,
  Folder,
  HardDrive
} from 'lucide-react';
import { apiService } from '@/services/api';
import { FileType } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const fileTypeIcons = {
  [FileType.DOCUMENT]: FileText,
  [FileType.IMAGE]: FileImage,
  [FileType.SPREADSHEET]: FileSpreadsheet,
  [FileType.PDF]: FileText,
  [FileType.CAD]: FileIcon,
  [FileType.DWG]: FileIcon,
  [FileType.OTHER]: FileIcon
} as const;

const fileTypeLabels = {
  [FileType.DOCUMENT]: 'Documento',
  [FileType.IMAGE]: 'Imagem',
  [FileType.SPREADSHEET]: 'Planilha',
  [FileType.PDF]: 'PDF',
  [FileType.CAD]: 'CAD',
  [FileType.DWG]: 'DWG',
  [FileType.OTHER]: 'Outro'
} as const;

const entityTypeLabels = {
  evento: 'Evento',
  planta: 'Planta',
  infra_object: 'Objeto de Infraestrutura',
  ai_job: 'Job de IA',
  user: 'Usuário'
} as const;

interface FilesFilters {
  search: string;
  fileType: FileType | '';
  entityType: string;
  entityId: string;
  uploadedBy: string;
}

export function FilesPage() {
  const [filters, setFilters] = useState<FilesFilters>({
    search: '',
    fileType: '',
    entityType: '',
    entityId: '',
    uploadedBy: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: files, isLoading, error } = useQuery({
    queryKey: ['files', filters, currentPage],
    queryFn: () => apiService.getFiles(
      filters.entityType || undefined,
      filters.entityId || undefined,
      currentPage,
      20
    ).then(res => res.data)
  });

  // Buscar estatísticas de arquivos
  const { data: fileStats } = useQuery({
    queryKey: ['file-stats'],
    queryFn: () => apiService.getFileStats()
  });

  const handleFilterChange = (key: keyof FilesFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      fileType: '',
      entityType: '',
      entityId: '',
      uploadedBy: ''
    });
    setCurrentPage(1);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileTypeIcon = (fileType: FileType) => {
    const IconComponent = fileTypeIcons[fileType] || FileIcon;
    return IconComponent;
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
          <FileText className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Erro ao carregar arquivos</h3>
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
          <h1 className="text-2xl font-bold text-gray-900">Arquivos</h1>
          <p className="text-gray-600">Gerencie documentos, imagens e outros arquivos</p>
        </div>
        <Link
          to="/files/upload"
          className="btn-primary flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          Upload de Arquivo
        </Link>
      </div>

      {/* Stats Cards */}
      {fileStats?.data && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-blue-50">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Total de Arquivos</p>
                <p className="text-2xl font-semibold text-gray-900">{fileStats.data.totalFiles || 0}</p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-purple-50">
                <HardDrive className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Espaço Usado</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {fileStats.data.totalSize ? formatFileSize(fileStats.data.totalSize) : '0 Bytes'}
                </p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-green-50">
                <FileImage className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Imagens</p>
                <p className="text-2xl font-semibold text-gray-900">{fileStats.data.imageFiles || 0}</p>
              </div>
            </div>
          </div>

          <div className="card-eventcad">
            <div className="flex items-center">
              <div className="flex-shrink-0 p-3 rounded-lg bg-orange-50">
                <FileText className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4 flex-1">
                <p className="text-sm font-medium text-gray-500">Documentos</p>
                <p className="text-2xl font-semibold text-gray-900">{fileStats.data.documentFiles || 0}</p>
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
                placeholder="Buscar arquivos..."
                className="input-eventcad pl-10"
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>
          </div>

          {/* View Mode Toggle */}
          <div className="flex rounded-lg border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-l-lg",
                viewMode === 'grid'
                  ? "bg-eventcad-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={cn(
                "px-3 py-2 text-sm font-medium rounded-r-lg border-l",
                viewMode === 'list'
                  ? "bg-eventcad-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-50"
              )}
            >
              Lista
            </button>
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
              {/* File Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Arquivo</label>
                <select
                  className="input-eventcad"
                  value={filters.fileType}
                  onChange={(e) => handleFilterChange('fileType', e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {Object.entries(fileTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Entity Type Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entidade</label>
                <select
                  className="input-eventcad"
                  value={filters.entityType}
                  onChange={(e) => handleFilterChange('entityType', e.target.value)}
                >
                  <option value="">Todas as entidades</option>
                  {Object.entries(entityTypeLabels).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Entity ID Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">ID da Entidade</label>
                <input
                  type="text"
                  className="input-eventcad"
                  placeholder="ID específico..."
                  value={filters.entityId}
                  onChange={(e) => handleFilterChange('entityId', e.target.value)}
                />
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
      {files && (
        <div className="space-y-4">
          {/* Results Count */}
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {files.total} arquivo(s) encontrado(s)
            </p>
          </div>

          {/* Files List/Grid */}
          {files.data.length === 0 ? (
            <div className="card-eventcad text-center py-12">
              <Folder className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum arquivo encontrado</h3>
              <p className="text-gray-600 mb-4">
                {filters.search || filters.fileType || filters.entityType 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece fazendo upload do seu primeiro arquivo'
                }
              </p>
              {!filters.search && !filters.fileType && !filters.entityType && (
                <Link to="/files/upload" className="btn-primary">
                  Upload de Arquivo
                </Link>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {files.data.map((file) => {
                const FileIcon = getFileTypeIcon(file.fileType || FileType.OTHER);
                
                return (
                  <div key={file.id} className="card-eventcad hover:shadow-md transition-shadow group">
                    <div className="relative">
                      {/* File Preview/Icon */}
                      <div className="aspect-square bg-gray-50 rounded-lg flex items-center justify-center mb-3">
                        {file.fileType === FileType.IMAGE && file.thumbnail ? (
                          <img
                            src={file.thumbnail}
                            alt={file.originalName}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                        ) : (
                          <FileIcon className="h-12 w-12 text-gray-400" />
                        )}
                      </div>

                      {/* Actions Menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="flex gap-1">
                          <Link
                            to={`/files/${file.id}`}
                            className="p-1 bg-white rounded shadow-sm hover:bg-gray-50"
                          >
                            <Eye className="h-4 w-4 text-gray-600" />
                          </Link>
                          <button className="p-1 bg-white rounded shadow-sm hover:bg-gray-50">
                            <Download className="h-4 w-4 text-gray-600" />
                          </button>
                          <button className="p-1 bg-white rounded shadow-sm hover:bg-gray-50">
                            <Share2 className="h-4 w-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* File Info */}
                    <div>
                      <h4 className="font-medium text-gray-900 line-clamp-2 mb-1">{file.filename}</h4>
                      <p className="text-sm text-gray-500 mb-2">{formatFileSize(file.size)}</p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{fileTypeLabels[file.fileType || FileType.OTHER]}</span>
                        <span>{format(new Date(file.createdAt), 'dd/MM', { locale: ptBR })}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card-eventcad overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Arquivo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tipo
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tamanho
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Entidade
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Data
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {files.data.map((file) => {
                      const FileIcon = getFileTypeIcon(file.fileType || FileType.OTHER);
                      
                      return (
                        <tr key={file.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                {file.fileType === FileType.IMAGE && file.thumbnail ? (
                                  <img
                                    src={file.thumbnail}
                                    alt={file.originalName}
                                    className="w-16 h-16 object-cover rounded"
                                  />
                                ) : (
                                  <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                                    <FileIcon className="h-5 w-5 text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 line-clamp-1">
                                  {file.filename}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                              {fileTypeLabels[file.fileType || FileType.OTHER]}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatFileSize(file.size)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {file.entityType ? entityTypeLabels[file.entityType as keyof typeof entityTypeLabels] || file.entityType : '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {format(new Date(file.createdAt), "dd/MM/yyyy", { locale: ptBR })}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/files/${file.id}`}
                                className="text-eventcad-600 hover:text-eventcad-900"
                              >
                                <Eye className="h-4 w-4" />
                              </Link>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Download className="h-4 w-4" />
                              </button>
                              <button className="text-gray-600 hover:text-gray-900">
                                <Share2 className="h-4 w-4" />
                              </button>
                              <button className="text-red-600 hover:text-red-900">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {files.totalPages > 1 && (
            <div className="flex justify-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Anterior
              </button>
              
              <span className="px-3 py-2 text-sm text-gray-600">
                Página {currentPage} de {files.totalPages}
              </span>
              
              <button
                onClick={() => setCurrentPage(p => Math.min(files.totalPages, p + 1))}
                disabled={currentPage === files.totalPages}
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