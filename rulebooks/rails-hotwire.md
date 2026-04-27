# Rails 8 + Hotwire Rulebook

> Server-rendered HTML, sprinkled with Turbo + Stimulus, Postgres for everything (data, jobs, cache, cable), Kamal 2 to ship.

This file is the only documentation an AI coding agent needs to bootstrap, build, verify, and ship a Rails 8 + Hotwire application from zero. Hand it to Claude Code, Codex, or Cursor along with your idea. It will not ask technical questions.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why |
|---|---|---|
| Language | Ruby 3.4.8 | Rails 8.1 requires Ruby 3.2+; 3.4 is current stable. |
| Runtime + version | Ruby 3.4.8 via mise | Consistent across macOS/Win/Linux without rbenv. |
| Package manager | Bundler 2.6.x | Ruby standard; ships with Ruby. |
| Build tool | Rails 8.1.3 | Latest stable; bundles Propshaft + import maps. |
| Web framework | Rails 8.1 + Hotwire | Server-rendered HTML; Turbo + Stimulus. |
| Frontend JS | Stimulus 1.3 + Turbo 8.0 | Sprinkles, no SPA. |
| State mgmt | Turbo Frames + Streams | Server is the source of truth. |
| Routing | Rails router | RESTful resources only. |
| Data layer | Postgres 17 + Active Record | Rails default; multi-database for solid trifecta. |
| Auth | Rails 8 `bin/rails generate authentication` | Built-in; no external dep. |
| Styling | Tailwind CSS v4 via tailwindcss-rails 4.0 | Default Rails 8 generator option. |
| Forms + validation | `form_with` + Active Model validations | First-party. |
| Unit test runner | Minitest | Rails default; zero config. |
| System test driver | Capybara + Cuprite (CDP) | 2-3x faster than Selenium. |
| Mocking strategy | Minitest `Mocha` for stubs; never mock AR | Hit a real Postgres. |
| Logger | Rails Tagged Logging + lograge 0.14 | Single-line JSON; structured. |
| Error tracking | sentry-ruby 6.5 + sentry-rails 6.5 | First-class Rails breadcrumbs. |
| Lint + format | `rubocop-rails-omakase` 1.1 | DHH-blessed defaults. |
| Type checking | None (Ruby is dynamic) | Static types not idiomatic. |
| Env vars + secrets | Rails encrypted credentials + ENV via dotenv-rails 3.1 | Encrypted at rest. |
| CI provider | GitHub Actions | Free for public; Rails CI template. |
| Deploy target | Kamal 2.8 to a VPS (Hetzner, DigitalOcean) | Rails 8 default; no PaaS. |
| Release flow | `kamal deploy` from `main` after CI green | One command. |
| Auto-update | `kamal deploy` zero-downtime; image tag = git SHA | Rolling restart. |
| Asset pipeline | Propshaft 1.2 + importmap-rails 2.1 | Rails 8 default; no transpile. |
| Background jobs | SolidQueue 1.2 (Active Job adapter) | DB-backed; no Redis. |
| Cache store | SolidCache 1.0 | DB-backed; no Redis. |
| WebSockets | SolidCable 3.1 | DB-backed; no Redis. |
| HTTP server | Puma 6.6 | Rails default. |
| Image processing | Active Storage + libvips | Faster than ImageMagick. |

### Versions

| Package | Version | Released | Source |
|---|---|---|---|
| rails | 8.1.3 | 2026-03-24 | rubygems.org/gems/rails |
| ruby | 3.4.8 | 2025-12-17 | ruby-lang.org |
| turbo-rails | 2.0.16 | 2026-Q1 | github.com/hotwired/turbo-rails |
| stimulus-rails | 1.3.4 | 2026-Q1 | github.com/hotwired/stimulus-rails |
| solid_queue | 1.2.x | 2026-Q1 | github.com/rails/solid_queue |
| solid_cache | 1.0.x | 2026-Q1 | github.com/rails/solid_cache |
| solid_cable | 3.1.x | 2026-Q1 | github.com/rails/solid_cable |
| propshaft | 1.2.x | 2026-Q1 | github.com/rails/propshaft |
| importmap-rails | 2.1.x | 2026-Q1 | github.com/rails/importmap-rails |
| tailwindcss-rails | 4.0.x | 2026-Q1 | github.com/rails/tailwindcss-rails |
| puma | 6.6.x | 2026-Q1 | github.com/puma/puma |
| pg | 1.5.x | 2026-Q1 | github.com/ged/ruby-pg |
| capybara | 3.40.x | 2026-Q1 | github.com/teamcapybara/capybara |
| cuprite | 0.15.x | 2026-Q1 | github.com/rubycdp/cuprite |
| rubocop-rails-omakase | 1.1.x | 2026-Q1 | github.com/rails/rubocop-rails-omakase |
| brakeman | 7.0.x | 2026-Q1 | github.com/presidentbeef/brakeman |
| bundler-audit | 0.9.x | 2026-Q1 | github.com/rubysec/bundler-audit |
| kamal | 2.8.x | 2026-Q1 | github.com/basecamp/kamal |
| sentry-ruby | 6.5.0 | 2026-03-16 | rubygems.org/gems/sentry-ruby |
| sentry-rails | 6.5.0 | 2026-03-16 | rubygems.org/gems/sentry-rails |
| lograge | 0.14.x | 2026-Q1 | github.com/roidrage/lograge |
| dotenv-rails | 3.1.x | 2026-Q1 | github.com/bkeepers/dotenv |

### Minimum Host

- macOS 13+ / Windows 11 with WSL2 / Ubuntu 22.04+
- 8 GB RAM, 20 GB free disk
- Postgres 17 running locally
- Cold-start (`git clone` to running app on a fresh machine): ~6 minutes

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install mise (Ruby version manager) + Postgres + libvips
brew install mise postgresql@17 libvips redis-cli git gh
brew services start postgresql@17

# 3. Install Ruby
mise use --global ruby@3.4.8
mise install

# 4. Verify
ruby -v   # ruby 3.4.8
psql --version  # psql (PostgreSQL) 17.x

# 5. Install Rails
gem install rails -v 8.1.3
rails -v  # Rails 8.1.3

# 6. Install Docker Desktop (for Kamal builds)
brew install --cask docker
open -a Docker
```

### Windows (WSL2 only)

```bash
# Run inside WSL2 Ubuntu 22.04
sudo apt update && sudo apt install -y curl git build-essential libpq-dev libvips libyaml-dev autoconf bison libssl-dev libreadline-dev zlib1g-dev libffi-dev

# Postgres 17
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt jammy-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
sudo apt update && sudo apt install -y postgresql-17

# mise + Ruby
curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
mise use --global ruby@3.4.8

# Rails
gem install rails -v 8.1.3

# Docker Desktop on Windows (with WSL integration enabled)
```

### Linux (Ubuntu 22.04+)

```bash
sudo apt update && sudo apt install -y curl git build-essential libpq-dev libvips libyaml-dev autoconf bison libssl-dev libreadline-dev zlib1g-dev libffi-dev postgresql-17 docker.io

curl https://mise.run | sh
echo 'eval "$(~/.local/bin/mise activate bash)"' >> ~/.bashrc
source ~/.bashrc
mise use --global ruby@3.4.8

gem install rails -v 8.1.3
sudo systemctl start postgresql
```

### Accounts to create

| Service | URL | Purpose |
|---|---|---|
| GitHub | https://github.com | Source + CI |
| Hetzner / DigitalOcean | https://hetzner.com | $5-20/mo VPS |
| Sentry | https://sentry.io | Error tracking; free tier |
| Docker Hub | https://hub.docker.com | Container registry |

### CLI auth

```bash
gh auth login                        # GitHub
docker login                         # Docker Hub
ssh-keygen -t ed25519 -C "you@example.com"   # SSH key for VPS
ssh-copy-id root@<vps-ip>            # Push key to server
```

### Bootstrap a new app

```bash
rails new myapp \
  --database=postgresql \
  --css=tailwind \
  --javascript=importmap \
  --skip-jbuilder \
  --skip-test=false

