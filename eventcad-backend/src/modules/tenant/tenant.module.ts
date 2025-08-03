import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TenantService } from './tenant.service';
import { Tenant } from './entities/tenant.entity';

/**
 * Módulo de gerenciamento de tenants do EventCAD+
 *
 * Funcionalidades:
 * - Gestão de organizações/clientes
 * - Isolamento multi-tenant
 * - Configurações personalizadas
 * - Controle de limites e cotas
 */
@Module({
  imports: [TypeOrmModule.forFeature([Tenant])],
  providers: [TenantService],
  exports: [TenantService],
})
export class TenantModule {}
