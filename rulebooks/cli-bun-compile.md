# Bun Single-Binary CLI — RULEBOOK

> TypeScript CLI compiled to a single static binary via `bun build --compile`. Distributed through GitHub Releases (primary), an npm wrapper package (`optionalDependencies` + `postinstall`), and a Homebrew tap auto-bumped via `repository_dispatch`. Targets darwin-arm64, darwin-x64, linux-arm64, linux-x64, windows-x64.

---

## 1. Snapshot

### 1.1 Decisions table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 | Strict types, native Bun support, zero transpile step. |
| Runtime + version | Bun 1.3.13 | Compile target, fast startup, single binary. |
| Package manager | Bun (`bun install`) | Same tool as runtime, deterministic lockfile. |
| Build tool | `bun build --compile` | Native single-binary compile, cross-target. |
| Arg parser | citty 0.2.2 | Typed, ESM, native `parseArgs`, lazy subcommands. |
| Interactive prompts | @clack/prompts 1.2.0 | Modern UX, small footprint, accessible. |
| State mgmt | None (stateless CLI) | CLIs are short-lived; no global store. |
| Routing/Nav | citty subcommands | Built-in, lazy-loaded. |
| Data layer | None (FS + JSON) | CLIs persist via files, not databases. |
| Config file | `~/.config/supercli/config.json` | XDG-spec compliant, plain JSON. |
| Auth | OAuth device flow (when needed) | Browserless, terminal-friendly. |
| Styling | picocolors 1.1.1 | Tiny, no deps, ANSI safe. |
| Forms + validation | zod 3.24.1 | Type-safe, runs in compiled binary. |
| Unit test runner | Vitest 4.1.5 | Fast, ESM-native, mocking, coverage. |
| E2E framework | Vitest + spawned binary | Run compiled binary in temp dir. |
| Mocking strategy | Vitest `vi.mock` at adapter boundary | Never mock fs/process; mock HTTP. |
| Logger | consola 3.4.2 | Structured, level-aware, ANSI-aware. |
| Error tracking | Sentry CLI SDK 8.47.0 (opt-in via env) | Optional, no PII default. |
| Lint + format | Biome 2.4 | One tool, Rust-fast, no ESLint+Prettier. |
| Type checking | `tsc --noEmit` (TS 5.7) | Authoritative; Bun does not type-check. |
| Env vars + secrets | `process.env` at runtime only | Never bake secrets into compiled binary. |
| CI provider | GitHub Actions | Free, matrix runners, OIDC. |
| Deploy target | GitHub Releases (binaries) | Free, durable, signed URLs. |
| Distribution channels | GitHub Releases + npm wrapper + Homebrew tap | Three channels covers 95%+ users. |
| Compile flags | `--compile --minify --bytecode --sourcemap` | Smallest + fastest startup. |
| Compile targets | bun-darwin-arm64, bun-darwin-x64, bun-linux-arm64, bun-linux-x64, bun-windows-x64 | Five-platform matrix. |
| macOS signing | Developer ID Application + notarytool | Required for Gatekeeper; no warnings. |
| Windows signing | Azure Trusted Signing (signtool) | Modern, EV-equivalent, no HSM. |
| Linux signing | Unsigned (sha256 checksums) | No infra; verify via SHA256SUMS. |
| Install one-liner | `curl -fsSL <repo>/install.sh \| sh` | OS+arch detection, downloads from Releases. |
| Tap-bump trigger | `repository_dispatch` from release workflow | Fires after binary upload completes. |
| Auto-update | `supercli update` self-replace + version check | Polls GitHub Releases API. |
| Release flow | tag `v*` → matrix compile → sign → upload → publish npm → dispatch tap | One workflow, fully automated. |
| Versioning | Semver via tag (`v1.2.3`) | Tag is source of truth; `package.json` synced. |

### 1.2 Versions table

| Lib | Version | Released | Link |
|---|---|---|---|
| Bun | 1.3.13 | 2026-04-20 | https://bun.com/blog |
| TypeScript | 5.7.2 | 2025-11-22 | https://www.typescriptlang.org/ |
| citty | 0.2.2 | 2026-04-03 | https://www.npmjs.com/package/citty |
| @clack/prompts | 1.2.0 | 2026-03-31 | https://www.npmjs.com/package/@clack/prompts |
| consola | 3.4.2 | 2025-08-15 | https://www.npmjs.com/package/consola |
| picocolors | 1.1.1 | 2024-09-15 | https://www.npmjs.com/package/picocolors |
| zod | 3.24.1 | 2024-12-10 | https://www.npmjs.com/package/zod |
| Vitest | 4.1.5 | 2026-04-21 | https://www.npmjs.com/package/vitest |
| Biome | 2.4.0 | 2026-02-18 | https://biomejs.dev/ |
| @sentry/bun | 8.47.0 | 2024-12-19 | https://www.npmjs.com/package/@sentry/bun |
| GitHub CLI (`gh`) | 2.65.0 | 2025-12-18 | https://cli.github.com/ |

### 1.3 Minimum host requirements

