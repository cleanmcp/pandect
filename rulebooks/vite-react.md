# Vite + React + TypeScript SPA Rulebook

A locked, opinionated playbook for shipping a Vite + React 19 + TypeScript SPA with TanStack Router (file-based), TanStack Query, Zustand, shadcn/ui + Tailwind v4, Vitest, and Playwright — deployed as static assets on Cloudflare Pages or Vercel. Hand this file to any AI coding agent along with your idea; it bootstraps, builds, and ships without further questions.

Generated 2026-04-27 against current stable versions.

---

## 1. Snapshot

**Stack:** Vite 8 + React 19 + TypeScript 6 client-only SPA, file-based routes, server state via TanStack Query, light client state via Zustand, shadcn/ui components on Tailwind v4, Vitest + Playwright for tests, deployed as static assets.

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0.3 | Strict-by-default; Go-port preview available via tsgo |
| Runtime + version | Node.js 24.15.0 LTS | Active LTS; required by Vite 8 and Vitest 4 |
| Package manager | pnpm 10.33.2 | Strict node_modules, fastest cold install, lockfile is stable |
| Build tool | Vite 8.0.8 (Rolldown) | Rust bundler; 10–30x faster builds than v7 |
| State mgmt (server) | TanStack Query 5.100.5 | Caching, retries, dedup, suspense — replaces useEffect fetching |
| State mgmt (client) | Zustand 5.0.12 | Tiny, no provider, hooks-only, devtools middleware |
| Routing/Nav | TanStack Router file-based (latest 2026-04-26) | Type-safe links, code-split, search-param schemas |
| Data layer | TanStack Query + fetch wrapper | No client DB; talk to remote APIs only |
| Auth | Provider SDK at API boundary | SPA cannot hold secrets; auth lives behind your API |
| Styling | Tailwind CSS 4.2.0 + shadcn/ui | CSS-first config, owned components, no runtime tokens |
| Forms + validation | react-hook-form 7.60 + Zod 3.25 + @hookform/resolvers 5.1 | Uncontrolled, schema-validated, minimal re-renders |
| Unit test runner | Vitest 4.1.4 | Vite-native; reuses dev pipeline; ESM-first |
| Component test | @testing-library/react 16.3.2 + jsdom | Industry default; behavior-first assertions |
| E2E framework | Playwright 1.59.1 | Parallel by default; trace viewer; multi-browser |
| Mocking strategy | MSW 2.13.4 at network boundary | Same handlers for tests, dev, Storybook |
| Logger (browser) | Custom thin wrapper to console + Sentry | Browser has no pino; ship structured fields manually |
| Error tracking | @sentry/react 10.50.0 + @sentry/vite-plugin 5.2.0 | First-class React integration, sourcemap upload |
| Lint + format | Biome 2.3 | One Rust binary; replaces ESLint + Prettier |
| Type checking | tsc --noEmit + vite-plugin-checker 0.13.0 | tsc is truth; checker surfaces in dev overlay |
| Env vars + secrets | `VITE_` prefix only for public values | Anything `VITE_*` ships to browser; never put secrets here |
| CI provider | GitHub Actions | Free for public; matrix-runs Node 24; first-class Playwright cache |
| Deploy target | Cloudflare Pages (primary) / Vercel (fallback) | Static assets at edge; both auto-detect Vite |
| Release flow | Push to `main` → CI → auto-deploy | One branch, one URL, one preview-per-PR |
| Auto-update | Service worker disabled; HTML never cached | New deploy = next reload; no stuck clients |
| Routing strategy | TanStack Router file-based, code-split | Type-safe URLs; unused routes don't ship |
| Data fetching | TanStack Query exclusively, never raw `useEffect` | Cache, retry, dedup; effects leak across renders |
| Error boundary | `react-error-boundary` 4.x at route level | One boundary per route segment; report to Sentry |
| Analytics | Provider script in `index.html` (PostHog/Plausible) | No bundler integration; static `<script>` ships fastest |
| Bundle target | ES2022, modern browsers only | Drop legacy plugin; Baseline 2024+ |

### Versions Table

| Library | Version | Released | Source |
|---|---|---|---|
| vite | 8.0.8 | 2026-04-19 | npmjs.com/package/vite |
| @vitejs/plugin-react | 5.x (Vite 8 compatible) | 2026-Q1 | npmjs.com/package/@vitejs/plugin-react |
| react / react-dom | 19.2.5 | 2026-04-08 | react.dev/versions |
| typescript | 6.0.3 | 2026-04-17 | npmjs.com/package/typescript |
| @tanstack/react-router | 2026-04-26 (latest tag) | 2026-04-26 | github.com/TanStack/router |
| @tanstack/router-plugin | matches router | 2026-04-26 | github.com/TanStack/router |
| @tanstack/react-query | 5.100.5 | 2026-04-25 | github.com/TanStack/query |
| @tanstack/react-query-devtools | 5.100.5 | 2026-04-25 | npm |
| zustand | 5.0.12 | 2026-03-27 | npmjs.com/package/zustand |
| tailwindcss | 4.2.0 | 2026-02-18 | tailwindcss.com/blog |
| @tailwindcss/vite | 4.2.0 | 2026-02-18 | npm |
| shadcn (CLI) | latest | rolling | ui.shadcn.com |
| react-hook-form | 7.60.0 | 2026-Q1 | react-hook-form.com |
| zod | 3.25.76 | 2026-Q1 | zod.dev |
| @hookform/resolvers | 5.1.1 | 2026-Q1 | npm |
| vitest | 4.1.4 | 2026-04-16 | vitest.dev |
| @testing-library/react | 16.3.2 | 2026-Q1 | testing-library.com |
| @testing-library/dom | 10.x | 2026-Q1 | npm |
| @testing-library/jest-dom | 6.x | 2026-Q1 | npm |
| jsdom | 25.x | 2026-Q1 | npm |
| @playwright/test | 1.59.1 | 2026-04-01 | playwright.dev |
| msw | 2.13.4 | 2026-04-26 | mswjs.io |
| @biomejs/biome | 2.3.x | 2026-Q1 | biomejs.dev |
| vite-plugin-checker | 0.13.0 | 2026-04-26 | npm |
| @sentry/react | 10.50.0 | 2026-04-23 | docs.sentry.io |
| @sentry/vite-plugin | 5.2.0 | 2026-04-11 | npm |
| react-error-boundary | 4.x | 2025 | npm |
| pnpm | 10.33.2 | 2026-04 | pnpm.io |
| node | 24.15.0 LTS | 2026-04 | nodejs.org |

### Minimum Host Requirements

- macOS 13+, Windows 11, or Ubuntu 22.04+
- 8 GB RAM (16 GB if running Playwright + dev server simultaneously)
- 5 GB free disk
- Modern browser (Chrome 124+, Firefox 128+, Safari 17.5+) — the app itself needs only Baseline 2024

### Estimated Cold-Start Time

`git clone → pnpm i → pnpm dev` on a 2024 laptop, broadband: **~90 seconds** (60s install, 4s Vite cold dev start, plus first-route compile).

---

## 2. Zero-to-Running (Setup)

### 2.1 macOS

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 24 LTS, pnpm, gh
brew install node@24 pnpm gh
brew link --force node@24

# 3. Verify
node -v   # v24.15.0 (or higher 24.x)
pnpm -v   # 10.33.2
gh --version

# 4. Authenticate GitHub
gh auth login
```

### 2.2 Windows (PowerShell, run as user — not admin)

```powershell
# 1. Install winget if missing (ships with Win11 23H2+)
winget --version

# 2. Install Node 24, pnpm, gh
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm
winget install GitHub.cli

# 3. Reopen terminal so PATH refreshes, then verify
node -v
pnpm -v
gh --version

# 4. Authenticate
gh auth login
```

### 2.3 Linux (Ubuntu/Debian)

```bash
# 1. Node 24 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 3. gh
sudo apt install gh

# 4. Verify + auth
node -v && pnpm -v && gh --version
gh auth login
```

### 2.4 Accounts to Create

| Service | Why | URL |
|---|---|---|
| GitHub | Source + CI | github.com |
| Cloudflare | Pages deploy (primary) | dash.cloudflare.com |
| Vercel | Deploy fallback | vercel.com |
| Sentry | Error tracking | sentry.io (free tier) |

### 2.5 CLI Auth

```bash
# Cloudflare Wrangler (only if deploying to CF Pages from CLI; CI uses tokens)
pnpm dlx wrangler@latest login

# Vercel
pnpm dlx vercel@latest login
```

### 2.6 Bootstrap a Fresh Project

```bash
pnpm create vite@latest my-app --template react-ts
cd my-app
pnpm install
pnpm dev
```

Expected first-run terminal output:

```
  VITE v8.0.8  ready in 412 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### 2.7 First-Run Errors

| Error | Fix |
|---|---|
| `EACCES` on pnpm install (macOS/Linux) | `sudo chown -R $(whoami) ~/.pnpm-store` |
| `ENOENT: no such file or directory, open 'package.json'` | You are not in the project directory. `cd my-app`. |
| `Error: Cannot find module 'vite'` | `rm -rf node_modules pnpm-lock.yaml && pnpm install` |
| Port 5173 in use | `pnpm dev --port 5174`, or kill: `lsof -ti:5173 \| xargs kill -9` |
| `command not found: pnpm` (Windows) | Reopen PowerShell so PATH picks up the new install |
| TypeScript red squiggles in fresh project | Restart your editor's TS server. VS Code: `Cmd/Ctrl+Shift+P → TypeScript: Restart TS Server` |

---

## 3. Project Layout

