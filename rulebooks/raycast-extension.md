# Raycast Extension Rulebook

> TypeScript + React extension for Raycast (macOS only). Ships via PR to the `raycast/extensions` monorepo.

This file is the entire spec. Every command, every config, every rule. No external docs are required to ship a working Raycast extension from zero.

---

## 1. Snapshot

**Stack:** Raycast extension — TypeScript + React, `@raycast/api` + `@raycast/utils`, command (form/list/grid) + menu-bar + no-view + AI extension modes, OAuth via `@raycast/api` helpers, package.json manifest, publishing via Pull Request to `raycast/extensions` monorepo.

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.8 | Required by Raycast template, full type defs ship with API |
| Runtime + version | Node.js 22.14 LTS | Minimum supported by `@raycast/api` 1.104+ |
| Package manager | npm 10 | CI on `raycast/extensions` runs npm — match it exactly |
| Build tool | `ray` CLI (Raycast-bundled) | Official builder, handles JSX + bundling |
| State mgmt | React hooks + `@raycast/utils` hooks | Built-in, no extra lib needed |
| Routing/Nav | `useNavigation` from `@raycast/api` | Official push/pop stack |
| Data layer (db + orm) | None — `LocalStorage` + `Cache` | Encrypted KV is built in |
| Auth | `OAuthService` from `@raycast/utils` | PKCE flow with Raycast proxy support |
| Styling | None — Raycast renders native UI | Components are not styled by extension |
| Forms + validation | `Form` API + manual `onChange` validation | Built into `@raycast/api` |
| Unit test runner | Vitest 3.2 | Fast, ESM-friendly, no jest/babel config needed |
| E2E framework | None — `npx ray evals` for AI tools | Raycast does not expose an E2E harness |
| Mocking strategy | Vitest `vi.mock` at API boundary | Mock `@raycast/api` exports per test |
| Logger | `console.log` + Raycast's stdout capture | Shown in `ray develop` terminal |
| Error tracking | Raycast Pro built-in error reporting | No Sentry needed; Raycast collects stack traces |
| Lint + format | `@raycast/eslint-config` 2.1 + Prettier 3.4 | Official preset; CI lints on PR |
| Type checking | `tsc --noEmit` via `ray build` | Build fails on type error |
| Env vars + secrets | `password` preference type | API keys go in encrypted preferences, never `.env` |
| CI provider | GitHub Actions on `raycast/extensions` | Runs on PR — extension authors don't configure it |
| Deploy target | Raycast Store (`raycast/extensions` monorepo) | The only distribution path for public extensions |
| Release flow | PR to `raycast/extensions` `main` | Reviewer merges → auto-publishes to Store |
| Auto-update | Raycast app updates extensions automatically | No author action; users get updates via Raycast app |
| Command modes | `view`, `no-view`, `menu-bar` per command | Set in package.json `mode` field |
| AI surface | Tools API (`tool` exports) + `ai.yaml` | Tools the AI calls; evals validate behavior |
| Preferences | Typed in package.json `preferences` array | `password` for secrets, never `textfield` |
| Icon spec | 512x512 PNG, light + dark legible | Required; default Raycast icon is rejected |
| Screenshots | 2000x1250 PNG in `metadata/` | 3-6 required for Store listing |
| Network | `useFetch` from `@raycast/utils` | Stale-while-revalidate, abort handling free |
| Background refresh | `interval` in package.json | Min 10s; tolerance window applies |

### Versions Table

| Library | Version | Released | Link |
|---|---|---|---|
| `@raycast/api` | 1.104.5 | 2026-04 | https://www.npmjs.com/package/@raycast/api |
| `@raycast/utils` | 2.2.2 | 2026-02 | https://www.npmjs.com/package/@raycast/utils |
| `@raycast/eslint-config` | 2.1.1 | 2026-04 | https://www.npmjs.com/package/@raycast/eslint-config |
| TypeScript | 5.8.3 | 2026-03 | https://www.npmjs.com/package/typescript |
| React | 18.3.1 | 2024-04 | https://www.npmjs.com/package/react |
| Node.js | 22.14.0 LTS | 2026-02 | https://nodejs.org |
| npm | 10.9.x | bundled with Node 22 | https://docs.npmjs.com |
| Prettier | 3.4.2 | 2026-01 | https://www.npmjs.com/package/prettier |
| ESLint | 9.18.0 | 2026-01 | https://www.npmjs.com/package/eslint |
| Vitest | 3.2.4 | 2026-03 | https://www.npmjs.com/package/vitest |

### Minimum Host Requirements

- **OS:** macOS 13 Ventura or later. Raycast is **macOS-only** — there is no Windows or Linux build.
- **RAM:** 8 GB (16 GB if running Vitest + ray develop concurrently).
- **Disk:** 2 GB free (Raycast app ~300 MB, Node 22 ~150 MB, extension `node_modules` ~400 MB).
- **CPU:** Apple Silicon or Intel Mac.
- **Raycast app:** 1.84+ installed and running.

### Cold-Start Time

From `git clone` of the monorepo to the extension running in `ray develop`: **~3 minutes** on M-series Mac, ~6 minutes on Intel.

---

## 2. Zero-to-running (Setup)

### macOS (the only supported development OS)

#### Prerequisites

```bash
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node 22 LTS
brew install node@22
echo 'export PATH="/opt/homebrew/opt/node@22/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
node --version  # must print v22.14.x or higher

# 3. Install Git
brew install git

# 4. Install Raycast app
brew install --cask raycast
# OR download from https://www.raycast.com
# Open Raycast, complete onboarding, sign in with Raycast account
```

#### Accounts to create

- **Raycast account** at https://www.raycast.com — required to publish; sign in inside the Raycast app.
- **GitHub account** — required to fork `raycast/extensions` and open the publish PR.
- **Apple ID for Mac** — required to install Raycast (any Apple ID works; no developer account needed).

#### CLI auth

```bash
# GitHub CLI (used for the publish PR)
brew install gh
gh auth login
# Pick: GitHub.com → HTTPS → Login with web browser → paste device code

# Verify
gh auth status
# Expected: "Logged in to github.com as <username>"
```

#### Bootstrap a new extension

```bash
# Clone the Raycast extensions monorepo (this is where you'll publish)
mkdir -p ~/code && cd ~/code
git clone https://github.com/raycast/extensions.git raycast-extensions
cd raycast-extensions

# Add your fork as origin once you fork on GitHub
gh repo fork --remote=true --remote-name=fork

# Scaffold via npm init (works outside the monorepo too for prototyping)
cd ~/code
npm init raycast-extension@latest -- echo-list
# Answers:
#   Title: Echo List
#   Description: Echo back what you type as a list
#   Author: <your raycast username>
#   Categories: Productivity
#   License: MIT

cd echo-list
npm install
```

#### Run dev mode

```bash
npm run dev
# This calls `ray develop` under the hood. Expected first-run output:
#
# › Building extension…
# › Extension is ready for use
# › Press ⌘C to stop
#
# Raycast app: open Raycast (default ⌥Space) → search "Echo List" → it appears.
```

#### Common first-run errors

| Error | Fix |
|---|---|
| `command not found: ray` | Run via `npm run dev` not `ray` directly. The `ray` binary is at `node_modules/.bin/ray`. |
| `Raycast is not running` | Open the Raycast app first; `ray develop` injects the dev extension into the running app. |
| `Node version 18 is not supported` | `brew install node@22 && brew unlink node && brew link node@22 --overwrite` |
| `EACCES: permission denied` on `~/.config/raycast` | `chmod -R u+w ~/.config/raycast ~/Library/Application\ Support/com.raycast.macos` |
| Extension does not show up in Raycast root | Quit and relaunch Raycast app once. `ray develop` keeps it warm afterward. |
| `Error: Cannot find module '@raycast/api'` | `rm -rf node_modules package-lock.json && npm install` |
| Build error `JSX element implicitly has type 'any'` | Ensure `tsconfig.json` has `"jsx": "react-jsx"` (template default). |

### Windows / Linux

**Raycast does not support Windows or Linux.** There is no path to develop or run a Raycast extension on those OSes. If you are on Windows or Linux:

- You cannot run `ray develop` (the Raycast app it injects into is macOS-only).
- You cannot publish (the extension is validated by running it in the Raycast app).
- Your only option is to borrow or buy a Mac.

Do not attempt to install Raycast or `@raycast/api` on Windows/Linux for development. The `ray` CLI builds will appear to succeed but the runtime will fail because there is no host app.

---

## 3. Project Layout

