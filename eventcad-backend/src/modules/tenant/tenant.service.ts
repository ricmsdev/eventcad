import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from './entities/tenant.entity';

/**
 * Serviço de gerenciamento de tenants do EventCAD+
 *
 * Funcionalidades:
 * - CRUD de tenants
 * - Validação de limites e cotas
 * - Configurações personalizadas
 * - Controle de assinatura e billing
 */
@Injectable()
export class TenantService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
  ) {}

  /**
   * Busca tenant por ID
   * @param id - ID do tenant
   * @returns Tenant encontrado
   */
  async findById(id: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant com ID ${id} não encontrado`);
    }

    return tenant;
  }

  /**
   * Busca tenant por subdomínio
   * @param subdomain - Subdomínio único
   * @returns Tenant encontrado
   */
  async findBySubdomain(subdomain: string): Promise<Tenant> {
    const tenant = await this.tenantRepository.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });

    if (!tenant) {
      throw new NotFoundException(
        `Tenant com subdomínio ${subdomain} não encontrado`,
      );
    }

    return tenant;
  }

  /**
   * Lista todos os tenants ativos
   * @param page - Página para paginação
   * @param limit - Limite por página
   * @returns Lista paginada de tenants
   */
  async findAll(
    page = 1,
    limit = 20,
  ): Promise<{ data: Tenant[]; total: number }> {
    const [data, total] = await this.tenantRepository.findAndCount({
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { data, total };
  }

  /**
   * Cria novo tenant
   * @param tenantData - Dados do tenant
   * @returns Tenant criado
   */
  async create(tenantData: Partial<Tenant>): Promise<Tenant> {
    // Verifica se subdomínio já existe
    if (tenantData.subdomain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: tenantData.subdomain.toLowerCase() },
      });

      if (existingTenant) {
        throw new ConflictException('Subdomínio já está em uso');
      }
    }

    // Verifica se email de contato já existe
    if (tenantData.contactEmail) {
      const existingEmail = await this.tenantRepository.findOne({
        where: { contactEmail: tenantData.contactEmail.toLowerCase() },
      });

      if (existingEmail) {
        throw new ConflictException('Email de contato já está em uso');
      }
    }

    const tenant = this.tenantRepository.create({
      ...tenantData,
      subdomain: tenantData.subdomain?.toLowerCase(),
      contactEmail: tenantData.contactEmail?.toLowerCase(),
      subscriptionStatus: 'active',
      subscriptionStartDate: new Date(),
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * Atualiza tenant existente
   * @param id - ID do tenant
   * @param updateData - Dados para atualização
   * @returns Tenant atualizado
   */
  async update(id: string, updateData: Partial<Tenant>): Promise<Tenant> {
    const tenant = await this.findById(id);

    // Verifica conflitos se estiver mudando subdomínio
    if (updateData.subdomain && updateData.subdomain !== tenant.subdomain) {
      const existingTenant = await this.tenantRepository.findOne({
        where: { subdomain: updateData.subdomain.toLowerCase() },
      });

      if (existingTenant && existingTenant.id !== id) {
        throw new ConflictException('Subdomínio já está em uso');
      }
    }

    // Verifica conflitos se estiver mudando email
    if (
      updateData.contactEmail &&
      updateData.contactEmail !== tenant.contactEmail
    ) {
      const existingEmail = await this.tenantRepository.findOne({
        where: { contactEmail: updateData.contactEmail.toLowerCase() },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Email de contato já está em uso');
      }
    }

    Object.assign(tenant, {
      ...updateData,
      subdomain: updateData.subdomain?.toLowerCase(),
      contactEmail: updateData.contactEmail?.toLowerCase(),
    });

    return this.tenantRepository.save(tenant);
  }

  /**
   * Desativa tenant (soft delete)
   * @param id - ID do tenant
   */
  async deactivate(id: string): Promise<void> {
    const tenant = await this.findById(id);
    tenant.deactivate();
    await this.tenantRepository.save(tenant);
  }

  /**
   * Verifica se tenant pode criar evento
   * @param tenantId - ID do tenant
   * @returns true se pode criar
   */
  async canCreateEvent(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.canCreateEvent();
  }

  /**
   * Verifica se tenant pode adicionar usuário
   * @param tenantId - ID do tenant
   * @returns true se pode adicionar
   */
  async canAddUser(tenantId: string): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.canAddUser();
  }

  /**
   * Verifica espaço de armazenamento disponível
   * @param tenantId - ID do tenant
   * @param requiredBytes - Bytes necessários
   * @returns true se tem espaço
   */
  async hasStorageSpace(
    tenantId: string,
    requiredBytes: number,
  ): Promise<boolean> {
    const tenant = await this.findById(tenantId);
    return tenant.hasStorageSpace(requiredBytes);
  }

  /**
   * Atualiza uso de armazenamento
   * @param tenantId - ID do tenant
   * @param bytes - Bytes adicionados/removidos
   */
  async updateStorageUsage(tenantId: string, bytes: number): Promise<void> {
    const tenant = await this.findById(tenantId);
    tenant.updateStorageUsage(bytes);
    await this.tenantRepository.save(tenant);
  }

  /**
   * Atualiza configurações customizadas
   * @param tenantId - ID do tenant
   * @param settings - Novas configurações
   */
  async updateCustomSettings(
    tenantId: string,
    settings: Record<string, any>,
  ): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    tenant.updateCustomSettings(settings);
    return this.tenantRepository.save(tenant);
  }

  /**
   * Busca configurações de compliance do tenant
   * @param tenantId - ID do tenant
   * @returns Regras de compliance
   */
  async getComplianceRules(tenantId: string): Promise<Record<string, any>> {
    const tenant = await this.findById(tenantId);
    return tenant.complianceRules || {};
  }

  /**
   * Atualiza regras de compliance
   * @param tenantId - ID do tenant
   * @param rules - Novas regras
   */
  async updateComplianceRules(
    tenantId: string,
    rules: Record<string, any>,
  ): Promise<Tenant> {
    const tenant = await this.findById(tenantId);
    tenant.complianceRules = {
      ...tenant.complianceRules,
      ...rules,
    };
    return this.tenantRepository.save(tenant);
  }

  /**
   * Renova assinatura do tenant
   * @param tenantId - ID do tenant
   * @param renewalData - Dados de renovação
   */
  async renewSubscription(
    tenantId: string,
    renewalData: {
      plan?: string;
      monthlyFee?: number;
      renewalPeriodMonths?: number;
    },
  ): Promise<Tenant> {
    const tenant = await this.findById(tenantId);

    if (renewalData.plan) {
      tenant.plan = renewalData.plan;
    }

    if (renewalData.monthlyFee) {
      tenant.monthlyFee = renewalData.monthlyFee;
    }

    if (renewalData.renewalPeriodMonths) {
      const currentEnd = tenant.subscriptionEndDate || new Date();
      const newEnd = new Date(currentEnd);
      newEnd.setMonth(newEnd.getMonth() + renewalData.renewalPeriodMonths);
      tenant.subscriptionEndDate = newEnd;
    }

    tenant.subscriptionStatus = 'active';
    return this.tenantRepository.save(tenant);
  }
}
