# Next.js App Router + Supabase + Stripe + Vercel — Rulebook

Type-safe full-stack web app with Postgres, auth, payments, and edge-ready deploys.

---

## 1. Snapshot

### Decisions

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0.3 | Strict types, first-class Next.js support. |
| Runtime + version | Node.js 22.14 LTS | Required by Next 16 + pnpm 11. |
| Package manager | pnpm 10.33.0 | Fast, disk-efficient, monorepo-ready. |
| Build tool | Turbopack (built into Next 16) | Stable, default, zero config. |
| Framework | Next.js 16.0.4 (App Router only) | Latest stable, RSC + Server Actions. |
| UI runtime | React 19.2.5 | Stable, RSC, Actions, Activity. |
| State mgmt | React 19 hooks + URL state via `nuqs 2.4.x` | No global store; server-truth + URL. |
| Routing/Nav | App Router (file-based) | Built in. No alternative. |
| Server boundary default | Server Components | Smaller bundles, secure-by-default. |
| Data fetching | Server Actions (mutations) + RSC fetch (reads) | One pattern; no REST scaffolding. |
| Server Action wrapper | next-safe-action 8.1.8 | Type-safe schema validation + middleware. |
| Data layer (db + orm) | Supabase Postgres 16 + Drizzle ORM 0.44.x | RLS at DB; types from schema. |
| Postgres driver | `postgres` 3.4.x (via drizzle-orm/postgres-js) | Required for Supabase pooler. |
| Migrations | Supabase CLI (`supabase migration`) | Single source of truth; RLS-aware. |
| Auth | Supabase Auth via @supabase/ssr 0.7.x | Cookie-based, App Router native. |
| Storage | Supabase Storage | Same project, RLS policies apply. |
| Realtime | Supabase Realtime | Built-in; row-level subscriptions. |
| Edge functions | Supabase Edge Functions (Deno) | For webhooks; isolated from app. |
| Styling | Tailwind CSS 4.1.x | CSS-first, no config file. |
| Component library | shadcn/ui 3.x (CLI) | Owned components, no runtime dep. |
| Forms + validation | React Hook Form 7.x + Zod 4.3.6 | RSC-compatible, smallest cost. |
| Payments | Stripe 22.0.2 (Node) + @stripe/stripe-js 9.x | Webhooks via Edge Function. |
| Unit test runner | Vitest 4.0.18 + @testing-library/react 16.3.2 | 10–20× Jest, native ESM. |
| E2E framework | Playwright 1.55.x | Parallel default, sharded CI. |
| Mocking strategy | Mock at adapter boundary; never mock Supabase SDK or DB | Integration > illusion. |
| Logger | pino 9.x + pino-pretty (dev) | Structured JSON, fastest Node logger. |
| Error tracking | Sentry @sentry/nextjs 10.50.0 | Auto-instruments RSC + Actions. |
| Lint + format | Biome 2.3.x | One binary, 10–25× ESLint+Prettier. |
| Type checking | `tsc --noEmit` (TypeScript 6.0.3) | Authoritative. |
| Env vars + secrets | `.env.local` (dev) + Vercel env (prod) | `NEXT_PUBLIC_*` only for client. |
| CI provider | GitHub Actions | Free, ubiquitous, Vercel-native. |
| Deploy target | Vercel | First-class Next.js support. |
| Release flow | Push to `main` → Vercel preview → promote to prod | Atomic, instant rollback. |
| Auto-update | Static immutable assets via Vercel CDN | Hard-refresh on schema bump. |
| RLS posture | RLS ON for every public schema table; deny by default | Security-first. |
| Image optimization | `next/image` (Vercel) | Built-in, free on Vercel. |
| Cache strategy | `force-cache` for static, `no-store` for user data | Explicit per-fetch. |

### Versions

| Lib | Version | Released | Link |
|---|---|---|---|
| next | 16.0.4 | 2026-04-22 | https://github.com/vercel/next.js/releases |
| react / react-dom | 19.2.5 | 2026-04-08 | https://react.dev/versions |
| typescript | 6.0.3 | 2026-04-17 | https://www.npmjs.com/package/typescript |
| @supabase/supabase-js | 2.103.3 | 2026-04-24 | https://github.com/supabase/supabase-js/releases |
| @supabase/ssr | 0.7.5 | 2026-04-15 | https://www.npmjs.com/package/@supabase/ssr |
| supabase (CLI dev dep) | 2.95.4 | 2026-04-27 | https://github.com/supabase/cli/releases |
| drizzle-orm | 0.44.6 | 2026-04-12 | https://www.npmjs.com/package/drizzle-orm |
| drizzle-kit | 0.31.7 | 2026-04-12 | https://www.npmjs.com/package/drizzle-kit |
| postgres | 3.4.7 | 2026-02-10 | https://www.npmjs.com/package/postgres |
| stripe | 22.0.2 | 2026-04-22 | https://github.com/stripe/stripe-node/releases |
| @stripe/stripe-js | 9.0.1 | 2026-04-10 | https://www.npmjs.com/package/@stripe/stripe-js |
| tailwindcss | 4.1.6 | 2026-04-09 | https://tailwindcss.com |
| @tailwindcss/postcss | 4.1.6 | 2026-04-09 | https://tailwindcss.com |
| shadcn (CLI) | 3.4.0 | 2026-04-21 | https://ui.shadcn.com |
| zod | 4.3.6 | 2026-01-22 | https://github.com/colinhacks/zod/releases |
| react-hook-form | 7.54.x | 2026-03 | https://react-hook-form.com |
| @hookform/resolvers | 3.10.x | 2026-03 | https://www.npmjs.com/package/@hookform/resolvers |
| next-safe-action | 8.1.8 | 2026-04-22 | https://github.com/TheEdoRan/next-safe-action/releases |
| nuqs | 2.4.3 | 2026-03 | https://www.npmjs.com/package/nuqs |
| @sentry/nextjs | 10.50.0 | 2026-04-24 | https://www.npmjs.com/package/@sentry/nextjs |
| biome | 2.3.8 | 2026-04-15 | https://biomejs.dev |
| vitest | 4.0.18 | 2026-04 | https://github.com/vitest-dev/vitest/releases |
| @vitejs/plugin-react | 5.1.3 | 2026-04 | https://www.npmjs.com/package/@vitejs/plugin-react |
| @testing-library/react | 16.3.2 | 2026-04 | https://www.npmjs.com/package/@testing-library/react |
| @playwright/test | 1.55.0 | 2026-04 | https://github.com/microsoft/playwright/releases |
| pino | 9.7.x | 2026-03 | https://github.com/pinojs/pino/releases |
| pnpm | 10.33.0 | 2026-04 | https://github.com/pnpm/pnpm/releases |
| node | 22.14.0 LTS | 2026-04 | https://nodejs.org |
| vercel (CLI) | 39.x | 2026-04 | https://vercel.com/docs/cli |

### Minimum host requirements

- macOS 13+, Windows 11 (or Windows 10 22H2 + WSL2 Ubuntu 22.04), Linux x86_64 with glibc 2.35+ (Ubuntu 22.04+).
- 8 GB RAM, 10 GB free disk.
- Node 22.14.0 LTS, pnpm 10.33.0.
- Docker Desktop 4.30+ (required for `supabase start` local stack).

### Cold start (clone → running app)

12 minutes on a fresh machine with 50 Mbps internet: tool installs (5 min), `pnpm install` (90 s), `supabase start` first pull (4 min), `pnpm dev` (15 s), open browser.

---

## 2. Zero-to-running

### 2.1 macOS

```bash
# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node 22 LTS via fnm (avoids sudo, fast switching)
brew install fnm
fnm install 22.14.0
fnm use 22.14.0
node -v   # expect: v22.14.0

# pnpm
corepack enable
corepack prepare pnpm@10.33.0 --activate
pnpm -v   # expect: 10.33.0

# Supabase CLI (do NOT use `npm i -g supabase` — unsupported)
brew install supabase/tap/supabase
supabase --version   # expect: 2.95.4

# Stripe CLI (for webhook forwarding in dev)
brew install stripe/stripe-cli/stripe
stripe --version

# GitHub CLI
brew install gh
gh auth login

# Vercel CLI
pnpm add -g vercel@latest
vercel --version

# Docker Desktop (Supabase local stack needs it)
brew install --cask docker
open -a Docker        # accept the privacy dialog, wait for whale icon
docker info           # must succeed before `supabase start`
```

### 2.2 Windows 11

Use **WSL2 Ubuntu 22.04** for parity with Vercel's Linux build environment. PowerShell-only setups break Supabase CLI and Docker.

```powershell
# In PowerShell as Administrator
wsl --install -d Ubuntu-22.04
# reboot, set unix username + password, then drop into Ubuntu
```

In Ubuntu (WSL):

```bash
sudo apt update && sudo apt install -y curl git unzip build-essential
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL
fnm install 22.14.0 && fnm use 22.14.0
corepack enable && corepack prepare pnpm@10.33.0 --activate
# Supabase CLI
curl -fsSL https://github.com/supabase/cli/releases/download/v2.95.4/supabase_linux_amd64.tar.gz | tar -xz
sudo mv supabase /usr/local/bin/
# Docker Desktop on Windows host (with WSL integration enabled): https://www.docker.com/products/docker-desktop
# Stripe CLI:
curl -s https://packages.stripe.dev/api/security/keypair/stripe-cli-gpg/public | gpg --dearmor | sudo tee /usr/share/keyrings/stripe.gpg
echo "deb [signed-by=/usr/share/keyrings/stripe.gpg] https://packages.stripe.dev/stripe-cli-debian-local stable main" | sudo tee -a /etc/apt/sources.list.d/stripe.list
sudo apt update && sudo apt install stripe
sudo apt install gh
gh auth login
pnpm add -g vercel@latest
```

### 2.3 Linux (Ubuntu 22.04+)

Same as the WSL block above. Skip the WSL step.

### 2.4 Required accounts

