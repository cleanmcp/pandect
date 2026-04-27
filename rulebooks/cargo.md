# Cargo Crate — AI Rulebook

> Rust library + optional CLI binary published to crates.io. Cargo workspace, cargo-release for version+publish, cargo-dist for prebuilt CLI binaries (mac/linux/windows + brew tap + npm wrapper), clippy + rustfmt + doc tests, cargo-deny + cargo-audit for supply-chain, MSRV pinned + CI matrix, GitHub Releases sync, optional docs.rs custom features.

Last updated: 2026-04-27. Rulebook valid for Rust stable 1.95.x, cargo-release 1.1.x, cargo-dist 0.31.x.

---

## 1. Snapshot

**Stack:** Rust workspace (lib + CLI bin) → crates.io + GitHub Releases + Homebrew tap + npm wrapper.

### Decisions

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Rust 2024 edition | Edition stable since 1.85; default for new crates |
| Runtime + version | rustc stable 1.95.0 (released 2026-04-16) | Current stable; pinned via `rust-toolchain.toml` |
| Package manager | cargo (bundled with rustc) | Only sane choice; no alternatives |
| Build tool | cargo + cargo workspace | Native; workspace shares lockfile + target dir |
| State mgmt | n/a (library) — CLI uses `clap` derive | Library has no state; clap is de-facto CLI parser |
| Routing/Nav | n/a | Library + CLI; no routing |
| Data layer (db + orm) | n/a in template; example uses none | Generic util crate; no DB |
| Auth | n/a | Library; auth is caller's concern |
| Styling | n/a (CLI uses `anstyle` for color) | Decoupled from clap, terminal-safe |
| Forms + validation | `clap` v4 derive macros | Argument parsing + validation built in |
| Unit test runner | `cargo nextest` 0.9.133 | 60% faster than `cargo test`, JUnit XML, retries |
| E2E framework | `assert_cmd` + `predicates` for CLI | De-facto; spawns binary, asserts on stdout/stderr |
| Mocking strategy | trait objects + `mockall` 0.13 | Idiomatic Rust; avoid global mocks |
| Logger | `tracing` 0.1 + `tracing-subscriber` 0.3 | Standard async-aware structured logger |
| Error tracking | n/a in lib; bin uses `color-eyre` 0.6 | Sentry is opt-in; lib propagates with `thiserror` |
| Lint + format | `clippy -D warnings` + `rustfmt` (stable) | Bundled; clippy as hard gate |
| Type checking | `cargo check` (rustc) | Built in; no separate tool |
| Env vars + secrets | `CARGO_REGISTRY_TOKEN` (legacy) or OIDC trusted publishing | Trusted Publishing via OIDC GA on crates.io 2026-Q1 |
| CI provider | GitHub Actions | Required for cargo-dist + Trusted Publishing |
| Deploy target | crates.io + GitHub Releases + Homebrew tap + npm wrapper | cargo-dist generates all four |
| Release flow | `cargo release` (workspace-aware) → tag → CI publishes | Single command; CI picks up tag |
| Auto-update | Homebrew `brew upgrade`; npm `npm i -g`; install script re-run | cargo-dist installer scripts pull latest |
| Test runner override | `cargo nextest run` for unit/integration; `cargo test --doc` for doctests | Nextest does not run doctests |
| Binary distribution | `cargo dist` 0.31.0 (axodotdev) | mac/linux/windows + brew + npm in one tool |
| Supply-chain | `cargo-deny` 0.16 + `cargo-audit` 0.22.1 | Licenses + bans + advisories; audit reads RustSec |
| MSRV policy | rustc N-2 (current 1.95 → MSRV 1.93) | Covers stable for ~12 weeks; matches Tokio/hyper norms |
| Semver gate | `cargo-semver-checks` 0.47.0 | Catches breaking API changes pre-publish |
| Coverage | `cargo-llvm-cov` (LLVM source-based) | Ships with rustc; replaces tarpaulin |
| Cross-compile | `cross-rs` 0.2.5 (containerized) | For CI builds targeting musl/arm |
| Sigstore | `sigstore` cosign keyless via cargo-dist | Optional artifact signing in release |

### Versions (verified 2026-04-27)

| Crate / Tool | Version | Released | Link |
|---|---|---|---|
| rustc / cargo | 1.95.0 | 2026-04-16 | <https://blog.rust-lang.org/2026/04/16/Rust-1.95.0/> |
| cargo-release | 1.1.2 | 2025-05-01 | <https://github.com/crate-ci/cargo-release> |
| cargo-dist | 0.31.0 | 2026-Q1 | <https://github.com/axodotdev/cargo-dist> |
| cargo-deny | 0.16.4 | 2026 | <https://github.com/EmbarkStudios/cargo-deny> |
| cargo-audit | 0.22.1 | 2026 | <https://crates.io/crates/cargo-audit> |
| cargo-nextest | 0.9.133 | 2026 | <https://nexte.st/> |
| cargo-semver-checks | 0.47.0 | 2026-03-08 | <https://github.com/obi1kenobi/cargo-semver-checks> |
| cargo-llvm-cov | 0.6 | 2026 | <https://github.com/taiki-e/cargo-llvm-cov> |
| cargo-msrv | 0.16 | 2026 | <https://github.com/foresterre/cargo-msrv> |
| cross-rs | 0.2.5 | 2025 | <https://github.com/cross-rs/cross> |
| clap | 4.5 | 2026 | <https://crates.io/crates/clap> |
| tracing | 0.1.40 | 2026 | <https://crates.io/crates/tracing> |
| anyhow | 1.0 | 2026 | <https://crates.io/crates/anyhow> |
| thiserror | 2.0 | 2026 | <https://crates.io/crates/thiserror> |
| color-eyre | 0.6 | 2026 | <https://crates.io/crates/color-eyre> |
| serde | 1.0 | 2026 | <https://crates.io/crates/serde> |
| assert_cmd | 2.0 | 2026 | <https://crates.io/crates/assert_cmd> |
| mockall | 0.13 | 2026 | <https://crates.io/crates/mockall> |

### Minimum host requirements

- macOS 12+ (Apple Silicon or Intel), Windows 10+ x64, Linux glibc 2.31+ x64/aarch64.
- 4 GB RAM (8 GB recommended for full workspace builds).
- 5 GB disk for `target/` after a clean release build.
- Network: GitHub + crates.io + docs.rs reachable.

### Cold-start estimate

`git clone` → `cargo build --release` → tests green: **3–8 minutes** on a 2024 laptop with a warm dep cache. First build after upgrade: 12+ minutes.

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Xcode CLT (compiler, linker)
xcode-select --install

# 2. Install Homebrew (skip if already present)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Install rustup (manages toolchains)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"

# 4. Install dev tools
brew install gh git jq
cargo install cargo-release@1.1.2 \
              cargo-dist@0.31.0 \
              cargo-deny@0.16.4 \
              cargo-audit@0.22.1 \
              cargo-nextest@0.9.133 \
              cargo-semver-checks@0.47.0 \
              cargo-llvm-cov \
              cargo-msrv

# 5. Auth
gh auth login           # GitHub for releases + Trusted Publishing
# crates.io token (only needed if not using Trusted Publishing):
# cargo login <token from https://crates.io/settings/tokens>
```

### Windows (PowerShell as user, not admin)

```powershell
# 1. Install rustup (downloads MSVC build tools prompt if missing)
winget install --id Rustlang.Rustup -e --accept-source-agreements --accept-package-agreements

# 2. Install GitHub CLI + git
winget install --id GitHub.cli -e
winget install --id Git.Git -e

# 3. Install dev tools (open a new shell so cargo is on PATH)
cargo install cargo-release cargo-dist cargo-deny cargo-audit cargo-nextest cargo-semver-checks cargo-llvm-cov cargo-msrv

# 4. Auth
gh auth login
```

### Linux (Ubuntu/Debian)

```bash
# 1. System deps
sudo apt update
sudo apt install -y build-essential pkg-config libssl-dev curl git jq

# 2. rustup
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y --default-toolchain stable
source "$HOME/.cargo/env"

# 3. GitHub CLI
type -p curl >/dev/null || sudo apt install curl -y
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list >/dev/null
sudo apt update && sudo apt install gh -y

# 4. Cargo tools
cargo install cargo-release cargo-dist cargo-deny cargo-audit cargo-nextest cargo-semver-checks cargo-llvm-cov cargo-msrv

# 5. Auth
gh auth login
```

### Accounts to create

- **GitHub** (<https://github.com/signup>): hosts the repo, releases, Trusted Publishing identity provider.
- **crates.io** (<https://crates.io/>): sign in with GitHub. Reserve the crate name early via `cargo publish` from a stub.
- **Homebrew tap repo** (optional): create empty `homebrew-<tap>` repo; cargo-dist pushes formula on release.
- **npm** (optional, for npm wrapper): `npm login`; cargo-dist generates and publishes JS wrapper package.

### Bootstrap a new crate

```bash
# Pick a name. crates.io enforces global uniqueness — check first:
curl -sI https://crates.io/api/v1/crates/stringops | head -1
# 404 means free.

cargo new --lib stringops
cd stringops
git init
gh repo create stringops --public --source=. --remote=origin

# Convert to workspace + add CLI bin (see section 16 for full file contents):
mkdir -p crates/stringops crates/stringops-cli
# ... copy files from section 16 ...

cargo build
cargo nextest run
cargo test --doc
```

### Expected first-run output

```
$ cargo build
   Compiling stringops v0.1.0 (/path/to/stringops/crates/stringops)
   Compiling stringops-cli v0.1.0 (/path/to/stringops/crates/stringops-cli)
    Finished `dev` profile [unoptimized + debuginfo] target(s) in 4.23s

$ cargo nextest run
    Starting 3 tests across 2 binaries
        PASS [   0.012s] stringops::tests::reverse_works
        PASS [   0.011s] stringops::tests::upper_works
        PASS [   0.014s] stringops-cli integration::cli_help
------------
     Summary [   0.041s] 3 tests run: 3 passed, 0 skipped
