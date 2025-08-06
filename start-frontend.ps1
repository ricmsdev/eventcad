# ===========================================
# EventCAD+ Frontend Development Script
# ===========================================

Write-Host "🚀 Iniciando EventCAD+ Frontend..." -ForegroundColor Green

# Navegar para o diretório do frontend
Set-Location eventcad-frontend

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Instalando dependências..." -ForegroundColor Yellow
    npm install
}

# Iniciar o frontend em modo desenvolvimento
Write-Host "🔥 Iniciando frontend em modo desenvolvimento..." -ForegroundColor Green
Write-Host "🌐 Frontend estará disponível em: http://localhost:5173" -ForegroundColor Cyan
Write-Host "📱 Hot reload ativado" -ForegroundColor Cyan
Write-Host ""
Write-Host "⏹️ Para parar: Ctrl+C" -ForegroundColor Yellow
Write-Host ""

npm run dev 