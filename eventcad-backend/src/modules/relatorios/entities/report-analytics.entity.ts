import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';

/**
 * Entidade ReportAnalytics - Analytics de relatórios
 *
 * Funcionalidades:
 * - Métricas e estatísticas de relatórios
 * - Performance e uso
 * - Tendências e insights
 * - Relatórios de analytics
 */
@Entity('report_analytics')
@Index(['tenantId', 'date'])
@Index(['tenantId', 'type'])
export class ReportAnalytics extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'date',
    nullable: false,
    comment: 'Data dos analytics',
  })
  date: Date;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Tipo de analytics',
  })
  type: string;

  // Métricas de templates
  @Column({
    type: 'int',
    default: 0,
    comment: 'Total de templates',
  })
  totalTemplates: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Templates ativos',
  })
  activeTemplates: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Templates criados',
  })
  templatesCreated: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Templates modificados',
  })
  templatesModified: number;

  // Métricas de execuções
  @Column({
    type: 'int',
    default: 0,
    comment: 'Total de execuções',
  })
  totalExecutions: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Execuções com sucesso',
  })
  successfulExecutions: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Execuções com falha',
  })
  failedExecutions: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Execuções canceladas',
  })
  cancelledExecutions: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Taxa de sucesso (%)',
  })
  successRate: number;

  // Métricas de agendamentos
  @Column({
    type: 'int',
    default: 0,
    comment: 'Total de agendamentos',
  })
  totalSchedules: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Agendamentos ativos',
  })
  activeSchedules: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Agendamentos executados',
  })
  executedSchedules: number;

  // Métricas de exportações
  @Column({
    type: 'int',
    default: 0,
    comment: 'Total de exportações',
  })
  totalExports: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Exportações com sucesso',
  })
  successfulExports: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Exportações com falha',
  })
  failedExports: number;

  @Column({
    type: 'bigint',
    default: 0,
    comment: 'Total de downloads',
  })
  totalDownloads: number;

  // Métricas de performance
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Tempo médio de execução (segundos)',
  })
  averageExecutionTime: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Tempo médio de exportação (segundos)',
  })
  averageExportTime: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Tamanho médio de arquivo (MB)',
  })
  averageFileSize: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Execuções com timeout',
  })
  timeoutExecutions: number;

  // Métricas de uso
  @Column({
    type: 'int',
    default: 0,
    comment: 'Usuários únicos',
  })
  uniqueUsers: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Sessões ativas',
  })
  activeSessions: number;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Templates mais populares',
  })
  popularTemplates?: {
    templateId: string;
    name: string;
    executionCount: number;
    downloadCount: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Formatos mais utilizados',
  })
  popularFormats?: {
    format: string;
    count: number;
    percentage: number;
  }[];

  // Métricas de erro
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Erros mais comuns',
  })
  commonErrors?: {
    error: string;
    count: number;
    percentage: number;
  }[];

  @Column({
    type: 'int',
    default: 0,
    comment: 'Total de erros',
  })
  totalErrors: number;

  // Métricas de tempo
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Execuções por hora',
  })
  executionsByHour?: {
    hour: number;
    count: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Execuções por dia da semana',
  })
  executionsByDayOfWeek?: {
    day: number;
    count: number;
  }[];

  // Métricas de recursos
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Uso médio de memória (MB)',
  })
  averageMemoryUsage: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Uso médio de CPU (%)',
  })
  averageCpuUsage: number;

  @Column({
    type: 'bigint',
    default: 0,
    comment: 'Espaço em disco usado (bytes)',
  })
  diskUsage: number;

  // Métricas de qualidade
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    comment: 'Satisfação média (1-5)',
  })
  averageSatisfaction: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Número de avaliações',
  })
  ratingCount: number;

  @Column({
    type: 'int',
    default: 0,
    comment: 'Relatórios com alta satisfação',
  })
  highSatisfactionReports: number;

  // Métricas de negócio
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Execuções por tipo de relatório',
  })
  executionsByType?: {
    type: string;
    count: number;
    percentage: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Execuções por categoria',
  })
  executionsByCategory?: {
    category: string;
    count: number;
    percentage: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Execuções por planta',
  })
  executionsByPlanta?: {
    plantaId: string;
    name: string;
    count: number;
    percentage: number;
  }[];

  // Tendências
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Tendência de execuções (últimos 7 dias)',
  })
  executionTrend?: {
    date: string;
    count: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Tendência de downloads (últimos 7 dias)',
  })
  downloadTrend?: {
    date: string;
    count: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Tendência de erros (últimos 7 dias)',
  })
  errorTrend?: {
    date: string;
    count: number;
  }[];

  // Alertas e insights
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Alertas gerados',
  })
  alerts?: {
    type: string;
    message: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: Date;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Insights gerados',
  })
  insights?: {
    type: string;
    title: string;
    description: string;
    impact: 'low' | 'medium' | 'high';
    timestamp: Date;
  }[];

  // Metadados
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados adicionais',
  })
  declare metadata?: Record<string, any>;

  // Métodos de negócio
  get isToday(): boolean {
    const today = new Date();
    return this.date.toDateString() === today.toDateString();
  }

  get isThisWeek(): boolean {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return this.date >= weekAgo;
  }

  get isThisMonth(): boolean {
    const today = new Date();
    return this.date.getMonth() === today.getMonth() && 
           this.date.getFullYear() === today.getFullYear();
  }

  get executionEfficiency(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.successfulExecutions / this.totalExecutions) * 100;
  }

  get exportEfficiency(): number {
    if (this.totalExports === 0) return 0;
    return (this.successfulExports / this.totalExports) * 100;
  }

  get averageDownloadsPerExport(): number {
    if (this.successfulExports === 0) return 0;
    return this.totalDownloads / this.successfulExports;
  }

  get errorRate(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.failedExecutions / this.totalExecutions) * 100;
  }

  get timeoutRate(): number {
    if (this.totalExecutions === 0) return 0;
    return (this.timeoutExecutions / this.totalExecutions) * 100;
  }

  // Métodos de negócio
  updateMetrics(metrics: Partial<ReportAnalytics>): void {
    Object.assign(this, metrics);
  }

  addExecution(success: boolean, executionTime: number, memoryUsage?: number, cpuUsage?: number): void {
    this.totalExecutions++;
    if (success) {
      this.successfulExecutions++;
    } else {
      this.failedExecutions++;
    }

    // Atualizar tempo médio
    const totalTime = this.averageExecutionTime * (this.totalExecutions - 1) + executionTime;
    this.averageExecutionTime = totalTime / this.totalExecutions;

    // Atualizar uso de recursos
    if (memoryUsage !== undefined) {
      const totalMemory = this.averageMemoryUsage * (this.totalExecutions - 1) + memoryUsage;
      this.averageMemoryUsage = totalMemory / this.totalExecutions;
    }

    if (cpuUsage !== undefined) {
      const totalCpu = this.averageCpuUsage * (this.totalExecutions - 1) + cpuUsage;
      this.averageCpuUsage = totalCpu / this.totalExecutions;
    }

    // Atualizar taxa de sucesso
    this.successRate = (this.successfulExecutions / this.totalExecutions) * 100;
  }

  addExport(success: boolean, exportTime: number, fileSize?: number): void {
    this.totalExports++;
    if (success) {
      this.successfulExports++;
    } else {
      this.failedExports++;
    }

    // Atualizar tempo médio
    const totalTime = this.averageExportTime * (this.totalExports - 1) + exportTime;
    this.averageExportTime = totalTime / this.totalExports;

    // Atualizar tamanho médio
    if (fileSize !== undefined) {
      const totalSize = this.averageFileSize * (this.successfulExports - 1) + (fileSize / (1024 * 1024));
      this.averageFileSize = totalSize / this.successfulExports;
    }
  }

  addDownload(): void {
    this.totalDownloads++;
  }

  addError(error: string): void {
    this.totalErrors++;
    
    if (!this.commonErrors) {
      this.commonErrors = [];
    }

    const existingError = this.commonErrors.find(e => e.error === error);
    if (existingError) {
      existingError.count++;
      existingError.percentage = (existingError.count / this.totalErrors) * 100;
    } else {
      this.commonErrors.push({
        error,
        count: 1,
        percentage: (1 / this.totalErrors) * 100,
      });
    }

    // Manter apenas os 10 erros mais comuns
    this.commonErrors.sort((a, b) => b.count - a.count);
    this.commonErrors = this.commonErrors.slice(0, 10);
  }

  addTimeout(): void {
    this.timeoutExecutions++;
  }

  addRating(rating: number): void {
    this.ratingCount++;
    const totalRating = this.averageSatisfaction * (this.ratingCount - 1) + rating;
    this.averageSatisfaction = totalRating / this.ratingCount;

    if (rating >= 4) {
      this.highSatisfactionReports++;
    }
  }

  addPopularTemplate(templateId: string, name: string, executionCount: number, downloadCount: number): void {
    if (!this.popularTemplates) {
      this.popularTemplates = [];
    }

    const existingTemplate = this.popularTemplates.find(t => t.templateId === templateId);
    if (existingTemplate) {
      existingTemplate.executionCount = executionCount;
      existingTemplate.downloadCount = downloadCount;
    } else {
      this.popularTemplates.push({
        templateId,
        name,
        executionCount,
        downloadCount,
      });
    }

    // Manter apenas os 10 templates mais populares
    this.popularTemplates.sort((a, b) => b.executionCount - a.executionCount);
    this.popularTemplates = this.popularTemplates.slice(0, 10);
  }

  addPopularFormat(format: string): void {
    if (!this.popularFormats) {
      this.popularFormats = [];
    }

    const existingFormat = this.popularFormats.find(f => f.format === format);
    if (existingFormat) {
      existingFormat.count++;
      existingFormat.percentage = (existingFormat.count / this.totalExports) * 100;
    } else {
      this.popularFormats.push({
        format,
        count: 1,
        percentage: (1 / this.totalExports) * 100,
      });
    }
  }

  addAlert(type: string, message: string, severity: 'low' | 'medium' | 'high' | 'critical'): void {
    if (!this.alerts) {
      this.alerts = [];
    }

    this.alerts.push({
      type,
      message,
      severity,
      timestamp: new Date(),
    });

    // Manter apenas os últimos 50 alertas
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
  }

  addInsight(type: string, title: string, description: string, impact: 'low' | 'medium' | 'high'): void {
    if (!this.insights) {
      this.insights = [];
    }

    this.insights.push({
      type,
      title,
      description,
      impact,
      timestamp: new Date(),
    });

    // Manter apenas os últimos 20 insights
    if (this.insights.length > 20) {
      this.insights = this.insights.slice(-20);
    }
  }

  updateTrends(executionTrend: any[], downloadTrend: any[], errorTrend: any[]): void {
    this.executionTrend = executionTrend;
    this.downloadTrend = downloadTrend;
    this.errorTrend = errorTrend;
  }

  setMetadata(key: string, value: any): void {
    if (!this.metadata) {
      this.metadata = {};
    }
    this.metadata[key] = value;
  }

  getMetadata(key: string): any {
    return this.metadata?.[key];
  }

  exportForReport(): any {
    return {
      date: this.date,
      type: this.type,
      totalTemplates: this.totalTemplates,
      activeTemplates: this.activeTemplates,
      totalExecutions: this.totalExecutions,
      successfulExecutions: this.successfulExecutions,
      failedExecutions: this.failedExecutions,
      successRate: this.successRate,
      totalExports: this.totalExports,
      successfulExports: this.successfulExports,
      totalDownloads: this.totalDownloads,
      averageExecutionTime: this.averageExecutionTime,
      averageExportTime: this.averageExportTime,
      averageFileSize: this.averageFileSize,
      uniqueUsers: this.uniqueUsers,
      averageSatisfaction: this.averageSatisfaction,
      popularTemplates: this.popularTemplates,
      popularFormats: this.popularFormats,
      commonErrors: this.commonErrors,
      alerts: this.alerts,
      insights: this.insights,
    };
  }
} 