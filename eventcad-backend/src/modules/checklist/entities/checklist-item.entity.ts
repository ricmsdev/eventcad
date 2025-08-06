import {
  Entity,
  Column,
  ManyToOne,
  Index,
  JoinColumn,
} from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { Checklist } from './checklist.entity';
import { User } from '../../auth/entities/user.entity';

export enum ItemType {
  BOOLEAN = 'boolean',
  TEXT = 'text',
  NUMBER = 'number',
  SELECT = 'select',
  MULTI_SELECT = 'multi_select',
  DATE = 'date',
  FILE = 'file',
  LOCATION = 'location',
  SIGNATURE = 'signature',
  CUSTOM = 'custom',
}

export enum ItemStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  SKIPPED = 'skipped',
  NOT_APPLICABLE = 'not_applicable',
}

export enum ItemPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_VALUE = 'min_value',
  MAX_VALUE = 'max_value',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  PATTERN = 'pattern',
  CUSTOM_RULE = 'custom_rule',
  CONDITIONAL = 'conditional',
}

/**
 * Entidade ChecklistItem - Itens individuais de checklist
 *
 * Funcionalidades:
 * - Diferentes tipos de entrada (boolean, texto, número, etc.)
 * - Validação automática e manual
 * - Regras condicionais
 * - Integração com objetos de infraestrutura
 * - Sistema de pontuação e peso
 * - Histórico de execuções
 * - Anexos e evidências
 */
