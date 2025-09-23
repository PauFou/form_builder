#!/bin/bash

# Script simple pour démarrer le développement
# Lance l'API et le frontend dans des processus séparés

echo "🚀 Démarrage simple de Forms Platform"
echo "===================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Préparer l'API Django
echo -e "${BLUE}Préparation de l'API Django...${NC}"
cd services/api

# Vérifier l'environnement virtuel
if [ ! -d .venv ]; then
    echo "Création de l'environnement virtuel..."
    python3 -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
else
    source .venv/bin/activate
fi

# Migrations
echo "Application des migrations..."
python manage.py migrate --no-input

# Utilisateur de test
python manage.py create_test_user 2>/dev/null || true

cd ../..

# Instructions
echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    Configuration terminée! Voici les commandes:${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}TERMINAL 1 - Backend API:${NC}"
echo -e "${BLUE}cd services/api && source .venv/bin/activate && python manage.py runserver${NC}"
echo ""
echo -e "${YELLOW}TERMINAL 2 - Frontend:${NC}"
echo -e "${BLUE}pnpm dev${NC}"
echo ""
echo -e "${GREEN}Compte de test:${NC} test@example.com / Test1234!"
echo ""
echo -e "${GREEN}URLs:${NC}"
echo "• Marketing: http://localhost:3000"
echo "• Builder: http://localhost:3001"
echo "• API Docs: http://localhost:8000/v1/docs/swagger"
echo ""
echo -e "${YELLOW}Copiez les commandes ci-dessus dans des terminaux séparés!${NC}"