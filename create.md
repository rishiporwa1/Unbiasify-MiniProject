# Unbiasify Product Roadmap

> Based on the supplied README. The README describes a prototype; roadmap items are recommendations, not existing features.

## 1. Product purpose and real-world use

**Unbiasify** is a writing review assistant that examines text for sentiment and possible linguistic bias. A user submits text, the Django REST backend currently evaluates TextBlob polarity, and the React/Vite interface shows a positive, negative, or neutral result. Signed-in users can see a limited recent history and summary counts.

Sentiment is not bias. A polarity score cannot determine fairness, truth, author intent, or harm. The product should surface evidence and possible concerns for a person to assess in context, rather than issue an objective verdict.

Practical uses include:

- **Writers and editors:** catch wording that may sound loaded, one-sided, or unnecessarily emotional before publication.
- **Teachers and students:** discuss framing, word choice, and support for claims in essays and news coverage.
- **People teams:** review job posts and internal communications for potentially exclusionary wording. Never use it to rank applicants.
- **Communications teams:** check announcements, help content, and customer messages for tone and clarity.
- **Researchers and media-literacy groups:** compare wording across a corpus as a lead for human analysis, not as ground truth.

Do not present Unbiasify as legal compliance certification, a substitute for editorial judgment, or a system for scoring people.

## 2. Current features described in README

| Area | Described as existing |
|---|---|
| Frontend | React 19 + Vite, Tailwind, glassmorphic design, ambient Three.js visual, client-side home/login/register/forgot/profile views. |
| Single-text analysis | Authenticated `/api/analyze/` accepts up to 5,000 characters, computes TextBlob polarity, labels Positive/Negative/Neutral, and records the analysis. |
| Accounts | Django accounts with SimpleJWT access/refresh tokens, username-or-email login, password validation/reset/change, profile edit, and account deletion. |
| History | Profile summary counts and the 20 most recent analyses with preview, label, polarity, and timestamp. |
| Data/backend | Django REST Framework models `TextAnalysis` and `PasswordResetToken`; PostgreSQL via `DATABASE_URL` or SQLite locally, according to README. |

The README does **not** say that bias categories, evidence highlights, uploads, URL analysis, multilingual analysis, or Clerk/Supabase are implemented. Confirm each current-state item against source code before using it as a release checklist.

## 3. Product principles

1. **Evidence before verdicts:** show the words behind a flag and why they may matter.
2. **Visible uncertainty:** describe a “possible signal,” not proof; avoid one bias percentage.
3. **Context matters:** account for quotation, negation, satire, reclaimed terms, and domain language where feasible.
4. **User control:** suggestions are optional; edits require user choice; preserve the original.
5. **Privacy by default:** explain retention; support deletion and export; analyze only what is needed.
6. **Measure usefulness and harm:** evaluate false positives, misses, language coverage, and subgroup performance.

## 4. Prioritized roadmap

### MVP — understandable, trustworthy single-text analysis

1. Separate sentiment from possible bias signals in both API and interface.
2. Define a small, reviewable taxonomy: loaded/emotive wording, unsupported generalization, potentially stereotyped/group-targeting language, and one-sided framing. The last is a prompt for review, not a finding.
3. Return sentence/span offsets and plain-language explanations; highlight the evidence and allow users to rate a flag as useful or irrelevant.
4. Add basic quotation and negation handling; mark ambiguous cases as uncertain.
5. Offer optional neutral rewrite suggestions that preserve meaning. Users review and edit; never silently replace source text.
6. Migrate authentication to Clerk in stages; keep Django as the API and Supabase PostgreSQL as app storage (architecture below).
7. Add history open/delete and a clear save/ephemeral choice.
8. Add request validation, rate limits, safe logs, backups, and a clear retention notice.

**MVP exit:** a user can submit text, understand results, inspect evidence, edit an optional suggestion, and delete saved history. Results are described as advisory; another user cannot access the record.

### Next — workflows for regular use