@Entity('checklist_items')
@Index(['checklistId', 'order'])
@Index(['status', 'priority'])
@Index(['assignedTo', 'status'])
@Index(['dueDate', 'status'])
@Index(['tenantId', 'checklistId'])
export class ChecklistItem extends BaseEntity {
  // Identificação básica
  @Column({
    type: 'varchar',
    length: 500,
    nullable: false,
    comment: 'Texto do item',
  })
  text: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada',
  })
  description?: string;

  @Column({
    type: 'int',
    nullable: false,
    comment: 'Ordem de exibição',
  })
  order: number;

  // Classificação e tipo
  @Column({
    type: 'enum',
    enum: ItemType,
    default: ItemType.BOOLEAN,
    comment: 'Tipo de entrada',
  })
  type: ItemType;

  @Column({
    type: 'enum',
    enum: ItemStatus,
    default: ItemStatus.PENDING,
    comment: 'Status atual',
  })
  status: ItemStatus;

  @Column({
    type: 'enum',
    enum: ItemPriority,
    default: ItemPriority.MEDIUM,
    comment: 'Prioridade do item',
  })
  priority: ItemPriority;

  // Relacionamentos
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do checklist pai',
  })
  checklistId: string;

  @ManyToOne(() => Checklist, { eager: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'checklistId' })
  checklist?: Checklist;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário responsável',
  })
  assignedTo?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'assignedTo' })
  assignee?: User;

  // Configurações de entrada
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Opções para tipos select/multi_select',
  })
  options?: {
    value: string;
    label: string;
    description?: string;
    score?: number;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Valor padrão',
  })
  defaultValue?: any;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se o item é obrigatório',
  })
  required: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite comentários',
  })
  allowComments: boolean;

  @Column({
    type: 'boolean',
    default: true,
    comment: 'Se permite anexos',
  })
  allowAttachments: boolean;

  @Column({
    type: 'boolean',
    default: false,
    comment: 'Se permite pular o item',
  })
  allowSkip: boolean;

  // Sistema de pontuação
  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 1.0,
    comment: 'Peso do item na pontuação total',
  })
  weight: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação máxima possível',
  })
  maxScore?: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
    comment: 'Pontuação atual',
  })
  currentScore?: number;

  // Validação e regras
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Regras de validação',
  })
  validationRules?: {
    type: ValidationType;
    value: any;
    message: string;
    severity: 'warning' | 'error';
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Regras condicionais',
  })
  conditionalRules?: {
    condition: string; // Expressão lógica
    action: 'show' | 'hide' | 'require' | 'skip';
    dependsOn?: string[]; // IDs dos itens dos quais depende
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do tipo',
  })
  typeConfig?: {
    // Para tipo NUMBER
    min?: number;
    max?: number;
    step?: number;
    unit?: string;
    
    // Para tipo TEXT
    multiline?: boolean;
    placeholder?: string;
    
    // Para tipo DATE
    minDate?: Date;
    maxDate?: Date;
    
    // Para tipo FILE
    allowedTypes?: string[];
    maxSize?: number;
    maxFiles?: number;
    
    // Para tipo LOCATION
    coordinates?: { lat: number; lng: number };
    radius?: number;
    
    // Para tipo CUSTOM
    customComponent?: string;
    customProps?: Record<string, any>;
  };

  // Dados de execução
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Valor atual',
  })
  value?: any;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Comentário do executor',
  })
  comment?: string;

  @Column({
    type: 'simple-array',
    nullable: true,
    comment: 'IDs dos anexos',
  })
  attachmentIds?: string[];

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de vencimento',
  })
  dueDate?: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    comment: 'Data de conclusão',
  })
  completedAt?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do usuário que completou',
  })
  completedBy?: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'completedBy' })
  completer?: User;

  // Integração com infraestrutura
  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do objeto de infraestrutura relacionado',
  })
  relatedInfraObjectId?: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Coordenadas na planta',
  })
  location?: {
    x: number;
    y: number;
    plantaId: string;
  };

  // Histórico e auditoria
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Histórico de valores',
  })
  valueHistory?: {
    timestamp: Date;
    value: any;
    changedBy: string;
    reason?: string;
  }[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Metadados de execução',
  })
  executionMetadata?: {
    startTime?: Date;
    endTime?: Date;
    duration?: number;
    attempts?: number;
    lastAttemptAt?: Date;
    deviceInfo?: Record<string, any>;
    locationInfo?: Record<string, any>;
  };

  // Configurações avançadas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificação',
  })
  notificationSettings?: {
    onDue: boolean;
    onOverdue: boolean;
    onCompletion: boolean;
    recipients: string[];
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Tags e categorização',
  })
  tags?: string[];

  // Métodos de negócio
  get isCompleted(): boolean {
    return this.status === ItemStatus.COMPLETED;
  }

  get isOverdue(): boolean {
    if (!this.dueDate) return false;
    return new Date() > this.dueDate;
  }

  get isDueSoon(): boolean {
    if (!this.dueDate) return false;
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);
    return this.dueDate <= threeDaysFromNow;
  }

  get hasAttachments(): boolean {
    return !!(this.attachmentIds && this.attachmentIds.length > 0);
  }

  get isRequired(): boolean {
    return this.required || false;
  }

  get canBeSkipped(): boolean {
    return (this.allowSkip || false) && !(this.required || false);
  }

  get validationErrors(): string[] {
    if (!this.validationRules) return [];
    
    const errors: string[] = [];
    for (const rule of this.validationRules) {
      if (!this.validateRule(rule)) {
        errors.push(rule.message);
      }
    }
    return errors;
  }

  get isValid(): boolean {
    return this.validationErrors.length === 0;
  }

  // Métodos de atualização
  updateValue(newValue: any, updatedBy: string, reason?: string): void {
    // Adicionar ao histórico
    if (!this.valueHistory) {
      this.valueHistory = [];
    }
    
    this.valueHistory.push({
      timestamp: new Date(),
      value: this.value,
      changedBy: updatedBy,
      reason,
    });

    this.value = newValue;
    this.updatedAt = new Date();
  }

  markAsCompleted(completedBy: string, comment?: string): void {
    this.status = ItemStatus.COMPLETED;
    this.completedAt = new Date();
    this.completedBy = completedBy;
    this.comment = comment;
    this.updatedAt = new Date();
  }

  markAsFailed(failedBy: string, reason?: string): void {
    this.status = ItemStatus.FAILED;
    this.comment = reason;
    this.updatedAt = new Date();
  }

  markAsSkipped(skippedBy: string, reason?: string): void {
    this.status = ItemStatus.SKIPPED;
    this.comment = reason;
    this.updatedAt = new Date();
  }

  addAttachment(attachmentId: string): void {
    if (!this.attachmentIds) {
      this.attachmentIds = [];
    }
    if (!this.attachmentIds.includes(attachmentId)) {
      this.attachmentIds.push(attachmentId);
    }
  }

  removeAttachment(attachmentId: string): void {
    if (this.attachmentIds) {
      this.attachmentIds = this.attachmentIds.filter(id => id !== attachmentId);
    }
  }

  // Métodos de validação
  private validateRule(rule: any): boolean {
    if (!this.value) {
      return !this.required || rule.type !== ValidationType.REQUIRED;
    }

    switch (rule.type) {
      case ValidationType.REQUIRED:
        return this.value !== null && this.value !== undefined && this.value !== '';
      
      case ValidationType.MIN_VALUE:
        return typeof this.value === 'number' && this.value >= rule.value;
      
      case ValidationType.MAX_VALUE:
        return typeof this.value === 'number' && this.value <= rule.value;
      
      case ValidationType.MIN_LENGTH:
        return typeof this.value === 'string' && this.value.length >= rule.value;
      
      case ValidationType.MAX_LENGTH:
        return typeof this.value === 'string' && this.value.length <= rule.value;
      
      case ValidationType.PATTERN:
        return typeof this.value === 'string' && new RegExp(rule.value).test(this.value);
      
      default:
        return true;
    }
  }

  // Métodos de pontuação
  calculateScore(): number {
    if (!this.value) return 0;

    switch (this.type) {
      case ItemType.BOOLEAN:
        return this.value ? (this.maxScore || this.weight) : 0;
      
      case ItemType.SELECT:
        const option = this.options?.find(opt => opt.value === this.value);
        return option?.score || (this.maxScore || this.weight);
      
      case ItemType.NUMBER:
        if (typeof this.value === 'number') {
          const max = this.typeConfig?.max || 100;
          const min = this.typeConfig?.min || 0;
          const normalized = (this.value - min) / (max - min);
          return normalized * (this.maxScore || this.weight);
        }
        return 0;
      
      default:
        return this.maxScore || this.weight;
    }
  }

  updateScore(): void {
    this.currentScore = this.calculateScore();
  }
} 