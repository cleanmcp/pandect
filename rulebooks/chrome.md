# Chrome Extension MV3 + TypeScript + WXT — RULEBOOK

Browser extension for Chrome and Edge, side-panel-first, built with WXT (Vite under the hood), shipped to Chrome Web Store and Microsoft Edge Add-ons.

> Generated 2026-04-27. Valid for WXT 0.20.x, Vite 7.x, Chrome 130+. Re-run the generator on a major WXT or Manifest version bump.

---

## 1. Snapshot

### Decisions

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.9.x | Type safety; TS 6.0 too new for ecosystem |
| Runtime + version | Node.js 24 LTS | Active LTS; required by pnpm 10 and WXT |
| Package manager | pnpm 10.33.x | Disk-efficient; WXT docs default |
| Build tool | WXT 0.20.x | Market leader 2026; Vite-based; multi-browser; smallest bundles |
| UI library | React 19.2.x | Largest extension UI ecosystem; React 19 stable |
| State mgmt | Zustand 5.x + chrome.storage.local | Survives SW restart via storage; Zustand for in-page state |
| UI surface default | Side panel | More surface than popup; persists across tab nav |
| Storage | chrome.storage.local | 10 MB quota; survives SW death; not synced |
| Routing/Nav | wouter 3.x | 1.5 KB; sufficient for extension UI |
| Content script injection | Declarative in `wxt.config.ts` `content_scripts` | Predictable; matches manifest; no permission warning surprises |
| Message passing | `chrome.runtime.sendMessage` promise form + typed channels | Native API; no library; runtime.lastError-safe |
| Permissions strategy | `activeTab` + minimal `host_permissions` | Avoids review delays from broad permissions |
| Network blocking | `declarativeNetRequest` (static rules JSON) | MV3 mandate; no host_permissions for block/upgrade |
| Auth | Google Identity via `chrome.identity.launchWebAuthFlow` | Native; no third-party SDK; works in SW |
| Styling | Tailwind CSS 4.x | Atomic; ships ~5 KB; CSS-in-JS forbidden by CSP |
| Forms + validation | react-hook-form 7.x + zod 3.x | Standard; small; works under MV3 CSP |
| Unit test runner | Vitest 4.1.x | Same Vite config as build; jsdom env |
| E2E framework | Playwright 1.59.x with `launchPersistentContext` | Only viable option for MV3 extension testing |
| Lint check | `web-ext lint` 10.1.x | Mozilla's addons-linter; catches MV3 schema errors |
| Mocking strategy | `vitest-chrome` for chrome.* APIs; never mock storage at integration layer | Storage is a real boundary in MV3 |
| Logger | `loglevel` 1.9.x + JSON in prod | No `pino` (needs Node fs); loglevel works in SW + content + UI |
| Error tracking | Sentry browser SDK 8.x with `transport: makeBrowserOfflineTransport` | Survives SW restart; offline queue |
| Lint + format | Biome 2.3.x | 10-100x faster; one binary; no ESLint/Prettier dance |
| Type checking | `tsc --noEmit` + `wxt prepare` | WXT generates `.wxt/wxt.d.ts` for routes |
| Env vars + secrets | `.env.local` (WXT auto-loads); CWS keys in CI secrets | Never inline; never bundled |
| CI provider | GitHub Actions | Free for public; matrix for chrome+edge zips |
| Deploy target | Chrome Web Store + Microsoft Edge Add-ons | Both Chromium; Edge submission free |
| Release flow | `wxt zip` → `chrome-webstore-upload-cli upload --auto-publish` | Idempotent; zip artifact retained in CI |
| Auto-update | Store-driven (Chrome polls every ~5 hours) | No manual update server needed |

### Versions (verified 2026-04-27 via npm + official docs)

| Package | Version | Released | Link |
|---|---|---|---|
| `wxt` | 0.20.25 | 2026-04-24 | https://www.npmjs.com/package/wxt |
| `vite` | 7.x (WXT-pinned) | 2026 | https://vite.dev/releases |
| `typescript` | 5.9.3 | 2026-Q1 | https://www.npmjs.com/package/typescript |
| `react` / `react-dom` | 19.2.5 | 2026-04-08 | https://www.npmjs.com/package/react |
| `@types/react` / `@types/react-dom` | ^19.0.0 | — | DefinitelyTyped |
| `chrome-types` | 0.1.425 | 2026-03 | https://www.npmjs.com/package/chrome-types |
| `vitest` | 4.1.4 | 2026-04-16 | https://www.npmjs.com/package/vitest |
| `@playwright/test` | 1.59.1 | 2026-03 | https://www.npmjs.com/package/@playwright/test |
| `@biomejs/biome` | 2.3.x | 2026-Q1 | https://biomejs.dev/ |
| `web-ext` | 10.1.0 | 2026-Q1 | https://www.npmjs.com/package/web-ext |
| `chrome-webstore-upload-cli` | 3.x | 2026 | https://www.npmjs.com/package/chrome-webstore-upload-cli |
| `tailwindcss` | 4.x | 2026 | https://tailwindcss.com |
| `zustand` | 5.x | 2026 | https://www.npmjs.com/package/zustand |
| `wouter` | 3.x | 2026 | https://www.npmjs.com/package/wouter |
| `react-hook-form` | 7.x | 2026 | https://www.npmjs.com/package/react-hook-form |
| `zod` | 3.x | 2026 | https://www.npmjs.com/package/zod |
| `loglevel` | 1.9.x | 2026 | https://www.npmjs.com/package/loglevel |
| `@sentry/browser` | 8.x | 2026 | https://www.npmjs.com/package/@sentry/browser |
| `pnpm` | 10.33.0 | 2026-04 | https://pnpm.io |
| `node` | 24 LTS | LTS since 2025-10 | https://nodejs.org |

### Minimum host requirements

- **macOS** 13 Ventura+, 8 GB RAM, 10 GB free disk.
- **Windows** 10 22H2+ or 11, 8 GB RAM, 10 GB free disk, PowerShell 5.1+.
- **Linux** glibc 2.31+ (Ubuntu 22.04+, Fedora 38+, Debian 12+), 8 GB RAM, 10 GB free disk.
- Google Chrome 130+ installed (for dev + Playwright tests).
- Microsoft Edge 130+ installed (optional; for Edge testing).

### Cold-start estimate

`git clone` to running side panel reload-on-save, on a fresh laptop with Node already installed: **~6 minutes**. From zero (no Node, no Chrome): **~25 minutes**.

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew (skip if already installed).
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 24, pnpm, gh, Chrome.
brew install node@24
brew install pnpm
brew install gh
brew install --cask google-chrome
brew install --cask microsoft-edge   # optional, for Edge testing

# 3. Verify versions.
node --version    # expect v24.x.x
pnpm --version    # expect 10.33.x or newer

# 4. Auth GitHub CLI (used for the release workflow).
gh auth login

# 5. Bootstrap the project.
pnpm dlx wxt@latest init my-extension
cd my-extension
# pick: react, typescript, pnpm

# 6. Run dev mode.
pnpm install
pnpm dev          # auto-launches Chrome with the extension loaded
```

### Windows (PowerShell, run as Admin for first install)

```powershell
# 1. Install winget if missing (built into Windows 11). Verify:
winget --version

# 2. Install Node 24, pnpm, gh, Chrome.
winget install OpenJS.NodeJS.LTS --version 24
winget install pnpm.pnpm
winget install GitHub.cli
winget install Google.Chrome
winget install Microsoft.Edge   # usually pre-installed on Windows

# 3. Restart shell so PATH refreshes. Verify:
node --version
pnpm --version

# 4. Auth GitHub CLI.
gh auth login

# 5. Bootstrap.
pnpm dlx wxt@latest init my-extension
cd my-extension
pnpm install
pnpm dev
```

### Linux (Ubuntu/Debian)

```bash
# 1. Install Node 24 via NodeSource.
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs

# 2. Install pnpm.
curl -fsSL https://get.pnpm.io/install.sh | sh -
source ~/.bashrc

# 3. Install gh and Chrome.
sudo apt-get install -y gh
wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | sudo gpg --dearmor -o /usr/share/keyrings/google.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google.gpg] http://dl.google.com/linux/chrome/deb/ stable main" | sudo tee /etc/apt/sources.list.d/google-chrome.list
sudo apt-get update && sudo apt-get install -y google-chrome-stable

# 4. Verify.
node --version
pnpm --version
google-chrome --version

# 5. Auth GitHub CLI.
gh auth login

# 6. Bootstrap.
pnpm dlx wxt@latest init my-extension
cd my-extension
pnpm install
pnpm dev
```

### Required accounts (create before first publish)

- **Chrome Web Store developer account** — https://chrome.google.com/webstore/devconsole — one-time $5 USD fee. Required for upload.
- **Microsoft Partner Center (Edge program)** — https://partner.microsoft.com/dashboard/microsoftedge — free registration. Required for Edge submission.
- **Google Cloud OAuth client** — https://console.cloud.google.com — needed for `chrome-webstore-upload-cli` (clientId, clientSecret, refreshToken). Follow https://github.com/fregante/chrome-webstore-upload/blob/main/How%20to%20generate%20Google%20API%20keys.md.
- **Sentry account** (optional, for error tracking) — https://sentry.io — free tier sufficient.

### Expected first-run output (`pnpm dev`)

```
WXT 0.20.25
✔ Built extension in 0.84s
  ┌─ .output/chrome-mv3
  │  manifest.json (1.2 kB)
  │  background.js (3.1 kB)
  │  content-scripts/content.js (1.4 kB)
  │  sidepanel.html (0.6 kB)
  │  assets/sidepanel-Bv2pNQ.js (142 kB)
  └──

  → Loaded into Chrome at http://localhost:3000
  → Press 'r' to reload, 'q' to quit
```

If Chrome doesn't auto-launch, open `chrome://extensions`, enable Developer mode, click "Load unpacked", and select `.output/chrome-mv3`.

### Common first-run errors → exact fix

