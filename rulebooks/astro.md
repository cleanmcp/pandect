# Astro + Cloudflare Rulebook

Static-first content sites with selective SSR on Cloudflare's edge — Astro 6 + TypeScript + Cloudflare adapter (Workers) + content collections + MDX + Tailwind v4 + optional islands + D1 + Wrangler.

Audience: a non-coder + their AI coding agent. This file is the only spec. If something is not here, the agent will guess wrong.

---

## 1. Snapshot

### Decisions Table (zero blanks)

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 strict | Catches errors before deploy; required by Astro |
| Runtime + version | Node.js 22.20 LTS (dev), workerd (prod) | Astro 6 needs Node 22+; Workers runs workerd |
| Package manager | pnpm 10.33 | Fast, deterministic, disk-efficient lockfile |
| Build tool | Vite 8 (via Astro) | Astro 6 wraps Vite Environment API |
| Default render mode | Static + selective SSR (`output: "server"` + `prerender = true`) | Most pages prerender; opt-in dynamic routes |
| Island framework default | React 19 (via @astrojs/react 4.x) | Largest ecosystem, agent training data |
| State mgmt | Nano Stores 0.10 across islands | Tiny shared store works React+Svelte+vanilla |
| Routing/Nav | File-based (`src/pages/**`) | Astro built-in; no extra config |
| Data layer | Cloudflare D1 + raw SQL via `env.DB.prepare()` | Native Workers binding; no ORM weight |
| Migrations | Wrangler D1 migrations (`migrations/*.sql`) | Versioned, runs locally and remote |
| Auth | Lucia-style sessions over D1 + KV (cookie sessions) | Edge-native, no third-party redirect |
| Styling | Tailwind v4.2 via `@tailwindcss/vite` | Astro 5.2+ native; old `@astrojs/tailwind` deprecated |
| Forms + validation | Astro Actions + Zod (via `astro/zod`) | Stable in Astro 6; type-safe across boundary |
| Content | Content Collections v6 (`src/content.config.ts`) + Zod | Type-safe Markdown/MDX with frontmatter validation |
| MDX | `@astrojs/mdx@5` | Components inside Markdown; long-form content |
| Image strategy | `astro:assets` with Cloudflare Images binding (`imageService: "cloudflare-binding"`) | Zero-bundle Sharp, edge-optimized, native to Workers |
| Unit test runner | Vitest 4.1 | Vite-native, parallel by default |
| E2E framework | Playwright 1.59 | Parallel workers, headless Chromium |
| Mocking strategy | MSW for HTTP at adapter boundary; never mock D1 in integration | Mock at edges, real DB elsewhere |
| Logger | Console JSON via custom `log()` helper → Cloudflare Logs | Workers tail forwards stdout |
| Error tracking | Sentry `@sentry/cloudflare` | Native Workers SDK, no Node shim |
| Lint + format | Biome 2.4 | 10x faster than ESLint+Prettier, one tool |
| Type checking | `astro check` (wraps `tsc` + `.astro` compiler) | Official, knows about `.astro` files |
| Env vars + secrets | `wrangler secret put` (prod), `.dev.vars` (local) | Bound to Worker; never in `.env` |
| CI provider | GitHub Actions | Free for public repos; 2k min/mo private |
| Deploy target | Cloudflare Workers (NOT Pages) | Cloudflare official 2026 recommendation; Pages in maintenance |
| Release flow | `wrangler deploy` from CI on `main` push | One command, atomic, instant |
| Auto-update | Edge deploys; users always on latest | Static + edge SSR, no client cache stickiness |

### Versions Table (confirmed via WebSearch 2026-04-27)

| Package | Version | Released | Source |
|---|---|---|---|
| `astro` | 6.1.9 | 2026-04 | npm |
| `@astrojs/cloudflare` | 13.1.10 | 2026-04-26 | npm |
| `@astrojs/mdx` | 5.0.3 | 2026-04 | npm |
| `@astrojs/react` | 4.4.0 | 2026-04 | npm |
| `@astrojs/svelte` | 8.0.4 | 2026-04 | npm |
| `@tailwindcss/vite` | 4.2.0 | 2026-02-18 | tailwindcss/releases |
| `tailwindcss` | 4.2.0 | 2026-02-18 | tailwindcss/releases |
| `wrangler` | 4.85.0 | 2026-04 | npm |
| `vitest` | 4.1.4 | 2026-04 | npm |
| `@playwright/test` | 1.59.1 | 2026-03 | npm |
| `@biomejs/biome` | 2.4.0 | 2026-02 | npm |
| `typescript` | 5.7.3 | — | npm |
| `nanostores` | 0.10.x | — | npm |
| `zod` | re-exported via `astro/zod` | bundled | astro docs |
| Node.js | 24.15 LTS or 22.x LTS | 2026-04-15 | nodejs.org |
| pnpm | 10.33.2 | 2026-04 | pnpm/releases |

### Minimum Host Requirements

- macOS 13+, Windows 11, or Ubuntu 22.04+
- 8 GB RAM (16 GB for SSR + Playwright runs)
- 5 GB free disk
- Stable internet (Wrangler talks to Cloudflare API)

### Cold-Start Estimate

Fresh laptop → running app: **8–12 minutes** (Node + pnpm + repo install + first `astro dev`). Add 4 min for Cloudflare account creation if new.

---

## 2. Zero-to-Running

### macOS

```bash
# 1. Install Homebrew (skip if `brew --version` works)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 22 LTS, pnpm, git, gh
brew install node@22 pnpm git gh

# 3. Verify
node -v   # expect: v22.x.x
pnpm -v   # expect: 10.33.x
git --version
gh --version

# 4. GitHub auth
gh auth login   # follow prompts; pick HTTPS, login via browser

# 5. Cloudflare account: sign up at https://dash.cloudflare.com/sign-up
#    Free plan is fine to start.

# 6. Install Wrangler globally for D1 commands (project also installs locally)
pnpm add -g wrangler@4

# 7. Authenticate Wrangler (opens browser)
wrangler login
# Expected: "Successfully logged in."
```

### Windows

```powershell
# 1. Install winget if not present (Windows 11 ships with it)
# 2. Install Node, pnpm, git, gh
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm
winget install Git.Git
winget install GitHub.cli

# 3. Verify (in a NEW PowerShell)
node -v   # v22.x.x
pnpm -v
git --version
gh --version

# 4. GitHub auth
gh auth login

# 5. Wrangler
pnpm add -g wrangler@4
wrangler login
```

### Linux (Ubuntu / Debian)

```bash
# 1. Node 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git

# 2. pnpm via corepack
corepack enable
corepack prepare pnpm@10.33.2 --activate

# 3. GitHub CLI
sudo apt install -y gh

# 4. Verify
node -v
pnpm -v
git --version
gh --version

# 5. Auth
gh auth login
pnpm add -g wrangler@4
wrangler login
```

### Bootstrap

```bash
# 1. Create the project
pnpm create astro@latest my-app -- --template minimal --typescript strict --no-install --no-git
cd my-app

# 2. Install all deps used by this rulebook (pinned)
pnpm add astro@6.1.9 \
  @astrojs/cloudflare@13.1.10 \
  @astrojs/mdx@5.0.3 \
  @astrojs/react@4.4.0 \
  react@19 react-dom@19 \
  @tailwindcss/vite@4.2.0 tailwindcss@4.2.0 \
  nanostores@0.10 @nanostores/react@0.8 \
  @sentry/cloudflare@9

pnpm add -D wrangler@4.85.0 \
  @cloudflare/workers-types@4 \
  @types/react@19 @types/react-dom@19 \
  vitest@4.1.4 @vitest/coverage-v8@4.1.4 \
  @playwright/test@1.59.1 \
  @biomejs/biome@2.4.0 \
  typescript@5.7.3

# 3. Initialise Cloudflare project files (see section 16 for exact contents)

# 4. Run dev server
pnpm dev
```

**Expected first-run output:**

```
 astro  v6.1.9 ready in 612 ms

┃ Local    http://localhost:4321/
┃ Network  use --host to expose

 watching for file changes...
```

### Common First-Run Errors

