# VS Code Extension Rulebook

> TypeScript + esbuild bundle + vsce + ovsx, dual-published to VS Marketplace and Open VSX, web-extension capable, manifest entirely in `package.json`. Hand this file plus a product idea to Claude Code, Codex, or Cursor and they will bootstrap, build, and ship a Marketplace v1.

Stamp: 2026-04-27. Valid for VS Code 1.114 → 1.117 (engines.vscode `^1.105.0` baseline). Re-run the generator on a major VS Code version change, vsce 4.x, ovsx 1.x, esbuild 1.x, or any security advisory.

---

## 1. Snapshot

**Stack name:** VS Code Extension (TypeScript + esbuild + vsce/ovsx, web-capable).
**Tagline:** One TypeScript bundle, dual-marketplace publish, runs in Desktop and Web.

### Decisions table (zero blanks)

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 6.0 | Official VS Code API ships `.d.ts`; type-safe contributes wiring. |
| Runtime + version | Node.js 22 LTS (extension host parity) | Matches VS Code 1.114+ embedded Node; npm scripts run anywhere. |
| Package manager | npm 10 | vsce supports it natively; pnpm needs `--no-dependencies` workaround. |
| Build tool | esbuild 0.28 | Fast, ships single CJS bundle, official VS Code-recommended. |
| State mgmt | Plain TS modules + `vscode.ExtensionContext.workspaceState/globalState` | Built-in; no extra dep needed for an editor extension. |
| Routing/Nav | N/A — contributes points wire commands/views | Extensions are not apps; the manifest is the router. |
| Data layer (db + orm) | None by default; `vscode.workspace.fs` + JSON in `globalStorageUri` | Editor extensions are stateless; persistent state via storage URI. |
| Auth | `vscode.authentication.getSession('github'\|'microsoft', scopes)` | Built-in OAuth; no extension-side token handling. |
| Styling | Webview: plain CSS + VS Code CSS vars (`--vscode-*`) | Match theme automatically; no toolkit lock-in. |
| Forms + validation | `zod@4` for settings/webview message validation | Schema validates `postMessage` and `workspace.getConfiguration()`. |
| Unit test runner | Vitest 4.1 (pure-TS modules) | 10× faster than Jest; ESM-friendly; no DOM needed. |
| E2E framework | `@vscode/test-electron` 2.5 + `@vscode/test-cli` 0.0.10 | Official; spins real VS Code instance with extension loaded. |
| Mocking strategy | Vitest `vi.mock` for pure modules; never mock `vscode` API in E2E | E2E tests must hit the real `vscode` module. |
| Logger | `vscode.window.createOutputChannel(name, { log: true })` | Built-in `LogOutputChannel` with levels; visible in Output panel. |
| Error tracking | Output channel + `telemetry.feedback` URL on error | No third-party SDK; honors user telemetry setting. |
| Lint + format | Biome 2.4.13 | One binary, replaces ESLint+Prettier, 10–20× faster. |
| Type checking | `tsc --noEmit` (esbuild does not type-check) | esbuild only transpiles; tsc gates correctness. |
| Env vars + secrets | `vscode.SecretStorage` for tokens; `vscode.workspace.getConfiguration()` for settings | OS keychain via `SecretStorage`; never .env in extension. |
| CI provider | GitHub Actions | Free for public extensions; native `gh` integration. |
| Deploy target | VS Marketplace (vsce) + Open VSX (ovsx) — both | VSCodium/Cursor/Gitpod users only see Open VSX. |
| Release flow | Tag `vX.Y.Z` → workflow runs `vsce publish` + `ovsx publish` | One source of truth; signed artifacts. |
| Auto-update | VS Code auto-updates extensions; pre-release channel via `--pre-release` | Users opt in to pre-release per extension. |
| Bundler output | Single `dist/extension.cjs` (CJS, external `vscode`) | VS Code requires CJS; `vscode` is provided at runtime. |
| Web extension support | Yes — `browser` entry compiled separately to `dist/web.cjs` | Required for vscode.dev / github.dev users. |
| Activation strategy | Specific triggers only (`onCommand`, `onLanguage`, `onView`) | Star activation tanks editor startup. |
| Manifest | Entirely in `package.json` — `contributes`, `activationEvents`, `capabilities` | One manifest file; vsce reads from it directly. |
| Workspace trust | `capabilities.untrustedWorkspaces.supported = "limited"` | Refuse to run untrusted workspace code paths. |
| Virtual workspaces | `capabilities.virtualWorkspaces.supported = true` (or `"limited"` if `fs` needed) | Required for vscode.dev compatibility. |

### Versions table

| Library | Version | Released | Link |
|---|---|---|---|
| VS Code (engine baseline) | 1.105.0 → 1.117 (latest stable) | 2026-04 | https://code.visualstudio.com/updates |
| `@types/vscode` | ^1.105.0 | rolling | https://www.npmjs.com/package/@types/vscode |
| `@vscode/vsce` | 3.9.0 | 2026-04-27 | https://www.npmjs.com/package/@vscode/vsce |
| `ovsx` | 0.10.10 | 2026-04-17 | https://www.npmjs.com/package/ovsx |
| `@vscode/test-electron` | 2.5.2 | 2026-03 | https://www.npmjs.com/package/@vscode/test-electron |
| `@vscode/test-cli` | 0.0.10 | 2026-03 | https://www.npmjs.com/package/@vscode/test-cli |
| `@vscode/test-web` | 0.0.71 | 2026-03 | https://www.npmjs.com/package/@vscode/test-web |
| `esbuild` | 0.28.0 | 2026-04-08 | https://www.npmjs.com/package/esbuild |
| TypeScript | 6.0 | 2026-03 | https://www.typescriptlang.org/ |
| Node.js | 22 LTS | 2025-10 | https://nodejs.org |
| `@biomejs/biome` | 2.4.13 | 2026-04-25 | https://www.npmjs.com/package/@biomejs/biome |
| `vitest` | 4.1.4 | 2026-04-16 | https://www.npmjs.com/package/vitest |
| `mocha` (E2E inside test-cli) | 10.x | rolling | https://mochajs.org |
| `vscode-languageclient` | 9.0.1 | 2024 (stable) | https://www.npmjs.com/package/vscode-languageclient |
| `zod` | 4.x | rolling | https://zod.dev |

### Minimum host requirements
- macOS 13+, Windows 10/11, Ubuntu 22.04+ / Debian 12+ (any Linux with VS Code 1.105+).
- Node.js 22 LTS, npm 10.
- 4 GB RAM (8 GB if running E2E).
- 2 GB free disk (downloads ~250 MB VS Code test build to `.vscode-test/`).
- Git 2.40+.
- A free Microsoft (Azure DevOps) account — only required at publish time, not at build time.
- An Eclipse account (Open VSX) — only required at publish time.

### Cold-start time
From `git clone` to F5-debugging the bundled extension on a fresh laptop: **~6 minutes** (3 min clone + Node install, 2 min `npm ci`, 1 min first esbuild + launch).

---

## 2. Zero-to-running (Setup)

`TARGET_OS = all`. Run the section matching your host. After that, the rest of the rulebook is OS-agnostic.

### 2.1 macOS

```bash
# 1. Homebrew (skip if already installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Core toolchain
brew install node@22 git gh
brew install --cask visual-studio-code

# 3. Pin Node
node -v   # expect: v22.x.x
npm -v    # expect: 10.x.x

# 4. Auth GitHub CLI (paste browser code)
gh auth login -w
```

### 2.2 Windows (PowerShell, run as user — not admin)

```powershell
# 1. winget is preinstalled on Windows 10 21H2+ / Windows 11
winget install OpenJS.NodeJS.LTS --version 22 -e
winget install Git.Git -e
winget install GitHub.cli -e
winget install Microsoft.VisualStudioCode -e

# 2. Reopen PowerShell so PATH refreshes, then:
node -v   # expect: v22.x.x
npm -v    # expect: 10.x.x

# 3. Auth GitHub CLI
gh auth login -w
```

### 2.3 Linux (Ubuntu 22.04+/Debian 12+)

```bash
# 1. Node 22 via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs git xvfb libnss3 libgbm1 libasound2t64

# 2. VS Code
sudo apt-get install -y wget gpg
wget -qO- https://packages.microsoft.com/keys/microsoft.asc | gpg --dearmor > packages.microsoft.gpg
sudo install -D -o root -g root -m 644 packages.microsoft.gpg /etc/apt/keyrings/packages.microsoft.gpg
echo "deb [arch=amd64,arm64,armhf signed-by=/etc/apt/keyrings/packages.microsoft.gpg] https://packages.microsoft.com/repos/code stable main" | sudo tee /etc/apt/sources.list.d/vscode.list
sudo apt-get update && sudo apt-get install -y code

# 3. GitHub CLI
sudo apt-get install -y gh
gh auth login -w
```

> `xvfb`, `libnss3`, `libgbm1`, `libasound2t64` are required so `@vscode/test-electron` can run a headless VS Code in CI/Linux. Without them, E2E tests fail with `Failed to load /lib/x86_64-linux-gnu/libnss3.so` or similar.

### 2.4 Accounts to create (one-time, only required to publish)

| Account | What you need | Where |
|---|---|---|
| Azure DevOps (Microsoft) | Personal Access Token with **Marketplace → Manage** scope, all-org | https://dev.azure.com → user icon → Personal access tokens |
| Eclipse Foundation | Sign Eclipse Contributor Agreement (one click), then create namespace | https://open-vsx.org → log in with GitHub → user → Settings → Tokens |
| GitHub | Repo + secrets `VSCE_PAT` and `OVSX_TOKEN` | `gh secret set VSCE_PAT < token.txt` |

Do **not** create publisher IDs from the CLI on first run. Visit https://marketplace.visualstudio.com/manage and create the publisher there first. Open VSX namespaces are created via the Eclipse web UI.

### 2.5 Bootstrap the project

```bash
# Generate from the official Yeoman template, then trim non-essentials
npx --package yo --package generator-code -- yo code

# Pick: "New Extension (TypeScript)"
# Name: echo-cmd
# Identifier: echo-cmd
# Description: Echoes the current selection.
# Bundler: esbuild
# Package manager: npm
# Initialize git: yes
```

Then replace the generated files with this rulebook's First-PR Scaffold (§16). The Yeoman generator is a starting point; the rulebook's files are canonical.

### 2.6 First-run output (what you should see)

```bash
$ npm ci
added 217 packages in 19s

$ npm run check        # tsc --noEmit + biome check
$ npm run build        # esbuild → dist/extension.cjs
  dist/extension.cjs   38.4kb
⚡ Done in 84ms

$ code --extensionDevelopmentPath="$PWD" .
# A second VS Code window opens titled "[Extension Development Host]".
# Open Command Palette (Cmd+Shift+P / Ctrl+Shift+P) → "Echo Selection".
# Output panel → "echo-cmd" → expect: "Hello, World!" or your selection.
```

### 2.7 Common first-run errors