- Tone and readability panel: clarity, sentence length, jargon, approximate reading level, formality, warmth, and urgency. Keep each metric distinct and explain its limits.
- Inclusive-language suggestions with alternatives and tradeoffs, not a universal approved-word list.
- Document input (`.txt`, then text-based `.pdf`/`.docx`) with file/page limits, extraction preview, and warnings for scans or lost layout.
- Background batch analysis with per-item status, cancellation, and deletion.
- URL import after SSRF protections: public pages only, safe redirect/address checks, response limits, and extracted-text preview.
- History search/filter; CSV/JSON and readable report export; date/category filters.
- Personal dashboard with activity trends and category counts, never a writing-quality grade.
- Preferences for language, suggestion style, save default, and retention.
- Keyboard-operable highlights, screen-reader explanations, contrast, reduced motion, and responsive layout.

### Later — teams and advanced analysis

- Multilingual analysis only after language-specific annotation and evaluation; show coverage and allow language override. Do not claim parity by translating English rules.
- Context-aware analysis by document type, audience, and purpose; context guides interpretation but never silently changes text.
- Organization workspaces, roles, shared folders, invitations, style guides, and retention policies.
- Collaboration: span-anchored comments, reviewer assignment, version comparison, and change history.
- Admin console for members, quotas, detector versions, retention, audit events, and service health. Admins should not casually inspect private text.
- Constrained model-assisted explanations and rewrites, grounded in source spans, schema-validated, protected against prompt injection, and able to abstain.
- API keys/OAuth, webhooks, and editor/CMS integrations after demand is established.

## 5. Analysis design

### Proposed bias categories

Start with a few categories that are explainable and testable:

- **Loaded/emotive wording:** language may push a reaction beyond the factual claim.
- **Unsupported generalization:** broad statement about a person/group without evidence in the supplied text.
- **Potential stereotyping/group targeting:** attributes a trait or role to a group; sensitive category with high false-positive risk.
- **One-sided framing:** relevant counter-position or uncertainty may be absent; label as a review prompt, especially for short excerpts.

Store category, offsets, explanation, confidence band, detector/version, and optional feedback. Do not infer protected traits about author or audience.

### Evidence and explainability

Highlight the smallest useful span and surrounding sentence. Distinguish observation (“uses an absolute term”) from interpretation (“may overgeneralize”). Explain that no flags does not mean a document is unbiased. Offer useful / irrelevant / missed-issue feedback; keep it private by default.

### Suggestions, tone, and readability

Suggestions are alternatives, not corrections. Preserve names, numbers, claims, and uncertainty; explain what changed; support accept/edit/undo; never overwrite automatically. Tone (formal, warm, urgent, confrontational) is distinct from sentiment. Readability scores are approximate and can mislead with technical or multilingual text; show the measure rather than a quality grade.

## 6. Example workflows

**Student:** paste a paragraph, select general writing, inspect sentiment and possible flags separately, open a highlight explanation, compare/edit an optional rewrite, then save or discard.

**Recruiter writing a job post:** select job-post context, inspect potentially exclusionary wording and clarity suggestions, review with the team, and export a change summary. Do not score applicants.

**Communications editor:** upload two drafts, compare tone/readability and paragraph evidence, accept/reject/edit suggestions, export the final report, and delete source files under the retention policy.

**Researcher (later):** submit a corpus with source metadata, analyze in a chosen language, inspect sampled evidence as well as counts, and export results with detector version and limitations.

## 7. Personas

| Persona | Need | Product response | Guardrail |
|---|---|---|---|
| Maya, student | Learn why wording may feel one-sided | Simple explanations, highlights, optional rewrites | Do not grade viewpoint |
| Daniel, editor | Review many drafts consistently | History, document/batch tools, comparison, export | Human editorial approval |
| Priya, people-ops writer | Make job posts clear and welcoming | Job context and inclusive suggestions | Never rank candidates |
| Lee, instructor | Teach framing and media literacy | Explainable flags and comparisons | Show disagreement and false positives |
| Sam, privacy-conscious user | Analyze sensitive writing safely | Ephemeral mode, deletion/export, clear retention | No hidden training reuse |

## 8. Suggested pages

