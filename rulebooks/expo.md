# React Native + Expo Rulebook

> Universal native apps (iOS + Android) with one TypeScript codebase, file-based routing, and over-the-air updates. Generated 2026-04-27.

---

## 1. Snapshot

**Stack:** React Native 0.85.2 + Expo SDK 55.0.15 + expo-router 55.0.12 + Reanimated 4.3.0 + Zustand 5.0.12 + Drizzle ORM + expo-sqlite + EAS Build/Submit/Update.

**Tagline:** One TypeScript repo, two stores, zero native code edits — ship via OTA when you can, native build when you must.

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 strict | Type-safe; Expo templates ship strict tsconfig. |
| Runtime + version | Node.js 24.15.0 LTS | Current LTS; required by latest Metro + EAS CLI. |
| Package manager | pnpm 9 | Strict, fast, deterministic; works with Metro hoisting. |
| Build tool | EAS Build (cloud) | No local Xcode/Studio needed; reproducible iOS+Android. |
| State mgmt | Zustand 5.0.12 | Tiny, no boilerplate, useSyncExternalStore-native. |
| Routing/Nav | expo-router 55.0.12 | File-based, deep links, typed routes, official. |
| Data layer (db + orm) | Drizzle ORM + expo-sqlite | Local-first, typed SQL, live queries hook. |
| Auth | Clerk Expo SDK | Handles iOS/Android OAuth + secure storage out of box. |
| Styling | NativeWind 4 (Tailwind) | Atomic styles; same DX as web; no runtime cost. |
| Forms + validation | react-hook-form + zod | Performant; resolver pattern; shared schema with API. |
| Unit test runner | Jest 30 + jest-expo 55.0.16 | Official Expo preset; mocks native modules. |
| E2E framework | Maestro 1.40 | YAML, parallel by default, no app modification needed. |
| Mocking strategy | MSW 2 + jest-expo native mocks | Network mocked at adapter; native modules via preset. |
| Logger | Pino + react-native-logs transport | Structured JSON; Sentry forwarder in prod. |
| Error tracking | Sentry @sentry/react-native 8.8.0 | Native crashes + JS errors + replay; Expo plugin. |
| Lint + format | Biome 2 + ESLint hooks-only | Biome 20× faster; ESLint covers react-hooks/exhaustive-deps. |
| Type checking | tsc --noEmit (strict) | Single source of truth; runs in CI. |
| Env vars + secrets | EAS Secrets + expo-constants | Build-time injection; never commit .env. |
| CI provider | GitHub Actions | Free tier, EAS CLI integration, ubiquitous. |
| Deploy target | App Store + Google Play via EAS Submit | Official; auto credentials; no fastlane needed. |
| Release flow | EAS Build → EAS Submit → store review | Single command per platform; cloud-signed. |
| Auto-update | EAS Update (expo-updates) | OTA JS bundle; runtime version policy = fingerprint. |
| JS engine | Hermes V1 (default in RN 0.84+) | Fastest startup; smaller bundle; no JSC fallback. |
| Native modules | Expo config plugins only | No raw `ios/` `android/` edits; prebuild reproducible. |
| App config | `app.config.ts` (TypeScript) | Dynamic; reads env; type-checked. |
| Push provider | Expo Push Service → FCM/APNs | One token, both platforms; no native cert wrangling. |
| Deeplink scheme | `myapp://` + universal links via EAS | Configured in app.config.ts; verified by EAS. |
| Secure storage | expo-secure-store (Keychain/Keystore) | Hardware-backed; never AsyncStorage for tokens. |
| Persistent KV | react-native-mmkv 4 | 30× faster than AsyncStorage; sync API; encrypted. |
| Image | expo-image 55.0.9 | SDWebImage/Glide; blurhash; placeholder. |
| Animation | Reanimated 4.3.0 | New Arch only; UI-thread; required by RN 0.85. |
| Gestures | react-native-gesture-handler 3 | Bundled in Expo; required by Reanimated. |
| Drawing | @shopify/react-native-skia 2 | GPU canvas; charts, custom UI, 60fps. |

### Versions Table

| Library | Version | Released | Source |
|---|---|---|---|
| expo | 55.0.15 | 2026-04-20 | https://www.npmjs.com/package/expo |
| react-native | 0.85.2 | 2026-04-21 | https://www.npmjs.com/package/react-native |
| react | 19.1.0 | 2026-03-03 | https://www.npmjs.com/package/react |
| expo-router | 55.0.12 | 2026-04-17 | https://www.npmjs.com/package/expo-router |
| react-native-reanimated | 4.3.0 | 2026-03-25 | https://www.npmjs.com/package/react-native-reanimated |
| react-native-gesture-handler | 3.0.1 | 2026-04-10 | https://www.npmjs.com/package/react-native-gesture-handler |
| @shopify/react-native-skia | 2.4.0 | 2026-04-08 | https://www.npmjs.com/package/@shopify/react-native-skia |
| expo-sqlite | 16.0.4 | 2026-04-15 | https://www.npmjs.com/package/expo-sqlite |
| drizzle-orm | 0.42.0 | 2026-04-12 | https://www.npmjs.com/package/drizzle-orm |
| drizzle-kit | 0.30.0 | 2026-04-12 | https://www.npmjs.com/package/drizzle-kit |
| zustand | 5.0.12 | 2026-03-25 | https://www.npmjs.com/package/zustand |
| @tanstack/react-query | 5.62.0 | 2026-04-02 | https://www.npmjs.com/package/@tanstack/react-query |
| expo-updates | 0.30.4 | 2026-04-18 | https://www.npmjs.com/package/expo-updates |
| @sentry/react-native | 8.8.0 | 2026-04-23 | https://www.npmjs.com/package/@sentry/react-native |
| jest-expo | 55.0.16 | 2026-04-20 | https://www.npmjs.com/package/jest-expo |
| jest | 30.1.0 | 2026-03-15 | https://www.npmjs.com/package/jest |
| @testing-library/react-native | 13.2.0 | 2026-03-30 | https://www.npmjs.com/package/@testing-library/react-native |
| eas-cli | 14.5.0 | 2026-04-22 | https://www.npmjs.com/package/eas-cli |
| react-native-mmkv | 4.0.5 | 2026-03-18 | https://www.npmjs.com/package/react-native-mmkv |
| expo-secure-store | 14.0.2 | 2026-04-15 | https://www.npmjs.com/package/expo-secure-store |
| nativewind | 4.2.0 | 2026-03-10 | https://www.npmjs.com/package/nativewind |
| tailwindcss | 3.4.17 | 2026-02-12 | https://www.npmjs.com/package/tailwindcss |
| react-hook-form | 7.55.0 | 2026-03-22 | https://www.npmjs.com/package/react-hook-form |
| zod | 3.24.0 | 2026-03-04 | https://www.npmjs.com/package/zod |
| @biomejs/biome | 2.4.0 | 2026-04-01 | https://www.npmjs.com/package/@biomejs/biome |
| typescript | 5.7.3 | 2026-01-15 | https://www.npmjs.com/package/typescript |

### Minimum Host Requirements

- **macOS 14.6+** (only host that builds for iOS locally; cloud builds work from any OS).
- **Windows 11** or **Ubuntu 22.04+** for Android-only local builds.
- **8 GB RAM minimum, 16 GB recommended.**
- **20 GB free disk** (Xcode + Android SDK + node_modules).
- **Node.js 24.15.0 LTS** (required by latest Metro and EAS CLI).
- **Xcode 16.1+** (for iOS local builds; not needed if using EAS Build).
- **JDK 17** (Android local builds).
- **Android Studio Hedgehog or later** (Android local builds; AVD for emulator).

### Cold-Start Time

- `git clone` to running iOS app on simulator: **~12 minutes** (first time, fresh machine, EAS Build cloud).
- Subsequent dev server starts: **~15 seconds** to QR code + Metro ready.

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew (paste in Terminal)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Node.js + pnpm + git + watchman
brew install node@24 pnpm git watchman

# 3. Install Xcode from Mac App Store (search "Xcode", click GET, ~12 GB download)
#    Then open it once, accept license, and run:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch

# 4. Install iOS Simulator runtime (Xcode → Settings → Platforms → iOS)
#    Wait for download. Verify:
xcrun simctl list devices | head

# 5. Install CocoaPods (only needed for local iOS builds; EAS Build doesn't need it)
brew install cocoapods

# 6. Install JDK 17 + Android Studio (only if building Android locally)
brew install --cask zulu@17 android-studio
#    Open Android Studio, accept SDK license, install Android 15 (API 35) via SDK Manager.

# 7. Install EAS CLI (cloud builds, submit, update)
pnpm add -g eas-cli

# 8. Install Expo CLI (bundled with the project, but the global one is handy)
pnpm add -g expo

# 9. Login to Expo (creates account if needed at https://expo.dev/signup)
eas login

# 10. Install Maestro (E2E)
curl -Ls "https://get.maestro.mobile.dev" | bash
```

### Windows

```powershell
# 1. Install winget (preinstalled on Win11)
# 2. Install Node + pnpm + git
winget install -e --id OpenJS.NodeJS.LTS
winget install -e --id pnpm.pnpm
winget install -e --id Git.Git

# 3. Install JDK 17
winget install -e --id Azul.Zulu.17.JDK

# 4. Install Android Studio
winget install -e --id Google.AndroidStudio
# Open it → SDK Manager → install Android 15 (API 35) + AVD.

# 5. Set ANDROID_HOME (PowerShell, run as admin)
[System.Environment]::SetEnvironmentVariable('ANDROID_HOME', "$env:LOCALAPPDATA\Android\Sdk", 'User')
[System.Environment]::SetEnvironmentVariable('Path', "$env:Path;$env:LOCALAPPDATA\Android\Sdk\platform-tools", 'User')

# 6. EAS CLI + Expo CLI
pnpm add -g eas-cli expo

# 7. Login
eas login

# NOTE: Windows cannot build for iOS locally. Use EAS Build (cloud).
```

### Linux (Ubuntu 22.04+)

```bash
# 1. Install Node 24 via fnm
curl -fsSL https://fnm.vercel.app/install | bash
exec $SHELL
fnm install 24
fnm use 24

# 2. pnpm
corepack enable && corepack prepare pnpm@latest --activate

# 3. JDK 17
sudo apt update && sudo apt install -y openjdk-17-jdk git curl unzip

# 4. Android Studio (snap)
sudo snap install android-studio --classic
# Open it → SDK Manager → install Android 15 (API 35) + AVD.

# 5. Environment
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.bashrc
source ~/.bashrc

# 6. EAS + Expo CLI
pnpm add -g eas-cli expo

# 7. Login
eas login