| Error | Fix |
|---|---|
| `Error: Cannot find module 'wxt'` | `pnpm install` |
| `Manifest version 3 is required` (Chrome 88+) | Already MV3; check `wxt.config.ts` `manifest.manifest_version` — never override |
| `Service worker registration failed: Status code: 15` | A `chrome.*` API is being called at module top-level; move into a listener |
| `Refused to load the script ... Content Security Policy` | Inline script in HTML; move to `.ts` file imported via `<script src>` |
| `Could not establish connection. Receiving end does not exist` | Content script not loaded on the tab; check `matches` in `content_scripts` |
| `chrome is not defined` (in tests) | Add `vitest-chrome` mock in `test/setup.ts` |
| Playwright `extension service worker not found` | Test must use `launchPersistentContext` and `--load-extension`; never `chromium.launch()` |
| `pnpm: command not found` after install | Restart shell or `source ~/.bashrc` |
| WXT dev server stuck "Building..." | Delete `.wxt/` and `.output/`, then `pnpm dev` again |

---

## 3. Project Layout

```
my-extension/
├── .github/
│   └── workflows/
│       ├── ci.yml              # typecheck, lint, unit, e2e
│       └── release.yml         # zip + upload to CWS + Edge
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules                   # mirrors AI rules (sec 8)
├── .claude/
│   └── settings.json           # hooks + allowlist
├── .wxt/                       # generated; gitignored
├── .output/                    # build output; gitignored
├── assets/                     # source images, processed at build (favicons, etc.)
├── public/                     # static assets copied as-is into the extension
│   └── icons/
│       ├── icon-16.png
│       ├── icon-48.png
│       └── icon-128.png
├── entrypoints/                # WXT convention: each file becomes a manifest entry
│   ├── background.ts           # service worker
│   ├── content.ts              # content script (declarative match in defineContentScript)
│   ├── popup/
│   │   ├── index.html
│   │   ├── main.tsx
│   │   └── App.tsx
│   └── sidepanel/
│       ├── index.html
│       ├── main.tsx
│       └── App.tsx
├── src/
│   ├── lib/                    # shared, framework-free TS
│   │   ├── messaging.ts        # typed sendMessage wrapper
│   │   ├── storage.ts          # typed chrome.storage.local wrapper
│   │   ├── log.ts              # loglevel setup
│   │   └── env.ts              # import.meta.env access
│   ├── components/             # React components shared across UI surfaces
│   ├── hooks/                  # React hooks
│   ├── stores/                 # Zustand stores (UI state only; storage = source of truth)
│   ├── styles/
│   │   └── globals.css         # Tailwind imports
│   └── types/
│       └── messages.ts         # union type of all message shapes
├── rules/
│   └── dnr-rules.json          # declarativeNetRequest static rules
├── test/
│   ├── setup.ts                # vitest-chrome mock
│   ├── unit/                   # *.test.ts
│   └── e2e/
│       ├── fixtures.ts         # Playwright fixture loading the extension
│       └── *.spec.ts
├── .env.example
├── .env.local                  # gitignored
├── .gitignore
├── biome.json
├── CLAUDE.md
├── AGENTS.md
├── LICENSE
├── package.json
├── playwright.config.ts
├── pnpm-lock.yaml
├── README.md
├── tsconfig.json
├── vitest.config.ts
└── wxt.config.ts               # the central config — manifest, build options, browsers
```

### Naming conventions

- Files: `kebab-case.ts` for libs, `PascalCase.tsx` for React components.
- Entrypoints: WXT-reserved names — `background.ts`, `content.ts`, `popup/`, `sidepanel/`, `options/`, `newtab/`, `devtools/`.
- Tests: `<unit>.test.ts` next to source OR under `test/unit/`. E2E: `test/e2e/<feature>.spec.ts`.
- Hooks: `useThing.ts`, exporting `function useThing()`.
- Zustand stores: `useThingStore.ts`, exporting `useThingStore`.
- Message types: `<Verb><Noun>Message` (e.g., `GetSettingsMessage`).
- Storage keys: `SCREAMING_SNAKE_CASE` constants in `src/lib/storage.ts`.

### "If you're adding X, it goes in Y" decision table

| Adding | Goes in | Notes |
|---|---|---|
| New side-panel screen | `entrypoints/sidepanel/` + route in `App.tsx` | Use wouter |
| New popup action | `entrypoints/popup/App.tsx` | Keep popup tiny; prefer side panel |
| Service-worker event handler | `entrypoints/background.ts` | Register at top level so SW wakes |
| Content script for a new site | `entrypoints/content.ts` matches array, OR new entrypoint `entrypoints/<name>.content.ts` | New file = separate bundle |
| Network-blocking rule | `rules/dnr-rules.json` + manifest declarative_net_request entry | Static rules |
| Shared util (no React) | `src/lib/<name>.ts` | Must work in SW (no `window`) |
| React component | `src/components/<Name>.tsx` | Must work without DOM globals if used in content script |
| Zustand store | `src/stores/use<Name>Store.ts` | Persist via `persist` middleware → chrome.storage.local |
| New icon size | `public/icons/icon-<size>.png` | Add to `manifest.icons` in wxt.config |
| Extension permission | `wxt.config.ts` `manifest.permissions` | Re-read review-impact in section 11 first |
| Host permission | `wxt.config.ts` `manifest.host_permissions` | Triggers re-review; minimize |
| Web-accessible resource | `wxt.config.ts` `manifest.web_accessible_resources` | Required for resources injected into pages |
| Localized string | `public/_locales/<lang>/messages.json` | Reference via `chrome.i18n.getMessage` |
| New message type | `src/types/messages.ts` (union) + handler in `entrypoints/background.ts` | Type-narrow in handler |
| Sentry breadcrumb | Wherever — call `Sentry.addBreadcrumb()` | SDK initialized in each entrypoint |
| Env var | `.env.local` (`VITE_` prefix or `WXT_` prefix) | Never inside `manifest` literal — leaks into store listing |
| New unit test | `<file>.test.ts` next to source | Use `describe`/`it` |
| New E2E test | `test/e2e/<feature>.spec.ts` | Use the `loadExtension` fixture |

---

## 4. Architecture

### Process boundaries

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser                                     │
│                                                                     │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────────┐    │
│  │  Web page    │   │  Web page    │   │  Web page            │    │
│  │  (isolated)  │   │  (isolated)  │   │  (isolated)          │    │
│  │ ┌──────────┐ │   │ ┌──────────┐ │   │ ┌──────────────────┐ │    │
│  │ │ Content  │ │   │ │ Content  │ │   │ │ Content Script   │ │    │
│  │ │ Script   │ │   │ │ Script   │ │   │ │ (isolated world) │ │    │
│  │ └────┬─────┘ │   │ └────┬─────┘ │   │ └────┬─────────────┘ │    │
│  └──────┼───────┘   └──────┼───────┘   └──────┼───────────────┘    │
│         │ chrome.runtime.sendMessage           │                    │
│         └──────────────────┬───────────────────┘                    │
│                            ▼                                        │
│            ┌─────────────────────────────────┐                      │
│            │  Background Service Worker      │  (terminates ~30s)   │
│            │  entrypoints/background.ts      │                      │
│            │  no DOM, no window, no globals  │                      │
│            └─────────┬───────────────────────┘                      │
│                      │                                              │
│   ┌──────────────────┼──────────────────────┐                       │
│   ▼                  ▼                      ▼                       │
│ chrome.storage  chrome.tabs.*      chrome.declarativeNetRequest     │
│   .local                                                            │
│                                                                     │
│  ┌──────────────────────────┐  ┌──────────────────────────┐         │
│  │ Side Panel               │  │ Popup                    │         │
│  │ entrypoints/sidepanel    │  │ entrypoints/popup        │         │
│  │ React, full DOM          │  │ React, closes on blur    │         │
│  └──────────────────────────┘  └──────────────────────────┘         │
└─────────────────────────────────────────────────────────────────────┘
```

### Data flow for a typical user action

```
User clicks "Save" in side panel
   │
   ▼
React handler (sidepanel/App.tsx)
   │
   ▼
sendMessage({ type: "SAVE_ITEM", payload }) ── promise ──┐
                                                          │
                                                          ▼
                                Background SW handler (entrypoints/background.ts)
                                                          │
                                                          ▼
                                       validate (zod) → storage.set
                                                          │
                                                          ▼
                                       chrome.storage.onChanged fires
                                                          │
   ┌──────────────────────────────────────────────────────┘
   ▼
React subscribes via useStorage hook → state updates → re-render
```

### Auth flow (Google OAuth via chrome.identity)

```
User clicks "Sign in" in side panel
   │
   ▼
sendMessage({ type: "SIGN_IN" })
   │
   ▼
Background SW: chrome.identity.launchWebAuthFlow({
   url: "https://accounts.google.com/o/oauth2/auth?..." ,
   interactive: true
})
   │
   ▼
Chrome opens identity popup → user consents → redirect URL captured
   │
   ▼
Background SW exchanges code for tokens → storage.set("auth", { accessToken, refreshToken, expiresAt })
   │
   ▼
sendResponse({ ok: true })
   │
   ▼
Side panel hydrates user; subsequent messages auto-attach Authorization header in background fetch wrapper
```

### State management flow

```
Source of truth: chrome.storage.local
         │
         ▼
   ┌─────────────┐
   │ src/stores  │ Zustand store with persist({ storage: chromeStorageAdapter })
   │ (UI cache)  │
   └─────────────┘
         │
         ▼
React components — never read storage directly; always go via store hook
         │
         ▼