```
my-app/
├── public/                      # Static files copied verbatim to dist/
│   └── favicon.svg
├── src/
│   ├── main.tsx                 # ReactDOM root + providers
│   ├── routeTree.gen.ts         # AUTO-GENERATED by router plugin — never edit
│   ├── router.tsx               # createRouter() instance
│   ├── routes/                  # File-based routes (one file = one route)
│   │   ├── __root.tsx           # Root layout (header/nav/footer)
│   │   ├── index.tsx            # /
│   │   ├── about.tsx            # /about
│   │   └── posts/
│   │       ├── index.tsx        # /posts
│   │       └── $postId.tsx      # /posts/:postId
│   ├── components/
│   │   ├── ui/                  # shadcn components — owned by you
│   │   └── <feature>/           # feature-specific components
│   ├── lib/
│   │   ├── utils.ts             # `cn()` Tailwind merger; pure helpers
│   │   ├── api.ts               # fetch wrapper, base URL, error mapping
│   │   ├── query-client.ts      # TanStack Query QueryClient instance
│   │   └── sentry.ts            # Sentry init (called from main.tsx)
│   ├── stores/                  # Zustand stores — one file per slice
│   │   └── ui.store.ts
│   ├── hooks/                   # Custom hooks (non-feature)
│   ├── features/                # Domain code; feature folders own queries+UI
│   │   └── posts/
│   │       ├── posts.api.ts     # query/mutation hooks
│   │       ├── posts.types.ts
│   │       └── PostList.tsx
│   ├── styles/
│   │   └── globals.css          # Tailwind directives + CSS vars
│   └── test/
│       ├── setup.ts             # Vitest setup (jest-dom, msw)
│       └── handlers.ts          # MSW request handlers
├── e2e/                         # Playwright tests
│   ├── home.spec.ts
│   └── fixtures.ts
├── index.html                   # Vite entry HTML
├── vite.config.ts
├── vitest.config.ts             # Or merged into vite.config.ts
├── playwright.config.ts
├── tsconfig.json
├── tsconfig.node.json
├── tsconfig.app.json
├── tailwind.config.ts           # Optional in v4 (CSS-first); kept for IDE plugin
├── biome.json
├── components.json              # shadcn config
├── .env.example
├── .env.local                   # gitignored
├── package.json
├── pnpm-lock.yaml
├── README.md
├── CLAUDE.md
├── AGENTS.md
├── .cursor/
│   └── rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .github/
│   └── workflows/ci.yml
└── .claude/
    └── settings.json
```

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Components | PascalCase, one component per file | `UserCard.tsx` |
| Hooks | camelCase, prefix `use` | `useDebounce.ts` |
| Stores | `<slice>.store.ts` | `ui.store.ts` |
| Utils | camelCase | `formatDate.ts` |
| Test files | mirror source, `.test.tsx` | `UserCard.test.tsx` |
| E2E specs | kebab-case `.spec.ts` in `e2e/` | `checkout-flow.spec.ts` |
| Route files | TanStack convention (`__root`, `$param`) | `posts/$postId.tsx` |
| Zod schemas | suffix `Schema` | `loginSchema` |
| Types | PascalCase, no `I` prefix | `Post`, `User` |

### "If you are adding X, it goes in Y"

| Adding | Goes in |
|---|---|
| A new page/URL | `src/routes/<path>.tsx` |
| A reusable button/dialog/form primitive | `src/components/ui/` (via shadcn CLI) |
| A feature-specific component | `src/features/<feature>/` |
| A network call | `src/features/<feature>/<feature>.api.ts` (TanStack Query hook) |
| A global UI flag (sidebar open, theme) | `src/stores/ui.store.ts` |
| Shared types | `src/features/<feature>/<feature>.types.ts` or `src/lib/types.ts` |
| A pure helper | `src/lib/utils.ts` (small) or `src/lib/<topic>.ts` |
| Static assets bundled | `src/assets/` (imported, hashed) |
| Static assets served as-is | `public/` (copied verbatim) |
| A unit test | next to source as `<file>.test.ts(x)` |
| An E2E test | `e2e/<flow>.spec.ts` |
| MSW handlers | `src/test/handlers.ts` |
| New env var (public) | `.env.example` and `.env.local`, prefix `VITE_` |
| A Tailwind theme token | `src/styles/globals.css` `@theme` block |
| A new icon | use `lucide-react`; do not commit SVGs unless brand asset |
| A third-party script | `index.html` `<script>` tag, never `npm install` for analytics |
| A redirect | `vercel.json` (`redirects`) or `_redirects` (CF Pages) |

---

## 4. Architecture

### 4.1 Process Boundaries (SPA — single boundary)

```
┌─────────────────────────────────────────────────┐
│ Browser tab                                     │
│                                                 │
│  index.html  →  /assets/main-[hash].js  →  React│
│                                                 │
│  React tree                                     │
│   ├─ <RouterProvider> (TanStack Router)         │
│   ├─ <QueryClientProvider> (TanStack Query)     │
│   └─ <Sentry.ErrorBoundary>                     │
│                                                 │
└──────────────────┬──────────────────────────────┘
                   │ HTTPS (fetch via src/lib/api.ts)
                   ▼
        Your remote API (separate repo/service)
        — never bundled with the SPA
```

### 4.2 Data Flow (a typical request)

```
Component
   │ useQuery(['posts'], fetchPosts)
   ▼
TanStack Query
   │ cache miss?
   ▼
src/lib/api.ts → fetch(`${VITE_API_URL}/posts`, { credentials: 'include' })
   │
   ▼
Remote API → JSON
   │
   ▼
Zod parse (in api.ts) → typed Post[]
   │
   ▼
Query cache (stable for staleTime) → component re-renders
```

### 4.3 Auth Flow

```
User submits form
   │
   ▼ POST /auth/login (set-cookie: HttpOnly session)
Remote API
   │
   ▼ 200 OK
Component invalidates ['me'] → useQuery(['me']) refetches
   │
   ▼
Zustand store mirrors `isAuthed = !!data` for fast UI gating
   │
   ▼
TanStack Router beforeLoad guards redirect to /login if 401
```

The browser holds NO tokens. Sessions live in HttpOnly cookies set by your API. The SPA only knows "logged in" by virtue of `/me` returning 200.

### 4.4 State Flow

```
Server state  →  TanStack Query (cache + invalidation)
Client state  →  Zustand store(s) (UI flags, ephemeral)
URL state     →  TanStack Router search params (typed via Zod)
Form state    →  react-hook-form (uncontrolled, scoped to one form)
```

If state is derivable from the server, do NOT store it in Zustand. If state survives a refresh, it belongs in the URL or the server.

### 4.5 Entry-Point Files

| File | Responsibility |
|---|---|
| `index.html` | Single HTML file; `<div id="root">`; analytics scripts; meta tags |
| `src/main.tsx` | ReactDOM.createRoot, providers, Sentry init |
| `src/router.tsx` | `createRouter` with `routeTree`, default options |
| `src/routes/__root.tsx` | App shell, devtools (dev only) |
| `src/lib/query-client.ts` | `new QueryClient({ defaultOptions: ... })` |
| `src/lib/api.ts` | Sole network adapter; throws typed errors |

### 4.6 Where Business Logic Lives / Does Not

- **Lives in:** `src/features/<x>/*.api.ts` (queries/mutations) and small pure functions in `src/lib/`.
- **Does NOT live in:** components (they orchestrate), stores (they hold UI flags), routes (they wire). If a component is doing business logic, extract it to a hook in `features/`.

---

## 5. Dev Workflow

### 5.1 Start Dev Server

```bash
pnpm dev          # Vite dev server on :5173, HMR on, route-tree watcher on
```

What runs:
- Vite dev server (Rolldown bundling on demand, native ESM in browser)
- TanStack Router plugin (regenerates `routeTree.gen.ts` on file add/remove in `src/routes/`)
- vite-plugin-checker (tsc + Biome in worker thread → overlay)
- Tailwind v4 Vite plugin (CSS hot reload)

### 5.2 Hot Reload Behavior

- Component changes: Fast Refresh preserves component state.
- Hook signature changes (different exports): full reload.
- New route file added: routeTree regenerates automatically; if your editor still shows red, restart TS server.
- `.env.local` change: requires Vite restart (Vite reads env at startup).
- `vite.config.ts` change: Vite auto-restarts.

### 5.3 Debugger Attach

**VS Code / Cursor** (`.vscode/launch.json` is shipped below):
1. `pnpm dev` in terminal.
2. F5 → "Launch Chrome (Vite)" → DevTools breakpoints work in `.tsx` thanks to source maps.

**Chrome DevTools standalone:** open `http://localhost:5173`, DevTools → Sources → `webpack://./src/...` (Vite uses similar virtual paths). Set breakpoints; HMR preserves them.

