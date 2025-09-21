#!/bin/bash
# Script pour commit d'urgence sans tests
# UTILISER UNIQUEMENT EN CAS D'URGENCE ABSOLUE!

RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo -e "${RED}⚠️  ATTENTION - COMMIT D'URGENCE ⚠️${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Vous êtes sur le point de faire un commit SANS exécuter les tests."
echo "Ceci devrait être utilisé UNIQUEMENT en cas d'urgence absolue!"
echo ""
echo -e "${YELLOW}Raisons valides:${NC}"
echo "  - Hotfix critique en production"
echo "  - Correction de sécurité urgente"
echo "  - Rollback d'urgence"
echo ""
echo -e "${YELLOW}Ce qui va se passer:${NC}"
echo "  1. Votre commit sera accepté SANS validation"
echo "  2. Les tests s'exécuteront quand même en CI/CD"
echo "  3. Si les tests échouent en CI, votre PR sera bloquée"
echo ""

read -p "Êtes-vous CERTAIN de vouloir continuer? (yes/no): " response

if [ "$response" != "yes" ]; then
    echo ""
    echo "Commit annulé. Bonne décision! 👍"
    echo "Utilisez 'git commit' normalement pour exécuter tous les tests."
    exit 0
fi

echo ""
echo "Exécution du commit d'urgence..."
echo ""

# Exécuter le commit avec SKIP_TESTS
SKIP_TESTS=true git commit "$@"

echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: N'oubliez pas de:${NC}"
echo "  1. Vérifier les résultats CI/CD"
echo "  2. Corriger tout problème détecté"
echo "  3. Ne PAS abuser de cette fonctionnalité"
echo ""