import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as winston from 'winston';
import 'winston-daily-rotate-file';

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  service: string;
  environment: string;
  requestId?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

@Injectable()
export class LoggingService {
  private logger: winston.Logger;
  private readonly logDir = path.join(process.cwd(), 'logs');

  constructor() {
    this.setupStructuredLogging();
  }

  setupStructuredLogging(): void {
    // Criar diretório de logs se não existir
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }

    // Configurar formatos
    const logFormat = winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        return `${timestamp} [${level}]: ${message} ${Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ''}`;
      }),
    );

    // Configurar transportes
    const transports: winston.transport[] = [
      // Console para desenvolvimento
      new winston.transports.Console({
        format: consoleFormat,
        level: process.env.LOG_LEVEL || 'info',
      }),
    ];

    // Arquivo de logs para produção
    if (process.env.NODE_ENV === 'production') {
      // Logs gerais
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(this.logDir, 'application-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          format: logFormat,
          level: 'info',
        }),
      );

      // Logs de erro
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(this.logDir, 'error-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '30d',
          format: logFormat,
          level: 'error',
        }),
      );

      // Logs de auditoria
      transports.push(
        new winston.transports.DailyRotateFile({
          filename: path.join(this.logDir, 'audit-%DATE%.log'),
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '90d',
          format: logFormat,
          level: 'info',
        }),
      );
    }

    // Criar logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      transports,
      exitOnError: false,
    });

    // Log de inicialização
    this.logger.info('🚀 Sistema de logging estruturado inicializado', {
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      logLevel: process.env.LOG_LEVEL || 'info',
    });
  }

  log(level: 'info' | 'warn' | 'error' | 'debug', data: any): void {
    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: typeof data === 'string' ? data : data.message || 'Log entry',
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      ...data,
    };

    this.logger.log(level, logEntry.message, logEntry);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log('info', { message, ...metadata });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', { message, ...metadata });
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    const errorData = error ? {
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      },
    } : {};

    this.log('error', { 
      message, 
      ...errorData, 
      ...metadata 
    });
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', { message, ...metadata });
  }

  // Logs específicos para auditoria
  audit(action: string, userId?: string, tenantId?: string, details?: Record<string, any>): void {
    this.logger.info('AUDIT', {
      action,
      userId,
      tenantId,
      timestamp: new Date().toISOString(),
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      ...details,
    });
  }

  // Logs de segurança
  security(event: string, userId?: string, ip?: string, details?: Record<string, any>): void {
    this.logger.warn('SECURITY', {
      event,
      userId,
      ip,
      timestamp: new Date().toISOString(),
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      ...details,
    });
  }

  // Logs de performance
  performance(operation: string, duration: number, metadata?: Record<string, any>): void {
    this.logger.info('PERFORMANCE', {
      operation,
      duration,
      timestamp: new Date().toISOString(),
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      ...metadata,
    });
  }

  // Logs de negócio
  business(event: string, entity: string, entityId?: string, details?: Record<string, any>): void {
    this.logger.info('BUSINESS', {
      event,
      entity,
      entityId,
      timestamp: new Date().toISOString(),
      service: 'EventCAD+',
      environment: process.env.NODE_ENV || 'development',
      ...details,
    });
  }

  async cleanupOldLogs(): Promise<void> {
    try {
      const logFiles = fs.readdirSync(this.logDir);
      const now = new Date();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 dias

      for (const file of logFiles) {
        const filePath = path.join(this.logDir, file);
        const stats = fs.statSync(filePath);

        if (now.getTime() - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          this.logger.info(`🗑️ Log file deleted: ${file}`);
        }
      }
    } catch (error) {
      this.logger.error('Failed to cleanup old logs', error);
    }
  }

  async getRecentLogs(level?: string, limit: number = 100): Promise<LogEntry[]> {
    try {
      const logFiles = fs.readdirSync(this.logDir)
        .filter(file => file.endsWith('.log'))
        .sort()
        .reverse();

      const logs: LogEntry[] = [];

      for (const file of logFiles) {
        if (logs.length >= limit) break;

        const filePath = path.join(this.logDir, file);
        const content = fs.readFileSync(filePath, 'utf8');
        
        const lines = content.split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          if (logs.length >= limit) break;

          try {
            const logEntry = JSON.parse(line);
            
            if (!level || logEntry.level === level) {
              logs.push(logEntry);
            }
          } catch (error) {
            // Ignorar linhas que não são JSON válido
            continue;
          }
        }
      }

      return logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      this.logger.error('Failed to get recent logs', error);
      return [];
    }
  }

  async searchLogs(query: string, level?: string, from?: string, to?: string): Promise<LogEntry[]> {
    try {
      const logs = await this.getRecentLogs(level, 1000);
      
      return logs.filter(log => {
        // Filtrar por query
        const matchesQuery = !query || 
          log.message.toLowerCase().includes(query.toLowerCase()) ||
          JSON.stringify(log.metadata || {}).toLowerCase().includes(query.toLowerCase());

        // Filtrar por data
        const logDate = new Date(log.timestamp);
        const fromDate = from ? new Date(from) : null;
        const toDate = to ? new Date(to) : null;

        const matchesFrom = !fromDate || logDate >= fromDate;
        const matchesTo = !toDate || logDate <= toDate;

        return matchesQuery && matchesFrom && matchesTo;
      });
    } catch (error) {
      this.logger.error('Failed to search logs', error);
      return [];
    }
  }
} 