# Obsidian Community Plugin — Rulebook

TypeScript + esbuild plugin that loads inside Obsidian Desktop and Mobile, ships through the Community Plugins directory, and auto-updates from your GitHub Releases.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 | Required for `obsidian` types; safer than plain JS. |
| Runtime + version | Node.js 20 LTS | Build-time only; matches sample-plugin engines field. |
| Package manager | npm 10 | Sample plugin uses npm; lock churn lowest across forks. |
| Build tool | esbuild 0.25 | Official sample template; one-file CJS bundle. |
| Bundle target | ES2018, format `cjs` | Matches Obsidian's Electron + Capacitor JS engines. |
| Output | `main.js` (single file) | Obsidian only loads `main.js` from plugin folder. |
| Mobile support | `isDesktopOnly: false` | Echo-note has no Node deps; mobile-safe. |
| State mgmt | Plain class fields on `Plugin` | Built-in; no Redux needed for a plugin. |
| Settings persistence | `loadData()` / `saveData()` | Built-in JSON store at `data.json`. |
| UI patterns | `Modal`, `SuggestModal`, `EditorSuggest`, `SettingTab`, `Notice` | All shipped in `obsidian` module. |
| Routing/Nav | N/A — Obsidian commands & ribbon | Plugin is hosted UI, no router. |
| Data layer | Vault adapter via `app.vault.*` | Never use `fs`; breaks on mobile. |
| Auth | N/A for echo-note | Plugins run in user's vault; no auth boundary. |
| Styling | `styles.css` shipped beside `main.js` | Obsidian auto-loads it on enable. |
| Forms + validation | Native HTML inputs in `Setting` | Obsidian's `Setting` builder. |
| Unit test runner | Vitest 3 | Faster than Jest; good ESM + TS DX. |
| Mocking strategy | Hand-rolled `obsidian` mock at `tests/__mocks__/obsidian.ts` | Real module is host-only. |
| E2E framework | Manual smoke in a real vault | No headless Obsidian; document manual steps. |
| Logger | `console.*` namespaced via prefix `[echo-note]` | Obsidian devtools is the log sink. |
| Error tracking | `Notice` for user-facing; `console.error` in dev | No telemetry sent off-device by default. |
| Lint + format | Biome 1.9 | One tool; fast; no ESLint+Prettier zoo. |
| Type checking | `tsc --noEmit` | Sample plugin runs this before bundling. |
| Env vars + secrets | `data.json` (user-entered) only | Never bake secrets into bundle. |
| CI provider | GitHub Actions | Free for public; sample uses it. |
| Deploy target | GitHub Releases on the plugin repo | Obsidian fetches updates from here. |
| First-time listing | PR to `obsidianmd/obsidian-releases` `community-plugins.json` | Required to appear in directory. |
| Auto-update | `versions.json` + GitHub Releases | Obsidian polls this on `manifest.json`. |
| Hot reload (dev) | `pjeby/hot-reload` plugin in vault | Watches `main.js`, re-enables plugin. |
| Min Obsidian version | `minAppVersion: 1.5.0` | Modern API surface, broad coverage. |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Obsidian Desktop | 1.12.7 | 2026-02-27 | https://obsidian.md/changelog/ |
| `obsidian` (npm types) | latest | ongoing | https://www.npmjs.com/package/obsidian |
| `obsidian-sample-plugin` | master | rolling | https://github.com/obsidianmd/obsidian-sample-plugin |
| TypeScript | 5.7.x | 2025 | https://www.npmjs.com/package/typescript |
| esbuild | 0.25.x | 2025 | https://www.npmjs.com/package/esbuild |
| Vitest | 3.x | 2025 | https://vitest.dev/ |
| Biome | 1.9.x | 2025 | https://biomejs.dev/ |
| Node.js (build) | 20 LTS | rolling | https://nodejs.org/ |
| `pjeby/hot-reload` | 0.3.x | rolling | https://github.com/pjeby/hot-reload |

### Minimum Host Requirements

