#!/bin/bash

# Script pour démarrer et visualiser le SaaS localement

echo "🚀 Démarrage du Forms Platform SaaS"
echo "=================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Fonction de nettoyage
cleanup() {
    echo -e "\n${YELLOW}🛑 Arrêt de tous les services...${NC}"
    
    # Arrêter les processus spécifiques démarrés par ce script
    [ ! -z "$DEV_PID" ] && kill $DEV_PID 2>/dev/null && echo -e "${GREEN}✓ Services frontend arrêtés${NC}"
    [ ! -z "$API_PID" ] && kill $API_PID 2>/dev/null && echo -e "${GREEN}✓ Service API arrêté${NC}"
    
    # Attendre un peu pour un arrêt propre
    sleep 1
    
    # Arrêter tous les processus Django
    if pkill -f "python manage.py runserver" 2>/dev/null; then
        echo -e "${GREEN}✓ Tous les serveurs Django arrêtés${NC}"
    fi
    
    # Arrêter les processus Turbo/Next.js
    if pkill -f "turbo dev" 2>/dev/null; then
        echo -e "${GREEN}✓ Processus Turbo arrêtés${NC}"
    fi
    
    if pkill -f "next dev" 2>/dev/null; then
        echo -e "${GREEN}✓ Serveurs Next.js arrêtés${NC}"
    fi
    
    # Vérifier que les ports sont libres
    echo -e "\n${BLUE}Vérification des ports...${NC}"
    for PORT in 3000 3001 3002 8000; do
        if ! lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
            echo -e "  Port $PORT: ${GREEN}✓ libre${NC}"
        else
            echo -e "  Port $PORT: ${YELLOW}⚠️ encore occupé${NC}"
        fi
    done
    
    echo -e "\n${GREEN}✅ Arrêt complet terminé${NC}"
    exit 0
}

trap cleanup INT TERM

# Vérifier et libérer le port 8000 si nécessaire
check_and_free_port() {
    local PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Le port $PORT est déjà utilisé. Tentative de libération...${NC}"
        # Obtenir le PID du processus qui utilise le port
        PID=$(lsof -Pi :$PORT -sTCP:LISTEN -t)
        if [ ! -z "$PID" ]; then
            # Vérifier si c'est un processus Django
            if ps aux | grep -v grep | grep $PID | grep -q "manage.py runserver"; then
                echo -e "${BLUE}Arrêt du serveur Django existant (PID: $PID)...${NC}"
                kill $PID 2>/dev/null
                sleep 2
                # Force kill si nécessaire
                kill -9 $PID 2>/dev/null || true
            else
                echo -e "${RED}Le port $PORT est utilisé par un autre processus.${NC}"
                echo -e "${YELLOW}Veuillez libérer le port ou utiliser un autre port.${NC}"
                return 1
            fi
        fi
    fi
    return 0
}

# Vérifier si les dépendances sont installées
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    pnpm install
fi

# Vérifier que PostgreSQL est configuré
if [ ! -f services/api/.env ]; then
    echo -e "${RED}⚠️  PostgreSQL n'est pas configuré.${NC}"
    echo -e "${YELLOW}Veuillez d'abord exécuter : ./setup-postgres-demo.sh${NC}"
    exit 1
fi

# Vérifier et libérer le port 8000
check_and_free_port 8000 || exit 1

# Démarrer l'API Django
echo -e "${BLUE}🔧 Démarrage de l'API Django...${NC}"
cd services/api

# Vérifier l'environnement virtuel
if [ -f .venv/bin/activate ]; then
    source .venv/bin/activate
else
    echo "Création de l'environnement virtuel..."
    python -m venv .venv
    source .venv/bin/activate
    pip install -r requirements.txt
fi

# Charger les variables d'environnement
export $(cat .env | grep -v '^#' | xargs)

# Appliquer les migrations
echo "Application des migrations..."
python manage.py migrate --no-input

# Créer l'utilisateur de test
echo -e "${YELLOW}Création de l'utilisateur de test...${NC}"
python manage.py create_test_user || echo "L'utilisateur test existe peut-être déjà"

# S'assurer que l'utilisateur test a une organisation
echo -e "${YELLOW}Vérification de l'organisation...${NC}"
python manage.py ensure_test_user_org

# Démarrer l'API en arrière-plan avec debug
export DJANGO_DEBUG=True
python manage.py runserver 2>&1 | tee ../../django-server.log &
API_PID=$!

# Vérifier que l'API démarre correctement
sleep 3
if ! kill -0 $API_PID 2>/dev/null; then
    echo -e "${YELLOW}⚠️  L'API Django n'a pas pu démarrer. Vérification des logs...${NC}"
    tail -n 20 ../../django-server.log
    cleanup
fi

cd ../..

# Démarrer les services frontend
echo -e "\n${BLUE}🔧 Démarrage des services frontend...${NC}"
echo ""

# Démarrer en arrière-plan
pnpm dev 2>&1 | tee frontend.log &
DEV_PID=$!

# Attendre que les services soient prêts
echo "⏳ Attente du démarrage des services..."
sleep 10

# Afficher les URLs
echo ""
echo -e "${GREEN}✅ Votre SaaS est maintenant accessible !${NC}"
echo ""
echo -e "${BLUE}🔐 Compte de test disponible :${NC}"
echo -e "  Email: ${YELLOW}test@example.com${NC}"
echo -e "  Mot de passe: ${YELLOW}Test1234!${NC}"
echo ""
echo -e "${BLUE}🌐 Applications disponibles :${NC}"
echo ""
echo -e "  ${YELLOW}Marketing (page d'accueil)${NC}"
echo "  → http://localhost:3000"
echo "  Site public avec pricing, features, etc."
echo ""
echo -e "  ${YELLOW}Builder (création de formulaires)${NC}"
echo "  → http://localhost:3001"
echo "  Application principale pour créer et gérer les formulaires"
echo ""
echo -e "  ${YELLOW}Runtime Demo (preview des formulaires)${NC}"
echo "  → http://localhost:3002"
echo "  Visualisation des formulaires créés"
echo ""
echo -e "  ${YELLOW}API Documentation${NC}"
echo "  → http://localhost:8000/api/docs"
echo "  Documentation OpenAPI"
echo ""
echo -e "${BLUE}📱 Fonctionnalités principales :${NC}"
echo "  • Création de formulaires avec drag & drop"
echo "  • Logique conditionnelle avancée"
echo "  • Multi-questions par page"
echo "  • Themes personnalisables"
echo "  • Intégrations (Sheets, Slack, etc.)"
echo "  • Analytics en temps réel"
echo ""
echo -e "${GREEN}💡 Conseils :${NC}"
echo "  • Commencez par http://localhost:3000 pour voir le site marketing"
echo "  • Puis allez sur http://localhost:3001 pour créer un formulaire"
echo "  • Utilisez Ctrl+C pour arrêter tous les services"
echo ""

# Ouvrir automatiquement le navigateur (optionnel)
if command -v open &> /dev/null; then
    echo "🌐 Ouverture du navigateur..."
    sleep 2
    open http://localhost:3000
fi

# Attendre Ctrl+C
echo "Appuyez sur Ctrl+C pour arrêter les services..."
wait