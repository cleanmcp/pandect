# npm Package Rulebook

TypeScript library published to npmjs.com with dual ESM+CJS exports, OIDC trusted publishing, and changesets-driven releases. Hand this to an AI coding agent with a library idea and it ships v1.0.0 to the registry.

This rulebook is for **publishing a library**, not building an app. App-only concerns (auth, routing, multi-user, server processes) do not apply. Where a section is app-shaped, it is reframed for library publishing — Section 12 covers the publish/version flow, Section 4 covers the public API surface and bundling boundary, Section 17 covers Library → first published v1.0.0.

Example library used throughout: **`string-helpers`** — a small util library that exports `slugify`, `truncate`, `pad`. Replace the name and exports with your own.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0.3 | Type safety; users get `.d.ts` for free. |
| Runtime + version | Node.js 22.x LTS (min 20.19.0) | Active LTS; Node 20 EOL Apr 30 2026. |
| Package manager | pnpm 9.x | Fast, disk-efficient, strict resolution catches phantom deps. |
| Build tool | tshy 3.x | Purpose-built dual ESM+CJS; owns exports map; fewer footguns. |
| Module format | Dual ESM+CJS, ESM-first | Maximal compatibility; CJS users still resolve correctly. |
| Public API surface | Single barrel `src/index.ts` | One entry point; tree-shakeable; no deep imports. |
| Versioning tool | changesets 2.x + `@changesets/cli` | Multi-package safe; clear changelogs; PR-driven release. |
| Registry | npmjs.com (public) | Default registry; free; OIDC trusted publishing. |
| Auth model | OIDC trusted publishing (no `NPM_TOKEN`) | No long-lived secrets; provenance attestation by default. |
| Provenance | `npm publish --provenance` via OIDC | Sigstore attestation links package to source commit. |
| Unit test runner | Vitest 4.x | Fast; native ESM/TS; Vite-powered; in-source tests. |
| E2E framework | n/a (library) | Libraries do not have user flows; integration tests in Vitest. |
| Mocking strategy | `vi.mock` at module boundary; never mock unit-under-test | Prevents tautological tests. |
| Logger | n/a (library) | Libraries should not log; let callers decide. |
| Error tracking | n/a (library) | Throw typed errors; caller decides reporting. |
| Lint + format | Biome 2.4.x | One tool; Rust-fast; replaces ESLint+Prettier. |
| Type checking | `tsc --noEmit` (strict) | Authoritative; catches what tshy build skips. |
| Types-check tool | `attw --pack` + `publint` | Validates exports map and `.d.ts` resolution per condition. |
| Env vars + secrets | `.env.local` (dev only) — libraries take no secrets | Library code reads no env at import time. |
| CI provider | GitHub Actions | Free for public repos; native OIDC support. |
| Release flow | `changesets/action@v1` opens PR, merge triggers publish | One PR per release; auditable changelog. |
| Auto-update | n/a (consumer's package manager) | npm/pnpm/yarn handle updates downstream. |
| MSRV (Node minimum) | `engines.node: ">=20.19.0"` | Lowest LTS still supported; matches Node 22 LTS lower bound. |
| sideEffects | `false` (declared) | Enables tree-shaking; library has zero top-level side effects. |
| Repository field | Required, exact GitHub URL match | Required for OIDC trusted publishing + provenance. |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Node.js (LTS) | 22.x | active LTS through Oct 2027 | https://nodejs.org/en/about/previous-releases |
| npm CLI | 11.13.0 | 2026-04-22 | https://github.com/npm/cli/releases |
| pnpm | 9.15.x | 2026 | https://pnpm.io/ |
| TypeScript | 6.0.3 | 2026-04 | https://www.npmjs.com/package/typescript |
| tshy | 3.x | 2026 | https://www.npmjs.com/package/tshy |
| Vitest | 4.1.4 | 2026-04 | https://github.com/vitest-dev/vitest/releases |
| Biome | 2.4.x | 2026-02 | https://biomejs.dev |
| @changesets/cli | 2.x | 2026 | https://www.npmjs.com/package/@changesets/cli |
| changesets/action | v1 | 2026 | https://github.com/changesets/action |
| @arethetypeswrong/cli | 0.18.x | 2026 | https://www.npmjs.com/package/@arethetypeswrong/cli |
| publint | 0.3.18 | 2026-02 | https://www.npmjs.com/package/publint |

### Minimum Host Requirements

- macOS 13+, Windows 10/11, or Linux (Ubuntu 22.04+ / Debian 12+).
- 4 GB RAM minimum, 8 GB recommended.
- 2 GB free disk for `node_modules` cache.
- Git 2.40+.
- A GitHub account, an npm account, terminal access.

### Cold-Start Estimate

`git clone` to `pnpm test` green: **~3 minutes** on a modern machine with broadband. First-time bootstrap from zero (no Node, no pnpm, no accounts): **~25 minutes**.

---

## 2. Zero-to-Running (Setup)

### macOS

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 22 LTS, pnpm, gh CLI, git
brew install node@22 pnpm gh git

# 3. Verify
node --version   # v22.x.x
npm --version    # 11.13.0 or newer
pnpm --version   # 9.15.x or newer
gh --version
git --version
```

### Windows

```powershell
# 1. Install winget if not present (Win10 21H2+ / Win11 ships it)
# 2. Install Node 22, pnpm, GitHub CLI, Git
winget install --id OpenJS.NodeJS.LTS -e
winget install --id pnpm.pnpm -e
winget install --id GitHub.cli -e
winget install --id Git.Git -e

# 3. Open a fresh PowerShell, verify
node --version
npm --version
pnpm --version
gh --version
git --version
```

### Linux (Ubuntu/Debian)

```bash
# 1. Install Node 22 from NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm via corepack (ships with Node)
sudo corepack enable
corepack prepare pnpm@latest --activate

# 3. Install gh and git
sudo apt-get install -y gh git

# 4. Verify
node --version && npm --version && pnpm --version && gh --version && git --version
```

### Accounts to Create

| Account | URL | What you need |
|---|---|---|
| GitHub | https://github.com/signup | Username, 2FA enabled. |
| npm | https://www.npmjs.com/signup | Username (becomes part of unscoped names) or org (for `@org/name`). |

**Enable 2FA on both.** npm requires 2FA for publishing. Use TOTP (Authy, 1Password, or `oathtool`). Do not use SMS.

### CLI Authentication

```bash
# GitHub
gh auth login   # pick HTTPS, authenticate via browser

# npm — only needed for local manual publish; CI uses OIDC, no token
npm login --auth-type=web
```

### Bootstrap a New Library (string-helpers example)

```bash
# 1. Create empty repo on GitHub via gh
mkdir string-helpers && cd string-helpers
git init -b main

# 2. Init pnpm + package.json
pnpm init
# Edit package.json — see Section 16 for the full canonical contents

# 3. Install dev deps (versions pinned to current research)
pnpm add -D typescript@~6.0.3 tshy@^3 vitest@^4.1 \
  @biomejs/biome@~2.4 @changesets/cli@^2 \
  @arethetypeswrong/cli@^0.18 publint@^0.3 \
  @types/node@^22

# 4. Init changesets
pnpm changeset init

# 5. Init biome
pnpm biome init

# 6. Create source
mkdir -p src test
# Paste the files from Section 16 — src/index.ts, tsconfig.json, etc.

# 7. First green run
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build

# 8. Push to GitHub
gh repo create string-helpers --public --source=. --remote=origin --push
```

### Expected First-Run Output

```
$ pnpm test
 RUN  v4.1.4

 ✓ test/slugify.test.ts (3)
 ✓ test/truncate.test.ts (2)
 ✓ test/pad.test.ts (2)

 Test Files  3 passed (3)
      Tests  7 passed (7)
   Duration  ~400ms
```

```
$ pnpm build
> tshy

tshy: built ESM to ./dist/esm
tshy: built CJS to ./dist/commonjs
tshy: wrote exports map to package.json
```

### Common First-Run Errors

| Error (verbatim) | Cause | Fix |
|---|---|---|
| `error TS5023: Unknown compiler option 'verbatimModuleSyntax'` | TypeScript too old | `pnpm add -D typescript@~6.0.3` |
| `tshy: dialects must include 'esm' and 'commonjs'` | Missing `tshy` block in package.json | Copy block from Section 16 |
| `npm error code E401 ... need auth` (running locally) | Not logged in to npm | `npm login --auth-type=web` |
| `OIDC token request failed` (CI) | Job missing `id-token: write` | Add `permissions: id-token: write` to job |
| `package name "string-helpers" already exists` | Name taken on npm | Use a scoped name `@yourname/string-helpers` |
| `attw: Resolved through fallback condition` | exports map missing condition | Let tshy regenerate; do not hand-edit |
| `publint: "main" is set to ".../index.cjs" but file does not exist` | Forgot to build before publint | `pnpm build && pnpm lint:pkg` |
| `vitest: cannot find package 'string-helpers'` (in test) | Test importing built path | Import from `../src/index.ts` instead |

---

## 3. Project Layout

```
string-helpers/
├── .changeset/
│   ├── config.json              # changesets configuration
│   └── README.md                # changesets docs (auto-created)
├── .github/
│   └── workflows/
│       ├── ci.yml               # PR checks
│       └── release.yml          # changesets release
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules
├── dist/                        # BUILD OUTPUT — never commit, never edit
│   ├── esm/
│   │   ├── index.js
│   │   ├── index.d.ts
│   │   └── package.json         # {"type": "module"}
│   └── commonjs/
│       ├── index.js
│       ├── index.d.ts
│       └── package.json         # {"type": "commonjs"}
├── src/                         # SOURCE — only place you write code
│   ├── index.ts                 # public barrel — only file consumers see
│   ├── slugify.ts
│   ├── truncate.ts
│   └── pad.ts
├── test/                        # tests live here, not in src/
│   ├── slugify.test.ts
│   ├── truncate.test.ts
│   └── pad.test.ts
├── .gitignore
├── .npmignore                   # only used as a fallback; "files" is authoritative
├── AGENTS.md
├── biome.json
├── CHANGELOG.md                 # auto-generated by changesets — never hand-edit
├── CLAUDE.md
├── LICENSE
├── package.json
├── pnpm-lock.yaml               # commit this
├── README.md
├── tsconfig.json                # base config (used by editors + tests)
└── vitest.config.ts
```

### Naming Conventions

- Files: `kebab-case.ts` (`slugify.ts`, `pad-left.ts`).
- Test files: same name + `.test.ts` (`slugify.test.ts`).
- Type names: `PascalCase` (`SlugifyOptions`).
- Function names: `camelCase` (`slugify`, `padLeft`).
- Constants: `SCREAMING_SNAKE_CASE` for module-level config; `camelCase` for derived values.
- Internal helpers: prefix with `_` and never re-export from `index.ts`.

### "If You're Adding X, It Goes In Y"

| Adding | Goes in | Notes |
|---|---|---|
| New public function | `src/<name>.ts` + re-export from `src/index.ts` | Must add a test. |
| Internal helper | `src/_<name>.ts` (underscore prefix) | Never re-exported. |
| New type / interface (public) | Same file as the function it's for, exported by name | Re-export from `src/index.ts`. |
| New type / interface (internal) | `src/_types.ts` | Never re-exported from index. |
| Unit test | `test/<source-name>.test.ts` | One file per source file. |
| Integration test | `test/integration/<scenario>.test.ts` | Run with `pnpm test:integration`. |
| Test fixture / mock | `test/__fixtures__/` | Not bundled (excluded by `files`). |
| README example | `README.md` (top-level) | Must be runnable; tested via `examples/` if non-trivial. |
| Runnable example | `examples/<name>/` | Excluded from npm publish. |
| Build script | `scripts/<name>.mjs` | Run via `pnpm exec`; never bundled. |
| GitHub workflow | `.github/workflows/<name>.yml` | Excluded from npm. |
| Issue template | `.github/ISSUE_TEMPLATE/<name>.md` | Excluded from npm. |
| Type-only declaration | `src/<name>.d.ts` (rare) | Most types belong in `.ts` files. |
| Benchmark | `bench/<name>.bench.ts` | Run with Vitest's `--mode benchmark`. |
| Documentation | `docs/<name>.md` | Excluded from npm; published to docs site. |
| New peer dependency | `package.json` `peerDependencies` | Also list under `devDependencies` for tests. |

---

## 4. Architecture

### Public API Surface (the only thing consumers see)

```
src/index.ts          ← THE ONLY EXPORT BOUNDARY
   │
   ├─ exports: slugify, truncate, pad
   ├─ exports: SlugifyOptions, TruncateOptions, PadOptions (types)
   │
   ▼
[ tshy build ]
   │
   ├─ dist/esm/index.js       ← consumed by `import { slugify } from "string-helpers"`
   ├─ dist/esm/index.d.ts     ← TypeScript types for ESM
   ├─ dist/commonjs/index.js  ← consumed by `const { slugify } = require("string-helpers")`
   └─ dist/commonjs/index.d.ts ← TypeScript types for CJS
```

### Bundling Boundary

```
┌─────────────────────────────────────────────┐
│  YOUR REPO                                   │
│  ┌────────┐    ┌──────┐    ┌──────────────┐ │
│  │ src/** │ →  │ tshy │ →  │ dist/{esm,   │ │
│  │  *.ts  │    └──────┘    │  commonjs}/  │ │
│  └────────┘                └──────┬───────┘ │
│       │                            │        │
│       │                  publish ──┼───→    │
│       │                            ▼        │
│  ┌────────┐                  [ npm publish ]│
│  │ test/  │ ← never published                │
│  └────────┘                                  │
└─────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────┐
│  CONSUMER (someone using your package)       │
│                                              │
│  TypeScript ESM:                             │
│    import { slugify } from "string-helpers"  │
│    → resolves to dist/esm/index.js + .d.ts   │
│                                              │
│  Node.js CJS:                                │
│    const { slugify } = require(...)          │
│    → resolves to dist/commonjs/index.js      │
│                                              │
│  Bundler (Vite/Webpack/esbuild):             │
│    → reads "exports" map, picks "import"     │
└─────────────────────────────────────────────┘
```

### Resolution Conditions (the `exports` map order)

```
"exports": {
  ".": {
    "import": {
      "types": "./dist/esm/index.d.ts",      ← always first within a condition
      "default": "./dist/esm/index.js"
    },
    "require": {
      "types": "./dist/commonjs/index.d.ts",
      "default": "./dist/commonjs/index.js"
    }
  }
}
```

**tshy writes this for you.** Do not hand-edit.

### Release Flow Diagram

```
[ developer ]
     │
     │ 1. write code on feature branch
     ▼
[ pnpm changeset ]
     │ 2. select bump (patch/minor/major) + summary
     ▼
[ git push ]
     │
     ▼
[ GitHub PR ]
     │ 3. CI: typecheck + lint + test + attw + publint
     │ 4. merge to main
     ▼
[ changesets/action@v1 ]
     │ 5. opens "Version Packages" PR (or publishes if PR already merged)
     │
     ├─→ if no PR exists: opens one bumping versions + writing CHANGELOG.md
     │
     └─→ if PR already merged on main:
            ▼
       [ pnpm changeset publish ]
            │ 6. OIDC requests provenance attestation
            │ 7. npm publish --provenance --access public
            ▼
       [ npm registry + Sigstore + GitHub Release ]
```

### Where Logic Lives

- **`src/<name>.ts`**: a single public function + its types.
- **`src/_<name>.ts`**: internal helpers, never exported from the barrel.
- **`src/index.ts`**: re-exports only. Zero logic.
- **`test/<name>.test.ts`**: tests for `src/<name>.ts`.

### Where Logic Does NOT Live

- `dist/**` — generated. Treat as read-only.
- `package.json` `tshy` block — tshy writes parts of this; do not race it.
- `CHANGELOG.md` — generated by changesets.

### Things This Library Has That Apps Have (and how they differ)

| App concept | Library equivalent |
|---|---|
| Routes | Public exports in `src/index.ts`. |
| Auth | None — libraries do not authenticate. |
| Multi-user | None — libraries are stateless and per-process. |
| Database | None — libraries take inputs, return outputs. |
| Server process | None — libraries run inside the consumer's process. |
| Deploy target | npm registry. |
| Health check | `pnpm test && pnpm pkg:check`. |

---

## 5. Dev Workflow

### Start Dev Loop

```bash
pnpm test --watch        # Vitest in watch mode — primary dev loop
pnpm typecheck --watch   # in a second terminal — catches type errors live
pnpm build --watch       # in a third terminal IF you need to test built output
```

For most library work you only need `pnpm test --watch`. Vitest reads TS source directly via Vite, no build needed.

### Hot Reload Behavior

- Vitest re-runs only affected tests on save.
- Changes to `src/*.ts` → both unit tests for that file and any test that imports from it re-run.
- Changes to `vitest.config.ts`, `tsconfig.json`, `package.json` → restart the watcher.

### Attaching a Debugger

**VS Code / Cursor:** use the launch config in Section 15. Set a breakpoint, hit `F5`, pick "Debug current Vitest file".

**Node-inspect (any editor):**
```bash
pnpm exec vitest --inspect-brk --no-file-parallelism <test-file>
# Then attach via chrome://inspect or node --inspect
```

### Inspecting Built Output Locally

```bash
pnpm build
node --print "require('./dist/commonjs/index.js')"   # CJS smoke
node --input-type=module --eval "import('./dist/esm/index.js').then(console.log)"   # ESM smoke
```

### Pre-commit Checks

The pre-commit hook (Section 13) runs:
```bash
pnpm typecheck && pnpm lint && pnpm test --run
```

If any fails, the commit is blocked.

### Branch + Commit Conventions

- Branch: `feat/<topic>`, `fix/<topic>`, `chore/<topic>`.
- Commit: imperative mood, ≤72-char subject (`fix slugify on diacritics`).
- Every PR that affects published behavior MUST include a changeset (`pnpm changeset`). The CI fails without one.

---

## 6. Testing & Parallelization

### Unit Tests

- Command: `pnpm test` (single run) or `pnpm test --watch`.
- Location: `test/<source-name>.test.ts`.
- Naming: file mirrors source filename. Test names use `it("does X when Y", ...)`.

### Integration Tests

Library integration tests verify the *built* package, not the source:

```bash
pnpm test:integration
```

These are tests that:
1. Import from the built `dist/` (not `src/`).
2. Verify CJS `require` and ESM `import` both work.
3. Run against a packed tarball (`npm pack` → install → import).

### Single Test / File / Watch

```bash
pnpm test test/slugify.test.ts                  # one file
pnpm test -t "handles diacritics"               # by test name
pnpm test --watch                               # watch mode
pnpm test --coverage                            # with coverage
```

### Mocking Rules

- **Mock at module boundaries only.** Use `vi.mock("node:fs")`, never `vi.mock("./slugify")` (that is the unit under test).
- **Never mock the unit under test.** That makes the test tautological.
- **Never mock standard built-ins** (`Array`, `Map`, `Date`) globally — wrap them in injectable seams instead.
- **Never use real network in tests.** This library should not make network calls; if it does, mock at the `fetch` boundary with `vi.spyOn(globalThis, "fetch")`.

### Coverage Target

- **Lines: 90%.** Branches: 85%. Functions: 95%.
- Measured by Vitest's V8 coverage. Fails CI if drops below threshold.
- Command: `pnpm test --coverage`.

### Visual Regression

Not applicable — libraries have no UI. Skip Storybook, skip Chromatic.

### Parallelization Patterns for AI Agents

**Safe to fan out (parallel):**
- Adding three independent public functions in three new files.
- Writing tests for three independent source files.
- Documenting three exports in README.

**Must be sequential:**
- Anything touching `package.json` (lockfile, exports map, scripts).
- Anything touching `tsconfig.json`, `biome.json`, `vitest.config.ts`.
- Anything affecting the `tshy` block (build config).
- Adding a changeset (`.changeset/*.md` files merge cleanly per-changeset, but only one agent should run `pnpm changeset` at a time).
- Bumping a dep (writes `pnpm-lock.yaml`).

---

## 7. Logging

**Libraries do not log.** A library writing to stdout/stderr unprompted is anti-social — it pollutes the consumer's logs and is hard to silence.

Rules:
- Throw typed errors; let the caller catch and log.
- For genuinely useful diagnostic output, accept an optional `logger` parameter typed as `{ debug?(msg: string): void }`.
- Never `console.log` in shipped code. Biome rule `noConsole` enforces this.
- For dev diagnostics inside the library, gate with `if (process.env.STRING_HELPERS_DEBUG)` and namespace the env var.

Sample (rare) opt-in pattern:

```ts
export interface SlugifyOptions {
  separator?: string;
  /** Optional logger for debug diagnostics. */
  logger?: { debug?(msg: string): void };
}
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always read `src/index.ts` before adding a new export — confirm the barrel structure.
2. Always create a new file per public function (`src/<name>.ts`); never grow an existing file.
3. Always export public types from the same file as the function that uses them.
4. Always write a `.test.ts` file alongside any new public function before declaring done.
5. Always run `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check` before claiming a task complete.
6. Always run `pnpm changeset` for any change that affects shipped behavior or types.
7. Always pick the smallest semver bump that is correct: `patch` for fixes, `minor` for additions, `major` for breaking changes.
8. Always keep `engines.node` set to `">=20.19.0"` until the rulebook says otherwise.
9. Always declare `"sideEffects": false` in package.json — verify nothing in `src/` runs at import time.
10. Always use named exports; never `export default` (named imports tree-shake reliably; default imports do not).
11. Always document every public export with a JSDoc block above its declaration.
12. Always verify the built output with `attw --pack .` and `publint .` after any `package.json` or build-config change.
13. Always commit `pnpm-lock.yaml`.
14. Always pin `devDependencies` with `~` (patch) or `^` (minor) — never `*` or `latest`.
15. Always set `peerDependencies` for runtime libs the consumer is expected to provide; never `dependencies`.
16. Always use `import type { Foo } from "..."` for type-only imports — Biome rule enforces this; speeds builds.
17. Always run `pnpm install` after pulling main; the lockfile may have changed.
18. Always update `README.md` examples when changing a public API surface.
19. Always include `LICENSE`, `README.md`, and the built `dist/` in the published tarball — set via `"files"` in `package.json`.
20. Always set the `repository` field in `package.json` to the exact GitHub HTTPS URL — required for OIDC trusted publishing.
21. Always use OIDC trusted publishing in CI; never an `NPM_TOKEN` secret.
22. Always re-run `pnpm install` after editing the `tshy` block — the postinstall regenerates exports.
23. Always verify `dist/` is in `.gitignore`.
24. Always check `pnpm pack --dry-run` output before publishing — confirm what is included.

