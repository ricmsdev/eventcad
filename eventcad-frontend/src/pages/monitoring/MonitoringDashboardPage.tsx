import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Database, 
  HardDrive, 
  Server, 
  TrendingUp,
  AlertCircle,
  Bell,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { apiService } from '../../services/api';

interface SystemStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: Date;
  uptime: number;
  version: string;
  environment: string;
  checks: {
    database: boolean;
    redis: boolean;
    externalServices: boolean;
    diskSpace: boolean;
    memory: boolean;
  };
  metrics: {
    requestsPerMinute: number;
    errorRate: number;
    responseTime: number;
    activeConnections: number;
  };
}

interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged?: boolean;
}

const MonitoringDashboardPage: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'alerts' | 'logs'>('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Buscar status do sistema
  const { data: systemStatusResponse } = useQuery({
    queryKey: ['monitoring', 'status'],
    queryFn: () => apiService.get('/api/v1/monitoring/health'),
    refetchInterval: autoRefresh ? 30000 : false, // 30 segundos
  });

  // Buscar métricas detalhadas
  const { data: metricsResponse, isLoading: metricsLoading } = useQuery({
    queryKey: ['monitoring', 'metrics'],
    queryFn: () => apiService.get('/api/v1/monitoring/metrics'),
    refetchInterval: autoRefresh ? 60000 : false, // 1 minuto
  });

  // Buscar alertas
  const { data: alertsResponse, isLoading: alertsLoading } = useQuery({
    queryKey: ['monitoring', 'alerts'],
    queryFn: () => apiService.get('/api/v1/alerts'),
    refetchInterval: autoRefresh ? 30000 : false, // 30 segundos
  });

  // Buscar logs
  const { data: logsResponse, isLoading: logsLoading } = useQuery({
    queryKey: ['monitoring', 'logs'],
    queryFn: () => apiService.get('/api/v1/logs'),
    refetchInterval: autoRefresh ? 60000 : false, // 1 minuto
  });

  // Extrair dados das respostas
  const systemStatus = systemStatusResponse?.data as SystemStatus;
  const metrics = metricsResponse?.data;
  const alerts = alertsResponse?.data as Alert[];
  const logs = logsResponse?.data as any[];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-500';
      case 'degraded': return 'text-yellow-500';
      case 'unhealthy': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="w-5 h-5" />;
      case 'degraded': return <AlertTriangle className="w-5 h-5" />;
      case 'unhealthy': return <AlertCircle className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const getAlertColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-500';
      case 'error': return 'bg-orange-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const tabs = [
    { id: 'overview', label: 'Visão Geral', icon: <Activity className="w-4 h-4" /> },
    { id: 'metrics', label: 'Métricas', icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'alerts', label: 'Alertas', icon: <Bell className="w-4 h-4" /> },
    { id: 'logs', label: 'Logs', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Dashboard de Monitoramento
          </h1>
          <p className="text-gray-600">
            Monitoramento em tempo real do sistema EventCAD+
          </p>
        </div>

        {/* Status Geral */}
        {systemStatus && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-lg shadow-sm p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Status do Sistema</h2>
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-2 ${getStatusColor(systemStatus.status)}`}>
                  {getStatusIcon(systemStatus.status)}
                  <span className="font-medium capitalize">{systemStatus.status}</span>
                </div>
                <span className="text-sm text-gray-500">
                  {new Date(systemStatus.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <p className="text-sm text-gray-600">Uptime</p>
                    <p className="font-semibold">{formatUptime(systemStatus.uptime)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Server className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600">Versão</p>
                    <p className="font-semibold">{systemStatus.version}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <Settings className="w-5 h-5 text-purple-500" />
                  <div>
                    <p className="text-sm text-gray-600">Ambiente</p>
                    <p className="font-semibold capitalize">{systemStatus.environment}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center space-x-3">
                  <TrendingUp className="w-5 h-5 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600">Requests/min</p>
                    <p className="font-semibold">{systemStatus.metrics?.requestsPerMinute || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    selectedTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {/* Auto Refresh Toggle */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {selectedTab === 'overview' && 'Visão Geral'}
                {selectedTab === 'metrics' && 'Métricas do Sistema'}
                {selectedTab === 'alerts' && 'Alertas Ativos'}
                {selectedTab === 'logs' && 'Logs Recentes'}
              </h3>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-600">Auto-refresh</span>
              </label>
            </div>

            {/* Tab Content */}
            {selectedTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Health Checks */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Health Checks</h4>
                  <div className="space-y-3">
                    {systemStatus?.checks && Object.entries(systemStatus.checks).map(([service, status]) => (
                      <div key={service} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          {service === 'database' && <Database className="w-4 h-4" />}
                          {service === 'redis' && <Server className="w-4 h-4" />}
                          {service === 'externalServices' && <Activity className="w-4 h-4" />}
                          {service === 'diskSpace' && <HardDrive className="w-4 h-4" />}
                          {service === 'memory' && <Server className="w-4 h-4" />}
                          <span className="capitalize">{service.replace(/([A-Z])/g, ' $1').trim()}</span>
                        </div>
                        <div className={`flex items-center space-x-2 ${status ? 'text-green-500' : 'text-red-500'}`}>
                          {status ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                          <span className="text-sm">{status ? 'OK' : 'Falha'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4">Métricas de Performance</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Taxa de Erro</span>
                        <span>{systemStatus?.metrics?.errorRate?.toFixed(2) || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-red-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(systemStatus?.metrics?.errorRate || 0, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Tempo de Resposta</span>
                        <span>{systemStatus?.metrics?.responseTime?.toFixed(0) || 0}ms</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((systemStatus?.metrics?.responseTime || 0) / 10, 100)}%` }}
                        ></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Conexões Ativas</span>
                        <span>{systemStatus?.metrics?.activeConnections || 0}</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min((systemStatus?.metrics?.activeConnections || 0) / 2, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'metrics' && (
              <div className="space-y-6">
                {metricsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando métricas...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* System Resources */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Recursos do Sistema</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>CPU</span>
                            <span>{metrics?.cpu?.percentage?.toFixed(1) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${metrics?.cpu?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Memória</span>
                            <span>{metrics?.memory?.percentage?.toFixed(1) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${metrics?.memory?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Disco</span>
                            <span>{metrics?.disk?.percentage?.toFixed(1) || 0}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-500 h-2 rounded-full" 
                              style={{ width: `${metrics?.disk?.percentage || 0}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Application Metrics */}
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h4 className="text-lg font-semibold mb-4">Métricas da Aplicação</h4>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span>Requests/min</span>
                          <span className="font-semibold">{metrics?.requestsPerMinute || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Taxa de Erro</span>
                          <span className="font-semibold">{metrics?.errorRate?.toFixed(2) || 0}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Tempo de Resposta</span>
                          <span className="font-semibold">{metrics?.responseTime?.toFixed(0) || 0}ms</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Conexões Ativas</span>
                          <span className="font-semibold">{metrics?.activeConnections || 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'alerts' && (
              <div className="space-y-4">
                {alertsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando alertas...</p>
                  </div>
                ) : alerts && alerts.length > 0 ? (
                  alerts.map((alert: Alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-4 rounded-lg border-l-4 ${getAlertColor(alert.level)} border-l-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-block w-2 h-2 rounded-full ${getAlertColor(alert.level)}`}></span>
                            <span className="font-medium text-gray-900">{alert.title}</span>
                            <span className="text-xs text-gray-500 capitalize">{alert.level}</span>
                          </div>
                          <p className="text-gray-600 text-sm">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                        {!alert.acknowledged && (
                          <button className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600">
                            Reconhecer
                          </button>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum alerta ativo</p>
                  </div>
                )}
              </div>
            )}

            {selectedTab === 'logs' && (
              <div className="space-y-4">
                {logsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                    <p className="mt-2 text-gray-600">Carregando logs...</p>
                  </div>
                ) : logs && logs.length > 0 ? (
                  <div className="bg-gray-900 rounded-lg p-4 max-h-96 overflow-y-auto">
                    {logs.map((log: any, index: number) => (
                      <div key={index} className="text-sm font-mono text-gray-300 mb-1">
                        <span className="text-gray-500">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className={`ml-2 ${
                          log.level === 'error' ? 'text-red-400' :
                          log.level === 'warn' ? 'text-yellow-400' :
                          log.level === 'info' ? 'text-blue-400' :
                          'text-green-400'
                        }`}>
                          [{log.level.toUpperCase()}]
                        </span>
                        <span className="ml-2">{log.message}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum log disponível</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringDashboardPage; 