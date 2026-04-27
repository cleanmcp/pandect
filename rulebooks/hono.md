# Hono + Bun + TypeScript + Drizzle + Cloudflare Workers — Rulebook

Edge-native TypeScript API: Hono on Cloudflare Workers, Drizzle on D1, R2 for blobs, KV for cache, Bun as the local toolchain, Wrangler for deploy.

Generated 2026-04-27. Valid for stack snapshot below; re-run generator on any major version bump.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0 | Strict types, Workers-native, Hono inference. |
| Runtime + version | Cloudflare Workers (workerd) | Target prod runtime; V8 isolates with Web APIs. |
| Local dev runtime | Wrangler dev (miniflare) | Bundled with Wrangler; simulates Workers locally. |
| Toolchain runtime | Bun 1.3 | Fast install, native TS, drizzle-kit, scripts. |
| Package manager | Bun | One tool; lockfile is `bun.lock`. |
| Build tool | Wrangler (esbuild) | Built-in; Workers-aware bundling. |
| Web framework | Hono 4.12 | Web Standards, Workers-first, typed routes. |
| State mgmt | Stateless + KV/D1 | Workers are stateless; persist to bindings. |
| Routing/Nav | Hono router | Trie router; type-safe params. |
| Data layer (db + orm) | D1 + Drizzle ORM | SQLite at edge; thin typed SQL. |
| Migrations tool | drizzle-kit generate + wrangler d1 apply | Generate SQL, apply via Wrangler. |
| Object storage | Cloudflare R2 | S3-compatible; bound directly. |
| KV cache | Cloudflare Workers KV | Eventual-consistent edge KV. |
| Auth | Hono JWT + cookie | Built-in; HS256 secret in vars. |
| Forms + validation | Zod 4 + @hono/zod-validator | Standard schema, typed input. |
| Unit test runner | Vitest 4.1 | Fast, ESM-native, Vite ecosystem. |
| Workers test pool | @cloudflare/vitest-pool-workers | Runs tests inside workerd. |
| E2E framework | Vitest integration tests via SELF.fetch | Pool-workers ships SELF binding. |
| Mocking strategy | Mock at adapter boundary; never mock D1 | Use `--local` D1 in tests. |
| Logger | console.log JSON via helper | Workers Logs ingests stdout; structured. |
| Error tracking | @sentry/cloudflare withSentry | Official SDK; D1 + cron instrumentation. |
| Lint + format | Biome 2.4 | One Rust binary; replaces ESLint+Prettier. |
| Type checking | tsc --noEmit | TypeScript canonical typecheck. |
| Env vars + secrets | .dev.vars (local) + wrangler secret put (prod) | Cloudflare canonical; never commit. |
| CI provider | GitHub Actions | Free for public; Wrangler official action. |
| Deploy target | Cloudflare Workers | Stack target. |
| Release flow | wrangler deploy --env production | One command; instant rollout. |
| Auto-update | N/A (server-side) | Workers updates on deploy. |
| Compatibility flags | nodejs_compat | Required for Node built-ins (crypto, etc.). |
| Compatibility date | 2026-04-27 | Today; pins runtime semantics. |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| hono | 4.12.14 | 2026-04-21 | https://www.npmjs.com/package/hono |
| bun | 1.3.11 | 2026-04 | https://bun.com/blog |
| typescript | 6.0.3 | 2026-04-16 | https://www.npmjs.com/package/typescript |
| drizzle-orm | 0.45.x | 2026-04 | https://orm.drizzle.team/docs/connect-cloudflare-d1 |
| drizzle-kit | 0.31.x | 2026-04 | https://orm.drizzle.team/docs/get-started/d1-new |
| wrangler | 4.x | 2026-04 | https://github.com/cloudflare/workers-sdk/releases |
| @cloudflare/workers-types | latest | rolling | https://www.npmjs.com/package/@cloudflare/workers-types |
| zod | 4.3.6 | 2026-01 | https://github.com/colinhacks/zod/releases |
| @hono/zod-validator | 0.5.x | 2026 | https://www.npmjs.com/package/@hono/zod-validator |
| vitest | 4.1.5 | 2026-04-21 | https://vitest.dev/blog/vitest-4-1.html |
| @cloudflare/vitest-pool-workers | latest | rolling | https://www.npmjs.com/package/@cloudflare/vitest-pool-workers |
| @sentry/cloudflare | latest | rolling | https://www.npmjs.com/package/@sentry/cloudflare |
| @biomejs/biome | 2.4.x | 2026-02 | https://biomejs.dev/blog/roadmap-2026/ |
| compatibility_date | 2026-04-27 | today | https://developers.cloudflare.com/workers/configuration/compatibility-dates/ |

### Minimum Host Requirements

- macOS 13+ / Windows 10+ / Ubuntu 22.04+
- 4 GB RAM, 5 GB disk
- Internet for Wrangler login + deploy
- Cloudflare account (free tier works)

### Cold-Start Estimate

`git clone` to `wrangler dev` serving requests on a fresh machine: **8 minutes** (account creation, Bun install, deps, login, first dev run).

---

## 2. Zero-to-Running

### macOS

```bash
# 1. Bun (toolchain runtime)
curl -fsSL https://bun.com/install | bash
exec $SHELL
bun --version   # expect 1.3.x

# 2. Node.js (Wrangler still needs Node 20+ on PATH)
brew install node@20
node --version  # expect v20.x or v22.x

# 3. Git, gh
brew install git gh
gh auth login

# 4. Cloudflare account: https://dash.cloudflare.com/sign-up
#    Verify email before continuing.

# 5. Wrangler login (opens browser)
bunx wrangler login

# 6. Bootstrap project
bunx create-hono@latest my-app --template cloudflare-workers --pm bun
cd my-app
bun install

# 7. First run
bun run dev
# expected: "⎔ Starting local server..." then "Ready on http://localhost:8787"
curl http://localhost:8787
# expected: Hello Hono!
```

### Windows (PowerShell)

```powershell
# 1. Bun
powershell -c "irm bun.sh/install.ps1 | iex"
bun --version

# 2. Node 20
winget install OpenJS.NodeJS.LTS

# 3. Git, gh
winget install Git.Git GitHub.cli
gh auth login

# 4. Cloudflare login
bunx wrangler login

# 5. Bootstrap
bunx create-hono@latest my-app --template cloudflare-workers --pm bun
cd my-app
bun install
bun run dev
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update && sudo apt install -y curl unzip git
curl -fsSL https://bun.com/install | bash
exec $SHELL

# Node 20 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# gh CLI
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install -y gh
gh auth login

bunx wrangler login
bunx create-hono@latest my-app --template cloudflare-workers --pm bun
cd my-app
bun install
bun run dev
```

### Common First-Run Errors

| Error | Fix |
|---|---|
| `Error: Authentication required` | `bunx wrangler login` |
| `wrangler: command not found` | Use `bunx wrangler` not bare `wrangler`. |
| `Cannot find module 'hono'` | `bun install` |
| `Address already in use :::8787` | `lsof -i :8787` then kill, or `bun run dev --port 8788`. |
| `Error: D1_ERROR: no such table` | Run migrations: `bun run db:migrate:local`. |
| `nodejs_compat is required` | Add `compatibility_flags = ["nodejs_compat"]` to wrangler.toml. |
| `Module not found: cloudflare:workers` | `bun add -D @cloudflare/workers-types` and add to tsconfig types. |

---

## 3. Project Layout