| Error | Fix |
|---|---|
| `Error: Cannot find module 'workerd'` | `pnpm add -D wrangler@4 @cloudflare/workers-types@4` then restart dev |
| `Astro requires Node 22+` | `nvm install 22 && nvm use 22` (mac/linux) or reinstall Node 22 (win) |
| `Tailwind not loaded` | Confirm `@tailwindcss/vite` is in `astro.config.ts` plugins, NOT `@astrojs/tailwind` |
| `wrangler login` hangs | Open `http://localhost:8976` manually, paste auth code |
| `Cannot find module 'astro:content'` | Run `pnpm dev` once to generate `.astro/types.d.ts` |
| `D1_ERROR: no such table` | Run `pnpm db:migrate:local` (see section 12) |
| `client:* directive on .astro component` | Only apply `client:*` to React/Svelte/Vue components, never `.astro` files |
| `require is not defined` (in Workers) | Set `imageService: "cloudflare-binding"`, never `"sharp"` on Cloudflare |

---

## 3. Project Layout

```
my-app/
├── .github/
│   └── workflows/ci.yml           # typecheck + lint + test + deploy
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules                      # mirror of section 8 ALWAYS/NEVER
├── .claude/
│   └── settings.json              # hooks + allowlist
├── .dev.vars                      # local secrets — gitignored
├── .gitignore
├── AGENTS.md                      # Codex pointer
├── CLAUDE.md                      # Claude Code pointer
├── astro.config.ts                # adapter + integrations
├── biome.json                     # lint + format
├── migrations/                    # D1 migrations (numbered SQL files)
│   └── 0001_init.sql
├── package.json
├── playwright.config.ts
├── public/                        # static assets served as-is
│   └── favicon.svg
├── src/
│   ├── actions/                   # Astro Actions (server functions)
│   │   └── index.ts
│   ├── components/                # `.astro` + framework islands
│   │   ├── ui/                    # shared Astro components
│   │   └── islands/               # opt-in interactive (React/Svelte)
│   ├── content/                   # Markdown/MDX collections
│   │   └── blog/
│   ├── content.config.ts          # collection schemas
│   ├── env.d.ts                   # Astro + Cloudflare bindings types
│   ├── layouts/                   # page wrappers
│   │   └── BaseLayout.astro
│   ├── lib/                       # pure TS helpers (no framework imports)
│   │   ├── db.ts                  # D1 query helpers
│   │   ├── log.ts                 # structured logger
│   │   └── session.ts             # auth helpers
│   ├── pages/                     # FILE-BASED ROUTES (Astro reserved)
│   │   ├── api/                   # endpoints (`Response` objects)
│   │   ├── index.astro
│   │   └── blog/[slug].astro
│   ├── stores/                    # nanostores
│   │   └── user.ts
│   └── styles/
│       └── global.css             # `@import "tailwindcss";`
├── tests/
│   ├── unit/
│   └── e2e/
├── tsconfig.json
└── wrangler.toml                  # Worker bindings (D1, KV, secrets refs)
```

### Naming Conventions

- Components: `PascalCase.astro`, `PascalCase.tsx`.
- Pages: `kebab-case.astro` for static, `[param].astro` for dynamic.
- Stores: `camelCase.ts` exports default `$camelCase` atom.
- Tests: `*.test.ts` (unit), `*.spec.ts` (e2e).
- Content slugs: `kebab-case.md` or `kebab-case.mdx`.
- DB migrations: `NNNN_description.sql` (e.g. `0003_add_users_index.sql`).

### "Where does X go?" Decision Table

| Adding... | Goes in | Notes |
|---|---|---|
| New page route | `src/pages/<name>.astro` | File path = URL path |
| Dynamic route | `src/pages/[slug].astro` | Use `getStaticPaths()` for static, `prerender = false` for SSR |
| API endpoint | `src/pages/api/<name>.ts` | Export `GET`, `POST`, etc. |
| Reusable layout | `src/layouts/<Name>.astro` | Wrap `<slot />` |
| Static UI bit | `src/components/ui/<Name>.astro` | No JS by default |
| Interactive widget | `src/components/islands/<Name>.tsx` | Hydrate via `client:*` |
| Server action (form/RPC) | `src/actions/index.ts` (`server` export) | Call via `actions.foo()` |
| Markdown/MDX content | `src/content/<collection>/<slug>.md` | Validated by `content.config.ts` |
| New collection schema | `src/content.config.ts` (`defineCollection`) | Restart dev after edit |
| DB migration | `migrations/NNNN_*.sql` | Numbered, never edit applied ones |
| Pure helper / no IO | `src/lib/<name>.ts` | No imports from `astro:` |
| DB query helper | `src/lib/db.ts` | Single file; export typed functions |
| Cross-island state | `src/stores/<name>.ts` | Use `nanostores` |
| Global CSS | `src/styles/global.css` | Import once in BaseLayout |
| Static asset (image, font) | `public/` (unprocessed) or `src/assets/` (optimized) | `astro:assets` only reads `src/assets/` |
| Env var (local) | `.dev.vars` | KEY=value format |
| Secret (prod) | `wrangler secret put KEY` | Never commit |
| TypeScript ambient types | `src/env.d.ts` | Extend Astro's `Locals` here |

---

## 4. Architecture

### Process Boundaries

```
┌──────────────────────────────────────────────────────────────┐
│  Browser                                                     │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ HTML (always) + CSS (always)                           │  │
│  │ ┌──────────────────────────────────────────────────┐   │  │
│  │ │ Island JS (only when client:* directive present) │   │  │
│  │ └──────────────────────────────────────────────────┘   │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                  │ HTTPS
                  ▼
┌──────────────────────────────────────────────────────────────┐
│  Cloudflare Edge (workerd runtime)                           │
│  ┌────────────────────────────────────────────────────────┐  │
│  │ Astro SSR Worker                                       │  │
│  │   - Renders .astro pages                               │  │
│  │   - Calls Astro Actions                                │  │
│  │   - Reads/writes D1, KV via env bindings               │  │
│  └────────────────────────────────────────────────────────┘  │
│         │                    │                  │            │
│         ▼                    ▼                  ▼            │
│   ┌──────────┐        ┌──────────┐        ┌──────────┐       │
│   │   D1     │        │   KV     │        │  Images  │       │
│   │ (SQLite) │        │ (cache)  │        │ (binding)│       │
│   └──────────┘        └──────────┘        └──────────┘       │
└──────────────────────────────────────────────────────────────┘
```

### Data Flow: typical request

```
User clicks /blog/my-post
   │
   ▼
Cloudflare Edge Worker
   │
   ├─ Static? -> serve prerendered HTML from CDN cache. Done.
   │
   └─ Dynamic? -> Astro SSR
        │
        ▼
        page.astro frontmatter runs
        │
        ├─ env.DB.prepare(SELECT...).first() -> D1
        ├─ env.KV.get('session:...') -> KV
        │
        ▼
        Returns HTML + island script tags
        │
        ▼
   Browser hydrates only `client:*` components
```

### Auth Flow

```
1. User submits POST /api/login form
2. Astro Action `login` runs in Worker:
   - Validates body with Zod
   - SELECT user WHERE email=? from D1
   - bcrypt.verify(password, user.hash)   [via @noble/hashes]
   - Generate session token (crypto.randomUUID)
   - INSERT into sessions table (D1) with expires_at
   - Set-Cookie: __session=<token>; HttpOnly; Secure; SameSite=Lax
3. Redirect to /
4. On every subsequent request, middleware reads cookie:
   - Locals.user = await getSession(token, env.DB)
5. Logout: DELETE from sessions; clear cookie
```

### State Flow (islands)

```
Server (.astro)              Client island (React)
   │                              │
   ├─ data fetched server-side    │
   │  passed as props             │
   ├─────────props──────────────▶ │
   │                              ├─ uses props for first paint
   │                              ├─ subscribes to nanostore
   │                              │
   │     other island ──┐         │
   │                    ▼         │
   │              shared $store ──┴─ both re-render
```

### Entry Points

| File | Responsibility |
|---|---|
| `astro.config.ts` | Adapter + integrations + Vite plugins |
| `wrangler.toml` | Worker name, D1/KV bindings, env vars at runtime |
| `src/env.d.ts` | TypeScript declarations for `App.Locals`, `Env` |
| `src/pages/index.astro` | Home route |
| `src/middleware.ts` | Per-request auth, locals injection |
| `src/actions/index.ts` | All RPC-style server actions |
| `src/content.config.ts` | All content collection schemas |