# NOTE: Linux cannot build for iOS locally. Use EAS Build (cloud).
```

### Accounts to Create

| Account | URL | What you need |
|---|---|---|
| Expo | https://expo.dev/signup | Email; free tier covers dev. EAS paid plan ($19/mo) for fast queues. |
| Apple Developer Program | https://developer.apple.com/programs/enroll/ | $99/yr USD; Apple ID; legal entity name. Required for App Store + TestFlight. |
| Google Play Console | https://play.google.com/console/signup | $25 one-time USD; Google account with 2FA; D-U-N-S if organization. |
| Sentry | https://sentry.io/signup/ | Free tier 5k events/mo. Create project = "react-native". |
| GitHub | https://github.com/signup | Free; needed for CI. |

### Bootstrap Commands

```bash
# Create project (uses Expo's official template with TypeScript + expo-router)
pnpm create expo-app@latest my-app -t default
cd my-app

# Replace package manager with pnpm
rm -rf node_modules package-lock.json
pnpm install

# Add the locked stack
pnpm add zustand@5.0.12 \
  drizzle-orm@0.42.0 expo-sqlite@16.0.4 \
  @tanstack/react-query@5.62.0 \
  react-hook-form@7.55.0 zod@3.24.0 \
  nativewind@4.2.0 tailwindcss@3.4.17 \
  expo-secure-store@14.0.2 react-native-mmkv@4.0.5 \
  expo-image@55.0.9 expo-updates@0.30.4 \
  @sentry/react-native@8.8.0 react-native-reanimated@4.3.0 \
  react-native-gesture-handler@3.0.1 @shopify/react-native-skia@2.4.0

pnpm add -D drizzle-kit@0.30.0 jest-expo@55.0.16 jest@30.1.0 \
  @testing-library/react-native@13.2.0 \
  @biomejs/biome@2.4.0 eslint@9.20.0 eslint-plugin-react-hooks@5.2.0 \
  typescript@5.7.3

# Initialize EAS
eas build:configure
eas update:configure

# Run dev server
pnpm expo start
# Press 'i' for iOS simulator, 'a' for Android emulator, scan QR with Expo Go on device.
```

### Expected First-Run Output

```
Starting project at /Users/me/my-app
Starting Metro Bundler
The following packages should be updated for best compatibility with the installed expo version:
  (no warnings — all aligned)

› Metro waiting on exp+my-app://expo-development-client/?url=http%3A%2F%2F192.168.1.10%3A8081
› Web is waiting on http://localhost:8081
› Using Expo Go

› Press s │ switch to development build
› Press a │ open Android
› Press i │ open iOS simulator
› Press w │ open web
› Press j │ open debugger
› Press r │ reload app
› Press m │ toggle menu
› Press o │ open project code in your editor

› Press ? │ show all commands
```

### Common First-Run Errors

| Error | Cause | Fix |
|---|---|---|
| `Unable to resolve module ...` | Stale Metro cache after install | `pnpm expo start -c` |
| `error: Error: spawn xcrun ENOENT` | Xcode CLI tools missing | `xcode-select --install` |
| `[CXX1429] error when building with cmake` | Android NDK mismatch | Open Android Studio → SDK Manager → install NDK 26.1 |
| `EAS project not configured` | Missing project ID | `eas init` |
| `react-native-reanimated/plugin not found` | Babel plugin missing | Already in template; if missing add `'react-native-worklets/plugin'` to `babel.config.js` |
| `Invariant Violation: Tried to register two views with the same name` | Duplicate native module from prebuild | `rm -rf ios android && pnpm expo prebuild --clean` |
| `Hermes engine could not be enabled` | Old project or pre-prebuild | RN 0.84+ default; remove `jsEngine: 'jsc'` from app.config.ts |
| `Could not find Watchman` (macOS) | Not installed | `brew install watchman` |
| `unable to authenticate with Apple` (EAS submit) | Expired session | `eas credentials` and re-enter app-specific password |
| `EXPO_PUBLIC_*` is undefined at runtime | Secret instead of public | Move to `EXPO_PUBLIC_FOO` for client-readable, or read via `expo-constants`. |

---

## 3. Project Layout

```
my-app/
├── app/                              # expo-router file-based routes
│   ├── (tabs)/                       # tab group
│   │   ├── _layout.tsx               # tab navigator
│   │   ├── index.tsx                 # home tab
│   │   └── settings.tsx              # settings tab
│   ├── (auth)/                       # auth group, no chrome
│   │   ├── _layout.tsx
│   │   ├── sign-in.tsx
│   │   └── sign-up.tsx
│   ├── [...not-found].tsx            # 404
│   ├── _layout.tsx                   # root stack + providers
│   └── +html.tsx                     # web only
├── src/
│   ├── components/                   # reusable UI primitives
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── __tests__/
│   ├── features/                     # vertical feature folders
│   │   └── todos/
│   │       ├── api.ts                # network adapter
│   │       ├── store.ts              # zustand slice
│   │       ├── schema.ts             # zod schemas
│   │       └── components/
│   ├── lib/                          # shared utilities
│   │   ├── db/                       # drizzle schema + client
│   │   │   ├── schema.ts
│   │   │   ├── client.ts
│   │   │   └── migrations/           # generated by drizzle-kit
│   │   ├── env.ts                    # typed env access
│   │   ├── logger.ts                 # pino + sentry transport
│   │   ├── api.ts                    # fetch wrapper
│   │   └── storage.ts                # mmkv + secure-store
│   ├── hooks/                        # cross-feature hooks
│   ├── theme/                        # tokens, NativeWind config
│   └── types/                        # global ambient types
├── assets/                           # images, fonts, icons
│   ├── icon.png
│   ├── adaptive-icon.png
│   └── splash.png
├── .maestro/                         # E2E flows
│   ├── auth.yaml
│   └── smoke.yaml
├── .github/workflows/
│   ├── ci.yml
│   └── eas-build-on-tag.yml
├── .vscode/
│   ├── extensions.json
│   ├── launch.json
│   └── settings.json
├── .cursor/rules                     # Cursor config
├── app.config.ts                     # Expo config (dynamic)
├── eas.json                          # EAS Build/Submit profiles
├── babel.config.js
├── metro.config.js
├── tailwind.config.js
├── biome.json
├── .eslintrc.cjs                     # hooks-only, complements Biome
├── tsconfig.json
├── jest.config.js
├── drizzle.config.ts
├── package.json
├── pnpm-lock.yaml
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Component | `PascalCase.tsx` | `Button.tsx` |
| Hook | `useCamelCase.ts` | `useAuth.ts` |
| Util | `camelCase.ts` | `formatDate.ts` |
| Route file | `lowercase-kebab.tsx` | `sign-in.tsx` |
| Route group | `(group-name)/` | `(tabs)/` |
| Dynamic route | `[param].tsx` | `[id].tsx` |
| Test | `*.test.tsx` next to source | `Button.test.tsx` |
| E2E flow | `kebab.yaml` in `.maestro/` | `auth.yaml` |
| Drizzle table | `snake_case` cols, `camelCase` TS | `users` / `userId` |
| Zustand store | `useXxxStore` | `useTodoStore` |

### "Where does it go?"

| Adding... | Goes in... |
|---|---|
| New screen | `app/<route>.tsx` |
| New tab | `app/(tabs)/<name>.tsx` + register in `_layout.tsx` |
| Modal | `app/<name>.tsx` with `<Stack.Screen options={{ presentation: 'modal' }}/>` |
| Reusable button/input | `src/components/<Name>.tsx` |
| Feature business logic | `src/features/<feature>/` |
| Network adapter | `src/features/<feature>/api.ts` |
| Drizzle table | `src/lib/db/schema.ts` |
| Migration | auto via `pnpm db:generate` → `src/lib/db/migrations/` |
| Zustand slice | `src/features/<feature>/store.ts` |
| Zod schema | `src/features/<feature>/schema.ts` (export, share with API) |
| Environment variable | `app.config.ts` `extra` block + `src/lib/env.ts` |
| Native config (Info.plist, AndroidManifest) | `app.config.ts` `ios.infoPlist` / `android.permissions` |
| New native dependency | `pnpm add` + add config plugin to `app.config.ts` `plugins` |
| Asset | `assets/` (icons, fonts, splash) |
| E2E flow | `.maestro/<flow>.yaml` |
| CI step | `.github/workflows/ci.yml` |

---

## 4. Architecture

### Process Boundaries

```
┌──────────────────────────────────────────────────────────┐
│                  Native Host (iOS/Android)                │
│                                                            │
│  ┌──────────────┐         ┌──────────────────────────┐    │
│  │ Native UI    │◄───────►│  Hermes V1 (JS thread)   │    │
│  │ (UIKit/      │  Bridge │  - React tree            │    │
│  │  Compose)    │  (JSI)  │  - expo-router           │    │
│  │              │         │  - Zustand stores        │    │
│  └──────────────┘         │  - React Query cache     │    │
│         ▲                 └──────────┬───────────────┘    │
│         │                            │                     │
│  ┌──────┴──────────────────┐         ▼                     │
│  │ Reanimated UI thread    │   ┌───────────────┐          │
│  │ (worklets, 60fps)       │   │ expo-sqlite   │          │
│  └─────────────────────────┘   │ (Drizzle ORM) │          │
│                                 └───────────────┘          │
└──────────────────────────────────────────────────────────┘
            ▲                              ▲
            │ HTTPS                        │ EAS Update
            ▼                              ▼
   ┌─────────────────┐            ┌──────────────────┐
   │ Backend API     │            │ Expo CDN (OTA)   │
   └─────────────────┘            └──────────────────┘
```

### Data Flow (typical user action)

```
User taps button
  → onPress handler (JS thread)
  → Zustand action OR React Query mutation
  → API adapter src/lib/api.ts (HTTPS)
  → Server returns JSON
  → React Query cache updates
  → Component re-renders
  → Optimistic update committed (or rolled back)
  → Drizzle write (offline-first persistence)
  → useLiveQuery subscribers re-render
```

### Auth Flow

```
1. App start → app/_layout.tsx checks expo-secure-store for session token
2. If absent → redirect to (auth)/sign-in
3. User submits credentials → /api/auth → returns { token, refresh }
4. Store token in expo-secure-store (Keychain/Keystore)
5. Set state in useAuthStore (in-memory)
6. Redirect to (tabs)
7. Every API call attaches Authorization header from secure-store
8. On 401 → refresh once → if still 401, sign out, clear secure-store
```

### State Management

```
┌──────────────────────────────────────────────┐
│ State                                         │
├──────────────────────────────────────────────┤
│ Server data       → @tanstack/react-query    │
│ UI/ephemeral      → React useState           │
│ Cross-screen UI   → Zustand stores            │
│ Persisted KV      → react-native-mmkv         │
│ Secrets/tokens    → expo-secure-store         │
│ Relational data   → Drizzle + expo-sqlite     │
│ Animation values  → Reanimated useSharedValue │
└──────────────────────────────────────────────┘
```