```

### First-run errors → fix

| Error | Fix |
|---|---|
| `error: linker 'cc' not found` (Linux) | `sudo apt install build-essential` |
| `error: Microsoft C++ Build Tools is required` (Windows) | rustup will offer; accept the MSVC option |
| `error: failed to run custom build command for openssl-sys` | Linux: `sudo apt install libssl-dev pkg-config`; macOS: `brew install openssl@3` |
| `error: package 'stringops' is already taken` | Pick a different name; check <https://crates.io/crates/<name>> |
| `error: cannot find binary 'cargo-nextest'` | `cargo install cargo-nextest --locked` |
| `error: rustc 1.93.0 is not installed` (when MSRV verification runs) | `rustup install 1.93.0` |
| `error: failed to load manifest for workspace member` | Path in `[workspace] members` is wrong; check paths and re-run |

---

## 3. Project Layout

```
stringops/
├── Cargo.toml              # workspace root
├── Cargo.lock              # COMMITTED for bin crates; libraries also commit (since 1.84)
├── rust-toolchain.toml     # pin stable channel
├── rustfmt.toml            # formatter rules
├── clippy.toml             # lint thresholds
├── deny.toml               # license + advisory policy
├── dist-workspace.toml     # cargo-dist v0.27+ workspace config
├── README.md
├── LICENSE-MIT
├── LICENSE-APACHE
├── CHANGELOG.md            # keep-a-changelog format
├── CLAUDE.md
├── AGENTS.md
├── .cargo/
│   └── config.toml         # build flags, alias shortcuts
├── .cursor/
│   └── rules
├── .claude/
│   └── settings.json
├── .github/
│   ├── workflows/
│   │   ├── ci.yml          # PR + push: lint, test, MSRV matrix
│   │   ├── release.yml     # cargo-dist generated; do not hand-edit
│   │   └── audit.yml       # daily cargo-audit cron
│   └── dependabot.yml
├── crates/
│   ├── stringops/          # the library (published as `stringops`)
│   │   ├── Cargo.toml
│   │   ├── README.md       # symlinked or copied from root README
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── reverse.rs
│   │   │   └── case.rs
│   │   ├── tests/          # integration tests (each .rs = own binary)
│   │   │   └── reverse.rs
│   │   ├── benches/        # criterion benchmarks
│   │   └── examples/       # `cargo run --example foo`
│   └── stringops-cli/      # the binary (published as `stringops-cli`)
│       ├── Cargo.toml
│       ├── src/
│       │   ├── main.rs
│       │   └── cli.rs
│       └── tests/
│           └── cli.rs      # assert_cmd integration
└── target/                 # build output (gitignored)
```

### Naming conventions

- Crate names: `kebab-case` on crates.io, `snake_case` when imported (cargo auto-converts).
- Modules + files: `snake_case.rs`.
- Types: `UpperCamelCase`. Traits: `UpperCamelCase`, often with verb adjective (`Readable`, `Display`).
- Functions, methods, locals: `snake_case`.
- Constants + statics: `SCREAMING_SNAKE_CASE`.
- Test functions: `fn it_does_x()` or `fn x_works()`. Keep imperative.
- Integration test files: one binary each; `tests/feature_name.rs`.
- Benches: `benches/bench_name.rs`, criterion harness.

### "Adding X → goes in Y"

| Artifact | Location |
|---|---|
| New library function | `crates/stringops/src/<module>.rs` + `pub use` from `lib.rs` |
| New CLI subcommand | `crates/stringops-cli/src/cli.rs` (clap derive enum) |
| Unit test (white-box) | Bottom of the same `.rs` file under `#[cfg(test)] mod tests` |
| Integration test (black-box, lib) | `crates/stringops/tests/<feature>.rs` |
| Integration test (CLI) | `crates/stringops-cli/tests/<feature>.rs` using `assert_cmd` |
| Doctest | `///` doc comment with ` ``` ` block on the public item |
| Benchmark | `crates/stringops/benches/<name>.rs` (criterion) |
| Example program | `crates/stringops/examples/<name>.rs` |
| Shared internal helper across crates | `crates/<name>-internal/` (private, `publish = false`) |
| Build script | `crates/<name>/build.rs` |
| Feature flag declaration | `[features]` table in that crate's `Cargo.toml` |
| Public re-export | `lib.rs` `pub use crate::module::Item;` |
| Error type | `crates/stringops/src/error.rs` with `thiserror::Error` |
| New dependency | `[workspace.dependencies]` in root, then `name = { workspace = true }` in member |
| MSRV bump | `rust-version = "1.93"` in `[package]` + CI matrix `msrv` job |
| Release notes entry | `CHANGELOG.md` under `## [Unreleased]` (cargo-release moves it on tag) |

---

## 4. Architecture

### Workspace process boundary

```
┌─────────────────────────────────────────────────────────┐
│ cargo workspace (single Cargo.lock, shared target/)     │
│                                                          │
│  ┌──────────────────────┐   ┌──────────────────────┐    │
│  │ crates/stringops     │◄──│ crates/stringops-cli │    │
│  │ (lib, published)     │   │ (bin, published)     │    │
│  │ no I/O, pure logic   │   │ argv → lib calls     │    │
│  └──────────────────────┘   └──────────────────────┘    │
└─────────────────────────────────────────────────────────┘
         ↓ cargo publish              ↓ cargo dist
   crates.io/stringops          GitHub Releases
                                + Homebrew tap
                                + npm wrapper
                                + install.sh / install.ps1
```

### Library data flow (typical call)

```
caller crate
   │
   │ stringops::reverse("hello")
   ▼
lib.rs (re-exports)
   │
   ▼
reverse.rs::reverse(input: &str) -> String
   │
   ▼ Returns owned String; no I/O, no allocation surprises documented in /// doc
caller
```

### CLI data flow

```
argv ──► clap::Parser::parse() ──► Cli enum
                                     │
                                     ▼
                              match cli.command
                                ├─ Reverse { input } → stringops::reverse(&input) → println!
                                └─ Upper { input }   → stringops::upper(&input)   → println!
                                     │
                                     ▼
                          stderr (tracing-subscriber, --verbose flag)
```

### Auth flow (release-time only)

```
git tag v0.2.0 ──► push ──► GitHub Actions release.yml
                                  │
                                  ▼
                          cargo dist plan + build matrix
                                  │
                                  ▼
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
            crates.io        GitHub Release    Homebrew tap PR
       (OIDC token via      (assets uploaded)  (formula bumped)
        crate-ci/manifest)                     + npm publish
```

### State management

Library is pure — no global state, no `lazy_static`, no thread-locals unless the API explicitly documents them. CLI keeps state in stack-allocated `Cli` struct produced by clap; never use `static mut`.

### File-to-responsibility map

| File | Responsibility |
|---|---|
| `crates/stringops/src/lib.rs` | Re-exports public API, crate-level docs, `#![deny(missing_docs)]` |
| `crates/stringops/src/error.rs` | `pub enum Error` with `thiserror`; `pub type Result<T> = std::result::Result<T, Error>;` |
| `crates/stringops-cli/src/main.rs` | `fn main() -> color_eyre::Result<()>` — thin: parse, dispatch, exit |
| `crates/stringops-cli/src/cli.rs` | `#[derive(clap::Parser)]` definitions only |
| `Cargo.toml` (root) | `[workspace]`, `[workspace.dependencies]`, `[workspace.package]` |
| `Cargo.toml` (member) | `[package]`, `[features]`, `[[bin]]`, `[package.metadata.docs.rs]` |
| `dist-workspace.toml` | cargo-dist installer + target matrix configuration |

Business logic lives in the **library**. The CLI is a thin shell that parses argv and prints. **Never** put logic inside `main.rs` or `cli.rs`.

---

## 5. Dev Workflow

### Start

```bash
# Build everything
cargo build

# Run the CLI in dev
cargo run -p stringops-cli -- reverse hello
# → olleh

# Run with verbose tracing
RUST_LOG=debug cargo run -p stringops-cli -- reverse hello

# Watch mode (install once: cargo install cargo-watch)
cargo watch -x "nextest run" -x "test --doc" -x "clippy --all-targets -- -D warnings"
```

### Hot reload

There is no hot-reload for Rust. Each change recompiles the affected crate. Use `cargo watch` to automate the rebuild loop.

### Debuggers

- **VS Code / Cursor**: install `rust-lang.rust-analyzer` + `vadimcn.vscode-lldb`. Use the `launch.json` in section 15.
- **JetBrains RustRover**: native nextest integration since 2026.1; click the gutter icon next to a `#[test]`.
- **CLI debug**: `rust-lldb target/debug/stringops-cli` (macOS) / `rust-gdb` (Linux). Set breakpoint with `b stringops::reverse::reverse`.

### Inspect at runtime

- `dbg!(expr)` — prints `[file:line] expr = value` and returns the value. Strip before commit.
- `tracing::debug!(?value, "label")` for structured logs.
- `cargo expand -p stringops` to see macro-expanded code (install `cargo-expand`).
- `cargo asm stringops::reverse` for generated assembly (install `cargo-show-asm`).

### Pre-commit checks

`.git/hooks/pre-commit` (or use `lefthook` / `pre-commit` framework):

```bash
#!/usr/bin/env bash
set -e
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --workspace -- -D warnings
cargo nextest run --workspace
cargo test --doc --workspace
```

### Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `release/<version>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `perf:`, `test:`, `ci:`, `build:`).
- One logical change per commit. PR titles also use Conventional Commits — git-cliff/cargo-release reads them for CHANGELOG entries.

---

## 6. Testing & Parallelization

### Commands

```bash
# Unit + integration (excludes doctests)
cargo nextest run --workspace --all-features

# Doctests (nextest does not support these)
cargo test --doc --workspace --all-features

# Single test by name pattern
cargo nextest run --workspace -E 'test(reverse_handles_unicode)'

# Single integration file
cargo nextest run -p stringops --test reverse

# Watch one test
cargo watch -x "nextest run -E 'test(reverse_handles_unicode)'"

# With coverage (HTML report at target/llvm-cov/html/index.html)
cargo llvm-cov nextest --workspace --html

# Benchmarks
cargo bench -p stringops
```

### Where tests live

- **Unit tests:** bottom of the file under test. `#[cfg(test)] mod tests { use super::*; ... }`. Can access private items.
- **Integration tests:** `crates/<name>/tests/*.rs`. One file = one binary. Only public API.
- **Doctests:** in `///` doc comments. Compiled and run as part of `cargo test --doc`.
- **CLI E2E:** `crates/stringops-cli/tests/cli.rs` using `assert_cmd::Command::cargo_bin("stringops-cli")`.

### Mocking rules

- **Mock at trait boundaries.** Define traits for I/O (e.g. `trait Storage { fn read(&self, k: &str) -> Result<Bytes>; }`), implement for real impl, use `mockall::mock!` for tests.
- **Never mock the standard library.** `std::fs`, `std::time::Instant`, `std::env::var` — wrap them in a thin trait if you need fakes.
- **Never mock the database in DB-touching crates.** Use a real in-process SQLite via `tempfile`, or testcontainers for Postgres.
- **Pure functions — no mocks.** Call them directly with literals.

### Coverage target

- Minimum: 80% line coverage for library crates. CLI crates: 70% (UX paths are integration-tested).
- Enforced in CI via `cargo llvm-cov --fail-under-lines 80`.

### Visual regression

n/a (CLI/library). Replace with **golden file tests** for CLI output: store expected stdout in `tests/golden/<name>.stdout` and use `insta` 1.x for snapshot comparison.

### Parallelization for AI agents

**Safe to fan out into parallel subagents:**

