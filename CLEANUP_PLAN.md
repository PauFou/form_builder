# 🧹 Plan de Nettoyage - 137 Fichiers Temporaires

**Date**: 1er Octobre 2025
**Status**: En cours

---

## 📊 Résumé par Catégorie

| Catégorie                       | Fichiers | Action       | Destination     |
| ------------------------------- | -------- | ------------ | --------------- |
| **Documentation**               | 19       | ✅ Conserver | `docs/reports/` |
| **Scripts de test temporaires** | 44       | 🗑️ Supprimer | -               |
| **Composants expérimentaux**    | 28       | 🔍 Évaluer   | Garder utiles   |
| **Scripts de démarrage**        | 4        | ✅ Conserver | Racine          |
| **Code fonctionnel**            | 18       | ✅ Conserver | En place        |
| **Fichiers obsolètes**          | 24       | 🗑️ Supprimer | -               |

**Total**: 137 fichiers

---

## 1. Documentation à Conserver (19 fichiers)

### → Déplacer vers `docs/reports/`

**Audits & Analyses**:

```
✅ AUDIT_COMPLET_01_OCT_2025.md
✅ COMPREHENSIVE_AUDIT_RESULTS.md
✅ BACKEND_TEST_ANALYSIS.md
✅ DJANGO_WARNINGS_ANALYSIS.md
```

**Rapports de Problèmes Résolus**:

```
✅ RAPPORT_PROBLEMES_FORMS_PAGE.md
✅ SOLUTION_BOUTONS_FORMS.md
✅ DRAG_DROP_DEBUG.md
✅ DRAG_DROP_FIX.md
✅ ENHANCED_DRAG_DROP_SUCCESS.md
✅ FORM_BUILDER_DEBUG_SUMMARY.md
✅ FORM_BUILDER_SUCCESS_REPORT.md
✅ LOGIN_FIX.md
✅ SCRIPT_FIX.md
✅ TERMINAL_FIX.md
```

**Documentation Technique**:

```
✅ GUIDE_DEMARRAGE_RAPIDE.md → Garder à la racine
✅ MIGRATION_PORTS_COMPLETE.md
✅ IMPROVEMENTS_SUMMARY.md
✅ UX_IMPROVEMENTS.md
✅ STACK_COMPARISON.md
```

**Builder Diagnostics**:

```
✅ apps/builder/DIAGNOSTIC_BUTTONS_FORMS.md
✅ apps/builder/RAPPORT_FINAL_BOUTONS.md
```

---

## 2. Scripts de Test Temporaires à Supprimer (44 fichiers)

### E2E Tests Debug (32 fichiers)

```bash
🗑️ e2e/comprehensive-app-audit.spec.js
🗑️ e2e/comprehensive-saas-audit.spec.js
🗑️ e2e/debug-500-error.spec.js
🗑️ e2e/debug-auth-flow.spec.js
🗑️ e2e/debug-create-form-api.spec.js
🗑️ e2e/debug-forms-aurora.spec.js
🗑️ e2e/final-saas-verification.spec.js
🗑️ e2e/focused-issue-detection.spec.js
🗑️ e2e/manual-test-form-edit.spec.js
🗑️ e2e/quick-auth-test.spec.js
🗑️ e2e/screenshot-login.spec.ts
🗑️ e2e/screenshot-signup.spec.ts
🗑️ e2e/test-aurora-background-fix.spec.js
🗑️ e2e/test-auth-direct-access.spec.js
🗑️ e2e/test-auth-pages-style.spec.js
🗑️ e2e/test-auth-pages.spec.ts
🗑️ e2e/test-auth-visual-check.spec.js
🗑️ e2e/test-create-form-success.spec.js
🗑️ e2e/test-drag-drop-fix.spec.js
🗑️ e2e/test-edit-button.spec.js
🗑️ e2e/test-enhanced-auth-validation.spec.js
🗑️ e2e/test-enhanced-drag-drop.spec.js
🗑️ e2e/test-final-sticky.spec.js
🗑️ e2e/test-final-verification.spec.js
🗑️ e2e/test-forms-page.spec.ts
🗑️ e2e/test-forms-redirect.spec.js
🗑️ e2e/test-forms-style-improvements.spec.js
🗑️ e2e/test-import-button.spec.ts
🗑️ e2e/test-landing-style-auth.spec.js
🗑️ e2e/test-login-redirect.spec.ts
🗑️ e2e/test-sticky-header.spec.js
🗑️ e2e/test-sticky-simple.spec.js
🗑️ e2e/test-theme-system.spec.js
🗑️ e2e/working-auth-test.spec.js
🗑️ tests/test-landing-auth.spec.ts
```

### Builder E2E Tests (4 fichiers)

```bash
🗑️ apps/builder/e2e/test-buttons-final.spec.js
🗑️ apps/builder/e2e/test-dialog-buttons-auth.spec.js
🗑️ apps/builder/e2e/test-dialog-buttons.spec.js
🗑️ apps/builder/e2e/test-forms-buttons-dev.spec.js
```

