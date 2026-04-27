# JetBrains IDE Plugin — Rulebook

Build, sign, and ship a JetBrains IDE plugin (IntelliJ + Rider + WebStorm + PyCharm) using the IntelliJ Platform Gradle Plugin 2.x with Kotlin.

---

## 1. Snapshot

**Stack:** IntelliJ Platform plugin via `org.jetbrains.intellij.platform` 2.x (Gradle) + Kotlin 2.1 + IntelliJ Platform Plugin Template, multi-IDE target, JUnit 5, published to JetBrains Marketplace.

### Decisions table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Kotlin 2.1.10 | Required for IntelliJ Platform 2025.1+ plugins |
| Runtime + version | JDK 21 (Temurin) | Required by IntelliJ Platform 2024.2+ |
| Package manager | Gradle 8.10.2 (wrapper) | Mandated by `intellij-platform-gradle-plugin` 2.x |
| Build tool | `org.jetbrains.intellij.platform` 2.15.0 | Current 2.x line; 1.x is deprecated |
| State mgmt | IntelliJ `Service` + `PersistentStateComponent` | Built-in platform primitive |
| Routing/Nav | `actions` + `extensions` in `plugin.xml` | Platform-native registration |
| Data layer | `PropertiesComponent` / `XmlSerializer` | Built-in; no DB needed |
| Auth | N/A (plugin runs in IDE) | No backend |
| Styling | `JBUI` + `UIUtil` themes | Adapts to Darcula/Light automatically |
| Forms + validation | Kotlin UI DSL v2 | Official replacement for Swing forms |
| Unit test runner | JUnit 5 (`junit-jupiter`) + IntelliJ test framework | Platform `testFramework` ships JUnit 5 support |
| E2E framework | IntelliJ `Driver` / Starter framework | Official integration test driver |
| Mocking strategy | `MockK` for Kotlin units; never mock `Project`/`PsiFile` | Use real fixtures from platform |
| Logger | `com.intellij.openapi.diagnostic.Logger` | Routes to `idea.log` automatically |
| Error tracking | Built-in IDE error reporter | Marketplace dashboard exposes stats |
| Lint + format | Detekt 1.23.7 + ktlint via `detekt-formatting` | Single tool, two checks |
| Type checking | `kotlinc` strict (`-Werror`, `-Xexplicit-api=strict`) | Catches API drift early |
| Env vars + secrets | `gradle.properties` (local) + GitHub Secrets (CI) | Standard for `PRIVATE_KEY`/`PUBLISH_TOKEN` |
| CI provider | GitHub Actions | Template ships ready-to-use workflows |
| Deploy target | JetBrains Marketplace | Only legitimate channel |
| Release flow | `./gradlew publishPlugin` after `signPlugin` | Auto-runs in release workflow |
| Auto-update | Marketplace push → IDE polls | Built into every IDE |
| Target IDEs | IC (IntelliJ Community) + RD (Rider) + WS (WebStorm) + PY (PyCharm) | Covers 4 most common platforms |
| Platform module deps | `com.intellij.modules.platform` only | Maximizes IDE compatibility |
| Version source | `gradle.properties` → `pluginVersion` | Single source patched into `plugin.xml` |
| Verifier | `verifyPlugin` (2.x task) against IDE matrix | Catches API breakage pre-publish |
| Change-notes | `CHANGELOG.md` + Gradle Changelog Plugin | Patched into `plugin.xml` `<change-notes>` |

### Versions table

| Component | Version | Released | Source |
|---|---|---|---|
| `org.jetbrains.intellij.platform` | 2.15.0 | 2026-04-24 | https://plugins.gradle.org/plugin/org.jetbrains.intellij.platform |
| IntelliJ IDEA Community | 2026.1.1 (`IC-261.x`) | 2026-04 | https://blog.jetbrains.com/idea/2026/04/intellij-idea-2026-1-1/ |
| IntelliJ Platform Plugin Template | `main` | rolling | https://github.com/JetBrains/intellij-platform-plugin-template |
| Kotlin | 2.1.10 | 2026-01 | https://kotlinlang.org/docs/whatsnew21.html |
| Gradle | 8.10.2 | bundled | https://docs.gradle.org/current/userguide/compatibility.html |
| JDK | 21 (Temurin) | LTS | https://adoptium.net |
| JUnit Jupiter | 5.11.4 | 2025 | https://junit.org/junit5/ |
| Detekt | 1.23.7 | 2025 | https://github.com/detekt/detekt |
| Qodana action | 2026.1 | 2026 | https://github.com/JetBrains/qodana-action |
| Marketplace ZIP Signer | 0.1.34 (auto) | 2026 | bundled in 2.x |
| Plugin Verifier | 1.388 (auto) | 2026 | bundled in 2.x |
| Gradle Changelog Plugin | 2.2.1 | 2025 | https://github.com/JetBrains/gradle-changelog-plugin |

### Minimum host requirements

- macOS 12+ / Windows 10+ / Linux glibc 2.31+
- 8 GB RAM (16 GB recommended; sandbox IDE is heavy)
- 10 GB free disk (sandbox IDE caches grow)
- JDK 21 on PATH

### Cold-start estimate

~15 minutes from `git clone` to running sandbox IDE on a fresh machine (Gradle downloads ~2 GB of IDE artifacts on first `./gradlew runIde`).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Homebrew if absent
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. JDK 21
brew install --cask temurin@21
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 21)' >> ~/.zshrc
source ~/.zshrc

# 3. Git + GitHub CLI
brew install git gh
gh auth login

# 4. Clone the template
gh repo create echo-action --template JetBrains/intellij-platform-plugin-template --public --clone
cd echo-action

# 5. Build + run sandbox IDE
./gradlew runIde
```

### Windows (PowerShell)

```powershell
# 1. winget JDK 21
winget install EclipseAdoptium.Temurin.21.JDK
[Environment]::SetEnvironmentVariable("JAVA_HOME","C:\Program Files\Eclipse Adoptium\jdk-21.0.4.7-hotspot","User")

# 2. Git + gh
winget install Git.Git GitHub.cli
gh auth login

# 3. Clone template
gh repo create echo-action --template JetBrains/intellij-platform-plugin-template --public --clone
cd echo-action

# 4. Build + run
.\gradlew.bat runIde
```

### Linux (Debian/Ubuntu)

```bash
sudo apt update
sudo apt install -y openjdk-21-jdk git curl
curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list
sudo apt update && sudo apt install gh
gh auth login

gh repo create echo-action --template JetBrains/intellij-platform-plugin-template --public --clone
cd echo-action
./gradlew runIde
```

### Accounts to create

| Account | Purpose | Link |
|---|---|---|
| GitHub | source + CI | https://github.com/signup |
| JetBrains Hub | Marketplace login | https://hub.jetbrains.com |
| JetBrains Marketplace | publish plugin | https://plugins.jetbrains.com/author/me |

After registering on Marketplace, generate a `PUBLISH_TOKEN` at https://plugins.jetbrains.com/author/me/tokens and add to `.env`/CI secrets.

### Expected first-run output

```
> Task :runIde
[2026-04-27 12:34:56] [main] INFO  - IDE: IntelliJ IDEA 2026.1
[2026-04-27 12:34:58] [main] INFO  - Plugin loaded: com.example.echo (1.0.0)
```

A new IDE window opens. **Tools → Echo Action** is visible.

### Common first-run errors

| Error | Fix |
|---|---|
| `Unsupported class file major version 65` | JDK 21 not on PATH. `export JAVA_HOME=$(/usr/libexec/java_home -v 21)` |
| `Could not find org.jetbrains.intellij.platform...` | Add `mavenCentral()` and `intellijPlatform { defaultRepositories() }` to `settings.gradle.kts` `pluginManagement.repositories` |
| `Plugin requires platform IU but found IC` | `intellijIdeaCommunity(...)` selected but plugin asks for Ultimate APIs — use `intellijIdeaUltimate(...)` |
| `Compilation error: cannot access ...PsiFile` | Missing `bundledPlugin("com.intellij.java")` in `dependencies { intellijPlatform { ... } }` |
| `signPlugin: No certificate chain provided` | Set `CERTIFICATE_CHAIN`, `PRIVATE_KEY`, `PRIVATE_KEY_PASSWORD` env vars (see §11) |

---

## 3. Project Layout

```
echo-action/
├── .github/
│   └── workflows/
│       ├── build.yml           # PR build + verifier
│       └── release.yml         # signPlugin + publishPlugin
├── .cursor/
│   └── rules                   # Cursor rules
├── gradle/
│   ├── libs.versions.toml      # version catalog
│   └── wrapper/
├── src/
│   ├── main/
│   │   ├── kotlin/com/example/echo/
│   │   │   ├── EchoAction.kt
│   │   │   ├── settings/EchoSettings.kt
│   │   │   └── services/EchoService.kt
│   │   └── resources/
│   │       ├── META-INF/
│   │       │   ├── plugin.xml          # plugin descriptor
│   │       │   └── pluginIcon.svg
│   │       └── messages/EchoBundle.properties
│   └── test/
│       └── kotlin/com/example/echo/
│           └── EchoActionTest.kt
├── build.gradle.kts
├── settings.gradle.kts
├── gradle.properties
├── gradlew, gradlew.bat
├── qodana.yml
├── .editorconfig
├── CHANGELOG.md
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### Naming conventions

