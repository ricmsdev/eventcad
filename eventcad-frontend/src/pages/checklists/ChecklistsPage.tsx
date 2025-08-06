import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Play,
  Archive,
  BarChart3,
  Users,
  FileText,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { apiService } from '../../services/api';
import { cn } from '../../utils/cn';

interface Checklist {
  id: string;
  name: string;
  description?: string;
  code: string;
  type: 'inspection' | 'compliance' | 'safety' | 'maintenance' | 'quality' | 'custom';
  status: 'draft' | 'active' | 'inactive' | 'archived';
  priority: 'low' | 'medium' | 'high' | 'critical';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual' | 'on_demand' | 'custom';
  dueDate?: string;
  lastExecutedAt?: string;
  nextExecutionAt?: string;
  assignedTo: string;
  assignee?: {
    id: string;
    name: string;
    email: string;
  };
  planta?: {
    id: string;
    name: string;
  };
  totalItems: number;
  completedItems: number;
  completionPercentage: number;
  isOverdue: boolean;
  isDueSoon: boolean;
  createdAt: string;
  updatedAt: string;
}

const ChecklistsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedChecklist, setSelectedChecklist] = useState<Checklist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const queryClient = useQueryClient();

  // Buscar checklists
  const {
    data: checklistsResponse,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['checklists', { search: searchTerm, status: statusFilter, type: typeFilter, priority: priorityFilter }],
    queryFn: () => apiService.getChecklists({
      search: searchTerm || undefined,
      status: statusFilter !== 'all' ? statusFilter : undefined,
      type: typeFilter !== 'all' ? typeFilter : undefined,
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
    }),
  });

  const checklists = checklistsResponse?.data?.data || [];

  // Buscar estatísticas
  const { data: stats } = useQuery({
    queryKey: ['checklists-stats'],
    queryFn: () => apiService.get('/checklists/statistics/overview'),
  });

  // Mutations
  const executeChecklistMutation = useMutation({
    mutationFn: (checklistId: string) => apiService.post(`/checklists/${checklistId}/execute`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklists-stats'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ checklistId, status }: { checklistId: string; status: string }) =>
      apiService.updateChecklist(checklistId, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklists-stats'] });
    },
  });

  const deleteChecklistMutation = useMutation({
    mutationFn: (checklistId: string) => apiService.deleteChecklist(checklistId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklists'] });
      queryClient.invalidateQueries({ queryKey: ['checklists-stats'] });
    },
  });

  // Handlers
  const handleExecuteChecklist = (checklistId: string) => {
    executeChecklistMutation.mutate(checklistId);
  };

  const handleUpdateStatus = (checklistId: string, status: string) => {
    updateStatusMutation.mutate({ checklistId, status });
  };

  const handleDeleteChecklist = (checklistId: string) => {
    if (confirm('Tem certeza que deseja excluir este checklist?')) {
      deleteChecklistMutation.mutate(checklistId);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setTypeFilter('all');
    setPriorityFilter('all');
    setSearchTerm('');
  };

  // Filtros aplicados
  const appliedFilters = [
    statusFilter !== 'all' && `Status: ${statusFilter}`,
    typeFilter !== 'all' && `Tipo: ${typeFilter}`,
    priorityFilter !== 'all' && `Prioridade: ${priorityFilter}`,
    searchTerm && `Busca: "${searchTerm}"`,
  ].filter(Boolean);

  // Funções auxiliares
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'inspection':
        return <Eye className="w-4 h-4" />;
      case 'compliance':
        return <CheckCircle className="w-4 h-4" />;
      case 'safety':
        return <AlertTriangle className="w-4 h-4" />;
      case 'maintenance':
        return <Settings className="w-4 h-4" />;
      case 'quality':
        return <BarChart3 className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Erro ao carregar checklists</h3>
          <p className="text-gray-600 mb-4">Ocorreu um erro ao buscar os checklists. Tente novamente.</p>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checklists</h1>
          <p className="text-gray-600">Gerencie seus checklists de inspeção e compliance</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Checklist
        </button>
      </div>

      {/* Estatísticas */}
      {stats && stats.data && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.data.total || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Ativos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.data.active || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Vencidos</p>
                <p className="text-2xl font-bold text-gray-900">{stats.data.overdue || 0}</p>
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Taxa de Conclusão</p>
                <p className="text-2xl font-bold text-gray-900">{stats.data.completionRate || 0}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Busca */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Buscar checklists..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                'inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium',
                showFilters ? 'bg-blue-50 border-blue-300 text-blue-700' : 'bg-white text-gray-700 hover:bg-gray-50'
              )}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </button>
            {appliedFilters.length > 0 && (
              <button
                onClick={clearFilters}
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium bg-white text-gray-700 hover:bg-gray-50"
              >
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filtros expandidos */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os status</option>
                  <option value="active">Ativo</option>
                  <option value="draft">Rascunho</option>
                  <option value="inactive">Inativo</option>
                  <option value="archived">Arquivado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todos os tipos</option>
                  <option value="inspection">Inspeção</option>
                  <option value="compliance">Compliance</option>
                  <option value="safety">Segurança</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="quality">Qualidade</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="all">Todas as prioridades</option>
                  <option value="critical">Crítica</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Filtros aplicados */}
        {appliedFilters.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {appliedFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {filter}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Lista de Checklists */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">Carregando checklists...</p>
          </div>
        ) : checklists.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Nenhum checklist encontrado</h3>
            <p className="text-gray-600 mb-4">
              {appliedFilters.length > 0
                ? 'Tente ajustar os filtros para encontrar checklists.'
                : 'Comece criando seu primeiro checklist.'}
            </p>
            {appliedFilters.length === 0 && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Criar Checklist
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Checklist
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Progresso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Responsável
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vencimento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {checklists.map((checklist) => (
                  <tr key={checklist.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-lg bg-gray-100">
                          {getTypeIcon(checklist.type)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{checklist.name}</div>
                          <div className="text-sm text-gray-500">{checklist.code}</div>
                          {checklist.description && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">
                              {checklist.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col space-y-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getStatusColor(checklist.status)
                          )}
                        >
                          {checklist.status === 'active' && 'Ativo'}
                          {checklist.status === 'draft' && 'Rascunho'}
                          {checklist.status === 'inactive' && 'Inativo'}
                          {checklist.status === 'archived' && 'Arquivado'}
                        </span>
                        <span
                          className={cn(
                            'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
                            getPriorityColor(checklist.priority)
                          )}
                        >
                          {checklist.priority === 'critical' && 'Crítica'}
                          {checklist.priority === 'high' && 'Alta'}
                          {checklist.priority === 'medium' && 'Média'}
                          {checklist.priority === 'low' && 'Baixa'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${checklist.completionPercentage}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-900">{checklist.completionPercentage}%</span>
                      </div>
                      <div className="text-sm text-gray-500 mt-1">
                        {checklist.completedItems} de {checklist.totalItems} itens
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                          <Users className="w-4 h-4 text-gray-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {checklist.assignee?.name || 'Não atribuído'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {checklist.planta?.name || 'Sem planta'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {checklist.dueDate ? formatDate(checklist.dueDate) : 'Sem vencimento'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {checklist.isOverdue && (
                          <span className="text-red-600 font-medium">Vencido</span>
                        )}
                        {checklist.isDueSoon && !checklist.isOverdue && (
                          <span className="text-orange-600 font-medium">Vence em breve</span>
                        )}
                        {checklist.lastExecutedAt && (
                          <div>Última execução: {formatDateTime(checklist.lastExecutedAt)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleExecuteChecklist(checklist.id)}
                          disabled={executeChecklistMutation.isPending}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-blue-700 bg-blue-100 hover:bg-blue-200 disabled:opacity-50"
                        >
                          <Play className="w-3 h-3 mr-1" />
                          Executar
                        </button>
                        <button
                          onClick={() => {
                            setSelectedChecklist(checklist);
                            setShowDetailsModal(true);
                          }}
                          className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Ver
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setSelectedChecklist(checklist)}
                            className="inline-flex items-center px-2 py-1 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200"
                          >
                            <MoreVertical className="w-3 h-3" />
                          </button>
                          {selectedChecklist?.id === checklist.id && (
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200">
                              <div className="py-1">
                                <button
                                  onClick={() => {
                                    // Implementar edição
                                    setSelectedChecklist(null);
                                  }}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Edit className="w-4 h-4 mr-2" />
                                  Editar
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(checklist.id, 'archived')}
                                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                                >
                                  <Archive className="w-4 h-4 mr-2" />
                                  Arquivar
                                </button>
                                <button
                                  onClick={() => handleDeleteChecklist(checklist.id)}
                                  className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Excluir
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modais */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Criar Novo Checklist</h3>
              {/* Implementar formulário de criação */}
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                  Criar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDetailsModal && selectedChecklist && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Detalhes do Checklist</h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Informações Básicas</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Nome</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Código</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.code}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Descrição</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.description || 'Sem descrição'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tipo</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.type}</dd>
                    </div>
                  </dl>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Status e Progresso</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Status</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.status}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Progresso</dt>
                      <dd className="text-sm text-gray-900">
                        {selectedChecklist.completionPercentage}% ({selectedChecklist.completedItems}/{selectedChecklist.totalItems})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Responsável</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.assignee?.name || 'Não atribuído'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Planta</dt>
                      <dd className="text-sm text-gray-900">{selectedChecklist.planta?.name || 'Sem planta'}</dd>
                    </div>
                  </dl>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  Fechar
                </button>
                <button
                  onClick={() => handleExecuteChecklist(selectedChecklist.id)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Executar Checklist
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para fechar menus */}
      {selectedChecklist && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setSelectedChecklist(null)}
        ></div>
      )}
    </div>
  );
};

export default ChecklistsPage; 