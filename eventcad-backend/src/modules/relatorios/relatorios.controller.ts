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
import { RelatoriosService } from './relatorios.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@ApiTags('Relatórios')
@Controller('relatorios')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RelatoriosController {
  constructor(private readonly relatoriosService: RelatoriosService) {}

  // ===== Templates de Relatório =====
  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VENUE_MANAGER)
  @ApiOperation({ summary: 'Criar novo template de relatório' })
  @ApiResponse({ status: 201, description: 'Template criado com sucesso' })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiResponse({ status: 403, description: 'Sem permissão' })
  async createTemplate(
    @Body() createDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.createTemplate(createDto, user.id, tenantId);
  }

  @Get('templates')
  @ApiOperation({ summary: 'Listar templates de relatório' })
  @ApiQuery({ name: 'type', required: false, description: 'Filtrar por tipo' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'search', required: false, description: 'Buscar por nome/descrição' })
  @ApiQuery({ name: 'plantaId', required: false, description: 'Filtrar por planta' })
  @ApiResponse({ status: 200, description: 'Lista de templates' })
  async findAllTemplates(
    @CurrentTenant() tenantId: string,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
    @Query('plantaId') plantaId?: string,
  ) {
    const filters = { 
      type: type as any, 
      status: status as any, 
      search, 
      plantaId 
    };
    return await this.relatoriosService.findAllTemplates(tenantId, filters);
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Buscar template por ID' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Template encontrado' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async findTemplateById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.findTemplateById(id, tenantId);
  }

  @Put('templates/:id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VENUE_MANAGER)
  @ApiOperation({ summary: 'Atualizar template de relatório' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 200, description: 'Template atualizado com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async updateTemplate(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.updateTemplate(id, updateDto, user.id, tenantId);
  }

  @Delete('templates/:id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Excluir template de relatório' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 204, description: 'Template excluído com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteTemplate(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    await this.relatoriosService.deleteTemplate(id, tenantId);
  }

  // ===== Execução de Relatórios =====
  @Post('templates/:id/execute')
  @ApiOperation({ summary: 'Executar relatório' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 201, description: 'Execução iniciada com sucesso' })
  @ApiResponse({ status: 404, description: 'Template não encontrado' })
  async executeReport(
    @Param('id') templateId: string,
    @Body() executionDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.executeReport(templateId, executionDto, user.id, tenantId);
  }

  @Get('executions')
  @ApiOperation({ summary: 'Listar execuções de relatórios' })
  @ApiQuery({ name: 'templateId', required: false, description: 'Filtrar por template' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrar por status' })
  @ApiQuery({ name: 'executedBy', required: false, description: 'Filtrar por executor' })
  @ApiQuery({ name: 'dateFrom', required: false, description: 'Data inicial' })
  @ApiQuery({ name: 'dateTo', required: false, description: 'Data final' })
  @ApiResponse({ status: 200, description: 'Lista de execuções' })
  async findAllExecutions(
    @CurrentTenant() tenantId: string,
    @Query('templateId') templateId?: string,
    @Query('status') status?: string,
    @Query('executedBy') executedBy?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    const filters = {
      templateId,
      status,
      executedBy,
      dateFrom: dateFrom ? new Date(dateFrom) : undefined,
      dateTo: dateTo ? new Date(dateTo) : undefined,
    };
    return await this.relatoriosService.findAllExecutions(tenantId, filters);
  }

  @Get('executions/:id')
  @ApiOperation({ summary: 'Buscar execução por ID' })
  @ApiParam({ name: 'id', description: 'ID da execução' })
  @ApiResponse({ status: 200, description: 'Execução encontrada' })
  @ApiResponse({ status: 404, description: 'Execução não encontrada' })
  async findExecutionById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.findExecutionById(id, tenantId);
  }

  // ===== Agendamento =====
  @Post('templates/:id/schedule')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VENUE_MANAGER)
  @ApiOperation({ summary: 'Agendar relatório' })
  @ApiParam({ name: 'id', description: 'ID do template' })
  @ApiResponse({ status: 201, description: 'Agendamento criado com sucesso' })
  async scheduleReport(
    @Param('id') templateId: string,
    @Body() scheduleDto: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.scheduleReport(templateId, scheduleDto, user.id, tenantId);
  }

  @Get('schedules')
  @ApiOperation({ summary: 'Listar agendamentos' })
  @ApiResponse({ status: 200, description: 'Lista de agendamentos' })
  async findAllSchedules(@CurrentTenant() tenantId: string) {
    return await this.relatoriosService.findAllSchedules(tenantId);
  }

  @Put('schedules/:id')
  @Roles(UserRole.ADMIN, UserRole.PROJECT_MANAGER, UserRole.VENUE_MANAGER)
  @ApiOperation({ summary: 'Atualizar agendamento' })
  @ApiParam({ name: 'id', description: 'ID do agendamento' })
  @ApiResponse({ status: 200, description: 'Agendamento atualizado com sucesso' })
  async updateSchedule(
    @Param('id') id: string,
    @Body() updateDto: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.updateSchedule(id, updateDto, tenantId);
  }

  // ===== Exportação =====
  @Post('executions/:id/export')
  @ApiOperation({ summary: 'Exportar relatório' })
  @ApiParam({ name: 'id', description: 'ID da execução' })
  @ApiResponse({ status: 201, description: 'Exportação iniciada com sucesso' })
  async exportReport(
    @Param('id') executionId: string,
    @Body() exportDto: { format: string },
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.exportReport(
      executionId,
      exportDto.format as any,
      user.id,
      tenantId,
    );
  }

  @Get('exports/:id')
  @ApiOperation({ summary: 'Buscar exportação por ID' })
  @ApiParam({ name: 'id', description: 'ID da exportação' })
  @ApiResponse({ status: 200, description: 'Exportação encontrada' })
  async findExportById(
    @Param('id') id: string,
    @CurrentTenant() tenantId: string,
  ) {
    return await this.relatoriosService.findExportById(id, tenantId);
  }

  // ===== Analytics =====
  @Get('analytics')
  @ApiOperation({ summary: 'Obter analytics de relatórios' })
  @ApiResponse({ status: 200, description: 'Analytics obtidos com sucesso' })
  async getReportAnalytics(
    @CurrentTenant() tenantId: string,
    @Query() filters?: any,
  ) {
    return await this.relatoriosService.getReportAnalytics(tenantId, filters);
  }

  @Get('analytics/advanced')
  @ApiOperation({ summary: 'Obter analytics avançados' })
  @ApiResponse({ status: 200, description: 'Analytics avançados obtidos com sucesso' })
  async getAdvancedAnalytics(@CurrentTenant() tenantId: string) {
    return await this.relatoriosService.getAdvancedAnalytics(tenantId);
  }

  // ===== Dashboard =====
  @Get('dashboard/overview')
  @ApiOperation({ summary: 'Visão geral do dashboard de relatórios' })
  @ApiResponse({ status: 200, description: 'Dados do dashboard' })
  async getDashboardOverview(@CurrentTenant() tenantId: string) {
    const [templates, executions, schedules, analytics] = await Promise.all([
      this.relatoriosService.findAllTemplates(tenantId),
      this.relatoriosService.findAllExecutions(tenantId),
      this.relatoriosService.findAllSchedules(tenantId),
      this.relatoriosService.getAdvancedAnalytics(tenantId),
    ]);

    return {
      templates: templates.length,
      executions: executions.length,
      schedules: schedules.length,
      recentExecutions: executions.slice(0, 5),
      popularTemplates: analytics.popularTemplates,
      performance: analytics.performance,
    };
  }

  // ===== Relatórios Rápidos =====
  @Post('quick/inspection')
  @ApiOperation({ summary: 'Gerar relatório rápido de inspeção' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generateQuickInspectionReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    // Criar template temporário e executar
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório Rápido de Inspeção',
        type: 'inspection',
        status: 'active',
        isQuickReport: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }

  @Post('quick/compliance')
  @ApiOperation({ summary: 'Gerar relatório rápido de compliance' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generateQuickComplianceReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório Rápido de Compliance',
        type: 'compliance',
        status: 'active',
        isQuickReport: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }

  @Post('quick/safety')
  @ApiOperation({ summary: 'Gerar relatório rápido de segurança' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generateQuickSafetyReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório Rápido de Segurança',
        type: 'safety',
        status: 'active',
        isQuickReport: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }

  // ===== Relatórios Especializados =====
  @Post('specialized/infrastructure')
  @ApiOperation({ summary: 'Relatório especializado de infraestrutura' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generateInfrastructureReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório de Infraestrutura',
        type: 'analytics',
        status: 'active',
        category: 'infrastructure',
        specialized: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }

  @Post('specialized/checklist')
  @ApiOperation({ summary: 'Relatório especializado de checklists' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generateChecklistReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório de Checklists',
        type: 'analytics',
        status: 'active',
        category: 'checklist',
        specialized: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }

  @Post('specialized/performance')
  @ApiOperation({ summary: 'Relatório especializado de performance' })
  @ApiResponse({ status: 201, description: 'Relatório gerado com sucesso' })
  async generatePerformanceReport(
    @Body() params: any,
    @CurrentUser() user: any,
    @CurrentTenant() tenantId: string,
  ) {
    const template = await this.relatoriosService.createTemplate(
      {
        name: 'Relatório de Performance',
        type: 'analytics',
        status: 'active',
        category: 'performance',
        specialized: true,
      },
      user.id,
      tenantId,
    );

    return await this.relatoriosService.executeReport(template.id, params, user.id, tenantId);
  }
} 