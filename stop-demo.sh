#!/bin/bash

# Script pour arrêter tous les services de la démo

echo "🛑 Arrêt de tous les services Forms Platform"
echo "=========================================="
echo ""

# Couleurs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Arrêter les processus Django
echo -e "${YELLOW}Arrêt des serveurs Django...${NC}"
if pkill -f "python manage.py runserver"; then
    echo -e "${GREEN}✓ Serveurs Django arrêtés${NC}"
else
    echo "Aucun serveur Django en cours d'exécution"
fi

# Arrêter les processus Node.js (pnpm dev)
echo -e "\n${YELLOW}Arrêt des serveurs Node.js...${NC}"
if pkill -f "turbo dev"; then
    echo -e "${GREEN}✓ Serveurs Node.js arrêtés${NC}"
else
    echo "Aucun serveur Node.js en cours d'exécution"
fi

# Arrêter les processus Next.js spécifiques
if pkill -f "next dev"; then
    echo -e "${GREEN}✓ Serveurs Next.js arrêtés${NC}"
fi

# Vérifier les ports
echo -e "\n${YELLOW}Vérification des ports...${NC}"

check_port() {
    local PORT=$1
    local NAME=$2
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${RED}⚠️  Le port $PORT ($NAME) est toujours occupé${NC}"
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        echo "   PID: $PID - $(ps aux | grep $PID | grep -v grep | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')"
    else
        echo -e "${GREEN}✓ Port $PORT ($NAME) libre${NC}"
    fi
}

check_port 3000 "Marketing"
check_port 3001 "Builder"
check_port 3002 "Runtime Demo"
check_port 8000 "API Django"

echo -e "\n${GREEN}✅ Arrêt des services terminé${NC}"
echo ""
echo "Pour relancer la démo : ./start-demo.sh"