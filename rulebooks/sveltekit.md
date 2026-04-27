# SvelteKit Rulebook

A non-coder + AI agent rulebook for shipping a SvelteKit app on Vercel with Drizzle, Neon Postgres, Better Auth, Tailwind, Vitest, and Playwright. Versions confirmed via WebSearch on 2026-04-27.

---

## 1. Snapshot

**Stack:** SvelteKit 2 + Svelte 5 (runes) + TypeScript + adapter-vercel + Drizzle + Neon Postgres + Better Auth + Tailwind 4 + form actions + Vitest + Playwright.

**Tagline:** Server-rendered TypeScript app with form actions, Postgres, and edge-friendly deploys.

### Decisions

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 | Type safety; SvelteKit ships TS-first. |
| Runtime + version | Node.js 24.15.0 LTS | Active LTS; Vercel default. |
| Package manager | pnpm 10.33.2 | Disk-efficient; SvelteKit recommended. |
| Build tool | Vite 7 (via SvelteKit) | SvelteKit owns Vite config. |
| State mgmt | Svelte 5 runes ($state) | Built-in signals; zero deps. |
| Routing/Nav | SvelteKit file-based router | Convention over config. |
| Data layer (db + orm) | Drizzle 0.45 + Neon HTTP | Type-safe SQL; serverless edge. |
| Auth | Better Auth 1.x | Lucia deprecated; TS-first; SvelteKit plugin. |
| Styling | Tailwind 4.2 | CSS-first config; 100x incremental. |
| Forms + validation | Form actions + zod 3 | Native SvelteKit; progressive enhancement. |
| Unit test runner | Vitest 4.1 | Vite-native; SvelteKit recommended. |
| E2E framework | Playwright 1.59 | Parallel-by-default; SvelteKit canonical. |
| Mocking strategy | Adapter boundary only | Never mock DB; mock fetch at edge. |
| Logger | pino 9 | Structured JSON; fast; pretty-print dev. |
| Error tracking | Sentry SvelteKit 10.43 | Official SDK; auto trace. |
| Lint + format | eslint-plugin-svelte 3 + Prettier 3 | Biome lacks .svelte parser. |
| Type checking | svelte-check + tsc | Official SvelteKit tooling. |
| Env vars + secrets | $env/static/private | Compile-time; client-leak-proof. |
| CI provider | GitHub Actions | Free for public; pnpm cache. |
| Deploy target | Vercel | adapter-vercel official; zero config. |
| Release flow | git push main → Vercel auto-deploy | Trunk-based; preview per PR. |
| Auto-update | Vercel atomic deploys | Instant rollback; zero-downtime. |
| Auth lib | Better Auth (sveltekitCookies plugin) | Lucia is dead; better-auth wins. |
| Data strategy | +page.server.ts default | Keep DB calls server-only. |
| Form strategy | Form actions, not API routes | Progressive enhancement built-in. |
| Deploy adapter | @sveltejs/adapter-vercel 6.3.3 | Patches CVE-2026-27118. |
| Svelte 5 runes default | $state, $derived, $effect, $props only | No `let` reactivity; no stores in components. |

### Versions (confirmed 2026-04-27)

| Lib | Version | Released | Source |
|---|---|---|---|
| @sveltejs/kit | 2.58.0 | 2026-04-24 | github.com/sveltejs/kit/releases |
| svelte | 5.55.0 | 2026-04-21 | github.com/sveltejs/svelte/releases |
| @sveltejs/adapter-vercel | 6.3.3 | 2026-03-27 | npm @sveltejs/adapter-vercel |
| @sveltejs/vite-plugin-svelte | 7.0.0 | 2026-02-25 | npm |
| vite | 7.1.0 | 2026-04 | vite.dev |
| typescript | 5.7.3 | 2026-01 | npm |
| node | 24.15.0 LTS | 2026-04 | nodejs.org |
| pnpm | 10.33.2 | 2026-04 | pnpm.io |
| drizzle-orm | 0.45.2 | 2026-04-11 | npm |
| drizzle-kit | 0.31.1 | 2026-04 | npm |
| @neondatabase/serverless | 1.0.2 | 2025-09 | npm |
| better-auth | 1.4.0 | 2026-04 | better-auth.com |
| tailwindcss | 4.2.0 | 2026-02-18 | tailwindcss.com |
| @tailwindcss/vite | 4.2.0 | 2026-02-18 | npm |
| vitest | 4.1.0 | 2026-04 | vitest.dev |
| @vitest/browser | 4.1.0 | 2026-04 | npm |
| @playwright/test | 1.59.1 | 2026-04-01 | playwright.dev |
| eslint | 9.20.0 | 2026-02 | npm |
| eslint-plugin-svelte | 3.5.0 | 2026-04 | npm |
| prettier | 3.5.0 | 2026-02 | npm |
| prettier-plugin-svelte | 3.3.0 | 2026-03 | npm |
| svelte-check | 4.2.0 | 2026-04 | npm |
| @sentry/sveltekit | 10.43.0 | 2026-04-20 | npm |
| pino | 9.6.0 | 2026-03 | npm |
| zod | 3.24.0 | 2026-01 | npm |
| sv (Svelte CLI) | 0.8.10 | 2026-04 | npm |

### Minimum host requirements

- **macOS:** 13 Ventura or newer. 8 GB RAM. 10 GB free disk.
- **Windows:** 11 22H2 or newer. WSL2 recommended. 8 GB RAM. 10 GB free disk.
- **Linux:** Ubuntu 22.04+, Fedora 40+, or equivalent. 8 GB RAM. 10 GB free disk.

### Estimated cold start

`git clone` to `localhost:5173` rendering: **6 minutes** (3 min install, 1 min DB provision, 1 min env setup, 1 min first compile).

---

## 2. Zero-to-running

### macOS

```bash
# 1. Install Homebrew (if not present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 24 LTS, pnpm, git, gh
brew install node@24 pnpm git gh

# 3. Verify
node -v   # expect: v24.15.0 (or higher 24.x)
pnpm -v   # expect: 10.33.x
git -v    # expect: git version 2.4x.x

# 4. Authenticate gh
gh auth login   # GitHub.com → HTTPS → browser

# 5. Install Vercel CLI
pnpm add -g vercel@latest
vercel login   # email auth
```

### Windows

```powershell
# 1. Install winget (Windows 11 ships with it). Then:
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm
winget install Git.Git
winget install GitHub.cli

# 2. Open a NEW PowerShell. Verify:
node -v
pnpm -v
git -v

# 3. Authenticate
gh auth login
pnpm add -g vercel@latest
vercel login
```

### Linux (Debian/Ubuntu)

```bash
# 1. Node 24 via nodesource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. pnpm + gh
curl -fsSL https://get.pnpm.io/install.sh | sh -
sudo apt-get install -y gh

# 3. Verify
node -v && pnpm -v && git --version

# 4. Authenticate
gh auth login
pnpm add -g vercel@latest
vercel login
```

### Required accounts

| Service | Purpose | Link | Needs |
|---|---|---|---|
| GitHub | source host | github.com/signup | email |
| Vercel | deploy target | vercel.com/signup | GitHub OAuth |
| Neon | Postgres | neon.tech/signup | GitHub OAuth |
| Sentry | error tracking | sentry.io/signup | email |

### Bootstrap commands

```bash
# 1. Scaffold a new SvelteKit project
pnpm dlx sv@0.8.10 create my-app
# CHOICES (type these exactly):
#   Which Svelte app template? → SvelteKit minimal
#   Add type checking? → Yes, using TypeScript syntax
#   Select additional add-ons? → prettier, eslint, vitest, playwright, tailwindcss, drizzle, better-auth, sveltekit-adapter
#   Tailwind plugins → typography, forms
#   Database → PostgreSQL (Neon)
#   Run pnpm install? → Yes

cd my-app

# 2. Add adapter-vercel (CLI defaults to adapter-auto; replace it)
pnpm remove @sveltejs/adapter-auto
pnpm add -D @sveltejs/adapter-vercel@6.3.3

# 3. Add Sentry
pnpm add @sentry/sveltekit@10.43.0

# 4. Add pino + zod
pnpm add pino@9.6.0 zod@3.24.0
pnpm add -D pino-pretty@13.0.0

# 5. Init git + first commit
git init && git add -A && git commit -m "init"

# 6. Create Neon DB
#    a) Go to neon.tech → New project → name "my-app" → region matching Vercel
#    b) Copy the "Pooled connection" string (starts with postgresql://...neon.tech/...)
#    c) Paste into .env as DATABASE_URL=

# 7. Run migrations
pnpm drizzle-kit push

# 8. Start dev server
pnpm dev
```

### Expected first-run output