| Resource | Minimum |
|---|---|
| OS for `bun build --compile` (host) | macOS 12+, Ubuntu 22.04+, Windows 10+ (cross-compile from any) |
| OS for compiled binary (target) | macOS 12+ (darwin-arm64/x64), Ubuntu 22.04+ glibc (linux-arm64/x64), Windows 10+ (win-x64) |
| RAM | 4 GB host; 256 MB to run compiled binary |
| Disk | 2 GB host (Bun + node_modules); 60–120 MB per compiled binary |
| Bun version | 1.3.13 (older versions ship a truncated darwin-arm64 code signature; see Pitfalls #1) |
| Node | Not required at runtime. Required only if user installs via npm wrapper. |

### 1.4 Cold-start estimate

`git clone` → first compiled `./supercli --version` on a fresh machine: **3 minutes**. Breakdown: install Bun (45 s), `bun install` (15 s), `bun run build` (35 s for one target), `./dist/supercli --version` (instant).

---

## 2. Zero-to-running (Setup)

`TARGET_OS = all`. Run only the section for your OS.

### 2.1 macOS

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Bun
brew install oven-sh/bun/bun
bun --version
# Expected: 1.3.13 (or newer)

# 3. Install GitHub CLI and authenticate
brew install gh
gh auth login
# Choose: GitHub.com → HTTPS → Login with web browser

# 4. Clone and bootstrap
git clone https://github.com/<owner>/supercli.git
cd supercli
bun install

# 5. Run dev
bun run dev -- --help

# 6. Build local binary
bun run build:local
./dist/supercli --version
```

Apple Developer account: required for signed/notarized macOS builds. Sign up at https://developer.apple.com/programs/ ($99/yr). Needed for Section 12 release flow only — local development uses ad-hoc signing.

### 2.2 Windows

```powershell
# 1. Install Bun (via winget; PowerShell as Administrator)
winget install Oven-sh.Bun
# Restart PowerShell to refresh PATH
bun --version
# Expected: 1.3.13

# 2. Install GitHub CLI
winget install GitHub.cli
gh auth login

# 3. Install Git (if missing)
winget install Git.Git

# 4. Clone and bootstrap
git clone https://github.com/<owner>/supercli.git
cd supercli
bun install

# 5. Run dev
bun run dev -- --help

# 6. Build local binary
bun run build:local
.\dist\supercli.exe --version
```

Azure Trusted Signing account: required for signed Windows builds. Create at https://portal.azure.com → "Trusted Signing Accounts". Needed for release flow only.

### 2.3 Linux (Ubuntu 22.04+ / Debian 12+)

```bash
# 1. Install Bun
curl -fsSL https://bun.sh/install | bash
echo 'export PATH="$HOME/.bun/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc
bun --version
# Expected: 1.3.13

# 2. Install GitHub CLI
(type -p wget >/dev/null || sudo apt install wget -y) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install gh -y
gh auth login

# 3. Clone and bootstrap
git clone https://github.com/<owner>/supercli.git
cd supercli
bun install

# 4. Run dev
bun run dev -- --help

# 5. Build local binary
bun run build:local
./dist/supercli --version
```

### 2.4 Expected first-run output

```
$ bun install
bun install v1.3.13 (...)
+ @clack/prompts@1.2.0
+ citty@0.2.2
+ consola@3.4.2
+ picocolors@1.1.1
+ zod@3.24.1
+ vitest@4.1.5
+ @biomejs/biome@2.4.0

48 packages installed [1.42s]

$ bun run dev -- --help
USAGE supercli [OPTIONS] <command>

COMMANDS

  init     Initialize a new project
  hello    Print hello message
  update   Self-update to latest version
  version  Print version

Use supercli <command> --help for more information about a command.
```

### 2.5 Common first-run errors

| Error | Cause | Fix |
|---|---|---|
| `bun: command not found` | PATH missing `~/.bun/bin` | `export PATH="$HOME/.bun/bin:$PATH"` then re-source shell |
| `error: lockfile had changes, but lockfile is frozen` | `bun install --frozen-lockfile` in CI | run `bun install` locally, commit `bun.lockb` |
| `Killed: 9` (macOS arm64) on compiled binary | Bun < 1.3.13 truncated codesign | upgrade Bun: `brew upgrade bun` |
| `error: Could not resolve "node:..."` | Importing Node-only API not in Bun | replace with Bun-native equivalent (see Pitfalls #7) |
| `error: ENOENT: no such file or directory` for embedded asset | Asset not declared in `bun build` input | add asset import with `with { type: "file" }` |
| `gh: command not found` after install on Windows | PowerShell session predates winget install | restart PowerShell |
| `EACCES: permission denied` on Linux postinstall | npm global without prefix | `npm config set prefix ~/.npm-global` |
| Permission prompt on first run (macOS) | Quarantine xattr from download | `xattr -d com.apple.quarantine ./supercli` (signed builds avoid this) |

---

## 3. Project Layout

### 3.1 Directory tree

```
supercli/
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .claude/
│   └── settings.json
├── .codex/
│   └── config.toml
├── .cursor/
│   └── rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── bin/
│   └── install.mjs           # npm wrapper entry — picks platform binary
├── npm/                      # generated platform-specific npm packages
│   ├── darwin-arm64/
│   ├── darwin-x64/
│   ├── linux-arm64/
│   ├── linux-x64/
│   └── win32-x64/
├── scripts/
│   ├── build-all.ts          # cross-compile matrix
│   ├── build-npm.ts          # generate per-platform npm packages
│   ├── checksum.ts           # SHA256SUMS for releases
│   └── verify-binary.ts      # smoke runs each compiled binary
├── src/
│   ├── cli.ts                # entrypoint — citty defineCommand
│   ├── commands/
│   │   ├── init.ts
│   │   ├── hello.ts
│   │   ├── update.ts
│   │   └── version.ts
│   ├── lib/
│   │   ├── config.ts         # XDG config read/write
│   │   ├── http.ts           # network adapter (mock here in tests)
│   │   ├── log.ts            # consola wrapper
│   │   └── update.ts         # self-update logic
│   └── types.ts
├── tests/
│   ├── unit/
│   │   ├── config.test.ts
│   │   └── hello.test.ts
│   └── e2e/
│       └── compiled.test.ts  # spawns ./dist/supercli
├── install.sh                # curl one-liner installer (served from GH)
├── Formula/                  # Homebrew tap mirror (auto-bumped repo)
│   └── supercli.rb
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── biome.json
├── bun.lockb
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── LICENSE
```

### 3.2 Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Source files | kebab-case `.ts` | `src/commands/init.ts` |
| Test files | mirror source + `.test.ts` | `tests/unit/init.test.ts` |
| Command exports | `default export defineCommand({...})` | `src/commands/hello.ts` |
| Types | PascalCase | `type Config = {...}` |
| Functions | camelCase | `function loadConfig()` |
| Constants | SCREAMING_SNAKE | `const DEFAULT_TIMEOUT_MS = 5000` |
| Compiled binary | `dist/supercli` (or `.exe`) | `dist/supercli-darwin-arm64` |

### 3.3 "If you're adding X, it goes in Y"

| Adding… | Location |
|---|---|
| New top-level command | `src/commands/<name>.ts` + register in `src/cli.ts` |
| Subcommand | `src/commands/<parent>/<child>.ts` |
| Shared utility | `src/lib/<name>.ts` |
| Network call | `src/lib/http.ts` (never directly in command) |
| Filesystem read/write | `src/lib/config.ts` or `src/lib/fs.ts` |
| Interactive prompt | inside command file using `@clack/prompts` |
| Type used across files | `src/types.ts` |
| Unit test | `tests/unit/<source-name>.test.ts` |
| E2E test (runs binary) | `tests/e2e/<scenario>.test.ts` |
| Build step | `scripts/<verb>-<noun>.ts` |
| Bundled asset (icon, template) | `assets/` + import with `with { type: "file" }` |
| Env var | document in `README.md` and read via `process.env` only |
| Error type | `src/lib/errors.ts` (extend `Error`) |
| CI step | `.github/workflows/ci.yml` |
| Release step | `.github/workflows/release.yml` |

---

## 4. Architecture

### 4.1 Process boundaries

```
┌────────────────────────────────────────────────────┐
│ User shell                                         │
│   $ supercli init my-app                           │
└────────────┬───────────────────────────────────────┘
             ▼
┌────────────────────────────────────────────────────┐
│ Compiled single binary (Bun runtime + JS bytecode) │
│  ┌──────────────────────────────────────────────┐  │
│  │ src/cli.ts (citty.runMain)                   │  │
│  │   ↓ parses argv via Node util.parseArgs      │  │
│  │ src/commands/init.ts                         │  │
│  │   ↓ uses @clack/prompts                      │  │
│  │ src/lib/{config,http,log}.ts                 │  │
│  └──────────────────────────────────────────────┘  │
│  Embedded assets (templates) via with{type:file}   │
└────────────────────────────────────────────────────┘
             ▲                              ▲
             │ filesystem                   │ network (only via http.ts)
             │ ~/.config/supercli/          │ GitHub API, custom endpoints
```

### 4.2 Data flow (typical command)

```
argv → citty.parseArgs → command.run({args}) → validate (zod)
                                              → load config (lib/config)
                                              → call HTTP (lib/http)  ← test seam
                                              → render output (consola/clack)
                                              → exit code 0|non-zero
```

### 4.3 Auth flow (OAuth device, when login required)

```
user: supercli login
  → POST /oauth/device/code           (lib/http)
  → display user_code + verification_uri (clack note)
  → poll /oauth/token until 200 (timeout 600s)
  → write token to ~/.config/supercli/auth.json (mode 0600)
  → consola.success("Logged in as <user>")
```

### 4.4 Self-update flow

```
supercli update
  → fetch https://api.github.com/repos/<owner>/<repo>/releases/latest
  → compare tag_name vs embedded VERSION
  → if newer: download asset for current os+arch
  → verify SHA256 against SHA256SUMS (signed by checksum)
  → write to tmp file, chmod +x, rename(tmp, current_exe_path)
  → exec self with --version to confirm
```

### 4.5 Entry-point file map

| File | Responsibility |
|---|---|
| `src/cli.ts` | Define root command, register subcommands, call `runMain` |
| `src/commands/*.ts` | One file = one command. Parses args, calls lib, prints output |
| `src/lib/config.ts` | Read/write `~/.config/supercli/config.json` (XDG-compliant) |
| `src/lib/http.ts` | Wraps `fetch` with retry, timeout, auth header. Test seam. |
| `src/lib/log.ts` | Wraps consola with package name + log level from env |
| `src/lib/update.ts` | Self-update logic; isolated for testability |
| `bin/install.mjs` | npm wrapper: pick `npm/<os>-<arch>/` binary, exec |

### 4.6 Where business logic lives

- **Lives in:** `src/lib/*.ts` (pure functions, takes inputs, returns outputs).
- **Does NOT live in:** `src/cli.ts` (only registration) or `src/commands/*.ts` (only orchestration: parse → call lib → print).

---

## 5. Dev Workflow

### 5.1 Start dev

```bash
bun run dev -- <args>
# = bun --watch run src/cli.ts -- <args>
```

The watcher restarts on any `src/**/*.ts` change. No HMR; CLIs do not need it. Each invocation is a fresh process.

### 5.2 Hot reload behavior

- File save in `src/` → process restarts within 100 ms.
- Breaks if: import cycle (Bun warns), syntax error (last good state held), TS error (Bun does not check; run `bun run typecheck`).

### 5.3 Debugger

**VS Code / Cursor:** `.vscode/launch.json` ships a `Debug CLI` config. Set breakpoint, F5.

**Terminal:** `bun --inspect run src/cli.ts -- <args>` → open `chrome://inspect`.

**Compiled binary:** `BUN_INSPECT=1 ./dist/supercli` → DevTools attaches.

### 5.4 Inspect runtime

| Need | Tool |
|---|---|
| Network calls | `consola.level = 4` (verbose); HTTP adapter logs every request |
| Config state | `cat ~/.config/supercli/config.json` |
| Env vars seen by process | `bun run -- supercli --print-env` (built-in helper) |
| Memory/CPU | `bun --smol run src/cli.ts` (limit) or `time ./dist/supercli` |

### 5.5 Pre-commit checks

`bunx lefthook install` registers:

```
pre-commit: bun run check  # = biome check + tsc --noEmit + bun test
```

### 5.6 Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits. `feat: add init command`, `fix: handle empty config`, `chore: bump bun to 1.3.13`.
- One PR = one feature. Squash-merge.

---

## 6. Testing & Parallelization

### 6.1 Unit tests

- Live in `tests/unit/**/*.test.ts`.
- Run: `bun run test` → `vitest run`.
- Watch: `bun run test:watch`.
- Single file: `bun run test tests/unit/config.test.ts`.
- Single test: `bun run test -t "loads default config"`.

### 6.2 E2E tests (run compiled binary)

- Live in `tests/e2e/**/*.test.ts`.
- Pre-step: `bun run build:local` (writes `dist/supercli`).
- Spawns the binary in a tmp dir using `Bun.spawn`. Asserts stdout, stderr, exit code, files created.
- Run: `bun run test:e2e`.

### 6.3 Parallel by default

`vitest.config.ts` ships:

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "threads",
    poolOptions: { threads: { singleThread: false } },
    fileParallelism: true,
    isolate: true,
    coverage: { provider: "v8", reporter: ["text", "lcov"], include: ["src/**"] },
    environment: "node",
  },
});
```

### 6.4 Mocking rules

| What | Mock? | How |
|---|---|---|
| `src/lib/http.ts` | YES at adapter boundary | `vi.mock("../../src/lib/http")` |
| `fs` / `node:fs` | NO | use real tmp dir via `Bun.tempDirSync` |
| `process.env` | NO (mutate locally) | `vi.stubEnv("KEY", "v")` then `vi.unstubAllEnvs()` |
| `Date.now` | NO except for time-based logic | `vi.useFakeTimers()` only inside that test |
| External HTTP | YES | mock `http.ts` — never `global.fetch` |
| User input (clack) | YES | mock `@clack/prompts` `text/select/confirm` |

### 6.5 Coverage target

- Statements ≥ 80%, branches ≥ 70%.
- Measured: `bun run test:coverage` → outputs `coverage/lcov.info`.
- CI fails below threshold.

### 6.6 Visual regression

N/A — no UI surface.

### 6.7 Parallelization patterns for AI agents

| Safe to fan out | Unsafe — must be sequential |
|---|---|
| Scaffold a new command file + its test file | Anything that edits `package.json` |
| Add multiple lib utilities under disjoint paths | Anything that edits `bun.lockb` |
| Update README sections in different headings | Anything that edits `tsconfig.json` |
| Generate per-platform npm packages from a built binary | `bun build --compile` runs (writes `dist/`) |
| Fix lint issues in disjoint files | Bumping a dep that updates `bun.lockb` |

---

## 7. Logging

### 7.1 Setup

```ts
// src/lib/log.ts
import { consola, createConsola } from "consola";