### Where Business Logic Lives

- **YES**: `src/actions/`, `src/lib/`, `src/pages/api/`.
- **NO**: `src/components/`, `src/pages/*.astro` frontmatter beyond reads, framework islands. Islands receive props; they do not query D1.

---

## 5. Dev Workflow

### Start

```bash
pnpm dev
```

Watchers running:
- Astro dev server (Vite) → HMR for `.astro`, `.ts`, `.tsx`, `.css`.
- Wrangler local mode (via `@astrojs/cloudflare` + `astro dev`) → emulates Workers runtime, D1, KV.
- Tailwind v4 JIT → recompiles on class changes.

### Hot Reload

Works for: `.astro` template + frontmatter, `.tsx` islands (Fast Refresh), `.css`, content files.

Breaks (full reload required) for: `astro.config.ts`, `wrangler.toml`, `content.config.ts`, `tsconfig.json`, `.dev.vars`. Stop and restart `pnpm dev`.

### Debugger

**VS Code / Cursor**: see `.vscode/launch.json` in section 15. Two configs: "Astro: server-side" (attach to Node), "Astro: browser" (Chrome).

**Browser**: standard DevTools. React DevTools work for React islands. Each island shows up isolated in the React tree.

### Inspect Runtime State

- D1 (local): `wrangler d1 execute DB --local --command "SELECT * FROM users LIMIT 10"`.
- D1 (prod): `wrangler d1 execute DB --remote --command "..."` (requires confirmation).
- KV (local): `wrangler kv key list --binding KV --local`.
- Logs (prod): `wrangler tail` (streams Worker stdout).

### Pre-commit Checks

`.git/hooks/pre-commit` (created by section 16 scaffold):

```bash
pnpm biome check --write . && pnpm exec astro check
```

Runs format + lint + type-check before each commit. Blocks commit on failure.

### Branch + Commit Conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`).
- One feature per PR. PR title becomes squash commit.

---

## 6. Testing & Parallelization

### Unit Tests

```bash
pnpm test                # vitest run
pnpm test:watch          # vitest watch
pnpm test path/to/x      # single file
pnpm test -t "name"      # by test name
```

Tests live in `tests/unit/**/*.test.ts` and colocated `*.test.ts` next to `src/lib/` files. Vitest auto-discovers.

### Integration Tests

For D1: spin up local SQLite via `wrangler dev --local --persist-to .wrangler/state` and hit `http://localhost:8787` with `fetch`. NEVER mock D1.

### E2E Tests

```bash
pnpm test:e2e            # playwright test (parallel)
pnpm test:e2e --ui       # interactive
pnpm test:e2e --grep "login"
```

Parallel by default — see `playwright.config.ts` (`workers: '50%'`, `fullyParallel: true`).

### Mocking Rules

- **Mock**: outbound HTTP (use MSW at `fetch` boundary in `src/lib/`).
- **Don't mock**: D1, KV, Astro Actions, `astro:content`, `astro:assets`. Use the real local emulator.
- **Never mock**: `crypto`, `Date.now()` (use Vitest fake timers for time, Web Crypto for hashes).

### Coverage

Target ≥70% line on `src/lib/` and `src/actions/`. Exclude `src/pages/`, `src/components/`.

```bash
pnpm test:coverage
```

### Visual Regression

Optional: Playwright `expect(page).toHaveScreenshot()`. Snapshots committed under `tests/e2e/__screenshots__/`.

### Parallelization Patterns for AI Agents

**Safe to fan out (parallel subagents):**
- Different `src/components/` files.
- Different `src/pages/<route>.astro` files (no shared state).
- Different content entries in `src/content/blog/`.
- Different test files.

**Must be sequential:**
- `package.json` (lockfile races corrupt deps).
- `pnpm-lock.yaml`.
- `astro.config.ts`, `wrangler.toml`, `biome.json`, `tsconfig.json`.
- `src/content.config.ts`.
- `src/env.d.ts`.
- D1 migrations (numbering matters).
- `src/middleware.ts` (single per project).

---

## 7. Logging

### Setup (`src/lib/log.ts`)

```ts
type Level = "debug" | "info" | "warn" | "error";

export function log(
  level: Level,
  event: string,
  fields: Record<string, unknown> = {},
): void {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  if (level === "error") console.error(line);
  else console.log(line);
}
```

### Levels

- `debug`: dev-only diagnostic (skip in prod).
- `info`: request received, action completed.
- `warn`: recoverable (rate-limit, missing optional field).
- `error`: 5xx, exception, data corruption.

### Required Fields

Every line: `ts`, `level`, `event`. Plus context: `request_id`, `user_id` (if authed), `route`, `module`, `duration_ms` for slow ops.

### Sample Lines

```json
{"ts":"2026-04-27T12:00:00Z","level":"info","event":"app.boot","version":"1.0.0"}
{"ts":"2026-04-27T12:00:01Z","level":"info","event":"http.req","method":"GET","route":"/blog/[slug]","request_id":"abc"}
{"ts":"2026-04-27T12:00:01Z","level":"info","event":"http.res","status":200,"duration_ms":42,"request_id":"abc"}
{"ts":"2026-04-27T12:00:02Z","level":"error","event":"d1.query.failed","sql":"SELECT * FROM users","err":"no such table","request_id":"abc"}
{"ts":"2026-04-27T12:00:03Z","level":"warn","event":"slow.op","duration_ms":1240,"action":"login"}
{"ts":"2026-04-27T12:00:04Z","level":"info","event":"user.signup","user_id":"u_123"}
```

### Where Logs Go

- Dev: stdout (terminal running `pnpm dev`).
- Prod: Cloudflare Workers Logs (auto-captured) + Sentry for `error` level.

### Grep Locally

```bash
pnpm dev 2>&1 | tee dev.log
grep '"level":"error"' dev.log
grep '"event":"http.req"' dev.log | jq .
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm exec astro check && pnpm exec biome check . && pnpm test` before claiming done.
2. Always pin dependency versions exactly in `package.json` (no `^`, no `~`).
3. Always use `astro:content` `getCollection()` and `getEntry()` to read content; never read raw files from `src/content/`.
4. Always validate user input with Zod inside Astro Actions before touching D1.
5. Always parameterise SQL with `env.DB.prepare(sql).bind(arg1, arg2)`; never string-concatenate SQL.
6. Always set `prerender = true` on pages that don't need request-time data.
7. Always use `client:visible` or `client:idle` for non-critical islands; reserve `client:load` for above-fold interactive controls.
8. Always co-locate `src/components/islands/` framework components and apply `client:*` only at the import site (page or layout).
9. Always type Cloudflare bindings via `src/env.d.ts` extending `App.Locals` and a `Runtime<Env>` type.
10. Always run `pnpm db:migrate:local` after pulling new migrations before `pnpm dev`.
11. Always use `wrangler secret put NAME` for prod secrets; only `.dev.vars` for local.
12. Always use `astro:assets` `<Image />` and `<Picture />` for images sourced from `src/assets/`.
13. Always set `imageService: "cloudflare-binding"` (or `"compile"` for pure static) in the Cloudflare adapter; never `"sharp"` on Workers.
14. Always set the Astro adapter via `@astrojs/cloudflare`'s default mode (Workers); never deploy to Pages on a new project.
15. Always use Astro Actions for form submissions, not raw `fetch` to `src/pages/api/`.
16. Always include a `request_id` (from `crypto.randomUUID()`) in every log line for a request, set in `src/middleware.ts`.
17. Always commit `pnpm-lock.yaml`. Never commit `.dev.vars`, `.wrangler/`, `dist/`, `.astro/`.
18. Always cap `client:` directives at one per island — pick the lightest that satisfies UX.
19. Always run `wrangler deploy --dry-run` in CI before the real deploy on `main`.
20. Always verify Cloudflare D1 query results with `.first()`, `.all()`, or `.run()` — those are the only valid terminators.
21. Always write `.astro` components by default; only reach for React/Svelte when interactivity is genuinely needed.
22. Always update `src/content.config.ts` schema *before* adding entries that use new fields.

### 8.2 NEVER

