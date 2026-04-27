# Electron + React + TypeScript + SQLite — Rulebook

Cross-platform desktop apps (macOS, Windows, Linux) built with Electron 40, electron-vite, React 19, TypeScript, better-sqlite3, Drizzle ORM, packaged with electron-builder, auto-updated with electron-updater.

Audience: a non-coder + their AI coding agent. This file is the only documentation. If a rule is not here, the agent must not invent one.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.9 | Type safety across main + renderer; stable, not 7.0 beta |
| Runtime + version | Node 24.15 LTS (host); Electron 40 ships its own Node | Current LTS; matches Electron 40 toolchain |
| Package manager | pnpm 10.33 | Fastest, strictest, deduped store, built-in workspace |
| Build tool | electron-vite 5.0 | Official Vite-for-Electron; fast HMR for main+preload+renderer |
| State mgmt | Zustand 5 + React Context for tree-scoped state | Tiny, no boilerplate, async-friendly |
| Routing/Nav | React Router 7 (data router, memory history) | No URL bar in Electron; memory history is correct |
| Data layer (db + orm) | better-sqlite3 12.9 + Drizzle 0.45 (NOT v1 beta) | Synchronous SQLite, type-safe SQL, zero-config migrations |
| Auth | None local; OAuth via system browser when needed | Desktop apps own data locally; cloud sync is opt-in |
| Styling | Tailwind CSS 4 | JIT, native CSS, no runtime |
| Forms + validation | React Hook Form 7 + Zod 3 | Uncontrolled, fast, schema-driven |
| Unit test runner | Vitest 4.1 | Vite-native, watch mode, ESM first |
| E2E framework | Playwright 1.55 (`_electron`) | Official Electron support, parallel by default |
| Mocking strategy | Mock IPC at preload boundary; never mock SQLite | Database divergence kills migrations |
| Logger | electron-log 5.4 (main + renderer) | Auto file rotation, console + file transport |
| Error tracking | Sentry electron 7.11 | Captures main + renderer + native crashes |
| Lint + format | Biome 2.4 | One tool, 10–20× faster than ESLint+Prettier |
| Type checking | tsc --noEmit (per project: main, preload, renderer) | Three tsconfigs; renderer is DOM, main is Node |
| Env vars + secrets | `.env` (dev only) + OS keychain via `keytar` | Never ship secrets in the asar |
| CI provider | GitHub Actions (matrix mac/win/linux) | Free for OSS, hosted runners for all 3 OS |
| Deploy target | GitHub Releases | Free, signed artifacts, electron-updater native support |
| Release flow | Tag `v*.*.*` → CI builds matrix → publishes draft release | One push, three signed installers |
| Auto-update | electron-updater 6.8 (squirrel + nsis + appimage) | Built-in delta updates, channel-aware |
| IPC pattern | Typed `contextBridge` + `ipcRenderer.invoke` (request/response) | One channel per domain, Zod-validated |
| Window strategy | Single `BrowserWindow` + React Router for navigation | Multi-window only when OS UX demands it |
| Sandbox | `sandbox: true`, `contextIsolation: true`, `nodeIntegration: false` | Mandatory; non-negotiable security baseline |
| SQLite location | `app.getPath('userData')/app.db` | Per-user, survives uninstall on macOS, respected by backups |
| Update channel | `latest` (stable) + `beta` (opt-in) | Two channels covers 99% of desktop apps |
| Native modules | `electron-builder install-app-deps` (NOT electron-rebuild) | Single command, runs on postinstall |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Electron | 40.0.0 | 2026-01-13 | https://releases.electronjs.org/ |
| electron-vite | 5.0.0 | 2025-12 | https://electron-vite.org/ |
| electron-builder | 26.8.2 | 2026-03-04 | https://www.electron.build/ |
| electron-updater | 6.8.3 | 2026-02 | https://www.npmjs.com/package/electron-updater |
| @electron/notarize | 3.0.x | 2026 | https://github.com/electron/notarize |
| better-sqlite3 | 12.9.0 | 2026-04 | https://www.npmjs.com/package/better-sqlite3 |
| drizzle-orm | 0.45.2 | 2026-04 | https://orm.drizzle.team/ |
| drizzle-kit | 0.31.x | 2026-04 | https://www.npmjs.com/package/drizzle-kit |
| React | 19.2.5 | 2026-04-08 | https://react.dev/ |
| react-dom | 19.2.5 | 2026-04-08 | https://react.dev/ |
| react-router | 7.x | 2026 | https://reactrouter.com/ |
| TypeScript | 5.9.x | 2026 | https://www.typescriptlang.org/ |
| Node.js (host) | 24.15.0 LTS | 2026-04 | https://nodejs.org/ |
| pnpm | 10.33.x | 2026-04 | https://pnpm.io/ |
| Vitest | 4.1.5 | 2026-04-21 | https://vitest.dev/ |
| Playwright | 1.55.x | 2026 | https://playwright.dev/ |
| Biome | 2.4.13 | 2026-04 | https://biomejs.dev/ |
| Tailwind CSS | 4.x | 2026 | https://tailwindcss.com/ |
| Zustand | 5.x | 2026 | https://github.com/pmndrs/zustand |
| Zod | 3.x | 2026 | https://zod.dev/ |
| React Hook Form | 7.x | 2026 | https://react-hook-form.com/ |
| electron-log | 5.4.3 | 2025-08 | https://www.npmjs.com/package/electron-log |
| @sentry/electron | 7.11.0 | 2026-04 | https://www.npmjs.com/package/@sentry/electron |
| keytar | 7.9.x | 2025 | https://www.npmjs.com/package/keytar |

### Minimum Host Requirements

| OS | Min version | RAM | Disk |
|---|---|---|---|
| macOS | 11 (Big Sur) on dev, 10.15 on user | 8 GB | 5 GB free |
| Windows | 10 1809+ on dev, Win 10/11 on user | 8 GB | 5 GB free |
| Linux | Ubuntu 22.04+ / glibc 2.31+ | 8 GB | 5 GB free |

Cold start `git clone` → running app on a fresh machine: **~12 minutes** (3 min installs + 6 min first native rebuild + 3 min first build).

---

## 2. Zero-to-running

### macOS

```bash
# Xcode CLT (required for native builds)
xcode-select --install

# Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Node 24 + pnpm
brew install node@24
brew link --force --overwrite node@24
corepack enable
corepack prepare pnpm@10.33.0 --activate

# Git + GitHub CLI
brew install git gh
gh auth login   # follow prompts; choose SSH

# Verify
node --version  # v24.15.x
pnpm --version  # 10.33.x
```

Apple Developer account: https://developer.apple.com/programs/ (USD $99/year). Generate a Developer ID Application certificate in Xcode > Settings > Accounts > Manage Certificates. Generate an app-specific password at https://appleid.apple.com/ (Security > App-Specific Passwords) for `notarytool`.

### Windows

```powershell
# winget ships on Win 10 1809+
winget install OpenJS.NodeJS.LTS --version 24.15.0
winget install Git.Git
winget install GitHub.cli
corepack enable
corepack prepare pnpm@10.33.0 --activate

# Visual Studio Build Tools (for native module compile)
winget install Microsoft.VisualStudio.2022.BuildTools --override "--quiet --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"

gh auth login   # follow prompts
```

Code signing: register for Azure Trusted Signing at https://portal.azure.com/ (search "Trusted Signing Accounts"; ~USD $10/month). Old EV cert + USB dongle is also valid but slower; prefer Trusted Signing for CI.

### Linux (Ubuntu / Debian)

```bash
sudo apt update && sudo apt install -y \
  build-essential git curl libnss3 libatk1.0-0 libatk-bridge2.0-0 \
  libxss1 libgtk-3-0 libxshmfence1 libasound2 libgbm1

# Node 24 via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
. "$HOME/.nvm/nvm.sh"
nvm install 24
nvm alias default 24
corepack enable
corepack prepare pnpm@10.33.0 --activate

# GitHub CLI
type -p curl >/dev/null || sudo apt install -y curl
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
sudo chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null
sudo apt update && sudo apt install gh -y
gh auth login
```

Linux apps do not require code signing for AppImage but will trigger a "this app is from the internet" prompt on Snap. AppImage is the default below.

### Bootstrap a new project

```bash
# 1. Scaffold
pnpm create electron-vite my-app --template react-ts
cd my-app

# 2. Install + apply rulebook configs (write the configs from §16 below)
pnpm install

# 3. Add the rulebook stack
pnpm add better-sqlite3 drizzle-orm zustand react-router zod react-hook-form \
  electron-log @sentry/electron keytar
pnpm add -D drizzle-kit electron-builder electron-updater @electron/notarize \
  @biomejs/biome vitest @playwright/test typescript@5.9 \
  @types/better-sqlite3 @types/node tailwindcss @tailwindcss/postcss

# 4. Rebuild native modules for Electron
pnpm exec electron-builder install-app-deps

# 5. Run
pnpm dev
```

Expected first-run terminal output (literal):

```
> my-app@0.0.1 dev
> electron-vite dev

vite v6.x.x  ready in 412 ms
  ➜  Local:   http://localhost:5173/
electron-vite [main] build started...
electron-vite [main] build completed
electron-vite [preload] build completed
[main] App ready, opening window
```

A native window opens showing the React boilerplate. If the window is white for >10 seconds, the renderer crashed — open DevTools (`Cmd/Ctrl+Shift+I`) and check console.

### Common first-run errors

| Error | Fix |
|---|---|
| `Error: Module did not self-register` (better-sqlite3) | `pnpm exec electron-builder install-app-deps` |
| `Cannot find module 'electron'` in renderer | You wrote `import { ipcRenderer } from 'electron'` in `src/renderer`. Move to preload and expose via contextBridge. |
| `gyp ERR! find Python` (Windows) | `winget install Python.Python.3.12` then re-run install |
| White window, console says `require is not defined` | `nodeIntegration: false` is correct; use the preload bridge instead of `require` |
| `electron-builder ENOENT spawn lzma` (Linux) | `sudo apt install -y libxz-utils` |
| Notarization hangs >30 min | Apple service is occasionally slow; check https://developer.apple.com/system-status/ before retrying |

---

## 3. Project Layout

