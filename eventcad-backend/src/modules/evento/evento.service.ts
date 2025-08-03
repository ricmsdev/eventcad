import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, FindManyOptions, Between } from 'typeorm';
import { Evento } from './entities/evento.entity';
import { CreateEventoDto } from './dto/create-evento.dto';
import { UpdateEventoDto } from './dto/update-evento.dto';
import {
  EventStatus,
  isValidStatusTransition,
} from '../../common/enums/event-status.enum';
import {
  EventoTipo,
  getEventoTipoConfig,
} from '../../common/enums/evento-tipo.enum';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Serviço para gestão de eventos do EventCAD+
 *
 * Funcionalidades:
 * - CRUD completo de eventos
 * - Workflow de status e aprovações
 * - Timeline e marcos
 * - Análise de riscos
 * - Gestão de documentos
 * - Compliance e verificações
 * - Relatórios e estatísticas
 */
@Injectable()
export class EventoService {
  constructor(
    @InjectRepository(Evento)
    private readonly eventoRepository: Repository<Evento>,
  ) {}

  /**
   * Cria um novo evento
   * @param createEventoDto - Dados do evento
   * @param userId - ID do usuário criador
   * @param tenantId - ID do tenant
   * @returns Evento criado
   */
  async create(
    createEventoDto: CreateEventoDto,
    userId: string,
    tenantId: string,
  ): Promise<Evento> {
    // Validações de negócio
    await this.validateCreateData(createEventoDto);

    // Aplicar configurações padrão baseadas no tipo
    const tipoConfig = getEventoTipoConfig(createEventoDto.tipo);

    const evento = this.eventoRepository.create({
      ...createEventoDto,
      dataInicio: new Date(createEventoDto.dataInicio),
      dataFim: new Date(createEventoDto.dataFim),
      dataLimiteMontagem: createEventoDto.dataLimiteMontagem
        ? new Date(createEventoDto.dataLimiteMontagem)
        : undefined,
      dataLimiteDesmontagem: createEventoDto.dataLimiteDesmontagem
        ? new Date(createEventoDto.dataLimiteDesmontagem)
        : undefined,
      organizadorId: userId,
      tenantId,
      createdBy: userId,
      status: EventStatus.DRAFT,
      nivelRisco: createEventoDto.nivelRisco || tipoConfig.riscoPadrao,
      publicoEsperado: createEventoDto.publicoEsperado || 0,
      moeda: createEventoDto.moeda || 'BRL',

      // Aplicar configurações padrão do tipo
      configuracoesTecnicas: {
        ...tipoConfig.equipamentosObrigatorios.reduce(
          (acc, equip) => ({
            ...acc,
            [equip]: true,
          }),
          {},
        ),
        ...createEventoDto.configuracoesTecnicas,
      },

      // Inicializar aprovações necessárias
      aprovacoes: tipoConfig.complianceObrigatorio.reduce(
        (acc, compliance) => ({
          ...acc,
          [compliance.toLowerCase().replace(/\s+/g, '_')]: {
            status: 'pendente',
          },
        }),
        {},
      ),

      // Timeline inicial básica
      timeline: this.generateInitialTimeline(
        new Date(createEventoDto.dataInicio),
        new Date(createEventoDto.dataFim),
        createEventoDto.dataLimiteMontagem
          ? new Date(createEventoDto.dataLimiteMontagem)
          : undefined,
      ),

      // Estatísticas iniciais
      estatisticas: {
        visualizacoes: 0,
        downloads_planta: 0,
        alteracoes_planta: 0,
        score_compliance: 0,
      },
    });

    const savedEvento = await this.eventoRepository.save(evento);

    return this.findById(savedEvento.id, tenantId);
  }

