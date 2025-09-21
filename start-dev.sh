#!/bin/bash

# Script de démarrage rapide pour le développement

echo "🚀 Démarrage de Forms Platform en mode développement"
echo "==================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de nettoyage
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des services...${NC}"
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# 1. Démarrer l'API Django
echo -e "${BLUE}1️⃣ Démarrage de l'API Django...${NC}"
cd services/api

# Activer l'environnement virtuel
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
else
    echo "Création de l'environnement virtuel..."
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
fi

# Appliquer les migrations
echo "Application des migrations..."
python manage.py migrate --no-input 2>/dev/null

# Créer l'utilisateur de test
echo -e "\n${YELLOW}Création de l'utilisateur de test...${NC}"
python manage.py create_test_user

# Démarrer l'API
python manage.py runserver &
API_PID=$!

cd ../..

# 2. Démarrer les applications frontend
echo -e "\n${BLUE}2️⃣ Démarrage des applications frontend...${NC}"
pnpm dev &
FRONTEND_PID=$!

# Attendre que tout soit prêt
echo -e "\n${YELLOW}⏳ Attente du démarrage complet...${NC}"
sleep 10

# Afficher les informations
clear
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║              🎉 FORMS PLATFORM - PRÊT! 🎉                ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🔐 Compte de test :${NC}"
echo -e "   Email: ${YELLOW}test@example.com${NC}"
echo -e "   Mot de passe: ${YELLOW}Test1234!${NC}"
echo ""
echo -e "${BLUE}🌐 Applications :${NC}"
echo -e "   Marketing → ${GREEN}http://localhost:3000${NC}"
echo -e "   Builder → ${GREEN}http://localhost:3001${NC}"
echo -e "   API → ${GREEN}http://localhost:8000/api/docs${NC}"
echo ""
echo -e "${YELLOW}💡 Workflow rapide :${NC}"
echo -e "   1. Cliquez sur 'Get started' sur la page marketing"
echo -e "   2. Créez un compte ou utilisez le compte de test"
echo -e "   3. Créez votre premier formulaire!"
echo ""

# Ouvrir le navigateur
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Ouverture du navigateur...${NC}"
    sleep 2
    open http://localhost:3000
fi

echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter tous les services...${NC}"
wait