import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User,
  Shield,
  Key,
  Bell,
  Eye,
  EyeOff,
  Save,
  Activity,
  FileText,
  Zap,
  Package,
  BarChart3,
  Camera,
  Calendar
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import { apiService } from '@/services/api';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { cn } from '@/utils/cn';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const profileSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  endereco: z.string().optional(),
  bio: z.string().max(500, 'Bio não pode ter mais de 500 caracteres').optional()
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Senhas não coincidem",
  path: ["confirmPassword"]
});

const notificationSchema = z.object({
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
  eventReminders: z.boolean(),
  aiJobNotifications: z.boolean(),
  systemAlerts: z.boolean()
});

type ProfileForm = z.infer<typeof profileSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;
type NotificationForm = z.infer<typeof notificationSchema>;

export function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'password' | 'notifications' | 'activity'>('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Form para informações do perfil
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nome: user?.nome || '',
      email: user?.email || '',
      telefone: user?.telefone || '',
      endereco: user?.endereco || '',
      bio: user?.bio || ''
    }
  });

  // Form para alteração de senha
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema)
  });

  // Form para notificações
  const notificationForm = useForm<NotificationForm>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      emailNotifications: true,
      pushNotifications: true,
      eventReminders: true,
      aiJobNotifications: true,
      systemAlerts: true
    }
  });

  // Buscar estatísticas do usuário
  const { data: userStats } = useQuery({
    queryKey: ['user-stats'],
    queryFn: () => apiService.getUserStats(),
  });

  // Buscar atividades recentes
  const { data: recentActivity } = useQuery({
    queryKey: ['user-activity'],
    queryFn: () => apiService.getUserActivity(),
  });

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileForm) => apiService.updateProfile(data),
    onSuccess: () => {
      toast.success('Perfil atualizado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
      toast.error('Erro ao atualizar perfil');
    }
  });

  // Mutation para alterar senha
  const changePasswordMutation = useMutation({
    mutationFn: (data: PasswordForm) => apiService.changePassword(data),
    onSuccess: () => {
      toast.success('Senha alterada com sucesso!');
      passwordForm.reset();
    },
    onError: () => {
      toast.error('Erro ao alterar senha');
    }
  });

  // Mutation para atualizar notificações
  const updateNotificationsMutation = useMutation({
    mutationFn: (data: NotificationForm) => apiService.updateNotifications(data),
    onSuccess: () => {
      toast.success('Configurações de notificação atualizadas!');
    },
    onError: () => {
      toast.error('Erro ao atualizar notificações');
    }
  });

  const onSubmitProfile = (data: ProfileForm) => {
    updateProfileMutation.mutate(data);
  };

  const onSubmitPassword = (data: PasswordForm) => {
    changePasswordMutation.mutate(data);
  };

  const onSubmitNotifications = (data: NotificationForm) => {
    updateNotificationsMutation.mutate(data);
  };

  const tabs = [
    { id: 'profile', label: 'Perfil', icon: User },
    { id: 'password', label: 'Senha', icon: Key },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'activity', label: 'Atividade', icon: Activity }
  ] as const;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600">Gerencie suas informações pessoais e configurações</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar com informações básicas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card do usuário */}
          <div className="card-eventcad text-center">
            <div className="relative inline-block mb-4">
              <div className="w-24 h-24 bg-gradient-to-br from-eventcad-500 to-eventcad-700 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {user?.nome?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50">
                <Camera className="h-4 w-4 text-gray-600" />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900">{user?.nome}</h3>
            <p className="text-gray-600">{user?.email}</p>
            <div className="mt-3 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-eventcad-100 text-eventcad-800">
              <Shield className="h-3 w-3 mr-1" />
              {user?.role || 'Usuário'}
            </div>
          </div>

          {/* Estatísticas rápidas */}
          {userStats && userStats.data && (
            <div className="card-eventcad">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">Estatísticas</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Eventos Criados
                  </span>
                  <span className="text-sm font-medium">{userStats.data.eventosCreated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    Plantas Enviadas
                  </span>
                  <span className="text-sm font-medium">{userStats.data.plantasUploaded || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Zap className="h-4 w-4" />
                    Jobs de IA
                  </span>
                  <span className="text-sm font-medium">{userStats.data.aiJobsCreated || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 flex items-center gap-1">
                    <Package className="h-4 w-4" />
                    Objetos Criados
                  </span>
                  <span className="text-sm font-medium">{userStats.data.objectsCreated || 0}</span>
                </div>
              </div>
            </div>
          )}

          {/* Navegação das abas */}
          <nav className="card-eventcad">
            <div className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-colors",
                      activeTab === tab.id
                        ? "bg-eventcad-100 text-eventcad-700"
                        : "text-gray-600 hover:bg-gray-100"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </nav>
        </div>

        {/* Conteúdo principal */}
        <div className="lg:col-span-3">
          {/* Tab: Perfil */}
          {activeTab === 'profile' && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <User className="h-5 w-5" />
                Informações Pessoais
              </h3>

              <form onSubmit={profileForm.handleSubmit(onSubmitProfile)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome Completo *
                    </label>
                    <input
                      type="text"
                      className={cn("input-eventcad", profileForm.formState.errors.nome && "border-red-300")}
                      {...profileForm.register('nome')}
                    />
                    {profileForm.formState.errors.nome && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.nome.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <input
                      type="email"
                      className={cn("input-eventcad", profileForm.formState.errors.email && "border-red-300")}
                      {...profileForm.register('email')}
                    />
                    {profileForm.formState.errors.email && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefone
                    </label>
                    <input
                      type="tel"
                      className="input-eventcad"
                      placeholder="(11) 99999-9999"
                      {...profileForm.register('telefone')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Endereço
                    </label>
                    <input
                      type="text"
                      className="input-eventcad"
                      placeholder="Cidade, Estado"
                      {...profileForm.register('endereco')}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bio
                    </label>
                    <textarea
                      rows={4}
                      className="input-eventcad"
                      placeholder="Conte um pouco sobre você..."
                      {...profileForm.register('bio')}
                    />
                    {profileForm.formState.errors.bio && (
                      <p className="mt-1 text-sm text-red-600">{profileForm.formState.errors.bio.message}</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {updateProfileMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {updateProfileMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Senha */}
          {activeTab === 'password' && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Alterar Senha
              </h3>

              <form onSubmit={passwordForm.handleSubmit(onSubmitPassword)} className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Senha Atual *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        className={cn("input-eventcad pr-10", passwordForm.formState.errors.currentPassword && "border-red-300")}
                        {...passwordForm.register('currentPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.currentPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nova Senha *
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        className={cn("input-eventcad pr-10", passwordForm.formState.errors.newPassword && "border-red-300")}
                        {...passwordForm.register('newPassword')}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.newPassword.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirmar Nova Senha *
                    </label>
                    <input
                      type="password"
                      className={cn("input-eventcad", passwordForm.formState.errors.confirmPassword && "border-red-300")}
                      {...passwordForm.register('confirmPassword')}
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">Requisitos da Senha</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Mínimo de 8 caracteres</li>
                    <li>• Pelo menos uma letra maiúscula</li>
                    <li>• Pelo menos uma letra minúscula</li>
                    <li>• Pelo menos um número</li>
                    <li>• Pelo menos um caractere especial</li>
                  </ul>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={changePasswordMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {changePasswordMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Key className="h-4 w-4" />
                    )}
                    {changePasswordMutation.isPending ? 'Alterando...' : 'Alterar Senha'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Notificações */}
          {activeTab === 'notifications' && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Configurações de Notificação
              </h3>

              <form onSubmit={notificationForm.handleSubmit(onSubmitNotifications)} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificações por Email</h4>
                      <p className="text-sm text-gray-500">Receber notificações importantes por email</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-eventcad-600 focus:ring-eventcad-500"
                      {...notificationForm.register('emailNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Notificações Push</h4>
                      <p className="text-sm text-gray-500">Receber notificações no navegador</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-eventcad-600 focus:ring-eventcad-500"
                      {...notificationForm.register('pushNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Lembretes de Eventos</h4>
                      <p className="text-sm text-gray-500">Ser notificado sobre eventos próximos</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-eventcad-600 focus:ring-eventcad-500"
                      {...notificationForm.register('eventReminders')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Jobs de IA</h4>
                      <p className="text-sm text-gray-500">Notificações sobre conclusão de processamentos</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-eventcad-600 focus:ring-eventcad-500"
                      {...notificationForm.register('aiJobNotifications')}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">Alertas do Sistema</h4>
                      <p className="text-sm text-gray-500">Notificações sobre manutenção e atualizações</p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-eventcad-600 focus:ring-eventcad-500"
                      {...notificationForm.register('systemAlerts')}
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={updateNotificationsMutation.isPending}
                    className="btn-primary flex items-center gap-2"
                  >
                    {updateNotificationsMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {updateNotificationsMutation.isPending ? 'Salvando...' : 'Salvar Configurações'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Tab: Atividade */}
          {activeTab === 'activity' && (
            <div className="card-eventcad">
              <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Atividade Recente
              </h3>

              <div className="space-y-4">
                {recentActivity && recentActivity.data && recentActivity.data.length > 0 ? (
                  recentActivity.data.map((activity: any, index: number) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-8 h-8 bg-eventcad-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-eventcad-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {format(new Date(activity.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <BarChart3 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhuma atividade recente</h4>
                    <p className="text-gray-600">Suas atividades aparecerão aqui conforme você usar o sistema.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}