- Actions: `<Name>Action.kt`, ID `com.example.echo.<Name>`
- Services: `<Name>Service.kt`, registered as `@Service(Service.Level.PROJECT)` or `@Service(Service.Level.APP)`
- Settings: `<Name>Settings.kt` + `<Name>Configurable.kt`
- Tests: `<ClassName>Test.kt` mirroring source path
- Resource bundle keys: `action.echo.title`, `notification.echo.success`

### "Where does X go?" table

| Adding | Goes in |
|---|---|
| Action (menu/keyboard) | `src/main/kotlin/.../actions/` + `<actions>` in `plugin.xml` |
| Background service | `src/main/kotlin/.../services/` + `@Service` annotation |
| Tool window | `src/main/kotlin/.../toolwindow/` + `<toolWindow>` extension |
| Settings page | `src/main/kotlin/.../settings/` + `<applicationConfigurable>` extension |
| Inspection | `src/main/kotlin/.../inspections/` + `<localInspection>` extension |
| Intention action | `src/main/kotlin/.../intentions/` + `<intentionAction>` extension |
| File template | `src/main/resources/fileTemplates/` |
| Live template | `src/main/resources/liveTemplates/` |
| Color scheme | `src/main/resources/colorSchemes/` |
| Icon | `src/main/resources/icons/` (SVG, 16×16 + dark variant `_dark.svg`) |
| Localized string | `src/main/resources/messages/EchoBundle.properties` |
| Notification group | `<notificationGroup id="..." displayType="BALLOON"/>` in `plugin.xml` |
| Run configuration type | `src/main/kotlin/.../run/` + `<configurationType>` extension |
| Listener | `src/main/kotlin/.../listeners/` + `<applicationListeners>` block |
| Test | `src/test/kotlin/...` mirroring main package |

---

## 4. Architecture

### Process boundaries

```
┌──────────────── IDE JVM (host) ─────────────────┐
│                                                 │
│  ┌─── Plugin classloader ────────────────────┐  │
│  │  EchoAction (UI thread, Swing EDT)        │  │
│  │  EchoService (background pool)            │  │
│  │  EchoSettings (PersistentStateComponent)  │  │
│  └────────────────────────────────────────────┘ │
│                                                 │
│  Platform: Project, PsiManager, EditorFactory   │
└──────────────────────────────────────────────────┘
```

### Action data flow

```
User keypress / menu click
  → ActionManager.fireBeforeActionPerformed
  → EchoAction.update(AnActionEvent)        [EDT, fast]
  → EchoAction.actionPerformed(AnActionEvent)
       └─→ EchoService.echo(text)            [pool thread]
              └─→ Notifications.Bus.notify(...) [EDT]
```

### Settings flow

```
EchoSettingsComponent (UI DSL v2)
  ↕ EchoConfigurable
  ↕ EchoSettings (PersistentStateComponent → echo.xml)
```

### Entry-point file map

| File | Responsibility |
|---|---|
| `plugin.xml` | Declarative registration (ID, deps, actions, extensions, listeners) |
| `EchoAction.kt` | One UI action; thin — delegates work to a service |
| `EchoService.kt` | All business logic; pure functions where possible |
| `EchoSettings.kt` | Persistent state — `@State(name=..., storages=[Storage("echo.xml")])` |
| `EchoBundle.properties` | All user-visible strings; never hardcode in Kotlin |

### Where business logic lives

- **Lives in:** `services/` (testable, no Swing imports).
- **Never lives in:** `actions/` (only event routing), `plugin.xml` (only registration), `*Configurable.kt` (only UI binding).

---

## 5. Dev Workflow

### Start the sandbox IDE

```bash
./gradlew runIde
```

`runIde` launches a fresh sandbox IDE with the plugin loaded. The sandbox lives in `build/idea-sandbox/` and is wiped by `clean`.

### Hot reload

Code changes require restarting `runIde`. Resource changes (`plugin.xml`, properties files) reload on IDE restart only. There is no live-reload — quit the sandbox IDE, re-run `./gradlew runIde`.

### Attach a debugger

- **IntelliJ IDEA host:** `./gradlew runIde --debug-jvm` then attach run config "Remote JVM Debug" to `localhost:5005`.
- **VS Code:** install "Extension Pack for Java" + "Gradle for Java", run `./gradlew runIde --debug-jvm`, use the launch config in §15.
- **Cursor:** same as VS Code.

### Inspect runtime state

- `idea.log` lives in sandbox: `build/idea-sandbox/system/log/idea.log`. Tail with `tail -f build/idea-sandbox/system/log/idea.log`.
- Internal Mode: in sandbox IDE, **Help → Show Action IDs**, **Help → Diagnostic Tools → UI Inspector**.
- PSI Viewer: **Tools → View PSI Structure of Current File** (sandbox shows it because Internal Mode is on).

### Pre-commit checks

`.git/hooks/pre-commit` (installed by `./gradlew installGitHooks` task in §13):

```
./gradlew detekt verifyPluginStructure --quiet || exit 1
```

### Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`).
- Never commit directly to `main`.

---

## 6. Testing & Parallelization

### Unit tests

```bash
./gradlew test
```

Tests live in `src/test/kotlin/`, named `<ClassName>Test.kt`. JUnit 5 + IntelliJ test framework.

### Single test / file / watch

```bash
./gradlew test --tests "com.example.echo.EchoActionTest.echoesText"
./gradlew test --tests "com.example.echo.EchoActionTest"
./gradlew test --continuous
```

### E2E / integration (Starter framework)

```bash
./gradlew :integrationTest
```

Starter framework supports JUnit 5 only and runs IDE-under-test in a separate process — it uses the `Driver` API to send keystrokes/clicks. Parallel by default via JUnit 5 `junit.jupiter.execution.parallel.enabled=true`.

### Plugin Verifier (compatibility matrix)

```bash
./gradlew verifyPlugin
```

Runs the plugin against every IDE listed under `intellijPlatform.pluginVerification.ides` in `build.gradle.kts`. **Mandatory before publish.**

### Mocking rules

- **Mock:** pure-Kotlin services (`EchoService`) using MockK.
- **Never mock:** `Project`, `PsiFile`, `Editor`, `VirtualFile` — use `BasePlatformTestCase`'s real fixtures (`myFixture.configureByText(...)`).
- **Never mock:** the IDE platform itself. If you need a `Project`, extend `BasePlatformTestCase`.

### Coverage

Kover plugin (bundled in template). Target: 70% line coverage on `services/` and `settings/`. UI (`actions/`, `toolwindow/`) excluded — exercised via Starter.

```bash
./gradlew koverHtmlReport
open build/reports/kover/html/index.html
```

### Parallelization patterns for AI agents

**Safe (parallel subagents):**
- Add new action + add new service + add new test (each touches disjoint files).
- Bump three icon SVGs.
- Update three localized bundle entries.

**Sequential (single agent):**
- Anything touching `gradle.properties`, `build.gradle.kts`, `settings.gradle.kts`, `plugin.xml`.
- Anything touching `gradle/libs.versions.toml`.
- Anything touching `CHANGELOG.md` (changelog plugin reads it).

---

## 7. Logging

### Setup

The IntelliJ Platform ships its own logger. **Never** add SLF4J or Logback.

```kotlin
package com.example.echo.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger

@Service(Service.Level.APP)
class EchoService {
    private val log = Logger.getInstance(EchoService::class.java)

    fun echo(text: String): String {
        log.info("echo.invoked length=${text.length}")
        return text.uppercase()
    }
}
```

### Levels

| Level | When |
|---|---|
| `error` | Caught throwable that affects user; auto-routes to IDE error reporter |
| `warn` | Recoverable misconfiguration |
| `info` | Lifecycle (plugin load, action invocation, settings change) |
| `debug` | Per-action diagnostics; off by default |
| `trace` | Per-PSI-element noise; only with `idea.log.debug.categories` |

### Required fields per log line

`module=<service>` `event=<verb>` `request_id=<uuid>` (per-action) `project=<name>` (when applicable). Format: space-separated `key=value`.

### Sample log lines

```
[2026-04-27 12:34:56,123] [   1234]   INFO - #c.e.e.EchoAction - module=action event=invoked request_id=a1b2 project=demo
[2026-04-27 12:34:56,140] [   1234]   INFO - #c.e.e.s.EchoService - module=service event=echo.completed request_id=a1b2 length=12
[2026-04-27 12:34:56,200] [   1234]   WARN - #c.e.e.s.EchoService - module=service event=settings.missing fallback=default
[2026-04-27 12:34:56,300] [   1234]  ERROR - #c.e.e.s.EchoService - module=service event=echo.failed request_id=a1b2
java.lang.IllegalStateException: ...
```

