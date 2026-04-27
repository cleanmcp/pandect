# Unity 6 + C# + URP — AI Coding Rulebook

> One-shot game-engine rulebook for an AI agent + non-coder team building a 2D top-down sample on Unity 6.3 LTS, targeting WebGL + Standalone (Win/Mac/Linux) + Mobile (iOS/Android). Verified 2026-04-27.

---

## 1. Snapshot

### 1.1 Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Editor | Unity 6.3 LTS (`6000.3.x`) | Current LTS, supported through Dec 2027. |
| Language | C# 9 (Unity-restricted subset) | Mono/IL2CPP-compatible, official scripting language. |
| Runtime | .NET Standard 2.1 + IL2CPP for shipped builds | Cross-platform, AOT for mobile/WebGL. |
| Package manager | Unity Package Manager (UPM) | Built-in, scoped registries supported. |
| Build tool | Unity Editor + IL2CPP backend | Official, required for iOS/WebGL. |
| Render pipeline | URP 17.x (com.unity.render-pipelines.universal) | Unity's 2026 strategic default; mobile + WebGL. |
| Input | Input System 1.14+ (new) | Replaces legacy `Input.GetKey`; required for new code. |
| Asset mgmt | Addressables 2.x (com.unity.addressables) | Async loading, remote catalogs, memory control. |
| Networking | Netcode for GameObjects 2.x | Official, Unity 6 supports v2 only. |
| Save / persistence | `JsonUtility` local + UGS Cloud Save remote | Built-in, no extra deps for local. |
| Auth | Unity Authentication Service (UGS) anonymous + provider link | Free tier, integrates with Lobby/Relay/Cloud Save. |
| State mgmt | ScriptableObject event channels + plain C# classes | Idiomatic Unity, no extra runtime cost. |
| UI | UI Toolkit (UXML + USS) for menus, uGUI for in-world | Modern + retained-mode mixed default. |
| Forms / validation | UI Toolkit bindings + manual `TryParse` | No third-party form lib. |
| Unit test runner | Unity Test Framework 1.4+ (NUnit 3) | Official, EditMode + PlayMode. |
| E2E framework | PlayMode tests + AltTester driver | Headless, parallelizable via splits. |
| Mocking strategy | Interfaces + hand-rolled fakes; never mock GameObject | Reflection-heavy mocks fight Unity lifecycle. |
| Logger | `UnityEngine.Debug` + structured wrapper to `Application.logMessageReceived` | Built-in sink, Cloud Diagnostics ingests it. |
| Error tracking | Unity Cloud Diagnostics (built into UGS) | Free tier, matches editor logs. |
| Lint + format | `dotnet format` + Microsoft.Unity.Analyzers + `.editorconfig` | Roslyn-based, replaces deprecated rulesets. |
| Type checking | C# compiler in Editor + CI (`Compilation Pipeline`) | Errors fail build automatically. |
| Env vars + secrets | `ProjectSettings/SecretsConfig.asset` (excluded) + GH Actions secrets | No `.env` runtime; configs are assets. |
| CI provider | GitHub Actions + `game-ci/unity-builder@v4` | Free Linux runners, license cached. |
| Deploy target | itch.io (WebGL) + TestFlight (iOS) + Play Internal (Android) + GitHub Releases (desktop) | Lowest-friction for solo dev. |
| Release flow | UGS Cloud Build for store builds, Actions for desktop/Web | Cloud Build owns Apple/Google signing. |
| Auto-update | Stores handle mobile; itch.io Butler for desktop+Web | Native + free CLI uploader. |
| Source control | Git + Git LFS (NOT Plastic) | Universal, free; LFS for large bins. |
| Editor IDE | JetBrains Rider 2026.1 | Best Unity refactors, free for students/non-commercial. |
| IPC / scripting events | UnityEvent + ScriptableObject channels | No third-party message bus. |

### 1.2 Versions Table

| Component | Version | Released | Source |
|---|---|---|---|
| Unity Editor | 6000.3.13f1 (Unity 6.3 LTS) | 2026-04 | https://unity.com/releases/unity-6 |
| Unity 6.4 (Supported Update, optional) | 6000.4.3f1 | 2026-04-15 | https://eosl.date/eol/product/unity/ |
| Unity Hub | 3.10.x | 2026-Q1 | https://unity.com/unity-hub |
| URP | 17.3.x | with 6.3 LTS | https://docs.unity3d.com/Packages/com.unity.render-pipelines.universal@17.3/ |
| Input System | 1.14.0+ | 2025-2026 | https://docs.unity3d.com/Manual/com.unity.inputsystem.html |
| Addressables | 2.6.0 → 2.9.1 | 2025–2026 | https://github.com/needle-mirror/com.unity.addressables/releases |
| Netcode for GameObjects | 2.x | 2025–2026 | https://github.com/Unity-Technologies/com.unity.netcode.gameobjects/releases |
| Test Framework | 1.4.x | 2025 | https://docs.unity3d.com/Packages/com.unity.test-framework@1.4/ |
| Multiplayer Services SDK | 1.x | 2025 | UGS docs |
| Microsoft.Unity.Analyzers | 1.20+ | 2025 | https://github.com/microsoft/Microsoft.Unity.Analyzers |
| game-ci/unity-builder | v4 | 2025–2026 | https://github.com/game-ci/unity-builder |
| game-ci/unity-test-runner | v4 | 2025–2026 | https://github.com/game-ci/unity-test-runner |
| Git LFS | 3.5+ | — | https://git-lfs.com |
| .NET SDK (for `dotnet format`) | 9.0+ | — | https://dotnet.microsoft.com |
| Rider | 2026.1 | 2026-Q1 | https://jetbrains.com/rider |

### 1.3 Minimum Host Requirements

| OS | RAM | Disk | Extras |
|---|---|---|---|
| macOS 13+ (Ventura) on Apple Silicon or Intel | 16 GB | 50 GB | Xcode 16.2+ for iOS builds |
| Windows 10/11 64-bit | 16 GB | 50 GB | Visual Studio Build Tools or Rider; IL2CPP needs MSVC; Android Studio for Android |
| Ubuntu 22.04+ / Linux x86_64 | 16 GB | 50 GB | `mono`, `libgconf-2-4`, `mesa` for headless CI |

### 1.4 Cold-start Estimate

`git clone` → Hub installs Editor → opens project → Library compiles → Play in Editor: **45–90 minutes on first-ever machine**, **5–10 minutes** on a machine that already has Hub + Editor installed.

---

## 2. Zero-to-running

### 2.1 macOS

```bash
# 1. Install Homebrew (skip if installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install Unity Hub, Git, Git LFS, .NET, Rider
brew install --cask unity-hub
brew install git git-lfs
brew install --cask dotnet-sdk
brew install --cask rider

# 3. Install Xcode (App Store) then accept license
sudo xcodebuild -license accept

# 4. Initialize LFS
git lfs install

# 5. Sign in to Unity Hub, then install Editor 6000.3 LTS with modules
open -a "Unity Hub"
# In Hub UI: Installs → Install Editor → 6000.3 LTS
#   Add modules: iOS Build Support, Android Build Support (+OpenJDK +SDK +NDK),
#                Mac Build Support (IL2CPP), Windows Build Support (Mono+IL2CPP),
#                Linux Build Support (IL2CPP), WebGL Build Support,
#                Documentation, plus Language packs for non-English locales.

# 6. CLI auths
gh auth login                        # GitHub
# Open https://cloud.unity.com → create org + project, copy Project ID
```

### 2.2 Windows

```powershell
# 1. winget installs (PowerShell as admin)
winget install Unity.UnityHub
winget install Git.Git
winget install GitHub.GitLFS
winget install Microsoft.DotNet.SDK.9
winget install JetBrains.Rider

# 2. Install Android Studio (separate; Hub uses bundled SDK/NDK by default)
winget install Google.AndroidStudio   # only if you want a non-Hub SDK

# 3. Initialize LFS
git lfs install

# 4. Sign in to Unity Hub and install 6000.3 LTS (same modules as macOS)
"C:\Program Files\Unity Hub\Unity Hub.exe"

# 5. CLI auths
gh auth login
```

### 2.3 Linux (Ubuntu 22.04+)

```bash
# 1. System deps
sudo apt update
sudo apt install -y git git-lfs curl libgtk-3-0 libnss3 libgbm1 libxshmfence1 \
                    libasound2 libdrm2 libxkbcommon0 dotnet-sdk-9.0
git lfs install

# 2. Unity Hub (AppImage)
wget -O ~/UnityHub.AppImage https://public-cdn.cloud.unity3d.com/hub/prod/UnityHub.AppImage
chmod +x ~/UnityHub.AppImage
~/UnityHub.AppImage &

# 3. Rider via JetBrains Toolbox
wget https://download.jetbrains.com/toolbox/jetbrains-toolbox-latest.tar.gz
tar -xzf jetbrains-toolbox-latest.tar.gz -C ~/Applications/

# 4. CLI
sudo apt install gh
gh auth login
```

### 2.4 Accounts to Create

| Service | URL | Needed for |
|---|---|---|
| Unity ID | id.unity.com | Editor activation, UGS |
| Unity Cloud (UGS) | cloud.unity.com | Authentication, Cloud Save, Build Automation, Cloud Diagnostics |
| Apple Developer ($99/yr) | developer.apple.com | iOS TestFlight + App Store |
| Google Play Console ($25 once) | play.google.com/console | Android internal track + production |
| itch.io (free) | itch.io/register | WebGL + desktop demo channel |
| GitHub | github.com | Source + Actions CI |

### 2.5 Bootstrap Commands (after editor + accounts)

```bash
# Create the project (do this from the Hub UI: New Project → 2D Universal → name it sample-topdown).
# OR scripted (Hub CLI):
"<unity-hub-binary>" -- --headless install --version 6000.3.13f1 --module ios android webgl mac-il2cpp windows-il2cpp linux-il2cpp

cd ~/dev
git init sample-topdown && cd sample-topdown
# (Open Hub → New project → 2D (URP) template → set path to this folder.)

# After Hub creates the project files:
git lfs install
# Drop the .gitignore + .gitattributes + .editorconfig from §16 into root.
git add .
git commit -m "chore: bootstrap Unity 6.3 LTS 2D URP project"
gh repo create sample-topdown --private --source . --push
```

### 2.6 Expected First-Run Output (Editor Console)

```
[Package Manager] Done resolving packages in 4.21s
[Licensing] License activated: Unity Personal
Refresh: detecting if any assets need to be imported or removed ... 0.512 seconds
Compilation finished. Errors: 0  Warnings: 0
```

If you see `Library/PackageCache` re-import every run, your `.gitignore` is wrong — see §16.

### 2.7 Common First-Run Errors