1. Never apply `client:*` directives to `.astro` components — Astro errors at build time.
2. Never import Node-only modules (`fs`, `path`, `child_process`) in code that runs in the Worker. Use Web APIs.
3. Never call `import.meta.env.SECRET_X` in client islands — that leaks secrets to the bundle. Server-only.
4. Never deploy with `output: "static"` if any page reads cookies or queries D1 at request time.
5. Never run `wrangler d1 execute --remote` with destructive SQL (`DROP`, `DELETE`, `UPDATE`) without `--yes` confirmation reviewed.
6. Never use the deprecated `@astrojs/tailwind` integration; it does not support Tailwind v4.
7. Never put dynamic JS in `public/` expecting it to be processed; `public/` is verbatim copy.
8. Never query D1 inside framework island code; do it server-side and pass props.
9. Never hard-code Worker URLs; use `Astro.url` or `Astro.site` for canonical links.
10. Never edit a migration that has been applied to prod (`migrations/0001_*.sql`); add a new numbered file instead.
11. Never use `Date.now()` or `Math.random()` in `.astro` frontmatter for static pages — output will be stale.
12. Never call `require()` anywhere; ESM only.
13. Never commit `wrangler.toml` with real `database_id` — use `${VAR}` placeholders if multiple environments share the file, or use the `[env.production]` block.
14. Never set `compatibility_date` to a date older than 6 months; bump on each major Wrangler update.
15. Never disable strict TypeScript (`"strict": true` is mandatory).
16. Never bypass `astro check` with `--minimumFailingSeverity warning`; all errors must be fixed.
17. Never store passwords as plaintext; hash with `@noble/hashes` (PBKDF2 or scrypt) — bcrypt isn't Workers-compatible.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command, every build | `pnpm install && pnpm exec astro check && pnpm test && pnpm build` |
| `pnpm-lock.yaml` | reproducibility | `pnpm install --frozen-lockfile && pnpm build` |
| `astro.config.ts` | build, dev server, deploy | cold `pnpm build && pnpm preview` + visit homepage |
| `wrangler.toml` | runtime bindings, deploy target | `wrangler deploy --dry-run` |
| `tsconfig.json` | type-check | `pnpm exec astro check` full project |
| `biome.json` | lint+format CI gate | `pnpm exec biome check .` |
| `src/content.config.ts` | every content page, type generation | `pnpm dev` once → `astro check` |
| `src/env.d.ts` | typing of Astro.locals across project | full `astro check` |
| `src/middleware.ts` | every request, every page | run dev, hit 3+ routes, check logs |
| `src/layouts/BaseLayout.astro` | every page wrapper, global CSS | visit each top-level route |
| `src/styles/global.css` | every page styling | visual diff or screenshot test |
| `migrations/*.sql` | DB schema, types | `pnpm db:reset:local && pnpm test` |
| `src/lib/db.ts` | every query | run integration tests |
| `src/lib/session.ts` | auth on every request | run E2E login flow |
| `src/actions/index.ts` | all forms / RPC | E2E + unit tests for each action |
| `src/pages/api/**/*.ts` | external API surface | hit each endpoint with curl + Playwright |
| `playwright.config.ts` | E2E reliability | `pnpm test:e2e` cold |
| `vitest.config.ts` | unit tests | `pnpm test` |
| `.github/workflows/ci.yml` | CI gating | open a no-op PR, watch all jobs pass |
| `public/**` | static asset URLs | `curl https://example.com/<file>` |
| `src/content/**` | rendered pages | `pnpm build` succeeds + page renders |
| `.dev.vars` | local-only env | `pnpm dev` boots, login flow works locally |
| Wrangler secrets | prod env | `wrangler secret list` + smoke test |

### 8.4 Definition of Done (per task type)

**Bug fix**: failing test added that reproduces; fix applied; all tests pass; manual reproduction case verified; commit message includes "Fixes #N".

**New feature**: type-check + lint clean; unit tests cover happy + 1 sad path; E2E test for primary user flow; screenshot in PR description for any UI; `pnpm build` succeeds.

**Refactor**: no behaviour change; existing test suite passes unchanged (no test edits except renames); LOC and bundle size noted.

**Dependency bump**: only patch/minor unless flagged; `pnpm exec astro check && pnpm test && pnpm test:e2e && pnpm build` all green; release notes skimmed for breaking changes.

**Schema change**: new numbered migration file; `pnpm db:reset:local && pnpm test` passes; types updated via Wrangler; rollback note in PR.