### Entry Points

| File | Responsibility |
|---|---|
| `app/_layout.tsx` | Mount providers (QueryClient, GestureHandlerRootView, Sentry, Theme), guard auth, configure splash. |
| `app.config.ts` | Build-time config: bundle IDs, plugins, env injection, runtime version. |
| `eas.json` | EAS profile config: dev/preview/production builds + submit. |
| `metro.config.js` | Bundler: NativeWind transformer, Sentry sourcemaps, .sql files for Drizzle. |
| `babel.config.js` | Babel: nativewind preset, reanimated/worklets plugin (must be LAST). |
| `src/lib/db/client.ts` | Open SQLite, run migrations, export `db`. |
| `src/lib/api.ts` | fetch wrapper with auth, retry, Sentry breadcrumb. |
| `src/lib/logger.ts` | pino root logger with Sentry transport. |

### Where business logic lives

- **Lives in:** `src/features/<feature>/` (api.ts, store.ts, schema.ts, components/).
- **Does NOT live in:** `app/**` route files. Routes are thin — call hooks, render components, no business logic.
- **Does NOT live in:** `src/components/`. Those are dumb UI primitives.

---

## 5. Dev Workflow

### Start dev server

```bash
pnpm expo start                # Metro + dev menu, default port 8081
pnpm expo start -c             # clear Metro cache (use after upgrades)
pnpm expo start --tunnel       # ngrok-style tunnel for testing on devices off-LAN
pnpm expo start --dev-client   # if you have a custom dev client (after prebuild)
```

Watchers running:
- Metro bundler watches `app/`, `src/`, `assets/` and rebuilds on save.
- TypeScript LSP runs in your editor (VS Code/Cursor).
- Reanimated worklets are compiled by Babel on every save.

### Hot Reload

- **Fast Refresh** is on by default. Save `.tsx` → screen updates without losing state.
- **Breaks when:** you edit `app.config.ts`, `babel.config.js`, `metro.config.js`, native config plugins, or add a new native module. Fix: stop server, `pnpm expo start -c`.
- **Force full reload:** press `r` in the Metro terminal, or shake device → "Reload."

### Debuggers

| Editor | How |
|---|---|
| VS Code / Cursor | Install "React Native Tools" extension. Use `.vscode/launch.json` (provided). Set breakpoints in `.tsx`. |
| Chrome DevTools | Press `j` in Metro terminal → opens React Native DevTools (replaces Hermes debugger). |
| Xcode (native iOS bug) | `pnpm expo run:ios` → open `ios/MyApp.xcworkspace` → run. Set breakpoints in Swift/ObjC. |
| Android Studio (native bug) | `pnpm expo run:android` → open `android/` → run. Set breakpoints in Kotlin/Java. |

### Inspect runtime

- **Network:** Press `j` → React Native DevTools → Network tab. Or use Reactotron.
- **Storage (MMKV):** `useMMKVDevTools()` hook in dev only.
- **State (Zustand):** `mountedStoreDevtool` middleware → React Native DevTools "Stores" panel.
- **DB (Drizzle):** Run `pnpm drizzle-kit studio` → opens Drizzle Studio in browser at `https://local.drizzle.studio`.
- **Logs:** Metro terminal shows all `console.log` + structured pino lines.

### Pre-commit checks

`.husky/pre-commit` runs:

```bash
pnpm typecheck
pnpm lint
pnpm test --changedSince=origin/main
```

### Branch + commit conventions

- Branch: `feat/short-name`, `fix/short-name`, `chore/short-name`.
- Commit: Conventional Commits — `feat(todos): add swipe-to-delete`, `fix(auth): refresh token on 401`.
- One PR per feature. Squash-merge to `main`.

---

## 6. Testing & Parallelization

### Unit tests

```bash
pnpm test                          # all tests
pnpm test -- --watch               # watch mode
pnpm test src/features/todos       # single folder
pnpm test Button.test.tsx          # single file
pnpm test -t "renders disabled"    # single test by name
```

Tests live next to source: `Button.tsx` ↔ `Button.test.tsx` (or in `__tests__/` folder).

### Integration tests

Integration tests use jest-expo + Drizzle in-memory SQLite. Same command:

```bash
pnpm test src/features/**/integration.test.ts
```

### E2E (Maestro)

```bash
maestro test .maestro/                       # all flows in parallel (one shard per device)
maestro test .maestro/auth.yaml              # single flow
maestro test --shards 4 .maestro/            # 4 parallel shards on cloud
maestro studio                               # interactive recorder
```

`.maestro/smoke.yaml`:

```yaml
appId: com.example.myapp
---
- launchApp
- assertVisible: "Sign in"
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Password"
- inputText: "supersecret"
- tapOn: "Sign in"
- assertVisible: "Welcome back"
```

### Mocking rules

| Layer | Strategy |
|---|---|
| Network | MSW 2 in `src/test/handlers.ts`. Mock at HTTP boundary. Never mock `fetch` directly in tests. |
| SQLite | Use real `expo-sqlite` with `:memory:` DB. Never mock Drizzle. |
| Native modules | jest-expo preset auto-mocks (`expo-secure-store`, `expo-image`, etc.). |
| Date/Time | `jest.useFakeTimers()` per test. |
| Random | Inject seed via `Math.random` mock or use `seedrandom`. |
| Sentry | Mocked via `jest-expo`. Verify with `Sentry.captureException` spy. |

### Coverage

- Target: **80% lines, 70% branches** on `src/features/**` and `src/lib/**`.
- Routes (`app/**`) excluded — they are thin shells, covered by E2E.
- Measured by Jest's built-in coverage: `pnpm test --coverage`. Output: `coverage/lcov-report/index.html`.

### Visual regression

Use **Storybook 8 + Chromatic** for component snapshots (web target only). Native visual diff via Maestro screenshot diffing in CI.

### Parallelization for AI agents

| Safe to parallelize | Unsafe (must be sequential) |
|---|---|
| Scaffold component + scaffold tests + scaffold story | Anything touching `package.json` |
| Edit two unrelated routes | Anything touching `app.config.ts` |
| Add two unrelated Drizzle tables (different files in `schema.ts`? still serialize) | Anything touching `pnpm-lock.yaml` |
| Two unrelated Zustand slices | Adding native modules / config plugins |
| Two E2E flows in `.maestro/` | Anything touching `babel.config.js` |
| Documentation edits | Drizzle migrations |

When fanning out subagents, assign each to a unique feature folder. Merge sequentially; rerun `pnpm typecheck` + `pnpm test` after each merge.

---

## 7. Logging

### Logger setup

`src/lib/logger.ts`:

```ts
import pino from 'pino';
import * as Sentry from '@sentry/react-native';

const logger = pino({
  level: __DEV__ ? 'debug' : 'info',
  base: { app: 'my-app', env: __DEV__ ? 'dev' : 'prod' },
  hooks: {
    logMethod(args, method, level) {
      if (level >= 50) {
        // error/fatal → Sentry
        const [obj, msg] = args.length === 2 ? args : [{}, args[0]];
        Sentry.captureMessage(typeof msg === 'string' ? msg : JSON.stringify(obj), 'error');
      }
      method.apply(this, args);
    },
  },
});

export default logger;
```

Use:

```ts
import logger from '@/lib/logger';

logger.info({ event: 'app_boot', user_id: userId }, 'app started');
logger.error({ event: 'api_failure', err, route: '/todos' }, 'fetch failed');
```

### Levels

| Level | When |
|---|---|
| `debug` | Dev-only spam: render counts, store updates. |
| `info` | App boot, screen view, user action complete. |
| `warn` | Recoverable issue: 401 retry, slow operation, deprecated path. |
| `error` | Caught exception, failed API call after retries. Goes to Sentry. |
| `fatal` | App-killing error. Goes to Sentry + crash report. |

### Required fields

Every log line MUST include:
- `event` — snake_case action verb (e.g. `auth_signin_succeeded`).
- `user_id` — if authenticated, else `null`.
- `request_id` — for any API call (uuid v4 generated client-side).
- `module` — feature/file (e.g. `todos.api`).

### Sample lines

```json
{"level":30,"time":1714217600000,"app":"my-app","env":"prod","event":"app_boot","cold":true,"version":"1.2.3","user_id":null,"msg":"app started"}
{"level":30,"event":"api_request","method":"POST","route":"/todos","request_id":"a1b2","user_id":"u_42","msg":"out"}
{"level":30,"event":"api_response","status":201,"ms":143,"request_id":"a1b2","user_id":"u_42","msg":"in"}
{"level":50,"event":"todo_create_failed","err":"timeout","ms":5000,"request_id":"a1b2","user_id":"u_42","msg":"create failed"}
{"level":40,"event":"slow_query","query":"select * from todos","ms":312,"user_id":"u_42","module":"todos.db","msg":"slow"}
{"level":30,"event":"user_signed_in","user_id":"u_42","method":"email","msg":"sign-in ok"}
```

### Where logs go

- **Dev:** stdout in Metro terminal.
- **Prod:** Sentry (errors + warns auto-forwarded). Info-level not shipped (cost). For info-level analytics use PostHog or Amplitude separately.

### Grep locally

