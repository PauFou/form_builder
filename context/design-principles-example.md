# Skemya — S‑Tier SaaS Design Checklist (Design Principles v1)

**Audience**: Claude Code, devs & designers  
**Goal**: Un SaaS **moderne, sérieux, tech, intuitif et joli** — fiable, accessible, performant.  
**Stack**: Django API (DRF) • Next.js + React + TypeScript • Tailwind CSS • shadcn/ui (Radix) • TanStack Query.

---

## I. Core Design Philosophy & Strategy

- [ ] **Users First** — besoins, workflows, friction minimale.
- [ ] **Clarity > Flash** — hiérarchie visuelle lisible, espaces généreux, labels explicites.
- [ ] **Meticulous Craft** — états cohérents (default/hover/active/focus/disabled), pixels alignés, alignements constants.
- [ ] **Speed & Performance** — interactions snappy, budgets (cf. section IX).
- [ ] **Simplicity & Consistency** — vocabulaire UI limité, patterns réutilisables.
- [ ] **Accessibility (WCAG 2.2 AA)** — clavier, lecteurs d’écran, contrastes.
- [ ] **Opinionated Defaults** — valeurs par défaut intelligentes, décisions réduites.
- [ ] **International Ready** — i18n, formats (date/num), microcopie neutre.

---

## II. Design System Foundation (Tokens & Core)

### A. Colors (HSL tokens)

- [ ] **Primary brand**: `--primary: 231 100% 60%` ; foreground blanc.
- [ ] **Accent**: `--accent: 192 95% 43%` (pour accents discrets, non CTA principal).
- [ ] **Neutrals (Slate)**: steps pour background/foreground/border/muted.
- [ ] **Semantic**: success/warning/destructive/info (AA contrast).
- [ ] **Dark Mode**: palette correspondante (même steps, luminance inversée).
- [ ] **Contrast**: tous couples texte/fond ≥ AA.

### B. Typography

- [ ] **Fonts**: _Geist_ (titres) / _Inter_ (texte) ; fallback `system-ui`.
- [ ] **Scale**: H1 32–40, H2 24–28, H3 18–20, Body 14–16, Caption 12–13.
- [ ] **Weights**: 400, 500, 600, 700 (pas plus).
- [ ] **Line-height**: 1.3 (titres), 1.5–1.7 (body).

### C. Spacing & Radii

- [ ] **Base unit**: 8px ; échelle 4/8/12/16/24/32/40/48/64.
- [ ] **Radii**: sm=8px, md=12px, lg=16px, pill=9999px (par défaut: 16px).
- [ ] **Shadows**: `shadow-card`, `shadow-overlay` (2 niveaux max).

### D. Grid & Breakpoints

- [ ] **Container**: `max-w-5xl` (app), `max-w-7xl` (landing), gutters `px-6 md:px-8`.
- [ ] **Breakpoints**: `sm 640` / `md 768` / `lg 1024` / `xl 1280` / `2xl 1536`.

### E. Motion

- [ ] **Durations**: 150–250ms (entrées), 250–350ms (overlays).
- [ ] **Easing**: `cubic-bezier(.2,.8,.2,1)` ; respecte `prefers-reduced-motion`.

---

## III. Core Components (shadcn/ui + Radix)

> Chaque composant a des **états** (default/hover/active/focus/disabled), des **variantes ≤ 4** et une **doc d’usage**.

- [ ] **Button**: `primary | secondary | ghost | destructive` ; icône à gauche (Lucide), `gap-2`, label obligatoire.
- [ ] **Input/Textarea**: label au-dessus, helper text, erreurs courtes, largeur pleine.
- [ ] **Select/Combobox**: recherche optionnelle, tailles cohérentes, clavier OK.
- [ ] **Checkbox/Radio/Switch**: états accessibles, tailles 16/20/24.
- [ ] **Date Picker**: navigation clavier, format local, placeholder.
- [ ] **Badge/Tag/Chip**: 3 sémantiques max + muted ; éviter sur-encodage couleur.
- [ ] **Tooltip**: court, `aria` correct, pas sur actions critiques.
- [ ] **Dialog/Sheet/Drawer**: titre obligatoire, scroll interne, CTA primaire à droite.
- [ ] **Tabs/Accordion**: ≤ 5 onglets visibles ; regrouper au-delà.
- [ ] **Card**: radius var(--radius), `shadow-card`, titre court.
- [ ] **Table**: virtualisation > 200 lignes ; tri, filtres, densité `py-2` ; sticky header.
- [ ] **Toast/Alert**: info/warn/error ; une action max.
- [ ] **Progress/Skeleton/Empty State**: gabarits standardisés.
- [ ] **Navbar/Breadcrumb/Pagination**: actifs explicites, focus visibles.

---

## IV. Layout, Hierarchy & Structure

