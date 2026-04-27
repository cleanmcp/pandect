---
stack: SwiftUI macOS-native + SwiftData + Swift Concurrency + Sparkle + Notarization + MAS + DMG
version: 2026-04-27
host_os: macOS host required for Xcode (Win/Linux developers must use MacInCloud)
---

# SwiftUI macOS Rulebook

A native macOS app, signed and shipped, with one decision per axis. Liquid Glass design (macOS Tahoe 26), SwiftData persistence, Swift Concurrency, Sparkle 2 auto-update, Developer ID + DMG as primary channel, Mac App Store as parallel build.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Swift 6.3 | Strict concurrency on by default; Apple-blessed. |
| Runtime + version | macOS Tahoe 26.0 minimum deployment target | Latest SDK; covers ~85% installed base by ship. |
| Package manager | Swift Package Manager (SPM) | Built into Xcode; no CocoaPods. |
| Build tool | Xcode 26.4.1 + xcodebuild | Only sane CLI build path on macOS. |
| Project format | Single .xcodeproj checked in (no Tuist) | Lowest tooling friction for solo devs. |
| State mgmt | `@Observable` macro + `@State` + `@Environment` | Built-in; killed ObservableObject in Swift 5.9. |
| Routing/Nav | `NavigationSplitView` (3-column) + `NavigationStack` | Native macOS; not the iOS-only `NavigationView`. |
| Data layer | SwiftData with `@Model` + ModelContainer | Apple-native; CoreData wrapper, no Realm/GRDB. |
| Auth | ASAuthorizationAppleIDProvider (Sign in with Apple) + Keychain | Required for MAS; works for Developer ID too. |
| Styling | SwiftUI built-in modifiers + `.controlSize(.regular)` | No CSS-in-Swift libraries. |
| Forms + validation | `Form` + `TextField` + `.onSubmit` + custom `Validator` struct | No third-party form libs. |
| Unit test runner | Swift Testing (`@Test`, `#expect`) | Replaces XCTest; bundled in Xcode 26. |
| UI test runner | XCUITest | Only path for macOS UI automation. |
| E2E framework | XCUITest with `XCTestPlan` parallelism | macOS-only option that ships parallelism. |
| Mocking strategy | Protocol + struct mock; never mock `ModelContext` | SwiftData container is fast; test against real. |
| Logger | `os.Logger` (unified logging) + Sentry-Cocoa for prod | OS-native; Console.app reads it for free. |
| Error tracking | Sentry-Cocoa 8.56.2 | macOS support; free tier; simple SPM install. |
| Lint | SwiftLint 0.64.0-rc.1 (NOT 0.63.0 — crashes on macOS 26) | De-facto standard; build-phase integrated. |
| Format | swift-format 601.0.0 (toolchain-bundled) | Apple-official; replaces SwiftFormat for new projects. |
| Type checking | Swift compiler with `-strict-concurrency=complete` | Catches data races at compile time. |
| Env vars + secrets | `.xcconfig` files + Keychain (runtime secrets) | Built-in; never commit secrets. |
| CI provider | GitHub Actions on `macos-15` runner | Free for open source; paid macos-15 minutes are tolerable. |
| Distribution channel | Developer ID + DMG (primary) + Mac App Store (parallel build) | Direct sales = 100% revenue; MAS = discoverability. |
| Sandboxing | App Sandbox enabled for both Developer ID and MAS builds | Future-proof; required for MAS; opt-in for Dev ID. |
| Hardened Runtime | Always on | Required for notarization. |
| Code signing | Developer ID Application + Apple Distribution (parallel) | Two certs, two builds, one source tree. |
| Auto-update | Sparkle 2.9.1 (Developer ID build only — MAS handles its own) | De-facto standard for outside-MAS macOS apps. |
| DMG build | `create-dmg` 1.2.2 (Homebrew) | Smallest dependency; works in CI. |
| Window architecture | Single `WindowGroup` + `Settings` scene + optional `MenuBarExtra` | Default for macOS apps; iOS-style single-window forbidden. |
| Settings storage | `@AppStorage` (UserDefaults) + `Settings` scene | Standard preferences pattern. |
| Notarization | `xcrun notarytool submit --wait` + `stapler staple` | Replaces deprecated `altool`. |
| Crash reports | `MetricKit` for system + Sentry for symbolicated user-visible | Apple-native + third-party redundancy. |

### Versions Table

| Library / Tool | Version | Released | Link |
|---|---|---|---|
| Xcode | 26.4.1 | 2026-04-16 | https://developer.apple.com/xcode/ |
| Swift | 6.3 | 2026-03-24 | https://swift.org/blog/swift-6.3-released/ |
| macOS deployment target | 26.0 (Tahoe) | 2025-09 | https://developer.apple.com/macos/ |
| Sparkle | 2.9.1 | 2026-04-08 | https://github.com/sparkle-project/Sparkle/releases |
| Sentry-Cocoa | 8.56.2 | 2026-04 | https://github.com/getsentry/sentry-cocoa/releases |
| SwiftLint | 0.64.0-rc.1 | 2026-03 | https://github.com/realm/SwiftLint/releases |
| swift-format | 601.0.0 | 2026-03 | https://github.com/swiftlang/swift-format |
| swift-log | 1.6.4 | 2026-02 | https://github.com/apple/swift-log |
| create-dmg | 1.2.2 | 2025-12 | https://github.com/create-dmg/create-dmg |

### Minimum Host Requirements

- macOS Sequoia 15.6 or later (Xcode 26 requirement).
- Apple silicon strongly preferred (Coding Intelligence requires Apple silicon + macOS Tahoe).
- 16 GB RAM minimum, 32 GB recommended.
- 80 GB free disk (Xcode + simulators + SwiftData test stores).

### Cold-start Time

`git clone` to running app on a fresh M2 MacBook with Xcode pre-installed: **~6 minutes** (SPM resolve + first build).

---

## 2. Zero-to-running (Setup)

### macOS (the only first-class path)

```bash
# 1. Install Xcode (full IDE, not just Command Line Tools)
xcode-select --install                               # CLT first
# Then install Xcode 26.4.1 from the Mac App Store, OR:
# Download .xip from https://developer.apple.com/download/all/
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept

# 2. Install Homebrew + tools
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
brew install swiftlint create-dmg gh

# 3. Verify
xcodebuild -version          # Expect: Xcode 26.4.1, Build version 17F xxx
swift --version              # Expect: Apple Swift version 6.3
swiftlint version            # Expect: 0.64.0-rc.1 or later

# 4. Apple Developer account — REQUIRED
# Create at https://developer.apple.com/programs/ ($99/yr).
# In Xcode: Settings → Accounts → "+" → Apple ID → sign in.
# Then: Manage Certificates → "+" → Developer ID Application → "+" → Apple Distribution.

# 5. App Store Connect API key (for notarytool + Fastlane-free CI)
# https://appstoreconnect.apple.com/access/api → Generate API Key
# Save the .p8 file. Note Key ID (10 chars) and Issuer ID (UUID).

# 6. Store notarization credentials in keychain
xcrun notarytool store-credentials "AC_NOTARY" \
  --key ~/.private_keys/AuthKey_XXXXXXXXXX.p8 \
  --key-id "XXXXXXXXXX" \
  --issuer "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"

# 7. Bootstrap project from rulebook scaffold (see Section 16)
mkdir MyApp && cd MyApp
git init
# Create files from Section 16, then:
open MyApp.xcodeproj

# 8. First build (CLI)
xcodebuild -project MyApp.xcodeproj -scheme MyApp \
  -destination 'platform=macOS,arch=arm64' build

# Expected last line:
# ** BUILD SUCCEEDED **

# 9. Run
xcodebuild -project MyApp.xcodeproj -scheme MyApp \
  -destination 'platform=macOS' -derivedDataPath ./build
open build/Build/Products/Debug/MyApp.app
```

### Common First-run Errors

| Error | Fix |
|---|---|
| `Showing All Errors Only: Cycle inside MyApp` | `rm -rf ~/Library/Developer/Xcode/DerivedData/*`; rebuild. |
| `error: Signing for "MyApp" requires a development team` | Open Xcode → Project → Signing & Capabilities → set Team. |
| `xcrun: error: invalid active developer path` | `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer` |
| `SwiftLint version 0.63.0 crashes on macOS 26` | Pin SwiftLint to 0.64.0-rc.1 in Brewfile. |
| `Module 'Sparkle' not found` | Xcode → File → Packages → Reset Package Caches. |

### Windows / Linux

**SwiftUI for macOS REQUIRES a macOS host with Xcode. There is no Linux/Windows path. Apple does not ship Xcode for non-macOS systems, and SwiftUI's macOS framework (`AppKit`-bridged SwiftUI) cannot be built without Apple's proprietary toolchain.**

The only options for Windows/Linux developers:

1. **MacInCloud** — https://www.macincloud.com/ — pay-as-you-go remote Mac with Xcode pre-installed. Plans from $1/hr. Use this. It's the only path.
2. Buy a used Mac mini (M2 from $499 refurbished).

Do not attempt: Swift on Linux (no SwiftUI), Wine, Hackintosh (violates Apple license), Docker macOS images (slow, ToS-violating).

If forced onto Windows/Linux: provision MacInCloud, then follow the macOS section above over RDP/VNC.

---

## 3. Project Layout