| Error | Fix |
|---|---|
| `Failed to activate license` | Hub → Preferences → Licenses → Add → Personal. Or `unity --no-graphics --quit -batchmode -manualLicenseFile Unity_v...alf` flow on CI. |
| `IL2CPP build failed: missing platform support` | Hub → Installs → Editor 6000.3 → Add Modules → tick missing platform. |
| `Editor stuck on "Hold on... Importing Assets"` | Quit, delete `Library/`, reopen. **Never** delete `Assets/` or `ProjectSettings/`. |
| `Asset .meta files contain merge conflicts` | Set Unity → Edit → Project Settings → Editor → Asset Serialization = **Force Text**, Version Control = **Visible Meta Files**. |
| `Android: SDK not found` | Hub → Preferences → External Tools → tick "Android SDK Tools Installed with Unity (recommended)". |
| `WebGL build: emcc out of memory` | macOS/Linux: `ulimit -n 4096`; bump Player → WebGL → Memory Size to 512. |
| `iOS archive: codesign failed` | Open Xcode workspace from `Builds/iOS/`, Signing & Capabilities → Team. Never check in provisioning profiles. |
| `EntryPointNotFoundException` at runtime on iOS/WebGL | A `.so`/`.bundle` plugin is not AOT-safe — replace, or guard `[DllImport]` calls. |

---

## 3. Project Layout

```
sample-topdown/
├── Assets/
│   ├── _Project/              # ALL game-specific assets live here.
│   │   ├── Art/               # Sprites, atlases, animations.
│   │   ├── Audio/             # Music, SFX, AudioMixer assets.
│   │   ├── Prefabs/           # Saved GameObjects.
│   │   ├── Scenes/
│   │   │   ├── _Boot.unity    # First scene: loads Persistent + Title.
│   │   │   ├── Persistent.unity   # Loaded additively, never unloaded.
│   │   │   ├── Title.unity
│   │   │   └── Level_01.unity
│   │   ├── Scripts/
│   │   │   ├── Core/          # Boot, services, app-wide singletons.
│   │   │   ├── Gameplay/      # MonoBehaviours per feature folder.
│   │   │   ├── UI/            # UI Toolkit views + uGUI controllers.
│   │   │   ├── Data/          # ScriptableObject definitions + save models.
│   │   │   ├── Net/           # UGS Auth, Cloud Save, Lobby/Relay wrappers.
│   │   │   └── Editor/        # Editor-only tools, build scripts.
│   │   ├── ScriptableObjects/ # Asset instances of SOs.
│   │   ├── Settings/          # URP assets, Input Action assets, Render assets.
│   │   ├── ThirdParty/        # Imported store assets — touch sparingly.
│   │   └── UI/                # UXML, USS, theme stylesheets.
│   ├── AddressableAssetsData/ # Generated by Addressables; commit it.
│   └── StreamingAssets/       # Files copied verbatim into the build.
├── Packages/
│   ├── manifest.json          # Source of truth for installed packages.
│   └── packages-lock.json     # Auto-generated; commit it.
├── ProjectSettings/           # ALL .asset files; commit every one.
├── Builds/                    # gitignored; CI artifacts.
├── Library/                   # gitignored; Unity-generated cache.
├── Logs/                      # gitignored.
├── Temp/                      # gitignored.
├── UserSettings/              # gitignored.
├── .github/workflows/         # CI.
├── .claude/                   # Claude Code config.
├── .cursor/                   # Cursor rules.
├── .codex/                    # Codex config.
├── .editorconfig
├── .gitattributes
├── .gitignore
├── CLAUDE.md
├── AGENTS.md
└── README.md
```

### 3.1 Naming Conventions

| Artifact | Convention |
|---|---|
| C# class file | `PascalCase.cs`, one public class per file matching filename. |
| MonoBehaviour | `<Noun>Controller`, `<Noun>View`, `<Noun>Service`. |
| ScriptableObject | `<Noun>Definition` or `<Noun>Channel` (event channel). |
| Scene file | `PascalCase.unity`, prefix with `_` for boot/system scenes (`_Boot`). |
| Prefab | `<Category>_<Name>.prefab`, e.g. `Enemy_Slime.prefab`. |
| Asmdef | `<Studio>.<Module>.asmdef`, e.g. `Loopa.Gameplay.asmdef`. |
| Test asmdef | `<Studio>.<Module>.Tests.asmdef`, EditMode → `.Editor.Tests`. |
| Folder | `PascalCase` for asset folders; lower-case `Scripts/` allowed. |
| Branch | `feature/<short-slug>`, `fix/<short-slug>`, `chore/<slug>`. |

### 3.2 Where Things Go

