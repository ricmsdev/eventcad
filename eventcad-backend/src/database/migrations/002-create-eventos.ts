import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migração para criação da tabela de eventos
 * Inclui todas as funcionalidades do módulo de eventos do EventCAD+
 */
export class CreateEventos1707360000002 implements MigrationInterface {
  name = 'CreateEventos1707360000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tipos ENUM para eventos
    await queryRunner.query(`
      CREATE TYPE "evento_tipo_enum" AS ENUM (
        'feira_comercial', 'exposicao', 'congresso', 'seminario', 'workshop',
        'convencao', 'lancamento', 'reuniao_corporativa', 'treinamento',
        'casamento', 'festa_privada', 'formatura', 'aniversario',
        'show', 'concerto', 'festival', 'teatro', 'cinema',
        'competicao', 'torneio', 'jogo', 'corrida',
        'conferencia', 'summit', 'hackathon', 'startup_pitch',
        'personalizado'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "event_status_enum" AS ENUM (
        'draft', 'planning', 'awaiting_approval', 'under_review',
        'approved', 'rejected', 'preparing', 'ready',
        'ongoing', 'paused', 'completed', 'cancelled',
        'failed', 'archived'
      )
    `);

    await queryRunner.query(`
      CREATE TYPE "nivel_risco_enum" AS ENUM (
        'baixo', 'medio', 'alto', 'critico'
      )
    `);

    // Criar tabela de eventos
    await queryRunner.query(`
      CREATE TABLE "eventos" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        "deleted_at" TIMESTAMP WITH TIME ZONE,
        "tenant_id" character varying(50) NOT NULL,
        "created_by" uuid,
        "updated_by" uuid,
        "metadata" jsonb,
        "is_active" boolean NOT NULL DEFAULT true,
        
        -- Informações básicas
        "nome" character varying(200) NOT NULL,
        "descricao" text,
        "tipo" "evento_tipo_enum" NOT NULL,
        "status" "event_status_enum" NOT NULL DEFAULT 'draft',
        
        -- Datas e timing
        "data_inicio" TIMESTAMP WITH TIME ZONE NOT NULL,
        "data_fim" TIMESTAMP WITH TIME ZONE NOT NULL,
        "data_limite_montagem" TIMESTAMP WITH TIME ZONE,
        "data_limite_desmontagem" TIMESTAMP WITH TIME ZONE,
        
        -- Local e capacidade
        "local" character varying(300) NOT NULL,
        "endereco" text,
        "cidade" character varying(100),
        "estado" character varying(50),
        "cep" character varying(20),
        "capacidade_maxima" integer NOT NULL,
        "publico_esperado" integer DEFAULT 0,
        
        -- Área e medidas
        "area_total" decimal(10,2),
        "area_construida" decimal(10,2),
        "altura_maxima" decimal(8,2),
        
        -- Responsáveis
        "organizador_id" uuid NOT NULL,
        "engenheiro_responsavel_id" uuid,
        "responsavel_seguranca_id" uuid,
        "equipe_tecnica" jsonb,
        "fornecedores" jsonb,
        
        -- Contato
        "email_contato" character varying(150),
        "telefone_contato" character varying(20),
        "website" text,
        
        -- Configurações técnicas
        "configuracoes_tecnicas" jsonb,
        
        -- Compliance e aprovações
        "aprovacoes" jsonb,
        "documentos" jsonb,
        
        -- Timeline e marcos
        "timeline" jsonb,
        
        -- Riscos
        "nivel_risco" "nivel_risco_enum" NOT NULL DEFAULT 'medio',
        "analise_riscos" jsonb,
        "observacoes" text,
        
        -- Financeiro
        "orcamento_total" decimal(12,2),
        "valor_gasto" decimal(12,2),
        "moeda" character varying(3) DEFAULT 'BRL',
        
        -- Notificações
        "notificacoes" jsonb,
        
        -- Estatísticas
        "estatisticas" jsonb,
        
        CONSTRAINT "PK_eventos" PRIMARY KEY ("id")
      )
    `);

    // Criar índices para performance
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_tenant" ON "eventos" ("tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_status" ON "eventos" ("status")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_tipo" ON "eventos" ("tipo")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_data_inicio" ON "eventos" ("data_inicio")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_data_fim" ON "eventos" ("data_fim")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_organizador" ON "eventos" ("organizador_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_engenheiro" ON "eventos" ("engenheiro_responsavel_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_status_tenant" ON "eventos" ("status", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_tipo_tenant" ON "eventos" ("tipo", "tenant_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_active" ON "eventos" ("is_active")`,
    );

    // Índices GIN para campos JSONB (busca rápida em JSON)
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_timeline_gin" ON "eventos" USING GIN ("timeline")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_aprovacoes_gin" ON "eventos" USING GIN ("aprovacoes")`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_configuracoes_gin" ON "eventos" USING GIN ("configuracoes_tecnicas")`,
    );