**React DevTools:** install the [browser extension](https://react.dev/learn/react-developer-tools) — Components and Profiler tabs appear automatically.

### 5.4 Inspecting State at Runtime

| What | How |
|---|---|
| Server state cache | TanStack Query Devtools (mounted in `__root.tsx` in dev) |
| Client state | Zustand devtools middleware → Redux DevTools extension |
| Routes + params | TanStack Router Devtools (mounted in `__root.tsx` in dev) |
| Network | DevTools → Network |
| LocalStorage | DevTools → Application → Storage |

### 5.5 Pre-commit Checks

Husky + lint-staged is overkill here. Use a `pre-push` hook via `simple-git-hooks` (or none — CI catches everything). The CI workflow below is the single source of truth.

A bare-minimum local sanity script:

```bash
pnpm verify       # alias for: typecheck && lint && test --run
```

### 5.6 Branch + Commit Conventions

- Branch: `feat/<short-slug>`, `fix/<short-slug>`, `chore/<short-slug>`.
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Squash-merge to `main`. `main` is always deployable; preview deploys come from PR branches.

---

## 6. Testing & Parallelization

### 6.1 Unit + Component Tests

```bash
pnpm test                 # watch mode
pnpm test --run           # single run (CI uses this)
pnpm test src/lib/utils.test.ts   # one file
pnpm test -t "formats date"        # one test name
pnpm test --coverage      # v8 coverage
```

Tests live next to source: `Button.tsx` → `Button.test.tsx`.

### 6.2 Integration Tests

Same runner. Integration tests mount real route trees via `createMemoryHistory` from TanStack Router and use MSW to mock the network boundary. No separate command.

### 6.3 E2E (Playwright, parallel by default)

```bash
pnpm e2e                  # all browsers, parallel
pnpm e2e --project=chromium
pnpm e2e --ui             # Playwright UI mode
pnpm e2e --headed
pnpm e2e e2e/checkout.spec.ts
pnpm e2e --grep "@smoke"  # tag filter
```

`playwright.config.ts` (shipped below) sets `fullyParallel: true` and `workers: process.env.CI ? 2 : undefined`.

### 6.4 Mocking Rules

- **Mock at the network boundary, never below.** Use MSW; do not mock `fetch` directly, do not mock `src/lib/api.ts`.
- **Never mock TanStack Query** — let it run with MSW handlers; assertions stay realistic.
- **Never mock the router** — use `createMemoryHistory` and a real router instance.
- **Mock time** with `vi.useFakeTimers()` only when the test asserts on time (debounce, retry).

### 6.5 Coverage Target

`80%` lines, `70%` branches, enforced in `vitest.config.ts`. CI fails below threshold. Target is the minimum, not the goal.

### 6.6 Visual Regression

Out of scope by default. If needed, add Playwright `toHaveScreenshot()` tests in `e2e/visual/` — use a separate CI job with `--update-snapshots` PR comment workflow.

### 6.7 Parallelization Patterns for AI Agents

**Safe to fan out (disjoint files):**
- Scaffolding multiple feature folders simultaneously (`features/posts/`, `features/users/`) — different paths.
- Writing unit tests for already-existing modules in different files.
- Adding multiple new shadcn components: each `pnpm dlx shadcn add` writes to its own file in `components/ui/`.

**Must run sequentially (shared state):**
- Anything that mutates `package.json` / `pnpm-lock.yaml` (installs).
- Anything that mutates `tsconfig.json`, `vite.config.ts`, `biome.json`, or `routeTree.gen.ts` is touched.
- Adding a route file: TanStack Router regenerates `routeTree.gen.ts`; race conditions corrupt it.
- Tailwind v4 `@theme` edits in `globals.css`.

---

## 7. Logging

### 7.1 Logger Setup

Browser logging has no canonical structured logger like pino. Ship a thin wrapper that routes to `console` in dev and forwards `warn`/`error` to Sentry in prod.

`src/lib/log.ts`:

```ts
import * as Sentry from '@sentry/react'

type Level = 'debug' | 'info' | 'warn' | 'error'

const ENABLED: Record<Level, boolean> = {
  debug: import.meta.env.DEV,
  info: true,
  warn: true,
  error: true,
}

function emit(level: Level, event: string, fields: Record<string, unknown> = {}) {
  if (!ENABLED[level]) return
  const line = { level, event, ts: new Date().toISOString(), ...fields }
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](JSON.stringify(line))
  if (level === 'warn') Sentry.captureMessage(event, { level: 'warning', extra: fields })
  if (level === 'error') Sentry.captureMessage(event, { level: 'error', extra: fields })
}

export const log = {
  debug: (event: string, fields?: Record<string, unknown>) => emit('debug', event, fields),
  info: (event: string, fields?: Record<string, unknown>) => emit('info', event, fields),
  warn: (event: string, fields?: Record<string, unknown>) => emit('warn', event, fields),
  error: (event: string, fields?: Record<string, unknown>) => emit('error', event, fields),
}
```

### 7.2 Levels

| Level | When |
|---|---|
| `debug` | Dev-only inspection. Stripped in prod. |
| `info` | App boot, route change, user action that succeeded. |
| `warn` | Recoverable surprise (retry succeeded, fallback used). |
| `error` | Unhandled exception, failed mutation, 500 from API. |

### 7.3 Required Fields

Every call: `event` (snake_case verb_noun), `module` (e.g. `posts.api`). Add `request_id`, `user_id`, `route` when applicable.

### 7.4 Sample Log Lines

```
{"level":"info","event":"app_boot","ts":"2026-04-27T12:00:00.000Z","module":"main","build":"a1b2c3"}
{"level":"info","event":"route_navigate","ts":"...","module":"router","from":"/","to":"/posts"}
{"level":"info","event":"query_success","ts":"...","module":"posts.api","query":"posts","ms":182}
{"level":"warn","event":"query_retry","ts":"...","module":"posts.api","attempt":2}
{"level":"error","event":"mutation_failed","ts":"...","module":"posts.api","status":500,"path":"/posts"}
{"level":"info","event":"user_click","ts":"...","module":"checkout","element":"submit"}
```

### 7.5 Where Logs Go

- **Dev:** stdout (browser console).
- **Prod:** Sentry receives `warn`/`error`. Consider PostHog for product analytics (separate channel).

### 7.6 Grepping Logs Locally

```bash
# In dev, filter the browser console:
DevTools → Console → Filter box → "level":"error"
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm typecheck && pnpm lint && pnpm test --run` before declaring a task done.
2. Always fetch server data with TanStack Query (`useQuery`/`useMutation`/`useSuspenseQuery`); never with `useEffect` + `fetch`.
3. Always import from the `@/` alias (never `../../../lib/...`).
4. Always validate API responses with Zod inside `src/lib/api.ts` before returning to callers.
5. Always wrap every route element in an error boundary; the route loader's `errorComponent` is the canonical place.
6. Always co-locate tests with source: `Foo.tsx` ↔ `Foo.test.tsx`.
7. Always use `<Link to="..." />` from `@tanstack/react-router`; never raw `<a href>` for in-app nav.
8. Always run `pnpm dlx shadcn@latest add <component>` to add UI primitives — do not handcraft Radix wrappers.
9. Always prefix browser-public env vars with `VITE_`. If it is not `VITE_*`, it is server-only and the SPA cannot read it.
10. Always re-run `pnpm dev` after editing `.env.local`.
11. Always destructure `useQuery` returns explicitly (`{ data, isPending, isError }`) — never `result.data` style.
12. Always set `staleTime` on every `useQuery` — default is `0` and causes refetch storms.
13. Always invalidate the relevant `queryKey` after a mutation (`queryClient.invalidateQueries({ queryKey: [...] })`).
14. Always pass `signal` from query/mutation context to `fetch` to support cancellation.
15. Always Zod-parse search params using `validateSearch` in TanStack Router routes.
16. Always lazy-load heavy non-critical routes via TanStack Router's automatic code splitting (use file-based routes; do not hand-import).
17. Always run `pnpm e2e` for any change that touches a route, form submission, or auth path.
18. Always review the `dist/` bundle size after a feature: `pnpm build` and check `dist/assets/*.js`. New code over 50 KB gzip needs justification.
19. Always commit `pnpm-lock.yaml`. Never commit `.env.local`, `dist/`, `node_modules/`, `playwright-report/`, `coverage/`.
20. Always import shadcn components via `@/components/ui/<name>`; do not pull from npm packages directly (you own the source).
21. Always set Sentry release to the build SHA in CI so source maps map correctly.
22. Always add a Playwright `@smoke` tag to one E2E per critical flow; CI runs `--grep @smoke` on PRs and full suite on main.

### 8.2 NEVER

1. Never use Next.js APIs, `next/link`, `next/image`, `'use client'`, `app/` directory — this is a Vite SPA, not Next.
2. Never call `fetch` directly inside a component; go through `src/lib/api.ts`.
3. Never store secrets in `VITE_*` vars — every `VITE_*` ships to the browser bundle.
4. Never edit `src/routeTree.gen.ts` by hand — it is regenerated by the router plugin.
5. Never put server-only Node packages (e.g. `bcrypt`, `pg`, `fs`) in `src/` — Vite will fail to bundle.
6. Never import a CommonJS-only library without first checking it ships ESM; if it doesn't, find an ESM alternative.
7. Never use `useEffect` to fetch on mount; use `useQuery`. Effects have no cancellation, no cache, no retry.
8. Never use `<a href>` for internal links (full reload destroys SPA state).
9. Never push to `main` directly; always PR.
10. Never disable React StrictMode in dev — it surfaces unsafe effects and double-mount bugs.
11. Never call hooks conditionally or after an early return.
12. Never put business logic in Zustand — it is for UI flags. Server state belongs in TanStack Query.
13. Never `npm install` analytics SDKs (PostHog/Plausible/GA) — drop the `<script>` in `index.html`.
14. Never rely on `localStorage` for auth tokens — sessions are HttpOnly cookies set by your API.
15. Never enable a service worker by default. PWA is opt-in; without one, every deploy reaches users immediately.
16. Never bypass Biome with inline disables unless paired with a one-line comment explaining why.
17. Never commit `dist/`, `coverage/`, `playwright-report/`, `.vercel/`, `.wrangler/`.
18. Never mock the `useQuery` hook in tests — mock the network with MSW.
19. Never ship a prod build with `import.meta.env.DEV === true` — that would mean Vite was started with `--mode development`.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command | `pnpm install && pnpm typecheck && pnpm test --run && pnpm build` |
| `pnpm-lock.yaml` | install reproducibility | `pnpm install --frozen-lockfile` succeeds |
| `tsconfig.json` | typecheck | `pnpm typecheck` clean; cold `pnpm build` |
| `tsconfig.node.json` | Vite + Vitest config typing | `pnpm typecheck` |
| `vite.config.ts` | dev + build | restart `pnpm dev`; `pnpm build && pnpm preview`; smoke E2E |
| `vitest.config.ts` | unit tests | `pnpm test --run --coverage` |
| `playwright.config.ts` | E2E | `pnpm e2e --reporter=list` |
| `tailwind.config.ts` / `globals.css` | every styled element | visual sweep of `pnpm dev`; cold `pnpm build`; check `dist/assets/*.css` size |
| `biome.json` | lint + format | `pnpm lint` clean; `pnpm format --write` no diff |
| `components.json` | shadcn additions | `pnpm dlx shadcn add button` writes to expected path |
| `src/main.tsx` | app boot | `pnpm dev` — first paint OK; check console for provider errors |
| `src/router.tsx` | every route | `pnpm dev`, click through every top-level route; `pnpm e2e --grep @smoke` |
| `src/routes/__root.tsx` | every route | same as above |
| `src/routes/<file>.tsx` | one route | navigate to that route; route's tests + a smoke E2E |
| `src/routeTree.gen.ts` | router types | NEVER hand-edit; if corrupt, delete + restart `pnpm dev` |
| `src/lib/api.ts` | every network call | full unit test run; smoke E2E that exercises auth + data |
| `src/lib/query-client.ts` | every `useQuery` | unit run; observe devtools cache behavior |
| `src/lib/sentry.ts` | error tracking | trigger a thrown error in dev; verify Sentry event |
| `src/styles/globals.css` | global styles | visual sweep |
| `index.html` | every page (analytics, meta) | view-source on `pnpm preview`; check meta tags |
| `.env.local` / `.env.example` | runtime config | restart dev; verify `import.meta.env.VITE_*` reads correctly |
| `vercel.json` / `wrangler.jsonc` | deploy routing | preview deploy and follow real URL |
| `.github/workflows/ci.yml` | CI guarantees | open a PR; confirm green |
| `src/test/setup.ts` / `handlers.ts` | every unit test | `pnpm test --run` |
| `src/components/ui/*` | every consumer | grep usages; visual sweep + unit tests |
| `public/favicon.svg` etc. | static assets | check `dist/` after build |

### 8.4 Definition of Done

**Bug fix**
- [ ] Failing test added that reproduces the bug.
- [ ] Fix applied; new test passes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test --run` green.
- [ ] If user-visible: one Playwright assertion covers the corrected behavior.
- [ ] Screenshot or log evidence in PR description.

**New feature**
- [ ] Route(s) added under `src/routes/`.
- [ ] Query/mutation hook in `src/features/<x>/<x>.api.ts` with Zod-validated response.
- [ ] Component(s) in `src/features/<x>/`, with tests.
- [ ] One `@smoke` Playwright spec exercising the happy path.
- [ ] `pnpm build` succeeds; new gzipped bundle delta noted in PR.
- [ ] Manual click-through in `pnpm dev`.

**Refactor**
- [ ] Behavior unchanged: existing tests pass with no edits.
- [ ] No public API surface drift unless intended.
- [ ] Build size delta within ±5%.

**Dependency bump**
- [ ] `pnpm up <pkg>` (single package); commit lockfile.
- [ ] Read changelog; flag breaking changes in PR.
- [ ] Full verify: typecheck, lint, unit, e2e.
- [ ] Cold `pnpm install --frozen-lockfile` works.

**Schema change** (Zod schema for an API response)
- [ ] Update `*.types.ts` and the Zod schema together.
- [ ] Rerun any unit tests that hit the schema.
- [ ] Coordinate with the API repo: don't ship until both deployed.

**Copy change**
- [ ] Edit text in component or i18n bundle.
- [ ] Visual sweep of affected route(s).
- [ ] No test churn unless tests assert on copy (rare; prefer role-based queries).

### 8.5 Self-Verification Recipe

Run, in order, on the project root:

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test --run
pnpm e2e --grep @smoke
pnpm build
```

Expected output:

```
$ pnpm install --frozen-lockfile
Lockfile is up to date, resolution step is skipped
Already up to date

$ pnpm typecheck
> tsc -b --noEmit
(no output, exit 0)

$ pnpm lint
> biome check .
Checked N files in Xms. No fixes needed.

$ pnpm test --run
 ✓ ... (N tests)
 Test Files  N passed (N)
      Tests  N passed (N)

$ pnpm e2e --grep @smoke
Running N tests using 2 workers
  N passed (Xs)

$ pnpm build
✓ N modules transformed.
dist/index.html                   0.5 kB
dist/assets/index-[hash].css     XX.X kB │ gzip: X.X kB
dist/assets/index-[hash].js     XXX.X kB │ gzip: XX.X kB
✓ built in X.XXs
```

Any non-zero exit code = task is not done.

### 8.6 Parallelization Patterns

| Pattern | Safe? | Notes |
|---|---|---|
| Two agents creating different feature folders | Yes | Disjoint paths. |
| Two agents adding different shadcn components | Yes | Each `add` writes a single file in `components/ui/`. |
| One agent adding a route + another editing same `__root.tsx` | No | `routeTree.gen.ts` write race; serialize. |
| Agents installing packages concurrently | No | Lockfile race; one install at a time. |
| One agent edits `vite.config.ts` while another runs `pnpm dev` | No | Vite restarts mid-task; serialize. |
| Two agents writing tests for different modules | Yes | Files don't overlap. |
| Agents editing `tailwind.config.ts` / `globals.css` simultaneously | No | Shared theme tokens; serialize. |

---

## 9. Stack-Specific Pitfalls

1. **Agent reaches for Next.js APIs.** Symptom: `'use client'` at top of file, `next/link` imports. Cause: training data bias toward Next. Fix: delete the directive; replace with `import { Link } from '@tanstack/react-router'`. Detect early: Biome custom rule (or grep) bans `from "next/`.

2. **`useEffect` for data fetching.** Symptom: effects with `fetch().then(setState)`, race conditions on re-renders, no caching. Cause: bare React habits. Fix: replace with `useQuery({ queryKey, queryFn })`. Detect: PR review checklist; Biome rule restricting raw `fetch` outside `src/lib/api.ts`.

3. **`VITE_*` secret leak.** Symptom: API key visible in `view-source → /assets/index-*.js`. Cause: confusion that "env var" means private. Fix: rotate the key, delete the var, move it server-side. Detect: pre-deploy script `grep -r "VITE_.*SECRET\|VITE_.*KEY" src/` warns on suspicious names.

4. **CommonJS-only dep won't bundle.** Symptom: `Cannot use import statement outside a module` or `default is not a function`. Cause: package ships only CJS. Fix: find ESM alternative or wrap with `optimizeDeps.include`. Detect: `pnpm build` fails; check the package's `exports` field on npm.

5. **Hand-edited `routeTree.gen.ts`.** Symptom: types out of sync, dev server warnings, vanished routes after restart. Cause: agent treated it as source. Fix: revert the file; restart dev server; let the plugin regenerate. Detect: file header says `DO NOT EDIT`; CI fails diff if hand-edited.

6. **Tailwind class not applied.** Symptom: utility appears nowhere on the element. Cause: Tailwind v4 didn't see the file (custom path), or class is dynamic string Tailwind can't statically extract. Fix: ensure `@import "tailwindcss"` is in `globals.css`; replace dynamic `\`text-${color}-500\`` with explicit map. Detect: `pnpm build` produces small CSS bundle; missing classes in DevTools.

7. **shadcn `cn()` import path wrong.** Symptom: TS error `Cannot find module '@/lib/utils'`. Cause: alias not configured in `vite.config.ts` AND `tsconfig.json`. Fix: both must have the alias (Vite for build, TS for types). Detect: `pnpm typecheck` fails immediately.

8. **Stale TanStack Query data.** Symptom: mutation succeeds but list doesn't update. Cause: missing `invalidateQueries` in `onSuccess`. Fix: call `queryClient.invalidateQueries({ queryKey: ['posts'] })`. Detect: E2E that creates an item and asserts it appears.

9. **Hydration-style flash of wrong UI.** Symptom: Brief content flash before redirect on protected routes. Cause: rendered first, redirect inside `useEffect`. Fix: use TanStack Router `beforeLoad` to throw `redirect()` before render. Detect: visual flash in dev; E2E with `expect(page).toHaveURL` immediately after navigation.

10. **Dev works, prod 404 on refresh.** Symptom: `/posts/123` → 404 on Cloudflare/Vercel. Cause: SPA fallback not configured. Fix: `wrangler.jsonc` `not_found_handling: "single-page-application"` for CF, or `vercel.json` rewrite for Vercel (configs below). Detect: `pnpm preview` then refresh on a non-root path.

11. **Sentry source maps not symbolicating.** Symptom: stack traces show `index-abc123.js:1`. Cause: vite-plugin not uploading or release SHA mismatch. Fix: set `SENTRY_AUTH_TOKEN`; ensure `release` matches CI build SHA. Detect: trigger a test error in prod, inspect Sentry event.

12. **`import.meta.env` undefined in tests.** Symptom: `Cannot read properties of undefined (reading 'VITE_API_URL')`. Cause: Vitest needs `define` or `loadEnv`. Fix: set `define` in `vitest.config.ts`, or call `loadEnv` (config below already handles this). Detect: any test that touches `src/lib/api.ts`.

13. **Slow CI from Playwright cold install.** Symptom: 5+ min install of browsers each run. Cause: no cache. Fix: cache `~/.cache/ms-playwright` keyed by `pnpm-lock.yaml` (workflow below). Detect: CI logs show "Downloading Chromium".

14. **Mixed pnpm + npm.** Symptom: `package-lock.json` appears; `node_modules` re-resolves. Cause: agent ran `npm install` once. Fix: delete `package-lock.json` and `node_modules`; `pnpm install`. Detect: `.gitignore` doesn't include `package-lock.json`; CI fails on `--frozen-lockfile`.

15. **Strict mode double-fetch confusion.** Symptom: queries fire twice in dev. Cause: React StrictMode mounts twice in dev. Fix: this is correct; do NOT remove StrictMode. TanStack Query dedupes; harmless. Detect: prod build doesn't double-fire.

16. **Biome formats break Tailwind class order.** Symptom: PR diff is mostly class reordering. Cause: Biome and Tailwind plugin formatters disagree. Fix: enable Biome's Tailwind sort assist (`useSortedClasses`); pick one and stick with it. Detect: noisy diffs.

17. **`@vitejs/plugin-react` Babel slowness in build.** Symptom: cold build > 30s. Cause: still on Babel-based plugin while available. Fix: ensure Vite 8 default React plugin runs (Rolldown path); if not, swap to `@vitejs/plugin-react-swc` for big repos. Detect: time `pnpm build`.

18. **TanStack Router `validateSearch` type drift.** Symptom: search params typed as `unknown` downstream. Cause: passed plain object schema instead of Zod. Fix: pass a Zod schema and use `zodValidator()` adapter. Detect: tsc errors in route component.

19. **E2E flake from animations.** Symptom: random failures at modal/toast assertions. Cause: animation-in delay. Fix: in `playwright.config.ts` set `expect: { timeout: 7000 }` and use Playwright's auto-waiting locators. Detect: same test failing intermittently.

20. **Sentry double-load via wrong init path.** Symptom: every error reported twice. Cause: `Sentry.init` called in both `main.tsx` and a route. Fix: init exactly once at boot. Detect: Sentry duplicate events.

---

## 10. Performance Budgets

| Budget | Target | Measure |
|---|---|---|
| Cold dev start | < 1.5 s | `time pnpm dev` until "ready in" |
| Cold prod build | < 20 s | `time pnpm build` |
| Initial JS (gzipped) | < 150 KB | `dist/assets/index-*.js.gz` |
| Initial CSS (gzipped) | < 20 KB | `dist/assets/index-*.css.gz` |
| LCP on 4G simulated | < 2.5 s | Chrome DevTools Lighthouse |
| TTI on 4G simulated | < 3.5 s | Lighthouse |
| Memory steady-state | < 80 MB | DevTools → Memory → Heap snapshot after 1 min idle |
| 60 fps interactions | no long tasks > 50 ms | DevTools → Performance recording |

When a budget is exceeded:
1. Run `pnpm build -- --mode=analyze` (with `rollup-plugin-visualizer` enabled in `vite.config.ts`).
2. Find the largest chunks; lazy-load via TanStack Router file-based code splitting (rename to `lazy.tsx` or use `defer()`).
3. Replace heavy deps (e.g. `moment` → `date-fns`).
4. Move analytics to deferred `<script defer>` in `index.html`.

---

## 11. Security

### 11.1 Secret Storage

- `.env.local` (gitignored) for dev. Contents: ONLY `VITE_*` public values.
- Never commit any `.env*` except `.env.example` (placeholders only).
- Real secrets (DB URLs, API keys for paid providers, Sentry auth tokens for CI) live in:
  - GitHub Actions secrets (CI).
  - Cloudflare Pages env vars (deploy).
  - Vercel project env vars (deploy).
- The browser bundle has NO mechanism to keep a secret. Treat the SPA as fully public code.

### 11.2 Auth Threat Model

- Cookies are HttpOnly, Secure, SameSite=Lax, set by your API on the same eTLD+1 (or via CORS with credentials).
- The SPA cannot read tokens. Logout = `POST /auth/logout`; the API clears the cookie.
- CSRF: API requires either same-site cookie + safe methods only on idempotent endpoints, or a CSRF header on mutations (your API decides; document the header in `src/lib/api.ts`).

### 11.3 Input Validation Boundary

All input crosses Zod twice:
1. On submit: `react-hook-form` resolver validates client-side for UX.
2. On the API: server re-validates (separate concern, separate repo).

### 11.4 Output Escaping

React escapes by default in JSX. Never use `dangerouslySetInnerHTML`. If markdown rendering is needed, sanitize via `DOMPurify` or use a pre-sanitized server-side markdown.

### 11.5 Permissions / CSP

Ship a Content Security Policy via your hosting provider's headers:

`public/_headers` (Cloudflare Pages):

```
/*
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://*.sentry.io https://app.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://*.sentry.io https://app.posthog.com https://api.example.com; font-src 'self' data:
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
```

`vercel.json` `headers` block achieves the same on Vercel (config below).

### 11.6 Dependency Audit

```bash
pnpm audit --prod          # weekly via cron in CI
pnpm outdated              # quarterly review
```

CI fails on high/critical vulns in prod deps.

### 11.7 Stack-Specific Top 5 Risks

1. Putting any secret in a `VITE_*` var → leaks to every visitor.
2. `dangerouslySetInnerHTML` with user-controlled HTML → XSS.
3. CORS misconfigured on the API (`Access-Control-Allow-Origin: *` + credentials) → token theft.
4. Unrestricted CSP → script injection escalates trivially.
5. Forgotten `console.log` of PII in prod → logs become a liability.

---

## 12. Deploy

### 12.1 Cloudflare Pages (primary)

`wrangler.jsonc` at repo root:

```jsonc
{
  "name": "my-app",
  "compatibility_date": "2026-04-01",
  "pages_build_output_dir": "dist",
  "assets": {
    "not_found_handling": "single-page-application"
  }
}
```

Connect repo via Cloudflare dashboard → Pages → "Connect to Git". Build command: `pnpm build`. Build output: `dist`. Node version: `24`. Set env vars in dashboard (`VITE_API_URL`, `VITE_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`).

CI deploy (alternative to dashboard build): use `cloudflare/wrangler-action@v3` in the GitHub workflow (already wired below).

### 12.2 Vercel (fallback)

`vercel.json` at repo root:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" }
      ]
    }
  ]
}
```

### 12.3 Staging vs Prod

- `main` branch → production URL.
- Every PR → preview URL (auto on both CF Pages and Vercel).
- No separate staging branch needed.

### 12.4 Rollback

Cloudflare Pages: dashboard → Deployments → click prior green deploy → "Rollback". Window: any prior deployment retained (default 30 days).

Vercel: dashboard → Deployments → "Promote to Production" on prior deploy.

CLI rollback not recommended; the dashboard is the audit trail.

### 12.5 Health Check

After every deploy, the CI smoke job runs:

```bash
curl -fsS https://app.example.com/healthz.txt
# Expected: "ok"
```

Where `/healthz.txt` is just a file in `public/` that says `ok`. The SPA fallback won't catch it because it's a real asset.

### 12.6 Versioning

Version lives in `package.json` `version`. Use Conventional Commits + `release-please` (or manual bumps) for changelog. Display the version in-app via a build-time inject:

`vite.config.ts` `define: { __APP_VERSION__: JSON.stringify(pkg.version), __APP_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? 'dev') }`.

### 12.7 Auto-Update / Cache

- HTML never cached (`Cache-Control: no-cache`).
- `/assets/*` cached `public, max-age=31536000, immutable` (filenames are content-hashed).
- Result: next reload after deploy fetches the new HTML, which references the new hashed JS. No service worker, no stuck clients.

`public/_headers` (CF Pages):

```
/index.html
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### 12.8 Cost Estimate per 1k MAU

- **Cloudflare Pages**: free tier covers 500 builds/mo + unlimited bandwidth. ~$0/mo at 1k MAU.
- **Vercel**: Hobby is free for personal; Pro $20/user/mo if commercial. Bandwidth budget 1 TB on Pro. ~$0–$20/mo at 1k MAU.
- **Sentry**: free tier 5k errors/mo. Likely free at 1k MAU.

Total typical cost at 1k MAU: **$0–$20/mo**. Domain extra ($10–$15/yr).

---

## 13. Claude Code Integration

### 13.1 `CLAUDE.md` (paste into repo root)

```md
# Claude Code instructions for this repo

This is a Vite + React 19 + TypeScript SPA. The full rulebook lives at `rulebooks/vite-react.md`. Read it once per session before non-trivial work.

## Boot commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Preview prod build: `pnpm preview`

## Verification (run before declaring done)
- `pnpm typecheck`
- `pnpm lint`
- `pnpm test --run`
- `pnpm e2e --grep @smoke`

## Banned patterns
- No `next/*`, no `'use client'`, no `app/` directory — this is NOT Next.
- No raw `fetch` in components — go through `src/lib/api.ts` and TanStack Query.
- No `useEffect` for data fetching — use `useQuery`.
- No `<a href>` for in-app navigation — use `<Link>` from `@tanstack/react-router`.
- No edits to `src/routeTree.gen.ts` — it is generated.
- No secrets in `VITE_*` env vars — they ship to the browser.
- No `package-lock.json` — pnpm only.

## Where things go
- New page: `src/routes/<path>.tsx`
- New feature: `src/features/<name>/`
- New shadcn primitive: `pnpm dlx shadcn@latest add <name>`
- New env var: `.env.example` + `.env.local`, prefix `VITE_` only if browser-public.

## Skills to invoke
- `/test-driven-development` for any new feature.
- `/systematic-debugging` for any bug.
- `/verification-before-completion` before saying "done".
- `/ship` to open a PR.
```

### 13.2 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm i:*)",
      "Bash(pnpm dev:*)",
      "Bash(pnpm build:*)",
      "Bash(pnpm preview:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm format:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm e2e:*)",
      "Bash(pnpm verify:*)",
      "Bash(pnpm dlx shadcn*)",
      "Bash(pnpm dlx playwright*)",
      "Bash(pnpm up:*)",
      "Bash(pnpm outdated:*)",
      "Bash(pnpm audit:*)",
      "Bash(pnpm exec:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(gh pr*)",
      "Bash(node:*)",
      "Bash(rm -rf node_modules:*)",
      "Bash(rm -rf dist:*)"
    ],
    "deny": [
      "Bash(rm -rf /:*)",
      "Bash(npm install:*)",
      "Bash(yarn:*)",
      "Bash(git push --force:*)",
      "Bash(git push -f:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm exec biome check --write --no-errors-on-unmatched ${CLAUDE_FILE_PATH:-.} >/dev/null 2>&1 || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm typecheck >/dev/null 2>&1 && pnpm lint >/dev/null 2>&1 && echo 'verify: ok' || echo 'verify: failed (run `pnpm verify` to see why)'" }
        ]
      }
    ]
  }
}
```

### 13.3 Slash commands worth using

- `/test-driven-development` — write failing test, then implement.
- `/systematic-debugging` — root-cause first; no shotgun fixes.
- `/verification-before-completion` — runs the recipe in §8.5.
- `/ship` — opens a PR with the conventional title and body.
- `/review` — pre-merge diff review against `main`.

---

## 14. Codex Integration

### 14.1 `AGENTS.md` (repo root)

```md
# Codex instructions for this repo

Read `rulebooks/vite-react.md` before any non-trivial change.

## Stack
Vite 8 + React 19 + TypeScript 6 SPA. TanStack Router (file-based) + TanStack Query. Zustand. shadcn/ui + Tailwind v4. Vitest + Playwright. Biome. Cloudflare Pages or Vercel deploy.

## Commands
- `pnpm install`
- `pnpm dev` / `pnpm build` / `pnpm preview`
- `pnpm typecheck` / `pnpm lint` / `pnpm format`
- `pnpm test --run` / `pnpm e2e`

## Hard rules
- No Next.js APIs. No `'use client'`. No `app/` directory.
- No raw `fetch` in components — `src/lib/api.ts` + TanStack Query.
- No `useEffect` for fetching. Ever.
- Never edit `src/routeTree.gen.ts`.
- Never put secrets in `VITE_*`.
- pnpm only — no `npm install` / `yarn`.
- Verify before reporting done: `pnpm typecheck && pnpm lint && pnpm test --run`.

## Done means
Typecheck green, lint green, tests green, and (if user-facing) a Playwright `@smoke` exists for the change.
```

### 14.2 `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[shell_environment_policy]
inherit = "core"

[projects."."]
trust_level = "trusted"
```

### 14.3 Codex vs Claude Code differences

- Codex's sandbox blocks network by default; preview deploys (`vercel`, `wrangler deploy`) require approval on each run — that is intended.
- Codex tends to over-edit when run on large diffs; scope each task to a single feature folder.
- Codex doesn't read `.claude/settings.json`; mirror your rules in `AGENTS.md`.

---

## 15. Cursor / Other Editors

### 15.1 `.cursor/rules`

```
# Cursor rules — Vite + React + TS SPA

ALWAYS:
- Read rulebooks/vite-react.md before non-trivial edits.
- Use TanStack Query for all data fetching.
- Use TanStack Router <Link> for all in-app navigation.
- Validate API responses with Zod inside src/lib/api.ts.
- Place new routes under src/routes/ (file-based).
- Place feature code under src/features/<name>/.
- Use shadcn CLI to add UI primitives.
- Run `pnpm typecheck && pnpm lint && pnpm test --run` before declaring done.

NEVER:
- Use Next.js APIs, `'use client'`, `next/link`, `next/image`.
- Put secrets in VITE_* env vars.
- Edit src/routeTree.gen.ts manually.
- Use useEffect for data fetching.
- Use raw fetch outside src/lib/api.ts.
- Use <a href> for in-app navigation.
- Mix npm/yarn — pnpm only.
- Mock useQuery in tests; use MSW.

STYLE:
- TypeScript strict. No `any` (use `unknown` + Zod).
- Functional components, hooks only.
- Co-locate tests next to source as *.test.tsx.
- Imports use `@/` alias.

VERIFY BEFORE DONE:
- pnpm typecheck
- pnpm lint
- pnpm test --run
- pnpm e2e --grep @smoke (for UI changes)
```

### 15.2 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer",
    "dbaeumer.vscode-eslint",
    "tanstack.tanstack-router",
    "yoavbls.pretty-ts-errors",
    "usernamehw.errorlens"
  ],
  "unwantedRecommendations": [
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint"
  ]
}
```

### 15.3 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome (Vite)",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Vitest current file",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal",
      "smartStep": true
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create the following files, in this order, on a fresh `pnpm create vite@latest my-app --template react-ts` project. After `git push`, the included GitHub Actions workflow runs CI; on green, deploy.

### 16.1 `package.json`

```json
{
  "name": "my-app",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=10.0.0"
  },
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "typecheck": "tsc -b --noEmit",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test": "vitest",
    "e2e": "playwright test",
    "e2e:install": "playwright install --with-deps",
    "verify": "pnpm typecheck && pnpm lint && pnpm test --run"
  },
  "dependencies": {
    "@hookform/resolvers": "^5.1.1",
    "@sentry/react": "^10.50.0",
    "@tanstack/react-query": "^5.100.5",
    "@tanstack/react-query-devtools": "^5.100.5",
    "@tanstack/react-router": "latest",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^0.460.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-error-boundary": "^4.1.2",
    "react-hook-form": "^7.60.0",
    "tailwind-merge": "^2.5.4",
    "zod": "^3.25.76",
    "zustand": "^5.0.12"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.0",
    "@playwright/test": "^1.59.1",
    "@sentry/vite-plugin": "^5.2.0",
    "@tailwindcss/vite": "^4.2.0",
    "@tanstack/router-devtools": "latest",
    "@tanstack/router-plugin": "latest",
    "@testing-library/dom": "^10.4.0",
    "@testing-library/jest-dom": "^6.6.3",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "@types/node": "^24.0.0",
    "@types/react": "^19.2.0",
    "@types/react-dom": "^19.2.0",
    "@vitejs/plugin-react": "^5.0.0",
    "jsdom": "^25.0.1",
    "msw": "^2.13.4",
    "tailwindcss": "^4.2.0",
    "typescript": "^6.0.3",
    "vite": "^8.0.8",
    "vite-plugin-checker": "^0.13.0",
    "vitest": "^4.1.4"
  }
}
```

### 16.2 `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ]
}
```

### 16.3 `tsconfig.app.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "useDefineForClassFields": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] },
    "types": ["vite/client", "@testing-library/jest-dom"]
  },
  "include": ["src", "src/**/*.test.ts", "src/**/*.test.tsx"]
}
```

### 16.4 `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.node.tsbuildinfo",
    "target": "ES2023",
    "lib": ["ES2023"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "isolatedModules": true,
    "moduleDetection": "force",
    "noEmit": true,
    "strict": true,
    "skipLibCheck": true,
    "types": ["node"]
  },
  "include": ["vite.config.ts", "vitest.config.ts", "playwright.config.ts"]
}
```

### 16.5 `vite.config.ts`

```ts
import path from 'node:path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import tailwindcss from '@tailwindcss/vite'
import checker from 'vite-plugin-checker'
import { sentryVitePlugin } from '@sentry/vite-plugin'
// @ts-expect-error - JSON import without resolveJsonModule on this side
import pkg from './package.json' with { type: 'json' }

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [
      TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
      react(),
      tailwindcss(),
      checker({
        typescript: true,
        biome: { command: 'check', dev: { logLevel: ['error'] } },
      }),
      env.SENTRY_AUTH_TOKEN && {
        ...sentryVitePlugin({
          authToken: env.SENTRY_AUTH_TOKEN,
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          telemetry: false,
        }),
        apply: 'build',
      },
    ].filter(Boolean),
    resolve: {
      alias: { '@': path.resolve(__dirname, './src') },
    },
    define: {
      __APP_VERSION__: JSON.stringify(pkg.version),
      __APP_SHA__: JSON.stringify(process.env.GITHUB_SHA ?? 'dev'),
    },
    build: {
      target: 'es2022',
      sourcemap: true,
    },
    server: {
      port: 5173,
      strictPort: false,
    },
  }
})
```

### 16.6 `vitest.config.ts`

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      css: true,
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html', 'lcov'],
        thresholds: { lines: 80, branches: 70, functions: 80, statements: 80 },
        exclude: ['**/*.config.*', '**/routeTree.gen.ts', 'e2e/**', 'src/test/**'],
      },
    },
  }),
)
```