```bash
# Tail Metro logs and grep
pnpm expo start 2>&1 | tee /tmp/metro.log
grep '"event":"api_' /tmp/metro.log | jq .
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `pnpm typecheck` and `pnpm lint` before declaring a task done.
2. Always use `npx expo install <pkg>` for Expo-managed deps so versions match SDK 55. Use `pnpm add` only for non-native libs.
3. Always read state via Zustand selectors (`useStore(s => s.x)`), not whole-store destructuring — prevents wasted re-renders.
4. Always wrap routes in `app/` with the providers in `app/_layout.tsx` — never duplicate `<QueryClientProvider>` in a route.
5. Always type Drizzle queries via `InferSelectModel`/`InferInsertModel` — never hand-write the row type.
6. Always store auth tokens in `expo-secure-store`, never in `AsyncStorage` or MMKV.
7. Always use `expo-image` instead of `<Image>` from `react-native` — caching and blurhash come for free.
8. Always run E2E with `maestro test .maestro/` after touching `app/_layout.tsx` or auth routes.
9. Always update `app.config.ts` (never raw `ios/Info.plist` or `AndroidManifest.xml`) for native config.
10. Always use `useLiveQuery` for screens that show DB data — automatic re-render on writes.
11. Always wrap screens that animate with `<GestureHandlerRootView style={{ flex: 1 }}>` (it's in `_layout.tsx` — keep it).
12. Always set `runtimeVersion: { policy: 'fingerprint' }` in `app.config.ts` — ensures OTA only ships to compatible builds.
13. Always run `pnpm expo start -c` after upgrading Expo or any native dep.
14. Always `eas update --branch <env>` to ship a JS-only fix; never bump native version unnecessarily.
15. Always use `EXPO_PUBLIC_*` for env vars consumed in client code; everything else is build-time only via EAS Secrets.
16. Always use the `src/lib/api.ts` adapter for network calls; never call `fetch` directly in features.
17. Always validate inputs with zod at the boundary (form submit, API response) — types alone are not enforcement.
18. Always prefer config plugins over `expo prebuild` edits; if you must prebuild, regenerate (`expo prebuild --clean`) — do not hand-edit native dirs.
19. Always run `pnpm db:generate` after editing `src/lib/db/schema.ts`, then commit the generated migrations.
20. Always test on both iOS and Android before declaring a UI task done — dimensions, fonts, gestures differ.
21. Always pin `expo`, `react-native`, `react`, and routing libs to exact versions; let `npx expo install` pick patch updates.
22. Always wrap the root in `Sentry.wrap(...)` (already in `app/_layout.tsx`) — preserves it across refactors.

### 8.2 NEVER

1. Never install `redux`, `recoil`, `mobx`, or `jotai` — Zustand is the chosen state lib.
2. Never install `@react-native-async-storage/async-storage` for new code — use `react-native-mmkv` for KV, `expo-secure-store` for secrets.
3. Never call `require('react-native').Image` for remote URLs — use `expo-image`.
4. Never edit files inside `ios/` or `android/` directly. They are generated by `expo prebuild`. Use config plugins.
5. Never set `jsEngine: 'jsc'` — Hermes V1 is required by RN 0.85.
6. Never disable the New Architecture (`newArchEnabled: false`) — Reanimated 4 + SDK 55 require it.
7. Never commit `.env`, `.env.local`, `eas-credentials/`, `*.p8`, `*.keystore`, or service account JSON.
8. Never use `npm` or `yarn` in this repo — pnpm only. The lockfile is the source of truth.
9. Never use `console.log` for anything that ships to prod — go through `src/lib/logger.ts`.
10. Never read process.env in components — use `src/lib/env.ts` typed accessor.
11. Never import server-only code (Node fs, secrets) into a route. expo-router supports API routes; keep server code under `app/api/` only.
12. Never bump `react-native` or `expo` versions outside an explicit upgrade PR — let `npx expo install --check` propose them.
13. Never hardcode bundle identifiers in two places — only `app.config.ts` `ios.bundleIdentifier` / `android.package`.
14. Never write a Drizzle migration by hand — `pnpm db:generate` after schema edits.
15. Never reach into Expo Go for native modules not bundled in it (e.g. MMKV, Skia). Use a development build (`eas build --profile development`).
16. Never call animation worklets from the JS thread without `runOnUI` / `runOnJS` — silent crash on Reanimated 4.
17. Never bypass `expo-router`'s typed routes by `router.push('/some/string')` — use the generated typed `Href`.
18. Never store session tokens in Zustand alone (memory-only) — they vanish on cold start. Pair with `expo-secure-store`.
19. Never let Metro pick up `*.test.tsx` in a release build — `metro.config.js` excludes them; do not change.
20. Never push to `main` without CI green: typecheck, lint, unit, Maestro smoke.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `package.json` | Every command | `pnpm install && pnpm typecheck && pnpm test && pnpm expo start -c` |
| `pnpm-lock.yaml` | Reproducible builds | Reinstall on CI; full test run |
| `app.config.ts` | Native build + OTA + bundle id | `pnpm expo prebuild --clean` (in scratch dir), `eas build --profile preview` |
| `eas.json` | Cloud builds + submit | `eas build --profile preview --non-interactive` |
| `babel.config.js` | Every file compiled | `pnpm expo start -c`, then full app smoke |
| `metro.config.js` | Bundling | `pnpm expo start -c`, full app smoke |
| `tailwind.config.js` | All NativeWind classes | Visually inspect 3+ screens; rebuild |
| `tsconfig.json` | All type checks | `pnpm typecheck` |
| `src/lib/db/schema.ts` | Runtime + types | `pnpm db:generate`, `pnpm typecheck`, integration tests |
| `src/lib/db/migrations/**` | Production DB on next install | Diff carefully; test against fresh + upgraded device |
| `app/_layout.tsx` | Every route | Full E2E + cold-start smoke on iOS+Android |
| `src/lib/api.ts` | All network calls | Run all integration tests |
| `src/lib/logger.ts` | Observability | Trigger an error; verify Sentry receives it |
| `app.json` (legacy — should be deleted) | None if `app.config.ts` exists | Confirm `app.config.ts` is the source; delete `app.json` |
| `assets/icon.png` | App icon on stores | EAS Build → install → home screen verify |
| `assets/splash.png` | Launch screen | EAS Build dev → cold launch on device |
| `.github/workflows/ci.yml` | All PRs | Open a no-op PR; CI green |
| `node_modules` (corruption) | Everything | `rm -rf node_modules && pnpm install` |
| `expo-router` route added/deleted | Deep links + nav | Maestro smoke flow + cold link test |
| Any new native module | Cannot run in Expo Go | `eas build --profile development` then load |
| `app.config.ts` `runtimeVersion` | OTA compatibility | Cut a new native build; old OTA channels remain compatible |
| `app.config.ts` `version` / `buildNumber` | Store submission | Bump per release; `eas submit` rejects duplicates |
| `expo-updates` URL/channel | Whether OTA reaches users | `eas update --branch production --message "test"` then verify on device |
| Any change touching `src/lib/storage.ts` | Persisted user data | Migration test: simulate older data, verify reads still work |

### 8.4 Definition of Done

**Bug fix:**
- [ ] Repro test added (unit OR Maestro flow).
- [ ] Test fails before fix, passes after.
- [ ] `pnpm typecheck` green.
- [ ] `pnpm lint` green.
- [ ] Manual verify on iOS sim + Android emulator.
- [ ] PR description names the symptom + root cause.

**New feature:**
- [ ] Files in correct dirs per Section 3.
- [ ] Zod schema for any user input.
- [ ] At least one unit test, at least one component test, at least one Maestro flow.
- [ ] Sentry breadcrumb on key actions.
- [ ] iOS + Android visual check.
- [ ] No `console.log` left behind.
- [ ] No new native dep without config plugin.

**Refactor:**
- [ ] No behavior change. Tests pass before AND after with no diff in expectations.
- [ ] Coverage delta ≥ 0.
- [ ] Bundle size delta noted (`pnpm expo export` size before/after).

**Dependency bump:**
- [ ] `npx expo install --check` clean.
- [ ] Test suite green.
- [ ] Cold start time on iOS sim within budget.
- [ ] Run `eas build --profile preview` to confirm native compile.

**Schema change:**
- [ ] `pnpm db:generate` run; migration committed.
- [ ] Migration tested on a fresh install AND on data from previous version.
- [ ] Backwards-compat plan for users on old client (additive columns OK; renames/drops require new app version).
- [ ] No raw SQL in features — Drizzle only.

**Copy change:**
- [ ] Lint + typecheck.
- [ ] Screenshot before/after attached to PR.
- [ ] If localized, all locale files updated.

### 8.5 Self-Verification Recipe

```bash
pnpm install --frozen-lockfile
pnpm typecheck
pnpm lint
pnpm test --ci
maestro test .maestro/smoke.yaml
pnpm expo export --platform all
```

Expected output (each step):

| Step | Green looks like |
|---|---|
| `pnpm install` | `Done in 8s` (no peer warnings) |
| `pnpm typecheck` | (no output, exit 0) |
| `pnpm lint` | `Checked X files in Yms. No fixes applied.` |
| `pnpm test --ci` | `Tests:       N passed, N total` |
| `maestro test .maestro/smoke.yaml` | `[Passed] - smoke.yaml` |
| `pnpm expo export` | `Exported web bundle in X ms.` and `iOS Bundle: X kB` |

### 8.6 Parallelization Patterns

**Safe fan-out:**
- Three subagents, each scaffolds a different feature folder under `src/features/`.
- Subagents writing distinct Maestro flows in `.maestro/`.
- Subagent writing tests for an existing component while another adds prop types.

**Unsafe (must serialize):**
- Two subagents touching `package.json` — lockfile race.
- Two subagents adding migrations — file ordering conflict.
- Two subagents editing `app/_layout.tsx` providers.
- Two subagents adding native modules (each adds plugin entry to `app.config.ts`).

After parallel work merges, run the full Self-Verification Recipe before claiming done.

---

## 9. Stack-Specific Pitfalls

1. **Stale Metro cache after upgrade.** Symptom: red screen "Unable to resolve module." Cause: Metro caches resolved paths. Fix: `pnpm expo start -c`. Detect early: dev server prints `Watchman: Recrawl warning` after upgrades.

2. **Native module in Expo Go.** Symptom: `Cannot find native module 'MMKV'` at startup. Cause: Expo Go doesn't bundle arbitrary native modules. Fix: `eas build --profile development` and install the dev client. Detect: red screen on app start in Expo Go.

3. **Reanimated worklet crash.** Symptom: silent JS thread death; UI thread runs but actions don't fire. Cause: calling JS from worklet without `runOnJS`. Fix: wrap with `runOnJS(setState)(value)`. Detect: add `'worklet';` directive and Babel plugin (last) — error becomes loud.

4. **Reanimated plugin missing or wrong order.** Symptom: `Reanimated 4 detected` warning + animations don't run. Cause: `react-native-worklets/plugin` not last in `babel.config.js`. Fix: list it last; restart Metro with `-c`.

5. **Hermes/JSC mismatch after eject.** Symptom: app crashes on launch with `Hermes engine could not be enabled`. Cause: prebuild generated wrong Podfile or `Gradle.properties`. Fix: `pnpm expo prebuild --clean`.

6. **`runtimeVersion` mismatch breaks OTA.** Symptom: `eas update` shipped but no device receives it. Cause: native build's `runtimeVersion` differs from update's. Fix: use `runtimeVersion: { policy: 'fingerprint' }` so any native change forces a new version automatically.

7. **EAS env vs `.env.local` drift.** Symptom: works locally, breaks in production builds. Cause: secrets only in `.env.local` are not available to EAS Build. Fix: `eas env:create` for each secret, set `visibility: secret` for sensitive, `plaintext` for `EXPO_PUBLIC_*`.

8. **Apple bundle ID typo.** Symptom: `eas submit` fails with "App not found." Cause: `app.config.ts` `ios.bundleIdentifier` doesn't match App Store Connect. Fix: edit `app.config.ts`, run `eas build --profile production --platform ios` again.

9. **Android `versionCode` not bumped.** Symptom: Play Console rejects upload. Cause: same `versionCode` as previous release. Fix: bump in `app.config.ts` OR rely on EAS auto-increment via `"autoIncrement": true` in `eas.json`.

10. **Metro can't bundle `.sql` files (Drizzle).** Symptom: `Unable to resolve module './migrations/0000_xxx.sql'`. Cause: Metro doesn't know `.sql`. Fix: add `'sql'` to `resolver.assetExts` in `metro.config.js`.

11. **iOS build fails on first EAS run with "Provisioning Profile."** Symptom: cryptic Xcode error mid-build. Cause: no credentials yet. Fix: `eas credentials` → "Set up new credentials" → let EAS auto-generate. Or run `eas build --profile production --platform ios` interactively first time.

12. **Splash screen flashes wrong color.** Symptom: white flash, then your splash, then app. Cause: native splash isn't preloaded. Fix: `expo-splash-screen` `preventAutoHideAsync()` in `app/_layout.tsx`, then `hideAsync()` after fonts/data ready.

13. **Tailwind classes don't apply.** Symptom: NativeWind classes render as no-ops. Cause: missing `nativewind/babel` preset OR `tailwind.config.js` `content` glob excludes your file. Fix: ensure `content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}']` and Babel preset is set.

14. **Push notifications work in dev, not in TestFlight.** Symptom: tokens received but no notifications delivered. Cause: APS environment mismatch (development vs production). Fix: in EAS production builds, the entitlement is `production` automatically; verify FCM `google-services.json` is for the right Firebase project.

15. **`useLiveQuery` re-renders too often.** Symptom: scroll-jank on lists. Cause: query returns whole table on every write anywhere. Fix: scope the query (`.where(eq(todos.userId, uid))`) and memoize callers; or use React Query for non-DB-driven reads.

16. **Sentry sourcemaps missing in prod.** Symptom: stack traces show minified bundle. Cause: sourcemap upload step missing or `SENTRY_AUTH_TOKEN` not set in EAS. Fix: add `withSentry` plugin + set `SENTRY_AUTH_TOKEN` as EAS Secret.

17. **Cold start exceeds budget after adding Skia.** Symptom: 4–6s to first frame on Android. Cause: Skia lazy-load not used. Fix: dynamic import inside the screen that uses it; keep root bundle lean.

18. **OAuth redirect blanks the app.** Symptom: returning from Safari/Chrome custom tab leaves a black screen. Cause: deep link scheme not registered. Fix: set `scheme: 'myapp'` in `app.config.ts`, restart, rebuild.

19. **Maestro flow flaky on slow CI.** Symptom: passes locally, fails on GH Actions. Cause: implicit waits too short. Fix: `--shards 1` and add `extendedWaitUntil:` in `.maestro/*.yaml` for animated transitions.

20. **EAS Update silently disabled.** Symptom: updates publish but devices don't fetch. Cause: `expo-updates` plugin missing OR `enabled: false` in `app.config.ts`. Fix: `plugins: ['expo-updates']` and `updates: { enabled: true, url: 'https://u.expo.dev/<projectId>' }`.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (TTI) iOS | ≤ 1.8s on iPhone 13 | `pnpm perf:cold` (Maestro + sysctl); Xcode Instruments App Launch template |
| Cold start (TTI) Android | ≤ 2.5s on Pixel 6 | `adb shell am start -W com.example.myapp/.MainActivity` |
| JS bundle (Hermes bytecode) | ≤ 6 MB | `pnpm expo export --platform ios && du -sh dist/` |
| First screen render | ≤ 800 ms after splash hide | React Native DevTools Performance tab |
| Memory steady-state | ≤ 250 MB on iPhone 13 | Xcode Memory Graph |
| Frame rate (animations) | 60 fps min, 0 dropped > 16ms | Reanimated DevTools / Perf Monitor |
| Battery (foreground 1h) | ≤ 5% on iPhone 13 | Xcode Energy Impact gauge |
| API call P95 | ≤ 400 ms | Sentry Performance > Transactions |

When a budget is exceeded:
- Bundle: `pnpm expo export` then `npx source-map-explorer dist/_expo/static/js/ios/*.hbc.map` — find big offenders.
- Cold start: profile in Xcode Instruments App Launch; lazy-load heavy screens via expo-router's automatic code-split.
- Memory: image cache (`expo-image` `recyclingKey` and `cachePolicy='memory-disk'`).
- FPS: ensure animations run on UI thread (`useSharedValue` + `useAnimatedStyle`); never animate from React state.

---

## 11. Security

- **Secret storage:** `expo-secure-store` (Keychain/Keystore). Never AsyncStorage, never MMKV (unencrypted by default).
- **Env vars:** `EXPO_PUBLIC_*` is shipped to client (treat as public). All other env stays in EAS Secrets, only injected at build time. `.env.local` never committed.
- **Auth threat model:** Tokens never leave secure-store except in `Authorization` headers. Refresh token only used in API client. On 401 → refresh once → on second 401 → sign out + clear secure-store.
- **Input validation boundary:** Zod on every form `onSubmit` AND every API response (`schema.parse(json)`).
- **Output escaping:** React Native escapes `<Text>` content automatically. NEVER use `dangerouslySetInnerHTML` (it doesn't exist in RN, but `WebView` can: pass content through DOMPurify if rendering HTML).
- **Permissions:**
  - iOS: declared in `app.config.ts` `ios.infoPlist` → e.g. `NSCameraUsageDescription`. Each must have a user-facing reason string.
  - Android: declared in `app.config.ts` `android.permissions` → minimal set; remove `WRITE_EXTERNAL_STORAGE` for API 30+.
- **Dependency audit:** `pnpm audit --prod --audit-level=high` — run weekly + on every dep bump. CI fails on high.
- **Top 5 risks:**
  1. Storing tokens in AsyncStorage / MMKV unencrypted.
  2. Logging PII (emails, tokens) — pino redact list mandatory.
  3. WebView with arbitrary URL — limit to known hosts; disable JS where possible.
  4. Deep link without auth check — `app/_layout.tsx` must guard auth-required routes.
  5. Outdated `expo-updates` runtime version → security patch can't reach device — keep `runtimeVersion: fingerprint`.

---

## 12. Deploy

### Release Flow

```bash
# 1. Bump version
# Edit app.config.ts: version + (ios.buildNumber, android.versionCode auto-increment via EAS)

# 2. Tag
git tag v1.2.3 && git push --tags

# 3. Build (cloud, signed, both stores)
eas build --profile production --platform all --auto-submit

# 4. EAS will:
#    - Build iOS (.ipa) + Android (.aab)
#    - Sign with stored credentials
#    - Submit to App Store Connect (TestFlight) + Play Console (Internal testing track)

# 5. After QA on TestFlight + Internal track:
#    - App Store Connect: promote to production review (manual click)
#    - Play Console: promote Internal → Production (manual click)

# 6. After release, ship a JS-only fix as OTA:
eas update --branch production --message "fix: typo in CTA"
```

### Staging vs prod

`eas.json` has three profiles: `development`, `preview` (staging), `production`. Each maps to a distinct EAS Update channel. Staging builds use `https://api.staging.example.com`; production uses `https://api.example.com` — wired via `EXPO_PUBLIC_API_URL`.

### Rollback

```bash
# Roll back OTA: republish a previous update
eas update --branch production --message "rollback to commit abc123" --git-commit abc123

# Or pin a specific update group active for the channel:
eas update --branch production --rollout 0   # disable rollout
```

Max safe rollback window: 7 days (after that, native version may have moved on; users on new native won't accept old JS due to `runtimeVersion` fingerprint).

### Health check

- Backend: `curl https://api.example.com/health` → `{ "ok": true, "version": "..." }`.
- Mobile app: launch on real device, verify Sentry "session starts" graph rises after submission.

### Versioning

- `app.config.ts` `version` is single source of truth (e.g. `1.2.3`).
- `ios.buildNumber` auto-incremented per build by EAS (`"autoIncrement": "buildNumber"` in `eas.json`).
- `android.versionCode` auto-incremented (`"autoIncrement": "versionCode"`).
- Git tag matches `version`: `v1.2.3`.

### Submission walkthrough

**iOS (App Store):**
1. EAS Submit pushes `.ipa` to App Store Connect → it appears in TestFlight in ~10 min after processing.
2. Add testers in App Store Connect → TestFlight → Internal Group.
3. After QA, App Store Connect → "App Store" tab → "+ Version" → fill metadata → "Submit for Review."
4. Apple review typically 24–48h.

**Android (Google Play):**
1. EAS Submit pushes `.aab` to Play Console → "Internal testing" track.
2. Add testers via opt-in URL.
3. After QA: Play Console → "Production" → "Create new release" → upload from library → roll out.
4. Google review 1–7 days for new apps; ~hours for updates.

### DNS

If the app uses universal links (`https://example.com/...` opens app), publish `apple-app-site-association` at `https://example.com/.well-known/apple-app-site-association` and `assetlinks.json` at `https://example.com/.well-known/assetlinks.json`. EAS docs has templates.

### Cost per 1k MAU (rough)

- EAS Build: $0 on free tier (limited queue) or $19/mo Production plan.
- EAS Update: $0 up to 1k MAU on free tier; $99/mo for 100k MAU on Production.
- Sentry: Free 5k events/mo; $26/mo Team for 50k.
- Backend not included.
- Apple: $99/yr.
- Google: $25 one-time.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# CLAUDE.md

This project follows the React Native + Expo Rulebook at `rulebooks/react-native-expo.md` (or as referenced in your team docs). Read it before any task.

## Commands

- Install: `pnpm install`
- Dev: `pnpm expo start` (`-c` to clear cache)
- Type check: `pnpm typecheck`
- Lint: `pnpm lint`
- Test (unit): `pnpm test`
- Test (E2E): `maestro test .maestro/`
- Build (preview): `eas build --profile preview --platform all`
- Build (prod): `eas build --profile production --platform all --auto-submit`
- OTA: `eas update --branch production --message "<msg>"`
- DB generate: `pnpm db:generate`
- DB migrate: handled in app via `useMigrations`

## Banned Patterns

- `import AsyncStorage from '@react-native-async-storage/async-storage'` — use `react-native-mmkv` or `expo-secure-store`.
- `import { Image } from 'react-native'` — use `expo-image`.
- `import redux`, `import recoil`, `import jotai`, `import mobx` — use Zustand.
- `console.log(` outside `__DEV__` guards — use `src/lib/logger.ts`.
- Editing `ios/` or `android/` directly — use config plugins in `app.config.ts`.
- `process.env.X` directly in components — go through `src/lib/env.ts`.
- `fetch(` inside features — go through `src/lib/api.ts`.
- `db push` (drizzle-kit) — always `db:generate` + commit migrations.

## Workflow

1. Read the rulebook section relevant to the task.
2. Run the Self-Verification Recipe (Section 8.5) before declaring done.
3. After UI changes, run on iOS sim AND Android emulator before claiming done.
4. After schema change, write a migration test against fresh + upgraded DB.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(npx expo:*)",
      "Bash(eas:*)",
      "Bash(maestro:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push)",
      "Bash(git pull)",
      "Bash(git branch:*)",
      "Bash(git checkout:*)",
      "Bash(node:*)",
      "Bash(adb:*)",
      "Bash(xcrun simctl:*)",
      "Bash(curl:*)",
      "Bash(jq:*)",
      "Bash(grep:*)",
      "Bash(find:*)",
      "Bash(ls:*)",
      "Bash(cat:*)",
      "Bash(rg:*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(git push --force:*)",
      "Bash(npm:*)",
      "Bash(yarn:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm exec biome format --write --no-errors-on-unmatched ${CLAUDE_FILE_PATHS}" }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          { "type": "command", "command": "echo 'remember: Hermes is required, do not edit ios/ or android/'" }
        ]
      }
    ],
    "Stop": [
      { "type": "command", "command": "pnpm typecheck && pnpm lint && pnpm test --bail --silent" }
    ]
  }
}
```

### Recommended skills

- `/test-driven-development` — start every feature with a failing test.
- `/systematic-debugging` — for native crashes, build failures, or unexpected behavior.
- `/verification-before-completion` — run Section 8.5 recipe before declaring done.
- `/ship` — for releases.
- `/qa` — for UI sweeps after sizable changes.
- `/codex` — second opinion on schema or auth changes.

### Slash command shortcuts

Add `.claude/commands/`:

- `expo-clean.md`: `Run pnpm expo start -c, kill running Metro on 8081, restart fresh.`
- `eas-preview.md`: `Run eas build --profile preview --platform all and post the resulting QR.`
- `db-add-table.md`: `Add a new table to src/lib/db/schema.ts with given name + columns; run pnpm db:generate; commit migration.`
- `route-add.md`: `Add a new expo-router screen at the given path with default layout, scaffold tests + Maestro flow.`

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# AGENTS.md — Codex / OpenAI agent rules

Treat `rulebooks/react-native-expo.md` as the source of truth. Specific Codex notes:

## Run modes

- Default: `--sandbox workspace-write` is fine for everything except `eas:*` and `git push` (those need `danger-full-access`).
- For builds: `eas build` runs in the cloud; the local sandbox just submits the request.

## Always

- Use pnpm. Never npm or yarn.
- Run `pnpm typecheck && pnpm lint && pnpm test` before declaring done.
- Read `app.config.ts` before suggesting any native config change.

## Never

- Edit `ios/` or `android/` (they are generated).
- Install Redux/MobX/Recoil/Jotai (Zustand is the chosen state lib).
- Bypass `src/lib/api.ts` with raw fetch.
- Commit `.env*` files.

## Differences from Claude Code

- Codex's plan mode tends to suggest installing things first; instead, check `package.json` and ask. Many libs are already installed.
- Codex's diff context can miss the `app/_layout.tsx` provider tree — when adding a context, ALWAYS open and edit `_layout.tsx` explicitly.
- For long-running tasks (EAS Build), Codex should `eas build --profile preview --non-interactive --no-wait` and report the build URL, not block.
```

### `.codex/config.toml`

```toml
[default]
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_mode = "auto-edit"

[profiles.deploy]
sandbox = "danger-full-access"
approval_mode = "manual"

[shell]
allow = [
  "pnpm",
  "npx expo",
  "eas",
  "maestro",
  "git",
  "node",
  "adb",
  "xcrun",
  "curl",
  "jq"
]
deny = ["npm", "yarn", "rm -rf /"]
```

### Where Codex differs

- Codex auto-applies edits faster; turn off `approval_mode = "auto-edit"` when touching `app.config.ts`, `eas.json`, `app/_layout.tsx`, or migrations.
- Codex doesn't auto-pick up Cursor rules; mirror critical Always/Never rules into `AGENTS.md`.
- For multi-file refactors that span generated migrations, run sequentially (Codex's planner sometimes parallelizes file writes that share the migrations index).

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# React Native + Expo project rules.

## Always
- Use pnpm. Never npm or yarn.
- Use expo-image, never react-native Image, for remote URLs.
- Use expo-router typed routes (Href type), not string paths.
- Use Zustand selectors (useStore(s => s.x)).
- Run pnpm typecheck && pnpm lint && pnpm test before declaring done.
- npx expo install for any expo-managed native lib.
- Update app.config.ts (never raw ios/ or android/ files).
- Wrap effects in __DEV__ guards if dev-only.
- Validate inputs and API responses with zod.
- Use src/lib/api.ts for network calls; src/lib/logger.ts for logs; src/lib/db/client.ts for DB.

## Never
- Install redux/recoil/mobx/jotai. Zustand only.
- Use AsyncStorage. MMKV for KV, expo-secure-store for secrets.
- Touch ios/ or android/ directories.
- Set jsEngine to jsc. Hermes only.
- Disable newArchEnabled.
- console.log in shipped code.
- fetch directly outside src/lib/api.ts.
- Hand-edit Drizzle migrations. Always run pnpm db:generate.
- Hard-code env values; read via src/lib/env.ts.
- Push to main without CI green.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "biomejs.biome",
    "expo.vscode-expo-tools",
    "msjsdiag.vscode-react-native",
    "bradlc.vscode-tailwindcss",
    "drizzle-team.drizzle-vscode",
    "dbaeumer.vscode-eslint",
    "ms-azuretools.vscode-docker",
    "github.vscode-github-actions",
    "yoavbls.pretty-ts-errors"
  ],
  "unwantedRecommendations": [
    "esbenp.prettier-vscode"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug iOS (Metro)",
      "type": "reactnative",
      "request": "launch",
      "platform": "ios",
      "target": "simulator",
      "useHermesEngine": true
    },
    {
      "name": "Debug Android (Metro)",
      "type": "reactnative",
      "request": "launch",
      "platform": "android",
      "target": "emulator",
      "useHermesEngine": true
    },
    {
      "name": "Attach to packager",
      "type": "reactnative",
      "request": "attach",
      "useHermesEngine": true
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
    "source.organizeImports.biome": "explicit",
    "quickfix.biome": "explicit"
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "tailwindCSS.experimental.classRegex": [
    ["className=\"([^\"]*)\""],
    ["tw`([^`]*)"]
  ]
}
```

---

## 16. First-PR Scaffold

Execute these in order on a fresh project. After step N, `git push` produces a deployable hello-world that builds with `eas build --profile preview --platform all`.

### 1. `package.json`

```json
{
  "name": "my-app",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "expo start",
    "ios": "expo start --ios",
    "android": "expo start --android",
    "web": "expo start --web",
    "typecheck": "tsc --noEmit",
    "lint": "biome check . && eslint .",
    "lint:fix": "biome check --write . && eslint . --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:ci": "jest --ci --coverage",
    "db:generate": "drizzle-kit generate",
    "db:studio": "drizzle-kit studio",
    "e2e": "maestro test .maestro/",
    "build:preview": "eas build --profile preview --platform all",
    "build:prod": "eas build --profile production --platform all --auto-submit",
    "ota": "eas update --branch production",
    "prepare": "husky"
  },
  "dependencies": {
    "expo": "55.0.15",
    "expo-router": "55.0.12",
    "expo-status-bar": "~2.3.0",
    "expo-splash-screen": "~0.32.0",
    "expo-constants": "~18.0.0",
    "expo-linking": "~8.0.0",
    "expo-font": "~14.0.0",
    "expo-image": "55.0.9",
    "expo-secure-store": "14.0.2",
    "expo-sqlite": "16.0.4",
    "expo-updates": "0.30.4",
    "react": "19.1.0",
    "react-dom": "19.1.0",
    "react-native": "0.85.2",
    "react-native-gesture-handler": "3.0.1",
    "react-native-reanimated": "4.3.0",
    "react-native-worklets": "0.4.0",
    "react-native-safe-area-context": "5.4.0",
    "react-native-screens": "5.1.0",
    "react-native-mmkv": "4.0.5",
    "@shopify/react-native-skia": "2.4.0",
    "drizzle-orm": "0.42.0",
    "zustand": "5.0.12",
    "@tanstack/react-query": "5.62.0",
    "react-hook-form": "7.55.0",
    "zod": "3.24.0",
    "nativewind": "4.2.0",
    "tailwindcss": "3.4.17",
    "@sentry/react-native": "8.8.0",
    "pino": "9.5.0"
  },
  "devDependencies": {
    "@babel/core": "^7.25.0",
    "@biomejs/biome": "2.4.0",
    "@testing-library/react-native": "13.2.0",
    "@types/jest": "30.0.0",
    "@types/react": "~19.1.0",
    "drizzle-kit": "0.30.0",
    "eslint": "9.20.0",
    "eslint-plugin-react-hooks": "5.2.0",
    "husky": "9.2.0",
    "jest": "30.1.0",
    "jest-expo": "55.0.16",
    "typescript": "5.7.3"
  },
  "packageManager": "pnpm@9.15.0",
  "engines": {
    "node": ">=20.19.0"
  },
  "main": "expo-router/entry"
}
```

### 2. `app.config.ts`

```ts
import type { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'My App',
  slug: 'my-app',
  scheme: 'myapp',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  jsEngine: 'hermes',
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.example.myapp',
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff',
    },
    package: 'com.example.myapp',
    permissions: [],
  },
  web: {
    bundler: 'metro',
    favicon: './assets/icon.png',
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-sqlite',
    'expo-updates',
    [
      '@sentry/react-native/expo',
      {
        organization: 'my-org',
        project: 'my-app',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  updates: {
    enabled: true,
    fallbackToCacheTimeout: 0,
    url: 'https://u.expo.dev/REPLACE_WITH_PROJECT_ID',
  },
  runtimeVersion: { policy: 'fingerprint' },
  extra: {
    eas: { projectId: 'REPLACE_WITH_PROJECT_ID' },
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com',
  },
});
```

### 3. `eas.json`

```json
{
  "cli": { "version": ">= 14.5.0", "appVersionSource": "remote" },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": { "simulator": true },
      "env": { "EXPO_PUBLIC_API_URL": "https://api.staging.example.com" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview",
      "ios": { "simulator": false },
      "android": { "buildType": "apk" },
      "env": { "EXPO_PUBLIC_API_URL": "https://api.staging.example.com" },
      "autoIncrement": true
    },
    "production": {
      "channel": "production",
      "autoIncrement": true,
      "env": { "EXPO_PUBLIC_API_URL": "https://api.example.com" }
    }
  },
  "submit": {
    "production": {
      "ios": {
        "appleId": "REPLACE_WITH_APPLE_ID",
        "ascAppId": "REPLACE_WITH_ASC_APP_ID",
        "appleTeamId": "REPLACE_WITH_TEAM_ID"
      },
      "android": {
        "serviceAccountKeyPath": "./google-service-account.json",
        "track": "internal"
      }
    }
  }
}
```

### 4. `tsconfig.json`

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "moduleResolution": "bundler",
    "paths": {
      "@/*": ["./src/*"],
      "~/*": ["./*"]
    }
  },
  "include": [
    "**/*.ts",
    "**/*.tsx",
    "expo-env.d.ts",
    ".expo/types/**/*.ts"
  ],
  "exclude": ["node_modules", "ios", "android"]
}
```

### 5. `babel.config.js`

```js
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      'react-native-worklets/plugin', // MUST BE LAST
    ],
  };
};
```

### 6. `metro.config.js`

```js
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