| Error | Fix |
|---|---|
| `code: command not found` (macOS) | VS Code → Cmd+Shift+P → "Shell Command: Install 'code' in PATH". |
| `Cannot find module 'vscode'` at build | `vscode` is **not** an npm dep. Mark it `external` in esbuild. Already done in `esbuild.mjs`. |
| `No such file or directory: .vscode-test/...` | `npm run test:e2e` first (downloads VS Code build). On Linux, ensure `xvfb` installed. |
| `vsce package` complains about missing `repository` | Add `"repository": { "type": "git", "url": "https://github.com/owner/repo" }` to `package.json`. |
| `vsce package` complains about LICENSE | Add `LICENSE` file at repo root (MIT template in §16). |
| `Activation event 'onCommand:foo.bar' was triggered` but command missing | Command id in `package.json#contributes.commands[].command` must match `commands.registerCommand('foo.bar', …)`. |
| `Window: Failed to load extension` | Open `Help → Toggle Developer Tools → Console` in the Extension Host window. Stack trace is there. |
| Linux E2E hangs in CI | Wrap with `xvfb-run -a npm run test:e2e`. |

---

## 3. Project Layout

```
echo-cmd/
├── .github/
│   └── workflows/
│       ├── ci.yml              # PR checks: typecheck + lint + unit + E2E (linux)
│       └── release.yml         # Tag push → vsce publish + ovsx publish
├── .vscode/
│   ├── extensions.json         # Recommended extensions for contributors
│   ├── launch.json             # F5 → Run Extension; F5 → E2E
│   ├── settings.json           # Workspace defaults (Biome formatter, etc.)
│   └── tasks.json              # `npm: watch` runs in background
├── .vscode-test.mjs            # @vscode/test-cli config (E2E runner)
├── .vscodeignore               # What is EXCLUDED from the .vsix
├── .gitignore
├── biome.json                  # Lint + format config
├── tsconfig.json               # Type-check config (no emit; esbuild builds)
├── esbuild.mjs                 # Build script (node + browser bundles)
├── package.json                # Manifest (contributes, activationEvents, scripts)
├── README.md                   # Marketplace landing page; first paragraph is the pitch
├── CHANGELOG.md                # Marketplace shows this on every update
├── LICENSE
├── icon.png                    # 128×128 PNG, no transparency, shown in Marketplace
├── CLAUDE.md                   # Claude Code rules
├── AGENTS.md                   # Codex rules
├── .cursor/
│   └── rules                   # Cursor rules
├── src/
│   ├── extension.ts            # Node entry (`activate` / `deactivate`)
│   ├── extension.web.ts        # Browser entry (no `node:fs`, no native deps)
│   ├── commands/
│   │   ├── echoSelection.ts
│   │   └── index.ts            # Re-exports + `registerAll(context)`
│   ├── views/
│   │   └── echoStatusBar.ts    # Status bar item
│   ├── webviews/
│   │   ├── echoPanel.ts        # WebviewPanel host
│   │   └── media/
│   │       ├── main.css
│   │       └── main.js         # Loaded inside webview iframe
│   ├── lsp/                    # (only if shipping a language server)
│   │   ├── client.ts
│   │   └── server.ts
│   ├── lib/
│   │   ├── config.ts           # Reads `workspace.getConfiguration()` with zod
│   │   ├── log.ts              # `LogOutputChannel` singleton
│   │   ├── secrets.ts          # `SecretStorage` wrapper
│   │   └── telemetry.ts        # Honors `telemetry.telemetryLevel`
│   └── test/
│       ├── unit/
│       │   └── config.test.ts  # Vitest — pure modules only
│       └── e2e/
│           ├── runTest.ts      # @vscode/test-electron entry
│           └── suite/
│               ├── index.ts    # Mocha bootstrap
│               └── echo.test.ts
├── dist/                       # esbuild output (gitignored, NOT vscodeignored)
└── node_modules/               # gitignored AND vscodeignored
```

### Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Files | `kebab-case.ts` for modules; `PascalCase.ts` only for class-only files | `echo-selection.ts` |
| Commands (id) | `<extId>.<verbObject>` | `echoCmd.echoSelection` |
| Command titles | `Echo: <Verb Object>` (category prefix in title) | `"Echo: Echo Selection"` |
| Configuration keys | `<extId>.<dotted.path>` | `echoCmd.greeting` |
| Output channel | `<Extension Display Name>` | `"Echo Cmd"` |
| Webview viewType | `<extId>.<panelName>` | `echoCmd.preview` |
| Test file | `*.test.ts` (unit) or `*.e2e.ts` (E2E) | `config.test.ts` |
| Activation event | Prefer specific (`onCommand`, `onLanguage`, `onView`, `onUri`, `workspaceContains:**/*.foo`) | `"onLanguage:markdown"` |

### "If you're adding X, it goes in Y"

| Adding... | Goes in... |
|---|---|
| A new command | `src/commands/<name>.ts` + entry in `package.json#contributes.commands` |
| A keyboard shortcut | `package.json#contributes.keybindings` (do **not** ship one for an existing combo without a `when` clause) |
| A user setting | `package.json#contributes.configuration.properties` + `src/lib/config.ts` zod schema |
| A status bar indicator | `src/views/<name>.ts`, registered in `extension.ts#activate` |
| A tree view (sidebar) | `src/views/<name>Provider.ts` (`TreeDataProvider`) + `contributes.views` + `contributes.viewsContainers` |
| A webview panel | `src/webviews/<name>.ts` + `media/` for assets; do **not** import npm UI libs into `media/main.js` |
| A language definition | `src/lsp/` if running a server; `contributes.languages` + `contributes.grammars` for syntax only |
| A code action | `vscode.languages.registerCodeActionsProvider(...)` in `src/commands/` |
| A diagnostic source | `vscode.languages.createDiagnosticCollection('<extId>')` in `extension.ts#activate`, then push from a watcher |
| A walkthrough | `package.json#contributes.walkthroughs` + `media/walkthrough/*.md` |
| Themed icons | `media/icons/<name>-{light,dark}.svg` referenced via `{ light, dark }` paths |
| A new test | Unit → `src/test/unit/<name>.test.ts`; E2E → `src/test/e2e/suite/<name>.test.ts` |
| A new package dep | Production → `dependencies` (rare; bundle it). Build/test → `devDependencies`. |
| A migration to bump engine | `package.json#engines.vscode` AND `@types/vscode`; update `CHANGELOG.md` + bump major. |
| A platform-specific binary | `package.json#extensionPack` is wrong; use platform-specific `.vsix` via `vsce package --target <triple>` |
| A license header | None — repo-level `LICENSE` file is sufficient |

---

## 4. Architecture

### 4.1 Process boundaries

```
 ┌─────────────────────────────┐    ┌────────────────────────────┐
 │   VS Code Renderer (UI)     │    │  Extension Host (Node 22)  │
 │  ────────────────────────   │    │  ───────────────────────── │
 │  Editor, Tree views,        │◀──▶│  Your `dist/extension.cjs`│
 │  Status bar, Webview iframe │    │  Loaded on activation event│
 │                             │    │                            │
 │  Webview iframe (sandboxed) │    │  `vscode` API (sole bridge)│
 └─────────────────────────────┘    └────────────────────────────┘
        ▲                                       ▲
        │ postMessage / asWebviewUri            │ vscode.* calls only
        │                                       │
 ┌──────┴────────────────────────┐    ┌─────────┴────────────────┐
 │ Webview content (HTML/CSS/JS) │    │ Node APIs (fs, child_proc)│
 │  - lives in src/webviews/...  │    │  - DESKTOP ONLY           │
 │  - NEVER imports `vscode`     │    │  - never in extension.web │
 │  - CSP locked to extension    │    │                           │
 └───────────────────────────────┘    └───────────────────────────┘
```

For web extensions, the Extension Host is a Web Worker. `node:fs`, `child_process`, `path`, native modules are unavailable. Use `vscode.workspace.fs` (works in both).

### 4.2 Data flow for a command

```
User: Cmd+Shift+P → "Echo: Echo Selection"
   │
   ▼
VS Code core looks up `contributes.commands[id="echoCmd.echoSelection"]`
   │
   ▼
Activation event fires (`onCommand:echoCmd.echoSelection`) — extension host
loads `dist/extension.cjs`, runs `activate(context)` if not already active
   │
   ▼
Registered handler (`commands.registerCommand('echoCmd.echoSelection', fn)`) runs
   │
   ▼
Handler reads `window.activeTextEditor.selection`, writes to LogOutputChannel,
returns. No network calls without explicit user setting check.
```

### 4.3 Auth flow (if extension calls a service)

```
extension.ts
   │
   ▼ vscode.authentication.getSession('github', ['repo'], { createIfNone: true })
VS Code shows a built-in modal: "Allow Echo Cmd to sign in to GitHub?"
   │
   ▼ user approves
returns AuthenticationSession { accessToken, account, scopes }
   │
   ▼ extension stores nothing — it re-fetches each call (cache in memory only)
fetch('https://api.github.com/...', { headers: { Authorization: `Bearer ${session.accessToken}` } })
```

Never persist `session.accessToken`. VS Code refreshes it. Do not write to `SecretStorage` for OAuth — that defeats the built-in `authentication` flow.

### 4.4 State management

```
                          ┌──────────────────────────┐
   Per-extension instance │ vscode.ExtensionContext  │
                          └──────────────────────────┘
                                       │
       ┌───────────────────────────────┼─────────────────────────────┐
       ▼                               ▼                             ▼
 globalState (key/value)        workspaceState               secrets (OS keychain)
 cross-machine via Settings    per-folder, JSON only         API tokens, no other use
 Sync if user opts in
```

Settings (user-visible) live in `package.json#contributes.configuration` and are read with `vscode.workspace.getConfiguration('echoCmd').get('greeting')`.

### 4.5 Entry-point file map

| File | Responsibility |
|---|---|
| `src/extension.ts` | Default Node entry. Exports `activate(context)` and `deactivate()`. Wires commands, views, webviews, output channel. |
| `src/extension.web.ts` | Same shape as `extension.ts` but **must not** import Node-only modules. esbuild builds a separate `dist/web.cjs`. |
| `src/commands/index.ts` | `export function registerAll(context: vscode.ExtensionContext)`. Pure dispatch; no business logic. |
| `src/lib/log.ts` | Owns the singleton `LogOutputChannel`. Imported everywhere. |
| `src/lib/config.ts` | Reads + zod-validates user settings once per call. |

### 4.6 Where business logic lives — and does not

- **Lives in:** `src/lib/*` (pure TS, unit-testable with Vitest).
- **Does NOT live in:** `extension.ts` (only wiring), `commands/*.ts` (only dispatch + UX), `webviews/media/*.js` (only DOM + postMessage).

A command handler is ~10 lines: read input from `vscode.*`, call a `lib/*` function, write output to `vscode.*`.

---

## 5. Dev Workflow

### 5.1 Start dev

```bash
npm ci             # one-time, after clone or lockfile change
npm run watch      # esbuild --watch + tsc --watch in parallel
# In VS Code: press F5 → opens [Extension Development Host] window
```

`npm run watch` runs two watchers: esbuild rebuilds the bundle on save (~50ms), tsc does pure type-check (no emit). Both must be running for instant feedback.

### 5.2 Hot reload behavior

