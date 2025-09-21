#!/bin/bash
# Affiche l'aide pour les tests

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}🧪 GUIDE DE TEST - Form Builder Platform${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📋 Commandes de Test Disponibles:${NC}"
echo ""
echo -e "${GREEN}Tests Rapides (Développement):${NC}"
echo "  pnpm test                    # Tests unitaires frontend"
echo "  pnpm test:watch             # Mode watch pour développement"
echo "  pnpm lint                   # Vérification ESLint"
echo "  pnpm typecheck              # Vérification TypeScript"
echo "  bash scripts/test-quick.sh  # Suite rapide complète"
echo ""
echo -e "${GREEN}Tests Complets:${NC}"
echo "  bash scripts/test-complete.sh  # TOUS les tests (identique au pre-commit)"
echo "  pnpm test:ci                   # Tests CI frontend"
echo "  pnpm test:e2e                  # Tests E2E Playwright"
echo "  pnpm test:contracts            # Tests de contrat"
echo ""
echo -e "${GREEN}Tests Backend:${NC}"
echo "  cd services/api && pytest           # Tous les tests Django"
echo "  cd services/api && pytest -v        # Mode verbose"
echo "  cd services/api && pytest -m performance  # Tests de performance uniquement"
echo ""
echo -e "${YELLOW}⚠️  Commit & Push:${NC}"
echo ""
echo -e "${BLUE}Normal (recommandé):${NC}"
echo "  git commit -m 'message'     # Lance TOUS les tests automatiquement"
echo ""
echo -e "${BLUE}Urgence uniquement:${NC}"
echo "  bash scripts/emergency-commit.sh -m 'message'  # Skip les tests"
echo "  SKIP_TESTS=true git commit -m 'message'        # Alternative"
echo ""
echo -e "${YELLOW}📊 Métriques:${NC}"
echo "  - Durée tests complets: ~3-5 minutes"
echo "  - Coverage minimum: 80%"
echo "  - Bundle size max: 30KB"
echo ""
echo -e "${CYAN}💡 Astuce:${NC} Testez localement avec 'pnpm test:watch' pendant le développement!"
echo ""