### Where logs are written

- **Dev:** sandbox `build/idea-sandbox/system/log/idea.log` (rotates).
- **Prod (user machines):** `~/Library/Logs/JetBrains/IntelliJIdea2026.1/idea.log` (macOS), `%LOCALAPPDATA%\JetBrains\IntelliJIdea2026.1\log\idea.log` (Windows), `~/.cache/JetBrains/IntelliJIdea2026.1/log/idea.log` (Linux). Errors auto-submit to the JetBrains error reporter when users opt in.

### Grep recipe

```bash
grep -E "EchoAction|EchoService" build/idea-sandbox/system/log/idea.log | tail -200
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always declare the plugin via `id("org.jetbrains.intellij.platform")` 2.x — never the legacy `org.jetbrains.intellij` 1.x.
2. Always pin the IntelliJ Platform Gradle Plugin to a fixed version in `gradle/libs.versions.toml`.
3. Always set `pluginVersion`, `pluginSinceBuild`, `platformVersion` in `gradle.properties` — never hardcode in `build.gradle.kts`.
4. Always patch `plugin.xml` via the `intellijPlatform { pluginConfiguration { ... } }` block — never edit `<idea-version since-build="..."/>` by hand.
5. Always declare module dependencies in `plugin.xml` with `<depends>com.intellij.modules.platform</depends>` for cross-IDE compatibility.
6. Always run `./gradlew verifyPlugin` before opening a release PR.
7. Always store `PRIVATE_KEY`, `CERTIFICATE_CHAIN`, `PRIVATE_KEY_PASSWORD`, `PUBLISH_TOKEN` in environment variables; never in source.
8. Always wrap blocking work in `ApplicationManager.getApplication().executeOnPooledThread { ... }` — never block the EDT.
9. Always read/modify PSI under a `ReadAction` / `WriteCommandAction.runWriteCommandAction(project) { ... }`.
10. Always register services with `@Service(Service.Level.APP)` or `@Service(Service.Level.PROJECT)` — never instantiate via `new`.
11. Always retrieve a service with `service<EchoService>()` (Kotlin extension) or `ApplicationManager.getApplication().getService(...)`.
12. Always use `ResourceBundle` (`EchoBundle.message("key")`) for user-visible strings.
13. Always prefer Kotlin UI DSL v2 (`panel { row("Label") { textField() } }`) for settings — never raw Swing.
14. Always include both `pluginIcon.svg` (light) and `pluginIcon_dark.svg` (dark) in `META-INF/`.
15. Always run `./gradlew detekt` before commit.
16. Always update `CHANGELOG.md` under `## [Unreleased]` for every user-visible change.
17. Always set `pluginUntilBuild` empty in `gradle.properties` (Marketplace auto-extends since 2025.2).
18. Always declare `pluginGroup`, `pluginName`, `pluginRepositoryUrl` in `gradle.properties`.
19. Always test against the lowest supported IDE version listed in `intellijPlatform.pluginVerification.ides`.
20. Always use `Notifications.Bus.notify(Notification(groupId, title, content, type))` for user feedback — register the group in `plugin.xml`.
21. Always commit `gradle/wrapper/gradle-wrapper.jar` and `gradle-wrapper.properties`.

### 8.2 NEVER

1. Never use the deprecated `org.jetbrains.intellij` 1.x plugin or its `intellij { ... }` block.
2. Never reference internal IntelliJ classes (those under `com.intellij.openapi.*.impl` or marked `@ApiStatus.Internal`) — they break across versions.
3. Never put logic in `EchoAction.actionPerformed` beyond routing; delegate to a service.
4. Never call `Thread.sleep` on the EDT.
5. Never call `runReadAction` from the EDT for long operations — schedule via `ProgressManager.getInstance().run(Task.Backgroundable(...))`.
6. Never depend on `com.intellij.modules.java` unless the plugin truly needs Java PSI; doing so excludes WebStorm/PyCharm/Rider.
7. Never include the IntelliJ Platform JARs in the published ZIP — `intellijPlatform` excludes them automatically; do not override.
8. Never log secrets (`PRIVATE_KEY`, tokens) — Logger output is uploaded with error reports.
9. Never call `System.out.println` — use `Logger`.
10. Never use `kotlin-stdlib` from `dependencies { implementation(...) }`; the IDE bundles it. Add only as `compileOnly`.
11. Never write to disk outside `PathManager.getPluginsPath()` or `PathManager.getConfigPath()`.
12. Never use the legacy `IdeaTestCase` — extend `BasePlatformTestCase` (JUnit 4 compat) or use JUnit 5 `@TestApplication` from the IntelliJ test framework.
13. Never bypass `signPlugin` when uploading; Marketplace rejects unsigned ZIPs after the 2025 requirement.
14. Never set `intellijPlatform.instrumentCode = false` unless you know what you are doing — it disables nullability checks.
15. Never bundle libraries that overlap with platform-bundled ones (Guava, Kotlin stdlib, OkHttp).
16. Never reference `@Inject` or any DI framework — use `service<T>()`.
17. Never write to a `VirtualFile` outside a `WriteAction`.
18. Never publish without running `./gradlew verifyPlugin` first.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `gradle.properties` | every task; version + platform | `./gradlew clean build verifyPlugin` |
| `build.gradle.kts` | full build graph | `./gradlew clean build verifyPlugin` |
| `settings.gradle.kts` | repos + plugin resolution | `./gradlew --refresh-dependencies build` |
| `gradle/libs.versions.toml` | dependency versions | `./gradlew clean build` |
| `gradle/wrapper/gradle-wrapper.properties` | Gradle version itself | `./gradlew --version && ./gradlew build` |
| `src/main/resources/META-INF/plugin.xml` | IDE registration | `./gradlew verifyPluginStructure && verifyPlugin` |
| `src/main/resources/messages/*.properties` | every UI string | `./gradlew test runIde` |
| `src/main/kotlin/.../EchoAction.kt` | menu action | `./gradlew test` + manual smoke in `runIde` |
| `src/main/kotlin/.../services/EchoService.kt` | business logic | `./gradlew test` |
| `src/main/kotlin/.../settings/EchoSettings.kt` | persisted user prefs | migration test + `runIde` smoke |
| `qodana.yml` | quality scan output | `./gradlew qodanaScan` (or CI) |
| `.github/workflows/build.yml` | PR CI | trigger via `gh workflow run build.yml` |
| `.github/workflows/release.yml` | publish flow | dry-run with `--dry-run` flag, then real tag |
| `CHANGELOG.md` | `<change-notes>` in `plugin.xml` | `./gradlew patchChangelog && verifyPluginStructure` |
| `pluginIcon.svg` / `pluginIcon_dark.svg` | listing icon | `./gradlew buildPlugin` then unzip + visual diff |
| `src/test/**` | CI gate | `./gradlew test` |
| `.editorconfig` | formatting | `./gradlew detekt` |
| `detekt.yml` (if present) | lint rules | `./gradlew detekt` |
| `gradle.properties: platformVersion` | which IDE used to compile | `./gradlew clean build verifyPlugin` |
| `gradle.properties: pluginSinceBuild` | which IDEs accept install | `./gradlew verifyPlugin` |
| `gradle.properties: pluginVersion` | Marketplace bookkeeping | `./gradlew patchPluginXml verifyPluginStructure` |
| `intellijPlatform.signing.*` env vars | release-only | dry-run `./gradlew signPlugin --info` |
| `intellijPlatform.publishing.token` env | release-only | dry-run `./gradlew publishPlugin -Pdryrun=true` |

### 8.4 Definition of Done

**Bug fix**
- Failing test added; passes after fix.
- `./gradlew detekt test verifyPlugin` green.
- `CHANGELOG.md` `## [Unreleased] ### Fixed` updated.

**New feature**
- Unit tests for service logic (≥3 cases incl. edge).
- Manual smoke in `./gradlew runIde` (screenshot in PR).
- New strings in `EchoBundle.properties`.
- `CHANGELOG.md` `## [Unreleased] ### Added` updated.
- `verifyPlugin` against full IDE matrix.

**Refactor**
- No new public APIs; `kotlinc -Xexplicit-api=strict` clean.
- Test count unchanged or higher.
- Diff doesn't touch `gradle.properties` / `plugin.xml` unless intended.

**Dependency bump**
- One PR per dep family.
- `./gradlew --refresh-dependencies build verifyPlugin`.
- Note in `CHANGELOG.md ### Changed`.

**Schema (settings) change**
- Migration `@Migration` test (load old XML, assert new state).
- `Storage` filename unchanged or migration provided.

**Copy change**
- Only `EchoBundle.properties` touched (and translations).
- Screenshot in PR showing each surface.
- `### Changed` entry in `CHANGELOG.md`.

### 8.5 Self-Verification Recipe