- Source edit → esbuild rebuilds `dist/` → in the Extension Development Host window: `Ctrl+R` (Cmd+R on macOS) reloads the window. **VS Code does not auto-reload extensions.**
- Webview edit → re-run the command that opens the panel; webviews are recreated.
- Manifest (`package.json`) edit → close and reopen the dev host window. Activation events and contributes are read once at extension load.

### 5.3 Debugger

- **VS Code / Cursor:** F5. The included `.vscode/launch.json` has two configs: "Run Extension" (debugs `extension.ts`) and "Extension Tests" (debugs `src/test/e2e`).
- **Webview internals:** in the Extension Development Host, run `Developer: Open Webview Developer Tools`. Full Chrome DevTools.
- **Web extension:** `npm run start:web` → opens browser via `@vscode/test-web`; use Chrome DevTools.

### 5.4 Inspect runtime

| Surface | How |
|---|---|
| Output logs | Output panel → channel "Echo Cmd" |
| Active settings | Cmd+Shift+P → "Preferences: Open Settings (UI)" → search `echoCmd` |
| Storage state | Cmd+Shift+P → "Developer: Open Extension Logs Folder" |
| Running commands | Cmd+Shift+P → "Developer: Show Running Extensions" |
| Activation timing | `Developer: Show Running Extensions` → click extension → "Profile Extension" |

### 5.5 Pre-commit checks

```bash
# scripts/pre-commit (run by simple-git-hooks)
npm run check   # = tsc --noEmit && biome check
npm run test    # vitest run (unit only — fast)
```

E2E does not run pre-commit; it runs in CI.

### 5.6 Branch + commit conventions

- `main` is releasable at every commit.
- Feature branches: `feat/<short-slug>`, `fix/<slug>`, `chore/<slug>`.
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`).
- Tag releases `vMAJOR.MINOR.PATCH`. Pre-release uses `MAJOR.ODD.PATCH`, stable uses `MAJOR.EVEN.PATCH` (Marketplace requirement).

---

## 6. Testing & Parallelization

### 6.1 Unit tests (Vitest)

```bash
npm run test                  # all unit tests
npm run test -- config.test   # one file
npm run test -- -t "parses"   # one test by name
npm run test:watch            # watch mode
```

Unit tests live in `src/test/unit/` and import only from `src/lib/*`. **Never import `vscode` from a unit test** — it is not a real npm package. Anything that touches `vscode` belongs in E2E.

### 6.2 E2E tests (`@vscode/test-electron` + `@vscode/test-cli`)

```bash
npm run test:e2e              # downloads VS Code, runs Mocha suite
npm run test:e2e -- --grep="echo"   # filter by name
xvfb-run -a npm run test:e2e  # Linux headless
```

`.vscode-test.mjs` configures parallelism per spec file. Mocha inside each VS Code instance is serial (one window = one process), but `@vscode/test-cli` can sharded across files with `--parallel`.

### 6.3 Mocking rules

- **Mock:** pure functions in `src/lib/*` for unit tests via `vi.mock`.
- **Mock with care:** webview message channels — use a fake `Webview` only when testing the host side.
- **Never mock:** the `vscode` API in E2E. The whole point of `test-electron` is to load the real one.
- **Never mock:** the file system in E2E. Use a temp folder via `vscode.workspace.fs`.

### 6.4 Coverage

```bash
npm run test -- --coverage   # vitest c8 coverage on src/lib/**
```

Target: **80% line + 70% branch** on `src/lib/*`. UI wiring (`extension.ts`, `commands/`, `views/`) is exercised by E2E, not measured for coverage.

### 6.5 Visual regression

A pure-editor extension has no visual surface beyond webviews. If you ship a webview with custom UI, snapshot the rendered HTML via Playwright loaded against `@vscode/test-web` — out of scope for v1.

### 6.6 Parallelization patterns for AI agents

**Safe to fan out (touch disjoint files):**
- "Add command X" + "Add command Y" + "Add status bar item Z" → three parallel subagents, one per command file. Each updates `src/commands/<name>.ts` and adds an entry to `contributes.commands`. Lockfile is untouched.
- "Write unit test for `lib/config`" + "Write unit test for `lib/secrets`" → two parallel subagents on disjoint test files.

**Must be sequential:**
- Anything touching `package.json` (manifest changes, version bumps, dep adds) — only one agent at a time.
- Anything touching `package-lock.json` — sequential.
- Anything touching `esbuild.mjs` or `tsconfig.json` — sequential.

---

## 7. Logging

### 7.1 Setup

```ts
// src/lib/log.ts
import * as vscode from 'vscode';

let channel: vscode.LogOutputChannel | undefined;

export function initLog(name: string): vscode.LogOutputChannel {
  channel = vscode.window.createOutputChannel(name, { log: true });
  return channel;
}

export const log = () => {
  if (!channel) throw new Error('initLog() must be called in activate()');
  return channel;
};
```

`LogOutputChannel` (added in VS Code 1.74) gives free `trace/debug/info/warn/error` levels and respects the user's "Output Channel: Log Level" setting. No third-party logger required.

### 7.2 Levels

| Level | Use for |
|---|---|
| `trace` | Function entry/exit during deep debugging |
| `debug` | Variable values during development |
| `info` | Routine events (extension activated, command run, config loaded) |
| `warn` | Recoverable anomalies (setting missing, retry succeeded) |
| `error` | User-visible failures, plus the stack |

### 7.3 Required fields per log line

Every line passes through these helpers, which prepend a structured prefix:

```ts
log().info('command.run', { id, durationMs, success });
```

Fields: `event` (kebab-case), `id` (e.g. command id), `durationMs`, `success`. Never log file contents or PII (paths inside the user's repo are OK, document text is not).

### 7.4 Sample lines

```
2026-04-27 10:14:02.331 [info]  activate { version: '0.2.0', host: 'desktop' }
2026-04-27 10:14:02.412 [info]  command.run { id: 'echoCmd.echoSelection', durationMs: 12, success: true }
2026-04-27 10:14:02.418 [warn]  config.missing { key: 'echoCmd.greeting', fallback: 'Hello' }
2026-04-27 10:14:08.001 [error] webview.message.invalid { error: 'expected string', received: 'undefined' }
```

### 7.5 Where logs go

- **Dev:** Output panel → "Echo Cmd". File at `~/Library/Application Support/Code/logs/<date>/exthost*/output_logging_*` (macOS) or `%APPDATA%/Code/logs/...` (Windows).
- **Prod:** Same. Extensions cannot write user-visible logs anywhere else.
- **Errors users report:** Ask them to run `Developer: Open Extension Logs Folder` and attach the file.

### 7.6 Grep locally

```bash
# macOS
grep -R "echoCmd" ~/Library/Application\ Support/Code/logs/ | tail -50
# Windows (PowerShell)
Select-String -Path "$env:APPDATA\Code\logs\*\*\*output_logging_*" -Pattern "echoCmd"
# Linux
grep -R "echoCmd" ~/.config/Code/logs/ | tail -50
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `npm run check` (= `tsc --noEmit && biome check`) before declaring a task done.
2. Always run `npm run build` and confirm `dist/extension.cjs` exists and is < 1 MB.
3. Always declare every command id used in `commands.registerCommand` inside `package.json#contributes.commands`.
4. Always pin a specific activation event (`onCommand:`, `onLanguage:`, `onView:`, `onUri:`, `workspaceContains:`) — never the empty array, never `*`.
5. Always set `engines.vscode` to a version released within the last 12 months and matching `@types/vscode`.
6. Always set `capabilities.untrustedWorkspaces.supported` to a real value (`true`, `false`, or `"limited"` with a description).
7. Always set `capabilities.virtualWorkspaces.supported` (`true`, `false`, or `"limited"`).
8. Always bundle with esbuild and run `vsce package --no-dependencies` to produce the `.vsix`.
9. Always include `node_modules` in `.vscodeignore` after bundling.
10. Always include `dist/` in the published `.vsix` (do **not** ignore it).
11. Always read user settings via `vscode.workspace.getConfiguration('<extId>')` and validate with zod before use.
12. Always store secrets in `vscode.SecretStorage` — never `globalState` or `workspaceState`.
13. Always use `vscode.workspace.fs` (not `node:fs`) so the extension also runs as a web extension.
14. Always pass `localResourceRoots` and a `Content-Security-Policy` `meta` tag to every webview.
15. Always convert local file paths to webview URIs with `webview.asWebviewUri()`.
16. Always validate every `postMessage` payload received from a webview with zod before acting on it.
17. Always dispose every `Disposable` by pushing into `context.subscriptions`.
18. Always clean up timers, watchers, and child processes inside `deactivate()` or in `Disposable.dispose`.
19. Always bump the version in `package.json` AND prepend a `CHANGELOG.md` entry before tagging a release.
20. Always test the bundled `.vsix` with `code --install-extension echo-cmd-X.Y.Z.vsix` before publishing.
21. Always publish to both VS Marketplace (`vsce publish`) and Open VSX (`ovsx publish`) on the same tag.
22. Always set `repository`, `license`, `icon`, `categories`, and `keywords` in `package.json` — Marketplace rejects vague listings.
23. Always set `pricing: "Free"` (or `"Trial"`) explicitly so the listing renders correctly.

### 8.2 NEVER

