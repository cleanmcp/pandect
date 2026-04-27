# Phoenix LiveView + Elixir — Rulebook

Real-time, server-rendered web apps with Erlang-grade concurrency, deployed as a single Mix release to Fly.io.

**Stack as of 2026-04-27.** Re-run the generator on any minor bump.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Elixir 1.18.4 | Stable type checker, hardened compiler. |
| Runtime + version | Erlang/OTP 28.5 | LTS, quantum-resistant TLS default. |
| Package manager | Hex (via Mix) | Official; no alternatives in the BEAM world. |
| Build tool | Mix + esbuild + tailwind wrappers | Phoenix-default; zero Node dependency. |
| State mgmt | LiveView assigns + streams + PubSub | Built-in; no Redux equivalent needed. |
| Routing/Nav | Phoenix Router + verified routes (`~p`) | Compile-checked URLs, generators target it. |
| Data layer (db + orm) | PostgreSQL 16 + Ecto 3.13.5 | Phoenix-default; transactional, schema-aware queries. |
| Auth | `mix phx.gen.auth` (scopes + magic links) | First-party generator, scopes secure data access. |
| Styling | Tailwind 3.4 + daisyUI (built into 1.8) | Phoenix-default; dark/light/system out of box. |
| Forms + validation | Ecto changesets + `<.simple_form>` | Phoenix-default; cast/validate/render integrated. |
| Unit test runner | ExUnit | Built into Elixir; parallel by default. |
| E2E framework | PhoenixTest 0.8.2 | Unified API across LiveView + static; no driver. |
| Mocking strategy | Mox + behaviour-bound modules | No global stubs; explicit contracts. |
| Logger | `:logger` (built-in) + JSON formatter | OTP-native; no extra dependency. |
| Error tracking | Sentry (via `sentry` 10.x) | First-party Elixir SDK, OTP integration. |
| Lint + format | `mix format` + Credo 1.7.18 | Format is built-in; Credo is de-facto linter. |
| Type checking | Elixir 1.18 type system + Dialyxir 1.4.7 | Compile-time inference + PLT-based static analysis. |
| Env vars + secrets | `config/runtime.exs` + Fly secrets | Runtime-only; never compile-baked. |
| CI provider | GitHub Actions | Free, ships with Elixir setup action. |
| Deploy target | Fly.io (LiteFS or Postgres) | First-class Phoenix support, 1-command deploy. |
| Release flow | `mix release` via Dockerfile | Self-contained ERTS bundle, no Elixir on server. |
| Auto-update | `fly deploy` rolling | Atomic, blue-green capable. |
| Auth strategy | Scopes (`%Scope{}` struct) | Generators inject authorization by default. |
| Background jobs | Oban 2.21.1 (Postgres-backed) | Transactional, no Redis, dashboard included. |
| Realtime | Phoenix.PubSub (native) | LiveView already uses it; no extra infra. |
| Session storage | Cookie-based, signed | Phoenix-default; encrypts sensitive data. |
| Asset bundling | esbuild 0.25 + tailwind 3.4 (Mix wrappers) | No Node; binaries downloaded by Mix. |
| HTTP client | `Req` 0.5+ | Modern, batteries-included; replaces HTTPoison. |

### Versions Table

| Library | Version | Released | Link |
|---|---|---|---|
| Elixir | 1.18.4 | 2026-02-11 | https://github.com/elixir-lang/elixir/releases |
| Erlang/OTP | 28.5 | 2026-04-23 | https://github.com/erlang/otp/releases |
| Phoenix | 1.8.5 | 2026-03-05 | https://hexdocs.pm/phoenix/changelog.html |
| Phoenix LiveView | 1.1.28 | 2026-03-27 | https://hex.pm/packages/phoenix_live_view |
| Ecto | 3.13.5 | 2026-03-03 | https://hex.pm/packages/ecto |
| ecto_sql | 3.13.5 | 2026-03-03 | https://hex.pm/packages/ecto_sql |
| Postgrex | 0.20.0 | 2026-01-10 | https://hex.pm/packages/postgrex |
| Phoenix.PubSub | 2.1.4 | 2025-09-20 | https://hex.pm/packages/phoenix_pubsub |
| esbuild (wrapper) | 0.10.0 | 2025-12-01 | https://hex.pm/packages/esbuild |
| tailwind (wrapper) | 0.3.1 | 2025-11-15 | https://hex.pm/packages/tailwind |
| heroicons | 2.2.0 | 2025-08-01 | https://github.com/tailwindlabs/heroicons |
| Credo | 1.7.18 | 2026-01-22 | https://hex.pm/packages/credo |
| Sobelow | 0.14.1 | 2026-02-10 | https://hex.pm/packages/sobelow |
| Dialyxir | 1.4.7 | 2025-11-04 | https://hex.pm/packages/dialyxir |
| PhoenixTest | 0.8.2 | 2026-03-05 | https://hex.pm/packages/phoenix_test |
| Oban | 2.21.1 | 2026-03-26 | https://hex.pm/packages/oban |
| Sentry | 10.10.0 | 2026-02-18 | https://hex.pm/packages/sentry |
| Req | 0.5.10 | 2026-02-01 | https://hex.pm/packages/req |
| Bandit | 1.7.0 | 2025-10-15 | https://hex.pm/packages/bandit |
| flyctl | 0.3.x | rolling | https://github.com/superfly/flyctl/releases |

### Minimum Host Requirements

- macOS 13+ / Windows 11 / Ubuntu 22.04+
- 8 GB RAM (16 GB recommended for Dialyzer PLT builds)
- 10 GB free disk
- Internet access for Hex, GitHub, Fly.io

### Cold-Start Time

`git clone` → running app on `localhost:4000`: **~6 minutes** on a fresh machine (asdf install dominates: 4 min Erlang, 1 min Elixir, 1 min `mix deps.get && mix ecto.setup`).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install asdf and version plugins
brew install asdf
echo '. /opt/homebrew/opt/asdf/libexec/asdf.sh' >> ~/.zshrc
source ~/.zshrc

asdf plugin add erlang
asdf plugin add elixir
asdf plugin add nodejs   # Optional; only if you add npm packages

# 3. Install runtimes (uses .tool-versions in repo)
brew install autoconf wxwidgets openssl@3 libxslt fop  # Erlang build deps
asdf install erlang 28.0.5
asdf install elixir 1.18.4-otp-28
asdf global erlang 28.0.5
asdf global elixir 1.18.4-otp-28

# 4. Install Postgres
brew install postgresql@16
brew services start postgresql@16
createuser -s postgres   # role expected by phx.new defaults

# 5. Install flyctl
brew install flyctl

# 6. Hex + Phoenix installer
mix local.hex --force
mix local.rebar --force
mix archive.install hex phx_new 1.8.5 --force
```

### Windows

```powershell
# 1. Install Chocolatey (Admin PowerShell)
Set-ExecutionPolicy Bypass -Scope Process -Force
[System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))

# 2. Install Erlang + Elixir
choco install erlang --version=28.0.5 -y
choco install elixir --version=1.18.4 -y

# 3. Postgres
choco install postgresql16 --params '/Password:postgres' -y

# 4. flyctl
iwr https://fly.io/install.ps1 -useb | iex

# 5. Hex + Phoenix
mix local.hex --force
mix local.rebar --force
mix archive.install hex phx_new 1.8.5 --force
```

### Linux (Ubuntu / Debian)

```bash
# 1. asdf
sudo apt update
sudo apt install -y curl git build-essential autoconf m4 libncurses-dev \
  libwxgtk3.2-dev libwxgtk-webview3.2-dev libgl1-mesa-dev libglu1-mesa-dev \
  libpng-dev libssh-dev unixodbc-dev xsltproc fop libxml2-utils libncurses5-dev \
  openjdk-17-jdk

git clone https://github.com/asdf-vm/asdf.git ~/.asdf --branch v0.14.0
echo '. "$HOME/.asdf/asdf.sh"' >> ~/.bashrc
source ~/.bashrc

asdf plugin add erlang
asdf plugin add elixir
asdf install erlang 28.0.5
asdf install elixir 1.18.4-otp-28
asdf global erlang 28.0.5
asdf global elixir 1.18.4-otp-28

# 2. Postgres
sudo apt install -y postgresql-16
sudo -u postgres createuser -s "$USER"
sudo -u postgres createdb "$USER"

# 3. flyctl
curl -L https://fly.io/install.sh | sh

# 4. Hex + Phoenix
mix local.hex --force
mix local.rebar --force
mix archive.install hex phx_new 1.8.5 --force
```

### Required Accounts

| Service | URL | What you need |
|---|---|---|
| GitHub | https://github.com | Account + SSH key for `git push` |
| Fly.io | https://fly.io/app/sign-up | Free tier; credit card required after launch |
| Sentry (optional) | https://sentry.io/signup/ | DSN for error tracking |

### CLI Auth

```bash
gh auth login        # GitHub CLI
fly auth login       # Fly.io
```

### Bootstrap Commands

```bash
# Create the app (with auth, magic links, scopes)
mix phx.new my_app --binary-id --database postgres --live
cd my_app

# Setup DB
mix ecto.create
mix ecto.migrate

# Generate auth (magic links + password + scopes)
mix phx.gen.auth Accounts User users
mix deps.get
mix ecto.migrate

# Initial run
mix phx.server
```

### Expected First-Run Output

```
[info] Running MyAppWeb.Endpoint with Bandit 1.7.0 at 127.0.0.1:4000 (http)
[info] Access MyAppWeb.Endpoint at http://localhost:4000
[watch] build finished, watching for changes...
```

Browser to `http://localhost:4000` shows a Phoenix welcome page with daisyUI styling.

### Common First-Run Errors

