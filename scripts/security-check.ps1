# ===========================================
# EventCAD+ Security Check Script (PowerShell)
# ===========================================
# This script performs security checks on the project

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

Write-Host "🔒 EventCAD+ Security Check" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Check if we're in the right directory
if (-not (Test-Path "package.json") -and -not (Test-Path "docker-compose.yml")) {
    Write-Host "❌ Please run this script from the project root directory" -ForegroundColor $Red
    exit 1
}

Write-Host "🔍 Checking for security issues..." -ForegroundColor Cyan

# 1. Check for .env files in git
Write-Host "`n1. Checking for sensitive files in git..." -ForegroundColor White
try {
    $sensitiveFiles = git ls-files | Where-Object { $_ -match "\.(env|key|pem|crt|p12|pfx)$" }
    if ($sensitiveFiles) {
        Write-Status $false "Found sensitive files in git repository"
        $sensitiveFiles | ForEach-Object { Write-Host "  $_" -ForegroundColor $Red }
    } else {
        Write-Status $true "No sensitive files found in git"
    }
} catch {
    Write-Warning "Git not available or not a git repository"
}

# 2. Check for hardcoded secrets
Write-Host "`n2. Checking for hardcoded secrets..." -ForegroundColor White
$secretsFound = $false

# Check for common secret patterns
$secretPatterns = @(
    "password.*=",
    "secret.*=",
    "api_key.*=",
    "token.*="
)

foreach ($pattern in $secretPatterns) {
    try {
        $matches = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.json", "*.yml", "*.yaml" | 
                  Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
                  Select-String -Pattern $pattern -CaseSensitive:$false
        
        if ($matches) {
            Write-Warning "Potential hardcoded secrets found with pattern: $pattern"
            $matches | ForEach-Object { 
                Write-Host "  $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor $Yellow 
            }
            $secretsFound = $true
        }
    } catch {
        # Continue if no matches found
    }
}

if (-not $secretsFound) {
    Write-Status $true "No hardcoded secrets found"
}

# 3. Check for vulnerable dependencies
Write-Host "`n3. Checking for vulnerable dependencies..." -ForegroundColor White
if (Test-Path "package.json") {
    try {
        $auditResult = npm audit --audit-level=moderate 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Status $true "No high/moderate vulnerabilities found in dependencies"
        } else {
            Write-Status $false "Vulnerabilities found in dependencies"
            Write-Host $auditResult -ForegroundColor $Red
        }
    } catch {
        Write-Warning "npm audit failed or not available"
    }
}

# 4. Check Docker security
Write-Host "`n4. Checking Docker security..." -ForegroundColor White
if (Test-Path "docker-compose.yml") {
    # Check for exposed ports
    $dockerCompose = Get-Content "docker-compose.yml" -Raw
    if ($dockerCompose -match "ports:") {
        Write-Warning "Docker ports are exposed. Review for production."
    }
    
    # Check for root user
    if ($dockerCompose -match "user:\s*root") {
        Write-Status $false "Docker containers running as root"
    } else {
        Write-Status $true "Docker containers not running as root"
    }
}

# 5. Check for proper .gitignore
Write-Host "`n5. Checking .gitignore configuration..." -ForegroundColor White
if (Test-Path ".gitignore") {
    $gitignore = Get-Content ".gitignore" -Raw
    
    if ($gitignore -match "\.env") {
        Write-Status $true ".env files are ignored"
    } else {
        Write-Status $false ".env files are not ignored"
    }
    
    if ($gitignore -match "node_modules") {
        Write-Status $true "node_modules are ignored"
    } else {
        Write-Status $false "node_modules are not ignored"
    }
} else {
    Write-Status $false "No .gitignore file found"
}