### 8.2 NEVER

1. Never commit `dist/`. It is regenerated on every install. Add to `.gitignore`.
2. Never publish without a changeset — CI fails without one.
3. Never hand-edit the `exports` field in `package.json` — tshy owns it.
4. Never hand-edit `CHANGELOG.md` — changesets owns it.
5. Never use `export default` for public API. Named exports only.
6. Never import from `dist/` inside source code — only consumers do that.
7. Never call `console.log`, `console.warn`, or `console.error` in shipped library code.
8. Never read `process.env` at import time (top-level). Read inside functions only, lazily.
9. Never bundle dependencies that should be peers (React, Vue, Svelte, etc.).
10. Never use `npm publish` directly — always go through `pnpm changeset publish` (run by CI).
11. Never publish a major version bump without a migration note in the changeset summary.
12. Never add a runtime dependency for a one-line helper. Inline it.
13. Never use `require()` inside source `.ts` files. ESM `import` only.
14. Never set `"type": "commonjs"` at the package root — root is `"type": "module"`. tshy handles per-output `package.json` files.
15. Never publish from a feature branch — only `main` after merge of the changesets-version PR.
16. Never amend or force-push the release commit; the tag is pinned to its SHA.
17. Never use `npm` and `pnpm` in the same repo. pnpm only.
18. Never skip `attw --pack` — the only reliable check that types resolve correctly under both `import` and `require`.
19. Never publish with `--tag latest` for a prerelease — use `--tag next` (changesets handles this if configured).
20. Never expose internal `_*.ts` files via the barrel.
21. Never depend on Node-only built-ins (`fs`, `path`) in code that may run in browsers — gate with feature detection or split into subpath exports.