```bash
./gradlew --version                                # expect: Gradle 8.10.2
./gradlew clean                                    # expect: BUILD SUCCESSFUL
./gradlew detekt                                   # expect: BUILD SUCCESSFUL
./gradlew test                                     # expect: BUILD SUCCESSFUL, X tests, 0 failures
./gradlew verifyPluginStructure                    # expect: BUILD SUCCESSFUL
./gradlew buildPlugin                              # expect: distribution at build/distributions/<name>-<version>.zip
./gradlew verifyPlugin                             # expect: "Compatible with the IDE" for every entry
./gradlew runIde --no-daemon &                     # smoke: window opens, Tools → Echo Action visible
```

Green = literal final line `BUILD SUCCESSFUL in <n>s` and (for `verifyPlugin`) zero `COMPATIBILITY_PROBLEMS`.

### 8.6 Parallelization Patterns

| Safe to fan out | Must serialize |
|---|---|
| Add `EchoAction` + add `EchoService` + add `EchoActionTest` | Anything editing `plugin.xml` |
| Add localized strings in 3 different `_xx.properties` files | Anything editing `gradle.properties` |
| Update 3 icons in `resources/icons/` | Anything editing `build.gradle.kts` |
| Add 3 unrelated test classes | Anything editing `gradle/libs.versions.toml` |

---

## 9. Stack-Specific Pitfalls

1. **Pinning to old `org.jetbrains.intellij` 1.x.** Symptom: docs show `intellij { version.set(...) }`. Cause: outdated tutorial. Fix: switch to `id("org.jetbrains.intellij.platform") version "2.15.0"` and use the `intellijPlatform { ... }` block. Detect: `./gradlew tasks` lists `runPluginVerifier` (1.x) instead of `verifyPlugin` (2.x).
2. **`since-build` excludes the running IDE.** Symptom: "Plugin requires build 241+". Cause: `pluginSinceBuild=261` while user runs 2024.1 (`241`). Fix: align `pluginSinceBuild` with the lowest IDE version you intend to support; set `pluginUntilBuild` empty.
3. **Hardcoded `until-build` blocks new EAP.** Symptom: plugin disappears after IDE upgrade. Fix: leave `pluginUntilBuild=` blank — Marketplace auto-extends since 2025.2.
4. **Missing `<depends>` for required platform module.** Symptom: `NoClassDefFoundError` on `JavaPsiFacade`. Cause: plugin imports Java PSI but only declares `com.intellij.modules.platform`. Fix: add `<depends>com.intellij.modules.java</depends>` (drops compat with WS/PY).
5. **Leaking `PRIVATE_KEY` in CI logs.** Symptom: GitHub flags "secret detected". Cause: logging the key during `signPlugin --info`. Fix: use GitHub Secret + `secrets.PRIVATE_KEY`, don't pass `--info`.
6. **Forgetting `verifyPlugin` before publish.** Symptom: Marketplace shows compatibility errors after release. Fix: gate the release workflow on `verifyPlugin` succeeding.
7. **Internal class refs.** Symptom: `ClassNotFoundException` on next IDE EAP. Cause: imported `com.intellij.openapi.editor.impl.EditorImpl`. Fix: use the public interface `Editor`. Detect: Plugin Verifier flags `INTERNAL_API_USAGE`.
8. **Long work on the EDT.** Symptom: IDE freezes ("Not Responding"). Fix: wrap in `Task.Backgroundable` + `ProgressManager`.
9. **Bundled Kotlin stdlib version mismatch.** Symptom: `NoSuchMethodError` on `kotlin.collections.*`. Fix: never use `implementation("org.jetbrains.kotlin:kotlin-stdlib")`; rely on platform-bundled stdlib.
10. **Touching VFS outside a Write Action.** Symptom: `Throwable: Write access is allowed inside write-action only`. Fix: wrap in `WriteCommandAction.runWriteCommandAction(project) { ... }`.
11. **Service registered both via `@Service` and `<applicationService>`.** Symptom: `IllegalStateException: Service already registered`. Fix: remove the `<applicationService>` element — `@Service` is enough.
12. **Tests using `Project` mock.** Symptom: NPE deep inside platform code. Fix: extend `BasePlatformTestCase` and use `myFixture.project`.
13. **Sandbox cache stale after platform bump.** Symptom: plugin loads old code. Fix: `./gradlew clean` then `runIde`.
14. **`bundledPlugin("...")` ID typo.** Symptom: `Could not resolve dependency`. Fix: use exact IDs from https://plugins.jetbrains.com (e.g. `bundledPlugin("Git4Idea")`).
15. **Plugin ID conflict with marketplace.** Symptom: `publishPlugin` fails "Plugin ID already exists". Fix: choose a globally unique ID like `com.example.echo` and reserve it on Marketplace before first publish.
16. **`change-notes` not patched.** Symptom: Marketplace listing missing changelog. Cause: forgot `id("org.jetbrains.changelog") version "2.2.1"` and `intellijPlatform.pluginConfiguration.changeNotes = changelog.renderItem(...)`. Fix: include both.
17. **Icon not appearing in plugin list.** Cause: missing `pluginIcon.svg` at `src/main/resources/META-INF/`. Fix: add 40×40 SVG plus `pluginIcon_dark.svg` for dark theme.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Plugin load (ColdStart) | < 50 ms added to IDE startup | `idea.log` line `Plugin com.example.echo loaded in Xms` |
| Action `update()` call | < 10 ms (called every 100 ms) | profile via `ApplicationManagerEx.getApplicationEx().assertReadAccessAllowed()` + IDE built-in profiler |
| Action `actionPerformed` (UI thread) | < 50 ms; otherwise must run as `Task.Backgroundable` | log start/end |
| Service init | < 100 ms; otherwise `@Service` with lazy init | `idea.log` |
| Plugin distribution ZIP | < 5 MB (Marketplace soft cap) | `ls -lh build/distributions/*.zip` |
| Memory allocation per action | < 1 MB/invocation | YourKit profiler attached to sandbox |

When exceeded: move work off the EDT; convert eager init to lazy; remove transitive deps with `./gradlew dependencies`.

---

## 11. Security

### Secret storage

| Secret | Local | CI |
|---|---|---|
| `PRIVATE_KEY` | `~/.gradle/gradle.properties` (chmod 600), as `signPlugin.privateKey=...` | GitHub Secret `PRIVATE_KEY` |
| `PRIVATE_KEY_PASSWORD` | same | GitHub Secret `PRIVATE_KEY_PASSWORD` |
| `CERTIFICATE_CHAIN` | same | GitHub Secret `CERTIFICATE_CHAIN` |
| `PUBLISH_TOKEN` | same | GitHub Secret `PUBLISH_TOKEN` |

**Never** put secrets in repo `gradle.properties`, `.env` committed to git, or any file under source control. Add `*.local.properties` to `.gitignore`.

### Generating the signing certificate

```bash
# RSA 4096 key, AES-256 encrypted
openssl genpkey -aes-256-cbc -algorithm RSA -pkeyopt rsa_keygen_bits:4096 \
  -out private.pem
openssl req -new -x509 -key private.pem -sha256 -days 1825 -out chain.crt \
  -subj "/CN=Echo Action Plugin"
```

Save `private.pem` and `chain.crt` outside the repo. Their **content** (not paths) becomes the env vars `PRIVATE_KEY` / `CERTIFICATE_CHAIN`.

### Auth threat model

Plugin runs inside the user's IDE with full FS access (the IDE itself has it). Treat the plugin as a trusted local process. No remote auth.

### Input validation boundary

Anywhere a user types text destined for `Runtime.exec` or `ProcessBuilder`: validate against a strict allow-list. Never `Runtime.exec(userText)`.

### Output escaping

`HtmlChunk` API for any text rendered into IDE notifications (`Notification` accepts HTML). Never concatenate untrusted strings into HTML — use `HtmlChunk.text(...)`.

### Dependency audit

```bash
./gradlew dependencyUpdates              # Ben Manes plugin
./gradlew dependencyCheckAnalyze         # OWASP dep check
```

Cadence: weekly via `.github/workflows/scheduled.yml` (Dependabot also handles it).

### Top 5 risks

1. Internal API usage → breaks on IDE upgrade. Mitigation: `verifyPlugin`.
2. Leaked `PUBLISH_TOKEN` → attacker can ship malicious updates. Mitigation: scoped tokens, GitHub OIDC.
3. Unsigned ZIP rejected by Marketplace. Mitigation: `signPlugin` always.
4. PSI write outside `WriteCommandAction` → corrupts user files. Mitigation: enforce via Detekt rule.
5. Long EDT block → IDE hang reports. Mitigation: budget in §10 + code review checklist.

---

## 12. Deploy

### Release flow

```bash
# 1. Update CHANGELOG.md: move [Unreleased] notes under new version
# 2. Bump pluginVersion in gradle.properties (e.g. 1.0.0 → 1.1.0)
# 3. Commit + tag
git commit -am "chore: release v1.1.0"
git tag v1.1.0
git push origin main --tags

# 4. CI release workflow runs:
./gradlew patchChangelog
./gradlew buildPlugin               # → build/distributions/echo-action-1.1.0.zip
./gradlew verifyPlugin              # gate
./gradlew signPlugin                # → build/distributions/echo-action-1.1.0-signed.zip
./gradlew publishPlugin             # → uploaded to JetBrains Marketplace
```

