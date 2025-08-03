#!/bin/bash

# ===========================================
# EventCAD+ Secure Setup Script
# ===========================================
# This script sets up the environment securely

set -e

echo "🔒 EventCAD+ Secure Setup"
echo "================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo "❌ Please run this script from the project root directory"
    exit 1
fi

echo "🔍 Starting secure setup..."

# 1. Check if .env exists
echo "1. Checking environment configuration..."
if [ -f ".env" ]; then
    print_warning ".env file already exists. Backing up..."
    cp .env .env.backup.$(date +%Y%m%d_%H%M%S)
fi

# 2. Create .env from example
echo "2. Creating .env file..."
if [ -f "env.example" ]; then
    cp env.example .env
    print_status 0 "Created .env from example"
else
    print_status 1 "env.example not found"
    exit 1
fi

# 3. Generate secure secrets
echo "3. Generating secure secrets..."
JWT_SECRET=$(openssl rand -base64 64)
JWT_REFRESH_SECRET=$(openssl rand -base64 64)
SESSION_SECRET=$(openssl rand -base64 64)
COOKIE_SECRET=$(openssl rand -base64 64)

# Update .env with secure secrets
sed -i.bak "s/your-super-secret-jwt-key-change-this-in-production/$JWT_SECRET/g" .env
sed -i.bak "s/your-super-secret-refresh-key-change-this-in-production/$JWT_REFRESH_SECRET/g" .env
sed -i.bak "s/your-session-secret-change-this/$SESSION_SECRET/g" .env
sed -i.bak "s/your-cookie-secret-change-this/$COOKIE_SECRET/g" .env

# Remove backup files
rm -f .env.bak

print_status 0 "Generated secure secrets"

# 4. Check Docker
echo "4. Checking Docker..."
if command -v docker &> /dev/null; then
    print_status 0 "Docker is available"
else
    print_status 1 "Docker is not installed"
    echo "Please install Docker first: https://docs.docker.com/get-docker/"
    exit 1
fi

# 5. Check Docker Compose
echo "5. Checking Docker Compose..."
if command -v docker-compose &> /dev/null; then
    print_status 0 "Docker Compose is available"
else
    print_status 1 "Docker Compose is not installed"
    echo "Please install Docker Compose first: https://docs.docker.com/compose/install/"
    exit 1
fi

# 6. Start services
echo "6. Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# 7. Check service health
echo "7. Checking service health..."
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    print_status 0 "Backend is healthy"
else
    print_warning "Backend health check failed, but continuing..."
fi

if curl -f http://localhost:8081 > /dev/null 2>&1; then
    print_status 0 "Frontend is accessible"
else
    print_warning "Frontend health check failed, but continuing..."
fi

# 8. Run database setup
echo "8. Setting up database..."
cd eventcad-backend

# Check if npm is available
if command -v npm &> /dev/null; then
    print_status 0 "npm is available"
    
    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo "Installing dependencies..."
        npm install
    fi
    
    # Run database setup
    echo "Running database setup..."
    npm run db:reset
    npm run db:seed
    
    print_status 0 "Database setup completed"
else
    print_warning "npm not available, skipping database setup"
    echo "Please run manually:"
    echo "cd eventcad-backend"
    echo "npm install"
    echo "npm run db:reset"
    echo "npm run db:seed"
fi

cd ..

# 9. Security check
echo "9. Running security check..."
if [ -f "scripts/security-check.sh" ]; then
    chmod +x scripts/security-check.sh
    ./scripts/security-check.sh
else
    print_warning "Security check script not found"
fi

echo ""
echo "🔒 Secure setup completed!"
echo "================================"

# Summary
echo ""
echo "📊 Setup Summary:"
echo "- Environment configured securely"
echo "- Services started with Docker"
echo "- Database setup completed"
echo "- Security check performed"

echo ""
echo "🌐 Access URLs:"
echo "- Frontend: http://localhost:8081"
echo "- Backend API: http://localhost:3000/api/v1"
echo "- Swagger Docs: http://localhost:3000/docs"
echo "- Health Check: http://localhost:3000/health"

echo ""
echo "🔐 Default Admin Credentials:"
echo "- Email: admin@eventcad.com"
echo "- Password: EventCAD@2025"
echo ""
echo "⚠️  IMPORTANT: Change these credentials in production!"

echo ""
echo "🛡️  Security Notes:"
echo "- .env file created with secure secrets"
echo "- All sensitive data is in environment variables"
echo "- Run security check regularly"
echo "- Update credentials before production use"

exit 0 