- macOS 11+, Windows 10+, or any Linux with glibc 2.28+ (Obsidian Desktop's own floor).
- 8 GB RAM, 1 GB disk for repo + node_modules.
- Node 20 LTS for builds.
- An installed copy of Obsidian (any 1.5.0+ build) to test in.

### Cold-Start Estimate

`git clone` → `npm install` → `npm run dev` → plugin loaded in vault: **~5 minutes** on a fresh machine.

---

## 2. Zero-to-running

### macOS

```sh
# 1. Install Homebrew if missing
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Tools
brew install node@20 git gh
brew install --cask obsidian

# 3. Auth GitHub (for `gh release` later)
gh auth login

# 4. Clone the official sample
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git echo-note
cd echo-note
rm -rf .git
git init
gh repo create echo-note --public --source=. --remote=origin

# 5. Install + build
npm install
npm run dev
```

Then symlink the project into a test vault:

```sh
# Replace TestVault with your vault path
ln -s "$(pwd)" "$HOME/Documents/TestVault/.obsidian/plugins/echo-note"
```

Open Obsidian → Settings → Community plugins → Turn ON → Enable `Echo Note`.

### Windows

```powershell
# 1. winget (built into Win11; on Win10 install App Installer)
winget install OpenJS.NodeJS.LTS
winget install Git.Git
winget install GitHub.cli
winget install Obsidian.Obsidian

# 2. Auth
gh auth login

# 3. Clone + scaffold
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git echo-note
cd echo-note
Remove-Item -Recurse -Force .git
git init
gh repo create echo-note --public --source=. --remote=origin

# 4. Install + dev
npm install
npm run dev

# 5. Symlink (PowerShell, run as admin)
New-Item -ItemType SymbolicLink -Path "$env:USERPROFILE\Documents\TestVault\.obsidian\plugins\echo-note" -Target (Get-Location)
```

### Linux

```sh
# Debian/Ubuntu
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git
sudo apt-get install -y gh   # or: see https://cli.github.com/

# Obsidian: official AppImage from https://obsidian.md/download
# Or Flatpak:
flatpak install flathub md.obsidian.Obsidian

gh auth login
git clone https://github.com/obsidianmd/obsidian-sample-plugin.git echo-note
cd echo-note
rm -rf .git && git init
gh repo create echo-note --public --source=. --remote=origin
npm install
npm run dev

ln -s "$(pwd)" "$HOME/Documents/TestVault/.obsidian/plugins/echo-note"
```

### Accounts to create

- **GitHub** — https://github.com/signup. The plugin lives here. Releases are published here.
- **Obsidian forum account (optional)** — https://forum.obsidian.md/signup. Needed only if you want to announce the plugin.
- No Apple, Google Play, or Vercel accounts needed. Plugins ship as plain files.

### Expected first-run output

`npm run dev` should print:

```
> echo-note@1.0.0 dev
> node esbuild.config.mjs

[watch] build finished
```

Inside Obsidian, after enabling the plugin you should see a die ribbon icon and the command `Echo Note: print active note` in the command palette (Ctrl/Cmd-P).

### Common first-run errors

| Error | Fix |
|---|---|
| `Cannot find module 'obsidian'` during build | `npm install` again; `obsidian` is a devDependency. |
| Plugin doesn't appear in Settings → Community plugins | You enabled `Restricted mode`. Turn it OFF. |
| `Failed to load plugin` toast | Check Devtools (Ctrl/Cmd-Alt-I) for the stack trace. Usually `main.js` missing. |
| `npm install` fails on Windows with EACCES | Run terminal as admin once or use the LTS installer with `npm config set prefix`. |
| Symlink shows up but plugin won't enable | `manifest.json` `id` must match the folder name; both must be `echo-note`. |

---

## 3. Project Layout

```
echo-note/
├── .github/
│   └── workflows/
│       └── release.yml          # Build + attach assets to GH Release on tag
├── .cursor/
│   └── rules                    # Cursor rules (Always/Never)
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── src/
│   ├── main.ts                  # Plugin entry: onload/onunload
│   ├── settings.ts              # Settings tab + types + DEFAULT_SETTINGS
│   ├── modal.ts                 # EchoModal
│   ├── suggest.ts               # EchoEditorSuggest
│   └── lib/
│       └── format.ts            # Pure helpers; the place tests live next to
├── tests/
│   ├── setup.ts                 # Registers obsidian mock
│   ├── __mocks__/
│   │   └── obsidian.ts          # Hand-rolled stubs of Plugin/App/etc.
│   └── format.test.ts           # Unit tests
├── manifest.json                # Plugin metadata Obsidian reads
├── versions.json                # plugin-version → minAppVersion map
├── package.json
├── tsconfig.json
├── esbuild.config.mjs
├── biome.json
├── vitest.config.ts
├── styles.css                   # Optional, ships beside main.js
├── main.js                      # GENERATED. Never hand-edit. .gitignore'd? NO — see §8.
├── version-bump.mjs             # Sync manifest.json + versions.json
├── README.md
├── LICENSE
├── CLAUDE.md
├── AGENTS.md
└── data.json                    # NEVER commit; user's runtime settings
```

### Naming conventions

- Files: `kebab-case.ts`. One class or one feature per file.
- Classes: `PascalCase` (`EchoModal`, `EchoSettingTab`, `EchoEditorSuggest`).
- Plugin id: kebab-case, matches GitHub repo name and `manifest.json` `id`.
- Test files: `*.test.ts` next to the file under test, OR mirrored under `tests/`.
- Commands: `id` is `${plugin-id}:${verb-noun}` (Obsidian prefixes for you; just give a stable verb-noun).

### "If you're adding X, it goes in Y"

| Artifact | Path |
|---|---|
| New command | `src/main.ts` inside `onload()`, register via `this.addCommand` |
| Ribbon icon | `src/main.ts` `onload()`, `this.addRibbonIcon` |
| Modal dialog | `src/modals/<name>-modal.ts`, extend `Modal` |
| Suggester (`/foo` style) | `src/suggest/<name>-suggest.ts`, extend `EditorSuggest` |
| Settings field | `src/settings.ts` — add to interface + `DEFAULT_SETTINGS` + `display()` |
| File-menu entry | `src/main.ts`, `this.registerEvent(this.app.workspace.on('file-menu', ...))` |
| Status bar item | `src/main.ts`, `this.addStatusBarItem()` |
| New view (sidebar) | `src/views/<name>-view.ts`, extend `ItemView`, register in `onload` |
| Pure helper / parser | `src/lib/<name>.ts` |
| Unit test | `tests/<name>.test.ts` or `src/lib/<name>.test.ts` |
| Static asset | inline in code (Obsidian only loads `main.js` + `styles.css` + `manifest.json`) |
| Icon (Lucide) | use `setIcon(el, 'name')` — no asset file needed |
| Custom SVG icon | `addIcon(name, svgString)` in `onload`, then `setIcon` references it |
| Localized strings | `src/lib/i18n.ts` — pure object lookup keyed by `moment.locale()` |
| Migration of `data.json` shape | `src/lib/migrate.ts`, called from `loadSettings()` |
| External HTTP call | `src/lib/api.ts` using `requestUrl()` from `obsidian` (NOT `fetch`) |
| User-facing copy | wherever shown; for many strings use `src/lib/strings.ts` |

---

## 4. Architecture

### Process boundaries

```
Obsidian Host (Electron on desktop, Capacitor on mobile)
│
├── Main process    (Node.js, files, OS)            <-- you cannot reach
└── Renderer        (Chromium + your plugin)        <-- you live here
        │
        └── Plugin runtime
            ├── this.app.vault    (file I/O, mobile-safe)
            ├── this.app.workspace (panes, leaves, events)
            ├── this.app.metadataCache (frontmatter, links)
            └── this (your Plugin instance: settings, registered handles)
```

You only ever run inside the Renderer. There is **no** main-process equivalent. Anything Node-only (`fs`, `child_process`, `path` joining via `\`) is desktop-only and breaks on mobile.

### Data flow for a command invocation

```
User presses Ctrl-P → types "Echo Note"
        │
        ▼
Obsidian's Command Palette dispatches to your registered callback
        │
        ▼
this.echoActive() (in main.ts)
        │
        ├─> reads this.app.workspace.getActiveFile()
        ├─> reads via this.app.vault.read(file)
        ├─> formats with src/lib/format.ts
        └─> shows new Notice(text)  // or Modal, or writes back via vault.modify()
```

### Settings flow

```
onload()
  └─ await this.loadSettings()
        └─ this.loadData() reads <vault>/.obsidian/plugins/echo-note/data.json
              └─ Object.assign({}, DEFAULT_SETTINGS, loaded)
   └─ this.addSettingTab(new EchoSettingTab(this.app, this))

User changes a Setting field
  └─ onChange → this.plugin.settings.foo = value
  └─ await this.plugin.saveSettings()
        └─ this.saveData(this.settings) writes data.json
```

### File-to-responsibility map

- `src/main.ts` — `Plugin` subclass. ONLY does: register commands, ribbons, suggesters, events, views, settings tab. No business logic.
- `src/settings.ts` — `Settings` interface, `DEFAULT_SETTINGS`, `EchoSettingTab` class.
- `src/modal.ts`, `src/suggest.ts` — UI surfaces. Receive plugin via constructor.
- `src/lib/*.ts` — pure functions only. No `app`, no `Plugin` references. Easy to test.
- `manifest.json` — what Obsidian reads to decide id, version, min app version, mobile support.
- `versions.json` — older-version compatibility map.

### Where business logic lives

- **In `src/lib/`**, as pure functions. Tested with Vitest.
- NOT in `main.ts`. NOT in modal classes.
- Anything that touches `this.app` is integration code, not business logic.

---

## 5. Dev Workflow

### Start dev server

```sh
npm run dev
```

This runs `node esbuild.config.mjs` with `--watch`. It rebuilds `main.js` on every save. Obsidian doesn't auto-pick up the change — install `pjeby/hot-reload` in your test vault and create an empty `.hotreload` file in your plugin folder; the plugin will then disable+re-enable on every rebuild.

### Hot reload behavior + when it breaks

- Triggers on `main.js`, `manifest.json`, `styles.css` change.
- Breaks if you have a runtime exception in `onload` — Obsidian will print to devtools and leave the plugin off. Toggle manually after fixing.
- Breaks for view registrations: a registered view that's currently open doesn't re-register cleanly. Close the leaf, then reload.

### Attach a debugger

- **VS Code / Cursor** — open Obsidian, then `View → Toggle Developer Tools` inside Obsidian itself. Use Chrome DevTools' Sources panel. Breakpoints in `main.js` work. For inline TS source, esbuild source maps are emitted in dev (see `esbuild.config.mjs`).
- **Mobile (iOS)** — connect device, Safari → Develop → \[Device\] → Obsidian.
- **Mobile (Android)** — `chrome://inspect` with USB debugging enabled, plus the developer build of Obsidian.

### Inspect runtime state

- DOM and CSS: Obsidian devtools (Ctrl/Cmd-Alt-I).
- `app.workspace`, `app.vault`: type `app` in the devtools console — it's exposed globally for your convenience.
- Your plugin: `app.plugins.plugins['echo-note']`.
- `data.json`: open it directly inside `<vault>/.obsidian/plugins/echo-note/data.json`.

### Pre-commit checks

```sh
npm run check       # tsc --noEmit && biome check .
npm test -- --run   # vitest one-shot
npm run build       # esbuild production
```

Skip Husky. The GitHub Action enforces these on push. Locally run `npm run check && npm test -- --run` before every commit.

### Branch + commit conventions

- `main` is releasable.
- Feature branches: `feat/<slug>`, fix branches: `fix/<slug>`.
- Conventional commits: `feat: …`, `fix: …`, `chore: …`. Releases are tagged off `main` only.

---

## 6. Testing & Parallelization

### Unit tests

```sh
npm test               # watch mode
npm test -- --run      # one shot
npm test -- format     # only files matching "format"
npm test -- -t "echoes" # only tests whose name matches
```

Tests live in `tests/` or beside the file as `*.test.ts`. The Obsidian module is auto-mocked via `tests/setup.ts` registering `tests/__mocks__/obsidian.ts`.

### Integration tests

There is no headless Obsidian. "Integration" here means: spin up a real Obsidian vault, symlink the plugin in, run the manual smoke checklist in §8.4. Document each smoke step in `tests/SMOKE.md` and check them off per release.

### E2E

Same as above. Cypress/Playwright cannot drive Obsidian. The closest you get is `requestUrl()` mocked at the adapter boundary.

### Mocking rules

- ALWAYS mock the `obsidian` module — it has no runtime outside the host.
- ALWAYS mock `requestUrl` for any code path that hits the network.
- NEVER mock pure `src/lib/` functions — test them for real.
- NEVER mock the whole `app` — pass narrow stubs into pure helpers instead.

### Coverage target

- 80 % line coverage on `src/lib/`. UI classes (`Modal`, `EditorSuggest`) are not covered; verify them via the manual smoke list.
- Measure via `npm test -- --run --coverage`.

### Visual regression

Skip. There is no isolated component runner inside Obsidian. Take screenshots in your README during major UI changes; that's the bar.

### Parallelization patterns for AI agents

- SAFE in parallel: scaffold `src/lib/<name>.ts` + matching `*.test.ts`; scaffold `src/modals/<name>.ts`; add a new command (each in its own file).
- SAFE in parallel: writing `README.md` while another agent edits `src/`.
- NOT SAFE in parallel: any change to `package.json`, `tsconfig.json`, `manifest.json`, `versions.json`, `esbuild.config.mjs`. These serialize.
- NOT SAFE in parallel: two agents both editing `src/main.ts`'s `onload()` registrations — merge conflicts guaranteed.

---

## 7. Logging

There is no `pino`/`winston`. Obsidian plugins log to the Chromium devtools console. Standardize on a tiny prefixed wrapper.

### Snippet — `src/lib/log.ts`

```ts
const PREFIX = '[echo-note]';

export const log = {
  debug: (...a: unknown[]) => console.debug(PREFIX, ...a),
  info:  (...a: unknown[]) => console.info(PREFIX, ...a),
  warn:  (...a: unknown[]) => console.warn(PREFIX, ...a),
  error: (...a: unknown[]) => console.error(PREFIX, ...a),
};
```

### Levels and when to use

- `debug` — anything chatty during dev. Stripped at build time via esbuild's `define` if you want.
- `info` — plugin loaded / unloaded; user-initiated commands.
- `warn` — recoverable: unexpected frontmatter shape, missing optional setting.
- `error` — bugs. Always also surface to the user with `new Notice('Echo Note: …')`.

### Required fields

Every log line should embed: `event` (verb), the active file path if relevant (`normalizePath`'d), and any error message. Don't log the user's note contents.

### Sample lines

- `[echo-note] info onload v1.0.0`
- `[echo-note] info command run command="echo-active"`
- `[echo-note] warn frontmatter missing path="Daily/2026-04-27.md"`
- `[echo-note] error vault.read failed path="…" err="ENOENT"`

### Log sinks

- Dev: Obsidian devtools console (Ctrl/Cmd-Alt-I → Console).
- Prod: same. Plugins do not ship telemetry.
- Grep locally with the devtools filter box; `[echo-note]` finds yours instantly.

---

## 8. AI Rules

### 8.1 ALWAYS (≥ 20)

1. ALWAYS register every event, DOM listener, interval, and timeout via `this.registerEvent` / `this.registerDomEvent` / `this.registerInterval`. Otherwise it leaks across reloads.
2. ALWAYS read and write files through `this.app.vault.*`. Never use Node's `fs`.
3. ALWAYS run `normalizePath()` on any path you build before passing it to the vault.
4. ALWAYS keep `manifest.json.version` and `package.json.version` and the latest key in `versions.json` in sync. Use `npm version` so the bundled script does it for you.
5. ALWAYS bundle as `format: 'cjs'`, `target: 'es2018'`. Other targets break on Capacitor.
6. ALWAYS mark `obsidian`, `electron`, all `@codemirror/*` and `@lezer/*` packages as `external` in esbuild.
7. ALWAYS implement `onunload()` for any non-`register*` resource you created.
8. ALWAYS test on mobile if `isDesktopOnly` is `false`. Even one Node import will silently no-op.
9. ALWAYS use `requestUrl()` from `obsidian` for HTTP. Browser `fetch` cannot bypass CORS in Obsidian.
10. ALWAYS load settings with `Object.assign({}, DEFAULT_SETTINGS, loaded)` so new fields back-fill on upgrade.
11. ALWAYS run `npm run check` (typecheck + lint) and `npm test -- --run` before declaring a task done.
12. ALWAYS run `npm run build` and re-enable the plugin in a real vault before tagging a release.
13. ALWAYS add an entry to `versions.json` for every released `version` in `manifest.json`.
14. ALWAYS attach `manifest.json`, `main.js`, and `styles.css` (if you have one) as binary assets on the GitHub Release. Tag name is the bare version, e.g. `1.0.1`, NO leading `v`.
15. ALWAYS keep the plugin id (`manifest.json.id`) lowercase kebab-case, ≤ 50 chars, identical to the folder name.
16. ALWAYS prefix every command id you register with the same verb-noun shape; e.g. `echo-active`. Obsidian namespaces it under your plugin id automatically.
17. ALWAYS use `this.addSettingTab(new EchoSettingTab(this.app, this))` to expose user options. Inline modals are not discoverable.
18. ALWAYS use `Notice` (5 s default) for transient feedback; Modal for anything requiring a confirmation.
19. ALWAYS make settings additive: never delete a key from `DEFAULT_SETTINGS` without a migration step.
20. ALWAYS keep `src/lib/` free of `App`/`Plugin` references so it stays unit-testable.
21. ALWAYS pin esbuild and TypeScript exactly in `package.json` (`"5.7.2"` not `"^5.7.0"`). Plugin output reproducibility matters for review.
22. ALWAYS verify any file modification via `Vault.process()` (atomic) over `read`+`modify` (race-prone).

### 8.2 NEVER (≥ 15)

1. NEVER `import * as fs from 'fs'` or anything from `node:*`. Mobile has no Node.
2. NEVER ship `electron` imports unless `isDesktopOnly: true`. Even then, prefer the Obsidian API.
3. NEVER call `app.vault.adapter.basePath` or `getBasePath()`. Mobile doesn't have it. Use `Vault` methods.
4. NEVER use `fetch` for cross-origin requests. Use `requestUrl` from `obsidian`.
5. NEVER write to user files without a confirmation Modal or explicit setting. Vault data is sacred.
6. NEVER hardcode paths with `\` or `/`. Build with `normalizePath('a/b/c')`.
7. NEVER bundle `obsidian` into `main.js`. It must be `external`.
8. NEVER set `nodeIntegration` or assume Node globals; you are not configuring Electron, you are guesting in it.
9. NEVER add long-running work to `onload`. Defer with `this.app.workspace.onLayoutReady(() => …)`.
10. NEVER block the editor on heavy work. Yield with `await sleep(0)` or chunk via `requestIdleCallback`.
11. NEVER store secrets in `manifest.json` or in source. The user enters them in settings, then they live in `data.json`, which is theirs.
12. NEVER commit `data.json`, `node_modules/`, `main.js` (until release) — see §16 for `.gitignore`.
13. NEVER tag a release with a leading `v`. Obsidian rejects `v1.0.0`; use `1.0.0`.
14. NEVER skip the `versions.json` update — older Obsidian users will get an incompatible build and your plugin will silently fail to load.
15. NEVER call `eval` or load remote scripts. Reviewers will reject the submission.
16. NEVER mutate `DEFAULT_SETTINGS` at runtime — clone it.
17. NEVER name your plugin `obsidian-*` in `id` or `name`; the directory bans the prefix.
18. NEVER include a CSS reset that touches anything outside your own scoped class.

### 8.3 Blast Radius Reference (≥ 20 rows)

| Path | Blast | Verify |
|---|---|---|
| `manifest.json` | Whether Obsidian loads the plugin at all; directory listing | `npm run build` then enable plugin in vault; reproduce one command |
| `manifest.json.id` | Directory listing identity, settings folder name, GitHub repo name | rename folder + repo; users who installed before must reinstall |
| `manifest.json.minAppVersion` | Whether Obsidian considers the plugin compatible | install on a vault running exactly that version, plugin must enable |
| `manifest.json.isDesktopOnly` | Whether the plugin shows up on mobile | toggle false → install on iOS/Android Obsidian → enable |
| `versions.json` | Auto-update behavior on older Obsidian | install older Obsidian, ensure latest compatible version is offered |
| `package.json` | Build, test, lint scripts; dep versions | `npm install` && `npm run check` && `npm test -- --run` && `npm run build` |
| `package.json.version` | Tag derived for release | must equal `manifest.json.version` exactly |
| `tsconfig.json` | typecheck + bundle | `npm run check` && `npm run build` cold |
| `esbuild.config.mjs` | output shape, sourcemap, externals | `npm run build`, then load in vault, verify console has no `Cannot find module` |
| `biome.json` | lint + format diff | `npx biome check .` |
| `vitest.config.ts` | how tests resolve `obsidian` | `npm test -- --run` |
| `tests/__mocks__/obsidian.ts` | every test's behavior | full test run |
| `src/main.ts` `onload` | every registered command, ribbon, view | reload plugin; trigger each registration; check unload cleanly |
| `src/main.ts` `onunload` | leaks across reload | toggle plugin off+on 5x; devtools memory shows no monotonic growth |
| `src/settings.ts` `DEFAULT_SETTINGS` | upgrade path for users | manually load with old `data.json` shape, confirm fields back-fill |
| `src/settings.ts` settings tab | discoverability of every option | every option must round-trip through Settings → close → reopen |
| `src/lib/format.ts` | core behavior | full unit test run |
| `styles.css` | every visual surface in the plugin | toggle plugin in light + dark theme |
| `.github/workflows/release.yml` | release artifact integrity | tag a `0.0.0-canary` to a fork, confirm assets attach |
| `version-bump.mjs` | manifest/package/versions sync | run `npm version patch`, diff three files |
| `community-plugins.json` (in fork of `obsidianmd/obsidian-releases`) | first-time directory listing | open PR; CI bot must pass before review |
| `data.json` (user's vault) | user state | NEVER deleted by an upgrade; migrate in code |
| `LICENSE` | submission acceptance | must exist; OSI-approved; MIT default |
| `README.md` | submission acceptance | must describe purpose + usage |

### 8.4 Definition of Done

#### Bug fix
- Failing test added that reproduces the bug.
- Fix lands; test passes.
- `npm run check` clean.
- Manual smoke in a real vault on the affected command.
- Changelog entry under `## Unreleased` in `README.md`.

#### New feature
- Setting added to `DEFAULT_SETTINGS` if config-driven.
- Settings tab UI updated.
- Unit tests for any pure logic added.
- Manual smoke covers: toggle on/off; restart Obsidian; mobile if `isDesktopOnly: false`.
- Screenshot or short clip pasted into the PR.

#### Refactor
- Behavior unchanged: full test run plus existing smoke checklist passes.
- No new public API on the plugin instance unless documented.

#### Dependency bump
- `npm install` clean.
- `npm run build` produces a `main.js` of similar size (within ±10 %).
- All tests pass.
- For an `obsidian` API bump: read the changelog at https://github.com/obsidianmd/obsidian-api/releases.

#### Schema change (`data.json` shape)
- Migration step in `loadSettings()` reads old keys and translates.
- Unit test for the migration with a concrete old-shape fixture.
- Do not rename keys without a migration; reviewers reject this.

#### Copy change
- One commit per locale if you i18n.
- Visual check in light + dark theme.
- No layout shift in the Settings tab.

### 8.5 Self-Verification Recipe

```sh
# 1. Reproducible install
rm -rf node_modules
npm install

# 2. Static checks
npm run check        # tsc --noEmit && biome check .

# 3. Unit tests
npm test -- --run

# 4. Production build
npm run build        # main.js produced; commit-clean

# 5. Smoke
# Symlink into TestVault, restart Obsidian, enable plugin, run "Echo Note: print active note"
```

Expected outputs:

- Step 1: ends with `added <N> packages, and audited` and **no** ERR lines.
- Step 2: `tsc` prints nothing; `biome check` ends with `Checked … files. No fixes applied.`
- Step 3: `Test Files  X passed | Tests  Y passed | Errors  0`.
- Step 4: writes `main.js`; no warnings to stderr; `ls -lh main.js` < 200 KB for echo-note.
- Step 5: Notice toast appears; devtools console shows `[echo-note] info command run command="echo-active"`.

### 8.6 Parallelization Patterns

- Two agents in parallel touching `src/lib/format.ts` + `src/lib/parse.ts` — fine.
- Two agents in parallel each adding a separate Modal in its own file — fine.
- Two agents in parallel each adding a command in `src/main.ts` `onload` — STOP. Serialize, or one writes a generated registration array consumed by `main.ts`.
- Anything that bumps `package.json` — single agent, single commit.
- Anything that touches `manifest.json` — single agent, single commit.

---

## 9. Stack-Specific Pitfalls (≥ 15)

1. **Bundling `obsidian` into `main.js`** — symptom: plugin loads, then errors `'Plugin' is not a constructor`. Cause: `obsidian` not external. Fix: keep `external: ['obsidian', 'electron', '@codemirror/*', '@lezer/*']` in `esbuild.config.mjs`. Detect: search `main.js` for `class Plugin {` — if present, you bundled it.
2. **Forgetting `register*` cleanup** — symptom: after toggling plugin off+on, double-firing events. Fix: every `addEventListener`-style call must be `this.registerDomEvent`. Detect: in devtools, profile memory — heap monotonically increases each toggle.
3. **`fs` import on mobile** — symptom: plugin disabled on mobile with toast `Failed to load plugin`. Fix: replace with `vault.read`/`vault.adapter.read`. Detect: search src for `from ['"]fs|node:`.
4. **Hardcoded `\` paths on Windows** — symptom: works on Mac, fails on Windows. Fix: `normalizePath('a/b/c')`. Detect: grep src for `\\\\`.
5. **Version drift between `manifest.json` and `versions.json`** — symptom: users on older Obsidian see no updates ever. Fix: use the bundled `version-bump.mjs` via `npm version patch`. Detect: a CI step that fails if `manifest.json.version` is missing from `versions.json`.
6. **Tag prefixed with `v`** — symptom: GitHub Release exists but Obsidian never sees the update. Fix: tag `1.0.1`, not `v1.0.1`. Detect: try `git tag` — only bare versions allowed.
7. **`isDesktopOnly: true` left over from sample template** — symptom: ⅓ of users (mobile) cannot install. Fix: flip to `false` once you've grepped your code for Node imports. Detect: review `manifest.json` before each release.
8. **Heavy work in `onload`** — symptom: Obsidian app hangs at startup for seconds. Fix: wrap in `this.app.workspace.onLayoutReady(() => …)` for anything not strictly needed before first paint. Detect: profile cold start.
9. **Modifying user files without confirmation** — symptom: angry forum thread. Fix: every destructive op goes through a `Modal` with explicit confirm. Detect: code review for `vault.modify`/`vault.delete` without preceding `Modal`.
10. **`addCommand` callback throws synchronously** — symptom: command palette shows red, nothing happens. Fix: wrap in `try/catch` and `new Notice` the error. Detect: trip the unhappy path manually.
11. **Stale `main.js` from old build** — symptom: dev changes don't appear. Fix: `rm main.js && npm run dev`. Detect: timestamp older than `src/`.
12. **CSS bleeds outside the plugin's surface** — symptom: other plugins or core look weird. Fix: scope every selector under `.echo-note-*`. Detect: open Settings → Appearance with the plugin enabled, scan for color shifts.
13. **`saveData` race** — symptom: settings randomly revert. Fix: `await this.saveSettings()` before continuing; never call from inside an event without `await`. Detect: change a setting, force-quit Obsidian, reopen.
14. **`requestUrl` returns body as bytes, not text** — symptom: JSON parse fails. Fix: use `.json` or `.text`. Detect: the returned value `.contentType` is `application/json` but you used `.arrayBuffer`.
15. **EditorSuggest infinite trigger loop** — symptom: typing freezes editor. Fix: in `onTrigger`, return `null` if regex doesn't match exactly; don't call `editor.replaceRange` from inside `selectSuggestion` without scheduling via `setTimeout(…, 0)`.
16. **Plugin id clashing with directory** — symptom: PR rejected by maintainers. Fix: pre-flight `id` against `community-plugins.json` (search the file in the obsidian-releases repo).

---

## 10. Performance Budgets

- **Cold-start cost** (time added to Obsidian boot by your plugin): < 50 ms. Measure: in `onload` first line `const t = performance.now()`; last line `console.info('[echo-note] boot ms', performance.now()-t)`.
- **`main.js` size**: < 200 KB. Measure: `ls -lh main.js`. Reviewers flag larger.
- **Memory after 5 toggles**: < 10 % growth. Measure: devtools → Memory → take snapshots.
- **Editor frame budget**: any `EditorSuggest`/`onChange` work < 16 ms. Measure: devtools Performance recorder while typing.
- **Mobile cold-start**: same 50 ms target; mobile is slower so anything > 100 ms is felt.

When budget is exceeded:
1. Defer to `onLayoutReady`.
2. Replace synchronous loops with `for await`.
3. Move parsing off the main thread is NOT an option (no Web Workers in Obsidian); instead chunk via `setTimeout(..., 0)`.
4. Cache aggressively; invalidate on `vault.on('modify')`.

---

## 11. Security

- **Secret storage**: `data.json` only, written by `saveData()`. NEVER in `manifest.json`, NEVER baked into `main.js`. Treat it as plaintext on disk; do not store auth tokens that grant write access to anything important.
- **Auth threat model**: the user owns their machine, vault, and data. The plugin has the same trust as the user's hand. Don't make a network call the user didn't ask for.
- **Input validation**: anything that ends up as a path → `normalizePath`. Anything that ends up as HTML → never use `innerHTML`; use `createEl`/`setText`/`createSpan`.
- **Output escaping**: same — `createEl` family. Never concatenate user content into HTML.
- **Permissions/capabilities**: there is no permission manifest like Chrome MV3. Behavior is gated implicitly: if you don't import `electron`, you can't shell out. Reviewers expect a tight surface.
- **Dependency audit**: `npm audit --omit=dev` before every release. Zero high CVEs is the bar.
- **Top 5 stack risks**:
  1. Loading remote code (`eval`, dynamic `import` of HTTP URLs) — directory will reject.
  2. Bypassing `Vault` and reading raw fs paths the user didn't authorize.
  3. Logging or exfiltrating note content.
  4. Shipping unbundled `node_modules` paths in the bundle (raises bundle to MBs and surfaces vendor code).
  5. Unscoped CSS that overrides Obsidian core selectors.

---

## 12. Deploy

### Release flow (every release)

```sh
# 1. Make sure main is green
npm run check && npm test -- --run && npm run build

# 2. Bump versions (uses version-bump.mjs hooked into npm version)
npm version patch    # or minor / major

# 3. Push tag — release.yml builds and attaches assets
git push origin main --follow-tags
```

The GitHub Action (see §16) runs:
1. Checkout, install, `npm run build`.
2. Creates a release named after the tag (no `v` prefix).
3. Uploads `main.js`, `manifest.json`, and `styles.css`.

### Staging vs prod

There is no staging. The only way to test "as users see it" is to install from the Releases page into a different vault that does NOT have the symlink:

```
Settings → Community plugins → Browse → search "Echo Note" → Install → Enable
```

For first-listing, you can pre-validate by manually downloading the three release assets into `<vault>/.obsidian/plugins/echo-note/`.

### Rollback

There's no in-place rollback. To roll users back:
1. Delete the bad GitHub Release.
2. Re-tag the previous version under a higher number (e.g. release `1.0.3` if `1.0.2` was bad and the previous good was `1.0.1` — yes you bump forward).
3. Push the new release with assets that are the old code.

Max safe rollback window: hours. Auto-update fetches once per Obsidian launch.

### Health check

There is no URL. Smoke command:
1. Open a fresh test vault.
2. Settings → Community plugins → Browse → install Echo Note.
3. Enable.
4. Run a command. Expect a Notice.

### Versioning

- `manifest.json.version` = SemVer.
- `package.json.version` = identical.
- `versions.json` = `{ "1.0.0": "1.5.0", "1.1.0": "1.5.0", … }`. Every released `manifest.json.version` MUST be a key here.
- The Git tag = the bare version, no `v`.

### First-time directory listing (NEW PLUGIN ONLY — skip if already listed)

This is the **PR to `obsidianmd/obsidian-releases`** that adds your plugin to the Community Plugins browser.

```sh
# 1. Fork the repo
gh repo fork obsidianmd/obsidian-releases --clone --remote
cd obsidian-releases

# 2. Add to community-plugins.json
# Open community-plugins.json. Append (KEEP IT SORTED BY THE FILE'S CONVENTION; currently appended at end):
#   {
#     "id": "echo-note",
#     "name": "Echo Note",
#     "author": "Your Name",
#     "description": "Print the active note's title and word count.",
#     "repo": "your-github/echo-note"
#   }

# 3. Submit
git checkout -b add-echo-note
git add community-plugins.json
git commit -m "Add plugin: Echo Note"
git push origin add-echo-note
gh pr create --title "Add plugin: Echo Note" \
  --body "I am the developer of Echo Note. The plugin meets the submission requirements."
```

### Validator checklist (the bot runs these)

- `manifest.json` exists at repo root and on the latest GitHub Release.
- `manifest.json.id` matches the entry in `community-plugins.json`.
- `manifest.json.version` matches the latest release tag.
- Tag has NO leading `v`.
- `versions.json` exists and contains the latest version.
- `LICENSE` and `README.md` exist.
- `main.js` is in the release assets, not in the repo root (or, if it is, it's deliberate — many plugins commit it).
- No `eval`, no remote code loading.
- `id` is not in use already.

After the bot is green, a maintainer reviews. Allow days to weeks. Iterate on review comments in the same PR.

### Post-listing

Once merged, the plugin appears in `Settings → Community plugins → Browse`. Future versions auto-update via your GitHub Releases — no second PR needed. You ONLY edit `obsidianmd/obsidian-releases` again if you change `name`, `author`, `description`, or repo URL.

### Cost

$0. GitHub Releases is free for public repos. There are no app store fees.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```md
# Echo Note — agent guide

This repo is an Obsidian community plugin. The full rulebook is at the project root as `obsidian-plugin.md` (or pasted into your context). Prefer it over your training data; it is dated.

## Commands you'll run constantly
- `npm install`
- `npm run dev`           # esbuild watch
- `npm run build`         # esbuild prod
- `npm run check`         # tsc --noEmit && biome check .
- `npm test -- --run`     # vitest one-shot

## Banned patterns
- Importing from `fs`, `node:*`, or `electron` outside a `Platform.isDesktopApp` guard.
- Bundling `obsidian` into `main.js` (must stay `external`).
- Building paths with `\` or unguarded `/`. Use `normalizePath`.
- Tagging releases with a leading `v`.
- Calling `fetch` for cross-origin requests. Use `requestUrl`.

## Definition of done
Every task ends with `npm run check && npm test -- --run && npm run build` clean and a manual reload of the plugin in a real Obsidian vault.

## Mobile
This plugin is `isDesktopOnly: false`. Test on the Obsidian mobile app before claiming a feature complete.

## Release
`npm version patch && git push --follow-tags`. The release.yml workflow handles the rest.

## First-time directory listing
See §12 of `obsidian-plugin.md`. Open a PR to `obsidianmd/obsidian-releases` adding an entry to `community-plugins.json`.
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "preCommit": "npm run check && npm test -- --run",
    "postEdit": "npx biome format --write {{file}}",
    "Stop": "npm run build"
  },
  "permissions": {
    "allow": [
      "Bash(npm install)",
      "Bash(npm run *)",
      "Bash(npm test*)",
      "Bash(npm version *)",
      "Bash(npx biome *)",
      "Bash(node esbuild.config.mjs)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git add *)",
      "Bash(git commit -m *)",
      "Bash(git push*)",
      "Bash(git tag*)",
      "Bash(gh release *)",
      "Bash(gh pr create*)",
      "Bash(ls *)",
      "Bash(cat manifest.json)",
      "Bash(cat versions.json)",
      "Bash(cat package.json)"
    ]
  }
}
```

### Recommended skills

- `/test-driven-development` — when adding any pure helper in `src/lib/`.
- `/systematic-debugging` — when a plugin fails to enable.
- `/verification-before-completion` — always before claiming done.
- `/ship` — for cutting a release after `npm run check && npm test -- --run` is green.
- `/review` — before merging to `main`.

### Slash command shortcuts

- `/dev` — runs `npm run dev` in a side terminal.
- `/release patch|minor|major` — runs `npm version <x> && git push --follow-tags`.
- `/smoke` — opens the README's smoke checklist in the editor.

---

## 14. Codex Integration

### `AGENTS.md`

```md
# Echo Note — Codex guide

Build target: a single CommonJS bundle `main.js` loaded by Obsidian Desktop and Mobile.

## Hard rules
- Never bundle the `obsidian` module — it is provided by the host.
- Never use Node's `fs`, `path`, `child_process`, `electron`, or anything `node:*`.
- Always use `normalizePath` for paths and `requestUrl` for HTTP.
- Always wrap registrations in `this.register*` so unload is automatic.

## Commands
- `npm install`
- `npm run dev`
- `npm run check`
- `npm test -- --run`
- `npm run build`

## Files you'll edit most
- `src/main.ts` — `onload`/`onunload`, registrations.
- `src/settings.ts` — settings interface, default values, settings tab.
- `src/lib/*.ts` — pure helpers, the only thing unit tested.
- `manifest.json`, `versions.json` — bumped by `npm version` via `version-bump.mjs`.

## Release flow
`npm version patch && git push --follow-tags`. CI publishes a GitHub Release with `manifest.json`, `main.js`, `styles.css`.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_mode = "on-request"

[allowed_commands]
patterns = [
  "npm install",
  "npm run *",
  "npm test*",
  "npm version *",
  "npx biome *",
  "node esbuild.config.mjs",
  "git status",
  "git diff*",
  "git log*",
  "git add *",
  "git commit -m *",
  "git push*",
  "git tag*",
  "gh release *",
  "gh pr create*"
]

[notes]
rulebook = "./obsidian-plugin.md"
```

### Where Codex differs

- Codex's longer turn budget makes it good for ploughing through a refactor of `src/main.ts` or batch-renaming fields in `data.json`'s migration.
- Codex tends to over-create files (e.g. one file per command). On Obsidian, fewer files compile faster; consolidate when reviewing.
- Compensate by giving Codex the explicit blast-radius table from §8.3.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```md
# Echo Note rules

ALWAYS:
- Register every event/listener/interval via `this.register*` to enable automatic cleanup on `onunload()`.
- Use `normalizePath()` on every constructed path before passing to the vault.
- Use `requestUrl` from `obsidian` for HTTP. Never `fetch` for cross-origin.
- Use `this.app.vault.*` for file I/O. Never `fs`, `path` from Node, or anything from `node:*`.
- Bundle as `format: 'cjs'`, `target: 'es2018'`, with `obsidian`, `electron`, `@codemirror/*`, `@lezer/*` as `external`.
- Keep `manifest.json.version`, `package.json.version`, and a key in `versions.json` in sync. Use `npm version`.
- Make settings additive: never remove a key from `DEFAULT_SETTINGS` without a migration step in `loadSettings()`.

NEVER:
- Bundle `obsidian` into `main.js`.
- Tag a release with a leading `v`. Use bare `1.0.0`.
- Use `innerHTML` with anything user-derived; use `createEl` / `setText`.
- Modify user vault files without an explicit confirmation Modal.
- Block `onload`. Defer non-critical work to `this.app.workspace.onLayoutReady`.
- Commit `data.json` (it's the user's runtime state).
- Set `isDesktopOnly: true` unless you've actually got a desktop-only dependency.

When done:
- `npm run check && npm test -- --run && npm run build` clean.
- Plugin reloaded in a real vault and one command exercised.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "vitest.explorer",
    "ms-vscode.vscode-typescript-next",
    "GitHub.vscode-github-actions"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Vitest current file",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${file}"],
      "console": "integratedTerminal",
      "skipFiles": ["<node_internals>/**"]
    },
    {
      "name": "esbuild dev",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/esbuild.config.mjs",
      "console": "integratedTerminal"
    }
  ]
}
```

To debug the plugin itself, attach Chrome DevTools to Obsidian via `Ctrl/Cmd-Alt-I` from inside Obsidian.

---

## 16. First-PR Scaffold

Files to create in this exact order. After running through, `git push` yields a buildable plugin.

### 1. `.gitignore`

```
node_modules/
main.js
*.js.map
data.json
.DS_Store
.vscode/.tmp/
```

> Note: many plugins commit `main.js`. The community is split. We do NOT commit it; the GitHub Action attaches it at release.

### 2. `manifest.json`

```json
{
  "id": "echo-note",
  "name": "Echo Note",
  "version": "1.0.0",
  "minAppVersion": "1.5.0",
  "description": "Print the active note's title and word count from the command palette or ribbon.",
  "author": "Your Name",
  "authorUrl": "https://github.com/your-github",
  "fundingUrl": "",
  "isDesktopOnly": false
}
```

### 3. `versions.json`

```json
{
  "1.0.0": "1.5.0"
}
```

### 4. `package.json`

```json
{
  "name": "echo-note",
  "version": "1.0.0",
  "description": "Print the active note's title and word count.",
  "main": "main.js",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc --noEmit && node esbuild.config.mjs production",
    "check": "tsc --noEmit && biome check .",
    "format": "biome format --write .",
    "test": "vitest",
    "version": "node version-bump.mjs && git add manifest.json versions.json"
  },
  "keywords": ["obsidian-plugin"],
  "author": "Your Name",
  "license": "MIT",
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@types/node": "20.14.0",
    "builtin-modules": "3.3.0",
    "esbuild": "0.25.0",
    "obsidian": "latest",
    "tslib": "2.7.0",
    "typescript": "5.7.2",
    "vitest": "3.0.0"
  },
  "engines": {
    "node": ">=20"
  }
}
```

### 5. `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2018",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2018", "DOM"],
    "strict": true,
    "noImplicitAny": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "baseUrl": ".",
    "inlineSourceMap": true,
    "inlineSources": true,
    "noEmit": true
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

### 6. `esbuild.config.mjs`

```js
import esbuild from 'esbuild';
import process from 'process';
import builtins from 'builtin-modules';

const banner =
`/*
 * Echo Note — Obsidian plugin bundle.
 * DO NOT EDIT main.js by hand. Re-run npm run build.
 */
`;

const prod = process.argv[2] === 'production';

const ctx = await esbuild.context({
  banner: { js: banner },
  entryPoints: ['src/main.ts'],
  bundle: true,
  external: [
    'obsidian',
    'electron',
    '@codemirror/autocomplete',
    '@codemirror/collab',
    '@codemirror/commands',
    '@codemirror/language',
    '@codemirror/lint',
    '@codemirror/search',
    '@codemirror/state',
    '@codemirror/view',
    '@lezer/common',
    '@lezer/highlight',
    '@lezer/lr',
    ...builtins,
  ],
  format: 'cjs',
  target: 'es2018',
  logLevel: 'info',
  sourcemap: prod ? false : 'inline',
  treeShaking: true,
  outfile: 'main.js',
  minify: prod,
});

if (prod) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}
```

### 7. `version-bump.mjs`

```js
import { readFileSync, writeFileSync } from 'fs';

const targetVersion = process.env.npm_package_version;

const manifest = JSON.parse(readFileSync('manifest.json', 'utf8'));
const { minAppVersion } = manifest;
manifest.version = targetVersion;
writeFileSync('manifest.json', JSON.stringify(manifest, null, '\t') + '\n');

const versions = JSON.parse(readFileSync('versions.json', 'utf8'));
versions[targetVersion] = minAppVersion;
writeFileSync('versions.json', JSON.stringify(versions, null, '\t') + '\n');
```

### 8. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": { "noExplicitAny": "warn" },
      "style": { "useImportType": "error" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "tab",
    "lineWidth": 100
  },
  "files": {
    "ignore": ["main.js", "node_modules", "*.js.map"]
  }
}
```

### 9. `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
  },
  resolve: {
    alias: {
      obsidian: resolve(__dirname, 'tests/__mocks__/obsidian.ts'),
    },
  },
});
```

### 10. `tests/setup.ts`

```ts
import { vi } from 'vitest';
vi.mock('obsidian');
```

### 11. `tests/__mocks__/obsidian.ts`

```ts
// Hand-rolled stubs for the parts of `obsidian` we use.
// Add to it as you import new things from 'obsidian' in src/.