```
echo-list/
├── package.json              # Manifest: commands, preferences, AI tools, deps
├── package-lock.json         # MUST be committed — CI uses npm ci
├── tsconfig.json
├── eslint.config.js          # Extends @raycast/eslint-config
├── .prettierrc               # Prettier config
├── .gitignore
├── README.md                 # Required if extension needs setup
├── CHANGELOG.md              # h2 entries with {PR_MERGE_DATE}
├── ai.yaml                   # AI extension instructions + evals (if AI tools used)
├── assets/
│   └── command-icon.png      # 512x512 PNG, used in Raycast root
├── metadata/                 # Store screenshots
│   ├── echo-list-1.png       # 2000x1250 PNG
│   ├── echo-list-2.png
│   └── echo-list-3.png
├── src/
│   ├── echo-list.tsx         # Entry for "echo-list" command (mode: view)
│   ├── menu-bar.tsx          # Entry for menu-bar command (mode: menu-bar)
│   ├── refresh.ts            # Entry for no-view command
│   ├── tools/
│   │   └── add-echo.ts       # AI tool entry (referenced from package.json `ai.tools`)
│   ├── lib/
│   │   ├── storage.ts        # LocalStorage wrappers
│   │   └── types.ts          # Shared types
│   └── components/
│       └── EchoForm.tsx      # Reusable form
└── node_modules/             # Gitignored
```

### Naming conventions

- **Command entry files:** kebab-case matching `name` in package.json. `echo-list` command → `src/echo-list.tsx`.
- **AI tool entry files:** kebab-case matching the tool `name`. Tool `add-echo` → `src/tools/add-echo.ts`.
- **React components:** PascalCase, `.tsx` extension.
- **Hooks:** camelCase starting with `use`, `.ts` (or `.tsx` if returns JSX).
- **Utility modules:** kebab-case `.ts` under `src/lib/`.
- **Test files:** colocated as `*.test.ts(x)` next to source.
- **Asset files:** kebab-case, `.png` only (no SVG/JPG for icons).

### Where things go

| Adding | Goes in |
|---|---|
| New command (any mode) | New file in `src/` + new entry in `package.json` `commands` |
| New AI tool | New file in `src/tools/` + new entry in `package.json` `tools` |
| Reusable form | `src/components/<Name>Form.tsx` |
| Type definitions | `src/lib/types.ts` |
| Storage helpers | `src/lib/storage.ts` |
| Network helpers | `src/lib/api.ts` (wrap `useFetch`) |
| Constants (URLs, defaults) | `src/lib/constants.ts` |
| Icons referenced by commands | `assets/<name>.png` |
| Store screenshots | `metadata/<extension-slug>-<n>.png` |
| Preference defaults / labels | `package.json` `preferences` array |
| Per-command preferences | `package.json` `commands[].preferences` array |
| OAuth provider config | `src/oauth.ts` (single file with `OAuthService` instance) |
| AI instructions text | `ai.yaml` `instructions` field (not in tool files) |
| AI evaluation cases | `ai.yaml` `evals` array |
| Changelog entries | `CHANGELOG.md` h2 with `{PR_MERGE_DATE}` |
| README screenshots | `media/` (NOT `metadata/` — that is store-only) |
| Vitest tests | `*.test.ts` next to source |
| Shared mocks | `src/__mocks__/` |

---

## 4. Architecture

### Process boundaries

```
┌────────────────────────────────────────────────────────┐
│                  Raycast app (macOS)                   │
│  ┌─────────────────┐    ┌─────────────────────────┐    │
│  │ Raycast root UI │───▶│ Extension Node process   │   │
│  │ (Swift/native)  │ ⇄  │ (your TypeScript code)  │    │
│  └─────────────────┘    │  - React renderer        │   │
│                         │  - @raycast/api bridge   │   │
│                         │  - LocalStorage + Cache  │   │
│                         └─────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

Each command runs in its own short-lived Node process. State does NOT persist between command invocations except via `LocalStorage` (async, encrypted) and `Cache` (sync, transient).

### Data flow for a typical view command

```
User hits ⏎ on "Echo List" in root
  → Raycast spawns Node process
  → src/echo-list.tsx default export rendered
  → Component calls useFetch / useCachedPromise / LocalStorage
  → Returns <List> tree
  → Raycast renders native list rows
  → User picks an item
  → Action callback fires inside Node process
  → showToast / showHUD / Clipboard.copy / closeMainWindow / etc.
  → Process exits when window closes
```

### Auth flow (OAuth via `@raycast/utils`)

```
User invokes command requiring auth
  → withAccessToken HOC checks token store
  → If absent: Raycast opens system browser to provider
  → User authorizes
  → Raycast PKCE proxy receives callback
  → Token stored in encrypted Raycast keychain
  → Component re-renders with token in scope
  → getAccessToken() inside component returns the token
