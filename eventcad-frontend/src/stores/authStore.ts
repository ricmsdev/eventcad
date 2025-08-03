import { create } from 'zustand';
import { User, LoginForm, RegisterForm } from '@/types';
import apiService from '@/services/api';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (credentials: LoginForm) => Promise<void>;
  register: (userData: RegisterForm) => Promise<void>;
  logout: () => void;
  clearAuth: () => void;
  getProfile: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (credentials: LoginForm) => {
    console.log('🔍 Debug - Iniciando login com:', credentials.email);
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.login(credentials);
      console.log('🔍 Debug - Resposta do login:', response.data);
      const { user, accessToken, refreshToken } = response.data;
      
      // Salvar tokens no localStorage
      console.log('🔍 Debug - Salvando tokens no localStorage');
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      console.log('🔍 Debug - Tokens salvos. access_token:', !!accessToken);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
      console.log('🔍 Debug - Login concluído com sucesso');
    } catch (error: any) {
      console.log('🔍 Debug - Erro no login:', error);
      const errorMessage = error.response?.data?.message || 'Erro ao fazer login';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  register: async (userData: RegisterForm) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.register(userData);
      const { user, accessToken, refreshToken } = response.data;
      
      // Salvar tokens no localStorage
      localStorage.setItem('access_token', accessToken);
      localStorage.setItem('refresh_token', refreshToken);
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao fazer registro';
      set({
        isLoading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  logout: () => {
    // Limpar tokens do localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    
    apiService.logout();
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  // Função para limpar estado corrompido
  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    set({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  },

  getProfile: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await apiService.getProfile();
      const user = response.data;
      
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || 'Erro ao carregar perfil';
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      });
    }
  },

  clearError: () => {
    set({ error: null });
  },
})); 