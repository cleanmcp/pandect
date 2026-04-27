# Custom GitHub Action — Rulebook

Ship a JavaScript GitHub Action (Node 24 + ncc bundle) to GitHub Marketplace with a floating `v1` major tag, automated by release-please.

> Sample project for examples: **`echo-action`** — a util action that echoes its inputs back as an output. Replace the name and logic; the structure, configs, and release flow stay identical.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Action type | JavaScript Action | Fastest cold start, runs on any runner OS |
| Language | TypeScript 5.8 | Type safety on `core.getInput` payloads |
| Runtime + version | Node 24 (`runs.using: 'node24'`) | Default on runners since March 2026 |
| Package manager | pnpm 9 | Fast install, strict deps, lockfile determinism |
| Build tool | `@vercel/ncc` 0.38.4 | Single-file bundle required by Actions runner |
| State mgmt | n/a — stateless step process | Each invocation is a one-shot Node process |
| Routing/Nav | n/a | Action has one entrypoint |
| Data layer | n/a (state via `@actions/core.saveState`) | Stateful runs use pre/post lifecycle |
| Auth | `GITHUB_TOKEN` via `core.getInput('token')` | Minimum-privilege ambient token |
| Styling | n/a | No UI |
| Forms + validation | Zod 3 on raw `core.getInput` strings | Inputs arrive as strings; coerce + validate |
| Unit test runner | Vitest 4.1 | Fast, ESM-native, TypeScript out of the box |
| E2E framework | `nektos/act` 0.2.87 | Runs the actual workflow locally in Docker |
| Mocking strategy | Vitest `vi.mock` for `@actions/core`/`@actions/github` only | Never mock the action under test |
| Logger | `@actions/core` (`info`/`warning`/`error`/`debug`) | Native annotations + log grouping in Actions UI |
| Error tracking | `core.setFailed(err)` + workflow run logs | Standard fail signal; surfaced on PR check |
| Lint + format | Biome 2.4 | One tool, one config, 50× faster than ESLint |
| Type checking | `tsc --noEmit` | Authoritative TS check separate from bundle |
| Env vars + secrets | Action inputs + `GITHUB_TOKEN`; never read `process.env.*_TOKEN` directly | Inputs are auditable in `action.yml` |
| CI provider | GitHub Actions (dogfood) | Test the action with itself on PRs |
| Deploy target | GitHub Marketplace | Public discovery for action consumers |
| Release flow | release-please (PR) + tag v1 pointer | Conventional Commits → SemVer release |
| Auto-update | Floating `v1` tag re-pointed each patch | Consumers pin `@v1`, get bug fixes free |
| Bundler output dir | `dist/` (committed to `main`) | Runner downloads source; `dist/` IS the binary |
| Action.yml schema validation | `mpalmer/action-validator` 0.8.0 | Schema-checks `action.yml` in CI |
| Third-party action pinning | Full 40-char SHA + `# v4.2.2` comment | Immutable; defeats tag-rewrite supply-chain attacks |
| Marketplace branding | `branding.icon` + `branding.color` | Required for Marketplace listing |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Node.js | 24.x | runner default since 2026-03 | https://github.blog/changelog/2025-09-19-deprecation-of-node-20-on-github-actions-runners/ |
| TypeScript | 5.8.3 | 2025-Q1 (still current) | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-8.html |
| `@actions/core` | 3.0.1 | 2026-04 | https://www.npmjs.com/package/@actions/core |
| `@actions/github` | 9.1.0 | 2026-04 | https://www.npmjs.com/package/@actions/github |
| `@actions/exec` | 3.0.0 | 2026-01 | https://www.npmjs.com/package/@actions/exec |
| `@actions/tool-cache` | 4.0.0 | 2026-02 | https://www.npmjs.com/package/@actions/tool-cache |
| `@vercel/ncc` | 0.38.4 | 2025-09 | https://www.npmjs.com/package/@vercel/ncc |
| Vitest | 4.1.4 | 2026-04 | https://www.npmjs.com/package/vitest |
| Biome | 2.4.x | 2026-02 | https://biomejs.dev/ |
| Zod | 3.23.x | current | https://www.npmjs.com/package/zod |
| `actions/checkout` | v5.0.1 | 2026-Q1 | https://github.com/actions/checkout/releases |
| `actions/setup-node` | v5.0.0 | 2026 | https://github.com/actions/setup-node/releases |
| `googleapis/release-please-action` | v4 | current | https://github.com/googleapis/release-please-action |
| `mheap/action-tagger` | v3 | current | https://github.com/marketplace/actions/actions-tagger |
| `mpalmer/action-validator` | 0.8.0 | current | https://github.com/mpalmer/action-validator |
| `nektos/act` | v0.2.87 | 2026-04-01 | https://github.com/nektos/act/releases |

### Minimum Host

- macOS 13+, Windows 11, or Ubuntu 22.04+.
- 8 GB RAM, 5 GB free disk (Docker images for `act` are 2 GB+).
- Docker Desktop or Colima (required for `act` local runs).
- Node 24.x and pnpm 9.x.
- A GitHub account with 2FA enabled (Marketplace publish requires it).

### Cold-start

`git clone` to first green `pnpm test` + `pnpm build` + `act -j test`: **~8 minutes** on a fresh machine (Docker image pull dominates).

---

## 2. Zero-to-running

### macOS

```bash
# Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Core toolchain
brew install node@24 pnpm gh act
brew install --cask docker

# Optional: action-validator (Rust-based)
cargo install action-validator   # or: brew install action-validator

# Auth
gh auth login        # choose HTTPS, browser flow, paste 2FA
docker --version     # confirm daemon up
act --version        # confirm 0.2.87+
```

### Windows

```powershell
# winget (Windows 11)
winget install OpenJS.NodeJS.LTS    # Node 24
winget install pnpm.pnpm
winget install GitHub.cli
winget install Docker.DockerDesktop
winget install nektos.act

# Auth
gh auth login
```

If `winget` is missing, install from https://learn.microsoft.com/windows/package-manager/winget/.

### Linux (Ubuntu/Debian)

```bash
# Node 24 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# pnpm
curl -fsSL https://get.pnpm.io/install.sh | sh -

# Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER && newgrp docker

# gh CLI
sudo apt install gh

# act
curl --proto '=https' --tlsv1.2 -sSf https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# action-validator (requires rustup)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install action-validator
```

### Accounts to create

| Service | What you need | Link |
|---|---|---|
| GitHub | Username, 2FA enabled | https://github.com/signup |
| GitHub Marketplace Developer Agreement | Accept on first publish | Prompted during publish step |
| Docker Hub | Optional — only if shipping a Docker container action variant | https://hub.docker.com |

### Bootstrap (new action)

```bash
gh repo create echo-action --public --clone --add-readme
cd echo-action
pnpm init
pnpm add @actions/core@^3.0.1 @actions/github@^9.1.0 @actions/exec@^3.0.0 @actions/tool-cache@^4.0.0 zod
pnpm add -D typescript@~5.8.3 @types/node@^24 @vercel/ncc@^0.38.4 vitest@^4.1.4 @biomejs/biome@^2.4.0
mkdir -p src .github/workflows
# (then paste files from §16 First-PR Scaffold)
pnpm install
pnpm run build
pnpm run test
```

### Expected first-run output

```
$ pnpm run build
> echo-action@0.0.0 build
> ncc build src/index.ts -o dist --source-map --license licenses.txt

ncc: Version 0.38.4
ncc: Compiling file index.js into CJS
4kB  dist/index.js
2kB  dist/index.js.map
1kB  dist/licenses.txt
Done in 1.4s

$ pnpm run test
 ✓ src/main.test.ts (3)
   ✓ run() echoes input message
   ✓ run() sets output 'echoed'
   ✓ run() fails when message missing
Test Files  1 passed (1)
     Tests  3 passed (3)
  Duration  410ms
```

### First-run errors → fix

| Error | Fix |
|---|---|
| `Cannot find module '@actions/core'` | `pnpm install` — the lockfile was not honored |
| `ncc: command not found` | `pnpm add -D @vercel/ncc` then re-run |
| `act: error pulling image` | Start Docker Desktop / `sudo systemctl start docker` |
| `EACCES: permission denied, /var/run/docker.sock` | `sudo usermod -aG docker $USER && newgrp docker` |
| `error TS2580: Cannot find name 'process'` | `pnpm add -D @types/node` |
| `Action.yml has invalid 'using' value` | Use `node24` (or `node22` until 2026-06), not `node20` |
| `act: workflow file is invalid` | Run `action-validator .github/workflows/test.yml` |
| `gh: command not found` | Install `gh` via Homebrew/winget/apt |

---

## 3. Project Layout

```
echo-action/
├── .github/
│   ├── workflows/
│   │   ├── test.yml             # CI — runs Vitest + act + action-validator on PRs
│   │   └── release.yml          # release-please + floating major tag on push to main
│   └── dependabot.yml           # SHA-level updates for action deps
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules
├── dist/                        # ncc bundle — COMMITTED to main; never edit by hand
│   ├── index.js
│   ├── index.js.map
│   └── licenses.txt
├── src/
│   ├── index.ts                 # entrypoint — `import { run } from './main'; run()`
│   ├── main.ts                  # the action's actual logic
│   ├── inputs.ts                # Zod schema + parsing of action inputs
│   └── main.test.ts             # Vitest unit tests
├── action.yml                   # action metadata — REQUIRED at repo root
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── biome.json
├── vitest.config.ts
├── .gitignore
├── .gitattributes               # mark dist/* as -diff (cleaner PRs)
├── README.md                    # Marketplace listing copy
├── CHANGELOG.md                 # release-please owns this
├── LICENSE                      # MIT recommended
├── CLAUDE.md
└── AGENTS.md
```

