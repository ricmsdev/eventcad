# Script para limpar cache e testar frontend
Write-Host "🧹 LIMPANDO CACHE E TESTANDO FRONTEND..." -ForegroundColor Cyan

# 1. Parar o container frontend
Write-Host "`n🛑 Parando container frontend..." -ForegroundColor Yellow
docker-compose stop frontend

# 2. Forçar recriação
Write-Host "`n🔄 Recriando container frontend..." -ForegroundColor Yellow
docker-compose up -d --force-recreate frontend

# 3. Aguardar container ficar healthy
Write-Host "`n⏳ Aguardando container ficar healthy..." -ForegroundColor Yellow
Start-Sleep 10

# 4. Verificar status
Write-Host "`n📊 Status dos containers:" -ForegroundColor Yellow
docker-compose ps

# 5. Testar se está servindo React
Write-Host "`n🧪 Testando se React está sendo servido..." -ForegroundColor Yellow
$response = Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing -Headers @{'Cache-Control'='no-cache'; 'Pragma'='no-cache'}
if ($response.Content -match "EventCAD") {
    Write-Host "✅ React app sendo servido corretamente!" -ForegroundColor Green
    Write-Host "📄 Título: EventCAD+ - Sistema Avançado de Gestão de Eventos" -ForegroundColor Cyan
} else {
    Write-Host "❌ Ainda servindo página padrão" -ForegroundColor Red
}

Write-Host "`n🌐 INSTRUÇÕES PARA VER O REACT APP:" -ForegroundColor Magenta
Write-Host "1. Abra uma janela anônima/privada no navegador" -ForegroundColor White
Write-Host "2. Acesse: http://localhost (sem :80)" -ForegroundColor White
Write-Host "3. Ou pressione Ctrl+Shift+Delete para limpar cache" -ForegroundColor White
Write-Host "4. Ou use Ctrl+F5 para forçar reload" -ForegroundColor White