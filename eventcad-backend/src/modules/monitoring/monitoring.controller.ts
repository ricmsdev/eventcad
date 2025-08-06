import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MonitoringService } from './monitoring.service';

@ApiTags('Monitoring')
@Controller('monitoring')
export class MonitoringController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get()
  @ApiOperation({ summary: 'Status geral do sistema de monitoramento' })
  @ApiResponse({ status: 200, description: 'Status dos módulos de monitoramento' })
  async getMonitoringStatus() {
    return { message: 'Monitoring endpoint working!', timestamp: new Date().toISOString() };
  }

  @Get('health')
  @ApiOperation({ summary: 'Status de saúde via monitoring' })
  @ApiResponse({ status: 200, description: 'Status de saúde do sistema' })
  async getHealthStatus() {
    return await this.monitoringService.getHealthSummary();
  }
}