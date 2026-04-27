# Tauri 2 + Svelte 5 + Rust — RULEBOOK

Cross-platform desktop apps with Rust backend, Svelte 5 runes frontend, SQLite via sqlx, signed and auto-updated.

> **AI agents: read this file top to bottom before any action.** Every decision is locked. Every command is final. Do not invent alternatives.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language (frontend) | TypeScript 5.8.3 | Static types catch IPC mismatches early. |
| Language (backend) | Rust 1.86 stable | Tauri requires it; safe by default. |
| Runtime + version | Node.js 24.15.0 LTS | Active LTS, ESM stable. |
| Package manager | pnpm 10.33.2 | Disk efficient, deterministic, fastest installs. |
| Build tool (frontend) | Vite 8.0.10 | Tauri default, fast HMR. |
| Build tool (backend) | cargo workspace | Standard Rust toolchain. |
| Frontend framework | Svelte 5.55.0 (runes) | Smallest bundle, explicit reactivity. |
| Routing | SvelteKit 2.20.4 + adapter-static 3.0.10 SPA mode | Tauri serves prebuilt assets; no SSR. |
| State mgmt | Svelte 5 `$state` runes | Built-in, no third-party deps. |
| Data layer | sqlx 0.8.6 + SQLite (bundled) | Compile-time checked queries, zero ORM. |
| DB location | `BaseDirectory::AppLocalData/app.db` | Per-user, survives reinstall, no roaming. |
| Auth | App-local password hash (argon2 0.5) | Single-user desktop; no cloud by default. |
| Styling | Tailwind CSS 4.1.5 | Utility-first, smallest CSS for desktop. |
| Forms + validation | Zod 4.0.5 + Svelte forms | One schema for IPC + UI. |
| Unit test runner | Vitest 4.1.5 | Native Vite, fast watch mode. |
| Rust unit tests | `cargo test` (built-in) | Standard Rust toolchain. |
| E2E framework | Playwright 1.59.1 + tauri-driver | Parallel by default; controls Tauri webview. |
| Mocking strategy | Mock at IPC boundary only | Never mock SQLite; use `:memory:`. |
| Logger (Rust) | tracing 0.1 + tracing-subscriber 0.3 | De facto standard, structured. |
| Logger (TS) | console + `@tauri-apps/plugin-log` 2.x | Pipes frontend logs to Rust tracing. |
| Error tracking | Sentry SDK 9.x (Rust + JS) | Single dashboard, both sides. |
| Lint + format (TS) | Biome 2.4.0 | One tool, 10x faster than ESLint+Prettier. |
| Lint + format (Rust) | clippy + rustfmt | Standard, ships with rustup. |
| Type checking | `tsc --noEmit` + `svelte-check 4.x` | Catches Svelte template errors. |
| Env vars + secrets | `.env` (build-time) + OS keyring (runtime) | Never ship secrets in binary. |
| CI provider | GitHub Actions | Free for public, matrix runners for all OS. |
| Deploy target | GitHub Releases + auto-updater | Free, signed, hash-verified. |
| Release flow | `pnpm tauri build` per OS in CI matrix | One artifact per platform. |
| Capability scoping | Per-window, per-feature `default.json` | Least privilege from day one. |
| IPC pattern | `#[tauri::command]` + Zod-validated invoke wrapper | Type-safe, validated both ends. |
| Updater channel | Single stable channel from GitHub Releases | Simple, no staging confusion. |
| Signing strategy | Apple Developer ID + Azure Trusted Signing | No EV cert hardware, CI-friendly. |
| Auto-update | tauri-plugin-updater 2.x with Ed25519 signature | Required for Tauri; cannot be disabled. |

### Versions Table (verified 2026-04-27)

| Component | Version | Released | Source |
|---|---|---|---|
| Tauri | 2.10.3 | 2026-04 | https://github.com/tauri-apps/tauri/releases |
| Svelte | 5.55.0 | 2026-04 | https://github.com/sveltejs/svelte/releases |
| SvelteKit | 2.20.4 | 2026-03 | https://kit.svelte.dev |
| @sveltejs/adapter-static | 3.0.10 | 2025-10 | https://npmjs.com/package/@sveltejs/adapter-static |
| Vite | 8.0.10 | 2026-04 | https://vite.dev/releases |
| TypeScript | 5.8.3 | 2025-03 | https://github.com/microsoft/typescript/releases |
| Node.js | 24.15.0 LTS | 2026-04 | https://nodejs.org |
| pnpm | 10.33.2 | 2026-04 | https://github.com/pnpm/pnpm/releases |
| Rust | 1.86 stable | 2026-04 | https://blog.rust-lang.org |
| sqlx | 0.8.6 | 2025 | https://crates.io/crates/sqlx |
| tauri-plugin-sql | 2.3.x | 2026 | https://crates.io/crates/tauri-plugin-sql |
| tauri-plugin-store | 2.x | 2026 | https://v2.tauri.app/plugin/store |
| tauri-plugin-updater | 2.x | 2026 | https://v2.tauri.app/plugin/updater |
| tauri-plugin-log | 2.x | 2026 | https://v2.tauri.app/plugin/logging |
| tracing | 0.1.x | 2026 | https://crates.io/crates/tracing |
| Vitest | 4.1.5 | 2026-04 | https://github.com/vitest-dev/vitest/releases |
| Playwright | 1.59.1 | 2026-04 | https://github.com/microsoft/playwright/releases |
| Biome | 2.4.0 | 2026-02 | https://biomejs.dev |
| Tailwind CSS | 4.1.5 | 2026 | https://tailwindcss.com |
| Zod | 4.0.5 | 2026 | https://zod.dev |

### Minimum Host Requirements

- macOS 11+ (Big Sur), 8 GB RAM, 15 GB disk free.
- Windows 10 21H2+ or Windows 11, 8 GB RAM, 15 GB disk free.
- Linux: Ubuntu 22.04+ / Fedora 38+ / Arch (rolling), webkit2gtk-4.1, 8 GB RAM, 15 GB disk free.

### Cold-start estimate

`git clone` to running dev app on a fresh machine with prerequisites already installed: 4–7 minutes (first cargo build dominates).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Xcode Command Line Tools (provides clang, git)
xcode-select --install

# 2. Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Node 24 LTS via Homebrew
brew install node@24
echo 'export PATH="/opt/homebrew/opt/node@24/bin:$PATH"' >> ~/.zshrc
exec zsh

# 4. pnpm
corepack enable
corepack prepare pnpm@10.33.2 --activate

# 5. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
rustup component add clippy rustfmt

# 6. Tauri CLI
cargo install tauri-cli --version "^2.0" --locked

# 7. Verify
node --version    # v24.15.0
pnpm --version    # 10.33.2
rustc --version   # rustc 1.86.0 (...)
cargo tauri --version  # tauri-cli 2.x
```

### Windows (PowerShell as Administrator)

```powershell
# 1. Microsoft C++ Build Tools (required by Rust + Tauri)
winget install --id Microsoft.VisualStudio.2022.BuildTools --silent --accept-source-agreements --accept-package-agreements --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

# 2. WebView2 Runtime (preinstalled on Windows 11; verify)
winget install Microsoft.EdgeWebView2Runtime

# 3. Node 24 LTS
winget install OpenJS.NodeJS.LTS

# 4. pnpm
corepack enable
corepack prepare pnpm@10.33.2 --activate

# 5. Rust (run in a NEW PowerShell window after step 1)
winget install Rustlang.Rustup
rustup default stable
rustup component add clippy rustfmt

# 6. Tauri CLI
cargo install tauri-cli --version "^2.0" --locked

# 7. Verify (open new PowerShell)
node --version
pnpm --version
rustc --version
cargo tauri --version
```

### Linux (Ubuntu / Debian)

```bash
# 1. System deps for Tauri (webkit2gtk 4.1)
sudo apt update
sudo apt install -y \
  libwebkit2gtk-4.1-dev \
  build-essential \
  curl \
  wget \
  file \
  libxdo-dev \
  libssl-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  pkg-config

# 2. Node 24 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs

# 3. pnpm
sudo corepack enable
corepack prepare pnpm@10.33.2 --activate

# 4. Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"
rustup component add clippy rustfmt

# 5. Tauri CLI
cargo install tauri-cli --version "^2.0" --locked

# 6. Verify
node --version && pnpm --version && rustc --version && cargo tauri --version
```

### Required Accounts

| Account | Link | What's needed |
|---|---|---|
| GitHub | https://github.com/signup | Repo hosting, releases, CI. |
| Apple Developer Program | https://developer.apple.com/programs/ | $99/yr. Developer ID Application cert for macOS signing/notarization. |
| Azure account | https://azure.microsoft.com | Azure Trusted Signing for Windows code signing (~$10/mo). |
| Sentry | https://sentry.io | Error tracking, free tier sufficient for solo dev. |

### CLI Auth Steps

```bash
gh auth login                              # GitHub CLI for releases
xcrun notarytool store-credentials ...     # macOS only; see section 12
```

### Bootstrap Commands

```bash
# Create app
pnpm create tauri-app@latest my-app -- --template svelte-ts --manager pnpm
cd my-app

# Install plugins this rulebook standardizes on
cargo add tauri-plugin-sql --features sqlite --manifest-path src-tauri/Cargo.toml
cargo add tauri-plugin-store --manifest-path src-tauri/Cargo.toml
cargo add tauri-plugin-updater --manifest-path src-tauri/Cargo.toml
cargo add tauri-plugin-log --manifest-path src-tauri/Cargo.toml
cargo add sqlx --features "runtime-tokio sqlite migrate" --manifest-path src-tauri/Cargo.toml
cargo add tracing tracing-subscriber --features "env-filter json" --manifest-path src-tauri/Cargo.toml
cargo add serde --features derive --manifest-path src-tauri/Cargo.toml
cargo add serde_json anyhow thiserror tokio --manifest-path src-tauri/Cargo.toml --features "tokio/full"

pnpm add -D @sveltejs/adapter-static @biomejs/biome vitest @playwright/test svelte-check zod
pnpm add @tauri-apps/api @tauri-apps/plugin-sql @tauri-apps/plugin-store @tauri-apps/plugin-updater @tauri-apps/plugin-log

