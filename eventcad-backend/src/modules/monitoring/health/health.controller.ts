import { Controller, Get, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService, HealthCheckResult } from './health.service';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Status básico de saúde' })
  @ApiResponse({ status: 200, description: 'Sistema saudável' })
  @ApiResponse({ status: 503, description: 'Sistema degradado' })
  @ApiResponse({ status: 500, description: 'Sistema não saudável' })
  async getHealth(@Res() res: Response): Promise<void> {
    try {
      const health = await this.healthService.runAllChecks();
      
      const statusCode = health.status === 'healthy' 
        ? HttpStatus.OK 
        : health.status === 'degraded' 
          ? HttpStatus.SERVICE_UNAVAILABLE 
          : HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: Math.round(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        summary: health.summary,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Health check failed',
      });
    }
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Status detalhado de saúde com todos os checks' })
  @ApiResponse({ status: 200, description: 'Status detalhado do sistema' })
  async getDetailedHealth(@Res() res: Response): Promise<void> {
    try {
      const health = await this.healthService.runAllChecks();
      
      const statusCode = health.status === 'healthy' 
        ? HttpStatus.OK 
        : health.status === 'degraded' 
          ? HttpStatus.SERVICE_UNAVAILABLE 
          : HttpStatus.INTERNAL_SERVER_ERROR;

      res.status(statusCode).json({
        status: health.status,
        timestamp: health.timestamp,
        uptime: Math.round(process.uptime()),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        checks: health.checks,
        summary: health.summary,
      });
    } catch (error) {
      res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        status: 'unhealthy',
        timestamp: new Date(),
        error: 'Detailed health check failed',
      });
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe - verifica se o sistema está pronto' })
  @ApiResponse({ status: 200, description: 'Sistema pronto' })
  @ApiResponse({ status: 503, description: 'Sistema não está pronto' })
  async getReadiness(@Res() res: Response): Promise<void> {
    try {
      const health = await this.healthService.runAllChecks();
      
      // Para readiness, considerar apenas checks críticos
      const criticalChecks = [health.checks.database, health.checks.redis];
      const isReady = criticalChecks.every(check => check.status === 'up');
      
      const statusCode = isReady ? HttpStatus.OK : HttpStatus.SERVICE_UNAVAILABLE;
      
      res.status(statusCode).json({
        status: isReady ? 'ready' : 'not_ready',
        timestamp: new Date(),
        checks: {
          database: health.checks.database,
          redis: health.checks.redis,
        },
      });
    } catch (error) {
      res.status(HttpStatus.SERVICE_UNAVAILABLE).json({
        status: 'not_ready',
        timestamp: new Date(),
        error: 'Readiness check failed',
      });
    }
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness probe - verifica se a aplicação está viva' })
  @ApiResponse({ status: 200, description: 'Aplicação viva' })
  async getLiveness(@Res() res: Response): Promise<void> {
    // Liveness check é simples - se o endpoint responde, a aplicação está viva
    res.status(HttpStatus.OK).json({
      status: 'alive',
      timestamp: new Date(),
      uptime: Math.round(process.uptime()),
    });
  }
}