const level = Number(process.env.SUPERCLI_LOG_LEVEL ?? 3); // 0=silent, 4=verbose
export const log = createConsola({ level, defaults: { tag: "supercli" } });
export { consola };
```

### 7.2 Levels

| Level | Use |
|---|---|
| 0 fatal | unrecoverable; exit code non-zero immediately after |
| 1 error | a step failed but CLI may continue |
| 2 warn | something deprecated or near-failure |
| 3 info (default) | user-visible normal output |
| 4 verbose | debug — only on `--verbose` or `SUPERCLI_LOG_LEVEL=4` |

### 7.3 Required fields per log line (verbose mode)

`{ ts, level, cmd, event, ms, ...payload }`. JSON-line when `SUPERCLI_LOG_FORMAT=json`.

### 7.4 Sample lines

```
$ SUPERCLI_LOG_FORMAT=json SUPERCLI_LOG_LEVEL=4 supercli init my-app
{"ts":"2026-04-27T14:02:11.103Z","level":"info","cmd":"init","event":"start","args":{"name":"my-app"}}
{"ts":"2026-04-27T14:02:11.108Z","level":"verbose","cmd":"init","event":"http.request","method":"GET","url":"https://api.github.com/..."}
{"ts":"2026-04-27T14:02:11.412Z","level":"verbose","cmd":"init","event":"http.response","status":200,"ms":304}
{"ts":"2026-04-27T14:02:11.420Z","level":"info","cmd":"init","event":"done","ms":317}
```

### 7.5 Where logs go

- **dev/local:** stdout.
- **CI:** stdout (captured by GitHub Actions).
- **prod (user machines):** stdout. If `SUPERCLI_SENTRY_DSN` env is set and `--report-errors` flag passed, errors go to Sentry. Default: nothing leaves the user's machine.

### 7.6 Grep locally

```bash
SUPERCLI_LOG_FORMAT=json supercli init my-app 2>&1 | jq 'select(.level=="error")'
```

---

## 8. AI Rules (the heart of the file)

### 8.1 ALWAYS (≥20)

1. ALWAYS run `bun run check` (Biome + tsc + Vitest) before declaring a task done.
2. ALWAYS use `src/lib/http.ts` for network calls; never call `fetch` directly from a command file.
3. ALWAYS write tests in the same PR as the source change (TDD: failing test first).
4. ALWAYS use `defineCommand` from citty for every new command — never roll a custom argv parser.
5. ALWAYS validate user input with zod before passing to lib.
6. ALWAYS use `@clack/prompts` for interactive UI (text, confirm, select); never write to stdout from commands directly except via consola.
7. ALWAYS use Bun-native APIs (`Bun.file`, `Bun.write`, `Bun.spawn`, `Bun.$`) when available before reaching for `node:fs`/`node:child_process`.
8. ALWAYS read secrets from `process.env` at runtime — never hardcode, never `import` from a local `.env.ts`.
9. ALWAYS bump version via `bun run release <patch|minor|major>` — it edits `package.json` and creates a tag in one step.
10. ALWAYS pin Bun version in `package.json` `packageManager` field and in `.github/workflows/*.yml` to a specific patch (e.g. `1.3.13`).
11. ALWAYS run the cross-compile matrix locally before tagging a release: `bun run build:all`.
12. ALWAYS verify the compiled binary runs on each target before publishing: `bun run verify`.
13. ALWAYS write SHA256SUMS for every release artifact and upload it as a release asset.
14. ALWAYS use `--minify --bytecode --sourcemap` flags together when compiling for release.
15. ALWAYS run `xcrun notarytool submit ... --wait` for macOS builds before uploading; only upload notarized binaries.
16. ALWAYS sign Windows binaries via Azure Trusted Signing before upload.
17. ALWAYS update both the npm wrapper AND the Homebrew formula when releasing — the release workflow does this automatically.
18. ALWAYS exit with non-zero code on user error or system error; only zero on success.
19. ALWAYS print errors to stderr (`consola.error`) and successes to stdout (`consola.log`).
20. ALWAYS document every new command and flag in README.md before merging the PR.
21. ALWAYS use `process.exit(code)` only at the top level of `src/cli.ts`; lib/commands throw or return.
22. ALWAYS clamp ANSI output via `picocolors` so `--no-color` and `NO_COLOR` env work for free.

### 8.2 NEVER (≥15)

1. NEVER bake secrets, API keys, or tokens into the compiled binary. Strings in `src/` are visible in the binary via `strings(1)`.
2. NEVER call `process.exit` from inside `src/lib/**` or `src/commands/**` — throw instead. Exit only in `src/cli.ts`.
3. NEVER install Node-only dependencies that polyfill what Bun provides natively (e.g. `cross-fetch`, `node-fetch`).
4. NEVER use `require()` — this codebase is ESM-only.
5. NEVER skip the typecheck step on the assumption "Bun will catch it." Bun does not type-check.
6. NEVER target `bun-linux-x64-musl` or `bun-linux-arm64-musl` unless you explicitly want Alpine support; default is glibc.
7. NEVER edit `bun.lockb` by hand. Always re-run `bun install`.
8. NEVER write to a path outside the user's CWD or `~/.config/supercli/` without an explicit prompt.
9. NEVER ship a release without bumping the version in `package.json` and tagging it — the release workflow keys off the tag.
10. NEVER mock `node:fs` in tests — use a real tmp dir.
11. NEVER use `console.log` directly; use `consola` so log level routing works.
12. NEVER hardcode the install path in install.sh — detect via `$BIN_DIR` with `/usr/local/bin` fallback.
13. NEVER assume the user has Node installed; the binary must be self-sufficient (the npm wrapper is opt-in).
14. NEVER bump the Homebrew formula by hand; the `repository_dispatch` from the release workflow does it.
15. NEVER call `git` from CLI logic — shelling out is fragile; use Bun-native or pure HTTP if needed.
16. NEVER include `node_modules` in the binary input by accident; only `src/cli.ts` is the entry; everything else is bundled by Bun.
17. NEVER use `--target=bun` (no os/arch) for release; that produces a host-only binary. Always specify `bun-<os>-<arch>`.
18. NEVER ship a binary built on Bun < 1.3.13; older versions emit a truncated darwin-arm64 codesign that macOS kills (Pitfalls #1).

### 8.3 Blast radius reference (≥20 rows)

| Path | Blast | Verify on change |
|---|---|---|
| `package.json` | every command, every CI run | `bun install && bun run check` |
| `bun.lockb` | every install | `bun install --frozen-lockfile` then full test |
| `tsconfig.json` | typecheck + IDE | `bun run typecheck` clean |
| `biome.json` | every lint run | `bun run check:lint` clean |
| `vitest.config.ts` | every test run | `bun run test` clean |
| `src/cli.ts` | every command entry | `bun run dev -- --help` lists all commands |
| `src/commands/*.ts` | that command only | unit + e2e for that command |
| `src/lib/http.ts` | every command that hits network | full `bun run test`; manual smoke of `update` |
| `src/lib/config.ts` | every command that reads/writes config | full `bun run test`; smoke `init` and read back |
| `src/lib/log.ts` | every log line in CLI | run with `SUPERCLI_LOG_LEVEL=4`; check JSON validity |
| `src/lib/update.ts` | self-update flow | manual: `supercli update --dry-run` |
| `src/types.ts` | typecheck across all callers | `bun run typecheck` clean |
| `bin/install.mjs` | every npm install on user machines | `npm pack && npm i -g ./*.tgz` and run binary |
| `install.sh` | every curl-install on user machines | `bash -n install.sh` then dry-run with `DRY_RUN=1 ./install.sh` |
| `Formula/supercli.rb` | every Homebrew install | `brew style Formula/supercli.rb` and `brew install --build-from-source` |
| `scripts/build-all.ts` | release matrix | `bun run build:all` produces 5 binaries; verify each |
| `scripts/build-npm.ts` | npm wrapper packages | regenerate, run `npm pack` on each |
| `scripts/checksum.ts` | release verification | regenerate SHA256SUMS, diff |
| `.github/workflows/ci.yml` | every PR check | push branch; check Actions UI |
| `.github/workflows/release.yml` | every release | dry-run via `act` or push test tag to a fork |
| `CLAUDE.md` / `AGENTS.md` / `.cursor/rules` | future AI sessions | re-read after edit; ensure consistency with section 8 |
| `assets/**` (embedded files) | binary contents and size | `bun run build:local && ls -lh dist/` size delta |

### 8.4 Definition of Done

**Bug fix:**
- [ ] Failing regression test added in same PR.
- [ ] `bun run check` clean.
- [ ] Manual repro shows fix.
- [ ] Capture before/after stdout in PR.

**New feature (command or flag):**
- [ ] `defineCommand` registered in `src/cli.ts`.
- [ ] `--help` output for the command/flag is clear.
- [ ] Unit tests + at least one e2e test that spawns the compiled binary.
- [ ] README updated.
- [ ] No new top-level dependency unless approved.

**Refactor:**
- [ ] Behavior unchanged: existing tests pass without modification.
- [ ] No new dependency.
- [ ] Diff focused on one concern.

**Dependency bump:**
- [ ] `bun update <pkg>` only — never edit `package.json` versions by hand for runtime deps.
- [ ] Run `bun run check` and `bun run build:all`.
- [ ] Verify each compiled binary boots: `bun run verify`.
- [ ] Note breaking-change risk in PR.

**Schema change (config file format):**
- [ ] Migration path implemented in `src/lib/config.ts` (`schemaVersion` field).
- [ ] Test for old → new migration.
- [ ] Bump minor version (config schema is part of public API).

**Copy change:**
- [ ] Update string in source.
- [ ] Update e2e snapshot if applicable.
- [ ] Update README example.

### 8.5 Self-verification recipe

```bash
bun install                         # expect: "X packages installed [Ys]"
bun run typecheck                   # expect: no output, exit 0
bun run check:lint                  # expect: "Checked X files in Yms. No fixes applied."
bun run test                        # expect: "Test Files  X passed | Tests  Y passed"
bun run build:local                 # expect: dist/supercli binary, size 60-120 MB
./dist/supercli --version           # expect: "supercli vX.Y.Z" matching package.json
bun run test:e2e                    # expect: e2e tests green
```

If any line is non-zero exit, the task is NOT done.

### 8.6 Parallelization patterns

Safe (disjoint files):
- Scaffold a new command + test in parallel with another command + test.
- Update README + AGENTS.md + .cursor/rules in parallel.
- Generate per-platform npm packages in parallel after the matrix compile finishes.

Unsafe (shared mutable state):
- Two agents bumping deps simultaneously — `bun.lockb` will conflict.
- Two agents editing `src/cli.ts` (the central register).
- Two agents running `bun build` against `dist/` simultaneously.

---

## 9. Stack-Specific Pitfalls (≥15)

1. **Truncated darwin-arm64 codesign on Bun < 1.3.13.** Compiled binary gets killed by macOS with SIGKILL on launch. → Symptom: `zsh: killed ./supercli`. → Fix: upgrade Bun to ≥ 1.3.13. → Detect: check `bun --version` in CI before build.
2. **`--target=bun-linux-arm64` on musl host.** Compile silently picks glibc target; binary fails on Alpine. → Fix: explicitly pass `--target=bun-linux-arm64-musl` for Alpine builds, or document glibc requirement. → Detect: run binary in `alpine:3.19` Docker container.
3. **Forgetting `--minify` triples binary size.** 80 MB → 240 MB. → Fix: always include `--minify` in release builds (script does this). → Detect: `ls -lh dist/`.
4. **Secrets baked into binary.** A constant in `src/lib/http.ts` like `const TOKEN = "..."` is visible via `strings ./supercli`. → Fix: read from `process.env` at runtime only. → Detect: `strings dist/supercli | grep -i 'sk_\|api[_-]key'` in CI.
5. **`process.exit(0)` inside lib hides errors in tests.** Vitest cannot catch it. → Fix: throw instead, exit only in `src/cli.ts`. → Detect: lint rule `noProcessExit` in non-cli files.
6. **npm postinstall fails offline / behind firewall.** Wrapper tries to fetch binary from GitHub. → Fix: ship platform binaries as `optionalDependencies` so npm itself fetches them; postinstall only verifies presence. → Detect: `npm install --offline` smoke test in CI.
7. **`node:crypto` mismatch between Bun and Node.** `crypto.randomUUID()` works in both, but `crypto.createHash` argument typing differs. → Fix: use `Bun.hash` or `crypto.createHash('sha256').update(buf).digest('hex')` carefully. → Detect: typecheck + e2e on both runtimes.
8. **`SHA256SUMS` drift after rebuilding binary.** Homebrew formula's `sha256` no longer matches uploaded asset. → Fix: regenerate sums in same workflow step that uploads, dispatch tap-bump only after sums upload completes. → Detect: `brew install --build-from-source --verbose` in CI.
9. **Windows PATH not refreshed after install.** `winget` install of Bun, but current shell still says command not found. → Fix: instruct user to restart shell; install.sh prints reminder. → Detect: install.sh runs `command -v supercli` after copy and warns.
10. **Cross-compiled Windows binary missing icon/manifest.** Bun does not embed Win32 resources. → Fix: ship as raw `.exe`; users who want an icon can use a wrapper installer. → Detect: not applicable for CLI.
11. **Code signing profile mismatch on macOS.** `Developer ID Installer` cert used instead of `Developer ID Application` cert. → Fix: use the Application cert, not the Installer cert. → Detect: `codesign -dv ./supercli` should show "Authority=Developer ID Application: ..."
12. **Notarization timeout in CI (>30 min wait).** `xcrun notarytool ... --wait` blocks. → Fix: use `--wait --timeout 30m` and retry once on transient failure; do not staple (CLIs cannot be stapled per Apple). → Detect: workflow timeout > 35 min.
13. **`bun build --compile` re-runs every CI even when src unchanged.** Slow. → Fix: cache by hash of `bun.lockb` + `src/**` in GitHub Actions cache. → Detect: workflow timing.
14. **Embedded asset path differs in dev vs compiled.** `import x from "./templates/init.json" with { type: "file" }` works in compiled but `Bun.file("./templates/init.json")` only works at dev time. → Fix: always use the import attribute pattern. → Detect: e2e test on compiled binary, not just `bun run`.
15. **`@clack/prompts` cancelled signal not handled.** User hits Ctrl+C, command continues with `undefined`. → Fix: check `isCancel(value)` after every prompt and call `outro` + `process.exit(130)`. → Detect: e2e test that sends SIGINT.
16. **Homebrew tap repo workflow uses default `GITHUB_TOKEN`.** `repository_dispatch` from main repo can fire it but the bump action cannot push to a different repo with default token. → Fix: use a fine-grained PAT with `contents: write` on the tap repo, stored as `HOMEBREW_TAP_TOKEN`. → Detect: tap workflow run logs.
17. **npm wrapper `bin` field points at JS file, but compiled binary is what runs.** Wrong shebang. → Fix: `bin/install.mjs` is a tiny JS shim that `execv`s the platform binary from `optionalDependencies`. → Detect: `which supercli` after `npm i -g` should resolve to the shim, which then exec's binary.
18. **Bun version drift between local and CI.** Local 1.3.13 produces working binary; CI 1.3.10 produces broken one. → Fix: pin in `package.json` `packageManager: "bun@1.3.13"` and in `oven-sh/setup-bun@v2` workflow input. → Detect: workflow prints `bun --version` at top of every job.

---

## 10. Performance Budgets

| Metric | Budget | Measure |
|---|---|---|
| Binary size (per platform) | ≤ 120 MB minified+bytecode | `ls -lh dist/supercli-*` |
| Cold start (`./supercli --version`) | ≤ 60 ms on M-series, ≤ 120 ms on x86_64 | `hyperfine './dist/supercli --version'` |
| `--help` render time | ≤ 80 ms | `hyperfine './dist/supercli --help'` |
| Install (`curl install.sh \| sh`) | ≤ 15 s on 50 Mbps | `time bash install.sh` |
| npm wrapper postinstall | ≤ 5 s | timed in CI |
| Memory at idle | ≤ 80 MB RSS | `/usr/bin/time -l ./supercli --version` (mac) |

Over budget? Steps:

1. Re-run with `--minify --bytecode`. Confirm both flags.
2. Audit imports: `bun build src/cli.ts --target=bun-darwin-arm64 --analyze` shows top contributors.
3. Move heavy deps behind dynamic `import()` in command files (citty supports lazy subcommands).
4. Drop optional features behind a `--with-feature` flag.

---

## 11. Security

### 11.1 Secret storage

- **Runtime:** read from `process.env`. Document required env vars in README.
- **Persisted:** `~/.config/supercli/auth.json`, mode `0600`, never committed.
- **NEVER in source:** no constants, no `.env.production`, no fallback. `strings(1)` will find them.

### 11.2 Auth threat model

- The compiled binary runs as the invoking user; OS file perms are the only sandbox.
- Tokens written by `supercli login` are readable by that user only.
- Tokens are **not** transmitted to anyone but the documented API endpoint.

### 11.3 Input validation boundary

- All user-supplied strings (argv, env, prompt input) pass through zod schemas before reaching `lib/`.
- Filesystem paths are joined with `path.resolve(homedir(), …)` and checked against an allowlist before write.

### 11.4 Output escaping

- Never emit unsanitized user input as part of a shell command. Use `Bun.spawn(["cmd", arg])` with arg array, not `Bun.$\`cmd ${input}\``.

### 11.5 Permissions / capabilities

- macOS: app sandbox not used (CLI tools do not require it). Only `Developer ID Application` signing + notarization.
- Windows: Authenticode-signed via Azure Trusted Signing.
- Linux: no signing; SHA256SUMS published alongside binaries.

### 11.6 Dependency audit

```bash
bun pm audit               # weekly cron in CI
```

Fail CI if critical advisories on direct deps.

### 11.7 Top 5 stack-specific risks

1. **Strings in compiled binary are visible.** Anyone with the binary has every literal string in `src/`. Never put secrets there.
2. **Self-update overwrites itself with a downloaded blob.** Always verify SHA256 against signed checksum file before `rename(tmp, exe)`.
3. **install.sh `curl | sh` is trust-on-first-use.** Provide a verify-before-run path: `curl -fsSL .../install.sh -o install.sh && shasum -a 256 install.sh && sh install.sh`. Document it.
4. **Homebrew formula `url` should pin to a specific tag, not `main` branch.** Otherwise rebase changes the bottle.
5. **npm postinstall scripts run as the user.** Keep `bin/install.mjs` minimal; do not exec arbitrary downloaded code.

---

## 12. Deploy

### 12.1 Release flow (full)

```
1. bun run release patch        # bumps package.json, creates git tag vX.Y.Z, pushes
2. GitHub Actions release.yml fires on tag push:
   a. Matrix: 5 jobs (mac-arm64 self-host, mac-x64 cross, linux-arm64 cross, linux-x64 native, win-x64 cross)
   b. Each job: bun build --compile --minify --bytecode --sourcemap --target=bun-<os>-<arch>
   c. macOS job: codesign --sign "Developer ID Application: <Team>" --options runtime --timestamp ./supercli
                 zip + xcrun notarytool submit --wait --apple-id ... --team-id ...
   d. Windows job: signtool sign /tr <azure-trusted-signing-uri> /td SHA256 /fd SHA256 /dlib <path> /dmdf <metadata>.json supercli.exe
   e. All jobs upload to gh release create vX.Y.Z --draft (idempotent --append)
3. Aggregate job:
   a. Generate SHA256SUMS file from all artifacts
   b. Upload SHA256SUMS as release asset
   c. gh release edit vX.Y.Z --draft=false
4. Publish job:
   a. bun run scripts/build-npm.ts → 5 platform packages + 1 wrapper
   b. cd npm/wrapper && npm publish --provenance --access public
   c. cd npm/<platform> && npm publish (each)
5. Dispatch job:
   a. gh api repos/<owner>/homebrew-tap/dispatches -f event_type=release \
        -f client_payload[version]=X.Y.Z \
        -f client_payload[sha256_arm64]=... \
        -f client_payload[sha256_x64]=...
   b. Tap repo workflow updates Formula/supercli.rb and pushes to main
```

### 12.2 Staging vs prod

- **Prod:** tag `vX.Y.Z` on `main`.
- **Staging:** tag `vX.Y.Z-rc.N` (semver pre-release). Workflow only uploads to GH Releases as a `--prerelease`, does NOT publish to npm or dispatch tap-bump. Test the binary, then tag `vX.Y.Z` to promote.

### 12.3 Rollback

```bash
gh release delete vX.Y.Z --yes
git push --delete origin vX.Y.Z
npm unpublish supercli@X.Y.Z   # within 72h only
# Tap repo: revert the bump commit
gh repo clone <owner>/homebrew-tap
cd homebrew-tap
git revert HEAD
git push
```

Max safe rollback window: 72 hours (npm unpublish limit). Past that, publish a patch that re-asserts the previous version's behavior.

### 12.4 Health check / smoke

```bash
./dist/supercli --version          # prints version, exit 0
./dist/supercli hello --json       # prints {"message":"hello"}, exit 0
./dist/supercli init --dry-run /tmp/x   # creates nothing, prints plan, exit 0
```

### 12.5 Versioning scheme

- Semver. Source of truth: git tag.
- `package.json` `version` is updated by `bun run release`.
- Compiled binary embeds version: `src/version.ts` is generated at build time:
  ```ts
  export const VERSION = "X.Y.Z";   // generated; do not edit
  ```

### 12.6 Auto-update

`supercli update` is a built-in command (see `src/commands/update.ts`):

1. Fetches latest release from GitHub API.
2. Compares against `VERSION`.
3. If newer, downloads the platform-matching asset to a temp file.
4. Verifies SHA256 against `SHA256SUMS`.
5. `rename(tmp, current_exe_path)` (atomic on Linux/mac, requires elevation on Windows in protected paths).
6. Re-execs self with `--version` to confirm.

### 12.7 Distribution channels

| Channel | Install command |
|---|---|
| curl one-liner | `curl -fsSL https://raw.githubusercontent.com/<owner>/supercli/main/install.sh \| sh` |
| Homebrew | `brew install <owner>/supercli/supercli` |
| npm (global) | `npm i -g supercli` |
| Direct download | https://github.com/<owner>/supercli/releases/latest |

### 12.8 Cost estimate per 1k MAU

- GitHub Releases: $0 (public). Free 2 GB/month bandwidth on private; public has no documented cap.
- npm: $0.
- Homebrew tap: $0.
- Azure Trusted Signing: ~$10/mo flat (signs unlimited binaries).
- Apple Developer: $99/yr.
- **Total fixed: ~$220/yr regardless of MAU.**

---

## 13. Claude Code Integration

### 13.1 `CLAUDE.md`

```markdown
# CLAUDE.md — supercli

This project is a TypeScript CLI compiled to a single binary via `bun build --compile`. Read `cli-bun-compile.md` rulebook (root of this repo) for full rules.

## Commands you will run constantly

- `bun install` — install deps
- `bun run dev -- <args>` — run CLI in watch mode
- `bun run check` — Biome + tsc + Vitest (must pass before any commit)
- `bun run build:local` — compile current-platform binary to `dist/`
- `bun run build:all` — cross-compile all 5 platform binaries
- `bun run test` — Vitest
- `bun run test:e2e` — spawn compiled binary
- `bun run release patch|minor|major` — bump + tag + push (triggers release workflow)

## Banned patterns

- `console.log` → use `consola` from `src/lib/log.ts`
- `fetch(...)` directly in commands → use `src/lib/http.ts`
- `process.exit` outside `src/cli.ts` → throw instead
- Hardcoded secrets → read `process.env` at runtime
- `require(...)` → ESM-only, use `import`

## Skills to invoke

- `/test-driven-development` — before any feature work
- `/systematic-debugging` — for any bug
- `/verification-before-completion` — before declaring "done"
- `/ship` — to bump + tag + push

## Self-verification (always run before claiming done)

```
bun run check && bun run build:local && ./dist/supercli --version && bun run test:e2e
```

If any step fails non-zero, the task is NOT done.
```

### 13.2 `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(bun:*)",
      "Bash(bunx:*)",
      "Bash(./dist/supercli:*)",
      "Bash(gh:*)",
      "Bash(git:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(find:*)",
      "Bash(rg:*)",
      "Bash(grep:*)",
      "Bash(hyperfine:*)",
      "Bash(file:*)",
      "Bash(strings:*)",
      "Bash(codesign:*)",
      "Bash(xcrun:*)",
      "Bash(shasum:*)",
      "Bash(sha256sum:*)"
    ],
    "deny": [
      "Bash(rm -rf /:*)",
      "Bash(npm publish:*)",
      "Bash(git push --force:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bunx biome format --write \"$CLAUDE_FILE_PATHS\" 2>/dev/null || true" }
        ]
      }
    ],
    "PreCommit": [
      {
        "hooks": [
          { "type": "command", "command": "bun run check" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bun run typecheck && bun run test --run --reporter=dot" }
        ]
      }
    ]
  }
}
```

### 13.3 Slash command shortcuts

- `/ship` — runs `bun run release patch` then watches the workflow.
- `/qa` — runs `bun run build:local && ./dist/supercli` against a checklist.
- `/codex` — second-opinion review on tricky compile flag changes.
- `/review` — pre-merge review on diff against `main`.

---

## 14. Codex Integration

### 14.1 `AGENTS.md`

```markdown
# AGENTS.md — supercli

Same project as CLAUDE.md. Codex-specific notes below.

## Workflow

1. Read `cli-bun-compile.md` rulebook before any change.
2. Use the verification recipe in section 8.5 before declaring done.
3. Cross-compile output goes in `dist/`, never check it in.

## Tooling

- All commands run via Bun (`bun run <script>`).
- Test runner: Vitest (`bun run test`).
- Lint+format: Biome (`bun run check:lint`).
- Type check: `bun run typecheck`.

## Codex-specific differences from Claude Code

- Codex's web search is disabled by default; if you need to verify a Bun version, ask the user to run `bun --version` and paste the output.
- Codex sandbox has no network unless explicitly granted; `bun install` must be run by the user, not the agent.
- Approval mode: `auto` for read, `prompt` for write to `package.json`, `bun.lockb`, `.github/**`.
```

### 14.2 `.codex/config.toml`

```toml
[model]
name = "claude-opus-4-7"
context = "1m"

[sandbox]
network = "deny"
filesystem = "workspace-rw"

[approval]
default = "auto"
high_risk_paths = [
  "package.json",
  "bun.lockb",
  ".github/workflows/*.yml",
  "Formula/*.rb",
  "install.sh",
]
high_risk_mode = "prompt"

[commands]
allow = ["bun", "bunx", "git", "gh", "node", "npm"]
deny = ["rm -rf /", "git push --force", "npm publish"]
```

---

## 15. Cursor / Other Editors

### 15.1 `.cursor/rules`

```
# Cursor rules — supercli

Read cli-bun-compile.md (project root) for full rules.

ALWAYS:
- Run `bun run check` before committing.
- Use citty `defineCommand` for new commands.
- Use `src/lib/http.ts` for network calls.
- Use `consola` for output, never `console.log`.
- Validate user input with zod before passing to lib.
- Use `Bun.file`, `Bun.write`, `Bun.spawn` over node:fs/node:child_process.
- Pin Bun to 1.3.13 in CI.
- Compile with `--minify --bytecode --sourcemap`.

NEVER:
- Bake secrets into source.
- Call process.exit outside src/cli.ts.
- Use require() — ESM only.
- Mock node:fs in tests.
- Edit bun.lockb by hand.
- Ship a release without bumping the version tag.
- Use --target=bun (no os/arch) for releases.

Self-verify: bun run check && bun run build:local && ./dist/supercli --version
```

### 15.2 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "oven.bun-vscode",
    "vitest.explorer",
    "github.vscode-github-actions",
    "redhat.vscode-yaml",
    "tamasfe.even-better-toml"
  ]
}
```

### 15.3 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug CLI",
      "program": "${workspaceFolder}/src/cli.ts",
      "args": ["--help"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    },
    {
      "type": "bun",
      "request": "launch",
      "name": "Debug Vitest",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run"],
      "cwd": "${workspaceFolder}",
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After the last one, `git push` triggers a green CI run.

### 16.1 `package.json`

```json
{
  "name": "supercli",
  "version": "0.0.1",
  "description": "A TypeScript CLI compiled to a single binary via Bun.",
  "type": "module",
  "license": "MIT",
  "packageManager": "bun@1.3.13",
  "engines": { "bun": ">=1.3.13" },
  "bin": { "supercli": "./bin/install.mjs" },
  "files": ["bin/install.mjs", "README.md", "LICENSE"],
  "optionalDependencies": {
    "supercli-darwin-arm64": "0.0.1",
    "supercli-darwin-x64":   "0.0.1",
    "supercli-linux-arm64":  "0.0.1",
    "supercli-linux-x64":    "0.0.1",
    "supercli-win32-x64":    "0.0.1"
  },
  "scripts": {
    "dev": "bun --watch run src/cli.ts",
    "typecheck": "tsc --noEmit",
    "check:lint": "biome check src tests",
    "check:fix": "biome check --write src tests",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "vitest run tests/e2e",
    "check": "bun run check:lint && bun run typecheck && bun run test",
    "build:local": "bun build src/cli.ts --compile --minify --bytecode --sourcemap --outfile dist/supercli",
    "build:all": "bun run scripts/build-all.ts",
    "build:npm": "bun run scripts/build-npm.ts",
    "verify": "bun run scripts/verify-binary.ts",
    "checksum": "bun run scripts/checksum.ts",
    "release": "bun run scripts/release.ts"
  },
  "dependencies": {
    "citty": "0.2.2",
    "@clack/prompts": "1.2.0",
    "consola": "3.4.2",
    "picocolors": "1.1.1",
    "zod": "3.24.1"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.0",
    "@types/bun": "1.3.13",
    "typescript": "5.7.2",
    "vitest": "4.1.5",
    "@vitest/coverage-v8": "4.1.5"
  }
}
```

### 16.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "moduleDetection": "force",
    "allowImportingTsExtensions": false,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "lib": ["ESNext"],
    "types": ["bun"]
  },
  "include": ["src/**/*", "tests/**/*", "scripts/**/*"]
}
```

### 16.3 `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src", "tests", "scripts"] },
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
      "style": { "noNonNullAssertion": "warn", "useConst": "error" },
      "suspicious": { "noExplicitAny": "error" },
      "correctness": { "noUnusedVariables": "error" }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "double", "semicolons": "always", "trailingCommas": "all" }
  }
}
```

### 16.4 `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    pool: "threads",
    fileParallelism: true,
    isolate: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: ["src/**"],
      thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 },
    },
    environment: "node",
  },
});
```

### 16.5 `src/cli.ts`

```ts
import { defineCommand, runMain } from "citty";
import { VERSION } from "./version";

