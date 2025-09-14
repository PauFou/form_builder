# Skemya — Builder & Viewer Execution Brief v1

**Owner / Manager**: you • **Executor**: Claude Code • **Scope**: Builder (éditeur) + Viewer (form runtime) + Submissions ingestion (côté client) — _v1 solide, pro, tech, intuitif_.

> Ligne directrice : **simple, moderne, sérieux, tech** (Skemya brand). Stack : **Django API + DRF** (backend), **Next.js + React + TypeScript + Tailwind + shadcn/ui + TanStack Query** (frontend). Tests + a11y AA + perfs budgétées.

---

## 0) Objectifs & résultats attendus

- **Builder** : un éditeur fiable pour créer des formulaires multi‑étapes avec logique conditionnelle.
- **Viewer** : une expérience de remplissage **rapide** (mode question par question et mode grille), accessible, performante, _embed-friendly_.
- **Données** : schéma clair (Form / Version / Page / Field / Logic / Outcome / Submission / Partial), versionning, publication, collecte robuste.
- **Qualité** : tests (unit, component, E2E), **a11y WCAG 2.2 AA**, budgets perf, sécurité (webhooks signés, anti-spam), RGPD (EU, DPA, rétention).

**Definition of Done (v1)**

- On peut créer → publier → partager → remplir → recevoir des soumissions → voir un **merci** → retrouver la soumission côté Hub (même simple) → webhook signé reçu → redrive OK.
- Aucune erreur JS en prod, **bundle viewer < 30 KB gzip** (hors polyfills), **LCP hero < 2.5s** sur landing, P95 step render < 400ms sur réseau simulé « Slow 3G+CPU x4 ».
- **A11y** : navigation clavier complète, focus visible, labels/aria corrects, error summary, contrastes ≥ 4.5:1.

---

## 1) Schéma fonctionnel & Domain Model

### 1.1 Entités principales

- **Form** `{ id, orgId, slug, currentVersionId, createdAt, updatedAt }`
- **FormVersion** `{ id, formId, label, status: 'draft'|'live', schemaJson, theme, createdAt, publishedAt, createdBy }`
- **Page** (dans `schemaJson.pages[]`) `{ id, title, description?, order }`
- **Field** (dans `page.fields[]`) `{ id, type, label, help?, required, key, validations{...}, options?, placeholder?, mask?, default? }`
- **LogicRule** `{ id, when: ConditionExpr, then: Action[] }` (ex: show/hide, jump, set value, outcome)
- **Outcome** `{ id, label, type: 'thankyou'|'redirect'|'webhookOnly', redirectUrl? }`
- **Submission** `{ id, formId, versionId, answers{[key]: value}, meta{ua, locale, ipHash}, outcomeId?, createdAt }`
- **Partial** `{ id, formId, sessionKey, lastPageId, answersPartial, updatedAt }`
- **WebhookEvent** `{ id, type, formId, submissionId, deliveryStatus, attempts[], signature, createdAt }`

### 1.2 Types de champs v1

`shortText | longText | email | select | checkboxGroup | date`

> Backlog: `phone | number | currency | radio | file | signature | matrix`

### 1.3 Validation & logique

- **Validation** : côté viewer (Zod) + côté API (DRF serializers). Messages localisables.
- **Logique** : moteur simple (evaluate → actions). Bloquer boucles (cycle detection) + limite profondeurs.

### 1.4 Versioning & publication

- Éditer toujours sur **draft**. Publier crée **live** immuable.
- Viewer consomme `GET /api/forms/:slug/live` (cacheable). Draft visible via preview token.

---

## 2) API (Django + DRF) — contrats v1

### 2.1 Endpoints

- `POST /api/forms` → crée un brouillon
- `GET /api/forms/:id` → métadonnées form
- `PATCH /api/forms/:id` → titre/slug/org
- `POST /api/forms/:id/versions` → nouvelle version draft
- `PATCH /api/forms/:id/versions/:vid` → `schemaJson`, `theme`
- `POST /api/forms/:id/versions/:vid/publish` → passe en live (et invalide l’ancien live)
- `GET /api/forms/:slug/live` → **schema live** (public)
- `POST /api/forms/:id/submissions` → crée une soumission (HMAC vérifiable côté webhooks)
- `POST /api/forms/:id/partials` → upsert partiel `{ sessionKey, answersPartial, lastPageId }`
- `POST /api/webhooks/test` → envoie un event signé
- `POST /api/redrive` → relivrer un webhook échoué `{ eventId }`

### 2.2 Webhook

- Signature: header `X-Skemya-Signature: t=timestamp, v1=hex(hmacSHA256(body, secret))`
- Événements: `submission.created`, `submission.updated`, `form.published`
- **Idempotency**: header `Idempotency-Key` accepté côté submissions.

### 2.3 RGPD