# First run
pnpm tauri dev
```

### Expected First-Run Output

```
   Compiling tauri-build v2.x.x
   ...
   Compiling my-app v0.1.0 (.../src-tauri)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 1m 42s
     Running `target/debug/my-app`
  VITE v8.0.10  ready in 412 ms
  ➜  Local:   http://localhost:1420/
```

A native window opens displaying the Svelte default app.

### Common First-Run Errors → Exact Fix

| Error | Fix |
|---|---|
| `failed to find webkit2gtk-4.1` (Linux) | `sudo apt install libwebkit2gtk-4.1-dev` |
| `error: linker 'cc' not found` (Linux) | `sudo apt install build-essential` |
| `error: Microsoft Visual C++ 14.0 is required` (Windows) | Install VS Build Tools, restart shell. |
| `xcrun: error: invalid active developer path` (macOS) | `xcode-select --install` |
| `error: command not found: tauri` | `cargo install tauri-cli --version "^2.0" --locked` |
| `error: cannot find macro 'tauri::generate_handler'` | Run `cargo clean` in `src-tauri/`, rebuild. |
| White window, no content | Frontend dev server not on port 1420; check `tauri.conf.json` `build.devUrl`. |
| `Error: not allowed by ACL` at runtime | Add capability/permission in `src-tauri/capabilities/default.json`. |

---

## 3. Project Layout

```
my-app/
├── src/                              # Svelte frontend
│   ├── routes/
│   │   ├── +layout.ts                # export const ssr = false; prerender = true
│   │   ├── +layout.svelte            # global shell, theme, nav
│   │   ├── +page.svelte              # home route
│   │   └── (app)/                    # authed group
│   ├── lib/
│   │   ├── ipc/
│   │   │   ├── client.ts             # typed invoke wrapper, never call invoke() directly
│   │   │   └── schemas.ts            # Zod schemas for every command
│   │   ├── components/               # reusable UI
│   │   ├── stores/                   # $state runes wrapped in .svelte.ts
│   │   └── utils/                    # pure helpers
│   ├── app.html                      # SvelteKit shell
│   ├── app.css                       # Tailwind entrypoint
│   └── app.d.ts                      # ambient types
├── src-tauri/                        # Rust backend
│   ├── src/
│   │   ├── main.rs                   # binary entry; calls lib
│   │   ├── lib.rs                    # tauri::Builder setup, generate_handler
│   │   ├── commands/                 # one module per domain
│   │   │   ├── mod.rs
│   │   │   ├── notes.rs
│   │   │   └── settings.rs
│   │   ├── db/
│   │   │   ├── mod.rs                # pool init, migrations
│   │   │   └── migrations/           # *.sql files
│   │   ├── models/                   # serde structs shared with frontend
│   │   ├── error.rs                  # AppError enum + IntoResponse
│   │   └── state.rs                  # tauri::State managed types
│   ├── capabilities/
│   │   └── default.json              # least-privilege permissions
│   ├── icons/                        # iconset
│   ├── build.rs
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   └── gen/                          # generated; gitignored
├── tests/
│   ├── unit/                         # Vitest *.test.ts
│   └── e2e/                          # Playwright *.spec.ts
├── static/                           # public assets copied as-is
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── .vscode/
├── .cursor/rules
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── svelte.config.js
├── vite.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── biome.json
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### Naming Conventions

- Svelte components: `PascalCase.svelte` (e.g. `NoteList.svelte`).
- Routes: lowercase, hyphenated (e.g. `src/routes/note-detail/+page.svelte`).
- Stores using runes: `kebab-case.svelte.ts` (the `.svelte.ts` extension is required for runes outside components).
- Rust modules: `snake_case.rs`.
- Tauri commands: `snake_case` Rust → exposed as `snake_case` IPC handler.
- Test files: `<name>.test.ts` (unit) or `<name>.spec.ts` (e2e).
- SQL migrations: `NNNN_description.sql` (e.g. `0001_create_notes.sql`).

### "If you're adding X, it goes in Y"

| Artifact | Location |
|---|---|
| New Tauri command | `src-tauri/src/commands/<domain>.rs` + register in `lib.rs` `generate_handler!` |
| New IPC schema | `src/lib/ipc/schemas.ts` (Zod) + matching Rust struct in `src-tauri/src/models/` |
| New SQL migration | `src-tauri/src/db/migrations/NNNN_*.sql` |
| New Svelte route | `src/routes/<path>/+page.svelte` |
| Reusable component | `src/lib/components/<Name>.svelte` |
| Global state | `src/lib/stores/<name>.svelte.ts` using `$state` |
| Pure helper (TS) | `src/lib/utils/<name>.ts` |
| Pure helper (Rust) | `src-tauri/src/<domain>/<name>.rs` |
| Capability change | `src-tauri/capabilities/default.json` |
| Plugin registration | Both `Cargo.toml` AND `lib.rs` `.plugin(...)` AND `tauri.conf.json` if it has frontend bindings |
| New env var | `.env.example` (committed) + accessed via `import.meta.env.VITE_*` |
| New runtime secret | OS keyring via `keyring` crate, never `.env` |
| Icon update | `src-tauri/icons/` + run `cargo tauri icon path/to/source.png` |
| Static asset | `static/` (copied as-is to bundle) |
| New unit test | `tests/unit/<name>.test.ts` or alongside Rust file as `#[cfg(test)] mod tests` |
| New e2e test | `tests/e2e/<flow>.spec.ts` |
| GitHub Actions step | `.github/workflows/release.yml` |

---

## 4. Architecture

### Process Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│                      Tauri Application                       │
│                                                              │
│  ┌────────────────────┐         ┌─────────────────────────┐ │
│  │   Webview (Svelte) │  IPC    │   Core Process (Rust)   │ │
│  │   - SvelteKit SPA  │ <─────> │   - tauri::Builder      │ │
│  │   - Vite dev/build │ invoke  │   - command handlers    │ │
│  │   - Zod validation │ events  │   - sqlx pool           │ │
│  │   NO node, NO fs   │         │   - tracing logs        │ │
│  └────────────────────┘         └─────────────────────────┘ │
│                                            │                 │
│                                            ▼                 │
│                                    ┌──────────────┐         │
│                                    │ SQLite file  │         │
│                                    │ AppLocalData │         │
│                                    └──────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (typical action: "create note")

```
User click in Svelte
  → onClick handler in +page.svelte
  → calls ipc.notes.create({title, body}) from src/lib/ipc/client.ts
  → schemas.ts validates input with Zod
  → @tauri-apps/api invoke("create_note", {input})
  ↓ IPC bridge (JSON-serialized)
  → Rust command create_note(state, input) in commands/notes.rs
  → input deserialized via serde
  → state.db.acquire() → INSERT ... RETURNING ...
  → returns Result<Note, AppError>
  ↓ IPC bridge
  → Promise<Note> resolves in Svelte
  → $state store updated → UI re-renders
```

### Auth Flow (single-user desktop)

```
First launch:
  → no app.db exists → run migrations → seed empty
  → show onboarding screen → user sets master password
  → argon2id hash stored in users table
  → derive 32-byte key from password (argon2 with stored salt)
  → cache key in tauri::State for session

Subsequent launches:
  → check users table → if hash exists → show login
  → user enters password → re-derive key → compare hash
  → on match: cache key in State, navigate to /(app)
  → on mismatch: increment fail counter, lock after 5 fails
```

### State Management Flow

```
Backend mutation
  → command returns updated entity
  → Svelte caller updates store: store.notes = [...store.notes, newNote]
  → $derived recomputes filtered/sorted views
  → templates re-render via fine-grained reactivity

Backend-initiated update (rare):
  → Rust emits app.emit("note-updated", payload)
  → Svelte +layout.svelte listens via @tauri-apps/api/event listen()
  → updates store → UI reacts
```

### Entry-Point File Map

| File | Responsibility |
|---|---|
| `src-tauri/src/main.rs` | `fn main()` calls `my_app_lib::run()` and nothing else. |
| `src-tauri/src/lib.rs` | Public `run()`, builds `tauri::Builder`, registers plugins, manages state, calls `generate_handler!`. |
| `src-tauri/src/state.rs` | Defines `AppState { db: SqlitePool, ... }` managed via `.manage()`. |
| `src-tauri/src/error.rs` | `AppError` enum implementing `serde::Serialize` so commands can `?` propagate. |
| `src/app.html` | Mount point, CSP meta tag, theme attribute. |
| `src/routes/+layout.ts` | `export const ssr = false; export const prerender = true;` — required for Tauri. |
| `src/lib/ipc/client.ts` | Single source of truth for invoke calls; every command goes through here. |

### Where Business Logic Lives

- **In Rust commands** for: data persistence, file I/O, network calls, crypto, OS APIs.
- **In Svelte** for: presentation state, form orchestration, animation.
- **NEVER** in Svelte: direct SQL, direct fs access, direct keychain access. Always go through a Rust command.
- **NEVER** in Rust: HTML/CSS rendering, view-layer concerns.

---

## 5. Dev Workflow

### Start Dev Server

```bash
pnpm tauri dev
```

What runs:
- Vite dev server on `http://localhost:1420` (HMR for Svelte).
- `cargo run` builds and starts the Rust binary; rebuilds on `src-tauri/` changes.
- Tauri opens a native window pointed at the dev server.

### Hot Reload Behavior

- Svelte component edits: instant HMR, state preserved.
- TypeScript edits in `src/`: instant HMR.
- Rust edits: full backend recompile (5–60 s), window reloads automatically.
- `tauri.conf.json` edits: require manual `Ctrl+C` + `pnpm tauri dev`.
- Capability JSON edits: full restart required.

### Hot Reload Breaks When

- You add a new `#[tauri::command]` and forget to register it in `generate_handler!`.
- You change `Cargo.toml` features; run `pnpm tauri dev` from clean.
- Vite HMR connection drops if the webview was offline >30 s; press `Ctrl+R` in the window.

### Debugger Attach

**VS Code / Cursor (recommended)**: install `rust-analyzer` and `Svelte for VS Code`. Use the launch configs in section 15.

```bash
# Frontend devtools
# Right-click in dev window → Inspect Element. Devtools open in a separate window.

# Rust debugger via CodeLLDB
# F5 with .vscode/launch.json present → breakpoints in src-tauri/src/**/*.rs
```