```

### State management flow

```
Ephemeral UI state         → useState / useReducer
Async data + cache         → useFetch / useCachedPromise (from @raycast/utils)
Cross-invocation persistent → LocalStorage.* (async)
Cross-invocation transient  → Cache (sync, evictable)
Secrets / API keys          → preferences (mode: password)
OAuth tokens                → OAuthService (handles refresh)
```

### File-to-responsibility map

| File | Responsibility |
|---|---|
| `package.json` | Manifest. Single source of truth for commands, prefs, AI tools, deps |
| `src/echo-list.tsx` | View command: renders `<List>` and actions. Default export = entry |
| `src/menu-bar.tsx` | Menu-bar command: renders `<MenuBarExtra>`. Background-refreshed |
| `src/refresh.ts` | no-view command: side-effectful function, no JSX |
| `src/tools/<name>.ts` | AI tool: typed function, default export. Called by Raycast AI |
| `src/lib/storage.ts` | Wrappers around `LocalStorage` for typed reads/writes |
| `src/lib/types.ts` | Shared TS types — never imports from `@raycast/api` |
| `src/oauth.ts` | OAuth client construction (one `OAuthService` instance) |
| `ai.yaml` | AI instructions + evals — long-form, kept out of package.json |

### Where business logic lives — and does NOT

- **Lives in:** `src/lib/*.ts` modules — pure functions, importable from any command or tool.
- **Does NOT live in:** Component bodies (re-runs on every render), AI tool default exports (must stay thin), `package.json` (manifest only).

---

## 5. Dev Workflow

### Start dev server

```bash
npm run dev
```

This runs `ray develop`, which:

- Compiles TS + JSX to a bundle Raycast can load.
- Watches `src/` and rebuilds on change.
- Pushes the build to the running Raycast app.
- Streams `console.log` output to your terminal.

### Hot reload

- Editing `src/**/*.tsx` triggers rebuild + auto-reload of the open command in ~500 ms.
- Editing `package.json` requires you to **stop and restart** `ray develop`. The manifest is read at boot.
- Editing `assets/*.png` requires restart (icons cached).
- Editing `ai.yaml` requires restart.

### Attach a debugger

#### VS Code / Cursor

`.vscode/launch.json` (also pasted in §15) provides a "Debug Raycast Extension" config. Set breakpoints in `.tsx` files, run `npm run dev` first, then F5.

For inline debugging without an editor: open Raycast, run the command, then check the terminal where `npm run dev` runs — `console.log` and stack traces stream there.

### Inspect runtime state

- **Network:** Wrap with `useFetch` and inspect terminal logs; or set `Network.com.raycast.macos.charles` proxy if using Charles Proxy.
- **LocalStorage:** Open Raycast → `Manage Extensions` command → click your extension → Storage tab.
- **Console:** Terminal running `npm run dev`.
- **React tree:** Not directly inspectable (Raycast renders to native). Add `console.log` in render path or use `useEffect` traces.

### Pre-commit checks

`package.json` `scripts.precommit` runs:

```bash
npm run lint && npm run typecheck && npm test -- --run
```

Manually before pushing a publish PR:

```bash
npm run lint -- --fix
npm run build
npx ray lint
```

### Branch + commit conventions

- One extension per branch.
- Branch name: `<extension-slug>` (matches `name` in package.json).
- Commit messages: short imperative, no Conventional Commits required by Raycast — the merge squash uses your PR title.
- PR title: `<Extension Title>` for new extensions; `[Extension Title] <change>` for updates to existing extensions.

---

## 6. Testing & Parallelization

Raycast extensions have no official E2E framework. The runtime IS the Raycast app. Two test surfaces exist:

1. **Unit tests** for `src/lib/*` pure modules — Vitest.
2. **AI evals** (`npx ray evals`) for AI tools — official Raycast harness.

### Unit tests

```bash
npm test                  # watch mode
npm test -- --run         # single run (CI)
npm test -- echo-list     # filter by file name
npm test -- -t "stores"   # filter by test name
```

Tests live next to source as `*.test.ts(x)`. Vitest is configured ESM-native — no babel.

### AI evals

```bash
npx ray evals             # runs all evals in ai.yaml
npx ray evals --grep todo # filter
```

Evals require the Raycast app open and a Pro subscription for AI access.

### What to mock, what NOT to mock

| Surface | Strategy |
|---|---|
| `@raycast/api` exports (`showToast`, `LocalStorage`, `Clipboard`) | Mock with `vi.mock("@raycast/api", ...)` per test |
| `useFetch` and other `@raycast/utils` hooks | Mock the hook return shape `{ data, isLoading, error }` |
| Network calls inside `useFetch` | Pass a custom `parseResponse` and assert; do NOT hit real APIs |
| OAuth providers | Inject a stub `OAuthService` via DI in `src/oauth.ts` |
| `LocalStorage` across tests | Reset via `vi.clearAllMocks()` in `beforeEach` |
| Pure logic in `src/lib/*` | NEVER mock — call directly |

### Coverage target

```bash
npm test -- --coverage
```

Target: 70 % line coverage on `src/lib/**`. Components and command entries are exempt (tested via manual run + AI evals).

### Parallelization patterns for AI agents

- **Safe to parallelize (disjoint files):** scaffolding multiple commands at once (each writes a new file in `src/`), creating multiple AI tools at once (each writes a new file in `src/tools/`), adding screenshots to `metadata/`.
- **MUST be sequential (shared files):** anything editing `package.json` (commands array, preferences, ai.tools), anything editing `ai.yaml`, anything bumping deps in `package-lock.json`.
- **Never run two `ray develop` processes simultaneously** — they fight over the same Raycast injection slot.

---

## 7. Logging

Raycast extensions log to **stdout/stderr captured by the `ray develop` terminal**. There is no production log destination — Raycast Pro collects crash reports automatically when an extension throws.

### Setup

No external logger. Use `console.log` / `console.error` directly. Optionally wrap in a tiny module:

```ts
// src/lib/log.ts
const prefix = "[echo-list]";
export const log = {
  info: (event: string, data?: unknown) => console.log(prefix, event, data ?? ""),
  warn: (event: string, data?: unknown) => console.warn(prefix, event, data ?? ""),
  error: (event: string, err: unknown) => console.error(prefix, event, err),
};
```

### Levels and when to use

- `info`: command boot, user action, async resolved.
- `warn`: recoverable error, fallback applied, deprecated input.
- `error`: thrown errors, network failures, schema mismatches.

### Required fields on every log line

- Module prefix (`[echo-list]`, `[tools/add-echo]`).
- Event name (`command-boot`, `fetch-start`, `oauth-refresh`).
- Optional data object — never include the user's OAuth token, never include raw API keys.

### Sample log lines

```
[echo-list] command-boot { mode: "view", launchType: "userInitiated" }
[echo-list] fetch-start { url: "https://api.example.com/items" }
[echo-list] fetch-done { count: 17, ms: 312 }
[echo-list] error fetch-failed Error: Network request failed
[tools/add-echo] tool-invoked { input: { text: "hello" } }
```

### Where logs go

- **Dev:** the terminal running `npm run dev`.
- **Prod (after Store publish):** Raycast collects unhandled errors and surfaces them under "Raycast Pro → Extension Crash Reports" in the Raycast app. There is no extension-author log dashboard.

### Grep logs locally

```bash
npm run dev 2>&1 | tee /tmp/echo-list.log
grep "fetch-done" /tmp/echo-list.log
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `npm run lint && npm run build` before declaring a task done. Both must exit 0.
2. Always declare API keys and tokens as `password` preference type, never `textfield`.
3. Always import from `@raycast/api` — never bypass it for native macOS APIs (no `child_process` to call AppleScript without a wrapper).
4. Always use `useFetch` from `@raycast/utils` for HTTP — never call `fetch` directly inside a render path.
5. Always set `isLoading` correctly on `<List>` and `<MenuBarExtra>` — Raycast otherwise spins forever.
6. Always close menu-bar commands with `isLoading={false}` when data is ready.
7. Always provide `keywords` in `package.json` `commands` to make them findable in root.
8. Always provide a 512x512 PNG icon per command and at the extension level — defaults are rejected.
9. Always set `mode` on every command in `package.json` (one of `view`, `no-view`, `menu-bar`).
10. Always use `useNavigation().push(<Detail/>)` to open detail views — never window-manage manually.
11. Always pop with `useNavigation().pop()` after a successful form submit.
12. Always wrap async work that updates state in `useEffect` cleanup-safe patterns (cancelable refs) to avoid setState-on-unmount warnings.
13. Always commit `package-lock.json` — `raycast/extensions` CI uses `npm ci`.
14. Always update `CHANGELOG.md` with `{PR_MERGE_DATE}` for any user-visible change.
15. Always add at least 3 screenshots in `metadata/` (PNG, 2000x1250) before opening a publish PR.
16. Always run `npx ray lint` before pushing — it catches manifest issues CI will reject for.
17. Always use `LocalStorage` for user data, `Cache` for derived/transient data — never reverse them.
18. Always type tool inputs with TS interfaces; the AI Extension uses these types in its prompt.
19. Always handle the case where a preference is empty in command entry — Raycast does not validate before launch.
20. Always check `environment.canAccess(AI)` before calling `AI.ask` if the feature is optional.
21. Always run AI tools as sequential awaits inside an entry; never spawn them inside `setInterval`.
22. Always use `Toast.Style.Failure` for error toasts and `Toast.Style.Success` for confirmations.

### 8.2 NEVER

1. Never store API keys in `textfield` preferences — they show in cleartext in Raycast Preferences.
2. Never call `fetch` synchronously in render — repeated requests will hammer the API. Use `useFetch`.
3. Never block the JS event loop with synchronous work over 16 ms — Raycast will jank.
4. Never use `require('child_process')` to spawn long-running processes — Raycast kills the Node process when the window closes.
5. Never call `process.exit()` — it crashes the extension host.
6. Never import from `react-dom` — Raycast does not render to DOM.
7. Never bundle `react-dom` or web-only libs (axios, jquery) — they bloat the extension.
8. Never use `setInterval` in a `view` command — the process is killed when the window closes; the interval leaks.
9. Never write to disk outside `environment.supportPath` — sandboxing will reject other paths.
10. Never `setState` after a component is unmounted — Raycast logs a warning and may crash.
11. Never ship the default Raycast icon — Store review will reject the PR.
12. Never include screenshots that show personal data (emails, real names) in `metadata/`.
13. Never break the `commands[].name` ↔ `src/<name>.{ts,tsx}` mapping — Raycast can't find the entry.
14. Never use `interval` shorter than `10s` — Raycast caps it and your command may be throttled.
15. Never amend a published changelog entry's date — keep `{PR_MERGE_DATE}` until merge.
16. Never edit `.gitignore` to include `package-lock.json` — CI breaks.
17. Never use `any` in AI tool input types — Raycast's prompt engineering relies on the schema.
18. Never call `closeMainWindow()` and then `push()` — the navigation stack is gone.
19. Never depend on `@raycast/api` being installed at runtime — it is provided by the host.
20. Never publish two extensions with overlapping command names — Raycast root will collide.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` (top-level) | every command, manifest validation | `npm install && npx ray lint && npm run build` |
| `package.json` `commands` array | which entries Raycast loads | restart `ray develop`; confirm command appears in root |
| `package.json` `preferences` | runtime config + secrets | open Raycast Prefs → Extensions → confirm new fields render |
| `package.json` `tools` | AI extension surface | `npx ray evals` and `@<extension-name>` invoke in Raycast AI |
| `package-lock.json` | CI `npm ci` resolution | `rm -rf node_modules && npm ci && npm run build` |
| `tsconfig.json` | typecheck + JSX behavior | `npm run build` (cold) — must exit 0 |
| `eslint.config.js` | lint pass on PR | `npm run lint` — must exit 0 |
| `src/<command>.tsx` | one command's runtime | invoke in Raycast root |
| `src/tools/<tool>.ts` | one AI tool | `npx ray evals` for the matching eval |
| `src/lib/storage.ts` | every command reading/writing storage | run all commands once |
| `src/lib/api.ts` | every network call | run any command that fetches; check log line `fetch-done` |
| `src/oauth.ts` | every authenticated command | sign out + sign in flow once |
| `ai.yaml` | AI extension behavior + evals | `npx ray evals` |
| `assets/*.png` | command icons | restart `ray develop`; verify icons render |
| `metadata/*.png` | Store listing only | reviewer sees them in PR preview |
| `CHANGELOG.md` | Store visible release notes | check for `{PR_MERGE_DATE}` placeholder |
| `README.md` | Store landing description | preview on GitHub PR |
| `.prettierrc` | format of every file on save | `npx prettier --check .` |
| `vitest.config.ts` | test discovery + transforms | `npm test -- --run` |
| `.vscode/launch.json` | debugger entry | F5 in VS Code starts breakpoint session |
| `.cursor/rules` | Cursor agent behavior | n/a — informational |
| `CLAUDE.md` | Claude Code agent behavior | n/a — informational |
| `node_modules/` | runtime resolution | `rm -rf node_modules && npm ci` |
| `Raycast app version` | API availability | check `@raycast/api` peer range vs installed app |

### 8.4 Definition of Done

#### Bug fix

- [ ] Repro steps documented in PR body.
- [ ] Fix verified by manual run in Raycast.
- [ ] `npm run lint && npm run build` pass.
- [ ] `CHANGELOG.md` entry with `{PR_MERGE_DATE}`.
- [ ] No new console errors when running the affected command.
- [ ] Screenshot of fixed behavior in PR.
- Do NOT edit unrelated files for "cleanup."

#### New feature (new command)

- [ ] New `commands` entry in `package.json` with `name`, `title`, `description`, `mode`, `icon`.
- [ ] New `src/<name>.tsx` with default export.
- [ ] Manual run confirms it appears in Raycast root.
- [ ] Keywords included for findability.
- [ ] `CHANGELOG.md` entry.
- [ ] At least one screenshot showing it added to `metadata/` if Store-published.

#### Refactor

- [ ] Behavior unchanged — confirm by running every command once.
- [ ] All tests pass.
- [ ] No public API of `src/lib/*` removed without callers updated.
- [ ] No version bump unless deps changed.
- Do NOT add dependencies during a refactor.

#### Dependency bump

- [ ] `package.json` and `package-lock.json` both committed.
- [ ] `npm run build` passes.
- [ ] `@raycast/api` bumps require checking the Raycast app's supported range — see https://developers.raycast.com/information/versioning.
- [ ] `CHANGELOG.md` entry only if user-facing behavior changed.

#### Schema change (preferences / commands)

- [ ] `package.json` change documented.
- [ ] Migration logic in `src/lib/storage.ts` if data shape changed.
- [ ] Restart `ray develop` to confirm new manifest loads.
- [ ] User instructions in `README.md` if a re-auth or re-config is required.

#### Copy change (titles, descriptions, README)

- [ ] No code changes.
- [ ] Run `npx ray lint` — title-case rule may flag action titles.
- [ ] Confirm in Raycast root.

### 8.5 Self-Verification Recipe

```bash
npm install                 # clean install
npm run lint                # @raycast/eslint-config — must exit 0
npm run build               # ray build — typechecks + bundles
npx ray lint                # manifest checks
npm test -- --run           # unit tests
# manual: npm run dev → invoke each command in Raycast → no console errors
```

Expected output:

- `npm install`: ends with `added N packages` and exit 0.
- `npm run lint`: silent on success; warnings allowed; errors block.
- `npm run build`: ends with `Built extension successfully` and exit 0.
- `npx ray lint`: ends with no findings or only warnings.
- `npm test -- --run`: ends with `Test Files  N passed` and exit 0.

### 8.6 Parallelization Patterns

Safe parallel subagents:

- "Scaffold three new commands: A, B, C" → each in its own `src/<name>.tsx`. Final pass merges `package.json` `commands` array sequentially.
- "Add three AI tools" → each in its own `src/tools/<name>.ts`. `package.json` `tools` and `ai.yaml` `evals` merged sequentially.
- "Add screenshots 1, 2, 3" → each writes to a unique `metadata/*.png`.

Sequential only:

- Any edit to `package.json` (manifest is the bottleneck).
- Any edit to `package-lock.json` (lockfile conflict territory).
- Any edit to `ai.yaml`.
- Running multiple `ray develop` processes — only one at a time.

---

## 9. Stack-Specific Pitfalls

1. **API key stored as `textfield`** → symptom: secret visible in Preferences UI → cause: wrong preference type → fix: change `type` to `password` in `package.json` and tell user to re-enter → detect: `npx ray lint` rule + manual review.
2. **`fetch()` in render path** → symptom: hundreds of duplicate requests, rate-limit errors → cause: render runs on every state change → fix: replace with `useFetch` from `@raycast/utils` → detect: terminal shows repeating fetch logs.
3. **Sync work blocks JS thread** → symptom: Raycast spinner stuck → cause: heavy CPU work in render or action handler → fix: move to `useEffect` and chunk → detect: command runs but UI is unresponsive.
4. **setState after unmount** → symptom: warning `Can't perform a React state update on an unmounted component` → cause: async resolves after window close → fix: use `AbortController` or check `mountedRef.current` → detect: terminal warning.
5. **`useNavigation` push then `closeMainWindow`** → symptom: black screen → cause: nav stack unmounted by close → fix: pick one — push for in-app, close for hand-off → detect: window closes but nothing visible.
6. **Default Raycast icon shipped** → symptom: PR auto-rejected → cause: didn't replace `assets/command-icon.png` → fix: design a 512x512 PNG legible in light + dark → detect: PR bot comment.
7. **Missing screenshots in `metadata/`** → symptom: Store reviewer requests changes → cause: skipped step → fix: add 3+ PNGs at 2000x1250 → detect: PR template checklist.
8. **Forgot `package-lock.json`** → symptom: CI fails on `npm ci` → cause: it's gitignored or skipped → fix: `git add package-lock.json` → detect: PR check fails.
9. **`mode` missing on a command** → symptom: command doesn't appear → cause: manifest invalid, silently skipped → fix: add `"mode": "view" | "no-view" | "menu-bar"` → detect: `npx ray lint` warning.
10. **Background `interval` under 10s** → symptom: command throttled or never runs → cause: too aggressive → fix: set ≥ `10s`; for typical menu-bar use `5m` or `15m` → detect: command logs show no invocation.
11. **AI tool `any` types** → symptom: Raycast AI passes garbage args → cause: schema is unhelpful → fix: declare narrow TS types on input → detect: eval runs fail with wrong tool args.
12. **Hot reload didn't pick up `package.json`** → symptom: new command doesn't appear → cause: `ray develop` reads manifest at boot → fix: stop and restart `ray develop` → detect: terminal shows new command on restart.
13. **Toast logged but not shown** → symptom: nothing happens → cause: `showToast` was called after `closeMainWindow` → fix: re-order or use `showHUD` instead → detect: terminal shows toast call.
14. **Menu-bar `isLoading` never set false** → symptom: spinner forever → cause: forgot final state → fix: set `isLoading={false}` once data resolves → detect: visible spinner stuck.
15. **OAuth refresh skipped** → symptom: 401 after some time → cause: not using `OAuthService` correctly → fix: wrap with `withAccessToken(authProvider)(Command)` → detect: log `fetch-failed` on token expiry.
16. **`environment.supportPath` not used for files** → symptom: writes succeed in dev, fail at random in prod → cause: wrote to non-sandboxed path → fix: always prefix with `environment.supportPath` → detect: EACCES on user machine.
17. **JSX in `no-view` command** → symptom: build error or runtime crash → cause: `no-view` runs as plain function → fix: change `mode` to `view` or remove JSX → detect: build log.
18. **`commands[].name` mismatched to file** → symptom: "Command not found" → cause: typo or rename → fix: `name` in package.json must equal filename without extension → detect: error on first run.
19. **Eval missing mocks** → symptom: `npx ray evals` errors with "tool returned undefined" → cause: forgot to mock side-effects → fix: add `mocks` block in `ai.yaml` for required tool calls → detect: eval log.
20. **`@raycast/api` peer mismatch** → symptom: command crashes on app upgrade → cause: extension built against newer API than user's Raycast app → fix: target the lowest API version containing required features → detect: store reviewer flags.
21. **Forgot Title Case in action titles** → symptom: ESLint error from `@raycast/eslint-plugin` → cause: convention rule → fix: capitalize each significant word ("Copy URL" not "Copy url") → detect: `npm run lint`.
22. **Ran `interval` on a `view` command** → symptom: ignored entirely → cause: `interval` only works on `no-view` and `menu-bar` → fix: change mode or remove interval → detect: `npx ray lint`.

---

## 10. Performance Budgets

| Budget | Target | Measurement |
|---|---|---|
| Cold-start (command open) | < 250 ms to first render | manual stopwatch on `npm run dev` |
| List render | < 50 ms for 100 items | `console.time("render")` in component |
| Network call | < 800 ms p50 via `useFetch` | log `ms` in `fetch-done` |
| Bundle size (per command) | < 2 MB | `ls -lh node_modules/.bin/../../../.raycast/dist/` after build |
| Memory (Node process) | < 150 MB resident | Activity Monitor → Raycast Helper |
| Background refresh runtime | < 5 s per invocation | `console.time` in menu-bar / no-view entry |

Exceeded? In order:

1. Drop unused dependencies (every npm dep ships in your bundle).
2. Replace `axios`/`lodash` with native `fetch` and array methods.
3. Split a heavy command into a `view` shell + a `no-view` background refresher that pre-warms `Cache`.
4. If still over: file an issue — Raycast may cap commands.

---

## 11. Security

- **Secret storage:** `password` preference type only. Stored in encrypted Raycast keychain. NEVER `.env` files, NEVER `textfield`, NEVER hardcoded.
- **What NEVER goes in preferences (any type):** OAuth refresh tokens (use `OAuthService`), user passwords (use OAuth), encryption keys for user data (use `LocalStorage` with per-user random key).
- **Auth threat model:**
  - Each user's Raycast keychain is sandboxed per-extension.
  - Preference values are visible to the user but not other extensions.
  - OAuth tokens managed by `OAuthService` are not visible to the user.
- **Input validation boundary:** every preference and every AI tool input — validate types, lengths, regexes before use. Treat as untrusted.
- **Output escaping:** when rendering user data into `<Detail markdown>`, escape backticks and brackets. Raycast renders markdown.
- **Permissions:** Raycast extensions don't request OS permissions directly; the Raycast app holds them. If your extension hits the network, it inherits the app's network access. No additional manifest permissions needed.
- **Dependency audit:**
  ```bash
  npm audit --audit-level=high
  ```
  Run before every publish PR. Cadence: monthly + before each release.
- **Top 5 risks unique to Raycast:**
  1. Leaked API keys via `textfield` preferences (default risk).
  2. Tokens logged via `console.log({ token })` reaching Raycast crash reports.
  3. AI tool that mutates external systems without confirmation prompt.
  4. `child_process.exec` with unsanitized user input (RCE).
  5. Markdown injection in `<Detail>` from API responses.

---

## 12. Deploy

Raycast extensions ship via Pull Request to the `raycast/extensions` GitHub monorepo. There is **no GitHub Action `release.yml`** in your extension repo — releases happen via the monorepo PR flow.

### Full release flow, command by command

```bash
# 0. From a clean tree
git status               # must be clean

# 1. Final QA in your standalone repo (if you used npm init outside the monorepo)
npm run lint
npm run build
npx ray lint
npm test -- --run
npm run dev              # smoke test every command in Raycast app

# 2. Move extension into the monorepo
cd ~/code/raycast-extensions
git checkout -b echo-list   # branch named after extension slug
mkdir -p extensions/echo-list
cp -r ~/code/echo-list/. extensions/echo-list/
rm -rf extensions/echo-list/node_modules

# 3. Install + build inside monorepo position
cd extensions/echo-list
npm install
npm run build

# 4. Confirm changelog has a {PR_MERGE_DATE} entry for new content
# (Edit CHANGELOG.md if not.)

# 5. Commit and push
cd ~/code/raycast-extensions
git add extensions/echo-list
git commit -m "Add Echo List extension"
git push fork echo-list

# 6. Open PR
gh pr create \
  --repo raycast/extensions \
  --base main \
  --head <your-gh-username>:echo-list \
  --title "Echo List" \
  --body-file extensions/echo-list/.github/PR_BODY.md   # see template below
```

### PR body template

```markdown
## Description

Echo List — echoes back what you type as a list.

## Screencast

<drag-and-drop a short demo gif>

## Checklist

- [x] I read the [extension guidelines](https://developers.raycast.com/basics/prepare-an-extension-for-store)
- [x] Title and subtitle are descriptive
- [x] Screenshots in metadata/ (3+) at 2000x1250
- [x] CHANGELOG.md uses {PR_MERGE_DATE}
- [x] package-lock.json committed
- [x] Linted with `npm run lint`
```

### Staging vs prod

There is no staging Store. Local `ray develop` IS staging. Production = merged PR.

### Rollback

You cannot revert a published version directly. To roll back: open a new PR that bumps the changelog and reverts the offending commit. Raycast pushes the new version automatically. Window: instant — there is no rollback grace period because every merge is a release.

### Health check

After merge: `open raycast://extensions/<author>/echo-list` should launch your published command. If 404, contact Raycast Slack `#extensions` (linked from `raycast/extensions` README).

### Versioning scheme

Raycast extensions do NOT have a version field in `package.json` for the Store. The Store version is the date of the merged PR. Use `CHANGELOG.md` h2 entries as the canonical history.

### Auto-update

Users get extension updates automatically when Raycast app syncs. No author action.

### Cost estimate per 1k MAU

$0. Raycast does not charge extension authors. AI calls inside extensions count against the user's Raycast Pro quota, not the author's.

---

## 13. Claude Code Integration

### CLAUDE.md (paste into project root)

```markdown
# CLAUDE.md — Echo List Raycast extension

This project follows /opt/Loopa/rulebooks/raycast-extension.md. Read it before any change.

## Stack
- Raycast extension, TypeScript + React, `@raycast/api` 1.104, `@raycast/utils` 2.2.
- macOS only. Node 22.14+. npm (NOT pnpm/bun).

## Key commands
- `npm install` — install deps.
- `npm run dev` — `ray develop`, hot reload into Raycast app.
- `npm run build` — `ray build`.
- `npm run lint` — ESLint via `@raycast/eslint-config`.
- `npx ray lint` — manifest validation.
- `npm test -- --run` — Vitest single run.
- `npx ray evals` — AI tool evals.

## Banned in this codebase
- `fetch(...)` in render path — use `useFetch` from `@raycast/utils`.
- `textfield` preference for any secret — use `password`.
- `setInterval` in `view` commands — process is killed on close.
- `process.exit()` anywhere.
- Default Raycast icon — replace `assets/command-icon.png`.
- Editing `package.json` in parallel subagents.

## Definition of done
- `npm run lint && npm run build && npx ray lint && npm test -- --run` all green.
- Every changed command exercised manually in Raycast.
- `CHANGELOG.md` updated with `{PR_MERGE_DATE}`.

## Skills to invoke
- `/test-driven-development` before adding new `src/lib/*` modules.
- `/systematic-debugging` for runtime weirdness.
- `/verification-before-completion` before reporting done.
- `/ship` only after manual QA in Raycast.

## Layout
See §3 of /opt/Loopa/rulebooks/raycast-extension.md.
```

### .claude/settings.json

```json
{
  "permissions": {
    "allow": [
      "Bash(npm install)",
      "Bash(npm install:*)",
      "Bash(npm ci)",
      "Bash(npm run build)",
      "Bash(npm run lint)",
      "Bash(npm run lint -- --fix)",
      "Bash(npm test -- --run)",
      "Bash(npm test -- --run:*)",
      "Bash(npx ray lint)",
      "Bash(npx ray lint --fix)",
      "Bash(npx ray build)",
      "Bash(npx ray evals)",
      "Bash(npx ray evals:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git add:*)",
      "Bash(git commit -m:*)",
      "Bash(git log:*)",
      "Bash(gh pr create:*)",
      "Bash(gh pr view:*)"
    ],
    "deny": [
      "Bash(rm -rf:*)",
      "Bash(npm publish:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npx prettier --write --ignore-unknown \"$CLAUDE_FILE_PATHS\" 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "npm run lint --silent && npm run build --silent" }
        ]
      }
    ]
  }
}
```

### Slash commands that save time

- `/test-driven-development` — write Vitest specs for `src/lib/*` first.
- `/systematic-debugging` — when a command misbehaves in Raycast.
- `/ship` — only after manual run; opens PR to `raycast/extensions`.
- `/review` — pre-merge sanity on the PR.
- `/verification-before-completion` — runs the recipe in §8.5.

---

## 14. Codex Integration

### AGENTS.md

```markdown
# AGENTS.md — Echo List Raycast extension

Source of truth: /opt/Loopa/rulebooks/raycast-extension.md (read before any change).

## Stack
Raycast extension. TypeScript + React. `@raycast/api` 1.104, `@raycast/utils` 2.2, Node 22.14, npm.

## Build / test
- `npm run build` — must exit 0.
- `npm run lint` — must exit 0.
- `npx ray lint` — manifest checks.
- `npm test -- --run` — Vitest.
- Manual: `npm run dev` then invoke each command in Raycast.

## Constraints
- macOS only.
- Use `password` preference for secrets, never `textfield`.
- Use `useFetch` for HTTP, never raw `fetch` in render.
- Each command's `name` must match its file: `src/<name>.{ts,tsx}`.
- Background `interval` ≥ `10s`, applies only to `no-view` and `menu-bar` modes.
- `package-lock.json` is committed.

## Workflow
1. Plan in plan-mode if changing manifest.
2. Edit one command at a time.
3. Run §8.5 self-verification.
4. Update `CHANGELOG.md` with `{PR_MERGE_DATE}`.
5. Open PR via `gh`.
```

### .codex/config.toml

```toml
model = "gpt-5-codex"
sandbox = "workspace-write"
approval-mode = "on-failure"

[mcp_servers.fs]
command = "npx"
args = ["@modelcontextprotocol/server-filesystem", "."]

[project]
typecheck-cmd = "npm run build"
lint-cmd = "npm run lint"
test-cmd = "npm test -- --run"
```

### Where Codex differs

- Codex defaults to fewer auto-approvals — keep `approval-mode = "on-failure"` so it pauses when `npm run build` fails.
- Codex does not have skills like `/ship`. The publish flow in §12 must be run manually after Codex finishes.
- Codex's plan-mode is helpful for `package.json` edits; insist on plan-mode for any manifest change.

---

## 15. Cursor / Other Editors

### .cursor/rules

```text
# .cursor/rules — Raycast extension

This is a Raycast extension. macOS only. TypeScript + React + @raycast/api.

## ALWAYS
- Use `useFetch` from `@raycast/utils` for HTTP. Never `fetch` in render path.
- Use `password` preference type for secrets.
- Set `mode` on every command in `package.json`: view | no-view | menu-bar.
- Match `commands[].name` to filename in `src/`.
- Provide a 512x512 PNG icon per command.
- Pop after form submit: `useNavigation().pop()`.
- Set `isLoading={false}` once data resolves on `<List>` / `<MenuBarExtra>`.
- Title-case action titles (e.g. "Copy URL" not "Copy url").
- Run `npm run lint && npm run build && npx ray lint` before declaring done.

## NEVER
- Store secrets in `textfield`.
- Block JS thread with sync work.
- Use `react-dom`, `setInterval` in `view` commands, or `process.exit()`.
- Ship the default Raycast icon.
- Edit `package.json` in parallel subagents.
- Use `interval` < `10s`.
- `setState` after unmount — use AbortController or mounted ref.

## Layout
- Commands: `src/<name>.tsx` (view) or `src/<name>.ts` (no-view).
- AI tools: `src/tools/<name>.ts`.
- Shared logic: `src/lib/*.ts`.
- Icons: `assets/<name>.png` (512x512).
- Store screenshots: `metadata/<slug>-<n>.png` (2000x1250).

## Verification
After changes: npm run lint, npm run build, npx ray lint, npm test -- --run, manual run in Raycast.
```

### .vscode/extensions.json

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "raycast.raycast"
  ]
}
```

### .vscode/launch.json

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Raycast Extension",
      "runtimeExecutable": "npm",
      "runtimeArgs": ["run", "dev"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Run Vitest",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["--run"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    }
  ]
}
```

---

## 16. First-PR Scaffold

In order, create:

#### `package.json`

```json
{
  "$schema": "https://www.raycast.com/schemas/extension.json",
  "name": "echo-list",
  "title": "Echo List",
  "description": "Echo back what you type as a list with persistent history.",
  "icon": "command-icon.png",
  "author": "your_raycast_username",
  "categories": ["Productivity"],
  "license": "MIT",
  "commands": [
    {
      "name": "echo-list",
      "title": "Echo List",
      "subtitle": "Echo",
      "description": "Type to add an echo; recent echoes appear as a list.",
      "mode": "view",
      "icon": "command-icon.png",
      "keywords": ["echo", "list", "scratchpad"]
    },
    {
      "name": "menu-bar",
      "title": "Echo Count",
      "description": "Show the current echo count in the menu bar.",
      "mode": "menu-bar",
      "icon": "command-icon.png",
      "interval": "15m"
    },
    {
      "name": "refresh",
      "title": "Clear Echoes",
      "description": "Clear all stored echoes.",
      "mode": "no-view",
      "icon": "command-icon.png"
    }
  ],
  "tools": [
    {
      "name": "add-echo",
      "title": "Add Echo",
      "description": "Append a new echo to the user's echo list."
    },
    {
      "name": "list-echoes",
      "title": "List Echoes",
      "description": "Return the current list of echoes."
    }
  ],
  "preferences": [
    {
      "name": "maxEchoes",
      "title": "Max Echoes",
      "description": "Maximum number of echoes to keep.",
      "type": "textfield",
      "required": false,
      "default": "100"
    },
    {
      "name": "apiToken",
      "title": "API Token",
      "description": "Token for syncing echoes to a remote service (optional).",
      "type": "password",
      "required": false
    }
  ],
  "ai": {
    "instructions": "When the user asks about their echoes, call list-echoes. When they ask to remember something, call add-echo. Never invent echoes that aren't returned by list-echoes."
  },
  "dependencies": {
    "@raycast/api": "^1.104.5",
    "@raycast/utils": "^2.2.2"
  },
  "devDependencies": {
    "@raycast/eslint-config": "^2.1.1",
    "@types/node": "22.14.0",
    "@types/react": "18.3.12",
    "eslint": "^9.18.0",
    "prettier": "^3.4.2",
    "typescript": "^5.8.3",
    "vitest": "^3.2.4"
  },
  "scripts": {
    "build": "ray build",
    "dev": "ray develop",
    "fix-lint": "ray lint --fix",
    "lint": "ray lint",
    "publish": "npx @raycast/api@latest publish",
    "test": "vitest"
  }
}
```

#### `tsconfig.json`

```json
{
  "$schema": "https://json.schemastore.org/tsconfig",
  "include": ["src/**/*", "raycast-env.d.ts"],
  "compilerOptions": {
    "lib": ["ES2023"],
    "module": "commonjs",
    "target": "ES2022",
    "strict": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "jsx": "react-jsx",
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "forceConsistentCasingInFileNames": true,
    "noEmit": true,
    "skipLibCheck": true
  }
}
```

#### `eslint.config.js`

```js
const { defineConfig } = require("eslint/config");
const raycastConfig = require("@raycast/eslint-config");

