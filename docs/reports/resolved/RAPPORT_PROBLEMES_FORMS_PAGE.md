# Rapport d'analyse des problèmes de la page /forms

## Problèmes identifiés

### 1. Changement de thème inattendu (Dark → Light)

**Cause**: Le système de thème a été modifié récemment. Le thème par défaut est maintenant "light" au lieu de "dark".

**Localisation du code**:
- `/apps/builder/app/layout.tsx` (ligne 71-93): Script qui définit le thème initial
- `/apps/builder/lib/stores/theme-store.ts` (ligne 16): `theme: "light"` défini par défaut

**Solution proposée**:
1. Modifier le thème par défaut dans `theme-store.ts` de "light" à "dark"
2. OU ajouter une préférence utilisateur persistante

### 2. Boutons non fonctionnels (Create Form et Import)

**Cause principale**: Problème d'authentification. Les boutons sont rendus conditionnellement selon l'état d'authentification.

**Localisation du code**:
- `/apps/builder/app/forms/page.tsx`:
  - Ligne 425-450: Dialog pour Create Form
  - Ligne 425-433: Bouton Import avec ImportDialog
  - Ligne 273-289: Effet de développement qui définit une auth mock

**Observations**:
1. Les boutons sont présents dans le code
2. Ils utilisent des Dialog components de shadcn/ui
3. Le onClick est géré par le state `createDialogOpen` et `importDialogOpen`
4. En mode développement, une authentification mock devrait être définie

**Problèmes détectés**:
1. L'authentification mock ne fonctionne pas correctement
2. Les requêtes API échouent avec 401 (non autorisé)
3. Les boutons ne sont pas visibles car l'utilisateur n'est pas authentifié

### 3. Erreurs d'API

Les logs Django montrent:
```
Unauthorized: /v1/webhooks/stats/
[28/Sep/2025 18:26:43] "GET /v1/webhooks/stats/?timeframe=day HTTP/1.1" 401 58
Unauthorized: /v1/webhook-deliveries/
[28/Sep/2025 18:26:43] "GET /v1/webhook-deliveries/?status=failed HTTP/1.1" 401 58
```

## Solutions recommandées

### Solution immédiate pour les boutons:

1. **Vérifier l'authentification mock en développement**:
   ```typescript
   // Dans /apps/builder/app/forms/page.tsx, ligne 273-289
   React.useEffect(() => {
     if (process.env.NODE_ENV === 'development' && !organization && !authStore.isLoading) {
       // S'assurer que cette logique s'exécute correctement
     }
   }, [organization, authStore]);
   ```

2. **Forcer l'affichage des boutons en mode dev**:
   Modifier temporairement la condition d'affichage des boutons pour ne pas dépendre de l'authentification en développement.

### Solution pour le thème:

1. **Option 1**: Changer le thème par défaut dans `theme-store.ts`:
   ```typescript
   theme: "dark", // au lieu de "light"
   ```

2. **Option 2**: Ajouter une détection de préférence système:
   ```typescript
   theme: window.matchMedia('(prefers-color-scheme: dark)').matches ? "dark" : "light",
   ```

## Actions requises

1. **Créer un utilisateur de test valide** pour permettre l'authentification
2. **Corriger le système d'authentification mock** en développement
3. **Décider du thème par défaut** et l'implémenter
4. **Vérifier que les handlers onClick** des boutons sont correctement attachés

## Test rapide

Pour tester rapidement si les boutons fonctionnent avec auth:
1. Créer un utilisateur test valide
2. Se connecter via /auth/login
3. Naviguer vers /forms
4. Vérifier que les boutons apparaissent et sont cliquables