#!/bin/bash

# 🚀 YouForm Clone - Docker Startup Script (Exotic Ports)
# This script starts all services with exotic, conflict-free ports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Print banner
echo -e "${MAGENTA}"
echo "╔══════════════════════════════════════════════════════════════╗"
echo "║                                                              ║"
echo "║    🎨 YouForm Clone - 100% Style Parity Edition 🎨          ║"
echo "║                                                              ║"
echo "║    Starting with EXOTIC PORTS to avoid conflicts!           ║"
echo "║                                                              ║"
echo "╚══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose is not installed. Please install it and try again.${NC}"
    exit 1
fi

echo -e "${CYAN}📦 Building Docker images...${NC}"
docker-compose -f docker-compose.exotic-ports.yml build

echo -e "${GREEN}✅ Images built successfully!${NC}"
echo ""

echo -e "${CYAN}🚀 Starting services...${NC}"
docker-compose -f docker-compose.exotic-ports.yml up -d

echo -e "${GREEN}✅ Services started!${NC}"
echo ""

# Wait for services to be healthy
echo -e "${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

echo -e "${CYAN}🔍 Checking service health...${NC}"
docker-compose -f docker-compose.exotic-ports.yml ps

echo ""
echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}║    ✨ YouForm Clone is LIVE on exotic ports! ✨             ║${NC}"
echo -e "${GREEN}║                                                              ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

echo -e "${CYAN}📍 Service Endpoints:${NC}"
echo ""
echo -e "  ${BLUE}🎨 Builder App:${NC}      ${GREEN}http://localhost:4242${NC}  (repeating pattern)"
echo -e "  ${BLUE}🚀 Runtime Viewer:${NC}   ${GREEN}http://localhost:8787${NC}  (repeating pattern)"
echo -e "  ${BLUE}🔌 Django API:${NC}       ${GREEN}http://localhost:3141${NC}  (π digits)"
echo -e "  ${BLUE}📊 Analytics:${NC}        ${GREEN}http://localhost:2718${NC}  (e digits)"
echo ""
echo -e "${CYAN}🗄️  Database Ports:${NC}"
echo ""
echo -e "  ${BLUE}🐘 PostgreSQL:${NC}       ${GREEN}localhost:7337${NC}  (LEET)"
echo -e "  ${BLUE}⚡ Redis:${NC}            ${GREEN}localhost:9876${NC}  (reverse seq)"
echo -e "  ${BLUE}📈 ClickHouse HTTP:${NC}  ${GREEN}localhost:5147${NC}  (random high)"
echo -e "  ${BLUE}📈 ClickHouse Native:${NC} ${GREEN}localhost:5148${NC}"
echo ""

echo -e "${YELLOW}💡 Useful Commands:${NC}"
echo ""
echo -e "  View logs:              ${CYAN}docker-compose -f docker-compose.exotic-ports.yml logs -f${NC}"
echo -e "  View specific service:  ${CYAN}docker-compose -f docker-compose.exotic-ports.yml logs -f builder${NC}"
echo -e "  Stop all services:      ${CYAN}docker-compose -f docker-compose.exotic-ports.yml down${NC}"
echo -e "  Restart a service:      ${CYAN}docker-compose -f docker-compose.exotic-ports.yml restart builder${NC}"
echo ""

echo -e "${GREEN}✨ Happy building! ✨${NC}"
echo ""

# Ask if user wants to follow logs
read -p "$(echo -e ${YELLOW}'Would you like to follow the logs? (y/n): '${NC})" -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${CYAN}📋 Following logs (Ctrl+C to exit)...${NC}"
    echo ""
    docker-compose -f docker-compose.exotic-ports.yml logs -f
fi
