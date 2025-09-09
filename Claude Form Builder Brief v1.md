# Builder & Viewer — Execution Brief v1 (Manager → Claude Code)

> **Objectif**: livrer un éditeur (builder) et un viewer (rendu formulaire) **tech, moderne, intuitif**, mix **Typeform (pro/clair)** + **Youform (fun/rapide)**. Style conforme à `DESIGN.md` & tokens brand.

---

## 0) Principes UX/UI (non négociables)
- **Clarity-first**: hiérarchie visuelle nette; pas de chrome inutile; max 2 niveaux de contraste.
- **Speed-feel**: feedback <150ms; micro-animations (ease [.2,.8,.2,1]) discrètes.
- **Keyboard-first**: tout actionnable clavier; `⌘K` pour palette de commandes.
- **A11y AA**: labels explicites; error summary; focus ring visible; mobile 44px.
- **Consistency**: mêmes patterns entre builder et viewer; tokens HSL; radius 16.

---

## 1) Builder (éditeur de formulaires)

### 1.1 Layout (shell)
- **Topbar** (sticky): logo • org/project switcher • form name (inline edit) • actions: `Preview`, `Publish` (primary), status autosave `Saved · 2s ago`.
- **Left Rail (320px)**: **Blocks Library**
  - Sections: *Input, Choices, Layout, Advanced, File & Signature, Payment (stub), Meta*.
  - Recherche + catégories; drag & drop accessible (kbd: `Enter` = pick, `↑/↓` = place; aria live region).
- **Canvas (center)**: pages/sections; multi-questions par écran autorisé; dropzones `dashed` + halo bleu.
- **Right Inspector (360px)**: 4 onglets **Field | Logic | Design | Data** (Tabs shadcn).
  - *Field*: label, placeholder, help, required, validation (regexp preset), mask (tel, currency), default.
  - *Logic*: conditions **if** (combinées AND/OR), actions: show/hide, jump to page, set value, **outcome**.
  - *Design*: width, align, icon, tooltip, description style, hint, CSS classes additionnelles.
  - *Data*: key, piped variables, analytics on/off, notes, privacy (PII flag).

### 1.2 Logic Graph (plein écran)
- Canvas nodes: **Start / Pages / Conditions / Outcomes / End**; edges courbes; minimap; zoom `⌘+ / ⌘-`.
- Palette `⌘K`: "Add rule…" (forme DSL lisible, e.g. *If `q1` includes `@` → jump `Page 2`*).
- Validation à l'enregistrement: cycles interdits; pages orphelines signalées.

### 1.3 Blocs v1 (priorité)
- **Input**: short_text, long_text, email, phone (mask), number, currency, date, time, url.
- **Choices**: select single/multi, radio, checkbox group, rating, NPS, matrix (base).
- **File & Signature**: upload (S3/MinIO direct), signature canvas (png/svg export).
- **Layout**: page break, section, columns (1/2/3), description (rich text limité).
- **Meta**: hidden field, consent checkbox, captcha (stub togglable).
- **Payment (stub)**: Stripe placeholder off-by-default.

**Chaque bloc** expose: label, key (slug unique), required, help, validation, default, visibleIf.

### 1.4 Interactions clés
- **Drag & drop**: indications visuelles claires; scroll auto en bord de viewport; snap précis.
- **Autosave**: debounce 1s; rollback versioning (10 derniers snapshots).
- **Undo/Redo**: `⌘Z / ⇧⌘Z` (histoire au niveau form schema).
- **Preview**: instantanée (pane split) + mode device (mobile/tablet/desktop) + locales.
- **Publish**: freeze du schema versionné `v{n}`; calcul de compatibilité (runtime contract check).

### 1.5 Microcopy (exemples)
- Empty canvas: *“Drag a block from the left to start your form.”*
- Autosave toast: *“Draft saved.”*
- Logic hint: *“Need branching? Press ⌘K and type ‘if’.”*

### 1.6 Performance & a11y
- Pas de recalcul complet du graph à chaque keypress (utiliser dirty flags).
- ARIA: `role="listbox"` pour library, `aria-grabbed` pendant drag, `aria-live` pour confirmations.

**DoD Builder v1**
- Créer/éditer un form avec ≥ 6 blocs, logique simple (show/hide, jump), multi-questions → **Publish** OK.
- Undo/Redo, autosave, preview device, a11y clavier complet.
- Tests E2E: create→add fields→add logic→publish→preview (verts).

---

## 2) Viewer (rendu & complétion)

### 2.1 Modes & structure
- **One‑question** (par défaut, focus maximal).
- **Multi‑grid** (sections/colonnes) option pour denses.
- **Progress bar** top (pourcentage ou steps), titre de page optionnel.

### 2.2 Interactions & feedback
- Transitions inter‑step **150ms** (fade/slide léger); pas de motion lourde.
- **Inline validation** (après blur) + **error summary** scroll‑to sur submit s’il y a des erreurs.
- **Keyboard**: Enter = Next; Shift+Enter = saut de ligne pour textarea; `Esc` annule focus.
- **Offline autosave** (IndexedDB) + *Resume later* (lien magic) — purge locale à submit OK.
- **Partials**: envoi périodique (throttle 5s) ou à chaque step; inclure `respondent_key`.