```
MyApp/
├── MyApp.xcodeproj/              # Xcode project — DO NOT hand-edit project.pbxproj
├── MyApp/
│   ├── MyAppApp.swift            # @main App struct; scene declarations
│   ├── ContentView.swift         # Root view (NavigationSplitView)
│   ├── Models/                   # @Model SwiftData entities
│   │   ├── Item.swift
│   │   └── ItemCategory.swift
│   ├── Views/                    # SwiftUI views (one type per file)
│   │   ├── Sidebar/
│   │   ├── Detail/
│   │   └── Settings/
│   ├── Services/                 # Business logic, network, file IO
│   │   ├── DataController.swift
│   │   ├── UpdaterController.swift  # Sparkle wrapper
│   │   └── Logger+App.swift
│   ├── Utilities/                # Pure helpers, extensions
│   ├── Resources/
│   │   ├── Assets.xcassets
│   │   ├── Localizable.xcstrings
│   │   └── Info.plist
│   ├── Configs/
│   │   ├── Debug.xcconfig
│   │   ├── Release.xcconfig
│   │   ├── DeveloperID.xcconfig
│   │   └── MAS.xcconfig
│   └── Entitlements/
│       ├── MyApp.entitlements           # Developer ID variant
│       └── MyApp-MAS.entitlements       # Mac App Store variant
├── MyAppTests/                   # Unit tests (Swift Testing)
│   └── *Tests.swift
├── MyAppUITests/                 # UI tests (XCUITest)
│   └── *UITests.swift
├── Scripts/
│   ├── build-dmg.sh
│   ├── notarize.sh
│   └── publish-appcast.sh
├── .github/workflows/
│   ├── ci.yml
│   └── release.yml
├── appcast.xml                   # Sparkle update feed (committed for GitHub Pages hosting)
├── Package.swift                 # ONLY if building as SPM lib; not for app
├── .swiftlint.yml
├── .swift-format
├── .gitignore
├── CLAUDE.md
├── AGENTS.md
├── .cursor/rules
└── README.md
```

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| File for a type | exact type name + `.swift` | `ItemDetailView.swift` |
| SwiftUI view | `<Noun>View` | `SidebarView` |
| Observable | `<Noun>Controller` or `<Noun>Store` | `DataController` |
| SwiftData model | bare noun, no suffix | `Item`, not `ItemModel` |
| Test file | `<Type>Tests.swift` | `ItemTests.swift` |
| UI test | `<Flow>UITests.swift` | `OnboardingUITests.swift` |
| Async function | verb form, ends `() async throws` | `func fetch() async throws` |

### Where Does X Go?

| Adding | Goes in |
|---|---|
| New SwiftData entity | `Models/<Name>.swift` + register in `ModelContainer` schema |
| New top-level view | `Views/<Section>/<Name>View.swift` |
| New menu command | `Views/Commands/<Name>Commands.swift`, attached via `.commands {}` |
| New keyboard shortcut | `.keyboardShortcut(_:)` on the relevant Command |
| Network call | `Services/<Domain>Service.swift` (an `actor`) |
| File-system access | `Services/FileService.swift` only |
| Window controller | `WindowGroup` in `MyAppApp.swift` |
| Settings panel | `Views/Settings/<Name>Pane.swift`, registered in `Settings` scene |
| Menu bar item | `MenuBarExtra` block in `MyAppApp.swift` |
| Background task | `actor`-isolated `Task` from `UpdaterController` or similar |
| Localized string | `Localizable.xcstrings` (Xcode String Catalog) |
| Image / icon | `Assets.xcassets` |
| App icon | `Assets.xcassets/AppIcon.appiconset` (1024x1024 PNG required) |
| Build configuration | `Configs/*.xcconfig` |
| Secret at runtime | Keychain via `Services/KeychainService.swift` |
| Logger call site | `Logger.app.info("event", ...)` — never `print()` |

---

## 4. Architecture

### Process / Scene Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│ MyApp (single process, sandboxed)                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
│  │ WindowGroup  │  │   Settings   │  │  MenuBarExtra    │ │
│  │ (main UI)    │  │   (prefs)    │  │  (optional)      │ │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘ │
│         │                 │                   │           │
│         └────────┬────────┴───────────────────┘           │
│                  │                                         │
│            ┌─────▼─────┐                                   │
│            │ ModelCtnr │ ◄── SwiftData (single source)    │
│            └─────┬─────┘                                   │
│                  │                                         │
│       ┌──────────┼──────────┐                              │
│       │          │          │                              │
│  ┌────▼───┐ ┌────▼───┐ ┌────▼───┐                          │
│  │Service1│ │Service2│ │Sparkle │  actors                  │
│  │ (actor)│ │ (actor)│ │Updater │                          │
│  └────────┘ └────────┘ └────────┘                          │
└─────────────────────────────────────────────────────────────┘
                  │
                  ▼ (only signed/sandboxed network egress)
              Network / disk
```

### Data Flow (Typical User Action)

```
User clicks "Add Item"
   │
   ▼
View captures @Bindable state
   │
   ▼
Calls Controller method (MainActor)
   │
   ▼
Controller hops to actor for IO if needed
   │
   ▼
Mutates ModelContext on MainActor
   │
   ▼
SwiftData notifies @Query observers
   │
   ▼
SwiftUI diff & redraw
```

### Auth Flow (Sign in with Apple)

```
Settings pane → "Sign in with Apple" button
   │
   ▼
ASAuthorizationAppleIDProvider.createRequest()
   │
   ▼
ASAuthorizationController.performRequests()
   │
   ▼
System sheet (Touch ID / password)
   │
   ▼
delegate didCompleteWithAuthorization
   │
   ▼
Persist credential.user, .identityToken in Keychain
   │
   ▼
Update @AppStorage("isSignedIn") = true
```

### State Management Flow

```
@Observable class AppController          (single, in MyAppApp via @State)
       │
       ├── @MainActor properties (UI-bound)
       └── child actors for IO

Views read with @Environment(AppController.self) or @Bindable wrapper.
SwiftData lists use @Query(sort: ...)  — NEVER manual fetch in views.
```

### Entry-point File Map

| File | Responsibility |
|---|---|
| `MyAppApp.swift` | `@main` App struct; declares `WindowGroup`, `Settings`, optional `MenuBarExtra`; instantiates `ModelContainer` and `AppController` |
| `ContentView.swift` | `NavigationSplitView` with three columns; no business logic |
| `DataController.swift` | Wraps `ModelContainer`; exposes `MainActor`-isolated APIs |
| `UpdaterController.swift` | Sparkle `SPUStandardUpdaterController` wrapper; only compiled in Developer ID build |
| `Logger+App.swift` | Static `Logger` instances per subsystem |

### Where Logic Lives

- **In `Services/` (actors):** network, disk, parsing, keychain, Sparkle.
- **In `Models/`:** field-level validation, computed properties on `@Model`.
- **In `Views/`:** layout, presentation, `@Binding`-driven actions calling controllers.
- **NOT in views:** `URLSession`, `FileManager`, `try? await`, business rules.
- **NOT in models:** `URLSession`, view-related code.

---

## 5. Dev Workflow

### Start dev session

```bash
open MyApp.xcodeproj
# Cmd-R to build & run
# Cmd-U to run tests
# Cmd-Shift-K to clean build folder
```

CLI alternative:

```bash
xcodebuild -project MyApp.xcodeproj -scheme MyApp \
  -destination 'platform=macOS' \
  build run | xcpretty
```

### Hot Reload

SwiftUI Previews (`#Preview { ... }`) auto-reload on save. Full app does **not** hot-reload — Cmd-R rebuilds. Previews break when:
- Preview references types annotated `@MainActor` and the macro hasn't regenerated → Editor → Refresh Canvas.
- Preview imports `Sparkle` → exclude with `#if !PREVIEW` or stub the controller.

### Debugger

| Editor | How |
|---|---|
| Xcode | Native; click gutter to set breakpoints; LLDB console |
| VS Code / Cursor | Install "CodeLLDB" + "Swift" extensions; use launch.json (Section 15) |
| Cmd-line | `lldb -- ./MyApp.app/Contents/MacOS/MyApp` |

### Inspecting State at Runtime

- **SwiftUI hierarchy:** Xcode Debug → View Debugger.
- **Memory:** Instruments → Allocations.
- **Logs:** Console.app → filter by subsystem `com.example.MyApp`.
- **SwiftData store:** `~/Library/Containers/com.example.MyApp/Data/Library/Application Support/default.store` — open with `sqlite3` CLI.
- **Network:** Charles Proxy (set in Settings → Network).
- **Crashes:** `~/Library/Logs/DiagnosticReports/MyApp-*.crash`.

### Pre-commit Checks

`.git/hooks/pre-commit`:

```bash
#!/usr/bin/env bash
set -euo pipefail
swiftlint --strict
swift format lint --strict --recursive MyApp/ MyAppTests/
xcodebuild -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' \
  -quiet build-for-testing
```

### Branch + Commit Conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat: add foo`, `fix: handle nil`, `chore: bump Sparkle`).
- PRs: squash-merge to `main`. Tag releases as `vX.Y.Z`.

---

## 6. Testing & Parallelization

### Unit Tests (Swift Testing)

Location: `MyAppTests/*Tests.swift`. One `struct` per file, methods annotated `@Test`.

```swift
import Testing
@testable import MyApp

@Suite("Item Validation")
struct ItemTests {
    @Test func emptyTitleRejected() {
        let item = Item(title: "")
        #expect(item.isValid == false)
    }
}
```

Run all:
```bash
xcodebuild test -project MyApp.xcodeproj -scheme MyApp \
  -destination 'platform=macOS' -parallel-testing-enabled YES
```

Single test:
```bash
xcodebuild test -only-testing:MyAppTests/ItemTests/emptyTitleRejected ...
```

Watch mode: not native. Use `fswatch`:
```bash
fswatch -o MyApp/ MyAppTests/ | xargs -n1 -I{} xcodebuild test ...
```

### Integration Tests

Live in `MyAppTests/Integration/`. Use a real `ModelContainer` with `isStoredInMemoryOnly: true`.

```swift
let config = ModelConfiguration(isStoredInMemoryOnly: true)
let container = try ModelContainer(for: Item.self, configurations: config)
```

### UI / E2E (XCUITest)

Location: `MyAppUITests/*UITests.swift`. Parallel by default with `XCTestPlan`:

`MyApp.xctestplan`:
```json
{
  "configurations": [{
    "name": "Default",
    "options": {
      "testExecutionOrdering": "random",
      "maximumParallelTestRunners": 4,
      "userAttachmentLifetime": "deleteOnSuccess"
    }
  }],
  "defaultOptions": { "codeCoverage": true },
  "testTargets": [
    { "target": { "containerPath": "container:MyApp.xcodeproj", "identifier": "MyAppUITests", "name": "MyAppUITests" } }
  ],
  "version": 1
}
```