| Error | Fix |
|---|---|
| `** (Mix) Could not start application postgrex: ... :econnrefused` | `brew services start postgresql@16` (mac) / `sudo systemctl start postgresql` (linux) |
| `password authentication failed for user "postgres"` | Edit `config/dev.exs` `username:` to your OS user, or `ALTER USER postgres WITH PASSWORD 'postgres'` |
| `Erlang/OTP 28 has not been compiled with` | `asdf plugin update erlang && asdf install erlang 28.0.5` |
| `:could not compile dependency :ssl_verify_fun` | Install `openssl@3`; on Linux add `libssl-dev` |
| `phx.new : command not found` | `mix archive.install hex phx_new 1.8.5 --force` |
| Browser shows blank page after upgrade | `rm -rf _build deps && mix deps.get && mix compile` |
| `(DBConnection.ConnectionError) connection not available` | DB pool too small; bump `:pool_size` in `config/runtime.exs` |

---

## 3. Project Layout

```
my_app/
├── _build/                       # Compiled artifacts (gitignored)
├── assets/
│   ├── css/
│   │   └── app.css               # Tailwind entry; @import statements
│   ├── js/
│   │   ├── app.js                # LiveSocket entry, hooks registry
│   │   └── hooks/                # Custom JS hooks (one file per hook)
│   ├── tailwind.config.js
│   ├── package.json              # Optional; only if importing JS libs
│   └── vendor/
│       └── topbar.js             # Page transition spinner
├── config/
│   ├── config.exs                # Compile-time, all envs
│   ├── dev.exs                   # Compile-time dev only
│   ├── prod.exs                  # Compile-time prod only
│   ├── runtime.exs               # Runtime config (secrets!)
│   └── test.exs                  # Compile-time test only
├── deps/                         # Mix-installed deps (gitignored)
├── lib/
│   ├── my_app/                   # "Context" layer; pure business logic
│   │   ├── application.ex        # OTP supervision tree
│   │   ├── repo.ex               # Ecto.Repo
│   │   ├── accounts.ex           # Public API for accounts context
│   │   ├── accounts/
│   │   │   ├── user.ex           # Schema + changesets
│   │   │   ├── user_token.ex
│   │   │   └── scope.ex          # %Scope{} for authorization
│   │   ├── mailer.ex
│   │   └── release.ex            # Release tasks (migrate, rollback)
│   └── my_app_web/               # Web layer; controllers, LiveViews, templates
│       ├── components/
│       │   ├── core_components.ex  # Phoenix.Component primitives
│       │   └── layouts.ex
│       ├── controllers/
│       ├── live/                 # LiveView modules
│       ├── endpoint.ex
│       ├── router.ex
│       ├── telemetry.ex
│       └── user_auth.ex          # Plug + on_mount hooks for auth
├── priv/
│   ├── repo/
│   │   ├── migrations/           # Timestamped Ecto migrations
│   │   └── seeds.exs
│   ├── static/                   # Compiled assets land here (gitignored)
│   ├── gettext/                  # Translation files
│   └── plts/                     # Dialyzer PLTs (gitignored)
├── test/
│   ├── my_app/                   # Context tests
│   ├── my_app_web/               # LiveView, controller tests
│   ├── support/                  # Test helpers, fixtures, conn case
│   └── test_helper.exs
├── .credo.exs
├── .formatter.exs
├── .github/workflows/ci.yml
├── .gitignore
├── .tool-versions                # asdf pin
├── AGENTS.md
├── CLAUDE.md
├── Dockerfile                    # Generated by mix phx.gen.release
├── fly.toml                      # Fly.io app config
├── mix.exs
├── mix.lock
└── README.md
```

### Naming Conventions

| Artifact | Naming | Path |
|---|---|---|
| Module file | `snake_case.ex` containing `CamelCase.Module` | matches dotted module path |
| LiveView | `MyAppWeb.PostLive.Index` → `post_live/index.ex` | `lib/my_app_web/live/` |
| Schema | singular `User` | `lib/my_app/<context>/user.ex` |
| Context | plural domain noun: `Accounts`, `Posts` | `lib/my_app/accounts.ex` |
| Migration | `YYYYMMDDHHMMSS_create_users.exs` | `priv/repo/migrations/` |
| Test | mirrors source path with `_test.exs` suffix | `test/...` |
| Component | `<.button>` → `MyAppWeb.CoreComponents.button/1` | `core_components.ex` |
| Hook (JS) | `Hook = { mounted() {...} }` | `assets/js/hooks/<hook_name>.js` |

### "If you're adding X, it goes in Y"

| Adding... | Goes in... |
|---|---|
| New URL | `lib/my_app_web/router.ex` (then verified with `~p`) |
| New table | `mix ecto.gen.migration <name>` → `priv/repo/migrations/` |
| New schema | `lib/my_app/<context>/<name>.ex` |
| New context function | `lib/my_app/<context>.ex` (NOT in schema) |
| New LiveView page | `lib/my_app_web/live/<feature>_live/` |
| New form component | `lib/my_app_web/components/core_components.ex` |
| New layout | `lib/my_app_web/components/layouts/<name>.html.heex` |
| New JS hook | `assets/js/hooks/<name>.js` + register in `app.js` |
| New CSS rule | `assets/css/app.css` (use `@apply` over raw selectors) |
| New env var | `config/runtime.exs` + Fly secret (`fly secrets set`) |
| New compile-time constant | `config/config.exs` |
| New background job | `lib/my_app/workers/<name>_worker.ex` (Oban worker) |
| New PubSub topic | `lib/my_app/<context>.ex` (subscribe + broadcast helpers) |
| New email | `lib/my_app/mailer.ex` consumer + `lib/my_app/mails/` |
| New mock for tests | `test/support/mocks.ex` (Mox.defmock) |
| New Plug | `lib/my_app_web/plugs/<name>.ex` |
| New release task | `lib/my_app/release.ex` |

---

## 4. Architecture

### Process Boundaries

```
+------------------+      WebSocket / HTTP       +-------------------------+
|   Browser (JS)   | <-------------------------> |  Bandit (HTTP/WS)       |
|  LiveSocket+     |                             |  MyAppWeb.Endpoint      |
|  hooks           |                             +-----------+-------------+
+------------------+                                         |
                                                              v
                                              +-----------------------------+
                                              |  Router → Plug pipeline     |
                                              |  → LiveView OR Controller   |
                                              +--------------+--------------+
                                                             |
                                       (one BEAM process per LiveView session)
                                                             v
                                              +-----------------------------+
                                              |  Context modules (lib/my_app)
                                              |  - call Repo                |
                                              |  - publish PubSub events    |
                                              |  - enqueue Oban jobs        |
                                              +-------+--------+------------+
                                                      |        |
                                                      v        v
                                          +-----------------+ +----------------+
                                          | Ecto Repo       | | Phoenix.PubSub |
                                          | (Postgrex pool) | | (process group)|
                                          +--------+--------+ +-------+--------+
                                                   |                  |
                                                   v                  v
                                          +-----------------+ +----------------+
                                          |  PostgreSQL 16  | | Other LiveViews|
                                          +-----------------+ | (broadcast in) |
                                                              +----------------+
```

### Data Flow (Typical Action)

```
User clicks "Save" button in browser
    |
    v
phx-click="save" sent over WebSocket  --->  LiveView process
                                            handle_event("save", params, socket)
                                              |
                                              v
                                            Accounts.create_user(scope, params)
                                              |              |
                                       Ecto.Multi          PubSub.broadcast(:users, {:created, user})
                                              |
                                              v
                                            Repo INSERT ↩ user
                                              |
                                              v
                                       {:noreply, assign(socket, ...)}  ---> diff sent over WS
                                                                              v
                                                                          DOM patch in browser
```

### Auth Flow (magic links + scopes)

```
1. POST /users/log_in_with_email  { email }
   → AccountsController generates token, emails magic link
2. GET /users/log_in/<token>
   → validates token, sets session, redirects to /
3. on_mount {UserAuth, :require_authenticated}
   → loads %Scope{user: ...} from session into socket.assigns.current_scope
4. Every context call: Accounts.list_posts(scope) — repo query filters by scope.user_id
5. POST /users/log_out → clears session token
```

### State Management Flow

```
LiveView assigns          --(stream/4)-->   surgical DOM patches for collections
LiveView assigns          --(diff)-->       attribute/text patches for scalars
PubSub.broadcast          --(handle_info)-> assigns update in N LiveViews simultaneously
Oban Job completes        --(notify)-->    PubSub broadcast --> LiveView assigns
```

### Entry-Point File Map

| File | Responsibility |
|---|---|
| `lib/my_app/application.ex` | OTP supervision tree; starts Repo, PubSub, Endpoint, Oban, Finch |
| `lib/my_app_web/endpoint.ex` | Plug pipeline for static, session, sockets |
| `lib/my_app_web/router.ex` | URL → LiveView/controller mapping; pipelines |
| `lib/my_app_web/user_auth.ex` | Auth plug + LiveView `on_mount` hooks |
| `lib/my_app_web/components/core_components.ex` | Reusable HEEx components |
| `lib/my_app_web/telemetry.ex` | Metrics emission |
| `config/runtime.exs` | All env-var-driven config (DB URL, secrets, Sentry DSN) |

### Where Business Logic Lives (and Doesn't)

- **Lives in:** `lib/my_app/<context>.ex` modules. Pure functions, takes `%Scope{}` first.
- **Never lives in:** LiveView modules, controllers, schemas, templates, views.
- **Schemas hold:** field declarations, `changeset/2` validations, associations. Nothing else.
- **LiveViews hold:** `mount/3`, `handle_event/3`, `handle_info/2`, `render/1`. They call context functions; they don't query the DB directly.

---

## 5. Dev Workflow

### Start Dev Server

```bash
mix phx.server
```

Watchers (parallel):
- **esbuild** → recompiles `assets/js/app.js` on save
- **tailwind** → rebuilds `assets/css/app.css` on save
- **Phoenix code reloader** → recompiles `.ex` files on save (per-module)

LiveView pages reconnect automatically; reload only on `.heex` macro changes that affect compile output.

### Hot Reload Breaks When

