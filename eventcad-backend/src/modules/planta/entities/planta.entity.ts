import { Entity, Column, ManyToOne, OneToMany, Index } from 'typeorm';
import { File } from '../../upload/entities/file.entity';
import {
  PlantaTipo,
  PlantaStatus,
} from '../../../common/enums/planta-tipo.enum';
import { User } from '../../auth/entities/user.entity';
import { Evento } from '../../evento/entities/evento.entity';

/**
 * Entidade Planta - Especialização da entidade File para plantas técnicas
 * Herda todas as funcionalidades de File e adiciona características específicas
 *
 * Funcionalidades específicas:
 * - Metadados técnicos avançados (layers, escala, coordenadas)
 * - Processamento de IA para reconhecimento de objetos
 * - Validação de compliance técnico
 * - Versionamento especializado para plantas
 * - Integração com viewer 2D/3D
 * - Análise de compatibilidade entre versões
 */
@Entity('plantas')
@Index(['plantaTipo', 'tenantId'])
@Index(['plantaStatus', 'tenantId'])
@Index(['eventoId', 'tenantId'])
@Index(['escala', 'tenantId'])
export class Planta extends File {
  // Informações específicas da planta
  @Column({
    type: 'enum',
    enum: PlantaTipo,
    nullable: false,
    comment: 'Tipo específico da planta técnica',
  })
  plantaTipo: PlantaTipo;

