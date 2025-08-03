# 🪟 EventCAD+ - Guia de Instalação para Windows

## 📋 Pré-requisitos

1. **Docker Desktop para Windows**
   - Download: https://www.docker.com/products/docker-desktop
   - Requer Windows 10/11 Pro, Enterprise ou Education
   - WSL2 habilitado

2. **Git para Windows**
   - Download: https://git-scm.com/download/win

3. **Node.js** (opcional, para desenvolvimento)
   - Download: https://nodejs.org/

## 🚀 Instalação Passo a Passo

### 1. Instale o Docker Desktop

1. Baixe o Docker Desktop do site oficial
2. Execute o instalador
3. Reinicie o computador quando solicitado
4. Abra o Docker Desktop e aguarde inicializar
5. Verifique se está rodando:
```powershell
docker --version
docker-compose --version
```

### 2. Clone o Projeto

Abra o PowerShell como Administrador:
```powershell
# Navegue para sua pasta de projetos
cd C:\Projetos

# Clone o repositório
git clone <repository-url>
cd eventcad-plus
```

### 3. Configure o Ambiente

```powershell
# Copie o arquivo de exemplo
copy .env.example .env

# Abra o arquivo para editar
notepad .env
```

Edite as variáveis importantes:
```env
JWT_SECRET=mude-para-uma-chave-segura-aqui
DB_PASSWORD=senha-forte-do-banco
```

### 4. Inicie os Containers

```powershell
# Build das imagens
docker-compose build

# Inicie os serviços
docker-compose up -d

# Verifique se estão rodando
docker-compose ps
```

### 5. Configure o Banco de Dados

```powershell
# Execute as migrações
docker-compose exec backend npm run migration:run

# Popule o banco com dados iniciais
docker-compose exec backend npm run seed
```

## 🌐 Acessando a Aplicação

Após a instalação, acesse:

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000
- **Documentação API**: http://localhost:3000/api

**Credenciais padrão:**
- Email: admin@eventcad.com
- Senha: admin123

## 🛠️ Comandos Úteis no Windows

### Ver Logs
```powershell
# Todos os logs
docker-compose logs -f

# Logs do backend
docker-compose logs -f backend

# Logs do frontend
docker-compose logs -f frontend
```

### Gerenciar Serviços
```powershell
# Parar todos os serviços
docker-compose down

# Reiniciar um serviço
docker-compose restart backend

# Parar e remover tudo (incluindo volumes)
docker-compose down -v
```

### Acessar Containers
```powershell
# Acessar shell do backend
docker-compose exec backend sh

# Acessar banco de dados
docker-compose exec postgres psql -U eventcad -d eventcad
```

## 🚨 Resolução de Problemas

### Docker Desktop não inicia
1. Verifique se a virtualização está habilitada na BIOS
2. Habilite o WSL2:
```powershell
# Como Administrador
wsl --install
wsl --set-default-version 2
```

### Erro de porta em uso
```powershell
# Verificar qual processo está usando a porta
netstat -ano | findstr :3000
netstat -ano | findstr :80

# Matar o processo (substitua PID pelo número encontrado)
taskkill /F /PID <PID>
```

### Erro de permissão
- Execute o PowerShell como Administrador
- Certifique-se que o Docker Desktop está rodando

### Container não conecta ao banco
```powershell
# Reinicie os containers na ordem
docker-compose restart postgres
# Aguarde 10 segundos
docker-compose restart backend
```

## 🔧 Desenvolvimento Local (sem Docker)

Se preferir rodar localmente:

### Backend
```powershell
cd eventcad-backend
npm install
npm run start:dev
```

### Frontend
```powershell
# Em outro terminal
cd eventcad-frontend
npm install
npm run dev
```

## 📝 Script de Instalação Automática

Crie um arquivo `install.ps1`:
```powershell
# EventCAD+ Windows Installer
Write-Host "EventCAD+ Installer" -ForegroundColor Green
Write-Host "==================" -ForegroundColor Green

# Verificar Docker
if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker não encontrado! Instale o Docker Desktop primeiro." -ForegroundColor Red
    exit 1
}

# Criar .env se não existir
if (!(Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host ".env criado - edite antes de continuar" -ForegroundColor Yellow
    notepad .env
    Read-Host "Pressione Enter para continuar..."
}

# Build e start
Write-Host "Building containers..." -ForegroundColor Yellow
docker-compose build

Write-Host "Starting services..." -ForegroundColor Yellow
docker-compose up -d

Start-Sleep -Seconds 10

Write-Host "Running migrations..." -ForegroundColor Yellow
docker-compose exec backend npm run migration:run

Write-Host "Seeding database..." -ForegroundColor Yellow
docker-compose exec backend npm run seed

Write-Host "" 
Write-Host "Instalação completa!" -ForegroundColor Green
Write-Host "Acesse: http://localhost" -ForegroundColor Cyan
```

Execute com:
```powershell
.\install.ps1
```

## 🎉 Pronto!

EventCAD+ está rodando no Windows! 

Para parar tudo:
```powershell
docker-compose down
```

Para iniciar novamente:
```powershell
docker-compose up -d
```

## 📚 Links Úteis

- [Docker Desktop para Windows](https://docs.docker.com/desktop/windows/install/)
- [WSL2 Documentation](https://docs.microsoft.com/pt-br/windows/wsl/)
- [PowerShell Documentation](https://docs.microsoft.com/pt-br/powershell/)

---

**Dica**: Use o Windows Terminal para melhor experiência com múltiplas abas!