On mount, store rehydrates from storage; on storage.onChanged, store reconciles
```

### Entry-point file map

| File | Responsibility |
|---|---|
| `entrypoints/background.ts` | Service worker. Registers `onMessage`, `onInstalled`, `onAlarm`. No globals. |
| `entrypoints/content.ts` | Runs in page world (isolated). DOM access. Posts messages to SW. |
| `entrypoints/sidepanel/main.tsx` | React mount for side panel. |
| `entrypoints/popup/main.tsx` | React mount for popup. |
| `src/lib/messaging.ts` | Typed `sendMessage` + `onMessage` wrappers; handles `runtime.lastError`. |
| `src/lib/storage.ts` | Typed `get`/`set` over `chrome.storage.local`. |
| `wxt.config.ts` | Manifest source of truth — permissions, host_permissions, side_panel, content_scripts. |

### Where business logic lives

- **Lives in:** `src/lib/` (pure TS) and `entrypoints/background.ts` (orchestration). Service worker is the one place that owns state mutations.
- **Does NOT live in:** React components (UI only), content scripts (DOM bridge only — forward to SW), popup (UI only).

---

## 5. Dev Workflow

### Start dev

```bash
pnpm dev          # Chrome auto-launches with extension loaded; HMR for UI; SW restarts on save
pnpm dev:edge     # alias: WXT_BROWSER=edge wxt dev -b edge
pnpm dev:firefox  # WXT_BROWSER=firefox wxt dev -b firefox
```

What each watcher does:
- WXT watches `entrypoints/` and `src/`. UI surfaces (sidepanel, popup) get React Refresh HMR.
- The service worker is fully rebuilt and re-registered on save (no HMR — Chrome lacks SW HMR).
- Content scripts: rebuilt and the host page must be reloaded by the user (WXT prints a reminder).

### Hot reload behavior + when it breaks

| Surface | HMR | Breaks when |
|---|---|---|
| Side panel React | yes | You edit `wxt.config.ts` (full reload required) |
| Popup React | yes | You edit `manifest` keys |
| Content script | no | Always — refresh the host page after save |
| Service worker | no (auto re-register) | After many edits Chrome shows "stale SW"; manually click reload at `chrome://extensions` |
| Permissions change | no | Always full reload + may require uninstall/install in dev |

### Attach a debugger

- **VS Code / Cursor** — open `chrome://inspect` → "Service workers" → click "inspect" next to your extension. The launch.json (sec 15) auto-wires this.
- **Side panel React** — right-click in the side panel → Inspect. React DevTools work normally.
- **Content script** — open page DevTools → Sources → "Content scripts" tab → your file under your extension ID.
- **Background SW** — `chrome://extensions` → your extension → "Inspect views: service worker".

### Inspect runtime state

- `chrome://extensions` → service worker → DevTools console: `chrome.storage.local.get(null).then(console.log)`.
- Network: only background SW requests appear in its DevTools; content script requests appear in the page DevTools.
- Storage: in any DevTools attached to the extension, run `chrome.storage.local.get()`.

### Pre-commit

`.husky/pre-commit` runs:
```bash
pnpm typecheck && pnpm lint && pnpm test:unit -- --run
```

### Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits — `feat(sidepanel): add saved items list`, `fix(bg): handle storage rejection`.
- One feature per PR. Squash on merge. Tag releases as `v0.1.0`.

---

## 6. Testing & Parallelization

### Unit (`pnpm test:unit`)

- Vitest 4.1.x with `jsdom` environment for UI; `node` for `src/lib/*`.
- Tests live next to source (`storage.test.ts`) or under `test/unit/`.
- `chrome.*` is mocked via `vitest-chrome` in `test/setup.ts`.

```bash
pnpm test:unit                          # run all
pnpm test:unit src/lib/storage.test.ts  # single file
pnpm test:unit -t "rehydrates"          # by test name
pnpm test:unit -- --watch               # watch mode
```

### Integration

Integration tests run in jsdom with a richer `chrome.*` mock that backs storage by an in-memory `Map`. Located in `test/integration/`. Same runner.

### E2E (`pnpm test:e2e`)

Playwright with `launchPersistentContext` — required because MV3 extensions cannot load in headless Chromium. Runs **headed** in CI on a virtual display (xvfb).

```ts
// playwright.config.ts (excerpt)
export default defineConfig({
  testDir: './test/e2e',
  fullyParallel: false,           // extension fixture serializes
  workers: 1,                     // one persistent context per worker
  retries: 2,
  reporter: [['html'], ['github']],
  use: {
    baseURL: 'https://example.com',
    trace: 'retain-on-failure',
  },
});
```

```bash
pnpm test:e2e                                     # all
pnpm test:e2e test/e2e/sidepanel.spec.ts          # single file
pnpm test:e2e -g "saves item"                     # by test title
pnpm test:e2e --ui                                # debug UI
```

### Mocking rules

| Layer | Mock? | How |
|---|---|---|
| `chrome.runtime` / `chrome.tabs` events | yes | `vitest-chrome` |
| `chrome.storage.local` (unit) | yes | `vitest-chrome` in-memory |
| `chrome.storage.local` (integration) | no | Use a real adapter in jsdom |
| `chrome.storage.local` (E2E) | never | Real Chrome via Playwright |
| `fetch` to your backend | yes (unit) | `vi.spyOn(globalThis, 'fetch')` |
| `chrome.identity` | yes (unit/integration); never (E2E) | E2E uses a real test Google account or a recorded HAR |

### Coverage

- Vitest v8 coverage: `pnpm test:unit -- --coverage`.
- Target: 70% lines for `src/lib/`. UI components covered by E2E, not unit.

### Visual regression

Playwright's `toHaveScreenshot()` for the side panel rendered against a fixed page. Stored under `test/e2e/__screenshots__/`. Update with `pnpm test:e2e --update-snapshots`.

### Parallelization patterns for AI agents

- **Safe parallel** — scaffold a new React component + add its Zustand store + write its unit test (three disjoint files).
- **Safe parallel** — add new declarativeNetRequest rules in `rules/dnr-rules.json` + add a new content-script entrypoint (different files, different surfaces).
- **Sequential only** — anything modifying `wxt.config.ts`, `package.json`, `pnpm-lock.yaml`, `tsconfig.json`, or `manifest.permissions`. Lockfile and manifest are global mutex.
- **Sequential only** — adding a new permission (must update manifest, then update CLAUDE.md banlist if a sensitive perm).

---

## 7. Logging

### Logger setup (`src/lib/log.ts`)

```ts
import log from 'loglevel';

const isProd = import.meta.env.MODE === 'production';
log.setLevel(isProd ? 'info' : 'debug');

const original = log.methodFactory;
log.methodFactory = (methodName, level, loggerName) => {
  const raw = original(methodName, level, loggerName);
  return (...args: unknown[]) => {
    const line = {
      ts: new Date().toISOString(),
      level: methodName,
      module: loggerName ?? 'root',
      message: args[0],
      data: args.slice(1),
    };
    raw(isProd ? JSON.stringify(line) : line);
  };
};
log.rebuild();

export const logger = (mod: string) => log.getLogger(mod);
```

### Levels

| Level | When |
|---|---|
| `debug` | Verbose flow; off in prod |
| `info` | Lifecycle (SW install, user action) |
| `warn` | Recoverable error; user can retry |
| `error` | Bug; reported to Sentry |

### Required fields per log line

`ts`, `level`, `module`, `message`. Add `request_id` (random UUID) when crossing the SW/UI boundary; add `user_id` when authenticated.

### Sample lines

```
{"ts":"2026-04-27T10:01:22.430Z","level":"info","module":"background","message":"sw.boot","data":[{"version":"0.1.0"}]}
{"ts":"2026-04-27T10:01:23.011Z","level":"info","module":"messaging","message":"msg.in","data":[{"type":"SAVE_ITEM","request_id":"a1b2"}]}
{"ts":"2026-04-27T10:01:23.044Z","level":"info","module":"messaging","message":"msg.out","data":[{"type":"SAVE_ITEM","request_id":"a1b2","ms":33,"ok":true}]}
{"ts":"2026-04-27T10:01:24.110Z","level":"warn","module":"storage","message":"quota.near","data":[{"used":9_400_000,"max":10_000_000}]}
{"ts":"2026-04-27T10:01:25.221Z","level":"error","module":"background","message":"unhandled","data":[{"err":"TypeError: ..."}]}
```

### Where logs go

- **Dev** — Chrome DevTools console for whichever surface emits them. Pretty-printed.
- **Prod** — JSON to console; `Sentry.captureException` for `error` level. No file logging (browser sandbox).
- **Aggregation** — Sentry breadcrumbs auto-collected from `console.*` via `Sentry.consoleIntegration`.

### Grep locally

