import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService, Alert } from './alerts.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Alerts')
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter todos os alertas (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Lista de alertas' })
  async getAlerts(
    @Body() body: { level?: string; acknowledged?: boolean; limit?: number },
  ): Promise<Alert[]> {
    return this.alertsService.getAlerts(body.level, body.acknowledged, body.limit);
  }

  @Get('unacknowledged')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter alertas não reconhecidos (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Alertas não reconhecidos' })
  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return this.alertsService.getUnacknowledgedAlerts();
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter estatísticas de alertas (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Estatísticas de alertas' })
  async getAlertStats() {
    return this.alertsService.getAlertStats();
  }

  @Post(':id/acknowledge')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reconhecer um alerta (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Alerta reconhecido' })
  async acknowledgeAlert(
    @Param('id') alertId: string,
    @Body() body: { acknowledgedBy: string },
  ): Promise<Alert | null> {
    return this.alertsService.acknowledgeAlert(alertId, body.acknowledgedBy);
  }

  @Post('test')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Testar sistema de alertas (apenas admin)' })
  @ApiResponse({ status: 200, description: 'Alerta de teste enviado' })
  async testAlert(@Body() body: { level: 'info' | 'warning' | 'error' | 'critical'; message: string }) {
    await this.alertsService.sendAlert(body.level, 'Test Alert', body.message);
    return { message: 'Alerta de teste enviado com sucesso' };
  }
} 