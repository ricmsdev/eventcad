import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migração inicial do EventCAD+
 * Cria as tabelas básicas necessárias para o funcionamento do sistema
 */
export class InitialSetup1707350000001 implements MigrationInterface {
  name = 'InitialSetup1707350000001';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar extensões necessárias
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "inet"`);

    // Criar tipos ENUM
    await queryRunner.query(`
      CREATE TYPE "user_role_enum" AS ENUM (
        'viewer', 'operator', 'technician', 'engineer', 'safety_officer',
        'project_manager', 'venue_manager', 'admin', 'super_admin',
        'external_auditor', 'vendor', 'client'
      )
    `);

    // Criar tabela de tenants
    await queryRunner.query(`
      CREATE TABLE "tenants" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "tenant_id" character varying(50) NOT NULL,
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "name" character varying(100) NOT NULL,
        "subdomain" character varying(50) NOT NULL,
        "contact_email" character varying(150) NOT NULL,
        "contact_phone" character varying(20),
        "address" text,
        "city" character varying(100),
        "state" character varying(50),
        "postal_code" character varying(20),
        "country" character varying(50) NOT NULL DEFAULT 'BR',
        "currency" character varying(3) NOT NULL DEFAULT 'BRL',
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Sao_Paulo',
        "default_language" character varying(10) NOT NULL DEFAULT 'pt-BR',
        "logo_url" text,
        "primary_color" character varying(7) NOT NULL DEFAULT '#1976d2',
        "secondary_color" character varying(7) NOT NULL DEFAULT '#dc004e',
        "custom_css" text,
        "plan" character varying(50) NOT NULL DEFAULT 'basic',
        "max_events" integer NOT NULL DEFAULT 10,
        "max_users" integer NOT NULL DEFAULT 50,
        "storage_limit" bigint NOT NULL DEFAULT 10737418240,
        "storage_used" bigint NOT NULL DEFAULT 0,
        "compliance_rules" jsonb,
        "require_mfa" boolean NOT NULL DEFAULT false,
        "password_expiration_days" integer NOT NULL DEFAULT 90,
        "integration_settings" jsonb,
        "notification_settings" jsonb,
        "subscription_start_date" date,
        "subscription_end_date" date,
        "subscription_status" character varying(50),
        "monthly_fee" decimal(10,2),
        "custom_settings" jsonb,
        CONSTRAINT "PK_tenants" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_tenants_subdomain" UNIQUE ("subdomain")
      )
    `);

    // Criar tabela de usuários
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "tenant_id" character varying(50) NOT NULL,
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        "full_name" character varying(100) NOT NULL,
        "email" character varying(150) NOT NULL,
        "password" character varying(255) NOT NULL,
        "role" "user_role_enum" NOT NULL DEFAULT 'viewer',
        "phone" character varying(20),
        "position" character varying(100),
        "company" character varying(100),
        "avatar" text,
        "preferred_language" character varying(10) NOT NULL DEFAULT 'pt-BR',
        "timezone" character varying(50) NOT NULL DEFAULT 'America/Sao_Paulo',
        "mfa_enabled" boolean NOT NULL DEFAULT false,
        "mfa_secret" character varying(255),
        "email_verified" boolean NOT NULL DEFAULT false,
        "email_verification_token" character varying(255),
        "password_reset_token" character varying(255),
        "password_reset_expires" TIMESTAMP WITH TIME ZONE,
        "last_login_at" TIMESTAMP WITH TIME ZONE,
        "last_login_ip" inet,
        "login_attempts" integer NOT NULL DEFAULT 0,
        "locked_until" TIMESTAMP WITH TIME ZONE,
        "settings" jsonb,
        CONSTRAINT "PK_users" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);

    // Criar índices para performance
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_subdomain" ON "tenants" ("subdomain")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_tenants_active" ON "tenants" ("is_active")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_email" ON "users" ("email")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_tenant" ON "users" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_role" ON "users" ("role")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_users_active" ON "users" ("is_active")`,
    );

    // Criar função para atualizar updated_at automaticamente
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = now();
        RETURN NEW;
      END;
      $$ language 'plpgsql';
    `);

    // Aplicar trigger para atualização automática do updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_tenants_updated_at 
      BEFORE UPDATE ON tenants 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    await queryRunner.query(`
      CREATE TRIGGER update_users_updated_at 
      BEFORE UPDATE ON users 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover triggers
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_users_updated_at ON users`,
    );
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants`,
    );

    // Remover função
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS update_updated_at_column()`,
    );

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_role"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_email"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_tenants_subdomain"`);

    // Remover tabelas
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "tenants"`);

    // Remover tipos
    await queryRunner.query(`DROP TYPE IF EXISTS "user_role_enum"`);

    // Remover extensões (opcional - outras aplicações podem estar usando)
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "inet"`);
    // await queryRunner.query(`DROP EXTENSION IF EXISTS "uuid-ossp"`);
  }
}