module.exports = defineConfig([...raycastConfig]);
```

#### `.prettierrc`

```json
{
  "printWidth": 120,
  "singleQuote": false,
  "trailingComma": "all",
  "semi": true
}
```

#### `.gitignore`

```
node_modules/
.DS_Store
*.log
.raycast/
.vscode/settings.json
coverage/
```

#### `.raycastignore`

(Optional. Used to exclude files from the published bundle. Useful for keeping fixtures.)

```
*.test.ts
*.test.tsx
__tests__/
fixtures/
```

#### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/lib/**"],
    },
  },
});
```

#### `src/echo-list.tsx`

```tsx
import { Action, ActionPanel, Form, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import { addEcho, clearEchoes, listEchoes } from "./lib/storage";

interface Echo {
  id: string;
  text: string;
  createdAt: number;
}

export default function EchoListCommand() {
  const [echoes, setEchoes] = useState<Echo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { push } = useNavigation();

  useEffect(() => {
    let mounted = true;
    listEchoes().then((data) => {
      if (mounted) {
        setEchoes(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <List
      isLoading={isLoading}
      searchBarPlaceholder="Search echoes…"
      actions={
        <ActionPanel>
          <Action title="New Echo" icon={Icon.Plus} onAction={() => push(<NewEchoForm onCreated={refresh} />)} />
        </ActionPanel>
      }
    >
      {echoes.length === 0 ? (
        <List.EmptyView icon={Icon.SpeechBubble} title="No echoes yet" description="Press ⌘N to add one." />
      ) : (
        echoes.map((e) => (
          <List.Item
            key={e.id}
            title={e.text}
            subtitle={new Date(e.createdAt).toLocaleString()}
            actions={
              <ActionPanel>
                <Action.CopyToClipboard content={e.text} />
                <Action title="New Echo" icon={Icon.Plus} onAction={() => push(<NewEchoForm onCreated={refresh} />)} />
                <Action
                  title="Clear All"
                  icon={Icon.Trash}
                  style={Action.Style.Destructive}
                  onAction={async () => {
                    await clearEchoes();
                    setEchoes([]);
                    await showToast({ style: Toast.Style.Success, title: "Cleared" });
                  }}
                />
              </ActionPanel>
            }
          />
        ))
      )}
    </List>
  );

  async function refresh() {
    setIsLoading(true);
    setEchoes(await listEchoes());
    setIsLoading(false);
  }
}

function NewEchoForm({ onCreated }: { onCreated: () => void }) {
  const { pop } = useNavigation();
  const [text, setText] = useState("");

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Save Echo"
            onSubmit={async () => {
              if (!text.trim()) {
                await showToast({ style: Toast.Style.Failure, title: "Echo cannot be empty" });
                return;
              }
              await addEcho(text.trim());
              await showToast({ style: Toast.Style.Success, title: "Echo saved" });
              onCreated();
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.TextArea id="text" title="Echo" placeholder="Type something to remember…" value={text} onChange={setText} />
    </Form>
  );
}
```

