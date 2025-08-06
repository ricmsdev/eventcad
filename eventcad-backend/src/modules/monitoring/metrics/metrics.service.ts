import { Injectable, Logger } from '@nestjs/common';
import * as os from 'os';

export interface MetricsData {
  requestsPerMinute: number;
  errorRate: number;
  responseTime: number;
  activeConnections: number;
  memoryUsage: {
    used: number;
    total: number;
    percentage: number;
  };
  cpuUsage: {
    loadAverage: number[];
    percentage: number;
  };
  diskUsage: {
    used: number;
    total: number;
    percentage: number;
  };
}

export interface DailyReport {
  date: string;
  totalRequests: number;
  totalErrors: number;
  averageResponseTime: number;
  peakConcurrentUsers: number;
  systemUptime: number;
  resourceUsage: {
    averageMemoryUsage: number;
    averageCpuUsage: number;
    peakMemoryUsage: number;
    peakCpuUsage: number;
  };
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  
  // Métricas em memória (em produção usar Redis ou banco)
  private metrics = {
    requests: [] as number[],
    errors: [] as number[],
    responseTimes: [] as number[],
    activeConnections: 0,
    startTime: Date.now(),
  };

  private readonly MAX_SAMPLES = 1000; // Manter últimos 1000 registros

  async initialize(): Promise<void> {
    this.logger.log('📊 Inicializando sistema de métricas...');
    
    // Limpar métricas antigas a cada hora
    setInterval(() => {
      this.cleanupOldMetrics();
    }, 60 * 60 * 1000); // 1 hora

    this.logger.log('✅ Sistema de métricas inicializado');
  }

  async recordMetric(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    const timestamp = Date.now();
    
    switch (name) {
      case 'request':
        this.metrics.requests.push(timestamp);
        break;
      case 'error':
        this.metrics.errors.push(timestamp);
        break;
      case 'response_time':
        this.metrics.responseTimes.push(value);
        break;
      case 'active_connections':
        this.metrics.activeConnections = value;
        break;
    }

    // Manter apenas os últimos registros
    this.cleanupOldMetrics();
  }

  async incrementCounter(name: string, tags?: Record<string, string>): Promise<void> {
    await this.recordMetric(name, 1, tags);
  }

  async recordHistogram(name: string, value: number, tags?: Record<string, string>): Promise<void> {
    await this.recordMetric(name, value, tags);
  }

  async getCurrentMetrics(): Promise<MetricsData> {
    const now = Date.now();
    const oneMinuteAgo = now - 60 * 1000;

    // Calcular requests por minuto
    const recentRequests = this.metrics.requests.filter(timestamp => timestamp > oneMinuteAgo);
    const requestsPerMinute = recentRequests.length;

    // Calcular taxa de erro
    const recentErrors = this.metrics.errors.filter(timestamp => timestamp > oneMinuteAgo);
    const errorRate = requestsPerMinute > 0 ? (recentErrors.length / requestsPerMinute) * 100 : 0;

    // Calcular tempo de resposta médio
    const recentResponseTimes = this.metrics.responseTimes.slice(-100); // Últimos 100
    const averageResponseTime = recentResponseTimes.length > 0 
      ? recentResponseTimes.reduce((sum, time) => sum + time, 0) / recentResponseTimes.length 
      : 0;

    // Obter métricas do sistema
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();
    const diskUsage = this.getDiskUsage();

    return {
      requestsPerMinute,
      errorRate,
      responseTime: averageResponseTime,
      activeConnections: this.metrics.activeConnections,
      memoryUsage,
      cpuUsage,
      diskUsage,
    };
  }

  private getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    const percentage = (usedMemory / totalMemory) * 100;

    return {
      used: usedMemory,
      total: totalMemory,
      percentage: Math.round(percentage * 100) / 100,
    };
  }

  private getCpuUsage() {
    const loadAverage = os.loadavg();
    const cpuCount = os.cpus().length;
    
    // Calcular porcentagem de CPU baseada no load average
    const cpuPercentage = (loadAverage[0] / cpuCount) * 100;

    return {
      loadAverage,
      percentage: Math.round(cpuPercentage * 100) / 100,
    };
  }

  private getDiskUsage() {
    // Simplificado para desenvolvimento
    // Em produção, usar fs.statSync para verificar espaço em disco
    return {
      used: 0,
      total: 0,
      percentage: 0,
    };
  }

  private cleanupOldMetrics(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    // Limpar requests antigos
    this.metrics.requests = this.metrics.requests.filter(timestamp => timestamp > oneHourAgo);
    
    // Limpar errors antigos
    this.metrics.errors = this.metrics.errors.filter(timestamp => timestamp > oneHourAgo);
    
    // Manter apenas os últimos response times
    if (this.metrics.responseTimes.length > this.MAX_SAMPLES) {
      this.metrics.responseTimes = this.metrics.responseTimes.slice(-this.MAX_SAMPLES);
    }
  }

  async generateDailyReport(): Promise<DailyReport> {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;

    // Calcular métricas do dia
    const dailyRequests = this.metrics.requests.filter(timestamp => timestamp > oneDayAgo);
    const dailyErrors = this.metrics.errors.filter(timestamp => timestamp > oneDayAgo);
    const dailyResponseTimes = this.metrics.responseTimes.filter((_, index) => {
      // Assumir que response times são recentes
      return true;
    });

    const totalRequests = dailyRequests.length;
    const totalErrors = dailyErrors.length;
    const averageResponseTime = dailyResponseTimes.length > 0 
      ? dailyResponseTimes.reduce((sum, time) => sum + time, 0) / dailyResponseTimes.length 
      : 0;

    // Calcular pico de usuários concorrentes (simplificado)
    const peakConcurrentUsers = Math.max(this.metrics.activeConnections, 0);

    // Calcular uptime do sistema
    const systemUptime = (now - this.metrics.startTime) / 1000; // em segundos

    // Métricas de recursos (simplificado)
    const memoryUsage = this.getMemoryUsage();
    const cpuUsage = this.getCpuUsage();

    return {
      date: new Date().toISOString().split('T')[0],
      totalRequests,
      totalErrors,
      averageResponseTime,
      peakConcurrentUsers,
      systemUptime,
      resourceUsage: {
        averageMemoryUsage: memoryUsage.percentage,
        averageCpuUsage: cpuUsage.percentage,
        peakMemoryUsage: memoryUsage.percentage, // Simplificado
        peakCpuUsage: cpuUsage.percentage, // Simplificado
      },
    };
  }

  // Métodos para middleware de requests
  recordRequest(): void {
    this.metrics.requests.push(Date.now());
  }

  recordError(): void {
    this.metrics.errors.push(Date.now());
  }

  recordResponseTime(responseTime: number): void {
    this.metrics.responseTimes.push(responseTime);
  }

  setActiveConnections(count: number): void {
    this.metrics.activeConnections = count;
  }
} 