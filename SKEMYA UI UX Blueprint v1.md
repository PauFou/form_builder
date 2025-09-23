# Skemya — Front‑End UI/UX Blueprint (v1)

**Objectif**: cadrer _uniquement_ le **front‑end** (Next.js/React 19 + Tailwind + shadcn/ui) pour livrer une expérience **très professionnelle, esthétique, intuitive, sérieuse, moderne et tech**.

**Portée**: Landing (home/pricing/features), Auth, Dashboard, Forms List, Form Builder, Form Viewer/Preview, Submissions Hub, Analytics, Profile/Settings, Share/Embed.  
**Normes**: A11y **WCAG AA**, performance **Core Web Vitals**, sécurité UI (CSP friendly, no inline styles/scripts), i18n, dark mode natif.

---

## 0) Design System de référence (UI tokens & composants)

### 0.1 Tokens (Tailwind + CSS vars)

- **Couleurs (HSL)**: `--brand` (600/500/400), `--accent`, `--success`, `--warning`, `--destructive`, `--muted`.
- **Neutres**: `--bg` (50/950), `--surface` (100/900), `--border` (200/800), `--text` (900/100), `--subtle` (600/400).
- **Radii**: `--radius-sm: 8px`, `--radius-md: 12px`, `--radius-lg: 16px`, `--radius-xl: 20px` (cartes/modales **16px** recommandé).
- **Typo**: Inter/Geist/SF (fallback system-ui).
  - Scale (clamp): H1 32–48, H2 24–32, H3 18–22, Body 14/16, Small 12/14.
  - Weights: 400/500/600/700. Line-height: 1.5 body / 1.25 headings.
- **Spacing**: base 8 → 4/8/12/16/20/24/32/40/48/64.
- **Shadows**: `sm` (subtle), `md` (cards hover), `lg` (modals).
- **Motion**: `duration-150/200/300`, easing `ease-out`, `ease-in-out`. Respect `prefers-reduced-motion`.

### 0.2 Composants shadcn/ui (sélection & variantes)

- **Navigation**: `NavigationMenu`, `Sheet` (mobile), `Breadcrumb`.
- **Entrées**: `Input`, `Textarea`, `Select`, `RadioGroup`, `Checkbox`, `Switch`, `Slider`, `DatePicker`, `Combobox` (cmdk).
- **Affichage**: `Card`, `Badge`, `Alert`, `Tooltip`, `Table`, `Accordion`, `Tabs`.
- **Actions**: `Button` (primary/secondary/ghost/destructive), `DropdownMenu`, `Dialog`, `Drawer`, `Popover`, `Toast`.
- **Feedback**: `Skeleton`, `Progress`, `Separator`, `EmptyState` (custom), `InlineError`.
- **Charts**: Recharts minimal (bar/line/pie) + `@radix-ui` primitives.

**Règles**: ≤4 variantes par composant, focus visible (`ring-2 ring-offset-2`), tailles S/M/L, pas de couleurs hors tokens.

---

## 1) Landing (Home/Features/Pricing/FAQ/Contact)

### 1.1 Home

- **Hero**: H1 7–12 mots (bénéfice), sous‑titre preuve, CTA primaire “Essayer gratuitement”, secondaire “Voir démo”. Logos confiance.
- **How it works (3 étapes)**: Créer → Publier → Analyser (icônes propres, 3 cartes).
- **Sections clés**: Templates, Sécurité/RGPD (EU), Performance (<30KB embed), Comparatif (Typeform/Tally).
- **Preuves**: carrousel témoignages, logos clients, chiffres (SLA, Vitals).
- **Footer**: navigation claire, conformité (DPA, ToS, Privacy), contact.  
  **UI**: `max-w-7xl`, grille 12, whitespace généreux, images optimisées `next/image`, blur‑placeholder.  
  **Motion**: entrées douces (150–250ms), parallax léger, pas d’animations lourdes.  
  **Dark**: contraste AA, images dark-ready.

### 1.2 Pricing

- **3 plans**: Starter/Pro/Business (+ Enterprise CTA).
- **Comparatif**: table sticky col/row, features regroupées (Builder, Responses, Integrations, Security).
- **Callouts**: “No surprise pricing”, “GDPR EU”, “SLA 99.95%”.
- **FAQ**: 6–8 Q/R concrètes.  
  **UI**: cartes avec badge “Most popular”, CTA clair, bascule mensuel/annuel.  
  **Anti‑friction**: essai gratuit, import 1‑clic.