#### `src/menu-bar.tsx`

```tsx
import { Icon, MenuBarExtra } from "@raycast/api";
import { useEffect, useState } from "react";
import { listEchoes } from "./lib/storage";

export default function EchoCountMenuBar() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    listEchoes().then((d) => {
      if (mounted) setCount(d.length);
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MenuBarExtra icon={Icon.SpeechBubble} title={count === null ? "…" : String(count)} isLoading={count === null}>
      <MenuBarExtra.Item title={`${count ?? 0} echoes stored`} />
    </MenuBarExtra>
  );
}
```

#### `src/refresh.ts`

```ts
import { showHUD } from "@raycast/api";
import { clearEchoes } from "./lib/storage";

export default async function clear() {
  await clearEchoes();
  await showHUD("Echoes cleared");
}
```

#### `src/lib/storage.ts`

```ts
import { LocalStorage } from "@raycast/api";

const KEY = "echoes/v1";

export interface Echo {
  id: string;
  text: string;
  createdAt: number;
}

export async function listEchoes(): Promise<Echo[]> {
  const raw = await LocalStorage.getItem<string>(KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Echo[];
  } catch {
    return [];
  }
}

export async function addEcho(text: string): Promise<Echo> {
  const echoes = await listEchoes();
  const next: Echo = { id: cryptoId(), text, createdAt: Date.now() };
  echoes.unshift(next);
  await LocalStorage.setItem(KEY, JSON.stringify(echoes.slice(0, 200)));
  return next;
}

export async function clearEchoes(): Promise<void> {
  await LocalStorage.removeItem(KEY);
}

function cryptoId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
}
```

