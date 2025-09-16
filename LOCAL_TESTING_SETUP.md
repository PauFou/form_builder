# 🚀 Configuration des Tests Locaux Obligatoires

Ce projet utilise des tests locaux obligatoires pour garantir la qualité du code. **Tous les tests doivent passer avant de pouvoir push.**

## Installation Rapide

```bash
# 1. Installation initiale (une seule fois)
bash scripts/setup-local-testing.sh

# 2. Exécuter la migration depuis GitHub Actions
bash scripts/migrate-from-github-actions.sh
```

## Workflow de Développement

### 1. **Pre-commit** (automatique)

- ✅ Formatage du code
- ✅ ESLint sur les fichiers modifiés
- ✅ TypeScript check
- ✅ Tests unitaires des fichiers modifiés
- ⏱️ Durée : 5-10 secondes

### 2. **Pre-push** (automatique)

- ✅ Tous les tests frontend
- ✅ Tous les tests backend (Django/Python)
- ✅ Vérification des builds
- ✅ Vérification de la taille des bundles (< 30KB)
- ✅ Couverture de code (> 80%)
- ⏱️ Durée : 2-5 minutes

## Commandes Utiles

```bash
# Tests rapides pendant le développement
./test-quick.sh

# Tests complets (équivalent pre-push)
pnpm test:local

# Tous les tests + E2E
./test-all.sh

# Mode watch pour les tests
./test-watch.sh

# Vérifier la qualité du code
pnpm quality:check

# Corriger automatiquement les problèmes
pnpm quality:fix
```

## Structure des Tests

```
scripts/
├── local-test-suite.sh      # Script principal de test
├── setup-local-testing.sh   # Configuration initiale
└── migrate-from-github-actions.sh  # Migration

.husky/
├── pre-commit              # Hook de pré-commit
├── pre-push               # Hook de pré-push
└── commit-msg            # Validation des messages

.testconfig               # Configuration des tests (seuils, budgets)
```

## Niveaux de Test

### 🟢 **Quick** (5-10s)

- Linting des fichiers modifiés
- Tests unitaires ciblés
- Vérification de sécurité basique

### 🟡 **Standard** (2-5m)

- Tous les tests unitaires
- Builds complets
- Vérification des performances
- Couverture de code

### 🔴 **Full** (10-15m)

- Tests standard +
- Tests E2E
- Audit de sécurité complet
- Tests de performance

## Configuration

Éditer `.testconfig` pour personnaliser :

```bash
# Seuils de couverture
FRONTEND_COVERAGE_THRESHOLD=80
BACKEND_COVERAGE_THRESHOLD=80

# Budgets de performance
RUNTIME_BUNDLE_SIZE_LIMIT=30  # KB gzipped

# Base de données de test
TEST_DB_USER=test
TEST_DB_PASSWORD=test
```

## Résolution de Problèmes

### Les tests échouent localement ?

```bash
# Nettoyer et réinstaller
pnpm clean && pnpm install

# Reconfigurer la base de données de test
cd services/api
python setup_postgres_ci.py
```

### Besoin de push en urgence ?

⚠️ **Utiliser uniquement en cas d'urgence absolue :**

```bash
# Skip les hooks pre-push
git push --no-verify

# Ou avec variable d'environnement
SKIP_TESTS=true git push
```

## Règles d'Or

1. **Jamais de push sans tests** - La qualité prime sur la vitesse
2. **Corriger immédiatement** - Ne pas laisser s'accumuler les problèmes
3. **Tests rapides** - Utiliser des mocks pour les dépendances externes
4. **TDD** - Écrire les tests avant le code
5. **Couverture > 80%** - Maintenir une bonne couverture

## Performance

Les tests sont optimisés pour être rapides :

- Tests parallèles activés
- Réutilisation de la base de données de test
- Cache des dépendances
- Tests ciblés sur les changements

## Support

En cas de problème :

1. Consulter `docs/LOCAL_TESTING.md`
2. Vérifier les logs dans `.push-test-results.log`
3. Exécuter `bash scripts/setup-local-testing.sh` pour réinitialiser

---

**Important** : Ce système garantit que seul du code de qualité, testé et validé arrive dans le repository. C'est un investissement qui paie sur le long terme !