```
> my-app@0.0.1 dev
> vite dev

  VITE v7.1.0  ready in 412 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

### Common first-run errors

| Error | Fix |
|---|---|
| `Error: Cannot find module '@sveltejs/adapter-auto'` | You forgot step 2. Run `pnpm remove @sveltejs/adapter-auto` then update `svelte.config.js` to import from `@sveltejs/adapter-vercel`. |
| `DATABASE_URL is not defined` | Create `.env` from `.env.example`; paste Neon pooled connection string. |
| `error during build: Cannot find name '$state'` | TypeScript missing Svelte 5 globals. Run `pnpm svelte-kit sync` to regenerate `.svelte-kit/types`. |
| `Hydration failed` on first visit | Stale `.svelte-kit/`. Run `rm -rf .svelte-kit && pnpm dev`. |
| Port 5173 in use | `pnpm dev --port 5174`. |
| `pnpm: command not found` | Re-open shell after install; `corepack enable` if still missing. |
| `EACCES` on Linux pnpm install | Run `corepack enable` instead of sudo. |

---

## 3. Project Layout

```
my-app/
├── .github/
│   └── workflows/
│       └── ci.yml                # GitHub Actions: typecheck + lint + test
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── .cursor/
│   └── rules                     # Cursor AI rules (mirrors AI rules section)
├── .claude/
│   └── settings.json             # Claude Code hooks + allowlist
├── drizzle/                      # Drizzle migrations (generated)
│   └── 0000_init.sql
├── e2e/                          # Playwright specs
│   ├── auth.spec.ts
│   └── smoke.spec.ts
├── src/
│   ├── app.css                   # Tailwind imports
│   ├── app.d.ts                  # Locals, PageData typings
│   ├── app.html                  # HTML shell
│   ├── hooks.server.ts           # Auth handle + Sentry
│   ├── hooks.client.ts           # Sentry client init
│   ├── lib/
│   │   ├── server/               # NEVER imported from client
│   │   │   ├── auth.ts           # Better Auth instance
│   │   │   ├── db/
│   │   │   │   ├── index.ts      # Drizzle client
│   │   │   │   └── schema.ts     # Drizzle schema
│   │   │   └── log.ts            # pino logger
│   │   ├── components/           # Shared UI components
│   │   ├── auth-client.ts        # Better Auth browser client
│   │   └── utils.ts              # Pure helpers (server-and-client safe)
│   └── routes/
│       ├── +layout.svelte
│       ├── +layout.server.ts     # session loader
│       ├── +page.svelte
│       ├── login/
│       │   ├── +page.svelte
│       │   └── +page.server.ts   # form actions
│       └── api/
│           └── auth/
│               └── [...all]/
│                   └── +server.ts # Better Auth handler
├── static/                       # Public files (favicon, robots.txt)
├── tests/                        # Vitest unit tests (.test.ts)
├── .env                          # Local secrets (gitignored)
├── .env.example                  # Template, committed
├── .gitignore
├── .prettierrc
├── .prettierignore
├── eslint.config.js
├── drizzle.config.ts
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── README.md
├── svelte.config.js
├── tsconfig.json
├── vite.config.ts
├── vitest.config.ts
├── CLAUDE.md
└── AGENTS.md
```

### Naming conventions

- Routes: `+page.svelte`, `+page.server.ts`, `+layout.svelte`, `+layout.server.ts`, `+server.ts`. Lowercase folder names, kebab-case for multi-word (`/blog-posts/`).
- Components: `PascalCase.svelte` (e.g. `UserMenu.svelte`).
- Stores/runes modules: `camelCase.svelte.ts` (so the compiler picks them up).
- Utilities: `camelCase.ts`.
- Tests: `<file>.test.ts` next to source for unit; `<feature>.spec.ts` in `e2e/` for Playwright.
- Schema: tables in `snake_case`, TypeScript exports in `camelCase` (Drizzle convention).

### "Adding X goes in Y"

| Adding | Goes in |
|---|---|
| New page | `src/routes/<path>/+page.svelte` |
| Page data load | `src/routes/<path>/+page.server.ts` (default) |
| Form action | `src/routes/<path>/+page.server.ts` `actions` export |
| Layout shell | `src/routes/<scope>/+layout.svelte` + `+layout.server.ts` |
| API endpoint | `src/routes/api/<path>/+server.ts` |
| Reusable component | `src/lib/components/<Name>.svelte` |
| Server-only util | `src/lib/server/<name>.ts` |
| Universal util | `src/lib/<name>.ts` |
| DB table | `src/lib/server/db/schema.ts` (export const) |
| DB query helper | `src/lib/server/db/<feature>.ts` |
| Auth provider config | `src/lib/server/auth.ts` |
| Env var (server) | `.env` then `$env/static/private` |
| Env var (browser) | `.env` with `PUBLIC_` prefix → `$env/static/public` |
| Reactive state (component) | `let x = $state(initial)` in `<script>` |
| Reactive state (shared) | `<name>.svelte.ts` module exporting `$state` getter/setter |
| Unit test | `<file>.test.ts` next to source |
| E2E test | `e2e/<feature>.spec.ts` |
| Static asset | `static/` (served at `/`) |
| Tailwind config | `src/app.css` `@theme` block (Tailwind v4) |

---

## 4. Architecture

### Process boundaries

```
┌──────────────────────────────────────────────────────────┐
│ Browser (Svelte client runtime)                           │
│  • +page.svelte, components, $state runes                 │
│  • $env/static/public ONLY                                │
│  • Better Auth client (createAuthClient)                  │
└────────────────┬─────────────────────────────────────────┘
                 │  HTTP (form POST, fetch from +page.ts)
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Vercel Edge / Node Function (SvelteKit server)            │
│  • hooks.server.ts → Better Auth handle → app handle      │
│  • +page.server.ts (load, actions)                        │
│  • +server.ts (API)                                       │
│  • $env/static/private (DATABASE_URL, AUTH_SECRET, ...)   │
│  • src/lib/server/** (NEVER bundled to client)            │
└────────────────┬─────────────────────────────────────────┘
                 │  Drizzle → @neondatabase/serverless (HTTPS)
                 ▼
┌──────────────────────────────────────────────────────────┐
│ Neon Postgres                                             │
└──────────────────────────────────────────────────────────┘
```

### Data flow (typical form action)

```
User clicks <button type="submit">
  ↓
<form method="POST" use:enhance>
  ↓ (use:enhance intercepts, prevents full reload)
POST /current-route?/<actionName>
  ↓
hooks.server.ts: Better Auth handle (sets event.locals.user)
  ↓
+page.server.ts → actions.<actionName>({ request, locals })
  ↓
zod parse formData → Drizzle write → return { success: true } or fail(400, ...)
  ↓
SvelteKit invalidates all load functions for this route
  ↓
+layout.server.ts + +page.server.ts re-run
  ↓
form prop on the page updates → Svelte 5 reactively re-renders
```

### Auth flow

```
1. User → /login → +page.svelte renders <form action="?/login">
2. POST /login?/login → +page.server.ts actions.login
3. action calls auth.api.signInEmail({ body, headers })
4. Better Auth verifies → sets session cookie via sveltekitCookies plugin
5. action returns redirect(303, "/")
6. Browser follows redirect, hooks.server.ts runs auth handle
7. event.locals.user = session.user → exposed via +layout.server.ts
8. +layout.svelte reads $page.data.user (universal) or layout `data` prop
```

### State management flow

```
Component-local:    let x = $state(0)              ← preferred default
Derived:            let total = $derived(x * 2)
Side effect:        $effect(() => log(x))
Cross-component:    src/lib/state/cart.svelte.ts exporting an object with $state
Server-truth state: +page.server.ts load → returns data → page reads `data` prop
                    Mutate via form actions → SvelteKit auto-invalidates
```

**Never use Svelte 4 stores (`writable`, `readable`) for new state. Runes only.**

### Entry-point file map

| File | Responsibility |
|---|---|
| `src/app.html` | Static HTML shell. `%sveltekit.head%`, `%sveltekit.body%`. |
| `src/app.d.ts` | Locals, PageData, PageState, Platform types. |
| `src/hooks.server.ts` | Server middleware. Auth handle + Sentry handleError. |
| `src/hooks.client.ts` | Client-side Sentry init + handleError. |
| `src/routes/+layout.server.ts` | Top-level session/user loader. |
| `src/routes/+layout.svelte` | App shell (nav, providers). |
| `svelte.config.js` | Adapter, preprocessor, alias config. |
| `vite.config.ts` | Plugins: sveltekit, tailwindcss, sentryVitePlugin. |

### Where business logic lives

- **Live in:** `src/lib/server/**` (queries, auth, validations).
- **Never live in:** `+page.svelte` (UI only), `src/lib/components/**` (presentational), `+server.ts` (thin handlers — delegate to `lib/server`).

---

## 5. Dev Workflow

### Start dev server

```bash
pnpm dev
```

What runs: Vite watcher (HMR), `vite-plugin-svelte` (Svelte 5 compiler), Tailwind v4 JIT (in-process), `svelte-kit sync` (regenerates `.svelte-kit/types`).

### Hot reload

Works for: `.svelte` files, `.ts` files in `src/lib/**`, `.css`. Breaks when: `svelte.config.js`, `vite.config.ts`, `drizzle.config.ts`, `app.html`, `.env` change. Restart with `Ctrl+C` then `pnpm dev`.

### Debugger attach

**VS Code / Cursor:** F5 with the `.vscode/launch.json` below — sets `NODE_OPTIONS=--inspect`, opens Chrome with breakpoints in `.svelte` and `.ts` files.

**Browser:** Open DevTools → Sources → look for `.svelte` files (sourcemaps). Set breakpoints in `<script>` tags directly.

### Inspect at runtime

- **Network:** Browser DevTools → Network. Form actions appear as POST to current URL.
- **State:** Install Svelte DevTools extension. Component tree shows `$state` values.
- **DB:** `pnpm drizzle-kit studio` opens https://local.drizzle.studio/.
- **Server logs:** Terminal running `pnpm dev` (pino-pretty piped).

### Pre-commit checks

```bash
pnpm check   # runs: svelte-check + eslint + prettier --check + vitest run
```

Configured as a `lint-staged` hook in `package.json` (runs only on staged files).

### Branch + commit conventions

- Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits — `feat: add login flow`, `fix: invalidate session on logout`.
- One PR per feature. Never push to `main` directly.

---

## 6. Testing & Parallelization

### Unit tests

```bash
pnpm test            # vitest run (CI mode)
pnpm test:watch      # vitest (watch)
pnpm test src/lib/utils.test.ts          # single file
pnpm test -t "formats date"               # single test by name
```

Tests live next to source: `src/lib/utils.test.ts`. Browser-mode component tests use `@vitest/browser` with Playwright provider.

### Integration tests

Same Vitest, with `test.server` config (Node environment) for `+page.server.ts` tests. Hit a real Neon **branch** (Neon's git-style DB branching — never mock).

### E2E tests (parallel by default)

```bash
pnpm e2e             # playwright test
pnpm e2e --ui        # interactive
pnpm e2e auth.spec.ts -g "logs in"
```

Playwright config (parallelism inline below) sets `fullyParallel: true`, `workers: process.env.CI ? 4 : undefined`.

### Mocking rules

- **Never mock:** the database (use a Neon branch), the Better Auth instance (use a test user).
- **Mock at adapter boundary only:** outbound HTTP via `vi.spyOn(globalThis, 'fetch')`, payment SDKs, email senders. Provide a `src/lib/server/email.ts` adapter and stub it.

### Coverage target

90% lines on `src/lib/server/**`. Measure: `pnpm test --coverage`. Output: `coverage/index.html`.

### Visual regression

Vitest 4 browser mode `toMatchScreenshot()`. Baselines committed under `__screenshots__/`. Re-baseline: `pnpm test --update`.

### Parallelization for AI agents

| Safe to parallelize | Unsafe (sequential only) |
|---|---|
| Different routes (disjoint folders) | Anything editing `package.json`, `pnpm-lock.yaml` |
| New components in `src/lib/components` | `src/lib/server/db/schema.ts` (one writer) |
| Independent unit tests | `drizzle.config.ts` migrations |
| Separate Tailwind utility classes | `svelte.config.js`, `vite.config.ts` |
| New Playwright spec files | `src/app.d.ts` (shared types) |
| Static assets | `src/hooks.server.ts` (chained handlers) |

---

## 7. Logging

### Logger setup (`src/lib/server/log.ts`)

```ts
import pino from 'pino';
import { dev } from '$app/environment';

export const log = pino({
  level: dev ? 'debug' : 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  base: { service: 'my-app' },
  ...(dev && { transport: { target: 'pino-pretty', options: { colorize: true } } })
});
```

### Levels

- `fatal`: process-killing condition. Crash imminent.
- `error`: caught exception that prevented user action.
- `warn`: degraded behavior; user not impacted.
- `info`: significant business event (signup, payment, deploy).
- `debug`: dev-only diagnostic.
- `trace`: never in prod.

### Required fields

Every log line: `request_id`, `user_id` (or `null`), `module`, `event`. Set on `event.locals` in `hooks.server.ts` and pass via `log.child(...)`.

### Sample lines

```jsonc
// Boot
{"level":30,"time":1714233600000,"service":"my-app","module":"boot","event":"server.start","port":5173}
// Request in
{"level":30,"time":...,"request_id":"01HX...","user_id":"u_123","module":"http","event":"req.in","method":"POST","path":"/login"}
// Request out
{"level":30,"time":...,"request_id":"01HX...","user_id":"u_123","module":"http","event":"req.out","status":303,"duration_ms":42}
// Error
{"level":50,"time":...,"request_id":"01HX...","module":"auth","event":"signin.fail","err":{"type":"InvalidCredentials","message":"..."}}
// Slow op
{"level":40,"time":...,"request_id":"01HX...","module":"db","event":"query.slow","sql":"SELECT ...","duration_ms":1200}
// User event
{"level":30,"time":...,"request_id":"01HX...","user_id":"u_123","module":"billing","event":"checkout.complete","amount_cents":1999}
```

### Where logs go

- **Dev:** stdout via pino-pretty.
- **Prod:** Vercel collects stdout/stderr → forward to Sentry via `@sentry/sveltekit` for errors; structured logs to Vercel Log Drains pointing at Axiom.

### grep locally

```bash
pnpm dev 2>&1 | tee /tmp/app.log
grep '"event":"signin.fail"' /tmp/app.log | jq .
```

---

## 8. AI Rules

### 8.1 ALWAYS (≥20)

1. Always run `pnpm check` before declaring a task done. Commands: `pnpm check` and `pnpm test`.
2. Always use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`) for component reactivity. Never `let x` for reactive values.
3. Always declare props with `let { foo, bar } = $props<{ foo: string; bar?: number }>();`.
4. Always put database calls in `+page.server.ts` or `src/lib/server/**`. Never in `+page.ts` or components.
5. Always import secrets from `$env/static/private`. Never `process.env` directly in app code.
6. Always validate form input with `zod` before touching the database.
7. Always use form actions for mutations (`actions: { default: async ({ request }) => {...} }`). Never invent JSON API routes for first-party form submits.
8. Always add `use:enhance` to forms for progressive enhancement.
9. Always type `event.locals` in `src/app.d.ts` when adding new server middleware data.
10. Always run `pnpm drizzle-kit generate` after schema edits, then commit the SQL file.
11. Always run `pnpm svelte-kit sync` after editing `svelte.config.js` or adding new routes.
12. Always use `redirect(303, url)` for post-action redirects (303, not 302, for POST→GET).
13. Always wrap async data in error boundaries via `+error.svelte`.
14. Always set `prerender = true` on truly static pages (marketing, legal) for speed.
15. Always run `pnpm format` before commit (Prettier + plugin-svelte).
16. Always use `getRequestEvent()` from `$app/server` inside Svelte 5 module context if you need request data outside a load.
17. Always derive client-only values inside `$effect(() => { if (browser) ... })`, importing `browser` from `$app/environment`.
18. Always use `data-sveltekit-reload` only when SPA navigation breaks (rare); document why.
19. Always pass `cookies` through from `event` to Better Auth via the `sveltekitCookies` plugin.
20. Always set `PUBLIC_` prefix on env vars meant to reach the browser. Anything else is server-only.
21. Always use `$page.data` (typed via `app.d.ts` PageData) to read layout-loaded data in components.
22. Always run Playwright with `--workers=4` in CI; default for local.

### 8.2 NEVER (≥15)

1. Never mix Svelte 4 syntax (`export let foo`, `$:` reactive blocks) with Svelte 5. Pure runes only.
2. Never import from `$env/static/private` in `+page.svelte`, `+page.ts`, `+layout.svelte`, or `src/lib/<non-server>/`. Build will fail; if it does not, you imported wrong path.
3. Never put `DATABASE_URL`, `AUTH_SECRET`, or any token under a `PUBLIC_` prefix.
4. Never call `fetch()` directly to your own server from `+page.ts`. Use a `+page.server.ts` load.
5. Never use `db push` for production schema changes. Use `drizzle-kit generate` + `migrate`.
6. Never wrap an entire route in `<script context="module">`. Svelte 5 module scripts are for non-reactive helpers only.
7. Never store auth session state in `$state` runes — read from `$page.data.user`.
8. Never write to `event.locals` from `+page.server.ts`. Locals belong to `hooks.server.ts`.
9. Never throw raw errors in load functions; use `error(status, message)` from `@sveltejs/kit`.
10. Never use `invalidate()` to refetch the same route after a form action — SvelteKit invalidates automatically.
11. Never edit `.svelte-kit/` (generated). Add it to `.gitignore`.
12. Never set `csrf.checkOrigin` to false in `svelte.config.js`.
13. Never use `goto()` for redirects after form actions; use `redirect()` from the action handler.
14. Never bypass `use:enhance` to write your own fetch+JSON shim for forms.
15. Never use Svelte 4 stores (`writable`/`readable`) in new code. Use runes in `.svelte.ts` modules.
16. Never inject untrusted HTML via `{@html ...}` without sanitization.
17. Never run `vercel deploy` from a dirty working tree. Push to GitHub; let Vercel auto-deploy.
18. Never commit `.env`. Only `.env.example`.
19. Never disable `strict: true` in `tsconfig.json`.
20. Never call `process.exit()` in request handlers.

### 8.3 Blast Radius (≥20)

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command | `pnpm install && pnpm check && pnpm test` |
| `pnpm-lock.yaml` | reproducible installs | `pnpm install --frozen-lockfile` then `pnpm check` |
| `tsconfig.json` | typecheck for all .ts/.svelte | `pnpm check` |
| `svelte.config.js` | build, routing, adapter | `pnpm svelte-kit sync && pnpm build && pnpm preview` |
| `vite.config.ts` | dev + build pipeline | `pnpm dev` 30s smoke + `pnpm build` |
| `src/hooks.server.ts` | every request server-side | full `pnpm e2e` |
| `src/hooks.client.ts` | every request browser-side | `pnpm dev` + Playwright `e2e/smoke` |
| `src/app.d.ts` | typed Locals + PageData | `pnpm check` |
| `src/app.html` | HTML shell | `pnpm build && pnpm preview` smoke |
| `src/lib/server/db/schema.ts` | DB types + runtime | `pnpm drizzle-kit generate && pnpm drizzle-kit migrate && pnpm test` |
| `drizzle.config.ts` | migration generator | `pnpm drizzle-kit generate` smoke |
| `src/lib/server/auth.ts` | every authenticated route | `pnpm e2e e2e/auth.spec.ts` |
| `src/routes/+layout.server.ts` | every page load | full `pnpm e2e` |
| `src/routes/+layout.svelte` | every rendered page | `pnpm e2e e2e/smoke.spec.ts` |
| `src/routes/api/auth/[...all]/+server.ts` | sign-in, sign-up, session | `pnpm e2e e2e/auth.spec.ts` |
| `src/app.css` | every page styling | visual diff via Vitest browser snapshots |
| `tailwind` `@theme` block | every utility class | `pnpm build` + visual smoke |
| `eslint.config.js` | lint output | `pnpm lint` |
| `playwright.config.ts` | E2E suite | `pnpm e2e` |
| `vitest.config.ts` | unit/integration tests | `pnpm test` |
| `.env` | runtime config | `pnpm dev` boot + `/login` |
| `.env.example` | onboarding | manual: re-clone + setup |
| `.github/workflows/ci.yml` | CI gating | open dummy PR; verify checks pass |
| `static/robots.txt` | crawling | curl `/robots.txt` after deploy |

### 8.4 Definition of Done

**Bug fix:** failing test added that reproduces; fix makes it pass; `pnpm check && pnpm test && pnpm e2e` green; manual repro path retried; log line confirms expected event; no new ESLint warnings; PR description includes before/after.

**New feature:** schema (if any) migrated; Drizzle types regenerated; +page.server.ts load + actions added with zod validation; +page.svelte with `use:enhance` form; Vitest unit tests (≥80% lines) for `lib/server/<feature>.ts`; one Playwright spec for happy path; one for error path; `pnpm check && pnpm test && pnpm e2e` green; screenshot of working UI in PR; CLAUDE.md still accurate.

**Refactor:** zero behavior change. Identical Playwright outcomes (compare traces). Git diff reviewed for accidental logic changes.

**Dependency bump:** Read changelog for breaking changes. `pnpm install`. `pnpm check && pnpm test && pnpm e2e`. Open PR with changelog summary in description.

**Schema change:** `pnpm drizzle-kit generate` produces SQL → review SQL by hand → `pnpm drizzle-kit migrate` on dev → integration test against real Neon branch → commit SQL + schema.ts together.

**Copy change:** edit only `.svelte` template strings or i18n file. No logic. `pnpm check && pnpm test`. Visual snapshot updated if layout shifts.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile
pnpm svelte-kit sync
pnpm check                       # svelte-check + tsc
pnpm lint                        # eslint
pnpm format --check              # prettier
pnpm test                        # vitest run
pnpm e2e                         # playwright test
pnpm build                       # production build sanity
```

**Expected output (green):**

- `pnpm check`: `svelte-check found 0 errors and 0 warnings`
- `pnpm lint`: exits 0, no output
- `pnpm format --check`: `All matched files use Prettier code style!`
- `pnpm test`: `Test Files  N passed (N) | Tests  M passed (M)`
- `pnpm e2e`: `N passed (Ns)`
- `pnpm build`: `✓ built in <X>s` and `.svelte-kit/output/` populated

### 8.6 Parallelization Patterns

**Safe fan-out:**
- "Scaffold component A in `src/lib/components/A.svelte`" + "Scaffold component B in `src/lib/components/B.svelte`" + "Write Playwright spec C in `e2e/c.spec.ts`".
- "Add new route `/about`" + "Add new route `/contact`".
- Migrating multiple test files from Svelte 4 store imports to runes — one file per agent.

**Sequential only:**
- Anything touching `package.json` / `pnpm-lock.yaml` (only one agent installs deps).
- Schema changes (`src/lib/server/db/schema.ts` + migrations).
- `svelte.config.js`, `vite.config.ts`, `tsconfig.json`, `eslint.config.js`.
- `src/hooks.server.ts` middleware reordering.
- `src/app.d.ts` (shared types).

---

## 9. Stack-Specific Pitfalls

1. **Svelte 4 `$:` blocks in Svelte 5.** Symptom: warning "non-reactive update". Cause: legacy syntax. Fix: replace with `$derived` or `$effect`. Detect: `pnpm check` warns; ESLint rule `svelte/no-svelte-internal-state-in-derived` catches a subset.

2. **Importing `$env/static/private` in a client module.** Symptom: build fails with `Cannot import "$env/static/private" into client-side code`. Fix: move file under `src/lib/server/` or use it only from `+page.server.ts`. Detect: `pnpm build`.

3. **Accidentally consuming a thrown redirect.** Symptom: redirects do nothing, page renders. Cause: wrapping in `try/catch` and swallowing the redirect throw. Fix: re-throw if `isRedirect(e)`. Detect: e2e shows page rendered instead of navigating.

4. **`Date.now()` in render → hydration mismatch.** Symptom: console error "Hydration failed". Fix: compute in `$effect(() => { ... })`. Detect: dev console.

5. **Form action redirect outside try/catch wrong order.** Symptom: 500 instead of 303. Fix: `throw redirect(303, ...)` is the LAST statement; nothing after. Detect: e2e on form submit.

6. **Stale `.svelte-kit/types`.** Symptom: `Property 'user' does not exist on type 'Locals'`. Fix: `pnpm svelte-kit sync`. Detect: `pnpm check`.

7. **Drizzle Neon HTTP driver over websocket route.** Symptom: timeouts on Vercel Edge. Cause: imported `drizzle-orm/postgres-js` instead of `drizzle-orm/neon-http`. Fix: `import { drizzle } from 'drizzle-orm/neon-http'`. Detect: production timeouts; check at boot.

8. **Cookie not set after Better Auth signIn.** Cause: missing `sveltekitCookies` plugin. Fix: add to `auth.ts` `plugins: [sveltekitCookies()]`. Detect: e2e auth spec.

9. **`$page` deprecated warning in Svelte 5 components.** Fix: use `import { page } from '$app/state'` (rune-based) instead of `$app/stores`. Detect: ESLint `svelte/no-deprecated-stores`.

10. **Adapter-vercel CVE-2026-27118 cache poisoning.** Symptom: cross-user data in CDN cache. Fix: pin `@sveltejs/adapter-vercel` ≥ `6.3.3`. Detect: `pnpm audit`.

11. **`use:enhance` form not invalidating data.** Cause: returning a custom `submit` function without calling `update()`. Fix: `return async ({ update }) => { await update(); }`. Detect: stale UI after submit.

12. **Server load running on prerender = true page.** Symptom: build fails "tried to access dynamic data". Fix: split — universal `+page.ts` for static; `+page.server.ts` for dynamic. Detect: `pnpm build`.

13. **`PUBLIC_` env var used as secret.** Catastrophic data leak. Fix: rename without prefix; rotate secret. Detect: grep `PUBLIC_` for sensitive names; review with `pnpm svelte-kit sync` typed envs.

14. **Tailwind v4 `@theme` not applied.** Cause: missing `@import "tailwindcss";` at top of `src/app.css`. Fix: add the import. Detect: classes render unstyled.

15. **Better Auth + Drizzle adapter type mismatch.** Cause: schema not generated from `pnpm dlx @better-auth/cli generate`. Fix: run the generator, commit. Detect: TS error on `auth.api.signInEmail`.

16. **Playwright browsers not installed in CI.** Fix: `pnpm exec playwright install --with-deps chromium` in CI step. Detect: CI fails with "browser not found".

---

## 10. Performance Budgets

| Metric | Budget | How to measure | Action if over |
|---|---|---|---|
| Cold start (Vercel function) | < 300 ms | Vercel dashboard → Functions → Duration p50 | Move to Edge runtime; reduce imports in `hooks.server.ts`. |
| TTFB (cached) | < 200 ms | `curl -w '%{time_starttransfer}\n' -o /dev/null -s https://app.example.com` | Add `prerender = true` where possible; tune ISR. |
| LCP | < 2.5s on 4G mobile | Vercel Speed Insights | Defer non-critical JS via `<script defer>`; check image sizes. |
| Client JS per route | < 80 KB gzipped | `pnpm build` then check `.svelte-kit/output/client/_app/immutable/entry/` | Audit `src/lib/components/**` for heavy deps; lazy-load. |
| Total bundle | < 250 KB gzipped | `pnpm dlx vite-bundle-visualizer` | Find duplicate imports; split big libs into routes. |
| Memory (server function) | < 256 MB | Vercel logs | Cap pino retention; close DB connections after request. |

---

## 11. Security

### Secret storage

`.env` (local, gitignored). Vercel project Environment Variables (production). **Never** in `static/`, never under `PUBLIC_`, never console.log'd. Rotation: monthly for `AUTH_SECRET`; immediately on any leak suspicion.

### Auth threat model

- **Public:** can read pages marked `prerender = true`.
- **Authenticated user:** can read/write own rows (enforced via `userId = locals.user.id` in every query).
- **Admin:** flagged via `users.role = 'admin'` column; checked in `+layout.server.ts`.
- **Server-only:** holds `DATABASE_URL`, can read/write any row. No client path reaches it.

### Input validation

Every form action and API endpoint: `zod.parse(Object.fromEntries(formData))`. No exceptions. Reject early with `fail(400, { errors: parsed.error.flatten() })`.

### Output escaping

Svelte auto-escapes `{value}` in templates. Use `{@html ...}` only with DOMPurify (`pnpm add isomorphic-dompurify`) on the server before passing to client. Never trust user-provided HTML.

### Permissions

- Vercel: Sensitive Environment Variables enabled.
- CSRF: SvelteKit default `checkOrigin: true`. Never disable.
- Headers: set `Strict-Transport-Security`, `X-Content-Type-Options`, `Referrer-Policy` in `hooks.server.ts` `handle`.

### Dependency audit

```bash
pnpm audit --prod          # weekly
pnpm dlx better-npm-audit   # CI weekly cron
```

### Top 5 risks

1. **Secret in `PUBLIC_` env.** Audit before every release.
2. **`{@html}` without sanitization.** Grep ban: `git grep '{@html' -- src/` should match only sanitized output.
3. **Skipping zod on form action.** ESLint custom rule or PR review checklist.
4. **CSRF disabled.** Pin in `svelte.config.js`; comment it.
5. **Server-only file leaking via `src/lib/`.** Always under `src/lib/server/` so SvelteKit enforces.

---

## 12. Deploy

### Release flow

```bash
# 1. Make sure CI is green on the PR
gh pr checks
# 2. Merge to main
gh pr merge --squash --delete-branch
# 3. Vercel auto-deploys main
# 4. Verify
curl -I https://my-app.vercel.app/   # expect 200
```

### Staging vs prod

- **Preview:** every PR gets a unique URL via Vercel.
- **Prod:** only `main` branch deploys to the production domain.
- **Neon branches:** each Vercel preview gets its own DB branch (configured in Vercel-Neon integration).

### Rollback

```bash
vercel rollback   # picks previous prod deployment, atomic
```

Max safe rollback window: 30 days (Vercel retention).

### Health check

- `GET /` returns 200 with `<title>` set.
- `GET /api/health` returns `{"ok": true, "version": "<git-sha>"}`.

```bash
curl -fsS https://my-app.vercel.app/api/health | jq .ok   # expect: true
```

### Versioning

Git SHA-based. `process.env.VERCEL_GIT_COMMIT_SHA` exposed via `+page.server.ts` to `/api/health`.

### Auto-update

Vercel atomic deploys. Users on the old version finish their session; new requests hit the new build. No app-side update logic needed.

### DNS

Vercel → Settings → Domains → Add `my-app.com`. Add the displayed CNAME/A record at your registrar. Auto-issued LetsEncrypt cert.

### Cost estimate (1k MAU)

- Vercel Pro: $20/mo (covers ~1M function invocations).
- Neon Free → Launch ($19/mo at scale).
- Sentry Team: $26/mo.
- **Total: ~$65/mo at 1k MAU.**

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# CLAUDE.md

This is a SvelteKit 2 + Svelte 5 + TypeScript project on Vercel.

## Source of truth

Read /opt/Loopa/rulebooks/sveltekit.md (or this repo's `sveltekit.md`) before any non-trivial change. It locks every architecture decision.

## Commands

- `pnpm dev` — start dev server on :5173
- `pnpm check` — svelte-check + tsc
- `pnpm lint` — eslint
- `pnpm format` — prettier write
- `pnpm test` — vitest run
- `pnpm e2e` — playwright test
- `pnpm build` — production build
- `pnpm drizzle-kit generate` — produce SQL migration from schema.ts
- `pnpm drizzle-kit migrate` — apply migrations to DB
- `pnpm drizzle-kit studio` — DB browser at https://local.drizzle.studio

## Banned patterns

- Svelte 4 syntax (`export let`, `$:`, `writable`/`readable`). Runes only.
- `process.env` in app code; use `$env/static/private` or `$env/static/public`.
- DB calls outside `src/lib/server/**` or `+page.server.ts`.
- `{@html ...}` without sanitization.
- `db push` on production schemas.
- Mocking the database in tests.

## Definition of done

`pnpm check && pnpm test && pnpm e2e` all green; PR description has screenshot; conventional commit message.

## Skills to invoke

- `/test-driven-development` for new features
- `/systematic-debugging` for bugs
- `/verification-before-completion` before claiming done
- `/ship` to open a PR
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "PreCommit": {
      "command": "pnpm check && pnpm lint && pnpm test"
    },
    "PostEdit": {
      "matcher": "**/*.{svelte,ts,css}",
      "command": "pnpm prettier --write ${file}"
    },
    "Stop": {
      "command": "pnpm exec playwright test e2e/smoke.spec.ts --reporter=line"
    }
  },
  "permissions": {
    "allow": [
      "Bash(pnpm install*)",
      "Bash(pnpm dev*)",
      "Bash(pnpm check*)",
      "Bash(pnpm lint*)",
      "Bash(pnpm format*)",
      "Bash(pnpm test*)",
      "Bash(pnpm e2e*)",
      "Bash(pnpm build*)",
      "Bash(pnpm preview*)",
      "Bash(pnpm drizzle-kit*)",
      "Bash(pnpm svelte-kit sync*)",
      "Bash(pnpm exec playwright*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(gh pr*)",
      "Bash(vercel env*)",
      "Bash(curl -fsS*)"
    ]
  }
}
```

### Slash command shortcuts

- `/check` → `pnpm check && pnpm lint`
- `/test` → `pnpm test --reporter=verbose`
- `/e2e` → `pnpm e2e --ui`
- `/db` → `pnpm drizzle-kit studio`

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# AGENTS.md

SvelteKit 2 + Svelte 5 + TypeScript project. Single source of truth: `sveltekit.md`.

## Build/test/lint
- Build: `pnpm build`
- Test: `pnpm test` and `pnpm e2e`
- Lint: `pnpm lint`
- Typecheck: `pnpm check`

## Conventions
- Svelte 5 runes only — no Svelte 4 syntax.
- DB calls only in `+page.server.ts` or `src/lib/server/**`.
- Form actions for mutations; never invent JSON APIs for first-party forms.
- All form input validated with zod.

## Forbidden
- `process.env` in app code.
- `db push` on prod schemas.
- Mocking DB or auth in tests.
- `{@html}` without sanitization.

## PR checklist
- pnpm check ✔ pnpm test ✔ pnpm e2e ✔
- Conventional commit message
- Screenshot of UI change (if applicable)
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_policy = "on-request"

[shell_environment_policy]
inherit = "core"
include_only = ["NODE_ENV", "PNPM_HOME", "PATH"]

[[mcp_servers]]
name = "sveltekit-rulebook"
type = "filesystem"
roots = ["./sveltekit.md"]
```

### Where Codex differs

- Codex defaults to no internet; install deps before disabling network.
- Codex tends to refactor aggressively — pin `simplify` skill off for SvelteKit projects.
- Better Auth schema generation step (`pnpm dlx @better-auth/cli generate`) needs explicit approval.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# SvelteKit project rules

ALWAYS
- Use Svelte 5 runes ($state, $derived, $effect, $props). No Svelte 4 syntax.
- Run `pnpm check && pnpm test` before declaring work done.
- Keep DB calls in src/lib/server/** or +page.server.ts.
- Validate form input with zod.
- Use form actions for mutations; not custom JSON APIs.
- Import secrets from $env/static/private only.

NEVER
- Svelte 4 syntax: `export let`, `$:`, writable/readable stores in components.
- `process.env` in application code.
- `{@html ...}` without DOMPurify sanitization.
- Mock the database or Better Auth in tests.
- Edit .svelte-kit/ (generated).

WHEN ADDING A FEATURE
1. Schema in src/lib/server/db/schema.ts
2. drizzle-kit generate
3. Server module in src/lib/server/<feature>.ts
4. +page.server.ts load + actions
5. +page.svelte with use:enhance forms
6. Vitest unit + Playwright e2e
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "svelte.svelte-vscode",
    "bradlc.vscode-tailwindcss",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "vitest.explorer",
    "ms-playwright.playwright",
    "ardenivanov.svelte-intellisense"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Dev: attach",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Vitest: current file",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

After running `pnpm dlx sv@0.8.10 create my-app` with the choices in §2, edit/create the following files. Then `git push` produces a deployable hello-world.

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "eslint .",
    "format": "prettier --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test",
    "drizzle-kit": "drizzle-kit"
  },
  "devDependencies": {
    "@playwright/test": "1.59.1",
    "@sveltejs/adapter-vercel": "6.3.3",
    "@sveltejs/kit": "2.58.0",
    "@sveltejs/vite-plugin-svelte": "7.0.0",
    "@tailwindcss/vite": "4.2.0",
    "@types/node": "24.0.0",
    "@vitest/browser": "4.1.0",
    "drizzle-kit": "0.31.1",
    "eslint": "9.20.0",
    "eslint-plugin-svelte": "3.5.0",
    "pino-pretty": "13.0.0",
    "prettier": "3.5.0",
    "prettier-plugin-svelte": "3.3.0",
    "svelte": "5.55.0",
    "svelte-check": "4.2.0",
    "tailwindcss": "4.2.0",
    "typescript": "5.7.3",
    "typescript-eslint": "8.20.0",
    "vite": "7.1.0",
    "vitest": "4.1.0"
  },
  "dependencies": {
    "@neondatabase/serverless": "1.0.2",
    "@sentry/sveltekit": "10.43.0",
    "better-auth": "1.4.0",
    "drizzle-orm": "0.45.2",
    "pino": "9.6.0",
    "zod": "3.24.0"
  },
  "packageManager": "pnpm@10.33.2",
  "engines": {
    "node": ">=24.0.0"
  }
}
```

### `svelte.config.js`

```js
import adapter from '@sveltejs/adapter-vercel';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({ runtime: 'nodejs22.x' }),
    csrf: { checkOrigin: true },
    alias: {
      $lib: 'src/lib'
    },
    typescript: { config: (c) => ({ ...c, include: [...c.include, '../e2e/**/*.ts'] }) }
  },
  compilerOptions: { runes: true }
};
```

### `vite.config.ts`

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT
      }
    }),
    tailwindcss(),
    sveltekit()
  ],
  server: { port: 5173 }
});
```

