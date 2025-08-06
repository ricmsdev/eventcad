import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { MetricsService } from '../../modules/monitoring/metrics/metrics.service';
import { LoggingService } from '../../modules/monitoring/logging/logging.service';

@Injectable()
export class MonitoringMiddleware implements NestMiddleware {
  private readonly logger = new Logger(MonitoringMiddleware.name);

  constructor(
    private readonly metricsService: MetricsService,
    private readonly loggingService: LoggingService,
  ) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const startTime = Date.now();
    const requestId = this.generateRequestId();
    
    // Adicionar request ID ao objeto de requisição
    (req as any).requestId = requestId;

    // Registrar início da requisição
    this.metricsService.recordRequest();
    
    // Log da requisição
    this.loggingService.info('Request started', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id,
      tenantId: (req as any).user?.tenantId,
    });

    // Interceptar resposta
    const originalSend = res.send;
    res.send = function(body: any) {
      const responseTime = Date.now() - startTime;
      
      // Registrar tempo de resposta
      this.metricsService.recordResponseTime(responseTime);
      
      // Registrar erro se status >= 400
      if (res.statusCode >= 400) {
        this.metricsService.recordError();
        
        this.loggingService.error('Request failed', null, {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
          responseTime,
          error: body,
          userId: (req as any).user?.id,
          tenantId: (req as any).user?.tenantId,
        });
      } else {
        // Log de sucesso para operações importantes
        if (req.method !== 'GET' && req.method !== 'OPTIONS') {
          this.loggingService.info('Request completed', {
            requestId,
            method: req.method,
            url: req.url,
            statusCode: res.statusCode,
            responseTime,
            userId: (req as any).user?.id,
            tenantId: (req as any).user?.tenantId,
          });
        }
      }

      // Log de performance para requisições lentas
      if (responseTime > 1000) { // Mais de 1 segundo
        this.loggingService.performance('Slow request', responseTime, {
          requestId,
          method: req.method,
          url: req.url,
          statusCode: res.statusCode,
        });
      }

      return originalSend.call(this, body);
    }.bind(this);

    next();
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
} 