```
my-app/
├── src/
│   ├── index.ts              # Worker entry; exports default { fetch }
│   ├── app.ts                # Hono app factory (routes mounted here)
│   ├── env.ts                # Env type (bindings + vars)
│   ├── routes/
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   └── users.ts
│   ├── db/
│   │   ├── schema.ts         # Drizzle table defs
│   │   ├── client.ts         # drizzle(env.DB) factory
│   │   └── queries/          # Reusable query fns
│   ├── lib/
│   │   ├── jwt.ts
│   │   ├── logger.ts
│   │   └── errors.ts
│   ├── middleware/
│   │   ├── auth.ts
│   │   ├── logger.ts
│   │   └── error.ts
│   └── schemas/              # Zod input/output schemas
├── drizzle/
│   └── migrations/           # SQL files generated by drizzle-kit
├── test/
│   ├── routes.test.ts        # Integration tests (SELF.fetch)
│   └── unit/                 # Pure unit tests
├── .github/workflows/
│   └── deploy.yml
├── .cursor/rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .dev.vars.example         # Template for local secrets
├── .gitignore
├── biome.json
├── bun.lock
├── CLAUDE.md
├── AGENTS.md
├── drizzle.config.ts
├── package.json
├── README.md
├── tsconfig.json
├── vitest.config.ts
├── worker-configuration.d.ts # Generated by `wrangler types`
└── wrangler.toml
```

### Naming

- Files: `kebab-case.ts`. Tests: `*.test.ts` next to source or under `test/`.
- Hono apps/routers: `camelCase` (`usersRouter`).
- Zod schemas: `PascalCase` ending in `Schema` (`CreateUserSchema`).
- Drizzle tables: `snake_case` columns, `camelCase` exports (`users`).

### "If you're adding X, it goes in Y"

| Adding | Goes in |
|---|---|
| New HTTP route | `src/routes/<resource>.ts`, mounted in `src/app.ts` |
| New DB table | `src/db/schema.ts` then `bun run db:generate` |
| New Zod input schema | `src/schemas/<resource>.ts` |
| Reusable query | `src/db/queries/<resource>.ts` |
| Middleware | `src/middleware/<name>.ts` |
| New binding (KV/R2/D1) | `wrangler.toml` then `bun run cf-typegen` |
| Secret | `bunx wrangler secret put NAME` (prod), `.dev.vars` (local) |
| Public env var | `[vars]` in `wrangler.toml` |
| Cron trigger | `[triggers] crons` in `wrangler.toml` + `scheduled` handler |
| Background task | `ctx.waitUntil(...)` from a route handler |
| Type for env | extend `Env` in `src/env.ts` |
| New error class | `src/lib/errors.ts` |
| Integration test | `test/<feature>.test.ts` using `SELF.fetch` |
| Unit test | `test/unit/<file>.test.ts` |
| GitHub Action | `.github/workflows/<name>.yml` |
| Static file | R2 (do NOT commit binary blobs) |
| OpenAPI route | use `@hono/zod-openapi` (separate package) |
| Rate limit | Cloudflare Rate Limiting binding |

---

## 4. Architecture

### Process boundaries

```
                ┌──────────────────────────┐
   Client  ───▶ │ Cloudflare Edge          │
                │  ┌──────────────────────┐│
                │  │ Worker (V8 isolate)  ││
                │  │   Hono app           ││
                │  │   ├ routes           ││
                │  │   ├ middleware       ││
                │  │   └ env bindings     ││
                │  └─┬────┬─────┬─────┬───┘│
                │    │    │     │     │    │
                │   D1   KV    R2   Secrets│
                └──────────────────────────┘
```

### Request flow

```
Request
  ▶ Worker fetch handler (src/index.ts)
  ▶ Hono.fetch
  ▶ middleware: requestId → logger → cors → auth (if needed)
  ▶ route handler
      ▶ Zod validate (input)
      ▶ db = drizzle(c.env.DB)
      ▶ query / mutation
      ▶ Zod validate (output, optional)
  ▶ JSON response
  ▶ ctx.waitUntil(logFlush) for any deferred work
```

### Auth flow

```
POST /auth/login {email, password}
  ▶ lookup user in D1
  ▶ verify password (bcrypt via @noble/hashes or Web Crypto PBKDF2)
  ▶ sign HS256 JWT (hono/jwt) with secret from env.JWT_SECRET
  ▶ Set-Cookie: session=<jwt>; HttpOnly; Secure; SameSite=Lax
GET /protected
  ▶ jwt() middleware reads cookie, verifies, sets c.var.jwtPayload
  ▶ handler reads c.var.jwtPayload.sub
```

### State

Workers are stateless. Persistence:
- D1 — relational data
- R2 — blobs/files
- KV — cache, feature flags, session blacklists (eventual consistency)
- Durable Objects — strongly consistent state (not in this default stack; add when needed)

### File-to-responsibility

| File | Responsibility |
|---|---|
| `src/index.ts` | Worker entry. Exports `default { fetch, scheduled? }`. NO business logic. |
| `src/app.ts` | Construct Hono app, mount routers, register global middleware. |
| `src/env.ts` | TypeScript `Env` type — bindings + vars. |
| `src/db/client.ts` | `getDb(env)` factory returning `drizzle(env.DB, { schema })`. |
| `src/middleware/*` | Cross-cutting: auth, logging, error handling. |
| `src/routes/*` | One Hono router per resource. |
| `src/lib/*` | Pure helpers (no env access). |

Business logic lives in `src/routes/*` handlers and `src/db/queries/*`. It does NOT live in `src/index.ts`, `src/lib/*`, or middleware.

---

## 5. Dev Workflow

### Start dev

```bash
bun run dev           # wrangler dev: local workerd, hot reload, local D1/KV/R2
```

Watchers: Wrangler watches `src/**` and reloads the isolate; tsc runs separately via `bun run typecheck --watch` if you want type errors live.

### Hot reload

- Wrangler reloads on save (~200 ms).
- Breaks when you change `wrangler.toml` (restart manually: Ctrl+C then `bun run dev`).
- Breaks when you change `drizzle.config.ts` or schema (run `bun run db:generate && bun run db:migrate:local`).

### Debugging

- **VS Code / Cursor**: use `.vscode/launch.json` "Wrangler Dev" config — attach to the Wrangler inspector on port 9229.
- **Chrome DevTools**: open `chrome://inspect`, click "inspect" on the wrangler target.
- **Inspect bindings at runtime**: `console.log(JSON.stringify(c.env, Object.keys(c.env)))` — secrets are redacted.

### Inspect data

- D1 (local): `bunx wrangler d1 execute DB --local --command "SELECT * FROM users"`
- D1 (remote): same with `--remote` (read-only by policy in this repo: write only via migrations).
- KV (local): `bunx wrangler kv key list --binding CACHE --local`
- R2 (local): `bunx wrangler r2 object list <bucket> --local`

### Pre-commit

```bash
bun run check        # biome check + tsc + vitest run
```

### Branch + commit

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).

---

## 6. Testing & Parallelization

### Commands

```bash
bun run test                  # vitest run (single shot)
bun run test:watch            # vitest --watch
bun run test path/to/file     # single file
bun run test -t "name"        # single test by name pattern
```

### Layout

- `test/*.test.ts` — integration tests using `SELF.fetch` (real Worker, real local D1).
- `test/unit/*.test.ts` — pure functions only.

### `vitest.config.ts` runs tests inside workerd via `@cloudflare/vitest-pool-workers`. Vitest 4.1+ required.

### Mocking rules

| Boundary | Rule |
|---|---|
| D1 | NEVER mock. Use local D1 with migrations applied. |
| KV | NEVER mock. Use local KV. |
| R2 | NEVER mock. Use local R2. |
| External HTTP (e.g. Stripe) | Mock at fetch adapter boundary using `vi.fn()` over a wrapper. |
| Time | `vi.useFakeTimers()` per test only. |
| Crypto | Never mock; Web Crypto is deterministic given inputs. |

### Coverage

