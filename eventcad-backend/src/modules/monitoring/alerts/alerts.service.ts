import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface AlertConfig {
  email?: {
    enabled: boolean;
    to: string[];
    from: string;
    smtp: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  webhook?: {
    enabled: boolean;
    url: string;
    headers?: Record<string, string>;
  };
  console?: {
    enabled: boolean;
  };
}

export interface Alert {
  id: string;
  level: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
  acknowledged?: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
}

export interface DailyReport {
  date: string;
  summary: {
    totalRequests: number;
    totalErrors: number;
    averageResponseTime: number;
    uptime: number;
  };
  alerts: {
    critical: number;
    error: number;
    warning: number;
    info: number;
  };
  resources: {
    memoryUsage: number;
    cpuUsage: number;
    diskUsage: number;
  };
}

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);
  private alerts: Alert[] = [];
  private config: AlertConfig;
  private emailTransporter?: nodemailer.Transporter;

  constructor() {
    this.initializeAlerts();
  }

  private async initializeAlerts(): Promise<void> {
    this.logger.log('🚨 Inicializando sistema de alertas...');

    this.config = {
      email: {
        enabled: process.env.ALERT_EMAIL_ENABLED === 'true',
        to: process.env.ALERT_EMAIL_TO?.split(',') || [],
        from: process.env.ALERT_EMAIL_FROM || 'alerts@eventcad.com',
        smtp: {
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER || '',
            pass: process.env.SMTP_PASS || '',
          },
        },
      },
      webhook: {
        enabled: process.env.ALERT_WEBHOOK_ENABLED === 'true',
        url: process.env.ALERT_WEBHOOK_URL || '',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'EventCAD-Alerts/1.0',
        },
      },
      console: {
        enabled: true,
      },
    };

    if (this.config.email?.enabled && this.config.email.smtp.auth.user) {
      try {
        this.emailTransporter = nodemailer.createTransport(this.config.email.smtp);
        await this.emailTransporter.verify();
        this.logger.log('✅ Email transporter configurado com sucesso');
      } catch (error) {
        this.logger.error('❌ Falha ao configurar email transporter:', error);
        this.config.email.enabled = false;
      }
    }

    this.logger.log('✅ Sistema de alertas inicializado');
  }

  async setupAlerts(): Promise<void> {
    this.logger.log('🔔 Alertas configurados');
  }

  async sendAlert(
    level: 'info' | 'warning' | 'error' | 'critical',
    title: string,
    data?: any,
  ): Promise<void> {
    const alert: Alert = {
      id: this.generateAlertId(),
      level,
      title,
      message: typeof data === 'string' ? data : JSON.stringify(data),
      timestamp: new Date(),
      metadata: typeof data === 'object' ? data : undefined,
    };

    this.alerts.push(alert);

    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    await this.sendNotifications(alert);

    this.logger.log(`🚨 Alerta ${level}: ${title}`);
  }

  private generateAlertId(): string {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async sendNotifications(alert: Alert): Promise<void> {
    const promises: Promise<void>[] = [];

    if (this.config.console?.enabled) {
      promises.push(this.sendConsoleAlert(alert));
    }

    if (this.config.email?.enabled && this.emailTransporter) {
      promises.push(this.sendEmailAlert(alert));
    }

    if (this.config.webhook?.enabled) {
      promises.push(this.sendWebhookAlert(alert));
    }

    await Promise.allSettled(promises);
  }

  private async sendConsoleAlert(alert: Alert): Promise<void> {
    const emoji = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '❌',
      critical: '🚨',
    };

    const color = {
      info: '\x1b[36m',
      warning: '\x1b[33m',
      error: '\x1b[31m',
      critical: '\x1b[35m',
    };

    const reset = '\x1b[0m';

    console.log(
      `${color[alert.level]}${emoji[alert.level]} [${alert.level.toUpperCase()}] ${alert.title}${reset}`,
    );
    console.log(`${color[alert.level]}   ${alert.message}${reset}`);
    console.log(`${color[alert.level]}   Timestamp: ${alert.timestamp.toISOString()}${reset}`);
    
    if (alert.metadata) {
      console.log(`${color[alert.level]}   Metadata: ${JSON.stringify(alert.metadata, null, 2)}${reset}`);
    }
    console.log('');
  }

  private async sendEmailAlert(alert: Alert): Promise<void> {
    if (!this.emailTransporter || !this.config.email) return;

    try {
      const subject = `[EventCAD] ${alert.level.toUpperCase()}: ${alert.title}`;
      
      const html = `
        <h2>🚨 Alerta EventCAD+</h2>
        <p><strong>Nível:</strong> ${alert.level.toUpperCase()}</p>
        <p><strong>Título:</strong> ${alert.title}</p>
        <p><strong>Mensagem:</strong> ${alert.message}</p>
        <p><strong>Timestamp:</strong> ${alert.timestamp.toISOString()}</p>
        ${alert.metadata ? `<p><strong>Detalhes:</strong> <pre>${JSON.stringify(alert.metadata, null, 2)}</pre></p>` : ''}
        <hr>
        <p><small>EventCAD+ Monitoring System</small></p>
      `;

      await this.emailTransporter.sendMail({
        from: this.config.email.from,
        to: this.config.email.to,
        subject,
        html,
      });

      this.logger.log(`📧 Email de alerta enviado para ${this.config.email.to.join(', ')}`);
    } catch (error) {
      this.logger.error('❌ Falha ao enviar email de alerta:', error);
    }
  }

  private async sendWebhookAlert(alert: Alert): Promise<void> {
    if (!this.config.webhook?.enabled || !this.config.webhook.url) return;

    try {
      const payload = {
        alert: {
          id: alert.id,
          level: alert.level,
          title: alert.title,
          message: alert.message,
          timestamp: alert.timestamp.toISOString(),
          metadata: alert.metadata,
        },
        service: 'EventCAD+',
        environment: process.env.NODE_ENV || 'development',
      };

      const response = await fetch(this.config.webhook.url, {
        method: 'POST',
        headers: this.config.webhook.headers,
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      this.logger.log(`🔗 Webhook de alerta enviado para ${this.config.webhook.url}`);
    } catch (error) {
      this.logger.error('❌ Falha ao enviar webhook de alerta:', error);
    }
  }

  async getAlerts(level?: string, acknowledged?: boolean, limit?: number): Promise<Alert[]> {
    let filteredAlerts = this.alerts;

    if (level) {
      filteredAlerts = filteredAlerts.filter(alert => alert.level === level);
    }

    if (acknowledged !== undefined) {
      filteredAlerts = filteredAlerts.filter(alert => alert.acknowledged === acknowledged);
    }

    if (limit) {
      filteredAlerts = filteredAlerts.slice(-limit);
    }

    return filteredAlerts;
  }

  async getUnacknowledgedAlerts(): Promise<Alert[]> {
    return this.alerts.filter(alert => !alert.acknowledged);
  }

  async getAlertStats() {
    const total = this.alerts.length;
    const unacknowledged = this.alerts.filter(alert => !alert.acknowledged).length;
    const byLevel = {
      critical: this.alerts.filter(alert => alert.level === 'critical').length,
      error: this.alerts.filter(alert => alert.level === 'error').length,
      warning: this.alerts.filter(alert => alert.level === 'warning').length,
      info: this.alerts.filter(alert => alert.level === 'info').length,
    };

    return {
      total,
      unacknowledged,
      byLevel,
    };
  }

  async acknowledgeAlert(alertId: string, acknowledgedBy: string): Promise<Alert | null> {
    const alert = this.alerts.find(a => a.id === alertId);
    if (!alert) return null;

    alert.acknowledged = true;
    alert.acknowledgedBy = acknowledgedBy;
    alert.acknowledgedAt = new Date();

    return alert;
  }

  async sendDailyReport(report: DailyReport): Promise<void> {
    await this.sendAlert('info', 'Relatório Diário', report);
  }
} 