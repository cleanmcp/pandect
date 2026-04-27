# React Router 7 (Framework Mode) — Rulebook

> Full-stack React framework. The Remix team merged Remix into React Router; v7 framework mode IS Remix v3. Use `react-router` imports, never `@remix-run/*`.

**Stack slug:** `remix` (alias for React Router 7 framework mode)
**Generated:** 2026-04-27
**Valid for:** React Router 7.14.x → 7.x

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0.3 | Type safety, RR7 ships first-class types |
| Runtime + version | Node.js 24.15.0 LTS | Active LTS through April 2028 |
| Package manager | pnpm 10.33.0 | Fast, disk-efficient, strict |
| Build tool | Vite 8.0.10 + RR7 plugin | Required by RR7 framework mode |
| Framework | react-router 7.14.0 (framework mode) | Successor to Remix, official since 2025 |
| State mgmt | React useState/useReducer + loaders | Loaders eliminate most client state |
| Routing/Nav | RR7 file-based via `app/routes/` + `routes.ts` | Built-in framework feature |
| Data layer | Drizzle ORM 0.45.2 + node-postgres | Type-safe, no runtime overhead |
| Database | Postgres 16 (Neon for prod) | Serverless Postgres, branchable |
| Auth | createCookieSessionStorage + bcryptjs | Built into RR7, zero deps |
| Styling | Tailwind CSS 4.2.0 (Vite plugin) | Oxide engine, native CSS theme |
| Forms + validation | RR7 `<Form>` + Zod 3.x | Native, progressive, server-validated |
| Unit test runner | Vitest 4.1.5 | Vite-native, ESM-first |
| E2E framework | Playwright 1.59.1 | Parallel by default, multi-browser |
| Mocking strategy | MSW 2.x at network boundary; never mock DB | Real DB via testcontainers in integration |
| Logger | pino 9.x (server only via `.server.ts`) | Fastest structured logger |
| Error tracking | @sentry/react-router (beta) | Official RR7 SDK |
| Lint + format | Biome 2.4 | One tool, 10x faster, lint+format |
| Type checking | tsc --noEmit (TS 6.0.3) | Standard, RR7 generates route types |
| Env vars + secrets | `.env` (dev) + Vercel/CF secrets (prod) | Standard pattern |
| CI provider | GitHub Actions | Free tier, native pnpm cache |
| Deploy target | Vercel (Fluid compute) | Zero-config RR7 preset |
| Release flow | `git push main` → Vercel auto-deploy | Simplest production path |
| Auto-update | Vercel deploys on every push | Built-in |
| Adapter | `@vercel/react-router` Vite preset | Official RR7 deploy adapter |
| Data fetching | Server `loader`/`action` exports per route | Framework-native pattern |
| Server-only modules | `.server.ts` files / `.server/` directories | Framework convention, excluded from client |
| Error UI | `ErrorBoundary` export per route + `throw new Response(...)` | RR7 idiomatic error path |
| SSR mode | `ssr: true` (server render) | Default; flip to `ssr: false` for SPA |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| react-router | 7.14.0 | 2026-04 | https://reactrouter.com |
| @react-router/dev | 7.14.0 | 2026-04 | https://reactrouter.com |
| @react-router/node | 7.14.0 | 2026-04 | https://reactrouter.com |
| @react-router/serve | 7.14.0 | 2026-04 | https://reactrouter.com |
| @vercel/react-router | latest | 2026-04 | https://vercel.com/docs/frameworks/frontend/react-router |
| react | 19.1.0 | 2026-03 | https://react.dev |
| react-dom | 19.1.0 | 2026-03 | https://react.dev |
| typescript | 6.0.3 | 2026-04-16 | https://typescriptlang.org |
| vite | 8.0.10 | 2026-04 | https://vite.dev |
| @vitejs/plugin-react | 5.0.0 | 2026-04 | https://github.com/vitejs/vite-plugin-react |
| tailwindcss | 4.2.0 | 2026-02-18 | https://tailwindcss.com |
| @tailwindcss/vite | 4.2.0 | 2026-02-18 | https://tailwindcss.com |
| drizzle-orm | 0.45.2 | 2026-04 | https://orm.drizzle.team |
| drizzle-kit | 0.31.0 | 2026-04 | https://orm.drizzle.team |
| pg | 8.13.1 | 2026 | https://node-postgres.com |
| @types/pg | 8.11.10 | 2026 | npm |
| zod | 3.23.8 | 2026 | https://zod.dev |
| bcryptjs | 2.4.3 | stable | npm |
| pino | 9.5.0 | 2026 | https://getpino.io |
| pino-pretty | 11.3.0 | 2026 | npm |
| vitest | 4.1.5 | 2026-04-21 | https://vitest.dev |
| @testing-library/react | 16.x | 2026 | https://testing-library.com |
| @vitest/coverage-v8 | 4.1.5 | 2026-04 | npm |
| jsdom | 25.x | 2026 | npm |
| @playwright/test | 1.59.1 | 2026-03 | https://playwright.dev |
| @biomejs/biome | 2.4.0 | 2026-02 | https://biomejs.dev |
| @sentry/react-router | beta | 2026 | https://docs.sentry.io |
| pnpm | 10.33.0 | 2026-04 | https://pnpm.io |
| node | 24.15.0 LTS | 2026-04 | https://nodejs.org |

### Minimum Host Requirements

- macOS 13+, Windows 11+, or Ubuntu 22.04+
- 8 GB RAM (16 GB recommended)
- 5 GB free disk for `node_modules` + Postgres
- Network access to npmjs.com, github.com, Postgres

### Cold-Start Estimate

`git clone` to running app on a fresh machine: **8 minutes** (5 min for Node + pnpm + deps install, 2 min for Postgres setup, 1 min for first dev start).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node 24 LTS via nvm
brew install nvm
mkdir -p ~/.nvm
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "$(brew --prefix)/opt/nvm/nvm.sh" ] && . "$(brew --prefix)/opt/nvm/nvm.sh"' >> ~/.zshrc
source ~/.zshrc
nvm install 24
nvm use 24

# 3. pnpm
corepack enable
corepack prepare pnpm@10.33.0 --activate

# 4. Postgres 16 (local dev)
brew install postgresql@16
brew services start postgresql@16
createdb app_dev

# 5. GitHub CLI
brew install gh
gh auth login

# 6. Vercel CLI (deploy)
pnpm add -g vercel@latest
vercel login

# 7. Bootstrap project
pnpm dlx create-react-router@latest my-app --template remix-run/react-router-templates/vercel
cd my-app
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

### Windows (PowerShell, run as user, not admin)

```powershell
# 1. winget install runtimes
winget install OpenJS.NodeJS.LTS --version 24.15.0
winget install GitHub.cli
winget install PostgreSQL.PostgreSQL.16

# 2. pnpm via corepack
corepack enable
corepack prepare pnpm@10.33.0 --activate

# 3. Postgres database
"& 'C:\Program Files\PostgreSQL\16\bin\createdb.exe' -U postgres app_dev"

# 4. CLI auth
gh auth login
npm install -g vercel@latest
vercel login

# 5. Bootstrap
pnpm dlx create-react-router@latest my-app --template remix-run/react-router-templates/vercel
cd my-app
pnpm install
copy .env.example .env
pnpm db:push
pnpm dev
```

### Linux (Ubuntu 22.04+)

```bash
# 1. Node 24 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. pnpm
corepack enable
corepack prepare pnpm@10.33.0 --activate

# 3. Postgres 16
sudo apt-get install -y postgresql-16
sudo systemctl start postgresql
sudo -u postgres createdb app_dev
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"

# 4. CLI auth
sudo apt install gh
gh auth login
sudo npm install -g vercel@latest
vercel login

# 5. Bootstrap
pnpm dlx create-react-router@latest my-app --template remix-run/react-router-templates/vercel
cd my-app
pnpm install
cp .env.example .env
pnpm db:push
pnpm dev
```

### Required Accounts

| Service | URL | Why |
|---|---|---|
| GitHub | https://github.com/signup | Source control + CI |
| Vercel | https://vercel.com/signup | Deploy target |
| Neon (prod DB) | https://neon.tech | Serverless Postgres |
| Sentry | https://sentry.io/signup | Error tracking (optional) |

### Expected First-Run Output

```
$ pnpm dev
> my-app@0.0.0 dev /path/to/my-app
> react-router dev

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

Browse to http://localhost:5173 — you should see the React Router welcome page within 2 seconds.

### Common First-Run Errors

| Error | Fix |
|---|---|
| `Error: connect ECONNREFUSED 127.0.0.1:5432` | Start Postgres: `brew services start postgresql@16` (mac) / `sudo systemctl start postgresql` (linux) |
| `Module not found: Can't resolve 'react-router'` | Re-run `pnpm install` — corrupt lockfile |
| `EACCES: permission denied, mkdir 'node_modules'` | `sudo chown -R $(whoami) .` then re-install |
| `error TS2307: Cannot find module './+types/...'` | Run `pnpm typegen` (or `pnpm dev` once to generate route types) |
| `Cannot find module '@vercel/react-router'` | `pnpm add @vercel/react-router` |
| `Port 5173 is already in use` | `pkill -f "react-router dev"` then re-run |
| `Failed to load PostCSS config` | Tailwind v4 uses `@tailwindcss/vite`, no PostCSS — remove `postcss.config.js` |

---

## 3. Project Layout