```
my-app/
├── electron.vite.config.ts          # build config for all 3 contexts
├── electron-builder.yml             # packaging config
├── package.json                     # scripts + deps
├── biome.json                       # lint + format
├── vitest.config.ts                 # unit test config
├── playwright.config.ts             # E2E config
├── drizzle.config.ts                # migration generator
├── tsconfig.json                    # root references file
├── tsconfig.node.json               # main + preload (Node target)
├── tsconfig.web.json                # renderer (DOM target)
├── tsconfig.test.json               # vitest
├── CLAUDE.md                        # Claude Code rules
├── AGENTS.md                        # Codex rules
├── .cursor/rules/                   # Cursor rules
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── .github/workflows/
│   ├── ci.yml                       # on every PR
│   └── release.yml                  # on tag v*.*.*
├── .claude/settings.json            # Claude hooks + allowlist
├── build/                           # icons, entitlements, installer assets
│   ├── icon.icns
│   ├── icon.ico
│   ├── icon.png
│   └── entitlements.mac.plist
├── drizzle/                         # generated migration SQL
│   └── 0000_init.sql
├── resources/                       # static assets shipped with app
├── src/
│   ├── main/                        # Electron main process (Node)
│   │   ├── index.ts                 # entry; createWindow, app lifecycle
│   │   ├── ipc/                     # one file per domain
│   │   │   ├── notes.ts
│   │   │   └── settings.ts
│   │   ├── db/
│   │   │   ├── client.ts            # better-sqlite3 + drizzle init
│   │   │   ├── schema.ts            # drizzle schema
│   │   │   └── migrate.ts           # runs on app boot
│   │   ├── windows/
│   │   │   └── main-window.ts
│   │   ├── updater.ts               # electron-updater wiring
│   │   ├── logger.ts                # electron-log init for main
│   │   └── menu.ts
│   ├── preload/                     # bridge between main and renderer
│   │   ├── index.ts                 # contextBridge.exposeInMainWorld
│   │   └── api.ts                   # typed API surface
│   ├── renderer/                    # React app
│   │   ├── index.html
│   │   ├── main.tsx                 # React root
│   │   ├── App.tsx
│   │   ├── routes/                  # React Router data routes
│   │   ├── components/              # presentational React components
│   │   ├── features/                # feature-scoped (notes/, settings/)
│   │   ├── store/                   # zustand stores
│   │   ├── hooks/
│   │   ├── lib/                     # client-only utilities
│   │   ├── styles/
│   │   │   └── globals.css
│   │   └── env.d.ts                 # vite env types
│   └── shared/                      # types + constants used by main AND renderer
│       ├── ipc-channels.ts
│       └── types.ts
└── tests/
    ├── unit/                        # *.test.ts colocated OR here
    └── e2e/                         # *.spec.ts (Playwright)
```

### Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| Component file | `PascalCase.tsx` | `NoteEditor.tsx` |
| Hook | `useCamelCase.ts` | `useNotes.ts` |
| Store | `useCamelCaseStore.ts` | `useSettingsStore.ts` |
| IPC channel const | `SCREAMING_SNAKE` in `shared/ipc-channels.ts` | `NOTES_LIST` |
| IPC handler | `src/main/ipc/<domain>.ts` | `notes.ts` |
| Drizzle table | `camelCase` export, plural | `notes`, `users` |
| Migration | `drizzle/NNNN_description.sql` (auto-generated) | `0001_add_pinned.sql` |
| Test file | `*.test.ts` (unit), `*.spec.ts` (E2E) | `notes.test.ts` |
| Type module | `kebab-case.ts` | `note-types.ts` |
| Constant module | `kebab-case.ts` | `app-paths.ts` |

### "If you're adding X, it goes in Y"

| Adding | Lives in |
|---|---|
| New React page | `src/renderer/routes/<name>.tsx` + add to router |
| New presentational UI component | `src/renderer/components/` |
| Feature with its own state + UI | `src/renderer/features/<feature>/` |
| New IPC call | Channel const → `shared/ipc-channels.ts`; handler → `src/main/ipc/<domain>.ts`; expose in `preload/api.ts` |
| New database table | `src/main/db/schema.ts`; then `pnpm db:generate` |
| Cross-process type | `src/shared/types.ts` |
| Renderer-only utility | `src/renderer/lib/` |
| Main-only utility | `src/main/` (next to caller) |
| New zustand store | `src/renderer/store/use<Name>Store.ts` |
| OS-specific code | Branch on `process.platform` inside `src/main/` |
| Native module wrapper | `src/main/native/<name>.ts` |
| Static image / font | `resources/` (use `?asset` import) |
| Auto-update logic | `src/main/updater.ts` (one file, do not split) |
| Secret read/write | `src/main/keychain.ts` using `keytar` |
| New menu item | `src/main/menu.ts` |
| New window type | `src/main/windows/<name>-window.ts` |

---

## 4. Architecture

### Process boundaries

```
+--------------------------------------------------------------+
| OS Process Tree                                              |
|                                                              |
|  [Main Process]  Node + Electron core                        |
|     - app lifecycle (ready, before-quit, will-quit)          |
|     - BrowserWindow creation                                 |
|     - SQLite (better-sqlite3) — synchronous                  |
|     - File system, OS dialogs, Menu, Tray                    |
|     - electron-updater                                       |
|     - keytar (OS keychain)                                   |
|       |                                                      |
|       | ipcMain.handle(channel, ...)                         |
|       v                                                      |
|  [Preload Script]  Node-restricted, isolated context         |
|     - contextBridge.exposeInMainWorld('api', { ... })        |
|     - ONLY exposes typed, validated functions                |
|       |                                                      |
|       | window.api.* (proxied)                               |
|       v                                                      |
|  [Renderer Process]  Chromium, sandboxed, NO Node            |
|     - React 19 + React Router 7                              |
|     - Zustand stores                                         |
|     - Talks to main only via window.api                      |
+--------------------------------------------------------------+
```

### Data flow for a typical action (user clicks "Save Note")

```
User click in <NoteEditor>
   |
   v
Form (RHF + Zod validation)  --invalid--> show error, stop
   |valid
   v
useNotesStore.save(note)
   |
   v
window.api.notes.upsert(note)             [renderer]
   |
   | (proxied through contextBridge → ipcRenderer.invoke)
   v
ipcMain.handle('notes:upsert', ...)       [main]
   |
   v
Zod parse incoming payload (defense in depth)
   |
   v
drizzle.insert(notes).values(...).onConflictDoUpdate(...)
   |
   v
better-sqlite3 (synchronous write to userData/app.db)
   |
   v
return { id, updatedAt } to renderer
   |
   v
zustand setState → React re-renders list
```

### Auth flow (when needed)

Local-first apps default to no auth. When syncing with a remote service:

```
User clicks "Connect Acme"
   |
   v
main: shell.openExternal('https://acme.com/oauth?redirect_uri=myapp://oauth-callback')
   |
   v
User authorizes in default browser
   |
   v
OS opens myapp://oauth-callback?code=...
   |
   v
main: app.on('open-url' | second-instance) → parse code
   |
   v
main: POST to acme.com/token, get refresh token
   |
   v
keytar.setPassword('myapp', 'acme:refresh', token)
   |
   v
notify renderer via window.api.events.emit('auth:connected')
```

Never run an OAuth flow inside a `BrowserWindow` you control — that's a phishing pattern and breaks 2FA. Always use the system browser via `shell.openExternal`.

### State management flow

```
+-----------------+       +-----------------+
| Server-of-truth | <---> | better-sqlite3  |
| (main, db)      |       |   (userData)    |
+-----------------+       +-----------------+
        ^
        | IPC (window.api)
        v
+-----------------+
| Renderer cache  |  zustand stores; treat as cache, not source-of-truth
| (zustand store) |  Hydrate on mount: fetch via IPC, then subscribe to events
+-----------------+
        ^
        | useStore selectors
        v
+-----------------+
| React tree      |
+-----------------+
```

### Entry-point files

| File | Responsibility |
|---|---|
| `src/main/index.ts` | App lifecycle, window creation, register IPC, init logger + Sentry + updater |
| `src/preload/index.ts` | Expose typed API surface via `contextBridge`. NO business logic. |
| `src/renderer/main.tsx` | React root, router, error boundary, theme provider |

### Where business logic lives

- **Lives in:** `src/main/` (anything touching disk/OS) and `src/renderer/features/<feature>/` (UI behavior + state composition).
- **Does NOT live in:** preload (translation only), `src/shared/` (types + constants only), components (`src/renderer/components/` is presentational only).

---

## 5. Dev Workflow

### Start dev server

```bash
pnpm dev
```

Internally: `electron-vite dev` runs three watchers concurrently — main (esbuild), preload (esbuild), renderer (Vite). Vite serves the renderer at `http://localhost:5173` and Electron loads it via `mainWindow.loadURL`. Hot reload works for renderer (instant) and reloads the whole app for main/preload changes (~1s).

### Hot reload behavior

| What changed | Behavior |
|---|---|
| Renderer `.tsx` / `.ts` / `.css` | HMR (no state loss) |
| Renderer added a route | HMR (no reload) |
| Preload script | Full app reload |
| Main process | Full app restart |
| `package.json` deps | Stop dev, `pnpm install`, restart |
| `schema.ts` | Run `pnpm db:generate && pnpm db:migrate` then restart |
| `electron-builder.yml` | Restart not required (only used at package time) |

When HMR breaks (state ghosting, stale module): `Ctrl+C` and `pnpm dev` again. Do not paper over with `try/catch`.

### Debugger attach

**VS Code / Cursor**: F5 with the "Debug Main + Renderer" launch config (see §15). Sets breakpoints in `src/main/**` and `src/renderer/**`.

**Chrome DevTools for renderer**: `Cmd/Ctrl+Shift+I` from the running app window.

**Chrome DevTools for main**: `pnpm dev` opens main with `--inspect=5858`; visit `chrome://inspect` and click "inspect" under the listed Node target.

### Inspect runtime

| Inspect | How |
|---|---|
| DOM / React tree | DevTools (renderer); install React DevTools extension via `default_session.loadExtension` in dev only |
| IPC traffic | `electron-log` writes every `invoke` and reply at `debug` level when `ELECTRON_LOG_LEVEL=debug` |
| SQLite contents | `pnpm db:studio` opens Drizzle Studio at https://local.drizzle.studio/ |
| Zustand state | DevTools → Components → select store; or set `devtools(...)` middleware (dev only) |
| Network | DevTools Network tab (renderer); main fetches log to electron-log |
| App data path | `app.getPath('userData')` printed at boot to electron-log |