### Inspect Network/Storage/State

- Network: in dev only, the IPC bridge logs to stdout when `RUST_LOG=tauri::ipc=debug`.
- DB: open `~/Library/Application Support/<bundle-id>/app.db` (macOS) / `%LOCALAPPDATA%\<bundle-id>\app.db` (Windows) / `~/.local/share/<bundle-id>/app.db` (Linux) in `sqlite3` or DBeaver.
- Svelte state: install Svelte DevTools browser extension; loads in the dev webview.
- Tracing logs: `RUST_LOG=info pnpm tauri dev` prints to terminal.

### Pre-commit Checks

`.husky/pre-commit` (installed via `pnpm add -D husky` then `pnpm exec husky init`):

```bash
#!/usr/bin/env sh
pnpm biome check --write --no-errors-on-unmatched .
pnpm svelte-check --tsconfig ./tsconfig.json
( cd src-tauri && cargo fmt --check && cargo clippy --all-targets -- -D warnings )
```

### Branch + Commit Conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat: add note search`, `fix(db): handle empty result`).
- One PR per feature; squash-merge to `main`.

---

## 6. Testing & Parallelization

### Unit Tests (Frontend)

```bash
pnpm vitest                 # watch mode
pnpm vitest run             # one-shot, CI mode
pnpm vitest run --coverage  # with v8 coverage
pnpm vitest run path/to/file.test.ts
pnpm vitest run -t "creates a note"
```

Tests live in `tests/unit/**/*.test.ts` or alongside source as `<name>.test.ts`. Naming: `<file-under-test>.test.ts`.

### Unit Tests (Rust)

```bash
( cd src-tauri && cargo test )
( cd src-tauri && cargo test --lib commands::notes )
( cd src-tauri && cargo test -- --nocapture )
```

Tests live inside source files under `#[cfg(test)] mod tests { ... }` or in `src-tauri/tests/`.

### Integration Tests

`tests/unit/integration/*.test.ts` — boot a real `:memory:` SQLite via tauri-plugin-sql in test harness; never mock the DB.

### E2E (Playwright + tauri-driver)

```bash
# One-time setup
cargo install tauri-driver --locked

# Run e2e (parallel workers default)
pnpm playwright test
pnpm playwright test --project=desktop --workers=4
pnpm playwright test tests/e2e/notes.spec.ts
pnpm playwright test --headed
```

### Parallelization Config (`playwright.config.ts`)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : 4,
  reporter: [['html', { open: 'never' }], ['list']],
  use: {
    baseURL: 'http://localhost:1420',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: 'pnpm tauri build --debug && pnpm tauri-driver',
    url: 'http://localhost:4444',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
  projects: [
    { name: 'desktop', use: { browserName: 'chromium' } },
  ],
});
```

### Mocking Rules

| Layer | Rule |
|---|---|
| SQLite | NEVER mock. Use `:memory:` pool in tests. |
| Tauri commands (frontend tests) | Mock at `src/lib/ipc/client.ts` boundary only. |
| HTTP / external APIs | Mock at adapter boundary (one wrapper per service). |
| File system | NEVER mock; use `tempfile` crate (Rust) or `os.tmpdir()` (TS). |
| Time | Inject a clock; never mock `Date.now` or `std::time` globally. |

### Coverage Target

- Frontend: 70% lines via `pnpm vitest run --coverage`. CI fails below.
- Rust: `cargo install cargo-llvm-cov --locked` then `cargo llvm-cov --fail-under-lines 70`.

### Visual Regression

Out of scope for v1. Use Playwright's `expect(page).toHaveScreenshot()` for critical screens only; commit baselines to `tests/e2e/__screenshots__/`.

### Parallel AI Subagent Patterns

| Safe to parallelize (disjoint files) | Must be sequential (shared file) |
|---|---|
| Scaffold a new command + scaffold its Vitest harness | Anything touching `Cargo.toml` or `package.json` |
| Add a Svelte component + add its `.test.ts` | Anything touching `tauri.conf.json` |
| Implement model + implement migration | Anything touching `lib.rs` `generate_handler!` |
| Write Rust unit test + write TS unit test for the same feature | Anything touching `capabilities/default.json` |

---

## 7. Logging

### Rust Logger Setup (`src-tauri/src/lib.rs`)

```rust
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,my_app=debug"));

    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().json().with_target(true).with_file(true).with_line_number(true))
        .init();
}
```

### Log Levels

| Level | When |
|---|---|
| `error!` | Operation failed, user-visible. |
| `warn!` | Recoverable degradation (e.g. retry succeeded). |
| `info!` | Lifecycle events: app start, command invoked, migration run. |
| `debug!` | Per-call detail: query took N ms, cache hit/miss. |
| `trace!` | Argument-level dump; only when chasing a specific bug. |

### Required Fields

Every log line must have: `event` (string), `module` (auto from target), `request_id` (UUID per command invocation, propagated via `tracing::Span`).

For user-related logs add `user_id`. For DB ops add `query_ms`.

### Sample Log Lines

```
{"timestamp":"2026-04-27T14:02:11Z","level":"INFO","target":"my_app","fields":{"event":"app.boot","version":"0.1.0"}}
{"timestamp":"2026-04-27T14:02:14Z","level":"INFO","target":"my_app::commands::notes","fields":{"event":"command.invoked","name":"create_note","request_id":"3f..."}}
{"timestamp":"2026-04-27T14:02:14Z","level":"DEBUG","target":"my_app::db","fields":{"event":"db.query","query_ms":3,"rows":1,"request_id":"3f..."}}
{"timestamp":"2026-04-27T14:02:14Z","level":"ERROR","target":"my_app::commands::notes","fields":{"event":"command.failed","name":"create_note","error":"unique_violation","request_id":"3f..."}}
```

### Where Logs Go

- Dev: stdout (terminal running `pnpm tauri dev`).
- Prod: file rotation via `tauri-plugin-log` to `BaseDirectory::AppLog/<bundle-id>/logs/app.log` + Sentry transport for `error!` and `warn!`.

### Grep Locally

```bash
# Stream while filtering
RUST_LOG=info,my_app=debug pnpm tauri dev | grep '"event":"command'

