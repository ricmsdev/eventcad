import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ChecklistService } from './checklist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Controller para gestão de checklists do EventCAD+
 *
 * Endpoints:
 * - CRUD completo de checklists
 * - Execução e validação
 * - Workflow de aprovação
 * - Analytics e relatórios
 * - Operações em lote
 */
@ApiTags('Checklists')
@Controller('checklists')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ChecklistController {
  constructor(private readonly checklistService: ChecklistService) {}

  /**
   * Cria novo checklist
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Criar novo checklist',
    description: 'Cria um novo checklist com validações e configurações avançadas',
  })
  @ApiResponse({
    status: 201,
    description: 'Checklist criado com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Dados inválidos ou configuração incorreta',
  })
  @ApiResponse({
    status: 404,
    description: 'Planta não encontrada',
  })
  async create(
    @Body() createDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.create(
      createDto,
      user.id,
      tenantId,
    );
  }

  /**
   * Lista checklists com filtros avançados
   */
  @Get()
  @ApiOperation({
    summary: 'Listar checklists',
    description: 'Lista checklists com filtros avançados, paginação e ordenação',
  })
  @ApiQuery({ name: 'page', required: false, description: 'Número da página' })
  @ApiQuery({ name: 'limit', required: false, description: 'Itens por página' })
  @ApiQuery({ name: 'search', required: false, description: 'Termo de busca' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'priority', required: false, description: 'Filtrar por prioridade' })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiQuery({ name: 'assignedTo', required: false, description: 'Filtrar por responsável' })
  @ApiQuery({ name: 'overdue', required: false, description: 'Filtrar vencidos' })
  @ApiQuery({ name: 'needsAttention', required: false, description: 'Filtrar que precisam de atenção' })
  @ApiResponse({
    status: 200,
    description: 'Lista de checklists retornada com sucesso',
  })
  async findAll(
    @Query() query: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.findAll(tenantId, query);
  }

  /**
   * Busca checklist por ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Buscar checklist por ID',
    description: 'Retorna um checklist específico com todas as relações',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 200,
    description: 'Checklist encontrado com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  async findById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.findById(id, tenantId);
  }

  /**
   * Atualiza checklist
   */
  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Atualizar checklist',
    description: 'Atualiza um checklist existente com validações de permissão',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 200,
    description: 'Checklist atualizado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para editar este checklist',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  async update(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.update(
      id,
      updateDto,
      user.id,
      tenantId,
      user.role,
    );
  }

  /**
   * Remove checklist
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({
    summary: 'Remover checklist',
    description: 'Remove um checklist (soft delete)',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 204,
    description: 'Checklist removido com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para remover checklists',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    await this.checklistService.remove(id, tenantId, user.role);
  }

  /**
   * Executa checklist
   */
  @Post(':id/execute')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Executar checklist',
    description: 'Inicia a execução de um checklist',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 201,
    description: 'Execução iniciada com sucesso',
  })
  @ApiResponse({
    status: 400,
    description: 'Checklist não está ativo para execução',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  async executeChecklist(
    @Param('id') id: string,
    @Body() executionDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.executeChecklist(
      id,
      executionDto,
      user.id,
      tenantId,
    );
  }

  /**
   * Finaliza execução do checklist
   */
  @Put(':id/complete')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER, UserRole.TECHNICIAN)
  @ApiOperation({
    summary: 'Finalizar execução do checklist',
    description: 'Finaliza a execução de um checklist com resultados',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 200,
    description: 'Execução finalizada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Execução não encontrada',
  })
  async completeExecution(
    @Param('id') id: string,
    @Body() completionDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.completeExecution(
      id,
      completionDto,
      user.id,
      tenantId,
    );
  }

  /**
   * Aprova checklist
   */
  @Post(':id/approve')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Aprovar checklist',
    description: 'Aprova um checklist completado',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 200,
    description: 'Checklist aprovado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para aprovar checklists',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  async approveChecklist(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.approveChecklist(
      id,
      user.id,
      tenantId,
      user.role,
    );
  }

  /**
   * Rejeita checklist
   */
  @Post(':id/reject')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Rejeitar checklist',
    description: 'Rejeita um checklist com motivo',
  })
  @ApiParam({ name: 'id', description: 'ID do checklist' })
  @ApiResponse({
    status: 200,
    description: 'Checklist rejeitado com sucesso',
  })
  @ApiResponse({
    status: 403,
    description: 'Sem permissão para rejeitar checklists',
  })
  @ApiResponse({
    status: 404,
    description: 'Checklist não encontrado',
  })
  async rejectChecklist(
    @Param('id') id: string,
    @Body() rejectDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.rejectChecklist(
      id,
      user.id,
      tenantId,
      rejectDto.reason,
    );
  }

  /**
   * Obtém estatísticas de checklists
   */
  @Get('statistics/overview')
  @ApiOperation({
    summary: 'Estatísticas gerais',
    description: 'Retorna estatísticas completas dos checklists',
  })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
  })
  async getStatistics(
    @Query('plantaId') plantaId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.getStatistics(tenantId, plantaId);
  }

  /**
   * Gera relatório de checklists
   */
  @Post('reports/generate')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Gerar relatório',
    description: 'Gera relatório detalhado de checklists com filtros',
  })
  @ApiResponse({
    status: 201,
    description: 'Relatório gerado com sucesso',
  })
  async generateReport(
    @Body() reportDto: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.generateReport(tenantId, reportDto);
  }

  /**
   * Obtém checklists vencidos
   */
  @Get('overdue/list')
  @ApiOperation({
    summary: 'Checklists vencidos',
    description: 'Lista checklists que estão vencidos',
  })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiResponse({
    status: 200,
    description: 'Lista de checklists vencidos retornada',
  })
  async getOverdueChecklists(
    @Query('plantaId') plantaId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.getOverdueChecklists(tenantId, plantaId);
  }

  /**
   * Obtém checklists que precisam de atenção
   */
  @Get('attention/needed')
  @ApiOperation({
    summary: 'Checklists que precisam de atenção',
    description: 'Lista checklists que precisam de atenção imediata',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de checklists retornada',
  })
  async getChecklistsNeedingAttention(
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.getChecklistsNeedingAttention(tenantId);
  }

  /**
   * Analytics avançados
   */
  @Get('analytics/advanced')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Analytics avançados',
    description: 'Retorna analytics detalhados com métricas de performance',
  })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiResponse({
    status: 200,
    description: 'Analytics retornados com sucesso',
  })
  async getAdvancedAnalytics(
    @Query('plantaId') plantaId: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.getAdvancedAnalytics(tenantId, plantaId);
  }

  /**
   * Agendamento automático
   */
  @Post('automation/schedule')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Agendamento automático',
    description: 'Executa agendamento automático de checklists recorrentes',
  })
  @ApiResponse({
    status: 201,
    description: 'Agendamento automático executado com sucesso',
  })
  async autoScheduleChecklists(
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.autoScheduleChecklists(tenantId);
  }

  /**
   * Atualização em lote
   */
  @Put('bulk/update')
  @Roles(UserRole.ADMIN, UserRole.ENGINEER)
  @ApiOperation({
    summary: 'Atualização em lote',
    description: 'Atualiza múltiplos checklists baseado em critérios',
  })
  @ApiResponse({
    status: 200,
    description: 'Atualização em lote executada com sucesso',
  })
  async bulkUpdateChecklists(
    @Body() bulkUpdateDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.checklistService.bulkUpdateChecklists(
      tenantId,
      bulkUpdateDto.filterCriteria,
      bulkUpdateDto.updateData,
      user.id,
    );
  }

  /**
   * Dashboard de checklists
   */
  @Get('dashboard/overview')
  @ApiOperation({
    summary: 'Dashboard de checklists',
    description: 'Retorna dados para o dashboard de checklists',
  })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiResponse({
    status: 200,
    description: 'Dados do dashboard retornados com sucesso',
  })
  async getDashboardData(
    @Query('plantaId') plantaId: string,
    @CurrentTenant() tenantId: string,
  ) {
    const [
      statistics,
      overdue,
      needingAttention,
      recentActivity,
    ] = await Promise.all([
      this.checklistService.getStatistics(tenantId, plantaId),
      this.checklistService.getOverdueChecklists(tenantId, plantaId),
      this.checklistService.getChecklistsNeedingAttention(tenantId),
      this.checklistService.getAdvancedAnalytics(tenantId, plantaId).then(a => a.recentActivity),
    ]);

    return {
      statistics,
      overdue: overdue.length,
      needingAttention: needingAttention.length,
      recentActivity,
      alerts: {
        critical: overdue.filter(c => c.priority === 'critical').length,
        high: overdue.filter(c => c.priority === 'high').length,
        medium: overdue.filter(c => c.priority === 'medium').length,
      },
    };
  }
} 