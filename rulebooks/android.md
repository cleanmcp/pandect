# Jetpack Compose + Kotlin + Room + Hilt — Native Android Rulebook

Native Android app, Kotlin-first, declarative UI, single source of truth, ships to Google Play.

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Kotlin 2.3.21 | Official Android language; null-safety; coroutines built-in |
| Runtime + version | Android 8.0 minSdk 26 / target 36 | API 26 covers 99% devices; 36 meets Play 2026 |
| Package manager | Gradle 9.1.0 + Version Catalog | Official; type-safe; reproducible |
| Build tool | AGP 9.1.1 | Current stable; required for target 36 |
| State mgmt | StateFlow + Compose State | Built-in; lifecycle-aware; no extra dep |
| Routing/Nav | Navigation Compose 2.9.0 (type-safe) | Official; type-safe routes; Compose-native |
| Data layer (db + orm) | Room 2.8.4 + SQLite | Official; KSP codegen; coroutine APIs |
| Auth | Credential Manager + Firebase Auth | Official; passkey-ready; OAuth in one API |
| Styling | Material 3 (M3) Compose | Official theme; dynamic color; A11y baked-in |
| Forms + validation | Compose state + sealed class results | No library; explicit; testable |
| Unit test runner | JUnit 5 (Jupiter) via mannodermaus plugin | Modern; parallel; nested |
| E2E framework | Maestro 1.40 | YAML; parallel; Compose-aware |
| Mocking strategy | MockK 1.13 + fakes for repos | Coroutine-aware; Kotlin-native |
| Logger | Timber 5.0 + Logcat | De facto Android standard; tag-aware |
| Error tracking | Sentry Android 7.20 | Free tier; Compose-aware crashes |
| Lint + format | ktlint 1.5 + detekt 2.0 + Android Lint | Three layers; auto-fix on save |
| Type checking | kotlinc strict + explicitApi=warning | Catch nullability; enforce API surface |
| Env vars + secrets | local.properties + BuildConfig + EncryptedSharedPreferences | Standard Android pattern |
| CI provider | GitHub Actions (ubuntu-latest) | Free for public; matrix builds |
| Deploy target | Google Play Internal Testing → Closed → Production | Official; gradual rollout |
| Release flow | Gradle Play Publisher (gpp) | Automated upload; track promotion |
| Auto-update | In-App Updates API (immediate flow) | Native; Play-managed |
| DI | Hilt 2.59.1 + KSP | Official; compile-time; AGP-9 ready |
| Async | Kotlin Coroutines 1.11.0 + Flow | Official Kotlin; structured concurrency |
| Networking | Retrofit 3.0.0 + OkHttp 5 + kotlinx.serialization | Standard; type-safe; coroutine-first |
| Code gen | KSP 2.3.21-1.0.30 | Faster than KAPT; required by Hilt+Room |
| Signing | Play App Signing (upload key only) | Mandatory; Google manages release key |
| ProGuard/R8 | R8 full mode, minify+shrink in release | Default; smaller APK; obfuscated |
| State holder | androidx.lifecycle.ViewModel + StateFlow | Official; survives config change |
| Module structure | `:app` + `:core:*` + `:feature:*` | Scales; build cache; team boundaries |
| Build config DSL | Kotlin DSL (`build.gradle.kts`) | Type-safe; IDE completion |

### Versions Table

| Lib | Version | Released | Link |
|---|---|---|---|
| Android Studio | Panda 4 (2026.1.1) | Apr 2026 | https://developer.android.com/studio/releases |
| AGP | 9.1.1 | Apr 2026 | https://developer.android.com/build/releases/agp-9-1-0-release-notes |
| Gradle | 9.1.0 | 2026 | https://docs.gradle.org/9.1.0/release-notes.html |
| Kotlin | 2.3.21 | 2026-04-23 | https://github.com/JetBrains/kotlin/releases |
| Compose Compiler | 2.3.21 (matches Kotlin) | 2026-04-23 | https://developer.android.com/jetpack/androidx/releases/compose-kotlin |
| Compose BOM | 2026.04.00 | Apr 2026 | https://developer.android.com/jetpack/androidx/releases/compose |
| Room | 2.8.4 | 2026 | https://developer.android.com/jetpack/androidx/releases/room |
| Hilt | 2.59.1 | 2026 | https://github.com/google/dagger/releases |
| hilt-navigation-compose | 1.3.0 | 2026 | https://developer.android.com/jetpack/androidx/releases/hilt |
| Coroutines | 1.11.0 | 2026 | https://github.com/Kotlin/kotlinx.coroutines/releases |
| Navigation Compose | 2.9.0 | 2026 | https://developer.android.com/jetpack/androidx/releases/navigation |
| lifecycle-runtime-compose | 2.10.0 | 2026 | https://developer.android.com/jetpack/androidx/releases/lifecycle |
| Retrofit | 3.0.0 | 2026 | https://github.com/square/retrofit/releases |
| OkHttp | 5.0.0 | 2026 | https://square.github.io/okhttp/ |
| kotlinx.serialization | 1.7.3 | 2026 | https://github.com/Kotlin/kotlinx.serialization |
| KSP | 2.3.21-1.0.30 | 2026 | https://github.com/google/ksp/releases |
| Timber | 5.0.1 | 2024 | https://github.com/JakeWharton/timber |
| Sentry Android | 7.20.0 | 2026 | https://github.com/getsentry/sentry-java |
| Maestro | 1.40 | 2026 | https://github.com/mobile-dev-inc/maestro |
| JUnit Jupiter | 5.11.4 | 2026 | https://github.com/junit-team/junit5 |
| android-junit5 plugin | 1.13.0 | 2026 | https://github.com/mannodermaus/android-junit5 |
| MockK | 1.13.13 | 2026 | https://mockk.io |
| ktlint | 1.5.0 | 2026 | https://github.com/pinterest/ktlint |
| detekt | 2.0.0 | 2026 | https://github.com/detekt/detekt |
| Gradle Play Publisher | 3.12.1 | 2026 | https://github.com/Triple-T/gradle-play-publisher |

### Minimum Host Requirements

- macOS 13+ / Windows 11 (64-bit) / Ubuntu 22.04 LTS+
- 16 GB RAM (8 GB minimum, builds will be slow)
- 30 GB disk free (SDK + emulator system images)
- CPU with virtualization (Intel VT-x / AMD-V / Apple Silicon)

### Estimated Cold-Start Time

`git clone` to running app on emulator on a fresh machine: 35–55 minutes (Android Studio install 8 min, SDK download 12 min, first Gradle sync 8 min, emulator boot 5 min, first build 7 min).

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. JDK 17 (AGP 9 requires JDK 17)
brew install --cask temurin@17
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc
source ~/.zshrc
java -version
# expect: openjdk version "17.0.x" 2026-xx-xx

# 2. Android Studio (Panda 4)
brew install --cask android-studio
# Open it once, complete the setup wizard, install:
#   - Android SDK Platform 36
#   - Android SDK Build-Tools 36.0.0
#   - Android Emulator
#   - Android SDK Platform-Tools
#   - System image: Pixel 8 Pro / Android 16 (API 36) / Google APIs

# 3. Environment
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.zshrc
source ~/.zshrc
adb --version
# expect: Android Debug Bridge version 1.0.41

# 4. Maestro (E2E)
curl -Ls "https://get.maestro.mobile.dev" | bash
maestro --version
# expect: 1.40.x

# 5. GitHub CLI
brew install gh
gh auth login
```

### Windows

```powershell
# 1. JDK 17
winget install EclipseAdoptium.Temurin.17.JDK
# Add JAVA_HOME to System Environment: C:\Program Files\Eclipse Adoptium\jdk-17.x.x-hotspot
java -version

# 2. Android Studio
winget install Google.AndroidStudio
# Open it once, run setup wizard, install SDK 36, build-tools 36.0.0, emulator, system image

# 3. Environment (PowerShell, run as admin)
[System.Environment]::SetEnvironmentVariable("ANDROID_HOME", "$env:LOCALAPPDATA\Android\Sdk", "User")
$path = [System.Environment]::GetEnvironmentVariable("Path", "User")
[System.Environment]::SetEnvironmentVariable("Path", "$path;$env:LOCALAPPDATA\Android\Sdk\platform-tools;$env:LOCALAPPDATA\Android\Sdk\emulator", "User")
# restart terminal
adb --version

# 4. Maestro
iwr "https://get.maestro.mobile.dev/windows" -useb | iex

# 5. GitHub CLI
winget install GitHub.cli
gh auth login
```

### Linux (Ubuntu 22.04+)

```bash
# 1. JDK 17
sudo apt update
sudo apt install -y openjdk-17-jdk
echo 'export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64' >> ~/.bashrc

# 2. Android Studio (snap or tarball)
sudo snap install android-studio --classic
# Open and complete wizard

# 3. Environment
echo 'export ANDROID_HOME=$HOME/Android/Sdk' >> ~/.bashrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator:$ANDROID_HOME/cmdline-tools/latest/bin' >> ~/.bashrc
source ~/.bashrc

# 4. KVM for emulator
sudo apt install -y qemu-kvm libvirt-daemon-system
sudo adduser $USER kvm
# log out and back in

# 5. Maestro
curl -Ls "https://get.maestro.mobile.dev" | bash

# 6. GitHub CLI
sudo apt install gh
gh auth login
```

### Accounts To Create

| Account | URL | Cost | Why |
|---|---|---|---|
| Google Play Console | https://play.google.com/console | $25 one-time | Publish to Play |
| Firebase | https://console.firebase.google.com | Free tier | Auth, Crashlytics, Analytics |
| Sentry | https://sentry.io | Free 5k events/mo | Error tracking |
| GitHub | https://github.com | Free | Source + CI |

### Bootstrap Commands

```bash
# Clone or generate from this rulebook's Section 16 First-PR Scaffold
git clone <repo-url> my-app
cd my-app
./gradlew --version
# expect: Gradle 9.1.0, Kotlin 2.x, JVM 17

./gradlew :app:assembleDebug
# expect: BUILD SUCCESSFUL in 2m 30s

# Boot emulator
emulator -list-avds
emulator -avd Pixel_8_API_36 &

# Install + run
./gradlew :app:installDebug
adb shell am start -n com.example.app/.MainActivity
```

### Expected First-Run Output

```
> Configure project :app
> Task :app:preBuild UP-TO-DATE
> Task :app:processDebugResources
> Task :app:compileDebugKotlin
> Task :app:kspDebugKotlin
> Task :app:mergeDebugAssets
> Task :app:packageDebug
> Task :app:assembleDebug