1. Never set `activationEvents: ["*"]`. It activates on every editor startup.
2. Never `require('vscode')` from a webview's HTML/JS — it is a separate iframe.
3. Never `require('node:fs')`, `child_process`, or any native module from `extension.web.ts`.
4. Never ship absolute paths from your build machine in the bundle (`__dirname`, `import.meta.url` get rewritten — verify with `grep /Users dist/extension.cjs`).
5. Never call `eval` or set `unsafe-eval` in webview CSP.
6. Never enable a webview without `enableScripts: true` only when needed; default to `false`.
7. Never persist OAuth tokens in `SecretStorage` — use `vscode.authentication.getSession`.
8. Never put user document text into a log line.
9. Never leave `console.log` in committed code; route through `log()`.
10. Never bundle `node_modules` into the `.vsix` directly. Use esbuild to bundle imports, then exclude `node_modules` via `.vscodeignore`.
11. Never publish without a `LICENSE` file at the repo root.
12. Never reuse the same version number across pre-release and stable. Stable uses `MAJOR.EVEN.PATCH`, pre-release uses `MAJOR.ODD.PATCH`.
13. Never bump `engines.vscode` without bumping the major version of your extension.
14. Never use `vscode.window.showErrorMessage` for non-actionable errors — log them and only surface what the user can fix.
15. Never call `setTimeout` / `setInterval` without storing the handle in a `Disposable`.
16. Never `JSON.parse` untrusted webview messages without a zod schema.
17. Never write to `globalStorageUri` synchronously — always `await vscode.workspace.fs.writeFile(...)`.
18. Never depend on a workspace folder existing — handle `workspace.workspaceFolders === undefined`.
19. Never call `process.exit()` from an extension — it kills the user's editor.
20. Never gate features behind `@deprecated` VS Code APIs without a fallback.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | Manifest, deps, scripts, every contributes point | `npm ci && npm run check && npm run build && npm run test:e2e` |
| `package-lock.json` | Reproducible install | `rm -rf node_modules && npm ci` |
| `package.json#engines.vscode` | Min VS Code version + `@types/vscode` | Bump both; run `npm run test:e2e` |
| `package.json#activationEvents` | Startup behavior | Open `Developer: Show Running Extensions`, check Activation Time |
| `package.json#contributes.commands` | Command Palette entries | Open palette, search by title — must appear |
| `package.json#contributes.configuration` | User settings | `Preferences: Open Settings (UI)` → keys appear with descriptions |
| `package.json#contributes.menus` | Right-click + view title bars | Reload window, trigger menus |
| `package.json#contributes.keybindings` | Keyboard shortcuts | `Preferences: Open Keyboard Shortcuts` — keys listed |
| `package.json#capabilities.untrustedWorkspaces` | Restricted Mode behavior | Open untrusted folder, verify only safe features run |
| `package.json#capabilities.virtualWorkspaces` | vscode.dev / github.dev support | `npm run start:web` and exercise commands |
| `package.json#main` | Node entry | `npm run build && code --extensionDevelopmentPath=. .` |
| `package.json#browser` | Web entry | `npm run start:web` |
| `tsconfig.json` | Type checks | `npm run check` |
| `esbuild.mjs` | Bundle output, both targets | `npm run build && du -h dist/*.cjs` |
| `.vscodeignore` | What's in the .vsix | `npm run package` then `unzip -l *.vsix` — confirm `dist/` in, `node_modules` out, no `src/` |
| `biome.json` | Lint + format rules | `npm run check` |
| `src/extension.ts` | Activation, command wiring | F5 → run every contributed command |
| `src/extension.web.ts` | Web Worker entry | `npm run start:web` |
| `src/lib/log.ts` | All logging | Output channel "Echo Cmd" appears, level switch works |
| `src/lib/config.ts` | Settings reads | Change a setting, verify zod parses; bad value warns |
| `src/lib/secrets.ts` | Token storage | Add then read a secret; uninstall + reinstall extension; secret persists |
| `src/webviews/echoPanel.ts` | Webview host | Open panel; check CSP in DevTools; postMessage round-trip works |
| `.vscode-test.mjs` | E2E runner | `npm run test:e2e` exits 0 |
| `.github/workflows/release.yml` | Publish | Push a tag to a fork; confirm vsce + ovsx steps green |
| `LICENSE` | Marketplace listing legal | `vsce package` does not warn |
| `icon.png` | Marketplace listing visual | 128×128, opaque, < 1 MB |
| `README.md` | Marketplace landing page | First paragraph renders as the Marketplace description |
| `CHANGELOG.md` | Update notes | New entry above old; Marketplace shows it after publish |

### 8.4 Definition of Done

**Bug fix.**
- [ ] Failing test added (E2E if user-visible, unit if pure-logic).
- [ ] `npm run check` green.
- [ ] `npm run test` green.
- [ ] `npm run test:e2e` green.
- [ ] Verified in F5 dev host.
- [ ] CHANGELOG entry under `[Unreleased] / Fixed`.
- Don't: bump version yet (release flow does that).

**New feature.**
- [ ] Command/contribution declared in `package.json`.
- [ ] Activation event covers it (no `*`).
- [ ] User-facing strings in `nls.localize`-ready form (or English literal if not localizing yet).
- [ ] At least one E2E test exercises the happy path.
- [ ] README updated if user-visible.
- [ ] CHANGELOG entry under `[Unreleased] / Added`.

**Refactor.**
- [ ] No public surface change (commands, settings, exports).
- [ ] Same E2E suite passes unchanged.
- [ ] No new `dependencies` (devDeps only) unless explicitly approved.

**Dependency bump.**
- [ ] Run `npm audit` — no new high/critical advisories.
- [ ] `npm run check && npm run test && npm run test:e2e` all green.
- [ ] If `@types/vscode` bumps, also bump `engines.vscode`.

**Schema/manifest change.**
- [ ] Update `package.json#contributes.configuration.properties` with `description`, `type`, `default`.
- [ ] Update `src/lib/config.ts` zod schema in same commit.
- [ ] CHANGELOG note user-visible.

**Copy change.**
- [ ] Edit `package.json` titles + README in the same commit.
- [ ] No code changes.

### 8.5 Self-Verification Recipe

```bash
npm ci                          # clean install
npm run check                   # tsc --noEmit && biome check
npm run build                   # esbuild → dist/{extension,web}.cjs
npm run test                    # vitest run
npm run test:e2e                # @vscode/test-electron suite
npm run package                 # vsce package --no-dependencies
ls -lh *.vsix                   # confirm < 5 MB for a small extension
unzip -l *.vsix | grep dist/    # dist must be inside
unzip -l *.vsix | grep node_modules && exit 1 || true   # node_modules must NOT
```

Expected "green":

```
$ npm run check
✓ tsc --noEmit (no output)
✓ biome check  ./   Checked 14 files in 38ms. No fixes applied.

$ npm run build
  dist/extension.cjs  38.4kb
  dist/web.cjs        21.0kb
⚡ Done in 84ms

$ npm run test
 Test Files  3 passed (3)
      Tests  17 passed (17)

$ npm run test:e2e
  17 passing (8s)

$ npm run package
DONE  Packaged: /…/echo-cmd-0.2.0.vsix (14 files, 47.21 KB)
```

### 8.6 Parallelization Patterns

**Safe parallel fan-outs.** Use these when you have ≥3 independent leaves and want to halve wall time:
- One subagent per new command file (different files in `src/commands/`, both touching only `package.json#contributes.commands` — coordinate the manifest edit serially at the end).
- One subagent per webview asset (`media/main.css`, `media/main.js`).
- One subagent per pure-lib unit test (`src/test/unit/*`).

**Sequential only.** Never fan out:
- Edits to `package.json`, `package-lock.json`, `tsconfig.json`, `esbuild.mjs`, `biome.json`, `.vscode-test.mjs`.
- Schema changes to `contributes.configuration` (the zod schema in `lib/config.ts` must stay in lockstep).
- Anything that adds an npm dependency.

---

## 9. Stack-Specific Pitfalls

1. **`*` activation event tanks startup.**
   Symptom: VS Code feels slower after install. Cause: `activationEvents: ["*"]`. Fix: replace with specific events. Detect: `Developer: Show Running Extensions` shows your extension active before any of its commands run.

2. **Bundling node_modules into the .vsix.**
   Symptom: 80 MB .vsix instead of 50 KB. Cause: missing `--no-dependencies`, or `node_modules` not in `.vscodeignore`. Fix: bundle with esbuild and ignore `node_modules`. Detect: `unzip -l *.vsix | wc -l` > 200.

3. **Web extension breaks on `node:fs`.**
   Symptom: blank screen on vscode.dev. Cause: `import fs from 'node:fs'` in code that reaches the web bundle. Fix: use `vscode.workspace.fs`; gate Node-only paths behind `if (typeof process !== 'undefined' && process.versions?.node)`. Detect: `grep -E "(node:|require\\('fs')" dist/web.cjs`.

4. **Missing `engines.vscode` lower bound.**
   Symptom: extension installs but features silently fail on older VS Code. Cause: `engines.vscode` set to `"*"` or omitted. Fix: pin to the lowest VS Code version you actually test against. Detect: `vsce package` warns; or use `code -v` and verify minimum manually.

5. **Hardcoded paths leak.**
   Symptom: extension works on dev's machine, fails on user's. Cause: `path.join(__dirname, '..')` resolves to a build-machine path baked into the bundle. Fix: use `context.extensionUri` and `vscode.Uri.joinPath`. Detect: `grep "/Users\|/home/" dist/extension.cjs`.

6. **Forgetting to push `Disposable` into `context.subscriptions`.**
   Symptom: command handlers fire twice after F5 reload. Cause: previous registration not disposed. Fix: `context.subscriptions.push(vscode.commands.registerCommand(...))`.

7. **Webview script-src CSP missing nonce.**
   Symptom: scripts blocked, panel renders blank. Cause: CSP header omits nonce; `unsafe-inline` doesn't apply to scripts. Fix: generate nonce per panel, set `script-src 'nonce-${n}'`, add `nonce` attr to every `<script>` tag. Detect: webview DevTools console: "Refused to execute inline script".

8. **`asWebviewUri` not used for local assets.**
   Symptom: images/CSS 404 in webview. Cause: `<link href="media/main.css">` uses raw path, blocked by CSP. Fix: precompute via `webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'media', 'main.css'))`. Detect: webview DevTools network tab shows 404.

9. **Pre-release version collision.**
   Symptom: Marketplace rejects publish. Cause: pre-release version `1.3.0` (even minor) or duplicate of stable `1.2.4`. Fix: pre-release uses `MAJOR.ODD.PATCH`; bump to next ODD. Detect: `vsce publish --pre-release` returns 409.

10. **Activation order race.**
    Symptom: command runs before its provider is registered. Cause: `activate` returns before async wiring completes. Fix: make `activate` async and await all registrations. Detect: first invocation throws "command not found".

11. **Output channel created twice on reload.**
    Symptom: log lines duplicated. Cause: `createOutputChannel` called outside `activate`. Fix: only call inside `activate`, push to `context.subscriptions`.

12. **Bundle used CJS but author used `import` syntax with sideEffects.**
    Symptom: tree-shaking removed required init code. Cause: VS Code requires CJS, but esbuild was set to `format: 'esm'`. Fix: `format: 'cjs'`, `platform: 'node'`, `external: ['vscode']`. Detect: extension fails to load with `Cannot use import statement outside a module`.

13. **Missing `LICENSE` rejected by Marketplace.**
    Symptom: vsce publish hangs at "Validating LICENSE". Fix: add MIT or similar at repo root.

14. **`onLanguage` activation but no languageId in manifest.**
    Symptom: extension never activates. Cause: `onLanguage:foo` referenced but `contributes.languages` missing. Fix: declare the language or use the built-in id.

15. **Test failures only on CI (Linux).**
    Symptom: green locally, red in GitHub Actions. Cause: `xvfb` missing or `libnss3`/`libgbm1` not installed. Fix: install in workflow, run E2E with `xvfb-run -a`.

16. **Telemetry sent regardless of user setting.**
    Symptom: privacy complaint. Cause: forgot to check `vscode.env.isTelemetryEnabled` (or 1.94+ `env.onDidChangeTelemetryEnabled`). Fix: gate every telemetry call. Detect: code review.

17. **Stale `dist/` shipped.**
    Symptom: published .vsix runs old code. Cause: `npm run package` did not depend on `npm run build`. Fix: `"vscode:prepublish": "npm run build"` in `package.json`.

18. **Forgetting to run `vsce login` once per publisher.**
    Symptom: publish fails with 401. Fix: `vsce login <publisher>` paste PAT. CI uses `--pat $VSCE_PAT`.

19. **Open VSX namespace not created.**
    Symptom: ovsx publish 404s. Fix: visit https://open-vsx.org → create namespace matching `publisher` field. One-time per publisher.