### 16.7 `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  expect: { timeout: 7000 },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
  webServer: {
    command: 'pnpm preview --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
})
```

### 16.8 `tailwind.config.ts`

Tailwind v4 reads config from CSS, but keep this file so the IDE plugin sees content paths and you have a place for plugins.

```ts
import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
} satisfies Config
```

### 16.9 `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "files": {
    "includes": ["**/*.ts", "**/*.tsx", "**/*.json", "**/*.jsonc"],
    "ignore": ["dist", "coverage", "playwright-report", "src/routeTree.gen.ts"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useExhaustiveDependencies": "error",
        "useHookAtTopLevel": "error"
      },
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "warn"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "nursery": {
        "useSortedClasses": { "level": "warn", "options": { "functions": ["clsx", "cva", "cn"] } }
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "asNeeded",
      "trailingCommas": "all"
    }
  }
}
```

### 16.10 `components.json` (shadcn)

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks",
    "utils": "@/lib/utils"
  },
  "iconLibrary": "lucide"
}
```

### 16.11 `.env.example`

```bash
# Public — ships to browser. Never put secrets here.
VITE_API_URL=http://localhost:8787
VITE_SENTRY_DSN=

# Build-time only (not exposed to client). Set these in CI / hosting dashboard.
SENTRY_AUTH_TOKEN=
SENTRY_ORG=
SENTRY_PROJECT=
```

