#!/bin/bash

# Script COMPLET qui lance TOUT LE STACK
# - Backend Django (API) 
# - Frontend Marketing (port 3000)
# - Frontend Builder (port 3001) 
# - Frontend Runtime Demo (port 3002)

echo "🚀 LANCEMENT COMPLET DU FORMS PLATFORM"
echo "======================================"

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
API_PID=""
FRONTEND_PID=""

# Nettoyage à l'arrêt
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt de tous les services...${NC}"
    
    # Arrêt propre des processus
    if [ ! -z "$API_PID" ]; then
        echo "🔧 Arrêt API Django..."
        kill -TERM $API_PID 2>/dev/null
        wait $API_PID 2>/dev/null
    fi
    
    if [ ! -z "$FRONTEND_PID" ]; then
        echo "🔧 Arrêt Frontend complet..."  
        kill -TERM $FRONTEND_PID 2>/dev/null
        wait $FRONTEND_PID 2>/dev/null
    fi
    
    # Force cleanup
    echo "🧹 Nettoyage force..."
    pkill -f "python manage.py runserver" 2>/dev/null
    pkill -f "turbo dev" 2>/dev/null
    pkill -f "next" 2>/dev/null
    pkill -f "pnpm dev" 2>/dev/null
    
    # Libérer les ports
    lsof -ti:8888 | xargs kill -9 2>/dev/null  # Django API
    lsof -ti:3300 | xargs kill -9 2>/dev/null  # Marketing
    lsof -ti:3301 | xargs kill -9 2>/dev/null  # Builder
    lsof -ti:3302 | xargs kill -9 2>/dev/null  # Runtime Demo
    
    echo -e "${GREEN}✅ Tous les services arrêtés${NC}"
    exit 0
}

# Piéger les signaux
trap cleanup INT TERM EXIT

echo -e "${BLUE}🔍 Vérification de l'environnement...${NC}"

# Vérifier Node.js et pnpm
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm non trouvé${NC}"
    echo "Installez pnpm: npm install -g pnpm"
    exit 1
fi

# Vérifier Python et Django
if ! command -v python &> /dev/null; then
    echo -e "${RED}❌ Python non trouvé${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Environnement OK${NC}"

# Nettoyage des ports avant démarrage
echo -e "\n${YELLOW}🧹 Nettoyage des ports utilisés...${NC}"

# Fonction pour vérifier si un port est utilisé
check_port() {
    local port=$1
    local name=$2
    if lsof -ti:$port > /dev/null 2>&1; then
        echo -e "   ${YELLOW}⚠️  Port $port ($name) occupé - libération...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null
        sleep 0.5
        if lsof -ti:$port > /dev/null 2>&1; then
            echo -e "   ${RED}❌ Impossible de libérer le port $port${NC}"
            return 1
        else
            echo -e "   ${GREEN}✅ Port $port libéré${NC}"
        fi
    else
        echo -e "   ${GREEN}✅ Port $port ($name) disponible${NC}"
    fi
    return 0
}

# Libérer tous les ports concernés
check_port 8888 "Django API"
check_port 3300 "Marketing"
check_port 3301 "Builder"
check_port 3302 "Runtime Demo"

# Tuer les processus résiduels
echo -e "\n${YELLOW}🧹 Nettoyage des processus résiduels...${NC}"
pkill -f "python manage.py runserver" 2>/dev/null && echo "   Killed: Django runserver" || true
pkill -f "turbo dev" 2>/dev/null && echo "   Killed: turbo dev" || true
pkill -9 -f "next-server" 2>/dev/null && echo "   Killed: next-server" || true

# Nettoyage des caches Next.js
echo -e "\n${YELLOW}🗑️  Nettoyage des caches...${NC}"
rm -rf apps/builder/.next apps/marketing/.next apps/runtime-demo/.next .turbo 2>/dev/null
echo -e "${GREEN}✅ Caches nettoyés${NC}"

sleep 1

echo -e "\n${BLUE}🔧 Préparation du Backend...${NC}"
cd services/api

# Environment virtuel
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
    echo "✅ Environnement virtuel activé"
else
    echo "Création de l'environnement virtuel..."
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt > /dev/null 2>&1
    echo "✅ Environnement virtuel créé"
fi

# Migrations
echo "📦 Application des migrations..."
python manage.py migrate --no-input > /dev/null 2>&1

# Utilisateur de test
echo "👤 Vérification utilisateurs de test..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
from core.models import Organization, Membership
User = get_user_model()

# Admin user
if not User.objects.filter(email='admin@test.com').exists():
    user = User(email='admin@test.com', username='admin', is_active=True, is_staff=True, is_superuser=True)
    user.set_password('admin123')
    user.save()
    print('✅ Utilisateur admin créé')
else:
    print('✅ Utilisateur admin existe')

