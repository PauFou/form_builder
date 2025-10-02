#!/bin/bash
# Script d'arrêt complet pour le développement local

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Arrêt des services...${NC}"

# Arrêter Django si PID existe
if [ -f /tmp/django_dev.pid ]; then
    PID=$(cat /tmp/django_dev.pid)
    if ps -p $PID > /dev/null 2>&1; then
        kill $PID
        echo -e "${GREEN}✓${NC} Django API arrêté (PID: $PID)"
    fi
    rm -f /tmp/django_dev.pid
fi

# Arrêter PostgreSQL (optionnel - commenter si vous voulez le garder actif)
# brew services stop postgresql@14
# echo -e "${GREEN}✓${NC} PostgreSQL arrêté"

# Arrêter Redis (optionnel - commenter si vous voulez le garder actif)
# brew services stop redis
# echo -e "${GREEN}✓${NC} Redis arrêté"

echo ""
echo "Services arrêtés. Les bases de données restent actives."
echo "Pour tout arrêter complètement, décommentez les lignes dans le script."