### `tsconfig.json`

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": true,
    "checkJs": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "moduleResolution": "bundler"
  }
}
```

### `src/app.css`

```css
@import "tailwindcss";

@theme {
  --color-brand: #6366f1;
  --font-sans: ui-sans-serif, system-ui, sans-serif;
}

html { font-family: var(--font-sans); }
body { @apply bg-white text-slate-900 antialiased; }
```

### `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/lib/server/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  casing: 'snake_case'
});
```

### `src/app.d.ts`

```ts
import type { Session, User } from 'better-auth';

declare global {
  namespace App {
    interface Locals {
      user: User | null;
      session: Session | null;
      requestId: string;
    }
    interface PageData {
      user: User | null;
    }
    interface Error {
      requestId?: string;
    }
    interface Platform {}
  }
}

export {};
```

### `src/hooks.server.ts`

```ts
import { sequence } from '@sveltejs/kit/hooks';
import { handleErrorWithSentry, sentryHandle } from '@sentry/sveltekit';
import * as Sentry from '@sentry/sveltekit';
import { auth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { building } from '$app/environment';
import { PUBLIC_SENTRY_DSN } from '$env/static/public';
import { log } from '$lib/server/log';
import type { Handle } from '@sveltejs/kit';

Sentry.init({ dsn: PUBLIC_SENTRY_DSN, tracesSampleRate: 0.1 });

const requestContext: Handle = async ({ event, resolve }) => {
  event.locals.requestId = crypto.randomUUID();
  const start = Date.now();
  const session = await auth.api.getSession({ headers: event.request.headers });
  event.locals.user = session?.user ?? null;
  event.locals.session = session?.session ?? null;
  log.info({ request_id: event.locals.requestId, user_id: event.locals.user?.id ?? null, module: 'http', event: 'req.in', method: event.request.method, path: event.url.pathname });
  const response = await resolve(event);
  log.info({ request_id: event.locals.requestId, user_id: event.locals.user?.id ?? null, module: 'http', event: 'req.out', status: response.status, duration_ms: Date.now() - start });
  return response;
};

const authHandle: Handle = ({ event, resolve }) => svelteKitHandler({ event, resolve, auth, building });

export const handle = sequence(sentryHandle(), requestContext, authHandle);
export const handleError = handleErrorWithSentry();
```

### `src/lib/server/auth.ts`

```ts
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { sveltekitCookies } from 'better-auth/svelte-kit';
import { db } from '$lib/server/db';
import { AUTH_SECRET, PUBLIC_BASE_URL } from '$env/static/private';
import { getRequestEvent } from '$app/server';

export const auth = betterAuth({
  baseURL: PUBLIC_BASE_URL,
  secret: AUTH_SECRET,
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [sveltekitCookies(getRequestEvent)]
});
```

### `src/lib/server/db/index.ts`

```ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { DATABASE_URL } from '$env/static/private';
import * as schema from './schema';

export const db = drizzle(neon(DATABASE_URL), { schema, casing: 'snake_case' });
```

### `src/lib/server/db/schema.ts`

```ts
import { pgTable, text, timestamp, boolean } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  name: text('name'),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow()
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow()
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  providerId: text('provider_id').notNull(),
  accountId: text('account_id').notNull(),
  password: text('password')
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull()
});
```

### `src/lib/server/log.ts`

```ts
import pino from 'pino';
import { dev } from '$app/environment';