const main = defineCommand({
  meta: { name: "supercli", version: VERSION, description: "A fast CLI." },
  subCommands: {
    init:    () => import("./commands/init").then((m) => m.default),
    hello:   () => import("./commands/hello").then((m) => m.default),
    update:  () => import("./commands/update").then((m) => m.default),
    version: () => import("./commands/version").then((m) => m.default),
  },
});

runMain(main);
```

### 16.6 `src/version.ts`

```ts
export const VERSION = "0.0.1";
```

### 16.7 `src/commands/hello.ts`

```ts
import { defineCommand } from "citty";
import { log } from "../lib/log";

export default defineCommand({
  meta: { name: "hello", description: "Print hello message." },
  args: {
    name: { type: "string", description: "Name to greet.", default: "world" },
    json: { type: "boolean", description: "JSON output.", default: false },
  },
  run({ args }) {
    if (args.json) {
      process.stdout.write(JSON.stringify({ message: `hello ${args.name}` }) + "\n");
      return;
    }
    log.success(`hello ${args.name}`);
  },
});
```

### 16.8 `src/commands/init.ts`

```ts
import { defineCommand } from "citty";
import { intro, isCancel, outro, text } from "@clack/prompts";
import { log } from "../lib/log";

export default defineCommand({
  meta: { name: "init", description: "Initialize a new project." },
  args: {
    name: { type: "positional", description: "Project name.", required: false },
    "dry-run": { type: "boolean", description: "Print plan; do not write.", default: false },
  },
  async run({ args }) {
    intro("supercli init");
    let name = args.name;
    if (!name) {
      const v = await text({ message: "Project name?", placeholder: "my-app" });
      if (isCancel(v)) { outro("Cancelled."); process.exit(130); }
      name = v as string;
    }
    if (args["dry-run"]) {
      log.info(`Would create directory: ${name}`);
      outro("Dry run.");
      return;
    }
    await Bun.write(`${name}/README.md`, `# ${name}\n`);
    outro(`Created ${name}/`);
  },
});
```

### 16.9 `src/commands/update.ts`

```ts
import { defineCommand } from "citty";
import { log } from "../lib/log";
import { selfUpdate } from "../lib/update";