- [ ] **App Shell**: topbar minimal (brand, recherche/command palette, profil). Sidebar **seulement** si nécessaire (Builder rail séparé).
- [ ] **Builder**: rail gauche (Library), **Canvas** central, **Inspector** à droite (tabs Field/Design/Data). Header sticky (nom, statut, Preview/Publish).
- [ ] **Viewer**: sans sidebar ; **mode One‑Question** & **mode Grid** ; progress visible ; footer minimal.
- [ ] **Submissions Hub**: liste virtualisée, filtres en haut, drawer détail.
- [ ] **Landing**: hero compact, preuve sociale, CTA clair ; sections `Features`, `How it works`, `Pricing`, `FAQ`.

---

## V. Interaction Design & Animations

- [ ] **Micro-interactions**: feedback immédiat (hover, press), transitions douces.
- [ ] **Loading**: skeleton pour pages, spinners pour actions ; timeout → message.
- [ ] **Transitions**: modales (scale + fade), listes (fade+reorder léger), DnD (shadow + scale .98) ; **pas de parallax**.
- [ ] **Clavier**: tout est navigable ; shortcuts Builder (Del, ⌘/Ctrl+D, ⌘/Ctrl+Z, ↑/↓).

---

## VI. Forms & Validation (Builder/Viewer)

- [ ] **Pattern champ**: Label → Input → helper → error ; placeholder utile (jamais seul).
- [ ] **Validation**: inline à `blur`, globale à `submit` + **Error Summary** en haut avec ancres.
- [ ] **Groupes**: sections par sujet ; multi-étapes avec CTA unique “Suivant”.
- [ ] **Required**: indiqué par texte (pas couleur seule).
- [ ] **Accessibilité**: `aria-describedby` erreurs ; messages clairs, actionnables.
- [ ] **Partial Save**: autosave debounced + reprise ; message “Brouillon enregistré”.
- [ ] **Anti-spam**: honeypot caché + time-trap + rate-limit ; feedback discret.

---

## VII. Data Tables & Submissions Hub

- [ ] **Lisibilité**: aligne texte à gauche, nombres à droite ; headers gras, `text-sm`.
- [ ] **Densité**: `py-2` (compact), `py-3` (confort) ; lignes cliquables distinctes.
- [ ] **Interactions**: tri colonne, filtres (texte/date/outcome/status), recherche globale.
- [ ] **Large datasets**: pagination par défaut ; virtualisation > 200 ; sticky header.
- [ ] **Lignes**: sélection multiple + bulk actions ; icônes action (Edit, View, Export) avec labels/tooltip.
- [ ] **Drawer**: détail réponses (clé/valeur), meta, JSON copiable ; timeline webhooks + **Redrive**.
- [ ] **Exports**: CSV (Parquet backlog).

---

## VIII. Navigation & IA

- [ ] **Architecture claire**: Dashboard → Forms → Builder → Viewer (preview) → Submissions → Settings.
- [ ] **Breadcrumbs**: visibles sur sections profondes.
- [ ] **Search/Command**: `⌘K` (optional v1.1) pour navigations/actions.
- [ ] **Deep links**: URLs stables, partageables ; gardez l’état dans `query` quand pertinent.

---

## IX. Performance & Delivery (Budgets)

- [ ] **Viewer bundle**: **< 30 KB gzip** (hors polyfills) ; zero grosses dépendances.
- [ ] **Landing LCP**: < 2.5s (3G rapide simulée) ; hero optimisé.
- [ ] **P95 step render**: Viewer < 400ms sous throttling réseau+CPU.
- [ ] **Code-splitting**: par route ; components lourds en lazy.
- [ ] **Cache**: SWR/Query, HTTP cache, prefetch léger.
- [ ] **Images**: Next/Image, `loading=lazy`, formats modernes ; pas d’images décoratives lourdes.
- [ ] **Fonts**: self-host, subset, `font-display: swap`.
- [ ] **Tables**: virtualisation obligatoire ; renders memoized.

---

## X. Accessibility (WCAG 2.2 AA)

- [ ] **Clavier**: 100% parcours faisable ; ordre logique.
- [ ] **Focus**: visible (`focus-visible:ring-2 ring-primary`).
- [ ] **Labels**: explicit, `aria-label` si icône seule ; `aria-describedby` pour erreurs.
- [ ] **Contrastes**: AA (texte 4.5:1, UI 3:1).
- [ ] **Motion**: respect `prefers-reduced-motion`.
- [ ] **Tests**: axe CI sans violations bloquantes ; screenreader spot checks.

---

## XI. Internationalization

- [ ] **Locale** auto + override `?lang=fr` ; i18n messages ; pluriels.
- [ ] **Formats**: `Intl.DateTimeFormat` / `Intl.NumberFormat` ; espace fine FR.
- [ ] **Text expansion**: layouts tolérants ; pas de libellés tronqués.

---

