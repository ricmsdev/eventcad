# 🚀 Como Rodar o EventCAD+ Frontend Localmente

## 📋 Pré-requisitos

### 1. Node.js
- **Versão**: 18 ou superior
- **Download**: https://nodejs.org/
- **Verificação**: `node --version`

### 2. npm (vem com Node.js)
- **Verificação**: `npm --version`

### 3. Backend (Opcional)
- Para funcionalidade completa, o backend deve estar rodando
- **Porta**: 3000
- **Script**: `./start-backend.ps1`

## 🎯 Métodos de Execução

### Método 1: Script Automático (Recomendado)

```powershell
# Execute o script que faz tudo automaticamente
.\start-frontend-local.ps1
```

### Método 2: Manual

```powershell
# 1. Navegar para o diretório do frontend
cd eventcad-frontend

# 2. Instalar dependências (primeira vez)
npm install

# 3. Iniciar servidor de desenvolvimento
npm run dev
```

## 🌐 URLs de Acesso

- **Frontend**: http://localhost:3001
- **Backend**: http://localhost:3000 (se estiver rodando)

## ⚙️ Configuração

### Variáveis de Ambiente
O script cria automaticamente um arquivo `.env.local`:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=EventCAD+
```

### Proxy de API
O Vite está configurado para fazer proxy das requisições `/api` para o backend local.

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev              # Servidor de desenvolvimento
npm run build            # Build para produção
npm run preview          # Preview do build

# Qualidade de código
npm run lint             # Verificar código
npm run lint:fix         # Corrigir problemas
npm run type-check       # Verificar tipos

# Testes
npm run test             # Executar testes
npm run test:ui          # Interface de testes
npm run test:coverage    # Cobertura de testes
```

## 🐛 Solução de Problemas

### Erro: "Node.js não encontrado"
```bash
# Instale o Node.js em: https://nodejs.org/
# Ou use o Node Version Manager (nvm)
```

### Erro: "Porta 3001 já em uso"
```bash
# Encerre o processo na porta 3001
netstat -ano | findstr :3001
taskkill /PID <PID> /F
```

### Erro: "Dependências não encontradas"
```bash
# Remova node_modules e reinstale
rm -rf node_modules
npm install
```

### Frontend carrega mas API não funciona
- Verifique se o backend está rodando na porta 3000
- Execute: `./start-backend.ps1`
- Verifique se não há firewall bloqueando

## 📱 Funcionalidades

### Credenciais de Teste
```
Email: admin@eventcad.com
Senha: EventCAD@2025
```

### Módulos Disponíveis
- ✅ **Dashboard** - Visão geral do sistema
- ✅ **Eventos** - Gestão de eventos
- ✅ **Plantas** - Visualização e edição de plantas
- ✅ **Infraestrutura** - Objetos de infraestrutura
- ✅ **AI Jobs** - Processamento de IA
- ✅ **Arquivos** - Upload e gestão de arquivos
- ✅ **Relatórios** - Geração de relatórios
- ✅ **Monitoramento** - Dashboard de monitoramento

## 🎨 Interface

### Design Responsivo
- **Desktop**: Layout completo com sidebar
- **Tablet**: Layout adaptativo
- **Mobile**: Menu hambúrguer

### Tema
- **Cores**: EventCAD Blue (#3b82f6)
- **Componentes**: Radix UI + Tailwind CSS
- **Animações**: Framer Motion

## 🔄 Hot Reload

O Vite oferece hot reload automático:
- Alterações em arquivos `.tsx` atualizam instantaneamente
- Alterações em arquivos `.css` aplicam sem refresh
- Console mostra erros em tempo real

## 📊 Monitoramento

### Logs do Desenvolvimento
- **Vite**: Mostra build progress e erros
- **React**: Erros de renderização
- **Console**: Logs da aplicação

### Performance
- **Build**: ~2-3 segundos
- **Hot Reload**: <100ms
- **Bundle Size**: ~2MB (desenvolvimento)

## 🚀 Próximos Passos

1. **Primeira execução**: Execute `.\start-frontend-local.ps1`
2. **Acesse**: http://localhost:3001
3. **Faça login**: Use as credenciais de teste
4. **Explore**: Navegue pelos módulos disponíveis

## 📞 Suporte

- **Documentação**: Este arquivo
- **Issues**: GitHub Issues
- **Email**: dev@eventcad.com

---

**EventCAD+ - Transformando eventos em experiências inteligentes e seguras** 