# Skemya — Product Blueprint v1 + UI/UX Playbook

**Objectif**: livrer un SaaS de formulaires **ultra moderne, sobre, efficace, intuitif et sérieux**, surpassant Typeform/Tally/Fillout sur la création, la collecte et l’exploitation des réponses.

**Audience**: Claude Code, équipe produit/eng/design, DevOps, SecOps.

---

## 0) Résumé Exécutif

- **Proposition de valeur**: Création de formulaires pro, conversion élevée, analytics “téléscope” (funnel/drop-off/attribution), sécurité/RGPD EU, prix prévisibles.
- **Différenciateurs**: AI Assist (brief→form), import 1‑clic depuis concurrents, Webhooks v2 (HMAC+rotation+replay), Logic Map, A/B testing natif, anti‑spam SaaS‑grade, enterprise (SSO/SCIM), runtime embed <30KB.
- **Budgets**: Viewer ≤30KB gzip, LCP landing <2.5s, P95 submit <500ms, AA (a11y), 0 HIGH/MEDIUM (sec review).

---

## 1) Personas & Jobs-to-be-done

- **Growth/Marketing**: lancer des campagnes, optimiser la conversion, suivi UTMs, A/B rapide.
- **Ops/Support**: intake tickets/retours avec SLA, exports planifiés, webhooks fiables.
- **Produit/UX**: itérer vite sur la copie et la logique, analytics par champ, tests.
- **Enterprise IT**: conformité (RGPD/SOC2), SSO/SCIM, rétention/cryptage, audit trails.

---

## 2) Périmètre Fonctionnel (MVP+)

- **Builder**: DnD, logique visuelle, thèmes, versioning+diff, collaboration (v2), i18n.
- **Viewer**: modes One‑Question/Grid, A/B, partial save, offline, anti‑spam, PWA.
- **Submissions Hub**: table virtualisée, filtres, drawer détail, export CSV/JSON, redrive webhooks.
- **Analytics**: funnel, drop‑off par champ, temps par étape, attribution UTM/referrer, cohortes.
- **Intégrations**: Webhooks HMAC v2, Slack, Sheets, HubSpot, BigQuery/Segment (phases), Stripe (paiement champ).
- **Admin/Org**: Teams/Roles (Owner/Admin/Editor/Viewer), SSO/OIDC (SAML en v2), facturation.

---

## 3) Architecture

- **Frontend**: Next.js 14 (App Router), React 19, TS, Tailwind + shadcn/ui, Zustand, RHF+Zod.
- **Runtime**: /packages/runtime, SSR/SSG, hydratation progressive, embed/popup/fullpage, PWA.
- **Backend**: Django 5 + DRF, PostgreSQL 16, Redis, Celery; service d’ingest FastAPI en edge.
- **Analytics**: ClickHouse (événements), exports planifiés.
- **Infra**: Docker, CDN, S3‑compatible EU, Edge Functions, GitHub Actions CI/CD.

---

## 4) Sécurité & Conformité

- **Auth**: JWT (rotation), RBAC fin (org/project/form). SSO/OIDC (v1.1), SAML (v2).
- **Webhooks v2**: HMAC SHA‑256, horodatage, fenêtre de relecture, rotation clé, redrive UI.
- **PII/DLP**: champs sensibles tagués, export partiel, rétention 30/60/90j, suppression irréversible.
- **CSP**: strict‑origin‑when‑cross‑origin + nonces; Trusted Types (viewer).
- **Uploads**: scan antivirus, blocage types dangereux, quotas.
- **RGPD**: DPA self‑service, data residency EU, audit logs (accès/exports).

---

## 5) Performance & Fiabilité

- **Budgets**: viewer ≤30KB gzip; P95 submit <500ms; LCP landing <2.5s.
- **Anti‑spam**: Turnstile/Invisible, honeypot dynamique, time‑trap, heuristiques IP/ASN.
- **Idempotence**: clés sur ingest, retries exponentiels, dead‑letter queue.
- **Observabilité**: métriques (RPS, erreurs, latences), traces, logs structurés, alertes SLO.

---

## 6) Roadmap (S1→S3)

- **S1**: AI Assist v1, Versioning+Diff, Webhooks v2, Anti‑spam bundle, Import Typeform/Tally v1.
- **S2**: Funnels/drop‑off/UTM, A/B testing, Segmentation/Tag rules, Exports programmés.
- **S3**: Collab temps réel + commentaires, Logic Map, i18n (multi‑langue & RTL), SCIM.

**Gates**: 0 HIGH/MEDIUM (sec), coverage ≥80%, budgets perf OK, AA OK.

---

## 7) Data Model (extrait)