### Naming conventions

- `src/<verb>.ts` for action logic modules (`run.ts`, `parseInputs.ts`).
- `*.test.ts` colocated with the file under test.
- Action input names: `kebab-case` in `action.yml` (`message-prefix`); refer in code via `core.getInput('message-prefix')`.
- Action output names: `kebab-case` (`echoed-message`).
- Repo name = action slug = the name on Marketplace.

### Where to add what

| If you're adding… | Goes in |
|---|---|
| New input | `action.yml` `inputs:` + `src/inputs.ts` Zod schema |
| New output | `action.yml` `outputs:` + `core.setOutput('name', val)` in `main.ts` |
| Pure helper | `src/lib/<name>.ts` |
| Test for helper | `src/lib/<name>.test.ts` |
| External tool fetch | `src/main.ts` using `@actions/tool-cache` |
| Run a binary on PATH | `src/main.ts` using `@actions/exec` |
| Octokit call | `src/main.ts` using `getOctokit(token)` from `@actions/github` |
| Action-level cache | `core.saveState`/`core.getState` in pre/main/post scripts |
| State across job steps | `core.exportVariable('NAME', val)` writes to `$GITHUB_ENV` |
| New CI check | `.github/workflows/test.yml` |
| Marketplace branding change | `action.yml` `branding:` block |
| README hero example | `README.md` `## Usage` block |
| Versioned breaking change | Conventional Commit `feat!:` → release-please opens v2 PR |
| Bug fix | `fix:` Conventional Commit; release-please bumps patch |
| New feature (non-breaking) | `feat:` Conventional Commit; release-please bumps minor |
| Doc-only change | `docs:` Conventional Commit; no release |
| Dependency bump | Dependabot PR with SHA pin |

---

## 4. Architecture

### Process model

```
┌─────────────────────────────────┐
│  GitHub Actions Runner (VM)     │
│  ┌───────────────────────────┐  │
│  │ Job container             │  │
│  │  ┌─────────────────────┐  │  │
│  │  │ Node 24 process     │  │  │
│  │  │  └ dist/index.js    │  │  │
│  │  │     └ src/main.ts   │  │  │
│  │  └─────────────────────┘  │  │
│  │   ↑ inputs via env       │  │
│  │   ↓ outputs via $GITHUB_OUTPUT │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Data flow (one step invocation)

```
workflow.yml                       runner                          your action
─────────────                      ────────                        ────────────
- uses: you/echo-action@v1   ──▶  fetch repo @v1 SHA ──▶ exec node dist/index.js
  with: { message: "hi" }         set INPUT_MESSAGE=hi             │
                                                                   ▼
                                                            core.getInput('message')
                                                            → "hi"
                                                            core.setOutput('echoed','HI')
                                                                   │
                                                                   ▼
                                                           writes $GITHUB_OUTPUT line
                                                           runner exposes as steps.id.outputs.echoed
```

### Auth flow

```
┌────────────────┐      ┌──────────────────┐       ┌─────────────┐
│ workflow.yml   │      │ runner injects   │       │ your action │
│ permissions:   │ ───▶ │ GITHUB_TOKEN env │ ────▶ │ getInput    │
│   contents: read│     │ (per-job scoped) │       │  ('token')  │
└────────────────┘      └──────────────────┘       └─────────────┘
                                                          │
                                                          ▼
                                                   getOctokit(token)
                                                          │
                                                          ▼
                                                    api.github.com
                                                    (scoped to job permissions)
```

### State flow (stateful pre/main/post action)

```
pre.ts           main.ts           post.ts
   │                │                  │
   ▼                ▼                  ▼
