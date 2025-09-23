# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Overview

**Project**: Professional form platform — a fast, reliable, EU‑hosted **alternative to Typeform** that improves on uForm’s value props while eliminating its limitations. Goals:

- **Builder** ultra simple & intuitive, yet powerful (multi‑questions/page, advanced logic, expressions, outcomes)
- **Runtime** featherweight (<30 KB embed), instant, accessible (WCAG AA), mobile‑first, offline autosave
- **Data** first‑class: partial submissions, search & filters, tags, exports, webhooks **including partials**
- **Integrations**: native Sheets/Slack/Notion/HubSpot/Airtable/Make/Zapier + **Stripe** payments; SDK & signed webhooks
- **Importers**: **Typeform (max parity)** + **Google Forms (native)** with parity report & auto‑fallbacks
- **Prod‑first**: canary, feature flags, contract tests, robust CI/CD. Ship **direct to prod** without a separate staging site

**Important**: Hosting & data residency must be **EU** by default (GDPR, DPA available). All customer data stored in EU regions.

**Date**: 09/09/2025

---

## 🎯 Architecture Résumé (Prod‑First)

**User Flows**

```
Visitor → Marketing (Next.js) → Signup → Builder (Next.js app)
                                        ↓
                                  Publish form → CDN edge runtime
                                        ↓
Respondent → Form runtime (CDN) → Edge ingest → Queue → API → DB/Analytics
```

**High‑Level Components**

- **apps/marketing**: Next.js 14 (App Router), public website, docs, pricing
- **apps/builder**: Next.js 14 + Tailwind + shadcn/ui; visual logic editor, expressions, theme builder
- **packages/runtime**: Ultra‑light viewer micro‑bundle (plain TS + minimal React hooks), SSR/SSG + hydration
- **services/api**: **Django 5 + Django REST Framework (Python)** API with OpenAPI via **drf-spectacular**, authentication (JWT via SimpleJWT), RBAC, signed webhooks
- **services/ingest**: Edge Functions (Cloudflare/Vercel Edge) for **submissions & partials** (HMAC, idempotency)
- **services/workers**: Queue consumers (BullMQ / SQS) for webhooks, retries, DLQ
- **data**: PostgreSQL 16 (forms, logic, accounts) + **ClickHouse** (events/analytics) + Redis (rate/queues)
- **storage**: S3‑compatible (EU) for file uploads; AV scan; signed URLs
- **observability**: OpenTelemetry traces + structured logs; Prometheus‑style metrics; uptime/status page

**Performance/SLOs**

- **TTFB edge** (form runtime) < **200 ms**; **P95 step** < **400 ms**; bundle < **30 KB** gzip
- **Ingestion** P95 < **250 ms**; **Availability** ≥ **99.95 %** rolling 30 days
- Webhook delivery with **at‑least‑once**, 24h retry + DLQ; **idempotency** via keys

---

## Components & Responsibilities

### 1) Builder App (apps/builder)

- Blocks library (text, long text, email, phone, number, currency, date, address, dropdown, single/multi select, matrix, rating, NPS, scale, ranking, **signature**, **file upload**, **payment (Stripe)**, **scheduler** embed)
- **Layouts**: one‑question/page **or** multi‑question per screen; repeaters (dynamic lists), sections & pages
- **Logic**: visual graph + rule editor (if/else, show/hide, skip, jump, outcomes)
- **Expressions**: typed expression engine (math, dates, lists, regex, string ops) with variables & scores
- **Theme Builder**: tokens (colors, radius, spacing), typography (font family, size, line-height), components density
- **i18n**: per‑form languages + auto‑detect → string tables; RTL support
- **Publishing**: immutable versions; canary rollout %; instant rollback

### 2) Runtime (packages/runtime)

- Pre‑rendered HTML (SSR/SSG) + progressive hydration; focus management, ARIA labels; accessible error summaries
- **Offline autosave** (IndexedDB), resume links; touch optimized; smooth mobile scroll
- Embed types: full page, inline, popover, side‑drawer; **thank‑you** page supports rich HTML or redirect

### 3) API (services/api)