Run:
```bash
xcodebuild test -project MyApp.xcodeproj -scheme MyApp \
  -testPlan MyApp -destination 'platform=macOS'
```

### Mocking Rules

| Layer | Mock? | How |
|---|---|---|
| `URLSession` | YES | Inject via protocol; provide `URLProtocol`-based stub. |
| `FileManager` | YES | Wrap in `FileService` protocol. |
| Keychain | YES | Wrap in `KeychainStore` protocol. |
| `ModelContext` / SwiftData | NEVER | Use in-memory `ModelContainer` instead. Mocks drift. |
| Sparkle | YES (for unit) / NEVER (for UI test) | Compile-out with `#if !TESTING`. |
| `Date` | YES | Inject `() -> Date` clock. |

### Coverage

Target: 70% line coverage on `Models/`, 50% on `Services/`, 0% required on `Views/` (UI tests cover those).
Measure: `xcodebuild test -enableCodeCoverage YES` then `xcrun xccov view --report Build/Logs/Test/*.xcresult`.

### Visual Regression

`@MainActor func snapshot(_ view: some View) -> NSImage` helper + commit PNGs to `MyAppTests/__Snapshots__/`. Diff with `compare -metric AE` (ImageMagick).

### AI-Agent Parallelization

Safe in parallel (disjoint files):
- Scaffold a new `@Model` + scaffold its tests + scaffold its detail view (3 separate files).
- Add new menu commands in their own file.
- Localize strings.

NEVER in parallel (touches `project.pbxproj` or schema):
- Adding a new file to the Xcode project (race on `project.pbxproj`).
- Changing the SwiftData schema (must run migration + tests sequentially).
- Bumping a SPM dependency.
- Modifying `.entitlements`.

Workaround for the pbxproj race: add files via Xcode UI or via `xcodeproj` Ruby gem, **single-threaded**.

---

## 7. Logging

### Setup

`MyApp/Services/Logger+App.swift`:

```swift
import os

extension Logger {
    private static let subsystem = Bundle.main.bundleIdentifier ?? "com.example.MyApp"
    static let app       = Logger(subsystem: subsystem, category: "app")
    static let data      = Logger(subsystem: subsystem, category: "data")
    static let net       = Logger(subsystem: subsystem, category: "net")
    static let updater   = Logger(subsystem: subsystem, category: "updater")
    static let auth      = Logger(subsystem: subsystem, category: "auth")
}
```

### Levels

| Level | When |
|---|---|
| `.debug` | Verbose dev-only; stripped in release by default. |
| `.info` | App boot, user actions. |
| `.notice` | Default for "something happened." |
| `.error` | Recoverable error, surface to user. |
| `.fault` | Programmer error; should never happen. |

### Required Fields on Every Log Line

`event`, `module` (from category), `correlation_id` (uuid per user action), and one of `user_id` (if signed in) or `anon_id`.

```swift
Logger.app.info("event=item_created module=data correlation_id=\(id) user_id=\(uid, privacy: .private)")
```

`privacy: .private` is mandatory for any user PII — Apple redacts in Console for non-developer builds.

### Sample Lines

- Boot: `event=app_boot version=1.0.0 build=42 sdk=26.0`
- Net request: `event=http_out url=https://api.example.com/items method=POST`
- Net response: `event=http_in status=200 ms=143`
- Error: `event=fetch_failed code=NSURLErrorTimedOut`
- Slow op: `event=slow_query ms=2300 query=fetch_all_items`

### Where Logs Go

- **Dev:** stdout in Xcode + Console.app.
- **Prod:** Sentry-Cocoa breadcrumbs + Apple unified log (`log show --predicate 'subsystem == "com.example.MyApp"'`).

### Grep Locally

```bash
log show --predicate 'subsystem == "com.example.MyApp"' --info --last 1h
log stream --predicate 'subsystem == "com.example.MyApp"'
```

---

## 8. AI Rules

### 8.1 ALWAYS (≥20)

1. ALWAYS run `swiftlint --strict && xcodebuild build && xcodebuild test` before declaring a task done.
2. ALWAYS use `os.Logger` via the typed `Logger.app/data/net/...` extensions; never `print()` or `NSLog`.
3. ALWAYS mark new types `final class` unless inheritance is required.
4. ALWAYS use `@Observable` macro; never `ObservableObject` + `@Published`.
5. ALWAYS use `@Query` in views to read SwiftData; never `try? context.fetch(...)` from a view body.
6. ALWAYS pass the `ModelContext` via `@Environment(\.modelContext)` — never construct one in a view.
7. ALWAYS annotate UI state with `@MainActor`; mark long-running work as `actor`-isolated.
8. ALWAYS compile with `-strict-concurrency=complete` and resolve every Sendable warning.
9. ALWAYS scope file-system access to `URL.applicationSupportDirectory` (sandbox-safe).
10. ALWAYS request user file access via `NSOpenPanel`/`NSSavePanel` — sandbox forbids arbitrary paths.
11. ALWAYS pin SPM packages with exact versions in `Package.resolved`; commit it.
12. ALWAYS test against an in-memory `ModelContainer`, never the user's real store.
13. ALWAYS gate Sparkle with `#if !MAS_BUILD` so it never ships in MAS builds (Apple rejects updaters).
14. ALWAYS sign with Hardened Runtime enabled (entitlement `com.apple.security.cs.disable-library-validation` only when truly required).
15. ALWAYS run `xcrun notarytool submit --wait` AND `xcrun stapler staple` on every Developer ID build.
16. ALWAYS bump `CFBundleShortVersionString` AND `CFBundleVersion` for every release.
17. ALWAYS publish a new `appcast.xml` entry on every Developer ID release; verify SHA-256 + signature.
18. ALWAYS test the update flow against staging appcast before promoting.
19. ALWAYS use `@AppStorage("...")` for user preferences; never write to `UserDefaults.standard` directly outside Settings views.
20. ALWAYS provide a `Settings` scene; macOS users expect `Cmd-,`.
21. ALWAYS adopt the system menu bar with `.commands { CommandGroup ... }`; never custom NSMenu unless absolutely forced.
22. ALWAYS supply a 1024x1024 `AppIcon` in `Assets.xcassets` — App Store rejects without it.
23. ALWAYS set Info.plist `LSApplicationCategoryType` (e.g. `public.app-category.productivity`).
24. ALWAYS guard private API access; Apple rejects on detection (`NSStringFromClass`-style runtime probes).

### 8.2 NEVER (≥15)

1. NEVER import `UIKit` — this is macOS, not Catalyst. Use `AppKit` or pure SwiftUI.
2. NEVER use iOS-only SwiftUI APIs (`UIApplication`, `.navigationBarTitleDisplayMode`, `TabView` with `.page` style on macOS, `.fullScreenCover`).
3. NEVER use `NavigationView` — deprecated; use `NavigationSplitView` + `NavigationStack`.
4. NEVER use `ObservableObject` + `@Published` for new code — `@Observable` only.
5. NEVER call `context.fetch()` from a view body — use `@Query`.
6. NEVER mutate a `@Model` from outside the `@MainActor`.
7. NEVER use `Task { @MainActor in ... }` to escape async-let — restructure with `actor`.
8. NEVER ship `print()` / `NSLog` in release.
9. NEVER store secrets in `UserDefaults` or `.xcconfig` — use Keychain.
10. NEVER include `com.apple.security.app-sandbox` = false in the MAS build (auto-rejection).
11. NEVER include Sparkle in the MAS build target — it triggers MAS rejection.
12. NEVER bypass notarization for Developer ID release builds — Gatekeeper will block.
13. NEVER use `altool` (deprecated since November 2023) — use `notarytool`.
14. NEVER hand-edit `project.pbxproj` — use Xcode or `xcodeproj` gem.
15. NEVER use `CocoaPods` for new projects — SPM only.
16. NEVER call `DispatchQueue.main.async` in new Swift Concurrency code — use `await MainActor.run` or `@MainActor`.
17. NEVER hardcode `~/Documents` paths — use sandbox-aware `URL.documentsDirectory`.
18. NEVER catch `Error` and silently `print` it — log via `Logger.error()` and propagate.
19. NEVER write SwiftUI `View` with `body: some View` returning `AnyView` — kills compile perf.

### 8.3 Blast Radius (≥20 rows)

| Path | Blast | Verify |
|---|---|---|
| `Package.resolved` | every dependency | full SPM resolve + clean build + tests |
| `MyApp.xcodeproj/project.pbxproj` | every build | clean build + every scheme + UI tests |
| `MyAppApp.swift` | app boot, scenes | cold launch + Settings open + MenuBarExtra |
| `Models/*.swift` (any `@Model`) | persistent store schema | migration test + delete & relaunch |
| `Configs/Debug.xcconfig` | dev build only | `xcodebuild -configuration Debug build` |
| `Configs/Release.xcconfig` | release build, signing | full release archive + notarize dry-run |
| `Configs/MAS.xcconfig` | MAS build | `xcodebuild -configuration ReleaseMAS archive` |
| `Entitlements/MyApp.entitlements` | sandbox, hardened runtime | re-sign + run notarize check |
| `Entitlements/MyApp-MAS.entitlements` | MAS sandbox | TestFlight upload smoke |
| `Info.plist` | bundle identity, permissions | clean build; re-validate notarytool |
| `Assets.xcassets/AppIcon.appiconset` | App Store + DMG | archive + validate in Organizer |
| `MyApp/Services/UpdaterController.swift` | auto-update flow | run with staging appcast.xml |
| `appcast.xml` | every existing user's Sparkle update | sign with EdDSA key, verify with `sparkle-tool` |
| `MyApp/Services/DataController.swift` | every data read/write | full test suite + manual CRUD |
| `MyApp/Services/Logger+App.swift` | every log line | smoke run + Console.app filter |
| `MyApp/Resources/Localizable.xcstrings` | every locale | open Xcode, validate, run UI tests |
| `Scripts/build-dmg.sh` | release artifact | dry-run on prior build |
| `Scripts/notarize.sh` | release shipping | submit a test build to notarytool |
| `.github/workflows/release.yml` | every published release | run on a tag prefixed `vTEST-` |
| `.swiftlint.yml` | every file | `swiftlint --strict` |
| `.swift-format` | every file | `swift format lint --strict --recursive .` |
| `MyApp/Views/ContentView.swift` | root layout | cold launch on three window sizes |
| `MyApp/Views/Settings/*.swift` | Settings scene | `Cmd-,` smoke + write/read prefs |