| Service | URL | What you need |
|---|---|---|
| GitHub | https://github.com/signup | Account + SSH key (`ssh-keygen -t ed25519`) |
| Vercel | https://vercel.com/signup | Sign in with GitHub. Free Hobby tier OK. |
| Supabase | https://supabase.com/dashboard/sign-up | Create org + free-tier project. Save: Project Ref, anon key, service_role key, DB password. |
| Stripe | https://dashboard.stripe.com/register | Test mode by default. Save: publishable + secret + webhook signing secret. |
| Sentry | https://sentry.io/signup/ | Create org + Next.js project. Save: DSN, auth token. |

### 2.5 CLI auth

```bash
gh auth login
vercel login
supabase login            # opens browser, returns token
stripe login              # opens browser
```

### 2.6 Bootstrap a new project

```bash
# Create the app (App Router, TS, Tailwind v4, Biome, src dir, import alias)
pnpm create next-app@latest my-app \
  --typescript --tailwind --app --src-dir --import-alias "@/*" \
  --use-pnpm --turbopack --biome --skip-install
cd my-app
pnpm install

# Add core runtime deps
pnpm add @supabase/supabase-js@2.103.3 @supabase/ssr@0.7.5 \
         drizzle-orm@0.44.6 postgres@3.4.7 \
         stripe@22.0.2 @stripe/stripe-js@9.0.1 \
         react-hook-form@^7.54.0 @hookform/resolvers@^3.10.0 zod@4.3.6 \
         next-safe-action@8.1.8 nuqs@2.4.3 \
         pino@^9.7.0 @sentry/nextjs@10.50.0

# Dev deps
pnpm add -D drizzle-kit@0.31.7 supabase@2.95.4 \
            vitest@4.0.18 @vitejs/plugin-react@5.1.3 jsdom \
            @testing-library/react@16.3.2 @testing-library/dom @testing-library/jest-dom@^6.9.1 \
            vite-tsconfig-paths @playwright/test@1.55.0 \
            pino-pretty

# shadcn/ui init
pnpm dlx shadcn@3.4.0 init -y -d --base-color zinc

# Initialize Supabase project
supabase init
supabase start            # boots local Postgres, Auth, Storage, Realtime via Docker

# Initialize Sentry (writes sentry.*.config.ts + next.config update)
pnpm dlx @sentry/wizard@latest -i nextjs

# Run dev server
pnpm dev
# Expected:
#   ▲ Next.js 16.0.4 (Turbopack)
#   - Local:        http://localhost:3000
#   - Network:      http://192.168.x.x:3000
#   ✓ Ready in 1.4s
```

Open http://localhost:3000. Hello world renders.

### 2.7 First-run errors

| Symptom | Cause | Fix |
|---|---|---|
| `Cannot find module 'next/server'` | Mixed Pages/App imports | Delete `pages/` dir; only use `src/app/`. |
| `Error: Hydration failed` | `Date.now()` / `Math.random()` in render | Move to `useEffect` or use `Suspense` + RSC. |
| `cookies() should be awaited` | Sync `cookies()` call | `const c = await cookies()` (Next 15+ change). |
| `Module not found: 'pg-native'` | postgres-js falls back probe | Set `webpack` external in `next.config.ts` (already in template). |
| `supabase start` hangs | Docker not running | `open -a Docker`, wait, retry. |
| `Error: connect ECONNREFUSED 127.0.0.1:54322` | Local Supabase down | `supabase start`. |
| `Invalid auth: bound to wrong cookies` | Module-scope client | Construct Supabase client per request. |
| `prepared statement does not exist` | Using transaction pooler with `prepare:true` | Set `prepare: false` on postgres() (Supabase pooler limitation). |
| `Access blocked: NEXT_PUBLIC_*` is undefined in client | Missing env at build | Set in Vercel env + restart `pnpm dev`. |
| Webhook signature fails | Wrong secret | Use `STRIPE_WEBHOOK_SECRET` from `stripe listen`, not the dashboard one. |

---

## 3. Project Layout

```
my-app/
├─ .github/workflows/ci.yml
├─ .vscode/{extensions.json,launch.json,settings.json}
├─ .cursor/rules
├─ public/                       # static, served at /
├─ src/
│  ├─ app/                       # App Router root
│  │  ├─ (marketing)/            # public pages: /, /pricing, /about
│  │  ├─ (app)/                  # authenticated app shell
│  │  │  └─ dashboard/page.tsx
│  │  ├─ api/
│  │  │  └─ stripe/webhook/route.ts   # Route Handler (Node runtime)
│  │  ├─ auth/
│  │  │  ├─ callback/route.ts         # OAuth code exchange
│  │  │  └─ login/page.tsx
│  │  ├─ layout.tsx
│  │  ├─ page.tsx
│  │  └─ globals.css
│  ├─ components/
│  │  ├─ ui/                     # shadcn-generated, owned
│  │  └─ <feature>/              # feature components (server-first)
│  ├─ db/
│  │  ├─ schema.ts               # Drizzle schema (single source of TS types)
│  │  ├─ index.ts                # postgres + drizzle client
│  │  └─ queries/                # named server-only query functions
│  ├─ lib/
│  │  ├─ supabase/
│  │  │  ├─ server.ts            # createClient for RSC/Server Action
│  │  │  ├─ client.ts            # createBrowserClient for client comp
│  │  │  └─ middleware.ts        # session refresher
│  │  ├─ stripe/
│  │  │  ├─ server.ts            # Stripe Node SDK
│  │  │  └─ client.ts            # @stripe/stripe-js loader
│  │  ├─ logger.ts               # pino instance
│  │  ├─ env.ts                  # zod-validated env
│  │  └─ safe-action.ts          # next-safe-action client + middleware
│  ├─ actions/                   # 'use server' Server Actions
│  ├─ hooks/                     # client hooks
│  └─ types/
├─ supabase/
│  ├─ config.toml
│  ├─ migrations/
│  │  └─ 0001_init.sql
│  ├─ functions/
│  │  └─ stripe-webhook/index.ts
│  └─ seed.sql
├─ tests/
│  ├─ unit/                      # *.test.ts colocated OK; long-form here
│  └─ e2e/                       # *.spec.ts (Playwright)
├─ .env.example
├─ .env.local                    # gitignored
├─ biome.json
├─ components.json
├─ drizzle.config.ts
├─ middleware.ts                 # Supabase session refresh
├─ next.config.ts
├─ package.json
├─ playwright.config.ts
├─ postcss.config.mjs
├─ sentry.client.config.ts
├─ sentry.edge.config.ts
├─ sentry.server.config.ts
├─ tsconfig.json
├─ vitest.config.ts
├─ CLAUDE.md
├─ AGENTS.md
└─ README.md
```

### Naming conventions

- Files: kebab-case (`user-card.tsx`). Components: PascalCase exports (`export function UserCard`).
- Server Actions: verbs (`createPost`, `deleteSubscription`). One file per logical group, `'use server'` at top.
- Hooks: `useThing.ts` camelCase, named export.
- Tests: `*.test.ts(x)` for unit, `*.spec.ts` for Playwright.
- Drizzle tables: snake_case columns, plural table names (`users`, `posts`).

### "If you're adding X, it goes in Y"

| You're adding... | Path |
|---|---|
| Public page | `src/app/(marketing)/<route>/page.tsx` |
| Authed page | `src/app/(app)/<route>/page.tsx` |
| Server Action | `src/actions/<feature>.ts` (top: `'use server'`) |
| Webhook / public API | `src/app/api/<name>/route.ts` |
| DB table | `src/db/schema.ts` + `supabase migration new <name>` |
| RLS policy | `supabase/migrations/<ts>_<name>.sql` |
| Read-only DB query | `src/db/queries/<feature>.ts` (no `'use server'`) |
| Edge function (webhook) | `supabase/functions/<name>/index.ts` |
| Reusable UI primitive | `pnpm dlx shadcn@latest add <name>` → `src/components/ui/` |
| Feature component | `src/components/<feature>/<name>.tsx` |
| Client-only widget | `'use client'` at top, in `src/components/<feature>/` |
| Form schema | `src/lib/schemas/<name>.ts` (Zod) |
| Env var | `src/lib/env.ts` schema + `.env.example` line |
| Background job | Supabase Edge Function + cron (`supabase/functions/<name>` + `supabase/migrations/_cron.sql`) |
| Realtime subscription | client component using `supabase.channel(...)` |
| Type | `src/types/<name>.ts` (re-export Drizzle inferred types) |
| Email template | `src/emails/<name>.tsx` (react-email if used) |
| Shadcn component | `pnpm dlx shadcn@latest add <name>` |

---

## 4. Architecture

### Process boundary

```
┌──────────────────────────────────────────────────────────┐
│ Browser (Client Components, hydrated React)              │
│   • @supabase/ssr browser client (anon key)              │
│   • @stripe/stripe-js (publishable key)                  │
└─────────▲──────────────────────────────▲─────────────────┘
          │ HTTP (RSC payload, Actions)  │ Realtime WS
          │                              │
┌─────────┴──────────────────────────────┴─────────────────┐
│ Vercel Edge / Node Runtime (Next.js 16)                  │
│   • RSC + Server Actions ('use server')                  │
│   • Route Handlers (api/**)                              │
│   • middleware.ts (session refresh)                      │
│   • next-safe-action wraps actions                       │
│   • Drizzle (postgres-js) → Supabase pooler              │
│   • Stripe Node SDK (server.ts only)                     │
└─────────▲────────────────┬────────────────▲──────────────┘
          │                │                │
   ┌──────┴───────┐  ┌─────┴─────┐  ┌──────┴───────┐
   │ Supabase     │  │ Stripe    │  │ Sentry       │
   │ (Postgres,   │  │ (charges, │  │ (errors,     │
   │  Auth, Stor- │  │  webhooks │  │  perf)       │
   │  age, RLS)   │  │  via Edge │  └──────────────┘
   │              │  │  Function)│
   └──────────────┘  └───────────┘
```

### Data flow — typical mutation

```
Client form (RHF + Zod)
  ↓ submits via useAction (next-safe-action)
Server Action ('use server', src/actions/foo.ts)
  ↓ safeActionClient validates input → middleware injects authed user
Drizzle query → Supabase Postgres (RLS enforces row access)
  ↓ revalidatePath / revalidateTag
RSC re-renders affected route
  ↓ streams new payload to client
Toast on success / inline error on validation failure
```