Target: 80% lines, 75% branches on `src/**`. Measure: `bun run test --coverage`. CI fails below threshold.

### Parallelization for AI agents

Safe to fan out (disjoint files):
- "Add route X" + "Add route Y" + "Add Zod schema Z" — different files.
- "Write tests for route X" + "Write tests for route Y".

Must be sequential (shared file or generated artifact):
- Anything editing `wrangler.toml` (bindings).
- Anything editing `src/db/schema.ts` (must run `db:generate` after).
- Anything editing `package.json` (lockfile contention).
- `wrangler types` regen after binding changes.

---

## 7. Logging

### Init (`src/lib/logger.ts`)

```ts
export type Log = {
  level: "debug" | "info" | "warn" | "error";
  msg: string;
  request_id?: string;
  user_id?: string;
  module: string;
  event?: string;
  duration_ms?: number;
  err?: { name: string; message: string; stack?: string };
  [k: string]: unknown;
};

export function log(line: Log) {
  // Workers Logs ingests stdout; emit one JSON line per event.
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...line }));
}
```

### Levels

- `debug` — local only; gated behind `env.LOG_LEVEL`.
- `info` — request in/out, lifecycle events.
- `warn` — recoverable anomaly (4xx responses, retried fetches).
- `error` — handler threw, 5xx response, dependency failure.

### Required fields on every log line

`request_id`, `module`, `event`, plus `user_id` when authenticated.

### Sample lines

```json
{"ts":"2026-04-27T10:00:00Z","level":"info","module":"boot","event":"worker_init","msg":"Worker started"}
{"ts":"...","level":"info","module":"http","event":"req_in","request_id":"01J...","method":"POST","path":"/users"}
{"ts":"...","level":"info","module":"http","event":"req_out","request_id":"01J...","status":201,"duration_ms":42}
{"ts":"...","level":"error","module":"users","event":"create_failed","request_id":"01J...","err":{"name":"Error","message":"D1_ERROR: UNIQUE constraint"}}
{"ts":"...","level":"warn","module":"db","event":"slow_query","duration_ms":850,"sql":"SELECT ..."}
{"ts":"...","level":"info","module":"auth","event":"user_login","user_id":"u_123","request_id":"01J..."}
```

### Where logs land

- Dev: stdout (Wrangler tail).
- Prod: enable Workers Logs in dashboard. Sentry for errors via `@sentry/cloudflare`.

### Grep

