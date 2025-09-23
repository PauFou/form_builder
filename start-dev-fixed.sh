#!/bin/bash

# Script de démarrage amélioré pour le développement
# Évite les problèmes de processus en arrière-plan et de terminal

echo "🚀 Démarrage de Forms Platform en mode développement"
echo "==================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Vérifier les prérequis
check_requirements() {
    echo -e "${BLUE}Vérification des prérequis...${NC}"
    
    # Python
    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}❌ Python3 n'est pas installé${NC}"
        exit 1
    fi
    
    # pnpm
    if ! command -v pnpm &> /dev/null; then
        echo -e "${RED}❌ pnpm n'est pas installé${NC}"
        echo "Installez-le avec: npm install -g pnpm"
        exit 1
    fi
    
    # PostgreSQL (optionnel mais recommandé)
    if command -v psql &> /dev/null; then
        echo -e "${GREEN}✓ PostgreSQL détecté${NC}"
    else
        echo -e "${YELLOW}⚠️  PostgreSQL non détecté - utilisation de SQLite${NC}"
    fi
}

# Configurer l'API Django
setup_django() {
    echo -e "\n${BLUE}Configuration de l'API Django...${NC}"
    cd services/api
    
    # Créer l'environnement virtuel si nécessaire
    if [ ! -d .venv ]; then
        echo "Création de l'environnement virtuel..."
        python3 -m venv .venv
    fi
    
    # Activer l'environnement virtuel
    source .venv/bin/activate
    
    # Installer les dépendances si nécessaire
    if [ ! -f .venv/.deps_installed ]; then
        echo "Installation des dépendances Python..."
        pip install -r requirements.txt
        touch .venv/.deps_installed
    fi
    
    # Appliquer les migrations
    echo "Application des migrations..."
    python manage.py migrate --no-input
    
    # Créer l'utilisateur de test
    echo -e "${YELLOW}Création de l'utilisateur de test...${NC}"
    python manage.py create_test_user 2>/dev/null || echo "Utilisateur de test déjà créé"
    
    cd ../..
}

# Instructions de démarrage
show_instructions() {
    clear
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🎉 FORMS PLATFORM - PRÊT! 🎉                ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📋 Instructions de démarrage:${NC}"
    echo ""
    echo -e "${YELLOW}1. Ouvrez un nouveau terminal et lancez l'API Django:${NC}"
    echo -e "   cd services/api"
    echo -e "   source .venv/bin/activate"
    echo -e "   python manage.py runserver"
    echo ""
    echo -e "${YELLOW}2. Dans ce terminal, nous allons lancer le frontend:${NC}"
    echo -e "   (Appuyez sur Entrée pour continuer)"
    echo ""
    echo -e "${BLUE}🔐 Compte de test:${NC}"
    echo -e "   Email: ${GREEN}test@example.com${NC}"
    echo -e "   Mot de passe: ${GREEN}Test1234!${NC}"
    echo ""
    echo -e "${BLUE}🌐 URLs:${NC}"
    echo -e "   Marketing → ${GREEN}http://localhost:3000${NC}"
    echo -e "   Builder → ${GREEN}http://localhost:3001${NC}"
    echo -e "   API → ${GREEN}http://localhost:8000/v1/docs/swagger${NC}"
    echo ""
    read -p "Appuyez sur Entrée pour lancer le frontend..."
}

# Fonction principale
main() {
    check_requirements
    setup_django
    show_instructions
    
    # Lancer le frontend
    echo -e "\n${BLUE}Démarrage du frontend...${NC}"
    pnpm install --silent 2>/dev/null
    pnpm dev
}

# Alternative: Lancer tout en parallèle avec tmux (si disponible)
launch_with_tmux() {
    if command -v tmux &> /dev/null; then
        echo -e "${BLUE}Lancement avec tmux...${NC}"
        
        # Créer une nouvelle session tmux
        tmux new-session -d -s forms-platform
        
        # Fenêtre 1: API Django
        tmux rename-window -t forms-platform:0 'API'
        tmux send-keys -t forms-platform:0 'cd services/api && source .venv/bin/activate && python manage.py runserver' C-m
        
        # Fenêtre 2: Frontend
        tmux new-window -t forms-platform:1 -n 'Frontend'
        tmux send-keys -t forms-platform:1 'pnpm dev' C-m
        
        # Attacher à la session
        echo -e "${GREEN}✅ Services lancés dans tmux${NC}"
        echo -e "${YELLOW}Utilisez 'tmux attach -t forms-platform' pour voir les logs${NC}"
        
        # Attendre un peu et ouvrir le navigateur
        sleep 5
        if command -v open &> /dev/null; then
            open http://localhost:3000
        fi
    else
        echo -e "${YELLOW}tmux n'est pas installé - lancement manuel${NC}"
        main
    fi
}

# Menu de sélection
echo -e "${BLUE}Comment voulez-vous lancer l'application?${NC}"
echo "1) Instructions manuelles (recommandé)"
echo "2) Avec tmux (si installé)"
echo "3) Quitter"
read -p "Votre choix (1-3): " choice

case $choice in
    1)
        main
        ;;
    2)
        launch_with_tmux
        ;;
    3)
        echo "Au revoir!"
        exit 0
        ;;
    *)
        echo -e "${RED}Choix invalide${NC}"
        exit 1
        ;;
esac