- EU hosting, DPA, rétention configurable (ex: 36 mois), suppression par form/user.

---

## 3) Front — Builder (Next + shadcn)

### 3.1 Shell

- **Topbar** : logo, nom form, statuts (Draft/Live), actions (Preview / Publish).
- **Left rail (Library)** : éléments draggable (champs v1) + « Page ».
- **Canvas** : pages/sections + placeholders vides (drop-targets). Snap guides.
- **Inspector (Right)** : onglets `Field | Design | Data`.

### 3.2 Interactions

- Drag & drop clavier + souris (accessibilité).
- **Autosave** (debounce 800ms) → PATCH version.
- **Undo/Redo** (historique 50 steps) : changements de structure + props.
- **Preview split** : toggle viewer (même onglet, même schemaJson).

### 3.3 Inspector — détails

- **Field** : label, key auto (slug), required, placeholder, help, validation (min/max/regex) selon type.
- **Design** : layout (one-question/grid), progress, theme (Skemya tokens), radius.
- **Data** : logic rules (if/then), outcomes mapping, webhooks (URL + secret), tracking id.

### 3.4 Erreurs à éviter

- Clés `key` dupliquées → bloquer + autoincrément (`email-2`).
- Graph logique cyclique → validation + banner.
- Suppression d’un field référencé → avertir + « detach logic ».

### 3.5 Keyboard map

- Delete: supprimer sélection • ⌘/Ctrl+Z / ⇧+⌘/Ctrl+Z: undo/redo • ⌘/Ctrl+D: dupliquer • ↑/↓: réordonner

---

## 4) Front — Viewer (runtime)

### 4.1 Modes

- **One‑question** : concentration, transitions douces.
- **Grid** : page avec plusieurs champs (rapide).

### 4.2 UX & A11y

- Progress bar + summary des erreurs en haut (liens ancres).
- Champs : labels explicites, `aria-*`, helper text, state live.
- **Inline validation** (blur + submit), focus management.

### 4.3 Sauvegarde & reprise

- **Partial save** : localStorage `{ sessionKey }` + POST `/partials` throttle 2s.
- **Resume link** optionnel (token court durée).

### 4.4 Anti‑spam & robustesse

- Honeypot + time‑trap + rate limit IP.
- Retry réseau exponentiel (3/5/9s). Offline queue (navigator.onLine).

### 4.5 Fichiers (backlog si non prêt)

- Direct upload (S3/MinIO) avec pré‑signés. Virus scan côté serveur (clamav) — **backlog** v2 si nécessaire.

### 4.6 Performance budgets

- **Bundle viewer < 30 KB gzip** (sans polyfills).
- Hydration ≤ 150ms / step view ≤ 400ms (P95).
- Préchargement léger des prochaines pages en one‑question.

### 4.7 Thème & i18n

- Respect tokens Skemya (light/dark). Langue auto (navigator.language) + param `?lang=fr`.

---

## 5) Submissions Hub (minimum viable v1)

- **Liste** : table paginée 50/200, colonnes (date, outcome, 3 champs clés, status delivery).
- **Filtre** : texte, date range, outcome.
- **Drawer** : détail réponses + meta + JSON brut.
- **Export** : CSV (+ Parquet backlog).
- **Webhooks** : timeline par submission, redrive bouton.

---

## 6) Qualité — Tests, A11y, Perf

### 6.1 Tests

- **Unit** : logique rules, validation schemas, reducers undo/redo.
- **Component** : Field components (controlled), Inspector sections, DnD basics.
- **E2E** : `create → publish → fill → submit → webhook → redrive` (Playwright).
- **Backend** : serializers, webhooks signature, idempotency, redrive.

### 6.2 Accessibilité (WCAG 2.2 AA)

- Navigation clavier complète • Focus visible • `aria-describedby` erreurs • Résumé erreurs ancré.
- Axe (CI) sans violations bloquantes.

### 6.3 Performance

- Budgets ci‑dessus. CI vérifie bundle size (fail si > 30 KB). Lighthouse CI pour landing (LCP < 2.5s).

---

## 7) Sécurité & RGPD

- **Auth** : JWT, throttling endpoints sensibles.
- **Webhooks** : HMAC SHA‑256, fenêtre de validité (±5 min), rejouables via `redrive`.
- **Idempotency** : clé requise côté submissions.
- **RGPD** : EU, rétention (TTL), suppression, consent tracking minimal (cookies si analytics), DPA.
- **Journalisation** : audit pour publish, delete, secret rotate.

---

## 8) CI/CD & Rollout

- **PR pipeline** : lint + tests + a11y + bundle budget. Artefacts build.
- **Staging** : auto‑deploy sur `main`. Smoke test E2E.
- **Prod** : approval manuelle + migrations + blue/green (symlink `current → release_xxx`). Rollback instantané (repoint symlink).
- **Observabilité** : health `/health`, métriques `/metrics` (RPS, latence, erreurs, 429), logs webhooks / redrive.