### Auth flow

```
1. User → /auth/login (server component renders form)
2. Form submits to Server Action signIn(email, password)
3. Server Action calls supabase.auth.signInWithPassword
4. Supabase returns Set-Cookie (sb-access-token, sb-refresh-token)
5. Server Action redirect()s to /dashboard
6. middleware.ts on each request:
     • reads cookies via @supabase/ssr.createServerClient
     • calls supabase.auth.getUser() (refreshes if expired)
     • re-writes Set-Cookie on the outgoing response
7. RSC pages call createClient() (server.ts) → reads same cookies
8. Sign out: Server Action signOut() → supabase.auth.signOut() → redirect /
```

### State flow

- **Server state:** RSC fetch + Drizzle. Re-fetched on `revalidatePath`/`revalidateTag` or navigation.
- **URL state (filters, paging, modals):** `nuqs` for type-safe query params.
- **Form state:** React Hook Form, scoped to one form.
- **Ephemeral UI state (open/close):** `useState` in client components.
- **No** Redux, Zustand, Jotai, or Recoil. Adding one is a Section 8.2 violation.

### Entry points

| File | Responsibility |
|---|---|
| `src/app/layout.tsx` | Root HTML, fonts, providers (Sentry, nuqs adapter). |
| `src/app/page.tsx` | Marketing landing. |
| `middleware.ts` | Refresh Supabase session on every request. Only this. |
| `src/lib/env.ts` | Zod-validate `process.env` at startup. |
| `src/db/index.ts` | Single Drizzle client; reused via globalThis (HMR-safe). |
| `next.config.ts` | Turbopack flags, image domains, Sentry wrap. |
| `instrumentation.ts` | Sentry init across runtimes. |

### Where business logic lives

- **YES:** Server Actions (`src/actions/`), DB query functions (`src/db/queries/`), Edge Functions (webhooks).
- **NO:** Components (presentation only). Route Handlers (only for non-Action endpoints: webhooks, OAuth callbacks, public REST). Middleware (session refresh only).

---

## 5. Dev Workflow

### Start

```bash
# Terminal 1 — local Supabase stack (Postgres, Auth, Storage, Realtime, Studio)
supabase start                  # studio at http://127.0.0.1:54323

# Terminal 2 — Next.js
pnpm dev                        # http://localhost:3000

# Terminal 3 (when working on Stripe webhooks) — forward Stripe events
stripe listen --forward-to localhost:3000/api/stripe/webhook
# copy the printed signing secret into .env.local STRIPE_WEBHOOK_SECRET
```

`pnpm dev` runs Turbopack: filesystem watcher, RSC payload streamer, Fast Refresh.

### Hot reload

- Edits to RSC, Server Actions, components: hot-reload with no full reload.
- Edits to `middleware.ts`, `next.config.ts`, `tailwind.config`, env files: full restart required (Turbopack auto-restarts).
- Edits to `src/db/schema.ts`: regenerate migration (`pnpm db:generate`); restart dev server to pick new types.

### Debugger

