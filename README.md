# COSO CPE Course

Internal training course (COSO Internal Control framework) delivered as a single-page React app. Tracks learner progress through modules, knowledge checks, a final assessment, and a course evaluation, then issues a certificate of completion.

**Repository layout** — monorepo with two top-level apps:

| Path | What lives here |
| --- | --- |
| `src/` | Frontend SPA — React 19 + TypeScript + Vite |
| `backend/` | Backend — Django 5 + Wagtail 6 + DRF, Postgres in Docker |

Frontend stack: React 19 + TypeScript + Vite, Tailwind CSS v4, react-router (HashRouter), Vitest + React Testing Library. Learner progress state lives in a `useReducer` + Context store (persisted to `localStorage`); course content is fetched from the backend API at app boot via a second Context provider (`CourseDataProvider`) that renders a loading spinner and a retryable error card around the app tree.

Backend stack: Django 5 + Wagtail 6 (CMS for SME-authored course content) + Django REST Framework, served against Postgres 17. Custom `AbstractUser`, session-cookie auth. SMEs author courses through Wagtail's `StreamField` block editor — paragraph / heading / callout / example / warning / table / list — mirroring the frontend's `ContentBlock` types.

For backend setup and the full SME authoring workflow, see [backend/README.md](backend/README.md).

---

# Frontend

## Prerequisites

- Node.js 20 or newer
- pnpm 10 (`corepack enable && corepack prepare pnpm@10 --activate`)
- The backend running on http://localhost:8000 (see [backend/README.md](backend/README.md) for setup). The frontend fetches course content from `/api/courses/<slug>/` at boot — without the backend the app shows a retryable error card.

## Getting started

```bash
pnpm install
pnpm dev
```

