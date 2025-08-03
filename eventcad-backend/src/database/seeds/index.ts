import { DataSource } from 'typeorm';
import { seedDefaultTenant } from './001-default-tenant';
import { seedAdminUser } from './002-admin-user';
import dataSource from '../../config/database.config';

/**
 * Executor principal dos seeds do EventCAD+
 * Roda todos os seeds na ordem correta
 */
export async function runSeeds(dataSource: DataSource): Promise<void> {
  console.log('🌱 Iniciando seeds do EventCAD+...');

  try {
    // 1. Criar tenant padrão
    console.log('\n📦 Criando tenant padrão...');
    await seedDefaultTenant(dataSource);

    // 2. Criar usuário administrador
    console.log('\n👤 Criando usuário administrador...');
    await seedAdminUser(dataSource);

    console.log('\n✅ Todos os seeds executados com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao executar seeds:', error);
    throw error;
  }
}

/**
 * Script para executar seeds standalone
 * Uso: npm run seed
 */
export async function runSeedsStandalone(): Promise<void> {
  try {
    await dataSource.initialize();
    console.log('🔗 Conectado ao banco de dados');

    await runSeeds(dataSource);
  } finally {
    await dataSource.destroy();
    console.log('🔌 Conexão com banco encerrada');
  }
}

// Se executado diretamente
if (require.main === module) {
  runSeedsStandalone()
    .then(() => {
      console.log('🎉 Seeds executados com sucesso!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Erro ao executar seeds:', error);
      process.exit(1);
    });
}