### 8.3 Blast Radius Reference

| Path | Blast | Verify after change |
|---|---|---|
| `package.json` (any field) | every command, publish | `pnpm install && pnpm typecheck && pnpm test --run && pnpm build && pnpm pkg:check` |
| `package.json` `exports` block | resolution for every consumer | `pnpm build && pnpm exec attw --pack . && pnpm exec publint .` |
| `package.json` `tshy` block | build output layout | full clean build: `rm -rf dist && pnpm build && pnpm pkg:check` |
| `package.json` `files` array | tarball contents | `pnpm pack --dry-run` and verify list |
| `package.json` `engines.node` | who can install | bump major; add changeset; CI matrix should match |
| `package.json` `peerDependencies` | breakage for downstream | bump major; add changeset; document in README |
| `tsconfig.json` | typecheck + IDE | `pnpm typecheck && pnpm build` |
| `tsconfig.build.json` | tshy build (when present) | `pnpm build && diff dist/` |
| `vitest.config.ts` | every test | `pnpm test --run` |
| `biome.json` | lint output | `pnpm lint --write` then commit fixes separately |
| `pnpm-lock.yaml` | reproducibility | `pnpm install --frozen-lockfile && full test run` |
| `.changeset/config.json` | release behavior | dry-run: `pnpm changeset version --snapshot test` |
| `.github/workflows/release.yml` | publish flow | open a draft PR with the workflow change; observe a no-op release run |
| `.github/workflows/ci.yml` | every PR | trigger via PR; verify all jobs run |
| `src/index.ts` (barrel) | public API surface | `attw --pack` + `pnpm test:integration` |
| `src/<name>.ts` (any public file) | consumers using that export | `pnpm test test/<name>.test.ts && pnpm build` |
| `src/_*.ts` (internal) | only in-repo callers | `pnpm test --run` |
| `README.md` examples | doc accuracy | run examples by hand; consider an examples test |
| `LICENSE` | legal + npm metadata | npm shows the license badge from this — keep accurate |
| `.npmrc` (if present) | install resolution | `rm -rf node_modules && pnpm install` |
| `.gitignore` | what gets committed | `git status` and verify no `dist/` or `node_modules/` |
| `node_modules/` | nothing — never edit | n/a; delete and reinstall instead |
| `.changeset/*.md` (a single changeset) | one upcoming version | `pnpm changeset status` to preview |

### 8.4 Definition of Done

**Bug fix:**
- [ ] Failing test added that reproduces the bug.
- [ ] Fix makes the test pass; no other tests fail.
- [ ] `pnpm typecheck` clean.
- [ ] `pnpm lint` clean.
- [ ] `pnpm build && pnpm pkg:check` clean.
- [ ] Changeset added (`patch` bump).
- [ ] No new dependencies.

**New feature (new export):**
- [ ] New file `src/<name>.ts` exporting one named function + its types.
- [ ] Re-exported from `src/index.ts`.
- [ ] Tests in `test/<name>.test.ts` covering happy path + at least 2 edge cases.
- [ ] JSDoc block on the exported symbol.
- [ ] README updated with at least one usage example.
- [ ] Changeset added (`minor` bump).
- [ ] `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check` all green.

**Refactor (no behavior change):**
- [ ] All existing tests pass without modification.
- [ ] No public API change (verify by running `pnpm exec attw --pack .` and comparing the report to before).
- [ ] No changeset (or `patch` if anything could conceivably affect runtime).
- [ ] `pnpm build` output diff is review-friendly.

**Dependency bump:**
- [ ] `pnpm-lock.yaml` is the only file changed besides `package.json`.
- [ ] All scripts pass: `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check`.
- [ ] Major bumps: read upstream CHANGELOG for breaking changes; add changeset noting any user-visible impact.
- [ ] Patch/minor bumps: no changeset needed unless the dep is a `peerDependency`.

**Schema change (none — libraries have no schema):**
Skip this category. If a library exposes a typed schema (Zod, JSON Schema), treat it like a feature change.

**Copy change (README / JSDoc only):**
- [ ] No code changes.
- [ ] No changeset (changesets only for shipped behavior or types).
- [ ] Spell-check.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile          # lockfile honored
pnpm typecheck                          # tsc --noEmit
pnpm lint                               # biome check
pnpm test --run                         # full vitest run
pnpm build                              # tshy → dist/
pnpm pkg:check                          # attw --pack + publint
pnpm pack --dry-run                     # confirm tarball contents
```

**Expected output for each:**

```
$ pnpm typecheck
> tsc --noEmit
(no output, exit code 0)

$ pnpm lint
> biome check .
Checked 14 files in 22ms. No fixes applied.

$ pnpm test --run
 RUN  v4.1.4
 Test Files  3 passed (3)
      Tests  7 passed (7)
   Duration  ~400ms

$ pnpm build
tshy: built ESM to ./dist/esm
tshy: built CJS to ./dist/commonjs
tshy: wrote exports map to package.json

$ pnpm pkg:check
> attw --pack .
✓ no problems found
> publint .
All good!