| If you're adding… | …it goes in… |
|---|---|
| Sprite | `Assets/_Project/Art/<feature>/` |
| New scene | `Assets/_Project/Scenes/`; register in Build Settings |
| MonoBehaviour for player | `Assets/_Project/Scripts/Gameplay/Player/` |
| ScriptableObject definition (item, enemy stats) | `Assets/_Project/Scripts/Data/<type>.cs` and instance in `ScriptableObjects/` |
| Event channel | `Scripts/Data/Channels/<Name>EventChannelSO.cs` |
| UGS service wrapper | `Scripts/Net/<Service>Service.cs` |
| UI screen (UXML+USS+C#) | `Assets/UI/Screens/<Screen>/` |
| Editor tool | `Scripts/Editor/` (must be inside an `Editor/` folder OR Editor-only asmdef) |
| Build script | `Scripts/Editor/BuildScript.cs` |
| Test (PlayMode) | `Tests/PlayMode/<Module>/` with PlayMode asmdef |
| Test (EditMode) | `Tests/EditMode/<Module>/` with EditMode asmdef |
| Native plugin (.dll/.so/.dylib/.a) | `Assets/_Project/Plugins/<platform>/` |
| Addressable group | Window → Asset Management → Addressables Groups; profile in `AddressableAssetsData/` |
| Localization string table | `Assets/_Project/Localization/` (com.unity.localization) |
| Audio mixer asset | `Assets/_Project/Audio/Mixers/<Name>.mixer` |
| Render Pipeline asset | `Assets/_Project/Settings/UniversalRP_<Quality>.asset` |
| Input Actions asset | `Assets/_Project/Settings/InputActions.inputactions` |
| Save data model | `Scripts/Data/Save/<Schema>SaveData.cs` (`[Serializable]`) |

---

## 4. Architecture

### 4.1 Process Boundaries

```
┌─────────────────────────────────────────────────────────────────┐
│ Player Process (single)                                         │
│                                                                 │
│  ┌────────────────┐    ┌──────────────────┐   ┌──────────────┐  │
│  │ Main thread    │    │ Job system       │   │ Render thread │ │
│  │ (game loop,    │◄──►│ (parallel work,  │──►│  (URP draws) │  │
│  │  MonoBehaviour)│    │  Burst-compiled) │   │              │  │
│  └────────────────┘    └──────────────────┘   └──────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                  │ HTTPS
                  ▼
       ┌─────────────────────────┐
       │  UGS (managed cloud)    │
       │  Auth · Cloud Save ·    │
       │  Lobby · Relay ·        │
       │  Diagnostics            │
       └─────────────────────────┘
```

### 4.2 Frame Data Flow

```
Input System → PlayerInput component → InputAction callbacks
   → C# Gameplay code (Update/FixedUpdate)
      ├── Reads ScriptableObject definitions (config)
      ├── Writes via Event Channel SO  ────► UI listeners
      └── Writes Rigidbody2D (FixedUpdate only)
         → Physics2D step → Collisions
            → OnCollisionEnter2D → emits ScoreChannel.Raise(...)
               → UI HUD listens, redraws
```

### 4.3 Auth Flow (UGS)

```
Boot scene awakes
  → UnityServices.InitializeAsync()
  → AuthenticationService.Instance.SignInAnonymouslyAsync()
  → cache PlayerId in MemoryProfile
  → user opts to link account → SignInWithGoogleAsync / Apple / Steam
  → CloudSaveService.Instance.Data.Player.LoadAsync(...)
```

### 4.4 State Flow

```
ScriptableObject "GameStateSO" (single source of truth)
   ▲
   │ writes               ▼ reads
GameplayController     UI Views (UI Toolkit + uGUI)
   │
   └─ raises StateChangedEventChannelSO → all listeners react

Save:    JsonUtility.ToJson(saveModel) → File or CloudSave
Load:    File → JsonUtility.FromJson<SaveModel>()
```

### 4.5 Entry-point Files

| File | Responsibility |
|---|---|
| `Assets/_Project/Scenes/_Boot.unity` | First scene in Build Settings (index 0). Loads Persistent additively, then loads Title. Holds nothing else. |
| `Scripts/Core/AppBootstrapper.cs` | `[RuntimeInitializeOnLoadMethod(BeforeSceneLoad)]`. Initializes UGS, Logger, Addressables, Input. |
| `Scripts/Core/ServiceLocator.cs` | Plain C# DI (no IoC framework). Registers singletons: SaveService, AuthService, AudioService, AnalyticsService. |
| `Scripts/Editor/BuildScript.cs` | Static methods called by CI: `BuildWebGL`, `BuildAndroid`, `BuildIOS`, `BuildWindows`, `BuildMacOS`, `BuildLinux`. |
| `Packages/manifest.json` | Source of truth for installed packages. |
| `ProjectSettings/ProjectVersion.txt` | Pins editor version. CI must match. |

### 4.6 Where Logic Lives

- **Business rules** live in plain C# classes under `Scripts/Gameplay/<Feature>/`. They are **not** MonoBehaviours.
- **Unity glue** (input, rendering, physics) lives in MonoBehaviours that **delegate** to plain C# services.
- **Configuration** lives in ScriptableObject assets — never hardcoded in C#.
- **Data persistence** is centralized in `Scripts/Net/SaveService.cs`. Nothing else writes to disk or CloudSave.
- **Networking RPCs** live only in `NetworkBehaviour` subclasses under `Scripts/Net/`.

---

## 5. Dev Workflow

### 5.1 Start Dev Loop

1. Open project from Unity Hub. Editor compiles (`Library/` rebuilds first time).
2. Open `_Boot.unity` (always start from Boot to initialize services).
3. Press Play.

### 5.2 Hot Reload

Unity hot-reloads C# **only** while in Play mode if "Edit → Preferences → General → Auto Refresh + Recompile And Continue Playing" is enabled. Hot reload **breaks** when:
- A struct/class field is added/removed (state is lost — exit Play, re-enter).
- An asmdef is modified (full domain reload).
- A Unity package is changed (full reimport).

When in doubt: **Stop → Play again**.

### 5.3 Debugger Attach

| Editor | Steps |
|---|---|
| Rider | Run → Attach to Unity Process → pick the Editor. Breakpoints work in Edit and Play. |
| VS Code | Install "Unity (preview)" extension by Microsoft. Click "Attach to Unity & Play". |
| Visual Studio (Win) | Install "Visual Studio Tools for Unity" workload. Debug → Attach to Unity. |

### 5.4 Runtime Inspection

- **State**: Inspector while in Play; values reset on Stop unless serialized.
- **Logs**: Console window. Click line → opens script at logging call site.
- **Frame timing**: Window → Analysis → Profiler. Connect to running build over LAN for device profiling.
- **Memory**: Window → Analysis → Memory Profiler (install package).
- **Network**: For UGS, watch the Network section in Profiler + Debug.Log requests.

### 5.5 Pre-commit Checks (script)

```bash
# scripts/precommit.sh — invoked by .git/hooks/pre-commit
set -euo pipefail
dotnet format --verify-no-changes Assembly-CSharp.csproj || { echo "Run: dotnet format"; exit 1; }
# Headless edit-mode tests
"$UNITY_PATH" -batchmode -nographics -quit \
    -projectPath "$(pwd)" \
    -runTests -testPlatform EditMode \
    -testResults "Logs/editmode.xml" \
    -logFile "-"
```

### 5.6 Branch + Commit Conventions

- `main` is always green. No direct pushes.
- Branch: `feature/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commit: Conventional Commits. `feat:`, `fix:`, `chore:`, `refactor:`, `test:`.
- Squash-merge via PR. PR title = final commit message.
- Never commit `Library/`, `Builds/`, `Logs/`, `*.csproj`, `*.sln` (regenerated).

---

## 6. Testing & Parallelization

### 6.1 EditMode Tests

- Live in `Assets/_Project/Tests/EditMode/`.
- Asmdef: `Loopa.Tests.EditMode.asmdef` with `"includePlatforms": ["Editor"]`, references `Loopa.Gameplay`, `nunit.framework.dll`.
- Run via: `Window → General → Test Runner → EditMode → Run All`.
- Use for: pure C# logic, ScriptableObject validation, save serialization.

```csharp
// Tests/EditMode/Score/ScoreCalculatorTests.cs
using NUnit.Framework;
using Loopa.Gameplay.Score;

public class ScoreCalculatorTests
{
    [Test]
    public void AddingComboMultiplier_DoublesScore_OnHitTwo()
    {
        var s = new ScoreCalculator();
        s.RegisterHit(); s.RegisterHit();
        Assert.AreEqual(2, s.Combo);
        Assert.AreEqual(20, s.Total);  // 10 base * 2
    }
}
```

### 6.2 PlayMode Tests

- Live in `Assets/_Project/Tests/PlayMode/`.
- Asmdef: `Loopa.Tests.PlayMode.asmdef` with `"includePlatforms": []` (all).
- Run in Editor via Test Runner, in CI via `-testPlatform PlayMode`.
- Mark with `[UnityTest]` and return `IEnumerator` to use coroutines + `WaitForFixedUpdate`.

```csharp
// Tests/PlayMode/Player/PlayerMovementTests.cs
using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.TestTools;

public class PlayerMovementTests
{
    [UnityTest]
    public IEnumerator Player_MovesRight_WhenInputApplied()
    {
        var prefab = Resources.Load<GameObject>("Player");
        var go = Object.Instantiate(prefab);
        var ctrl = go.GetComponent<PlayerController>();
        ctrl.SetInput(new Vector2(1, 0));
        yield return new WaitForFixedUpdate();
        yield return new WaitForFixedUpdate();
        Assert.Greater(go.transform.position.x, 0.01f);
        Object.Destroy(go);
    }
}
```

### 6.3 E2E (Smoke)

PlayMode test that loads `_Boot` → Title → starts Level_01 → asserts no error logs:

```csharp
[UnityTest]
public IEnumerator BootToLevel_NoErrors()
{
    LogAssert.NoUnexpectedReceived();
    yield return SceneManager.LoadSceneAsync("_Boot");
    yield return new WaitForSeconds(2f);
    Assert.IsTrue(SceneManager.GetSceneByName("Title").isLoaded);
}
```

### 6.4 Run a Single Test

```
"$UNITY_PATH" -batchmode -nographics -quit \
    -projectPath . \
    -runTests -testPlatform PlayMode \
    -testFilter "Loopa.Tests.PlayMode.Player.PlayerMovementTests.Player_MovesRight_WhenInputApplied" \
    -testResults Logs/playmode.xml -logFile -
```

In Editor: Test Runner → right-click test → Run.

### 6.5 Mocking Rules

- **Never mock**: GameObject, Transform, MonoBehaviour, AudioSource, Rigidbody2D. Spawn real prefabs in PlayMode tests.
- **Always mock at boundary**: UGS calls (wrap in `IAuthService` / `ISaveService` interfaces, hand-rolled fakes in tests).
- **Never use Moq/NSubstitute on Unity types** — they hit reflection paths that don't survive IL2CPP and can flake under domain reload.

### 6.6 Coverage

- Install `com.unity.testtools.codecoverage` package.
- CI runs: `-enableCodeCoverage -coverageResultsPath Logs/coverage -coverageOptions "generateAdditionalMetrics;generateHtmlReport;assemblyFilters:+Loopa.*,-Loopa.*.Tests"`.
- Target: ≥ 60% line coverage on `Loopa.Gameplay.*` and `Loopa.Net.*`.

### 6.7 Parallelization for AI Agents

| Safe to fan out (parallel) | Must be serialized |
|---|---|
| Editing different scripts in different feature folders | Editing `Packages/manifest.json` |
| Adding new prefabs | Editing `ProjectSettings/*.asset` |
| Adding new ScriptableObject instances | Editing `AddressableAssetGroups/*.asset` |
| Writing tests in different test asmdefs | Editing `*.asmdef` files |
| Writing UXML/USS for distinct screens | Modifying scenes (`.unity`) — git treats as binary |

Rule: **scenes and assets are binary** under LFS. Two agents editing the same scene = lost work. One agent owns one scene at a time.

---

## 7. Logging

### 7.1 Setup

Create `Scripts/Core/Log.cs`:

```csharp
using UnityEngine;

public static class Log
{
    public static void Info(string module, string evt, object data = null)
        => Debug.Log($"INFO  [{module}] {evt} {Json(data)}");

    public static void Warn(string module, string evt, object data = null)
        => Debug.LogWarning($"WARN  [{module}] {evt} {Json(data)}");

    public static void Error(string module, string evt, object data = null)
        => Debug.LogError($"ERROR [{module}] {evt} {Json(data)}");

    private static string Json(object o)
        => o == null ? "" : JsonUtility.ToJson(o);
}
```

### 7.2 Levels

- **Info**: app boot, scene load, user-initiated action.
- **Warn**: recoverable miss (asset not found in catalog, retrying network).
- **Error**: every caught exception worth diagnosing.
- Never `print()`. Never bare `Debug.Log("...")` without going through `Log.*`.

### 7.3 Required Fields per Line

| Field | Source |
|---|---|
| `module` | Caller passes (`"Player"`, `"Auth"`, `"Save"`). |
| `event` | Verb-noun (`scene_loaded`, `auth_signed_in`). |
| `frame` | `Time.frameCount` — Unity adds automatically. |
| `time` | Editor adds. |
| `playerId` | Add via `Log.Info("Auth", "signed_in", new { playerId })`. |

### 7.4 Sample Log Lines

```
INFO  [Boot] services_initialized {"durationMs":423}
INFO  [Auth] signed_in {"playerId":"abc123"}
INFO  [Scene] loaded {"scene":"Level_01"}
WARN  [Addr] download_retry {"key":"music_main","attempt":2}
ERROR [Save] cloudsave_failed {"code":"network","message":"timeout"}
```

### 7.5 Sinks

- **Editor**: Console window + `Logs/<project>/Player.log`.
- **Player on device**: `~/Library/Logs/Unity/<project>/Player.log` (Mac), `%LOCALAPPDATA%\Low\<Company>\<Game>\Player.log` (Win), `/storage/emulated/0/Android/data/<id>/files/logs/` (Android), Browser DevTools console (WebGL).
- **Prod**: Unity Cloud Diagnostics auto-captures `LogType.Error` and uncaught exceptions for users who opted in.

### 7.6 Grep Locally

```bash
# macOS desktop standalone
grep -E "ERROR|WARN" "$HOME/Library/Logs/Unity/sample-topdown/Player.log" | tail -50
```

---

## 8. AI Rules

### 8.1 ALWAYS (≥20)

1. ALWAYS set Asset Serialization = Force Text and Version Control = Visible Meta Files in Edit → Project Settings → Editor before committing anything.
2. ALWAYS commit `.meta` files alongside the asset they describe — never one without the other.
3. ALWAYS put movement that touches `Rigidbody`/`Rigidbody2D` inside `FixedUpdate`, never `Update`.
4. ALWAYS use the new Input System (`PlayerInput` component + `.inputactions` asset). Never `Input.GetKey`, `Input.GetAxis`, `Input.touches`.
5. ALWAYS mark fields you need exposed in the Inspector with `[SerializeField] private ...`. Public fields are forbidden.
6. ALWAYS use `[FormerlySerializedAs("oldName")]` when renaming a serialized field — losing references in scenes/prefabs is a real cost.
7. ALWAYS load assets through Addressables (`Addressables.LoadAssetAsync<T>(key)`), never `Resources.Load`.
8. ALWAYS release Addressables handles you instantiate (`Addressables.Release(handle)` or `ReleaseInstance`).
9. ALWAYS run typecheck + EditMode tests before declaring a task done. Commands are in §8.5.
10. ALWAYS run `dotnet format` before commit; pre-commit hook enforces it.
11. ALWAYS pin `Packages/manifest.json` to specific versions; commit `packages-lock.json`.
12. ALWAYS keep MonoBehaviours thin: Awake/Start wires references, Update polls input, real logic delegates to plain C# classes in `Gameplay/`.
13. ALWAYS use ScriptableObject event channels for cross-system events; never `GameObject.Find`, never singletons typed as MonoBehaviour.
14. ALWAYS register every scene used at runtime in Build Settings. Loading an unregistered scene fails silently in builds.
15. ALWAYS keep `_Boot.unity` at index 0 in Build Settings.
16. ALWAYS guard async UGS calls with try/catch and log via `Log.Error`. UGS exceptions throw across `await` boundaries.
17. ALWAYS prefer `async`/`await` with `Awaitable`/Tasks for one-shot async; use coroutines only for frame-stepped sequencing.
18. ALWAYS dispose of `IDisposable`s (CancellationTokenSource, NativeArray, etc.) in `OnDestroy` or `using`.
19. ALWAYS profile before optimizing — Window → Analysis → Profiler. Never speculate about perf.
20. ALWAYS update `Packages/manifest.json` via Window → Package Manager UI, then commit the diff. Do not hand-edit JSON unless adding a scoped registry.
21. ALWAYS test on the actual lowest-target device once per feature for mobile work; Editor performance lies.
22. ALWAYS keep IL2CPP-incompatible code (`System.Reflection.Emit`, `dynamic`) out of runtime code — runtime errors are silent on iOS/WebGL.
23. ALWAYS check Editor and target Player versions match exactly in `ProjectSettings/ProjectVersion.txt` before shipping.

### 8.2 NEVER (≥15)

1. NEVER call `Find` / `FindObjectOfType` / `FindObjectsOfType` in Update or hot loops. Cache references in Awake.
2. NEVER use `Resources.Load` for new code. Addressables is the only loading API.
3. NEVER instantiate without a reference to destroy (every `Instantiate` must have a paired `Destroy`/`Release`/scene-unload).
4. NEVER write code that relies on Update ordering between scripts. Use `[DefaultExecutionOrder]` only as a last resort, document why.
5. NEVER mutate a `Rigidbody`'s position via `transform.position`; use `rb.MovePosition` in FixedUpdate.
6. NEVER call `GameObject.Find` by name in tests or runtime. Tests inject; runtime caches.
7. NEVER push `Library/`, `Temp/`, `Logs/`, `Builds/`, `UserSettings/`, `*.csproj`, `*.sln`, or `*.user` files.
8. NEVER commit large binaries unless they are tracked by Git LFS (see `.gitattributes`).
9. NEVER edit `ProjectSettings/ProjectVersion.txt` by hand. Upgrade through the Hub.
10. NEVER call into Editor namespaces (`UnityEditor.*`) from runtime scripts. Wrap with `#if UNITY_EDITOR` or place under an `Editor/` folder.
11. NEVER ship `Debug.Log` calls in inner loops; strip with `Conditional("UNITY_EDITOR")` or wrap in `if (Debug.isDebugBuild)`.
12. NEVER use `Time.deltaTime` inside `FixedUpdate` — use `Time.fixedDeltaTime`.
13. NEVER use static state that survives scene reloads unless you also register a `[RuntimeInitializeOnLoadMethod(SubsystemRegistration)]` reset.
14. NEVER mock GameObject/MonoBehaviour with reflection libraries — fakes only.
15. NEVER call `Destroy` on the same object twice; use `if (this == null) return;` first when racing async work.
16. NEVER hardcode UGS keys, Cloud Save keys, or asset addresses as magic strings. Centralize in `Scripts/Core/Keys.cs`.
17. NEVER bypass migrations on UGS Cloud Save data — version your save schema and migrate on load.
18. NEVER ship to a store directly from a developer machine for a release build; always go through CI/Cloud Build.
19. NEVER enable `Allow 'unsafe' Code` unless you have a profiled reason.

### 8.3 Blast Radius

| Path | Who depends | Verify after change |
|---|---|---|
| `Packages/manifest.json` | Every script, every build | Open Editor (full reimport), `dotnet format --verify-no-changes`, EditMode + PlayMode test runs, full WebGL build |
| `Packages/packages-lock.json` | Reproducible installs | Reimport, run tests |
| `ProjectSettings/ProjectVersion.txt` | All builds, all tools | Match Hub-installed editor; rebuild Library; smoke build |
| `ProjectSettings/EditorBuildSettings.asset` | Scene-loading at runtime | Run `_Boot` smoke; verify scenes resolve in Player |
| `ProjectSettings/InputManager.asset` | Legacy input only | Confirm new Input System still primary |
| `ProjectSettings/TagManager.asset` | Tag/layer references | Open every scene that uses tags, run PlayMode tests |
| `ProjectSettings/Physics2DSettings.asset` | All 2D collisions | Full PlayMode test suite, smoke level |
| `ProjectSettings/GraphicsSettings.asset` | URP rendering, shaders | Build for each target; check pink shaders |
| `Assets/_Project/Settings/UniversalRP_*.asset` | Whole render pipeline | Build all targets, screenshot diff |
| `Assets/AddressableAssetsData/AddressableAssetSettings.asset` | All Addressable loads | Build catalog, run PlayMode smoke |
| `Assets/_Project/Settings/InputActions.inputactions` | Every PlayerInput | Smoke gameplay, verify rebinds |
| `Assets/_Project/Scenes/_Boot.unity` | App startup | Cold launch in Editor + each platform |
| `Assets/_Project/Scenes/Persistent.unity` | Cross-scene services | Boot smoke, scene transitions |
| `Assets/_Project/Scripts/Core/AppBootstrapper.cs` | Service initialization | Boot smoke, log inspection |
| `Assets/_Project/Scripts/Core/ServiceLocator.cs` | Every consumer | Full PlayMode tests |
| `Assets/_Project/Scripts/Net/AuthService.cs` | All UGS-aware screens | Sign-in flow on each platform; offline path |
| `Assets/_Project/Scripts/Data/Save/*.cs` | Persistence | Backward-compat: load v(N-1) save in tests |
| `Assets/_Project/ScriptableObjects/**/*.asset` | Anything referencing them | Open scenes/prefabs that reference; verify no missing refs |
| `*.asmdef` | Compilation graph | Full reimport, all tests, build |
| `Assets/_Project/Plugins/**/*` (native) | Platform builds | Build each affected platform; runtime smoke |
| `.github/workflows/build.yml` | All CI builds | Push branch; verify all matrix legs pass |
| `Assets/_Project/Scripts/Editor/BuildScript.cs` | CI + manual builds | Run each `Build*` method locally headless |
| `.gitattributes` | LFS tracking | `git lfs ls-files` matches expectations |
| `.editorconfig` | C# formatting | `dotnet format --verify-no-changes` |
| `CLAUDE.md` / `AGENTS.md` / `.cursor/rules` | AI agent behavior | Manual read-through |

### 8.4 Definition of Done

**Bug fix**:
- Failing test added that reproduces the bug (EditMode if pure logic, PlayMode otherwise).
- Test now passes.
- All other tests still pass.
- Editor compiles with 0 warnings new to this change.
- For physics/input bugs: manually reproduced in Editor on the affected scene, Stop-Play cycle clean.
- Commit message references symptom + cause.

**New feature**:
- All files placed per §3.2.
- New asmdef OR fits existing one — no cross-asmdef circular references.
- EditMode tests for plain C# logic; PlayMode test for at least one happy path.
- New Addressables groups created if loading new assets.
- New scenes added to Build Settings (if any).
- Manually played in Editor; recorded a 5–10s screen capture.
- Smoke test (`_Boot` → Level_01) still green.
- Build for at least one target (WebGL is fastest) succeeds.

**Refactor**:
- No behavior change. Tests pre + post identical.
- Renamed serialized fields use `[FormerlySerializedAs]`.
- Affected prefabs/scenes opened in Editor; no missing references.
- `Library/` deleted + reimport from scratch passes.

**Dependency bump**:
- `Packages/manifest.json` updated only via Package Manager UI.
- `packages-lock.json` committed.
- Read changelog of bumped package; document any breaking changes in commit body.
- Full test suite + WebGL build smoke.

**Schema change (save data, ScriptableObject definition)**:
- Increment `SaveData.version` integer.
- Migration path written: load old version, transform, save new.
- Test that loads a fixture save from previous version and asserts post-migration shape.
- Existing players' Cloud Save records exported and replayed in test.

**Copy/UI text change**:
- Updated in localization tables (or default UXML if no localization yet).
- Screenshot before/after.

### 8.5 Self-Verification Recipe

```bash
# 0. Set UNITY_PATH — example for macOS:
export UNITY_PATH="/Applications/Unity/Hub/Editor/6000.3.13f1/Unity.app/Contents/MacOS/Unity"

# 1. Format check
dotnet format --verify-no-changes Assembly-CSharp.csproj
# Green output: nothing.
# Red: prints diffs and exits 1.

# 2. Compile + EditMode tests headless
"$UNITY_PATH" -batchmode -nographics -quit \
  -projectPath "$(pwd)" \
  -runTests -testPlatform EditMode \
  -testResults Logs/editmode.xml \
  -logFile - | tee Logs/editmode.txt
# Green: file ends with "Exiting batchmode successfully now!"
#        and Logs/editmode.xml has <test-suite ... result="Passed".
# Red:   "Compilation failed" OR "result=\"Failed\"".

# 3. PlayMode tests headless
"$UNITY_PATH" -batchmode -nographics -quit \
  -projectPath "$(pwd)" \
  -runTests -testPlatform PlayMode \
  -testResults Logs/playmode.xml \
  -logFile - | tee Logs/playmode.txt
# Green/Red: same pattern as EditMode.

# 4. Smoke build (WebGL is fastest)
"$UNITY_PATH" -batchmode -nographics -quit \
  -projectPath "$(pwd)" \
  -buildTarget WebGL \
  -executeMethod Loopa.Editor.BuildScript.BuildWebGL \
  -logFile - | tee Logs/build-webgl.txt
# Green: "Build completed successfully" + Builds/WebGL/index.html exists.
```

### 8.6 Parallelization Patterns (this stack)

Safe parallel subagent fan-out:
- "Write Player movement script" + "Write enemy AI script" + "Write tilemap loader" — three separate folders, three separate files, three separate test assemblies.
- "Add UXML for HUD" + "Add UXML for pause menu" — different UI folders.

Must be sequential:
- Anything touching `Packages/manifest.json` (Package Manager UI is single-writer).
- Anything touching `ProjectSettings/*.asset` (Unity rewrites whole files).
- Anything editing the same `.unity` scene (binary merge conflicts).
- Anything editing the same `.prefab` (same).
- Adding to Addressables groups (`AddressableAssetGroups/*.asset`).

---

## 9. Stack-Specific Pitfalls (≥15)

1. **Heavy logic in `Update()` instead of `FixedUpdate()` for physics** → symptom: jittery movement, tunneling through walls → fix: move all `Rigidbody`/`Rigidbody2D` writes to `FixedUpdate`, keep only input read in `Update` → detect: enable Time → Show in Profiler.
2. **Leaking GameObjects via `Instantiate` without `Destroy`** → symptom: frame time grows, memory leaks → fix: every spawn has a paired despawn or pool → detect: Profiler → Memory → diff snapshots over time.
3. **Hardcoded serialization breaking after refactor** → symptom: prefab references go null after rename → fix: `[FormerlySerializedAs("oldName")]` on the new field name → detect: open prefab/scene; "Missing" warnings in Inspector.
4. **Renamed C# class loses scene references** → symptom: MonoBehaviour shows as "Missing Script" → fix: add `[MovedFrom(true, sourceClassName: "OldName")]` (UnityEngine.Scripting.APIUpdating) before renaming, or use Script Updater → detect: Console "Could not load type" warnings.
5. **`Resources.Load` used in new code** → symptom: assets bundled into every build, longer cold start → fix: rewrite as `Addressables.LoadAssetAsync<T>(key)` → detect: grep for `Resources.Load`.
6. **Forgetting `[SerializeField]`** → symptom: inspector shows nothing for a private field → fix: add the attribute, or make field public (don't) → detect: Inspector reads the script and the field is missing.
7. **Coroutines vs `async`/`await` mixed without care** → symptom: Tasks continue after Stop in Editor, hold references → fix: cancel via `CancellationTokenSource` linked to `destroyCancellationToken` → detect: Editor stays "playing" briefly after stop, NRE in console.
8. **Input System asset not assigned to PlayerInput** → symptom: actions never fire → fix: drag `InputActions.inputactions` onto the PlayerInput component → detect: PlayerInput component shows "(none)" in inspector.
9. **Forgotten `Application.isEditor` guards in build scripts** → symptom: WebGL build calls `UnityEditor.*` and fails → fix: wrap with `#if UNITY_EDITOR` → detect: build log "type or namespace `UnityEditor` could not be found".
10. **Addressables remote catalog not built** → symptom: WebGL works locally, errors on first remote load in prod → fix: in Addressables Groups window → Build → New Build → Default Build Script before player build → detect: runtime "InvalidKey" exceptions.
11. **IL2CPP strips reflection-used types** → symptom: Newtonsoft Json deserialization fails on iOS only → fix: `link.xml` to preserve types, or use `JsonUtility` → detect: works in Editor + Mono Win, fails on iOS/WebGL.
12. **`System.Threading.Timer` on WebGL** → symptom: nothing fires in browser → fix: WebGL is single-threaded; use coroutines or `Awaitable.WaitForSecondsAsync` → detect: works on desktop, silently fails in browser.
13. **Scene loaded but services not initialized** → symptom: NRE on `AuthService.Instance` → fix: always start from `_Boot.unity`; in Editor enable "Reload Domain on play" + use `[RuntimeInitializeOnLoadMethod]` → detect: NRE only when starting from a non-boot scene.
14. **`PlayerPrefs` for save data** → symptom: data wipes on iOS app reinstall, registry bloat on Win → fix: write JSON to `Application.persistentDataPath` + UGS Cloud Save → detect: code review grep `PlayerPrefs`.
15. **Static fields holding scene references** → symptom: NREs after returning to a level → fix: `[RuntimeInitializeOnLoadMethod(SubsystemRegistration)]` to reset them on scene load → detect: works first time, fails second.
16. **Async UGS call awaited without try/catch** → symptom: silent service init failure → fix: wrap each `await UnityServices.InitializeAsync()` and `SignInAnonymouslyAsync()` in try/catch, log errors → detect: Boot scene completes but auth state is null.
17. **WebGL build with `Compression Format = Brotli` served without correct headers** → symptom: blank canvas, console "Unable to parse Build/*.framework.js.br" → fix: configure server `Content-Encoding: br` for `*.br` files, or set Compression Format = Disabled for itch.io → detect: F12 Network panel shows binary garbage.
18. **Forgetting to add a scene to Build Settings** → symptom: `LoadScene` throws "Scene not in build" → fix: File → Build Settings → drag scene in → detect: error string is exact and unmistakable.
19. **Editor crashes on play after package update** → fix: quit Editor, delete `Library/`, reopen → detect: crash on Enter Play.
20. **Two agents edit the same `.unity` scene in parallel** → symptom: merge conflict, lost work → fix: scenes are LFS-locked (`git lfs lock Assets/.../X.unity`), one writer at a time → detect: merge produces a binary conflict that git can't auto-resolve.

---

## 10. Performance Budgets

| Metric | Target | Measure with |
|---|---|---|
| Cold start (Editor → first frame on `_Boot`) | ≤ 4s on Apple Silicon, ≤ 8s on a 2018 mid-tier laptop | Profiler "Editor → Player startup" |
| TTI on WebGL (broadband, fresh cache) | ≤ 8s on 100 Mbit | Browser DevTools → Performance |
| WebGL build size (gzipped) | ≤ 25 MB initial | Build report `Logs/Editor.log` after build |
| Frame time on lowest target mobile (iPhone 12 / Pixel 6) | 16.6 ms (60 FPS) sustained | Window → Analysis → Profiler over device |
| RAM on mobile peak | ≤ 700 MB | Profiler → Memory module |
| Battery: % per 30 min of gameplay on iPhone 12 | ≤ 8% | Xcode Energy gauge |
| Draw calls per frame | ≤ 200 in-game | Frame Debugger |
| GC alloc/frame in Update | 0 B steady-state | Profiler GC.Alloc column |

When budget is exceeded:
1. Open Profiler with Deep Profile **off** first (Deep Profile inflates numbers).
2. Identify hot script via "Other → Scripts" tab.
3. If GC pressure: search for boxing, LINQ in inner loops, `string` concatenation in `Update`.
4. If draw calls high: enable Static + Dynamic Batching, use Sprite Atlases, check material variants.

---

## 11. Security

### 11.1 Secret Storage

- Never check in `*.json` containing UGS keys you marked as server-side. UGS *project ID* + *environment ID* are non-secret and live in `ProjectSettings/Services.asset`.
- Apple/Google signing certs and provisioning profiles: GitHub Actions Secrets (encrypted) and/or UGS Cloud Build managed credentials. Never in repo.
- Local Apple keychain holds dev signing identity; CI uses a temporary keychain created from base64-encoded `.p12` in secrets.

### 11.2 Auth Threat Model

- Anonymous UGS auth = trusted-on-device-only. Anyone with the device can call as that PlayerId.
- Cloud Save default ACL = "private" (player can read/write own data). Don't loosen.
- Server-authoritative actions belong in **Cloud Code** (UGS), not the client. The client is hostile.
- Linked accounts (Google/Apple/Steam) elevate trust; treat anonymous-only as "guest".

### 11.3 Input Validation

- Validate at every UGS Cloud Code endpoint: type, length, range. Never trust client claims of score, currency, level.
- For 2D top-down sample: server-validate "level completed" with at least time-elapsed sanity bounds.

### 11.4 Output Escaping

- UI Toolkit + uGUI: text is rendered verbatim; escape user-supplied strings if logging to HTML or sending to third parties.
- Never inject user strings into `Application.OpenURL` without `Uri.EscapeDataString`.

### 11.5 Permissions / Capabilities

- iOS Info.plist: declare `NSCameraUsageDescription`, `NSPhotoLibraryUsageDescription`, `NSUserTrackingUsageDescription` only if used. Empty rejection from App Review otherwise.
- Android Manifest: `INTERNET` only; remove `READ_EXTERNAL_STORAGE` unless needed (it's auto-stripped on API 33+).
- WebGL: serve over HTTPS; no extra capabilities.

### 11.6 Dependency Audit

- `Packages/manifest.json` versions reviewed each time bumped. No third-party scoped registries without an entry in CLAUDE.md.
- `dotnet list package --vulnerable` on any standalone .NET tooling.

### 11.7 Top 5 Stack-Specific Risks

1. Trusting client-reported scores (hostile clients trivially edit memory).
2. Embedding any server-only key in client builds (extracted via decompiler in minutes).
3. WebGL builds with debug `IL2CPP` + symbols leak C# source structure publicly.
4. Bundled native plugins of unknown provenance — IL2CPP can't sandbox them.
5. Using Cloud Save as "the database" without Cloud Code validation = trivially cheatable.

---

## 12. Deploy

### 12.1 Release Flow

| Target | Where it builds | Where it lands |
|---|---|---|
| WebGL | GitHub Actions (`game-ci/unity-builder@v4`) | itch.io via `butler push Builds/WebGL <user>/<game>:web` |
| Windows | GitHub Actions | GitHub Releases + itch.io `:windows` channel |
| macOS | GitHub Actions | GitHub Releases + itch.io `:mac` channel |
| Linux | GitHub Actions | GitHub Releases + itch.io `:linux` channel |
| iOS | UGS Cloud Build (Apple credentials) | TestFlight automatic, App Store on promotion |
| Android | UGS Cloud Build (Google credentials) | Play Internal track, promotion to Production manual |

### 12.2 Staging vs Prod

- Two UGS environments: `dev` and `prod`. Set via Edit → Project Settings → Services → Environment.
- `dev` for local + Internal/TestFlight builds. `prod` only on signed App Store / Play Production / itch public.

### 12.3 Rollback

- itch.io: `butler push` previous build artifact to same channel. Window: anytime.
- TestFlight/Play Internal: upload prior signed binary via Cloud Build "Promote" or manually. Window: ≤ 24h before users start updating.
- Production stores: phased rollout; pause from console (Play) / Phased Release (App Store). Window: typically ≤ 7 days post-submission.

### 12.4 Health / Smoke

- After CI WebGL deploy: GH Action runs `curl -sSf https://<itch>/index.html` then headless Chromium loads + waits for `INFO  [Boot] services_initialized` log.
- For mobile: TestFlight install, manual smoke: Boot → Title → Play → die → return to Title.

### 12.5 Versioning

- Source of truth: `ProjectSettings/ProjectSettings.asset` → `bundleVersion` (also Player Settings → Version).
- Semver: `MAJOR.MINOR.PATCH`. Bumped via `scripts/bump_version.sh` — bumps `bundleVersion` and `iOS buildNumber` and `Android bundleVersionCode`.
- CHANGELOG.md updated each release.

### 12.6 Auto-update

- Mobile: stores handle it. No in-app updates.
- itch.io desktop: itch app handles updates if the user installs through it.
- WebGL: every page load is the latest; cache busting via `Application.version` in URL query.

### 12.7 DNS / Domain

- N/A for itch + stores. If using a custom domain for WebGL: CNAME to itch's static page, or host on Cloudflare Pages (separate pipeline).

### 12.8 Cost Estimate (per 1,000 MAU)

- itch.io: $0 (5–10% optional revenue share).
- UGS free tier: 50,000 MAU + 5 GB Cloud Save storage included; above that ~$0.40 / additional 1k MAU for Cloud Save, varies by service.
- Cloud Build: 200 build minutes/month free; Personal tier sufficient for solo dev.
- Apple Developer: $99/yr flat.
- Google Play: $25 one-time.
- Total at 1k MAU: dominated by Apple's $99/yr ≈ **$0.10 per MAU per month**.

---

## 13. Claude Code Integration

### 13.1 `CLAUDE.md` (paste-ready)

```markdown
# Claude Code Context — sample-topdown (Unity 6.3 LTS, URP, C#)

This project is governed by `rulebooks/unity6.md`. Read it before any non-trivial change.

## Quick reference

- Editor: `6000.3.13f1`. Use Unity Hub. Never hand-edit `ProjectSettings/ProjectVersion.txt`.
- Scripts live in `Assets/_Project/Scripts/`. Tests in `Assets/_Project/Tests/{EditMode,PlayMode}/`.
- All asset loads go through Addressables — never `Resources.Load`.
- All input goes through the new Input System — never `Input.GetKey`/`GetAxis`/`touches`.
- Physics writes go in `FixedUpdate`. Input reads go in `Update`.
- Serialized fields: `[SerializeField] private`. Public fields are forbidden.

## Commands

- Format check: `dotnet format --verify-no-changes Assembly-CSharp.csproj`
- EditMode tests headless: `"$UNITY_PATH" -batchmode -nographics -quit -projectPath . -runTests -testPlatform EditMode -testResults Logs/editmode.xml -logFile -`
- PlayMode tests headless: same with `-testPlatform PlayMode`.
- WebGL build: `"$UNITY_PATH" -batchmode -nographics -quit -projectPath . -buildTarget WebGL -executeMethod Loopa.Editor.BuildScript.BuildWebGL -logFile -`
- Open editor headed: launch via Unity Hub.

## Banned patterns

- `Input.GetKey*`, `Input.GetAxis*`, `Input.touches`
- `Resources.Load`
- `GameObject.Find` / `FindObjectOfType` in hot paths
- `PlayerPrefs` for save data
- `transform.position = ...` on objects with `Rigidbody*`
- `print("...")`, bare `Debug.Log` outside the `Log.*` wrapper

## Skills to invoke

- `/test-driven-development` before any feature work.
- `/systematic-debugging` for runtime bugs (NREs, missing references).
- `/verification-before-completion` before declaring tasks done.
- `/ship` when ready to PR/release.

## Parallelization

- Disjoint scripts in different feature folders → safe parallel.
- Anything touching scenes (`.unity`), prefabs (`.prefab`), `Packages/manifest.json`, `ProjectSettings/*` → strictly sequential.
```

### 13.2 `.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(git:*)",
      "Bash(gh:*)",
      "Bash(dotnet format*)",
      "Bash(dotnet build*)",
      "Bash(dotnet test*)",
      "Bash(git lfs *)",
      "Bash(\"$UNITY_PATH\":*)",
      "Bash(curl -sSf*)",
      "Read(./**)",
      "Write(./Assets/**)",
      "Write(./Packages/manifest.json)",
      "Write(./ProjectSettings/**)",
      "Write(./.github/**)",
      "Write(./CLAUDE.md)",
      "Write(./AGENTS.md)",
      "Write(./.cursor/**)",
      "Write(./.editorconfig)",
      "Write(./.gitignore)",
      "Write(./.gitattributes)"
    ],
    "deny": [
      "Write(./Library/**)",
      "Write(./Builds/**)",
      "Write(./Logs/**)",
      "Write(./Temp/**)",
      "Write(./UserSettings/**)",
      "Bash(rm -rf*)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "dotnet format Assembly-CSharp.csproj --include $CLAUDE_FILE_PATHS 2>/dev/null || true" }]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [{ "type": "command", "command": "echo Running: $CLAUDE_TOOL_INPUT" }]
      }
    ],
    "Stop": [
      {
        "hooks": [{ "type": "command", "command": "[ -f Logs/editmode.xml ] && grep -q 'result=\"Failed\"' Logs/editmode.xml && echo 'WARNING: EditMode tests failing.' || true" }]
      }
    ]
  }
}
```

### 13.3 Slash commands worth wiring

- `/run-editmode-tests`
- `/run-playmode-tests`
- `/build-webgl`
- `/lint` → `dotnet format --verify-no-changes`

---

## 14. Codex Integration

### 14.1 `AGENTS.md`

```markdown
# AGENTS.md — sample-topdown (Unity 6.3 LTS)

Same governing doc: `rulebooks/unity6.md`. Same banned patterns and ALWAYS/NEVER as CLAUDE.md.

## Codex specifics

- This repo uses Git LFS — `git lfs install` once before cloning.
- Run `dotnet format --verify-no-changes` before suggesting commit.
- For headless builds, set `UNITY_PATH` env var and use `BuildScript.Build*` static methods.
- Don't open Unity from Codex — drive it via `-batchmode`.

## Build matrix

WebGL, StandaloneWindows64, StandaloneOSX, StandaloneLinux64, iOS, Android.

## Where to put what

See §3 of `rulebooks/unity6.md`. Don't invent new top-level folders.
```

### 14.2 `.codex/config.toml`

```toml
[default]
model = "gpt-5-codex"
sandbox = "workspace-write"
approval = "auto-edit"

[bash]
allowlist = [
  "git",
  "gh",
  "dotnet",
  "curl",
  "git-lfs",
]
denylist = [
  "rm -rf /",
  "shutdown",
]

[notes]
context_files = ["AGENTS.md", "rulebooks/unity6.md", "CLAUDE.md"]
```

### 14.3 Codex vs Claude differences

- Codex prefers explicit shell over editor integration. Always pass full file paths from project root.
- Codex doesn't have a `/test-driven-development` slash; replicate by writing a failing test first in your prompt.
- Codex has weaker scene-file awareness. For scene edits, do them manually in the Editor and let Codex handle scripts only.

---

## 15. Cursor / Other Editors

### 15.1 `.cursor/rules`

```
You are working in a Unity 6.3 LTS C# project. Read rulebooks/unity6.md for the full ruleset.

ALWAYS:
- Put physics writes in FixedUpdate. Input reads in Update.
- Use the new Input System. Never Input.GetKey/GetAxis/touches.
- Use Addressables for asset loads. Never Resources.Load.
- Mark serialized fields [SerializeField] private. Never public fields.
- Cache references in Awake. Never Find/FindObjectOfType in hot paths.
- Use [FormerlySerializedAs("oldName")] when renaming serialized fields.
- Wrap all UGS async calls in try/catch.
- Run `dotnet format --verify-no-changes` and EditMode tests before declaring done.

NEVER:
- Edit ProjectSettings/ProjectVersion.txt by hand.
- Commit Library/, Builds/, Logs/, Temp/, UserSettings/, *.csproj, *.sln.
- Use PlayerPrefs for save data. Use JsonUtility + Application.persistentDataPath + UGS Cloud Save.
- Use Resources.Load.
- Mock GameObject/MonoBehaviour with reflection mocks. Use hand-rolled fakes.
- Hand-edit Packages/manifest.json — use Package Manager UI.

Where things go: see §3 of rulebooks/unity6.md.
```

### 15.2 `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ms-dotnettools.csharp",
    "visualstudiotoolsforunity.vstuc",
    "editorconfig.editorconfig",
    "kreativ-software.csharpextensions",
    "tobiah.unity-tools"
  ]
}
```

### 15.3 `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Attach to Unity",
      "type": "vstuc",
      "request": "attach"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Drop these files in this order. After all files exist, `git add . && git commit && git push`. The CI workflow in `.github/workflows/build.yml` builds WebGL on push to `main`.

### 16.1 `.gitignore`

```gitignore
# Unity generated
[Ll]ibrary/
[Tt]emp/
[Oo]bj/
[Bb]uild/
[Bb]uilds/
[Ll]ogs/
[Mm]emoryCaptures/
[Uu]serSettings/
[Aa]ssets/AssetStoreTools*

# Visual Studio / Rider / VS Code
.vs/
.vscode/.BROWSE.VC.db*
.idea/
*.csproj
*.unityproj
*.sln
*.suo
*.tmp
*.user
*.userprefs
*.pidb
*.booproj
*.svd
*.pdb
*.mdb
*.opendb
*.VC.db

# Builds
*.apk
*.aab
*.unitypackage
*.app

# Crashlytics
crashlytics-build.properties

# OS
.DS_Store
Thumbs.db
```

### 16.2 `.gitattributes`

```gitattributes
# Force LF line endings, except platform-specific shell scripts
* text=auto
*.bat       text eol=crlf
*.sh        text eol=lf

# Treat as binary
*.psd       binary
*.png       binary
*.jpg       binary
*.jpeg      binary
*.gif       binary
*.bmp       binary
*.tga       binary
*.exr       binary
*.hdr       binary
*.ico       binary
*.webp      binary
*.tif       binary
*.tiff      binary

# Audio / video
*.mp3       binary
*.wav       binary
*.ogg       binary
*.mp4       binary
*.mov       binary

# 3D / fonts / archives
*.fbx       binary
*.obj       binary
*.blend     binary
*.ttf       binary
*.otf       binary
*.zip       binary
*.7z        binary

# LFS — large binaries
*.psd      filter=lfs diff=lfs merge=lfs -text
*.png      filter=lfs diff=lfs merge=lfs -text
*.jpg      filter=lfs diff=lfs merge=lfs -text
*.tga      filter=lfs diff=lfs merge=lfs -text
*.exr      filter=lfs diff=lfs merge=lfs -text
*.fbx      filter=lfs diff=lfs merge=lfs -text
*.obj      filter=lfs diff=lfs merge=lfs -text
*.blend    filter=lfs diff=lfs merge=lfs -text
*.wav      filter=lfs diff=lfs merge=lfs -text
*.mp3      filter=lfs diff=lfs merge=lfs -text
*.ogg      filter=lfs diff=lfs merge=lfs -text
*.mp4      filter=lfs diff=lfs merge=lfs -text

# Unity scenes/prefabs/assets — text but mergetool helpful
*.unity    merge=unityyamlmerge eol=lf
*.prefab   merge=unityyamlmerge eol=lf
*.asset    merge=unityyamlmerge eol=lf
*.meta     merge=unityyamlmerge eol=lf
*.controller merge=unityyamlmerge eol=lf
*.anim     merge=unityyamlmerge eol=lf
```

### 16.3 `.editorconfig`

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.cs]
indent_size = 4
csharp_new_line_before_open_brace = all
csharp_style_var_for_built_in_types = true:suggestion
csharp_style_var_when_type_is_apparent = true:suggestion
csharp_style_var_elsewhere = true:suggestion
dotnet_style_qualification_for_field = false:warning
dotnet_style_qualification_for_property = false:warning
dotnet_style_qualification_for_method = false:warning
dotnet_diagnostic.IDE0005.severity = warning
# Microsoft.Unity.Analyzers
dotnet_diagnostic.UNT0001.severity = warning
dotnet_diagnostic.UNT0002.severity = error
dotnet_diagnostic.UNT0003.severity = error
dotnet_diagnostic.UNT0004.severity = error
dotnet_diagnostic.UNT0005.severity = warning
dotnet_diagnostic.UNT0006.severity = warning
dotnet_diagnostic.UNT0007.severity = warning
dotnet_diagnostic.UNT0008.severity = error
dotnet_diagnostic.UNT0014.severity = warning
dotnet_diagnostic.UNT0017.severity = error
dotnet_diagnostic.USG0001.severity = warning

[*.{json,yml,yaml,md}]
indent_size = 2

[*.{csproj,sln}]
indent_size = 2
```

### 16.4 `Packages/manifest.json` (initial state)

```json
{
  "dependencies": {
    "com.unity.2d.tilemap": "1.0.0",
    "com.unity.2d.sprite": "1.0.0",
    "com.unity.addressables": "2.6.0",
    "com.unity.collab-proxy": "2.6.0",
    "com.unity.ide.rider": "3.0.36",
    "com.unity.ide.visualstudio": "2.0.23",
    "com.unity.ide.vscode": "1.2.5",
    "com.unity.inputsystem": "1.14.0",
    "com.unity.netcode.gameobjects": "2.0.0",
    "com.unity.render-pipelines.universal": "17.3.0",
    "com.unity.services.authentication": "3.4.0",
    "com.unity.services.cloudsave": "3.2.0",
    "com.unity.services.lobby": "1.2.2",
    "com.unity.services.relay": "1.1.1",
    "com.unity.services.analytics": "5.1.0",
    "com.unity.services.core": "1.13.0",
    "com.unity.test-framework": "1.4.4",
    "com.unity.testtools.codecoverage": "1.2.6",
    "com.unity.timeline": "1.8.7",
    "com.unity.ugui": "2.0.0",
    "com.unity.modules.ai": "1.0.0",
    "com.unity.modules.androidjni": "1.0.0",
    "com.unity.modules.animation": "1.0.0",
    "com.unity.modules.audio": "1.0.0",
    "com.unity.modules.imageconversion": "1.0.0",
    "com.unity.modules.physics": "1.0.0",
    "com.unity.modules.physics2d": "1.0.0",
    "com.unity.modules.ui": "1.0.0",
    "com.unity.modules.uielements": "1.0.0",
    "com.unity.modules.unityanalytics": "1.0.0",
    "com.unity.modules.unitywebrequest": "1.0.0"
  },
  "testables": [
    "com.unity.inputsystem"
  ]
}
```

### 16.5 `ProjectSettings/ProjectVersion.txt`

```
m_EditorVersion: 6000.3.13f1
m_EditorVersionWithRevision: 6000.3.13f1 (<revision-hash>)
```

> The revision hash is filled by Unity. Open the project in Unity Hub once after creation; commit whatever it writes.

### 16.6 `Assets/_Project/Scripts/Editor/BuildScript.cs`

```csharp
#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

namespace Loopa.Editor
{
    public static class BuildScript
    {
        private const string OutDir = "Builds";

        private static string[] Scenes => EditorBuildSettings.scenes
            .Where(s => s.enabled).Select(s => s.path).ToArray();

        public static void BuildWebGL()    => Build(BuildTarget.WebGL,            "WebGL/index.html");
        public static void BuildWindows()  => Build(BuildTarget.StandaloneWindows64, "Windows/sample-topdown.exe");
        public static void BuildMacOS()    => Build(BuildTarget.StandaloneOSX,    "macOS/sample-topdown.app");
        public static void BuildLinux()    => Build(BuildTarget.StandaloneLinux64,"Linux/sample-topdown.x86_64");
        public static void BuildAndroid()  => Build(BuildTarget.Android,          "Android/sample-topdown.apk");
        public static void BuildIOS()      => Build(BuildTarget.iOS,              "iOS");

        private static void Build(BuildTarget target, string locationPath)
        {
            var path = Path.Combine(OutDir, locationPath);
            Directory.CreateDirectory(Path.GetDirectoryName(path));
            var opts = new BuildPlayerOptions
            {
                scenes          = Scenes,
                target          = target,
                locationPathName= path,
                options         = BuildOptions.None
            };
            var report = BuildPipeline.BuildPlayer(opts);
            if (report.summary.result != BuildResult.Succeeded)
                throw new Exception($"Build failed: {report.summary.result}");
            Debug.Log($"Build completed successfully: {path}");
        }
    }
}
#endif
```

### 16.7 `Assets/_Project/Scripts/Core/AppBootstrapper.cs`

```csharp
using System;
using UnityEngine;
using Unity.Services.Core;
using Unity.Services.Authentication;

namespace Loopa.Core
{
    public static class AppBootstrapper
    {
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.BeforeSceneLoad)]
        private static async void Init()
        {
            try
            {
                await UnityServices.InitializeAsync();
                if (!AuthenticationService.Instance.IsSignedIn)
                    await AuthenticationService.Instance.SignInAnonymouslyAsync();
                Log.Info("Boot", "services_initialized");
            }
            catch (Exception e)
            {
                Log.Error("Boot", "init_failed", new { message = e.Message });
            }
        }
    }
}
```

### 16.8 `Assets/_Project/Tests/EditMode/Smoke/SmokeTests.cs`

```csharp
using NUnit.Framework;

namespace Loopa.Tests.EditMode
{
    public class SmokeTests
    {
        [Test] public void SanityCheck() => Assert.AreEqual(2, 1 + 1);
    }
}
```

(Plus matching asmdef under same folder: `Loopa.Tests.EditMode.asmdef` with `"includePlatforms": ["Editor"]`.)

### 16.9 `.github/workflows/build.yml`

```yaml
name: Build & Test

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    name: Unity Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true, fetch-depth: 0 }
      - uses: actions/cache@v4
        with:
          path: Library
          key: Library-${{ hashFiles('Assets/**', 'Packages/**', 'ProjectSettings/**') }}
          restore-keys: Library-
      - uses: game-ci/unity-test-runner@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL:   ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD:${{ secrets.UNITY_PASSWORD }}
        with:
          unityVersion: 6000.3.13f1
          githubToken: ${{ secrets.GITHUB_TOKEN }}
          testMode: all

  build:
    name: Build ${{ matrix.targetPlatform }}
    runs-on: ubuntu-latest
    needs: test
    strategy:
      fail-fast: false
      matrix:
        targetPlatform:
          - WebGL
          - StandaloneWindows64
          - StandaloneOSX
          - StandaloneLinux64
          - Android
    steps:
      - uses: actions/checkout@v4
        with: { lfs: true, fetch-depth: 0 }
      - uses: actions/cache@v4
        with:
          path: Library
          key: Library-${{ matrix.targetPlatform }}-${{ hashFiles('Assets/**', 'Packages/**', 'ProjectSettings/**') }}
          restore-keys: |
            Library-${{ matrix.targetPlatform }}-
            Library-
      - uses: game-ci/unity-builder@v4
        env:
          UNITY_LICENSE: ${{ secrets.UNITY_LICENSE }}
          UNITY_EMAIL:   ${{ secrets.UNITY_EMAIL }}
          UNITY_PASSWORD:${{ secrets.UNITY_PASSWORD }}
        with:
          unityVersion: 6000.3.13f1
          targetPlatform: ${{ matrix.targetPlatform }}
          buildName: sample-topdown
      - uses: actions/upload-artifact@v4
        with:
          name: Build-${{ matrix.targetPlatform }}
          path: build/${{ matrix.targetPlatform }}
```

### 16.10 `README.md` stub

```markdown
# sample-topdown

Unity 6.3 LTS · URP · 2D top-down sample. See `rulebooks/unity6.md` for the full developer rulebook.

## Run

1. Install Unity Hub.
2. Install Editor `6000.3.13f1` with iOS / Android / WebGL / Mac+Win+Linux modules.
3. `git clone` then open the folder via Hub → Add project from disk.
4. Open `Assets/_Project/Scenes/_Boot.unity` and press Play.

## CI

GitHub Actions builds on push to `main`. See `.github/workflows/build.yml`.

## License

MIT — see `LICENSE`.
```

### 16.11 `LICENSE` (MIT — fill in `[year] [name]`).

---

## 17. Idea → MVP Path (generic 2D top-down sample)

| Phase | Goal | Files touched | Sessions | Exit criteria |
|---|---|---|---|---|
| 1. Schema | Data model: `PlayerSaveData`, `LevelDefinitionSO`, `EnemyDefinitionSO`, `ItemDefinitionSO` | `Scripts/Data/**` | 1 | EditMode tests serialize/deserialize all three; values round-trip. |
| 2. Backbone | Boot/Persistent/Title/Level scenes; AppBootstrapper; ServiceLocator; Input Actions | `Scenes/**`, `Scripts/Core/**`, `Settings/InputActions.inputactions` | 1–2 | `_Boot` → Title → empty Level loads cleanly; PlayMode smoke test green. |
| 3. Vertical slice | Player movement + 1 enemy + 1 pickup + score HUD | `Scripts/Gameplay/Player/**`, `Gameplay/Enemy/**`, `UI/HUD/**` | 2–3 | Player can move, kill enemy, pick up item, score updates. PlayMode test for each. |
| 4. Auth + multi-user | UGS Auth anonymous + Cloud Save score, leaderboard | `Scripts/Net/**`, `Scripts/Data/Save/**` | 2 | Score persists across sessions, fresh device reads back; offline mode falls back to local file. |
| 5. Ship + monitor | CI WebGL → itch, Android internal, iOS TestFlight; Cloud Diagnostics | `.github/workflows/**`, `Editor/BuildScript.cs` | 2 | Public itch link works in Chrome + Safari; TestFlight build installs; one error logged via Diagnostics on intentional crash. |

---

## 18. Feature Recipes

### 18.1 Authentication (anonymous + Apple/Google link)

`Scripts/Net/AuthService.cs`:

```csharp
using System.Threading.Tasks;
using Unity.Services.Authentication;
using Unity.Services.Core;

public sealed class AuthService
{
    public bool IsSignedIn => AuthenticationService.Instance.IsSignedIn;
    public string PlayerId => AuthenticationService.Instance.PlayerId;

    public async Task SignInAnonymousAsync()
    {
        if (UnityServices.State != ServicesInitializationState.Initialized)
            await UnityServices.InitializeAsync();
        if (!AuthenticationService.Instance.IsSignedIn)
            await AuthenticationService.Instance.SignInAnonymouslyAsync();
    }

    public Task LinkAppleAsync(string idToken)
        => AuthenticationService.Instance.LinkWithAppleAsync(idToken);

    public Task LinkGoogleAsync(string idToken)
        => AuthenticationService.Instance.LinkWithGoogleAsync(idToken);
}
```

### 18.2 Save (local + Cloud Save)

`Scripts/Net/SaveService.cs`:

```csharp
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Unity.Services.CloudSave;
using UnityEngine;

[System.Serializable] public class PlayerSaveData { public int version = 1; public int highScore; }

public sealed class SaveService
{
    private string LocalPath => Path.Combine(Application.persistentDataPath, "save.json");

    public PlayerSaveData LoadLocal()
    {
        if (!File.Exists(LocalPath)) return new PlayerSaveData();
        return JsonUtility.FromJson<PlayerSaveData>(File.ReadAllText(LocalPath));
    }

    public void SaveLocal(PlayerSaveData d)
        => File.WriteAllText(LocalPath, JsonUtility.ToJson(d));

    public async Task SaveCloudAsync(PlayerSaveData d)
    {
        var data = new Dictionary<string, object> { { "save", JsonUtility.ToJson(d) } };
        await CloudSaveService.Instance.Data.Player.SaveAsync(data);
    }

    public async Task<PlayerSaveData> LoadCloudAsync()
    {
        var keys = new HashSet<string> { "save" };
        var result = await CloudSaveService.Instance.Data.Player.LoadAsync(keys);
        if (!result.TryGetValue("save", out var v)) return new PlayerSaveData();
        return JsonUtility.FromJson<PlayerSaveData>(v.Value.GetAsString());
    }
}
```

### 18.3 Addressables Load

```csharp
using UnityEngine;
using UnityEngine.AddressableAssets;
using UnityEngine.ResourceManagement.AsyncOperations;

public class EnemySpawner : MonoBehaviour
{
    [SerializeField] private AssetReferenceGameObject enemyRef;
    private AsyncOperationHandle<GameObject> _handle;

    public async void Spawn(Vector3 at)
    {
        _handle = enemyRef.InstantiateAsync(at, Quaternion.identity);
        await _handle.Task;
    }

    private void OnDestroy()
    {
        if (_handle.IsValid()) Addressables.ReleaseInstance(_handle);
    }
}
```

### 18.4 New Input System Setup

1. Edit → Project Settings → Player → Other Settings → Active Input Handling = **Input System Package (New)**.
2. Create `Assets/_Project/Settings/InputActions.inputactions`. Add Action Map "Player" with actions Move (Vector2), Fire (Button).
3. Generate C# class via inspector → Generate C# Class.
4. Add `PlayerInput` component to player prefab; assign actions asset; Behaviour = "Send Messages" → handler in C#:

```csharp
using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    [SerializeField] private float speed = 5f;
    [SerializeField] private Rigidbody2D rb;
    private Vector2 _input;

    public void OnMove(InputValue v) => _input = v.Get<Vector2>();
    public void OnFire(InputValue _)  { /* fire */ }

    private void FixedUpdate()
        => rb.MovePosition(rb.position + _input * (speed * Time.fixedDeltaTime));
}
```

### 18.5 Realtime via Lobby + Relay

Use the Multiplayer Services SDK. For 2D top-down sample we don't ship multiplayer, but the wrapper sits at `Scripts/Net/LobbyService.cs` and follows UGS docs.

### 18.6 Analytics Event

```csharp
using Unity.Services.Analytics;