- **Org/Team/User**: rôles, SSO ids.
- **Project**: collection de formulaires.
- **Form**: schema (champs, pages, logique), thème, versions.
- **Submission**: réponses, meta (UA, IP hashée, UTM), statut.
- **Event** (ClickHouse): view/start/step/field_focus/field_error/submit/success/fail.
- **Integration/Webhook**: endpoints, secrets versions, retries, DLQ.

---

## 8) Event Tracking (ClickHouse)

- `form_view(form_id, session_id, ts, referrer, utm_*)`
- `form_step(form_id, page, ts, duration_ms)`
- `field_focus(form_id, field_key, ts)` / `field_error(...)`
- `form_submit(form_id, ts, size_kb, offline)` / `form_success(form_id, ts)`
- **Clés**: `(form_id, session_id, ts)`; TTL 180j.

---

## 9) QA/CI/CD Gates

- **Tests**: Unit, API, E2E (Playwright), perf, contract.
- **Sec Review**: Workflow "Skemya — Security Review (PR)" (0 High/Medium).
- **A11y**: axe — 0 blocking; focus visible; labels.
- **Perf**: lighthouse viewer/landing; bundle check; traces P95.

---

## 10) Design Principles (raccourci)

- **Clarté > Effets**; **1 CTA primaire** par vue; états complets; tailles ≥14px.
- **Tokens HSL**; radii 16; ombres sobres; neutralité colorimétrique.
- **Focus visible**; clavier complet; AA.
- **Doc composant**: variantes ≤4; do/don’t; exemples.

---

# UI/UX Playbook — Pages & Modules (spécifications précises)

## A) Landing (Marketing)

**But**: compréhension instantanée + conversion vers essai.

- **Hero**: promesse en 7‑12 mots, sous‑titre preuve, CTA primaire (“Essayer gratuitement”), secondaire (“Voir démo”). Logos confiance.
- **Sections**: Features (3 piliers), How it works (3 étapes), Comparatif (table succincte), Pricing (3 plans), FAQ (6‑8).
- **UI**: grille 12, `max-w-7xl`, whitespace généreux, preuves sociales.
- **Perf**: LCP image optimisée (Next/Image), fonts self‑host.
- **A11y**: titres H1→H2, nav clavier, contrastes AA.

## B) Auth (Signup/Login/Reset)

**But**: friction minimale, sécurité claire.

- **Signup**: email, password + SSO (Google/MS). Mot de passe règles inline.
- **Login**: email/pass + SSO; lien “Magic link” optionnel.
- **UI**: carte centrée, `sm:max-w-md`, labels clairs, erreurs concises.
- **Sec**: messages génériques (éviter user enum), throttling discret, cookies `HttpOnly` si session.

## C) Dashboard (Home)

**But**: orientation + actions rapides.

- **Header**: search, org switcher, profil.
- **Widgets**: “Vos formulaires” (récents), “Soumissions récentes”, “Tâches” (webhooks en échec), “Insights rapides”.
- **CTA**: Créer un formulaire, Importer.
- **Empty state**: illustration légère + “Créer depuis un modèle/depuis un prompt (AI)”.

## D) Forms List

**But**: retrouver, filtrer, agir en masse.

- **Toolbar**: recherche, filtres (projet, statut, date), tri, boutons bulk (archiver, dupliquer, exporter).
- **Table**: nom, statut (Brouillon/Live), conversions, soumissions 7j, MAJ. Row → actions (éditer, partager, analytics).
- **Empty**: “Créez votre premier formulaire” + templates.

## E) Form Builder

**But**: composer vite, sans ambiguïté.

- **Layout**: **Rail** (Library) à gauche, **Canvas** au centre, **Inspector** à droite (tabs Field/Design/Data). Header sticky (nom, statut, Preview, Publish).
- **Interactions**: DnD, undo/redo, autosave (debounce 800ms), raccourcis (Del, ⌘D, ⌘Z, ↑/↓).
- **Library**: champs par catégorie (Base, Choix, Fichier, Paiement, Avancé, Intégrations). Recherche.
- **Inspector/Field**: label, clé, required, placeholder, help, validation (Zod), messages d’erreur.
- **Inspector/Design**: thème (couleurs/typo/radii/espaces), layout (one‑question/grid), progress, boutons.
- **Inspector/Data**: logique (if/else, jump), calculs, webhooks, mapping intégrations.
- **Error prevention**: clés uniques, avertir si suppression d’un champ référencé; linter logique (dead‑ends).
- **Versioning**: menu versions + diff visuel (ajouts, suppressions, modifs).

## F) Viewer (Form Runtime)

**But**: conversion maximale, accessibilité.

