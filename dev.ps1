# Script de desenvolvimento para EventCAD+
# Uso: .\dev.ps1 [comando]
# Comandos disponíveis: start, stop, restart, logs, status, test

param(
    [Parameter(Position=0)]
    [string]$Command = "start"
)

function Start-DevEnvironment {
    Write-Host "Iniciando ambiente de desenvolvimento..." -ForegroundColor Green
    docker-compose -f docker-compose.dev.yml up -d
    Write-Host "Ambiente iniciado!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:3001" -ForegroundColor Cyan
    Write-Host "Backend: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "Swagger: http://localhost:3000/docs" -ForegroundColor Cyan
    Write-Host "Health: http://localhost:3000/health" -ForegroundColor Cyan
}

function Stop-DevEnvironment {
    Write-Host "Parando ambiente de desenvolvimento..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    Write-Host "Ambiente parado!" -ForegroundColor Green
}

function Restart-DevEnvironment {
    Write-Host "Reiniciando ambiente de desenvolvimento..." -ForegroundColor Yellow
    docker-compose -f docker-compose.dev.yml down
    docker-compose -f docker-compose.dev.yml up -d
    Write-Host "Ambiente reiniciado!" -ForegroundColor Green
}

function Show-Logs {
    param([string]$Service = "all")
    
    if ($Service -eq "all") {
        Write-Host "Mostrando logs de todos os servicos..." -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml logs -f
    } else {
        Write-Host "Mostrando logs do servico: $Service" -ForegroundColor Cyan
        docker-compose -f docker-compose.dev.yml logs -f $Service
    }
}

function Show-Status {
    Write-Host "Status dos containers:" -ForegroundColor Cyan
    docker-compose -f docker-compose.dev.yml ps
}

function Test-Environment {
    Write-Host "Testando ambiente..." -ForegroundColor Cyan
    
    # Teste do backend
    try {
        $backendHealth = Invoke-RestMethod -Uri "http://localhost:3000/health" -Method GET -TimeoutSec 5
        Write-Host "Backend: OK" -ForegroundColor Green
    } catch {
        Write-Host "Backend: ERRO" -ForegroundColor Red
    }
    
    # Teste do frontend
    try {
        $frontendResponse = Invoke-WebRequest -Uri "http://localhost:3001" -Method GET -TimeoutSec 5
        Write-Host "Frontend: OK" -ForegroundColor Green
    } catch {
        Write-Host "Frontend: ERRO" -ForegroundColor Red
    }
    
    # Teste do banco
    try {
        $dbTest = docker-compose -f docker-compose.dev.yml exec -T postgres pg_isready -U eventcad
        if ($LASTEXITCODE -eq 0) {
            Write-Host "Database: OK" -ForegroundColor Green
        } else {
            Write-Host "Database: ERRO" -ForegroundColor Red
        }
    } catch {
        Write-Host "Database: ERRO" -ForegroundColor Red
    }
}

function Show-Help {
    Write-Host "Script de Desenvolvimento EventCAD+" -ForegroundColor Magenta
    Write-Host ""
    Write-Host "Uso: .\dev.ps1 [comando]" -ForegroundColor White
    Write-Host ""
    Write-Host "Comandos disponiveis:" -ForegroundColor Yellow
    Write-Host "  start    - Inicia o ambiente de desenvolvimento" -ForegroundColor White
    Write-Host "  stop     - Para o ambiente de desenvolvimento" -ForegroundColor White
    Write-Host "  restart  - Reinicia o ambiente de desenvolvimento" -ForegroundColor White
    Write-Host "  logs     - Mostra logs dos containers" -ForegroundColor White
    Write-Host "  status   - Mostra status dos containers" -ForegroundColor White
    Write-Host "  test     - Testa se o ambiente esta funcionando" -ForegroundColor White
    Write-Host "  help     - Mostra esta ajuda" -ForegroundColor White
    Write-Host ""
    Write-Host "Exemplos:" -ForegroundColor Yellow
    Write-Host "  .\dev.ps1 start" -ForegroundColor White
    Write-Host "  .\dev.ps1 logs backend" -ForegroundColor White
    Write-Host "  .\dev.ps1 test" -ForegroundColor White
}

# Execução baseada no comando
switch ($Command.ToLower()) {
    "start" { Start-DevEnvironment }
    "stop" { Stop-DevEnvironment }
    "restart" { Restart-DevEnvironment }
    "logs" { Show-Logs }
    "status" { Show-Status }
    "test" { Test-Environment }
    "help" { Show-Help }
    default { 
        Write-Host "Comando '$Command' nao reconhecido!" -ForegroundColor Red
        Show-Help
    }
} 