```
my-app/
├── app/
│   ├── routes/                    # File-based routes
│   │   ├── _index.tsx             # GET / (home)
│   │   ├── login.tsx              # /login (loader+action+component+ErrorBoundary)
│   │   ├── logout.tsx             # /logout (action only)
│   │   ├── dashboard.tsx          # /dashboard (auth-gated)
│   │   ├── posts.$id.tsx          # /posts/:id (dynamic param)
│   │   └── api.health.tsx         # /api/health (resource route, no UI)
│   ├── components/                # Reusable React components
│   │   ├── Button.tsx
│   │   └── Form.tsx
│   ├── lib/
│   │   ├── auth.server.ts         # Server-only auth helpers (excluded from client)
│   │   ├── db.server.ts           # Drizzle client (server-only)
│   │   ├── env.server.ts          # Validated env vars (server-only)
│   │   ├── logger.server.ts       # Pino instance (server-only)
│   │   └── utils.ts               # Pure helpers (safe for both)
│   ├── db/
│   │   ├── schema.ts              # Drizzle table definitions
│   │   └── migrations/            # drizzle-kit generated SQL
│   ├── styles/
│   │   └── app.css                # Tailwind entry (@import "tailwindcss")
│   ├── root.tsx                   # Root route (HTML shell, ErrorBoundary)
│   ├── routes.ts                  # Optional: programmatic route config
│   ├── entry.client.tsx           # Optional client hydration entry
│   └── entry.server.tsx           # Optional server render entry
├── public/                        # Static assets served at /
│   └── favicon.ico
├── tests/
│   ├── unit/                      # Vitest tests
│   │   └── utils.test.ts
│   └── e2e/                       # Playwright tests
│       └── login.spec.ts
├── .github/
│   └── workflows/
│       └── ci.yml
├── .claude/
│   └── settings.json
├── .cursor/
│   └── rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .env.example
├── .env                           # gitignored
├── .gitignore
├── biome.json
├── drizzle.config.ts
├── package.json
├── playwright.config.ts
├── react-router.config.ts
├── tailwind.config.ts             # Optional in v4
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── AGENTS.md
├── CLAUDE.md
└── README.md
```

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Route file | `kebab.dot.notation.tsx` | `users.$id.edit.tsx` (= `/users/:id/edit`) |
| Resource route | Same, no default export | `api.webhook.tsx` |
| Component | `PascalCase.tsx` | `UserCard.tsx` |
| Hook | `use*.ts` | `useDebounce.ts` |
| Server-only file | `*.server.ts` | `auth.server.ts` |
| Client-only file | `*.client.ts` | `analytics.client.ts` |
| DB table | `snake_case` plural | `users`, `blog_posts` |
| Test file | `*.test.ts` (unit) / `*.spec.ts` (e2e) | `utils.test.ts`, `login.spec.ts` |
| Env var | `SCREAMING_SNAKE` | `DATABASE_URL` |
| Type | `PascalCase` | `User`, `Post` |
| Zod schema | `camelCase + Schema` suffix | `userSchema` |

### "If you're adding X, it goes in Y"

| Adding | Goes in |
|---|---|
| New page route | `app/routes/<segment>.tsx` |
| Nested route | `app/routes/parent.child.tsx` |
| Dynamic route param | `app/routes/posts.$id.tsx` |
| Resource route (JSON API) | `app/routes/api.<name>.tsx` (no default export) |
| Reusable component | `app/components/<Name>.tsx` |
| Custom hook | `app/lib/use<Name>.ts` |
| DB query function | `app/lib/<entity>.server.ts` |
| DB schema change | `app/db/schema.ts` (then `pnpm db:generate`) |
| Env var | Add to `.env`, `.env.example`, parse in `app/lib/env.server.ts` |
| Auth-gated logic | Server-only file (`*.server.ts`) called from `loader`/`action` |
| Style classes | Inline Tailwind utilities; component-level `clsx` for variants |
| Global CSS | `app/styles/app.css` (imported in `root.tsx`) |
| Static asset | `public/` (referenced as `/asset.png`) |
| Unit test | `tests/unit/<file>.test.ts` |
| E2E test | `tests/e2e/<flow>.spec.ts` |
| API mock | `tests/unit/__mocks__/<module>.ts` (MSW handlers) |
| Background job | Resource route + Vercel Cron / Cloudflare Cron Trigger |

---

## 4. Architecture

### Process Boundaries

```
┌─────────────────────────────────────────────────────────┐
│ Browser (client bundle)                                  │
│  - app/routes/*.tsx (default export only)                │
│  - app/components/**                                     │
│  - app/lib/utils.ts (no .server suffix)                  │
│  - entry.client.tsx → HydratedRouter                     │
└─────────────────────────────────────────────────────────┘
                       ▲ HTTP / form posts
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Vercel Function / Cloudflare Worker (server bundle)      │
│  - entry.server.tsx → ServerRouter                       │
│  - loader / action exports                               │
│  - app/lib/*.server.ts (auth, db, logger, env)           │
│  - app/db/schema.ts (Drizzle)                            │
└─────────────────────────────────────────────────────────┘
                       ▲ TCP/TLS
                       ▼
┌─────────────────────────────────────────────────────────┐
│ Postgres (Neon / local)                                  │
└─────────────────────────────────────────────────────────┘
```

### Request/Action Data Flow

```
GET /posts/42
   │
   ▼
[Server] match route posts.$id.tsx
   │
   ▼
[Server] run loader({ params, request, context })
   │  → query db via drizzle (db.server.ts)
   │  → return { post } (or throw new Response('Not Found',{status:404}))
   ▼
[Server] render route component with loaderData
   │
   ▼ HTML stream
[Client] hydrate, useLoaderData() returns { post }
   │
   │  user submits <Form method="post"> (edit form)
   ▼
[Client → Server] POST /posts/42 (multipart form-data)
   │
   ▼
[Server] run action({ request, params })
   │  → parse formData, validate with Zod
   │  → write via drizzle
   │  → return redirect('/posts/42') OR return { errors }
   ▼
[Server] revalidates loaders on the page automatically
   ▼
[Client] UI updates with fresh loader data — zero glue code
```

### Auth Flow

```
POST /login (form submit)
   │
   ▼
action() in routes/login.tsx
   │  → validate email/password (Zod)
   │  → bcrypt.compare against db
   │  → on success: session.set('userId', user.id)
   │  → return redirect('/dashboard',
   │       { headers: { 'Set-Cookie': await commitSession(session) } })
   │
   ▼
Subsequent GET /dashboard
   │
   ▼
loader() reads cookie via getSession(request.headers.get('Cookie'))
   │  → if !session.has('userId') → throw redirect('/login')
   │  → query user, return loaderData
```

### State Management Flow

```
Server is source of truth (loader data).
useNavigation() / useFetcher() expose pending state.
Local UI-only state → useState.
Cross-component shared state → React Context (rare; loaders usually suffice).
NEVER install Redux/Zustand/Jotai unless an explicit need beats loaders.
```

### Entry-Point Files

| File | Responsibility |
|---|---|
| `app/root.tsx` | HTML shell `<html><head><Meta/><Links/></head><body><Outlet/><Scripts/></body></html>`. Defines global `ErrorBoundary`. |
| `app/entry.server.tsx` | Custom server render (optional). Streams via `renderToReadableStream`. |
| `app/entry.client.tsx` | Custom client hydration (optional). Calls `hydrateRoot(document, <HydratedRouter/>)`. |
| `app/routes/_index.tsx` | The `/` route. |
| `react-router.config.ts` | `ssr`, `prerender`, `appDirectory`, `presets`. |
| `vite.config.ts` | Loads `reactRouter()` plugin + `tailwindcss()` + `tsconfigPaths()`. |
| `app/db/schema.ts` | All Drizzle table definitions. Single source of truth for DB types. |

### Where Business Logic Lives

- **Lives in:** `app/lib/*.server.ts` (called from `loader`/`action`).
- **Does NOT live in:** route default-export components, `app/components/**`, client bundle.
- **Validation:** Zod schemas in `app/lib/validators.ts` (shared) or co-located `*.server.ts`.

---

## 5. Dev Workflow

### Start Dev Server

```bash
pnpm dev
```

Watchers running:
- Vite HMR (browser refresh on file change)
- React Router type generator (`.react-router/types/`)
- Tailwind v4 Oxide engine (incremental CSS)

### Hot Reload Behavior

- Component edits: instant HMR, state preserved.
- Loader/action edits: server re-execs, page re-fetches automatically.
- `app/db/schema.ts` edits: server restart required, run `pnpm db:push`.
- `vite.config.ts` / `react-router.config.ts` edits: dev server restart required (kill + `pnpm dev`).
- `.env` edits: dev server restart required.

### Debugging

**VS Code / Cursor (`.vscode/launch.json` provided in section 15):**
- "Debug Dev" — runs `pnpm dev` with Node inspector on 9229.
- Set breakpoints in `app/lib/*.server.ts` or loaders/actions; client breakpoints work via Chrome DevTools attached to the Vite-served page.

**Browser:**
- React DevTools extension for component tree.
- Network tab to inspect form submissions (RR7 sends `_data` query for client navigations).

### Pre-Commit Checks

`.claude/settings.json` PreCommit hook runs:
```bash
pnpm typecheck && pnpm lint && pnpm test:unit
```

### Branch + Commit Conventions