### 2.3 Inputs & formats
- Email/tel/num: `inputmode` correct; masks; i18n tel.
- File upload: direct S3/MinIO; preview miniatures; limites taille/type; retry; drag‑drop.
- Signature: canvas; effacer; export png; pression légère.

### 2.4 Anti‑spam & sécurité
- Honeypot + time‑trap; rate‑limit; option hCaptcha/reCAPTCHA.
- Webhooks: HMAC `X-Forms-Signature` + `X-Forms-Timestamp` (skew 5 min) côté serveur.

### 2.5 Thank‑you & redirects
- Merci HTML riche (éditeur limité) **ou** redirect 302 paramétrable; boutons partages optionnels.

**DoD Viewer v1**
- Bundle **< 30KB gzip** (CI bloque au‑delà).
- P95 step < 400ms (réseau simulé), a11y AA (axe) vert.
- Partials + submit complets envoyés; reprise hors‑ligne fonctionnelle.

---

## 3) Submissions Hub (réponses)

### 3.1 Layout
- **Header**: titre form, stats (views, submits, completion, avg time), actions (Export CSV/Parquet, Webhooks, Settings).
- **Filters bar**: recherche full‑text, date range, outcomes, has files, tags, champs spécifiques.
- **Table**: TanStack Table + react‑window (virt); colonnes dynamiques selon champs; sticky header.
- **Row → Drawer**: réponses structurées (label + value + files), métadonnées (UA, locale, ip region), **timeline webhooks** (essais/codes/délai), boutons *Redeliver*.
- **Saved views**: création/édition, favoris, partage.

### 3.2 Interactions
- Tagging rapide; bulk actions (export / tag) sur sélection.
- Export CSV/Parquet (job async + toast progress + lien téléchargement).
- Redrive unitaire depuis timeline; confirmations et logs.

**DoD Hub v1**
- 10k lignes fluide; filtres & recherche OK; export OK; drawer complet; redrive opérationnel.

---

## 4) Acceptation & Tests (exécutables)

### 4.1 E2E scénarios (Playwright)
1) **Build & Publish** — crée form (short/email/select/file/signature), ajoute logique (if email includes `@work.com` → jump), publie; preview charge.
2) **Complete** — remplit en mobile viewport; partials envoyés; offline toggle (simulate) puis reprise et submit; thank‑you rendu; webhooks reçus (receiver local).
3) **Hub** — voit la réponse, filtre par email, export CSV, ouvre drawer, redrive échoué→succès.

### 4.2 Tests unitaires
- Builder reducers (undo/redo), validators, logic engine, file upload adapter (retries), signature export.

### 4.3 Gates CI
- a11y axe 0 erreurs bloquantes (3 vues clés).
- Bundle viewer < 30KB gzip.
- P95 step < 400ms (script de mesure fourni).

---

## 5) Instrumentation & Events
- `form_viewed` {form_id, version, locale}
- `step_started` {page_id, order}
- `partial_saved` {respondent_key, progress}
- `submit_succeeded` {duration_ms, size_kb}
- `webhook_delivered` {attempt, code, latency_ms}
- `hub_export_started/exported` {format, rows}

---

## 6) Roadmap d’implémentation (PRs)
- **PR A** — *Builder Shell & Blocks v1* : topbar, rails, canvas, inspector Field/Design/Data, 10 blocs, autosave, undo/redo, preview split, tests unit.
- **PR B** — *Logic Graph & Publish* : graph plein écran, validations, outcomes, publish versioning, E2E build→publish.
- **PR C** — *Viewer Core* : one‑question, progress, inline validation, partials/offline, submit, thank‑you, budgets perf + a11y.
- **PR D** — *Files & Signature* : upload direct + retries + previews; signature; E2E mobile.
- **PR E** — *Submissions Hub* : table virtualisée + filters + drawer + exports + timeline webhooks + redrive.

> Chaque PR inclut: screenshots, court Loom (si possible), checklist DoD, docs README de la zone impactée.

---

## 7) Anti‑patterns & Garde‑fous
- Pas de dépendances lourdes pour le viewer; pas de styles inline massifs (utiliser tokens Tailwind/shadcn).
- Éviter `position: fixed` invasif sur mobile (claviers iOS) — préférer sticky & safe‑areas.
- Ne pas coupler le schema de stockage au rendu (séparer `schema` vs `ui` config).

---

## 8) Ressources (références UI)
- shadcn/ui: patterns Cards/Tabs/Dialog/Sheet/Command.
- Lucide icons: simple, consistent.
- Tailwind: `container max-w-7xl px-6`, spacing `py-24` sections.

---

**Livrable attendu immédiatement (début d’exécution)**
- PR A ouverte dans 48h avec shell builder + 6 blocs + autosave + undo/redo + preview split + tests basiques.
- Ajoute `DESIGN.md` brève pour rappeler tokens & composants utilisés.