$ pnpm pack --dry-run
Tarball contents:
  package/dist/esm/index.js
  package/dist/esm/index.d.ts
  package/dist/esm/package.json
  package/dist/commonjs/index.js
  package/dist/commonjs/index.d.ts
  package/dist/commonjs/package.json
  package/LICENSE
  package/README.md
  package/package.json
```

If any step fails, fix it before declaring done. Never paper over with `--no-verify` or `|| true`.

### 8.6 Parallelization Patterns

**Safe parallel fan-out (3+ subagents):**
- Subagent A: write `src/slugify.ts` + `test/slugify.test.ts`.
- Subagent B: write `src/truncate.ts` + `test/truncate.test.ts`.
- Subagent C: write `src/pad.ts` + `test/pad.test.ts`.
- Then sequential: a single agent updates `src/index.ts` to re-export all three, then runs the verification recipe.

**Must be sequential:**
- Any change to `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `tshy` block.
- Adding/removing a dependency (writes lockfile).
- Running `pnpm changeset` (writes a uniquely-named file in `.changeset/`, but only one bump should be added at a time per change).
- Bumping a dev tool's major version.
- Editing `.github/workflows/release.yml`.

---

## 9. Stack-Specific Pitfalls

1. **Symptom**: Consumers get `Cannot find module 'string-helpers'` or `default export is not a function`.
   **Cause**: Hand-edited `exports` in `package.json` is out of sync with `dist/` layout.
   **Fix**: `rm -rf dist && pnpm build` — let tshy regenerate. Never hand-edit.
   **Detect early**: `pnpm exec attw --pack .` fails with "ESM resolution mismatch."

2. **Symptom**: Package size on npm is huge (10+ MB).
   **Cause**: Forgot the `files` field; npm publishes everything not in `.gitignore`.
   **Fix**: Set `"files": ["dist", "LICENSE", "README.md"]` in `package.json`.
   **Detect early**: `pnpm pack --dry-run` lists the contents — review it before publishing.

3. **Symptom**: TypeScript users see `Could not find a declaration file for module`.
   **Cause**: `"types"` condition missing or pointing to a wrong path.
   **Fix**: Let tshy own it; verify with `pnpm exec attw --pack .`.
   **Detect early**: attw flags this with "No types".

4. **Symptom**: `Module not found: dist/esm/index.cjs` at consumer install time.
   **Cause**: Set `"main": "./dist/index.cjs"` but tshy outputs to `dist/commonjs/index.js`.
   **Fix**: Remove hand-set `main`; tshy writes the correct `main`+`exports` automatically.
   **Detect early**: `pnpm exec publint .` fails with "main file does not exist".

5. **Symptom**: `import { foo } from "string-helpers/internal"` works (security/leak).
   **Cause**: No `"exports"` field, or wildcard `./*` — exposes everything.
   **Fix**: Use explicit subpaths in `exports`; tshy defaults are safe.
   **Detect early**: `pnpm exec publint .` flags overly permissive exports.

6. **Symptom**: `npm publish` fails with `403 Forbidden — provenance disabled`.
   **Cause**: CI job missing `permissions: id-token: write`, or repo not configured as a trusted publisher in npm.
   **Fix**: Add `permissions` block to the workflow (see Section 16); configure npm trusted publisher in package settings on npmjs.com.
   **Detect early**: First release run will fail loudly. Test with `npm publish --dry-run --provenance` locally.

7. **Symptom**: CJS consumer gets ESM-only bundle and crashes.
   **Cause**: Missed the `"require"` condition in `exports`; tshy block excluded `commonjs` dialect.
   **Fix**: Set `"tshy": { "dialects": ["esm", "commonjs"] }` in `package.json`.
   **Detect early**: `pnpm exec attw --pack .` fails with "CJS resolution".

8. **Symptom**: Consumer's bundler ships duplicate copies of `string-helpers`.
   **Cause**: "Dual package hazard" — module loaded as both ESM and CJS in same app.
   **Fix**: Keep the library stateless (no module-level mutable state). If state is unavoidable, move it into a separate package and depend on that.
   **Detect early**: Document the constraint; integration test that imports both via `require` and `import` and asserts they share state when needed (or accept the hazard for stateless utils).

9. **Symptom**: `pnpm install` in CI takes forever.
   **Cause**: No lockfile, or `--no-frozen-lockfile`.
   **Fix**: Always commit `pnpm-lock.yaml`; CI uses `pnpm install --frozen-lockfile`.
   **Detect early**: Cold-cache CI run noticeably slower than warm-cache.

10. **Symptom**: Tests pass locally but fail on CI for Node 20.
    **Cause**: Used a Node 22+ API (`Array.prototype.findLast`, native `--watch`, etc.).
    **Fix**: Either bump `engines.node` (major release) or polyfill the API.
    **Detect early**: CI matrix runs Node 20.19, 22.x.

11. **Symptom**: `attw` reports "Masquerading as CJS" for a file in `dist/esm/`.
    **Cause**: `dist/esm/package.json` is missing or `"type": "module"` is missing in it.
    **Fix**: tshy generates this automatically — remove any custom postbuild that overwrites it.
    **Detect early**: `cat dist/esm/package.json` after build; should be `{"type":"module"}`.

12. **Symptom**: `console.log` from library shows up in user's app output.
    **Cause**: Stray debug logging committed to source.
    **Fix**: Remove. Biome `suspicious/noConsole` rule should catch this in CI.
    **Detect early**: `pnpm lint` will fail.

13. **Symptom**: Bumping a `peerDependency` minor shows up as a breaking change for users.
    **Cause**: Tightened the peer range (`^17` → `^18`).
    **Fix**: Treat as `major` bump in the changeset; publish migration notes.
    **Detect early**: Anything modifying `peerDependencies` should auto-add a `major` changeset suggestion.

14. **Symptom**: Subpath import works locally but not when installed.
    **Cause**: Missing entry in `exports` map; only the root `.` is exposed.
    **Fix**: tshy with `"tshy": { "exports": { ".": "./src/index.ts", "./util": "./src/util.ts" } }`. Document subpaths in README.
    **Detect early**: `pnpm exec publint .` flags inconsistent subpaths; integration test importing the subpath.

15. **Symptom**: Released v1.2.3 then v1.2.3 again, second one is rejected.
    **Cause**: Cancelled the changesets PR but tag `v1.2.3` was already pushed; tried to republish.
    **Fix**: Bump (e.g. `pnpm changeset` with another patch) and republish as v1.2.4. Never republish the same version.
    **Detect early**: changesets/action checks remote tags before publishing.

16. **Symptom**: `npm install string-helpers` warns about peer dep mismatch.
    **Cause**: Bumped a peer dep range without bumping major.
    **Fix**: Yank the bad version (`npm deprecate string-helpers@1.2.3 "..."`) and republish a `major` bump.
    **Detect early**: PR review on any `peerDependencies` change.

17. **Symptom**: Built `dist/esm/index.js` contains `require(...)` calls.
    **Cause**: Imported a CJS-only dependency directly in source.
    **Fix**: Pick an ESM-compatible alternative or wrap with `createRequire(import.meta.url)`.
    **Detect early**: `node --input-type=module --eval "import('./dist/esm/index.js')"` fails or warns.

18. **Symptom**: Provenance attestation fails: "could not match repository to GitHub Actions workflow".
    **Cause**: `package.json` `repository.url` does not exactly match the GitHub repo URL.
    **Fix**: Set `"repository": {"type":"git","url":"git+https://github.com/<user>/<repo>.git"}` exactly.
    **Detect early**: Document the exact format in CLAUDE.md; CI smoke-tests `npm publish --dry-run --provenance`.

19. **Symptom**: `pnpm changeset publish` does nothing on CI.
    **Cause**: No `.changeset/*.md` files exist (other than `README.md` and `config.json`).
    **Fix**: That's correct — there's nothing to release. CI is fine. Add a changeset on the next change.
    **Detect early**: `pnpm changeset status` shows "no changes detected".

20. **Symptom**: Published package has `node_modules/` inside the tarball.
    **Cause**: No `files` field; `.npmignore` missing or wrong.
    **Fix**: Set `"files": ["dist", "LICENSE", "README.md"]`. Delete `.npmignore` if present.
    **Detect early**: `pnpm pack --dry-run`.

---

## 10. Performance Budgets

For a util library like `string-helpers`:

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (require/import) | <10 ms on Node 22 | `node --eval "console.time('x'); require('./dist/commonjs/index.js'); console.timeEnd('x')"` |
| Bundle size (ESM, gzipped) | <5 KB for a util library | `pnpm exec size-limit` or `gzip -c dist/esm/index.js \| wc -c` |
| Bundle size (CJS, gzipped) | <5 KB | same |
| Tree-shake test | importing `slugify` only must drop other exports | bundle-test fixture: `import { slugify } from "string-helpers"; console.log(slugify("a"))` → run through esbuild → grep for `truncate`/`pad`. Should be absent. |
| Test suite runtime | <2 s for full unit run | `pnpm test --run` time output |
| Build time | <5 s for `pnpm build` from clean | `time pnpm build` |
| Memory | <100 MB peak during build | `/usr/bin/time -l pnpm build` |

When budget exceeded:
- Bundle bloat → check for accidentally-bundled deps (should be peers or external).
- Slow tests → profile with `pnpm test --reporter=verbose --logHeapUsage`.
- Slow build → consider scoping `tshy.exports` more tightly.

---

## 11. Security

### Secret Storage

**Libraries should not handle secrets at all.** Do not read `process.env.API_KEY` inside the library — accept it as a function parameter.

For the library's own dev tooling:
- `.env.local` (git-ignored) for local-only config (rare).
- npm publishing: OIDC trusted publishing (no `NPM_TOKEN`).
- GitHub: repo settings → Actions → use OIDC.

### Auth Threat Model

Not applicable — libraries do not authenticate users. The threat model concerns supply-chain integrity:

- **Threat**: Compromised maintainer publishes malware.
  **Mitigation**: 2FA on npm; trusted publishing via OIDC removes long-lived tokens; provenance attestation lets users verify origin.
