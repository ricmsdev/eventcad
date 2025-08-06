import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import Redis from 'ioredis';

export interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: Date;
  checks: {
    database: { status: 'up' | 'down'; responseTime?: number };
    redis: { status: 'up' | 'down'; responseTime?: number };
    externalServices: { status: 'up' | 'down' };
    diskSpace: { status: 'up' | 'down'; available?: number };
    memory: { status: 'up' | 'down'; usage?: number };
  };
  summary: {
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
  };
}

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);
  private redis: Redis;

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
  ) {
    // Inicializar conexão Redis se configurada
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
    }
  }

  async runAllChecks(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const checks = {
      database: await this.checkDatabase(),
      redis: await this.checkRedis(),
      externalServices: await this.checkExternalServices(),
      diskSpace: await this.checkDiskSpace(),
      memory: await this.checkMemory(),
    };

    const totalChecks = Object.keys(checks).length;
    const passedChecks = Object.values(checks).filter(check => check.status === 'up').length;
    const failedChecks = totalChecks - passedChecks;

    let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
    if (failedChecks > 0) {
      overallStatus = failedChecks === totalChecks ? 'unhealthy' : 'degraded';
    }

    const result: HealthCheckResult = {
      status: overallStatus,
      timestamp: new Date(),
      checks,
      summary: {
        totalChecks,
        passedChecks,
        failedChecks,
      },
    };

    this.logger.log(`Health check completed: ${passedChecks}/${totalChecks} checks passed`);
    return result;
  }

  private async checkDatabase(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
    const startTime = Date.now();
    try {
      await this.dataSource.query('SELECT 1');
      const responseTime = Date.now() - startTime;
      return { status: 'up', responseTime };
    } catch (error) {
      this.logger.error('Database health check failed', error);
      return { status: 'down' };
    }
  }

  private async checkRedis(): Promise<{ status: 'up' | 'down'; responseTime?: number }> {
    if (!this.redis) {
      return { status: 'up' }; // Redis não configurado, considerar saudável
    }

    const startTime = Date.now();
    try {
      await this.redis.ping();
      const responseTime = Date.now() - startTime;
      return { status: 'up', responseTime };
    } catch (error) {
      this.logger.error('Redis health check failed', error);
      return { status: 'down' };
    }
  }

  private async checkExternalServices(): Promise<{ status: 'up' | 'down' }> {
    // Verificar serviços externos críticos
    const externalServices = [
      'https://api.github.com/zen', // GitHub API
      'https://httpbin.org/get', // Serviço de teste
    ];

    try {
      const results = await Promise.allSettled(
        externalServices.map(url => fetch(url, { method: 'GET' }))
      );

      const successfulChecks = results.filter(result => 
        result.status === 'fulfilled' && result.value.ok
      ).length;

      return {
        status: successfulChecks >= externalServices.length * 0.5 ? 'up' : 'down'
      };
    } catch (error) {
      this.logger.error('External services health check failed', error);
      return { status: 'down' };
    }
  }

  private async checkDiskSpace(): Promise<{ status: 'up' | 'down'; available?: number }> {
    try {
      // Implementação básica - em produção usar biblioteca específica
      const fs = require('fs');
      const path = require('path');
      
      // Verificar espaço em disco do diretório atual
      const stats = fs.statSync('.');
      const available = stats.size; // Simplificado para exemplo
      
      // Considerar saudável se disponível > 100MB
      return {
        status: available > 100 * 1024 * 1024 ? 'up' : 'down',
        available
      };
    } catch (error) {
      this.logger.error('Disk space check failed', error);
      return { status: 'down' };
    }
  }

  private async checkMemory(): Promise<{ status: 'up' | 'down'; usage?: number }> {
    try {
      const usage = process.memoryUsage();
      const memoryUsage = usage.heapUsed / usage.heapTotal;
      
      // Considerar saudável se uso < 80%
      return {
        status: memoryUsage < 0.8 ? 'up' : 'down',
        usage: memoryUsage
      };
    } catch (error) {
      this.logger.error('Memory check failed', error);
      return { status: 'down' };
    }
  }
}