- **Auth**: email/password + OAuth (Google) optional; JWT access 1h/refresh 7d; organization & projects
- **Forms CRUD**: forms, versions, pages, blocks, logic, themes, assets
- **Importers**: Typeform & Google Forms mappers; parity report (unsupported → suggested alternatives)
- **Submissions**: full & **partial** storage; attachments; GDPR tools (export/delete)
- **Search**: submissions **filters, full‑text**, tags, saved views, CSV/Parquet export
- **Webhooks**: HMAC‑signed, custom headers, delivery logs, redrive; **partials supported**
- **Integrations**: Google Sheets, Airtable, Notion, Slack, HubSpot, Make, Zapier; **Stripe** payments with coupons
- **Admin**: audit log (who/when), roles (Owner/Admin/Editor/Viewer), org limits/quotas, API keys

### 4) Ingest & Workers

- Edge Function validates HMAC, throttles, queues payload
- Workers perform fan‑out (webhooks, integrations), retries with exponential backoff, DLQ & replay UI

### 5) Analytics

- ClickHouse captures events (view/step/change/submit/outcome), funnels & drop‑off; per‑form dashboards

---

## Data Model (abridged)

- **organizations(id, name, plan, seats, limits, …)**
- **users(id, email, hash, verified_at, …)**
- **memberships(user_id, org_id, role)**
- **forms(id, org_id, slug, status, default_locale, created_by, …)**
- **form_versions(id, form_id, version, schema_json, theme_json, published_at, canary_percent)**
- **submissions(id, form_id, version, respondent_key, locale, completed_at, metadata_json)**
- **answers(id, submission_id, block_id, type, value_json)**
- **partials(id, form_id, respondent_key, last_step, value_json, updated_at)**
- **webhooks(id, org_id, url, secret, active, headers_json)**
- **deliveries(id, webhook_id, submission_id|null, partial_id|null, status, attempt, response_code, error, next_retry_at)**
- **audit_logs(id, org_id, actor_id, action, entity, entity_id, diff_json, created_at)**

---

## Security & Compliance

- **GDPR**: DPA, SCCs; data residency EU; data retention policies per org & per form
- **Encryption**: TLS 1.2+, AES‑256 at rest (KMS); secrets via KMS; per‑tenant webhook secrets
- **PII Guard**: field‑level masking, export filters; configurable data deletion SLA (≤ 30j)
- **AppSec**: input validation (Zod/DTO), OWASP top 10 mitigations, CSRF on dashboard, rate‑limits, anti‑automation

---

## Developer Experience

### Monorepo Layout (Turborepo)

```
/ apps
  / marketing
  / builder
/ services
  / api
  / ingest
  / workers
/ packages
  / runtime
  / ui
  / config (eslint, tsconfig)
/ infra (terraform/helm)
```

### Tech Stack

- **Frontend**: Next.js 14, React 19, Tailwind, shadcn/ui, Framer Motion
- **API**: **Django 5 + DRF**, Django ORM (PostgreSQL), **drf-spectacular** (OpenAPI), **SimpleJWT** for tokens, ASGI served via **Uvicorn/Gunicorn**
- **Queues**: **Celery** + **Redis** (dev) / **SQS** (prod) — idempotency keys & DLQ
- **Analytics**: ClickHouse (HTTP interface)
- **CI/CD**: Tests locaux obligatoires via hooks git; Canary + feature flags; OTel traces locales pour smoke tests

### Local Dev Commands

```bash
# bootstrap frontend apps
pnpm i
pnpm dev          # runs marketing & builder in watch mode

# typed checks & lint (frontend)
pnpm typecheck
pnpm lint

# tests (frontend)
pnpm test         # unit
pnpm test:e2e     # Playwright (headless)

# build (frontend)
pnpm build
```

> **Note**: The **API (Django)** runs separately; see next section.

```bash
# bootstrap
pnpm i
pnpm dev          # run all apps/services in watch mode

# typed checks & lint
pnpm typecheck
pnpm lint

# tests
pnpm test         # unit
pnpm test:e2e     # Playwright (headless)

# build
pnpm build        # all packages + docker images
```

### Backend Dev (services/api — Django)