const sentryConfig = getSentryExpoConfig(__dirname);
sentryConfig.resolver.sourceExts.push('sql'); // Drizzle migrations
sentryConfig.resolver.assetExts.push('sql');

module.exports = withNativeWind(sentryConfig, { input: './global.css' });
```

### 7. `tailwind.config.js`

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: { extend: {} },
  plugins: [],
};
```

### 8. `global.css`

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### 9. `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/2.4.0/schema.json",
  "files": {
    "ignoreUnknown": true,
    "include": ["app/**", "src/**", "*.ts", "*.tsx", "*.js", "*.json"],
    "ignore": ["node_modules", "ios", "android", ".expo", "dist", "coverage", "src/lib/db/migrations"]
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "useExhaustiveDependencies": "off"
      }
    }
  },
  "javascript": {
    "formatter": { "quoteStyle": "single", "trailingCommas": "all", "semicolons": "always" }
  }
}
```

### 10. `.eslintrc.cjs`

```js
module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['react-hooks'],
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'error',
  },
  ignorePatterns: ['node_modules', 'ios', 'android', '.expo', 'dist', 'coverage', '**/*.test.tsx'],
};
```

### 11. `jest.config.js`

```js
module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEach: ['<rootDir>/src/test/setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|@shopify/react-native-skia|nativewind|drizzle-orm))',
  ],
  testPathIgnorePatterns: ['/node_modules/', '/ios/', '/android/', '/.expo/', '/dist/'],
  collectCoverageFrom: ['src/features/**/*.{ts,tsx}', 'src/lib/**/*.{ts,tsx}'],
  coverageThreshold: { global: { lines: 80, branches: 70 } },
};
```

### 12. `drizzle.config.ts`

```ts
import type { Config } from 'drizzle-kit';