export const log = pino({
  level: dev ? 'debug' : 'info',
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  base: { service: 'my-app' },
  ...(dev && { transport: { target: 'pino-pretty', options: { colorize: true } } })
});
```

### `src/lib/auth-client.ts`

```ts
import { createAuthClient } from 'better-auth/svelte';
import { PUBLIC_BASE_URL } from '$env/static/public';

export const authClient = createAuthClient({ baseURL: PUBLIC_BASE_URL });
export const { signIn, signUp, signOut, useSession } = authClient;
```

### `src/routes/api/auth/[...all]/+server.ts`

```ts
import { auth } from '$lib/server/auth';
import type { RequestHandler } from './$types';

const handler: RequestHandler = ({ request }) => auth.handler(request);
export const GET = handler;
export const POST = handler;
```

### `src/routes/+layout.server.ts`

```ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({ user: locals.user });
```

### `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

<main class="mx-auto max-w-3xl p-6">
  {@render children()}
</main>
```

### `src/routes/+page.svelte`

```svelte
<script lang="ts">
  let { data } = $props();
  let count = $state(0);
</script>

<h1 class="text-3xl font-bold">Hello {data.user?.name ?? 'world'}</h1>
<button class="mt-4 rounded bg-brand px-4 py-2 text-white" onclick={() => count++}>
  Clicked {count} times