### Staging vs prod

Marketplace supports release channels via `channels`:
- `stable` (default; visible to all users).
- `beta`, `eap` (only users who add the channel URL via **Settings → Plugins → ⚙ → Manage Plugin Repositories**).

Set channel via `intellijPlatform.publishing.channels = listOf(provider { properties("pluginVersion").split('-').getOrElse(1) { "default" }.split('.').first() })`.

### Rollback

There is no "rollback" — you ship a new version that supersedes the bad one. To pull a broken release: log in to https://plugins.jetbrains.com/author/me, find the plugin, **Updates → … → Disable** for the offending update.

Max safe window: minutes. Marketplace propagation is global within ~10 min.

### Health check / smoke

After publish, wait 10 min, then in a clean IDE: **Settings → Plugins → Marketplace**, search for `Echo Action`, install, verify version. Or:

```bash
curl -s "https://plugins.jetbrains.com/api/plugins/<plugin-id>/updates?size=1" \
  | jq '.[0].version'
```

### Versioning

`MAJOR.MINOR.PATCH` in `gradle.properties:pluginVersion`. SemVer. Single source of truth — patched into `plugin.xml` via `patchPluginXml`.

### Auto-update

Built into every IDE. Users with the plugin installed see the update in **Settings → Plugins → Updates** within 24 hours of publish. Force-immediate via `--check-updates`.

### Cost per 1k MAU

JetBrains Marketplace hosting: **$0**. Free for all plugins (paid plugin commission is separate, 15% Marketplace fee on revenue, not infra cost).

---

## 13. Claude Code Integration

### `CLAUDE.md`

```markdown
# Claude Code rules — echo-action (JetBrains plugin)

This project follows /opt/Loopa/rulebooks/jetbrains-plugin.md.

## Toolchain
- Gradle 8.10.2 via `./gradlew`. Never run system `gradle`.
- JDK 21. `java -version` must report `21.0.x`.
- Kotlin 2.1.10. IntelliJ Platform Gradle Plugin 2.15.0.

## Hot commands
- Run sandbox IDE: `./gradlew runIde`
- Tests: `./gradlew test`
- Lint: `./gradlew detekt`
- Verifier: `./gradlew verifyPlugin`
- Build distribution: `./gradlew buildPlugin`

## Banned patterns
- Do not edit `<idea-version>` directly in `plugin.xml`. Edit `gradle.properties:pluginSinceBuild`.
- Do not use the legacy `org.jetbrains.intellij` 1.x plugin or `intellij { ... }` block.
- Do not import classes under `com.intellij.openapi.*.impl` or any `@ApiStatus.Internal`.
- Do not block the EDT.
- Do not log secrets; do not print them in CI.
- Do not bundle `kotlin-stdlib`.

## Definition of done
1. `./gradlew detekt test verifyPlugin` green.
2. `CHANGELOG.md` `## [Unreleased]` updated.
3. Sandbox smoke screenshot attached to PR for UI changes.

## Skills to invoke
- /test-driven-development before adding services.
- /verification-before-completion before claiming done.
- /systematic-debugging when sandbox IDE misbehaves.
- /ship for release PRs.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(./gradlew test*)",
      "Bash(./gradlew detekt*)",
      "Bash(./gradlew verifyPlugin*)",
      "Bash(./gradlew buildPlugin*)",
      "Bash(./gradlew runIde*)",
      "Bash(./gradlew patchPluginXml*)",
      "Bash(./gradlew patchChangelog*)",
      "Bash(./gradlew clean*)",
      "Bash(./gradlew tasks*)",
      "Bash(./gradlew dependencies*)",
      "Bash(java -version*)",
      "Bash(./gradlew --version*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(gh*)",
      "Bash(tail -f build/idea-sandbox/system/log/idea.log*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_FILE_PATHS\" | grep -qE '\\.kts?$'; then ./gradlew detekt --quiet || true; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "./gradlew verifyPluginStructure --quiet"
          }
        ]
      }
    ]
  }
}
```

### Slash command shortcuts

- `/init` → write `CLAUDE.md` from this section.
- `/test-driven-development` → for new service logic.
- `/ship` → bump version, tag, push.

---

## 14. Codex Integration

### `AGENTS.md`

```markdown
# Codex rules — echo-action

Authority: /opt/Loopa/rulebooks/jetbrains-plugin.md.

## Stack
JetBrains plugin. Gradle 8.10.2, JDK 21, Kotlin 2.1.10, intellij-platform-gradle-plugin 2.15.0.

## Top rules
1. `id("org.jetbrains.intellij.platform")` only — never legacy `intellij` 1.x.
2. Edit `gradle.properties` for version/build numbers; never `plugin.xml` `<idea-version>`.
3. Run `./gradlew verifyPlugin` before declaring release-ready.
4. Never block the EDT; use `Task.Backgroundable`.
5. Never import internal API.

## Definition of done
`./gradlew detekt test verifyPlugin` clean.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_mode = "auto-edit"
sandbox = "workspace-write"

[shell]
allow = [
  "./gradlew test",
  "./gradlew detekt",
  "./gradlew verifyPlugin",
  "./gradlew buildPlugin",
  "./gradlew runIde",
  "./gradlew clean",
  "git status",
  "git diff",
  "gh pr create",
]

[[project_rules]]
match = "src/main/resources/META-INF/plugin.xml"
note = "Read-only except <change-notes> patched by Gradle. Edit gradle.properties instead."

[[project_rules]]
match = "gradle.properties"
note = "Single source for pluginVersion, platformVersion, pluginSinceBuild."
```

### Where Codex differs

Codex runs `verifyPlugin` more eagerly; Claude Code waits for hook. Both fine — bias toward running it explicitly when in doubt.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# JetBrains plugin (echo-action)

ALWAYS:
- Use intellij-platform-gradle-plugin 2.x via id("org.jetbrains.intellij.platform").
- Edit gradle.properties for pluginVersion / pluginSinceBuild / platformVersion — never plugin.xml directly.
- Wrap PSI writes in WriteCommandAction.runWriteCommandAction(project) { ... }.
- Register services with @Service(Service.Level.APP|PROJECT). Retrieve with service<T>().
- Use Logger.getInstance(Cls::class.java); never println.
- Run ./gradlew detekt test verifyPlugin before declaring done.

NEVER:
- Use legacy org.jetbrains.intellij 1.x.
- Import com.intellij.openapi.*.impl or any @ApiStatus.Internal.
- Block the EDT.
- Log or commit PRIVATE_KEY / PUBLISH_TOKEN / CERTIFICATE_CHAIN.
- Bundle kotlin-stdlib (the IDE provides it).
- Mock Project / PsiFile / Editor — extend BasePlatformTestCase.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "vscjava.vscode-java-pack",
    "vscjava.vscode-gradle",
    "fwcd.kotlin",
    "redhat.vscode-xml",
    "EditorConfig.EditorConfig"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "java",
      "name": "Attach to Sandbox IDE",
      "request": "attach",
      "hostName": "localhost",
      "port": 5005
    }
  ]
}
```

Run `./gradlew runIde --debug-jvm` first, then attach.

---

## 16. First-PR Scaffold

Create these files in this order from the (template-cloned) repo root.

### `settings.gradle.kts`

```kotlin
pluginManagement {
    repositories {
        gradlePluginPortal()
        mavenCentral()
    }
}

plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version "0.8.0"
}

rootProject.name = providers.gradleProperty("pluginName").get()
```

### `gradle.properties`

```
pluginGroup = com.example.echo
pluginName = Echo Action
pluginRepositoryUrl = https://github.com/your-org/echo-action
pluginVersion = 1.0.0

# Lowest IDE build the plugin targets (2024.3 = 243; 2026.1 = 261)
pluginSinceBuild = 243
pluginUntilBuild =

# IntelliJ Platform used to compile against
platformType = IC
platformVersion = 2026.1.1
# Comma-separated bundled plugin IDs (empty for blank action plugin)
platformBundledPlugins =
# Comma-separated marketplace plugin IDs / build numbers
platformPlugins =

gradleVersion = 8.10.2
kotlin.stdlib.default.dependency = false
kotlin.code.style = official

org.gradle.configuration-cache = true
org.gradle.caching = true
org.gradle.parallel = true
org.gradle.jvmargs = -Xmx4096m -XX:MaxMetaspaceSize=512m
```

### `gradle/libs.versions.toml`

