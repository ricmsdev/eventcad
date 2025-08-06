# ===========================================
# EventCAD+ Stop Development Environment
# ===========================================

Write-Host "🛑 Parando ambiente de desenvolvimento EventCAD+" -ForegroundColor Yellow

# Parar PostgreSQL
Write-Host "🐘 Parando PostgreSQL..." -ForegroundColor Yellow
docker-compose -f docker-compose.postgres.yml down

# Limpar containers parados
Write-Host "🧹 Limpando containers parados..." -ForegroundColor Yellow
docker container prune -f

Write-Host "✅ Ambiente parado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Para iniciar novamente:" -ForegroundColor Cyan
Write-Host "1. .\dev-setup.ps1" -ForegroundColor White
Write-Host "2. .\start-backend.ps1 (em um terminal)" -ForegroundColor White
Write-Host "3. .\start-frontend.ps1 (em outro terminal)" -ForegroundColor White 