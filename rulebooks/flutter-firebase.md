# Flutter + Firebase Rulebook

Cross-platform iOS/Android/web app on Flutter 3.41 + Dart 3.11 + FlutterFire 4.12, glued together with Riverpod 3, go_router 16, freezed 3, and Firebase (Auth + Firestore + Storage + Functions + Crashlytics + App Check). One opinionated path from `flutter create` to TestFlight/Play Internal.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Dart 3.11 | Sound null safety, records, patterns, class modifiers. |
| Runtime + version | Flutter 3.41.5 stable | Current stable channel as of 2026-04-27. |
| Package manager | `flutter pub` (pub.dev) | Built into Flutter toolchain; only option. |
| Build tool | Flutter SDK + Gradle 8 + Xcode 16 | Native toolchains required for store builds. |
| State mgmt | Riverpod 3.3.1 (with codegen) | Compile-safe, AsyncNotifier-first, retry built in. |
| Routing/Nav | go_router 16.0 | Declarative, deep-linkable, official Flutter pkg. |
| Data layer | Cloud Firestore 6.x via FlutterFire | Realtime, offline cache, no backend to run. |
| Auth | firebase_auth 6.x | Email + Google + Apple in one SDK. |
| Styling | Material 3 + ThemeExtension | First-party, dark mode out of the box. |
| Forms + validation | flutter_hooks + reactive_forms 18 | Hook-driven inputs, schema validators. |
| Unit test runner | `flutter test` (package:test) | Bundled, parallel by file, gold standard. |
| E2E framework | patrol 3.x | Native dialogs + parallel device sharding. |
| Mocking strategy | mocktail 1.0 | Null-safe, no codegen, kills mockito boilerplate. |
| Logger | logger 2.x + Crashlytics sink | One ergonomic API, structured prod sink. |
| Error tracking | Firebase Crashlytics 5.x | Bundled with the stack, native + Dart traces. |
| Lint + format | very_good_analysis 9 + dart format | VGV ruleset is the strictest sane default. |
| Type checking | `dart analyze` (built in) | Always-on type system, no extra binary. |
| Env vars + secrets | `--dart-define-from-file` + flavors | Compile-time constants, no runtime leak. |
| CI provider | GitHub Actions | Free tier handles unit; matrix builds easy. |
| Deploy target | TestFlight + Play Internal Testing | Closest staging to prod, no extra service. |
| Release flow | Fastlane + `flutter build` | Industry default for store uploads. |
| Auto-update | Store-managed updates | OS handles staged rollout natively. |
| Codegen runner | build_runner 2.10 | Single tool drives freezed + json + riverpod. |
| Immutable model lib | freezed 3.5 | Sealed classes, copyWith, JSON, all in one. |
| Theme strategy | Material 3 ColorScheme.fromSeed + ThemeExtension | Single seed color generates accessible palette. |
| Env strategy | Flavors (dev/stg/prod) + `--dart-define-from-file` | Per-env Firebase project + bundle id. |
| Firebase config gen | `flutterfire configure` | Generates firebase_options.dart per platform. |
| App Check | Play Integrity + DeviceCheck | Default providers, blocks abuse on first launch. |

### Versions Table

| Lib | Version | Notes | Link |
|---|---|---|---|
| Flutter | 3.41.5 | Stable channel 2026-02 | https://docs.flutter.dev/release/release-notes |
| Dart SDK | 3.11.0 | Bundled with Flutter 3.41 | https://dart.dev/get-dart |
| firebase_core | ^4.12.0 | FlutterFire 4.12 release | https://pub.dev/packages/firebase_core |
| firebase_auth | ^6.0.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/firebase_auth |
| cloud_firestore | ^6.0.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/cloud_firestore |
| firebase_storage | ^13.0.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/firebase_storage |
| cloud_functions | ^6.0.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/cloud_functions |
| firebase_crashlytics | ^5.0.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/firebase_crashlytics |
| firebase_app_check | ^0.4.0 | Pin matches FlutterFire 4.12 | https://pub.dev/packages/firebase_app_check |
| flutter_riverpod | ^3.3.1 | Riverpod 3 stable | https://pub.dev/packages/flutter_riverpod |
| riverpod_annotation | ^3.0.3 | Codegen annotations | https://pub.dev/packages/riverpod_annotation |
| riverpod_generator | ^3.0.3 | Generates @riverpod | https://pub.dev/packages/riverpod_generator |
| riverpod_lint | ^3.0.3 | Custom-lint rules | https://pub.dev/packages/riverpod_lint |
| go_router | ^16.0.0 | Requires Flutter 3.32+ | https://pub.dev/packages/go_router |
| freezed | ^3.5.0 | Sealed unions, copyWith | https://pub.dev/packages/freezed |
| freezed_annotation | ^3.0.0 | Annotations only | https://pub.dev/packages/freezed_annotation |
| json_serializable | ^6.9.4 | toJson/fromJson codegen | https://pub.dev/packages/json_serializable |
| json_annotation | ^4.9.0 | Annotations only | https://pub.dev/packages/json_annotation |
| build_runner | ^2.10.4 | Drives all codegen | https://pub.dev/packages/build_runner |
| custom_lint | ^0.8.0 | Required by riverpod_lint | https://pub.dev/packages/custom_lint |
| very_good_analysis | ^9.0.0 | Strict lint preset | https://pub.dev/packages/very_good_analysis |
| flutter_hooks | ^0.21.0 | Hook composition | https://pub.dev/packages/flutter_hooks |
| logger | ^2.4.0 | Pretty + structured | https://pub.dev/packages/logger |
| mocktail | ^1.0.4 | Null-safe mocking | https://pub.dev/packages/mocktail |
| patrol | ^3.16.0 | Native E2E | https://pub.dev/packages/patrol |
| flutterfire_cli | ^1.4.0 | Configure CLI | https://pub.dev/packages/flutterfire_cli |
| FVM | ^3.2.0 | SDK pinning per project | https://fvm.app |

### Minimum Host Requirements

- macOS 14 Sonoma+ (for iOS builds), Windows 11, or Ubuntu 22.04+.
- 16 GB RAM (8 GB will swap during Xcode + Android Studio + simulators).
- 50 GB free disk: Flutter SDK (3 GB) + Xcode (45 GB) + Android SDK (10 GB) + emulators.
- Apple Silicon recommended on macOS; iOS Simulator runs natively.
- Xcode 16.2+ and CocoaPods 1.16+ on macOS.
- Android Studio Ladybug or newer with command-line tools.
- JDK 17 (Temurin) on the PATH.

### Cold-start Time

`git clone` to running app on a fresh machine: ~25 minutes (assumes Flutter, Xcode, Android Studio already installed; otherwise ~2 hours including downloads).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew (skip if installed).
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install toolchain.
brew install --cask flutter
brew install --cask android-studio
brew install --cask android-commandlinetools
brew install fvm cocoapods openjdk@17 firebase-cli
sudo gem install fastlane -NV

# 3. Xcode from App Store, then:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS

# 4. Pin Flutter via FVM.
fvm install 3.41.5
fvm global 3.41.5

# 5. Verify.
fvm flutter doctor -v

# 6. Install FlutterFire CLI.
dart pub global activate flutterfire_cli

# 7. Auth into Firebase + GitHub.
firebase login
gh auth login
```

### Windows

```powershell
# 1. Winget toolchain.
winget install --id Git.Git
winget install --id Microsoft.VisualStudio.2022.BuildTools --override "--add Microsoft.VisualStudio.Workload.NativeDesktop --includeRecommended"
winget install --id Google.AndroidStudio
winget install --id EclipseAdoptium.Temurin.17.JDK
winget install --id Google.CloudSDK
winget install --id Firebase.FirebaseCLI
winget install --id GitHub.cli

# 2. Flutter SDK via FVM.
dart pub global activate fvm
fvm install 3.41.5
fvm global 3.41.5

# 3. Add fvm Flutter to PATH (PowerShell profile).
$Env:PATH += ";$Env:USERPROFILE\fvm\default\bin"

# 4. Accept Android licenses.
flutter doctor --android-licenses

# 5. iOS builds NOT possible on Windows. Use macOS or Codemagic Mac runners.

# 6. Verify.
flutter doctor -v
```

### Linux (Ubuntu 22.04+)

```bash
# 1. Apt deps.
sudo apt update
sudo apt install -y curl git unzip xz-utils zip libglu1-mesa openjdk-17-jdk
# Snap for Android Studio.
sudo snap install android-studio --classic

# 2. Flutter via FVM.
curl -fsSL https://fvm.app/install.sh | bash
fvm install 3.41.5
fvm global 3.41.5
echo 'export PATH="$HOME/fvm/default/bin:$PATH"' >> ~/.bashrc
source ~/.bashrc

# 3. Firebase + GitHub CLIs.
curl -sL https://firebase.tools | bash
sudo apt install gh

# 4. iOS builds NOT possible on Linux. Use macOS or Codemagic.

# 5. Verify.
flutter doctor -v
```

### Required Accounts

| Service | URL | What you need |
|---|---|---|
| Apple Developer | https://developer.apple.com/programs/ | $99/yr, individual or org. |
| Google Play Console | https://play.google.com/console | $25 one-time. |
| Firebase | https://console.firebase.google.com | Free Spark plan to start; Blaze required for Functions + Storage outbound. |
| GitHub | https://github.com | Free; private repos OK. |
| Codemagic (optional) | https://codemagic.io | Free 500 build-min/mo on Mac runners. |

### Bootstrap Commands

```bash
# 1. Create the project (replace org + name).
fvm flutter create \
  --org com.example \
  --project-name myapp \
  --platforms ios,android,web \
  myapp
cd myapp

# 2. Pin Flutter version per project.
fvm use 3.41.5

# 3. Initialize git.
git init
git add -A
git commit -m "chore: flutter create"

# 4. Create Firebase projects (one per flavor).
firebase projects:create myapp-dev   --display-name "MyApp Dev"
firebase projects:create myapp-stg   --display-name "MyApp Staging"
firebase projects:create myapp-prod  --display-name "MyApp Prod"

# 5. Generate firebase_options.dart for dev (repeat per flavor with --out).
flutterfire configure \
  --project=myapp-dev \
  --platforms=ios,android,web \
  --ios-bundle-id=com.example.myapp.dev \
  --android-package-name=com.example.myapp.dev \
  --out=lib/firebase_options_dev.dart

# 6. Install codegen + Riverpod stack (versions per Versions Table).
fvm flutter pub add \
  flutter_riverpod riverpod_annotation \
  go_router \
  freezed_annotation json_annotation \
  firebase_core firebase_auth cloud_firestore firebase_storage \
  cloud_functions firebase_crashlytics firebase_app_check \
  flutter_hooks logger