### 1.3 Templates

- Grille responsive (cards), filtres par use case, preview → “Use template”.
- Barre de recherche, catégories, tags.

---

## 2) Auth (Signup/Login/Reset)

- Cartes centrées `sm:max-w-md`, labels explicites, erreurs en ligne.
- SSO (Google/MS) + email/pass, option magic link.
- Copy neutre (éviter user enum), liens aide.
- Dark mode cohérent.

---

## 3) Dashboard (Home)

- **Topbar**: org switcher, search (global), notifications, avatar.
- **Widgets**: Formulaires récents, Soumissions récentes, Tâches (webhooks à redriver), Insights flash.
- **CTA**: Nouveau formulaire, Importer.
- **Empty state**: “Créer depuis un modèle / depuis un prompt (AI)”.

**Layout**: container `max-w-7xl`, grid 12, cartes `radius-16`, `shadow-sm` (hover md).  
**Perf**: requêtes lazy, skeletons.

---

## 4) Forms List

- **Toolbar**: recherche, filtres (projet, statut, date), tags, tri.
- **Table** (virtualisée >200): Nom, Statut (Brouillon/Live), Conversions, Soumissions 7j, MAJ, Actions.
- **Bulk**: sélectionner → archiver/dupliquer/exporter.
- **Empty**: templates + import.

**Interactions**: row hover, menu actions (éditer, partager, analytics).

---

## 5) Form Builder (éditeur)

### 5.1 Layout

- **Rail** gauche: Library (champs par catégories) + recherche.
- **Canvas** centre: pages/sections, DnD, sélection, guides d’alignement.
- **Inspector** droit (tabs): Field / Design / Data / Logic.
- **Header**: nom, statut, Preview, Publish, Undo/Redo, Versioning.

### 5.2 Patterns d’édition

- **Field tab**: label, key (auto‑slug), required, placeholder, help, validation (Zod presets), messages d’erreur.
- **Design tab**: thème (couleurs, typo, radii), layout (one‑question/grid), progress, boutons.
- **Data tab**: mapping intégrations, webhooks, data attributes, PII flag.
- **Logic tab**: if/else, jumps, calculs; **Logic Map** (graph) + dead‑end detector.
- **Versioning**: snapshot + diff (ajouts/suppressions/modifs), rollback 1‑clic.
- **Collab**: curseurs (plus tard), commentaires (drawer latéral).

**Ergo**: Undo/Redo, autosave (debounce 800ms), confirmations non‑bloquantes.  
**Prévention**: avertir suppression d’un champ référencé; clés uniques.

---

## 6) Form Viewer (runtime) & Preview

### 6.1 Viewer

- **Modes**: One‑Question (par défaut, conversion) et Grid (compact).
- **Structure**: Label → Input → helper → error; validations au blur + summary à submit (anchors).
- **Navigation**: Suivant/Précédent, raccourcis (←/→), barre progression (étapes/%).
- **Partial Save**: localStorage chiffré (clé session) + “Reprendre plus tard”.
- **Anti‑spam**: honeypot, time‑trap, Turnstile.
- **Success**: message personnalisable, CTA retour/partage.
- **A/B**: variantes UI/copy; attribution UTM.
- **Perf**: bundle ≤30KB gzip, hydratation progressive, aucune lib lourde.

### 6.2 Preview

- **Pane latéral** dans le Builder, device switcher (mobile/tablet/desktop), dark toggle, simulateur d’erreurs (champs requis, patterns), simulateur de logique (sauts conditionnels).

---

## 7) Submissions Hub

- **Toolbar**: période, statut (complet/partiel/erreur), recherche, tags.
- **Table virtualisée** (≥10k), colonnes configurables.
- **Drawer détail**: valeurs par champ (PII badge), meta (UTM/UA), JSON, timeline Webhooks + **Redrive**.
- **Bulk**: exporter CSV/JSON, retag, supprimer (double confirmation).
- **Empty**: tips intégrations.

---

## 8) Analytics (Insights)

- **Overview**: vues, start, conversions, abandons, temps moyen.
- **Funnel** par page/étape; **Drop‑off** par champ; **Attribution** (UTM/referrer/device).
- **A/B**: uplift, intervalle de confiance, p‑value.  
  **UI**: cartes lisibles, graphes sobres, tables triables; permaliens (filtres dans l’URL).

---

## 9) Profile & Settings