```toml
[versions]
kotlin = "2.1.10"
junit = "5.11.4"
detekt = "1.23.7"
intellij-platform = "2.15.0"
changelog = "2.2.1"
qodana = "2025.1.1"
kover = "0.9.1"
mockk = "1.13.13"

[libraries]
junit-jupiter = { group = "org.junit.jupiter", name = "junit-jupiter", version.ref = "junit" }
junit-platform-launcher = { group = "org.junit.platform", name = "junit-platform-launcher" }
mockk = { group = "io.mockk", name = "mockk", version.ref = "mockk" }

[plugins]
kotlin = { id = "org.jetbrains.kotlin.jvm", version.ref = "kotlin" }
intelliJPlatform = { id = "org.jetbrains.intellij.platform", version.ref = "intellij-platform" }
changelog = { id = "org.jetbrains.changelog", version.ref = "changelog" }
qodana = { id = "org.jetbrains.qodana", version.ref = "qodana" }
kover = { id = "org.jetbrains.kotlinx.kover", version.ref = "kover" }
detekt = { id = "io.gitlab.arturbosch.detekt", version.ref = "detekt" }
```

### `build.gradle.kts`

```kotlin
import org.jetbrains.changelog.Changelog
import org.jetbrains.changelog.markdownToHTML
import org.jetbrains.intellij.platform.gradle.IntelliJPlatformType
import org.jetbrains.intellij.platform.gradle.TestFrameworkType

plugins {
    alias(libs.plugins.kotlin)
    alias(libs.plugins.intelliJPlatform)
    alias(libs.plugins.changelog)
    alias(libs.plugins.qodana)
    alias(libs.plugins.kover)
    alias(libs.plugins.detekt)
}

group = providers.gradleProperty("pluginGroup").get()
version = providers.gradleProperty("pluginVersion").get()

kotlin {
    jvmToolchain(21)
}

repositories {
    mavenCentral()
    intellijPlatform {
        defaultRepositories()
    }
}

dependencies {
    testImplementation(libs.junit.jupiter)
    testRuntimeOnly(libs.junit.platform.launcher)
    testImplementation(libs.mockk)
    detektPlugins("io.gitlab.arturbosch.detekt:detekt-formatting:${libs.versions.detekt.get()}")

    intellijPlatform {
        create(
            type = providers.gradleProperty("platformType").get(),
            version = providers.gradleProperty("platformVersion").get(),
        )

        // Cross-IDE verification matrix — change in one place
        bundledPlugins(providers.gradleProperty("platformBundledPlugins").map {
            it.split(',').map(String::trim).filter(String::isNotEmpty)
        })
        plugins(providers.gradleProperty("platformPlugins").map {
            it.split(',').map(String::trim).filter(String::isNotEmpty)
        })

        pluginVerifier()
        zipSigner()
        testFramework(TestFrameworkType.Platform)
    }
}

intellijPlatform {
    pluginConfiguration {
        version = providers.gradleProperty("pluginVersion")
        name = providers.gradleProperty("pluginName")

        description = providers.fileContents(
            layout.projectDirectory.file("README.md")
        ).asText.map { content ->
            content.substringAfter("<!-- Plugin description -->")
                .substringBefore("<!-- Plugin description end -->")
                .let(::markdownToHTML)
        }

        changeNotes = providers.gradleProperty("pluginVersion").map { v ->
            with(changelog) {
                renderItem(
                    (getOrNull(v) ?: getUnreleased())
                        .withHeader(false)
                        .withEmptySections(false),
                    Changelog.OutputType.HTML,
                )
            }
        }

        ideaVersion {
            sinceBuild = providers.gradleProperty("pluginSinceBuild")
            untilBuild = provider { null } // empty = Marketplace auto-extends
        }
    }

    signing {
        certificateChain = providers.environmentVariable("CERTIFICATE_CHAIN")
        privateKey = providers.environmentVariable("PRIVATE_KEY")
        password = providers.environmentVariable("PRIVATE_KEY_PASSWORD")
    }

    publishing {
        token = providers.environmentVariable("PUBLISH_TOKEN")
        // pre-release versions go to the matching channel
        channels = providers.gradleProperty("pluginVersion").map {
            listOf(it.substringAfter('-', "default").substringBefore('.'))
        }
    }

    pluginVerification {
        ides {
            recommended()
            // Explicit cross-IDE matrix:
            ide(IntelliJPlatformType.IntellijIdeaCommunity, "2024.3")
            ide(IntelliJPlatformType.IntellijIdeaCommunity, "2026.1.1")
            ide(IntelliJPlatformType.WebStorm, "2026.1")
            ide(IntelliJPlatformType.PyCharmCommunity, "2026.1")
            ide(IntelliJPlatformType.Rider, "2026.1")
        }
    }
}

changelog {
    groups.empty()
    repositoryUrl = providers.gradleProperty("pluginRepositoryUrl")
}

kover {
    reports {
        total {
            xml { onCheck = true }
            html { onCheck = true }
        }
    }
}

detekt {
    buildUponDefaultConfig = true
    config.setFrom("$projectDir/detekt.yml")
    autoCorrect = false
}

tasks {
    wrapper {
        gradleVersion = providers.gradleProperty("gradleVersion").get()
    }

    publishPlugin {
        dependsOn(patchChangelog)
    }

    test {
        useJUnitPlatform()
    }
}

intellijPlatformTesting {
    runIde {
        register("runIdeForUiTests") {
            task {
                jvmArgumentProviders += CommandLineArgumentProvider {
                    listOf(
                        "-Drobot-server.port=8082",
                        "-Dide.mac.message.dialogs.as.sheets=false",
                        "-Djb.privacy.policy.text=<!--999.999-->",
                        "-Djb.consents.confirmation.enabled=false",
                    )
                }
            }
        }
    }
}
```

### `src/main/resources/META-INF/plugin.xml`

```xml
<idea-plugin>
    <id>com.example.echo</id>
    <name>Echo Action</name>
    <vendor email="hello@tryclean.ai" url="https://example.com">Example</vendor>

    <description><![CDATA[
        A blank-canvas plugin that echoes a message.
        Acts as a starting point for IntelliJ Platform plugin development.
    ]]></description>

    <!-- Cross-IDE compatibility: only platform module -->
    <depends>com.intellij.modules.platform</depends>

    <resource-bundle>messages.EchoBundle</resource-bundle>

    <extensions defaultExtensionNs="com.intellij">
        <notificationGroup id="Echo Action"
                           displayType="BALLOON"
                           bundle="messages.EchoBundle"
                           key="notification.group.echo"/>
    </extensions>

    <actions>
        <action id="com.example.echo.EchoAction"
                class="com.example.echo.EchoAction"
                icon="/icons/echo.svg">
            <add-to-group group-id="ToolsMenu" anchor="last"/>
            <keyboard-shortcut keymap="$default" first-keystroke="control alt E"/>
        </action>
    </actions>
</idea-plugin>
```

### `src/main/resources/messages/EchoBundle.properties`

```
action.com.example.echo.EchoAction.text=Echo Action
action.com.example.echo.EchoAction.description=Echo a message via balloon notification
notification.group.echo=Echo Action
notification.echo.title=Echo
notification.echo.content=Hello from the Echo Action plugin
```

### `src/main/kotlin/com/example/echo/EchoAction.kt`

```kotlin
package com.example.echo

import com.example.echo.services.EchoService
import com.intellij.notification.NotificationGroupManager
import com.intellij.notification.NotificationType
import com.intellij.openapi.actionSystem.AnAction
import com.intellij.openapi.actionSystem.AnActionEvent
import com.intellij.openapi.components.service
import com.intellij.openapi.diagnostic.Logger

class EchoAction : AnAction() {

    private val log = Logger.getInstance(EchoAction::class.java)

    override fun actionPerformed(event: AnActionEvent) {
        val project = event.project ?: return
        val message = service<EchoService>().echo(EchoBundle.message("notification.echo.content"))

        log.info("module=action event=invoked length=${message.length}")

        NotificationGroupManager.getInstance()
            .getNotificationGroup("Echo Action")
            .createNotification(
                EchoBundle.message("notification.echo.title"),
                message,
                NotificationType.INFORMATION,
            )
            .notify(project)
    }
}
```

### `src/main/kotlin/com/example/echo/EchoBundle.kt`

```kotlin
package com.example.echo

import com.intellij.DynamicBundle
import org.jetbrains.annotations.PropertyKey

private const val BUNDLE = "messages.EchoBundle"

object EchoBundle : DynamicBundle(BUNDLE) {
    fun message(@PropertyKey(resourceBundle = BUNDLE) key: String, vararg params: Any): String =
        getMessage(key, *params)
}
```

### `src/main/kotlin/com/example/echo/services/EchoService.kt`

```kotlin
package com.example.echo.services

import com.intellij.openapi.components.Service
import com.intellij.openapi.diagnostic.Logger

@Service(Service.Level.APP)
class EchoService {

    private val log = Logger.getInstance(EchoService::class.java)

    fun echo(text: String): String {
        log.info("module=service event=echo input.length=${text.length}")
        return text
    }
}
```

### `src/main/resources/icons/echo.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16">
  <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" stroke-width="1.5"/>