fvm flutter pub add --dev \
  build_runner freezed json_serializable \
  riverpod_generator riverpod_lint custom_lint \
  very_good_analysis mocktail patrol

# 7. First codegen pass.
fvm dart run build_runner build --delete-conflicting-outputs

# 8. Run on a simulator/emulator.
open -a Simulator       # macOS only
fvm flutter run --flavor dev --target lib/main_dev.dart
```

### Expected First-run Output (truncated)

```
Launching lib/main_dev.dart on iPhone 16 Pro in debug mode...
Running pod install...                                              5.7s
Running Xcode build...
 └─Compiling, linking and signing...                                17.4s
Xcode build done.                                           34.2s
Syncing files to device iPhone 16 Pro...
Flutter run key commands.
r Hot reload. 🔥🔥🔥
R Hot restart.
h List all available interactive commands.
d Detach (terminate "flutter run" but leave application running).
c Clear the screen
q Quit (terminate the application on the device).

A Dart VM Service on iPhone 16 Pro is available at:
http://127.0.0.1:51123/abcDEF=/
The Flutter DevTools debugger and profiler on iPhone 16 Pro is available at:
http://127.0.0.1:9100?uri=http://127.0.0.1:51123/abcDEF=/
```

### Common First-run Errors

| Error | Fix |
|---|---|
| `CocoaPods not installed` | `sudo gem install cocoapods && cd ios && pod install` |
| `No valid code signing certificates` | Open `ios/Runner.xcworkspace` in Xcode → Signing → select team. |
| `Android licenses not accepted` | `fvm flutter doctor --android-licenses`, press `y` until done. |
| `Could not resolve com.google.firebase` | Bump `android/build.gradle` `classpath 'com.google.gms:google-services:4.4.2'`. |
| `MissingPluginException(No implementation found)` | Stop dev server, `fvm flutter clean`, re-run. |
| `[firebase_core/no-app] No Firebase App` | You forgot `await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)`. |
| `Hot reload not working after codegen` | Hot restart (R), not hot reload (r). Generated files require restart. |
| `Pod install failed: undefined symbol` | `cd ios && pod deintegrate && pod install --repo-update`. |
| `Min SDK version 21 required` | `android/app/build.gradle.kts` → set `minSdk = 23`. |
| `Xcode 16 required` | Install latest Xcode from App Store; `sudo xcode-select -s /Applications/Xcode.app`. |

---

## 3. Project Layout

```
myapp/
├── .fvmrc                       # pinned Flutter version
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
├── .claude/
│   └── settings.json
├── CLAUDE.md
├── AGENTS.md
├── analysis_options.yaml
├── build.yaml
├── l10n.yaml
├── firebase.json
├── .firebaserc
├── pubspec.yaml
├── pubspec.lock
├── android/                     # native android (gradle, manifests)
├── ios/                         # native ios (Xcode workspace, Podfile)
├── web/                         # web entrypoint
├── functions/                   # Cloud Functions (TS)
│   ├── package.json
│   └── src/index.ts
├── firestore.rules
├── firestore.indexes.json
├── storage.rules
├── lib/
│   ├── main.dart                # shared entrypoint helper
│   ├── main_dev.dart            # flavor entry: dev
│   ├── main_stg.dart            # flavor entry: staging
│   ├── main_prod.dart           # flavor entry: prod
│   ├── bootstrap.dart           # shared init, error guards
│   ├── firebase_options_dev.dart
│   ├── firebase_options_stg.dart
│   ├── firebase_options_prod.dart
│   ├── app/
│   │   ├── app.dart             # root MaterialApp.router
│   │   ├── router.dart          # go_router config
│   │   └── theme.dart           # Material 3 theme + ThemeExtension
│   ├── core/
│   │   ├── env/env.dart         # --dart-define readers
│   │   ├── logger/log.dart      # logger + crashlytics sink
│   │   ├── errors/app_error.dart
│   │   └── result.dart          # sealed Result<T> via freezed
│   ├── data/
│   │   ├── repositories/        # one repo per domain
│   │   ├── sources/firestore/   # raw FirestoreSource per collection
│   │   ├── sources/storage/
│   │   └── converters/          # withConverter<T>() helpers
│   ├── domain/
│   │   ├── models/              # @freezed immutable models
│   │   └── usecases/            # one class per use case
│   ├── features/
│   │   └── <feature>/
│   │       ├── presentation/    # widgets + screens
│   │       ├── controllers/     # @riverpod AsyncNotifiers
│   │       └── widgets/
│   ├── shared/
│   │   ├── widgets/             # reusable UI atoms
│   │   └── extensions/
│   └── l10n/                    # generated AppLocalizations
├── assets/
│   ├── images/
│   ├── icons/
│   └── env/                     # dev.json, stg.json, prod.json (--dart-define-from-file)
├── test/
│   ├── unit/                    # mirrors lib/ structure
│   ├── widget/
│   └── helpers/                 # test container, fakes
└── integration_test/
    └── app_test.dart            # patrol-driven flows
```

### Naming Conventions

- Files: `snake_case.dart`. Generated siblings: `*.g.dart`, `*.freezed.dart`.
- Classes: `UpperCamelCase`. Providers: `lowerCamelCase` + `Provider` suffix only when not generated.
- Tests: mirror lib path; suffix `_test.dart`.
- Riverpod controllers: `<Feature>Controller` extending `_$<Feature>Controller`.
- Freezed models: `@freezed class Foo with _$Foo`.
- One public class per file; private helpers go in same file.

### "If You're Adding X, It Goes In Y"

| Artifact | Path |
|---|---|
| New screen | `lib/features/<feature>/presentation/<feature>_screen.dart` |
| New route | Append to `lib/app/router.dart` |
| New domain model | `lib/domain/models/<name>.dart` (freezed) |
| New repository | `lib/data/repositories/<name>_repository.dart` |
| New Firestore collection access | `lib/data/sources/firestore/<name>_source.dart` |
| New use case | `lib/domain/usecases/<verb>_<noun>_usecase.dart` |
| New AsyncNotifier | `lib/features/<feature>/controllers/<name>_controller.dart` |
| New widget (reusable) | `lib/shared/widgets/<name>.dart` |
| New widget (one-off) | colocate in feature dir |
| New extension method | `lib/shared/extensions/<type>_x.dart` |
| New constant | `lib/core/constants/<topic>_constants.dart` |
| New theme color/typography | `lib/app/theme.dart` |
| New env var | `assets/env/<flavor>.json` + reader in `lib/core/env/env.dart` |
| New translation key | `lib/l10n/intl_en.arb` (then run gen-l10n) |
| New unit test | `test/unit/<mirrors lib path>` |
| New widget test | `test/widget/<feature>/<screen>_test.dart` |
| New E2E flow | `integration_test/<flow>_test.dart` |
| New Cloud Function | `functions/src/<group>/<name>.ts` |
| New Firestore security rule | `firestore.rules` |
| New asset | `assets/images/` then declare in `pubspec.yaml` |

---

## 4. Architecture

### Process Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Flutter App (Dart)                                         │
│                                                              │
│  ┌────────────┐   ┌────────────┐   ┌────────────────┐       │
│  │ UI Widgets │──▶│ Controllers│──▶│ Repositories   │       │
│  │ (features/)│   │ (Riverpod) │   │ (data/repos)   │       │
│  └────────────┘   └────────────┘   └────────┬───────┘       │
│                                              │               │
│                                              ▼               │
│                                     ┌────────────────┐       │
│                                     │ Sources        │       │
│                                     │ (firestore /   │       │
│                                     │  storage /     │       │
│                                     │  functions /   │       │
│                                     │  auth)         │       │
│                                     └────────┬───────┘       │
└──────────────────────────────────────────────┼───────────────┘
                                               │ FlutterFire MethodChannel
                                               ▼
┌─────────────────────────────────────────────────────────────┐
│  Native (iOS Swift / Android Kotlin)                        │
│  Firebase iOS SDK / Firebase Android SDK                    │
└──────────────────────────────────────────┬──────────────────┘
                                           │ HTTPS / gRPC
                                           ▼
┌─────────────────────────────────────────────────────────────┐
│  Firebase Cloud (Auth, Firestore, Storage, Functions)       │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow (typical user action)

```
User taps button
   │
   ▼
Widget calls ref.read(controller.notifier).doThing()
   │
   ▼
Controller (AsyncNotifier) sets state = AsyncLoading()
   │
   ▼
Controller calls UseCase(repo).execute(input)
   │
   ▼
Repository calls Source.method() → FirestoreSource → cloud_firestore plugin
   │
   ▼
Native Firebase SDK → server → response (or stream tick)
   │
   ▼
Source maps DocumentSnapshot → freezed model via withConverter<T>
   │
   ▼
Repository returns Result<T>
   │
   ▼
Controller sets state = AsyncData(t) or AsyncError(e, st)
   │
   ▼
Widget rebuilds via ref.watch
```

### Auth Flow

```
App launch
   │
   ▼
bootstrap() initializes Firebase + AppCheck + Crashlytics
   │
   ▼
authStateChangesProvider (StreamProvider over FirebaseAuth.instance.authStateChanges)
   │
   ├─ null      → router redirects to /sign-in
   │
   └─ User u    → router allows /home (and child routes)
                  Crashlytics.setUserIdentifier(u.uid)
                  Firestore reads users/{uid} via withConverter
```

### State Management Flow

```
@riverpod class TodoController extends _$TodoController {
   @override Future<List<Todo>> build() => ref.watch(todoRepoProvider).watchAll().first;
   Future<void> add(String text) async { ... state = AsyncData(...); }
}

Widget tree
   ConsumerWidget
      ref.watch(todoControllerProvider)  ─┐
                                          ├─▶ rebuild on state change
      AsyncValue.when(                    │
        data: ..., loading: ..., error: ..)