```bash
bunx wrangler tail --format pretty
bunx wrangler tail --search "level\":\"error" --format json
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always set `compatibility_date` to today's date when bootstrapping; bump only with intent.
2. Always include `compatibility_flags = ["nodejs_compat"]` if any dep imports `node:` modules.
3. Always declare every binding (D1/KV/R2/secret) in `wrangler.toml` AND regenerate types: `bunx wrangler types`.
4. Always read env via the typed `Env` from `src/env.ts`; never `globalThis` access.
5. Always validate request input with Zod via `zValidator("json"|"query"|"param", schema)`.
6. Always use `c.req.valid("json")` to read validated data; never `await c.req.json()` after validation.
7. Always create the Drizzle client per request: `const db = drizzle(c.env.DB, { schema })`. Never module-scope a DB.
8. Always run `bun run db:generate` after editing `src/db/schema.ts`.
9. Always apply migrations locally before running tests: `bun run db:migrate:local`.
10. Always use `ctx.waitUntil(promise)` for fire-and-forget work; expect ≤30s budget.
11. Always return `Response` objects via Hono helpers (`c.json`, `c.text`); never `new Response` in handlers unless streaming.
12. Always pass `c.env` (not closure-captured env) to dependencies that need bindings.
13. Always pin secrets via `bunx wrangler secret put NAME`; commit only `.dev.vars.example`.
14. Always run `bun run check` (biome + tsc + vitest) before declaring a task done.
15. Always use `@hono/zod-validator` adapter; never call `schema.parse` directly in handlers.
16. Always use `c.var` for middleware-set context (typed via Hono generics).
17. Always declare `[env.production]` separately in `wrangler.toml` with its own bindings + vars.
18. Always update `worker-configuration.d.ts` (via `wrangler types`) when bindings change.
19. Always wrap external `fetch` calls in `lib/<service>.ts` adapters so tests can mock at one boundary.
20. Always emit one structured JSON log line per request via `lib/logger.ts`.
21. Always run `bun run typecheck` after editing any `.ts` file before committing.
22. Always `await` `db.transaction(...)` for multi-statement writes (D1 supports batched).
23. Always set `Cache-Control` and `ETag` on cacheable GET responses; let Workers Cache do its job.

### 8.2 NEVER

1. Never use Node-only APIs without `nodejs_compat` (no `fs`, no `child_process`, no native modules).
2. Never use Bun-specific APIs (`Bun.file`, `Bun.serve`) inside `src/**`; that code runs in workerd, not Bun.
3. Never `import` from `node:fs`, `node:net`, `node:os`, `node:child_process` — they don't exist on Workers.
4. Never destructure `ctx` (e.g. `const { waitUntil } = ctx`) — loses `this` binding, throws "Illegal invocation".
5. Never use the AWS S3 SDK to talk to R2 from inside a Worker; use the R2 binding directly.
6. Never call Cloudflare REST APIs from inside a Worker for resources you have a binding for (D1/KV/R2/Queues).
7. Never store secrets in `[vars]`; use `wrangler secret put`.
8. Never commit `.dev.vars`, `.wrangler/`, or `node_modules/`.
9. Never run `wrangler d1 migrations apply --remote` in a code change PR; that goes through the deploy pipeline.
10. Never bypass migrations with `drizzle-kit push` against production D1.
11. Never module-scope a Drizzle client — Workers reuse isolates across requests but `env` differs per env.
12. Never put long-running work outside `ctx.waitUntil`; the isolate may freeze after response.
13. Never exceed 30s in `waitUntil`; split into Queues/Cron for longer tasks.
14. Never throw raw `Error` to the client; map to `HTTPException` from `hono/http-exception`.
15. Never log full request bodies containing PII; log shapes/IDs only.
16. Never hardcode binding names in business code; reference `c.env.DB`, etc., typed via `Env`.
17. Never set `compatibility_flags = ["nodejs_compat_v2"]` arbitrarily — `nodejs_compat` is the canonical flag in 2026.
18. Never check secret values into git, even temporarily.
19. Never depend on global `crypto` polyfills; Workers ship Web Crypto natively.
20. Never disable type-checking in CI to "unblock" a deploy.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command | `bun install` → `bun run check` |
| `bun.lock` | reproducibility | `bun install --frozen-lockfile` |
| `tsconfig.json` | typecheck + build | `bun run typecheck` + `bun run build` |
| `wrangler.toml` | bindings, deploy, runtime | `bunx wrangler types` + `bun run check` + `bun run dev` smoke |
| `src/index.ts` | worker entry | `bun run dev` smoke + integration tests |
| `src/app.ts` | every route | Full integration test run |
| `src/env.ts` | every binding consumer | `bun run typecheck` |
| `src/db/schema.ts` | DB shape + types | `bun run db:generate` + `db:migrate:local` + tests |
| `drizzle/migrations/*.sql` | DB state | `wrangler d1 migrations apply DB --local` then tests |
| `src/middleware/auth.ts` | every protected route | Auth integration tests + manual JWT smoke |
| `src/middleware/logger.ts` | every request | Tail logs in dev, confirm JSON shape |
| `src/lib/jwt.ts` | auth correctness | Full auth test suite |
| `src/lib/errors.ts` | error responses | Error-mapping tests |
| `src/schemas/*.ts` | validated routes | Affected route tests |
| `vitest.config.ts` | test environment | `bun run test` clean run |
| `biome.json` | lint+format rules | `bun run check` |
| `drizzle.config.ts` | migration generation | `bun run db:generate` (no diff if schema unchanged) |
| `.github/workflows/deploy.yml` | CI/CD | push to a throwaway branch and inspect run |
| `.dev.vars` (local only) | local runtime | `bun run dev` smoke |
| `worker-configuration.d.ts` | type safety | `bun run typecheck` |
| `[env.production]` block | prod runtime | `bunx wrangler deploy --dry-run --env production` |
| `[triggers] crons` | scheduled handler | local cron simulation: `bunx wrangler dev --test-scheduled` |
| `compatibility_date` | runtime semantics | `bun run check` + manual smoke of affected APIs |

### 8.4 Definition of Done

**Bug fix**
- [ ] Failing test added that reproduces the bug
- [ ] Fix makes that test pass
- [ ] `bun run check` green
- [ ] No unrelated diff
- [ ] Tail logs in dev show no new errors

**New feature**
- [ ] Zod schema for input
- [ ] Hono route + handler
- [ ] Integration test via `SELF.fetch`
- [ ] Unit tests for any pure helpers
- [ ] `bun run check` green
- [ ] Manual `curl` smoke against `bun run dev`
- [ ] CLAUDE.md updated if new convention introduced

**Refactor**
- [ ] No behavior change
- [ ] All tests green before AND after
- [ ] No new dependencies unless justified in PR description
- [ ] `bun run check` green

**Dependency bump**
- [ ] Read changelog of bumped package
- [ ] `bun update <pkg>` (not `bun update`)
- [ ] `bun.lock` committed
- [ ] `bun run check` green
- [ ] Manual smoke if runtime-affecting

**Schema change**
- [ ] Edit `src/db/schema.ts`
- [ ] `bun run db:generate` (creates SQL in `drizzle/migrations/`)
- [ ] Review SQL by hand — drizzle-kit can drop columns silently
- [ ] `bun run db:migrate:local`
- [ ] Tests pass against new schema
- [ ] PR description includes the SQL diff

**Copy change**
- [ ] Edit string
- [ ] `bun run check`
- [ ] No test changes needed

### 8.5 Self-Verification Recipe

```bash
bun install --frozen-lockfile
bunx wrangler types
bun run typecheck
bun run lint
bun run db:migrate:local
bun run test
bun run dev &  # background
sleep 3
curl -fsS http://localhost:8787/health | grep -q '"ok":true'
kill %1
```

Expected outputs:
- `bun install`: `Done in <n>ms` and exit 0.
- `wrangler types`: regenerates `worker-configuration.d.ts` with no errors.
- `tsc --noEmit`: no output, exit 0.
- `biome check`: `Checked N files in <n>ms. No fixes applied.`
- `vitest run`: `Test Files  X passed (X)`, `Tests  Y passed (Y)`.
- curl health: `{"ok":true,...}`.

### 8.6 Parallelization Patterns

**Safe parallel subagents:**
- agent A writes `src/routes/users.ts`; agent B writes `src/routes/posts.ts`; agent C writes `src/schemas/users.ts`.
- agent A writes `test/users.test.ts`; agent B writes `test/posts.test.ts`.

**Must be sequential:**
- Anything editing `wrangler.toml` (one writer) → then `wrangler types` → then dependents.
- Anything editing `src/db/schema.ts` → then `db:generate` → then handlers using new tables.
- Anything editing `package.json`/`bun.lock` (one writer at a time).

---

## 9. Stack-Specific Pitfalls

1. **Destructuring `ctx`** — `const { waitUntil } = ctx` loses `this`, throws "Illegal invocation". *Fix:* call `ctx.waitUntil(promise)` directly. *Detect:* runtime exception in tail.
2. **Vitest pool injects `nodejs_compat` automatically** — tests pass even if `wrangler.toml` lacks the flag, then prod 500s. *Fix:* keep `compatibility_flags = ["nodejs_compat"]` in `wrangler.toml`. *Detect:* `wrangler deploy --dry-run` warning.
3. **Module-scoped Drizzle client** — captures one env; second deploy of `[env.production]` reuses the dev DB. *Fix:* construct `drizzle(c.env.DB)` per request. *Detect:* prod queries hit local DB.
4. **`Bun.serve` in `src/index.ts`** — Bun-only API; workerd doesn't have it. *Fix:* `export default { fetch: app.fetch }`. *Detect:* `wrangler dev` errors at boot.
5. **AWS S3 SDK against R2** — S3 SDK uses `DOMParser` which doesn't exist in Workers. *Fix:* use the R2 binding (`env.BUCKET.put`, `.get`). *Detect:* `ReferenceError: DOMParser is not defined`.
6. **30s `waitUntil` budget** — exceeded promise quietly cancelled. *Fix:* push to a Queue. *Detect:* truncated logs, missing side effects.
7. **`drizzle-kit push` to remote D1** — bypasses Wrangler's migration tracker, leaves it desynced. *Fix:* `drizzle-kit generate` then `wrangler d1 migrations apply`. *Detect:* `wrangler d1 migrations list` shows missing entries.
8. **Forgot `bunx wrangler types` after binding change** — `c.env.NEW_KV` is `any`, runtime works in dev but breaks lint and CI. *Fix:* run `wrangler types`, commit `worker-configuration.d.ts`. *Detect:* CI typecheck fails.
9. **D1 `UNIQUE` errors crash the request** — Drizzle throws, no mapping. *Fix:* catch and rethrow as `HTTPException(409)`. *Detect:* 500s in logs that should be 409.
10. **Cookie not set on cross-site response** — missing `SameSite=None; Secure`. *Fix:* set both for cross-origin auth. *Detect:* browser silently drops cookie.
11. **JWT secret rotated, in-flight tokens reject** — restart hits revocation path. *Fix:* keep two secrets and verify against both for a grace window. *Detect:* spike in 401s post-deploy.
12. **`ctx.passThroughOnException()`** misuse — silently masks bugs. *Fix:* don't use unless proxying upstream. *Detect:* errors not in logs.
13. **`compatibility_date` left at template default** — future Workers behavior surprises. *Fix:* set to today's date at bootstrap. *Detect:* `wrangler dev` warning banner.
14. **`bun add` adds to deps when it should be devDeps** — bloats Worker bundle. *Fix:* `bun add -D <pkg>` for build-time only. *Detect:* deploy size jumps.
15. **Drizzle relational queries with `with:` exceed D1's 100-row default join cap** — partial results returned silently. *Fix:* paginate explicitly; use `.limit()`. *Detect:* result counts < expected.
16. **`c.req.json()` after `zValidator`** — body already consumed, second read returns `{}`. *Fix:* always use `c.req.valid("json")`. *Detect:* handler sees empty body.
17. **`KV.put` with TTL < 60 seconds** — silently treated as 60s minimum. *Fix:* use `expirationTtl: 60` minimum or use Cache API for short TTLs. *Detect:* values live longer than expected.
18. **R2 multipart uploads in single request** — Worker has 100MB request body limit. *Fix:* presigned URLs for client-direct upload. *Detect:* 413 on large uploads.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Worker cold start | < 50 ms | `wrangler tail` + look at first request latency post-deploy |
| Bundle size (gzipped) | < 1 MB | `bunx wrangler deploy --dry-run --outdir dist && du -sh dist/*` |
| p50 request | < 30 ms | Workers Analytics dashboard |
| p99 request | < 200 ms | Workers Analytics dashboard |
| D1 query | < 50 ms p50 | Sentry D1 instrumentation |
| KV read | < 10 ms p50 | Workers Analytics |
| Memory | < 128 MB | Worker default; per-isolate |
| CPU time | < 50 ms wallclock per request | `wrangler tail` shows `cpuTime` |

When exceeded:
- Bundle: split into multiple Workers + Service Bindings; tree-shake imports.
- Latency: cache in Workers Cache; move to KV; add D1 indexes.
- CPU: avoid sync crypto, prefer Web Crypto; batch DB calls.

---

## 11. Security

- **Secrets:** `bunx wrangler secret put NAME` for prod; `.dev.vars` (gitignored) for local. Never `[vars]`.
- **Auth threat model:** JWT in `HttpOnly; Secure; SameSite=Lax` cookie. Same-site reads/writes only by default. CSRF-protected via SameSite + double-submit token for mutations from third-party origins.
- **Input validation boundary:** every route uses `zValidator`. No raw `c.req.json()` reaching DB.
- **Output escaping:** Hono auto-escapes JSON. Any HTML response uses `hono/jsx` (auto-escaped) — never string concat.
- **CORS:** `hono/cors` middleware with explicit allowlist. Default deny.
- **Permissions:** D1/KV/R2 bindings are scoped per-Worker. Use separate D1 per environment in `[env.production]`.
- **Audit:** `bun audit` in CI, weekly via Dependabot.
- **Top 5 risks:**
  1. Leaking secrets via `[vars]` instead of `secret put`.
  2. Forgetting `SameSite` on auth cookies → CSRF.
  3. SQL via raw template strings instead of Drizzle param binding.
  4. R2 public buckets containing PII.
  5. Logging full request bodies.

---

## 12. Deploy

### Release flow

```bash
# 1. Generate worker types (in case bindings changed)
bunx wrangler types

# 2. Verify
bun run check

# 3. Apply prod migrations (idempotent — wrangler tracks applied)
bunx wrangler d1 migrations apply DB --remote --env production

# 4. Deploy
bunx wrangler deploy --env production

# 5. Smoke
curl -fsS https://my-app.workers.dev/health
```

### Staging vs prod

`wrangler.toml` has `[env.staging]` and `[env.production]` with separate D1/KV/R2 IDs and secrets. Default deploy (no `--env`) targets staging.

### Rollback

```bash
bunx wrangler rollback --env production       # interactive: pick prior deployment
```

Max safe rollback window: last 10 deployments retained by Cloudflare.

### Health check

`GET /health` returns `{"ok":true,"version":"<git_sha>","compat":"2026-04-27"}`.

### Versioning

`package.json#version` (semver) + git tag. Worker reports `version` from build-time `process.env.GIT_SHA` injected via `--var`.

### DNS

`wrangler.toml` `routes` or use `*.workers.dev` subdomain. Custom domains via Cloudflare DNS — `bunx wrangler deployments list` shows attached routes.

### Cost

1k MAU on Workers Free tier: $0 (100k req/day free). Paid: $5/mo + $0.30/M requests + D1 reads/writes per pricing page.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```md
# CLAUDE.md — Hono + Bun + Cloudflare Workers

This project follows /opt/Loopa/rulebooks/hono-bun.md. Read that first.

## Stack
- Hono 4 on Cloudflare Workers (workerd)
- Bun 1.3 toolchain, Wrangler 4 deploy
- Drizzle 0.45 + D1, R2, KV
- Zod 4 + @hono/zod-validator, Vitest 4.1

## Key commands
- `bun run dev` — start wrangler dev
- `bun run check` — biome + tsc + vitest (run before declaring done)
- `bun run db:generate` — after schema edits
- `bun run db:migrate:local` — apply local migrations
- `bunx wrangler types` — regen types after binding changes
- `bunx wrangler deploy --env production` — release

## Banned patterns
- `node:fs`, `node:child_process`, any Node filesystem APIs
- `Bun.serve`, `Bun.file` inside `src/**`
- AWS S3 SDK pointed at R2
- Module-scoped Drizzle client
- `c.req.json()` after `zValidator` (use `c.req.valid("json")`)
- Destructuring `ctx` (use `ctx.waitUntil(...)`)
- Storing secrets in `[vars]`
- Committing `.dev.vars` or `.wrangler/`

## Always
- Validate input with Zod via `zValidator`
- Construct `drizzle(c.env.DB)` per request
- `ctx.waitUntil(promise)` for fire-and-forget
- Run `bun run check` before saying done
- Update `worker-configuration.d.ts` after binding changes via `wrangler types`

## Skills to use
- `/test-driven-development` — write the failing Vitest test first
- `/systematic-debugging` — for prod errors observed in Workers Logs
- `/verification-before-completion` — do not claim "done" without `bun run check` output
- `/ship` — release flow
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(bun:*)",
      "Bash(bunx:*)",
      "Bash(wrangler:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(curl http://localhost:*)",
      "Bash(curl -fsS http://localhost:*)",
      "Bash(lsof -i :*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bunx biome format --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "echo \"$CLAUDE_TOOL_INPUT\" | grep -E 'wrangler deploy|d1 migrations apply.*--remote' && echo 'BLOCKED: prod write needs explicit confirmation' >&2 && exit 2 || exit 0" }
        ]
      }
    ],
    "Stop": [
      { "type": "command", "command": "bun run check 2>&1 | tail -20" }
    ]
  }
}
```

### Slash commands

- `/ship` — runs full check, opens PR, monitors deploy
- `/qa` — boots `bun run dev` and curls all routes
- `/investigate` — for prod errors

---

## 14. Codex Integration

### `AGENTS.md`

```md
# AGENTS.md — Hono + Bun + Cloudflare Workers

Authoritative rulebook: /opt/Loopa/rulebooks/hono-bun.md. Follow it.

## Decisions (already locked)
- Language: TypeScript 6
- Runtime: Cloudflare Workers (workerd)
- Toolchain: Bun 1.3
- Framework: Hono 4
- DB: D1 + Drizzle
- Validation: Zod 4 + @hono/zod-validator
- Tests: Vitest 4.1 + @cloudflare/vitest-pool-workers
- Lint: Biome 2.4

## Workflow
1. Read existing `src/`, `wrangler.toml`, `src/db/schema.ts`.
2. Add or edit code.
3. If schema changed: `bun run db:generate && bun run db:migrate:local`.
4. If bindings changed: `bunx wrangler types`.
5. Run `bun run check`.
6. Manual smoke against `bun run dev`.

## Banned
- `node:fs`, `Bun.serve` in src/, AWS S3 SDK on R2, module-scoped Drizzle client.

## Commands
- `bun run dev | check | test | typecheck | lint | db:generate | db:migrate:local | build`
```

### `.codex/config.toml`

```toml
[agent]
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_mode = "on-request"

[agent.tools]
bash = true
edit = true

[bash]
allowlist = [
  "bun",
  "bunx",
  "wrangler",
  "git status",
  "git diff",
  "git log",
  "curl http://localhost:8787",
]

[bash.deny]
patterns = [
  "wrangler deploy --env production",
  "wrangler d1 migrations apply.*--remote",
  "rm -rf",
]
```

### Codex differs from Claude Code by

- Smaller context window — reference `hono-bun.md` per section, not all at once.
- Less aggressive parallelism — be explicit about subagent fan-out.
- Compensate by writing tighter prompts that name files and commands.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Hono + Bun + Cloudflare Workers

## ALWAYS
- Validate request input with Zod via @hono/zod-validator zValidator
- Read validated body via c.req.valid("json"), never c.req.json() after validation
- Construct drizzle(c.env.DB) per request — never module-scope
- Use ctx.waitUntil(promise) for fire-and-forget
- Run `bun run check` before claiming a task complete
- Regenerate types after binding changes: `bunx wrangler types`
- Generate Drizzle migrations after schema edits: `bun run db:generate`
- Apply migrations locally before tests: `bun run db:migrate:local`
- Use HTTPException from hono/http-exception for client-visible errors
- Set compatibility_date to today on new projects

## NEVER
- Import from node:fs, node:child_process, node:net (not in Workers)
- Use Bun.serve, Bun.file inside src/** (workerd, not Bun)
- Use AWS S3 SDK against R2 (DOMParser missing) — use the R2 binding
- Destructure ctx (loses this binding)
- Store secrets in [vars] (use `wrangler secret put`)
- Use drizzle-kit push against remote D1 (use migrations)
- Module-scope a Drizzle client
- Commit .dev.vars or .wrangler/
- Throw raw Error to clients (map to HTTPException)
- Disable typecheck in CI

## File map
- Routes → src/routes/<resource>.ts (mounted in src/app.ts)
- Schemas → src/schemas/<resource>.ts
- DB tables → src/db/schema.ts
- Queries → src/db/queries/<resource>.ts
- Middleware → src/middleware/<name>.ts
- Bindings → wrangler.toml + run `wrangler types`
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "cloudflare.vscode-cloudflare-workers",
    "oven.bun-vscode",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Wrangler Dev (attach)",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "cwd": "${workspaceFolder}",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Vitest current file",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["x", "vitest", "run", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create files in order. After last file, `git push` yields a deployable hello-world.

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wrangler dev",
    "build": "wrangler deploy --dry-run --outdir dist",
    "deploy": "wrangler deploy --env production",
    "deploy:staging": "wrangler deploy --env staging",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "check": "biome check . && tsc --noEmit && vitest run",
    "db:generate": "drizzle-kit generate",
    "db:migrate:local": "wrangler d1 migrations apply DB --local",
    "db:migrate:prod": "wrangler d1 migrations apply DB --remote --env production",
    "db:studio": "drizzle-kit studio",
    "cf-typegen": "wrangler types"
  },
  "dependencies": {
    "hono": "4.12.14",
    "@hono/zod-validator": "0.5.0",
    "zod": "4.3.6",
    "drizzle-orm": "0.45.0",
    "@sentry/cloudflare": "latest"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.0",
    "@cloudflare/vitest-pool-workers": "latest",
    "@cloudflare/workers-types": "latest",
    "drizzle-kit": "0.31.0",
    "typescript": "6.0.3",
    "vitest": "4.1.5",
    "wrangler": "4.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types/2023-07-01", "./worker-configuration.d.ts"],
    "jsx": "react-jsx",
    "jsxImportSource": "hono/jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowJs": false,
    "noEmit": true,
    "outDir": "dist"
  },
  "include": ["src/**/*", "test/**/*", "drizzle.config.ts", "vitest.config.ts", "worker-configuration.d.ts"],
  "exclude": ["node_modules", "dist", ".wrangler"]
}
```

### `wrangler.toml`

```toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2026-04-27"
compatibility_flags = ["nodejs_compat"]
workers_dev = true

