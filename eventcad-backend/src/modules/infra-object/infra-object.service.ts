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
import { InfraObject } from './entities/infra-object.entity';
import { Planta } from '../planta/entities/planta.entity';
import {
  CreateInfraObjectDto,
  UpdateInfraObjectDto,
  SearchInfraObjectsDto,
  MoveObjectDto,
  ResizeObjectDto,
  AddAnnotationDto,
  ValidationResultDto,
  ConflictAnalysisDto,
  InfraObjectReportDto,
} from './dto/infra-object.dto';
import {
  InfraObjectStatus,
  InfraObjectSource,
  SafetyCriticality,
  ValidationType,
  getConfidenceLevel,
  needsReview,
  getAllCategories,
  getTypesForCategory,
  getObjectTypeConfig,
} from '../../common/enums/infra-object.enum';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Serviço para gestão de objetos de infraestrutura do EventCAD+
 *
 * Funcionalidades:
 * - CRUD completo de objetos detectados/criados
 * - Sistema de revisão e aprovação
 * - Edição de geometria e propriedades
 * - Validação técnica especializada
 * - Detecção e resolução de conflitos
 * - Analytics e relatórios
 * - Integração com resultados de IA
 */
@Injectable()
export class InfraObjectService {
  private readonly logger = new Logger(InfraObjectService.name);

  constructor(
    @InjectRepository(InfraObject)
    private readonly infraObjectRepository: Repository<InfraObject>,
    @InjectRepository(Planta)
    private readonly plantaRepository: Repository<Planta>,
  ) {}

  /**
   * Cria novo objeto de infraestrutura com validações avançadas
   */
  async create(
    createDto: CreateInfraObjectDto,
    createdBy: string,
    tenantId: string,
  ): Promise<InfraObject> {
    this.logger.log(`Criando objeto de infraestrutura: ${createDto.name}`);

    // Verificar se a planta existe
    const planta = await this.plantaRepository.findOne({
      where: { id: createDto.plantaId, tenantId, isActive: true },
    });

    if (!planta) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Validar categoria e tipo
    this.validateObjectTypeConfig(
      createDto.objectCategory,
      createDto.objectType,
    );

    // Definir criticidade baseada no tipo se não informada
    const typeConfig = getObjectTypeConfig(
      createDto.objectCategory,
      createDto.objectType,
    );
    const criticality =
      createDto.criticality ||
      typeConfig?.criticality ||
      SafetyCriticality.NONE;

    // Calcular se precisa de revisão
    const confidence = createDto.confidence || 1.0;
    const requiresReview = needsReview(confidence, criticality);

    // Validações avançadas de geometria
    if (createDto.geometry) {
      this.validateGeometry(createDto.geometry, planta);
    }

    // Verificar duplicatas próximas
    const duplicates = await this.findNearbyDuplicates(
      createDto.geometry,
      createDto.objectType,
      createDto.plantaId,
      tenantId,
    );

    if (duplicates.length > 0) {
      this.logger.warn(`Encontradas ${duplicates.length} duplicatas próximas`);
    }

    // Criar objeto
    const infraObject = this.infraObjectRepository.create({
      ...createDto,
      tenantId,
      createdBy,
      criticality,
      confidence,
      requiresReview,
      confidenceLevel: getConfidenceLevel(confidence),
      requiredValidations:
        createDto.requiredValidations || typeConfig?.validations || [],
      source: createDto.source || InfraObjectSource.MANUAL_CREATION,
      status: requiresReview
        ? InfraObjectStatus.PENDING_REVIEW
        : InfraObjectStatus.DETECTED,
    });

    const savedObject = await this.infraObjectRepository.save(infraObject);

    // Adicionar ao histórico
    savedObject.addModification(
      'created',
      createdBy,
      {},
      savedObject.exportForReport(),
      'Objeto criado',
    );
    await this.infraObjectRepository.save(savedObject);

    this.logger.log(
      `Objeto criado: ${savedObject.id} - ${savedObject.name} (${savedObject.objectType})`,
    );

    return savedObject;
  }

