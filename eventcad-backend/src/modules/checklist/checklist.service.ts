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
} from 'typeorm';
import { Checklist } from './entities/checklist.entity';
import { ChecklistItem } from './entities/checklist-item.entity';
import {
  ChecklistStatus,
  ChecklistType,
  ChecklistPriority,
  ChecklistFrequency,
} from './entities/checklist.entity';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Serviço para gestão de checklists do EventCAD+
 *
 * Funcionalidades:
 * - CRUD completo de checklists e templates
 * - Sistema de execução e validação
 * - Workflow de aprovação
 * - Agendamento automático
 * - Notificações e alertas
 * - Analytics e relatórios
 * - Integração com objetos de infraestrutura
 */
@Injectable()
export class ChecklistService {
  private readonly logger = new Logger(ChecklistService.name);

  constructor(
    @InjectRepository(Checklist)
    private readonly checklistRepository: Repository<Checklist>,
    @InjectRepository(ChecklistItem)
    private readonly checklistItemRepository: Repository<ChecklistItem>,
  ) {}

  /**
   * Cria novo checklist
   */
  async create(
    createDto: any,
    createdBy: string,
    tenantId: string,
  ): Promise<Checklist> {
    this.logger.log(`Criando checklist: ${createDto.name}`);

    // Verificar se a planta existe (comentado temporariamente)
    // if (createDto.plantaId) {
    //   const planta = await this.plantaRepository.findOne({
    //     where: { id: createDto.plantaId, tenantId, isActive: true },
    //   });

    //   if (!planta) {
    //     throw new NotFoundException('Planta não encontrada');
    //   }
    // }

    // Validar tipo e configurações
    this.validateChecklistConfig(createDto.type, createDto.frequency);

    // Criar checklist
    const newChecklist = this.checklistRepository.create({
      ...createDto,
      tenantId,
      createdBy,
      status: createDto.status || ChecklistStatus.DRAFT,
      priority: createDto.priority || ChecklistPriority.MEDIUM,
      frequency: createDto.frequency || ChecklistFrequency.ON_DEMAND,
    });

    const savedChecklist = await this.checklistRepository.save(newChecklist);

    // Verificar se savedChecklist é um array e pegar o primeiro elemento
    const checklist = Array.isArray(savedChecklist) ? savedChecklist[0] : savedChecklist;

    // Criar itens se fornecidos
    if (createDto.items && createDto.items.length > 0) {
      await this.createChecklistItems(checklist.id, createDto.items, createdBy);
    }

    // Calcular próxima execução se agendado
    if (checklist.frequency !== ChecklistFrequency.ON_DEMAND) {
      checklist.scheduleNextExecution();
      await this.checklistRepository.save(checklist);
    }

    this.logger.log(
      `Checklist criado: ${checklist.id} - ${checklist.name} (${checklist.type})`,
    );

    return checklist;
  }