[observability]
enabled = true

[vars]
LOG_LEVEL = "info"
APP_ENV = "dev"

[[d1_databases]]
binding = "DB"
database_name = "my-app-dev"
database_id = "REPLACE_WITH_LOCAL_OR_DEV_ID"
migrations_dir = "drizzle/migrations"

[[kv_namespaces]]
binding = "CACHE"
id = "REPLACE_WITH_KV_ID"

[[r2_buckets]]
binding = "BUCKET"
bucket_name = "my-app-dev"

[triggers]
crons = []

# ---- staging ----
[env.staging]
name = "my-app-staging"

[env.staging.vars]
LOG_LEVEL = "info"
APP_ENV = "staging"

[[env.staging.d1_databases]]
binding = "DB"
database_name = "my-app-staging"
database_id = "REPLACE_WITH_STAGING_ID"
migrations_dir = "drizzle/migrations"

[[env.staging.kv_namespaces]]
binding = "CACHE"
id = "REPLACE_WITH_STAGING_KV_ID"

[[env.staging.r2_buckets]]
binding = "BUCKET"
bucket_name = "my-app-staging"

# ---- production ----
[env.production]
name = "my-app-production"
routes = [{ pattern = "api.example.com/*", zone_name = "example.com" }]

[env.production.vars]
LOG_LEVEL = "warn"
APP_ENV = "production"