- You change `mix.exs` (new dep) → run `mix deps.get && mix compile`.
- You change `config/*.exs` → restart server.
- You change a macro definition used at compile time → restart server.
- You add a new `priv/repo/migrations/*.exs` → `mix ecto.migrate` then refresh browser.

### Attach Debugger

**VS Code / Cursor** (`.vscode/launch.json` shipped below):
1. Install **ElixirLS** extension.
2. Set breakpoint in any `.ex` file.
3. F5 → "mix phx.server (debug)".

**IEx console while server runs:**
```bash
iex -S mix phx.server
# In iex:
:observer.start()    # OTP process inspector
recompile()          # Force recompile all
```

### Inspect at Runtime

| Surface | Tool |
|---|---|
| WebSocket frames | Chrome DevTools → Network → WS → Messages |
| LiveView assigns | `Phoenix.LiveView.JS.dispatch("phx:debug")` then `IO.inspect/2` in `mount` |
| Process tree | `:observer.start()` (X11 / VcXsrv on WSL) |
| Live dashboard | http://localhost:4000/dev/dashboard |
| DB queries | `:debug` log level shows every query with timing |

### Pre-commit Checks

`.git/hooks/pre-commit` (set up by hook below) runs:
```bash
mix format --check-formatted
mix compile --warnings-as-errors
mix credo --strict
mix test --warnings-as-errors
```

### Branch + Commit Conventions

- Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit subject: imperative ≤72 chars (`add user signup flow`).
- One concern per commit. Body explains *why*, not *what*.

---

## 6. Testing & Parallelization

### Unit Tests

```bash
mix test
```

- Tests live in `test/`, mirroring `lib/`.
- File pattern: `*_test.exs`.
- Parallel by default (`async: true` per case).
- DB tests use `Ecto.Adapters.SQL.Sandbox` for isolated transactions per test.

### Integration / Feature Tests (PhoenixTest)

```bash
mix test test/my_app_web/live/
```

Adds `phoenix_test` dep; works for static pages and LiveViews uniformly:

```elixir
test "user signs up", %{conn: conn} do
  conn
  |> visit("/users/register")
  |> fill_in("Email", with: "a@b.co")
  |> click_button("Register")
  |> assert_has("h1", text: "Welcome")
end
```

### Single Test / File / Watch

```bash
mix test test/my_app/accounts_test.exs:42        # by line
mix test test/my_app/accounts_test.exs           # by file
mix test --only focus                             # by tag @tag :focus
mix test.watch                                    # requires :mix_test_watch dep
```

### Mocking Rules

| Resource | Policy |
|---|---|
| Database | Never mock. Use sandbox + factories (`MyApp.AccountsFactory`). |
| External HTTP | Mock at adapter boundary using Mox + behaviour. |
| Email | Use `Swoosh.Adapters.Test` (built-in); assert via `assert_email_sent/1`. |
| Time | Inject as function arg or use `DateTime` module faker. |
| PubSub | Real PubSub in tests; subscribe in test, assert receive. |
| Oban | `Oban.Testing` — `assert_enqueued/1`, `Oban.drain_queue/1` for sync runs. |

### Coverage

```bash
mix test --cover
```

**Target: 70% line coverage** for `lib/my_app/`. Don't chase coverage for `lib/my_app_web/`.

### Visual Regression

Not used by default for LiveView (DOM is authoritative on the server). If needed, add Percy via Playwright as a separate suite, not part of `mix test`.

### Parallelization Patterns for AI Agents

**Safe to fan out:**
- Generate context module + schema + migration + tests in parallel (different files).
- Add multiple LiveView pages in parallel if they don't share components.
- Run `mix format`, `mix credo`, `mix test` in parallel only if not modifying code between.

**Must be sequential:**
- Anything touching `mix.exs` or `mix.lock` (lockfile is global).
- Anything modifying the same migration timestamp window.
- `mix deps.get` and `mix compile` (must complete before tests).
- PLT generation (`mix dialyzer --plt`) — single global PLT.

---

## 7. Logging

### Logger Setup (already wired by `phx.new`)

`config/config.exs`:
```elixir
config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :module]
```

For prod JSON logs (`config/prod.exs`):
```elixir
config :logger, :default_handler,
  formatter: {LoggerJSON.Formatters.Datadog, metadata: :all}
```

(Add `{:logger_json, "~> 6.0"}` to `mix.exs` if shipping to Datadog/Logflare.)

### Log Levels

| Level | When |
|---|---|
| `:debug` | Per-query, per-render. Off in prod. |
| `:info` | Boot, request in/out, state transitions. |
| `:notice` | Significant business events (signup, payment). |
| `:warning` | Recoverable anomalies (retry, fallback). |
| `:error` | Unhandled exceptions, dropped messages. |
| `:critical` | Process restarts, DB connection lost. |

### Required Metadata Fields

Every log line must carry: `request_id`, `user_id`, `module`, `event`.

Set with `Logger.metadata/1` in `MyAppWeb.UserAuth.fetch_current_scope_for_user/2`:
```elixir
Logger.metadata(user_id: scope.user.id, request_id: conn.assigns.request_id)
```

### Sample Log Lines

```
12:00:00.001 request_id=abc user_id=42 module=MyAppWeb.PostLive [info] event=mount path=/posts
12:00:00.012 request_id=abc user_id=42 module=MyApp.Posts [info] event=list_posts duration_ms=8
12:00:00.014 request_id=abc user_id=42 module=MyAppWeb.PostLive [info] event=render duration_ms=2
12:00:01.500 request_id=def user_id=99 module=MyApp.Posts [warning] event=slow_query duration_ms=420
12:00:05.000 request_id=ghi user_id=42 module=MyApp.Mailer [error] event=send_failed reason=:timeout
```

### Where Logs Go

- **Dev:** stdout. `iex` prints colored.
- **Prod:** stdout (Fly.io captures and forwards). Sentry receives `:error`+ via the `Sentry.LoggerHandler`.

### Grep Logs Locally