### 16.12 `index.html`

```html
<!doctype html>
<html lang="en" class="dark">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0a0a0a" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

### 16.13 `src/main.tsx`

```tsx
import './styles/globals.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from '@tanstack/react-router'
import { ErrorBoundary } from 'react-error-boundary'
import { initSentry } from '@/lib/sentry'
import { queryClient } from '@/lib/query-client'
import { router } from '@/router'

initSentry()

const rootEl = document.getElementById('root')
if (!rootEl) throw new Error('root element missing')

createRoot(rootEl).render(
  <StrictMode>
    <ErrorBoundary fallback={<div className="p-8">Something went wrong.</div>}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
)
```

### 16.14 `src/router.tsx`

```ts
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
```

### 16.15 `src/routes/__root.tsx`

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/router-devtools'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-3xl p-6">
        <Outlet />
      </main>
      {import.meta.env.DEV ? (
        <>
          <TanStackRouterDevtools />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      ) : null}
    </div>
  )
}
```

### 16.16 `src/routes/index.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Home,
})

function Home() {
  return (
    <section className="space-y-4">
      <h1 className="text-3xl font-bold">Hello, Vite + React</h1>
      <p className="text-muted-foreground">Edit src/routes/index.tsx and save.</p>
    </section>
  )
}
```

### 16.17 `src/lib/query-client.ts`

```ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### 16.18 `src/lib/api.ts`

