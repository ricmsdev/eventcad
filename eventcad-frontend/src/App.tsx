import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Páginas de Autenticação
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';

// Páginas do Dashboard
import DashboardPage from '@/pages/dashboard/DashboardPage';
import { EventosPage } from '@/pages/eventos/EventosPage';
import { NovoEventoPage } from '@/pages/eventos/NovoEventoPage';
import { EventoDetalhesPage } from '@/pages/eventos/EventoDetalhesPage';
import { PlantasPage } from '@/pages/plantas/PlantasPage';
import { UploadPlantaPage } from '@/pages/plantas/UploadPlantaPage';
import { PlantaDetalhesPage } from '@/pages/plantas/PlantaDetalhesPage';
import PlantaEditorPage from '@/pages/plantas/PlantaEditorPage';
import { InfraObjectsPage } from '@/pages/infra-objects/InfraObjectsPage';
import { NovoInfraObjectPage } from '@/pages/infra-objects/NovoInfraObjectPage';
import { InfraObjectDetalhesPage } from '@/pages/infra-objects/InfraObjectDetalhesPage';
import { AIJobsPage } from '@/pages/ai-jobs/AIJobsPage';
import { NovoAIJobPage } from '@/pages/ai-jobs/NovoAIJobPage';
import { AIJobDetalhesPage } from '@/pages/ai-jobs/AIJobDetalhesPage';
import { FilesPage } from '@/pages/files/FilesPage';
import { UploadFilePage } from '@/pages/files/UploadFilePage';
import { FileDetalhesPage } from '@/pages/files/FileDetalhesPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
// TODO: Implementar outras páginas

// Componentes
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function App() {
  const { isAuthenticated, isLoading, getProfile, clearAuth } = useAuthStore();

  useEffect(() => {
    // Verificar se há token salvo e sincronizar estado
    const token = localStorage.getItem('access_token');
    console.log('🔍 Debug - App.tsx - Token encontrado:', !!token);
    console.log('🔍 Debug - App.tsx - isAuthenticated:', isAuthenticated);
    
    // Se há token mas não está autenticado, carregar perfil
    if (token && !isAuthenticated) {
      console.log('🔍 Debug - App.tsx - Token encontrado mas não autenticado, carregando perfil...');
      getProfile().catch(() => {
        console.log('🔍 Debug - App.tsx - Erro ao carregar perfil, limpando...');
        clearAuth();
      });
    }
    
    // Se não há token mas está autenticado, limpar estado
    if (!token && isAuthenticated) {
      console.log('🔍 Debug - App.tsx - Estado inconsistente detectado, limpando...');
      clearAuth();
    }
  }, [isAuthenticated, getProfile, clearAuth]);

  // Mostrar loading enquanto verifica autenticação
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="App">
      <Routes>
        {/* Rotas públicas */}
        <Route
          path="/login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <LoginPage />
              </AuthLayout>
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <AuthLayout>
                <RegisterPage />
              </AuthLayout>
            )
          }
        />

        {/* Rotas protegidas */}
        <Route
          path="/dashboard"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/eventos"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <EventosPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/eventos/novo"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <NovoEventoPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/eventos/:id"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <EventoDetalhesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/eventos/:id/editar"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Página em desenvolvimento</h3>
                    <p className="text-gray-600">A página de edição de eventos será implementada em breve.</p>
                  </div>
                </div>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rotas de Plantas */}
        <Route
          path="/plantas"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <PlantasPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/plantas/upload"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <UploadPlantaPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/plantas/:id"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <PlantaDetalhesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/plantas/:id/editor"
          element={
            isAuthenticated ? (
              <PlantaEditorPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/infra-objects"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <InfraObjectsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/infra-objects/novo"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <NovoInfraObjectPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/infra-objects/:id"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <InfraObjectDetalhesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/infra-objects/:id/editar"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <div className="flex items-center justify-center min-h-[400px]">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Página em desenvolvimento</h3>
                    <p className="text-gray-600">A página de edição de objetos será implementada em breve.</p>
                  </div>
                </div>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/ai-jobs"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <AIJobsPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/ai-jobs/novo"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <NovoAIJobPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/ai-jobs/:id"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <AIJobDetalhesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/files"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <FilesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/files/upload"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <UploadFilePage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/files/:id"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <FileDetalhesPage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        <Route
          path="/profile"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <ProfilePage />
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rota padrão */}
        <Route
          path="/"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />

        {/* Rota 404 */}
        <Route
          path="*"
          element={
            isAuthenticated ? (
              <DashboardLayout>
                <div className="flex items-center justify-center min-h-screen">
                  <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Página não encontrada</p>
                    <button
                      onClick={() => window.history.back()}
                      className="btn-primary"
                    >
                      Voltar
                    </button>
                  </div>
                </div>
              </DashboardLayout>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
      </Routes>
    </div>
  );
}

export default App; 