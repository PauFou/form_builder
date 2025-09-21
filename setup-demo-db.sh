#!/bin/bash

# Script pour configurer la base de données pour la démo

echo "🔧 Configuration de la base de données pour la démo"
echo "=================================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Aller dans le répertoire de l'API
cd services/api

# Vérifier l'environnement virtuel
if [ ! -f .venv/bin/activate ]; then
    echo -e "${YELLOW}Création de l'environnement virtuel...${NC}"
    python -m venv .venv
fi

source .venv/bin/activate

# Installer les dépendances
echo -e "${BLUE}Installation des dépendances Python...${NC}"
pip install -r requirements.txt -q

# Supprimer l'ancienne base de données SQLite si elle existe
if [ -f db.sqlite3 ]; then
    echo -e "${YELLOW}Suppression de l'ancienne base de données...${NC}"
    rm db.sqlite3
fi

# Créer les migrations
echo -e "${BLUE}Création des migrations...${NC}"
python manage.py makemigrations --no-input

# Appliquer les migrations
echo -e "${BLUE}Application des migrations...${NC}"
python manage.py migrate --no-input

# Créer l'utilisateur de test
echo -e "${BLUE}Création de l'utilisateur de test...${NC}"
python manage.py create_test_user

# Créer un superutilisateur pour l'admin Django
echo -e "${BLUE}Création du superutilisateur admin...${NC}"
echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.filter(username='admin').delete(); User.objects.create_superuser('admin', 'admin@example.com', 'Admin1234!')" | python manage.py shell 2>/dev/null || true

echo ""
echo -e "${GREEN}✅ Base de données configurée avec succès !${NC}"
echo ""
echo -e "${BLUE}Comptes disponibles :${NC}"
echo -e "  ${YELLOW}Utilisateur de test :${NC}"
echo -e "    Email: test@example.com"
echo -e "    Mot de passe: Test1234!"
echo ""
echo -e "  ${YELLOW}Administrateur Django :${NC}"
echo -e "    Username: admin"
echo -e "    Mot de passe: Admin1234!"
echo -e "    URL: http://localhost:8000/admin"
echo ""

cd ../..