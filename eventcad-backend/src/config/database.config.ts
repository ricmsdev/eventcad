import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

/**
 * Configuração do banco de dados PostgreSQL para o EventCAD+
 * Suporta multi-tenant com isolamento de dados por schema
 */
export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get<string>('DATABASE_HOST', 'localhost'),
  port: configService.get<number>('DATABASE_PORT', 5432),
  username: configService.get<string>('DATABASE_USERNAME', 'eventcad_user'),
  password: configService.get<string>('DATABASE_PASSWORD', 'eventcad_password'),
  database: configService.get<string>('DATABASE_NAME', 'eventcad_db'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: configService.get<string>('NODE_ENV') === 'development',
  logging: configService.get<string>('NODE_ENV') === 'development',
  ssl: false,
  retryAttempts: 3,
  retryDelay: 3000,
  autoLoadEntities: true,

  // Configurações de performance e conexão
  extra: {
    max: 20, // máximo de conexões no pool
    min: 5, // mínimo de conexões no pool
    acquireTimeoutMillis: 60000,
    idleTimeoutMillis: 600000,
  },
});

/**
 * Configuração específica para multi-tenant
 * Cada tenant terá seu próprio schema no PostgreSQL
 */
export const getTenantDatabaseConfig = (
  configService: ConfigService,
  tenantId: string,
): TypeOrmModuleOptions => ({
  ...getDatabaseConfig(configService),
  schema: `tenant_${tenantId}`,
  name: `tenant_${tenantId}_connection`,
});

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '5432'),
  username: process.env.DATABASE_USERNAME || 'eventcad_user',
  password: process.env.DATABASE_PASSWORD || 'eventcad_password',
  database: process.env.DATABASE_NAME || 'eventcad_dev',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false,
  namingStrategy: new SnakeNamingStrategy(),
});

export default dataSource;
