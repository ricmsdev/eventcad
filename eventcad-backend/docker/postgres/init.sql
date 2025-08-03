-- Script de inicialização do PostgreSQL para EventCAD+
-- Executado automaticamente na criação do container

-- Configurar timezone padrão
SET timezone = 'America/Sao_Paulo';

-- Configurar encoding
SET client_encoding = 'UTF8';

-- Criar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "inet";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Configurações de performance
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
ALTER SYSTEM SET log_statement = 'all';
ALTER SYSTEM SET log_duration = on;
ALTER SYSTEM SET log_min_duration_statement = 100;

-- Configurações específicas para desenvolvimento
ALTER SYSTEM SET log_line_prefix = '%t [%p]: [%l-1] user=%u,db=%d,app=%a,client=%h ';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Comentários informativos
COMMENT ON DATABASE eventcad_db IS 'Banco de dados principal do EventCAD+ - Sistema de gestão e execução de eventos';

-- Criar schema de logs para auditoria (será usado futuramente)
CREATE SCHEMA IF NOT EXISTS audit;
COMMENT ON SCHEMA audit IS 'Schema para logs de auditoria e histórico de alterações';

-- Função para log de auditoria (preparada para uso futuro)
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Implementação de auditoria será adicionada conforme necessário
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION audit.log_changes() IS 'Função genérica para logging de alterações nas tabelas';

-- Mensagem de inicialização
DO $$
BEGIN
  RAISE NOTICE 'EventCAD+ PostgreSQL inicializado com sucesso!';
  RAISE NOTICE 'Timezone: %', current_setting('timezone');
  RAISE NOTICE 'Encoding: %', current_setting('server_encoding');
  RAISE NOTICE 'Versão: %', version();
END $$;