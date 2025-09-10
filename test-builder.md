# Guide de test du Form Builder

## 1. Démarrer l'application

```bash
pnpm --filter @forms/builder dev
```

L'application devrait être accessible sur http://localhost:3001

## 2. Points à vérifier

### Layout principal

- [ ] **Topbar sticky** en haut avec boutons "Forms", titre du form, "Preview" et "Publish"
- [ ] **Left Rail (320px)** avec la bibliothèque de blocs et barre de recherche
- [ ] **Canvas central** pour afficher les pages/sections du formulaire
- [ ] **Right Inspector (360px)** avec 4 onglets : Field, Logic, Design, Data

### Bibliothèque de blocs (Left Rail)

- [ ] 6 blocs visibles : Short text, Long text, Email, Select, Checkbox group, Date
- [ ] Barre de recherche fonctionnelle pour filtrer les blocs
- [ ] Organisation par catégories : "Input fields" et "Choice fields"

### Fonctionnalités

- [ ] **Autosave** : Le timestamp "Last saved" devrait se mettre à jour
- [ ] **Preview** : Cliquer sur "Preview" ou utiliser Ctrl+P ouvre le panneau de preview
- [ ] **Device modes** : Dans le preview, tester Desktop, Tablet et Mobile
- [ ] **Inspector** : Les 4 onglets devraient être cliquables

### Raccourcis clavier

- [ ] **Ctrl/Cmd + P** : Toggle preview
- [ ] **Ctrl/Cmd + Z** : Undo (à tester après ajout de blocs)
- [ ] **Ctrl/Cmd + Shift + Z** : Redo

## 3. Problèmes connus à vérifier

1. **Drag & Drop** : Le système est en place mais nécessite d'être testé
2. **Ajout de blocs** : Vérifier si les blocs peuvent être ajoutés au canvas
3. **Inspector** : Vérifier que les propriétés des blocs s'affichent correctement

## 4. Console du navigateur

Ouvrir la console (F12) et vérifier :

- Pas d'erreurs rouges au chargement
- Les logs d'autosave apparaissent
- Les raccourcis clavier loguent leurs actions

## 5. Captures d'écran des problèmes

Si vous rencontrez des problèmes, prenez des captures d'écran montrant :

1. L'erreur dans la console
2. L'état de l'interface
3. Les actions effectuées avant l'erreur