</button>
{#if !data.user}
  <a href="/login" class="mt-4 inline-block underline">Log in</a>
{/if}
```

### `src/routes/login/+page.server.ts`

```ts
import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { auth } from '$lib/server/auth';
import type { Actions } from './$types';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export const actions: Actions = {
  default: async ({ request }) => {
    const parsed = schema.safeParse(Object.fromEntries(await request.formData()));
    if (!parsed.success) return fail(400, { errors: parsed.error.flatten().fieldErrors });
    const result = await auth.api.signInEmail({ body: parsed.data, headers: request.headers, asResponse: true });
    if (!result.ok) return fail(401, { error: 'Invalid credentials' });
    redirect(303, '/');
  }
};
```

### `src/routes/login/+page.svelte`

```svelte
<script lang="ts">
  import { enhance } from '$app/forms';
  let { form } = $props();
</script>

<h1 class="text-2xl font-bold">Log in</h1>
<form method="POST" use:enhance class="mt-4 space-y-3">
  <input name="email" type="email" required class="border p-2 w-full" />
  <input name="password" type="password" required class="border p-2 w-full" />
  <button class="rounded bg-brand px-4 py-2 text-white">Sign in</button>
  {#if form?.error}<p class="text-red-600">{form.error}</p>{/if}
</form>
```

### `.env.example`

```
DATABASE_URL=postgresql://user:pass@xxx.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=replace_with_openssl_rand_hex_32
PUBLIC_BASE_URL=http://localhost:5173
PUBLIC_SENTRY_DSN=
SENTRY_ORG=
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=
```

### `eslint.config.js`

```js
import js from '@eslint/js';
import svelte from 'eslint-plugin-svelte';
import ts from 'typescript-eslint';
import svelteConfig from './svelte.config.js';

export default ts.config(
  js.configs.recommended,
  ...ts.configs.recommended,
  ...svelte.configs.recommended,
  {
    languageOptions: { parserOptions: { project: './tsconfig.json' } }
  },
  {
    files: ['**/*.svelte', '**/*.svelte.ts'],
    languageOptions: { parserOptions: { parser: ts.parser, svelteConfig } }
  },
  {
    rules: {
      'svelte/no-deprecated-stores': 'error',
      'svelte/valid-compile': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }]
    }
  },
  { ignores: ['build/', '.svelte-kit/', 'dist/', 'coverage/'] }
);
```

### `.prettierrc`

```json
{
  "useTabs": false,
  "tabWidth": 2,
  "singleQuote": true,
  "trailingComma": "none",
  "printWidth": 100,
  "plugins": ["prettier-plugin-svelte"],
  "overrides": [{ "files": "*.svelte", "options": { "parser": "svelte" } }]
}
```

### `vitest.config.ts`

```ts
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    coverage: { reporter: ['text', 'html'], include: ['src/lib/**'] }
  }
});
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'on-first-retry' },
  webServer: {
    command: 'pnpm build && pnpm preview',
    port: 4173,
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } }
  ]
});
```

### `e2e/smoke.spec.ts`

```ts
import { expect, test } from '@playwright/test';

