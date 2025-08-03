import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  ArrowLeft, 
  Save,
  AlertTriangle,
  Package,
  MapPin,
  Settings,
  Zap
} from 'lucide-react';
import { apiService } from '@/services/api';
import { ObjectCategory, ObjectType, CriticalityLevel } from '@/types';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';

const infraObjectSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  description: z.string().optional(),
  objectCategory: z.nativeEnum(ObjectCategory),
  objectType: z.nativeEnum(ObjectType),
  criticality: z.nativeEnum(CriticalityLevel),
  plantaId: z.string().min(1, 'Planta é obrigatória'),
  position: z.object({
    x: z.number().min(0, 'Posição X deve ser positiva'),
    y: z.number().min(0, 'Posição Y deve ser positiva'),
    z: z.number().optional()
  }),
  dimensions: z.object({
    width: z.number().min(0, 'Largura deve ser positiva').optional(),
    height: z.number().min(0, 'Altura deve ser positiva').optional(),
    depth: z.number().min(0, 'Profundidade deve ser positiva').optional()
  }).optional(),
  attributes: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(1).optional()
});

type InfraObjectForm = z.infer<typeof infraObjectSchema>;

const categoryOptions = [
  { value: ObjectCategory.FIRE_SAFETY, label: 'Segurança contra Incêndio' },
  { value: ObjectCategory.ELECTRICAL, label: 'Elétrico' },
  { value: ObjectCategory.PLUMBING, label: 'Hidráulico' },
  { value: ObjectCategory.ACCESSIBILITY, label: 'Acessibilidade' },
  { value: ObjectCategory.ARCHITECTURAL, label: 'Arquitetônico' },
  { value: ObjectCategory.FURNITURE, label: 'Mobiliário' },
  { value: ObjectCategory.ANNOTATIONS, label: 'Anotações' }
];

const typesByCategory = {
  [ObjectCategory.FIRE_SAFETY]: [
    { value: ObjectType.FIRE_EXTINGUISHER, label: 'Extintor' },
    { value: ObjectType.EMERGENCY_EXIT, label: 'Saída de Emergência' },
    { value: ObjectType.SPRINKLER, label: 'Sprinkler' },
    { value: ObjectType.SMOKE_DETECTOR, label: 'Detector de Fumaça' },
    { value: ObjectType.HYDRANT, label: 'Hidrante' }
  ],
  [ObjectCategory.ELECTRICAL]: [
    { value: ObjectType.OUTLET, label: 'Tomada' },
    { value: ObjectType.SWITCH, label: 'Interruptor' },
    { value: ObjectType.ELECTRICAL_PANEL, label: 'Quadro Elétrico' },
    { value: ObjectType.LIGHT_FIXTURE, label: 'Luminária' },
    { value: ObjectType.EMERGENCY_LIGHT, label: 'Luz de Emergência' }
  ],
  [ObjectCategory.PLUMBING]: [
    { value: ObjectType.TOILET, label: 'Vaso Sanitário' },
    { value: ObjectType.SINK, label: 'Pia' },
    { value: ObjectType.SHOWER, label: 'Chuveiro' },
    { value: ObjectType.DRAIN, label: 'Ralo' }
  ],
  [ObjectCategory.ACCESSIBILITY]: [
    { value: ObjectType.ACCESSIBLE_RAMP, label: 'Rampa Acessível' },
    { value: ObjectType.ACCESSIBLE_PARKING, label: 'Vaga Acessível' },
    { value: ObjectType.GRAB_BAR, label: 'Barra de Apoio' },
    { value: ObjectType.TACTILE_PAVING, label: 'Piso Tátil' }
  ],
  [ObjectCategory.ARCHITECTURAL]: [
    { value: ObjectType.DOOR, label: 'Porta' },
    { value: ObjectType.WINDOW, label: 'Janela' },
    { value: ObjectType.WALL, label: 'Parede' },
    { value: ObjectType.STAIR, label: 'Escada' },
    { value: ObjectType.ELEVATOR, label: 'Elevador' }
  ],
  [ObjectCategory.FURNITURE]: [
    { value: ObjectType.TABLE, label: 'Mesa' },
    { value: ObjectType.CHAIR, label: 'Cadeira' },
    { value: ObjectType.STAGE, label: 'Palco' },
    { value: ObjectType.BOOTH, label: 'Estande' }
  ],
  [ObjectCategory.ANNOTATIONS]: [
    { value: ObjectType.DIMENSION, label: 'Dimensão' },
    { value: ObjectType.TEXT_LABEL, label: 'Etiqueta de Texto' },
    { value: ObjectType.ROOM_NUMBER, label: 'Número do Ambiente' },
    { value: ObjectType.NORTH_ARROW, label: 'Indicação do Norte' }
  ]
};

const criticalityOptions = [
  { value: CriticalityLevel.LOW, label: 'Baixo', color: 'bg-gray-100 text-gray-800' },
  { value: CriticalityLevel.MEDIUM, label: 'Médio', color: 'bg-yellow-100 text-yellow-800' },
  { value: CriticalityLevel.HIGH, label: 'Alto', color: 'bg-orange-100 text-orange-800' },
  { value: CriticalityLevel.CRITICAL, label: 'Crítico', color: 'bg-red-100 text-red-800' }
];

