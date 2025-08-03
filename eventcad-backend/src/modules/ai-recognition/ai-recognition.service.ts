import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AIJob } from './entities/ai-job.entity';
import { Planta } from '../planta/entities/planta.entity';
import {
  CreateAIJobDto,
  UpdateAIJobDto,
  SearchAIJobsDto,
  BatchAIProcessingDto,
  ExecuteJobDto,
  CancelJobDto,
  AIJobReportDto,
} from './dto/ai-recognition.dto';
import {
  AIModelType,
  AIProcessingStatus,
  AIObjectCategory,
  getAIModelConfig,
  getRecommendedModels,
  calculateProcessingPriority,
} from '../../common/enums/ai-recognition.enum';
import { PlantaTipo } from '../../common/enums/planta-tipo.enum';

/**
 * Serviço principal de AI Recognition do EventCAD+
 *
 * Funcionalidades:
 * - Gestão de jobs de processamento de IA
 * - Integração com serviços externos Python/FastAPI
 * - Queue de processamento assíncrono
 * - Retry automático com backoff exponencial
 * - Monitoramento em tempo real
 * - Relatórios e analytics
 */
@Injectable()
export class AIRecognitionService {
  private readonly logger = new Logger(AIRecognitionService.name);
  private readonly aiServiceBaseUrl: string;
  private readonly aiServiceTimeout: number;
  private readonly maxConcurrentJobs: number;

