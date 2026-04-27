# FastAPI + Postgres Rulebook

Async Python HTTP service: FastAPI on Uvicorn, Postgres via SQLAlchemy 2 async + asyncpg, Alembic migrations, Pydantic v2 validation, structlog JSON logs, pytest + httpx tests, Ruff + ty, Dockerized, deployed to Fly.io.

Generated 2026-04-27. Valid for FastAPI 0.136.x, SQLAlchemy 2.0.x, Pydantic 2.13.x, Python 3.13.x.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Python 3.13 | Stable, asyncio mature, 3.14 too new for asyncpg wheels |
| Runtime + version | CPython 3.13.13 | Latest 3.13 maintenance release April 2026 |
| Package manager | uv 0.7.x | 10-100x faster than pip, lockfile + python install |
| Build tool | uv build (PEP 517) | Native to uv, no setuptools dance |
| State mgmt | n/a (stateless HTTP) | Service is stateless; state lives in Postgres |
| Routing/Nav | FastAPI APIRouter | One router per resource, mounted in main.py |
| Data layer | SQLAlchemy 2.0 async + asyncpg | Async ORM with typed Mapped columns |
| Auth | OAuth2 password + JWT (python-jose, pwdlib argon2id) | Stateless, scope-based |
| Styling | n/a (API-only) | No frontend in this rulebook |
| Forms + validation | Pydantic v2 BaseModel | Native FastAPI integration, request/response models |
| Unit test runner | pytest 8 + pytest-asyncio | De-facto Python standard, asyncio_mode=auto |
| E2E framework | pytest + httpx.AsyncClient + ASGITransport | In-process, parallel via pytest-xdist |
| Mocking strategy | respx for outbound HTTP; real Postgres in tests | Never mock the DB |
| Logger | structlog 25.5 JSON | Structured, contextvars, ProcessorFormatter |
| Error tracking | Sentry sentry-sdk 2.58 | First-class FastAPI integration |
| Lint + format | Ruff 0.13 (lint + format) | Replaces Black, isort, flake8 |
| Type checking | ty (Astral) + pyright fallback | ty is fast; pyright is stable |
| Env vars + secrets | pydantic-settings 2.14 + .env (dev), Fly secrets (prod) | Typed, validated at boot |
| CI provider | GitHub Actions | Free for public, ubiquitous |
| Deploy target | Fly.io (Dockerfile) | Closest to prod-grade for hobby tier |
| Release flow | `fly deploy` from main after CI green | One command, atomic |
| Auto-update | Fly auto-rollout on deploy | Built into platform |
| DB driver | asyncpg 0.30 | Fastest async Postgres driver |
| Migrations | Alembic 1.18 (async template) | SQLAlchemy-native, autogenerate |
| Settings | pydantic-settings | Validates env at boot, fails fast |
| ASGI server | Uvicorn 0.34 (single proc per container) | Fly scales by container, not by worker |
| Password hashing | pwdlib + argon2id | Replaces passlib, argon2 winner of PHC |
| HTTP client (outbound) | httpx 0.28 AsyncClient | Same lib as test client, async by default |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Python | 3.13.13 | 2026-04-07 | https://www.python.org/downloads/release/python-31313/ |
| uv | 0.7.x (April 2026) | 2026-03-26 | https://github.com/astral-sh/uv/releases |
| FastAPI | 0.136.1 | 2026-04-23 | https://github.com/fastapi/fastapi/releases |
| Uvicorn | 0.34.x | 2026 | https://uvicorn.dev/ |
| SQLAlchemy | 2.0.49 | 2026-04-03 | https://pypi.org/project/SQLAlchemy/ |
| asyncpg | 0.30.x | 2026 | https://pypi.org/project/asyncpg/ |
| Alembic | 1.18.4 | 2026-03 | https://pypi.org/project/alembic/ |
| Pydantic | 2.13.3 | 2026-04-20 | https://github.com/pydantic/pydantic/releases |
| pydantic-settings | 2.14.0 | 2026-04-20 | https://pypi.org/project/pydantic-settings/ |
| structlog | 25.5.0 | 2026 | https://www.structlog.org/ |
| pytest | 8.x | 2026 | https://pypi.org/project/pytest/ |
| pytest-asyncio | 0.25.x | 2026 | https://pypi.org/project/pytest-asyncio/ |
| httpx | 0.28.x | 2026 | https://pypi.org/project/httpx/ |
| Ruff | 0.13.x | 2026-04-24 | https://github.com/astral-sh/ruff/releases |
| ty | 0.0.x (beta) | 2026-04-20 | https://github.com/astral-sh/ty/releases |
| sentry-sdk | 2.58.x | 2026-04 | https://pypi.org/project/sentry-sdk/ |
| OpenTelemetry FastAPI | 0.49+ | 2026-04-09 | https://pypi.org/project/opentelemetry-instrumentation-fastapi/ |
| Postgres | 17.9 | 2026-02-26 | https://www.postgresql.org/about/news/postgresql-183-179-1613-1517-and-1422-released-3246/ |
| flyctl | latest | 2026 | https://fly.io/docs/flyctl/ |

### Minimum Host Requirements

- macOS 13+, Windows 10+, or any glibc Linux 2.31+ (Ubuntu 20.04+)
- 4 GB RAM, 5 GB free disk
- Docker Desktop 4.30+ (for local Postgres + image build)

### Cold-Start Time

From `git clone` to `curl http://localhost:8000/healthz` returning 200 on a fresh machine: ~6 minutes (uv installs, Docker pulls Postgres, alembic upgrade head, uvicorn boot).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. uv (manages Python itself)
curl -LsSf https://astral.sh/uv/install.sh | sh
exec $SHELL                        # reload PATH

# 3. Docker Desktop
brew install --cask docker
open -a Docker                     # wait until whale icon is steady

# 4. flyctl
brew install flyctl

# 5. GitHub CLI (for CI secrets)
brew install gh
gh auth login                      # follow browser flow

# 6. Project bootstrap
git clone <repo> my-app && cd my-app
uv python install 3.13.13
uv sync                            # creates .venv, installs everything from uv.lock
cp .env.example .env               # fill SECRET_KEY (use: openssl rand -hex 32)

# 7. Local Postgres
docker compose up -d db            # see docker-compose.yml in §16
uv run alembic upgrade head

# 8. Run
uv run uvicorn src.main:app --reload
```

### Windows (PowerShell, run as user)

```powershell
# 1. winget already on Windows 10+/11
winget install --id Astral.UV -e
winget install --id Docker.DockerDesktop -e
winget install --id GitHub.cli -e
winget install --id Fly-io.flyctl -e

# 2. restart shell, then:
uv python install 3.13.13
git clone <repo> my-app
cd my-app
uv sync
copy .env.example .env             # edit SECRET_KEY
docker compose up -d db
uv run alembic upgrade head
uv run uvicorn src.main:app --reload
```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update && sudo apt-get install -y curl ca-certificates gnupg lsb-release git
curl -LsSf https://astral.sh/uv/install.sh | sh
# Docker
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker "$USER" && newgrp docker
# flyctl
curl -L https://fly.io/install.sh | sh
# gh
sudo apt-get install -y gh && gh auth login

git clone <repo> my-app && cd my-app
uv python install 3.13.13
uv sync
cp .env.example .env
docker compose up -d db
uv run alembic upgrade head
uv run uvicorn src.main:app --reload
```

### Accounts to Create