```

### Entry-point File Map

| File | Responsibility |
|---|---|
| `lib/main_<flavor>.dart` | Sets `Env.flavor`, calls `bootstrap()` with right `firebase_options`. |
| `lib/bootstrap.dart` | `WidgetsFlutterBinding.ensureInitialized()`, Firebase init, Crashlytics guards, `runApp(ProviderScope(child: App()))`. |
| `lib/app/app.dart` | Root `MaterialApp.router` with theme + locale. |
| `lib/app/router.dart` | All routes; redirects based on `authStateChangesProvider`. |
| `lib/app/theme.dart` | M3 ColorScheme, ThemeExtension, dark + light. |
| `lib/core/env/env.dart` | Reads `--dart-define-from-file` JSON values. |
| `lib/core/logger/log.dart` | Configures `logger` and routes ERROR+ to Crashlytics. |

### Where Business Logic Lives

- Belongs in: `lib/domain/usecases/*` and `lib/data/repositories/*`.
- Does NOT live in: widgets, controllers (controllers orchestrate, they don't compute), Cloud Functions (functions are for server-side privileged ops only — payments, fan-out writes, mod webhooks).

---

## 5. Dev Workflow

### Start Dev Server

```bash
fvm flutter run --flavor dev --target lib/main_dev.dart \
  --dart-define-from-file=assets/env/dev.json
```

Watchers:
- Flutter tool watches `lib/**` and triggers hot reload on save.
- `build_runner watch` (separate terminal) regenerates `*.g.dart` / `*.freezed.dart`.

```bash
fvm dart run build_runner watch --delete-conflicting-outputs
```

### Hot Reload Behavior

- `r` reloads Dart code; preserves widget state. Works for: widget builds, methods, new private members.
- `R` (hot restart) re-runs `main()`. Required for: new freezed/g files, changed `main()`, changed providers added at root, native plugin changes, locale/theme switches.
- Hot reload BREAKS on: editing generated files directly (don't), changing enum values, adding fields to existing classes mid-session, native code changes.

### Debugger Attach

| Editor | Steps |
|---|---|
| VS Code | `.vscode/launch.json` configs (see §15); F5 to launch. |
| Cursor | Same as VS Code. |
| Android Studio / IntelliJ | Open project root → "Edit Configurations" → Flutter → pick `lib/main_dev.dart` + `--flavor dev`. |
| Xcode | Open `ios/Runner.xcworkspace`; attach to running process for native breakpoints. |
| Android Studio (native) | Open `android/` as separate project for Kotlin breakpoints. |

### Runtime Inspection

- DevTools: `fvm flutter pub global run devtools` or click the URL printed by `flutter run`. Use Inspector, Network, Performance, Memory, Provider tabs.
- Firestore: Firebase Console → Firestore → Data tab.
- Network: DevTools Network tab for HTTPS; Charles Proxy for raw socket inspection.
- Logs: `flutter logs` or DevTools console.
- Riverpod state: DevTools "Provider" tab (auto-detects ProviderScope).

### Pre-commit Checks

`.git/hooks/pre-commit` (also enforced in CI):

```bash
#!/usr/bin/env bash
set -e
fvm dart format --set-exit-if-changed .
fvm dart analyze --fatal-infos --fatal-warnings
fvm flutter test --reporter=compact
```

### Branch + Commit Conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`. No long-lived branches.
- Commits: Conventional Commits — `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`. Subject ≤72 chars. Body explains why.
- One PR ≈ one feature; squash-merge to `main`.

---

## 6. Testing & Parallelization

### Unit Tests

- Live in `test/unit/`. Mirror `lib/` path.
- Run all: `fvm flutter test`
- Single file: `fvm flutter test test/unit/data/repositories/todo_repository_test.dart`
- Single test: append `--name "creates todo"`.
- Watch mode: `fvm flutter test --watch` (Flutter 3.41+).

### Widget Tests

- Live in `test/widget/`.
- Use `ProviderScope(overrides: [...])` to inject fakes.
- Run: `fvm flutter test test/widget`.

### E2E (Patrol)

- Install CLI once: `dart pub global activate patrol_cli`
- Tests live in `integration_test/`.
- Run on iOS: `patrol test --target integration_test/app_test.dart --flavor dev --device "iPhone 16 Pro"`
- Run on Android: `patrol test --target integration_test/app_test.dart --flavor dev --device "Pixel_8_API_34"`
- Patrol shards across multiple devices automatically when `--shard-count` set.

### Parallel E2E Snippet (`patrol_cli` config in `pubspec.yaml`)

```yaml
patrol:
  app_name: MyApp
  android:
    package_name: com.example.myapp.dev
  ios:
    bundle_id: com.example.myapp.dev
```

### Mocking Rules

- Mock at the SOURCE boundary (`FirestoreSource`, `StorageSource`, `AuthSource`). Never mock Firestore plugin types directly.
- Never mock: pure Dart logic, freezed models, Riverpod providers (override them instead).
- Always mock: network sources, time (`Clock.fixed` from `package:clock`), random, push notification plugin.
- Use `mocktail`: `class MockTodoSource extends Mock implements TodoSource {}`.
- Provider override: `ProviderScope(overrides: [todoSourceProvider.overrideWithValue(MockTodoSource())])`.

### Coverage

- Target: ≥70% line coverage on `lib/data` and `lib/domain`. UI coverage tracked but not gated.
- Measure: `fvm flutter test --coverage`
- View: `genhtml coverage/lcov.info -o coverage/html && open coverage/html/index.html`
- CI uploads `coverage/lcov.info` to Codecov.

### Visual Regression

- `golden_toolkit` 0.16+. Goldens live in `test/widget/goldens/`.
- Update: `fvm flutter test --update-goldens`.
- Run goldens only on Linux runners (font rendering matches).

### Parallelization Patterns for AI Agents

Safe to fan out across subagents in parallel:
- Scaffolding multiple new domain models in disjoint files.
- Writing widget tests for separate features.
- Adding new screens that don't share a route group.
- Authoring docstrings.

Must run sequentially (mutex on a shared file):
- Anything touching `pubspec.yaml` / `pubspec.lock`.
- Anything editing `lib/app/router.dart`.
- Anything editing `firestore.rules` or `firestore.indexes.json`.
- `flutter pub add` / `flutter pub upgrade`.
- `build_runner build` (only one process at a time).
- `flutterfire configure` runs.

---

## 7. Logging

### Setup (`lib/core/logger/log.dart`)

```dart
import 'package:flutter/foundation.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:logger/logger.dart';

final log = Logger(
  printer: PrettyPrinter(methodCount: 0, colors: false, printEmojis: false),
  filter: ProductionFilter(),
  output: _CompositeOutput(),
  level: kReleaseMode ? Level.info : Level.debug,
);

class _CompositeOutput extends LogOutput {
  @override
  void output(OutputEvent event) {
    for (final line in event.lines) {
      // ignore: avoid_print
      print(line);
    }
    if (event.level.value >= Level.error.value && !kDebugMode) {
      FirebaseCrashlytics.instance.log(event.lines.join('\n'));
    }
  }
}
```

### Levels

| Level | Use for |
|---|---|
| `trace` | Loop-level noise. Off in release. |
| `debug` | Dev-only state dumps. Off in release. |
| `info` | App lifecycle, navigation, business events. |
| `warning` | Recoverable degraded paths. |
| `error` | Caught exceptions + stacktrace; routed to Crashlytics. |
| `fatal` | Process-killing failures; routed to Crashlytics with `recordError(fatal: true)`. |

### Required Fields on Every Log Line

`event`, `module`, `user_id` (if signed in), `session_id`, `flavor`, `app_version`. Pass via `log.i('user_signed_in', error: null, stackTrace: null, time: DateTime.now())` and a `Map` payload via the message arg.

### Sample Lines

```
INFO  [bootstrap] event=app_boot flavor=prod app_version=1.4.2 session=8a7f
INFO  [auth]      event=user_signed_in user_id=u_42 method=apple
WARN  [firestore] event=slow_query collection=todos duration_ms=2840
ERROR [todo_repo] event=create_failed err=PermissionDenied user_id=u_42
INFO  [router]    event=route_changed from=/home to=/todo/123 user_id=u_42
```

### Where Logs Go

- Dev: stdout via `flutter run`. Tail with `flutter logs`.
- Prod: Crashlytics (errors + breadcrumbs). For non-error structured logs, ship to Cloud Logging via a Cloud Function HTTPS endpoint or use `FirebaseAnalytics.logEvent` for product analytics.

### Grep Locally

```bash
flutter logs | grep -E "ERROR|event=.*"
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `fvm dart format . && fvm dart analyze && fvm flutter test` before declaring a task done.
2. Always pin Flutter via `.fvmrc` and call `fvm flutter` in every command.
3. Always declare the package in `pubspec.yaml` with `fvm flutter pub add <name>` — never hand-edit versions.
4. Always run `fvm dart run build_runner build --delete-conflicting-outputs` after changing any file with `@freezed`, `@JsonSerializable`, or `@riverpod`.
5. Always use `@riverpod` codegen — never write `Provider`, `StateNotifierProvider`, or `ChangeNotifierProvider` by hand.
6. Always check `if (!context.mounted) return;` after every `await` inside a widget callback.
7. Always check `if (!ref.mounted) return;` after every `await` inside a Notifier method.
8. Always wrap async controller work in `AsyncValue.guard` so errors flow into `state`.
9. Always read Firestore docs through `withConverter<T>()` so models are typed end-to-end.
10. Always cancel `StreamSubscription`s in `ref.onDispose` (or use `ref.listen`).
11. Always set `Crashlytics.setUserIdentifier(uid)` on sign-in and clear it on sign-out.
12. Always route ERROR-level logs through `FirebaseCrashlytics.instance.recordError`.
13. Always use `--flavor` flag when running, building, or testing.
14. Always read env vars from `Env` (compile-time `String.fromEnvironment`); never `Platform.environment`.
15. Always declare assets in `pubspec.yaml` under `flutter/assets:` after dropping a file in `assets/`.
16. Always run `flutterfire configure` after adding a new platform or new Firebase service.
17. Always write a widget test for every new screen (golden + interaction).
18. Always run `firebase deploy --only firestore:rules` after editing `firestore.rules` and verify in console.
19. Always bump `version:` in `pubspec.yaml` (semver + build number) before a store upload.
20. Always run E2E (`patrol test`) on at least one Android and one iOS device before tagging a release.
21. Always commit `pubspec.lock` to git.
22. Always use `const` constructors where the analyzer offers `prefer_const_constructors`.
23. Always prefer `ConsumerWidget` / `HookConsumerWidget` over `StatefulWidget` for screens.
24. Always read network state via a Repository; never `cloud_firestore` calls inside widgets.

### 8.2 NEVER

1. Never run `flutter pub upgrade --major-versions` without a dedicated PR + manual smoke run.
2. Never edit any `*.g.dart`, `*.freezed.dart`, `*.config.dart` file by hand.
3. Never use `setState` inside a `ConsumerWidget`/`HookConsumerWidget` for shared state — use Riverpod.
4. Never call `ref.watch` inside callbacks — use `ref.read` for one-shot reads.
5. Never use `Provider` package (`package:provider`) — Riverpod is the only state lib.
6. Never write `Future<void> _load() async { ...; setState(...); }` patterns; use `AsyncNotifier`.
7. Never call `Navigator.push` directly — use `context.go(...)` / `context.push(...)` from go_router.
8. Never read secrets from `String.fromEnvironment` defaults — fail loudly if unset.
9. Never bypass `AppCheck` in production builds.
10. Never leak `BuildContext` across an `await` without a `mounted` check.
11. Never store user PII in Crashlytics breadcrumbs other than the `uid`.
12. Never enable `nodeIntegration`-style escape hatches like `dart:io` in web builds; gate with `kIsWeb`.
13. Never disable null safety with `dynamic` to silence the analyzer.
14. Never call `FirebaseAuth.instance.signOut()` from a widget — go through `AuthRepository`.
15. Never use `print` in committed code; use `log.d/i/w/e`.
16. Never commit `google-services.json` or `GoogleService-Info.plist` for prod (dev/stg only); regenerate via `flutterfire configure` per environment.
17. Never run `firebase deploy` without specifying `--only` and a target project.
18. Never write Firestore rules that allow `read, write: if true`.
19. Never spawn isolates without `compute()` or `Isolate.run` — bare `Isolate.spawn` leaks easily.
20. Never bundle dev/staging Firebase config into a prod build.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `pubspec.yaml` | Every command | `fvm flutter pub get && fvm dart analyze && fvm flutter test` |
| `pubspec.lock` | Reproducible installs | `fvm flutter pub get --offline` succeeds |
| `analysis_options.yaml` | Lint output everywhere | `fvm dart analyze --fatal-infos` |
| `build.yaml` | All codegen | `fvm dart run build_runner build --delete-conflicting-outputs` |
| `lib/main_*.dart` | App entrypoint | `fvm flutter run --flavor <env>` boots without exception |
| `lib/bootstrap.dart` | Init order | Cold-launch on iOS + Android; verify Crashlytics init in console |
| `lib/app/router.dart` | Every route | Manual nav through every top-level screen + deep link test |
| `lib/app/theme.dart` | Every widget paint | Run golden tests; inspect light + dark mode |
| `lib/firebase_options_*.dart` | Firebase connectivity | App reads + writes once per platform |
| `firebase.json` | Deploy targets | `firebase deploy --dry-run` |
| `firestore.rules` | Every Firestore op | `firebase emulators:start --only firestore` + rules-tests pass |
| `firestore.indexes.json` | Query performance | `firebase deploy --only firestore:indexes` then run query in app |
| `storage.rules` | Every Storage op | Storage emulator rules-test |
| `functions/src/index.ts` | Every callable | `firebase emulators:start --only functions` + curl |
| `ios/Runner/Info.plist` | iOS capabilities | Build IPA, install on device, exercise feature |
| `ios/Podfile` | iOS native deps | `cd ios && pod install` clean; archive build |
| `android/app/build.gradle.kts` | Android build | `fvm flutter build apk --flavor prod` |
| `android/app/src/main/AndroidManifest.xml` | Android permissions | Install on device, verify intents work |
| `assets/env/*.json` | Compile-time env | `fvm flutter run --dart-define-from-file=...` reads correct values |
| `.fvmrc` | Toolchain version | `fvm flutter --version` matches |
| `lib/core/env/env.dart` | Every env read | Run all flavors; assert `Env.firebaseProjectId` matches |
| `lib/data/sources/firestore/*` | Domain data flow | Repo + integration tests green; manual UI verify |
| `lib/domain/models/*.dart` | Entire object graph | Build_runner regenerate; analyzer green; tests green |
| Any `@riverpod`-annotated file | Generated providers + dependents | `build_runner build`; `dart analyze`; widget tests |
| `.github/workflows/ci.yml` | Every PR | Push to a branch and inspect Actions run |

### 8.4 Definition of Done (per task type)

#### Bug Fix
- [ ] Repro test added and fails on `main`.
- [ ] Fix lands; repro test passes.
- [ ] `fvm dart analyze` clean.
- [ ] `fvm flutter test` full suite green.
- [ ] Manual smoke on one iOS sim + one Android emulator.
- [ ] Screenshot or log evidence in PR description.
- [ ] No unrelated formatting churn.

#### New Feature
- [ ] Domain model in `lib/domain/models` (freezed).
- [ ] Repository in `lib/data/repositories` with at least `success` + `failure` test.
- [ ] AsyncNotifier controller; widget tests cover loading/data/error.
- [ ] Route added to `lib/app/router.dart`.
- [ ] Deep-link tested: `flutter run --route=/path`.
- [ ] Patrol E2E for the happy path.
- [ ] `pubspec.yaml` updated only via `flutter pub add`.
- [ ] Screenshot of new screen attached.

#### Refactor
- [ ] Behavior unchanged: full unit + widget + E2E green pre-/post-.
- [ ] Coverage equal or better.
- [ ] No public API change without callsite update in same PR.
- [ ] No new dependencies.

#### Dependency Bump
- [ ] Single dependency or transitively-locked group per PR.
- [ ] Changelog read; breaking changes addressed.
- [ ] `build_runner build --delete-conflicting-outputs` re-run.
- [ ] Cold launch on both platforms.
- [ ] Lockfile committed.

#### Schema Change (Firestore / Functions)
- [ ] Migration script added (one-shot Function or Admin SDK script).
- [ ] `firestore.rules` updated and emulator tests pass.
- [ ] `firestore.indexes.json` updated for new queries.
- [ ] Backward-compatibility window: app handles old + new shape during rollout.
- [ ] Deployed to dev project first; verified with seed data.

#### Copy Change
- [ ] Edit `lib/l10n/intl_en.arb`.
- [ ] `fvm flutter gen-l10n` run.
- [ ] Widget test asserts new string.
- [ ] No changes outside `l10n/` and the call site.

### 8.5 Self-Verification Recipe

Run, in order:

```bash
fvm flutter pub get
fvm dart format --set-exit-if-changed .
fvm dart analyze --fatal-infos --fatal-warnings
fvm dart run build_runner build --delete-conflicting-outputs
fvm flutter test --reporter=compact
fvm flutter test integration_test --flavor dev
```

Expected output snippets ("green"):

- `dart format`: prints nothing, exit 0.
- `dart analyze`: `No issues found!`
- `build_runner build`: `[INFO] Succeeded after ...s with N outputs`.
- `flutter test`: `All tests passed!`
- `integration_test`: `All tests passed!`

Any other final line means NOT done.

### 8.6 Parallelization Patterns

- Safe parallel subagents (disjoint files): one per new domain model, one per new feature folder, one writing docs.
- Sequential-only (one at a time): editing `pubspec.yaml`, editing `router.dart`, running `build_runner`, running `flutterfire configure`, editing `firestore.rules`.
- Pattern: dispatch parallel subagents for "scaffold N independent screens"; collect; then run a single sequential agent to wire routes.

---

## 9. Stack-Specific Pitfalls

1. **Generated files out of date** → Symptom: `_$Foo` undefined, red squiggles after pull. Cause: forgot codegen. Fix: `fvm dart run build_runner build --delete-conflicting-outputs`. Detect: pre-commit hook + CI step.

2. **Hot reload silently no-op after codegen** → Symptom: changes to `@freezed` model don't take effect. Cause: hot reload can't load new types. Fix: hot restart (`R`). Detect: model field added; old shape still in widget.

3. **Reaching for `package:provider`** → Symptom: agent installs `provider` next to `flutter_riverpod`. Fix: remove; use `@riverpod` notifier. Detect: `pubspec.yaml` contains `provider:` line.

4. **`StreamSubscription` leak in widgets** → Symptom: memory grows, stale data after navigation. Fix: subscribe in Notifier with `ref.onDispose(sub.cancel)` or use `StreamProvider`. Detect: DevTools Memory tab shows growth across nav cycles.

5. **`BuildContext` after `await`** → Symptom: `_dependents.contains` exception. Fix: `if (!context.mounted) return;` after every await. Detect: analyzer rule `use_build_context_synchronously`.

6. **Unawaited Futures** → Symptom: errors swallowed, tests pass that shouldn't. Fix: `await` or explicitly `unawaited(...)`. Detect: `unawaited_futures` lint.

7. **`Provider` rebuild storms** → Symptom: every keystroke rebuilds half the tree. Cause: watching a parent provider in a child. Fix: `ref.watch(provider.select((s) => s.field))`. Detect: DevTools "Provider" tab.

8. **Missing `firebase_options.dart` for flavor** → Symptom: `[firebase_core/no-app]` at boot. Fix: `flutterfire configure --project=myapp-<flavor> --out=lib/firebase_options_<flavor>.dart`. Detect: app crashes immediately on cold launch.

9. **Editing generated file** → Symptom: changes vanish on next build. Fix: edit the source `.dart` file with the annotation; rerun build_runner. Detect: `.g.dart` shows in `git diff`.

10. **`google-services.json` missing in flavor build** → Symptom: Android build fails with "File google-services.json is missing". Fix: place under `android/app/src/<flavor>/google-services.json`. Detect: gradle build error.

11. **`Pod install` stale after upgrade** → Symptom: `Module not found` for FirebaseCore. Fix: `cd ios && pod deintegrate && pod install --repo-update`. Detect: Xcode build error in red.

12. **Firestore `withConverter` not used** → Symptom: maps everywhere, casting bugs. Fix: define `.withConverter<T>(fromFirestore:..., toFirestore:...)`. Detect: code review for raw `Map<String, dynamic>` reads.

13. **AppCheck blocks dev** → Symptom: `permission-denied` from Firestore in debug. Fix: register debug token in console or use debug provider. Detect: "App Check token" message in iOS console / `adb logcat`.

14. **`Cloud Functions` cold start in dev** → Symptom: first invoke takes 5+ seconds, test times out. Fix: pre-warm via emulator or set `minInstances: 1` for hot paths. Detect: Functions log shows cold-start time.

15. **Riverpod 3 retry loop** → Symptom: provider re-throws then retries silently. Cause: Riverpod 3 auto-retries by default. Fix: override with `Provider(retry: (_, __) => null)` for non-retryable errors. Detect: log floods with same error.

16. **`build_runner` lock contention** → Symptom: "Another build_runner is already running". Fix: kill stale dart processes (`pkill -9 -f build_runner`). Detect: command hangs forever.

17. **`go_router` redirect loop** → Symptom: app hangs on splash after auth state changes. Cause: redirect re-triggers itself. Fix: short-circuit when path already matches target. Detect: CPU pegged, no UI.

18. **iOS background fetch config** → Symptom: push token never arrives. Fix: enable Background Modes + Push Notifications in `Runner.entitlements`. Detect: APNs registration silent on device.

19. **`flutter_hooks` rule violation** → Symptom: "Hooks were called in different order". Fix: never call hooks inside `if/for`. Detect: framework error in red.

20. **Locale not loaded** → Symptom: `MaterialApp` shows English in es locale. Fix: include `localizationsDelegates` and `supportedLocales`; run `gen-l10n`. Detect: unit test asserting locale fallback.

---

## 10. Performance Budgets

| Metric | Budget | How to measure | Action if exceeded |
|---|---|---|---|
| Cold start (release) | <2.5 s on iPhone 13, <3.0 s on Pixel 6 | `flutter run --profile --trace-startup` | Defer non-essential init in `bootstrap.dart`; lazy-init Firebase modules. |
| First frame | <800 ms | DevTools Performance | Reduce initial widget tree depth. |
| Frame budget | 16.6 ms (60 Hz) / 8.3 ms (120 Hz) | DevTools Performance overlay | Profile with `--profile`; offload to `compute()`. |
| APK size | <40 MB per ABI | `flutter build apk --analyze-size --target-platform android-arm64` | Strip locales, drop unused fonts, enable R8. |
| iOS IPA size | <60 MB | Xcode Organizer report | Same plus `--split-debug-info`. |
| Memory at idle | <120 MB iOS, <180 MB Android | DevTools Memory | Audit image cache (`PaintingBinding.instance.imageCache`). |
| Battery (1h foreground) | <5% drain | Battery Historian (Android) / Xcode Energy Log | Reduce wakelocks, throttle Firestore listeners. |

When budget exceeded, file a bug, run `--analyze-size`, and gate merge on a perf review.

---

## 11. Security

### Secret Storage

- Compile-time only, via `--dart-define-from-file=assets/env/<flavor>.json`. The JSON is gitignored for prod; `.example.json` is committed.
- Never put: API keys for paid services, OAuth client secrets, JWT signing keys.
- Runtime secrets (per-user OAuth tokens) live in `flutter_secure_storage` (Keychain / Keystore).

### Auth Threat Model

- Anonymous users can read public catalog data only.
- Signed-in users can read/write their own document subtree (`/users/{uid}/...`).
- Admin role is set via custom claim `admin: true` from a Cloud Function gated by hard-coded allowlist.
- Cloud Functions enforce all paid actions (writes that cost money or change billing).

### Input Validation Boundary

- At the Repository layer: every input string passes a `reactive_forms` validator before any write.
- At the Cloud Function layer: re-validate; never trust the client.
- Firestore rules: schema-level type checks (`request.resource.data.title is string`).

### Output Escaping

- All user-rendered strings flow through `Text(...)` widgets, which never interpret HTML.
- HTML rendering forbidden: do not add `flutter_html`. Use `Markdown` widget with allowlist if needed.

### Permissions / Capabilities

`ios/Runner/Info.plist` snippet:

```xml
<key>NSCameraUsageDescription</key>
<string>MyApp uses the camera to scan codes.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MyApp uses photos to set your avatar.</string>
<key>UIBackgroundModes</key>
<array><string>remote-notification</string></array>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

`android/app/src/main/AndroidManifest.xml` permissions:

```xml
<uses-permission android:name="android.permission.INTERNET"/>
<uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES"/>
```

### Dependency Audit

- `fvm flutter pub outdated` weekly.
- `fvm flutter pub upgrade --dry-run` before bumping.
- Snyk or `osv-scanner` in CI on `pubspec.lock`.

### Top 5 Stack-specific Risks

1. Lax `firestore.rules` (`if true`) leaks the entire database — always emulator-test rules.
2. Bundling `google-services.json` with prod project into a debug APK leaks a real Firebase project — use flavors.
3. Storing tokens in `SharedPreferences` instead of `flutter_secure_storage` — easy on rooted devices.
4. Forgetting `App Check` enforcement — bots can write directly to Firestore and Storage.
5. Cloud Functions opened to `allowUnauthenticated` for callable endpoints — wrap with `request.auth` checks.

---

## 12. Deploy

### Release Flow (per platform)

```bash
# 0. Bump version in pubspec.yaml: version: 1.4.2+142
# 1. Cut release branch.
git checkout -b release/1.4.2

# 2. Verify everything green.
fvm flutter pub get
fvm dart analyze --fatal-infos
fvm flutter test
fvm flutter test integration_test --flavor prod

# 3. iOS: build, archive, upload to TestFlight.
cd ios && pod install --repo-update && cd ..
fvm flutter build ipa --flavor prod \
  --target lib/main_prod.dart \
  --dart-define-from-file=assets/env/prod.json \
  --export-options-plist=ios/ExportOptions.plist
xcrun altool --upload-app -f build/ios/ipa/myapp.ipa \
  -t ios -u "$APPLE_ID" -p "$APP_SPECIFIC_PASSWORD"

# 4. Android: build app bundle, upload to Play Internal.
fvm flutter build appbundle --flavor prod \
  --target lib/main_prod.dart \
  --dart-define-from-file=assets/env/prod.json
fastlane supply --aab build/app/outputs/bundle/prodRelease/app-prod-release.aab \
  --track internal --release_status draft

# 5. Deploy backend.
firebase deploy --only firestore:rules,firestore:indexes,storage,functions \
  --project myapp-prod
```

### Staging vs Prod

- `myapp-stg` Firebase project mirrors `myapp-prod`. Push to TestFlight external testers + Play closed testing track.
- Release flow above with `--flavor stg` and `assets/env/stg.json`.

### Rollback

- Stores: open Play Console / App Store Connect, halt rollout. New build required to reverse — no instant rollback.
- Firestore rules: `firebase deploy --only firestore:rules --project myapp-prod` with the previous git revision.
- Functions: `firebase functions:rollback <name> --project myapp-prod`.
- Max safe rollback window: until the next migration is shipped (treat schema changes as forward-only).

### Health Check

- Crashlytics dashboard: zero new fatal issues for 1 hour post-rollout.
- Firebase Performance: P95 app start within budget.
- Synthetic: Patrol nightly E2E run on the live build.

### Versioning

- `pubspec.yaml` `version: <semver>+<build>`. `1.4.2+142`. Build number monotonically increases per upload.
- Read at runtime via `package_info_plus`.

### Auto-update

- Stores handle updates. No bundled updater. Force-update path: a Remote Config flag `min_supported_build`; app checks on launch and shows blocking dialog with store link if below.

### DNS / Domain

- Web build: `firebase hosting:channel:deploy preview-<branch>`; production via `firebase deploy --only hosting`. Custom domain in Firebase Hosting console.

### Cost Estimate (1k MAU)

- Firebase Auth: free.
- Firestore: ~$0.06/k reads + $0.18/k writes; budget $5/mo for 1k MAU CRUD app.
- Storage: $0.026/GB; budget $1/mo for 50 GB.
- Cloud Functions (Blaze): free tier 2M invocations; budget $0–3/mo at 1k MAU.
- Crashlytics + App Check: free.
- Total: under $15/mo at 1k MAU on Blaze.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# CLAUDE.md — MyApp

This file is your contract. The full rulebook is `flutter-firebase.md` at repo root; read it once on first session.

## Stack
- Flutter 3.41.5, Dart 3.11, FlutterFire 4.12, Riverpod 3, go_router 16, freezed 3.
- iOS + Android + web. Flavors: dev, stg, prod.

## Always
- Run `fvm flutter` for every command.
- Run `fvm dart run build_runner build --delete-conflicting-outputs` after editing any `@freezed`, `@JsonSerializable`, or `@riverpod` source.
- Run `fvm dart format . && fvm dart analyze --fatal-infos && fvm flutter test` before reporting "done".
- Use `@riverpod` codegen for state. No `Provider` package, no `setState` for shared state.
- Use `withConverter<T>()` for every Firestore read.
- Check `if (!context.mounted)` after every `await` in widgets and `if (!ref.mounted)` in notifiers.
- Use go_router (`context.go`/`context.push`); never `Navigator.push`.

## Never
- Edit any `*.g.dart` / `*.freezed.dart` file by hand.
- Add `package:provider`. Riverpod is the only state lib.
- Run `flutter pub upgrade --major-versions` outside a dedicated dependency-bump PR.
- Bypass App Check in prod.
- Commit prod `google-services.json` / `GoogleService-Info.plist`.

## Key commands
- Run dev: `fvm flutter run --flavor dev --target lib/main_dev.dart --dart-define-from-file=assets/env/dev.json`
- Codegen: `fvm dart run build_runner build --delete-conflicting-outputs`
- Test: `fvm flutter test`
- E2E: `patrol test --flavor dev`
- Configure Firebase: `flutterfire configure --project=myapp-dev --out=lib/firebase_options_dev.dart`

## Skills to invoke
- `/test-driven-development` for new features.
- `/systematic-debugging` for any bug ≥10 minutes old.
- `/verification-before-completion` before claiming done.
- `/ship` when ready to release.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(fvm flutter:*)",
      "Bash(fvm dart:*)",
      "Bash(fvm:*)",
      "Bash(flutter:*)",
      "Bash(dart:*)",
      "Bash(pod install*)",
      "Bash(pod deintegrate*)",
      "Bash(pod repo update*)",
      "Bash(firebase deploy:*)",
      "Bash(firebase emulators:*)",
      "Bash(firebase projects:*)",
      "Bash(flutterfire configure:*)",
      "Bash(patrol test:*)",
      "Bash(patrol build:*)",
      "Bash(genhtml:*)",
      "Bash(git:*)",
      "Bash(gh:*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {"type": "command", "command": "fvm dart format $CLAUDE_FILE_PATH 2>/dev/null || true"}
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {"type": "command", "command": "echo '[claude] running:' \"$CLAUDE_TOOL_INPUT\""}
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {"type": "command", "command": "fvm dart analyze --fatal-infos --fatal-warnings && fvm flutter test --reporter=compact"}
        ]
      }
    ]
  }
}
```

### Slash-command Shortcuts

- `/codegen` → `fvm dart run build_runner build --delete-conflicting-outputs`
- `/runprod` → `fvm flutter run --flavor prod --target lib/main_prod.dart --dart-define-from-file=assets/env/prod.json --release`
- `/ffconfig dev` → `flutterfire configure --project=myapp-dev --out=lib/firebase_options_dev.dart --platforms=ios,android,web`
- `/emu` → `firebase emulators:start --only firestore,functions,auth,storage`

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# AGENTS.md — MyApp

Codex agent: read `flutter-firebase.md` at repo root once per session. The non-negotiables below override any conflicting default.

## Toolchain
- `fvm flutter` for every flutter call. Never bare `flutter`.
- Dart 3.11, Flutter 3.41.5 pinned via `.fvmrc`.

## Workflow
1. Read the relevant files, never blind-edit.
2. After each code change: run `fvm dart run build_runner build --delete-conflicting-outputs` if any annotation changed; then `fvm dart analyze --fatal-infos`.
3. Before claiming done: full self-verification recipe (see rulebook §8.5).

## Rules
- State management: `@riverpod` codegen. No bare `Provider`/`StateProvider`.
- Navigation: go_router only. `context.go(...)`.
- Models: `@freezed` + `@JsonSerializable`. Never hand-write `copyWith`.
- Always check `mounted` after `await`.
- Firestore: typed via `withConverter<T>`.

## Sandbox / approvals
- Approve: `fvm`, `dart`, `flutter`, `firebase emulators`, `pod install`, `git`, `gh`.
- Ask: anything that mutates a real Firebase project (`firebase deploy`, `flutterfire configure`).

## Differences from Claude Code
- Codex defaults are more conservative on multi-file edits — explicitly grant write scope to `lib/`, `test/`, `integration_test/`, `assets/env/`.
- Codex tends to over-explain — set `succinct: true` in `.codex/config.toml`.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
sandbox = "workspace-write"
approval_policy = "on-request"
succinct = true

[shell]
allow = [
  "fvm",
  "dart",
  "flutter",
  "firebase",
  "flutterfire",
  "patrol",
  "pod",
  "git",
  "gh",
  "genhtml",
]

[[mcp_servers]]
name = "firebase"
enabled = false
```

### Where Codex Differs

- Codex sometimes runs `flutter pub get` directly; force `fvm flutter pub get` via the allowlist note.
- Codex defaults to single-file edits; explicitly request "edit X and Y in one patch" for cross-cutting changes.
- Codex won't auto-run codegen; add a Stop hook equivalent or remind it after each annotation change.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Always
- Use fvm: every command starts with `fvm flutter` or `fvm dart`.
- Run codegen after editing any @freezed / @JsonSerializable / @riverpod source: `fvm dart run build_runner build --delete-conflicting-outputs`.
- Use Riverpod 3 with @riverpod codegen. Never use package:provider, ChangeNotifierProvider, or StateNotifier.
- Use go_router 16. Navigate with context.go / context.push. No Navigator.push.
- Use freezed 3 for all models. Never hand-write copyWith / equality / toJson.
- Use withConverter<T>() for every Firestore collection read.
- Check `if (!context.mounted) return;` after every await inside widget callbacks.
- Check `if (!ref.mounted) return;` after every await inside Notifier methods.
- Wrap async controller work in AsyncValue.guard.
- Cancel StreamSubscriptions via ref.onDispose.
- Use ConsumerWidget or HookConsumerWidget; avoid raw StatefulWidget for screens.
- Read env via Env class (--dart-define). Never Platform.environment.
- Always include --flavor flag in run/build/test.

# Never
- Never edit *.g.dart, *.freezed.dart, *.config.dart by hand.
- Never run `flutter pub upgrade --major-versions` casually.
- Never use setState for shared state inside ConsumerWidget.
- Never call ref.watch inside callbacks; use ref.read.
- Never use print() in committed code; use the `log` instance.
- Never bypass AppCheck in prod builds.
- Never store secrets in SharedPreferences.
- Never write Firestore rules that match `if true`.
- Never commit prod google-services.json / GoogleService-Info.plist.
- Never call Navigator.push directly.
- Never bundle dev/staging Firebase config into a prod build.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "Dart-Code.dart-code",
    "Dart-Code.flutter",
    "alexisvt.flutter-snippets",
    "robert-brunhage.flutter-riverpod-snippets",
    "redhat.vscode-yaml",
    "tamasfe.even-better-toml",
    "GitHub.vscode-pull-request-github",
    "google.geminicodeassist"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "MyApp Dev (debug)",
      "request": "launch",
      "type": "dart",
      "program": "lib/main_dev.dart",
      "args": [
        "--flavor", "dev",
        "--dart-define-from-file=assets/env/dev.json"
      ]
    },
    {
      "name": "MyApp Staging (profile)",
      "request": "launch",
      "type": "dart",
      "flutterMode": "profile",
      "program": "lib/main_stg.dart",
      "args": [
        "--flavor", "stg",
        "--dart-define-from-file=assets/env/stg.json"
      ]
    },
    {
      "name": "MyApp Prod (release)",
      "request": "launch",
      "type": "dart",
      "flutterMode": "release",
      "program": "lib/main_prod.dart",
      "args": [
        "--flavor", "prod",
        "--dart-define-from-file=assets/env/prod.json"
      ]
    },
    {
      "name": "Test current file",
      "request": "launch",
      "type": "dart",
      "program": "${file}"
    }
  ]
}
```

---

## 16. First-PR Scaffold

The list below, executed top-to-bottom, yields a deployable hello-world.

### 1. `.fvmrc`

```json
{"flutter": "3.41.5", "flavors": {}}
```

### 2. `.gitignore` (additions to default Flutter)

```
.fvm/
.env
assets/env/prod.json
assets/env/stg.json
ios/Runner/GoogleService-Info.plist
android/app/google-services.json
**/firebase_options_prod.dart
coverage/
build/
```

### 3. `pubspec.yaml`

```yaml
name: myapp
description: A Flutter + Firebase app.
publish_to: none
version: 0.1.0+1