- Add a new module + its unit tests + its doctests (single file, no shared edits).
- Write three independent integration test files in `tests/`.
- Update README, CHANGELOG, and a doc comment (separate files).

**Must run sequentially:**

- Anything touching root `Cargo.toml` or `Cargo.lock` (lockfile is workspace-global; concurrent writes corrupt it).
- Anything touching `[workspace.dependencies]` — every member crate's resolution depends on it.
- MSRV bumps — affects every member.
- `cargo release` — single git author, single tag.

---

## 7. Logging

### Setup (CLI binary only — libraries do NOT initialize subscribers)

`crates/stringops-cli/src/main.rs`:

```rust
use tracing_subscriber::{fmt, EnvFilter};

fn init_tracing(verbose: u8) {
    let level = match verbose {
        0 => "warn",
        1 => "info",
        2 => "debug",
        _ => "trace",
    };
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(format!("stringops={level},stringops_cli={level}")));
    fmt()
        .with_env_filter(filter)
        .with_target(true)
        .with_writer(std::io::stderr) // stdout is for program output
        .compact()
        .init();
}
```

### Levels

- `error!` — operation failed; user-visible.
- `warn!` — degraded but recoverable; flag for inspection.
- `info!` — significant lifecycle event (start, finish, config loaded).
- `debug!` — developer-facing detail.
- `trace!` — extremely verbose; per-call.

Libraries emit at `debug` and below. The `tracing` crate is zero-cost when no subscriber is attached.

### Required fields

For every span and event:

- `module = module_path!()` (auto by `tracing`)
- `event` — verb-noun (`processing_input`, `wrote_output`)
- `request_id` — when applicable (CLI invocation id from uuid)
- `duration_ms` — for spans that close

### Sample log lines

```
2026-04-27T10:01:02.123Z  INFO stringops_cli: starting cli version=0.1.0 args=["reverse","hello"]
2026-04-27T10:01:02.124Z DEBUG stringops::reverse: reversing input len=5
2026-04-27T10:01:02.124Z DEBUG stringops::reverse: reversed output len=5 duration_us=12
2026-04-27T10:01:02.125Z  INFO stringops_cli: completed exit_code=0
2026-04-27T10:01:02.125Z ERROR stringops_cli: failed to read input error="No such file or directory (os error 2)" path="/nope"
```

### Where logs go

- **Dev:** stderr (`tracing-subscriber` default). stdout reserved for program output.
- **Prod (binary distribution):** stderr by default. CLI users redirect: `stringops-cli ... 2>log.txt`.
- **Library users' app:** they own subscriber init.

### Grep locally

```bash
RUST_LOG=stringops=debug cargo run -p stringops-cli -- reverse hello 2>&1 | grep ERROR
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `cargo fmt --all && cargo clippy --all-targets --all-features --workspace -- -D warnings && cargo nextest run --workspace && cargo test --doc --workspace` before declaring a task done.
2. Always pin `rust-toolchain.toml` to a specific stable version (no `channel = "stable"` without `components`).
3. Always declare the MSRV in `[package] rust-version = "<x.y>"` and verify it in CI on every PR.
4. Always commit `Cargo.lock` for both binaries AND libraries (Rust 1.84+ best practice).
5. Always declare shared deps in `[workspace.dependencies]` and reference them from members with `name = { workspace = true }`.
6. Always set `default-features = false` on heavy optional deps (`tokio`, `reqwest`, `serde`, `clap`) and opt back into the features you need.
7. Always include `[package.metadata.docs.rs]` with `all-features = true` (or named features) so docs.rs builds them.
8. Always include `readme = "README.md"`, `license`, `description`, `repository`, `homepage`, `documentation`, `keywords`, `categories` in `[package]`. crates.io rejects publishes lacking required fields.
9. Always run `cargo semver-checks` before bumping the version on a library crate.
10. Always use `?` and `Result<T, E>` for fallible operations; never `unwrap()` outside tests, examples, or `fn main`.
11. Always prefer `&str` over `String` and `&[T]` over `Vec<T>` in function signatures.
12. Always derive `Debug` on every public type; derive `Clone, Copy, PartialEq, Eq, Hash` where the type semantically supports them.
13. Always document every `pub` item with `///` and at least one runnable example or `# Errors` / `# Panics` section.
14. Always gate `unsafe` blocks behind `// SAFETY:` comments justifying every invariant.
15. Always use `tracing` (not `log`, not `println!`) for diagnostic output; reserve `println!`/`print!` for program output.
16. Always run `cargo deny check` and `cargo audit` in CI; both must pass for green.
17. Always run integration tests via `assert_cmd` with `Command::cargo_bin("stringops-cli")`, not by spawning random binaries.
18. Always use `thiserror` for library error types and `anyhow`/`color-eyre` for binary error handling.
19. Always run `cargo dist plan` after editing `dist-workspace.toml` and commit any regenerated `.github/workflows/release.yml`.
20. Always reserve a crate name on crates.io with a 0.0.0 stub before doing serious work — names are first-come-first-served.
21. Always set `publish = false` on internal helper crates that should not appear on crates.io.
22. Always use `cargo release` for version bumps so workspace deps and tags stay in sync.
23. Always update CHANGELOG.md `[Unreleased]` section in the same PR as the change; cargo-release moves it on tag.

### 8.2 NEVER

1. Never bump version numbers by hand-editing `Cargo.toml`. Use `cargo release`.
2. Never push a tag without verifying CI green on the same commit.
3. Never publish a workspace member that depends on an unpublished `path = "..."` member. cargo-release rewrites paths to versions; do not bypass it.
4. Never enable `default-features = true` for `tokio`, `reqwest`, or `serde` without reviewing what gets pulled in.
5. Never use `unwrap()` or `expect()` in library code paths. Test code is the one exception.
6. Never write `pub use foo::*;` in `lib.rs`. Re-export named items so downstream users get a stable API surface.
7. Never use `std::sync::Mutex` for state that crosses an `.await`; use `tokio::sync::Mutex` or refactor to message-passing.
8. Never panic in a `Drop` impl unless already panicking (will abort the process).
9. Never call `.clone()` reflexively to silence the borrow checker; understand the lifetime first.
10. Never commit secrets to `.cargo/config.toml`, `Cargo.toml`, or `[env]` blocks.
11. Never enable `nightly` features in stable releases. If you need them, gate behind a feature flag and CI it on nightly only.
12. Never use `tokio::main` macro in a library. Top-level runtime is the binary's choice.
13. Never re-export internal types from a `*-internal` crate as part of your public API; they are not semver-stable.
14. Never run `cargo update` blindly inside a release branch; pin via `--precise`.
15. Never use `#[allow(...)]` to silence clippy without a comment explaining why the lint is wrong here.
16. Never depend on `git = "..."` or `path = "..."` for crates published to crates.io — both fail to publish.
17. Never store CLI flag defaults as runtime statics. Put them in clap's `#[arg(default_value_t = ...)]`.
18. Never break MSRV without bumping the major (or, for 0.x, minor) version and announcing in CHANGELOG.
19. Never commit `target/` or `.cargo/credentials.toml`. Both are in the standard gitignore.
20. Never publish without `cargo package --list` review — confirms which files ship.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `Cargo.toml` (root) | every crate, lockfile, CI | `cargo build --workspace && cargo nextest run --workspace && cargo test --doc` |
| `Cargo.lock` | reproducibility, CI cache | `cargo build --workspace --locked` |
| `rust-toolchain.toml` | every command | full CI matrix run |
| `crates/<name>/Cargo.toml` | that crate + dependents | `cargo build -p <name> && cargo test -p <name>` |
| `[workspace.dependencies]` | every member that uses the dep | full workspace test |
| `[features]` block | feature combinations | `cargo hack --feature-powerset check` (install cargo-hack) |
| `crates/stringops/src/lib.rs` | public API surface | `cargo semver-checks check-release && cargo doc` |
| `crates/stringops/src/error.rs` | every error site | `cargo build --workspace && manual scan of `?` sites` |
| `crates/stringops-cli/src/cli.rs` | UX, integration tests | `assert_cmd` integration suite + `--help` snapshot |
| `crates/stringops-cli/src/main.rs` | binary behavior | full E2E + `cargo dist build --artifacts=local` |
| `dist-workspace.toml` | release pipeline | `cargo dist plan` (zero diff on .github/workflows/release.yml) |
| `.github/workflows/ci.yml` | every PR | open a PR; observe matrix |
| `.github/workflows/release.yml` | publishing | dry-run via `gh workflow run release.yml -f dry_run=true` |
| `deny.toml` | supply-chain gate | `cargo deny check` |
| `clippy.toml` | lint passes | `cargo clippy --all-targets --all-features` |
| `rustfmt.toml` | formatting | `cargo fmt --all -- --check` |
| `rust-version` field | MSRV CI job | `cargo +1.93 build --workspace --locked` |
| `[package.metadata.docs.rs]` | docs.rs builds | trigger doc build by publishing to a test version, or `cargo +nightly doc --all-features` |
| `[package.metadata.dist]` | binary build matrix | `cargo dist build` locally |
| `README.md` (root) | crates.io listing | `cargo package --list` shows it; `cargo publish --dry-run` |
| `LICENSE-MIT` / `LICENSE-APACHE` | crates.io legal | both must be present and SPDX-correct in `license = "MIT OR Apache-2.0"` |
| `build.rs` | compile-time codegen | full clean build: `cargo clean && cargo build` |
| `tests/` directory | integration coverage | `cargo nextest run --workspace --tests` |
| `examples/` directory | example compilation | `cargo build --examples --workspace` |
| `benches/` directory | criterion harness | `cargo bench --no-run` |
| `CHANGELOG.md` | release notes, GitHub Release body | `cargo release` reads `[Unreleased]` |

### 8.4 Definition of Done (per task type)

**Bug fix:**

- [ ] Failing test added that reproduces the bug, then passes.
- [ ] Root cause noted in commit message (one line).
- [ ] `cargo nextest run` + `cargo test --doc` green.
- [ ] `cargo clippy -- -D warnings` clean.
- [ ] CHANGELOG entry under `### Fixed`.
- [ ] No new `unwrap()` introduced.

**New feature:**

- [ ] Public API has `///` docs with at least one doctest.
- [ ] Unit tests + integration tests added.
- [ ] Feature flag added if behavior is opt-in (`[features] my-feature = ["dep:..."]`).
- [ ] CHANGELOG entry under `### Added`.
- [ ] `cargo semver-checks check-release` reports no breaking changes (or a major bump is intentional).
- [ ] README `## Features` updated if user-visible.

**Refactor:**

- [ ] Public API unchanged (verified via `cargo semver-checks`).
- [ ] No new dependencies.
- [ ] Tests unchanged or strictly more thorough.
- [ ] No CHANGELOG entry needed unless behavior shifts.

**Dependency bump:**