export default defineCommand({
  meta: { name: "update", description: "Self-update to latest version." },
  args: { "dry-run": { type: "boolean", default: false } },
  async run({ args }) {
    const result = await selfUpdate({ dryRun: args["dry-run"] });
    if (result.upToDate) { log.info(`Already at latest: v${result.current}`); return; }
    if (args["dry-run"]) { log.info(`Would upgrade ${result.current} → ${result.latest}`); return; }
    log.success(`Upgraded ${result.current} → ${result.latest}`);
  },
});
```

### 16.10 `src/commands/version.ts`

```ts
import { defineCommand } from "citty";
import { VERSION } from "../version";

export default defineCommand({
  meta: { name: "version", description: "Print version." },
  run() { process.stdout.write(`supercli v${VERSION}\n`); },
});
```

### 16.11 `src/lib/log.ts`

```ts
import { createConsola } from "consola";

const level = Number(process.env.SUPERCLI_LOG_LEVEL ?? 3);
export const log = createConsola({ level, defaults: { tag: "supercli" } });
```

### 16.12 `src/lib/http.ts`

```ts
type FetchOptions = RequestInit & { timeoutMs?: number };

export async function http(url: string, opts: FetchOptions = {}): Promise<Response> {
  const { timeoutMs = 15_000, ...init } = opts;
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), timeoutMs);
  try {
    const headers = new Headers(init.headers);
    if (!headers.has("user-agent")) headers.set("user-agent", "supercli");
    return await fetch(url, { ...init, headers, signal: ac.signal });
  } finally {
    clearTimeout(timer);
  }
}
```

### 16.13 `src/lib/config.ts`

```ts
import { homedir } from "node:os";
import { join } from "node:path";
import { z } from "zod";