### Pre-commit checks

`.husky/pre-commit`:
```
pnpm run check
```

`pnpm run check` is wired in `package.json` to: `biome check --apply-unsafe . && tsc -p tsconfig.json --noEmit && vitest run --reporter=dot`.

### Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `release/v<major.minor.patch>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`).
- One concern per commit; no "wip" or "fixes" commits in shipped history (squash on merge).

---

## 6. Testing & Parallelization

### Unit tests

- Command: `pnpm test`
- Watch: `pnpm test:watch`
- Single file: `pnpm vitest run src/renderer/features/notes/note.test.ts`
- Single test: `pnpm vitest run -t "creates a note"`
- Tests live next to their source as `*.test.ts(x)`.

### Integration tests (main process logic with real SQLite)

- Command: `pnpm test:integration` (vitest with `vitest.config.integration.ts` that points to `tests/integration/`)
- Use a real `better-sqlite3` instance against a temp file (`fs.mkdtemp`). NEVER mock the database.

### E2E tests (Playwright + Electron)

- Command: `pnpm test:e2e`
- Headed: `pnpm test:e2e --headed`
- Single spec: `pnpm test:e2e tests/e2e/notes.spec.ts`
- Parallel by default (`workers: '50%'` in `playwright.config.ts`).

### What to mock, what not to

| Layer | Rule |
|---|---|
| `better-sqlite3` | Never mock. Use a temp file. |
| `fetch` / external HTTP | Mock at the adapter (`src/main/lib/http.ts`); never patch global fetch in tests. |
| `electron` (`app`, `dialog`, `ipcMain`) | Use `electron-mock-ipc` or Playwright's `_electron.launch` for E2E. |
| `keytar` | Mock with an in-memory map fixture in unit tests; real keychain only in manual QA. |
| Drizzle | Never. Run real migrations against the temp SQLite. |
| Time | Use `vi.useFakeTimers()` in unit; do not mock in E2E. |

### Coverage

- Target: 70% statements on `src/main/`, 60% on `src/renderer/features/`. UI components are covered via E2E.
- Measured with `pnpm vitest run --coverage` (V8 provider, output to `./coverage`).

### Parallelization patterns for AI agents

**Safe to fan out (run as parallel subagents):**
- Scaffold a new feature folder (UI components, store, route) — disjoint from main.
- Add IPC channels for unrelated domains (e.g. `notes` and `settings`) — disjoint files.
- Write unit tests for already-implemented code.
- Update copy in two unrelated routes.

**Must run sequentially:**
- Anything touching `package.json` (lockfile races).
- `src/main/db/schema.ts` changes (migration ordering).
- `src/preload/api.ts` (type surface; merge conflicts).
- `electron.vite.config.ts` and `electron-builder.yml`.
- `pnpm db:generate` (writes a numbered migration file).

---

## 7. Logging

### Setup

`src/main/logger.ts`:
```ts
import log from 'electron-log/main';
import { app } from 'electron';

log.initialize({ preload: true });
log.transports.file.level = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
log.transports.console.level = 'debug';
log.transports.file.resolvePathFn = () =>
  `${app.getPath('logs')}/main.log`;
log.transports.file.maxSize = 10 * 1024 * 1024; // 10 MB rotation

export default log;
```

`src/preload/index.ts` (logger bridge):
```ts
import log from 'electron-log/renderer';
contextBridge.exposeInMainWorld('log', {
  debug: (...a: unknown[]) => log.debug(...a),
  info:  (...a: unknown[]) => log.info(...a),
  warn:  (...a: unknown[]) => log.warn(...a),
  error: (...a: unknown[]) => log.error(...a),
});
```

### Log levels

| Level | When |
|---|---|
| `error` | Caught exception, IPC rejection, DB constraint violation |
| `warn` | Recoverable: failed update check, retry succeeded, slow op (>500 ms) |
| `info` | App boot, window opened/closed, user signed in, migration applied |
| `debug` | IPC in/out, query SQL, route change |
| `verbose` | Off in prod; full payloads only locally |

### Required fields

Every log line includes (electron-log adds level + timestamp; you add the rest):

| Field | Source |
|---|---|
| `event` | A short verb_noun, e.g. `notes_upsert`, `app_boot` |
| `module` | `main:ipc:notes`, `renderer:NoteEditor` |
| `request_id` | `crypto.randomUUID()` issued at IPC entry, propagated |
| `user_id` | Optional; only when an auth identity exists |
| `duration_ms` | For any op >50 ms |

### Sample lines

```
[2026-04-27 10:01:02.111] [info] event=app_boot module=main version=0.1.0 platform=darwin arch=arm64
[2026-04-27 10:01:02.844] [info] event=db_migrate_applied module=main:db migrations=3 duration_ms=212
[2026-04-27 10:01:08.020] [debug] event=ipc_in module=main:ipc:notes channel=notes:list request_id=8a... 
[2026-04-27 10:01:08.034] [debug] event=ipc_out module=main:ipc:notes channel=notes:list request_id=8a... duration_ms=14 rows=42
[2026-04-27 10:01:14.500] [warn] event=update_check_failed module=main:updater duration_ms=8000 error="ETIMEDOUT"
[2026-04-27 10:01:14.700] [error] event=ipc_rejected module=main:ipc:notes channel=notes:upsert request_id=9b... error="zod: title required"
```

### Where logs live

| Env | Path |
|---|---|
| Dev (stdout) | Terminal running `pnpm dev` |
| Dev (file) | macOS: `~/Library/Logs/<AppName>/main.log` ; Windows: `%USERPROFILE%\AppData\Roaming\<AppName>\logs\main.log` ; Linux: `~/.config/<AppName>/logs/main.log` |
| Prod (file) | Same as above |
| Prod (remote) | Sentry (`@sentry/electron`) for errors only; no full log shipping by default |

### Grep locally

```bash
# macOS
grep -E "event=ipc_rejected|level=error" ~/Library/Logs/<AppName>/main.log

# Windows (PowerShell)
Select-String -Path "$env:APPDATA\<AppName>\logs\main.log" -Pattern "level=error"

# Linux
grep -E "event=ipc_rejected|level=error" ~/.config/<AppName>/logs/main.log
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always set `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` on every `BrowserWindow`. Verify with `grep -nE "(nodeIntegration|contextIsolation|sandbox)" src/main/`.
2. Always expose renderer-callable functions through `contextBridge.exposeInMainWorld('api', ...)` in the preload — never assign to `window.*` directly.
3. Always validate every IPC payload with Zod inside the handler (defense in depth) before touching the database.
4. Always run `pnpm exec electron-builder install-app-deps` after adding or upgrading any native module (`better-sqlite3`, `keytar`, etc.).
5. Always store the database at `app.getPath('userData')`; never at the install location, never relative to `__dirname`.
6. Always run `pnpm db:generate` after editing `src/main/db/schema.ts`; commit the generated SQL alongside the schema change.
7. Always run migrations on `app.whenReady()` before opening the first window.
8. Always invoke from renderer with `window.api.<domain>.<method>(...)`; never `ipcRenderer.invoke` directly.
9. Always type IPC payloads end-to-end via `src/shared/types.ts` consumed by both preload and main.
10. Always use `shell.openExternal` for any URL the user should see; never load arbitrary URLs in a `BrowserWindow`.
11. Always use the system browser for OAuth (`shell.openExternal`); never embed.
12. Always sign mac builds with hardened runtime (`hardenedRuntime: true`) and notarize before distributing.
13. Always sign Windows builds (Azure Trusted Signing or EV cert); unsigned builds trigger SmartScreen.
14. Always run `pnpm run check` (Biome + tsc + vitest) before declaring a task done.
15. Always update `electron-builder.yml` `appId` to a real reverse-DNS string before first publish; never ship `com.example.app`.
16. Always set `app.setAppUserModelId('<appId>')` early in main on Windows for taskbar grouping + notifications.
17. Always handle `before-quit` to flush the SQLite WAL with `db.close()`.
18. Always set `Content-Security-Policy` via `webRequest.onHeadersReceived` AND `<meta http-equiv>` in `index.html` — both layers.
19. Always use `path.join` / `path.resolve`; never string-concatenate paths (Windows separator hell).
20. Always pin `electron`, `electron-builder`, `electron-updater` to exact versions in `package.json` (no `^`).
21. Always record a screenshot of the running app in the PR description when changing UI.
22. Always call `app.requestSingleInstanceLock()` early in main; second instance focuses the existing window.
23. Always wrap async IPC handlers in try/catch and re-throw as a sanitized message (no stack traces over IPC).
24. Always run `pnpm test:e2e` against a packaged build at least once before tagging a release.

### 8.2 NEVER

1. Never set `nodeIntegration: true`. It is always wrong.
2. Never set `contextIsolation: false`. It is always wrong.
3. Never disable `sandbox` except for a specific preload that imports allowlisted Node modules — and document why in a comment above the option.
4. Never `require('electron')` from `src/renderer/`. The renderer has no access to Electron APIs.
5. Never call `ipcRenderer.on/send/invoke` directly from React components — go through `window.api`.
6. Never expose `ipcRenderer` itself across the contextBridge; expose specific methods only.
7. Never pass `VideoFrame` or other transferable objects across `contextBridge` (CVE-2026-34780); serialize to ArrayBuffer/ImageBitmap first.
8. Never load remote URLs into a window; load `file://` (production) or the dev server (development) only.
9. Never disable `webSecurity`.
10. Never store secrets in `.env`, `localStorage`, or any plain JSON file. Use `keytar`.
11. Never run `electron-rebuild` and `electron-builder install-app-deps` in the same project. Pick one (we picked the latter); the other will fight it.
12. Never commit `node_modules`, `dist`, `release`, `coverage`, `*.log`, or `out/`.
13. Never publish a release without notarization (mac) or signing (win). Users will get scary OS warnings and report the app as malware.
14. Never bump `electron` major across a release boundary without rerunning the full E2E suite — Chromium changes break things.
15. Never write to the install directory at runtime; it is read-only on macOS and on Windows for non-admin users.
16. Never use `app.relaunch()` inside an unhandled rejection — you will infinite-loop.
17. Never use blocking sync IO in the renderer (no `fs.*Sync`); the main process is where sync better-sqlite3 calls belong.
18. Never let the renderer construct a SQL string. All SQL goes through Drizzle in main.
19. Never put business logic in preload. Preload is a translation layer only.
20. Never publish from a developer machine for production. Use CI; signed builds belong on a clean runner.

