# Backend — COSO CPE Course

Django 5 + Wagtail 6 + Django REST Framework, backed by Postgres 17 in Docker.

> See the [root README](../README.md) for the monorepo overview. This file is the quick-start for the backend only.

---

## 1. Prerequisites

Confirm you have all four:

```bash
docker --version          # 20.10+ (Docker Desktop running)
python3.12 --version      # 3.12.x
uv --version              # 0.1+
psql --version            # optional, for poking at the DB
```

If anything is missing:

```bash
brew install --cask docker          # then launch Docker.app once
brew install python@3.12 uv libpq
brew link --force libpq             # exposes psql on your PATH
```

## 2. First-time setup (run once)

From this directory (`backend/`):

```bash
cp .env.example .env                # adjust DB creds if you want; defaults work
uv sync                             # creates .venv/, installs all deps from uv.lock
docker compose up -d                # starts Postgres on :5432 (data in named volume)
uv run python manage.py migrate     # applies all Django + Wagtail migrations
uv run python manage.py ensure_dev_admin   # creates admin / admin superuser
uv run python manage.py seed_demo_course   # optional but recommended — creates a sample course
```

`ensure_dev_admin` creates (or resets) a local superuser with username `admin` and password `admin`. It only works in `DEBUG=True` and is idempotent — re-running it resets the password back to `admin` if you've changed it. **Change the password or delete this user before exposing the service.** Alternatively use `uv run python manage.py createsuperuser` for an interactive flow with custom credentials.

**Verify Postgres is healthy** before continuing:

```bash
docker compose ps                   # STATUS should say "Up (healthy)"
```

After running `seed_demo_course`, the Wagtail admin will show a "Course Catalog" with one fully-built course you can poke at. Re-run with `--force` to wipe and recreate it.

## 3. Start the server

```bash
docker compose up -d                # ensure Postgres is running
uv run python manage.py runserver   # starts Django on :8000
```

Leave this terminal running. You should see:

```
Watching for file changes with StatReloader
Performing system checks...
System check identified no issues (0 silenced).
Django version 5.2.x, using settings 'config.settings.dev'
Starting development server at http://127.0.0.1:8000/
Quit the server with CONTROL-C.
```

That one `runserver` process serves everything — Wagtail admin, Django admin, the public pages, **and the REST API under `/api/`**. There is no separate API service to start.

## 4. See what's there

Open these in your browser:

| URL | What you'll see | Use for |
| --- | --- | --- |
| http://localhost:8000/ | The Course Catalog page (after seeding) — links to each course | Public catalog landing |
| http://localhost:8000/coso-ai-internal-control/ | A demo course page with description, learning objectives, and outline | Per-course landing |
| http://localhost:8000/coso-ai-internal-control/module-1/ | Module 1 with rendered content blocks (paragraph, callout, list) | Per-module preview |
| http://localhost:8000/coso-ai-internal-control/review-1/ | The knowledge-check questions | Per-review preview |
| http://localhost:8000/coso-ai-internal-control/assessment/ | Final assessment with all questions | Assessment preview |
| http://localhost:8000/coso-ai-internal-control/evaluation/ | Course evaluation form | Evaluation preview |
| http://localhost:8000/admin/ | **Wagtail admin login**, then a dashboard | Where SMEs author course content |
| http://localhost:8000/django-admin/ | Django admin | User/permission management |
| http://localhost:8000/api/courses/ | JSON list of published courses | API smoke check |
| http://localhost:8000/api/courses/coso-ai-internal-control/ | Full course tree as JSON (matches frontend `CourseData` shape) | API smoke check |
| http://localhost:8000/api/docs/ | **Swagger UI** — interactive OpenAPI explorer for every endpoint | Try the API from your browser |
| http://localhost:8000/api/redoc/ | ReDoc — read-only reference docs | Same schema, nicer for reading |
| http://localhost:8000/api/schema/ | Raw OpenAPI 3 schema (YAML) | Feed to codegen tools |

Public-facing pages render with bare placeholder templates today — the real learner UI is the React SPA, which gets wired up in Phase 3. The placeholder is just so SMEs can hit "View live" in Wagtail admin without seeing a 500.

### Authoring a course in Wagtail (the SME workflow)