- Branch names: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit format (Conventional Commits): `feat(scope): subject` (≤72 chars).
- Trunk-based: branch off `main`, PR back to `main`. Squash-merge.

---

## 6. Testing & Parallelization

### Unit Tests (Vitest)

- Command: `pnpm test:unit`
- Live in: `tests/unit/**/*.test.ts` and co-located `app/**/*.test.ts`
- Single test: `pnpm test:unit -- -t "test name"`
- Single file: `pnpm test:unit tests/unit/utils.test.ts`
- Watch: `pnpm test:unit --watch`

### Integration Tests

- Command: `pnpm test:int`
- Boots a real Postgres via `docker compose up -d postgres-test` then runs Vitest with `INTEGRATION=1`.
- Uses real DB — never mocked.

### E2E Tests (Playwright, parallel by default)

- Command: `pnpm test:e2e`
- Single test: `pnpm test:e2e tests/e2e/login.spec.ts -g "happy path"`
- Headed: `pnpm test:e2e --headed`
- Debug: `pnpm test:e2e --debug`

`playwright.config.ts` sets `workers: undefined` (auto = CPU count) and `fullyParallel: true`.

### Mocking Rules

- **Never mock:** the database (use real Postgres + transactions or testcontainers).
- **Never mock:** React Router itself.
- **Mock at adapter boundary:** external HTTP via MSW handlers.
- **Mock at module boundary:** time (vi.useFakeTimers), randomness (vi.spyOn(Math, 'random')).

### Coverage Target

- Statements ≥ 70%, branches ≥ 65%.
- Measured by `pnpm test:unit --coverage` (v8 provider).
- CI fails below threshold (configured in `vitest.config.ts`).

### Visual Regression

- Playwright `toHaveScreenshot()` for golden images.
- Baseline lives in `tests/e2e/__screenshots__/`.
- Update on intentional UI change: `pnpm test:e2e --update-snapshots`.

### Parallelization for AI Agents

**SAFE to parallelize as subagents (touch disjoint files):**
- Scaffolding multiple unrelated routes (e.g. `app/routes/about.tsx`, `app/routes/contact.tsx`).
- Writing tests for separate modules.
- Adding three independent components in `app/components/`.

**MUST be sequential (shared state):**
- Anything touching `package.json` (lockfile races corrupt installs).
- Anything touching `app/db/schema.ts` (drizzle migration generation).
- Anything touching `react-router.config.ts` / `vite.config.ts`.
- Anything touching `.env`.
- Anything touching `app/root.tsx`.
- Drizzle migration generation (`pnpm db:generate`).

---

## 7. Logging

### Setup (`app/lib/logger.server.ts`)

```ts
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? "info",
  base: { service: "my-app", env: process.env.NODE_ENV },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(process.env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
```

### Log Levels

| Level | When to use |
|---|---|
| `trace` | Verbose debugging (per-query SQL). Disabled in prod. |
| `debug` | Dev/staging troubleshooting. |
| `info` | Boot, request in/out, user-meaningful events (signup, payment). |
| `warn` | Recoverable anomaly (retry, fallback used). |
| `error` | Caught exception with stack. |
| `fatal` | Process must exit. |

### Required Fields

Every log line must include: `request_id`, `user_id` (or null), `module`, `event`. Example helper:

```ts
logger.info({ request_id, user_id, module: "auth", event: "login.success" }, "user logged in");
```

### Sample Log Lines

```jsonc
// boot
{"level":"info","time":"2026-04-27T12:00:00Z","module":"server","event":"boot","port":3000}
// request in
{"level":"info","request_id":"req_abc","module":"http","event":"request.in","method":"POST","path":"/login"}
// request out
{"level":"info","request_id":"req_abc","module":"http","event":"request.out","status":302,"ms":42}
// error
{"level":"error","request_id":"req_abc","module":"db","event":"query.failed","err":{"name":"PgError","message":"..."}}
// slow op
{"level":"warn","request_id":"req_abc","module":"db","event":"query.slow","ms":1200,"sql":"select ..."}
// user event
{"level":"info","request_id":"req_abc","user_id":"usr_42","module":"billing","event":"checkout.completed","amount":2900}
```

### Where Logs Go

- **Dev:** stdout (pino-pretty).
- **Prod:** stdout → Vercel function logs (auto-collected) or Cloudflare Worker `console`. Tail via `vercel logs --follow` or `wrangler tail`. Forward to Sentry via `@sentry/react-router`.

### Grep Locally