  @Column({
    type: 'enum',
    enum: PlantaStatus,
    default: PlantaStatus.DRAFT,
    comment: 'Status específico do processamento da planta',
  })
  plantaStatus: PlantaStatus;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Escala da planta (ex: 1:100, 1:50)',
  })
  escala?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Unidade de medida (metros, milímetros, etc.)',
  })
  unidadeMedida?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Sistema de coordenadas utilizado',
  })
  sistemaCoordenadas?: string;

  // Relacionamentos
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do evento relacionado',
  })
  eventoId?: string;

  @ManyToOne(() => Evento, { eager: false })
  evento?: Evento;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do engenheiro responsável pela planta',
  })
  engenheiroResponsavelId?: string;

  @ManyToOne(() => User, { eager: false })
  engenheiroResponsavel?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID da planta base/referência',
  })
  plantaBaseId?: string;

  @ManyToOne(() => Planta, { eager: false })
  plantaBase?: Planta;

  @OneToMany(() => Planta, (planta) => planta.plantaBase)
  plantasDerivadas?: Planta[];

  // Metadados técnicos específicos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados técnicos específicos da planta',
  })
  declare metadata?: Record<string, any> & {
    // Metadados CAD específicos
    dwgVersion?: string;
    cadSoftware?: string;
    createdWith?: string;
    lastModifiedWith?: string;

    // Informações de escala e coordenadas
    scaleFactor?: number;
    basePoint?: { x: number; y: number; z?: number };
    northAngle?: number; // Ângulo do norte em graus

    // Layers e objetos
    layersData?: {
      name: string;
      color?: string;
      lineType?: string;
      isVisible?: boolean;
      isFrozen?: boolean;
      objectCount?: number;
    }[];

    blocksData?: {
      name: string;
      insertionPoint?: { x: number; y: number };
      scale?: { x: number; y: number };
      rotation?: number;
      type?: string;
    }[];

    // Dimensões e limites
    boundingBox?: {
      min: { x: number; y: number; z?: number };
      max: { x: number; y: number; z?: number };
    };

    extents?: {
      width: number;
      height: number;
      depth?: number;
      area?: number;
    };

    // Informações de texto e anotações
    textStyles?: string[];
    dimensionStyles?: string[];
    annotations?: {
      type: string;
      text: string;
      position: { x: number; y: number };
    }[];

    // Informações específicas por tipo
    typeSpecific?: {
      // Para plantas de segurança
      exitCount?: number;
      extinguisherCount?: number;
      sprinklerCount?: number;

      // Para plantas elétricas
      circuitCount?: number;
      totalLoad?: number;
      outletCount?: number;

      // Para plantas hidráulicas
      fixtureCount?: number;
      pipeLength?: number;

      // Para layouts
      standCount?: number;
      aisleWidth?: number;
      occupancyLoad?: number;

      [key: string]: any;
    };

    // Conformidade e validações
    compliance?: {
      validated: boolean;
      validatedAt?: Date;
      validatedBy?: string;
      rules?: {
        rule: string;
        status: 'pass' | 'fail' | 'warning';
        message?: string;
      }[];
      score?: number; // 0-100
    };
  };

  // Processamento de IA
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultados do processamento de IA',
  })
  aiProcessing?: {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    startedAt?: Date;
    completedAt?: Date;
    processingTime?: number; // segundos

    // Objetos detectados pela IA
    detectedObjects?: {
      id: string;
      type: string;
      category: string;
      confidence: number; // 0-1
      boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
      };
      properties?: Record<string, any>;
      manuallyVerified?: boolean;
      verifiedBy?: string;
      verifiedAt?: Date;
    }[];

    // Análise de layers
    layerAnalysis?: {
      layer: string;
      objectCount: number;
      recognizedTypes: string[];
      confidence: number;
    }[];

    // Reconhecimento de texto
    textRecognition?: {
      text: string;
      position: { x: number; y: number };
      confidence: number;
      category?: 'dimension' | 'label' | 'annotation' | 'title';
    }[];

    // Análise de compatibilidade
    compatibilityAnalysis?: {
      withStandards: {
        standard: string;
        compatible: boolean;
        issues?: string[];
      }[];
      withOtherPlants?: {
        plantaId: string;
        compatibility: number; // 0-1
        conflicts?: string[];
      }[];
    };

    // Erros e warnings
    errors?: string[];
    warnings?: string[];

    // Configurações usadas
    aiConfig?: {
      model: string;
      version: string;
      parameters: Record<string, any>;
    };
  };

  // Histórico de revisões específicas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de revisões técnicas',
  })
  revisoesHistorico?: {
    numero: string;
    data: Date;
    responsavel: string;
    descricao: string;
    tipo: 'inicial' | 'revisao' | 'complementacao' | 'correcao';
    aprovadoPor?: string;
    dataAprovacao?: Date;
    observacoes?: string;
    arquivos?: {
      tipo: 'planta' | 'memorial' | 'calculo' | 'especificacao';
      arquivo: string;
    }[];
  }[];

  // Validações técnicas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Validações técnicas realizadas',
  })
  validacoesTecnicas?: {
    tipo: string;
    executadaEm: Date;
    executadaPor: string;
    status: 'aprovado' | 'rejeitado' | 'pendente' | 'condicional';
    observacoes?: string;
    checklist?: {
      item: string;
      status: 'ok' | 'nok' | 'na';
      observacao?: string;
    }[];
  }[];

  // Configurações de visualização
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações para visualização 2D/3D',
  })
  configuracaoVisualizacao?: {
    viewerType: '2d' | '3d' | 'both';
    defaultView?: {
      center: { x: number; y: number };
      zoom: number;
      rotation?: number;
    };
    layerVisibility?: Record<string, boolean>;
    colorOverrides?: Record<string, string>;
    highlightObjects?: string[];
    measurementUnits?: string;
    gridVisible?: boolean;
    annotationsVisible?: boolean;
  };

  // Integração e exportação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de integração e exportação',
  })
  integracaoConfig?: {
    exportFormats?: string[];
    ifc?: {
      version: string;
      entities: string[];
      properties: Record<string, any>;
    };
    dwf?: {
      views: string[];
      markups: boolean;
    };
    pdf?: {
      scale: string;
      paperSize: string;
      orientation: 'portrait' | 'landscape';
    };
    web?: {
      viewer: string;
      interactive: boolean;
      measurements: boolean;
    };
  };

  /**
   * Verifica se a planta está pronta para processamento de IA
   */
  get readyForAI(): boolean {
    return (
      (this.plantaStatus === PlantaStatus.UPLOADED &&
        this.status === 'processed' &&
        !this.aiProcessing?.status) ||
      this.aiProcessing?.status === 'failed'
    );
  }

  /**
   * Verifica se a planta precisa de revisão manual
   */
  get needsManualReview(): boolean {
    return (
      this.plantaStatus === PlantaStatus.REVIEW_NEEDED ||
      (this.aiProcessing?.status === 'completed' &&
        this.aiProcessing?.errors &&
        this.aiProcessing.errors.length > 0) ||
      false
    );
  }

  /**
   * Obtém o score de qualidade da planta (0-100)
   */
  get qualityScore(): number {
    let score = 0;
    let factors = 0;

    // Score baseado em metadados
    if (this.metadata?.compliance?.score) {
      score += this.metadata.compliance.score;
      factors++;
    }

    // Score baseado em processamento de IA
    if (this.aiProcessing?.detectedObjects) {
      const avgConfidence =
        this.aiProcessing.detectedObjects.reduce(
          (sum, obj) => sum + obj.confidence,
          0,
        ) / this.aiProcessing.detectedObjects.length;
      score += avgConfidence * 100;
      factors++;
    }

    // Score baseado em validações
    if (this.validacoesTecnicas && this.validacoesTecnicas.length > 0) {
      const approvedValidations = this.validacoesTecnicas.filter(
        (v) => v.status === 'aprovado',
      ).length;
      score += (approvedValidations / this.validacoesTecnicas.length) * 100;
      factors++;
    }

    return factors > 0 ? Math.round(score / factors) : 0;
  }

  /**
   * Obtém objetos detectados por categoria
   */
  getDetectedObjectsByCategory(): Record<string, any[]> {
    if (!this.aiProcessing?.detectedObjects) return {};

    return this.aiProcessing.detectedObjects.reduce(
      (acc, obj) => {
        if (!acc[obj.category]) acc[obj.category] = [];
        acc[obj.category].push(obj);
        return acc;
      },
      {} as Record<string, any[]>,
    );
  }

  /**
   * Adiciona resultado de validação técnica
   */
  addValidacaoTecnica(validacao: {
    tipo: string;
    executadaPor: string;
    status: 'aprovado' | 'rejeitado' | 'pendente' | 'condicional';
    observacoes?: string;
    checklist?: {
      item: string;
      status: 'ok' | 'nok' | 'na';
      observacao?: string;
    }[];
  }): void {
    if (!this.validacoesTecnicas) {
      this.validacoesTecnicas = [];
    }

    this.validacoesTecnicas.push({
      ...validacao,
      executadaEm: new Date(),
    });

    // Atualizar status baseado na validação
    if (validacao.status === 'aprovado') {
      this.plantaStatus = PlantaStatus.APPROVED;
    } else if (validacao.status === 'rejeitado') {
      this.plantaStatus = PlantaStatus.REJECTED;
    }
  }

  /**
   * Adiciona revisão ao histórico
   */
  addRevisao(revisao: {
    numero: string;
    responsavel: string;
    descricao: string;
    tipo: 'inicial' | 'revisao' | 'complementacao' | 'correcao';
    observacoes?: string;
  }): void {
    if (!this.revisoesHistorico) {
      this.revisoesHistorico = [];
    }

    this.revisoesHistorico.push({
      ...revisao,
      data: new Date(),
    });
  }

  /**
   * Atualiza resultado do processamento de IA
   */
  updateAIProcessing(result: Partial<Planta['aiProcessing']>): void {
    if (!this.aiProcessing) {
      this.aiProcessing = { status: 'pending' };
    }

    this.aiProcessing = {
      ...this.aiProcessing,
      ...result,
    };

    // Atualizar status baseado no resultado
    if (result?.status === 'completed') {
      this.plantaStatus =
        result?.errors && result.errors.length > 0
          ? PlantaStatus.REVIEW_NEEDED
          : PlantaStatus.AI_COMPLETED;
    } else if (result?.status === 'failed') {
      this.plantaStatus = PlantaStatus.ERROR;
    } else if (result?.status === 'processing') {
      this.plantaStatus = PlantaStatus.AI_PROCESSING;
    }
  }

  /**
   * Verifica compatibilidade com outra planta
   */
  isCompatibleWith(outraPlanta: Planta): boolean {
    // Verificar mesma escala
    if (
      this.escala &&
      outraPlanta.escala &&
      this.escala !== outraPlanta.escala
    ) {
      return false;
    }

    // Verificar mesma unidade de medida
    if (
      this.unidadeMedida &&
      outraPlanta.unidadeMedida &&
      this.unidadeMedida !== outraPlanta.unidadeMedida
    ) {
      return false;
    }

    // Verificar mesmo sistema de coordenadas
    if (
      this.sistemaCoordenadas &&
      outraPlanta.sistemaCoordenadas &&
      this.sistemaCoordenadas !== outraPlanta.sistemaCoordenadas
    ) {
      return false;
    }

    return true;
  }

  /**
   * Exporta metadados para integração
   */
  exportMetadata(): Record<string, any> {
    return {
      basic: {
        id: this.id,
        nome: this.originalName,
        tipo: this.plantaTipo,
        status: this.plantaStatus,
        escala: this.escala,
        unidade: this.unidadeMedida,
      },
      technical: this.metadata,
      ai: this.aiProcessing,
      quality: {
        score: this.qualityScore,
        validated: this.metadata?.compliance?.validated,
        needsReview: this.needsManualReview,
      },
      versions: {
        current: this.version,
        isLatest: this.isLatestVersion,
        hasHistory: this.revisoesHistorico && this.revisoesHistorico.length > 0,
      },
    };
  }
}