export default {
  schema: './src/lib/db/schema.ts',
  out: './src/lib/db/migrations',
  dialect: 'sqlite',
  driver: 'expo',
} satisfies Config;
```

### 13. `src/lib/db/schema.ts`

```ts
import { sqliteTable, integer, text } from 'drizzle-orm/sqlite-core';

export const todos = sqliteTable('todos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  text: text('text').notNull(),
  done: integer('done', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export type Todo = typeof todos.$inferSelect;
export type NewTodo = typeof todos.$inferInsert;
```

### 14. `src/lib/db/client.ts`

```ts
import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import migrations from './migrations/migrations';

const expoDb = openDatabaseSync('app.db', { enableChangeListener: true });
export const db = drizzle(expoDb);
export { migrations };
```

### 15. `src/lib/api.ts`

```ts
import * as SecureStore from 'expo-secure-store';
import logger from './logger';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://api.example.com';

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('access_token');
  const headers = new Headers(init.headers);
  headers.set('Content-Type', 'application/json');
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const requestId = Math.random().toString(36).slice(2, 10);
  logger.info({ event: 'api_request', method: init.method ?? 'GET', path, request_id: requestId }, 'out');

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers });
  logger.info({ event: 'api_response', status: res.status, path, request_id: requestId }, 'in');
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API ${res.status}: ${body}`);
  }
  return (await res.json()) as T;
}
```

