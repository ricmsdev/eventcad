import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { MetricsService, MetricsData, DailyReport } from './metrics.service';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { UserRole } from '../../../common/enums/user-role.enum';

@ApiTags('Metrics')
@Controller('metrics')
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obter métricas atuais do sistema' })
  @ApiResponse({ status: 200, description: 'Métricas do sistema' })
  async getMetrics(): Promise<MetricsData> {
    return this.metricsService.getCurrentMetrics();
  }

  @Get('prometheus')
  @ApiOperation({ summary: 'Métricas no formato Prometheus' })
  @ApiResponse({ status: 200, description: 'Métricas em formato Prometheus' })
  async getPrometheusMetrics(): Promise<string> {
    const metrics = await this.metricsService.getCurrentMetrics();
    
    // Formato Prometheus
    const prometheusMetrics = [
      `# HELP eventcad_requests_per_minute Total requests per minute`,
      `# TYPE eventcad_requests_per_minute gauge`,
      `eventcad_requests_per_minute ${metrics.requestsPerMinute}`,
      '',
      `# HELP eventcad_error_rate Error rate percentage`,
      `# TYPE eventcad_error_rate gauge`,
      `eventcad_error_rate ${metrics.errorRate}`,
      '',
      `# HELP eventcad_response_time_average Average response time in milliseconds`,
      `# TYPE eventcad_response_time_average gauge`,
      `eventcad_response_time_average ${metrics.responseTime}`,
      '',
      `# HELP eventcad_active_connections Current active connections`,
      `# TYPE eventcad_active_connections gauge`,
      `eventcad_active_connections ${metrics.activeConnections}`,
      '',
      `# HELP eventcad_memory_usage_percentage Memory usage percentage`,
      `# TYPE eventcad_memory_usage_percentage gauge`,
      `eventcad_memory_usage_percentage ${metrics.memoryUsage.percentage}`,
      '',
      `# HELP eventcad_cpu_usage_percentage CPU usage percentage`,
      `# TYPE eventcad_cpu_usage_percentage gauge`,
      `eventcad_cpu_usage_percentage ${metrics.cpuUsage.percentage}`,
    ].join('\n');

    return prometheusMetrics;
  }

  @Get('report/daily')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Relatório diário de métricas' })
  @ApiResponse({ status: 200, description: 'Relatório diário' })
  async getDailyReport(): Promise<DailyReport> {
    return this.metricsService.generateDailyReport();
  }

  @Get('system')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Métricas do sistema operacional' })
  @ApiResponse({ status: 200, description: 'Métricas do sistema' })
  async getSystemMetrics() {
    const metrics = await this.metricsService.getCurrentMetrics();
    
    return {
      timestamp: new Date().toISOString(),
      memory: metrics.memoryUsage,
      cpu: metrics.cpuUsage,
      disk: metrics.diskUsage,
      uptime: process.uptime(),
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
    };
  }
} 