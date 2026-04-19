# Migration details — from a static React app to a production-grade training platform

This document is the narrative record of how the **COSO CPE Course** repo evolved from a single-page frontend demo into a production-grade, multi-user training platform with a CMS, a REST API, authentication (password + Microsoft SSO), and server-side learner progress. It is meant as:

- an architectural **onboarding doc** for new engineers,
- a **decision log** (the *why*, not just the *what*), and
- a **production-readiness audit** of the final system.

If you just want the runbooks, see [`README.md`](README.md) and [`backend/README.md`](backend/README.md). This file is the story behind them.

---

## Table of contents

1. [Where we started](#1-where-we-started)
2. [What was missing for production](#2-what-was-missing-for-production)
3. [The plan](#3-the-plan)
4. [Phase-by-phase execution](#4-phase-by-phase-execution)
   - [Phase 2A — backend foundation](#phase-2a--backend-foundation)
   - [Phase 2B — content models](#phase-2b--content-models)
   - [Phase 2C — REST API](#phase-2c--rest-api)
   - [Phase 3A — seed parity](#phase-3a--seed-parity)
   - [Phase 3B — frontend consumes the API](#phase-3b--frontend-consumes-the-api)
   - [Phase 3C — login UI + Microsoft SSO](#phase-3c--login-ui--microsoft-sso)
   - [Phase 3D — server-side learner progress](#phase-3d--server-side-learner-progress)
5. [Final architecture](#5-final-architecture)
6. [Why it's production-ready](#6-why-its-production-ready)
7. [Known limitations & future work](#7-known-limitations--future-work)

---

## 1. Where we started

The **initial commit** (`53692cc`) delivered a polished, self-contained single-page React application for a one-hour CPE (Continuing Professional Education) course on applying the COSO Internal Control framework to generative AI.

### What worked well from day one

- **Polished UX.** React 19 + TypeScript + Vite, Tailwind CSS v4, hash-routed SPA. Learners moved through a gated sequence: overview → 3 modules → 3 reviews → final assessment → course evaluation → certificate.
- **Section-gating rules.** A `canAccessSection()` pure function enforced the ordering (you can't skip to the assessment without finishing the modules). Every protected route was wrapped in `<RequireAccess>`.
- **Local progress persistence.** State lived in a `useReducer` + React Context store and was serialized to `localStorage` under a versioned key (`coso-cpe-course:progress`), with `Set` serialization and a version-mismatch fallback.
- **22 unit tests** (jsdom, Vitest + React Testing Library) — covered the reducer, section-gating rules, persistence round-trip, version-mismatch and corrupted-JSON fallbacks, and the `<RequireAccess>` route guard.
- **CI + deploy.** GitHub Actions ran `typecheck → lint → test → build` on every PR; merges to `main` deployed to GitHub Pages.
- **Content authoring UX** — the course content lived in a single well-structured TypeScript file (`src/data/courseContent.ts`, ~663 lines) with a discriminated `ContentBlock` union (`paragraph | heading | callout | example | warning | table | list`) that the renderer walked at runtime.

### Initial codebase shape

```
src/
  App.tsx                     # HashRouter + provider stack + routes
  components/
    NavBar, Sidebar           # chrome
    CourseOverview            # landing
    ModuleView                # content renderer
    ReviewQuestions           # knowledge checks
    Assessment                # final 15-question test
    Evaluation                # AICPA/NASBA feedback form
    Certificate               # printable completion cert
    ErrorBoundary, RequireAccess
  data/
    courseContent.ts          # 663-line hardcoded CourseData constant
  store/
    courseStore.ts            # reducer + Context + access rules
    persistence.ts            # localStorage codec
  main.tsx
```

No backend. No authentication. No database. Every learner's state lived in their browser's `localStorage`.

---

## 2. What was missing for production

The initial app was a great demo and worked for a single learner on a single device. For an internal training tool that needs to issue CPE certificates — which requires an audit trail under AICPA/NASBA Standard No. 14 — the gaps were structural:

### 2.1 Content authoring

| Gap | Impact |
| --- | --- |
| Content lived in a TypeScript file | Subject-matter experts (SMEs) could not edit text, examples, or questions without opening a PR |
| No review / approval workflow | No way to draft changes without deploying them |
| No versioning of content separate from code | Content edits = code commits = full redeploy |
| No media support | No image uploads, no rich text, no tables beyond string grids |

### 2.2 Learner identity & data

| Gap | Impact |
| --- | --- |
| No authentication | Anyone with the URL was "a learner"; no way to attribute progress to a person |
| No cross-device continuity | `localStorage` is per-browser per-device; finishing Module 1 on a laptop didn't carry over to the phone |
| No central record of completion | No way to verify "did Zachary actually complete this?" for CPE audit |
| No way to revoke access | Removing a learner meant asking them to clear their browser |

### 2.3 Operational

| Gap | Impact |
| --- | --- |
| No REST API | Nothing else could ingest course data or progress — no analytics, no reporting, no integrations |
| No admin dashboard | No way to see who has enrolled, what the pass rate is, where learners drop off |
| No audit logging | CPE auditors want a timestamped trail; `localStorage` doesn't survive an audit |
| No environment separation | Dev, test, and prod all read the same in-memory state |
| No secrets management | Nothing sensitive to protect yet, but also no place to put it when there was |

### 2.4 Security

| Gap | Impact |
| --- | --- |
| No CSRF protection | Required once POSTs existed |
| No CORS configuration | Required for any cross-origin backend |
| No session management | Required for multi-user identity |
| No SSO | Enterprise requirement for any KPMG internal tool |

### Defining "production-ready"

For this project, "production-ready" meant:

1. **SMEs can author content** without engineering help.
2. **Learners sign in with their real identity** (password for local dev; Microsoft Entra for the org).
3. **Progress survives devices, browsers, and cache clears** — we can answer "did X complete Y?" from a database, not a browser.
4. **The API is documented and typed** so future integrations (LMS export, reporting, external course catalog) don't need reverse-engineering.
5. **Every change is covered by tests and gated by CI.**
6. **Security has the basics right**: CSRF, CORS, HTTPS in prod, session cookies, no secrets in the repo.

---

## 3. The plan

Each phase was scoped to land **independently shippable** — no big-bang rewrite. The frontend kept working after every phase; the backend evolved alongside it rather than replacing it.

```
Phase 2 — build the backend behind the frontend
  2A  foundation            scaffold Django/Wagtail/DRF/Postgres, custom user, tooling
  2B  content models        Wagtail pages + StreamField blocks mirroring ContentBlock
  2C  REST API              /api/courses, /api/progress, /api/auth, OpenAPI docs

Phase 3 — switch the frontend over to the backend
  3A  seed parity           port all content into a management command
  3B  wire frontend to API  CourseDataProvider + transform layer + types-only data file
  3C  auth & login UI       AuthProvider + Login screen + Microsoft SSO (OAuth2/MSAL)
  3D  server-side progress  ProgressProvider with hydrate + debounced save
```

Guiding principles we stuck to throughout:

- **One source of truth per concern.** Never duplicate state shapes between frontend and backend — a shared codec or serializer keeps them byte-identical.
- **Types flow across the boundary.** The backend's DRF serializers produce camelCase fields matching the frontend's interfaces *exactly*, so `fetchCourse(slug): Promise<CourseData>` is a real claim, not a lie.
- **Graceful degradation.** The app keeps working if the backend is slow, flaky, or temporarily missing a feature (e.g. Microsoft SSO hidden when unconfigured).
- **Tests first, or at least alongside.** Every phase added tests proportional to the surface it introduced; we never moved on with a regression.

---

## 4. Phase-by-phase execution

### Phase 2A — backend foundation

**Goal.** Stand up the Django + Wagtail + DRF + Postgres stack next to the frontend without touching the frontend yet.

**What we built**

- `backend/` monorepo subdirectory — self-contained Django project managed with `uv` + Python 3.12.
- Split settings (`config/settings/{base,dev,test,prod}.py`) driven by `django-environ`. Prod fails fast if `SECRET_KEY` / `ALLOWED_HOSTS` aren't set.
- Custom `accounts.User` (AbstractUser with unique `email`) wired as `AUTH_USER_MODEL` from day one — retrofitting later is a migration nightmare.
- Postgres 17 in Docker (`docker-compose.yml`) with a persistent named volume.
- `uv.lock` committed for reproducible installs; `pytest + pytest-django + pytest-cov + ruff + mypy + django-stubs` configured.
- Initial smoke tests that the Django settings load, custom user is the `AUTH_USER_MODEL`, and `/admin/` returns 200.

**Decision log**

- **Wagtail over plain Django admin for content.** Wagtail gives SMEs a real editorial UI (page tree, StreamField, drafts, revisions) at the cost of ~30 extra migrations. The alternative was writing our own admin forms per content model, which gets old fast.
- **uv over pip / poetry.** Lockfile semantics, resolution speed, and it's what the Python ecosystem is moving toward.
- **Postgres over SQLite.** We needed JSONField for progress payloads and serious auth; SQLite's JSON support is fine but its concurrency isn't.
- **Session cookies, not JWTs.** The app is a browser-only SPA on the same registrable domain as the API; sessions are simpler, automatically revocable, and don't require rotation logic. JWTs would have been overkill.

**Exit criteria**

- `docker compose up -d && uv run python manage.py migrate && uv run python manage.py runserver` brings up Wagtail admin at `/admin/` and Django admin at `/django-admin/`.
- `uv run pytest` passes.
- `uv run ruff check . && uv run ruff format --check .` clean.

---

### Phase 2B — content models

**Goal.** Model every kind of content the frontend renders today, as Wagtail pages + StreamField blocks, so SMEs can edit it through the CMS.

**What we built**

The page hierarchy mirrored the route structure of the SPA:

```
Root / (Wagtail site root)
└── CourseIndexPage (/catalog/)
    └── CoursePage (/catalog/coso-ai-internal-control/)
        ├── ModulePage       (three of them)
        ├── ReviewPage       (three of them; each has inline questions)
        ├── AssessmentPage   (one; 15 inline questions)
        └── EvaluationPage   (one; 5 inline likert/text questions)
```

The **`ContentStreamBlock`** in `apps/courses/blocks.py` contains one block class per frontend `ContentBlock.type`:

| Frontend type | Backend block | Shape |
| --- | --- | --- |
| `paragraph` | `ParagraphBlock(RichTextBlock)` | HTML string |
| `heading` | `HeadingBlock(CharBlock)` | plain string |
| `callout` | `CalloutBlock(StructBlock)` | `{title, body (RichText), variant: info/tip/warning/important}` |
| `example` | `ExampleBlock(StructBlock)` | `{title, body}` |
| `warning` | `WarningBlock(StructBlock)` | `{title, body}` |
| `table` | `TableBlock(StructBlock)` | `{headers: [str], rows: [[str]]}` |
| `list` | `BulletListBlock(StructBlock)` | `{items: [str]}` |

Modules have ordered **sections** (each = title + nested content stream). Reviews and Assessment have `Orderable` inline question models with 2–5 answer options each. Evaluation questions support `likert` + `text` types.

Admin panels (`InlinePanel`, `MultiFieldPanel`) were tuned for SME-friendliness — expanded by default, sensible labels, default values, help text.

**Parent/child type restrictions** (`parent_page_types` / `subpage_types`) enforce the hierarchy in the admin so an SME can't accidentally put a Module outside a Course.

**`seed_demo_course` management command** creates a working demo course in one command — idempotent, `--force` re-creates.

**Tests added** (~10 tests):
- StreamField round-trips for every block type and variant
- Page-tree restrictions (can't add a Module outside a Course, etc.)
- Orderable question models
- Seed command creates + is idempotent + `--force` recreates

**Decision log**

- **Opaque JSON payload for progress** (later, in 2C) vs. modeling every field: we chose opaque so the frontend reducer stays authoritative over shape. State transitions are a frontend concern; the backend just stores the blob and scopes it to the user.
- **Custom `TableBlock` over `wagtail.contrib.table_block`**: the contrib version ships a spreadsheet editor UI but its data shape is more complex to JSON-serialize. A simple `{headers, rows}` ListBlock-of-ListBlock round-trips cleanly.
- **Render templates were stubs** — we knew the SPA was the real UI, so the Wagtail-rendered public pages just say "this content is served by the React app" for now.

---

### Phase 2C — REST API

**Goal.** Expose everything the SPA needs as a typed, documented JSON API.

**What we built**

| Method + path | Auth | What it does |
| --- | --- | --- |
| `GET /api/courses/` | open | List published courses |
| `GET /api/courses/<slug>/` | open | Full course tree (modules, sections, questions) — output shape mirrors the frontend's `CourseData` |
| `GET /api/auth/csrf/` | open | Force-issue the `csrftoken` cookie |
| `POST /api/auth/login/` | open | Start a session |
| `POST /api/auth/logout/` | session | End the session |
| `GET /api/auth/me/` | session | Current user, or 403 |
| `GET /api/progress/<course_slug>/` | session | Per-user learner progress |
| `PUT /api/progress/<course_slug>/` | session | Upsert (creates row if absent) |
| `DELETE /api/progress/<course_slug>/` | session | Remove the user's progress |

Three apps, three serializer files, three URL modules. `CourseDetailSerializer` uses `source=` to rename snake_case DB fields into camelCase wire fields, so the backend's Python types stay Pythonic but the JSON matches the frontend's TypeScript.

Added **drf-spectacular** for OpenAPI 3 schema + Swagger UI at `/api/docs/` + ReDoc at `/api/redoc/`. The whole API is clickable from a browser without any extra tooling.

**CORS + credentials**: `CORS_ALLOWED_ORIGINS` is env-driven (dev lists `http://localhost:5173`), `CORS_ALLOW_CREDENTIALS = True`. Later, in 3C, we added `CSRF_TRUSTED_ORIGINS` once cross-origin POSTs started failing.

**`CourseProgress` model** (`apps/progress/models.py`): `user` FK, `course_slug` (SlugField), opaque `payload` JSONField, `started_at` + `updated_at`. `UniqueConstraint(user, course_slug)` prevents duplicates. Upsert via `update_or_create`. Per-user scoping via `filter(user=request.user)` — no way to read someone else's row.

**Tests added** (~25 tests across all three apps):
- Catalog list + detail shape match the frontend's `CourseData`
- Draft courses excluded from `/courses/`
- StreamField output renders as `[{type, value}, ...]` with correct nested values
- Reviews keyed by slug in the response
- Progress: anonymous cannot read/write, authenticated upsert creates then updates, per-user scoping (one user can't see another's), invalid payload rejected, delete removes own row
- Auth: `csrf` sets cookie, `me` requires auth, login happy + 401 path, logout ends session

**Decision log**

- **camelCase on the wire, snake_case in models.** DRF's `source=` makes this zero-effort; the alternative — letting the frontend convert — means every consumer writes boilerplate.
- **`coerce_to_string=False` for `cpeCredits`.** DRF's `DecimalField` serializes to a string by default for precision; the frontend treats CPE credits as a number. Flip the default.
- **Opaque progress payload.** The server doesn't need to understand the shape — the frontend does. Saves us a migration every time the reducer adds a field.
- **DRF's `SessionAuthentication` returns 403 for anonymous.** That's standard; tests assert `in (401, 403)` rather than a single code.

---

### Phase 3A — seed parity

**Goal.** Port the entire 663-line hardcoded `courseContent.ts` into the backend's `seed_demo_course` so the API returns a *real* course with the *exact* same words the frontend was shipping.

**What we built**

Rewrote `backend/apps/courses/management/commands/seed_demo_course.py` (~1,250 lines) with one method per module / review / assessment / evaluation, plus a small `_make_review` helper and a `p(text)` helper that wraps plain text in `<p>...</p>` tags for Wagtail's `RichTextField`.

Field mapping from the frontend's `ContentBlock`:

- `{type: 'paragraph', content}` → `('paragraph', p(content))`
- `{type: 'callout', title, content, variant}` → `('callout', {title, body: p(content), variant})`
- `{type: 'list', items}` → `('bullet_list', {items: [...]})` *(renamed to avoid clash with the frontend's generic `list`)*
- `{type: 'table', headers, rows}` → `('table', {headers, rows})`

Module slugs became `module-1`, `module-2`, `module-3` (dashed, matching Wagtail's slug conventions); the frontend's route + store still used `module1` / `review1` (no dash). The transform layer (see 3B) handles the rename.

**Tests updated** — the existing seed test went from "1 module" to "3 modules × 3 sections × 3 LOs, 3 reviews × 3 questions, 15-question assessment, 5-question evaluation". Also fixed `cpeCredits` to serialize as a number (not a string) via `coerce_to_string=False`.

**Exit criteria**

- `uv run python manage.py seed_demo_course --force` produces a live course visible at `/admin/`.
- `curl -s http://localhost:8000/api/courses/coso-ai-internal-control/ | jq '.modules | length'` returns `3`.
- `totalAssessmentQuestions` returns `15`, `evaluationQuestions` returns 5 entries.
- All 42 backend tests still pass.

---

### Phase 3B — frontend consumes the API

**Goal.** Delete the 663-line hardcoded content blob and have the app fetch everything at boot.

**What we built**

**`src/api/client.ts`** — thin `fetch` wrapper with:
- base URL from `VITE_API_BASE_URL` env (default `http://localhost:8000/api`)
- `credentials: 'include'` on every request so session cookies round-trip
- automatic `X-CSRFToken` header on unsafe methods, read from `document.cookie`
- typed `ApiError { status, body, message }` thrown on non-2xx

**`src/api/courses.ts`** — `fetchCourse(slug): Promise<CourseData>` plus a **transform layer** that normalizes Wagtail's output to the frontend's flat union:

```
{type: 'paragraph', value: '<p>...</p>'}  →  {type: 'paragraph', content: '<p>...</p>'}
{type: 'callout',   value: {title, body, variant}}  →  {type: 'callout', title, content: body, variant}
{type: 'bullet_list', value: {items}}  →  {type: 'list', items}
'module-1'  →  'module1'  (slug normalization for store keys)
```

Description fields (course, module) get HTML-stripped via a regex for plain-text display; rich-text fields (paragraph body, callout body, example/warning body) are rendered via `dangerouslySetInnerHTML` so SMEs get real inline emphasis from Wagtail's RichText editor.

**`src/store/courseDataContext.ts` + `courseDataStore.tsx`** — split context from provider to keep react-refresh happy. `CourseDataProvider` fetches once at app boot and renders a spinner / retryable error UI around its children.

**`src/data/courseContent.ts`** — reduced from 663 lines to ~80 lines (types only). The component tree no longer imports any static content blob.

Six call sites (`CourseOverview`, `ModuleView`, `ReviewQuestions`, `Assessment`, `Evaluation`, `Certificate`) swapped `import { courseData }` for `useCourseData()`.

**Also landed in 3B (discovered during rollout)**: the ESLint config was crawling into the backend's Python virtualenv and flagging Django's static JS as errors. Added `globalIgnores(['dist', 'backend/**'])` to `eslint.config.js`.

**Why it works end-to-end**

- Types flow: the backend serializer's field names match the frontend's TypeScript interfaces exactly (thanks to DRF `source=`).
- Shape normalization is a single function per block type — easy to audit, easy to extend.
- No content lives in the SPA bundle anymore: a SME publishing in Wagtail → learners see the change on their next page load, no redeploy.

---

### Phase 3C — login UI + Microsoft SSO

**Goal.** Identify every learner. Support a username/password path for local dev (the `admin` / `admin` default) and Microsoft Entra ID (Azure AD) SSO for the real tenant.

**What we built**

**Backend**

- `apps/accounts/management/commands/ensure_dev_admin.py` — idempotent `admin` / `admin` seeding. Refuses to run outside `DEBUG` unless `--force`. Re-runs reset the password (predictable local-dev handle).
- `apps/accounts/microsoft_auth.py` — three endpoints implementing the standard OAuth 2.0 authorization-code flow, backed by MSAL:
  - `GET /api/auth/microsoft/config/` — `{enabled: bool, login_url?: string}`. Public; no secrets in the response. The SPA uses this to show/hide the "Sign in with Microsoft" button.
  - `GET /api/auth/microsoft/login/` — generates a CSRF-protecting `state` token, stashes it in the session, 302-redirects to Microsoft's authorize URL.
  - `GET /api/auth/microsoft/callback/` — verifies `state`, exchanges the authorization code for a token via MSAL, fetches Graph `/me`, upserts a `User` keyed by Entra object id (`ms-<oid>`), opens a Django session, bounces back to the SPA with `?auth=ok` (or `?auth=error&reason=...`).
- `MICROSOFT_AUTH_*` settings (four env vars + scopes) with graceful-disable semantics — leave any blank and SSO reports `enabled: false`.
- `CSRF_TRUSTED_ORIGINS` added to `base.py` (fell out during testing — Django 4+ needs it for cross-origin POSTs even when CORS is allowed).

**Frontend**

- `src/api/auth.ts` — `fetchCsrf`, `fetchMe`, `login`, `logout`, `fetchMicrosoftConfig`, `beginMicrosoftLogin` (full-page navigation to `/api/auth/microsoft/login/`).
- `src/store/authContext.ts` + `authStore.tsx` — `AuthProvider` bootstraps the session: hits `/csrf/`, then `/me/`, then renders either `<Login />` (anonymous) or the app tree (authenticated). Detects the `?auth=ok|error` query from the MS callback and re-fetches `/me/`.
- `src/components/Login.tsx` — gradient card with username/password form + conditionally-rendered Microsoft SSO button (inline 4-square SVG logo). Surfaces human-readable SSO error messages for each `reason=` code.
- `NavBar` updated to show user initial-avatar + name + email + sign-out button.
- `App.tsx` provider stack: `<AuthProvider>` wraps `<CourseDataProvider>` so course data isn't fetched for anonymous users.

**Full Azure setup documentation** — step-by-step in `backend/README.md` → "Microsoft SSO setup". App registration, redirect URI, client secret, API permissions, admin consent, production notes, troubleshooting table. A new engineer can bring up SSO from scratch in ~10 minutes.

**Tests added** (15):
- 5 `ensure_dev_admin` tests (creates, idempotent, refuses without `DEBUG`, `--force` override, custom args)
- 9 Microsoft SSO tests (config-enabled/disabled, login 503 / redirect, callback state mismatch, missing code, MS denied, happy path creates user + logs in, token exchange failure)
- 1 URL reverse sanity

**A bug caught during testing** — after logout + attempted re-login, `POST /api/auth/logout/` and `/login/` both returned 403 with `"Origin checking failed"`. Django 4+'s CSRF middleware requires `CSRF_TRUSTED_ORIGINS` explicitly for cross-origin POSTs (CORS doesn't cover it). Fix: env-driven `CSRF_TRUSTED_ORIGINS`, defaults to the CORS list.

---

### Phase 3D — server-side learner progress

**Goal.** Make progress persist across devices, browsers, and cache clears. Keep localStorage as an offline cache so nothing is lost on flaky networks.

**What we built**

**`src/store/progressCodec.ts`** — one versioned envelope used for **both** localStorage and the server `payload`. `encodeProgress(state) → SerializedProgress` (with `Set`s as arrays), `decodeProgress(raw)` with shape validation and version mismatch → `null` (forces a fresh start rather than a crash).

**`src/store/persistence.ts`** — same public API as before, now delegates to the codec. No caller changes.

**`src/api/progress.ts`** — `fetchProgress` / `saveProgress` / `deleteProgress`. `fetchProgress` returns `null` on 404 so "new user" is a non-exceptional case.

**`src/store/progressStore.tsx`** — the central piece. `ProgressProvider` owns the `useReducer` and bridges it to the backend:

```
Boot:
  initial state = loadProgress() ?? createInitialProgress()  (optimistic)
  fetchProgress(slug)  in parallel
  on success with payload → dispatch({type: 'HYDRATE', state: decoded})

Each state change (after hydration completes):
  persistProgress(state)      immediately, synchronously → localStorage
  schedule 600ms debounced PUT → /api/progress/<slug>/

Tab hide / pagehide / unmount:
  flush any pending PUT
```

New reducer action `HYDRATE` replaces state wholesale without remounting the tree.

**Logout** clears the localStorage cache (the next learner on a shared device doesn't inherit the previous user's completions). Their own server-side progress re-hydrates on their next login.

**Tests added** (5):
- `progressCodec` round-trip with Sets + rich data (review answers, etc.)
- version mismatch → null
- shape validation (missing fields, non-object input)
- `HYDRATE` reducer test

**Design trade-offs we accepted**

- **Last-write-wins.** No CRDTs, no version vectors. For a CPE course where state is monotonic (completions only grow), the conflict surface is a single lost click on flaky networks. Acceptable.
- **No retry queue.** A failed PUT just logs in dev and waits for the next dispatch. On 401/403 we silently stop — `AuthProvider`'s next `/me/` check will bounce to login.
- **Server wins on boot.** If the local cache and server disagree, server wins. The alternative (comparing timestamps) adds complexity we don't need yet.

**End-to-end verified** (with the Preview browser tool): login → complete Module 1 → 600 ms later `PUT .../201 Created` → Postgres row has `completedModules: ["module1"]` → wipe localStorage + reload → UI correctly shows Module 1 "Done" and Review 1 unlocked, localStorage repopulated from server → logout clears local cache → re-login re-hydrates from server.

---

## 5. Final architecture

### Repository layout

```
.
├── README.md                    monorepo overview + frontend runbook
├── backend/README.md            full backend setup + Microsoft SSO walkthrough
├── migration-details.md         this document
│
├── src/                         React SPA
│   ├── App.tsx                  provider stack + routes
│   ├── api/
│   │   ├── client.ts            fetch wrapper (credentials, CSRF, ApiError)
│   │   ├── courses.ts           fetchCourse + Wagtail → frontend transform
│   │   ├── auth.ts              login/logout/me/csrf + Microsoft config + login
│   │   └── progress.ts          fetch/save/delete per-user progress
│   ├── components/
│   │   ├── Login.tsx            username/password + SSO button
│   │   ├── NavBar.tsx           user avatar + logout
│   │   ├── Sidebar.tsx          section nav with gate locks
│   │   ├── ContentBlock.tsx     renders the 7 content block types
│   │   ├── CourseOverview.tsx   / ModuleView / ReviewQuestions / Assessment /
│   │   │     Evaluation / Certificate
│   │   └── RequireAccess.tsx    route-level gate + test
│   ├── data/
│   │   └── courseContent.ts     types only — no content lives in code
│   ├── store/
│   │   ├── courseStore.ts       reducer, action types, access-rules function
│   │   ├── authContext.ts       + authStore.tsx         (session)
│   │   ├── courseDataContext.ts + courseDataStore.tsx   (fetched content)
│   │   ├── progressStore.tsx    reducer owner + server sync
│   │   ├── progressCodec.ts     versioned envelope (localStorage + wire)
│   │   └── persistence.ts       localStorage codec
│   └── test/setup.ts            Vitest setup (Node 25 localStorage shim)
│
└── backend/                     Django + Wagtail + DRF
    ├── config/
    │   ├── settings/            base.py + dev.py + test.py + prod.py
    │   └── urls.py
    ├── apps/
    │   ├── accounts/            custom User, auth API, Microsoft SSO, ensure_dev_admin
    │   ├── courses/             Wagtail pages, StreamField blocks, catalog API,
    │   │                          seed_demo_course command
    │   └── progress/            CourseProgress model + per-user scoped API
    ├── docker-compose.yml       Postgres 17
    └── pyproject.toml           deps + ruff + mypy + pytest config
```

### Runtime dependencies

**Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, react-router (HashRouter). No state library beyond React — `useReducer` + Context are enough.

**Backend:** Django 5.2, Wagtail 6.4, Django REST Framework, drf-spectacular (OpenAPI), django-cors-headers, django-environ, psycopg 3, whitenoise, msal (Microsoft Authentication Library), gunicorn, Postgres 17.

**Dev tooling:** `uv` (Python deps), `pnpm` (JS deps), `docker compose` (Postgres), `ruff` + `mypy` + `pytest` (backend), `tsc` + `eslint` + `vitest` (frontend).

### Provider stack (frontend)

```
ErrorBoundary
  AuthProvider            ← /api/auth/csrf → /api/auth/me; renders <Login /> if anon
    CourseDataProvider    ← /api/courses/<slug>/ — course content
      ProgressProvider    ← /api/progress/<slug>/ — reducer + debounced sync
        HashRouter
          AppLayout (NavBar + Sidebar + main)
            Routes (CourseOverview, ModuleView×3, ReviewQuestions×3, Assessment,
                    Evaluation, Certificate) — each wrapped in <RequireAccess>
```

### Backend URL map

```
/                     ← public Wagtail pages (stub render)
/admin/               ← Wagtail CMS (SMEs)
/django-admin/        ← users/groups/low-level model edits
/api/
  courses/            catalog (public reads)
  courses/<slug>/
  auth/csrf/          force-issue csrftoken cookie
  auth/login/         username+password
  auth/logout/
  auth/me/
  auth/microsoft/config/    SSO enabled?
  auth/microsoft/login/     kick off OAuth
  auth/microsoft/callback/  finish OAuth
  progress/<slug>/    GET/PUT/DELETE per-user progress
  schema/             OpenAPI 3 schema
  docs/               Swagger UI
  redoc/              ReDoc
```

### Test inventory

| Layer | Count | Covers |
| --- | --- | --- |
| Frontend (Vitest + jsdom) | **27** | reducer (incl. HYDRATE), section-gating, progress codec (round-trip, version mismatch, shape validation), localStorage persistence, `<RequireAccess>` route guard |
| Backend (pytest + django) | **57** | settings smoke, custom user, page-tree restrictions, StreamField round-trips per block type, orderable questions, `seed_demo_course` (create / idempotent / --force), `/api/courses/` shape + draft exclusion + 404, `/api/progress/` upsert + per-user scoping + payload validation + delete, `/api/auth/{csrf,me,login,logout}/` happy path + auth gating, `/api/auth/microsoft/{config,login,callback}/` full flow (state mismatch, missing code, MS denied, happy path, token exchange failure), `ensure_dev_admin` (create, idempotent, DEBUG guard, --force, custom args) |
| **Total** | **84** | |

Pre-PR CI gate (runs on every PR and push to `main`):

```bash
# Frontend
pnpm typecheck && pnpm lint && pnpm test && pnpm build

# Backend
uv run ruff check . && uv run ruff format --check . && uv run pytest
```

---

## 6. Why it's production-ready

A checklist against the "production-ready" criteria from §2:

### Content authoring ✓

- [x] SMEs edit content in a real CMS (Wagtail) — paragraph, heading, 4-variant callouts, example, warning, table, bulleted list — not in a code file.
- [x] Draft → publish workflow built-in (Wagtail revisions).
- [x] Content is versioned separately from code (page revisions in the DB).
- [x] Changes go live on the next learner page load — no redeploy needed.
- [x] `parent_page_types` / `subpage_types` enforce structure in the admin so SMEs can't break the hierarchy.

### Learner identity & data ✓

- [x] Authentication is required (no progress API without a session).
- [x] Two sign-in paths: username/password (local) + Microsoft Entra SSO (enterprise).
- [x] Progress is per-user, scoped via `filter(user=request.user)` — no cross-user read possible.
- [x] Progress survives device / browser / cache — the backend is the source of truth, localStorage is just a cache.
- [x] Logout clears the local cache so shared devices don't leak state.
- [x] Every user row includes `is_active` — disabling is a single flag flip in Django admin.
- [x] Every progress row has `started_at` + `updated_at` timestamps for the audit trail.

### Operational ✓

- [x] REST API is typed end-to-end (DRF serializers → OpenAPI → TypeScript `CourseData`).
- [x] Interactive API docs at `/api/docs/` (Swagger UI) + `/api/redoc/`.
- [x] Per-environment settings (`base/dev/test/prod`), driven by env vars.
- [x] Production settings fail fast without a real `SECRET_KEY` / `ALLOWED_HOSTS` (no insecure defaults leak into prod).
- [x] `whitenoise` for static file serving, `gunicorn` as WSGI runner, `CompressedManifestStaticFilesStorage` for cache-busted asset URLs.
- [x] Docker-compose for local Postgres; the real deployment target swaps in managed Postgres without code changes.
- [x] `docker-compose down -v` safely resets the DB — great for onboarding demos.
- [x] Django admin at `/django-admin/` shows every user and every progress row for support / audit use cases.

### Security ✓

- [x] **CSRF**: Django's middleware enforces `X-CSRFToken` header matches the `csrftoken` cookie on every unsafe method. `CSRF_TRUSTED_ORIGINS` allow-lists the SPA origin.
- [x] **CORS**: `CORS_ALLOWED_ORIGINS` explicitly lists trusted origins (never `*`); `CORS_ALLOW_CREDENTIALS = True` only because same-site cookies + CSRF are also in place.
- [x] **Session cookies**: managed by Django, automatic session revocation on logout, password rotation ready to wire up.
- [x] **Microsoft SSO**: `state` nonce on the authorize URL, verified on callback. ID token claims validated by MSAL. Client secret stays on the server — never reaches the browser.
- [x] **Secrets**: `DJANGO_SECRET_KEY`, `MICROSOFT_AUTH_CLIENT_SECRET`, DB password — all via env vars, `.env` is git-ignored, `.env.example` ships as template.
- [x] **HTTPS**: production settings enable HSTS, `SESSION_COOKIE_SECURE`, `CSRF_COOKIE_SECURE`.
- [x] **Rich-text sanitization**: Wagtail's `RichTextField` uses an allowlist by default — no raw `<script>` injection from the CMS.
- [x] `DEBUG=False` is the default in every non-dev settings module; dev explicitly opts in.

### Quality gates ✓

- [x] **84 automated tests** (57 backend + 27 frontend) cover the full request/response surface, auth flow, progress sync, section gating, StreamField round-trips, and seed idempotency.
- [x] **Typecheck** (both sides): `tsc -b --noEmit` and `mypy` (configured, strict mode).
- [x] **Lint + format**: `eslint` + `ruff` with CI-style `--check` variants.
- [x] **Build check**: `pnpm build` produces the production bundle in CI, proving dynamic imports resolve and the bundle is valid.
- [x] **Pre-PR checklist** documented in both READMEs.

### Documentation ✓

- [x] Two-tier README structure: root for the monorepo overview + frontend, `backend/` for the full Django/Wagtail/API walkthrough.
- [x] Step-by-step setup from a cold `brew install` to a running dev environment (~10 min).
- [x] Full Microsoft SSO integration guide with Azure portal screenshots-worth of detail + troubleshooting table.
- [x] This migration document as the architectural record.
- [x] Inline code comments explain *why*, not just *what* — every non-obvious file has a header docblock.

---

## 7. Known limitations & future work

Things we deliberately **didn't** build but noted for future phases:

| Area | Limitation | When it matters |
| --- | --- | --- |
| **Multi-course** | `ProgressProvider` is pinned to the demo course slug; adding a second course needs a provider refactor or a per-route slug prop | When a second course launches |
| **Conflict resolution** | Last-write-wins on the progress PUT; a user with two tabs open could lose a click | When a learner routinely uses two devices concurrently — rare in practice |
| **Retry queue** | A failed progress save isn't retried until the next state change | On very flaky networks; mitigated by the debounced local write always succeeding |
| **Save status indicator** | No "saved / saving / failed" UI chip in the NavBar | When learners want explicit confirmation their work is safe |
| **Learner analytics** | No admin dashboard for pass rate, drop-off, time-to-complete | When reporting becomes a product requirement |
| **Email notifications** | No "you've earned a certificate" email | When the CPE issuance needs to be formalized with a record-keeper |
| **Certificate PDF generation** | Current certificate is browser-print; no stored PDF artifact | When auditors want a file-based proof, not "trust the browser" |
| **Multi-tenant content** | Single Wagtail site, single course catalog | When KPMG practices want their own sub-catalogs |
| **Content migrations** | A bump in `PROGRESS_VERSION` wipes learners' state; no upgrade path | When the progress schema ever needs to change in a backward-incompatible way |
| **Microsoft SSO: group sync** | A signed-in user gets a plain Django `User`; we don't pull their Entra groups / roles | When access control needs to mirror the org chart |
| **Rate limiting** | None on `/api/auth/login/` or `/api/progress/*` | Before the app goes onto the public internet |
| **Observability** | No structured logging / metrics / tracing beyond Django's default | When multiple engineers are on-call and something gets paged |

None of these are blockers today. Each maps cleanly to a future phase whose scope was deferred in service of shipping 2A → 3D cleanly.

---

**Status as of Phase 3D:** the application has moved from a static, single-user GitHub Pages demo to a full-stack, multi-user, CMS-authored, SSO-capable training platform with a typed API, 84 automated tests, and documented deployment. It is ready for a pilot cohort on a real KPMG tenant pending the Azure app registration handshake described in `backend/README.md`.