- [ ] Read upstream CHANGELOG for breaking notes.
- [ ] `cargo update -p <crate> --precise <version>` (not blanket update).
- [ ] Full test suite + doctests green.
- [ ] `cargo audit` clean.
- [ ] If MSRV-affecting, run MSRV CI job locally: `cargo +1.93 build --workspace --locked`.
- [ ] CHANGELOG entry under `### Changed` with old → new version.

**Schema change** (n/a for stringops — this is a generic util crate). For crates with on-disk formats: bump the major version, document migration in CHANGELOG, ship a `migrate` subcommand.

**Copy change** (README, CHANGELOG, doc comments):

- [ ] `cargo doc --no-deps` succeeds (broken intra-doc links fail the build).
- [ ] `cargo test --doc` if you touched a doctest.
- [ ] No version bump unless user-facing CLI text changed.

### 8.5 Self-Verification Recipe

Run every step. Each must produce the literal expected output.

```bash
# 1. Format
cargo fmt --all -- --check
# Expected: (empty stdout, exit 0)

# 2. Lint
cargo clippy --all-targets --all-features --workspace -- -D warnings
# Expected: "Finished `dev` profile [unoptimized + debuginfo] target(s) in N.NNs"
# No "warning:" or "error:" lines.

# 3. Build
cargo build --workspace --all-features --locked
# Expected: "Finished ..."

# 4. Unit + integration tests
cargo nextest run --workspace --all-features
# Expected: "Summary [   N.NNNs] X tests run: X passed, 0 skipped"
# Exit 0.

# 5. Doctests
cargo test --doc --workspace --all-features
# Expected: "test result: ok. X passed; 0 failed; 0 ignored; 0 measured; 0 filtered out"

# 6. MSRV check (verify current MSRV still compiles)
cargo +1.93 build --workspace --locked
# Expected: "Finished ..."

# 7. Supply-chain
cargo deny check
# Expected: "advisories ok, bans ok, licenses ok, sources ok"

cargo audit
# Expected: "Success No vulnerable packages found"

# 8. Semver (libraries only, before publish)
cargo semver-checks check-release -p stringops
# Expected: "Summary semver requires new minor version: ..." OR "no semver-incompatible changes"

# 9. Docs build
RUSTDOCFLAGS="-D warnings" cargo doc --no-deps --all-features --workspace
# Expected: "Finished `dev` profile ..." with no warnings

# 10. Smoke (CLI)
cargo run -p stringops-cli -- reverse hello
# Expected stdout: "olleh"
# Expected exit: 0

# 11. Publish dry-run (per crate, in dependency order)
cargo publish -p stringops --dry-run
# Expected: "Uploading stringops vX.Y.Z (...)"
# No "error:" lines.
```

### 8.6 Parallelization Patterns

**Safe parallel fan-out:**

- Adding `crates/stringops/src/upper.rs` AND `crates/stringops/src/lower.rs` AND a doc-only update to `README.md` — three disjoint files.
- Writing three independent integration tests under `crates/stringops/tests/`.
- Updating doc comments on three different functions.

**Sequential only:**

- Edits to root `Cargo.toml` (`[workspace.dependencies]`).
- Edits to `Cargo.lock` (always sequential — concurrent edits corrupt).
- `[features]` blocks (downstream resolution depends on them).
- Anything that runs `cargo release`.
- MSRV bumps (touches every member's `rust-version`).

**Heuristic for the AI:** if two changes both touch a `Cargo.toml`, run them sequentially.

---

## 9. Stack-Specific Pitfalls

1. **Forgetting to bump version in `Cargo.toml` AND `Cargo.lock`.** Symptom: `cargo publish` rejects "version already exists." Cause: edited `Cargo.toml` but did not run `cargo update -p <crate>` to refresh lock. Fix: use `cargo release` exclusively. Detect: `git diff Cargo.lock` shows version bump; if missing, abort.
2. **Doc tests broken after refactor.** Symptom: `cargo build` green, `cargo test --doc` red. Cause: doctests live in `///` comments and reference public API; rename of pub item silently breaks them. Fix: run `cargo test --doc` in pre-commit. Detect: include `cargo test --doc` in self-verification recipe (step 5).
3. **Leaking proprietary deps via `[workspace.dependencies]`.** Symptom: published crate fails on user machines with "git dependency not allowed." Cause: workspace dep declared as `git = "..."` and inherited by published member. Fix: never use git deps in workspace deps if any member is `publish = true`. Detect: `cargo publish --dry-run`.
4. **MSRV drift unnoticed.** Symptom: a contributor uses a 1.95 feature, CI green on stable, but downstream `rust-version = "1.93"` users break. Cause: no MSRV CI job. Fix: add `msrv` matrix entry running `cargo +1.93 build --locked`. Detect: see ci.yml in section 16.
5. **Publishing without `[package.metadata.docs.rs]` features.** Symptom: docs.rs renders only default features; users miss APIs gated behind features. Cause: missing metadata. Fix: `[package.metadata.docs.rs] all-features = true` and `rustdoc-args = ["--cfg", "docsrs"]`. Detect: visit <https://docs.rs/<crate>>; check for missing items.
6. **Missing README in `[package]`.** Symptom: crates.io page is bare. Cause: forgot `readme = "README.md"`. Fix: add to `[package]` and ensure file exists at the path. Detect: `cargo package --list | grep README`.
7. **Leaving `tokio` features unspecified.** Symptom: bin compiles, but downstream lib gets full Tokio (rt-multi-thread, fs, signal, ...) bundled. Cause: `tokio = "1"` resolves with default features. Fix: `tokio = { version = "1", default-features = false, features = ["rt"] }`. Detect: `cargo tree -e features -p tokio`.
8. **Accidental `default-features = true` for big optional deps.** Symptom: `tar.gz` blows past 10 MB; download time spikes. Cause: optional dep `clap = "4"` enables `derive`, `cargo`, `env`, `unicode`, `wrap_help`, `suggestions` by default. Fix: `clap = { version = "4", default-features = false, features = ["std", "derive"] }`. Detect: `cargo bloat --release --crates`.
9. **Workspace member path-only deps.** Symptom: `cargo publish -p stringops-cli` fails: "all path dependencies must have a version." Cause: `stringops = { path = "../stringops" }` lacks `version = "..."`. Fix: `stringops = { path = "../stringops", version = "0.2" }`. cargo-release does this automatically. Detect: `cargo publish --dry-run`.
10. **`Cargo.lock` not committed for libraries.** Symptom: CI on different machines pulls different transitive versions; flaky failures. Cause: legacy advice. Fix: commit `Cargo.lock` (Rust 1.84+ guidance). Detect: `git status` in fresh clone.
11. **Doc comment intra-doc link rot.** Symptom: `cargo doc` warns `unresolved link to 'foo::Bar'`. Cause: rename without updating `[`foo::Bar`]`. Fix: `RUSTDOCFLAGS="-D warnings" cargo doc --no-deps`. Detect: CI doc job.
12. **Re-exporting `#[doc(hidden)]` items.** Symptom: users find unstable API in their IDE autocomplete. Cause: `pub use crate::internal::*`. Fix: explicit re-exports only. Detect: code review on every `pub use *`.
13. **`unsafe` without `// SAFETY:` comment.** Symptom: clippy `clippy::undocumented_unsafe_blocks` red. Cause: forgotten justification. Fix: every `unsafe { ... }` gets a comment naming the invariant. Detect: `cargo clippy -- -W clippy::undocumented_unsafe_blocks`.
14. **Forgotten `keywords` and `categories`.** Symptom: crate ranks poorly on crates.io search. Cause: blank `[package]` fields. Fix: 1–5 keywords (each ≤20 chars, lowercase, alphanumeric+hyphen); 1–5 categories from <https://crates.io/category_slugs>. Detect: `cargo publish --dry-run` warnings.
15. **Trying to publish a workspace with `cargo publish` from root.** Symptom: "the manifest at root is virtual." Cause: virtual workspaces (root has no `[package]`) cannot be published whole. Fix: `cargo publish -p <member>` for each, in dependency order. cargo-release handles this. Detect: `cargo publish` from root errors out.
16. **Forgot to add `--locked` in CI.** Symptom: CI passes but deploys a different lockfile resolution than dev. Cause: missing flag. Fix: every CI cargo command takes `--locked`. Detect: code review of `ci.yml`.
17. **`cargo dist` workflow file edited by hand.** Symptom: next `cargo dist init` overwrites your edits. Cause: `release.yml` is generated. Fix: configure via `dist-workspace.toml`, never edit `release.yml`. Detect: file header says "DO NOT EDIT".
18. **Trusted Publishing misconfigured.** Symptom: CI fails with "no token found." Cause: missing `permissions: id-token: write` in workflow, or crate not registered for Trusted Publishing on crates.io. Fix: set permission + register at <https://crates.io/crates/<name>/settings>. Detect: workflow logs show OIDC exchange failure.
19. **Renamed pub item, forgot to deprecate.** Symptom: downstream breakage on minor version bump. Cause: removed name without `#[deprecated]` window. Fix: add `#[deprecated(since = "...", note = "use ... instead")]` for at least one minor cycle. Detect: `cargo semver-checks check-release`.
20. **Accidentally publishing a `dev-dependency` to crates.io.** Symptom: users can't compile. Cause: declared a runtime dep under `[dev-dependencies]`. Fix: move to `[dependencies]`. Detect: `cargo publish --dry-run` followed by clean install in scratch dir.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold compile (clean, --release, full workspace) | ≤ 90 s on a 2024 laptop | `cargo clean && time cargo build --release --workspace` |
| Incremental dev rebuild | ≤ 5 s after a one-line edit | `time cargo build` after `touch src/lib.rs` |
| Binary size (release, stripped) | ≤ 5 MB for `stringops-cli` | `ls -lh target/release/stringops-cli`; `strip` if needed (cargo-dist does) |
| Test suite wall-clock | ≤ 60 s | `time cargo nextest run --workspace` |
| Single benchmark | ≤ 1 s wall-clock per iteration | criterion auto-tunes; flag any > 1 s |
| Memory (CLI peak, typical input) | ≤ 50 MB | `/usr/bin/time -v ./stringops-cli reverse "$(yes hello | head -100000)"` (Linux) |
| Doc build | ≤ 30 s | `time cargo doc --no-deps --workspace` |

When exceeded:

- Compile time: run `cargo build --timings` (writes HTML report). Trim heaviest crates first.
- Binary size: `cargo bloat --release --crates`. Likely culprits: `default-features = true` on `clap`, `tokio`, `regex`, `serde_json`.
- Test time: `cargo nextest run --profile ci` with retry config; identify slow tests via `cargo nextest run --message-format json`.
- Memory: profile with `heaptrack` (Linux) / `Instruments` (macOS).

---

## 11. Security

### Secret storage

- **Never** in `Cargo.toml`, `.cargo/config.toml`, source files, or git.
- **CI:** GitHub repo secrets (`Settings → Secrets and variables → Actions`). Reference as `${{ secrets.NAME }}`.
- **Local publish (legacy):** `cargo login` writes `~/.cargo/credentials.toml` (mode 600). gitignored.
- **Preferred:** Trusted Publishing — no secret stored anywhere. OIDC token issued per-job by GitHub, valid <1 hour.

### Auth threat model

This crate has no auth. Threat model is supply-chain:

- **Author repo compromise:** attacker pushes to your default branch. Mitigation: branch protection, required PR reviews, signed commits.
- **Stolen `CARGO_REGISTRY_TOKEN`:** attacker publishes a malicious version. Mitigation: switch to Trusted Publishing; revoke any legacy token.
- **Compromised dependency:** transitive crate replaced. Mitigation: `cargo audit` daily, `cargo deny` on every PR, pin via `Cargo.lock`.
- **Typosquat:** users install `stringopss` instead of `stringops`. Mitigation: name normalization on crates.io covers most; reserve close variants.

### Input validation

- Library entry points validate inputs with `Result<T, Error>`.
- CLI relies on clap to parse + validate types; further checks in the library layer.
- All file reads pass through `std::fs` with explicit `Result` handling — no `unwrap()`.

### Output escaping

- CLI writes UTF-8 to stdout. Use `println!` for user-facing output. Never include unescaped user input in shell-expandable strings.
- Logs use `tracing` field formatting (`?` and `%`) — auto-debugged, safe.

### Permissions / capabilities

- Crate declares no system access. CLI binary inherits user's process permissions.
- For crates that touch network or fs, declare in README under `## Permissions`.

### Dependency audit

Daily cron + every PR:

```bash
cargo audit                        # RustSec advisory db
cargo deny check                   # licenses, bans, sources
cargo update --dry-run             # see pending bumps
```

### Top 5 stack-specific risks

1. **Hand-edited `release.yml`** — overwritten on next `cargo dist init`; unauthorized changes silently revert.
2. **`unsafe` blocks without justification** — undefined behavior compiles fine.
3. **Default features pulling in unintended deps** (e.g. `tokio` full features on a library).
4. **Publishing with leaked `CARGO_REGISTRY_TOKEN`** — switch to Trusted Publishing.
5. **`build.rs` arbitrary code execution** — any dep can run code at build time. `cargo deny` `[bans] build = "deny"` for crates you don't trust to run code.

---

## 12. Deploy (Publish + Binary Distribution)

This is a publishing rulebook. Section 12 covers crates.io publish AND binary distribution.

### Versioning scheme

Semantic Versioning. For 0.x crates, breaking changes bump the minor. The version lives in `[workspace.package] version = "X.Y.Z"` (root `Cargo.toml`); members inherit via `version.workspace = true`.

### Release flow (single command at the trigger)

```bash
# 1. Pre-flight (run from clean main branch)
git checkout main && git pull --ff-only
cargo fmt --all -- --check
cargo clippy --all-targets --all-features --workspace -- -D warnings
cargo nextest run --workspace
cargo test --doc --workspace
cargo deny check
cargo audit
cargo semver-checks check-release -p stringops
cargo +1.93 build --workspace --locked      # MSRV
cargo dist plan                              # confirms release.yml is in sync

# 2. Bump version + commit + tag (dry-run first)
cargo release patch --workspace             # 0.1.0 → 0.1.1
# Inspect output: changes to Cargo.toml, CHANGELOG.md, tag name.
cargo release patch --workspace --execute   # actually does it

# 3. Push (cargo-release pushes by default; if not configured)
git push origin main --follow-tags
```

What happens after the tag push:

1. GitHub Actions `release.yml` (generated by cargo-dist) triggers on tag.
2. Build matrix: `x86_64-unknown-linux-gnu`, `aarch64-unknown-linux-gnu`, `x86_64-apple-darwin`, `aarch64-apple-darwin`, `x86_64-pc-windows-msvc`.
3. Each runner builds `stringops-cli`, strips, tars (or zips on Windows), uploads to draft GitHub Release.
4. After all artifacts upload, the workflow:
   - Promotes draft Release → published.
   - Generates `install.sh` and `install.ps1` shims pointing at the Release.
   - Pushes a Homebrew formula to `homebrew-<tap>` repo.
   - Generates an npm wrapper package and publishes it.
   - Publishes library + CLI crates to crates.io via Trusted Publishing OIDC.

### Staging vs prod

- **Staging:** publish a pre-release (`0.2.0-rc.1`) via `cargo release rc --workspace --execute`. cargo-dist handles pre-release tags as "pre-release" GitHub Releases (not promoted to "latest"). Homebrew tap is NOT updated for pre-releases.
- **Prod:** any non-pre-release tag (`0.2.0`).

### Rollback

Within the safe window (≤ 72 hours of publish):

```bash
# Yank the broken version from crates.io (does not delete; prevents new resolves)
cargo yank --version 0.2.0 -p stringops
cargo yank --version 0.2.0 -p stringops-cli

# Mark the GitHub Release as a pre-release (visually demotes)
gh release edit v0.2.0 --prerelease

# Publish 0.2.1 with the fix; users on 0.2.0 stay broken until they upgrade
cargo release patch --workspace --execute
```

A yanked version still installs if explicitly pinned in someone's lockfile. Yank is advisory.

### Health check / smoke

After release.yml completes:

```bash
# crates.io
curl -sI https://crates.io/api/v1/crates/stringops/0.2.0 | grep "200 OK"

# docs.rs (may take 1–10 minutes)
curl -sI https://docs.rs/stringops/0.2.0/stringops/ | grep "200 OK"

# Install via shell installer
curl -sSL https://github.com/<owner>/stringops/releases/download/v0.2.0/stringops-cli-installer.sh | sh

# Verify
stringops-cli --version
# Expected: stringops-cli 0.2.0
stringops-cli reverse hello
# Expected: olleh
```

### Auto-update

- **Homebrew users:** `brew upgrade stringops-cli`.
- **npm wrapper users:** `npm i -g stringops-cli@latest`.
- **Shell-installed users:** re-run the install script. cargo-dist's installer always pulls latest from the GitHub Release tagged `latest`.
- Library users: handled by `cargo update` in their own project.

### DNS / domain

n/a. Crate resolves via crates.io; binaries via GitHub Releases.

### Cost estimate

- crates.io publish: free.
- GitHub Releases: free (public repos).
- Homebrew tap: free (own GitHub repo).
- npm publish: free.
- CI minutes: ~6–10 min/release on GitHub-hosted runners; free for public repos.

Per 1k MAU: $0.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready, project root)