# Demo user for Builder
if not User.objects.filter(email='demo@example.com').exists():
    user = User.objects.create_user(
        email='demo@example.com',
        password='Demo1234!',
        name='Demo User'
    )
    org = Organization.objects.create(name='Demo Organization')
    Membership.objects.create(user=user, organization=org, role='owner')
    print('✅ Utilisateur demo créé')
else:
    print('✅ Utilisateur demo existe')
" 2>/dev/null

cd ../..

echo -e "\n${BLUE}🚀 Démarrage des services...${NC}"

echo "1️⃣ Lancement API Django (port 8888)..."
cd services/api
source .venv/bin/activate
nohup python manage.py runserver 127.0.0.1:8888 > /tmp/django.log 2>&1 &
API_PID=$!
cd ../..

sleep 2

echo "2️⃣ Lancement Frontend complet (turbo dev)..."
echo "   • Marketing: port 3300"
echo "   • Builder: port 3301"
echo "   • Runtime Demo: port 3302"

# Lancer tous les frontends via turbo
nohup pnpm dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!

echo -e "\n${YELLOW}⏳ Attente du démarrage (15 secondes)...${NC}"
sleep 15

# Vérification des services
echo -e "\n${BLUE}🔍 Vérification des services...${NC}"

check_service() {
    local port=$1
    local name=$2
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        echo -e "   ${GREEN}✅ $name (port $port)${NC}"
    else
        echo -e "   ${RED}❌ $name (port $port)${NC}"
    fi
}

check_service 8888 "Django API"
sleep 2
check_service 3300 "Marketing Site"
check_service 3301 "Form Builder"
check_service 3302 "Runtime Demo"

clear
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          🎉 FORMS PLATFORM - STACK COMPLET ! 🎉            ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}🌐 TOUTES LES APPLICATIONS:${NC}"
echo ""
echo -e "  ${YELLOW}📱 Marketing Site${NC}      → http://localhost:3300"
echo "     • Landing page et features"
echo "     • Pricing et plans"
echo "     • Documentation publique"
echo ""
echo -e "  ${YELLOW}🏗️ Form Builder${NC}       → http://localhost:3301"
echo "     • Interface de création"
echo "     • Drag & drop des blocs"
echo "     • Logic et thèmes"
echo "     • Analytics et exports"
echo ""
echo -e "  ${YELLOW}🎮 Runtime Demo${NC}       → http://localhost:3302"
echo "     • Preview des formulaires"
echo "     • Test du rendu final"
echo "     • Mobile responsive"
echo ""
echo -e "  ${YELLOW}🔧 Django API${NC}         → http://localhost:8888"
echo "     • REST API complète"
echo "     • Admin: http://localhost:8888/admin"
echo "     • Docs: http://localhost:8888/api/docs"
echo "     • Django Admin: admin@test.com / admin123"
echo ""
echo -e "  ${YELLOW}📧 Compte Demo Builder${NC}"
echo "     • Email: demo@example.com"  
echo "     • Mot de passe: Demo1234!"
echo ""
echo -e "${BLUE}📊 Monitoring & Logs:${NC}"
echo "  • API logs: tail -f /tmp/django.log"
echo "  • Frontend logs: tail -f /tmp/frontend.log"
echo ""
echo -e "${BLUE}🚀 Workflow complet:${NC}"
echo "  1. Visitez http://localhost:3300 (Marketing)"
echo "  2. Cliquez 'Get Started' → Builder"
echo "  3. Créez un formulaire"
echo "  4. Testez sur http://localhost:3302 (Runtime)"
echo "  5. Gérez via http://localhost:8888/admin"
echo ""
echo -e "${GREEN}💡 STACK COMPLET PRÊT !${NC}"
echo -e "${YELLOW}Ctrl+C pour arrêter tous les services proprement${NC}"

# Ouvrir navigateur sur le marketing d'abord
if command -v open &> /dev/null; then
    echo ""
    echo -e "${BLUE}🌐 Ouverture du navigateur...${NC}"
    sleep 2
    open http://localhost:3300 &
fi

echo ""
echo -e "${GREEN}📈 Services en cours...${NC}"

# Boucle d'attente avec monitoring
while true; do
    # Vérifier que tous les services tournent
    services_ok=true
    
    if ! kill -0 $API_PID 2>/dev/null; then
        echo -e "${RED}❌ API Django s'est arrêtée${NC}"
        services_ok=false
    fi
    
    if ! kill -0 $FRONTEND_PID 2>/dev/null; then
        echo -e "${RED}❌ Frontend s'est arrêté${NC}"
        services_ok=false
    fi
    
    if [ "$services_ok" = false ]; then
        echo -e "${RED}Un service s'est arrêté, fermeture...${NC}"
        break
    fi
    
    # Status visuel
    sleep 3
    echo -n "."
done