---

## 9) Plan d’exécution (milestones)

**M0 — Skeletons (½ j)**

- Scaffolding Builder (topbar/rail/canvas/inspector), Viewer shell, routes `/builder/:id`, `/f/:slug`.
- Types domain, adapters API, tokens Skemya, shadcn prêt.

**M1 — Fields v1 (1–2 j)**

- Implémenter 6 champs v1 + validations + Inspector Field.
- Autosave, undo/redo, preview split.

**M2 — Logic & Outcomes (1 j)**

- Rule engine (if/then), outcomes (thank‑you/redirect), cycle guard.

**M3 — Publish & Viewer (1–2 j)**

- Publish draft→live, endpoint live, Viewer one‑question + grid + progress + inline errors.

**M4 — Submissions & Webhooks (1 j)**

- POST submissions, webhook signé, redrive + Hub minimal (liste + drawer + export CSV).

**M5 — Qualité & Perf (1 j)**

- Tests, a11y pass, budgets perfs, hardening anti‑spam, docs.

---

## 10) Checklists DoD (à coller en PR)

### Builder

- [ ] DnD souris + clavier
- [ ] Autosave (debounce) + offline guard
- [ ] Undo/Redo (50 steps)
- [ ] Inspector Field/Design/Data complet
- [ ] Cycle logic guard + messages clairs

### Viewer

- [ ] One‑question + Grid
- [ ] Progress + error summary ancré
- [ ] Inline validation + messages localisés
- [ ] Partial save (localStorage + POST /partials)
- [ ] Anti‑spam (honeypot + time‑trap + rate limit)
- [ ] Bundle < 30 KB gzip

### API

- [ ] Publish draft→live immuable
- [ ] Submissions idempotentes
- [ ] Webhooks signés HMAC + redrive
- [ ] Logs/audit publish/delete/rotate

### Qualité

- [ ] Unit + Component + E2E verts
- [ ] Axe CI 0 blocking
- [ ] LCP hero < 2.5s (landing)
- [ ] P95 step render < 400ms

---

## 11) Gabarits (extraits)

### 11.1 TypeScript — Field

```ts
export type FieldType = "shortText" | "longText" | "email" | "select" | "checkboxGroup" | "date";
export interface FieldBase {
  id: string;
  key: string;
  type: FieldType;
  label: string;
  help?: string;
  required?: boolean;
}
export type FieldValidations = { minLength?: number; maxLength?: number; pattern?: string };
export interface SelectOption {
  value: string;
  label: string;
}
export type Field = FieldBase & {
  placeholder?: string;
  validations?: FieldValidations;
  options?: SelectOption[];
};
```

### 11.2 Submission payload

```json
{
  "formId": "uuid",
  "versionId": "uuid",
  "answers": { "email": "a@b.com", "name": "Ada" },
  "meta": { "ua": "...", "locale": "fr-FR", "ipHash": "sha256:..." },
  "idempotencyKey": "uuid-..."
}
```

### 11.3 Webhook verification (pseudo‑code)

```python
# Django
sig = request.headers.get('X-Skemya-Signature','')
# parse t=..., v1=...
expected = hmac.new(SECRET, body, hashlib.sha256).hexdigest()
# constant‑time compare + timestamp window
```

---

## 12) Risques & mitigations

- **Cycles de logique** → détection DFS + blocage publish.
- **Bundle creep** → guard CI + no extra libs côté viewer.
- **Perte partiels** → double écriture (localStorage + /partials), retries.
- **Spam** → honeypot, time‑trap, rate limit, fingerprint doux (sans cookies marketing).
- **RGPD** → TTL, suppression, minimisation des données (ip hashée).

---

## 13) Livrables PR & Docs

- PR `feat(builder-viewer): v1` avec :
  - captures: Builder (rail/canvas/inspector), Viewer (1‑q & grid), Hub list/drawer
  - `docs/builder-viewer-v1.md` (résumé, shortcuts, FAQ)
  - rapports CI (tests, axe, bundle)
  - checklist DoD cochée

---

## 14) Commandes utiles (Claude Code)

```bash
# Lancer pipeline locale
pnpm -w install && pnpm -w -r run build
pnpm -w -r run lint && pnpm -w -r run test
# E2E (si Playwright)
npx playwright install --with-deps && pnpm -w -r run e2e
```

---

## 15) Backlog immédiat (post‑v1)

- Importers (Typeform/Google) + mapping auto → Blocks v1
- Champs avancés (phone/number/currency/file/signature/matrix)
- Analytics (drop‑off, heat, AB test de wording)
- Organizations & roles, SSO
- Embeds SDK + React hooks, throttling global