export class Plugin {
  app: App;
  manifest: { id: string; version: string };
  constructor(app: App, manifest: { id: string; version: string }) {
    this.app = app;
    this.manifest = manifest;
  }
  addCommand(_: unknown) {}
  addRibbonIcon(_a: string, _b: string, _c: (e: MouseEvent) => unknown) {
    return document.createElement('div');
  }
  addSettingTab(_: unknown) {}
  registerEvent(_: unknown) {}
  registerDomEvent(_a: unknown, _b: string, _c: (...args: unknown[]) => unknown) {}
  registerInterval(_: number) {}
  async loadData() { return {}; }
  async saveData(_: unknown) {}
  async onload() {}
  onunload() {}
}

export class App {
  vault = new Vault();
  workspace = { getActiveFile: () => null, on: () => ({}), onLayoutReady: (cb: () => void) => cb() };
  metadataCache = { getFileCache: () => null, on: () => ({}) };
}

export class Vault {
  async read(_: TFile) { return ''; }
  async modify(_: TFile, _data: string) {}
  async create(_path: string, _data: string) { return new TFile(); }
  on(_: string, _cb: (...a: unknown[]) => unknown) { return {}; }
  adapter = {
    exists: async (_: string) => true,
    read: async (_: string) => '',
    write: async (_: string, _data: string) => {},
  };
}