### 8.4 Definition of Done

**Bug fix**
- [ ] Failing test added that reproduces; passes after fix.
- [ ] `xcodebuild test` green.
- [ ] `swiftlint --strict` clean.
- [ ] No new warnings.
- [ ] Manually reproduced and verified fix in running app.
- [ ] Conventional Commit message: `fix: ...`.

**New feature**
- [ ] Test plan: unit + integration + at least one UI test.
- [ ] All ALWAYS rules in §8.1 honored.
- [ ] Screenshot captured (light + dark mode).
- [ ] Doc updated in README if user-visible.
- [ ] `feat: ...` commit.

**Refactor**
- [ ] No public API change without migration note.
- [ ] All tests still green; coverage not reduced.
- [ ] No new SwiftLint violations.
- [ ] `refactor: ...` commit.

**Dependency bump**
- [ ] Bump in `Package.swift` (or via Xcode).
- [ ] Read CHANGELOG of new version.
- [ ] Full test run + cold launch + signing dry-run.
- [ ] `chore(deps): bump <X> to <Y>` commit.

**Schema change (SwiftData)**
- [ ] Lightweight migration if possible; otherwise `VersionedSchema` + `SchemaMigrationPlan`.
- [ ] Migration test: load v1 store, open with v2, verify rows.
- [ ] Manual: install old build, launch new build, ensure no data loss.

**Copy change**
- [ ] Updated in `Localizable.xcstrings` (all locales reviewed even if just English).
- [ ] Screenshot diff if visible.

### 8.5 Self-Verification Recipe

```bash
# 1. Resolve packages
xcodebuild -resolvePackageDependencies -project MyApp.xcodeproj
# Expect last line: "Package graph resolved"

# 2. Lint
swiftlint --strict
# Expect: "Done linting! Found 0 violations, 0 serious in N files."

# 3. Format check
swift format lint --strict --recursive MyApp/ MyAppTests/
# Expect: no output (silence == success)

# 4. Compile + test (Swift Testing + XCTest)
xcodebuild test -project MyApp.xcodeproj -scheme MyApp \
  -destination 'platform=macOS' -parallel-testing-enabled YES \
  -resultBundlePath build/test.xcresult | xcpretty
# Expect: "Test Suite 'All tests' passed"

# 5. Archive (release smoke)
xcodebuild archive -project MyApp.xcodeproj -scheme MyApp \
  -configuration Release -archivePath build/MyApp.xcarchive
# Expect: "** ARCHIVE SUCCEEDED **"

# 6. Notarization dry-run (no upload — just validates entitlements/signing)
codesign --verify --deep --strict --verbose=2 \
  build/MyApp.xcarchive/Products/Applications/MyApp.app
# Expect: "valid on disk" + "satisfies its Designated Requirement"
```

### 8.6 Parallelization Patterns

| Task fan-out | Safe? | Why |
|---|---|---|
| Three new view files in `Views/Detail/` | YES | Disjoint files. |
| Add three new `@Test` cases in same `*Tests.swift` | NO | Same file — race. |
| Add three test cases in three new test files | YES | Disjoint. |
| Bump 3 SPM dependencies in parallel | NO | All write `Package.resolved`. |
| Implement Sparkle wrapper + DMG script + GitHub workflow | YES | Disjoint files; docs. |
| Modify `project.pbxproj` from two agents | NO | Always serialize Xcode project edits. |
| Add a SwiftData model + run a schema migration | NO | Sequential: define model → generate migration → test. |

---

## 9. Stack-Specific Pitfalls (≥15)

1. **iOS-only API leak.** Symptom: `UIApplication is unavailable in macOS`. Cause: AI imports iOS code. Fix: replace `UIApplication.shared` → `NSApplication.shared`; `UIPasteboard` → `NSPasteboard`. Detect: compile fails at SDK boundary.
2. **`NavigationView` crash on Tahoe.** Symptom: deprecation crash on launch. Fix: switch to `NavigationSplitView` (3-col) + `NavigationStack` (detail). Detect: yellow runtime warning + console message.
3. **Sandbox hides files.** Symptom: app reads `~/Documents/foo.txt` in dev, fails in release. Cause: hardened runtime + sandbox. Fix: use `NSOpenPanel` and persist a security-scoped bookmark. Detect: `Operation not permitted` in Console.
4. **MAS rejection: Sparkle present.** Symptom: MAS submission auto-rejected. Fix: conditional compile `#if MAS_BUILD` → no Sparkle linking; separate target. Detect: rejection email in App Store Connect.
5. **MenuBarExtra cannot open Settings on Tahoe.** Symptom: `openSettings` no-ops from MenuBarExtra. Fix: Tahoe-specific workaround — open a hidden `Window`, then `NSApp.setActivationPolicy(.regular)`. Detect: nothing happens on click.
6. **SwiftData lightweight migration loses property.** Symptom: blank field after upgrade. Cause: renamed without `@Attribute(originalName:)`. Fix: keep both names or write `MigrationPlan`. Detect: integration test on real v1 store.
7. **`@Query` rebuild hammers UI.** Symptom: laggy lists. Fix: pass narrow `FetchDescriptor`; paginate. Detect: Instruments → Time Profiler.
8. **Hardened Runtime breaks JIT/Sparkle injection.** Symptom: Sparkle relaunch fails post-update. Fix: enable `com.apple.security.cs.disable-library-validation` ONLY in updater XPC. Detect: Sparkle log shows codesign error.
9. **Notarization stuck.** Symptom: `notarytool submit` hangs > 1h. Fix: stop waiting; run `notarytool history` then `notarytool log <UUID>` and read errors. As of April 2026 Apple has had multi-hour delays — script timeout 30 min, retry.
10. **`Sendable` errors after Swift 6 upgrade.** Symptom: thousands of warnings. Fix: incrementally; mark types `Sendable` or `@unchecked Sendable` only after audit. Detect: build warnings.
11. **`@Observable` + Equatable crash.** Symptom: SwiftUI infinite redraw. Cause: `@Observable` class implementing custom `==` wrong. Fix: don't implement `Equatable` on observables; rely on identity. Detect: Instruments → SwiftUI → re-render counts.
12. **Universal binary missing arm64.** Symptom: app crashes on Apple silicon. Cause: archive built `x86_64` only. Fix: `ARCHS=arm64 x86_64; ONLY_ACTIVE_ARCH=NO` in release config. Detect: `lipo -archs MyApp.app/Contents/MacOS/MyApp`.
13. **DMG fails CI signing.** Symptom: `create-dmg` produces unsigned DMG. Fix: pass `--codesign "Developer ID Application: ..."`. Detect: `spctl -a -t open --context context:primary-signature -v MyApp.dmg`.
14. **Sparkle EdDSA signature mismatch.** Symptom: users see "update could not be verified." Cause: re-generated keys. Fix: keep the SAME private key forever; rotate only with a forced manual update. Detect: Sparkle log on user machine.
15. **Asset catalog appicon at wrong size.** Symptom: App Store upload rejected. Fix: 1024x1024 PNG, no alpha. Detect: Xcode Validate Archive.
16. **Settings scene not detected.** Symptom: Cmd-, opens nothing. Cause: missing `Settings { }` scene in App body. Fix: add `Settings { SettingsView() }`. Detect: manual test.
17. **AI agent imports `Foundation` only and forgets `AppKit`.** Symptom: `NSWindow` undefined. Fix: `import AppKit`. Detect: compile fails.
18. **`Task` spawned in `View.body` leaks.** Symptom: hundreds of cancellations. Fix: use `.task { }` modifier (auto-cancels). Detect: Instruments leaks.

---

## 10. Performance Budgets

| Metric | Budget | Measure |
|---|---|---|
| Cold launch (first paint) | ≤ 500 ms on M2 | `os_signpost` start in `init()` to first `body` |
| Memory at idle | ≤ 200 MB | Xcode debug navigator |
| Memory after 1h idle | ≤ 250 MB (no growth > 10 MB/h) | Instruments → Allocations |
| CPU when idle | ≤ 1% | Activity Monitor |
| Per-frame redraw | ≤ 16 ms | Instruments → SwiftUI |
| App bundle size | ≤ 30 MB (excluding embedded frameworks) | `du -sh MyApp.app` |
| DMG size | ≤ 50 MB | `ls -lh MyApp.dmg` |
| Battery: idle drain | < 0.5%/hr on MacBook Pro | `pmset -g log` |

When budget exceeded:
- Cold launch: defer work in `Task.detached` after first paint; lazy-load heavy services.
- Memory: snapshot graph; common culprit is retained closures in `Task`.
- Bundle size: `xcrun bitcode_strip`, asset catalog optimization.

---

## 11. Security

### Secrets

