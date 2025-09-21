#!/bin/bash

# Script pour installer et configurer PostgreSQL pour la démo

echo "🐘 Configuration de PostgreSQL pour la démo"
echo "=========================================="
echo ""

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Variables
DB_NAME="forms_demo"
DB_USER="forms_user"
DB_PASSWORD="Demo1234!"

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL n'est pas installé.${NC}"
    echo ""
    
    # Détection de l'OS
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Installation sur macOS..."
        echo ""
        echo "Options d'installation :"
        echo "1. Avec Homebrew : brew install postgresql"
        echo "2. Avec PostgreSQL.app : https://postgresapp.com"
        echo ""
        echo -e "${RED}Veuillez installer PostgreSQL et relancer ce script.${NC}"
        exit 1
    else
        echo -e "${RED}Veuillez installer PostgreSQL et relancer ce script.${NC}"
        echo "Sur Ubuntu/Debian : sudo apt-get install postgresql postgresql-contrib"
        echo "Sur Fedora/CentOS : sudo yum install postgresql postgresql-server postgresql-contrib"
        exit 1
    fi
fi

# Vérifier si PostgreSQL est en cours d'exécution
if ! pg_isready &> /dev/null; then
    echo -e "${YELLOW}PostgreSQL n'est pas en cours d'exécution.${NC}"
    
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "Tentative de démarrage avec brew services..."
        brew services start postgresql 2>/dev/null || {
            echo -e "${RED}Impossible de démarrer PostgreSQL.${NC}"
            echo "Essayez : brew services start postgresql"
            exit 1
        }
        sleep 3
    else
        echo -e "${RED}Veuillez démarrer PostgreSQL :${NC}"
        echo "sudo systemctl start postgresql"
        exit 1
    fi
fi

echo -e "${GREEN}✓ PostgreSQL est installé et en cours d'exécution${NC}"
echo ""

# Créer la base de données et l'utilisateur
echo -e "${BLUE}Création de la base de données et de l'utilisateur...${NC}"

# Déterminer l'utilisateur PostgreSQL à utiliser
if [[ "$OSTYPE" == "darwin"* ]]; then
    # Sur macOS, utiliser l'utilisateur courant
    PG_USER=$(whoami)
else
    # Sur Linux, utiliser postgres
    PG_USER="postgres"
fi

echo -e "${BLUE}Utilisation de l'utilisateur PostgreSQL : ${YELLOW}$PG_USER${NC}"

# Fonction pour exécuter les commandes PostgreSQL
run_psql() {
    psql -U "$PG_USER" -d postgres -c "$1" 2>&1
}

# Supprimer la base de données si elle existe
echo "Suppression de l'ancienne base de données..."
run_psql "DROP DATABASE IF EXISTS $DB_NAME;" || true

# Supprimer l'utilisateur s'il existe
echo "Suppression de l'ancien utilisateur..."
run_psql "DROP USER IF EXISTS $DB_USER;" || true

# Créer l'utilisateur
echo "Création de l'utilisateur $DB_USER..."
if ! run_psql "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"; then
    echo -e "${YELLOW}Note: L'utilisateur existe peut-être déjà ou erreur de permissions${NC}"
    # Essayer de modifier le mot de passe si l'utilisateur existe
    run_psql "ALTER USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || true
fi

# Créer la base de données
echo "Création de la base de données $DB_NAME..."
if ! run_psql "CREATE DATABASE $DB_NAME OWNER $DB_USER;"; then
    echo -e "${RED}Erreur lors de la création de la base de données.${NC}"
    echo "Vérifiez vos permissions PostgreSQL."
    exit 1
fi

# Donner tous les privilèges
echo "Attribution des privilèges..."
run_psql "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"

echo -e "${GREEN}✓ Base de données et utilisateur créés${NC}"
echo ""

# Créer le fichier .env pour l'API
echo -e "${BLUE}Création du fichier de configuration...${NC}"

cat > services/api/.env << EOF
# Database
POSTGRES_DB=$DB_NAME
POSTGRES_USER=$DB_USER
POSTGRES_PASSWORD=$DB_PASSWORD
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=demo-secret-key-not-for-production
DJANGO_DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# JWT
JWT_SECRET=demo-jwt-secret-not-for-production

# Frontend
FRONTEND_URL=http://localhost:3001

# Email (console output for demo)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@forms-demo.local

# Celery (optionnel pour la démo)
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# Redis cache
REDIS_URL=redis://localhost:6379/1
EOF

echo -e "${GREEN}✓ Fichier .env créé${NC}"
echo ""

# Afficher les informations de connexion
echo -e "${GREEN}Configuration PostgreSQL terminée !${NC}"
echo ""
echo -e "${BLUE}Informations de connexion :${NC}"
echo -e "  Base de données : ${YELLOW}$DB_NAME${NC}"
echo -e "  Utilisateur : ${YELLOW}$DB_USER${NC}"
echo -e "  Mot de passe : ${YELLOW}$DB_PASSWORD${NC}"
echo -e "  Host : ${YELLOW}localhost${NC}"
echo -e "  Port : ${YELLOW}5432${NC}"
echo ""
echo -e "${BLUE}Pour tester la connexion :${NC}"
echo -e "  psql -U $DB_USER -d $DB_NAME -h localhost"
echo ""
echo -e "${GREEN}Vous pouvez maintenant lancer ./start-demo.sh${NC}"