  /**
   * Busca objetos com filtros avançados
   */
  async findAll(
    tenantId: string,
    searchDto: SearchInfraObjectsDto = {},
  ): Promise<{
    data: InfraObject[];
    total: number;
    page: number;
    limit: number;
  }> {
    const page = searchDto.page || 1;
    const limit = Math.min(searchDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .leftJoinAndSelect('obj.planta', 'planta')
      .leftJoinAndSelect('obj.creator', 'creator')
      .leftJoinAndSelect('obj.validator', 'validator')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true });

    // Aplicar filtros
    if (searchDto.plantaId) {
      queryBuilder.andWhere('obj.plantaId = :plantaId', {
        plantaId: searchDto.plantaId,
      });
    }

    if (searchDto.status) {
      queryBuilder.andWhere('obj.status = :status', {
        status: searchDto.status,
      });
    }

    if (searchDto.objectCategory) {
      queryBuilder.andWhere('obj.objectCategory = :category', {
        category: searchDto.objectCategory,
      });
    }

    if (searchDto.objectType) {
      queryBuilder.andWhere('obj.objectType = :type', {
        type: searchDto.objectType,
      });
    }

    if (searchDto.criticality) {
      queryBuilder.andWhere('obj.criticality = :criticality', {
        criticality: searchDto.criticality,
      });
    }

    if (searchDto.source) {
      queryBuilder.andWhere('obj.source = :source', {
        source: searchDto.source,
      });
    }

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(obj.name ILIKE :search OR obj.description ILIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    if (searchDto.minConfidence !== undefined) {
      queryBuilder.andWhere('obj.confidence >= :minConfidence', {
        minConfidence: searchDto.minConfidence,
      });
    }

    if (searchDto.confidenceLevel) {
      queryBuilder.andWhere('obj.confidenceLevel = :confidenceLevel', {
        confidenceLevel: searchDto.confidenceLevel,
      });
    }

    if (searchDto.createdBy) {
      queryBuilder.andWhere('obj.createdBy = :createdBy', {
        createdBy: searchDto.createdBy,
      });
    }

    if (searchDto.createdFrom) {
      queryBuilder.andWhere('obj.createdAt >= :createdFrom', {
        createdFrom: new Date(searchDto.createdFrom),
      });
    }

    if (searchDto.createdTo) {
      queryBuilder.andWhere('obj.createdAt <= :createdTo', {
        createdTo: new Date(searchDto.createdTo),
      });
    }

    // Filtros especiais que precisam de subconsultas ou lógica especial
    if (searchDto.needsAttention !== undefined) {
      if (searchDto.needsAttention) {
        queryBuilder.andWhere(
          '(obj.status IN (:...attentionStatuses) OR obj.requiresReview = true)',
          {
            attentionStatuses: [
              InfraObjectStatus.PENDING_REVIEW,
              InfraObjectStatus.CONFLICTED,
            ],
          },
        );
      }
    }

    if (searchDto.manuallyValidated !== undefined) {
      queryBuilder.andWhere('obj.manuallyValidated = :validated', {
        validated: searchDto.manuallyValidated,
      });
    }

    if (searchDto.hasConflicts !== undefined) {
      if (searchDto.hasConflicts) {
        queryBuilder.andWhere('obj.conflicts IS NOT NULL');
      } else {
        queryBuilder.andWhere('obj.conflicts IS NULL');
      }
    }

    // Ordenação
    queryBuilder
      .orderBy('obj.criticality', 'DESC')
      .addOrderBy('obj.createdAt', 'DESC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Busca objeto por ID
   */
  async findById(id: string, tenantId: string): Promise<InfraObject> {
    const object = await this.infraObjectRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: [
        'planta',
        'creator',
        'validator',
        'lastModifier',
        'parentObject',
        'childObjects',
        'aiJob',
      ],
    });

    if (!object) {
      throw new NotFoundException('Objeto não encontrado');
    }

    return object;
  }