test('home page renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading')).toContainText('Hello');
});
```

### `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm svelte-kit sync
      - run: pnpm check
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm e2e
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          AUTH_SECRET: ${{ secrets.AUTH_SECRET }}
          PUBLIC_BASE_URL: http://localhost:4173
```

### `.gitignore`

```
node_modules/
.svelte-kit/
build/
.vercel/
.env
.env.*
!.env.example
coverage/
dist/
playwright-report/
test-results/
*.log
.DS_Store
```

### `README.md`

```markdown
# my-app

SvelteKit 2 + Svelte 5 + Drizzle + Better Auth + Tailwind.

## Dev

    pnpm install
    cp .env.example .env  # fill values
    pnpm drizzle-kit push
    pnpm dev

## Test

    pnpm check && pnpm test && pnpm e2e

## Deploy

Push to main; Vercel auto-deploys.

## Conventions

See `sveltekit.md` for the rulebook.
```

---

## 17. Idea → MVP Path

(Applies whether `PROJECT_IDEA` is blank or specified. For blank, treat as a generic "items list with auth".)

### Phase 1: Schema (1 session)

**Files touched:** `src/lib/server/db/schema.ts`, `drizzle/0001_*.sql`.
**Exit criteria:** `pnpm drizzle-kit generate` clean; `pnpm drizzle-kit migrate` applies; `pnpm check` green.

Define `user`, `session`, `account`, `verification` (Better Auth) + your domain tables (e.g. `item`, `tag`).

### Phase 2: Backbone (1 session)

**Files touched:** `src/routes/+layout.svelte`, `+layout.server.ts`, `src/routes/(app)/`, `src/routes/login/`, `src/routes/signup/`.
**Exit criteria:** Empty pages render, auth redirects work, nav stub visible.

### Phase 3: Vertical slice (2 sessions)

**Files touched:** one feature route end-to-end (`src/routes/items/+page.server.ts`, `+page.svelte`, `src/lib/server/items.ts`, `src/lib/server/items.test.ts`, `e2e/items.spec.ts`).
**Exit criteria:** User can create, list, edit, delete items. Tests green.

### Phase 4: Auth + multi-user (1 session)

**Files touched:** Better Auth providers (add OAuth), `src/lib/server/auth.ts`, `src/routes/api/auth/[...all]/+server.ts`, RLS-style guards in every query (`where: eq(items.userId, locals.user.id)`).
**Exit criteria:** Two browser sessions; user A cannot see user B's items.

### Phase 5: Ship + monitor (1 session)

**Files touched:** `vercel` env vars, `src/routes/api/health/+server.ts`, Sentry verified.
**Exit criteria:** Production URL reachable; healthcheck returns ok; Sentry captures a synthetic error.

---

## 18. Feature Recipes

### 18.1 Email/password auth

Already wired in §16 via Better Auth. Add OAuth:

`src/lib/server/auth.ts`:

```ts
import { GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET } from '$env/static/private';
// ... add to betterAuth({ ... }):
socialProviders: { github: { clientId: GITHUB_CLIENT_ID, clientSecret: GITHUB_CLIENT_SECRET } }
```

Add to `.env`: `GITHUB_CLIENT_ID=...` `GITHUB_CLIENT_SECRET=...`. Configure callback in GitHub OAuth app: `${BASE_URL}/api/auth/callback/github`.

### 18.2 File upload + storage

Use Vercel Blob.

```bash
pnpm add @vercel/blob
```

`src/routes/upload/+page.server.ts`:

```ts
import { put } from '@vercel/blob';
import { fail } from '@sveltejs/kit';
import { BLOB_READ_WRITE_TOKEN } from '$env/static/private';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request, locals }) => {
    if (!locals.user) return fail(401);
    const fd = await request.formData();
    const file = fd.get('file');
    if (!(file instanceof File)) return fail(400);
    const blob = await put(`u/${locals.user.id}/${file.name}`, file, { access: 'public', token: BLOB_READ_WRITE_TOKEN });
    return { url: blob.url };
  }
};
```

### 18.3 Stripe payments

```bash
pnpm add stripe
```

`src/lib/server/stripe.ts`:

```ts
import Stripe from 'stripe';
import { STRIPE_SECRET_KEY } from '$env/static/private';
export const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: '2025-08-27.acacia' });
```

`src/routes/checkout/+page.server.ts`:

```ts
import { stripe } from '$lib/server/stripe';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_BASE_URL } from '$env/static/private';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ locals }) => {
    if (!locals.user) return { error: 'auth' };
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: 'price_xxx', quantity: 1 }],
      success_url: `${PUBLIC_BASE_URL}/billing?ok=1`,
      cancel_url: `${PUBLIC_BASE_URL}/billing?cancel=1`,
      customer_email: locals.user.email
    });
    redirect(303, session.url!);
  }
};
```

Webhook: `src/routes/api/stripe/webhook/+server.ts` verifies signature with `stripe.webhooks.constructEvent`.

### 18.4 Push notifications

Web Push via `web-push` lib. Service worker at `src/service-worker.ts`. Subscriptions stored in a `pushSubscription` table; send via `webpush.sendNotification` from a server action or cron.

### 18.5 Background jobs / cron

Vercel Cron Jobs. Add to `vercel.json`:

```json
{ "crons": [{ "path": "/api/cron/daily", "schedule": "0 9 * * *" }] }
```

Endpoint: `src/routes/api/cron/daily/+server.ts` checks `request.headers.get('authorization') === 'Bearer ${CRON_SECRET}'`.

### 18.6 Realtime updates

Server-Sent Events.

`src/routes/api/stream/+server.ts`:

```ts
import type { RequestHandler } from './$types';
export const GET: RequestHandler = ({ locals }) => {
  if (!locals.user) return new Response('unauthorized', { status: 401 });
  const stream = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => controller.enqueue(`data: ${Date.now()}\n\n`), 1000);
      return () => clearInterval(interval);
    }
  });
  return new Response(stream, { headers: { 'content-type': 'text/event-stream' } });
};
```

### 18.7 Search

Postgres full-text via Drizzle. Add `tsvector` column + GIN index in a migration. Query with `sql\`to_tsvector('english', ${col}) @@ plainto_tsquery(${q})\``.