- API keys → `Keychain` via `KeychainService`. Never `.xcconfig`. Never committed.
- Code-signing private keys → System keychain (Apple's tools manage).
- Sparkle EdDSA private key → 1Password / vault, NOT git.
- App Store Connect API `.p8` key → `~/.private_keys/` in `.gitignore`.

### Auth Threat Model

- App is single-user per Mac account; no server-side authn unless feature requires it.
- Sign in with Apple identity token → store in Keychain with `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.
- Server (if any): require token verification with Apple JWKS.

### Input Validation Boundary

- View → Controller: validate at controller method entry with `Validator` struct.
- Controller → Service: trust internal calls.
- Network response → typed `Decodable` + range checks.
- File import: validate UTI + size cap (50 MB default).

### Output Escaping

- SwiftUI `Text(...)` is safe by default.
- WebView (if used): `WKWebView` with `WKWebpagePreferences.allowsContentJavaScript = false` unless required.
- Pasteboard write: never put user secrets without explicit consent.

### Capabilities / Entitlements

Developer ID build (`MyApp.entitlements`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
    <key>com.apple.security.files.bookmarks.app-scope</key>
    <true/>
</dict>
</plist>
```

MAS build (`MyApp-MAS.entitlements`):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.app-sandbox</key>
    <true/>
    <key>com.apple.security.application-groups</key>
    <array>
        <string>$(TeamIdentifierPrefix)com.example.MyApp</string>
    </array>
    <key>com.apple.security.network.client</key>
    <true/>
    <key>com.apple.security.files.user-selected.read-write</key>
    <true/>
</dict>
</plist>
```

### Dependency Audit

```bash
xcrun swift package show-dependencies --format json > deps.json
# Manual review on every bump; no automated SCA tool for SPM yet — track via Dependabot on Package.resolved
```

Cadence: weekly review; immediate on CVE alert.

### Top 5 Stack Risks

1. Disabling `com.apple.security.app-sandbox` (instant MAS rejection; weakens Dev ID security posture).
2. Embedding the EdDSA Sparkle private key in the repo (every install becomes hijackable).
3. Granting `com.apple.security.cs.allow-unsigned-executable-memory` without need (TCC bypass risk).
4. Ignoring notarization staple (Gatekeeper marks app "damaged" first launch offline).
5. Hardcoding bundle identifier in code; using a different one in Info.plist (signing breaks).

---

## 12. Deploy

### Channels

| Channel | Build config | Signing | Distribution |
|---|---|---|---|
| Developer ID + DMG | `Release` | Developer ID Application + Hardened Runtime + notarized | https://yourcdn/MyApp.dmg + Sparkle appcast.xml |
| Mac App Store | `ReleaseMAS` | Apple Distribution + sandbox | App Store Connect |

### Versioning

`MARKETING_VERSION` in `Configs/Release.xcconfig` (semver `1.2.3`).
`CURRENT_PROJECT_VERSION` is monotonic build number (`42`, `43`, ...).

### Full Release Flow (Developer ID)

```bash
# 0. Bump versions
agvtool new-marketing-version 1.2.3
agvtool next-version -all
git commit -am "chore: release 1.2.3"
git tag v1.2.3 && git push --tags

# 1. Archive
xcodebuild archive -project MyApp.xcodeproj -scheme MyApp \
  -configuration Release -archivePath build/MyApp.xcarchive \
  -destination 'generic/platform=macOS'

# 2. Export signed .app
xcodebuild -exportArchive -archivePath build/MyApp.xcarchive \
  -exportPath build/Release \
  -exportOptionsPlist ExportOptions-DeveloperID.plist

# 3. Notarize
ditto -c -k --keepParent build/Release/MyApp.app build/MyApp.zip
xcrun notarytool submit build/MyApp.zip --keychain-profile "AC_NOTARY" --wait
# Expect: "status: Accepted"

# 4. Staple
xcrun stapler staple build/Release/MyApp.app

# 5. Build DMG
create-dmg \
  --volname "MyApp 1.2.3" \
  --window-size 540 380 \
  --icon "MyApp.app" 140 190 \
  --app-drop-link 400 190 \
  --codesign "Developer ID Application: Your Name (TEAMID)" \
  --notarize "AC_NOTARY" \
  build/MyApp-1.2.3.dmg \
  build/Release/

# 6. Generate appcast entry (Sparkle)
./bin/generate_appcast build/  # from Sparkle's tools
# This signs with the EdDSA private key in your keychain.

# 7. Publish
gh release create v1.2.3 build/MyApp-1.2.3.dmg
git commit appcast.xml -m "chore: appcast 1.2.3"
git push  # Pages serves appcast.xml
```

### Full Release Flow (MAS)

```bash
xcodebuild archive -project MyApp.xcodeproj -scheme "MyApp (MAS)" \
  -configuration ReleaseMAS -archivePath build/MyApp-MAS.xcarchive

xcodebuild -exportArchive -archivePath build/MyApp-MAS.xcarchive \
  -exportPath build/MAS \
  -exportOptionsPlist ExportOptions-MAS.plist

xcrun altool --upload-app -f build/MAS/MyApp.pkg -t macos \
  --apiKey "XXXXXXXXXX" --apiIssuer "..."  # NOTE: altool deprecated for notarization;
# upload-app for MAS is still supported — expect Apple to migrate this too soon.
```

### `ExportOptions-DeveloperID.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>developer-id</string>
    <key>teamID</key>
    <string>TEAMID12AB</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Developer ID Application</string>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```

### `ExportOptions-MAS.plist`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store-connect</string>
    <key>teamID</key>
    <string>TEAMID12AB</string>
    <key>signingStyle</key>
    <string>automatic</string>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```

### Rollback

- Developer ID: republish the prior DMG; revert `appcast.xml` to remove the bad entry. Users on the bad version stay on it; new installs get the prior. Max safe window: ≤ 24h from publish (assuming daily user update checks).
- MAS: "Remove from Sale" in App Store Connect, then submit `1.2.4` with the fix. No literal "rollback."

### Health Check

Post-release, monitor for 72h:
- Sentry release health page for crash-free user rate (target ≥ 99.5%).
- Sparkle's appcast download count vs prior release.
- App Store Connect → App Analytics → crashes.

### Cost Estimate per 1k MAU

- Developer ID + GitHub Pages: ~$0/mo (within free tier).
- Sentry: ~$26/mo (Team plan, 50k events).
- Apple Developer Program: $99/yr ÷ 12 = $8.25/mo.
- **Total: ~$35/mo.**
- MAS: Apple takes 15-30% of in-app revenue.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# CLAUDE.md

This project follows /opt/Loopa/rulebooks/swiftui-mac.md. READ IT BEFORE EDITING.

## Stack
- Swift 6.3, Xcode 26.4.1, macOS 26.0 deployment target
- SwiftUI + SwiftData + Swift Concurrency
- Sparkle 2.9.1 (Developer ID build only)
- Sentry-Cocoa 8.56.2

## Always
- Use `os.Logger` via `Logger.app/data/net/...`. Never `print()`.
- Use `@Observable`, `@Query`, `NavigationSplitView`. Never iOS-only APIs.
- Run `swiftlint --strict && xcodebuild test` before claiming done.
- Compile with `-strict-concurrency=complete`.

## Never
- Don't import `UIKit`. Use `AppKit` or pure SwiftUI.
- Don't use `NavigationView`, `ObservableObject`, `@Published`.
- Don't ship Sparkle in MAS builds.
- Don't bypass notarization.
- Don't hand-edit `project.pbxproj`.

## Commands
- Build: `xcodebuild -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' build`
- Test: `xcodebuild test -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS'`
- Lint: `swiftlint --strict`
- Archive: see Section 12.

## Skills
- `/test-driven-development` for any new feature.
- `/systematic-debugging` for bugs.
- `/verification-before-completion` before commits.
- `/ship` for releases.
- `/review` before merging PRs.

## Banned
- `print()`, `NSLog`, `DispatchQueue.main.async`, `NavigationView`, `ObservableObject`, `@Published`, `UIKit`, `altool`, `CocoaPods`.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(xcodebuild:*)",
      "Bash(xcrun:*)",
      "Bash(swiftlint:*)",
      "Bash(swift format:*)",
      "Bash(swift test:*)",
      "Bash(swift build:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(open MyApp.xcodeproj)",
      "Bash(create-dmg:*)",
      "Bash(codesign --verify:*)",
      "Bash(spctl:*)",
      "Bash(log show:*)",
      "Bash(log stream:*)"
    ],
    "deny": [
      "Bash(rm -rf /)",
      "Bash(security delete-keychain:*)",
      "Bash(xcrun notarytool delete:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "swift format --in-place --recursive ${CLAUDE_FILE_PATH} 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "swiftlint --quiet" }
        ]
      }
    ]
  }
}
```

### Slash Commands

- `/test-driven-development` — write the `@Test` first, then implement.
- `/systematic-debugging` — for crashes, especially Concurrency/Sendable.
- `/ship` — runs Section 12 release flow.
- `/review` — pre-merge diff review.

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# AGENTS.md

Project rulebook: /opt/Loopa/rulebooks/swiftui-mac.md.

## Stack snapshot
Swift 6.3 + SwiftUI + SwiftData + macOS 26 + Sparkle 2 + Sentry-Cocoa.

## Workflow
1. Plan with concrete file paths.
2. Use Swift Testing (`@Test`, `#expect`).
3. Run `xcodebuild test` after every code change before declaring done.
4. Check `swiftlint --strict` is clean.
5. Compile with strict concurrency.

## Always / Never
See rulebook §8.1 / §8.2.

## Build
- Build: `xcodebuild -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' build`
- Test: `xcodebuild test -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS'`

## Stack pitfalls
See rulebook §9.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-failure"
sandbox_mode = "workspace-write"

[shell_environment_policy]
inherit = "core"

[tools]
shell = true

[mcp_servers]
# none required

[project]
build_command = "xcodebuild -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' build"
test_command  = "xcodebuild test -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' -parallel-testing-enabled YES"
lint_command  = "swiftlint --strict"
```

### Codex vs Claude differences

- Codex tends to bias toward CLI and skip Xcode-only steps; force it to also open the project for archive/release.
- Codex sometimes generates iOS APIs in macOS code; the rulebook NEVER list catches this in lint passes.
- Codex doesn't natively know about EdDSA Sparkle key handling; supply the script explicitly.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```markdown
You are working in a SwiftUI macOS project. Follow /opt/Loopa/rulebooks/swiftui-mac.md.

