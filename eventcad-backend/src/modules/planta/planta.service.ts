import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Planta } from './entities/planta.entity';
import { UploadService } from '../upload/upload.service';
import {
  UploadPlantaDto,
  UpdatePlantaDto,
  ValidacaoTecnicaDto,
  RevisaoPlantaDto,
  ProcessAIDto,
  SearchPlantasDto,
} from './dto/planta.dto';
import {
  PlantaTipo,
  PlantaStatus,
  getPlantaTipoConfig,
  requiresAIProcessing,
  requiresManualReview,
  getProcessingPriority,
} from '../../common/enums/planta-tipo.enum';
import { FileCategory } from '../../common/enums/file-type.enum';
import { UserRole } from '../../common/enums/user-role.enum';

/**
 * Serviço especializado para gestão de plantas técnicas do EventCAD+
 *
 * Funcionalidades:
 * - Upload especializado para plantas técnicas
 * - Processamento de metadados específicos CAD
 * - Integração com IA para reconhecimento de objetos
 * - Validação de compliance técnico
 * - Versionamento especializado
 * - Análise de compatibilidade entre plantas
 * - Geração de relatórios técnicos
 */
@Injectable()
export class PlantaService {
  constructor(
    @InjectRepository(Planta)
    private readonly plantaRepository: Repository<Planta>,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Upload de planta técnica
   * @param file - Arquivo da planta
   * @param uploadDto - Dados específicos da planta
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Planta criada
   */
  async uploadPlanta(
    file: Express.Multer.File,
    uploadDto: UploadPlantaDto,
    userId: string,
    tenantId: string,
  ): Promise<Planta> {
    // Validar tipo de arquivo para planta
    await this.validatePlantFile(file, uploadDto.plantaTipo);

    // Fazer upload básico primeiro
    const uploadedFile = await this.uploadService.uploadFile(
      file,
      {
        category: FileCategory.PLANT,
        entityType: 'evento',
        entityId: uploadDto.eventoId,
        isPublic: false, // Plantas são sempre privadas inicialmente
        settings: uploadDto.processingConfig,
      },
      userId,
      tenantId,
    );

    // Converter File para Planta
    const planta = await this.convertFileToPlanta(
      uploadedFile,
      uploadDto,
      userId,
    );

    // Processar com IA se configurado
    if (
      uploadDto.processarIA !== false &&
      requiresAIProcessing(uploadDto.plantaTipo)
    ) {
      this.scheduleAIProcessing(planta.id, uploadDto.processingConfig);
    }

    return planta;
  }

  /**
   * Busca plantas com filtros específicos
   * @param tenantId - ID do tenant
   * @param searchDto - Critérios de busca
   * @returns Lista paginada de plantas
   */
  async findPlantas(
    tenantId: string,
    searchDto: SearchPlantasDto = {},
  ): Promise<{ data: Planta[]; total: number; page: number; limit: number }> {
    const page = searchDto.page || 1;
    const limit = Math.min(searchDto.limit || 20, 100);
    const skip = (page - 1) * limit;

    const queryBuilder = this.plantaRepository
      .createQueryBuilder('planta')
      .leftJoinAndSelect('planta.evento', 'evento')
      .leftJoinAndSelect('planta.engenheiroResponsavel', 'engenheiro')
      .leftJoinAndSelect('planta.uploader', 'uploader')
      .where('planta.tenantId = :tenantId', { tenantId })
      .andWhere('planta.isActive = :isActive', { isActive: true });

    // Aplicar filtros específicos
    if (searchDto.plantaTipo) {
      queryBuilder.andWhere('planta.plantaTipo = :plantaTipo', {
        plantaTipo: searchDto.plantaTipo,
      });
    }

    if (searchDto.plantaStatus) {
      queryBuilder.andWhere('planta.plantaStatus = :plantaStatus', {
        plantaStatus: searchDto.plantaStatus,
      });
    }

    if (searchDto.eventoId) {
      queryBuilder.andWhere('planta.eventoId = :eventoId', {
        eventoId: searchDto.eventoId,
      });
    }

    if (searchDto.escala) {
      queryBuilder.andWhere('planta.escala = :escala', {
        escala: searchDto.escala,
      });
    }

    if (searchDto.search) {
      queryBuilder.andWhere(
        '(planta.originalName ILIKE :search OR planta.filename ILIKE :search)',
        { search: `%${searchDto.search}%` },
      );
    }

    // Filtros computados (precisam de subquery ou processamento)
    if (searchDto.minQualityScore !== undefined) {
      // Implementar filtro por quality score
      // Por ora, vamos fazer um filtro básico
      queryBuilder.andWhere('planta.metadata IS NOT NULL');
    }

    if (searchDto.needsReview !== undefined) {
      if (searchDto.needsReview) {
        queryBuilder.andWhere('planta.plantaStatus = :reviewStatus', {
          reviewStatus: PlantaStatus.REVIEW_NEEDED,
        });
      }
    }

    if (searchDto.readyForAI !== undefined) {
      if (searchDto.readyForAI) {
        queryBuilder.andWhere('planta.plantaStatus = :uploadedStatus', {
          uploadedStatus: PlantaStatus.UPLOADED,
        });
      }
    }

    // Ordenação
    queryBuilder.orderBy('planta.createdAt', 'DESC');

    // Paginação
    queryBuilder.skip(skip).take(limit);

    const [data, total] = await queryBuilder.getManyAndCount();

    return { data, total, page, limit };
  }

  /**
   * Busca planta por ID
   * @param id - ID da planta
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Planta encontrada
   */
  async findById(
    id: string,
    userId: string,
    tenantId: string,
  ): Promise<Planta> {
    const planta = await this.plantaRepository.findOne({
      where: { id, tenantId, isActive: true },
      relations: [
        'evento',
        'engenheiroResponsavel',
        'uploader',
        'plantaBase',
        'plantasDerivadas',
      ],
    });

    if (!planta) {
      throw new NotFoundException('Planta não encontrada');
    }

    // Verificar permissões
    if (!planta.hasPermission(userId, 'view')) {
      throw new ForbiddenException('Sem permissão para visualizar esta planta');
    }

    // Marcar como acessada
    planta.markAsAccessed();
    await this.plantaRepository.save(planta);

    return planta;
  }

  /**
   * Atualiza planta
   * @param id - ID da planta
   * @param updateDto - Dados para atualização
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @param userRole - Role do usuário
   * @returns Planta atualizada
   */
  async update(
    id: string,
    updateDto: UpdatePlantaDto,
    userId: string,
    tenantId: string,
    userRole: UserRole,
  ): Promise<Planta> {
    const planta = await this.findById(id, userId, tenantId);

    // Verificar permissões de edição
    this.validateUpdatePermissions(planta, userId, userRole);

    // Aplicar atualizações
    Object.assign(planta, {
      ...updateDto,
      updatedBy: userId,
    });

    // Se mudou o tipo, verificar se precisa reprocessar
    if (updateDto.plantaTipo && updateDto.plantaTipo !== planta.plantaTipo) {
      const needsAI = requiresAIProcessing(updateDto.plantaTipo);
      if (needsAI && !planta.aiProcessing?.status) {
        this.scheduleAIProcessing(planta.id);
      }
    }

    return this.plantaRepository.save(planta);
  }

  /**
   * Adiciona validação técnica à planta
   * @param id - ID da planta
   * @param validacaoDto - Dados da validação
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Planta atualizada
   */
  async addValidacaoTecnica(
    id: string,
    validacaoDto: ValidacaoTecnicaDto,
    userId: string,
    tenantId: string,
  ): Promise<Planta> {
    const planta = await this.findById(id, userId, tenantId);

    // Verificar se pode adicionar validação
    if (!planta.hasPermission(userId, 'edit')) {
      throw new ForbiddenException('Sem permissão para validar esta planta');
    }

    planta.addValidacaoTecnica({
      ...validacaoDto,
      executadaPor: userId,
    });

    return this.plantaRepository.save(planta);
  }

  /**
   * Adiciona revisão à planta
   * @param id - ID da planta
   * @param revisaoDto - Dados da revisão
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Planta atualizada
   */
  async addRevisao(
    id: string,
    revisaoDto: RevisaoPlantaDto,
    userId: string,
    tenantId: string,
  ): Promise<Planta> {
    const planta = await this.findById(id, userId, tenantId);

    // Verificar permissões
    if (!planta.hasPermission(userId, 'edit')) {
      throw new ForbiddenException('Sem permissão para revisar esta planta');
    }

    planta.addRevisao({
      ...revisaoDto,
      responsavel: userId,
    });

    return this.plantaRepository.save(planta);
  }

  /**
   * Processa planta com IA
   * @param id - ID da planta
   * @param processDto - Configurações de processamento
   * @param userId - ID do usuário
   * @param tenantId - ID do tenant
   * @returns Status do processamento
   */
  async processWithAI(
    id: string,
    processDto: ProcessAIDto,
    userId: string,
    tenantId: string,
  ): Promise<{ status: string; message: string }> {
    const planta = await this.findById(id, userId, tenantId);

    // Verificar se pode processar
    if (!planta.readyForAI) {
      throw new BadRequestException(
        'Planta não está pronta para processamento de IA',
      );
    }

    // Atualizar status para processando
    planta.updateAIProcessing({
      status: 'processing',
      startedAt: new Date(),
    });
    await this.plantaRepository.save(planta);

    // Agendar processamento (simulado por enquanto)
    this.executeAIProcessing(planta.id, processDto);

    return {
      status: 'processing',
      message: 'Processamento de IA iniciado com sucesso',
    };
  }

  /**
   * Obtém plantas por evento
   * @param eventoId - ID do evento
   * @param tenantId - ID do tenant
   * @returns Lista de plantas do evento
   */
  async findByEvento(eventoId: string, tenantId: string): Promise<Planta[]> {
    return this.plantaRepository.find({
      where: {
        eventoId,
        tenantId,
        isActive: true,
      },
      relations: ['engenheiroResponsavel', 'uploader'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Obtém estatísticas de plantas
   * @param tenantId - ID do tenant
   * @returns Estatísticas
   */
  async getEstatisticas(tenantId: string) {
    const total = await this.plantaRepository.count({
      where: { tenantId, isActive: true },
    });

    const porTipo = await this.plantaRepository
      .createQueryBuilder('planta')
      .select('planta.plantaTipo, COUNT(*) as count')
      .where('planta.tenantId = :tenantId', { tenantId })
      .andWhere('planta.isActive = :isActive', { isActive: true })
      .groupBy('planta.plantaTipo')
      .getRawMany();

    const porStatus = await this.plantaRepository
      .createQueryBuilder('planta')
      .select('planta.plantaStatus, COUNT(*) as count')
      .where('planta.tenantId = :tenantId', { tenantId })
      .andWhere('planta.isActive = :isActive', { isActive: true })
      .groupBy('planta.plantaStatus')
      .getRawMany();

    const needingReview = await this.plantaRepository.count({
      where: {
        tenantId,
        isActive: true,
        plantaStatus: PlantaStatus.REVIEW_NEEDED,
      },
    });

    const readyForAI = await this.plantaRepository.count({
      where: {
        tenantId,
        isActive: true,
        plantaStatus: PlantaStatus.UPLOADED,
      },
    });

    return {
      total,
      porTipo,
      porStatus,
      needingReview,
      readyForAI,
    };
  }

  /**
   * Analisa compatibilidade entre plantas
   * @param plantaId1 - ID da primeira planta
   * @param plantaId2 - ID da segunda planta
   * @param tenantId - ID do tenant
   * @returns Análise de compatibilidade
   */
  async analyzeCompatibility(
    plantaId1: string,
    plantaId2: string,
    tenantId: string,
  ): Promise<{
    compatible: boolean;
    score: number;
    issues: string[];
    recommendations: string[];
  }> {
    const [planta1, planta2] = await Promise.all([
      this.plantaRepository.findOne({ where: { id: plantaId1, tenantId } }),
      this.plantaRepository.findOne({ where: { id: plantaId2, tenantId } }),
    ]);

    if (!planta1 || !planta2) {
      throw new NotFoundException(
        'Uma ou ambas as plantas não foram encontradas',
      );
    }

    const compatible = planta1.isCompatibleWith(planta2);
    const issues: string[] = [];
    const recommendations: string[] = [];
    let score = 100;

    // Verificar escala
    if (planta1.escala && planta2.escala && planta1.escala !== planta2.escala) {
      issues.push(`Escalas diferentes: ${planta1.escala} vs ${planta2.escala}`);
      recommendations.push('Padronizar escalas para melhor compatibilidade');
      score -= 20;
    }

    // Verificar unidades
    if (
      planta1.unidadeMedida &&
      planta2.unidadeMedida &&
      planta1.unidadeMedida !== planta2.unidadeMedida
    ) {
      issues.push(
        `Unidades diferentes: ${planta1.unidadeMedida} vs ${planta2.unidadeMedida}`,
      );
      recommendations.push('Converter para a mesma unidade de medida');
      score -= 15;
    }

    // Verificar sistema de coordenadas
    if (
      planta1.sistemaCoordenadas &&
      planta2.sistemaCoordenadas &&
      planta1.sistemaCoordenadas !== planta2.sistemaCoordenadas
    ) {
      issues.push(
        `Sistemas de coordenadas diferentes: ${planta1.sistemaCoordenadas} vs ${planta2.sistemaCoordenadas}`,
      );
      recommendations.push('Utilizar o mesmo sistema de coordenadas');
      score -= 25;
    }

    return {
      compatible,
      score: Math.max(0, score),
      issues,
      recommendations,
    };
  }

  // Métodos privados

  private async validatePlantFile(
    file: Express.Multer.File,
    tipo: PlantaTipo,
  ): Promise<void> {
    const config = getPlantaTipoConfig(tipo);
    const extension = file.originalname.split('.').pop()?.toLowerCase();

    if (!config.compatibilidadeFormatos.includes(extension || '')) {
      throw new BadRequestException(
        `Formato ${extension} não suportado para ${tipo}. ` +
          `Formatos aceitos: ${config.compatibilidadeFormatos.join(', ')}`,
      );
    }
  }

  private async convertFileToPlanta(
    uploadedFile: any,
    uploadDto: UploadPlantaDto,
    userId: string,
  ): Promise<Planta> {
    // Criar registro de planta baseado no arquivo
    const plantaData = {
      // Herdar propriedades do File
      ...uploadedFile,

      // Propriedades específicas da Planta
      plantaTipo: uploadDto.plantaTipo,
      plantaStatus: PlantaStatus.UPLOADED,
      escala: uploadDto.escala,
      unidadeMedida: uploadDto.unidadeMedida,
      sistemaCoordenadas: uploadDto.sistemaCoordenadas,
      eventoId: uploadDto.eventoId,
      engenheiroResponsavelId: uploadDto.engenheiroResponsavelId,
      plantaBaseId: uploadDto.plantaBaseId,

      // Metadados iniciais
      metadata: {
        ...uploadedFile.metadata,
        typeSpecific: {},
        compliance: {
          validated: false,
        },
      },
    };

    const planta = this.plantaRepository.create(plantaData);
    const savedPlanta = await this.plantaRepository.save(planta);

    // Buscar a planta salva com todas as relações
    return this.plantaRepository.findOne({
      where: { id: (savedPlanta as any).id },
      relations: ['evento', 'engenheiroResponsavel', 'uploader'],
    }) as Promise<Planta>;
  }

  private validateUpdatePermissions(
    planta: Planta,
    userId: string,
    userRole: UserRole,
  ): void {
    // Uploader pode sempre editar
    if (planta.uploadedBy === userId) return;

    // Engenheiro responsável pode editar
    if (planta.engenheiroResponsavelId === userId) return;

    // Admins e engenheiros podem editar qualquer planta
    if (
      [UserRole.ADMIN, UserRole.SUPER_ADMIN, UserRole.ENGINEER].includes(
        userRole,
      )
    )
      return;

    throw new ForbiddenException('Sem permissão para editar esta planta');
  }

  private async scheduleAIProcessing(
    plantaId: string,
    config?: UploadPlantaDto['processingConfig'],
  ): Promise<void> {
    // Agendar processamento assíncrono
    // Por enquanto, simular com setTimeout
    setTimeout(() => {
      this.executeAIProcessing(plantaId, config);
    }, 1000);
  }

  private async executeAIProcessing(
    plantaId: string,
    config?: any,
  ): Promise<void> {
    try {
      const planta = await this.plantaRepository.findOne({
        where: { id: plantaId },
      });

      if (!planta) return;

      // Simular processamento de IA
      await new Promise((resolve) => setTimeout(resolve, 5000));

      // Atualizar com resultados simulados
      planta.updateAIProcessing({
        status: 'completed',
        completedAt: new Date(),
        processingTime: 5,
        detectedObjects: this.generateMockDetectedObjects(planta.plantaTipo),
        layerAnalysis: this.generateMockLayerAnalysis(planta.plantaTipo),
        textRecognition: [],
        errors: [],
        warnings: [],
      });

      await this.plantaRepository.save(planta);
    } catch (error) {
      console.error(
        `Erro no processamento de IA para planta ${plantaId}:`,
        error,
      );

      const planta = await this.plantaRepository.findOne({
        where: { id: plantaId },
      });

      if (planta) {
        planta.updateAIProcessing({
          status: 'failed',
          errors: [error.message],
        });
        await this.plantaRepository.save(planta);
      }
    }
  }

  private generateMockDetectedObjects(tipo: PlantaTipo): any[] {
    const config = getPlantaTipoConfig(tipo);

    return config.objetosEsperados.map((obj, index) => ({
      id: `obj_${index}`,
      type: obj,
      category: config.categoria,
      confidence: 0.85 + Math.random() * 0.15,
      boundingBox: {
        x: Math.random() * 1000,
        y: Math.random() * 1000,
        width: 50 + Math.random() * 100,
        height: 50 + Math.random() * 100,
      },
      properties: {},
      manuallyVerified: false,
    }));
  }

  private generateMockLayerAnalysis(tipo: PlantaTipo): any[] {
    const config = getPlantaTipoConfig(tipo);

    return config.layersEsperados.map((layer) => ({
      layer,
      objectCount: Math.floor(Math.random() * 50) + 10,
      recognizedTypes: config.objetosEsperados.slice(0, 3),
      confidence: 0.8 + Math.random() * 0.2,
    }));
  }
}