**Copy change**: `pnpm exec astro check` (catches typos in schema-validated content); preview on staging Worker.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile        # expect: "Done in Xs"
pnpm exec astro check                  # expect: "0 errors, 0 warnings, 0 hints"
pnpm exec biome check .                # expect: "Checked X files. No fixes applied."
pnpm test --run                        # expect: "Test Files X passed (X) | Tests Y passed (Y)"
pnpm test:e2e --reporter=line          # expect: "X passed (Xs)"
pnpm build                             # expect: "Complete!" + "[build] Server built in Xs"
pnpm preview                           # smoke: visit http://localhost:4321/
```

If any step fails: STOP. Do not declare done. Investigate.

### 8.6 Parallelization Patterns

Safe parallel fan-out:
- Generate 5 blog posts in `src/content/blog/` (each its own MD file).
- Scaffold 3 unrelated pages in `src/pages/`.
- Add 3 new components in `src/components/ui/`.

Sequential only:
- Anything writing `package.json` (run `pnpm add` once, batch all deps).
- D1 migrations (numbering = ordering).
- Edits to `src/content.config.ts`, `astro.config.ts`, `wrangler.toml`, `src/env.d.ts`.

---

## 9. Stack-Specific Pitfalls

1. **Forgetting `client:*` is opt-in** → Symptom: button does nothing on page. Cause: `<MyButton />` with no directive renders as static HTML. Fix: `<MyButton client:visible />`. Detect: console silent; manually test interactions.
2. **`client:*` on `.astro` component** → Symptom: build error "client:* directive is not supported on Astro components". Fix: convert to `.tsx` or `.svelte`. Detect: build fails immediately.
3. **Defaulting to `client:load` everywhere** → Symptom: bundle size balloons, poor TTI. Fix: prefer `client:visible` and `client:idle`. Detect: `pnpm build` reports JS > 100KB.
4. **Server-only API leaking into island** → Symptom: `D1Database is not defined` at runtime, or secret exposed in client bundle. Fix: query in `.astro` frontmatter, pass plain JSON props. Detect: search bundle output for known secrets.
5. **Deploying to Pages instead of Workers** → Symptom: missing features, slower cold starts. Fix: ensure `wrangler.toml` has `main = "./dist/_worker.js/index.js"` and adapter mode is Workers. Detect: `wrangler deploy` output mentions "Pages" — wrong.
6. **`output: "static"` with dynamic data** → Symptom: stale page in prod. Fix: `output: "server"` and add `export const prerender = false` to dynamic pages, leave static ones as default-prerendered. Detect: data freshness assertion fails.
7. **Mixing legacy collections with v2** → Symptom: `getCollection()` returns empty. Fix: use only `defineCollection({ loader, schema })` in `src/content.config.ts`; remove `legacy.collections` flag. Detect: `getCollection('blog')` length 0 despite files present.
8. **Tailwind v4 with old `@astrojs/tailwind`** → Symptom: utility classes don't apply. Fix: uninstall `@astrojs/tailwind`, install `@tailwindcss/vite`, add to `vite.plugins`, create `src/styles/global.css` with `@import "tailwindcss";`. Detect: classes appear in HTML but no CSS rules generated.
9. **Sharp on Cloudflare** → Symptom: build OK but runtime "require is not defined". Fix: `imageService: "cloudflare-binding"`. Detect: `wrangler tail` shows `require is not defined`.
10. **`fetch` failing in dev with bindings** → Symptom: `env.DB is undefined`. Fix: ensure `wrangler.toml` D1 binding present and `pnpm dev` (not bare `astro dev`) — adapter wires bindings into `Astro.locals.runtime.env`. Detect: log `Astro.locals.runtime` returns undefined.
11. **Forgetting to regenerate types after `wrangler.toml` change** → Symptom: TS error `Property 'KV' does not exist on type 'Env'`. Fix: `wrangler types && pnpm exec astro check`. Detect: red squiggles after binding rename.
12. **Editing applied migration** → Symptom: prod schema diverges from dev. Fix: never edit `migrations/000N_*.sql` once applied; add `migrations/000(N+1)_fix_*.sql`. Detect: `wrangler d1 migrations list --remote` mismatch.
13. **`.dev.vars` not loaded** → Symptom: env var undefined locally. Fix: file lives at project root, format `KEY=value` (no `export`, no quotes for plain strings), restart dev. Detect: `console.log(env)` shows missing key.
14. **MDX components not styled** → Symptom: rendered MDX has no Tailwind classes. Fix: import a wrapper component that applies `prose` and pass it via `<Content components={{...}} />` or wrap in BaseLayout with `prose` class. Detect: HTML present, no styling.
15. **Hydration mismatch from non-deterministic frontmatter** → Symptom: console "Expected server HTML to contain a matching..." in dev. Fix: avoid `Date.now()`, `Math.random()`, locale-dependent date formatting at module top-level; compute inside `useEffect` or `client:only` islands. Detect: dev console warning.
16. **Wrangler `compatibility_date` outdated** → Symptom: missing Web API in prod (e.g. `URLPattern`). Fix: bump `compatibility_date = "2026-04-15"` in `wrangler.toml`. Detect: `ReferenceError` only in prod logs.
17. **Importing `astro:content` in island** → Symptom: build error or runtime crash. Fix: pass content via props from `.astro` page. Detect: Vite error "astro:content" cannot be used client-side.

---

## 10. Performance Budgets

| Metric | Budget | How to measure | If exceeded |
|---|---|---|---|
| TTFB (edge) | < 200ms p95 | `wrangler tail` duration field | Check D1 query plans, add KV cache layer |
| LCP | < 1.5s on 4G | Lighthouse CI | Move island to `client:visible`, lazy-load images |
| JS bundle (per island) | < 30KB gz | `pnpm build` output `dist/_astro/` | Split, drop framework, switch to `.astro` |
| Total client JS (homepage) | < 50KB gz | `du -sh dist/_astro/*.js` | Audit `client:*` usage |
| Worker CPU per request | < 10ms p95 | `wrangler tail` `cpuTime` | Move logic out of hot path, cache |
| Cold build time | < 60s | `time pnpm build` | Audit content collection size, MDX plugins |
| Image weight | < 200KB per LCP image | DevTools Network | Use `<Picture>` with WebP/AVIF |

---

## 11. Security

### Secret Storage

- **Local dev**: `.dev.vars` (gitignored). Format: `KEY=value`.
- **Prod**: `wrangler secret put NAME` (encrypted at rest). List via `wrangler secret list`.
- **NEVER** put secrets in: `.env`, `astro.config.ts`, code, `wrangler.toml` (it's committed).

### Auth Threat Model

- Cookies: `HttpOnly; Secure; SameSite=Lax`. 30-day expiry. Rotated on privilege change.
- Sessions stored in D1 with `user_id`, `expires_at`, `created_ip`. Check expiry on every request.
- CSRF: `SameSite=Lax` blocks most. For cross-site forms, add per-session token in form (Astro Actions handle automatically via `Astro.request`).

### Input Validation

All Astro Action inputs: `z.object({...}).parse(input)` first line of handler. All `pages/api/*.ts` POST: parse JSON, validate with Zod, return 400 on failure.

### Output Escaping

`.astro` templating auto-escapes by default. Only `set:html` bypasses; never use it on user input.

### Dependency Audit

```bash
pnpm audit --prod      # weekly
pnpm outdated          # weekly
```

CI runs `pnpm audit --prod --audit-level=high` and fails on high+ severity.

### Top 5 Stack-Specific Risks

1. Leaking `D1` env to client by mis-typing `Astro.locals.runtime.env` → instead destructure on server only and pass minimal props.
2. SSRF via `fetch(userInput)` in actions → allowlist hosts.
3. Stored XSS via Markdown HTML → sanitize MDX output (use `rehype-sanitize`) for any user-submitted content.
4. Open redirect via `?next=` cookies → validate redirect target is same-origin.
5. D1 SQL injection → only parameterised `prepare().bind()`, never template strings.

---

## 12. Deploy

### Release Flow

```bash
# 1. Local sanity
pnpm exec astro check && pnpm test && pnpm build

# 2. Apply pending migrations to prod (manual gate)
wrangler d1 migrations apply DB --remote

# 3. Deploy
wrangler deploy

# 4. Smoke
curl -fsS https://<your-worker>.workers.dev/api/health
# expect: {"ok":true,"version":"<git-sha>"}
```

CI does steps 1, 3, 4 automatically on push to `main`. Step 2 requires manual approval (GitHub environments).

### Staging vs Prod

`wrangler.toml` defines `[env.staging]` and `[env.production]` with separate D1/KV bindings.

```bash
wrangler deploy --env staging        # deploys to <name>-staging.workers.dev
wrangler deploy --env production     # deploys to <name>.workers.dev
```

### Rollback

```bash
wrangler rollback                    # rolls back last deploy
wrangler deployments list            # see all deploys, IDs
wrangler rollback <deployment-id>    # rollback to specific version
```

Window: any deploy from last 30 days is rollbackable.

### Health Check

`src/pages/api/health.ts`:

```ts
export const prerender = false;
export const GET = () => Response.json({ ok: true, version: import.meta.env.GIT_SHA ?? "dev" });
```

### Versioning

`package.json` `version` + injected `GIT_SHA` at build time:

```bash
GIT_SHA=$(git rev-parse --short HEAD) pnpm build
```

### DNS

```bash
wrangler deploy
# Then in Cloudflare dashboard:
# Workers & Pages → my-app → Settings → Triggers → Custom Domain
# Add: app.example.com (auto-creates DNS records)
```

### Cost Estimate (1k MAU)

- Workers: ~free tier (100k req/day = 3M/mo). 1k MAU at 100 req/user/mo = 100k req → free.
- D1: free tier (5M reads/day, 100k writes/day, 5GB storage).
- KV: free tier (100k reads/day, 1k writes/day).
- Total: **$0/mo at 1k MAU**. Scales to ~$5 at 50k MAU.

---

## 13. Claude Code Integration

### `CLAUDE.md` (project root)

```md
# Project: Astro on Cloudflare

This project follows `/opt/Loopa/rulebooks/astro-cloudflare.md`. Read it once.

## Stack
- Astro 6.1.9 + TypeScript 5.7 strict
- @astrojs/cloudflare 13.1.10 (Workers mode, NOT Pages)
- @astrojs/mdx 5, @astrojs/react 4
- Tailwind v4.2 via @tailwindcss/vite (NOT @astrojs/tailwind)
- D1 + KV via Wrangler 4.85
- Vitest 4 + Playwright 1.59
- Biome 2.4 (lint+format)

## Commands you will run
- pnpm dev
- pnpm build
- pnpm exec astro check
- pnpm exec biome check .
- pnpm test
- pnpm test:e2e
- pnpm db:migrate:local
- wrangler tail
- wrangler deploy

## Banned patterns
- `client:load` unless above-the-fold and interactive
- `@astrojs/tailwind` (deprecated, use `@tailwindcss/vite`)
- `output: "static"` if any route reads cookies or D1
- Sharp on Cloudflare (use `imageService: "cloudflare-binding"`)
- `require()` (ESM only)
- String-concat SQL (use `prepare().bind()`)
- Editing applied migrations
- Secrets in `astro.config.ts` or `wrangler.toml`

## Skills to invoke
- /test-driven-development before any feature
- /systematic-debugging on any failing test
- /verification-before-completion before claiming done
- /ship to open PR
```

### `.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(pnpm exec astro check)",
      "Bash(pnpm exec biome check .)",
      "Bash(pnpm exec biome format --write .)",
      "Bash(pnpm test:*)",
      "Bash(pnpm build)",
      "Bash(pnpm dev)",
      "Bash(pnpm preview)",
      "Bash(pnpm db:migrate:local)",
      "Bash(pnpm db:reset:local)",
      "Bash(wrangler types)",
      "Bash(wrangler d1 execute DB --local --command:*)",
      "Bash(wrangler d1 migrations list:*)",
      "Bash(wrangler dev:*)",
      "Bash(wrangler deploy --dry-run)",
      "Bash(wrangler tail:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push)",
      "Bash(gh pr:*)"
    ],
    "deny": [
      "Bash(wrangler d1 execute * --remote --command DROP*)",
      "Bash(wrangler d1 execute * --remote --command DELETE*)",
      "Bash(wrangler secret delete:*)",
      "Bash(rm -rf:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm exec biome format --write \"$CLAUDE_FILE\" 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm exec astro check 2>&1 | tail -5" }
        ]
      }
    ]
  }
}
```

### Slash command shortcuts

- `/qa` — open dev, smoke each route.
- `/ship` — typecheck + test + build + push + open PR.
- `/investigate` — for hydration mismatches, prod-only errors.

---

## 14. Codex Integration

### `AGENTS.md`

```md
# AGENTS.md

This project follows `/opt/Loopa/rulebooks/astro-cloudflare.md`. Same rules apply to Codex.

## Stack summary
Astro 6 + Cloudflare Workers + D1 + Tailwind v4 + Biome + Vitest + Playwright. TypeScript strict.

## Verify before complete
```
pnpm install --frozen-lockfile
pnpm exec astro check
pnpm exec biome check .
pnpm test --run
pnpm build
```

## Do
- Use Astro Actions for forms.
- Use `astro:content` for collections.
- Pin every dependency exactly.
- Pass server data to islands as props.

## Don't
- Use @astrojs/tailwind (deprecated).
- Use Sharp image service on Cloudflare.
- Apply `client:*` to `.astro` files.
- Edit applied migrations.
- Deploy to Pages (Workers only).
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false

[shell_environment_policy]
inherit = "core"
include_only = ["PATH", "HOME", "NODE_*", "PNPM_*", "CLOUDFLARE_*"]

[[mcp_servers]]
# none required
```

### Where Codex differs from Claude Code

- Codex defaults to single-file edits; for multi-file refactors prompt explicitly with file list.
- Codex sandbox blocks network by default; toggle for `pnpm install` or `wrangler login`.
- No `Skill` system — invoke patterns by literal prompt ("write a failing test first").

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Cursor Rules — Astro + Cloudflare

ALWAYS:
- Read /opt/Loopa/rulebooks/astro-cloudflare.md before edits.
- Pin dependency versions exactly in package.json.
- Use Zod (via astro/zod) for input validation in Astro Actions.
- Use `prepare().bind()` for all D1 queries, never string interpolation.
- Pass props from server (.astro) to island components; never query D1 in islands.
- Use `client:visible` or `client:idle` by default; `client:load` only above-fold.
- Use `astro:content` getCollection/getEntry, never raw fs reads in src/content.
- Run `pnpm exec astro check && pnpm exec biome check . && pnpm test` before declaring done.
- Use @tailwindcss/vite (Tailwind v4); the @astrojs/tailwind package is deprecated.
- Set imageService: "cloudflare-binding" or "compile" — never "sharp" on Cloudflare.

NEVER:
- Apply `client:*` to .astro components.
- Import `fs`, `path`, `child_process`, or other Node-only modules in Worker code.
- Read `import.meta.env.SECRET_*` from inside an island component.
- Edit a migration file once it's been applied to prod.
- Commit `.dev.vars`, `.wrangler/`, `.astro/`, or `dist/`.
- Set `output: "static"` on a project with auth or D1-backed pages.
- Use `require()`; ESM only.
- Deploy with `@astrojs/cloudflare` mode set to anything but Workers on a new project.
- Hash passwords with bcrypt (incompatible with Workers); use @noble/hashes.
- Set `nodeIntegration: true` style escape hatches.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "astro-build.astro-vscode",
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "cloudflare.workers-vscode",
    "ms-playwright.playwright",
    "vitest.explorer"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Astro: dev (server)",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["dev"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal"
    },
    {
      "name": "Astro: browser",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:4321",
      "webRoot": "${workspaceFolder}/src"
    },
    {
      "name": "Vitest: current file",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After the last one, `git push` produces a deployable hello-world.

### 1. `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "type": "module",
  "private": true,
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "wrangler dev",
    "start": "astro dev",
    "check": "astro check",
    "test": "vitest",
    "test:watch": "vitest watch",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:remote": "wrangler d1 migrations apply DB --remote",
    "db:reset:local": "rm -rf .wrangler/state && pnpm db:migrate:local",
    "deploy": "wrangler deploy",
    "types:cf": "wrangler types"
  },
  "dependencies": {
    "@astrojs/cloudflare": "13.1.10",
    "@astrojs/mdx": "5.0.3",
    "@astrojs/react": "4.4.0",
    "@nanostores/react": "0.8.4",
    "@noble/hashes": "1.5.0",
    "@sentry/cloudflare": "9.0.0",
    "@tailwindcss/vite": "4.2.0",
    "astro": "6.1.9",
    "nanostores": "0.10.3",
    "react": "19.0.0",
    "react-dom": "19.0.0",
    "tailwindcss": "4.2.0"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.0",
    "@cloudflare/workers-types": "4.20260415.0",
    "@playwright/test": "1.59.1",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "@vitest/coverage-v8": "4.1.4",
    "typescript": "5.7.3",
    "vitest": "4.1.4",
    "wrangler": "4.85.0"
  },
  "packageManager": "pnpm@10.33.2",
  "engines": { "node": ">=22" }
}
```

### 2. `astro.config.ts`

```ts
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://example.com",
  output: "server",
  adapter: cloudflare({
    imageService: "cloudflare-binding",
    platformProxy: { enabled: true },
  }),
  integrations: [react(), mdx()],
  vite: {
    plugins: [tailwindcss()],
  },
});
```

### 3. `tsconfig.json`

```json
{
  "extends": "astro/tsconfigs/strict",
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react",
    "types": ["@cloudflare/workers-types", "astro/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": [".astro/types.d.ts", "**/*"],
  "exclude": ["dist", ".wrangler"]
}
```

### 4. `wrangler.toml`

```toml
name = "my-app"
main = "./dist/_worker.js/index.js"
compatibility_date = "2026-04-15"
compatibility_flags = ["nodejs_compat"]
assets = { directory = "./dist", binding = "ASSETS" }