Hard constraints:
- Swift 6.3, macOS 26 minimum, strict concurrency.
- @Observable, @Query, NavigationSplitView. Never iOS APIs (UIKit, UIApplication).
- Use os.Logger via Logger.app/data/net. Never print().
- App Sandbox + Hardened Runtime always on.
- Sparkle only in Developer ID build, never MAS.
- Run `swiftlint --strict` and `xcodebuild test` before declaring done.

When generating files:
- One type per file, named after the type.
- Final classes by default.
- Mark UI work @MainActor; long-running work in actors.
- Tests use Swift Testing (@Test, #expect), not XCTest unless UI test.

Never:
- print(), NSLog, DispatchQueue.main.async, NavigationView, ObservableObject, @Published, AnyView in body.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "swiftlang.swift-vscode",
    "vadimcn.vscode-lldb",
    "sswg.swift-lang",
    "vknabel.vscode-swiftformat",
    "ms-vscode.makefile-tools",
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
      "name": "Debug MyApp",
      "type": "lldb",
      "request": "launch",
      "program": "${workspaceFolder}/build/Debug/MyApp.app/Contents/MacOS/MyApp",
      "args": [],
      "cwd": "${workspaceFolder}",
      "preLaunchTask": "xcodebuild: Debug"
    },
    {
      "name": "Attach by PID",
      "type": "lldb",
      "request": "attach",
      "pid": "${command:pickProcess}"
    }
  ]
}
```

### `.vscode/tasks.json`

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "xcodebuild: Debug",
      "type": "shell",
      "command": "xcodebuild -project MyApp.xcodeproj -scheme MyApp -configuration Debug -destination 'platform=macOS' -derivedDataPath ./build build",
      "group": "build",
      "problemMatcher": "$swift"
    },
    {
      "label": "xcodebuild: Test",
      "type": "shell",
      "command": "xcodebuild test -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' -parallel-testing-enabled YES",
      "group": "test"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this exact order. After `git push`, the project builds, lints, tests, and exports a signed Developer ID DMG via `release.yml`.

### 1. `.gitignore`

```
# Xcode
build/
DerivedData/
*.xcuserstate
xcuserdata/
*.moved-aside
*.xcarchive

# SPM
.build/
.swiftpm/
Packages/

# Secrets
*.p8
.env
.env.local
*.entitlements.local

# OS
.DS_Store

# Sparkle
sparkle_priv.key
```

### 2. `.swiftlint.yml`

```yaml
disabled_rules:
  - trailing_whitespace
  - todo
opt_in_rules:
  - empty_count
  - explicit_init
  - first_where
  - sorted_imports
  - unused_import
  - prefer_self_in_static_references
included:
  - MyApp
  - MyAppTests
  - MyAppUITests
excluded:
  - build
  - .build
line_length:
  warning: 140
  error: 200
file_length:
  warning: 500
  error: 1000
type_body_length:
  warning: 300
  error: 500
function_body_length:
  warning: 60
  error: 120
identifier_name:
  min_length: 2
  excluded: [id, ok, x, y, z]
```

### 3. `.swift-format`

```json
{
  "version": 1,
  "lineLength": 120,
  "indentation": { "spaces": 4 },
  "respectsExistingLineBreaks": true,
  "lineBreakBeforeControlFlowKeywords": false,
  "lineBreakBeforeEachArgument": false,
  "lineBreakBeforeEachGenericRequirement": false,
  "prioritizeKeepingFunctionOutputTogether": true,
  "rules": {
    "AllPublicDeclarationsHaveDocumentation": false,
    "NoBlockComments": true,
    "OneVariableDeclarationPerLine": true,
    "UseEarlyExits": true
  }
}
```

### 4. `Configs/Debug.xcconfig`

```
SWIFT_VERSION = 6.0
SWIFT_STRICT_CONCURRENCY = complete
MACOSX_DEPLOYMENT_TARGET = 26.0
SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG
ONLY_ACTIVE_ARCH = YES
PRODUCT_BUNDLE_IDENTIFIER = com.example.MyApp
MARKETING_VERSION = 0.1.0
CURRENT_PROJECT_VERSION = 1
CODE_SIGN_STYLE = Automatic
DEVELOPMENT_TEAM = TEAMID12AB
ENABLE_HARDENED_RUNTIME = YES
CODE_SIGN_ENTITLEMENTS = MyApp/Entitlements/MyApp.entitlements
```

### 5. `Configs/Release.xcconfig`

```
#include "Debug.xcconfig"
SWIFT_OPTIMIZATION_LEVEL = -O
SWIFT_ACTIVE_COMPILATION_CONDITIONS =
ONLY_ACTIVE_ARCH = NO
ARCHS = arm64 x86_64
CODE_SIGN_IDENTITY = Developer ID Application
ENABLE_HARDENED_RUNTIME = YES
```

### 6. `Configs/MAS.xcconfig`

```
#include "Release.xcconfig"
CODE_SIGN_IDENTITY = Apple Distribution
PROVISIONING_PROFILE_SPECIFIER = MyApp MAS
SWIFT_ACTIVE_COMPILATION_CONDITIONS = MAS_BUILD
CODE_SIGN_ENTITLEMENTS = MyApp/Entitlements/MyApp-MAS.entitlements
```

### 7. `MyApp/Entitlements/MyApp.entitlements`

(Already shown in §11.)

### 8. `MyApp/Entitlements/MyApp-MAS.entitlements`

(Already shown in §11.)

### 9. `MyApp/MyAppApp.swift`

```swift
import SwiftUI
import SwiftData
import os

#if !MAS_BUILD
import Sparkle
#endif

@main
struct MyAppApp: App {
    let container: ModelContainer
    #if !MAS_BUILD
    @State private var updater = UpdaterController()
    #endif

    init() {
        do {
            container = try ModelContainer(for: Item.self)
        } catch {
            Logger.app.fault("event=container_init_failed error=\(error)")
            fatalError("Cannot init ModelContainer")
        }
        Logger.app.info("event=app_boot version=\(Bundle.main.shortVersion)")
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
        .modelContainer(container)
        .commands {
            #if !MAS_BUILD
            CommandGroup(after: .appInfo) {
                Button("Check for Updates…") { updater.controller.checkForUpdates(nil) }
            }
            #endif
        }

        Settings {
            SettingsView()
        }
    }
}

extension Bundle {
    var shortVersion: String { infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0.0" }
}
```

### 10. `MyApp/ContentView.swift`

```swift
import SwiftUI
import SwiftData

struct ContentView: View {
    @Query(sort: \Item.createdAt, order: .reverse) private var items: [Item]
    @Environment(\.modelContext) private var modelContext
    @State private var selection: Item.ID?

    var body: some View {
        NavigationSplitView {
            List(items, selection: $selection) { item in
                Text(item.title).tag(item.id)
            }
            .navigationTitle("Items")
            .toolbar {
                ToolbarItem {
                    Button(action: addItem) {
                        Label("Add", systemImage: "plus")
                    }
                }
            }
        } detail: {
            if let id = selection, let item = items.first(where: { $0.id == id }) {
                ItemDetailView(item: item)
            } else {
                ContentUnavailableView("Select an item", systemImage: "doc.text")
            }
        }
    }

    private func addItem() {
        let item = Item(title: "New Item")
        modelContext.insert(item)
    }
}
```

### 11. `MyApp/Models/Item.swift`

```swift
import Foundation
import SwiftData

@Model
final class Item {
    @Attribute(.unique) var id: UUID
    var title: String
    var createdAt: Date

    init(title: String) {
        self.id = UUID()
        self.title = title
        self.createdAt = .now
    }

    var isValid: Bool { !title.trimmingCharacters(in: .whitespaces).isEmpty }
}
```

### 12. `MyApp/Views/Detail/ItemDetailView.swift`

```swift
import SwiftUI

struct ItemDetailView: View {
    @Bindable var item: Item

    var body: some View {
        Form {
            TextField("Title", text: $item.title)
                .textFieldStyle(.roundedBorder)
            LabeledContent("Created", value: item.createdAt.formatted())
        }
        .padding()
        .navigationTitle(item.title)
    }
}
```

### 13. `MyApp/Views/Settings/SettingsView.swift`

```swift
import SwiftUI

struct SettingsView: View {
    @AppStorage("autoCheckUpdates") private var autoCheckUpdates: Bool = true

    var body: some View {
        TabView {
            Form {
                #if !MAS_BUILD
                Toggle("Automatically check for updates", isOn: $autoCheckUpdates)
                #endif
            }
            .formStyle(.grouped)
            .tabItem { Label("General", systemImage: "gearshape") }
        }
        .frame(width: 480, height: 320)
    }
}
```

### 14. `MyApp/Services/UpdaterController.swift`

```swift
#if !MAS_BUILD
import Foundation
import Sparkle

@Observable
final class UpdaterController {
    let controller: SPUStandardUpdaterController