20. **Untrusted workspace runs unsafe code path.**
    Symptom: malicious repo executes shell command on open. Cause: `capabilities.untrustedWorkspaces.supported = true` while running shell. Fix: set to `"limited"` and gate shell calls on `vscode.workspace.isTrusted`. Detect: open a fresh folder, decline trust, exercise feature.

---

## 10. Performance Budgets

| Budget | Target | How to measure | If exceeded |
|---|---|---|---|
| Activation time | < 50 ms | `Developer: Show Running Extensions` → Activation Time column | Move work behind first-command instead of `onStartupFinished` |
| Bundle size (Node) | < 300 KB | `du -h dist/extension.cjs` | Audit imports; mark heavy deps `external` and dynamic-import on demand |
| Bundle size (web) | < 200 KB | `du -h dist/web.cjs` | Same, plus drop Node-only paths |
| .vsix size | < 5 MB | `du -h *.vsix` | Trim assets; strip source maps from publish; ensure node_modules excluded |
| First-command latency | < 100 ms | log `command.run.durationMs` and read in Output | Cache work; lazy-create webviews |
| Idle CPU | 0% (no timers) | macOS: Activity Monitor → "Code Helper (Plugin)"; Win: Task Manager | Find leaked `setInterval`; ensure `clearInterval` in `dispose` |
| Idle memory | < 30 MB resident | Same as above | Drop in-memory caches on `onDidChangeWindowState(focused=false)` |

---

## 11. Security

### 11.1 Secret storage
- `vscode.SecretStorage` (OS keychain) for any token your extension owns.
- `vscode.authentication` for OAuth — VS Code owns the token.
- **Never:** `globalState`, `workspaceState`, env files inside the extension folder, `process.env`.

### 11.2 Auth threat model
- Extension code runs with the user's full filesystem access in trusted workspaces.
- Webview content is sandboxed but still has network access — treat it as untrusted.
- Untrusted workspaces (`workspace.isTrusted === false`): assume the open folder is malicious. Do not auto-run shell commands, do not auto-format, do not call binaries from `node_modules` of that folder.

### 11.3 Input validation boundary
- Settings: zod-validate every read in `src/lib/config.ts`.
- Webview messages: zod-validate every `onDidReceiveMessage` payload.
- File contents read via `vscode.workspace.fs`: no `JSON.parse` of untrusted content without zod.
- URI handlers (`onUri:`): zod-validate `uri.query` before acting.

### 11.4 Output escaping
- Inserting into a document: use `WorkspaceEdit`, not string concatenation.
- HTML in webview: never `innerHTML = serverData`. Build DOM with `document.createElement`.
- Markdown in hovers: prefer `MarkdownString` with `isTrusted = false` unless you control the source.

### 11.5 Capabilities config
```jsonc
"capabilities": {
  "untrustedWorkspaces": {
    "supported": "limited",
    "description": "Echo Cmd does not execute workspace code; commands are safe in restricted mode."
  },
  "virtualWorkspaces": true
}
```
Set `"limited"` rather than `false` when possible — `false` disables your extension entirely in restricted mode.

### 11.6 Dependency audit
```bash
npm audit --omit=dev   # production deps only — these ship in the .vsix
```
Run on every PR and before each release. Block on high+ severity unless the advisory is in a path that esbuild tree-shakes out.

### 11.7 Top 5 risks
1. Bundling a malicious transitive dep into `dist/`. Mitigation: lockfile + `npm audit` + small dep list.
2. Webview without CSP runs attacker JS. Mitigation: nonce CSP, `enableScripts` only when needed, `localResourceRoots` tight.
3. Extension activates on `*` and runs heavy code. Mitigation: specific activation events.
4. Reading user docs and sending to an external service without consent. Mitigation: explicit user setting + `isTelemetryEnabled` gate + privacy section in README.
5. Untrusted workspace executes shell. Mitigation: `untrustedWorkspaces: "limited"` + `if (!workspace.isTrusted) return`.

---

## 12. Deploy

### 12.1 Full release flow

```bash
# 1. Update version + changelog locally on main
npm version patch                        # 0.2.4 → 0.2.5 (stable, EVEN minor) for fixes
# or
npm version minor                        # 0.2.x → 0.4.0 (next stable EVEN minor) for features

# 2. Edit CHANGELOG.md — move [Unreleased] entries under [vX.Y.Z] header

# 3. Commit + tag (npm version did this if config allows; otherwise:)
git add CHANGELOG.md package.json package-lock.json
git commit -m "chore: release v0.2.5"
git tag v0.2.5
git push --follow-tags

# 4. CI workflow (release.yml) takes over:
#    - npm ci
#    - npm run check && npm run test && npm run test:e2e
#    - npm run build
#    - vsce package --no-dependencies → echo-cmd-0.2.5.vsix
#    - vsce publish --packagePath echo-cmd-0.2.5.vsix --pat $VSCE_PAT
#    - ovsx publish echo-cmd-0.2.5.vsix --pat $OVSX_TOKEN
#    - gh release create v0.2.5 echo-cmd-0.2.5.vsix --notes-from-tag
```

### 12.2 Pre-release channel

```bash
# Bump to next ODD minor: 0.2.5 → 0.3.0
npm version 0.3.0
git tag v0.3.0
git push --follow-tags
# Workflow path "if startsWith(github.ref, 'refs/tags/v')": detects ODD minor → adds --pre-release flag.
```

Users opt in via the Marketplace UI (Extensions sidebar → ⋯ → "Switch to Pre-Release Version").

### 12.3 Staging vs prod

There is no Marketplace staging. To rehearse a release:
1. `vsce package --no-dependencies` locally.
2. `code --install-extension echo-cmd-X.Y.Z.vsix` and exercise it against your test workspace.
3. Only then push the tag.

### 12.4 Rollback

VS Code Marketplace **does not support deleting a published version**. Rollback options:
- **Unpublish version (publisher only, within hours):** `vsce unpublish <publisher>.<extension>@X.Y.Z`. Users on that version are not auto-downgraded.
- **Forward-fix:** publish `X.Y.Z+1` with the regression reverted. Most users update within 24 h.
- **Pre-release flag flip:** mark `X.Y.Z` as deprecated in `CHANGELOG.md` and publish a stable directly above it.

Open VSX supports `ovsx delete <namespace>.<extension>@<version>`.

Max safe rollback window: **24 hours**. After that, prefer a forward-fix.

### 12.5 Health check

After publish:
1. https://marketplace.visualstudio.com/items?itemName=<publisher>.echo-cmd should show new version within 5 min.
2. https://open-vsx.org/extension/<namespace>/echo-cmd should show new version within 5 min.
3. `code --install-extension <publisher>.echo-cmd --force` then run a smoke command.

### 12.6 Versioning scheme

`MAJOR.MINOR.PATCH` per Marketplace. **Stable = even MINOR; pre-release = odd MINOR.** Bump MAJOR when `engines.vscode` lower bound moves up or when commands/settings are removed.

Single source of truth: `package.json#version`. CI tags the git ref to match.

### 12.7 Auto-update

VS Code auto-updates extensions in the background unless the user disables `extensions.autoUpdate`. Pre-release subscribers receive both stable and pre-release; opt-out users only get stable.

### 12.8 Cost per 1k MAU

Free. VS Marketplace + Open VSX hosting is free for public extensions. Your only cost is GitHub Actions minutes (free for public repos).

---

## 13. Claude Code Integration

### 13.1 `CLAUDE.md` (paste-ready)

```markdown
# Echo Cmd — Claude Code Rules

This is a VS Code extension. Source of truth for everything else: `vscode-extension.md` (the rulebook).

## Quick commands
- Install: `npm ci`
- Type-check + lint: `npm run check`
- Build: `npm run build`
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`
- Web dev server: `npm run start:web`
- Package vsix: `npm run package`

## Always
- Run `npm run check` before declaring a task done.
- Bundle with esbuild; mark `vscode` as external.
- Use specific activation events (`onCommand:`, `onLanguage:`, `onView:`) — never `*`.
- Push every Disposable into `context.subscriptions`.
- Validate webview messages and config reads with zod.
- Use `vscode.workspace.fs`, not `node:fs`, so the web bundle works.
- Stable versions use even MINOR (`0.2.0`); pre-release uses odd MINOR (`0.3.0`).

## Never
- `activationEvents: ["*"]`.
- Persist OAuth tokens. Use `vscode.authentication.getSession`.
- Bundle node_modules into the .vsix. Use esbuild + `--no-dependencies`.
- `process.exit()` inside the extension.
- Inline scripts in webviews without a CSP nonce.

## Recommended skills
- `/test-driven-development` — when adding a command or webview.
- `/systematic-debugging` — when a command fires but does nothing visible.
- `/verification-before-completion` — always before claiming done.
- `/ship` — to bump version + tag + push + publish.

## Verify before "done"
```bash
npm ci && npm run check && npm run test && npm run test:e2e && npm run build && npm run package
```
```

### 13.2 `.claude/settings.json` (paste-ready)

```json
{
  "permissions": {
    "allow": [
      "Bash(npm ci)",
      "Bash(npm install:*)",
      "Bash(npm run check)",
      "Bash(npm run build)",
      "Bash(npm run test)",
      "Bash(npm run test:e2e)",
      "Bash(npm run package)",
      "Bash(npm run watch)",
      "Bash(npm run start:web)",
      "Bash(npx vsce *)",
      "Bash(npx ovsx *)",
      "Bash(npx vitest *)",
      "Bash(npx biome *)",
      "Bash(npx tsc *)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(unzip -l *.vsix)",
      "Read(*)",
      "Write(src/**)",
      "Write(media/**)",
      "Write(.vscode/**)",
      "Write(.github/**)",
      "Edit(src/**)",
      "Edit(package.json)",
      "Edit(README.md)",
      "Edit(CHANGELOG.md)"
    ],
    "deny": [
      "Bash(vsce publish *)",
      "Bash(ovsx publish *)",
      "Bash(rm -rf *)",
      "Bash(git push --force *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "npx --no-install biome format --write \"$CLAUDE_FILE_PATH\" 2>/dev/null || true" }]
      }
    ],
    "Stop": [
      { "hooks": [{ "type": "command", "command": "npm run check" }] }
    ]
  }
}
```

### 13.3 Slash command shortcuts

| Slash | Use |
|---|---|
| `/test-driven-development` | Before adding a command, write E2E first. |
| `/systematic-debugging` | When the activation/wiring is mysterious. |
| `/verification-before-completion` | Before declaring "done". |
| `/ship` | Bumps version, tags, pushes — release.yml takes over. |
| `/codex` | Second opinion on tricky activation timing. |

---

## 14. Codex Integration

### 14.1 `AGENTS.md` (paste-ready)

```markdown
# Echo Cmd — Codex Agent Rules

VS Code extension. Rulebook: `vscode-extension.md`.

## Setup
```
npm ci
```

## Build / verify
```
npm run check
npm run build
npm run test
npm run test:e2e
```

## Conventions
- TypeScript strict. esbuild builds two targets: `dist/extension.cjs` (Node) and `dist/web.cjs` (browser).
- Manifest is `package.json`. All contributes points live there.
- Activation events are specific (no `*`).
- All Disposables go into `context.subscriptions`.
- `vscode` is external; never add it as a dependency.
- Stable versions: even MINOR. Pre-release: odd MINOR.

