# 🔍 Debug Drag & Drop - Formulaire Builder

## ❌ **Problème Rapporté**
"C'est impossible de drag and drop a field from the left panel to get started building your form. Ils sont stuck et je ne peux rien rajouter."

## 🧪 **Tests à Faire**

### **1. Test HTML5 Basic**
Ouvre le fichier `test-drag-drop-debug.html` dans ton navigateur :
```bash
open test-drag-drop-debug.html
```

**Si ça marche** → Le problème est dans @dnd-kit ou la config React  
**Si ça marche pas** → Problème plus fondamental (browser, souris, etc.)

### **2. Test dans l'App Réelle**

Va sur http://localhost:3001/forms → Crée un formulaire → Edit

**Console Browser (F12) - Cherche ces erreurs** :
```
- @dnd-kit errors
- React errors  
- TypeError: Cannot read property
- Event listener errors
```

### **3. Vérifications Step-by-Step**

#### A. **Les éléments sont-ils draggables ?**
```javascript
// Console Browser:
document.querySelectorAll('[draggable="true"]').length
// Doit retourner > 0
```

#### B. **Les event listeners sont-ils attachés ?**
```javascript
// Console Browser:
const firstBlock = document.querySelector('.block-item');
console.log(getEventListeners(firstBlock));
// Doit montrer dragstart, dragend events
```

#### C. **La zone de drop est-elle active ?**
```javascript  
// Console Browser:
document.querySelector('[data-rbd-droppable-id], .drop-zone, [data-testid*="drop"]')
// Doit trouver des éléments
```

### **4. Tests Manuels**

#### **Drag Test** :
1. **Hover** sur un block dans sidebar → curseur doit changer
2. **Click + Hold** → élément doit avoir un feedback visuel
3. **Drag** → élément doit suivre la souris
4. **Hover canvas** → zone de drop doit réagir

#### **Drop Test** :
1. **Release** sur canvas → doit ajouter le field
2. **Console logs** → doit voir des messages de debug

## 🔧 **Fixes Probables**

### **Fix 1: Sensors @dnd-kit**
Le problème peut être les sensors trop restrictifs :

```tsx
// Dans form-builder.tsx - ligne ~64
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 3, // ← PEUT-ÊTRE TROP STRICT
    },
  }),
  useSensor(KeyboardSensor)
);

// ESSAYER:
const sensors = useSensors(
  useSensor(PointerSensor, {
    activationConstraint: {
      distance: 1, // Plus permissif  
    },
  }),
  useSensor(KeyboardSensor)
);
```

### **Fix 2: État du Form Store**
Si le form n'est pas initialisé :

```tsx
// Vérifier dans la console:
window.__formBuilderStore?.getState?.()?.form
// Doit retourner un objet form avec pages
```

### **Fix 3: Collision Detection**
Problème de collision detection :

```tsx
// Essayer collision detection plus simple:
collisionDetection={closestCenter}
// Au lieu de customCollisionDetection
```

### **Fix 4: CSS Interference**
CSS qui bloque le drag :

```css
/* Chercher dans DevTools styles: */
pointer-events: none; /* ← BLOQUE les events */
user-select: none;   /* ← Peut interférer */
touch-action: none;  /* ← Problème mobile/touch */
```

## 📋 **Checklist Debug**

- [ ] Test HTML5 basic fonctionne
- [ ] Console errors identifiées
- [ ] Elements draggables trouvés
- [ ] Drop zones identifiées  
- [ ] Form store a un form valide
- [ ] Sensors @dnd-kit configurés
- [ ] CSS n'interfère pas
- [ ] Events attachés correctement

## 🚀 **Quick Fix à Tester**

Si tu veux tester un fix rapide, édite le fichier :
`apps/builder/components/builder/form-builder.tsx`

**Ligne ~66** change :
```tsx
distance: 3,
```
**En** :
```tsx
distance: 0,
```

Puis recharge la page et teste !

---

**Fais ces tests et dis-moi ce que tu trouves !** 🔍