````bash
# create venv & install deps
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# database & server
python manage.py migrate
python manage.py runserver 8000

# celery worker (dev) — uses Redis broker
celery -A api worker -l info

# run tests
pytest -q
```bash
pnpm --filter @forms/api dev
pnpm --filter @forms/api start:debug
pnpm --filter @forms/api test
````

### Release & Deploy

- **Main branch = production** (feature flags; canary rollout 1–5 %)
- Blue/green on API (Gunicorn/Uvicorn workers) & Celery; Edge functions atomic deploy
- Contract tests block deploy if builder/runtime schema mismatch

---

## Importers (Parity‑First)

- **Typeform**: map common blocks (text, choices, matrix, file, payment), logic & outcomes; migration report
- **Google Forms**: parse sections/validations; convert to blocks; preserve required rules
- Unsupported → auto‑suggest closest block; inline notes in the report

---

## Webhooks & Integrations

- **HMAC**: `X-Forms-Signature: sha256=...`, timestamp tolerance 5 min
- **Retries**: 0s, 30s, 2m, 10m, 1h, 6h, 24h; DLQ UI with redrive
- **Partials**: emitted on save and on completion; toggle per integration
- **Prebuilt**: Sheets, Notion, Airtable, Slack, HubSpot, Make/Zapier; Stripe charge + metadata propagation

---

## Observability & Quality Gates

- **SLOs** codified; synthetic checks from 3 EU regions; status page public
- **Tracing**: edge→queue→webhook chain correlated by request id
- **E2E Scenarios**: builder create → publish → submit (desktop+mobile) → webhook receipt; s'exécute à chaque commit local
- **Chaos Light**: injected latency & failure to verify retries & idempotency

---

## Pricing & Plans (proposition initiale)

- **Free (org‑scoped)**: 3 forms actifs, 1 000 réponses/mois, 10 Mo/fichier, branding requis
- **Pro**: custom domains, remove branding, multi‑langue, thank‑you HTML, webhook **partials**, payments, analytics avancées
- **Scale**: SSO SAML, siège illimités, audit avancé, quotas élevés, support prioritaire

---

## Production Runbook

- **Incident severities** (SEV1–3), on‑call rotation, RFO template
- **Rollback**: immediate via version pin; database migrations must be **reversible**
- **Keys**: rotate webhook secrets annually; HSTS on public hosts
- **Backups**: Postgres PITR; ClickHouse snapshots daily; restore drills quarterly

---

## API Surface (excerpt)

```
POST   /v1/auth/login
POST   /v1/orgs
GET    /v1/forms            # list
POST   /v1/forms            # create
GET    /v1/forms/:id        # read
PUT    /v1/forms/:id        # update
POST   /v1/forms/:id/publish
POST   /v1/forms/:id/import # { type: "typeform" | "google_forms", source: ... }

GET    /v1/forms/:id/submissions?query=...&tags=...&after=...&before=...
POST   /v1/forms/:id/submissions/export