- **VS Code / Cursor:** use `.vscode/launch.json` (in §15). F5 to attach to `pnpm dev`.
- **Chrome DevTools:** open http://localhost:3000, F12. RSC payloads visible under Network → `?_rsc=`.
- **React DevTools:** install the browser ext; "Components" tab shows `Server`/`Client` badges.
- **DB:** `supabase studio` (Studio UI at http://127.0.0.1:54323). `psql` on port 54322 (user `postgres`, pw `postgres`).

### Pre-commit (`.husky/pre-commit` not used; rely on Claude/Codex hooks + CI)

```bash
pnpm typecheck && pnpm lint && pnpm test --run
```

### Branch + commit conventions

- Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- One PR = one logical change. Squash-merge to `main`.

---

## 6. Testing & Parallelization

### Unit / component (Vitest)

```bash
pnpm test               # watch mode
pnpm test --run         # single run (CI)
pnpm test --run path/to/file.test.ts
pnpm test --run -t "renders heading"
```

Tests live next to source: `src/components/foo/foo.test.tsx`, OR in `tests/unit/**/*.test.ts`.

### Integration (Vitest, hits real local Supabase)

```bash
pnpm test:integration   # alias: vitest --run --dir tests/integration
```

Requires `supabase start` running. **Never** mock Drizzle or `@supabase/*`.

### E2E (Playwright)

```bash
pnpm exec playwright install --with-deps   # one-time
pnpm e2e                                   # parallel by default
pnpm e2e --ui                              # interactive
pnpm e2e tests/e2e/login.spec.ts           # single file
pnpm e2e --grep "checkout"                 # by name
```

Parallelism is configured in `playwright.config.ts` (§3 inline). Sharding in CI: `--shard 1/4 … 4/4`.

### Mocking rules

- **Never mock:** Supabase SDK, Drizzle, Postgres, Stripe (use Stripe's test mode + `stripe trigger`).
- **Mock at boundary:** outbound HTTP (use `msw 2.x`), email send (use a fake recorder), filesystem.
- **Test users:** seed via `supabase/seed.sql`; reset with `supabase db reset` between integration runs.

### Coverage

- Target: 80% lines on `src/actions`, `src/db/queries`, `src/lib`. UI coverage not enforced.
- Measure: `pnpm test --run --coverage`. Reporter: `v8`. Output: `coverage/`.

### Visual regression

Skipped by default. Add Chromatic only if Storybook is introduced; not in scaffold.

### Parallelization patterns for AI agents

| Safe to fan out (parallel subagents) | Must be sequential |
|---|---|
| Scaffold N components in different files | Editing `package.json` |
| Write N independent unit tests | `src/db/schema.ts` (one source of types) |
| Generate copy/docs | `supabase/migrations/*` (ordered) |
| Add N shadcn components | `next.config.ts`, `tsconfig.json`, `biome.json` |
| Write Server Actions in disjoint files | `middleware.ts` |
| Write E2E specs in disjoint files | `.env*` files |

---

## 7. Logging

### `src/lib/logger.ts`

```ts
import pino from 'pino';

const isDev = process.env.NODE_ENV !== 'production';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? 'debug' : 'info'),
  base: { service: 'web', env: process.env.VERCEL_ENV ?? 'local' },
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.token'],
  transport: isDev ? { target: 'pino-pretty', options: { colorize: true } } : undefined,
});
```

### Levels

| Level | Use for |
|---|---|
| `fatal` | Process about to exit; unrecoverable. |
| `error` | A handled error (caught + reported to Sentry). |
| `warn` | Recoverable anomaly; degraded behavior. |
| `info` | Boot, request in/out, user actions, payment events. |
| `debug` | Local dev detail, dropped in prod. |
| `trace` | Off by default. |

### Required fields

`request_id`, `user_id` (or null), `module` (logger child name), `event` (verb), `duration_ms` for timed ops.

### Samples

```
{"level":"info","event":"app.boot","commit":"a1b2c3","node":"22.14.0"}
{"level":"info","event":"http.in","request_id":"r_x","method":"POST","path":"/api/stripe/webhook"}
{"level":"info","event":"http.out","request_id":"r_x","status":200,"duration_ms":42}
{"level":"warn","event":"db.slow","module":"db","query":"select_user","duration_ms":1320}
{"level":"error","event":"stripe.webhook.invalid_sig","request_id":"r_x"}
{"level":"info","event":"user.signed_up","user_id":"u_1","plan":"free"}
```

### Where logs go

- **Dev:** stdout via pino-pretty.
- **Prod:** stdout → Vercel Functions logs (free 1-day retention) + Sentry breadcrumbs/issues.
- **Long-term:** wire Vercel Log Drain → Axiom (free tier 500 GB/mo) when scale demands it. Not in scaffold.

### Grep locally

```bash
pnpm dev 2>&1 | tee /tmp/app.log
grep '"level":"error"' /tmp/app.log | jq .
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm typecheck && pnpm lint && pnpm test --run` before declaring a task done.
2. Always import the Supabase server client from `src/lib/supabase/server.ts` inside RSC and Server Actions; never construct ad-hoc.
3. Always import the Supabase browser client from `src/lib/supabase/client.ts` inside `'use client'` files; never the server one.
4. Always wrap mutations in a Server Action via `next-safe-action`'s `actionClient` so input is Zod-validated and errors are typed.
5. Always declare `'use server'` on the first line of any file in `src/actions/` and on any inline server function.
6. Always declare `'use client'` at the top of components that use hooks, browser APIs, or event handlers.
7. Always validate `process.env` through `src/lib/env.ts` (Zod schema) and import from there — never read `process.env` directly elsewhere.
8. Always prefix browser-readable env vars with `NEXT_PUBLIC_`; everything else is server-only.
9. Always set `prepare: false` when constructing the `postgres()` client (Supabase Transaction pooler limitation).
10. Always create a Drizzle client once via `globalThis` cache (HMR-safe).
11. Always write SQL migrations through `supabase migration new` and check them into `supabase/migrations/`.
12. Always enable RLS on every public-schema table in the same migration that creates the table; default-deny.
13. Always call `await cookies()` and `await headers()` (sync access removed in Next 15+).
14. Always use `redirect()` from `next/navigation` after a successful Server Action mutation; never `router.push` from server.
15. Always call `revalidatePath`/`revalidateTag` after a write to invalidate RSC caches.
16. Always render Stripe webhook handlers in the **Node** runtime (`export const runtime = 'nodejs'`) and verify the signature with the raw body.
17. Always use `await loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)` (memoized) on the client; never the secret key.
18. Always run `pnpm db:generate` after editing `src/db/schema.ts`, and re-run typecheck.
19. Always use the `logger` from `src/lib/logger.ts` for server logs; never `console.log` in committed code.
20. Always run `pnpm exec playwright install --with-deps` once before the first E2E run.
21. Always reset the local DB with `supabase db reset` before integration tests.
22. Always treat the `service_role` key as toxic: import it only inside files in `src/lib/supabase/admin.ts` (server-only) — never elsewhere.

### 8.2 NEVER

1. Never import `next/headers`, `next/navigation`'s `redirect`, or any `'server-only'` module from a `'use client'` file.
2. Never import `SUPABASE_SERVICE_ROLE_KEY` or `STRIPE_SECRET_KEY` into a client component or any file under a `'use client'` boundary.
3. Never call `supabase.auth.getSession()` in server code for trust decisions; use `supabase.auth.getUser()` (validates JWT against Auth server).
4. Never use the Pages Router (`pages/`); App Router only.
5. Never write to cookies inside a Server Component; do it in a Route Handler, Server Action, or middleware.
6. Never use `fetch` with `cache: 'force-cache'` for user-specific data; use `cache: 'no-store'` or pass `headers: { cookie }`.
7. Never call `Math.random()`, `Date.now()`, `new Date().toLocaleString()` in render — causes hydration mismatch.
8. Never put a global `<Provider>` in a Server Component without wrapping it in a `'use client'` component.
9. Never construct the Supabase or Drizzle client at module top-level inside route handlers (per-request only for Supabase; Drizzle is OK because read-only and stateless).
10. Never bypass RLS by using `service_role` key in regular request paths; only in trusted server-side admin scripts.
11. Never run `drizzle-kit push` in any environment — use Supabase migrations.
12. Never commit `.env.local`, `.env.production`, or any file containing `service_role` / `sk_live_` / signing secrets.
13. Never add Zustand, Redux, Jotai, Recoil, or React Query without explicit user approval — RSC + Server Actions cover state.
14. Never install `next-auth` / `auth.js` — Supabase Auth is the auth provider.
15. Never edit `src/components/ui/*` files generated by shadcn except by intent; re-running `add` regenerates them.
16. Never call `revalidatePath('/')` blindly; pass the specific changed path or use a tag.
17. Never read raw request bodies in Server Actions; use the typed input from `next-safe-action`.
18. Never trust `request.ip` or `x-forwarded-for` for auth; only the verified Supabase user.
19. Never log PII at `info` (emails, names, raw tokens). Use `redact` or omit.
20. Never deploy to prod without `pnpm build` succeeding locally first.

### 8.3 Blast Radius

| Path | Blast | Verify |
|---|---|---|
| `package.json` | Every command | `pnpm install && pnpm typecheck && pnpm lint && pnpm test --run && pnpm build` |
| `pnpm-lock.yaml` | Reproducibility | `pnpm install --frozen-lockfile` |
| `tsconfig.json` | All TS | Full `pnpm typecheck` + `pnpm build` |
| `next.config.ts` | Build + runtime | `pnpm build && pnpm start` smoke `curl localhost:3000` |
| `middleware.ts` | Every request | E2E auth flow (`pnpm e2e tests/e2e/login.spec.ts`) |
| `src/lib/env.ts` | App boot | `pnpm dev` boots; `pnpm build` succeeds |
| `src/lib/supabase/server.ts` | All server reads/writes | E2E auth + dashboard load |
| `src/lib/supabase/client.ts` | Client realtime + auth | E2E sign-up flow |
| `src/lib/safe-action.ts` | All Server Actions | `pnpm test --run actions` |
| `src/db/schema.ts` | Types + DB shape | `pnpm db:generate && pnpm typecheck && pnpm test:integration` |
| `src/db/index.ts` | Every DB call | `pnpm test:integration` |
| `supabase/migrations/*` | Prod DB | `supabase db reset && pnpm test:integration && supabase db diff` |
| `supabase/config.toml` | Local stack | `supabase stop && supabase start` |
| `src/app/layout.tsx` | Every page | `pnpm build && pnpm e2e --grep smoke` |
| `src/app/api/stripe/webhook/route.ts` | Payments | `stripe trigger checkout.session.completed` then check log + DB |
| `tailwind.config.ts` / `globals.css` | Visual | `pnpm dev` + visual smoke; `pnpm build` |
| `biome.json` | Lint + format | `pnpm lint && pnpm format --check` |
| `vitest.config.ts` | All unit tests | `pnpm test --run` |
| `playwright.config.ts` | All E2E | `pnpm e2e` |
| `instrumentation.ts` | Telemetry | `pnpm build`; check Sentry test event |
| `sentry.*.config.ts` | Error capture | Throw in dev; verify Sentry receipt |
| `drizzle.config.ts` | Migration generation | `pnpm db:generate` succeeds |
| `.github/workflows/ci.yml` | CI | Push branch; PR check green |
| `.env.example` | New devs | New checkout: `cp .env.example .env.local && pnpm dev` |
| `vercel.json` (if added) | Deploy | `vercel build && vercel deploy --prebuilt` |

### 8.4 Definition of Done

**Bug fix.** Repro test added (red), fix made (green), `pnpm typecheck && pnpm lint && pnpm test --run` clean, related E2E re-run, screenshot or log line attached. Do NOT refactor surrounding code.

**New feature.** Schema migration (if any) up + down works (`supabase db reset` → re-apply); RLS on; Server Action with Zod schema; one happy-path test + one auth-denied test; one Playwright spec for the user-visible path; `revalidatePath` on mutations. Do NOT add a new dependency without listing it in PR description.

**Refactor.** Behavior must be unchanged; full test suite + E2E green; bundle size delta ≤ +1%; no new dep. Do NOT mix refactor with feature work.

**Dependency bump.** `pnpm up <pkg>`; read CHANGELOG since current version; full test suite + E2E + `pnpm build`. Manual smoke of critical flows. For Next/React/Supabase: also test login, payment, file upload. Do NOT bump majors blindly.

**Schema change.** New migration file via `supabase migration new`; RLS policies updated in same migration; `pnpm db:generate`; integration test exercises new shape; backfill script if data shape changed. Do NOT use `drizzle-kit push`.

**Copy change.** Visual diff screenshot; no code paths changed. Do NOT introduce new components.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile          # expect: "Done in <NN>s"
pnpm typecheck                          # expect: no output, exit 0
pnpm lint                               # expect: "Checked N files. No fixes applied."
pnpm test --run                         # expect: "Test Files  N passed (N) | Tests  M passed (M)"
pnpm build                              # expect: "✓ Compiled successfully" + route summary table
pnpm exec playwright test --project=chromium tests/e2e/smoke.spec.ts
                                        # expect: "X passed (Ys)"
```

If any step prints `error TS`, `lint/`, `FAIL`, or non-zero exit: NOT done.

### 8.6 Parallelization Patterns

- **Safe to fan out:** writing N tests in distinct files, scaffolding N components, writing N Server Actions in distinct files, generating N feature recipes.
- **Must serialize:** anything mutating `package.json`/lockfile, `src/db/schema.ts`, `supabase/migrations/*` (ordered timestamps), `next.config.ts`, `middleware.ts`, env files. Lockfile conflicts cost 5 minutes per occurrence.
- **Pattern:** when in doubt, run a "merge" subagent serially after parallel fan-outs to update shared files (lockfile, schema, generated types).

---

## 9. Stack-Specific Pitfalls

1. **Service role key in client bundle.** Symptom: anyone with devtools owns the DB. Cause: importing `process.env.SUPABASE_SERVICE_ROLE_KEY` from a file that ends up in a `'use client'` chain. Fix: keep service-role code in `src/lib/supabase/admin.ts` and only call from Route Handlers / Server Actions; mark file `import 'server-only'` first line. Detect: `grep -R 'SUPABASE_SERVICE_ROLE_KEY' src/components src/app/**/(client) || pnpm build` — Next will warn about server-only imports.
2. **Hydration mismatch from `Date.now()` / locale.** Symptom: console error "Text content did not match." Cause: time/random/locale rendered server-side then re-rendered client-side. Fix: compute in `useEffect`; use `<time suppressHydrationWarning>`. Detect: dev console shows the mismatch warning instantly.
3. **Forgot `'use server'` on Server Action.** Symptom: action runs but is exposed as plain function; or "You're importing a component that needs server-only". Cause: missing directive. Fix: add `'use server'` as first line. Detect: `pnpm build` errors out.
4. **Cookies in client component.** Symptom: `cookies()` is undefined or "called outside request scope." Cause: importing `next/headers` in a client component. Fix: pass needed values in via props from RSC, or move logic to a Server Action. Detect: build error referencing `next/headers` not allowed in client.
5. **Stale auth token in transaction pooler.** Symptom: `prepared statement does not exist`. Cause: postgres-js defaults to prepared statements; Supabase Transaction-pool mode disallows them. Fix: `postgres(url, { prepare: false })`. Detect: the literal error in logs after first migration applied via pooler.
6. **Webhook signature fails on Vercel.** Symptom: `No signatures found matching the expected signature`. Cause: Next 16 mutates the request body before your handler reads it; need raw body. Fix: in route handler, `await request.text()` and pass that string to `stripe.webhooks.constructEvent`. Run on Node runtime (`export const runtime = 'nodejs'`). Detect: Stripe Dashboard "Failed" attempts.
7. **Mixing Pages Router patterns.** Symptom: `getServerSideProps` not called, weird routing. Cause: AI dropped Pages-router code into App Router. Fix: rewrite as Server Component or Server Action. Detect: `grep -R "getServerSideProps\|getStaticProps\|api/index.ts" src/`.
8. **RLS off on a new table.** Symptom: anon clients read everyone's rows. Cause: forgot `alter table … enable row level security`. Fix: add it in the migration; re-run `supabase db reset`. Detect: `select tablename, rowsecurity from pg_tables where schemaname='public'` — every row must be `t`.
9. **`getSession` instead of `getUser` for auth checks.** Symptom: a client can forge a JWT cookie. Cause: `getSession` reads cookies without verifying. Fix: `const { data: { user } } = await supabase.auth.getUser();` Detect: `grep -R "getSession()" src/` — flag every server-side use.
10. **Calling `revalidatePath` from a client component.** Symptom: TypeError "revalidatePath can only be called server-side". Fix: call it inside the Server Action that just mutated. Detect: build error.
11. **Two Drizzle clients.** Symptom: connections leak; "too many connections." Cause: HMR or two import paths instantiate twice. Fix: cache on `globalThis` (see §3 inline). Detect: Supabase dashboard → Database → Connections graph trends up.
12. **Image optimization disabled accidentally.** Symptom: huge LCP, OOM on Vercel. Cause: using `<img>` instead of `next/image`, or `unoptimized: true`. Fix: import from `next/image`; set `images.remotePatterns` for Supabase domain. Detect: Lighthouse "Properly size images" failure.
13. **`force-dynamic` on every route.** Symptom: nothing caches; cold start every request. Cause: top-level `export const dynamic = 'force-dynamic'` copy-pasted blindly. Fix: only set on routes that need it. Detect: `grep -R "force-dynamic" src/app/`.
14. **Server Action returns Date / non-serializable.** Symptom: "Only plain objects can be passed". Fix: `.toISOString()` on Date, drop class instances. Detect: dev console error.
15. **`next/font` + `'use client'`.** Symptom: font loads twice, FOUT. Cause: importing `next/font` from a client component. Fix: import in `app/layout.tsx` (Server Component) and pass className down. Detect: build warning.
16. **Wrong cookie store in middleware.** Symptom: user logged in but RSCs see no session. Cause: middleware reads but doesn't write refreshed cookies on the response. Fix: use the canonical pattern in `lib/supabase/middleware.ts` (§3 inline). Detect: log out happens on every navigation.
17. **Supabase Realtime over RLS-locked table without policy.** Symptom: 0 messages received. Cause: Realtime requires a `for select` RLS policy that allows the connecting user. Fix: add policy + add table to `supabase_realtime` publication. Detect: Realtime debug shows `permission denied for table`.
18. **Importing `'server-only'` package from a leaf component.** Symptom: build error or huge client bundle. Fix: split file: server logic in `*.server.ts` re-exported only by RSC. Detect: `pnpm build` — Next will fail or include it; check `.next/static/chunks` size.

---

## 10. Performance Budgets

| Metric | Budget | Measure |
|---|---|---|
| Cold dev boot | ≤ 3 s | `pnpm dev` until `Ready in` line |
| TTFB (RSC) | ≤ 200 ms (Vercel Edge) / ≤ 600 ms (Node) | Vercel Speed Insights |
| LCP (homepage) | ≤ 2.0 s on slow 4G | Lighthouse CI |
| FID/INP | ≤ 200 ms | Vercel Web Vitals |
| Initial JS chunk | ≤ 95 KB gzipped | `pnpm build` route table |
| Total transferred (homepage) | ≤ 200 KB gzipped | `next-bundle-analyzer` |
| API/Action p95 | ≤ 500 ms | Sentry Performance |
| DB query p95 | ≤ 50 ms | `pg_stat_statements` in Supabase Studio |
| Memory (Node serverless) | ≤ 256 MB | Vercel Function metrics |

When exceeded:

1. Inspect `pnpm build` route table — flag any route over 100 KB.
2. Run `pnpm dlx @next/bundle-analyzer` (add temporarily); look for accidental client-side imports of large libs.
3. Convert leaf components to RSC; move libs to dynamic `import()`.
4. For DB: add index, check Supabase Advisor (Database → Advisor).

---

## 11. Security

- **Secrets:** `.env.local` (gitignored); Vercel Project Settings → Environment Variables for prod/preview. **NEVER** put secrets in `NEXT_PUBLIC_*`.
- **Auth threat model:** Anonymous user (anon JWT) can read RLS-allowed rows. Authenticated user can read/write per RLS. Service role bypasses RLS — used only by trusted server jobs / webhooks.
- **Input validation:** Zod at the Server Action boundary (via next-safe-action). DB types are guaranteed by Drizzle inferences; Postgres CHECK constraints for invariants.
- **Output escaping:** React auto-escapes children; never `dangerouslySetInnerHTML` user content. For Markdown: `react-markdown` with `rehype-sanitize`.
- **Capabilities / CORS:** Supabase URL allowlist (Auth → URL Configuration) restricts redirects. Stripe webhook endpoint accepts only `application/json` + valid `Stripe-Signature`.
- **Dependency audit:** `pnpm audit --prod` in CI; `pnpm dlx npm-check-updates -u --target minor` monthly.
- **Top 5 risks for this stack:**
  1. Service role key leaks into client bundle (mitigation: §8.2 #2; `import 'server-only'`).
  2. RLS off on a new table (mitigation: §9 #8; CI assertion script).
  3. `getSession` trusted for auth (mitigation: §8.2 #3; lint rule via Biome regex).
  4. Stripe webhook signature not verified (mitigation: §3 inline route uses `constructEvent` with raw body).
  5. SSRF / open redirect via user-controlled URL in `redirect()` (mitigation: validate against allowlist in Zod schema).

---

## 12. Deploy

### Provision

```bash
# 1. Push to GitHub
gh repo create my-app --public --source=. --remote=origin --push

# 2. Link Vercel project
vercel link

# 3. Pull/copy envs into Vercel
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add DATABASE_URL production            # use Supabase Transaction pooler URL
vercel env add STRIPE_SECRET_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add SENTRY_DSN production
vercel env add SENTRY_AUTH_TOKEN production
# Repeat the same set for preview
```

### Release

```bash
git push origin main          # Vercel auto-builds & promotes to prod
# Or manual:
vercel --prod
```

Staging = `preview` environment on every PR (Vercel deploys automatically). Prod = `main` branch.

### Rollback

```bash
vercel rollback               # interactive: pick prior deployment
# or via Dashboard → Deployments → Promote to Production
```

Safe rollback window: **24 hours**. After 24h, schema migrations may have moved past where the older bundle expects.

### Health check

```bash
curl -fsS https://<prod-domain>/api/health | jq .
# Expect: {"ok":true,"commit":"<sha>","db":"up"}
```

`src/app/api/health/route.ts` is created by the scaffold (§16).

### Versioning

`package.json` `"version"` field. Bump via `pnpm version patch|minor|major`. Surfaced in `/api/health` via `process.env.npm_package_version`.

### DB migration on deploy

```bash
# After each PR with new migrations, run:
supabase db push --linked --include-all   # applies pending migrations to linked Supabase project
```

CI workflow (§16) runs this on `main` after a successful build.

### DNS / domain

Vercel Dashboard → Domains → add `app.example.com` → set CNAME `cname.vercel-dns.com` at registrar. Update Supabase Auth → URL Configuration to include the new domain.

### Cost (per 1k MAU, ballpark)

- Vercel Hobby (free) for indie. Pro ($20/mo) for teams; Functions invocations free up to ~100k.
- Supabase Free: 500 MB DB, 1 GB storage, 50k MAU, 2 GB egress. Pro $25/mo for 8 GB DB, unlimited Auth.
- Stripe: 2.9% + 30¢ per transaction; no monthly fee.
- Sentry Developer: 5k errors/mo free.
- **Total at 1k MAU on free tiers: $0 plus per-tx Stripe fees. At 10k MAU: ~$45/mo.**

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Project: <name>

This repo follows `RULEBOOK.md` (a.k.a. `nextjs-supabase.md`). Read it before any non-trivial change.

## Commands you should remember

- `pnpm dev` — start app at http://localhost:3000
- `supabase start` / `supabase stop` — local DB
- `pnpm typecheck` — `tsc --noEmit`
- `pnpm lint` — Biome check
- `pnpm format` — Biome write
- `pnpm test --run` — unit tests once
- `pnpm test:integration` — DB-backed tests (requires supabase up)
- `pnpm e2e` — Playwright
- `pnpm build` — production build
- `pnpm db:generate` — Drizzle generate types from schema
- `supabase migration new <name>` — new SQL migration
- `supabase db reset` — wipe + replay migrations + seed
- `stripe listen --forward-to localhost:3000/api/stripe/webhook`

## Banned patterns

- Pages Router (`pages/**`)
- `getServerSideProps`, `getStaticProps`, `getStaticPaths`
- `next-auth` / `auth.js` (Supabase Auth is the auth provider)
- `drizzle-kit push`
- `Math.random()`, `Date.now()`, `new Date().toLocaleString()` in render
- `supabase.auth.getSession()` for auth decisions (use `getUser`)
- `'use client'` on a file that imports `next/headers`, `cookies`, or service role key
- Any global state library (Zustand, Redux, Jotai, Recoil, React Query) — RSC + Server Actions only

## Definition of done

`pnpm typecheck && pnpm lint && pnpm test --run && pnpm build` all green; relevant Playwright spec passes; PR description lists migrations and env var changes.

## Skills to invoke

- `/test-driven-development` before any feature work
- `/systematic-debugging` for bugs
- `/verification-before-completion` before marking complete
- `/security-review` for any auth/payment/RLS change
- `/ship` when ready to merge
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm dev:*)",
      "Bash(pnpm build)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm format:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm e2e:*)",
      "Bash(pnpm db:*)",
      "Bash(pnpm dlx shadcn*)",
      "Bash(pnpm dlx @sentry/wizard*)",
      "Bash(supabase start)",
      "Bash(supabase stop)",
      "Bash(supabase status)",
      "Bash(supabase db reset)",
      "Bash(supabase db push:*)",
      "Bash(supabase migration new:*)",
      "Bash(supabase migration list)",
      "Bash(supabase functions:*)",
      "Bash(stripe listen:*)",
      "Bash(stripe trigger:*)",
      "Bash(vercel:*)",
      "Bash(gh pr:*)",
      "Bash(gh issue:*)",
      "Bash(gh repo:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git checkout:*)",
      "Bash(git branch:*)",
      "Bash(curl localhost:*)",
      "Bash(curl 127.0.0.1:*)",
      "Bash(jq:*)",
      "Bash(grep:*)",
      "Bash(rg:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(supabase db push --linked:*)",
      "Bash(vercel --prod:*)",
      "Bash(pnpm publish:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm exec biome check --write --no-errors-on-unmatched $CLAUDE_FILE_PATHS 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm typecheck && pnpm lint" }
        ]
      }
    ]
  }
}
```

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# Codex agent rules

This repo follows `RULEBOOK.md`. Read it first.

## Definition of done

Run, in order: `pnpm install --frozen-lockfile`, `pnpm typecheck`, `pnpm lint`, `pnpm test --run`, `pnpm build`. All must exit 0. Then run the most relevant Playwright spec.

## Banned

- Pages Router. `getServerSideProps`. `getStaticProps`. `next-auth`. `drizzle-kit push`. `getSession()` for auth.
- Adding global state libs (Zustand/Redux/Jotai/Recoil/React Query).
- Editing `package.json` and `src/db/schema.ts` in parallel subtasks.
- Reading `process.env.*` outside `src/lib/env.ts`.

## Always

- Server-first. `'use client'` only when needed.
- `'use server'` on top of every action file.
- Zod-validate every Server Action input via `next-safe-action`.
- RLS on every new table; default-deny; policies in same migration.
- `prepare: false` on the postgres() client.
- `await cookies()`, `await headers()` (Next 15+).
- Use `logger` from `src/lib/logger.ts`; not `console.log`.

## Parallel safety

OK to fan out: distinct components, distinct tests, distinct Server Actions in distinct files.
NOT OK: any change to package.json, lockfile, schema.ts, migrations, next.config, middleware, env files.
```

### `.codex/config.toml`

```toml
[model]
name = "gpt-5-codex"

[sandbox]
mode = "workspace-write"
network_access = false

[approval]
mode = "on-request"

[shell]
allowed_commands = [
  "pnpm",
  "npx",
  "supabase",
  "stripe",
  "vercel",
  "gh",
  "git",
  "node",
  "curl",
  "jq",
  "rg",
  "grep",
]

[project]
rulebook = "RULEBOOK.md"
```

### Codex vs Claude Code differences

- Codex defaults to network-off in workspace-write — ask the user to grant network for `pnpm install` and `supabase start`.
- Codex won't `pnpm dev` in long-running mode by default — use `run_in_background` or have the user start it.
- Codex tends to write complete files; Claude tends to patch — both work, but Codex more often misses adding the matching test.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
You are working in a Next.js 16 App Router + Supabase + Stripe project. Read RULEBOOK.md before any non-trivial change.

ALWAYS:
- Server Components by default; 'use client' only when hooks/events/browser APIs are needed.
- 'use server' as first line of any file in src/actions/.
- Validate every Server Action input with Zod via next-safe-action.
- Use src/lib/supabase/server.ts in RSC/Server Actions; src/lib/supabase/client.ts in client comps.
- Use supabase.auth.getUser() (never getSession) for auth decisions on the server.
- Set prepare: false on postgres().
- await cookies() and await headers().
- Run `pnpm typecheck && pnpm lint && pnpm test --run` before claiming done.

NEVER:
- Use the Pages Router (`pages/**`), getServerSideProps, getStaticProps.
- Install next-auth, Zustand, Redux, Jotai, Recoil, or React Query.
- drizzle-kit push.
- Import service-role or Stripe secret keys in client files.
- Math.random(), Date.now(), new Date().toLocaleString() during render.
- console.log in committed code (use logger from src/lib/logger.ts).
- Skip RLS on a new public table.

When adding a feature:
1. Migration: `supabase migration new <name>` → write SQL with RLS policies.
2. Schema: update src/db/schema.ts, run `pnpm db:generate`.
3. Action: src/actions/<feature>.ts with `'use server'` and next-safe-action.
4. UI: server component for layout, client component for interactivity.
5. Tests: unit (Vitest) + e2e (Playwright).
6. Verify: pnpm typecheck && pnpm lint && pnpm test --run && pnpm build.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "supabase.vscode-supabase-extension",
    "vitest.explorer",
    "vercel.vercel-vscode"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "pnpm dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    },
    {
      "name": "Vitest: current file",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}"],
      "console": "integratedTerminal"
    }
  ]
}
```

### `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": { "source.organizeImports.biome": "explicit", "source.fixAll.biome": "explicit" },
  "typescript.tsdk": "node_modules/typescript/lib",
  "tailwindCSS.experimental.classRegex": [["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]]
}
```

---

## 16. First-PR Scaffold

After running the §2.6 bootstrap commands, write/replace these files. After commit + push, the branch deploys a working hello-world to Vercel preview.

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "vitest",
    "test:integration": "vitest --run --dir tests/integration",
    "e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio",
    "prepare": "echo skip"
  },
  "dependencies": {
    "@hookform/resolvers": "^3.10.0",
    "@sentry/nextjs": "10.50.0",
    "@stripe/stripe-js": "9.0.1",
    "@supabase/ssr": "0.7.5",
    "@supabase/supabase-js": "2.103.3",
    "drizzle-orm": "0.44.6",
    "next": "16.0.4",
    "next-safe-action": "8.1.8",
    "nuqs": "2.4.3",
    "pino": "^9.7.0",
    "postgres": "3.4.7",
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "react-hook-form": "^7.54.0",
    "stripe": "22.0.2",
    "zod": "4.3.6"
  },
  "devDependencies": {
    "@biomejs/biome": "2.3.8",
    "@playwright/test": "1.55.0",
    "@tailwindcss/postcss": "4.1.6",
    "@testing-library/dom": "^10.0.0",
    "@testing-library/jest-dom": "^6.9.1",
    "@testing-library/react": "16.3.2",
    "@types/node": "^22.14.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "5.1.3",
    "drizzle-kit": "0.31.7",
    "jsdom": "^25.0.0",
    "pino-pretty": "^11.0.0",
    "supabase": "2.95.4",
    "tailwindcss": "4.1.6",
    "typescript": "6.0.3",
    "vite-tsconfig-paths": "^5.0.0",
    "vitest": "4.0.18"
  },
  "packageManager": "pnpm@10.33.0",
  "engines": { "node": ">=22.14.0" }
}
```

### `next.config.ts`

```ts
import type { NextConfig } from 'next';
import { withSentryConfig } from '@sentry/nextjs';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  serverExternalPackages: ['postgres'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '*.supabase.co' },
    ],
  },
  async headers() {
    return [{
      source: '/(.*)',
      headers: [
        { key: 'X-Frame-Options', value: 'DENY' },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    }];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  silent: !process.env.CI,
  widenClientFileUpload: true,
  hideSourceMaps: true,
  disableLogger: true,
});
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "src/**/*", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

### `postcss.config.mjs`

```js
export default { plugins: { '@tailwindcss/postcss': {} } };
```

### `src/app/globals.css`

```css
@import "tailwindcss";
@theme { --font-sans: ui-sans-serif, system-ui, sans-serif; }
:root { color-scheme: light dark; }
body { @apply bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100; }
```

### `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL! },
  verbose: true,
  strict: true,
});
```

### `supabase/config.toml`

```toml
project_id = "my-app"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
extra_search_path = ["public", "extensions"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 16

[db.pooler]
enabled = true
port = 54329
pool_mode = "transaction"
default_pool_size = 20
max_client_conn = 100

[realtime]
enabled = true

[studio]
enabled = true
port = 54323

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["http://localhost:3000/auth/callback"]
jwt_expiry = 3600
enable_signup = true
enable_anonymous_sign_ins = false

[auth.email]
enable_signup = true
enable_confirmations = false

[storage]
enabled = true
file_size_limit = "50MiB"

[edge_runtime]
enabled = true
inspector_port = 8083
```

### `supabase/migrations/0001_init.sql`

```sql
-- Profiles table tied to auth.users
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  avatar_url text,
  stripe_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "profiles are viewable by owner"
  on public.profiles for select
  using ((select auth.uid()) = id);

create policy "profiles are updatable by owner"
  on public.profiles for update
  using ((select auth.uid()) = id);

-- Auto-create a profile row on signup
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Subscriptions mirror of Stripe
create table public.subscriptions (
  id text primary key,                          -- Stripe subscription id
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null,
  price_id text not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);

alter table public.subscriptions enable row level security;

create policy "subscriptions are viewable by owner"
  on public.subscriptions for select
  using ((select auth.uid()) = user_id);

-- updated_at trigger helper
create function public.set_updated_at() returns trigger
  language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.set_updated_at();
```

### `supabase/seed.sql`

```sql
-- Local-only seed
insert into auth.users (id, email, encrypted_password, email_confirmed_at)
values ('00000000-0000-0000-0000-000000000001', 'test@example.com', crypt('password', gen_salt('bf')), now())
on conflict do nothing;
```

### `components.json`

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "zinc",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### `middleware.ts`

```ts
import type { NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
```

### `src/lib/supabase/middleware.ts`

```ts
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { env } from '@/lib/env';

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) response.cookies.set(name, value, options);
        },
      },
    }
  );

  // IMPORTANT: getUser refreshes the session and re-issues cookies.
  await supabase.auth.getUser();

  return response;
}
```

### `src/lib/supabase/server.ts`

```ts
import 'server-only';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) cookieStore.set(name, value, options);
          } catch {
            // setAll inside Server Component (read-only) — fine; middleware refreshes.
          }
        },
      },
    }
  );
}
```

### `src/lib/supabase/client.ts`

```ts
'use client';
import { createBrowserClient } from '@supabase/ssr';
import { env } from '@/lib/env';