1. **Analyze:** editor, character count, context/language, save choice, sample prompt, privacy hint.
2. **Results:** separate sentiment, bias, tone, readability; highlighted source, evidence drawer, suggestions, uncertainty/limitations.
3. **History:** search, filters, saved state, open/delete/export.
4. **Dashboard:** usage and trends with clear date range and denominators; no bias leaderboard.
5. **Documents/Batch:** upload, extraction preview, progress, cancel, result, delete.
6. **Profile/Preferences:** Clerk identity entry point, language, retention, export, account deletion, session management.
7. **Workspace (later):** members, roles, shared folders, style guide, plan limits.
8. **Admin (later):** support metadata, quotas, detector versions, health, audit trail; hide text by default.

## 9. Suggested Django REST API

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/v1/analyses/` | Analyze text with language/context/save choice/capabilities. |
| GET | `/api/v1/analyses/` | Paginated owner-scoped history and filters. |
| GET/DELETE | `/api/v1/analyses/{id}/` | Retrieve or delete an owned analysis. |
| POST | `/api/v1/analyses/preview/` | Analyze without persisting source text, if ephemeral mode is supported. |
| POST | `/api/v1/analyses/{id}/suggestions/` | Generate optional rewrites for selected evidence. |
| POST | `/api/v1/documents/` | Upload/extract document (next phase). |
| POST/GET | `/api/v1/batch-jobs/`, `/api/v1/batch-jobs/{id}/` | Start and inspect a batch job. |
| POST | `/api/v1/urls/preview/` | Safely fetch and preview public-page text. |
| GET/PATCH | `/api/v1/me/` | App profile/preferences keyed to verified Clerk subject. |
| GET | `/api/v1/export/` | Prepare user-owned export. |
| DELETE | `/api/v1/me/data/` | Delete app data; coordinate identity deletion separately. |
| POST | `/api/v1/feedback/` | Submit feedback with detector version. |

Require a verified Clerk token except for explicitly public health endpoints. Enforce ownership in backend querysets/services; never trust a client-supplied user ID. Paginate and cap responses.

## 10. Clerk + Django + Supabase architecture

```text
React/Vite + Clerk SDK
   │ short-lived Clerk session JWT (Authorization: Bearer)
   ▼
Django REST API
   ├─ verifies signature with Clerk JWKS; checks issuer, expiry, algorithm, configured audience
   ├─ resolves verified `sub` to local app profile
   ├─ enforces ownership, limits, validation, and business rules
   └─ server-only database connection / optional Supabase Storage client
   ▼
