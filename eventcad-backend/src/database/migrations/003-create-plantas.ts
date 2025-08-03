import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration para criação da tabela de plantas técnicas do EventCAD+
 * Inclui enums, índices, constraints e FK para eventos
 * Segue boas práticas de modelagem, performance e documentação
 */
export class CreatePlantas1704067100000 implements MigrationInterface {
  name = 'CreatePlantas1704067100000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // --- ENUMS ---
    // Status possíveis para uma planta técnica
    await queryRunner.query(`
      CREATE TYPE "plantas_status_enum" AS ENUM (
        'draft', 'uploaded', 'review_needed', 'approved', 'rejected', 'ai_processing', 'ai_completed', 'error'
      )
    `);
    // Tipos de planta técnica suportados
    await queryRunner.query(`
      CREATE TYPE "plantas_plantatipo_enum" AS ENUM (
        'arquitetonica', 'combate_incendio', 'eletrica', 'hidraulica', 'acessibilidade', 'outros'
      )
    `);
    // Categoria/área da planta
    await queryRunner.query(`
      CREATE TYPE "plantas_category_enum" AS ENUM (
        'pavilhao', 'stand', 'area_comum', 'externa', 'outros'
      )
    `);

    // --- TABELA PRINCIPAL ---
    await queryRunner.query(`
      CREATE TABLE "plantas" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "tenant_id" character varying(50) NOT NULL, -- multi-tenant
        "created_by" uuid, -- usuário que criou
        "updated_by" uuid, -- usuário que atualizou
        "is_active" boolean NOT NULL DEFAULT true, -- soft delete
        "original_name" character varying(255) NOT NULL, -- nome original do arquivo
        "filename" character varying(100) NOT NULL, -- nome salvo
        "path" character varying(500) NOT NULL, -- caminho no storage
        "type" character varying(20) NOT NULL, -- tipo de arquivo (ex: pdf, dwg)
        "category" "plantas_category_enum" NOT NULL, -- área/categoria
        "planta_tipo" "plantas_plantatipo_enum" NOT NULL, -- tipo técnico
        "planta_status" "plantas_status_enum" NOT NULL DEFAULT 'draft', -- status de workflow
        "status" "plantas_status_enum" NOT NULL DEFAULT 'draft', -- status duplicado para queries
        "size" bigint NOT NULL, -- tamanho do arquivo
        "metadata" jsonb, -- metadados técnicos
        "event_id" uuid, -- FK para evento relacionado
        CONSTRAINT "PK_plantas" PRIMARY KEY ("id")
      )
    `);

    // --- ÍNDICES PARA PERFORMANCE ---
    await queryRunner.query(
      `CREATE INDEX "IDX_plantas_tenant" ON "plantas" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plantas_event" ON "plantas" ("event_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plantas_status" ON "plantas" ("planta_status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plantas_tipo" ON "plantas" ("planta_tipo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_plantas_category" ON "plantas" ("category")`,
    );

    // --- FOREIGN KEY PARA EVENTOS ---
    // Garante integridade referencial, mas permite plantas sem evento
    await queryRunner.query(`
      ALTER TABLE "plantas"
      ADD CONSTRAINT "FK_plantas_event"
      FOREIGN KEY ("event_id") REFERENCES "eventos"("id") ON DELETE SET NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover FK
    await queryRunner.query(
      'ALTER TABLE "plantas" DROP CONSTRAINT IF EXISTS "FK_plantas_event"',
    );
    // Remover índices
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_plantas_category"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_plantas_tipo"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_plantas_status"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_plantas_event"');
    await queryRunner.query('DROP INDEX IF EXISTS "IDX_plantas_tenant"');
    // Remover tabela
    await queryRunner.query('DROP TABLE IF EXISTS "plantas"');
    // Remover enums
    await queryRunner.query('DROP TYPE IF EXISTS "plantas_category_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "plantas_plantatipo_enum"');
    await queryRunner.query('DROP TYPE IF EXISTS "plantas_status_enum"');
  }
}