[[env.production.d1_databases]]
binding = "DB"
database_name = "my-app-production"
database_id = "REPLACE_WITH_PROD_ID"
migrations_dir = "drizzle/migrations"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "REPLACE_WITH_PROD_KV_ID"

[[env.production.r2_buckets]]
binding = "BUCKET"
bucket_name = "my-app-production"
```

### `drizzle.config.ts`

```ts
import type { Config } from "drizzle-kit";

export default {
  schema: "./src/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "sqlite",
  driver: "d1-http",
  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },
} satisfies Config;
```

### `vitest.config.ts`

```ts
import { defineWorkersConfig } from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersConfig({
  test: {
    poolOptions: {
      workers: {
        wrangler: { configPath: "./wrangler.toml" },
        miniflare: {
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
    coverage: {
      provider: "istanbul",
      include: ["src/**"],
      thresholds: { lines: 80, branches: 75, functions: 80, statements: 80 },
    },
  },
});
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "files": {
    "ignore": ["dist", ".wrangler", "drizzle/migrations", "worker-configuration.d.ts", "node_modules"]
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedVariables": "error", "noUnusedImports": "error" },
      "style": { "useConst": "error", "noNonNullAssertion": "warn" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always", "trailingCommas": "all" } }
}
```

### `src/env.ts`

```ts
export type Env = {
  DB: D1Database;
  CACHE: KVNamespace;
  BUCKET: R2Bucket;
  JWT_SECRET: string;
  SENTRY_DSN?: string;
  LOG_LEVEL: "debug" | "info" | "warn" | "error";
  APP_ENV: "dev" | "staging" | "production";
};

export type Variables = {
  requestId: string;
  userId?: string;
};

export type AppContext = {
  Bindings: Env;
  Variables: Variables;
};
```

### `src/db/schema.ts`

```ts
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
```

### `src/db/client.ts`

```ts
import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";
import type { Env } from "../env";

export function getDb(env: Env) {
  return drizzle(env.DB, { schema });
}

export type Db = ReturnType<typeof getDb>;
```

### `src/lib/logger.ts`

```ts
type Level = "debug" | "info" | "warn" | "error";

export function log(line: { level: Level; module: string; event: string; msg?: string; [k: string]: unknown }) {
  console.log(JSON.stringify({ ts: new Date().toISOString(), ...line }));
}
```

### `src/middleware/logger.ts`

```ts
import type { MiddlewareHandler } from "hono";
import { log } from "../lib/logger";
import type { AppContext } from "../env";

export const requestLogger: MiddlewareHandler<AppContext> = async (c, next) => {
  const requestId = crypto.randomUUID();
  c.set("requestId", requestId);
  const start = Date.now();
  log({ level: "info", module: "http", event: "req_in", request_id: requestId, method: c.req.method, path: c.req.path });
  await next();
  log({
    level: "info",
    module: "http",
    event: "req_out",
    request_id: requestId,
    status: c.res.status,
    duration_ms: Date.now() - start,
  });
};
```

### `src/middleware/error.ts`

```ts
import { HTTPException } from "hono/http-exception";
import type { ErrorHandler } from "hono";
import { log } from "../lib/logger";
import type { AppContext } from "../env";

export const errorHandler: ErrorHandler<AppContext> = (err, c) => {
  if (err instanceof HTTPException) {
    return err.getResponse();
  }
  log({
    level: "error",
    module: "http",
    event: "unhandled",
    request_id: c.get("requestId"),
    err: { name: err.name, message: err.message, stack: err.stack },
  });
  return c.json({ error: "internal_error" }, 500);
};
```

### `src/routes/health.ts`

```ts
import { Hono } from "hono";
import type { AppContext } from "../env";

const health = new Hono<AppContext>();

health.get("/", (c) =>
  c.json({
    ok: true,
    env: c.env.APP_ENV,
    compat: "2026-04-27",
  }),
);

export default health;
```

### `src/routes/users.ts`

```ts
import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { HTTPException } from "hono/http-exception";
import { getDb } from "../db/client";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import type { AppContext } from "../env";

const CreateUserSchema = z.object({
  email: z.email(),
  password: z.string().min(12),
});

const usersRouter = new Hono<AppContext>();

usersRouter.post("/", zValidator("json", CreateUserSchema), async (c) => {
  const { email, password } = c.req.valid("json");
  const db = getDb(c.env);
  const passwordHash = await hashPassword(password);
  const id = crypto.randomUUID();
  try {
    await db.insert(users).values({ id, email, passwordHash, createdAt: new Date() });
  } catch (e) {
    if (String(e).includes("UNIQUE")) throw new HTTPException(409, { message: "email_taken" });
    throw e;
  }
  return c.json({ id, email }, 201);
});

usersRouter.get("/:id", async (c) => {
  const db = getDb(c.env);
  const row = await db.select().from(users).where(eq(users.id, c.req.param("id"))).get();
  if (!row) throw new HTTPException(404, { message: "not_found" });
  return c.json({ id: row.id, email: row.email });
});

async function hashPassword(pw: string) {
  const enc = new TextEncoder().encode(pw);
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc, { name: "PBKDF2" }, false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    key,
    256,
  );
  return `${btoa(String.fromCharCode(...salt))}:${btoa(String.fromCharCode(...new Uint8Array(bits)))}`;
}

export default usersRouter;
```

### `src/app.ts`

```ts
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestLogger } from "./middleware/logger";
import { errorHandler } from "./middleware/error";
import health from "./routes/health";
import users from "./routes/users";
import type { AppContext } from "./env";

export function createApp() {
  const app = new Hono<AppContext>();
  app.use("*", requestLogger);
  app.use("*", cors({ origin: "*", credentials: false }));
  app.route("/health", health);
  app.route("/users", users);
  app.onError(errorHandler);
  return app;
}
```

### `src/index.ts`

```ts
import { createApp } from "./app";
import type { Env } from "./env";

const app = createApp();

export default {
  fetch: app.fetch,
} satisfies ExportedHandler<Env>;
```

### `test/health.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("health", () => {
  it("returns ok", async () => {
    const res = await SELF.fetch("https://example.com/health");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean };
    expect(body.ok).toBe(true);
  });
});
```

### `test/users.test.ts`

```ts
import { describe, it, expect } from "vitest";
import { SELF } from "cloudflare:test";

describe("users", () => {
  it("creates a user", async () => {
    const res = await SELF.fetch("https://example.com/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: `u${Date.now()}@x.test`, password: "supersecure-1234" }),
    });
    expect(res.status).toBe(201);
  });

  it("rejects bad input", async () => {
    const res = await SELF.fetch("https://example.com/users", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "not-an-email", password: "x" }),
    });
    expect(res.status).toBe(400);
  });
});
```

### `.dev.vars.example`

```
JWT_SECRET=replace-me-with-32-byte-hex
SENTRY_DSN=
```

### `.gitignore`

```
node_modules
dist
.wrangler
.dev.vars
.env
*.log
worker-configuration.d.ts
```

### `.github/workflows/deploy.yml`

```yaml
name: deploy
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.11
      - run: bun install --frozen-lockfile
      - run: bunx wrangler types
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test

  deploy-staging:
    if: github.ref == 'refs/heads/main'
    needs: check
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with:
          bun-version: 1.3.11
      - run: bun install --frozen-lockfile
      - run: bunx wrangler d1 migrations apply DB --remote --env staging
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
      - uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env staging