</svg>
```

### `src/main/resources/META-INF/pluginIcon.svg`

```xml
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="14" fill="#3B82F6"/>
  <text x="20" y="26" text-anchor="middle" font-family="sans-serif" font-size="16" fill="white">E</text>
</svg>
```

### `src/test/kotlin/com/example/echo/EchoServiceTest.kt`

```kotlin
package com.example.echo

import com.example.echo.services.EchoService
import com.intellij.testFramework.fixtures.BasePlatformTestCase
import com.intellij.openapi.components.service
import org.junit.jupiter.api.Assertions.assertEquals

class EchoServiceTest : BasePlatformTestCase() {

    fun testEchoReturnsInputUnchanged() {
        val result = service<EchoService>().echo("hello")
        assertEquals("hello", result)
    }

    fun testEchoEmptyString() {
        val result = service<EchoService>().echo("")
        assertEquals("", result)
    }
}
```

### `qodana.yml`

```yaml
version: "1.0"
linter: jetbrains/qodana-jvm-community:2025.1
profile:
  name: qodana.starter
exclude:
  - name: All
    paths:
      - .qodana
      - build
include:
  - name: CheckDependencyLicenses
```

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 4
indent_style = space
insert_final_newline = true
max_line_length = 120
trim_trailing_whitespace = true

[*.{yml,yaml,toml,json}]
indent_size = 2

[Makefile]
indent_style = tab
```

### `detekt.yml`

```yaml
build:
  maxIssues: 0

style:
  active: true
  ForbiddenComment:
    active: false
  MagicNumber:
    excludes: ['**/test/**']
formatting:
  active: true
  android: false
  autoCorrect: true
```

### `CHANGELOG.md`

```markdown
# Echo Action — Changelog

## [Unreleased]

## [1.0.0] - 2026-04-27

### Added
- Initial blank-canvas action plugin "Echo Action".
```

### `.github/workflows/build.yml`

```yaml
name: Build

on:
  push:
    branches: [main]
  pull_request: {}

permissions:
  contents: read
  checks: write
  pull-requests: write

concurrency:
  group: build-${{ github.ref }}
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  test:
    name: Tests / Detekt / Verifier
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: gradle/actions/setup-gradle@v4
      - run: ./gradlew detekt test --no-configuration-cache
      - run: ./gradlew buildPlugin verifyPluginStructure
      - run: ./gradlew verifyPlugin
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: plugin-distribution
          path: build/distributions/*.zip

  qodana:
    name: Qodana
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: JetBrains/qodana-action@v2026.1
        env:
          QODANA_TOKEN: ${{ secrets.QODANA_TOKEN }}
```

### `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags: ['v*.*.*']

