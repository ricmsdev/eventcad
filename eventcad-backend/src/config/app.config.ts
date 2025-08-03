import { ConfigService } from '@nestjs/config';

/**
 * Configurações centrais da aplicação EventCAD+
 * Todas as configurações de ambiente ficam centralizadas aqui
 */
export interface AppConfig {
  port: number;
  nodeEnv: string;
  apiPrefix: string;
  corsOrigin: string | string[];

  // JWT Configuration
  jwt: {
    secret: string;
    expiresIn: string;
    refreshSecret: string;
    refreshExpiresIn: string;
  };

  // Upload Configuration
  upload: {
    maxSize: number;
    destination: string;
    allowedMimeTypes: string[];
    storageType: 'local' | 's3' | 'minio';
  };

  // Security Configuration
  security: {
    rateLimitTtl: number;
    rateLimitMax: number;
    bcryptRounds: number;
  };

  // External Services
  externalServices: {
    aiServiceUrl: string;
    aiServiceApiKey: string;
  };

  // Multi-tenant Configuration
  tenant: {
    isolationEnabled: boolean;
    defaultTenant: string;
  };

  // Compliance Configuration
  compliance: {
    engineEnabled: boolean;
    rulesPath: string;
  };
}

/**
 * Factory function para criar configuração da aplicação
 * @param configService - Serviço de configuração do NestJS
 * @returns Configuração completa da aplicação
 */
export const getAppConfig = (configService: ConfigService): AppConfig => ({
  port: configService.get<number>('PORT', 3000),
  nodeEnv: configService.get<string>('NODE_ENV', 'development'),
  apiPrefix: configService.get<string>('API_PREFIX', 'api/v1'),
  corsOrigin: configService.get<string>('CORS_ORIGIN', 'http://localhost:3001'),

  jwt: {
    secret: configService.get<string>(
      'JWT_SECRET',
      'default-secret-change-in-production',
    ),
    expiresIn: configService.get<string>('JWT_EXPIRES_IN', '1h'),
    refreshSecret: configService.get<string>(
      'JWT_REFRESH_SECRET',
      'default-refresh-secret',
    ),
    refreshExpiresIn: configService.get<string>('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  upload: {
    maxSize: configService.get<number>('UPLOAD_MAX_SIZE', 104857600), // 100MB
    destination: configService.get<string>('UPLOAD_DESTINATION', './uploads'),
    allowedMimeTypes: [
      'application/pdf',
      'application/dwg',
      'application/dxf',
      'model/ifc',
      'image/jpeg',
      'image/png',
      'image/svg+xml',
      'application/zip',
      'application/x-zip-compressed',
    ],
    storageType: configService.get<'local' | 's3' | 'minio'>(
      'STORAGE_TYPE',
      'local',
    ),
  },

  security: {
    rateLimitTtl: configService.get<number>('RATE_LIMIT_TTL', 60),
    rateLimitMax: configService.get<number>('RATE_LIMIT_LIMIT', 100),
    bcryptRounds: configService.get<number>('BCRYPT_ROUNDS', 12),
  },

  externalServices: {
    aiServiceUrl: configService.get<string>(
      'AI_SERVICE_URL',
      'http://localhost:8000',
    ),
    aiServiceApiKey: configService.get<string>('AI_SERVICE_API_KEY', ''),
  },

  tenant: {
    isolationEnabled: configService.get<boolean>('TENANT_ISOLATION', true),
    defaultTenant: configService.get<string>('DEFAULT_TENANT', 'default'),
  },

  compliance: {
    engineEnabled: configService.get<boolean>(
      'COMPLIANCE_ENGINE_ENABLED',
      true,
    ),
    rulesPath: configService.get<string>(
      'COMPLIANCE_RULES_PATH',
      './config/compliance-rules',
    ),
  },
});