```bash
pnpm dev | tee dev.log
# in another shell:
grep '"event":"login.success"' dev.log | jq .
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always import from `react-router`, never from `@remix-run/*`. The Remix v2 packages are renamed.
2. Always run `pnpm typecheck && pnpm lint && pnpm test:unit` before declaring a task done.
3. Always put server-only code in a file ending `.server.ts` or in a `.server/` directory. Otherwise it leaks into the client bundle.
4. Always co-locate `loader`, `action`, default component, and `ErrorBoundary` exports in the route file.
5. Always validate form input with Zod inside `action` before touching the database.
6. Always `throw new Response('Not Found', { status: 404 })` when a loader can't find data — never return null and let the component crash.
7. Always use `<Form method="post">` from `react-router` (not raw `<form>`) so navigation/revalidation works.
8. Always use the auto-generated route types: `import type { Route } from './+types/login';` then type loader/action/component args with `Route.LoaderArgs`, `Route.ActionArgs`, `Route.ComponentProps`.
9. Always keep the `loader`/`action` return value JSON-serializable (no `Date` objects without `toISOString()`, no class instances).
10. Always run `pnpm db:generate` after editing `app/db/schema.ts`, then commit the generated SQL in `app/db/migrations/`.
11. Always read env vars through `app/lib/env.server.ts` (Zod-validated), never `process.env.X` inline.
12. Always wrap external HTTP calls in `app/lib/<service>.server.ts` so they can be mocked at the adapter boundary.
13. Always use `redirect()` from `react-router` for post-action navigation; never `window.location` or `useNavigate` in actions.
14. Always read sessions via `await getSession(request.headers.get('Cookie'))` and write back via `await commitSession(session)` in headers.
15. Always use `useFetcher` for non-navigating mutations (likes, toggles); use `<Form>` for navigations (login, submit-and-redirect).
16. Always include `meta` export in routes with non-default titles.
17. Always pin all deps to exact versions in `package.json` (no `^` or `~`) to keep CI reproducible.
18. Always use the official Vercel preset `vercelPreset()` from `@vercel/react-router/vite` in `react-router.config.ts` when deploying to Vercel.
19. Always run `pnpm build` locally before pushing — Vercel builds will catch what `dev` won't (server-only leaks, type errors).
20. Always handle `loader` failures with a route-level `ErrorBoundary` export.
21. Always set `httpOnly: true`, `secure: true` (in prod), `sameSite: 'lax'` on session cookies.
22. Always run `pnpm format` (Biome) before committing.

### 8.2 NEVER

1. Never import from `@remix-run/react`, `@remix-run/node`, `@remix-run/server-runtime`. Use `react-router` only.
2. Never put server-only imports (drizzle, bcrypt, fs, pg) in a file without `.server.ts` suffix.
3. Never call `process.env` outside of `*.server.ts` files.
4. Never use `useEffect` to fetch data on initial render — use a `loader`.
5. Never `return new Response(null, {status:302})` — use `redirect('/path')` from `react-router` (which throws).
6. Never use `<a href>` for in-app navigation; use `<Link>` or `<NavLink>`.
7. Never put `Date` objects directly in loader return values — serialize first (`.toISOString()`).
8. Never use `db.execute()` raw SQL with template-string interpolation of user input (SQL injection). Use Drizzle parameterized queries.
9. Never run `drizzle-kit push` against production — use `drizzle-kit migrate` with versioned SQL files.
10. Never commit `.env`, `.env.local`, or anything matching `*.local`.
11. Never install Redux, Zustand, MobX, Jotai, or Recoil. Loaders + `useState` cover 99% of cases.
12. Never install `react-query` / TanStack Query unless you've justified why loaders don't fit.
13. Never call `useNavigate()` from inside an `action` or `loader` — they run on the server.
14. Never use `useState` to store data that came from a loader; just call `useLoaderData()` again.
15. Never bypass `pnpm` with `npm install` or `yarn add` — the lockfiles will fight.
16. Never disable Biome or TypeScript checks to "fix" CI.
17. Never deploy without running `pnpm build` locally first.
18. Never write to `node_modules`, `.react-router/`, `.vercel/`, `build/` — they're regenerated.
19. Never expose service-role DB credentials in code paths reachable by the client bundle.
20. Never set `nodeIntegration` or eval-style features (this is web, not Electron — but agents conflate stacks).

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command, lockfile, build | `pnpm install && pnpm typecheck && pnpm test:unit && pnpm build` |
| `pnpm-lock.yaml` | install reproducibility | `pnpm install --frozen-lockfile` |
| `tsconfig.json` | typecheck, IDE | `pnpm typecheck` and IDE reload |
| `vite.config.ts` | dev + build pipeline | `pnpm build && pnpm start` smoke |
| `react-router.config.ts` | routing, SSR, prerender | `pnpm build && pnpm dev` route smoke |
| `app/root.tsx` | every page (HTML shell) | manual visit `/` and `/login`; `pnpm test:e2e` |
| `app/routes.ts` (if used) | route map | `pnpm typecheck && pnpm dev` and visit each route |
| `app/db/schema.ts` | runtime + types + migrations | `pnpm db:generate && pnpm db:push && pnpm typecheck && pnpm test:int` |
| `drizzle.config.ts` | migrations, codegen | `pnpm db:generate` |
| `app/lib/env.server.ts` | runtime config | `pnpm dev` boots without throwing |
| `app/lib/auth.server.ts` | every authed route | `pnpm test:e2e tests/e2e/login.spec.ts` |
| `app/lib/db.server.ts` | every server query | `pnpm test:int` |
| `app/lib/logger.server.ts` | observability | start dev, confirm structured JSON output |
| `app/entry.server.tsx` | server render, headers | `pnpm build && pnpm start` and curl `/` |
| `app/entry.client.tsx` | hydration, error boundary | `pnpm build && pnpm start` and check console |
| `tailwind.config.ts` / `app/styles/app.css` | every styled element | visual smoke + `pnpm build` |
| `biome.json` | lint+format rules | `pnpm lint` |
| `vitest.config.ts` | unit tests | `pnpm test:unit` |
| `playwright.config.ts` | e2e config, parallelism | `pnpm test:e2e --reporter=line` |
| `.github/workflows/ci.yml` | CI gates | push branch, observe Actions run |
| `vercel.json` | deploy routing/headers | `vercel build` then `vercel deploy --prebuilt` |
| `.env.example` | onboarding | new clone bootstraps cleanly |
| `app/routes/_index.tsx` | landing page | curl `/` returns 200 |
| Any `*.server.ts` | possible server bundle leak | `pnpm build` + grep build output for server imports |

### 8.4 Definition of Done (per task type)

#### Bug fix
- [ ] Failing test added that reproduces the bug.
- [ ] Test now passes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test:unit` all green.
- [ ] Manual repro path verified once.
- [ ] Commit references the bug ID/symptom.

#### New feature
- [ ] Loader/action implemented + tested at unit level.
- [ ] Route component implemented.
- [ ] `ErrorBoundary` export added.
- [ ] Zod schema for any user input.
- [ ] E2E test for happy path (`pnpm test:e2e`).
- [ ] Screenshot or terminal log captured for review.
- [ ] `pnpm build` succeeds locally.

#### Refactor
- [ ] No behavior change — same tests pass before and after, none added.
- [ ] `pnpm typecheck && pnpm test:unit && pnpm test:e2e` all green.
- [ ] No new deps added.

#### Dependency bump
- [ ] CHANGELOG of the bumped pkg read.
- [ ] `pnpm install && pnpm build && pnpm test:unit && pnpm test:e2e` all green.
- [ ] Lockfile committed.

#### Schema change
- [ ] `app/db/schema.ts` edited.
- [ ] `pnpm db:generate` run, generated SQL reviewed.
- [ ] Generated SQL committed to `app/db/migrations/`.
- [ ] `pnpm db:push` (dev) or migration applied (prod-equivalent).
- [ ] `pnpm typecheck && pnpm test:int` green.
- [ ] Backfill plan documented if data needs transformation.

#### Copy change
- [ ] String edited in source.
- [ ] No surrounding logic touched.
- [ ] `pnpm typecheck && pnpm test:e2e` green.
- [ ] Screenshot captured.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e
```

Expected output for green:

```
$ pnpm typecheck
> tsc --noEmit
$ (exits 0, no output)

$ pnpm lint
> biome check .
Checked N files in Xms. No fixes applied.

$ pnpm test:unit
✓ tests/unit/utils.test.ts (3)
Test Files  1 passed (1)
     Tests  3 passed (3)

$ pnpm build
> react-router build
[react-router] info  building...
[react-router] info  build complete

$ pnpm test:e2e
Running 5 tests using 4 workers
  5 passed (12s)
```

Any non-zero exit code = NOT done.

### 8.6 Parallelization Patterns

**Safe fan-out (independent files, no shared mutable state):**
- "Scaffold `app/routes/about.tsx`, `app/routes/contact.tsx`, `app/routes/pricing.tsx` in parallel."
- "Add tests for `users.server.ts`, `posts.server.ts`, `comments.server.ts` in parallel."
- "Generate three components in `app/components/`."

**Must be sequential:**
- Anything modifying `package.json` / `pnpm-lock.yaml`.
- Anything modifying `app/db/schema.ts` (then running `db:generate`).
- Anything modifying `react-router.config.ts` or `vite.config.ts`.
- Anything modifying `app/root.tsx` (single shared file).
- Adding env vars (must touch `.env`, `.env.example`, `env.server.ts` together).

---

## 9. Stack-Specific Pitfalls

1. **Confusing Remix v2 imports with RR7.**
   Symptom: `Cannot find module '@remix-run/react'`.
   Cause: Agent recalls Remix v2 patterns.
   Fix: Replace all `@remix-run/*` imports with `react-router`.
   Detect early: ESLint rule banning `@remix-run/*` imports; or `grep -r '@remix-run'`.

2. **Server-only module leaks into client.**
   Symptom: `Module "fs" has been externalized` or huge client bundle.
   Cause: Imported `pg`/`drizzle`/`bcrypt` from a non-`.server.ts` file.
   Fix: Move the import to a `.server.ts` file or move the file into `app/lib/.server/`.
   Detect early: `pnpm build` warns; check `build/client/` size.

3. **Forgot to `throw new Response()` in loader.**
   Symptom: TypeScript thinks loaderData might be `null`; component crashes accessing `.foo`.
   Cause: `return null` from loader on missing data.
   Fix: `throw new Response('Not Found', { status: 404 })` and add an `ErrorBoundary` export.
   Detect early: Type narrowing complains; tests with missing IDs fail.

4. **Hydration mismatch from `Date.now()` or `Math.random()`.**
   Symptom: React warning "Text content does not match server-rendered HTML."
   Cause: Non-deterministic value in render path.
   Fix: Move to `useEffect` for client-only, or compute in loader.
   Detect early: Browser console warning in dev.

5. **`Invalid Date` in loader return blows up client.**
   Symptom: Client errors `Unexpected token n in JSON`.
   Cause: A `Date` field is `Invalid Date` (NaN).
   Fix: Convert to ISO string in loader: `created_at: row.created_at?.toISOString() ?? null`.
   Detect early: Type the loader return as `string | null` for date fields.

6. **`useLoaderData` typed as `any` everywhere.**
   Symptom: No autocomplete on loader data.
   Cause: Not using auto-generated route types.
   Fix: `import type { Route } from './+types/<route>'; const data = useLoaderData<typeof loader>();` or use the typed `loaderData` prop.
   Detect early: TS in strict mode flags implicit any.

7. **Form data not arriving in action.**
   Symptom: `formData.get('email')` is null.
   Cause: Used native `<form>` without `<Form>`, or missing `name=` attributes.
   Fix: Use `<Form method="post">` from `react-router`; ensure every input has `name=`.
   Detect early: E2E test asserting field arrives.

8. **Tailwind v4 PostCSS config left over.**
   Symptom: `Cannot find module 'tailwindcss/plugin'` or styles missing.
   Cause: Brought in v3 `postcss.config.js` / `tailwind.config.js`.
   Fix: Delete `postcss.config.js`, use `@tailwindcss/vite` plugin, write theme via `@theme {}` in CSS.
   Detect early: `pnpm dev` Tailwind plugin warning.

9. **Drizzle queries returning wrong types after schema edit.**
   Symptom: TypeScript thinks a column is a different type than DB.
   Cause: Forgot to regenerate types or push schema.
   Fix: `pnpm db:generate && pnpm db:push`, restart dev server.
   Detect early: Type errors at query call sites.

10. **Cookie session secret missing in prod.**
    Symptom: `Error: secrets is required for createCookieSessionStorage`.
    Cause: `SESSION_SECRET` env var not set on Vercel/Cloudflare.
    Fix: `vercel env add SESSION_SECRET production` (and preview).
    Detect early: `env.server.ts` Zod schema rejects missing var at boot.

11. **Vite 8 + plugin order matters.**
    Symptom: `tailwindcss()` styles missing or `reactRouter()` errors.
    Cause: Wrong plugin order in `vite.config.ts`.
    Fix: Order: `tailwindcss()`, then `reactRouter()`, then `tsconfigPaths()`.
    Detect early: `pnpm build` fails or output CSS empty.

12. **Auto-generated `+types` directory missing after fresh clone.**
    Symptom: `Cannot find module './+types/<route>'`.
    Cause: `.react-router/types` not yet generated.
    Fix: `pnpm dev` once (or run `react-router typegen`).
    Detect early: Add `pnpm typegen` to `postinstall`.

13. **Submitting form to a route without an `action` export.**
    Symptom: 405 Method Not Allowed.
    Cause: Route only has a loader.
    Fix: Add `export async function action(...)` or post to a different route.
    Detect early: E2E.

14. **Nested route data flow broken — child re-renders without parent data.**
    Symptom: `useRouteLoaderData('routes/parent')` returns undefined.
    Cause: Route id mismatch (RR7 normalizes hyphens, dots).
    Fix: Use the exact route id printed by `react-router routes` CLI; or use typed `useRouteLoaderData<typeof parentLoader>('id')`.
    Detect early: TS unknown route id.

15. **Action redirect with `Set-Cookie` drops the cookie.**
    Symptom: Logged in, redirected, but session not persisted.
    Cause: Used `redirect()` without merging headers.
    Fix:
    ```ts
    return redirect('/dashboard', {
      headers: { 'Set-Cookie': await commitSession(session) },
    });
    ```
    Detect early: E2E asserts cookie on redirect response.

16. **`loader` runs too often during navigation.**
    Symptom: DB hammered on every link click.
    Cause: All loaders revalidate by default after actions.
    Fix: `export function shouldRevalidate({ currentUrl, nextUrl }) { return currentUrl.pathname !== nextUrl.pathname; }` in the route.
    Detect early: Watch query log in dev.

17. **`@vercel/react-router` preset missing on Vercel deploy.**
    Symptom: 404 on every route on Vercel.
    Cause: Default Vite build deployed instead of RR7 build.
    Fix: Add `vercelPreset()` to `presets` in `react-router.config.ts`; or set framework preset to "React Router" in Vercel project settings.
    Detect early: Compare `vercel build` local output to expected.

18. **Cloudflare bindings not in loader context.**
    Symptom: `context.cloudflare.env.MY_KV` is undefined.
    Cause: Missing `getLoadContext` in worker entry.
    Fix: Wire up via Cloudflare Vite plugin's `getLoadContext`.
    Detect early: Type `context` strictly via `LoadContext` interface.

19. **CSRF on actions.**
    Symptom: External site can submit your action via form.
    Cause: No origin check.
    Fix: Compare `request.headers.get('origin')` against expected; use SameSite=Lax on cookies (default).
    Detect early: Threat model review.

20. **Streaming response interleaved with pino-pretty in prod.**
    Symptom: Garbled logs.
    Cause: Used `pino-pretty` in production (sync transport blocks the stream).
    Fix: Only enable `pino-pretty` when `NODE_ENV !== 'production'` (the `logger.server.ts` snippet does this).
    Detect early: Prod logs not JSON.

---

## 10. Performance Budgets

| Metric | Budget | How to measure | If exceeded |
|---|---|---|---|
| Cold server start | < 500 ms | `time pnpm start` (after `pnpm build`) | Lazy-import heavy modules; review `entry.server.tsx` |
| TTFB (server-rendered route) | < 200 ms p95 | `curl -w "%{time_starttransfer}\n" -o /dev/null -s http://localhost:3000/` | Profile loader; add DB indexes |
| Hydration (TTI on a typical route) | < 1.5 s on 4G | Lighthouse CI | Reduce client bundle, defer non-critical scripts |
| Client bundle (root chunk) | < 200 KB gzip | `ls -lh build/client/assets/*.js` then `gzip -c | wc -c` | Audit imports; move to `.server.ts` |
| Per-route chunk | < 80 KB gzip | same | Code-split, lazy `<Suspense>` |
| Memory (dev) | < 1 GB | `ps -o rss= -p $(pgrep -f 'react-router dev')` | Restart; check for unbounded caches in loaders |
| Postgres query p95 | < 100 ms | `EXPLAIN ANALYZE` on slow logs | Add index, denormalize |

---

## 11. Security

### Secret Storage

- **Local dev:** `.env` (gitignored). Loaded by Vite automatically.
- **Vercel prod:** `vercel env add KEY production`. Available as `process.env.KEY` server-side.
- **Cloudflare prod:** `wrangler secret put KEY`. Available via `context.cloudflare.env.KEY`.
- **Never:** commit `.env`, hardcode secrets, log secrets, send secrets to client.

### Auth Threat Model

- Sessions: signed cookies (`createCookieSessionStorage`) — `httpOnly: true`, `secure: true` in prod, `sameSite: 'lax'`.
- Password storage: bcrypt with cost 12.
- Per-route gating: every authenticated `loader` calls `await requireUserId(request)` first thing.
- Resource scoping: every query joins on `user_id` from session — never trust the request body to scope reads.

### Input Validation Boundary

- Every action's first 5 lines: `const result = schema.safeParse(Object.fromEntries(formData)); if (!result.success) return { errors: result.error.flatten() };`
- Loaders that take URL params: validate with Zod (e.g. `z.string().uuid()`).

### Output Escaping

- React escapes JSX content by default — never use `dangerouslySetInnerHTML` with user input.
- Headers set via `Response`/`redirect` headers; never interpolate user input into header values.
- Redirects: validate target URL is same-origin before `redirect(to)`.

### Permissions / Capabilities

- N/A for web; instead enforce CORS, SameSite cookies, CSP via `Content-Security-Policy` header in `entry.server.tsx`.

### Dependency Audit

```bash
pnpm audit --prod
```

Run weekly in CI. Auto-fix: `pnpm audit --fix`.

### Top 5 Stack Risks

1. **Server-only secrets leaking to client bundle** — solved by `.server.ts` convention; verify with `pnpm build` and grep client output.
2. **SQL injection via raw `db.execute(sql\`... ${input} ...\`)`** — use parameterized queries; Drizzle defaults to safe.
3. **Open redirect after login** — validate `redirectTo` against allowlist before `redirect(redirectTo)`.
4. **CSRF on state-changing actions** — origin check or Double Submit Cookie pattern; SameSite=Lax helps.
5. **Session fixation** — regenerate session ID after login (`session.unset('userId'); session.set('userId', newId)`).

---

## 12. Deploy

### Full Release Flow (Vercel)

```bash
# 1. ensure clean tree
git status   # nothing to commit

# 2. local build smoke
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
pnpm test:e2e

# 3. push
git push origin main

# 4. Vercel auto-deploys; watch
vercel logs --follow
```

### Staging vs Prod

- `main` branch → production (`https://my-app.vercel.app`).
- Any other branch → preview deploy (`https://my-app-git-<branch>.vercel.app`).
- Preview env vars are independent of prod; set with `vercel env add KEY preview`.

### Rollback

```bash
# list deployments
vercel ls --prod

# promote a previous deployment to prod
vercel rollback <deployment-url>
```

Max safe rollback window: 30 days (Vercel retention). Beyond that, redeploy from a tagged git commit.

### Health Check

```bash
curl -fsS https://my-app.vercel.app/api/health
# expected: {"ok":true,"version":"<sha>"}
```

Add to CI as a post-deploy gate.

### Versioning

- `package.json#version` follows semver.
- Embed git SHA at build time:
  ```ts
  // app/lib/version.server.ts
  export const VERSION = process.env.VERCEL_GIT_COMMIT_SHA ?? "dev";
  ```

### Cloudflare Workers Alternative

If `DEPLOY_TGT=cloudflare`:

```bash
pnpm dlx wrangler deploy
# health check
curl -fsS https://my-app.<account>.workers.dev/api/health
```

Add `wrangler.jsonc` (covered in section 16).

### Cost Estimate per 1k MAU

- **Vercel Hobby:** free up to 100 GB bandwidth, 100 hours of function time. 1k MAU usually fits free tier.
- **Vercel Pro:** $20/mo + $0.40 per GB-hr beyond included.
- **Neon free tier:** 500 MB storage, plenty for early stage.
- **Cloudflare Workers Free:** 100k requests/day; Paid $5/mo for 10M.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```md
# Project: my-app

This project follows the React Router 7 (framework mode) rulebook at `rulebooks/remix.md`. The agent must read it before making changes.

## Stack
- React Router 7.14.0 (framework mode) — successor to Remix
- TypeScript 6.0.3, Node 24 LTS, pnpm 10
- Vite 8, Tailwind 4, Drizzle 0.45 + Postgres
- Vitest 4, Playwright 1.59, Biome 2.4
- Deploy: Vercel (preset `@vercel/react-router`)

## Key Commands
- `pnpm dev` — dev server, http://localhost:5173
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — Biome
- `pnpm format` — Biome write
- `pnpm test:unit` — Vitest
- `pnpm test:e2e` — Playwright
- `pnpm build` — production build
- `pnpm start` — serve built output
- `pnpm db:generate` — generate Drizzle migration
- `pnpm db:push` — push schema to dev DB
- `pnpm db:studio` — Drizzle Studio

## Banned Patterns
- Imports from `@remix-run/*` (use `react-router`).
- Server modules (drizzle, pg, bcrypt, fs) outside `*.server.ts` files.
- `process.env` outside `*.server.ts`.
- Native `<form>` without `<Form>` from `react-router`.
- `fetch` inside components (use loaders/actions).
- Adding state libraries (Redux/Zustand/Jotai) — loaders cover it.
- Modifying `app/db/schema.ts` without then running `pnpm db:generate`.

## Definition of Done
Run before claiming completion:
```bash
pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build
```

## Useful Skills
- `/test-driven-development` for new features
- `/systematic-debugging` for unexpected behavior
- `/verification-before-completion` before claiming done
- `/ship` to create a PR
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm install --frozen-lockfile)",
      "Bash(pnpm dev)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm format)",
      "Bash(pnpm test:unit)",
      "Bash(pnpm test:int)",
      "Bash(pnpm test:e2e)",
      "Bash(pnpm build)",
      "Bash(pnpm start)",
      "Bash(pnpm db:generate)",
      "Bash(pnpm db:push)",
      "Bash(pnpm db:studio)",
      "Bash(pnpm dlx *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git branch*)",
      "Bash(git checkout *)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push)",
      "Bash(gh *)",
      "Bash(vercel logs*)",
      "Bash(vercel ls*)",
      "Bash(curl *)",
      "Bash(node --version)",
      "Bash(pnpm --version)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm format >/dev/null 2>&1 || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pnpm typecheck && pnpm lint"
          }
        ]
      }
    ]
  }
}
```

### Slash Commands That Save Time

- `/init` — first-time CLAUDE.md scaffold.
- `/ship` — runs full verify, creates PR.
- `/review` — diff review against base.
- `/test-driven-development` — drives a TDD loop on a single feature.
- `/verification-before-completion` — before claiming done.

---

## 14. Codex Integration

### `AGENTS.md`

```md
# Agent Guide

Read `rulebooks/remix.md` first. It is the authoritative spec.

## Framework
React Router 7 framework mode (the merged successor to Remix).
- Imports come from `react-router` — never `@remix-run/*`.
- Server-only code lives in `*.server.ts` files.
- Routes live in `app/routes/`, file-based.

## Run / Test
- `pnpm dev` — start.
- `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build` — green = done.
- `pnpm test:e2e` — Playwright, parallel by default.

## Style
- TypeScript strict.
- Biome lint+format. `pnpm format` rewrites.
- Conventional commits: `feat(scope): subject`.

## Don't
- Don't introduce state libs (Redux/Zustand/Jotai).
- Don't fetch in `useEffect` — use `loader`.
- Don't commit `.env`.
- Don't bypass validation; every action's first step is Zod.
- Don't mock the database in tests; use real Postgres via testcontainers.

## Verify
```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test:unit
pnpm build
```
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_mode = "on-request"
sandbox = "workspace-write"

[shell]
default_shell = "bash"

[allowlist]
commands = [
  "pnpm install",
  "pnpm install --frozen-lockfile",
  "pnpm dev",
  "pnpm build",
  "pnpm start",
  "pnpm typecheck",
  "pnpm lint",
  "pnpm format",
  "pnpm test:unit",
  "pnpm test:int",
  "pnpm test:e2e",
  "pnpm db:generate",
  "pnpm db:push",
  "git status",
  "git diff",
  "git log",
  "git add",
  "git commit",
  "git push",
  "gh pr create",
  "gh pr view",
]

[project]
working_directory = "."
```

### Codex vs Claude Code Differences

- Codex defaults to longer single-shot generations; structure prompts as "produce these N files top-to-bottom, no commentary."
- Codex does not auto-discover `.cursor/rules`; reference `AGENTS.md` explicitly.
- Codex sandbox `workspace-write` already permits file writes; no extra permission needed for `pnpm dlx create-react-router`.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
You are working on a React Router 7 (framework mode) app — successor to Remix.
Read rulebooks/remix.md before making changes.

ALWAYS:
- Import from `react-router`, never `@remix-run/*`.
- Put server-only code in `*.server.ts` files.
- Validate user input with Zod inside `action`.
- Use `<Form method="post">` from react-router for navigations.
- Use `useFetcher` for non-navigating mutations.
- Throw `new Response('Not Found', { status: 404 })` from loaders on missing data.
- Use auto-generated route types: `import type { Route } from './+types/<route>'`.
- Run `pnpm typecheck && pnpm lint && pnpm test:unit && pnpm build` before claiming done.
- Run `pnpm db:generate` after editing app/db/schema.ts.
- Pin all deps to exact versions in package.json.

NEVER:
- Use `@remix-run/*` imports.
- Use Redux/Zustand/Jotai/MobX.
- Fetch data in `useEffect` for initial load.
- Use raw `process.env` outside `.server.ts`.
- Run `npm install` or `yarn add` (use pnpm).
- Use `<a href>` for in-app navigation (use `<Link>`).
- Run `drizzle-kit push` against production.
- Mock the database in tests.

The deploy target is Vercel via `@vercel/react-router` preset.
Database is Postgres via Drizzle ORM.
Styling is Tailwind CSS v4 (Oxide engine, CSS-native theme).
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer",
    "drizzle-team.drizzle-orm",
    "ms-azuretools.vscode-docker",
    "github.vscode-github-actions"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Dev Server",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": { "NODE_OPTIONS": "--inspect=9229" }
    },
    {
      "name": "Debug Vitest",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test:unit", "--inspect-brk", "--no-file-parallelism"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug Playwright",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test:e2e", "--debug"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create each file below in order. After the last `git push`, you have a deployable hello-world.

### 1. `package.json`

```json
{
  "name": "my-app",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "engines": { "node": ">=24.15.0", "pnpm": ">=10.33.0" },
  "packageManager": "pnpm@10.33.0",
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "start": "react-router-serve ./build/server/index.js",
    "typecheck": "react-router typegen && tsc --noEmit",
    "typegen": "react-router typegen",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test:unit": "vitest run",
    "test:int": "INTEGRATION=1 vitest run",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "postinstall": "react-router typegen"
  },
  "dependencies": {
    "@react-router/node": "7.14.0",
    "@react-router/serve": "7.14.0",
    "@vercel/react-router": "1.2.0",
    "bcryptjs": "2.4.3",
    "drizzle-orm": "0.45.2",
    "isbot": "5.1.17",
    "pg": "8.13.1",
    "pino": "9.5.0",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-router": "7.14.0",
    "zod": "3.23.8"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.0",
    "@playwright/test": "1.59.1",
    "@react-router/dev": "7.14.0",
    "@tailwindcss/vite": "4.2.0",
    "@testing-library/jest-dom": "6.6.3",
    "@testing-library/react": "16.1.0",
    "@types/bcryptjs": "2.4.6",
    "@types/node": "24.0.0",
    "@types/pg": "8.11.10",
    "@types/react": "19.1.0",
    "@types/react-dom": "19.1.0",
    "@vitejs/plugin-react": "5.0.0",
    "@vitest/coverage-v8": "4.1.5",
    "drizzle-kit": "0.31.0",
    "jsdom": "25.0.1",
    "pino-pretty": "11.3.0",
    "tailwindcss": "4.2.0",
    "typescript": "6.0.3",
    "vite": "8.0.10",
    "vite-tsconfig-paths": "5.1.4",
    "vitest": "4.1.5"
  }
}
```

### 2. `tsconfig.json`

```json
{
  "include": [
    "**/*",
    "**/.server/**/*",
    "**/.client/**/*",
    ".react-router/types/**/*"
  ],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2024"],
    "types": ["@react-router/node", "vite/client"],
    "target": "ES2024",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "baseUrl": ".",
    "paths": { "~/*": ["./app/*"] },
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "allowJs": true,
    "isolatedModules": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### 3. `vite.config.ts`

```ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter(), tsconfigPaths()],
  server: { port: 5173 },
});
```

### 4. `react-router.config.ts`

```ts
import type { Config } from "@react-router/dev/config";
import { vercelPreset } from "@vercel/react-router/vite";

export default {
  ssr: true,
  appDirectory: "app",
  presets: [vercelPreset()],
  future: {
    unstable_optimizeDeps: true,
  },
} satisfies Config;
```

### 5. `tailwind.config.ts` (optional in v4 — most config moves to CSS)

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}"],
} satisfies Config;
```

### 6. `app/styles/app.css`

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.62 0.18 270);
  --font-sans: "Inter", ui-sans-serif, system-ui;
}

html {
  font-family: var(--font-sans);
}
```

### 7. `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./app/db/migrations",
  schema: "./app/db/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  strict: true,
  verbose: true,
});
```

### 8. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**/*.ts", "**/*.tsx", "**/*.json", "**/*.css", "!**/build/**", "!**/.react-router/**", "!**/node_modules/**"]
  },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "noNonNullAssertion": "warn",
        "useConst": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "useExhaustiveDependencies": "warn"
      },
      "suspicious": {
        "noConsole": { "level": "warn", "options": { "allow": ["warn", "error"] } }
      }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "double", "trailingCommas": "all", "semicolons": "always" }
  }
}
```