- **Fly.io** (https://fly.io/app/sign-up) — credit card required even on free trial after Oct 2024.
- **Sentry** (https://sentry.io/signup/) — free tier 5k errors/mo. Copy DSN to `.env`.
- **GitHub** — for repo + Actions.

### CLI Auth Steps

```bash
fly auth login                     # browser flow
gh auth login                      # browser flow
```

### Expected First-Run Output

```
$ uv run uvicorn src.main:app --reload
INFO:     Will watch for changes in these directories: ['/path/to/my-app']
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [12345] using WatchFiles
INFO:     Started server process [12346]
INFO:     Waiting for application startup.
{"event": "startup.begin", "level": "info", "timestamp": "2026-04-27T10:00:00.000Z"}
{"event": "db.connected", "level": "info", "dsn": "postgresql+asyncpg://...", "timestamp": "..."}
{"event": "startup.complete", "level": "info", "timestamp": "..."}
INFO:     Application startup complete.

$ curl http://localhost:8000/healthz
{"status":"ok","db":"ok","version":"0.1.0"}
```

### First-Run Errors

| Error | Fix |
|---|---|
| `connection refused` to db | `docker compose up -d db` then wait 5s |
| `password authentication failed for user "app"` | DATABASE_URL in `.env` doesn't match `POSTGRES_PASSWORD` in `docker-compose.yml` |
| `ModuleNotFoundError: No module named 'src'` | Run from repo root, not `src/`; check `pyproject.toml` `[tool.uv].package = true` |
| `RuntimeError: Event loop is closed` in tests | pytest-asyncio mode is wrong; set `asyncio_mode = "auto"` in `pyproject.toml` |
| `alembic: command not found` | Use `uv run alembic ...`, never bare `alembic` |
| `target_metadata is None` in autogenerate | `alembic/env.py` missing `from src.db import Base` |
| `asyncpg.exceptions.InvalidPasswordError` on Fly | `fly secrets list` shows no DATABASE_URL — set with `fly secrets set` |

---

## 3. Project Layout

```
my-app/
├── .env                          # local secrets (gitignored)
├── .env.example                  # template, committed
├── .dockerignore
├── .gitignore
├── .github/workflows/ci.yml
├── .cursor/rules                 # Cursor AI rules
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── .claude/settings.json
├── alembic/
│   ├── env.py                    # async-aware
│   ├── script.py.mako
│   └── versions/
│       └── 0001_initial.py
├── alembic.ini
├── docker-compose.yml            # local dev only
├── Dockerfile                    # prod image
├── fly.toml
├── pyproject.toml
├── uv.lock                       # COMMIT THIS
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── ruff.toml                     # or pyproject.toml [tool.ruff]
├── src/
│   ├── __init__.py
│   ├── main.py                   # app = FastAPI(...) + middleware + routers
│   ├── settings.py               # pydantic-settings Settings class
│   ├── db.py                     # async engine, Base, get_session dep
│   ├── logging.py                # structlog config
│   ├── deps.py                   # FastAPI dependency providers (auth, session)
│   ├── security.py               # password hashing, JWT encode/decode
│   ├── errors.py                 # custom exceptions + handlers
│   ├── models/                   # SQLAlchemy ORM
│   │   ├── __init__.py
│   │   └── user.py
│   ├── schemas/                  # Pydantic request/response
│   │   ├── __init__.py
│   │   └── user.py
│   ├── routers/                  # APIRouter per resource
│   │   ├── __init__.py
│   │   ├── health.py
│   │   ├── auth.py
│   │   └── users.py
│   ├── services/                 # business logic, no FastAPI imports
│   │   ├── __init__.py
│   │   └── user_service.py
│   └── repositories/             # DB access only
│       ├── __init__.py
│       └── user_repo.py
└── tests/
    ├── conftest.py               # fixtures: db, client, user
    ├── test_health.py
    ├── unit/
    │   └── test_security.py
    ├── integration/
    │   └── test_user_repo.py
    └── e2e/
        └── test_auth_flow.py
```

### Naming Conventions

- Files: `snake_case.py`. Test files: `test_*.py`. Fixtures: `conftest.py`.
- Classes: `PascalCase`. Functions/vars: `snake_case`. Constants: `UPPER_SNAKE`.
- Pydantic schemas: `UserCreate`, `UserRead`, `UserUpdate` (suffix = direction).
- ORM models: singular noun, `User` (table = `users`).
- Routers: file matches resource plural, `routers/users.py` exposes `/users`.

### Decision Table — Where Does X Go?

| Adding... | Goes in |
|---|---|
| New endpoint | `src/routers/<resource>.py` |
| New ORM table | `src/models/<resource>.py` + Alembic revision |
| New request/response shape | `src/schemas/<resource>.py` |
| New business rule | `src/services/<resource>_service.py` |
| New DB query | `src/repositories/<resource>_repo.py` |
| New env var | `src/settings.py` Settings class + `.env.example` |
| New auth check | `src/deps.py` (FastAPI dependency) |
| New custom error | `src/errors.py` + handler in `src/main.py` |
| New background task | `src/services/<task>.py` invoked by `BackgroundTasks` |
| New CLI script | `src/cli/<command>.py` exposed via `[project.scripts]` in pyproject |
| New external API client | `src/clients/<vendor>.py` (httpx.AsyncClient) |
| New unit test | `tests/unit/test_<thing>.py` |
| New integration test | `tests/integration/test_<thing>.py` |
| New E2E test | `tests/e2e/test_<flow>.py` |
| New migration | `uv run alembic revision --autogenerate -m "..."` |
| New shared util | `src/utils/<thing>.py` (only if used 3+ places) |

---

## 4. Architecture

### Process Boundary

```
┌──────────────────────────────────────────┐
│ Fly Edge (TLS termination, h2/h3)        │
└─────────────────┬────────────────────────┘
                  │ HTTPS
┌─────────────────▼────────────────────────┐
│ Container (1 process, 1 uvicorn)         │
│  ┌──────────────────────────────────┐    │
│  │ FastAPI app                      │    │
│  │  - middleware (logging, CORS)    │    │
│  │  - dependencies (auth, session)  │    │
│  │  - routers → services → repos    │    │
│  └──────────────────────────────────┘    │
└─────────────────┬────────────────────────┘
                  │ asyncpg (TCP, TLS)
┌─────────────────▼────────────────────────┐
│ Postgres 17 (Fly Postgres or external)   │
└──────────────────────────────────────────┘
```

### Request Flow

```
Client ──► Uvicorn ──► CORS mw ──► RequestID mw ──► Logging mw
            │
            └──► Router ──► Depends(get_current_user)
                              │
                              └──► Depends(get_session) (AsyncSession)
                                     │
                                     └──► Service ──► Repository ──► SQLAlchemy
                                                                       │
                                                                       └──► asyncpg ──► Postgres
            ◄──────────── Pydantic response_model ◄────────────
```

### Auth Flow

```
POST /auth/login {email, password}
   │
   ├─ users_repo.get_by_email(email)
   ├─ pwdlib.verify(password, user.hashed_password)  # argon2id
   ├─ jwt.encode({sub: user.id, exp: now+15m}, SECRET_KEY, HS256)
   └─► 200 {access_token, refresh_token, token_type:"bearer"}

GET /users/me  Authorization: Bearer <token>
   │
   ├─ OAuth2PasswordBearer extracts token
   ├─ jwt.decode(token, SECRET_KEY) → {sub: user_id}
   ├─ users_repo.get(user_id) → user
   └─► 200 UserRead
```

### State Flow

Stateless per request. Per-request state lives in:
- `request.state` (RequestID, structlog binding)
- `AsyncSession` (one per request, opened in `get_session`, closed at request end)
- `contextvars` (for structlog field propagation across async tasks)

### Entry Files

| File | Responsibility |
|---|---|
| `src/main.py` | Build FastAPI app, attach middleware, mount routers, install error handlers, lifespan (engine init/dispose) |
| `src/settings.py` | Read env, validate via Pydantic, expose `settings` singleton |
| `src/db.py` | Build `engine`, `async_session_factory`, `Base`, dependency `get_session` |
| `src/logging.py` | Configure structlog + stdlib logging once at boot |
| `src/deps.py` | Reusable FastAPI dependencies (current user, pagination, etc.) |

### Where Business Logic Lives

- **Lives in:** `src/services/` (pure async functions, take `AsyncSession` + dataclass/Pydantic args)
- **Does NOT live in:** routers (HTTP only), repositories (DB only), models (data shape only)

---

## 5. Dev Workflow

### Start Dev Server

```bash
uv run uvicorn src.main:app --reload --host 127.0.0.1 --port 8000
```

`--reload` watches `src/` and restarts on save. It does NOT pick up new dependencies — you must Ctrl-C and re-run after `uv add`.

### Hot Reload Breaks When

- You edit `pyproject.toml` (run `uv sync` then restart)
- You edit `alembic/versions/*.py` (run `uv run alembic upgrade head`)
- You change `Settings` schema (env not re-read; restart)

### Debugger — VS Code / Cursor

`.vscode/launch.json` (full content in §15) provides "FastAPI: src.main" config. Set breakpoints in `src/`, F5 to start.

### Debugger — PyCharm

Run config: module = `uvicorn`, params = `src.main:app --reload`, working dir = repo root, env file = `.env`.

### Inspect at Runtime

- Network: `curl -v` or HTTPie (`http :8000/users/me Authorization:"Bearer $TOKEN"`)
- DB: `docker compose exec db psql -U app -d app` then `\dt`, `SELECT * FROM users;`
- Logs: stdout (JSON, one line per event); pipe through `jq`: `uv run uvicorn ... | jq .`

### Pre-commit Checks

`.pre-commit-config.yaml` (optional but recommended) runs ruff + ty before commit. Without pre-commit, the CI catches it. Local manual:

```bash
uv run ruff format .
uv run ruff check --fix .
uv run ty check src
uv run pytest -q
```

### Branch + Commit Conventions

- `main` is deployable. Feature branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit messages: imperative mood, ≤72 char subject. No need for Conventional Commits unless you want auto-changelog.
- One PR = one feature/fix. Squash-merge into `main`.

---

## 6. Testing & Parallelization

### Locations

- `tests/unit/` — pure functions, no I/O, no DB.
- `tests/integration/` — hits real Postgres via `AsyncSession`.
- `tests/e2e/` — full app via `httpx.AsyncClient` + `ASGITransport`.

### Commands

```bash
uv run pytest                          # all tests
uv run pytest tests/unit               # one folder
uv run pytest tests/e2e/test_auth_flow.py::test_login   # one test
uv run pytest -k "auth and not refresh"                 # by keyword
uv run pytest -x --pdb                 # stop on first failure, drop into debugger
uv run pytest -n auto                  # parallel (pytest-xdist)
uv run pytest --cov=src --cov-report=term-missing
```

### Single Test, Watch Mode

```bash
uv run ptw -- tests/unit               # pytest-watch (add to dev deps)
```

### Mocking Rules

- **Never mock:** the database (use a real Postgres in tests; per-test rollback via savepoint), SQLAlchemy session, FastAPI app.
- **Always mock at the adapter boundary:** outbound HTTP via `respx` (`respx.mock`); message bus / S3 via your own client class swapped in `app.dependency_overrides`.
- **Never use** `unittest.mock.patch('src.services.foo.bar')` to override internals — override at the dependency injection seam instead.

### Coverage

Target ≥ 80% on `src/services` and `src/routers`. Measure:

```bash
uv run pytest --cov=src --cov-fail-under=80
```

### Visual Regression

N/A (API-only).

### Parallelization Patterns for AI Agents

**Safe to parallelize (separate subagents):**
- Scaffold a model + scaffold its router + scaffold its tests (different files).
- Add three independent endpoints in three different routers.
- Write unit tests for three services that do not share fixtures.

**Must be sequential:**
- Anything touching `pyproject.toml` or `uv.lock` (run `uv add` from one agent at a time).
- Anything generating an Alembic revision (`alembic revision` writes to `versions/` with timestamp; concurrent generation can produce duplicate revisions).
- Anything editing `src/main.py` (single mount point for routers/middleware).
- Anything editing `src/db.py` `Base` registration (import order matters for autogenerate).

---

## 7. Logging

### Setup

`src/logging.py`:

```python
import logging
import sys
import structlog
from src.settings import settings

def configure_logging() -> None:
    timestamper = structlog.processors.TimeStamper(fmt="iso", utc=True)
    shared_processors = [
        structlog.contextvars.merge_contextvars,
        structlog.processors.add_log_level,
        structlog.processors.StackInfoRenderer(),
        timestamper,
    ]
    structlog.configure(
        processors=shared_processors + [
            structlog.processors.format_exc_info,
            structlog.processors.JSONRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            logging.DEBUG if settings.debug else logging.INFO
        ),
        cache_logger_on_first_use=True,
    )
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(logging.Formatter("%(message)s"))
    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(logging.INFO)
    # Tame noisy libs
    for noisy in ("uvicorn.access", "sqlalchemy.engine.Engine"):
        logging.getLogger(noisy).setLevel(logging.WARNING)

log = structlog.get_logger()
```

### Levels

- `DEBUG`: dev-only; SQL params, request bodies. Off in prod.
- `INFO`: app boot, request in/out, business events ("user.created").
- `WARNING`: recoverable anomalies (rate limit hit, retry succeeded).
- `ERROR`: caught exception that broke a single request.
- `CRITICAL`: app cannot continue (DB unreachable at boot).

### Required Fields on Every Log Line

`timestamp`, `level`, `event`, `request_id`, `user_id` (when known), `module`. Bind `request_id` and `user_id` via `structlog.contextvars.bind_contextvars` in middleware so they appear on every line in that request.

### Sample Lines

```json
{"event":"app.startup","level":"info","timestamp":"2026-04-27T10:00:00Z"}
{"event":"http.request","level":"info","method":"POST","path":"/auth/login","request_id":"01HXY...","timestamp":"..."}
{"event":"http.response","level":"info","status":200,"duration_ms":42,"request_id":"01HXY...","user_id":"u_123","timestamp":"..."}
{"event":"user.created","level":"info","user_id":"u_124","email_domain":"acme.com","request_id":"01HXY...","timestamp":"..."}
{"event":"slow_query","level":"warning","query":"SELECT * FROM users WHERE ...","duration_ms":850,"timestamp":"..."}
{"event":"unhandled_exception","level":"error","exc_info":"...","request_id":"01HXY...","timestamp":"..."}
```

### Where Logs Go

- **Dev:** stdout, JSON, one line per event. Pretty-print with `| jq .`.
- **Prod (Fly):** stdout → Fly captures → forwards to Sentry (errors) and Logtail/Axiom (all). `fly logs` tails them.

### Grep Locally

```bash
uv run uvicorn src.main:app 2>&1 | jq 'select(.event=="http.response" and .status>=400)'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `uv run ruff check . && uv run ty check src && uv run pytest -q` before declaring a task done.
2. Always declare endpoints with both a `response_model=` and an explicit return type annotation.
3. Always use `async def` for endpoints that touch the DB; never `def` (which runs in a threadpool and breaks `AsyncSession`).
4. Always inject the DB session via `Depends(get_session)`; never construct one inside an endpoint.
5. Always commit `uv.lock` after any `uv add` or `uv lock`.
6. Always create an Alembic revision after editing any `src/models/*.py`: `uv run alembic revision --autogenerate -m "<change>"` and review the diff.
7. Always import every model module in `alembic/env.py` (or via `src.models.__init__`) before reading `Base.metadata`.
8. Always validate inputs with a Pydantic schema (request body, query params, path) — never read raw `dict` from `request.json()`.
9. Always return Pydantic schemas (`UserRead`), not ORM objects (`User`), from endpoints.
10. Always hash passwords with `pwdlib` argon2id; never store plaintext, never use SHA/MD5.
11. Always read secrets from `settings.SECRET_KEY` etc; never hardcode, never `os.environ[...]` outside `settings.py`.
12. Always wrap outbound HTTP in `httpx.AsyncClient` with explicit `timeout=`.
13. Always use `await session.execute(stmt)` + `select()`; never legacy `session.query()`.
14. Always close sessions in the dependency (`yield` then `await session.close()`).
15. Always `await` any `AsyncSession.commit()` / `rollback()` / `flush()` / `execute()`.
16. Always set `pool_pre_ping=True` on the async engine; transient connection drops are common on Fly.
17. Always include a `/healthz` endpoint that pings the DB; Fly uses it.
18. Always run migrations as a release step: `release_command = "alembic upgrade head"` in `fly.toml`.
19. Always pin `python = ">=3.13,<3.14"` in `pyproject.toml` and rely on `uv python install`.
20. Always write tests with `httpx.AsyncClient(transport=ASGITransport(app=app))`; never `TestClient` for async-heavy code.
21. Always use `pytest.mark.asyncio` (or `asyncio_mode=auto`) on async tests.
22. Always rebuild Docker image with `--no-cache` after a Python-version bump in `Dockerfile`.

### 8.2 NEVER

1. Never call a sync function that does I/O inside an `async def` endpoint (e.g., `requests.get`, `time.sleep`, `psycopg2`). Use the async equivalent.
2. Never mix `Session` and `AsyncSession`; the codebase is async-only.
3. Never call `session.commit()` without `await`. Silent no-op.
4. Never return raw ORM objects; lazy-loaded relationships will explode after session close.
5. Never `print()`. Use `structlog.get_logger().info(...)`.
6. Never commit `.env`. It is in `.gitignore`. Use `.env.example` for templates.
7. Never bypass Alembic with `Base.metadata.create_all()` outside of test fixtures.
8. Never run `alembic upgrade head` as a `CMD` in Dockerfile (race condition across replicas). Use Fly `release_command`.
9. Never spawn workers with `uvicorn --workers N` inside Fly. Scale by `fly scale count` instead.
10. Never `eval`, `exec`, or `pickle.loads` user input.
11. Never construct SQL strings with f-string interpolation. Use SQLAlchemy expressions or `text(":param")` with bound params.
12. Never disable SSL (`sslmode=disable`) for the production DB URL.
13. Never expose Sentry DSN, JWT secret, or DB password in logs or error responses.
14. Never use `app.add_middleware` after `app.include_router` for middleware that touches all requests; order matters.
15. Never `import` a router module inside another router (circular). Mount in `src/main.py` only.
16. Never call `asyncio.run()` from inside an async context (e.g., a request handler). Use `await`.
17. Never read `request.body()` twice — Starlette consumes the stream.
18. Never depend on import order to register models; explicitly import all models in `src/models/__init__.py`.
19. Never use `passlib` (deprecated for argon2 in 2026); use `pwdlib`.

### 8.3 Blast Radius

| Path | Blast | Verify |
|---|---|---|
| `pyproject.toml` | every command, every dep | `uv sync && uv run ruff check . && uv run ty check src && uv run pytest -q` |
| `uv.lock` | reproducible builds, CI, Docker | `uv sync --frozen` succeeds; full test run |
| `Dockerfile` | prod runtime | `docker build -t app . && docker run --rm -p 8000:8000 app` then `curl /healthz` |
| `fly.toml` | prod deploy | `fly deploy --build-only`; staging deploy |
| `.github/workflows/ci.yml` | every PR | open dummy PR or `act -j test` |
| `src/main.py` | every request | full E2E run + cold container boot |
| `src/db.py` | every DB call | full integration suite |
| `src/settings.py` | boot | unit tests for Settings; cold container boot |
| `src/logging.py` | every log line | inspect output of one request, ensure JSON valid |
| `alembic/env.py` | all migrations | `alembic upgrade head` then `alembic downgrade -1` then `alembic upgrade head` |
| `alembic.ini` | migrations | `alembic current` returns expected revision |
| `alembic/versions/*.py` | DB schema | `alembic upgrade head` on a fresh DB; downgrade test |
| `src/models/*.py` | schema + queries | autogenerate revision; integration tests |
| `src/schemas/*.py` | API contract | E2E tests; OpenAPI diff |
| `src/routers/*.py` | one endpoint family | E2E tests for that resource |
| `src/services/*.py` | business logic | unit + integration |
| `src/repositories/*.py` | DB access for one model | integration tests |
| `src/security.py` | auth, all protected endpoints | unit tests for hashing + JWT; E2E auth flow |
| `src/deps.py` | every dependency consumer | full E2E |
| `.env.example` | onboarding signal only | none (not loaded at runtime) |
| `docker-compose.yml` | local dev DB | `docker compose up -d db && uv run alembic upgrade head` |
| `ruff.toml` / `[tool.ruff]` | lint output | `uv run ruff check .` |
| `[tool.ty]` | typecheck output | `uv run ty check src` |
| `[tool.pytest.ini_options]` | test discovery | `uv run pytest --collect-only` |
| `.dockerignore` | image size, secrets | `docker build`, inspect image with `docker history` |
| `CLAUDE.md` / `AGENTS.md` / `.cursor/rules` | AI agent behavior | re-read in fresh agent session |

### 8.4 Definition of Done

**Bug fix**
- [ ] Reproducer test added to `tests/`, fails before the fix, passes after.
- [ ] Root cause documented in PR body (1 paragraph).
- [ ] `uv run ruff check . && uv run ty check src && uv run pytest -q` green.
- [ ] No new TODO comments.

**New feature**
- [ ] Pydantic schemas (request + response) defined in `src/schemas/`.
- [ ] Router file in `src/routers/`, mounted in `src/main.py`.
- [ ] Service in `src/services/` (no FastAPI imports).
- [ ] Repository in `src/repositories/` (no business logic).
- [ ] Unit tests for service, integration test for repo, E2E test for endpoint.
- [ ] OpenAPI doc renders at `/docs` with example request/response.
- [ ] `uv run pytest --cov=src` ≥ 80% on changed files.

**Refactor**
- [ ] No behavior change: full test suite green before AND after with no test changes.
- [ ] Public API (router paths, schema fields) unchanged unless documented.

**Dependency bump**
- [ ] `uv lock --upgrade-package <name>`.
- [ ] CHANGELOG of the dep skimmed for breaking changes.
- [ ] Full test run + cold Docker build.

**Schema change**
- [ ] Edit `src/models/*.py`.
- [ ] `uv run alembic revision --autogenerate -m "..."` and **read the generated SQL**.
- [ ] Hand-edit migration if autogenerate is wrong (renames, data migrations).
- [ ] `uv run alembic upgrade head` on local DB.
- [ ] `uv run alembic downgrade -1 && uv run alembic upgrade head` to verify downgrade works.
- [ ] Integration tests pass.

**Copy/text change**
- [ ] If user-facing string in a response: schema example updated.
- [ ] No type or test changes needed; ruff + pytest green.

### 8.5 Self-Verification Recipe

Run before saying "done":

```bash
# 1. Install (idempotent, fast)
uv sync --frozen
# expect: "Resolved N packages" then nothing if up-to-date

# 2. Lint + format
uv run ruff format --check .
uv run ruff check .
# expect: "All checks passed!" or "N files already formatted"

# 3. Typecheck
uv run ty check src
# expect: "Found 0 errors"

# 4. Tests (sequential first to surface fixture errors clearly)
uv run pytest -q
# expect: "N passed in X.YYs"

# 5. Smoke: cold app boot + /healthz
uv run uvicorn src.main:app --port 8001 &
SERVER_PID=$!
sleep 2
curl -fsS http://127.0.0.1:8001/healthz
# expect: {"status":"ok","db":"ok",...}
kill $SERVER_PID

# 6. Migration round-trip (if schema touched)
uv run alembic upgrade head
uv run alembic downgrade -1
uv run alembic upgrade head
# expect: "INFO  [alembic.runtime.migration] Running upgrade ..."
```

### 8.6 Parallelization Patterns

Safe to fan out subagents on:
- One agent per new resource: model + schema + router + service + repo + tests, all in disjoint files.
- One agent per pure-function module under `src/utils/`.

Must serialize:
- `uv add` calls (lockfile).
- `alembic revision` (timestamp collisions).
- Edits to `src/main.py`, `src/db.py`, `src/settings.py`, `src/models/__init__.py`.
- Edits to `pyproject.toml`, `Dockerfile`, `fly.toml`.

---

## 9. Stack-Specific Pitfalls

1. **Sync call inside async endpoint blocks the event loop.** Symptom: throughput collapses under concurrency. Cause: `requests.get(...)` or `time.sleep` in `async def`. Fix: use `httpx.AsyncClient`; for true CPU-bound work use `await asyncio.to_thread(...)`. Detect: `asyncio` debug mode warnings (`PYTHONASYNCIODEBUG=1`).

2. **Forgot to `await` a coroutine.** Symptom: `RuntimeWarning: coroutine 'foo' was never awaited` and the line silently does nothing. Cause: omitted `await`. Fix: add `await`. Detect: ruff rule `RUF006`, ty.

3. **Returning ORM object → `MissingGreenlet` or `DetachedInstanceError`.** Symptom: 500 with cryptic SQLAlchemy traceback after session closes. Cause: lazy-loaded relationship accessed during Pydantic serialization. Fix: convert to a `UserRead` schema inside the endpoint; eager-load with `selectinload(User.posts)`.

4. **Alembic autogenerate is empty.** Symptom: `alembic revision --autogenerate` produces an empty migration. Cause: models not imported before `target_metadata` is read. Fix: in `alembic/env.py`, `from src.models import *` (or import the package which re-exports all models).

5. **Alembic env.py uses sync engine with asyncpg URL.** Symptom: `MissingGreenlet` or `the asyncio engine cannot be used in a synchronous context`. Cause: default env.py is sync. Fix: use the async template (see §16) — `async_engine_from_config` + `connection.run_sync(do_migrations)`.

6. **`.env` committed to git.** Symptom: secret leaked. Cause: missing `.gitignore` entry. Fix: rotate secret, `git filter-repo` to scrub history, add to `.gitignore`. Detect: `gitleaks` in CI.

7. **Pydantic v1 patterns in v2 code.** Symptom: `ValidationError` complaining about deprecated `Config` class. Cause: copying old tutorials. Fix: use `model_config = ConfigDict(...)`; replace `.dict()` with `.model_dump()`; `.parse_obj()` → `.model_validate()`.

8. **Settings re-instantiated per request.** Symptom: slow boot per request, env reread. Cause: `Settings()` called in dependency. Fix: instantiate once at module load (`settings = Settings()` in `src/settings.py`); use `lru_cache` if you must.

9. **DB pool exhausted.** Symptom: `TimeoutError: QueuePool limit of size 5 overflow 10 reached`. Cause: forgetting to close sessions, or using `async_sessionmaker` with `expire_on_commit=True` without re-querying. Fix: ensure dependency `yield`s and the cleanup runs; raise `pool_size` if legitimately needed.

10. **Migration race on multi-replica deploy.** Symptom: two containers run `alembic upgrade head` simultaneously, second crashes. Fix: use Fly `release_command = "alembic upgrade head"` — runs once before rollout.

11. **JWT secret rotated → all sessions bricked.** Symptom: every request returns 401 after deploy. Cause: `SECRET_KEY` changed. Fix: support a list of decoding keys (current + previous) for a 1-week overlap window.

12. **CORS misconfig blocks frontend.** Symptom: browser console "blocked by CORS policy". Cause: `allow_origins=["*"]` plus `allow_credentials=True` is invalid per spec. Fix: list exact origins.

13. **Returning bare `dict` skips response_model validation.** Symptom: API returns a field you forgot to redact. Cause: endpoint returns `{"user": user.__dict__}`. Fix: declare `response_model=UserRead`; the framework filters fields.

14. **`uv.lock` not committed → CI installs different versions.** Symptom: tests pass locally, fail in CI. Fix: commit `uv.lock`; CI runs `uv sync --frozen`.

15. **Background task captures request-scoped session.** Symptom: `MissingGreenlet` in a `BackgroundTasks` callback. Cause: passing the request's `AsyncSession` into the background. Fix: in the background function, open a fresh session via `async_session_factory()`.

16. **`Depends(get_current_user)` runs even on public endpoints.** Symptom: `/healthz` requires auth. Cause: dependency declared on the router or app level. Fix: declare auth dependency per-endpoint or via a sub-router.

17. **Pydantic `model_dump(mode="json")` vs `.json()`.** Symptom: `datetime` not serialized. Fix: `mode="json"` for transport; default mode keeps Python types.

18. **Forgetting `--reload-dir src` causes reload storms** when `uv` writes to `.venv`. Fix: `uvicorn --reload --reload-dir src`.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (container boot to first 200) | ≤ 2 s | `time docker run --rm app uvicorn ...` then loop `curl /healthz` |
| P50 latency `/healthz` | ≤ 5 ms | `hey -n 1000 -c 50 http://localhost:8000/healthz` |
| P95 latency typical CRUD | ≤ 100 ms | `hey -n 1000 -c 50 -H "Authorization: Bearer ..." ...` |
| Memory (idle) | ≤ 150 MB RSS | `docker stats` or Fly metrics |
| Memory (under 100 RPS) | ≤ 350 MB | same |
| DB pool size | 5 + overflow 10 | configured in `src/db.py` |
| Image size | ≤ 250 MB compressed | `docker images app:latest` |

**When budget exceeded:** profile with `py-spy record -o profile.svg -- uv run uvicorn ...`; check for sync calls in async paths; check N+1 with SQLAlchemy `echo=True` in dev.

---

## 11. Security

### Secret Storage

- **Local dev:** `.env` (gitignored). `.env.example` (committed, has every key, blank values).
- **Prod:** `fly secrets set NAME=value` (encrypted at rest, injected as env vars).
- **NEVER in:** code, logs, error messages, `pyproject.toml`, comments, screenshots.

### Auth Threat Model

- Public: `/healthz`, `/auth/login`, `/auth/register`, `/auth/refresh`, `/docs` (toggle off in prod).
- Authenticated: all `/users/me`, `/<resource>/...`. JWT in `Authorization: Bearer ...`.
- Admin: scope `admin` claim; check via `Depends(require_scope("admin"))`.
- Tokens: access 15 min, refresh 7 days. Refresh rotation: each `/auth/refresh` issues a new refresh token and invalidates the old one (server-side `revoked_tokens` table or `jti` blacklist).

### Input Validation

- Boundary: every endpoint has Pydantic models on body, query, path. Anything that does not deserialize → 422 automatically.
- File uploads: validate size (`UploadFile.size` after read) and MIME type (sniff, do not trust `content_type`).

### Output Escaping

- API is JSON. Pydantic + `response_model=` is your escape layer.
- Never reflect user input in a string-rendered HTML response. If you need HTML, use Jinja2 with autoescape (out of scope here).

### Permissions / Capabilities

- Postgres: app user has `CONNECT`, `USAGE` on schema `public`, `ALL` on app tables only. Migrations may need a separate user with `CREATE`.
- Fly: keep org SSO on; require 2FA.

### Dependency Audit

```bash
uv pip list --outdated
uv run pip-audit            # add pip-audit to dev deps
```

Run weekly + on every Dependabot PR.

### Top 5 Risks

1. **JWT secret in env file committed** → instant takeover. Mitigation: gitignore + gitleaks in CI + `fly secrets`.
2. **SQL injection via raw SQL with f-strings** → DB read/write. Mitigation: SQLAlchemy expressions or bound params; ban `text(f"...")` via ruff `S608`.
3. **Pickle/`yaml.load` on user input** → RCE. Mitigation: never accept these; only `json.loads`.
4. **CORS `*` + credentials** → CSRF on auth'd endpoints. Mitigation: explicit origins.
5. **Open `/docs` in prod** → API surface enumeration. Mitigation: `app = FastAPI(docs_url=None if settings.env=="prod" else "/docs")`.

---

## 12. Deploy

### Full Release Flow

```bash
# 1. local: green checks
uv run ruff check . && uv run ty check src && uv run pytest -q

# 2. push
git push origin main

# 3. CI (GitHub Actions) runs same checks; fails fast
# 4. on green main:
fly deploy
# Fly: builds image (cached layers), runs release_command (alembic upgrade head),
# rolls out N replicas with health check on /healthz, switches traffic.

# 5. verify
fly status
curl https://<app>.fly.dev/healthz
fly logs --tail
```

### Staging vs Prod

Two Fly apps: `myapp-staging` and `myapp-prod`. Two `fly.toml` files (`fly.staging.toml`, `fly.toml`) or one toml plus `fly deploy --config fly.staging.toml`. Separate Postgres clusters; separate Sentry projects.

### Rollback

```bash
fly releases                     # list, find the previous good v#
fly releases rollback <version>  # atomic switch back
```

Safe rollback window: as long as the previous image version is still in the registry (Fly keeps 10 by default) AND the DB schema is still compatible. **A migration that drops a column blocks rollback** — use the expand/contract pattern: deploy migration that adds the new column, deploy code that uses it, deploy migration that drops the old.

### Health Check

`GET /healthz` returns `{"status":"ok","db":"ok","version":"<git-sha>"}` after pinging Postgres with `SELECT 1`. Fly polls every 10 s.

### Versioning

Single source: `[project] version = "0.1.0"` in `pyproject.toml`. Tag releases: `git tag v0.1.0 && git push --tags`. Inject git SHA into image at build time as `APP_VERSION` env var.

### Cost Estimate (per 1k MAU)

Fly: 1 shared-cpu-1x + 256 MB RAM + 1 GB Postgres ≈ $5–8/month base; ~$0.01 per 1k requests at the small scale typical of MVP. 1k MAU at 100 req/user/month = 100k req ≈ < $10/mo total.

### DNS

```bash
fly certs add api.example.com
# add the CNAME / A records Fly prints
fly certs check api.example.com   # waits for TLS provisioning
```

---

## 13. Claude Code Integration

### `CLAUDE.md`

```md
# Claude Code Instructions

This project follows `rulebooks/fastapi-postgres.md` (FastAPI + Postgres rulebook).
Read it before generating code. The decisions there are final.

## Quick commands
- Install deps: `uv sync`
- Run dev server: `uv run uvicorn src.main:app --reload`
- Run tests: `uv run pytest -q`
- Lint + format: `uv run ruff format . && uv run ruff check --fix .`
- Typecheck: `uv run ty check src`
- New migration: `uv run alembic revision --autogenerate -m "<msg>"`
- Apply migrations: `uv run alembic upgrade head`
- Deploy: `fly deploy`

## Banned patterns
- `from sqlalchemy.orm import Session` — use `AsyncSession` from `sqlalchemy.ext.asyncio`.
- `requests.` — use `httpx.AsyncClient`.
- `print(` — use `structlog.get_logger().info(...)`.
- `os.environ[` outside `src/settings.py`.
- `passlib` — use `pwdlib`.
- Returning ORM models from endpoints — use Pydantic schemas.
- `def` (sync) endpoints when DB is touched — use `async def`.

## Definition of done
Run §8.5 self-verification recipe. All checks must pass.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(uv:*)",
      "Bash(uv run pytest:*)",
      "Bash(uv run ruff:*)",
      "Bash(uv run ty:*)",
      "Bash(uv run alembic:*)",
      "Bash(uv run uvicorn:*)",
      "Bash(uv sync)",
      "Bash(uv lock)",
      "Bash(uv add:*)",
      "Bash(uv remove:*)",
      "Bash(docker compose up:*)",
      "Bash(docker compose down)",
      "Bash(docker compose ps)",
      "Bash(docker compose logs:*)",
      "Bash(docker compose exec db:*)",
      "Bash(curl:*)",
      "Bash(fly status)",
      "Bash(fly logs:*)",
      "Bash(fly releases)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(jq:*)"
    ],
    "deny": [
      "Bash(fly deploy:*)",
      "Bash(fly secrets set:*)",
      "Bash(fly postgres:*)",
      "Bash(rm -rf:*)",
      "Bash(git push --force:*)",
      "Bash(git reset --hard:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "uv run ruff format $CLAUDE_FILE_PATHS 2>/dev/null || true"}
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "uv run ruff check --quiet . && uv run ty check src 2>&1 | tail -5"}
        ]
      }
    ]
  }
}
```

### Skills to invoke

- `/test-driven-development` — before any new feature.
- `/systematic-debugging` — before any bug fix.
- `/verification-before-completion` — before claiming done; runs §8.5.
- `/ship` — when CI green, ready to merge to main.
- `/security-review` — before public-facing changes.

### Slash command shortcuts (project-specific)

Drop into `.claude/commands/`:

- `migrate.md`: "Run `uv run alembic revision --autogenerate -m \"$ARGUMENTS\"` then show the diff."
- `addroute.md`: "Scaffold router + schema + service + repo + tests for resource $ARGUMENTS following §3 layout."

---

## 14. Codex Integration

### `AGENTS.md`

```md
# Codex Agent Rules

Read `rulebooks/fastapi-postgres.md`. It is the source of truth.

## Run commands (must use `uv run` prefix)
- Lint: `uv run ruff check .`
- Format: `uv run ruff format .`
- Typecheck: `uv run ty check src`
- Test: `uv run pytest -q`
- Dev server: `uv run uvicorn src.main:app --reload`
- Migrate: `uv run alembic upgrade head`

## Style
- Async by default. Sync code only inside CPU-bound helpers, called via `asyncio.to_thread`.
- Pydantic schemas at every boundary. ORM models stay in `src/models/`.
- One responsibility per file. Routers don't query the DB; services don't talk HTTP.

## Definition of done
- `uv run ruff check . && uv run ty check src && uv run pytest -q` all green.
- Manual smoke: `curl http://localhost:8000/healthz` returns 200.
```

### `.codex/config.toml`

```toml
model = "gpt-5"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[shell]
prefix_required = "uv run"

[sandbox.workspace_write]
network_access = false
allow_git_writes = false
```

### Where Codex differs

- Codex is more eager to run shell commands without confirmation; the deny list (matching Claude's) goes in `.codex/config.toml` `[sandbox] denied = [...]`.
- Codex respects `AGENTS.md`; Claude reads `CLAUDE.md`. Keep both.
- Codex does not auto-format on edit. Run `uv run ruff format .` at session end.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
You are working on a FastAPI + Postgres + uv project. Follow rulebooks/fastapi-postgres.md.

ALWAYS:
- Use `async def` for endpoints that touch the DB.
- Use `AsyncSession` from `sqlalchemy.ext.asyncio`, never `Session`.
- Inject DB via `Depends(get_session)`.
- Validate inputs with Pydantic schemas; return Pydantic schemas (not ORM objects).
- Use `httpx.AsyncClient` for outbound HTTP.
- Use `structlog.get_logger()` for logs; never `print`.
- Hash passwords with `pwdlib` argon2id.
- After model edits: `uv run alembic revision --autogenerate -m "..."`, then review.
- Run `uv run ruff check . && uv run ty check src && uv run pytest -q` before declaring done.

NEVER:
- `requests.`, `urllib.request`, or any sync HTTP in async code.
- `from sqlalchemy.orm import Session`.
- Forget to `await` SQLAlchemy / httpx coroutines.
- Return ORM objects from endpoints.
- Hardcode secrets; read from `src.settings.settings`.
- Run migrations as Docker `CMD`; use Fly `release_command`.
- Use `passlib`; it is replaced by `pwdlib`.
- Use `unittest.mock.patch` to override internals; override at FastAPI `dependency_overrides`.

Project layout: `src/{routers,services,repositories,models,schemas,deps.py,db.py,main.py,settings.py,security.py,logging.py,errors.py}`. Tests under `tests/{unit,integration,e2e}`. Migrations under `alembic/versions/`.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "charliermarsh.ruff",
    "ms-python.python",
    "ms-python.vscode-pylance",
    "astral-sh.ty",
    "tamasfe.even-better-toml",
    "ms-azuretools.vscode-docker",
    "redhat.vscode-yaml"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "FastAPI: src.main",
      "type": "debugpy",
      "request": "launch",
      "module": "uvicorn",
      "args": ["src.main:app", "--reload", "--port", "8000"],
      "envFile": "${workspaceFolder}/.env",
      "jinja": true,
      "justMyCode": false
    },
    {
      "name": "Pytest: current file",
      "type": "debugpy",
      "request": "launch",
      "module": "pytest",
      "args": ["${file}", "-q"],
      "envFile": "${workspaceFolder}/.env"
    }
  ]
}
```

### `.vscode/settings.json`

```json
{
  "python.defaultInterpreterPath": ".venv/bin/python",
  "python.testing.pytestEnabled": true,
  "python.testing.pytestArgs": ["tests"],
  "[python]": {
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {"source.organizeImports.ruff": "explicit"}
  }
}
```

---

## 16. First-PR Scaffold

Create files in this order. After the last file, `git add . && git commit -m "init" && git push` produces a deployable hello-world.

### 1. `.gitignore`

```
.venv/
__pycache__/
*.pyc
.env
.env.*
!.env.example
.coverage
.pytest_cache/
.ruff_cache/
.ty_cache/
htmlcov/
dist/
build/
*.egg-info/
.DS_Store
```

### 2. `.dockerignore`

```
.venv
.git
.github
.vscode
.cursor
.claude
tests
*.md
.env
.env.*
!.env.example
.pytest_cache
.ruff_cache
.ty_cache
__pycache__
docker-compose.yml
fly.toml
```

### 3. `.env.example`

```
# Copy to .env and fill values. Generate SECRET_KEY: openssl rand -hex 32
ENV=dev
DEBUG=true
SECRET_KEY=changeme-generate-with-openssl-rand-hex-32
DATABASE_URL=postgresql+asyncpg://app:app@localhost:5432/app
JWT_ALGORITHM=HS256
JWT_ACCESS_TTL_MINUTES=15
JWT_REFRESH_TTL_DAYS=7
SENTRY_DSN=
LOG_LEVEL=INFO
CORS_ORIGINS=http://localhost:3000
```

### 4. `pyproject.toml`

```toml
[project]
name = "myapp"
version = "0.1.0"
description = "FastAPI + Postgres service"
requires-python = ">=3.13,<3.14"
dependencies = [
  "fastapi==0.136.1",
  "uvicorn[standard]>=0.34,<0.35",
  "sqlalchemy[asyncio]>=2.0.49,<2.1",
  "asyncpg>=0.30,<0.31",
  "alembic>=1.18.4,<2",
  "pydantic>=2.13.3,<3",
  "pydantic-settings>=2.14,<3",
  "structlog>=25.5,<26",
  "python-jose[cryptography]>=3.3,<4",
  "pwdlib[argon2]>=0.2,<1",
  "httpx>=0.28,<0.29",
  "sentry-sdk[fastapi]>=2.58,<3",
]

[dependency-groups]
dev = [
  "pytest>=8,<9",
  "pytest-asyncio>=0.25,<1",
  "pytest-cov>=5,<7",
  "pytest-xdist>=3.6,<4",
  "respx>=0.21,<1",
  "ruff>=0.13,<0.14",
  "ty>=0.0.1a0",
  "pre-commit>=3.7,<5",
]

[build-system]
requires = ["uv_build>=0.7,<0.8"]
build-backend = "uv_build"

[tool.uv]
package = true

[tool.ruff]
line-length = 100
target-version = "py313"
src = ["src", "tests"]

[tool.ruff.lint]
select = ["E", "F", "I", "B", "UP", "S", "ASYNC", "RUF", "SIM"]
ignore = ["S101"]   # allow assert in tests

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S105", "S106"]
"alembic/versions/*" = ["E501"]

[tool.ty]
src = ["src"]

[tool.pytest.ini_options]
testpaths = ["tests"]
asyncio_mode = "auto"
addopts = "-q --strict-markers"
markers = [
  "integration: hits the real database",
  "e2e: end-to-end via httpx ASGI transport",
]
```

> Run `uv sync` to materialize `uv.lock`. **Commit `uv.lock`.** CI uses `uv sync --frozen`.

### 5. `src/__init__.py`

```python
```

### 6. `src/settings.py`

```python
from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    env: str = Field("dev")
    debug: bool = Field(False)
    secret_key: SecretStr
    database_url: str
    jwt_algorithm: str = "HS256"
    jwt_access_ttl_minutes: int = 15
    jwt_refresh_ttl_days: int = 7
    sentry_dsn: str | None = None
    log_level: str = "INFO"
    cors_origins: str = ""

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()  # validated once at import; fails fast on bad env
```

### 7. `src/logging.py`

(see §7)

### 8. `src/db.py`

```python
from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from src.settings import settings


class Base(DeclarativeBase):
    pass


engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)

async_session_factory = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


async def get_session() -> AsyncIterator[AsyncSession]:
    async with async_session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        else:
            await session.commit()
```

### 9. `src/security.py`

```python
from datetime import UTC, datetime, timedelta

from jose import JWTError, jwt
from pwdlib import PasswordHash

from src.settings import settings

_pwd = PasswordHash.recommended()  # argon2id


def hash_password(plain: str) -> str:
    return _pwd.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return _pwd.verify(plain, hashed)


def create_access_token(subject: str, scopes: list[str] | None = None) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": subject,
        "iat": int(now.timestamp()),
        "exp": int((now + timedelta(minutes=settings.jwt_access_ttl_minutes)).timestamp()),
        "scopes": scopes or [],
    }
    return jwt.encode(payload, settings.secret_key.get_secret_value(), algorithm=settings.jwt_algorithm)


def decode_token(token: str) -> dict:
    try:
        return jwt.decode(token, settings.secret_key.get_secret_value(), algorithms=[settings.jwt_algorithm])
    except JWTError as e:
        raise ValueError("invalid token") from e
```

### 10. `src/models/__init__.py`

```python
from src.models.user import User  # noqa: F401  (registers with Base.metadata)
```

### 11. `src/models/user.py`

```python
from datetime import datetime

from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from src.db import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(server_default=func.now())
```

### 12. `src/schemas/user.py`

```python
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr


class UserCreate(BaseModel):
    email: EmailStr
    password: str


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    is_active: bool
    created_at: datetime


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
```

### 13. `src/repositories/user_repo.py`

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    res = await session.execute(select(User).where(User.email == email))
    return res.scalar_one_or_none()


async def get(session: AsyncSession, user_id: int) -> User | None:
    return await session.get(User, user_id)


async def create(session: AsyncSession, *, email: str, hashed_password: str) -> User:
    user = User(email=email, hashed_password=hashed_password)
    session.add(user)
    await session.flush()
    return user
```

### 14. `src/services/user_service.py`

```python
from sqlalchemy.ext.asyncio import AsyncSession

from src.models.user import User
from src.repositories import user_repo
from src.security import hash_password, verify_password


class UserExists(Exception):
    pass


async def register(session: AsyncSession, email: str, password: str) -> User:
    if await user_repo.get_by_email(session, email):
        raise UserExists()
    return await user_repo.create(session, email=email, hashed_password=hash_password(password))


async def authenticate(session: AsyncSession, email: str, password: str) -> User | None:
    user = await user_repo.get_by_email(session, email)
    if user and verify_password(password, user.hashed_password):
        return user
    return None
```

### 15. `src/deps.py`

```python
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.models.user import User
from src.repositories import user_repo
from src.security import decode_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: AsyncSession = Depends(get_session),
) -> User:
    try:
        payload = decode_token(token)
        user_id = int(payload["sub"])
    except (ValueError, KeyError) as e:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "invalid token") from e
    user = await user_repo.get(session, user_id)
    if not user or not user.is_active:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "user not found or inactive")
    return user
```

### 16. `src/routers/health.py`

```python
from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session

router = APIRouter(tags=["health"])


@router.get("/healthz")
async def healthz(session: AsyncSession = Depends(get_session)) -> dict:
    await session.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok", "version": "0.1.0"}
```

### 17. `src/routers/auth.py`

```python
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.ext.asyncio import AsyncSession

from src.db import get_session
from src.schemas.user import Token, UserCreate, UserRead
from src.security import create_access_token
from src.services.user_service import UserExists, authenticate, register

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_user(payload: UserCreate, session: AsyncSession = Depends(get_session)) -> UserRead:
    try:
        user = await register(session, payload.email, payload.password)
    except UserExists as e:
        raise HTTPException(status.HTTP_409_CONFLICT, "email taken") from e
    return UserRead.model_validate(user)


@router.post("/login", response_model=Token)
async def login(form: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)) -> Token:
    user = await authenticate(session, form.username, form.password)
    if not user:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "bad credentials")
    return Token(access_token=create_access_token(str(user.id)))
```

### 18. `src/routers/users.py`

```python
from fastapi import APIRouter, Depends

from src.deps import get_current_user
from src.models.user import User
from src.schemas.user import UserRead

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserRead)
async def me(user: User = Depends(get_current_user)) -> UserRead:
    return UserRead.model_validate(user)
```

### 19. `src/main.py`

```python
from contextlib import asynccontextmanager

import sentry_sdk
import structlog
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from sentry_sdk.integrations.fastapi import FastApiIntegration
from starlette.middleware.base import BaseHTTPMiddleware
from ulid import new as new_ulid  # use `python-ulid` if you want strict; or stdlib uuid4

from src.db import engine
from src.logging import configure_logging
from src.routers import auth, health, users
from src.settings import settings

configure_logging()
log = structlog.get_logger()

if settings.sentry_dsn:
    sentry_sdk.init(dsn=settings.sentry_dsn, integrations=[FastApiIntegration()], traces_sample_rate=0.1)


@asynccontextmanager
async def lifespan(_: FastAPI):
    log.info("app.startup")
    yield
    await engine.dispose()
    log.info("app.shutdown")


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        rid = request.headers.get("x-request-id") or str(new_ulid())
        structlog.contextvars.bind_contextvars(request_id=rid, path=request.url.path, method=request.method)
        try:
            response = await call_next(request)
            log.info("http.response", status=response.status_code)
            response.headers["x-request-id"] = rid
            return response
        finally:
            structlog.contextvars.clear_contextvars()


app = FastAPI(
    title="myapp",
    version="0.1.0",
    docs_url=None if settings.env == "prod" else "/docs",
    redoc_url=None,
    lifespan=lifespan,
)
app.add_middleware(RequestContextMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(health.router)
app.include_router(auth.router)
app.include_router(users.router)
```

> If you don't want a ULID dep, replace `new_ulid()` with `uuid.uuid4().hex`.

### 20. `alembic.ini`

```ini
[alembic]
script_location = alembic
sqlalchemy.url =
file_template = %%(year)d%%(month).2d%%(day).2d_%%(hour).2d%%(minute).2d_%%(rev)s_%%(slug)s
prepend_sys_path = .

[loggers]
keys = root,sqlalchemy,alembic

[handlers]
keys = console

[formatters]
keys = generic

[logger_root]
level = WARN
handlers = console
qualname =

[logger_sqlalchemy]
level = WARN
handlers =
qualname = sqlalchemy.engine

[logger_alembic]
level = INFO
handlers =
qualname = alembic

[handler_console]
class = StreamHandler
args = (sys.stderr,)
level = NOTSET
formatter = generic

[formatter_generic]
format = %(levelname)-5.5s [%(name)s] %(message)s
datefmt = %H:%M:%S
```

### 21. `alembic/env.py` (async-aware — REPLACE the default)

```python
import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config

from src.db import Base
from src.models import *  # noqa: F401,F403  registers all models
from src.settings import settings

config = context.config
config.set_main_option("sqlalchemy.url", settings.database_url)
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def do_run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, compare_type=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)
    await connectable.dispose()


def run_migrations_online() -> None:
    asyncio.run(run_async_migrations())


def run_migrations_offline() -> None:
    context.configure(url=settings.database_url, target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
```

### 22. `alembic/script.py.mako`

(use the default that `alembic init -t async alembic` produces; commit it as-is)

### 23. First migration

```bash
uv run alembic revision --autogenerate -m "initial"
# review alembic/versions/*_initial.py
uv run alembic upgrade head
```

### 24. `docker-compose.yml` (local dev only)

```yaml
services:
  db:
    image: postgres:17-alpine
    environment:
      POSTGRES_USER: app
      POSTGRES_PASSWORD: app
      POSTGRES_DB: app
    ports: ["5432:5432"]
    volumes: [pgdata:/var/lib/postgresql/data]
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "app"]
      interval: 5s
      timeout: 5s
      retries: 5
volumes:
  pgdata:
```

### 25. `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.7
FROM ghcr.io/astral-sh/uv:0.7-python3.13-bookworm-slim AS builder

ENV UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_PROJECT_ENVIRONMENT=/app/.venv

WORKDIR /app

# 1. install deps without project (cached layer)
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-install-project --no-dev

# 2. install project
COPY src ./src
COPY alembic ./alembic
COPY alembic.ini ./
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

# ---- runtime ----
FROM python:3.13-slim-bookworm AS runtime

ENV PATH=/app/.venv/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

RUN useradd --system --create-home --uid 1000 app
WORKDIR /app
COPY --from=builder --chown=app:app /app /app
USER app

EXPOSE 8000
CMD ["uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 26. `fly.toml`

```toml
app = "myapp"
primary_region = "iad"

[build]

[deploy]
release_command = "alembic upgrade head"

[env]
ENV = "prod"
LOG_LEVEL = "INFO"

[http_service]
internal_port = 8000
force_https = true
auto_stop_machines = "stop"
auto_start_machines = true
min_machines_running = 1

[[http_service.checks]]
interval = "10s"
timeout = "2s"
grace_period = "5s"
method = "GET"
path = "/healthz"

[[vm]]
size = "shared-cpu-1x"
memory = "512mb"
```

Set secrets:

```bash
fly secrets set \
  SECRET_KEY=$(openssl rand -hex 32) \
  DATABASE_URL=postgres+asyncpg://... \
  SENTRY_DSN=https://...
```

### 27. `tests/conftest.py`

```python
import asyncio
from collections.abc import AsyncIterator

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.db import Base, get_session
from src.main import app
from src.settings import settings

TEST_DB_URL = settings.database_url + "_test"


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(scope="session")
async def engine():
    eng = create_async_engine(TEST_DB_URL, pool_pre_ping=True)
    async with eng.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield eng
    await eng.dispose()


@pytest_asyncio.fixture
async def session(engine) -> AsyncIterator[AsyncSession]:
    factory = async_sessionmaker(engine, expire_on_commit=False)
    async with factory() as s:
        yield s
        await s.rollback()


@pytest_asyncio.fixture
async def client(session) -> AsyncIterator[AsyncClient]:
    async def _override():
        yield session
    app.dependency_overrides[get_session] = _override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
```

### 28. `tests/test_health.py`

```python
async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "ok"
```

### 29. `.github/workflows/ci.yml`

```yaml
name: ci
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_USER: app
          POSTGRES_PASSWORD: app
          POSTGRES_DB: app
        ports: ["5432:5432"]
        options: >-
          --health-cmd "pg_isready -U app"
          --health-interval 5s --health-timeout 5s --health-retries 10
    env:
      DATABASE_URL: postgresql+asyncpg://app:app@localhost:5432/app
      SECRET_KEY: ci-test-secret-not-real
      ENV: test
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v5
        with:
          version: "0.7.x"
          enable-cache: true
      - run: uv python install 3.13.13
      - run: uv sync --frozen
      - run: uv run ruff format --check .
      - run: uv run ruff check .
      - run: uv run ty check src
      - run: uv run alembic upgrade head
      - run: uv run pytest -q --cov=src --cov-fail-under=80

  deploy:
    needs: test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@master
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### 30. `README.md` (stub)

```md
# myapp

FastAPI + Postgres service. See `rulebooks/fastapi-postgres.md` for all decisions.

## Setup
1. Install uv: `curl -LsSf https://astral.sh/uv/install.sh | sh`
2. `uv sync && cp .env.example .env`  (fill `SECRET_KEY`)
3. `docker compose up -d db && uv run alembic upgrade head`
4. `uv run uvicorn src.main:app --reload`

## Test
`uv run pytest -q`

## Deploy
`fly deploy`
```

### 31. `LICENSE`

MIT (or your choice). Generate with `gh repo create --license mit` or paste the SPDX template.

---

## 17. Idea → MVP Path

Generic CRUD path (PROJECT_IDEA blank). Estimated AI sessions = focused conversations.

### Phase 1: Schema (1 session)
- Files: `src/models/<entity>.py`, `src/schemas/<entity>.py`, `alembic/versions/*`.
- Exit: `alembic upgrade head` succeeds; `select(Entity).execute()` works in `psql`.

### Phase 2: Backbone (1 session)
- Files: `src/routers/<entity>.py`, mount in `src/main.py`, `src/repositories/<entity>_repo.py`.
- Exit: `GET /<entity>` returns `[]`, `POST` creates a row visible in `psql`.

### Phase 3: Vertical slice (2 sessions)
- One full feature: list + create + get + update + delete with auth, pagination, validation.
- Files: service module, full CRUD endpoints, tests at all 3 levels.
- Exit: E2E test creates → reads → updates → deletes via `client`.

### Phase 4: Auth + multi-user (1 session)
- Already scaffolded in §16. Add `owner_id` FK to entity; filter queries by current user.
- Exit: user A cannot see user B's rows. Test enforces.

### Phase 5: Ship + monitor (1 session)
- `fly launch` (skip if app exists), `fly secrets set ...`, `fly deploy`.
- Sentry DSN wired; one fake error verifies it.
- `/healthz` smoke from production domain.
- Exit: production URL serves the API; Sentry shows the test error.

---

## 18. Feature Recipes

### 18.1 Email + password auth (already in §16)

§16 ships this. Add OAuth (Google) by adding `httpx-oauth` dep, an `/auth/google` redirect endpoint, and a `google_id` column on `users`.

### 18.2 File upload + storage (S3-compatible)

```python
# src/routers/files.py
from fastapi import APIRouter, Depends, UploadFile, HTTPException
import aioboto3  # add: uv add aioboto3
from src.deps import get_current_user
from src.settings import settings

router = APIRouter(prefix="/files", tags=["files"])
MAX_BYTES = 10 * 1024 * 1024  # 10 MB

@router.post("")
async def upload(file: UploadFile, user=Depends(get_current_user)):
    body = await file.read()
    if len(body) > MAX_BYTES:
        raise HTTPException(413, "too large")
    session = aioboto3.Session()
    async with session.client("s3", endpoint_url=settings.s3_endpoint) as s3:
        key = f"{user.id}/{file.filename}"
        await s3.put_object(Bucket=settings.s3_bucket, Key=key, Body=body, ContentType=file.content_type)
    return {"key": key}
```

Add `S3_ENDPOINT`, `S3_BUCKET`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` to settings.

### 18.3 Stripe payments

```python
# uv add stripe
# src/routers/billing.py
import stripe
from fastapi import APIRouter, Depends, Header, HTTPException, Request
from src.deps import get_current_user
from src.settings import settings

stripe.api_key = settings.stripe_secret_key.get_secret_value()
router = APIRouter(prefix="/billing", tags=["billing"])

@router.post("/checkout")
async def checkout(user=Depends(get_current_user)):
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        success_url="https://app.example.com/success",
        cancel_url="https://app.example.com/cancel",
        client_reference_id=str(user.id),
    )
    return {"url": session.url}

@router.post("/webhook")
async def webhook(request: Request, stripe_signature: str = Header(...)):
    payload = await request.body()
    try:
        event = stripe.Webhook.construct_event(payload, stripe_signature, settings.stripe_webhook_secret.get_secret_value())
    except (ValueError, stripe.error.SignatureVerificationError) as e:
        raise HTTPException(400, "bad signature") from e
    # handle event.type in a service
    return {"received": True}
```

### 18.4 Push notifications

Use APNs/FCM provider directly (e.g., `aioapns`, `firebase-admin`). Stub:

```python
# src/services/push.py
async def send_push(token: str, title: str, body: str) -> None:
    # call provider; no return value
    ...
```

### 18.5 Background jobs / cron

Built-in: FastAPI `BackgroundTasks` for fire-and-forget within a request.

For real cron: `apscheduler` AsyncIO scheduler, started in `lifespan`.

```python
# src/jobs.py
from apscheduler.schedulers.asyncio import AsyncIOScheduler

scheduler = AsyncIOScheduler()

async def start_scheduler():
    scheduler.add_job(daily_cleanup, "cron", hour=3)
    scheduler.start()

async def daily_cleanup() -> None:
    ...
```

For heavy/durable jobs: separate `worker` process running `arq` or `dramatiq`. Add a second Fly process group in `fly.toml`.

### 18.6 Realtime (WebSockets)

```python
# src/routers/ws.py
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
router = APIRouter()

@router.websocket("/ws")
async def ws(socket: WebSocket):
    await socket.accept()
    try:
        while True:
            data = await socket.receive_text()
            await socket.send_text(f"echo:{data}")
    except WebSocketDisconnect:
        return
```

For pub/sub across replicas, use Redis channels (`redis.asyncio`).

### 18.7 Search

For a few thousand rows: Postgres `tsvector` + GIN index.

```python
# migration
op.execute("ALTER TABLE posts ADD COLUMN tsv tsvector GENERATED ALWAYS AS (to_tsvector('english', title || ' ' || body)) STORED")
op.create_index("ix_posts_tsv", "posts", ["tsv"], postgresql_using="gin")
```

```python
# repo
from sqlalchemy import func, select
stmt = select(Post).where(Post.tsv.op("@@")(func.plainto_tsquery("english", q)))
```

### 18.8 i18n

Out of scope for an API (UI concern). For server-rendered errors, use `babel` + `Accept-Language` header.

### 18.9 Dark mode

N/A — API only.

### 18.10 Analytics events

```python
# src/services/analytics.py
import structlog
log = structlog.get_logger()

async def track(event: str, user_id: int | None = None, **props) -> None:
    log.info("analytics.event", event=event, user_id=user_id, **props)
```

Forward stdout to Logtail/Axiom; build queries there. For richer needs: PostHog Python client.

---

## 19. Troubleshooting

| Error / Symptom | Fix |
|---|---|
| `connection refused` to localhost:5432 | `docker compose up -d db` |
| `password authentication failed` | DATABASE_URL doesn't match docker-compose creds |
| `relation "users" does not exist` | `uv run alembic upgrade head` |
| `target_metadata is None` (autogenerate empty) | `from src.models import *` in alembic/env.py |
| `MissingGreenlet` | Sync DB call in async context, or returning ORM with lazy relationship |
| `sqlalchemy.exc.InvalidRequestError: object already attached` | Two sessions; reuse one per request |
| `RuntimeWarning: coroutine ... was never awaited` | Add `await`; ruff `RUF006` |
| `pydantic.ValidationError: ... extra_forbidden` | `model_config = ConfigDict(extra="ignore")` or fix payload |
| `jose.exceptions.JWTError: Signature verification failed` | SECRET_KEY changed between issue and verify |
| `OperationalError: SSL connection has been closed` | `pool_pre_ping=True`; check Fly Postgres uptime |
| `ImportError: cannot import name 'X' from 'sqlalchemy.orm'` | You're on SQLAlchemy 1.x types in 2.x code; use `Mapped`, `mapped_column` |
| `RuntimeError: Event loop is closed` in pytest | `asyncio_mode = "auto"`; one `event_loop` fixture per session |
| `httpx.ConnectError` in test | Use `ASGITransport(app=app)`, not network |
| `fastapi.exceptions.HTTPException: 422` | Pydantic schema mismatch; check `/docs` for spec |
| `alembic.util.exc.CommandError: Can't locate revision` | `alembic/versions/` deleted or wrong branch; `alembic stamp head` if DB matches |
| `429 Too Many Requests` from PyPI in CI | Use `astral-sh/setup-uv@v5` cache; pin uv version |
| Docker build `failed to read dockerfile` | Run from repo root; check `.dockerignore` not excluding it |
| `fly deploy` hangs at "checking health" | `/healthz` not returning 200 on `:8000` inside container |
| `fly secrets list` shows no DATABASE_URL | `fly postgres attach <cluster>` to set it automatically |
| `release_command failed: alembic ...` | Migration broken; `fly logs`; fix and redeploy |
| `Invalid Argon2 hash` | DB has bcrypt hashes from old `passlib`; re-hash on next login |
| `CORS preflight` failing | `allow_origins` must list exact scheme+host+port; `*` incompatible with credentials |
| Sentry shows nothing | DSN env not set; `sentry_sdk.capture_message("test")` to confirm |
| `/docs` 404 in prod | Disabled by `docs_url=None`; expected |
| 500 with no traceback | Check stderr; ensure `ProcessorFormatter` is wired so stdlib log records render JSON |
| Ruff "remove unused import" on Alembic models | Add `# noqa: F401` next to `from src.models import *` |
| ty: "unresolved import" | Project not installed; `uv sync` and ensure `[tool.uv].package = true` |
| `pytest` hangs | Forgot `await`; or sync test using async fixture; use `pytest-asyncio` markers |
| `pwdlib` ImportError | `uv add 'pwdlib[argon2]'` not just `pwdlib` |
| `python-jose` deprecation warning | Pinned; alternatives: `pyjwt` or `joserfc`. Stick to jose for now. |
| Fly cold-start every request | `min_machines_running = 1` in fly.toml |
| `fly logs` empty | App is in `auto_stop_machines = "stop"` and asleep; hit URL once |

---

## 20. Glossary

- **ASGI** — Async Server Gateway Interface. Python's async equivalent of WSGI. FastAPI is ASGI; Uvicorn is the ASGI server.
- **Async / await** — keywords for cooperative multitasking. `async def f(): await x()` lets one process serve many concurrent requests without threads.
- **Alembic** — schema migration tool for SQLAlchemy. Generates SQL diffs from your model changes.
- **asyncpg** — fastest PostgreSQL driver for Python; async-native.
- **Blast radius** — what breaks when you change a file. Smaller is better.
- **Container** — packaged app + its OS deps; `docker build`, `docker run`.
- **CRUD** — Create, Read, Update, Delete. The 4 basic data operations.
- **Dependency Injection (DI)** — FastAPI passes objects (sessions, current user) into your endpoint via `Depends(...)`.
- **DSN** — Data Source Name (connection string). Used for Postgres URLs and Sentry.
- **Endpoint** — one URL + method, e.g., `POST /auth/login`.
- **Engine** — SQLAlchemy's connection pool + dialect.
- **Event loop** — the thing that schedules `async` tasks. One per process.
- **Fly.io** — PaaS that runs Docker containers globally. `fly deploy` ships.
- **Hashing (passwords)** — one-way transform; `argon2id` is the 2026 winner.
- **JWT** — JSON Web Token. Signed JSON, used as a stateless auth token.
- **Migration** — a versioned SQL change to your DB schema (Alembic file).
- **OpenAPI** — machine-readable spec of your API; FastAPI generates it free, served at `/docs`.
- **ORM** — Object-Relational Mapper. SQLAlchemy maps Python classes to DB tables.
- **Pool (DB)** — pre-opened connections reused across requests; cheap.
- **Pydantic** — runtime validator + serializer. Defines request/response shapes.
- **pyproject.toml** — modern Python project manifest (deps, build, tool configs).
- **Ruff** — Rust-built Python linter + formatter; replaces flake8/black/isort.
- **Schema** (Pydantic) — class describing JSON shape, with validation.
- **Sentry** — error tracking SaaS; auto-captures exceptions.
- **Settings** — typed env-var container (pydantic-settings).
- **Session** (DB) — short-lived unit of work; opens, queries, commits, closes.
- **structlog** — structured-logging lib; emits JSON.
- **ty** — Astral's fast Rust-built Python type checker.
- **uv** — Astral's fast Python package + project manager.
- **Uvicorn** — ASGI server (the thing that listens on a port).
- **WebSocket** — long-lived bidirectional TCP-over-HTTP channel.

---

## 21. Update Cadence

This rulebook is valid for:
- FastAPI 0.130–0.140
- SQLAlchemy 2.0.x (NOT 2.1.x — re-test when 2.1 GA)
- Pydantic 2.10–2.20
- Python 3.13.x (3.14 once asyncpg ships wheels)
- uv 0.7.x
- Ruff 0.13.x
- Alembic 1.18.x

Re-run the generator when:
- FastAPI bumps to 0.14x or 1.0.
- SQLAlchemy 2.1 GA released.
- Python 3.14 becomes the default `uv python install`.
- Fly.io changes its release model or deprecates `release_command`.
- A CVE-level advisory hits any direct dep.

Date stamp: **2026-04-27**.