environment:
  sdk: ">=3.11.0 <4.0.0"
  flutter: ">=3.41.0"

dependencies:
  flutter:
    sdk: flutter
  flutter_localizations:
    sdk: flutter
  intl: ^0.20.2
  flutter_riverpod: ^3.3.1
  riverpod_annotation: ^3.0.3
  go_router: ^16.0.0
  freezed_annotation: ^3.0.0
  json_annotation: ^4.9.0
  firebase_core: ^4.12.0
  firebase_auth: ^6.0.0
  cloud_firestore: ^6.0.0
  firebase_storage: ^13.0.0
  cloud_functions: ^6.0.0
  firebase_crashlytics: ^5.0.0
  firebase_app_check: ^0.4.0
  flutter_hooks: ^0.21.0
  flutter_secure_storage: ^10.0.0
  package_info_plus: ^9.0.0
  logger: ^2.4.0

dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  build_runner: ^2.10.4
  freezed: ^3.5.0
  json_serializable: ^6.9.4
  riverpod_generator: ^3.0.3
  riverpod_lint: ^3.0.3
  custom_lint: ^0.8.0
  very_good_analysis: ^9.0.0
  mocktail: ^1.0.4
  patrol: ^3.16.0
  golden_toolkit: ^0.16.0

flutter:
  uses-material-design: true
  generate: true
  assets:
    - assets/env/dev.json
    - assets/env/stg.json
    - assets/env/prod.json
    - assets/images/