### 8.3 Blast Radius Reference

| Path | Blast | Verify after change |
|---|---|---|
| `package.json` | every command, all 3 OS | `pnpm install && pnpm run check && pnpm test:e2e` |
| `pnpm-lock.yaml` | all installs | `pnpm install --frozen-lockfile && pnpm dev` smoke |
| `electron.vite.config.ts` | dev + build | `rm -rf out && pnpm build && pnpm dev` |
| `electron-builder.yml` | packaging + auto-update | `pnpm build && pnpm package -- --dir` then run unpacked binary |
| `tsconfig*.json` | typecheck across all 3 contexts | `pnpm tsc -b --force` |
| `biome.json` | lint + format | `pnpm biome check .` |
| `vitest.config.ts` | every unit test | `pnpm test` |
| `playwright.config.ts` | every E2E | `pnpm test:e2e` |
| `drizzle.config.ts` | migration generator | `pnpm db:generate` (must produce empty diff if schema unchanged) |
| `src/main/db/schema.ts` | runtime + types + on-disk format | `pnpm db:generate && pnpm test:integration` |
| `drizzle/*.sql` | every install on every user's machine forever | `pnpm test:integration` + manual run on a fresh `userData` |
| `src/main/index.ts` | app boot, IPC registration | `pnpm dev` boot + `pnpm test:e2e` |
| `src/preload/index.ts` | renderer ↔ main contract | `pnpm tsc -b` + `pnpm test:e2e` |
| `src/preload/api.ts` | every renderer call site | `pnpm tsc -b` |
| `src/shared/ipc-channels.ts` | both ends of every IPC call | `pnpm tsc -b && pnpm test` |
| `src/shared/types.ts` | both ends | `pnpm tsc -b` |
| `src/main/ipc/<domain>.ts` | one feature; renderer code calling that domain | `pnpm test` for the domain + `pnpm test:e2e -g <domain>` |
| `src/main/updater.ts` | end-user upgrade path | Manually test against a staging GH release (publish to `beta` channel) |
| `src/main/logger.ts` | every log line | `pnpm dev`, confirm log file written + console output |
| `src/main/menu.ts` | application menu, accelerators | Open packaged build, walk every menu item |
| `src/renderer/main.tsx` | every renderer route | `pnpm dev` boot, navigate to each route |
| `src/renderer/routes/*` | route-level UI | Visit route in dev; `pnpm test:e2e` for that route |
| `build/entitlements.mac.plist` | mac sign + notarize | `pnpm package` on mac CI; verify `codesign --verify --deep --strict` |
| `build/icon.*` | installer + dock + taskbar | Visual inspection on each OS |
| `.github/workflows/release.yml` | release artifacts for all 3 OS | Push a `v0.0.0-rc1` tag; confirm draft release with 3 installers |
| `.claude/settings.json` | agent behavior + permissions | Run a sample prompt; confirm hooks fire |

### 8.4 Definition of Done

**Bug fix**
- [ ] Failing test added that reproduces the bug
- [ ] Fix applied; test passes
- [ ] `pnpm run check` green
- [ ] No new Biome lint warnings
- [ ] Manual verify in `pnpm dev` of the exact reported steps
- [ ] Screenshot before/after in PR if UI-visible
- [ ] No unrelated changes; do not "tidy" while fixing

**New feature**
- [ ] `src/shared/types.ts` updated if the type surface changes
- [ ] IPC channel registered in `shared/ipc-channels.ts`, handler in `src/main/ipc/`, exposed in `preload/api.ts`
- [ ] DB schema change (if any) → `pnpm db:generate` committed
- [ ] Unit tests for main-side logic
- [ ] E2E test for the user-visible flow
- [ ] Logger emits an `info` line at each milestone of the flow
- [ ] `pnpm run check && pnpm test:e2e` green
- [ ] PR includes a screenshot/screen-recording

**Refactor**
- [ ] Behavior is unchanged (existing tests still pass without modification)
- [ ] No new dependencies
- [ ] `pnpm run check && pnpm test:e2e` green
- [ ] PR title starts with `refactor:`; body explains why and links the issue

**Dependency bump**
- [ ] One package per PR (electron, electron-builder, react, drizzle...)
- [ ] Pin to exact version in `package.json`
- [ ] `pnpm exec electron-builder install-app-deps`
- [ ] Full `pnpm test:e2e` matrix on all 3 OS in CI
- [ ] Manually launch the packaged build on at least one OS
- [ ] Note the breaking-change link in the PR

**Schema change**
- [ ] Edit `src/main/db/schema.ts`
- [ ] `pnpm db:generate` produces exactly one new SQL file
- [ ] Commit schema + SQL together
- [ ] Migration is forward-only (no destructive changes without a data move)
- [ ] Integration test exercises the new shape

**Copy change**
- [ ] No code logic touched
- [ ] `pnpm biome check` green
- [ ] Screenshot in PR

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile
pnpm exec electron-builder install-app-deps
pnpm biome check .
pnpm tsc -b
pnpm vitest run
pnpm test:e2e --reporter=line
pnpm build              # full electron-vite production build
```

What "green" looks like (literal expected lines):

```
> pnpm biome check .
Checked X files in NNNms. No fixes applied.

> pnpm tsc -b
(no output, exit 0)

> pnpm vitest run
 Test Files  N passed (N)
      Tests  M passed (M)

> pnpm test:e2e --reporter=line
  K passed (Js)