```markdown
# Claude Code instructions for this crate

This is a Rust workspace publishing one library (`stringops`) and one CLI (`stringops-cli`) to crates.io, with prebuilt binaries via cargo-dist.

## Source of truth

All rules live in `cargo-crate.md` (this rulebook) at the project root. If `CLAUDE.md` and `cargo-crate.md` disagree, the rulebook wins.

## Hot commands

- Build: `cargo build --workspace`
- Test (everything): `cargo nextest run --workspace && cargo test --doc --workspace`
- Lint + format: `cargo fmt --all && cargo clippy --all-targets --all-features --workspace -- -D warnings`
- Run CLI: `cargo run -p stringops-cli -- <args>`
- Coverage: `cargo llvm-cov nextest --workspace --html`
- Pre-release check: `cargo semver-checks check-release -p stringops`
- Supply-chain: `cargo deny check && cargo audit`
- Release: `cargo release patch --workspace --execute`

## Banned patterns

- `unwrap()` / `expect()` outside tests, examples, or `fn main`.
- `default-features = true` on `tokio`, `reqwest`, `clap`, `serde`.
- Hand-editing `.github/workflows/release.yml` (regenerated by cargo-dist).
- Hand-bumping versions in `Cargo.toml` (use `cargo release`).
- `pub use foo::*;` in `lib.rs`.
- `git = "..."` or `path = "..."` deps in any crate with `publish = true`.
- `unsafe` blocks without `// SAFETY:` comment.

## When in doubt

Read the matching section of `cargo-crate.md`. If still unclear, fail closed — open a question, do not guess.
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_FILE_PATHS\" | grep -qE '\\.rs$|Cargo\\.toml$'; then cargo fmt --all; fi"
          }
        ]
      }
    ],
    "PreCommit": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cargo fmt --all -- --check && cargo clippy --all-targets --all-features --workspace -- -D warnings"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cargo nextest run --workspace --no-fail-fast 2>&1 | tail -20"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Bash(cargo build:*)",
      "Bash(cargo check:*)",
      "Bash(cargo test:*)",
      "Bash(cargo nextest:*)",
      "Bash(cargo clippy:*)",
      "Bash(cargo fmt:*)",
      "Bash(cargo doc:*)",
      "Bash(cargo run:*)",
      "Bash(cargo tree:*)",
      "Bash(cargo bench:*)",
      "Bash(cargo expand:*)",
      "Bash(cargo bloat:*)",
      "Bash(cargo deny check)",
      "Bash(cargo audit)",
      "Bash(cargo semver-checks:*)",
      "Bash(cargo llvm-cov:*)",
      "Bash(cargo dist plan)",
      "Bash(cargo dist build:*)",
      "Bash(cargo update --dry-run:*)",
      "Bash(cargo package --list)",
      "Bash(cargo +*:*)",
      "Bash(rustup show)",
      "Bash(rustup which:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(gh pr:*)",
      "Bash(gh run:*)",
      "Bash(gh release view:*)"
    ],
    "deny": [
      "Bash(cargo publish:*)",
      "Bash(cargo release:*)",
      "Bash(cargo yank:*)",
      "Bash(cargo login:*)",
      "Bash(cargo owner:*)",
      "Bash(rustup default:*)",
      "Bash(rustup install:*)",
      "Bash(git push:*)",
      "Bash(git tag:*)",
      "Bash(rm -rf:*)"
    ]
  }
}
```

### Recommended skills

- `/test-driven-development` — when adding any new public API.
- `/systematic-debugging` — when a test fails and the root cause is unclear.
- `/verification-before-completion` — before claiming a task done. Always.
- `/review` — before opening a PR.
- `/codex` — second opinion on `unsafe` blocks or perf-sensitive code.
- `/ship` — when work is done and ready to land on main.

### Slash command shortcuts

- `/test` → `cargo nextest run --workspace && cargo test --doc --workspace`
- `/lint` → `cargo fmt --all && cargo clippy --all-targets --all-features --workspace -- -D warnings`
- `/check` → full self-verification recipe (section 8.5)
- `/release` → `cargo release patch --workspace` (dry-run by default)

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready, project root)

```markdown
# Codex agent instructions for this crate

Stack: Rust workspace, library + CLI, crates.io + cargo-dist.

Source of truth: `cargo-crate.md` at project root. This file is a quick reference.