## Don't
- Add new dependencies without note in CHANGELOG.
- Touch `package.json` and `src/lib/config.ts` in different agents simultaneously.
- Push tags. Tag pushes trigger publish.
```

### 14.2 `.codex/config.toml`

```toml
model = "gpt-5.1-codex"
approval_mode = "on-request"
sandbox = "workspace-write"

[shell.allow]
patterns = [
  "^npm (ci|install|run [a-zA-Z:-]+)$",
  "^npx (vsce|ovsx|vitest|biome|tsc) ",
  "^git (status|diff|log|add|commit|push)( |$)",
  "^unzip -l .*\\.vsix$"
]

[shell.deny]
patterns = [
  "^vsce publish",
  "^ovsx publish",
  "^git push.*--force"
]
```

### 14.3 Where Codex differs

- Codex defaults to a tighter sandbox; the patterns above unblock the dev loop without unblocking publish.
- Codex tends to introduce `axios`/`node-fetch` for HTTP — VS Code 1.105+ supports global `fetch`. Reject the dep.
- Codex sometimes regenerates `package-lock.json`; require `npm ci` (not `npm install`) in agents to keep it deterministic.

---

## 15. Cursor / Other Editors

### 15.1 `.cursor/rules`

```
You are working in a VS Code extension repo. Source of truth: vscode-extension.md.

ALWAYS
- Use TypeScript with strict types.
- Bundle with esbuild; `vscode` is external.
- Activation events must be specific (onCommand, onLanguage, onView, onUri, workspaceContains). Never "*".
- Push every Disposable into context.subscriptions.
- Use vscode.workspace.fs (not node:fs) so the web bundle works.
- Validate webview messages and configuration reads with zod.
- Stable versions use even MINOR; pre-release uses odd MINOR.

NEVER
- Add `vscode` to dependencies.
- Persist OAuth tokens; use vscode.authentication.
- Bundle node_modules into the .vsix.
- Use eval, unsafe-eval, or inline scripts in webviews.
- Call process.exit() inside the extension.

VERIFY BEFORE DONE
npm run check && npm run test && npm run test:e2e && npm run build
```

### 15.2 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "ms-vscode.extension-test-runner",
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode"
  ],
  "unwantedRecommendations": [
    "esbenp.prettier-vscode"
  ]
}
```

### 15.3 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Extension",
      "type": "extensionHost",
      "request": "launch",
      "args": ["--extensionDevelopmentPath=${workspaceFolder}"],
      "outFiles": ["${workspaceFolder}/dist/**/*.cjs"],
      "preLaunchTask": "npm: watch"
    },
    {
      "name": "Extension Tests",
      "type": "extensionHost",
      "request": "launch",
      "args": [
        "--extensionDevelopmentPath=${workspaceFolder}",
        "--extensionTestsPath=${workspaceFolder}/dist/test/e2e/suite/index"
      ],
      "outFiles": ["${workspaceFolder}/dist/**/*.cjs"],
      "preLaunchTask": "npm: build"
    }
  ]
}
```

### 15.4 `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "npm: watch",
      "type": "npm",
      "script": "watch",
      "isBackground": true,
      "problemMatcher": ["$tsc-watch", "$esbuild-watch"]
    },
    {
      "label": "npm: build",
      "type": "npm",
      "script": "build",
      "problemMatcher": ["$tsc"]
    }
  ]
}
```

### 15.5 `.vscode/settings.json`

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "[typescript]": { "editor.defaultFormatter": "biomejs.biome" },
  "[json]": { "editor.defaultFormatter": "biomejs.biome" },
  "files.eol": "\n",
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

---

## 16. First-PR Scaffold

In order. Each file is shown in full.

### 16.1 `package.json`

```json
{
  "name": "echo-cmd",
  "displayName": "Echo Cmd",
  "description": "Echoes the current selection to an output channel.",
  "version": "0.2.0",
  "publisher": "your-publisher",
  "license": "MIT",
  "icon": "icon.png",
  "repository": { "type": "git", "url": "https://github.com/your-org/echo-cmd.git" },
  "bugs": { "url": "https://github.com/your-org/echo-cmd/issues" },
  "homepage": "https://github.com/your-org/echo-cmd#readme",
  "engines": { "vscode": "^1.105.0", "node": ">=22" },
  "categories": ["Other"],
  "keywords": ["echo", "selection", "demo"],
  "pricing": "Free",
  "main": "./dist/extension.cjs",
  "browser": "./dist/web.cjs",
  "activationEvents": ["onCommand:echoCmd.echoSelection"],
  "capabilities": {
    "untrustedWorkspaces": {
      "supported": "limited",
      "description": "Echo Cmd reads the active editor selection. It does not execute workspace code."
    },
    "virtualWorkspaces": true
  },
  "contributes": {
    "commands": [
      {
        "command": "echoCmd.echoSelection",
        "title": "Echo: Echo Selection",
        "category": "Echo"
      }
    ],
    "configuration": {
      "title": "Echo Cmd",
      "properties": {
        "echoCmd.greeting": {
          "type": "string",
          "default": "Hello",
          "description": "Prefix used when no selection is present."
        },
        "echoCmd.uppercase": {
          "type": "boolean",
          "default": false,
          "description": "Uppercase the echoed text."
        }
      }
    },
    "menus": {
      "editor/context": [
        {
          "command": "echoCmd.echoSelection",
          "when": "editorHasSelection",
          "group": "1_modification"
        }
      ]
    },
    "keybindings": [
      {
        "command": "echoCmd.echoSelection",
        "key": "ctrl+alt+e",
        "mac": "cmd+alt+e",
        "when": "editorTextFocus"
      }
    ],
    "walkthroughs": [
      {
        "id": "echoCmd.gettingStarted",
        "title": "Get started with Echo Cmd",
        "description": "Run your first echo command.",
        "steps": [
          {
            "id": "open-cmd",
            "title": "Run the Echo Selection command",
            "description": "Open the Command Palette and run **Echo: Echo Selection**.\n[Run command](command:echoCmd.echoSelection)",
            "media": { "markdown": "media/walkthrough/step-1.md" },
            "completionEvents": ["onCommand:echoCmd.echoSelection"]
          }
        ]
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run build",
    "build": "node esbuild.mjs --production",
    "watch": "node esbuild.mjs --watch",
    "check": "tsc --noEmit && biome check ./",
    "fix": "biome check --write ./",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "vscode-test",
    "start:web": "vscode-test-web --extensionDevelopmentPath=. --browser=chromium",
    "package": "vsce package --no-dependencies",
    "publish": "vsce publish --no-dependencies",
    "publish:ovsx": "ovsx publish --no-dependencies"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.13",
    "@types/mocha": "10.0.10",
    "@types/node": "22.x",
    "@types/vscode": "^1.105.0",
    "@vscode/test-cli": "0.0.10",
    "@vscode/test-electron": "2.5.2",
    "@vscode/test-web": "0.0.71",
    "@vscode/vsce": "3.9.0",
    "esbuild": "0.28.0",
    "mocha": "10.8.2",
    "ovsx": "0.10.10",
    "typescript": "6.0.0",
    "vitest": "4.1.4",
    "zod": "4.0.0"
  }
}
```

### 16.2 `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "Node16",
    "moduleResolution": "Node16",
    "lib": ["ES2022", "WebWorker"],
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "noEmit": true,
    "rootDir": "src",
    "types": ["node"]
  },
  "include": ["src/**/*", "esbuild.mjs", ".vscode-test.mjs"]
}
```

### 16.3 `esbuild.mjs`

```js
import * as esbuild from 'esbuild';
import { argv } from 'node:process';

const production = argv.includes('--production');
const watch = argv.includes('--watch');

const baseOptions = {
  bundle: true,
  format: 'cjs',
  external: ['vscode'],
  sourcemap: !production,
  minify: production,
  treeShaking: true,
  logLevel: 'info'
};

const node = {
  ...baseOptions,
  entryPoints: ['src/extension.ts'],
  outfile: 'dist/extension.cjs',
  platform: 'node',
  target: ['node22']
};

const web = {
  ...baseOptions,
  entryPoints: ['src/extension.web.ts'],
  outfile: 'dist/web.cjs',
  platform: 'browser',
  target: ['es2022'],
  // Browser worker has no Node built-ins; surface accidental imports as errors.
  define: { 'process.env.NODE_ENV': production ? '"production"' : '"development"' }
};

const e2e = {
  ...baseOptions,
  entryPoints: ['src/test/e2e/suite/index.ts', 'src/test/e2e/suite/echo.test.ts'],
  outdir: 'dist/test/e2e/suite',
  platform: 'node',
  target: ['node22'],
  external: ['vscode', 'mocha']
};

if (watch) {
  const ctxs = await Promise.all([esbuild.context(node), esbuild.context(web), esbuild.context(e2e)]);
  await Promise.all(ctxs.map(c => c.watch()));
} else {
  await Promise.all([esbuild.build(node), esbuild.build(web), esbuild.build(e2e)]);
}
```

### 16.4 `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.13/schema.json",
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
      "style": { "useImportType": "error" },
      "correctness": { "noUnusedVariables": "error" },
      "suspicious": { "noConsole": "warn" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } },
  "files": { "ignore": ["dist", "node_modules", ".vscode-test", "**/*.vsix"] }
}
```

### 16.5 `.vscodeignore`

```
.vscode/**
.vscode-test/**
.vscode-test.mjs
src/**
test/**
**/*.ts
**/*.map
**/.DS_Store
.eslintrc*
.biomeignore
biome.json
tsconfig.json
esbuild.mjs
node_modules/**
.gitignore
.github/**
.cursor/**
CLAUDE.md
AGENTS.md
.codex/**
**/*.test.*
.gitattributes
```

### 16.6 `.vscode-test.mjs`

```js
import { defineConfig } from '@vscode/test-cli';

export default defineConfig({
  files: 'dist/test/e2e/suite/**/*.test.cjs',
  workspaceFolder: '.vscode-test/workspace',
  mocha: {
    ui: 'bdd',
    timeout: 20000,
    color: true
  },
  launchArgs: ['--disable-extensions']
});
```

### 16.7 `.gitignore`

```
node_modules
dist
.vscode-test
*.vsix
.DS_Store
.env
*.log
```

### 16.8 `src/extension.ts`

```ts
import * as vscode from 'vscode';
import { registerAll } from './commands';
import { initLog, log } from './lib/log';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(initLog('Echo Cmd'));
  log().info('activate', { version: context.extension.packageJSON.version, host: 'desktop' });
  await registerAll(context);
}

export function deactivate(): void {
  log().info('deactivate');
}
```

### 16.9 `src/extension.web.ts`

```ts
import * as vscode from 'vscode';
import { registerAll } from './commands';
import { initLog, log } from './lib/log';

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(initLog('Echo Cmd'));
  log().info('activate', { version: context.extension.packageJSON.version, host: 'web' });
  await registerAll(context);
}