### 9. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/unit/setup.ts"],
    include: ["tests/unit/**/*.test.ts", "tests/unit/**/*.test.tsx", "app/**/*.test.ts", "app/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      thresholds: { statements: 70, branches: 65, functions: 70, lines: 70 },
      exclude: ["**/node_modules/**", "**/build/**", "**/.react-router/**", "tests/**"],
    },
  },
});
```

### 10. `tests/unit/setup.ts`

```ts
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
```

### 11. `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox",  use: { ...devices["Desktop Firefox"] } },
    { name: "webkit",   use: { ...devices["Desktop Safari"] } },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 12. `.env.example`

```
# Postgres connection string. For local dev, postgres@localhost is fine.
DATABASE_URL=postgres://postgres:postgres@localhost:5432/app_dev

# 32+ char random string. Generate with: openssl rand -hex 32
SESSION_SECRET=replace_me_with_32_char_random_hex

# Logger
LOG_LEVEL=info

# Optional: Sentry
# SENTRY_DSN=

NODE_ENV=development
```

### 13. `.gitignore`

```
node_modules/
build/
.react-router/
.vercel/
.env
.env.local
*.local
coverage/
.DS_Store
playwright-report/
test-results/
```

### 14. `app/root.tsx`

```tsx
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
} from "react-router";
import type { Route } from "./+types/root";
import "./styles/app.css";

export const links: Route.LinksFunction = () => [];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body className="min-h-dvh bg-white text-zinc-900 antialiased">
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  if (isRouteErrorResponse(error)) {
    return (
      <main className="p-8">
        <h1 className="text-2xl font-bold">{error.status} {error.statusText}</h1>
        <p>{error.data}</p>
      </main>
    );
  }
  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold">Something broke.</h1>
      <pre className="mt-4 text-sm text-red-700">
        {error instanceof Error ? error.message : "Unknown error"}
      </pre>
    </main>
  );
}
```

