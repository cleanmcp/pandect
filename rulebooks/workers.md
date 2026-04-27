# Cloudflare Workers Rulebook

> Bare Cloudflare Workers (TypeScript, no framework — `itty-router` + native `fetch` handler) on the Workers runtime, with D1, KV, R2, Queues, Durable Objects (RPC + SQLite storage), Wrangler, Vitest via `@cloudflare/vitest-pool-workers`, and Zod 4. One file. Pasteable. Build, test, deploy.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 | First-class types, Worker types via `wrangler types` |
| Runtime + version | workerd (Workers runtime), Node 22 LTS for tooling | Production runtime; tooling needs Node |
| Package manager | pnpm 9 | Fast, strict, monorepo-ready, default lockfile |
| Build tool | Wrangler 4 (esbuild internal) | Official, knows bindings, no external bundler |
| HTTP router | `itty-router` 5 | 970-byte router built for Workers |
| State (in-memory) | Per-request closures + Durable Objects | Workers are stateless; DO holds state |
| Routing/Nav | itty-router URL routing | Drop-in for `fetch` handler |
| Data layer (db + orm) | D1 + raw SQL via `env.DB.prepare()` | First-party SQLite-on-edge; no ORM tax |
| Auth | Lucia-style sessions in KV + bcryptjs | KV is fast for session reads |
| Styling | N/A (API-only stack) | This rulebook is server-only |
| Forms + validation | Zod 4 schemas at route boundary | Single source of truth for input shape |
| Unit test runner | Vitest 4 + `@cloudflare/vitest-pool-workers` 0.14 | Runs inside workerd, real bindings |
| E2E framework | Vitest integration tests with `SELF.fetch` | Same pool, parallel by default |
| Mocking strategy | Mock external HTTP at `fetch` adapter; never mock D1/KV/R2 | Miniflare provides real bindings |
| Logger | `console.log` with structured JSON | Workers Logs ingests structured fields |
| Error tracking | `@sentry/cloudflare` `withSentry` | Official, supports DO + scheduled |
| Lint + format | Biome 2.4 | One binary, 10x faster, Workers-compatible |
| Type checking | `tsc --noEmit` | Authoritative, run in CI |
| Env vars + secrets | `.dev.vars` (local), `wrangler secret put` (prod) | Official two-tier split |
| CI provider | GitHub Actions | Free, ubiquitous, official action exists |
| Deploy target | Cloudflare Workers (`wrangler deploy`) | Single command, one binary |
| Release flow | Git tag → CI → `wrangler deploy` | Versioned, gradual rollout supported |
| Auto-update | Workers auto-deploy on push to main | No client to update |
| KV | Cloudflare KV namespace via binding | Edge-cached config + sessions |
| Object storage | R2 bucket via binding | S3-compatible, zero egress |
| Queue | Cloudflare Queues (producers + consumers) | Native binding, batched |
| Stateful primitive | Durable Objects (SQLite-backed) | Strong consistency, RPC, alarms |
| DB driver to external SQL | Hyperdrive (when external Postgres/MySQL) | Edge connection pool, smart placement |
| Compatibility flag | `nodejs_compat` + `compatibility_date = "2026-04-27"` | Required for `node:crypto`, `node:buffer` |
| Observability | Workers Logs (built-in) + `wrangler tail` | Default-on, no extra setup |

### Versions Table (researched 2026-04-27)

