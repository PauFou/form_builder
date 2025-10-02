#!/bin/bash
# Script de démarrage complet pour le développement local
# Form Builder Platform

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}   Form Builder Platform - Démarrage Complet   ${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. Démarrer PostgreSQL
echo -e "${YELLOW}[1/5]${NC} Démarrage PostgreSQL..."
if brew services list | grep postgresql@14 | grep started > /dev/null; then
    echo -e "${GREEN}✓${NC} PostgreSQL déjà démarré"
else
    brew services start postgresql@14
    sleep 2
    echo -e "${GREEN}✓${NC} PostgreSQL démarré"
fi

# 2. Démarrer Redis
echo -e "${YELLOW}[2/5]${NC} Démarrage Redis..."
if brew services list | grep redis | grep started > /dev/null; then
    echo -e "${GREEN}✓${NC} Redis déjà démarré"
else
    brew services start redis
    sleep 1
    echo -e "${GREEN}✓${NC} Redis démarré"
fi

# 3. Vérifier connexions
echo -e "${YELLOW}[3/5]${NC} Vérification des connexions..."
psql -U forms_user -d forms_db -c "SELECT 'PostgreSQL OK' as status;" > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} PostgreSQL accessible"
redis-cli ping > /dev/null 2>&1 && echo -e "${GREEN}✓${NC} Redis accessible"

# 4. Démarrer Django API
echo -e "${YELLOW}[4/5]${NC} Démarrage Django API (port 8888)..."
cd services/api
python manage.py runserver 8888 > /tmp/django_dev.log 2>&1 &
DJANGO_PID=$!
echo "$DJANGO_PID" > /tmp/django_dev.pid
sleep 3

if curl -s http://localhost:8888/health > /dev/null; then
    echo -e "${GREEN}✓${NC} Django API opérationnel (PID: $DJANGO_PID)"
else
    echo -e "${RED}✗${NC} Erreur démarrage Django API"
    echo "Logs: tail -f /tmp/django_dev.log"
    exit 1
fi

cd ../..

# 5. Afficher informations
echo -e "${YELLOW}[5/5]${NC} Résumé des services..."
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   ✅ Tous les services sont opérationnels !${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Services démarrés:"
echo "  • PostgreSQL: localhost:5432 (forms_db)"
echo "  • Redis: localhost:6379"
echo "  • Django API: http://localhost:8888"
echo ""
echo "User de test:"
echo "  • Email: dev@local.com"
echo "  • Password: dev123"
echo ""
echo "Commandes utiles:"
echo "  • Tester API: python3 test_login_api.py"
echo "  • Logs Django: tail -f /tmp/django_dev.log"
echo "  • Arrêter: ./stop-dev-complete.sh"
echo ""
echo "Pour démarrer le frontend:"
echo "  • Marketing: cd apps/marketing && pnpm dev  # Port 3300"
echo "  • Builder: cd apps/builder && pnpm dev      # Port 3301"
echo ""
