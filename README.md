# EventCAD+ — Backend & Frontend

## Visão Geral
EventCAD+ é uma plataforma completa para gestão, execução e automação de eventos, com foco em plantas técnicas, compliance, IA e colaboração multi-tenant.

- **Stack:**
  - Backend: NestJS + TypeORM + PostgreSQL + Docker
  - Frontend: React + Vite + Tailwind
  - IA: Processamento via jobs, integração modular

---

## 🔒 Segurança

### Política de Segurança
- **Vulnerabilidades:** Reporte via security@eventcad.com (NÃO abra issues públicos)
- **Bug Bounty:** Disponível para pesquisadores de segurança
- **Documentação:** [SECURITY.md](./SECURITY.md)

### Verificação de Segurança
```bash
# Linux/Mac
./scripts/security-check.sh

# Windows
.\scripts\security-check.ps1
```

### Configuração Segura
1. **Copie o arquivo de exemplo:**
   ```bash
   cp env.example .env
   ```

2. **Configure as variáveis de ambiente:**
   - JWT_SECRET (chave forte e única)
   - DB_PASSWORD (senha forte)
   - Outras credenciais sensíveis

3. **NUNCA commite arquivos .env**

---

## Como rodar localmente

### Opção 1: Setup Automático (Recomendado)
```sh
# Clone o repositório
git clone https://github.com/ricmsdev/eventcad
cd eventcad

# Setup automático seguro
# Linux/Mac
./scripts/setup-secure.sh

# Windows
.\scripts\setup-secure.ps1
```

### Opção 2: Setup Manual
```sh
# 1. Clone o repositório
git clone https://github.com/ricmsdev/eventcad
cd eventcad

# 2. Configure o ambiente
cp env.example .env
nano .env

# 3. Suba o ambiente com Docker
docker-compose up -d

# 4. Instale dependências (opcional para dev)
cd eventcad-backend && npm install
cd ../eventcad-frontend && npm install

# 5. Rode as migrations e seeds
cd eventcad-backend
npm run db:reset
npm run db:seed
```

### 6. Acesse os sistemas
- **Frontend:** [http://localhost:8081](http://localhost:8081)
- **Backend API:** [http://localhost:3000/api/v1](http://localhost:3000/api/v1)
- **Documentação Swagger:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **Health check:** [http://localhost:3000/health](http://localhost:3000/health)

---

## Documentação das APIs
- **Swagger/OpenAPI:** [http://localhost:3000/docs](http://localhost:3000/docs)
- Teste endpoints, veja exemplos, faça login e cole o token JWT para testar rotas protegidas.

---

## Exemplos de uso rápido

### Login
```http
POST /api/v1/auth/login
{
  "email": "SEU_EMAIL_ADMIN",
  "password": "SUA_SENHA_SEGURA"
}
```

### Criar Evento
```http
POST /api/v1/eventos
Authorization: Bearer <JWT>
{
  "nome": "Feira de Tecnologia 2025",
  "tipo": "feira",
  "dataInicio": "2025-05-10T09:00:00Z",
  "dataFim": "2025-05-12T18:00:00Z",
  "local": "Centro de Convenções",
  "capacidadeMaxima": 1000,
  "publicoEstimado": 800
}
```

### Upload de Planta
```http
POST /api/v1/plantas/upload
Authorization: Bearer <JWT>
Content-Type: multipart/form-data
- eventoId: <ID do evento>
- plantaTipo: planta_baixa
- file: (arquivo .pdf, .dwg, .png, etc)
```

---

## Scripts úteis
- **Testes automáticos:**
  ```sh
  cd eventcad-backend
  npm run test:e2e
  ```
- **Reset do banco:**
  ```sh
  npm run db:reset
  ```
- **Verificação de segurança:**
  ```sh
  # Linux/Mac
  ./scripts/security-check.sh
  
  # Windows
  .\scripts\security-check.ps1
  ```

---

## 🛡️ Medidas de Segurança Implementadas

### Autenticação e Autorização
- ✅ JWT com expiração configurável
- ✅ Refresh tokens com rotação
- ✅ Multi-tenancy com isolamento de dados
- ✅ Role-based access control (RBAC)
- ✅ Rate limiting por IP/usuário

### Validação de Dados
- ✅ Input validation com Zod
- ✅ SQL injection protection (TypeORM)
- ✅ XSS protection (helmet)
- ✅ CORS configurado adequadamente

### Configuração de Segurança
- ✅ Variáveis de ambiente para credenciais
- ✅ Secrets não commitados no git
- ✅ HTTPS em produção
- ✅ Headers de segurança configurados

### Monitoramento
- ✅ Logs estruturados
- ✅ Health checks
- ✅ Error tracking
- ✅ Audit trails

---

## 🚨 Reportando Problemas

### Vulnerabilidades de Segurança
- **Email:** security@eventcad.com
- **PGP Key:** [Disponível em breve]
- **Response Time:** 24-48 horas

### Bugs Gerais
- Use o sistema de issues do GitHub
- Inclua logs e passos para reproduzir
- Não inclua informações sensíveis

---

## 📞 Suporte

- **Documentação:** [SECURITY.md](./SECURITY.md)
- **Issues:** [GitHub Issues](https://github.com/ricmsdev/eventcad/issues)
- **Segurança:** security@eventcad.com

---

> Powered by God of Luc — Automação, robustez e onboarding de verdade.