## XII. Security & Privacy UX

- [ ] **Webhooks**: secret masqué, bouton “Copier”, **rotation** avec confirmation ; signature HMAC SHA‑256 documentée.
- [ ] **Idempotency**: clé affichée/attendue côté submissions ; messages clairs si ré‑essai.
- [ ] **PII**: badges “donnée sensible” ; export CSV avec avertissement.
- [ ] **RGPD**: TTL de rétention visible, suppression irréversible confirmée ; lien DPA.
- [ ] **CSP**: politique strict‑origin‑when‑cross‑origin ; pas de inline non‑nécessaire.

---

## XIII. Content & Microcopy

- [ ] **Ton**: poli, direct, sobre. Pas de jargon.
- [ ] **CTA**: verbes d’action (“Publier”, “Partager”, “Relivrer”).
- [ ] **Erreurs**: indiquer la correction (“Ajoutez au moins une option”).
- [ ] **Empty states**: 1 phrase + CTA ; pas d’illustrations lourdes.
- [ ] **Toasts**: courts, 1 action max.

---

## XIV. Dark Mode

- [ ] **Tokens**: basés HSL ; switch `.dark` ; contrôler contrastes.
- [ ] **Images/Illustrations**: versions adaptées ou désaturées.
- [ ] **Ombres/Bordures**: augmenter bordures en dark (ombres moins perceptibles).

---

## XV. Module Tactics (Spécifiques produit)

### A. Builder

- [ ] **Rail → Canvas → Inspector** (Field/Design/Data) dans cet ordre.
- [ ] **Autosave** (debounce ~800ms), **Undo/Redo** (≥ 50 steps), Preview split.
- [ ] **Keys uniques** pour champs ; validation cycles logique ; avertir avant suppression d’un champ référencé.
- [ ] **Shortcuts**: Del, ⌘/Ctrl+D, ⌘/Ctrl+Z, ⇧+⌘/Ctrl+Z, ↑/↓.

### B. Viewer

- [ ] **Modes** One‑Question & Grid ; **Progress** visible ; **Error Summary** ancré.
- [ ] **Partial Save** (localStorage + POST /partials) ; **Offline banner** ; retries exponentiels.
- [ ] **Anti-spam**: honeypot + time-trap + rate-limit.

### C. Submissions Hub

- [ ] **Table** virtualisée, filtres (texte/date/outcome/status), colonnes ≤ 7 visibles.
- [ ] **Drawer** détail + meta + JSON brut copiable.
- [ ] **Webhooks** timeline, latence, **Redrive**.
- [ ] **Export** CSV.

---

## XVI. CSS & Styling Architecture

- [ ] **Tailwind util-first** + **tokens CSS HSL** ; éviter CSS-in-JS runtime côté Viewer.
- [ ] **Class Variance Authority (cva)** pour variantes ; limiter à ≤ 4 variantes.
- [ ] **Fichiers**: `components/ui/*` (shadcn), `components/app/*` (produit), `styles/tokens.css`.
- [ ] **Lint**: eslint-plugin-tailwindcss ; tri classes ; interdits (couleurs hex directes, !important).

---

## XVII. QA & Review Checklists

### Global

- [ ] Axe CI 0 blocking ; contrastes OK ; focus OK.
- [ ] Responsive 3 tailles (mobile/tablet/desktop) validé.
- [ ] Budgets perf respectés ; **Viewer < 30 KB gzip**.
- [ ] Docs et stories ajoutées ; screenshots clés.

### Builder

- [ ] DnD souris+clavier ; autosave ; undo/redo ; preview split.
- [ ] Inspector Field/Design/Data complet ; validation clés/cycles.

### Viewer

- [ ] One‑Question & Grid ; progress ; summary erreurs ; partial save ; offline ; retries.

### Hub

- [ ] Table virtualisée ; filtres ; export ; webhooks timeline + redrive.

---

## XVIII. Definition of Done (Design)

- [ ] **Lisibilité** (hiérarchie, espace, contrastes).
- [ ] **Accessibilité** (clavier, aria, focus, erreurs).
- [ ] **Cohérence** (tokens, variantes, icônes).
- [ ] **Performance** (budgets, virtualization, images/fonts).
- [ ] **Documentation** (exemples, guidance, limitations).
- [ ] **Tests visuels** (captures, stories, axe report).

---

### Notes d’implémentation rapides

- **Focus**: `focus-visible:ring-2 ring-primary` (ne JAMAIS masquer le focus).
- **Éviter**: modales imbriquées, 6+ variantes par composant, gradients dans le logo, textes < 14px desktop.
- **Un seul CTA primaire** par vue ; secondaire = ghost/secondary.

> Appliquer ce guide **strictement**. En cas d’écart produit nécessaire, créer une “Design Exception” documentée (motif, impact a11y/perf/cohérence) et proposer l’alternative la plus proche.