```ts
import { z } from 'zod'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  constructor(public status: number, message: string, public body?: unknown) {
    super(message)
  }
}

export async function api<T>(
  path: string,
  init: RequestInit & { schema: z.ZodType<T> },
): Promise<T> {
  const { schema, ...rest } = init
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: 'include',
    headers: { 'content-type': 'application/json', ...rest.headers },
    ...rest,
  })
  const text = await res.text()
  const json = text ? JSON.parse(text) : null
  if (!res.ok) throw new ApiError(res.status, res.statusText, json)
  return schema.parse(json)
}
```

### 16.19 `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

### 16.20 `src/lib/sentry.ts`

```ts
import * as Sentry from '@sentry/react'

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN
  if (!dsn) return
  Sentry.init({
    dsn,
    release: __APP_SHA__,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.0,
    replaysOnErrorSampleRate: 1.0,
  })
}

declare global {
  // eslint-disable-next-line no-var
  var __APP_SHA__: string
  // eslint-disable-next-line no-var
  var __APP_VERSION__: string
}
```

### 16.21 `src/styles/globals.css`

```css
@import "tailwindcss";

@theme {
  --color-background: oklch(0.98 0 0);
  --color-foreground: oklch(0.18 0 0);
  --color-muted: oklch(0.96 0 0);
  --color-muted-foreground: oklch(0.45 0 0);
  --color-border: oklch(0.92 0 0);
}

@layer base {
  html, body, #root { height: 100%; }
  body { @apply bg-background text-foreground antialiased; }
}
```