# Prod log location
# macOS: ~/Library/Logs/<bundle-id>/
# Windows: %LOCALAPPDATA%\<bundle-id>\logs\
# Linux: ~/.local/share/<bundle-id>/logs/
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm svelte-check && pnpm biome check && cd src-tauri && cargo clippy --all-targets -- -D warnings` before declaring a task done.
2. Always validate every IPC command input with a Zod schema in `src/lib/ipc/schemas.ts` before calling `invoke`.
3. Always validate every IPC command input with `serde` + manual range/length checks at the start of the Rust handler.
4. Always register new Tauri commands in THREE places: implementation file, `pub use` in `commands/mod.rs`, and `tauri::generate_handler!` in `lib.rs`.
5. Always register new Tauri plugins in THREE places: `Cargo.toml`, `tauri.conf.json` if it has frontend bindings, and `.plugin(...)` chain in `lib.rs`.
6. Always grant the minimum capability required; add a new capability entry rather than widening `core:default`.
7. Always use `BaseDirectory::AppLocalData` for the SQLite file. Never hardcode an absolute path.
8. Always run migrations at app startup before any other DB access.
9. Always wrap multi-statement DB writes in a transaction with `pool.begin()`.
10. Always return `Result<T, AppError>` from `#[tauri::command]` functions; never panic.
11. Always set `export const ssr = false; export const prerender = true;` in `+layout.ts` (Tauri serves static).
12. Always access Tauri APIs only from inside `onMount` or event handlers — never at module top-level (load functions run during prerender without Tauri).
13. Always use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`); never use `let` for reactive vars or `$:` reactive statements.
14. Always put runes-using stores in files with `.svelte.ts` extension.
15. Always run `pnpm tauri dev` once after editing `tauri.conf.json` to confirm it parses.
16. Always sign release artifacts. Set `TAURI_SIGNING_PRIVATE_KEY` for the updater, plus platform code-signing creds.
17. Always increment the version in `package.json` AND `src-tauri/Cargo.toml` AND `src-tauri/tauri.conf.json` together — they must match.
18. Always use the typed `ipc` client in `src/lib/ipc/client.ts`; never call `invoke()` directly from a component.
19. Always use `tracing::instrument` on commands so request IDs propagate through the call tree.
20. Always store secrets at runtime in the OS keyring via the `keyring` crate; never plain text on disk.
21. Always pin Rust toolchain via `rust-toolchain.toml` in `src-tauri/`.
22. Always use `pnpm` (never npm/yarn) — the lockfile format differs and CI assumes pnpm.

### 8.2 NEVER

1. Never call `fetch` or use `node:fs` from frontend code; route through a Rust command.
2. Never enable Tauri's `dangerousDisableAssetCspModification` or set CSP to `*`.
3. Never grant `fs:allow-*-recursive` or `shell:allow-execute` without a domain-scoped scope.
4. Never use Svelte 4 syntax (`export let`, `$:`, store `$` autosubscribe rules) — this project is runes-mode.
5. Never run untrusted SQL via `query!` with interpolation; always use bind params.
6. Never store user passwords; store argon2id hashes only.
7. Never bundle secrets in the frontend — `import.meta.env.VITE_*` ships in the binary; treat as public.
8. Never check in `src-tauri/target/`, `node_modules/`, `.env`, signing keys, or `*.p12`.
9. Never bypass migrations by editing the DB file by hand outside dev seed scripts.
10. Never publish a release without a corresponding signed `latest.json` for the updater.
11. Never call Tauri APIs inside SvelteKit `load` functions that run during prerender.
12. Never share a single `SqlitePool` connection across panics; always use `?` to propagate errors.
13. Never use `unwrap()` or `expect()` in command handlers; map to `AppError`.
14. Never enable `withGlobalTauri: true` unless you have a deliberate reason; it leaks `__TAURI__` to all webviews.
15. Never use `tauri-plugin-shell`'s open with user-controlled URLs without a regex scope filter.
16. Never disable the auto-updater signature check.
17. Never put `.unwrap_or_default()` on DB results in security-critical code paths.
18. Never log full request bodies or PII at `info!`; redact at the source.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every JS command | `pnpm install --frozen-lockfile && pnpm svelte-check && pnpm vitest run` |
| `pnpm-lock.yaml` | install reproducibility | `pnpm install --frozen-lockfile` (must succeed without changes) |
| `src-tauri/Cargo.toml` | Rust build, plugin set | `cd src-tauri && cargo check --all-targets && cargo clippy -- -D warnings` |
| `src-tauri/Cargo.lock` | reproducibility | `cargo build --locked` |
| `src-tauri/tauri.conf.json` | runtime config, bundle, capabilities | `pnpm tauri dev` (cold) + smoke flow |
| `src-tauri/capabilities/default.json` | what the frontend can call | full e2e suite + manual smoke |
| `src-tauri/src/lib.rs` | startup, plugins, command registry | full app boot, every command exercised |
| `src-tauri/src/state.rs` | global app state shape | `cargo check` + boot |
| `src-tauri/src/error.rs` | error surface to JS | typecheck + e2e error paths |
| `src-tauri/src/db/migrations/*.sql` | DB schema + types | delete dev DB, boot, run integration tests |
| `src-tauri/src/commands/**` | IPC surface | `cargo test` + Vitest IPC tests + e2e |
| `src/lib/ipc/client.ts` | every component | `pnpm svelte-check` + full e2e |
| `src/lib/ipc/schemas.ts` | input validation | typecheck + IPC tests |
| `src/routes/+layout.ts` | SSR/prerender flags | `pnpm build` then `pnpm tauri build --debug` |
| `svelte.config.js` | adapter, preprocess | full build |
| `vite.config.ts` | dev server, env, aliases | `pnpm dev` + `pnpm build` |
| `tsconfig.json` | typecheck | `pnpm svelte-check` clean |
| `biome.json` | lint/format style | `pnpm biome check .` clean |
| `playwright.config.ts` | e2e behavior | full e2e on all OS |
| `vitest.config.ts` | unit tests | `pnpm vitest run` |
| `.github/workflows/release.yml` | shipped artifacts | trigger on a tag in a fork first |
| `static/` | bundled assets | cold build + boot |
| `src-tauri/icons/` | app icon, install behavior | `cargo tauri icon` + cold build |
| `rust-toolchain.toml` | compiler version | `cd src-tauri && cargo build` |

### 8.4 Definition of Done

**Bug fix**:
- Failing test added that reproduces the bug; now passes.
- `pnpm svelte-check` green; `cargo clippy -- -D warnings` green.
- Manually verified the original repro path.
- Logs around the fix (one `tracing::warn!` or `info!` per branch).
- Conventional commit `fix(scope): ...`.

**New feature**:
- Schema migration if DB changed; tested up + down.
- Command(s) implemented with Rust unit test.
- IPC schema in Zod + Rust serde model match.
- Component/route added with at least one Vitest test.
- One Playwright happy-path e2e.
- Capability entry added if a new permission is needed.
- Screenshot of the feature attached to PR.
- `CHANGELOG.md` entry.

**Refactor**:
- No behavior change. All tests still pass.
- Diff explained in PR body.
- No new dependencies added without justification.

**Dependency bump**:
- Read CHANGELOG of the bumped lib for breaking changes.
- `pnpm install --frozen-lockfile` (regenerate lockfile if intentional).
- Full CI green on all three OS.
- Manual smoke run of the affected area.

**Schema change**:
- Forward-only migration file `NNNN_*.sql`.
- Existing rows handled (no NOT NULL without default).
- Models updated; `cargo check` green.
- Frontend types regenerated if needed.
- Integration test exercises the new column.

**Copy change**:
- Run `pnpm svelte-check` (template strings can break types in slot props).
- Visual smoke; capture screenshot.
- No code or config changes required.

### 8.5 Self-Verification Recipe

```bash
# 1. Install (frozen lockfile)
pnpm install --frozen-lockfile

# 2. Frontend typecheck
pnpm svelte-check --tsconfig ./tsconfig.json
# Expect: "svelte-check found 0 errors and 0 warnings in N files"

# 3. Lint + format
pnpm biome check .
# Expect: "Checked N files in <time>. No fixes applied."

# 4. Rust format + lint
cd src-tauri
cargo fmt --check
# Expect: no output, exit 0
cargo clippy --all-targets -- -D warnings
# Expect: "Finished `dev` profile [...]" with no warnings
cd ..

# 5. Unit tests
pnpm vitest run
# Expect: "Test Files  N passed (N) | Tests  N passed (N)"

# 6. Rust unit tests
( cd src-tauri && cargo test )
# Expect: "test result: ok. N passed; 0 failed"

# 7. E2E (only on changed area; full suite in CI)
pnpm playwright test --project=desktop
# Expect: "N passed (Xs)"

# 8. Cold build smoke
pnpm tauri build --debug
# Expect: a binary in src-tauri/target/debug/bundle/<platform>/
```

If any step fails, stop. Report the failing step and the exact output.

### 8.6 Parallelization Patterns

**Safe to fan out to parallel subagents** (each touches disjoint files):
- "Add Rust command X" + "Add Svelte component using stub of X" + "Write Vitest for X stub" — three workers.
- "Write migration 0007" + "Write migration 0008" — only if the queries don't depend on each other; merge order matters, gate behind a sequential reviewer.
- "Refactor src/lib/utils/foo.ts" + "Refactor src-tauri/src/utils/bar.rs" — different files, different toolchains.

**Must serialize**:
- Adding a plugin (`Cargo.toml` + `lib.rs` + `tauri.conf.json` are coupled).
- Bumping framework versions (`package.json` + `Cargo.toml` + `pnpm-lock` + `Cargo.lock`).
- Anything editing `capabilities/default.json` (one PR at a time).
- Anything touching `tauri::generate_handler!` (merge serially).

---

## 9. Stack-Specific Pitfalls

1. **Mixing Svelte 4 syntax with Svelte 5 runes** → symptom: `Cannot use 'export let' with runes`. Cause: copy-pasted from old tutorial. Fix: rewrite as `let { foo } = $props()` and `$state`. Detect: `pnpm svelte-check`.
2. **Calling Tauri APIs in `+layout.ts` `load`** → symptom: build fails during prerender with `window is undefined`. Cause: prerender runs in Node, no Tauri. Fix: move to `onMount` in component. Detect: `pnpm build`.
3. **Forgetting to register a command in `generate_handler!`** → symptom: `command not allowed by the ACL`. Fix: add to `tauri::generate_handler!` in `lib.rs`. Detect: full e2e suite.
4. **Plugin registered in Rust but not in `tauri.conf.json`** → symptom: frontend `invoke()` fails with `plugin not registered`. Fix: add to `plugins` block of conf. Detect: smoke run.
5. **Capability JSON not updated after adding a fs/shell call** → symptom: `not allowed by ACL`. Fix: add specific permission, never `fs:default`. Detect: smoke flow exercises new path.
6. **`adapter-static` with prerender + Tauri-only routes** → symptom: build fails on a route that depends on Tauri. Fix: set `prerender = false` on that route, keep `ssr = false`. Detect: `pnpm build`.
7. **SQLite path written to wrong base dir** → symptom: data lost on next launch on Windows. Cause: used `AppData` (roaming) instead of `AppLocalData`. Fix: switch to `BaseDirectory::AppLocalData`. Detect: log the resolved path on boot.
8. **Forgetting Vite `clearScreen: false`** → symptom: Rust compile errors disappear from terminal. Fix: set in `vite.config.ts`. Detect: deliberate Rust error not visible.
9. **CSP blocks dev HMR** → symptom: blank screen, console: `Refused to connect 'ws://localhost:1420'`. Fix: include `connect-src 'self' ws://localhost:1420 http://localhost:1420` in dev. Detect: console.
10. **Updater signature mismatch** → symptom: app refuses to update. Cause: signed with a different private key than the bundle's public key. Fix: keep one keypair, set `TAURI_SIGNING_PRIVATE_KEY` consistently in CI. Detect: trigger an update in staging.
11. **macOS notarization stalls** → symptom: build hangs at "Notarizing". Cause: Apple servers slow or auth wrong. Fix: use App Store Connect API key (not Apple ID) for CI; check status with `xcrun notarytool history`. Detect: timeout in CI.
12. **Windows SmartScreen warning** → symptom: "Windows protected your PC" on download. Cause: new signing identity has no reputation. Fix: time + downloads, or use Azure Trusted Signing which has better reputation. Detect: download from a fresh Windows VM.
13. **Linux missing webkit2gtk** → symptom: `cargo tauri dev` exits with `failed to find webkit2gtk-4.1`. Fix: install `libwebkit2gtk-4.1-dev`. Detect: the error itself.
14. **Bundle ID changed mid-project** → symptom: data appears lost on update. Cause: AppLocalData path is `${dataDir}/${bundleIdentifier}`. Fix: keep the same bundle ID forever; if you must change, ship a one-time migration step. Detect: data dir before/after.
15. **`tauri.conf.json` `frontendDist` mismatch** → symptom: white window in production builds. Cause: SvelteKit static adapter outputs `build/`, conf says `dist/`. Fix: set `"frontendDist": "../build"`. Detect: `pnpm tauri build --debug`.
16. **Forgetting `runtime-tokio` feature on sqlx** → symptom: `cannot find tokio runtime` at first query. Fix: `cargo add sqlx --features "runtime-tokio sqlite migrate"`. Detect: first query.
17. **Using `query_as!` without `DATABASE_URL`** → symptom: compile fails with `set DATABASE_URL`. Fix: set `SQLX_OFFLINE=true` and commit `.sqlx/` from `cargo sqlx prepare`, or use runtime `query_as`. Detect: CI build.
18. **Svelte event modifier `on:click|preventDefault` in Svelte 5** → symptom: warning, deprecated. Fix: use `onclick={(e) => { e.preventDefault(); ... }}`. Detect: `svelte-check`.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (idle hardware) | <800 ms to first paint | `time pnpm tauri start` measured to window-shown event |
| Dev rebuild (Rust, single-fn change) | <8 s | terminal timestamp |
| Production binary size | <30 MB per OS | `ls -lh src-tauri/target/release/bundle/...` |
| Initial JS bundle | <250 KB gzipped | `pnpm build` output, `du -sh build/_app/immutable/chunks` |
| RAM, idle | <120 MB | Activity Monitor / Task Manager |
| RAM, heavy use | <300 MB | same |
| DB query, common path | <10 ms | `tracing::info!(query_ms = ...)` log |
| IPC roundtrip | <5 ms median | bench command `bench_ipc_noop` |

When exceeded:
- Bundle size: run `pnpm build --report` (Vite Devtools) → top contributors → tree-shake or dynamic import.
- RAM: profile with `cargo flamegraph` (Linux) / Instruments (macOS); look for unbounded `Vec` growth.
- Cold start: measure with `tracing` spans on `setup`; defer non-critical plugins.

---

## 11. Security

### Secret Storage

- Build-time public values: `.env` (committed as `.env.example`), accessed via `import.meta.env.VITE_*`. Treat as public.
- Build-time signing keys: GitHub Actions secrets. Never on disk in plain text.
- Runtime user secrets (tokens, encryption keys): OS keyring via `keyring` crate. NEVER in the SQLite file unencrypted, NEVER in `.env`.

### Auth Threat Model

Single-user, on-device. Threats:
- Local malware reading the DB → mitigation: encrypt sensitive columns with key derived from user password (argon2id), key never persisted to disk.
- Stolen unlocked device → out of scope (OS-level concern); inactivity lock recommended.
- Compromised update channel → mitigation: Ed25519 signature on every update bundle, public key compiled into binary.

### Input Validation Boundary

Two boundaries:
1. Frontend: Zod parses every input before `invoke()`. Rejects with toast.
2. Rust: each `#[tauri::command]` re-validates via `serde` + explicit checks (length, range, charset). Never trust the frontend.

### Output Escaping

Svelte auto-escapes `{value}`. Use `{@html ...}` only on values that came from a Rust command that returned sanitized HTML. NEVER on user input.

### Capabilities Config

`src-tauri/capabilities/default.json` (least privilege; add one permission per new feature):

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default capabilities for the main window",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-maximize",
    "core:app:allow-version",
    "log:default",
    "store:default",
    "sql:default",
    "sql:allow-execute",
    "sql:allow-select",
    "updater:default",
    "updater:allow-check",
    "updater:allow-download-and-install"
  ]
}
```

### Dependency Audit

```bash
pnpm audit --prod                         # weekly
( cd src-tauri && cargo install cargo-audit --locked && cargo audit )
```

Add to CI; fail on high/critical.

### Top 5 Stack Risks

1. **Overly broad capabilities** → adversary in webview escalates to fs/shell. Mitigate: `core:default` only by default; add specific `*:allow-*` per command.
2. **Calling `invoke` without arg validation** → SQL injection or path traversal. Mitigate: Zod + Rust serde always; never string-concat into queries.
3. **Disabled CSP** → XSS in any imported npm dep can call IPC. Mitigate: keep `"csp": "default-src 'self'; script-src 'self'"` in `tauri.conf.json`.
4. **Self-signed updater bypassed** → supply-chain hijack. Mitigate: keep signing key in offline storage; rotate annually.
5. **Plain-text secrets in `.env`** → leaked via repo or backup. Mitigate: secrets only in OS keyring at runtime; CI secrets only in GitHub Encrypted Secrets.

---

## 12. Deploy

### Release Flow

```bash
# 1. Bump version (must match across three files)
node -e "const fs=require('fs');const v=process.argv[1];['package.json','src-tauri/tauri.conf.json'].forEach(f=>{const j=JSON.parse(fs.readFileSync(f));j.version=v;fs.writeFileSync(f,JSON.stringify(j,null,2)+'\n');});" 0.2.0
# Edit src-tauri/Cargo.toml manually: version = "0.2.0"

# 2. Update CHANGELOG.md, commit
git commit -am "chore(release): v0.2.0"

# 3. Tag (CI matches tag pattern)
git tag v0.2.0
git push origin main --tags

# 4. CI builds, signs, notarizes, uploads to GitHub Release.
```

### Staging vs Prod

One channel. `main` is prod. Use a `staging` branch + pre-release tag (`v0.2.0-rc.1`) if needed. The updater config has a single `endpoint` URL; staging users get a different endpoint via env at build time.

### Rollback

```bash
# Mark a GitHub Release as deleted; the auto-updater stops finding it.
gh release delete v0.2.0 --yes
# Bump-and-republish the prior version (e.g. v0.1.9) to "winning" via timestamps; or push an emergency v0.2.1.
```

Max safe rollback window: 24 hours. After that, expect a non-trivial fraction of users on the bad version.

### Health Check

No server. Smoke command on a fresh VM:
```bash
./bundle/<platform>/my-app --help   # exits 0
./bundle/<platform>/my-app --version
```
Plus a manual happy-path: launch, create one record, restart, verify persistence.

### Versioning

SemVer. `0.x.y` while pre-1.0. The version lives in:
- `package.json` `version`
- `src-tauri/Cargo.toml` `[package].version`
- `src-tauri/tauri.conf.json` `version`

CI fails if they diverge.

### Auto-Update Submission

1. CI builds bundles per OS.
2. CI signs each bundle with `TAURI_SIGNING_PRIVATE_KEY`.
3. CI generates `latest.json` (per `tauri-plugin-updater` schema):
   ```json
   {
     "version": "0.2.0",
     "notes": "See CHANGELOG.md",
     "pub_date": "2026-04-27T00:00:00Z",
     "platforms": {
       "darwin-aarch64": { "signature": "...", "url": "https://github.com/.../releases/download/v0.2.0/my-app_0.2.0_aarch64.dmg" },
       "darwin-x86_64": { "signature": "...", "url": "..." },
       "windows-x86_64": { "signature": "...", "url": "..." },
       "linux-x86_64": { "signature": "...", "url": "..." }
     }
   }
   ```
4. CI uploads `latest.json` to the GitHub Release.
5. App's `tauri.conf.json` updater endpoint points at `https://github.com/<org>/<repo>/releases/latest/download/latest.json`.

### macOS Notarization (CI env vars)

```
APPLE_CERTIFICATE          # base64 .p12 export
APPLE_CERTIFICATE_PASSWORD
APPLE_SIGNING_IDENTITY     # e.g. "Developer ID Application: Acme Inc (TEAMID)"
APPLE_API_ISSUER           # App Store Connect API issuer UUID
APPLE_API_KEY              # API key id
APPLE_API_KEY_PATH         # path to .p8 written by CI
```

### Windows Signing (Azure Trusted Signing)

```
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
AZURE_TRUSTED_SIGNING_ENDPOINT
AZURE_TRUSTED_SIGNING_ACCOUNT
AZURE_TRUSTED_SIGNING_PROFILE
```

### Linux

`.deb`, `.rpm`, and `.AppImage` produced by `cargo tauri build`. No signing required by default; `.AppImage` updates handled by tauri-plugin-updater.

### DNS/Domain

None required for desktop. If you self-host the updater endpoint instead of GitHub, point it at a static-hosted `latest.json` (Cloudflare Pages, S3+CloudFront).

### Cost per 1k MAU

GitHub Releases bandwidth: free (within reasonable use). Sentry: free up to 5k errors/mo. Apple Developer: $99/yr fixed. Azure Trusted Signing: ~$10/mo fixed.

Estimate at 1k MAU: ~$110/yr ($9/mo).

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# Claude Rules — this project

This project follows `tauri-svelte.md` (the rulebook). Read it before every task.

## Commands you will use

- Install: `pnpm install --frozen-lockfile`
- Dev: `pnpm tauri dev`
- Typecheck: `pnpm svelte-check --tsconfig ./tsconfig.json`
- Lint: `pnpm biome check .`
- Rust lint: `cd src-tauri && cargo clippy --all-targets -- -D warnings`
- Rust fmt: `cd src-tauri && cargo fmt --check`
- Unit tests: `pnpm vitest run`
- Rust tests: `cd src-tauri && cargo test`
- E2E: `pnpm playwright test --project=desktop`
- Build (debug): `pnpm tauri build --debug`
- Build (release): `pnpm tauri build`

## Banned patterns

- `export let` (Svelte 4); use `$props()`.
- `$:` reactive statements (Svelte 4); use `$derived` / `$effect`.
- Direct `invoke()` calls in components; use `src/lib/ipc/client.ts`.
- `unwrap()` / `expect()` in command handlers; map to `AppError`.
- Adding `core:default` permissions wholesale; add the specific permission needed.
- Storing secrets in `.env` for runtime access.
- Calling Tauri APIs in `load` functions or top-level module scope.

## Skills to invoke

- `/test-driven-development` before writing any new command or component.
- `/systematic-debugging` for investigation; never patch symptoms.
- `/verification-before-completion` before claiming done — run section 8.5 recipe.
- `/ship` to package and tag a release.
- `/cso` before merging changes that touch capabilities, signing, or the updater.

## Do NOT

- Open new issues without checking GitHub for duplicates.
- Push to `main`. Always PR from `feat/*`, `fix/*`, `chore/*`.
- Edit generated files (`src-tauri/gen/`).
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm tauri:*)",
      "Bash(pnpm svelte-check:*)",
      "Bash(pnpm biome:*)",
      "Bash(pnpm vitest:*)",
      "Bash(pnpm playwright:*)",
      "Bash(pnpm build)",
      "Bash(pnpm dev)",
      "Bash(pnpm exec:*)",
      "Bash(cargo check:*)",
      "Bash(cargo build:*)",
      "Bash(cargo test:*)",
      "Bash(cargo clippy:*)",
      "Bash(cargo fmt:*)",
      "Bash(cargo add:*)",
      "Bash(cargo run:*)",
      "Bash(cargo tauri:*)",
      "Bash(rustup:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(gh pr:*)",
      "Bash(gh release:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm biome check --write --no-errors-on-unmatched ${CLAUDE_FILE_PATHS} 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "pnpm svelte-check --tsconfig ./tsconfig.json && (cd src-tauri && cargo clippy --all-targets -- -D warnings)" }
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
# Codex Agent Rules

Same rules as `CLAUDE.md`. Read `tauri-svelte.md` first.

## Sandbox

- Filesystem: read-write inside the repo only.
- Network: allowed for `pnpm install`, `cargo`, `gh`. Block all other outbound.
- Approval: require approval for any change to `src-tauri/capabilities/**`, `src-tauri/tauri.conf.json`, `.github/workflows/release.yml`, `pnpm-lock.yaml`, `Cargo.lock`.

## Done means

Run section 8.5 of the rulebook. Paste the output. Do not claim success without the green output.

## Differences from Claude Code

- Codex has no native hooks; run the verification recipe manually at the end of every task.
- Codex tends to over-edit; keep diffs tight to the request.
- For multi-file refactors, write a plan first; ask before executing.
```

### `.codex/config.toml`

```toml
[model]
name = "gpt-5-codex"
reasoning_effort = "high"

[sandbox]
mode = "workspace-write"
network_access = "restricted"
allowed_hosts = ["registry.npmjs.org", "crates.io", "static.crates.io", "github.com", "objects.githubusercontent.com"]

[approval]
mode = "on-request"
require_approval = [
  "src-tauri/tauri.conf.json",
  "src-tauri/capabilities/**",
  ".github/workflows/**",
  "pnpm-lock.yaml",
  "src-tauri/Cargo.lock",
]

[shell]
allowed = [
  "pnpm",
  "cargo",
  "rustup",
  "git",
  "gh",
  "node",
  "rustc",
]
```

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Tauri 2 + Svelte 5 + Rust — Cursor rules

Authoritative spec: tauri-svelte.md. Read first.

## Always
- Use Svelte 5 runes (`$state`, `$derived`, `$effect`, `$props`); never Svelte 4 syntax.
- Validate IPC inputs with Zod (frontend) AND serde + manual checks (Rust).
- Register new commands in three places: file, mod.rs, lib.rs generate_handler!.
- Register new plugins in three places: Cargo.toml, lib.rs, tauri.conf.json.
- Use `BaseDirectory::AppLocalData` for SQLite path.
- Run migrations at startup before first query.
- Wrap multi-statement DB writes in `pool.begin()` transactions.
- Use the typed ipc client in `src/lib/ipc/client.ts`; never invoke directly from a component.
- Set `ssr = false; prerender = true;` in +layout.ts.
- Pin Rust toolchain via rust-toolchain.toml.

## Never
- Never call `fetch` or `node:fs` in frontend; use a Rust command.
- Never disable CSP or grant broad capabilities.
- Never use `unwrap()` / `expect()` in command handlers.
- Never store secrets in `.env` for runtime; use OS keyring.
- Never call Tauri APIs in load functions or top-level module scope.
- Never bypass migrations by editing the DB directly.
- Never check in `target/`, `node_modules/`, `.env`, or signing keys.
- Never publish a release without a signed `latest.json`.

## Verification before "done"
Run section 8.5. Paste output.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "tauri-apps.tauri-vscode",
    "svelte.svelte-vscode",
    "biomejs.biome",
    "vadimcn.vscode-lldb",
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
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Dev (Rust)",
      "cargo": {
        "args": ["build", "--manifest-path=./src-tauri/Cargo.toml", "--no-default-features"]
      },
      "preLaunchTask": "ui:dev",
      "env": { "RUST_LOG": "info,my_app=debug" }
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Tauri Build (Release)",
      "cargo": {
        "args": ["build", "--release", "--manifest-path=./src-tauri/Cargo.toml"]
      }
    }
  ]
}
```

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "ui:dev",
      "type": "shell",
      "isBackground": true,
      "command": "pnpm dev",
      "problemMatcher": []
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After all are committed, `git push` + tag yields a deployable hello-world.

### `.gitignore`

```
node_modules
build
.svelte-kit
dist
.env
.env.local
src-tauri/target
src-tauri/gen
*.log
.DS_Store
.idea
.vscode/.ropeproject
playwright-report
test-results
coverage
.sqlx
```

### `.env.example`

```
VITE_APP_NAME=my-app
VITE_SENTRY_DSN=
```

### `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "tauri": "tauri",
    "check": "svelte-kit sync && svelte-check --tsconfig ./tsconfig.json",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "e2e": "playwright test"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.0",
    "@playwright/test": "1.59.1",
    "@sveltejs/adapter-static": "3.0.10",
    "@sveltejs/kit": "2.20.4",
    "@sveltejs/vite-plugin-svelte": "5.0.0",
    "@tauri-apps/cli": "2.10.3",
    "@types/node": "24.0.0",
    "svelte": "5.55.0",
    "svelte-check": "4.0.0",
    "tailwindcss": "4.1.5",
    "typescript": "5.8.3",
    "vite": "8.0.10",
    "vitest": "4.1.5"
  },
  "dependencies": {
    "@tauri-apps/api": "2.10.3",
    "@tauri-apps/plugin-log": "2.0.0",
    "@tauri-apps/plugin-sql": "2.3.0",
    "@tauri-apps/plugin-store": "2.2.0",
    "@tauri-apps/plugin-updater": "2.4.0",
    "zod": "4.0.5"
  },
  "packageManager": "pnpm@10.33.2",
  "engines": {
    "node": ">=24.0.0",
    "pnpm": ">=10.0.0"
  }
}
```

### `tsconfig.json`

```json
{
  "extends": "./.svelte-kit/tsconfig.json",
  "compilerOptions": {
    "allowJs": false,
    "checkJs": false,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "sourceMap": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "moduleResolution": "bundler",
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vite/client", "@tauri-apps/api"]
  }
}
```

### `svelte.config.js`

```javascript
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

export default {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: 'index.html',
      precompress: false,
      strict: true,
    }),
  },
  compilerOptions: {
    runes: true,
  },
};
```

### `vite.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const host = process.env.TAURI_DEV_HOST;

export default defineConfig(async () => ({
  plugins: [sveltekit()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host ? { protocol: 'ws', host, port: 1421 } : undefined,
    watch: { ignored: ['**/src-tauri/**'] },
  },
  envPrefix: ['VITE_', 'TAURI_ENV_*'],
  build: {
    target: process.env.TAURI_ENV_PLATFORM === 'windows' ? 'chrome105' : 'safari13',
    minify: !process.env.TAURI_ENV_DEBUG ? 'esbuild' : false,
    sourcemap: !!process.env.TAURI_ENV_DEBUG,
  },
}));
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**/*.ts", "**/*.tsx", "**/*.js", "**/*.jsx", "**/*.json", "**/*.css"],
    "experimentalScannerIgnores": ["build", ".svelte-kit", "src-tauri/target", "src-tauri/gen"]
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
      "correctness": { "noUnusedVariables": "error", "noUnusedImports": "error" },
      "suspicious": { "noConsole": { "level": "warn", "options": { "allow": ["error", "warn"] } } },
      "style": { "useConst": "error", "noNonNullAssertion": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } }
}
```

### `vitest.config.ts`

```typescript
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [sveltekit()],
  test: {
    include: ['tests/unit/**/*.{test,spec}.ts', 'src/**/*.{test,spec}.ts'],
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
    setupFiles: ['./tests/unit/setup.ts'],
  },
});
```

### `tests/unit/setup.ts`

```typescript
import { vi } from 'vitest';

vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(async () => undefined),
}));
```

### `playwright.config.ts`

(Same as section 6.)

### `src-tauri/rust-toolchain.toml`

```toml
[toolchain]
channel = "1.86"
components = ["clippy", "rustfmt"]
profile = "minimal"
```

### `src-tauri/Cargo.toml`

```toml
[package]
name = "my-app"
version = "0.1.0"
description = "A Tauri App"
authors = ["you"]
edition = "2021"
rust-version = "1.86"

[lib]
name = "my_app_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2.0", features = [] }

[dependencies]
tauri = { version = "2.10", features = [] }
tauri-plugin-log = "2"
tauri-plugin-sql = { version = "2", features = ["sqlite"] }
tauri-plugin-store = "2"
tauri-plugin-updater = "2"
serde = { version = "1", features = ["derive"] }
serde_json = "1"
sqlx = { version = "0.8.6", features = ["runtime-tokio", "sqlite", "migrate", "macros", "chrono"] }
tokio = { version = "1", features = ["full"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter", "json"] }
anyhow = "1"
thiserror = "1"
argon2 = "0.5"
keyring = "3"
uuid = { version = "1", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }

[dev-dependencies]
tempfile = "3"
```

### `src-tauri/tauri.conf.json`

```json
{
  "$schema": "../node_modules/@tauri-apps/cli/config.schema.json",
  "productName": "my-app",
  "version": "0.1.0",
  "identifier": "com.example.myapp",
  "build": {
    "frontendDist": "../build",
    "devUrl": "http://localhost:1420",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "label": "main",
        "title": "my-app",
        "width": 1100,
        "height": 720,
        "minWidth": 800,
        "minHeight": 500,
        "resizable": true,
        "fullscreen": false
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' ipc: http://ipc.localhost"
    }
  },
  "bundle": {
    "active": true,
    "targets": "all",
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.icns", "icons/icon.ico"],
    "category": "Productivity",
    "shortDescription": "A Tauri App",
    "longDescription": "A Tauri App",
    "macOS": {
      "minimumSystemVersion": "11.0",
      "signingIdentity": "-",
      "entitlements": null
    },
    "windows": {
      "wix": { "language": ["en-US"] },
      "nsis": { "installMode": "perMachine" }
    },
    "linux": {
      "deb": { "depends": ["libwebkit2gtk-4.1-0", "libgtk-3-0"] }
    }
  },
  "plugins": {
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/OWNER/REPO/releases/latest/download/latest.json"
      ],
      "dialog": false,
      "pubkey": "REPLACE_WITH_TAURI_SIGNING_PUBLIC_KEY"
    }
  }
}
```

### `src-tauri/capabilities/default.json`

(Same as section 11.)

### `src-tauri/build.rs`

```rust
fn main() {
    tauri_build::build();
}
```

### `src-tauri/src/main.rs`

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    my_app_lib::run();
}
```