1. Sign in at http://localhost:8000/admin/.
2. **Pages → Course Catalog → Add child page → Course**.
3. Fill in title, subtitle, description, CPE credits, passing score, and learning objectives.
4. Publish.
5. Inside the course, **Add child page** → choose Module / Review / Assessment / Evaluation as needed.
6. For a Module, add titled sections, then drop content blocks into each section: paragraph, heading, callout (info/tip/warning/important variants), example, warning, table, bulleted list.
7. For a Review or Assessment, add questions inline, with 2-5 answer options each, marking the correct one.
8. Publish.

Wagtail enforces the page-type hierarchy in the admin — you can't add an Assessment outside a Course, can't add a Module outside a Course, etc.

### What you'll find in the Django admin (today)

- **Accounts → Users** — your custom `User` model. You can add learners, give staff/superuser flags, etc.
- **Progress → Course progress** — read-only view of every learner's per-course progress blob, useful for support/debugging.

### REST API (Phase 2C)

The SPA talks to the backend through `/api/`. All endpoints accept and return JSON. Interactive docs live at **http://localhost:8000/api/docs/** (Swagger UI) — you can fire requests straight from the browser there.

| Method + path | Auth | What it does |
| --- | --- | --- |
| `GET  /api/courses/` | open | List published courses (slug, title, subtitle, credits) |
| `GET  /api/courses/<slug>/` | open | Full course tree — modules, sections, review/assessment/evaluation questions. Output mirrors the frontend's `CourseData` interface |
| `GET  /api/auth/csrf/` | open | Sets the `csrftoken` cookie (call once on app load) |
| `POST /api/auth/login/` | open | Body `{username, password}` → starts a session, returns the user |
| `POST /api/auth/logout/` | session | Ends the session |
| `GET  /api/auth/me/` | session | Current user, or 403 |
| `GET  /api/progress/` | session | All progress rows for the current user |
| `GET  /api/progress/<course_slug>/` | session | Progress for one course |
| `PUT  /api/progress/<course_slug>/` | session | Upsert: body `{payload: {…}}` (opaque JSON, owned by the frontend store) |
| `DELETE /api/progress/<course_slug>/` | session | Delete that user's progress for the course |

Quick smoke-check from the shell:

```bash
curl -s http://localhost:8000/api/courses/ | python3 -m json.tool
curl -s http://localhost:8000/api/courses/coso-ai-internal-control/ | python3 -m json.tool | head -50
```

For browser/SPA calls: include the session cookie and an `X-CSRFToken` header (matching the `csrftoken` cookie value) on any unsafe (POST/PUT/DELETE) request. The dev settings open CORS to `http://localhost:5173` so the Vite app can call the API directly with credentials.

### Microsoft SSO setup (optional)

The login screen shows a **Sign in with Microsoft** button whenever the backend has Entra ID (Azure AD) credentials configured; otherwise only the username/password form appears. The button is wired to a standard OAuth 2.0 authorization-code flow backed by MSAL.

**High-level flow**

```
Browser (Login page)
    │ click "Sign in with Microsoft"
    ▼
GET /api/auth/microsoft/login/           ← Django builds the authorize URL
    │ 302 redirect
    ▼
https://login.microsoftonline.com/…/authorize?client_id=…
    │ user signs in, consents
    ▼
GET /api/auth/microsoft/callback/?code=…&state=…
    │ Django exchanges code for token (confidential client),
    │ calls Graph /me, upserts a Django User,
    │ starts a session, then redirects back to the SPA
    ▼
http://localhost:5173/?auth=ok           ← AuthProvider reads the flag,
                                           re-fetches /api/auth/me/, proceeds
```

#### One-time Azure portal configuration

1. Go to <https://portal.azure.com> → **Microsoft Entra ID** → **App registrations** → **New registration**.
2. Fill in:
   - **Name**: e.g. "COSO CPE Course (dev)" — user-visible on the consent screen.
   - **Supported account types**: pick "Accounts in this organizational directory only" for a single-tenant internal app; "Accounts in any organizational directory" for multi-tenant; or "…and personal Microsoft accounts" for both.
   - **Redirect URI**: platform = **Web**, value = `http://localhost:8000/api/auth/microsoft/callback/` (for local dev — add a second entry for your prod URL later).