  /**
   * Atualiza objeto
   */
  async update(
    id: string,
    updateDto: UpdateInfraObjectDto,
    updatedBy: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    // Verificar permissões
    this.validateUpdatePermissions(object, updatedBy, userRole);

    const oldValues = { ...object };

    // Aplicar atualizações
    Object.assign(object, updateDto);

    // Se mudou a geometria, registrar como movimentação
    if (updateDto.geometry) {
      object.addModification(
        'moved',
        updatedBy,
        { geometry: oldValues.geometry },
        { geometry: updateDto.geometry },
        'Geometria atualizada',
      );
    }

    // Se mudaram propriedades, registrar
    if (updateDto.properties) {
      object.addModification(
        'properties_changed',
        updatedBy,
        { properties: oldValues.properties },
        { properties: updateDto.properties },
        'Propriedades atualizadas',
      );
    }

    // Se mudou status, registrar
    if (updateDto.status && updateDto.status !== oldValues.status) {
      object.addModification(
        'status_changed',
        updatedBy,
        { status: oldValues.status },
        { status: updateDto.status },
        'Status atualizado',
      );
    }

    return this.infraObjectRepository.save(object);
  }

  /**
   * Move objeto para nova posição
   */
  async moveObject(
    id: string,
    moveDto: MoveObjectDto,
    movedBy: string,
    tenantId: string,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    object.moveTo(moveDto.x, moveDto.y, movedBy);

    if (moveDto.reason) {
      const lastModification =
        object.modificationHistory?.[object.modificationHistory.length - 1];
      if (lastModification) {
        lastModification.reason = moveDto.reason;
      }
    }

    return this.infraObjectRepository.save(object);
  }

  /**
   * Redimensiona objeto
   */
  async resizeObject(
    id: string,
    resizeDto: ResizeObjectDto,
    resizedBy: string,
    tenantId: string,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    object.resize(resizeDto.width, resizeDto.height, resizedBy);

    if (resizeDto.reason) {
      const lastModification =
        object.modificationHistory?.[object.modificationHistory.length - 1];
      if (lastModification) {
        lastModification.reason = resizeDto.reason;
      }
    }

    return this.infraObjectRepository.save(object);
  }

  /**
   * Adiciona anotação ao objeto
   */
  async addAnnotation(
    id: string,
    annotationDto: AddAnnotationDto,
    createdBy: string,
    tenantId: string,
  ): Promise<{ annotationId: string; object: InfraObject }> {
    const object = await this.findById(id, tenantId);

    const annotationId = object.addAnnotation(
      annotationDto.type,
      annotationDto.text,
      createdBy,
      annotationDto.position,
      annotationDto.priority,
    );

    const savedObject = await this.infraObjectRepository.save(object);

    return { annotationId, object: savedObject };
  }

  /**
   * Resolve anotação
   */
  async resolveAnnotation(
    id: string,
    annotationId: string,
    resolvedBy: string,
    tenantId: string,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    const resolved = object.resolveAnnotation(annotationId, resolvedBy);
    if (!resolved) {
      throw new NotFoundException('Anotação não encontrada');
    }

    return this.infraObjectRepository.save(object);
  }

  /**
   * Adiciona resultado de validação
   */
  async addValidationResult(
    id: string,
    validationDto: ValidationResultDto,
    validatedBy: string,
    tenantId: string,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    object.addValidationResult(
      validationDto.type,
      validationDto.status,
      validatedBy,
      validationDto.notes,
      validationDto.score,
      validationDto.attachments,
    );

    // Se todas as validações necessárias foram aprovadas, marcar como validado
    if (this.areAllValidationsPassed(object)) {
      object.markAsValidated(validatedBy);
    }

    return this.infraObjectRepository.save(object);
  }

  /**
   * Aprova objeto manualmente
   */
  async approveObject(
    id: string,
    approvedBy: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    // Verificar permissões para aprovação
    this.validateApprovalPermissions(object, userRole);

    object.markAsValidated(approvedBy);

    object.addModification(
      'status_changed',
      approvedBy,
      { status: object.status },
      { status: InfraObjectStatus.APPROVED },
      'Objeto aprovado manualmente',
    );

    return this.infraObjectRepository.save(object);
  }

  /**
   * Rejeita objeto
   */
  async rejectObject(
    id: string,
    rejectedBy: string,
    tenantId: string,
    reason?: string,
  ): Promise<InfraObject> {
    const object = await this.findById(id, tenantId);

    object.status = InfraObjectStatus.REJECTED;

    object.addModification(
      'status_changed',
      rejectedBy,
      { status: object.status },
      { status: InfraObjectStatus.REJECTED },
      reason || 'Objeto rejeitado',
    );

    return this.infraObjectRepository.save(object);
  }