public static class GameAnalytics
{
    public static void LevelComplete(string level, float seconds)
        => AnalyticsService.Instance.RecordEvent(new CustomEvent("level_complete")
        {
            { "level", level },
            { "seconds", seconds }
        });
}
```

### 18.7 IAP / Mobile Payments

Unity IAP package (`com.unity.purchasing`). For a sample, defer until needed. Stub the abstraction:

```csharp
public interface IIapService { Task<bool> PurchaseAsync(string sku); }
```

### 18.8 Push Notifications

Use UGS Player Engagement → Push (mobile). Local notifications via `com.unity.mobile.notifications` package.

### 18.9 Dark Mode (UI Toolkit)

Two `theme.tss` files (light/dark) in `Assets/UI/Themes/`. Swap at runtime via `panelSettings.themeStyleSheet`.

### 18.10 Internationalization

`com.unity.localization` package. String tables in `Assets/_Project/Localization/`; bind UXML labels to keys.

---

## 19. Troubleshooting (top errors)

| Error | Fix |
|---|---|
| `error CS0246: type 'XYZ' could not be found` | Missing `using` or asmdef reference. Add reference in inspector for affected `*.asmdef`. |
| `IL2CPP: System.Reflection.Emit not supported` | Replace `Emit`-based code (e.g. some IoC libs) with hand-rolled or AOT-friendly alternative. |
| Pink/magenta materials in build | Shader stripped. Add to URP Asset → "Always Included Shaders" or include via Resources. |
| `Could not produce class with ID 1953259947` | Asset GUID mismatch from missing meta file. Restore meta from git or re-import. |
| `Library/PackageCache` keeps re-importing | `.gitignore` is committing it; remove `Library/` from repo. |
| `Apple Mach-O Linker Error: _OBJC_CLASS_$_FBSDKApplicationDelegate` | Native dependency mismatch; clean Build folder, re-export iOS, run `pod install`. |
| `gradle build failed: Could not find com.android.tools.build:gradle` | Update Gradle in Project Settings → Player → Android → Publishing Settings → Custom Gradle Template. |
| `Build size exceeds expansion file limit` (Android) | Use Asset Bundles via Addressables remote group. |
| `WebGL: incorrect MIME type` | Server must send `application/wasm` for `.wasm`, `application/octet-stream` for `.data`. |
| `UnityEditor.* is not available in the build` | Wrap in `#if UNITY_EDITOR ... #endif` or move to `Editor/` folder. |
| `Cannot find scene <name>` | Add scene to File → Build Settings → Scenes In Build. |
| `Object reference not set to an instance of an object` on Awake | A `[SerializeField]` reference in the Inspector is missing — assign it in the prefab/scene. |
| `Failed to import package: cannot read scoped registry` | Bad URL in `manifest.json` → `scopedRegistries`. Fix URL. |
| `XCode: code signing required` | Open generated Xcode project; Signing & Capabilities → set Team. Don't check signed builds into git. |
| `Test Runner shows no tests` | Tests need their own asmdef referencing `nunit.framework.dll`. |
| `Coroutine continues after Stop` | Use `CancellationTokenSource` linked to MonoBehaviour `destroyCancellationToken`. |
| `EmscriptenException: out of memory` (WebGL build) | Increase WebGL memory size in Player Settings; ensure no debug symbols. |
| `Addressables: InvalidKey` at runtime | Build Addressables content (Addressables Groups → Build → New Build → Default Build Script) before player build. |
| `Burst: AOT compilation failed` | Update Burst package; ensure platform support module installed. |
| `iOS: Bitcode no longer supported` | Player Settings → iOS → Disable Bitcode (Apple removed support). |
| `Android: API level mismatch` | Player Settings → Android → set Target API to 34+. |
| `Failed to resolve dependency com.google.gms` | Use the External Dependency Manager (EDM4U) and re-resolve. |
| `Plugin missing in build` | Plugin importer settings → enable for that platform. |
| `License activation failed (CI)` | Refresh `UNITY_LICENSE` GitHub secret with current `Unity_v...alf` content. |
| `Editor freezes on Play` | Infinite loop in `OnValidate` or static constructor. Open `Logs/AssetImportWorker0.log`. |
| `Domain Reload too slow` | Enable Edit → Project Settings → Editor → Enter Play Mode Settings → disable Domain Reload (only if your code resets static state explicitly). |
| `Build Player failed: 0 errors` | Open Console; the real error is hidden in `Logs/Editor.log`. |
| `Unable to load mono assembly` (iOS) | Conflict between Mono and IL2CPP. iOS must use IL2CPP (Mono is not allowed by Apple). |
| `Could not connect to Cloud Diagnostics` | Diagnostics requires a UGS project linked in Edit → Project Settings → Services. |
| `Render pipeline asset missing` | Edit → Project Settings → Graphics → Scriptable Render Pipeline Settings → assign URP asset. |

