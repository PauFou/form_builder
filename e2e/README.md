# Tests E2E Playwright

## ⚠️ Note importante

Certains tests E2E sont actuellement **désactivés** car ils nécessitent des fonctionnalités d'authentification pas encore implémentées :

- `form-creation.spec.ts` - Workflow de création de formulaire (nécessite login)
- `gdpr-compliance.spec.ts` - Fonctionnalités GDPR (nécessite login admin)
- `full-workflow.spec.ts` - Workflow complet (nécessite login)

**Tests actifs** qui fonctionnent sans authentification :

- `simple-form.spec.ts` - Tests de fonctionnalités basiques
- `basic-webhook.spec.ts` - Tests du webhook receiver

## Vue d'ensemble

Ces tests E2E vérifient le workflow complet de la plateforme de formulaires, incluant :

- Création de formulaire avec plusieurs types de champs (texte, fichier, signature)
- Publication du formulaire
- Soumission avec upload de fichier et capture de signature
- Vérification de la réception du webhook avec signature HMAC

## Prérequis

1. **Services en cours d'exécution** :
   - Frontend Builder (port 3001) : `pnpm dev`
   - API Django (port 8000) : `cd services/api && python manage.py runserver`
   - Webhook Receiver (port 9000) : `pnpm webhook:start`

2. **Base de données** :
   - PostgreSQL avec les migrations appliquées
   - Redis pour les queues Celery

## Commandes

### Lancer tous les tests E2E

```bash
pnpm test:e2e
```

### Lancer uniquement le test de workflow complet

```bash
pnpm test:e2e:full
```

### Mode UI interactif (pour debug)

```bash
pnpm test:e2e:ui
```

### Afficher le rapport HTML

```bash
pnpm test:e2e:report
```

### Lancer le webhook receiver manuellement

```bash
pnpm webhook:start
# ou
node scripts/webhook-receiver.js
```

## Structure des tests

- `helpers/` : Classes utilitaires réutilisables
  - `webhook-helper.ts` : Gestion du webhook receiver
  - `auth-helper.ts` : Authentification et gestion des utilisateurs
  - `form-helper.ts` : Création et manipulation de formulaires
- `fixtures/` : Fichiers de test (PDF, images)
- `full-workflow.spec.ts` : Test principal du workflow complet

## Gestion de la flakiness

Les tests incluent plusieurs mécanismes pour gérer la flakiness :

1. **Retries automatiques** : 2 retries en cas d'échec
2. **Timeouts appropriés** :
   - 30s pour les opérations longues (publication, webhook)
   - 10s pour les opérations standard
3. **Wait for network idle** : Attente que le réseau soit inactif
4. **Screenshots et traces** : Capture automatique en cas d'échec

## Debug des échecs

1. **Consulter le rapport HTML** :

   ```bash
   pnpm test:e2e:report
   ```

2. **Vérifier les logs du webhook receiver** :

   ```bash
   curl http://localhost:9000/webhooks
   ```

3. **Mode debug avec UI** :

   ```bash
   PWDEBUG=1 pnpm test:e2e:full
   ```

4. **Traces détaillées** :
   Les traces sont sauvegardées dans `test-results/` en cas d'échec

## Variables d'environnement

- `WEBHOOK_SECRET` : Secret pour la signature HMAC (défaut: 'test-webhook-secret')
- `WEBHOOK_PORT` : Port du webhook receiver (défaut: 9000)
- `CI` : Active le mode CI (plus de retries, pas de vidéos)

## Troubleshooting

### "Webhook receiver not ready"

- Vérifier que le port 9000 est libre : `lsof -i :9000`
- Lancer manuellement : `pnpm webhook:start`

### "Failed to create test user"

- Vérifier que l'API Django est lancée
- Vérifier les migrations : `cd services/api && python manage.py migrate`

### "Form not published"

- Vérifier que Celery est lancé pour traiter les tâches async
- Vérifier les logs Django pour les erreurs

### Tests lents

- Utiliser `--workers=1` pour débugger
- Désactiver les vidéos : `--video=off`
