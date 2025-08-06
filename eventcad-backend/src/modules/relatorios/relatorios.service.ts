import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  In,
  Between,
  MoreThanOrEqual,
  LessThanOrEqual,
  Raw,
} from 'typeorm';
import { ReportTemplate } from './entities/report-template.entity';
import { ReportExecution, ExecutionStatus } from './entities/report-execution.entity';
import { ReportSchedule } from './entities/report-schedule.entity';
import { ReportExport, ExportStatus } from './entities/report-export.entity';
import { ReportAnalytics } from './entities/report-analytics.entity';
import {
  ReportType,
  ReportStatus,
  ReportFormat,
  ReportFrequency,
  ReportPriority,
} from './entities/report-template.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { Planta } from '../planta/entities/planta.entity';
import { User } from '../auth/entities/user.entity';
import { InfraObject } from '../infra-object/entities/infra-object.entity';
import { Checklist } from '../checklist/entities/checklist.entity';

@Injectable()
export class RelatoriosService {
  private readonly logger = new Logger(RelatoriosService.name);

  constructor(
    @InjectRepository(ReportTemplate)
    private readonly reportTemplateRepository: Repository<ReportTemplate>,
    @InjectRepository(ReportExecution)
    private readonly reportExecutionRepository: Repository<ReportExecution>,
    @InjectRepository(ReportSchedule)
    private readonly reportScheduleRepository: Repository<ReportSchedule>,
    @InjectRepository(ReportExport)
    private readonly reportExportRepository: Repository<ReportExport>,
    @InjectRepository(ReportAnalytics)
    private readonly reportAnalyticsRepository: Repository<ReportAnalytics>,
  ) {}

  // ===== CRUD de Templates =====
  async createTemplate(createDto: any, userId: string, tenantId: string): Promise<ReportTemplate> {
    this.logger.log(`Criando template de relatório: ${createDto.name}`);

    const template = this.reportTemplateRepository.create({
      ...createDto,
      createdBy: userId,
      tenantId,
    });

    const savedTemplate = await this.reportTemplateRepository.save(template);
    return Array.isArray(savedTemplate) ? savedTemplate[0] : savedTemplate;
  }