- **Profile**: avatar, nom, email, 2FA, sessions actives, tokens API personnels (scopés).
- **Org/Project**: membres & rôles, domaines custom, branding, data residency, retention policies.
- **Billing**: plan, utilisation (soumissions stockées/exportées), factures, moyens de paiement.
- **Audit**: accès exports webhooks/intégrations.

---

## 10) Share & Embed

- **Lien**: id non devinable, options d’expiration/mot de passe.
- **Embed**: iFrame + auto‑resize, thème hérité, CSP conseillé, snippet copiable (script loader).
- **QR**: génération, suivi UTM.

---

## 11) Accessibilité (AA)

- Focus styles visibles (`focus-visible:ring-2 ring-primary ring-offset-2`).
- Labels explicites, `aria-describedby` pour erreurs, rôle et state ARIA.
- Contrastes AA (vérifs automatisées).
- Navigation clavier complète; pièges focus interdits.
- `prefers-reduced-motion` respecté.

---

## 12) Performance (FE‑only)

- **Vitals**: LCP <2.5s (landing), INP <200ms (apps), CLS <0.1.
- **Build**: tree‑shaking shadcn, dynamic import, `react-wrap-balancer` sur titres, `next/font` self‑host.
- **Images**: `next/image` (responsive, priority pour hero), formats modernes.
- **Critique**: CSS critique minimal, pas d’inline script, preconnect CDN/API.
- **Runtime**: pas de polyfills inutiles, pas de moment.js, observer bundle.

---

## 13) Micro‑interactions & Feedback

- Hover/focus subtils, transitions 150–250ms.
- États: loading (skeleton/spinner), success (toast), error (inline + toast si global).
- Undo (toasts avec action).
- Copier/partager → toast avec icône.

---

## 14) Internationalisation

- i18n JSON par namespace (common, builder, viewer, pricing).
- RTL pris en charge; typographie adaptée (ligatures, chiffres).
- Formats locaux (dates/nombres), devise pricing.

---

## 15) Empty/Loading/Error States

- **Empty**: icon + titre + 1 CTA; 1–2 lignes max.
- **Loading**: skeletons spécifiques (cartes, lignes de table).
- **Error**: message actionnable, id d’incident (si global), pas d’info sensible.

---

## 16) Checklists par page (QA UI/UX)

### Landing

- [ ] H1 clair, CTA primaire visible au-dessus du fold.
- [ ] LCP optimisé (image hero).
- [ ] Sections “How it works/Features/Pricing/FAQ” présentes.
- [ ] Dark mode & AA OK.

### Pricing

- [ ] 3 plans + Enterprise.
- [ ] Table comparatif lisible mobile.
- [ ] Bascules mensuel/annuel, badges.
- [ ] FAQ intégrée.

### Forms List

- [ ] Recherche + filtres + tri.
- [ ] Table virtualisée >200.
- [ ] Bulk actions avec confirmations.

### Builder

- [ ] Rail/Canvas/Inspector respectés.
- [ ] Undo/Redo, autosave, validations clés uniques.
- [ ] Logic Map + linter.
- [ ] Preview device/dark/error sim.

### Viewer

- [ ] One‑Question & Grid OK.
- [ ] Validation inline + summary, ancrage erreurs.
- [ ] Anti‑spam actif.
- [ ] Bundle ≤30KB.

### Submissions Hub

- [ ] Table virtualisée, drawer détail, redrive webhooks.
- [ ] Exports CSV/JSON, tags.

### Analytics

- [ ] Overview/funnel/drop‑off/attribution.
- [ ] A/B avec metrics (p‑value).

### Settings/Profile

- [ ] 2FA, sessions, tokens API.
- [ ] Rôles, domaines, branding, retention.
- [ ] Facturation lisible.

---

## 17) Livrables FE

- **Storybook** complet (controls + a11y).
- **Figma tokens ↔ Tailwind** (sync).
- **Docs composants** (props, variants, exemples).
- **Playwright** scénarios clés (create→publish→submit→redrive).
- **Rapport Vitals** (landing/app), bundle viewer.

---

## 18) Commandes de référence FE

```bash
pnpm dev          # FE apps + storybook si monorepo
pnpm build        # build prod (analyser bundles)
pnpm lint && pnpm typecheck
pnpm test:e2e     # parcours clés (Playwright)
```

---

## 19) Exceptions & Gouvernance

- Toute dérogation (couleur hors tokens, composant ad‑hoc) → “Design Exception” documentée (motif, portée, rollback).
- Gate de merge FE: AA OK, Vitals OK, bundle viewer OK, checklists page cochées, screenshots/tests mis à jour.