### 18.8 Internationalization

Use `paraglide-js` (Inlang) — Svelte-native, no runtime locale loading.

```bash
pnpm add @inlang/paraglide-sveltekit
pnpm dlx @inlang/paraglide-sveltekit init
```

Wraps `handle` in `hooks.server.ts` and provides `m.greeting()` typed messages.

### 18.9 Dark mode

Tailwind v4 supports `@variant dark` natively. Add a `theme` rune in `src/lib/state/theme.svelte.ts` exporting `$state` toggle; toggle adds `class="dark"` on `<html>`. Persist via `document.cookie`.

### 18.10 Analytics events

PostHog.

```bash
pnpm add posthog-js
```

`src/lib/analytics.ts`:

```ts
import posthog from 'posthog-js';
import { browser } from '$app/environment';
import { PUBLIC_POSTHOG_KEY } from '$env/static/public';

if (browser) posthog.init(PUBLIC_POSTHOG_KEY, { api_host: 'https://app.posthog.com' });
export const track = (event: string, props?: Record<string, unknown>) => browser && posthog.capture(event, props);
```

Call `track('item.created', { id })` from `+page.svelte` `use:enhance` callbacks.

---

## 19. Troubleshooting (top 30 errors)

| # | Error | Fix |
|---|---|---|
| 1 | `Cannot find module '@sveltejs/adapter-auto'` | `pnpm remove @sveltejs/adapter-auto && pnpm add -D @sveltejs/adapter-vercel@6.3.3`; update `svelte.config.js`. |
| 2 | `DATABASE_URL is not defined` | Copy `.env.example` to `.env`; fill from Neon. |
| 3 | `Property 'user' does not exist on type 'Locals'` | Update `src/app.d.ts`; run `pnpm svelte-kit sync`. |
| 4 | `Hydration failed because the initial UI does not match` | Stale `.svelte-kit`. `rm -rf .svelte-kit && pnpm dev`. |
| 5 | `Cannot import "$env/static/private" into client-side code` | Move file under `src/lib/server/` or only import in `+page.server.ts`. |
| 6 | `An error was thrown but ignored: ...` (action) | You wrapped a `redirect()` in try/catch; re-throw. |
| 7 | `non-reactive update` warning | Replace `let x = ...; $: y = ...` with `$state` and `$derived`. |
| 8 | `Cannot use stores in a Svelte 5 component without compat` | Migrate to `$state`/`$derived` or import compat shim. |
| 9 | `Form responded with status 415` | Missing `enctype`; default form is `application/x-www-form-urlencoded`. For files: `enctype="multipart/form-data"`. |
| 10 | `400 enhance: Action not found` | Form `action="?/foo"` does not match `actions.foo`; check naming. |
| 11 | `Error: Cannot read properties of undefined (reading 'user')` in layout | `+layout.server.ts` did not run; check route group `(app)` placement. |
| 12 | `ECONNREFUSED` on Drizzle migrate | Wrong DB URL; use the **pooled** Neon connection string. |
| 13 | `tls connection failed` | Append `?sslmode=require` to Neon URL. |
| 14 | `relation "user" does not exist` | Run `pnpm drizzle-kit generate && pnpm drizzle-kit migrate`. |
| 15 | `vite-plugin-svelte: failed to compile` | Svelte 5 syntax error — check for stray `$:` blocks. |
| 16 | `Tailwind classes not applying` | Missing `@import "tailwindcss";` in `src/app.css`. |
| 17 | `Cannot find name '$state'` | Run `pnpm svelte-kit sync`; ensure `compilerOptions.runes: true` in `svelte.config.js`. |
| 18 | `csrf failed` on POST | You set `csrf.checkOrigin: false`; restore default. |
| 19 | `Better Auth: session not found` after sign-in | Missing `sveltekitCookies` plugin; add it. |
| 20 | `Error: getRequestEvent() must be called inside a request` | Don't call at module top-level; pass it as a thunk to `sveltekitCookies(getRequestEvent)`. |
| 21 | `Playwright: browser not found` | `pnpm exec playwright install --with-deps chromium`. |
| 22 | `Vitest: cannot find module $lib/...` | Add `sveltekit()` to `vitest.config.ts` plugins. |
| 23 | `pnpm: command not found` | `corepack enable`. |
| 24 | `EBADENGINE` | Update Node to v24 LTS. |
| 25 | `Sentry: DSN not configured` | Set `PUBLIC_SENTRY_DSN` in env. |
| 26 | Vercel build OOM | Trim install footprint; remove unused devDeps. |
| 27 | `prerender error: cannot access dynamic data` | Page needs `+page.server.ts`; do not set `prerender = true` on dynamic routes. |
| 28 | Stripe webhook 400 | Reading body wrong; use `event.request.text()` then `stripe.webhooks.constructEvent(text, sig, secret)`. |
| 29 | OAuth callback URL mismatch | Set provider redirect to `${PUBLIC_BASE_URL}/api/auth/callback/<provider>`. |
| 30 | `Module not found: Can't resolve 'better-auth/svelte-kit'` | Update to `better-auth@1.4.0+`. |