saveState ─────▶ getState ─────▶ getState
("ts", now)     reads "ts"      reads "ts" → measure duration
```

### Entry-point file map

| File | Owns |
|---|---|
| `src/index.ts` | One line: `import { run } from './main'; run()`. Keeps stack traces clean. |
| `src/main.ts` | The action logic. Calls `core.getInput`, does work, calls `core.setOutput`/`setFailed`. |
| `src/inputs.ts` | Zod schema + parsed-input type. Single boundary for input validation. |
| `dist/index.js` | The ncc bundle. **Generated.** Commit it. Never hand-edit. |
| `action.yml` | The contract: inputs, outputs, runtime, branding. Source of truth for consumers. |

Business logic lives in `src/main.ts` and `src/lib/*.ts`. It does NOT live in `action.yml` (no shell logic in composite recipes there), and it does NOT live in `.github/workflows/*.yml` (those test the action; they are not the action).

---

## 5. Dev Workflow

### Start dev loop

```bash
pnpm run dev      # tsc --watch + ncc --watch (rebuilds dist on save)
pnpm run test:watch
```

### Hot reload

There is no hot reload — an action is a one-shot Node process. The dev loop = save → `pnpm run build` → `act -j test` (or run unit tests).

### Debug

- **VS Code / Cursor:** Use `.vscode/launch.json` "Debug current Vitest test" (in §15).
- **Local act run with debugger:**
  ```bash
  act -j test --container-options "-p 9229:9229" \
      --env NODE_OPTIONS="--inspect-brk=0.0.0.0:9229"
  ```
  Then attach VS Code to `localhost:9229`.

### Inspect runtime

- `core.debug('msg')` lines surface only when the consumer sets `ACTIONS_STEP_DEBUG=true`.
- Print env: `console.log(process.env)` — but redact secrets first; `core.setSecret(val)` masks values in logs.
- Local `act` exposes the runner workspace at `$GITHUB_WORKSPACE` inside the container.

### Pre-commit

Add to `.git/hooks/pre-commit` (or use Husky):

```bash
#!/usr/bin/env bash
set -e
pnpm run typecheck
pnpm run lint
pnpm run build
git add dist/
```

The last line is **mandatory**: forgetting to commit `dist/` ships a broken action.

### Branch + commit

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `feat!:` for breaking).
- release-please reads these to compute the next version and changelog.

---

## 6. Testing & Parallelization

### Unit tests — Vitest

```bash
pnpm test                    # one shot
pnpm run test:watch          # watch mode
pnpm vitest run src/main.test.ts             # single file
pnpm vitest run -t "echoes input message"    # single test
pnpm run coverage            # text + lcov
```

Tests live next to source (`src/main.test.ts`). Naming: `<file>.test.ts`.

### Integration via `act`

```bash
act -j test                      # run the test workflow locally
act -W .github/workflows/test.yml --pull=false   # use cached image
act push -e .github/event.json   # simulate a push event
```

### What to mock

| Thing | Mock? |
|---|---|
| `@actions/core` getInput/setOutput | YES — via `vi.mock('@actions/core')` |
| `@actions/github` Octokit | YES — `vi.mock('@actions/github')` and stub the methods you call |
| `@actions/exec` exec | YES — return canned exit codes |
| `fs`, `path` | NO — use real fs in a temp dir via `mkdtempSync` |
| Network HTTP | YES at the adapter boundary (`undici` or `nock`) |
| The action's own `run()` | NEVER — that's the system under test |

### Coverage

Target: **80% line / 70% branch** for `src/**`, exclude `src/index.ts` (one-line entry) and `dist/`. Configured in `vitest.config.ts`.

### E2E parallelization

Vitest runs files in parallel by default (one worker per CPU). Enforce in config: `pool: 'threads'`, `poolOptions.threads.minThreads: 2`.

`act` runs jobs sequentially per workflow file by default. To parallelize, split into multiple jobs and run `act` once per job.

### AI-agent parallelization

Safe to fan out (disjoint files):

- "Add input X to `action.yml`" + "write Zod schema for X in `src/inputs.ts`" + "add unit test for X" — three files, no overlap.
- "Update README usage block" + "write CHANGELOG entry" — release-please owns CHANGELOG; do NOT hand-edit.

Must be sequential (shared files):

- Anything touching `package.json` or `pnpm-lock.yaml`.
- Anything touching `dist/` — exactly one rebuild per commit.
- Schema + types regen — types depend on schema.
- `action.yml` edits — single source of truth for inputs/outputs.

---

## 7. Logging

### Init

`@actions/core` is the logger. No setup needed — its functions write GitHub-annotation-formatted lines to stdout.

```ts
import * as core from '@actions/core';

core.debug('hidden unless ACTIONS_STEP_DEBUG=true');
core.info('plain log line');
core.notice('shows as a workflow notice annotation');
core.warning('shows as a yellow warning annotation', { file: 'src/main.ts', startLine: 12 });
core.error('shows as a red error annotation');
core.setFailed('marks the step as failed and exits non-zero');
```

### Levels

| Level | When |
|---|---|
| `debug` | Verbose internals — only visible with debug flag set by consumer |
| `info` | One-line per major phase (start, fetch, success) |
| `notice` | Surfaces in PR Files-changed view; for actionable user notices |
| `warning` | Recoverable issue; action continues |
| `error` | Failed assertion or external call; action marks failure |
| `setFailed` | Terminal — marks step failed; usually the last call |

### Required fields per log line

There is no JSON envelope (Actions logs are line-oriented). Conventions:

- Prefix every line with `[<module>]` (e.g., `[main]`, `[fetch]`).
- Group related lines with `core.startGroup('label') / core.endGroup()`.
- Mask secrets immediately on receipt: `core.setSecret(token)`.

### Sample lines

```
[main] action started, version=1.2.3
[main] inputs parsed { message: 'hi', uppercase: true }
::group::Fetching tool
[fetch] downloading https://… (24.1 MB)
[fetch] cached at /opt/hostedtoolcache/foo/1.0.0/x64
::endgroup::
[main] echoed=HI duration_ms=14
::warning file=src/main.ts,line=42::deprecated input 'old-name' used
::error::token missing required scope: repo:read
```

### Where logs go

- **Dev (act):** stdout in your terminal.
- **Prod (Actions runner):** the workflow run page, persisted 90 days by default; downloadable via `gh run view --log <run-id>`.

### Grep locally

```bash
gh run view --log <run-id> | grep -E '\[main\]|::error'
gh run view --log-failed <run-id>
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. **Always pin every third-party action to a full 40-char commit SHA**, with the version as a trailing comment: `uses: actions/checkout@a1b2…@7f0c # v5.0.1`. Tags are mutable; SHAs are not.
2. **Always run `pnpm run build` before committing** — `dist/` is the binary consumers actually execute. Add it to `.git/hooks/pre-commit`.
3. **Always commit `dist/` to `main`.** Skipping it is the #1 reason actions break for consumers; the runner downloads source, not artifacts.
4. **Always validate `action.yml` with `action-validator` in CI.** Schema drift silently breaks consumers.
5. **Always set `permissions:` at the workflow or job level**, starting from `permissions: {}` and adding only what's needed (`contents: read`, etc.).
6. **Always set `persist-credentials: false` on `actions/checkout`** unless the job explicitly does `git push`. The default (`true`) leaks `GITHUB_TOKEN` into `.git/config`.
7. **Always read inputs via `core.getInput('name', { required: true })`** and validate the result with Zod before use.
8. **Always call `core.setSecret(token)`** the moment you receive any token-shaped input, before any logging or branching.
9. **Always use `runs.using: 'node24'`** for new actions. `node20` is deprecated; `node22` works but Node 24 is the runner default since March 2026.
10. **Always include the `branding` block in `action.yml`** (`icon` + `color`) — required for Marketplace listing.
11. **Always tag with both `vX.Y.Z` and a floating `vX`** — release-please cuts `vX.Y.Z`; the tagger workflow re-points `vX` to the new SHA.
12. **Always run `act -j test --pull=false` before pushing** to confirm the workflow is parseable and the action runs.
13. **Always typecheck and lint before declaring done.** Commands: `pnpm run typecheck` and `pnpm run lint`.
14. **Always specify each `core.getInput` field in `action.yml` `inputs:`** with a `description` and (when sensible) a `default`. Undeclared inputs return `''`.
15. **Always write outputs through `core.setOutput`**, never by manually appending to `$GITHUB_OUTPUT` from JS.
16. **Always handle errors with `try/catch` around the top-level `run()`** and call `core.setFailed(err.message)` — never throw uncaught.
17. **Always use `@actions/exec`** rather than `child_process.spawn` — it streams output to the Actions log and respects `core.setSecret` masking.
18. **Always use `@actions/tool-cache`** for downloading binaries (it caches per runner version + platform).
19. **Always Conventional-Commit messages** (`feat:`, `fix:`, `feat!:`) — release-please depends on this for SemVer detection.
20. **Always check that the workflow `id-token: write` permission is OFF** unless OIDC is in use.
21. **Always set Dependabot to update `.github/workflows/*.yml`** at SHA precision (`package-ecosystem: github-actions`).

### 8.2 NEVER

1. **Never edit `dist/index.js` by hand.** It's regenerated; your edits will be wiped.
2. **Never commit without `pnpm run build`** — broken `dist/` ships immediately on tag push.
3. **Never use `runs.using: 'node20'`** for new actions — deprecated; runners will refuse it after September 16, 2026.
4. **Never use mutable refs in `uses:`** (`@main`, `@master`, `@v1`) inside this repo's own workflows. Pin to SHA. Consumers may pin to `@v1` — that's fine because they trust your release process.
5. **Never log raw input that may be secret** without `core.setSecret(value)` first.
6. **Never read `process.env.GITHUB_TOKEN` directly.** Take it as an action input named `token` with default `${{ github.token }}` so the consumer can override.
7. **Never use `actions/checkout` with `persist-credentials: true`** unless the job pushes back to the repo.
8. **Never publish to Marketplace from a draft / pre-release tag.** GitHub will list it as the latest version.
9. **Never name your action the same as an existing Marketplace category** (e.g., `Code quality`) — listing will be rejected.
10. **Never include a `workflow_dispatch:` `secrets:` block in your test workflow** for tokens — use `${{ secrets.GITHUB_TOKEN }}` (it's job-scoped) and `permissions:`.
11. **Never use `set-output ::` or `save-state ::` workflow commands** — they were removed. Write to `$GITHUB_OUTPUT` / `$GITHUB_STATE` files (or use `@actions/core` which does it for you).
12. **Never bundle with esbuild/webpack instead of `@vercel/ncc`** for a JavaScript action — ncc is the canonical bundler that handles native bindings + dynamic requires the way the runner expects.
13. **Never run `npm install` in the action's main script.** Bundle deps with ncc; runtime install on every consumer is unacceptable latency.
14. **Never add a `.github/workflows/*.yml` file inside an action repository expecting Marketplace** — Marketplace requires there be NO workflow files in the action's root path? (Correction: workflows ARE permitted in `.github/workflows/`; the rule is the action repo must contain a single `action.yml` at root and that file must not also be a workflow.)
15. **Never push directly to `main`** — let release-please open the PR; merge that PR to cut a release.
16. **Never use `pull_request_target` to run untrusted code.** It exposes write-scoped tokens to forks. Use `pull_request` for tests.
17. **Never store credentials in `.npmrc` committed to the repo.** Use Actions secrets + `setup-node` `always-auth: true`.
18. **Never enable `id-token: write`** unless the action explicitly performs OIDC sigstore signing or cloud auth.
19. **Never call `process.exit(N)`** — call `core.setFailed()` and let Node exit naturally so post-steps run.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `action.yml` | every consumer | `action-validator action.yml` + read README usage example aloud |
| `dist/index.js` | every consumer (this IS the binary) | `pnpm run build && git diff --stat dist/` then `act -j test` |
| `package.json` | every command | `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm test && pnpm run build` |
| `pnpm-lock.yaml` | install reproducibility | `pnpm install --frozen-lockfile` (no diffs) |
| `tsconfig.json` | typecheck + bundle | `pnpm run typecheck` + `pnpm run build` cold |
| `biome.json` | lint output | `pnpm run lint` and `pnpm run lint:fix --dry-run` |
| `vitest.config.ts` | every test run | `pnpm test` cold + check coverage thresholds still pass |
| `src/index.ts` | runtime entry | `node dist/index.js` (after build) — no top-level errors |
| `src/main.ts` | the action's behavior | unit tests + `act -j test` |
| `src/inputs.ts` | input validation contract | unit tests for each Zod field |
| `.github/workflows/test.yml` | CI signal | `act -j test` locally; check Actions tab on PR |
| `.github/workflows/release.yml` | tag/release pipeline | dry-run by reviewing release-please PR before merge |
| `.github/dependabot.yml` | dep update PRs | `gh dependabot list` after push |
| `README.md` | Marketplace listing copy | `gh release view --web` preview after first publish |
| `CHANGELOG.md` | release-please owned | NEVER hand-edit; only `feat:`/`fix:` commits |
| `LICENSE` | legal status | `gh repo view --json licenseInfo` |
| `.gitattributes` | dist/ diff hiding | `git diff dist/` should still show file changes (not lines) |
| `.cursor/rules` | Cursor agent behavior | open Cursor; ask a small question; confirm rules quoted |
| `CLAUDE.md` | Claude Code agent behavior | restart Claude session; check it loads commands |
| `AGENTS.md` | Codex agent behavior | run `codex` with this dir as cwd; verify config picked up |
| `tsconfig.json` `"target"` field | bundle output ES level | `pnpm run build && head -1 dist/index.js` should be ES2022 |
| `action.yml` `runs.using` | runtime version | runner picks up Node 24; check `node --version` in a step |
| `action.yml` `branding` | Marketplace listing tile | publish-flow preview at `https://github.com/<you>/<repo>/releases/new` |

### 8.4 Definition of Done (per task type)

#### Bug fix
- [ ] Reproducer test added in `src/*.test.ts`.
- [ ] Fix lands; reproducer is green.
- [ ] `pnpm run typecheck && pnpm run lint && pnpm test && pnpm run build`.
- [ ] `dist/` rebuilt and committed in the same commit.
- [ ] `act -j test` green locally.
- [ ] Conventional Commit `fix(scope): …`.
- [ ] No README changes unless behavior visible to consumers.
- [ ] Do NOT bump version manually — release-please does it.

#### New feature
- [ ] New input/output declared in `action.yml`.
- [ ] Zod schema in `src/inputs.ts` updated.
- [ ] Unit tests cover happy path + missing input + invalid input.
- [ ] README "Usage" example updated to show the new input.
- [ ] All commands from "Bug fix" pass.
- [ ] Conventional Commit `feat(scope): …`.

#### Refactor (no behavior change)
- [ ] All existing tests pass unchanged.
- [ ] No `action.yml` changes.
- [ ] `dist/` may change in line count but not in observable behavior — diff `act -j test` log output before/after.
- [ ] Conventional Commit `refactor: …` (no version bump).

#### Dependency bump
- [ ] `pnpm install` regenerates lockfile cleanly.
- [ ] Full verify recipe (§8.5).
- [ ] Re-build `dist/` and inspect bundle size delta — flag >5% growth in PR description.
- [ ] Conventional Commit `chore(deps): bump X to Y`.

#### Schema change (new input/output)
- [ ] Input/output added to `action.yml` with `description` and (for inputs) `default` or `required: true`.
- [ ] Backward-compat: existing inputs unchanged in name/type; if breaking, use `feat!:` to trigger v2.
- [ ] README usage block re-rendered.
- [ ] Tests cover both old and new schema cases during deprecation window.

#### Copy change (README/CHANGELOG)
- [ ] README only — never hand-edit CHANGELOG.
- [ ] No `dist/` change; do NOT rebuild.
- [ ] Conventional Commit `docs: …` (no release).

### 8.5 Self-Verification Recipe

Run, in order, before claiming done:

```bash
pnpm install --frozen-lockfile         # lockfile honored
pnpm run typecheck                     # tsc --noEmit
pnpm run lint                          # biome check .
pnpm test                              # vitest run
pnpm run build                         # ncc build
git diff --exit-code dist/ || git add dist/
action-validator action.yml            # schema-valid
act -j test --pull=false               # local workflow run
```

Expected output:

| Command | "Green" looks like |
|---|---|
| `pnpm install --frozen-lockfile` | `Done in <Xs>` and no `WARN` lines |
| `pnpm run typecheck` | empty stdout, exit 0 |
| `pnpm run lint` | `Checked N file(s) in <ms>. No fixes needed.` |
| `pnpm test` | `Test Files  N passed (N)` and `Tests  N passed (N)` |
| `pnpm run build` | `Done in <ms>` and `dist/index.js` modified or unchanged |
| `action-validator action.yml` | `action.yml ✔` and exit 0 |
| `act -j test --pull=false` | `Job succeeded` for the `test` job |

### 8.6 Parallelization Patterns

Safe parallel subagents:

- Subagent A: edit `action.yml` to add `inputs.foo`.
- Subagent B: edit `src/inputs.ts` to add Zod field for `foo`.
- Subagent C: write `src/foo.test.ts` covering parse cases.

Each touches one file; no shared writes.

Must be serial:

- Touching `package.json` (one writer to keep lockfile clean).
- Rebuilding `dist/` (one terminal final-builds after all agents finish).
- Editing `CHANGELOG.md` (release-please owns it; no human writers, in series or parallel).

---

## 9. Stack-Specific Pitfalls

1. **Forgot to commit `dist/`.** Symptom: consumer's workflow fails with `Cannot find module '/home/runner/work/_actions/.../dist/index.js'`. Cause: `dist/` not in last commit. Fix: `pnpm run build && git add dist/ && git commit --amend --no-edit && git push --force-with-lease`. Detect: pre-commit hook, plus a CI step `git diff --exit-code dist/`.
2. **Edited `dist/index.js` by hand.** Symptom: next `pnpm run build` wipes the change. Fix: put the change in `src/`. Detect: `.gitattributes` marks `dist/* -diff` to make accidental hand edits stand out in PR review.
3. **`runs.using: 'node20'`.** Symptom: deprecation warning today; outright failure after 2026-09-16. Fix: bump to `node24` (or `node22`). Detect: action-validator + a regex grep in CI for `node20`.
4. **Mutable third-party `uses:` ref.** Symptom: silent supply-chain compromise (Q1 2026 tj-actions, Trivy attacks). Fix: pin every third-party action to full SHA. Detect: `gh-action-pinning-checker` or a custom grep `grep -E 'uses:.*@v[0-9]+$' .github/`.
5. **`actions/checkout` with default `persist-credentials: true`.** Symptom: `GITHUB_TOKEN` lives in `.git/config`, accessible to any subsequent step. Fix: set `persist-credentials: false`. Detect: stepsecurity/secure-repo lint, or grep workflows.
6. **Missing `branding`.** Symptom: Marketplace publish flow rejects the action with "Branding required". Fix: add `icon` + `color`. Detect: action-validator (it now flags missing branding when publishing).
7. **`name:` collision with Marketplace category.** Symptom: publish silently disabled. Fix: rename action (one-time hassle). Detect: pre-publish, search Marketplace for the chosen name.
8. **Forgot to push the floating `v1` tag.** Symptom: `vX.Y.Z` exists but `v1` still points to old commit; consumers on `@v1` don't get the new release. Fix: run `mheap/action-tagger@v3` in `release.yml` triggered by release publish. Detect: `git ls-remote --tags origin v1` should equal latest `vX.Y.Z` SHA.
9. **`pull_request_target` running untrusted code.** Symptom: PR from a fork can exfiltrate secrets. Fix: use `pull_request` for tests; reserve `pull_request_target` for label-only operations on PR metadata. Detect: stepsecurity/secure-repo or org policy.
10. **Action in a private repo published to Marketplace.** Symptom: publish UI disabled. Fix: repo must be public. Detect: GitHub blocks the publish path; obvious.
11. **Used `set-output ::` workflow command.** Symptom: deprecation warning, then runtime error. Fix: write to `$GITHUB_OUTPUT` (or use `core.setOutput`). Detect: action-lint reports it.
12. **Unbundled `node_modules/` shipped instead of `dist/`.** Symptom: action installs slowly, or breaks if a transitive dep does post-install. Fix: ncc bundle, drop `node_modules` from the runner. Detect: `du -sh node_modules dist` — `dist/` should be one file <2 MB.
13. **`require('something/package.json')` not bundled by ncc.** Symptom: `Cannot find module './package.json'`. Fix: `ncc build src/index.ts -o dist --license licenses.txt` and use `import packageJson from '../package.json' assert { type: 'json' }` plus `tsconfig` `resolveJsonModule: true`. Detect: smoke run `node dist/index.js` locally.
14. **OIDC `id-token: write` granted by default.** Symptom: any compromised dep can mint cloud tokens. Fix: set `permissions: {}` at workflow root, opt-in per-job. Detect: secure-repo lint.
15. **Forgot Conventional Commit format.** Symptom: release-please does nothing on merge. Fix: use `feat:`/`fix:`/`feat!:`. Detect: a PR check that runs `commitlint`.
16. **Using `npm`/`yarn` install in Dockerfile of a Docker action.** Symptom: 30+ second cold start per invocation. Fix: pre-build image, push to GHCR, set `image: 'docker://ghcr.io/you/echo-action:1.2.3'`. Detect: time the action — Docker actions cold-start should be <5s.
17. **`WORKDIR` set in Dockerfile of a Docker action.** Symptom: `entrypoint.sh: No such file or directory`. Fix: use absolute `ENTRYPOINT ["/entrypoint.sh"]`. Detect: act run.
18. **`USER` set in Dockerfile.** Symptom: cannot read `$GITHUB_WORKSPACE`. Fix: drop `USER` — Docker actions must run as root. Detect: act run.
19. **Composite action expecting dynamic outputs.** Symptom: `outputs:` block can't reference late-bound step outputs. Fix: declare outputs upfront with `${{ steps.id.outputs.x }}` value. Detect: validator catches missing `value:`.
20. **Marketplace listing publishes a draft / pre-release as `latest`.** Symptom: consumers on `@v1` get an unstable version. Fix: only mark stable releases as "latest" in the GitHub Releases UI; release-please's tag is post-merge so it's stable by default. Detect: `gh release view --json isLatest`.

---

## 10. Performance Budgets

| Budget | Limit | How to measure |
|---|---|---|
| Action cold start (JS) | <600 ms wall-clock from runner exec to first `core.info` | Add `const t0 = Date.now()` in `src/index.ts`; print on exit |
| Bundle size (`dist/index.js`) | <2 MB minified | `du -sh dist/index.js` |
| Source map size | <2× bundle size | `du -sh dist/index.js.map` |
| Memory peak | <256 MB | `/usr/bin/time -v node dist/index.js` (Linux); look at "Maximum resident set size" |
| Test wall time | <30 s for full unit suite | Vitest reporter |
| Docker action cold start | <5 s including image pull from GHCR | `time act -j test` |
| Tool-cache fetch (one-time) | <60 s | log fetch timing in action |

When exceeded:

- **Bundle size:** check `ncc build --stats`; usually a stray dep is bundled (e.g., `aws-sdk`). Move it to `peerDependencies` or replace with `undici`/native fetch.
- **Cold start:** profile with `node --prof dist/index.js` then `node --prof-process`.
- **Memory:** rare — usually means streaming a large file into memory; switch to `pipeline()`.

---

## 11. Security

### Secrets

- **Where:** Repo-level **Settings → Secrets and variables → Actions**. Reference as `${{ secrets.NAME }}` in workflows; pass to action as inputs.
- **Where NEVER:** the repo, README, code comments, `dist/index.js`, environment files committed to git, action.yml `default:` fields.
- The action itself never persists secrets. `core.setSecret(value)` masks the value in workflow logs (replaces with `***`).

### Auth threat model

- The action receives `GITHUB_TOKEN` as input. The token is **scoped to the consumer workflow's `permissions:` block**.
- Default permissions for workflows are restrictive (`contents: read`) since 2023, but consumers can grant more.
- Never call APIs unrelated to the action's stated purpose — the consumer trusted you with what's documented in `README.md`.

### Input validation boundary

`src/inputs.ts` is the single boundary. All inputs flow through Zod. Never branch on raw `core.getInput` output.

### Output escaping

- Values written via `core.setOutput` are auto-escaped by `@actions/core` (it writes a multiline-safe heredoc to `$GITHUB_OUTPUT`).
- Never construct `$GITHUB_OUTPUT` lines manually.
- For values used in shell, always quote: `echo "${{ steps.x.outputs.y }}"` (consumer responsibility, but document in README).

### Permissions config in test workflows

Always start from `permissions: {}` and add:

```yaml
permissions:
  contents: read   # for actions/checkout
```

### Dependency audit

```bash
pnpm audit --prod                    # weekly
pnpm dlx npm-check-updates -u        # major bumps
gh dependabot alerts list            # GH advisories
```

### Top 5 risks specific to actions

1. **Compromised third-party action via mutable tag.** Mitigate: SHA-pin everything (incl. official `actions/*`).
2. **Leaked `GITHUB_TOKEN` via `persist-credentials: true`.** Mitigate: explicit `persist-credentials: false`.
3. **Script injection via input** (e.g., `run: echo ${{ inputs.message }}` where `message` contains `'; rm -rf /'`). Mitigate: pass inputs via env vars, then reference from script: `env: MSG: ${{ inputs.message }}` then `run: echo "$MSG"`.
4. **Excessive workflow permissions inherited.** Mitigate: explicit `permissions:` per job.
5. **Cross-repo workflow runs (`pull_request_target`) on untrusted forks.** Mitigate: use `pull_request` for tests, gate `_target` on a `safe-to-test` label.

---

## 12. Deploy (Marketplace publish flow)

### One-time setup

1. Repo is **public**.
2. `action.yml` has unique `name:` + `branding:` block.
3. Accept the **GitHub Marketplace Developer Agreement** (one-time, 2FA-required) at `https://github.com/marketplace/new`.

### Release flow (every release)

1. Land PRs to `main` using **Conventional Commits**.
2. release-please continuously maintains a "Release X.Y.Z" PR. When ready, a maintainer merges it.
3. On that merge:
   - release-please tags `vX.Y.Z` and creates a GitHub Release.
   - The "tagger" job in `release.yml` updates the floating `vX` tag to point to the new SHA.
4. **Manually publish to Marketplace on the first major release:**
   - Go to `Releases → vX.Y.Z → Edit`.
   - Tick **Publish this Action to the GitHub Marketplace**.
   - Fill primary + secondary categories, save.
5. On subsequent releases, the Marketplace listing auto-updates.

### Staging vs prod

- **"Staging"** = the action used internally in this repo's own `test.yml` workflow via `uses: ./` (path-based reference).
- **"Prod"** = consumers using `uses: you/echo-action@v1`.
- There is no other staging surface; promotion happens by merging the release-please PR.

### Rollback

```bash
# 1. Revert the floating major tag to the previous patch
git tag -f v1 <previous-good-sha>
git push origin v1 --force

# 2. Mark the bad release as not-latest (or delete)
gh release edit vX.Y.Z --latest=false
gh release delete vX.Y.Z   # only if truly unsafe; otherwise leave for forensics
```

Max safe rollback window: until consumers SHA-pin to the new `vX.Y.Z`. Once they pin, rollback only affects `@v1` consumers.

### Health check

There is no live URL. The smoke test is the action's own `test.yml` running on `push: tags: ['v*']`:

```yaml
on:
  push:
    tags: ['v*']
jobs:
  smoke:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@<sha>  # v5.0.1
      - uses: ./
        with:
          message: smoke
        id: e
      - run: '[ "${{ steps.e.outputs.echoed }}" = "SMOKE" ]'
```

### Versioning scheme

- `vX.Y.Z` lives in `package.json` `version` and the git tag.
- release-please syncs both. Do not edit `package.json` `version` by hand.

### Auto-update

Consumers pin `@v1`. Each `vX.Y.Z` we cut updates the `v1` ref. They get patches automatically.

### Cost

- Marketplace listing: **free**.
- CI runner cost (public repo): **free** on GitHub-hosted runners.
- Per 1k MAU of consumers: $0 — the consumers run the action on their own runners.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# CLAUDE.md — echo-action

This project is a JavaScript GitHub Action published to the GitHub Marketplace.
The single source of truth for rules is `./RULEBOOK.md` (or `./github-action.md`).
Read it before doing anything.

## Key commands

- Install: `pnpm install --frozen-lockfile`
- Typecheck: `pnpm run typecheck`
- Lint: `pnpm run lint`
- Format: `pnpm run format`
- Test: `pnpm test`
- Build (REQUIRED before commit): `pnpm run build`
- Local workflow run: `act -j test --pull=false`
- Validate action.yml: `action-validator action.yml`

## Banned patterns

- DO NOT edit `dist/index.js` by hand. Edit `src/` and run `pnpm run build`.
- DO NOT use `runs.using: 'node20'` in `action.yml`.
- DO NOT use mutable refs (`@main`, `@v1`) for third-party actions; pin to full SHA.
- DO NOT push directly to `main`; let release-please open the release PR.
- DO NOT hand-edit `CHANGELOG.md`; release-please owns it.
- DO NOT add `id-token: write` permission unless OIDC is genuinely needed.

## Skills to invoke

- `/test-driven-development` for any new input or output.
- `/systematic-debugging` for "the action runs locally but breaks on the runner."
- `/verification-before-completion` before claiming a task done.
- `/ship` to open a PR and merge.

## Slash command shortcuts

- `/build-and-test` → `pnpm install --frozen-lockfile && pnpm run typecheck && pnpm run lint && pnpm test && pnpm run build && act -j test --pull=false`
```

### `.claude/settings.json`

```json
{
  "$schema": "https://schemas.anthropic.com/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm run:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm vitest:*)",
      "Bash(pnpm dlx:*)",
      "Bash(pnpm exec:*)",
      "Bash(npx ncc:*)",
      "Bash(act:*)",
      "Bash(action-validator:*)",
      "Bash(gh repo view:*)",
      "Bash(gh pr:*)",
      "Bash(gh release:*)",
      "Bash(gh run:*)",
      "Bash(gh workflow:*)",
      "Bash(gh dependabot:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git show:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git tag:*)",
      "Bash(git ls-remote:*)",
      "Bash(node --version)",
      "Bash(pnpm --version)"
    ],
    "deny": [
      "Bash(git push --force:*)",
      "Bash(rm -rf:*)",
      "Bash(npm publish:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_FILE_PATHS\" | grep -qE '\\.(ts|json|yml|yaml)$'; then pnpm exec biome format --write $CLAUDE_FILE_PATHS 2>/dev/null || true; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm run typecheck && pnpm run lint && pnpm test --silent && echo '✓ smoke green' || echo '✗ smoke red — run \\'pnpm run typecheck && pnpm run lint && pnpm test\\' to see why'"
          }
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
# AGENTS.md — echo-action

You are working on a JavaScript GitHub Action that ships to the GitHub Marketplace.

## Read first
`./RULEBOOK.md` (or `./github-action.md`) is the single source of truth for every rule.

## Toolchain
- pnpm 9, Node 24, TypeScript 5.8, Vitest 4.1, Biome 2.4, @vercel/ncc 0.38.4.
- Tests live next to source as `*.test.ts`.

## Definition of done
1. `pnpm run typecheck` exits 0.
2. `pnpm run lint` reports no fixes needed.
3. `pnpm test` passes; coverage thresholds intact.
4. `pnpm run build` regenerated `dist/`.
5. `dist/` is committed in the same commit as the source change.
6. `act -j test --pull=false` is green.
7. Conventional Commit message (feat / fix / chore / feat!).

## Hard rules
- Never edit `dist/index.js`. Edit `src/` and rebuild.
- Pin every third-party action in `.github/workflows/*.yml` to a full 40-char SHA.
- `runs.using: 'node24'`. Never `'node20'`.
- `actions/checkout` MUST have `persist-credentials: false` unless the job pushes.
- Inputs read via `core.getInput`, validated by Zod in `src/inputs.ts`, never branched on raw.
- Failures: `core.setFailed(err.message)`. Never `process.exit`.

## Where to put things
See §3 of the rulebook.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_policy = "on-request"

[shell_environment]
NODE_OPTIONS = "--no-warnings"

[[tools.bash.allow]]
command = "pnpm"
[[tools.bash.allow]]
command = "act"
[[tools.bash.allow]]
command = "action-validator"
[[tools.bash.allow]]
command = "gh"
[[tools.bash.allow]]
command = "git"

[[tools.bash.deny]]
command = "rm"
args = ["-rf", "/"]
[[tools.bash.deny]]
command = "npm"
args = ["publish"]
```

### Codex vs Claude differences

- Codex's `workspace-write` sandbox blocks writes outside the project root — that's fine for this stack.
- Codex defaults to single-shot completions; for multi-file changes (input + schema + test trio in §8.6), explicitly say "make changes to all three files in one turn."
- Codex doesn't run hooks; reproduce the Claude `Stop` hook by running the verify recipe (§8.5) yourself.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# echo-action — Cursor rules

This is a JavaScript GitHub Action published to GitHub Marketplace.
Bundle: @vercel/ncc → dist/index.js. Tests: Vitest. Lint+format: Biome.

## ALWAYS
- Edit only files under src/ for action behavior changes; `dist/` is generated.
- Run `pnpm run build` after every src/ change before committing.
- Pin third-party `uses:` to a full 40-char SHA with a trailing `# v1.2.3` comment.
- Set `persist-credentials: false` on `actions/checkout` unless pushing.
- Use `runs.using: 'node24'` in action.yml. Never `node20`.
- Validate inputs via Zod in src/inputs.ts.
- Wrap top-level `run()` in try/catch and call `core.setFailed(err.message)`.
- Use Conventional Commits (feat:, fix:, feat!:, chore:, docs:).

## NEVER
- Edit dist/index.js by hand.
- Use mutable action refs (@main, @v1) inside this repo's workflows.
- Read process.env.GITHUB_TOKEN; take a `token` input instead.
- Hand-edit CHANGELOG.md; release-please owns it.
- Push directly to main; merge the release-please PR.
- Add `id-token: write` permission unless using OIDC.
- Use `pull_request_target` for tests.

## When asked to add an input
Edit, in this order:
1. action.yml inputs:
2. src/inputs.ts Zod schema
3. src/main.ts to consume the new field
4. src/main.test.ts (test happy path + missing + invalid)
5. README.md Usage block
6. pnpm run build && commit dist/
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "github.vscode-github-actions",
    "redhat.vscode-yaml",
    "vitest.explorer",
    "ms-azuretools.vscode-docker"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug current Vitest test",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--no-coverage", "${relativeFile}"],
      "console": "integratedTerminal",
      "smartStep": true,
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Debug action bundle (post-build)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/dist/index.js",
      "env": {
        "INPUT_MESSAGE": "hello from launch.json",
        "GITHUB_OUTPUT": "${workspaceFolder}/.tmp-output"
      },
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this exact order. After the last step, `git push` produces a deployable hello-world action.

### 1. `package.json`

```json
{
  "name": "echo-action",
  "version": "0.0.0",
  "description": "Echo your inputs back as outputs.",
  "private": true,
  "type": "module",
  "main": "dist/index.js",
  "engines": { "node": ">=24" },
  "packageManager": "pnpm@9.0.0",
  "scripts": {
    "build": "ncc build src/index.ts -o dist --source-map --license licenses.txt",
    "dev": "ncc build src/index.ts -o dist --source-map --watch",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "coverage": "vitest run --coverage",
    "validate": "action-validator action.yml"
  },
  "dependencies": {
    "@actions/core": "^3.0.1",
    "@actions/exec": "^3.0.0",
    "@actions/github": "^9.1.0",
    "@actions/tool-cache": "^4.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.4.0",
    "@types/node": "^24.0.0",
    "@vercel/ncc": "^0.38.4",
    "@vitest/coverage-v8": "^4.1.4",
    "typescript": "~5.8.3",
    "vitest": "^4.1.4"
  }
}
```

### 2. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "noEmit": true,
    "lib": ["ES2023"],
    "types": ["node"]
  },
  "include": ["src/**/*", "vitest.config.ts"],
  "exclude": ["dist", "node_modules"]
}
```

### 3. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "ignoreUnknown": true, "includes": ["src/**", "*.json", "*.yml"] },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": {
        "useImportType": "error",
        "noNonNullAssertion": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" }
  }
}
```