const Schema = z.object({
  schemaVersion: z.literal(1).default(1),
  defaultName: z.string().default("world"),
});
export type Config = z.infer<typeof Schema>;

const path = () => join(process.env.XDG_CONFIG_HOME ?? join(homedir(), ".config"), "supercli", "config.json");

export async function loadConfig(): Promise<Config> {
  const f = Bun.file(path());
  if (!(await f.exists())) return Schema.parse({});
  return Schema.parse(await f.json());
}

export async function saveConfig(cfg: Config): Promise<void> {
  await Bun.write(path(), JSON.stringify(Schema.parse(cfg), null, 2));
}
```

### 16.14 `src/lib/update.ts`

```ts
import { http } from "./http";
import { VERSION } from "../version";

const REPO = "owner/supercli"; // overwritten by build script if needed

type Result = { current: string; latest: string; upToDate: boolean };

export async function selfUpdate(opts: { dryRun: boolean }): Promise<Result> {
  const r = await http(`https://api.github.com/repos/${REPO}/releases/latest`);
  if (!r.ok) throw new Error(`GitHub API ${r.status}`);
  const data = (await r.json()) as { tag_name: string };
  const latest = data.tag_name.replace(/^v/, "");
  const upToDate = latest === VERSION;
  if (upToDate || opts.dryRun) return { current: VERSION, latest, upToDate };
  // download + verify + atomic rename omitted for brevity; see real impl
  return { current: VERSION, latest, upToDate: false };
}
```

### 16.15 `bin/install.mjs`

```js
#!/usr/bin/env node
// npm wrapper: pick the platform binary from optionalDependencies and exec it.
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const platform = process.platform;
const arch = process.arch;
const key = platform === "win32" ? "win32-x64" : `${platform}-${arch}`;
const pkg = `supercli-${key}`;

let binPath;
try {
  binPath = require.resolve(`${pkg}/bin/supercli${platform === "win32" ? ".exe" : ""}`);
} catch {
  console.error(`supercli: no prebuilt binary for ${platform}-${arch}.`);
  console.error(`Install via: curl -fsSL https://raw.githubusercontent.com/owner/supercli/main/install.sh | sh`);
  process.exit(1);
}

const r = spawnSync(binPath, process.argv.slice(2), { stdio: "inherit" });
process.exit(r.status ?? 1);
```

### 16.16 `install.sh`

```sh
#!/bin/sh
# install.sh — download supercli for the current platform from GitHub Releases.
set -eu

REPO="${REPO:-owner/supercli}"
BIN_DIR="${BIN_DIR:-/usr/local/bin}"
VERSION="${VERSION:-latest}"

uname_s=$(uname -s 2>/dev/null || echo unknown)
uname_m=$(uname -m 2>/dev/null || echo unknown)

case "$uname_s" in
  Darwin) os="darwin" ;;
  Linux) os="linux" ;;
  MINGW*|MSYS*|CYGWIN*) os="windows" ;;
  *) echo "unsupported OS: $uname_s" >&2; exit 1 ;;
esac

case "$uname_m" in
  x86_64|amd64) arch="x64" ;;
  arm64|aarch64) arch="arm64" ;;
  *) echo "unsupported arch: $uname_m" >&2; exit 1 ;;
esac

if [ "$os" = "windows" ] && [ "$arch" = "arm64" ]; then
  echo "no windows-arm64 binary; use Windows on Intel or WSL" >&2
  exit 1
fi

ext=""
[ "$os" = "windows" ] && ext=".exe"

asset="supercli-${os}-${arch}${ext}"
if [ "$VERSION" = "latest" ]; then
  url="https://github.com/${REPO}/releases/latest/download/${asset}"
else
  url="https://github.com/${REPO}/releases/download/${VERSION}/${asset}"
fi

tmp=$(mktemp -t supercli.XXXXXX)
echo "downloading $url"
curl -fSL "$url" -o "$tmp"

# Verify checksum
sums_url="${url%/*}/SHA256SUMS"
if curl -fsSL "$sums_url" -o "${tmp}.sums" 2>/dev/null; then
  expected=$(grep " ${asset}\$" "${tmp}.sums" | awk '{print $1}')
  if command -v sha256sum >/dev/null 2>&1; then
    actual=$(sha256sum "$tmp" | awk '{print $1}')
  else
    actual=$(shasum -a 256 "$tmp" | awk '{print $1}')
  fi
  if [ "$expected" != "$actual" ]; then
    echo "checksum mismatch: $expected vs $actual" >&2
    exit 1
  fi
  rm -f "${tmp}.sums"
fi

chmod +x "$tmp"
dest="${BIN_DIR}/supercli${ext}"
if [ -w "$BIN_DIR" ]; then
  mv "$tmp" "$dest"
else
  echo "elevating to write to $BIN_DIR"
  sudo mv "$tmp" "$dest"
fi

echo "installed: $dest"
"$dest" --version
```

### 16.17 `Formula/supercli.rb` (Homebrew tap)

```ruby
class Supercli < Formula
  desc "A fast TypeScript CLI compiled to a single binary."
  homepage "https://github.com/owner/supercli"
  version "0.0.1"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/owner/supercli/releases/download/v#{version}/supercli-darwin-arm64"
      sha256 "REPLACED_BY_BUMP_ACTION_ARM64"
    end
    on_intel do
      url "https://github.com/owner/supercli/releases/download/v#{version}/supercli-darwin-x64"
      sha256 "REPLACED_BY_BUMP_ACTION_X64"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/owner/supercli/releases/download/v#{version}/supercli-linux-arm64"
      sha256 "REPLACED_BY_BUMP_ACTION_LINUX_ARM64"
    end
    on_intel do
      url "https://github.com/owner/supercli/releases/download/v#{version}/supercli-linux-x64"
      sha256 "REPLACED_BY_BUMP_ACTION_LINUX_X64"
    end
  end

  def install
    bin.install Dir["supercli*"].first => "supercli"
  end

  test do
    assert_match version.to_s, shell_output("#{bin}/supercli --version")
  end
end
```

### 16.18 `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  check:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: 1.3.13 }
      - run: bun --version
      - run: bun install --frozen-lockfile
      - run: bun run check:lint
      - run: bun run typecheck
      - run: bun run test --coverage

  build-smoke:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-24.04, macos-14, windows-2022]
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: 1.3.13 }
      - run: bun install --frozen-lockfile
      - run: bun run build:local
      - run: ./dist/supercli --version
        if: runner.os != 'Windows'
      - run: .\dist\supercli.exe --version
        if: runner.os == 'Windows'
```

### 16.19 `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ["v*.*.*"]

permissions:
  contents: write
  id-token: write