cd myapp
bin/rails generate authentication
bin/rails db:create db:migrate
bin/dev
```

### Expected first-run output

```
=> Booting Puma
=> Rails 8.1.3 application starting in development
=> Run `bin/rails server --help` for more startup options
Puma starting in single mode...
* Puma version: 6.6.x ("...")
* Min threads: 3
* Max threads: 3
* Environment: development
* PID: 12345
* Listening on http://127.0.0.1:3000
Use Ctrl-C to stop
```

Open http://localhost:3000 — Rails welcome page.

### Common first-run errors

| Error | Fix |
|---|---|
| `LoadError: cannot load such file -- pg` | `brew install libpq && bundle pristine pg` |
| `PG::ConnectionBad` | `brew services start postgresql@17` |
| `Webpacker not found` | You scaffolded with old guide; use `--javascript=importmap` |
| `command not found: rails` | `mise reshim` |
| `Address already in use - bind(2) for "127.0.0.1" port 3000` | `lsof -ti:3000 \| xargs kill -9` |
| `bin/dev: Permission denied` | `chmod +x bin/dev` |
| `libvips not found` | `brew install vips` (mac) / `apt install libvips` (linux) |

---

## 3. Project Layout

```
myapp/
├── app/
│   ├── assets/
│   │   ├── images/
│   │   ├── stylesheets/application.tailwind.css
│   │   └── builds/                    # Propshaft-managed; .gitignored
│   ├── channels/                      # ActionCable channels
│   ├── controllers/
│   │   ├── application_controller.rb
│   │   ├── concerns/
│   │   └── sessions_controller.rb     # from auth generator
│   ├── helpers/
│   ├── javascript/
│   │   ├── application.js             # importmap entry
│   │   └── controllers/               # Stimulus controllers
│   │       ├── application.js
│   │       ├── index.js
│   │       └── hello_controller.js
│   ├── jobs/                          # Active Job (SolidQueue)
│   ├── mailers/
│   ├── models/
│   │   ├── concerns/
│   │   ├── current.rb                 # CurrentAttributes
│   │   ├── session.rb                 # from auth generator
│   │   └── user.rb                    # from auth generator
│   └── views/
│       ├── layouts/application.html.erb
│       ├── sessions/
│       └── passwords/
├── bin/
│   ├── dev                            # foreman-style multi-process
│   ├── rails
│   ├── rubocop
│   ├── brakeman
│   └── kamal
├── config/
│   ├── application.rb
│   ├── boot.rb
│   ├── cable.yml
│   ├── cache.yml
│   ├── credentials.yml.enc
│   ├── database.yml
│   ├── deploy.yml                     # Kamal 2
│   ├── environments/{development,test,production}.rb
│   ├── importmap.rb
│   ├── initializers/
│   ├── master.key                     # NEVER commit
│   ├── puma.rb
│   ├── queue.yml
│   ├── routes.rb
│   └── storage.yml
├── db/
│   ├── cable_schema.rb
│   ├── cache_schema.rb
│   ├── migrate/
│   ├── queue_schema.rb
│   ├── schema.rb
│   └── seeds.rb
├── lib/
│   └── tasks/
├── log/
├── public/
├── storage/                           # Active Storage local disk
├── test/
│   ├── application_system_test_case.rb
│   ├── controllers/
│   ├── fixtures/
│   ├── integration/
│   ├── models/
│   ├── system/                        # Capybara + Cuprite
│   └── test_helper.rb
├── tmp/
├── vendor/javascript/                 # importmap-pinned packages
├── .github/workflows/ci.yml
├── .rubocop.yml
├── .ruby-version
├── Dockerfile
├── Gemfile
├── Gemfile.lock
├── Procfile.dev
├── Rakefile
└── config.ru
```

### Naming conventions

| Artifact | File | Class |
|---|---|---|
| Model | `app/models/order_line.rb` | `OrderLine` |
| Controller | `app/controllers/order_lines_controller.rb` | `OrderLinesController` |
| Job | `app/jobs/send_email_job.rb` | `SendEmailJob` |
| Mailer | `app/mailers/user_mailer.rb` | `UserMailer` |
| Stimulus controller | `app/javascript/controllers/dropdown_controller.js` | `DropdownController` |
| Channel | `app/channels/chat_channel.rb` | `ChatChannel` |
| Test (model) | `test/models/order_line_test.rb` | `OrderLineTest` |
| Test (system) | `test/system/orders_test.rb` | `OrdersTest` |
| Migration | `db/migrate/20260427120000_create_orders.rb` | `CreateOrders` |
| Partial view | `app/views/orders/_order.html.erb` | n/a |
| Turbo Stream view | `app/views/orders/create.turbo_stream.erb` | n/a |

### "If you're adding X, it goes in Y"

| Adding | Goes in |
|---|---|
| HTTP endpoint | `app/controllers/<resource>_controller.rb` + `config/routes.rb` |
| DB table | `bin/rails generate migration Create<X>` then `db/migrate/` |
| Validation rule | `app/models/<x>.rb` |
| Reusable model logic | `app/models/concerns/<name>.rb` |
| Reusable controller logic | `app/controllers/concerns/<name>.rb` |
| Service / business logic | `app/models/<domain>/<action>.rb` (PORO) |
| Background job | `app/jobs/<x>_job.rb` |
| Scheduled job | `config/recurring.yml` (SolidQueue recurring) |
| Real-time broadcast | `app/channels/<x>_channel.rb` + `broadcast_*` in model |
| Email | `app/mailers/<x>_mailer.rb` + `app/views/<x>_mailer/` |
| Stimulus behavior | `app/javascript/controllers/<x>_controller.js` |
| View partial | `app/views/<resource>/_<name>.html.erb` |
| Turbo Stream response | `app/views/<resource>/<action>.turbo_stream.erb` |
| Helper | `app/helpers/<scope>_helper.rb` |
| API JSON serializer | `app/views/<resource>/<action>.json.jbuilder` |
| Initializer (one-time setup) | `config/initializers/<topic>.rb` |
| Rake task | `lib/tasks/<name>.rake` |
| Asset (image) | `app/assets/images/` |
| CSS | inline Tailwind classes; rare custom CSS in `app/assets/stylesheets/` |
| Test fixture | `test/fixtures/<plural>.yml` |

---

## 4. Architecture

### Process boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser (Turbo + Stimulus)                  │
│  HTML over the wire | Turbo Frames | Turbo Streams (WebSocket)   │
└────────────────────────┬─────────────────┬──────────────────────┘
                         │ HTTP            │ WebSocket
                         │                 │
                ┌────────▼─────────────────▼───────────┐
                │         Kamal Proxy (TLS)             │
                └────────┬─────────────────┬───────────┘
                         │                 │
                ┌────────▼─────────────────▼───────────┐
                │      Puma (Rails 8.1 app server)      │
                │  Controllers → Models → Views         │
                │  ActionCable (SolidCable)             │
                └────────┬──────────────────────────────┘
                         │
                ┌────────▼──────────────────────────────┐
                │        Postgres 17 (single host)       │
                │  primary | queue | cache | cable DBs   │
                └────────────────────────────────────────┘

                ┌─────────────────────────────────┐
                │  SolidQueue worker (separate    │
                │  Puma process; same image)      │
                └─────────────────────────────────┘
```

### Data flow (typical request)

```
Browser → POST /orders
           ↓
Kamal Proxy (TLS termination)
           ↓
Puma worker
           ↓
Routes (config/routes.rb) → OrdersController#create
           ↓
StrongParameters → Order.new(order_params)
           ↓
order.save  (Active Record → Postgres)
           ↓
respond_to do |format|
  format.html  { redirect_to order_path(order) }
  format.turbo_stream { render turbo_stream: turbo_stream.append(...) }
end
           ↓
Browser receives HTML or <turbo-stream>; Turbo updates DOM
```

### Auth flow (Rails 8 generator)

```
GET /session/new          → SessionsController#new      → form
POST /session             → SessionsController#create   → User.authenticate_by(...)
                                                        → session record + signed cookie
GET /protected            → ApplicationController#authenticated? → @current_user
DELETE /session           → SessionsController#destroy  → session.destroy
```

### State management flow

```
Server holds truth. Client renders HTML.
  → Turbo Frame: scoped DOM swap on link click / form submit
  → Turbo Stream: server pushes <turbo-stream action="..."> over WS
  → Stimulus: tiny per-element controllers for client-only behavior
```

### Entry-point file map

| File | Responsibility |
|---|---|
| `config/application.rb` | Rails app boot, autoload paths, time zone |
| `config/routes.rb` | URL → controller mapping |
| `config/puma.rb` | Web server config; min/max threads, workers |
| `app/controllers/application_controller.rb` | Base controller; auth filter |
| `app/models/application_record.rb` | Base AR model |
| `app/javascript/application.js` | Importmap entry; loads Turbo, Stimulus |
| `bin/dev` | Local dev runner (Foreman-style) |
| `Procfile.dev` | Dev processes: web, css, queue |

### Where business logic lives

- Models (`app/models/`): validations, associations, callbacks (sparingly), simple methods.
- POROs in `app/models/<domain>/<action>.rb`: complex multi-step workflows. Naming: `Orders::Checkout`, `Reports::Generator`.
- **Never** in controllers (keep them thin: parse params → call model/service → render).
- **Never** in views (no DB queries, no `find_by` in ERB).

---

## 5. Dev Workflow

