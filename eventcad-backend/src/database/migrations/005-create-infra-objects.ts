import { MigrationInterface, QueryRunner, Table, Index } from 'typeorm';

/**
 * Migration para criação da tabela infra_objects
 * Sistema de objetos de infraestrutura do EventCAD+
 */
export class CreateInfraObjects1704067300000 implements MigrationInterface {
  name = 'CreateInfraObjects1704067300000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela infra_objects
    await queryRunner.createTable(
      new Table({
        name: 'infra_objects',
        columns: [
          // Campos da BaseEntity
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'tenantId',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
          },
          {
            name: 'isDeleted',
            type: 'boolean',
            default: false,
          },

          // Identificação do objeto
          {
            name: 'name',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Nome/identificador do objeto',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada do objeto',
          },

          // Relacionamentos principais
          {
            name: 'plantaId',
            type: 'uuid',
            isNullable: false,
            comment: 'ID da planta onde está o objeto',
          },
          {
            name: 'aiJobId',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do job de IA que detectou o objeto',
          },
          {
            name: 'createdBy',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do usuário que criou/detectou o objeto',
          },
          {
            name: 'lastModifiedBy',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do último usuário que modificou',
          },

          // Classificação do objeto
          {
            name: 'objectCategory',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Categoria do objeto (ARCHITECTURAL, FIRE_SAFETY, etc.)',
          },
          {
            name: 'objectType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment:
              'Tipo específico do objeto (DOOR, FIRE_EXTINGUISHER, etc.)',
          },
          {
            name: 'objectSubtype',
            type: 'varchar',
            length: '50',
            isNullable: true,
            comment: 'Subtipo ou variação específica',
          },

          // Status e origem
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'detected'",
            comment: 'Status atual do objeto',
          },
          {
            name: 'source',
            type: 'varchar',
            length: '20',
            default: "'ai_detection'",
            comment: 'Origem do objeto',
          },

          // Posicionamento e geometria
          {
            name: 'geometry',
            type: 'jsonb',
            isNullable: false,
            comment: 'Posição e geometria do objeto na planta',
          },

          // Propriedades específicas do objeto
          {
            name: 'properties',
            type: 'jsonb',
            isNullable: true,
            comment: 'Propriedades específicas do tipo de objeto',
          },

          // Confiança e validação
          {
            name: 'confidence',
            type: 'decimal',
            precision: 5,
            scale: 4,
            isNullable: true,
            comment: 'Nível de confiança da IA (0.0000 a 1.0000)',
          },
          {
            name: 'confidenceLevel',
            type: 'varchar',
            length: '20',
            isNullable: true,
            comment: 'Nível de confiança categórico',
          },
          {
            name: 'criticality',
            type: 'varchar',
            length: '20',
            default: "'none'",
            comment: 'Criticidade para segurança',
          },
          {
            name: 'requiresReview',
            type: 'boolean',
            default: false,
            comment: 'Se requer revisão manual',
          },
          {
            name: 'manuallyValidated',
            type: 'boolean',
            default: false,
            comment: 'Se foi validado manualmente',
          },
          {
            name: 'validatedAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data da validação manual',
          },
          {
            name: 'validatedBy',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do usuário que validou',
          },

          // Validações técnicas necessárias
          {
            name: 'requiredValidations',
            type: 'text',
            isNullable: true,
            comment: 'Tipos de validação necessários (array)',
          },
          {
            name: 'validationResults',
            type: 'jsonb',
            isNullable: true,
            comment: 'Resultados das validações técnicas',
          },

          // Metadados de detecção
          {
            name: 'detectionMetadata',
            type: 'jsonb',
            isNullable: true,
            comment: 'Metadados da detecção por IA',
          },

          // Modificações e histórico
          {
            name: 'modificationHistory',
            type: 'jsonb',
            isNullable: true,
            comment: 'Histórico de modificações',
          },

          // Relacionamentos com outros objetos
          {
            name: 'parentObjectId',
            type: 'uuid',
            isNullable: true,
            comment: 'ID do objeto pai (para hierarquias)',
          },
          {
            name: 'relatedObjectIds',
            type: 'text',
            isNullable: true,
            comment: 'IDs de objetos relacionados (array)',
          },

          // Conflitos e duplicatas
          {
            name: 'conflicts',
            type: 'jsonb',
            isNullable: true,
            comment: 'Informações sobre conflitos',
          },

          // Anotações e comentários
          {
            name: 'annotations',
            type: 'jsonb',
            isNullable: true,
            comment: 'Anotações e comentários dos usuários',
          },

          // Compliance e normas
          {
            name: 'complianceChecks',
            type: 'jsonb',
            isNullable: true,
            comment: 'Verificações de compliance',
          },

          // Exportação e integração
          {
            name: 'exportData',
            type: 'jsonb',
            isNullable: true,
            comment: 'Dados para exportação e integração',
          },
        ],
      }),
      true,
    );

    // Criar índices para performance
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_planta_tenant ON infra_objects ("plantaId", "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_status_tenant ON infra_objects (status, "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_category_type ON infra_objects ("objectCategory", "objectType")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_criticality_status ON infra_objects (criticality, status)',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_ai_job ON infra_objects ("aiJobId", "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_created_by ON infra_objects ("createdBy", status)',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_needs_review ON infra_objects ("requiresReview", "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_validated ON infra_objects ("manuallyValidated", "validatedAt")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_source ON infra_objects (source, "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_confidence ON infra_objects (confidence, "confidenceLevel")',
    );

    // Índices especiais para busca geoespacial (usando GIN para JSONB)
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_geometry_gin ON infra_objects USING GIN (geometry)',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_properties_gin ON infra_objects USING GIN (properties)',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_infra_objects_conflicts_gin ON infra_objects USING GIN (conflicts)',
    );

    // Criar foreign keys
    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_planta 
      FOREIGN KEY ("plantaId") REFERENCES plantas(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_ai_job 
      FOREIGN KEY ("aiJobId") REFERENCES ai_jobs(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_created_by 
      FOREIGN KEY ("createdBy") REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_last_modified_by 
      FOREIGN KEY ("lastModifiedBy") REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_validated_by 
      FOREIGN KEY ("validatedBy") REFERENCES users(id) ON DELETE SET NULL
    `);

    await queryRunner.query(`
      ALTER TABLE infra_objects 
      ADD CONSTRAINT FK_infra_objects_parent 
      FOREIGN KEY ("parentObjectId") REFERENCES infra_objects(id) ON DELETE SET NULL
    `);

    // Função para estatísticas de objetos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_infra_object_stats(tenant_uuid UUID, planta_uuid UUID DEFAULT NULL)
      RETURNS TABLE(
        total_objects BIGINT,
        by_status JSONB,
        by_category JSONB,
        by_criticality JSONB,
        needs_review BIGINT,
        manually_validated BIGINT,
        with_conflicts BIGINT,
        avg_quality_score NUMERIC,
        avg_confidence NUMERIC
      ) AS $$
      DECLARE
        where_clause TEXT := 'WHERE io.tenant_id = $1 AND io.is_active = true';
      BEGIN
        -- Adicionar filtro por planta se especificado
        IF planta_uuid IS NOT NULL THEN
          where_clause := where_clause || ' AND io.planta_id = $2';
        END IF;
        
        RETURN QUERY
        EXECUTE format('
          SELECT 
            -- Total de objetos
            COUNT(*)::BIGINT as total_objects,
            
            -- Objetos por status
            jsonb_object_agg(
              COALESCE(io.status, ''unknown''), 
              COUNT(*) FILTER (WHERE io.status IS NOT NULL)
            ) as by_status,
            
            -- Objetos por categoria
            jsonb_object_agg(
              COALESCE(io.object_category, ''unknown''), 
              COUNT(*) FILTER (WHERE io.object_category IS NOT NULL)
            ) as by_category,
            
            -- Objetos por criticidade
            jsonb_object_agg(
              COALESCE(io.criticality, ''unknown''), 
              COUNT(*) FILTER (WHERE io.criticality IS NOT NULL)
            ) as by_criticality,
            
            -- Objetos que precisam de revisão
            COUNT(CASE WHEN io.requires_review = true THEN 1 END)::BIGINT as needs_review,
            
            -- Objetos validados manualmente
            COUNT(CASE WHEN io.manually_validated = true THEN 1 END)::BIGINT as manually_validated,
            
            -- Objetos com conflitos
            COUNT(CASE WHEN io.conflicts IS NOT NULL THEN 1 END)::BIGINT as with_conflicts,
            
            -- Score médio de qualidade (calculado via função)
            AVG(
              CASE 
                WHEN io.confidence IS NOT NULL THEN (io.confidence * 100)
                ELSE 50
              END
            )::NUMERIC as avg_quality_score,
            
            -- Confiança média
            AVG(io.confidence)::NUMERIC as avg_confidence
            
          FROM infra_objects io %s
        ', where_clause)
        USING tenant_uuid, planta_uuid;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Função para análise de conflitos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION analyze_object_conflicts(tenant_uuid UUID, tolerance_pixels INTEGER DEFAULT 5)
      RETURNS TABLE(
        conflict_type TEXT,
        object1_id UUID,
        object2_id UUID,
        description TEXT,
        severity TEXT,
        auto_resolvable BOOLEAN
      ) AS $$
      BEGIN
        -- Detectar duplicatas (objetos do mesmo tipo em posições próximas)
        RETURN QUERY
        SELECT 
          'duplicate'::TEXT as conflict_type,
          o1.id as object1_id,
          o2.id as object2_id,
          ('Possível duplicata: ' || o1.object_type)::TEXT as description,
          'medium'::TEXT as severity,
          (COALESCE(o1.confidence, 0) < 0.8 OR COALESCE(o2.confidence, 0) < 0.8)::BOOLEAN as auto_resolvable
        FROM infra_objects o1
        JOIN infra_objects o2 ON (
          o1.id < o2.id AND
          o1.tenant_id = o2.tenant_id AND
          o1.planta_id = o2.planta_id AND
          o1.object_category = o2.object_category AND
          o1.object_type = o2.object_type AND
          o1.is_active = true AND
          o2.is_active = true
        )
        WHERE o1.tenant_id = tenant_uuid
          AND ABS((o1.geometry->>'center'->>'x')::NUMERIC - (o2.geometry->>'center'->>'x')::NUMERIC) <= tolerance_pixels
          AND ABS((o1.geometry->>'center'->>'y')::NUMERIC - (o2.geometry->>'center'->>'y')::NUMERIC) <= tolerance_pixels;
          
        -- Detectar sobreposições (bounding boxes que se intersectam)
        RETURN QUERY
        SELECT 
          'overlap'::TEXT as conflict_type,
          o1.id as object1_id,
          o2.id as object2_id,
          ('Sobreposição: ' || o1.object_type || ' e ' || o2.object_type)::TEXT as description,
          'low'::TEXT as severity,
          false::BOOLEAN as auto_resolvable
        FROM infra_objects o1
        JOIN infra_objects o2 ON (
          o1.id < o2.id AND
          o1.tenant_id = o2.tenant_id AND
          o1.planta_id = o2.planta_id AND
          o1.is_active = true AND
          o2.is_active = true
        )
        WHERE o1.tenant_id = tenant_uuid
          AND NOT (
            (o1.geometry->'boundingBox'->>'x')::NUMERIC + (o1.geometry->'boundingBox'->>'width')::NUMERIC + tolerance_pixels < (o2.geometry->'boundingBox'->>'x')::NUMERIC OR
            (o2.geometry->'boundingBox'->>'x')::NUMERIC + (o2.geometry->'boundingBox'->>'width')::NUMERIC + tolerance_pixels < (o1.geometry->'boundingBox'->>'x')::NUMERIC OR
            (o1.geometry->'boundingBox'->>'y')::NUMERIC + (o1.geometry->'boundingBox'->>'height')::NUMERIC + tolerance_pixels < (o2.geometry->'boundingBox'->>'y')::NUMERIC OR
            (o2.geometry->'boundingBox'->>'y')::NUMERIC + (o2.geometry->'boundingBox'->>'height')::NUMERIC + tolerance_pixels < (o1.geometry->'boundingBox'->>'y')::NUMERIC
          );
      END;
      $$ LANGUAGE plpgsql;
    `);

    // View para objetos com problemas
    await queryRunner.query(`
      CREATE VIEW v_infra_objects_needs_attention AS
      SELECT 
        io.id,
        io.name,
        io.object_category,
        io.object_type,
        io.status,
        io.criticality,
        io.confidence,
        io.requires_review,
        io.manually_validated,
        io.planta_id,
        io.tenant_id,
        io.created_at,
        p.original_name as planta_name,
        u.email as creator_email,
        CASE 
          WHEN io.status = 'pending_review' THEN 'Aguardando revisão'
          WHEN io.status = 'conflicted' THEN 'Com conflitos'
          WHEN io.requires_review = true THEN 'Requer validação manual'
          WHEN io.conflicts IS NOT NULL THEN 'Tem conflitos detectados'
          WHEN io.confidence IS NOT NULL AND io.confidence < 0.7 THEN 'Baixa confiança'
          ELSE 'Outros problemas'
        END as attention_reason,
        CASE 
          WHEN io.criticality = 'critical' THEN 1
          WHEN io.criticality = 'high' THEN 2
          WHEN io.criticality = 'medium' THEN 3
          ELSE 4
        END as priority_order
      FROM infra_objects io
      LEFT JOIN plantas p ON io.planta_id = p.id
      LEFT JOIN users u ON io.created_by = u.id
      WHERE io.is_active = true
        AND (
          io.status IN ('pending_review', 'conflicted') OR
          io.requires_review = true OR
          io.conflicts IS NOT NULL OR
          (io.confidence IS NOT NULL AND io.confidence < 0.7)
        );
    `);

    // Função para limpeza de objetos antigos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_infra_objects(days_old INTEGER DEFAULT 180)
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        -- Marcar como deletados objetos antigos rejeitados ou arquivados
        UPDATE infra_objects 
        SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
        WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old)
          AND status IN ('rejected', 'archived')
          AND is_deleted = false;
          
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger para atualizar updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_infra_objects_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_infra_objects_updated_at
        BEFORE UPDATE ON infra_objects
        FOR EACH ROW
        EXECUTE FUNCTION update_infra_objects_updated_at();
    `);

    // Comentários nas tabelas e colunas
    await queryRunner.query(`
      COMMENT ON TABLE infra_objects IS 'Objetos de infraestrutura detectados por IA ou criados manualmente no EventCAD+';
      COMMENT ON COLUMN infra_objects.object_category IS 'ARCHITECTURAL, FIRE_SAFETY, ELECTRICAL, PLUMBING, ACCESSIBILITY, FURNITURE, ANNOTATIONS';
      COMMENT ON COLUMN infra_objects.object_type IS 'DOOR, FIRE_EXTINGUISHER, OUTLET, TOILET, ACCESSIBLE_RAMP, TABLE, DIMENSION, etc.';
      COMMENT ON COLUMN infra_objects.status IS 'detected, pending_review, under_review, approved, rejected, modified, conflicted, archived';
      COMMENT ON COLUMN infra_objects.source IS 'ai_detection, manual_creation, imported, template, duplicated';
      COMMENT ON COLUMN infra_objects.criticality IS 'none, low, medium, high, critical';
      COMMENT ON COLUMN infra_objects.geometry IS 'JSONB com boundingBox, center, rotation, points, area, etc.';
      COMMENT ON COLUMN infra_objects.properties IS 'Propriedades específicas do tipo de objeto (capacity, material, etc.)';
      COMMENT ON COLUMN infra_objects.validation_results IS 'Resultados de validações técnicas especializadas';
      COMMENT ON COLUMN infra_objects.modification_history IS 'Histórico completo de modificações com timestamps';
      COMMENT ON COLUMN infra_objects.conflicts IS 'Conflitos detectados (duplicates, overlaps, inconsistencies)';
      COMMENT ON COLUMN infra_objects.annotations IS 'Anotações e comentários dos usuários';
      COMMENT ON COLUMN infra_objects.compliance_checks IS 'Verificações de conformidade com normas';
    `);

    this.logger?.log(
      'Tabela infra_objects criada com sucesso com índices e funções auxiliares',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trigger_infra_objects_updated_at ON infra_objects',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS update_infra_objects_updated_at()',
    );

    // Remover funções
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS cleanup_old_infra_objects(INTEGER)',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS analyze_object_conflicts(UUID, INTEGER)',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS get_infra_object_stats(UUID, UUID)',
    );

    // Remover view
    await queryRunner.query(
      'DROP VIEW IF EXISTS v_infra_objects_needs_attention',
    );

    // Remover foreign keys
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_planta',
    );
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_ai_job',
    );
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_created_by',
    );
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_last_modified_by',
    );
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_validated_by',
    );
    await queryRunner.query(
      'ALTER TABLE infra_objects DROP CONSTRAINT IF EXISTS FK_infra_objects_parent',
    );

    // Remover índices
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_planta_tenant',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_status_tenant',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_category_type',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_criticality_status',
    );
    await queryRunner.query('DROP INDEX IF EXISTS IDX_infra_objects_ai_job');
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_created_by',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_needs_review',
    );
    await queryRunner.query('DROP INDEX IF EXISTS IDX_infra_objects_validated');
    await queryRunner.query('DROP INDEX IF EXISTS IDX_infra_objects_source');
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_confidence',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_geometry_gin',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_properties_gin',
    );
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_infra_objects_conflicts_gin',
    );

    // Remover tabela
    await queryRunner.dropTable('infra_objects');
  }

  private readonly logger = console;
}
