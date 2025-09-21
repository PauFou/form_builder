#!/bin/bash

# Script pour démarrer TOUT le stack (Frontend + Backend)

echo "🚀 Démarrage complet du Forms Platform"
echo "====================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Fonction pour nettoyer à la sortie
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt des services...${NC}"
    [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null
    exit 0
}

trap cleanup INT TERM

# 1. Vérifier PostgreSQL
echo -e "${BLUE}1️⃣ Vérification de PostgreSQL...${NC}"
if psql -h 127.0.0.1 -U test -d test -c "" 2>/dev/null; then
    echo -e "${GREEN}✅ PostgreSQL est prêt${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL n'est pas accessible${NC}"
    echo "   Démarrez PostgreSQL ou utilisez Docker:"
    echo "   docker-compose up -d postgres"
fi

# 2. Démarrer l'API Django
echo -e "\n${BLUE}2️⃣ Démarrage de l'API Django...${NC}"
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
python manage.py migrate --no-input

# Créer un superuser si nécessaire
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').exists() or User.objects.create_superuser('admin', 'admin@example.com', 'admin123')" | python manage.py shell 2>/dev/null

# Démarrer l'API
python manage.py runserver &
API_PID=$!

cd ../..

# 3. Démarrer les applications frontend
echo -e "\n${BLUE}3️⃣ Démarrage des applications frontend...${NC}"
pnpm dev &
FRONTEND_PID=$!

# Attendre que tout soit prêt
echo -e "\n${YELLOW}⏳ Attente du démarrage complet...${NC}"
sleep 15

# Afficher les informations
clear
echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║        🎉 FORMS PLATFORM - PRÊT À L'EMPLOI! 🎉          ║${NC}"
echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📱 Applications Frontend :${NC}"
echo ""
echo -e "  ${YELLOW}1. Site Marketing${NC} → http://localhost:3000"
echo "     • Page d'accueil avec les fonctionnalités"
echo "     • Pricing et plans"
echo "     • Documentation"
echo ""
echo -e "  ${YELLOW}2. Form Builder${NC} → http://localhost:3001"  
echo "     • Interface de création de formulaires"
echo "     • Drag & drop des questions"
echo "     • Configuration de la logique"
echo "     • Gestion des thèmes"
echo ""
echo -e "  ${YELLOW}3. Form Runtime${NC} → http://localhost:3002"
echo "     • Preview des formulaires"
echo "     • Test du rendu final"
echo ""
echo -e "${BLUE}🔧 Backend APIs :${NC}"
echo ""
echo -e "  ${YELLOW}4. Django REST API${NC} → http://localhost:8000"
echo "     • API Documentation → http://localhost:8000/api/docs"
echo "     • Admin Panel → http://localhost:8000/admin"
echo "       (login: admin / password: admin123)"
echo ""
echo -e "${BLUE}🚀 Workflow de test :${NC}"
echo ""
echo "  1. Visitez http://localhost:3000 pour voir le site marketing"
echo "  2. Cliquez sur 'Get Started' pour aller au builder"
echo "  3. Créez un formulaire avec quelques questions"
echo "  4. Testez le formulaire dans le runtime"
echo "  5. Consultez l'API sur http://localhost:8000/api/docs"
echo ""
echo -e "${GREEN}💡 Commandes utiles :${NC}"
echo "  • Ctrl+C : Arrêter tous les services"
echo "  • ./test-quick.sh : Lancer les tests rapides"
echo "  • pnpm lint:fix : Corriger le code automatiquement"
echo ""

# Ouvrir le navigateur
if command -v open &> /dev/null; then
    echo -e "${BLUE}🌐 Ouverture du navigateur...${NC}"
    sleep 2
    open http://localhost:3000
fi

echo -e "${YELLOW}Appuyez sur Ctrl+C pour arrêter tous les services...${NC}"
wait