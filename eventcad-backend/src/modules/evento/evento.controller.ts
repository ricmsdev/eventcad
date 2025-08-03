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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { EventoService } from './evento.service';
import { CreateEventoDto } from './dto/create-evento.dto';
import {
  UpdateEventoDto,
  UpdateEventoStatusDto,
  AddMarcoTimelineDto,
  UpdateMarcoTimelineDto,
  AddRiscoDto,
  AddDocumentoDto,
  UpdateAprovacaoDto,
} from './dto/update-evento.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { EventStatus } from '../../common/enums/event-status.enum';
import { EventoTipo } from '../../common/enums/evento-tipo.enum';

/**
 * Controller para gestão de eventos do EventCAD+
 *
 * Endpoints principais:
 * - CRUD completo de eventos
 * - Gestão de workflow e status
 * - Timeline e marcos
 * - Riscos e aprovações
 * - Estatísticas e relatórios
 */
@ApiTags('Events')
@Controller('eventos')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EventoController {
  constructor(private readonly eventoService: EventoService) {}

  /**
   * Cria um novo evento
   */
  @Post()
  @Roles(UserRole.OPERATOR, UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Criar novo evento',
    description:
      'Cria um novo evento no sistema com todas as configurações básicas',
  })
  @ApiResponse({
    status: 201,
    description: 'Evento criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos fornecidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para criar eventos',
  })
  async create(
    @Body() createEventoDto: CreateEventoDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.create(createEventoDto, userId, tenantId);
  }

  /**
   * Lista todos os eventos com filtros
   */
  @Get()
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Listar eventos',
    description: 'Lista todos os eventos do tenant com filtros e paginação',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Página (padrão: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Items por página (padrão: 20, máx: 100)',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: EventStatus,
    description: 'Filtro por status',
  })
  @ApiQuery({
    name: 'tipo',
    required: false,
    enum: EventoTipo,
    description: 'Filtro por tipo',
  })
  @ApiQuery({
    name: 'organizadorId',
    required: false,
    description: 'Filtro por organizador (UUID)',
  })
  @ApiQuery({
    name: 'dataInicio',
    required: false,
    description: 'Data início filtro (ISO 8601)',
  })
  @ApiQuery({
    name: 'dataFim',
    required: false,
    description: 'Data fim filtro (ISO 8601)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Busca por nome, descrição ou local',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de eventos retornada com sucesso',
  })
  async findAll(
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('status') status?: EventStatus,
    @Query('tipo') tipo?: EventoTipo,
    @Query('organizadorId') organizadorId?: string,
    @Query('dataInicio') dataInicio?: string,
    @Query('dataFim') dataFim?: string,
    @Query('search') search?: string,
  ) {
    return this.eventoService.findAll(tenantId, {
      page: page ? parseInt(page.toString(), 10) : undefined,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
      status,
      tipo,
      organizadorId,
      dataInicio: dataInicio ? new Date(dataInicio) : undefined,
      dataFim: dataFim ? new Date(dataFim) : undefined,
      search,
    });
  }

  /**
   * Busca evento por ID
   */
  @Get(':id')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Buscar evento por ID',
    description: 'Retorna detalhes completos de um evento específico',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Evento encontrado',
  })
  @ApiResponse({
    status: 404,
    description: 'Evento não encontrado',
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.findById(id, tenantId);
  }

  /**
   * Atualiza evento existente
   */
  @Patch(':id')
  @Roles(UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Atualizar evento',
    description: 'Atualiza dados de um evento existente',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Evento atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este evento',
  })
  @ApiResponse({
    status: 404,
    description: 'Evento não encontrado',
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateEventoDto: UpdateEventoDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.update(
      id,
      updateEventoDto,
      userId,
      tenantId,
      userRole,
    );
  }

  /**
   * Atualiza status do evento
   */
  @Patch(':id/status')
  @Roles(UserRole.OPERATOR)
  @ApiOperation({
    summary: 'Atualizar status do evento',
    description: 'Atualiza o status do evento no workflow',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Status atualizado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Transição de status inválida',
  })
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateStatusDto: UpdateEventoStatusDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.updateStatus(
      id,
      updateStatusDto.status,
      updateStatusDto.observacoes,
      userId,
      tenantId,
      userRole,
    );
  }

  /**
   * Adiciona marco na timeline
   */
  @Post(':id/timeline')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Adicionar marco na timeline',
    description: 'Adiciona um novo marco na timeline do evento',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Marco adicionado com sucesso',
  })
  async addMarcoTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addMarcoDto: AddMarcoTimelineDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.addMarcoTimeline(
      id,
      addMarcoDto,
      userId,
      tenantId,
    );
  }

  /**
   * Atualiza marco na timeline
   */
  @Patch(':id/timeline')
  @Roles(UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Atualizar marco na timeline',
    description: 'Atualiza o status de um marco na timeline',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Marco atualizado com sucesso',
  })
  async updateMarcoTimeline(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateMarcoDto: UpdateMarcoTimelineDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.updateMarcoTimeline(
      id,
      updateMarcoDto.marcoId,
      updateMarcoDto.status,
      userId,
      tenantId,
    );
  }

  /**
   * Adiciona risco ao evento
   */
  @Post(':id/riscos')
  @Roles(UserRole.SAFETY_OFFICER, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Adicionar risco',
    description: 'Adiciona um novo risco identificado ao evento',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 201,
    description: 'Risco adicionado com sucesso',
  })
  async addRisco(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() addRiscoDto: AddRiscoDto,
    @CurrentUser('id') userId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.addRisco(id, addRiscoDto, userId, tenantId);
  }

  /**
   * Remove evento (soft delete)
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remover evento',
    description: 'Remove um evento do sistema (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID do evento (UUID)' })
  @ApiResponse({
    status: 204,
    description: 'Evento removido com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para remover este evento',
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
    @CurrentTenant() tenantId: string,
  ) {
    return this.eventoService.remove(id, userId, tenantId, userRole);
  }

  /**
   * Obtém estatísticas de eventos
   */
  @Get('stats/overview')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Estatísticas de eventos',
    description: 'Retorna estatísticas gerais dos eventos do tenant',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getEstatisticas(@CurrentTenant() tenantId: string) {
    return this.eventoService.getEstatisticas(tenantId);
  }

  /**
   * Busca eventos por organizador
   */
  @Get('organizador/:organizadorId')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Eventos por organizador',
    description: 'Lista eventos de um organizador específico',
  })
  @ApiParam({ name: 'organizadorId', description: 'ID do organizador (UUID)' })
  @ApiResponse({
    status: 200,
    description: 'Eventos do organizador retornados',
  })
  async findByOrganizador(
    @Param('organizadorId', ParseUUIDPipe) organizadorId: string,
    @CurrentTenant() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return this.eventoService.findAll(tenantId, {
      organizadorId,
      page: page ? parseInt(page.toString(), 10) : undefined,
      limit: limit ? parseInt(limit.toString(), 10) : undefined,
    });
  }

  /**
   * Busca eventos por data
   */
  @Get('calendario/:ano/:mes')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Eventos do calendário',
    description: 'Lista eventos de um mês específico para calendário',
  })
  @ApiParam({ name: 'ano', description: 'Ano (YYYY)' })
  @ApiParam({ name: 'mes', description: 'Mês (1-12)' })
  @ApiResponse({
    status: 200,
    description: 'Eventos do mês retornados',
  })
  async findByCalendario(
    @Param('ano') ano: number,
    @Param('mes') mes: number,
    @CurrentTenant() tenantId: string,
  ) {
    const dataInicio = new Date(ano, mes - 1, 1);
    const dataFim = new Date(ano, mes, 0, 23, 59, 59);

    return this.eventoService.findAll(tenantId, {
      dataInicio,
      dataFim,
      limit: 100, // Mês não deve ter mais que 100 eventos
    });
  }

  /**
   * Próximos eventos (dashboard)
   */
  @Get('dashboard/proximos')
  @Roles(UserRole.VIEWER)
  @ApiOperation({
    summary: 'Próximos eventos',
    description: 'Lista próximos eventos para dashboard',
  })
  @ApiQuery({
    name: 'dias',
    required: false,
    description: 'Próximos X dias (padrão: 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Próximos eventos retornados',
  })
  async proximosEventos(
    @CurrentTenant() tenantId: string,
    @Query('dias') dias?: number,
  ) {
    const diasProximos = dias || 30;
    const dataInicio = new Date();
    const dataFim = new Date(Date.now() + diasProximos * 24 * 60 * 60 * 1000);

    return this.eventoService.findAll(tenantId, {
      dataInicio,
      dataFim,
      limit: 20,
    });
  }

  /**
   * Eventos que precisam de atenção (atrasados, aguardando aprovação, etc.)
   */
  @Get('dashboard/atencao')
  @Roles(UserRole.PROJECT_MANAGER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Eventos que precisam de atenção',
    description: 'Lista eventos com alertas, atrasos ou pendências',
  })
  @ApiResponse({
    status: 200,
    description: 'Eventos com alertas retornados',
  })
  async eventosAtencao(@CurrentTenant() tenantId: string) {
    // Buscar eventos que precisam de atenção
    const statusAtencao = [
      EventStatus.AWAITING_APPROVAL,
      EventStatus.UNDER_REVIEW,
      EventStatus.REJECTED,
    ];

    const results = await Promise.all(
      statusAtencao.map((status) =>
        this.eventoService.findAll(tenantId, { status, limit: 50 }),
      ),
    );

    return {
      aguardandoAprovacao: results[0].data,
      emAnalise: results[1].data,
      rejeitados: results[2].data,
    };
  }

  /**
   * Dashboard de estatísticas gerais
   */
  @Get('dashboard/stats')
  @ApiOperation({
    summary: 'Dashboard de estatísticas',
    description: 'Retorna estatísticas gerais para o dashboard',
  })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getDashboardStats(@CurrentTenant() tenantId: string) {
    return this.eventoService.getDashboardStats(tenantId);
  }
}