### 16.22 `src/test/setup.ts`

```ts
import '@testing-library/jest-dom/vitest'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())
```

### 16.23 `src/test/handlers.ts`

```ts
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('*/health', () => HttpResponse.json({ ok: true })),
]
```

### 16.24 `e2e/home.spec.ts`

```ts
import { expect, test } from '@playwright/test'

test('@smoke home renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: /hello/i })).toBeVisible()
})
```

### 16.25 `public/_headers` (CF Pages)

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
/index.html
  Cache-Control: no-cache
/assets/*
  Cache-Control: public, max-age=31536000, immutable
```

### 16.26 `public/_redirects` (CF Pages SPA fallback if not using wrangler.jsonc)

```
/*  /index.html  200
```

### 16.27 `wrangler.jsonc`

```jsonc
{
  "name": "my-app",
  "compatibility_date": "2026-04-01",
  "pages_build_output_dir": "dist",
  "assets": { "not_found_handling": "single-page-application" }
}
```

### 16.28 `vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "rewrites": [{ "source": "/(.*)", "destination": "/" }]
}
```

### 16.29 `.gitignore`

```
node_modules
dist
coverage
playwright-report
test-results
.vercel
.wrangler
.env
.env.local
.env.*.local
*.log
.DS_Store
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
```

### 16.30 `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request:

concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --run --coverage
      - uses: actions/upload-artifact@v4
        if: always()
        with: { name: coverage, path: coverage }

  e2e:
    runs-on: ubuntu-latest
    needs: verify
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with:
          node-version: 24
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - name: Playwright browsers cache
        id: pw-cache
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: ${{ runner.os }}-playwright-${{ hashFiles('pnpm-lock.yaml') }}
      - if: steps.pw-cache.outputs.cache-hit != 'true'
        run: pnpm e2e:install
      - run: pnpm build
      - run: pnpm e2e ${{ github.event_name == 'pull_request' && '--grep @smoke' || '' }}
        env:
          VITE_API_URL: http://localhost:8787
      - uses: actions/upload-artifact@v4
        if: failure()
        with: { name: playwright-report, path: playwright-report }

  deploy:
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    needs: [verify, e2e]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
          SENTRY_AUTH_TOKEN: ${{ secrets.SENTRY_AUTH_TOKEN }}
          SENTRY_ORG: ${{ secrets.SENTRY_ORG }}
          SENTRY_PROJECT: ${{ secrets.SENTRY_PROJECT }}
      - name: Deploy to Cloudflare Pages
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist --project-name=my-app --branch=main
      - name: Smoke
        run: |
          curl -fsS https://my-app.pages.dev/healthz.txt || exit 1
```

### 16.31 `public/healthz.txt`

```
ok
```

### 16.32 `README.md` (stub)

```md
# My App

Vite + React 19 + TypeScript SPA.

## Dev
```sh
pnpm install
pnpm dev
```

See `rulebooks/vite-react.md` for full conventions.
```

After all files are committed and `git push origin main` runs, GitHub Actions verifies + deploys. The live URL serves a hello-world.

---

## 17. Idea → MVP Path

When `PROJECT_IDEA` is provided, fill in the data model. This template assumes a generic CRUD app.

### Phase 1 — Schema (1 session)

Files: `src/features/<entity>/<entity>.types.ts`, `<entity>.api.ts` (Zod schemas).

Define every entity as a Zod schema; derive TS types via `z.infer`. Exit criteria: every API response in scope has a Zod schema with at least one passing parse test.

### Phase 2 — Backbone (1 session)

Files: `src/routes/<entity>/index.tsx`, `src/routes/<entity>/$id.tsx`, `src/routes/__root.tsx` (nav).

Build the route shell for every screen, with placeholder content. No data yet. Exit criteria: every URL renders without runtime error; navigation works via `<Link>`.

### Phase 3 — Vertical Slice (2 sessions)

Files: one feature folder, end-to-end. `<entity>.api.ts` (`useList`, `useOne`, `useCreate`), components, one Vitest, one `@smoke` Playwright.

Pick the most central entity. Wire list, detail, create. Exit criteria: user can create one, see it in the list, navigate to detail. CI green.

### Phase 4 — Auth + Multi-User (1–2 sessions)

Files: `src/features/auth/*.api.ts`, `src/routes/login.tsx`, `src/routes/_authed.tsx` (route group), `beforeLoad` guards.

Add login form, wire `/me` query, gate routes via TanStack Router `beforeLoad` redirect. Exit criteria: unauthenticated visit to `/dashboard` redirects to `/login`; after login, redirected back.

### Phase 5 — Ship + Monitor (1 session)

Files: `wrangler.jsonc` or `vercel.json`, `public/_headers`, Sentry DSN configured, GitHub secrets set.

Push to `main`. Verify deploy. Trigger a fake error; verify Sentry receives it. Exit criteria: live URL works for a logged-in user; error tracking captures a forced exception.

---

## 18. Feature Recipes

### 18.1 Authentication (cookie-based)

`src/features/auth/auth.api.ts`:

```ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { z } from 'zod'
import { api } from '@/lib/api'

const meSchema = z.object({ id: z.string(), email: z.string().email() }).nullable()
export type Me = z.infer<typeof meSchema>

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<Me>('/me', { schema: meSchema }),
    staleTime: 60_000,
    retry: false,
  })
}

const loginSchema = z.object({ ok: z.literal(true) })
export function useLogin() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { email: string; password: string }) =>
      api('/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
        schema: loginSchema,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  })
}

export function useLogout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api('/auth/logout', { method: 'POST', schema: loginSchema }),
    onSuccess: () => qc.setQueryData(['me'], null),
  })
}
```

`src/routes/_authed.tsx` (protected route group):

```tsx
import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { queryClient } from '@/lib/query-client'
import { api } from '@/lib/api'
import { z } from 'zod'

const meSchema = z.object({ id: z.string() }).nullable()

export const Route = createFileRoute('/_authed')({
  beforeLoad: async () => {
    const me = await queryClient.fetchQuery({
      queryKey: ['me'],
      queryFn: () => api('/me', { schema: meSchema }),
    })
    if (!me) throw redirect({ to: '/login' })
  },
  component: () => <Outlet />,
})
```

### 18.2 File Upload

```ts
export function useUpload() {
  return useMutation({
    mutationFn: async (file: File) => {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch(`${import.meta.env.VITE_API_URL}/upload`, {
        method: 'POST',
        body: fd,
        credentials: 'include',
      })
      if (!res.ok) throw new Error('upload failed')
      return res.json() as Promise<{ url: string }>
    },
  })
}
```

### 18.3 Stripe Checkout (server-driven)

```ts
export function useCheckout() {
  return useMutation({
    mutationFn: async (priceId: string) => {
      const { url } = await api<{ url: string }>('/stripe/checkout', {
        method: 'POST',
        body: JSON.stringify({ priceId }),
        schema: z.object({ url: z.string().url() }),
      })
      window.location.assign(url)
    },
  })
}
```

The SPA never touches Stripe keys. Your API creates the session and returns the redirect URL.

### 18.4 Push Notifications (Web Push)

`src/lib/push.ts`:

```ts
export async function subscribeToPush(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return null
  const reg = await navigator.serviceWorker.register('/sw.js')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') return null
  return reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: import.meta.env.VITE_VAPID_PUBLIC_KEY,
  })
}
```

Ship a minimal `public/sw.js`. Send the subscription to your API.

### 18.5 Background Jobs / Cron

Out of scope on the client — schedule on your API or use Cloudflare Cron Triggers in a sibling Worker repo.

### 18.6 Realtime (SSE)

```ts
export function useEvents(onMessage: (e: MessageEvent) => void) {
  useEffect(() => {
    const es = new EventSource(`${import.meta.env.VITE_API_URL}/events`, { withCredentials: true })
    es.onmessage = onMessage
    return () => es.close()
  }, [onMessage])
}
```

Effects ARE allowed for non-fetch subscriptions like SSE/WebSocket lifecycles.

### 18.7 Search

Use TanStack Query with debounced input:

```ts
const [q, setQ] = useState('')
const debounced = useDebounce(q, 250)
const { data } = useQuery({
  queryKey: ['search', debounced],
  queryFn: () => api('/search?q=' + encodeURIComponent(debounced), { schema: resultsSchema }),
  enabled: debounced.length > 1,
})
```

### 18.8 Internationalization

Install `react-i18next` only if multi-locale is required. Otherwise keep strings in `src/lib/strings.ts`. Avoid hard-coded strings in components beyond MVP.

### 18.9 Dark Mode

shadcn ships a `ThemeProvider`. Add via `pnpm dlx shadcn@latest add theme-toggle`. Persists to `localStorage`; no flash via `index.html` inline script.

### 18.10 Analytics

`index.html`:

```html
<script defer src="https://app.posthog.com/static/array.js"></script>
<script>
  !function(){posthog.init('YOUR_PUBLIC_KEY',{api_host:'https://app.posthog.com'})}();
</script>
```

Wrap the snippet in an env-driven conditional via `vite-plugin-html` if you need to omit it in dev.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find module '@/lib/utils'` | Add `paths` in `tsconfig.app.json` AND `resolve.alias` in `vite.config.ts`. |
| `routeTree.gen.ts` has TS errors | Delete it, restart `pnpm dev`; the plugin regenerates. Don't hand-edit. |
| `No QueryClient set` | Wrap your tree in `<QueryClientProvider client={queryClient}>` in `main.tsx`. |
| `Cannot find name 'vi'` in tests | Set `globals: true` in `vitest.config.ts`. |
| `expect(...).toBeInTheDocument is not a function` | Add `import '@testing-library/jest-dom/vitest'` to `src/test/setup.ts`. |
| Tailwind classes don't apply | `@import "tailwindcss"` must be in `globals.css`; restart dev server. |
| `Failed to resolve import "react-router-dom"` | You don't use it; you use `@tanstack/react-router`. Remove the import. |
| `'use client' is not allowed` | This is Vite, not Next; remove the directive. |
| `process is not defined` | Replace `process.env.X` with `import.meta.env.VITE_X`. |
| `__APP_SHA__ is not defined` | Confirm `define` block in `vite.config.ts`; add `declare global` for types. |
| `import.meta.env.VITE_X is undefined` in tests | Vitest reads via Vite config; ensure `mergeConfig(viteConfig, ...)` in `vitest.config.ts`. |
| `pnpm: command not found` | Reopen terminal so PATH refreshes; or `corepack enable`. |
| `EBADENGINE Unsupported engine` | Upgrade Node to 24 LTS. |
| `Cannot use import statement outside a module` | Set `"type": "module"` in `package.json`. |
| 404 on refresh in production | Configure SPA fallback (`wrangler.jsonc` or `vercel.json` rewrites). |
| Sentry release `undefined` | Pass `GITHUB_SHA` to `SENTRY_RELEASE` in CI; set `release: __APP_SHA__` in init. |
| Playwright timeouts on CI | Set `webServer.timeout: 60_000`; cache `~/.cache/ms-playwright`. |
| `Hydration failed` | You don't hydrate (SPA). The error is from `react-dom/server` import; remove it. |
| `Module "node:fs" has been externalized` | Don't import Node modules in `src/`. SPA runs in browser. |
| `Mixed Content blocked` | API must be HTTPS in production. |
| Fast Refresh full reloads on every save | Component file exports something that isn't a component (e.g. a constant). Move non-component exports to a separate file. |
| Biome reformats every file on save | Disable VS Code's Prettier extension (`.vscode/extensions.json` already excludes it). |
| Stale data after mutation | `queryClient.invalidateQueries({ queryKey })` in `onSuccess`. |
| `Maximum update depth exceeded` | A `useEffect` is calling `setState` on every render without a guard. |
| TanStack Router `Link` says "type 'string' is not assignable" | The route doesn't exist (typo in `to`); routes are typed at compile time. |
| PostHog/Sentry blocked by adblock | Expected; don't fail closed in client logic. |
| `Cannot find module 'msw/node'` in component tests | Use jsdom env; install `msw@2.x`. |
| `Service worker not registered` (PWA) | You haven't enabled it; that's intentional. Skip. |
| Sourcemaps don't open in DevTools | Set `build.sourcemap: true`; ensure dev tools "Allow source maps" is on. |
| `Error: Browser was not found` (Playwright) | `pnpm exec playwright install --with-deps`. |
| Build OOMs on CI | Bump runner to `ubuntu-latest-large`; or split test job from build. |
| Tailwind v4 `@tailwind base` not recognized | v4 uses `@import "tailwindcss";` instead. |

---

## 20. Glossary

- **SPA** — Single Page Application. One HTML file; JavaScript renders all subsequent screens client-side.
- **Vite** — A dev/build tool. Serves your code instantly in dev and bundles it for prod.
- **React** — UI library. You write components; React renders them.
- **TypeScript** — JavaScript with types. Catches errors before you run code.
- **TanStack Router** — Routes (URLs) library that knows the shape of your URLs at compile time.
- **TanStack Query** — Server-state cache. Handles fetch, cache, retry, dedup automatically.
- **Zustand** — Tiny state library for client-only flags (theme, sidebar open).
- **Tailwind** — CSS framework where you write utility classes (`p-4 bg-blue-500`) in the HTML.
- **shadcn/ui** — A CLI that copies component source code into your repo. You own and edit it.
- **Vitest** — Test runner that reuses Vite's pipeline.
- **Playwright** — Browser automation; clicks through the real app and asserts.
- **MSW** — Mock Service Worker. Intercepts `fetch` calls in tests with fake responses.
- **Biome** — Linter + formatter, replaces ESLint and Prettier with one fast Rust binary.
- **Zod** — Runtime schema validator; "this object must match this shape, or throw."
- **Sentry** — Error tracking; captures uncaught errors with stack traces.
- **pnpm** — Package manager. Like npm but faster and stricter.
- **HMR / Fast Refresh** — Hot Module Replacement. Edits show in the browser without losing state.
- **ESM** — ECMAScript Modules; modern JS module format (`import`/`export`).
- **CommonJS** — Older JS module format (`require`/`module.exports`). Vite prefers ESM.
- **Bundler** — Combines your many source files into a few JS/CSS files for the browser.
- **Sourcemap** — Mapping from minified prod code back to original source so DevTools shows real filenames.
- **HttpOnly cookie** — Cookie the browser sends but JS cannot read. The right place for session tokens.
- **CSP** — Content Security Policy. HTTP header that restricts what scripts/styles a page may load.
- **CDN** — Content Delivery Network. Caches your static files near users.
- **Edge** — Servers near the user (Cloudflare's global network, Vercel's edge).
- **Static asset** — A file (JS, CSS, image) served as-is, not generated per-request.
- **Hydration** — Attaching React to server-rendered HTML. (SPAs don't hydrate; they render fresh.)
- **Code splitting** — Loading only the JS needed for the current page.
- **Tree shaking** — Removing unused exports from the final bundle.
- **Provider** — A React component that exposes data to all descendants via context.
- **Hook** — A React function (named `use…`) that participates in component state/effects.
- **Mutation** — A request that changes server state (POST/PUT/PATCH/DELETE).
- **Query** — A request that reads server state (GET).
- **Stale time** — How long TanStack Query treats cached data as fresh before refetching.
- **Error boundary** — A React component that catches errors in its children and renders a fallback.
- **Suspense** — React API to declaratively show fallbacks while async work resolves.
- **`@smoke`** — Tag we attach to one E2E per critical flow so PRs run only the fast subset.
- **Conventional Commits** — `feat:`, `fix:`, `chore:` prefix style; enables automated changelogs.
- **Workspace** — pnpm's term for a multi-package repo. We use a single-package layout here.

---

## 21. Update Cadence

This rulebook is valid for:
- Vite **8.0.x – 8.x**
- React **19.x**
- TypeScript **6.x** (re-evaluate when 7.0 stable ships)
- TanStack Router/Query latest **2026** tags
- Tailwind **4.x**
- Vitest **4.x**
- Playwright **1.59.x – 1.x**
- Biome **2.x**

Re-run the generator when:
- Any major version of the above bumps.
- Vitest 5 stable releases.
- TypeScript 7 (Go-port) ships stable and Biome supports it.
- React Compiler reaches stable + default-on (revisit memo rules).
- Cloudflare or Vercel changes default deploy semantics.
- A high-severity advisory hits any pinned dep.

Date stamp: **2026-04-27**.