    init() {
        controller = SPUStandardUpdaterController(
            startingUpdater: true,
            updaterDelegate: nil,
            userDriverDelegate: nil
        )
    }
}
#endif
```

### 15. `MyApp/Services/Logger+App.swift`

(Shown in §7.)

### 16. `MyApp/Resources/Info.plist` (key entries)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CFBundleDevelopmentRegion</key><string>en</string>
    <key>CFBundleExecutable</key><string>$(EXECUTABLE_NAME)</string>
    <key>CFBundleIdentifier</key><string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
    <key>CFBundleInfoDictionaryVersion</key><string>6.0</string>
    <key>CFBundleName</key><string>$(PRODUCT_NAME)</string>
    <key>CFBundlePackageType</key><string>APPL</string>
    <key>CFBundleShortVersionString</key><string>$(MARKETING_VERSION)</string>
    <key>CFBundleVersion</key><string>$(CURRENT_PROJECT_VERSION)</string>
    <key>LSMinimumSystemVersion</key><string>$(MACOSX_DEPLOYMENT_TARGET)</string>
    <key>LSApplicationCategoryType</key><string>public.app-category.productivity</string>
    <key>SUFeedURL</key><string>https://example.com/appcast.xml</string>
    <key>SUPublicEDKey</key><string>BASE64-OF-YOUR-EDDSA-PUBLIC-KEY</string>
    <key>SUEnableAutomaticChecks</key><true/>
</dict>
</plist>
```

### 17. `MyAppTests/ItemTests.swift`

```swift
import Testing
import SwiftData
@testable import MyApp

@Suite("Item")
struct ItemTests {
    @Test func emptyTitleInvalid() {
        #expect(Item(title: "").isValid == false)
    }

    @Test func nonEmptyValid() {
        #expect(Item(title: "Hello").isValid == true)
    }

    @Test func canPersistInMemory() throws {
        let config = ModelConfiguration(isStoredInMemoryOnly: true)
        let container = try ModelContainer(for: Item.self, configurations: config)
        let context = ModelContext(container)
        let item = Item(title: "Test")
        context.insert(item)
        try context.save()
        let fetched = try context.fetch(FetchDescriptor<Item>())
        #expect(fetched.count == 1)
    }
}
```

### 18. `MyAppUITests/SmokeUITests.swift`

```swift
import XCTest

final class SmokeUITests: XCTestCase {
    func test_app_launches_and_shows_sidebar() {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.windows.firstMatch.waitForExistence(timeout: 5))
        XCTAssertTrue(app.outlines.firstMatch.exists || app.tables.firstMatch.exists)
    }
}
```

### 19. `appcast.xml`

```xml
<?xml version="1.0" standalone="yes"?>
<rss version="2.0" xmlns:sparkle="http://www.andymatuschak.org/xml-namespaces/sparkle">
  <channel>
    <title>MyApp</title>
    <link>https://example.com/appcast.xml</link>
    <description>Most recent changes.</description>
    <language>en</language>
    <item>
      <title>Version 0.1.0</title>
      <pubDate>Mon, 27 Apr 2026 12:00:00 +0000</pubDate>
      <sparkle:version>1</sparkle:version>
      <sparkle:shortVersionString>0.1.0</sparkle:shortVersionString>
      <sparkle:minimumSystemVersion>26.0</sparkle:minimumSystemVersion>
      <description><![CDATA[<ul><li>Initial release.</li></ul>]]></description>
      <enclosure
        url="https://example.com/MyApp-0.1.0.dmg"
        sparkle:edSignature="REPLACE_AT_BUILD_TIME"
        length="0"
        type="application/octet-stream" />
    </item>
  </channel>
</rss>
```

### 20. `Scripts/build-dmg.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
VERSION="${1:?usage: build-dmg.sh <version>}"
ARCHIVE="build/MyApp.xcarchive"
EXPORT="build/Release"
DMG="build/MyApp-${VERSION}.dmg"

xcodebuild archive -project MyApp.xcodeproj -scheme MyApp \
  -configuration Release -archivePath "${ARCHIVE}" \
  -destination 'generic/platform=macOS'

xcodebuild -exportArchive -archivePath "${ARCHIVE}" \
  -exportPath "${EXPORT}" \
  -exportOptionsPlist ExportOptions-DeveloperID.plist

ditto -c -k --keepParent "${EXPORT}/MyApp.app" "build/MyApp.zip"
xcrun notarytool submit build/MyApp.zip --keychain-profile "AC_NOTARY" --wait
xcrun stapler staple "${EXPORT}/MyApp.app"

create-dmg \
  --volname "MyApp ${VERSION}" \
  --window-size 540 380 \
  --icon "MyApp.app" 140 190 \
  --app-drop-link 400 190 \
  --codesign "Developer ID Application" \
  "${DMG}" "${EXPORT}/"

echo "Built ${DMG}"
```

### 21. `.github/workflows/ci.yml`

```yaml
name: CI
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - name: Select Xcode 26.4.1
        run: sudo xcode-select -s /Applications/Xcode_26.4.1.app
      - name: Resolve packages
        run: xcodebuild -resolvePackageDependencies -project MyApp.xcodeproj
      - name: Lint
        run: |
          brew install swiftlint
          swiftlint --strict
      - name: Test
        run: |
          xcodebuild test \
            -project MyApp.xcodeproj -scheme MyApp \
            -destination 'platform=macOS' \
            -parallel-testing-enabled YES \
            -resultBundlePath build/test.xcresult | xcpretty
```

### 22. `.github/workflows/release.yml`

```yaml
name: Release
on:
  push:
    tags: ['v*']
jobs:
  release:
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - name: Select Xcode
        run: sudo xcode-select -s /Applications/Xcode_26.4.1.app
      - name: Import certs
        env:
          DEV_ID_P12_BASE64: ${{ secrets.DEV_ID_P12_BASE64 }}
          DEV_ID_P12_PASSWORD: ${{ secrets.DEV_ID_P12_PASSWORD }}
        run: |
          echo "$DEV_ID_P12_BASE64" | base64 --decode > cert.p12
          security create-keychain -p "" build.keychain
          security default-keychain -s build.keychain
          security unlock-keychain -p "" build.keychain
          security import cert.p12 -k build.keychain -P "$DEV_ID_P12_PASSWORD" -T /usr/bin/codesign
          security set-key-partition-list -S apple-tool:,apple:,codesign: -s -k "" build.keychain
      - name: Store notary credentials
        env:
          NOTARY_KEY_BASE64: ${{ secrets.NOTARY_KEY_BASE64 }}
          NOTARY_KEY_ID: ${{ secrets.NOTARY_KEY_ID }}
          NOTARY_ISSUER: ${{ secrets.NOTARY_ISSUER }}
        run: |
          mkdir -p ~/.private_keys
          echo "$NOTARY_KEY_BASE64" | base64 --decode > ~/.private_keys/AuthKey.p8
          xcrun notarytool store-credentials AC_NOTARY \
            --key ~/.private_keys/AuthKey.p8 \
            --key-id "$NOTARY_KEY_ID" \
            --issuer "$NOTARY_ISSUER"
      - name: Build DMG
        run: ./Scripts/build-dmg.sh "${GITHUB_REF_NAME#v}"
      - name: Generate appcast
        env:
          SPARKLE_KEY_BASE64: ${{ secrets.SPARKLE_KEY_BASE64 }}
        run: |
          echo "$SPARKLE_KEY_BASE64" | base64 --decode > sparkle_priv.key
          # Use Sparkle's generate_appcast bin (downloaded below)
          curl -L https://github.com/sparkle-project/Sparkle/releases/download/2.9.1/Sparkle-2.9.1.tar.xz | tar -xJ
          ./bin/generate_appcast --ed-key-file sparkle_priv.key build/
          rm sparkle_priv.key
      - name: Publish GitHub release
        uses: softprops/action-gh-release@v2
        with:
          files: |
            build/MyApp-*.dmg
            appcast.xml
```

### 23. `README.md`

```markdown
# MyApp

A native macOS app. SwiftUI + SwiftData + Sparkle.

## Build
1. `open MyApp.xcodeproj`
2. `Cmd-R` to run, `Cmd-U` to test.

CLI:
```bash
xcodebuild -project MyApp.xcodeproj -scheme MyApp -destination 'platform=macOS' build
```

## Release
Tag `vX.Y.Z`. GitHub Actions builds, signs, notarizes, and uploads the DMG.

## Rulebook
This project follows /opt/Loopa/rulebooks/swiftui-mac.md.
```

### 24. `LICENSE`

(MIT or your choice. Place full text here.)

After adding all files: open Xcode once, drag the source files into the project navigator, set Targets, configure schemes (`MyApp` for Developer ID, `MyApp (MAS)` for MAS using `MAS.xcconfig`), then commit.

---

## 17. Idea → MVP Path

Generic CRUD app (no `PROJECT_IDEA` provided): "Track personal notes with categories."

**Phase 1 — Schema (1 session)**
- Files: `Models/Note.swift`, `Models/Category.swift`.
- Tables: `Note { id, title, body, createdAt, category? }`, `Category { id, name, notes[] }`.
- Exit: in-memory ModelContainer test passes.

**Phase 2 — Backbone (1 session)**
- `NavigationSplitView`: sidebar = categories, content = note list, detail = editor.
- Stub `Settings` scene.
- Exit: cold launch shows three columns, can click between empty states.

**Phase 3 — Vertical slice (2 sessions)**
- Add note via toolbar; edit title + body in detail; delete with `Cmd-Delete`.
- One UI test for create/edit/delete.
- Exit: round-trip CRUD verified end-to-end with parallel test run.

**Phase 4 — Auth + multi-user (2 sessions)**
- Sign in with Apple (optional cloud sync deferred).
- Per-user store under user ID-keyed application support directory.
- Exit: signed-in identity persists across launches; signing out clears cache.

**Phase 5 — Ship + monitor (2 sessions)**
- Sentry-Cocoa wired with DSN from `.xcconfig`.
- `release.yml` produces signed DMG + MAS pkg.
- First release tagged `v0.1.0`, appcast published.
- Exit: a colleague installs the DMG and gets the next update via Sparkle.

**Total: ~8 AI sessions.**

---

## 18. Feature Recipes

### A. Sign in with Apple

Files:
1. `Services/AppleAuthService.swift`:

```swift
import AuthenticationServices

@MainActor
final class AppleAuthService: NSObject, ObservableObject {
    enum State { case idle, signedIn(userID: String), error(String) }
    @Published private(set) var state: State = .idle

    func signIn() {
        let request = ASAuthorizationAppleIDProvider().createRequest()
        request.requestedScopes = [.email, .fullName]
        let controller = ASAuthorizationController(authorizationRequests: [request])
        controller.delegate = self
        controller.presentationContextProvider = self
        controller.performRequests()
    }
}

extension AppleAuthService: ASAuthorizationControllerDelegate, ASAuthorizationControllerPresentationContextProviding {
    func presentationAnchor(for: ASAuthorizationController) -> ASPresentationAnchor {
        NSApplication.shared.windows.first ?? ASPresentationAnchor()
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithAuthorization authorization: ASAuthorization) {
        guard let cred = authorization.credential as? ASAuthorizationAppleIDCredential else { return }
        state = .signedIn(userID: cred.user)
    }

