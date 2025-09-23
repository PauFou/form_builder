#!/bin/bash

# Script de diagnostic pour vérifier la configuration

echo "🔍 Diagnostic de Forms Platform"
echo "==============================="
echo ""

# Couleurs
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Fonction de test
test_service() {
    local name=$1
    local url=$2
    
    echo -n "Checking $name... "
    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|404\|405"; then
        echo -e "${GREEN}✓ OK${NC}"
        return 0
    else
        echo -e "${RED}✗ FAILED${NC}"
        return 1
    fi
}

# 1. Vérifier Python et l'environnement virtuel
echo -e "${BLUE}1. Environnement Python${NC}"
echo -n "Python: "
if command -v python3 &> /dev/null; then
    echo -e "${GREEN}✓ $(python3 --version)${NC}"
else
    echo -e "${RED}✗ Non installé${NC}"
fi

echo -n "Environnement virtuel Django: "
if [ -f "services/api/.venv/bin/activate" ]; then
    echo -e "${GREEN}✓ Présent${NC}"
else
    echo -e "${YELLOW}⚠ Absent (sera créé)${NC}"
fi

# 2. Vérifier Node.js et pnpm
echo -e "\n${BLUE}2. Environnement Node.js${NC}"
echo -n "Node.js: "
if command -v node &> /dev/null; then
    echo -e "${GREEN}✓ $(node --version)${NC}"
else
    echo -e "${RED}✗ Non installé${NC}"
fi

echo -n "pnpm: "
if command -v pnpm &> /dev/null; then
    echo -e "${GREEN}✓ $(pnpm --version)${NC}"
else
    echo -e "${RED}✗ Non installé${NC}"
fi

# 3. Vérifier les services
echo -e "\n${BLUE}3. Test des services${NC}"

# API Django
test_service "API Django (http://localhost:8000)" "http://localhost:8000/health/"

# Frontend
test_service "Marketing (http://localhost:3000)" "http://localhost:3000"
test_service "Builder (http://localhost:3001)" "http://localhost:3001"

# 4. Vérifier les endpoints API critiques
echo -e "\n${BLUE}4. Endpoints API${NC}"
if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health/" | grep -q "200"; then
    test_service "Health Check" "http://localhost:8000/health/"
    test_service "Auth Login" "http://localhost:8000/v1/auth/login/"
    test_service "API Docs" "http://localhost:8000/v1/docs/swagger/"
fi

# 5. Instructions
echo -e "\n${BLUE}5. État général${NC}"
api_running=false
frontend_running=false

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/health/" | grep -q "200"; then
    api_running=true
fi

if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" | grep -q "200"; then
    frontend_running=true
fi

if $api_running && $frontend_running; then
    echo -e "${GREEN}✅ Tout fonctionne correctement!${NC}"
    echo ""
    echo "Compte de test: test@example.com / Test1234!"
elif $api_running && ! $frontend_running; then
    echo -e "${YELLOW}⚠️  L'API fonctionne mais pas le frontend${NC}"
    echo ""
    echo "Lancez le frontend avec:"
    echo -e "${BLUE}pnpm dev${NC}"
elif ! $api_running && $frontend_running; then
    echo -e "${YELLOW}⚠️  Le frontend fonctionne mais pas l'API${NC}"
    echo ""
    echo "Lancez l'API avec:"
    echo -e "${BLUE}cd services/api && source .venv/bin/activate && python manage.py runserver${NC}"
else
    echo -e "${RED}❌ Aucun service ne fonctionne${NC}"
    echo ""
    echo -e "${YELLOW}Utilisez ./start-dev-simple.sh pour les instructions de démarrage${NC}"
fi

echo ""