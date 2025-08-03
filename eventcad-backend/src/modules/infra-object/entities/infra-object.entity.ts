import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Planta } from '../../planta/entities/planta.entity';
import { AIJob } from '../../ai-recognition/entities/ai-job.entity';
import { User } from '../../auth/entities/user.entity';
import {
  InfraObjectStatus,
  InfraObjectSource,
  ConfidenceLevel,
  SafetyCriticality,
  ValidationType,
  getConfidenceLevel,
  needsReview,
  getObjectTypeConfig,
} from '../../../common/enums/infra-object.enum';

/**
 * Entidade InfraObject - Objetos de infraestrutura detectados/criados
 *
 * Funcionalidades:
 * - Objetos detectados pela IA ou criados manualmente
 * - Sistema de revisão e aprovação por engenheiros
 * - Edição de propriedades e posicionamento
 * - Validação técnica especializada
 * - Histórico completo de modificações
 * - Sistema de conflitos e duplicatas
 * - Classificação por criticidade de segurança
 */
@Entity('infra_objects')
@Index(['plantaId', 'tenantId'])
@Index(['status', 'tenantId'])
@Index(['objectCategory', 'objectType'])
@Index(['criticality', 'status'])
@Index(['aiJobId', 'tenantId'])
@Index(['createdBy', 'status'])
export class InfraObject extends BaseEntity {
  // Identificação do objeto
  @Column({
    type: 'varchar',
    length: 100,
    nullable: false,
    comment: 'Nome/identificador do objeto',
  })
  name: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada do objeto',
  })
  description?: string;

  // Relacionamentos principais
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID da planta onde está o objeto',
  })
  plantaId: string;

  @ManyToOne(() => Planta, { eager: false })
  @JoinColumn({ name: 'plantaId' })
  planta?: Planta;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do job de IA que detectou o objeto',
  })
  aiJobId?: string;

  @ManyToOne(() => AIJob, { eager: false })
  @JoinColumn({ name: 'aiJobId' })
  aiJob?: AIJob;

  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do usuário que criou/detectou o objeto',
  })
  declare createdBy: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'createdBy' })
  creator?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do último usuário que modificou',
  })
  lastModifiedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'lastModifiedBy' })
  lastModifier?: User;

  // Classificação do objeto
  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Categoria do objeto (ARCHITECTURAL, FIRE_SAFETY, etc.)',
  })
  objectCategory: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: false,
    comment: 'Tipo específico do objeto (DOOR, FIRE_EXTINGUISHER, etc.)',
  })
  objectType: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Subtipo ou variação específica',
  })
  objectSubtype?: string;

  // Status e origem
  @Column({
    type: 'enum',
    enum: InfraObjectStatus,
    default: InfraObjectStatus.DETECTED,
    comment: 'Status atual do objeto',
  })
  status: InfraObjectStatus;

  @Column({
    type: 'enum',
    enum: InfraObjectSource,
    default: InfraObjectSource.AI_DETECTION,
    comment: 'Origem do objeto',
  })
  source: InfraObjectSource;

  // Posicionamento e geometria
  @Column({
    type: 'jsonb',
    nullable: false,
    comment: 'Posição e geometria do objeto na planta',
  })
  geometry: {
    // Bounding box principal
    boundingBox: {
      x: number;
      y: number;
      width: number;
      height: number;
    };

    // Centro do objeto
    center: {
      x: number;
      y: number;
    };

    // Rotação em graus
    rotation?: number;

    // Pontos específicos (para objetos complexos)
    points?: {
      x: number;
      y: number;
      type?: 'anchor' | 'control' | 'reference';
    }[];

    // Área e perímetro (calculados)
    area?: number;
    perimeter?: number;

    // Coordenadas no sistema de coordenadas da planta
    realWorldCoordinates?: {
      x: number;
      y: number;
      z?: number;
    };
  };

  // Propriedades específicas do objeto
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Propriedades específicas do tipo de objeto',
  })
  properties?: Record<string, any>;

  // Confiança e validação
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 4,
    nullable: true,
    comment: 'Nível de confiança da IA (0.0000 a 1.0000)',
  })
  confidence?: number;

  @Column({
    type: 'enum',
    enum: ConfidenceLevel,
    nullable: true,
    comment: 'Nível de confiança categórico',
  })
  confidenceLevel?: ConfidenceLevel;

  @Column({
    type: 'enum',
    enum: SafetyCriticality,
    default: SafetyCriticality.NONE,
    comment: 'Criticidade para segurança',
  })
  criticality: SafetyCriticality;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se requer revisão manual',
  })
  requiresReview: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se foi validado manualmente',
  })
  manuallyValidated: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data da validação manual',
  })
  validatedAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que validou',
  })
  validatedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'validatedBy' })
  validator?: User;

  // Validações técnicas necessárias
  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'Tipos de validação necessários',
  })
  requiredValidations?: ValidationType[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Resultados das validações técnicas',
  })
  validationResults?: {
    type: ValidationType;
    status: 'pending' | 'in_progress' | 'passed' | 'failed' | 'not_applicable';
    validatedBy?: string;
    validatedAt?: Date;
    notes?: string;
    attachments?: string[];
    score?: number; // 0-100
  }[];

  // Metadados de detecção
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados da detecção por IA',
  })
  detectionMetadata?: {
    model: string;
    modelVersion: string;
    processingTime: number;
    detectedAt: Date;
    rawOutput?: Record<string, any>;
    alternativeDetections?: {
      type: string;
      confidence: number;
      boundingBox: { x: number; y: number; width: number; height: number };
    }[];
  };

  // Modificações e histórico
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de modificações',
  })
  modificationHistory?: {
    timestamp: Date;
    modifiedBy: string;
    action:
      | 'created'
      | 'moved'
      | 'resized'
      | 'properties_changed'
      | 'status_changed'
      | 'deleted';
    oldValues?: Record<string, any>;
    newValues?: Record<string, any>;
    reason?: string;
    automatic?: boolean;
  }[];

  // Relacionamentos com outros objetos
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do objeto pai (para hierarquias)',
  })
  parentObjectId?: string;

  @ManyToOne(() => InfraObject, { eager: false })
  @JoinColumn({ name: 'parentObjectId' })
  parentObject?: InfraObject;

  @OneToMany(() => InfraObject, (object) => object.parentObject)
  childObjects?: InfraObject[];

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'IDs de objetos relacionados',
  })
  relatedObjectIds?: string[];

  // Conflitos e duplicatas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Informações sobre conflitos',
  })
  conflicts?: {
    type: 'duplicate' | 'overlap' | 'inconsistency' | 'missing_dependency';
    conflictingObjectIds: string[];
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    autoResolvable: boolean;
    suggestedAction?: string;
    resolvedAt?: Date;
    resolvedBy?: string;
  }[];

  // Anotações e comentários
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Anotações e comentários dos usuários',
  })
  annotations?: {
    id: string;
    type: 'comment' | 'issue' | 'note' | 'reminder';
    text: string;
    createdBy: string;
    createdAt: Date;
    position?: { x: number; y: number };
    priority?: 'low' | 'medium' | 'high';
    resolved?: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
  }[];

  // Compliance e normas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Verificações de compliance',
  })
  complianceChecks?: {
    standard: string; // NBR, NFPA, ADA, etc.
    rule: string;
    status:
      | 'compliant'
      | 'non_compliant'
      | 'partial'
      | 'unknown'
      | 'not_applicable';
    checkedAt: Date;
    checkedBy?: string;
    details?: string;
    references?: string[];
    severity?: 'info' | 'warning' | 'error' | 'critical';
  }[];

  // Exportação e integração
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Dados para exportação e integração',
  })
  exportData?: {
    dwgLayerName?: string;
    dwgBlockName?: string;
    ifcType?: string;
    ifcGuid?: string;
    externalId?: string;
    lastExported?: Date;
    exportedFormats?: string[];
  };

  // Métodos de conveniência

  /**
   * Obtém configuração do tipo de objeto
   */
  get typeConfig() {
    return getObjectTypeConfig(this.objectCategory, this.objectType);
  }

  /**
   * Verifica se o objeto está aprovado
   */
  get isApproved(): boolean {
    return this.status === InfraObjectStatus.APPROVED;
  }

  /**
   * Verifica se o objeto precisa de atenção
   */
  get needsAttention(): boolean {
    return (
      this.status === InfraObjectStatus.PENDING_REVIEW ||
      this.status === InfraObjectStatus.CONFLICTED ||
      this.requiresReview ||
      (this.conflicts && this.conflicts.length > 0) ||
      this.hasFailedValidations
    );
  }

  /**
   * Verifica se tem validações falhadas
   */
  get hasFailedValidations(): boolean {
    return this.validationResults?.some((v) => v.status === 'failed') || false;
  }

  /**
   * Obtém score de qualidade geral
   */
  get qualityScore(): number {
    let score = 0;
    let factors = 0;

    // Score baseado na confiança
    if (this.confidence !== null && this.confidence !== undefined) {
      score += this.confidence * 100;
      factors++;
    }

    // Score baseado em validações
    if (this.validationResults && this.validationResults.length > 0) {
      const validationScore =
        this.validationResults.reduce((sum, v) => {
          if (v.score !== undefined) return sum + v.score;
          if (v.status === 'passed') return sum + 100;
          if (v.status === 'failed') return sum + 0;
          return sum + 50; // pending/in_progress
        }, 0) / this.validationResults.length;

      score += validationScore;
      factors++;
    }

    // Penalizar se tem conflitos
    if (this.conflicts && this.conflicts.length > 0) {
      score -= this.conflicts.length * 10;
    }

    return factors > 0
      ? Math.max(0, Math.min(100, Math.round(score / factors)))
      : 0;
  }

  /**
   * Atualiza nível de confiança
   */
  updateConfidence(confidence: number): void {
    this.confidence = Math.max(0, Math.min(1, confidence));
    this.confidenceLevel = getConfidenceLevel(this.confidence);
    this.requiresReview = needsReview(this.confidence, this.criticality);
  }

  /**
   * Adiciona modificação ao histórico
   */
  addModification(
    action: string,
    modifiedBy: string,
    oldValues?: Record<string, any>,
    newValues?: Record<string, any>,
    reason?: string,
    automatic = false,
  ): void {
    if (!this.modificationHistory) {
      this.modificationHistory = [];
    }

    this.modificationHistory.push({
      timestamp: new Date(),
      modifiedBy,
      action: action as any,
      oldValues,
      newValues,
      reason,
      automatic,
    });

    // Manter apenas os últimos 50 registros
    if (this.modificationHistory.length > 50) {
      this.modificationHistory = this.modificationHistory.slice(-50);
    }

    this.lastModifiedBy = modifiedBy;
  }

  /**
   * Adiciona anotação
   */
  addAnnotation(
    type: 'comment' | 'issue' | 'note' | 'reminder',
    text: string,
    createdBy: string,
    position?: { x: number; y: number },
    priority?: 'low' | 'medium' | 'high',
  ): string {
    if (!this.annotations) {
      this.annotations = [];
    }

    const annotationId = `ann_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.annotations.push({
      id: annotationId,
      type,
      text,
      createdBy,
      createdAt: new Date(),
      position,
      priority,
      resolved: false,
    });

    return annotationId;
  }

  /**
   * Resolve anotação
   */
  resolveAnnotation(annotationId: string, resolvedBy: string): boolean {
    if (!this.annotations) return false;

    const annotation = this.annotations.find((a) => a.id === annotationId);
    if (annotation) {
      annotation.resolved = true;
      annotation.resolvedAt = new Date();
      annotation.resolvedBy = resolvedBy;
      return true;
    }

    return false;
  }

  /**
   * Adiciona conflito
   */
  addConflict(
    type: 'duplicate' | 'overlap' | 'inconsistency' | 'missing_dependency',
    conflictingObjectIds: string[],
    description: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    autoResolvable = false,
    suggestedAction?: string,
  ): void {
    if (!this.conflicts) {
      this.conflicts = [];
    }

    this.conflicts.push({
      type,
      conflictingObjectIds,
      description,
      severity,
      autoResolvable,
      suggestedAction,
    });

    // Atualizar status se necessário
    if (this.status !== InfraObjectStatus.CONFLICTED) {
      this.status = InfraObjectStatus.CONFLICTED;
    }
  }

  /**
   * Resolve conflito
   */
  resolveConflict(index: number, resolvedBy: string): boolean {
    if (!this.conflicts || index >= this.conflicts.length) return false;

    this.conflicts[index].resolvedAt = new Date();
    this.conflicts[index].resolvedBy = resolvedBy;

    // Se todos os conflitos foram resolvidos, atualizar status
    const unresolvedConflicts = this.conflicts.filter((c) => !c.resolvedAt);
    if (unresolvedConflicts.length === 0) {
      this.status = this.manuallyValidated
        ? InfraObjectStatus.APPROVED
        : InfraObjectStatus.DETECTED;
    }

    return true;
  }

  /**
   * Adiciona resultado de validação
   */
  addValidationResult(
    type: ValidationType,
    status: 'passed' | 'failed' | 'not_applicable',
    validatedBy: string,
    notes?: string,
    score?: number,
    attachments?: string[],
  ): void {
    if (!this.validationResults) {
      this.validationResults = [];
    }

    // Remover validação anterior do mesmo tipo
    this.validationResults = this.validationResults.filter(
      (v) => v.type !== type,
    );

    this.validationResults.push({
      type,
      status,
      validatedBy,
      validatedAt: new Date(),
      notes,
      score,
      attachments,
    });
  }

  /**
   * Marca como validado manualmente
   */
  markAsValidated(validatedBy: string): void {
    this.manuallyValidated = true;
    this.validatedAt = new Date();
    this.validatedBy = validatedBy;
    this.status = InfraObjectStatus.APPROVED;
    this.requiresReview = false;
  }

  /**
   * Move objeto para nova posição
   */
  moveTo(x: number, y: number, movedBy: string): void {
    const oldGeometry = { ...this.geometry };

    const deltaX = x - this.geometry.center.x;
    const deltaY = y - this.geometry.center.y;

    this.geometry.center = { x, y };
    this.geometry.boundingBox.x += deltaX;
    this.geometry.boundingBox.y += deltaY;

    if (this.geometry.points) {
      this.geometry.points = this.geometry.points.map((point) => ({
        ...point,
        x: point.x + deltaX,
        y: point.y + deltaY,
      }));
    }

    this.addModification(
      'moved',
      movedBy,
      { geometry: oldGeometry },
      { geometry: this.geometry },
    );
  }

  /**
   * Redimensiona objeto
   */
  resize(width: number, height: number, resizedBy: string): void {
    const oldGeometry = { ...this.geometry };

    this.geometry.boundingBox.width = width;
    this.geometry.boundingBox.height = height;

    // Recalcular área se necessário
    if (this.geometry.area !== undefined) {
      this.geometry.area = width * height;
    }

    this.addModification(
      'resized',
      resizedBy,
      { geometry: oldGeometry },
      { geometry: this.geometry },
    );
  }

  /**
   * Atualiza propriedades
   */
  updateProperties(
    newProperties: Record<string, any>,
    updatedBy: string,
  ): void {
    const oldProperties = { ...this.properties };
    this.properties = { ...this.properties, ...newProperties };

    this.addModification(
      'properties_changed',
      updatedBy,
      { properties: oldProperties },
      { properties: this.properties },
    );
  }

  /**
   * Exporta dados para relatório
   */
  exportForReport(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      category: this.objectCategory,
      type: this.objectType,
      status: this.status,
      source: this.source,
      confidence: this.confidence,
      criticality: this.criticality,
      qualityScore: this.qualityScore,
      position: this.geometry.center,
      dimensions: {
        width: this.geometry.boundingBox.width,
        height: this.geometry.boundingBox.height,
      },
      properties: this.properties,
      manuallyValidated: this.manuallyValidated,
      validatedAt: this.validatedAt,
      needsAttention: this.needsAttention,
      conflictsCount: this.conflicts?.length || 0,
      annotationsCount: this.annotations?.length || 0,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
