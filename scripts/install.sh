#!/bin/bash

# EventCAD+ Installation Script
set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ASCII Art
echo -e "${GREEN}"
echo "  _____                 _    ____    _    ____    _   "
echo " | ____|_   _____ _ __ | |_ / ___|  / \  |  _ \ _| |_ "
echo " |  _| \ \ / / _ \ '_ \| __| |     / _ \ | | | |_   _|"
echo " | |___ \ V /  __/ | | | |_| |___ / ___ \| |_| | |_|  "
echo " |_____| \_/ \___|_| |_|\__|\____/_/   \_\____/       "
echo -e "${NC}"
echo "EventCAD+ Installation Script v1.0"
echo "=================================="
echo ""

# Check requirements
echo -e "${YELLOW}Checking requirements...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker is not installed! Please install Docker first.${NC}"
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose is not installed! Please install Docker Compose first.${NC}"
    echo "Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo -e "${RED}Docker is not running! Please start Docker.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ All requirements met!${NC}"
echo ""

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please edit .env file with your configuration before continuing.${NC}"
    read -p "Press enter when ready to continue..."
fi

# Create necessary directories
echo -e "${YELLOW}Creating directories...${NC}"
mkdir -p uploads logs backups
chmod 755 uploads logs backups
echo -e "${GREEN}✓ Directories created${NC}"

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

# Start services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check if services are running
echo -e "${YELLOW}Checking services status...${NC}"
docker-compose ps

# Run migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec backend npm run migration:run

# Seed database
echo -e "${YELLOW}Seeding database...${NC}"
docker-compose exec backend npm run seed

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EventCAD+ Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Access the application at:"
echo -e "  Frontend: ${GREEN}http://localhost${NC}"
echo -e "  Backend API: ${GREEN}http://localhost:3000${NC}"
echo -e "  API Documentation: ${GREEN}http://localhost:3000/api${NC}"
echo ""
echo "Default credentials:"
echo -e "  Email: ${YELLOW}admin@eventcad.com${NC}"
echo -e "  Password: ${YELLOW}admin123${NC}"
echo ""
echo "Useful commands:"
echo "  make logs         - View logs"
echo "  make down         - Stop services"
echo "  make restart      - Restart services"
echo "  make help         - Show all commands"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"