---

## 20. Glossary (plain English)

- **Addressables**: Asset loading system that loads things by name without needing a direct reference; lets you ship updates without re-publishing the whole app.
- **Asmdef (Assembly Definition)**: A file that groups your scripts into a separate compiled chunk, so changes only recompile that chunk.
- **Awake**: Unity callback that runs once when an object is first created, before anything else.
- **Burst**: Unity compiler that turns C# job code into very fast machine code.
- **Coroutine**: A function paused and resumed across frames using `yield`.
- **EditMode test**: A test that runs without entering Play mode — fast, no scene loads.
- **FixedUpdate**: A Unity callback that runs at a fixed time step, used for physics.
- **GameObject**: A "thing" in the scene, like a player or a wall. Components attach to it.
- **IL2CPP**: Unity's tool that converts C# into C++ then native machine code, required for iOS and WebGL.
- **Inspector**: The Editor panel showing a GameObject's components and their values.
- **LFS (Large File Storage)**: Git extension that stores big binary files outside the repo to keep clones small.
- **MonoBehaviour**: A C# class you attach to a GameObject so Unity calls its lifecycle methods.
- **PlayMode test**: A test that enters Play mode and runs over real frames.
- **Prefab**: A reusable template for a GameObject. Edit once, all instances update.
- **Profiler**: Tool that measures CPU, GPU, memory while the game runs.
- **Scene**: One "level" or "screen" in your game. Loaded individually or additively.
- **ScriptableObject**: An asset that holds data but isn't attached to a GameObject — like a config file you can edit in the Inspector.
- **SerializeField**: Attribute that exposes a private field in the Inspector without making it public.
- **UGS (Unity Gaming Services)**: Unity's cloud bundle: Auth, Cloud Save, Lobby, Relay, Analytics, Build Automation, Cloud Diagnostics.
- **Unity Hub**: The launcher that installs Editor versions and opens projects.
- **UPM (Unity Package Manager)**: Installs and updates packages — like npm for Unity.
- **URP (Universal Render Pipeline)**: Unity's render pipeline tuned for performance across mobile, web, and consoles.
- **UXML / USS**: HTML/CSS-style files for UI Toolkit (Unity's modern UI system).
- **WebGL**: Browser build target — runs your game in a webpage.

---

## 21. Update Cadence

This rulebook is valid for **Unity 6.3 LTS (`6000.3.x`)** through **6.6 LTS** (expected late 2026). It is also valid for the Supported Update train (`6000.4.x`) until 6.5 LTS ships.

Re-run the rulebook generator when:
- Unity ships a new LTS (`6000.5`, `6000.7`, etc.).
- URP majors (a `18.x` release with a new pipeline asset format).
- Input System majors (`2.x`).
- Addressables majors (`3.x`).
- Apple changes signing/notarization rules (annual at WWDC).
- Google bumps target API requirements.
- A security advisory is filed on any package in §16.4.

**Last verified: 2026-04-27.**