### `src-tauri/src/lib.rs`

```rust
mod commands;
mod db;
mod error;
mod state;

use state::AppState;
use tauri::Manager;
use tracing_subscriber::{EnvFilter, fmt, prelude::*};

fn init_tracing() {
    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,my_app=debug"));
    tracing_subscriber::registry()
        .with(env_filter)
        .with(fmt::layer().json())
        .init();
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    init_tracing();

    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::default().build())
        .setup(|app| {
            let handle = app.handle().clone();
            tauri::async_runtime::block_on(async move {
                let pool = db::init_pool(&handle).await.expect("db init");
                handle.manage(AppState { db: pool });
            });
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::notes::create_note,
            commands::notes::list_notes,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

### `src-tauri/src/state.rs`

```rust
use sqlx::SqlitePool;

pub struct AppState {
    pub db: SqlitePool,
}
```

### `src-tauri/src/error.rs`

```rust
use serde::{Serialize, Serializer};

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("database error: {0}")]
    Sqlx(#[from] sqlx::Error),
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("validation error: {0}")]
    Validation(String),
    #[error("not found")]
    NotFound,
}

impl Serialize for AppError {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        serializer.serialize_str(&self.to_string())
    }
}

pub type AppResult<T> = Result<T, AppError>;
```

### `src-tauri/src/db/mod.rs`

```rust
use sqlx::sqlite::{SqliteConnectOptions, SqlitePoolOptions};
use sqlx::SqlitePool;
use std::path::PathBuf;
use std::str::FromStr;
use tauri::{AppHandle, Manager};