3. After creation, on the **Overview** blade copy:
   - **Application (client) ID** → `MICROSOFT_AUTH_CLIENT_ID`
   - **Directory (tenant) ID** → `MICROSOFT_AUTH_TENANT_ID`
     - Alternatively, set this to `common` (work + personal), `organizations` (any work tenant), or `consumers` (personal only).
4. Go to **Certificates & secrets** → **Client secrets** → **New client secret**. Pick a reasonable expiry. Copy the **Value** (not the secret ID — the Value is only shown once) → `MICROSOFT_AUTH_CLIENT_SECRET`.
5. Go to **API permissions** and confirm the default **`Microsoft Graph → User.Read`** delegated permission is present (it's added automatically for new registrations). This is what lets the backend call `/me` to get the user's email + display name.
6. (Optional but recommended) Click **Grant admin consent for <tenant>** so end users don't see a consent prompt on first sign-in.

#### Wire the values into the backend

Add these to `backend/.env` (values are gitignored; `.env.example` has the full template):

```bash
MICROSOFT_AUTH_CLIENT_ID=00000000-0000-0000-0000-000000000000
MICROSOFT_AUTH_CLIENT_SECRET=the-Value-you-copied-from-Azure
MICROSOFT_AUTH_TENANT_ID=11111111-1111-1111-1111-111111111111  # or "common" / "organizations"
MICROSOFT_AUTH_REDIRECT_URI=http://localhost:8000/api/auth/microsoft/callback/
```

Restart `runserver` after editing `.env`. Confirm the SSO endpoint reports enabled:

```bash
curl -s http://localhost:8000/api/auth/microsoft/config/
# → {"enabled":true,"login_url":"http://localhost:8000/api/auth/microsoft/login/"}
```

The SPA calls `/config/` at boot and conditionally renders the button.

#### Production notes

- Register the prod redirect URI separately in the Azure portal (e.g. `https://learn.example.com/api/auth/microsoft/callback/`) and set `MICROSOFT_AUTH_REDIRECT_URI` to match.
- Set `FRONTEND_URL` (or `MICROSOFT_AUTH_FRONTEND_REDIRECT` if it needs to differ) so the callback bounces to the real SPA origin.
- Rotate the client secret before expiry — expired secrets make the `/callback/` endpoint return `?auth=error&reason=token_exchange_failed` to the SPA.
- For extra locking down, remove `common` from `TENANT_ID` — a tenant GUID restricts sign-in to that single directory.

#### What we create in Django

When a new Microsoft user signs in, the backend upserts a `User` row keyed by `ms-<oid>` (the Entra object id, which is stable across email changes). `email`, `first_name`, and `last_name` are populated from Graph. You can see these users in the Django admin at `/django-admin/accounts/user/`. Existing `admin` / password-auth users are untouched — SSO users are a separate population.

#### Troubleshooting

| Symptom | Cause | Fix |
| --- | --- | --- |
| SSO button never appears | One of the three Azure values is blank | Fill in `.env`, restart `runserver` |
| Redirect loops back to login with `?auth=error&reason=state_mismatch` | Browser blocked the session cookie (e.g. third-party cookie policy) | Make sure backend + frontend share a registrable domain or configure `SESSION_COOKIE_SAMESITE = "None"` + `SECURE = True` in prod |
| `reason=token_exchange_failed` | Client secret expired or wrong | Generate a new secret in Azure, update `MICROSOFT_AUTH_CLIENT_SECRET` |
| `reason=microsoft_denied` | User cancelled or admin consent not granted | Grant admin consent, or ask the user to retry |
| "AADSTS50011: Reply URL does not match" on the Microsoft side | The `redirect_uri` doesn't exactly match what's registered | Ensure `MICROSOFT_AUTH_REDIRECT_URI` is byte-identical to the entry in Azure (trailing slash matters) |

## 5. Run the tests

```bash
uv run pytest                       # 57 tests, ~5s
uv run pytest --cov                 # with coverage report
```

Expected output:

```
======================== 57 passed in ~5s ========================
```

Coverage:
- Settings module loads, custom User model, admin login pages render
- Page-tree restrictions (can't put a Module outside a Course, etc.)
- StreamField round-trips (every block type, every variant, mixed sections)
- Orderable Question + Option models for Review and Assessment
- The `seed_demo_course` command (creation, idempotency, --force)
- `/api/courses/` and `/api/courses/<slug>/` shape, draft exclusion, 404s
- `/api/progress/` upsert, per-user scoping, payload validation, delete
- `/api/auth/{csrf, me, login, logout}/` happy path + auth gating

## 6. Lint and format

```bash
uv run ruff check .                 # lint
uv run ruff format .                # format in place
uv run ruff format --check .        # CI-style check (no modifications)
```

Run all three before committing: `uv run ruff check . && uv run ruff format --check . && uv run pytest`.

---

## Stopping everything

```bash
# Stop Django: Ctrl+C in its terminal
docker compose down                 # stops Postgres; data preserved in volume
docker compose down -v              # stops Postgres AND destroys the volume (full reset)
```

## Common operations

**Reset the database from scratch:**

```bash
docker compose down -v
docker compose up -d
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

**Connect to the DB with `psql`:**

```bash
psql -h localhost -U coso_cpe -d coso_cpe
# password from .env (default: coso_cpe_dev)
```

**Open the Django shell (IPython if available):**

```bash
uv run python manage.py shell
```

**Make migrations after editing a model:**

```bash
uv run python manage.py makemigrations
uv run python manage.py migrate
```

**Re-seed the demo course (after model changes):**

```bash
uv run python manage.py seed_demo_course --force
```

---

## Troubleshooting

**`docker compose up -d` fails with "Cannot connect to the Docker daemon"**
Docker Desktop isn't running. Open Docker.app and wait for the whale icon in the menu bar to be steady.

**`uv run python manage.py migrate` fails with "could not connect to server"**
Postgres isn't up yet. Run `docker compose ps` — STATUS should say `Up (healthy)`. If it says `Up (health: starting)`, wait 5 seconds and retry.

**`runserver` fails with "Port 8000 already in use"**
Another process is on :8000. Either kill it (`lsof -ti:8000 | xargs kill`) or run on a different port: `uv run python manage.py runserver 8001`.

**Wagtail admin shows "Page not found" at `/admin/`**
You're hitting the wrong URL. Wagtail admin is at `/admin/`, Django admin is at `/django-admin/` — both in [config/urls.py](config/urls.py).

---

## Project layout

```
backend/
├── config/
│   ├── settings/
│   │   ├── base.py    # shared
│   │   ├── dev.py     # local dev (DEBUG=True, permissive hosts)
│   │   ├── test.py    # pytest (fast hasher, tmp media root)
│   │   └── prod.py    # production (HSTS, secure cookies, SECRET_KEY required)
│   ├── urls.py        # top-level URLConf
│   ├── wsgi.py        # gunicorn entrypoint
│   └── asgi.py        # ASGI entrypoint
├── apps/
│   ├── accounts/      # custom User + session-cookie auth API
│   │   ├── api.py               # csrf / me / login / logout views
│   │   ├── serializers.py       # UserSerializer, LoginSerializer
│   │   └── urls.py              # mounted under /api/auth/
│   ├── courses/       # Wagtail page models, StreamField blocks, catalog API
│   │   ├── blocks.py            # ContentBlock types (paragraph, callout, table, etc.)
│   │   ├── models.py            # CoursePage, ModulePage, ReviewPage, etc.
│   │   ├── serializers.py       # camelCase output matching frontend CourseData
│   │   ├── api.py               # CourseCatalogViewSet (read-only, public)
│   │   ├── urls.py              # mounted under /api/
│   │   ├── templates/courses/   # placeholder render templates (real UI is the React SPA)
│   │   └── management/commands/seed_demo_course.py
│   └── progress/      # per-user learner progress (opaque JSON payload)
│       ├── models.py            # CourseProgress (user, course_slug, payload, timestamps)
│       ├── serializers.py
│       ├── api.py               # CourseProgressViewSet — upsert by course_slug
│       └── urls.py              # mounted under /api/
├── conftest.py        # shared pytest fixtures (`user`, `admin_user`)
├── manage.py          # Django CLI; defaults to config.settings.dev
├── pyproject.toml     # deps + ruff/mypy/pytest config
├── uv.lock            # pinned versions — commit this
├── docker-compose.yml # Postgres 17-alpine
├── .env.example       # template; copy to .env
└── .env               # your local env vars (gitignored)
```

## What's implemented today vs coming

**Done (Phase 2A — backend foundation)**
- Project scaffolded, deps installed, Postgres running
- Custom `User(AbstractUser)` wired as `AUTH_USER_MODEL`
- Wagtail and Django admins both reachable
- pytest + ruff configured

**Done (Phase 2B — content models)**
- Page hierarchy: `CourseIndexPage → CoursePage → {ModulePage, ReviewPage, AssessmentPage, EvaluationPage}`
- `StreamField` blocks matching the frontend `ContentBlock` types: paragraph, heading, callout (info/tip/warning/important variants), example, warning, table, bulleted list, plus a `ModuleSectionBlock` wrapper
- Orderable inline questions for Review and Assessment with 2-5 answer options each
- Likert + free-text question types for Evaluation
- Wagtail admin panels (`InlinePanel`, `MultiFieldPanel`) for SME-friendly editing
- Page-type restrictions (`parent_page_types` / `subpage_types`) so the admin enforces valid hierarchies
- `seed_demo_course` management command for instant local content
- Placeholder render templates (the real UI is the React SPA)

**Done (Phase 2C — REST API)**
- Public read endpoints: `GET /api/courses/` (catalog list) and `GET /api/courses/<slug>/` (full nested tree, camelCase keys matching the frontend's `CourseData`)
- Learner progress CRUD at `/api/progress/<course_slug>/` — upsert via PUT, scoped per-user via session auth
- Session-cookie auth surface for the SPA: `/api/auth/csrf/`, `/api/auth/login/`, `/api/auth/logout/`, `/api/auth/me/`
- 42 pytest tests covering API shape, draft exclusion, per-user scoping, and auth gating

**Done (Phase 3A — seed parity)**
- `seed_demo_course` ported to the full 3-module / 3-review / 15-question assessment / 5-question evaluation structure from the old hardcoded `src/data/courseContent.ts`
- `cpeCredits` serializer switched to `coerce_to_string=False` so it round-trips as a JSON number

**Done (Phase 3B — frontend consuming the API)**
- The React SPA fetches `/api/courses/coso-ai-internal-control/` at boot through a `CourseDataProvider`; the hardcoded content blob is gone and `src/data/courseContent.ts` is now types-only
- A small transform layer on the frontend reshapes Wagtail's `{type, value}` StreamField output into the flat `ContentBlock` union the existing components expect

**Done (Phase 3C — login UI + Microsoft SSO)**
- React `AuthProvider` boots the session, renders a `<Login />` screen for anonymous users, and exposes `useAuth()` with a logged-in `user` + `logout()` to the tree
- Username/password path uses the existing `POST /api/auth/login/` (seeded `admin` / `admin` for local dev via `ensure_dev_admin`)
- Microsoft Entra ID SSO via OAuth2 authorization-code flow: `/api/auth/microsoft/{config,login,callback}/` endpoints on the backend (MSAL-backed), "Sign in with Microsoft" button on the frontend that appears only when the admin has configured Azure credentials
- `CSRF_TRUSTED_ORIGINS` added so cross-origin POSTs from the Vite dev server (:5173 → :8000) aren't rejected by Django 4+ CSRF
- NavBar now shows the signed-in user's avatar + name + email with a sign-out button; logout ends the Django session and drops the user back to the login screen
- 15 new pytest tests cover the MS OAuth flow (state mismatch, missing code, Microsoft errors, happy path, token-exchange failures) and the `ensure_dev_admin` command

**Done (Phase 3D — server-side learner progress)**
- The SPA now uses `/api/progress/<slug>/` as the source of truth. `ProgressProvider` hydrates the reducer at login, and every state change is debounced (600 ms) + PUT back to the server
- localStorage kept as an offline cache so a flaky network doesn't lose progress; pending writes flush on tab hide / close. Signed-out users never see cached state — the cache is cleared on logout
- Shared `progressCodec` means the localStorage blob and the server `payload` JSON are byte-identical; schema drift is prevented by a single versioned envelope

**Coming**
- **3E (TBD)** — UX polish (save status indicator, per-learner admin view, analytics)