```

If any step prints a non-zero exit or the literal word `error`, you are not done.

### 8.6 Parallelization Patterns

Spawn parallel subagents only when their file sets are disjoint. Examples below assume a feature `notes` and a feature `settings`.

| Plan | Safe to parallelize? | Why |
|---|---|---|
| Add `notes` IPC + add `settings` IPC | Yes | Disjoint handler files; one merge in `preload/api.ts` |
| Two agents both editing `preload/api.ts` | No | Merge conflicts on the type surface |
| Generate two schema migrations simultaneously | No | Migration numbering collides |
| Add a new route + write tests for an existing route | Yes | Disjoint files |
| Bump electron + bump react in two PRs | No (sequential) | Both touch `package.json`; merge order matters |
| Refactor renderer components + edit menu.ts | Yes | Disjoint |
| Update Biome config + run a feature task | No | Lint config change perturbs the feature task's `check` |

---

## 9. Stack-Specific Pitfalls

1. **Native module ABI mismatch.** Symptom: `Module did not self-register` or `NODE_MODULE_VERSION mismatch`. Cause: better-sqlite3 was built against your host Node, not Electron's. Fix: `pnpm exec electron-builder install-app-deps`. Detect: app fails to boot in dev right after `pnpm install`.
2. **`contextIsolation: false` slipping in.** Symptom: renderer can `require('fs')`. Cause: copy-pasted old tutorial. Fix: hard-code `true` and `sandbox: true`. Detect: `grep -RE "contextIsolation\s*:\s*false" src/` returns nothing in CI.
3. **`require is not defined` in renderer.** Symptom: white window. Cause: code expects Node in renderer. Fix: move that code to main, expose via preload. Detect: error in DevTools console at boot.
4. **SQLite locked by stale process.** Symptom: `SQLITE_BUSY`. Cause: previous dev run did not call `db.close()`. Fix: register `app.on('before-quit', () => db.close())`. Detect: subsequent dev boot fails.
5. **`__dirname` is undefined in ESM main.** Symptom: `__dirname is not defined`. Cause: electron-vite emits ESM by default. Fix: `import { fileURLToPath } from 'node:url'; const __dirname = path.dirname(fileURLToPath(import.meta.url));`. Detect: build fails with the exact error.
6. **Auto-update fails silently in dev.** Symptom: `autoUpdater.checkForUpdates()` rejects. Cause: dev builds are unsigned/unpacked. Fix: gate updater calls with `if (app.isPackaged)`. Detect: log line `update_check_skipped reason=not_packaged`.
7. **Notarization stuck "in progress" >30 min.** Symptom: CI hangs on `notarytool submit ... --wait`. Cause: occasional Apple service slowness (March 2026). Fix: cap `--wait` at 20 min and fall back to polling; check https://developer.apple.com/system-status/. Detect: CI step exceeds median by 3×.
8. **Windows SmartScreen "Unrecognized app".** Symptom: end users see a blue prompt. Cause: unsigned or new EV cert reputation not built. Fix: Azure Trusted Signing (no reputation gap) or wait 1–2 weeks of installs to season the cert. Detect: report from beta tester.
9. **`appId` of `com.example.app`.** Symptom: app collides with another `com.example.app` in registry. Cause: forgot to change the template default. Fix: set `appId` to a real reverse-DNS. Detect: mac console shows two apps with the same bundle ID.
10. **Renderer fetches `localhost` in production.** Symptom: in packaged app, blank UI. Cause: `loadURL('http://localhost:5173')` was hard-coded instead of `loadFile`. Fix: use `is.dev` from `@electron-toolkit/utils` to switch. Detect: prod build shows `ERR_CONNECTION_REFUSED` in DevTools.
11. **CSP violation hides errors.** Symptom: nothing appears, no error. Cause: missing CSP causes Electron to inject a permissive default and the linter trips later. Fix: explicit CSP `default-src 'self'; script-src 'self'`. Detect: DevTools console "Refused to load…".
12. **Drizzle `db push` on prod.** Symptom: data loss. Cause: someone ran `db:push` against the user's app.db. Fix: only `migrate` ships; `push` is dev-only. Never wire `db:push` into the app. Detect: production users report missing rows after an update.
13. **IPC payload too large.** Symptom: app freezes for seconds on big lists. Cause: structured-clone copy of 100 MB across IPC. Fix: paginate, or stream via `MessageChannelMain`. Detect: `duration_ms` log line >200 ms on `ipc_in`.
14. **Single-instance lock missing.** Symptom: opening the app twice creates a second window with empty state. Cause: forgot `app.requestSingleInstanceLock`. Fix: add it as the first lines of `main/index.ts`; on `second-instance`, focus existing window. Detect: launch app twice manually.
15. **Renderer reads file path from main and assumes POSIX.** Symptom: works on mac, breaks on Windows. Cause: hard-coded `/`. Fix: send POSIX-normalized URIs (`pathToFileURL`) across IPC. Detect: Windows E2E.
16. **Tray icon disappears on Linux.** Symptom: no tray on Ubuntu. Cause: GNOME ships without tray support. Fix: detect with `process.platform === 'linux'` and show a menubar fallback or document the AppIndicator extension dependency. Detect: Linux QA.
17. **`app.getPath('userData')` not awaited.** Symptom: undefined paths during very early boot. Cause: called before `app.whenReady()`. Fix: defer until after `whenReady`. Detect: log "userData=undefined" at boot.
18. **Shipping `devDependencies` in the asar.** Symptom: 200 MB installer. Cause: missing `files` filter in `electron-builder.yml`. Fix: explicit `files:` allowlist (see §16). Detect: `du -sh dist/*.dmg` exceeds budget.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (first window visible) | ≤ 1.8 s on M2 / Win 11 / Ubuntu 22 | Log `event=window_show` minus `event=app_boot` |
| First interaction | ≤ 2.5 s | Measure click-to-DB-row in E2E |
| Bundle (asar) size | ≤ 80 MB | `ls -lh dist/*.asar` |
| Installer size (per OS) | ≤ 110 MB | `ls -lh release/*.dmg release/*.exe release/*.AppImage` |
| RSS at idle | ≤ 250 MB | `ps -o rss= -p $(pgrep -f <AppName>)` |
| RSS under load (10k notes) | ≤ 500 MB | Same, after E2E "load 10k" fixture |
| CPU at idle | < 1% on M2 | Activity Monitor / Task Manager / `top` |
| IPC round-trip p95 | ≤ 30 ms | `duration_ms` on `ipc_out` log lines |

When a budget is exceeded: open an issue tagged `perf`, capture a Chrome DevTools performance trace (`Performance` tab → record), and a `pnpm exec electron --inspect` Node trace for main; do not "fix" by raising the budget.

---

## 11. Security

### Secret storage

- **Use:** `keytar` (OS keychain) — wrap in `src/main/keychain.ts`. Wraps macOS Keychain, Windows Credential Vault, libsecret on Linux.
- **Never put in:** `.env`, `localStorage`, `sessionStorage`, `IndexedDB`, the asar, the SQLite database (unless encrypted with `better-sqlite3-multiple-ciphers`, which is out of scope).

### Auth threat model

- The local user owns their machine and their data. Threat actors are: malicious websites loaded into a window (mitigated by CSP + isolation), other unprivileged processes (mitigated by `userData` permissions + keychain), and supply-chain attacks (mitigated by lockfile + pinning + audit).

### Input validation boundary

- Every IPC handler in `src/main/ipc/` parses its input with Zod first. Reject early. Renderer-side validation is for UX only; main is the trust boundary.

### Output escaping

- React escapes JSX by default. Never use `dangerouslySetInnerHTML` unless rendering trusted, sanitized content.
- When constructing file paths from user input, validate against a base path and reject `..` segments: `if (!resolved.startsWith(baseDir)) throw new Error('escape')`.

### Permissions / capabilities

- Mac entitlements in `build/entitlements.mac.plist`: hardened runtime, `com.apple.security.cs.allow-jit` (Chromium needs JIT), no microphone/camera unless feature requires it.
- Set `session.defaultSession.setPermissionRequestHandler` to deny all by default; allowlist on demand.

### Dependency audit

```bash
pnpm audit --prod
```

Run weekly via a scheduled GitHub Action. Block the release pipeline on `high` or `critical`.

### Top 5 stack-specific risks

1. `nodeIntegration: true` — instant RCE via XSS. Always `false`.
2. `contextIsolation: false` — preload globals leak into renderer. Always `true`.
3. Loading remote URLs into a window — turns your app into a web browser with Node access.
4. `webSecurity: false` — disables CORS, opens XSS to Node escalation. Never set.
5. Passing rich objects across `contextBridge` (esp. `VideoFrame`, CVE-2026-34780). Stick to JSON-serializable values.

---

## 12. Deploy

### Release flow

1. Bump `package.json` `version` (`pnpm version patch | minor | major`).
2. Push tag: `git push --follow-tags`.
3. CI (`.github/workflows/release.yml`) runs the matrix on macOS, Windows, Linux runners.
4. Each runner: install deps → `pnpm exec electron-builder install-app-deps` → build → sign → notarize (mac) → publish.
5. Result: a draft GitHub Release with `.dmg`, `.exe`, `.AppImage`, plus `latest*.yml` manifests for `electron-updater`.
6. Manual smoke on each OS: download installer, launch, verify version + auto-update detects "you are up to date".
7. Hit "Publish release" in GitHub.

### Staging vs prod

- `latest` channel = users on stable.
- `beta` channel = opt-in users (set `electron-updater` channel via a setting). Tag pre-releases as `v1.2.3-beta.1`.

### Rollback

- Mark the latest GitHub Release as draft (un-publishes for `electron-updater`). Users on the bad version stay on it; new installs fall back to the prior release.
- Max safe rollback window: until any user has run a forward migration on their local DB. After that, rollback requires shipping a forward-only fix.

### Health check

- No server. The app's "I am alive" signal is a Sentry session ping on launch. Look at https://sentry.io/<org>/<project>/sessions/ for crash-free rate after a release.

### Versioning

- Semver. `package.json#version` is the single source of truth; `electron-builder` reads it.

### Auto-update

`src/main/updater.ts`:
```ts
import { autoUpdater } from 'electron-updater';
import log from './logger';

export function initUpdater() {
  if (!app.isPackaged) return;
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.channel = 'latest'; // or 'beta' from a user setting
  autoUpdater.checkForUpdatesAndNotify();
  setInterval(() => autoUpdater.checkForUpdates(), 60 * 60 * 1000);
}
```

GitHub Releases is the default publish target; `electron-builder.yml` sets `publish: github`. No extra DNS or server.

### Cost per 1k MAU

- GitHub Releases bandwidth: free for public repos, included in Free Plan up to 1 GB/mo for private (negligible at 1k MAU).
- Sentry developer plan: free up to 5k errors/mo.
- Apple Developer: $99/yr flat.
- Azure Trusted Signing: ~$10/mo flat.
- **Total**: ~$20/mo amortized at 1k MAU.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Project: <AppName>

This is an Electron 40 + React 19 + TypeScript desktop app.
Stack rulebook: ./rulebooks/electron-react.md  (read it first; it overrides any habit you have).

## Commands you'll run all day
- `pnpm dev` — start dev (main+preload+renderer watchers)
- `pnpm run check` — biome + tsc + vitest, run before claiming done
- `pnpm test` — vitest unit
- `pnpm test:e2e` — Playwright Electron E2E
- `pnpm build` — production build (electron-vite)
- `pnpm package` — electron-builder to `release/`
- `pnpm db:generate` — generate Drizzle migration after schema edit
- `pnpm db:migrate` — apply migrations (also runs at app boot)
- `pnpm db:studio` — open Drizzle Studio

## Definition of done
1. `pnpm run check` exits 0
2. `pnpm test:e2e` green for changed area
3. PR has a screenshot/screen-recording for UI changes
4. Schema changes include the generated SQL file

## Banned patterns (instant reject)
- `nodeIntegration: true`
- `contextIsolation: false`
- `sandbox: false` (without a written reason in a comment)
- `require('electron')` in `src/renderer/`
- `ipcRenderer.*` in React components (must go through `window.api`)
- `dangerouslySetInnerHTML` without sanitization
- Mocking better-sqlite3 in tests
- Editing `drizzle/*.sql` by hand

## Work scope
- Touch only files relevant to the task. No drive-by refactors.
- One feature per PR. One dep bump per PR.
- If unsure, ask. Do not invent product requirements.
```

### `.claude/settings.json` (paste-ready)

```json
{
  "$schema": "https://raw.githubusercontent.com/anthropics/claude-code/main/schemas/settings.schema.json",
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git checkout:*)",
      "Bash(git switch:*)",
      "Bash(grep:*)",
      "Bash(rg:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(find:*)",
      "Bash(open:*)",
      "Bash(start:*)"
    ],
    "deny": [
      "Bash(rm -rf /:*)",
      "Bash(sudo:*)",
      "Bash(curl:* | sh)",
      "Bash(wget:* | sh)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm biome format --write \"$CLAUDE_TOOL_FILE_PATH\" 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      { "type": "command", "command": "pnpm tsc -b --pretty false 2>&1 | tail -50" }
    ]
  }
}
```

### Recommended skills

| When | Skill |
|---|---|
| Starting any non-trivial implementation | `/test-driven-development` |
| Debugging a flaky test or crash | `/systematic-debugging` |
| Before claiming work is done | `/verification-before-completion` |
| Cutting a release | `/ship` then `/land-and-deploy` |
| Pre-merge sanity | `/review` |
| Adversarial second opinion | `/codex` |
| Touching prod (release tag, CI secrets) | `/careful` |

### Slash command shortcuts

- `/dev` → runs `pnpm dev`
- `/check` → runs `pnpm run check`
- `/e2e` → runs `pnpm test:e2e`
- `/migrate` → runs `pnpm db:generate && pnpm db:migrate`

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# Codex Agent Notes

Read `./rulebooks/electron-react.md` first. The decisions table in §1 is binding.

## Stack
Electron 40, React 19, TypeScript 5.9, electron-vite 5, better-sqlite3 12, drizzle-orm 0.45.

## Architecture
- main process owns the database and OS integration.
- preload exposes a typed `window.api`. No business logic.
- renderer is a sandboxed React app. No Node access.

## Commands
- Setup: `pnpm install && pnpm exec electron-builder install-app-deps`
- Dev: `pnpm dev`
- Verify: `pnpm run check && pnpm test:e2e`
- Build: `pnpm build && pnpm package`

## Hard rules
- Never set `nodeIntegration: true` or `contextIsolation: false`.
- Never `require('electron')` in renderer.
- Always validate IPC payloads with Zod in main.
- Always store DB at `app.getPath('userData')`.
- Always run `pnpm db:generate` after schema edits; commit the SQL.

## Output expectations
- One feature per change.
- Provide diff + the verification command output.
- Screenshots for UI changes.
```

### `.codex/config.toml`

```toml
model = "gpt-5"
approval_policy = "on-failure"
sandbox_mode = "workspace-write"

[[mcp_servers]]
# none required by default

[shell_environment_policy]
inherit = "core"

[history]
persistence = "save-all"
```

### Codex differences from Claude Code

- Codex defaults to a more conservative sandbox; bumping to `workspace-write` is fine for this stack since all writes are scoped under the project.
- Codex prefers smaller diffs and shorter explanations. Claude Code preference for thorough explanations doesn't apply.
- Codex has weaker session memory between runs; commit progress more often.
- Codex ignores `.claude/settings.json`; the equivalent allowlist lives in `.codex/config.toml` shell policy.

---

## 15. Cursor / VS Code

### `.cursor/rules`

```
You are working on an Electron 40 + React 19 + TypeScript desktop app.
The decisions table in ./rulebooks/electron-react.md is binding.

ALWAYS:
- Use `pnpm` for every package operation.
- After native module install: `pnpm exec electron-builder install-app-deps`.
- Validate every IPC payload with Zod inside the main-process handler.
- Expose renderer-callable functions via `contextBridge.exposeInMainWorld('api', ...)`.
- Type IPC payloads end-to-end through `src/shared/types.ts`.
- Run `pnpm run check && pnpm test:e2e` before claiming a task is done.

NEVER:
- Set `nodeIntegration: true` or `contextIsolation: false`.
- Disable `sandbox` without a written justification comment above the option.
- `require('electron')` from `src/renderer/`.
- Call `ipcRenderer.*` directly from React components.
- Pass `VideoFrame` or other rich objects across `contextBridge`.
- Mock better-sqlite3 in tests.
- Edit `drizzle/*.sql` by hand.

Project layout:
- `src/main/` — Node/Electron main process (DB, OS, IPC handlers)
- `src/preload/` — typed bridge only, no business logic
- `src/renderer/` — sandboxed React app
- `src/shared/` — types + IPC channel constants

When in doubt, read the rulebook section that matches your task.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "ms-playwright.playwright",
    "vitest.explorer",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "bradlc.vscode-tailwindcss",
    "drizzle-team.drizzle-vscode",
    "github.vscode-github-actions"
  ]
}
```

### `.vscode/settings.json`

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "biomejs.biome",
  "biome.lspBin": "node_modules/.bin/biome",
  "typescript.tsdk": "node_modules/typescript/lib",
  "files.eol": "\n",
  "files.insertFinalNewline": true,
  "editor.codeActionsOnSave": { "source.organizeImports.biome": "explicit", "quickfix.biome": "explicit" },
  "search.exclude": { "**/dist": true, "**/out": true, "**/release": true, "**/.vite": true }
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Main Process",
      "type": "node",
      "request": "launch",
      "cwd": "${workspaceFolder}",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron-vite",
      "windows": { "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/electron-vite.cmd" },
      "args": ["dev", "--no-sandbox"],
      "outputCapture": "std",
      "console": "integratedTerminal",
      "env": { "ELECTRON_ENABLE_LOGGING": "true" }
    },
    {
      "name": "Attach to Renderer (Chrome)",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "webRoot": "${workspaceFolder}/src/renderer"
    },
    {
      "name": "Vitest: current file",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
      "windows": { "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest.cmd" },
      "args": ["run", "${file}"],
      "console": "integratedTerminal"
    },
    {
      "name": "Compounds: Main + Renderer",
      "type": "node",
      "request": "launch",
      "preLaunchTask": "npm: dev"
    }
  ],
  "compounds": [
    { "name": "Debug Main + Renderer", "configurations": ["Debug Main Process", "Attach to Renderer (Chrome)"] }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order. After all 21 files exist and `pnpm install && pnpm dev` runs, you have a hello-world Electron app on all 3 OS.

### 1. `package.json`

```json
{
  "name": "my-app",
  "version": "0.1.0",
  "description": "Electron desktop app",
  "main": "out/main/index.js",
  "type": "module",
  "private": true,
  "packageManager": "pnpm@10.33.0",
  "engines": { "node": ">=24.15.0" },
  "scripts": {
    "dev": "electron-vite dev",
    "build": "electron-vite build",
    "package": "electron-builder",
    "start": "electron-vite preview",
    "check": "biome check --write . && tsc -b && vitest run --reporter=dot",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:integration": "vitest run --config vitest.integration.config.ts",
    "test:e2e": "playwright test",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "tsx src/main/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "postinstall": "electron-builder install-app-deps"
  },
  "dependencies": {
    "better-sqlite3": "12.9.0",
    "drizzle-orm": "0.45.2",
    "electron-log": "5.4.3",
    "electron-updater": "6.8.3",
    "@sentry/electron": "7.11.0",
    "keytar": "7.9.0",
    "react": "19.2.5",
    "react-dom": "19.2.5",
    "react-hook-form": "7.55.0",
    "react-router": "7.5.0",
    "zod": "3.24.0",
    "zustand": "5.0.3"
  },
  "devDependencies": {
    "@biomejs/biome": "2.4.13",
    "@electron/notarize": "3.0.0",
    "@playwright/test": "1.55.0",
    "@tailwindcss/postcss": "4.0.0",
    "@types/better-sqlite3": "7.6.13",
    "@types/node": "24.0.0",
    "@types/react": "19.0.0",
    "@types/react-dom": "19.0.0",
    "drizzle-kit": "0.31.0",
    "electron": "40.0.0",
    "electron-builder": "26.8.2",
    "electron-vite": "5.0.0",
    "tailwindcss": "4.0.0",
    "tsx": "4.19.0",
    "typescript": "5.9.0",
    "vite": "6.0.0",
    "vitest": "4.1.5"
  }
}
```

### 2. `electron.vite.config.ts`

```ts
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: { outDir: 'out/main', rollupOptions: { input: resolve(__dirname, 'src/main/index.ts') } },
    resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: { outDir: 'out/preload', rollupOptions: { input: resolve(__dirname, 'src/preload/index.ts') } },
    resolve: { alias: { '@shared': resolve(__dirname, 'src/shared') } },
  },
  renderer: {
    root: resolve(__dirname, 'src/renderer'),
    build: { outDir: 'out/renderer', rollupOptions: { input: resolve(__dirname, 'src/renderer/index.html') } },
    plugins: [react()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src/renderer'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    server: { port: 5173 },
  },
});
```

### 3. `electron-builder.yml`

```yaml
appId: com.mycompany.myapp
productName: My App
copyright: Copyright (c) 2026 My Company
directories:
  buildResources: build
  output: release
files:
  - "out/**/*"
  - "package.json"
  - "!**/node_modules/*/{CHANGELOG.md,README.md,readme.md,*.d.ts,*.map,test,tests}"
  - "!**/{.DS_Store,.git,.github,.idea,.vscode}"
asar: true
asarUnpack:
  - "**/node_modules/better-sqlite3/**/*"
  - "**/node_modules/keytar/**/*"
mac:
  category: public.app-category.productivity
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build/entitlements.mac.plist
  entitlementsInherit: build/entitlements.mac.plist
  notarize: true
  target:
    - target: dmg
      arch: [x64, arm64]
    - target: zip
      arch: [x64, arm64]
win:
  target:
    - target: nsis
      arch: [x64, arm64]
  signtoolOptions:
    sign: ./build/sign.js
linux:
  target:
    - target: AppImage
      arch: [x64]
  category: Office
publish:
  provider: github
  releaseType: draft
nsis:
  oneClick: false
  perMachine: false
  allowElevation: true
  allowToChangeInstallationDirectory: true
  artifactName: ${productName}-${version}-Setup-${arch}.${ext}
```

### 4. `tsconfig.json`

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.node.json" },
    { "path": "./tsconfig.web.json" }
  ]
}
```

### 5. `tsconfig.node.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["node"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": { "@shared/*": ["src/shared/*"] }
  },
  "include": ["src/main/**/*", "src/preload/**/*", "src/shared/**/*"]
}
```

### 6. `tsconfig.web.json`

```json
{
  "compilerOptions": {
    "composite": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": true,
    "resolveJsonModule": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/renderer/*"],
      "@shared/*": ["src/shared/*"]
    }
  },
  "include": ["src/renderer/**/*", "src/shared/**/*"]
}
```

### 7. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.13/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": { "includes": ["src/**", "tests/**"] },
  "formatter": { "enabled": true, "indentStyle": "space", "indentWidth": 2, "lineWidth": 100 },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noConsole": "warn" },
      "style": { "noNonNullAssertion": "error" },
      "correctness": { "noUnusedImports": "error" }
    }
  },
  "javascript": { "formatter": { "quoteStyle": "single", "semicolons": "always", "trailingCommas": "all" } }
}
```

### 8. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    coverage: { provider: 'v8', reporter: ['text', 'html'], reportsDirectory: './coverage' },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src/renderer'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
});
```

### 9. `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  workers: '50%',
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['github'], ['html']] : 'list',
  timeout: 30_000,
  use: { trace: 'retain-on-failure', screenshot: 'only-on-failure' },
});
```

### 10. `drizzle.config.ts`

```ts
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  dialect: 'sqlite',
  schema: './src/main/db/schema.ts',
  out: './drizzle',
  verbose: true,
  strict: true,
});
```

### 11. `src/main/index.ts`

```ts
import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import log from './logger';
import { initDb, closeDb } from './db/client';
import { runMigrations } from './db/migrate';
import { registerNotesIpc } from './ipc/notes';
import { initUpdater } from './updater';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isDev = !app.isPackaged;