    func authorizationController(controller: ASAuthorizationController, didCompleteWithError error: Error) {
        state = .error(error.localizedDescription)
    }
}
```

2. Wire button in `SettingsView`. Add `com.apple.developer.applesignin` entitlement.

### B. File Upload (NSOpenPanel)

```swift
import AppKit
@MainActor
func pickFile() async -> URL? {
    let panel = NSOpenPanel()
    panel.allowsMultipleSelection = false
    panel.canChooseDirectories = false
    panel.allowedContentTypes = [.image]
    return await withCheckedContinuation { cont in
        panel.begin { resp in cont.resume(returning: resp == .OK ? panel.url : nil) }
    }
}
```

### C. Stripe Payments

For sandboxed Mac apps outside MAS: use a server-side Stripe webhook + a paywall window that opens Safari for `https://yoursite/checkout`. **Do not embed `WKWebView` to mask third-party purchase — Apple's MAS guidelines forbid this.** Inside MAS, use `StoreKit 2` with auto-renewable subscriptions.

```swift
import StoreKit
@MainActor
final class IAPController: ObservableObject {
    @Published var products: [Product] = []
    func load() async throws {
        products = try await Product.products(for: ["com.example.MyApp.pro"])
    }
    func purchase(_ p: Product) async throws -> StoreKit.Transaction? {
        let r = try await p.purchase()
        if case .success(let v) = r, case .verified(let tx) = v { await tx.finish(); return tx }
        return nil
    }
}
```

### D. Push Notifications (APNs)

Add capability `Push Notifications`. Request authorization with `UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])`. Register with `NSApplication.shared.registerForRemoteNotifications()`. Token handling in `AppDelegate`-bridged adapter.

### E. Background jobs

Use `BackgroundTasks` framework (`BGTaskScheduler`) — works on macOS 13+. Register identifiers in Info.plist key `BGTaskSchedulerPermittedIdentifiers`.

### F. Realtime updates (URLSession WebSocket)

```swift
let task = URLSession.shared.webSocketTask(with: URL(string: "wss://api.example.com/ws")!)
task.resume()
Task {
    for try await msg in task.messages { ... }
}
```

(`messages` is a custom AsyncSequence wrapper — implement once, reuse.)

### G. Search

`@Query(filter: #Predicate<Note> { $0.title.contains(text) })`. Tied to a `@State var text` with `.searchable($text)` modifier on the sidebar list.

### H. Localization

Xcode → File → New → File → String Catalog (`Localizable.xcstrings`). Use `Text("key")`. Add new locale via the catalog's `+` button.

### I. Dark mode

Free with SwiftUI; supply both `light` and `dark` variants in `Assets.xcassets` for any custom colors.

### J. Analytics events

Use `Sentry` breadcrumbs + a thin `Analytics.shared.log(event:)` wrapper. Avoid third-party trackers — they trigger MAS privacy disclosure burdens.

---

## 19. Troubleshooting (Top 30)

| Error (verbatim) | Fix |
|---|---|
| `error: Signing for "MyApp" requires a development team.` | Xcode → Project → Signing & Capabilities → Team. |
| `Cycle inside MyApp; building could produce unreliable results.` | `rm -rf ~/Library/Developer/Xcode/DerivedData/*`. |
| `Module 'Sparkle' was not compiled with library evolution support` | Xcode → Build Settings → "Build Libraries for Distribution" YES on Sparkle target only. |
| `'NavigationView' is deprecated` | Replace with `NavigationSplitView` + `NavigationStack`. |
| `Sending 'item' risks causing data races` | Mark `Item: Sendable` or refactor to actor isolation. |
| `Cannot find 'UIApplication' in scope` | Replace with `NSApplication`; remove `import UIKit`. |
| `notarytool: Error: HTTP status code: 401` | Re-run `xcrun notarytool store-credentials`; key may be expired. |
| `The application "MyApp" can't be opened.` (after install) | Notarization staple missing; `xcrun stapler staple MyApp.app`. |
| `App is damaged and can't be opened.` | Same as above; user downloaded an unstapled DMG. |
| `Sparkle was not signed by a recognised developer.` | EdDSA key mismatch; re-sign appcast with the original private key. |
| `Could not load module 'SwiftData' (no such module)` | Bump deployment target ≥ macOS 14. |
| `Asset Validation Errors: Invalid Bundle. The bundle does not contain a single executable.` | Check `Skip Install` is NO on app target, YES on test targets. |
| `ITMS-90189: Redundant Binary Upload` | Bump `CURRENT_PROJECT_VERSION`. |
| `ITMS-90683: Missing Purpose String in Info.plist` | Add `NSAppleEventsUsageDescription` (or whichever) per usage. |
| `swiftlint: command not found` | `brew install swiftlint`. |
| `Could not connect to development server` (SwiftUI Preview) | Editor → Refresh Canvas; or kill `com.apple.dt.previews.dispatchd`. |
| `dyld: Library not loaded: @rpath/Sparkle.framework` | Check "Embed & Sign" on Sparkle in Frameworks. |
| `Provisioning profile "..." doesn't include the currently selected device.` | For Mac App Store: ensure profile platform = macOS. |
| `Code Signing Error: Embedded binary is not signed with the same certificate as the parent app` | Re-sign embedded frameworks with the same Developer ID. |
| `Hardened runtime: cannot load executable memory` | Add `com.apple.security.cs.allow-unsigned-executable-memory` only if absolutely required. |
| `Settings shortcut Cmd-, does not open settings` | Add `Settings { ... }` scene in App body. |
| `MenuBarExtra openSettings does nothing on macOS 26` | Apply Tahoe workaround (hidden Window + activation policy). |
| `Could not find or use auto-linked library 'AppKit'` | `import AppKit` at top of file. |
| `error: Stored property 'updater' of 'Sendable'-conforming struct must be 'Sendable'` | Wrap in `@MainActor` class. |
| `xcodebuild: error: Unable to find a destination matching` | Run `xcodebuild -showdestinations -project MyApp.xcodeproj -scheme MyApp`. |
| `The data couldn't be read because it isn't in the correct format.` (SwiftData) | Schema mismatch; delete `~/Library/Containers/<bundleID>/Data/Library/Application Support/default.store`. |
| `App Sandbox: deny(1) file-write-create` | Path outside sandbox; route via `NSOpenPanel`. |
| `archive: error: Bundle has invalid embedded provisioning profile` | Re-download profile in Xcode Accounts; clean derived data. |
| `Could not launch "MyApp": process launch failed: failed to get the task for process` | Disable SIP for debugging external builds, or run via Xcode. |
| `Notarization succeeded but stapler fails: "object cannot be stapled"` | Don't try to staple a `.zip`; staple the `.app` then re-zip. |

---

## 20. Glossary

- **Apple Developer Program** — Apple's $99/yr membership for code signing.
- **App Sandbox** — macOS feature that limits what an app can read, write, and connect to.
- **App Store Connect** — web portal for managing MAS submissions and TestFlight.
- **Apple silicon** — M-series chips (M1, M2, M3, M4); ARM-based.
- **appcast** — XML feed Sparkle reads to discover updates.
- **Bundle identifier** — unique app ID in reverse-DNS form (`com.example.MyApp`).
- **Code signing** — embedding a cryptographic signature in the app for Gatekeeper verification.
- **DerivedData** — Xcode's build cache (`~/Library/Developer/Xcode/DerivedData`).
- **DMG** — disk image; the standard macOS installer format outside MAS.
- **Developer ID** — certificate type for distribution outside MAS.
- **EdDSA** — signature algorithm Sparkle uses for update verification.
- **Entitlements** — list of capabilities (sandbox, push, iCloud) baked into a signed app.
- **Gatekeeper** — macOS subsystem that checks signature/notarization before launching.
- **Hardened Runtime** — set of restrictions (anti-injection, anti-debugger) enabled at sign time.
- **Liquid Glass** — macOS Tahoe 26's translucent design language.
- **MAS** — Mac App Store.
- **MainActor** — Swift Concurrency's main-thread executor.
- **MenuBarExtra** — SwiftUI scene for menu bar status items.
- **`@Model`** — SwiftData macro that turns a class into a persistent entity.
- **`@Observable`** — Swift macro replacing `ObservableObject`; emits diffs at the property level.
- **Notarization** — Apple-run scan that approves an app for Gatekeeper.
- **`notarytool`** — CLI replacement for the deprecated `altool`.
- **Provisioning profile** — file linking a cert + entitlements + bundle ID for MAS.
- **`@Query`** — SwiftData property wrapper that auto-fetches and tracks model changes.
- **SPM** — Swift Package Manager.
- **Sparkle** — third-party auto-update framework.
- **Staple** — embedding the notarization ticket in the app so it works offline.
- **SwiftData** — Apple's ORM-like layer over CoreData (Swift-native).
- **SwiftUI** — Apple's declarative UI framework.
- **`xcconfig`** — text-based Xcode build settings file.
- **xcframework** — multi-platform binary library format.
- **xcodebuild** — Xcode's CLI build tool.
- **xcrun** — wrapper that finds Xcode's bundled tools.

---

## 21. Update Cadence

- This rulebook is valid for Xcode 26.4.x, Swift 6.3.x, macOS 26.x, Sparkle 2.9.x.
- Re-run the generator when:
  - Xcode major bumps (27.0).
  - Swift major bumps (7.0).
  - Sparkle major bumps (3.0).
  - Apple changes notarization or MAS submission tooling.
  - Apple deprecates `altool` for MAS uploads (expected late 2026).
  - Security advisory on any pinned version.
- Date stamp: 2026-04-27.

## Known Gaps

- Sparkle 3.x roadmap unverified at time of writing; pin to 2.9.1 only.
- Swift 6.4 announced 2026-03-18 but not stable; defer until released.
- Apple's `notarytool` still uses keychain profile flow as of April 2026; if Apple migrates to API-key-only, update §12.
- macOS Tahoe 26's MenuBarExtra/Settings interaction has known unresolved issues; the workaround in §9.5 is current best practice but may regress.
