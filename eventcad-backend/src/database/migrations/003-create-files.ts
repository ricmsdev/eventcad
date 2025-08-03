import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migração para criação da tabela de arquivos
 * Sistema completo de upload, processamento e gestão de arquivos
 */
export class CreateFiles1707360000003 implements MigrationInterface {
  name = 'CreateFiles1707360000003';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipos ENUM para arquivos
    await queryRunner.query(`
      CREATE TYPE "file_type_enum" AS ENUM (
        'dwg', 'dxf', 'ifc',
        'pdf', 'docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt',
        'jpeg', 'jpg', 'png', 'svg', 'webp',
        'mp4', 'mov', 'avi', 'mp3', 'wav',
        'zip', 'rar', 'tar', 'gz',
        'csv', 'txt', 'json', 'xml'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "file_category_enum" AS ENUM (
        'plant', 'document', 'image', 'video', 'audio', 'archive', 'data'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "file_status_enum" AS ENUM (
        'uploading', 'uploaded', 'processing', 'processed', 'failed', 'quarantine', 'deleted'
      )
    `);

    // Criar tabela de arquivos
    await queryRunner.query(`
      CREATE TABLE "files" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "tenant_id" character varying(50) NOT NULL,
        "created_by" uuid,
        "updated_by" uuid,
        "is_active" boolean NOT NULL DEFAULT true,
        
        -- Informações básicas do arquivo
        "original_name" character varying(255) NOT NULL,
        "filename" character varying(100) NOT NULL,
        "path" character varying(500) NOT NULL,
        "extension" character varying(10) NOT NULL,
        "type" "file_type_enum" NOT NULL,
        "category" "file_category_enum" NOT NULL,
        "mime_type" character varying(100) NOT NULL,
        "size" bigint NOT NULL,
        "status" "file_status_enum" NOT NULL DEFAULT 'uploading',
        
        -- Relacionamentos
        "uploaded_by" uuid NOT NULL,
        "entity_type" character varying(50),
        "entity_id" uuid,
        
        -- Armazenamento
        "storage_type" character varying(20) NOT NULL DEFAULT 'local',
        "bucket" character varying(100),
        "public_url" character varying(500),
        "private_url" character varying(500),
        "url_expires_at" TIMESTAMP WITH TIME ZONE,
        
        -- Metadados e processamento
        "metadata" jsonb,
        "processing_info" jsonb,
        
        -- Versionamento
        "version" integer NOT NULL DEFAULT 1,
        "previous_version_id" uuid,
        "is_latest_version" boolean NOT NULL DEFAULT true,
        "version_comment" text,
        
        -- Segurança
        "hash" character varying(64),
        "md5" character varying(32),
        "security_scan" jsonb,
        
        -- Compressão/otimização
        "original_size" bigint,
        "compression_ratio" decimal(5,2),
        "derived_files" jsonb,
        
        -- Configurações de acesso
        "is_public" boolean NOT NULL DEFAULT false,
        "permissions" jsonb,
        "expires_at" TIMESTAMP WITH TIME ZONE,
        
        -- Estatísticas
        "view_count" integer NOT NULL DEFAULT 0,
        "download_count" integer NOT NULL DEFAULT 0,
        "last_accessed_at" TIMESTAMP WITH TIME ZONE,
        
        -- Configurações
        "settings" jsonb,
        
        CONSTRAINT "PK_files" PRIMARY KEY ("id")
      )
    `);

    // Criar índices para performance
    await queryRunner.query(
      `CREATE INDEX "IDX_files_tenant" ON "files" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_category" ON "files" ("category")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_status" ON "files" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_uploaded_by" ON "files" ("uploaded_by")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_entity" ON "files" ("entity_type", "entity_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_filename" ON "files" ("filename")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_original_name" ON "files" ("original_name")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_hash" ON "files" ("hash")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_is_latest" ON "files" ("is_latest_version")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_is_public" ON "files" ("is_public")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_expires" ON "files" ("expires_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_size" ON "files" ("size")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_created" ON "files" ("created_at")`,
    );

    // Índices compostos
    await queryRunner.query(
      `CREATE INDEX "IDX_files_category_tenant" ON "files" ("category", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_status_tenant" ON "files" ("status", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_uploaded_tenant" ON "files" ("uploaded_by", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_active_tenant" ON "files" ("is_active", "tenant_id")`,
    );

    // Índices GIN para campos JSONB
    await queryRunner.query(
      `CREATE INDEX "IDX_files_metadata_gin" ON "files" USING GIN ("metadata")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_permissions_gin" ON "files" USING GIN ("permissions")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_processing_gin" ON "files" USING GIN ("processing_info")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_files_derived_gin" ON "files" USING GIN ("derived_files")`,
    );