## Setup

`rustup show` should print stable 1.95.0. If it does not, run `rustup show` (it will install the toolchain pinned in `rust-toolchain.toml`).

## Build / test / lint

```bash
cargo build --workspace
cargo nextest run --workspace
cargo test --doc --workspace
cargo clippy --all-targets --all-features --workspace -- -D warnings
cargo fmt --all -- --check
```

## Where logic lives

- Library code: `crates/stringops/src/`
- CLI code: `crates/stringops-cli/src/` (thin shell over the lib)
- Tests next to code (unit), under `tests/` (integration), in `///` comments (doctests).

## Hard rules

- Never run `cargo publish`, `cargo release`, `cargo yank`, or `git push --tags`. Ask the user.
- Never hand-edit `.github/workflows/release.yml`.
- Never bump versions by hand. The maintainer runs `cargo release`.
- Never add a dep without checking `cargo deny check` afterwards.
- Always run the full self-verification recipe before reporting success.
```

### `.codex/config.toml`

```toml
model = "claude-opus-4-7"
sandbox = "workspace-write"
approval_mode = "untrusted-on-write"

[shell]
allow = [
  "cargo build *",
  "cargo check *",
  "cargo test *",
  "cargo nextest *",
  "cargo clippy *",
  "cargo fmt *",
  "cargo doc *",
  "cargo run *",
  "cargo tree *",
  "cargo deny check",
  "cargo audit",
  "cargo semver-checks *",
  "cargo dist plan",
  "git status",
  "git diff *",
  "git log *",
  "gh pr *",
]
deny = [
  "cargo publish *",
  "cargo release *",
  "cargo yank *",
  "git push *",
  "git tag *",
  "rm -rf *",
]
```

### Codex-specific differences from Claude Code

- Codex uses `AGENTS.md` instead of `CLAUDE.md`. Both should mirror the same rules.
- Codex's sandbox by default disallows network in `workspace-write`. `cargo build` may fetch deps on first run; pre-warm with `cargo fetch` or set sandbox to allow network for build steps.
- Codex does not auto-format on edit; rely on the pre-commit hook instead.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```text
This is a Rust workspace: lib (`stringops`) + CLI (`stringops-cli`).

Source of truth: cargo-crate.md at project root. Read it.

ALWAYS:
- Use `?` and `Result<T, E>`. No `unwrap()` outside tests/examples/main.
- Format on save: rustfmt.
- Run `cargo clippy --all-targets --all-features --workspace -- -D warnings` before declaring done.
- Doc every `pub` item with `///` and a runnable doctest where possible.
- Use `tracing` for logs, never `println!` for diagnostics.
- Pin tool versions in `rust-toolchain.toml`.
- Commit `Cargo.lock` for both libs and bins.
- Declare shared deps in `[workspace.dependencies]` and reference via `name.workspace = true`.
- Set `default-features = false` on `tokio`, `clap`, `serde`, `reqwest`.
- Include `[package.metadata.docs.rs] all-features = true`.
- Add `// SAFETY:` to every `unsafe` block.

NEVER:
- Hand-edit `.github/workflows/release.yml`.
- Hand-bump versions in `Cargo.toml`. Use `cargo release`.
- Use `pub use foo::*;` in `lib.rs`.
- Add `git = "..."` or `path = "..."` deps to a published crate.
- Use `tokio::main` macro in a library.
- Initialize a `tracing-subscriber` in a library.
- Run `cargo update` blanket inside a release branch.
- Panic in a `Drop` impl.
- Bypass MSRV without bumping the major version.
- Commit `target/`, `.cargo/credentials.toml`, or `.env`.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "rust-lang.rust-analyzer",
    "vadimcn.vscode-lldb",
    "tamasfe.even-better-toml",
    "fill-labs.dependi",
    "usernamehw.errorlens",
    "EditorConfig.EditorConfig"
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
      "name": "Debug stringops-cli (reverse)",
      "cargo": {
        "args": ["build", "--bin=stringops-cli", "--package=stringops-cli"],
        "filter": { "name": "stringops-cli", "kind": "bin" }
      },
      "args": ["reverse", "hello"],
      "cwd": "${workspaceFolder}",
      "env": { "RUST_LOG": "debug", "RUST_BACKTRACE": "1" }
    },
    {
      "type": "lldb",
      "request": "launch",
      "name": "Debug unit tests in lib (stringops)",
      "cargo": {
        "args": ["test", "--no-run", "--lib", "--package=stringops"],
        "filter": { "name": "stringops", "kind": "lib" }
      },
      "args": [],
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

### `.vscode/settings.json`

```json
{
  "rust-analyzer.check.command": "clippy",
  "rust-analyzer.check.allTargets": true,
  "rust-analyzer.cargo.features": "all",
  "rust-analyzer.completion.callable.snippets": "fill_arguments",
  "[rust]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "rust-lang.rust-analyzer"
  }
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After `git push`, the CI workflow runs and a hello-world `stringops-cli reverse hello` works locally.

### `Cargo.toml` (workspace root)

```toml
[workspace]
resolver = "3"
members = ["crates/stringops", "crates/stringops-cli"]

[workspace.package]
version = "0.1.0"
authors = ["Your Name <you@example.com>"]
edition = "2024"
rust-version = "1.93"
license = "MIT OR Apache-2.0"
repository = "https://github.com/<owner>/stringops"
homepage = "https://github.com/<owner>/stringops"
documentation = "https://docs.rs/stringops"
readme = "README.md"
keywords = ["string", "text", "cli", "util"]
categories = ["text-processing", "command-line-utilities"]

[workspace.dependencies]
# Shared deps. Members inherit via `name.workspace = true`.
clap = { version = "4.5", default-features = false, features = ["std", "derive", "help", "usage", "error-context"] }
tracing = "0.1"
tracing-subscriber = { version = "0.3", default-features = false, features = ["env-filter", "fmt", "ansi"] }
thiserror = "2"
anyhow = "1"
color-eyre = { version = "0.6", default-features = false }
assert_cmd = "2"
predicates = "3"

[profile.release]
lto = "thin"
codegen-units = 1
strip = "symbols"
panic = "abort"

[profile.dev]
opt-level = 0
debug = true
```

### `crates/stringops/Cargo.toml`

```toml
[package]
name = "stringops"
description = "Tiny string manipulation utilities."
version.workspace = true
authors.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
repository.workspace = true
homepage.workspace = true
documentation.workspace = true
readme.workspace = true
keywords.workspace = true
categories.workspace = true

[dependencies]
thiserror = { workspace = true }

[dev-dependencies]

[features]
default = []
unicode = []  # opt-in unicode-aware reversal

[package.metadata.docs.rs]
all-features = true
rustdoc-args = ["--cfg", "docsrs"]
targets = ["x86_64-unknown-linux-gnu"]

[lib]
name = "stringops"
path = "src/lib.rs"
```

### `crates/stringops/src/lib.rs`

```rust
//! Tiny string manipulation utilities.
//!
//! # Examples
//!
//! ```
//! assert_eq!(stringops::reverse("hello"), "olleh");
//! assert_eq!(stringops::upper("hello"), "HELLO");
//! ```

#![deny(missing_docs)]
#![cfg_attr(docsrs, feature(doc_cfg))]

mod case;
mod error;
mod reverse;

pub use crate::case::upper;
pub use crate::error::{Error, Result};
pub use crate::reverse::reverse;
```

### `crates/stringops/src/error.rs`

```rust
//! Error type for the `stringops` crate.

use thiserror::Error;

/// Errors that may arise from `stringops` operations.
#[derive(Debug, Error)]
pub enum Error {
    /// The input was empty when a non-empty input was required.
    #[error("input was empty")]
    Empty,
}

/// Convenience alias.
pub type Result<T> = std::result::Result<T, Error>;
```

### `crates/stringops/src/reverse.rs`

```rust
//! Reverse a string.

/// Returns the input with its bytes reversed.
///
/// On non-ASCII input, this reverses by `char` (Unicode scalar value).
/// Grapheme clusters are NOT preserved unless the `unicode` feature is enabled.
///
/// # Examples
///
/// ```
/// assert_eq!(stringops::reverse("hello"), "olleh");
/// assert_eq!(stringops::reverse(""), "");
/// ```
pub fn reverse(input: &str) -> String {
    input.chars().rev().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reverse_empty() {
        assert_eq!(reverse(""), "");
    }

    #[test]
    fn reverse_ascii() {
        assert_eq!(reverse("hello"), "olleh");
    }

    #[test]
    fn reverse_unicode() {
        assert_eq!(reverse("héllo"), "olléh");
    }
}
```

### `crates/stringops/src/case.rs`

```rust
//! Case conversion.

/// Returns the input in upper case (ASCII-only mapping).
///
/// # Examples
///
/// ```
/// assert_eq!(stringops::upper("hello"), "HELLO");
/// ```
pub fn upper(input: &str) -> String {
    input.to_ascii_uppercase()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn upper_ascii() {
        assert_eq!(upper("hello"), "HELLO");
    }

    #[test]
    fn upper_keeps_non_ascii() {
        assert_eq!(upper("héllo"), "HéLLO");
    }
}
```

### `crates/stringops/tests/reverse.rs`

```rust
//! Integration tests for `reverse`.

#[test]
fn reverse_long_string() {
    let input = "a".repeat(1024);
    let out = stringops::reverse(&input);
    assert_eq!(out.len(), 1024);
}
```

### `crates/stringops-cli/Cargo.toml`

```toml
[package]
name = "stringops-cli"
description = "CLI for the stringops crate."
version.workspace = true
authors.workspace = true
edition.workspace = true
rust-version.workspace = true
license.workspace = true
repository.workspace = true
homepage.workspace = true
documentation.workspace = true
readme.workspace = true
keywords.workspace = true
categories.workspace = true

[[bin]]
name = "stringops-cli"
path = "src/main.rs"

[dependencies]
stringops = { path = "../stringops", version = "0.1.0" }
clap = { workspace = true }
tracing = { workspace = true }
tracing-subscriber = { workspace = true }
color-eyre = { workspace = true }

[dev-dependencies]
assert_cmd = { workspace = true }
predicates = { workspace = true }

[package.metadata.dist]
# cargo-dist will pick this up to package the binary.
```

### `crates/stringops-cli/src/main.rs`

```rust
mod cli;

use clap::Parser;
use cli::{Cli, Command};
use tracing_subscriber::{fmt, EnvFilter};

fn main() -> color_eyre::Result<()> {
    color_eyre::install()?;
    let cli = Cli::parse();
    init_tracing(cli.verbose);

    match cli.command {
        Command::Reverse { input } => {
            let out = stringops::reverse(&input);
            println!("{out}");
        }
        Command::Upper { input } => {
            let out = stringops::upper(&input);
            println!("{out}");
        }
    }
    Ok(())
}

fn init_tracing(verbose: u8) {
    let level = match verbose {
        0 => "warn",
        1 => "info",
        2 => "debug",
        _ => "trace",
    };
    let filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new(format!("stringops={level},stringops_cli={level}")));
    fmt()
        .with_env_filter(filter)
        .with_writer(std::io::stderr)
        .compact()
        .init();
}
```

### `crates/stringops-cli/src/cli.rs`

```rust
use clap::{Parser, Subcommand};