```bash
mix phx.server 2>&1 | grep 'event=slow_query'
fly logs --app my-app | grep 'level=error'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `mix format` before declaring a task done.
2. Always run `mix compile --warnings-as-errors` before committing.
3. Always run `mix credo --strict` before committing.
4. Always run `mix test --warnings-as-errors` before committing.
5. Always use `~p"/path"` (verified routes) instead of bare strings for URLs.
6. Always pass `%Scope{}` as the first argument to context functions that touch user data.
7. Always use `stream/4` for any list rendered by LiveView with >50 items.
8. Always wrap blocking work in `Task.async/1` + `Task.await/2` from `handle_event`/`handle_info`; never block the LiveView process.
9. Always read secrets via `System.fetch_env!/1` inside `config/runtime.exs`.
10. Always create migrations via `mix ecto.gen.migration` (gets correct timestamp).
11. Always use Ecto changesets for input validation; never validate raw maps in controllers.
12. Always set `async: true` on `ExUnit.Case` modules unless a test owns global state.
13. Always use `assert_receive`/`refute_receive` over `Process.sleep/1` in tests.
14. Always declare a `behaviour` for any module reached over the network; mock the behaviour with Mox.
15. Always run `mix sobelow --config` before deploying changes that touch routes, params, or file IO.
16. Always store user-provided HTML through `Phoenix.HTML.raw/1` only after explicit sanitization.
17. Always pin every dep version in `mix.exs` with `~>` tilde-pin (e.g. `"~> 1.8.5"`).
18. Always use `mix phx.gen.context`, `mix phx.gen.schema`, `mix phx.gen.live` to scaffold; review and *modify* generated code, don't reimplement.
19. Always add a `@moduledoc` and `@doc` to public modules and functions in contexts.
20. Always use `Req` for HTTP calls in app code; never raw `:httpc` or `HTTPoison`.
21. Always run `mix ecto.migrate` after pulling schema changes; never skip migrations on prod.
22. Always co-locate tests with the module they test (mirror file path under `test/`).

### 8.2 NEVER

1. Never call `Repo.*` from a LiveView, controller, or template — go through a context.
2. Never put secrets in `config/config.exs`, `dev.exs`, or `prod.exs` — runtime.exs only.
3. Never use `Process.sleep/1` in production code.
4. Never call external HTTP APIs synchronously from `handle_event/3`; enqueue an Oban job or `Task.async/1`.
5. Never use `Mix.env()` outside of `config/*.exs` (replaced at compile time, not runtime).
6. Never edit files inside `_build/`, `deps/`, or `priv/static/` by hand.
7. Never use `IO.inspect/2` in committed code; remove before commit.
8. Never use `try/rescue` to swallow errors silently — let it crash and supervise.
9. Never `db push`-style: always create explicit migrations; never edit a migration after it's been run on prod.
10. Never log secrets, tokens, passwords, or PII (use `Logger.metadata` filter or redact).
11. Never bypass scopes — every list/get function in a context must take `scope` first.
12. Never put DOM-mutating logic in JS hooks for state LiveView already owns; let LiveView re-render.
13. Never set a LiveView assign from inside `render/1` (raises in 1.1).
14. Never use `Phoenix.HTML.raw/1` on user input.
15. Never call `Repo.transaction/1` and broadcast PubSub *inside* the transaction; broadcast after it commits.
16. Never use `phoenix_html`'s legacy form helpers (`<%= form_for ... %>`); use `<.simple_form>` and `<.input>` from `core_components.ex`.
17. Never depend on assigns survival across redirects; pass them via `push_navigate` query params or session.
18. Never use atom keys for user input in changesets; cast string keys with `cast/3`.
19. Never use `--no-verify` on `git commit`.
20. Never deploy to prod without `mix sobelow` clean and `mix test` green on CI.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `mix.exs` | Compile + every test | `mix deps.get && mix compile && mix test` |
| `mix.lock` | Reproducibility | `mix deps.get` (no diff after) |
| `config/config.exs` | All envs at compile | `mix compile && mix test` |
| `config/runtime.exs` | Prod runtime | `MIX_ENV=prod mix release && _build/prod/rel/my_app/bin/my_app start` |
| `config/dev.exs` | Dev only | `mix phx.server` boots clean |
| `config/test.exs` | Test only | `mix test` |
| `config/prod.exs` | Prod compile | `MIX_ENV=prod mix compile` |
| `lib/my_app/application.ex` | OTP tree | Boot the app + `:observer.start()` shows tree |
| `lib/my_app_web/endpoint.ex` | All HTTP/WS | `mix phx.server` + curl `/` 200 |
| `lib/my_app_web/router.ex` | URLs | `mix phx.routes` and full test run |
| `lib/my_app/repo.ex` | DB | `mix test` + `mix ecto.migrate --quiet` |
| `lib/my_app/<context>.ex` | All callers of context | `mix test test/my_app/<context>_test.exs` and dependents |
| `lib/my_app/<context>/<schema>.ex` | Migrations + queries | `mix ecto.migrate && mix test` |
| `priv/repo/migrations/*.exs` | DB shape | `mix ecto.rollback && mix ecto.migrate && mix test` |
| `lib/my_app_web/components/core_components.ex` | Every page | `mix test` + manual smoke of 3 pages |
| `lib/my_app_web/user_auth.ex` | Auth | `mix test test/my_app_web/user_auth_test.exs` + manual login |
| `assets/js/app.js` | Browser JS | `mix assets.build` + load `/` in browser |
| `assets/tailwind.config.js` | All styling | `mix assets.build` + visual smoke |
| `Dockerfile` | Production image | `docker build .` then run image |
| `fly.toml` | Deploy | `fly deploy --build-only` then `fly deploy` |
| `.formatter.exs` | All formatting | `mix format --check-formatted` |
| `.credo.exs` | Linting | `mix credo --strict` |
| `lib/my_app/release.ex` | Migrations on deploy | `MIX_ENV=prod mix release && bin/my_app eval "MyApp.Release.migrate()"` |
| `priv/static/` | Production assets | Don't edit; `mix assets.deploy` produces it |
| `.tool-versions` | Local + CI runtimes | `asdf install && mix compile` |

### 8.4 Definition of Done

**Bug fix:**
- [ ] Failing test reproducing the bug is added first (red).
- [ ] Fix makes that test pass (green).
- [ ] `mix format && mix compile --warnings-as-errors && mix credo --strict && mix test` all pass.
- [ ] Manual repro path no longer reproduces.
- [ ] Commit message: `fix: <one line>`.

**New feature:**
- [ ] Context module + schema + migration + LiveView/controller + tests.
- [ ] `mix phx.routes` shows the new URL.
- [ ] PhoenixTest covers the happy path.
- [ ] Auth + scopes correctly enforced (test for unauthorized access returns 403/302).
- [ ] All checks above pass.
- [ ] Capture screenshot if UI; paste as test fixture or PR comment.

**Refactor:**
- [ ] No behaviour change. All existing tests still green without modification.
- [ ] `mix dialyzer` no new warnings.
- [ ] No public API removed without deprecation.

**Dependency bump:**
- [ ] `mix deps.update <dep>` then `mix.lock` committed.
- [ ] Read CHANGELOG of bumped dep.
- [ ] All checks pass.
- [ ] `mix sobelow` and `mix hex.audit` clean.

**Schema change:**
- [ ] New migration via `mix ecto.gen.migration`.
- [ ] Up + down both work: `mix ecto.migrate && mix ecto.rollback && mix ecto.migrate`.
- [ ] All existing tests still green.
- [ ] If destructive (drop column), separate migration in a separate deploy from the code that stops reading it.

**Copy change:**
- [ ] Update `.heex` template only.
- [ ] If translated, update `priv/gettext/*.po` for all locales.
- [ ] `mix gettext.extract --merge`.

### 8.5 Self-Verification Recipe

```bash
# 1. Install
mix deps.get

# 2. Format
mix format --check-formatted

# 3. Compile (warnings = error)
mix compile --warnings-as-errors

# 4. Lint
mix credo --strict

# 5. Security scan
mix sobelow --config

# 6. Type check (slow; run before merge)
mix dialyzer

# 7. Tests
mix test --warnings-as-errors

# 8. Smoke
mix phx.server &
sleep 3
curl -fsS http://localhost:4000/ > /dev/null && echo OK
kill %1
```

Expected output, in order:
- `mix format`: silent (exit 0).
- `mix compile`: `Compiling N files (.ex)\nGenerated my_app app`. No warnings.
- `mix credo`: `... Refactoring opportunities: 0\n... Software design: 0` (or strict-clean).
- `mix sobelow`: `... 0 vulnerabilities found.`
- `mix dialyzer`: `done in 0m...\n done (passed successfully)`.
- `mix test`: `Finished in N seconds\nN tests, 0 failures`.
- Final smoke: `OK`.

### 8.6 Parallelization Patterns

**Disjoint files (safe to fan out to subagents):**
- One agent: scaffold `lib/my_app/posts.ex` + `lib/my_app/posts/post.ex`.
- One agent: scaffold `test/my_app/posts_test.exs`.
- One agent: scaffold `lib/my_app_web/live/post_live/`.

**Shared file (must serialize):**
- `mix.exs` — only one agent edits at a time.
- `lib/my_app_web/router.ex` — one route addition at a time.
- `lib/my_app/application.ex` supervision tree.
- Migration filenames — pre-allocate timestamps.

---

## 9. Stack-Specific Pitfalls

1. **Compile-time env read in `config/config.exs`** — symptom: prod uses dev secret. Cause: env var read at compile, not runtime. Fix: move read to `config/runtime.exs`. Detect: `mix sobelow` flags `Config.HTTPS`/`Config.Secrets`.
2. **Blocking `handle_event`** — symptom: UI freezes for all users on this LiveView. Cause: synchronous HTTP/IO inside callback. Fix: `Task.async/1` and `handle_info({ref, result}, socket)`. Detect: WebSocket frame round-trip > 200ms in DevTools.
3. **List in assigns instead of `stream/4`** — symptom: every update re-sends full list, slow. Cause: `assign(:items, list)` for large collections. Fix: `stream(socket, :items, list)` + `phx-update="stream"` on parent. Detect: WS payload >50KB on small updates.
4. **PubSub broadcast inside transaction** — symptom: subscribers see data that doesn't exist yet. Cause: broadcast before COMMIT. Fix: broadcast in `Repo.transaction/1`'s success branch, after commit. Detect: race in tests using `assert_receive`.
5. **Editing generated migration** — symptom: prod migration runs fine, dev `ecto.rollback && ecto.migrate` fails. Cause: edited migration after run. Fix: never edit a migration that has been deployed; create a new one. Detect: `mix ecto.rollback --to <ts>` errors.
6. **Forgetting `--binary-id`** — symptom: integer PKs leak record counts via URLs. Cause: missed flag at `mix phx.new`. Fix: regenerate or change schema `@primary_key {:id, :binary_id, autogenerate: true}`. Detect: review schema files.
7. **Renderer reads stale assigns** — symptom: page shows old data after server change. Cause: `Phoenix.LiveView.assign_new/3` keeping old value. Fix: use `assign/3` for must-update, `assign_new/3` only for first-mount defaults. Detect: re-mount (refresh) shows correct data; nav doesn't.
8. **Forgetting `mix deps.compile` after Erlang upgrade** — symptom: `:undef` errors at runtime. Cause: stale `_build/` against new BEAM. Fix: `rm -rf _build deps && mix deps.get && mix compile`. Detect: BEAM error on `iex -S mix`.
9. **Hot reload misses `.heex`** — symptom: change doesn't appear. Cause: macro-level template change. Fix: save the LiveView `.ex` file (touch), reload. Detect: `mix phx.server` logs no recompile.
10. **`Phoenix.HTML.raw` on user input** — symptom: stored XSS. Cause: bypassing escape. Fix: never raw user input; sanitize via `HtmlSanitizeEx` if you must. Detect: `mix sobelow` flags `XSS.Raw`.
11. **`String.to_atom/1` on user input** — symptom: atom-table exhaustion crashes BEAM. Cause: each unique input creates a new atom forever. Fix: `String.to_existing_atom/1`. Detect: `mix sobelow` + `mix credo` warn.
12. **JS hook owns state LiveView already has** — symptom: hook diverges from server. Cause: managing local state in `mounted()`. Fix: read from `this.el.dataset.x` set by server, dispatch events back. Detect: refresh page → hook state lost.
13. **N+1 in LiveView render** — symptom: slow first render. Cause: `Enum.map(posts, & &1.user.name)` triggers per-row queries. Fix: `Repo.preload(posts, :user)` in context. Detect: `:debug` log shows N SELECT statements per request.
14. **Forgetting `on_mount` for auth** — symptom: unauthenticated users see authenticated pages. Cause: missed `live_session :authenticated, on_mount: ...`. Fix: wrap LiveViews in `live_session` block in router. Detect: PhoenixTest with no session reaches the page.
15. **Module attribute as cache** — symptom: stale data forever. Cause: `@items load_items()` evaluated once at compile. Fix: function call, not attribute. Detect: data never changes after deploy.
16. **`Application.compile_env` vs `get_env`** — symptom: change to runtime config has no effect. Cause: read with `compile_env` baked in at compile. Fix: `Application.get_env/2` for runtime values. Detect: `:observer` shows `:application_controller` env disagrees with code.
17. **Custom auth instead of `phx.gen.auth`** — symptom: missing CSRF, weak hashing, scope leaks. Cause: agent rewriting from scratch. Fix: regenerate via `mix phx.gen.auth`. Detect: `mix sobelow` flags `Auth`.
18. **Two LiveViews mutating same record** — symptom: lost updates. Cause: read-modify-write race. Fix: optimistic concurrency via `Ecto.Changeset.optimistic_lock/2`. Detect: stale_entry test passes only intermittently.
19. **`assets.deploy` not in CI** — symptom: prod has dev-sized JS/CSS. Cause: forgot to run `mix assets.deploy`. Fix: Dockerfile runs it; CI verifies. Detect: `priv/static/assets/app.js` >100KB.
20. **`fly secrets set` after deploy** — symptom: app can't read new secret. Cause: secret set but no restart. Fix: `fly secrets set FOO=bar` triggers redeploy automatically; if it didn't, `fly apps restart`. Detect: `fly logs` shows `:enoent`.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold boot (release) | ≤2s | `time _build/prod/rel/my_app/bin/my_app start` |
| First HTTP response (TTFB) | ≤80ms | `curl -w '%{time_starttransfer}' http://localhost:4000` |
| LiveView mount | ≤150ms | `LiveDashboard → LiveView Diagnostics` |
| LiveView event round-trip | ≤80ms | DevTools WS frame timing |
| WS payload per update | ≤8KB | DevTools WS Messages → bytes column |
| `priv/static/assets/app.js` | ≤200KB gz | `ls -lh priv/static/assets/app.js.gz` |
| `priv/static/assets/app.css` | ≤80KB gz | `ls -lh priv/static/assets/app.css.gz` |
| RAM per LiveView session | ≤2MB | `:observer` → process memory column |
| Postgres connection pool | ≥10, ≤30 | `:pool_size` in runtime.exs |

**When exceeded:**
- Slow mount: profile via `LiveDashboard → ETS / Process` or `:fprof`.
- Big WS payload: switch lists to `stream/4`; reduce assign breadth via `temporary_assigns: [:items]`.
- Big JS bundle: `mix esbuild default --analyze` (via `--metafile`).
- Memory creep: `:recon.bin_leak/1`, `Process.info(pid, :memory)`.

---

## 11. Security

### Secret Storage

| Where | What |
|---|---|
| `config/runtime.exs` | Read all secrets via `System.fetch_env!/1`. |
| Fly.io secrets | Production secrets — `fly secrets set DATABASE_URL=...`. Encrypted at rest. |
| `.env` (dev) | Local-only file, gitignored. Source via `direnv` or `dotenv` shell. |
| **NEVER** | `config/config.exs`, `config/dev.exs`, `config/prod.exs`, source code, Dockerfile. |

### Auth Threat Model

- Sessions are signed cookies (default) — tampering detected, content not encrypted unless you call `put_session/2` for sensitive values.
- Magic-link tokens expire in 1h, single-use, hashed in DB (only the hash is stored).
- Scope-based authorization: every context fn that reads/writes user data takes `%Scope{}` first; queries filter by `scope.user_id`.
- CSRF: enabled by default for browser pipelines via `protect_from_forgery` plug; LiveView channels carry CSRF token in WS upgrade.
- Rate limiting: not built-in; add `Hammer` for brute-force protection on login.

### Input Validation Boundary

- Boundary = controller / LiveView. Convert raw params into changesets (`Ecto.Changeset`) immediately.
- Contexts trust their callers; they do not re-validate. They DO trust *only* `%Scope{}` for auth.

### Output Escaping

- HEEx `<%= var %>` auto-escapes HTML. Never bypass.
- `Phoenix.HTML.raw/1`: forbidden on user input.
- For Markdown: use `Earmark` then sanitize with `HtmlSanitizeEx`.

### Sobelow Scan

```bash
mix sobelow --config
```

Configured via `.sobelow-conf`:
```elixir
[
  verbose: false,
  private: false,
  skip: false,
  router: "lib/my_app_web/router.ex",
  exit: "high",
  format: "txt"
]
```

Failed scan = blocked deploy.

### Dependency Audit

```bash
mix hex.audit              # checks for retired Hex packages
mix deps.audit             # via :mix_audit dep, checks for known CVEs
```

Cadence: weekly via CI cron.

### Top 5 Stack-Specific Risks

1. **Compile-time secret leak** — env var read in `config/*.exs` (not `runtime.exs`) embeds the value into the release. Fix: runtime.exs only.
2. **Atom-table DOS** — `String.to_atom/1` on user input exhausts the BEAM atom table (~1M cap). Fix: `to_existing_atom`.
3. **Mass-assignment via changeset** — `cast(params, [:role])` lets a user promote themselves admin. Fix: never include privilege fields in user-facing changesets; use a separate admin changeset.
4. **CSRF on LiveView form** — forgetting `<.simple_form>` (which auto-includes the CSRF input) breaks WS auth. Fix: always use the component.
5. **Public PubSub topics** — `subscribe(MyApp.PubSub, "user:#{any_id}")` reveals presence/data. Fix: scope topics to `current_scope.user.id` server-side; never accept topic name from client.

---

## 12. Deploy

### Full Release Flow

```bash
# 1. Set up Fly app once
fly launch --no-deploy            # answers: yes Postgres, yes Redis(no for now)

# 2. Generate Dockerfile + release configs (idempotent)
mix phx.gen.release --docker

# 3. Set secrets
fly secrets set \
  SECRET_KEY_BASE="$(mix phx.gen.secret)" \
  DATABASE_URL="postgres://..."  # Fly Postgres provides via attach
  PHX_HOST="my-app.fly.dev"

# 4. Deploy
fly deploy

# 5. Run migrations (one-shot)
fly ssh console --command "/app/bin/my_app eval 'MyApp.Release.migrate()'"

# 6. Verify
curl -fsS https://my-app.fly.dev/health || echo FAIL
fly logs --app my-app | head -50
```

### Staging vs Prod Separation

Two Fly apps: `my-app` and `my-app-staging`. Separate Postgres clusters. Same Dockerfile.

```bash
fly deploy --app my-app-staging
fly deploy --app my-app
```

### Rollback

```bash
fly releases --app my-app
fly deploy --image registry.fly.io/my-app:deployment-XXXX
```

Max safe rollback window: **24h** (DB migrations only safe if you used additive migrations and didn't drop columns).

### Health Check

`fly.toml`:
```toml
[[services.http_checks]]
  interval = "10s"
  grace_period = "5s"
  method = "get"
  path = "/health"
  protocol = "http"
  timeout = "2s"
```

Add the route in `router.ex`:
```elixir
get "/health", HealthController, :index
```

### Versioning

`mix.exs`:
```elixir
version: "0.1.0"
```

Bump on every prod deploy. Convention: SemVer.

### Auto-Update / Submission Flow

Web — no store submission. `fly deploy` is atomic blue-green. To trigger from CI:

```yaml
# .github/workflows/deploy.yml
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: superfly/flyctl-actions/setup-flyctl@v1
      - run: flyctl deploy --remote-only
        env:
          FLY_API_TOKEN: ${{ secrets.FLY_API_TOKEN }}
```

### DNS

```bash
fly certs add example.com --app my-app
# Then add A/AAAA records as printed by:
fly ips list --app my-app
```

### Cost (1k MAU)

- Fly.io: 1 shared-cpu-1x VM (256 MB) + Fly Postgres (1 GB) ≈ **$0–5/mo** (free tier).
- 10k MAU: scale to 2x shared-cpu-2x + Postgres 4 GB ≈ **$25/mo**.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste into project root)

```markdown
# CLAUDE.md — Phoenix LiveView project

This project follows `/opt/Loopa/rulebooks/phoenix-liveview.md`. Read it before starting any task.

## Stack pin
- Elixir 1.18.4 / Erlang OTP 28.5 / Phoenix 1.8.5 / LiveView 1.1.28
- Postgres 16 / Ecto 3.13.5
- Deploy: Fly.io via `mix release` Docker image

## Commands you'll run constantly
- `mix phx.server` — dev server
- `mix test` — run tests
- `mix format` — format code
- `mix credo --strict` — lint
- `mix sobelow --config` — security
- `mix ecto.gen.migration <name>` — new migration
- `mix ecto.migrate` / `mix ecto.rollback`
- `mix phx.gen.live <Context> <Schema> <plural>` — scaffold
- `mix phx.routes` — list routes
- `fly deploy` — deploy

## Banned patterns
- `Repo.*` calls outside `lib/my_app/<context>.ex`
- Reading env vars in `config/config.exs`, `dev.exs`, or `prod.exs`
- `Phoenix.HTML.raw` on user input
- `String.to_atom` on user input
- `Process.sleep` in production code
- Editing migrations that have been deployed
- Bypassing `%Scope{}` in context fns

## Workflow
1. Read the relevant rulebook section before non-trivial work.
2. Always run `mix format && mix compile --warnings-as-errors && mix credo --strict && mix test` before declaring done.
3. Use `/test-driven-development` for features, `/systematic-debugging` for bugs.
4. Use `/verification-before-completion` before claiming a task done.

## Self-test
Run `mix test --warnings-as-errors` and confirm `0 failures` before any PR.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(mix format:*)",
      "Bash(mix compile:*)",
      "Bash(mix credo:*)",
      "Bash(mix test:*)",
      "Bash(mix deps.get)",
      "Bash(mix deps.compile)",
      "Bash(mix ecto.create)",
      "Bash(mix ecto.migrate)",
      "Bash(mix ecto.rollback)",
      "Bash(mix ecto.gen.migration:*)",
      "Bash(mix phx.routes)",
      "Bash(mix phx.gen.context:*)",
      "Bash(mix phx.gen.schema:*)",
      "Bash(mix phx.gen.live:*)",
      "Bash(mix phx.gen.html:*)",
      "Bash(mix phx.gen.auth:*)",
      "Bash(mix phx.gen.release:*)",
      "Bash(mix sobelow:*)",
      "Bash(mix dialyzer:*)",
      "Bash(mix hex.audit)",
      "Bash(mix deps.audit)",
      "Bash(mix assets.build)",
      "Bash(mix assets.deploy)",
      "Bash(iex -S mix)",
      "Bash(fly status)",
      "Bash(fly logs:*)",
      "Bash(fly deploy:*)",
      "Bash(fly secrets list)",
      "Bash(curl -fsS http://localhost:4000:*)",
      "Bash(grep:*)",
      "Bash(rg:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(fly destroy:*)",
      "Bash(fly secrets unset:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "mix format $CLAUDE_FILE_PATH 2>/dev/null || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "mix compile --warnings-as-errors 2>&1 | tail -20"
          }
        ]
      }
    ]
  }
}
```

### Recommended Skills

| Situation | Skill |
|---|---|
| Implementing a new feature | `/test-driven-development` |
| Debugging an error | `/systematic-debugging` |
| Before claiming done | `/verification-before-completion` |
| Before merging | `/review` |
| Shipping to prod | `/ship` then `/land-and-deploy` |
| Pre-implementation plan review | `/plan-eng-review` |

---

## 14. Codex Integration

### `AGENTS.md` (paste into project root)

```markdown
# AGENTS.md — Phoenix LiveView project

You are working on a Phoenix 1.8 + LiveView 1.1 + Elixir 1.18 + Postgres app. The full rulebook is at `/opt/Loopa/rulebooks/phoenix-liveview.md`. Read it.

## Hard rules
- Never call `Repo.*` outside a context module under `lib/my_app/`.
- Never read secrets in compile-time configs; use `config/runtime.exs`.
- Never use `Phoenix.HTML.raw/1` on user input.
- Never block the LiveView process (no sync HTTP / IO inside `handle_event`).
- Always run `mix format && mix compile --warnings-as-errors && mix credo --strict && mix test` before claiming done.
- Always use `mix phx.gen.*` to scaffold, then customize.
- Always pass `%Scope{}` first to context fns that touch user data.

## Scaffolding
- New CRUD: `mix phx.gen.live Context Schema plural ...`
- New migration: `mix ecto.gen.migration <name>`
- New auth: `mix phx.gen.auth Accounts User users` (only once)

## Verification
The full self-verification recipe is in §8.5 of the rulebook. Run it before declaring done.
```

### `.codex/config.toml`

```toml
model = "o3-mini"  # or codex's current default
sandbox = "workspace-write"
approval_mode = "on-failure"

[shell]
allowed = [
  "mix format",
  "mix compile --warnings-as-errors",
  "mix credo --strict",
  "mix test",
  "mix sobelow --config",
  "mix deps.get",
  "mix ecto.migrate",
  "mix ecto.rollback",
  "mix phx.routes",
  "iex -S mix",
  "fly logs",
  "fly status",
  "rg",
  "grep",
  "ls",
  "cat",
]
```

### Codex vs Claude Code Differences

- Codex defaults to a single thread; spawn one task at a time. Compensate by writing more granular subtasks into AGENTS.md.
- Codex doesn't have hooks; rely on the pre-commit Git hook (see §16) instead.
- Codex sandbox blocks `fly deploy` by default — use `approval_mode = "on-failure"` for deploys.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```text
You are working on a Phoenix LiveView app. The rulebook is `/opt/Loopa/rulebooks/phoenix-liveview.md`.

ALWAYS:
- Run `mix format` after editing .ex/.exs/.heex files.
- Use `mix phx.gen.*` to scaffold.
- Use `~p"/path"` (verified routes) for all URLs.
- Pass `%Scope{}` first to context functions handling user data.
- Use `stream/4` for lists with >50 items.
- Use `Task.async/1` for blocking work in LiveView callbacks.
- Read secrets only in `config/runtime.exs`.

NEVER:
- Call `Repo.*` outside `lib/my_app/<context>.ex`.
- Use `Phoenix.HTML.raw/1` on user input.
- Use `String.to_atom/1` on user input.
- Edit a migration that has been deployed.
- Block the LiveView process with synchronous IO.
- Put secrets in `config/config.exs`, `dev.exs`, or `prod.exs`.

VERIFY before claiming done:
mix format --check-formatted
mix compile --warnings-as-errors
mix credo --strict
mix sobelow --config
mix test --warnings-as-errors
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "JakeBecker.elixir-ls",
    "phoenixframework.phoenix",
    "bradlc.vscode-tailwindcss",
    "EditorConfig.EditorConfig",
    "esbenp.prettier-vscode",
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
      "type": "mix_task",
      "name": "mix phx.server (debug)",
      "request": "launch",
      "task": "phx.server",
      "projectDir": "${workspaceFolder}"
    },
    {
      "type": "mix_task",
      "name": "mix test (debug)",
      "request": "launch",
      "task": "test",
      "taskArgs": ["--trace"],
      "startApps": true,
      "projectDir": "${workspaceFolder}",
      "requireFiles": [
        "test/**/test_helper.exs",
        "test/**/*_test.exs"
      ]
    }
  ]
}
```

---

## 16. First-PR Scaffold

Run, in order:

```bash
mix archive.install hex phx_new 1.8.5 --force
mix phx.new my_app --binary-id --database postgres --live
cd my_app
mix ecto.create
mix phx.gen.auth Accounts User users
mix deps.get
mix ecto.migrate
git init
```

Then create the following files (full contents shown).

### `.tool-versions`

```
elixir 1.18.4-otp-28
erlang 28.0.5
```

### `mix.exs`

```elixir
defmodule MyApp.MixProject do
  use Mix.Project

  def project do
    [
      app: :my_app,
      version: "0.1.0",
      elixir: "~> 1.18",
      elixirc_paths: elixirc_paths(Mix.env()),
      start_permanent: Mix.env() == :prod,
      aliases: aliases(),
      deps: deps(),
      dialyzer: [plt_add_apps: [:mix, :ex_unit], plt_file: {:no_warn, "priv/plts/dialyzer.plt"}]
    ]
  end

  def application do
    [
      mod: {MyApp.Application, []},
      extra_applications: [:logger, :runtime_tools]
    ]
  end

  defp elixirc_paths(:test), do: ["lib", "test/support"]
  defp elixirc_paths(_), do: ["lib"]

  defp deps do
    [
      {:phoenix, "~> 1.8.5"},
      {:phoenix_ecto, "~> 4.6"},
      {:ecto_sql, "~> 3.13"},
      {:postgrex, "~> 0.20"},
      {:phoenix_html, "~> 4.2"},
      {:phoenix_live_reload, "~> 1.5", only: :dev},
      {:phoenix_live_view, "~> 1.1.28"},
      {:floki, ">= 0.30.0", only: :test},
      {:phoenix_test, "~> 0.8.2", only: :test, runtime: false},
      {:esbuild, "~> 0.10", runtime: Mix.env() == :dev},
      {:tailwind, "~> 0.3", runtime: Mix.env() == :dev},
      {:heroicons,
       github: "tailwindlabs/heroicons", tag: "v2.2.0", sparse: "optimized",
       app: false, compile: false, depth: 1},
      {:swoosh, "~> 1.18"},
      {:finch, "~> 0.19"},
      {:req, "~> 0.5"},
      {:telemetry_metrics, "~> 1.0"},
      {:telemetry_poller, "~> 1.1"},
      {:gettext, "~> 0.26"},
      {:jason, "~> 1.4"},
      {:dns_cluster, "~> 0.2"},
      {:bandit, "~> 1.7"},
      {:bcrypt_elixir, "~> 3.2"},
      {:oban, "~> 2.21"},
      {:sentry, "~> 10.10"},
      {:credo, "~> 1.7", only: [:dev, :test], runtime: false},
      {:sobelow, "~> 0.14", only: [:dev, :test], runtime: false},
      {:dialyxir, "~> 1.4", only: [:dev, :test], runtime: false},
      {:mix_test_watch, "~> 1.2", only: [:dev, :test], runtime: false}
    ]
  end

  defp aliases do
    [
      setup: ["deps.get", "ecto.setup", "assets.setup", "assets.build"],
      "ecto.setup": ["ecto.create", "ecto.migrate", "run priv/repo/seeds.exs"],
      "ecto.reset": ["ecto.drop", "ecto.setup"],
      test: ["ecto.create --quiet", "ecto.migrate --quiet", "test"],
      "assets.setup": ["tailwind.install --if-missing", "esbuild.install --if-missing"],
      "assets.build": ["tailwind my_app", "esbuild my_app"],
      "assets.deploy": [
        "tailwind my_app --minify",
        "esbuild my_app --minify",
        "phx.digest"
      ]
    ]
  end