export function NovoInfraObjectPage() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors }
  } = useForm<InfraObjectForm>({
    resolver: zodResolver(infraObjectSchema),
    defaultValues: {
      position: { x: 0, y: 0 },
      dimensions: { width: 1, height: 1 },
      criticality: CriticalityLevel.MEDIUM,
      confidence: 1.0
    }
  });

  const selectedCategory = watch('objectCategory');

  // Buscar plantas disponíveis
  const { data: plantas } = useQuery({
    queryKey: ['plantas'],
    queryFn: () => apiService.getPlantas({ limit: 100 })
  });

  const onSubmit = async (data: InfraObjectForm) => {
    setIsSubmitting(true);
    try {
      // Converter para CreateInfraObjectForm
      const createData = {
        ...data,
        confidence: data.confidence || 0.8, // Valor padrão se não fornecido
        geometry: {
          boundingBox: {
            x: data.position.x,
            y: data.position.y,
            width: data.dimensions?.width || 0,
            height: data.dimensions?.height || 0
          },
          center: {
            x: data.position.x + (data.dimensions?.width || 0) / 2,
            y: data.position.y + (data.dimensions?.height || 0) / 2
          }
        },
        properties: data.attributes || {}
      };
      
      await apiService.createInfraObject(createData);
      toast.success('Objeto criado com sucesso!');
      navigate('/infra-objects');
    } catch (error) {
      toast.error('Erro ao criar objeto');
      console.error('Erro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTypes = selectedCategory ? typesByCategory[selectedCategory] || [] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          to="/infra-objects"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Novo Objeto de Infraestrutura</h1>
          <p className="text-gray-600">Adicione um novo objeto à infraestrutura</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário Principal */}
        <div className="lg:col-span-2 space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Informações Básicas
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome do Objeto *
                  </label>
                  <input
                    type="text"
                    className={cn("input-eventcad", errors.name && "border-red-300")}
                    placeholder="Ex: Extintor PQS 001"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Planta *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.plantaId && "border-red-300")}
                    {...register('plantaId')}
                  >
                    <option value="">Selecione uma planta</option>
                    {plantas?.data?.data?.map((planta) => (
                      <option key={planta.id} value={planta.id}>
                        {planta.nome}
                      </option>
                    ))}
                  </select>
                  {errors.plantaId && (
                    <p className="mt-1 text-sm text-red-600">{errors.plantaId.message}</p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    rows={3}
                    className="input-eventcad"
                    placeholder="Descrição detalhada do objeto..."
                    {...register('description')}
                  />
                </div>
              </div>
            </div>

            {/* Classificação */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Classificação
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.objectCategory && "border-red-300")}
                    {...register('objectCategory')}
                    onChange={(e) => {
                      setValue('objectCategory', e.target.value as ObjectCategory);
                      setValue('objectType', '' as ObjectType); // Reset type when category changes
                    }}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categoryOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.objectCategory && (
                    <p className="mt-1 text-sm text-red-600">{errors.objectCategory.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.objectType && "border-red-300")}
                    {...register('objectType')}
                    disabled={!selectedCategory}
                  >
                    <option value="">Selecione um tipo</option>
                    {availableTypes.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.objectType && (
                    <p className="mt-1 text-sm text-red-600">{errors.objectType.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Criticidade *
                  </label>
                  <select
                    className={cn("input-eventcad", errors.criticality && "border-red-300")}
                    {...register('criticality')}
                  >
                    {criticalityOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  {errors.criticality && (
                    <p className="mt-1 text-sm text-red-600">{errors.criticality.message}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Posição e Dimensões */}
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Posição e Dimensões
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição X *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className={cn("input-eventcad", errors.position?.x && "border-red-300")}
                    {...register('position.x', { valueAsNumber: true })}
                  />
                  {errors.position?.x && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.x.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição Y *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className={cn("input-eventcad", errors.position?.y && "border-red-300")}
                    {...register('position.y', { valueAsNumber: true })}
                  />
                  {errors.position?.y && (
                    <p className="mt-1 text-sm text-red-600">{errors.position.y.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Posição Z
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-eventcad"
                    {...register('position.z', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Largura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-eventcad"
                    {...register('dimensions.width', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Altura
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-eventcad"
                    {...register('dimensions.height', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Profundidade
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    className="input-eventcad"
                    {...register('dimensions.depth', { valueAsNumber: true })}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confiança da IA
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    className="input-eventcad"
                    {...register('confidence', { valueAsNumber: true })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Link
                to="/infra-objects"
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancelar
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex items-center gap-2"
              >
                {isSubmitting ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? 'Salvando...' : 'Salvar Objeto'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar com Dicas */}
        <div className="space-y-6">
          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Dicas Importantes
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p>• Posicione objetos com precisão para garantir conformidade</p>
              <p>• Use criticidade alta para objetos de segurança essenciais</p>
              <p>• Verifique se não há conflitos com outros objetos</p>
              <p>• Adicione descrições detalhadas para facilitar manutenção</p>
            </div>
          </div>

          <div className="card-eventcad">
            <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Detecção por IA
            </h4>
            <div className="space-y-3 text-sm text-gray-600">
              <p>Objetos podem ser detectados automaticamente pela IA em plantas existentes.</p>
              <p>A confiança indica a precisão da detecção automática.</p>
              <p>Revise e ajuste posições quando necessário.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}