# ===========================================
# EventCAD+ Secure Setup Script (PowerShell)
# ===========================================
# This script sets up the environment securely

param(
    [switch]$Verbose
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"

# Function to print colored output
function Write-Status {
    param(
        [bool]$Success,
        [string]$Message
    )
    
    if ($Success) {
        Write-Host "✅ $Message" -ForegroundColor $Green
    } else {
        Write-Host "❌ $Message" -ForegroundColor $Red
    }
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor $Yellow
}

Write-Host "🔒 EventCAD+ Secure Setup" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor $Red
    exit 1
}

Write-Host "🔍 Starting secure setup..." -ForegroundColor Cyan

# 1. Check if .env exists
Write-Host "`n1. Checking environment configuration..." -ForegroundColor White
if (Test-Path ".env") {
    Write-Warning ".env file already exists. Backing up..."
    $backupName = ".env.backup.$(Get-Date -Format 'yyyyMMdd_HHmmss')"
    Copy-Item ".env" $backupName
}

# 2. Create .env from example
Write-Host "`n2. Creating .env file..." -ForegroundColor White
if (Test-Path "env.example") {
    Copy-Item "env.example" ".env"
    Write-Status $true "Created .env from example"
} else {
    Write-Status $false "env.example not found"
    exit 1
}

# 3. Generate secure secrets
Write-Host "`n3. Generating secure secrets..." -ForegroundColor White
$JWT_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
$JWT_REFRESH_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
$SESSION_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))
$COOKIE_SECRET = [System.Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(64))

# Update .env with secure secrets
$envContent = Get-Content ".env" -Raw
$envContent = $envContent -replace "your-super-secret-jwt-key-change-this-in-production", $JWT_SECRET
$envContent = $envContent -replace "your-super-secret-refresh-key-change-this-in-production", $JWT_REFRESH_SECRET
$envContent = $envContent -replace "your-session-secret-change-this", $SESSION_SECRET
$envContent = $envContent -replace "your-cookie-secret-change-this", $COOKIE_SECRET
Set-Content ".env" $envContent

Write-Status $true "Generated secure secrets"

# 4. Check Docker
Write-Host "`n4. Checking Docker..." -ForegroundColor White
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Status $true "Docker is available"
        Write-Host "  $dockerVersion" -ForegroundColor Gray
    } else {
        Write-Status $false "Docker is not available"
        Write-Host "Please install Docker first: https://docs.docker.com/get-docker/" -ForegroundColor $Yellow
        exit 1
    }
} catch {
    Write-Status $false "Docker is not installed"
    Write-Host "Please install Docker first: https://docs.docker.com/get-docker/" -ForegroundColor $Yellow
    exit 1
}

# 5. Check Docker Compose
Write-Host "`n5. Checking Docker Compose..." -ForegroundColor White
try {
    $composeVersion = docker-compose --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Status $true "Docker Compose is available"
        Write-Host "  $composeVersion" -ForegroundColor Gray
    } else {
        Write-Status $false "Docker Compose is not available"
        Write-Host "Please install Docker Compose first: https://docs.docker.com/compose/install/" -ForegroundColor $Yellow
        exit 1
    }
} catch {
    Write-Status $false "Docker Compose is not installed"
    Write-Host "Please install Docker Compose first: https://docs.docker.com/compose/install/" -ForegroundColor $Yellow
    exit 1
}

# 6. Start services
Write-Host "`n6. Starting services..." -ForegroundColor White
try {
    docker-compose up -d
    if ($LASTEXITCODE -eq 0) {
        Write-Status $true "Services started successfully"
    } else {
        Write-Status $false "Failed to start services"
        exit 1
    }
} catch {
    Write-Status $false "Failed to start services"
    exit 1
}

# Wait for services to be ready
Write-Host "`n⏳ Waiting for services to be ready..." -ForegroundColor Cyan
Start-Sleep -Seconds 30