- **Threat**: Lockfile injection (someone PRs a malicious dep).
  **Mitigation**: PR review, `pnpm audit` in CI, Renovate/Dependabot only opens PRs (does not auto-merge).
- **Threat**: Typosquatting attacks (someone publishes `string-helprs`).
  **Mitigation**: Use a scoped name (`@yourname/string-helpers`); reserve obvious typos if possible.

### Input Validation Boundary

A library's "input" is its public function arguments. Validate at the public boundary; trust internal calls.

```ts
export function slugify(input: string, opts: SlugifyOptions = {}): string {
  if (typeof input !== "string") {
    throw new TypeError(`slugify: input must be a string, got ${typeof input}`);
  }
  // ... internal helpers can trust `input` is a string
}
```

### Output Escaping Rules

- Any function that produces HTML/SQL/shell output MUST escape by default.
- Document the escape strategy in JSDoc.
- Provide an explicit opt-out (`unsafe: true`) if absolutely needed; reject otherwise.

### Permissions / Capabilities

Not applicable. Libraries inherit the consumer's permissions.

### Dependency Audit

```bash
pnpm audit --prod                    # production deps only
pnpm audit --audit-level=moderate    # fail on moderate+
```

Run in CI on every PR. Schedule a weekly Renovate/Dependabot run for non-breaking bumps.

### Top 5 Stack-Specific Risks

1. **Postinstall scripts in deps** — opt out: `pnpm config set ignore-scripts true` for build infra; allow on a case-by-case basis.
2. **Phantom deps** (using a transitive dep directly) — pnpm's strict mode prevents this; do not switch off `hoist-pattern`.
3. **Compromised devDependency** building/signing your release — pin major versions; review lockfile diffs in PRs.
4. **`exports` map leaking internals** — keep `exports` minimal; let tshy own it.
5. **Provenance disabled silently** — CI must hard-fail if `id-token: write` is missing or `--provenance` is rejected.

---

## 12. Publish + Version Flow (the library equivalent of "Deploy")

### The Full Release Flow, Command by Command

#### A. Developer side (write the change)

```bash
# 1. branch
git checkout -b feat/add-pad-left

# 2. write code + tests
# ... edit src/pad.ts, test/pad.test.ts, src/index.ts ...

# 3. verify locally
pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check

# 4. add a changeset
pnpm changeset
# Interactive prompts:
#   - Which packages? (single-package repo: pre-selected)
#   - Major / Minor / Patch? minor (new export)
#   - Summary: "Add padLeft function for left-aligned string padding"

# 5. commit (the changeset is now in .changeset/<id>.md)
git add .
git commit -m "feat: add padLeft"
git push -u origin feat/add-pad-left

# 6. open PR
gh pr create --fill
```

#### B. CI side (PR validation)

```yaml
# .github/workflows/ci.yml runs:
- pnpm install --frozen-lockfile
- pnpm typecheck
- pnpm lint
- pnpm test --run --coverage
- pnpm build
- pnpm pkg:check
- pnpm changeset status --since=origin/main   # fails if PR has no changeset
```

#### C. Merge → release flow

```
[ merge feat/add-pad-left → main ]
              │
              ▼
[ changesets/action@v1 in release.yml ]
              │
   ┌──────────┴──────────┐
   │                     │
   ▼                     ▼
[ open "Version Packages" PR ]   [ if PR already merged: publish ]
   │                                    │
   │ shows diff:                        │ runs `pnpm changeset publish`
   │ - bumps package.json version       │   ├─ npm publish --provenance
   │ - regenerates CHANGELOG.md         │   ├─ creates git tag v1.2.0
   │ - removes consumed .changeset/*.md │   ├─ creates GitHub Release
   │                                    │   └─ syncs release notes from CHANGELOG
   │                                    │
   ▼                                    ▼
[ review + merge ]               [ npm registry has v1.2.0 ]
```

### Staging vs Prod Separation

Libraries do not have staging. Prerelease channels are the equivalent:

- `latest` tag = production (default; what `npm install` picks).
- `next` tag = pre-release (`npm install string-helpers@next`).
- `alpha` / `beta` tags = early testing.

Set up via changesets prerelease mode:
```bash
pnpm changeset pre enter next      # enter pre-release mode
# normal commits → published to "next" tag
pnpm changeset pre exit            # exit pre-release; next merge promotes to "latest"
```

### Rollback

```bash
# 1. Within 72h of publish, with no downloads, you can unpublish (rare).
npm unpublish string-helpers@1.2.0

# 2. After 72h or if downloaded — DEPRECATE the bad version, do not unpublish:
npm deprecate string-helpers@1.2.0 "Critical regression in slugify; upgrade to 1.2.1."

# 3. Fix forward: ship 1.2.1.
```

**Max safe rollback window**: 72 hours; in practice, fix forward unless the version is completely broken.

### Health Check / Smoke

After each publish, the workflow runs:

```bash
# In a fresh temp dir
mkdir -p /tmp/string-helpers-smoke && cd /tmp/string-helpers-smoke
echo '{"name":"smoke","type":"module"}' > package.json
npm install string-helpers@latest
node --eval "import('string-helpers').then(m => { if (typeof m.slugify !== 'function') process.exit(1); })"
echo $?   # 0 = green
```

This is automated in `.github/workflows/release.yml` as a post-publish step.

### Versioning Scheme