jobs:
  compile:
    name: compile-${{ matrix.target }}
    runs-on: ${{ matrix.runner }}
    strategy:
      fail-fast: false
      matrix:
        include:
          - { target: bun-darwin-arm64, runner: macos-14,    asset: supercli-darwin-arm64 }
          - { target: bun-darwin-x64,   runner: macos-14,    asset: supercli-darwin-x64 }
          - { target: bun-linux-arm64,  runner: ubuntu-24.04, asset: supercli-linux-arm64 }
          - { target: bun-linux-x64,    runner: ubuntu-24.04, asset: supercli-linux-x64 }
          - { target: bun-windows-x64,  runner: windows-2022, asset: supercli-windows-x64.exe }
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: 1.3.13 }
      - run: bun install --frozen-lockfile
      - name: Compile
        shell: bash
        run: |
          bun build src/cli.ts \
            --compile --minify --bytecode --sourcemap \
            --target=${{ matrix.target }} \
            --outfile dist/${{ matrix.asset }}

      # macOS sign + notarize
      - name: Codesign + notarize (macOS)
        if: startsWith(matrix.target, 'bun-darwin')
        env:
          APPLE_CERT_P12_BASE64: ${{ secrets.APPLE_CERT_P12_BASE64 }}
          APPLE_CERT_PASSWORD:   ${{ secrets.APPLE_CERT_PASSWORD }}
          APPLE_TEAM_ID:         ${{ secrets.APPLE_TEAM_ID }}
          APPLE_ID:              ${{ secrets.APPLE_ID }}
          APPLE_APP_PASSWORD:    ${{ secrets.APPLE_APP_PASSWORD }}
        run: |
          echo "$APPLE_CERT_P12_BASE64" | base64 --decode > cert.p12
          security create-keychain -p tmp build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p tmp build.keychain
          security import cert.p12 -k build.keychain -P "$APPLE_CERT_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k tmp build.keychain
          codesign --force --options runtime --timestamp \
            --sign "Developer ID Application: ${{ secrets.APPLE_TEAM_NAME }} ($APPLE_TEAM_ID)" \
            dist/${{ matrix.asset }}
          ditto -c -k --keepParent dist/${{ matrix.asset }} dist/${{ matrix.asset }}.zip
          xcrun notarytool submit dist/${{ matrix.asset }}.zip \
            --apple-id "$APPLE_ID" --team-id "$APPLE_TEAM_ID" --password "$APPLE_APP_PASSWORD" \
            --wait
          codesign -dv --verbose=4 dist/${{ matrix.asset }}

      # Windows sign via Azure Trusted Signing
      - name: Sign (Windows)
        if: matrix.target == 'bun-windows-x64'
        uses: azure/trusted-signing-action@v0.5.1
        with:
          azure-tenant-id:    ${{ secrets.AZURE_TENANT_ID }}
          azure-client-id:    ${{ secrets.AZURE_CLIENT_ID }}
          azure-client-secret: ${{ secrets.AZURE_CLIENT_SECRET }}
          endpoint: https://eus.codesigning.azure.net/
          trusted-signing-account-name: ${{ secrets.AZURE_TS_ACCOUNT }}
          certificate-profile-name: ${{ secrets.AZURE_TS_PROFILE }}
          files-folder: dist
          files-folder-filter: exe
          file-digest: SHA256
          timestamp-rfc3161: http://timestamp.acs.microsoft.com
          timestamp-digest: SHA256

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.asset }}
          path: dist/${{ matrix.asset }}

  publish:
    needs: compile
    runs-on: ubuntu-24.04
    permissions:
      contents: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
        with: { bun-version: 1.3.13 }
      - uses: actions/setup-node@v4
        with: { node-version: 22, registry-url: "https://registry.npmjs.org" }
      - uses: actions/download-artifact@v4
        with: { path: dist, merge-multiple: true }

      - name: Generate SHA256SUMS
        run: |
          cd dist
          sha256sum supercli-* > SHA256SUMS
          cat SHA256SUMS

      - name: GitHub Release
        env: { GH_TOKEN: ${{ secrets.GITHUB_TOKEN }} }
        run: |
          gh release create "${GITHUB_REF_NAME}" \
            --title "${GITHUB_REF_NAME}" \
            --generate-notes \
            dist/supercli-* dist/SHA256SUMS

      - name: Build npm packages
        run: bun run scripts/build-npm.ts

      - name: Publish npm wrapper + platform packages
        env: { NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }} }
        run: |
          for d in npm/*/; do
            (cd "$d" && npm publish --provenance --access public)
          done

      - name: Dispatch Homebrew tap bump
        env: { GH_TOKEN: ${{ secrets.HOMEBREW_TAP_TOKEN }} }
        run: |
          arm64=$(grep " supercli-darwin-arm64\$" dist/SHA256SUMS | awk '{print $1}')
          x64=$(grep " supercli-darwin-x64\$"   dist/SHA256SUMS | awk '{print $1}')
          larm=$(grep " supercli-linux-arm64\$" dist/SHA256SUMS | awk '{print $1}')
          lx64=$(grep " supercli-linux-x64\$"   dist/SHA256SUMS | awk '{print $1}')
          version="${GITHUB_REF_NAME#v}"
          gh api repos/${{ github.repository_owner }}/homebrew-supercli/dispatches \
            -f event_type=release \
            -f "client_payload[version]=$version" \
            -f "client_payload[sha256_darwin_arm64]=$arm64" \
            -f "client_payload[sha256_darwin_x64]=$x64" \
            -f "client_payload[sha256_linux_arm64]=$larm" \
            -f "client_payload[sha256_linux_x64]=$lx64"
```

### 16.20 `scripts/build-all.ts`

```ts
const targets = [
  { target: "bun-darwin-arm64", out: "supercli-darwin-arm64" },
  { target: "bun-darwin-x64",   out: "supercli-darwin-x64" },
  { target: "bun-linux-arm64",  out: "supercli-linux-arm64" },
  { target: "bun-linux-x64",    out: "supercli-linux-x64" },
  { target: "bun-windows-x64",  out: "supercli-windows-x64.exe" },
];

for (const t of targets) {
  const proc = Bun.spawn([
    "bun", "build", "src/cli.ts",
    "--compile", "--minify", "--bytecode", "--sourcemap",
    `--target=${t.target}`, "--outfile", `dist/${t.out}`,
  ], { stdout: "inherit", stderr: "inherit" });
  const code = await proc.exited;
  if (code !== 0) { console.error(`build failed: ${t.target}`); process.exit(code); }
}
```

### 16.21 `scripts/build-npm.ts`

```ts
import { mkdir, cp, writeFile } from "node:fs/promises";
import pkgJson from "../package.json" with { type: "json" };

const platforms = [
  { key: "darwin-arm64", os: "darwin", cpu: "arm64", file: "supercli-darwin-arm64", exe: "supercli" },
  { key: "darwin-x64",   os: "darwin", cpu: "x64",   file: "supercli-darwin-x64",   exe: "supercli" },
  { key: "linux-arm64",  os: "linux",  cpu: "arm64", file: "supercli-linux-arm64",  exe: "supercli" },
  { key: "linux-x64",    os: "linux",  cpu: "x64",   file: "supercli-linux-x64",    exe: "supercli" },
  { key: "win32-x64",    os: "win32",  cpu: "x64",   file: "supercli-windows-x64.exe", exe: "supercli.exe" },
];

for (const p of platforms) {
  const dir = `npm/supercli-${p.key}`;
  await mkdir(`${dir}/bin`, { recursive: true });
  await cp(`dist/${p.file}`, `${dir}/bin/${p.exe}`);
  await writeFile(`${dir}/package.json`, JSON.stringify({
    name: `supercli-${p.key}`,
    version: pkgJson.version,
    os: [p.os],
    cpu: [p.cpu],
    files: [`bin/${p.exe}`],
    license: "MIT",
  }, null, 2));
}

// Wrapper package
await mkdir("npm/supercli/bin", { recursive: true });
await cp("bin/install.mjs", "npm/supercli/bin/install.mjs");
await writeFile("npm/supercli/package.json", JSON.stringify({
  ...pkgJson,
  scripts: undefined,
  devDependencies: undefined,
}, null, 2));
```

### 16.22 `scripts/release.ts`

```ts
const bump = process.argv[2] ?? "patch";
const valid = new Set(["patch", "minor", "major"]);
if (!valid.has(bump)) { console.error("usage: bun run release patch|minor|major"); process.exit(1); }

const pkg = await Bun.file("package.json").json();
const [maj, min, pat] = pkg.version.split(".").map(Number);
const next = bump === "major" ? `${maj+1}.0.0` : bump === "minor" ? `${maj}.${min+1}.0` : `${maj}.${min}.${pat+1}`;
pkg.version = next;
await Bun.write("package.json", JSON.stringify(pkg, null, 2));
await Bun.write("src/version.ts", `export const VERSION = "${next}";\n`);

await Bun.spawn(["git", "add", "package.json", "src/version.ts"], { stdout: "inherit" }).exited;
await Bun.spawn(["git", "commit", "-m", `release: v${next}`], { stdout: "inherit" }).exited;
await Bun.spawn(["git", "tag", `v${next}`], { stdout: "inherit" }).exited;
await Bun.spawn(["git", "push", "origin", "main", "--tags"], { stdout: "inherit" }).exited;
console.log(`tagged v${next}`);
```

### 16.23 `tests/unit/hello.test.ts`

```ts
import { describe, it, expect } from "vitest";
import hello from "../../src/commands/hello";

describe("hello command", () => {
  it("has correct meta", () => {
    expect(hello.meta).toEqual({ name: "hello", description: "Print hello message." });
  });
});
```

### 16.24 `tests/e2e/compiled.test.ts`

```ts
import { describe, it, expect, beforeAll } from "vitest";
import { existsSync } from "node:fs";

const BIN = process.platform === "win32" ? "./dist/supercli.exe" : "./dist/supercli";

beforeAll(() => {
  if (!existsSync(BIN)) throw new Error(`run 'bun run build:local' first; ${BIN} missing`);
});

describe("compiled binary", () => {
  it("prints version", async () => {
    const proc = Bun.spawn([BIN, "--version"], { stdout: "pipe" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    expect(out).toMatch(/supercli v\d+\.\d+\.\d+/);
  });

  it("hello with --json", async () => {
    const proc = Bun.spawn([BIN, "hello", "--name", "ada", "--json"], { stdout: "pipe" });
    const out = await new Response(proc.stdout).text();
    await proc.exited;
    expect(JSON.parse(out)).toEqual({ message: "hello ada" });
  });
});
```

### 16.25 `README.md`

```markdown
# supercli

A fast TypeScript CLI, distributed as a single static binary.

## Install

**curl one-liner:**
```sh
curl -fsSL https://raw.githubusercontent.com/owner/supercli/main/install.sh | sh
```

**Homebrew:**
```sh
brew install owner/supercli/supercli
```

**npm:**
```sh
npm i -g supercli
```

## Develop

```sh
bun install
bun run dev -- hello --name world
bun run check
```

## License
MIT
```

### 16.26 `LICENSE`

(Standard MIT text — owner + year.)

### 16.27 `.gitignore`

```
node_modules/
dist/
npm/
coverage/
*.log
.DS_Store
*.p12
*.pem
```

---

## 17. Idea → MVP Path

`PROJECT_IDEA = blank` — this section uses the generic `supercli` from above. Replace verbs/nouns with the user's real idea on first session.

**Phase 1 — Schema (1 session, ~1 hr)**
Files: `src/lib/config.ts`, `src/types.ts`.
Exit: `loadConfig()` returns a typed `Config`; `saveConfig()` round-trips.

**Phase 2 — Backbone (1 session, ~2 hrs)**
Files: `src/cli.ts`, `src/commands/{init,hello,version,update}.ts`.
Exit: `bun run dev -- --help` lists 4 commands; each prints meaningful output.

**Phase 3 — Vertical slice (2 sessions, ~4 hrs)**
Pick one user-visible workflow (e.g. `init` builds a project from a template).
Files: `src/commands/init.ts`, `assets/template.json` (embedded), `tests/unit/init.test.ts`, `tests/e2e/init.test.ts`.
Exit: `./dist/supercli init my-app` creates `my-app/` with template files; e2e green.

**Phase 4 — Auth + multi-user (1 session, ~2 hrs; only if remote API)**
Files: `src/commands/login.ts`, `src/lib/auth.ts`, `~/.config/supercli/auth.json` write.
Exit: device-flow login works; subsequent commands send `Authorization: Bearer ...`.

**Phase 5 — Ship + monitor (1 session, ~2 hrs)**
Files: `.github/workflows/release.yml`, `Formula/supercli.rb`, `install.sh`, `bin/install.mjs`, `scripts/{build-all,build-npm,release}.ts`.
Exit: `bun run release patch` → green workflow → `brew install owner/supercli/supercli` works → `npm i -g supercli` works → `curl … | sh` works.

Total: **~5 sessions, ~11 hours, from `bun init` to v1.0.0 in user terminals via brew/npm/curl.**

---

## 18. Feature Recipes

Only feature recipes that apply to a single-binary CLI. The non-applicable items in the rulebook generator's standard list (push notifications, dark mode, i18n UI, etc.) are documented as N/A.

### 18.1 OAuth device-flow login

Files: `src/commands/login.ts`, `src/lib/auth.ts`.
Pattern: POST device code → display user_code + verification_uri via `clack.note` → poll token endpoint every 5 s with `setInterval` (cancel on `isCancel` from `clack.spinner`) → write to `~/.config/supercli/auth.json` mode 0600.

### 18.2 File upload to S3/R2

Files: `src/lib/storage.ts`, `src/commands/upload.ts`.
Pattern: read file via `Bun.file(path)`, get presigned URL from API via `lib/http`, PUT to URL, verify 200, log result.

### 18.3 Stripe payments

N/A for terminal CLI flows. If needed, open a browser to a hosted checkout URL and poll a status endpoint.

### 18.4 Push notifications

N/A — CLI process is not long-running.

### 18.5 Background jobs / cron

Pattern for self-cron: `supercli daemon` subcommand that calls a function at intervals using Bun's `setInterval`. For OS-level cron, ship `supercli install-cron` that writes to `crontab -l` on Linux/mac and `schtasks` on Windows.

### 18.6 Realtime updates

Pattern: open WebSocket via `new WebSocket(url)` in `src/lib/realtime.ts`, expose as async iterator. Use only inside long-running subcommands like `supercli watch`.

### 18.7 Search

Pattern: `src/lib/search.ts` — wrap remote search API; `src/commands/search.ts` displays results with `clack.select` for interactive picking.

### 18.8 Internationalization

Pattern: `src/i18n/{en,es,fr}.json` embedded via `with { type: "json" }`; `src/lib/i18n.ts` loads `process.env.LANG` substring; default `en`.

### 18.9 Dark mode

N/A — CLI uses ANSI; respects `NO_COLOR` env via picocolors.

### 18.10 Analytics events

Pattern: `src/lib/analytics.ts` posts JSON to a collector endpoint via `lib/http`. Disabled by default; opt-in via `supercli config set analytics true`. Required: include CLI version, OS, arch, command name; never user data.

---

## 19. Troubleshooting (top 30)

1. **`zsh: killed ./supercli`** → Bun < 1.3.13 truncated codesign on darwin-arm64. Fix: rebuild with Bun 1.3.13+.
2. **`bun: command not found`** → `~/.bun/bin` missing from PATH. Fix: add to shell rc.
3. **`error: lockfile had changes, but lockfile is frozen`** → CI ran `bun install --frozen-lockfile` after manual edit. Fix: `bun install` locally, commit `bun.lockb`.
4. **`error: Could not resolve "node:..."`** → Node-only API in Bun. Fix: replace with Bun-native or remove.
5. **`error[TS2307]: Cannot find module './foo'`** → missing `.ts` ext in import map vs. `verbatimModuleSyntax`. Fix: `tsconfig.json` `moduleResolution: "Bundler"`.
6. **Compiled binary is 240 MB** → forgot `--minify`. Fix: include `--minify --bytecode`.
7. **`brew install` fails with sha256 mismatch** → tap bump used stale checksum. Fix: re-run release workflow's dispatch step.
8. **`npm i -g supercli` succeeds but `supercli: command not found`** → `bin` field in `package.json` wrong. Fix: `"bin": { "supercli": "./bin/install.mjs" }`.
9. **`xcrun notarytool` exits with `Invalid`** → wrong cert (used Installer instead of Application). Fix: re-import correct cert.
10. **`signtool: error 0x80092004`** → cert not found. Fix: confirm Azure Trusted Signing profile name in workflow.
11. **`./supercli` runs but `which supercli` empty** → install.sh wrote to non-PATH dir. Fix: set `BIN_DIR=/usr/local/bin` or add to PATH.
12. **`@clack/prompts` interactive output garbled in CI** → no TTY. Fix: gate prompts behind `process.stdout.isTTY` and require flags in non-TTY mode.
13. **`process.exit(0)` swallows test output** → exit inside lib. Fix: throw and exit only in `src/cli.ts`.
14. **`Bun.spawn` errors `EACCES` on Linux compiled binary** → not chmod +x. Fix: install.sh runs `chmod +x` before mv.
15. **GitHub Releases asset download is HTML, not binary** → URL points to HTML page, not asset. Fix: use `releases/latest/download/<file>` not `releases/latest`.
16. **`bun build --compile` ignores `--target`** → flag spelled wrong. Fix: `--target=bun-<os>-<arch>`, dashes not underscores.
17. **`tsc --noEmit` errors but `bun run` is fine** → Bun does not type-check. Fix: add `bun run typecheck` to pre-commit.
18. **`fileParallelism: true` causes test flakes** → tests share global state. Fix: set `isolate: true`, or put shared mutation behind `vi.useFakeTimers`.
19. **Sentry SDK adds 30 MB to binary** → SDK pulled in unconditionally. Fix: dynamic `import()` behind env-flag check.
20. **`postinstall` runs even with `--ignore-scripts`** → expected. Fix: ensure wrapper degrades gracefully if no platform package present.
21. **Homebrew tap workflow uses default `GITHUB_TOKEN`** → cannot push cross-repo. Fix: PAT in `HOMEBREW_TAP_TOKEN`.
22. **`.exe` not produced for Windows target** → `--outfile dist/supercli` (no extension). Fix: append `.exe` for `bun-windows-x64`.
23. **`Bun.file().exists()` returns true on directory** → check stat type. Fix: `(await stat(path)).isFile()`.
24. **`node:os.homedir()` returns `/root` in container** → unwanted. Fix: respect `XDG_CONFIG_HOME` env first.
25. **`citty` arg parsing rejects `--no-color`** → unknown flag. Fix: declare `color: { type: "boolean", default: true }` so `--no-color` works.
26. **`pkg.json` `os` array filters out platform** → optionalDep package's `os` did not match. Fix: confirm `["darwin"]` not `["macos"]`.
27. **`supercli update` overwrites itself, then crashes** → wrote to in-use file. Fix: write to tmp, rename atomically; on Windows, write to `<exe>.new` and let next launch swap.
28. **`brew install` complains "no bottle"** → formula did not declare `bottle :unneeded`. Fix: add `bottle :unneeded` since this is a precompiled binary.
29. **`gh release create` fails "tag already exists"** → tag pushed twice. Fix: use `gh release create ... || gh release upload ...`.
30. **Workflow times out at notarization** → Apple slow. Fix: `notarytool submit ... --wait --timeout 30m` and retry once on timeout.

---

## 20. Glossary

- **Bun**: JavaScript runtime + bundler + package manager + test runner. We use it for all four.
- **Single-file executable / single binary**: one file users can run with no other dependencies. Bun produces this with `--compile`.
- **Cross-compile**: build a binary for a different OS/CPU than the build host. Bun supports it via `--target`.
- **citty**: small TypeScript-friendly library for parsing argv into commands. Pronounced "city".
- **clack / @clack/prompts**: library for terminal prompts (text, confirm, select, spinners) with consistent styling.
- **bytecode**: Bun's pre-parsed JavaScript representation. `--bytecode` makes startup faster but binary larger.
- **codesign / notarize**: macOS process that proves a binary came from an identified developer and was scanned by Apple.
- **signtool / Azure Trusted Signing**: Microsoft's process for signing Windows executables.
- **Homebrew tap**: a third-party repo `<owner>/homebrew-<name>` containing formulas. `brew install owner/name/foo` works against it.
- **Homebrew formula**: a Ruby file defining how to install a package.
- **repository_dispatch**: GitHub API endpoint for triggering a workflow in another repo from this one.
- **optionalDependencies**: npm field for deps that should install if compatible but not fail the install if not.
- **postinstall**: npm lifecycle script that runs after dependencies are installed.
- **XDG_CONFIG_HOME**: cross-OS env var for where user config goes (defaults to `~/.config`).
- **SHA256SUMS**: a file listing hashes of release artifacts so downloads can be verified.
- **OAuth device flow**: login style for terminal apps; user opens a URL on a different device and types a code.
- **glibc / musl**: two C standard libraries on Linux. Most distros use glibc; Alpine uses musl.
- **TTY**: an interactive terminal. Some prompts need it; CI does not have one.
- **Vitest**: test runner with Jest-compatible API; runs ESM natively.
- **Biome**: Rust-based linter+formatter, replaces ESLint+Prettier.
- **consola**: structured logger with levels and tags.
- **picocolors**: tiny ANSI color helper.
- **zod**: runtime schema validator that produces TypeScript types.
- **Conventional Commits**: commit message style like `feat:`, `fix:`, `chore:`.
- **Semver**: `MAJOR.MINOR.PATCH` versioning.
- **PAT (Personal Access Token)**: GitHub credential with finer scope than the default `GITHUB_TOKEN`.

---

## 21. Update Cadence

This rulebook is valid for **Bun 1.3.x**, **TypeScript 5.7.x**, **citty 0.2.x**, **Vitest 4.x**, **Biome 2.4.x**.

Re-run the generator when:
- Bun major version bump (2.x).
- citty 1.x stable (planned).
- Vitest 5.x stable.
- Apple changes notarization API.
- Microsoft changes Trusted Signing endpoint.
- New compile target added (e.g. `bun-linux-loongarch64`).
- Security advisory affecting `bun build --compile` output.

**Last updated: 2026-04-27.**
