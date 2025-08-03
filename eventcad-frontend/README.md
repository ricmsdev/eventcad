# EventCAD+ Frontend

Frontend moderno e responsivo para o EventCAD+ - Sistema avançado de gestão de eventos.

## 🚀 Tecnologias

- **React 18** - Biblioteca JavaScript para interfaces
- **TypeScript** - Tipagem estática
- **Vite** - Build tool e dev server
- **Tailwind CSS** - Framework CSS utilitário
- **React Router** - Roteamento
- **React Query** - Gerenciamento de estado e cache
- **Zustand** - Gerenciamento de estado global
- **React Hook Form** - Formulários
- **Zod** - Validação de schemas
- **Lucide React** - Ícones
- **Framer Motion** - Animações
- **Radix UI** - Componentes acessíveis

## 📦 Instalação

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend do EventCAD+ rodando

### Passos

1. **Clone o repositório**
```bash
cd eventcad-frontend
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
# Crie um arquivo .env.local (opcional)
VITE_API_URL=http://localhost:3000
```

4. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

O frontend estará disponível em `http://localhost:3001`

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Inicia servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de código
npm run lint             # Executa ESLint
npm run lint:fix         # Corrige problemas do ESLint
npm run type-check       # Verifica tipos TypeScript

# Testes
npm run test             # Executa testes
npm run test:ui          # Interface de testes
npm run test:coverage    # Cobertura de testes
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/          # Componentes reutilizáveis
│   ├── ui/             # Componentes de interface
│   ├── layouts/        # Layouts da aplicação
│   └── forms/          # Componentes de formulário
├── pages/              # Páginas da aplicação
│   ├── auth/           # Páginas de autenticação
│   ├── dashboard/      # Dashboard principal
│   ├── eventos/        # Gestão de eventos
│   ├── plantas/        # Gestão de plantas
│   ├── infra-objects/  # Objetos de infraestrutura
│   ├── ai-jobs/        # Jobs de IA
│   ├── files/          # Gestão de arquivos
│   └── profile/        # Perfil do usuário
├── hooks/              # Custom hooks
├── services/           # Serviços de API
├── stores/             # Stores do Zustand
├── types/              # Tipos TypeScript
├── utils/              # Utilitários
└── styles/             # Estilos globais
```

## 🎨 Design System

### Cores

- **Primary**: EventCAD Blue (`#3b82f6`)
- **Success**: Green (`#22c55e`)
- **Warning**: Orange (`#f59e0b`)
- **Danger**: Red (`#ef4444`)

### Componentes

- **Botões**: `.btn-primary`, `.btn-secondary`, `.btn-danger`
- **Cards**: `.card-eventcad`
- **Inputs**: `.input-eventcad`
- **Badges**: `.badge-success`, `.badge-warning`, `.badge-danger`, `.badge-info`

## 🔐 Autenticação

O sistema usa JWT tokens para autenticação:

- **Login**: `/login`
- **Registro**: `/register`
- **Logout**: Automático ao clicar em "Sair"

### Credenciais de Demonstração

```
Email: admin@eventcad.com
Senha: EventCAD@2025
```

## 📱 Responsividade

O frontend é totalmente responsivo e funciona em:

- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Menu hambúrguer e layout otimizado

## 🔧 Configuração

### Proxy para API

O Vite está configurado para fazer proxy das requisições `/api` para o backend:

```typescript
// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:3000',
      changeOrigin: true,
    },
  },
}
```

### Variáveis de Ambiente

```bash
VITE_API_URL=http://localhost:3000  # URL do backend
VITE_APP_NAME=EventCAD+             # Nome da aplicação
```

## 🧪 Testes

```bash
# Executar testes
npm run test

# Testes com interface
npm run test:ui

# Cobertura
npm run test:coverage
```

## 📦 Build para Produção

```bash
# Build
npm run build

# Preview do build
npm run preview
```

## 🚀 Deploy

### Vercel

1. Conecte o repositório ao Vercel
2. Configure as variáveis de ambiente
3. Deploy automático

### Netlify

1. Conecte o repositório ao Netlify
2. Configure o build command: `npm run build`
3. Configure o publish directory: `dist`

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob licença proprietária. Todos os direitos reservados.

## 🆘 Suporte

- **Documentação**: Este README
- **Issues**: GitHub Issues
- **Email**: dev@eventcad.com

---

**EventCAD+ - Transformando eventos em experiências inteligentes e seguras** 