export class TFile {
  path = '';
  basename = '';
  extension = 'md';
}

export class Notice {
  constructor(public message: string, public timeout?: number) {}
}

export class Modal {
  app: App;
  contentEl: HTMLElement;
  constructor(app: App) {
    this.app = app;
    this.contentEl = document.createElement('div');
  }
  open() {}
  close() {}
  onOpen() {}
  onClose() {}
}

export class PluginSettingTab {
  app: App;
  plugin: Plugin;
  containerEl: HTMLElement;
  constructor(app: App, plugin: Plugin) {
    this.app = app;
    this.plugin = plugin;
    this.containerEl = document.createElement('div');
  }
  display() {}
  hide() {}
}

export class Setting {
  constructor(public containerEl: HTMLElement) {}
  setName(_: string) { return this; }
  setDesc(_: string) { return this; }
  addText(cb: (t: { setValue: (v: string) => unknown; onChange: (cb: (v: string) => unknown) => unknown }) => unknown) {
    cb({ setValue: () => ({}), onChange: () => ({}) });
    return this;
  }
  addToggle(cb: (t: { setValue: (v: boolean) => unknown; onChange: (cb: (v: boolean) => unknown) => unknown }) => unknown) {
    cb({ setValue: () => ({}), onChange: () => ({}) });
    return this;
  }
}

