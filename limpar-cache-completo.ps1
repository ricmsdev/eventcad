# Script para limpar cache completo e testar EventCAD+

Write-Host "=== LIMPEZA COMPLETA DE CACHE DO EVENTCAD+ ===" -ForegroundColor Cyan

Write-Host "`n1. Abra o Chrome/Edge/Firefox" -ForegroundColor Yellow
Write-Host "2. Pressione F12 (DevTools)" -ForegroundColor Yellow
Write-Host "3. Clique com botão direito no botão Refresh" -ForegroundColor Yellow
Write-Host "4. Selecione 'Empty Cache and Hard Reload'" -ForegroundColor Yellow

Write-Host "`n=== OU USE UMA ABA ANÔNIMA/PRIVADA ===" -ForegroundColor Green
Write-Host "Chrome/Edge: Ctrl+Shift+N" -ForegroundColor Green
Write-Host "Firefox: Ctrl+Shift+P" -ForegroundColor Green

Write-Host "`n=== TESTE DIRETO ===" -ForegroundColor Cyan
Write-Host "Testando conexão..." -ForegroundColor White

# Teste básico
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8081" -UseBasicParsing -TimeoutSec 5
    Write-Host "✅ Frontend respondendo! Status: $($response.StatusCode)" -ForegroundColor Green
    
    # Verificar se tem conteúdo React
    if ($response.Content -like "*root*") {
        Write-Host "✅ HTML com div root encontrado!" -ForegroundColor Green
    }
    
    # Testar assets
    $assetTest = Invoke-WebRequest -Uri "http://localhost:8081/vite.svg" -UseBasicParsing -TimeoutSec 5
    if ($assetTest.StatusCode -eq 200) {
        Write-Host "✅ Assets estão sendo servidos!" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Erro ao acessar frontend: $_" -ForegroundColor Red
}

Write-Host "`n=== STATUS DO DOCKER ===" -ForegroundColor Cyan
docker-compose ps

Write-Host "`n🚀 ACESSE: http://localhost:8081" -ForegroundColor Magenta
Write-Host "   Use uma aba anônima para melhores resultados!" -ForegroundColor Yellow