# EventCAD+ Backend

<div align="center">

![EventCAD+ Logo](https://via.placeholder.com/200x100/1976d2/ffffff?text=EventCAD%2B)

**Sistema avançado de gestão e execução de eventos com tecnologia de ponta**

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org/)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white)](https://postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://docker.com/)

</div>

## 📋 Sobre o Projeto

O **EventCAD+** é a plataforma mais avançada do mercado global para gestão operacional, compliance, digital twin e automação de eventos em pavilhões, arenas, feiras e grandes centros. Transforma o ciclo completo dos eventos em algo inteligente, seguro, eficiente e auditável.

### 🚀 Principais Funcionalidades

- 🔐 **Autenticação robusta** - JWT + RBAC + MFA
- 🏢 **Multi-tenant** - Isolamento completo de dados
- 🤖 **AI Recognition** - Reconhecimento inteligente de plantas
- ✅ **Compliance dinâmico** - Verificação automática de normas
- 📊 **Digital Twin** - Representação digital em 2D/3D
- 📱 **Mobile-first** - Operação offline e sincronização
- 🔍 **Auditoria completa** - Rastreabilidade total
- 📈 **Relatórios avançados** - Exportação em múltiplos formatos

### 🎯 Diferencial Competitivo

- **Primeira plataforma** plug-and-play para qualquer tipo de evento
- **Automação real** de compliance técnico com normas sempre atualizadas
- **Planta 3D/Digital Twin** integrada com simulação de riscos
- **APIs nativas** para integração com ecossistema do cliente
- **Segurança by design** com LGPD/GDPR compliance

## 🛠️ Stack Tecnológica

### Core
- **[NestJS](https://nestjs.com/)** - Framework Node.js escalável
- **[TypeScript](https://typescriptlang.org/)** - JavaScript tipado
- **[PostgreSQL](https://postgresql.org/)** - Banco relacional principal
- **[TypeORM](https://typeorm.io/)** - ORM para TypeScript/JavaScript

### Autenticação & Segurança
- **[Passport.js](http://passportjs.org/)** - Estratégias de autenticação
- **[JWT](https://jwt.io/)** - JSON Web Tokens
- **[bcrypt](https://github.com/kelektiv/node.bcrypt.js)** - Hash de senhas
- **[Helmet](https://helmetjs.github.io/)** - Segurança HTTP

### Validação & Documentação
- **[class-validator](https://github.com/typestack/class-validator)** - Validação de DTOs
- **[Swagger/OpenAPI](https://swagger.io/)** - Documentação automática da API
- **[Jest](https://jestjs.io/)** - Framework de testes

### DevOps & Containerização
- **[Docker](https://docker.com/)** - Containerização
- **[Docker Compose](https://docs.docker.com/compose/)** - Orquestração local
- **[Redis](https://redis.io/)** - Cache e sessões

## 🚀 Quick Start

### Pré-requisitos

- **Node.js** 18+ 
- **Docker** & **Docker Compose**
- **Git**

### 1. Clone e Configuração Inicial

```bash
# Clone o repositório
git clone <repo-url>
cd eventcad-backend

# Instalar dependências
npm install

# Copiar configuração de ambiente
cp .env.example .env
```

### 2. Configurar Ambiente (.env)

```bash
# Edite o arquivo .env com suas configurações
# As configurações padrão funcionam para desenvolvimento local
```

### 3. Inicializar Desenvolvimento

```bash
# Setup completo (banco + seeds + início)
npm run dev:setup

# OU manualmente:
npm run docker:up          # Inicia PostgreSQL e Redis
npm run db:migrate         # Roda migrations
npm run db:seed           # Popula dados iniciais
npm run start:dev         # Inicia em modo desenvolvimento
```

### 4. Acessar a Aplicação

- **API**: http://localhost:3000
- **Documentação**: http://localhost:3000/docs
- **Health Check**: http://localhost:3000/health
- **Adminer** (banco): http://localhost:8080 (opcional)

### 5. Login Inicial

```
Email: admin@eventcad.com
Senha: EventCAD@2025
```

> ⚠️ **IMPORTANTE**: Altere a senha padrão imediatamente!

## 📚 Scripts Disponíveis

### Desenvolvimento
```bash
npm run start:dev          # Desenvolvimento com hot reload
npm run start:debug        # Desenvolvimento com debug
npm run docker:logs        # Ver logs dos containers
```

### Banco de Dados
```bash
npm run db:migrate          # Executar migrations
npm run db:seed            # Popular dados iniciais
npm run db:reset           # Reset completo do banco
npm run db:generate        # Gerar nova migration
```

### Docker
```bash
npm run docker:up          # Subir containers
npm run docker:down        # Parar containers
npm run docker:reset       # Reset completo (dados perdidos)
```

### Qualidade
```bash
npm run lint               # Lint + auto-fix
npm run test               # Testes unitários
npm run test:e2e           # Testes end-to-end
npm run test:cov           # Coverage de testes
npm run quality:check      # Verificação completa
```

## 🏗️ Arquitetura

### Estrutura de Pastas

```
src/
├── common/                 # Utilitários compartilhados
│   ├── decorators/        # Decorators customizados
│   ├── dto/              # DTOs base
│   ├── entities/         # Entidades base
│   ├── enums/            # Enumerações
│   ├── filters/          # Exception filters
│   ├── guards/           # Guards de autenticação
│   ├── interceptors/     # Interceptors
│   └── utils/            # Utilitários
├── config/               # Configurações
├── database/             # Migrations e seeds
├── modules/              # Módulos funcionais
│   ├── auth/            # Autenticação
│   ├── tenant/          # Multi-tenancy
│   ├── evento/          # Gestão de eventos
│   ├── planta/          # Plantas e layouts
│   ├── ai-recognition/ # Reconhecimento IA
│   ├── compliance/      # Compliance
│   └── ...
└── main.ts              # Bootstrap da aplicação
```

### Módulos Principais

#### 🔐 Auth Module
- Autenticação JWT
- RBAC (Role-Based Access Control)
- MFA (Multi-Factor Authentication)
- Estratégias Passport (Local, JWT)

#### 🏢 Tenant Module
- Isolamento multi-tenant
- Configurações por organização
- Controle de limites e cotas
- Billing e assinaturas

#### 📋 Evento Module
- CRUD de eventos
- Timeline e status
- Gestão de equipes
- Workflow de aprovação

#### 🗺️ Planta Module
- Upload de arquivos (DWG, IFC, PDF)
- Viewer 2D/3D
- Anotações colaborativas
- Versionamento

#### 🤖 AI Recognition Module
- Integração com serviços AI
- Reconhecimento de objetos
- Classificação automática
- Sugestões inteligentes

#### ✅ Compliance Module
- Engine de regras
- Verificação automática
- Geração de relatórios
- Conformidade com normas

## 🔒 Segurança

### Autenticação
- **JWT** com expiração configurável
- **Refresh tokens** para renovação
- **Rate limiting** para prevenção de ataques
- **CORS** configurado adequadamente

### Autorização
- **RBAC** hierárquico
- **Guards** personalizados
- **Decorators** para controle de acesso
- **Multi-tenant** isolation

### Proteções
- **Helmet** para headers de segurança
- **bcrypt** para hash de senhas
- **Validação** rigorosa de entrada
- **SQL injection** prevention via TypeORM

### Auditoria
- **Logs estruturados** de todas as ações
- **Timestamps** automáticos
- **Tracking** de alterações
- **IP e User-Agent** logging

## 🌐 API Documentation

A documentação completa da API está disponível via Swagger:

- **Local**: http://localhost:3000/docs
- **Produção**: https://api.eventcad.com/docs

### Principais Endpoints

```
Authentication:
POST   /api/v1/auth/login         # Login
POST   /api/v1/auth/register      # Registro
POST   /api/v1/auth/refresh       # Renovar token
GET    /api/v1/auth/profile       # Perfil do usuário

Events:
GET    /api/v1/eventos            # Listar eventos (com filtros)
POST   /api/v1/eventos            # Criar evento
GET    /api/v1/eventos/:id        # Detalhes do evento
PATCH  /api/v1/eventos/:id        # Atualizar evento
DELETE /api/v1/eventos/:id        # Remover evento
PATCH  /api/v1/eventos/:id/status # Atualizar status
POST   /api/v1/eventos/:id/timeline   # Adicionar marco
PATCH  /api/v1/eventos/:id/timeline   # Atualizar marco
POST   /api/v1/eventos/:id/riscos     # Adicionar risco
GET    /api/v1/eventos/stats/overview # Estatísticas
GET    /api/v1/eventos/dashboard/proximos  # Próximos eventos
GET    /api/v1/eventos/dashboard/atencao   # Eventos com alertas

Files & Upload:
POST   /api/v1/files/upload       # Upload arquivo único
POST   /api/v1/files/upload/multiple # Upload múltiplo (máx 20)
GET    /api/v1/files              # Listar arquivos (com filtros)
GET    /api/v1/files/:id          # Detalhes do arquivo
PATCH  /api/v1/files/:id          # Atualizar arquivo
DELETE /api/v1/files/:id          # Remover arquivo
POST   /api/v1/files/:id/share    # Compartilhar arquivo
POST   /api/v1/files/:id/download-url # Gerar URL de download
GET    /api/v1/files/:id/download # Download direto
GET    /api/v1/files/:id/preview  # Preview/visualização
GET    /api/v1/files/entity/:type/:id # Arquivos por entidade
GET    /api/v1/files/stats/overview   # Estatísticas de arquivos

Technical Plants:
POST   /api/v1/plantas/upload     # Upload planta técnica (DWG/IFC/PDF)
GET    /api/v1/plantas            # Listar plantas (filtros avançados)
GET    /api/v1/plantas/:id        # Detalhes da planta
PATCH  /api/v1/plantas/:id        # Atualizar planta
POST   /api/v1/plantas/:id/validacao # Validação técnica
POST   /api/v1/plantas/:id/revisao   # Adicionar revisão
POST   /api/v1/plantas/:id/process-ai # Processar com IA
GET    /api/v1/plantas/:id/metadata  # Metadados técnicos
GET    /api/v1/plantas/:id/detected-objects # Objetos detectados
POST   /api/v1/plantas/:id/compatibility/:otherId # Analisar compatibilidade
GET    /api/v1/plantas/evento/:eventoId # Plantas por evento
GET    /api/v1/plantas/stats/overview   # Estatísticas de plantas
GET    /api/v1/plantas/dashboard/summary # Dashboard de plantas
GET    /api/v1/plantas/tipos/list       # Tipos disponíveis

AI Recognition:
POST   /api/v1/ai-recognition/jobs     # Criar job de processamento IA
POST   /api/v1/ai-recognition/jobs/batch # Criar jobs em batch
GET    /api/v1/ai-recognition/jobs     # Listar jobs (filtros avançados)
GET    /api/v1/ai-recognition/jobs/:id # Detalhes do job
PATCH  /api/v1/ai-recognition/jobs/:id # Atualizar job
POST   /api/v1/ai-recognition/jobs/:id/execute # Executar job
POST   /api/v1/ai-recognition/jobs/:id/cancel  # Cancelar job
GET    /api/v1/ai-recognition/jobs/:id/results # Resultados do processamento
GET    /api/v1/ai-recognition/jobs/:id/status  # Status em tempo real
GET    /api/v1/ai-recognition/jobs/:id/logs    # Logs detalhados
GET    /api/v1/ai-recognition/queue    # Queue de processamento
GET    /api/v1/ai-recognition/recommendations/:plantaId # Modelos recomendados
GET    /api/v1/ai-recognition/stats/overview   # Estatísticas de jobs
GET    /api/v1/ai-recognition/dashboard        # Dashboard de IA
POST   /api/v1/ai-recognition/reports/generate # Gerar relatório
GET    /api/v1/ai-recognition/models/available # Modelos disponíveis
GET    /api/v1/ai-recognition/health          # Health check serviços

Infrastructure Objects:
POST   /api/v1/infra-objects              # Criar objeto de infraestrutura
GET    /api/v1/infra-objects              # Listar objetos (filtros avançados)
GET    /api/v1/infra-objects/:id          # Detalhes do objeto
PATCH  /api/v1/infra-objects/:id          # Atualizar objeto
POST   /api/v1/infra-objects/:id/move     # Mover objeto na planta
POST   /api/v1/infra-objects/:id/resize   # Redimensionar objeto
POST   /api/v1/infra-objects/:id/annotations # Adicionar anotação
POST   /api/v1/infra-objects/:id/annotations/:annotationId/resolve # Resolver anotação
POST   /api/v1/infra-objects/:id/validations # Adicionar validação técnica
POST   /api/v1/infra-objects/:id/approve  # Aprovar objeto
POST   /api/v1/infra-objects/:id/reject   # Rejeitar objeto
POST   /api/v1/infra-objects/analyze-conflicts # Analisar conflitos
GET    /api/v1/infra-objects/stats/overview # Estatísticas de objetos
GET    /api/v1/infra-objects/dashboard    # Dashboard de objetos
POST   /api/v1/infra-objects/reports/generate # Gerar relatório
GET    /api/v1/infra-objects/types/available # Tipos disponíveis
GET    /api/v1/infra-objects/planta/:plantaId # Objetos por planta
GET    /api/v1/infra-objects/:id/history  # Histórico de modificações
GET    /api/v1/infra-objects/:id/annotations # Anotações do objeto
GET    /api/v1/infra-objects/:id/validations # Validações do objeto

Compliance: (em desenvolvimento)
GET    /api/v1/compliance/rules   # Regras disponíveis
POST   /api/v1/compliance/check   # Verificar compliance
GET    /api/v1/compliance/reports # Relatórios
```

## 🧪 Testes

### Executar Testes

```bash
# Testes unitários
npm run test

# Testes com watch mode
npm run test:watch

# Testes com coverage
npm run test:cov

# Testes end-to-end
npm run test:e2e
```

### Cobertura de Testes

- **Meta**: >80% de cobertura
- **Unitários**: Lógica de negócio crítica
- **E2E**: Fluxos principais da aplicação
- **Mocks**: Serviços externos (AI, email, etc.)

## 🚀 Deploy

### Desenvolvimento Local
```bash
npm run dev:start
```

### Produção com Docker
```bash
# Build da imagem
npm run docker:build

# Deploy com docker-compose
docker-compose -f docker-compose.prod.yml up -d
```

### Variáveis de Ambiente Obrigatórias (Produção)

```bash
NODE_ENV=production
JWT_SECRET=<secret-super-seguro>
DATABASE_URL=<url-do-banco>
REDIS_URL=<url-do-redis>
```

## 📊 Monitoramento

### Health Checks
- **API**: `/health` - Status da aplicação
- **Database**: Verificação de conectividade
- **External Services**: Status dos serviços AI

### Logs
- **Estruturados** em JSON
- **Níveis**: error, warn, info, debug
- **Contexto**: tenant, user, request ID
- **Auditoria**: todas as ações sensíveis

### Métricas (Preparado para)
- **Prometheus** - Coleta de métricas
- **Grafana** - Dashboards
- **Sentry** - Error tracking
- **APM** - Performance monitoring

## 🤝 Contribuição

### Workflow de Desenvolvimento

1. **Feature Branch**: Crie uma branch para sua feature
2. **Commits**: Use conventional commits
3. **Tests**: Adicione testes para nova funcionalidade
4. **Lint**: Garanta que o código passa no lint
5. **Pull Request**: Abra PR com descrição detalhada

### Padrões de Código

- **TypeScript strict mode**
- **ESLint** + **Prettier** configurados
- **Conventional commits**
- **DTOs** para validação
- **Documentação** em todos os endpoints

### Git Hooks (Configurado)

- **pre-commit**: Lint + format
- **pre-push**: Testes unitários
- **commit-msg**: Validação de mensagem

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

## 🆘 Suporte

### Documentação
- **API Docs**: `/docs`
- **README**: Este arquivo
- **Wiki**: (em construção)

### Contato
- **Email**: dev@eventcad.com
- **Slack**: #eventcad-dev
- **Issues**: GitHub Issues

### Status do Projeto

- **Versão atual**: 1.0.0
- **Status**: 🚧 Em desenvolvimento (Sprint 1)
- **Próxima release**: Sprint 2 - AI Recognition

---

<div align="center">

**EventCAD+ - Transformando eventos em experiências inteligentes e seguras**

Made with ❤️ by EventCAD+ Team

</div>