### Start

```bash
bin/dev
```

`bin/dev` reads `Procfile.dev` and starts Puma + Tailwind watcher + SolidQueue worker concurrently.

`Procfile.dev`:

```
web: bin/rails server -p 3000
css: bin/rails tailwindcss:watch
worker: bin/jobs
```

### Hot reload

- Ruby files: Rails autoloader (Zeitwerk) reloads on next request. Restart needed when changing `config/initializers/*` or `Gemfile`.
- ERB templates: instant; no refresh logic needed.
- Stimulus controllers: refresh page (importmap, no HMR).
- Tailwind classes: `tailwindcss:watch` rebuilds `app/assets/builds/tailwind.css`; refresh page.

### Debugger

- VS Code / Cursor: install "Ruby LSP" extension, then attach to `rdbg` via `bin/rails server -u rdbg`.
- Add `debugger` (or `binding.b`) anywhere in Ruby; execution pauses, repl opens in the terminal running `bin/dev`.

### Runtime inspection

- Logs: `tail -f log/development.log`
- DB shell: `bin/rails db`  (drops you into `psql`)
- Console: `bin/rails console`  (full app loaded)
- Routes: `bin/rails routes | grep <pattern>`
- Pending migrations: `bin/rails db:migrate:status`

### Pre-commit checks

`.git/hooks/pre-commit` (chmod +x):

```bash
#!/bin/bash
set -e
bin/rubocop -a
bin/brakeman --quiet --no-pager
bin/bundler-audit check --update
bin/rails test
```

### Branch + commit conventions

- Branches: `feature/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- Commits: imperative present tense (`Add user signup`, not `Added`).
- One logical change per commit.

---

## 6. Testing & Parallelization

### Commands

```bash
bin/rails test                        # unit + integration
bin/rails test:system                 # Capybara + Cuprite
bin/rails test test/models/user_test.rb
bin/rails test test/models/user_test.rb:42       # single test by line
bin/rails test:all                    # everything
```

### Parallel test execution

`test/test_helper.rb` ships with:

```ruby
parallelize(workers: :number_of_processors)
```

Each worker gets its own Postgres database (`myapp_test-<n>`).

### Mocking rules

- **Never mock Active Record.** Use real Postgres in test env.
- **Never mock Action Mailer.** Use `:test` delivery; assert on `ActionMailer::Base.deliveries`.
- **Mock external HTTP** at adapter boundary using WebMock or VCR.
- **Mock time** with `freeze_time` from Active Support.

### Coverage

```bash
bundle add simplecov --group=test
COVERAGE=true bin/rails test
open coverage/index.html
```

Target: **80% line coverage** on `app/models/` and `app/controllers/`.

### System test config

`test/application_system_test_case.rb`:

```ruby
require "test_helper"
require "capybara/cuprite"

class ApplicationSystemTestCase < ActionDispatch::SystemTestCase
  driven_by :cuprite,
    screen_size: [1400, 1400],
    options: {
      js_errors: true,
      headless: ENV["HEADED"].blank?,
      browser_options: { "no-sandbox": nil }
    }
end
```

### Parallelization patterns for AI agents

Safe to fan out (disjoint files):
- Scaffolding multiple unrelated models (`User`, `Post`, `Comment`) in parallel — each touches its own model + migration + test files.
- Writing Stimulus controllers in parallel.
- Writing view partials in parallel.

Must be sequential:
- Anything touching `Gemfile` / `Gemfile.lock` (single bundler lock).
- Anything touching `db/schema.rb` (migrations must run in order).
- Anything touching `config/routes.rb` (merge conflicts).
- Anything touching `config/importmap.rb`.

---

## 7. Logging

### Setup

Add to `Gemfile`:

```ruby
gem "lograge"
```

`config/initializers/lograge.rb`:

```ruby
Rails.application.configure do
  config.lograge.enabled = true
  config.lograge.formatter = Lograge::Formatters::Json.new
  config.lograge.custom_options = lambda do |event|
    {
      time: Time.now.iso8601,
      request_id: event.payload[:request_id],
      user_id: event.payload[:user_id],
      params: event.payload[:params].except("controller", "action")
    }
  end
end
```

`app/controllers/application_controller.rb` exposes user_id:

```ruby
class ApplicationController < ActionController::Base
  before_action :append_info_to_payload, only: []

  def append_info_to_payload(payload)
    super
    payload[:user_id] = Current.user&.id
    payload[:request_id] = request.request_id
  end
end
```

### Log levels

| Level | Use |
|---|---|
| `debug` | SQL queries, verbose internal state — dev only |
| `info` | Request start/end, job start/end, normal operations |
| `warn` | Recoverable anomaly (retry, fallback used) |
| `error` | Exception caught and handled |
| `fatal` | Process crash imminent |

### Required fields

Every log line must carry: `time`, `request_id`, `user_id` (or `null`), `module`, `event`.

### Sample log lines

```
{"time":"2026-04-27T12:00:00Z","module":"boot","event":"app.started","version":"v1.2.3"}
{"time":"2026-04-27T12:00:01Z","method":"GET","path":"/orders","status":200,"duration":12.3,"request_id":"abc","user_id":1}
{"time":"2026-04-27T12:00:02Z","level":"error","module":"orders","event":"checkout.failed","error":"Stripe::CardError","request_id":"abc","user_id":1}
{"time":"2026-04-27T12:00:03Z","level":"warn","module":"orders","event":"slow_query","duration_ms":1842,"sql":"SELECT * FROM orders ..."}
{"time":"2026-04-27T12:00:04Z","module":"job","event":"send_email_job.completed","job_id":"xyz","duration":340}
```

### Where logs go

- **Dev**: stdout via `bin/dev` and `log/development.log`.
- **Prod**: stdout (Kamal collects via Docker logs); errors mirrored to Sentry.

### Grep locally

```bash
tail -f log/development.log | grep '"level":"error"'
tail -f log/development.log | jq 'select(.user_id == 42)'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `bin/rubocop -a && bin/brakeman --quiet --no-pager && bin/rails test` before declaring a task done.
2. Always use `bin/rails generate <generator>` instead of hand-creating models, controllers, migrations.
3. Always write a Minitest unit test before writing model logic. Test lives in `test/models/<name>_test.rb`.
4. Always pass user input through strong parameters (`params.expect(:order, [...])`).
5. Always use `form_with model: @order` — never raw `<form>` tags.
6. Always render Turbo Streams for create/update/destroy on `format.turbo_stream`, fallback to redirect on `format.html`.
7. Always wrap multi-statement DB writes in `ActiveRecord::Base.transaction`.
8. Always preload associations (`includes(:author)`) when iterating over collections — N+1 is fatal.
9. Always use `bin/rails db:migrate` then commit `db/schema.rb`.
10. Always store secrets in `bin/rails credentials:edit` — never in `config/*.yml` or in code.
11. Always use SolidQueue for async work via `MyJob.perform_later`.
12. Always broadcast Turbo Streams from models, not controllers (`broadcasts_to ->(record) { ... }`).
13. Always scope Active Record queries to `Current.user` for multi-tenant data.
14. Always use `tagged_logger` with `[request_id, user_id]` tags.
15. Always write a system test (`test/system/`) for any user-facing feature.
16. Always use Rails URL helpers (`order_path(@order)`) — never hardcode paths.
17. Always set `validates_presence_of`, `validates_uniqueness_of` (with DB index), `validates_length_of` on model attributes.
18. Always add a DB index on every foreign key and on every column queried by a `where` clause.
19. Always pin gems to a major version range in `Gemfile` (`gem "rails", "~> 8.1.0"`).
20. Always run `bin/bundler-audit check --update` weekly.
21. Always use `before_action :require_authentication` (from auth generator) on controllers that need login.
22. Always use Active Storage for file uploads — never write to `public/` or `tmp/` for user uploads.
23. Always set `config.force_ssl = true` in `config/environments/production.rb`.
24. Always use `Current.user` (CurrentAttributes) instead of passing user through method args.

### 8.2 NEVER