#### `src/lib/storage.test.ts`

```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { addEcho, clearEchoes, listEchoes } from "./storage";

const store = new Map<string, string>();
vi.mock("@raycast/api", () => ({
  LocalStorage: {
    getItem: vi.fn(async (k: string) => store.get(k)),
    setItem: vi.fn(async (k: string, v: string) => {
      store.set(k, v);
    }),
    removeItem: vi.fn(async (k: string) => {
      store.delete(k);
    }),
  },
}));

beforeEach(() => store.clear());

describe("storage", () => {
  it("stores and retrieves an echo", async () => {
    await addEcho("hello");
    const all = await listEchoes();
    expect(all).toHaveLength(1);
    expect(all[0].text).toBe("hello");
  });

  it("clears all echoes", async () => {
    await addEcho("a");
    await clearEchoes();
    expect(await listEchoes()).toEqual([]);
  });

  it("orders newest first", async () => {
    await addEcho("first");
    await addEcho("second");
    const all = await listEchoes();
    expect(all[0].text).toBe("second");
  });
});
```

#### `src/tools/add-echo.ts`

```ts
import { addEcho } from "../lib/storage";

interface Input {
  text: string;
}

export default async function tool({ text }: Input) {
  const echo = await addEcho(text);
  return { id: echo.id, text: echo.text, createdAt: echo.createdAt };
}
```

