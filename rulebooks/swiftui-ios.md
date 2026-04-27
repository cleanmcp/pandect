# SwiftUI iOS Rulebook

Native iPhone/iPad app on SwiftUI + iOS 26 + SwiftData. Zero-to-TestFlight in one file.

> **Note on versions:** The spec said "iOS 18" but Apple unified its OS version numbers in 2025; the current SDK as of 2026-04-27 is **iOS 26.4 / Xcode 26.4.1 / Swift 6.3**. This rulebook targets the live stack. SwiftData and SwiftUI patterns originally introduced in iOS 17/18 still apply; iOS 26 adds class inheritance and Approachable Concurrency on top.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Swift 6.3 | Bundled with Xcode 26.4.1; full strict concurrency. |
| Runtime + version | iOS 17.0 minimum, iOS 26 target | Covers ~95% of active devices; @Observable needs 17+. |
| Package manager | Swift Package Manager (built-in) | Apple-native; no third-party dependency manager needed. |
| Build tool | xcodebuild (Xcode 26.4.1) | Apple-supported; signs and uploads from CLI. |
| Project structure | XcodeGen 2.42.0 | YAML config beats merge-conflict-prone .pbxproj. |
| State mgmt | `@Observable` + `@State` + `@Bindable` | Built-in iOS 17+; replaces ObservableObject entirely. |
| Routing/Nav | `NavigationStack` + typed `Route` enum | iOS 16+ standard; deep-link friendly. |
| Data layer | SwiftData (iOS 26 generation) | Apple-native; no ORM bridge needed. |
| Auth | Sign in with Apple + Keychain (`keychain-swift` 24.0.0) | Required by App Store for social-login apps. |
| Styling | Pure SwiftUI modifiers + design-token enum | No third-party UI lib; design tokens prevent drift. |
| Forms + validation | `Form` + computed-property validators | Built-in; no library needed for a CRUD app. |
| Unit test runner | Swift Testing 6.3 (`@Test` macro) | Apple-recommended; XCTest only for UI tests. |
| E2E framework | XCUITest (XCTest UI) | Native; runs in Xcode Cloud and on simulators. |
| Mocking strategy | Protocol-backed adapters + in-memory `ModelContainer` | Never mock SwiftData itself; mock at adapter boundary. |
| Logger | `swift-log` 1.10.1 → `OSLog` backend | Apple Console + SwiftLog API; no lock-in. |
| Error tracking | `sentry-cocoa` 8.x with `SentrySwiftUI` | Free tier; SwiftUI view instrumentation supported. |
| Lint | SwiftLint 0.64.0 | De-facto standard; runs as SPM build plugin. |
| Format | swift-format 602.0.0 (bundled with toolchain) | Apple-official; no Homebrew install needed. |
| Type checking | swiftc (built-in) + `-strict-concurrency=complete` | Catches Sendable violations at build time. |
| Env vars + secrets | `.xcconfig` files + Keychain at runtime | Plain text never leaves dev machine. |
| CI provider | GitHub Actions (macos-15 runner) | Free for public repos; Xcode 26 preinstalled. |
| Deploy target | TestFlight → App Store | Required path for iOS distribution. |
| Release flow | `fastlane` 2.230+ `match` + `pilot` | Industry standard; handles certs and TestFlight upload. |
| Auto-update | App Store auto-update | Apple-managed; no in-app updater allowed. |
| Concurrency model | Swift 6 strict (`-strict-concurrency=complete`) | Blocks data-race bugs at compile time. |
| Asset catalog | One `.xcassets` with semantic color set | Light/dark/accessibility variants in one place. |
| Dependency injection | Constructor injection + `Environment` for cross-cutting | No DI framework needed for app-sized code. |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Xcode | 26.4.1 | 2026-04-16 | https://developer.apple.com/documentation/xcode-release-notes/xcode-26-release-notes |
| iOS SDK | 26.4 | 2026-04-16 | https://developer.apple.com/news/releases/ |
| Swift | 6.3 | 2026-03 (with Xcode 26.4) | https://www.swift.org/blog/announcing-swift-6/ |
| Swift Testing | 6.3 (bundled) | 2026-03 | https://developer.apple.com/xcode/swift-testing/ |
| swift-format | 602.0.0 (bundled) | 2026-02 | https://github.com/swiftlang/swift-format |
| SwiftLint | 0.64.0 | 2026-02-22 | https://github.com/realm/SwiftLint/releases |
| swift-log | 1.10.1 | 2026-03-24 | https://github.com/apple/swift-log/releases |
| sentry-cocoa | 8.40.x | 2026-03 | https://github.com/getsentry/sentry-cocoa |
| keychain-swift | 24.0.0 | 2025-09 | https://github.com/evgenyneu/keychain-swift |
| XcodeGen | 2.42.0 | 2025-11 | https://github.com/yonaskolb/XcodeGen |
| fastlane | 2.230.0 | 2026-04 | https://docs.fastlane.tools/ |

### Minimum Host Requirements

| OS | Verdict | Detail |
|---|---|---|
| macOS | **Required for local builds.** | macOS 15.6 (Sequoia) or macOS 26 (Tahoe). 16 GB RAM. 100 GB free disk (Xcode + simulators ~75 GB). Apple Silicon (M1+) strongly preferred; Intel works but cold-build is 3× slower. |
| Windows | **Cannot build locally.** | Use a cloud Mac (MacinCloud, MacStadium, AWS EC2 Mac). Develop code in VS Code/Cursor on Windows; SSH/VNC into the Mac for build/test/deploy. Plan ~$30/month for hourly cloud Mac access or ~$80/month dedicated. |
| Linux | **Cannot build locally.** | Same as Windows. Swift toolchain is available on Linux but the iOS SDK is not — Xcode is macOS-only, no exceptions. Cloud Mac is the only path. |

### Cold-Start Estimate (`git clone` → app on simulator)

| Machine | Time |
|---|---|
| M2 Mac, Xcode preinstalled | 4 minutes |
| Fresh M-series Mac, Xcode not installed | 90 minutes (35 GB Xcode download dominates) |
| MacinCloud M4 instance, Xcode preinstalled | 6 minutes |

---

## 2. Zero-to-Running (Setup)

### macOS

#### Prerequisites — every command verbatim

```bash
# 1. Install Homebrew (skip if `brew --version` already prints)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install developer tools
brew install xcodegen swiftlint mint git gh
brew install --cask fastlane

# 3. Install Xcode 26.4.1 — DO NOT install from the Mac App Store (too slow, frequently corrupt).
# Download .xip from https://developer.apple.com/download/all/?q=xcode%2026 (Apple Developer login required)
# Then:
xattr -dr com.apple.quarantine ~/Downloads/Xcode_26.4.1.xip
xip -x ~/Downloads/Xcode_26.4.1.xip
sudo mv Xcode.app /Applications/Xcode.app
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch

# 4. Install iOS 26 simulator runtime (only iOS 18 ships with Xcode by default in some images)
xcodebuild -downloadPlatform iOS

# 5. Verify
xcodebuild -version
# Expected: Xcode 26.4.1 / Build version 17F12

swift --version
# Expected: swift-driver version: 1.x  Apple Swift version 6.3 ...
```

#### Required accounts

| Account | URL | Why |
|---|---|---|
| Apple ID | https://appleid.apple.com | Sign in to Xcode for free 7-day device builds. |
| Apple Developer Program | https://developer.apple.com/programs/ ($99/yr) | Required to ship to TestFlight or App Store. |
| App Store Connect (auto-created with above) | https://appstoreconnect.apple.com | Builds, TestFlight, App Store metadata. |
| GitHub | https://github.com | CI + code hosting. |
| Sentry | https://sentry.io | Crash reporting (free tier 5k events/mo). |

#### CLI auth

```bash
gh auth login                      # → choose GitHub.com, HTTPS, web browser
fastlane match init                # → choose git, paste your private match repo URL
xcrun notarytool store-credentials # → only needed if shipping outside App Store (rare for iOS)
```

Sign into Xcode itself: open **Xcode → Settings → Accounts → +** and paste your Apple ID. This creates the dev signing identity used for simulator builds.

#### Bootstrap

```bash
gh repo create my-app --private --clone
cd my-app

# Drop the canonical scaffold (see Section 16) into the repo root. Then:
xcodegen generate                  # produces MyApp.xcodeproj from project.yml
open MyApp.xcodeproj
# In Xcode: Product → Run (⌘R). Simulator boots; "Hello, World!" appears.
```

#### Expected first-run output

```
Build succeeded
   Linking MyApp
   Code Signing /Users/you/Library/Developer/Xcode/DerivedData/.../MyApp.app
   Touch  ... .app
** BUILD SUCCEEDED **
```

Simulator window shows the app's root view. Console shows:

```
[com.myapp.MyApp] [main] App boot completed in 0.42s
```

#### Common first-run errors

| Error | Fix |
|---|---|
| `error: Multiple commands produce 'Info.plist'` | Delete `Info.plist` from build phases; XcodeGen owns it via `project.yml`. Re-run `xcodegen generate`. |
| `error: No such module 'SwiftData'` | Deployment target is below 17. In `project.yml`, set `deploymentTarget: { iOS: "17.0" }` and re-generate. |
| `error: Could not find or use auto-linked library 'swiftCompatibility...'` | Xcode/iOS SDK mismatch. Run `sudo xcode-select -s /Applications/Xcode.app/Contents/Developer`. |
| `Code Signing Error: No profiles for ... were found` | In Xcode, target → Signing & Capabilities → tick "Automatically manage signing", select your team. |
| `Simulator timed out waiting for boot` | `xcrun simctl shutdown all && xcrun simctl erase all`. Restart simulator. |
| `Command PhaseScriptExecution failed: SwiftLint not installed` | `brew install swiftlint`. Re-build. |
| `error: 'package' product not found` | `swift package resolve` from the repo root. Then in Xcode: File → Packages → Reset Package Caches. |
| `Sandbox: rsync.samba ... deny(1) file-write-create` | Xcode 26 sandbox bug. Settings → Locations → Custom Paths → Derived Data: relative `Build/`. |

### Windows

iOS apps require a macOS host with Xcode; this is an Apple platform restriction with no workaround.

The only sanctioned path:

1. Sign up for **MacinCloud Managed Server** (https://www.macincloud.com/pages/managed.html) — ~$30/mo hourly or ~$80/mo dedicated. Apple Silicon M4 instances ship with Xcode 26 preinstalled.
2. RDP/VNC into the cloud Mac.
3. Run the macOS instructions above inside that session.
4. Locally on Windows: install **VS Code** + the Cursor or Claude Code CLI for editing. SSH-mount the cloud Mac's repo (`code --remote ssh-remote+macincloud.example.com /Users/you/my-app`) so you edit on Windows but build on the Mac.
5. Run a single command from VS Code's terminal: `ssh macincloud "cd ~/my-app && xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' test"`.

Alternative cloud Mac options:
- **MacStadium** (https://www.macstadium.com) — $79+/mo dedicated.
- **AWS EC2 Mac** (`mac2.metal`) — ~$1.10/hr, 24-hour minimum.

### Linux

Same situation as Windows. Linux can run the Swift toolchain (`swift build`) but cannot run the iOS SDK or Xcode. Use a cloud Mac per the Windows section. Linux developers commonly use:

- **VS Code Remote-SSH** to edit on the cloud Mac.
- `tmux` + `ssh` for terminal builds.
- **Tart** (https://tart.run) on a personal M-series Mac is faster, but that requires owning a Mac.

---

## 3. Project Layout

```
my-app/
├── project.yml                    # XcodeGen source of truth — all targets/configs
├── Package.swift                  # SPM dependencies
├── .swiftlint.yml                 # SwiftLint rules
├── .swift-format                  # swift-format config
├── .gitignore
├── .github/
│   └── workflows/
│       └── ci.yml                 # Test on every PR; deploy to TestFlight on tag
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules
├── .claude/
│   └── settings.json
├── CLAUDE.md
├── AGENTS.md
├── README.md
├── fastlane/
│   ├── Appfile
│   ├── Fastfile
│   └── Matchfile
├── Sources/
│   ├── App/
│   │   └── MyAppApp.swift          # @main entry — App protocol, ModelContainer setup
│   ├── Features/                   # One folder per user-facing feature
│   │   ├── ItemList/
│   │   │   ├── ItemListView.swift
│   │   │   ├── ItemListViewModel.swift
│   │   │   └── ItemRowView.swift
│   │   └── Settings/
│   │       └── SettingsView.swift
│   ├── Models/                     # @Model types — SwiftData entities
│   │   └── Item.swift
│   ├── Services/                   # Protocol-backed adapters: network, keychain, analytics
│   │   ├── KeychainService.swift
│   │   ├── APIClient.swift
│   │   └── Logger.swift
│   ├── Navigation/
│   │   └── Route.swift             # Typed enum for NavigationStack paths
│   ├── DesignSystem/
│   │   ├── Tokens.swift            # Colors, spacing, typography enums
│   │   └── Components/             # Reusable SwiftUI views
│   └── Resources/
│       ├── Assets.xcassets
│       ├── Localizable.xcstrings   # iOS 17+ string catalog
│       └── Info.plist
├── Tests/
│   ├── UnitTests/                  # Swift Testing — @Test functions
│   │   ├── ItemListViewModelTests.swift
│   │   └── APIClientTests.swift
│   └── UITests/                    # XCUITest — XCTestCase subclasses
│       └── MyAppUITests.swift
└── Config/
    ├── Debug.xcconfig
    ├── Release.xcconfig
    └── Shared.xcconfig
```

### Naming conventions

| Artifact | Convention | Example |
|---|---|---|
| File | UpperCamelCase, one type per file | `ItemListView.swift` |
| SwiftUI view | `<Noun>View` | `ItemRowView` |
| View model (`@Observable`) | `<Feature>ViewModel` | `ItemListViewModel` |
| SwiftData model | Singular noun, `@Model` class | `Item`, not `Items` |
| Service/adapter protocol | `<Noun>Service` | `KeychainService` |
| Service implementation | `Default<Service>` or `Live<Service>` | `DefaultKeychainService` |
| Test file | `<Subject>Tests.swift` | `ItemListViewModelTests.swift` |
| `@Test` function | `lowerCamelCase`, statement of behavior | `addsItemWhenSaveTapped()` |
| Route case | `lowerCamelCase` noun | `case itemDetail(Item.ID)` |
| Design token | UpperCamelCase enum case | `Spacing.medium` |
| Asset color set | `lowerCamelCase` semantic | `accent`, `surfacePrimary` |

### "If you're adding X, it goes in Y"

| Adding | Goes in | Notes |
|---|---|---|
| New screen | `Sources/Features/<FeatureName>/<FeatureName>View.swift` | One folder per feature. |
| State for that screen | Same folder, `<FeatureName>ViewModel.swift` | `@Observable final class`. |
| New SwiftData entity | `Sources/Models/<Entity>.swift` | Add to schema in `MyAppApp.swift`. |
| Network call | `Sources/Services/APIClient.swift` (extend) | Never `URLSession.shared.dataTask` directly in a view. |
| New navigation destination | `Sources/Navigation/Route.swift` (add case) | Then `.navigationDestination(for: Route.self)`. |
| New environment value | `Sources/Services/<Service>+Environment.swift` | `EnvironmentValues` extension. |
| Reusable component | `Sources/DesignSystem/Components/<Name>.swift` | Must accept tokens, not raw values. |
| New color | `Resources/Assets.xcassets` color set + `Tokens.swift` case | Light + dark + high-contrast variants. |
| Localized string | `Resources/Localizable.xcstrings` (Xcode UI) | Use `String(localized:)` in code. |
| Unit test | `Tests/UnitTests/<Subject>Tests.swift` | One `@Suite` per type under test. |
| UI test | `Tests/UITests/<Flow>UITests.swift` | XCUITest, accessibility-id selectors. |
| Background task | `Sources/Services/Background/<Task>Task.swift` | Register in Info.plist `BGTaskSchedulerPermittedIdentifiers`. |
| Push notif handler | `Sources/Services/PushService.swift` | Single source of truth. |
| Feature flag | `Sources/Services/FeatureFlags.swift` | Plain enum + UserDefaults backing. |
| Config secret | `Config/Debug.xcconfig` (not committed) + `Info.plist` substitution | Read at runtime via `Bundle.main`. |
| Custom modifier | `Sources/DesignSystem/Modifiers/<Name>Modifier.swift` | One `ViewModifier` per file. |

---

## 4. Architecture

### Process / module boundaries

```
┌──────────────────────────────────────────────────────────────────┐
│                         iOS App Process                          │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  SwiftUI Views (@MainActor)                              │    │
│  │   └─ binds to → @Observable ViewModel (@MainActor)       │    │
│  └─────────────────────────┬────────────────────────────────┘    │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  Services (protocol-backed, async)                       │    │
│  │   ├─ APIClient (URLSession)                              │    │
│  │   ├─ KeychainService                                     │    │
│  │   └─ Logger (swift-log → OSLog)                          │    │
│  └─────────────────────────┬────────────────────────────────┘    │
│                            ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  SwiftData ModelContainer  (@MainActor by default;       │    │
│  │                             pass into a ModelActor for   │    │
│  │                             background work)             │    │
│  │   └─ on-disk SQLite at .applicationSupport/default.store │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
              │ HTTPS                       │ APNS push
              ▼                             ▼
        Your backend                  Apple Push Notif
```

### Data flow for "user taps Save"

```
View (Button.action)
   │
   ▼
ViewModel.save()         ── @MainActor
   │  await api.create(item)
   ▼
APIClient.create(item)   ── nonisolated, returns over network
   │  on success
   ▼
ViewModel: modelContext.insert(item); try modelContext.save()
   │
   ▼
SwiftData persists; @Query in another View auto-refreshes.
```

### Auth flow (Sign in with Apple)

```
User taps "Sign in with Apple"
   │
   ▼
SignInWithAppleButton  ──▶ ASAuthorizationController
   │                              │ system sheet
   │                              ▼
   │                       Apple ID server
   │                              │ identity token
   ▼                              ▼
AuthService.handle(authorization)
   │ POST /auth/apple { idToken }
   ▼
Backend exchanges → returns app session token
   │
   ▼
KeychainService.set("session", token)
   │
   ▼
@Observable AuthStore.isAuthenticated = true
   │
   ▼
RootView shows authenticated branch.
```

### State flow

```
@Observable ViewModel  ◀──reads──  SwiftUI View (@State or @Bindable)
        │
        │ mutates self.<property>
        ▼
Observation system marks tracked properties dirty
        │
        ▼
SwiftUI re-evaluates ONLY views that read those properties
```

No Combine, no `@Published`, no `objectWillChange.send()`. The Observation framework handles change tracking.

### Entry-point file map

| File | Responsibility |
|---|---|
| `MyAppApp.swift` | `@main` struct conforming to `App`. Builds the `ModelContainer`, injects environment values, picks the root view. |
| `RootView.swift` | Branches on auth state → `LoginView` or `MainTabView`. |
| `Route.swift` | The single typed enum every `NavigationStack` uses. |
| `APIClient.swift` | The only place that touches `URLSession`. |
| `Logger+Bootstrap.swift` | Calls `LoggingSystem.bootstrap` exactly once on launch. |

### Where business logic lives

**Lives in:** `@Observable` view models and `Services/`.
**Does NOT live in:** SwiftUI `View.body`, SwiftData `@Model` classes (model classes hold data and validation only — no networking, no logging, no UI), `App.init`, `EnvironmentValues` extensions.

---

## 5. Dev Workflow

### Start dev "server" (build + run on simulator)

```bash
xcodegen generate                  # Regenerate project after touching project.yml
open MyApp.xcodeproj               # Or: cursor . / code .
# In Xcode: ⌘R → builds, installs on simulator, attaches debugger.
```

Watchers running while you work in Xcode:
- **swift-build** rebuilds changed files on save.
- **Previews** re-renders the active SwiftUI preview on every keystroke (toggleable via canvas).
- **SwiftLint** runs as a build-phase script — warnings appear inline in the issue navigator.

### Hot reload behavior

SwiftUI has two reload modes:
1. **Previews** (`#Preview { … }`) — Xcode rebuilds the body of the previewed view on edit. Breaks when the file under preview imports a non-previewable type (pulls in the whole module).
2. **Full app** — every code change requires `⌘R` (~6 s incremental, ~45 s clean). There is no "hot module reload" for running iOS apps; **InjectionIII** (third-party) approximates it for views, but it is not in this rulebook's stack — when you change UI, restart.

### Attach debugger

| Editor | Steps |
|---|---|
| Xcode | F6 (step over), F7 (step in). LLDB console is at the bottom. `po self.viewModel.items` works. |
| VS Code / Cursor | Install the **CodeLLDB** + **Swift** (sswg.swift-lang) extensions. Use `.vscode/launch.json` (Section 15). Set breakpoints in the gutter; F5 starts in simulator. |
| Cloud Mac | Use Xcode in the VNC session — VS Code on the local box can't attach to a remote simulator. |

### Inspect runtime state

| What | How |
|---|---|
| Network | Xcode → Debug Navigator → Network. Or `Charles Proxy` with the simulator's HTTP proxy set. |
| SwiftData store | DB Browser for SQLite on `~/Library/Developer/CoreSimulator/Devices/<UDID>/data/Containers/Data/Application/<APPID>/Library/Application Support/default.store`. |
| Logs | `Console.app` (macOS) → filter by your `subsystem`. Or `log stream --predicate 'subsystem == "com.myapp.MyApp"'`. |
| View hierarchy | Xcode → Debug → View Debugging → Capture View Hierarchy. |
| Memory | Xcode → Debug Navigator → Memory. Long-running over 200 MB on iPhone is suspect. |

### Pre-commit checks (`scripts/pre-commit.sh`, wired via Husky-equivalent below)

```bash
#!/usr/bin/env bash
set -euo pipefail
swift format lint --strict --recursive Sources Tests
swiftlint --strict
xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16' \
  -configuration Debug build-for-testing -quiet
```

Wire it via the standard git hook (no Husky on iOS):

```bash
ln -s ../../scripts/pre-commit.sh .git/hooks/pre-commit
chmod +x scripts/pre-commit.sh
```

### Branch + commit conventions

- Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. One topic per branch.
- Commits: imperative, ≤72 char subject, optional body. Conventional Commits not required.
- One PR = one feature. Squash-merge to `main`. Tag releases `v1.2.3`.

---

## 6. Testing & Parallelization

### Unit tests — Swift Testing

Location: `Tests/UnitTests/`. File names end in `Tests.swift`.

Run all unit tests:

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:MyAppTests
```

Run a single test:

```bash
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -only-testing:MyAppTests/ItemListViewModelTests/addsItemWhenSaveTapped
```

Watch mode: Xcode's test navigator → click the diamond. There is no `--watch` flag on `xcodebuild`; use `fswatch` if you need it from the CLI:

```bash
fswatch -o Sources Tests | xargs -n1 -I{} xcodebuild test -scheme MyApp ...
```

Sample test:

```swift
import Testing
@testable import MyApp

@Suite("ItemListViewModel")
struct ItemListViewModelTests {
    @Test func addsItemWhenSaveTapped() async throws {
        let container = try ModelContainer(
            for: Item.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let context = ModelContext(container)
        let sut = ItemListViewModel(context: context)
        sut.draftTitle = "Buy milk"
        await sut.save()
        #expect(sut.items.count == 1)
        #expect(sut.items.first?.title == "Buy milk")
    }
}
```

### Integration tests

Same runner. Convention: filename ends `IntegrationTests.swift`. They hit a real (in-memory) `ModelContainer` and a stubbed `APIClient`.

### E2E — XCUITest

Location: `Tests/UITests/`. They run on a booted simulator.

Parallel by default — Xcode 26 spawns one simulator per test class:

```bash
xcodebuild test \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -parallel-testing-enabled YES \
  -parallel-testing-worker-count 4 \
  -only-testing:MyAppUITests
```

In `project.yml`, scheme test config:

```yaml
schemes:
  MyApp:
    test:
      parallelizable: true
      randomExecutionOrdering: true
      targets:
        - MyAppTests
        - MyAppUITests
```

Sample UI test:

```swift
import XCTest

final class AddItemUITests: XCTestCase {
    func testUserCanAddItem() throws {
        let app = XCUIApplication()
        app.launch()
        app.buttons["addItemButton"].tap()
        app.textFields["titleField"].typeText("Buy milk")
        app.buttons["saveButton"].tap()
        XCTAssertTrue(app.staticTexts["Buy milk"].waitForExistence(timeout: 2))
    }
}
```

Use accessibility identifiers, not labels: labels change with localization.

### Mocking rules

| Thing | Mock? | How |
|---|---|---|
| `URLSession` / network | **Yes** at the `APIClient` protocol boundary. | Inject a `MockAPIClient` conforming to the protocol. |
| `KeychainService` | Yes — protocol with in-memory backing in tests. | |
| SwiftData (`ModelContainer`) | **No.** Use a real in-memory container per `ModelConfiguration(isStoredInMemoryOnly: true)`. | Mocking SwiftData hides query bugs. |
| `Date.now`, UUID | Yes — wrap in a `Clock` / `IDGenerator` protocol. | |
| File system | Use `FileManager.default.temporaryDirectory` per test; do not mock. | |
| `Notification.Name`, NSE | Real — they are deterministic. | |
| Sentry | Disable in tests via `SentrySDK.start { $0.dsn = "" }`. | |

### Coverage

Target: **70% line coverage** on `Sources/` excluding `Sources/App/` (entry-point glue) and `Sources/DesignSystem/` (visual-only).

Measure:

```bash
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -enableCodeCoverage YES \
  -resultBundlePath ./TestResults.xcresult
xcrun xccov view --report --json TestResults.xcresult \
  | jq '.targets[] | select(.name=="MyApp") | .lineCoverage'
```

CI fails the build if the figure dips below 0.70.

### Visual regression

Out of scope for this rulebook (XCTest snapshot testing requires `swift-snapshot-testing` 1.18+; add only when the design begins to stabilize). Until then, manual visual review on every PR.

### Parallelization patterns for AI agents

| Safe to fan out (parallel subagents) | Not safe — must be sequential |
|---|---|
| Scaffold a new feature folder + matching test file + matching route case (three disjoint files). | Anything touching `project.yml`, `Package.swift`, or `Package.resolved`. |
| Fill in N independent `@Test` cases in the same suite once the suite skeleton exists. | Anything inserting into `Assets.xcassets` (single XML index). |
| Write three view structs that don't import each other. | Adding a SwiftData `@Model` (changes schema → migration cascade). |
| Generate dark-mode + accessibility variants of an existing color set. | Bumping iOS deployment target (touches every config). |
| Translate strings into `Localizable.xcstrings` in batches per locale. | Adding a new SPM dependency (mutates `Package.resolved`). |

Rule: if the task touches a file ending in `.yml`, `.swift` listed in `Package.swift`, `Package.resolved`, `Info.plist`, or `Assets.xcassets/Contents.json`, run it sequentially.

---

## 7. Logging

### Setup

`Sources/Services/Logger+Bootstrap.swift`:

```swift
import Logging
import os

enum AppLogger {
    static func bootstrap() {
        LoggingSystem.bootstrap { label in
            OSLogHandler(label: label, subsystem: "com.myapp.MyApp", category: label)
        }
    }
    static let app = Logger(label: "app")
    static let net = Logger(label: "net")
    static let db  = Logger(label: "db")
    static let ui  = Logger(label: "ui")
}

import os.log
struct OSLogHandler: LogHandler {
    let label: String
    let subsystem: String
    let category: String
    private let osLog: OSLog
    init(label: String, subsystem: String, category: String) {
        self.label = label; self.subsystem = subsystem; self.category = category
        self.osLog = OSLog(subsystem: subsystem, category: category)
    }
    var metadata: Logger.Metadata = [:]
    var logLevel: Logger.Level = .info
    subscript(metadataKey key: String) -> Logger.Metadata.Value? {
        get { metadata[key] } set { metadata[key] = newValue }
    }
    func log(level: Logger.Level, message: Logger.Message,
             metadata: Logger.Metadata?, source: String,
             file: String, function: String, line: UInt) {
        let merged = self.metadata.merging(metadata ?? [:]) { _, new in new }
        let meta = merged.map { "\($0)=\($1)" }.joined(separator: " ")
        os_log("%{public}@ %{public}@", log: osLog, type: level.toOSLogType,
               "\(message)", meta)
    }
}

private extension Logger.Level {
    var toOSLogType: OSLogType {
        switch self {
        case .trace, .debug: return .debug
        case .info, .notice: return .info
        case .warning:       return .default
        case .error:         return .error
        case .critical:      return .fault
        }
    }
}
```

In `MyAppApp.swift`:

```swift
@main
struct MyAppApp: App {
    init() { AppLogger.bootstrap() }
    var body: some Scene { WindowGroup { RootView() } }
}
```

### Log levels

| Level | Use for |
|---|---|
| `.trace` | Verbose flow inside a single function. Off by default. |
| `.debug` | Dev-only diagnostics. Stripped in Release via `#if DEBUG`. |
| `.info` | App boot, user action completed, request in/out. |
| `.notice` | Notable but expected (e.g., cache miss). |
| `.warning` | Recoverable failure; degraded mode. |
| `.error` | Failed operation visible to user. Forward to Sentry. |
| `.critical` | Crash imminent / data loss risk. Forward to Sentry as fatal. |

### Required fields on every log line

`event` (string verb), `module` (label = "app"|"net"|"db"|"ui"), `request_id` (UUID, when applicable), `user_id` (when authenticated), `duration_ms` (for timed ops). Set via `Logger.Metadata`:

```swift
var log = AppLogger.net
log[metadataKey: "request_id"] = "\(requestID)"
log[metadataKey: "user_id"] = "\(userID)"
log.info("request_out", metadata: ["url": "\(url)", "method": "GET"])
```

### Sample log lines

```
app boot:    [com.myapp.MyApp] [app] event=boot duration_ms=420
request in:  [com.myapp.MyApp] [net] event=request_in url=https://api/items method=GET request_id=A1
request out: [com.myapp.MyApp] [net] event=request_out url=https://api/items status=200 duration_ms=180 request_id=A1
error:       [com.myapp.MyApp] [net] event=request_failed url=https://api/items error=timeout request_id=A2
slow op:     [com.myapp.MyApp] [db] event=slow_query duration_ms=620 query=fetchAllItems
user action: [com.myapp.MyApp] [ui] event=tap_save user_id=u_123 screen=ItemList
```

### Where logs go

- **Dev:** stdout in Xcode console + Console.app (filter `subsystem:com.myapp.MyApp`).
- **Prod:** OSLog → forwarded to Sentry breadcrumbs automatically by `sentry-cocoa`. Errors and `.critical` go to Sentry events. No third-party log SaaS.

### Grep logs locally

```bash
log show --predicate 'subsystem == "com.myapp.MyApp"' --last 30m
log stream --predicate 'subsystem == "com.myapp.MyApp" && category == "net"'
```

---

## 8. AI Rules

### 8.1 ALWAYS (≥20)

1. Always run the self-verification recipe in §8.5 before claiming any task done.
2. Always declare new view models as `@Observable final class`, never as `class: ObservableObject`.
3. Always pair `@Observable` with `@State` (for owned VMs) or `@Bindable` (for two-way binding to a passed-in VM). Never `@StateObject` / `@ObservedObject`.
4. Always thread `ModelContainer` through the environment via `.modelContainer(_:)` on the root scene; never construct one inside a view.
5. Always insert a `@Model` instance into a `ModelContext` before mutating relationships on it.
6. Always wrap UI-mutating code with `@MainActor`. Add the annotation explicitly even when the inferred type would be main-actor-isolated.
7. Always pass `PersistentIdentifier` (not the `@Model` object itself) when crossing actor boundaries; refetch on the destination actor.
8. Always use `NavigationStack` + a typed `Route` enum + `.navigationDestination(for: Route.self)`. Never use `NavigationView` (deprecated).
9. Always read environment values via `@Environment(\.modelContext)` etc.; never reach into `UIApplication.shared.windows`.
10. Always use `.task { … }` for view-tied async work, never `.onAppear { Task { … } }` (the former cancels on disappear).
11. Always add accessibility identifiers (`.accessibilityIdentifier("…")`) to every interactive control that a UI test will tap.
12. Always use `String(localized: "…")` for user-facing copy and add it to `Localizable.xcstrings`. Never hard-code a literal in `Text(_:)`.
13. Always read secrets from Keychain at runtime; never embed them in source or `Info.plist`.
14. Always lint with `swiftlint --strict` and format with `swift format` before committing.
15. Always update `project.yml` (not the `.xcodeproj` directly) and run `xcodegen generate` before opening Xcode.
16. Always pin SPM dependencies via `Package.resolved` and commit the file.
17. Always run a Release build (`xcodebuild -configuration Release`) before tagging a release; warnings differ from Debug.
18. Always test new SwiftData schema changes with a `MigrationPlan` even if the change "looks additive".
19. Always wrap network calls in a typed throwing function returning `Result<T, APIError>` or `try await T`; never propagate raw `URLError`s into views.
20. Always inject `Date`, UUID generation, and clocks via a small protocol so tests are deterministic.
21. Always add a `@Test` for any pure function before declaring a feature done.
22. Always check the `iOS 17.0` minimum in any `if #available` branch — Sentry SDK and `@Observable` need it.
23. Always log a `request_id` on every outbound network call and propagate it through the response handler.

### 8.2 NEVER (≥15)

1. Never call `URLSession.shared.dataTask` from a SwiftUI view.
2. Never share a `ModelContext` across actors. Spawn a new one inside each `@ModelActor`.
3. Never store `@Model` instances in a `Sendable` struct or pass them across `Task { }` boundaries — they are not `Sendable`.
4. Never use Combine (`@Published`, `ObservableObject`, `PassthroughSubject`) in new code. The Observation framework replaces it.
5. Never use force-unwraps (`!`) outside test code. Use `guard let`, `??`, or `try` instead.
6. Never disable Swift 6 strict concurrency to silence a Sendable warning. Fix the warning.
7. Never put business logic in `View.body`. Move it to a method on the view model.
8. Never call `try? modelContext.save()` and ignore the error — log it at minimum.
9. Never embed an API key, OAuth secret, or signing certificate in the repo. CI gets them from GitHub Actions secrets.
10. Never modify `*.pbxproj` by hand — XcodeGen rebuilds it.
11. Never use `@AppStorage` for anything sensitive. It's UserDefaults in plaintext.
12. Never call `DispatchQueue.main.async`. Use `await MainActor.run { … }` or annotate the function `@MainActor`.
13. Never present a sheet/alert by mutating an `@State` from a `Task` without going through `@MainActor`.
14. Never bypass the Keychain wrapper — go through `KeychainService`.
15. Never silence a SwiftLint rule with `// swiftlint:disable` without a TODO citing why.
16. Never call `NavigationLink(destination:)` with an inline view; use `NavigationLink(value:)` with the typed route enum.
17. Never load images from a remote URL with `Image(systemName:)` — use `AsyncImage` and provide a placeholder.
18. Never write to disk on the main actor. Move file IO into a non-isolated function or actor.
19. Never run UI tests against a real backend. Stub the network layer via launch arguments + `MockAPIClient`.
20. Never omit `accessibilityLabel` on a tappable image-only button — VoiceOver will read it as "button, button".

### 8.3 Blast Radius Reference (≥20 rows)

| Path | Blast | Verify |
|---|---|---|
| `project.yml` | Every target, every config | `xcodegen generate` && `xcodebuild -scheme MyApp build` |
| `Package.swift` | All Swift modules | `swift package resolve` && full build |
| `Package.resolved` | Lockfile for all deps | Re-run unit + UI test suites |
| `Sources/App/MyAppApp.swift` | App boot path | Cold-launch on simulator + smoke UI test |
| `Sources/Models/*.swift` | SwiftData schema | `MigrationPlan` test + full UI suite |
| `Sources/Navigation/Route.swift` | Every navigation call | Smoke each top-level tab manually + UI tests |
| `Sources/Services/APIClient.swift` | All network calls | All integration tests + manual login flow |
| `Sources/Services/KeychainService.swift` | Auth state | Manual logout/login round-trip |
| `Sources/Services/Logger+Bootstrap.swift` | Every log line | Console.app sees expected fields |
| `Sources/DesignSystem/Tokens.swift` | Every styled view | Visual sweep light + dark + Dynamic Type XXL |
| `Resources/Assets.xcassets` | Every visual | Snapshot or manual visual sweep |
| `Resources/Info.plist` | Permissions, capabilities | Cold-launch + each capability path |
| `Resources/Localizable.xcstrings` | Every user-facing string | Smoke run in pseudo-locale |
| `Config/Debug.xcconfig` | Debug builds only | Debug build + run on simulator |
| `Config/Release.xcconfig` | Release + TestFlight | Archive + TestFlight install |
| `Config/Shared.xcconfig` | All configs | Both Debug and Release archives |
| `.swiftlint.yml` | Lint output | `swiftlint --strict` clean |
| `.swift-format` | Formatter output | `swift format lint --strict --recursive` clean |
| `fastlane/Fastfile` | TestFlight pipeline | `fastlane beta --dry-run` |
| `fastlane/Matchfile` | Cert/profile sync | `fastlane match development --readonly` |
| `.github/workflows/ci.yml` | Every PR build | Push to a throwaway branch and watch the run. |
| `Tests/UITests/**` | Coverage of user flows | Full UI suite green on iPhone 16 sim |
| `Tests/UnitTests/**` | Logic regression | Full unit suite green |
| `.cursor/rules` | Cursor agent behavior | Re-prompt a known task and check rule firing |
| `CLAUDE.md` | Claude agent behavior | Same as above with `claude` CLI |

### 8.4 Definition of Done

#### Bug fix

- [ ] Failing `@Test` reproducing the bug, written first.
- [ ] Fix makes that test green.
- [ ] Self-verification recipe (§8.5) passes.
- [ ] Console shows the expected log line for the now-correct branch.
- [ ] Manual screenshot or screen recording attached to the PR.
- [ ] No new SwiftLint warnings.
- [ ] Do NOT add unrelated cleanup.

#### New feature

- [ ] Route case added to `Route.swift`.
- [ ] View, ViewModel, and at least one `@Test` exist.
- [ ] Accessibility identifiers on interactive elements.
- [ ] At least one XCUITest covering the happy path.
- [ ] Localized strings in `Localizable.xcstrings`.
- [ ] Light + dark mode visually verified on simulator.
- [ ] Self-verification recipe passes.
- [ ] PR description includes a 5-second screen recording.
- [ ] Do NOT add a new SPM dependency unless the rulebook explicitly allows it.

#### Refactor

- [ ] Behavior unchanged: full unit + UI suites pass with no test changes.
- [ ] If tests changed, the diff is explained in the PR description.
- [ ] No public API change unless intentional.
- [ ] Self-verification recipe passes.

#### Dependency bump

- [ ] `Package.swift` and `Package.resolved` both updated and committed.
- [ ] Read the dependency's CHANGELOG for the version range bumped.
- [ ] Self-verification recipe passes.
- [ ] Cold-build works (`rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*` then build).
- [ ] Do NOT bump multiple dependencies in one PR.

#### Schema change (`@Model` add/remove/edit)

- [ ] `MigrationPlan` written and tested with seeded fixture data.
- [ ] All `@Query`s that referenced the changed type still compile.
- [ ] Manual test: install previous build → install new build → data preserved.
- [ ] Self-verification recipe passes.
- [ ] Do NOT delete a column without a migration step.

#### Copy change

- [ ] Edit `Localizable.xcstrings` only — no source code changes for English-only edits.
- [ ] Pseudo-locale check: `xcodebuild ... -testLanguage en-XA` shows expanded text fits.
- [ ] No new accessibility-id changes (would break UI tests).

### 8.5 Self-Verification Recipe

Run, in order. Each must succeed before moving to the next.

```bash
# 1. Resolve packages
swift package resolve
# Expected last line: "Computing version for ..." then no errors.

# 2. Lint
swiftlint --strict
# Expected: "Done linting! Found 0 violations, 0 serious in N files."

# 3. Format check
swift format lint --strict --recursive Sources Tests
# Expected: no output (silence = success), exit code 0.

# 4. Build
xcodebuild -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -configuration Debug build -quiet
# Expected last line: "** BUILD SUCCEEDED **"

# 5. Unit tests
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -only-testing:MyAppTests -quiet
# Expected: "Test Suite 'All tests' passed"

# 6. UI smoke (one critical flow)
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -only-testing:MyAppUITests/SmokeUITests -quiet
# Expected: "Test Suite 'SmokeUITests' passed"

# 7. Release archive smoke (skip on every commit; required before tagging)
xcodebuild archive -scheme MyApp \
  -destination 'generic/platform=iOS' \
  -archivePath /tmp/MyApp.xcarchive -quiet
# Expected last line: "** ARCHIVE SUCCEEDED **"
```

If any step fails, stop. Diagnose, fix, restart at step 1.

### 8.6 Parallelization Patterns

Safe fan-out (one subagent per branch):

- **Three independent feature folders**: subagent A scaffolds `Features/Profile/`, B scaffolds `Features/Settings/`, C scaffolds `Features/Search/`. Each owns disjoint files; no shared mutation.
- **N tests in an existing suite**: once the suite scaffold exists, fan out one subagent per `@Test` function.
- **Localization batches**: one subagent per locale, each only touches its own strings file.

Must be sequential:

- Anything mutating `project.yml`, `Package.swift`, `Package.resolved`, `Info.plist`, `Assets.xcassets/Contents.json`, or `Sources/Models/*.swift`. These files have a single ownership point and merge conflicts rebuild every consuming target.

Pattern: declare the lockfile-touching change first (sequentially), then fan out the consuming work.

---

## 9. Stack-Specific Pitfalls (≥15)

1. **Agent uses `ObservableObject` + `@Published`.** Symptom: extra view re-renders, or VM init runs once and never again on view swap. Cause: agent training data favors pre-iOS-17 patterns. Fix: rewrite as `@Observable final class`; pair with `@State` (owner) or `@Bindable` (passed-in). Detect: grep `ObservableObject\|@Published\|@StateObject` should return zero matches in `Sources/`.
2. **Agent leaks `@Bindable` into a `Task`.** Symptom: `Sending 'self.viewModel' risks causing data races`. Cause: `@Bindable` wraps a non-Sendable reference. Fix: capture only the data you need (`let title = viewModel.title; Task { … }`). Detect: Swift 6 strict-concurrency warning at compile time.
3. **Agent constructs `ModelContainer` inside a view.** Symptom: query results blink/duplicate; data sometimes vanishes after navigation. Cause: each view-init creates a new SQLite store. Fix: build the container once in `MyAppApp.init` and pass via `.modelContainer(_:)`. Detect: search for `ModelContainer(` and assert there's exactly one call in `Sources/App/`.
4. **Agent passes a `@Model` instance across `Task` actors.** Symptom: rare crash "_PersistentModel was passed across actors". Cause: SwiftData models are not Sendable. Fix: pass `model.persistentModelID` and refetch via `context.model(for:)`. Detect: Swift 6 strict-concurrency error.
5. **Agent uses `NavigationView`.** Symptom: deprecation warning; weird back-button behavior on iPad. Cause: replaced in iOS 16. Fix: use `NavigationStack` with a typed `Route` enum. Detect: `grep -r "NavigationView" Sources/` is zero.
6. **Agent forgets `@MainActor` on view-mutating code.** Symptom: `Sendable` warning, or visual glitch where state updates "stick" one frame late. Fix: annotate the function or call site `@MainActor`. Detect: Swift 6 strict-concurrency warning.
7. **Agent calls `objectWillChange.send()`.** Symptom: doesn't compile under `@Observable`. Fix: delete the call; `@Observable` tracks mutations automatically. Detect: compile error.
8. **Agent presents a sheet via `Bool` flag and races state.** Symptom: sheet shows old data after a re-tap. Fix: use `.sheet(item: $selectedItem)` with an `Identifiable` payload. Detect: code review — flag `.sheet(isPresented:)` paired with mutable shared state.
9. **Agent uses `@AppStorage` for an auth token.** Symptom: token visible in plaintext via UserDefaults dump. Fix: store in Keychain via `KeychainService`. Detect: grep `@AppStorage.*token` should be zero.
10. **Agent hard-codes a string literal in `Text(_:)`.** Symptom: not localized; pseudo-locale test fails. Fix: `Text(String(localized: "key"))` and add to `Localizable.xcstrings`. Detect: lint rule `unused_literal`.
11. **Agent spins up a SwiftUI Preview that crashes the canvas.** Symptom: "Cannot preview in this file" with a generic error. Cause: preview pulls in a non-previewable type (e.g., direct `URLSession`). Fix: inject a stub `APIClient` with `.environment(\.apiClient, .mock)`. Detect: `#Preview` failing to render in Xcode.
12. **Agent leaves a `@State` ref-type initializer that fires every body.** Symptom: VM resets on every parent re-render. Cause: `@State var vm = HeavyVM()` re-evaluates the initializer every redraw. Fix: lazy storage via `@State private var vm: HeavyVM?` + a setup `.task`, or use `init(initialValue:)`. Detect: log VM init count in dev; unexpected jumps mean reset.
13. **Agent uses `try? modelContext.save()`.** Symptom: silent data loss when the save fails (constraint violation, disk full). Fix: `do { try modelContext.save() } catch { logger.error("save_failed", metadata: ["error": "\(error)"]) }`. Detect: lint pattern `try?\s*\w+\.save\(\)`.
14. **Agent puts `.task` work that must outlive the view inside `.onAppear`.** Symptom: long upload cancels when user navigates back. Fix: move the work into a `Service` that owns its own `Task`. Detect: code review — any `.onAppear { Task { /* slow */ } }` is suspect.
15. **Agent ships a Debug-only `print()` that floods Console in Release.** Symptom: prod log noise, performance hit. Fix: replace with `AppLogger.app.debug(...)`. Detect: SwiftLint rule `print` enabled.
16. **Agent forgets to add the new `@Model` type to the schema array.** Symptom: runtime crash "Unable to find PersistentModel for class ...". Fix: add the type to `ModelContainer(for: Item.self, NewModel.self, …)`. Detect: cold-launch smoke test crashes immediately.
17. **Agent uses `String(format:)` for displayed numbers.** Symptom: incorrect grouping/decimal in non-US locales. Fix: `value.formatted()` (Swift's built-in) or `.formatted(.currency(code: "USD"))`. Detect: pseudo-locale test.
18. **Agent omits `accessibilityIdentifier` and UI tests select by visible text.** Symptom: tests pass on the dev machine, fail on CI when running in pseudo-locale. Fix: add IDs everywhere. Detect: a CI matrix run with `-testLanguage en-XA`.

---

## 10. Performance Budgets

| Budget | Target | Measure |
|---|---|---|
| Cold launch (boot to first interactive frame) | ≤ 1.5 s on iPhone 12 | Xcode Organizer → Metrics → Launch Time. |
| App size (App Thinning, install) | ≤ 60 MB initial install | Xcode Organizer → Reports → IPA size after thinning. |
| Memory (steady state in main flow) | ≤ 150 MB | Xcode Debug Navigator → Memory. |
| Frame rate during scroll | ≥ 58 fps | Xcode → Debug → Slow Animations off + Instruments → Animation Hitches. |
| Network round-trip per user action | ≤ 1 request synchronously | Network instrument; log assertion. |
| SwiftData query | ≤ 50 ms p99 | Log `duration_ms` on every `fetch`; alert on outliers. |
| Battery drain | ≤ 5% per hour active use | Xcode Organizer → Energy. |
| CPU during idle | ≤ 1% | Instruments → CPU Profiler. |

If a budget fails: capture an Instruments trace (`Time Profiler` for CPU, `Allocations` for memory), attach to PR, fix before merge. Do not ship a PR that regresses any budget.

---

## 11. Security

### Secret storage

- **Source code:** never. Repos are forever.
- **`.xcconfig`:** non-secret build flags only (e.g., `BUNDLE_ID = com.myapp.MyApp`).
- **`Info.plist`:** only what Apple requires (e.g., `NSCameraUsageDescription`).
- **Keychain:** auth tokens, refresh tokens, OAuth client secrets used at runtime.
- **CI (GitHub Actions secrets):** signing cert P12, App Store Connect API key, Sentry auth token.

### Auth threat model

- Sign in with Apple is the only supported login method.
- The app receives an Apple `idToken`, POSTs it to your backend, gets back a session JWT, stores it in Keychain.
- Read access scoped to `userId` on every backend route. App must never assume the device user matches the Keychain user — re-validate at boot.
- Logout clears Keychain, the in-memory `AuthStore`, and calls `modelContext.delete(_:)` on user-owned models.

### Input validation

- View models validate before saving. SwiftData models hold an `init` that throws on invalid arguments.
- All network response decoding goes through `JSONDecoder` with `keyDecodingStrategy = .convertFromSnakeCase` and a typed `Decodable` struct. No `[String: Any]` shapes.
- URL queries built via `URLComponents.queryItems`, never string concatenation.

### Output escaping

- SwiftUI `Text` does not interpret HTML — safe by default.
- If displaying server-rendered HTML (rare), use `AttributedString(markdown:)` on a strict allowlist.
- Never inject untrusted content into a `WKWebView` `loadHTMLString`.

### Capabilities (`Info.plist`)

Only request what the feature requires. Boilerplate keys for a CRUD app:

```xml
<key>NSCameraUsageDescription</key><string>Add a photo to a list item.</string>
<key>NSPhotoLibraryUsageDescription</key><string>Pick a photo for a list item.</string>
<key>UIApplicationSceneManifest</key><dict>...</dict>
<key>UILaunchScreen</key><dict/>
```

Do not request location, contacts, microphone, motion, or HealthKit unless the feature exists.

### Dependency audit

```bash
# Run weekly on a cron in CI.
swift package show-dependencies --format json > deps.json
# Compare against a committed allowlist.
diff <(jq -S . deps.json) <(jq -S . scripts/allowed-deps.json)
```

For CVE scanning, use **GitHub Dependabot** — enable in repo settings; it scans `Package.resolved` automatically.

### Top 5 stack-specific risks

1. **Storing tokens in `@AppStorage`/UserDefaults.** Anyone with file-system access (jailbroken or backup) reads them. Always Keychain.
2. **Sign in with Apple `idToken` reuse.** Backend must verify `aud`, `iss`, and signature, and treat each `nonce` as one-shot.
3. **`URLSession` with `pinnedCertificates`-disabled defaults.** Add `URLSessionDelegate` for cert pinning if the app talks to a single backend domain.
4. **Background-task capability misuse.** Registering for `BGProcessingTask` and not actually using it gets the app rejected.
5. **App Transport Security exception.** Adding `NSAllowsArbitraryLoads` to ship faster ships an insecure app. Fix the backend to use TLS 1.2+ instead.

---

## 12. Deploy

### Full release flow

```bash
# 1. Bump version in project.yml settings: MARKETING_VERSION and CURRENT_PROJECT_VERSION
xcodegen generate

# 2. Tag
git tag v1.2.3
git push origin v1.2.3

# 3. CI takes over via .github/workflows/ci.yml on the tag. Locally if doing it by hand:
fastlane match appstore --readonly        # pulls cert + provisioning profile
fastlane beta                              # builds, signs, uploads to TestFlight
```

`fastlane/Fastfile`:

```ruby
default_platform(:ios)

platform :ios do
  desc "Push a new beta build to TestFlight"
  lane :beta do
    setup_ci if ENV['CI']
    match(type: "appstore", readonly: true)
    increment_build_number(xcodeproj: "MyApp.xcodeproj")
    build_app(
      scheme: "MyApp",
      export_method: "app-store",
      export_options: {
        provisioningProfiles: { "com.myapp.MyApp" => "match AppStore com.myapp.MyApp" }
      }
    )
    upload_to_testflight(
      apple_id: ENV['ASC_APP_ID'],
      skip_waiting_for_build_processing: true
    )
  end
end
```

> **Xcode 26 footgun:** `altool` selects the wrong app when the team has multiple. Pass `apple_id:` explicitly. (Tracked at https://github.com/fastlane/fastlane/issues/29698.)

### Staging vs prod separation

Two App Store Connect apps:
- `com.myapp.MyApp.staging` — points at staging API, internal testers only.
- `com.myapp.MyApp` — production.

Switch is via the `BUNDLE_ID` and `API_BASE_URL` build settings in `Config/Debug.xcconfig` vs `Config/Release.xcconfig`.

### Rollback

TestFlight: builds cannot be deleted, but you can expire them so testers stop seeing the build. From App Store Connect → TestFlight → Build → Expire.

App Store: there is no rollback. The remediation is "ship a hotfix faster than the bad build propagates." Apple's expedited review (request from App Store Connect) typically clears in 4–12 hours.

Max safe rollback window: until the bad build hits >5% of users (the auto-update curve is ~20% in 24h, ~80% in 7 days). Hotfix beats rollback.

### Health check

Smoke command:

```bash
xcrun simctl install booted /tmp/MyApp.xcarchive/Products/Applications/MyApp.app
xcrun simctl launch booted com.myapp.MyApp
sleep 3
xcrun simctl list | grep -q "com.myapp.MyApp.*Booted" && echo "OK"
```

Production: Sentry "Health" dashboard — crash-free sessions ≥ 99.5%.

### Versioning scheme

`MARKETING_VERSION = MAJOR.MINOR.PATCH` (semver). `CURRENT_PROJECT_VERSION = monotonically increasing integer` (auto-incremented by fastlane on every TestFlight upload). Both live in `project.yml` under `targets.MyApp.settings`.

### Auto-update / store submission

1. CI uploads a build to TestFlight (above).
2. Wait for Apple's processing (5–15 min). Sentry or App Store Connect emails when ready.
3. App Store Connect → My Apps → MyApp → TestFlight → Internal Testing → add the build to the internal group.
4. Test on internal group (you and ≤100 emails). Smoke the install + login + one CRUD flow.
5. App Store → Distribution → "+ New Version" → fill metadata (title, screenshots, what's new, age rating, content rights, privacy questionnaire).
6. Submit for review. Median review time in 2026 is ~24 hours.
7. After approval, set "Manual Release" → release when ready.

Auto-update for installed users is Apple-managed via the App Store. There is no in-app forced-update mechanism allowed.

### DNS / domain

N/A for the app itself. Backend domains belong in your backend's rulebook.

### Cost estimate per 1k MAU

- Apple Developer Program: $99/yr flat.
- Sentry free tier handles ~5k events/mo; ~$26/mo at 50k events.
- Backend hosting: see your backend rulebook.
- TestFlight: free.
- **App distribution itself: $0 per user** — Apple takes its cut on in-app payments only.

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# CLAUDE.md — MyApp (SwiftUI iOS)

This project follows `rulebooks/swiftui-ios.md`. Read it before any task.

## Stack
- Xcode 26.4.1, Swift 6.3, iOS 17 minimum / iOS 26 target.
- SwiftData. SwiftUI only (no UIKit unless wrapped via `UIViewRepresentable`).
- Swift Testing for unit, XCUITest for UI.

## Daily commands
- Generate project: `xcodegen generate`
- Build: `xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' build`
- Test: `xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4'`
- Lint: `swiftlint --strict`
- Format: `swift format -i -r Sources Tests`
- Self-verify: `./scripts/verify.sh` (runs all of the above in order)

## Banned patterns
- `ObservableObject`, `@Published`, `@StateObject`, `@ObservedObject` — use `@Observable` + `@State`/`@Bindable`.
- `NavigationView` — use `NavigationStack`.
- `URLSession.shared.dataTask` from a view — go through `Sources/Services/APIClient.swift`.
- `try?` on a `modelContext.save()` — log the error.
- Hard-coded user-facing strings — use `Localizable.xcstrings` + `String(localized:)`.
- Force unwraps in production code.
- DispatchQueue.main.async — use `await MainActor.run` or `@MainActor`.
- `@AppStorage` for secrets — use Keychain.

## Always
- Run the self-verification recipe before declaring done (rulebook §8.5).
- Add accessibility identifiers to interactive controls.
- Pair every new feature with at least one `@Test`.
- Update `project.yml` (not `.pbxproj`) and re-run `xcodegen generate`.
- Use a typed `Route` enum for navigation.

## Skills to invoke
- `/test-driven-development` — before any feature work.
- `/systematic-debugging` — for any reported bug.
- `/verification-before-completion` — final gate before claiming done.
- `/ship` — to merge and deploy.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(xcodegen *)",
      "Bash(xcodebuild *)",
      "Bash(xcrun *)",
      "Bash(swift *)",
      "Bash(swiftlint *)",
      "Bash(swift format *)",
      "Bash(swift package *)",
      "Bash(fastlane *)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push*)",
      "Bash(git pull*)",
      "Bash(git checkout *)",
      "Bash(git branch *)",
      "Bash(gh pr *)",
      "Bash(gh repo *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(rg *)",
      "Bash(grep *)",
      "Bash(find *)",
      "Bash(./scripts/*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if [[ \"$CLAUDE_FILE_PATH\" == *.swift ]]; then swift format -i \"$CLAUDE_FILE_PATH\"; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "swiftlint --quiet --strict --reporter github-actions-logging || true"
          }
        ]
      }
    ]
  }
}
```

### Recommended skills + when to use them

| Skill | When |
|---|---|
| `/test-driven-development` | Any new feature or bug fix. Write the failing `@Test` first. |
| `/systematic-debugging` | Any "it crashes" or "it doesn't update" report. |
| `/verification-before-completion` | Final step before saying "done". Runs §8.5. |
| `/ship` | After PR is approved. Bumps version, tags, pushes. |
| `/codex` | Second-opinion adversarial review on any non-trivial change. |

### Slash commands

- `/verify` → runs `./scripts/verify.sh`.
- `/sim` → boots `iPhone 16` simulator if not already booted.
- `/regen` → `xcodegen generate && open MyApp.xcodeproj`.

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# AGENTS.md — MyApp

You are a coding agent on a SwiftUI + iOS 26 + SwiftData project. The full rulebook is at `rulebooks/swiftui-ios.md`. Read it before acting.

## Hard constraints
- Swift 6.3, strict concurrency on, iOS 17.0 deployment target.
- State: `@Observable` + `@State` / `@Bindable` only. No `ObservableObject`.
- Nav: `NavigationStack` with `Route` enum.
- Data: SwiftData. One `ModelContainer` built in `MyAppApp`. Pass `PersistentIdentifier` across actors, never `@Model` instances.
- Tests: Swift Testing for unit; XCUITest for UI.

## Verification before saying done
Run `./scripts/verify.sh`. Do not claim completion otherwise.

## Banned
See "Banned patterns" in `CLAUDE.md`.

## Approval-required actions
- Adding an SPM dependency (mutates `Package.swift` / `Package.resolved`).
- Bumping the iOS deployment target.
- Editing `project.yml`.
- Editing anything under `fastlane/`.
- Editing `.github/workflows/`.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-failure"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = true

[shell_environment]
inherit = "all"

[mcp_servers]
# none required for this stack
```

### Codex differences from Claude

| Area | Claude Code | Codex | Compensation |
|---|---|---|---|
| Sandbox | Permissive by default | Workspace-write only | Codex can run `xcodebuild` and `xcrun simctl` directly inside the workspace; cloud-Mac SSH wrappers may need explicit allow. |
| Hooks | `.claude/settings.json` | No equivalent | Run formatter and linter from `scripts/verify.sh` instead of post-edit hook. |
| Skills | First-class slash commands | Custom prompts | Keep verification recipes as plain shell scripts in `scripts/`. |
| MCP | Standardized | Available | Optional — add a Sentry MCP server if you want crash-context retrieval. |

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# MyApp — SwiftUI + iOS 26 + SwiftData

## Stack
- Swift 6.3, Xcode 26.4.1, iOS 17.0 minimum, iOS 26.4 target.
- SwiftUI + SwiftData. No UIKit unless wrapped via UIViewRepresentable.

## Always
- Use @Observable final class for view models.
- Use @State for owned VMs, @Bindable for passed-in VMs.
- Use NavigationStack with a typed Route enum.
- Run swiftlint --strict and swift format lint before declaring done.
- Pair every new feature with at least one @Test (Swift Testing).
- Add .accessibilityIdentifier to every interactive control.
- Use String(localized:) and Localizable.xcstrings for all user-facing copy.
- Read secrets from Keychain at runtime; never embed in source.
- Edit project.yml (not .pbxproj) and run `xcodegen generate`.

## Never
- Use ObservableObject, @Published, @StateObject, @ObservedObject.
- Use NavigationView (deprecated since iOS 16).
- Call URLSession.shared.dataTask from a SwiftUI view — use APIClient.
- Force-unwrap (!) outside test code.
- Pass @Model instances across Task/actor boundaries — use PersistentIdentifier.
- Share a ModelContext across actors.
- Use `try?` to swallow `modelContext.save()` errors.
- Hard-code a string in Text(_:).
- Use @AppStorage for tokens/secrets.
- Modify *.pbxproj by hand.
- Disable Swift 6 strict concurrency to silence a warning.
- Add an SPM dependency without explicit user approval.

## Verification
Before any "done" claim, run:
  ./scripts/verify.sh
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "sswg.swift-lang",
    "vknabel.vscode-apple-swift-format",
    "vknabel.vscode-swiftlint",
    "vadimcn.vscode-lldb",
    "GitHub.vscode-pull-request-github"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run on iPhone 16 Simulator",
      "type": "lldb",
      "request": "launch",
      "preLaunchTask": "xcode: build",
      "program": "${workspaceFolder}/build/Debug-iphonesimulator/MyApp.app/MyApp",
      "args": [],
      "cwd": "${workspaceFolder}",
      "env": {},
      "stopOnEntry": false,
      "initCommands": [
        "platform select ios-simulator"
      ]
    },
    {
      "name": "Test (unit)",
      "type": "lldb",
      "request": "launch",
      "preLaunchTask": "xcode: test"
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
      "label": "xcode: build",
      "type": "shell",
      "command": "xcodebuild -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' -configuration Debug build",
      "group": "build"
    },
    {
      "label": "xcode: test",
      "type": "shell",
      "command": "xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4'",
      "group": "test"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create these files in this order on a brand-new repo. After the last one, `git push` plus running `xcodegen generate` produces an installable hello-world.

### `.gitignore`

```
*.xcodeproj
*.xcworkspace
DerivedData/
build/
.build/
.swiftpm/
xcuserdata/
*.xcuserstate
.DS_Store
fastlane/report.xml
fastlane/Preview.html
fastlane/screenshots
fastlane/test_output
*.ipa
*.dSYM.zip
*.dSYM
.env
.env.*
!.env.example
TestResults.xcresult
```

### `project.yml`

```yaml
name: MyApp
options:
  deploymentTarget:
    iOS: "17.0"
  developmentLanguage: en
  bundleIdPrefix: com.myapp
  groupSortPosition: top
  generateEmptyDirectories: true
configs:
  Debug: debug
  Release: release
settings:
  base:
    SWIFT_VERSION: "6.0"
    SWIFT_STRICT_CONCURRENCY: complete
    ENABLE_USER_SCRIPT_SANDBOXING: NO
    DEVELOPMENT_TEAM: "" # set in Xcode > Signing & Capabilities
  configs:
    Debug:
      SWIFT_OPTIMIZATION_LEVEL: "-Onone"
      SWIFT_ACTIVE_COMPILATION_CONDITIONS: DEBUG
    Release:
      SWIFT_OPTIMIZATION_LEVEL: "-O"
packages:
  swift-log:
    url: https://github.com/apple/swift-log
    from: 1.10.1
  sentry-cocoa:
    url: https://github.com/getsentry/sentry-cocoa
    from: 8.40.0
  keychain-swift:
    url: https://github.com/evgenyneu/keychain-swift
    from: 24.0.0
targets:
  MyApp:
    type: application
    platform: iOS
    sources:
      - path: Sources
    resources:
      - path: Sources/Resources
    info:
      path: Sources/Resources/Info.plist
      properties:
        UILaunchScreen: {}
        CFBundleDisplayName: MyApp
        UIApplicationSceneManifest:
          UIApplicationSupportsMultipleScenes: false
    settings:
      base:
        PRODUCT_BUNDLE_IDENTIFIER: com.myapp.MyApp
        MARKETING_VERSION: "0.1.0"
        CURRENT_PROJECT_VERSION: "1"
        TARGETED_DEVICE_FAMILY: "1,2"
    dependencies:
      - package: swift-log
        product: Logging
      - package: sentry-cocoa
        product: Sentry
      - package: sentry-cocoa
        product: SentrySwiftUI
      - package: keychain-swift
        product: KeychainSwift
    preBuildScripts:
      - script: |
          if which swiftlint > /dev/null; then
            swiftlint --strict
          else
            echo "warning: SwiftLint not installed (brew install swiftlint)"
          fi
        name: SwiftLint
  MyAppTests:
    type: bundle.unit-test
    platform: iOS
    sources:
      - path: Tests/UnitTests
    dependencies:
      - target: MyApp
  MyAppUITests:
    type: bundle.ui-testing
    platform: iOS
    sources:
      - path: Tests/UITests
    dependencies:
      - target: MyApp
schemes:
  MyApp:
    build:
      targets:
        MyApp: all
        MyAppTests: [test]
        MyAppUITests: [test]
    test:
      gatherCoverageData: true
      coverageTargets: [MyApp]
      parallelizable: true
      randomExecutionOrdering: true
      targets:
        - MyAppTests
        - MyAppUITests
    run:
      config: Debug
    archive:
      config: Release
```

### `Package.swift`

```swift
// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "MyAppPackages",
    platforms: [.iOS(.v17)],
    dependencies: [
        .package(url: "https://github.com/apple/swift-log", from: "1.10.1"),
        .package(url: "https://github.com/getsentry/sentry-cocoa", from: "8.40.0"),
        .package(url: "https://github.com/evgenyneu/keychain-swift", from: "24.0.0"),
    ]
)
```

(Note: when XcodeGen owns the project, this file is informational. Some teams prefer `Package.swift` as the source of truth via SwiftPM directly — pick one and stick to it. This rulebook picks XcodeGen.)

### `.swiftlint.yml`

```yaml
disabled_rules:
  - todo
opt_in_rules:
  - empty_count
  - explicit_init
  - first_where
  - force_unwrapping
  - implicit_return
  - last_where
  - prefer_self_type_over_type_of_self
  - redundant_nil_coalescing
  - sorted_first_last
  - toggle_bool
  - unused_import
  - vertical_whitespace_closing_braces
included:
  - Sources
  - Tests
excluded:
  - .build
  - DerivedData
  - build
line_length:
  warning: 140
  error: 200
  ignores_urls: true
file_length:
  warning: 500
  error: 800
function_body_length:
  warning: 60
  error: 120
type_body_length:
  warning: 300
  error: 500
identifier_name:
  excluded: [id, x, y, vm, db]
nesting:
  type_level: 2
custom_rules:
  print_disallowed:
    name: "no print()"
    regex: '^\s*print\('
    message: "Use AppLogger instead of print"
    severity: warning
  observable_object_disallowed:
    name: "no ObservableObject"
    regex: 'ObservableObject|@Published|@StateObject|@ObservedObject'
    message: "Use @Observable + @State / @Bindable"
    severity: error
  navigation_view_disallowed:
    name: "no NavigationView"
    regex: '\bNavigationView\b'
    message: "Use NavigationStack with a typed Route enum"
    severity: error
```

### `.swift-format`

```json
{
  "version": 1,
  "lineLength": 120,
  "indentation": { "spaces": 4 },
  "tabWidth": 4,
  "maximumBlankLines": 1,
  "respectsExistingLineBreaks": true,
  "lineBreakBeforeControlFlowKeywords": false,
  "lineBreakBeforeEachArgument": false,
  "lineBreakBeforeEachGenericRequirement": false,
  "prioritizeKeepingFunctionOutputTogether": true,
  "indentConditionalCompilationBlocks": false,
  "rules": {
    "AlwaysUseLowerCamelCase": true,
    "AmbiguousTrailingClosureOverload": true,
    "DontRepeatTypeInStaticProperties": true,
    "NoBlockComments": true,
    "NoLeadingUnderscores": false,
    "NoVoidReturnOnFunctionSignature": true,
    "OneVariableDeclarationPerLine": true,
    "OrderedImports": true,
    "ReturnVoidInsteadOfEmptyTuple": true,
    "UseEarlyExits": true,
    "UseLetInEveryBoundCaseVariable": true,
    "UseShorthandTypeNames": true,
    "UseSingleLinePropertyGetter": true,
    "UseSynthesizedInitializer": true,
    "UseTripleSlashForDocumentationComments": true,
    "UseWhereClausesInForLoops": false,
    "ValidateDocumentationComments": false
  }
}
```

### `Config/Shared.xcconfig`

```
SWIFT_VERSION = 6.0
IPHONEOS_DEPLOYMENT_TARGET = 17.0
SWIFT_STRICT_CONCURRENCY = complete
PRODUCT_BUNDLE_IDENTIFIER = com.myapp.MyApp
MARKETING_VERSION = 0.1.0
TARGETED_DEVICE_FAMILY = 1,2
```

### `Config/Debug.xcconfig`

```
#include "Shared.xcconfig"
API_BASE_URL = https:/$()/staging.api.myapp.com
SWIFT_ACTIVE_COMPILATION_CONDITIONS = DEBUG
```

### `Config/Release.xcconfig`

```
#include "Shared.xcconfig"
API_BASE_URL = https:/$()/api.myapp.com
SWIFT_OPTIMIZATION_LEVEL = -O
```

### `Sources/App/MyAppApp.swift`

```swift
import SwiftUI
import SwiftData
import Sentry

@main
struct MyAppApp: App {
    let modelContainer: ModelContainer

    init() {
        AppLogger.bootstrap()
        do {
            modelContainer = try ModelContainer(for: Item.self)
        } catch {
            fatalError("Failed to build ModelContainer: \(error)")
        }
        SentrySDK.start { options in
            options.dsn = Bundle.main.object(forInfoDictionaryKey: "SENTRY_DSN") as? String ?? ""
            options.tracesSampleRate = 0.2
            options.enableAutoPerformanceTracing = true
        }
        AppLogger.app.info("event=boot")
    }

    var body: some Scene {
        WindowGroup { RootView() }
            .modelContainer(modelContainer)
    }
}
```

### `Sources/App/RootView.swift`

```swift
import SwiftUI

struct RootView: View {
    @State private var router = Router()
    var body: some View {
        NavigationStack(path: $router.path) {
            ItemListView()
                .navigationDestination(for: Route.self) { route in
                    switch route {
                    case .itemDetail(let id): ItemDetailView(itemID: id)
                    case .settings:           SettingsView()
                    }
                }
        }
        .environment(router)
    }
}

#Preview { RootView() }
```

### `Sources/Navigation/Route.swift`

```swift
import Foundation
import SwiftData

enum Route: Hashable {
    case itemDetail(PersistentIdentifier)
    case settings
}

@Observable final class Router {
    var path = NavigationPath()
    func push(_ route: Route) { path.append(route) }
    func pop() { if !path.isEmpty { path.removeLast() } }
    func reset() { path = NavigationPath() }
}
```

### `Sources/Models/Item.swift`

```swift
import Foundation
import SwiftData

@Model
final class Item {
    var title: String
    var createdAt: Date
    var isDone: Bool

    init(title: String, createdAt: Date = .now, isDone: Bool = false) {
        self.title = title
        self.createdAt = createdAt
        self.isDone = isDone
    }
}
```

### `Sources/Features/ItemList/ItemListView.swift`

```swift
import SwiftUI
import SwiftData

struct ItemListView: View {
    @Environment(\.modelContext) private var modelContext
    @Environment(Router.self) private var router
    @Query(sort: \Item.createdAt, order: .reverse) private var items: [Item]
    @State private var draftTitle = ""

    var body: some View {
        List {
            Section {
                HStack {
                    TextField(String(localized: "item.new.placeholder"), text: $draftTitle)
                        .accessibilityIdentifier("titleField")
                    Button(String(localized: "item.new.save")) { addItem() }
                        .accessibilityIdentifier("saveButton")
                        .disabled(draftTitle.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
            ForEach(items) { item in
                Button {
                    router.push(.itemDetail(item.persistentModelID))
                } label: {
                    ItemRowView(item: item)
                }
            }
            .onDelete(perform: delete)
        }
        .navigationTitle(String(localized: "item.list.title"))
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button { router.push(.settings) } label: { Image(systemName: "gear") }
                    .accessibilityIdentifier("settingsButton")
                    .accessibilityLabel(String(localized: "common.settings"))
            }
        }
    }

    private func addItem() {
        let title = draftTitle.trimmingCharacters(in: .whitespaces)
        guard !title.isEmpty else { return }
        let item = Item(title: title)
        modelContext.insert(item)
        do { try modelContext.save() }
        catch { AppLogger.db.error("event=save_failed error=\(error)") }
        draftTitle = ""
    }

    private func delete(at offsets: IndexSet) {
        for index in offsets { modelContext.delete(items[index]) }
        do { try modelContext.save() }
        catch { AppLogger.db.error("event=delete_failed error=\(error)") }
    }
}
```

### `Sources/Features/ItemList/ItemRowView.swift`

```swift
import SwiftUI

struct ItemRowView: View {
    let item: Item
    var body: some View {
        HStack {
            Image(systemName: item.isDone ? "checkmark.circle.fill" : "circle")
            Text(item.title)
            Spacer()
            Text(item.createdAt, style: .date).foregroundStyle(.secondary)
        }
        .accessibilityIdentifier("itemRow_\(item.persistentModelID.hashValue)")
    }
}
```

### `Sources/Features/ItemDetail/ItemDetailView.swift`

```swift
import SwiftUI
import SwiftData

struct ItemDetailView: View {
    @Environment(\.modelContext) private var modelContext
    let itemID: PersistentIdentifier
    @State private var item: Item?

    var body: some View {
        Group {
            if let item {
                Form {
                    TextField(String(localized: "item.title"), text: Binding(
                        get: { item.title },
                        set: { item.title = $0 }
                    ))
                    Toggle(String(localized: "item.done"), isOn: Binding(
                        get: { item.isDone },
                        set: { item.isDone = $0 }
                    ))
                }
            } else {
                ProgressView()
            }
        }
        .navigationTitle(String(localized: "item.detail.title"))
        .task { item = modelContext.model(for: itemID) as? Item }
        .onDisappear {
            do { try modelContext.save() }
            catch { AppLogger.db.error("event=save_failed error=\(error)") }
        }
    }
}
```

### `Sources/Features/Settings/SettingsView.swift`

```swift
import SwiftUI

struct SettingsView: View {
    var body: some View {
        Form {
            LabeledContent(String(localized: "settings.version"),
                           value: Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "?")
            LabeledContent(String(localized: "settings.build"),
                           value: Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "?")
        }
        .navigationTitle(String(localized: "settings.title"))
    }
}
```

### `Sources/Services/Logger+Bootstrap.swift`

(See §7 for full contents — include verbatim.)

### `Sources/Services/APIClient.swift`

```swift
import Foundation

protocol APIClient: Sendable {
    func get<T: Decodable & Sendable>(_ path: String) async throws -> T
    func post<T: Decodable & Sendable, B: Encodable & Sendable>(_ path: String, body: B) async throws -> T
}

enum APIError: Error, Sendable {
    case badResponse(Int)
    case decoding(String)
    case transport(String)
}

struct DefaultAPIClient: APIClient {
    let baseURL: URL
    let session: URLSession
    init(baseURL: URL, session: URLSession = .shared) {
        self.baseURL = baseURL
        self.session = session
    }
    func get<T: Decodable & Sendable>(_ path: String) async throws -> T {
        try await send(path: path, method: "GET", body: Optional<Empty>.none)
    }
    func post<T: Decodable & Sendable, B: Encodable & Sendable>(_ path: String, body: B) async throws -> T {
        try await send(path: path, method: "POST", body: body)
    }
    private func send<T: Decodable & Sendable, B: Encodable & Sendable>(path: String, method: String, body: B?) async throws -> T {
        var req = URLRequest(url: baseURL.appendingPathComponent(path))
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        if let body { req.httpBody = try JSONEncoder().encode(body) }
        let requestID = UUID().uuidString
        AppLogger.net.info("event=request_in", metadata: ["request_id": "\(requestID)", "url": "\(req.url?.absoluteString ?? "")"])
        do {
            let (data, response) = try await session.data(for: req)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                let code = (response as? HTTPURLResponse)?.statusCode ?? -1
                AppLogger.net.error("event=request_failed", metadata: ["request_id": "\(requestID)", "status": "\(code)"])
                throw APIError.badResponse(code)
            }
            AppLogger.net.info("event=request_out", metadata: ["request_id": "\(requestID)", "status": "\(http.statusCode)"])
            do { return try JSONDecoder.snakeCase.decode(T.self, from: data) }
            catch { throw APIError.decoding("\(error)") }
        } catch let error as APIError { throw error }
        catch { throw APIError.transport("\(error)") }
    }
    private struct Empty: Encodable {}
}

private extension JSONDecoder {
    static let snakeCase: JSONDecoder = {
        let d = JSONDecoder()
        d.keyDecodingStrategy = .convertFromSnakeCase
        d.dateDecodingStrategy = .iso8601
        return d
    }()
}
```

### `Sources/Services/KeychainService.swift`

```swift
import Foundation
import KeychainSwift

protocol KeychainService: Sendable {
    func get(_ key: String) -> String?
    func set(_ value: String, forKey key: String)
    func delete(_ key: String)
}

struct DefaultKeychainService: KeychainService {
    private let kc = KeychainSwift()
    func get(_ key: String) -> String? { kc.get(key) }
    func set(_ value: String, forKey key: String) { kc.set(value, forKey: key, withAccess: .accessibleAfterFirstUnlock) }
    func delete(_ key: String) { kc.delete(key) }
}
```

### `Sources/DesignSystem/Tokens.swift`

```swift
import SwiftUI

enum Spacing {
    static let xs: CGFloat = 4
    static let sm: CGFloat = 8
    static let md: CGFloat = 16
    static let lg: CGFloat = 24
    static let xl: CGFloat = 40
}

enum Radii {
    static let sm: CGFloat = 6
    static let md: CGFloat = 12
    static let lg: CGFloat = 20
}

enum Palette {
    static let accent = Color("accent")
    static let surface = Color("surfacePrimary")
    static let text = Color("textPrimary")
}
```

### `Sources/Resources/Localizable.xcstrings`

```json
{
  "sourceLanguage": "en",
  "strings": {
    "common.settings":          { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Settings" } } } },
    "item.new.placeholder":     { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "New item title" } } } },
    "item.new.save":            { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Save" } } } },
    "item.list.title":          { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Items" } } } },
    "item.detail.title":        { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Item" } } } },
    "item.title":               { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Title" } } } },
    "item.done":                { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Done" } } } },
    "settings.title":           { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Settings" } } } },
    "settings.version":         { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Version" } } } },
    "settings.build":           { "localizations": { "en": { "stringUnit": { "state": "translated", "value": "Build" } } } }
  },
  "version": "1.0"
}
```

### `Tests/UnitTests/ItemListViewModelTests.swift`

```swift
import Testing
import SwiftData
@testable import MyApp

@Suite("Item")
struct ItemTests {
    @Test func newItemDefaultsToNotDone() {
        let item = Item(title: "x")
        #expect(item.isDone == false)
        #expect(item.title == "x")
    }

    @Test func itemPersistsInMemoryStore() throws {
        let container = try ModelContainer(
            for: Item.self,
            configurations: ModelConfiguration(isStoredInMemoryOnly: true)
        )
        let context = ModelContext(container)
        context.insert(Item(title: "Buy milk"))
        try context.save()
        let fetched = try context.fetch(FetchDescriptor<Item>())
        #expect(fetched.count == 1)
        #expect(fetched.first?.title == "Buy milk")
    }
}
```

### `Tests/UITests/SmokeUITests.swift`

```swift
import XCTest

final class SmokeUITests: XCTestCase {
    func testColdLaunchShowsItemList() throws {
        let app = XCUIApplication()
        app.launch()
        XCTAssertTrue(app.staticTexts["Items"].waitForExistence(timeout: 5))
    }
    func testCanAddAnItem() throws {
        let app = XCUIApplication()
        app.launch()
        let titleField = app.textFields["titleField"]
        XCTAssertTrue(titleField.waitForExistence(timeout: 5))
        titleField.tap()
        titleField.typeText("Buy milk")
        app.buttons["saveButton"].tap()
        XCTAssertTrue(app.staticTexts["Buy milk"].waitForExistence(timeout: 2))
    }
}
```

### `scripts/verify.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "→ Resolving packages…"
swift package resolve

echo "→ Linting…"
swiftlint --strict

echo "→ Format check…"
swift format lint --strict --recursive Sources Tests

echo "→ Building Debug…"
xcodebuild -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -configuration Debug build -quiet

echo "→ Unit tests…"
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -only-testing:MyAppTests -quiet

echo "→ UI smoke…"
xcodebuild test -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
  -only-testing:MyAppUITests/SmokeUITests -quiet

echo "✓ Verified."
```

### `fastlane/Appfile`

```ruby
app_identifier("com.myapp.MyApp")
apple_id(ENV["FASTLANE_APPLE_ID"])
team_id(ENV["FASTLANE_TEAM_ID"])
```

### `fastlane/Matchfile`

```ruby
git_url(ENV["MATCH_GIT_URL"])
storage_mode("git")
type("appstore")
app_identifier(["com.myapp.MyApp"])
username(ENV["FASTLANE_APPLE_ID"])
```

### `fastlane/Fastfile`

(See §12 — copy verbatim.)

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
    branches: [main]
  push:
    tags: ["v*.*.*"]

jobs:
  test:
    runs-on: macos-15
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v4

      - name: Select Xcode 26.4.1
        run: sudo xcode-select -s /Applications/Xcode_26.4.1.app

      - name: Show versions
        run: |
          xcodebuild -version
          swift --version

      - name: Install tools
        run: |
          brew install xcodegen swiftlint
          mkdir -p ~/.mint

      - name: Generate project
        run: xcodegen generate

      - name: Resolve packages
        run: swift package resolve

      - name: Lint
        run: swiftlint --strict

      - name: Format check
        run: swift format lint --strict --recursive Sources Tests

      - name: Build & test
        run: |
          xcodebuild test \
            -scheme MyApp \
            -destination 'platform=iOS Simulator,name=iPhone 16,OS=26.4' \
            -enableCodeCoverage YES \
            -resultBundlePath TestResults.xcresult \
            -parallel-testing-enabled YES \
            -parallel-testing-worker-count 4 \
            | xcbeautify

      - name: Coverage gate (≥70%)
        run: |
          PCT=$(xcrun xccov view --report --json TestResults.xcresult | jq '.targets[] | select(.name=="MyApp") | .lineCoverage')
          echo "coverage=$PCT"
          awk -v c="$PCT" 'BEGIN{exit (c<0.70)?1:0}'

      - name: Upload xcresult
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: xcresult
          path: TestResults.xcresult

  release:
    if: startsWith(github.ref, 'refs/tags/v')
    needs: test
    runs-on: macos-15
    steps:
      - uses: actions/checkout@v4
      - run: sudo xcode-select -s /Applications/Xcode_26.4.1.app
      - run: brew install xcodegen
      - run: xcodegen generate
      - name: TestFlight upload
        env:
          FASTLANE_APPLE_ID:        ${{ secrets.FASTLANE_APPLE_ID }}
          FASTLANE_TEAM_ID:         ${{ secrets.FASTLANE_TEAM_ID }}
          ASC_APP_ID:               ${{ secrets.ASC_APP_ID }}
          MATCH_GIT_URL:            ${{ secrets.MATCH_GIT_URL }}
          MATCH_PASSWORD:           ${{ secrets.MATCH_PASSWORD }}
          APP_STORE_CONNECT_API_KEY_ID:    ${{ secrets.APP_STORE_CONNECT_API_KEY_ID }}
          APP_STORE_CONNECT_API_ISSUER_ID: ${{ secrets.APP_STORE_CONNECT_API_ISSUER_ID }}
          APP_STORE_CONNECT_API_KEY_KEY:   ${{ secrets.APP_STORE_CONNECT_API_KEY_KEY }}
        run: bundle exec fastlane beta
```

### `README.md`

```markdown
# MyApp

SwiftUI + iOS 26 + SwiftData. See `rulebooks/swiftui-ios.md` for the full project rules.

## Requirements
- macOS 15.6+ on Apple Silicon, Xcode 26.4.1, 16 GB RAM, 100 GB disk.
- Apple Developer Program membership for TestFlight.

## Setup
```
brew install xcodegen swiftlint
xcodegen generate
open MyApp.xcodeproj
```

## Verify
```
./scripts/verify.sh
```

## Ship
```
git tag v0.1.1 && git push origin v0.1.1
```
CI uploads to TestFlight automatically on tag push.

## License
MIT — see `LICENSE`.
```

### `.env.example`

```
FASTLANE_APPLE_ID=you@example.com
FASTLANE_TEAM_ID=ABCDE12345
ASC_APP_ID=1234567890
MATCH_GIT_URL=git@github.com:you/match-certs.git
MATCH_PASSWORD=changeme
SENTRY_DSN=https://public@sentry.io/12345
```

### `LICENSE`

```
MIT License — Copyright (c) 2026 …
[Standard MIT text here.]
```

---

## 17. Idea → MVP Path

`PROJECT_IDEA` was blank. Use a generic CRUD app: **a list of items the user can create, view, edit, and delete, with Sign in with Apple and per-user storage.**

### Phase 1 — Schema (1 AI session)

Files: `Sources/Models/Item.swift`, `Sources/Models/User.swift`.

```swift
@Model final class Item {
    var title: String
    var notes: String
    var createdAt: Date
    var owner: User?
    init(title: String, notes: String = "", owner: User? = nil) { … }
}
@Model final class User {
    @Attribute(.unique) var appleUserID: String
    var displayName: String
    @Relationship(deleteRule: .cascade, inverse: \Item.owner) var items: [Item] = []
    init(appleUserID: String, displayName: String) { … }
}
```

Exit: `Item` and `User` types compile. In-memory test creates a User, attaches an Item, saves and refetches.

### Phase 2 — Backbone (1 session)

Files: `Sources/Navigation/Route.swift` (cases for `.itemList`, `.itemDetail`, `.profile`, `.signIn`), `Sources/Features/*/View.swift` skeletons (no logic), `Sources/App/RootView.swift` branching on auth state.

Exit: `xcodebuild build` passes; navigating between empty screens works on simulator.

### Phase 3 — Vertical slice (2 sessions)

Pick one flow: **add item → list updates → tap → detail → edit → list reflects edit.**

Files: `ItemListView`, `ItemListViewModel`, `ItemDetailView`, `ItemDetailViewModel`, plus tests `ItemListViewModelTests`, `ItemDetailViewModelTests`, `AddItemUITests`.

Exit: full self-verification recipe (§8.5) green; XCUITest covers the full flow.

### Phase 4 — Auth + multi-user (2 sessions)

Files: `Sources/Features/SignIn/SignInView.swift` (uses `SignInWithAppleButton`), `Sources/Services/AuthService.swift`, `AuthStore` (`@Observable`), backend `POST /auth/apple` adapter in `APIClient`.

Behavior: items are scoped to the signed-in `User`; logout clears Keychain + local items for that user.

Exit: two-account swap test — sign in as A, add 3 items, sign out, sign in as B, see zero items, sign out, back to A, see 3 items.

### Phase 5 — Ship + monitor (1 session)

- Bump `MARKETING_VERSION` to 1.0.0.
- `git tag v1.0.0 && git push origin v1.0.0`.
- CI deploys to TestFlight.
- Internal-test on personal device for 24 h.
- Submit for App Store review.
- Watch Sentry crash-free sessions ≥ 99.5% for first 72 h.

Exit: live on App Store; Sentry dashboard shows zero unresolved errors.

---

## 18. Feature Recipes

### 18.1 Authentication (Sign in with Apple)

`Sources/Features/SignIn/SignInView.swift`:

```swift
import SwiftUI
import AuthenticationServices

struct SignInView: View {
    @Environment(AuthStore.self) private var auth
    var body: some View {
        VStack(spacing: Spacing.lg) {
            Text(String(localized: "signin.title")).font(.largeTitle)
            SignInWithAppleButton(.signIn,
                onRequest: { req in req.requestedScopes = [.fullName, .email] },
                onCompletion: { result in Task { await auth.handle(result) } }
            )
            .signInWithAppleButtonStyle(.black)
            .frame(height: 50)
            .accessibilityIdentifier("signInButton")
        }
        .padding()
    }
}
```

`Sources/Services/AuthStore.swift`:

```swift
import AuthenticationServices

@MainActor @Observable final class AuthStore {
    private(set) var currentUserID: String?
    private let keychain: KeychainService
    private let api: APIClient
    init(keychain: KeychainService, api: APIClient) {
        self.keychain = keychain; self.api = api
        self.currentUserID = keychain.get("session.userID")
    }
    func handle(_ result: Result<ASAuthorization, Error>) async {
        switch result {
        case .success(let auth):
            guard let cred = auth.credential as? ASAuthorizationAppleIDCredential,
                  let token = cred.identityToken.flatMap({ String(data: $0, encoding: .utf8) }) else { return }
            do {
                let resp: AuthResponse = try await api.post("/auth/apple", body: ["idToken": token])
                keychain.set(resp.sessionToken, forKey: "session.token")
                keychain.set(resp.userID, forKey: "session.userID")
                currentUserID = resp.userID
            } catch { AppLogger.app.error("event=auth_failed error=\(error)") }
        case .failure(let error):
            AppLogger.app.error("event=auth_user_failed error=\(error)")
        }
    }
    func signOut() {
        keychain.delete("session.token")
        keychain.delete("session.userID")
        currentUserID = nil
    }
}

private struct AuthResponse: Decodable { let sessionToken: String; let userID: String }
```

Capability: in Xcode → target → Signing & Capabilities → "+ Capability" → Sign in with Apple.

### 18.2 File upload

`Sources/Services/UploadService.swift`:

```swift
import Foundation

protocol UploadService: Sendable {
    func upload(data: Data, mimeType: String) async throws -> URL
}

struct S3UploadService: UploadService {
    let api: APIClient
    func upload(data: Data, mimeType: String) async throws -> URL {
        let presigned: PresignedURL = try await api.post("/uploads/presign", body: ["mimeType": mimeType])
        var req = URLRequest(url: presigned.url)
        req.httpMethod = "PUT"
        req.setValue(mimeType, forHTTPHeaderField: "Content-Type")
        let (_, resp) = try await URLSession.shared.upload(for: req, from: data)
        guard let http = resp as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
            throw APIError.badResponse((resp as? HTTPURLResponse)?.statusCode ?? -1)
        }
        return presigned.publicURL
    }
}

private struct PresignedURL: Decodable { let url: URL; let publicURL: URL }
```

Picker UI: `PhotosPicker` from PhotosUI gives you `Data` directly. Add `NSPhotoLibraryUsageDescription` to `Info.plist`.

### 18.3 In-App Purchase (StoreKit 2)

```swift
import StoreKit

@MainActor @Observable final class IAPStore {
    private(set) var products: [Product] = []
    private(set) var entitlements: Set<String> = []
    let productIDs = ["com.myapp.MyApp.pro.monthly", "com.myapp.MyApp.pro.yearly"]

    func load() async {
        do { products = try await Product.products(for: productIDs) }
        catch { AppLogger.app.error("event=iap_load_failed error=\(error)") }
        await refreshEntitlements()
    }

    func purchase(_ product: Product) async throws -> Bool {
        let result = try await product.purchase()
        switch result {
        case .success(let verification):
            let transaction = try checkVerified(verification)
            await transaction.finish()
            await refreshEntitlements()
            return true
        case .userCancelled, .pending: return false
        @unknown default: return false
        }
    }

    private func refreshEntitlements() async {
        var ids = Set<String>()
        for await result in Transaction.currentEntitlements {
            if case .verified(let t) = result { ids.insert(t.productID) }
        }
        entitlements = ids
    }

    private func checkVerified<T>(_ r: VerificationResult<T>) throws -> T {
        switch r {
        case .verified(let v): return v
        case .unverified: throw APIError.transport("unverified iap")
        }
    }
}
```

Add the products in App Store Connect → My Apps → MyApp → Features → In-App Purchases. Test with a Sandbox tester account on a real device.

### 18.4 Push notifications

`Sources/Services/PushService.swift`:

```swift
import UIKit
import UserNotifications

@MainActor final class PushService: NSObject, UNUserNotificationCenterDelegate {
    static let shared = PushService()
    func register() async {
        let granted = (try? await UNUserNotificationCenter.current().requestAuthorization(options: [.alert, .sound, .badge])) ?? false
        guard granted else { return }
        await UIApplication.shared.registerForRemoteNotifications()
        UNUserNotificationCenter.current().delegate = self
    }
    nonisolated func userNotificationCenter(_ center: UNUserNotificationCenter,
                                            willPresent notification: UNNotification) async -> UNNotificationPresentationOptions {
        [.banner, .sound]
    }
}
```

Capability: Push Notifications. APNS key from Apple Developer → Keys → "+" → Apple Push Notifications service. Upload that key to your backend.

### 18.5 Background jobs

```swift
import BackgroundTasks

@main struct MyAppApp: App {
    init() {
        BGTaskScheduler.shared.register(forTaskWithIdentifier: "com.myapp.MyApp.refresh", using: nil) { task in
            Task { await refresh(task: task as! BGAppRefreshTask) }
        }
    }
    func scheduleRefresh() {
        let req = BGAppRefreshTaskRequest(identifier: "com.myapp.MyApp.refresh")
        req.earliestBeginDate = Date(timeIntervalSinceNow: 15 * 60)
        try? BGTaskScheduler.shared.submit(req)
    }
    func refresh(task: BGAppRefreshTask) async {
        scheduleRefresh()
        let work = Task { try await SyncService().syncOnce() }
        task.expirationHandler = { work.cancel() }
        do { try await work.value; task.setTaskCompleted(success: true) }
        catch { task.setTaskCompleted(success: false) }
    }
}
```

Add `BGTaskSchedulerPermittedIdentifiers` in `Info.plist` with the identifier above.

### 18.6 Realtime updates (URLSession WebSocket)

```swift
actor LiveFeed {
    private var task: URLSessionWebSocketTask?
    func connect(to url: URL) async {
        let t = URLSession.shared.webSocketTask(with: url)
        task = t
        t.resume()
        await receive()
    }
    private func receive() async {
        guard let task else { return }
        do {
            let msg = try await task.receive()
            await MainActor.run { handle(msg) }
            await receive()
        } catch { AppLogger.net.error("event=ws_failed error=\(error)") }
    }
    @MainActor private func handle(_ msg: URLSessionWebSocketTask.Message) { /* dispatch to store */ }
}
```

### 18.7 Search

In SwiftUI:

```swift
struct ItemListView: View {
    @Query private var allItems: [Item]
    @State private var query = ""
    var filtered: [Item] { query.isEmpty ? allItems : allItems.filter { $0.title.localizedCaseInsensitiveContains(query) } }
    var body: some View {
        List(filtered) { ItemRowView(item: $0) }
            .searchable(text: $query, prompt: String(localized: "common.search"))
    }
}
```

For larger datasets, use `@Query(filter:)` with a predicate against SwiftData.

### 18.8 Internationalization

- Source of truth: `Sources/Resources/Localizable.xcstrings` (Xcode UI auto-fills).
- Code: `Text(String(localized: "key"))`.
- Add a locale: in Project → Info → Localizations → "+". Run app with `-AppleLanguages '(es)'` launch argument to test.
- Pseudo-locale for layout testing: scheme → Run → Options → App Language → Double-Length Pseudolanguage.

### 18.9 Dark mode

SwiftUI is dark-mode-aware automatically. Make sure colors come from semantic asset-catalog entries:

- `Assets.xcassets/Colors/accent.colorset/Contents.json` defines Light Appearance and Dark Appearance.
- Code reads `Color("accent")` (or `Palette.accent`).

To force a mode for testing: `.preferredColorScheme(.dark)` on any view.

### 18.10 Analytics events

Use OSLog-backed events for now; pipe to a SaaS later by swapping the backend.

```swift
enum AnalyticsEvent: String { case openItemList, addItem, deleteItem, signIn, signOut }
extension Logger {
    func event(_ e: AnalyticsEvent, _ extra: Logger.Metadata = [:]) {
        info("event=\(e.rawValue)", metadata: extra)
    }
}

// Usage:
AppLogger.ui.event(.addItem, ["item_id": "\(item.persistentModelID.hashValue)"])
```

To forward to a SaaS, replace `OSLogHandler` with one that POSTs batched events to your endpoint.

---

## 19. Troubleshooting (Top 30)

| Error | Fix |
|---|---|
| `Multiple commands produce '…/Info.plist'` | Remove the duplicate `Info.plist` from build phases. Re-run `xcodegen generate`. |
| `No such module 'SwiftData'` | Deployment target < 17. Update `project.yml`: `deploymentTarget: { iOS: "17.0" }`. |
| `error: 'package' product not found` | `swift package resolve`. In Xcode: File → Packages → Reset Package Caches. |
| `Code Signing Error: No profiles for ... were found` | Xcode → target → Signing & Capabilities → tick Automatic. Pick team. |
| `error: requires a development team` | `DEVELOPMENT_TEAM` empty in `project.yml`. Set it, re-generate. |
| `Could not find iOS Simulator runtime` | `xcodebuild -downloadPlatform iOS`. |
| `Simulator timed out waiting for boot` | `xcrun simctl shutdown all && xcrun simctl erase all`. |
| `Sandbox: rsync.samba ... deny(1) file-write-create` | Settings → Locations → Derived Data → Custom: relative `Build/`. |
| `error: dyld: Library not loaded ... libswift_Concurrency` | Build target's Swift version mismatch. Set `SWIFT_VERSION = 6.0`. |
| `_PersistentModel was passed across actors` | Pass `persistentModelID`; refetch on the destination actor. |
| `SwiftData Fatal: Unable to find PersistentModel for class 'X'` | Add `X.self` to the `ModelContainer` schema array. |
| `Sending 'self.viewModel' risks causing data races` | Capture data, not the VM, into the `Task`. Or annotate the call site `@MainActor`. |
| `Cannot preview in this file` | Preview imports a non-previewable type. Provide a stub via `.environment` in the `#Preview` block. |
| `Type 'X' does not conform to protocol 'Sendable'` | Add `@unchecked Sendable` only if you can prove safety; otherwise refactor to an actor or value type. |
| `@MainActor function called from non-isolated context` | Wrap the call in `await MainActor.run { … }` or annotate the call site. |
| `Build input file cannot be found: '…/Generated.swift'` | Stale derived data. `rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*`. |
| `archive failed: exportArchive: No applicable devices found` | `-destination 'generic/platform=iOS'` for archive. Don't pass a simulator destination. |
| `Cannot find 'XCTest' in scope` (in unit test) | You're in a Swift Testing file; remove `import XCTest`, use `import Testing`. |
| `Test runner crashed: 'fatalError: ModelContainer'` | In tests, build with `ModelConfiguration(isStoredInMemoryOnly: true)`. |
| `No such SDK 'iphoneos26.4'` | Wrong Xcode selected. `sudo xcode-select -s /Applications/Xcode_26.4.1.app`. |
| `Provisioning profile doesn't include the application's entitlements` | Re-run `fastlane match appstore --force` to regenerate the profile. |
| `Apple ID does not have permission to access this app` | App Store Connect → Users → grant App Manager role. |
| `altool: NSURLErrorDomain Code=-1011 'unauthorized'` | API key revoked or wrong issuer ID. Re-generate at appstoreconnect.apple.com → Users → Keys. |
| `Asset Catalog: ambiguous color 'accent'` | Two color sets named `accent`. Rename one. |
| `Constraint requires Sendable` (Combine remnant) | Drop Combine. Use `@Observable` and `AsyncStream`. |
| `Property '…' is not concurrency-safe` | Make it `let`, or annotate `@MainActor`, or move to an actor. |
| `Generic parameter 'T' could not be inferred` (FetchDescriptor) | Specify the model type: `let d = FetchDescriptor<Item>()`. |
| `App Transport Security policy requires the use of a secure connection` | Backend must use TLS 1.2+. Do not add `NSAllowsArbitraryLoads`. |
| `Swift Compiler Error: command timed out` | Type-check timeout. Break complex expressions into smaller `let`s. |
| `xcodebuild error: -allowProvisioningUpdates is required` | Add `-allowProvisioningUpdates` to your `xcodebuild` invocation. |

---

## 20. Glossary

- **Actor** — a Swift concurrency primitive that serializes access to its mutable state.
- **App Store Connect** — Apple's web app for managing builds, TestFlight, and the App Store listing.
- **Archive** — a built `.app` bundle wrapped for upload (`.xcarchive`).
- **Asset catalog** — `*.xcassets` directory holding images, colors, app icons.
- **Bundle ID** — reverse-DNS string identifying your app, e.g., `com.myapp.MyApp`.
- **Capability** — a feature that requires Apple's permission (Push, In-App Purchase, Sign in with Apple). Toggled in Xcode's Signing & Capabilities.
- **Deployment target** — the lowest iOS version your app will run on.
- **Derived data** — Xcode's intermediate build cache (`~/Library/Developer/Xcode/DerivedData`).
- **Distribution profile** — a signed file authorizing one app + one team to be uploaded to the App Store.
- **Entitlements** — `*.entitlements` plist listing capabilities your app uses.
- **Environment (SwiftUI)** — a value-passing system; child views read what parents inject.
- **fastlane** — Ruby toolset that automates signing, building, and uploading.
- **`@Bindable`** — SwiftUI macro creating two-way bindings to an `@Observable` instance.
- **`@MainActor`** — Swift annotation forcing code onto the main thread (where UIKit/SwiftUI runs).
- **`@Model`** — SwiftData macro making a class persisted in SQLite.
- **`@Observable`** — Swift Observation macro making property changes drive SwiftUI re-renders.
- **`@Query`** — SwiftUI property wrapper that streams a SwiftData fetch.
- **`@State`** — SwiftUI property wrapper for view-owned mutable state.
- **`@Test`** — Swift Testing macro marking a function as a test.
- **`ModelContainer`** — the SwiftData object owning the SQLite store and schema.
- **`ModelContext`** — a per-actor staging area for inserts/updates/deletes against a `ModelContainer`.
- **`NavigationStack`** — SwiftUI's modern navigation container; replaces `NavigationView`.
- **`PersistentIdentifier`** — a Sendable opaque ID for a SwiftData model instance; safe to cross actors.
- **Provisioning profile** — a signed file describing what an app is allowed to do on a device.
- **Scheme** — Xcode's bundle of build/test/run/archive configurations for one target.
- **Sendable** — a Swift protocol marking types safe to share across concurrency contexts.
- **Sign in with Apple** — Apple's OAuth-style identity service required for apps offering social login.
- **Simulator** — macOS app emulating an iPhone/iPad; ships with Xcode.
- **SPM (Swift Package Manager)** — Apple's dependency manager; reads `Package.swift`.
- **Swift Testing** — Apple's macro-based test framework, successor to XCTest for unit tests.
- **`.swiftformat`/`.swift-format`** — config files for the swift-format tool.
- **TestFlight** — Apple's beta-testing system; precedes App Store release.
- **Toolchain** — the bundled Swift compiler, runtime, and tools shipped with Xcode.
- **Xcode** — Apple's macOS-only IDE for iOS/macOS/tvOS/visionOS development.
- **xcodebuild** — Xcode's CLI build driver.
- **XcodeGen** — a tool that generates an `.xcodeproj` from a YAML file (`project.yml`).
- **XCUITest** — XCTest's UI-testing subsystem for full-app simulation.

---

## 21. Update Cadence

- This rulebook is valid for **Xcode 26.4.x / iOS 26.x / Swift 6.3.x**, with a minimum deployment target of iOS 17.0.
- Re-run the generator when:
  - Apple ships a new major Xcode (e.g., Xcode 27 / iOS 27 in autumn 2026).
  - Swift bumps a major version (Swift 7 → re-evaluate concurrency defaults).
  - SwiftData ships a breaking schema feature.
  - An SPM dependency you depend on hits a major version bump.
  - You change deploy target (e.g., adding macOS Catalyst).
  - A security advisory is issued for any pinned dependency.

**Last generated: 2026-04-27.**

---

## Known Gaps

- The brief specified "iOS 18 + SwiftData", but as of 2026-04-27 Apple's current SDK is **iOS 26.4 / Xcode 26.4.1 / Swift 6.3** (Apple unified version numbers in 2025). This rulebook targets the live stack with `iOS 17.0` as the minimum deployment target so the original "iOS 17/18-era" SwiftData and `@Observable` features continue to apply. If a non-coder genuinely needs to ship against the iOS 18 SDK specifically, they must download Xcode 16.x from https://developer.apple.com/download/all/ and adjust `IPHONEOS_DEPLOYMENT_TARGET` and `SWIFT_VERSION` accordingly — Swift 6.0, not 6.3.
- SwiftLint version cited is **0.64.0** based on the active 0.64.0-rc.1 line; the official tagged 0.64.0 may have shipped slightly different rule defaults — verify on first run.
- Visual regression / snapshot testing is intentionally deferred (no tool included) until the design stabilizes; the rulebook calls this out in §6.
- Cloud-Mac specifics (MacStadium pricing, AWS EC2 Mac quotas) drift quickly — confirm pricing before quoting users.
- The `Package.swift` block is informational because XcodeGen owns the project; teams that want SPM-only builds (no `.xcodeproj`) need a different scaffold.
