import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return {
      message: 'Bem-vindo ao EventCAD+ API',
      version: '1.0.0',
      description: 'Sistema avançado de gestão e execução de eventos',
      documentation: '/docs',
      timestamp: new Date().toISOString(),
      features: [
        'Autenticação JWT + RBAC',
        'Multi-tenant isolation',
        'AI Recognition',
        'Compliance automatizado',
        'Upload seguro de arquivos',
        'Relatórios avançados',
        'Operação mobile/offline',
      ],
    };
  }
}