1. Never use Sidekiq. SolidQueue is the Rails 8 default; use it.
2. Never use Redis. SolidCache + SolidCable + SolidQueue replace it.
3. Never use Webpacker, Sprockets, esbuild-rails, jsbundling-rails. Propshaft + import maps are the default.
4. Never use Devise on a new Rails 8 app. Use the built-in `bin/rails generate authentication`.
5. Never use `rails db:schema:load` in production — it wipes data. Use `db:migrate`.
6. Never call `update_attribute` (skips validations + callbacks). Use `update!` or `update`.
7. Never use `find_or_create_by` without a unique constraint at the DB level — race condition.
8. Never put business logic in controllers or views.
9. Never call `params[:id].to_i` for lookups — use `Model.find(params[:id])` (raises 404).
10. Never iterate `Model.all` in a controller — always paginate.
11. Never `puts` for logging. Use `Rails.logger.info` (or tagged logger).
12. Never bypass strong parameters with `params.permit!`.
13. Never commit `config/master.key`, `config/credentials/*.key`, `.env`, `.env.local`.
14. Never `require_relative` across the `app/` tree — let Zeitwerk autoload.
15. Never modify a generated migration after it's been deployed; create a new one.
16. Never call `save` (silent fail). Use `save!` or check return value.
17. Never broadcast Turbo Streams from background jobs without `broadcast_*_later_to`.
18. Never use `default_scope` — it leaks into every query and surprises future you.
19. Never set `config.eager_load = false` in production.
20. Never pass user input directly into `where("...")`. Use `where(name: name)` or parameterized form `where("name = ?", name)`.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `Gemfile` / `Gemfile.lock` | every command | `bundle install && bin/rails test && bin/brakeman` |
| `config/application.rb` | boot, autoload, time zone | `bin/rails runner 'puts Rails.env' && bin/rails test` |
| `config/routes.rb` | every URL | `bin/rails routes && bin/rails test:system` |
| `config/database.yml` | every DB query | `bin/rails db:migrate:status && bin/rails test` |
| `config/puma.rb` | server perf | `bin/rails server` smoke test |
| `db/schema.rb` | runtime, models | `bin/rails db:test:prepare && bin/rails test` |
| `db/migrate/*` | data shape | migrate up + roll back + redo + tests |
| `app/models/application_record.rb` | every model | full test suite |
| `app/controllers/application_controller.rb` | every request | full test suite + system tests |
| `app/models/user.rb` (auth) | login, sessions, perms | system tests for sign-in/out |
| `config/initializers/*` | boot order | `bin/rails runner 'puts :ok'` |
| `config/credentials.yml.enc` | runtime secrets | `bin/rails credentials:show` decrypts |
| `config/deploy.yml` | production deploy | `kamal config` validates |
| `Dockerfile` | image | `docker build .` |
| `.github/workflows/ci.yml` | CI | push to feature branch, watch run |
| `app/javascript/application.js` | client JS | reload page, check devtools |
| `config/importmap.rb` | client deps | `bin/importmap audit` |
| `config/queue.yml` | background jobs | `bin/jobs` boots cleanly |
| `config/cable.yml` | websockets | open a channel; Turbo Stream broadcast lands |
| `config/cache.yml` | cache | `Rails.cache.write/read` round-trip |
| `app/views/layouts/application.html.erb` | every page | system tests |
| `.rubocop.yml` | style enforced | `bin/rubocop` |
| `bin/dev`, `Procfile.dev` | dev startup | `bin/dev` brings everything up |
| `app/javascript/controllers/index.js` | every Stimulus controller | reload page; controller `connect` fires |

### 8.4 Definition of Done

**Bug fix**
- Failing test reproduces the bug.
- Fix lands; test passes.
- `bin/rails test` green.
- `bin/rubocop` clean.
- Screenshot or log paste in PR for any user-visible change.
- Do NOT swallow exceptions to make a failing test pass.

**New feature**
- Migration written + reviewed (`bin/rails db:migrate:status` clean).
- Model + controller + views scaffolded.
- Strong parameters enforced.
- Unit test for model logic.
- System test for the user flow (`test/system/`).
- Authorization checked: `require_authentication` and per-record scoping.
- Translations added if user-facing string is new.
- Do NOT skip the system test "because it's slow."

**Refactor**
- Tests untouched; behavior identical.
- `bin/rails test` green before and after.
- `bin/brakeman` clean.
- No new `# rubocop:disable` comments.
- Do NOT mix refactor + behavior change in one commit.

**Dependency bump**
- `bundle update <gem>` (single gem; not a global update).
- Run full test suite.
- Read CHANGELOG of bumped gem; flag any deprecation in PR body.
- Do NOT bump Rails major versions without reading the official upgrade guide first.

**Schema change**
- New migration; `db/schema.rb` regenerated.
- Backfill plan noted (Rake task or job for large tables).
- Strong migrations gem (`strong_migrations`) flags risky operations.
- Roll back rehearsed locally: `bin/rails db:rollback STEP=1 && bin/rails db:migrate`.
- Do NOT add a non-null column without default on a populated table.

**Copy change**
- Edit ERB or `config/locales/*.yml`.
- Run system tests touching that copy.
- Do NOT introduce new ERB logic to support the copy.

### 8.5 Self-Verification Recipe

```bash
bundle install
bin/rubocop --autocorrect-all
bin/brakeman --quiet --no-pager
bin/bundler-audit check --update
bin/rails db:migrate:status
bin/rails test
bin/rails test:system
```

Expected output (literal):

- `bundle install`: ends with `Bundle complete!` line.
- `bin/rubocop`: ends with `<n> files inspected, no offenses detected`.
- `bin/brakeman`: ends with `No warnings found`.
- `bin/bundler-audit check`: ends with `No vulnerabilities found`.
- `bin/rails db:migrate:status`: every row says `up`.
- `bin/rails test`: ends with `0 failures, 0 errors, 0 skips`.
- `bin/rails test:system`: ends with `0 failures, 0 errors, 0 skips`.

### 8.6 Parallelization Patterns

Safe (disjoint files):
- Three subagents writing three Stimulus controllers in `app/javascript/controllers/`.
- Three subagents adding three unrelated views in `app/views/`.
- Three subagents writing model unit tests for three different models.

Unsafe (shared state):
- Adding three gems → one bundler lock → sequential.
- Adding three migrations → ordered timestamps required → sequential.
- Adding three routes → `config/routes.rb` merge → sequential.
- Adding three importmap pins → `config/importmap.rb` merge → sequential.

---

## 9. Stack-Specific Pitfalls

1. **Reaching for Sidekiq.** Symptom: agent runs `bundle add sidekiq`. Cause: training data predates Rails 8. Fix: remove sidekiq, use SolidQueue (`config.active_job.queue_adapter = :solid_queue` is already set). Detect early: search Gemfile for `sidekiq`.
2. **Reaching for Redis.** Symptom: `gem "redis"` appears in Gemfile. Cause: pre-Rails-8 muscle memory. Fix: SolidCache + SolidCable + SolidQueue cover all three needs. Detect: grep Gemfile/Gemfile.lock for `redis`.
3. **Webpacker / esbuild contamination.** Symptom: `bin/webpack`, `package.json` with `webpack` deps, `app/javascript/packs/`. Cause: agent followed pre-2024 tutorial. Fix: scaffold with `--javascript=importmap`. Detect: presence of `package.json`.
4. **Broken Turbo Stream broadcasts.** Symptom: model saves but UI doesn't update. Cause: missing `broadcasts_to` or wrong target id. Fix: add `broadcasts_to ->(record) { record.parent }` and ensure `<turbo-stream-source>` is rendered. Detect: open browser DevTools, inspect WS frames; missing or mismatched `target=`.
5. **N+1 queries.** Symptom: page slow, log shows 100+ identical SELECTs. Fix: `.includes(:author, :tags)` on the controller query. Detect: install `bullet` gem in dev/test; it raises on N+1.
6. **Missing strong parameters.** Symptom: `ForbiddenAttributesError`. Fix: `params.expect(order: [:name, :total])`. Detect: form submit returns 500 in dev.
7. **Forgetting `belongs_to` is required by default.** Symptom: validation error on `Order#save`. Fix: either pass the required parent or `belongs_to :user, optional: true`.
8. **Hot reload broken after `config/initializers/*` change.** Symptom: change doesn't appear. Fix: restart `bin/dev`. Detect: log shows old behavior.
9. **Encrypted credentials lost.** Symptom: `MissingKeysError` on boot. Fix: restore `config/master.key` from password manager; if lost, regenerate with `EDITOR=vim bin/rails credentials:edit` (will rotate, breaking prod). Detect: app refuses to boot.
10. **CSRF token missing on Turbo form.** Symptom: 422 on POST. Fix: ensure `<%= csrf_meta_tags %>` in layout; use `form_with`. Detect: Rails log shows `Can't verify CSRF token authenticity`.
11. **Cuprite hangs.** Symptom: system test never finishes. Fix: add `Capybara.default_max_wait_time = 5` and `js_errors: true`; check Chrome version compatibility. Detect: test process running > 60s.
12. **Database connections exhausted.** Symptom: `PG::ConnectionBad: connection refused` under load. Fix: set `pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>` in `database.yml`; ensure SolidQueue and Puma share connection budget. Detect: `pg_stat_activity` count.
13. **Importmap pin missing.** Symptom: `Failed to resolve module specifier "<lib>"`. Fix: `bin/importmap pin <lib>` and commit `config/importmap.rb` + `vendor/javascript/`. Detect: browser console error.
14. **Migration timeouts on large tables.** Symptom: `lock_timeout` on prod migrate. Fix: install `strong_migrations` gem; split into add-column-no-default + backfill-job + add-not-null. Detect: production deploy step `kamal app exec 'bin/rails db:migrate'` hangs.
15. **Active Storage variants slow / leaking.** Symptom: high disk on app server. Fix: configure `config/storage.yml` with S3/R2 in production; never use `:local` in prod. Detect: `du -sh storage/` on server.
16. **`Current.user` not set in jobs.** Symptom: nil errors in background jobs that worked in controllers. Fix: pass user_id explicitly to `perform_later`; resolve inside `perform`. Detect: error tracker shows `NoMethodError on nil`.
17. **System test screenshots missing.** Symptom: failure has no visual evidence. Fix: `take_failed_screenshot` is on by default in Rails — ensure `tmp/screenshots/` is in CI artifacts.
18. **Eager loading off in production.** Symptom: cold response slow, autoload errors. Fix: `config.eager_load = true` in `config/environments/production.rb` (Rails default; do not change).