if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit(0);
}

app.setAppUserModelId('com.mycompany.myapp');

async function createMainWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  if (isDev && process.env['ELECTRON_RENDERER_URL']) {
    await win.loadURL(process.env['ELECTRON_RENDERER_URL']);
  } else {
    await win.loadFile(path.join(__dirname, '../renderer/index.html'));
  }
}

app.whenReady().then(async () => {
  log.info({ event: 'app_boot', module: 'main', version: app.getVersion(), platform: process.platform });
  initDb();
  await runMigrations();
  registerNotesIpc(ipcMain);
  await createMainWindow();
  initUpdater();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => closeDb());
```

### 12. `src/main/logger.ts`

```ts
import log from 'electron-log/main';
import { app } from 'electron';

log.initialize({ preload: true });
log.transports.file.level = app.isPackaged ? 'info' : 'debug';
log.transports.console.level = 'debug';
log.transports.file.resolvePathFn = () => `${app.getPath('logs')}/main.log`;
log.transports.file.maxSize = 10 * 1024 * 1024;

export default log;
```

### 13. `src/main/db/client.ts`

```ts
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { app } from 'electron';
import path from 'node:path';
import log from '../logger';

let sqlite: Database.Database | null = null;
export let db: ReturnType<typeof drizzle>;

export function initDb() {
  const dbPath = path.join(app.getPath('userData'), 'app.db');
  log.info({ event: 'db_open', module: 'main:db', dbPath });
  sqlite = new Database(dbPath);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  db = drizzle(sqlite);
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    log.info({ event: 'db_close', module: 'main:db' });
  }
}
```

### 14. `src/main/db/schema.ts`

```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const notes = sqliteTable('notes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  body: text('body').notNull().default(''),
  createdAt: text('created_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at').notNull().default(sql`(CURRENT_TIMESTAMP)`),
});

