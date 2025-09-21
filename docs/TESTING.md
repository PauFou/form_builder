# 🧪 Guide de Test - Form Builder Platform

## 📋 Vue d'ensemble

Ce projet utilise une stratégie de test **exhaustive** où TOUS les tests s'exécutent automatiquement avant chaque commit. C'est une mesure de qualité stricte pour garantir la stabilité du code.

## 🚨 Important: Tests Obligatoires à Chaque Commit

**PAR DÉFAUT**: Quand vous faites `git commit`, TOUS les tests s'exécutent automatiquement :

1. **Lint & Format** (ESLint, Prettier, TypeScript)
2. **Tests Unitaires** (Frontend & Backend)
3. **Tests d'Intégration**
4. **Tests de Performance**
5. **Tests E2E** (Playwright)
6. **Tests de Sécurité**
7. **Validation du Build**

⏱️ **Durée estimée**: 3-5 minutes

## 🏃‍♂️ Workflow de Développement

### Développement Normal

```bash
# 1. Faire vos modifications
# 2. Tester localement (optionnel mais recommandé)
pnpm test:ci        # Tests rapides
bash scripts/test-quick.sh  # Tests un peu plus complets

# 3. Commit (lance TOUS les tests automatiquement)
git add .
git commit -m "feat: nouvelle fonctionnalité"
# ⏳ Attendez que tous les tests passent...

# 4. Push (re-vérifie tout)
git push
```

### En Cas d'Urgence ABSOLUE

⚠️ **UTILISER UNIQUEMENT POUR**:

- Hotfix critique en production
- Correction de sécurité urgente
- Rollback d'urgence

```bash
# Option 1: Script d'urgence (recommandé)
bash scripts/emergency-commit.sh -m "fix: urgent security patch"

# Option 2: Variable d'environnement
SKIP_TESTS=true git commit -m "fix: urgent hotfix"
```

**ATTENTION**: Les tests s'exécuteront quand même en CI/CD. Si ils échouent, votre PR sera bloquée!

## 📊 Suites de Tests Disponibles

### Tests Rapides (Développement)

```bash
# Frontend uniquement
pnpm test

# Backend uniquement
cd services/api && pytest

# Lint uniquement
pnpm lint

# TypeScript uniquement
pnpm typecheck
```

### Tests Complets

```bash
# Suite complète (identique au pre-commit)
bash scripts/test-complete.sh

# E2E uniquement
pnpm test:e2e

# Performance uniquement
cd services/api && pytest -m performance
```

## 🔧 Configuration Requise

### Services Locaux

```bash
# PostgreSQL
brew install postgresql
brew services start postgresql
createdb test_forms

# Redis
brew install redis
brew services start redis
```

### Variables d'Environnement

```bash
# Créer .env à partir du template
cp .env.example .env

# Minimum requis pour les tests
DATABASE_URL=postgresql://localhost/test_forms
REDIS_URL=redis://localhost:6379
SECRET_KEY=test-secret-key
```

## 📈 Métriques de Qualité

### Coverage Minimum Requise

- **Frontend**: 80% (statements & branches)
- **Backend**: 80% (lines & branches)
- **Runtime Package**: 90%
- **UI Components**: 90%

### Performance Budgets

- **Runtime Bundle**: < 30KB gzipped ❗
- **API P95 Response**: < 200ms
- **Build Time**: < 60s

### Standards de Code

- **ESLint**: 0 erreurs, 0 warnings
- **TypeScript**: Mode strict, pas de `any`
- **Prettier**: Formatage automatique

## 🐛 Résolution de Problèmes

### "Les tests sont trop longs!"

1. **Utilisez les tests rapides pendant le développement**:

   ```bash
   pnpm test:watch  # Mode watch pour développement
   ```

2. **Testez seulement vos changements**:

   ```bash
   pnpm test -- path/to/your/file.test.ts
   ```

3. **Commit plus souvent avec des changements plus petits**

### "Un test échoue mais mon code est correct!"

1. **Vérifiez l'environnement**:

   ```bash
   # PostgreSQL et Redis doivent tourner
   brew services list
   ```

2. **Réinitialisez la DB de test**:

   ```bash
   dropdb test_forms && createdb test_forms
   cd services/api && python manage.py migrate
   ```

3. **Mettez à jour les snapshots** (si nécessaire):
   ```bash
   pnpm test -- -u
   ```

### "J'ai vraiment besoin de commit sans tests!"

⚠️ **DERNIER RECOURS**:

```bash
# Pour UN SEUL commit
SKIP_TESTS=true git commit -m "fix: emergency fix"

# N'oubliez pas de corriger après!
bash scripts/test-complete.sh
```

## 🎯 Best Practices

1. **Testez localement avant de commit** pour gagner du temps
2. **Gardez vos commits petits** pour des tests plus rapides
3. **Corrigez les tests cassés immédiatement**
4. **N'utilisez JAMAIS `SKIP_TESTS` en développement normal**
5. **Surveillez les métriques de performance** régulièrement

## 📚 Ressources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Pytest Documentation](https://docs.pytest.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Guide ESLint du Projet](./ESLINT.md)

---

💡 **Rappel**: La qualité du code est une responsabilité partagée. Ces tests stricts nous protègent tous!