pub async fn init_pool(app: &AppHandle) -> Result<SqlitePool, sqlx::Error> {
    let dir: PathBuf = app
        .path()
        .app_local_data_dir()
        .map_err(|e| sqlx::Error::Configuration(e.to_string().into()))?;
    std::fs::create_dir_all(&dir).ok();
    let db_path = dir.join("app.db");
    let url = format!("sqlite://{}", db_path.display());
    let opts = SqliteConnectOptions::from_str(&url)?
        .create_if_missing(true)
        .journal_mode(sqlx::sqlite::SqliteJournalMode::Wal);
    let pool = SqlitePoolOptions::new().max_connections(5).connect_with(opts).await?;
    sqlx::migrate!("./src/db/migrations").run(&pool).await?;
    tracing::info!(event = "db.ready", path = %db_path.display());
    Ok(pool)
}
```

### `src-tauri/src/db/migrations/0001_init.sql`

```sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notes_updated_at ON notes(updated_at DESC);
```

### `src-tauri/src/commands/mod.rs`

```rust
pub mod notes;
```

### `src-tauri/src/commands/notes.rs`

```rust
use crate::error::{AppError, AppResult};
use crate::state::AppState;
use serde::{Deserialize, Serialize};
use tauri::State;
use uuid::Uuid;

#[derive(Debug, Serialize, sqlx::FromRow)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub body: String,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Deserialize)]
pub struct CreateNoteInput {
    pub title: String,
    pub body: Option<String>,
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn create_note(state: State<'_, AppState>, input: CreateNoteInput) -> AppResult<Note> {
    if input.title.trim().is_empty() || input.title.len() > 200 {
        return Err(AppError::Validation("title length must be 1..=200".into()));
    }
    let id = Uuid::new_v4().to_string();
    let body = input.body.unwrap_or_default();
    let row: Note = sqlx::query_as(
        "INSERT INTO notes (id, title, body) VALUES (?, ?, ?) RETURNING *",
    )
    .bind(&id)
    .bind(&input.title)
    .bind(&body)
    .fetch_one(&state.db)
    .await?;
    tracing::info!(event = "note.created", id = %row.id);
    Ok(row)
}

#[tracing::instrument(skip(state))]
#[tauri::command]
pub async fn list_notes(state: State<'_, AppState>) -> AppResult<Vec<Note>> {
    let rows: Vec<Note> = sqlx::query_as("SELECT * FROM notes ORDER BY updated_at DESC")
        .fetch_all(&state.db)
        .await?;
    Ok(rows)
}
```

### `src/app.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

### `src/routes/+layout.ts`

```typescript
export const ssr = false;
export const prerender = true;
```

### `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import '../app.css';
  let { children } = $props();
</script>

{@render children()}
```

### `src/routes/+page.svelte`

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { ipc } from '$lib/ipc/client';

  let title = $state('');
  let notes = $state<{ id: string; title: string; body: string }[]>([]);

  onMount(async () => {
    notes = await ipc.notes.list();
  });

  async function add() {
    if (!title.trim()) return;
    const note = await ipc.notes.create({ title, body: '' });
    notes = [note, ...notes];
    title = '';
  }
</script>

<main>
  <h1>Notes</h1>
  <form onsubmit={(e) => { e.preventDefault(); add(); }}>
    <input bind:value={title} placeholder="New note title" />
    <button type="submit">Add</button>
  </form>
  <ul>
    {#each notes as n (n.id)}
      <li>{n.title}</li>
    {/each}
  </ul>
</main>
```

### `src/lib/ipc/schemas.ts`

```typescript
import { z } from 'zod';

export const NoteSchema = z.object({
  id: z.string(),
  title: z.string(),
  body: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const CreateNoteInputSchema = z.object({
  title: z.string().min(1).max(200),
  body: z.string().optional(),
});

export type Note = z.infer<typeof NoteSchema>;
export type CreateNoteInput = z.infer<typeof CreateNoteInputSchema>;
```

### `src/lib/ipc/client.ts`

```typescript
import { invoke } from '@tauri-apps/api/core';
import { CreateNoteInputSchema, NoteSchema, type CreateNoteInput, type Note } from './schemas';
import { z } from 'zod';

async function call<I, O>(
  name: string,
  input: I,
  inputSchema: z.ZodType<I>,
  outputSchema: z.ZodType<O>,
): Promise<O> {
  const validated = inputSchema.parse(input);
  const raw = await invoke(name, { input: validated });
  return outputSchema.parse(raw);
}

export const ipc = {
  notes: {
    create: (input: CreateNoteInput): Promise<Note> =>
      call('create_note', input, CreateNoteInputSchema, NoteSchema),
    list: (): Promise<Note[]> =>
      call('list_notes', undefined as never, z.undefined() as unknown as z.ZodType<never>, z.array(NoteSchema)),
  },
};
```

### `src/app.css`

```css
@import "tailwindcss";

:root {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
}

body { margin: 0; padding: 0; }
main { max-width: 720px; margin: 2rem auto; padding: 0 1rem; }
input { padding: 0.5rem; border: 1px solid #ccc; border-radius: 4px; }
button { padding: 0.5rem 1rem; }
```

### `tests/unit/notes.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { ipc } from '../../src/lib/ipc/client';

describe('ipc.notes', () => {
  it('validates input and parses output on create', async () => {
    vi.mocked(invoke).mockResolvedValueOnce({
      id: 'a', title: 't', body: '', created_at: 'now', updated_at: 'now',
    });
    const note = await ipc.notes.create({ title: 'hi' });
    expect(note.title).toBe('t');
  });

  it('rejects empty title', async () => {
    await expect(ipc.notes.create({ title: '' })).rejects.toThrow();
  });
});
```

### `tests/e2e/smoke.spec.ts`

```typescript
import { test, expect } from '@playwright/test';

test('app shell loads', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Notes' })).toBeVisible();
});
```

### `.github/workflows/release.yml`

```yaml
name: release

on:
  push:
    tags: [ 'v*' ]

jobs:
  build:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--target aarch64-apple-darwin'
          - platform: 'macos-latest'
            args: '--target x86_64-apple-darwin'
          - platform: 'ubuntu-22.04'
            args: ''
          - platform: 'windows-latest'
            args: ''

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - uses: pnpm/action-setup@v4
        with:
          version: 10.33.2

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.platform == 'macos-latest' && 'aarch64-apple-darwin,x86_64-apple-darwin' || '' }}

      - name: Linux deps
        if: matrix.platform == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev

      - name: pnpm install
        run: pnpm install --frozen-lockfile

      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_API_ISSUER: ${{ secrets.APPLE_API_ISSUER }}
          APPLE_API_KEY: ${{ secrets.APPLE_API_KEY }}
          APPLE_API_KEY_PATH: ${{ secrets.APPLE_API_KEY_PATH }}
        with:
          tagName: ${{ github.ref_name }}
          releaseName: '${{ github.ref_name }}'
          releaseBody: 'See CHANGELOG.md'
          releaseDraft: true
          prerelease: false
          args: ${{ matrix.args }}
```

### `.github/workflows/ci.yml`

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [ main ]
jobs:
  test:
    strategy:
      matrix:
        os: [ ubuntu-22.04, macos-latest, windows-latest ]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '24' }
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.2 }
      - uses: dtolnay/rust-toolchain@stable
        with: { components: 'clippy, rustfmt' }
      - if: matrix.os == 'ubuntu-22.04'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
      - run: pnpm install --frozen-lockfile
      - run: pnpm biome check .
      - run: pnpm svelte-check --tsconfig ./tsconfig.json
      - run: pnpm vitest run
      - run: cd src-tauri && cargo fmt --check
      - run: cd src-tauri && cargo clippy --all-targets -- -D warnings
      - run: cd src-tauri && cargo test
```

### `LICENSE`

```
MIT License — Copyright (c) 2026 <your name>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

### `README.md`

```markdown
# my-app

Tauri 2 + Svelte 5 + Rust desktop app. See `tauri-svelte.md` for the rulebook.

## Run dev
```
pnpm install
pnpm tauri dev
```

## Verify before commit
```
pnpm svelte-check && pnpm biome check . && (cd src-tauri && cargo clippy --all-targets -- -D warnings && cargo test)
```
```

### `CHANGELOG.md`

```markdown
# Changelog