  constructor(
    @InjectRepository(AIJob)
    private readonly aiJobRepository: Repository<AIJob>,
    @InjectRepository(Planta)
    private readonly plantaRepository: Repository<Planta>,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceBaseUrl = this.configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8001',
    );
    this.aiServiceTimeout = this.configService.get<number>(
      'AI_SERVICE_TIMEOUT',
      300000,
    ); // 5 min
    this.maxConcurrentJobs = this.configService.get<number>(
      'AI_MAX_CONCURRENT_JOBS',
      3,
    );
  }

  /**
   * Cria novo job de processamento de IA
   */
  async createJob(
    createDto: CreateAIJobDto,
    initiatedBy: string,
    tenantId: string,
  ): Promise<AIJob> {
    // Verificar se a planta existe
    const planta = await this.plantaRepository.findOne({
      where: { id: createDto.plantaId, tenantId, isActive: true },
    });

    if (!planta) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Validar modelo vs formato da planta
    const modelConfig = getAIModelConfig(createDto.modelType);
    const plantaExtension = planta.originalName.split('.').pop()?.toLowerCase();

    if (
      plantaExtension &&
      !modelConfig.supportedFormats.includes(plantaExtension)
    ) {
      throw new BadRequestException(
        `Modelo ${createDto.modelType} não suporta formato ${plantaExtension}. ` +
          `Formatos suportados: ${modelConfig.supportedFormats.join(', ')}`,
      );
    }

    // Calcular prioridade se não especificada
    let priority = createDto.priority;
    if (!priority) {
      priority = calculateProcessingPriority(planta.plantaTipo);
    }

    // Criar job
    const job = this.aiJobRepository.create({
      ...createDto,
      initiatedBy,
      tenantId,
      priority,
      status: AIProcessingStatus.PENDING,
      scheduledFor: createDto.scheduledFor
        ? new Date(createDto.scheduledFor)
        : new Date(),
      maxAttempts: createDto.maxAttempts || 3,
      enableWebhook: createDto.enableWebhook || false,
    });

    const savedJob = await this.aiJobRepository.save(job);

    this.logger.log(
      `Job criado: ${savedJob.id} - ${savedJob.jobName} (${savedJob.modelType})`,
    );

    // Se agendado para agora, adicionar à queue
    if (
      !createDto.scheduledFor ||
      new Date(createDto.scheduledFor) <= new Date()
    ) {
      await this.queueJob(savedJob.id);
    }

    return savedJob;
  }

  /**
   * Cria jobs em batch para múltiplas plantas
   */
  async createBatchJobs(
    batchDto: BatchAIProcessingDto,
    initiatedBy: string,
    tenantId: string,
  ): Promise<AIJob[]> {
    // Verificar plantas
    const plantas = await this.plantaRepository.find({
      where: {
        id: In(batchDto.plantaIds),
        tenantId,
        isActive: true,
      },
    });

    if (plantas.length !== batchDto.plantaIds.length) {
      const foundIds = plantas.map((p) => p.id);
      const missingIds = batchDto.plantaIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Plantas não encontradas: ${missingIds.join(', ')}`,
      );
    }

    const jobs: AIJob[] = [];
    const baseJobName = batchDto.baseJobName || 'Batch Processing';

    for (let i = 0; i < plantas.length; i++) {
      const planta = plantas[i];
      const jobName = `${baseJobName} - ${planta.originalName} (${i + 1}/${plantas.length})`;

      const createJobDto: CreateAIJobDto = {
        jobName,
        plantaId: planta.id,
        modelType: batchDto.modelType,
        priority: batchDto.priority,
        modelConfig: batchDto.modelConfig,
        processingParams: batchDto.processingParams,
      };

      const job = await this.createJob(createJobDto, initiatedBy, tenantId);
      jobs.push(job);
    }

    this.logger.log(
      `Batch criado: ${jobs.length} jobs para ${batchDto.modelType}`,
    );
    return jobs;
  }

  /**
   * Busca jobs com filtros
   */
  async findJobs(
    tenantId: string,
    searchDto: SearchAIJobsDto = {},
  ): Promise<{ data: AIJob[]; total: number; page: number; limit: number }> {
    const page = searchDto.page || 1;
    const limit = Math.min(searchDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.aiJobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.planta', 'planta')
      .leftJoinAndSelect('job.initiator', 'initiator')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.isActive = :isActive', { isActive: true });

    // Aplicar filtros
    if (searchDto.status) {
      queryBuilder.andWhere('job.status = :status', {
        status: searchDto.status,
      });
    }

    if (searchDto.modelType) {
      queryBuilder.andWhere('job.modelType = :modelType', {
        modelType: searchDto.modelType,
      });
    }

    if (searchDto.priority) {
      queryBuilder.andWhere('job.priority = :priority', {
        priority: searchDto.priority,
      });
    }

    if (searchDto.plantaId) {
      queryBuilder.andWhere('job.plantaId = :plantaId', {
        plantaId: searchDto.plantaId,
      });
    }

    if (searchDto.initiatedBy) {
      queryBuilder.andWhere('job.initiatedBy = :initiatedBy', {
        initiatedBy: searchDto.initiatedBy,
      });
    }

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(job.jobName ILIKE :search OR job.description ILIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.createdFrom) {
      queryBuilder.andWhere('job.createdAt >= :createdFrom', {
        createdFrom: new Date(searchDto.createdFrom),
      });
    }

    if (searchDto.createdTo) {
      queryBuilder.andWhere('job.createdAt <= :createdTo', {
        createdTo: new Date(searchDto.createdTo),
      });
    }

    // Filtros especiais
    if (searchDto.canExecute !== undefined) {
      if (searchDto.canExecute) {
        queryBuilder.andWhere(
          '(job.status IN (:...executableStatuses) OR (job.status = :failedStatus AND job.attemptCount < job.maxAttempts AND (job.nextRetryAt IS NULL OR job.nextRetryAt <= :now)))',
          {
            executableStatuses: [
              AIProcessingStatus.PENDING,
              AIProcessingStatus.QUEUED,
            ],
            failedStatus: AIProcessingStatus.FAILED,
            now: new Date(),
          },
        );
      }
    }

    if (searchDto.canRetry !== undefined) {
      if (searchDto.canRetry) {
        queryBuilder.andWhere(
          'job.status = :failedStatus AND job.attemptCount < job.maxAttempts AND (job.nextRetryAt IS NULL OR job.nextRetryAt <= :now)',
          {
            failedStatus: AIProcessingStatus.FAILED,
            now: new Date(),
          },
        );
      }
    }

    // Ordenação
    queryBuilder
      .orderBy('job.priority', 'ASC')
      .addOrderBy('job.createdAt', 'ASC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Busca job por ID
   */
  async findJobById(id: string, tenantId: string): Promise<AIJob> {
    const job = await this.aiJobRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: ['planta', 'initiator'],
    });

    if (!job) {
      throw new NotFoundException('Job não encontrado');
    }

    return job;
  }

  /**
   * Atualiza job
   */
  async updateJob(
    id: string,
    updateDto: UpdateAIJobDto,
    tenantId: string,
  ): Promise<AIJob> {
    const job = await this.findJobById(id, tenantId);

    // Verificar se pode ser atualizado
    if (job.isProcessing) {
      throw new BadRequestException(
        'Não é possível atualizar job em processamento',
      );
    }

    Object.assign(job, {
      ...updateDto,
      scheduledFor: updateDto.scheduledFor
        ? new Date(updateDto.scheduledFor)
        : job.scheduledFor,
    });

    return this.aiJobRepository.save(job);
  }

  /**
   * Executa job específico
   */
  async executeJob(
    id: string,
    executeDto: ExecuteJobDto = {},
    tenantId: string,
  ): Promise<{ success: boolean; message: string }> {
    const job = await this.findJobById(id, tenantId);

    // Verificar se pode ser executado
    if (!job.canExecute && !executeDto.force) {
      throw new BadRequestException(
        `Job não pode ser executado no status ${job.status}. Use force=true para forçar.`,
      );
    }

    // Verificar limites de concorrência
    const runningJobs = await this.aiJobRepository.count({
      where: {
        tenantId,
        status: In([AIProcessingStatus.PROCESSING, AIProcessingStatus.QUEUED]),
      },
    });

    if (runningJobs >= this.maxConcurrentJobs && !executeDto.force) {
      await this.queueJob(job.id);
      return {
        success: true,
        message: `Job adicionado à fila. ${runningJobs} jobs em execução.`,
      };
    }

    // Executar imediatamente
    await this.processJobImmediately(job, executeDto);

    return {
      success: true,
      message: 'Job iniciado para execução imediata',
    };
  }

  /**
   * Cancela job
   */
  async cancelJob(
    id: string,
    cancelDto: CancelJobDto = {},
    tenantId: string,
  ): Promise<AIJob> {
    const job = await this.findJobById(id, tenantId);

    if (job.isCompleted) {
      throw new BadRequestException('Não é possível cancelar job já concluído');
    }

    job.cancel(cancelDto.reason);
    return this.aiJobRepository.save(job);
  }

  /**
   * Obtém estatísticas de jobs
   */
  async getJobStatistics(tenantId: string) {
    const [total, pending, processing, completed, failed, cancelled] =
      await Promise.all([
        this.aiJobRepository.count({ where: { tenantId, isActive: true } }),
        this.aiJobRepository.count({
          where: { tenantId, status: AIProcessingStatus.PENDING },
        }),
        this.aiJobRepository.count({
          where: { tenantId, status: AIProcessingStatus.PROCESSING },
        }),
        this.aiJobRepository.count({
          where: { tenantId, status: AIProcessingStatus.COMPLETED },
        }),
        this.aiJobRepository.count({
          where: { tenantId, status: AIProcessingStatus.FAILED },
        }),
        this.aiJobRepository.count({
          where: { tenantId, status: AIProcessingStatus.CANCELLED },
        }),
      ]);

    // Estatísticas por modelo
    const byModel = await this.aiJobRepository
      .createQueryBuilder('job')
      .select('job.modelType, COUNT(*) as count')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.isActive = :isActive', { isActive: true })
      .groupBy('job.modelType')
      .getRawMany();

    // Tempo médio de processamento por modelo
    const avgProcessingTime = await this.aiJobRepository
      .createQueryBuilder('job')
      .select('job.modelType, AVG(job.processingTimeSeconds) as avgTime')
      .where('job.tenantId = :tenantId', { tenantId })
      .andWhere('job.status = :status', {
        status: AIProcessingStatus.COMPLETED,
      })
      .andWhere('job.processingTimeSeconds IS NOT NULL')
      .groupBy('job.modelType')
      .getRawMany();

    return {
      total,
      byStatus: {
        pending,
        processing,
        completed,
        failed,
        cancelled,
      },
      byModel,
      avgProcessingTime,
      successRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Obtém jobs da queue prontos para execução
   */
  async getQueuedJobs(limit: number = 10): Promise<AIJob[]> {
    return this.aiJobRepository.find({
      where: [
        { status: AIProcessingStatus.PENDING },
        { status: AIProcessingStatus.QUEUED },
        {
          status: AIProcessingStatus.FAILED,
          nextRetryAt: LessThanOrEqual(new Date()),
        },
      ],
      order: {
        priority: 'ASC',
        createdAt: 'ASC',
      },
      take: limit,
      relations: ['planta'],
    });
  }

  /**
   * Obtém modelos recomendados para uma planta
   */
  async getRecommendedModelsForPlanta(
    plantaId: string,
    tenantId: string,
  ): Promise<{
    primary: AIModelType[];
    secondary: AIModelType[];
    specialized: AIModelType[];
  }> {
    const planta = await this.plantaRepository.findOne({
      where: { id: plantaId, tenantId },
    });

    if (!planta) {
      throw new NotFoundException('Planta não encontrada');
    }

    const recommended = getRecommendedModels(planta.plantaTipo);

    return {
      primary: recommended.slice(0, 2),
      secondary: recommended.slice(2, 4),
      specialized: recommended.slice(4),
    };
  }

  /**
   * Gera relatório de jobs
   */
  async generateJobReport(
    tenantId: string,
    reportDto: AIJobReportDto = {},
  ): Promise<any> {
    const queryBuilder = this.aiJobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.planta', 'planta')
      .where('job.tenantId = :tenantId', { tenantId });

    // Filtros de data
    if (reportDto.startDate) {
      queryBuilder.andWhere('job.createdAt >= :startDate', {
        startDate: new Date(reportDto.startDate),
      });
    }

    if (reportDto.endDate) {
      queryBuilder.andWhere('job.createdAt <= :endDate', {
        endDate: new Date(reportDto.endDate),
      });
    }

    // Filtros por tipo
    if (reportDto.modelTypes && reportDto.modelTypes.length > 0) {
      queryBuilder.andWhere('job.modelType IN (:...modelTypes)', {
        modelTypes: reportDto.modelTypes,
      });
    }

    if (reportDto.statuses && reportDto.statuses.length > 0) {
      queryBuilder.andWhere('job.status IN (:...statuses)', {
        statuses: reportDto.statuses,
      });
    }

    const jobs = await queryBuilder.getMany();

    // Gerar relatório
    const report = {
      period: {
        start: reportDto.startDate || jobs[0]?.createdAt,
        end: reportDto.endDate || new Date(),
      },
      summary: {
        totalJobs: jobs.length,
        completedJobs: jobs.filter(
          (j) => j.status === AIProcessingStatus.COMPLETED,
        ).length,
        failedJobs: jobs.filter((j) => j.status === AIProcessingStatus.FAILED)
          .length,
        avgProcessingTime: this.calculateAvgProcessingTime(jobs),
        totalProcessingTime: this.calculateTotalProcessingTime(jobs),
      },
      byModel: this.groupJobsByModel(jobs),
      byStatus: this.groupJobsByStatus(jobs),
      performance: this.calculatePerformanceMetrics(jobs),
      jobs: reportDto.includeResults
        ? jobs.map((j) => j.exportForReport())
        : undefined,
    };

    return report;
  }

  // Métodos privados

  private async queueJob(jobId: string): Promise<void> {
    await this.aiJobRepository.update(jobId, {
      status: AIProcessingStatus.QUEUED,
    });

    this.logger.log(`Job adicionado à fila: ${jobId}`);
  }

  private async processJobImmediately(
    job: AIJob,
    executeDto: ExecuteJobDto,
  ): Promise<void> {
    const workerId = executeDto.workerId || `worker-${Date.now()}`;
    const sessionId = `session-${Date.now()}`;

    // Iniciar job
    job.start(workerId, sessionId);
    await this.aiJobRepository.save(job);

    // Processar assincronamente
    this.processJobAsync(
      job,
      executeDto.timeout || this.aiServiceTimeout,
    ).catch((error) => {
      this.logger.error(`Erro no processamento do job ${job.id}:`, error);
    });
  }

  private async processJobAsync(job: AIJob, timeout: number): Promise<void> {
    try {
      const modelConfig = getAIModelConfig(job.modelType);

      // Preparar dados para envio
      const requestData = await this.prepareRequestData(job);

      // Fazer chamada para serviço de IA
      job.updateProgress(10, 'Enviando para processamento de IA');
      await this.aiJobRepository.save(job);

      const response = await this.callAIService(
        modelConfig.endpoint,
        requestData,
        timeout,
      );

      job.updateProgress(90, 'Processando resultados');
      await this.aiJobRepository.save(job);

      // Processar resultados
      const results = await this.processAIResponse(response.data, job);

      // Completar job
      job.complete(results);
      await this.aiJobRepository.save(job);

      // Atualizar planta com resultados
      await this.updatePlantaWithResults(job.plantaId, results);

      this.logger.log(`Job concluído com sucesso: ${job.id}`);
    } catch (error) {
      job.fail(error.message, error.stack);
      await this.aiJobRepository.save(job);

      this.logger.error(`Job falhou: ${job.id} - ${error.message}`);
    }
  }

  private async prepareRequestData(job: AIJob): Promise<any> {
    const planta = await this.plantaRepository.findOne({
      where: { id: job.plantaId },
    });

    return {
      file_url: planta?.filename, // Usar filename como URL temporária
      file_path: planta?.filename, // Usar filename como path também
      file_type: planta?.mimeType,
      model_config: job.modelConfig,
      processing_params: job.processingParams,
      job_id: job.id,
      plant_type: planta?.plantaTipo,
    };
  }

  private async callAIService(
    endpoint: string,
    data: any,
    timeout: number,
  ): Promise<any> {
    const fullUrl = `${this.aiServiceBaseUrl}${endpoint}`;

    return axios.post(fullUrl, data, {
      timeout,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.configService.get('AI_SERVICE_TOKEN', '')}`,
      },
    });
  }

  private async processAIResponse(
    responseData: any,
    job: AIJob,
  ): Promise<AIJob['results']> {
    // Processar resposta do serviço de IA
    return {
      detected_objects: responseData.detected_objects || [],
      extracted_text: responseData.extracted_text || [],
      layer_analysis: (responseData.layer_analysis || []).map((layer: any) => ({
        layer: layer.layer_name || layer.layer,
        objectCount: layer.object_count || layer.objectCount,
        recognizedTypes: layer.object_types || layer.recognizedTypes || [],
        confidence: layer.confidence || 0,
      })),
      dimensions: responseData.dimensions || [],
      compliance_analysis: responseData.compliance_analysis || [],
      extracted_metadata: responseData.extracted_metadata || {},
      statistics: {
        total_objects_detected: responseData.detected_objects?.length || 0,
        confidence_avg: this.calculateAverageConfidence(
          responseData.detected_objects || [],
        ),
        confidence_min: this.calculateMinConfidence(
          responseData.detected_objects || [],
        ),
        confidence_max: this.calculateMaxConfidence(
          responseData.detected_objects || [],
        ),
        processing_time_ms: responseData.processing_time_ms || 0,
        model_version: responseData.model_version || job.modelType,
      },
      generated_files: responseData.generated_files || [],
    };
  }

  private async updatePlantaWithResults(
    plantaId: string,
    results: AIJob['results'],
  ): Promise<void> {
    const planta = await this.plantaRepository.findOne({
      where: { id: plantaId },
    });

    if (planta) {
      planta.updateAIProcessing({
        status: 'completed',
        completedAt: new Date(),
        detectedObjects: results?.detected_objects || [],
        layerAnalysis:
          results?.layer_analysis?.map((layer: any) => ({
            layer: layer.layer,
            objectCount: layer.objectCount,
            recognizedTypes: layer.recognizedTypes,
            confidence: layer.confidence,
          })) || [],
        textRecognition: results?.extracted_text || [],
      });

      await this.plantaRepository.save(planta);
    }
  }

  private calculateAvgProcessingTime(jobs: AIJob[]): number {
    const completedJobs = jobs.filter((j) => j.processingTimeSeconds);
    if (completedJobs.length === 0) return 0;

    const total = completedJobs.reduce(
      (sum, job) => sum + (job.processingTimeSeconds || 0),
      0,
    );
    return Math.round(total / completedJobs.length);
  }

  private calculateTotalProcessingTime(jobs: AIJob[]): number {
    return jobs.reduce((sum, job) => sum + (job.processingTimeSeconds || 0), 0);
  }

  private groupJobsByModel(jobs: AIJob[]): Record<string, number> {
    return jobs.reduce(
      (acc, job) => {
        acc[job.modelType] = (acc[job.modelType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private groupJobsByStatus(jobs: AIJob[]): Record<string, number> {
    return jobs.reduce(
      (acc, job) => {
        acc[job.status] = (acc[job.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private calculatePerformanceMetrics(jobs: AIJob[]): any {
    const completedJobs = jobs.filter(
      (j) => j.status === AIProcessingStatus.COMPLETED,
    );
    const failedJobs = jobs.filter(
      (j) => j.status === AIProcessingStatus.FAILED,
    );

    return {
      successRate:
        jobs.length > 0 ? (completedJobs.length / jobs.length) * 100 : 0,
      failureRate:
        jobs.length > 0 ? (failedJobs.length / jobs.length) * 100 : 0,
      avgRetries:
        jobs.length > 0
          ? jobs.reduce((sum, j) => sum + j.attemptCount, 0) / jobs.length
          : 0,
    };
  }

  private calculateAverageConfidence(objects: any[]): number {
    if (objects.length === 0) return 0;
    const sum = objects.reduce((acc, obj) => acc + (obj.confidence || 0), 0);
    return sum / objects.length;
  }

  private calculateMinConfidence(objects: any[]): number {
    if (objects.length === 0) return 0;
    return Math.min(...objects.map((obj) => obj.confidence || 0));
  }

  private calculateMaxConfidence(objects: any[]): number {
    if (objects.length === 0) return 0;
    return Math.max(...objects.map((obj) => obj.confidence || 0));
  }
}