In SW DevTools console: `monitor(chrome.runtime.onMessage)` to live-trace messages. To filter logs across surfaces, attach Chrome DevTools Protocol via `chrome --remote-debugging-port=9222` and stream `Runtime.consoleAPICalled`.

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm typecheck && pnpm lint && pnpm test:unit -- --run` before declaring a task done.
2. Always send messages via `src/lib/messaging.ts` typed wrapper, never `chrome.runtime.sendMessage` directly.
3. Always read/write storage via `src/lib/storage.ts`, never `chrome.storage.local.*` directly.
4. Always register `chrome.*` listeners at the top level of `entrypoints/background.ts` so the SW wakes on the event.
5. Always check `runtime.lastError` after callback-style chrome APIs; for promise APIs, await inside `try/catch`.
6. Always type messages as a discriminated union in `src/types/messages.ts`.
7. Always validate inbound messages with zod in the SW before acting.
8. Always reload host pages after editing a content script (WXT does not refresh them).
9. Always declare the smallest set of `permissions`; prefer `activeTab` over broad `host_permissions`.
10. Always use static `declarativeNetRequest` rules in `rules/dnr-rules.json` for blocking; never `webRequestBlocking` (MV3 forbids it for non-policy extensions).
11. Always serve UI surfaces from local files only — no inline `<script>`, no `eval`, no remote `<script src>`.
12. Always declare `web_accessible_resources` for files content scripts inject into pages.
13. Always derive the extension ID at runtime in Playwright tests by reading the SW URL.
14. Always run `pnpm test:e2e` headed (with xvfb in CI); MV3 extensions don't load headless.
15. Always update the `versions table` in this rulebook when bumping a major dep.
16. Always commit `pnpm-lock.yaml`.
17. Always set `key` field in `wxt.config.ts` manifest in dev to keep a stable extension ID across reinstalls.
18. Always treat `chrome.storage` writes as the single source of truth and rehydrate UI from `onChanged`.
19. Always bump `manifest.version` in `wxt.config.ts` before zipping for upload.
20. Always run `pnpm web-ext:lint` against `.output/chrome-mv3` before submitting to a store.
21. Always tag the release commit as `vX.Y.Z` to trigger the GitHub Actions release workflow.
22. Always keep `entrypoints/background.ts` synchronous at top level — async work goes inside event handlers.

### 8.2 NEVER

1. Never assume `window`, `document`, `localStorage`, or `IndexedDB` exists in the service worker. Use `chrome.storage.*`.
2. Never store anything in module-level `let`/`const` and expect it to survive — the SW terminates after ~30 s idle.
3. Never call `eval`, `new Function`, or load remote `<script>` — MV3 CSP blocks all three with no opt-out.
4. Never use `webRequest` blocking listeners; use `declarativeNetRequest` instead.
5. Never request `<all_urls>` host permission unless the product literally requires every site; review delays + user fear are guaranteed.
6. Never bundle secrets into the extension. The CWS user can unzip and read every file.
7. Never write inline event handlers (`onclick="..."`) — CSP rejects them silently.
8. Never use `chrome.storage.sync` for >100 KB per item or >8 KB per quota (will throw `QUOTA_EXCEEDED`).
9. Never skip `wxt prepare` after editing `wxt.config.ts` — types in `.wxt/wxt.d.ts` will be stale.
10. Never call `sendResponse` after returning from an `onMessage` handler unless you returned `true` first.
11. Never trust messages without validating shape — content scripts can be reached by hostile pages via `chrome.runtime.sendMessage` from the same origin if you set `externally_connectable`.
12. Never set `externally_connectable: { matches: ["<all_urls>"] }`.
13. Never publish with `key` field still in `manifest` for production; remove or use `WXT_PUBLIC_KEY` env var.
14. Never use `pnpm publish` to publish — that's npm. Use the Chrome Web Store flow (sec 12).
15. Never check in `.env.local`, `.output/`, `.wxt/`, or `client_secret*.json`.
16. Never load a content script into a frame you don't control without `all_frames: false` and an explicit URL match.
17. Never enable `unsafe-eval` in `content_security_policy.extension_pages` — Chrome will reject the manifest.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | every command | `pnpm install && pnpm typecheck && pnpm test:unit -- --run` |
| `pnpm-lock.yaml` | reproducibility | `pnpm install --frozen-lockfile && pnpm typecheck` |
| `wxt.config.ts` | manifest, build, perms | `pnpm wxt prepare && pnpm typecheck && pnpm build && pnpm web-ext:lint` |
| `tsconfig.json` | typecheck, IDE | `pnpm typecheck` (full) |
| `biome.json` | lint+format | `pnpm lint && pnpm format --check` |
| `vitest.config.ts` | unit tests | `pnpm test:unit -- --run` |
| `playwright.config.ts` | E2E | `pnpm test:e2e` |
| `entrypoints/background.ts` | every feature | unit tests + E2E full + manual SW reload |
| `entrypoints/content.ts` | every page injection | E2E that visits a matched URL |
| `entrypoints/sidepanel/**` | side panel UI | E2E `sidepanel.spec.ts` |
| `entrypoints/popup/**` | popup UI | E2E `popup.spec.ts` |
| `src/lib/messaging.ts` | every message | unit tests + every E2E |
| `src/lib/storage.ts` | persistence | unit tests + integration test for migrations |
| `src/types/messages.ts` | typecheck across SW + UI | `pnpm typecheck` |
| `rules/dnr-rules.json` | network blocking | E2E that asserts blocked URL fails |
| `manifest.permissions` (in wxt.config) | review pipeline | reload extension; check chrome://extensions warning dialog |
| `manifest.host_permissions` | review pipeline | same; review may be delayed up to 7 days |
| `manifest.web_accessible_resources` | content script injection | E2E injecting the resource |
| `public/_locales/**` | i18n | manually switch Chrome locale + reload |
| `.github/workflows/release.yml` | publish | dispatch a no-op release in a draft branch first |
| `.env.local` | local dev only | restart `pnpm dev` |
| `tailwind.config.ts` (if added) | CSS output | rebuild + visual diff E2E |

### 8.4 Definition of Done

**Bug fix**
- Reproduction test added (unit or E2E) that fails before fix, passes after.
- `pnpm typecheck && pnpm lint && pnpm test:unit -- --run && pnpm test:e2e` all green.
- Manual repro: load `.output/chrome-mv3` unpacked, perform the failure path, confirm fix.
- Screenshot/log of green state attached to PR.
- No new permissions added.

**New feature**
- Feature reachable via the side panel (or popup) and discoverable.
- Unit tests for any new `src/lib/` code.
- E2E that drives the full happy path.
- Manifest changes (if any) listed in PR body and reviewed against sec 11.
- README/CLAUDE.md updated if new commands or surfaces.
- Bundle size delta reported (`pnpm build && du -sh .output/chrome-mv3`).

**Refactor**
- No behavior change → no E2E delta.
- Same tests pass with no edits to assertions (only imports/setup may move).
- Bundle size not larger.

**Dependency bump**
- `pnpm up <pkg>` (no `--latest` for major bumps without reading changelog).
- Run full pipeline.
- For WXT/Vite/React majors: rebuild from scratch (`rm -rf node_modules .wxt .output && pnpm install && pnpm build`).
- Note breaking changes in `CHANGELOG.md`.

**Schema (storage shape) change**
- Migration function in `src/lib/storage.ts` keyed by stored `version` field.
- Unit test for migration with a frozen sample of the old shape.
- Bump `STORAGE_SCHEMA_VERSION` constant.

**Copy/i18n change**
- Edit `public/_locales/<lang>/messages.json` only.
- No source code edit needed.
- E2E re-records snapshot if it asserts text.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile          # 1. deps
pnpm wxt prepare                        # 2. regen .wxt/wxt.d.ts
pnpm typecheck                          # 3. types
pnpm lint                               # 4. biome
pnpm test:unit -- --run                 # 5. unit
pnpm build                              # 6. zip-ready output
pnpm web-ext:lint                       # 7. manifest sanity
pnpm test:e2e                           # 8. full E2E
```

Expected outputs:

```
# 1
Lockfile is up to date, resolution step is skipped
Already up to date

# 2
✔ Generated .wxt/wxt.d.ts in 0.12s

# 3
(no output, exit 0)

# 4
Checked 47 files in 38ms. No fixes applied.

# 5
 Test Files  12 passed (12)
      Tests  73 passed (73)

# 6
✔ Built extension in 1.21s
  output/chrome-mv3 (242 kB)

# 7
0 errors, 0 warnings.

# 8
  21 passed (1.4m)
```

If any step exits non-zero, the task is not done.

### 8.6 Parallelization Patterns

- **Fan out** — three subagents adding three independent features that touch only their own React component, store, and message type. Each adds one entry to `src/types/messages.ts` and one handler in `entrypoints/background.ts`. **Risk:** merge conflicts in those two files — do them sequentially or pre-allocate slots.
- **Fan out** — write unit tests for `src/lib/storage.ts` and `src/lib/messaging.ts` simultaneously (separate files).
- **Do not fan out** — bumping deps + adding feature, since both touch lockfile.
- **Do not fan out** — two agents both editing `wxt.config.ts` permissions or `manifest`.

---

## 9. Stack-Specific Pitfalls

1. **SW global state lost on idle.** Symptom: variable was set 5 minutes ago, now `undefined`. Cause: SW terminated. Fix: persist via `chrome.storage`. Detect early: comment-test by adding `chrome.runtime.onStartup` log + waiting 1 minute.
2. **`window is not defined` in service worker.** Symptom: SW registration fails. Cause: an import pulls in DOM code. Fix: gate DOM-using modules behind `if (typeof window !== 'undefined')` or split files. Detect: WXT logs `service worker registration failed` on first build.
3. **Hydration mismatch in side panel.** Symptom: blank panel, console error. Cause: React used `Date.now()` in render. Fix: derive in `useEffect`. Detect: dev-mode console error.
4. **Content script can't see page-globals.** Symptom: `window.someApp` is undefined inside content script. Cause: isolated world. Fix: inject a `<script>` tag from content script into the main world (must be in `web_accessible_resources`). Detect: log inside content script vs page console.
5. **CSP rejects inline event handlers.** Symptom: button does nothing, console: `Refused to execute inline event handler`. Cause: `onclick=` in HTML. Fix: bind in `.tsx`. Detect: dev console warns immediately.
6. **`chrome.runtime.sendMessage` Promise resolves with `undefined`.** Cause: receiver returned `true` but never called `sendResponse`, OR receiver synchronously returned a value (which becomes the resolution) without `return true`. Fix: always `return true` then call `sendResponse` async, OR `return value` synchronously without `true`. Detect: integration test asserts on response shape.
7. **"Could not establish connection. Receiving end does not exist."** Cause: target tab has no content script (e.g., chrome:// page or extension was reloaded). Fix: wrap `tabs.sendMessage` in try/catch and re-inject via `chrome.scripting.executeScript`. Detect: E2E that opens chrome://newtab and triggers the path.
8. **Permission warning on update scares users.** Cause: added a permission requiring re-consent. Fix: rethink — can `activeTab` work? Detect: load packed extension in another profile to see the warning dialog.
9. **Chrome Web Store rejects for "Use of permissions not explained."** Fix: add a clear bullet per permission to the listing's description. Detect: precheck — every permission in manifest has a justification line in `STORE_LISTING.md`.
10. **declarativeNetRequest rules silently no-op.** Cause: rule JSON has wrong schema (missing `id` or `priority`). Fix: validate via `pnpm web-ext:lint`. Detect: the lint command surfaces schema errors.
11. **Stale extension ID in tests.** Symptom: E2E fails finding the SW. Cause: hardcoded ID, but Chrome assigns a different one per profile. Fix: derive from `context.serviceWorkers()` at runtime. Detect: E2E run on a fresh CI runner fails.
12. **Side panel doesn't open from action click.** Cause: forgot `chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })` in SW. Fix: add to background.ts top-level. Detect: E2E for the side panel open path.
13. **Service worker terminated mid-`fetch`.** Symptom: long fetch returns nothing. Cause: SW hit 5-minute or idle timeout. Fix: chunk work; use `chrome.alarms` to resume; never run >30 s synchronous JS. Detect: synthetic test that simulates a 60 s fetch.
14. **Storage quota exceeded.** Cause: `chrome.storage.sync` capped at 100 KB total / 8 KB per item. Fix: switch to `chrome.storage.local` (10 MB). Detect: quota probe util in `src/lib/storage.ts`.
15. **Edge submission rejected for missing privacy policy.** Cause: any data collection requires a privacy URL. Fix: host a static page; link from both store listings. Detect: precheck list in `RELEASE.md`.
16. **WXT dev server keeps loading the old version.** Cause: stale `.wxt/` cache. Fix: `rm -rf .wxt .output && pnpm dev`. Detect: side panel doesn't reflect a code change after save.
17. **Playwright test loads extension but service worker never appears.** Cause: launched without `--load-extension` arg. Fix: pass both `--disable-extensions-except=<path>` and `--load-extension=<path>`. Detect: fixture asserts SW exists within 5 s of launch.
18. **`chrome.identity.launchWebAuthFlow` redirect URI mismatch.** Cause: the OAuth client registered redirect doesn't match `https://<extension-id>.chromiumapp.org/`. Fix: register that exact URL with the canonical extension ID. Detect: smoke run of sign-in flow.
19. **Importing a Node-only library breaks SW.** Symptom: build fails or SW crashes referencing `process` or `Buffer`. Cause: lib uses Node built-ins. Fix: pick a browser-compatible alternative. Detect: WXT build error.
20. **Bundle size > 10 MB after adding a heavy lib.** Symptom: store rejects upload. Fix: dynamic-import + code-split per surface (`vite.build.rollupOptions.output.manualChunks`). Detect: `du -sh .output/chrome-mv3` step in CI.

---

## 10. Performance Budgets

| Metric | Budget | Measure |
|---|---|---|
| Side-panel cold open | < 350 ms to first paint | Playwright `page.goto(sidepanelURL)` + `performance.now()` delta |
| Service worker cold boot | < 80 ms to ready | Log `performance.now()` at top of `background.ts` and after first `await` |
| Content script execution | < 30 ms on `document_idle` | DevTools Performance panel on host page |
| Total unpacked size | < 5 MB | `du -sh .output/chrome-mv3` |
| Total zipped size | < 2 MB | `du -sh .output/chrome-mv3.zip` |
| Memory (SW) | < 50 MB resident | `chrome://extensions` → "Inspect views" → Memory profile |
| Memory (side panel) | < 100 MB | Same panel |
| chrome.storage.local usage | < 5 MB / 10 MB quota | `chrome.storage.local.getBytesInUse()` |

When exceeded:
- Bundle: code-split by surface; tree-shake; replace heavy deps.
- Memory: detach React DevTools; check for unbounded message-handler closures.
- Storage: trim history, archive externally, prompt user.

---

## 11. Security

### Secret storage

- Local dev: `.env.local` (gitignored). Never bundled — WXT only inlines vars prefixed with `WXT_PUBLIC_` into the build.
- CI: GitHub Actions secrets — `CWS_CLIENT_ID`, `CWS_CLIENT_SECRET`, `CWS_REFRESH_TOKEN`, `CWS_EXTENSION_ID`, `EDGE_CLIENT_ID`, `EDGE_CLIENT_SECRET`, `EDGE_PRODUCT_ID`, `SENTRY_AUTH_TOKEN`.
- **NEVER** put: API keys with backend write access, OAuth client secrets for confidential flows, anything that grants admin to your servers. Anyone can unzip and read your extension.

### Auth threat model

- The user's machine is trusted; other extensions in the same browser are not.
- Tokens stored in `chrome.storage.local` are readable by any code in your extension. They are NOT readable by other extensions, content scripts on web pages, or web pages.
- Use `chrome.identity.launchWebAuthFlow` for OAuth — Chrome handles the redirect into your `chromiumapp.org` URL.
- Refresh tokens stored in `chrome.storage.local`; rotate on every use.

### Input validation boundary

- Every `chrome.runtime.onMessage` handler validates with zod before acting.
- Every `fetch` response validates with zod before storing.
- DOM data scraped by content scripts is treated as untrusted — never `innerHTML` it back; render via React.

### Output escaping

- React handles all UI escaping. Never use `dangerouslySetInnerHTML`.
- For content-script DOM writes, use `textContent`, never `innerHTML`.

### Permissions config in `wxt.config.ts`

```ts
manifest: {
  permissions: [
    'storage',
    'sidePanel',
    'activeTab',                    // prefer over host_permissions when feasible
    'declarativeNetRequest',
    'identity',                     // only if OAuth used
  ],
  host_permissions: [
    // Add the SMALLEST set. Each entry triggers re-review on update.
    // 'https://api.example.com/*',
  ],
}
```

### Dependency audit

- `pnpm audit --prod` — runs in CI on every PR.
- Cadence: weekly Dependabot / Renovate PRs.
- Block merge on any high/critical advisory.

### Top 5 stack-specific risks

1. **Permissions creep** — adding `<all_urls>` to "make it work" is the #1 cause of CWS rejection and user uninstall. Always minimize.
2. **Untrusted page reaching SW via content script** — a malicious page can `postMessage` to your content script. Validate every message; do not echo into DOM.
3. **Inline scripts via library** — third-party UI libs that inject `<style>` or `<script>` will be CSP-blocked. Prefer libs that ship pure CSS files.
4. **Storage as feature flag** — anyone with file access can edit `chrome.storage` JSON. Don't gate paid features only by storage flag; verify on a backend.
5. **Stable extension ID leak** — the published extension ID is public and exposes `chromiumapp.org/<id>`. Don't tie identity to it; use server-side session.

---

## 12. Deploy

### Release flow (full)

```bash
# 1. Update version + changelog.
#    Edit wxt.config.ts: manifest.version
#    Edit CHANGELOG.md
git add wxt.config.ts CHANGELOG.md
git commit -m "chore(release): v0.2.0"

# 2. Tag.
git tag v0.2.0
git push origin main --tags

# 3. GitHub Actions release.yml runs:
#    pnpm install --frozen-lockfile
#    pnpm test:unit -- --run
#    pnpm build       (chrome zip)
#    pnpm build:edge  (edge zip)
#    pnpm web-ext:lint
#    chrome-webstore-upload-cli upload --auto-publish
#    @plasmohq/bms submit --edge

# 4. Manual final step (CWS):
#    Visit https://chrome.google.com/webstore/devconsole
#    Confirm submission; review takes 2-7 days.

# 5. Manual final step (Edge):
#    Visit https://partner.microsoft.com/dashboard/microsoftedge
#    Confirm submission; review takes up to 7 business days.
```

### Staging vs prod

- Two store listings. **Stage:** an unlisted item with `STAGING` in the name; testers added via "Trusted testers". **Prod:** the public listing.
- CI release.yml has a `--release-channel=trustedTesters` flag for non-tag pushes to `main`; tag pushes go to public.

### Rollback

- Chrome Web Store: open Dev Dashboard → Versions → click the previous version → "Publish". Takes effect within ~5 hours of next user check.
- No partial rollback. There's no `git revert` for already-rolled-out store users; only forward fixes.
- Max safe rollback window: any version still listed in the dashboard (CWS keeps history indefinitely).

### Health check

- Sentry: monitor `chrome-extension/<id>` project for new error spikes within 1 hour of release.
- Manual smoke: `pnpm dev:prod-zip` loads the released zip locally.
- Crash signal: Chrome's `chrome://extensions` "Errors" button; surfaces any uncaught SW errors.

### Versioning

- `manifest.version` in `wxt.config.ts` — must be 1–4 dot-separated unsigned ints (e.g. `1.2.3.4`). The store enforces strictly increasing.
- Mirror as `version` in `package.json` for tooling parity.
- Tag as `vX.Y.Z` in git.

### Cost per 1k MAU on default deploy target

- **$0/month.** CWS hosts the package; no server costs unless you add a backend. Sentry free tier covers ~5k events/month.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Claude rules — Chrome Extension MV3 (WXT)

This project follows `<repo>/rulebooks/chrome-extension-mv3.md`. Read it before any non-trivial task.

## Quick commands
- Dev: `pnpm dev`
- Typecheck: `pnpm typecheck`
- Lint: `pnpm lint`
- Unit tests: `pnpm test:unit -- --run`
- E2E: `pnpm test:e2e`
- Full preflight: `pnpm preflight`
- Build zip: `pnpm build`

## Hard rules (subset of rulebook §8)
- Never assume `window`/`document`/`localStorage` in `entrypoints/background.ts`.
- Never store state in module-level `let` and expect persistence — use `src/lib/storage.ts`.
- Never use `eval`, inline `<script>`, or remote scripts. CSP forbids.
- Never add a permission without justifying it in PR description.
- Always run `pnpm preflight` before claiming done.
- Always send messages via `src/lib/messaging.ts`.
- Always validate inbound messages with zod.

## File pointers
- Manifest: `wxt.config.ts`
- SW: `entrypoints/background.ts`
- UI: `entrypoints/sidepanel/`, `entrypoints/popup/`
- Content: `entrypoints/content.ts`
- Shared: `src/lib/`, `src/types/messages.ts`

## Skills to invoke
- `/test-driven-development` for any new behavior.
- `/systematic-debugging` for any non-obvious bug.
- `/verification-before-completion` before declaring done.
- `/ship` to release.
```

### `.claude/settings.json` (paste-ready)

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings",
  "hooks": {
    "PreCommit": [
      { "command": "pnpm typecheck" },
      { "command": "pnpm lint" },
      { "command": "pnpm test:unit -- --run" }
    ],
    "PostEdit": [
      { "matcher": "**/*.{ts,tsx,json}", "command": "pnpm exec biome format --write {file}" }
    ],
    "Stop": [
      { "command": "pnpm wxt prepare" }
    ]
  },
  "permissions": {
    "allow": [
      "Bash(pnpm install*)",
      "Bash(pnpm dev*)",
      "Bash(pnpm build*)",
      "Bash(pnpm test:*)",
      "Bash(pnpm typecheck*)",
      "Bash(pnpm lint*)",
      "Bash(pnpm format*)",
      "Bash(pnpm preflight*)",
      "Bash(pnpm wxt prepare*)",
      "Bash(pnpm web-ext:lint*)",
      "Bash(pnpm exec*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(node --version)",
      "Bash(pnpm --version)",
      "Bash(du -sh*)",
      "Bash(ls*)",
      "Bash(cat .output/*)"
    ],
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(pnpm publish*)"
    ]
  }
}
```

### Slash command shortcuts

- `/preflight` → runs `pnpm preflight`.
- `/zip` → runs `pnpm build && du -sh .output/chrome-mv3.zip`.
- `/perm-audit` → grep for permissions in wxt.config.ts and emit a justification table.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# Codex agent rules — Chrome Extension MV3 (WXT)

Same source of truth as Claude: `rulebooks/chrome-extension-mv3.md`.

## Always
- Run `pnpm typecheck && pnpm lint && pnpm test:unit -- --run` before saying done.
- Use `src/lib/messaging.ts` for messages, `src/lib/storage.ts` for storage.
- Validate every inbound message with zod.

## Never
- Use `window`/`document`/`localStorage` in `entrypoints/background.ts`.
- Add `<all_urls>` host permission.
- Add `eval`, inline scripts, or remote `<script src>`.
- Skip `pnpm wxt prepare` after `wxt.config.ts` edits.

## Before opening a PR
- Bundle delta: `pnpm build && du -sh .output/chrome-mv3`.
- Permissions delta: `grep -E 'permissions|host_permissions' wxt.config.ts`.
- Note both in PR body.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex-high"
sandbox = "workspace-write"
approval_mode = "untrusted"

[mcp]
disabled = false

[shell.allowlist]
commands = [
  "pnpm install", "pnpm dev", "pnpm build", "pnpm typecheck",
  "pnpm lint", "pnpm test:unit", "pnpm test:e2e", "pnpm preflight",
  "pnpm wxt prepare", "pnpm web-ext:lint",
  "git status", "git diff", "git log", "git add", "git commit",
  "node --version", "pnpm --version", "du -sh"
]
```