```

### `README.md`

```md
# my-app

Hono on Cloudflare Workers. See `/opt/Loopa/rulebooks/hono-bun.md` for full conventions.

## Develop
- `bun install`
- `cp .dev.vars.example .dev.vars` and fill in
- `bun run db:migrate:local`
- `bun run dev`

## Deploy
- `bun run deploy` (production)
```

### Bootstrap commands after files exist

```bash
bun install
bunx wrangler d1 create my-app-dev          # paste returned id into wrangler.toml
bunx wrangler kv namespace create CACHE     # paste id
bunx wrangler r2 bucket create my-app-dev
bunx wrangler types
bun run db:generate
bun run db:migrate:local
bun run check
git init && git add . && git commit -m "feat: initial scaffold"
```

---

## 17. Idea → MVP Path

`PROJECT_IDEA` is blank — this is a generic CRUD-API plan adaptable to any domain.

**Phase 1 — Schema** (1 session, ~6 files)
- Edit `src/db/schema.ts` to add 3-5 domain tables.
- `bun run db:generate`, review SQL, `bun run db:migrate:local`.
- Exit: `select * from <table>` works locally.

**Phase 2 — Backbone** (1-2 sessions)
- Add one router file per resource under `src/routes/`.
- Wire them in `src/app.ts`.
- Add Zod schemas per resource.
- Exit: every endpoint returns 200 (with empty data) or 4xx for invalid input.

**Phase 3 — Vertical slice** (2 sessions)
- Pick one core resource. Implement CRUD end-to-end with tests.
- Exit: integration tests cover create, read, update, delete, validation, 404, 409.

**Phase 4 — Auth + multi-user** (1-2 sessions)
- `src/routes/auth.ts` with signup/login. Issue JWT cookie.
- `src/middleware/auth.ts` enforcing JWT on protected routers.
- Per-user filtering on resource queries.
- Exit: another user's data is not readable.

**Phase 5 — Ship + monitor** (1 session)
- Create staging + prod D1, KV, R2 (commands in §16).
- Push secrets via `wrangler secret put`.
- Deploy to staging, smoke, deploy to production.
- Wire Sentry.
- Exit: prod URL responds; one synthetic error appears in Sentry.

---

## 18. Feature Recipes

### 18.1 Authentication (email/password + JWT)

Files: `src/routes/auth.ts`, `src/middleware/auth.ts`, `src/lib/jwt.ts`.

```ts
// src/lib/jwt.ts
import { sign, verify } from "hono/jwt";
export const signSession = (sub: string, secret: string) =>
  sign({ sub, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7 }, secret);
export const verifySession = (token: string, secret: string) => verify(token, secret);
```

```ts
// src/middleware/auth.ts
import { jwt } from "hono/jwt";
import type { MiddlewareHandler } from "hono";
import type { AppContext } from "../env";

