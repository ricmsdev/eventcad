import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { PlantaService } from './planta.service';
import {
  UploadPlantaDto,
  UpdatePlantaDto,
  ValidacaoTecnicaDto,
  RevisaoPlantaDto,
  ProcessAIDto,
  SearchPlantasDto,
  PlantaResponseDto,
} from './dto/planta.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { PlantaTipo, PlantaStatus } from '../../common/enums/planta-tipo.enum';

/**
 * Controller para gestão de plantas técnicas do EventCAD+
 *
 * Endpoints principais:
 * - Upload especializado para plantas técnicas
 * - Processamento de IA e reconhecimento
 * - Validação técnica e compliance
 * - Versionamento e revisões
 * - Análise de compatibilidade
 * - Visualização e metadados
 */
@ApiTags('Technical Plants')
@Controller('plantas')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class PlantaController {
  constructor(private readonly plantaService: PlantaService) {}

  /**
   * Upload de planta técnica
   */
  @Post('upload')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload de planta técnica',
    description:
      'Realiza upload especializado de plantas técnicas com processamento avançado',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Arquivo da planta (DWG, DXF, IFC, PDF)',
        },
        plantaTipo: {
          type: 'string',
          enum: Object.values(PlantaTipo),
          description: 'Tipo específico da planta técnica',
        },
        escala: {
          type: 'string',
          description: 'Escala da planta (ex: 1:100)',
        },
        unidadeMedida: {
          type: 'string',
          description: 'Unidade de medida utilizada',
        },
        eventoId: {
          type: 'string',
          description: 'ID do evento relacionado',
        },
        processarIA: {
          type: 'boolean',
          description: 'Processar automaticamente com IA',
        },
      },
      required: ['file', 'plantaTipo'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Planta enviada com sucesso',
    type: PlantaResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Arquivo inválido ou tipo incompatível',
  })
  async uploadPlanta(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadPlantaDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const planta = await this.plantaService.uploadPlanta(
      file,
      uploadDto,
      userId,
      tenantId,
    );

    return {
      id: planta.id,
      originalName: planta.originalName,
      plantaTipo: planta.plantaTipo,
      plantaStatus: planta.plantaStatus,
      escala: planta.escala,
      size: planta.size,
      qualityScore: planta.qualityScore,
      needsManualReview: planta.needsManualReview,
      readyForAI: planta.readyForAI,
      uploadedAt: planta.createdAt,
    };
  }

  /**
   * Lista plantas com filtros
   */
  @Get()
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar plantas técnicas',
    description: 'Lista plantas com filtros específicos e paginação',
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
    name: 'plantaTipo',
    required: false,
    enum: PlantaTipo,
    description: 'Filtro por tipo',
  })
  @ApiQuery({
    name: 'plantaStatus',
    required: false,
    enum: PlantaStatus,
    description: 'Filtro por status',
  })
  @ApiQuery({
    name: 'eventoId',
    required: false,
    description: 'Filtro por evento',
  })
  @ApiQuery({
    name: 'escala',
    required: false,
    description: 'Filtro por escala',
  })
  @ApiQuery({ name: 'search', required: false, description: 'Busca por nome' })
  @ApiQuery({
    name: 'minQualityScore',
    required: false,
    description: 'Score mínimo de qualidade',
  })
  @ApiQuery({
    name: 'needsReview',
    required: false,
    description: 'Apenas que precisam de revisão',
  })
  @ApiQuery({
    name: 'readyForAI',
    required: false,
    description: 'Apenas prontas para IA',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de plantas retornada com sucesso',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query() searchDto: SearchPlantasDto,
  ) {
    return this.plantaService.findPlantas(tenantId, searchDto);
  }

  /**
   * Busca planta por ID
   */
  @Get(':id')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Buscar planta por ID',
    description: 'Retorna detalhes completos de uma planta específica',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Planta encontrada',
  })
  @ApiResponse({
    status: 404,
    description: 'Planta não encontrada',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.findById(id, userId, tenantId);
  }

  /**
   * Atualiza planta
   */
  @Patch(':id')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Atualizar planta',
    description: 'Atualiza metadados e configurações de uma planta',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Planta atualizada com sucesso',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdatePlantaDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.update(id, updateDto, userId, tenantId, userRole);
  }

  /**
   * Adiciona validação técnica
   */
  @Post(':id/validacao')
  @Roles(UserRole.ENGINEER, UserRole.SAFETY_OFFICER)
  @ApiOperation({
    summary: 'Adicionar validação técnica',
    description: 'Adiciona resultado de validação técnica à planta',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Validação adicionada com sucesso',
  })
  async addValidacao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() validacaoDto: ValidacaoTecnicaDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.addValidacaoTecnica(
      id,
      validacaoDto,
      userId,
      tenantId,
    );
  }

  /**
   * Adiciona revisão
   */
  @Post(':id/revisao')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Adicionar revisão',
    description: 'Adiciona nova revisão ao histórico da planta',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Revisão adicionada com sucesso',
  })
  async addRevisao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() revisaoDto: RevisaoPlantaDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.addRevisao(id, revisaoDto, userId, tenantId);
  }

  /**
   * Processa planta com IA
   */
  @Post(':id/process-ai')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Processar com IA',
    description:
      'Inicia processamento de IA para reconhecimento de objetos e análise',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 202,
    description: 'Processamento de IA iniciado',
    schema: {
      properties: {
        status: { type: 'string' },
        message: { type: 'string' },
      },
    },
  })
  async processAI(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() processDto: ProcessAIDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.processWithAI(id, processDto, userId, tenantId);
  }

  /**
   * Obtém metadados da planta
   */
  @Get(':id/metadata')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Obter metadados',
    description: 'Retorna metadados técnicos completos da planta',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Metadados retornados com sucesso',
  })
  async getMetadata(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const planta = await this.plantaService.findById(id, userId, tenantId);
    return planta.exportMetadata();
  }

  /**
   * Obtém objetos detectados pela IA
   */
  @Get(':id/detected-objects')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Objetos detectados',
    description: 'Retorna objetos detectados pela IA na planta',
  })
  @ApiParam({ name: 'id', description: 'ID da planta (UUID)' })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filtro por categoria',
  })
  @ApiResponse({
    status: 200,
    description: 'Objetos detectados retornados',
  })
  async getDetectedObjects(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
    @Query('category') category?: string,
  ) {
    const planta = await this.plantaService.findById(id, userId, tenantId);
    const objectsByCategory = planta.getDetectedObjectsByCategory();

    if (category) {
      return { [category]: objectsByCategory[category] || [] };
    }

    return objectsByCategory;
  }

  /**
   * Analisa compatibilidade entre plantas
   */
  @Post(':id/compatibility/:otherId')
  @Roles(UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Analisar compatibilidade',
    description: 'Analisa compatibilidade entre duas plantas',
  })
  @ApiParam({ name: 'id', description: 'ID da primeira planta (UUID)' })
  @ApiParam({ name: 'otherId', description: 'ID da segunda planta (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Análise de compatibilidade retornada',
    schema: {
      properties: {
        compatible: { type: 'boolean' },
        score: { type: 'number' },
        issues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async analyzeCompatibility(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('otherId', ParseUUIDPipe) otherId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.analyzeCompatibility(id, otherId, tenantId);
  }

  /**
   * Obtém plantas por evento
   */
  @Get('evento/:eventoId')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Plantas por evento',
    description: 'Lista todas as plantas relacionadas a um evento',
  })
  @ApiParam({ name: 'eventoId', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Plantas do evento retornadas',
  })
  async findByEvento(
    @Param('eventoId', ParseUUIDPipe) eventoId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.plantaService.findByEvento(eventoId, tenantId);
  }

  /**
   * Estatísticas de plantas
   */
  @Get('stats/overview')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de plantas',
    description: 'Retorna estatísticas gerais das plantas técnicas',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    schema: {
      properties: {
        total: { type: 'number' },
        porTipo: { type: 'array' },
        porStatus: { type: 'array' },
        needingReview: { type: 'number' },
        readyForAI: { type: 'number' },
      },
    },
  })
  async getEstatisticas(@CurrentTenant() tenantId: string) {
    return this.plantaService.getEstatisticas(tenantId);
  }

  /**
   * Dashboard de plantas
   */
  @Get('dashboard/summary')
  @Roles(UserRole.ENGINEER, UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Dashboard de plantas',
    description: 'Retorna resumo para dashboard de plantas técnicas',
  })
  @ApiResponse({
    status: 200,
    description: 'Dashboard retornado com sucesso',
  })
  async getDashboard(@CurrentTenant() tenantId: string) {
    const [stats, recent, needingReview] = await Promise.all([
      this.plantaService.getEstatisticas(tenantId),
      this.plantaService.findPlantas(tenantId, { limit: 5 }),
      this.plantaService.findPlantas(tenantId, {
        needsReview: true,
        limit: 10,
      }),
    ]);

    return {
      statistics: stats,
      recentPlants: recent.data,
      needingReview: needingReview.data,
      alerts: {
        highPriorityReviews: needingReview.data.filter(
          (p) =>
            p.plantaTipo === 'seguranca_incendio' ||
            p.plantaTipo === 'rotas_fuga',
        ).length,
        aiProcessingErrors: needingReview.data.filter(
          (p) => p.aiProcessing?.status === 'failed',
        ).length,
      },
    };
  }

  /**
   * Plantas que precisam de atenção
   */
  @Get('dashboard/attention')
  @Roles(UserRole.ENGINEER, UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Plantas que precisam de atenção',
    description: 'Lista plantas com alertas, falhas ou pendências',
  })
  @ApiResponse({
    status: 200,
    description: 'Plantas com alertas retornadas',
  })
  async plantasAtencao(@CurrentTenant() tenantId: string) {
    const [needingReview, aiErrors, criticalTypes] = await Promise.all([
      this.plantaService.findPlantas(tenantId, {
        needsReview: true,
        limit: 20,
      }),
      this.plantaService.findPlantas(tenantId, {
        plantaStatus: PlantaStatus.ERROR,
        limit: 20,
      }),
      this.plantaService.findPlantas(tenantId, {
        plantaTipo: PlantaTipo.SEGURANCA_INCENDIO,
        plantaStatus: PlantaStatus.REVIEW_NEEDED,
        limit: 10,
      }),
    ]);

    return {
      needingReview: needingReview.data,
      aiErrors: aiErrors.data,
      criticalSecurity: criticalTypes.data,
      summary: {
        totalIssues: needingReview.total + aiErrors.total,
        criticalIssues: criticalTypes.total,
      },
    };
  }

  /**
   * Tipos de planta disponíveis
   */
  @Get('tipos/list')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Tipos de planta disponíveis',
    description:
      'Lista todos os tipos de planta suportados com suas configurações',
  })
  @ApiResponse({
    status: 200,
    description: 'Tipos de planta retornados',
  })
  async getTiposPlanta() {
    // Retornar tipos organizados por categoria
    const tipos = Object.values(PlantaTipo);
    const tiposPorCategoria: Record<string, any[]> = {};

    tipos.forEach((tipo) => {
      // Aqui você pode importar e usar getPlantaTipoConfig se necessário
      // Por simplicidade, vou retornar uma estrutura básica
      const categoria = tipo.includes('seguranca')
        ? 'Segurança'
        : tipo.includes('instalacao')
          ? 'Instalações'
          : tipo.includes('layout')
            ? 'Layout'
            : tipo.includes('estrutural')
              ? 'Estrutural'
              : tipo.includes('acessibilidade')
                ? 'Acessibilidade'
                : 'Geral';

      if (!tiposPorCategoria[categoria]) {
        tiposPorCategoria[categoria] = [];
      }

      tiposPorCategoria[categoria].push({
        value: tipo,
        label: tipo.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        description: `Planta de ${tipo.replace(/_/g, ' ')}`,
      });
    });

    return tiposPorCategoria;
  }
}