[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "REPLACE_WITH_ID_FROM_wrangler_d1_create"
migrations_dir = "migrations"

[[kv_namespaces]]
binding = "KV"
id = "REPLACE_WITH_ID_FROM_wrangler_kv_namespace_create"

[images]
binding = "IMAGES"

[observability]
enabled = true

[env.production]
[[env.production.d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = "PROD_DB_ID"
migrations_dir = "migrations"
```

### 5. `tailwind.config.ts`

> Note: Tailwind v4 needs no JS config. Configuration lives in `src/styles/global.css` via `@theme`. This file is optional and only kept for editor hints.

```ts
import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{astro,html,ts,tsx,svelte,md,mdx}"],
} satisfies Config;
```

### 6. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "files": { "ignore": ["dist", ".astro", ".wrangler", "node_modules"] },
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
      "suspicious": { "noExplicitAny": "error" },
      "correctness": { "noUnusedVariables": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double", "trailingCommas": "all" } },
  "overrides": [{ "include": ["*.astro"], "linter": { "rules": { "style": { "useImportType": "off" } } } }]
}
```

### 7. `playwright.config.ts`

```ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  workers: process.env.CI ? 2 : "50%",
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:4321",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:4321",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### 8. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts", "src/**/*.test.ts"],
    coverage: { reporter: ["text", "html"], include: ["src/lib/**", "src/actions/**"] },
  },
});
```

### 9. `src/env.d.ts`

```ts
/// <reference types="astro/client" />
/// <reference types="@cloudflare/workers-types" />

type Env = {
  DB: D1Database;
  KV: KVNamespace;
  IMAGES: ImagesBinding;
  ASSETS: Fetcher;
  SESSION_SECRET: string;
};

declare namespace App {
  interface Locals {
    runtime: {
      env: Env;
      cf: IncomingRequestCfProperties;
      ctx: ExecutionContext;
    };
    user: { id: string; email: string } | null;
    requestId: string;
  }
}
```

### 10. `src/content.config.ts`

```ts
import { defineCollection, z } from "astro/zod";
import { glob } from "astro/loaders";

const blog = defineCollection({
  loader: glob({ pattern: "**/*.{md,mdx}", base: "./src/content/blog" }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishedAt: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string()).default([]),
  }),
});

export const collections = { blog };
```

### 11. `src/middleware.ts`

```ts
import { defineMiddleware } from "astro:middleware";
import { log } from "@/lib/log";

export const onRequest = defineMiddleware(async (ctx, next) => {
  ctx.locals.requestId = crypto.randomUUID();
  ctx.locals.user = null;
  const start = Date.now();
  log("info", "http.req", {
    method: ctx.request.method,
    route: ctx.url.pathname,
    request_id: ctx.locals.requestId,
  });
  const res = await next();
  log("info", "http.res", {
    status: res.status,
    duration_ms: Date.now() - start,
    request_id: ctx.locals.requestId,
  });
  return res;
});
```

### 12. `src/lib/log.ts`

```ts
type Level = "debug" | "info" | "warn" | "error";
export function log(level: Level, event: string, fields: Record<string, unknown> = {}) {
  const line = JSON.stringify({ ts: new Date().toISOString(), level, event, ...fields });
  if (level === "error") console.error(line);
  else console.log(line);
}
```

### 13. `src/lib/db.ts`

```ts
export async function getUserByEmail(db: D1Database, email: string) {
  return db
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ?1")
    .bind(email)
    .first<{ id: string; email: string; password_hash: string }>();
}

export async function createUser(db: D1Database, id: string, email: string, hash: string) {
  return db
    .prepare("INSERT INTO users (id, email, password_hash) VALUES (?1, ?2, ?3)")
    .bind(id, email, hash)
    .run();
}
```

### 14. `src/styles/global.css`

```css
@import "tailwindcss";

@theme {
  --color-brand: #3b82f6;
}

html { font-family: system-ui, sans-serif; }
```

### 15. `src/layouts/BaseLayout.astro`

```astro
---
import "@/styles/global.css";
interface Props { title: string; description?: string }
const { title, description = "" } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width" />
    <title>{title}</title>
    <meta name="description" content={description} />
  </head>
  <body class="min-h-screen bg-white text-gray-900">
    <main class="max-w-3xl mx-auto p-8"><slot /></main>
  </body>
</html>
```

### 16. `src/pages/index.astro`

```astro
---
import BaseLayout from "@/layouts/BaseLayout.astro";
export const prerender = true;
---
<BaseLayout title="Hello" description="Astro on Cloudflare Workers">
  <h1 class="text-4xl font-bold">Hello, edge.</h1>
  <p class="mt-4">Running Astro 6.1.9 on Cloudflare Workers.</p>
</BaseLayout>
```

### 17. `src/pages/api/health.ts`

```ts
export const prerender = false;
export const GET = () => Response.json({ ok: true, ts: Date.now() });
```

### 18. `src/actions/index.ts`

```ts
import { defineAction } from "astro:actions";
import { z } from "astro/zod";

export const server = {
  echo: defineAction({
    input: z.object({ message: z.string().min(1).max(500) }),
    handler: async ({ message }, ctx) => {
      const env = ctx.locals.runtime.env;
      return { received: message, requestId: ctx.locals.requestId };
    },
  }),
};
```

### 19. `migrations/0001_init.sql`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_sessions_user ON sessions(user_id);
```

### 20. `.gitignore`

```
node_modules
dist
.astro
.wrangler
.dev.vars
.env*
!.env.example
*.log
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
.DS_Store
playwright-report
test-results
coverage
```

### 21. `.dev.vars.example`

```
SESSION_SECRET=change-me-in-prod
```

### 22. `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec astro check
      - run: pnpm exec biome check .
      - run: pnpm test --run
      - run: pnpm build
  e2e:
    runs-on: ubuntu-latest
    needs: check
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm test:e2e
  deploy:
    if: github.ref == 'refs/heads/main'
    needs: [check, e2e]
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy
```

### 23. `README.md`

```md
# my-app

Astro 6 + Cloudflare Workers + D1. See `/opt/Loopa/rulebooks/astro-cloudflare.md`.

## Develop
```
pnpm install
cp .dev.vars.example .dev.vars
pnpm db:migrate:local
pnpm dev
```

## Deploy
Push to `main`. CI runs check + e2e + deploy.
```

### 24. `LICENSE` — MIT, single file with project owner.

### 25. Bootstrap commands (run once)

```bash
wrangler d1 create my-app-db
# copy database_id into wrangler.toml [[d1_databases]] and [env.production]

wrangler kv namespace create KV
# copy id into wrangler.toml [[kv_namespaces]]

pnpm db:migrate:local
wrangler secret put SESSION_SECRET   # paste a 32+ byte random string

git init && git add . && git commit -m "feat: initial scaffold"
git remote add origin git@github.com:USER/my-app.git
git push -u origin main
```

---

## 17. Idea → MVP Path

Generic CRUD app (PROJECT_IDEA was blank). Substitute "post" / "todo" / "thing" as appropriate.

### Phase 1: Schema (1 session)

- `migrations/0001_init.sql`: `users`, `sessions`.
- `migrations/0002_things.sql`: `things(id, user_id, title, body, created_at)`.
- Update `src/lib/db.ts` with typed query helpers.
- Exit: `pnpm db:reset:local` runs clean; query helpers covered by unit tests.

### Phase 2: Backbone (1 session)

- Pages: `/`, `/things`, `/things/[id]`, `/things/new`, `/login`, `/signup`.
- Layout: `BaseLayout.astro` + nav.
- Empty actions stubs in `src/actions/index.ts`.
- Exit: `pnpm dev` shows all routes; clicking nav navigates; no errors.

### Phase 3: Vertical slice — "create thing" (1 session)

- Action: `things.create` (validates with Zod, INSERTs into D1).
- Page: `/things/new` with form posting to action.
- List: `/things` reads via D1 SELECT, renders.
- Tests: 1 unit test (Zod parse), 1 E2E (create → see in list).
- Exit: full create+read cycle works locally; both tests pass.

### Phase 4: Auth + multi-user (2 sessions)

- Hash passwords with `@noble/hashes/scrypt`.
- Session cookie helpers in `src/lib/session.ts`.
- Middleware sets `Astro.locals.user`.
- All thing actions check `ctx.locals.user`.
- Tests: signup → login → create thing → only that user sees it.
- Exit: two users in two browsers see only their own things.

### Phase 5: Ship + monitor (1 session)

- Configure Sentry: `import * as Sentry from "@sentry/cloudflare"; Sentry.init({...})`.
- `wrangler secret put SENTRY_DSN`.
- Custom domain in Cloudflare dashboard.
- `wrangler deploy` from CI on `main` push.
- Smoke `/api/health`.
- Exit: prod URL serves traffic; an intentional thrown error shows up in Sentry within 60s.

---

## 18. Feature Recipes

### 18.1 Authentication (email + password)

Files: `src/lib/session.ts`, `src/actions/index.ts` (auth actions), `src/middleware.ts` (already wires user), `src/pages/login.astro`, `src/pages/signup.astro`.

`src/lib/session.ts`:

```ts
import { scrypt } from "@noble/hashes/scrypt";
import { bytesToHex, hexToBytes, randomBytes } from "@noble/hashes/utils";

const N = 16384, r = 8, p = 1, dkLen = 32;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scrypt(pw, salt, { N, r, p, dkLen });
  return `${bytesToHex(salt)}:${bytesToHex(hash)}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  const salt = hexToBytes(saltHex);
  const expected = hexToBytes(hashHex);
  const got = scrypt(pw, salt, { N, r, p, dkLen });
  if (got.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < got.length; i++) diff |= got[i] ^ expected[i];
  return diff === 0;
}

export function newToken(): string {
  return bytesToHex(randomBytes(32));
}
```

Auth actions excerpt (add to `src/actions/index.ts`):

```ts
import { defineAction, ActionError } from "astro:actions";
import { z } from "astro/zod";
import { hashPassword, verifyPassword, newToken } from "@/lib/session";

export const auth = {
  signup: defineAction({
    accept: "form",
    input: z.object({ email: z.string().email(), password: z.string().min(8) }),
    handler: async ({ email, password }, ctx) => {
      const env = ctx.locals.runtime.env;
      const id = crypto.randomUUID();
      const hash = hashPassword(password);
      await env.DB.prepare("INSERT INTO users (id, email, password_hash) VALUES (?1, ?2, ?3)")
        .bind(id, email, hash).run();
      const token = newToken();
      const exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30;
      await env.DB.prepare("INSERT INTO sessions (token, user_id, expires_at) VALUES (?1, ?2, ?3)")
        .bind(token, id, exp).run();
      ctx.cookies.set("__session", token, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
      return { ok: true };
    },
  }),
};
```

### 18.2 File upload + storage (R2)

Add to `wrangler.toml`:

```toml
[[r2_buckets]]
binding = "R2"
bucket_name = "my-app-uploads"
```

Action:

```ts
upload: defineAction({
  accept: "form",
  input: z.object({ file: z.instanceof(File) }),
  handler: async ({ file }, ctx) => {
    const key = `${crypto.randomUUID()}-${file.name}`;
    await ctx.locals.runtime.env.R2.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return { key };
  },
}),
```

### 18.3 Stripe

`pnpm add stripe`. Action calls Stripe with secret bound via `wrangler secret put STRIPE_SECRET`. Webhook endpoint at `src/pages/api/webhooks/stripe.ts` verifies signature using `stripe.webhooks.constructEventAsync` (Workers requires the async variant).

### 18.4 Push notifications

Web Push via VAPID; store subscription in D1 `push_subscriptions`; trigger via `fetch` to push endpoint inside a Cron Trigger Worker (`[triggers] crons = ["0 9 * * *"]`).

### 18.5 Background jobs

Cron Triggers in `wrangler.toml`. Single Worker handles HTTP + scheduled. Export `scheduled` handler in entry; Astro adapter exposes hook for this.

### 18.6 Realtime

Durable Objects. Add binding, write a simple WebSocket DO, fetch from page via `env.DO.get(env.DO.idFromName("room"))`. Out of scope for first release.

### 18.7 Search

Tiny: SQLite FTS5 in D1. Migration: `CREATE VIRTUAL TABLE things_fts USING fts5(title, body, content='things', content_rowid='id');`. Query: `SELECT * FROM things_fts WHERE things_fts MATCH ?1`.

### 18.8 Internationalization

Astro `i18n` config:

```ts
i18n: { locales: ["en", "es"], defaultLocale: "en", routing: "manual" }
```

Place content under `src/pages/en/`, `src/pages/es/`. Use `getRelativeLocaleUrl()`.

### 18.9 Dark mode

Add `class="dark"` toggle on `<html>` via small inline script in `BaseLayout.astro` (pre-hydration to avoid flash). Tailwind v4 reads `[data-theme]` or `.dark` selector from `@theme`.

### 18.10 Analytics

`@sentry/cloudflare` for errors. For pageviews: Cloudflare Web Analytics (zero-config beacon, no cookies). Add the snippet to `BaseLayout.astro`.

---

## 19. Troubleshooting (top 30)

| Error | Fix |
|---|---|
| `Cannot find module 'astro:content'` | Run `pnpm dev` once to generate `.astro/types.d.ts` |
| `Cannot find module 'astro:actions'` | Same — start dev server once |
| `Property 'runtime' does not exist on type 'Locals'` | Check `src/env.d.ts` has the `App.Locals` declaration |
| `Property 'DB' does not exist on type 'Env'` | `wrangler types` to regenerate or update `src/env.d.ts` |
| `client:* directive is not supported on Astro components` | Convert component to `.tsx`/`.svelte` |
| `Hydration mismatch: ...` | Remove `Date.now()`, `Math.random()` from frontmatter; use `useEffect` |
| `require is not defined` | You're using a Node-only lib; replace or use `compatibility_flags = ["nodejs_compat"]` |
| `D1_ERROR: no such table: X` | `pnpm db:migrate:local` |
| `D1_ERROR: UNIQUE constraint failed` | Check INSERT for duplicate of unique column |
| `Error: env.DB is undefined` | Use `pnpm dev` (not bare `astro dev`); ensure D1 binding in `wrangler.toml` |
| `KV namespace not found` | Run `wrangler kv namespace create KV` and paste id |
| `wrangler deploy` fails with "binding not found" | Bindings missing from `[env.production]` block |
| `Tailwind classes not applying` | Confirm `@import "tailwindcss";` in `src/styles/global.css` and CSS imported in BaseLayout |
| `Cannot find name 'D1Database'` | Add `@cloudflare/workers-types` to `tsconfig.json` `types` |
| `Module "node:crypto" has been externalized` | Use Web Crypto (`crypto.subtle`) not `node:crypto` |
| `Astro.cookies is not a function` | Set `prerender = false` on the page |
| `Module not found: astro/zod` | Astro 6 only — `pnpm up astro@latest` |
| `getCollection('blog') returns []` | Schema mismatch in `src/content.config.ts`; check `pnpm exec astro check` |
| `Build error: package "X" not found` | Run `pnpm install` and check spelling |
| `wrangler tail` shows nothing | Ensure deploy succeeded; `compatibility_date` recent enough |
| `Sentry not capturing` | Confirm `Sentry.init` runs in worker entry; DSN secret set |
| `Playwright: timed out waiting for http://localhost:4321` | `pnpm dev` not starting; run manually first |
| `Vitest cannot find tests` | Path in `vitest.config.ts` `test.include` |
| `Biome: parsing error in .astro file` | Biome v2 needs `overrides` to relax `.astro`; see `biome.json` above |
| `Forbidden: cannot fetch /img.jpg` | Asset under `src/assets/` must be imported, not URL'd |
| `Image binding error in dev` | Set `imageService: "compile"` for dev or use `cloudflare-binding` and `wrangler dev` |
| `Out of memory during build` | `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` |
| `astro check` slow | First run is cold; subsequent runs cache |
| `pnpm-lock.yaml conflicts` | `pnpm install` then commit; never hand-edit |
| `gh pr create` errors | `gh auth status`; re-login with `gh auth login` |

---

## 20. Glossary

- **Adapter**: Astro plugin that targets a runtime (Workers, Node, Vercel). Here: `@astrojs/cloudflare`.
- **Action (Astro)**: A type-safe server function callable from forms or client islands. Defined in `src/actions/`.
- **Binding**: A connection from a Worker to a Cloudflare resource (D1, KV, R2, secret). Configured in `wrangler.toml`.
- **Build output**: `dist/` after `astro build`. Includes `_worker.js/` for Workers.
- **client:* directive**: Tells Astro to ship JS to hydrate a framework component. Variants: `load`, `idle`, `visible`, `media`, `only`.
- **Cloudflare Pages vs Workers**: Both host sites at the edge. Workers is now Cloudflare's recommended primary platform; Pages is in maintenance.
- **Compatibility date**: Date string in `wrangler.toml` selecting Workers runtime behaviour. Bump when upgrading Wrangler.
- **Content collection**: Astro feature for typed Markdown/MDX with Zod schemas.
- **D1**: Cloudflare's serverless SQLite, accessible via Worker binding.
- **Hydration**: Loading client JS to attach event listeners to server-rendered HTML.
- **Island**: An interactive component within an otherwise static Astro page.
- **KV**: Cloudflare Workers KV, a global low-latency key-value store.
- **MDX**: Markdown extended with JSX/components.
- **Middleware**: Code that runs on every Astro request before the page handler.
- **prerender**: Boolean exported from a page; `true` = build-time HTML, `false` = SSR per request.
- **R2**: Cloudflare's S3-compatible object storage.
- **SSR**: Server-side rendering. In Astro on Cloudflare, runs in the Worker.
- **Worker**: A JavaScript function that runs at Cloudflare's edge.
- **workerd**: The runtime that runs Workers; Wrangler dev mode uses it locally.
- **wrangler**: Cloudflare's CLI for Workers/D1/KV.
- **Zod**: Runtime schema validator producing static TypeScript types. In Astro 6: `astro/zod`.

---

## 21. Update Cadence

- This rulebook is valid for Astro 6.1.x through 6.x. Re-run the generator on Astro 7 release.
- Re-run on `@astrojs/cloudflare` v14, Wrangler 5, Tailwind v5, Vitest 5, or any pinned package's major bump.
- Re-run if Cloudflare deprecates Workers binding shapes (D1, KV, R2 API changes).
- Date stamp: **2026-04-27**.