export type Note = typeof notes.$inferSelect;
export type NewNote = typeof notes.$inferInsert;
```

### 15. `src/main/db/migrate.ts`

```ts
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'node:path';
import { app } from 'electron';
import { db, initDb } from './client';
import log from '../logger';

export async function runMigrations() {
  if (!db) initDb();
  const start = Date.now();
  const folder = app.isPackaged
    ? path.join(process.resourcesPath, 'drizzle')
    : path.join(process.cwd(), 'drizzle');
  migrate(db, { migrationsFolder: folder });
  log.info({ event: 'db_migrate_applied', module: 'main:db', duration_ms: Date.now() - start });
}
```

### 16. `src/main/ipc/notes.ts`

```ts
import type { IpcMain } from 'electron';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '../db/client';
import { notes } from '../db/schema';
import { CHANNELS } from '@shared/ipc-channels';
import log from '../logger';

const UpsertSchema = z.object({
  id: z.number().int().optional(),
  title: z.string().min(1).max(200),
  body: z.string().max(50_000).default(''),
});

export function registerNotesIpc(ipc: IpcMain) {
  ipc.handle(CHANNELS.NOTES_LIST, async () => {
    return db.select().from(notes).all();
  });

  ipc.handle(CHANNELS.NOTES_UPSERT, async (_e, raw: unknown) => {
    const requestId = crypto.randomUUID();
    try {
      const input = UpsertSchema.parse(raw);
      if (input.id != null) {
        await db.update(notes).set({ title: input.title, body: input.body, updatedAt: new Date().toISOString() }).where(eq(notes.id, input.id));
        return { id: input.id };
      }
      const [row] = await db.insert(notes).values(input).returning({ id: notes.id });
      return row;
    } catch (err) {
      log.error({ event: 'ipc_rejected', module: 'main:ipc:notes', channel: CHANNELS.NOTES_UPSERT, request_id: requestId, error: String(err) });
      throw new Error('upsert_failed');
    }
  });
}
```

### 17. `src/main/updater.ts`

```ts
import { app } from 'electron';
import { autoUpdater } from 'electron-updater';
import log from './logger';

export function initUpdater() {
  if (!app.isPackaged) {
    log.info({ event: 'update_check_skipped', module: 'main:updater', reason: 'not_packaged' });
    return;
  }
  autoUpdater.logger = log;
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.checkForUpdatesAndNotify().catch((e) => log.warn({ event: 'update_check_failed', module: 'main:updater', error: String(e) }));
  setInterval(() => autoUpdater.checkForUpdates().catch(() => {}), 60 * 60 * 1000);
}
```

### 18. `src/preload/index.ts`

```ts
import { contextBridge, ipcRenderer } from 'electron';
import { CHANNELS } from '@shared/ipc-channels';
import type { Note } from '@shared/types';

const api = {
  notes: {
    list: (): Promise<Note[]> => ipcRenderer.invoke(CHANNELS.NOTES_LIST),
    upsert: (input: { id?: number; title: string; body: string }): Promise<{ id: number }> =>
      ipcRenderer.invoke(CHANNELS.NOTES_UPSERT, input),
  },
};

contextBridge.exposeInMainWorld('api', api);

export type Api = typeof api;

declare global {
  interface Window {
    api: Api;
  }
}
```

### 19. `src/shared/ipc-channels.ts`

```ts
export const CHANNELS = {
  NOTES_LIST: 'notes:list',
  NOTES_UPSERT: 'notes:upsert',
} as const;
```

### 20. `src/shared/types.ts`

```ts
export type Note = {
  id: number;
  title: string;
  body: string;
  createdAt: string;
  updatedAt: string;
};
```

### 21. `src/renderer/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:" />
    <title>My App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### 22. `src/renderer/main.tsx`

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

const root = document.getElementById('root');
if (!root) throw new Error('root missing');
createRoot(root).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 23. `src/renderer/App.tsx`

```tsx
import { useEffect, useState } from 'react';
import type { Note } from '@shared/types';

export function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  useEffect(() => { window.api.notes.list().then(setNotes); }, []);
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold">Notes ({notes.length})</h1>
      <ul>
        {notes.map((n) => (<li key={n.id}>{n.title}</li>))}
      </ul>
    </main>
  );
}
```

### 24. `src/renderer/styles/globals.css`

```css
@import "tailwindcss";
html, body, #root { height: 100%; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
```

### 25. `build/entitlements.mac.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.network.client</key><true/>
</dict>
</plist>
```

### 26. `.github/workflows/ci.yml`

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]
jobs:
  check:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec electron-builder install-app-deps
      - run: pnpm biome check .
      - run: pnpm tsc -b
      - run: pnpm test
      - run: pnpm exec playwright install --with-deps chromium
      - run: xvfb-run --auto-servernum pnpm test:e2e
```

### 27. `.github/workflows/release.yml`

```yaml
name: release
on:
  push:
    tags: ['v*.*.*']
jobs:
  build:
    strategy:
      fail-fast: false
      matrix:
        os: [macos-14, windows-2022, ubuntu-22.04]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: 24, cache: pnpm }
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec electron-builder install-app-deps
      - run: pnpm build
      - name: Package (mac)
        if: matrix.os == 'macos-14'
        env:
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          CSC_LINK: ${{ secrets.MAC_CERT_P12 }}
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm exec electron-builder --mac --publish always
      - name: Package (win)
        if: matrix.os == 'windows-2022'
        env:
          AZURE_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
          AZURE_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
          AZURE_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm exec electron-builder --win --publish always
      - name: Package (linux)
        if: matrix.os == 'ubuntu-22.04'
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: pnpm exec electron-builder --linux --publish always
```

### 28. `.gitignore`

```
node_modules
dist
out
release
coverage
.vite
.cache
.DS_Store
*.log
.env
.env.local
playwright-report
test-results
```

### 29. `.env.example`

```
# Dev only. Never ship secrets here. Use keytar in production.
SENTRY_DSN=
```

### 30. `LICENSE`

```
MIT License — see https://opensource.org/license/mit/
Copyright (c) 2026 My Company
```

### 31. `README.md`

```markdown
# My App

Electron desktop app. See `./rulebooks/electron-react.md` for the binding stack rules.

## Develop
- `pnpm install`
- `pnpm exec electron-builder install-app-deps`
- `pnpm dev`

## Verify
- `pnpm run check`
- `pnpm test:e2e`

## Release
Tag `v*.*.*` and push. CI builds + signs + publishes a draft GitHub release.
```

After committing all of the above, `pnpm install && pnpm exec electron-builder install-app-deps && pnpm dev` shows a window with "Notes (0)".

---

## 17. Idea → MVP Path