/// Tiny string manipulation utilities (CLI).
#[derive(Parser, Debug)]
#[command(name = "stringops-cli", version, about, long_about = None)]
pub struct Cli {
    /// Verbosity (-v info, -vv debug, -vvv trace).
    #[arg(short, long, action = clap::ArgAction::Count, global = true)]
    pub verbose: u8,
    #[command(subcommand)]
    pub command: Command,
}

#[derive(Subcommand, Debug)]
pub enum Command {
    /// Reverse the input string.
    Reverse {
        /// String to reverse.
        input: String,
    },
    /// Upper-case the input string.
    Upper {
        /// String to upper-case.
        input: String,
    },
}
```

### `crates/stringops-cli/tests/cli.rs`

```rust
use assert_cmd::Command;
use predicates::prelude::*;

#[test]
fn cli_reverse_prints_reversed() {
    Command::cargo_bin("stringops-cli")
        .unwrap()
        .args(["reverse", "hello"])
        .assert()
        .success()
        .stdout(predicate::str::contains("olleh"));
}

#[test]
fn cli_help_lists_subcommands() {
    Command::cargo_bin("stringops-cli")
        .unwrap()
        .arg("--help")
        .assert()
        .success()
        .stdout(predicate::str::contains("reverse"))
        .stdout(predicate::str::contains("upper"));
}
```

### `rust-toolchain.toml`

```toml
[toolchain]
channel = "1.95.0"
components = ["rustfmt", "clippy", "rust-src"]
profile = "minimal"
```

### `rustfmt.toml`

```toml
edition = "2024"
max_width = 100
hard_tabs = false
tab_spaces = 4
newline_style = "Unix"
use_field_init_shorthand = true
use_try_shorthand = true
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true
reorder_modules = true
```

### `clippy.toml`

```toml
msrv = "1.93"
avoid-breaking-exported-api = true
cognitive-complexity-threshold = 25
too-many-arguments-threshold = 6
type-complexity-threshold = 250
```

### `deny.toml`

```toml
[graph]
targets = [
    "x86_64-unknown-linux-gnu",
    "aarch64-unknown-linux-gnu",
    "x86_64-apple-darwin",
    "aarch64-apple-darwin",
    "x86_64-pc-windows-msvc",
]
all-features = true

[advisories]
version = 2
yanked = "deny"
ignore = []

[licenses]
version = 2
allow = [
    "MIT",
    "Apache-2.0",
    "Apache-2.0 WITH LLVM-exception",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "ISC",
    "Unicode-DFS-2016",
    "Unicode-3.0",
    "Zlib",
    "0BSD",
    "CC0-1.0",
]
confidence-threshold = 0.93

[bans]
multiple-versions = "warn"
wildcards = "deny"
deny = []

[sources]
unknown-registry = "deny"
unknown-git = "deny"
allow-registry = ["https://github.com/rust-lang/crates.io-index"]
allow-git = []
```

### `.cargo/config.toml`

```toml
[alias]
ci = "nextest run --workspace --all-features --no-fail-fast"
xtask-lint = "clippy --all-targets --all-features --workspace -- -D warnings"
xtask-fmt-check = "fmt --all -- --check"
docs = "doc --workspace --no-deps --all-features"

[build]
# Set to a stable target dir to share across editor + CLI.

[target.'cfg(all())']
rustflags = []

[net]
git-fetch-with-cli = true
```

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

env:
  CARGO_TERM_COLOR: always
  CARGO_INCREMENTAL: 0
  RUSTFLAGS: "-D warnings"

jobs:
  fmt:
    name: rustfmt
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt
      - run: cargo fmt --all -- --check

  clippy:
    name: clippy
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
        with:
          components: clippy
      - uses: Swatinem/rust-cache@v2
      - run: cargo clippy --all-targets --all-features --workspace -- -D warnings

  test:
    name: test (${{ matrix.os }} / ${{ matrix.rust }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
        rust: [stable]
        include:
          - os: ubuntu-latest
            rust: beta
          - os: ubuntu-latest
            rust: nightly
          - os: ubuntu-latest
            rust: "1.93"   # MSRV
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@master
        with:
          toolchain: ${{ matrix.rust }}
      - uses: Swatinem/rust-cache@v2
      - uses: taiki-e/install-action@nextest
      - run: cargo nextest run --workspace --all-features --locked
      - run: cargo test --doc --workspace --all-features --locked

  semver:
    name: semver-checks
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@stable
      - uses: Swatinem/rust-cache@v2
      - uses: obi1kenobi/cargo-semver-checks-action@v2

  deny:
    name: cargo-deny
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: EmbarkStudios/cargo-deny-action@v2
        with:
          command: check

  audit:
    name: cargo-audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustsec/audit-check@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

  docs:
    name: rustdoc
    runs-on: ubuntu-latest
    env:
      RUSTDOCFLAGS: "-D warnings --cfg docsrs"
    steps:
      - uses: actions/checkout@v4
      - uses: dtolnay/rust-toolchain@nightly
      - uses: Swatinem/rust-cache@v2
      - run: cargo +nightly doc --no-deps --all-features --workspace
```

### `.github/workflows/release.yml`

This file is **generated** by `cargo dist init`. Do not hand-edit. Run:

```bash
cargo dist init  # interactive; writes dist-workspace.toml + .github/workflows/release.yml
cargo dist plan  # validate without changes
```

### `.github/workflows/audit.yml` (daily security scan)

```yaml
name: audit

on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:

permissions:
  contents: read
  issues: write

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: rustsec/audit-check@v2
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "cargo"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    groups:
      patches:
        update-types: ["patch"]
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "monthly"
```

### `dist-workspace.toml`

```toml
[dist]
cargo-dist-version = "0.31.0"
ci = ["github"]
installers = ["shell", "powershell", "homebrew", "npm"]
tap = "<owner>/homebrew-tap"
publish-jobs = ["homebrew", "npm"]
targets = [
    "aarch64-apple-darwin",
    "x86_64-apple-darwin",
    "x86_64-unknown-linux-gnu",
    "aarch64-unknown-linux-gnu",
    "x86_64-pc-windows-msvc",
]
pr-run-mode = "plan"
allow-dirty = ["ci"]
install-path = "CARGO_HOME"
```

### `.gitignore`

```
/target
**/*.rs.bk
*.pdb
Cargo.lock.bak
.vscode/launch.json.user
.idea/
.DS_Store
.cargo/credentials.toml
```

### `README.md`

```markdown
# stringops

Tiny string manipulation utilities for Rust.

[![crates.io](https://img.shields.io/crates/v/stringops.svg)](https://crates.io/crates/stringops)
[![docs.rs](https://docs.rs/stringops/badge.svg)](https://docs.rs/stringops)
[![CI](https://github.com/<owner>/stringops/actions/workflows/ci.yml/badge.svg)](https://github.com/<owner>/stringops/actions)

## Library

```toml
[dependencies]
stringops = "0.1"
```

```rust
assert_eq!(stringops::reverse("hello"), "olleh");
```

## CLI

```sh
# macOS / Linux
curl -sSL https://github.com/<owner>/stringops/releases/latest/download/stringops-cli-installer.sh | sh

# Homebrew
brew install <owner>/tap/stringops-cli

# npm
npm install -g stringops-cli
```

## License

Dual-licensed under MIT or Apache-2.0 at your option.
```

### `LICENSE-MIT`

(Standard MIT license text — fill in year + name.)

### `LICENSE-APACHE`

(Standard Apache-2.0 license text.)

### `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-04-27

### Added
- `reverse(&str) -> String` — reverse by Unicode scalar.
- `upper(&str) -> String` — ASCII upper-case.
- CLI subcommands `reverse` and `upper`.
```

---

## 17. Idea → MVP Path

`PROJECT_IDEA` is blank in this generation — using the generic `stringops` util.

### Phase 1 — Schema (½ AI session)

- Decide public types: `fn reverse(&str) -> String`, `fn upper(&str) -> String`, `enum Error`.
- Files touched: `crates/stringops/src/{lib.rs, error.rs, reverse.rs, case.rs}`.
- Exit: `cargo build` green, public API frozen.

### Phase 2 — Backbone (½ AI session)

- CLI scaffold: `clap` `Cli` + `Command` enum.
- `main.rs` dispatches to lib.
- Files: `crates/stringops-cli/src/{main.rs, cli.rs, Cargo.toml}`.
- Exit: `cargo run -p stringops-cli -- reverse hello` prints `olleh`.

### Phase 3 — Vertical slice (1 AI session)

- Pick one operation (reverse), write doctest + unit test + integration test + CLI test.
- Files: same as phase 1+2 with tests added.
- Exit: full self-verification recipe (section 8.5) green.

### Phase 4 — "Auth + multi-user" → for crates: features + MSRV + docs polish (1 AI session)

Crates have no auth. Replace this phase with:

- Add `unicode` feature flag + alternative impl.
- Add `[package.metadata.docs.rs]` with `all-features = true`.
- Wire MSRV CI job.
- Files: each crate's `Cargo.toml`, `.github/workflows/ci.yml`.
- Exit: `cargo doc --all-features` clean; MSRV CI green.

### Phase 5 — Ship + monitor (1 AI session)

- Reserve names on crates.io with a 0.0.0 stub (manual `cargo publish`).
- Run `cargo dist init`, commit.
- Set up Trusted Publishing on crates.io for both crates.
- Tag `v0.1.0` via `cargo release`. Watch release.yml.
- Verify: `cargo install stringops-cli` from a clean machine works.
- Files: `dist-workspace.toml`, generated `release.yml`, `CHANGELOG.md`.
- Exit: a green Release on GitHub + listings on crates.io + working install via Homebrew.

---

## 18. Feature Recipes

For a library + CLI crate, the canonical "features" list differs from web/mobile apps. The 10 most common follow.

### 1. Add a new public function

1. Edit `crates/stringops/src/<module>.rs` — add `pub fn`.
2. Add `///` doc with at least one doctest.
3. `pub use` it from `lib.rs`.
4. Add unit tests `#[cfg(test)] mod tests`.
5. Append to `CHANGELOG.md` `[Unreleased] ### Added`.
6. `cargo nextest run -p stringops && cargo test --doc -p stringops`.

### 2. Add a new CLI subcommand

1. Add a variant to `Command` enum in `crates/stringops-cli/src/cli.rs`.
2. Add a `match` arm in `main.rs`.
3. Add `assert_cmd` test in `crates/stringops-cli/tests/cli.rs`.
4. CHANGELOG entry.