GET    /v1/webhooks
POST   /v1/webhooks
POST   /v1/webhooks/:id/test
GET    /v1/webhook-deliveries?status=failed
POST   /v1/webhook-deliveries/:id/redrive
```

---

## Environment & Config

- `.env.example` with `POSTGRES_URL`, `REDIS_URL`, `CLICKHOUSE_URL`, `S3_*`, `JWT_SECRET`, `HMAC_SECRET`, **`DJANGO_SECRET_KEY`**, **`ALLOWED_HOSTS`**, **`CELERY_BROKER_URL`**, **`CELERY_RESULT_BACKEND`**
- All secrets in KMS (prod), never committed; config via 12‑factor

---

## Claude Working Rules (for this repo)

1. **No sudo**; if needed, list commands for the operator
2. **Read before write**: always inspect current schema contracts before changes
3. **Contract tests first** when altering form schema or runtime
4. **Minimal PRs**; observable impact; update this CLAUDE.md if architecture changes
5. **Performance budgets** are gates; reject diffs that exceed runtime bundle size
6. **Accessibility is non‑negotiable**: block merges if WCAG AA checks fail
7. **NEVER skip tests**: JAMAIS utiliser `SKIP_TESTS=true` lors des commits/push. Toujours faire face aux échecs de tests et les corriger. Les tests qui échouent indiquent des problèmes réels qui doivent être résolus, pas contournés.

## 🚨 TESTS LOCAUX OBLIGATOIRES (CRITICAL FOR CLAUDE)

### Processus de Validation Local

Claude DOIT s'assurer que TOUS les tests passent AVANT tout commit. Le projet utilise des hooks git pour validation automatique.

#### Tests Rapides (pour itération de développement)

```bash
bash scripts/test-quick.sh  # Validation locale rapide
```

#### Validation Complète (avant commit)

```bash
bash scripts/test-complete.sh  # Suite de validation complète
```

#### Hook Pre-Commit (automatique)

```bash
# S'exécute automatiquement via Husky avant chaque commit
# Configure dans .husky/pre-commit
```

### Vérifications Critiques

1. **Dépendances Backend**: Le projet nécessite `python-decouple` pour les settings Django

   ```bash
   bash scripts/check-backend-deps.sh  # Vérifier les dépendances Python
   ```

2. **E2E Prêt**: Toutes les pages doivent avoir des landmarks d'accessibilité appropriés
   ```bash
   bash scripts/check-e2e-ready.sh  # Vérifier que E2E passera
   ```

### Approche Intelligente des Tests

Claude doit être INTELLIGENT avec les tests:

1. **Comprendre la Cause Racine**: Quand les tests échouent, analyser POURQUOI:
   - Est-ce un problème d'environnement?
   - Est-ce un vrai problème de code?
   - Est-ce un test instable?

2. **Adapter et Corriger**: Ne pas juste essayer de faire passer les tests. Corriger le VRAI problème:
   - Si avertissements React: Corriger le code, ne pas supprimer
   - Si taille du bundle: Optimiser les imports, ne pas augmenter les limites
   - Si erreurs de type: Ajouter des types appropriés, ne pas utiliser `any`

3. **Évolution**: Claude peut et DEVRAIT:
   - Mettre à jour les scripts de test quand ils deviennent obsolètes
   - Améliorer l'efficacité des tests tout en maintenant la précision
   - Ajouter de nouvelles validations au fur et à mesure que le projet grandit
   - Corriger les tests instables de manière permanente

### Solutions aux Problèmes Courants

| Problème             | Cause Racine                            | Solution                                |
| -------------------- | --------------------------------------- | --------------------------------------- |
| Tests frontend       | `pnpm test` vs `pnpm test:ci`           | Toujours utiliser `pnpm test:ci`        |
| Taille du bundle     | Vérification analytics manquante        | Exécuter `check-bundle-size.js` complet |
| Avertissements React | act() ne wrappant pas les updates async | Wrapper correctement avec act()         |
| Erreurs de type      | Config TypeScript différente            | Utiliser le mode strict partout         |
| Tests backend        | SQLite vs PostgreSQL                    | Utiliser PostgreSQL localement          |

### Checklist Pre-Commit

Avant CHAQUE commit, Claude DOIT:

1. ✅ Exécuter `pnpm lint` - ZÉRO erreur permise
2. ✅ Exécuter `pnpm typecheck` - ZÉRO erreur permise
3. ✅ Exécuter `pnpm test:ci` - TOUS les tests doivent passer
4. ✅ Exécuter `bash scripts/test-complete.sh` - DOIT retourner 0
5. ✅ Vérifier aucun type `any` ajouté
6. ✅ Vérifier aucun ESLint disable ajouté
7. ✅ Vérifier taille du bundle < 30KB

### Maintenance Intelligente des Tests

Claude devrait proactivement:

- Garder les scripts de test à jour
- Documenter toute nouvelle exigence d'environnement
- Corriger les causes racines, pas les symptômes

---

## Initial Roadmap (90 days)

- **V0 (Week 1–3)**: Monorepo, auth, orgs, Forms CRUD, basic blocks, publish, runtime SSR, submissions, CSV export
- **V1 (Week 4–6)**: Logic graph, expressions, multi‑question layouts, partials (edge), webhooks signed + deliveries UI
- **V1.1 (Week 7–9)**: Typeform import (high parity), Google Forms import (core), Sheets/Slack/Notion
- **V1.2 (Week 10–12)**: Submissions search+filters+tags, analytics funnels (ClickHouse), payments (Stripe)
- **Hardening (Week 13)**: A11y audits, perf budgets, chaos light, RFO drill

---

## Naming & Brand

- Placeholder: **\[ProductName]**. Color system to be decided. Dark/light themes supported via tokens.

---

> This document is the source of truth for engineering decisions. Keep it tight, pragmatic, and production‑oriented.

---

## 🚨 Code Quality & Commit Standards (CRITICAL)

### Pre-Commit Requirements

**EVERY piece of code MUST pass ALL checks before commit:**

1. **ESLint**: Zero errors allowed

   ```bash
   pnpm lint  # Must pass with 0 errors
   ```

2. **TypeScript**: Strict type checking

   ```bash
   pnpm typecheck  # Must pass completely
   ```

3. **Tests**: All tests must pass

   ```bash
   pnpm test  # 100% of tests must pass
   ```

4. **Build**: Must build successfully
   ```bash
   pnpm build  # No build errors
   ```

### Common Issues to Avoid

1. **NO `any` types**: Always provide proper types

   ```typescript
   // ❌ BAD
   const handleSubmit = (data: any) => {};

   // ✅ GOOD
   const handleSubmit = (data: FormData) => {};
   ```

2. **Fix React warnings**:
   - Always wrap async state updates in `act()`
   - Include all dependencies in useEffect/useCallback
   - Don't pass non-DOM props to DOM elements

3. **ESLint compliance**:
   - Use `eslint-disable-next-line` sparingly and with justification
   - Fix the actual issue instead of disabling rules

### Pre-Commit Checklist

Before ANY commit:

1. Run `pnpm lint:fix` to auto-fix what's possible
2. Manually fix remaining lint errors
3. Run `pnpm typecheck` and fix all type errors
4. Run `pnpm test` and ensure ALL tests pass
5. Run `pnpm build` to verify build succeeds

### Git Hooks

The project uses Husky for pre-commit hooks that will:

- Run ESLint on staged files
- Block commits if there are any errors
- Automatically revert changes if checks fail

**If pre-commit fails, you MUST fix the issues before committing.**

---

## Commit & PR Standards

### Conventional Commits

Use Conventional Commits for **every** change:

- `feat:` new user-visible feature
- `fix:` bug fix
- `perf:` performance improvement (must include metric before/after)
- `refactor:` no behaviour change, internal restructuring
- `chore:` tooling, deps, CI, docs, etc.
- `revert:` revert a previous commit

> Prefix with scope when utile (e.g. `feat(api):`, `fix(runtime):`).

### PR Template (copy in description)

```md
## Contexte