### 16. `src/lib/env.ts`

```ts
import Constants from 'expo-constants';
import { z } from 'zod';

const envSchema = z.object({
  apiUrl: z.string().url(),
});

const raw = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? process.env.EXPO_PUBLIC_API_URL,
};

export const env = envSchema.parse(raw);
```

### 17. `src/lib/storage.ts`

```ts
import { MMKV } from 'react-native-mmkv';

export const kv = new MMKV({ id: 'app-storage', encryptionKey: 'app-storage-v1' });
```

### 18. `src/lib/logger.ts`

(content from Section 7)

### 19. `app/_layout.tsx`

```tsx
import 'react-native-gesture-handler';
import '../global.css';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useMigrations } from 'drizzle-orm/expo-sqlite/migrator';
import { db, migrations } from '@/lib/db/client';
import * as Sentry from '@sentry/react-native';
import { Text, View } from 'react-native';

Sentry.init({
  dsn: process.env.EXPO_PUBLIC_SENTRY_DSN,
  tracesSampleRate: __DEV__ ? 0 : 0.2,
  profilesSampleRate: __DEV__ ? 0 : 0.1,
});

const queryClient = new QueryClient();

function RootLayout() {
  const { success, error } = useMigrations(db, migrations);
  if (error) return <View><Text>Migration error: {error.message}</Text></View>;
  if (!success) return <View><Text>Migrating database…</Text></View>;
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <Stack />
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
```

### 20. `app/index.tsx`

```tsx
import { Text, View } from 'react-native';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-2xl font-bold">Hello from Expo Router</Text>
    </View>
  );
}
```

### 21. `.maestro/smoke.yaml`

```yaml
appId: com.example.myapp
---
- launchApp
- assertVisible: "Hello from Expo Router"
```

### 22. `.github/workflows/ci.yml`

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:ci
      - run: pnpm audit --prod --audit-level=high
```

### 23. `.github/workflows/eas-build-on-tag.yml`

```yaml
name: EAS Build on tag
on:
  push: { tags: ['v*'] }

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: '24', cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm add -g eas-cli
      - run: eas build --profile production --platform all --non-interactive --auto-submit
        env: { EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }} }
```

### 24. `.gitignore`

```
node_modules
.expo
dist
coverage
ios
android
.env
.env.local
*.keystore
*.p8
google-service-account.json
.DS_Store
```

### 25. `README.md` (stub)

```markdown
# my-app

React Native + Expo app. See `rulebooks/react-native-expo.md` for the full rulebook.

## Quickstart

```
pnpm install
pnpm expo start
```
```

### 26. `LICENSE`

```
MIT License — Copyright (c) 2026 You
[full MIT text]
```

### 27. `.env.example`

```
EXPO_PUBLIC_API_URL=https://api.staging.example.com
EXPO_PUBLIC_SENTRY_DSN=https://abc@o0.ingest.sentry.io/123
```

After all 27 files are in place: `git add . && git commit -m "feat: scaffold" && git push origin main` triggers CI green; `git tag v1.0.0 && git push --tags` triggers EAS Build.

---

## 17. Idea → MVP Path

Default project idea: a generic CRUD app (e.g., notes, tasks, journal). Adjust to your `PROJECT_IDEA`.

### Phase 1 — Schema (1 AI session)

Files touched: `src/lib/db/schema.ts`, `drizzle.config.ts`.

- Define tables for the core entity (e.g. `items`, `categories`, `users`).
- Run `pnpm db:generate`. Commit migrations.
- Exit criteria: `pnpm typecheck` green; `pnpm db:studio` shows tables.

### Phase 2 — Backbone (2 AI sessions)

Files touched: `app/(tabs)/_layout.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/settings.tsx`, `src/components/Button.tsx`.

- Create tab routes (Home, Settings).
- Stub screens render lists with placeholder data.
- Exit criteria: app boots on iOS+Android; navigation between tabs works; one Maestro flow asserts both tabs visible.

### Phase 3 — Vertical slice (3 AI sessions)

Files touched: `src/features/items/{api.ts,store.ts,schema.ts,components/}`, `app/(tabs)/index.tsx`, tests, `.maestro/items.yaml`.

- Wire create/read/update/delete for one entity.
- Use Drizzle + `useLiveQuery` for the list.
- Form: react-hook-form + zod.
- Exit criteria: full CRUD works offline; unit tests for reducer + integration test for DB; Maestro flow creates and deletes an item.

### Phase 4 — Auth + multi-user (3 AI sessions)

Files touched: `app/(auth)/`, `src/features/auth/`, `src/lib/api.ts`, `app/_layout.tsx`.

- Add Clerk Expo SDK or your backend's email/password.
- Tokens via expo-secure-store; refresh on 401.
- Item table gains `userId` column; queries scoped by current user.
- Exit criteria: sign-up/sign-in/sign-out works on both platforms; session persists cold start; items isolated per user.

### Phase 5 — Ship + monitor (2 AI sessions)

Files touched: `eas.json`, `.github/workflows/`, store metadata.

- `eas build --profile preview` → install on TestFlight + Internal track.
- Sentry receiving events.
- Submit to App Store + Play Store.
- Exit criteria: app live in both stores (or in review); Sentry shows session start; OTA path tested with `eas update`.

---

## 18. Feature Recipes

### 18.1 Authentication (email/password + OAuth via Clerk)

1. `npx expo install @clerk/clerk-expo`.
2. Add ClerkProvider to `app/_layout.tsx`:
```tsx
import { ClerkProvider, ClerkLoaded } from '@clerk/clerk-expo';
import { tokenCache } from '@clerk/clerk-expo/token-cache';

<ClerkProvider tokenCache={tokenCache} publishableKey={process.env.EXPO_PUBLIC_CLERK_KEY!}>
  <ClerkLoaded>{/* existing tree */}</ClerkLoaded>