### 15. `app/routes/_index.tsx`

```tsx
import type { Route } from "./+types/_index";
import { Link } from "react-router";

export const meta: Route.MetaFunction = () => [
  { title: "my-app" },
  { name: "description", content: "Built on React Router 7" },
];

export async function loader(_: Route.LoaderArgs) {
  return { now: new Date().toISOString() };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="p-8 space-y-4">
      <h1 className="text-3xl font-bold">Hello, React Router 7</h1>
      <p className="text-zinc-600">Server time: {loaderData.now}</p>
      <Link to="/login" className="text-blue-600 underline">Log in</Link>
    </main>
  );
}
```

### 16. `app/routes/api.health.tsx`

```ts
import type { Route } from "./+types/api.health";

export async function loader(_: Route.LoaderArgs) {
  return Response.json({ ok: true, version: process.env.VERCEL_GIT_COMMIT_SHA ?? "dev" });
}
```

### 17. `app/lib/env.server.ts`

```ts
import { z } from "zod";

const Env = z.object({
  DATABASE_URL: z.string().min(1),
  SESSION_SECRET: z.string().min(32, "SESSION_SECRET must be at least 32 chars"),
  LOG_LEVEL: z.enum(["trace", "debug", "info", "warn", "error", "fatal"]).default("info"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SENTRY_DSN: z.string().optional(),
});

export const env = Env.parse(process.env);
```

### 18. `app/lib/db.server.ts`

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "./env.server";
import * as schema from "~/db/schema";

const pool = new Pool({ connectionString: env.DATABASE_URL });
export const db = drizzle(pool, { schema });
```

### 19. `app/db/schema.ts`

```ts
import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### 20. `app/lib/session.server.ts`

```ts
import { createCookieSessionStorage, redirect } from "react-router";
import { env } from "./env.server";

type SessionData = { userId: string };
type SessionFlash = { error: string };

export const { getSession, commitSession, destroySession } =
  createCookieSessionStorage<SessionData, SessionFlash>({
    cookie: {
      name: "__session",
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
      secrets: [env.SESSION_SECRET],
    },
  });

export async function requireUserId(request: Request, redirectTo = "/login") {
  const session = await getSession(request.headers.get("Cookie"));
  const userId = session.get("userId");
  if (!userId) throw redirect(`${redirectTo}?next=${encodeURIComponent(new URL(request.url).pathname)}`);
  return userId;
}
```

### 21. `app/lib/logger.server.ts`

```ts
import pino from "pino";
import { env } from "./env.server";

export const logger = pino({
  level: env.LOG_LEVEL,
  base: { service: "my-app", env: env.NODE_ENV },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(env.NODE_ENV !== "production" && {
    transport: { target: "pino-pretty", options: { colorize: true } },
  }),
});
```

### 22. `tests/unit/example.test.ts`

```ts
import { describe, it, expect } from "vitest";

describe("smoke", () => {
  it("works", () => {
    expect(1 + 1).toBe(2);
  });
});
```

### 23. `tests/e2e/home.spec.ts`

```ts
import { test, expect } from "@playwright/test";

test("home renders", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Hello, React Router 7/ })).toBeVisible();
});

test("health endpoint", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.ok()).toBe(true);
  const json = await res.json();
  expect(json.ok).toBe(true);
});
```

### 24. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

env:
  NODE_VERSION: "24.15.0"
  PNPM_VERSION: "10.33.0"

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: app_test
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgres://postgres:postgres@localhost:5432/app_test
      SESSION_SECRET: aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: ${{ env.PNPM_VERSION }}
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: "pnpm"
      - run: pnpm install --frozen-lockfile
      - run: pnpm db:push
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit
      - run: pnpm build
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### 25. `vercel.json` (optional — preset usually handles it)

```json
{
  "framework": "react-router",
  "installCommand": "pnpm install --frozen-lockfile",
  "buildCommand": "pnpm build"
}
```

### 26. `README.md`

```md
# my-app

React Router 7 (framework mode) + Drizzle + Postgres + Tailwind 4 + Vercel.

## Quickstart
1. `pnpm install`
2. `cp .env.example .env` and fill in values
3. `pnpm db:push`
4. `pnpm dev` → http://localhost:5173

See `rulebooks/remix.md` for the full guide.
```

After committing all of the above and `git push`-ing to a GitHub repo connected to Vercel, you have a deployable hello-world.

---

## 17. Idea → MVP Path

Generic CRUD app (no `PROJECT_IDEA` provided).

### Phase 1: Schema (1 session, ~30 min)

- Files touched: `app/db/schema.ts`, `app/db/migrations/*.sql`.
- Define core entities (users, posts, etc.) in `schema.ts`.
- `pnpm db:generate` then `pnpm db:push`.
- Exit criteria: `pnpm db:studio` shows the tables; types flow through.

### Phase 2: Backbone (1 session)

- Files: `app/routes/_index.tsx`, `app/routes/login.tsx`, `app/routes/signup.tsx`, `app/routes/dashboard.tsx`, `app/root.tsx` (nav).
- Skeleton routes with placeholder loaders/components.
- Exit criteria: `pnpm dev` shows nav, every route returns 200.

### Phase 3: Vertical slice (2–3 sessions)

- Pick one entity (e.g. `posts`). Implement: list (`posts._index.tsx`), detail (`posts.$id.tsx`), create (`posts.new.tsx`), edit (`posts.$id.edit.tsx`), delete (action).
- Files: above routes + `app/lib/posts.server.ts`.
- Tests: 1 unit test per server fn, 1 e2e for create→view→edit→delete.
- Exit criteria: `pnpm test:e2e tests/e2e/posts.spec.ts` green.

### Phase 4: Auth + multi-user (1–2 sessions)

- Files: `app/lib/auth.server.ts`, `app/lib/session.server.ts` (already), `app/routes/login.tsx`, `app/routes/signup.tsx`, `app/routes/logout.tsx`.
- Add `user_id` column to scoped entities; add `requireUserId` to all writes.
- Exit criteria: two browsers can sign up, only see their own data, e2e covers it.

### Phase 5: Ship + monitor (1 session)

- Connect repo to Vercel; add prod env vars (`DATABASE_URL` to Neon, `SESSION_SECRET`).
- Wire `@sentry/react-router` (optional).
- Push to `main`; verify `/api/health` returns 200 on prod URL.
- Exit criteria: `curl https://my-app.vercel.app/api/health` returns `{"ok":true,"version":"<sha>"}`.

---

## 18. Feature Recipes

### 18.1 Auth (email/password)

`app/routes/signup.tsx`:

```tsx
import type { Route } from "./+types/signup";
import { Form, redirect, useActionData } from "react-router";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { db } from "~/lib/db.server";
import { users } from "~/db/schema";
import { commitSession, getSession } from "~/lib/session.server";

const Schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function action({ request }: Route.ActionArgs) {
  const result = Schema.safeParse(Object.fromEntries(await request.formData()));
  if (!result.success) return { errors: result.error.flatten().fieldErrors };

  const passwordHash = await bcrypt.hash(result.data.password, 12);
  const [user] = await db
    .insert(users)
    .values({ email: result.data.email, passwordHash })
    .returning({ id: users.id });

  const session = await getSession(request.headers.get("Cookie"));
  session.set("userId", user.id);
  return redirect("/dashboard", {
    headers: { "Set-Cookie": await commitSession(session) },
  });
}

export default function Signup() {
  const data = useActionData<typeof action>();
  return (
    <Form method="post" className="space-y-4 p-8">
      <input name="email" type="email" required className="border p-2" />
      {data?.errors?.email && <p className="text-red-600">{data.errors.email[0]}</p>}
      <input name="password" type="password" required className="border p-2" />
      {data?.errors?.password && <p className="text-red-600">{data.errors.password[0]}</p>}
      <button type="submit" className="bg-black text-white px-4 py-2">Sign up</button>
    </Form>
  );
}
```

`app/routes/login.tsx`: same shape, swap insert for `db.select().where(eq(users.email, ...))` and `bcrypt.compare`.

`app/routes/logout.tsx`:

```tsx
import type { Route } from "./+types/logout";
import { redirect } from "react-router";
import { destroySession, getSession } from "~/lib/session.server";

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get("Cookie"));
  return redirect("/", { headers: { "Set-Cookie": await destroySession(session) } });
}

export const loader = () => redirect("/");
```

### 18.2 File upload (Vercel Blob)

```ts
// app/routes/uploads.tsx
import type { Route } from "./+types/uploads";
import { put } from "@vercel/blob";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const file = formData.get("file") as File;
  if (!file) throw new Response("Missing file", { status: 400 });
  const blob = await put(file.name, file, { access: "public" });
  return { url: blob.url };
}
```

(Add `@vercel/blob` to deps; install BLOB_READ_WRITE_TOKEN env var.)

### 18.3 Stripe payments

```ts
// app/routes/api.checkout.tsx
import type { Route } from "./+types/api.checkout";
import Stripe from "stripe";
import { env } from "~/lib/env.server";
import { requireUserId } from "~/lib/session.server";

const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: "2025-10-28.basil" });

export async function action({ request }: Route.ActionArgs) {
  const userId = await requireUserId(request);
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { userId },
    success_url: `${env.APP_URL}/dashboard?success=1`,
    cancel_url: `${env.APP_URL}/pricing`,
  });
  return Response.json({ url: session.url });
}
```