[User story / issue / liens]

## Plan d’exécution

- [ ] Schémas/contrats mis à jour (OpenAPI/JSON‑Schema/TS)
- [ ] Migrations + plan de **rollback**
- [ ] Impacts **perf** (bundle, TTFB, P95) & **a11y** documentés
- [ ] Observabilité (logs/traces/metrics) couverte

## Tests

- [ ] Unit back (pytest)
- [ ] Unit front (vitest/jest)
- [ ] E2E Playwright (desktop + mobile)
- [ ] Budgets **perf** respectés (viewer <30KB, TTFB/P95)
- [ ] **A11y AA** validée (axe, navigation clavier)

## Sécurité

- [ ] AuthN/AuthZ
- [ ] Webhooks signés + tolérance d’horloge
- [ ] Idempotency + retries + DLQ
- [ ] RGPD: export/suppression PII si applicable
```

### Test Coverage (seuils bloquants locaux)

- **Backend (Django/DRF)**: **≥ 80%** lines & branches global (pytest/coverage)
- **Frontend (React/Next)**: **≥ 80%** statements & branches global (vitest/jest)
- **E2E**: scénarios critiques verts (create → publish → submit → webhook → redrive)

> Les hooks git bloquent le commit si les seuils ne sont pas atteints ou si les budgets perf/a11y sont dépassés.