</ClerkProvider>
```
3. `app/(auth)/sign-in.tsx`: `useSignIn()` hook + form. `app/(auth)/sign-up.tsx`: `useSignUp()` + email code verification.
4. Guard in `app/_layout.tsx`: `const { isSignedIn } = useAuth(); if (!isSignedIn) return <Redirect href="/(auth)/sign-in" />;`.
5. Add `EXPO_PUBLIC_CLERK_KEY` as EAS Secret.

### 18.2 File upload + storage (e.g. S3 via signed URLs)

1. `npx expo install expo-image-picker expo-file-system`.
2. Pick file: `await ImagePicker.launchImageLibraryAsync({ mediaTypes: 'images', quality: 0.7 })`.
3. Get signed URL from your API.
4. PUT to signed URL: `await fetch(signedUrl, { method: 'PUT', body: blob })`.
5. Add `NSPhotoLibraryUsageDescription` to `app.config.ts` `ios.infoPlist`.

### 18.3 Stripe (in-app purchases via RevenueCat)

1. `npx expo install react-native-purchases`. Add `react-native-purchases` to `app.config.ts` plugins (none needed; it's autolinked).
2. Configure RevenueCat dashboard with App Store + Play Store keys.
3. `Purchases.configure({ apiKey: process.env.EXPO_PUBLIC_RC_KEY!, appUserID: clerkUserId })` in `_layout.tsx` after auth.
4. Show offerings: `const offerings = await Purchases.getOfferings()`.
5. Buy: `await Purchases.purchasePackage(pkg)`.

### 18.4 Push notifications

1. `npx expo install expo-notifications expo-device`.
2. Request permission + get token in `app/_layout.tsx`:
```ts
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const token = (await Notifications.getExpoPushTokenAsync({ projectId: Constants.expoConfig?.extra?.eas?.projectId })).data;
  await api('/devices', { method: 'POST', body: JSON.stringify({ token }) });
}
```
3. Backend sends to Expo Push API: `POST https://exp.host/--/api/v2/push/send`.
4. iOS: requires APNs key uploaded to Expo (via `eas credentials`). Android: FCM v1 credentials.

### 18.5 Background jobs / cron

1. `npx expo install expo-background-fetch expo-task-manager`.
2. Define task in `src/lib/tasks.ts`:
```ts
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';

TaskManager.defineTask('SYNC_TASK', async () => {
  await syncToBackend();
  return BackgroundFetch.BackgroundFetchResult.NewData;
});
```
3. Register: `BackgroundFetch.registerTaskAsync('SYNC_TASK', { minimumInterval: 15 * 60 })`.
4. Add `UIBackgroundModes: ['fetch']` in `ios.infoPlist`.

### 18.6 Realtime (WebSocket + React Query)

1. Open WS in a `useEffect` in `app/_layout.tsx` (or feature).
2. On message → `queryClient.invalidateQueries({ queryKey: ['todos'] })`.
3. Reconnect with exponential backoff. Close on app background, reopen on foreground (`AppState`).

### 18.7 Search (local SQLite FTS5)

1. Drizzle table with `using fts5`:
```ts
sql`CREATE VIRTUAL TABLE todos_fts USING fts5(text, content='todos', content_rowid='id');`
```
2. Sync via triggers (Drizzle raw SQL).
3. Query: `db.run(sql\`SELECT * FROM todos WHERE id IN (SELECT rowid FROM todos_fts WHERE todos_fts MATCH ${query})\`)`.

### 18.8 Internationalization

1. `npx expo install expo-localization i18next react-i18next`.
2. `src/i18n.ts`:
```ts
import * as Localization from 'expo-localization';
import i18n from 'i18next';
import en from './locales/en.json';
import es from './locales/es.json';

i18n.init({
  lng: Localization.locale.split('-')[0],
  fallbackLng: 'en',
  resources: { en: { translation: en }, es: { translation: es } },
});
```
3. Use `useTranslation()`.

### 18.9 Dark mode

1. NativeWind 4 supports `dark:` prefix automatically.
2. `useColorScheme` from `react-native` returns `'light' | 'dark'`.
3. Allow user override in settings; persist via MMKV.

### 18.10 Analytics events

1. `npx expo install posthog-react-native`.
2. Wrap root with `PostHogProvider` in `_layout.tsx`.
3. `posthog.capture('item_created', { count })` from features.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Unable to resolve module react-native-reanimated` | Reinstall and restart with `-c`: `pnpm install && pnpm expo start -c` |
| `TransformError ... babel-plugin-transform-...` | Clear Babel cache: `rm -rf node_modules/.cache && pnpm expo start -c` |
| `Cannot find native module 'ExpoSecureStore'` | Running in Expo Go; build a dev client: `eas build --profile development` |
| `Error: spawn xcrun ENOENT` | macOS only, missing CLT: `xcode-select --install` |
| `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` | Android local build broken; clean + rebuild: `cd android && ./gradlew clean && cd .. && pnpm expo run:android` |
| `RNG package not found in your project` | (random older lib) — use crypto.getRandomValues from expo-crypto |
| `Hermes engine could not be enabled` | RN 0.85+: ensure no `jsEngine: 'jsc'` in `app.config.ts`; `expo prebuild --clean` |
| `Multiple versions of React were detected` | `pnpm dedupe` and ensure only `react@19.1.0` in `pnpm why react` |
| `Invariant Violation: TurboModuleRegistry.getEnforcing(...): 'XYZ' could not be found` | Module not bundled in Expo Go; build dev client |
| `EAS Build failed: Provisioning profile expired` | `eas credentials -p ios` → re-create profile |
| `EAS Build failed: gradle keystore` | `eas credentials -p android` → set keystore |
| `[android] Cannot fit requested classes in a single dex file` | Enable multidex in `app.config.ts` `android.multidex: true` |
| `error: NSAppTransportSecurity` | Set `infoPlist.NSAppTransportSecurity.NSAllowsArbitraryLoads = false` and use HTTPS only |
| `Network request failed` (Android emulator) | Use `10.0.2.2` instead of `localhost` for host machine |
| `Network request failed` (iOS sim) | Localhost works; check API server is up |
| `Unable to find an emulator running` | Start AVD via Android Studio first |
| `Maestro: app not found` | `appId:` in flow doesn't match `android.package`; fix YAML |
| `error: tsc - Cannot find module '@/lib/api'` | Add path alias to `tsconfig.json` (already done in scaffold) |
| `Drizzle: no such table: todos` | Run migrations: ensure `useMigrations` runs before queries |
| `Expo Push: DeviceNotRegistered` | Token stale (user reinstalled); delete from your DB and re-register on next launch |
| `Sentry: missing source map` | Set `SENTRY_AUTH_TOKEN` as EAS Secret; ensure withSentry plugin in `app.config.ts` |
| `pnpm error ERR_PNPM_PEER_DEP_ISSUES` | `pnpm install --strict-peer-dependencies=false` after verifying compatibility |
| `[Reanimated] Mismatch between JavaScript and the native part` | Reinstall: native version installed differs from JS version; rebuild the dev client |
| `eas update fails: runtimeVersion mismatch` | Native build's runtime version != update's; cut a new native build first |
| `Failed to load assetlinks.json (Android App Links)` | Host the file at `https://yourdomain.com/.well-known/assetlinks.json` with correct SHA-256 |
| `Apple TestFlight: Missing Compliance` | Set `infoPlist.ITSAppUsesNonExemptEncryption: false` |
| `Google Play: Your app uses outdated Target SDK` | Bump to Android API 35 in `app.config.ts` `android.targetSdkVersion` |
| `Splash screen never disappears` | Call `SplashScreen.hideAsync()` in `_layout.tsx` after fonts/db ready |
| `Touch events not working on Android after Reanimated upgrade` | Wrap root with `<GestureHandlerRootView>` in `_layout.tsx` |

---

## 20. Glossary

- **Bundle ID / Application ID:** A globally unique reverse-DNS string identifying your app on each store (`com.example.myapp`).
- **Config Plugin:** A function that mutates the native `Info.plist` / `AndroidManifest.xml` at build time so you don't edit native code by hand.
- **Cold start:** Time from tapping the app icon until the first interactive screen renders.
- **Dev client:** A custom version of Expo Go that includes your project's native modules. Required when libraries aren't in standard Expo Go.
- **EAS:** Expo Application Services — Expo's cloud for builds, submits, updates.
- **EAS Secret:** Encrypted env var stored on EAS servers, injected at build time. Use for API keys.
- **Expo Go:** A pre-built sandbox app (App Store / Play) that runs your JS bundle. Limited to libs Expo bundled into it.
- **Expo Router:** File-based router for React Native, mirroring Next.js's `app/` directory.
- **Fast Refresh:** React Native's hot reload — preserves component state across edits.
- **FCM:** Firebase Cloud Messaging — Google's push notification service for Android.
- **Hermes:** Facebook's JavaScript engine optimized for React Native; default since RN 0.84.
- **JSI (JavaScript Interface):** The C++ layer that lets JS call native code synchronously. Replaces the older Bridge.
- **JSX:** Syntactic sugar for `React.createElement` — looks like XML in JS.
- **Maestro:** YAML-based mobile E2E testing framework.
- **Metro:** React Native's JavaScript bundler.
- **MMKV:** A fast key-value storage library — 30x faster than AsyncStorage.
- **NativeWind:** Tailwind CSS for React Native; classes compile to React Native styles.
- **New Architecture:** Modern React Native runtime (TurboModules + Fabric) replacing the legacy bridge. Default in SDK 55.
- **OTA (Over-The-Air) update:** Shipping a JS bundle update without re-submitting to stores. Done via EAS Update / `expo-updates`.
- **Prebuild:** Generating raw `ios/` and `android/` directories from `app.config.ts`. Reversible — delete and re-run.
- **Preset (Babel/Jest):** A bundle of plugins/configuration for a specific environment.
- **Reanimated:** Library for running animations on the UI thread (60fps, no JS jank).
- **Runtime Version:** A string identifying which native binary an OTA update is compatible with. `fingerprint` policy auto-derives from your config.
- **Skia:** A 2D graphics library; lets you draw arbitrary shapes/paths in React Native.
- **Splash Screen:** The native image shown before JS loads.
- **Tab Group:** A directory in `app/` named `(name)` that doesn't appear in URL but groups screens with shared chrome.
- **TestFlight:** Apple's beta distribution platform; included with Apple Developer Program.
- **Universal Links:** Apple's deep-link standard via signed `apple-app-site-association` file.
- **Worklet:** A JS function that runs on the UI thread instead of the JS thread; used by Reanimated.
- **Zustand:** A small, fast state management library based on `useSyncExternalStore`.

---

## 21. Update Cadence

- This rulebook is valid for **Expo SDK 55.x** and **React Native 0.85.x**.
- Re-run the generator when:
  - Expo bumps to SDK 56 (expected ~Aug 2026).
  - React Native major bump.
  - Apple or Google changes target SDK requirements (annually).
  - Security advisory affects pinned versions.
  - `runtimeVersion` policy changes.
- Last updated: **2026-04-27**.

---

## Known Gaps

- Exact dot versions for `react-native-worklets` (0.4.0 listed) and a few minor deps were inferred from compatibility tables rather than confirmed via direct npm metadata in this session — verify with `pnpm outdated` on first install.
- `EAS CLI` 14.5.0 is the latest stable as of search date; bump if `eas --version` reports newer.
- Clerk Expo SDK version not pinned (their docs recommend "latest"); pin via `npx expo install @clerk/clerk-expo` on bootstrap and commit the resolved version.