---

## 10. Performance Budgets

| Metric | Budget | How to measure | Fix |
|---|---|---|---|
| p95 server response | < 200ms | `lograge` `duration` field | add index, preload assoc, cache fragment |
| TTFB | < 250ms | Chrome DevTools → Network → Timing | move work to background job |
| Full page load (LCP) | < 2.5s | Chrome DevTools → Lighthouse | reduce JS payload, use Turbo Frames |
| JS payload (initial) | < 50KB gzip | `du -h public/assets/*.js` after `assets:precompile` | importmap audit; pin only what you need |
| CSS payload | < 30KB gzip | same | Tailwind purges unused; verify in prod build |
| Memory per Puma worker | < 512MB RSS | `ps aux \| grep puma` | preload! eager loading; profile with `rbtrace` |
| DB connection count | < 50 | `SELECT count(*) FROM pg_stat_activity` | tune pool size |
| Background job p95 | < 5s | SolidQueue dashboard / `solid_queue_jobs` | move to multi-step or shard worker |

If a budget is exceeded: profile (`rack-mini-profiler` in dev, `flamegraph` in prod), file an issue, fix before merging.

---

## 11. Security

### Secret storage

- Use `bin/rails credentials:edit` (encrypted at rest).
- `config/master.key` lives **only** in: developer password manager, CI secret store (`RAILS_MASTER_KEY`), Kamal secrets file (`.kamal/secrets`).
- **Never commit**: `config/master.key`, `.env`, `.env.production`, `tmp/*`, `log/*`.

### Auth threat model

- All non-`session#new` and `passwords#new` controllers require `before_action :require_authentication`.
- Session cookies: signed, encrypted, `httponly`, `secure` in prod.
- `bcrypt` cost factor 12 (default with `has_secure_password`).
- Session table tracked in `sessions` table; revoke by deleting row.

### Input validation

Boundary: every controller action. Mechanism: strong parameters + Active Model validations. Never trust `params` directly.

### Output escaping

- ERB auto-escapes by default. **Never** use `raw` or `.html_safe` on user input.
- Use `sanitize` helper for user-controlled HTML with allowlist.
- For JS data: `<%= raw @data.to_json %>` — but prefer `<script type="application/json" id="data"><%= @data.to_json %></script>` and parse client-side.

### Permissions

- CSP headers via `config/initializers/content_security_policy.rb` (Rails default).
- `config.force_ssl = true` in production.
- `config.action_dispatch.default_headers` includes `X-Frame-Options: SAMEORIGIN`.

### Dependency audit

```bash
bin/bundler-audit check --update    # weekly
bin/brakeman --quiet --no-pager     # every commit
```

CI fails on findings.

### Top 5 stack-specific risks

1. **Mass assignment via params.permit!** — disable globally; review every permit list.
2. **SQL injection via `where("name = '#{x}'")`** — always parameterize.
3. **Open redirect via `redirect_to params[:url]`** — use `redirect_to_url(only_path: true)` or allowlist.
4. **Insecure session cookies in dev replicated to prod** — verify `force_ssl` + `cookies.signed` + `same_site: :lax`.
5. **Brakeman warnings ignored** — CI must fail on any new warning.

---

## 12. Deploy

### Full release flow

```bash
git checkout main
git pull
git tag -a v1.2.3 -m "Release 1.2.3"
git push origin main --tags
# CI runs; on green:
kamal deploy
```

### Staging vs prod

Two destinations in `config/deploy.yml`:

```yaml
destinations:
  staging:
    servers:
      web: [staging.example.com]
  production:
    servers:
      web: [prod1.example.com, prod2.example.com]
```

Deploy: `kamal deploy -d staging` or `kamal deploy -d production`.

### Rollback

```bash
kamal rollback <previous-image-tag>     # within 24h: trivial
```

Past 24h, the previous image may be garbage-collected; re-deploy from a tagged commit.

### Health check

`config/routes.rb`:

```ruby
get "up" => "rails/health#show", as: :rails_health_check
```

URL: `https://example.com/up` returns 200 if app + DB are healthy.

Smoke after deploy:

```bash
curl -fsS https://example.com/up && echo OK
```

### Versioning

`VERSION` constant in `config/application.rb` or `lib/myapp/version.rb`. Image tag = git SHA: `kamal deploy --version $(git rev-parse --short HEAD)`.

### Cost (1k MAU)

- Hetzner CX22 (2 vCPU, 4GB) — €4.59/mo
- Postgres on same host (or +€8.20/mo for managed CX32)
- Domain: ~$12/yr
- Sentry developer plan: free
- Total: **~$5-15/mo**.

### DNS

Point A record (and AAAA) to VPS IP. Kamal Proxy auto-provisions Let's Encrypt cert when `proxy.ssl: true`.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste into project root)

```markdown
# Claude Code Operating Manual — Rails 8 + Hotwire

This project follows `<repo-root>/rails-hotwire.md`. Read it before any change.

## Key commands
- `bin/dev` — start dev server (web + css watcher + worker)
- `bin/rails test` — unit + integration tests
- `bin/rails test:system` — Capybara + Cuprite system tests
- `bin/rubocop -a` — auto-correct style
- `bin/brakeman --quiet --no-pager` — security scan
- `bin/bundler-audit check --update` — vulnerable deps
- `bin/rails console` — REPL with app loaded
- `bin/rails db:migrate` — apply migrations
- `kamal deploy` — ship to production

## Banned patterns
- Sidekiq, Redis, Webpacker, Sprockets, esbuild-rails, jsbundling-rails.
- Devise on a fresh app — use `bin/rails generate authentication`.
- Raw `<form>` tags — use `form_with`.
- `find_by` in views — keep ERB logic-free.
- Business logic in controllers — push to models / POROs.
- `params.permit!` — always whitelist.
- `puts` for logging — use `Rails.logger`.

## Definition of done
Run the self-verification recipe (section 8.5 of rulebook). All seven commands must be green before declaring a task complete.

## Skills to invoke
- `/test-driven-development` before writing model logic
- `/systematic-debugging` for any stack trace
- `/verification-before-completion` before claiming a task done
- `/ship` to create the PR
```

### `.claude/settings.json`

```json
{
  "$schema": "https://raw.githubusercontent.com/anthropics/claude-code/main/schemas/settings.json",
  "permissions": {
    "allow": [
      "Bash(bin/rails:*)",
      "Bash(bin/dev)",
      "Bash(bin/rubocop:*)",
      "Bash(bin/brakeman:*)",
      "Bash(bin/bundler-audit:*)",
      "Bash(bin/jobs:*)",
      "Bash(bin/importmap:*)",
      "Bash(bin/kamal:*)",
      "Bash(bundle:*)",
      "Bash(gem:*)",
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(psql:*)",
      "Bash(curl -fsS http://localhost:3000/up)",
      "Bash(tail:*)",
      "Bash(find:*)",
      "Bash(grep:*)",
      "Bash(rg:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "bin/rubocop -a $CLAUDE_FILE_PATHS 2>/dev/null || true"}
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "bin/rails test 2>&1 | tail -5"}
        ]
      }
    ]
  }
}
```

---

## 14. Codex Integration

### `AGENTS.md` (paste into project root)