### Where Codex differs from Claude Code

- Codex defaults to less aggressive editing — explicitly tell it "edit until tests pass."
- Codex's sandbox blocks dev servers from reaching `localhost:3000` in some setups; use `sandbox = "workspace-write"` which permits localhost.
- Codex doesn't read `CLAUDE.md`; keep both files in sync.

---

## 15. Cursor / Other Editors

### `.cursor/rules` (paste-ready)

```
# Chrome MV3 + WXT rules

ALWAYS:
- Run `pnpm typecheck && pnpm lint && pnpm test:unit -- --run` before claiming done.
- Send messages only via `src/lib/messaging.ts`.
- Read/write storage only via `src/lib/storage.ts`.
- Validate inbound messages with zod.
- Register `chrome.*` listeners at the top level of `entrypoints/background.ts`.
- Use static `declarativeNetRequest` rules for blocking.
- Run `pnpm wxt prepare` after editing `wxt.config.ts`.

NEVER:
- Use `window`, `document`, `localStorage`, or `IndexedDB` in `entrypoints/background.ts`.
- Store state in module-level `let`/`const` and expect persistence.
- Use `eval`, `new Function`, inline `<script>`, or remote `<script src>`.
- Use `webRequest` blocking listeners.
- Add `<all_urls>` host permission.
- Bundle secrets into the extension.
- Set `externally_connectable.matches` to `<all_urls>`.

Reference doc: rulebooks/chrome-extension-mv3.md
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "bradlc.vscode-tailwindcss",
    "ms-playwright.playwright",
    "vitest.explorer",
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
      "name": "Attach to Chrome service worker",
      "type": "chrome",
      "request": "attach",
      "port": 9222,
      "urlFilter": "chrome-extension://*/background.js"
    },
    {
      "name": "Vitest debug",
      "type": "node",
      "request": "launch",
      "runtimeExecutable": "${workspaceFolder}/node_modules/.bin/vitest",
      "args": ["--inspect-brk", "--no-file-parallelism", "${file}"],
      "console": "integratedTerminal"
    },
    {
      "name": "Playwright debug",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/@playwright/test/cli.js",
      "args": ["test", "--debug", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in order. After `git push`, GitHub Actions builds and lints.

### 1. `package.json`

```json
{
  "name": "my-extension",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "wxt dev",
    "dev:edge": "wxt dev -b edge",
    "dev:firefox": "wxt dev -b firefox",
    "build": "wxt build && wxt zip",
    "build:edge": "wxt build -b edge && wxt zip -b edge",
    "preview": "wxt preview",
    "typecheck": "wxt prepare && tsc --noEmit",
    "lint": "biome check .",
    "format": "biome format --write .",
    "test:unit": "vitest",
    "test:e2e": "playwright test",
    "web-ext:lint": "web-ext lint --source-dir=.output/chrome-mv3",
    "preflight": "pnpm typecheck && pnpm lint && pnpm test:unit -- --run && pnpm build && pnpm web-ext:lint",
    "prepare": "wxt prepare"
  },
  "dependencies": {
    "loglevel": "^1.9.2",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "react-hook-form": "^7.55.0",
    "wouter": "^3.5.0",
    "zod": "^3.24.0",
    "zustand": "^5.0.0",
    "@sentry/browser": "^8.40.0"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.3.0",
    "@playwright/test": "^1.59.1",
    "@types/node": "^24.0.0",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.4",
    "@wxt-dev/module-react": "^1.1.4",
    "chrome-types": "^0.1.425",
    "chrome-webstore-upload-cli": "^3.3.2",
    "jsdom": "^26.0.0",
    "tailwindcss": "^4.0.0",
    "typescript": "^5.9.3",
    "vitest": "^4.1.4",
    "vitest-chrome": "^0.1.0",
    "web-ext": "^10.1.0",
    "wxt": "^0.20.25"
  },
  "packageManager": "pnpm@10.33.0",
  "engines": {
    "node": ">=24.0.0"
  }
}
```

### 2. `wxt.config.ts`

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  srcDir: '.',
  manifest: {
    name: 'My Extension',
    description: 'Generated from chrome-extension-mv3 rulebook.',
    version: '0.1.0',
    permissions: [
      'storage',
      'sidePanel',
      'activeTab',
      'declarativeNetRequest',
    ],
    host_permissions: [],
    side_panel: {
      default_path: 'sidepanel.html',
    },
    action: {
      default_title: 'My Extension',
      default_icon: {
        '16': 'icons/icon-16.png',
        '48': 'icons/icon-48.png',
        '128': 'icons/icon-128.png',
      },
    },
    icons: {
      '16': 'icons/icon-16.png',
      '48': 'icons/icon-48.png',
      '128': 'icons/icon-128.png',
    },
    declarative_net_request: {
      rule_resources: [
        {
          id: 'static_rules',
          enabled: true,
          path: 'rules/dnr-rules.json',
        },
      ],
    },
    web_accessible_resources: [
      {
        resources: ['injected.js'],
        matches: ['<all_urls>'],
      },
    ],
    content_security_policy: {
      extension_pages: "script-src 'self'; object-src 'self'",
    },
  },
  runner: {
    chromiumArgs: ['--auto-open-devtools-for-tabs'],
  },
});
```