---

## 20. Glossary

- **Adapter:** SvelteKit code that compiles your app for a specific deploy target (Vercel, Node, Cloudflare).
- **Build:** The process of compiling source into deployable artifacts.
- **CI:** Continuous integration — automated tests on every push.
- **CSRF:** Cross-site request forgery; SvelteKit blocks unmatched origins by default.
- **Drizzle:** A TypeScript ORM that mirrors SQL closely.
- **E2E:** End-to-end test — runs the real app in a real browser.
- **Edge runtime:** A lightweight, geographically-distributed JS runtime (V8 isolate, no Node APIs).
- **ESM:** ECMAScript modules (modern `import`/`export`).
- **Form action:** A SvelteKit server function that handles a form POST.
- **Hot reload:** Code changes appear in the browser without a full page refresh.
- **Hydration:** Browser attaching JavaScript to server-rendered HTML.
- **Invalidation:** Re-running `load` functions to refresh data.
- **JIT:** Just-in-time compilation (Tailwind generates only used utility classes).
- **Load function:** A SvelteKit function that fetches data before a page renders.
- **Middleware:** Code that runs on every request before the route handler (in `hooks.server.ts`).
- **Migration:** A versioned SQL script that mutates the database schema.
- **Neon:** A serverless Postgres provider with branching.
- **ORM:** Object-relational mapper.
- **Preview deploy:** A throwaway deployment created for each pull request.
- **Progressive enhancement:** A page that works without JS, gets better with JS.
- **Rune:** A Svelte 5 reactive primitive — `$state`, `$derived`, `$effect`, `$props`.
- **SSR:** Server-side rendering — HTML generated on the server.
- **Session:** A logged-in user's identifier, stored in a cookie.
- **Signal:** A reactive value that notifies subscribers on change (runes are signals).
- **Sourcemap:** A file mapping minified output back to source for debugging.
- **TTFB:** Time to first byte.
- **Universal load:** A `+page.ts` `load` that runs on both server (SSR) and client (navigation).
- **Vite:** The bundler/dev server SvelteKit uses.
- **WSL2:** Windows Subsystem for Linux v2 — required for many Linux-only tools on Windows.

---

## 21. Update Cadence

- **Valid for:** SvelteKit `2.55` through `2.x` (next major), Svelte `5.x`, adapter-vercel `6.3.3` through `6.x`, Drizzle `0.45.x`, Better Auth `1.x`, Tailwind `4.x`, Vitest `4.x`, Playwright `1.59.x` through `1.x`.
- **Re-run the generator when:** SvelteKit major (3.0), Svelte major (6.0), adapter-vercel major (7.0), Better Auth major (2.0), Tailwind major (5.0), or any CVE in a pinned dep.
- **Last validated:** 2026-04-27.