- Strict [SemVer](https://semver.org/).
- `version` lives in `package.json`. changesets writes it.
- Git tags: `v<major>.<minor>.<patch>` (e.g. `v1.2.0`).
- GitHub Releases: title `v1.2.0`, body = changeset summary.

### Auto-Update / Store Submission

Libraries do not have stores. Consumers update via their package manager:

```bash
npm update string-helpers           # within semver range
npm install string-helpers@latest   # latest
```

The library publisher controls the npm `dist-tag`:
- `latest` → default for `npm install string-helpers`.
- `next` → pre-release.
- Set via changesets config or `npm dist-tag add`.

### DNS / Domain Wiring

n/a — npm registry provides the URL.

### Cost Estimate

- npmjs.com: free for public packages, unlimited downloads.
- GitHub Actions (public repos): free.
- **Total: $0/month for unlimited consumers.**

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# string-helpers — Claude Code config

This package is governed by `npm-package.md` rulebook. Read it before any change.

## Package facts
- Stack: TypeScript 6 → tshy → dual ESM+CJS on npmjs.com.
- Manager: pnpm (NEVER use npm or yarn in this repo).
- Tests: Vitest. Tests live in `test/`, sources in `src/`.
- Build: `pnpm build` runs tshy. Output goes to `dist/`. dist/ is gitignored.
- Versioning: changesets. Every shipping change needs `pnpm changeset`.
- Publish: OIDC trusted publishing via GitHub Actions. No NPM_TOKEN.

## Always-run before declaring done
```bash
pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check
```

## Banned patterns
- No `console.log` in `src/**`.
- No `export default`.
- No editing `dist/**` or the `exports` field of package.json.
- No editing CHANGELOG.md.
- No `npm install` (use pnpm).
- No publishing locally (`npm publish`); publishes happen in CI.
- No reading `process.env` at module top-level inside `src/`.

## Adding a new export
1. Create `src/<name>.ts` with one named export + JSDoc.
2. Re-export from `src/index.ts`.
3. Create `test/<name>.test.ts`.
4. `pnpm changeset` (minor bump, descriptive summary).
5. Run the verify recipe.

## Useful skills
- `/test-driven-development` for new exports — write the test first.
- `/systematic-debugging` for any bug fix — find root cause before patching.
- `/verification-before-completion` before opening a PR.
- `/review` before requesting human review.
```

### `.claude/settings.json` (paste-ready)

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install:*)",
      "Bash(pnpm i:*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm typecheck:*)",
      "Bash(pnpm lint:*)",
      "Bash(pnpm build:*)",
      "Bash(pnpm pkg:check:*)",
      "Bash(pnpm pack:*)",
      "Bash(pnpm changeset:*)",
      "Bash(pnpm exec attw:*)",
      "Bash(pnpm exec publint:*)",
      "Bash(pnpm exec biome:*)",
      "Bash(pnpm exec vitest:*)",
      "Bash(pnpm exec tsc:*)",
      "Bash(git status:*)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git checkout:*)",
      "Bash(git branch:*)",
      "Bash(git push:*)",
      "Bash(gh pr create:*)",
      "Bash(gh pr view:*)",
      "Bash(gh pr checks:*)",
      "Bash(node --eval:*)",
      "Bash(node --print:*)"
    ],
    "deny": [
      "Bash(npm install:*)",
      "Bash(npm i:*)",
      "Bash(npm publish:*)",
      "Bash(yarn:*)",
      "Bash(rm -rf src:*)",
      "Bash(rm -rf .git:*)",
      "Bash(git push --force:*)",
      "Bash(git reset --hard:*)"
    ]
  },
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash(npm publish*)",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'BLOCKED: publish only from CI via changesets/action.' && exit 1"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit(src/**.ts)|Write(src/**.ts)|Edit(test/**.ts)|Write(test/**.ts)",
        "hooks": [
          {
            "type": "command",
            "command": "pnpm exec biome check --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pnpm typecheck >/dev/null 2>&1 && echo 'typecheck: green' || echo 'typecheck: FAILING — fix before claiming done'"
          }
        ]
      }
    ]
  }
}
```

### Recommended Slash Commands & Skills

| When | Skill / command |
|---|---|
| Starting a new export | `/test-driven-development` |
| Fixing a bug | `/systematic-debugging` |
| About to claim done | `/verification-before-completion` |
| Reviewing your own PR | `/review` |
| Opening a PR | `/ship` |
| Stuck on a CJS/ESM resolution issue | run `pnpm exec attw --pack .` and read its report |

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# string-helpers — Codex agent config

Read `npm-package.md` rulebook first.

## Project shape
- TypeScript library, dual ESM+CJS via tshy, published to npmjs.com.
- Manager: pnpm only.
- Tests: Vitest in `test/`.
- Source: `src/<name>.ts`, re-exported from `src/index.ts`.
- Build: `pnpm build` → `dist/` (gitignored).

## Required commands before claiming a task done
1. `pnpm typecheck`
2. `pnpm lint`
3. `pnpm test --run`
4. `pnpm build`
5. `pnpm pkg:check`

## Required for any shipping change
`pnpm changeset` (interactive); commit the resulting `.changeset/<id>.md`.

## Forbidden
- Editing `dist/**`, `CHANGELOG.md`, or the `exports` field of `package.json`.
- `npm install` / `yarn` (pnpm only).
- `console.log` in `src/**`.
- Local `npm publish` (CI handles it via OIDC).
- `export default`.

## Differences from Claude Code workflow
- Codex defaults to a more aggressive sandbox; library work is fine in default mode.
- For multi-file refactors that touch lockfile + sources, do them in a single Codex turn (Codex chunks better than parallel sub-agents).
```

### `.codex/config.toml`

```toml
model = "gpt-5"
approval_policy = "on-request"

[sandbox]
mode = "workspace-write"
network_access = false   # only enable if a task genuinely needs npm registry access
exclude_writable_roots = ["dist", "node_modules", ".changeset/config.json"]

[mcp_servers.shell]
command = "pnpm"

[shell]
allow = [
  "pnpm install",
  "pnpm test",
  "pnpm typecheck",
  "pnpm lint",
  "pnpm build",
  "pnpm pkg:check",
  "pnpm changeset",
  "pnpm exec attw",
  "pnpm exec publint",
  "git status",
  "git diff",
  "git add",
  "git commit",
]
deny = [
  "npm publish",
  "npm install",
  "yarn",
  "rm -rf src",
  "git push --force",
]
```

### Where Codex Differs

- Codex tends to want to install a dep before attempting any code; remind it to check existing imports first.
- Codex is more likely than Claude to hand-edit `exports` or `main` — paste the "tshy owns this" rule into the system prompt.
- Codex sandbox blocks network by default; set `network_access = true` only for the rare task that needs `npm view`/`npm audit`.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```markdown
# string-helpers Cursor rules

You are working on a TypeScript library published to npm.

## ALWAYS
- Use pnpm, never npm or yarn.
- One named export per file under src/.
- Tests live in test/, mirror source filename + `.test.ts`.
- Run `pnpm changeset` for any change to shipped behavior.
- Run `pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check` before declaring done.
- Use `import type { … }` for type-only imports.
- Use named exports; never `export default`.
- Set "files": ["dist", "LICENSE", "README.md"] in package.json.

## NEVER
- Edit dist/. It is generated.
- Edit CHANGELOG.md. Generated by changesets.
- Hand-edit "exports" field. tshy owns it.
- console.log in src/.
- export default anything.
- Read process.env at module top level.
- Run `npm install`, `npm publish`, `yarn`.
- Bundle peer dependencies.

## Architecture
- src/index.ts is the only barrel. Zero logic.
- src/<name>.ts: one public function + types.
- src/_<name>.ts: internal, never re-exported.

## Verification
Before merge: pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "vitest.explorer",
    "ms-vscode.vscode-typescript-next",
    "github.vscode-github-actions",
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
      "type": "node",
      "request": "launch",
      "name": "Debug current Vitest file",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${relativeFile}", "--no-file-parallelism"],
      "smartStep": true,
      "console": "integratedTerminal"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Debug all Vitest tests",
      "autoAttachChildProcesses": true,
      "skipFiles": ["<node_internals>/**", "**/node_modules/**"],
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "--no-file-parallelism"],
      "smartStep": true,
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
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  }
}
```

---

## 16. First-PR Scaffold

Create these files, in order. After the last one, `git push` + a manual changeset PR yields v1.0.0 on npm.

### 1. `package.json`

```json
{
  "name": "string-helpers",
  "version": "0.0.0",
  "description": "A small collection of string utilities: slugify, truncate, pad.",
  "license": "MIT",
  "author": "Your Name <you@example.com>",
  "homepage": "https://github.com/YOUR_GH_USER/string-helpers#readme",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/YOUR_GH_USER/string-helpers.git"
  },
  "bugs": {
    "url": "https://github.com/YOUR_GH_USER/string-helpers/issues"
  },
  "keywords": ["string", "slugify", "truncate", "pad", "utility"],
  "engines": {
    "node": ">=20.19.0"
  },
  "type": "module",
  "sideEffects": false,
  "files": [
    "dist",
    "LICENSE",
    "README.md"
  ],
  "publishConfig": {
    "access": "public",
    "provenance": true
  },
  "scripts": {
    "build": "tshy",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "pkg:check": "attw --pack . && publint .",
    "release": "pnpm build && changeset publish",
    "prepublishOnly": "pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check"
  },
  "tshy": {
    "exports": {
      ".": "./src/index.ts",
      "./package.json": "./package.json"
    },
    "dialects": ["esm", "commonjs"]
  },
  "devDependencies": {
    "@arethetypeswrong/cli": "^0.18.0",
    "@biomejs/biome": "~2.4.0",
    "@changesets/cli": "^2.27.0",
    "@types/node": "^22.0.0",
    "publint": "^0.3.18",
    "tshy": "^3.0.0",
    "typescript": "~6.0.3",
    "vitest": "^4.1.4"
  },
  "packageManager": "pnpm@9.15.0"
}
```

### 2. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["src/**/*", "test/**/*", "vitest.config.ts"]
}
```

### 3. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "includes": ["src/**", "test/**"]
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
      "suspicious": {
        "noConsole": "error",
        "noExplicitAny": "error"
      },
      "style": {
        "noDefaultExport": "error",
        "useImportType": "error",
        "useExportType": "error"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

### 4. `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      include: ["src/**/*.ts"],
      exclude: ["src/index.ts", "src/_*.ts"],
      thresholds: {
        lines: 90,
        branches: 85,
        functions: 95,
        statements: 90,
      },
    },
  },
});
```

### 5. `.changeset/config.json`

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.0.0/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### 6. `.gitignore`

```
node_modules/
dist/
coverage/
.DS_Store
*.tgz
.env
.env.local
.vscode/*.log
```

### 7. `.npmignore`

(Optional. With `"files"` set in `package.json`, this is redundant. If included, keep minimal.)

```
# "files" in package.json is authoritative.
# This file is a fallback only.
src/
test/
.changeset/
.github/
```

### 8. `LICENSE` (MIT)

```
MIT License

Copyright (c) 2026 Your Name

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 9. `README.md`

```markdown
# string-helpers

A small collection of string utilities.

## Install

```bash
npm install string-helpers
# or
pnpm add string-helpers
```

## Usage

```ts
import { slugify, truncate, pad } from "string-helpers";

slugify("Hello, World!");          // "hello-world"
truncate("Long text", 4);          // "Long…"
pad("42", 5, "0");                  // "00042"
```

Works in both ESM and CommonJS.

## API

### `slugify(input: string, opts?: SlugifyOptions): string`

Converts a string to a URL-safe slug. Lowercases, replaces non-alphanumerics with `separator` (default `-`).

### `truncate(input: string, length: number, opts?: TruncateOptions): string`

Truncates to `length` characters, appending `ellipsis` (default `…`).

### `pad(input: string, length: number, fill?: string): string`

Right-pads `input` with `fill` (default `" "`) until it reaches `length`.

## License

MIT
```

### 10. `src/index.ts`

```ts
export { slugify } from "./slugify.js";
export type { SlugifyOptions } from "./slugify.js";
export { truncate } from "./truncate.js";
export type { TruncateOptions } from "./truncate.js";
export { pad } from "./pad.js";
```

### 11. `src/slugify.ts`

```ts
export interface SlugifyOptions {
  /** Separator between words. Default: "-". */
  separator?: string;
  /** Lowercase the result. Default: true. */
  lower?: boolean;
}

/**
 * Convert a string to a URL-safe slug.
 *
 * @example
 *   slugify("Hello, World!") // "hello-world"
 */
export function slugify(input: string, opts: SlugifyOptions = {}): string {
  if (typeof input !== "string") {
    throw new TypeError(`slugify: input must be a string, got ${typeof input}`);
  }
  const sep = opts.separator ?? "-";
  const lower = opts.lower ?? true;
  let s = input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, sep)
    .replace(new RegExp(`^${escapeRegex(sep)}+|${escapeRegex(sep)}+$`, "g"), "");
  if (lower) s = s.toLowerCase();
  return s;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

### 12. `src/truncate.ts`

```ts
export interface TruncateOptions {
  /** Suffix appended when truncated. Default: "…". */
  ellipsis?: string;
}

/**
 * Truncate to at most `length` characters, appending an ellipsis.
 *
 * @example
 *   truncate("hello world", 5) // "hello…"
 */
export function truncate(input: string, length: number, opts: TruncateOptions = {}): string {
  if (typeof input !== "string") {
    throw new TypeError(`truncate: input must be a string, got ${typeof input}`);
  }
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`truncate: length must be a non-negative integer, got ${length}`);
  }
  const ellipsis = opts.ellipsis ?? "…";
  if (input.length <= length) return input;
  return input.slice(0, length) + ellipsis;
}
```

### 13. `src/pad.ts`

```ts
/**
 * Right-pad `input` with `fill` until it reaches `length`.
 *
 * @example
 *   pad("42", 5, "0") // "42000"
 */
export function pad(input: string, length: number, fill = " "): string {
  if (typeof input !== "string") {
    throw new TypeError(`pad: input must be a string, got ${typeof input}`);
  }
  if (!Number.isInteger(length) || length < 0) {
    throw new RangeError(`pad: length must be a non-negative integer, got ${length}`);
  }
  if (fill.length === 0) {
    throw new RangeError("pad: fill must be a non-empty string");
  }
  return input.padEnd(length, fill);
}
```