export const requireAuth: MiddlewareHandler<AppContext> = async (c, next) => {
  const m = jwt({ secret: c.env.JWT_SECRET, cookie: "session" });
  return m(c, next);
};
```

### 18.2 File upload via R2

```ts
app.put("/files/:key", async (c) => {
  const key = c.req.param("key");
  const body = c.req.raw.body;
  if (!body) throw new HTTPException(400);
  await c.env.BUCKET.put(key, body, { httpMetadata: { contentType: c.req.header("content-type") ?? "application/octet-stream" } });
  return c.json({ key });
});
```

### 18.3 Stripe webhooks

`bun add stripe`. Verify signature using Web Crypto (Stripe SDK's `constructEventAsync`):

```ts
import Stripe from "stripe";
app.post("/stripe/webhook", async (c) => {
  const stripe = new Stripe(c.env.STRIPE_SECRET, { httpClient: Stripe.createFetchHttpClient() });
  const sig = c.req.header("stripe-signature")!;
  const body = await c.req.text();
  const event = await stripe.webhooks.constructEventAsync(body, sig, c.env.STRIPE_WEBHOOK_SECRET);
  c.executionCtx.waitUntil(handleStripeEvent(c.env, event));
  return c.json({ received: true });
});
```

### 18.4 Cron (scheduled handler)

`wrangler.toml`:
```toml
[triggers]
crons = ["0 3 * * *"]
```

`src/index.ts`:
```ts
export default {
  fetch: app.fetch,
  scheduled: async (event, env, ctx) => {
    ctx.waitUntil(runDailyCleanup(env));
  },
} satisfies ExportedHandler<Env>;
```

### 18.5 Realtime via Server-Sent Events

```ts
import { stream } from "hono/streaming";
app.get("/events", (c) =>
  stream(c, async (s) => {
    s.writeSSE({ data: "hello" });
    while (!s.aborted) {
      await s.sleep(1000);
      s.writeSSE({ data: String(Date.now()) });
    }
  }),
);
```

### 18.6 Search (D1 FTS5)

Add a virtual table in a migration:
```sql
CREATE VIRTUAL TABLE notes_fts USING fts5(title, body, content='notes', content_rowid='rowid');
```
Query via raw SQL: `db.run(sql\`SELECT * FROM notes_fts WHERE notes_fts MATCH ${query}\`)`.

### 18.7 Caching with KV

```ts
const cached = await c.env.CACHE.get(key, "json");
if (cached) return c.json(cached);
const fresh = await compute();
c.executionCtx.waitUntil(c.env.CACHE.put(key, JSON.stringify(fresh), { expirationTtl: 60 }));
return c.json(fresh);
```

### 18.8 i18n

`bun add @intlify/core-base`. Detect via `Accept-Language` in middleware; set `c.set("locale", ...)`.

### 18.9 Analytics events (Workers Analytics Engine)

`wrangler.toml`:
```toml
[[analytics_engine_datasets]]
binding = "ANALYTICS"
```
```ts
c.env.ANALYTICS.writeDataPoint({ blobs: [c.req.path], doubles: [Date.now()], indexes: [c.get("requestId")] });
```

### 18.10 Sentry

```ts
import * as Sentry from "@sentry/cloudflare";
export default Sentry.withSentry(
  (env: Env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1 }),
  { fetch: app.fetch } satisfies ExportedHandler<Env>,
);
```

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Error: Couldn't find a Worker named` | Create it: `bunx wrangler deploy --dry-run` once with name set. |
| `Authentication required` | `bunx wrangler login` |
| `D1_ERROR: no such table: X` | `bun run db:migrate:local` |
| `D1_ERROR: UNIQUE constraint failed` | Map to 409 in handler. |
| `Illegal invocation` on `waitUntil` | Don't destructure `ctx`; call `ctx.waitUntil(...)`. |
| `ReferenceError: DOMParser is not defined` | Stop using AWS S3 SDK; use the R2 binding. |
| `nodejs_compat is required` | Add to `compatibility_flags`. |
| `Cannot find module 'cloudflare:test'` | Install `@cloudflare/vitest-pool-workers`; reference in `vitest.config.ts`. |
| `Cannot find module 'cloudflare:workers'` | `bun add -D @cloudflare/workers-types` and add to tsconfig types. |
| `wrangler types` writes nothing | Confirm bindings exist in `wrangler.toml`. |
| `bun: command not found` | Re-run install script; restart shell. |
| `EADDRINUSE :::8787` | `lsof -ti :8787 | xargs kill -9` |
| `Error 1001` on prod fetch | Custom domain not yet attached; wait or check DNS. |
| `c.req.json is not a function` after validator | Use `c.req.valid("json")`. |
| `Error: tests must be inside test files` | Vitest expects `.test.ts` extension. |
| Vitest hangs forever | Local D1 not migrated; run `db:migrate:local` first. |
| `Error: KV PUT failed: TTL too short` | Minimum `expirationTtl` is 60. |
| `Error: R2 object too large` | Worker request body cap; use multipart presigned URL. |
| `Module "node:net" has no default export` | Don't import it; not in Workers. |
| Compatibility warning at deploy | Bump `compatibility_date`. |
| `JWT verification failed` | Cookie name mismatch (`session` vs `Authorization`). |
| `Drizzle: db is not defined` | Module-scoped Drizzle; move into handler. |
| `Cannot read properties of undefined (env)` | Access via `c.env`, not import-time. |
| `wrangler dev` blank page | Hit `/`, not the bundler URL; routes start at `/health` here. |
| `Error: TypeScript version not supported` | Bump to `typescript@6.0.3`. |
| `Biome: file ignored by config` | Path matches `files.ignore`. |
| `Vitest: pool not found "@cloudflare/vitest-pool-workers"` | Install it; ensure Vitest 4.1+. |
| Migration files missing in deploy | `migrations_dir` in `[env.production]` block missing. |
| `Error: D1 database <id> not found` | DB ID for the env in `wrangler.toml` mismatched; recreate or fix. |
| `wrangler deploy` skipped due to no changes | Touch a source file to force redeploy. |
| `Error: SyntaxError: Unexpected token` in tests | Vitest needs ESM-only; check `tsconfig` `module: ESNext`. |

---

## 20. Glossary

- **Worker** — One unit of code Cloudflare runs at the edge. Like a function that handles HTTP requests.
- **workerd** — The open-source runtime that executes Workers. Local dev uses it via Wrangler.
- **Wrangler** — The CLI that deploys, configures, and runs Workers.
- **Binding** — A typed reference inside a Worker to a Cloudflare resource (D1, KV, R2, secret). No network hop.
- **D1** — Cloudflare's edge SQLite database.
- **R2** — Cloudflare's S3-compatible object storage.
- **KV** — Cloudflare's eventually-consistent key-value store.
- **Hono** — The web framework. Tiny, fast, Web Standards-based.
- **Bun** — A JavaScript runtime + package manager + bundler. Used here as toolchain, not as the production runtime.
- **Drizzle** — A TypeScript ORM. Generates SQL; stays close to the database.
- **drizzle-kit** — Drizzle's CLI for generating migration SQL from schema.
- **Zod** — A schema validation library for runtime input checking.
- **Vitest** — A test runner.
- **Miniflare** — Local Workers simulator inside Wrangler dev.
- **Compatibility date** — Pins which version of the workerd runtime semantics your Worker uses.
- **Compatibility flag** — Opt-in feature toggles (e.g., `nodejs_compat` enables Node API polyfills).
- **JWT** — JSON Web Token; signed token used for stateless auth.
- **CORS** — Cross-Origin Resource Sharing; HTTP headers letting browsers call APIs cross-domain.
- **CSRF** — An attack where a malicious site triggers actions on a logged-in user's session.
- **Service Binding** — A direct in-process call from one Worker to another.
- **Durable Object** — A Cloudflare primitive for strongly-consistent stateful objects (not used in this default stack).
- **Queue** — A Cloudflare async message queue for background work.
- **Cron Trigger** — A schedule that invokes a Worker's `scheduled` handler.
- **`waitUntil`** — Tells the Worker runtime to keep running a promise after the response is sent, up to ~30s.
- **`SELF.fetch`** — In Vitest pool-workers, calls the Worker under test.
- **Edge** — Cloudflare's network of ~300 cities; your code runs near the user.
- **Isolate** — A V8 sandbox; Workers reuse isolates across requests.
- **Migration** — A versioned SQL change to your database schema.

---

## 21. Update Cadence

- This rulebook is valid for: Hono 4.12.x, Bun 1.3.x, TypeScript 6.0.x, Drizzle 0.45.x, Wrangler 4.x, Zod 4.3.x, Vitest 4.1.x, Biome 2.4.x.
- Re-run the generator when:
  - Major version bump on any pinned lib.
  - `compatibility_date` falls behind by > 6 months.
  - Cloudflare introduces a new binding type used by the project.
  - Security advisory affecting any pinned lib.
- Date stamp: **2026-04-27**.