BUILD SUCCESSFUL in 2m 32s
47 actionable tasks: 47 executed
```

### Common First-Run Errors

| Error | Fix |
|---|---|
| `Unsupported Java. Your build is configured to use Java 11 but Gradle 9 requires Java 17` | `export JAVA_HOME=$(/usr/libexec/java_home -v 17)` and restart terminal |
| `SDK location not found. Define ANDROID_HOME` | Create `local.properties` with `sdk.dir=/Users/you/Library/Android/sdk` |
| `compileSdk 36 not installed` | Open Android Studio → SDK Manager → install API 36 |
| `KSP error: cannot find symbol Hilt_*` | Run `./gradlew clean :app:kspDebugKotlin` then rebuild |
| `Emulator: PANIC: Cannot find AVD` | `avdmanager create avd -n Pixel_8_API_36 -k "system-images;android-36;google_apis;x86_64"` |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | `adb shell pm uninstall com.example.app` then retry |
| `Duplicate class kotlinx.coroutines` | Use Compose BOM and Kotlin BOM; never pin coroutine versions manually |
| `Compose @Composable invocations can only happen from the context of a @Composable function` | Wrap call in `@Composable` function or move outside Compose tree |

## 3. Project Layout

```
my-app/
├── .github/
│   └── workflows/
│       └── ci.yml
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── .cursor/
│   └── rules
├── app/
│   ├── build.gradle.kts
│   ├── proguard-rules.pro
│   └── src/
│       ├── main/
│       │   ├── AndroidManifest.xml
│       │   ├── java/com/example/app/
│       │   │   ├── MyApp.kt              # @HiltAndroidApp
│       │   │   ├── MainActivity.kt       # @AndroidEntryPoint
│       │   │   ├── di/                   # Hilt modules
│       │   │   ├── ui/
│       │   │   │   ├── theme/            # Material3 theme, colors, typography
│       │   │   │   ├── components/       # Reusable composables
│       │   │   │   └── nav/              # NavHost, routes
│       │   │   └── feature/
│       │   │       └── <name>/
│       │   │           ├── <Name>Screen.kt        # @Composable
│       │   │           ├── <Name>ViewModel.kt     # @HiltViewModel
│       │   │           └── <Name>UiState.kt       # data class / sealed
│       │   └── res/
│       │       ├── values/strings.xml
│       │       ├── values/themes.xml
│       │       ├── drawable/
│       │       └── mipmap-*/
│       ├── test/                         # JVM unit tests (JUnit 5)
│       │   └── java/com/example/app/
│       └── androidTest/                  # Instrumented tests
│           └── java/com/example/app/
├── core/
│   ├── data/                             # repos, network, db
│   │   └── src/main/java/com/example/core/data/
│   ├── domain/                           # use cases, models
│   └── ui/                               # shared composables
├── feature/
│   └── <name>/                           # one module per feature
├── maestro/
│   └── flows/
│       ├── smoke.yaml
│       └── signup.yaml
├── gradle/
│   ├── libs.versions.toml
│   └── wrapper/
├── build.gradle.kts                      # root
├── settings.gradle.kts
├── gradle.properties
├── local.properties                      # gitignored
├── .editorconfig
├── detekt.yml
├── CLAUDE.md
├── AGENTS.md
├── README.md
└── .gitignore
```

### Naming Conventions

- Files: PascalCase for Kotlin classes (`UserRepository.kt`), match the top-level type name.
- Composables: PascalCase, no `Screen` suffix on subcomponents (`UserList`, not `UserListComposable`). Top-level screen: `<Feature>Screen`.
- ViewModels: `<Feature>ViewModel`.
- UiState: data class `<Feature>UiState`; events: sealed class/interface `<Feature>UiEvent`.
- Tests: `<Class>Test.kt` (JVM), `<Class>InstrumentedTest.kt` (androidTest).
- Resources: snake_case (`ic_user_avatar.xml`, `string_login_title`).
- Modules: `:feature:profile`, `:core:data`, lowercase with colons.

### "If you're adding X, it goes in Y"

| Artifact | Path |
|---|---|
| New screen | `app/src/main/java/com/example/app/feature/<name>/<Name>Screen.kt` |
| New ViewModel | next to its Screen, same package |
| New use case | `core/domain/src/main/java/com/example/core/domain/usecase/` |
| New repository | `core/data/src/main/java/com/example/core/data/repo/` |
| New Room entity | `core/data/src/main/java/com/example/core/data/db/entity/` |
| New Room DAO | `core/data/src/main/java/com/example/core/data/db/dao/` |
| New Retrofit service | `core/data/src/main/java/com/example/core/data/api/` |
| New Hilt module | `app/src/main/java/com/example/app/di/` |
| New theme color | `app/src/main/java/com/example/app/ui/theme/Color.kt` |
| New string | `app/src/main/res/values/strings.xml` |
| Reusable composable | `core/ui/src/main/java/com/example/core/ui/` |
| Navigation route | `app/src/main/java/com/example/app/ui/nav/Routes.kt` |
| JVM unit test | `app/src/test/java/...` mirrors source path |
| Instrumented test | `app/src/androidTest/java/...` mirrors source path |
| Maestro flow | `maestro/flows/<name>.yaml` |
| Asset (image) | `app/src/main/res/drawable/` (vector preferred) |
| Mock for tests | `app/src/test/java/.../fake/Fake<X>Repository.kt` |
| Build constant | `app/build.gradle.kts` `buildConfigField` |
| Permission | `app/src/main/AndroidManifest.xml` |
| ProGuard rule | `app/proguard-rules.pro` |

## 4. Architecture

### Process / Module Boundaries

```
+-------------------------------------------------------------+
|                         :app                                |
|  MainActivity → setContent { AppTheme { AppNavHost() } }    |
|  ↓                                                          |
|  +---------------------+   +-------------------+            |
|  | feature:profile     |   | feature:home      |  ...       |
|  | Screen + VM + State |   | Screen + VM       |            |
|  +----------+----------+   +---------+---------+            |
|             |                        |                      |
|             v                        v                      |
|  +-----------------------------------------------+          |
|  |                core:domain                    |          |
|  |  Use cases, models (pure Kotlin, no Android)  |          |
|  +-----------------------+-----------------------+          |
|                          |                                  |
|                          v                                  |
|  +-----------------------------------------------+          |
|  |                core:data                      |          |
|  |  Repository (interface in domain, impl here)  |          |
|  |  ┌─ Room DB (local) ──────┐                   |          |
|  |  └─ Retrofit + OkHttp ────┘                   |          |
|  +-----------------------------------------------+          |
+-------------------------------------------------------------+
```

### Data Flow (typical user action)

```
User taps button (Composable)
   → onClick = { vm.onIntent(LoadUsers) }
ViewModel.onIntent(LoadUsers)
   → viewModelScope.launch { useCase() }
UseCase
   → repository.observeUsers()
Repository
   → returns Flow<List<User>>: emits cache, then network refresh
ViewModel
   → _uiState.update { it.copy(users = list, loading = false) }
Composable
   → val state by viewModel.uiState.collectAsStateWithLifecycle()
   → recomposes
```

### Auth Flow

```
Splash
  ↓
AuthRepository.observeUser(): Flow<User?>
  ↓
  null  → LoginScreen → CredentialManager → Firebase Auth → AuthRepository.signIn()
  user  → HomeScreen
       ↓
       Logout → Firebase signOut() → User flow emits null → NavHost pops to Login
```

### State Management Flow

```
ViewModel
  ├─ _uiState: MutableStateFlow<UiState>  (private)
  ├─ uiState: StateFlow<UiState>          (exposed)
  └─ events: Channel<Event>               (one-shot side effects)

Composable
  val state by vm.uiState.collectAsStateWithLifecycle()
  LaunchedEffect(Unit) { vm.events.collect { handle(it) } }