| Library | Version | Released | Source |
|---|---|---|---|
| `wrangler` | `4.79.0` | 2026-04 | [github.com/cloudflare/workers-sdk](https://github.com/cloudflare/workers-sdk/releases) |
| `@cloudflare/vitest-pool-workers` | `0.14.7` | 2026-04 | [npm](https://www.npmjs.com/package/@cloudflare/vitest-pool-workers) |
| `vitest` | `4.1.0` | 2026-Q1 | [npm](https://www.npmjs.com/package/vitest) |
| `itty-router` | `5.0.18` | 2026-02 | [itty.dev](https://itty.dev/itty-router/) |
| `zod` | `4.3.6` | 2026-04 | [zod.dev](https://zod.dev/) |
| `@sentry/cloudflare` | `9.x` | 2026-Q1 | [npm](https://www.npmjs.com/package/@sentry/cloudflare) |
| `@biomejs/biome` | `2.4.x` | 2026-02 | [biomejs.dev](https://biomejs.dev/) |
| `typescript` | `5.7.x` | 2024-11 | [typescriptlang.org](https://www.typescriptlang.org/) |
| `bcryptjs` | `2.4.x` | stable | [npm](https://www.npmjs.com/package/bcryptjs) |
| `cloudflare/wrangler-action` | `v3` | 2026 | [github.com/cloudflare/wrangler-action](https://github.com/cloudflare/wrangler-action) |
| Compat date | `2026-04-27` | today | [Compatibility Dates](https://developers.cloudflare.com/workers/configuration/compatibility-dates/) |

### Minimum Host Requirements

- macOS 13+, Windows 11, or Linux (Ubuntu 22.04+).
- Node.js 22.12 LTS or newer (Workers runtime is workerd; Node is for tooling only).
- 4 GB RAM, 5 GB disk.
- Cloudflare account (free tier is enough to get started).

### Cold-Start Time

From `git clone` to `curl localhost:8787` returning 200 OK on a fresh machine: **~3 minutes** (Node install + `pnpm install` + `wrangler dev`).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Homebrew (skip if installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Node 22 LTS + pnpm
brew install node@22
brew install pnpm
brew install gh   # GitHub CLI for repo creation

# 3. Cloudflare account (browser): https://dash.cloudflare.com/sign-up

# 4. Wrangler login (opens browser, approves OAuth scope)
pnpm dlx wrangler@4 login

# 5. Bootstrap project
pnpm create cloudflare@latest my-app -- --type=hello-world --ts --no-deploy --no-git
cd my-app
pnpm install

# 6. Run
pnpm wrangler dev
```

Expected first-run output:

```
 ⛅️ wrangler 4.79.0
-------------------
[wrangler:info] Ready on http://127.0.0.1:8787
```

### Windows (PowerShell, run as Administrator first time)

```powershell
# 1. winget Node + pnpm + GitHub CLI
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm
winget install GitHub.cli

# 2. Restart PowerShell so PATH refreshes

# 3. Wrangler login
pnpm dlx wrangler@4 login

# 4. Bootstrap
pnpm create cloudflare@latest my-app -- --type=hello-world --ts --no-deploy --no-git
cd my-app
pnpm install
pnpm wrangler dev
```

### Linux (Ubuntu/Debian)

```bash
# 1. Node 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pnpm

# 2. GitHub CLI
sudo apt install gh -y

# 3. Wrangler login
pnpm dlx wrangler@4 login

# 4. Bootstrap (same as macOS)
pnpm create cloudflare@latest my-app -- --type=hello-world --ts --no-deploy --no-git
cd my-app
pnpm install
pnpm wrangler dev
```

### Accounts To Create

| Service | URL | Why |
|---|---|---|
| Cloudflare | https://dash.cloudflare.com/sign-up | Workers + bindings |
| GitHub | https://github.com/signup | Source + CI |
| Sentry (optional) | https://sentry.io/signup/ | Error tracking |

### Common First-Run Errors

| Error | Fix |
|---|---|
| `command not found: wrangler` | Use `pnpm wrangler ...` (project-local) or `pnpm dlx wrangler@4` |
| `Authentication error [code: 10000]` | Run `pnpm wrangler login` again; check API token scope |
| `nodejs_compat` import errors | Add `compatibility_flags = ["nodejs_compat"]` to wrangler.toml |
| `D1_ERROR: no such table` | Run `pnpm wrangler d1 migrations apply DB --local` |
| Port `8787` busy | `pnpm wrangler dev --port 8788` |
| `EACCES` on Linux Node install | Use `sudo` or `nvm install 22` instead |

---

## 3. Project Layout

```
my-app/
├── src/
│   ├── index.ts              # fetch handler entry, mounts itty-router
│   ├── router.ts             # itty-router instance + route bindings
│   ├── env.ts                # Env type, Zod schema for env vars
│   ├── routes/               # one file per resource
│   │   ├── health.ts
│   │   ├── auth.ts
│   │   └── todos.ts
│   ├── services/             # business logic; pure, no env coupling at top
│   │   └── todo_service.ts
│   ├── db/
│   │   ├── schema.sql        # D1 source-of-truth schema
│   │   └── queries.ts        # prepared statement wrappers
│   ├── kv/
│   │   └── sessions.ts       # KV reader/writer for sessions
│   ├── r2/
│   │   └── uploads.ts        # R2 helpers
│   ├── queues/
│   │   ├── producers.ts      # send() helpers
│   │   └── consumer.ts       # queue() handler body
│   ├── durable_objects/
│   │   ├── room.ts           # DO class with RPC + alarms
│   │   └── index.ts          # re-export DO classes
│   ├── lib/
│   │   ├── log.ts            # structured logger
│   │   ├── error.ts          # HTTPError + handler
│   │   └── auth.ts           # session helpers
│   └── middleware/
│       ├── cors.ts
│       └── auth.ts
├── migrations/               # wrangler d1 migrations
│   └── 0001_init.sql
├── test/
│   ├── env.d.ts              # Cloudflare Workers types
│   ├── tsconfig.json
│   ├── routes.test.ts
│   ├── durable_object.test.ts
│   └── integration.test.ts
├── .github/workflows/
│   └── deploy.yml
├── .cursor/
│   └── rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .claude/
│   └── settings.json
├── .codex/
│   └── config.toml
├── .dev.vars                 # gitignored, local secrets
├── .dev.vars.example         # template, committed
├── .gitignore
├── biome.json
├── CLAUDE.md
├── AGENTS.md
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── vitest.config.ts
├── worker-configuration.d.ts # generated by `wrangler types`
└── wrangler.toml
```

### Naming Conventions

- Files: `snake_case.ts`. Tests: `<unit>.test.ts`.
- Types & classes: `PascalCase`. Functions & vars: `camelCase`. Constants: `UPPER_SNAKE`.
- Durable Object classes: `PascalCase` ending in concept (e.g. `Room`, `RateLimiter`).
- D1 tables: `snake_case`, plural. Columns: `snake_case`. Booleans: `is_` prefix.
- Queue names match binding name lowercased with hyphens: `JOB_QUEUE` → `job-queue`.

### "If you're adding X, it goes in Y"

| Artifact | Goes in |
|---|---|
| New HTTP route | `src/routes/<resource>.ts` + register in `src/router.ts` |
| New DB table | New file in `migrations/000N_<name>.sql` |
| Prepared SQL query | `src/db/queries.ts` |
| Reusable business logic | `src/services/<thing>_service.ts` |
| Zod input schema | Top of the route file (co-located) |
| New env binding | `wrangler.toml` + regenerate `worker-configuration.d.ts` |
| New secret | `.dev.vars.example` + `wrangler secret put` for prod |
| New Durable Object class | `src/durable_objects/<name>.ts` + bind in `wrangler.toml` |
| Queue producer call | `src/queues/producers.ts` |
| Queue consumer logic | `src/queues/consumer.ts` (single `queue()` export) |
| KV access | `src/kv/<namespace>.ts` |
| R2 access | `src/r2/<purpose>.ts` |
| Cron schedule | `wrangler.toml` `[triggers] crons = […]` + `scheduled()` in `src/index.ts` |
| Middleware | `src/middleware/<name>.ts` |
| Test for route | `test/routes/<resource>.test.ts` |
| Logging helper | `src/lib/log.ts` (extend, don't duplicate) |
| New external HTTP client | `src/services/<thing>_service.ts` using `globalThis.fetch` |

---

## 4. Architecture

### Process Boundaries

```
┌─────────────────── Cloudflare edge POP (workerd) ────────────────────┐
│                                                                       │
│   HTTP request                                                        │
│        │                                                              │
│        ▼                                                              │
│   ┌────────────┐    bindings    ┌──────────────────────────────┐      │
│   │ Worker fetch│ ─────────────▶ │ env.DB    (D1 SQLite)        │      │
│   │  handler    │                │ env.KV    (KV namespace)     │      │
│   │  + itty     │                │ env.R2    (R2 bucket)        │      │
│   │  router     │                │ env.JOB_QUEUE (Queues prod.) │      │
│   │             │                │ env.ROOM  (DO namespace)     │      │
│   └─────┬──────┘                └──────────────────────────────┘      │
│         │ ctx.waitUntil(...)                                          │
│         ▼                                                              │
│   ┌─────────────┐    enqueue    ┌─────────────────────────┐           │
│   │ Producer    │ ────────────▶ │ Cloudflare Queue        │           │
│   └─────────────┘                └────────────┬────────────┘           │
│                                                │ batch                 │
│                                                ▼                       │
│                                       ┌─────────────────┐              │
│                                       │ queue() handler │              │
│                                       │ (same Worker)   │              │
│                                       └─────────────────┘              │
└────────────────────────────────────────────────────────────────────────┘
```

### Request Data Flow

```
Client ─► Worker fetch ─► itty-router ─► middleware (auth) ─► route handler
                                                                  │
                                                                  ├─► Zod parse(body)
                                                                  ├─► service fn
                                                                  │     └─► env.DB.prepare(...).run()
                                                                  └─► Response.json(...)
```

### Auth Flow

```
POST /auth/login {email, password}
   │
   ▼
zod.parse → service.verifyUser → bcrypt.compare(stored_hash)
   │                                       │
   │                                       ▼
   │                              valid? generate sessionId (crypto.randomUUID())
   │                                       │
   │                                       ▼
   │                       env.SESSIONS.put(sessionId, {userId, exp}, {expirationTtl})
   ▼
Set-Cookie: sid=<sessionId>; HttpOnly; Secure; SameSite=Lax; Path=/

Subsequent request:
   Cookie: sid=<sessionId>
       │
       ▼
authMiddleware → env.SESSIONS.get(sid, "json") → attach req.user → handler
```

### State Flow (Durable Object)

```
Worker A (POP NRT)             Worker B (POP DFW)
     │                                │
     │ env.ROOM.idFromName("room-42")  │
     ▼                                ▼
     ────────► single DO instance ◄─────────
                       │
                       ▼
              this.ctx.storage.sql.exec(...)  ← single-threaded, strongly consistent
                       │
                       ▼
              this.ctx.storage.setAlarm(Date.now() + 60_000)
                       │
                       ▼ (1 minute later)
              this.alarm() runs once, retried with backoff on throw
```

### Entry-Point File Map

| File | Responsibility |
|---|---|
| `src/index.ts` | `default export { fetch, scheduled, queue }` — only orchestration, no logic |
| `src/router.ts` | Constructs `Router()`, registers all routes, returns the routed handler |
| `src/env.ts` | `Env` interface (single source of truth) + Zod schema for runtime check |
| `src/durable_objects/index.ts` | Re-exports DO classes; required for Wrangler binding resolution |

### Where Business Logic Lives / Doesn't

- **Lives:** `src/services/*` and Durable Object methods.
- **Does NOT live:** route handlers (orchestration only), middleware (cross-cutting only), `src/index.ts` (entry only).

---

## 5. Dev Workflow

### Start Dev Server

```bash
pnpm wrangler dev
```

Watchers running:
- `esbuild` rebundles on `.ts` change.
- Miniflare reloads bindings (D1, KV, R2, DO) without restart.
- Local D1 database lives in `.wrangler/state/v3/d1/`.
- Local KV in `.wrangler/state/v3/kv/`.
- Local R2 in `.wrangler/state/v3/r2/`.

Hot reload **breaks** when:
- `wrangler.toml` changes → kill and restart `wrangler dev`.
- DO migration class added/renamed → kill and restart.
- New binding added → regenerate types: `pnpm wrangler types`, then restart.

### Attach Debugger

**VS Code / Cursor** (already wired in `.vscode/launch.json` below): F5 with the "Wrangler Dev" config.

**Manual:** `pnpm wrangler dev --inspect` then open `chrome://inspect`.

### Inspect Runtime State

- HTTP traffic: `pnpm wrangler tail` (prod) or browser to `http://localhost:8787` (local).
- D1 query: `pnpm wrangler d1 execute DB --local --command "SELECT * FROM todos"`.
- KV peek: `pnpm wrangler kv key list --binding=SESSIONS --local`.
- R2 list: `pnpm wrangler r2 object list <bucket> --local`.

### Pre-commit Checks

```bash
pnpm typecheck && pnpm lint && pnpm test
```

These three commands must all return 0. Anything else means do not commit.

### Branch + Commit Conventions

- `main` is deployable.
- Feature branches: `feat/<slug>`, fixes: `fix/<slug>`.
- Conventional Commits: `feat: …`, `fix: …`, `chore: …`, `refactor: …`.

---

## 6. Testing & Parallelization

### Unit Tests

Live in `test/`. Filename: `<unit>.test.ts`. Run:

```bash
pnpm test           # all
pnpm test -- routes # filter
pnpm test -- -t "POST /todos creates" # single
pnpm test --watch
```

### Integration Tests

Same Vitest pool. Use `SELF.fetch` to drive the real Worker through real bindings:

```ts
import { SELF } from "cloudflare:test";
import { it, expect } from "vitest";

it("GET /health returns 200", async () => {
  const res = await SELF.fetch("https://example.com/health");
  expect(res.status).toBe(200);
});
```

### E2E

For a server-only stack, "E2E" means hitting the deployed Worker via `curl` in the smoke step of CI. The pool already runs against real workerd, so most coverage lives in integration tests.

### Mocking Rules

- **Never mock D1, KV, R2, DO, or Queues.** The Vitest pool gives you real, isolated, in-memory ones per test file.
- **Always mock external HTTP.** Use Vitest's `vi.stubGlobal("fetch", ...)` at the top of the test.
- Never mock `crypto`, `Date`, or `console`.

### Coverage

Target: **75%** statement coverage on `src/services/**` and `src/routes/**`. Measure:

```bash
pnpm test --coverage
```

Coverage on Durable Objects requires running an integration test that addresses them by name; pure unit tests of DO classes are limited because state APIs are runtime-injected.

### Parallelization Patterns for AI Agents

Vitest runs files in parallel by default. The vitest-pool-workers gives each test file an isolated workerd instance with isolated bindings, so there is no shared state between files.

**Safe to fan out subagents:**
- Create distinct route files in parallel (`auth.ts`, `todos.ts`, `health.ts`).
- Write tests in parallel as long as each subagent owns its own test file.
- Generate Zod schemas + route handlers + tests for the same resource in three parallel subagents.

**Must be sequential (one agent at a time):**
- Anything editing `package.json`, `pnpm-lock.yaml`, `wrangler.toml`, `tsconfig.json`, or `worker-configuration.d.ts`.
- Adding a Durable Object class (requires `wrangler.toml` migration entry).
- Adding a new D1 migration (filenames are sequential).
- Renaming a binding (touches DTS + every reader).

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
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
```

### Levels

- `debug`: noisy local-only details. Off in prod.
- `info`: business events (user signed up, job enqueued).
- `warn`: degraded but recovered (retried external call, fell back to cache).
- `error`: failed request, unhandled exception, dropped queue message.

### Required Fields On Every Log Line

- `ts` — ISO 8601.
- `level`.
- `event` — short slug like `request_in`, `db_error`, `queue_enqueued`.
- `request_id` — pulled from `request.headers.get("cf-ray")` or generated UUID.
- `user_id` — when authed.
- `module` — e.g. `routes/todos`.

### Sample Lines

```json
{"ts":"2026-04-27T10:01:02.345Z","level":"info","event":"app_boot","module":"index","compat":"2026-04-27"}
{"ts":"...","level":"info","event":"request_in","request_id":"8a…","method":"POST","path":"/todos","user_id":"u_42"}
{"ts":"...","level":"info","event":"request_out","request_id":"8a…","status":201,"duration_ms":12}
{"ts":"...","level":"error","event":"db_error","request_id":"8a…","module":"routes/todos","err":"D1_ERROR: no such column"}
{"ts":"...","level":"warn","event":"slow_query","request_id":"8a…","duration_ms":850,"sql":"SELECT * FROM todos"}
{"ts":"...","level":"info","event":"queue_enqueued","queue":"job-queue","msg_id":"…"}
```

### Where Logs Land

- **Dev:** stdout in the `wrangler dev` terminal.
- **Prod:** Workers Logs (enabled by default) — viewable in dashboard or `pnpm wrangler tail`.

### Grep Locally

```bash
pnpm wrangler tail --format json | jq 'select(.level=="error")'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm typecheck && pnpm lint && pnpm test` before declaring a task done.
2. Always validate request input with Zod at the route boundary; never trust `request.json()` directly.
3. Always declare new bindings in `wrangler.toml` and regenerate types with `pnpm wrangler types`.
4. Always read secrets from `env.<NAME>`; never from `process.env`.
5. Always set `compatibility_flags = ["nodejs_compat"]` and a `compatibility_date` no older than 30 days.
6. Always use `env.DB.prepare(sql).bind(...)` — never string-interpolate values into SQL.
7. Always wrap route handlers with the error middleware so thrown `HTTPError` becomes a proper response.
8. Always attach `ctx.waitUntil(promise)` for fire-and-forget work that must outlive the response.
9. Always use `crypto.randomUUID()` for IDs — it works in workerd and is collision-safe.
10. Always migrate D1 by creating a new file in `migrations/`; never edit an applied one.
11. Always pick `idFromName()` for DOs that map to a real-world key; reserve `newUniqueId()` for ephemeral objects.
12. Always implement `alarm()` on a DO if `setAlarm()` is ever called — missing handler crashes the object.
13. Always destructure `{ env, ctx }` from the handler signature; never close over `env` from module scope.
14. Always declare new DO classes in `[[migrations]]` with `new_sqlite_classes` so they get SQLite storage.
15. Always set `expirationTtl` (or `expiration`) on KV writes for transient data like sessions.
16. Always log errors with structured fields, not as raw strings.
17. Always run `pnpm wrangler types` after editing `wrangler.toml`; commit the regenerated `worker-configuration.d.ts`.
18. Always set `Cf-Ray` (request id) on outgoing logs to correlate distributed traces.
19. Always use Zod's `.safeParse` in route handlers and return 400 on `.success === false`.
20. Always pin Wrangler with `"wrangler": "4.79.0"` in `package.json` to keep CI reproducible.
21. Always use `env.JOB_QUEUE.send(msg)` — never call the Queues HTTP API directly from the Worker.
22. Always test queue consumers via `SELF.queue("queue-name", batch)` in vitest-pool-workers.

### 8.2 NEVER

1. Never import from `node:fs`, `node:child_process`, `node:net`, or `node:dgram` — they will not exist at runtime.
2. Never use `process.env`; use `env.<binding>` from the handler.
3. Never edit a migration file that has already been applied to remote D1 — create a new one.
4. Never call `newUniqueId()` when you need a stable, addressable Durable Object — use `idFromName(name)`.
5. Never store binary blobs in KV — use R2; KV value cap is 25 MB and write rate-limited per key.
6. Never use a Worker as an in-memory cache between requests; instances are ephemeral and may be sharded.
7. Never throw a non-`Error` value; the runtime drops the stack and Sentry shows `[object Object]`.
8. Never write to D1 without a transaction wrapper when more than one statement must be atomic — use `env.DB.batch(...)`.
9. Never `await fetch()` without a timeout: use `AbortSignal.timeout(5000)`.
10. Never block in `fetch()` longer than the wall-clock CPU budget (default 30s); use Queues or DO alarms for long work.
11. Never read a request body twice — clone first: `const c = req.clone(); await c.text(); await req.json();`.
12. Never rely on `globalThis` mutations to share state between requests — use DO or KV.
13. Never put PII or secrets in `[vars]` in `wrangler.toml`; those are committed plaintext. Use `wrangler secret put`.
14. Never log the full request body at info level — redact secrets, headers, cookies.
15. Never call `env.DB.exec(sql)` with user input — `exec` does not parameterize. Use `prepare().bind()`.
16. Never use `Date.now()` for cryptographic purposes; use `crypto.getRandomValues`.
17. Never deploy without running migrations: `pnpm wrangler d1 migrations apply DB --remote`.
18. Never forget the `queue()` handler when you have a `[[queues.consumers]]` binding — deploy will succeed silently and messages back up.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command, lockfile | `pnpm install && pnpm typecheck && pnpm test` |
| `pnpm-lock.yaml` | reproducible builds | `pnpm install --frozen-lockfile` |
| `wrangler.toml` | bindings, runtime, deploy | `pnpm wrangler types && pnpm typecheck && pnpm wrangler deploy --dry-run` |
| `worker-configuration.d.ts` | `Env` type used everywhere | `pnpm typecheck` |
| `src/index.ts` | every request | full integration test run |
| `src/router.ts` | every route | full integration test run |
| `src/env.ts` | env access across app | `pnpm typecheck && pnpm test` |
| `tsconfig.json` | typecheck + build | `pnpm typecheck` from cold cache |
| `vitest.config.ts` | every test | `pnpm test` |
| `biome.json` | lint + format | `pnpm lint` |
| `migrations/*.sql` | D1 schema, runtime queries | `pnpm wrangler d1 migrations apply DB --local && pnpm test` |
| `src/db/queries.ts` | all DB callers | `pnpm typecheck && pnpm test` |
| `src/durable_objects/*.ts` | every DO call site | DO integration tests + `pnpm wrangler deploy --dry-run` |
| `src/queues/consumer.ts` | every queued message | `SELF.queue(...)` integration test |
| `src/lib/auth.ts` | every authed route | auth + routes integration tests |
| `src/middleware/auth.ts` | every authed route | full integration test run |
| `src/services/*.ts` | callers in routes + queues | route + queue tests |
| `.dev.vars` | local dev only | restart `wrangler dev` |
| `.github/workflows/deploy.yml` | release pipeline | push to a branch, watch CI |
| `.cursor/rules` | AI behavior in Cursor | open project in Cursor, sanity prompt |
| `CLAUDE.md` / `AGENTS.md` | AI behavior in Claude/Codex | re-open session, ask "what's the lint cmd" |
| Adding `[[durable_objects.bindings]]` | requires migration entry | `pnpm wrangler deploy --dry-run` |
| Adding `[[queues.consumers]]` | requires `queue()` export | typecheck + integration test for queue path |

### 8.4 Definition of Done (per task type)

**Bug fix**
- Failing test added that reproduced the bug.
- Fix makes test pass; no other tests regress.
- `pnpm typecheck && pnpm lint && pnpm test` green.
- Logs grep'd to confirm no new error patterns.

**New feature**
- Zod schema for input added.
- Route registered in `src/router.ts`.
- Service function in `src/services/`.
- Migration added if schema changed.
- Unit + integration tests cover happy path + 1 error path.
- Manual `curl` against `wrangler dev` returns expected output (capture in PR).

**Refactor**
- No behavior change. Tests untouched in count.
- All three pre-commit checks pass.
- No new `// TODO` introduced.

**Dependency bump**
- Run `pnpm up <pkg>` (or full `pnpm up -L` for majors).
- Re-run `pnpm wrangler types`.
- Full test pass.
- Skim CHANGELOG of the bumped package; document any breaking notes inline in commit.

**Schema change (D1)**
- New file: `migrations/000N_<name>.sql`. Never edit an existing file.
- Apply locally: `pnpm wrangler d1 migrations apply DB --local`.
- Update `src/db/queries.ts` types.
- Run `pnpm test`.
- Post-deploy: `pnpm wrangler d1 migrations apply DB --remote`.

**Copy/string change**
- Search the repo for the old string to confirm one source of truth.
- `pnpm typecheck && pnpm lint`.
- Visual scan for typos.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile
pnpm wrangler types
pnpm typecheck
pnpm lint
pnpm test
pnpm wrangler deploy --dry-run --outdir dist
```

Expected output for "green":

| Step | Expected |
|---|---|
| `pnpm install` | `Done in <N>s` |
| `pnpm wrangler types` | `Generating project types...` then nothing |
| `pnpm typecheck` | exits 0, no output |
| `pnpm lint` | `Checked N files in Xms. No fixes applied.` |
| `pnpm test` | `Test Files  N passed (N)` and `Tests  M passed (M)` |
| `pnpm wrangler deploy --dry-run` | `Total Upload: <size>` and `--dry-run: exiting now.` |

If any step is not literally that, the task is not done.

### 8.6 Parallelization Patterns

| Subagent fan-out | Safe? |
|---|---|
| Three agents each owning a different file in `src/routes/` | Yes |
| Three agents each writing a different test file under `test/` | Yes |
| Two agents each adding a new D1 migration | No — filenames collide |
| Two agents each editing `wrangler.toml` | No — merge conflicts on bindings |
| Two agents each running `pnpm install <pkg>` | No — lockfile race |
| One agent writing the route, one writing the test for the same route | Yes if test imports the module that already exists or is being created in this fan-out |
| Two agents running `pnpm wrangler types` | No — both write the same DTS |

---

## 9. Stack-Specific Pitfalls

1. **Hidden `nodejs_compat` failure.** Symptom: `import "node:crypto"` throws at runtime, passes locally because vitest-pool-workers auto-injects the flag. Cause: missing flag in `wrangler.toml`. Fix: add `compatibility_flags = ["nodejs_compat"]`. Detect: `pnpm wrangler deploy --dry-run` warns; CI smoke test runs `node:crypto` path.
2. **Forgotten DO `alarm()` handler.** Symptom: DO crashes when alarm fires; storage corrupted on retry. Cause: `setAlarm()` called but no `alarm()` method. Fix: implement `async alarm()` on the class. Detect: type error from `wrangler types`; integration test that fires the alarm.
3. **`idFromName` vs `newUniqueId` mixup.** Symptom: each request creates a new DO instance; "state" is never preserved. Cause: using `newUniqueId()` per request. Fix: use `idFromName(stableKey)`. Detect: hit the same endpoint twice and assert state persists.
4. **Editing an applied D1 migration.** Symptom: prod migrations break with mismatch error. Cause: edited a `.sql` already in `d1_migrations` table. Fix: never edit; create new migration that ALTERs. Detect: migrations dir diff vs. `git log` shows mutation of historical files.
5. **Plaintext secrets in `[vars]`.** Symptom: API key visible in `wrangler.toml` git history. Cause: confused `[vars]` (committed) with secrets (encrypted). Fix: rotate the key, then `pnpm wrangler secret put` instead. Detect: `git log -p -- wrangler.toml | grep -iE "(api|secret|token)"`.
6. **CPU time exceeded on large queue batch.** Symptom: half the batch processes, the rest retry forever. Cause: `max_batch_size = 100` with per-message work > 30 ms. Fix: lower `max_batch_size` or use `ctx.waitUntil` + `message.ack()` per item. Detect: `wrangler tail` shows `Worker exceeded CPU time limit`.
7. **Reading request body twice.** Symptom: `Body has already been used` thrown on second read. Cause: middleware calls `await req.json()` then handler does too. Fix: clone before reading: `const clone = req.clone();`. Detect: route has body-reading middleware AND body-reading handler.
8. **Cold-start cost of large dependency.** Symptom: P99 latency spikes after a deploy. Cause: heavy dep adds ms to startup; Workers cold-start matters. Fix: drop unused deps; `pnpm wrangler deploy --dry-run` and look at upload size. Detect: bundle > 1 MB compressed warns.
9. **D1 connection unavailable in DO.** Symptom: `env.DB` is undefined inside DO method. Cause: DO bindings are scoped — you must list `[[d1_databases]]` at top-level even when the DO uses it. Fix: top-level binding propagates to all DO classes. Detect: typecheck on DO method shows `env` shape.
10. **Queue consumer loops forever.** Symptom: same message reprocesses 1000x. Cause: thrown error → message retried up to `max_retries` then sits in DLQ; logic bug means it always throws. Fix: `message.ack()` for unrecoverable inputs; add DLQ via `dead_letter_queue`. Detect: `wrangler tail` shows the same `msg_id` repeatedly.
11. **Stale `worker-configuration.d.ts`.** Symptom: typecheck fails after pulling main with new binding. Cause: regenerated DTS not committed. Fix: `pnpm wrangler types && git add worker-configuration.d.ts`. Detect: CI step "verify types are committed" diffs after regen.
12. **`fetch()` to private network.** Symptom: ECONNREFUSED in prod, works locally. Cause: Workers cannot reach 10.x or localhost; need Tunnels or Hyperdrive. Fix: use Cloudflare Tunnel; for SQL, use Hyperdrive. Detect: lint rule on hostnames.
13. **Smart Placement vs. external DB.** Symptom: 10x latency talking to RDS. Cause: Worker runs near user, not near DB. Fix: enable Smart Placement (`[placement] mode = "smart"`) or use Hyperdrive. Detect: P95 latency for DB-touching routes.
14. **Wrangler bundle exceeds 10 MB.** Symptom: `Script too large` deploy error. Cause: imported a giant lib. Fix: dynamic import within a handler if rare; replace with smaller dep. Detect: `pnpm wrangler deploy --dry-run` upload size warning.
15. **Durable Object class renamed without migration.** Symptom: deploy succeeds, existing instances unreachable. Cause: rename without `[[migrations]]` entry. Fix: add `renamed_classes` migration entry. Detect: `pnpm wrangler deploy --dry-run` warns.
16. **Vitest pool stale state.** Symptom: tests pass alone, fail in suite. Cause: shared module-level state across tests in same file. Fix: reset in `beforeEach`. Detect: `--isolate` + `--no-file-parallelism` reproducer.

---

## 10. Performance Budgets

- Cold start: ≤ 50 ms (P95).
- TTFB (warm): ≤ 30 ms.
- CPU per request: ≤ 30 ms (free) / 50 ms (paid).
- Bundle size (compressed): ≤ 1 MB. Hard cap 10 MB.
- D1 reads per request: ≤ 50.
- KV reads per request: ≤ 100.
- DO RPC round-trips per request: ≤ 5.

### Measure

| Budget | Command |
|---|---|
| Cold start | `pnpm wrangler dev --remote` then time first hit with `curl -w "%{time_total}"` |
| Bundle size | `pnpm wrangler deploy --dry-run --outdir dist && du -h dist/index.js` |
| CPU time | `pnpm wrangler tail --format json | jq '.event.cpuTime'` |
| D1/KV reads | structured log on each access; aggregate |

### When Exceeded

- Cold start > 50 ms: drop deps, defer init into `fetch`.
- Bundle > 1 MB: tree-shake imports, replace heavy libs.
- CPU > 30 ms: move work to a Queue or DO alarm.

---

## 11. Security

### Secret Storage

- **Local:** `.dev.vars` (gitignored). Format `KEY=value`.
- **Prod:** `pnpm wrangler secret put KEY` (encrypted at rest, never in `wrangler.toml`).
- **Never put** secrets in `[vars]` in `wrangler.toml` — those are world-readable in git.

### Auth Threat Model

- Sessions in KV with `expirationTtl=86400`. Cookie `HttpOnly`, `Secure`, `SameSite=Lax`.
- Passwords stored as bcrypt hash (`bcryptjs`, cost 10).
- DO-backed rate limiter on `/auth/login` (5/min per IP).
- Auth middleware reads cookie, fetches session, attaches `user` to request scope.

### Input Validation

Every route parses input with Zod's `.safeParse()`. Failures return 400 with the Zod error path.

### Output Escaping

- JSON responses are auto-escaped by `Response.json()`.
- For HTML (rare in this stack), escape with `encodeURIComponent` or a templating lib.

### Permissions / Capabilities

Workers do not have a permissions manifest — capability is granted by binding. Grant the **minimum** binding scope. Example: do not bind a write-capable D1 to a read-only public route's Worker; split into two workers if needed.

### Dependency Audit

```bash
pnpm audit --prod --audit-level=high
```

Cadence: weekly in CI.

### Top 5 Risks

1. **Secrets in `[vars]`** — fixed by always using `secret put`.
2. **SQL injection via `env.DB.exec()`** — fixed by always using `prepare().bind()`.
3. **CSRF on cookie auth** — fixed by `SameSite=Lax` + double-submit token on state-changing routes.
4. **Open redirect on login flows** — fixed by allowlisting `next` URLs.
5. **R2 bucket made public by accident** — fixed by serving via Worker, not direct R2 URL.

---

## 12. Deploy

### Release Flow

```bash
# 1. Local pre-flight
pnpm typecheck && pnpm lint && pnpm test

# 2. Apply migrations to prod
pnpm wrangler d1 migrations apply DB --remote

# 3. Push secrets that aren't in CI yet
echo "..." | pnpm wrangler secret put SENTRY_DSN

# 4. Deploy
pnpm wrangler deploy

# 5. Smoke test
curl -fsS https://<your-worker>.<your-subdomain>.workers.dev/health
```

### Staging vs Prod

Use `[env.staging]` and `[env.production]` blocks in `wrangler.toml`. Deploy with `--env staging` or `--env production`. Each environment gets its own bindings.

### Rollback

```bash
pnpm wrangler deployments list
pnpm wrangler rollback <deployment-id>
```

Max safe rollback window: 30 days. Beyond that, Workers GC's older versions.

### Health Check

`GET /health` returns `{"status":"ok","version":"<git-sha>"}`. CI smoke test fails build if not 200.

### Versioning

- `package.json` `version` field follows semver.
- Git tag `vX.Y.Z` on release.
- Git SHA is exposed at runtime via the Sentry `CF_VERSION_METADATA` binding.

### Auto-update / Submission

There is no app store. `wrangler deploy` makes the new version live globally in ~30 s. For canary, use `wrangler versions upload` + `wrangler versions deploy --percentage 10` to ramp.

### DNS / Domain Wiring

- Built-in: `<worker>.<subdomain>.workers.dev` (free).
- Custom domain: in dash → Workers → Triggers → Add Custom Domain. CNAME is auto-managed.

### Cost Estimate per 1k MAU

- Workers Paid: $5/mo base, 10M req/month included.
- D1 (paid): $5/mo for 5GB storage and 25B row reads.
- KV: $0.50/M reads, $5/M writes.
- R2: $0.015/GB-month storage, $0 egress.

A 1k-MAU read-heavy app: **~$5–10/month** on the Paid plan.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# CLAUDE.md

This project is a Cloudflare Workers TypeScript service. The full rulebook is `cloudflare-workers.md` at the repo root or in `rulebooks/`. Read it before suggesting changes.

## Quick Reference

- Install: `pnpm install`
- Dev: `pnpm wrangler dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Test: `pnpm test`
- Deploy: `pnpm wrangler deploy`

## Banned Patterns

- `process.env` — use `env` from the handler.
- `fetch` without `AbortSignal.timeout` — request hangs forever.
- `node:fs`, `node:child_process` — not in workerd.
- Editing applied D1 migrations — create a new file.
- Storing secrets in `[vars]` of `wrangler.toml` — use `wrangler secret put`.
- `newUniqueId()` for DO that should be addressable — use `idFromName`.

## Self-Verification Before Done

```bash
pnpm install --frozen-lockfile
pnpm wrangler types
pnpm typecheck
pnpm lint
pnpm test
pnpm wrangler deploy --dry-run --outdir dist
```

All six must exit 0.

## Skills

- `/test-driven-development` before any new feature.
- `/systematic-debugging` for any bug.
- `/verification-before-completion` before claiming done.
- `/ship` to release.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm install --frozen-lockfile)",
      "Bash(pnpm test*)",
      "Bash(pnpm typecheck)",
      "Bash(pnpm lint)",
      "Bash(pnpm format)",
      "Bash(pnpm wrangler dev*)",
      "Bash(pnpm wrangler types)",
      "Bash(pnpm wrangler tail*)",
      "Bash(pnpm wrangler d1 migrations *)",
      "Bash(pnpm wrangler d1 execute *)",
      "Bash(pnpm wrangler kv key list *)",
      "Bash(pnpm wrangler r2 object list *)",
      "Bash(pnpm wrangler deploy --dry-run*)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(curl -fsS http://localhost:8787*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm biome check --write --no-errors-on-unmatched ${CLAUDE_FILE_PATHS:-}" }
        ]
      }
    ],
    "PreCommit": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm typecheck && pnpm lint && pnpm test" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm wrangler deploy --dry-run --outdir /tmp/dryrun >/dev/null 2>&1 && echo 'dry-run ok' || echo 'DRY-RUN FAILED'" }
        ]
      }
    ]
  }
}
```

### Recommended Skills

- `/test-driven-development` — start every feature with a failing Vitest test.
- `/systematic-debugging` — for runtime errors visible only in `wrangler tail`.
- `/verification-before-completion` — runs the six-step recipe.
- `/ship` — runs typecheck/lint/test, bumps version, deploys.

### Slash Command Shortcuts

- `/dev` — `pnpm wrangler dev`.
- `/tail` — `pnpm wrangler tail --format json`.
- `/migrate` — `pnpm wrangler d1 migrations apply DB --local`.
- `/dryrun` — `pnpm wrangler deploy --dry-run --outdir dist`.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# AGENTS.md

Cloudflare Workers TypeScript service. See `cloudflare-workers.md` for the full rulebook.

## Workflow

1. Read the route or module you're changing.
2. Add a failing Vitest test in `test/`.
3. Edit the source.
4. Run: `pnpm typecheck && pnpm lint && pnpm test`.
5. Run: `pnpm wrangler deploy --dry-run --outdir dist`.

## Constraints

- Only `pnpm` for package ops.
- Never edit `worker-configuration.d.ts` by hand — `pnpm wrangler types` regenerates it.
- Never edit `migrations/*.sql` files that have been merged to main — create a new migration.
- Always validate input with Zod 4 at the route boundary.

## Tools You Can Run Without Asking

`pnpm install`, `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm wrangler dev`, `pnpm wrangler types`, `pnpm wrangler deploy --dry-run`, `git status`, `git diff`.

## Tools You Must Ask Before Running

`pnpm wrangler deploy` (no flags), `pnpm wrangler d1 execute --remote`, `pnpm wrangler secret put`, `git push`.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true
exclude_tmpdir_env_var = false
exclude_slash_tmp = false
writable_roots = ["./src", "./test", "./migrations", "./.github"]

[shell_environment_policy]
inherit = "core"
include_only = ["PATH", "HOME", "TERM", "LANG", "CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ACCOUNT_ID"]
```

### Where Codex Differs From Claude Code

- Codex's sandbox blocks shell network by default. Allow `network_access = true` so `pnpm install` works.
- Codex does not auto-format on save. Run `pnpm format` before commit.
- Codex's diff display can mis-render long DTS files; always check `worker-configuration.d.ts` separately.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```text
You are working in a Cloudflare Workers TypeScript repo. The full rulebook lives in `cloudflare-workers.md`. Read it.

Always:
- Validate input with Zod 4 at the route boundary.
- Use `env.<binding>` from the handler signature; never `process.env`.
- `prepare().bind(...)` for D1 — never string-interpolate SQL.
- Run `pnpm typecheck && pnpm lint && pnpm test` before saying done.
- Add new D1 migrations as new files in `migrations/`.
- Regenerate `worker-configuration.d.ts` via `pnpm wrangler types` after editing `wrangler.toml`.

Never:
- Import from `node:fs`, `node:child_process`, `node:net`.
- Edit an applied migration.
- Put secrets in `[vars]` — they are world-readable.
- Use `newUniqueId()` for an addressable Durable Object.
- Forget the `alarm()` handler when calling `setAlarm()`.
- Forget the `queue()` handler when there is a `[[queues.consumers]]`.

Self-verify:
1. `pnpm install --frozen-lockfile`
2. `pnpm wrangler types`
3. `pnpm typecheck`
4. `pnpm lint`
5. `pnpm test`
6. `pnpm wrangler deploy --dry-run --outdir dist`

All six must exit 0.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "vitest.explorer",
    "cloudflare.vscode-cloudflare-workers",
    "tamasfe.even-better-toml",
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
      "name": "Wrangler Dev",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["wrangler", "dev", "--inspect"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "name": "Vitest",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["test", "--", "--inspect-brk", "--no-file-parallelism"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After the last `git push`, the branch is deployable.

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12.0" },
  "scripts": {
    "dev": "wrangler dev",
    "deploy": "wrangler deploy",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "format": "biome check --write .",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "@sentry/cloudflare": "^9.0.0",
    "bcryptjs": "^2.4.3",
    "itty-router": "^5.0.18",
    "zod": "^4.3.6"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.0",
    "@cloudflare/vitest-pool-workers": "^0.14.7",
    "@cloudflare/workers-types": "^4.20260427.0",
    "@types/bcryptjs": "^2.4.6",
    "typescript": "^5.7.0",
    "vitest": "^4.1.0",
    "wrangler": "4.79.0"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### `wrangler.toml`

```toml
name = "my-app"
main = "src/index.ts"
compatibility_date = "2026-04-27"
compatibility_flags = ["nodejs_compat"]
account_id = ""              # set via CLOUDFLARE_ACCOUNT_ID env in CI

# Smart Placement: run near origin DBs when latency analysis says so
[placement]
mode = "smart"

# Observability: built-in logs (default-on, but explicit is good)
[observability]
enabled = true
head_sampling_rate = 1

# Public env vars (NEVER secrets)
[vars]
APP_ENV = "production"

# D1
[[d1_databases]]
binding = "DB"
database_name = "my-app-db"
database_id = ""             # `pnpm wrangler d1 create my-app-db` then paste
migrations_dir = "migrations"

# KV
[[kv_namespaces]]
binding = "SESSIONS"
id = ""                      # `pnpm wrangler kv namespace create SESSIONS`

# R2
[[r2_buckets]]
binding = "UPLOADS"
bucket_name = "my-app-uploads"

# Queues — producer
[[queues.producers]]
binding = "JOB_QUEUE"
queue = "my-app-jobs"

# Queues — consumer
[[queues.consumers]]
queue = "my-app-jobs"
max_batch_size = 10
max_batch_timeout = 5
max_retries = 3
dead_letter_queue = "my-app-jobs-dlq"

# Durable Objects
[[durable_objects.bindings]]
name = "ROOM"
class_name = "Room"

[[migrations]]
tag = "v1"
new_sqlite_classes = ["Room"]

# Cron triggers
[triggers]
crons = ["0 * * * *"]

# Sentry version metadata
[version_metadata]
binding = "CF_VERSION_METADATA"

# ──────────── ENV: STAGING ────────────
[env.staging]
name = "my-app-staging"
[env.staging.vars]
APP_ENV = "staging"

# ──────────── ENV: PRODUCTION ────────────
[env.production]
name = "my-app"
[env.production.vars]
APP_ENV = "production"
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "es2022",
    "module": "esnext",
    "moduleResolution": "bundler",
    "lib": ["es2023"],
    "types": ["@cloudflare/workers-types/2026-04-27", "./worker-configuration.d.ts"],
    "strict": true,
    "noImplicitAny": true,
    "noImplicitReturns": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "exactOptionalPropertyTypes": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "noEmit": true
  },
  "include": ["src/**/*", "test/**/*", "worker-configuration.d.ts"]
}
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
          compatibilityDate: "2026-04-27",
          compatibilityFlags: ["nodejs_compat"],
        },
      },
    },
  },
});
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src/**", "test/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": { "noUnusedImports": "error", "noUnusedVariables": "error" },
      "style": { "useConst": "error", "useTemplate": "error" },
      "suspicious": { "noExplicitAny": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "double", "semicolons": "always" } }
}
```

### `src/env.ts`

```ts
export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  UPLOADS: R2Bucket;
  JOB_QUEUE: Queue<JobMessage>;
  ROOM: DurableObjectNamespace;
  CF_VERSION_METADATA: { id: string; tag: string };
  APP_ENV: string;
  // Secrets (set via `wrangler secret put`):
  SENTRY_DSN: string;
}

export interface JobMessage {
  type: "send_email" | "process_upload";
  payload: Record<string, unknown>;
}
```

### `src/lib/log.ts`

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
  else if (level === "warn") console.warn(line);
  else console.log(line);
}
```

### `src/lib/error.ts`

```ts
export class HTTPError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

export function toResponse(err: unknown): Response {
  if (err instanceof HTTPError) {
    return Response.json({ error: err.code, message: err.message }, { status: err.status });
  }
  const message = err instanceof Error ? err.message : "internal_error";
  return Response.json({ error: "internal", message }, { status: 500 });
}
```

### `src/router.ts`

```ts
import { AutoRouter } from "itty-router";
import type { Env } from "./env";
import { health } from "./routes/health";
import { todos } from "./routes/todos";
import { auth } from "./routes/auth";

export const router = AutoRouter<Request, [Env, ExecutionContext]>();

router
  .get("/health", health)
  .post("/auth/login", auth.login)
  .post("/auth/logout", auth.logout)
  .get("/todos", todos.list)
  .post("/todos", todos.create)
  .get("/todos/:id", todos.get)
  .delete("/todos/:id", todos.remove);
```

### `src/routes/health.ts`

```ts
import type { Env } from "../env";

export function health(_req: Request, env: Env): Response {
  return Response.json({ status: "ok", env: env.APP_ENV, version: env.CF_VERSION_METADATA?.id });
}
```

### `src/routes/todos.ts`

```ts
import { z } from "zod";
import type { Env } from "../env";
import { HTTPError } from "../lib/error";

const CreateTodo = z.object({ title: z.string().min(1).max(200) });

export const todos = {
  async list(_req: Request, env: Env): Promise<Response> {
    const { results } = await env.DB.prepare("SELECT id, title, created_at FROM todos ORDER BY created_at DESC").all();
    return Response.json(results);
  },
  async create(req: Request, env: Env): Promise<Response> {
    const body = await req.json();
    const parsed = CreateTodo.safeParse(body);
    if (!parsed.success) throw new HTTPError(400, "invalid_input", parsed.error.message);
    const id = crypto.randomUUID();
    await env.DB.prepare("INSERT INTO todos (id, title) VALUES (?, ?)").bind(id, parsed.data.title).run();
    return Response.json({ id, title: parsed.data.title }, { status: 201 });
  },
  async get(req: Request & { params: { id: string } }, env: Env): Promise<Response> {
    const row = await env.DB.prepare("SELECT id, title, created_at FROM todos WHERE id = ?").bind(req.params.id).first();
    if (!row) throw new HTTPError(404, "not_found", "todo not found");
    return Response.json(row);
  },
  async remove(req: Request & { params: { id: string } }, env: Env): Promise<Response> {
    await env.DB.prepare("DELETE FROM todos WHERE id = ?").bind(req.params.id).run();
    return new Response(null, { status: 204 });
  },
};
```

### `src/routes/auth.ts`

```ts
import { z } from "zod";
import bcrypt from "bcryptjs";
import type { Env } from "../env";
import { HTTPError } from "../lib/error";

const Login = z.object({ email: z.string().email(), password: z.string().min(8) });

export const auth = {
  async login(req: Request, env: Env): Promise<Response> {
    const parsed = Login.safeParse(await req.json());
    if (!parsed.success) throw new HTTPError(400, "invalid_input", parsed.error.message);
    const row = await env.DB.prepare("SELECT id, password_hash FROM users WHERE email = ?")
      .bind(parsed.data.email).first<{ id: string; password_hash: string }>();
    if (!row) throw new HTTPError(401, "invalid_credentials", "bad email or password");
    const ok = await bcrypt.compare(parsed.data.password, row.password_hash);
    if (!ok) throw new HTTPError(401, "invalid_credentials", "bad email or password");
    const sid = crypto.randomUUID();
    await env.SESSIONS.put(sid, JSON.stringify({ user_id: row.id }), { expirationTtl: 86400 });
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": `sid=${sid}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400` },
    });
  },
  async logout(req: Request, env: Env): Promise<Response> {
    const sid = req.headers.get("Cookie")?.match(/sid=([^;]+)/)?.[1];
    if (sid) await env.SESSIONS.delete(sid);
    return new Response(null, {
      status: 204,
      headers: { "Set-Cookie": "sid=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0" },
    });
  },
};
```

### `src/queues/consumer.ts`

```ts
import type { Env, JobMessage } from "../env";
import { log } from "../lib/log";

export async function handleQueue(
  batch: MessageBatch<JobMessage>,
  env: Env,
  _ctx: ExecutionContext,
): Promise<void> {
  for (const msg of batch.messages) {
    try {
      log("info", "queue_msg_received", { id: msg.id, type: msg.body.type });
      switch (msg.body.type) {
        case "send_email":
          // do work
          msg.ack();
          break;
        case "process_upload":
          // do work
          msg.ack();
          break;
      }
    } catch (err) {
      log("error", "queue_msg_failed", { id: msg.id, err: String(err) });
      msg.retry({ delaySeconds: 30 });
    }
  }
}
```

### `src/durable_objects/room.ts`

```ts
import { DurableObject } from "cloudflare:workers";
import type { Env } from "../env";

export class Room extends DurableObject<Env> {
  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    void this.ctx.blockConcurrencyWhile(async () => {
      this.ctx.storage.sql.exec(
        "CREATE TABLE IF NOT EXISTS messages (id TEXT PRIMARY KEY, body TEXT, ts INTEGER)",
      );
    });
  }

  // RPC method — call as: env.ROOM.get(id).postMessage(body)
  async postMessage(body: string): Promise<{ id: string }> {
    const id = crypto.randomUUID();
    this.ctx.storage.sql.exec(
      "INSERT INTO messages (id, body, ts) VALUES (?, ?, ?)",
      id,
      body,
      Date.now(),
    );
    if (!(await this.ctx.storage.getAlarm())) {
      await this.ctx.storage.setAlarm(Date.now() + 60_000);
    }
    return { id };
  }

  async messages(): Promise<{ id: string; body: string; ts: number }[]> {
    const cursor = this.ctx.storage.sql.exec<{ id: string; body: string; ts: number }>(
      "SELECT id, body, ts FROM messages ORDER BY ts DESC LIMIT 100",
    );
    return cursor.toArray();
  }

  // Required because we call setAlarm above
  async alarm(): Promise<void> {
    // periodic compaction
    this.ctx.storage.sql.exec("DELETE FROM messages WHERE ts < ?", Date.now() - 7 * 86400 * 1000);
  }
}
```

### `src/durable_objects/index.ts`

```ts
export { Room } from "./room";
```

### `src/index.ts`

```ts
import { withSentry } from "@sentry/cloudflare";
import type { Env, JobMessage } from "./env";
import { router } from "./router";
import { handleQueue } from "./queues/consumer";
import { toResponse } from "./lib/error";
import { log } from "./lib/log";

export { Room } from "./durable_objects";

const handler = {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const start = Date.now();
    try {
      const res = await router.fetch(req, env, ctx);
      log("info", "request_out", {
        request_id: req.headers.get("cf-ray"),
        status: res.status,
        duration_ms: Date.now() - start,
      });
      return res;
    } catch (err) {
      log("error", "request_err", {
        request_id: req.headers.get("cf-ray"),
        err: err instanceof Error ? err.message : String(err),
      });
      return toResponse(err);
    }
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    log("info", "cron_fire", { env: env.APP_ENV });
    // hourly housekeeping goes here
  },
  async queue(batch: MessageBatch<JobMessage>, env: Env, ctx: ExecutionContext): Promise<void> {
    await handleQueue(batch, env, ctx);
  },
} satisfies ExportedHandler<Env, JobMessage>;

export default withSentry(
  (env: Env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.1, release: env.CF_VERSION_METADATA?.id }),
  handler,
);
```

### `migrations/0001_init.sql`

```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE todos (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX idx_todos_user ON todos(user_id);
```

### `test/tsconfig.json`

```json
{
  "extends": "../tsconfig.json",
  "compilerOptions": {
    "types": ["@cloudflare/vitest-pool-workers", "../worker-configuration.d.ts"]
  },
  "include": ["./**/*.ts", "../src/**/*.ts"]
}
```

### `test/integration.test.ts`

```ts
import { SELF, env } from "cloudflare:test";
import { describe, it, expect, beforeAll } from "vitest";

describe("health", () => {
  it("returns ok", async () => {
    const res = await SELF.fetch("https://example.com/health");
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toMatchObject({ status: "ok" });
  });
});

describe("todos", () => {
  beforeAll(async () => {
    await env.DB.exec(
      "CREATE TABLE IF NOT EXISTS todos (id TEXT PRIMARY KEY, title TEXT NOT NULL, user_id TEXT, created_at INTEGER NOT NULL DEFAULT (unixepoch()))",
    );
  });

  it("creates and lists", async () => {
    const create = await SELF.fetch("https://example.com/todos", {
      method: "POST",
      body: JSON.stringify({ title: "buy milk" }),
      headers: { "content-type": "application/json" },
    });
    expect(create.status).toBe(201);
    const list = await SELF.fetch("https://example.com/todos");
    expect(list.status).toBe(200);
    const items = (await list.json()) as { title: string }[];
    expect(items.some((t) => t.title === "buy milk")).toBe(true);
  });
});
```

### `.dev.vars.example`

```
SENTRY_DSN=
```

### `.gitignore`

```
node_modules
.wrangler
.dev.vars
dist
coverage
.DS_Store
```

### `.github/workflows/deploy.yml`

```yaml
name: deploy
on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm wrangler types
      - run: git diff --exit-code worker-configuration.d.ts
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test
      - run: pnpm wrangler deploy --dry-run --outdir dist
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          CLOUDFLARE_ACCOUNT_ID: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}

  deploy:
    needs: ci
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '22', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - name: Apply D1 migrations
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: d1 migrations apply DB --remote
      - name: Deploy
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: deploy --env production
      - name: Smoke
        run: curl -fsS https://my-app.<your-subdomain>.workers.dev/health
```

### `README.md` (stub)

```markdown
# my-app

Cloudflare Workers TypeScript service. See `cloudflare-workers.md` for the full operating manual.

## Run

```bash
pnpm install
pnpm wrangler dev
```
```

### `LICENSE`

```
MIT License — Copyright (c) 2026 <you>

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

### Final Bootstrap Steps

```bash
pnpm install
pnpm wrangler d1 create my-app-db   # paste id into wrangler.toml
pnpm wrangler kv namespace create SESSIONS  # paste id
pnpm wrangler r2 bucket create my-app-uploads
pnpm wrangler queues create my-app-jobs
pnpm wrangler queues create my-app-jobs-dlq
pnpm wrangler types
pnpm wrangler d1 migrations apply DB --local
pnpm test
pnpm wrangler dev
```

---

## 17. Idea → MVP Path

Generic CRUD-with-realtime app (no specific PROJECT_IDEA was provided). Five phases:

### Phase 1 — Schema (1 session)

- Files touched: `migrations/0001_init.sql`, `src/env.ts`.
- Define core tables: `users`, the primary domain entity (e.g. `todos`), `audit_log`.
- Exit: `pnpm wrangler d1 migrations apply DB --local` succeeds.

### Phase 2 — Backbone (1–2 sessions)

- Files touched: `src/index.ts`, `src/router.ts`, `src/routes/health.ts`, `src/routes/<entity>.ts`, `src/lib/error.ts`.
- All routes return 501 with a "not implemented" body except `/health`.
- Exit: `pnpm test` integration test for `/health` passes; type-only stubs compile.

### Phase 3 — Vertical Slice (2 sessions)

- Files touched: `src/routes/<entity>.ts`, `src/services/<entity>_service.ts`, `src/db/queries.ts`, `test/integration.test.ts`.
- One full CRUD on the primary entity, with Zod validation and integration tests.
- Exit: `pnpm test` shows 4 tests for create/list/get/delete.

### Phase 4 — Auth + Multi-User (2 sessions)

- Files touched: `src/routes/auth.ts`, `src/middleware/auth.ts`, `src/lib/auth.ts`, `migrations/0002_auth.sql` if needed.
- Email+password sign up/in, KV session, owner column on entity, scoped queries.
- Exit: an integration test asserts user A cannot read user B's data.

### Phase 5 — Ship + Monitor (1 session)

- Files touched: `wrangler.toml` env blocks, `.github/workflows/deploy.yml`, `src/index.ts` (Sentry).
- Set `SENTRY_DSN` secret, deploy to staging, run smoke, promote to prod.
- Exit: `curl https://<your-worker>/health` returns 200; Sentry receives a test event.

---

## 18. Feature Recipes

### 18.1 Auth (email/password + OAuth)

Files: `src/routes/auth.ts` (already shown), `migrations/0002_oauth.sql` adding `oauth_identities (provider, provider_user_id, user_id)`. For OAuth callback: `GET /auth/callback/:provider` exchanges code for token using `globalThis.fetch` with `AbortSignal.timeout(5000)`, then creates session as in `login`.

### 18.2 File Upload + Storage (R2)

```ts
// src/routes/uploads.ts
import type { Env } from "../env";
export async function upload(req: Request, env: Env): Promise<Response> {
  const ct = req.headers.get("content-type") ?? "application/octet-stream";
  const key = `uploads/${crypto.randomUUID()}`;
  await env.UPLOADS.put(key, req.body, { httpMetadata: { contentType: ct } });
  return Response.json({ key }, { status: 201 });
}
export async function download(req: Request & { params: { key: string } }, env: Env): Promise<Response> {
  const obj = await env.UPLOADS.get(req.params.key);
  if (!obj) return new Response("not found", { status: 404 });
  return new Response(obj.body, { headers: { "content-type": obj.httpMetadata?.contentType ?? "application/octet-stream" } });
}
```

### 18.3 Stripe Payments

Use webhooks: `POST /stripe/webhook` reads raw body, verifies signature with `crypto.subtle.verify(...)` against `STRIPE_WEBHOOK_SECRET`, then writes to D1. Use Queues to do post-payment fulfillment async.

### 18.4 Push Notifications

Workers cannot keep WebSocket connections open arbitrarily; use Durable Objects to fan-out. For OS push, integrate with Apple/FCM via `fetch` from a Queue consumer.

### 18.5 Background Jobs / Cron

Already wired via `[triggers] crons = ["0 * * * *"]` and `scheduled()` handler in `src/index.ts`. For longer/per-user jobs, enqueue to `JOB_QUEUE` and process in `queue()` handler.

### 18.6 Realtime Updates (WebSockets via DO)

Add `webSocketMessage` handler on the DO class:

```ts
async fetch(req: Request): Promise<Response> {
  const pair = new WebSocketPair();
  this.ctx.acceptWebSocket(pair[1]);
  return new Response(null, { status: 101, webSocket: pair[0] });
}
async webSocketMessage(ws: WebSocket, msg: string | ArrayBuffer): Promise<void> {
  for (const peer of this.ctx.getWebSockets()) peer.send(msg);
}
```

### 18.7 Search

Small dataset: D1 `LIKE`. Larger: external Vectorize index.

### 18.8 Internationalization

API-only stack; emit `{"error":"...","i18n":"errors.invalid_input"}` and let the client translate.

### 18.9 Dark Mode

N/A (server-only).

### 18.10 Analytics Events

```ts
// src/routes/track.ts
import { z } from "zod";
const Event = z.object({ name: z.string(), props: z.record(z.string(), z.unknown()).optional() });
export async function track(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const parsed = Event.safeParse(await req.json());
  if (!parsed.success) return new Response("bad", { status: 400 });
  ctx.waitUntil(env.JOB_QUEUE.send({ type: "analytics", payload: parsed.data }));
  return new Response(null, { status: 202 });
}
```

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Error: No bindings of type "d1" matched binding "DB"` | Add `[[d1_databases]]` block with matching `binding`; restart `wrangler dev`. |
| `Cannot find module 'node:fs'` at runtime | Don't import `node:fs`; not in workerd. Refactor to KV or R2. |
| `D1_ERROR: no such table: todos` | `pnpm wrangler d1 migrations apply DB --local`. |
| `Body has already been used` | `req.clone()` before reading body twice. |
| `script will exceed CPU time` | Move work into Queue or DO alarm. |
| `Authentication error [code: 10000]` | `pnpm wrangler login` or set `CLOUDFLARE_API_TOKEN`. |
| `Class "Foo" not exported` | `export { Foo } from "./durable_objects"` in `src/index.ts`. |
| `Migration "v1" already applied` | Don't re-add; create a new tag in `[[migrations]]`. |
| `Unable to access D1 binding from Durable Object` | Move binding to top-level `[[d1_databases]]`. |
| `Worker exceeded its CPU time limit` | Reduce per-request work; defer with `ctx.waitUntil`. |
| `Cannot find name 'D1Database'` | `pnpm wrangler types` to regenerate `worker-configuration.d.ts`. |
| `Error: Network connection lost` (Hyperdrive) | Increase `connect_timeout`; verify origin DB reachable. |
| `KV PUT failed: 429` | Rate-limited (1 write/sec/key); batch or change key. |
| `R2 GET 404` | Confirm bucket name in `wrangler.toml` + key path. |
| `Queue consumer not invoked` | Confirm `[[queues.consumers]]` block + `queue()` export in `src/index.ts`. |
| `Sentry events not arriving` | Verify `SENTRY_DSN` set as secret (`wrangler secret list`). |
| `Class never registered for migration` | Add to `[[migrations]] new_sqlite_classes`. |
| `worker-configuration.d.ts is dirty` in CI | `pnpm wrangler types && git add worker-configuration.d.ts`. |
| `Set-Cookie` not sent to client | Ensure response is the only response (don't double-wrap). |
| `bcrypt is not a function` | Use `bcryptjs` not `bcrypt`; native binaries don't run in workerd. |
| `process is not defined` | Replace `process.env.X` with `env.X`. |
| `Error 1101: rendering error` | Unhandled exception in fetch — check `wrangler tail`. |
| `Error 1102: exceeded resources` | Memory or CPU exhausted; profile with `wrangler dev --inspect`. |
| `Error 1027: zone is overloaded` | Cloudflare-side; retry with backoff. |
| `Cannot find name 'cloudflare:test'` | Add `@cloudflare/vitest-pool-workers` to `types` in `test/tsconfig.json`. |
| `Hyperdrive connection refused` | DB not publicly reachable; configure tunnel. |
| `Wrangler version mismatch` | Pin exact version; `pnpm install --frozen-lockfile`. |
| `Failed to publish your Function` | Often missing API token scope; recreate token with Workers edit. |
| `wrangler dev` hangs on first run | Workers compile cache cold; second run is fast. |
| `Script too large` | Bundle exceeds 10 MB compressed; remove deps or move to Containers. |

---

## 20. Glossary

- **Worker**: a JavaScript/TypeScript program running on Cloudflare's edge in V8 isolates. Single function per request.
- **workerd**: the open-source runtime that executes Workers (also used by Miniflare locally).
- **Wrangler**: the CLI for Workers — bootstrap, dev, deploy, log tail, manage bindings.
- **Binding**: a name in your `env` object that points to a Cloudflare resource (DB, bucket, queue). It carries permission with it; no API key needed.
- **D1**: Cloudflare's serverless SQLite database, accessed via a binding.
- **KV**: Workers KV — eventually-consistent global key-value store. Best for read-heavy config, sessions.
- **R2**: Cloudflare's S3-compatible object storage with no egress fees.
- **Queues**: managed message queue — Workers produce/consume in batches.
- **Durable Object (DO)**: a single-threaded actor with strong-consistent storage (now SQLite-backed). Addressable by `idFromName`.
- **RPC**: typed method calls between a Worker and a Durable Object using a class with public methods.
- **Alarm**: a per-DO scheduled wakeup; `setAlarm(timestamp)` schedules, `alarm()` runs.
- **Hyperdrive**: a connection pool + cache for external Postgres/MySQL accessed from Workers.
- **Smart Placement**: Cloudflare automatically picks the best POP for your Worker based on observed latency.
- **Compatibility date**: pins your Worker to a specific runtime behavior snapshot. Bumping is opt-in.
- **`nodejs_compat`**: compatibility flag enabling Node.js-style imports (`node:crypto`, etc.).
- **Miniflare**: the simulator that runs your Worker locally inside `wrangler dev`.
- **`fetch` handler**: the entry point — your Worker exports `default { fetch(req, env, ctx) {} }`.
- **`scheduled` handler**: cron entry point — runs on the schedule defined in `[triggers] crons`.
- **`queue` handler**: invoked with a batch of messages from a Queue you've consumed.
- **`ctx.waitUntil`**: tells the runtime to keep the Worker alive until a promise resolves, even after the response is sent.
- **`SELF`** (test): the simulated Worker available in vitest-pool-workers tests.
- **Zod**: a TypeScript-first runtime schema validator. `.safeParse(input)` returns `{success, data|error}`.
- **Biome**: a Rust-built linter+formatter that replaces ESLint+Prettier.
- **pnpm**: a fast, content-addressed package manager.
- **POP**: Point of Presence — a Cloudflare data center location.
- **Tail Worker**: a Worker that receives logs/events from another Worker for forwarding.
- **DLQ**: Dead Letter Queue — where messages go after exhausting retries.
- **PITR**: Point-in-Time Recovery (Durable Object SQLite, last 30 days).

---

## 21. Update Cadence

- This rulebook is valid for Wrangler 4.x (current 4.79.0), `@cloudflare/vitest-pool-workers` 0.14.x, Vitest 4.1+, Zod 4.3.x, Biome 2.4.x, compatibility date `2026-04-27`.
- Re-run the generator when:
  - Wrangler bumps to 5.x (CLI redesign in progress).
  - Compatibility date is older than 90 days.
  - A new Cloudflare primitive ships (e.g. Containers GA, Vectorize bindings).
  - Sentry deprecates `withSentry` or releases a new SDK major.
  - You add a major external dep that needs new always/never rules.

Last updated: 2026-04-27.