### Test Scripts Python (5 fichiers)

```bash
🗑️ create_dev_user.py
🗑️ create_simple_test_user.py
🗑️ create_test_user_final.py
🗑️ create_test_user_for_buttons.py
🗑️ final-validation.py
🗑️ test_auth_and_forms.py
🗑️ test_form_builder_flow.py
```

**Garder**:

```bash
✅ test_login_api.py  # Utile pour tests API manuels
```

### Test Scripts Shell/JS (8 fichiers)

```bash
🗑️ test-all-pages-buttons.js
🗑️ test-auth-and-theme.js
🗑️ test-complete-landing.js
🗑️ test-demo-pages.spec.js
🗑️ test-drag-drop-manual.js
🗑️ test-form-builder-complete.spec.js
🗑️ test-forms-complete.js
🗑️ test-forms-page-issue.js
🗑️ test-improved-nav.js
🗑️ test-navigation-buttons.js
🗑️ test-pages.js
🗑️ test-ui-audit.js
🗑️ test-dashboard-improvements.sh
🗑️ test-interrupt.sh
🗑️ test-ui-fixes.sh
🗑️ test-ui-improvements.sh
```

### Builder Test Scripts (2 fichiers)

```bash
🗑️ apps/builder/check-forms-page.js
🗑️ apps/builder/reset-dev-auth.js
```

---

## 3. Composants Expérimentaux à Évaluer (28 fichiers)

### Builder - Composants UI

**À Supprimer (prototypes obsolètes)**:

```bash
🗑️ apps/builder/components/RobustDialog.tsx
🗑️ apps/builder/components/SimpleDialog.tsx
🗑️ apps/builder/components/builder/FormBuilder.simple.tsx
🗑️ apps/builder/components/builder/FormBuilder.tsx.bak
🗑️ apps/builder/components/builder/FormBuilderFixed.tsx
🗑️ apps/builder/components/builder/enhanced-block-library.tsx
🗑️ apps/builder/components/builder/enhanced-form-canvas.tsx
🗑️ apps/builder/components/builder/fluid-drag-overlay.tsx
```

**À Conserver (fonctionnalités en développement)**:

```bash
✅ apps/builder/components/logic/visual-logic-editor.tsx
✅ apps/builder/components/providers/theme-provider.tsx
✅ apps/builder/components/ui/aurora-background.tsx
✅ apps/builder/components/ui/modern-badge.tsx
✅ apps/builder/lib/dev-utils.ts
✅ apps/builder/lib/stores/theme-store.ts
```

**À Évaluer (dossiers)**:

```bash
🔍 apps/builder/app/demo/  # Pages demo?
🔍 apps/builder/app/forms/create/  # Fonctionnalité de création?
🔍 apps/builder/components/settings/  # Settings UI?
```

### Marketing - Composants

**À Conserver**:

```bash
✅ apps/marketing/app/demo/  # Demo pages marketing
✅ apps/marketing/components/aurora-background.tsx
✅ apps/marketing/components/modern-badge.tsx
```

### Runtime - Styles

**À Évaluer**:

```bash
🔍 packages/runtime/src/styles/new-blocks.css
🔍 packages/ui/src/components/form-blocks/
```

---

## 4. Scripts de Démarrage à Conserver (4 fichiers)

**Garder à la racine**:

```bash
✅ start-complete-stack.sh  # Script principal
✅ start-dev-complete.sh    # Alternative dev
✅ stop-dev-complete.sh     # Arrêt propre
```

**À Supprimer**:

```bash
🗑️ start-full-stack-fixed.sh  # Doublon obsolète
🗑️ start-simple.sh            # Redondant
```

---

## 5. Code Fonctionnel Backend (18 fichiers)

### Analytics (ClickHouse) - **CONSERVER**

```bash
✅ services/api/analytics/apps.py
✅ services/api/analytics/clickhouse_client.py
✅ services/api/analytics/management/
✅ services/api/analytics/serializers.py
✅ services/api/analytics/signals.py
✅ services/api/analytics/tests/
✅ services/api/analytics/views_clickhouse.py
✅ docs/CLICKHOUSE_ANALYTICS.md
```

### Payments (Stripe) - **CONSERVER**

```bash
✅ services/api/payments/
```

### Webhooks - **CONSERVER**

```bash
✅ services/api/webhooks/delivery.py
✅ services/api/webhooks/signing.py
```

### Workers & Ingest - **CONSERVER**

```bash
✅ services/ingest/README.md
✅ services/ingest/package.json
✅ services/ingest/src/
✅ services/ingest/tsconfig.json
✅ services/ingest/wrangler.toml
✅ services/workers/
```

### Debug Utils - **À ÉVALUER**

```bash
🔍 services/api/debug_env.py  # Utile en dev?
```

---

## 6. Fichiers Obsolètes (24 fichiers)

**Test Dialogs Obsolètes**:

```bash
🗑️ apps/builder/app/forms/test-dialog.tsx
🗑️ apps/builder/app/forms/test-dialog/
```

**Documentation Protocole**:

