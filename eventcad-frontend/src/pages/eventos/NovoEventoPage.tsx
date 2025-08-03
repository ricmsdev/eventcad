import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useParams } from 'react-router-dom';
import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import {
  Calendar,
  MapPin,
  Settings,
  FileText,
  Building,
  Droplets,
  Wifi,
  Volume2,
  Lightbulb,
  HardHat,
  CheckCircle,
  ArrowLeft,
  Save
} from 'lucide-react';
import { EventoTipo } from '@/types';
import { apiService } from '@/services/api';

// Schema de validação robusto
const eventoSchema = z.object({
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  descricao: z.string().optional(),
  tipo: z.nativeEnum(EventoTipo),
  
  // Datas principais
  dataInicio: z.string().min(1, 'Data de início é obrigatória'),
  dataFim: z.string().min(1, 'Data de fim é obrigatória'),
  
  // Timeline de montagem/desmontagem
  dataInicioMontagem: z.string().optional(),
  dataFimMontagem: z.string().optional(),
  dataInicioDesmontagem: z.string().optional(),
  dataFimDesmontagem: z.string().optional(),
  
  // Local e capacidade
  local: z.string().min(3, 'Local é obrigatório'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  cep: z.string().optional(),
  capacidadeMaxima: z.number().min(1, 'Capacidade deve ser maior que 0'),
  publicoEsperado: z.number().min(0, 'Público esperado deve ser 0 ou maior'),
  
  // Área e medidas
  areaTotal: z.number().optional(),
  areaConstruida: z.number().optional(),
  alturaMaxima: z.number().optional(),
  
  // Contato
  emailContato: z.string().email('Email inválido').optional(),
  telefoneContato: z.string().optional(),
  website: z.string().url('URL inválida').optional(),
  
  // Configurações técnicas
  energiaRequerida: z.number().optional(),
  aguaRequerida: z.boolean().default(false),
  esgoto: z.boolean().default(false),
  arCondicionado: z.boolean().default(false),
  aquecimento: z.boolean().default(false),
  internet: z.boolean().default(false),
  som: z.boolean().default(false),
  iluminacaoEspecial: z.boolean().default(false),
  estruturasTemporarias: z.boolean().default(false),
  
  // Observações
  observacoes: z.string().optional(),
});

type EventoFormData = z.infer<typeof eventoSchema>;

export function NovoEventoPage() {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditMode = Boolean(id);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EventoFormData>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      tipo: EventoTipo.FEIRA_COMERCIAL,
      aguaRequerida: false,
      esgoto: false,
      arCondicionado: false,
      aquecimento: false,
      internet: false,
      som: false,
      iluminacaoEspecial: false,
      estruturasTemporarias: false,
    },
  });

  // Carregar dados do evento se for edição
  useEffect(() => {
    if (isEditMode && id) {
      setIsLoading(true);
      apiService.getEvento(id)
        .then(res => {
          const evento = res.data;
          reset({
            nome: evento.nome,
            descricao: evento.descricao,
            tipo: evento.tipo,
            dataInicio: evento.dataInicio,
            dataFim: evento.dataFim,
            local: evento.local,
            endereco: evento.endereco,
            capacidadeMaxima: evento.capacidadeMaxima,
            publicoEsperado: evento.publicoEsperado,
            observacoes: evento.observacoes,
            // Os demais campos do formulário ficam em branco
          });
        })
        .catch(() => {
          toast.error('Erro ao carregar evento para edição');
          navigate('/eventos');
        })
        .finally(() => setIsLoading(false));
    }
  }, [isEditMode, id, reset, navigate]);

  const onSubmit = async (data: EventoFormData) => {
    setIsLoading(true);
    try {
      // Mapeamento explícito de todos os campos usados
      const payload = {
        nome: data.nome,
        descricao: data.descricao,
        tipo: data.tipo,
        local: data.local,
        endereco: data.endereco,
        cidade: data.cidade,
        estado: data.estado,
        cep: data.cep,
        capacidadeMaxima: data.capacidadeMaxima,
        publicoEsperado: data.publicoEsperado,
        areaTotal: data.areaTotal,
        areaConstruida: data.areaConstruida,
        alturaMaxima: data.alturaMaxima,
        emailContato: data.emailContato,
        telefoneContato: data.telefoneContato,
        website: data.website,
        observacoes: data.observacoes,
        dataInicio: data.dataInicio,
        dataFim: data.dataFim,
        // Configurações técnicas como objeto
        configuracoesTecnicas: {
          energiaRequerida: data.energiaRequerida,
          aguaRequerida: data.aguaRequerida,
          esgoto: data.esgoto,
          ar_condicionado: data.arCondicionado,
          aquecimento: data.aquecimento,
          internet: data.internet,
          som: data.som,
          iluminacao_especial: data.iluminacaoEspecial,
          estruturas_temporarias: data.estruturasTemporarias,
        },
      };
      
  
      if (isEditMode && id) {
        await apiService.updateEvento(id, payload);
        toast.success('Evento atualizado com sucesso!');
      } else {
        await apiService.createEvento(payload);
        toast.success('Evento criado com sucesso!');
      }
      navigate('/eventos');
    } catch (error: any) {
      toast.error(
        error.response?.data?.message ||
        (isEditMode ? 'Erro ao atualizar evento' : 'Erro ao criar evento')
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  

  const steps = [
    { id: 1, title: 'Informações Básicas', icon: FileText },
    { id: 2, title: 'Local e Capacidade', icon: MapPin },
    { id: 3, title: 'Timeline', icon: Calendar },
    { id: 4, title: 'Configurações Técnicas', icon: Settings },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-h-screen bg-gray-50 py-8"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/eventos')}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{isEditMode ? 'Editar Evento' : 'Novo Evento'}</h1>
                <p className="text-gray-600">{isEditMode ? 'Edite os dados do evento' : 'Crie um novo evento no EventCAD+'}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Settings className="w-4 h-4" />
                <span>{showAdvanced ? 'Modo Simples' : 'Modo Avançado'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === step.id;
              const isCompleted = activeStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center">
                  <motion.div
                    initial={false}
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isActive ? '#3B82F6' : isCompleted ? '#10B981' : '#E5E7EB',
                    }}
                    className="flex items-center justify-center w-10 h-10 rounded-full text-white font-medium"
                  >
                    {isCompleted ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </motion.div>
                  <div className="ml-3">
                    <p className={`text-sm font-medium ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-0.5 mx-4 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Step 1: Informações Básicas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 1 ? 1 : 0.5, x: activeStep >= 1 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <FileText className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Informações Básicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Evento *
                </label>
                <input
                  {...register('nome')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Ex: Feira de Tecnologia 2025"
                />
                {errors.nome && (
                  <p className="mt-1 text-sm text-red-600">{errors.nome.message}</p>
                )}
              </div>

              {/* Tipo */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Evento *
                </label>
                <select {...register('tipo')} className="input-eventcad">
                  {Object.entries(EventoTipo).map(([key, value]) => (
                    <option key={key} value={value}>
                      {key.replace(/_/g, ' ')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Descrição */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Descrição
                </label>
                <textarea
                  {...register('descricao')}
                  rows={3}
                  className="input-eventcad"
                  placeholder="Descreva o evento..."
                />
              </div>
            </div>
          </motion.div>

          {/* Step 2: Local e Capacidade */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 2 ? 1 : 0.5, x: activeStep >= 2 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <MapPin className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Local e Capacidade</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Local */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Local/Venue *
                </label>
                <input
                  {...register('local')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Ex: Centro de Convenções"
                />
                {errors.local && (
                  <p className="mt-1 text-sm text-red-600">{errors.local.message}</p>
                )}
              </div>

              {/* Endereço */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço Completo
                </label>
                <input
                  {...register('endereco')}
                  type="text"
                  className="input-eventcad"
                  placeholder="Rua, número, bairro..."
                />
              </div>

              {/* Cidade, Estado, CEP */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cidade
                </label>
                <input
                  {...register('cidade')}
                  type="text"
                  className="input-eventcad"
                  placeholder="São Paulo"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <input
                  {...register('estado')}
                  type="text"
                  className="input-eventcad"
                  placeholder="SP"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CEP
                </label>
                <input
                  {...register('cep')}
                  type="text"
                  className="input-eventcad"
                  placeholder="01234-567"
                />
              </div>

              {/* Capacidade */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacidade Máxima *
                </label>
                <input
                  {...register('capacidadeMaxima', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="1000"
                />
                {errors.capacidadeMaxima && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacidadeMaxima.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Público Esperado
                </label>
                <input
                  {...register('publicoEsperado', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="800"
                />
              </div>

              {/* Área */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Total (m²)
                </label>
                <input
                  {...register('areaTotal', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="5000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Área Construída (m²)
                </label>
                <input
                  {...register('areaConstruida', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="3000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Altura Máxima (m)
                </label>
                <input
                  {...register('alturaMaxima', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="8"
                />
              </div>
            </div>
          </motion.div>

          {/* Step 3: Timeline */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 3 ? 1 : 0.5, x: activeStep >= 3 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Calendar className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Timeline do Evento</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Datas principais */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Início *
                </label>
                <input
                  {...register('dataInicio')}
                  type="datetime-local"
                  className="input-eventcad"
                />
                {errors.dataInicio && (
                  <p className="mt-1 text-sm text-red-600">{errors.dataInicio.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data de Fim *
                </label>
                <input
                  {...register('dataFim')}
                  type="datetime-local"
                  className="input-eventcad"
                />
                {errors.dataFim && (
                  <p className="mt-1 text-sm text-red-600">{errors.dataFim.message}</p>
                )}
              </div>

              {/* Montagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Início da Montagem
                </label>
                <input
                  {...register('dataInicioMontagem')}
                  type="datetime-local"
                  className="input-eventcad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fim da Montagem
                </label>
                <input
                  {...register('dataFimMontagem')}
                  type="datetime-local"
                  className="input-eventcad"
                />
              </div>

              {/* Desmontagem */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Início da Desmontagem
                </label>
                <input
                  {...register('dataInicioDesmontagem')}
                  type="datetime-local"
                  className="input-eventcad"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fim da Desmontagem
                </label>
                <input
                  {...register('dataFimDesmontagem')}
                  type="datetime-local"
                  className="input-eventcad"
                />
              </div>
            </div>

            {/* Timeline Visual */}
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Timeline Visual</h3>
              <div className="flex items-center space-x-2 text-xs text-gray-600">
                <div className="flex-1 bg-blue-200 h-2 rounded-full relative">
                  <div className="absolute inset-0 bg-blue-500 rounded-full" style={{ width: '60%' }} />
                  <div className="absolute -top-6 left-0 text-center w-20">
                    <div className="bg-blue-500 text-white px-2 py-1 rounded">Montagem</div>
                  </div>
                  <div className="absolute -top-6 left-1/3 text-center w-20">
                    <div className="bg-green-500 text-white px-2 py-1 rounded">Evento</div>
                  </div>
                  <div className="absolute -top-6 right-0 text-center w-20">
                    <div className="bg-red-500 text-white px-2 py-1 rounded">Desmontagem</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Step 4: Configurações Técnicas */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: activeStep >= 4 ? 1 : 0.5, x: activeStep >= 4 ? 0 : -20 }}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Settings className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Configurações Técnicas</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Energia */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Energia Requerida (kW)
                </label>
                <input
                  {...register('energiaRequerida', { valueAsNumber: true })}
                  type="number"
                  className="input-eventcad"
                  placeholder="100"
                />
              </div>

              {/* Checkboxes de infraestrutura */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Infraestrutura Necessária
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { key: 'aguaRequerida', label: 'Água', icon: Droplets },
                    { key: 'esgoto', label: 'Esgoto', icon: Droplets },
                    { key: 'arCondicionado', label: 'Ar Condicionado', icon: Building },
                    { key: 'aquecimento', label: 'Aquecimento', icon: Building },
                    { key: 'internet', label: 'Internet', icon: Wifi },
                    { key: 'som', label: 'Sistema de Som', icon: Volume2 },
                    { key: 'iluminacaoEspecial', label: 'Iluminação Especial', icon: Lightbulb },
                    { key: 'estruturasTemporarias', label: 'Estruturas Temporárias', icon: HardHat },
                  ].map(({ key, label, icon: Icon }) => (
                    <label key={key} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        {...register(key as keyof EventoFormData)}
                        type="checkbox"
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Contato */}
              <div className="md:col-span-2">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Informações de Contato</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de Contato
                    </label>
                    <input
                      {...register('emailContato')}
                      type="email"
                      className="input-eventcad"
                      placeholder="contato@evento.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Telefone
                    </label>
                    <input
                      {...register('telefoneContato')}
                      type="tel"
                      className="input-eventcad"
                      placeholder="(11) 99999-9999"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Website
                    </label>
                    <input
                      {...register('website')}
                      type="url"
                      className="input-eventcad"
                      placeholder="https://evento.com"
                    />
                  </div>
                </div>
              </div>

              {/* Observações */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observações Adicionais
                </label>
                <textarea
                  {...register('observacoes')}
                  rows={4}
                  className="input-eventcad"
                  placeholder="Observações importantes sobre o evento..."
                />
              </div>
            </div>
          </motion.div>

          {/* Botões de navegação */}
          <div className="flex items-center justify-between pt-6">
            <button
              type="button"
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className="btn-secondary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Anterior
            </button>

            <div className="flex items-center space-x-4">
              {activeStep < steps.length ? (
                <button
                  type="button"
                  onClick={() => setActiveStep(activeStep + 1)}
                  className="btn-primary"
                >
                  Próximo
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary flex items-center space-x-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{isLoading ? (isEditMode ? 'Salvando...' : 'Criando...') : (isEditMode ? 'Salvar Alterações' : 'Criar Evento')}</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </motion.div>
  );
}