```

### 4. `analysis_options.yaml`

```yaml
include: package:very_good_analysis/analysis_options.9.0.0.yaml

analyzer:
  language:
    strict-casts: true
    strict-inference: true
    strict-raw-types: true
  errors:
    invalid_annotation_target: ignore
  exclude:
    - "**/*.g.dart"
    - "**/*.freezed.dart"
    - "**/*.config.dart"
  plugins:
    - custom_lint

linter:
  rules:
    public_member_api_docs: false
    avoid_print: error
    use_build_context_synchronously: error
    unawaited_futures: error
```

### 5. `build.yaml`

```yaml
targets:
  $default:
    builders:
      freezed:freezed:
        options:
          build_extensions:
            ".dart": [".freezed.dart"]
      json_serializable:json_serializable:
        options:
          explicit_to_json: true
          field_rename: snake
          checked: true
      riverpod_generator:riverpod_generator:
        options: {}
```

### 6. `l10n.yaml`

```yaml
arb-dir: lib/l10n
template-arb-file: intl_en.arb
output-localization-file: app_localizations.dart
output-class: AppLocalizations
nullable-getter: false
```

### 7. `firebase.json`

```json
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {"rules": "storage.rules"},
  "functions": [
    {
      "source": "functions",
      "codebase": "default",
      "predeploy": ["npm --prefix \"$RESOURCE_DIR\" run build"],
      "runtime": "nodejs20"
    }
  ],
  "hosting": {
    "public": "build/web",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [{"source": "**", "destination": "/index.html"}]
  },
  "emulators": {
    "auth": {"port": 9099},
    "firestore": {"port": 8080},
    "functions": {"port": 5001},
    "storage": {"port": 9199},
    "ui": {"enabled": true, "port": 4000}
  }
}
```

### 8. `.firebaserc`

```json
{
  "projects": {
    "default": "myapp-dev",
    "dev": "myapp-dev",
    "stg": "myapp-stg",
    "prod": "myapp-prod"
  }
}
```

### 9. `firestore.rules`

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if request.auth != null && request.auth.uid == uid;

      match /todos/{todoId} {
        allow read, write: if request.auth != null && request.auth.uid == uid;
      }
    }

    match /{path=**} {
      allow read, write: if false;
    }
  }
}
```