  /**
   * Busca checklists com filtros avançados
   */
  async findAll(
    tenantId: string,
    searchDto: any = {},
  ): Promise<{
    data: Checklist[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = searchDto.page || 1;
    const limit = Math.min(searchDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .leftJoinAndSelect('checklist.planta', 'planta')
      .leftJoinAndSelect('checklist.createdByUser', 'creator')
      .leftJoinAndSelect('checklist.assignedTo', 'assignedTo')
      .leftJoinAndSelect('checklist.items', 'items')
      .leftJoinAndSelect('checklist.executions', 'executions')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true });

    // Aplicar filtros
    if (searchDto.plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', {
        plantaId: searchDto.plantaId,
      });
    }

    if (searchDto.status) {
      queryBuilder.andWhere('checklist.status = :status', {
        status: searchDto.status,
      });
    }

    if (searchDto.type) {
      queryBuilder.andWhere('checklist.type = :type', {
        type: searchDto.type,
      });
    }

    if (searchDto.priority) {
      queryBuilder.andWhere('checklist.priority = :priority', {
        priority: searchDto.priority,
      });
    }

    if (searchDto.frequency) {
      queryBuilder.andWhere('checklist.frequency = :frequency', {
        frequency: searchDto.frequency,
      });
    }

    if (searchDto.assignedTo) {
      queryBuilder.andWhere('checklist.assignedToId = :assignedTo', {
        assignedTo: searchDto.assignedTo,
      });
    }

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(checklist.name ILIKE :search OR checklist.description ILIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.createdBy) {
      queryBuilder.andWhere('checklist.createdBy = :createdBy', {
        createdBy: searchDto.createdBy,
      });
    }

    if (searchDto.createdFrom) {
      queryBuilder.andWhere('checklist.createdAt >= :createdFrom', {
        createdFrom: new Date(searchDto.createdFrom),
      });
    }

    if (searchDto.createdTo) {
      queryBuilder.andWhere('checklist.createdAt <= :createdTo', {
        createdTo: new Date(searchDto.createdTo),
      });
    }

    // Filtros especiais
    if (searchDto.overdue !== undefined) {
      if (searchDto.overdue) {
        queryBuilder.andWhere('checklist.dueDate < :now', { now: new Date() });
      } else {
        queryBuilder.andWhere('(checklist.dueDate >= :now OR checklist.dueDate IS NULL)', { now: new Date() });
      }
    }

    if (searchDto.needsAttention !== undefined) {
      if (searchDto.needsAttention) {
        queryBuilder.andWhere(
          '(checklist.status IN (:...attentionStatuses) OR checklist.dueDate < :now)',
          {
            attentionStatuses: [
              ChecklistStatus.PENDING_APPROVAL,
              ChecklistStatus.IN_PROGRESS,
            ],
            now: new Date(),
          },
        );
      }
    }

    // Ordenação
    queryBuilder
      .orderBy('checklist.priority', 'DESC')
      .addOrderBy('checklist.dueDate', 'ASC')
      .addOrderBy('checklist.createdAt', 'DESC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Busca checklist por ID
   */
  async findById(id: string, tenantId: string): Promise<Checklist> {
    const checklist = await this.checklistRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: [
        'planta',
        'createdByUser',
        'assignedTo',
        'approver',
        'items',
        'executions',
        'validations',
        'relatedInfraObjects',
        'template',
      ],
    });

    if (!checklist) {
      throw new NotFoundException('Checklist não encontrado');
    }

    return checklist;
  }

  /**
   * Atualiza checklist
   */
  async update(
    id: string,
    updateDto: any,
    updatedBy: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<Checklist> {
    const checklist = await this.findById(id, tenantId);

    // Verificar permissões
    this.validateUpdatePermissions(checklist, updatedBy, userRole);

    const oldValues = { ...checklist };

    // Aplicar atualizações
    Object.assign(checklist, updateDto);

    // Se mudou status, registrar
    if (updateDto.status && updateDto.status !== oldValues.status) {
      checklist.updateStatus(updateDto.status, updatedBy);
    }

    // Se mudou frequência, recalcular próxima execução
    if (updateDto.frequency && updateDto.frequency !== oldValues.frequency) {
      checklist.scheduleNextExecution();
    }

    // Atualizar itens se fornecidos
    if (updateDto.items) {
      await this.updateChecklistItems(id, updateDto.items, updatedBy);
    }

    return this.checklistRepository.save(checklist);
  }

  /**
   * Remove checklist
   */
  async remove(id: string, tenantId: string, userRole: UserRole): Promise<void> {
    const checklist = await this.findById(id, tenantId);

    // Verificar permissões
    this.validateDeletePermissions(checklist, userRole);

    checklist.isActive = false;
    await this.checklistRepository.save(checklist);

    this.logger.log(`Checklist removido: ${id}`);
  }

  /**
   * Executa checklist
   */
  async executeChecklist(
    id: string,
    executionDto: any,
    executedBy: string,
    tenantId: string,
  ): Promise<any> {
    const checklist = await this.findById(id, tenantId);

    if (checklist.status !== ChecklistStatus.ACTIVE) {
      throw new BadRequestException('Checklist não está ativo para execução');
    }

    // Criar execução
    const execution = {
      checklistId: id,
      executedBy,
      tenantId,
      startedAt: new Date(),
      status: 'in_progress',
      items: executionDto.items || [],
    };

    // Atualizar status do checklist
    checklist.status = ChecklistStatus.IN_PROGRESS;
    await this.checklistRepository.save(checklist);

    this.logger.log(`Execução iniciada: ${id} por ${executedBy}`);

    return execution;
  }

  /**
   * Finaliza execução do checklist
   */
  async completeExecution(
    executionId: string,
    completionDto: any,
    completedBy: string,
    tenantId: string,
  ): Promise<any> {
    // Implementar lógica de finalização
    const execution = {
      id: executionId,
      completedAt: new Date(),
      status: 'completed',
      score: completionDto.score,
      notes: completionDto.notes,
    };

    this.logger.log(`Execução finalizada: ${executionId}`);

    return execution;
  }

  /**
   * Aprova checklist
   */
  async approveChecklist(
    id: string,
    approvedBy: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<Checklist> {
    const checklist = await this.findById(id, tenantId);

    // Verificar permissões para aprovação
    this.validateApprovalPermissions(checklist, userRole);

    checklist.status = ChecklistStatus.APPROVED;
    checklist.approvedBy = approvedBy;
    checklist.approvedAt = new Date();

    return this.checklistRepository.save(checklist);
  }

  /**
   * Rejeita checklist
   */
  async rejectChecklist(
    id: string,
    rejectedBy: string,
    tenantId: string,
    reason?: string,
  ): Promise<Checklist> {
    const checklist = await this.findById(id, tenantId);

    checklist.status = ChecklistStatus.REJECTED;
    checklist.rejectedBy = rejectedBy;
    checklist.rejectedAt = new Date();
    checklist.rejectionReason = reason;

    return this.checklistRepository.save(checklist);
  }

  /**
   * Obtém estatísticas de checklists
   */
  async getStatistics(tenantId: string, plantaId?: string) {
    const where: any = { tenantId, isActive: true };
    if (plantaId) {
      where.plantaId = plantaId;
    }

    const [
      total,
      byStatus,
      byType,
      byPriority,
      byFrequency,
      overdue,
      completed,
      avgScore,
    ] = await Promise.all([
      this.checklistRepository.count({ where }),
      this.getCountByField('status', where),
      this.getCountByField('type', where),
      this.getCountByField('priority', where),
      this.getCountByField('frequency', where),
      this.checklistRepository.count({
        where: { ...where, dueDate: LessThanOrEqual(new Date()) },
      }),
      this.checklistRepository.count({
        where: { ...where, status: ChecklistStatus.COMPLETED },
      }),
      this.calculateAverageScore(where),
    ]);

    return {
      total,
      byStatus,
      byType,
      byPriority,
      byFrequency,
      overdue,
      completed,
      avgScore,
      completionRate: total > 0 ? (completed / total) * 100 : 0,
    };
  }

  /**
   * Gera relatório de checklists
   */
  async generateReport(
    tenantId: string,
    reportDto: any = {},
  ): Promise<any> {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .leftJoinAndSelect('checklist.planta', 'planta')
      .leftJoinAndSelect('checklist.createdByUser', 'creator')
      .leftJoinAndSelect('checklist.executions', 'executions')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true });

    // Filtros de data
    if (reportDto.startDate) {
      queryBuilder.andWhere('checklist.createdAt >= :startDate', {
        startDate: new Date(reportDto.startDate),
      });
    }

    if (reportDto.endDate) {
      queryBuilder.andWhere('checklist.createdAt <= :endDate', {
        endDate: new Date(reportDto.endDate),
      });
    }

    // Filtros por tipo
    if (reportDto.types && reportDto.types.length > 0) {
      queryBuilder.andWhere('checklist.type IN (:...types)', {
        types: reportDto.types,
      });
    }

    if (reportDto.statuses && reportDto.statuses.length > 0) {
      queryBuilder.andWhere('checklist.status IN (:...statuses)', {
        statuses: reportDto.statuses,
      });
    }

    const checklists = await queryBuilder.getMany();

    // Gerar relatório
    const report = {
      period: {
        start: reportDto.startDate || checklists[0]?.createdAt,
        end: reportDto.endDate || new Date(),
      },
      summary: {
        totalChecklists: checklists.length,
        completedChecklists: checklists.filter(
          (c) => c.status === ChecklistStatus.COMPLETED,
        ).length,
        overdueChecklists: checklists.filter(
          (c) => c.dueDate && c.dueDate < new Date(),
        ).length,
        avgScore: this.calculateAverageFromChecklists(checklists),
      },
      byType: this.groupChecklistsByField(checklists, 'type'),
      byStatus: this.groupChecklistsByField(checklists, 'status'),
      byPriority: this.groupChecklistsByField(checklists, 'priority'),
      qualityAnalysis: reportDto.includeQualityAnalysis
        ? this.analyzeQuality(checklists)
        : undefined,
      checklists: reportDto.includeDetails
        ? checklists.map((c) => this.exportForReport(c))
        : undefined,
    };

    return report;
  }

  /**
   * Obtém checklists vencidos
   */
  async getOverdueChecklists(tenantId: string, plantaId?: string): Promise<Checklist[]> {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .leftJoinAndSelect('checklist.planta', 'planta')
      .leftJoinAndSelect('checklist.assignedTo', 'assignedTo')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true })
      .andWhere('checklist.dueDate < :now', { now: new Date() })
      .andWhere('checklist.status NOT IN (:...completedStatuses)', {
        completedStatuses: [ChecklistStatus.COMPLETED, ChecklistStatus.APPROVED],
      });

    if (plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', { plantaId });
    }

    return await queryBuilder.getMany();
  }

  /**
   * Obtém checklists que precisam de atenção
   */
  async getChecklistsNeedingAttention(tenantId: string): Promise<Checklist[]> {
    return await this.checklistRepository
      .createQueryBuilder('checklist')
      .leftJoinAndSelect('checklist.planta', 'planta')
      .leftJoinAndSelect('checklist.assignedTo', 'assignedTo')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true })
      .andWhere(
        '(checklist.status IN (:...attentionStatuses) OR checklist.dueDate < :now)',
        {
          attentionStatuses: [
            ChecklistStatus.PENDING_APPROVAL,
            ChecklistStatus.IN_PROGRESS,
          ],
          now: new Date(),
        },
      )
      .orderBy('checklist.priority', 'DESC')
      .addOrderBy('checklist.dueDate', 'ASC')
      .getMany();
  }

  // Métodos privados

  private validateChecklistConfig(type: ChecklistType, frequency: ChecklistFrequency): void {
    // Validar configurações específicas do tipo
    if (type === ChecklistType.SAFETY && frequency === ChecklistFrequency.ANNUAL) {
      throw new BadRequestException('Checklists de segurança devem ter frequência maior que anual');
    }
  }

  private validateUpdatePermissions(
    checklist: Checklist,
    userId: string,
    userRole: UserRole,
  ): void {
    // Criador pode sempre editar
    if (checklist.createdBy === userId) return;

    // Admins podem editar qualquer checklist
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) return;

    // Engenheiros podem editar checklists não críticos
    if (
      userRole === UserRole.ENGINEER &&
      checklist.priority !== ChecklistPriority.CRITICAL
    )
      return;

    throw new ForbiddenException('Sem permissão para editar este checklist');
  }

  private validateDeletePermissions(
    checklist: Checklist,
    userRole: UserRole,
  ): void {
    // Apenas admins podem remover
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) return;

    throw new ForbiddenException('Sem permissão para remover checklists');
  }

  private validateApprovalPermissions(
    checklist: Checklist,
    userRole: UserRole,
  ): void {
    // Apenas engenheiros e admins podem aprovar
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENGINEER].includes(
        userRole,
      )
    )
      return;

    throw new ForbiddenException('Sem permissão para aprovar checklists');
  }

  private async createChecklistItems(
    checklistId: string,
    items: any[],
    createdBy: string,
  ): Promise<void> {
    for (let i = 0; i < items.length; i++) {
      const item = this.checklistItemRepository.create({
        ...items[i],
        checklistId,
        order: i + 1,
        createdBy,
      });
      await this.checklistItemRepository.save(item);
    }
  }

  private async updateChecklistItems(
    checklistId: string,
    items: any[],
    updatedBy: string,
  ): Promise<void> {
    // Remover itens existentes
    await this.checklistItemRepository.delete({ checklistId });

    // Criar novos itens
    await this.createChecklistItems(checklistId, items, updatedBy);
  }

  private async getCountByField(field: string, where: any): Promise<any[]> {
    return this.checklistRepository
      .createQueryBuilder('checklist')
      .select(`checklist.${field}, COUNT(*) as count`)
      .where(where)
      .groupBy(`checklist.${field}`)
      .getRawMany();
  }

  private async calculateAverageScore(where: any): Promise<number> {
    const checklists = await this.checklistRepository.find({ where });
    return this.calculateAverageFromChecklists(checklists);
  }

  private calculateAverageFromChecklists(checklists: Checklist[]): number {
    const completedChecklists = checklists.filter(
      (c) => c.status === ChecklistStatus.COMPLETED && c.score !== null,
    );
    
    if (completedChecklists.length === 0) return 0;
    
    const sum = completedChecklists.reduce((total, checklist) => total + (checklist.score || 0), 0);
    return Math.round(sum / completedChecklists.length);
  }

  private groupChecklistsByField(
    checklists: Checklist[],
    field: string,
  ): Record<string, number> {
    return checklists.reduce(
      (acc, checklist) => {
        const value = (checklist as any)[field] || 'unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private analyzeQuality(checklists: Checklist[]): any {
    const scores = checklists
      .filter((c) => c.status === ChecklistStatus.COMPLETED)
      .map((c) => c.score || 0);

    return {
      scoreDistribution: {
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        fair: scores.filter((s) => s >= 50 && s < 70).length,
        poor: scores.filter((s) => s < 50).length,
      },
      recommendations: this.generateQualityRecommendations(checklists),
    };
  }

  private generateQualityRecommendations(checklists: Checklist[]): string[] {
    const recommendations: string[] = [];

    const overdue = checklists.filter(
      (c) => c.dueDate && c.dueDate < new Date() && c.status !== ChecklistStatus.COMPLETED,
    );
    if (overdue.length > 0) {
      recommendations.push(
        `${overdue.length} checklists vencidos precisam de atenção imediata`,
      );
    }

    const pendingApproval = checklists.filter(
      (c) => c.status === ChecklistStatus.PENDING_APPROVAL,
    );
    if (pendingApproval.length > 0) {
      recommendations.push(
        `${pendingApproval.length} checklists aguardam aprovação`,
      );
    }

    const lowScore = checklists.filter(
      (c) => c.status === ChecklistStatus.COMPLETED && c.score && c.score < 50,
    );
    if (lowScore.length > 0) {
      recommendations.push(
        `${lowScore.length} checklists completados com baixa pontuação precisam de revisão`,
      );
    }

    return recommendations;
  }

  private exportForReport(checklist: Checklist): any {
    return {
      id: checklist.id,
      name: checklist.name,
      type: checklist.type,
      status: checklist.status,
      priority: checklist.priority,
      dueDate: checklist.dueDate,
      score: checklist.score,
      createdAt: checklist.createdAt,
      completedAt: checklist.completedAt,
      planta: checklist.planta ? {
        id: checklist.planta.id,
        name: checklist.planta.originalName,
      } : null,
      assignedTo: checklist.assignedTo ? {
        id: checklist.assignedTo,
        name: checklist.assignedTo,
      } : null,
    };
  }

  // Métodos avançados para o "Lord Lucifer"
  async getAdvancedAnalytics(tenantId: string, plantaId?: string) {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true });

    if (plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', { plantaId });
    }

    const checklists = await queryBuilder.getMany();

    return {
      totalChecklists: checklists.length,
      byType: this.groupChecklistsByField(checklists, 'type'),
      byStatus: this.groupChecklistsByField(checklists, 'status'),
      byPriority: this.groupChecklistsByField(checklists, 'priority'),
      averageScore: this.calculateAverageFromChecklists(checklists),
      qualityAnalysis: this.analyzeQuality(checklists),
      recommendations: this.generateQualityRecommendations(checklists),
      recentActivity: await this.getRecentActivity(tenantId, plantaId),
      performanceMetrics: await this.getPerformanceMetrics(tenantId, plantaId),
    };
  }

  private async getRecentActivity(tenantId: string, plantaId?: string) {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true })
      .orderBy('checklist.updatedAt', 'DESC')
      .limit(10);

    if (plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', { plantaId });
    }

    return await queryBuilder.getMany();
  }

  private async getPerformanceMetrics(tenantId: string, plantaId?: string) {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true });

    if (plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', { plantaId });
    }

    const checklists = await queryBuilder.getMany();

    return {
      completionRate: this.calculateCompletionRate(checklists),
      averageCompletionTime: this.calculateAverageCompletionTime(checklists),
      overdueRate: this.calculateOverdueRate(checklists),
      qualityScore: this.calculateAverageFromChecklists(checklists),
    };
  }

  private calculateCompletionRate(checklists: Checklist[]): number {
    const completed = checklists.filter(c => c.status === ChecklistStatus.COMPLETED);
    return checklists.length > 0 ? (completed.length / checklists.length) * 100 : 0;
  }

  private calculateAverageCompletionTime(checklists: Checklist[]): number {
    const completed = checklists.filter(c => 
      c.status === ChecklistStatus.COMPLETED && 
      c.createdAt && 
      c.completedAt
    );

    if (completed.length === 0) return 0;

    const totalTime = completed.reduce((sum, c) => {
      return sum + (c.completedAt!.getTime() - c.createdAt.getTime());
    }, 0);

    return totalTime / completed.length; // em milissegundos
  }

  private calculateOverdueRate(checklists: Checklist[]): number {
    const overdue = checklists.filter(c => 
      c.dueDate && 
      c.dueDate < new Date() && 
      c.status !== ChecklistStatus.COMPLETED
    );
    return checklists.length > 0 ? (overdue.length / checklists.length) * 100 : 0;
  }

  // Métodos de automação avançada
  async autoScheduleChecklists(tenantId: string) {
    const recurringChecklists = await this.checklistRepository
      .createQueryBuilder('checklist')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true })
      .andWhere('checklist.frequency != :frequency', { frequency: ChecklistFrequency.ON_DEMAND })
      .getMany();

    let scheduledCount = 0;
    for (const checklist of recurringChecklists) {
      if (checklist.shouldScheduleNext) {
        checklist.scheduleNextExecution();
        await this.checklistRepository.save(checklist);
        scheduledCount++;
      }
    }

    this.logger.log(`Agendamento automático concluído: ${scheduledCount} checklists agendados`);
    return { scheduledCount, totalProcessed: recurringChecklists.length };
  }

  async bulkUpdateChecklists(
    tenantId: string,
    filterCriteria: any,
    updateData: any,
    updatedBy: string,
  ) {
    const queryBuilder = this.checklistRepository
      .createQueryBuilder('checklist')
      .where('checklist.tenantId = :tenantId', { tenantId })
      .andWhere('checklist.isActive = :isActive', { isActive: true });

    // Aplicar critérios de filtro
    if (filterCriteria.status) {
      queryBuilder.andWhere('checklist.status = :status', { status: filterCriteria.status });
    }
    if (filterCriteria.type) {
      queryBuilder.andWhere('checklist.type = :type', { type: filterCriteria.type });
    }
    if (filterCriteria.plantaId) {
      queryBuilder.andWhere('checklist.plantaId = :plantaId', { plantaId: filterCriteria.plantaId });
    }

    const checklists = await queryBuilder.getMany();
    let updatedCount = 0;

    for (const checklist of checklists) {
      Object.assign(checklist, updateData);
      checklist.updatedAt = new Date();

      await this.checklistRepository.save(checklist);
      updatedCount++;
    }

    this.logger.log(`Atualização em lote concluída: ${updatedCount} checklists atualizados`);
    return { updatedCount, totalProcessed: checklists.length };
  }
} 