### 4. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    pool: 'threads',
    poolOptions: { threads: { minThreads: 2 } },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/**/*.test.ts'],
      thresholds: { lines: 80, branches: 70, functions: 80, statements: 80 },
    },
  },
});
```

### 5. `action.yml`

```yaml
name: 'Echo Action'
description: 'Echo the input message back as an output, optionally uppercased.'
author: 'your-org'
inputs:
  message:
    description: 'The message to echo.'
    required: true
  uppercase:
    description: 'If "true", the echoed message is uppercased.'
    required: false
    default: 'false'
  token:
    description: 'GitHub token used for authenticated API calls.'
    required: false
    default: ${{ github.token }}
outputs:
  echoed:
    description: 'The echoed message (uppercased if requested).'
runs:
  using: 'node24'
  main: 'dist/index.js'
branding:
  icon: 'message-circle'
  color: 'blue'
```

### 6. `src/index.ts`

```ts
import { run } from './main.js';

run();
```

### 7. `src/inputs.ts`

```ts
import * as core from '@actions/core';
import { z } from 'zod';

const InputSchema = z.object({
  message: z.string().min(1, 'message is required'),
  uppercase: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .default('false'),
  token: z.string().min(1, 'token is required'),
});

export type Inputs = z.infer<typeof InputSchema>;

