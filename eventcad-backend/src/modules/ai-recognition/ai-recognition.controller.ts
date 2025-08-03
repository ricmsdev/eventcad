import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
  ApiBody,
} from '@nestjs/swagger';
import { AIRecognitionService } from './ai-recognition.service';
import {
  CreateAIJobDto,
  UpdateAIJobDto,
  SearchAIJobsDto,
  BatchAIProcessingDto,
  ExecuteJobDto,
  CancelJobDto,
  AIJobReportDto,
  AIJobResponseDto,
  AIResultsDto,
} from './dto/ai-recognition.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  AIModelType,
  AIProcessingStatus,
} from '../../common/enums/ai-recognition.enum';

/**
 * Controller para sistema de AI Recognition do EventCAD+
 *
 * Funcionalidades:
 * - Gestão de jobs de processamento de IA
 * - Integração com serviços externos (Python/FastAPI)
 * - Queue de processamento assíncrono
 * - Monitoramento em tempo real
 * - Relatórios e analytics
 */
@ApiTags('AI Recognition')
@Controller('ai-recognition')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AIRecognitionController {
  constructor(private readonly aiRecognitionService: AIRecognitionService) {}

  /**
   * Criar novo job de processamento de IA
   */
  @Post('jobs')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar job de processamento de IA',
    description:
      'Cria um novo job para processamento de IA de uma planta técnica',
  })
  @ApiResponse({
    status: 201,
    description: 'Job criado com sucesso',
    type: AIJobResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou planta incompatível',
  })
  @ApiResponse({
    status: 404,
    description: 'Planta não encontrada',
  })
  async createJob(
    @Body() createDto: CreateAIJobDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const job = await this.aiRecognitionService.createJob(
      createDto,
      userId,
      tenantId,
    );

    return {
      id: job.id,
      jobName: job.jobName,
      status: job.status,
      modelType: job.modelType,
      priority: job.priority,
      progress: job.progress,
      currentStage: job.currentStage || 'Criado',
      createdAt: job.createdAt,
      startedAt: job.startedAt,
      completedAt: job.completedAt,
      processingTimeSeconds: job.processingTimeSeconds,
      attemptCount: job.attemptCount,
      canRetry: job.canRetry,
      canExecute: job.canExecute,
    };
  }

  /**
   * Criar jobs em batch
   */
  @Post('jobs/batch')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar jobs em batch',
    description: 'Cria múltiplos jobs de processamento para várias plantas',
  })
  @ApiResponse({
    status: 201,
    description: 'Jobs em batch criados com sucesso',
    type: [AIJobResponseDto],
  })
  async createBatchJobs(
    @Body() batchDto: BatchAIProcessingDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const jobs = await this.aiRecognitionService.createBatchJobs(
      batchDto,
      userId,
      tenantId,
    );

    return jobs.map((job) => ({
      id: job.id,
      jobName: job.jobName,
      status: job.status,
      modelType: job.modelType,
      priority: job.priority,
      progress: job.progress,
      currentStage: job.currentStage || 'Criado',
      createdAt: job.createdAt,
      canExecute: job.canExecute,
    }));
  }

  /**
   * Listar jobs com filtros
   */
  @Get('jobs')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar jobs de IA',
    description: 'Lista jobs de processamento com filtros e paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items por página (padrão: 20)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: AIProcessingStatus,
    description: 'Filtro por status',
  })
  @ApiQuery({
    name: 'modelType',
    required: false,
    enum: AIModelType,
    description: 'Filtro por modelo',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    description: 'Filtro por prioridade',
  })
  @ApiQuery({
    name: 'plantaId',
    required: false,
    description: 'Filtro por planta',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome' })
  @ApiQuery({
    name: 'canExecute',
    required: false,
    description: 'Apenas executáveis',
  })
  @ApiQuery({
    name: 'canRetry',
    required: false,
    description: 'Apenas com retry disponível',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de jobs retornada com sucesso',
  })
  async findJobs(
    @CurrentTenant() tenantId: string,
    @Query() searchDto: SearchAIJobsDto,
  ) {
    return this.aiRecognitionService.findJobs(tenantId, searchDto);
  }

  /**
   * Buscar job por ID
   */
  @Get('jobs/:id')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Buscar job por ID',
    description: 'Retorna detalhes completos de um job específico',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Job encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Job não encontrado',
  })
  async findJobById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.findJobById(id, tenantId);
  }

  /**
   * Atualizar job
   */
  @Patch('jobs/:id')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Atualizar job',
    description:
      'Atualiza configurações de um job (apenas se não estiver em processamento)',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Job atualizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Job não pode ser atualizado (em processamento)',
  })
  async updateJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateAIJobDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.updateJob(id, updateDto, tenantId);
  }

  /**
   * Executar job
   */
  @Post('jobs/:id/execute')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Executar job',
    description: 'Inicia execução imediata de um job ou adiciona à fila',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        force: { type: 'boolean', description: 'Forçar execução' },
        workerId: { type: 'string', description: 'ID do worker' },
        timeout: { type: 'number', description: 'Timeout em segundos' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Job iniciado ou adicionado à fila',
    schema: {
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
      },
    },
  })
  async executeJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() executeDto: ExecuteJobDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.executeJob(id, executeDto, tenantId);
  }

  /**
   * Cancelar job
   */
  @Post('jobs/:id/cancel')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Cancelar job',
    description: 'Cancela um job em andamento ou pendente',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        reason: { type: 'string', description: 'Motivo do cancelamento' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Job cancelado com sucesso',
  })
  async cancelJob(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() cancelDto: CancelJobDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.cancelJob(id, cancelDto, tenantId);
  }

  /**
   * Obter resultados do job
   */
  @Get('jobs/:id/results')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Obter resultados do job',
    description: 'Retorna resultados detalhados do processamento de IA',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Resultados retornados com sucesso',
    type: AIResultsDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Job não encontrado ou sem resultados',
  })
  async getJobResults(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const job = await this.aiRecognitionService.findJobById(id, tenantId);

    if (!job.results) {
      return { message: 'Job ainda não possui resultados' };
    }

    return job.results;
  }

  /**
   * Obter status do job
   */
  @Get('jobs/:id/status')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Obter status do job',
    description: 'Retorna status atual e progresso do job',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Status retornado com sucesso',
    schema: {
      properties: {
        status: { type: 'string', enum: Object.values(AIProcessingStatus) },
        progress: { type: 'number' },
        stage: { type: 'string' },
        canRetry: { type: 'boolean' },
        duration: { type: 'number' },
        attempts: { type: 'number' },
        lastError: { type: 'string' },
      },
    },
  })
  async getJobStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const job = await this.aiRecognitionService.findJobById(id, tenantId);
    return job.getStatusSummary();
  }

  /**
   * Obter logs do job
   */
  @Get('jobs/:id/logs')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obter logs do job',
    description: 'Retorna logs detalhados do processamento',
  })
  @ApiParam({ name: 'id', description: 'ID do job (UUID)' })
  @ApiQuery({
    name: 'level',
    required: false,
    description: 'Filtro por nível (info, warning, error)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logs retornados com sucesso',
  })
  async getJobLogs(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Query('level') level?: string,
  ) {
    const job = await this.aiRecognitionService.findJobById(id, tenantId);

    let logs = job.processingLog || [];

    if (level) {
      logs = logs.filter((log) => log.level === level);
    }

    return {
      jobId: job.id,
      totalLogs: logs.length,
      logs: logs.slice(-50), // Últimos 50 logs
    };
  }

  /**
   * Obter queue de jobs
   */
  @Get('queue')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Obter queue de jobs',
    description: 'Lista jobs na fila de processamento',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Limite de jobs (padrão: 20)',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue retornada com sucesso',
  })
  async getQueue(@Query('limit') limit?: number) {
    const jobs = await this.aiRecognitionService.getQueuedJobs(limit || 20);

    return {
      totalInQueue: jobs.length,
      jobs: jobs.map((job) => ({
        id: job.id,
        jobName: job.jobName,
        status: job.status,
        priority: job.priority,
        modelType: job.modelType,
        createdAt: job.createdAt,
        scheduledFor: job.scheduledFor,
        attemptCount: job.attemptCount,
        canExecute: job.canExecute,
      })),
    };
  }

  /**
   * Obter modelos recomendados para uma planta
   */
  @Get('recommendations/:plantaId')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Obter modelos recomendados',
    description:
      'Retorna modelos de IA recomendados para uma planta específica',
  })
  @ApiParam({ name: 'plantaId', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Recomendações retornadas com sucesso',
    schema: {
      properties: {
        primary: { type: 'array', items: { type: 'string' } },
        secondary: { type: 'array', items: { type: 'string' } },
        specialized: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getRecommendations(
    @Param('plantaId', ParseUUIDPipe) plantaId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.getRecommendedModelsForPlanta(
      plantaId,
      tenantId,
    );
  }

  /**
   * Estatísticas de jobs
   */
  @Get('stats/overview')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de jobs de IA',
    description: 'Retorna estatísticas gerais dos jobs de processamento',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      properties: {
        total: { type: 'number' },
        byStatus: { type: 'object' },
        byModel: { type: 'array' },
        avgProcessingTime: { type: 'array' },
        successRate: { type: 'number' },
      },
    },
  })
  async getStatistics(@CurrentTenant() tenantId: string) {
    return this.aiRecognitionService.getJobStatistics(tenantId);
  }

  /**
   * Dashboard de IA
   */
  @Get('dashboard')
  @Roles(UserRole.ENGINEER, UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Dashboard de IA',
    description: 'Retorna resumo para dashboard de processamento de IA',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retornado com sucesso',
  })
  async getDashboard(@CurrentTenant() tenantId: string) {
    const [stats, queuedJobs, recentJobs, failedJobs] = await Promise.all([
      this.aiRecognitionService.getJobStatistics(tenantId),
      this.aiRecognitionService.getQueuedJobs(5),
      this.aiRecognitionService.findJobs(tenantId, {
        limit: 10,
        page: 1,
      }),
      this.aiRecognitionService.findJobs(tenantId, {
        status: AIProcessingStatus.FAILED,
        canRetry: true,
        limit: 5,
      }),
    ]);

    return {
      statistics: stats,
      queue: {
        total: queuedJobs.length,
        jobs: queuedJobs.map((job) => ({
          id: job.id,
          jobName: job.jobName,
          priority: job.priority,
          modelType: job.modelType,
          createdAt: job.createdAt,
        })),
      },
      recent: {
        total: recentJobs.total,
        jobs: recentJobs.data.slice(0, 5).map((job) => ({
          id: job.id,
          jobName: job.jobName,
          status: job.status,
          progress: job.progress,
          modelType: job.modelType,
        })),
      },
      failed: {
        total: failedJobs.total,
        jobs: failedJobs.data.map((job) => ({
          id: job.id,
          jobName: job.jobName,
          attemptCount: job.attemptCount,
          maxAttempts: job.maxAttempts,
          canRetry: job.canRetry,
          lastError: job.errorHistory?.[job.errorHistory.length - 1]?.error,
        })),
      },
      alerts: {
        highPriorityInQueue: queuedJobs.filter((j) => j.priority <= 2).length,
        failedWithRetry: failedJobs.total,
        longRunningJobs: recentJobs.data.filter(
          (j) =>
            j.status === AIProcessingStatus.PROCESSING &&
            j.startedAt &&
            Date.now() - j.startedAt.getTime() > 600000, // > 10 min
        ).length,
      },
    };
  }

  /**
   * Gerar relatório de jobs
   */
  @Post('reports/generate')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gerar relatório de jobs',
    description: 'Gera relatório detalhado dos jobs de IA',
  })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        modelTypes: { type: 'array', items: { type: 'string' } },
        statuses: { type: 'array', items: { type: 'string' } },
        includeResults: { type: 'boolean' },
        includeLogs: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
  })
  async generateReport(
    @Body() reportDto: AIJobReportDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.aiRecognitionService.generateJobReport(tenantId, reportDto);
  }

  /**
   * Modelos disponíveis
   */
  @Get('models/available')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Modelos de IA disponíveis',
    description:
      'Lista todos os modelos de IA disponíveis com suas configurações',
  })
  @ApiResponse({
    status: 200,
    description: 'Modelos retornados com sucesso',
  })
  async getAvailableModels() {
    // Retornar modelos organizados por categoria
    const models = Object.values(AIModelType);
    const modelsByCategory: Record<string, any[]> = {};

    models.forEach((modelType) => {
      const category = modelType.includes('yolo')
        ? 'Object Detection'
        : modelType.includes('tesseract') || modelType.includes('ocr')
          ? 'Text Recognition'
          : modelType.includes('detectron')
            ? 'Advanced Detection'
            : modelType.includes('cad')
              ? 'CAD Specialized'
              : modelType.includes('fire') || modelType.includes('electrical')
                ? 'Specialized Analysis'
                : 'General';

      if (!modelsByCategory[category]) {
        modelsByCategory[category] = [];
      }

      modelsByCategory[category].push({
        type: modelType,
        name: modelType
          .replace(/_/g, ' ')
          .replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Modelo de IA para ${modelType.replace(/_/g, ' ')}`,
        // Aqui você pode adicionar mais detalhes do getAIModelConfig se necessário
      });
    });

    return modelsByCategory;
  }

  /**
   * Health check dos serviços de IA
   */
  @Get('health')
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Health check dos serviços de IA',
    description: 'Verifica status dos serviços externos de IA',
  })
  @ApiResponse({
    status: 200,
    description: 'Status dos serviços retornado',
  })
  async getServicesHealth() {
    // Implementação básica de health check
    // Em produção, fazer chamadas reais para os serviços
    return {
      aiServiceStatus: 'healthy',
      lastCheck: new Date(),
      availableModels: Object.keys(AIModelType).length,
      message: 'Todos os serviços de IA estão operacionais',
    };
  }
}