### 3. `tsconfig.json`

```json
{
  "extends": "./.wxt/tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2023", "DOM", "DOM.Iterable", "WebWorker"],
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "skipLibCheck": true,
    "types": ["chrome-types", "vite/client", "vitest/globals"],
    "paths": {
      "~/*": ["./src/*"]
    }
  },
  "include": [
    "entrypoints",
    "src",
    "test",
    "wxt.config.ts",
    "vitest.config.ts",
    "playwright.config.ts"
  ]
}
```

### 4. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.3.0/schema.json",
  "vcs": { "enabled": true, "clientKind": "git", "useIgnoreFile": true },
  "files": {
    "includes": ["entrypoints/**", "src/**", "test/**", "*.{ts,tsx,json}"]
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
        "noConsole": "off"
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "semicolons": "always" }
  }
}
```

### 5. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['{src,entrypoints,test}/**/*.test.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**', 'entrypoints/**'],
      exclude: ['**/*.test.*', '**/*.spec.*'],
    },
  },
});
```

### 6. `test/setup.ts`

```ts
import { chrome } from 'vitest-chrome';
import { afterEach, beforeEach, vi } from 'vitest';

(globalThis as unknown as { chrome: typeof chrome }).chrome = chrome;

beforeEach(() => {
  chrome.storage.local.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```

### 7. `playwright.config.ts`

```ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './test/e2e',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html'], ['github']] : 'list',
  use: {
    headless: false,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
});
```

### 8. `test/e2e/fixtures.ts`

```ts
import { test as base, chromium, type BrowserContext, type Worker } from '@playwright/test';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const extensionPath = path.resolve(__dirname, '../../.output/chrome-mv3');

export const test = base.extend<{
  context: BrowserContext;
  serviceWorker: Worker;
  extensionId: string;
}>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      headless: false,
      args: [
        `--disable-extensions-except=${extensionPath}`,
        `--load-extension=${extensionPath}`,
        '--no-first-run',
      ],
    });
    await use(context);
    await context.close();
  },
  serviceWorker: async ({ context }, use) => {
    let [sw] = context.serviceWorkers();
    if (!sw) sw = await context.waitForEvent('serviceworker');
    await use(sw);
  },
  extensionId: async ({ serviceWorker }, use) => {
    const id = serviceWorker.url().split('/')[2];
    await use(id);
  },
});

export const expect = test.expect;
```

### 9. `test/e2e/sidepanel.spec.ts`

```ts
import { test, expect } from './fixtures';

test('side panel renders heading', async ({ context, extensionId }) => {
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/sidepanel.html`);
  await expect(page.getByRole('heading', { name: /my extension/i })).toBeVisible();
});
```

### 10. `entrypoints/background.ts`

```ts
import { z } from 'zod';
import { logger } from '~/lib/log';
import { storage } from '~/lib/storage';

const log = logger('background');

const Message = z.discriminatedUnion('type', [
  z.object({ type: z.literal('PING') }),
  z.object({ type: z.literal('GET_SETTINGS') }),
  z.object({
    type: z.literal('SET_SETTING'),
    key: z.string(),
    value: z.unknown(),
  }),
]);
type Message = z.infer<typeof Message>;