export function createClient() {
  return createBrowserClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
```

### `src/lib/supabase/admin.ts`

```ts
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

// Service-role client. Bypasses RLS. Use only from trusted server code (webhooks, cron).
export const supabaseAdmin = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);
```

### `src/lib/env.ts`

```ts
import { z } from 'zod';

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(20),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(20),
  DATABASE_URL: z.string().url(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().startsWith('pk_'),
  SENTRY_DSN: z.string().url().optional(),
  LOG_LEVEL: z.enum(['fatal','error','warn','info','debug','trace']).optional(),
});

export const env = schema.parse(process.env);
```

### `src/db/index.ts`

```ts
import 'server-only';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import { env } from '@/lib/env';

declare global { var __pg: ReturnType<typeof postgres> | undefined; }

const client = global.__pg ?? postgres(env.DATABASE_URL, { prepare: false });
if (process.env.NODE_ENV !== 'production') global.__pg = client;

export const db = drizzle(client, { schema });
export type DB = typeof db;
```

### `src/db/schema.ts`

```ts
import { boolean, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  avatarUrl: text('avatar_url'),
  stripeCustomerId: text('stripe_customer_id').unique(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const subscriptions = pgTable('subscriptions', {
  id: text('id').primaryKey(),
  userId: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  status: text('status').notNull(),
  priceId: text('price_id').notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type Profile = typeof profiles.$inferSelect;
export type NewProfile = typeof profiles.$inferInsert;
```

### `src/lib/safe-action.ts`

```ts
import 'server-only';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

export const actionClient = createSafeActionClient({
  defineMetadataSchema() { return z.object({ name: z.string() }); },
  handleServerError(e, { metadata }) {
    logger.error({ event: 'action.error', name: metadata?.name, msg: e.message });
    return 'Something went wrong. Please retry.';
  },
});

export const authActionClient = actionClient.use(async ({ next }) => {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');
  return next({ ctx: { user, supabase } });
});
```

### `src/lib/logger.ts`

(same as §7)

### `src/lib/stripe/server.ts`

```ts
import 'server-only';
import Stripe from 'stripe';
import { env } from '@/lib/env';

export const stripe = new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2026-04-01.preview' });
```

### `src/lib/stripe/client.ts`

```ts
'use client';
import { loadStripe, type Stripe } from '@stripe/stripe-js';

let promise: Promise<Stripe | null> | null = null;
export function getStripe() {
  if (!promise) promise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
  return promise;
}
```

### `src/lib/utils.ts`

```ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
```

### `src/app/layout.tsx`

```tsx
import type { Metadata } from 'next';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import './globals.css';

export const metadata: Metadata = { title: 'My App', description: 'Built with the rulebook.' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NuqsAdapter>{children}</NuqsAdapter>
      </body>
    </html>
  );
}
```

### `src/app/page.tsx`

```tsx
export default function Home() {
  return (
    <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-3xl font-bold">Hello, RULEBOOK.</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Edit src/app/page.tsx to begin.</p>
    </main>
  );
}
```

### `src/app/api/health/route.ts`

```ts
import { NextResponse } from 'next/server';
import { db } from '@/db';
import { sql } from 'drizzle-orm';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  let dbUp = false;
  try { await db.execute(sql`select 1`); dbUp = true; } catch {}
  return NextResponse.json({
    ok: dbUp,
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? 'local',
    version: process.env.npm_package_version ?? '0.0.0',
    db: dbUp ? 'up' : 'down',
  });
}
```

### `src/app/api/stripe/webhook/route.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { env } from '@/lib/env';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const sig = req.headers.get('stripe-signature');
  if (!sig) return new NextResponse('missing signature', { status: 400 });
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, env.STRIPE_WEBHOOK_SECRET);
  } catch (e) {
    logger.error({ event: 'stripe.webhook.invalid_sig', err: (e as Error).message });
    return new NextResponse('invalid signature', { status: 400 });
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const sub = event.data.object;
      await supabaseAdmin.from('subscriptions').upsert({
        id: sub.id,
        user_id: (sub.metadata as Record<string, string>).user_id,
        status: sub.status,
        price_id: sub.items.data[0].price.id,
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        cancel_at_period_end: sub.cancel_at_period_end,
      });
      break;
    }
    default:
      logger.info({ event: 'stripe.webhook.unhandled', type: event.type });
  }
  return NextResponse.json({ received: true });
}
```

### `src/app/auth/callback/route.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/auth/login?error=oauth`);
}
```