  async findAllTemplates(
    tenantId: string,
    filters?: {
      type?: ReportType;
      status?: ReportStatus;
      search?: string;
      plantaId?: string;
    },
  ): Promise<ReportTemplate[]> {
    const query = this.reportTemplateRepository
      .createQueryBuilder('template')
      .where('template.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('template.planta', 'planta')
      .leftJoinAndSelect('template.createdByUser', 'createdByUser');

    if (filters?.type) {
      query.andWhere('template.type = :type', { type: filters.type });
    }

    if (filters?.status) {
      query.andWhere('template.status = :status', { status: filters.status });
    }

    if (filters?.search) {
      query.andWhere(
        '(template.name ILIKE :search OR template.description ILIKE :search)',
        { search: `%${filters.search}%` },
      );
    }

    if (filters?.plantaId) {
      query.andWhere('template.plantaId = :plantaId', { plantaId: filters.plantaId });
    }

    return await query.orderBy('template.createdAt', 'DESC').getMany();
  }

  async findTemplateById(id: string, tenantId: string): Promise<ReportTemplate> {
    const template = await this.reportTemplateRepository.findOne({
      where: { id, tenantId },
      relations: ['planta', 'createdByUser', 'schedules', 'executions'],
    });

    if (!template) {
      throw new NotFoundException('Template de relatório não encontrado');
    }

    return template;
  }

  async updateTemplate(
    id: string,
    updateDto: any,
    userId: string,
    tenantId: string,
  ): Promise<ReportTemplate> {
    const template = await this.findTemplateById(id, tenantId);

    Object.assign(template, {
      ...updateDto,
      updatedBy: userId,
      updatedAt: new Date(),
    });

    return await this.reportTemplateRepository.save(template);
  }

  async deleteTemplate(id: string, tenantId: string): Promise<void> {
    const template = await this.findTemplateById(id, tenantId);
    await this.reportTemplateRepository.remove(template);
  }

  // ===== Execução de Relatórios =====
  async executeReport(
    templateId: string,
    executionDto: any,
    userId: string,
    tenantId: string,
  ): Promise<ReportExecution> {
    this.logger.log(`Executando relatório: ${templateId}`);

    const template = await this.findTemplateById(templateId, tenantId);

    // Verificar permissões
    if (!this.canExecuteReport(template, userId)) {
      throw new ForbiddenException('Sem permissão para executar este relatório');
    }

    // Criar execução
    const execution = this.reportExecutionRepository.create({
      templateId,
      executedBy: userId,
      tenantId,
      parameters: executionDto.parameters || {},
      status: ExecutionStatus.PENDING,
    });

    const savedExecution = await this.reportExecutionRepository.save(execution);

    // Executar relatório em background
    this.executeReportAsync(savedExecution.id, template, executionDto.parameters);

    return savedExecution;
  }

  async findExecutionById(id: string, tenantId: string): Promise<ReportExecution> {
    const execution = await this.reportExecutionRepository.findOne({
      where: { id, tenantId },
      relations: ['template', 'executedByUser', 'exports'],
    });

    if (!execution) {
      throw new NotFoundException('Execução de relatório não encontrada');
    }

    return execution;
  }

  async findAllExecutions(
    tenantId: string,
    filters?: {
      templateId?: string;
      status?: string;
      executedBy?: string;
      dateFrom?: Date;
      dateTo?: Date;
    },
  ): Promise<ReportExecution[]> {
    const query = this.reportExecutionRepository
      .createQueryBuilder('execution')
      .where('execution.tenantId = :tenantId', { tenantId })
      .leftJoinAndSelect('execution.template', 'template')
      .leftJoinAndSelect('execution.executedByUser', 'executedByUser');

    if (filters?.templateId) {
      query.andWhere('execution.templateId = :templateId', { templateId: filters.templateId });
    }

    if (filters?.status) {
      query.andWhere('execution.status = :status', { status: filters.status });
    }

    if (filters?.executedBy) {
      query.andWhere('execution.executedBy = :executedBy', { executedBy: filters.executedBy });
    }

    if (filters?.dateFrom) {
      query.andWhere('execution.createdAt >= :dateFrom', { dateFrom: filters.dateFrom });
    }

    if (filters?.dateTo) {
      query.andWhere('execution.createdAt <= :dateTo', { dateTo: filters.dateTo });
    }

    return await query.orderBy('execution.createdAt', 'DESC').getMany();
  }

  // ===== Agendamento =====
  async scheduleReport(
    templateId: string,
    scheduleDto: any,
    userId: string,
    tenantId: string,
  ): Promise<ReportSchedule> {
    const template = await this.findTemplateById(templateId, tenantId);

    const schedule = this.reportScheduleRepository.create({
      templateId,
      createdBy: userId,
      tenantId,
      frequency: scheduleDto.frequency,
      nextExecution: this.calculateNextExecution(scheduleDto.frequency, scheduleDto.startDate),
      parameters: scheduleDto.parameters || {},
      isActive: true,
    });

    return await this.reportScheduleRepository.save(schedule);
  }

  async findAllSchedules(tenantId: string): Promise<ReportSchedule[]> {
    return await this.reportScheduleRepository.find({
      where: { tenantId, isActive: true },
      relations: ['template', 'createdByUser'],
      order: { nextExecution: 'ASC' },
    });
  }

  async updateSchedule(
    id: string,
    updateDto: any,
    tenantId: string,
  ): Promise<ReportSchedule> {
    const schedule = await this.reportScheduleRepository.findOne({
      where: { id, tenantId },
    });

    if (!schedule) {
      throw new NotFoundException('Agendamento não encontrado');
    }

    Object.assign(schedule, updateDto);
    return await this.reportScheduleRepository.save(schedule);
  }

  // ===== Exportação =====
  async exportReport(
    executionId: string,
    format: ReportFormat,
    userId: string,
    tenantId: string,
  ): Promise<ReportExport> {
    const execution = await this.findExecutionById(executionId, tenantId);

    if (execution.status !== 'completed') {
      throw new BadRequestException('Relatório ainda não foi concluído');
    }

    const exportData = this.reportExportRepository.create({
      executionId,
      format,
      exportedBy: userId,
      tenantId,
      status: ExportStatus.PROCESSING,
    });

    const savedExport = await this.reportExportRepository.save(exportData);

    // Processar exportação em background
    this.processExportAsync(savedExport.id, execution, format);

    return savedExport;
  }

  async findExportById(id: string, tenantId: string): Promise<ReportExport> {
    const exportData = await this.reportExportRepository.findOne({
      where: { id, tenantId },
      relations: ['execution', 'exportedByUser'],
    });

    if (!exportData) {
      throw new NotFoundException('Exportação não encontrada');
    }

    return exportData;
  }

  // ===== Analytics =====
  async getReportAnalytics(tenantId: string, filters?: any): Promise<any> {
    const analytics = await this.reportAnalyticsRepository.findOne({
      where: { tenantId },
    });

    if (!analytics) {
      return this.generateAnalytics(tenantId);
    }

    return analytics;
  }

  async getAdvancedAnalytics(tenantId: string): Promise<any> {
    const [
      totalTemplates,
      totalExecutions,
      totalSchedules,
      recentExecutions,
      popularTemplates,
      executionStats,
    ] = await Promise.all([
      this.reportTemplateRepository.count({ where: { tenantId } }),
      this.reportExecutionRepository.count({ where: { tenantId } }),
      this.reportScheduleRepository.count({ where: { tenantId, isActive: true } }),
      this.reportExecutionRepository.find({
        where: { tenantId },
        order: { createdAt: 'DESC' },
        take: 10,
        relations: ['template'],
      }),
      this.getPopularTemplates(tenantId),
      this.getExecutionStatistics(tenantId),
    ]);

    return {
      overview: {
        totalTemplates,
        totalExecutions,
        totalSchedules,
        activeSchedules: totalSchedules,
      },
      recentActivity: recentExecutions,
      popularTemplates,
      executionStats,
      performance: await this.calculatePerformanceMetrics(tenantId),
    };
  }

  // ===== Métodos Privados =====
  private async executeReportAsync(
    executionId: string,
    template: ReportTemplate,
    parameters: any,
  ): Promise<void> {
    try {
      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 2000));

      const execution = await this.reportExecutionRepository.findOne({
        where: { id: executionId },
      });

      if (execution) {
        execution.status = ExecutionStatus.COMPLETED;
        execution.completedAt = new Date();
        execution.result = await this.generateReportData(template, parameters);
        await this.reportExecutionRepository.save(execution);
      }
    } catch (error) {
      this.logger.error(`Erro na execução do relatório: ${error.message}`);
      
      const execution = await this.reportExecutionRepository.findOne({
        where: { id: executionId },
      });

      if (execution) {
        execution.status = ExecutionStatus.FAILED;
        execution.error = error.message;
        await this.reportExecutionRepository.save(execution);
      }
    }
  }

  private async processExportAsync(
    exportId: string,
    execution: ReportExecution,
    format: ReportFormat,
  ): Promise<void> {
    try {
      // Simular processamento de exportação
      await new Promise(resolve => setTimeout(resolve, 1000));

      const exportData = await this.reportExportRepository.findOne({
        where: { id: exportId },
      });

      if (exportData) {
        exportData.status = ExportStatus.COMPLETED;
        exportData.completedAt = new Date();
        exportData.filePath = `/exports/report_${exportId}.${format}`;
        await this.reportExportRepository.save(exportData);
      }
    } catch (error) {
      this.logger.error(`Erro na exportação: ${error.message}`);
      
      const exportData = await this.reportExportRepository.findOne({
        where: { id: exportId },
      });

      if (exportData) {
        exportData.status = ExportStatus.FAILED;
        exportData.error = error.message;
        await this.reportExportRepository.save(exportData);
      }
    }
  }

  private canExecuteReport(template: ReportTemplate, userId: string): boolean {
    // Implementar lógica de permissões
    return true;
  }

  private calculateNextExecution(frequency: ReportFrequency, startDate: Date): Date {
    const now = new Date();
    const start = startDate || now;

    switch (frequency) {
      case ReportFrequency.DAILY:
        return new Date(start.getTime() + 24 * 60 * 60 * 1000);
      case ReportFrequency.WEEKLY:
        return new Date(start.getTime() + 7 * 24 * 60 * 60 * 1000);
      case ReportFrequency.MONTHLY:
        return new Date(start.getFullYear(), start.getMonth() + 1, start.getDate());
      case ReportFrequency.QUARTERLY:
        return new Date(start.getFullYear(), start.getMonth() + 3, start.getDate());
      case ReportFrequency.SEMI_ANNUAL:
        return new Date(start.getFullYear(), start.getMonth() + 6, start.getDate());
      case ReportFrequency.ANNUAL:
        return new Date(start.getFullYear() + 1, start.getMonth(), start.getDate());
      default:
        return start;
    }
  }

  private async generateReportData(template: ReportTemplate, parameters: any): Promise<any> {
    // Implementar geração de dados baseada no tipo de relatório
    switch (template.type) {
      case ReportType.INSPECTION:
        return await this.generateInspectionReport(parameters);
      case ReportType.COMPLIANCE:
        return await this.generateComplianceReport(parameters);
      case ReportType.SAFETY:
        return await this.generateSafetyReport(parameters);
      case ReportType.ANALYTICS:
        return await this.generateAnalyticsReport(parameters);
      default:
        return { message: 'Relatório gerado com sucesso' };
    }
  }

  private async generateInspectionReport(parameters: any): Promise<any> {
    // Implementar relatório de inspeção
    return {
      type: 'inspection',
      data: 'Dados de inspeção...',
      generatedAt: new Date(),
    };
  }

  private async generateComplianceReport(parameters: any): Promise<any> {
    // Implementar relatório de compliance
    return {
      type: 'compliance',
      data: 'Dados de compliance...',
      generatedAt: new Date(),
    };
  }

  private async generateSafetyReport(parameters: any): Promise<any> {
    // Implementar relatório de segurança
    return {
      type: 'safety',
      data: 'Dados de segurança...',
      generatedAt: new Date(),
    };
  }

  private async generateAnalyticsReport(parameters: any): Promise<any> {
    // Implementar relatório analítico
    return {
      type: 'analytics',
      data: 'Dados analíticos...',
      generatedAt: new Date(),
    };
  }

  private async getPopularTemplates(tenantId: string): Promise<any[]> {
    return await this.reportExecutionRepository
      .createQueryBuilder('execution')
      .select('execution.templateId', 'templateId')
      .addSelect('COUNT(*)', 'executionCount')
      .where('execution.tenantId = :tenantId', { tenantId })
      .groupBy('execution.templateId')
      .orderBy('executionCount', 'DESC')
      .limit(5)
      .getRawMany();
  }

  private async getExecutionStatistics(tenantId: string): Promise<any> {
    const stats = await this.reportExecutionRepository
      .createQueryBuilder('execution')
      .select('execution.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('execution.tenantId = :tenantId', { tenantId })
      .groupBy('execution.status')
      .getRawMany();

    return stats.reduce((acc, stat) => {
      acc[stat.status] = parseInt(stat.count);
      return acc;
    }, {});
  }

  private async calculatePerformanceMetrics(tenantId: string): Promise<any> {
    const executions = await this.reportExecutionRepository.find({
      where: { tenantId, status: ExecutionStatus.COMPLETED },
      select: ['createdAt', 'completedAt'],
    });

    const avgExecutionTime = executions.reduce((total, exec) => {
      if (exec.completedAt) {
        return total + (exec.completedAt.getTime() - exec.createdAt.getTime());
      }
      return total;
    }, 0) / executions.length;

    return {
      averageExecutionTime: avgExecutionTime,
      totalExecutions: executions.length,
      successRate: 95, // Implementar cálculo real
    };
  }

  private async generateAnalytics(tenantId: string): Promise<any> {
    // Implementar geração de analytics
    return {
      tenantId,
      generatedAt: new Date(),
      data: {},
    };
  }
} 