### 14. `test/slugify.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { slugify } from "../src/slugify.js";

describe("slugify", () => {
  it("lowercases and replaces spaces with dashes", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips diacritics", () => {
    expect(slugify("Crème Brûlée")).toBe("creme-brulee");
  });

  it("respects separator option", () => {
    expect(slugify("Hello World", { separator: "_" })).toBe("hello_world");
  });

  it("throws on non-string input", () => {
    // @ts-expect-error testing runtime guard
    expect(() => slugify(42)).toThrow(TypeError);
  });
});
```

### 15. `test/truncate.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { truncate } from "../src/truncate.js";

describe("truncate", () => {
  it("returns input unchanged when shorter than length", () => {
    expect(truncate("hi", 10)).toBe("hi");
  });

  it("truncates and appends ellipsis", () => {
    expect(truncate("hello world", 5)).toBe("hello…");
  });

  it("rejects negative length", () => {
    expect(() => truncate("x", -1)).toThrow(RangeError);
  });
});
```

### 16. `test/pad.test.ts`

```ts
import { describe, expect, it } from "vitest";
import { pad } from "../src/pad.js";

describe("pad", () => {
  it("right-pads with spaces by default", () => {
    expect(pad("hi", 5)).toBe("hi   ");
  });

  it("right-pads with custom fill", () => {
    expect(pad("42", 5, "0")).toBe("42000");
  });

  it("rejects empty fill", () => {
    expect(() => pad("x", 5, "")).toThrow(RangeError);
  });
});
```

### 17. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

jobs:
  verify:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        node: [20.19, 22]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: ${{ matrix.node }}
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test --run --coverage
      - run: pnpm build
      - run: pnpm pkg:check
      - name: Require changeset on PR
        if: github.event_name == 'pull_request'
        run: pnpm changeset status --since=origin/${{ github.base_ref }}
```

### 18. `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

concurrency:
  group: release-${{ github.ref }}
  cancel-in-progress: false

permissions:
  contents: write     # tag + create GitHub Release
  pull-requests: write # open the version-packages PR
  id-token: write     # OIDC for npm provenance & trusted publishing

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          registry-url: https://registry.npmjs.org
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Create Release PR or Publish
        uses: changesets/action@v1
        with:
          publish: pnpm release
          version: pnpm changeset version
          commit: "chore: release"
          title: "chore: release"
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # No NPM_TOKEN — OIDC trusted publishing handles auth.
          # Configure trusted publisher at: npmjs.com → package settings → publishing access.
```

### 19. `vitest.integration.config.ts` (optional, for built-output tests)

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["test/integration/**/*.test.ts"],
    testTimeout: 30_000,
  },
});
```

After creating these files:

```bash
pnpm install
pnpm typecheck && pnpm lint && pnpm test --run && pnpm build && pnpm pkg:check
git add .
git commit -m "feat: initial library scaffold"
gh repo create string-helpers --public --source=. --remote=origin --push

# Configure npm trusted publisher BEFORE first release:
#   1. Go to npmjs.com → log in → claim the package name (publish a 0.0.1 manually first time, or)
#   2. For first publish: pnpm changeset → pnpm changeset version → npm publish (manual one-time)
#   3. After: npmjs.com → package → "Publishing access" → add GitHub Actions trusted publisher
#       Repo: YOUR_GH_USER/string-helpers
#       Workflow: .github/workflows/release.yml
#       Environment: (leave blank or configure)
#   4. All subsequent releases via the changesets PR flow.
```

---

## 17. Library → first published v1.0.0

Five-phase plan from empty repo to v1.0.0 on npm.

### Phase 1 — Public API Surface (~1 AI session)

- Decide the 1–5 functions the v1.0.0 library exports.
- For `string-helpers`: `slugify`, `truncate`, `pad`.
- Files touched: `src/index.ts`, `src/<name>.ts` per export, JSDoc on each.
- Exit criteria: `pnpm typecheck` clean; README API section drafted.

### Phase 2 — Build & Publish Plumbing (~1 AI session)

- Wire up tshy, biome, vitest, changesets, attw, publint.
- Files touched: `package.json`, `tsconfig.json`, `biome.json`, `vitest.config.ts`, `.changeset/config.json`.
- Verify: `pnpm build && pnpm pkg:check` clean. `pnpm pack --dry-run` shows only `dist/`, `LICENSE`, `README.md`.
- Exit criteria: full verification recipe green.

### Phase 3 — Test Coverage to Threshold (~1–2 AI sessions)

- Write tests for every public function: happy path + ≥2 edge cases + 1 input-validation case.
- Files touched: `test/<name>.test.ts` per source file.
- Exit criteria: `pnpm test --run --coverage` ≥ 90% lines.

### Phase 4 — CI + Trusted Publishing (~1 AI session)

- Add `.github/workflows/ci.yml` and `.github/workflows/release.yml`.
- Configure npm trusted publisher in npmjs.com package settings.
- Run a `--dry-run` release in CI by labeling a PR `release-test` (or skip and trust the wiring).
- Exit criteria: a PR shows green CI; the release workflow runs successfully on merge with no changesets (no-op).

### Phase 5 — First Real Release (v1.0.0)

- `pnpm changeset` → major bump (or whatever the first published version is); summary describing the v1.0.0 surface.
- Open PR, merge.
- changesets/action opens "Version Packages" PR; review the version bump and CHANGELOG.
- Merge "Version Packages" PR.
- Workflow publishes to npm with provenance. GitHub Release auto-created.
- Smoke test: in a fresh dir, `npm install string-helpers@1.0.0`, run a `node --eval "require(\"string-helpers\").slugify(\"hi\")"`.
- Exit criteria: `npm view string-helpers version` returns `1.0.0`; provenance badge visible on npm page.

---

## 18. Feature Recipes

App-style features (auth, payments, push, search, i18n, dark mode, analytics, OAuth, file upload) **do not apply to libraries**. A library's "features" are exports. Below are library-relevant recipes.

### Recipe 1: Add a new public export

**Files to touch:**

1. `src/<name>.ts` — one named export + JSDoc + types.
2. `src/index.ts` — add `export { … } from "./<name>.js";` and `export type { … } from "./<name>.js";`.
3. `test/<name>.test.ts` — happy path + 2 edges + 1 input-validation.
4. `README.md` — add to API section with example.
5. `.changeset/<auto>.md` — `pnpm changeset` (minor).

### Recipe 2: Add a subpath export (`string-helpers/url`)

1. Create `src/url/index.ts` with the subpath's exports.
2. Edit `package.json` `tshy.exports`:

```json
"tshy": {
  "exports": {
    ".": "./src/index.ts",
    "./url": "./src/url/index.ts",
    "./package.json": "./package.json"
  },
  "dialects": ["esm", "commonjs"]
}
```

3. Run `pnpm install` (regenerates `exports` map in package.json).
4. Run `pnpm build && pnpm pkg:check`.
5. Add tests at `test/url.test.ts` importing `from "../src/url/index.js"`.
6. Document in README.
7. Add changeset (minor).

### Recipe 3: Mark a function as deprecated

1. Add `@deprecated` JSDoc tag in `src/<name>.ts`:
   ```ts
   /**
    * @deprecated since 1.5.0. Use `newFn` instead.
    */
   export function oldFn(...) { ... }
   ```
2. Keep the implementation working.
3. Add changeset (minor — adding the deprecation is non-breaking).
4. README: move to a "Deprecated" section.
5. Plan removal in next major; track in an issue.

### Recipe 4: Remove a deprecated export (breaking change)

1. Delete `src/<name>.ts`.
2. Remove from `src/index.ts`.
3. Delete `test/<name>.test.ts`.
4. Update README.
5. `pnpm changeset` → **major** bump; summary explains migration path.

### Recipe 5: Bump a peer dependency major

1. Edit `package.json` `peerDependencies` (e.g. `"react": "^18"` → `"react": "^19"`).
2. Update CI matrix to test against the new major.
3. Update README install instructions.
4. `pnpm changeset` → **major** bump; document migration.

### Recipe 6: Add a Node-only API behind a subpath

If your library has both pure-JS and Node-only utilities, split:

1. Pure-JS: `src/index.ts`.
2. Node-only: `src/node/index.ts` (uses `node:fs`, etc.).
3. tshy `exports`:
   ```json
   "tshy": {
     "exports": {
       ".": "./src/index.ts",
       "./node": "./src/node/index.ts"
     }
   }
   ```
4. Document: "import from `string-helpers/node` for filesystem helpers."
5. Tests: only the node subpath imports `node:` modules.

### Recipe 7: Pre-release a beta (v2.0.0-beta.0)

```bash
pnpm changeset pre enter beta
pnpm changeset                    # add your changes; choose major bump
git commit -am "chore: enter beta"
git push
# changesets/action publishes with --tag beta
# users install via: npm install string-helpers@beta
# When ready:
pnpm changeset pre exit
git commit -am "chore: exit beta"
# Next release publishes the final v2.0.0 to "latest".
```

### Recipe 8: Add benchmarks

1. `pnpm add -D vitest` (already there).
2. Create `bench/slugify.bench.ts`:
   ```ts
   import { bench, describe } from "vitest";
   import { slugify } from "../src/slugify.js";
   describe("slugify", () => {
     bench("ascii", () => { slugify("hello world"); });
     bench("unicode", () => { slugify("Crème Brûlée"); });
   });
   ```
3. Add script: `"bench": "vitest bench --run"`.
4. Run with `pnpm bench`. CI optional.

### Recipe 9: Add a CLI entry (`string-helpers-cli`)

1. Add `src/cli/index.ts` with a `#!/usr/bin/env node` shebang.
2. In `package.json`:
   ```json
   "bin": { "string-helpers": "./dist/esm/cli/index.js" }
   ```
