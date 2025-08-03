import {
  MigrationInterface,
  QueryRunner,
  Table,
  Index,
  ForeignKey,
} from 'typeorm';

/**
 * Migration para criação da tabela ai_jobs
 * Sistema de jobs de processamento de IA do EventCAD+
 */
export class CreateAIJobs1704067200000 implements MigrationInterface {
  name = 'CreateAIJobs1704067200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Criar tabela ai_jobs
    await queryRunner.createTable(
      new Table({
        name: 'ai_jobs',
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

          // Campos específicos do AIJob
          {
            name: 'jobName',
            type: 'varchar',
            length: '100',
            isNullable: false,
            comment: 'Nome identificador do job',
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
            comment: 'Descrição detalhada do job',
          },

          // Relacionamentos
          {
            name: 'plantaId',
            type: 'uuid',
            isNullable: false,
            comment: 'ID da planta a ser processada',
          },
          {
            name: 'initiatedBy',
            type: 'uuid',
            isNullable: false,
            comment: 'ID do usuário que iniciou o job',
          },

          // Configuração do processamento
          {
            name: 'modelType',
            type: 'varchar',
            length: '50',
            isNullable: false,
            comment: 'Tipo do modelo de IA a ser usado',
          },
          {
            name: 'priority',
            type: 'int',
            default: 3,
            comment: 'Prioridade do job (1=crítica, 2=alta, 3=média, 4=baixa)',
          },
          {
            name: 'status',
            type: 'varchar',
            length: '20',
            default: "'pending'",
            comment: 'Status atual do processamento',
          },

          // Configurações JSON
          {
            name: 'modelConfig',
            type: 'jsonb',
            isNullable: true,
            comment: 'Configurações específicas do modelo',
          },
          {
            name: 'processingParams',
            type: 'jsonb',
            isNullable: true,
            comment: 'Parâmetros específicos do processamento',
          },

          // Agendamento
          {
            name: 'scheduledFor',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data/hora agendada para início do processamento',
          },
          {
            name: 'startedAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data/hora de início do processamento',
          },
          {
            name: 'completedAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data/hora de conclusão do processamento',
          },
          {
            name: 'processingTimeSeconds',
            type: 'int',
            isNullable: true,
            comment: 'Tempo de processamento em segundos',
          },

          // Progresso e monitoramento
          {
            name: 'progress',
            type: 'int',
            default: 0,
            comment: 'Progresso do processamento (0-100)',
          },
          {
            name: 'currentStage',
            type: 'varchar',
            length: '200',
            isNullable: true,
            comment: 'Estágio atual do processamento',
          },
          {
            name: 'processingLog',
            type: 'jsonb',
            isNullable: true,
            comment: 'Log detalhado do processamento',
          },

          // Retry e controle de erro
          {
            name: 'attemptCount',
            type: 'int',
            default: 0,
            comment: 'Número de tentativas realizadas',
          },
          {
            name: 'maxAttempts',
            type: 'int',
            default: 3,
            comment: 'Máximo de tentativas permitidas',
          },
          {
            name: 'nextRetryAt',
            type: 'timestamp',
            isNullable: true,
            comment: 'Data/hora da próxima tentativa (para retry)',
          },
          {
            name: 'errorHistory',
            type: 'jsonb',
            isNullable: true,
            comment: 'Histórico de erros',
          },

          // Resultados
          {
            name: 'results',
            type: 'jsonb',
            isNullable: true,
            comment: 'Resultados do processamento de IA',
          },

          // Callbacks e notificações
          {
            name: 'callbackUrl',
            type: 'varchar',
            length: '500',
            isNullable: true,
            comment: 'URL de callback para notificar conclusão',
          },
          {
            name: 'notificationEmail',
            type: 'varchar',
            length: '200',
            isNullable: true,
            comment: 'Email para notificação de conclusão',
          },
          {
            name: 'enableWebhook',
            type: 'boolean',
            default: false,
            comment: 'Se deve notificar via webhook',
          },

          // Controle de recursos
          {
            name: 'workerId',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID do worker que está processando',
          },
          {
            name: 'sessionId',
            type: 'varchar',
            length: '100',
            isNullable: true,
            comment: 'ID da sessão de processamento',
          },
          {
            name: 'estimatedMemoryMB',
            type: 'int',
            isNullable: true,
            comment: 'Memória estimada necessária em MB',
          },
          {
            name: 'estimatedTimeSeconds',
            type: 'int',
            isNullable: true,
            comment: 'Tempo estimado de processamento em segundos',
          },
        ],
      }),
      true,
    );

    // Criar índices para performance
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_status_tenant ON ai_jobs (status, "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_model_tenant ON ai_jobs ("modelType", "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_priority_created ON ai_jobs (priority, "createdAt")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_planta_tenant ON ai_jobs ("plantaId", "tenantId")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_status_scheduled ON ai_jobs (status, "scheduledFor")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_retry ON ai_jobs (status, "nextRetryAt", "attemptCount")',
    );
    await queryRunner.query(
      'CREATE INDEX IDX_ai_jobs_processing ON ai_jobs (status, "startedAt")',
    );

    // Criar foreign keys
    await queryRunner.query(`
      ALTER TABLE ai_jobs 
      ADD CONSTRAINT FK_ai_jobs_planta 
      FOREIGN KEY ("plantaId") REFERENCES plantas(id) ON DELETE CASCADE
    `);

    await queryRunner.query(`
      ALTER TABLE ai_jobs 
      ADD CONSTRAINT FK_ai_jobs_initiator 
      FOREIGN KEY ("initiatedBy") REFERENCES users(id) ON DELETE SET NULL
    `);

    // Função para estatísticas de jobs de IA
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION get_ai_job_stats(tenant_uuid UUID)
      RETURNS TABLE(
        total_jobs BIGINT,
        pending_jobs BIGINT,
        processing_jobs BIGINT,
        completed_jobs BIGINT,
        failed_jobs BIGINT,
        avg_processing_time NUMERIC,
        success_rate NUMERIC,
        most_used_model TEXT,
        total_objects_detected BIGINT
      ) AS $$
      BEGIN
        RETURN QUERY
        SELECT 
          -- Total de jobs
          COUNT(*)::BIGINT as total_jobs,
          
          -- Jobs por status
          COUNT(CASE WHEN aj.status = 'pending' THEN 1 END)::BIGINT as pending_jobs,
          COUNT(CASE WHEN aj.status = 'processing' THEN 1 END)::BIGINT as processing_jobs,
          COUNT(CASE WHEN aj.status = 'completed' THEN 1 END)::BIGINT as completed_jobs,
          COUNT(CASE WHEN aj.status = 'failed' THEN 1 END)::BIGINT as failed_jobs,
          
          -- Tempo médio de processamento (em segundos)
          COALESCE(AVG(aj.processing_time_seconds), 0)::NUMERIC as avg_processing_time,
          
          -- Taxa de sucesso (%)
          CASE 
            WHEN COUNT(*) > 0 THEN 
              (COUNT(CASE WHEN aj.status = 'completed' THEN 1 END)::NUMERIC / COUNT(*)::NUMERIC) * 100
            ELSE 0
          END as success_rate,
          
          -- Modelo mais usado
          (
            SELECT aj2.model_type 
            FROM ai_jobs aj2 
            WHERE aj2.tenant_id = tenant_uuid AND aj2.is_active = true
            GROUP BY aj2.model_type 
            ORDER BY COUNT(*) DESC 
            LIMIT 1
          )::TEXT as most_used_model,
          
          -- Total de objetos detectados
          COALESCE(
            SUM(
              CASE 
                WHEN aj.results IS NOT NULL AND aj.results ? 'statistics' 
                THEN COALESCE((aj.results->'statistics'->>'total_objects_detected')::BIGINT, 0)
                ELSE 0
              END
            ), 0
          )::BIGINT as total_objects_detected
          
        FROM ai_jobs aj
        WHERE aj.tenant_id = tenant_uuid AND aj.is_active = true;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // View para jobs ativos com informações de planta
    await queryRunner.query(`
      CREATE VIEW v_ai_jobs_active AS
      SELECT 
        aj.id,
        aj."jobName",
        aj.status,
        aj."modelType",
        aj.priority,
        aj.progress,
        aj."currentStage",
        aj."createdAt",
        aj."startedAt",
        aj."completedAt",
        aj."processingTimeSeconds",
        aj."attemptCount",
        aj."maxAttempts",
        aj."tenantId",
        p.original_name as planta_name,
        p.planta_tipo,
        p.type as planta_file_type,
        u.email as initiator_email,
        CASE 
          WHEN aj.status = 'pending' OR aj.status = 'queued' THEN true
          WHEN aj.status = 'failed' AND aj."attemptCount" < aj."maxAttempts" 
            AND (aj."nextRetryAt" IS NULL OR aj."nextRetryAt" <= CURRENT_TIMESTAMP) THEN true
          ELSE false
        END as can_execute,
        CASE 
          WHEN aj.status = 'failed' AND aj."attemptCount" < aj."maxAttempts" 
            AND (aj."nextRetryAt" IS NULL OR aj."nextRetryAt" <= CURRENT_TIMESTAMP) THEN true
          ELSE false
        END as can_retry
      FROM ai_jobs aj
      LEFT JOIN plantas p ON aj."plantaId" = p.id
      LEFT JOIN users u ON aj."initiatedBy" = u.id
      WHERE aj."isActive" = true;
    `);

    // Função para limpeza de jobs antigos
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION cleanup_old_ai_jobs(days_old INTEGER DEFAULT 90)
      RETURNS INTEGER AS $$
      DECLARE
        deleted_count INTEGER;
      BEGIN
        -- Marcar como deletados jobs antigos que estão concluídos
        UPDATE ai_jobs 
        SET is_deleted = true, updated_at = CURRENT_TIMESTAMP
        WHERE created_at < (CURRENT_TIMESTAMP - INTERVAL '1 day' * days_old)
          AND status IN ('completed', 'cancelled')
          AND is_deleted = false;
          
        GET DIAGNOSTICS deleted_count = ROW_COUNT;
        
        RETURN deleted_count;
      END;
      $$ LANGUAGE plpgsql;
    `);

    // Trigger para atualizar updated_at
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION update_ai_jobs_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER trigger_ai_jobs_updated_at
        BEFORE UPDATE ON ai_jobs
        FOR EACH ROW
        EXECUTE FUNCTION update_ai_jobs_updated_at();
    `);

    // Comentários nas tabelas e colunas
    await queryRunner.query(`
      COMMENT ON TABLE ai_jobs IS 'Jobs de processamento de IA para plantas técnicas do EventCAD+';
      COMMENT ON COLUMN ai_jobs."modelType" IS 'Tipo do modelo: yolo_v8, detectron2, fire_safety_ai, etc.';
      COMMENT ON COLUMN ai_jobs.status IS 'Status: pending, queued, processing, completed, failed, cancelled, timeout, retrying';
      COMMENT ON COLUMN ai_jobs.priority IS 'Prioridade: 1=crítica, 2=alta, 3=média, 4=baixa';
      COMMENT ON COLUMN ai_jobs.results IS 'Resultados JSON com objetos detectados, texto extraído, análises, etc.';
      COMMENT ON COLUMN ai_jobs."processingLog" IS 'Log detalhado com timestamps, stages, messages e níveis';
      COMMENT ON COLUMN ai_jobs."errorHistory" IS 'Histórico de erros com tentativas, timestamps e contexto';
    `);

    this.logger?.log(
      'Tabela ai_jobs criada com sucesso com índices e funções auxiliares',
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remover trigger
    await queryRunner.query(
      'DROP TRIGGER IF EXISTS trigger_ai_jobs_updated_at ON ai_jobs',
    );
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS update_ai_jobs_updated_at()',
    );

    // Remover funções
    await queryRunner.query(
      'DROP FUNCTION IF EXISTS cleanup_old_ai_jobs(INTEGER)',
    );
    await queryRunner.query('DROP FUNCTION IF EXISTS get_ai_job_stats(UUID)');

    // Remover view
    await queryRunner.query('DROP VIEW IF EXISTS v_ai_jobs_active');

    // Remover índices
    await queryRunner.query('DROP INDEX IF EXISTS IDX_ai_jobs_status_tenant');
    await queryRunner.query('DROP INDEX IF EXISTS IDX_ai_jobs_model_tenant');
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_ai_jobs_priority_created',
    );
    await queryRunner.query('DROP INDEX IF EXISTS IDX_ai_jobs_planta_tenant');
    await queryRunner.query(
      'DROP INDEX IF EXISTS IDX_ai_jobs_status_scheduled',
    );
    await queryRunner.query('DROP INDEX IF EXISTS IDX_ai_jobs_retry');
    await queryRunner.query('DROP INDEX IF EXISTS IDX_ai_jobs_processing');

    // Remover foreign keys
    await queryRunner.query(
      'ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS FK_ai_jobs_planta',
    );
    await queryRunner.query(
      'ALTER TABLE ai_jobs DROP CONSTRAINT IF EXISTS FK_ai_jobs_initiator',
    );

    // Remover tabela
    await queryRunner.dropTable('ai_jobs');
  }

  private readonly logger = console;
}