  /**
   * Analisa conflitos entre objetos
   */
  async analyzeConflicts(
    tenantId: string,
    analysisDto: ConflictAnalysisDto = {},
  ): Promise<{
    conflicts: any[];
    autoResolved: number;
    requiresManualReview: number;
  }> {
    let objects: InfraObject[];

    if (analysisDto.objectIds && analysisDto.objectIds.length > 0) {
      objects = await this.infraObjectRepository.find({
        where: {
          id: In(analysisDto.objectIds),
          tenantId,
          isActive: true,
        },
      });
    } else {
      // Analisar todos os objetos ativos
      objects = await this.infraObjectRepository.find({
        where: { tenantId, isActive: true },
      });
    }

    const conflicts: any[] = [];
    let autoResolved = 0;
    let requiresManualReview = 0;

    // Analisar duplicatas
    if (
      !analysisDto.conflictTypes ||
      analysisDto.conflictTypes.includes('duplicate')
    ) {
      const duplicateConflicts = this.findDuplicateObjects(objects);
      conflicts.push(...duplicateConflicts);
    }

    // Analisar sobreposições
    if (
      !analysisDto.conflictTypes ||
      analysisDto.conflictTypes.includes('overlap')
    ) {
      const overlapConflicts = this.findOverlappingObjects(
        objects,
        analysisDto.overlapTolerance || 5,
      );
      conflicts.push(...overlapConflicts);
    }

    // Auto-resolver conflitos simples se solicitado
    if (analysisDto.autoResolve) {
      for (const conflict of conflicts) {
        if (conflict.autoResolvable) {
          await this.autoResolveConflict(conflict);
          autoResolved++;
        } else {
          requiresManualReview++;
        }
      }
    } else {
      requiresManualReview = conflicts.length;
    }

    return {
      conflicts: conflicts.filter(
        (c) => !analysisDto.autoResolve || !c.autoResolvable,
      ),
      autoResolved,
      requiresManualReview,
    };
  }

  /**
   * Obtém estatísticas de objetos
   */
  async getStatistics(tenantId: string, plantaId?: string) {
    const where: any = { tenantId, isActive: true };
    if (plantaId) {
      where.plantaId = plantaId;
    }

    const [
      total,
      byStatus,
      byCategory,
      byCriticality,
      bySource,
      needingReview,
      manuallyValidated,
      withConflicts,
      avgQualityScore,
    ] = await Promise.all([
      this.infraObjectRepository.count({ where }),
      this.getCountByField('status', where),
      this.getCountByField('objectCategory', where),
      this.getCountByField('criticality', where),
      this.getCountByField('source', where),
      this.infraObjectRepository.count({
        where: { ...where, requiresReview: true },
      }),
      this.infraObjectRepository.count({
        where: { ...where, manuallyValidated: true },
      }),
      this.infraObjectRepository.count({
        where: { ...where, conflicts: 'NOT NULL' },
      }),
      this.calculateAverageQualityScore(where),
    ]);

    return {
      total,
      byStatus,
      byCategory,
      byCriticality,
      bySource,
      needingReview,
      manuallyValidated,
      withConflicts,
      avgQualityScore,
      validationRate: total > 0 ? (manuallyValidated / total) * 100 : 0,
    };
  }