### 10. `firestore.indexes.json`

```json
{"indexes": [], "fieldOverrides": []}
```

### 11. `storage.rules`

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{uid}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
  }
}
```

### 12. `assets/env/dev.json`

```json
{
  "FLAVOR": "dev",
  "FIREBASE_PROJECT_ID": "myapp-dev",
  "API_BASE_URL": "https://api.dev.myapp.example"
}
```

`assets/env/stg.json` and `assets/env/prod.json` follow the same shape with appropriate values. `prod.json` is gitignored.

### 13. `lib/core/env/env.dart`

```dart
class Env {
  static const flavor = String.fromEnvironment('FLAVOR', defaultValue: 'dev');
  static const firebaseProjectId =
      String.fromEnvironment('FIREBASE_PROJECT_ID', defaultValue: '');
  static const apiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: '');

  static void assertConfigured() {
    if (firebaseProjectId.isEmpty) {
      throw StateError('FIREBASE_PROJECT_ID is empty. Did you pass --dart-define-from-file?');
    }
  }
}
```

### 14. `lib/bootstrap.dart`

```dart
import 'dart:async';

import 'package:firebase_app_check/firebase_app_check.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_crashlytics/firebase_crashlytics.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/app.dart';
import 'core/env/env.dart';

Future<void> bootstrap(FirebaseOptions options) async {
  WidgetsFlutterBinding.ensureInitialized();
  Env.assertConfigured();

  await runZonedGuarded<Future<void>>(
    () async {
      await Firebase.initializeApp(options: options);

      await FirebaseAppCheck.instance.activate(
        androidProvider: kDebugMode ? AndroidProvider.debug : AndroidProvider.playIntegrity,
        appleProvider: kDebugMode ? AppleProvider.debug : AppleProvider.deviceCheck,
      );

      FlutterError.onError = FirebaseCrashlytics.instance.recordFlutterFatalError;
      PlatformDispatcher.instance.onError = (error, stack) {
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true);
        return true;
      };

      runApp(const ProviderScope(child: App()));
    },
    (error, stack) =>
        FirebaseCrashlytics.instance.recordError(error, stack, fatal: true),
  );
}
```

### 15. `lib/main_dev.dart`

```dart
import 'bootstrap.dart';
import 'firebase_options_dev.dart';