#### `src/tools/list-echoes.ts`

```ts
import { listEchoes } from "../lib/storage";

export default async function tool() {
  const echoes = await listEchoes();
  return { count: echoes.length, echoes };
}
```

#### `ai.yaml`

```yaml
instructions: |
  You are an assistant that manages the user's echo list.
  - Use `list-echoes` to read the current list.
  - Use `add-echo` to append a new entry.
  - Never invent echoes that are not in the list.
  - When summarizing, return a short bullet list (most recent first).

evals:
  - input: "@echo-list what are my echoes?"
    mocks:
      list-echoes:
        count: 2
        echoes:
          - id: "abc"
            text: "Buy milk"
            createdAt: 1714000000000
          - id: "def"
            text: "Call mom"
            createdAt: 1714001000000
    expected:
      - callsTool: list-echoes
  - input: "@echo-list remember to ship the rulebook"
    mocks:
      add-echo:
        id: "ghi"
        text: "ship the rulebook"
        createdAt: 1714002000000
    expected:
      - callsTool: add-echo
        withArgs:
          text: "ship the rulebook"
```

#### `CHANGELOG.md`

```markdown
# Echo List Changelog

## [Initial Version] - {PR_MERGE_DATE}

- Add Echo List view command with create / copy / clear actions.
- Add menu-bar command showing echo count, refreshing every 15 minutes.
- Add no-view "Clear Echoes" command.
- Add AI tools `add-echo` and `list-echoes` with evals.
```

#### `README.md`

```markdown
# Echo List

A simple Raycast extension that stores short notes ("echoes") locally and lets the AI surface them.

## Features

- View command to add and browse echoes.
- Menu-bar count.
- AI tools: ask Raycast AI to add or list echoes.

## Setup

No setup required. Optional API token preference for syncing (currently a no-op placeholder).
```

#### `assets/command-icon.png`

A 512x512 PNG. Create with any tool. Must be legible in light and dark themes. Default Raycast icons are rejected on PR.

#### `metadata/echo-list-1.png`, `echo-list-2.png`, `echo-list-3.png`

2000x1250 PNGs of the extension in use. At least 3 required for Store listing.

After all files are in place:

```bash
npm install
npm run build
npx ray lint
npm test -- --run
git init && git add . && git commit -m "Initial Echo List extension"
```

The extension is now ready to copy into `raycast/extensions/extensions/echo-list/` and PR.

---

## 17. Idea → MVP Path

Goal: from `npm init raycast-extension` to a merged PR in the Raycast Store. Generic "echo-list" used as the worked example.

### Phase 1 — Schema (1 AI session)

- Define `Echo` interface in `src/lib/types.ts`.
- Storage layer in `src/lib/storage.ts` (LocalStorage wrappers).
- Exit: `listEchoes()`, `addEcho()`, `clearEchoes()` typed and unit-tested.
- Files touched: `src/lib/types.ts`, `src/lib/storage.ts`, `src/lib/storage.test.ts`.

### Phase 2 — Backbone (1 AI session)

- `src/echo-list.tsx` view command with empty `<List>`.
- `src/menu-bar.tsx` empty `<MenuBarExtra>`.
- `src/refresh.ts` no-view stub.
- `package.json` `commands` array populated.
- Exit: each command appears in Raycast root via `npm run dev`.

### Phase 3 — Vertical slice (1-2 AI sessions)

- Add Echo via Form, Copy via Clipboard action, Clear via destructive action.
- Wire `useNavigation().push(<NewEchoForm/>)` and `pop()` after submit.
- Menu-bar shows live count via `useEffect`.
- Manual smoke: add 3 echoes, see them in list, copy one, clear all.
- Exit: full CRUD without AI tools, all unit tests green.

### Phase 4 — AI tools + evals (1 AI session)

- `src/tools/add-echo.ts`, `src/tools/list-echoes.ts`.
- `package.json` `tools` and `ai.instructions`, OR `ai.yaml`.
- Two evals.
- Exit: `npx ray evals` passes; `@echo-list what are my echoes` works in Raycast AI.

### Phase 5 — Ship + monitor (1 AI session)

- Generate icon (512x512) and 3 screenshots (2000x1250).
- Fork `raycast/extensions`, copy in, branch, PR.
- Address reviewer comments.
- After merge: open `raycast://extensions/<author>/echo-list` → installed.
- Watch for Raycast crash reports under Pro → Extension Crash Reports.

---

## 18. Feature Recipes

### 18.1 OAuth (GitHub built-in provider)

`src/oauth.ts`:

```ts
import { OAuthService } from "@raycast/utils";

export const github = OAuthService.github({
  scope: "repo read:user",
});
```

In a command:

```tsx
import { withAccessToken, getAccessToken } from "@raycast/utils";
import { github } from "./oauth";

function Command() {
  const { token } = getAccessToken();
  // use token in fetch
  return null;
}

export default withAccessToken(github)(Command);
```

