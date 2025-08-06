import axios, { AxiosInstance, AxiosResponse } from 'axios';
import {
  User,
  Evento,
  Planta,
  InfraObject,
  AIJob,
  FileData,
  CreateInfraObjectForm,
  PaginatedResponse,
  AuthResponse,
  EventoFilters,
  InfraObjectFilters,
  AIJobFilters,
  DashboardStats,
  EventoStats,
  InfraObjectStats,
  LoginForm,
  RegisterForm,
  CreateEventoForm
} from '@/types';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: '/api/v1',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor para adicionar token de autenticação
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('access_token');
        console.log('🔍 Debug - Token encontrado:', !!token);
        console.log('🔍 Debug - URL da requisição:', config.url);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('🔍 Debug - Token adicionado ao header');
        } else {
          console.log('🔍 Debug - NENHUM TOKEN ENCONTRADO!');
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Interceptor para tratamento de erros
    this.api.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Desabilitar refresh automático temporariamente
          console.log('Erro 401 detectado, redirecionando para login');
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Autenticação
  async login(credentials: LoginForm): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/login', credentials);
  }

  async register(userData: RegisterForm): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/register', userData);
  }

  async refreshToken(refreshToken: string): Promise<AxiosResponse<AuthResponse>> {
    return this.api.post('/auth/refresh', { refresh_token: refreshToken });
  }

  async getProfile(): Promise<AxiosResponse<User>> {
    return this.api.get('/auth/profile');
  }

  async updateProfile(data: any): Promise<AxiosResponse<User>> {
    return this.api.put('/auth/profile', data);
  }

  async changePassword(data: any): Promise<AxiosResponse<any>> {
    return this.api.put('/auth/password', data);
  }

  async updateNotifications(data: any): Promise<AxiosResponse<any>> {
    return this.api.put('/auth/notifications', data);
  }

  async getUserStats(): Promise<AxiosResponse<any>> {
    return this.api.get('/auth/stats');
  }

  async getUserActivity(): Promise<AxiosResponse<any[]>> {
    return this.api.get('/auth/activity');
  }

  async logout(): Promise<void> {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  }

  // Eventos
  async getEventos(options?: EventoFilters): Promise<AxiosResponse<PaginatedResponse<Evento>>> {
    const { page = 1, limit = 10, ...filters } = options || {};
    const params = { page, limit, ...filters };
    return this.api.get('/eventos', { params });
  }

  async getEvento(id: string): Promise<AxiosResponse<Evento>> {
    return this.api.get(`/eventos/${id}`);
  }

  async createEvento(evento: CreateEventoForm): Promise<AxiosResponse<Evento>> {
    return this.api.post('/eventos', evento);
  }

  async updateEvento(id: string, evento: Partial<CreateEventoForm>): Promise<AxiosResponse<Evento>> {
    return this.api.patch(`/eventos/${id}`, evento);
  }

  async deleteEvento(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/eventos/${id}`);
  }

  async updateEventoStatus(id: string, status: string): Promise<AxiosResponse<Evento>> {
    return this.api.patch(`/eventos/${id}/status`, { status });
  }

  async getEventoStats(): Promise<AxiosResponse<EventoStats>> {
    return this.api.get('/eventos/stats/overview');
  }

  async getProximosEventos(): Promise<AxiosResponse<Evento[]>> {
    return this.api.get('/eventos/dashboard/proximos');
  }

  async getEventosAtencao(): Promise<AxiosResponse<Evento[]>> {
    return this.api.get('/eventos/dashboard/atencao');
  }

  // Plantas
  async getPlantas(options?: any): Promise<AxiosResponse<PaginatedResponse<Planta>>> {
    const params = typeof options === 'string' ? { eventoId: options } : (options || {});
    return this.api.get('/plantas', { params });
  }

  async getPlanta(id: string): Promise<AxiosResponse<Planta>> {
    return this.api.get(`/plantas/${id}`);
  }

  async uploadPlanta(eventoId: string, plantaTipo: string, file: globalThis.File): Promise<AxiosResponse<Planta>> {
    const formData = new FormData();
    formData.append('eventoId', eventoId);
    formData.append('plantaTipo', plantaTipo);
    formData.append('file', file);

    return this.api.post('/plantas/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async updatePlanta(id: string, planta: Partial<Planta>): Promise<AxiosResponse<Planta>> {
    return this.api.patch(`/plantas/${id}`, planta);
  }

  async deletePlanta(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/plantas/${id}`);
  }

  async processPlantaAI(id: string): Promise<AxiosResponse<AIJob>> {
    return this.api.post(`/plantas/${id}/process-ai`);
  }

  async getPlantaMetadata(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/plantas/${id}/metadata`);
  }

  async getDetectedObjects(id: string): Promise<AxiosResponse<InfraObject[]>> {
    return this.api.get(`/plantas/${id}/detected-objects`);
  }

  // Objetos de Infraestrutura
  async getInfraObjects(filters?: InfraObjectFilters, page = 1, limit = 10): Promise<AxiosResponse<PaginatedResponse<InfraObject>>> {
    const params = { page, limit, ...filters };
    return this.api.get('/infra-objects', { params });
  }

  async getInfraObject(id: string): Promise<AxiosResponse<InfraObject>> {
    return this.api.get(`/infra-objects/${id}`);
  }

  async createInfraObject(object: CreateInfraObjectForm): Promise<AxiosResponse<InfraObject>> {
    return this.api.post('/infra-objects', object);
  }

  async updateInfraObject(id: string, object: Partial<CreateInfraObjectForm>): Promise<AxiosResponse<InfraObject>> {
    return this.api.patch(`/infra-objects/${id}`, object);
  }

  async deleteInfraObject(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/infra-objects/${id}`);
  }

  async moveInfraObject(id: string, x: number, y: number, reason?: string): Promise<AxiosResponse<InfraObject>> {
    return this.api.post(`/infra-objects/${id}/move`, { x, y, reason });
  }

  async resizeInfraObject(id: string, width: number, height: number, reason?: string): Promise<AxiosResponse<InfraObject>> {
    return this.api.post(`/infra-objects/${id}/resize`, { width, height, reason });
  }

  async addAnnotation(id: string, annotation: { type: string; text: string; priority: string }): Promise<AxiosResponse<any>> {
    return this.api.post(`/infra-objects/${id}/annotations`, annotation);
  }

  async resolveAnnotation(objectId: string, annotationId: string): Promise<AxiosResponse<any>> {
    return this.api.post(`/infra-objects/${objectId}/annotations/${annotationId}/resolve`);
  }

  async addValidation(id: string, validation: { type: string; status: string; score: number; notes?: string }): Promise<AxiosResponse<any>> {
    return this.api.post(`/infra-objects/${id}/validations`, validation);
  }

  async approveInfraObject(id: string): Promise<AxiosResponse<InfraObject>> {
    return this.api.post(`/infra-objects/${id}/approve`);
  }

  async rejectInfraObject(id: string, reason?: string): Promise<AxiosResponse<InfraObject>> {
    return this.api.post(`/infra-objects/${id}/reject`, { reason });
  }

  async analyzeConflicts(conflictTypes: string[], autoResolve = false): Promise<AxiosResponse<any>> {
    return this.api.post('/infra-objects/analyze-conflicts', { conflictTypes, autoResolve });
  }

  async getInfraObjectStats(): Promise<AxiosResponse<InfraObjectStats>> {
    return this.api.get('/infra-objects/stats/overview');
  }

  async getInfraObjectDashboard(): Promise<AxiosResponse<any>> {
    return this.api.get('/infra-objects/dashboard');
  }

  async generateInfraObjectReport(options: any): Promise<AxiosResponse<any>> {
    return this.api.post('/infra-objects/reports/generate', options);
  }

  async getAvailableTypes(): Promise<AxiosResponse<any>> {
    return this.api.get('/infra-objects/types/available');
  }

  async getInfraObjectsByPlanta(plantaId: string): Promise<AxiosResponse<InfraObject[]>> {
    return this.api.get(`/infra-objects/planta/${plantaId}`);
  }

  async getInfraObjectHistory(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/infra-objects/${id}/history`);
  }

  // Jobs de IA
  async getAIJobs(filters?: AIJobFilters, page = 1, limit = 10): Promise<AxiosResponse<PaginatedResponse<AIJob>>> {
    const params = { page, limit, ...filters };
    return this.api.get('/ai-recognition/jobs', { params });
  }

  async getAIJob(id: string): Promise<AxiosResponse<AIJob>> {
    return this.api.get(`/ai-recognition/jobs/${id}`);
  }

  async createAIJob(job: { jobName: string; modelType: string; plantaId: string; priority: number }): Promise<AxiosResponse<AIJob>> {
    return this.api.post('/ai-recognition/jobs', job);
  }

  async updateAIJob(id: string, job: Partial<AIJob>): Promise<AxiosResponse<AIJob>> {
    return this.api.patch(`/ai-recognition/jobs/${id}`, job);
  }

  async executeAIJob(id: string): Promise<AxiosResponse<AIJob>> {
    return this.api.post(`/ai-recognition/jobs/${id}/execute`);
  }

  async cancelAIJob(id: string): Promise<AxiosResponse<AIJob>> {
    return this.api.post(`/ai-recognition/jobs/${id}/cancel`);
  }

  async getAIJobResults(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/ai-recognition/jobs/${id}/results`);
  }

  async getAIJobStatus(id: string): Promise<AxiosResponse<AIJob>> {
    return this.api.get(`/ai-recognition/jobs/${id}/status`);
  }

  async getAIJobLogs(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/ai-recognition/jobs/${id}/logs`);
  }

  async getAIQueue(): Promise<AxiosResponse<AIJob[]>> {
    return this.api.get('/ai-recognition/queue');
  }

  async getAIRecommendations(plantaId: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/ai-recognition/recommendations/${plantaId}`);
  }

  async getAIStats(): Promise<AxiosResponse<any>> {
    return this.api.get('/ai-recognition/stats/overview');
  }

  async getAIDashboard(): Promise<AxiosResponse<any>> {
    return this.api.get('/ai-recognition/dashboard');
  }

  async generateAIReport(options: any): Promise<AxiosResponse<any>> {
    return this.api.post('/ai-recognition/reports/generate', options);
  }

  async getAvailableModels(): Promise<AxiosResponse<any>> {
    return this.api.get('/ai-recognition/models/available');
  }

  async getAIHealth(): Promise<AxiosResponse<any>> {
    return this.api.get('/ai-recognition/health');
  }

  // Upload de Arquivos
  async uploadFile(file: globalThis.File, entityType: string, entityId: string): Promise<AxiosResponse<FileData>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return this.api.post('/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async uploadMultipleFiles(files: globalThis.File[], entityType: string, entityId: string): Promise<AxiosResponse<FileData[]>> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('entityType', entityType);
    formData.append('entityId', entityId);

    return this.api.post('/files/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getFiles(entityType?: string, entityId?: string, page = 1, limit = 10): Promise<AxiosResponse<PaginatedResponse<FileData>>> {
    const params = { page, limit, entityType, entityId };
    return this.api.get('/files', { params });
  }

  async getFile(id: string): Promise<AxiosResponse<FileData>> {
    return this.api.get(`/files/${id}`);
  }

  async updateFile(id: string, file: Partial<FileData>): Promise<AxiosResponse<FileData>> {
    return this.api.patch(`/files/${id}`, file);
  }

  async deleteFile(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/files/${id}`);
  }

  async shareFile(id: string, shareData: any): Promise<AxiosResponse<any>> {
    return this.api.post(`/files/${id}/share`, shareData);
  }

  async getDownloadUrl(id: string): Promise<AxiosResponse<{ url: string }>> {
    return this.api.post(`/files/${id}/download-url`);
  }

  async downloadFile(id: string): Promise<AxiosResponse<Blob>> {
    return this.api.get(`/files/${id}/download`, {
      responseType: 'blob',
    });
  }

  async getFilePreview(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/files/${id}/preview`);
  }

  async getFilesByEntity(entityType: string, entityId: string): Promise<AxiosResponse<FileData[]>> {
    return this.api.get(`/files/entity/${entityType}/${entityId}`);
  }

  async getFileStats(): Promise<AxiosResponse<any>> {
    return this.api.get('/files/stats/overview');
  }

  // Dashboard e Estatísticas
  async getDashboardStats(): Promise<AxiosResponse<DashboardStats>> {
    return this.api.get('/eventos/dashboard/stats');
  }

  // Health Check
  async getHealth(): Promise<AxiosResponse<any>> {
    return this.api.get('/health');
  }

  // Checklists
  async getChecklists(options?: any): Promise<AxiosResponse<PaginatedResponse<any>>> {
    const params = options || {};
    return this.api.get('/checklists', { params });
  }

  async getChecklist(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/checklists/${id}`);
  }

  async createChecklist(checklist: any): Promise<AxiosResponse<any>> {
    return this.api.post('/checklists', checklist);
  }

  async updateChecklist(id: string, checklist: any): Promise<AxiosResponse<any>> {
    return this.api.patch(`/checklists/${id}`, checklist);
  }

  async deleteChecklist(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/checklists/${id}`);
  }

  // Relatórios
  async getReports(options?: any): Promise<AxiosResponse<PaginatedResponse<any>>> {
    const params = options || {};
    return this.api.get('/relatorios/templates', { params });
  }

  async getReport(id: string): Promise<AxiosResponse<any>> {
    return this.api.get(`/relatorios/templates/${id}`);
  }

  async createReport(report: any): Promise<AxiosResponse<any>> {
    return this.api.post('/relatorios/templates', report);
  }

  async updateReport(id: string, report: any): Promise<AxiosResponse<any>> {
    return this.api.patch(`/relatorios/templates/${id}`, report);
  }

  async deleteReport(id: string): Promise<AxiosResponse<void>> {
    return this.api.delete(`/relatorios/templates/${id}`);
  }

  async executeReport(id: string, options?: any): Promise<AxiosResponse<any>> {
    return this.api.post(`/relatorios/templates/${id}/execute`, options);
  }

  async exportReport(id: string, format: string): Promise<AxiosResponse<any>> {
    return this.api.post(`/relatorios/templates/${id}/export`, { format });
  }

  // Usuários
  async getUsers(options?: any): Promise<AxiosResponse<PaginatedResponse<User>>> {
    const params = options || {};
    return this.api.get('/auth/users', { params });
  }

  async getUser(id: string): Promise<AxiosResponse<User>> {
    return this.api.get(`/auth/users/${id}`);
  }

  // Métodos genéricos para compatibilidade
  async get(url: string, config?: any): Promise<AxiosResponse<any>> {
    return this.api.get(url, config);
  }

  async post(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.put(url, data, config);
  }

  async patch(url: string, data?: any, config?: any): Promise<AxiosResponse<any>> {
    return this.api.patch(url, data, config);
  }

  async delete(url: string, config?: any): Promise<AxiosResponse<any>> {
    return this.api.delete(url, config);
  }
}

// Instância singleton do serviço de API
export const apiService = new ApiService();
export default apiService; 