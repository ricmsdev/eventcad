import { Entity, Column, OneToMany, ManyToOne, Index } from 'typeorm';
import { BaseEntity } from '../../../common/entities/base.entity';
import { EventStatus } from '../../../common/enums/event-status.enum';
import { EventoTipo } from '../../../common/enums/evento-tipo.enum';
import { User } from '../../auth/entities/user.entity';

/**
 * Entidade Evento - Core do sistema EventCAD+
 * Representa um evento com toda sua complexidade e lifecycle
 *
 * Funcionalidades:
 * - Gestão completa do ciclo de vida do evento
 * - Configurações específicas por tipo
 * - Timeline e marcos importantes
 * - Gestão de equipe e responsáveis
 * - Compliance e aprovações
 * - Métricas e relatórios
 */
@Entity('eventos')
@Index(['status', 'tenantId'])
@Index(['tipo', 'tenantId'])
@Index(['dataInicio', 'tenantId'])
export class Evento extends BaseEntity {
  // Informações básicas
  @Column({
    type: 'varchar',
    length: 200,
    nullable: false,
    comment: 'Nome/título do evento',
  })
  nome: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Descrição detalhada do evento',
  })
  descricao?: string;

  @Column({
    type: 'enum',
    enum: EventoTipo,
    nullable: false,
    comment: 'Tipo/categoria do evento',
  })
  tipo: EventoTipo;

  @Column({
    type: 'enum',
    enum: EventStatus,
    default: EventStatus.DRAFT,
    comment: 'Status atual do evento no workflow',
  })
  status: EventStatus;

  // Datas e timing
  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Data e hora de início do evento',
  })
  dataInicio: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    comment: 'Data e hora de fim do evento',
  })
  dataFim: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data limite para montagem',
  })
  dataLimiteMontagem?: Date;

  @Column({
    type: 'timestamp with time zone',
    nullable: true,
    comment: 'Data limite para desmontagem',
  })
  dataLimiteDesmontagem?: Date;

  // Local e capacidade
  @Column({
    type: 'varchar',
    length: 300,
    nullable: false,
    comment: 'Nome do local/venue do evento',
  })
  local: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Endereço completo do local',
  })
  endereco?: string;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
    comment: 'Cidade do evento',
  })
  cidade?: string;

  @Column({
    type: 'varchar',
    length: 50,
    nullable: true,
    comment: 'Estado/região do evento',
  })
  estado?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'CEP do local',
  })
  cep?: string;

  @Column({
    type: 'integer',
    nullable: false,
    comment: 'Capacidade máxima de público',
  })
  capacidadeMaxima: number;

  @Column({
    type: 'integer',
    default: 0,
    comment: 'Público esperado/estimado',
  })
  publicoEsperado: number;

  // Área e medidas
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Área total do evento em m²',
  })
  areaTotal?: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
    comment: 'Área construída em m²',
  })
  areaConstruida?: number;

  @Column({
    type: 'decimal',
    precision: 8,
    scale: 2,
    nullable: true,
    comment: 'Altura máxima utilizada em metros',
  })
  alturaMaxima?: number;

  // Responsáveis e equipe
  @Column({
    type: 'uuid',
    nullable: false,
    comment: 'ID do organizador principal',
  })
  organizadorId: string;

  @ManyToOne(() => User, { eager: false })
  organizador: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do engenheiro responsável',
  })
  engenheiroResponsavelId?: string;

  @ManyToOne(() => User, { eager: false })
  engenheiroResponsavel?: User;

  @Column({
    type: 'uuid',
    nullable: true,
    comment: 'ID do responsável pela segurança',
  })
  responsavelSegurancaId?: string;

  @ManyToOne(() => User, { eager: false })
  responsavelSeguranca?: User;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Lista de IDs da equipe técnica',
  })
  equipeTecnica?: string[];

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Lista de fornecedores e parceiros',
  })
  fornecedores?: {
    id: string;
    nome: string;
    tipo: string;
    contato?: string;
    responsabilidade?: string;
  }[];

  // Informações de contato
  @Column({
    type: 'varchar',
    length: 150,
    nullable: true,
    comment: 'Email de contato do evento',
  })
  emailContato?: string;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
    comment: 'Telefone de contato',
  })
  telefoneContato?: string;

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Website ou página do evento',
  })
  website?: string;

  // Configurações técnicas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações específicas do tipo de evento',
  })
  configuracoesTecnicas?: {
    energiaRequerida?: number; // kW
    aguaRequerida?: boolean;
    esgoto?: boolean;
    ar_condicionado?: boolean;
    aquecimento?: boolean;
    internet?: boolean;
    som?: boolean;
    iluminacao_especial?: boolean;
    estruturas_temporarias?: boolean;
    [key: string]: any;
  };

  // Compliance e aprovações
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Status das aprovações necessárias',
  })
  aprovacoes?: {
    bombeiros?: {
      status: 'pendente' | 'aprovado' | 'rejeitado';
      documento?: string;
      observacoes?: string;
      dataAprovacao?: Date;
    };
    prefeitura?: {
      status: 'pendente' | 'aprovado' | 'rejeitado';
      documento?: string;
      observacoes?: string;
      dataAprovacao?: Date;
    };
    vigilancia_sanitaria?: {
      status: 'pendente' | 'aprovado' | 'rejeitado';
      documento?: string;
      observacoes?: string;
      dataAprovacao?: Date;
    };
    engenharia?: {
      status: 'pendente' | 'aprovado' | 'rejeitado';
      responsavel?: string;
      art_crea?: string;
      observacoes?: string;
      dataAprovacao?: Date;
    };
    [key: string]: any;
  };

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Documentos anexados ao evento',
  })
  documentos?: {
    id: string;
    nome: string;
    tipo: string;
    url: string;
    tamanho: number;
    uploadedBy: string;
    uploadedAt: Date;
  }[];

  // Timeline e marcos
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Timeline com marcos importantes',
  })
  timeline?: {
    id: string;
    titulo: string;
    descricao?: string;
    data: Date;
    responsavel?: string;
    status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado';
    tipo: 'planejamento' | 'aprovacao' | 'montagem' | 'evento' | 'desmontagem';
  }[];

  // Riscos e observações
  @Column({
    type: 'varchar',
    length: 20,
    default: 'medio',
    comment: 'Nível de risco do evento',
  })
  nivelRisco: 'baixo' | 'medio' | 'alto' | 'critico';

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Análise de riscos identificados',
  })
  analiseRiscos?: {
    id: string;
    categoria: string;
    descricao: string;
    probabilidade: 'baixa' | 'media' | 'alta';
    impacto: 'baixo' | 'medio' | 'alto';
    mitigacao?: string;
    responsavel?: string;
    status: 'identificado' | 'mitigado' | 'aceito';
  }[];

  @Column({
    type: 'text',
    nullable: true,
    comment: 'Observações gerais sobre o evento',
  })
  observacoes?: string;

  // Financeiro
  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Orçamento total previsto',
  })
  orcamentoTotal?: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 2,
    nullable: true,
    comment: 'Valor já gasto/comprometido',
  })
  valorGasto?: number;

  @Column({
    type: 'varchar',
    length: 3,
    default: 'BRL',
    comment: 'Moeda utilizada no orçamento',
  })
  moeda: string;

  // Configurações de notificação
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Configurações de notificações',
  })
  notificacoes?: {
    email?: boolean;
    sms?: boolean;
    push?: boolean;
    webhook?: string;
    alertas?: {
      prazo_aprovacao?: number; // dias
      prazo_montagem?: number; // dias
      capacidade_limite?: number; // %
    };
  };

  // Métricas e estatísticas
  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Estatísticas e métricas do evento',
  })
  estatisticas?: {
    visualizacoes?: number;
    downloads_planta?: number;
    alteracoes_planta?: number;
    tempo_aprovacao?: number; // horas
    score_compliance?: number; // 0-100
    satisfacao_cliente?: number; // 1-5
    tempo_montagem_real?: number; // horas
    tempo_desmontagem_real?: number; // horas
  };

  /**
   * Calcula a duração total do evento em horas
   */
  get duracaoHoras(): number {
    if (!this.dataInicio || !this.dataFim) return 0;
    const diff = this.dataFim.getTime() - this.dataInicio.getTime();
    return Math.round(diff / (1000 * 60 * 60));
  }

  /**
   * Calcula quantos dias faltam para o início do evento
   */
  get diasParaInicio(): number {
    if (!this.dataInicio) return 0;
    const diff = this.dataInicio.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * Verifica se o evento está atrasado
   */
  get estaAtrasado(): boolean {
    return this.diasParaInicio < 0 && this.status !== EventStatus.COMPLETED;
  }

  /**
   * Calcula o percentual de ocupação previsto
   */
  get percentualOcupacao(): number {
    if (!this.capacidadeMaxima || !this.publicoEsperado) return 0;
    return Math.round((this.publicoEsperado / this.capacidadeMaxima) * 100);
  }

  /**
   * Verifica se todas as aprovações necessárias foram obtidas
   */
  get todasAprovacoesConcluidas(): boolean {
    if (!this.aprovacoes) return false;

    return Object.values(this.aprovacoes).every(
      (aprovacao) => aprovacao?.status === 'aprovado',
    );
  }

  /**
   * Calcula o percentual do orçamento já utilizado
   */
  get percentualOrcamentoUtilizado(): number {
    if (!this.orcamentoTotal || !this.valorGasto) return 0;
    return Math.round((this.valorGasto / this.orcamentoTotal) * 100);
  }

  /**
   * Adiciona um marco na timeline
   */
  adicionarMarcoTimeline(marco: {
    titulo: string;
    descricao?: string;
    data: Date;
    responsavel?: string;
    tipo: 'planejamento' | 'aprovacao' | 'montagem' | 'evento' | 'desmontagem';
  }): void {
    if (!this.timeline) {
      this.timeline = [];
    }

    this.timeline.push({
      id: `marco_${Date.now()}`,
      ...marco,
      status: 'pendente',
    });

    // Ordena timeline por data
    this.timeline.sort(
      (a, b) => new Date(a.data).getTime() - new Date(b.data).getTime(),
    );
  }

  /**
   * Atualiza status de um marco na timeline
   */
  atualizarMarcoTimeline(
    marcoId: string,
    status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado',
  ): void {
    if (!this.timeline) return;

    const marco = this.timeline.find((m) => m.id === marcoId);
    if (marco) {
      marco.status = status;
    }
  }

  /**
   * Adiciona um risco à análise
   */
  adicionarRisco(risco: {
    categoria: string;
    descricao: string;
    probabilidade: 'baixa' | 'media' | 'alta';
    impacto: 'baixo' | 'medio' | 'alto';
    mitigacao?: string;
    responsavel?: string;
  }): void {
    if (!this.analiseRiscos) {
      this.analiseRiscos = [];
    }

    this.analiseRiscos.push({
      id: `risco_${Date.now()}`,
      ...risco,
      status: 'identificado',
    });
  }

  /**
   * Atualiza configurações técnicas
   */
  atualizarConfiguracoesTecnicas(config: Record<string, any>): void {
    this.configuracoesTecnicas = {
      ...this.configuracoesTecnicas,
      ...config,
    };
  }

  /**
   * Adiciona documento ao evento
   */
  adicionarDocumento(documento: {
    nome: string;
    tipo: string;
    url: string;
    tamanho: number;
    uploadedBy: string;
  }): void {
    if (!this.documentos) {
      this.documentos = [];
    }

    this.documentos.push({
      id: `doc_${Date.now()}`,
      ...documento,
      uploadedAt: new Date(),
    });
  }
}