  /**
   * Gera relatório de objetos
   */
  async generateReport(
    tenantId: string,
    reportDto: InfraObjectReportDto = {},
  ): Promise<any> {
    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .leftJoinAndSelect('obj.planta', 'planta')
      .leftJoinAndSelect('obj.creator', 'creator')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true });

    // Filtros de data
    if (reportDto.startDate) {
      queryBuilder.andWhere('obj.createdAt >= :startDate', {
        startDate: new Date(reportDto.startDate),
      });
    }

    if (reportDto.endDate) {
      queryBuilder.andWhere('obj.createdAt <= :endDate', {
        endDate: new Date(reportDto.endDate),
      });
    }

    // Filtros por tipo
    if (reportDto.categories && reportDto.categories.length > 0) {
      queryBuilder.andWhere('obj.objectCategory IN (:...categories)', {
        categories: reportDto.categories,
      });
    }

    if (reportDto.statuses && reportDto.statuses.length > 0) {
      queryBuilder.andWhere('obj.status IN (:...statuses)', {
        statuses: reportDto.statuses,
      });
    }

    const objects = await queryBuilder.getMany();

    // Gerar relatório
    const report = {
      period: {
        start: reportDto.startDate || objects[0]?.createdAt,
        end: reportDto.endDate || new Date(),
      },
      summary: {
        totalObjects: objects.length,
        approvedObjects: objects.filter(
          (o) => o.status === InfraObjectStatus.APPROVED,
        ).length,
        pendingReview: objects.filter((o) => o.requiresReview).length,
        withConflicts: objects.filter(
          (o) => o.conflicts && o.conflicts.length > 0,
        ).length,
        avgQualityScore: this.calculateAverageFromObjects(objects),
      },
      byCategory: this.groupObjectsByField(objects, 'objectCategory'),
      byStatus: this.groupObjectsByField(objects, 'status'),
      byCriticality: this.groupObjectsByField(objects, 'criticality'),
      qualityAnalysis: reportDto.includeQualityAnalysis
        ? this.analyzeQuality(objects)
        : undefined,
      objects: reportDto.includeDetails
        ? objects.map((o) => o.exportForReport())
        : undefined,
    };

    return report;
  }

  /**
   * Obtém tipos disponíveis por categoria
   */
  async getAvailableTypes(): Promise<Record<string, any[]>> {
    const categories = getAllCategories();
    const result: Record<string, any[]> = {};

    categories.forEach((category) => {
      const types = getTypesForCategory(category);
      result[category] = types.map((type) => {
        const config = getObjectTypeConfig(category, type);
        return {
          type,
          name: config?.name || type,
          icon: config?.icon,
          criticality: config?.criticality,
          validations: config?.validations,
          properties: config?.properties,
        };
      });
    });

    return result;
  }

  // Métodos privados

  private validateObjectTypeConfig(category: string, type: string): void {
    const config = getObjectTypeConfig(category, type);
    if (!config) {
      throw new BadRequestException(
        `Tipo de objeto inválido: ${category}.${type}`,
      );
    }
  }

  private validateUpdatePermissions(
    object: InfraObject,
    userId: string,
    userRole: UserRole,
  ): void {
    // Criador pode sempre editar
    if (object.createdBy === userId) return;

    // Admins e engenheiros podem editar qualquer objeto
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENGINEER].includes(
        userRole,
      )
    )
      return;

    // Técnicos podem editar objetos não críticos
    if (
      userRole === UserRole.TECHNICIAN &&
      object.criticality !== SafetyCriticality.CRITICAL
    )
      return;

    throw new ForbiddenException('Sem permissão para editar este objeto');
  }

  private validateApprovalPermissions(
    object: InfraObject,
    userRole: UserRole,
  ): void {
    // Apenas engenheiros e admins podem aprovar
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENGINEER].includes(
        userRole,
      )
    )
      return;

    throw new ForbiddenException('Sem permissão para aprovar objetos');
  }

  private areAllValidationsPassed(object: InfraObject): boolean {
    if (!object.requiredValidations || object.requiredValidations.length === 0)
      return true;
    if (!object.validationResults || object.validationResults.length === 0)
      return false;

    return object.requiredValidations.every((requiredType) => {
      const result = object.validationResults?.find(
        (r) => r.type === requiredType,
      );
      return result && result.status === 'passed';
    });
  }

  private findDuplicateObjects(objects: InfraObject[]): any[] {
    const duplicates: any[] = [];
    const processed = new Set<string>();

    for (let i = 0; i < objects.length; i++) {
      if (processed.has(objects[i].id)) continue;

      const similar = objects
        .slice(i + 1)
        .filter(
          (obj) =>
            obj.objectCategory === objects[i].objectCategory &&
            obj.objectType === objects[i].objectType &&
            this.arePositionsClose(
              objects[i].geometry.center,
              obj.geometry.center,
              10,
            ),
        );

      if (similar.length > 0) {
        const conflictingIds = [objects[i].id, ...similar.map((s) => s.id)];

        duplicates.push({
          type: 'duplicate',
          severity: 'medium',
          description: `Possíveis objetos duplicados: ${objects[i].objectType}`,
          conflictingObjectIds: conflictingIds,
          autoResolvable: similar.every(
            (s) => s.confidence && s.confidence < 0.8,
          ),
          suggestedAction: 'Manter objeto com maior confiança',
        });

        similar.forEach((s) => processed.add(s.id));
        processed.add(objects[i].id);
      }
    }

    return duplicates;
  }

  private findOverlappingObjects(
    objects: InfraObject[],
    tolerance: number,
  ): any[] {
    const overlaps: any[] = [];

    for (let i = 0; i < objects.length; i++) {
      for (let j = i + 1; j < objects.length; j++) {
        if (this.doObjectsOverlap(objects[i], objects[j], tolerance)) {
          overlaps.push({
            type: 'overlap',
            severity: 'low',
            description: `Objetos sobrepostos: ${objects[i].objectType} e ${objects[j].objectType}`,
            conflictingObjectIds: [objects[i].id, objects[j].id],
            autoResolvable: false,
            suggestedAction: 'Verificar posicionamento manual',
          });
        }
      }
    }

    return overlaps;
  }

  private arePositionsClose(
    pos1: { x: number; y: number },
    pos2: { x: number; y: number },
    threshold: number,
  ): boolean {
    const distance = Math.sqrt(
      Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2),
    );
    return distance <= threshold;
  }

  private doObjectsOverlap(
    obj1: InfraObject,
    obj2: InfraObject,
    tolerance: number,
  ): boolean {
    const box1 = obj1.geometry.boundingBox;
    const box2 = obj2.geometry.boundingBox;

    return !(
      box1.x + box1.width + tolerance < box2.x ||
      box2.x + box2.width + tolerance < box1.x ||
      box1.y + box1.height + tolerance < box2.y ||
      box2.y + box2.height + tolerance < box1.y
    );
  }

  private async autoResolveConflict(conflict: any): Promise<void> {
    // Implementar lógica de auto-resolução baseada no tipo de conflito
    if (conflict.type === 'duplicate' && conflict.autoResolvable) {
      // Manter apenas o objeto com maior confiança
      const objects = await this.infraObjectRepository.find({
        where: { id: In(conflict.conflictingObjectIds) },
      });

      if (objects.length > 1) {
        objects.sort((a, b) => (b.confidence || 0) - (a.confidence || 0));

        // Remover objetos com menor confiança
        for (let i = 1; i < objects.length; i++) {
          objects[i].isActive = false;
          objects[i].addModification(
            'deleted',
            'system',
            {},
            {},
            'Auto-removido por duplicação',
          );
        }

        await this.infraObjectRepository.save(objects);
      }
    }
  }

  private async getCountByField(field: string, where: any): Promise<any[]> {
    return this.infraObjectRepository
      .createQueryBuilder('obj')
      .select(`obj.${field}, COUNT(*) as count`)
      .where(where)
      .groupBy(`obj.${field}`)
      .getRawMany();
  }

  private async calculateAverageQualityScore(where: any): Promise<number> {
    const objects = await this.infraObjectRepository.find({ where });
    return this.calculateAverageFromObjects(objects);
  }

  private calculateAverageFromObjects(objects: InfraObject[]): number {
    if (objects.length === 0) return 0;
    const sum = objects.reduce((total, obj) => total + obj.qualityScore, 0);
    return Math.round(sum / objects.length);
  }

  private groupObjectsByField(
    objects: InfraObject[],
    field: string,
  ): Record<string, number> {
    return objects.reduce(
      (acc, obj) => {
        const value = (obj as any)[field] || 'unknown';
        acc[value] = (acc[value] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );
  }

  private analyzeQuality(objects: InfraObject[]): any {
    const scores = objects.map((o) => o.qualityScore);
    const confidences = objects.map((o) => o.confidence || 0);

    return {
      qualityDistribution: {
        excellent: scores.filter((s) => s >= 90).length,
        good: scores.filter((s) => s >= 70 && s < 90).length,
        fair: scores.filter((s) => s >= 50 && s < 70).length,
        poor: scores.filter((s) => s < 50).length,
      },
      confidenceDistribution: {
        high: confidences.filter((c) => c >= 0.8).length,
        medium: confidences.filter((c) => c >= 0.6 && c < 0.8).length,
        low: confidences.filter((c) => c < 0.6).length,
      },
      recommendations: this.generateQualityRecommendations(objects),
    };
  }

  private generateQualityRecommendations(objects: InfraObject[]): string[] {
    const recommendations: string[] = [];

    const lowQuality = objects.filter((o) => o.qualityScore < 50);
    if (lowQuality.length > 0) {
      recommendations.push(
        `${lowQuality.length} objetos com qualidade baixa precisam de revisão`,
      );
    }

    const needingReview = objects.filter((o) => o.requiresReview);
    if (needingReview.length > 0) {
      recommendations.push(
        `${needingReview.length} objetos aguardam validação manual`,
      );
    }

    const withConflicts = objects.filter(
      (o) => o.conflicts && o.conflicts.length > 0,
    );
    if (withConflicts.length > 0) {
      recommendations.push(
        `${withConflicts.length} objetos têm conflitos que precisam ser resolvidos`,
      );
    }

    return recommendations;
  }

  // Métodos avançados adicionados para o "Lord Lucifer"
  private validateGeometry(geometry: any, planta: any): void {
    if (!geometry.boundingBox) {
      throw new BadRequestException('Geometria deve conter boundingBox');
    }

    const { x, y, width, height } = geometry.boundingBox;
    
    if (width <= 0 || height <= 0) {
      throw new BadRequestException('Dimensões do objeto devem ser positivas');
    }

    // Validar se está dentro dos limites da planta
    if (planta.dimensions) {
      const { width: plantaWidth, height: plantaHeight } = planta.dimensions;
      if (x < 0 || y < 0 || x + width > plantaWidth || y + height > plantaHeight) {
        throw new BadRequestException('Objeto está fora dos limites da planta');
      }
    }
  }

  private async findNearbyDuplicates(
    geometry: any,
    objectType: string,
    plantaId: string,
    tenantId: string,
    tolerance: number = 50, // pixels
  ): Promise<InfraObject[]> {
    if (!geometry?.center) return [];

    const { x, y } = geometry.center;

    return await this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.plantaId = :plantaId', { plantaId })
      .andWhere('obj.objectType = :objectType', { objectType })
      .andWhere('obj.isActive = :isActive', { isActive: true })
      .andWhere(
        'ST_DWithin(ST_Point(obj.geometry->\'center\'->>\'x\', obj.geometry->\'center\'->>\'y\'), ST_Point(:x, :y), :tolerance)',
        { x, y, tolerance }
      )
      .getMany();
  }

  private async processDuplicateConflicts(
    newObject: InfraObject,
    duplicates: InfraObject[],
  ): Promise<void> {
    for (const duplicate of duplicates) {
      newObject.addConflict(
        'duplicate',
        [duplicate.id],
        `Objeto duplicado detectado: ${duplicate.name}`,
        'medium',
        true,
        'Revisar e decidir qual manter',
      );
    }

    await this.infraObjectRepository.save(newObject);
  }

  private async notifyReviewRequired(object: InfraObject): Promise<void> {
    // Implementar notificação para revisores
    this.logger.log(`Notificação de revisão enviada para objeto: ${object.id}`);
    
    // Aqui você pode integrar com sistema de notificações
    // await this.notificationService.sendReviewNotification(object);
  }

  // Métodos de analytics avançados
  async getAdvancedAnalytics(tenantId: string, plantaId?: string) {
    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true });

    if (plantaId) {
      queryBuilder.andWhere('obj.plantaId = :plantaId', { plantaId });
    }

    const objects = await queryBuilder.getMany();

    return {
      totalObjects: objects.length,
      byCategory: this.groupObjectsByField(objects, 'objectCategory'),
      byStatus: this.groupObjectsByField(objects, 'status'),
      byCriticality: this.groupObjectsByField(objects, 'criticality'),
      averageConfidence: this.calculateAverageFromObjects(objects),
      qualityAnalysis: this.analyzeQuality(objects),
      recommendations: this.generateQualityRecommendations(objects),
      recentActivity: await this.getRecentActivity(tenantId, plantaId),
      performanceMetrics: await this.getPerformanceMetrics(tenantId, plantaId),
    };
  }

  private async getRecentActivity(tenantId: string, plantaId?: string) {
    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true })
      .orderBy('obj.updatedAt', 'DESC')
      .limit(10);

    if (plantaId) {
      queryBuilder.andWhere('obj.plantaId = :plantaId', { plantaId });
    }

    return await queryBuilder.getMany();
  }

  private async getPerformanceMetrics(tenantId: string, plantaId?: string) {
    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true });

    if (plantaId) {
      queryBuilder.andWhere('obj.plantaId = :plantaId', { plantaId });
    }

    const objects = await queryBuilder.getMany();

    return {
      detectionAccuracy: this.calculateDetectionAccuracy(objects),
      validationEfficiency: this.calculateValidationEfficiency(objects),
      conflictResolutionRate: this.calculateConflictResolutionRate(objects),
      averageProcessingTime: this.calculateAverageProcessingTime(objects),
    };
  }

  private calculateDetectionAccuracy(objects: InfraObject[]): number {
    const aiDetected = objects.filter(obj => obj.source === InfraObjectSource.AI_DETECTION);
    const validated = aiDetected.filter(obj => obj.manuallyValidated);
    return aiDetected.length > 0 ? (validated.length / aiDetected.length) * 100 : 0;
  }

  private calculateValidationEfficiency(objects: InfraObject[]): number {
    const pendingValidation = objects.filter(obj => obj.requiresReview);
    const validated = objects.filter(obj => obj.manuallyValidated);
    const total = pendingValidation.length + validated.length;
    return total > 0 ? (validated.length / total) * 100 : 0;
  }

  private calculateConflictResolutionRate(objects: InfraObject[]): number {
    const withConflicts = objects.filter(obj => obj.conflicts && obj.conflicts.length > 0);
    const resolved = withConflicts.filter(obj => 
      obj.conflicts && obj.conflicts.every(conflict => conflict.resolvedAt)
    );
    return withConflicts.length > 0 ? (resolved.length / withConflicts.length) * 100 : 0;
  }

  private calculateAverageProcessingTime(objects: InfraObject[]): number {
    const aiObjects = objects.filter(obj => obj.detectionMetadata);
    if (aiObjects.length === 0) return 0;

    const totalTime = aiObjects.reduce((sum, obj) => {
      return sum + (obj.detectionMetadata?.processingTime || 0);
    }, 0);

    return totalTime / aiObjects.length;
  }

  // Métodos de automação avançada
  async autoValidateObjects(tenantId: string, confidenceThreshold: number = 0.9) {
    const highConfidenceObjects = await this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true })
      .andWhere('obj.confidence >= :threshold', { threshold: confidenceThreshold })
      .andWhere('obj.manuallyValidated = :validated', { validated: false })
      .andWhere('obj.requiresReview = :review', { review: true })
      .getMany();

    let validatedCount = 0;
    for (const object of highConfidenceObjects) {
      object.markAsValidated('system-auto-validation');
      object.status = InfraObjectStatus.APPROVED;
      await this.infraObjectRepository.save(object);
      validatedCount++;
    }

    this.logger.log(`Auto-validação concluída: ${validatedCount} objetos validados`);
    return { validatedCount, totalProcessed: highConfidenceObjects.length };
  }

  async bulkUpdateObjects(
    tenantId: string,
    filterCriteria: any,
    updateData: any,
    updatedBy: string,
  ) {
    const queryBuilder = this.infraObjectRepository
      .createQueryBuilder('obj')
      .where('obj.tenantId = :tenantId', { tenantId })
      .andWhere('obj.isActive = :isActive', { isActive: true });

    // Aplicar critérios de filtro
    if (filterCriteria.status) {
      queryBuilder.andWhere('obj.status = :status', { status: filterCriteria.status });
    }
    if (filterCriteria.objectCategory) {
      queryBuilder.andWhere('obj.objectCategory = :category', { category: filterCriteria.objectCategory });
    }
    if (filterCriteria.plantaId) {
      queryBuilder.andWhere('obj.plantaId = :plantaId', { plantaId: filterCriteria.plantaId });
    }

    const objects = await queryBuilder.getMany();
    let updatedCount = 0;

    for (const object of objects) {
      Object.assign(object, updateData);
      object.lastModifiedBy = updatedBy;
      object.updatedAt = new Date();
      
      object.addModification(
        'bulk_update',
        updatedBy,
        {},
        updateData,
        'Atualização em lote',
      );

      await this.infraObjectRepository.save(object);
      updatedCount++;
    }

    this.logger.log(`Atualização em lote concluída: ${updatedCount} objetos atualizados`);
    return { updatedCount, totalProcessed: objects.length };
  }
}