# 6. Check for HTTPS in production configs
Write-Host "`n6. Checking HTTPS configuration..." -ForegroundColor White
try {
    $httpUrls = Get-ChildItem -Recurse -Include "*.ts", "*.js", "*.json" | 
                Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
                Select-String -Pattern "http://" | 
                Where-Object { $_.Line -notmatch "localhost" }
    
    if ($httpUrls) {
        Write-Warning "HTTP URLs found in code (not localhost)"
        $httpUrls | ForEach-Object { 
            Write-Host "  $($_.Filename):$($_.LineNumber) - $($_.Line.Trim())" -ForegroundColor $Yellow 
        }
    } else {
        Write-Status $true "No HTTP URLs found in production code"
    }
} catch {
    Write-Warning "Could not check HTTP URLs"
}

# 7. Check for proper CORS configuration
Write-Host "`n7. Checking CORS configuration..." -ForegroundColor White
try {
    $corsConfig = Get-ChildItem -Recurse -Include "*.ts", "*.js" | 
                  Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
                  Select-String -Pattern "cors" -CaseSensitive:$false
    
    if ($corsConfig) {
        Write-Status $true "CORS configuration found"
    } else {
        Write-Warning "CORS configuration not found"
    }
} catch {
    Write-Warning "Could not check CORS configuration"
}

# 8. Check for rate limiting
Write-Host "`n8. Checking rate limiting..." -ForegroundColor White
try {
    $rateLimit = Get-ChildItem -Recurse -Include "*.ts", "*.js" | 
                 Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
                 Select-String -Pattern "rate.*limit" -CaseSensitive:$false
    
    if ($rateLimit) {
        Write-Status $true "Rate limiting found"
    } else {
        Write-Warning "Rate limiting not found"
    }
} catch {
    Write-Warning "Could not check rate limiting"
}

# 9. Check for input validation
Write-Host "`n9. Checking input validation..." -ForegroundColor White
try {
    $validation = Get-ChildItem -Recurse -Include "*.ts", "*.js" | 
                  Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
                  Select-String -Pattern "zod|class-validator|joi" -CaseSensitive:$false
    
    if ($validation) {
        Write-Status $true "Input validation found"
    } else {
        Write-Warning "Input validation not found"
    }
} catch {
    Write-Warning "Could not check input validation"
}

# 10. Check for logging
Write-Host "`n10. Checking logging configuration..." -ForegroundColor White
try {
    $logging = Get-ChildItem -Recurse -Include "*.ts", "*.js" | 
               Where-Object { $_.FullName -notmatch "node_modules|\.git" } |
               Select-String -Pattern "logger|winston|pino" -CaseSensitive:$false
    
    if ($logging) {
        Write-Status $true "Logging configuration found"
    } else {
        Write-Warning "Logging configuration not found"
    }
} catch {
    Write-Warning "Could not check logging configuration"
}

Write-Host "`n🔒 Security check completed!" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Summary
Write-Host "`n📊 Summary:" -ForegroundColor White
Write-Host "- Run 'npm audit' to see detailed vulnerability report" -ForegroundColor Gray
Write-Host "- Review .env files and ensure they're not committed" -ForegroundColor Gray
Write-Host "- Check Docker configurations for production readiness" -ForegroundColor Gray
Write-Host "- Verify CORS and rate limiting are properly configured" -ForegroundColor Gray
Write-Host "- Ensure HTTPS is used in production" -ForegroundColor Gray

Write-Host "`n🛡️  Security recommendations:" -ForegroundColor White
Write-Host "1. Use environment variables for all secrets" -ForegroundColor Gray
Write-Host "2. Enable HTTPS in production" -ForegroundColor Gray
Write-Host "3. Implement proper rate limiting" -ForegroundColor Gray
Write-Host "4. Configure CORS properly" -ForegroundColor Gray
Write-Host "5. Use security headers (helmet)" -ForegroundColor Gray
Write-Host "6. Regular dependency updates" -ForegroundColor Gray
Write-Host "7. Implement proper logging" -ForegroundColor Gray
Write-Host "8. Use prepared statements for database queries" -ForegroundColor Gray
Write-Host "9. Validate all inputs" -ForegroundColor Gray
Write-Host "10. Implement proper error handling" -ForegroundColor Gray

exit 0 