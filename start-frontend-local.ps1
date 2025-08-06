# Script para rodar o EventCAD+ Frontend localmente sem Docker

Write-Host "Iniciando EventCAD+ Frontend (Local)" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

# Verificar se o Node.js esta instalado
try {
    $nodeVersion = node --version
    Write-Host "Node.js encontrado: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "Node.js nao encontrado!" -ForegroundColor Red
    Write-Host "Por favor, instale o Node.js 18+ em: https://nodejs.org/" -ForegroundColor Yellow
    exit 1
}

# Verificar se o npm esta instalado
try {
    $npmVersion = npm --version
    Write-Host "npm encontrado: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "npm nao encontrado!" -ForegroundColor Red
    exit 1
}

# Navegar para o diretorio do frontend
Write-Host "Navegando para o diretorio do frontend..." -ForegroundColor Blue
Set-Location "eventcad-frontend"

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "Instalando dependencias..." -ForegroundColor Blue
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Erro ao instalar dependencias!" -ForegroundColor Red
        exit 1
    }
    Write-Host "Dependencias instaladas com sucesso!" -ForegroundColor Green
} else {
    Write-Host "Dependencias ja instaladas" -ForegroundColor Green
}

# Criar arquivo .env.local se nao existir
if (-not (Test-Path ".env.local")) {
    Write-Host "Criando arquivo de configuracao local..." -ForegroundColor Blue
    "VITE_API_URL=http://localhost:3000" | Out-File -FilePath ".env.local" -Encoding UTF8
    "VITE_APP_NAME=EventCAD+" | Out-File -FilePath ".env.local" -Encoding UTF8 -Append
    Write-Host "Arquivo .env.local criado!" -ForegroundColor Green
}

# Verificar se o backend esta rodando
Write-Host "Verificando se o backend esta rodando..." -ForegroundColor Blue
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "Backend esta rodando!" -ForegroundColor Green
} catch {
    Write-Host "Backend nao esta rodando na porta 3000" -ForegroundColor Yellow
    Write-Host "O frontend funcionara, mas as chamadas de API falharao" -ForegroundColor Yellow
    Write-Host "Para rodar o backend: ./start-backend.ps1" -ForegroundColor Cyan
}

# Iniciar o servidor de desenvolvimento
Write-Host "Iniciando servidor de desenvolvimento..." -ForegroundColor Blue
Write-Host "URL: http://localhost:3001" -ForegroundColor Cyan
Write-Host "Pressione Ctrl+C para parar" -ForegroundColor Yellow
Write-Host ""

npm run dev 