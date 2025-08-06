# ===========================================
# EventCAD+ Development Setup Script
# ===========================================

Write-Host "🚀 Configurando ambiente de desenvolvimento EventCAD+" -ForegroundColor Green

# 1. Parar containers existentes
Write-Host "📦 Parando containers existentes..." -ForegroundColor Yellow
docker-compose down 2>$null
docker-compose -f docker-compose.postgres.yml down 2>$null

# 2. Iniciar apenas o PostgreSQL
Write-Host "🐘 Iniciando PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.postgres.yml up -d

# 3. Aguardar PostgreSQL estar pronto
Write-Host "⏳ Aguardando PostgreSQL estar pronto..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# 4. Verificar se PostgreSQL está rodando
$maxAttempts = 30
$attempt = 0
$postgresReady = $false

while ($attempt -lt $maxAttempts -and -not $postgresReady) {
    try {
        $result = docker exec eventcad-postgres-dev pg_isready -U eventcad_user -d eventcad_dev 2>$null
        if ($LASTEXITCODE -eq 0) {
            $postgresReady = $true
            Write-Host "✅ PostgreSQL está pronto!" -ForegroundColor Green
        } else {
            $attempt++
            Write-Host "⏳ Tentativa $attempt/$maxAttempts - Aguardando PostgreSQL..." -ForegroundColor Yellow
            Start-Sleep -Seconds 2
        }
    } catch {
        $attempt++
        Start-Sleep -Seconds 2
    }
}

if (-not $postgresReady) {
    Write-Host "❌ Erro: PostgreSQL não conseguiu inicializar" -ForegroundColor Red
    exit 1
}

# 5. Instalar dependências do backend
Write-Host "📦 Instalando dependências do backend..." -ForegroundColor Yellow
Set-Location eventcad-backend
if (Test-Path "node_modules") {
    Write-Host "📦 Dependências já instaladas" -ForegroundColor Green
} else {
    npm install
}

# 6. Executar migrações do banco
Write-Host "🗄️ Executando migrações do banco..." -ForegroundColor Yellow
npm run build
npm run db:migrate

# 7. Executar seed do banco
Write-Host "🌱 Executando seed do banco..." -ForegroundColor Yellow
npm run db:seed

# 8. Voltar para o diretório raiz
Set-Location ..

# 9. Instalar dependências do frontend
Write-Host "📦 Instalando dependências do frontend..." -ForegroundColor Yellow
Set-Location eventcad-frontend
if (Test-Path "node_modules") {
    Write-Host "📦 Dependências já instaladas" -ForegroundColor Green
} else {
    npm install
}

# 10. Voltar para o diretório raiz
Set-Location ..

Write-Host "✅ Ambiente configurado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Terminal 1: cd eventcad-backend && npm run start:dev" -ForegroundColor White
Write-Host "2. Terminal 2: cd eventcad-frontend && npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "🌐 URLs:" -ForegroundColor Cyan
Write-Host "- Backend: http://localhost:3000" -ForegroundColor White
Write-Host "- Frontend: http://localhost:5173" -ForegroundColor White
Write-Host "- Swagger: http://localhost:3000/api/v1/docs" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Para parar o PostgreSQL: docker-compose -f docker-compose.postgres.yml down" -ForegroundColor Yellow 