3. Set `tshy.exports` to also expose `./cli`.
4. After build, `chmod +x dist/esm/cli/index.js` (tshy preserves shebang; chmod usually auto on POSIX).
5. Test by `npm pack && npx ./*.tgz hello-world`.

### Recipe 10: Add provenance badge to README

After your first provenance-attested publish, npm shows a badge automatically on the package page. To link it in README:

```markdown
[![npm version](https://img.shields.io/npm/v/string-helpers.svg)](https://npmjs.com/package/string-helpers)
[![npm provenance](https://img.shields.io/badge/provenance-attested-green)](https://docs.npmjs.com/generating-provenance-statements)
```

---

## 19. Troubleshooting (top errors)

| Error | Fix |
|---|---|
| `error TS2307: Cannot find module 'string-helpers' or its corresponding type declarations.` | Consumer's TS `moduleResolution` is too old. Document required: `"moduleResolution": "Bundler"` or `"NodeNext"`. |
| `Error [ERR_REQUIRE_ESM]: require() of ES Module ...` | Consumer is on CJS but resolved the ESM file. Check `exports.require` is set. Run `pnpm exec attw --pack .`. |
| `npm error code E403 — You cannot publish over the previously published versions` | Bump the version. Cannot republish same version. |
| `npm error code ENEEDAUTH` | Locally: `npm login`. CI: ensure OIDC `id-token: write` permission is set. |
| `npm error 404 Not Found - PUT https://registry.npmjs.org/<name>` | Package name unclaimed. Either `npm publish` once manually to claim, or scoped name typo. |
| `Cannot find name 'process'` in build | Add `"types": ["node"]` to tsconfig. |
| `error: Could not resolve "@biomejs/biome"` (CI) | `pnpm install --frozen-lockfile` failed; lockfile out of sync. Run `pnpm install` locally and commit. |
| `attw: 🚭 No types` | Missing `types` condition or `dist/<dialect>/index.d.ts` not emitted. Rebuild; ensure tsconfig has `"declaration": true`. |
| `attw: ⚠️ Masquerading as ESM` | `dist/esm/package.json` is missing or wrong. Let tshy regenerate; do not write into `dist/`. |
| `publint: pkg.main is "X" but file does not exist` | Hand-edited `main` is stale. Remove it; tshy writes correct `main`. |
| `publint: pkg.types should not be set with pkg.exports` | Remove `types`; let exports map carry types per condition. |
| `vitest is not configured to find tests in src/**` | Tests live in `test/`, not `src/`. Move them. |
| `tshy: dialects must include 'esm' and 'commonjs'` | Add `"dialects": ["esm", "commonjs"]` to `package.json` `tshy` block. |
| `Error: lockfile is not up to date with package.json` (CI) | Run `pnpm install` locally; commit the new lockfile. |
| `Cannot find module './slugify.js'` after import | TS `verbatimModuleSyntax` requires `.js` import suffix. Keep the `.js` even though source is `.ts`. |
| `npm error notarget No matching version found for ... @latest` | First publish hasn't happened yet. Manual one-time `npm publish` after `pnpm build`, then automate via changesets. |
| `RangeError: Invalid string length` (in your tests) | Fuzz tests sending huge inputs. Check function for unbounded loops. |
| `Provenance is currently not supported` | npm CLI < 11.5.1. Upgrade Node 22+ or `npm i -g npm@latest`. |
| `Error: missing GITHUB_TOKEN` (changesets/action) | Workflow missing `GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}` env. |
| `Error: changeset is empty` | An empty `.changeset/<id>.md`. Delete it; `pnpm changeset` again. |
| `gyp ERR! ... node-gyp` (during install) | Native dep not desired. Replace with pure-JS alternative. |
| `EBADENGINE Unsupported engine` | Consumer Node < `engines.node`. Document the requirement; do not lower silently. |
| `TypeError: Cannot read property 'X' of undefined` (in tests after upgrade) | Vitest 4 changed an API. Read https://vitest.dev/guide/migration.html. |
| `error: Did not find any GitHub Actions workflow file containing the trusted publisher configuration` | npm trusted publisher repo/workflow path doesn't match what's in npmjs.com settings. Edit settings to match `.github/workflows/release.yml`. |
| `Error: HEAD detached at <sha>` (CI release) | `actions/checkout` defaulted to detached HEAD; need `fetch-depth: 0` for changesets to find tags. |
| `Error: Husky pre-commit hook denied push` | If using Husky (this rulebook does not require it), disable by setting `HUSKY=0` env or remove the hook. |
| `Cannot find module 'X' from '...'` (in attw) | A peer dep is being resolved from devDependencies. Move to peer + add to devDeps for local install. |
| `npm WARN deprecated <transitive>` | Upgrade direct dep that pulls it. `pnpm why <transitive>` to find the parent. |
| `npm error 401 ... must be 2FA-authenticated` (manual publish) | Add `--otp=<code>` from your authenticator. CI/OIDC bypasses this. |
| `Error: Cannot publish to "next" dist-tag` | changesets pre-mode requires `pnpm changeset pre enter <tag>` first. |
| `pnpm: command not found` (CI) | Missing `pnpm/action-setup@v4` step before `actions/setup-node`. |

---

## 20. Glossary

- **npm**: the public registry where JavaScript packages are hosted, and the CLI tool that interacts with it.
- **package**: a folder with a `package.json`, publishable to a registry.
- **registry**: the server that hosts packages (npmjs.com is the default).
- **scoped package**: name like `@yourname/string-helpers`; everything before the `/` is the scope.
- **semver / semantic versioning**: `MAJOR.MINOR.PATCH`; bump major for breaking changes, minor for additions, patch for fixes.
- **dist-tag**: a label on a published version (`latest`, `next`, `beta`); `npm install <pkg>` defaults to `latest`.
- **ESM (ECMAScript Modules)**: the standard module system using `import`/`export`. File extensions `.mjs` or any `.js` in a `"type": "module"` package.
- **CJS (CommonJS)**: the older Node module system using `require`/`module.exports`. File extension `.cjs` or any `.js` in a `"type": "commonjs"` package.
- **dual package**: one published package that ships both ESM and CJS builds.
- **dual package hazard**: same code loaded twice (once as ESM, once as CJS) creating duplicate state. Avoid by keeping libraries stateless.
- **`exports` field**: `package.json` field that maps module specifiers to file paths, with conditions like `import`, `require`, `types`. Replaces `main`/`module`.
- **conditions** (in `exports`): keys like `"import"`, `"require"`, `"types"`, `"default"` selecting different files based on how the package is loaded. Order within a `{}` matters; `"types"` must be first.
- **`main`**: legacy field for the CJS entry point. Still useful for older tooling; tshy writes it for you.
- **subpath export**: `string-helpers/url` resolves to a different file than the root; configured under `exports`.
- **`files` field**: whitelist of paths to include in the published tarball. Authoritative — beats `.gitignore`/`.npmignore`.
- **`peerDependencies`**: deps the consumer is expected to provide (React, Vue). Not bundled.
- **`devDependencies`**: deps used only for development (test runners, build tools). Not installed by consumers.
- **lockfile** (`pnpm-lock.yaml`): records exact versions of every dep + transitive dep. Commit it; CI uses `--frozen-lockfile`.
- **tshy**: a build tool by isaacs that builds a TypeScript library to dual ESM+CJS using `tsc`, and writes the correct `exports` map into `package.json`.
- **tsup**: an alternative bundler powered by esbuild. tshy is preferred here for fewer footguns.
- **changeset**: a file in `.changeset/` describing one upcoming version bump and its summary. Combined into a `CHANGELOG.md` at release.
- **`changesets/action@v1`**: GitHub Action that opens a "Version Packages" PR or runs `pnpm changeset publish` after merge.
- **OIDC (OpenID Connect)**: a standard way for CI to prove its identity to npm without long-lived tokens.
- **trusted publishing**: npm's name for OIDC-authenticated publishing. Configure in npmjs.com package settings.
- **provenance attestation**: a Sigstore-signed record linking a published version to the exact GitHub Actions run + commit that built it.
- **`prepublishOnly`**: an npm lifecycle script that runs only on `npm publish`, not on install. Used to gate publish on tests passing.
- **Vitest**: test runner powered by Vite; reads TypeScript natively.
- **Biome**: a Rust-based linter and formatter that replaces ESLint + Prettier with one tool.
- **attw (`@arethetypeswrong/cli`)**: a tool that simulates how every Node version + bundler resolves your package, checking that types load correctly under each condition.
- **publint**: a tool that statically analyzes `package.json` and `dist/` for correctness (missing files, wrong fields, etc.).
- **`sideEffects: false`**: tells bundlers nothing in your package executes at import time, so unused exports can be tree-shaken.
- **tree-shaking**: bundlers stripping unused exports from the final bundle.
- **MSRV (Minimum Supported Runtime Version)**: the lowest Node version your library officially supports. Declared in `engines.node`.
- **postinstall script**: a script in a dep's `package.json` that runs on install. A common supply-chain attack vector.
- **`pnpm`**: a fast, disk-efficient alternative to npm that uses a content-addressable store and strict dependency resolution.
- **Sigstore**: an open-source service for signing and verifying software artifacts. Used for npm provenance.
- **GitHub Releases**: GitHub's UI for tagged releases. changesets/action creates one per published version.

---

## 21. Update Cadence

- **This rulebook is valid for**: Node.js 20.19+ and 22 LTS, npm 11.5.1+, TypeScript 5.7 through 6.x, tshy 3.x, Vitest 4.x, Biome 2.x, changesets 2.x.
- **Re-run the generator when**:
  - Node 22 reaches EOL (Oct 2027) or Node 24 becomes LTS-active.
  - TypeScript 7 (Go-native) ships stable.
  - tshy major version bump.
  - npm changes the trusted publishing API.
  - Major Biome or Vitest API breaks.
  - A security advisory affects any locked dependency.
- **Last updated**: 2026-04-27.