The dev server prints a local URL (default: http://localhost:5173). Hot reload is on.

To point the SPA at a non-default API host, copy `.env.example` to `.env.local` and set `VITE_API_BASE_URL`. The default (`http://localhost:8000/api`) matches the Django dev server.

## Scripts

| Command | What it does |
| --- | --- |
| `pnpm dev` | Start the Vite dev server |
| `pnpm build` | Typecheck and produce a production build in `dist/` |
| `pnpm preview` | Serve the production build locally |
| `pnpm typecheck` | Run `tsc -b --noEmit` across all tsconfigs |
| `pnpm lint` | Run ESLint over the repo |
| `pnpm test` | Run the Vitest suite once |
| `pnpm test:watch` | Run Vitest in watch mode |
| `pnpm test:coverage` | Run tests with v8 coverage report |

Before opening a PR, run `pnpm typecheck && pnpm lint && pnpm test && pnpm build`. CI runs the same gates.

## Project layout

```
src/
  components/     UI: NavBar, Sidebar, Login, ModuleView, ReviewQuestions, Assessment, Evaluation, Certificate, ErrorBoundary, RequireAccess
  store/          courseStore (progress reducer + Context + access rules), progressStore (server-synced ProgressProvider), progressCodec (shared envelope format), courseDataContext/courseDataStore (fetched course data), authContext/authStore (AuthProvider), persistence (localStorage cache)
  api/            client (fetch wrapper with credentials + CSRF), courses (fetchCourse + Wagtail→frontend transform), auth (login/logout/me + Microsoft SSO), progress (fetch/save/delete learner progress)
  data/           courseContent.ts — types only (the content itself now comes from the API)
  test/setup.ts   Vitest setup — patches Node 25's broken localStorage stub
```

Routing uses `HashRouter` so the app works on static hosts (GitHub Pages) without server-side rewrites. Every protected route is wrapped in `<RequireAccess section="...">`, which redirects to `/` when the learner has not unlocked the section yet.

Progress is server-authoritative: `ProgressProvider` fetches `/api/progress/<course_slug>/` at login and dispatches a `HYDRATE` action to replace in-memory state. Every change is written to `localStorage` immediately (offline cache, key `coso-cpe-course:progress`) and debounced by 600ms before being PUT back to the server. The local cache is cleared on logout so the next learner on the same device starts clean. The serialization envelope (`src/store/progressCodec.ts`) is versioned — on a version mismatch or parse error, decode returns `null` and the course starts over rather than crashing.

## Deployment

Pushes to `main` deploy to GitHub Pages via [.github/workflows/deploy.yml](.github/workflows/deploy.yml). The workflow runs typecheck, lint, and tests in a `verify` job before the `build` and `deploy` jobs run. Pull requests run `verify` only.

The `base` path in [vite.config.ts](vite.config.ts) is set to `/GEN_AI_COSO_CPE_COURSE/` for production builds. If you fork or rename the repo, update that string.

## Tests

27 tests cover the reducer (including `HYDRATE` for server state replacement), section-gating rules, the shared progress codec (round-trip with `Set` serialization, version mismatch, shape validation), the localStorage cache (corrupted JSON, version mismatch), and the `RequireAccess` route guard. Tests run in jsdom.

> Heads up for Node 25+: Node ships an experimental `localStorage` stub on `globalThis` that has no methods and shadows jsdom's `Storage`. [src/test/setup.ts](src/test/setup.ts) replaces it with an in-memory `Storage` before each test. Don't remove that shim unless you have verified your Node version no longer injects the stub.

---

# Backend

All backend commands run from the `backend/` directory.

## Prerequisites

- Docker Desktop (for the Postgres container)
- Python 3.12 (`brew install python@3.12`)
- [`uv`](https://docs.astral.sh/uv/) (`brew install uv`)
- Optional: `psql` CLI (`brew install libpq && brew link --force libpq`)
- Optional: `pre-commit` (`brew install pre-commit`)

## First-time setup

```bash
cd backend
cp .env.example .env                # adjust if you want non-default DB creds
uv sync                             # creates .venv, installs deps from uv.lock
docker compose up -d                # starts Postgres on :5432
uv run python manage.py migrate
uv run python manage.py createsuperuser
```

Default dev credentials baked in by the scaffold (created automatically): `admin` / `admin`. **Change immediately.**

## Running the dev server

```bash
docker compose up -d                # if not already running
uv run python manage.py runserver
```

| URL | What it is |
| --- | --- |
| http://localhost:8000/ | Public site (Wagtail-rendered pages — empty until milestone 2B) |
| http://localhost:8000/admin/ | **Wagtail CMS** — where SMEs author course content |
| http://localhost:8000/django-admin/ | Django admin — for users/groups/low-level model edits |

## Backend scripts

All run via `uv run <cmd>` so you don't need to activate the venv manually.

| Command | What it does |
| --- | --- |
| `uv sync` | Install/update deps from `uv.lock` |
| `uv run python manage.py runserver` | Start the dev server |
| `uv run python manage.py makemigrations` | Generate model migrations |
| `uv run python manage.py migrate` | Apply migrations |
| `uv run python manage.py shell` | Django REPL (IPython if available) |
| `uv run pytest` | Run the test suite |
| `uv run pytest --cov` | Run tests with coverage |
| `uv run ruff check .` | Lint |
| `uv run ruff format .` | Auto-format |
| `docker compose up -d` | Start Postgres |
| `docker compose down` | Stop Postgres (data persists in named volume) |
| `docker compose down -v` | Stop and **destroy** the Postgres volume |

Before opening a backend PR: `uv run ruff check . && uv run ruff format --check . && uv run pytest`.

## Backend project layout

```
backend/
  config/
    settings/         base.py, dev.py, test.py, prod.py — env-driven via django-environ
    urls.py           Top-level URLConf (Django admin + Wagtail admin + Wagtail public pages)
    wsgi.py / asgi.py Production entrypoints
  apps/
    accounts/         Custom User model (AbstractUser, unique email)
    courses/          Wagtail page models + StreamField blocks (populated in milestone 2B)
  conftest.py         Shared pytest fixtures
  pyproject.toml      Deps, ruff/mypy/pytest config
  uv.lock             Pinned dep versions — commit this
  docker-compose.yml  Postgres 17-alpine
  .env.example        Copy to .env; .env is gitignored
```

## Settings layering

`config/settings/base.py` defines everything shared. The other modules import `from .base import *` and override only what differs:

- `dev.py` — `DEBUG=True`, permissive `ALLOWED_HOSTS`, console email backend
- `test.py` — fast password hasher, locmem email, tmp `MEDIA_ROOT`
- `prod.py` — `DEBUG=False`, HSTS, secure cookies, `SECRET_KEY` and `ALLOWED_HOSTS` **required** from env (no defaults — fail fast)

`manage.py` defaults to `config.settings.dev`. Override with `DJANGO_SETTINGS_MODULE=...` or in `.env`.

## What's done vs what's coming

**Done — Phase 2A (foundation)**
- Project scaffolded, deps installed, Postgres running, migrations applied, Wagtail admin reachable
- Custom `User` model wired as `AUTH_USER_MODEL`
- pytest + ruff configured

**Done — Phase 2B (content models)**
- Wagtail page hierarchy: `CourseIndexPage → CoursePage → {ModulePage, ReviewPage, AssessmentPage, EvaluationPage}`
- StreamField blocks mirroring the frontend `ContentBlock` types (paragraph, heading, callout, example, warning, table, bullet list)
- Orderable inline questions for Review and Assessment
- `seed_demo_course` management command for instant local content

**Done — Phase 2C (REST API)**
- `GET /api/courses/` and `GET /api/courses/<slug>/` — public read of the catalog, output shape matches the frontend's `CourseData`
- `GET/PUT/DELETE /api/progress/<course_slug>/` — per-user learner progress with an opaque JSON payload
- `POST /api/auth/login/`, `POST /api/auth/logout/`, `GET /api/auth/me/`, `GET /api/auth/csrf/` — session-cookie auth for the SPA
- OpenAPI 3 schema at `/api/schema/` with Swagger UI at `/api/docs/` and ReDoc at `/api/redoc/` (via `drf-spectacular`)
- 42 pytest tests cover the API surface, page tree, StreamField round-trips, and seed command

**Done — Phase 3A (seed → full course)**
- `seed_demo_course` ported to the full 3-module / 3-review / 15-question assessment / 5-question evaluation content from the old hardcoded frontend data
- Seed test assertions updated for the new counts; `cpeCredits` serializer returns a number (not a string) so the frontend gets typed data

**Done — Phase 3B (frontend wired to API)**
- `src/api/client.ts` — fetch wrapper with `credentials: include`, automatic `X-CSRFToken` on unsafe methods, typed `ApiError`
- `src/api/courses.ts` — `fetchCourse(slug)` plus a transform layer that normalizes Wagtail's `{type, value}` StreamField shape into the frontend's flat `ContentBlock` union and renames `bullet_list` → `list`, `module-1` → `module1`
- `CourseDataProvider` fetches once at app boot and renders loading/error UIs; `useCourseData()` hook replaces every `import { courseData }` call site (CourseOverview, ModuleView, ReviewQuestions, Assessment, Evaluation, Certificate)
- `ContentBlock` now renders rich HTML via `dangerouslySetInnerHTML` so SMEs get inline emphasis from Wagtail's RichText editor
- `src/data/courseContent.ts` reduced to types only — the component tree no longer imports a static content blob

**Done — Phase 3C (login UI + Microsoft SSO)**
- `AuthProvider` boots the session (`/api/auth/csrf/` + `/api/auth/me/`) and gates the app on a signed-in user; a `<Login />` screen renders for anonymous visitors
- Username/password form against the existing `/api/auth/login/`; the `ensure_dev_admin` management command seeds a default `admin` / `admin` superuser for local dev
- "Sign in with Microsoft" button wired to an OAuth2 authorization-code flow (MSAL on the backend, `/api/auth/microsoft/{config,login,callback}/`). The button only appears when the Azure credentials are configured — see `backend/README.md` → "Microsoft SSO setup" for the full Azure-portal walkthrough
- NavBar shows the signed-in user + a logout button; `CSRF_TRUSTED_ORIGINS` added so cross-origin POSTs from the Vite dev server aren't blocked
- 15 new backend tests cover the OAuth flow + the dev-admin seed command (57 total)

**Done — Phase 3D (server-side learner progress)**
- `ProgressProvider` owns the `useReducer` and bridges it to the backend: fetches `/api/progress/<slug>/` at login and dispatches `HYDRATE` to replace in-memory state (server is source of truth on boot)
- Every dispatch writes to `localStorage` immediately (offline cache) and schedules a 600 ms-debounced `PUT /api/progress/<slug>/`; rapid edits (e.g. typing a free-text evaluation answer) collapse into a single network call
- Pending saves flush on `visibilitychange:hidden` and on `pagehide` / unmount so the last write lands when the tab backgrounds or closes
- Shared `progressCodec.ts` — the *same* versioned envelope serializes to both localStorage and the server `payload` blob, so they can't drift
- Logout clears the localStorage cache so the next learner on the same device starts clean; their own server-side progress rehydrates on their next login
- 5 new frontend tests cover the codec (round-trip, shape validation, version mismatch) plus a `HYDRATE` reducer test (27 total)

**Next milestone**
- **3E** (TBD): richer UX polish — a toast when the server save fails, a "last synced" timestamp in the NavBar, or an admin view of all learners' progress in the Django admin