- **Modes**: One‑Question (par défaut) / Grid (compact).
- **Header**: logo optionnel, barre de progression (étapes ou %).
- **Pattern champ**: Label → Input → helper → error; validations au blur + summary à submit (ancres).
- **Nav**: Suivant/Précédent, raccourcis clavier, scroll lock.
- **Partial Save**: sauvegarde locale + reprise; bandeau offline si déconnecté.
- **Anti‑spam**: honeypot, time‑trap, Turnstile; feedback discret.
- **Terminé**: écran de succès (message personnalisé, CTA retour site, partage).
- **Perf**: sans dépendances lourdes; images lazy; fonts swap.

## G) Submissions Hub

**But**: exploiter rapidement les réponses.

- **Toolbar**: filtres (date, status, outcome), recherche, tags.
- **Table**: virtualisée >200; colonnes configurables (≤7 visibles).
- **Drawer**: détail réponse (clé/valeur), meta (UTM, UA), JSON brut, timeline webhooks + **Redrive**.
- **Bulk**: export CSV/JSON, retag, suppression (avec confirmation).

## H) Analytics (Insights)

**But**: comprendre et optimiser.

- **Sections**: Vue d’ensemble (conversion globale, vues, starts, abandons), **Funnel par étape**, **Drop‑off par champ**, **Temps moyen** par question, **Attribution** (UTM/referrer, device), **A/B** (variants, uplift, p‑value).
- **UI**: cartes simples, graphes clairs, tables triables; permaliens avec filtres.

## I) Integrations & Webhooks

**But**: brancher sans douleur.

- **Catalogue**: cartes (Slack, Sheets, HubSpot, BigQuery, Zapier/Make).
- **Détail**: configuration champ‑à‑champ, tests de connexion, logs récents.
- **Webhooks**: URL, secret (copier), rotation, horodatage, fenêtre 5min; liste des livraisons (200 dernières) + **replay** individuel/lot.

## J) Share / Embed

**But**: publication simple et sûre.

- **Lien public** (randomized id), **domaine custom** (pro).
- **Embed**: iFrame + script loader, **CSP** recommandé, options (height, auto‑resize, theme).
- **QR**: génération; suivi UTM.

## K) Settings (Form)

**But**: gouvernance par formulaire.

- **Général**: nom, dossier, statut, langue(s), timezone.
- **Accès**: public/protégé par mot de passe, fenêtre de disponibilité.
- **Données**: rétention, export auto, PII flags, consentements.
- **Notifications**: email/Slack, conditions.

## L) Settings (Project/Org)

**But**: sécurité et conformité.

- **Membres & Rôles**: invitations, rôles, SSO/OIDC (v1.1), SCIM (v2).
- **Sécurité**: 2FA, politiques mot de passe, IP allowlist (enterprise).
- **Facturation**: plan, limites, utilisation, factures, moyens de paiement.
- **Logs/Audit**: accès, exports, config webhooks/intégrations.

## M) Templates & Import Wizard

**But**: démarrage express et migration facile.

- **Templates**: filtrables par use case (lead/NPS/survey/event/HR). Preview + “Use template”.
- **Import**: Typeform/Tally/Google → mapping auto + compat checker (warning si non 100%).

## N) Erreurs & Empty States

- **Empty**: 1 phrase + CTA; pas d’illustrations lourdes.
- **Erreurs**: message actionnable (“Ajoutez au moins un choix”), pas d’info sensible.
- **404/500**: ton sobre, lien de retour, id d’incident.

## O) Mobile Responsiveness

- **Nav**: drawer pour menus, toolbar compacte.
- **Form**: champs pleine largeur, boutons grands, espacement 16–24.
- **Tables**: colonnes essentielles, overflow horizontal, actions dans kebab.

---

## Microcopy & Ton

- **Sobre, direct, empathique**.
- **CTA**: verbes (“Publier”, “Partager”, “Relivrer”, “Exporter”).
- **Erreurs**: cause + correction.
- **Tooltips**: courts, pas critiques.

---

## Accessibilité (rappels)

- Focus visible (`focus-visible:ring-2 ring-primary`).
- Labels explicites; `aria-describedby` pour erreurs.
- Contrastes AA; respect `prefers-reduced-motion`.

---

## Definition of Done (UI/UX)

- Hiérarchie claire, un seul CTA primaire par écran.
- A11y AA sans violation bloquante.
- Composants conformes tokens (pas de couleurs arbitraires).
- Perf budgets respectés.
- Storybook + docs d’usage + captures.
- Checklists par page cochées.

---

### Annexes rapides

- **Tokens**: HSL brand/semantic, radii 16, shadows 2 niveaux, typography Inter/Geist.
- **Raccourcis**: Builder (Del, ⌘D, ⌘Z, ⇧⌘Z, ↑/↓).
- **Données sensibles**: tagger champs, éviter les exports par défaut, demander consentement.

> Appliquer ce blueprint **strictement**. Toute exception = “Design/Security Exception” documentée (motif, impact, mitigation).
