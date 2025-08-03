# EventCAD+ — Backend & Frontend

## Visão Geral
EventCAD+ é uma plataforma completa para gestão, execução e automação de eventos, com foco em plantas técnicas, compliance, IA e colaboração multi-tenant.

- **Stack:**
  - Backend: NestJS + TypeORM + PostgreSQL + Docker
  - Frontend: React + Vite + Tailwind
  - IA: Processamento via jobs, integração modular

---

## Como rodar localmente

### 1. Clone o repositório
```sh
git clone <repo>
cd EVENT CAD
```

### 2. Suba o ambiente com Docker
```sh
docker-compose up -d
```

### 3. Instale dependências (opcional para dev)
```sh
cd eventcad-backend && npm install
cd ../eventcad-frontend && npm install
```

### 4. Rode as migrations e seeds
```sh
cd eventcad-backend
npm run db:reset
npm run db:seed
```

### 5. Acesse os sistemas
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
  "email": "admin@eventcad.com",
  "password": "EventCAD@2025"
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
- **Stress test:**
  ```sh
  k6 run ../stress-test-complete.js
  ```

---

## Checklist de Deploy
- [ ] Docker Compose configurado
- [ ] Variáveis de ambiente (.env) revisadas
- [ ] Banco migrado e seedado
- [ ] Documentação acessível em `/docs`
- [ ] Health check OK
- [ ] Logs e monitoramento ativos

---

## Contato e Colaboração
- **Time:** EventCAD+ Team — api@eventcad.com
- **Contribua:** Pull requests e issues são bem-vindos!
- **Dúvidas:** Consulte a documentação ou abra uma issue.

---

> Powered by God of Luc — Automação, robustez e onboarding de verdade.