### 3. Add a feature flag

1. In `crates/stringops/Cargo.toml`, add to `[features]`: `unicode = ["dep:unicode-segmentation"]`.
2. Add the optional dep: `unicode-segmentation = { version = "1", optional = true }`.
3. Gate code: `#[cfg(feature = "unicode")] pub fn ... { ... }`.
4. In `[package.metadata.docs.rs]`, ensure `all-features = true` so docs.rs renders both impls.
5. Test both: `cargo nextest run --no-default-features` and `cargo nextest run --all-features`.

### 4. Add an async API

1. Add `tokio = { version = "1", default-features = false, features = ["rt", "macros", "io-util"] }` to `[dependencies]` (or to a feature flag).
2. **Do NOT** call `tokio::main` or initialize a runtime in the library.
3. Mark functions `pub async fn`.
4. Tests use `#[tokio::test(flavor = "current_thread")]`.

### 5. Add error handling

1. Library: extend `enum Error` in `crates/stringops/src/error.rs` with `#[error("...")]`.
2. Convert from foreign error: `#[from]` on the field.
3. Binary: `main()` returns `color_eyre::Result<()>`. Use `?` everywhere.

### 6. Add a benchmark

1. `mkdir -p crates/stringops/benches`.
2. Add to `crates/stringops/Cargo.toml`: `[dev-dependencies] criterion = "0.5"` and `[[bench]] name = "reverse" harness = false`.
3. Write `benches/reverse.rs` with `criterion::criterion_group!`.
4. `cargo bench -p stringops --bench reverse`.

### 7. Add an example

1. `mkdir -p crates/stringops/examples`.
2. Write `crates/stringops/examples/quickstart.rs` with a `fn main()`.
3. `cargo run -p stringops --example quickstart`.
4. Examples are auto-built by CI via `cargo build --examples --workspace`.

### 8. Add cross-platform support

1. cargo-dist already covers mac/linux/windows + arm64. Verify in `dist-workspace.toml` `targets`.
2. For crate-level: add `#[cfg(unix)]` / `#[cfg(windows)]` gates around platform-specific code.
3. CI matrix in `ci.yml` already covers all three OSes.

### 9. Add structured logging in the CLI

(Already in scaffold.) For libraries, ONLY emit events; never init subscriber. Use `tracing::debug!` with structured fields:

```rust
tracing::debug!(input.len = input.len(), "reversing");
```

### 10. Add release automation

1. Run `cargo dist init` once.
2. For each release, run `cargo release patch --workspace --execute`.
3. Set up Trusted Publishing at <https://crates.io/crates/stringops/settings/new-trusted-publisher> — repo, workflow filename (`release.yml`), environment (optional).
4. After first successful release, delete any legacy `CRATES_IO_TOKEN` secret.

---

## 19. Troubleshooting

| Verbatim error | Fix |
|---|---|
| `error: linker 'cc' not found` | Linux: `sudo apt install build-essential`. macOS: `xcode-select --install`. |
| `error: Microsoft C++ Build Tools is required` | Windows: re-run rustup, accept MSVC option, or `winget install Microsoft.VisualStudio.2022.BuildTools`. |
| `error: failed to run custom build command for openssl-sys` | `sudo apt install libssl-dev pkg-config` (Linux); `brew install openssl@3` (macOS). |
| `error: package `X` cannot be tested because it requires dev-dependencies` | Run from workspace root, not member dir; or add the dep to `[dev-dependencies]`. |
| `error: failed to parse manifest at ... unknown field 'rust-version'` | Update Cargo: `rustup update`. |
| `error: package `stringops` is already taken` | Crate name globally unique; pick another. |
| `error: api errors (status 400 Bad Request): missing or empty metadata fields: description, license` | Add `description` and `license` to `[package]`. |
| `error: 1 advisory found` (cargo-audit) | Read `cargo audit` output; bump the impacted dep with `cargo update -p <crate>`. |
| `warning: unused manifest key: package.metadata.dist` | Outdated cargo-dist; `cargo install cargo-dist@0.31.0 --locked --force`. |
| `error: lockfile generation forbidden` | CI uses `--locked`; lockfile out of date. Locally `cargo build` then commit `Cargo.lock`. |
| `error: doctest failed at line N` | A `///` example no longer compiles. Fix the snippet or refactor. |
| `error: cannot find type `Foo` in this scope` (in doctest) | Use `use crate_name::Foo;` inside the doctest. |
| `error: package collision: stringops-internal already exists` | Add `publish = false` to keep it private. |
| `error: failed to verify package tarball` | `cargo publish --no-verify` only as last resort; usually a doctest fails when packaged. |
| `error: failed to download `clap`` | Network or proxy. `cargo fetch --locked` to retry; check `~/.cargo/config.toml`. |
| `error: process didn't exit successfully: ... (exit code: 0xc0000139)` | Windows: missing VC redist. Install Visual C++ Redistributable. |
| `clippy: error: this lint expectation is unfulfilled` | Remove the `#[expect(...)]` or fix the lint. |
| `error: failed to load source for dependency `stringops`` | Path or version mismatch. Use `path = "../stringops", version = "0.1"`. |
| `error: cannot find macro `tokio::main`` | `default-features = false` stripped the macros feature. Add `features = ["macros", "rt-multi-thread"]`. |
| `error[E0658]: ... is unstable` | A nightly-only feature snuck in. Remove `#![feature(...)]` or move to nightly CI. |
| `error: too many open files` (Linux, large test runs) | `ulimit -n 4096` before `cargo nextest run`. |
| `error: api errors: rate limited` (crates.io) | Wait 60 s; if persists, cut release frequency. |
| `error: failed to publish: a token is required` | Set up Trusted Publishing OR `CARGO_REGISTRY_TOKEN`. |
| `Released, but installer.sh 404` | cargo-dist Release was draft. Workflow re-promotes; or manually `gh release edit <tag> --draft=false`. |
| `error: build script panicked: 'package not present'` | `build.rs` reads env var unset locally. Document required env in README. |
| `nextest is not installed` | `cargo install cargo-nextest --locked`. |
| `cargo-deny: error: licenses ok ... source not allowed` | Add the registry to `[sources] allow-registry`. |
| `warning: associated function `from_str` is never used` | clippy's `dead_code` lint with `--all-features`. Add `#[allow(dead_code)]` only with a comment. |
| `error: failed to verify package: missing or empty metadata fields: license-file or license` | Add `license = "MIT OR Apache-2.0"` to `[package]`. |
| `git tag v0.1.0 already exists` | `git tag -d v0.1.0 && git push origin :refs/tags/v0.1.0` (only before release went public). |
| `error: failed to read `Cargo.toml`: invalid TOML` | Run `cargo verify-project`. Most likely an unescaped quote. |

---

## 20. Glossary

- **Cargo:** Rust's official build tool, package manager, and test runner. Bundled with `rustc`.
- **Crate:** a Rust package. Either a library (produces a `.rlib`) or a binary (produces an executable).
- **Workspace:** a directory of multiple crates that share `Cargo.lock` and `target/`.
- **`Cargo.toml`:** the manifest. Declares package metadata and dependencies.
- **`Cargo.lock`:** auto-generated record of exact dependency versions. Commit it.
- **`rustc`:** the Rust compiler.
- **`rustup`:** the Rust toolchain installer; switches between stable/beta/nightly.
- **MSRV:** Minimum Supported Rust Version. The oldest `rustc` your crate compiles on.
- **clippy:** linter. Catches common mistakes and suggests idiomatic alternatives.
- **rustfmt:** opinionated formatter. No options worth fighting over.
- **Edition:** language version that opts into changes (`2015`, `2018`, `2021`, `2024`). Per-crate.
- **Feature (flag):** a named compile-time toggle in `[features]`. Lets users opt into deps or code paths.
- **Trait:** Rust's interface. Like Java's interface or Go's interface.
- **`unsafe`:** opt-out of compiler safety checks. Required for raw pointers, FFI, some unchecked indexing.
- **Doctest:** an example in a `///` comment that compiles and runs as a test.
- **Integration test:** a `.rs` file in `tests/` that uses your crate as an external user would.
- **Lockfile:** the `Cargo.lock`. Pins exact versions for reproducibility.
- **crates.io:** the public Rust package registry. Like npm, PyPI.
- **docs.rs:** auto-builds and hosts documentation for every crate published to crates.io.
- **`cargo-dist`:** axodotdev tool that builds + ships prebuilt binaries (mac/linux/win) for a Rust CLI.
- **`cargo-release`:** automates version bumping, tagging, and pushing for workspace releases.
- **`cargo-deny`:** policy enforcement on dependencies (licenses, banned crates, sources, advisories).
- **`cargo-audit`:** scans `Cargo.lock` against the RustSec advisory database for known CVEs.
- **`cargo-nextest`:** modern test runner. ~3× faster than `cargo test`. Doesn't run doctests.
- **`cargo-semver-checks`:** detects breaking API changes between two versions.
- **Trusted Publishing:** publishing to crates.io from CI without a long-lived token, using OIDC.
- **OIDC:** OpenID Connect — a way to verify "this CI job runs from this repo" without a stored secret.
- **Yank:** mark a published crate version as unwise to use; doesn't delete, prevents new lockfile selections.
- **`tracing`:** structured logging library; spans + events with metadata.
- **`thiserror` / `anyhow`:** ergonomic error helpers. Library uses `thiserror`, binary uses `anyhow`.
- **`#[derive(...)]`:** procedural macro that auto-implements a trait (`Debug`, `Clone`, ...).
- **`?` operator:** propagate an `Err` early; equivalent to `match { Ok(x) => x, Err(e) => return Err(e.into()) }`.
- **`Result<T, E>`:** Rust's success-or-error type. The convention for fallible operations.
- **`Option<T>`:** Rust's nullable; `Some(x)` or `None`.
- **`#[cfg(...)]`:** conditional compilation attribute.
- **Build script (`build.rs`):** Rust file run at compile time before the crate compiles.
- **Edition migration:** running `cargo fix --edition` to update syntax for a new edition.
- **Resolver:** how cargo picks dep versions; v3 is current default for 2024 edition.

---

## 21. Update Cadence

- This rulebook is valid for: Rust stable **1.93–1.95.x** (MSRV 1.93), cargo-release **1.1.x**, cargo-dist **0.31.x**, cargo-deny **0.16.x**, cargo-audit **0.22.x**, cargo-nextest **0.9.x**, cargo-semver-checks **0.47.x**.
- Re-run the generator when:
  - `rustc` major bump (e.g., 2.0).
  - `cargo-dist` minor bump (release.yml schema changes between minors).
  - Edition 2027 stabilizes.
  - crates.io changes Trusted Publishing requirements.
  - A RustSec advisory affects the default dep set.

Last updated: **2026-04-27**.