Supabase PostgreSQL (+ optional private object storage)
```

Clerk owns identity/authentication. Django stays the trusted API and policy boundary. Supabase provides PostgreSQL and optionally private file storage. Never expose database credentials, Clerk secret keys, webhook secrets, or Supabase service-role key in browser code.

### JWT verification

The frontend obtains a session token through Clerk’s SDK and sends it as a Bearer token. Django verifies its signature with the published JWKS using a maintained JWT library; cache keys with bounded TTL and handle rotation. Validate exact configured issuer, expiry/not-before, allowed algorithm, and audience if the token configuration defines one. Use the stable `sub` claim, not email, as identity. Document whether you use standard Clerk session tokens or a custom JWT template and test real dev/prod claims. Return 401 for invalid/missing tokens and 403 for insufficient workspace roles.

### Database access choice

**Recommended initially: Django ORM connected to Supabase PostgreSQL.** It fits existing Django models/migrations and centralizes policy in Django; the browser never queries tables. Use a least-privilege database role, TLS, appropriate pooled/direct connection, and Django migrations as schema authority.

**Supabase client from Django:** useful for Storage/Realtime or deliberate PostgREST use. A service-role key bypasses RLS and is server-only; every query still needs explicit user scoping. A user-scoped client requires intentional JWT/claim mapping and adds complexity.

**Direct browser-to-Supabase:** defer because Django already owns API and analysis logic. If later introduced, use only publishable/anon credentials, enable RLS on every exposed table, and test policies as an untrusted client. Never ship service-role credentials.

### RLS implications

Django ORM access with a privileged server connection does not automatically get RLS as a second authorization boundary; a service/admin role may bypass policies. Decide and document which layer enforces ownership. If browser or user-scoped Supabase access is enabled, RLS must be on for every exposed table, with policies based on a verified claim mapped to row ownership. Do not assume a Clerk JWT automatically fills Supabase `auth.uid()`; claim mapping must be explicitly supported and configured. Test owner and non-owner select/insert/update/delete.

### Proposed schema and indexes

Use UUID keys and explicit ownership. `profiles`: `id`, unique `clerk_user_id`, timestamps, language, retention, preferences. `analyses`: profile FK, timestamp, source kind/title/text or object reference, language/context, sentiment fields, detector version, status, saved flag. `analysis_findings`: analysis FK, category, offsets, explanation, confidence, detector version, feedback. `analysis_suggestions`: analysis/finding FKs, original/suggested text, explanation, timestamp. `user_preferences` (or profile columns): language, save default, retention. `batch_jobs` and `batch_items`: owner, status/progress, item status/error. `feedback`: owner, finding/analysis, kind, detector version. `audit_events`: minimal actor/action/target/time; never source text or tokens.

Useful indexes: unique `profiles(clerk_user_id)`; `analyses(profile_id, created_at DESC)` and `(profile_id, status)`; `analysis_findings(analysis_id, category)`; `batch_jobs(profile_id, created_at DESC)`; and all foreign keys. Add full-text search only when needed and after privacy review.

### Profile mapping and migration from Django auth

On each valid request, resolve or idempotently create a local profile from verified `sub`. Clerk webhooks can sync metadata, but verify signatures, handle retries/idempotently, and do not rely on webhook arrival for first use. Email is mutable and is not a primary key. Account deletion should disable/revoke identity and delete/anonymize app data under the retention policy; make the operation retryable and auditable.

1. Inventory current users/analyses and back up; rehearse restore.
2. Add nullable `clerk_user_id` mapping and a unique constraint for populated values; retain analysis relations.
3. Configure Clerk dev/staging/prod instances, origins, sign-in methods, redirects, token settings.
4. Implement Clerk verification while old SimpleJWT routes remain only for a bounded migration window.
5. Link accounts only with proof of control (authenticated legacy session plus Clerk sign-in or carefully designed verified-email flow). Never merge just because email strings match.
6. Associate existing analyses with verified Clerk subjects; reconcile duplicates and unmatched accounts; preserve ownership/timestamps.
7. Switch frontend to Clerk and attach session tokens; remove local credential/token handling after cutover.
8. Move database to Supabase PostgreSQL with consistent backup, migrations, row-count/ownership checks, and rollback plan. If already PostgreSQL, this is a provider/connection move.
9. Retire SimpleJWT, legacy reset-token records/routes, SMTP reset logic, and dependencies after the recovery window if Clerk owns recovery.

### Environment variables

Backend examples (names are illustrative):

```dotenv
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=false
DJANGO_ALLOWED_HOSTS=api.example.com
DJANGO_CORS_ALLOWED_ORIGINS=https://app.example.com
DATABASE_URL=postgresql://...
CLERK_ISSUER=https://your-clerk-issuer.example
CLERK_JWKS_URL=https://your-clerk-domain/.well-known/jwks.json
CLERK_EXPECTED_AUDIENCE=... # if configured for the token
CLERK_WEBHOOK_SECRET=...    # only if using webhooks
AI_PROVIDER_API_KEY=...     # optional; server only
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=... # server only; omit if unnecessary
```

Frontend may contain only public config such as `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_BASE_URL`. Vite embeds `VITE_*` values in browser bundles. Use managed secret storage, rotate credentials, and separate environments.

## 11. Privacy, security, limits

- Publish what is stored, why, where, for how long, and whether text goes to an external AI provider.
- Minimize retention; support per-record deletion, export, and account deletion; explain backup deletion timing.
- Do not use private text for training by default; research consent, if ever offered, must be explicit and separate.
- Keep source text and tokens out of logs, analytics, and error reports; minimize sensitive support access.
- Enforce HTTPS, secure headers, CORS allowlists, appropriate CSRF strategy, length/file limits, content-type validation, safe errors, and per-user/IP quotas.
- URL fetching must defend against SSRF, private/reserved IPv4/IPv6, DNS rebinding, redirects, huge responses, unsupported protocols, and abuse. Prefer isolated fetching with strict egress controls.
- Treat uploads and analyzed content as untrusted; scan where appropriate, never execute embedded content, and defend AI prompts from instructions inside documents.
- Use private object storage, random names, short-lived signed links, size limits, and lifecycle deletion.
- Keep dependencies current and restrict admin access; require MFA where available.

## 12. Testing and evaluation checklist

**Behavior:** separate sentiment/bias; test empty, whitespace, length boundaries, Unicode, emoji, multiline, offsets, quotations, negation, satire, reclaimed and technical terms. Confirm suggestions preserve facts/names/numbers and undo works. Extraction must report scans/unsupported formats honestly.

**Auth/isolation:** reject missing, malformed, expired, wrong-issuer/audience/algorithm tokens; handle rotated JWKS keys; ensure one profile per Clerk subject and mutable email does not duplicate identity. Test every endpoint as owner and non-owner. Test account linking collisions, webhook signatures/retries, complete export/deletion including storage.

**Operations/AI:** exercise limits, timeouts, provider failure, retry, cancellation; SSRF tests for local/private IPs and redirect/DNS changes; prompt injection; logs free of tokens/source text; backup restore and migration reconciliation.

**Quality:** maintain a versioned, consented, human-reviewed dataset across categories, genres, dialects, and languages. Track category precision/recall, false positives, calibration, abstention, reviewer disagreement, and relevant language-variety differences. Keep detector version on results. Aggregate accuracy alone does not establish fairness or suitability for consequential use.

## 13. Monitoring and success measures

- **Reliability:** availability, latency by input size, timeout/error rates, queue age, database saturation, storage failures.
- **Usefulness:** flags opened, suggestions accepted/edited/dismissed, reported usefulness, repeat use, task completion. Do not optimize merely for more flags or engagement.
- **Quality/safety:** false-positive/missed-issue reports, category metrics, abstention, language coverage, privacy incidents, deletion completion, cross-account access findings.

Use privacy-preserving aggregate measures and set alert thresholds after baseline traffic; do not collect raw text in analytics.

## 14. Implementation sequence

**Phase 0 — validate:** inspect source and current flows; confirm database, auth, deployment, CORS, and NLP; define terminology and limitations; build baseline examples and evaluation plan.

**Phase 1 — identity/data:** set up Clerk environments; verify JWTs in Django; map profiles; test ownership; migrate users via explicit linking; move Django database to Supabase with backup, reconciliation, and rollback.

**Phase 2 — single-text MVP:** version analysis response; implement separate sentiment and explainable findings, uncertainty and feedback; add optional human-approved rewrites, history controls, and retention.

**Phase 3 — regular use:** add tone/readability, accessibility, document upload/extraction preview, batch processing, then URL input only after SSRF controls. Add dashboard and report export.

**Phase 4 — teams/languages:** pilot roles, collaboration, style guides, and admin controls; add languages one by one with local evaluation; consider integrations and paid limits after real demand.

Ship behind feature flags where useful, gather limited opt-in feedback, review quality/privacy outcomes, and roll back if harm or error indicators worsen.

## 15. Decisions before implementation

1. Choose the primary MVP audience: individual writers/students, editors, or organizations.
2. Decide whether analyses are saved by default, only on request, or only with opt-in.
3. Choose the first language and document context that can be evaluated responsibly.
4. Decide whether first bias signals use heuristics, a model API, or a hybrid, and what evidence is shown.
5. Define which legacy data must be preserved and the account-linking/recovery path.
6. Select deployment region, retention, and external AI provider policy based on privacy needs.

## Plain-language product description

**Unbiasify helps people review the wording in a draft. It shows sentiment and possible language patterns separately, highlights the words behind a suggestion, and offers optional edits. Its results are prompts for human review, not a final judgment about a person or document.**
