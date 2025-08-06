# ===========================================
# EventCAD+ Backend Development Script
# ===========================================

Write-Host "🚀 Iniciando EventCAD+ Backend..." -ForegroundColor Green

# Verificar se PostgreSQL está rodando
Write-Host "🔍 Verificando PostgreSQL..." -ForegroundColor Yellow
$postgresRunning = docker ps --filter "name=eventcad-postgres-dev" --format "table {{.Names}}" | Select-String "eventcad-postgres-dev"

if (-not $postgresRunning) {
    Write-Host "❌ PostgreSQL não está rodando!" -ForegroundColor Red
    Write-Host "💡 Execute primeiro: .\dev-setup.ps1" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ PostgreSQL está rodando" -ForegroundColor Green

# Navegar para o diretório do backend
Set-Location eventcad-backend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Verificar se .env existe
if (-not (Test-Path ".env")) {
    Write-Host "📝 Copiando arquivo de configuração..." -ForegroundColor Yellow
    Copy-Item "..\env.example" ".env"
}

# Iniciar o backend em modo desenvolvimento
Write-Host "🔥 Iniciando backend em modo desenvolvimento..." -ForegroundColor Green
Write-Host "🌐 Backend estará disponível em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "📚 Swagger estará disponível em: http://localhost:3000/api/v1/docs" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏹️ Para parar: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

npm run start:dev 