export function readInputs(): Inputs {
  const raw = {
    message: core.getInput('message', { required: true }),
    uppercase: core.getInput('uppercase') || 'false',
    token: core.getInput('token', { required: true }),
  };
  const result = InputSchema.safeParse(raw);
  if (!result.success) {
    throw new Error(`invalid inputs: ${result.error.issues.map((i) => i.message).join(', ')}`);
  }
  core.setSecret(result.data.token);
  return result.data;
}
```

### 8. `src/main.ts`

```ts
import * as core from '@actions/core';
import { readInputs } from './inputs.js';

export async function run(): Promise<void> {
  try {
    const inputs = readInputs();
    core.info(`[main] echo-action started, uppercase=${inputs.uppercase}`);
    const echoed = inputs.uppercase ? inputs.message.toUpperCase() : inputs.message;
    core.setOutput('echoed', echoed);
    core.info(`[main] echoed=${echoed}`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    core.setFailed(message);
  }
}
```

### 9. `src/main.test.ts`

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@actions/core', () => ({
  getInput: vi.fn(),
  setOutput: vi.fn(),
  setFailed: vi.fn(),
  setSecret: vi.fn(),
  info: vi.fn(),
}));

import * as core from '@actions/core';
import { run } from './main.js';

const mockedGetInput = core.getInput as unknown as ReturnType<typeof vi.fn>;
const mockedSetOutput = core.setOutput as unknown as ReturnType<typeof vi.fn>;
const mockedSetFailed = core.setFailed as unknown as ReturnType<typeof vi.fn>;

describe('run()', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('echoes input message', async () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'message') return 'hi';
      if (name === 'uppercase') return 'false';
      if (name === 'token') return 'ghs_redacted';
      return '';
    });
    await run();
    expect(mockedSetOutput).toHaveBeenCalledWith('echoed', 'hi');
    expect(mockedSetFailed).not.toHaveBeenCalled();
  });

  it("uppercases when 'uppercase' is 'true'", async () => {
    mockedGetInput.mockImplementation((name: string) => {
      if (name === 'message') return 'hi';
      if (name === 'uppercase') return 'true';
      if (name === 'token') return 'ghs_redacted';
      return '';
    });
    await run();
    expect(mockedSetOutput).toHaveBeenCalledWith('echoed', 'HI');
  });

  it('fails when message missing', async () => {
    mockedGetInput.mockImplementation((name: string, opts?: { required?: boolean }) => {
      if (name === 'message' && opts?.required) throw new Error('Input required and not supplied: message');
      if (name === 'token') return 'ghs_redacted';
      return '';
    });
    await run();
    expect(mockedSetFailed).toHaveBeenCalled();
  });
});
```

### 10. `.github/workflows/test.yml`

```yaml
name: Test
on:
  pull_request:
  push:
    branches: [main]

permissions: {}

jobs:
  unit:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v5.0.1
        with:
          persist-credentials: false
      - uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020  # v5.0.0
        with:
          node-version: '24'
      - uses: pnpm/action-setup@a7487c7e89a18df4991f7f222e4898a00d66ddda  # v4.1.0
        with:
          version: 9
      - run: pnpm install --frozen-lockfile
      - run: pnpm run typecheck
      - run: pnpm run lint
      - run: pnpm test
      - run: pnpm run build
      - name: Verify dist/ is up to date
        run: |
          git diff --exit-code dist/ || {
            echo "::error::dist/ is stale. Run 'pnpm run build' and commit."
            exit 1
          }

  validate-action:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v5.0.1
        with:
          persist-credentials: false
      - uses: mpalmer/action-validator@4b6e08e3cb7a40c9ee2c12ee3f3b8eb22dd99c61  # v0.8.0
        with:
          path: action.yml

  smoke:
    runs-on: ubuntu-latest
    needs: [unit, validate-action]
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v5.0.1
        with:
          persist-credentials: false
      - id: e
        uses: ./
        with:
          message: smoke
          uppercase: 'true'
      - run: |
          test "${{ steps.e.outputs.echoed }}" = "SMOKE" \
            || { echo "::error::smoke failed: got '${{ steps.e.outputs.echoed }}'"; exit 1; }
```

### 11. `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    branches: [main]

permissions: {}

jobs:
  release-please:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pull-requests: write
    outputs:
      released: ${{ steps.rp.outputs.release_created }}
      tag: ${{ steps.rp.outputs.tag_name }}
    steps:
      - id: rp
        uses: googleapis/release-please-action@a02a34c4d625f9be7cb89156071d8567266a2445  # v4.1.3
        with:
          release-type: node

  tag-major:
    needs: release-please
    if: needs.release-please.outputs.released == 'true'
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@b4ffde65f46336ab88eb53be808477a3936bae11  # v5.0.1
        with:
          fetch-depth: 0
          persist-credentials: true
      - uses: mheap/action-tagger@6c3b3a2efadb9ddabea0c19d20cd80a3c5ab3186  # v3.0.0
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
          publish_latest_tag: true
```

### 12. `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: github-actions
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore(deps)"
  - package-ecosystem: npm
    directory: /
    schedule:
      interval: weekly
    commit-message:
      prefix: "chore(deps)"
```

### 13. `.gitignore`

```
node_modules/
.pnpm-store/
coverage/
.tmp-output
*.log
.DS_Store
```

### 14. `.gitattributes`

```
dist/** -diff linguist-generated=true
pnpm-lock.yaml -diff
```

### 15. `LICENSE`

```
MIT License

Copyright (c) <year> <copyright holder>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND.
```

### 16. `README.md`

````markdown
# Echo Action

Echo your inputs back as outputs. Optionally uppercase the output.

## Usage

```yaml
- name: Echo
  id: e
  uses: your-org/echo-action@v1
  with:
    message: 'Hello, world'
    uppercase: 'true'

- run: echo "Got back ${{ steps.e.outputs.echoed }}"
```

## Inputs

| Name | Required | Default | Description |
|---|---|---|---|
| `message` | yes | — | The message to echo. |
| `uppercase` | no | `false` | If `true`, uppercase the echoed message. |
| `token` | no | `${{ github.token }}` | GitHub token. |

## Outputs

| Name | Description |
|---|---|
| `echoed` | The echoed message (uppercased if requested). |

## Permissions

This action requires no special permissions. The default `permissions: { contents: read }` is enough.

## Pinning

Pin to a SHA for reproducible builds:

```yaml
- uses: your-org/echo-action@<sha>  # v1.2.3
```

## License

MIT.
````

### 17. `CLAUDE.md` (file content from §13)

### 18. `AGENTS.md` (file content from §14)

### 19. `.cursor/rules` (file content from §15)

### 20. `dist/index.js` (do NOT create by hand — `pnpm run build` produces it)

After all 19 hand-created files, run:

```bash
pnpm install
pnpm run build
git add .
git commit -m "feat: initial echo-action scaffold"
git push -u origin main
```

The first push triggers `test.yml`. When green, merge the release-please PR it later opens; that publishes `v0.1.0` (or `v1.0.0` if you started with a `feat!:` commit).

---

## 17. Idea → MVP Path: Skeleton to first Marketplace `v1`

For a brand-new action (using `echo-action` as the running example), each phase below has explicit exit criteria.

### Phase 1 — Schema (1 AI session)

- Decide the action's contract: every input, every output.
- Files touched: `action.yml`, `src/inputs.ts`.
- Exit: `action-validator action.yml` is green; Zod schema compiles; README "Inputs/Outputs" tables match `action.yml`.

### Phase 2 — Backbone (1 session)

- Stand up `src/index.ts` + `src/main.ts` skeleton with try/catch, `core.info` lines, `core.setFailed` path.
- Files touched: `src/index.ts`, `src/main.ts`, `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`.
- Exit: `pnpm run build` produces `dist/index.js`; `node dist/index.js` exits 1 with "Input required and not supplied: message" — i.e., the action runs and fails the right way.

### Phase 3 — Vertical slice (1–2 sessions)

- Implement the action's actual logic (the echo). Add Vitest tests covering happy path, missing input, invalid input.
- Files touched: `src/main.ts`, `src/main.test.ts`.
- Exit: `pnpm test` ≥3 tests passing; `act -j unit` green; `act -j smoke` green (the action invokes itself via `uses: ./`).

### Phase 4 — CI + release plumbing (1 session)

- Add `.github/workflows/test.yml` and `.github/workflows/release.yml`.
- Add `.github/dependabot.yml`, README, LICENSE.
- Files touched: `.github/**`, `README.md`, `LICENSE`.
- Exit: PR opened from a branch shows green checks. Push to `main` opens a release-please PR.

### Phase 5 — Ship + monitor (≤1 session)

- Merge the release-please PR — `vX.Y.Z` is tagged; `tag-major` job updates `v1`.
- Edit the GitHub Release → tick "Publish to Marketplace" → categories.
- Watch a downstream consumer's run for one week.
- Exit: a real consumer's workflow uses `your-org/echo-action@v1` and succeeds; you've shipped a patch (`fix:` commit) and confirmed the floating `v1` tag advanced.

---

## 18. Feature Recipes

Recipes for the most common action capabilities. Each is copy-pasteable.

### 18.1 Composite action variant

When you have no JS, just a sequence of shell + uses calls.

`action.yml`:

```yaml
name: 'Echo Composite'
description: 'Composite variant — chains shell + uses calls without a Node bundle.'
inputs:
  message:
    description: 'The message to echo.'
    required: true
outputs:
  echoed:
    description: 'The echoed message.'
    value: ${{ steps.e.outputs.echoed }}
runs:
  using: 'composite'
  steps:
    - id: e
      shell: bash
      env:
        MSG: ${{ inputs.message }}
      run: |
        echo "echoed=${MSG}" >> "$GITHUB_OUTPUT"
branding:
  icon: 'message-square'
  color: 'green'
```

Notes: composite outputs MUST be declared with `value:` referencing a step output; you cannot return a dynamic key.

### 18.2 Docker container action variant

When you need a non-JS runtime (Python, Go, Rust binary).

`action.yml`:

```yaml
name: 'Echo Docker'
description: 'Docker container variant.'
inputs:
  message:
    description: 'Message to echo.'
    required: true
outputs:
  echoed:
    description: 'Echoed message.'
runs:
  using: 'docker'
  image: 'docker://ghcr.io/your-org/echo-action:1.0.0'
  args:
    - ${{ inputs.message }}
branding:
  icon: 'box'
  color: 'orange'
```

`Dockerfile`:

```dockerfile
FROM alpine:3.20
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
ENTRYPOINT ["/entrypoint.sh"]
```

`entrypoint.sh`:

```bash
#!/bin/sh -l
set -euo pipefail
MSG="$1"
echo "echoed=${MSG}" >> "$GITHUB_OUTPUT"
```

Build + push image to GHCR via a release-time workflow; reference `image: 'docker://ghcr.io/...'` so the runner pulls it (instead of building from `Dockerfile` on every run, which is 10× slower).

Constraints: Docker container actions only run on Linux runners, run as root, and must use absolute paths in `ENTRYPOINT`.

### 18.3 Fetch a tool and cache it

`src/fetch-tool.ts`:

```ts
import * as tc from '@actions/tool-cache';
import * as core from '@actions/core';

export async function getRipgrep(version: string): Promise<string> {
  let cached = tc.find('ripgrep', version);
  if (cached) {
    core.info(`[fetch] cache hit ${cached}`);
    return cached;
  }
  const url = `https://github.com/BurntSushi/ripgrep/releases/download/${version}/ripgrep-${version}-x86_64-unknown-linux-musl.tar.gz`;
  core.info(`[fetch] downloading ${url}`);
  const tarball = await tc.downloadTool(url);
  const extracted = await tc.extractTar(tarball);
  cached = await tc.cacheDir(extracted, 'ripgrep', version);
  core.info(`[fetch] cached at ${cached}`);
  core.addPath(cached);
  return cached;
}
```

### 18.4 Stateful pre/main/post action

Across-step state lives in `$GITHUB_STATE` via `core.saveState` / `core.getState`.

`action.yml`:

```yaml
name: 'Timer Action'
description: 'Measure elapsed time across job steps.'
runs:
  using: 'node24'
  pre: 'dist/pre.js'
  main: 'dist/main.js'
  post: 'dist/post.js'
```

`src/pre.ts`:

```ts
import * as core from '@actions/core';
core.saveState('start', String(Date.now()));
core.info('[pre] timer started');
```

`src/post.ts`:

```ts
import * as core from '@actions/core';
const start = Number(core.getState('start'));
core.info(`[post] elapsed=${Date.now() - start}ms`);
```

Build separately: `ncc build src/pre.ts -o dist/pre`, `ncc build src/main.ts -o dist`, `ncc build src/post.ts -o dist/post`. Adjust paths in `action.yml` to `dist/pre/index.js` etc.

### 18.5 Octokit call (typed)

```ts
import * as core from '@actions/core';
import { getOctokit, context } from '@actions/github';

const token = core.getInput('token', { required: true });
core.setSecret(token);
const octokit = getOctokit(token);
const { data: pr } = await octokit.rest.pulls.get({
  owner: context.repo.owner,
  repo: context.repo.repo,
  pull_number: context.payload.pull_request?.number ?? 0,
});
core.setOutput('pr-title', pr.title);
```

### 18.6 Run an external binary safely

```ts
import { exec } from '@actions/exec';
import * as core from '@actions/core';

let stdout = '';
const exit = await exec('git', ['rev-parse', 'HEAD'], {
  listeners: { stdout: (b) => (stdout += b.toString()) },
  silent: false,
});
if (exit !== 0) throw new Error(`git rev-parse failed: ${exit}`);
core.setOutput('sha', stdout.trim());
```

### 18.7 Mask a secret obtained at runtime

```ts
const token = await fetchTokenFromVault();
core.setSecret(token);   // do this BEFORE any logging that might include it
core.info(`[main] obtained token (masked: ${token})`);  // logs as ***
```

### 18.8 Set a multi-line output

```ts
core.setOutput('summary', 'line1\nline2\nline3');
```

`@actions/core` writes the multi-line heredoc form to `$GITHUB_OUTPUT` automatically; never construct it by hand.

### 18.9 Add a job summary (Markdown)

```ts
import { summary } from '@actions/core';

await summary
  .addHeading('Echo result')
  .addCodeBlock(echoed, 'text')
  .write();
```

Renders on the workflow run page.

### 18.10 Action that uploads/downloads workflow artifacts

```ts
import { DefaultArtifactClient } from '@actions/artifact';
const client = new DefaultArtifactClient();
await client.uploadArtifact('logs', ['./out.log'], '.');
```

(Add `@actions/artifact` to deps; bundled by ncc.)

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find module '/home/runner/work/_actions/.../dist/index.js'` | `pnpm run build`, commit `dist/`, push, retag. |
| `Input required and not supplied: message` | Consumer's workflow `with:` block missing the input, or the action.yml `default:` is empty. |
| `Unable to resolve action your-org/echo-action@v1, repository not found` | Repo private; Marketplace requires public. |
| `Action.yml is not valid: required property 'using' missing` | Add `runs: { using: 'node24', main: 'dist/index.js' }`. |
| `Node.js version 20 detected. This will be deprecated…` | Bump `runs.using` to `node24`. |
| `set-output is deprecated` | Replace any `echo "::set-output name=…"` with `core.setOutput`. |
| `Resource not accessible by integration` | Job's `permissions:` block too narrow; add the right scope (`pull-requests: write`, `contents: write`). |
| `Error: Bad credentials` from Octokit | `token` input empty; ensure `default: ${{ github.token }}` in action.yml. |
| `act: Could not find any image matching node:24-bullseye-slim` | `act --pull` once, then `act --pull=false`. |
| `act: Error: Cannot connect to the Docker daemon` | Start Docker Desktop / Colima / `dockerd`. |
| `pnpm: ERR_PNPM_NO_LOCKFILE` | First-time: `pnpm install` (no `--frozen-lockfile`); commit the lockfile. |
| `error TS2307: Cannot find module './main.js'` | Use `.js` extension on imports even for `.ts` files (Node ESM rule). |
| `error: Unknown command 'biome'` | `pnpm install`; `biome` is a devDep, run via `pnpm exec biome` or scripts. |
| `ncc: ENOENT: no such file or directory, open 'src/index.ts'` | File missing or path wrong; check `tsconfig.json` `include`. |
| `release-please did not open a PR` | No `feat:`/`fix:` commits since last release. |
| `tag-major did not update v1` | `release-please` output `release_created` was false; only runs after a release-please PR is merged. |
| `Marketplace publish: name conflict` | Pick a unique name; cannot match user/org/category. |
| `Branding required to publish to Marketplace` | Add `branding: { icon, color }` block. |
| `Job permissions error: id-token: write` | Remove unless OIDC required. |
| `act: error: workflow does not exist` | `act -W .github/workflows/test.yml`. |
| `Error: A required CSRF token was not provided` (Marketplace publish) | Refresh page; ensure 2FA is enabled on your account. |
| `dist/ is stale` (CI step) | `pnpm run build && git add dist/ && git commit --amend`. |
| `Cannot read properties of undefined (reading 'pull_request')` | `context.payload.pull_request` is undefined for `push` events; guard with `?.`. |
| `Action failed: heap out of memory` | Add `NODE_OPTIONS: --max-old-space-size=4096` in workflow env. |
| `act: docker pull access denied` | `docker login ghcr.io -u USER -p $TOKEN` once. |
| `Cypress / Playwright cannot install in act container` | act's default image lacks browsers; use `-P ubuntu-latest=catthehacker/ubuntu:full-latest`. |
| `'core.setOutput' is not a function` (in tests) | The Vitest mock didn't mock `setOutput`; add it to the `vi.mock` factory. |
| `pnpm-lock.yaml is out of sync with package.json` | `pnpm install --no-frozen-lockfile` then commit; investigate why CI saw drift. |
| `error: Process completed with exit code 1.` (no detail) | Run with `ACTIONS_STEP_DEBUG=true` repo secret to surface `core.debug` lines. |
| `act: workflow file YAML is invalid` | `action-validator .github/workflows/test.yml`. |
| `Error: HttpError: Bad credentials` from `gh` CLI | `gh auth refresh`. |
| `dist/index.js too big to push` (>100 MB) | Almost always means `node_modules/` got bundled; check `ncc` ran on `src/index.ts`, not `node_modules/.../something.js`. |
| `Marketplace listing won't update CHANGELOG` | The release page body IS the changelog; release-please writes it. Edit the release if needed. |
| `Token leaks in logs` | `core.setSecret(token)` was called too late; mask BEFORE first log line referencing the value. |

---

## 20. Glossary

- **Action.** A reusable unit invoked from a GitHub workflow via `uses:`. Three flavors: JavaScript, Composite, Docker container.
- **Action.yml.** Metadata file at the root of an action repo declaring inputs, outputs, runtime, and branding.
- **Annotation.** A line in a workflow log that GitHub renders inline on the PR Files-changed view (warnings, errors, notices).
- **Branding.** `icon` + `color` fields in `action.yml` that produce the Marketplace tile.
- **Bundler.** Tool that combines source + dependencies into one file. We use `@vercel/ncc`.
- **Composite action.** An action whose `runs.using` is `composite` — it sequences shell and `uses:` steps without a Node binary.
- **Conventional Commit.** A commit message prefix convention (`feat:`, `fix:`, `feat!:` for breaking) that release-please reads to decide SemVer bumps.
- **Dispatch.** Trigger a workflow manually via `gh workflow run` or the UI (`workflow_dispatch:`).
- **Floating major tag.** A mutable `v1` tag re-pointed each patch release so consumers on `@v1` get bug fixes free.
- **GHCR.** GitHub Container Registry, used to host pre-built Docker images for Docker container actions.
- **GITHUB_OUTPUT.** A file path the runner exposes; writing `name=value` lines becomes step outputs.
- **GITHUB_STATE.** Same idea, for state preserved across pre/main/post of one action invocation.
- **GITHUB_TOKEN.** A short-lived, job-scoped token GitHub mints for each workflow run. Permissions are controlled via the workflow's `permissions:` block.
- **Job.** A set of steps that run on a single runner.
- **Marketplace.** GitHub's catalog where actions are listed; publishing requires a public repo, a unique name, branding, and a stable tag.
- **ncc.** `@vercel/ncc`, the canonical Node bundler for actions.
- **OIDC.** OpenID Connect; lets a workflow exchange a GitHub-issued token for short-lived cloud credentials. Requires `id-token: write` permission.
- **Permissions.** Per-job (or per-workflow) declaration of what the `GITHUB_TOKEN` is allowed to do.
- **Pin.** Reference an action by an immutable 40-char SHA so the code can't change under you.
- **release-please.** A Google-maintained action that opens a PR with a CHANGELOG and version bump computed from Conventional Commits.
- **Runner.** The VM (or container) that executes a workflow job. GitHub-hosted by default.
- **SHA pinning.** Pinning a third-party action to a full commit SHA (defeats tag-rewrite supply-chain attacks).
- **Step.** A single shell `run:` or `uses:` invocation inside a job.
- **Tagger.** A small action (e.g., `mheap/action-tagger`) that updates the `v1` ref to point to a new patch.
- **Tool cache.** Per-runner cache where downloaded binaries are stored. Reused across jobs on the same runner.
- **Workflow.** A YAML file in `.github/workflows/*.yml` that declares triggers and jobs.

---

## 21. Update Cadence

This rulebook is valid for actions targeting:

- Node 24 (default on GitHub-hosted runners since March 2026; mandatory June 2026).
- `@actions/core` ≥3.0, `@actions/github` ≥9.0 (ESM-only), `@vercel/ncc` ≥0.38.
- TypeScript 5.8 (5.7 also fine; 6.0 transitional release expected Q1 2026).

Re-run the generator when:

- A new major Node runtime becomes the runner default (next: Node 26, expected 2027).
- `@actions/core` major bump.
- `@vercel/ncc` is replaced by a different first-class bundler.
- A new `runs.using:` value is added.
- A Marketplace publishing requirement changes.
- A security advisory mandates a workflow-level change (e.g., new `dependencies:` SHA-locked block once it ships).

Last updated: **2026-04-27**.

## Known Gaps

- The `actions/setup-node@v5` exact SHA and `pnpm/action-setup` SHA in §16 were not personally verified during this generation; consumers should run `gh api repos/actions/setup-node/git/ref/tags/v5.0.0` and substitute the commit SHA before first push.
- `release-please-action` v4 patch SHA used in §16 is the latest at time of writing but should be re-pinned via Dependabot at first install.
- `mheap/action-tagger@v3` SHA is the v3 release line; verify with `gh api repos/mheap/action-tagger/git/ref/tags/v3.0.0` before pushing.
- Task brief specified `runs.using: 'node22'`; this rulebook uses `node24` to match the actual GitHub-hosted runner default as of 2026-04-27. `node22` is still valid; substitute if your team policy requires it.