chrome.runtime.onInstalled.addListener(({ reason }) => {
  log.info('installed', { reason });
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((e) => log.error('sidePanel.setPanelBehavior', e));

chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
  (async () => {
    const parsed = Message.safeParse(raw);
    if (!parsed.success) {
      sendResponse({ ok: false, error: 'invalid_message' });
      return;
    }
    const msg = parsed.data;
    log.debug('msg.in', msg);
    try {
      if (msg.type === 'PING') {
        sendResponse({ ok: true, pong: true });
      } else if (msg.type === 'GET_SETTINGS') {
        const settings = await storage.get('settings', {});
        sendResponse({ ok: true, settings });
      } else if (msg.type === 'SET_SETTING') {
        const settings = await storage.get('settings', {} as Record<string, unknown>);
        settings[msg.key] = msg.value;
        await storage.set('settings', settings);
        sendResponse({ ok: true });
      }
    } catch (err) {
      log.error('handler', err);
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // async response
});
```

### 11. `entrypoints/content.ts`

```ts
export default defineContentScript({
  matches: ['https://example.com/*'],
  runAt: 'document_idle',
  main() {
    chrome.runtime.sendMessage({ type: 'PING' }).then((res) => {
      console.log('content sw responded', res);
    });
  },
});
```

### 12. `entrypoints/sidepanel/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>My Extension</title>
    <link rel="stylesheet" href="../../src/styles/globals.css" />
  </head>
  <body class="bg-white text-slate-900">
    <div id="root"></div>
    <script type="module" src="./main.tsx"></script>
  </body>
</html>
```

### 13. `entrypoints/sidepanel/main.tsx`

```tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const el = document.getElementById('root');
if (!el) throw new Error('root missing');
createRoot(el).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

### 14. `entrypoints/sidepanel/App.tsx`

```tsx
import { useEffect, useState } from 'react';

export default function App() {
  const [pong, setPong] = useState<boolean | null>(null);
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'PING' }).then((r: { pong: boolean }) => setPong(r.pong));
  }, []);
  return (
    <main className="p-4">
      <h1 className="text-lg font-semibold">My Extension</h1>
      <p>Service worker says: {pong ? 'pong' : '...'}</p>
    </main>
  );
}
```

### 15. `entrypoints/popup/index.html`, `main.tsx`, `App.tsx`

Same shape as side panel; trim `App.tsx` to a one-button surface that opens the side panel:

```tsx
export default function App() {
  return (
    <button
      type="button"
      className="px-3 py-1 text-sm"
      onClick={async () => {
        const tab = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab[0]?.windowId !== undefined) {
          await chrome.sidePanel.open({ windowId: tab[0].windowId });
        }
      }}
    >
      Open side panel
    </button>
  );
}
```

### 16. `src/lib/messaging.ts`

```ts
import type { z } from 'zod';

export async function send<T, R>(message: T): Promise<R> {
  const res = await chrome.runtime.sendMessage(message);
  if (chrome.runtime.lastError) {
    throw new Error(chrome.runtime.lastError.message);
  }
  return res as R;
}

export function on<T extends z.ZodTypeAny>(
  schema: T,
  handler: (msg: z.infer<T>) => Promise<unknown>,
) {
  chrome.runtime.onMessage.addListener((raw, _sender, sendResponse) => {
    (async () => {
      const parsed = schema.safeParse(raw);
      if (!parsed.success) {
        sendResponse({ ok: false, error: 'invalid' });
        return;
      }
      try {
        const result = await handler(parsed.data);
        sendResponse({ ok: true, result });
      } catch (err) {
        sendResponse({ ok: false, error: String(err) });
      }
    })();
    return true;
  });
}
```

### 17. `src/lib/storage.ts`

```ts
export const storage = {
  async get<T>(key: string, fallback: T): Promise<T> {
    const r = await chrome.storage.local.get(key);
    return (r[key] as T) ?? fallback;
  },
  async set<T>(key: string, value: T): Promise<void> {
    await chrome.storage.local.set({ [key]: value });
  },
  async remove(key: string): Promise<void> {
    await chrome.storage.local.remove(key);
  },
  onChanged(cb: (changes: chrome.storage.StorageChange) => void) {
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== 'local') return;
      for (const change of Object.values(changes)) cb(change);
    });
  },
};
```

### 18. `src/lib/log.ts`

(See Section 7.)

### 19. `src/styles/globals.css`

```css
@import 'tailwindcss';
```

### 20. `rules/dnr-rules.json`

```json
[
  {
    "id": 1,
    "priority": 1,
    "action": { "type": "block" },
    "condition": { "urlFilter": "||example-tracker.com", "resourceTypes": ["script"] }
  }
]
```

### 21. `.env.example`

```
WXT_PUBLIC_SENTRY_DSN=
```

### 22. `.gitignore`

```
node_modules
.output
.wxt
.env.local
*.zip
test-results
playwright-report
coverage
.DS_Store
```

### 23. `LICENSE`

MIT — paste from https://opensource.org/license/mit.

### 24. `README.md`

```markdown
# My Extension

Built with WXT (Chrome Extension MV3). See `rulebooks/chrome-extension-mv3.md`.

## Dev
pnpm install
pnpm dev

## Build
pnpm build
```

### 25. `.github/workflows/ci.yml`

```yaml
name: ci
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:unit -- --run
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm build
      - run: xvfb-run -a pnpm test:e2e
      - run: pnpm web-ext:lint
```

### 26. `.github/workflows/release.yml`

```yaml
name: release
on:
  push:
    tags: ['v*']

jobs:
  publish:
    runs-on: ubuntu-24.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 10.33.0 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }

      - run: pnpm install --frozen-lockfile
      - run: pnpm test:unit -- --run
      - run: pnpm build
      - run: pnpm build:edge
      - run: pnpm web-ext:lint

      - name: Upload to Chrome Web Store
        env:
          CWS_CLIENT_ID: ${{ secrets.CWS_CLIENT_ID }}
          CWS_CLIENT_SECRET: ${{ secrets.CWS_CLIENT_SECRET }}
          CWS_REFRESH_TOKEN: ${{ secrets.CWS_REFRESH_TOKEN }}
          CWS_EXTENSION_ID: ${{ secrets.CWS_EXTENSION_ID }}
        run: |
          pnpm exec chrome-webstore-upload-cli upload \
            --source .output/chrome-mv3.zip \
            --extension-id "$CWS_EXTENSION_ID" \
            --client-id "$CWS_CLIENT_ID" \
            --client-secret "$CWS_CLIENT_SECRET" \
            --refresh-token "$CWS_REFRESH_TOKEN" \
            --auto-publish

      - name: Upload to Edge Add-ons
        env:
          EDGE_CLIENT_ID: ${{ secrets.EDGE_CLIENT_ID }}
          EDGE_CLIENT_SECRET: ${{ secrets.EDGE_CLIENT_SECRET }}
          EDGE_PRODUCT_ID: ${{ secrets.EDGE_PRODUCT_ID }}
          EDGE_ACCESS_TOKEN_URL: ${{ secrets.EDGE_ACCESS_TOKEN_URL }}
        run: pnpm dlx @plasmohq/bms@latest submit --edge-zip .output/chrome-mv3.zip
```

After committing all 26 files, `git push` triggers CI; tagging `v0.1.0` triggers release (assuming secrets are set).

---

## 17. Idea → MVP Path

`PROJECT_IDEA` is blank, so use a generic "saved-snippets" CRUD example: user highlights text on a page, side panel saves it, browses snippets later.

### Phase 1 — Schema (1 session)

- File: `src/types/snippet.ts`
- Shape: `{ id: string; text: string; url: string; title: string; createdAt: number; tags: string[] }`
- Storage key `snippets` → `Snippet[]`. Migration scaffold in `src/lib/storage.ts` keyed by `STORAGE_SCHEMA_VERSION = 1`.
- Exit: typecheck green; one snippet seeded in dev.

### Phase 2 — Backbone (1 session)

- Side panel routes: `/list`, `/new`, `/snippet/:id` via wouter.
- Popup with "Open side panel" button.
- Background SW message handlers: `LIST_SNIPPETS`, `CREATE_SNIPPET`, `DELETE_SNIPPET`.
- Content script captures `window.getSelection()` on a keyboard shortcut (use `chrome.commands`).
- Exit: navigate all routes; create/delete a snippet; storage updates verified in DevTools.

### Phase 3 — Vertical slice (2 sessions)

- E2E: "user selects text, presses shortcut, snippet appears in side panel, user deletes it."
- Unit tests: storage migration, message validation.
- Sentry wired in all three surfaces.
- Exit: `pnpm preflight` green; manual full happy path on a real website.

### Phase 4 — Auth + multi-user (2 sessions)

- Add backend (out of scope of this rulebook; stub a `/sync` endpoint).
- `chrome.identity.launchWebAuthFlow` for Google sign-in.
- Snippets sync to backend; conflict resolution = last-write-wins by `updatedAt`.
- Exit: two browser profiles see the same snippets after sync.

### Phase 5 — Ship + monitor (1 session)

- Tag `v0.1.0`. CI builds + uploads to CWS as draft.
- Manually submit on the dev console.
- Wait 2–7 days.
- After publish: monitor Sentry; check chrome://extensions error count daily for 1 week.

---

## 18. Feature Recipes

### 18.1 Authentication (Google OAuth via chrome.identity)

1. Register an OAuth Web client at https://console.cloud.google.com → APIs & Services → Credentials. Authorized redirect URI: `https://<extension-id>.chromiumapp.org/`.
2. Add `identity` to `manifest.permissions`.
3. `src/lib/auth.ts`:

```ts
const CLIENT_ID = import.meta.env.WXT_PUBLIC_GOOGLE_CLIENT_ID;
const REDIRECT = chrome.identity.getRedirectURL();

export async function signIn(): Promise<{ accessToken: string }> {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.searchParams.set('client_id', CLIENT_ID);
  url.searchParams.set('redirect_uri', REDIRECT);
  url.searchParams.set('response_type', 'token');
  url.searchParams.set('scope', 'openid email profile');

  const responseUrl = await chrome.identity.launchWebAuthFlow({
    url: url.toString(),
    interactive: true,
  });
  const hash = new URL(responseUrl).hash.slice(1);
  const params = new URLSearchParams(hash);
  const token = params.get('access_token');
  if (!token) throw new Error('No token');
  return { accessToken: token };
}
```

4. Call from background SW only (never content/popup).

### 18.2 File upload

Read file in side panel via `<input type="file">`, FormData → `fetch` to your backend. CSP allows `connect-src` for any HTTPS by default in MV3 extension pages.

### 18.3 Stripe

Use Stripe Pricing Table iframe in a separate page (`entrypoints/upgrade/index.html`). Open via `chrome.tabs.create({ url: chrome.runtime.getURL('upgrade.html') })`. Stripe Elements works in extension pages with `script-src 'self' https://js.stripe.com` added to `content_security_policy.extension_pages`.

### 18.4 Push notifications

`chrome.notifications` API. Permission: `notifications`. Show from SW:

```ts
chrome.notifications.create({
  type: 'basic',
  iconUrl: 'icons/icon-128.png',
  title: 'Done',
  message: 'Saved.',
});
```

For server-pushed: use `chrome.gcm` (Firebase Cloud Messaging) — register in SW.

### 18.5 Background jobs

`chrome.alarms`:

```ts
chrome.alarms.create('sync', { periodInMinutes: 30 });
chrome.alarms.onAlarm.addListener(async (a) => {
  if (a.name === 'sync') await syncNow();
});
```

Maximum minimum period in dev: 30 s; in production: 1 minute.

### 18.6 Realtime updates

WebSockets in SW are unreliable (terminate on idle). Pattern: open a WebSocket inside an offscreen document (`chrome.offscreen` API), forward to SW via messages. Reconnect on `chrome.alarms`.

### 18.7 Search

Local: in-memory `Map` keyed by snippet text, lower-cased; or use FlexSearch (~10 KB) for fuzzy. Index from storage on SW boot.

### 18.8 Internationalization

`public/_locales/en/messages.json`:

```json
{
  "appName": { "message": "My Extension" },
  "save": { "message": "Save" }
}
```

`wxt.config.ts` manifest: `default_locale: 'en'`, `name: '__MSG_appName__'`. In code: `chrome.i18n.getMessage('save')`.

### 18.9 Dark mode

Pure CSS: `@media (prefers-color-scheme: dark)`. Tailwind: `dark:bg-slate-900` with `darkMode: 'media'` in `tailwind.config.ts` (or v4 `@variant dark` rule).

### 18.10 Analytics events

PostHog via `posthog-js` (works in extension pages; uses `fetch` only — CSP-safe). Initialize per surface; share `distinct_id` via storage. Never track in content scripts (cross-origin concerns) — forward events through SW.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Service worker registration failed: Status code: 15` | Top-level `chrome.*` call in `background.ts` failed; move into a listener or `try/catch`. |
| `Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'"` | Move the script into a `.ts` file imported via `<script src>`. |
| `Could not establish connection. Receiving end does not exist.` | The receiver tab/SW isn't loaded; await `chrome.scripting.executeScript` first or check `tabs.query`. |
| `Cannot read properties of undefined (reading 'getMessage')` (chrome.i18n) | `default_locale` missing from manifest. |
| `chrome is not defined` (Vitest) | `test/setup.ts` not loaded; check `vitest.config.ts` `setupFiles`. |
| `Failed to load extension. Manifest file is missing or unreadable.` | Pointing Chrome at the wrong dir; load `.output/chrome-mv3`. |
| `Permission 'webRequest' is unknown or URL pattern is malformed.` | MV3 disallows `webRequestBlocking`; use `declarativeNetRequest`. |
| `Quota exceeded` from `chrome.storage.sync.set` | Switch to `chrome.storage.local`. |
| `Extension service worker not found` (Playwright) | Used `chromium.launch` instead of `launchPersistentContext`. |
| `The message port closed before a response was received.` | `onMessage` handler returned before calling `sendResponse`; ensure `return true` and async handler. |
| `Manifest is invalid: 'side_panel.default_path' must be a relative path` | Use `sidepanel.html`, not `/sidepanel.html`. |
| `Web request blocking is disabled.` | MV3 forbids it. Use `declarativeNetRequest`. |
| `Item not updated. Item with package name X already exists.` | Bump `manifest.version` (must strictly increase). |
| `Invalid value for 'permissions[…]': … is not a recognized permission.` | Typo or removed in MV3 (e.g., `background` is no longer a permission). |
| Side panel opens but is blank | React threw at mount; open side panel DevTools and inspect. |
| `chrome.storage.local.get is not a function` | Type narrow: in jsdom test, `vitest-chrome` mock not set up. |
| `MAX_GETMATCHEDRULES_CALLS_PER_INTERVAL exceeded` | DNR rate limit; cache results. |
| `Cannot use 'chrome.scripting.executeScript' on 'chrome://...'` | Chrome internal pages are blocked; check the URL before injecting. |
| Build fails: "Could not resolve `process`" | Imported a Node lib; replace with browser-compatible. |
| Build size > 10 MB | Code-split per surface; remove heavy lib. |
| `Manifest version 2 is deprecated` | You set `manifest_version: 2` somewhere; remove. |
| OAuth `redirect_uri_mismatch` | Use `chrome.identity.getRedirectURL()` and register exactly that. |
| `Extensions can only be installed from the Chrome Web Store.` (in user reports) | Fine for store-published; for sideload, ship `.crx` with `update_url`. |
| Extension disappears on browser restart (sideload) | Without `key` field + matching pem, ID changes per profile; sign with the `.pem` you used at first load. |
| `web-ext lint` errors about `manifest.background.scripts` | MV3 requires `service_worker`, not `scripts`; fix `wxt.config.ts`. |
| Chrome shows "This extension may have been corrupted" | Service worker threw at install; check `chrome://extensions` → Errors. |
| `Cannot find module '~/lib/...'` | `paths` in tsconfig not picked up; restart TS server; ensure WXT alias plugin is enabled. |
| `Privacy practices have not been provided` | Fill the Chrome Web Store dashboard "Privacy practices" section before publishing. |
| `Item rejected: Single Purpose` | CWS policy: extension must do one thing; trim unrelated features. |
| `pnpm-lock.yaml is not up-to-date` (CI) | Locally run `pnpm install`; commit the updated lockfile. |

---

## 20. Glossary

- **Background service worker** — A short-lived JavaScript file the browser runs to handle extension events. Replaces the persistent "background page" of MV2.
- **Biome** — A Rust-built linter+formatter that replaces ESLint and Prettier.
- **Content script** — JS injected by your extension into a webpage; runs in an "isolated world" that shares the DOM but not JS variables with the page.
- **CSP (Content Security Policy)** — Browser-enforced rules that block dangerous code patterns like inline scripts and `eval`.
- **Chrome Web Store (CWS)** — Google's distribution platform for Chrome extensions.
- **Chromium** — The open-source browser engine behind Chrome and Edge.
- **declarativeNetRequest (DNR)** — MV3's safe API for blocking and modifying web requests via static rule files.
- **Edge Add-ons** — Microsoft's equivalent of CWS for Microsoft Edge.
- **Extension ID** — A 32-character string identifying a specific extension installation.
- **HMR (Hot Module Replacement)** — Dev-mode feature that swaps changed JS modules without a full reload.
- **Isolated world** — Each content script runs in its own JS heap, separate from the page's JS.
- **launchPersistentContext** — A Playwright method that starts Chrome with a stable user profile; required to load extensions in tests.
- **Manifest** — `manifest.json`, the descriptor file for an extension. MV3 is the current required version.
- **MV3 (Manifest V3)** — The current-required Chrome extension manifest standard.
- **Offscreen document** — An MV3 API that lets you run hidden HTML pages from your extension when you need DOM, audio, or persistent connections.
- **Pnpm** — A fast, disk-efficient JS package manager.
- **Popup** — The small window that appears when a user clicks the extension's toolbar icon.
- **Programmatic injection** — Calling `chrome.scripting.executeScript` from JS to inject a script (vs declaring it in the manifest).
- **React** — A JS library for building UIs.
- **Service worker (SW)** — A JS worker that runs without a page; handles background work in MV3 extensions. Terminates after ~30 s idle.
- **Side panel** — A Chrome UI surface to the right of web content that an extension can populate. Persists across tab navigation.
- **Tailwind** — A utility-first CSS framework.
- **TypeScript** — JS plus a static type system.
- **Vite** — A fast JS bundler/dev server.
- **Vitest** — A fast unit-test runner that shares Vite's config.
- **web-ext** — Mozilla's CLI for building, running, and linting browser extensions; works with both Firefox and Chromium.
- **web_accessible_resources** — Manifest entry that allows webpages or other contexts to load an extension's files.
- **WXT** — A Vite-based framework that scaffolds and builds browser extensions for Chrome, Firefox, and Edge from one codebase.
- **Zod** — A TS schema validation library.
- **Zustand** — A small state-management library for React.

---

## 21. Update Cadence

- This rulebook is valid for **WXT 0.20.x**, **Vite 7.x**, **TypeScript 5.9.x**, **React 19.x**, **Chrome 130+**, **Manifest V3**.
- Re-run the generator when: WXT major version bump (0.21+); Chrome ships a Manifest V4 RFC; React 20 stable; a permission you rely on (e.g., `declarativeNetRequest`) changes its quota or behavior; CWS policy update.
- Last verified: 2026-04-27.

## Sources

- [chrome.sidePanel API](https://developer.chrome.com/docs/extensions/reference/api/sidePanel)
- [Manifest V3 overview](https://developer.chrome.com/docs/extensions/develop/migrate/what-is-mv3)
- [Service worker lifecycle](https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle)
- [chrome.declarativeNetRequest](https://developer.chrome.com/docs/extensions/reference/api/declarativeNetRequest)
- [Declare permissions](https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions)
- [Message passing](https://developer.chrome.com/docs/extensions/develop/concepts/messaging)
- [MV3 CSP](https://developer.chrome.com/docs/extensions/mv3/manifest/content_security_policy/)
- [Content scripts](https://developer.chrome.com/docs/extensions/mv3/content_scripts/)
- [Chrome Web Store review process](https://developer.chrome.com/docs/webstore/review-process/)
- [Microsoft Edge: publish an extension](https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension)
- [WXT framework](https://wxt.dev/)
- [WXT on npm](https://www.npmjs.com/package/wxt)
- [Vite 8 announcement](https://vite.dev/blog/announcing-vite8)
- [Vitest on npm](https://www.npmjs.com/package/vitest)
- [Playwright Chrome extensions guide](https://playwright.dev/docs/chrome-extensions)
- [chrome-webstore-upload-cli](https://github.com/fregante/chrome-webstore-upload-cli)
- [@plasmohq/bms](https://github.com/PlasmoHQ/bms)
- [web-ext](https://www.npmjs.com/package/web-ext)
- [chrome-types](https://www.npmjs.com/package/chrome-types)
- [Biome](https://biomejs.dev/)
- [pnpm](https://pnpm.io/installation)
- [2025 State of Browser Extension Frameworks (Plasmo, WXT, CRXJS)](https://redreamality.com/blog/the-2025-state-of-browser-extension-frameworks-a-comparative-analysis-of-plasmo-wxt-and-crxjs/)