export function deactivate(): void {
  log().info('deactivate');
}
```

### 16.10 `src/commands/index.ts`

```ts
import * as vscode from 'vscode';
import { echoSelection } from './echoSelection';

export async function registerAll(context: vscode.ExtensionContext): Promise<void> {
  context.subscriptions.push(
    vscode.commands.registerCommand('echoCmd.echoSelection', () => echoSelection())
  );
}
```

### 16.11 `src/commands/echoSelection.ts`

```ts
import * as vscode from 'vscode';
import { readConfig } from '../lib/config';
import { log } from '../lib/log';

export async function echoSelection(): Promise<void> {
  const start = Date.now();
  const config = readConfig();
  const editor = vscode.window.activeTextEditor;
  const text = editor?.document.getText(editor.selection) ?? '';
  const out = (text.length > 0 ? text : `${config.greeting}, World!`);
  const final = config.uppercase ? out.toUpperCase() : out;
  log().info(final);
  vscode.window.setStatusBarMessage(`Echo: ${final}`, 2000);
  log().info('command.run', {
    id: 'echoCmd.echoSelection',
    durationMs: Date.now() - start,
    success: true
  });
}
```

### 16.12 `src/lib/log.ts`

```ts
import * as vscode from 'vscode';

let channel: vscode.LogOutputChannel | undefined;

export function initLog(name: string): vscode.LogOutputChannel {
  channel = vscode.window.createOutputChannel(name, { log: true });
  return channel;
}

export function log(): vscode.LogOutputChannel {
  if (!channel) throw new Error('initLog() must be called in activate()');
  return channel;
}
```

### 16.13 `src/lib/config.ts`

```ts
import * as vscode from 'vscode';
import { z } from 'zod';

const Schema = z.object({
  greeting: z.string().default('Hello'),
  uppercase: z.boolean().default(false)
});
export type Config = z.infer<typeof Schema>;

export function readConfig(): Config {
  const raw = vscode.workspace.getConfiguration('echoCmd');
  return Schema.parse({
    greeting: raw.get('greeting'),
    uppercase: raw.get('uppercase')
  });
}
```

### 16.14 `src/lib/secrets.ts`

```ts
import * as vscode from 'vscode';

export class Secrets {
  constructor(private readonly storage: vscode.SecretStorage) {}
  get(key: string) { return this.storage.get(`echoCmd.${key}`); }
  set(key: string, value: string) { return this.storage.store(`echoCmd.${key}`, value); }
  delete(key: string) { return this.storage.delete(`echoCmd.${key}`); }
}
```

### 16.15 `src/test/unit/config.test.ts`

```ts
import { describe, expect, it, vi } from 'vitest';

vi.mock('vscode', () => ({
  workspace: {
    getConfiguration: () => ({
      get: (k: string) => ({ greeting: 'Hi', uppercase: true } as Record<string, unknown>)[k]
    })
  }
}));

import { readConfig } from '../../lib/config';

describe('readConfig', () => {
  it('parses settings', () => {
    expect(readConfig()).toEqual({ greeting: 'Hi', uppercase: true });
  });
});
```

### 16.16 `src/test/e2e/suite/index.ts`

```ts
import * as path from 'node:path';
import Mocha from 'mocha';
import { glob } from 'glob';

export async function run(): Promise<void> {
  const mocha = new Mocha({ ui: 'bdd', color: true, timeout: 20000 });
  const files = await glob('**/*.test.cjs', { cwd: __dirname });
  for (const f of files) mocha.addFile(path.join(__dirname, f));
  await new Promise<void>((res, rej) =>
    mocha.run(failures => (failures ? rej(new Error(`${failures} failed`)) : res()))
  );
}
```

### 16.17 `src/test/e2e/suite/echo.test.ts`

```ts
import * as assert from 'node:assert';
import * as vscode from 'vscode';

suite('Echo Selection', () => {
  test('runs without throwing', async () => {
    await vscode.commands.executeCommand('echoCmd.echoSelection');
    assert.ok(true);
  });

  test('command is registered', async () => {
    const all = await vscode.commands.getCommands(true);
    assert.ok(all.includes('echoCmd.echoSelection'));
  });
});
```

### 16.18 `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: sudo apt-get update && sudo apt-get install -y xvfb libnss3 libgbm1 libasound2t64
      - run: npm ci
      - run: npm run check
      - run: npm run build
      - run: npm run test
      - run: xvfb-run -a npm run test:e2e
      - run: npm run package
      - uses: actions/upload-artifact@v4
        with:
          name: vsix
          path: '*.vsix'
```

### 16.19 `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*']
permissions:
  contents: write
jobs:
  release:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22, cache: npm }
      - run: sudo apt-get update && sudo apt-get install -y xvfb libnss3 libgbm1 libasound2t64
      - run: npm ci
      - run: npm run check
      - run: npm run build
      - run: npm run test
      - run: xvfb-run -a npm run test:e2e
      - id: pkg
        run: |
          VERSION=$(node -p "require('./package.json').version")
          MINOR=$(echo "$VERSION" | cut -d. -f2)
          if [ $((MINOR % 2)) -eq 1 ]; then
            echo "flag=--pre-release" >> "$GITHUB_OUTPUT"
          else
            echo "flag=" >> "$GITHUB_OUTPUT"
          fi
          echo "version=$VERSION" >> "$GITHUB_OUTPUT"
      - run: npx vsce package ${{ steps.pkg.outputs.flag }} --no-dependencies
      - run: npx vsce publish ${{ steps.pkg.outputs.flag }} --no-dependencies --pat ${{ secrets.VSCE_PAT }}
      - run: npx ovsx publish *.vsix --pat ${{ secrets.OVSX_TOKEN }}
      - uses: softprops/action-gh-release@v2
        with:
          files: '*.vsix'
          generate_release_notes: true
```

### 16.20 `LICENSE`

```
MIT License

Copyright (c) 2026 <Your Name>

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

### 16.21 `README.md`

```markdown
# Echo Cmd

Echoes the current selection to a VS Code Output channel. Sample extension demonstrating the rulebook stack: TypeScript + esbuild, dual-published to VS Marketplace and Open VSX, web-extension capable.

## Install
- VS Code → Extensions → search "Echo Cmd" → Install.
- Or `code --install-extension your-publisher.echo-cmd`.

## Use
- `Cmd+Alt+E` (macOS) / `Ctrl+Alt+E` (Win/Linux): echo selection.
- Command Palette → `Echo: Echo Selection`.

## Settings
- `echoCmd.greeting`: prefix when no selection.
- `echoCmd.uppercase`: uppercase the echo.

## License
MIT.
```

### 16.22 `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this extension will be documented here.

## [0.2.0] - 2026-04-27
### Added
- Initial release: `echoCmd.echoSelection` command, status bar message, configurable greeting and uppercase.

## [Unreleased]
```

### 16.23 `icon.png`

A 128×128 opaque PNG. Generate one with any image tool (don't ship a transparent one — Marketplace renders a checkered background through it).

### 16.24 `.cursor/rules`

(See §15.1.)

### 16.25 `CLAUDE.md` and `AGENTS.md`

(See §13.1 and §14.1.)

After all of these are committed, `git push` and a tagged `v0.2.0` release results in a Marketplace + Open VSX listing within 5 minutes.

---

## 17. Idea → MVP Path: from `yo code` to first Marketplace v1

`PROJECT_IDEA = blank` — the MVP is the generic `echo-cmd` extension. Five phases:

### Phase 1 — Schema (1 AI session)
- Decide command id (`echoCmd.echoSelection`), setting keys (`echoCmd.greeting`, `echoCmd.uppercase`), output channel name, walkthrough id.
- Files: `package.json` (manifest), `src/lib/config.ts` (zod schema).
- Exit: `npm run check` green; `Preferences: Open Settings (UI)` shows the new keys.

### Phase 2 — Backbone (1 AI session)
- Wire `activate`/`deactivate`, output channel, command registration.
- Files: `src/extension.ts`, `src/extension.web.ts`, `src/commands/index.ts`, `src/lib/log.ts`.
- Exit: F5 launches the dev host; `Echo: Echo Selection` appears in Command Palette and runs (logs `Hello, World!`).

### Phase 3 — Vertical slice (1 AI session)
- Implement `echoSelection` end-to-end: read selection, apply settings, log, status bar message.
- Files: `src/commands/echoSelection.ts`, `src/test/unit/config.test.ts`, `src/test/e2e/suite/echo.test.ts`.
- Exit: `npm run test` and `npm run test:e2e` both green.

### Phase 4 — Capabilities + web (1 AI session)
- Set `capabilities.untrustedWorkspaces` and `capabilities.virtualWorkspaces`.
- Build the browser bundle; smoke via `npm run start:web`.
- Add walkthrough.
- Exit: extension runs in vscode.dev preview without errors.

### Phase 5 — Ship + monitor (1 AI session)
- Create publisher on Marketplace, namespace on Open VSX.
- Add `VSCE_PAT` and `OVSX_TOKEN` to GitHub repo secrets.
- Bump to `0.2.0` (even MINOR = stable), commit, tag `v0.2.0`, push.
- Watch the release workflow finish; verify the Marketplace and Open VSX pages.
- Install via `code --install-extension your-publisher.echo-cmd` and exercise.
- Exit: extension is publicly installable from both marketplaces.

Total: ~5 AI sessions, 100–200 lines of TypeScript, one tag push.

---

## 18. Feature Recipes

### 18.1 WebView panel (with CSP, postMessage, asWebviewUri)

`src/webviews/echoPanel.ts`:

```ts
import * as vscode from 'vscode';
import { z } from 'zod';

const Msg = z.discriminatedUnion('type', [
  z.object({ type: z.literal('ready') }),
  z.object({ type: z.literal('echo'), text: z.string().max(10_000) })
]);

export class EchoPanel {
  static current: EchoPanel | undefined;
  static viewType = 'echoCmd.preview';

  static show(extensionUri: vscode.Uri): void {
    if (EchoPanel.current) {
      EchoPanel.current.panel.reveal();
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      EchoPanel.viewType,
      'Echo Preview',
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [vscode.Uri.joinPath(extensionUri, 'media')],
        retainContextWhenHidden: false
      }
    );
    EchoPanel.current = new EchoPanel(panel, extensionUri);
  }

  private constructor(
    private readonly panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri
  ) {
    panel.webview.html = this.html();
    panel.webview.onDidReceiveMessage(raw => {
      const parsed = Msg.safeParse(raw);
      if (!parsed.success) return;
      // handle parsed.data
    });
    panel.onDidDispose(() => { EchoPanel.current = undefined; });
  }

  private html(): string {
    const nonce = crypto.randomUUID().replace(/-/g, '');
    const cssUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'main.css')
    );
    const jsUri = this.panel.webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'media', 'main.js')
    );
    const csp = [
      "default-src 'none'",
      `style-src ${this.panel.webview.cspSource}`,
      `img-src ${this.panel.webview.cspSource} https:`,
      `script-src 'nonce-${nonce}'`
    ].join('; ');
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <link rel="stylesheet" href="${cssUri}" />
  <title>Echo</title>
</head>
<body>
  <pre id="out"></pre>
  <script nonce="${nonce}" src="${jsUri}"></script>