permissions:
  contents: write

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: actions/setup-java@v4
        with:
          distribution: temurin
          java-version: 21
      - uses: gradle/actions/setup-gradle@v4

      - name: Verify before publish
        run: ./gradlew verifyPlugin

      - name: Sign + publish
        env:
          CERTIFICATE_CHAIN: ${{ secrets.CERTIFICATE_CHAIN }}
          PRIVATE_KEY: ${{ secrets.PRIVATE_KEY }}
          PRIVATE_KEY_PASSWORD: ${{ secrets.PRIVATE_KEY_PASSWORD }}
          PUBLISH_TOKEN: ${{ secrets.PUBLISH_TOKEN }}
        run: ./gradlew patchChangelog publishPlugin

      - name: GitHub Release
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          VERSION="${GITHUB_REF_NAME#v}"
          gh release create "$GITHUB_REF_NAME" \
            --title "v$VERSION" \
            --notes-file <(./gradlew getChangelog --quiet --no-header --unreleased) \
            build/distributions/*.zip
```

### `README.md`

```markdown
# Echo Action

Blank-canvas IntelliJ Platform plugin.

## Run sandbox IDE
\`\`\`
./gradlew runIde
\`\`\`

## Test
\`\`\`
./gradlew detekt test verifyPlugin
\`\`\`

<!-- Plugin description -->
Echo Action shows a balloon notification with a configurable message.
<!-- Plugin description end -->
```

### `.gitignore`

```
.gradle/
build/
.idea/
*.iml
out/
.qodana/
local.properties
*.local.properties
.kotlin/
```

After all files exist:

```bash
git init -b main
git add .
git commit -m "feat: initial scaffold"
gh repo create echo-action --public --source=. --push
```

CI runs and the plugin builds. Done.

---

## 17. Idea → MVP Path

For the assigned `PROJECT_IDEA = blank "echo-action"`, the path is short:

### Phase 1 — Schema (1 session)
- Decide settings model: `EchoSettings(message: String = "Hello")`, `@State(name="EchoSettings", storages=[Storage("echo.xml")])`.
- Files: `EchoSettings.kt`. Exit: `service<EchoSettings>()` returns default.

### Phase 2 — Backbone (1 session)
- Action wired to ToolsMenu (already done in scaffold). Notification group registered.
- Files: `EchoAction.kt`, `plugin.xml` actions block. Exit: keystroke `Ctrl+Alt+E` shows balloon.

### Phase 3 — Vertical slice (2 sessions)
- Settings page: Kotlin UI DSL v2 panel binding `EchoSettings.message`.
- Files: `EchoConfigurable.kt`, `EchoSettingsComponent.kt`, `<applicationConfigurable>` in `plugin.xml`. Tests for state round-trip.
- Exit: changing message in **Settings → Tools → Echo** persists across IDE restart.

### Phase 4 — Multi-IDE (1 session, no auth)
- Add WebStorm + PyCharm to verifier matrix.
- Files: `build.gradle.kts` `pluginVerification.ides` block. Exit: `verifyPlugin` green for IC, WS, PY, RD.

### Phase 5 — Ship + monitor (1 session)
- Generate signing cert, set GitHub secrets, push tag `v1.0.0`.
- Exit: plugin appears on https://plugins.jetbrains.com.

---

## 18. Feature Recipes

### 18.1 Action with progress

```kotlin
override fun actionPerformed(event: AnActionEvent) {
    val project = event.project ?: return
    ProgressManager.getInstance().run(object : Task.Backgroundable(project, "Echoing", true) {
        override fun run(indicator: ProgressIndicator) {
            indicator.text = "Working…"
            // long-running work
        }
    })
}
```

### 18.2 Persistent settings

`EchoSettings.kt`:

```kotlin
@Service(Service.Level.APP)
@State(name = "EchoSettings", storages = [Storage("echo.xml")])
class EchoSettings : PersistentStateComponent<EchoSettings.State> {
    data class State(var message: String = "Hello")
    private var state = State()
    override fun getState(): State = state
    override fun loadState(s: State) { state = s }
}
```

### 18.3 Settings UI (Kotlin UI DSL v2)

```kotlin
class EchoConfigurable : Configurable {
    private val settings get() = service<EchoSettings>()
    private val component = panel {
        row("Message:") {
            textField()
                .bindText(settings.state::message)
                .columns(COLUMNS_LARGE)
        }
    }
    override fun createComponent() = component
    override fun isModified() = component.isModified()
    override fun apply() { component.apply() }
    override fun reset() { component.reset() }
    override fun getDisplayName() = "Echo"
}
```

`plugin.xml`:

```xml
<extensions defaultExtensionNs="com.intellij">
    <applicationConfigurable parentId="tools" instance="com.example.echo.EchoConfigurable"
                             id="com.example.echo.EchoConfigurable" displayName="Echo"/>
</extensions>
```

### 18.4 Tool window

```xml
<extensions defaultExtensionNs="com.intellij">
    <toolWindow id="Echo" anchor="right" icon="/icons/echo.svg"
                factoryClass="com.example.echo.toolwindow.EchoToolWindowFactory"/>
</extensions>
```

```kotlin
class EchoToolWindowFactory : ToolWindowFactory {
    override fun createToolWindowContent(project: Project, toolWindow: ToolWindow) {
        val panel = panel { row { label("Echo!") } }
        toolWindow.contentManager.addContent(
            ContentFactory.getInstance().createContent(panel, "", false)
        )
    }
}
```

### 18.5 Inspection

```xml
<localInspection language="" shortName="EchoInspection"
                 displayName="Echo inspection"
                 groupName="Echo"
                 enabledByDefault="true"
                 level="WARNING"
                 implementationClass="com.example.echo.inspections.EchoInspection"/>
```

### 18.6 Notification

```kotlin
NotificationGroupManager.getInstance()
    .getNotificationGroup("Echo Action")
    .createNotification("Title", "Body", NotificationType.INFORMATION)
    .notify(project)
```

### 18.7 Background listener (file save)

```kotlin
class FileSaveListener : FileDocumentManagerListener {
    override fun beforeDocumentSaving(document: Document) {
        Logger.getInstance(javaClass).info("module=listener event=save")
    }
}
```

```xml
<applicationListeners>
    <listener class="com.example.echo.listeners.FileSaveListener"
              topic="com.intellij.openapi.fileEditor.FileDocumentManagerListener"/>
</applicationListeners>
```

### 18.8 Live template

`src/main/resources/liveTemplates/Echo.xml` plus `<extensions defaultExtensionNs="com.intellij"><defaultLiveTemplates file="/liveTemplates/Echo"/></extensions>`.

### 18.9 Localization (additional locale)

Add `src/main/resources/messages/EchoBundle_de.properties`. IDE picks up automatically.

### 18.10 Telemetry / analytics

Use `FUSEventLogger` (FUS = Feature Usage Statistics):

```kotlin
object EchoCollector : CounterUsagesCollector() {
    override fun getGroup() = GROUP
    private val GROUP = EventLogGroup("echo.action", 1)
    val INVOKED = GROUP.registerEvent("invoked")
}
```

```xml
<extensions defaultExtensionNs="com.intellij">
    <statistics.counterUsagesCollector implementationClass="com.example.echo.EchoCollector"/>
</extensions>
```

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Could not find org.jetbrains.intellij.platform.gradle.plugin` | Add `gradlePluginPortal()` to `pluginManagement.repositories` |
| `Plugin requires platform IU but found IC` | `platformType=IC` paired with Ultimate-only API; switch one |
| `No such property: intellij` | You used 1.x DSL. Switch to `intellijPlatform { ... }` |
| `Task 'runPluginVerifier' not found` | 2.x renamed it: `verifyPlugin` |
| `Compatibility problem: ... is not available` | Internal/`@Experimental` API used; switch to public counterpart |
| `signPlugin: No Marketplace ZIP Signer executable found` | Add `zipSigner()` inside `dependencies { intellijPlatform { ... } }` |
| `signPlugin: pemObject must not be null` | `PRIVATE_KEY` env var empty or wrong format. Re-paste full `-----BEGIN PRIVATE KEY-----` block |
| `publishPlugin: 401` | `PUBLISH_TOKEN` invalid or expired |
| `publishPlugin: Plugin ID already exists` | Reserve the plugin on Marketplace UI first; or the ID belongs to someone else |
| `Plugin descriptor must specify <change-notes>` | Wire changelog plugin: `intellijPlatform.pluginConfiguration.changeNotes = changelog.renderItem(...)` |
| `BUILD FAILED ... compileKotlin > internal error` | Bad Kotlin / IntelliJ version pair. Match per https://kotlinlang.org/docs/multiplatform/compatibility.html |
| `Sandbox IDE shows old plugin version` | `./gradlew clean runIde` |
| `idea.log full of "Slow operations are prohibited on EDT"` | Move work to `Task.Backgroundable` |
| `Read access is allowed from inside read-action only` | Wrap in `ReadAction.compute { ... }` |
| `Write access is allowed inside write-action only` | Wrap in `WriteCommandAction.runWriteCommandAction(project) { ... }` |
| `Class com.intellij.openapi.editor.impl.EditorImpl cannot be loaded` | Don't import `*.impl.*` — use `Editor` |
| `Test fails: cannot determine test data path for strategy COMMUNITY` | Override `getTestDataPath()` in your `BasePlatformTestCase` subclass |
| `IDE startup hangs after install` | Plugin throws in `ProjectActivity`/listener init. Check `idea.log` for stack |
| `verifyPluginStructure: No <vendor>` | Add `<vendor email="..." url="...">Name</vendor>` |
| `Marketplace upload: ZIP not signed` | Run `signPlugin` task — uploads `*-signed.zip`, not the unsigned file |
| `gradle/actions/setup-gradle: Cannot resolve 8.10.2` | Bump `gradleVersion` in `gradle.properties`; rerun `./gradlew wrapper` |
| `JDK 17 not supported` | IntelliJ Platform 2024.2+ requires JDK 21 |
| `Unsupported class file major version 65` | JDK 21 not on PATH |
| `Plugin uses internal Kotlin reflection` | Don't bundle `kotlin-reflect` redundantly; the platform supplies it |
| `Detekt: ForbiddenComment failures on TODO` | Disable `style.ForbiddenComment` in `detekt.yml` if intentional |
| `Qodana: token missing` | Add `QODANA_TOKEN` GitHub secret from https://qodana.cloud |
| `git push: secret detected in PRIVATE_KEY` | You committed a key. Rotate it immediately, force-push not enough — assume compromised |
| `runIde: Cannot find 'java' in PATH` | `JAVA_HOME` unset or wrong. Confirm `./gradlew --version` reports `JVM: 21` |
| `verifyPlugin: COMPATIBILITY_PROBLEMS` against EAP | Drop EAP from matrix until stable, or pin to specific build |
| `change-notes too long` | Marketplace caps at ~64 KB; trim `CHANGELOG.md` history older than 12 months |
| `Plugin name conflicts with existing plugin` | Rename in `gradle.properties:pluginName` and unique `id` in `plugin.xml` |

---

## 20. Glossary

- **IntelliJ Platform** — the shared codebase under every JetBrains IDE (IntelliJ, WebStorm, PyCharm, Rider, …).
- **Plugin** — a `.zip` (or `.jar`) loaded by the IDE on startup that adds features.
- **`plugin.xml`** — XML descriptor inside the plugin ZIP at `META-INF/plugin.xml`. Declares the ID, dependencies, actions, services.
- **Action** — a Swing-style command bound to a menu item / shortcut. Subclass of `AnAction`.
- **Service** — a singleton managed by the platform. App-level or project-level.
- **PSI (Program Structure Interface)** — the IDE's parsed AST for source files.
- **VFS (Virtual File System)** — the IDE's abstraction over disk files.
- **EDT (Event Dispatch Thread)** — Swing's UI thread. Don't block it.
- **ReadAction / WriteAction** — locks around PSI / VFS access.
- **Sandbox IDE** — a fresh IDE instance launched by `./gradlew runIde` with the plugin pre-installed.
- **Plugin Verifier** — JetBrains tool that scans your plugin against multiple IDE versions for binary compatibility.
- **Marketplace** — https://plugins.jetbrains.com — the JetBrains plugin store.
- **`since-build` / `until-build`** — IDE build numbers your plugin supports (e.g. `243` = 2024.3, `261` = 2026.1).
- **Bundled plugin** — a plugin shipped inside the IDE itself (e.g. Java, Git4Idea).
- **`intellijPlatform { ... }`** — the configuration block of `org.jetbrains.intellij.platform` 2.x Gradle plugin.
- **`zipSigner` / `signPlugin`** — Marketplace-required signing step before publish.
- **`PUBLISH_TOKEN`** — token from Marketplace used to upload new versions.
- **Kotlin UI DSL v2** — the modern declarative builder for Swing settings UIs.
- **DynamicBundle** — IntelliJ's locale-aware string bundle helper.
- **Notification Group** — registered "channel" (BALLOON / TOOL_WINDOW / NONE) that all your notifications belong to.
- **FUS (Feature Usage Statistics)** — built-in opt-in telemetry pipeline.
- **EAP** — Early Access Program (pre-release IDEs).

---

## 21. Update Cadence

This rulebook is valid for:
- IntelliJ IDEA Community 2024.3 (`243`) through 2026.1.x (`261`).
- IntelliJ Platform Gradle Plugin **2.x** (current 2.15.0).
- Kotlin 2.1.x, JDK 21, Gradle 8.10.x.

Re-run the generator when:
- IntelliJ Platform 2026.2 ships (likely Q3 2026 — verifier matrix needs new build).
- IntelliJ Platform Gradle Plugin **3.x** ships (DSL break).
- JetBrains Marketplace changes the signing or publish flow.
- A security advisory affects the platform or signer.

Date stamp: **2026-04-27**.

Sources:
- [IntelliJ Platform Gradle Plugin (2.x) docs](https://plugins.jetbrains.com/docs/intellij/tools-intellij-platform-gradle-plugin.html)
- [Plugin: org.jetbrains.intellij.platform on Gradle Plugin Portal](https://plugins.gradle.org/plugin/org.jetbrains.intellij.platform)
- [JetBrains/intellij-platform-plugin-template](https://github.com/JetBrains/intellij-platform-plugin-template)
- [Plugin Signing](https://plugins.jetbrains.com/docs/intellij/plugin-signing.html)
- [Publishing a Plugin](https://plugins.jetbrains.com/docs/intellij/publishing-plugin.html)
- [Build Number Ranges](https://plugins.jetbrains.com/docs/intellij/build-number-ranges.html)
- [Plugin Compatibility with IntelliJ Platform Products](https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html)
- [Verifying Plugin Compatibility](https://plugins.jetbrains.com/docs/intellij/verifying-plugin-compatibility.html)
- [Configuring Kotlin Support](https://plugins.jetbrains.com/docs/intellij/using-kotlin.html)
- [JetBrains/qodana-action](https://github.com/JetBrains/qodana-action)
- [IntelliJ IDEA 2026.1.1 release notes](https://blog.jetbrains.com/idea/2026/04/intellij-idea-2026-1-1/)
- [Busy Plugin Developers Newsletter Q1 2026](https://blog.jetbrains.com/platform/2026/04/busy-plugin-developers-newsletter-q1-2026/)