    // Índice de texto completo para busca
    await queryRunner.query(
      `CREATE INDEX "IDX_files_texto_busca" ON "files" USING GIN (to_tsvector('portuguese', original_name || ' ' || filename))`,
    );

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "FK_files_uploaded_by" 
      FOREIGN KEY ("uploaded_by") 
      REFERENCES "users"("id") 
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "FK_files_previous_version" 
      FOREIGN KEY ("previous_version_id") 
      REFERENCES "files"("id") 
      ON DELETE SET NULL
    `);

    // Constraints de validação
    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_size" 
      CHECK ("size" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_original_size" 
      CHECK ("original_size" IS NULL OR "original_size" >= "size")
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_compression_ratio" 
      CHECK ("compression_ratio" IS NULL OR ("compression_ratio" >= 0 AND "compression_ratio" <= 100))
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_version" 
      CHECK ("version" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_counters" 
      CHECK ("view_count" >= 0 AND "download_count" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "files" 
      ADD CONSTRAINT "CHK_files_filename_not_empty" 
      CHECK ("filename" != '' AND "original_name" != '')
    `);

    // Trigger para atualização automática do updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_files_updated_at 
      BEFORE UPDATE ON files 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Função para limpeza de arquivos expirados
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_expired_files()
      RETURNS INTEGER AS $$
      DECLARE
        affected_count INTEGER;
      BEGIN
        UPDATE files 
        SET status = 'deleted', is_active = false, updated_at = NOW()
        WHERE expires_at IS NOT NULL 
          AND expires_at < NOW() 
          AND status != 'deleted'
          AND is_active = true;
        
        GET DIAGNOSTICS affected_count = ROW_COUNT;
        
        RETURN affected_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Função para estatísticas de arquivos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_file_stats(tenant_uuid varchar(50))
      RETURNS TABLE(
        total_files bigint,
        total_size bigint,
        files_by_category jsonb,
        files_by_status jsonb,
        recent_uploads bigint,
        processing_files bigint
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (SELECT COUNT(*) FROM files WHERE tenant_id = tenant_uuid AND is_active = true) as total_files,
          (SELECT COALESCE(SUM(size), 0) FROM files WHERE tenant_id = tenant_uuid AND is_active = true) as total_size,
          (SELECT jsonb_object_agg(category, count) 
           FROM (SELECT category, COUNT(*) as count 
                 FROM files WHERE tenant_id = tenant_uuid AND is_active = true 
                 GROUP BY category) sub) as files_by_category,
          (SELECT jsonb_object_agg(status, count) 
           FROM (SELECT status, COUNT(*) as count 
                 FROM files WHERE tenant_id = tenant_uuid AND is_active = true 
                 GROUP BY status) sub) as files_by_status,
          (SELECT COUNT(*) FROM files WHERE tenant_id = tenant_uuid AND is_active = true 
           AND created_at >= CURRENT_DATE - INTERVAL '7 days') as recent_uploads,
          (SELECT COUNT(*) FROM files WHERE tenant_id = tenant_uuid AND is_active = true 
           AND status IN ('uploading', 'processing')) as processing_files;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Função para busca de arquivos duplicados (por hash)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION find_duplicate_files(tenant_uuid varchar(50))
      RETURNS TABLE(
        hash varchar(64),
        duplicate_count bigint,
        total_size bigint,
        file_ids text[]
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          f.hash,
          COUNT(*) as duplicate_count,
          SUM(f.size) as total_size,
          array_agg(f.id::text) as file_ids
        FROM files f
        WHERE f.tenant_id = tenant_uuid 
          AND f.is_active = true 
          AND f.hash IS NOT NULL
        GROUP BY f.hash
        HAVING COUNT(*) > 1
        ORDER BY duplicate_count DESC, total_size DESC;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Comentários nas funções
    await queryRunner.query(
      `COMMENT ON FUNCTION cleanup_expired_files() IS 'Função para limpar arquivos expirados automaticamente'`,
    );
    await queryRunner.query(
      `COMMENT ON FUNCTION get_file_stats(varchar) IS 'Função para obter estatísticas de arquivos por tenant'`,
    );
    await queryRunner.query(
      `COMMENT ON FUNCTION find_duplicate_files(varchar) IS 'Função para encontrar arquivos duplicados por hash'`,
    );

    // View para arquivos ativos (facilita queries)
    await queryRunner.query(`
      CREATE VIEW active_files AS
      SELECT * FROM files 
      WHERE is_active = true AND status != 'deleted';
    `);

    // View para arquivos recentes
    await queryRunner.query(`
      CREATE VIEW recent_files AS
      SELECT * FROM files 
      WHERE is_active = true 
        AND status != 'deleted'
        AND created_at >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY created_at DESC;
    `);

    await queryRunner.query(
      `COMMENT ON VIEW active_files IS 'View para arquivos ativos (não deletados)'`,
    );
    await queryRunner.query(
      `COMMENT ON VIEW recent_files IS 'View para arquivos recentes (últimos 30 dias)'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover views
    await queryRunner.query(`DROP VIEW IF EXISTS recent_files`);
    await queryRunner.query(`DROP VIEW IF EXISTS active_files`);

    // Remover funções
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS find_duplicate_files(varchar)`,
    );
    await queryRunner.query(`DROP FUNCTION IF EXISTS get_file_stats(varchar)`);
    await queryRunner.query(`DROP FUNCTION IF EXISTS cleanup_expired_files()`);

    // Remover trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_files_updated_at ON files`,
    );

    // Remover constraints
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_filename_not_empty"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_counters"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_compression_ratio"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_original_size"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "CHK_files_size"`,
    );

    // Remover foreign keys
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "FK_files_previous_version"`,
    );
    await queryRunner.query(
      `ALTER TABLE "files" DROP CONSTRAINT IF EXISTS "FK_files_uploaded_by"`,
    );

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_texto_busca"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_derived_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_processing_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_permissions_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_metadata_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_active_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_uploaded_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_status_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_category_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_size"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_expires"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_is_public"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_is_latest"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_hash"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_original_name"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_filename"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_entity"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_uploaded_by"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_category"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_files_tenant"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS "files"`);

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE IF EXISTS "file_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "file_category_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "file_type_enum"`);
  }
}