### `src/app/auth/login/page.tsx`

```tsx
import { signIn } from '@/actions/auth';

export default function LoginPage() {
  return (
    <main className="mx-auto max-w-sm p-8">
      <h1 className="text-2xl font-semibold">Sign in</h1>
      <form action={signIn} className="mt-4 space-y-3">
        <input name="email" type="email" required className="w-full rounded border p-2" placeholder="email" />
        <input name="password" type="password" required className="w-full rounded border p-2" placeholder="password" />
        <button className="w-full rounded bg-zinc-900 p-2 text-white">Sign in</button>
      </form>
    </main>
  );
}
```

### `src/actions/auth.ts`

```ts
'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { actionClient } from '@/lib/safe-action';

const credentials = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function signIn(formData: FormData) {
  const parsed = credentials.parse({ email: formData.get('email'), password: formData.get('password') });
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed);
  if (error) redirect('/auth/login?error=' + encodeURIComponent(error.message));
  redirect('/dashboard');
}

export const signOut = actionClient
  .metadata({ name: 'signOut' })
  .action(async () => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/');
  });
```

### `instrumentation.ts`

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs')   await import('./sentry.server.config');
  if (process.env.NEXT_RUNTIME === 'edge')     await import('./sentry.edge.config');
}
export { onRequestError } from '@sentry/nextjs';
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.8/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "ignore": [".next", "node_modules", ".vercel", "drizzle", "supabase/.branches"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error", "noConsoleLog": "warn" },
      "correctness": { "noUnusedVariables": "error", "useExhaustiveDependencies": "warn" },
      "nursery": { "useSortedClasses": { "level": "warn", "options": { "functions": ["clsx","cn"] } } }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" } }
}
```

### `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'tests/unit/**/*.test.{ts,tsx}'],
    exclude: ['tests/e2e/**', 'tests/integration/**', 'node_modules', '.next'],
    coverage: { reporter: ['text', 'html'], reportsDirectory: './coverage' },
  },
});
```

### `tests/setup.ts`

```ts
import '@testing-library/jest-dom/vitest';
```

### `playwright.config.ts`

```ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
```

### `tests/e2e/smoke.spec.ts`

```ts
import { test, expect } from '@playwright/test';