end
```

### `config/config.exs`

```elixir
import Config

config :my_app,
  ecto_repos: [MyApp.Repo],
  generators: [timestamp_type: :utc_datetime, binary_id: true]

config :my_app, MyAppWeb.Endpoint,
  url: [host: "localhost"],
  adapter: Bandit.PhoenixAdapter,
  render_errors: [
    formats: [html: MyAppWeb.ErrorHTML, json: MyAppWeb.ErrorJSON],
    layout: false
  ],
  pubsub_server: MyApp.PubSub,
  live_view: [signing_salt: "REPLACE_ME"]

config :my_app, MyApp.Mailer, adapter: Swoosh.Adapters.Local

config :esbuild,
  version: "0.25.0",
  my_app: [
    args: ~w(js/app.js --bundle --target=es2022 --outdir=../priv/static/assets/js --external:/fonts/* --external:/images/*),
    cd: Path.expand("../assets", __DIR__),
    env: %{"NODE_PATH" => Path.expand("../deps", __DIR__)}
  ]

config :tailwind,
  version: "3.4.17",
  my_app: [
    args: ~w(--config=tailwind.config.js --input=css/app.css --output=../priv/static/assets/css/app.css),
    cd: Path.expand("../assets", __DIR__)
  ]

config :logger, :default_formatter,
  format: "$time $metadata[$level] $message\n",
  metadata: [:request_id, :user_id, :module]

config :phoenix, :json_library, Jason

config :my_app, Oban,
  engine: Oban.Engines.Basic,
  queues: [default: 10, mailers: 5],
  repo: MyApp.Repo

import_config "#{config_env()}.exs"
```

### `config/dev.exs`

```elixir
import Config

config :my_app, MyApp.Repo,
  username: "postgres",
  password: "postgres",
  hostname: "localhost",
  database: "my_app_dev",
  stacktrace: true,
  show_sensitive_data_on_connection_error: true,
  pool_size: 10

config :my_app, MyAppWeb.Endpoint,
  http: [ip: {127, 0, 0, 1}, port: 4000],
  check_origin: false,
  code_reloader: true,
  debug_errors: true,
  secret_key_base: "REPLACE_ME_WITH_64_CHARS_FROM_mix_phx.gen.secret",
  watchers: [
    esbuild: {Esbuild, :install_and_run, [:my_app, ~w(--sourcemap=inline --watch)]},
    tailwind: {Tailwind, :install_and_run, [:my_app, ~w(--watch)]}
  ],
  live_reload: [
    patterns: [
      ~r"priv/static/(?!uploads/).*(js|css|png|jpeg|jpg|gif|svg)$",
      ~r"priv/gettext/.*(po)$",
      ~r"lib/my_app_web/(controllers|live|components)/.*(ex|heex)$"
    ]
  ]

config :my_app, dev_routes: true
config :logger, :default_formatter, format: "[$level] $message\n"
config :phoenix, :stacktrace_depth, 20
config :phoenix, :plug_init_mode, :runtime
config :phoenix_live_view, :debug_heex_annotations, true
config :swoosh, :api_client, false
```

### `config/prod.exs`

```elixir
import Config

config :my_app, MyAppWeb.Endpoint, cache_static_manifest: "priv/static/cache_manifest.json"
config :swoosh, api_client: Swoosh.ApiClient.Finch, finch_name: MyApp.Finch
config :swoosh, local: false
config :logger, level: :info, default_formatter: [format: "$time $metadata[$level] $message\n"]
```

### `config/runtime.exs`

```elixir
import Config

if System.get_env("PHX_SERVER") do
  config :my_app, MyAppWeb.Endpoint, server: true
end

if config_env() == :prod do
  database_url =
    System.get_env("DATABASE_URL") ||
      raise "DATABASE_URL not set"

  config :my_app, MyApp.Repo,
    url: database_url,
    pool_size: String.to_integer(System.get_env("POOL_SIZE") || "10"),
    socket_options: [:inet6]

  secret_key_base =
    System.get_env("SECRET_KEY_BASE") ||
      raise "SECRET_KEY_BASE not set; generate via `mix phx.gen.secret`"

  host = System.get_env("PHX_HOST") || "example.com"
  port = String.to_integer(System.get_env("PORT") || "4000")

  config :my_app, :dns_cluster_query, System.get_env("DNS_CLUSTER_QUERY")

  config :my_app, MyAppWeb.Endpoint,
    url: [host: host, port: 443, scheme: "https"],
    http: [ip: {0, 0, 0, 0, 0, 0, 0, 0}, port: port],
    secret_key_base: secret_key_base

  if sentry_dsn = System.get_env("SENTRY_DSN") do
    config :sentry,
      dsn: sentry_dsn,
      environment_name: :prod,
      enable_source_code_context: true,
      root_source_code_paths: [File.cwd!()]
  end
end
```

### `fly.toml`

```toml
app = "my-app"
primary_region = "ord"
kill_signal = "SIGTERM"
kill_timeout = "5s"

[build]

[env]
  PHX_HOST = "my-app.fly.dev"
  PORT = "8080"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
  processes = ["app"]

  [[http_service.checks]]
    grace_period = "10s"
    interval = "30s"
    method = "GET"
    timeout = "5s"
    path = "/health"

[[vm]]
  size = "shared-cpu-1x"
  memory = "1gb"
  cpus = 1
```

### `Dockerfile`

(Generated by `mix phx.gen.release --docker`; ship as-is.)

```dockerfile
ARG ELIXIR_VERSION=1.18.4
ARG OTP_VERSION=28.0.5
ARG DEBIAN_VERSION=bookworm-20250203-slim

ARG BUILDER_IMAGE="hexpm/elixir:${ELIXIR_VERSION}-erlang-${OTP_VERSION}-debian-${DEBIAN_VERSION}"
ARG RUNNER_IMAGE="debian:${DEBIAN_VERSION}"

FROM ${BUILDER_IMAGE} AS builder
RUN apt-get update -y && apt-get install -y build-essential git \
    && apt-get clean && rm -f /var/lib/apt/lists/*_*
WORKDIR /app
RUN mix local.hex --force && mix local.rebar --force
ENV MIX_ENV="prod"

COPY mix.exs mix.lock ./
RUN mix deps.get --only $MIX_ENV
RUN mkdir config
COPY config/config.exs config/$MIX_ENV.exs config/
RUN mix deps.compile

COPY priv priv
COPY lib lib
COPY assets assets
RUN mix assets.deploy

RUN mix compile
COPY config/runtime.exs config/
COPY rel rel
RUN mix release

FROM ${RUNNER_IMAGE}
RUN apt-get update -y && \
  apt-get install -y libstdc++6 openssl libncurses5 locales ca-certificates \
  && apt-get clean && rm -f /var/lib/apt/lists/*_*

RUN sed -i '/en_US.UTF-8/s/^# //g' /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US:en
ENV LC_ALL=en_US.UTF-8

WORKDIR "/app"
RUN chown nobody /app
ENV MIX_ENV="prod"

COPY --from=builder --chown=nobody:root /app/_build/${MIX_ENV}/rel/my_app ./
USER nobody
CMD ["/app/bin/server"]
```

### `.credo.exs`

```elixir
%{
  configs: [
    %{
      name: "default",
      files: %{
        included: ["lib/", "test/", "config/"],
        excluded: [~r"/_build/", ~r"/deps/"]
      },
      strict: true,
      checks: [
        {Credo.Check.Refactor.MapInto, false},
        {Credo.Check.Warning.LazyLogging, false},
        {Credo.Check.Readability.LargeNumbers, only_greater_than: 99_999},
        {Credo.Check.Readability.MaxLineLength, max_length: 120},
        {Credo.Check.Readability.ParenthesesOnZeroArityDefs, parens: true},
        {Credo.Check.Readability.StrictModuleLayout, []},
        {Credo.Check.Refactor.Nesting, max_nesting: 3}
      ]
    }
  ]
}
```

### `.formatter.exs`

```elixir
[
  import_deps: [:ecto, :ecto_sql, :phoenix],
  subdirectories: ["priv/*/migrations"],
  plugins: [Phoenix.LiveView.HTMLFormatter],
  inputs: ["*.{heex,ex,exs}", "{config,lib,test}/**/*.{heex,ex,exs}", "priv/*/seeds.exs"]
]
```

### `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: >-
          --health-cmd pg_isready --health-interval 5s
          --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: erlef/setup-beam@v1
        with:
          otp-version: "28.0.5"
          elixir-version: "1.18.4"
      - uses: actions/cache@v4
        with:
          path: |
            deps
            _build
            priv/plts
          key: ${{ runner.os }}-mix-${{ hashFiles('mix.lock') }}
          restore-keys: ${{ runner.os }}-mix-
      - run: mix deps.get
      - run: mix format --check-formatted
      - run: mix compile --warnings-as-errors
      - run: mix credo --strict
      - run: mix sobelow --config
      - run: mix test --warnings-as-errors
      - run: mix dialyzer
```

### `lib/my_app/release.ex`

```elixir
defmodule MyApp.Release do
  @moduledoc "Release tasks: migrate, rollback, seed."
  @app :my_app

  def migrate do
    load_app()
    for repo <- repos(), do: {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :up, all: true))
  end

  def rollback(repo, version) do
    load_app()
    {:ok, _, _} = Ecto.Migrator.with_repo(repo, &Ecto.Migrator.run(&1, :down, to: version))
  end

  defp repos, do: Application.fetch_env!(@app, :ecto_repos)
  defp load_app, do: Application.load(@app)