</body>
</html>`;
  }
}
```

### 18.2 Status bar item

```ts
// src/views/echoStatusBar.ts
import * as vscode from 'vscode';

export function createStatusBar(context: vscode.ExtensionContext): vscode.StatusBarItem {
  const item = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
  item.text = '$(megaphone) Echo';
  item.tooltip = 'Run Echo Selection';
  item.command = 'echoCmd.echoSelection';
  item.show();
  context.subscriptions.push(item);
  return item;
}
```

### 18.3 Language server (LSP)

```ts
// src/lsp/client.ts
import * as path from 'node:path';
import * as vscode from 'vscode';
import { LanguageClient, type LanguageClientOptions, TransportKind } from 'vscode-languageclient/node';

let client: LanguageClient | undefined;

export async function startLsp(context: vscode.ExtensionContext): Promise<void> {
  const serverModule = context.asAbsolutePath(path.join('dist', 'server.cjs'));
  const opts: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'plaintext' }],
    synchronize: { fileEvents: vscode.workspace.createFileSystemWatcher('**/.echo') }
  };
  client = new LanguageClient(
    'echoCmd.lsp',
    'Echo LSP',
    {
      run: { module: serverModule, transport: TransportKind.ipc },
      debug: { module: serverModule, transport: TransportKind.ipc, options: { execArgv: ['--inspect=6010'] } }
    },
    opts
  );
  await client.start();
  context.subscriptions.push({ dispose: () => client?.stop() });
}
```

### 18.4 Configuration contribution + reactive read

```ts
// in extension.ts
context.subscriptions.push(
  vscode.workspace.onDidChangeConfiguration(e => {
    if (e.affectsConfiguration('echoCmd')) {
      log().info('config.changed');
    }
  })
);
```

### 18.5 Walkthrough

`media/walkthrough/step-1.md`:

```markdown
## Run your first echo

1. Open any file.
2. Select some text.
3. Press `Cmd+Alt+E` (or `Ctrl+Alt+E`).
4. The Output panel opens with your selection.
```

(Already declared in `package.json#contributes.walkthroughs` — see §16.1.)

### 18.6 Tree view

```ts
// src/views/echoTree.ts
import * as vscode from 'vscode';

class Item extends vscode.TreeItem {
  constructor(public readonly label: string) {
    super(label, vscode.TreeItemCollapsibleState.None);
  }
}

export class EchoTreeProvider implements vscode.TreeDataProvider<Item> {
  private readonly _change = new vscode.EventEmitter<Item | undefined>();
  readonly onDidChangeTreeData = this._change.event;
  refresh() { this._change.fire(undefined); }
  getTreeItem(e: Item) { return e; }
  getChildren(): Item[] { return [new Item('Echo 1'), new Item('Echo 2')]; }
}
```

Manifest entries:
```jsonc
"contributes": {
  "viewsContainers": {
    "activitybar": [{ "id": "echoCmd", "title": "Echo", "icon": "media/icons/echo.svg" }]
  },
  "views": {
    "echoCmd": [{ "id": "echoCmd.tree", "name": "Echoes" }]
  }
}
```

### 18.7 URI handler (deep link)

```ts
context.subscriptions.push(
  vscode.window.registerUriHandler({
    handleUri(uri: vscode.Uri) {
      const params = new URLSearchParams(uri.query);
      // vscode://your-publisher.echo-cmd?text=hello
      const text = params.get('text') ?? '';
      vscode.window.showInformationMessage(`Echo: ${text}`);
    }
  })
);
```

`activationEvents` += `"onUri"`.

### 18.8 Authentication (GitHub)

```ts
const session = await vscode.authentication.getSession('github', ['repo'], { createIfNone: true });
const r = await fetch('https://api.github.com/user', {
  headers: { Authorization: `Bearer ${session.accessToken}` }
});
```

### 18.9 Diagnostics

```ts
const diag = vscode.languages.createDiagnosticCollection('echoCmd');
context.subscriptions.push(diag);
function flag(doc: vscode.TextDocument) {
  const items: vscode.Diagnostic[] = [];
  // ... compute ranges
  diag.set(doc.uri, items);
}
```

### 18.10 Telemetry (privacy-respecting)

```ts
function sendEvent(name: string, props: Record<string, string | number>) {
  if (!vscode.env.isTelemetryEnabled) return;
  // POST to your endpoint with vscode.env.machineId (already hashed)
}
```

---

## 19. Troubleshooting (top 30 errors)

| Error message | Fix |
|---|---|
| `Cannot find module 'vscode'` | esbuild missing `external: ['vscode']`. Use the `esbuild.mjs` from §16.3. |
| `command 'echoCmd.foo' not found` | Add it to `contributes.commands` and ensure activation event matches. |
| `activate function did not return within 30s` | `await` only what you must; defer heavy work behind first command. |
| `Webview blank, console: Refused to execute inline script` | Add CSP nonce; set `enableScripts: true`. |
| `The extension cannot be installed because it has incompatible engine` | Bump user's VS Code, or lower `engines.vscode`. |
| `vsce package: Make sure to edit the README.md` | Replace template README. |
| `vsce: Missing publisher name` | `vsce login <publisher>` once, or pass `--pat`. |
| `vsce: invalid version: must be MAJOR.MINOR.PATCH` | No `-beta` suffixes; use even/odd MINOR. |
| `ovsx: namespace not found` | Create the namespace at https://open-vsx.org. |
| `ovsx: 401` | Token scope wrong; regenerate with `extensions:write`. |
| `Failed to load /lib/x86_64-linux-gnu/libnss3.so` (CI) | `apt-get install -y libnss3 libgbm1 libasound2t64`. |
| `xvfb-run: command not found` | `apt-get install -y xvfb`. |
| `Failed to launch electron: ENOENT spawn .vscode-test/...` | First `npm run test:e2e` to download. |
| `MaxListenersExceededWarning: Possible EventEmitter memory leak` | Push `event.dispose()` returns into `context.subscriptions`. |
| `Cannot use import statement outside a module` (extension load) | esbuild `format: 'cjs'` not `'esm'`. |
| `process is not defined` (web bundle) | Replace `process.env.X` checks with `define` in esbuild for web target. |
| `webview shows file://` 404s | Use `webview.asWebviewUri`. |
| `vscode.workspace.workspaceFolders is undefined` | Handle the no-folder case. |
| `Permission denied: keychain` (macOS) | User cancelled; prompt again or fallback to `globalState` for non-secret data. |
| `Activation failed: TypeError: log is not a function` | `initLog` must run before any `log()` call. |
| `Cannot read properties of undefined (reading 'getText')` | `window.activeTextEditor` may be undefined. |
| `node-fetch is required but not installed` | Use global `fetch` (Node 22 + VS Code 1.105+). |
| `vsce: file size exceeds limit (256 MB)` | Add `node_modules` to `.vscodeignore`; bundle. |
| `Marketplace says "extension may be malicious"` | Reach out via the publisher dashboard; usually a false positive cleared in 24h. |
| `Test runner timed out` | `mocha.timeout(20000)`; or wait for activation: `await ext.activate()`. |
| `Cannot find name 'NodeJS'` | `"types": ["node"]` in `tsconfig.json`. |
| `Cannot find module './extension'` from test | Build before E2E: `preLaunchTask: 'npm: build'` in launch.json. |
| `LICENSE not found` | Add `LICENSE` at repo root (MIT in §16.20). |
| `vsce: missing repository` | Add `"repository"` to package.json. |
| `Window in [Extension Development Host] keeps reloading` | F5 watch lost; quit dev host, run `npm run watch` first, then F5. |

---

## 20. Glossary

- **Activation event:** A trigger declared in `package.json` that tells VS Code when to load your extension into the Extension Host. Examples: `onCommand:echoCmd.echoSelection`, `onLanguage:markdown`.
- **Bundler:** A tool that combines many JS files into one. Here: esbuild.
- **CJS / CommonJS:** Older Node module format using `require`/`module.exports`. VS Code requires it for extensions.
- **Contribution point:** A JSON entry under `package.json#contributes` that registers UI surfaces (commands, settings, views) with VS Code.
- **CSP (Content Security Policy):** A meta tag inside a webview HTML restricting what scripts/styles/images may load. Required for safe webviews.
- **Disposable:** Anything VS Code returns from `register*` calls; calling `dispose()` cleans it up.
- **Extension Host:** The Node (or Web Worker) process where your extension code runs, separate from VS Code's UI.
- **LSP (Language Server Protocol):** A standard for editor↔language-server communication.
- **Manifest:** The `package.json` of an extension. VS Code reads `engines`, `main`, `browser`, `contributes`, `activationEvents`, `capabilities`.
- **Marketplace:** Microsoft's https://marketplace.visualstudio.com — primary distribution.
- **Nonce:** A random string used once. Embedded in CSP and `<script nonce>` to allow that one script.
- **Open VSX:** Eclipse's free VS Code extension registry. Used by VSCodium, Cursor's open variant, Gitpod, Theia.
- **ovsx:** CLI for publishing to Open VSX.
- **Output channel:** A pane inside VS Code's Output panel where extensions write logs. `LogOutputChannel` adds level support.
- **PAT (Personal Access Token):** Azure DevOps token used by `vsce publish`.
- **Pre-release:** A Marketplace channel users opt into per extension. Versioned with odd MINOR.
- **SecretStorage:** A `vscode` API that stores values in the OS keychain.
- **Tree-shaking:** Removing unused imports during bundling. Limited under CJS.
- **Untrusted workspace:** A folder VS Code marks as untrusted; extensions declare in `capabilities` whether they run, run with limits, or refuse.
- **vsce / @vscode/vsce:** CLI for packaging and publishing to VS Marketplace.
- **`@vscode/test-electron`:** Library that downloads VS Code, launches it with your extension loaded, runs your Mocha suite.
- **`@vscode/test-cli`:** Thin runner on top of `test-electron` that reads `.vscode-test.mjs` config.
- **`@vscode/test-web`:** Same idea as `test-electron` but launches VS Code in a browser.
- **vsix:** A zip file with a manifest and the bundle — what users install.
- **Walkthrough:** A multi-step Getting Started page contributed by an extension.
- **Webview:** A sandboxed iframe inside VS Code where extensions render arbitrary HTML/CSS/JS.
- **Workspace trust:** A user-granted setting per folder controlling whether extensions can run unsafe code paths.

---

## 21. Update Cadence

This rulebook is valid for VS Code 1.105 → 1.117 (current April 2026 stable), `@vscode/vsce` 3.x, `ovsx` 0.10.x, esbuild 0.28.x, TypeScript 6.x, Node 22 LTS.

Re-run the generator when:
- VS Code's `engines.vscode` baseline you target moves up a major.
- `@vscode/vsce` ships 4.0 (signing-by-default change expected).
- `ovsx` ships 1.0.
- VS Code makes ESM the default extension format (no longer CJS).
- A security advisory affects esbuild, vsce, ovsx, or `@vscode/test-electron`.
- `vscode-languageclient` ships 10.x (next-tag is 10.0.0-next.17 as of this writing).

Stamp: 2026-04-27.