    // Índice de texto completo para busca
    await queryRunner.query(
      `CREATE INDEX "IDX_eventos_texto_busca" ON "eventos" USING GIN (to_tsvector('portuguese', nome || ' ' || COALESCE(descricao, '') || ' ' || local))`,
    );

    // Foreign keys
    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "FK_eventos_organizador" 
      FOREIGN KEY ("organizador_id") 
      REFERENCES "users"("id") 
      ON DELETE RESTRICT
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "FK_eventos_engenheiro" 
      FOREIGN KEY ("engenheiro_responsavel_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "FK_eventos_seguranca" 
      FOREIGN KEY ("responsavel_seguranca_id") 
      REFERENCES "users"("id") 
      ON DELETE SET NULL
    `);

    // Constraints de validação
    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_datas" 
      CHECK ("data_fim" > "data_inicio")
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_capacidade" 
      CHECK ("capacidade_maxima" > 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_publico" 
      CHECK ("publico_esperado" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_area_total" 
      CHECK ("area_total" IS NULL OR "area_total" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_area_construida" 
      CHECK ("area_construida" IS NULL OR "area_construida" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_altura" 
      CHECK ("altura_maxima" IS NULL OR "altura_maxima" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_orcamento" 
      CHECK ("orcamento_total" IS NULL OR "orcamento_total" >= 0)
    `);

    await queryRunner.query(`
      ALTER TABLE "eventos" 
      ADD CONSTRAINT "CHK_eventos_valor_gasto" 
      CHECK ("valor_gasto" IS NULL OR "valor_gasto" >= 0)
    `);

    // Aplicar trigger para atualização automática do updated_at
    await queryRunner.query(`
      CREATE TRIGGER update_eventos_updated_at 
      BEFORE UPDATE ON eventos 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    `);

    // Função para estatísticas (será útil para relatórios)
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_evento_stats(tenant_uuid varchar(50))
      RETURNS TABLE(
        total_eventos bigint,
        eventos_mes_atual bigint,
        eventos_proximos bigint,
        eventos_em_andamento bigint
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          (SELECT COUNT(*) FROM eventos WHERE tenant_id = tenant_uuid AND is_active = true) as total_eventos,
          (SELECT COUNT(*) FROM eventos WHERE tenant_id = tenant_uuid AND is_active = true 
           AND date_trunc('month', data_inicio) = date_trunc('month', CURRENT_DATE)) as eventos_mes_atual,
          (SELECT COUNT(*) FROM eventos WHERE tenant_id = tenant_uuid AND is_active = true 
           AND data_inicio BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days') as eventos_proximos,
          (SELECT COUNT(*) FROM eventos WHERE tenant_id = tenant_uuid AND is_active = true 
           AND status = 'ongoing') as eventos_em_andamento;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await queryRunner.query(
      `COMMENT ON FUNCTION get_evento_stats(varchar) IS 'Função para obter estatísticas rápidas de eventos por tenant'`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover função
    await queryRunner.query(
      `DROP FUNCTION IF EXISTS get_evento_stats(varchar)`,
    );

    // Remover trigger
    await queryRunner.query(
      `DROP TRIGGER IF EXISTS update_eventos_updated_at ON eventos`,
    );

    // Remover constraints
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_valor_gasto"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_orcamento"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_altura"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_area_construida"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_area_total"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_publico"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_capacidade"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "CHK_eventos_datas"`,
    );

    // Remover foreign keys
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "FK_eventos_seguranca"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "FK_eventos_engenheiro"`,
    );
    await queryRunner.query(
      `ALTER TABLE "eventos" DROP CONSTRAINT IF EXISTS "FK_eventos_organizador"`,
    );

    // Remover índices
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_texto_busca"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_eventos_configuracoes_gin"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "IDX_eventos_aprovacoes_gin"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_timeline_gin"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_active"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_tipo_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_status_tenant"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_engenheiro"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_organizador"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_data_fim"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_data_inicio"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_tipo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_status"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_eventos_tenant"`);

    // Remover tabela
    await queryRunner.query(`DROP TABLE IF EXISTS "eventos"`);

    // Remover tipos ENUM
    await queryRunner.query(`DROP TYPE IF EXISTS "nivel_risco_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "event_status_enum"`);
    await queryRunner.query(`DROP TYPE IF EXISTS "evento_tipo_enum"`);
  }
}