end
```

After all of this, `git add . && git commit -m "scaffold" && fly launch && fly deploy` produces a deployable hello-world with auth.

---

## 17. Idea → MVP Path

### Phase 1 — Schema (1 AI session, ~1h)

Files: `lib/my_app/<context>/<schema>.ex`, `priv/repo/migrations/*.exs`.

- Decide tables (5–15 for an MVP).
- Use `mix phx.gen.schema` for each.
- Run `mix ecto.migrate`.
- Seed dev fixtures in `priv/repo/seeds.exs`.

**Exit:** `mix ecto.reset && mix run priv/repo/seeds.exs` succeeds.

### Phase 2 — Backbone (1 AI session)

Files: `lib/my_app_web/router.ex`, `lib/my_app_web/live/<feature>_live.ex` skeletons.

- `mix phx.gen.live` for each top-level resource.
- Wire into router with verified routes.
- All pages render placeholder content.

**Exit:** `mix phx.routes` lists every URL; clicking through doesn't crash.

### Phase 3 — Vertical Slice (2 AI sessions)

Files: one full feature end-to-end (e.g. "create a post and view it").

- Context fn `Posts.create_post(scope, attrs)`.
- LiveView mount → form → submit → redirect → index.
- PhoenixTest covering the flow.
- PubSub broadcast so other open sessions see new post.

**Exit:** `mix test` green; manual flow works in browser.

### Phase 4 — Auth + Multi-User (1 AI session)

Files: already there from `phx.gen.auth`.

- Wrap LiveViews in `live_session :authenticated, on_mount: [{MyAppWeb.UserAuth, :require_authenticated}]`.
- Inject `%Scope{}` into all context calls.
- Add row-level filtering: `where: p.user_id == ^scope.user.id`.
- Tests for "user A cannot read user B's data".

**Exit:** unauth test → 302 to login; user-A-as-user-B test → 404.

### Phase 5 — Ship + Monitor (1 AI session)

Files: `Dockerfile`, `fly.toml`, `lib/my_app/release.ex`, Sentry config in `runtime.exs`.

- `mix phx.gen.release --docker`.
- `fly launch && fly deploy`.
- `fly logs` shows `:ok`.
- Health check in router.
- Sentry receives a test exception.

**Exit:** prod URL serves the app; Sentry got an event; CI green.

---

## 18. Feature Recipes

### 18.1 Authentication (already covered)

```bash
mix phx.gen.auth Accounts User users
```

This generates magic-link + password login, scopes, registration, password reset, email verification. Modify only `lib/my_app/accounts.ex` to add custom rules.

### 18.2 File Upload + Storage

In LiveView mount:
```elixir
def mount(_params, _session, socket) do
  {:ok,
   socket
   |> allow_upload(:avatar, accept: ~w(.jpg .png), max_entries: 1, max_file_size: 5_000_000)}
end

def handle_event("save", _params, socket) do
  uploaded =
    consume_uploaded_entries(socket, :avatar, fn %{path: p}, _entry ->
      dest = Path.join("priv/static/uploads", Path.basename(p))
      File.cp!(p, dest)
      {:ok, ~p"/uploads/#{Path.basename(p)}"}
    end)

  {:noreply, assign(socket, :avatar_url, hd(uploaded))}
end
```

For S3, use `:ex_aws` + `ExAws.S3.Upload`. Never store secrets in code.

### 18.3 Stripe Payments

`mix.exs`:
```elixir
{:stripity_stripe, "~> 3.2"}
```

`config/runtime.exs`:
```elixir
config :stripity_stripe, api_key: System.fetch_env!("STRIPE_SECRET_KEY")
```

Webhook controller in `lib/my_app_web/controllers/stripe_webhook_controller.ex`:
```elixir
def index(conn, _params) do
  payload = conn.assigns.raw_body
  sig = List.first(get_req_header(conn, "stripe-signature"))

  case Stripe.Webhook.construct_event(payload, sig, System.fetch_env!("STRIPE_WEBHOOK_SECRET")) do
    {:ok, %{type: "checkout.session.completed", data: %{object: session}}} ->
      MyApp.Billing.fulfill_order(session)
      send_resp(conn, 200, "")
    _ ->
      send_resp(conn, 400, "")
  end
end
```

### 18.4 Push Notifications

Web Push via `:web_push_encryption`:
```elixir
{:web_push_encryption, "~> 0.3"}
```

Generate VAPID keys once: `WebPushEncryption.VapidKeys.generate()`. Store public in JS, private in Fly secrets.

### 18.5 Background Jobs

Worker module `lib/my_app/workers/welcome_email_worker.ex`:
```elixir
defmodule MyApp.Workers.WelcomeEmailWorker do
  use Oban.Worker, queue: :mailers, max_attempts: 5

  @impl true
  def perform(%Oban.Job{args: %{"user_id" => id}}) do
    user = MyApp.Accounts.get_user!(id)
    MyApp.Mailer.deliver_welcome(user)
  end
end
```

Enqueue: `%{user_id: id} |> MyApp.Workers.WelcomeEmailWorker.new() |> Oban.insert()`.

### 18.6 Realtime

```elixir
# In context (after commit):
Phoenix.PubSub.broadcast(MyApp.PubSub, "posts:#{scope.user.id}", {:post_created, post})

# In LiveView mount:
if connected?(socket), do: Phoenix.PubSub.subscribe(MyApp.PubSub, "posts:#{user.id}")

def handle_info({:post_created, post}, socket) do
  {:noreply, stream_insert(socket, :posts, post, at: 0)}
end
```

### 18.7 Search

For ≤100k rows: Postgres `tsvector` + GIN index. Migration:
```elixir
execute "CREATE INDEX posts_search_idx ON posts USING gin (to_tsvector('english', title || ' ' || body))"
```

Query in context:
```elixir
def search(scope, term) do
  from(p in Post,
    where: p.user_id == ^scope.user.id,
    where: fragment("to_tsvector('english', ? || ' ' || ?) @@ plainto_tsquery(?)", p.title, p.body, ^term)
  ) |> Repo.all()
end
```

### 18.8 Internationalization

Already wired via Gettext. Add strings:
```heex
<%= gettext("Welcome, %{name}", name: @current_scope.user.name) %>
```

```bash
mix gettext.extract --merge
# edit priv/gettext/<locale>/LC_MESSAGES/default.po
```

### 18.9 Dark Mode

Phoenix 1.8 ships daisyUI with `[data-theme="light|dark|system"]`. Toggle via JS hook:
```js
const ThemeToggle = {
  mounted() {
    this.el.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark"
      document.documentElement.setAttribute("data-theme", next)
      localStorage.setItem("theme", next)
    })
  }
}
```

### 18.10 Analytics

Plausible (privacy-friendly):
```heex
<script defer data-domain="my-app.fly.dev" src="https://plausible.io/js/script.js"></script>
```

Custom events: `window.plausible("Signup")` from a JS hook on form submit.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `(Mix) The task "phx.new" could not be found` | `mix archive.install hex phx_new 1.8.5 --force` |
| `(Postgrex.Error) ...connection refused` | Start Postgres: `brew services start postgresql@16` |
| `password authentication failed for user "postgres"` | Change `username:` in `config/dev.exs` to your OS user |
| `(Mix) The database for ...has not been created` | `mix ecto.create` |
| `(DBConnection.ConnectionError) tcp recv: closed` | DB pool too small or DB restarted; bump `:pool_size` |
| `Ecto.MigrationError: ...has changed since` | Don't edit a deployed migration; create a new one |
| `(Phoenix.Router.NoRouteError)` at runtime | Add the route to `router.ex` and restart server |
| `(KeyError) key :live_action not found` | Wrap LiveView in `live "/path", FooLive, :index` |
| `(ArgumentError) cannot push_navigate to "..."` | Use `~p"/path"` (verified routes), not bare strings |
| `(CompileError) module Foo is not loaded` | `mix deps.compile` then restart server |
| `(UndefinedFunctionError) function MyApp.Repo.get/2 is undefined` | Add `{:postgrex, "~> 0.20"}` to mix.exs and run `mix deps.get` |
| `:elixir.eval_quoted ...handle_event` returns wrong tuple | Must return `{:noreply, socket}` or `{:reply, map, socket}` |
| `:badmap` in template | You're rendering nil; assign a default in `mount/3` |
| LiveView reconnects forever | Check WS at `/live` returns 101; verify CSRF token in layout |
| `mix dialyzer` first-run takes 20 minutes | Normal; PLT is cached after |
| `mix sobelow` reports `Config.HTTPS` | Set `force_ssl:` in prod endpoint config |
| Form values vanish on validation error | Use `<.simple_form>` not raw `<form>`; pass `@form` from changeset |
| Route works in dev but 404 in prod | `mix assets.deploy && mix phx.digest` not run |
| `(ArithmeticError) bad argument` in render | You're doing math on `nil`; guard via `if @x do ...` |
| `(Plug.Conn.AlreadySentError)` | Don't `render` after `redirect` in same controller action |
| `(Phoenix.LiveView.UploadError) too many entries` | Bump `:max_entries` in `allow_upload/3` |
| `connection refused` from Sentry | Set `SENTRY_DSN` env; check it in prod via `fly secrets list` |
| `(Oban.JobAlreadyExistsError)` | Use `unique:` on the worker, or remove the dup |
| `fly deploy` says "no Dockerfile" | `mix phx.gen.release --docker` |
| Fly app boots but immediately exits | Missing `PHX_SERVER=true` env or `mix release` not run |
| `:undef` for `Bcrypt.hash_pwd_salt/1` | Add `{:bcrypt_elixir, "~> 3.2"}` |
| HEEx error: "the assigns are accessed via @" | Use `<%= @foo %>`, not `<%= foo %>` |
| `(KeyError) key :current_scope not found` | Wrap LiveView in `live_session ..., on_mount: [{UserAuth, :mount_current_scope}]` |
| Browser console: "WebSocket connection failed" | Check `check_origin` setting and reverse proxy WS upgrade |
| Tailwind classes missing in prod | Class names must be literal strings; can't compute them dynamically |
| `mix test` first run is slow | Compiling deps once; `_build/test` cached after |
| `(MatchError) no match of right hand side {:error, %Postgrex.Error{}}` | Pattern `{:ok, _}` only; handle `{:error, _}` branch |

---

## 20. Glossary

- **Assigns** — Key-value state attached to a LiveView's socket. Like React props but server-owned.
- **BEAM** — Erlang virtual machine. Where Elixir runs.
- **Behaviour** — Elixir's interface contract. Like a Java interface.
- **Changeset** — Ecto's wrapper for record changes + validations + cast rules.
- **Context** — A module under `lib/my_app/` representing a domain area (e.g. `Accounts`).
- **Ecto** — The database library. Schema + Query + Repo + Migration.
- **ExUnit** — Elixir's test framework. Built in.
- **Genserver** — A long-lived process holding state and responding to messages.
- **HEEx** — HTML-aware Elixir templates with compile-time validation.
- **LiveView** — Server-rendered UI that pushes diffs over WebSocket.
- **Mix** — Build tool + task runner + dep manager. The `npm` of Elixir.
- **Migration** — A timestamped DB schema change file.
- **Mox** — Mock library based on behaviours.
- **OTP** — Open Telecom Platform; the standard library + supervision tree primitives.
- **PLT** — Persistent Lookup Table; Dialyzer's analysis cache.
- **PubSub** — Publish/subscribe across processes (or nodes via `:phoenix_pubsub`).
- **Repo** — Ecto's connection pool + query interface to one DB.
- **Schema** — Module mapping a struct to a DB table.
- **Scope** — A `%Scope{}` struct holding the current user; threaded through context calls.
- **Stream** — `stream/4`-managed list in LiveView; sends only diffs.
- **Supervisor** — A process that restarts its children when they die.
- **Verified routes** — `~p"/path"` URLs checked at compile time.

---

## 21. Update Cadence

This rulebook is valid for: **Phoenix 1.8.x, LiveView 1.1.x, Elixir 1.18.x, Erlang/OTP 28.x, Ecto 3.13.x.**

Re-run the generator when:
- Phoenix bumps to 1.9 or LiveView to 1.2.
- Elixir releases 1.19 stable + Phoenix officially recommends it.
- OTP 29 ships in May.
- Fly.io changes flyctl deploy commands.
- Ecto 4 ships.
- Sobelow flags a new advisory class.

**Last updated:** 2026-04-27.
