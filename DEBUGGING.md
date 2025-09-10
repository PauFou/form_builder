# Guide de débogage Form Builder

## Erreurs courantes et solutions

### 1. "Module not found"

**Solution**: Vérifiez que tous les imports utilisent des chemins relatifs ou `@forms/ui`

### 2. "Cannot read properties of undefined"

**Causes possibles**:

- Le store n'est pas initialisé
- Un composant essaie d'accéder à une propriété qui n'existe pas

### 3. "Hydration mismatch"

**Solution**: Vérifiez que les composants client sont marqués avec 'use client'

## Comment déboguer

1. **Console du navigateur (F12)**:
   - Regardez les erreurs en rouge
   - Notez le fichier et la ligne
   - Copiez le message d'erreur complet

2. **Network tab**:
   - Vérifiez si des requêtes échouent (404, 500)
   - Regardez les réponses des API

3. **React DevTools**:
   - Installez l'extension React DevTools
   - Inspectez l'état des composants
   - Vérifiez les props passées

## Tests rapides

```bash
# Vérifier les types TypeScript
pnpm typecheck

# Lancer les tests
pnpm test

# Build de production
pnpm build
```

## Structure attendue

- **Left Rail**: 320px de large avec les blocs
- **Canvas**: Zone centrale pour le formulaire
- **Inspector**: 360px à droite avec 4 onglets
- **Preview**: Panel qui s'ouvre sur la droite