void main() => bootstrap(DefaultFirebaseOptions.currentPlatform);
```

`lib/main_stg.dart` and `lib/main_prod.dart` follow the same pattern with their respective `firebase_options_*.dart`.

### 16. `lib/app/app.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'router.dart';
import 'theme.dart';

class App extends ConsumerWidget {
  const App({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final router = ref.watch(routerProvider);
    return MaterialApp.router(
      title: 'MyApp',
      theme: appTheme(Brightness.light),
      darkTheme: appTheme(Brightness.dark),
      routerConfig: router,
    );
  }
}
```

### 17. `lib/app/theme.dart`

```dart
import 'package:flutter/material.dart';

ThemeData appTheme(Brightness brightness) {
  final scheme = ColorScheme.fromSeed(
    seedColor: const Color(0xFF6750A4),
    brightness: brightness,
  );
  return ThemeData(
    colorScheme: scheme,
    useMaterial3: true,
    textTheme: Typography.material2021(platform: TargetPlatform.iOS).black,
  );
}
```

### 18. `lib/app/router.dart`

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../features/home/presentation/home_screen.dart';
import '../features/sign_in/presentation/sign_in_screen.dart';

part 'router.g.dart';

@riverpod
GoRouter router(RouterRef ref) {
  final auth = FirebaseAuth.instance;
  return GoRouter(
    initialLocation: '/',
    refreshListenable: GoRouterRefreshStream(auth.authStateChanges()),
    redirect: (context, state) {
      final signedIn = auth.currentUser != null;
      final goingToSignIn = state.matchedLocation == '/sign-in';
      if (!signedIn && !goingToSignIn) return '/sign-in';
      if (signedIn && goingToSignIn) return '/';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const HomeScreen()),
      GoRoute(path: '/sign-in', builder: (_, __) => const SignInScreen()),
    ],
  );
}
```

### 19. `lib/features/home/presentation/home_screen.dart`

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScreen extends ConsumerWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Home')),
      body: const Center(child: Text('Hello, world.')),
    );
  }
}
```

### 20. `lib/features/sign_in/presentation/sign_in_screen.dart`

```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

class SignInScreen extends ConsumerWidget {
  const SignInScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(title: const Text('Sign in')),
      body: Center(
        child: FilledButton(
          onPressed: () =>
              FirebaseAuth.instance.signInAnonymously(),
          child: const Text('Continue anonymously'),
        ),
      ),
    );
  }
}
```

### 21. `lib/l10n/intl_en.arb`

```json
{
  "@@locale": "en",
  "appTitle": "MyApp",
  "@appTitle": {"description": "App name"}
}
```

### 22. `test/unit/smoke_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('truthiness', () {
    expect(1 + 1, 2);
  });
}
```

### 23. `integration_test/app_test.dart`

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:patrol/patrol.dart';

import 'package:myapp/main_dev.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  patrolTest('cold launch shows sign-in', (PatrolIntegrationTester $) async {
    app.main();
    await $.pumpAndSettle();
    await $('Sign in').waitUntilVisible();
  });
}
```

### 24. `.github/workflows/ci.yml`

```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.41.5'
          channel: 'stable'
          cache: true
      - run: flutter pub get
      - run: dart format --set-exit-if-changed .
      - run: dart analyze --fatal-infos --fatal-warnings
      - run: dart run build_runner build --delete-conflicting-outputs
      - run: flutter test --coverage
      - uses: codecov/codecov-action@v4
        with:
          files: coverage/lcov.info

  build-android:
    runs-on: ubuntu-latest
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: {distribution: temurin, java-version: '17'}
      - uses: subosito/flutter-action@v2
        with: {flutter-version: '3.41.5', channel: stable, cache: true}
      - run: flutter pub get
      - run: dart run build_runner build --delete-conflicting-outputs
      - run: |
          mkdir -p assets/env
          echo '${{ secrets.ENV_DEV_JSON }}' > assets/env/dev.json
      - run: flutter build apk --flavor dev --target lib/main_dev.dart --dart-define-from-file=assets/env/dev.json --debug

  build-ios:
    runs-on: macos-14
    needs: test
    steps:
      - uses: actions/checkout@v4
      - uses: subosito/flutter-action@v2
        with: {flutter-version: '3.41.5', channel: stable, cache: true}
      - run: flutter pub get
      - run: dart run build_runner build --delete-conflicting-outputs
      - run: |
          mkdir -p assets/env
          echo '${{ secrets.ENV_DEV_JSON }}' > assets/env/dev.json
      - run: flutter build ios --flavor dev --target lib/main_dev.dart --dart-define-from-file=assets/env/dev.json --no-codesign --simulator
```

### 25. `ios/Runner/Info.plist` snippet (key entries)

```xml
<key>CFBundleDisplayName</key>
<string>MyApp</string>
<key>CFBundleShortVersionString</key>
<string>$(FLUTTER_BUILD_NAME)</string>
<key>CFBundleVersion</key>
<string>$(FLUTTER_BUILD_NUMBER)</string>
<key>NSCameraUsageDescription</key>
<string>MyApp uses the camera to scan codes.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>MyApp uses photos to set your avatar.</string>
<key>UIBackgroundModes</key>
<array>
  <string>remote-notification</string>
</array>
<key>ITSAppUsesNonExemptEncryption</key>
<false/>
```

### 26. `android/app/build.gradle.kts` snippet (flavors block)

```kotlin
plugins {
    id("com.android.application")
    id("kotlin-android")
    id("dev.flutter.flutter-gradle-plugin")
    id("com.google.gms.google-services")
    id("com.google.firebase.crashlytics")
}

android {
    namespace = "com.example.myapp"
    compileSdk = 35
    ndkVersion = flutter.ndkVersion

    defaultConfig {
        applicationId = "com.example.myapp"
        minSdk = 23
        targetSdk = 35
        versionCode = flutter.versionCode
        versionName = flutter.versionName
    }

    flavorDimensions += "env"
    productFlavors {
        create("dev") {
            dimension = "env"
            applicationIdSuffix = ".dev"
            versionNameSuffix = "-dev"
        }
        create("stg") {
            dimension = "env"
            applicationIdSuffix = ".stg"
            versionNameSuffix = "-stg"
        }
        create("prod") {
            dimension = "env"
        }
    }

    buildTypes {
        release {
            signingConfig = signingConfigs.getByName("debug")
            isMinifyEnabled = true
            isShrinkResources = true
        }
    }
}
```

### 27. `README.md` (stub)

```markdown
# MyApp
Flutter + Firebase. See `flutter-firebase.md` for the full operational rulebook.

## Run
```
fvm install
fvm flutter pub get
fvm dart run build_runner build --delete-conflicting-outputs
fvm flutter run --flavor dev --target lib/main_dev.dart --dart-define-from-file=assets/env/dev.json
```
```

### 28. `LICENSE`

MIT.

After running through this list and `git push`, CI builds green and you can run on a device.

---

## 17. Idea → MVP Path (Generic CRUD)

### Phase 1 — Schema (1 session)
- Define core entities as `@freezed` models in `lib/domain/models/`.
- Sketch Firestore collections: `users/{uid}/items/{itemId}`.
- Write `firestore.rules` for that shape; add emulator rule tests.
- Files touched: 4–6.
- Exit: `dart run build_runner build` green; emulator rule tests pass.

### Phase 2 — Backbone (1 session)
- Stand up `lib/app/router.dart` with sign-in, list, detail, edit routes.
- Empty screens that show `Scaffold(body: Center(...))`.
- Skeleton `AsyncNotifier` per screen returning `[]`.
- Files: 8–10.
- Exit: app cold-starts; navigation works; widget tests for routes pass.

### Phase 3 — Vertical Slice (2 sessions)
- Wire one feature end-to-end: list items → tap → detail → edit → save.
- Repository writes through `withConverter<T>` to Firestore.
- Loading + error states surfaced via `AsyncValue.when`.
- Patrol E2E for create-list-edit-delete loop.
- Exit: full CRUD round-trip on emulator + real Firestore.

### Phase 4 — Auth + Multi-user (1 session)
- Email + Google + Apple sign-in via `firebase_auth`.
- `Crashlytics.setUserIdentifier` on auth state change.
- Verify rules block cross-user reads via emulator test.
- Exit: two simulators with different accounts cannot read each other's data.

### Phase 5 — Ship + Monitor (1 session)
- Bump `pubspec.yaml` version; build IPA + AAB; upload to TestFlight + Play Internal.
- Deploy `firestore.rules`, `functions`, `storage` to prod.
- Crashlytics + Firebase Performance dashboards confirmed clean for 1 hour.
- Exit: external tester downloads from TestFlight, completes one CRUD flow, no Crashlytics events.

---

## 18. Feature Recipes

### 18.1 Email/Password + Google + Apple Auth

1. Add packages: `fvm flutter pub add firebase_auth google_sign_in sign_in_with_apple`.
2. Enable providers in Firebase Console → Authentication → Sign-in method.
3. iOS: add Apple capability in Xcode → Signing & Capabilities → "Sign in with Apple".
4. iOS: in `Info.plist`, add URL scheme matching reversed client ID for Google.
5. Android: add SHA1/SHA256 to Firebase project (`./gradlew signingReport`).
6. Implement `AuthRepository` in `lib/data/repositories/auth_repository.dart`:

```dart
class AuthRepository {
  AuthRepository(this._auth);
  final FirebaseAuth _auth;
  Stream<User?> authState() => _auth.authStateChanges();
  Future<UserCredential> signInWithEmail(String email, String password) =>
      _auth.signInWithEmailAndPassword(email: email, password: password);
  Future<void> signOut() => _auth.signOut();
}
```

7. Expose with `@riverpod` provider.
8. Write widget tests for sign-in screen and integration test that completes anonymous → email upgrade.

### 18.2 File Upload + Storage

