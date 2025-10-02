# 🚀 Guide de Démarrage Rapide

## Démarrer le Projet en 30 Secondes

```bash
# Tout démarrer automatiquement
./start-dev-complete.sh

# Tester l'API
python3 test_login_api.py
```

C'est tout ! L'API est accessible sur http://localhost:8000

---

## 📋 Services Disponibles

| Service | URL | Credentials |
|---------|-----|-------------|
| Django API | http://localhost:8888 | dev@local.com / dev123 |
| PostgreSQL | localhost:5432 | forms_user / forms_password |
| Redis | localhost:6379 | (pas de auth) |
| Marketing* | http://localhost:3300 | - |
| Builder* | http://localhost:3301 | dev@local.com / dev123 |

*Optionnel, à démarrer manuellement si besoin

---

## 🎯 Workflows Courants

### 1. Développement Backend
```bash
# Démarrer les services
./start-dev-complete.sh

# Ouvrir une console Django
cd services/api && python manage.py shell

# Créer un nouveau user
python manage.py createsuperuser

# Lancer les tests
cd services/api && pytest -xvs
```

### 2. Développement Frontend
```bash
# S'assurer que l'API tourne
curl http://localhost:8888/health

# Marketing
cd apps/marketing
pnpm dev  # Port 3300

# Builder
cd apps/builder
pnpm dev  # Port 3301
```

### 3. Tests Complets
```bash
# Frontend
pnpm test:ci

# Backend
cd services/api && pytest

# E2E
pnpm test:e2e
```

---

## 🐛 Dépannage

### Problème: PostgreSQL ne démarre pas
```bash
# Vérifier le statut
brew services list | grep postgres

# Forcer le redémarrage
brew services restart postgresql@14

# Tester la connexion
psql -U forms_user -d forms_db
```

### Problème: Redis ne répond pas
```bash
# Vérifier le statut
brew services list | grep redis

# Redémarrer
brew services restart redis

# Tester
redis-cli ping  # Devrait répondre PONG
```

### Problème: Django ne démarre pas
```bash
# Voir les logs
tail -f /tmp/django_dev.log

# Arrêter tous les processus Django
pkill -f "manage.py runserver"

# Redémarrer
cd services/api && python manage.py runserver 8000
```

### Problème: Migrations non appliquées
```bash
cd services/api
python manage.py migrate
```

---

## 📚 Documentation

- **Architecture complète**: Voir `CLAUDE.md`
- **Audit détaillé**: Voir `AUDIT_COMPLET_01_OCT_2025.md`
- **Rapports techniques**: Voir dossier `docs/`

---

## 🔄 Commandes Git

```bash
# Avant chaque commit
pnpm lint
pnpm typecheck
pnpm test

# Commit (hooks automatiques)
git add .
git commit -m "feat: description"

# Les tests s'exécutent automatiquement via Husky
```

---

## 💡 Tips & Astuces

### Créer un nouveau user rapidement
```python
# Via Django shell
python manage.py shell
>>> from core.models import User, Organization, Membership
>>> user = User.objects.create_user(email='nouveau@test.com', password='pass123', username='nouveau')
>>> org = Organization.objects.first()
>>> Membership.objects.create(user=user, organization=org, role='owner')
```

### Tester l'API avec curl
```bash
# Login
curl -X POST http://localhost:8888/v1/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"dev@local.com","password":"dev123"}'

# Health check
curl http://localhost:8888/health
```

### Voir tous les users
```bash
cd services/api
python manage.py shell << 'EOF'
from core.models import User
for u in User.objects.all():
    print(f"{u.email} - Active: {u.is_active}")
EOF
```

---

## 🎉 C'est Parti !

Vous êtes prêt à développer. Pour toute question, consultez:
- `CLAUDE.md` pour les règles du projet
- `AUDIT_COMPLET_01_OCT_2025.md` pour l'état actuel
- Documentation Django/Next.js pour les détails techniques

**Bon développement ! 🚀**