## [Unreleased]
### Added
- Initial scaffold: notes CRUD, SQLite via sqlx, Svelte 5 runes UI.
```

---

## 17. Idea → MVP Path

Phase plan assuming `PROJECT_IDEA` is blank. Replace "notes" with the user's domain entity.

### Phase 1 — Schema (1 session)

Files: `src-tauri/src/db/migrations/0001_init.sql`, `src-tauri/src/models/*.rs`, `src/lib/ipc/schemas.ts`.

Exit: `cd src-tauri && cargo test` passes; `pnpm svelte-check` green; the DB file is created on first dev run.

### Phase 2 — Backbone (1 session)

Files: routes for `/`, `/(app)`, `/login`, `/settings`. `src/lib/ipc/client.ts` with stubs. `src-tauri/src/commands/*.rs` returning empty data. Plugins registered.

Exit: app boots, navigates, no commands fail with ACL errors.

### Phase 3 — Vertical slice (2 sessions)

One full feature end-to-end: list → create → update → delete for the primary entity. Vitest for the IPC client, Rust unit test for each command, one Playwright happy-path.

Exit: a user can create, edit, and delete one entity from a clean install.

### Phase 4 — Auth + multi-user (1 session)

argon2id master password, session lock-on-idle, key derived from password caches in `tauri::State`. Encrypt sensitive columns if applicable. Add `users` migration.

Exit: cold launch shows login; correct password unlocks; wrong password locks after 5 attempts.

### Phase 5 — Ship + monitor (1 session)

CI release workflow. Code signing creds wired. Tag `v0.1.0`. Auto-updater verified by triggering an update from `v0.1.0` to `v0.1.1`. Sentry DSN set.

Exit: a fresh download installs, runs, and self-updates.

---

## 18. Feature Recipes

### Authentication (master password, no cloud)

1. Add `users` migration: `id, password_hash, created_at, last_login_at`.
2. `src-tauri/src/commands/auth.rs`: `set_password(input) -> AppResult<()>`, `verify_password(input) -> AppResult<bool>`. Use `argon2::Argon2::default().hash_password(...)`.
3. Cache derived 32-byte key in `tauri::State<'_, AuthState>` after successful verify.
4. Frontend route guard in `src/routes/(app)/+layout.ts`: check `await ipc.auth.isUnlocked()`; redirect to `/login` if false.

### File Upload (local file → SQLite blob)

1. Add capability `dialog:default`, `dialog:allow-open`.
2. Frontend: `import { open } from '@tauri-apps/plugin-dialog'`; `const path = await open({ multiple: false });`.
3. Send only the path to a Rust command; the command does `tokio::fs::read(path)` and `INSERT INTO attachments (id, name, blob) VALUES (...)`.
4. Never send the file bytes through IPC; Tauri serializes binary inefficiently.

### Stripe (in-app webview, deeplink)

Out of scope for desktop. If needed, open the system browser via `tauri-plugin-shell` `open(url)` to a Stripe Checkout URL with a `success_url` deep-linked back to the app via custom URL scheme.

### Push Notifications (system notifications)

1. `cargo add tauri-plugin-notification` + register; capability `notification:default`.
2. Frontend: `import { sendNotification } from '@tauri-apps/plugin-notification'`.
3. Wrap in a permission prompt the first time.

### Background Jobs

Use `tokio::spawn` inside the Rust setup hook for long-running tasks. Persist queue state in SQLite. Resume on next boot.

### Realtime Updates

Within the app: `app.emit("entity-changed", payload)` from Rust → frontend `listen("entity-changed", cb)`. Across machines: out of scope for v1; add a sync server later.

### Search

`CREATE VIRTUAL TABLE notes_fts USING fts5(title, body, content='notes', content_rowid='id');` plus triggers to mirror inserts/updates/deletes. Command: `search(query) -> Vec<Note>` using `MATCH ?`.

### i18n

`pnpm add svelte-i18n` (or a tiny custom solution). Locale files in `src/lib/i18n/<locale>.json`. Default to OS locale via `navigator.language`.

### Dark Mode

Add `data-theme="light|dark|system"` on `<html>`. Persist via `tauri-plugin-store`. Listen to `prefers-color-scheme` for `system`.

### Analytics Events

Privacy-respecting: log events to a local table, optional opt-in upload to a self-hosted endpoint. NEVER ship a third-party analytics SDK without explicit consent.

---

## 19. Troubleshooting (Top 30)

| Error | Fix |
|---|---|
| `error: failed to find webkit2gtk-4.1` | `sudo apt install libwebkit2gtk-4.1-dev` |
| `error: linker 'cc' not found` | `sudo apt install build-essential` |
| `error: Microsoft Visual C++ 14.0 is required` | Install VS Build Tools (Windows). |
| `xcrun: error: invalid active developer path` | `xcode-select --install` |
| `error: command not found: tauri` | `cargo install tauri-cli --version "^2.0" --locked` |
| `not allowed by ACL` | Add the specific permission to `capabilities/default.json`. |
| `command not registered` | Add to `tauri::generate_handler!` in `lib.rs`. |
| `plugin 'sql' not registered` | Add `.plugin(tauri_plugin_sql::Builder::default().build())` AND `cargo add tauri-plugin-sql`. |
| `window is undefined` (during build) | Move Tauri call from `+layout.ts` to `onMount`. |
| `Cannot use 'export let' with runes` | Convert to `let { ... } = $props();`. |
| `$: is not allowed in runes mode` | Use `$derived(...)` or `$effect(...)`. |
| `cannot find tokio runtime` (sqlx) | Add `runtime-tokio` feature on sqlx. |
| `set DATABASE_URL` (sqlx compile) | Use runtime `query_as` (not `query_as!`) or `cargo sqlx prepare`. |
| `frontendDist not found` | Set `"frontendDist": "../build"` in `tauri.conf.json`. |
| White window on prod | Verify `frontendDist` and that `pnpm build` produced `build/index.html`. |
| Updater silently fails | Inspect logs at info; check `pubkey` in conf matches signing key. |
| Notarization timeout | `xcrun notarytool history` to inspect; retry with API key auth. |
| SmartScreen on Windows | Sign with Azure Trusted Signing, or wait for reputation. |
| `code signing identity not found` | Import `.p12` into login keychain or use CI-side env. |
| `unique constraint failed` | The `id` you're inserting already exists; use `INSERT ... ON CONFLICT DO ...` or fresh UUID. |
| `database is locked` | Enable WAL: `journal_mode(SqliteJournalMode::Wal)` (already in `db/mod.rs`). |
| Hot reload stops after Rust edit | Wait for cargo recompile (5–60 s); check terminal. |
| Vite "port 1420 in use" | Kill stale process: `lsof -i:1420` (mac/linux) / `netstat -ano \| findstr 1420` (Windows). |
| Sentry not initialized | Check `VITE_SENTRY_DSN` is set in `.env`. |
| Migrations not applied | Verify `sqlx::migrate!("./src/db/migrations")` path; rebuild. |
| Capability JSON parse error | Run `pnpm tauri dev` once; the error message names the field. |
| Bundle size huge | Run with `--release`; check `pnpm build --report` for fat chunks. |
| Test runner picks up Rust files | Ensure `vitest.config.ts` `include` doesn't match `src-tauri/`. |
| `keyring` errors on Linux CI | Linux needs Secret Service; use a stub in CI or `keyring-rs` with `linux-no-secret-service`. |
| pnpm "lockfile mismatch" | Use `pnpm install --frozen-lockfile` locally to reproduce; only regenerate intentionally. |

---

## 20. Glossary

- **ACL** (Access Control List): the permissions Tauri grants the frontend to call backend commands and OS APIs. Defined per-window in `capabilities/*.json`.
- **adapter-static**: SvelteKit module that compiles your app to plain HTML/CSS/JS files (no server needed). Required for Tauri.
- **argon2id**: Modern password-hashing function. Used to store password hashes securely.
- **Biome**: A single tool that replaces ESLint + Prettier; it lints and formats JavaScript/TypeScript.
- **bundle ID** / **identifier**: Unique string for your app (e.g. `com.example.myapp`). Used by the OS to scope app data and entitlements.
- **capability**: A JSON file granting specific permissions to specific windows in Tauri.
- **cargo**: Rust's package manager and build tool.
- **clippy**: Rust's linter; flags style and correctness issues.
- **Conventional Commits**: Commit message format (`feat:`, `fix:`, `chore:`) that powers automatic changelogs.
- **CSP** (Content Security Policy): Browser/webview rule that limits where scripts/styles/connections can come from. Defends against XSS.
- **Ed25519**: Asymmetric signature algorithm Tauri uses to sign updater bundles.
- **HMR** (Hot Module Replacement): Vite's mechanism for updating modules in a running app without reload.
- **invoke**: Frontend function (`@tauri-apps/api/core`) that calls a Rust command by name.
- **IPC** (Inter-Process Communication): How the webview talks to Rust. In Tauri, JSON over a custom bridge.
- **migration**: A `.sql` file that evolves the database schema. Applied in order at startup.
- **notarization**: Apple's automated security check for macOS apps. Required for distribution outside the App Store.
- **pnpm**: Disk-efficient Node package manager. Stores one copy of each version globally.
- **pool** (sqlx): A reusable set of database connections. Faster than opening a new connection per query.
- **prerender**: SvelteKit option that runs each route at build time and emits a static HTML file.
- **rune**: Svelte 5 reactive primitive (`$state`, `$derived`, `$effect`, `$props`).
- **rustup**: Tool to manage Rust toolchain versions.
- **serde**: Rust serialization/deserialization library. Tauri uses it for IPC payloads.
- **sqlx**: Rust SQL toolkit with compile-time-checked queries (no ORM).
- **SSR** (Server-Side Rendering): Generating HTML on a server. Disabled in this stack (`ssr = false`).
- **Svelte**: UI framework that compiles to small, fast vanilla JS.
- **SvelteKit**: Application framework on top of Svelte (router, build, adapters).
- **Tauri**: Rust framework for building desktop apps with web UIs.
- **tauri.conf.json**: Tauri's config file. Defines bundle, security, plugins.
- **tauri-driver**: Adapter that lets Playwright/WebDriver control a Tauri webview for e2e tests.
- **tracing**: Rust crate for structured, span-based logs.
- **TypeScript**: Typed superset of JavaScript.
- **updater (tauri-plugin-updater)**: Plugin that downloads and verifies signed updates from a static `latest.json`.
- **Vite**: Frontend build tool. Dev server uses native ESM; build uses Rolldown (Vite 8).
- **Vitest**: Test runner aligned with Vite. Replaces Jest for Vite projects.
- **webkit2gtk**: WebView used by Tauri on Linux.
- **WebView2**: Microsoft Edge engine used by Tauri on Windows.
- **Zod**: TypeScript schema validation library. Single source of truth for shapes.

---

## 21. Update Cadence

This rulebook is valid for:
- Tauri 2.10.x
- Svelte 5.55.x
- SvelteKit 2.20.x
- Rust 1.86.x
- pnpm 10.33.x
- Node 24.x

Re-run the generator when:
- Major version bump in any of the above.
- A new Tauri plugin replaces one listed here.
- A security advisory hits any pinned version.
- Apple/Microsoft change signing requirements.

**Date stamp**: 2026-04-27.
