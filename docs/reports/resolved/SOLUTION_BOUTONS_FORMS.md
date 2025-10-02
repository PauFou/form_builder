# Solution pour les problèmes de boutons sur la page /forms

## Diagnostic complet

### Problème 1: Redirection automatique vers /auth/login
- L'AuthProvider redirige automatiquement vers la page de login quand il n'y a pas de token valide
- Cela empêche le code de mock auth dans forms/page.tsx de s'exécuter
- Les boutons n'apparaissent pas car l'utilisateur n'est jamais authentifié

### Problème 2: Thème passé de dark à light
- Le thème par défaut a été changé dans `theme-store.ts` de "dark" à "light"
- J'ai déjà corrigé cela en mettant "system" par défaut

## Solutions possibles

### Option 1: Désactiver temporairement la redirection auth en développement

Modifier `auth-provider.tsx` ligne 51-54:
```typescript
} else if (!token && !isAuthenticated && !pathname?.startsWith("/auth/") && process.env.NODE_ENV !== 'development') {
  // No token, not authenticated, and not on auth page - redirect to login (except in dev)
  router.push("/auth/login");
}
```

### Option 2: Créer un middleware de développement

Ajouter une condition dans le middleware pour bypass l'auth en développement:
```typescript
// middleware.ts
if (process.env.NODE_ENV === 'development' && pathname.startsWith('/forms')) {
  return NextResponse.next();
}
```

### Option 3: Utiliser un vrai compte de test

1. Créer un utilisateur de test valide dans la base de données
2. Se connecter normalement via /auth/login
3. Les boutons apparaîtront et fonctionneront

### Option 4: Modifier temporairement forms/page.tsx

Ajouter une condition pour afficher les boutons même sans auth en développement:
```typescript
const showButtons = organization || process.env.NODE_ENV === 'development';
```

## Recommandation

La meilleure solution à court terme est l'**Option 3** - utiliser un vrai compte de test:

1. Créer un utilisateur test dans Django
2. Se connecter via l'interface
3. Tester les fonctionnalités normalement

Pour le développement à long terme, implémenter l'**Option 1** ou **Option 2** pour faciliter le travail des développeurs.

## Actions immédiates

1. Le thème a déjà été corrigé (passé à "system")
2. Pour tester les boutons, il faut soit:
   - Créer et utiliser un compte test réel
   - Modifier temporairement le code pour bypass l'auth en dev
   - Implémenter une des solutions ci-dessus

## Code de test rapide

Si vous voulez tester rapidement sans modifier le code, utilisez ce script Python pour créer un utilisateur test:

```python
# create_test_user.py
import os
import django
import sys

sys.path.insert(0, 'services/api')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'api.settings')
django.setup()

from django.contrib.auth import get_user_model
from organizations.models import Organization, OrganizationMembership

User = get_user_model()

# Create user
user, created = User.objects.get_or_create(
    email='test@example.com',
    defaults={
        'is_active': True,
        'name': 'Test User'
    }
)
if created:
    user.set_password('password123')
    user.save()

# Create organization
org, _ = Organization.objects.get_or_create(
    name='Test Organization',
    defaults={'slug': 'test-org'}
)

# Create membership
OrganizationMembership.objects.get_or_create(
    user=user,
    organization=org,
    defaults={'role': 'owner'}
)

print(f"User created: test@example.com / password123")
```

Ensuite connectez-vous avec ces identifiants et les boutons fonctionneront.