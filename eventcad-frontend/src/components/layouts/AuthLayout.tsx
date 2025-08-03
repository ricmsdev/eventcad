import { ReactNode } from 'react';
import { Calendar, Shield, Zap, Users } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-eventcad-50 via-white to-eventcad-100">
      <div className="flex min-h-screen">
        {/* Lado esquerdo - Informações do produto */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-eventcad-600 to-eventcad-800 text-white p-12">
          <div className="max-w-md mx-auto">
            <div className="mb-8">
              <h1 className="text-4xl font-bold mb-2">EventCAD+</h1>
              <p className="text-eventcad-100 text-lg">
                Sistema avançado de gestão e execução de eventos
              </p>
            </div>

            <div className="space-y-8">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Calendar className="w-8 h-8 text-eventcad-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Gestão Completa de Eventos</h3>
                  <p className="text-eventcad-200">
                    Controle total do ciclo de vida dos eventos, desde o planejamento até a execução.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Shield className="w-8 h-8 text-eventcad-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Compliance Automático</h3>
                  <p className="text-eventcad-200">
                    Verificação automática de normas de segurança e conformidade regulatória.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Zap className="w-8 h-8 text-eventcad-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">IA Especializada</h3>
                  <p className="text-eventcad-200">
                    Reconhecimento inteligente de plantas e automação de processos críticos.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <Users className="w-8 h-8 text-eventcad-300" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Colaboração em Tempo Real</h3>
                  <p className="text-eventcad-200">
                    Trabalhe em equipe com ferramentas colaborativas e sincronização automática.
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-eventcad-500">
              <p className="text-eventcad-200 text-sm">
                "O EventCAD+ transformou completamente nossa gestão de eventos. 
                A automação e precisão são impressionantes."
              </p>
              <p className="text-eventcad-100 font-medium mt-2">
                — Equipe de Eventos, Centro de Convenções
              </p>
            </div>
          </div>
        </div>

        {/* Lado direito - Formulário */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Logo para mobile */}
            <div className="lg:hidden text-center mb-8">
              <h1 className="text-3xl font-bold text-eventcad-600 mb-2">EventCAD+</h1>
              <p className="text-gray-600">Sistema avançado de gestão de eventos</p>
            </div>

            {/* Conteúdo do formulário */}
            <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
              {children}
            </div>

            {/* Links de navegação */}
            <div className="mt-6 text-center">
              <p className="text-gray-600 text-sm">
                © 2024 EventCAD+. Todos os direitos reservados.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 