Webhook: `app/routes/api.stripe-webhook.tsx` verifies `stripe-signature` header, updates DB.

### 18.4 Push notifications (Web Push via VAPID)

Use `web-push` server-side; serve worker from `public/sw.js`; subscribe in `entry.client.tsx`.

### 18.5 Background jobs (Vercel Cron)

`vercel.json`:
```json
{
  "framework": "react-router",
  "crons": [{ "path": "/api/cron/daily", "schedule": "0 2 * * *" }]
}
```

`app/routes/api.cron.daily.tsx`:
```ts
import type { Route } from "./+types/api.cron.daily";
import { env } from "~/lib/env.server";

export async function loader({ request }: Route.LoaderArgs) {
  if (request.headers.get("Authorization") !== `Bearer ${env.CRON_SECRET}`) {
    throw new Response("Unauthorized", { status: 401 });
  }
  // do work
  return Response.json({ ok: true });
}
```

### 18.6 Realtime updates (SSE)

```ts
// app/routes/api.events.tsx
import type { Route } from "./+types/api.events";

export async function loader(_: Route.LoaderArgs) {
  const stream = new ReadableStream({
    start(controller) {
      const send = (data: unknown) =>
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify(data)}\n\n`));
      const id = setInterval(() => send({ ts: Date.now() }), 1000);
      return () => clearInterval(id);
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  });
}
```

Client: `new EventSource('/api/events').onmessage = (e) => ...`.

### 18.7 Search (Postgres `tsvector`)

```ts
// app/db/schema.ts addition
import { sql } from "drizzle-orm";
import { index } from "drizzle-orm/pg-core";

export const posts = pgTable("posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  body: text("body").notNull(),
}, (t) => ({
  fts: index("posts_fts_idx").using("gin", sql`to_tsvector('english', ${t.title} || ' ' || ${t.body})`),
}));

// query
import { sql } from "drizzle-orm";
export async function search(q: string) {
  return db.execute(
    sql`select * from posts where to_tsvector('english', title||' '||body) @@ plainto_tsquery('english', ${q}) limit 20`,
  );
}
```

### 18.8 Internationalization

Use `remix-i18next` (still works under RR7 framework mode; published as RR7-compat).

```ts
// app/lib/i18n.server.ts
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
i18next.use(Backend).init({
  fallbackLng: "en",
  ns: ["common"],
  backend: { loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json") },
});
export default i18next;
```

Use `useTranslation()` in components; loader returns `i18n.t('key')` for SSR-safe strings.

### 18.9 Dark mode

Tailwind v4 supports `prefers-color-scheme` natively via `@variant`. Add to `app/styles/app.css`:

```css
@variant dark (&:where(.dark, .dark *));
```

Toggle via cookie:
```ts
// loader
const session = await getSession(request.headers.get("Cookie"));
const theme = session.get("theme") ?? "system";
return { theme };
```

Apply class on `<html>` in `root.tsx` from loader data.

### 18.10 Analytics events

```ts
// app/lib/analytics.server.ts
import { logger } from "./logger.server";
export function track(event: string, props: Record<string, unknown>) {
  logger.info({ event: `analytics.${event}`, ...props }, "track");
  // POST to PostHog/Plausible/etc here
}
```

Call from `action`s after side effects.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find module 'react-router'` | `pnpm install` |
| `Cannot find module './+types/<route>'` | `pnpm typegen` (or `pnpm dev` once) |
| `error TS2724: 'react-router' has no exported member 'json'` | RR7 removed `json()` — return plain object or `Response.json()` |
| `Module 'pg' is not bundleable` | Move import to `*.server.ts` |
| `Error: secrets is required for createCookieSessionStorage` | Set `SESSION_SECRET` in `.env` |
| `connect ECONNREFUSED 127.0.0.1:5432` | Start Postgres |
| `password authentication failed for user "postgres"` | `ALTER USER postgres PASSWORD 'postgres';` |
| `relation "users" does not exist` | `pnpm db:push` |
| `MODULE_TYPELESS_PACKAGE_JSON` warning | Set `"type": "module"` in `package.json` |
| `Cannot use import statement outside a module` | `"type": "module"` in package.json |
| `Hydration failed` | Find non-deterministic render (`Date.now()`, `Math.random()`); move to `useEffect` |
| `Text content does not match server-rendered HTML` | same as above |
| `405 Method Not Allowed` on form submit | Add `action` export to the route |
| `404` on every Vercel route | Add `vercelPreset()` to `react-router.config.ts` |
| `Cannot find module '@vercel/react-router/vite'` | `pnpm add @vercel/react-router` |
| `Tailwind classes not applying` | Confirm `@tailwindcss/vite` plugin is in `vite.config.ts` and `app/styles/app.css` is imported in `root.tsx` |
| `Error: ENOENT: no such file or directory, open '.react-router/types/...'` | `pnpm typegen` |
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@10.33.0 --activate` |
| `EADDRINUSE: address already in use :::5173` | `lsof -ti :5173 | xargs kill` |
| `playwright Test timeout of 30000ms exceeded` | Increase `webServer.timeout` in `playwright.config.ts` |
| `Drizzle migration error: column "x" does not exist` | Forgot to `db:push` after schema edit |
| `useNavigate() may be used only in the context of a <Router>` | Don't call in loader/action; only in components |
| `Cannot read properties of undefined (reading 'env')` (Cloudflare) | Wire `getLoadContext` in worker entry |
| `Form` not submitting via fetch (full page nav) | Used native `<form>`; switch to `<Form>` from `react-router` |
| `JSON.stringify` failing on Date | Convert to ISO string in loader |
| `drizzle-kit: command not found` | `pnpm add -D drizzle-kit` |
| `vercel: command not found` | `pnpm add -g vercel@latest` |
| Biome reports phantom errors after upgrade | Delete `.biome` cache, re-run |
| Vitest "module not found" for `~/...` | Confirm `vite-tsconfig-paths` plugin present |
| `Error: secrets must be a non-empty array` | `SESSION_SECRET` env var is empty string — set a real value |
| `useLoaderData` returns `unknown` | Pass generic: `useLoaderData<typeof loader>()` or use `loaderData` prop |
| Build OOM on Vercel | Increase Node memory: `NODE_OPTIONS="--max-old-space-size=4096"` in build env |

---

## 20. Glossary

- **Action** — A function exported from a route module that runs on the server when the route receives a non-GET request (form submit). Returns data or a redirect.
- **Adapter** — A small package that wires React Router 7 to a specific host (Vercel, Cloudflare, Node). Today: `@vercel/react-router`, `@react-router/cloudflare`, `@react-router/node`.
- **Biome** — Single Rust-based tool that lints and formats JS/TS/JSON. Replaces ESLint + Prettier.
- **Drizzle** — TypeScript ORM. Schema defined in code, types inferred, raw SQL when needed.
- **Drizzle Kit** — CLI for Drizzle: generate migrations, push schema, open Studio (visual DB browser).
- **ErrorBoundary** — A React component exported from a route that renders when the loader/action/component throws.
- **Framework Mode** — RR7's full-stack mode: file-based routes, server loaders/actions, SSR. Replaces Remix.
- **Hydration** — Browser attaches React event handlers to server-rendered HTML.
- **Loader** — Function exported from a route that runs on the server for GET requests; supplies data to the route component.
- **Middleware** — Pre/post request handler. RR7 supports `unstable_middleware`; handle auth gating in loaders for now.
- **Migration** — Versioned SQL file generated by Drizzle Kit that transforms the DB schema.
- **MSW (Mock Service Worker)** — Library that intercepts network requests in tests by patching `fetch`.
- **Pino** — Structured JSON logger; one of the fastest in Node.
- **Playwright** — Microsoft's browser automation framework. Runs Chromium/Firefox/WebKit in parallel.
- **pnpm** — Fast, disk-efficient package manager that uses a content-addressable store.
- **Preset** — Bundle of RR7 config that an adapter can apply (e.g. Vercel preset rewrites build output for serverless functions).
- **Resource route** — A route file with no default export — only `loader`/`action` — used for JSON APIs.
- **SSR** — Server-Side Rendering. Render React to HTML on the server, send to browser, hydrate.
- **Tailwind CSS v4** — Utility-first CSS with Rust-based Oxide engine. Theme via `@theme {}` in CSS.
- **TypeScript** — JavaScript with static types. RR7 generates per-route types into `.react-router/types/`.
- **Vercel** — Hosting platform with first-class RR7 support.
- **Vite** — Modern build tool / dev server. Powers RR7's framework mode.
- **Vitest** — Test runner that reuses Vite's config; ESM-native.
- **Zod** — TypeScript-first schema validator. Validate user input before touching DB.
- **`.server.ts`** — File suffix that marks a module as server-only; excluded from client bundle.
- **`.client.ts`** — File suffix that marks a module as client-only.

---

## 21. Update Cadence

- This rulebook is valid for **React Router 7.14.x** through **7.x**.
- Re-run the generator when:
  - Major version bump (8.0).
  - `@vercel/react-router` or `@react-router/cloudflare` adapter API changes.
  - Tailwind v5, Vite 9, Vitest 5, TypeScript 7, Drizzle 1.0 stable releases.
  - Any security advisory affecting `react-router`, `bcryptjs`, `pg`, or session storage.
- **Generated:** 2026-04-27
- **Next review:** 2026-07-27 or on next React Router minor release, whichever comes first.

---