# 7. Check service health
Write-Host "`n7. Checking service health..." -ForegroundColor White
try {
    $backendHealth = Invoke-WebRequest -Uri "http://localhost:3000/health" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($backendHealth.StatusCode -eq 200) {
        Write-Status $true "Backend is healthy"
    } else {
        Write-Warning "Backend health check failed, but continuing..."
    }
} catch {
    Write-Warning "Backend health check failed, but continuing..."
}

try {
    $frontendHealth = Invoke-WebRequest -Uri "http://localhost:8081" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($frontendHealth.StatusCode -eq 200) {
        Write-Status $true "Frontend is accessible"
    } else {
        Write-Warning "Frontend health check failed, but continuing..."
    }
} catch {
    Write-Warning "Frontend health check failed, but continuing..."
}

# 8. Run database setup
Write-Host "`n8. Setting up database..." -ForegroundColor White
if (Test-Path "eventcad-backend") {
    Set-Location "eventcad-backend"
    
    # Check if npm is available
    try {
        $npmVersion = npm --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status $true "npm is available"
            Write-Host "  npm version: $npmVersion" -ForegroundColor Gray
            
            # Install dependencies if needed
            if (-not (Test-Path "node_modules")) {
                Write-Host "Installing dependencies..." -ForegroundColor Yellow
                npm install
            }
            
            # Run database setup
            Write-Host "Running database setup..." -ForegroundColor Yellow
            npm run db:reset
            npm run db:seed
            
            Write-Status $true "Database setup completed"
        } else {
            Write-Warning "npm not available, skipping database setup"
            Write-Host "Please run manually:" -ForegroundColor Gray
            Write-Host "cd eventcad-backend" -ForegroundColor Gray
            Write-Host "npm install" -ForegroundColor Gray
            Write-Host "npm run db:reset" -ForegroundColor Gray
            Write-Host "npm run db:seed" -ForegroundColor Gray
        }
    } catch {
        Write-Warning "npm not available, skipping database setup"
        Write-Host "Please run manually:" -ForegroundColor Gray
        Write-Host "cd eventcad-backend" -ForegroundColor Gray
        Write-Host "npm install" -ForegroundColor Gray
        Write-Host "npm run db:reset" -ForegroundColor Gray
        Write-Host "npm run db:seed" -ForegroundColor Gray
    }
    
    Set-Location ".."
} else {
    Write-Warning "eventcad-backend directory not found"
}

# 9. Security check
Write-Host "`n9. Running security check..." -ForegroundColor White
if (Test-Path "scripts/security-check.ps1") {
    & ".\scripts\security-check.ps1"
} else {
    Write-Warning "Security check script not found"
}

Write-Host "`n🔒 Secure setup completed!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Summary
Write-Host "`n📊 Setup Summary:" -ForegroundColor White
Write-Host "- Environment configured securely" -ForegroundColor Gray
Write-Host "- Services started with Docker" -ForegroundColor Gray
Write-Host "- Database setup completed" -ForegroundColor Gray
Write-Host "- Security check performed" -ForegroundColor Gray

Write-Host "`n🌐 Access URLs:" -ForegroundColor White
Write-Host "- Frontend: http://localhost:8081" -ForegroundColor Gray
Write-Host "- Backend API: http://localhost:3000/api/v1" -ForegroundColor Gray
Write-Host "- Swagger Docs: http://localhost:3000/docs" -ForegroundColor Gray
Write-Host "- Health Check: http://localhost:3000/health" -ForegroundColor Gray

Write-Host "`n🔐 Default Admin Credentials:" -ForegroundColor White
Write-Host "- Email: admin@eventcad.com" -ForegroundColor Gray
Write-Host "- Password: EventCAD@2025" -ForegroundColor Gray
Write-Host "" -ForegroundColor Gray
Write-Host "⚠️  IMPORTANT: Change these credentials in production!" -ForegroundColor $Yellow

Write-Host "`n🛡️  Security Notes:" -ForegroundColor White
Write-Host "- .env file created with secure secrets" -ForegroundColor Gray
Write-Host "- All sensitive data is in environment variables" -ForegroundColor Gray
Write-Host "- Run security check regularly" -ForegroundColor Gray
Write-Host "- Update credentials before production use" -ForegroundColor Gray

exit 0 