### 18.2 File upload via system file picker

```tsx
import { Action, ActionPanel, Form, useNavigation, showToast, Toast } from "@raycast/api";

export default function UploadForm() {
  const { pop } = useNavigation();
  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="Upload"
            onSubmit={async (values) => {
              const path = (values.file as string[])[0];
              await showToast({ style: Toast.Style.Success, title: `Got ${path}` });
              pop();
            }}
          />
        </ActionPanel>
      }
    >
      <Form.FilePicker id="file" title="File" allowMultipleSelection={false} />
    </Form>
  );
}
```

### 18.3 Background refresh on menu-bar

`package.json` command entry:

```json
{ "name": "menu-bar", "title": "Echo Count", "mode": "menu-bar", "interval": "15m" }
```

Inside the component, branch on `environment.launchType === LaunchType.Background` to skip UI work that's only meaningful in user-initiated runs.

### 18.4 Realtime updates via SSE

Use `useFetch` with `streamData: true` (post-2.2 utils) or a manual `fetch` inside `useEffect` with an `AbortController`. Keep streams short — Raycast kills the process when the window closes.

### 18.5 Search via List filtering

```tsx
<List filtering={true} searchBarPlaceholder="Type to filter…">
  {items.map((i) => (
    <List.Item key={i.id} title={i.title} keywords={[i.tag]} />
  ))}
</List>
```

Set `filtering={false}` when implementing custom server-side filtering.

### 18.6 Internationalization

Raycast does not ship i18n primitives. Use a small dictionary keyed by `environment.systemLocale`:

```ts
import { environment } from "@raycast/api";
const t = (key: string) => DICT[environment.systemLocale]?.[key] ?? DICT.en[key] ?? key;
```

### 18.7 Dark mode

Raycast renders native — your extension automatically follows system theme. Provide icons that read in both. Test by toggling System Settings → Appearance.

### 18.8 Analytics events

There is no first-party analytics in Raycast. If you need analytics, send fire-and-forget POSTs from a `useEffect` with a 500 ms debounce. Avoid analytics for sensitive extensions; respect user privacy. Always disclose in README.

### 18.9 Stripe / IAP

Not supported. Raycast Pro is the only commercial layer. Author monetization is via Raycast's own programs.

### 18.10 Push notifications

`showToast` and `showHUD` cover in-app feedback. There is no remote push system — rely on `interval` background refresh + `showHUD` to alert the user.

### 18.11 Deeplinks (cross-extension command launch)

```ts
import { createDeeplink, DeeplinkType } from "@raycast/utils";

const url = createDeeplink({
  command: "echo-list",
  arguments: { query: "hello" },
});
// Open via Action.OpenInBrowser or copy to clipboard
```

### 18.12 Background jobs / cron

`mode: "no-view"` + `interval: "1h"`. Keep the function fast (< 5 s). Persist anything via `LocalStorage`.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Cannot find module '@raycast/api'` | `rm -rf node_modules package-lock.json && npm install` |
| `Raycast is not running` | Open the Raycast app first |
| `JSX element class does not support attributes` | Set `"jsx": "react-jsx"` in tsconfig.json |
| `Module '@raycast/api' has no exported member 'X'` | Bump `@raycast/api` to ≥ the version that introduced X |
| `Build failed: command 'echo-list' not found in src/` | Match `commands[].name` to filename in `src/` |
| `Default Raycast icon detected` (PR check) | Replace `assets/command-icon.png` with a custom 512x512 PNG |
| `package-lock.json missing` (PR check) | `git add package-lock.json` |
| `npm ci fails on Linux` (CI) | Drop platform-specific deps; ensure no `darwin-arm64` only modules |
| `interval too short` lint warning | Set `interval` to ≥ `10s`; for menu-bar use ≥ `1m` |
| `setState on unmounted component` warning | Track mount state with a `useRef(true)` cleared in cleanup |
| Form submit fires twice | Ensure no parent `<ActionPanel>` re-renders during submit |
| `useFetch` returns stale data forever | Pass `keepPreviousData: false` or change query key |
| OAuth flow hangs | Restart Raycast app; clear keychain entry under Preferences → Connections |
| AI tool returns `undefined` in eval | Add the tool call to `mocks` in `ai.yaml` |
| Menu-bar spinner forever | Always set `isLoading={false}` in a final `setState` |
| Hot reload didn't pick up new command | Restart `ray develop` (manifest is read at boot) |
| `LocalStorage` returns `undefined` immediately after `setItem` | `setItem` returns a promise — `await` it before reading |
| Toast disappears instantly | Don't follow with `closeMainWindow`; use `showHUD` if window must close |
| `npm run build` exits 0 but command crashes | Check terminal for runtime stack traces; rebuild after `rm -rf node_modules` |
| PR CI fails on `lint` | Run `npx ray lint --fix` then commit |
| AI extension never reaches your tool | Ensure tool is listed in `package.json` `tools`; restart Raycast |
| Icon looks blurry | Source must be 512x512 PNG; do not upscale a small asset |
| Screenshots not displayed in PR preview | Confirm size 2000x1250 and PNG format in `metadata/` |
| Command appears twice in root | Check for duplicate `name` in `commands` |
| `environment.canAccess(AI)` false in dev | Sign into Raycast Pro or guard the call |
| Cache returns stale on next launch | `Cache` is transient; persist via `LocalStorage` instead |
| TypeScript "Cannot find name 'JSX'" | Upgrade `@types/react` to 18.3.x |
| `npm publish` (manual) fails | You don't `npm publish` — you PR to `raycast/extensions` |
| Action title flagged by ESLint | Use Title Case ("Copy URL", not "Copy url") |
| `withAccessToken` wraps but token is empty | Ensure the OAuth provider's `scope` is correct |
| New preference doesn't appear | Restart Raycast app; manifest changes need full reload |

---

## 20. Glossary

- **Raycast** — macOS productivity launcher (Spotlight replacement) with extensions.
- **Extension** — a TypeScript+React package that adds commands to Raycast.
- **Command** — a single user-invokable action inside an extension. Has a `mode`.
- **Mode** — `view` (renders UI), `no-view` (side-effectful function), `menu-bar` (icon in macOS menu bar).
- **Manifest** — `package.json`. Declares everything Raycast needs.
- **Preference** — user-configurable input declared in the manifest. Types: textfield, password, checkbox, dropdown, file, directory, appPicker.
- **AI Extension** — extension exposing `tools` Raycast AI can call.
- **Tool** — an AI-callable function. Default-export module under `src/tools/`.
- **Eval** — automated test of an AI tool's behavior under a given user input.
- **`ray` CLI** — Raycast's bundled tool: `ray develop`, `ray build`, `ray lint`, `ray evals`.
- **`@raycast/api`** — runtime API (UI components, OS bridges).
- **`@raycast/utils`** — community-blessed hooks (`useFetch`, OAuth helpers, etc.).
- **OAuth PKCE** — Proof Key for Code Exchange; secret-less OAuth used by `OAuthService`.
- **Raycast PKCE proxy** — Raycast-hosted endpoint that lets non-PKCE OAuth providers work.
- **`metadata/`** — folder of PNG screenshots shown on the Store listing.
- **`{PR_MERGE_DATE}`** — placeholder token Raycast replaces with the merge date.
- **Raycast Store** — public catalog of extensions; updated by merging PRs to `raycast/extensions`.
- **`raycast/extensions`** — the GitHub monorepo; the only path to publish.
- **`useNavigation`** — hook returning `push` / `pop` for Raycast's navigation stack.
- **`LocalStorage`** — async, encrypted, persistent KV store per extension.
- **`Cache`** — sync, transient KV store; evicted aggressively.
- **`environment`** — runtime info object (locale, theme, launch type, support path).
- **`launchType`** — `userInitiated` or `background`.
- **Background refresh** — Raycast invoking `no-view`/`menu-bar` commands at the manifest's `interval`.

---

## 21. Update Cadence

- This rulebook is valid for **Raycast app 1.84+**, **`@raycast/api` 1.104.x**, **`@raycast/utils` 2.2.x**, **Node 22.14+**, **TypeScript 5.8+**.
- Re-run the generator when:
  - `@raycast/api` major bump.
  - Raycast announces a new command mode.
  - AI Tools API schema changes (new fields in `package.json` `tools` or `ai.yaml`).
  - `raycast/extensions` PR template changes.
  - Security advisory affecting `@raycast/api` or `@raycast/utils`.

Date stamp: 2026-04-27.
