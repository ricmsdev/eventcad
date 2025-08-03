# EventCAD+ 🏗️

Sistema completo de gerenciamento de eventos com CAD integrado, reconhecimento de IA e análise de infraestrutura.

![EventCAD+ Banner](https://img.shields.io/badge/EventCAD%2B-v1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Docker](https://img.shields.io/badge/docker-ready-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue)

## 🚀 Funcionalidades

### Core Features
- **🎯 Gerenciamento de Eventos**: Criação, edição e controle completo de eventos
- **📐 Integração CAD**: Upload e visualização de plantas (DWG, DXF, PDF)
- **🤖 IA Avançada**: Reconhecimento automático de objetos em plantas
- **🏢 Digital Twin**: Representação digital de infraestrutura
- **👥 Multi-tenancy**: Suporte para múltiplas organizações
- **🔐 Segurança**: Autenticação JWT, RBAC, MFA
- **📊 Analytics**: Dashboard com métricas e relatórios

### Módulos
1. **Autenticação**: Login, registro, recuperação de senha, MFA
2. **Dashboard**: Visão geral, estatísticas, atividades recentes
3. **Eventos**: CRUD completo, aprovações, status workflow
4. **Plantas**: Upload, processamento, visualização, anotações
5. **Objetos de Infraestrutura**: Detecção automática, classificação, análise
6. **Jobs de IA**: Processamento assíncrono, filas, monitoramento
7. **Arquivos**: Gerenciamento centralizado, versionamento
8. **Perfil**: Configurações do usuário, notificações

## 🛠️ Stack Tecnológica

### Backend
- **NestJS** (v10) - Framework Node.js
- **TypeScript** - Type safety
- **PostgreSQL** - Banco de dados principal
- **Redis** - Cache e filas
- **TypeORM** - ORM
- **Bull** - Processamento de filas
- **Swagger** - Documentação API
- **Jest** - Testes

### Frontend
- **React** (v18) - UI Library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Query** - Data fetching
- **React Router** - Routing
- **React Hook Form** - Forms
- **Zustand** - State management

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Orquestração
- **Nginx** - Reverse proxy
- **GitHub Actions** - CI/CD

## 📋 Pré-requisitos

- Docker & Docker Compose
- Node.js 18+ (para desenvolvimento local)
- Git

## 🚀 Início Rápido

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/eventcad-plus.git
cd eventcad-plus
```

### 2. Configure as variáveis de ambiente
```bash
cp .env.example .env
# Edite .env com suas configurações
```

### 3. Inicie com Docker
```bash
# Build e inicie todos os serviços
make build
make up

# Ou use docker-compose diretamente
docker-compose up -d
```

### 4. Acesse a aplicação
- Frontend: http://localhost
- Backend API: http://localhost:3000
- API Docs: http://localhost:3000/api

## 📦 Instalação Completa

### Desenvolvimento Local

1. **Backend**
```bash
cd eventcad-backend
npm install
npm run migration:run
npm run seed
npm run start:dev
```

2. **Frontend**
```bash
cd eventcad-frontend
npm install
npm run dev
```

### Produção com Docker

```bash
# Build para produção
make build-prod

# Deploy
make prod
```

## 🔧 Comandos Úteis

```bash
# Desenvolvimento
make dev              # Inicia ambiente de desenvolvimento
make logs             # Visualiza logs
make shell-backend    # Acessa shell do backend
make test             # Executa testes

# Database
make migrate          # Executa migrações
make seed             # Popula banco de dados
make backup-db        # Backup do banco
make restore-db       # Restaura backup

# Docker
make up               # Inicia serviços
make down             # Para serviços
make restart          # Reinicia serviços
make clean            # Remove tudo
```

## 📁 Estrutura do Projeto

```
eventcad-plus/
├── eventcad-backend/          # API NestJS
│   ├── src/
│   │   ├── modules/          # Módulos do sistema
│   │   ├── common/           # Código compartilhado
│   │   └── main.ts           # Entry point
│   └── test/                 # Testes
│
├── eventcad-frontend/         # App React
│   ├── src/
│   │   ├── pages/           # Páginas
│   │   ├── components/      # Componentes
│   │   ├── services/        # API services
│   │   └── stores/          # Estado global
│   └── public/              # Assets públicos
│
├── docker-compose.yml        # Orquestração Docker
├── Makefile                 # Comandos úteis
└── README.md                # Este arquivo
```

## 🔐 Segurança

- Autenticação JWT com refresh tokens
- RBAC (Role-Based Access Control)
- Multi-Factor Authentication (MFA)
- Rate limiting
- CORS configurado
- Helmet.js para headers de segurança
- Validação de dados com class-validator
- Sanitização de inputs

## 🧪 Testes

```bash
# Testes unitários
make test

# Testes E2E
make test-e2e

# Coverage
cd eventcad-backend && npm run test:cov
```

## 📊 Monitoramento

- Health checks em todos os serviços
- Logs centralizados
- Métricas de performance
- Alertas configuráveis

## 🚀 Deploy

### Docker Swarm
```bash
docker stack deploy -c docker-compose.yml eventcad
```

### Kubernetes
```bash
kubectl apply -f k8s/
```

### Cloud Providers
- AWS ECS/EKS
- Google Cloud Run/GKE
- Azure Container Instances/AKS

## 📝 Variáveis de Ambiente

```env
# Core
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/eventcad

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Upload
MAX_FILE_SIZE=52428800
UPLOAD_PATH=/uploads

# AI Service
AI_SERVICE_URL=http://ai-service:8000
```

## 🤝 Contribuindo

1. Fork o projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 👥 Time

- **Arquiteto de Software**: Responsável pela arquitetura
- **Dev Backend**: APIs e integrações
- **Dev Frontend**: Interface e UX
- **DevOps**: Infraestrutura e CI/CD

## 📞 Suporte

- Email: support@eventcad.com
- Discord: [EventCAD+ Community](https://discord.gg/eventcad)
- Issues: [GitHub Issues](https://github.com/seu-usuario/eventcad-plus/issues)

---

**EventCAD+** - Transformando a gestão de eventos com tecnologia e inovação 🚀