test('homepage renders', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Hello, RULEBOOK/i })).toBeVisible();
});
```

### `.env.example`

```
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...local-anon
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...local-service-role
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:54322/postgres
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
SENTRY_DSN=https://xxx@oNNN.ingest.sentry.io/NNN
SENTRY_ORG=
SENTRY_PROJECT=
LOG_LEVEL=debug
```

### `.gitignore` (additions)

```
.env*
!.env.example
.next/
.vercel/
coverage/
playwright-report/
test-results/
supabase/.branches
supabase/.temp
```

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:
jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env: { POSTGRES_PASSWORD: postgres }
        ports: ['54322:5432']
        options: >-
          --health-cmd pg_isready --health-interval 10s
          --health-timeout 5s --health-retries 5
    env:
      DATABASE_URL: postgresql://postgres:postgres@localhost:54322/postgres
      NEXT_PUBLIC_SUPABASE_URL: http://localhost:54321
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ci-anon
      SUPABASE_SERVICE_ROLE_KEY: ci-service-role
      STRIPE_SECRET_KEY: sk_test_ci
      STRIPE_WEBHOOK_SECRET: whsec_ci
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: pk_test_ci
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 22.14.0, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --run
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: pnpm e2e --project=chromium
        env: { PLAYWRIGHT_BASE_URL: http://localhost:3000 }

  migrate:
    needs: build
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
        with: { version: 2.95.4 }
      - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
        env: { SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }} }
      - run: supabase db push --include-all
        env: { SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }} }
```

### `README.md`

```markdown
# my-app

Built from `RULEBOOK.md` (Next.js + Supabase + Stripe + Vercel).

## Local dev

1. `cp .env.example .env.local` and fill values.
2. `supabase start` (Docker required).
3. `pnpm install && pnpm dev`.
4. Stripe webhooks: `stripe listen --forward-to localhost:3000/api/stripe/webhook`, copy the signing secret into `.env.local`.

See `RULEBOOK.md` for everything else.
```

### `LICENSE`

MIT (or chosen by user).

---

## 17. Idea → MVP Path

Default `PROJECT_IDEA` is blank → assume a generic SaaS with auth, paid plans, and one feature surface (e.g. "items" CRUD). Tailor below to the user's idea by replacing `items` with the real noun.

### Phase 1 — Schema (1–2 sessions)

- Add a domain table per noun (e.g. `items`) with `id uuid pk`, `user_id uuid fk profiles(id)`, `created_at`, plus your fields.
- RLS: owner-only for select/insert/update/delete.
- Migration via `supabase migration new add_items`. Re-run `supabase db reset`.
- Update `src/db/schema.ts`. Run `pnpm db:generate` and `pnpm typecheck`.
- Files touched: 2 (1 SQL migration, 1 schema.ts).
- Exit: `pnpm test:integration` passes; `select rowsecurity from pg_tables` is `t` for the new table.

### Phase 2 — Backbone (1 session)

- Routes: `(app)/items/page.tsx`, `(app)/items/[id]/page.tsx`, `(app)/items/new/page.tsx`.
- A `app/(app)/layout.tsx` that calls `getUser()` and `redirect('/auth/login')` if unauthed.
- Empty UI, real data fetch via `db.query.items.findMany({ where: ... })`.
- Files: 4–6.
- Exit: navigating to `/items` while signed in renders an empty list with no errors.

### Phase 3 — Vertical slice (2 sessions)

- `src/actions/items.ts` with `createItem`, `updateItem`, `deleteItem` via `authActionClient`.
- Forms (`react-hook-form` + Zod resolver) on the `new` and `[id]` pages.
- `revalidatePath('/items')` after mutations.
- Tests: unit for the action; Playwright spec for the create-then-list flow.
- Files: 4–8.
- Exit: full create/list/edit/delete works end-to-end; `pnpm e2e` passes.

### Phase 4 — Auth + multi-user (1 session)

- Email/password sign up + sign in already wired by scaffold; add Google OAuth via Supabase Dashboard → Auth → Providers.
- `auth/callback/route.ts` already in scaffold.
- Add a `/account` page showing email + sign-out button.
- Test: a second user cannot see the first user's items (RLS verification spec).
- Exit: 2-account isolation verified via Playwright.

### Phase 5 — Ship + monitor (1 session)

- Push to GitHub; Vercel imports the repo automatically.
- Add envs in Vercel (all the keys from `.env.example`).
- Link Supabase: `supabase link --project-ref <ref>`; CI applies migrations.
- Stripe webhook: dashboard → Developers → Webhooks → add endpoint `https://<domain>/api/stripe/webhook` → events `customer.subscription.*`, `checkout.session.completed`. Copy signing secret to Vercel env.
- Smoke: `curl https://<domain>/api/health` returns `{"ok":true}`.
- Exit: a real signup → checkout → webhook → DB row appears in prod.

---

## 18. Feature Recipes

### 18.1 Email/password auth

Already in scaffold. To add OAuth (Google):