```markdown
# Codex Agent Brief — Rails 8 + Hotwire

Read `rails-hotwire.md` before any task. All decisions are pre-made there.

## Mode
Server-rendered HTML over the wire. Turbo + Stimulus for interactivity. No SPA.

## Stack
Ruby 3.4.8 / Rails 8.1.3 / Postgres 17 / SolidQueue / SolidCache / SolidCable / Propshaft / importmap-rails / Tailwind v4 / Cuprite / RuboCop omakase / Kamal 2.

## Run before declaring done
```
bin/rubocop -a
bin/brakeman --quiet --no-pager
bin/rails test
bin/rails test:system
```

## Never
- Add Sidekiq, Redis, Webpacker, Devise.
- Hand-create files when a generator exists.
- Skip tests.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox_mode = "workspace-write"
approval_policy = "on-request"

[shell_environment_policy]
inherit = "core"

[mcp_servers.context7]
command = "npx"
args = ["-y", "@upstash/context7-mcp"]
```

### Codex differences vs Claude Code

- Codex defaults to ask-before-edit; flip to `workspace-write` so it doesn't stall on every Rails generator file.
- Codex doesn't auto-load `CLAUDE.md`; `AGENTS.md` is the canonical brief.
- For long migrations, Codex tends to stop at lint failure — re-prompt with "fix rubocop and continue" rather than starting fresh.

---

## 15. Cursor / Other Editors

### `.cursor/rules` (paste into project root)

```
You are working in a Rails 8 + Hotwire project. Read rails-hotwire.md.

ALWAYS
- Use `bin/rails generate` instead of hand-creating files.
- Run `bin/rubocop -a && bin/rails test` before declaring done.
- Use `form_with` for all forms.
- Use strong parameters (`params.expect(...)`).
- Use Turbo Frames + Streams for partial page updates.
- Use `bin/rails credentials:edit` for secrets.
- Use SolidQueue for jobs (`MyJob.perform_later`).
- Use Stimulus controllers for client behavior; one controller per file.
- Preload associations to avoid N+1.
- Index every foreign key and queried column.

NEVER
- Add Sidekiq, Redis, Webpacker, Sprockets, jsbundling-rails, esbuild-rails.
- Add Devise on a fresh Rails 8 app — use `bin/rails generate authentication`.
- Put business logic in controllers or views.
- Use `params.permit!`.
- Use raw `<form>` tags.
- Use `find_or_create_by` without a DB unique constraint.
- Iterate `Model.all` without pagination.
- Bypass migrations; never `db:schema:load` in prod.

OUTPUT
- ERB views: keep logic-free. Push helpers and partials.
- Controllers: thin. Strong params, model call, render.
- Models: validations, associations, scopes, simple methods. Move complex flows to POROs in `app/models/<domain>/<action>.rb`.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "Shopify.ruby-lsp",
    "castwide.solargraph",
    "kaiwood.endwise",
    "aki77.rails-db-schema",
    "manuelpuyol.erb-linter",
    "bradlc.vscode-tailwindcss",
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
      "name": "Rails server",
      "type": "rdbg",
      "request": "launch",
      "command": "bin/rails",
      "script": "server",
      "args": ["-p", "3000"]
    },
    {
      "name": "Run current Minitest file",
      "type": "rdbg",
      "request": "launch",
      "command": "bin/rails",
      "script": "test",
      "args": ["${file}"]
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in order on a brand-new project. After the last file, `git push` produces a deployable hello-world.

### 1. `.ruby-version`

```
3.4.8
```

### 2. `Gemfile`

```ruby
source "https://rubygems.org"

ruby "3.4.8"

gem "rails", "~> 8.1.3"
gem "pg", "~> 1.5"
gem "puma", "~> 6.6"

# Asset pipeline
gem "propshaft"
gem "importmap-rails"
gem "tailwindcss-rails"

# Hotwire
gem "turbo-rails"
gem "stimulus-rails"

# Solid trifecta
gem "solid_queue"
gem "solid_cache"
gem "solid_cable"

# Auth
gem "bcrypt", "~> 3.1"

# Misc
gem "bootsnap", require: false
gem "image_processing", "~> 1.2"
gem "kamal", "~> 2.8", require: false
gem "lograge"

# Error tracking
gem "sentry-ruby"
gem "sentry-rails"

group :development, :test do
  gem "debug", platforms: %i[mri windows]
  gem "brakeman", require: false
  gem "bundler-audit", require: false
  gem "rubocop-rails-omakase", require: false
  gem "dotenv-rails"
end

group :development do
  gem "web-console"
  gem "bullet"
end

group :test do
  gem "capybara"
  gem "cuprite"
  gem "mocha"
  gem "simplecov", require: false
end
```

### 3. `.rubocop.yml`

```yaml
inherit_gem:
  rubocop-rails-omakase: rubocop.yml

AllCops:
  TargetRubyVersion: 3.4
  NewCops: enable
  Exclude:
    - "bin/**/*"
    - "db/schema.rb"
    - "vendor/**/*"
    - "node_modules/**/*"
    - "tmp/**/*"
    - "log/**/*"
```

### 4. `config/database.yml`

```yaml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>
  host: <%= ENV.fetch("DATABASE_HOST", "localhost") %>
  username: <%= ENV.fetch("DATABASE_USERNAME", "postgres") %>
  password: <%= ENV.fetch("DATABASE_PASSWORD", nil) %>

development:
  primary:
    <<: *default
    database: myapp_development
  cache:
    <<: *default
    database: myapp_development_cache
    migrations_paths: db/cache_migrate
  queue:
    <<: *default
    database: myapp_development_queue
    migrations_paths: db/queue_migrate
  cable:
    <<: *default
    database: myapp_development_cable
    migrations_paths: db/cable_migrate

test:
  <<: *default
  database: myapp_test

production:
  primary: &prod_primary
    <<: *default
    database: myapp_production
    username: myapp
    password: <%= ENV["MYAPP_DATABASE_PASSWORD"] %>
  cache:
    <<: *prod_primary
    database: myapp_production_cache
    migrations_paths: db/cache_migrate
  queue:
    <<: *prod_primary
    database: myapp_production_queue
    migrations_paths: db/queue_migrate
  cable:
    <<: *prod_primary
    database: myapp_production_cable
    migrations_paths: db/cable_migrate
```

### 5. `config/cable.yml`

```yaml
development:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day

test:
  adapter: test

production:
  adapter: solid_cable
  connects_to:
    database:
      writing: cable
  polling_interval: 0.1.seconds
  message_retention: 1.day
```

### 6. `config/cache.yml`

```yaml
default: &default
  store_options:
    max_age: <%= 60.days.to_i %>
    max_size: <%= 256.megabytes %>
    namespace: <%= Rails.env %>

development:
  <<: *default

test:
  <<: *default

production:
  <<: *default
```

### 7. `config/queue.yml`

```yaml
default: &default
  dispatchers:
    - polling_interval: 1
      batch_size: 500
  workers:
    - queues: "*"
      threads: 3
      processes: <%= ENV.fetch("JOB_CONCURRENCY", 1) %>
      polling_interval: 0.1

development:
  <<: *default

test:
  <<: *default

production:
  <<: *default
```

### 8. `config/storage.yml`

```yaml
test:
  service: Disk
  root: <%= Rails.root.join("tmp/storage") %>

local:
  service: Disk
  root: <%= Rails.root.join("storage") %>

amazon:
  service: S3
  access_key_id: <%= Rails.application.credentials.dig(:aws, :access_key_id) %>
  secret_access_key: <%= Rails.application.credentials.dig(:aws, :secret_access_key) %>
  region: <%= Rails.application.credentials.dig(:aws, :region) %>
  bucket: <%= Rails.application.credentials.dig(:aws, :bucket) %>
```

### 9. `config/routes.rb`

```ruby
Rails.application.routes.draw do
  # Auth (from `bin/rails generate authentication`)
  resource :session, only: %i[new create destroy]
  resources :passwords, param: :token, only: %i[new create edit update]

  # Health check for Kamal
  get "up" => "rails/health#show", as: :rails_health_check

  # PWA
  get "service-worker" => "rails/pwa#service_worker", as: :pwa_service_worker
  get "manifest" => "rails/pwa#manifest", as: :pwa_manifest

  # Root
  root "home#index"
end
```

### 10. `config/deploy.yml` (Kamal 2)

```yaml
service: myapp
image: <your-dockerhub-user>/myapp

servers:
  web:
    - <vps-ip>
  job:
    hosts:
      - <vps-ip>
    cmd: bin/jobs

proxy:
  ssl: true
  host: example.com

registry:
  username: <dockerhub-user>
  password:
    - KAMAL_REGISTRY_PASSWORD

env:
  secret:
    - RAILS_MASTER_KEY
    - MYAPP_DATABASE_PASSWORD
  clear:
    SOLID_QUEUE_IN_PUMA: true
    DB_HOST: <vps-ip>

aliases:
  console: app exec --interactive --reuse "bin/rails console"
  shell: app exec --interactive --reuse "bash"
  logs: app logs -f
  dbc: app exec --interactive --reuse "bin/rails dbconsole"