```

### Entry-Point File-to-Responsibility Map

| File | Responsibility |
|---|---|
| `MyApp.kt` | `@HiltAndroidApp`; init Timber, Sentry; nothing else |
| `MainActivity.kt` | `@AndroidEntryPoint`; sets Compose content; handles deep links |
| `AppNavHost.kt` | Single `NavHost`; declares all top-level routes |
| `Theme.kt` | `AppTheme` composable; M3 ColorScheme + Typography |
| `di/AppModule.kt` | `@InstallIn(SingletonComponent)`; provides Retrofit, Room, OkHttp |
| `core/domain/UseCase.kt` | Pure Kotlin function; takes repo via constructor |
| `core/data/repo/<X>RepositoryImpl.kt` | Coordinates DB + network; exposes `Flow` |

### Where Business Logic Lives

- **Lives in:** `core:domain` use cases. Pure Kotlin, no Android imports, no `Context`, no Compose.
- **Does NOT live in:** Composables (UI only), Activities (entry only), DAOs (queries only), Retrofit interfaces (HTTP only), repositories (orchestration only — no business rules).

## 5. Dev Workflow

### Start Dev

```bash
./gradlew :app:installDebug && adb shell am start -n com.example.app/.MainActivity
```

Live edit: Android Studio's "Apply Changes" (Ctrl/Cmd+Shift+F10) hot-swaps Compose without restart. **Live Edit** mode auto-pushes Composable edits.

### Hot Reload Behavior

- Works for: Composable function bodies, color/typography values, string resources.
- Breaks for: ViewModel changes, Hilt module changes, Room schema, AndroidManifest, Gradle config, navigation graph route declarations.
- Fix when broken: stop app, `./gradlew :app:installDebug`, relaunch.

### Debugger Setup

**Android Studio** (canonical): Run → Debug 'app'. Breakpoints work in Kotlin, Composables, coroutines.

**VS Code / Cursor**: install "Kotlin" + "Android Studio Code Tools" extensions. Use `.vscode/launch.json` (see Section 15). Debugging is limited — for serious debugging, switch to Android Studio.

### Runtime Inspection

- **Layout Inspector** (Android Studio → View → Tool Windows → Layout Inspector): live Compose tree, recomposition counts.
- **Network Inspector** (View → Tool Windows → App Inspection → Network): all OkHttp traffic, headers, body.
- **Database Inspector** (App Inspection → Database): live Room queries, table editor.
- **Logcat** (View → Tool Windows → Logcat): filter `package:mine` + `tag:Timber`.

### Pre-commit Checks

`./scripts/precommit.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
./gradlew ktlintFormat detekt :app:lintDebug :app:testDebugUnitTest --daemon
```

Hook lives in `.githooks/pre-commit`; install via `git config core.hooksPath .githooks`.

### Branch + Commit Conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits — `feat(profile): add avatar upload`, `fix(auth): handle expired token`.
- One feature per PR. PR title = first commit message.

## 6. Testing & Parallelization

### Unit Tests (JVM, fast)

Location: `app/src/test/java/...` and `<module>/src/test/...`. Naming: `<ClassName>Test.kt`.

```bash
./gradlew testDebugUnitTest                          # all
./gradlew :app:testDebugUnitTest --tests "*UserViewModelTest"  # single class
./gradlew :app:testDebugUnitTest --tests "*UserViewModelTest.loadsUsers"  # single test
./gradlew :app:testDebugUnitTest -t                  # watch mode (continuous)
```

Sample (JUnit 5 + Turbine + MockK):

```kotlin
class UserViewModelTest {
    @Test fun `emits Loading then Success`() = runTest {
        val repo = mockk<UserRepository> {
            coEvery { observeUsers() } returns flowOf(listOf(User("1", "Ada")))
        }
        val vm = UserViewModel(repo)
        vm.uiState.test {
            assertEquals(UiState.Loading, awaitItem())
            assertEquals(UiState.Success(listOf(User("1", "Ada"))), awaitItem())
        }
    }
}
```

### Integration Tests (Compose UI, instrumented)

Location: `app/src/androidTest/java/...`. Naming: `<Class>InstrumentedTest.kt`.

```bash
./gradlew :app:connectedDebugAndroidTest             # needs running emulator
./gradlew :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.example.app.LoginScreenTest
```

Use `createAndroidComposeRule<MainActivity>()` and Hilt's `HiltAndroidRule`.

### E2E (Maestro, parallel)

`maestro/flows/smoke.yaml`:

```yaml
appId: com.example.app
---
- launchApp
- assertVisible: "Login"
- tapOn: "Email"
- inputText: "test@example.com"
- tapOn: "Continue"
- assertVisible: "Welcome"
```

Run:

```bash
maestro test maestro/flows/                          # all flows, sequential
maestro test --shards 4 maestro/flows/               # 4-way parallel across emulators
```

### Mocking Rules

| Layer | Mock? | Reason |
|---|---|---|
| Room DAO | **Never** in repo tests | Use in-memory Room DB; SQL drift is real |
| Retrofit service | Yes, with MockK or MockWebServer | Network is the boundary |
| UseCase in VM tests | Yes | VM should not know UseCase internals |
| Repository in UseCase tests | Yes (fake or MockK) | Isolate domain logic |
| `Context` | **Never** | If you need it, refactor; it leaks Android into domain |
| `LiveData` | **Never** — don't use LiveData | Use StateFlow |
| Coroutine dispatchers | Yes — inject `Dispatchers.IO` via `CoroutineDispatcher` | Use `StandardTestDispatcher` |
| Time / `System.currentTimeMillis` | Yes via `Clock` interface | Tests must be deterministic |

### Coverage Target

70% line coverage on `core:domain` and `core:data`. UI coverage measured via Compose UI tests, not coverage %. Run with Kover:

```bash
./gradlew koverHtmlReport
open app/build/reports/kover/html/index.html
```

### Visual Regression

Use Paparazzi 2.0 for Compose screenshot tests (no emulator needed):

```bash
./gradlew recordPaparazziDebug    # capture goldens
./gradlew verifyPaparazziDebug    # diff against goldens
```

### Parallelization Patterns for AI Agents

**Safe to fan out (disjoint files):**
- Scaffold a new feature module: ViewModel + Screen + UiState + UseCase + Repository can be generated by 5 parallel subagents.
- Add 5 unrelated string keys, drawables, or test files.
- Write Maestro flows for 5 different screens.

**Must be sequential:**
- Anything touching `gradle/libs.versions.toml`, `settings.gradle.kts`, root `build.gradle.kts` (lockfile-style contention).
- Adding a Room migration (entity + dao + migration must commit atomically).
- Modifying `AndroidManifest.xml` (merge order matters).
- Hilt module changes (graph must compile each step).
- Adding a new module — must update `settings.gradle.kts` first, then create.

## 7. Logging

### Setup

`MyApp.kt`:

```kotlin
@HiltAndroidApp
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) {
            Timber.plant(Timber.DebugTree())
        } else {
            Timber.plant(SentryTimberTree())
        }
        SentryAndroid.init(this) { it.dsn = BuildConfig.SENTRY_DSN }
    }
}
```

### Levels

| Level | When |
|---|---|
| `Timber.v` | Verbose internal trace; off in release |
| `Timber.d` | Debug; off in release |
| `Timber.i` | Significant lifecycle event (sign-in, screen open) |
| `Timber.w` | Recoverable issue (retry, fallback) |
| `Timber.e(t, msg)` | Error; auto-forwarded to Sentry in release |

### Required Fields

Every log line includes (via tree):

- `tag` (auto-set to caller class)
- `event` (snake_case verb_noun, e.g. `signin_success`)
- `user_id` if known
- `request_id` for network calls

### Sample Log Lines

```
I/MainActivity: app_start build=12 channel=internal
I/AuthRepo: signin_attempt method=email user_id=anon-7f3a
W/UserRepo: cache_stale ttl_ms=300000 fetched_ago_ms=420000
E/SyncWorker: sync_failed code=503 retry_in_ms=60000
I/HomeScreen: screen_view route=home user_id=u_42
```

### Where Logs Go

- Dev: `adb logcat` and Logcat panel.
- Prod: Sentry Breadcrumbs (errors only auto-forwarded). Crashlytics handles native crashes.

### Grep Locally

```bash
adb logcat -v time | grep -E "(MyApp|HomeScreen|AuthRepo)"
adb logcat -s Timber:* AndroidRuntime:E
```

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `./gradlew ktlintFormat detekt :app:lintDebug :app:testDebugUnitTest` before declaring a task done.
2. Always declare new dependencies in `gradle/libs.versions.toml`, never inline strings in `build.gradle.kts`.
3. Always use `@HiltViewModel` + constructor injection on every ViewModel. Resolve in Composables via `hiltViewModel()`.
4. Always annotate the Application class with `@HiltAndroidApp` and Activities with `@AndroidEntryPoint`.
5. Always collect Flows in Composables with `collectAsStateWithLifecycle()`, never `collectAsState()`.
6. Always wrap mutable state with `MutableStateFlow` in ViewModels and expose immutable `StateFlow`.
7. Always pass stable types (`@Immutable`, `@Stable`, primitives, data classes of immutables) to Composables.
8. Always inject `CoroutineDispatcher` instances; never reference `Dispatchers.IO` inside business logic.
9. Always use Room with KSP (`ksp("androidx.room:room-compiler:...")`), never KAPT.
10. Always write a Room `Migration` for every schema change; never rely on `fallbackToDestructiveMigration`.
11. Always declare network DTOs in a `:data` module separate from domain models; map at the repository boundary.
12. Always use `kotlinx.serialization` for JSON; configure Retrofit with `Json.asConverterFactory(...)`.
13. Always set `compileSdk = 36`, `targetSdk = 36`, `minSdk = 26` in every module unless a specific feature mandates otherwise.
14. Always run `./gradlew :app:lintDebug` before push; treat lint errors as blocking.
15. Always handle config changes with `ViewModel` + `rememberSaveable`; never `Activity.onSaveInstanceState` for UI state.
16. Always test ViewModel state with Turbine on `StateFlow`, with `runTest` and an injected `TestDispatcher`.
17. Always wrap navigation routes in a sealed `Routes` object with type-safe arguments using `kotlinx.serialization`.
18. Always use Material 3 (`androidx.compose.material3.*`); never mix Material 2 and Material 3.
19. Always run `./gradlew assembleRelease` locally once per PR to catch R8 issues before CI.
20. Always extract user-visible strings into `res/values/strings.xml` with `R.string.<key>`; never hard-code.
21. Always set `enableR8 = true` and `isMinifyEnabled = true` for release; commit ProGuard rules for every reflective lib.
22. Always log errors with `Timber.e(throwable, "message")` so Sentry receives the stack.

### 8.2 NEVER

1. Never call `runBlocking` in production code; only in tests, and prefer `runTest`.
2. Never reference `GlobalScope`. Use `viewModelScope`, `lifecycleScope`, or an injected `CoroutineScope`.
3. Never put business logic in `@Composable` functions or `onClick` lambdas.
4. Never read or mutate state inside `derivedStateOf` from non-Compose-State variables (it captures the initial value forever).
5. Never combine independent state inputs with `derivedStateOf` — recompose normally; use `derivedStateOf` only to throttle high-frequency reads.
6. Never call `remember { mutableStateOf(...) }` in a list item without a key; use `key(item.id) { ... }` or persist in ViewModel.
7. Never use `LiveData` in new code. StateFlow + `collectAsStateWithLifecycle` is the standard.
8. Never call `fetch`-style suspending functions directly from a Composable. Route through ViewModel.
9. Never write to a `MutableStateFlow` from outside its ViewModel; expose intent functions instead.
10. Never use KAPT — KSP only. KAPT blocks Kotlin 2.x compatibility for Hilt and Room.
11. Never call `Activity` or `Context` APIs from `core:domain` or any non-Android module.
12. Never store secrets in `BuildConfig` from `local.properties` and commit `local.properties` — gitignore it.
13. Never set `android:exported="true"` on an Activity without an `intent-filter` or explicit reason.
14. Never request runtime permissions outside of `accompanist-permissions` or the Compose `rememberLauncherForActivityResult`.
15. Never disable ProGuard/R8 in release. If a lib breaks, add a `-keep` rule.
16. Never use `findViewById` or XML layouts. This stack is Compose-only.
17. Never put `@Composable` calls in `init {}` of a class or in lambdas captured outside composition.
18. Never block the main thread with synchronous I/O (Room, OkHttp). Use suspend functions on `Dispatchers.IO`.
19. Never use `MutableState` for cross-screen state. Lift to ViewModel.
20. Never bypass Hilt by `new`-ing a dependency in production code. If injection is awkward, the design is wrong.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `gradle/libs.versions.toml` | every module | `./gradlew --stop && ./gradlew assembleDebug testDebugUnitTest` |
| `settings.gradle.kts` | module graph | `./gradlew projects` then full build |
| Root `build.gradle.kts` | every module | full clean build |
| `app/build.gradle.kts` | app module | `./gradlew :app:assembleDebug :app:testDebugUnitTest` |
| `app/proguard-rules.pro` | release only | `./gradlew :app:assembleRelease` then install + smoke |
| `AndroidManifest.xml` | runtime, permissions | install + Maestro smoke |
| `MyApp.kt` (`@HiltAndroidApp`) | DI graph | full clean + assembleDebug |
| `MainActivity.kt` | entry point | install + launch |
| Any `@HiltModule` | DI graph | `./gradlew :app:kspDebugKotlin assembleDebug` |
| Any `@Database` class | schema | export schema, write migration, instrumented Room test |
| Any `@Entity` class | schema | same as above |
| Any `@Dao` interface | repo callers | `./gradlew :core:data:testDebugUnitTest` |
| Any Retrofit interface | network calls | repo tests + MockWebServer |
| `core/domain/**` | every feature | full unit test run |
| `core/data/**` | every repo consumer | `./gradlew testDebugUnitTest` |
| `app/src/main/res/values/themes.xml` | every screen | visual smoke on dark + light |
| `app/src/main/res/values/strings.xml` | localized text | lint + Maestro smoke |
| `Routes.kt` | navigation | Maestro nav flows |
| `AppNavHost.kt` | every screen reachable | Maestro full pass |
| `detekt.yml` | lint surface | `./gradlew detekt` |
| `.editorconfig` | ktlint formatting | `./gradlew ktlintCheck` |
| `gradle.properties` | build behavior | full clean build |
| `gradle/wrapper/gradle-wrapper.properties` | Gradle version | `./gradlew --version` then full build |
| `local.properties` | local SDK only | should never affect CI; verify CI green |
| `.github/workflows/ci.yml` | CI | push to draft PR; watch run |
| `keystore.jks` (encrypted in CI) | release signing | `./gradlew :app:bundleRelease` |

### 8.4 Definition of Done

**Bug fix:**
- Failing test added that reproduces the bug.
- Fix applied; test passes.
- `./gradlew ktlintFormat detekt :app:lintDebug :app:testDebugUnitTest` green.
- Manual reproduction on emulator confirms fix.
- Logcat screenshot or log snippet captured before/after.
- No unrelated changes in the diff.

**New feature:**
- Use case in `core:domain` with unit tests (≥3 cases including edge).
- Repository method with fake-DAO unit test.
- ViewModel test using Turbine on `StateFlow`.
- Composable with at least one Paparazzi snapshot.
- Maestro flow added under `maestro/flows/<feature>.yaml`.
- Strings extracted to `strings.xml`.
- README/CHANGELOG line added.
- Run on emulator; screenshot in PR.

**Refactor:**
- No public API changes unless documented in PR.
- All existing tests still pass without modification (or test count increases).
- Build time not regressed by >10% (`./gradlew assembleDebug --scan`).
- No new lint warnings.

**Dependency bump:**
- Single dep per PR.
- Read changelog; note breaking changes in PR body.
- `./gradlew dependencies` diff attached.
- Full unit + connected test run green.
- Release build works.

**Schema change (Room):**
- Bump `version` in `@Database`.
- Add a `Migration` object in companion.
- Export schema (`exportSchema = true`).
- Instrumented test that opens a v(N-1) DB, runs migration, asserts data.
- Bump `app` versionCode.

**Copy change:**
- Edit `strings.xml`.
- Run `./gradlew :app:lintDebug` (catches missing translations).
- Maestro smoke flow still passes.
- Screenshot of changed screen.

### 8.5 Self-Verification Recipe

```bash
./gradlew --stop                                            # kill stale daemons
./gradlew clean
./gradlew ktlintFormat                                      # auto-fix style
./gradlew detekt                                            # static analysis
./gradlew :app:lintDebug                                    # Android Lint
./gradlew :app:assembleDebug                                # compile
./gradlew testDebugUnitTest                                 # all JVM unit tests
./gradlew :app:installDebug
maestro test maestro/flows/smoke.yaml                       # smoke E2E
./gradlew :app:assembleRelease                              # R8 check
```

Expected outputs:

```
> Task :ktlintFormat
BUILD SUCCESSFUL

> Task :detekt
detekt finished in <time>. 0 issues found.

> Task :app:lintDebug
> Wrote HTML report to file:///.../app/build/reports/lint-results-debug.html
0 errors, 0 warnings

> Task :app:testDebugUnitTest
JUnit Jupiter ✔ <N> tests successful

>> Maestro
✅ Flow Passed
```

### 8.6 Parallelization Patterns

**Safe parallel subagents:**
- Generating boilerplate for 5 disjoint feature modules.
- Writing 10 unrelated unit tests in different test files.
- Adding 10 strings + 10 drawables.
- Writing Maestro flows for unrelated screens.

**Sequential only:**
- Edits to `gradle/libs.versions.toml` (lockfile-style).
- Anything that triggers a new KSP-generated file (Hilt module add, Room entity add) — let Hilt graph stabilize before next KSP run.
- Migrations chain — each migration depends on the previous schema.
- Module additions in `settings.gradle.kts`.

## 9. Stack-Specific Pitfalls

1. **Compose Compiler / Kotlin version mismatch.** Symptom: `IncompatibleComposeRuntimeVersionException`. Cause: Compose Compiler version pinned manually instead of using Kotlin Compose Compiler plugin (Kotlin 2.0+). Fix: apply `org.jetbrains.kotlin.plugin.compose` plugin and remove explicit `composeOptions.kotlinCompilerExtensionVersion`. Detect: stack trace at app boot.
2. **`derivedStateOf` capturing non-State variable.** Symptom: derived value never updates after first render. Cause: closing over a parameter or non-State field. Fix: pass dependencies as Compose State or include them in a `key` to `remember(key) { derivedStateOf { ... } }`. Detect: log inside the lambda; it fires only on first composition.
3. **`remember` without `mutableStateOf`.** Symptom: state never changes the UI. Fix: `remember { mutableStateOf(...) }`. Detect: write a print in the body — value reads as initial.
4. **Backward writes causing infinite recomposition.** Symptom: app hangs, frame counter spikes. Cause: writing to a state inside a composition that read it. Fix: move the write to `LaunchedEffect` or an event handler. Detect: Layout Inspector recomposition counter spirals.
5. **Forgetting `@AndroidEntryPoint`.** Symptom: `IllegalStateException: Hilt Activity must be attached to an @HiltAndroidApp Application`. Fix: add the annotation to every Activity (and Fragment if used). Detect: crash at activity launch.
6. **Forgetting `hiltViewModel()` in nav.** Symptom: ViewModel scoped wrong; survives across destinations. Fix: always use `viewModel: FooViewModel = hiltViewModel()` inside the Composable destination. Detect: state leaks between screens.
7. **Leaking ViewModel scope.** Symptom: coroutines run after navigation away. Cause: launching on `GlobalScope` or storing a Job manually. Fix: use `viewModelScope.launch`. Detect: log in the coroutine; it logs after VM is cleared.
8. **Unstable types in Composable params.** Symptom: unnecessary recompositions; janky scrolls. Cause: passing `List<X>` (interface), function references, or non-data classes. Fix: use `kotlinx.collections.immutable` (`PersistentList`) or annotate with `@Immutable`. Detect: Compose compiler metrics report (`-P plugin:androidx.compose.compiler:metricsDestination=...`).
9. **`collectAsState` instead of `collectAsStateWithLifecycle`.** Symptom: flow collection runs while app backgrounded; battery drain. Fix: `import androidx.lifecycle.compose.collectAsStateWithLifecycle`. Detect: Logcat shows network calls when app is backgrounded.
10. **Room schema export disabled.** Symptom: cannot write migration tests. Fix: `room { schemaDirectory("$projectDir/schemas") }` in `build.gradle.kts`; commit the JSON. Detect: `MigrationTestHelper` cannot find schema.
11. **`fallbackToDestructiveMigration`** in production. Symptom: user data wipes on app update. Fix: write proper `Migration` objects; remove the call. Detect: code review or `detekt` rule.
12. **KAPT mixed with KSP.** Symptom: doubled annotation processing, slow build, occasional missing generated classes. Fix: KSP only — apply `id("com.google.devtools.ksp")` and use `ksp(...)` for Hilt and Room. Detect: build log shows both `kapt` and `ksp` tasks.
13. **R8 stripping reflective classes.** Symptom: release build crashes on JSON parse, Retrofit, Hilt component. Fix: add `-keep` rules for kotlinx.serialization (`@Keep` on data classes or use `keep-rules` from official docs). Detect: only fails in release; debug works.
14. **Compose Preview crashes due to Hilt.** Symptom: `@Preview` crashes; ViewModel cannot be constructed. Fix: pass state to a stateless overload of the Composable; only the screen-level Composable owns the ViewModel. Detect: preview red bar with `IllegalStateException`.
15. **Navigation recomposing on every key.** Symptom: screen rebuilds while typing. Cause: state hoisted into the NavHost-owning Composable. Fix: hoist state to ViewModel, not parent Composable. Detect: Layout Inspector recomposition counts on root.
16. **Forgetting to add `INTERNET` permission.** Symptom: Retrofit throws `SecurityException: Permission denied (missing INTERNET permission?)`. Fix: `<uses-permission android:name="android.permission.INTERNET"/>` in manifest. Detect: stacktrace at first network call.
17. **Hardcoded API URL in code.** Symptom: cannot switch dev/staging/prod. Fix: `buildConfigField("String", "API_BASE_URL", "\"...\"")` per `buildType` and `flavor`. Detect: code review.
18. **`viewModelScope` cancelled too aggressively in tests.** Symptom: assertion fires before VM emits. Fix: use `runTest` with a `StandardTestDispatcher` and call `advanceUntilIdle()`. Detect: flaky test.

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Cold start (first frame) | < 1500 ms on Pixel 8 | `adb shell am start -W com.example.app/.MainActivity` |
| Time to first interaction | < 2500 ms cold | Macrobenchmark with `StartupBenchmark` |
| APK size (installed) | < 25 MB base | `./gradlew :app:bundleRelease` then bundletool |
| Memory (steady state) | < 200 MB heap | Profiler → Memory |
| Frame time | < 16 ms (60 fps) | Profiler → CPU → System Trace |
| Recomposition count per scroll | < 1.2× item count | Layout Inspector → recomposition counts |
| Battery (1h foreground) | < 8% drain | Settings → Battery → app |

When budget exceeded:
- Cold start: profile with `androidx.benchmark`; lazy-init Hilt-injected dependencies; defer Sentry init.
- APK size: `./gradlew :app:analyzeReleaseBundle`; remove unused libs; enable R8 full mode.
- Frame time: `@Stable` types; `key()` in lazy lists; `derivedStateOf` for high-frequency reads.

## 11. Security

### Secret Storage

- **Local dev:** `local.properties` (gitignored). Read in `build.gradle.kts` and expose via `BuildConfig`.
- **CI:** GitHub Secrets → injected as env vars → written to `local.properties` at build time.
- **At runtime per-user:** `EncryptedSharedPreferences` (androidx.security-crypto) for tokens.
- **Never:** `strings.xml`, source files, `gradle.properties` checked into git, Firebase `google-services.json` if it contains a server key.

### Auth Threat Model

- User can read their own data only. Server enforces (Firebase Security Rules / API auth).
- Token never leaves `EncryptedSharedPreferences`; never logged; never put in URL.
- Logout wipes all `EncryptedSharedPreferences` entries and Room user data.

### Input Validation Boundary

Validate at the ViewModel `onIntent`. Domain layer assumes valid input. Network layer validates response shape via `kotlinx.serialization` strict mode.

### Output Escaping

Compose `Text()` is escaped by default. Never render user input via `WebView` without `webView.settings.javaScriptEnabled = false` and a Content Security Policy.

### Permissions / Manifest

`AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<!-- request only what you need; comment why for each -->
<application
    android:allowBackup="false"
    android:dataExtractionRules="@xml/data_extraction_rules"
    android:fullBackupContent="false"
    android:usesCleartextTraffic="false">
    <activity
        android:name=".MainActivity"
        android:exported="true">
        <intent-filter>
            <action android:name="android.intent.action.MAIN" />
            <category android:name="android.intent.category.LAUNCHER" />
        </intent-filter>
    </activity>
</application>
```

### Dependency Audit

```bash
./gradlew dependencyUpdates
./gradlew :app:dependencyCheckAnalyze   # OWASP plugin
```

Cadence: weekly in CI; block PRs with CVSS ≥ 7 unless documented.

### Top 5 Risks

1. **Cleartext HTTP** — set `android:usesCleartextTraffic="false"`; use `network-security-config.xml` for dev pinning.
2. **Exported activities without filters** — Lint rule `ExportedActivity`.
3. **Logging tokens** — Timber tree strips known token field names; ban `Log.d` direct calls (detekt).
4. **WebView XSS** — disable JavaScript unless required; use `WebViewAssetLoader` for local assets.
5. **Backup leaking secrets** — `android:allowBackup="false"` and `dataExtractionRules`.

## 12. Deploy

### Versioning

`app/build.gradle.kts`:

```kotlin
defaultConfig {
    versionCode = 12
    versionName = "0.4.0"
}
```

Bump `versionCode` every release (monotonic int). `versionName` follows semver.

### Release Flow

```bash
# 1. Bump version in build.gradle.kts
# 2. Update CHANGELOG.md
git tag v0.4.0
git push origin v0.4.0

# 3. Build signed bundle (CI does this)
./gradlew :app:bundleRelease

# 4. Upload to Internal Testing
./gradlew :app:publishReleaseBundle --track internal

# 5. Promote internal → closed (after smoke)
./gradlew :app:promoteArtifact --from-track internal --to-track alpha

# 6. Promote alpha → production
./gradlew :app:promoteArtifact --from-track alpha --to-track production --user-fraction 0.1
```

### Signing

Play App Signing (mandatory). You hold an upload key only.

```bash
keytool -genkey -v -keystore upload-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias upload
# store base64-encoded keystore + password in GitHub Secrets:
#   ANDROID_KEYSTORE (base64), ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD
```

`app/build.gradle.kts`:

```kotlin
android {
    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ANDROID_KEYSTORE_FILE") ?: "../upload-key.jks")
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("ANDROID_KEY_ALIAS")
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
        }
    }
}
```

### Staging vs Prod

- `internal` track = staging (≤100 testers, instant).
- `alpha` track = closed beta.
- `production` with `userFraction 0.1` = 10% staged rollout.

### Rollback

```bash
./gradlew :app:promoteArtifact --from-track production --to-track production --release-status halted
```

Max safe rollback window: 7 days (Play retains old release). After that, ship a new versionCode.

### Health Check / Smoke

```bash
maestro test maestro/flows/smoke.yaml --device "Pixel 8 - API 36"
```

Sentry release health: navigate Sentry → Releases → `0.4.0` → Crash-free sessions ≥ 99.5%.

### Auto-Update (In-App Updates)

`MainActivity`:

```kotlin
private val updateManager by lazy { AppUpdateManagerFactory.create(this) }

override fun onResume() {
    super.onResume()
    updateManager.appUpdateInfo.addOnSuccessListener { info ->
        if (info.updateAvailability() == UpdateAvailability.UPDATE_AVAILABLE
            && info.isUpdateTypeAllowed(AppUpdateType.IMMEDIATE)) {
            updateManager.startUpdateFlowForResult(info, AppUpdateType.IMMEDIATE, this, 1001)
        }
    }
}
```

### Cost (per 1k MAU)

- Play Console: $25 one-time (no MAU fee).
- Sentry free tier: 5k errors/mo (≈ enough for 1k MAU low-error apps).
- Firebase Spark plan: free for Auth, Firestore (≤50k reads/day).
- Total: ~$0/mo at 1k MAU; scales at $26/mo for Sentry Team if you exceed free tier.

## 13. Claude Code Integration

### `CLAUDE.md` (root of repo)

```markdown
# CLAUDE.md

This project follows `rulebooks/jetpack-compose-android.md`. Read it before any change.

## Stack
Kotlin 2.3.21, AGP 9.1.1, Compose BOM 2026.04.00, Hilt 2.59.1, Room 2.8.4, KSP only.

## Key commands
- Build debug: `./gradlew :app:assembleDebug`
- Run unit tests: `./gradlew testDebugUnitTest`
- Format + lint: `./gradlew ktlintFormat detekt :app:lintDebug`
- Install on device: `./gradlew :app:installDebug`
- E2E: `maestro test maestro/flows/`
- Self-verify before claiming done: see Section 8.5 of the rulebook.

## Banned patterns
- No KAPT. KSP only.
- No `LiveData` in new code.
- No `runBlocking` in production.
- No `GlobalScope`.
- No `View`/XML layouts. Compose only.
- No `kotlin-android-extensions` / synthetics.
- No business logic in Composables.
- No direct `Dispatchers.IO` references in business logic — inject.
- No `findViewById`.

## Architecture
`:app` (entry) → `:feature:*` (UI) → `:core:domain` (use cases, pure Kotlin) → `:core:data` (Room + Retrofit).

Business logic lives in `:core:domain`. Composables only render and dispatch intents. ViewModels orchestrate.

## When to invoke skills
- `/test-driven-development` for any new feature or bug fix.
- `/systematic-debugging` for any reported issue.
- `/verification-before-completion` before declaring any task done.
- `/ship` to cut a release.
```

### `.claude/settings.json`

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "./gradlew ktlintFormat -q --daemon" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "./gradlew :app:lintDebug testDebugUnitTest --daemon -q || echo 'Verify before claiming done.'" }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Bash(./gradlew :*)",
      "Bash(./gradlew test*)",
      "Bash(./gradlew assemble*)",
      "Bash(./gradlew ktlintFormat)",
      "Bash(./gradlew ktlintCheck)",
      "Bash(./gradlew detekt)",
      "Bash(./gradlew lint*)",
      "Bash(./gradlew :app:installDebug)",
      "Bash(./gradlew clean)",
      "Bash(./gradlew --stop)",
      "Bash(./gradlew --version)",
      "Bash(./gradlew dependencies*)",
      "Bash(adb logcat*)",
      "Bash(adb devices)",
      "Bash(adb shell *)",
      "Bash(adb install*)",
      "Bash(adb uninstall*)",
      "Bash(maestro test *)",
      "Bash(maestro --version)",
      "Bash(emulator -list-avds)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git push)",
      "Bash(gh pr *)",
      "Bash(gh run *)"
    ]
  }
}
```

### Recommended Skills

| Skill | When |
|---|---|
| `/test-driven-development` | New feature, before writing impl |
| `/systematic-debugging` | Any crash, layout issue, flaky test |
| `/verification-before-completion` | Before saying "done" |
| `/ship` | Cut a tagged release |
| `/review` | Pre-merge diff review |
| `/qa` | After feature impl, before PR |
| `/codex` | Second opinion on architecture |

### Slash Command Shortcuts

```bash
# Add to ~/.claude/commands/
echo "./gradlew ktlintFormat detekt :app:lintDebug testDebugUnitTest --daemon" > ~/.claude/commands/check.sh
echo "./gradlew :app:installDebug && adb shell am start -n com.example.app/.MainActivity" > ~/.claude/commands/run.sh
echo "maestro test maestro/flows/smoke.yaml" > ~/.claude/commands/smoke.sh
```

## 14. Codex Integration

### `AGENTS.md` (root)

```markdown
# AGENTS.md

You are working in a native Android codebase. Before any change, read `rulebooks/jetpack-compose-android.md` end-to-end.

## Stack
Kotlin 2.3.21 · AGP 9.1.1 · JDK 17 · Gradle 9.1.0 · Compose BOM 2026.04.00 · Hilt 2.59.1 · Room 2.8.4 · KSP only · JUnit 5 · Maestro.

## Module graph
`:app` → `:feature:*` → `:core:domain` → `:core:data`. Domain has zero Android imports.

## Commands you will run
| Goal | Command |
|---|---|
| Build | `./gradlew :app:assembleDebug` |
| Test (JVM) | `./gradlew testDebugUnitTest` |
| Lint | `./gradlew :app:lintDebug detekt` |
| Format | `./gradlew ktlintFormat` |
| Install | `./gradlew :app:installDebug` |
| E2E | `maestro test maestro/flows/` |
| Release | `./gradlew :app:bundleRelease` |

## Rules
- Composables: stateless where possible, hoist state, accept `@Stable` params.
- ViewModels: `@HiltViewModel`, expose `StateFlow<UiState>`, accept intents.
- Use Cases: pure Kotlin in `:core:domain`.
- Room: KSP, exported schemas, written migrations.
- Hilt: `@HiltAndroidApp` on `MyApp`, `@AndroidEntryPoint` on `MainActivity`.
- DI: never `new` a class that has a Hilt module entry.
- Async: `viewModelScope.launch` only; injected `CoroutineDispatcher`.
- Always run the self-verify recipe (rulebook §8.5) before claiming done.

## Banned
KAPT · LiveData · GlobalScope · runBlocking · findViewById · XML layouts · MutableState writes from outside ViewModels · cleartext HTTP · `fallbackToDestructiveMigration` in release.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[shell_environment_policy]
inherit = "core"
include_only = ["JAVA_HOME", "ANDROID_HOME", "PATH", "USER", "HOME"]

[[projects."*"]]
trust_level = "trusted"

[history]
persistence = "save-all"

[tools]
web_search_request = false
```

### Where Codex Differs from Claude Code

- Codex sandbox is stricter on adb access; whitelist `adb` and `emulator` explicitly via `sandbox_mode = "workspace-write"`.
- Codex does not auto-format on save by default — rely on `ktlintFormat` invoked manually or via Codex hook.
- Codex has weaker Kotlin tree-sitter coverage than Claude — prefer asking it to read full files rather than search by symbol.

## 15. Cursor / Other Editors

### `.cursor/rules`

```
You are working in a native Android Kotlin Compose codebase. Read rulebooks/jetpack-compose-android.md before any change.

ALWAYS:
- Use Hilt. Annotate Application with @HiltAndroidApp, Activity with @AndroidEntryPoint, VM with @HiltViewModel.
- Resolve VMs in Composables with hiltViewModel().
- Collect Flows with collectAsStateWithLifecycle().
- Expose immutable StateFlow from ViewModels; mutate via private MutableStateFlow.
- Inject CoroutineDispatcher; do not reference Dispatchers.IO directly in business logic.
- Use KSP for Hilt and Room. KAPT is banned.
- Write Room migrations for every schema bump; export schemas.
- Use Material 3 Compose only.
- Type-safe Navigation Compose routes (kotlinx.serialization).
- Strings in res/values/strings.xml.
- Run ./gradlew ktlintFormat detekt :app:lintDebug testDebugUnitTest before claiming done.

NEVER:
- LiveData, GlobalScope, runBlocking in prod, findViewById, XML layouts.
- Business logic in Composables or onClick lambdas.
- derivedStateOf reading non-State variables.
- remember without mutableStateOf.
- Mutate state inside a Composable that just read it (backward writes).
- fallbackToDestructiveMigration in release.
- Hardcode API URLs; use BuildConfig.
- Call suspend network from a Composable; route through ViewModel.

Module rules:
- :core:domain has zero Android imports.
- :core:data depends on :core:domain only.
- :feature:* depends on :core:domain and :core:ui.
- :app depends on every :feature:*.

Verification recipe (run before "done"):
./gradlew --stop && ./gradlew clean ktlintFormat detekt :app:lintDebug :app:assembleDebug testDebugUnitTest
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "fwcd.kotlin",
    "mathiasfrohlich.Kotlin",
    "vscjava.vscode-gradle",
    "redhat.vscode-xml",
    "tamasfe.even-better-toml",
    "EditorConfig.EditorConfig",
    "esbenp.prettier-vscode",
    "github.vscode-github-actions",
    "GitHub.copilot",
    "Anthropic.claude-code"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "kotlin",
      "request": "launch",
      "name": "Run Debug Tests",
      "projectRoot": "${workspaceFolder}",
      "mainClass": "org.junit.platform.console.ConsoleLauncher",
      "args": ["--scan-classpath"]
    }
  ],
  "tasks": [
    {
      "label": "gradle: assembleDebug",
      "type": "shell",
      "command": "./gradlew :app:assembleDebug"
    },
    {
      "label": "gradle: installDebug",
      "type": "shell",
      "command": "./gradlew :app:installDebug"
    }
  ]
}
```

For real Compose debugging, switch to Android Studio. VS Code is for editing only.

## 16. First-PR Scaffold

Create these files in order; after `git push`, CI builds + uploads to Play Internal.

### File 1: `.gitignore`

```gitignore
# Built application files
*.apk
*.aab
*.ap_
*.dex

# Generated
local.properties
.gradle/
build/
captures/
.externalNativeBuild/
.cxx/

# IDE
.idea/
*.iml
.vscode/settings.json

# OS
.DS_Store
Thumbs.db

# Keys
*.jks
*.keystore
keystore.properties
google-services.json

# Misc
*.log
.kotlin/
```

### File 2: `settings.gradle.kts`

```kotlin
pluginManagement {
    repositories {
        google {
            content {
                includeGroupByRegex("com\\.android.*")
                includeGroupByRegex("com\\.google.*")
                includeGroupByRegex("androidx.*")
            }
        }
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "my-app"
include(":app")
include(":core:domain")
include(":core:data")
include(":core:ui")
```

### File 3: `gradle/libs.versions.toml`

```toml
[versions]
agp = "9.1.1"
kotlin = "2.3.21"
ksp = "2.3.21-1.0.30"
coroutines = "1.11.0"
serialization = "1.7.3"
composeBom = "2026.04.00"
activityCompose = "1.10.0"
lifecycle = "2.10.0"
navigationCompose = "2.9.0"
hilt = "2.59.1"
hiltNavigationCompose = "1.3.0"
room = "2.8.4"
retrofit = "3.0.0"
okhttp = "5.0.0"
timber = "5.0.1"
sentry = "7.20.0"
junitJupiter = "5.11.4"
androidJunit5 = "1.13.0"
mockk = "1.13.13"
turbine = "1.2.0"
ktlint = "12.1.2"
detekt = "2.0.0"
gpp = "3.12.1"
paparazzi = "2.0.0"
kover = "0.8.3"

[libraries]
androidx-core-ktx = { group = "androidx.core", name = "core-ktx", version = "1.15.0" }
androidx-activity-compose = { group = "androidx.activity", name = "activity-compose", version.ref = "activityCompose" }
androidx-lifecycle-runtime-compose = { group = "androidx.lifecycle", name = "lifecycle-runtime-compose", version.ref = "lifecycle" }
androidx-lifecycle-viewmodel-compose = { group = "androidx.lifecycle", name = "lifecycle-viewmodel-compose", version.ref = "lifecycle" }

compose-bom = { group = "androidx.compose", name = "compose-bom", version.ref = "composeBom" }
compose-ui = { group = "androidx.compose.ui", name = "ui" }
compose-ui-tooling = { group = "androidx.compose.ui", name = "ui-tooling" }
compose-ui-tooling-preview = { group = "androidx.compose.ui", name = "ui-tooling-preview" }
compose-ui-test-junit4 = { group = "androidx.compose.ui", name = "ui-test-junit4" }
compose-ui-test-manifest = { group = "androidx.compose.ui", name = "ui-test-manifest" }
compose-material3 = { group = "androidx.compose.material3", name = "material3" }
compose-material-icons = { group = "androidx.compose.material", name = "material-icons-extended" }

navigation-compose = { group = "androidx.navigation", name = "navigation-compose", version.ref = "navigationCompose" }

hilt-android = { group = "com.google.dagger", name = "hilt-android", version.ref = "hilt" }
hilt-compiler = { group = "com.google.dagger", name = "hilt-android-compiler", version.ref = "hilt" }
hilt-navigation-compose = { group = "androidx.hilt", name = "hilt-navigation-compose", version.ref = "hiltNavigationCompose" }

room-runtime = { group = "androidx.room", name = "room-runtime", version.ref = "room" }
room-ktx = { group = "androidx.room", name = "room-ktx", version.ref = "room" }
room-compiler = { group = "androidx.room", name = "room-compiler", version.ref = "room" }
room-testing = { group = "androidx.room", name = "room-testing", version.ref = "room" }

retrofit = { group = "com.squareup.retrofit2", name = "retrofit", version.ref = "retrofit" }
retrofit-kotlinx-serialization = { group = "com.squareup.retrofit2", name = "converter-kotlinx-serialization", version.ref = "retrofit" }
okhttp-bom = { group = "com.squareup.okhttp3", name = "okhttp-bom", version.ref = "okhttp" }
okhttp = { group = "com.squareup.okhttp3", name = "okhttp" }
okhttp-logging = { group = "com.squareup.okhttp3", name = "logging-interceptor" }

kotlinx-serialization-json = { group = "org.jetbrains.kotlinx", name = "kotlinx-serialization-json", version.ref = "serialization" }
kotlinx-coroutines-android = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-android", version.ref = "coroutines" }
kotlinx-coroutines-test = { group = "org.jetbrains.kotlinx", name = "kotlinx-coroutines-test", version.ref = "coroutines" }
kotlinx-immutable = { group = "org.jetbrains.kotlinx", name = "kotlinx-collections-immutable", version = "0.3.8" }

timber = { group = "com.jakewharton.timber", name = "timber", version.ref = "timber" }
sentry-android = { group = "io.sentry", name = "sentry-android", version.ref = "sentry" }
sentry-compose = { group = "io.sentry", name = "sentry-compose-android", version.ref = "sentry" }

junit-jupiter = { group = "org.junit.jupiter", name = "junit-jupiter", version.ref = "junitJupiter" }
junit-jupiter-params = { group = "org.junit.jupiter", name = "junit-jupiter-params", version.ref = "junitJupiter" }
android-junit5 = { group = "de.mannodermaus.junit5", name = "android-test-core", version = "1.7.0" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }
mockk-android = { group = "io.mockk", name = "mockk-android", version.ref = "mockk" }
turbine = { group = "app.cash.turbine", name = "turbine", version.ref = "turbine" }

[plugins]
android-application = { id = "com.android.application", version.ref = "agp" }
android-library = { id = "com.android.library", version.ref = "agp" }
kotlin-android = { id = "org.jetbrains.kotlin.android", version.ref = "kotlin" }
kotlin-jvm = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
kotlin-serialization = { id = "org.jetbrains.kotlin.plugin.serialization", version.ref = "kotlin" }
ksp = { id = "com.google.devtools.ksp", version.ref = "ksp" }
hilt = { id = "com.google.dagger.hilt.android", version.ref = "hilt" }
ktlint = { id = "org.jlleitschuh.gradle.ktlint", version.ref = "ktlint" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
gpp = { id = "com.github.triplet.play", version.ref = "gpp" }
paparazzi = { id = "app.cash.paparazzi", version.ref = "paparazzi" }
kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }
```

### File 4: `build.gradle.kts` (root)

```kotlin
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.android.library) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.jvm) apply false
    alias(libs.plugins.kotlin.compose) apply false
    alias(libs.plugins.kotlin.serialization) apply false
    alias(libs.plugins.ksp) apply false
    alias(libs.plugins.hilt) apply false
    alias(libs.plugins.ktlint) apply false
    alias(libs.plugins.detekt) apply false
    alias(libs.plugins.kover) apply false
}

subprojects {
    apply(plugin = rootProject.libs.plugins.ktlint.get().pluginId)
    apply(plugin = rootProject.libs.plugins.detekt.get().pluginId)

    extensions.configure<io.gitlab.arturbosch.detekt.extensions.DetektExtension> {
        config.setFrom(rootProject.files("detekt.yml"))
        buildUponDefaultConfig = true
        autoCorrect = false
    }
}
```

### File 5: `app/build.gradle.kts`

```kotlin
plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
    alias(libs.plugins.kotlin.serialization)
    alias(libs.plugins.ksp)
    alias(libs.plugins.hilt)
    alias(libs.plugins.gpp)
}

android {
    namespace = "com.example.app"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.example.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
        testInstrumentationRunner = "com.example.app.HiltTestRunner"
        vectorDrawables { useSupportLibrary = true }
    }

    signingConfigs {
        create("release") {
            storeFile = file(System.getenv("ANDROID_KEYSTORE_FILE") ?: "../upload-key.jks")
            storePassword = System.getenv("ANDROID_KEYSTORE_PASSWORD")
            keyAlias = System.getenv("ANDROID_KEY_ALIAS")
            keyPassword = System.getenv("ANDROID_KEY_PASSWORD")
        }
    }

    buildTypes {
        debug {
            applicationIdSuffix = ".debug"
            isDebuggable = true
            buildConfigField("String", "API_BASE_URL", "\"https://api-dev.example.com/\"")
            buildConfigField("String", "SENTRY_DSN", "\"\"")
        }
        release {
            isMinifyEnabled = true
            isShrinkResources = true
            proguardFiles(getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro")
            signingConfig = signingConfigs.getByName("release")
            buildConfigField("String", "API_BASE_URL", "\"https://api.example.com/\"")
            buildConfigField("String", "SENTRY_DSN", "\"${System.getenv("SENTRY_DSN") ?: ""}\"")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
    buildFeatures {
        compose = true
        buildConfig = true
    }
    packaging {
        resources { excludes += "/META-INF/{AL2.0,LGPL2.1}" }
    }
    testOptions {
        unitTests.isIncludeAndroidResources = true
    }
}

play {
    serviceAccountCredentials.set(file("../play-service-account.json"))
    track.set("internal")
    defaultToAppBundles.set(true)
}

dependencies {
    implementation(project(":core:domain"))
    implementation(project(":core:data"))
    implementation(project(":core:ui"))

    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)

    implementation(platform(libs.compose.bom))
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.material3)
    implementation(libs.compose.material.icons)
    debugImplementation(libs.compose.ui.tooling)
    debugImplementation(libs.compose.ui.test.manifest)

    implementation(libs.navigation.compose)

    implementation(libs.hilt.android)
    ksp(libs.hilt.compiler)
    implementation(libs.hilt.navigation.compose)

    implementation(libs.kotlinx.serialization.json)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.kotlinx.immutable)

    implementation(libs.timber)
    implementation(libs.sentry.android)
    implementation(libs.sentry.compose)

    testImplementation(libs.junit.jupiter)
    testImplementation(libs.junit.jupiter.params)
    testImplementation(libs.mockk)
    testImplementation(libs.turbine)
    testImplementation(libs.kotlinx.coroutines.test)

    androidTestImplementation(libs.mockk.android)
    androidTestImplementation(libs.compose.ui.test.junit4)
    androidTestImplementation(libs.hilt.android)
    kspAndroidTest(libs.hilt.compiler)
}
```

### File 6: `app/proguard-rules.pro`

```
# Keep kotlinx.serialization
-keepattributes *Annotation*, InnerClasses
-dontnote kotlinx.serialization.AnnotationsKt
-keepclasseswithmembers class **.*$Companion {
    kotlinx.serialization.KSerializer serializer(...);
}
-if @kotlinx.serialization.Serializable class **
-keepclassmembers class <1> {
    static <1>$Companion Companion;
}

# Hilt
-keep class * extends dagger.hilt.android.HiltAndroidApp
-keep @dagger.hilt.android.AndroidEntryPoint class *

# Retrofit
-keepattributes Signature
-keepattributes Exceptions
-keep,allowobfuscation,allowshrinking class kotlin.Result
-keep,allowobfuscation,allowshrinking class kotlin.coroutines.Continuation

# Room
-keep class * extends androidx.room.RoomDatabase
-keep @androidx.room.Entity class *
-dontwarn androidx.room.paging.**

# Sentry
-keep class io.sentry.android.** { *; }

# kotlinx.coroutines
-keepnames class kotlinx.coroutines.internal.MainDispatcherFactory {}
-keepnames class kotlinx.coroutines.CoroutineExceptionHandler {}
```

### File 7: `gradle.properties`

```properties
org.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1g -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8
org.gradle.parallel=true
org.gradle.caching=true
org.gradle.configuration-cache=true
org.gradle.daemon=true

android.useAndroidX=true
android.nonTransitiveRClass=true
android.nonFinalResIds=true

kotlin.code.style=official
kotlin.incremental=true

ksp.useKSP2=true
```

### File 8: `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
insert_final_newline = true
indent_style = space
indent_size = 4
trim_trailing_whitespace = true

[*.{kt,kts}]
ij_kotlin_allow_trailing_comma = true
ij_kotlin_allow_trailing_comma_on_call_site = true
ktlint_standard_no-wildcard-imports = enabled
ktlint_standard_filename = enabled
ktlint_standard_function-naming = enabled

[*.{xml,yml,yaml,json,toml}]
indent_size = 2

[Makefile]
indent_style = tab
```

### File 9: `detekt.yml`

```yaml
build:
  maxIssues: 0
  excludeCorrectable: false

config:
  validation: true

processors:
  active: true

console-reports:
  active: true

complexity:
  active: true
  LongMethod:
    active: true
    threshold: 60
  TooManyFunctions:
    active: false

empty-blocks:
  active: true

exceptions:
  active: true
  TooGenericExceptionCaught:
    active: true

naming:
  active: true
  FunctionNaming:
    active: true
    functionPattern: '^[a-z][a-zA-Z0-9]*$|^[A-Z][a-zA-Z0-9]*$'  # allow PascalCase Composables

performance:
  active: true

potential-bugs:
  active: true

style:
  active: true
  MagicNumber:
    active: true
    excludeAnnotatedFunctions: ['Composable', 'Preview']
  MaxLineLength:
    maxLineLength: 140
  WildcardImport:
    active: true
```

### File 10: `app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:name=".MyApp"
        android:allowBackup="false"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.App"
        android:usesCleartextTraffic="false">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:theme="@style/Theme.App">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
```

### File 11: `app/src/main/java/com/example/app/MyApp.kt`

```kotlin
package com.example.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp
import io.sentry.android.core.SentryAndroid
import timber.log.Timber

@HiltAndroidApp
class MyApp : Application() {
    override fun onCreate() {
        super.onCreate()
        if (BuildConfig.DEBUG) Timber.plant(Timber.DebugTree())
        if (BuildConfig.SENTRY_DSN.isNotBlank()) {
            SentryAndroid.init(this) { it.dsn = BuildConfig.SENTRY_DSN }
        }
    }
}
```

### File 12: `app/src/main/java/com/example/app/MainActivity.kt`

```kotlin
package com.example.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import com.example.app.ui.nav.AppNavHost
import com.example.app.ui.theme.AppTheme
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { AppTheme { AppNavHost() } }
    }
}
```

### File 13: `app/src/main/java/com/example/app/ui/theme/Theme.kt`

```kotlin
package com.example.app.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.dynamicDarkColorScheme
import androidx.compose.material3.dynamicLightColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.ui.platform.LocalContext
import android.os.Build

@Composable
fun AppTheme(useDark: Boolean = isSystemInDarkTheme(), content: @Composable () -> Unit) {
    val ctx = LocalContext.current
    val scheme = when {
        Build.VERSION.SDK_INT >= 31 && useDark -> dynamicDarkColorScheme(ctx)
        Build.VERSION.SDK_INT >= 31 -> dynamicLightColorScheme(ctx)
        useDark -> darkColorScheme()
        else -> lightColorScheme()
    }
    MaterialTheme(colorScheme = scheme, content = content)
}
```

### File 14: `app/src/main/java/com/example/app/ui/nav/AppNavHost.kt`

```kotlin
package com.example.app.ui.nav

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.example.app.feature.home.HomeScreen
import kotlinx.serialization.Serializable

@Serializable object Home

@Composable
fun AppNavHost() {
    val nav = rememberNavController()
    NavHost(navController = nav, startDestination = Home) {
        composable<Home> { HomeScreen() }
    }
}
```

### File 15: `app/src/main/java/com/example/app/feature/home/HomeScreen.kt`

```kotlin
package com.example.app.feature.home

import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.lifecycle.compose.collectAsStateWithLifecycle

@Composable
fun HomeScreen(viewModel: HomeViewModel = hiltViewModel()) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Text(state.greeting)
    }
}
```

### File 16: `app/src/main/java/com/example/app/feature/home/HomeViewModel.kt`

```kotlin
package com.example.app.feature.home

import androidx.lifecycle.ViewModel
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject

data class HomeUiState(val greeting: String = "Hello, world.")

@HiltViewModel
class HomeViewModel @Inject constructor() : ViewModel() {
    private val _uiState = MutableStateFlow(HomeUiState())
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()
}
```

### File 17: `app/src/main/res/values/strings.xml`

```xml
<resources>
    <string name="app_name">My App</string>
</resources>
```

### File 18: `app/src/main/res/values/themes.xml`

```xml
<resources>
    <style name="Theme.App" parent="android:Theme.Material.Light.NoActionBar" />
</resources>
```

### File 19: `app/src/test/java/com/example/app/feature/home/HomeViewModelTest.kt`

```kotlin
package com.example.app.feature.home

import app.cash.turbine.test
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test

class HomeViewModelTest {
    @Test fun `emits initial greeting`() = runTest {
        HomeViewModel().uiState.test {
            assertEquals(HomeUiState("Hello, world."), awaitItem())
            cancelAndConsumeRemainingEvents()
        }
    }
}
```

### File 20: `maestro/flows/smoke.yaml`

```yaml
appId: com.example.app.debug
---
- launchApp
- assertVisible: "Hello, world."
```

### File 21: `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 17
      - uses: gradle/actions/setup-gradle@v4
      - name: Format check
        run: ./gradlew ktlintCheck
      - name: Static analysis
        run: ./gradlew detekt
      - name: Lint
        run: ./gradlew :app:lintDebug
      - name: Unit tests
        run: ./gradlew testDebugUnitTest
      - name: Assemble
        run: ./gradlew :app:assembleDebug

  release:
    needs: build
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with: { distribution: temurin, java-version: 17 }
      - uses: gradle/actions/setup-gradle@v4
      - name: Decode keystore
        run: echo "${{ secrets.ANDROID_KEYSTORE }}" | base64 -d > upload-key.jks
      - name: Decode service account
        run: echo "${{ secrets.PLAY_SERVICE_ACCOUNT }}" | base64 -d > play-service-account.json
      - name: Build bundle
        env:
          ANDROID_KEYSTORE_FILE: ${{ github.workspace }}/upload-key.jks
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: ${{ secrets.ANDROID_KEY_ALIAS }}
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}
          SENTRY_DSN: ${{ secrets.SENTRY_DSN }}
        run: ./gradlew :app:bundleRelease
      - name: Publish to Play (internal)
        run: ./gradlew :app:publishReleaseBundle --track internal
```

### File 22: `README.md`

```markdown
# My App

Native Android app. Stack: Kotlin · Compose · Hilt · Room · Coroutines.

See `rulebooks/jetpack-compose-android.md` for everything.

## Run

```bash
./gradlew :app:installDebug
adb shell am start -n com.example.app.debug/com.example.app.MainActivity
```

## Test

```bash
./gradlew testDebugUnitTest
maestro test maestro/flows/
```
```

After committing these 22 files plus the standard Gradle wrapper (`gradle/wrapper/gradle-wrapper.jar`, `gradlew`, `gradlew.bat`, `gradle/wrapper/gradle-wrapper.properties` pinned to `9.1.0`), `git push` produces a CI green build and a debug APK that installs and shows "Hello, world.".

## 17. Idea → MVP Path

(Generic CRUD app — replace nouns with the user's idea.)

### Phase 1 — Schema (1 session)

- Define Room entities for the core nouns (e.g. `Item`, `User`).
- Write DAOs with `@Query`, `Flow<List<X>>` reads, suspend writes.
- Build `@Database` class, version 1.
- Files touched: `core/data/db/entity/*.kt`, `core/data/db/dao/*.kt`, `core/data/db/AppDatabase.kt`.
- Exit: `./gradlew :core:data:assembleDebug` green; instrumented test inserts + reads succeed.

### Phase 2 — Backbone (1 session)

- Sealed `Routes` object listing all destinations.
- `AppNavHost` wires every route to a stub Composable.
- Theme + typography in `:core:ui`.
- Files: `app/ui/nav/Routes.kt`, `app/ui/nav/AppNavHost.kt`, stub `<Feature>Screen.kt`.
- Exit: app launches, you can navigate every route via debug overrides.

### Phase 3 — Vertical Slice (2 sessions)

- One feature end-to-end: list screen → detail screen → create/edit dialog.
- Repository → use cases → ViewModel → Composable, with tests at each layer.
- Maestro flow covering happy path.
- Files: `feature/<x>/*`, `core/domain/usecase/*`, `core/data/repo/*`, `maestro/flows/<x>.yaml`.
- Exit: all 4 layers tested, Maestro green, screenshots captured.

### Phase 4 — Auth + Multi-User (1 session)

- Firebase Auth + Credential Manager.
- `AuthRepository` exposes `Flow<User?>`.
- NavHost gates `Home` behind `User != null`.
- Files: `core/data/auth/*`, `feature/auth/*`, manifest changes.
- Exit: sign in, sign out, restart app — session persists.

### Phase 5 — Ship + Monitor (1 session)

- Generate upload key, register on Play Console.
- Configure GitHub Secrets, push tag, watch CI.
- Verify install from Internal Testing track.
- Confirm Sentry sees a test crash event.
- Exit: app live on Internal track, Sentry dashboard shows the build.

## 18. Feature Recipes

### 18.1 Authentication (email + Google)

Files to create/edit:

- `app/build.gradle.kts`: add `implementation("androidx.credentials:credentials:1.5.0")`, `implementation("androidx.credentials:credentials-play-services-auth:1.5.0")`, Firebase BOM.
- `core/data/auth/AuthRepository.kt`:

```kotlin
class AuthRepository @Inject constructor(private val auth: FirebaseAuth) {
    val user: Flow<FirebaseUser?> = callbackFlow {
        val l = FirebaseAuth.AuthStateListener { trySend(it.currentUser) }
        auth.addAuthStateListener(l)
        awaitClose { auth.removeAuthStateListener(l) }
    }
    suspend fun signInWithEmail(email: String, pw: String) = auth.signInWithEmailAndPassword(email, pw).await()
    suspend fun signOut() = auth.signOut()
}
```

- `feature/auth/LoginScreen.kt`, `LoginViewModel.kt`.
- Add `<meta-data android:name="com.google.android.gms.version" .../>` if using Play services.

### 18.2 File Upload + Storage

- Use `androidx.activity.compose.rememberLauncherForActivityResult` with `GetContent()`.
- Upload via Retrofit `@Multipart` with `@Part MultipartBody.Part`.
- Or: Firebase Storage `ref.putFile(uri).await()`.

### 18.3 Stripe (Google Play Billing)

- Use Google Play Billing Library 7+ for IAP (Stripe is forbidden for digital goods on Play).
- `implementation("com.android.billingclient:billing-ktx:7.1.1")`.
- `BillingClient.queryProductDetails()` → `launchBillingFlow()` → handle `PurchasesUpdatedListener`.

### 18.4 Push Notifications (FCM)

- `implementation(platform("com.google.firebase:firebase-bom:33.7.0"))`, `implementation("com.google.firebase:firebase-messaging-ktx")`.
- Service: `class AppFcmService : FirebaseMessagingService()` with `@AndroidEntryPoint`.
- Manifest: register service with `<intent-filter><action android:name="com.google.firebase.MESSAGING_EVENT"/></intent-filter>`.
- Request `POST_NOTIFICATIONS` runtime permission on API 33+.

### 18.5 Background Jobs (WorkManager)

- `implementation("androidx.work:work-runtime-ktx:2.10.0")` + `androidx.hilt:hilt-work`.
- `@HiltWorker class SyncWorker @AssistedInject constructor(...)`.
- Schedule: `WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(...)`.

### 18.6 Realtime (Firestore snapshots)

- `db.collection("items").snapshots().map { it.toObjects(Item::class.java) }` returns a Flow.
- Collect with `collectAsStateWithLifecycle()`.

### 18.7 Search

- In-memory: `flow.combine(query) { list, q -> list.filter { it.match(q) } }`.
- Room FTS4: `@Fts4 entity Item_FTS(...)` and `MATCH` queries.
- Algolia or Typesense for cross-device.

### 18.8 i18n

- `res/values-es/strings.xml`, `res/values-fr/strings.xml`, etc.
- `LocalContext.current.resources.getString(R.string.x)` (or just `stringResource(R.string.x)` in Compose).
- Right-to-left: `android:supportsRtl="true"`.

### 18.9 Dark Mode

- `MaterialTheme` already supports it via `AppTheme(useDark = isSystemInDarkTheme())`.
- Override per-user: store preference in DataStore, read in `AppTheme`.

### 18.10 Analytics Events

- Firebase Analytics: `Firebase.analytics.logEvent("screen_view", bundleOf("screen" to "home"))`.
- Wrap in a `Tracker` interface in `:core:domain` so tests can fake it.

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Could not find method alias()` | Update Gradle to 9.1.0; older Gradle lacks Version Catalog DSL alias support. |
| `Unable to find Hilt component for the given Activity` | Add `@AndroidEntryPoint` to the Activity. |
| `dagger.hilt.android.internal.modules.ApplicationContextModule must be registered` | Apply `id("dagger.hilt.android.plugin")` in app module. |
| `cannot find symbol class Hilt_MyApp` | Run `./gradlew :app:kspDebugKotlin`; ensure Hilt plugin is applied. |
| `Compose Compiler version is incompatible with Kotlin` | Apply `org.jetbrains.kotlin.plugin.compose`; remove explicit `kotlinCompilerExtensionVersion`. |
| `@Composable invocations can only happen from @Composable function` | Wrap call site in `@Composable` or move outside Compose tree. |
| `Type mismatch: Flow<X> is not StateFlow<X>` | `flow.stateIn(scope, SharingStarted.WhileSubscribed(5_000), initial)`. |
| `IllegalStateException: ViewModelStore should be set before setGraph` | Use `hiltViewModel()` inside Composable destination, not at NavHost root. |
| `Room cannot find getter for field` | Field must be `var` or class must have a constructor parameter. |
| `Migration didn't properly handle: <table>` | Compare exported schema JSON; `ALTER TABLE` mismatched column. |
| `INSTALL_FAILED_VERSION_DOWNGRADE` | `adb uninstall com.example.app.debug` then reinstall. |
| `INSTALL_FAILED_INSUFFICIENT_STORAGE` | Wipe emulator disk: AVD Manager → Wipe Data. |
| `OutOfMemoryError: Java heap space` (build) | Bump `org.gradle.jvmargs=-Xmx6g` in `gradle.properties`. |
| `Unresolved reference: BuildConfig` | Add `buildFeatures { buildConfig = true }` to `android` block. |
| `Permission Denial: Internet` | Add `<uses-permission android:name="android.permission.INTERNET"/>`. |
| `kotlinx.serialization.MissingFieldException` | DTO field is non-nullable but JSON missing it; mark nullable or add default. |
| `R8: Missing class kotlin.coroutines.jvm.internal.SuspendLambda` | Update kotlinx-coroutines; should not happen on 1.11+. |
| `Default FirebaseApp is not initialized` | Check `google-services.json` is in `app/`; apply `com.google.gms.google-services` plugin. |
| `NavHostController has no graph` | Define routes inside `NavHost { ... }` block before usage. |
| `Live Edit unavailable: feature requires API 30+` | Use a higher API emulator or disable Live Edit. |
| `Could not resolve com.android.tools.build:gradle` | Add `google()` to `pluginManagement.repositories` in `settings.gradle.kts`. |
| `kspDebugKotlin: NoClassDefFoundError: com.squareup.kotlinpoet` | Bump KSP to a version matching Kotlin 2.3.21 (e.g. 2.3.21-1.0.30). |
| `java.lang.NoSuchMethodError: void okhttp3.internal...` | Pin OkHttp via BOM, not transitively. |
| `Manifest merger failed: package name must be specified` | Set `namespace = "com.example.app"` in `android { }` block. |
| `Unable to determine task or item to be installed` | Ensure `./gradlew :app:installDebug` (not `install`). |
| `androidx.compose.ui:ui-tooling-preview is missing` | Add as `implementation`, not `debugImplementation`, for `@Preview` to compile. |
| `Configuration cache problem: invocation of Task.project` | Update plugin to a config-cache-compatible version, or set `--no-configuration-cache`. |
| `Test runner failed to run tests: Unable to find instrumentation info` | Use `HiltTestRunner` extending `AndroidJUnitRunner`; declare in `defaultConfig.testInstrumentationRunner`. |
| `androidTest: Could not find Hilt_TestApp` | Add `@HiltAndroidTest` and apply `kspAndroidTest(libs.hilt.compiler)`. |

## 20. Glossary

- **AGP (Android Gradle Plugin):** the Gradle plugin that knows how to build Android apps (turns Kotlin → DEX → APK/AAB).
- **AAB (Android App Bundle):** the upload format for Play; Play splits it per device.
- **APK:** the install format; Play generates these from your AAB.
- **AVD (Android Virtual Device):** an emulator instance.
- **BOM (Bill of Materials):** a file that pins compatible versions of a family of libraries.
- **Composable:** a Kotlin function annotated `@Composable` that produces UI.
- **Compose Compiler:** the Kotlin plugin that transforms `@Composable` into a recomposition tree.
- **Coroutine:** a suspendable computation; lets async code read like synchronous code.
- **DAO (Data Access Object):** Room interface annotated `@Dao` with SQL methods.
- **DI (Dependency Injection):** giving an object its dependencies instead of having it construct them.
- **Hilt:** the Android-specific layer over Dagger; codegens DI graph at compile time.
- **KSP (Kotlin Symbol Processing):** the modern annotation-processor system for Kotlin; replaces KAPT.
- **KAPT:** the legacy Kotlin annotation processor based on Java APT; slower; deprecated for our stack.
- **Material 3 (M3):** the current Material Design system, including dynamic color.
- **NavHost:** the Compose container that maps routes to screen Composables.
- **R8:** the code shrinker/optimizer/obfuscator for Android release builds (replaces ProGuard).
- **Recomposition:** Compose re-running a Composable when one of its inputs changed.
- **Repository:** the layer that decides whether to read from cache, DB, or network.
- **Room:** Google's SQLite ORM with compile-time SQL verification.
- **StateFlow:** a hot, value-holding Flow; the ViewModel-to-UI pipe.
- **ViewModel:** a class scoped to a screen; survives configuration changes.
- **ViewModelScope:** the coroutine scope tied to a ViewModel; cancelled on `onCleared`.
- **Use case:** a single business action expressed as a class with one operator function.
- **DTO (Data Transfer Object):** a class shaped like a wire format (JSON), separate from domain models.
- **Sealed class/interface:** a closed type hierarchy; lets the compiler exhaustiveness-check `when`.
- **Flow:** the cold reactive stream type from Kotlin coroutines.
- **Lifecycle:** Android's "this thing is started/resumed/stopped" state machine.
- **Manifest:** `AndroidManifest.xml`; declares the app's components, permissions, and metadata.
- **Maestro flow:** a YAML script that drives the running app to verify behavior end-to-end.
- **Play Console:** Google's web app for managing your Play Store listing and releases.
- **Play App Signing:** Google manages your real signing key; you only hold an upload key.
- **Internal track:** Play's fastest distribution channel for testers (under 100 users).

## 21. Update Cadence

This rulebook is valid for: Kotlin **2.3.x**, AGP **9.1.x**, Compose BOM **2026.04.x**, Hilt **2.59.x**, Room **2.8.x**.

Re-run the generator when:
- Kotlin minor bump (2.4.x).
- AGP major bump (10.0).
- Compose BOM jumps a quarter and changes a stable API.
- Play Console raises minimum target SDK.
- Security advisory in any pinned dep with CVSS ≥ 7.

Generated: **2026-04-27**.