1. Supabase Dashboard → Authentication → Providers → enable Google → paste Client ID/Secret from Google Cloud Console.
2. Add a button on `/auth/login`:

```tsx
'use client';
import { createClient } from '@/lib/supabase/client';
export function GoogleButton() {
  return (
    <button onClick={async () => {
      const supabase = createClient();
      await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${location.origin}/auth/callback` } });
    }} className="w-full rounded border p-2">Sign in with Google</button>
  );
}
```

### 18.2 File upload (Supabase Storage)

```ts
// src/actions/upload.ts
'use server';
import { authActionClient } from '@/lib/safe-action';
import { z } from 'zod';
export const uploadAvatar = authActionClient
  .metadata({ name: 'uploadAvatar' })
  .schema(z.object({ file: z.instanceof(File) }))
  .action(async ({ parsedInput, ctx }) => {
    const path = `avatars/${ctx.user.id}/${Date.now()}-${parsedInput.file.name}`;
    const { error } = await ctx.supabase.storage.from('public').upload(path, parsedInput.file, { upsert: true });
    if (error) throw error;
    return { path };
  });
```

Bucket creation in a migration:

```sql
insert into storage.buckets (id, name, public) values ('public', 'public', true) on conflict do nothing;
create policy "users upload to own folder" on storage.objects
  for insert to authenticated with check (
    bucket_id = 'public' and (storage.foldername(name))[2] = auth.uid()::text
  );
```

### 18.3 Stripe Checkout

```ts
// src/actions/billing.ts
'use server';
import { authActionClient } from '@/lib/safe-action';
import { stripe } from '@/lib/stripe/server';
import { redirect } from 'next/navigation';
import { z } from 'zod';

export const startCheckout = authActionClient
  .metadata({ name: 'startCheckout' })
  .schema(z.object({ priceId: z.string() }))
  .action(async ({ parsedInput, ctx }) => {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer_email: ctx.user.email,
      line_items: [{ price: parsedInput.priceId, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/billing/success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/pricing`,
      metadata: { user_id: ctx.user.id },
      subscription_data: { metadata: { user_id: ctx.user.id } },
    });
    redirect(session.url!);
  });
```

Webhook handler is already in scaffold (`/api/stripe/webhook/route.ts`).

### 18.4 Background job (Supabase Edge Function + cron)

```ts
// supabase/functions/daily-digest/index.ts
import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
Deno.serve(async () => {
  // fetch + send digests
  return new Response('ok');
});
```

Schedule:

```sql
-- supabase/migrations/<ts>_cron_digest.sql
select cron.schedule('daily-digest', '0 9 * * *',
  $$ select net.http_post('https://<ref>.functions.supabase.co/daily-digest',
                          headers => jsonb_build_object('Authorization','Bearer '||current_setting('app.settings.service_role'))) $$);
```

Deploy: `supabase functions deploy daily-digest`.

### 18.5 Realtime updates

```tsx
'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ItemsLive({ initial }: { initial: { id: string; title: string }[] }) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'items' }, payload => {
        setItems(prev => {
          if (payload.eventType === 'INSERT') return [...prev, payload.new as never];
          if (payload.eventType === 'DELETE') return prev.filter(i => i.id !== (payload.old as { id: string }).id);
          return prev;
        });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);
  return <ul>{items.map(i => <li key={i.id}>{i.title}</li>)}</ul>;
}
```

Don't forget the publication and policy:

```sql
alter publication supabase_realtime add table public.items;
create policy "realtime: owner can listen" on public.items for select using ((select auth.uid()) = user_id);
```

### 18.6 Search (Postgres trigram)

```sql
create extension if not exists pg_trgm;
create index items_title_trgm on items using gin (title gin_trgm_ops);
```

```ts
// src/db/queries/search.ts
import 'server-only';
import { db } from '@/db';
import { sql } from 'drizzle-orm';
import { items } from '@/db/schema';
export async function searchItems(q: string) {
  return db.select().from(items).where(sql`${items.title} ilike ${'%' + q + '%'}`).limit(20);
}
```

### 18.7 i18n (built-in App Router)

`src/middleware.ts` adds locale detection; route group `(app)/[locale]/...`. For most apps, defer until 1k MAU; use `next-intl` 4.x when needed.

### 18.8 Dark mode

Tailwind v4 + `class` strategy. Add a tiny client `ThemeToggle` setting `document.documentElement.classList.toggle('dark')` and persisting to `localStorage`. Avoid theme provider libs.

### 18.9 Analytics events

Use `@vercel/analytics` (free on Vercel) for page views and `posthog-js` only if product analytics needed.

```tsx
// src/app/layout.tsx (add inside body)
import { Analytics } from '@vercel/analytics/next';
// ...
<Analytics />
```

### 18.10 Email (transactional)

Supabase Auth handles auth emails. For app emails, Resend 4.x:

```ts
// src/lib/email.ts
import 'server-only';
import { Resend } from 'resend';
export const resend = new Resend(process.env.RESEND_API_KEY!);
```

---

## 19. Troubleshooting (Top 30 errors)

| Error | Fix |
|---|---|
| `Error: Hydration failed because the initial UI does not match` | Move `Date.now()`/`Math.random()`/`new Date()` into `useEffect`. |
| `cookies() should be awaited before using its value` | `const c = await cookies();` |
| `headers() should be awaited` | `const h = await headers();` |
| `Cannot use 'redirect()' inside a try/catch` | `redirect()` throws; remove the try/catch around it. |
| `Only plain objects can be passed from Server to Client Components` | `.toISOString()` on Date; serialize before returning. |
| `You're importing a component that needs next/headers` | Add `'use server'` (action) or remove the import (client). |
| `Module not found: Can't resolve 'fs'` | Mark the route `runtime = 'nodejs'`; or remove the import (it's leaking to Edge). |
| `prepared statement "s_1" does not exist` | `postgres(url, { prepare: false })`. |
| `invalid signature` (Stripe webhook) | Use `await req.text()` (raw body); ensure secret is from `stripe listen`. |
| `Auth session missing!` | `await supabase.auth.getUser()` first; or middleware not running on this matcher. |
| `Row level security: new row violates policy` | Add an `with check` policy or set `user_id = auth.uid()`. |
| `permission denied for table` (Realtime) | Add table to `supabase_realtime` publication + RLS select policy. |
| `Error: connect ECONNREFUSED 127.0.0.1:54322` | `supabase start`. |
| `Hydration mismatch: server "0", client "1"` | Use `useId()` or a `useEffect`-driven counter. |
| `revalidatePath was called inside a Client Component` | Move it into the Server Action. |
| `next-safe-action: server validation failed` | Check Zod schema vs form values; coerce types. |
| `TypeError: Failed to construct URL` | `NEXT_PUBLIC_SUPABASE_URL` missing or has a trailing space. |
| `Error: ENOENT: no such file or directory, open '.env.local'` | `cp .env.example .env.local` + fill values. |
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@10.33.0 --activate`. |
| `Docker daemon not running` | Start Docker Desktop; `docker info` must succeed. |
| `Edge function build failed: Cannot find module 'jsr:...'` | Use Deno-compatible imports; not Node modules. |
| `Error: Class extends value undefined` | A `'use server'` file imported a non-serializable. Split import boundaries. |
| `Build error: missing punctuation` (Biome) | `pnpm lint:fix`. |
| `useFormStatus must be used within a form action` | Wrap the call in a `<form>` element using a Server Action. |
| `OAuthError: invalid_request: redirect_uri` | Add the URL to Supabase Auth → URL Configuration. |
| `Image with src "..." has either width or height modified, but not the other` | Provide both, or use `fill` + `sizes`. |
| `Error: Element type is invalid: expected a string ... but got: undefined` | Default vs named import mismatch. |
| `next/dynamic: ssr: false in Server Component` | Move the dynamic import into a client component. |
| `EADDRINUSE :3000` | `lsof -ti:3000 \| xargs kill -9`. |
| `Vercel: Function exceeded maximum execution duration` | Move heavy work to an Edge Function or background job; default is 10s on Hobby. |

---

## 20. Glossary

- **App Router** — Next.js's file-based routing under `app/` with React Server Components by default.
- **RSC (React Server Component)** — A component that runs only on the server; never ships JS to the browser.
- **Server Action** — A function marked `'use server'` that the browser can call as if it were a function; under the hood it's a POST.
- **Hydration** — Browser attaching event handlers to server-rendered HTML.
- **RLS (Row Level Security)** — Postgres feature where each row checks a policy before being read/written.
- **JWT** — A signed token; Supabase stores access + refresh tokens in cookies.
- **PKCE** — A more secure OAuth flow used by Supabase by default.
- **Drizzle** — TypeScript ORM that generates types from your schema.
- **Migration** — A versioned SQL file describing a database change.
- **Pooler** — A proxy in front of Postgres that recycles connections; Supabase exposes one in "transaction" mode.
- **Edge runtime** — A V8-isolate runtime (no Node APIs); cheaper, faster cold starts, fewer modules available.
- **Webhook** — An HTTP endpoint a third party (Stripe) calls to notify you of events.
- **Idempotency** — Safe to retry; the same request produces the same effect.
- **CSR/SSR/SSG/ISR** — Render strategies. With App Router, the default is RSC + streaming; you mostly don't choose.
- **Service role key** — A super-key that bypasses RLS; only for trusted server code.
- **Anon key** — A public key used by browsers; combined with RLS for safe client access.
- **Turbopack** — The new Rust-based bundler in Next 16, default.
- **Biome** — A single-binary linter+formatter replacing ESLint+Prettier.
- **Vitest** — A Vite-powered Jest-compatible test runner.
- **Playwright** — A browser-automation E2E test runner.
- **Pino** — A fast structured logger for Node.
- **Sentry** — Error and performance monitoring.

---

## 21. Update Cadence

This rulebook is valid for **Next.js 16.0.x → 16.x** and **Supabase JS 2.103.x → 2.x**.

Re-run the generator when:

- Major version bump in any of: Next, React, Supabase JS, @supabase/ssr, Drizzle, Stripe SDK, Tailwind, Biome.
- Deploy target change.
- A security advisory affects any pinned package.
- The Supabase SSR cookie API changes.

**Generated:** 2026-04-27.