```bash
🗑️ manual-test-protocol.md  # Peut être déplacé vers docs/
```

**Docker (vide ou non utilisé)**:

```bash
🔍 docker/  # À vérifier si contient quelque chose
```

---

## 🎯 Plan d'Action

### Phase 1: Créer Structure docs/ (1 min)

```bash
mkdir -p docs/reports/resolved
mkdir -p docs/reports/analysis
```

### Phase 2: Déplacer Documentation (2 min)

```bash
# Audits & Analyses
mv AUDIT_COMPLET_01_OCT_2025.md docs/reports/analysis/
mv COMPREHENSIVE_AUDIT_RESULTS.md docs/reports/analysis/
mv BACKEND_TEST_ANALYSIS.md docs/reports/analysis/
mv DJANGO_WARNINGS_ANALYSIS.md docs/reports/analysis/

# Rapports résolus
mv RAPPORT_PROBLEMES_FORMS_PAGE.md docs/reports/resolved/
mv SOLUTION_BOUTONS_FORMS.md docs/reports/resolved/
mv DRAG_DROP_DEBUG.md docs/reports/resolved/
mv DRAG_DROP_FIX.md docs/reports/resolved/
mv ENHANCED_DRAG_DROP_SUCCESS.md docs/reports/resolved/
mv FORM_BUILDER_DEBUG_SUMMARY.md docs/reports/resolved/
mv FORM_BUILDER_SUCCESS_REPORT.md docs/reports/resolved/
mv LOGIN_FIX.md docs/reports/resolved/
mv SCRIPT_FIX.md docs/reports/resolved/
mv TERMINAL_FIX.md docs/reports/resolved/

# Autres rapports
mv MIGRATION_PORTS_COMPLETE.md docs/reports/
mv IMPROVEMENTS_SUMMARY.md docs/reports/
mv UX_IMPROVEMENTS.md docs/reports/
mv STACK_COMPARISON.md docs/reports/

# Builder reports
mv apps/builder/DIAGNOSTIC_BUTTONS_FORMS.md docs/reports/resolved/
mv apps/builder/RAPPORT_FINAL_BOUTONS.md docs/reports/resolved/
```

### Phase 3: Supprimer Tests Debug (1 min)

```bash
# E2E tests temporaires
rm -rf e2e/comprehensive-*.spec.js
rm -rf e2e/debug-*.spec.js
rm -rf e2e/test-*.spec.js
rm -rf e2e/test-*.spec.ts
rm -rf e2e/screenshot-*.spec.ts
rm -rf e2e/working-auth-test.spec.js
rm -rf tests/test-landing-auth.spec.ts

# Builder e2e tests temporaires
rm -rf apps/builder/e2e/test-*.spec.js

# Python test scripts
rm create_dev_user.py create_simple_test_user.py
rm create_test_user_final.py create_test_user_for_buttons.py
rm final-validation.py test_auth_and_forms.py test_form_builder_flow.py

# JS/Shell test scripts
rm test-*.js test-*.sh
rm apps/builder/check-forms-page.js
rm apps/builder/reset-dev-auth.js
```

### Phase 4: Supprimer Composants Obsolètes (30 sec)

```bash
# Dialogs obsolètes
rm apps/builder/components/RobustDialog.tsx
rm apps/builder/components/SimpleDialog.tsx

# FormBuilder prototypes
rm apps/builder/components/builder/FormBuilder.simple.tsx
rm apps/builder/components/builder/FormBuilder.tsx.bak
rm apps/builder/components/builder/FormBuilderFixed.tsx
rm apps/builder/components/builder/enhanced-*.tsx
rm apps/builder/components/builder/fluid-drag-overlay.tsx

# Test dialogs
rm apps/builder/app/forms/test-dialog.tsx
rm -rf apps/builder/app/forms/test-dialog/
```

### Phase 5: Nettoyer Scripts (10 sec)

```bash
rm start-full-stack-fixed.sh start-simple.sh
rm manual-test-protocol.md
```

### Phase 6: Évaluer Dossiers (manuel)

- `apps/builder/app/demo/` - Vérifier si utilisé
- `apps/builder/app/forms/create/` - Vérifier si fonctionnel
- `apps/builder/components/settings/` - Vérifier si en développement
- `docker/` - Vérifier contenu

---

## ✅ Résultat Attendu

**Avant**: 137 fichiers non trackés
**Après**: ~20-30 fichiers (code fonctionnel uniquement)

**Supprimés**: ~80 fichiers (tests debug, prototypes)
**Déplacés**: ~20 fichiers (vers docs/)
**Conservés**: ~30 fichiers (code utile)

---

## 📝 Notes

- **Ne pas supprimer** sans vérifier:
  - Services backend (analytics, payments, webhooks, ingest, workers)
  - Composants UI finalisés (theme-provider, visual-logic-editor)
  - Scripts de démarrage fonctionnels

- **Créer .gitignore** additionnel si nécessaire pour éviter de re-générer ces fichiers

---

_Plan créé le 1er Octobre 2025_
