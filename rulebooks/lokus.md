# Lokus Plugin Rulebook

A non-coder + AI agent ships a Lokus plugin (the local-first markdown PKM app, [lokusmd.com](https://lokusmd.com)) without asking technical questions. This file is the only doc the agent needs.

> **Lokus identified:** [Lokus](https://github.com/lokus-ai/lokus) — open-source markdown note-taking / PKM app built on Tauri 2 + Rust + React 19. Plugin docs: [docs.lokusmd.com](https://docs.lokusmd.com/plugins/creating-plugins/). Marketplace: `https://plugins.lokus.app`. Latest stable: v1.1.0 (March 2026); plugin SDK matured in the v1.3 "Quantum Leap" docs branch and is the canonical reference.

---

## 1. Snapshot

**Stack:** Lokus plugin — TypeScript class exporting `activate()` / `deactivate()`, sandboxed in a Web Worker, declared via `plugin.json`, distributed as a `.tgz` to `~/.lokus/plugins/` or to the central marketplace.

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.5+ | SDK ships `.d.ts`; type-checked permissions catch bugs early |
| Runtime + version | Lokus v1.1.0+ (Tauri 2.0, Web Worker sandbox, Node 20+ to build) | Latest stable; SDK requires Node 20 LTS |
| Package manager | pnpm 9 | Fast, lockfile-stable, no peer-dep hoist surprises |
| Build tool | `lokus-plugin build` (wraps esbuild) | Official; outputs `dist/index.js` matching manifest |
| Manifest format | `plugin.json` v2 (`manifest: "2.0"`) | Current schema; v1 still works but v2 unlocks publisher field |
| State mgmt | Plugin-scoped `storage` API | Persistent KV, per-plugin namespace, survives restart |
| Routing/Nav | `commands.register` + slash commands + status bar | The three official entry points users discover |
| Data layer | `editor` API for content, `workspace` API for files | Never use raw `fs`; sandbox blocks it |
| Auth | None (plugins are local; use `network` for OAuth flows) | Plugins run on user device, no auth boundary |
| Styling | `style.css` auto-loaded next to manifest | Scoped via plugin id prefix; do not inject `<style>` |
| Forms + validation | UI API dialogs (`ui.showInputBox`, `ui.showQuickPick`) | Native widgets; consistent with Lokus UI |
| Unit test runner | Vitest 2.x | SDK ships Vitest config; mocks for `context.api` |
| E2E framework | Playwright (drives Tauri WebView) | Only viable option for full app integration |
| Mocking strategy | Mock `context.api`; never mock filesystem | Editor/UI calls cross sandbox boundary, must be faked |
| Logger | `context.logger` (auto-prefixed with plugin id) | Built-in; routes to Lokus dev console |
| Error tracking | Stderr via `logger.error` + crash report dialog | Lokus collects no telemetry; users opt in |
| Lint + format | Biome 1.9 | One tool, zero config, fast |
| Type checking | `tsc --noEmit` | Strict mode; SDK types are accurate |
| Env vars + secrets | `storage` API (encrypted at rest by OS keychain) | Never commit; never put in `plugin.json` |
| CI provider | GitHub Actions | Free for public repos; matches marketplace publishing |
| Deploy target | `https://plugins.lokus.app` (central marketplace) | One-click install for users; auto-update |
| Release flow | `lokus-plugin publish` (after `login` + `package`) | Authoritative path; `.tgz` artifacts attached to GitHub release as backup |
| Auto-update | Marketplace checks every 6h, prompts user | User must consent; no silent updates |
| IPC pattern | Web Worker `postMessage` proxied through `context.api` | Direct Tauri `invoke` is blocked by sandbox |
| Permission scoping | Capability strings in `permissions[]` array | Runtime throws `PermissionDeniedError` if missing |
| Activation | `activationEvents: ["onStartup"]` for global; `onCommand:` for lazy | Lazy where possible; cold-start budget is 100ms |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Lokus app | 1.1.0 | 2026-03-03 | [github.com/lokus-ai/lokus/releases](https://github.com/lokus-ai/lokus/releases) |
| Tauri | 2.0 | 2024-10 | [tauri.app](https://tauri.app) |
| Plugin SDK runtime | 1.3 ("Quantum Leap") docs line | rolling | [docs.lokusmd.com/plugins/creating-plugins/](https://docs.lokusmd.com/plugins/creating-plugins/) |
| TipTap editor (host) | 3.x | 2025 | [tiptap.dev](https://tiptap.dev) |
| Node (build) | 20 LTS | 2025-04 | [nodejs.org](https://nodejs.org) |
| pnpm | 9.15 | 2025 | [pnpm.io](https://pnpm.io) |
| Biome | 1.9.4 | 2025 | [biomejs.dev](https://biomejs.dev) |
| Vitest | 2.1.x | 2025 | [vitest.dev](https://vitest.dev) |
| TypeScript | 5.5+ | 2025 | [typescriptlang.org](https://www.typescriptlang.org) |

### Minimum Host Requirements

- Lokus app installed (macOS 11+, Windows 10+, or Linux with glibc 2.31+).
- Disk: ~150MB for app + ~50MB per plugin sandbox.
- RAM: 4GB minimum (Lokus uses ~50MB; each plugin capped at 50MB).
- Build machine: Node 20 LTS + pnpm 9 + ~500MB free for SDK install.

### Cold-start Time

`git clone` to working dev plugin loaded in Lokus: **~3 minutes** on a clean machine (1 min Node/pnpm install, 30s `lokus-plugin` install, 30s scaffold + build, 1 min link + restart Lokus).

---

## 2. Zero-to-Running (Setup)

### macOS

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 20 LTS + pnpm
brew install node@20 pnpm
echo 'export PATH="/opt/homebrew/opt/node@20/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# 3. Install Lokus
brew install --cask lokus  # or download .dmg from https://lokusmd.com

# 4. Install the Lokus plugin CLI globally
pnpm add -g @lokus/plugin-cli

# 5. Verify
node --version    # expect: v20.x.x
pnpm --version    # expect: 9.x
lokus-plugin --version   # expect: 1.x

# 6. Auth to publish (skip if not publishing)
lokus-plugin login   # opens browser, OAuth via plugins.lokus.app
```

### Windows

```powershell
# 1. Install winget (preinstalled on Windows 11)
# 2. Install Node + pnpm
winget install OpenJS.NodeJS.LTS
winget install pnpm.pnpm

# 3. Install Lokus
winget install Lokus.Lokus

# 4. Install the CLI
pnpm add -g @lokus/plugin-cli

# 5. Verify (PowerShell)
node --version
pnpm --version
lokus-plugin --version
```

### Linux (Ubuntu/Debian)

```bash
# 1. Node 20 + pnpm
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
npm install -g pnpm@9

# 2. Lokus (.AppImage)
wget https://github.com/lokus-ai/lokus/releases/latest/download/Lokus.AppImage
chmod +x Lokus.AppImage
sudo mv Lokus.AppImage /usr/local/bin/lokus

# 3. CLI
pnpm add -g @lokus/plugin-cli

# 4. Verify
node --version && pnpm --version && lokus-plugin --version
```

### Bootstrap a new plugin

```bash
mkdir my-plugin && cd my-plugin
lokus-plugin init --template typescript
pnpm install
pnpm run build
lokus-plugin link    # symlinks dist/ into ~/.lokus/plugins/<id>
```

Restart Lokus. Open Settings → Plugins → enable your plugin. Open the command palette (Cmd/Ctrl+Shift+P) and run your command.

### Expected first-run output

```
$ lokus-plugin init --template typescript
✓ Created plugin.json
✓ Created src/index.ts
✓ Created tsconfig.json
✓ Created package.json
✓ Created style.css
✓ Created vitest.config.ts
✓ Created README.md

$ pnpm install
...packages installed...

$ pnpm run build
> tsc && esbuild src/index.ts --bundle --format=esm --outfile=dist/index.js
  dist/index.js  4.2kb
✓ Build complete

$ lokus-plugin link
✓ Linked /Users/you/.lokus/plugins/my-plugin → /Users/you/code/my-plugin/dist
✓ Restart Lokus to load the plugin
```

### Common first-run errors

| Error | Fix |
|---|---|
| `EACCES: permission denied … ~/.lokus/plugins` | `mkdir -p ~/.lokus/plugins && chmod 755 ~/.lokus/plugins` |
| `lokus-plugin: command not found` | Re-run `pnpm add -g @lokus/plugin-cli`; ensure global pnpm bin is in `$PATH` (`pnpm setup`) |
| Plugin not appearing after restart | Toggle Settings → Plugins → "Enable plugins"; check `~/.lokus/logs/plugin.log` for load errors |
| `PermissionDeniedError: editor:write` | Add `"editor:write"` to `permissions` in `plugin.json`, rebuild, reload |
| `Manifest version mismatch (lokusVersion)` | Set `lokusVersion: "^1.0.0"` (or `engines.lokus` for v2 manifest) |
| Hot reload not triggering | Run `lokus-plugin dev` instead of `build`; keeps watcher attached |
| Build output too large (>1MB) | Add `external: ["@lokus/sdk"]` in esbuild config; SDK is provided by host |

---

## 3. Project Layout

```
my-plugin/
├── plugin.json              # Manifest — id, version, permissions, activation, contributes
├── package.json             # Build deps + scripts (only used at build time)
├── tsconfig.json            # Strict mode, target ES2022
├── biome.json               # Lint + format
├── vitest.config.ts         # Test runner config
├── README.md                # Marketplace listing copy + screenshots
├── CHANGELOG.md             # User-facing version history
├── LICENSE                  # MIT or similar
├── style.css                # Optional, auto-loaded; scoped to plugin id
├── src/
│   ├── index.ts             # Entry: export default class with activate/deactivate
│   ├── commands/            # One file per registered command
│   │   └── echoNote.ts
│   ├── views/               # UI panel React components (if any)
│   └── lib/                 # Pure helpers (no API calls)
├── tests/
│   ├── unit/                # *.test.ts — pure logic
│   └── fixtures/            # Mocked context.api, sample notes
├── assets/
│   └── icon.png             # 128×128 PNG, marketplace listing
└── dist/                    # Build output — gitignored, what link/package ships
    └── index.js
```

### Naming conventions

- Plugin id: `kebab-case`, no `lokus.` prefix (e.g. `echo-note`, `daily-rollup`).
- Command id: `pluginId.verbNoun` (e.g. `echoNote.create`, `dailyRollup.generate`).
- Files: `kebab-case.ts`. Classes: `PascalCase`. Functions: `camelCase`.
- Tests: `<file>.test.ts` colocated under `tests/unit/`.
- CSS classes: prefix with plugin id (e.g. `.echo-note-panel`) to avoid collisions.

### Where things go

| Adding | Goes in |
|---|---|
| New command | `src/commands/<name>.ts`; register in `src/index.ts` activate(); declare in `plugin.json` `contributes.commands` |
| New slash command (`/`) | Same as command, plus `contributes.slashCommands` entry |
| New status bar item | `src/index.ts` activate via `api.ui.statusBar.addItem(...)` |
| New context-menu entry | `plugin.json` `contributes.menus.editorContext` |
| New keybinding | `plugin.json` `contributes.keybindings` |
| New view/panel | `src/views/<Name>.tsx`; declare `contributes.views` |
| New theme | Separate plugin with `categories: ["Themes"]` and `contributes.themes` |
| New editor extension (TipTap) | `src/extensions/<name>.ts`; register via `api.editor.registerExtension(...)` |
| Persistent setting | Use `api.config.get/set`; declare default in `plugin.json` `contributes.configuration` |
| Persistent user data | `api.storage.set(key, value)` — NOT `localStorage` |
| HTTP call | `api.network.fetch(url, opts)` with `network:http` permission |
| Background timer | `setInterval` inside activate; clear in deactivate |
| Test for command | `tests/unit/commands/<name>.test.ts`, mock `context.api` |
| Asset (icon, font) | `assets/`; reference via relative path in manifest |
| Marketplace screenshot | `assets/screenshots/*.png`; declare in `plugin.json` `gallery` |

---

## 4. Architecture

### Process boundaries

```
┌────────────────────────────────────────────────────────────────┐
│ Lokus Tauri main process (Rust)                                │
│  - File I/O, search, OAuth, P2P sync, MCP server               │
│  - Tauri IPC (invoke/event), capability gating                 │
└─────────▲──────────────────────────────────────────────────────┘
          │ IPC (proxied; plugin cannot invoke directly)
┌─────────┴──────────────────────────────────────────────────────┐
│ Renderer (React 19, Zustand, Vite 7)                           │
│  - Editor (TipTap 3), file tree, command palette, status bar   │
│  - PluginHost: spawns workers, validates permissions           │
└─────────▲──────────────────────────────────────────────────────┘
          │ postMessage (proxied API calls + events)
┌─────────┴──────────────────────────────────────────────────────┐
│ Plugin sandbox (Web Worker, isolated-vm style)                 │
│  - Your activate(context) runs here                            │
│  - No fetch, no localStorage, no Tauri global                  │
│  - 50MB RAM cap, 1s CPU/task, 1000 API calls/min cap           │
└────────────────────────────────────────────────────────────────┘
```

### Data flow for a command

```
user presses Cmd+Shift+P → command palette
  ↓
user picks "Echo Note: Create"
  ↓
renderer dispatches command id → PluginHost
  ↓
PluginHost postMessage({type:"command", id:"echoNote.create"}) → worker
  ↓
worker invokes registered handler → returns via postMessage
  ↓
handler calls context.api.editor.insertContent("...")
  ↓
PluginHost validates "editor:write" permission → forwards to editor
  ↓
TipTap mutates document → renderer re-renders
```

### Auth flow

Plugins do not authenticate to Lokus itself. If a plugin needs an external OAuth token (Notion, Google, etc.), the flow is:

```
plugin → api.network.fetch(authUrl) → opens system browser
  ↓
user authorizes; redirect URL contains token
  ↓
plugin captures token via api.commands.register("plugin.oauthCallback", ...)
  ↓
plugin stores in api.storage (OS-keychain backed for sensitive keys)
  ↓
subsequent api.network.fetch calls include Bearer token from storage
```

### State management flow

```
plugin internal state (in worker memory) ──── lost on reload
                  │
                  ▼ (on important changes)
            api.storage.set("key", value) ──── survives restart
                  │
                  ▼ (cross-plugin or to host)
            api.events.emit("name", data) ─── other plugins/host listen
```

### Entry-point file map

| File | Owns |
|---|---|
| `plugin.json` | Identity, permissions, activation, `contributes.*` declarations. Read by host before any plugin code runs. |
| `src/index.ts` | Default-export class with `constructor(context)`, `activate()`, `deactivate()`. Single entry — host expects exactly this shape. |
| `src/commands/*.ts` | One handler per file. Pure functions ideally; receives `(api, args)`. |
| `src/views/*.tsx` | React components rendered into Lokus UI panels. |
| `src/lib/*.ts` | Pure helpers — no API calls, no side effects. Easy to unit test. |
| `style.css` | Plugin styling. Auto-scoped by host with `[data-plugin-id="x"]` wrapper. |
| `dist/index.js` | Bundled output the host loads. Never edit by hand. |

**Business logic lives in:** `src/lib/` (pure) and `src/commands/<name>.ts` (orchestration).
**Business logic does NOT live in:** `src/index.ts` (only registration), `plugin.json` (only declarations), `src/views/` (only rendering — call commands).

---

## 5. Dev Workflow

### Start dev server

```bash
pnpm run dev
# equivalent to: lokus-plugin dev
# - watches src/ with esbuild
# - rebuilds dist/index.js on save
# - sends reload signal to Lokus over IPC (no app restart needed)
# - hot reload completes in ~200ms
```

### Hot reload behavior

Hot reload preserves: editor content, open tabs, workspace state.
Hot reload **resets**: plugin's in-memory state (any `this.foo = ...` set in activate). Use `api.storage` for anything that must survive reload.

Hot reload breaks when: you change `plugin.json` (manifest is read once at boot). After manifest changes, fully restart Lokus.

### Attach a debugger

**VS Code / Cursor**

`.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Lokus plugin worker",
      "type": "chrome",
      "request": "attach",
      "port": 9229,
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

Launch Lokus with debug flag: `LOKUS_PLUGIN_DEBUG=1 lokus`. Open VS Code → Run → "Attach to Lokus plugin worker." Set breakpoints in `src/`.

**Chrome DevTools (alternative)**

In Lokus: View → Developer → Toggle Developer Tools → Sources tab. Plugin worker shows as `worker:plugin/<your-id>`.

### Inspect runtime state

- **Logs:** `tail -f ~/.lokus/logs/plugin-<id>.log` (macOS/Linux) or `%APPDATA%\Lokus\logs\` (Windows).
- **Storage:** Settings → Plugins → your plugin → "View storage" (raw JSON dump).
- **Permissions:** Settings → Plugins → your plugin → "Permissions" tab shows granted vs requested.
- **Network:** Built-in network monitor at View → Developer → Network. Plugin requests prefixed `[plugin:<id>]`.

### Pre-commit checks

`.lefthook.yml` (or `husky`):

```yaml
pre-commit:
  parallel: true
  commands:
    typecheck:
      run: pnpm tsc --noEmit
    lint:
      run: pnpm biome check --apply src tests
    test:
      run: pnpm vitest run --changed
```

### Branch + commit conventions

- Branches: `feat/<short-name>`, `fix/<short-name>`, `chore/<short-name>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- One PR per feature; squash-merge to main.

---

## 6. Testing & Parallelization

### Unit tests

```bash
pnpm test                     # full run
pnpm test --watch             # watch mode
pnpm test src/commands/echoNote.test.ts   # single file
pnpm test -t "inserts timestamp"          # by name
```

Tests live in `tests/unit/<mirror src path>.test.ts`.

`vitest.config.ts`:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 70 }
    },
    setupFiles: ['./tests/fixtures/setup.ts']
  }
});
```

`tests/fixtures/setup.ts` (mock context):

```typescript
import { vi } from 'vitest';

export function makeMockApi() {
  return {
    editor: {
      getContent: vi.fn().mockResolvedValue(''),
      insertContent: vi.fn().mockResolvedValue(undefined),
      replaceSelection: vi.fn().mockResolvedValue(undefined),
    },
    commands: { register: vi.fn(), execute: vi.fn() },
    ui: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showInputBox: vi.fn(),
    },
    storage: {
      get: vi.fn().mockResolvedValue(null),
      set: vi.fn().mockResolvedValue(undefined),
    },
    network: { fetch: vi.fn() },
  };
}

export function makeContext() {
  return {
    api: makeMockApi(),
    logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
}
```

### Integration tests

Spawn Lokus headlessly with the plugin linked, then drive via Tauri test harness:

```bash
pnpm test:integration
# launches Lokus with --test --headless --plugin=./dist
# runs tests/integration/*.test.ts against live worker
```

### E2E (Playwright)

`playwright.config.ts`:

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: process.env.CI ? 2 : 4,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'lokus', use: { launchOptions: { executablePath: process.env.LOKUS_BIN } } },
  ],
});
```

Run: `LOKUS_BIN=/Applications/Lokus.app/Contents/MacOS/Lokus pnpm test:e2e`.

### Mocking rules

- **Mock:** `context.api.*` (always — sandbox boundary). External HTTP. Time (`vi.useFakeTimers()`).
- **Never mock:** Pure functions in `src/lib/`. The Lokus host itself in unit tests (use real-ish mocks per shape).
- **Real (don't mock):** Filesystem in integration tests — Lokus uses temp workspace.

### Coverage target

- Lines: ≥80%. Functions: ≥80%. Branches: ≥70%.
- Measured via `pnpm test -- --coverage`. Gate CI on these.

### Visual regression

Skip unless your plugin contributes a UI panel. If yes: Playwright screenshots into `tests/e2e/__screenshots__/`, committed; PRs auto-diff.

### Parallelization patterns for AI agents

**Safe to fan out as parallel subagents:**
- "Scaffold command file `A` + scaffold command file `B` + scaffold command file `C`" (disjoint files).
- "Write unit tests for command `A` + write unit tests for command `B`."
- "Update README + update CHANGELOG + bump version in package.json" (different files; keep version bump on the package.json change).

**Must be sequential (single agent):**
- Anything touching `plugin.json` (manifest is canonical; concurrent edits clobber).
- Anything touching `package.json` or `pnpm-lock.yaml` (lockfile churn).
- Permission additions (must update manifest + verify in `src/` that the API is actually used).
- Renames of plugin id (touches manifest, README, marketplace listing, CI workflow).

---

## 7. Logging

### Setup

Use `context.logger` — already initialized when your class is constructed. Do **not** instantiate your own logger; do **not** `console.log` (silenced in production sandbox).

```typescript
export default class EchoNotePlugin {
  constructor(context: LokusPluginContext) {
    this.api = context.api;
    this.log = context.logger;
  }

  async activate() {
    this.log.info('plugin activated', { version: '1.0.0' });
  }
}
```

### Levels

- `debug`: dev-only diagnostics. Filtered out in production builds.
- `info`: normal lifecycle (activated, deactivated, command invoked).
- `warn`: recoverable problems (config missing, fell back to default).
- `error`: failures the user might notice. Include `Error` object as second arg.

### Required fields on every log line

The host auto-injects: `plugin_id`, `plugin_version`, `timestamp`, `level`. Your structured payload should add:

- `event`: short verb-noun (e.g. `"command_invoked"`, `"network_failed"`).
- `command_id`: when relevant.
- `duration_ms`: for any operation taking >50ms.
- `error_code`: when applicable.

### Sample lines

```
[2026-04-27T10:00:01Z] [echo-note@1.0.0] info  event=plugin_activated startup_ms=18
[2026-04-27T10:00:14Z] [echo-note@1.0.0] info  event=command_invoked command_id=echoNote.create
[2026-04-27T10:00:14Z] [echo-note@1.0.0] info  event=note_inserted duration_ms=12 length=42
[2026-04-27T10:01:22Z] [echo-note@1.0.0] warn  event=storage_quota_high used_bytes=4500000
[2026-04-27T10:02:01Z] [echo-note@1.0.0] error event=network_failed url=https://api.example.com error_code=ETIMEDOUT
```

### Log destinations

- Dev: stdout of `pnpm run dev` + Lokus DevTools console.
- Prod: `~/.lokus/logs/plugin-<id>.log` (rotated at 10MB, kept 5 files).
- Lokus does NOT ship logs anywhere by default. If you want remote error tracking, you must request `network:http` and POST to your endpoint.

### Grep locally

```bash
# macOS/Linux
tail -f ~/.lokus/logs/plugin-echo-note.log | grep -E "error|warn"

# Windows PowerShell
Get-Content "$env:APPDATA\Lokus\logs\plugin-echo-note.log" -Wait | Select-String "error|warn"
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always declare every API permission in `plugin.json` `permissions[]` before calling that API. The runtime throws `PermissionDeniedError` and your plugin is dead.
2. Always run `pnpm tsc --noEmit && pnpm biome check src && pnpm vitest run` before claiming a task done.
3. Always export the plugin class as `export default class`. The host imports the default; named exports are ignored.
4. Always implement both `activate(context)` and `deactivate()`. Return `Promise<void>` (or sync void) from both.
5. Always store user-visible data via `api.storage.set`, never `localStorage` / `IndexedDB` (sandbox blocks them).
6. Always make HTTP calls via `api.network.fetch`. Global `fetch` is undefined in the sandbox.
7. Always namespace command ids with the plugin id (e.g. `echoNote.create`, not `create`). Collisions silently fail.
8. Always clear timers and intervals you create in `deactivate()`. The host cleans up registered API resources but not raw `setInterval`.
9. Always test with `lokus-plugin link` before `package`. Linking catches manifest errors fast.
10. Always pin `lokusVersion` (or `engines.lokus`) to a caret range like `^1.0.0`. Never `*` or `latest`.
11. Always validate user input from `ui.showInputBox` before passing to filesystem or network APIs.
12. Always handle `await api.editor.getContent()` returning `null` (no editor open).
13. Always include an `icon.png` (128×128) in `assets/` and reference it from `plugin.json`. Marketplace rejects plugins without one.
14. Always update `CHANGELOG.md` for every released version. Marketplace shows it on the listing page.
15. Always use `api.ui.showErrorMessage` for user-facing errors, `logger.error` for diagnostics. They are different audiences.
16. Always set `activationEvents: ["onCommand:<id>"]` for command-only plugins. `onStartup` adds startup cost.
17. Always read `lokusVersion` from `package.json` of `@lokus/sdk` when in doubt — that's the source of truth.
18. Always test on at least one OS other than your dev OS before publishing — Tauri WebView quirks differ.
19. Always ship `dist/` only in the published `.tgz` (set `files` field in `package.json`). Source is excluded.
20. Always commit `pnpm-lock.yaml`. Reproducible builds matter for marketplace review.
21. Always quote command ids exactly as declared in `plugin.json` `contributes.commands` when registering at runtime — they must match.
22. Always use `api.editor.replaceSelection` for inline insertion, `insertContent` for cursor-position insertion, `setContent` for full-document replacement. They are not interchangeable.

### 8.2 NEVER

1. Never call `require('fs')`, `require('child_process')`, or any Node built-in. The sandbox is browser-like.
2. Never use `eval` or `new Function`. CSP blocks them; the host kills your worker.
3. Never write to disk outside `api.storage` or `api.workspace.writeFile`. Direct paths fail silently or get blocked.
4. Never hardcode workspace paths. Use `api.workspace.rootPath` (returns `null` if no workspace open).
5. Never mutate the document inside an editor read callback (`onUpdate`). It causes re-entrancy bugs.
6. Never block `activate()` on a network call. Activation has a 2s budget; exceeding it disables your plugin.
7. Never store secrets in `plugin.json`. It is publicly readable; ship secrets via OAuth flow into `api.storage`.
8. Never override another plugin's command id. Collisions are last-write-wins and impossible to debug.
9. Never use plugin id starting with `lokus.` — reserved for first-party plugins; manifest validation rejects it.
10. Never publish without bumping `version` in `plugin.json`. Marketplace deduplicates by `id+version` and silently rejects.
11. Never call `api.commands.execute` recursively from inside the same command's handler. Stack overflow risk.
12. Never directly `import` from another plugin. Cross-plugin communication is via `api.events.emit/on`.
13. Never use `setTimeout` with delay > 30s without checking `deactivate` flag — your plugin may be unloaded mid-flight.
14. Never assume the editor is open. `api.editor.*` rejects when no editor active; check `api.editor.isActive()` first.
15. Never modify `dist/` by hand. Edit `src/`, rebuild.
16. Never use `Date.now()` in tests without `vi.useFakeTimers()` — flaky.
17. Never mark `permissions: ["*"]` thinking it grants all. There is no wildcard; the runtime warns and grants none.
18. Never bundle `@lokus/sdk` into your `dist/` — mark it `external` in esbuild. The host provides the runtime version.
19. Never log full note content at `info` level. Privacy boundary; PII concerns. Use `debug` at most.
20. Never use `crypto.subtle` from the sandbox without `crypto:subtle` permission — silently returns undefined otherwise.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `plugin.json` | Boots, permissions, activation, marketplace listing | Restart Lokus; check Settings → Plugins shows it; check `~/.lokus/logs/plugin.log` has no manifest errors; run full unit + integration suite |
| `src/index.ts` | Entire plugin lifecycle | `pnpm tsc --noEmit && pnpm vitest run && lokus-plugin link && restart` |
| `src/commands/*.ts` | The specific command + anything that calls `api.commands.execute` of it | Unit test that command, run it via palette in linked Lokus |
| `src/views/*.tsx` | UI panel rendering | Visual smoke: open the panel; check React devtools for errors |
| `style.css` | All plugin-rendered DOM | Visual diff in linked Lokus; verify no leakage to host UI |
| `package.json` (deps) | Build + bundle size | `pnpm install && pnpm build && du -sh dist/` (must stay <1MB) |
| `package.json` (scripts) | CI + dev workflow | Run each script locally; check CI green |
| `pnpm-lock.yaml` | Reproducible builds | Delete `node_modules`, `pnpm install`, full test run |
| `tsconfig.json` | Type checking, emit | `pnpm tsc --noEmit` clean; rebuild from cold |
| `biome.json` | Lint + format rules | `pnpm biome check src` clean across whole repo |
| `vitest.config.ts` | Unit test infra | `pnpm test` runs and discovers all expected tests |
| `playwright.config.ts` | E2E infra | `pnpm test:e2e` launches Lokus and reaches first assertion |
| `tests/fixtures/setup.ts` | Every unit test | Run full `pnpm test` |
| `assets/icon.png` | Marketplace listing | Re-run `lokus-plugin package`; check `.tgz` includes it |
| `README.md` | Marketplace listing copy | View in marketplace preview: `lokus-plugin preview` |
| `CHANGELOG.md` | Marketplace listing version notes | Same as README |
| `.github/workflows/ci.yml` | All PRs/releases | Push branch; GH Actions green |
| `.github/workflows/release.yml` | Marketplace publish | Tag `v1.0.0` on a throwaway branch with `--draft`; verify artifact upload |
| `LICENSE` | Marketplace acceptance | Marketplace requires SPDX-recognized license; check listing page |
| `dist/` | What ships | Never edit; rebuild instead. Verify with `lokus-plugin package --dry-run` |
| `~/.lokus/plugins/<id>/` (linked) | Live plugin in your dev Lokus | `lokus-plugin unlink && lokus-plugin link` to reset |
| `permissions[]` (in `plugin.json`) | Every API call your plugin makes | Grep `src/` for `api.*` usages; ensure each is covered |

### 8.4 Definition of Done (per task type)

**Bug fix**
- Reproduce in test (failing) before patching.
- `pnpm test` green; new test covers the bug.
- `pnpm tsc --noEmit && pnpm biome check src` green.
- Linked Lokus: manually trigger the previously-broken path; capture log line showing it now works.
- `CHANGELOG.md` line under "Fixed."
- Do NOT bump major; only patch.

**New feature**
- Unit tests for the new command(s) / API calls.
- Integration test exercising it through the host.
- Manual smoke in linked Lokus; capture screenshot if UI.
- Permission(s) declared in `plugin.json`; cross-checked vs `src/`.
- README updated with the new feature.
- `CHANGELOG.md` line under "Added."
- Bump minor (e.g. 1.2.x → 1.3.0).
- Do NOT add user-visible UI without an icon and a help tooltip.

**Refactor**
- Existing tests pass with no modification.
- No behavior change observable to the user.
- No new permissions.
- Bundle size delta within ±5% (verify `du -sh dist/`).
- Do NOT refactor and add features in the same PR.

**Dependency bump**
- `pnpm up <pkg>` (not `update` — different command).
- Full unit + integration + E2E pass.
- Bundle size verified (some deps bloat fast).
- `CHANGELOG.md` only if user-observable.
- Do NOT bump SDK major version without reading the migration guide first.

**Schema change (storage shape)**
- Migration function in `src/lib/migrate.ts` keyed by plugin version.
- Test the migration with a fixture from the old shape.
- Bump minor (or major if destructive).
- Do NOT delete old keys without a deprecation cycle (one minor version with both supported).

**Copy change (README/CHANGELOG)**
- Visual check in `lokus-plugin preview`.
- Spell-check.
- No version bump needed unless you also re-publish.

### 8.5 Self-Verification Recipe

The exact sequence the AI runs before declaring done:

```bash
pnpm install                          # → "+N packages" or "Already up-to-date"
pnpm tsc --noEmit                     # → no output (success)
pnpm biome check src tests            # → "Checked N files in Xms. No fixes applied."
pnpm vitest run                       # → "Test Files N passed (N)" + "Tests M passed (M)"
pnpm build                            # → "dist/index.js  X.Xkb"
lokus-plugin package --dry-run        # → "Would create my-plugin-1.0.0.tgz (Xkb)"
lokus-plugin link                     # → "Linked /path → ~/.lokus/plugins/my-plugin"
# Restart Lokus; manually run the affected commands.
# Tail the log:
tail -n 50 ~/.lokus/logs/plugin-<id>.log    # → no "error" lines for the action just performed
```

Green = every step exits 0, no `error` lines in the plugin log, manual smoke matches expected behavior.

### 8.6 Parallelization Patterns

**Safe parallel fan-out (different agents, no coordination):**
- One agent writes `src/commands/foo.ts`; another writes `src/commands/bar.ts`. Both register in `index.ts` last (sequential merge step).
- Tests for disjoint modules: `tests/unit/commands/foo.test.ts` + `tests/unit/commands/bar.test.ts`.
- Documentation: `README.md` + `CHANGELOG.md` + JSDoc improvements in `src/lib/`.

**Must be sequential:**
- Any change to `plugin.json` (single source of truth for manifest).
- Any change to `package.json` or `pnpm-lock.yaml` (lockfile concurrency = pain).
- Adding a permission AND the API call that uses it (must verify together).
- Renaming the plugin id (touches manifest, all logs, marketplace, CI badges, README).
- Bumping plugin version (single string in two files: `plugin.json`, `package.json`).

---

## 9. Stack-Specific Pitfalls

1. **`fetch is not defined`** — Symptom: `ReferenceError: fetch is not defined` at runtime. Cause: tried global `fetch` instead of `api.network.fetch`. Fix: `await this.api.network.fetch(url)`. Detect: add lint rule `no-restricted-globals: ['fetch']`.
2. **Plugin doesn't load after enabling** — Symptom: toggle in Settings does nothing. Cause: `plugin.json` invalid (often missing `main` or `id` mismatch). Fix: `lokus-plugin validate ./plugin.json`. Detect: pre-commit hook runs the validator.
3. **Hot reload preserves stale state** — Symptom: code change visible, but old data persists. Cause: `api.storage` survives reload by design. Fix: clear via Settings → Plugins → "Clear storage" during dev. Detect: log storage version key at activate.
4. **Slash command not appearing** — Symptom: typing `/yourcmd` shows nothing. Cause: forgot `contributes.slashCommands` in manifest, or trigger string collides. Fix: declare in `plugin.json` and rebuild manifest cache (full app restart). Detect: check `~/.lokus/logs/main.log` for "duplicate slash command".
5. **Editor mutation during onUpdate causes infinite loop** — Symptom: app freezes. Cause: handler that subscribes to `editor.onUpdate` calls `editor.insertContent` synchronously. Fix: debounce or check a sentinel; never write inside read callback. Detect: CPU-quota error in logs.
6. **`PermissionDeniedError`** — Symptom: feature throws on first call. Cause: API used but permission missing in manifest. Fix: add the exact permission string (per Section 8.5 of docs). Detect: try-catch in dev with `error.code === 'PERMISSION_DENIED'`.
7. **Bundled SDK conflicts with host SDK** — Symptom: weird API behavior, types from one version, runtime from another. Cause: didn't mark `@lokus/sdk` external in esbuild. Fix: `external: ['@lokus/sdk']` in build config. Detect: bundle size jumps by >100KB after adding SDK as dep.
8. **Plugin works on dev's Mac, breaks on Windows** — Symptom: only one user reports issue. Cause: path separator (`/` vs `\`), filesystem case sensitivity. Fix: use `api.workspace` helpers (cross-platform), avoid string-concat paths. Detect: cross-OS CI matrix in GH Actions.
9. **Marketplace rejects with "icon required"** — Symptom: `lokus-plugin publish` fails. Cause: missing `assets/icon.png` or wrong dimensions. Fix: 128×128 PNG; reference in `plugin.json` `icon` field. Detect: `lokus-plugin package --dry-run` warns.
10. **Worker hits memory cap silently** — Symptom: API calls start failing after a while. Cause: 50MB cap exceeded; worker degraded. Fix: `api.storage` for large data; never hold full notes in memory. Detect: log `performance.memory.usedJSHeapSize` periodically.
11. **`api.storage.get` returns `null` after upgrade** — Symptom: user data disappears after plugin update. Cause: storage scope keyed by old plugin id (renamed) or migration not run. Fix: never rename id post-publish; ship a one-time migration. Detect: log a `storage_version` key at every activate.
12. **TypeScript compiles, runtime crashes** — Symptom: types say `editor.getContent(): string` but runtime returns `null`. Cause: SDK types lag actual returns. Fix: always treat `editor.*` returns as `T | null`. Detect: `strictNullChecks: true` in tsconfig + manual review.
13. **Tests pass, plugin fails in Lokus** — Symptom: `vitest` green, manual smoke broken. Cause: mock context drifts from real API. Fix: regenerate mocks from `@lokus/sdk` types via codegen, or write integration tests. Detect: integration suite catches it.
14. **OAuth redirect loops in Lokus** — Symptom: browser opens but token never reaches plugin. Cause: redirect URI not registered as `lokus://plugin/<id>/callback`. Fix: register custom protocol in OAuth provider; declare `contributes.uriHandlers` in manifest. Detect: Lokus logs "no handler for URI scheme".
15. **`activationEvents: ["*"]` makes Lokus startup slow** — Symptom: cold start jumps from 1s to 4s after enabling plugin. Cause: eager activation. Fix: switch to `onCommand:<id>` lazy activation. Detect: `LOKUS_TRACE_STARTUP=1 lokus` logs per-plugin activation time.
16. **Plugin survives uninstall but commands gone** — Symptom: leftover storage, but command palette empty. Cause: uninstall removed manifest but storage scoped per plugin id stays unless purged. Fix: Settings → Plugins → "Purge data" or delete `~/.lokus/plugins/<id>/` manually. Detect: docs only — no automatic detection.
17. **Theme plugin breaks on dark mode toggle** — Symptom: colors wrong after switching. Cause: hardcoded color values in CSS, not using `var(--lokus-*)` tokens. Fix: use design tokens; subscribe to `events.on("theme:changed")`. Detect: manual test on both modes.
18. **Plugin id collision with private existing plugin** — Symptom: install replaces another plugin without warning. Cause: id is global namespace; no scoping. Fix: prefix with your handle (`yourname-echo-note`). Detect: search marketplace before publishing.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Activation time | ≤ 100ms (lazy) / ≤ 200ms (`onStartup`) | `LOKUS_TRACE_STARTUP=1 lokus`; logs `plugin_activate_ms=X` |
| Memory per plugin | ≤ 25MB (host caps at 50) | `performance.memory.usedJSHeapSize` in worker |
| API call rate | ≤ 100/min sustained, 1000/min burst | Host enforces; check `quota-exceeded` events in logs |
| Command handler P95 | ≤ 50ms | Log `duration_ms` per command; aggregate over 100 invocations |
| Bundle size (`dist/index.js`) | ≤ 200KB minified | `du -sh dist/` after `pnpm build` |
| Disk usage (storage) | ≤ 5MB per workspace | `du -sh ~/.lokus/plugins/<id>/storage/` |
| Network call timeout | ≤ 10s default; never > 30s | Pass `signal: AbortSignal.timeout(10000)` |
| Hot reload time | ≤ 500ms | `pnpm dev` logs `reloaded in Xms` |

When budget exceeded:
- **Activation:** move work into the first command handler (lazy init).
- **Memory:** chunk reads; flush to `storage` and re-read.
- **API rate:** batch via `events.emit` debouncing.
- **Bundle:** check for accidentally bundled SDK; tree-shake; `external` more deps.
- **Storage:** prune old entries; consider `storage:write` permission split.

---

## 11. Security

### Secret storage

- Use `api.storage.set("token:<provider>", value)` — backed by OS keychain on macOS/Windows for keys prefixed `token:` or `secret:`.
- **Never put secrets in:** `plugin.json`, `README.md`, log lines (even at `debug`), commit history.
- Rotate by overwriting the key; old value not recoverable.

### Auth threat model

- Plugin code is local; trust boundary is the **sandbox**, not the network.
- The user trusts the plugin author with the permissions granted at install time. Any new permission requires explicit re-grant on update.
- Plugins **cannot** see each other's storage. Plugins **cannot** read the keychain entries of other plugins.
- A malicious plugin with `network:http` can exfiltrate any data it can `read`. Minimize permissions.

### Input validation boundary

Validate everything that crosses these boundaries:

- **User input** from `ui.showInputBox`, `ui.showQuickPick` → validate length, allowed chars, pattern.
- **Network responses** → parse with [Zod](https://zod.dev) or hand-rolled type guards before use.
- **File contents** read via `api.workspace.readFile` → treat as untrusted; never `eval` or `JSON.parse` without try-catch.
- **Other plugins' events** received via `api.events.on` → validate payload shape.

### Output escaping

- Inserting into the editor: prefer `api.editor.insertContent(text)` over `setContent(html)`. The text path escapes automatically.
- Rendering to a UI view (React): React escapes by default; never use `dangerouslySetInnerHTML` with untrusted data.
- Logging: stringify objects via `JSON.stringify`, never via template literals (PII risk).

### Permissions you can declare

Declare only what you call. Each line in `permissions[]` of `plugin.json`:

| Permission | Lets you |
|---|---|
| `editor:read` | Read current document content |
| `editor:write` | Insert / replace / mutate document |
| `editor:extension` | Register TipTap extensions |
| `commands:register` | Add commands to the palette |
| `commands:execute` | Programmatically run commands |
| `ui:notifications` | Show info/warn/error messages |
| `ui:dialogs` | Show input box / quick pick / modal |
| `ui:statusBar` | Add status bar items |
| `ui:views` | Contribute panels |
| `workspace:read` | List/read files in workspace |
| `workspace:write` | Create/move/delete files |
| `workspace:watch` | Subscribe to file change events |
| `storage:read` / `storage:write` | Plugin-scoped KV |
| `network:http` | Make HTTP calls |
| `network:websocket` | WebSocket connections |
| `clipboard:read` / `clipboard:write` | Clipboard access |
| `terminal:create` | Spawn an integrated terminal |
| `theme:contribute` | Register a theme |
| `config:read` / `config:write` | User settings access |
| `events:emit` / `events:subscribe` | Cross-plugin events |
| `crypto:subtle` | Web Crypto Subtle API |
| `mcp:tools` | Expose tools to MCP clients |

### Dependency audit

```bash
pnpm audit --prod                    # weekly; CI on every PR
pnpm outdated                        # monthly
```

### Top 5 risks

1. **Over-broad permissions** — don't request `network:http` "just in case." Each unused permission is attack surface and erodes user trust.
2. **Eval'd note content** — never `eval`/`Function(...)` user-authored text. Notes are untrusted input.
3. **Token leakage in logs** — even at `debug` level, never log auth headers or full URLs with query-string tokens.
4. **Mixed-content network calls** — only use `https://`. The host blocks `http://` unless explicitly allowed.
5. **Cross-plugin event abuse** — if you `events.emit` sensitive payloads, any plugin with `events:subscribe` can read them. Encrypt or scope by id.

---

## 12. Deploy

### Full release flow

```bash
# 1. Bump version (patch/minor/major)
pnpm version patch                   # bumps package.json AND plugin.json
# Note: lokus-plugin syncs both files

# 2. Update CHANGELOG.md under [Unreleased] section, move to new version

# 3. Verify
pnpm install
pnpm tsc --noEmit
pnpm biome check src tests
pnpm vitest run --coverage
pnpm build

# 4. Package + dry-run publish
lokus-plugin package
lokus-plugin publish --dry-run       # validates manifest, icon, license, version

# 5. Tag and push
git add . && git commit -m "release: v$(node -p "require('./package.json').version")"
git tag "v$(node -p "require('./package.json').version")"
git push --tags

# 6. Publish (CI does this on tag, or run locally)
lokus-plugin publish

# 7. Verify in marketplace
open "https://plugins.lokus.app/p/$(node -p "require('./plugin.json').id")"
```

### Staging vs prod

- "Staging" = `lokus-plugin link` to your local Lokus.
- "Beta" = `lokus-plugin publish --tag beta`. Users opt in via Settings → Plugins → "Show pre-releases."
- "Prod" = `lokus-plugin publish` (default tag `latest`). Auto-update reaches all users within ~6h.

### Rollback

```bash
lokus-plugin unpublish --version <bad-version>   # within 24h of publish only
# After 24h: publish a new patch version that reverts.
```

Max safe rollback window: **24h** for unpublish. After that, ship a fix.

### Health check

There is no remote health endpoint for plugins (they run on user devices). Indirect signals:

- Marketplace listing → crash reports tab (users can submit; opt-in).
- GitHub issues with the `bug` label.
- `lokus-plugin stats` — install count, active install count, average rating.

### Versioning scheme

SemVer 2.0.0. Stored in two places (kept in sync by `pnpm version`):

- `plugin.json` `"version"` — what the host sees.
- `package.json` `"version"` — what npm/pnpm sees.

If they drift, marketplace publish fails.

### Auto-update

Lokus checks the marketplace every 6h. On a new version:

- **Same major:** auto-installed (after user toggle "auto-update" — default ON).
- **New major:** prompts user (new permissions may need re-grant).

The user can disable auto-update per-plugin or globally.

### DNS / domain wiring

Not applicable — distribution is via the central marketplace at `https://plugins.lokus.app`. You own no DNS for the plugin itself; if you have a homepage, link it from `plugin.json` `"homepage"`.

### Cost estimate per 1k MAU

**$0.** Marketplace hosting is free for plugin authors. The only costs:

- GitHub Actions minutes: free tier covers small plugins.
- Domain for plugin homepage (optional): ~$12/yr.
- Error reporting backend if you wired one up: depends on provider.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Project: Lokus plugin (`<plugin-id>`)

This project is a Lokus plugin. Behavior, conventions, and constraints are defined in `lokus-plugin.md` (the rulebook). Read it first.

## Quick commands

- Dev: `pnpm run dev` (hot reload into linked Lokus).
- Build: `pnpm run build`.
- Test: `pnpm test`.
- Typecheck: `pnpm tsc --noEmit`.
- Lint: `pnpm biome check src tests`.
- Link to Lokus: `lokus-plugin link`.
- Package: `lokus-plugin package`.
- Publish: `lokus-plugin publish`.

## Banned patterns (rejected in review)

- `console.log` — use `context.logger.info/warn/error`.
- `fetch(` — use `this.api.network.fetch`.
- `localStorage`, `IndexedDB`, `require('fs')`, `require('child_process')` — sandboxed, will throw.
- `eval`, `new Function(...)` — CSP blocks; worker dies.
- Bundling `@lokus/sdk` — must be `external` in esbuild.
- `permissions: ["*"]` — no wildcard exists.
- Plugin id starting with `lokus.` — reserved.

## Verification before declaring done

```
pnpm tsc --noEmit
pnpm biome check src tests
pnpm vitest run
pnpm build
lokus-plugin link
# manual smoke in Lokus
```

## Skills to invoke

- `/test-driven-development` — when adding any new command or feature.
- `/systematic-debugging` — when a plugin won't load or a permission denial appears.
- `/verification-before-completion` — before saying "done."
- `/ship` — for the release flow.
```

### `.claude/settings.json` (paste-ready)

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm install)",
      "Bash(pnpm run *)",
      "Bash(pnpm test*)",
      "Bash(pnpm tsc *)",
      "Bash(pnpm biome *)",
      "Bash(pnpm vitest *)",
      "Bash(pnpm build)",
      "Bash(pnpm version *)",
      "Bash(lokus-plugin *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push*)",
      "Bash(git tag*)",
      "Bash(node -p *)",
      "Bash(tail -f *.log)",
      "Bash(tail -n * *.log)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm biome check --apply $CLAUDE_FILE_PATHS 2>/dev/null || true" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash(git commit *)",
        "hooks": [
          { "type": "command", "command": "pnpm tsc --noEmit && pnpm biome check src tests && pnpm vitest run" }
        ]
      }
    ],
    "Stop": [
      { "type": "command", "command": "pnpm tsc --noEmit && pnpm biome check src tests" }
    ]
  }
}
```

### Slash command shortcuts

- `/ship` — runs full self-verification, bumps version, packages, publishes.
- `/test-driven-development` — write the failing test first.
- `/systematic-debugging` — for `PermissionDeniedError` and load failures, this skill walks you through manifest → permissions → activation events methodically.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# Agent rules — Lokus plugin

Read `lokus-plugin.md` (the rulebook) before starting any task. It contains the decisions table and ALWAYS/NEVER rules that override agent defaults.

## What this is

A TypeScript Lokus plugin running in a Web Worker sandbox. Entry point: `src/index.ts` exporting a default class with `activate(context)` and `deactivate()`. Manifest: `plugin.json`.

## Build & test

- Install: `pnpm install`
- Build: `pnpm build`
- Test: `pnpm vitest run`
- Typecheck: `pnpm tsc --noEmit`
- Lint: `pnpm biome check src tests`
- Link to local Lokus: `lokus-plugin link`

## Sandbox constraints (HARD)

- No Node built-ins (`fs`, `child_process`, `path`, etc.).
- No global `fetch`; use `context.api.network.fetch`.
- No `localStorage`/`IndexedDB`; use `context.api.storage`.
- No `eval`/`Function(...)`; CSP blocks them.
- Every API call requires a matching string in `permissions[]` of `plugin.json`.

## Definition of done

`pnpm tsc --noEmit && pnpm biome check src tests && pnpm vitest run && pnpm build && lokus-plugin link`, then manually trigger the affected command in linked Lokus and verify no errors in `~/.lokus/logs/plugin-<id>.log`.
```

### `.codex/config.toml`

```toml
[model]
name = "gpt-5"
context_window = 200000

[sandbox]
mode = "workspace-write"
network = "off"

[approval]
mode = "on-failure"

[project]
language = "typescript"
test_command = "pnpm vitest run"
typecheck_command = "pnpm tsc --noEmit"
lint_command = "pnpm biome check src tests"
build_command = "pnpm build"

[mcp_servers]
# Lokus exposes plugins via MCP if mcp_start has been called in dev.
# Most plugin work does not need this.
```

### Codex vs Claude Code workflow

- Codex tends to over-write `plugin.json` from scratch on edits. **Compensate:** after every Codex turn that touched manifest, diff against last committed version; reject regressions in `permissions` or `activationEvents`.
- Codex defaults to `console.log`. **Compensate:** add a Stop hook (in shell) that fails if `console.log` appears outside `tests/`.
- Codex sometimes inlines the SDK runtime. **Compensate:** check `dist/index.js` size after each build; fail if >300KB.

---

## 15. Cursor / Other Editors

### `.cursor/rules` (paste-ready)

```
You are working on a Lokus plugin. Read lokus-plugin.md first.

ALWAYS:
- Export default class with activate(context) and deactivate().
- Declare every API call in plugin.json permissions[].
- Use context.api.network.fetch, never global fetch.
- Use context.api.storage, never localStorage / IndexedDB.
- Use context.logger, never console.log.
- Run pnpm tsc --noEmit && pnpm biome check src tests && pnpm vitest run before declaring done.

NEVER:
- Import Node built-ins (fs, path, child_process, etc.).
- Use eval, new Function, or any string-based code execution.
- Bundle @lokus/sdk into dist/ — mark external in esbuild.
- Hardcode plugin id starting with "lokus." — reserved.
- Edit dist/ by hand — edit src/ and rebuild.
- Add a permission without an actual API call that needs it.
- Skip CHANGELOG.md updates on user-visible changes.

When the user adds a new API call, automatically:
1. Check plugin.json for the matching permission.
2. If missing, add it.
3. Re-run typecheck and tests.

When asked to ship: follow Section 12 of lokus-plugin.md.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "vitest.explorer",
    "ms-vscode.vscode-typescript-next",
    "lokus.lokus-plugin-tools"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Vitest: current file",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "pnpm",
      "runtimeArgs": ["vitest", "run", "${file}"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "Attach to Lokus plugin worker",
      "type": "chrome",
      "request": "attach",
      "port": 9229,
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true,
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files top to bottom. After the last one, `pnpm install && pnpm build && lokus-plugin link` produces a working `echo-note` plugin.

**1. `plugin.json`**

```json
{
  "manifest": "2.0",
  "id": "echo-note",
  "publisher": "your-handle",
  "displayName": "Echo Note",
  "name": "echo-note",
  "version": "0.1.0",
  "description": "Insert a timestamped note at the cursor.",
  "main": "./dist/index.js",
  "engines": { "lokus": "^1.0.0" },
  "author": { "name": "Your Name", "email": "you@example.com" },
  "license": "MIT",
  "homepage": "https://github.com/your-handle/echo-note",
  "repository": { "type": "git", "url": "https://github.com/your-handle/echo-note" },
  "icon": "./assets/icon.png",
  "categories": ["Editor"],
  "keywords": ["notes", "timestamp", "echo"],
  "permissions": [
    "editor:write",
    "commands:register",
    "ui:notifications"
  ],
  "activationEvents": ["onCommand:echoNote.create"],
  "contributes": {
    "commands": [
      {
        "command": "echoNote.create",
        "title": "Echo Note: Insert Timestamped Note",
        "category": "Notes"
      }
    ],
    "keybindings": [
      {
        "command": "echoNote.create",
        "key": "ctrl+shift+e",
        "mac": "cmd+shift+e",
        "when": "editorFocus"
      }
    ]
  }
}
```

**2. `package.json`**

```json
{
  "name": "echo-note",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "files": ["dist", "plugin.json", "assets", "style.css", "README.md", "CHANGELOG.md", "LICENSE"],
  "scripts": {
    "dev": "lokus-plugin dev",
    "build": "tsc --noEmit && esbuild src/index.ts --bundle --format=esm --external:@lokus/sdk --outfile=dist/index.js",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "lint": "biome check src tests",
    "format": "biome format --write src tests",
    "package": "lokus-plugin package",
    "link:lokus": "lokus-plugin link",
    "publish:lokus": "lokus-plugin publish"
  },
  "devDependencies": {
    "@biomejs/biome": "^1.9.4",
    "@lokus/plugin-cli": "^1.0.0",
    "@lokus/sdk": "^1.3.0",
    "@types/node": "^20.14.0",
    "esbuild": "^0.23.0",
    "typescript": "^5.5.0",
    "vitest": "^2.1.0"
  }
}
```

**3. `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "types": ["vitest/globals", "node"]
  },
  "include": ["src/**/*", "tests/**/*"]
}
```

**4. `biome.json`**

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "error", "noConsoleLog": "error" },
      "style": { "useImportType": "error" },
      "correctness": { "noUnusedVariables": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always" } }
}
```

**5. `vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      thresholds: { lines: 80, functions: 80, branches: 70 },
    },
    setupFiles: ['./tests/fixtures/setup.ts'],
  },
});
```

**6. `src/index.ts`**

```typescript
import type { LokusPluginContext, LokusApi, LokusLogger } from '@lokus/sdk';

export default class EchoNotePlugin {
  private api: LokusApi;
  private log: LokusLogger;

  constructor(context: LokusPluginContext) {
    this.api = context.api;
    this.log = context.logger;
  }

  async activate(): Promise<void> {
    this.api.commands.register({
      id: 'echoNote.create',
      title: 'Echo Note: Insert Timestamped Note',
      handler: () => this.insertNote(),
    });
    this.log.info('plugin activated', { event: 'plugin_activated' });
  }

  async deactivate(): Promise<void> {
    this.log.info('plugin deactivated', { event: 'plugin_deactivated' });
  }

  private async insertNote(): Promise<void> {
    const start = Date.now();
    try {
      const ts = new Date().toISOString();
      const text = `\n> [!note] ${ts}\n> \n`;
      if (!this.api.editor.isActive()) {
        this.api.ui.showInformationMessage('Open a note first.');
        return;
      }
      await this.api.editor.insertContent(text);
      this.log.info('note inserted', {
        event: 'note_inserted',
        duration_ms: Date.now() - start,
        length: text.length,
      });
    } catch (err) {
      this.log.error('insert failed', { event: 'insert_failed' }, err as Error);
      this.api.ui.showErrorMessage('Echo Note: failed to insert. See log for details.');
    }
  }
}
```

**7. `tests/fixtures/setup.ts`**

```typescript
import { vi } from 'vitest';

export function makeMockApi() {
  return {
    editor: {
      isActive: vi.fn().mockReturnValue(true),
      getContent: vi.fn().mockResolvedValue(''),
      insertContent: vi.fn().mockResolvedValue(undefined),
      replaceSelection: vi.fn().mockResolvedValue(undefined),
      setContent: vi.fn().mockResolvedValue(undefined),
    },
    commands: { register: vi.fn(), execute: vi.fn() },
    ui: {
      showInformationMessage: vi.fn(),
      showErrorMessage: vi.fn(),
      showInputBox: vi.fn(),
      showQuickPick: vi.fn(),
    },
    storage: { get: vi.fn().mockResolvedValue(null), set: vi.fn().mockResolvedValue(undefined) },
    network: { fetch: vi.fn() },
    workspace: { rootPath: '/tmp/workspace', readFile: vi.fn(), writeFile: vi.fn() },
    events: { on: vi.fn(), emit: vi.fn() },
    config: { get: vi.fn(), set: vi.fn() },
  };
}

export function makeContext() {
  return {
    api: makeMockApi(),
    logger: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
  };
}
```

**8. `tests/unit/index.test.ts`**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import EchoNotePlugin from '../../src/index';
import { makeContext } from '../fixtures/setup';

describe('EchoNotePlugin', () => {
  let ctx: ReturnType<typeof makeContext>;
  let plugin: EchoNotePlugin;

  beforeEach(async () => {
    ctx = makeContext();
    plugin = new EchoNotePlugin(ctx);
    await plugin.activate();
  });

  it('registers the create command on activate', () => {
    expect(ctx.api.commands.register).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'echoNote.create' })
    );
  });

  it('inserts a timestamped note when triggered', async () => {
    const handler = (ctx.api.commands.register as ReturnType<typeof vi.fn>).mock.calls[0][0].handler;
    await handler();
    expect(ctx.api.editor.insertContent).toHaveBeenCalledTimes(1);
    const text = (ctx.api.editor.insertContent as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(text).toMatch(/\[!note\]/);
    expect(text).toMatch(/\d{4}-\d{2}-\d{2}T/);
  });

  it('warns when no editor is active', async () => {
    (ctx.api.editor.isActive as ReturnType<typeof vi.fn>).mockReturnValue(false);
    const handler = (ctx.api.commands.register as ReturnType<typeof vi.fn>).mock.calls[0][0].handler;
    await handler();
    expect(ctx.api.editor.insertContent).not.toHaveBeenCalled();
    expect(ctx.api.ui.showInformationMessage).toHaveBeenCalled();
  });
});
```

**9. `style.css`**

```css
/* Plugin styles are auto-scoped under [data-plugin-id="echo-note"] */
.echo-note-banner {
  font-family: var(--lokus-font-mono);
  color: var(--lokus-color-text-secondary);
  background: var(--lokus-color-bg-elevated);
  padding: 4px 8px;
  border-radius: 4px;
}
```

**10. `assets/icon.png`** — 128×128 PNG. Create placeholder via:

```bash
# macOS/Linux:
curl -o assets/icon.png "https://placehold.co/128x128/png"
# Replace with real icon before publishing.
```

**11. `README.md`**

```markdown
# Echo Note

Insert a timestamped note at your cursor in [Lokus](https://lokusmd.com).

## Install

Search for "Echo Note" in Lokus → Settings → Plugins → Marketplace.

## Usage

Press `Cmd+Shift+E` (macOS) or `Ctrl+Shift+E` (Windows/Linux), or run "Echo Note: Insert Timestamped Note" from the command palette.

## Permissions

- `editor:write` — to insert the note.
- `commands:register` — to add the command.
- `ui:notifications` — to show "Open a note first" when no editor is active.

## License

MIT
```

**12. `CHANGELOG.md`**

```markdown
# Changelog

All notable changes documented here. Format: [Keep a Changelog](https://keepachangelog.com).

## [0.1.0] - 2026-04-27

### Added
- Initial release: `Echo Note: Insert Timestamped Note` command with default keybinding.
```

**13. `LICENSE`** — Standard MIT, with your name + year.

**14. `.gitignore`**

```
node_modules/
dist/
coverage/
*.log
.DS_Store
.vscode/*.local
*.tgz
```

**15. `.github/workflows/ci.yml`**

```yaml
name: CI

on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm tsc --noEmit
      - run: pnpm biome check src tests
      - run: pnpm vitest run --coverage
      - run: pnpm build
```

**16. `.github/workflows/release.yml`**

```yaml
name: Release

on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '20', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - run: pnpm test
      - run: npx @lokus/plugin-cli package
      - run: npx @lokus/plugin-cli publish
        env:
          LOKUS_PUBLISH_TOKEN: ${{ secrets.LOKUS_PUBLISH_TOKEN }}
      - uses: softprops/action-gh-release@v2
        with:
          files: '*.tgz'
          generate_release_notes: true
```

**17. `.env.example`**

```
# No env vars are needed for this plugin at runtime.
# For the release CI: set LOKUS_PUBLISH_TOKEN as a GitHub Actions secret.
# Generate at: https://plugins.lokus.app/settings/tokens
```

After all 17 files exist:

```bash
pnpm install
pnpm build
lokus-plugin link
# Restart Lokus, enable plugin, press Cmd+Shift+E.
```

---

## 17. Idea → MVP Path

If `PROJECT_IDEA` is blank, default project is **Echo Note** (above). Below is the generic 5-phase plan; substitute your idea throughout.

### Phase 1 — Schema (1 AI session)

Define the data your plugin persists. For Echo Note: nothing (stateless). For typical plugins:

- `storage` keys: list every key, its type (use TypeScript types in `src/lib/types.ts`).
- `config` keys: list every user-facing setting; declare in `plugin.json` `contributes.configuration`.
- Migration map: `version → migration function`.

Files touched: `src/lib/types.ts`, `plugin.json` (`contributes.configuration`).
Exit: `pnpm tsc --noEmit` clean; types document the contract.

### Phase 2 — Backbone (1 session)

Scaffold the lifecycle.

- `src/index.ts` with empty `activate`/`deactivate`.
- `plugin.json` with manifest, permissions placeholder.
- One stub command in `contributes.commands` with a no-op handler.

Files: `src/index.ts`, `src/commands/<name>.ts`, `plugin.json`.
Exit: `lokus-plugin link`, restart, plugin appears in Settings → Plugins, command shows in palette and runs without error.

### Phase 3 — Vertical slice (1–2 sessions)

End-to-end one user-visible feature.

- One real command implementing the core value prop.
- Unit tests covering its happy path + 1 failure path.
- Manual smoke checklist in `README.md`.

Files: `src/commands/<name>.ts`, `tests/unit/commands/<name>.test.ts`, `README.md` (Usage section).
Exit: feature works in linked Lokus; tests green; integration test exercising it.

### Phase 4 — Settings + persistence (1 session)

If feature needs config or state.

- Declare settings in `contributes.configuration`.
- Implement migration in `src/lib/migrate.ts` if shape evolves.
- Wire `api.config.get/set` and `api.storage.get/set` calls.

Files: `plugin.json`, `src/lib/migrate.ts`, `src/index.ts` (read settings on activate).
Exit: change setting in Lokus UI, reload plugin, behavior reflects new value; storage data survives a restart.

### Phase 5 — Ship + monitor (1 session)

- README polish (screenshots in `assets/screenshots/`).
- CHANGELOG entry.
- Bump to `1.0.0`.
- `lokus-plugin publish --dry-run` then real `publish`.
- Open marketplace listing; install on a clean Lokus profile to verify.

Files: `README.md`, `CHANGELOG.md`, `plugin.json` (version), `package.json` (version).
Exit: marketplace listing live; clean install works; first user feedback channel set up (GitHub issues link in `homepage`).

---

## 18. Feature Recipes

### 18.1 Persistent setting

`plugin.json`:

```json
"contributes": {
  "configuration": {
    "title": "Echo Note",
    "properties": {
      "echoNote.timestampFormat": {
        "type": "string",
        "default": "iso",
        "enum": ["iso", "locale", "unix"],
        "description": "Format for the inserted timestamp."
      }
    }
  }
}
```

`src/index.ts`:

```typescript
const fmt = await this.api.config.get<string>('echoNote.timestampFormat');
const ts =
  fmt === 'unix' ? String(Date.now())
  : fmt === 'locale' ? new Date().toLocaleString()
  : new Date().toISOString();
```

Permission needed: `config:read`.

### 18.2 OAuth login (Notion / Google / etc.)

```typescript
const url = `https://api.notion.com/v1/oauth/authorize?client_id=${CLIENT_ID}&redirect_uri=lokus://plugin/echo-note/callback&response_type=code`;
await this.api.network.openExternal(url);

// Handle callback (registered in plugin.json contributes.uriHandlers)
this.api.uri.onUri(async (uri) => {
  const code = new URL(uri).searchParams.get('code');
  if (!code) return;
  const res = await this.api.network.fetch('https://api.notion.com/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ grant_type: 'authorization_code', code, redirect_uri: 'lokus://plugin/echo-note/callback' }),
  });
  const { access_token } = await res.json();
  await this.api.storage.set('token:notion', access_token);
});
```

Permissions: `network:http`, `storage:write`. Manifest: `contributes.uriHandlers: [{"scheme": "lokus", "path": "/plugin/echo-note/callback"}]`.

### 18.3 File upload to a note

```typescript
const file = await this.api.ui.showOpenDialog({ canSelectFiles: true });
if (!file) return;
const data = await this.api.workspace.readFile(file.path); // returns Uint8Array
const targetPath = `${this.api.workspace.rootPath}/attachments/${file.name}`;
await this.api.workspace.writeFile(targetPath, data);
await this.api.editor.insertContent(`![${file.name}](attachments/${file.name})\n`);
```

Permissions: `workspace:read`, `workspace:write`, `editor:write`, `ui:dialogs`.

### 18.4 Background timer (daily rollup)

```typescript
private intervalId?: number;

async activate() {
  this.intervalId = setInterval(() => this.runRollup(), 60 * 60 * 1000) as unknown as number;
  // Run once on startup if it's a new day
  void this.runRollup();
}

async deactivate() {
  if (this.intervalId) clearInterval(this.intervalId);
}
```

No permission for timers themselves. The rollup logic itself may need `workspace:read/write` and `editor:read`.

### 18.5 Realtime updates (events between plugins)

```typescript
// Plugin A: emit
this.api.events.emit('echoNote.inserted', { length: text.length, ts });

// Plugin B (separate plugin): subscribe
this.api.events.on('echoNote.inserted', (payload: { length: number; ts: string }) => {
  this.log.info('saw echo note insert', payload);
});
```

Permissions: `events:emit` (sender), `events:subscribe` (receiver).

### 18.6 Search across notes

```typescript
const results = await this.api.workspace.search({
  query: 'TODO',
  caseSensitive: false,
  isRegex: false,
  includeFiles: ['**/*.md'],
});
// results: { path, line, column, match, contextBefore, contextAfter }[]
```

Permission: `workspace:read`.

### 18.7 Internationalization

Manifest:

```json
"localization": {
  "defaultLocale": "en",
  "files": ["./locales/en.json", "./locales/es.json"]
}
```

`locales/en.json`: `{ "echoNote.create.title": "Insert Timestamped Note" }`.

In code:

```typescript
const title = this.api.l10n.t('echoNote.create.title');
```

No special permission.

### 18.8 Dark / light mode aware UI

```typescript
const theme = this.api.theme.current(); // "dark" | "light" | "system"
this.api.events.on('theme:changed', (next: 'dark' | 'light') => this.applyTheme(next));
```

Permission: `events:subscribe`.

In `style.css`, prefer `var(--lokus-color-bg)` etc. — auto-switches. Hardcoded colors break dark mode.

### 18.9 Status bar item

```typescript
const item = this.api.ui.statusBar.addItem({
  id: 'echoNote.indicator',
  text: '$(pencil) Echo Note',
  tooltip: 'Click to insert',
  command: 'echoNote.create',
  alignment: 'right',
  priority: 100,
});
// item.dispose() on deactivate (host auto-disposes registered items)
```

Permission: `ui:statusBar`.

### 18.10 Slash command (`/`)

`plugin.json`:

```json
"contributes": {
  "slashCommands": [
    {
      "trigger": "/echo",
      "title": "Echo Note",
      "command": "echoNote.create",
      "description": "Insert a timestamped note"
    }
  ]
}
```

When the user types `/echo` in the editor, Lokus pops a suggestion that runs the command.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Error: Plugin manifest validation failed: missing field "main"` | Add `"main": "./dist/index.js"` to `plugin.json`. |
| `Error: PermissionDeniedError: editor:write not in permissions[]` | Add `"editor:write"` to `permissions` in `plugin.json`. Restart Lokus. |
| `ReferenceError: fetch is not defined` | Replace `fetch(...)` with `await this.api.network.fetch(...)`. Add `network:http` permission. |
| `ReferenceError: localStorage is not defined` | Use `await this.api.storage.set(key, value)`. Add `storage:write` permission. |
| `TypeError: Cannot read properties of null (reading 'getContent')` | Editor not active. Wrap in `if (this.api.editor.isActive())`. |
| `Error: Plugin id "lokus.foo" is reserved` | Rename to anything not starting with `lokus.`. |
| `Error: command 'foo' already registered` | Another plugin uses this id. Prefix with your plugin id (`yourplugin.foo`). |
| `Error: Activation budget exceeded (>2000ms)` | Move heavy work out of `activate`; lazy-init in first command call. |
| `Error: Memory quota exceeded (50MB)` | Stop holding full notes in memory; use streaming or storage. |
| `Error: API rate limit exceeded` | Debounce calls; batch via events. Default cap 1000/min. |
| `Error: lokus-plugin: command not found` | Reinstall: `pnpm add -g @lokus/plugin-cli` and ensure pnpm global bin is in `$PATH`. |
| `Error: Failed to publish: invalid auth token` | `lokus-plugin login` again. Tokens expire after 90 days. |
| `Error: pnpm-lock.yaml mismatch` | Delete `node_modules` and `pnpm-lock.yaml`, run `pnpm install` fresh. |
| `Error: tsc not found` | Add to devDependencies or run via `pnpm tsc`. |
| `Error: vitest cannot find @lokus/sdk` | Add `@lokus/sdk` to `devDependencies`; re-run `pnpm install`. |
| `Error: ESM cannot import CommonJS` | Set `"type": "module"` in `package.json`; use `import` syntax everywhere. |
| `Error: Hot reload failed: connection refused` | Quit Lokus fully and run `lokus-plugin dev` again; only one dev server can attach. |
| `Error: Plugin disabled: incompatible Lokus version` | Update `lokusVersion` / `engines.lokus` in `plugin.json` to match installed Lokus version. |
| `Error: Cannot install plugin: unsigned manifest` | Marketplace requires signed publishes. Run `lokus-plugin login` and `publish` (which signs server-side). |
| `Build error: "external" not found` | esbuild flag must be `--external:@lokus/sdk` (with colon). |
| `Test fails: vi is not defined` | Add `"globals": true` to `vitest.config.ts`. |
| `Plugin loads but does nothing` | Check `activationEvents`. `onCommand:foo` only fires when command runs. Use `onStartup` if you need eager activation. |
| `Slash command works first time then breaks` | You're mutating the editor inside `onUpdate`. Refactor to dispatch outside the read callback. |
| `App freezes after enabling plugin` | Infinite loop in `activate` or in a `setInterval` with delay 0. Force-quit Lokus, edit plugin, re-link. |
| `Error: cannot find module './dist/index.js'` | Run `pnpm build` before `lokus-plugin link`. |
| `Marketplace publish: "icon dimensions wrong"` | Resize `assets/icon.png` to exactly 128×128. |
| `pnpm: ELIFECYCLE Command failed with exit code 1` (during build) | Read the line above; usually a TS error. Run `pnpm tsc --noEmit` to see the full message. |
| `Error: setting 'echoNote.foo' is undefined` | Setting not declared in `contributes.configuration` or default not provided. |
| `Plugin shows in palette but command does nothing` | Handler is throwing silently. Wrap in try/catch and log; check `~/.lokus/logs/plugin-<id>.log`. |
| `git push: refusing to push tags that already exist` | Bump version (`pnpm version patch`); create a new tag. |

---

## 20. Glossary

- **Activation event** — A condition that tells Lokus when to load your plugin. `onStartup` = always. `onCommand:foo` = only when command `foo` is invoked.
- **Activation function** — `activate(context)`, the first method called on your plugin class. Where you register commands.
- **API permission** — A string in `permissions[]` of `plugin.json` that grants access to a specific API. Required at runtime; missing throws.
- **Biome** — Linter and formatter for JavaScript / TypeScript. Replaces ESLint + Prettier with a single tool.
- **Bundle** — Your built `dist/index.js`, with all your code combined. Loaded by Lokus at runtime.
- **Capability-based security** — A model where you must explicitly request each permission, and the runtime enforces it. No ambient authority.
- **Command** — A user-runnable action exposed via the command palette (Cmd/Ctrl+Shift+P).
- **Context (plugin context)** — Object passed to your constructor / `activate`. Contains `api` (callable surface) and `logger`.
- **CSP (Content Security Policy)** — Browser security mechanism that blocks `eval` and inline scripts. Lokus enforces a strict CSP in plugin workers.
- **esbuild** — Fast JS/TS bundler. Used by `lokus-plugin build` to produce `dist/index.js`.
- **Hot reload** — Reloading just the plugin code without restarting the whole app.
- **Lokus** — The host app. A local-first, markdown-based PKM (personal knowledge management) tool built on Tauri.
- **Manifest** — The `plugin.json` file. Declares identity, permissions, activation, contributions.
- **Marketplace** — Central directory at `https://plugins.lokus.app` where plugins are listed and auto-updated.
- **MCP (Model Context Protocol)** — A protocol for exposing data and tools to AI assistants. Lokus auto-exposes plugin commands via MCP if enabled.
- **PKM** — Personal Knowledge Management. The category Lokus is in (alongside Obsidian, Notion).
- **pnpm** — Package manager, like npm but faster and uses a content-addressable store.
- **Sandbox** — The Web Worker your plugin code runs in. No DOM access, no Node, no file system.
- **SDK** — `@lokus/sdk`, the TypeScript types and helper classes. Provided by the host at runtime; you mark it `external` when bundling.
- **SemVer** — Versioning scheme `MAJOR.MINOR.PATCH`. Required by marketplace.
- **Slash command** — A trigger users type in the editor (e.g. `/echo`) that pops up plugin actions.
- **Status bar** — The strip at the bottom of Lokus where plugins can add indicators.
- **Tauri** — The Rust+WebView desktop framework Lokus is built on. You don't interact with it directly from a plugin.
- **TipTap** — The rich-text editor library Lokus uses. You can extend it via `editor:extension` permission, but most plugins don't need to.
- **Topological sort** — Algorithm Lokus uses to load plugins in dependency order. Detects circular deps.
- **TypeScript strict mode** — `strict: true` in `tsconfig.json`. Catches the most common AI-coder bugs at compile time.
- **Vitest** — The test runner. Vite-native, fast, Jest-compatible API.
- **Web Worker** — A browser API for running JS in a separate thread. Lokus uses one per plugin for isolation.

---

## 21. Update Cadence

- This rulebook is valid for **Lokus app versions 1.0 through 1.x** (current latest: 1.1.0, 2026-03-03) and **plugin SDK 1.3 ("Quantum Leap") line**.
- Re-run the generator when:
  - Lokus bumps to v2.0 (manifest format may evolve).
  - The marketplace API changes (publish/login flow).
  - SDK adds or removes APIs (new permission strings).
  - A security advisory affects the sandbox model.
- **Last updated:** 2026-04-27.
- **Sources:**
  - [docs.lokusmd.com/plugins/creating-plugins/](https://docs.lokusmd.com/plugins/creating-plugins/)
  - [docs.lokusmd.com/developers/architecture/](https://docs.lokusmd.com/developers/architecture/)
  - [docs.lokusmd.com/developers/api-reference/](https://docs.lokusmd.com/developers/api-reference/)
  - [github.com/lokus-ai/lokus](https://github.com/lokus-ai/lokus)
  - [github.com/lokus-ai/docs](https://github.com/lokus-ai/docs)
  - [meetpratham.me/blog/lokus-plugin-system](https://www.meetpratham.me/blog/lokus-plugin-system)

## Known Gaps

- **Exact SDK package name.** Docs and blog posts reference `@lokus/sdk` and `@lokus/plugin-cli`; CLI commands like `lokus-plugin init` are documented but the npm registry was not directly reachable from this research session to confirm the published name. **Action on first run:** check `npm view @lokus/sdk` and `npm view @lokus/plugin-cli`; if names differ, search `https://github.com/lokus-ai/` for the canonical packages and update `package.json`.
- **Status of SDK helpers (`BasePlugin` / `EnhancedBasePlugin`).** Documented but exact import paths may vary. Verify from `node_modules/@lokus/sdk/dist/*.d.ts` after install.
- **OAuth URI handler contract.** The `lokus://plugin/<id>/callback` scheme is described in plugin examples but is not in the official API reference page surfaced. Verify by registering a handler and inspecting `~/.lokus/logs/main.log` on activation.
- **Marketplace publish token format & expiry.** "90 days" is a reasonable default but not confirmed in docs visible in this research. Check `https://plugins.lokus.app/settings/tokens` after `lokus-plugin login`.
- **Granular permission strings.** Section 11 lists the categories; some specific strings (e.g. exact spelling of `network:websocket`) should be double-checked against `@lokus/sdk` types on first install.
- **Plugin tests inside Lokus.** Lokus uses Vitest + Playwright internally, but no documented test harness for plugins-in-host integration exists yet. The `lokus-plugin --test` flag in Section 6 is inferred from the CLI surface and may be missing or differently named.
- **Recommendation:** when any gap above blocks your work, open an issue at [github.com/cleanmcp/pandect](https://github.com/cleanmcp/pandect) so this rulebook can be tightened, and at [github.com/lokus-ai/lokus](https://github.com/lokus-ai/lokus) if the SDK itself needs clarification.