export class EditorSuggest<T> {
  constructor(public app: App) {}
  onTrigger(_a: unknown, _b: unknown, _c: unknown): unknown { return null; }
  getSuggestions(_: unknown): T[] | Promise<T[]> { return []; }
  renderSuggestion(_v: T, _el: HTMLElement) {}
  selectSuggestion(_v: T, _e: KeyboardEvent | MouseEvent) {}
}

export function normalizePath(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/+/g, '/').replace(/^\/+/, '').replace(/\/+$/, '');
}

export function setIcon(_el: HTMLElement, _name: string) {}
export function addIcon(_name: string, _svg: string) {}

export const Platform = { isDesktopApp: true, isMobileApp: false, isMobile: false };

export async function requestUrl(_: { url: string }): Promise<{ status: number; text: string; json: unknown }> {
  return { status: 200, text: '', json: null };
}

export function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
```

### 12. `tests/format.test.ts`

```ts
import { describe, it, expect } from 'vitest';
import { wordCount, summary } from '../src/lib/format';

describe('format', () => {
  it('counts words', () => {
    expect(wordCount('one two three')).toBe(3);
    expect(wordCount('   ')).toBe(0);
  });
  it('summarizes a note', () => {
    expect(summary('Hello world', 'Daily/2026-04-27.md')).toContain('Daily/2026-04-27.md');
    expect(summary('Hello world', 'x.md')).toMatch(/2 words/);
  });
});
```

### 13. `src/lib/format.ts`

```ts
export function wordCount(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

export function summary(text: string, path: string): string {
  return `${path}: ${wordCount(text)} words`;
}
```

### 14. `src/lib/log.ts`

```ts
const PREFIX = '[echo-note]';
export const log = {
  debug: (...a: unknown[]) => console.debug(PREFIX, ...a),
  info:  (...a: unknown[]) => console.info(PREFIX, ...a),
  warn:  (...a: unknown[]) => console.warn(PREFIX, ...a),
  error: (...a: unknown[]) => console.error(PREFIX, ...a),
};
```

### 15. `src/settings.ts`

```ts
import { App, PluginSettingTab, Setting } from 'obsidian';
import type EchoNotePlugin from './main';

export interface EchoSettings {
  showNotice: boolean;
  prefix: string;
}

export const DEFAULT_SETTINGS: EchoSettings = {
  showNotice: true,
  prefix: 'Echo:',
};

export class EchoSettingTab extends PluginSettingTab {
  plugin: EchoNotePlugin;

  constructor(app: App, plugin: EchoNotePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName('Show notice')
      .setDesc('Show a toast when the echo command runs.')
      .addToggle((t) =>
        t
          .setValue(this.plugin.settings.showNotice)
          .onChange(async (v) => {
            this.plugin.settings.showNotice = v;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName('Prefix')
      .setDesc('Text shown before the summary.')
      .addText((t) =>
        t
          .setValue(this.plugin.settings.prefix)
          .onChange(async (v) => {
            this.plugin.settings.prefix = v;
            await this.plugin.saveSettings();
          }),
      );
  }
}
```

### 16. `src/modal.ts`

```ts
import { App, Modal } from 'obsidian';

export class EchoModal extends Modal {
  constructor(app: App, private body: string) {
    super(app);
  }

  onOpen() {
    this.contentEl.createEl('h2', { text: 'Echo Note' });
    this.contentEl.createEl('p', { text: this.body });
  }

  onClose() {
    this.contentEl.empty();
  }
}
```

### 17. `src/suggest.ts`

```ts
import { App, Editor, EditorPosition, EditorSuggest, EditorSuggestContext, EditorSuggestTriggerInfo, TFile } from 'obsidian';

const TRIGGER = /\/echo\s+([^\s]*)$/;

interface EchoOption {
  label: string;
  inserts: string;
}

export class EchoEditorSuggest extends EditorSuggest<EchoOption> {
  constructor(app: App) {
    super(app);
  }

  onTrigger(cursor: EditorPosition, editor: Editor, _file: TFile | null): EditorSuggestTriggerInfo | null {
    const line = editor.getLine(cursor.line).slice(0, cursor.ch);
    const m = line.match(TRIGGER);
    if (!m) return null;
    return {
      start: { line: cursor.line, ch: cursor.ch - m[0].length },
      end: cursor,
      query: m[1] ?? '',
    };
  }

  getSuggestions(ctx: EditorSuggestContext): EchoOption[] {
    const opts: EchoOption[] = [
      { label: 'date', inserts: new Date().toISOString().slice(0, 10) },
      { label: 'time', inserts: new Date().toTimeString().slice(0, 5) },
    ];
    const q = ctx.query.toLowerCase();
    return q ? opts.filter((o) => o.label.startsWith(q)) : opts;
  }

  renderSuggestion(value: EchoOption, el: HTMLElement) {
    el.createEl('div', { text: value.label });
  }

  selectSuggestion(value: EchoOption, _evt: KeyboardEvent | MouseEvent) {
    if (!this.context) return;
    const { editor, start, end } = this.context;
    editor.replaceRange(value.inserts, start, end);
  }
}
```

### 18. `src/main.ts`

```ts
import { Notice, Plugin, TFile, normalizePath } from 'obsidian';
import { DEFAULT_SETTINGS, EchoSettings, EchoSettingTab } from './settings';
import { EchoModal } from './modal';
import { EchoEditorSuggest } from './suggest';
import { summary } from './lib/format';
import { log } from './lib/log';

export default class EchoNotePlugin extends Plugin {
  settings: EchoSettings = DEFAULT_SETTINGS;

  async onload() {
    const t = performance.now();
    await this.loadSettings();

    this.addRibbonIcon('mic', 'Echo Note', () => this.echoActive());

    this.addCommand({
      id: 'echo-active',
      name: 'Print active note title and word count',
      callback: () => this.echoActive(),
    });

    this.addCommand({
      id: 'echo-active-modal',
      name: 'Echo active note in a modal',
      checkCallback: (checking) => {
        const file = this.app.workspace.getActiveFile();
        if (!file) return false;
        if (!checking) this.echoActive(true);
        return true;
      },
    });

    this.registerEvent(
      this.app.workspace.on('file-menu', (menu, file) => {
        if (!(file instanceof TFile)) return;
        menu.addItem((item) => {
          item.setTitle('Echo this note').setIcon('mic').onClick(() => this.echoFile(file));
        });
      }),
    );

    this.registerEditorSuggest(new EchoEditorSuggest(this.app));

    this.addSettingTab(new EchoSettingTab(this.app, this));

    log.info('onload v', this.manifest.version, 'ms', Math.round(performance.now() - t));
  }

  onunload() {
    log.info('onunload');
    // All register* resources are auto-cleaned. No manual work needed.
  }

  async loadSettings() {
    const loaded = (await this.loadData()) as Partial<EchoSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async echoActive(asModal = false) {
    const file = this.app.workspace.getActiveFile();
    if (!file) {
      new Notice('Echo Note: no active file');
      return;
    }
    await this.echoFile(file, asModal);
  }

  private async echoFile(file: TFile, asModal = false) {
    try {
      const safePath = normalizePath(file.path);
      const text = await this.app.vault.read(file);
      const body = `${this.settings.prefix} ${summary(text, safePath)}`;
      log.info('command run command="echo-active" path=', safePath);
      if (asModal) {
        new EchoModal(this.app, body).open();
      } else if (this.settings.showNotice) {
        new Notice(body);
      }
    } catch (err) {
      log.error('echoFile failed', err);
      new Notice('Echo Note: failed to read file (see console)');
    }
  }
}
```

### 19. `styles.css`

```css
.echo-note-modal {
  padding: 1rem;
  font-family: var(--font-text);
}

.echo-note-modal h2 {
  margin: 0 0 0.5rem 0;
}
```

### 20. `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - '[0-9]+.[0-9]+.[0-9]+'

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - run: npm run check

      - run: npm test -- --run

      - run: npm run build

      - name: Create release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          tag="${GITHUB_REF#refs/tags/}"
          gh release create "$tag" \
            --title "$tag" \
            --notes "Release $tag" \
            main.js manifest.json styles.css
```

### 21. `LICENSE`

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

### 22. `README.md`

```md
# Echo Note

A small Obsidian plugin: prints the title and word count of the active note via command palette, ribbon, file menu, or `/echo` in the editor.

## Install (after listing)

Settings → Community plugins → Browse → search "Echo Note" → Install → Enable.

## Manual install (before listing)

1. Download `main.js`, `manifest.json`, `styles.css` from the latest GitHub Release.
2. Drop them in `<vault>/.obsidian/plugins/echo-note/`.
3. In Obsidian: Settings → Community plugins → Enable Echo Note.

## Develop

```sh
npm install
npm run dev
```

Symlink the project folder into a test vault at `.obsidian/plugins/echo-note`.

## Submission to the Community Plugins directory

This plugin appears in `Settings → Community plugins → Browse` because of one PR
to `obsidianmd/obsidian-releases` adding an entry to `community-plugins.json`.

To list a NEW plugin (skip if already listed):

1. Fork `obsidianmd/obsidian-releases`.
2. Append to `community-plugins.json`:

   ```json
   {
     "id": "echo-note",
     "name": "Echo Note",
     "author": "Your Name",
     "description": "Print the active note's title and word count.",
     "repo": "your-github/echo-note"
   }
   ```

3. Open a PR titled `Add plugin: Echo Note`.
4. The validator bot runs. It checks `manifest.json` is at repo root and on the
   latest release, that `versions.json` exists, that the tag has no leading `v`,
   that `LICENSE` and `README.md` exist, and that the `id` is unique.
5. A maintainer reviews. Iterate in the same PR until merged.

After merge, the plugin shows up in the directory. Future versions auto-update
from your GitHub Releases — you do NOT open a second PR for releases.

## Releasing

```sh
npm version patch        # bumps manifest.json + versions.json + package.json
git push origin main --follow-tags
```

The release workflow attaches `main.js`, `manifest.json`, and `styles.css` to a
GitHub Release named after the bare version (no `v`).

## License

MIT.
```

After the 22 files exist:

```sh
npm install
npm run check
npm test -- --run
npm run build
git add .
git commit -m "feat: scaffold Echo Note plugin"
git push -u origin main
```

The repo is now a complete, listable Obsidian plugin.

---

## 17. Idea → MVP Path

`PROJECT_IDEA = echo-note` (a generic command plugin).

### Phase 1 — Schema (1 session)

Files: `src/settings.ts`, `manifest.json`, `versions.json`.
Define `EchoSettings { showNotice: boolean; prefix: string }`.
Exit: `npm run check` clean.

### Phase 2 — Backbone (1 session)

Files: `src/main.ts` (`onload`/`onunload` skeleton; load+save settings; addSettingTab).
Wire one no-op command. Wire ribbon icon.
Exit: plugin enables in vault, command appears in palette, settings tab is visible.

### Phase 3 — Vertical slice (1–2 sessions)

Files: `src/lib/format.ts` + `tests/format.test.ts`; flesh out `echoActive` in `src/main.ts`; add `EchoModal`; add `EchoEditorSuggest`; add file-menu entry.
Exit: command, ribbon, file-menu, modal-mode, and `/echo` suggester each fire and show correct text. Tests green.

### Phase 4 — "Auth + multi-user"

N/A in plugin land. Map this phase to **mobile + cross-OS validation**:
- Toggle `isDesktopOnly: false`.
- Test in Obsidian Mobile (sideload `main.js`/`manifest.json`/`styles.css` into `<vault>/.obsidian/plugins/echo-note/` via the desktop sync of the same vault).
- Verify `Platform.isMobile` paths if any.
Exit: same five surfaces work on iOS or Android Obsidian.

### Phase 5 — Ship + monitor (1 session)

Files: `.github/workflows/release.yml` (already done), `README.md`, `LICENSE`.
- `npm version 1.0.0 && git push --follow-tags`.
- Confirm release assets attached.
- Open PR to `obsidianmd/obsidian-releases`.
- Once merged, monitor GitHub Issues for the next 2 weeks; respond within 48 hours per submission policy.
Exit: appears in `Settings → Community plugins → Browse`.

---

## 18. Feature Recipes

### 18.1 Settings tab

Files: `src/settings.ts` (full content in §16 #15). Wire in `main.ts`:

```ts
this.addSettingTab(new EchoSettingTab(this.app, this));
```

### 18.2 Modal

Files: `src/modal.ts` (full content in §16 #16). Open via:

```ts
new EchoModal(this.app, 'Hello world').open();
```

### 18.3 Ribbon command

```ts
const ribbon = this.addRibbonIcon('mic', 'Echo Note', () => this.echoActive());
ribbon.addClass('echo-note-ribbon');
```

### 18.4 File-menu item

```ts
this.registerEvent(
  this.app.workspace.on('file-menu', (menu, file) => {
    if (!(file instanceof TFile)) return;
    menu.addItem((item) => {
      item.setTitle('Echo this note').setIcon('mic').onClick(() => this.echoFile(file));
    });
  }),
);
```

### 18.5 EditorSuggest (`/foo` style trigger)

Full file in §16 #17. Register in `onload`:

```ts
this.registerEditorSuggest(new EchoEditorSuggest(this.app));
```

### 18.6 Status bar item

```ts
const item = this.addStatusBarItem();
item.setText('Echo: ready');
```

### 18.7 Custom view (sidebar pane)

```ts
import { ItemView, WorkspaceLeaf } from 'obsidian';

export const ECHO_VIEW = 'echo-note-view';

export class EchoView extends ItemView {
  constructor(leaf: WorkspaceLeaf) { super(leaf); }
  getViewType() { return ECHO_VIEW; }
  getDisplayText() { return 'Echo Note'; }
  async onOpen() { this.contentEl.createEl('h2', { text: 'Echo Note' }); }
  async onClose() {}
}

// in main.ts onload:
this.registerView(ECHO_VIEW, (leaf) => new EchoView(leaf));
this.addCommand({
  id: 'echo-open-view',
  name: 'Open Echo view',
  callback: async () => {
    const leaf = this.app.workspace.getRightLeaf(false);
    if (!leaf) return;
    await leaf.setViewState({ type: ECHO_VIEW, active: true });
    this.app.workspace.revealLeaf(leaf);
  },
});

// in onunload:
// Obsidian auto-detaches registered views — do not call detachLeavesOfType here.
```

### 18.8 HTTP request (CORS-safe)

```ts
import { requestUrl } from 'obsidian';

const r = await requestUrl({ url: 'https://api.example.com/x' });
if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
const data = r.json;
```

### 18.9 Persisted user state migration

```ts
async loadSettings() {
  const loaded = (await this.loadData()) as (Partial<EchoSettings> & { legacyPrefix?: string }) | null;
  const merged = Object.assign({}, DEFAULT_SETTINGS, loaded);
  // Migration: legacyPrefix → prefix
  if (loaded?.legacyPrefix && !loaded.prefix) merged.prefix = loaded.legacyPrefix;
  this.settings = merged;
  await this.saveSettings();
}
```

### 18.10 Mobile-only or desktop-only branch

```ts
import { Platform } from 'obsidian';

if (Platform.isMobileApp) {
  // mobile-only logic
} else {
  // desktop-only logic; safe to use Electron features behind a guard,
  // BUT prefer the Obsidian API even on desktop.
}
```

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Failed to load plugin echo-note` toast | Check devtools console — usually missing `main.js`. Run `npm run build`. |
| `Plugin echo-note disabled because the manifest is invalid` | `manifest.json` JSON parse error or missing `id`. Run `node -e 'JSON.parse(require("fs").readFileSync("manifest.json","utf8"))'`. |
| `Cannot find module 'obsidian'` at build | `npm install` again. `obsidian` is a devDep. |
| `Uncaught Error: 'Plugin' is not a constructor` | You bundled the `obsidian` module. Make sure `external: ['obsidian', …]` is in `esbuild.config.mjs`. |
| Plugin shows in directory but no install button | `manifest.json` on the latest Release is missing or version mismatch. Re-tag. |
| Auto-update doesn't fire on older Obsidian | `versions.json` missing the latest version. Add `"1.0.1": "1.5.0"`, redeploy. |
| Tag `v1.0.1` not detected | Re-tag without the `v`: `git tag -d v1.0.1 && git tag 1.0.1 && git push origin :v1.0.1 1.0.1`. |
| Mobile crashes on enable | You imported a Node module. Search for `from "fs"`, `from "node:`, `require("path")`. |
| `app.vault.adapter.basePath is not a function` on mobile | Mobile has no basePath. Use `Vault.read` / `Vault.modify`, never adapter paths. |
| `Notice` doesn't appear | You're holding the active leaf in a modal that grabs focus. Try `setTimeout(() => new Notice(…), 0)`. |
| EditorSuggest fires on every keystroke and lags | Your `onTrigger` returns a non-null too eagerly. Anchor your regex with `$` and require explicit prefix. |
| `requestUrl` returns `{ status: 0 }` | URL invalid or DNS failed; wrap in try/catch and `Notice` the user. |
| Hot reload doesn't pick up changes | Ensure `.hotreload` file exists in plugin folder; toggle `pjeby/hot-reload` plugin off and on. |
| Settings tab opens blank | You forgot `containerEl.empty()` at the top of `display()`. Add it. |
| Settings revert after Obsidian quit | Missing `await` on `this.saveSettings()` inside an `onChange`. |
| Plugin id collision in PR | Search `community-plugins.json` for your `id` before opening the PR. Pick a different one. |
| `npm version` failed: working tree dirty | Commit or stash first; `npm version` runs against a clean tree. |
| GitHub Release exists but no assets | The workflow ran before `npm run build`. Re-tag, ensure `npm run build` precedes `gh release create`. |
| Biome warns about `useImportType` | Change `import { Foo }` to `import type { Foo }` where Foo is types-only. |
| `tsc` errors on `obsidian` types | Bump `obsidian` devDep: `npm install -D obsidian@latest`. |
| Plugin enabled but ribbon icon missing | Lucide icon name typo. Browse https://lucide.dev/icons/ for valid names. |
| Console: `[Violation] 'click' handler took 80ms` | Move work off the click; show a `Notice('Working…')` then await. |
| Test fails: `Cannot find module 'obsidian'` | `vitest.config.ts` missing the alias to `tests/__mocks__/obsidian.ts`. |
| `npm install` hangs on Windows | Disable antivirus realtime scanning of `node_modules`. |
| `gh release create` fails: `tag already exists` | Delete the bad release: `gh release delete 1.0.1 --yes`, fix, re-tag. |
| PR to `obsidian-releases` rejected for "duplicate id" | Choose a new `id`, also rename folder + repo. |
| PR to `obsidian-releases` rejected for "uses innerHTML" | Replace `el.innerHTML = …` with `el.createEl(...)` / `el.setText(...)`. |
| Mobile: `eval` blocked | You shipped `eval` somewhere (often a transpiled `new Function`). Audit bundle. |
| `manifest.json.fundingUrl` rejected | If empty, omit the key entirely. Don't ship `"fundingUrl": ""`. |

---

## 20. Glossary

- **Vault** — A folder of markdown files that Obsidian treats as the user's notebook.
- **Plugin** — A JS bundle inside `<vault>/.obsidian/plugins/<id>/` that Obsidian loads at startup if the user enabled it.
- **Community Plugin** — A plugin listed in the official directory (`community-plugins.json`), discoverable in Obsidian's UI.
- **Manifest (`manifest.json`)** — Plugin metadata Obsidian reads: `id`, `name`, `version`, `minAppVersion`, `description`, `author`, `isDesktopOnly`.
- **`versions.json`** — A map of plugin versions to the minimum Obsidian app version each requires. Drives backward-compatible updates.
- **`minAppVersion`** — The earliest Obsidian build that can load this plugin.
- **`isDesktopOnly`** — A boolean in `manifest.json`. `true` hides the plugin from the mobile directory.
- **Ribbon** — The vertical bar of icons on the left side of Obsidian's UI. Plugins add icons via `addRibbonIcon`.
- **Command palette** — Obsidian's Ctrl/Cmd-P fuzzy command launcher.
- **Modal** — A blocking dialog. Subclass `Modal`.
- **Notice** — A 5-second toast. `new Notice('text')`.
- **Setting tab** — Plugin-specific page inside Obsidian's Settings UI. Subclass `PluginSettingTab`.
- **EditorSuggest** — A typeahead that triggers on a regex while editing. Used for `/`-prefixed slash commands inside notes.
- **SuggestModal** — A standalone fuzzy picker, like the command palette.
- **Vault adapter** — The low-level file IO layer. Differs between desktop (Electron) and mobile (Capacitor). Use the high-level `Vault` API instead.
- **`normalizePath`** — Obsidian's path canonicalizer. Always use it.
- **`requestUrl`** — Obsidian's CORS-bypassing HTTP call. Use instead of `fetch`.
- **CodeMirror** — The editor library Obsidian uses. Plugins can extend the editor via `@codemirror/*` packages, which must be marked external in esbuild.
- **`pjeby/hot-reload`** — A dev-only plugin that watches `.hotreload`-marked plugin folders and re-enables them on file change.
- **Capacitor** — The mobile webview wrapper Obsidian uses on iOS/Android. Has no Node.
- **Electron** — The desktop wrapper. Has Node, but plugin code should not lean on it.
- **Lucide** — The icon set Obsidian ships. Names like `mic`, `dice`, `book`. Browse at https://lucide.dev/icons/.
- **`data.json`** — Per-plugin JSON file inside `<vault>/.obsidian/plugins/<id>/`. Written by `saveData()`. NOT committed.
- **Sample plugin** — `obsidianmd/obsidian-sample-plugin`, the official starter template.
- **Obsidian Releases** — `obsidianmd/obsidian-releases`, the GitHub repo whose `community-plugins.json` is the directory.
- **Submission PR** — A pull request to that repo adding a `community-plugins.json` entry; required ONCE per plugin.
- **`onLayoutReady`** — Workspace event that fires after Obsidian's UI is ready; the safe place to do non-critical onload work.
- **`registerEvent` / `registerDomEvent` / `registerInterval`** — Plugin methods that wrap an event/listener/interval and auto-clean it up on unload.

---

## 21. Update Cadence

- This rulebook is valid for Obsidian Desktop **1.5.0 through 1.12.x**, sample-plugin master as of 2026-04-27, esbuild 0.25.x, TypeScript 5.7.x, Vitest 3.x, Biome 1.9.x.
- Re-run the generator when:
  - Obsidian releases a new minor (e.g. 1.13) — check the changelog for new APIs and any deprecated ones at https://obsidian.md/changelog/.
  - The community-plugins submission requirements change — see https://docs.obsidian.md/Plugins/Releasing/Submission+requirements+for+plugins.
  - esbuild bumps a major (0.26+).
  - The mobile platform (Capacitor) changes meaningfully.
  - A security advisory drops for any pinned dep.

Last revised: 2026-04-27.
