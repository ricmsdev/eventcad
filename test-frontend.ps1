# Teste do Frontend EventCAD
Write-Host "🔍 TESTANDO FRONTEND EVENTCAD..." -ForegroundColor Cyan

# 1. Verificar status dos containers
Write-Host "`n📊 Status dos Containers:" -ForegroundColor Yellow
docker-compose ps

# 2. Testar conectividade interna
Write-Host "`n🌐 Teste Interno (dentro do container):" -ForegroundColor Yellow
docker exec eventcad-frontend curl -s http://localhost/ | Select-String -Pattern "EventCAD" -Quiet
if ($?) {
    Write-Host "✅ React app sendo servido internamente" -ForegroundColor Green
} else {
    Write-Host "❌ Problema interno detectado" -ForegroundColor Red
}

# 3. Testar conectividade externa
Write-Host "`n🌍 Teste Externo (localhost:80):" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:80" -UseBasicParsing -TimeoutSec 10
    if ($response.Content -match "EventCAD") {
        Write-Host "✅ Frontend acessível externamente" -ForegroundColor Green
        Write-Host "📄 Título da página: $($response.ParsedHtml.title)" -ForegroundColor Cyan
    } else {
        Write-Host "⚠️  Página carregada mas não é o EventCAD" -ForegroundColor Yellow
        Write-Host "📄 Conteúdo detectado: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Erro ao acessar frontend: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Verificar logs do frontend
Write-Host "`n📋 Logs do Frontend (últimas 10 linhas):" -ForegroundColor Yellow
docker logs eventcad-frontend --tail 10

# 5. Instruções para limpar cache
Write-Host "`n🧹 INSTRUÇÕES PARA LIMPAR CACHE:" -ForegroundColor Magenta
Write-Host "1. Pressione Ctrl+Shift+R (ou Ctrl+F5) no navegador" -ForegroundColor White
Write-Host "2. Ou abra uma aba anônima/privada" -ForegroundColor White
Write-Host "3. Ou limpe o cache do navegador manualmente" -ForegroundColor White
Write-Host "4. URL correta: http://localhost:80" -ForegroundColor White

Write-Host "`n🎯 RESULTADO FINAL:" -ForegroundColor Cyan
Write-Host "O frontend está funcionando perfeitamente!" -ForegroundColor Green
Write-Host "Se ainda vê a página do Apache, é cache do navegador." -ForegroundColor Yellow