accessories:
  db:
    image: postgres:17
    host: <vps-ip>
    port: "127.0.0.1:5432:5432"
    env:
      clear:
        POSTGRES_USER: myapp
      secret:
        - POSTGRES_PASSWORD
    directories:
      - data:/var/lib/postgresql/data
```

### 11. `Dockerfile` (Rails 8 default)

```dockerfile
ARG RUBY_VERSION=3.4.8
FROM docker.io/library/ruby:$RUBY_VERSION-slim AS base

WORKDIR /rails

ENV RAILS_ENV="production" \
    BUNDLE_DEPLOYMENT="1" \
    BUNDLE_PATH="/usr/local/bundle" \
    BUNDLE_WITHOUT="development:test"

FROM base AS build

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev libyaml-dev pkg-config && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY Gemfile Gemfile.lock ./
RUN bundle install && \
    rm -rf ~/.bundle/ "${BUNDLE_PATH}"/ruby/*/cache "${BUNDLE_PATH}"/ruby/*/bundler/gems/*/.git && \
    bundle exec bootsnap precompile --gemfile

COPY . .
RUN bundle exec bootsnap precompile app/ lib/
RUN SECRET_KEY_BASE_DUMMY=1 ./bin/rails assets:precompile

FROM base

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y curl libjemalloc2 libvips postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY --from=build /usr/local/bundle /usr/local/bundle
COPY --from=build /rails /rails

RUN groupadd --system --gid 1000 rails && \
    useradd rails --uid 1000 --gid 1000 --create-home --shell /bin/bash && \
    chown -R rails:rails db log storage tmp
USER 1000:1000

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 80
CMD ["./bin/thrust", "./bin/rails", "server"]
```

### 12. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  scan_ruby:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: .ruby-version
          bundler-cache: true
      - run: bin/brakeman --no-pager

  scan_deps:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: .ruby-version
          bundler-cache: true
      - run: bin/bundler-audit check --update

  lint:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: .ruby-version
          bundler-cache: true
      - run: bin/rubocop -f github

  test:
    runs-on: ubuntu-24.04
    services:
      postgres:
        image: postgres:17
        env:
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        ports: ["5432:5432"]
        options: --health-cmd pg_isready --health-interval 10s --health-timeout 5s --health-retries 5
    env:
      RAILS_ENV: test
      DATABASE_HOST: localhost
      DATABASE_USERNAME: postgres
      DATABASE_PASSWORD: postgres
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: .ruby-version
          bundler-cache: true
      - run: sudo apt-get install -y libvips
      - run: bin/rails db:test:prepare
      - run: bin/rails test
      - run: bin/rails test:system
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: screenshots
          path: tmp/screenshots
```

### 13. `.gitignore`

```
/.bundle
/log/*
!/log/.keep
/tmp/*
!/tmp/.keep
/storage/*
!/storage/.keep
/public/assets
/public/uploads
/coverage
/spec/tmp
.byebug_history

# Secrets
/config/master.key
/config/credentials/*.key
.env
.env.*
!.env.example

# Editor
.vscode/launch.json.local
.idea/

# OS
.DS_Store
Thumbs.db
```

### 14. `.env.example`

```
RAILS_ENV=development
DATABASE_HOST=localhost
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=
SENTRY_DSN=
```

### 15. `Procfile.dev`

```
web: bin/rails server -p 3000
css: bin/rails tailwindcss:watch
worker: bin/jobs
```

### 16. `README.md` stub

```markdown
# myapp

Rails 8 + Hotwire app. See `rails-hotwire.md` for the full operating manual.

## Run

```bash
bin/setup
bin/dev
```

Open http://localhost:3000.

## Test

```bash
bin/rails test
bin/rails test:system
```

## Deploy

```bash
kamal deploy
```
```

### 17. `LICENSE`

MIT (or your choice; AI agent must not pick without asking).

### 18. Bootstrap commands

```bash
rails new myapp --database=postgresql --css=tailwind --javascript=importmap
cd myapp
bin/rails generate authentication
bin/rails solid_queue:install solid_cache:install solid_cable:install
bin/rails db:create db:migrate
git init && git add . && git commit -m "Initial Rails 8 + Hotwire skeleton"
gh repo create myapp --public --source=. --remote=origin --push
```

---

## 17. Idea → MVP Path

Five-phase plan from blank repo to shipped MVP.

### Phase 1: Schema (1 AI session)

- Identify the 3-5 core nouns. Generate models + migrations.
- Files touched: `db/migrate/*`, `app/models/*.rb`, `test/models/*_test.rb`, `test/fixtures/*.yml`.
- Exit: `bin/rails db:migrate && bin/rails test test/models/` is green.

### Phase 2: Backbone (1-2 sessions)

- `config/routes.rb`: RESTful resources for each model.
- Generate controllers + views (`bin/rails generate scaffold_controller`).
- Layout + nav (`app/views/layouts/application.html.erb`).
- Files touched: routes, controllers, views, layouts.
- Exit: every URL renders without 500. System smoke test passes.

### Phase 3: Vertical slice (2-3 sessions)

- Pick one user-visible feature (e.g. "create order, see it in list, broadcast to other tabs").
- Implement with Turbo Frames + Streams.
- Add system test in `test/system/`.
- Files touched: model, controller, views, Stimulus controllers, channels, tests.
- Exit: system test green; manually verified in browser; broadcast lands in second tab.

### Phase 4: Auth + multi-user (1 session)

- Already wired by `bin/rails generate authentication`.
- Add `before_action :require_authentication` to all non-public controllers.
- Scope all model queries to `Current.user` via `default_scope` on protected models or explicit scope.
- Add registration flow (the auth generator gives you sign-in but not sign-up — write a `RegistrationsController#create` that creates a user + session).
- Exit: signed-out user redirected to `/session/new`; signed-in user sees only their data.

### Phase 5: Ship + monitor (1 session)

- Provision VPS (Hetzner / DO). Add SSH key. Add A record.
- `bin/rails credentials:edit` — add `secret_key_base`, AWS keys (if using S3), Sentry DSN.
- Configure Sentry: `bin/rails generate sentry`.
- `kamal setup` then `kamal deploy`.
- `curl https://example.com/up` returns 200.
- Push a test error: `Sentry.capture_message("hello")` from console; verify it appears.
- Exit: production URL serves the app, monitoring receives events.

---

## 18. Feature Recipes

### Recipe 1 — Authentication (Rails 8 built-in)

```bash
bin/rails generate authentication
bin/rails db:migrate
```

Generated files: `app/models/{user,session,current}.rb`, `app/controllers/{sessions,passwords}_controller.rb`, views, mailer.

Add registration manually:

`config/routes.rb`:

```ruby
resource :registration, only: %i[new create]
```

`app/controllers/registrations_controller.rb`:

```ruby
class RegistrationsController < ApplicationController
  allow_unauthenticated_access only: %i[new create]

  def new
    @user = User.new
  end

  def create
    @user = User.new(registration_params)
    if @user.save
      start_new_session_for(@user)
      redirect_to root_path, notice: "Welcome!"
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def registration_params
    params.expect(user: %i[email_address password password_confirmation])
  end
end
```

### Recipe 2 — File upload + storage

```bash
bin/rails active_storage:install
bin/rails db:migrate
```

`app/models/post.rb`:

```ruby
class Post < ApplicationRecord
  has_one_attached :cover_image
end
```

`app/views/posts/_form.html.erb`:

```erb
<%= form.file_field :cover_image %>
```

Production: configure S3/R2 in `config/storage.yml` and set `config.active_storage.service = :amazon` in `config/environments/production.rb`.

### Recipe 3 — Stripe payments

```ruby
# Gemfile
gem "stripe"
```

`config/initializers/stripe.rb`:

```ruby
Stripe.api_key = Rails.application.credentials.dig(:stripe, :secret_key)
```

`app/controllers/checkouts_controller.rb`:

```ruby
class CheckoutsController < ApplicationController
  def create
    session = Stripe::Checkout::Session.create(
      mode: "payment",
      line_items: [{ price: params[:price_id], quantity: 1 }],
      success_url: success_checkouts_url,
      cancel_url: root_url
    )
    redirect_to session.url, allow_other_host: true
  end
end
```

Webhook: `Stripe::Webhook.construct_event(payload, sig_header, secret)`. Process in a SolidQueue job.

### Recipe 4 — Push notifications (Web Push)

```ruby
# Gemfile
gem "web-push"
```

Generate VAPID keys: `WebPush.generate_key` in `bin/rails console`. Store in credentials. Subscribe via Stimulus controller; persist subscription; push from a SolidQueue job.

### Recipe 5 — Background jobs (SolidQueue)

`app/jobs/send_welcome_email_job.rb`:

```ruby
class SendWelcomeEmailJob < ApplicationJob
  queue_as :default

  def perform(user_id)
    user = User.find(user_id)
    UserMailer.welcome(user).deliver_now
  end
end
```

Enqueue: `SendWelcomeEmailJob.perform_later(user.id)`.

Recurring job — `config/recurring.yml`:

```yaml
production:
  daily_cleanup:
    class: CleanupJob
    schedule: every day at 3am
```

### Recipe 6 — Realtime updates (Turbo Streams + SolidCable)

`app/models/comment.rb`:

```ruby
class Comment < ApplicationRecord
  belongs_to :post
  broadcasts_to ->(comment) { [comment.post, :comments] },
                inserts_by: :append
end
```

`app/views/posts/show.html.erb`:

```erb
<%= turbo_stream_from @post, :comments %>
<div id="comments">
  <%= render @post.comments %>
</div>
```

Comment creation broadcasts to all viewers of that post.

### Recipe 7 — Search (Postgres full-text)

`app/models/post.rb`:

```ruby
class Post < ApplicationRecord
  scope :search, ->(q) {
    return all if q.blank?
    where("to_tsvector('english', title || ' ' || body) @@ plainto_tsquery('english', ?)", q)
  }
end
```

For more complex needs, add `pg_search` gem. Avoid Elasticsearch unless dataset > 1M rows.

### Recipe 8 — Internationalization

Translations live in `config/locales/<locale>.yml`. Use `t("key")` in views. Set locale per request:

```ruby
# app/controllers/application_controller.rb
before_action :set_locale

def set_locale
  I18n.locale = params[:locale] || I18n.default_locale
end
```

### Recipe 9 — Dark mode (Tailwind v4)

`app/assets/stylesheets/application.tailwind.css`:

```css
@import "tailwindcss";

@variant dark (&:where(.dark, .dark *));
```

Use `class="bg-white dark:bg-zinc-900"`. Toggle `.dark` on `<html>` via Stimulus controller persisting to `localStorage`.

### Recipe 10 — Analytics events

Custom `Event` model + SolidQueue job:

```ruby
class TrackEventJob < ApplicationJob
  queue_as :analytics

  def perform(name, user_id, props)
    Event.create!(name: name, user_id: user_id, props: props)
  end
end
```

Helper: `track("signup", user.id, { plan: "pro" })`. For higher volume, use PostHog or Plausible via JS snippet in layout.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `LoadError: cannot load such file -- pg` | `brew install libpq && bundle pristine pg` |
| `PG::ConnectionBad: could not connect` | `brew services start postgresql@17` |
| `Webrick is not installed` | Already on Puma; remove `webrick` from Gemfile |
| `ActiveSupport::MessageEncryptor::InvalidMessage` | Wrong `RAILS_MASTER_KEY` |
| `Missing host to link to` (mailer) | Set `config.action_mailer.default_url_options = { host: "..." }` |
| `Can't verify CSRF token authenticity` | Use `form_with`; ensure `csrf_meta_tags` in layout |
| `ActiveRecord::PendingMigrationError` | `bin/rails db:migrate` |
| `Could not find <gem>-<version>` | `bundle install` |
| `Failed to resolve module specifier "<lib>"` | `bin/importmap pin <lib>` |
| `Cuprite::TimeoutError` | Increase `Capybara.default_max_wait_time`; check Chrome version |
| `Devise` errors | You shouldn't be using Devise on a fresh app — switch to built-in auth |
| `Rack::Lint::LintError: app must respond_to call` | Restart server; clear `tmp/cache` |
| `ActionController::ParameterMissing` | Form hasn't named param correctly; check `form_with model:` |
| `ForbiddenAttributesError` | Missing strong parameters in controller |
| `RoutingError (uninitialized constant ...Controller)` | File name mismatch; restart server (Zeitwerk autoload) |
| `wrong number of arguments` after Rails upgrade | Read upgrade guide for breaking method signatures |
| `Net::ReadTimeout` from Stripe/external | Move to background job with retries |
| `Bundler::GemNotFound` in CI | `bundler-cache: true` in `ruby/setup-ruby` action |
| `Sass::SyntaxError` | You shouldn't have Sass; using Tailwind v4 directly |
| `ENOENT: No such file or directory @ rb_sysopen - tmp/cache/...` | `mkdir -p tmp/cache && touch tmp/cache/.keep` |
| `Address already in use - bind(2)` | `lsof -ti:3000 \| xargs kill -9` |
| `Premature end of script headers` | Check `log/production.log`; usually missing env var |
| `kamal: command not found` | `gem install kamal` |
| `kamal deploy` fails: "no such image" | `docker login` then retry |
| `502 Bad Gateway` after deploy | Check `kamal app logs`; usually crash on boot, missing env var |
| `Let's Encrypt` cert fail | Verify A record points to VPS; ensure port 80 reachable |
| `Brakeman: Possible SQL injection` | Replace string interpolation in `where` with placeholder |
| `Bullet detected N+1 query` | Add `.includes(:assoc)` to the query |
| `ActiveRecord::RecordNotFound` (404) | Wrap with `rescue_from ActiveRecord::RecordNotFound, with: :not_found` in ApplicationController |
| `RAILS_MASTER_KEY: not set` | Export it: `export RAILS_MASTER_KEY=$(cat config/master.key)` |
| `Could not find devise gem` | You shouldn't have it — use built-in auth |

---

## 20. Glossary

- **Active Job** — Rails abstraction for background jobs; SolidQueue is the default backend.
- **Active Record** — Rails ORM; one Ruby class per database table.
- **Active Storage** — Rails file upload framework; saves to disk locally, S3/R2 in prod.
- **Bundler** — Ruby dependency manager (like npm/pip); reads `Gemfile`, writes `Gemfile.lock`.
- **Capybara** — Test library that drives a browser to simulate user actions.
- **CDP (Chrome DevTools Protocol)** — How Cuprite talks to Chrome; faster than Selenium's WebDriver.
- **CSRF** — Cross-Site Request Forgery; Rails injects a token into forms; reject mismatched submissions.
- **Cuprite** — Capybara driver using CDP; replaces Selenium.
- **ERB** — Embedded Ruby; the template language for `app/views/*.html.erb`.
- **Gem** — A Ruby package (e.g. `rails`, `pg`).
- **Gemfile** — File listing your gem dependencies and their version constraints.
- **Hotwire** — Umbrella name for Turbo + Stimulus; "HTML over the wire."
- **Kamal** — Basecamp's deployment tool that ships Docker containers to your VPS.
- **Kamal Proxy** — Bundled with Kamal 2; handles TLS termination + zero-downtime swaps.
- **lograge** — Gem that compresses Rails' verbose multi-line logs into single JSON lines.
- **Migration** — A timestamped Ruby file describing a schema change; `bin/rails db:migrate` applies pending ones.
- **Minitest** — Ruby's built-in test framework; Rails default.
- **Mise** — Tool that installs and switches Ruby versions per project.
- **Omakase** — DHH's word for "a chef's curated set" — `rubocop-rails-omakase` is the default style guide.
- **Postgres** — The relational database; stores your app's data.
- **POROs** — Plain Old Ruby Objects; classes that aren't Rails models, used for service objects.
- **Propshaft** — The Rails 8 default asset pipeline; serves files in `app/assets/` with content-hashed names.
- **Puma** — Ruby web server; multi-threaded, multi-process.
- **RuboCop** — Ruby linter and formatter.
- **SolidQueue / SolidCache / SolidCable** — Database-backed implementations of job queue / cache / pub-sub. Replace Redis.
- **Stimulus** — Tiny JS framework that attaches behavior to existing HTML via `data-*` attributes.
- **Strong Parameters** — Rails' allowlist for which params are safe to pass into model methods.
- **Tailwind** — Utility-first CSS framework.
- **Turbo Drive** — Hotwire piece that intercepts link clicks/form submits to swap page content without full reload.
- **Turbo Frames** — A region of the page that updates independently.
- **Turbo Streams** — Server-pushed HTML fragments delivered via WebSocket; update specific DOM regions.
- **VPS** — Virtual Private Server; rented Linux box (Hetzner, DigitalOcean).
- **Zeitwerk** — Rails' autoloader; you don't `require` files in `app/`, just name them by convention.

---

## 21. Update Cadence

- This rulebook is valid for **Rails 8.0–8.1.x** with **Ruby 3.4.x** and **Kamal 2.8+**.
- Re-run the generator when:
  - Rails 9 ships (expected late 2026/2027).
  - Ruby 4.0 becomes the new floor for Rails (currently 3.2+ supported).
  - Kamal 3 ships.
  - Any CVE in `rails`, `pg`, or `puma` requires a major version bump.
- Last reviewed: **2026-04-27**.