  /**
   * Lista eventos com filtros e paginação
   * @param tenantId - ID do tenant
   * @param options - Opções de busca e paginação
   * @returns Lista paginada de eventos
   */
  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      status?: EventStatus;
      tipo?: EventoTipo;
      organizadorId?: string;
      dataInicio?: Date;
      dataFim?: Date;
      search?: string;
    } = {},
  ): Promise<{ data: Evento[]; total: number; page: number; limit: number }> {
    const page = options.page || 1;
    const limit = Math.min(options.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.eventoRepository
      .createQueryBuilder('evento')
      .leftJoinAndSelect('evento.organizador', 'organizador')
      .leftJoinAndSelect('evento.engenheiroResponsavel', 'engenheiro')
      .leftJoinAndSelect('evento.responsavelSeguranca', 'seguranca')
      .where('evento.tenantId = :tenantId', { tenantId })
      .andWhere('evento.isActive = :isActive', { isActive: true });

    // Aplicar filtros
    if (options.status) {
      queryBuilder.andWhere('evento.status = :status', {
        status: options.status,
      });
    }

    if (options.tipo) {
      queryBuilder.andWhere('evento.tipo = :tipo', { tipo: options.tipo });
    }

    if (options.organizadorId) {
      queryBuilder.andWhere('evento.organizadorId = :organizadorId', {
        organizadorId: options.organizadorId,
      });
    }

    if (options.dataInicio && options.dataFim) {
      queryBuilder.andWhere(
        'evento.dataInicio BETWEEN :dataInicio AND :dataFim',
        {
          dataInicio: options.dataInicio,
          dataFim: options.dataFim,
        },
      );
    }

    if (options.search) {
      queryBuilder.andWhere(
        '(evento.nome ILIKE :search OR evento.descricao ILIKE :search OR evento.local ILIKE :search)',
        { search: `%${options.search}%` },
      );
    }

    // Ordenação
    queryBuilder.orderBy('evento.dataInicio', 'ASC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Busca evento por ID
   * @param id - ID do evento
   * @param tenantId - ID do tenant
   * @returns Evento encontrado
   */
  async findById(id: string, tenantId: string): Promise<Evento> {
    const evento = await this.eventoRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: [
        'organizador',
        'engenheiroResponsavel',
        'responsavelSeguranca',
      ],
    });

    if (!evento) {
      throw new NotFoundException(`Evento com ID ${id} não encontrado`);
    }

    return evento;
  }

  /**
   * Atualiza evento existente
   * @param id - ID do evento
   * @param updateEventoDto - Dados para atualização
   * @param userId - ID do usuário que está atualizando
   * @param tenantId - ID do tenant
   * @param userRole - Role do usuário
   * @returns Evento atualizado
   */
  async update(
    id: string,
    updateEventoDto: UpdateEventoDto,
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<Evento> {
    const evento = await this.findById(id, tenantId);

    // Verificar permissões
    this.validateUpdatePermissions(evento, userId, userRole);

    // Validar mudança de status se especificada
    if (updateEventoDto.status && updateEventoDto.status !== evento.status) {
      this.validateStatusTransition(evento.status, updateEventoDto.status);
    }

    // Validar datas se alteradas
    if (updateEventoDto.dataInicio || updateEventoDto.dataFim) {
      const dataInicio = updateEventoDto.dataInicio
        ? new Date(updateEventoDto.dataInicio)
        : evento.dataInicio;
      const dataFim = updateEventoDto.dataFim
        ? new Date(updateEventoDto.dataFim)
        : evento.dataFim;

      this.validateDates(dataInicio, dataFim);
    }

    // Aplicar atualizações
    Object.assign(evento, {
      ...updateEventoDto,
      dataInicio: updateEventoDto.dataInicio
        ? new Date(updateEventoDto.dataInicio)
        : evento.dataInicio,
      dataFim: updateEventoDto.dataFim
        ? new Date(updateEventoDto.dataFim)
        : evento.dataFim,
      dataLimiteMontagem: updateEventoDto.dataLimiteMontagem
        ? new Date(updateEventoDto.dataLimiteMontagem)
        : evento.dataLimiteMontagem,
      dataLimiteDesmontagem: updateEventoDto.dataLimiteDesmontagem
        ? new Date(updateEventoDto.dataLimiteDesmontagem)
        : evento.dataLimiteDesmontagem,
      updatedBy: userId,
    });

    await this.eventoRepository.save(evento);

    return this.findById(id, tenantId);
  }

  /**
   * Atualiza status do evento
   * @param id - ID do evento
   * @param newStatus - Novo status
   * @param observacoes - Observações sobre a mudança
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @param userRole - Role do usuário
   * @returns Evento atualizado
   */
  async updateStatus(
    id: string,
    newStatus: EventStatus,
    observacoes: string | undefined,
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<Evento> {
    const evento = await this.findById(id, tenantId);

    // Verificar permissões para mudança de status
    this.validateStatusChangePermissions(evento, newStatus, userRole);

    // Validar transição
    this.validateStatusTransition(evento.status, newStatus);

    // Atualizar status
    evento.status = newStatus;
    evento.updatedBy = userId;

    // Adicionar marco na timeline
    evento.adicionarMarcoTimeline({
      titulo: `Status alterado para ${newStatus}`,
      descricao: observacoes || `Status do evento alterado para ${newStatus}`,
      data: new Date(),
      responsavel: userId,
      tipo: this.getTimelineTypeFromStatus(newStatus),
    });

    await this.eventoRepository.save(evento);

    return this.findById(id, tenantId);
  }

  /**
   * Adiciona marco na timeline
   * @param id - ID do evento
   * @param marco - Dados do marco
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Evento atualizado
   */
  async addMarcoTimeline(
    id: string,
    marco: {
      titulo: string;
      descricao?: string;
      data: string;
      responsavel?: string;
      tipo:
        | 'planejamento'
        | 'aprovacao'
        | 'montagem'
        | 'evento'
        | 'desmontagem';
    },
    userId: string,
    tenantId: string,
  ): Promise<Evento> {
    const evento = await this.findById(id, tenantId);

    evento.adicionarMarcoTimeline({
      ...marco,
      data: new Date(marco.data),
      responsavel: marco.responsavel || userId,
    });

    evento.updatedBy = userId;
    await this.eventoRepository.save(evento);

    return this.findById(id, tenantId);
  }

  /**
   * Atualiza marco na timeline
   * @param id - ID do evento
   * @param marcoId - ID do marco
   * @param status - Novo status do marco
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Evento atualizado
   */
  async updateMarcoTimeline(
    id: string,
    marcoId: string,
    status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado',
    userId: string,
    tenantId: string,
  ): Promise<Evento> {
    const evento = await this.findById(id, tenantId);

    evento.atualizarMarcoTimeline(marcoId, status);
    evento.updatedBy = userId;

    await this.eventoRepository.save(evento);

    return this.findById(id, tenantId);
  }

  /**
   * Adiciona risco ao evento
   * @param id - ID do evento
   * @param risco - Dados do risco
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Evento atualizado
   */
  async addRisco(
    id: string,
    risco: {
      categoria: string;
      descricao: string;
      probabilidade: 'baixa' | 'media' | 'alta';
      impacto: 'baixo' | 'medio' | 'alto';
      mitigacao?: string;
      responsavel?: string;
    },
    userId: string,
    tenantId: string,
  ): Promise<Evento> {
    const evento = await this.findById(id, tenantId);

    evento.adicionarRisco({
      ...risco,
      responsavel: risco.responsavel || userId,
    });

    evento.updatedBy = userId;
    await this.eventoRepository.save(evento);

    return this.findById(id, tenantId);
  }

  /**
   * Remove evento (soft delete)
   * @param id - ID do evento
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @param userRole - Role do usuário
   */
  async remove(
    id: string,
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<void> {
    const evento = await this.findById(id, tenantId);

    // Verificar permissões
    this.validateDeletePermissions(evento, userId, userRole);

    // Verificar se pode ser removido (status adequado)
    if (![EventStatus.DRAFT, EventStatus.CANCELLED].includes(evento.status)) {
      throw new BadRequestException(
        'Apenas eventos em rascunho ou cancelados podem ser removidos',
      );
    }

    evento.deactivate(userId);
    await this.eventoRepository.save(evento);
  }

  /**
   * Obtém estatísticas gerais de eventos
   * @param tenantId - ID do tenant
   * @returns Estatísticas
   */
  async getEstatisticas(tenantId: string) {
    const total = await this.eventoRepository.count({
      where: { tenantId, isActive: true },
    });

    const porStatus = await this.eventoRepository
      .createQueryBuilder('evento')
      .select('evento.status, COUNT(*) as count')
      .where('evento.tenantId = :tenantId', { tenantId })
      .andWhere('evento.isActive = :isActive', { isActive: true })
      .groupBy('evento.status')
      .getRawMany();

    const porTipo = await this.eventoRepository
      .createQueryBuilder('evento')
      .select('evento.tipo, COUNT(*) as count')
      .where('evento.tenantId = :tenantId', { tenantId })
      .andWhere('evento.isActive = :isActive', { isActive: true })
      .groupBy('evento.tipo')
      .getRawMany();

    const proximosEventos = await this.eventoRepository.find({
      where: {
        tenantId,
        isActive: true,
        dataInicio: Between(
          new Date(),
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        ),
      },
      order: { dataInicio: 'ASC' },
      take: 5,
    });

    return {
      total,
      porStatus,
      porTipo,
      proximosEventos,
    };
  }

  // Métodos privados de validação e utilidade

  private async validateCreateData(
    createEventoDto: CreateEventoDto,
  ): Promise<void> {
    // Validar datas
    const dataInicio = new Date(createEventoDto.dataInicio);
    const dataFim = new Date(createEventoDto.dataFim);

    this.validateDates(dataInicio, dataFim);

    // Validar capacidade vs público esperado
    if (
      createEventoDto.publicoEsperado &&
      createEventoDto.publicoEsperado > createEventoDto.capacidadeMaxima
    ) {
      throw new BadRequestException(
        'Público esperado não pode exceder a capacidade máxima',
      );
    }
  }

  private validateDates(dataInicio: Date, dataFim: Date): void {
    if (dataFim <= dataInicio) {
      throw new BadRequestException(
        'Data de fim deve ser posterior à data de início',
      );
    }

    if (dataInicio < new Date()) {
      throw new BadRequestException('Data de início não pode ser no passado');
    }
  }

  private validateStatusTransition(
    currentStatus: EventStatus,
    newStatus: EventStatus,
  ): void {
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new BadRequestException(
        `Transição de status inválida: ${currentStatus} -> ${newStatus}`,
      );
    }
  }

  private validateUpdatePermissions(
    evento: Evento,
    userId: string,
    userRole: UserRole,
  ): void {
    // Organizador pode editar seus próprios eventos
    if (evento.organizadorId === userId) return;

    // Engenheiro responsável pode editar
    if (evento.engenheiroResponsavelId === userId) return;

    // Admins e superiores podem editar qualquer evento
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.PROJECT_MANAGER].includes(
        userRole,
      )
    )
      return;

    throw new ForbiddenException('Sem permissão para editar este evento');
  }

  private validateStatusChangePermissions(
    evento: Evento,
    newStatus: EventStatus,
    userRole: UserRole,
  ): void {
    // Algumas mudanças de status requerem roles específicos
    const restrictedStatuses = [EventStatus.APPROVED, EventStatus.REJECTED];

    if (restrictedStatuses.includes(newStatus)) {
      if (
        ![
          UserRole.ADMIN,
          UserRole.SUPER_ADMIN,
          UserRole.ENGINEER,
          UserRole.PROJECT_MANAGER,
        ].includes(userRole)
      ) {
        throw new ForbiddenException(
          'Sem permissão para aprovar/rejeitar eventos',
        );
      }
    }
  }

  private validateDeletePermissions(
    evento: Evento,
    userId: string,
    userRole: UserRole,
  ): void {
    // Apenas organizador, admins ou super admins podem remover
    if (evento.organizadorId === userId) return;
    if ([UserRole.ADMIN, UserRole.SUPER_ADMIN].includes(userRole)) return;

    throw new ForbiddenException('Sem permissão para remover este evento');
  }

  private generateInitialTimeline(
    dataInicio: Date,
    dataFim: Date,
    dataLimiteMontagem?: Date,
  ): Array<{
    id: string;
    titulo: string;
    data: Date;
    tipo: 'planejamento' | 'aprovacao' | 'montagem' | 'evento' | 'desmontagem';
    status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
  }> {
    const timeline: Array<{
      id: string;
      titulo: string;
      data: Date;
      tipo:
        | 'planejamento'
        | 'aprovacao'
        | 'montagem'
        | 'evento'
        | 'desmontagem';
      status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
    }> = [];

    // Marcos básicos
    timeline.push({
      id: `marco_${Date.now()}_inicio`,
      titulo: 'Início do evento',
      data: dataInicio,
      tipo: 'evento' as const,
      status: 'pendente' as const,
    });

    timeline.push({
      id: `marco_${Date.now()}_fim`,
      titulo: 'Fim do evento',
      data: dataFim,
      tipo: 'evento' as const,
      status: 'pendente' as const,
    });

    if (dataLimiteMontagem) {
      timeline.push({
        id: `marco_${Date.now()}_montagem`,
        titulo: 'Limite para montagem',
        data: dataLimiteMontagem,
        tipo: 'montagem' as const,
        status: 'pendente' as const,
      });
    }

    return timeline.sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    );
  }

  private getTimelineTypeFromStatus(
    status: EventStatus,
  ): 'planejamento' | 'aprovacao' | 'montagem' | 'evento' | 'desmontagem' {
    switch (status) {
      case EventStatus.DRAFT:
      case EventStatus.PLANNING:
        return 'planejamento';
      case EventStatus.AWAITING_APPROVAL:
      case EventStatus.UNDER_REVIEW:
      case EventStatus.APPROVED:
      case EventStatus.REJECTED:
        return 'aprovacao';
      case EventStatus.PREPARING:
      case EventStatus.READY:
        return 'montagem';
      case EventStatus.ONGOING:
      case EventStatus.PAUSED:
      case EventStatus.COMPLETED:
        return 'evento';
      default:
        return 'planejamento';
    }
  }
}