For a generic CRUD desktop app (replace "Note" with the user's domain noun).

| Phase | Goal | Files | Sessions | Exit |
|---|---|---|---|---|
| 1. Schema | One entity end-to-end | `src/main/db/schema.ts`, `drizzle/0000_init.sql`, `src/shared/types.ts` | 1 | `pnpm db:generate` clean |
| 2. Backbone | App shell, router, IPC channel constants, empty handler | `src/renderer/main.tsx`, `App.tsx`, `routes/`, `src/main/ipc/<entity>.ts`, `src/preload/index.ts`, `shared/ipc-channels.ts` | 1 | App boots, blank list visible |
| 3. Vertical slice | Create + read + delete one entity, with unit + E2E tests | All of phase 2 + form, store, tests | 2 | E2E creates a record and asserts the row appears |
| 4. Auth + multi-user | Optional: cloud sync via OAuth, device pairing | `src/main/auth.ts`, `keychain.ts`, `routes/settings.tsx` | 2 | Two devices see the same list after a sync |
| 5. Ship + monitor | CI matrix, signing, notarization, Sentry, auto-update | `.github/workflows/release.yml`, `electron-builder.yml`, `src/main/updater.ts`, Sentry init | 2 | Tag → 3 signed installers in a draft release |

---

## 18. Feature Recipes

Each recipe is a numbered set of files to add or edit.

### 18.1 Authentication (OAuth via system browser)

1. `src/main/keychain.ts`:
   ```ts
   import keytar from 'keytar';
   const SERVICE = 'my-app';
   export const setSecret = (k: string, v: string) => keytar.setPassword(SERVICE, k, v);
   export const getSecret = (k: string) => keytar.getPassword(SERVICE, k);
   export const deleteSecret = (k: string) => keytar.deletePassword(SERVICE, k);
   ```
2. `src/main/auth.ts`: register `app.setAsDefaultProtocolClient('myapp')`; on `app.on('open-url', ...)` (mac) and `app.on('second-instance', ...)` (win/linux), parse the `code` query param, exchange for tokens, save via `keytar`.
3. `src/main/ipc/auth.ts`: expose `signIn`, `signOut`, `getStatus`.
4. `src/preload/index.ts`: add `auth` namespace.
5. `src/renderer/routes/settings.tsx`: button calls `window.api.auth.signIn()` which calls `shell.openExternal(...)`.

### 18.2 File upload + storage

1. `src/main/ipc/files.ts`: handler accepts `{ buffer: ArrayBuffer, filename: string }`; writes to `path.join(app.getPath('userData'), 'files', sha256(buffer) + ext)`.
2. Schema: `files` table with `id`, `path`, `mime`, `bytes`, `sha256`.
3. Renderer: `<input type="file" />` reads via `FileReader`, sends `ArrayBuffer` over IPC.

### 18.3 Stripe payments

Desktop apps cannot accept App Store IAP. Stripe via web checkout:

1. `src/main/payments.ts`: opens `shell.openExternal('https://checkout.stripe.com/...')` with a custom return URL `myapp://payment-callback`.
2. Webhook on your server marks the user as paid; client checks status on app boot via `window.api.payments.status()`.

### 18.4 Push notifications

Native OS notifications only:

1. `src/main/notify.ts`: `new Notification({ title, body }).show()` from main.
2. `src/preload/index.ts`: expose `notify({title, body})` over IPC.
3. macOS: include `NSUserNotificationsUsageDescription` only if needed; standard `Notification` requires no entitlement.

### 18.5 Background jobs

1. `src/main/jobs/index.ts`: a single `setInterval` registry; jobs are functions registered by feature modules.
2. Use `node-cron` if you need cron expressions (`pnpm add node-cron`).
3. Persist last-run timestamp in SQLite to avoid duplicate runs after restart.

### 18.6 Realtime updates

For UI updates from main → renderer:

1. `src/main/events.ts`: an EventEmitter; modules emit `notes:changed`.
2. `src/preload/index.ts`: expose `subscribe(channel, cb)` that wraps `ipcRenderer.on`. Validate `channel` against an allowlist.
3. Renderer: hook `useEffect(() => { const off = window.api.subscribe('notes:changed', refresh); return off; }, []);`.

For server push: use a websocket from main only; never expose ws to renderer directly.

### 18.7 Search

1. SQLite FTS5: in `schema.ts` create a virtual table `notes_fts USING fts5(title, body, content='notes', content_rowid='id')`.
2. Triggers in the migration to keep `notes_fts` in sync on insert/update/delete.
3. `src/main/ipc/notes.ts`: `notes:search` handler runs `MATCH ?` against `notes_fts`.

### 18.8 Internationalization

1. `pnpm add i18next react-i18next`.
2. `src/renderer/i18n.ts`: init with resources from `src/renderer/locales/<lang>.json`.
3. App language follows `app.getLocale()`; expose `app.getLocale()` over IPC at boot.

### 18.9 Dark mode

1. `src/main/index.ts`: `nativeTheme.themeSource = 'system'`.
2. `src/preload/index.ts`: expose `getTheme()` and subscribe to `nativeTheme.on('updated', ...)`.
3. Tailwind: `@media (prefers-color-scheme: dark)` is honored automatically by Chromium.

### 18.10 Analytics events

1. `src/main/analytics.ts`: a thin wrapper that buffers events and POSTs to your analytics endpoint with `app.getVersion()` and `process.platform`.
2. Honor a "Do not track" toggle persisted in SQLite.
3. Never send PII. Hash anything user-specific.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Module did not self-register` | `pnpm exec electron-builder install-app-deps` |
| `NODE_MODULE_VERSION X expected, got Y` | Same as above |
| `gyp ERR! find Python` (Windows) | `winget install Python.Python.3.12` |
| `gyp ERR! stack Error: not found: make` (Linux) | `sudo apt install -y build-essential` |
| `xcrun: error: invalid active developer path` (mac) | `xcode-select --install` |
| `Cannot find module 'electron'` from renderer | Move that import to preload; expose via contextBridge |
| `__dirname is not defined` | ESM main: `const __dirname = path.dirname(fileURLToPath(import.meta.url));` |
| `require is not defined` (renderer) | You set `nodeIntegration: true` somewhere; remove it |
| White window on prod, dev works | You loaded `localhost:5173` in prod. Switch to `loadFile` when `app.isPackaged`. |
| `SQLITE_BUSY` | Add `app.on('before-quit', () => db.close())` and `pragma journal_mode = WAL` |
| `SQLITE_CANTOPEN: unable to open database file` | The `userData` dir does not exist; `fs.mkdirSync(userData, { recursive: true })` before opening |
| Drizzle migration error `no such column` | You edited a migration after it ran. Generate a new migration; never edit applied SQL. |
| `electron-builder` exits with `signtool failed` (win) | Verify Azure Trusted Signing env vars; re-auth `az login` |
| Notarization stuck `In Progress` | Wait or re-submit; check https://developer.apple.com/system-status/ |
| `notarytool: 401 unauthorized` | Regenerate app-specific password at https://appleid.apple.com/ |
| Auto-update `latest.yml not found` | First release missing; publish at least one release before testing updates |
| `electron-updater Cannot read properties of null` | `app.isPackaged` is false; gate updater calls |
| `Error: spawn ENOENT` (linux build) | `sudo apt install -y libxz-utils libgtk-3-0` |
| Renderer console: `Refused to load the script ...` | CSP too strict for current resource; add to `script-src` after auditing |
| Mac shows "App is damaged, can't be opened" | App is unsigned. Sign + notarize before distributing. |
| Windows SmartScreen blocks installer | Sign with Azure Trusted Signing or wait for EV cert reputation |
| `pnpm: command not found` | `corepack enable && corepack prepare pnpm@10.33.0 --activate` |
| `EBADENGINE` warning at install | Bump host Node to 24.15+ |
| `playwright install` fails behind proxy | Set `HTTPS_PROXY` env var before `pnpm exec playwright install` |
| E2E hangs in CI on Linux | Use `xvfb-run --auto-servernum pnpm test:e2e` |
| `EACCES` writing to install dir | Move all writes to `app.getPath('userData')` |
| Tray icon missing on Ubuntu | Install `gnome-shell-extension-appindicator`; document in README |
| Devtools shortcut does nothing | `setMenu(null)` ate the accelerator; add an explicit dev shortcut in `menu.ts` |
| `electron-vite` "no entry input" | Ensure `electron.vite.config.ts` paths match your `src/` layout |
| Sentry not reporting | Confirm `SENTRY_DSN` set + `Sentry.init` is the FIRST line of `src/main/index.ts` |
| `FATAL: NEW_PROCESS_ABORT` (mac, after notarize) | Hardened runtime missing entitlement; add `com.apple.security.cs.allow-jit` |

---

## 20. Glossary

| Term | Plain-English meaning |
|---|---|
| Electron | A toolkit that lets you write desktop apps using web technology (HTML, CSS, JavaScript) by bundling them with a private copy of Chrome and Node.js. |
| Main process | The Node.js program that starts when your app launches. It owns the database, OS dialogs, and creates windows. |
| Renderer process | The web page inside each window. It runs in a sandboxed Chrome tab and cannot read files or talk to the OS directly. |
| Preload script | A tiny program that runs before the renderer's web page loads. It is the only place allowed to expose specific main-process functions to the renderer. |
| `contextBridge` | The official, safe channel for the preload script to hand specific functions to the renderer. |
| IPC (Inter-Process Communication) | Messages between main and renderer. Renderer asks main to do something; main answers. |
| Sandbox | A locked-down mode for the renderer that prevents it from doing dangerous things even if a webpage tricks it. |
| Context isolation | A feature that keeps the preload's variables separate from the webpage's variables, so the page cannot reach into the preload. |
| `BrowserWindow` | An Electron API that opens a native OS window with a webpage inside. |
| asar | A single archive file that bundles your app's code. Speeds up loading and slightly hides source from casual viewers (not encryption). |
| SQLite | A small database stored as a single file on the user's disk. |
| better-sqlite3 | A fast, synchronous Node binding for SQLite. The fastest way to read/write SQLite from Node. |
| Drizzle | A TypeScript library that lets you describe database tables in code and generate SQL migrations from them. |
| Migration | A SQL file that changes the database from one version to the next. Run once on each user's machine. |
| Vite | A fast development server and bundler. electron-vite is the Electron-specific wrapper. |
| HMR (Hot Module Replacement) | When you save a file, the browser updates without losing state. |
| Sandbox escape | A bug where renderer code breaks out of its restrictions and runs as the main process. Treated as critical. |
| Hardened runtime | A macOS feature that locks down what an app can do at runtime. Required for notarization. |
| Notarization | Apple's automated malware scan. Required for users to open your app on macOS without warnings. |
| Code signing | Cryptographically tagging your app so the OS knows it came from you. Required on macOS, strongly recommended on Windows. |
| EV certificate | An "extended validation" code-signing certificate. Required by Microsoft for new apps to avoid SmartScreen warnings. |
| Azure Trusted Signing | Microsoft's cloud service that signs your Windows apps without you owning the cert directly. |
| AppImage | A single-file executable for Linux that runs without installation. |
| NSIS | The installer format for Windows that electron-builder uses. |
| DMG | macOS's disk-image installer. |
| Squirrel | The auto-update protocol on macOS and Windows that electron-updater speaks. |
| `userData` | Per-user folder where your app stores its database and logs. |
| Zod | A library that validates the shape of JavaScript values at runtime. |
| Zustand | A tiny library for sharing React state across components without prop-drilling. |
| Biome | A fast linter + formatter, replaces ESLint + Prettier. |
| Vitest | A test runner. |
| Playwright | A browser automation library; in this stack, used to drive the packaged Electron app for end-to-end tests. |
| Sentry | A service that collects and groups errors from your shipped app. |
| keytar | A Node library that reads and writes secrets in the OS keychain. |
| CSP (Content Security Policy) | A header that tells the browser which scripts and styles are allowed to load, mitigating XSS. |
| RCE (Remote Code Execution) | A vulnerability where an attacker runs arbitrary code on the user's machine. The most severe class. |
| XSS (Cross-Site Scripting) | A vulnerability where attacker-controlled content runs as a script in the renderer. |
| SemVer | Version numbers as MAJOR.MINOR.PATCH. Major bumps may break things. |

---

## 21. Update Cadence

This rulebook is valid for **Electron 38–40, electron-vite 5–6, electron-builder 26.x, electron-updater 6.x, React 19.x, TypeScript 5.9.x**.

Re-run the rulebook generator when:

- Electron major bump (Chromium upgrade implies new web platform features and possible CSP changes).
- electron-builder major bump (signing flow churn, especially on Windows).
- New CVE in `contextBridge`, `nodeIntegration`, or any other security primitive used here.
- macOS or Windows changes their signing/notarization requirements (e.g. cert validity changes, new entitlements).
- React major bump or TypeScript major bump.

Last updated: **2026-04-27**.