1. `fvm flutter pub add firebase_storage image_picker`.
2. iOS Info.plist: `NSPhotoLibraryUsageDescription`, `NSCameraUsageDescription`.
3. Android manifest: `READ_MEDIA_IMAGES`.
4. Storage rules permit `users/{uid}/...`.
5. Use `XFile` from `image_picker`, upload via `FirebaseStorage.instance.ref('users/$uid/avatar.jpg').putFile(File(file.path))`.
6. Persist downloadURL in Firestore user doc.
7. E2E: pick from photo gallery → assert URL appears in Firestore.

### 18.3 In-app Purchases (mobile-native; not Stripe)

1. `fvm flutter pub add in_app_purchase`.
2. App Store Connect: configure product IDs.
3. Play Console: configure product IDs.
4. Implement listener for `purchaseStream`, complete purchase server-side via Cloud Function calling Apple/Google verification APIs.
5. Cloud Function writes entitlement to `users/{uid}/entitlements/{productId}`.
6. UI gates premium features on `entitlementProvider`.

### 18.4 Push Notifications (FCM)

1. `fvm flutter pub add firebase_messaging flutter_local_notifications`.
2. iOS: enable Push + Background Modes (Remote notifications).
3. iOS: upload APNs auth key to Firebase Console.
4. Android: add `POST_NOTIFICATIONS` permission and request at runtime on Android 13+.
5. Register FCM token on auth and store under `users/{uid}/devices/{deviceId}`.
6. Send via Cloud Function trigger.

### 18.5 Background Jobs / Cron

1. Cloud Scheduler triggers HTTPS Cloud Function every N minutes.
2. Function uses Admin SDK to mutate Firestore; protected by IAM (no public invoker).
3. `firebase deploy --only functions:scheduledClean`.

### 18.6 Realtime Updates

- Firestore is realtime by default. Expose via `StreamProvider` over `collection.snapshots()`. Riverpod 3 pauses the subscription automatically when no listeners.

### 18.7 Search

- Small datasets (<10k docs): Algolia extension via Firebase Extensions.
- Larger: Typesense, exposed through Cloud Function HTTPS endpoint.
- Never query-search Firestore by `where('title', '>=', q)` for typeahead — it's wrong-shaped.

### 18.8 Internationalization

1. `flutter:` block `generate: true` in `pubspec.yaml`.
2. `l10n.yaml` configured (see scaffold §6).
3. ARB files in `lib/l10n/`.
4. `fvm flutter gen-l10n` (or run automatically on save via tool).
5. Use `AppLocalizations.of(context)!.appTitle`.

### 18.9 Dark Mode

- `MaterialApp.router(theme: appTheme(Brightness.light), darkTheme: appTheme(Brightness.dark))`. System-driven by default. Override via `themeMode` provider.

### 18.10 Analytics Events

1. `fvm flutter pub add firebase_analytics`.
2. Wrap go_router with `FirebaseAnalyticsObserver` (`observers: [FirebaseAnalyticsObserver(analytics: ...)]`).
3. Custom events: `FirebaseAnalytics.instance.logEvent(name: 'todo_created', parameters: {...})`.
4. Define a typed `AnalyticsEvent` sealed class via freezed; never sprinkle string literals.

---

## 19. Troubleshooting

| # | Error (verbatim) | Fix |
|---|---|---|
| 1 | `Error: Member not found: '_$Foo'.` | `fvm dart run build_runner build --delete-conflicting-outputs` |
| 2 | `[firebase_core/no-app] No Firebase App '[DEFAULT]' has been created` | Add `await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform)` before any other Firebase call. |
| 3 | `MissingPluginException(No implementation found for method ... on channel ...)` | Stop the app, `fvm flutter clean`, restart. Native plugins were added since last full build. |
| 4 | `CocoaPods could not find compatible versions for pod "Firebase/Auth"` | `cd ios && pod repo update && pod install`. |
| 5 | `error: file not found: GoogleService-Info.plist` | Run `flutterfire configure` for the matching flavor; verify the file is referenced in `Runner.xcodeproj` under correct target. |
| 6 | `Execution failed for task ':app:processDebugGoogleServices'. File google-services.json is missing.` | Place `google-services.json` under `android/app/src/<flavor>/google-services.json`. |
| 7 | `Hot reload not supported because new types were added` | Press `R` for hot restart. |
| 8 | `setState() called after dispose()` | Replace with Riverpod state, or guard with `if (!mounted) return;`. |
| 9 | `Error running pod install` `non-modular header` | In Podfile, ensure `use_frameworks!` and `:linkage => :static` are not both set unless required. |
| 10 | `flutter: A RenderFlex overflowed by N pixels on the bottom.` | Wrap content in `SingleChildScrollView` or use `Expanded`. |
| 11 | `Bad state: Stream has already been listened to.` | Use `.asBroadcastStream()` once at source, or use `StreamProvider`. |
| 12 | `[firebase_auth/network-request-failed]` | Verify device/emulator has internet; check App Check isn't blocking. |
| 13 | `[cloud_firestore/permission-denied]` | Check `firestore.rules` and that user is signed in; emulator test it. |
| 14 | `error: invalid_grant Token has been expired or revoked` | `firebase login --reauth`. |
| 15 | `Multiple plugins use the same method name` | Run `fvm flutter pub upgrade --major-versions` carefully; resolve via `dependency_overrides`. |
| 16 | `Could not find or load main class org.gradle.wrapper.GradleWrapperMain` | Re-run `fvm flutter create .` over the existing project to regenerate gradle wrapper. |
| 17 | `Type 'AsyncValue' not found.` | `import 'package:flutter_riverpod/flutter_riverpod.dart';` |
| 18 | `setState() or markNeedsBuild() called during build.` | Move state mutation into `WidgetsBinding.instance.addPostFrameCallback` or controller. |
| 19 | `RangeError (length): Invalid value: ...` | Use `firstOrNull` / `elementAtOrNull`; never bare `[i]` on user-driven indices. |
| 20 | `An error occurred while activating riverpod_lint` | Add both `riverpod_lint` and `custom_lint` to dev_dependencies, then `fvm flutter pub get`. |
| 21 | `error: Sandbox: bash(...) deny(1) file-write-create` (iOS build) | Disable "User Script Sandboxing" in Xcode build settings (see Flutter known issues). |
| 22 | `App Check token validation failed.` | Register debug token from Xcode/logcat output in Firebase Console → App Check → Debug tokens. |
| 23 | `ProviderException: Bad state: Future already completed` | An AsyncNotifier's `build()` is computing twice; gate with `Completer` or use `ref.cacheFor`. |
| 24 | `FormatException: Unexpected character (at character 1)` (env file) | Your `--dart-define-from-file` JSON is malformed; jq it: `jq . assets/env/dev.json`. |
| 25 | `error: 'flutter' is not recognized as an internal or external command` | You skipped FVM PATH setup; rerun §2 step. |
| 26 | `Could not find an option named "--flavor"` | Update package; older versions of plugins may not pass through. Use `--dart-define=FLAVOR=dev` as fallback. |
| 27 | `fatal: not a git repository` (in CI) | Add `actions/checkout@v4` step. |
| 28 | `Failed assertion: line ##: '<= 0xFFFF': is not true.` | Asset image too large; resize <10MB. |
| 29 | `unable to find utility "altool"` | `xcode-select --install`; reinstall Xcode CLT. |
| 30 | `Patrol failed: app didn't start within 60 seconds` | Pass `--connect-timeout 180s`; pre-build with `patrol build`. |

---

## 20. Glossary

- **AAB** — Android App Bundle, the upload format Play requires.
- **Annotation** — `@something` decorator on a class/function used by code generators.
- **APK** — Android application package, the installable bundle.
- **App Check** — Firebase service that proves requests come from your real app.
- **AsyncNotifier** — Riverpod controller whose state is `AsyncValue<T>`.
- **AsyncValue** — A union of loading/data/error states.
- **Build Runner** — Dart tool that runs code generators (freezed, json_serializable, riverpod_generator).
- **Bundle ID / Package Name** — Unique identifier for an iOS / Android app (`com.example.myapp`).
- **Cloud Functions** — Firebase serverless backend code (Node.js).
- **Codegen** — Code generation; output files end in `.g.dart` / `.freezed.dart`.
- **CocoaPods** — iOS native dependency manager.
- **Dart** — The language Flutter is written in.
- **Dart-define** — Compile-time string constants passed via `--dart-define`.
- **DevTools** — Browser-based Flutter debugger/profiler.
- **Emulator (Android)** — Virtual Android device that runs on your computer.
- **Firebase** — Backend-as-a-service from Google (Auth, DB, Storage, Functions).
- **Firestore** — Firebase's realtime NoSQL document database.
- **Flavor** — A build variant (dev/stg/prod) that points at different config.
- **FlutterFire** — The official Firebase plugins for Flutter.
- **FVM** — Flutter Version Management; pins SDK per project.
- **Freezed** — Dart codegen for immutable classes / sealed unions.
- **Go Router** — Declarative navigation library for Flutter.
- **Gradle** — Android build tool.
- **Hot Reload** — Fast in-place code update in dev.
- **Hot Restart** — Full app restart preserving Dart VM session.
- **Hooks** — Reusable stateful units from `flutter_hooks`.
- **Isolate** — Dart's unit of concurrency (separate memory).
- **JSON Serializable** — Codegen for `toJson` / `fromJson`.
- **MaterialApp** — Root widget configuring Material Design theme.
- **Patrol** — Native E2E framework for Flutter.
- **pub.dev** — Dart/Flutter package registry.
- **pubspec** — `pubspec.yaml`, the package manifest.
- **Riverpod** — Compile-safe state management for Flutter.
- **Simulator (iOS)** — Virtual iPhone/iPad on macOS.
- **TestFlight** — Apple's pre-release distribution channel.
- **Widget** — Anything you put on screen in Flutter.
- **withConverter** — Firestore method that types a collection reference.
- **Xcode** — Apple's IDE; required to build/release iOS apps.

---

## 21. Update Cadence

- This rulebook is valid for Flutter 3.41.x – 3.44.x and FlutterFire 4.12.x – 4.14.x.
- Re-run the generator when:
  - Major Flutter version bump (4.x).
  - Major Riverpod bump (4.x).
  - FlutterFire major (5.x).
  - Apple or Google policy change (signing, privacy manifests, Play Integrity API change).
  - Security advisory in any pinned package.
- Date stamp: 2026-04-27.

## Known Gaps

- Exact patch versions of `firebase_storage`, `cloud_functions`, `firebase_app_check` could not be confirmed line-by-line via WebSearch in this session; pinned to FlutterFire 4.12 family floor — verify on first `fvm flutter pub get` and update Versions Table.
- `very_good_analysis` 9.0.0 confirmed as latest tracked major; if pub.dev shows newer at first install, bump and re-run analyze to clear lint deltas.
