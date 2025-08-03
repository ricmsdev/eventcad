import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { InfraObjectService } from './infra-object.service';
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import {
  InfraObjectStatus,
  InfraObjectSource,
  SafetyCriticality,
  ValidationType,
} from '../../common/enums/infra-object.enum';

/**
 * Controller para gestão de objetos de infraestrutura do EventCAD+
 *
 * Funcionalidades:
 * - CRUD completo de objetos detectados/criados
 * - Sistema de revisão e aprovação por engenheiros
 * - Edição de geometria e propriedades
 * - Validação técnica especializada
 * - Detecção e resolução de conflitos
 * - Analytics e relatórios avançados
 * - Integração com resultados de IA
 */
@ApiTags('Infrastructure Objects')
@Controller('infra-objects')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InfraObjectController {
  constructor(private readonly infraObjectService: InfraObjectService) {}

  /**
   * Criar novo objeto de infraestrutura
   */
  @Post()
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar objeto de infraestrutura',
    description: 'Cria um novo objeto de infraestrutura detectado ou manual',
  })
  @ApiResponse({
    status: 201,
    description: 'Objeto criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou tipo de objeto não suportado',
  })
  async create(
    @Body() createDto: CreateInfraObjectDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.create(createDto, userId, tenantId);
  }

  /**
   * Listar objetos com filtros avançados
   */
  @Get()
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar objetos de infraestrutura',
    description: 'Lista objetos com filtros avançados e paginação',
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
    name: 'plantaId',
    required: false,
    description: 'Filtro por planta',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: InfraObjectStatus,
    description: 'Filtro por status',
  })
  @ApiQuery({
    name: 'objectCategory',
    required: false,
    description: 'Filtro por categoria',
  })
  @ApiQuery({
    name: 'objectType',
    required: false,
    description: 'Filtro por tipo',
  })
  @ApiQuery({
    name: 'criticality',
    required: false,
    enum: SafetyCriticality,
    description: 'Filtro por criticidade',
  })
  @ApiQuery({
    name: 'source',
    required: false,
    enum: InfraObjectSource,
    description: 'Filtro por origem',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome/descrição',
  })
  @ApiQuery({
    name: 'needsAttention',
    required: false,
    description: 'Apenas objetos que precisam atenção',
  })
  @ApiQuery({
    name: 'manuallyValidated',
    required: false,
    description: 'Apenas objetos validados',
  })
  @ApiQuery({
    name: 'hasConflicts',
    required: false,
    description: 'Apenas objetos com conflitos',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de objetos retornada com sucesso',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() searchDto: SearchInfraObjectsDto,
  ) {
    return this.infraObjectService.findAll(tenantId, searchDto);
  }

  /**
   * Buscar objeto por ID
   */
  @Get(':id')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Buscar objeto por ID',
    description: 'Retorna detalhes completos de um objeto específico',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Objeto encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Objeto não encontrado',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.findById(id, tenantId);
  }

  /**
   * Atualizar objeto
   */
  @Patch(':id')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Atualizar objeto',
    description: 'Atualiza propriedades de um objeto de infraestrutura',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Objeto atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este objeto',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateInfraObjectDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.update(
      id,
      updateDto,
      userId,
      tenantId,
      userRole,
    );
  }

  /**
   * Mover objeto
   */
  @Post(':id/move')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Mover objeto',
    description: 'Move objeto para nova posição na planta',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiBody({
    schema: {
      properties: {
        x: { type: 'number', description: 'Nova posição X' },
        y: { type: 'number', description: 'Nova posição Y' },
        reason: { type: 'string', description: 'Motivo da movimentação' },
      },
      required: ['x', 'y'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Objeto movido com sucesso',
  })
  async moveObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moveDto: MoveObjectDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.moveObject(id, moveDto, userId, tenantId);
  }

  /**
   * Redimensionar objeto
   */
  @Post(':id/resize')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Redimensionar objeto',
    description: 'Altera dimensões do objeto na planta',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiBody({
    schema: {
      properties: {
        width: { type: 'number', description: 'Nova largura', minimum: 1 },
        height: { type: 'number', description: 'Nova altura', minimum: 1 },
        reason: { type: 'string', description: 'Motivo do redimensionamento' },
      },
      required: ['width', 'height'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Objeto redimensionado com sucesso',
  })
  async resizeObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() resizeDto: ResizeObjectDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.resizeObject(
      id,
      resizeDto,
      userId,
      tenantId,
    );
  }

  /**
   * Adicionar anotação
   */
  @Post(':id/annotations')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Adicionar anotação',
    description: 'Adiciona comentário, observação ou problema ao objeto',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiBody({
    schema: {
      properties: {
        type: {
          type: 'string',
          enum: ['comment', 'issue', 'note', 'reminder'],
        },
        text: { type: 'string', description: 'Texto da anotação' },
        position: {
          type: 'object',
          properties: { x: { type: 'number' }, y: { type: 'number' } },
          description: 'Posição na planta',
        },
        priority: { type: 'string', enum: ['low', 'medium', 'high'] },
      },
      required: ['type', 'text'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Anotação adicionada com sucesso',
    schema: {
      properties: {
        annotationId: { type: 'string' },
        object: { type: 'object' },
      },
    },
  })
  async addAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() annotationDto: AddAnnotationDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.addAnnotation(
      id,
      annotationDto,
      userId,
      tenantId,
    );
  }

  /**
   * Resolver anotação
   */
  @Post(':id/annotations/:annotationId/resolve')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Resolver anotação',
    description: 'Marca anotação como resolvida',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiParam({ name: 'annotationId', description: 'ID da anotação' })
  @ApiResponse({
    status: 200,
    description: 'Anotação resolvida com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Anotação não encontrada',
  })
  async resolveAnnotation(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('annotationId') annotationId: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.resolveAnnotation(
      id,
      annotationId,
      userId,
      tenantId,
    );
  }

  /**
   * Adicionar resultado de validação
   */
  @Post(':id/validations')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Adicionar validação técnica',
    description: 'Registra resultado de validação técnica especializada',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiBody({
    schema: {
      properties: {
        type: { type: 'string', enum: Object.values(ValidationType) },
        status: {
          type: 'string',
          enum: ['passed', 'failed', 'not_applicable'],
        },
        notes: { type: 'string', description: 'Observações da validação' },
        score: {
          type: 'number',
          minimum: 0,
          maximum: 100,
          description: 'Score (0-100)',
        },
        attachments: {
          type: 'array',
          items: { type: 'string' },
          description: 'Anexos',
        },
      },
      required: ['type', 'status'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Validação registrada com sucesso',
  })
  async addValidation(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() validationDto: ValidationResultDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.addValidationResult(
      id,
      validationDto,
      userId,
      tenantId,
    );
  }

  /**
   * Aprovar objeto
   */
  @Post(':id/approve')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Aprovar objeto',
    description: 'Aprova objeto manualmente após revisão',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Objeto aprovado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para aprovar objetos',
  })
  async approveObject(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.approveObject(
      id,
      userId,
      tenantId,
      userRole,
    );
  }

  /**
   * Rejeitar objeto
   */
  @Post(':id/reject')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Rejeitar objeto',
    description: 'Rejeita objeto após revisão',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        reason: { type: 'string', description: 'Motivo da rejeição' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Objeto rejeitado com sucesso',
  })
  async rejectObject(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { reason?: string },
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.rejectObject(
      id,
      userId,
      tenantId,
      body.reason,
    );
  }

  /**
   * Analisar conflitos
   */
  @Post('analyze-conflicts')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Analisar conflitos',
    description:
      'Analisa conflitos entre objetos (duplicatas, sobreposições, etc.)',
  })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        objectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'IDs específicos para analisar (opcional)',
        },
        conflictTypes: {
          type: 'array',
          items: {
            type: 'string',
            enum: [
              'duplicate',
              'overlap',
              'inconsistency',
              'missing_dependency',
            ],
          },
          description: 'Tipos de conflito para verificar',
        },
        overlapTolerance: {
          type: 'number',
          description: 'Tolerância para sobreposição (pixels)',
        },
        autoResolve: {
          type: 'boolean',
          description: 'Tentar resolver automaticamente',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análise de conflitos concluída',
    schema: {
      properties: {
        conflicts: { type: 'array' },
        autoResolved: { type: 'number' },
        requiresManualReview: { type: 'number' },
      },
    },
  })
  async analyzeConflicts(
    @Body() analysisDto: ConflictAnalysisDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.analyzeConflicts(tenantId, analysisDto);
  }

  /**
   * Estatísticas de objetos
   */
  @Get('stats/overview')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de objetos',
    description: 'Retorna estatísticas gerais dos objetos de infraestrutura',
  })
  @ApiQuery({
    name: 'plantaId',
    required: false,
    description: 'Filtro por planta específica',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      properties: {
        total: { type: 'number' },
        byStatus: { type: 'array' },
        byCategory: { type: 'array' },
        byCriticality: { type: 'array' },
        bySource: { type: 'array' },
        needingReview: { type: 'number' },
        manuallyValidated: { type: 'number' },
        withConflicts: { type: 'number' },
        avgQualityScore: { type: 'number' },
        validationRate: { type: 'number' },
      },
    },
  })
  async getStatistics(
    @CurrentTenant() tenantId: string,
    @Query('plantaId') plantaId?: string,
  ) {
    return this.infraObjectService.getStatistics(tenantId, plantaId);
  }

  /**
   * Dashboard de objetos
   */
  @Get('dashboard')
  @Roles(UserRole.ENGINEER, UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Dashboard de objetos',
    description: 'Retorna resumo para dashboard de objetos de infraestrutura',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retornado com sucesso',
  })
  async getDashboard(@CurrentTenant() tenantId: string) {
    const [stats, needingReview, recentObjects, criticalObjects] =
      await Promise.all([
        this.infraObjectService.getStatistics(tenantId),
        this.infraObjectService.findAll(tenantId, {
          needsAttention: true,
          limit: 10,
        }),
        this.infraObjectService.findAll(tenantId, {
          limit: 10,
          page: 1,
        }),
        this.infraObjectService.findAll(tenantId, {
          criticality: SafetyCriticality.CRITICAL,
          limit: 5,
        }),
      ]);

    return {
      statistics: stats,
      needingReview: {
        total: needingReview.total,
        objects: needingReview.data.map((obj) => ({
          id: obj.id,
          name: obj.name,
          objectType: obj.objectType,
          criticality: obj.criticality,
          qualityScore: obj.qualityScore,
          requiresReview: obj.requiresReview,
        })),
      },
      recent: {
        total: recentObjects.total,
        objects: recentObjects.data.slice(0, 5).map((obj) => ({
          id: obj.id,
          name: obj.name,
          objectType: obj.objectType,
          status: obj.status,
          confidence: obj.confidence,
          createdAt: obj.createdAt,
        })),
      },
      critical: {
        total: criticalObjects.total,
        objects: criticalObjects.data.map((obj) => ({
          id: obj.id,
          name: obj.name,
          objectType: obj.objectType,
          status: obj.status,
          needsAttention: obj.needsAttention,
          qualityScore: obj.qualityScore,
        })),
      },
      alerts: {
        pendingValidation: stats.needingReview,
        withConflicts: stats.withConflicts,
        lowQuality: recentObjects.data.filter((o) => o.qualityScore < 50)
          .length,
        criticalUnvalidated: criticalObjects.data.filter(
          (o) => !o.manuallyValidated,
        ).length,
      },
    };
  }

  /**
   * Gerar relatório
   */
  @Post('reports/generate')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Gerar relatório de objetos',
    description: 'Gera relatório detalhado dos objetos de infraestrutura',
  })
  @ApiBody({
    required: false,
    schema: {
      properties: {
        startDate: { type: 'string', format: 'date-time' },
        endDate: { type: 'string', format: 'date-time' },
        categories: { type: 'array', items: { type: 'string' } },
        statuses: { type: 'array', items: { type: 'string' } },
        includeDetails: { type: 'boolean' },
        includeHistory: { type: 'boolean' },
        includeQualityAnalysis: { type: 'boolean' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Relatório gerado com sucesso',
  })
  async generateReport(
    @Body() reportDto: InfraObjectReportDto,
    @CurrentTenant() tenantId: string,
  ) {
    return this.infraObjectService.generateReport(tenantId, reportDto);
  }

  /**
   * Tipos disponíveis
   */
  @Get('types/available')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Tipos de objetos disponíveis',
    description:
      'Lista todos os tipos de objetos disponíveis organizados por categoria',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos retornados com sucesso',
  })
  async getAvailableTypes() {
    return this.infraObjectService.getAvailableTypes();
  }

  /**
   * Objetos por planta
   */
  @Get('planta/:plantaId')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Objetos de uma planta específica',
    description: 'Retorna todos os objetos de uma planta com filtros opcionais',
  })
  @ApiParam({ name: 'plantaId', description: 'ID da planta (UUID)' })
  @ApiQuery({ name: 'status', required: false, enum: InfraObjectStatus })
  @ApiQuery({ name: 'criticality', required: false, enum: SafetyCriticality })
  @ApiQuery({ name: 'objectCategory', required: false })
  @ApiQuery({ name: 'needsAttention', required: false })
  @ApiResponse({
    status: 200,
    description: 'Objetos da planta retornados com sucesso',
  })
  async getObjectsByPlanta(
    @Param('plantaId', ParseUUIDPipe) plantaId: string,
    @CurrentTenant() tenantId: string,
    @Query() filters: Partial<SearchInfraObjectsDto>,
  ) {
    return this.infraObjectService.findAll(tenantId, {
      ...filters,
      plantaId,
      limit: 1000, // Retornar todos os objetos da planta
    });
  }

  /**
   * Histórico de modificações
   */
  @Get(':id/history')
  @Roles(UserRole.ENGINEER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Histórico de modificações',
    description: 'Retorna histórico detalhado de modificações do objeto',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Histórico retornado com sucesso',
  })
  async getHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const object = await this.infraObjectService.findById(id, tenantId);

    return {
      objectId: object.id,
      objectName: object.name,
      totalModifications: object.modificationHistory?.length || 0,
      history: object.modificationHistory || [],
    };
  }

  /**
   * Anotações do objeto
   */
  @Get(':id/annotations')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Anotações do objeto',
    description: 'Retorna todas as anotações de um objeto',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiQuery({
    name: 'resolved',
    required: false,
    description: 'Filtrar por status resolvido',
  })
  @ApiResponse({
    status: 200,
    description: 'Anotações retornadas com sucesso',
  })
  async getAnnotations(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
    @Query('resolved') resolved?: boolean,
  ) {
    const object = await this.infraObjectService.findById(id, tenantId);

    let annotations = object.annotations || [];

    if (resolved !== undefined) {
      annotations = annotations.filter((a) => a.resolved === resolved);
    }

    return {
      objectId: object.id,
      totalAnnotations: annotations.length,
      annotations: annotations,
    };
  }

  /**
   * Validações do objeto
   */
  @Get(':id/validations')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Validações do objeto',
    description: 'Retorna todas as validações técnicas de um objeto',
  })
  @ApiParam({ name: 'id', description: 'ID do objeto (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Validações retornadas com sucesso',
  })
  async getValidations(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    const object = await this.infraObjectService.findById(id, tenantId);

    return {
      objectId: object.id,
      requiredValidations: object.requiredValidations || [],
      completedValidations: object.validationResults || [],
      validationStatus: {
        total: object.requiredValidations?.length || 0,
        completed: object.validationResults?.length || 0,
        passed:
          object.validationResults?.filter((v) => v.status === 'passed')
            .length || 0,
        failed:
          object.validationResults?.filter((v) => v.status === 'failed')
            .length || 0,
      },
      manuallyValidated: object.manuallyValidated,
      validatedAt: object.validatedAt,
      qualityScore: object.qualityScore,
    };
  }
}
