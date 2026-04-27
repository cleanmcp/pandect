# Godot 4 + GDScript Rulebook

Cross-platform 2D/3D game engine. Single binary, scene tree, GDScript-first. Ships to desktop, web, and mobile from one project.

> Generated 2026-04-27. Pinned to Godot 4.6.2 (stable, April 2026 maintenance release).

---

## 1. Snapshot

### Decisions

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Engine | Godot 4.6.2 | Latest stable; April 2026 maintenance fixes |
| Language | GDScript 2.0 | Smaller exports, faster iteration than C# |
| Renderer (desktop) | Forward+ | Best lighting, modern GPUs, default |
| Renderer (web) | Compatibility | Only renderer that supports HTML5 export |
| Renderer (mobile) | Mobile | Single-pass lighting tuned for phones |
| Package manager | Godot Asset Library + git submodules | Native, no npm equivalent |
| Build tool | Godot CLI (`--export-release`) | Built into the editor binary |
| State mgmt | Autoload (singleton) + signals | Engine-native, no third-party libs |
| Routing/Nav | SceneTree.change_scene_to_packed | Built-in scene swap |
| Data layer | Custom Resource + ResourceSaver | Type-safe, native serialization |
| Auth | Godot HTTPRequest + JWT in user:// | Stateless, no SDK weight |
| Styling (UI) | Theme resource + control nodes | Engine-native, edits in inspector |
| Forms + validation | LineEdit + custom Resource validators | No external form lib needed |
| Unit test runner | gdUnit4 v6.x | Cleaner integration, mocking, CI-ready |
| E2E framework | gdUnit4 scene tests | Same runner, scene-level assertions |
| Mocking strategy | gdUnit4 mocks at adapter boundary | Never mock SceneTree or filesystem |
| Logger | print_rich + custom Logger autoload | Built-in; tagged levels |
| Error tracking | Sentry SDK for Godot 4 | Official-grade community plugin |
| Lint + format | gdtoolkit 4.x (gdformat + gdlint) | De-facto Godot toolchain |
| Type checking | GDScript static typing + `gdlint` | Compiler enforces with type hints |
| Env vars + secrets | OS.get_environment + .env (gitignored) | No build-time injection needed |
| CI provider | GitHub Actions + barichello/godot-ci:4.6 | Free tier, official Docker image |
| Deploy target | itch.io (web/desktop) + Steam (desktop) | Lowest friction, no review gate |
| Release flow | godot --headless --export-release per preset | Scriptable, deterministic |
| Auto-update | Steam/itch.io app updates | Platform handles patching |
| Save format | Resource (.res binary) via ResourceSaver | Type-safe, fast, native |
| Autoload policy | Only for cross-scene state + event bus | Avoid global mutable state otherwise |
| Signal vs direct call | Signals across boundaries; direct within scene | Reduces coupling between systems |
| Thread policy | WorkerThreadPool for heavy work | Never block `_process` |
| Web hosting | itch.io with SharedArrayBuffer enabled | Built-in COOP/COEP headers |

### Versions

| Component | Version | Released | Source |
|---|---|---|---|
| Godot Engine | 4.6.2 | 2026-04 | https://godotengine.org/article/maintenance-release-godot-4-6-2/ |
| GDScript | 2.0 (bundled with engine) | 2026-04 | bundled |
| gdtoolkit | 4.5.0 | 2025-Q4 | https://pypi.org/project/gdtoolkit/ |
| gdUnit4 | 6.x | 2025-Q4 | https://github.com/godot-gdunit-labs/gdUnit4 |
| barichello/godot-ci | 4.6 | 2026 | https://hub.docker.com/r/barichello/godot-ci |
| Python (gdtoolkit host) | 3.11+ | n/a | python.org |

### Minimum host requirements

- macOS 11+ (Apple Silicon native), Windows 10+ x64, Ubuntu 22.04+ x64.
- 8 GB RAM (16 GB for 3D), 4 GB free disk.
- GPU: Vulkan 1.0 (Forward+/Mobile) or OpenGL 3.3 (Compatibility).

### Cold-start estimate

Fresh machine to running editor + sample scene: 12-20 minutes (download is the long pole; editor is a 75 MB single binary).

---

## 2. Zero-to-running (Setup)

### macOS

```
# 1. Install prerequisites
xcode-select --install
brew install --cask godot
brew install python@3.11 git git-lfs
git lfs install

# 2. Install gdtoolkit
pipx install "gdtoolkit==4.5.*"

# 3. Verify
godot --version
# Expected: 4.6.2.stable.official.<hash>

gdformat --version
# Expected: gdformat 4.5.x

# 4. Sign up
# - Apple Developer: https://developer.apple.com/programs/  ($99/yr, needed for macOS notarization)
# - itch.io: https://itch.io/register (free, deploy target)
# - GitHub: https://github.com/join (free, CI)

# 5. CLI auth
gh auth login
# Choose: GitHub.com -> HTTPS -> Y -> Login with web browser

# 6. Bootstrap project
mkdir my-game && cd my-game
godot --headless --quit  # creates .godot/ folder
git init && git lfs install
```

### Windows (PowerShell)

```
# 1. Install prerequisites
winget install -e --id GodotEngine.GodotEngine
winget install -e --id Python.Python.3.11
winget install -e --id Git.Git
winget install -e --id GitHub.GitLFS
winget install -e --id GitHub.cli
git lfs install

# 2. Install gdtoolkit
python -m pip install --user pipx
python -m pipx ensurepath
pipx install "gdtoolkit==4.5.*"

# 3. Verify
godot --version
# Expected: 4.6.2.stable.official.<hash>

# 4. CLI auth
gh auth login

# 5. Bootstrap
mkdir my-game; cd my-game
godot --headless --quit
git init
```

### Linux (Ubuntu/Debian)

```
# 1. Prerequisites
sudo apt update
sudo apt install -y python3.11 python3-pip pipx git git-lfs
git lfs install
pipx ensurepath

# 2. Godot binary (official)
wget https://github.com/godotengine/godot-builds/releases/download/4.6.2-stable/Godot_v4.6.2-stable_linux.x86_64.zip
unzip Godot_v4.6.2-stable_linux.x86_64.zip
sudo mv Godot_v4.6.2-stable_linux.x86_64 /usr/local/bin/godot
sudo chmod +x /usr/local/bin/godot

# 3. gdtoolkit
pipx install "gdtoolkit==4.5.*"

# 4. Verify
godot --version
gdformat --version

# 5. GitHub CLI
sudo apt install -y gh
gh auth login

# 6. Bootstrap
mkdir my-game && cd my-game
godot --headless --quit
git init
```

### Export templates (all OS)

```
# Inside Godot editor: Editor → Manage Export Templates → Download and Install
# Or via CLI:
godot --headless --install-export-templates
# Templates land at:
#   macOS:   ~/Library/Application Support/Godot/export_templates/4.6.2.stable/
#   Linux:   ~/.local/share/godot/export_templates/4.6.2.stable/
#   Windows: %APPDATA%/Godot/export_templates/4.6.2.stable/
```

### Expected first-run output

```
$ godot --version
4.6.2.stable.official.de2f0f147

$ godot --headless --quit
Godot Engine v4.6.2.stable.official.de2f0f147 - https://godotengine.org
Vulkan 1.3.250 - Forward+ - Using Device #0: ...
```

### Common first-run errors

| Error | Fix |
|---|---|
| `command not found: godot` (macOS Cask installs `godot` symlink) | `ln -s /Applications/Godot.app/Contents/MacOS/Godot /usr/local/bin/godot` |
| `Vulkan not supported` on old GPU | Project Settings → Rendering → Renderer → switch to Compatibility |
| `Export templates not found` | `godot --headless --install-export-templates` |
| `gdformat: command not found` after pipx install | `pipx ensurepath` then restart shell |
| Web export blank screen, console: `SharedArrayBuffer is not defined` | Host on itch.io with SharedArrayBuffer toggle on, or export as PWA |

---

## 3. Project Layout

```
my-game/
├── .github/
│   └── workflows/
│       └── build.yml           # CI export to Windows/macOS/Linux/Web
├── .godot/                     # generated, gitignored
├── addons/
│   ├── gdUnit4/                # test framework (committed via submodule)
│   └── gdtoolkit/              # optional editor integration
├── assets/
│   ├── art/                    # sprites, textures (.png, .svg) → LFS
│   ├── audio/                  # .ogg, .wav → LFS
│   ├── fonts/
│   └── data/                   # .tres custom Resources
├── scenes/
│   ├── main/
│   │   ├── main.tscn
│   │   └── main.gd
│   ├── player/
│   │   ├── player.tscn
│   │   └── player.gd
│   ├── enemies/
│   ├── ui/
│   └── levels/
├── scripts/
│   ├── autoloads/
│   │   ├── game_state.gd       # cross-scene state singleton
│   │   ├── event_bus.gd        # signal-only autoload
│   │   ├── audio.gd            # AudioStreamPlayer manager
│   │   └── logger.gd
│   ├── resources/
│   │   ├── player_data.gd      # extends Resource
│   │   └── level_data.gd
│   └── systems/
│       ├── save_system.gd
│       └── input_map.gd
├── tests/
│   ├── unit/
│   │   └── test_player.gd
│   └── integration/
│       └── test_save_system.gd
├── export_presets.cfg          # committed
├── project.godot               # committed
├── icon.svg
├── .gitignore
├── .gitattributes
├── CLAUDE.md
├── AGENTS.md
├── .cursor/rules
├── .vscode/extensions.json
├── .vscode/launch.json
└── README.md
```

### Naming conventions

- Files: `snake_case.gd`, `snake_case.tscn`, `snake_case.tres`.
- Classes (`class_name`): `PascalCase` (only when reused across scripts; not on every script).
- Variables, functions: `snake_case`.
- Constants, enums: `SCREAMING_SNAKE_CASE`.
- Private members: `_leading_underscore`.
- Signals: `snake_case`, past tense for events (`health_changed`, `enemy_died`).
- Nodes in scene tree: `PascalCase` (`Player`, `MainMenu`).

### Where things go

| Adding | Goes in |
|---|---|
| New player ability | `scripts/systems/abilities/<name>.gd` + scene in `scenes/player/abilities/` |
| New enemy type | `scenes/enemies/<name>.tscn` + `<name>.gd` |
| Cross-scene state | `scripts/autoloads/game_state.gd` (autoloaded) |
| One-shot UI animation | `Tween` created inline in script — not a node |
| Save data structure | `scripts/resources/<name>_data.gd` extending `Resource` |
| Global event signal | `scripts/autoloads/event_bus.gd` |
| Reusable UI widget | `scenes/ui/widgets/<name>.tscn` |
| Sprite asset | `assets/art/<category>/<name>.png` (Git LFS) |
| Sound effect | `assets/audio/sfx/<name>.ogg` (Git LFS) |
| Localization string | `assets/data/i18n/strings.csv` |
| Custom shader | `assets/shaders/<name>.gdshader` |
| Particle effect | `scenes/effects/<name>.tscn` (GPUParticles2D) |
| Test for system | `tests/unit/test_<name>.gd` (extends GdUnitTestSuite) |
| Game config constant | `scripts/resources/game_config.gd` (const-only) |
| Editor tool | `tools/<name>.gd` with `@tool` annotation |
| Input action | Project Settings → Input Map (committed in `project.godot`) |

---

## 4. Architecture

### Scene tree boundaries

```
SceneTree (root)
 ├─ Autoloads (always present)
 │   ├─ Logger
 │   ├─ EventBus       (signals only, no state)
 │   ├─ GameState      (player progress, settings)
 │   ├─ Audio          (music + SFX players)
 │   └─ SaveSystem
 └─ Current scene (swapped via change_scene_to_packed)
     ├─ Main
     ├─ Player
     │   ├─ AnimatedSprite2D
     │   ├─ CollisionShape2D
     │   └─ Camera2D
     ├─ Enemies (Node2D group)
     ├─ Level (TileMap)
     └─ UI (CanvasLayer)
         ├─ HUD
         └─ PauseMenu
```

### Data flow (typical input → render frame)

```
Input event → SceneTree → Player._unhandled_input
   → Player updates velocity (state)
   → CharacterBody2D.move_and_slide() in _physics_process
   → Player emits "moved" signal on EventBus
   → HUD listens → updates position label
   → RenderingServer composites frame
```

### Auth flow (network game)

```
Title screen → LoginScene
   → HTTPRequest POST /auth/login (email, password)
   → Server returns JWT
   → SaveSystem.store_token(jwt)  → user://auth.dat (encrypted)
   → EventBus.emit("authenticated", user_id)
   → GameState.user_id = user_id
   → change_scene_to_packed(MainMenu)
```

### State management flow

```
User action → Scene script
   → Mutates GameState autoload via setter
   → GameState emits "<field>_changed" signal
   → Listening UI nodes update display
   → SaveSystem queues debounced save_to_disk()
```

### Entry-point files

- `project.godot` — engine config, autoloads, input map, renderer choice.
- `scenes/main/main.tscn` — first scene loaded (set in project settings `run/main_scene`).
- `scripts/autoloads/*.gd` — load before any scene.

### Where business logic lives

- **Lives in:** `scripts/systems/`, `scripts/resources/` (pure data + methods on Resources), individual scene scripts.
- **Does NOT live in:** Autoloads (state-only), `_process`/`_physics_process` (those drive simulation, not business rules), UI scripts (UI reflects state, doesn't compute it).

---

## 5. Dev Workflow

### Start dev session

```
godot project.godot
# Or from CLI without GUI:
godot --path . --headless
```

The editor watches:
- Script files (auto-reloaded into running game on save).
- Scene/resource files (re-imported on focus).
- Imported assets (`.import/` cache rebuilt on first edit).

Hot reload breaks when: changing autoloaded scripts (restart required), changing class_name (re-parse all scripts), modifying `project.godot` (restart).

### Debugger attach

- **Editor (built-in):** Press F5 to run, breakpoints in script editor work natively.
- **VS Code / Cursor:** Install `geequlim.godot-tools` extension, set Godot path in settings, use `.vscode/launch.json` (provided in section 15).
- **Remote inspect:** Editor → Debugger panel → live scene tree, variables, profiler, network monitor.

### Pre-commit checks

```
gdformat scripts/ scenes/ tests/
gdlint scripts/ tests/
godot --headless --quit --check-only --path .
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue
```

### Branch + commit conventions

- Branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits: imperative, ≤72 char subject. Conventional Commits style.
- Never commit `.godot/`, `export_credentials.cfg`, `.import/`, `*.translation` (compiled).

---

## 6. Testing & Parallelization

### Unit tests

```
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/unit/ --continue
```

Test file `tests/unit/test_player.gd`:

```gdscript
extends GdUnitTestSuite

const Player := preload("res://scenes/player/player.gd")

func test_player_takes_damage() -> void:
    var p := Player.new()
    p.health = 100
    p.take_damage(25)
    assert_int(p.health).is_equal(75)
    p.queue_free()

func test_zero_damage_no_change() -> void:
    var p := Player.new()
    p.health = 50
    p.take_damage(0)
    assert_int(p.health).is_equal(50)
    p.queue_free()
```

### Integration / scene tests

```
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/integration/ --continue
```

Scene test: load `.tscn`, await ready, drive inputs, assert state.

### Single test / file / watch

- Single file: `--add tests/unit/test_player.gd`
- Single test: in editor, gdUnit4 panel → click test → Run.
- Watch: gdUnit4 has no built-in watch; rerun on save via VS Code task.

### Mocking rules

- **Mock:** HTTP responses (mock the adapter, not `HTTPRequest`), random number sources, time.
- **Never mock:** `SceneTree`, `Node`, `ResourceLoader`, save filesystem (`user://`), input events (use `Input.parse_input_event`).

### Coverage

Coverage is not built in. Use `godot-code-coverage` addon (community port). Target: 70% on `scripts/systems/` and `scripts/resources/`. Scene scripts excluded.

### Visual regression

Out of scope for this rulebook. If needed, capture `Viewport.get_texture()` to PNG and diff with `compare` from ImageMagick in CI.

### Parallelization patterns for AI agents

**Safe to fan out (disjoint files):**
- Scaffold a new enemy scene + script + test (3 files in 3 dirs).
- Add 5 unrelated UI screens.
- Generate 10 dialogue Resources from a CSV.

**Must be sequential (shared file):**
- Anything modifying `project.godot` (autoloads, input map, settings).
- Anything modifying `export_presets.cfg`.
- Adding new `class_name` declarations (full re-parse).
- Migrating a Resource schema (loaders touch all instances).

---

## 7. Logging

### Logger autoload (`scripts/autoloads/logger.gd`)

```gdscript
extends Node

enum Level { DEBUG, INFO, WARN, ERROR }

@export var min_level: Level = Level.INFO
var _session_id: String = ""

func _ready() -> void:
    _session_id = "%d_%d" % [Time.get_unix_time_from_system(), randi()]
    info("logger.boot", {"session_id": _session_id, "version": ProjectSettings.get_setting("application/config/version", "0.0.0")})

func debug(event: String, fields: Dictionary = {}) -> void: _emit(Level.DEBUG, event, fields)
func info(event: String, fields: Dictionary = {}) -> void:  _emit(Level.INFO, event, fields)
func warn(event: String, fields: Dictionary = {}) -> void:  _emit(Level.WARN, event, fields)
func error(event: String, fields: Dictionary = {}) -> void: _emit(Level.ERROR, event, fields)

func _emit(lvl: Level, event: String, fields: Dictionary) -> void:
    if lvl < min_level: return
    var line := {"ts": Time.get_datetime_string_from_system(true), "lvl": Level.keys()[lvl], "event": event, "session": _session_id}
    line.merge(fields)
    print(JSON.stringify(line))
```

Register in `project.godot` autoloads as `Logger`.

### Levels

- `DEBUG` — local-only signal tracing.
- `INFO` — boot, scene change, save, user input milestones.
- `WARN` — recoverable (asset missing, network timeout retried).
- `ERROR` — unexpected; capture to error tracker.

### Required fields per log line

`ts`, `lvl`, `event`, `session`. Plus `scene` and `node_path` when emitted from a node.

### Sample lines

```json
{"ts":"2026-04-27T12:00:00","lvl":"INFO","event":"app.boot","session":"...","version":"0.1.0"}
{"ts":"...","lvl":"INFO","event":"scene.change","from":"main_menu","to":"level_1"}
{"ts":"...","lvl":"WARN","event":"asset.missing","path":"res://assets/art/missing.png"}
{"ts":"...","lvl":"ERROR","event":"save.failed","path":"user://save.res","error":"err 7"}
{"ts":"...","lvl":"INFO","event":"input.action","action":"jump","scene":"level_1"}
```

### Where logs go

- **Dev:** stdout (editor Output panel).
- **Prod:** `user://logs/game.log` rotated weekly. Errors also pushed to Sentry via the Sentry SDK for Godot.

### Grep locally

```
# macOS / Linux
tail -f ~/Library/Application\ Support/Godot/app_userdata/MyGame/logs/game.log | grep '"lvl":"ERROR"'
# Windows (PowerShell)
Get-Content "$env:APPDATA\Godot\app_userdata\MyGame\logs\game.log" -Wait | Select-String '"lvl":"ERROR"'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `godot --headless --quit --check-only --path .` before declaring a script change done — it parses every script.
2. Always run `gdlint scripts/ tests/` and `gdformat --check scripts/ tests/` before commit.
3. Always run gdUnit4 suite: `godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue`.
4. Always declare types on every variable, parameter, and return: `var x: int`, `func f(a: String) -> bool:`.
5. Always disconnect signals in `_exit_tree()` if the listener can outlive the emitter.
6. Always `queue_free()` instead of `free()` for nodes inside the scene tree.
7. Always use `await` for one-frame waits and signal awaiting; never busy-loop.
8. Always create Tweens with `create_tween()` inside the scene that owns them — never as an autoload field.
9. Always use `WorkerThreadPool.add_task()` for work >2 ms; never run heavy logic inside `_process`.
10. Always store cross-scene state in autoloads, never in `static var` on regular scripts.
11. Always read save data through `SaveSystem` autoload; never call `ResourceLoader.load("user://...")` from scenes.
12. Always validate user-modifiable Resources after load — saves can be tampered with.
13. Always use `Input.is_action_pressed("action_name")` with input map actions, never raw key codes.
14. Always preload scenes used at startup (`const Foo = preload(...)`); load on-demand scenes with `ResourceLoader.load_threaded_request`.
15. Always set `process_mode = PROCESS_MODE_PAUSABLE` (default) on gameplay nodes and `PROCESS_MODE_ALWAYS` on pause menu only.
16. Always emit signals via the EventBus autoload for cross-scene events; direct connections within a scene.
17. Always test with `--headless` before committing — catches `null` access in `_ready` that the editor masks.
18. Always pin the Godot version in CI to match `project.godot`'s `config/features` line.
19. Always commit `export_presets.cfg`; never commit `.godot/export_credentials.cfg`.
20. Always set explicit z_index on overlapping 2D nodes — relying on tree order is fragile.
21. Always use Compatibility renderer for the Web export preset; Forward+ does not run in browsers.
22. Always check `is_instance_valid(node)` before touching a node reference held across frames.
23. Always run `godot --headless --export-release "Web" build/web/index.html` to verify export works after touching `export_presets.cfg`.

### 8.2 NEVER

1. Never put `class_name` on every script. Only on classes referenced by name from other scripts.
2. Never connect a signal without a corresponding `disconnect` if the connection isn't lifetime-bound (use `CONNECT_ONE_SHOT` or `Object.connect(..., CONNECT_REFERENCE_COUNTED)` when applicable).
3. Never call `set_process(false)` then forget to re-enable — leads to "frozen" bugs.
4. Never block the main thread with `OS.delay_msec`; await a Timer or use threads.
5. Never `add_child` to a node before `_ready` of the parent has run; queue with `call_deferred("add_child", x)`.
6. Never store a reference to a freed node — check `is_instance_valid` first.
7. Never use `get_node("../../Foo")` paths spanning >2 levels; pass references via `@export` or signals.
8. Never write to `res://` at runtime — read-only in exported builds.
9. Never put gameplay logic inside `@tool` scripts unless guarded by `if Engine.is_editor_hint()`.
10. Never use Godot's built-in encryption flag as your only save protection — it's reversible.
11. Never mix `_process` (frame-rate dependent) and `_physics_process` (fixed-step) for the same value — pick one.
12. Never call `change_scene_to_file` from within `_ready` of the new scene — deferred swap only.
13. Never rely on `print` for production logging; use the Logger autoload.
14. Never commit `.import/` or `.godot/imported/` — they regenerate.
15. Never use Forward+ for the Web export; it will fail to start.
16. Never ship a build without testing `--headless --export-release` in CI.
17. Never name a variable the same as a built-in (`position`, `name`, `scale`) on a script that doesn't extend a node providing it.
18. Never use `assert(...)` for runtime validation — asserts are stripped from release builds. Use `if`+`push_error`.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `project.godot` | every scene, every autoload, all input | `godot --headless --quit --check-only` + boot main scene |
| `export_presets.cfg` | every CI export | `godot --headless --export-release "Linux/X11" /tmp/test` for each preset |
| `scripts/autoloads/*.gd` | every scene at runtime | full test suite + manual smoke of main scene |
| `scripts/autoloads/event_bus.gd` | any subscriber across the game | grep all `EventBus.connect` and `.emit` for signal name; full suite |
| `scripts/resources/*.gd` (with `class_name`) | every saved `.tres`/`.res` instance | re-import all data resources + load saves test |
| `scenes/main/main.tscn` | first run | boot game and verify no errors in 5 s |
| `scenes/player/player.tscn` | every level using player | run all level scenes, smoke movement |
| `assets/art/**` | scene rendering | re-import (Editor → Reimport All) + visual smoke |
| `addons/gdUnit4/**` | every test | re-run full test suite |
| `.github/workflows/build.yml` | every release | trigger workflow on a throwaway branch |
| `icon.svg` | export icon, taskbar | re-export per platform, inspect bundle |
| `assets/data/i18n/strings.csv` | every `tr()` call | run game in each locale, scan UI |
| Theme resources (`*.tres` in `assets/data/theme/`) | every Control node | smoke main menu + HUD + pause |
| Input map (in `project.godot`) | every `Input.is_action_*` call | grep callers + manual play |
| `scripts/systems/save_system.gd` | every saved game | save/load round-trip test, migration test |
| `scripts/systems/audio.gd` | every SFX call | smoke a scene with sounds + music |
| Tilemap source assets | every level scene | reload each level, check collisions |
| Custom shaders (`*.gdshader`) | nodes using them | render frame compare on smoke scene |
| `addons/sentry/**` | error reporting | trigger a `push_error` and confirm Sentry receipt |
| `CLAUDE.md`, `AGENTS.md`, `.cursor/rules` | AI behavior | re-read by agent, no policy regression |
| `.gitattributes` (LFS rules) | binary asset storage | `git lfs ls-files` matches expected list |
| `gdUnit4` config (`addons/gdUnit4/runtime/config/`) | test discovery | run full suite, confirm test count unchanged |

### 8.4 Definition of Done (per task type)

**Bug fix**
- Failing test added that reproduces the bug.
- Fix passes that test + full suite.
- `gdformat --check` and `gdlint` clean.
- Manual repro steps in commit message.
- Screenshot or log line evidence captured.
- Do NOT: add unrelated refactors.

**New feature**
- Resource/data model in `scripts/resources/` with type-safe `@export` fields.
- Scene + script in `scenes/<area>/`.
- Test file in `tests/unit/` covering the public surface.
- Added to scene tree via main flow or autoload.
- `godot --headless --quit --check-only` clean.
- Export smoke for one platform completes.
- Do NOT: add a new autoload unless cross-scene state is required.

**Refactor**
- No behavior change.
- Test suite green before AND after.
- Diff-only review — no new features bundled.
- Do NOT: rename `class_name` without updating every `preload`/`load` reference.

**Dependency bump (addon)**
- Update submodule, commit lockstep.
- Run full suite.
- Run an export to confirm no missing-file errors.
- Note version delta in commit body.

**Resource schema change**
- Migration script in `scripts/systems/migrations/`.
- Old saves load through migration; test added.
- Bump `application/config/version` in `project.godot`.
- Do NOT: silently drop fields — log and migrate.

**Copy / asset change**
- Re-import in editor.
- Smoke the scene that uses the asset.
- LFS-tracked if binary > 1 MB.

### 8.5 Self-Verification Recipe

```
# 1. Format check
gdformat --check scripts/ tests/

# 2. Lint
gdlint scripts/ tests/

# 3. Parse-check every script
godot --headless --quit --check-only --path .

# 4. Unit + integration tests
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue

# 5. Smoke export for the primary platform
godot --headless --path . --export-release "Linux/X11" build/linux/game.x86_64

# 6. Boot smoke (fail fast on _ready errors)
timeout 5 godot --headless --path . scenes/main/main.tscn || true
```

Expected output:
- Format: silent exit 0.
- Lint: `Success: no problems found`.
- Check-only: `Godot Engine v4.6.2.stable.official...` then exits 0.
- Tests: `Total: N | Passed: N | Failed: 0 | Errors: 0 | Skipped: 0`.
- Export: produces a binary at `build/linux/game.x86_64`.
- Boot smoke: starts and exits cleanly (no `ERROR:` lines in output).

### 8.6 Parallelization Patterns

**Fan-out safe (no shared file):**
- New enemy: spawn one agent for `scenes/enemies/slime.tscn`, one for `scripts/enemies/slime.gd`, one for `tests/unit/test_slime.gd`.
- Five unrelated UI screens, each in its own folder.
- Translating `strings.csv` into N locales (different columns).

**Sequential only:**
- Adding autoloads (writes to `project.godot`).
- Adding input map actions (writes to `project.godot`).
- Adding export presets (writes to `export_presets.cfg`).
- Schema changes that touch every saved Resource of a type.
- Adding new `class_name` declarations (parser cache).

---

## 9. Stack-Specific Pitfalls

1. **Tween is no longer a Node.** Symptom: `Attempt to connect nonexistent signal 'finished'` on a `$Tween` lookup. Cause: ported Godot 3 code. Fix: `var t := create_tween(); t.tween_property(...)`. Detect: editor warnings on parse.
2. **Heavy `_ready` work.** Symptom: black screen for seconds on scene change. Cause: synchronous asset load or signal connection storm. Fix: defer with `call_deferred` or `await get_tree().process_frame`. Detect: profile in editor → "Frame Time" spike on scene change.
3. **Forgotten signal disconnect on freed listener.** Symptom: `Attempt to call function on a previously freed instance.` Fix: `disconnect` in `_exit_tree`, or use `CONNECT_ONE_SHOT`. Detect: stack trace contains a freed object's `_method`.
4. **`class_name` collision.** Symptom: `Class "Foo" already exists.` Cause: two scripts with the same `class_name`. Fix: rename one. Detect: editor parse error.
5. **Autoload load order race.** Symptom: `null reference` in autoload `_ready`. Cause: autoload A reads autoload B before B's `_ready`. Fix: use `await get_tree().process_frame` or reorder autoloads in `project.godot`. Detect: error on first launch.
6. **Forward+ on web.** Symptom: web export shows blank canvas. Cause: Forward+ unsupported in browsers. Fix: `export_presets.cfg` `Web` preset must have Compatibility renderer. Detect: console: `Vulkan unavailable`.
7. **SharedArrayBuffer missing on web.** Symptom: `SharedArrayBuffer is not defined`. Fix: host on itch.io with the toggle, or export as PWA, or set `Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp` headers, or export with threads off (4.3+). Detect: browser console error.
8. **`@tool` script crash.** Symptom: editor freezes opening a scene. Cause: `@tool` script running gameplay code in editor. Fix: gate with `if Engine.is_editor_hint(): return`. Detect: editor crash log.
9. **Resource circular reference.** Symptom: ResourceSaver loops or stack overflows. Cause: Resource A references Resource B which references A. Fix: use `NodePath` or string ID instead of direct ref. Detect: save hangs.
10. **`_process` doing physics.** Symptom: jitter / non-determinism. Fix: move to `_physics_process` with fixed delta. Detect: visual stutter on slower machines.
11. **`get_node` over-coupling.** Symptom: scene breaks when restructured. Cause: `$"../../UI/HUD/Score"`. Fix: signals via EventBus, or `@export var hud: HUD`. Detect: any `..` more than once in a path.
12. **Forgotten export template.** Symptom: CI export fails with "No export template found". Fix: add `mv -t ~/.local/share/godot/export_templates/4.6.2.stable/ export_templates/*` step in CI. Detect: CI log.
13. **Releasing with debug enabled.** Symptom: dev console visible to players, slower runtime. Fix: `--export-release` (not `--export-debug`) in CI. Detect: F12 opens debug overlay.
14. **`assert` in production.** Symptom: validation silently passes. Cause: `assert(x > 0)` is a no-op in release. Fix: `if x <= 0: push_error("..."); return`. Detect: bug ships.
15. **TileMap performance cliff.** Symptom: FPS tanks on large maps. Fix: split into chunks, use `TileMapLayer` (4.3+), or convert decorative tiles to a static image. Detect: profiler shows `_draw` dominating.
16. **`load()` blocking on big resource.** Symptom: hitch on level transition. Fix: `ResourceLoader.load_threaded_request(path)` then poll. Detect: frame time spike.
17. **AnimatedSprite2D with too-large atlas.** Symptom: VRAM overrun on mobile. Fix: split spritesheet, use `Texture2DArray`. Detect: device OOM.
18. **Saving raw script paths.** Symptom: save file breaks after refactor. Fix: store data in pure `Resource` classes, not script-bound dicts. Detect: load returns null.

---

## 10. Performance Budgets

| Budget | Target | Measure |
|---|---|---|
| Cold start (desktop) | <3 s to first interactive frame | `time godot --path . scenes/main/main.tscn` |
| Cold start (web) | <8 s post-COI handshake | Browser DevTools Performance tab |
| Frame time | <16.6 ms (60 fps) desktop, <33 ms (30 fps) mobile | Editor Profiler → "Frame Time" |
| Bundle (desktop) | <100 MB compressed | `ls -lh build/<platform>/` |
| Bundle (web) | <40 MB total assets | `du -sh build/web/` |
| Memory (idle main menu) | <300 MB RSS | `Performance.get_monitor(Performance.MEMORY_STATIC)` |
| Memory (peak gameplay) | <800 MB | same + manual peak observation |
| Battery (mobile, 30 fps) | <8% per hour | iOS Xcode Energy, Android Battery Historian |
| Draw calls | <500 per frame | Editor Profiler → "Visible Draw Calls" |
| Physics | <2 ms per step | Profiler → "Physics 2D" |

When over budget: enable Forward+ "Use Half Resolution" for low-end, switch to Mobile renderer, atlas textures, batch sprites with `MultiMeshInstance2D`, profile and remove the dominant cost.

---

## 11. Security

### Secret storage

- **Never** in `res://` (read-only, shipped to player).
- **Never** in `project.godot`.
- **Yes:** `user://secrets.cfg` (per-user data dir, encrypted with `FileAccess.open_encrypted_with_pass`).
- **Yes:** OS keychain via `OS.get_environment` for dev (developer machine only).
- **CI secrets:** GitHub Actions repository secrets, surfaced as env vars during export only.

### Auth threat model

- Player owns their save file. Treat saves as untrusted input on load — validate ranges, reject negative health, reject unknown enum values.
- Server-side game state is authoritative for any networked play. Never trust client RPC payloads.

### Input validation boundary

- Network responses: parse via typed Resource constructors with explicit validation.
- Loaded saves: same — never blindly assign deserialized fields.

### Output escaping

- `tr("user_name", {"name": user_input})` — use BBCode-stripped variants for `RichTextLabel` (`text` not `bbcode_text`) when input is user-supplied.

### Capability config

- iOS: `Info.plist` permissions configured in export preset (camera, photos only if used).
- Android: `AndroidManifest.xml` permissions in export preset; default to none.
- Web: no special permissions; SharedArrayBuffer requires COOP/COEP headers (host-side).
- Desktop: codesigning required for macOS distribution (Apple Developer ID).

### Dependency audit

```
# Check addons for updates monthly
git submodule foreach 'git fetch && git log HEAD..origin/main --oneline'
```

### Top 5 risks

1. **Tampered save files** — encrypt with `FileAccess.open_encrypted_with_pass`, validate fields on load.
2. **Reverse-engineered API keys** in shipped binary — proxy through your own server; never embed third-party secrets.
3. **Web build XSS via custom HTML shell** — only use the official `web_export.html` template; sanitize injected variables.
4. **Unsigned macOS build blocked by Gatekeeper** — codesign and notarize per section 12.
5. **`@tool` script with shell exec** — never call `OS.execute` in editor scripts; AI agents have written self-modifying tools that run at editor open.

---

## 12. Deploy

### Release flow (per platform, manual)

```
# 1. Bump version
# Edit project.godot: application/config/version="0.2.0"

# 2. Tag
git commit -am "release: 0.2.0"
git tag v0.2.0
git push --tags

# 3. CI builds (see .github/workflows/build.yml below)

# 4. Manual builds (if not via CI)
godot --headless --path . --export-release "Windows Desktop" build/windows/game.exe
godot --headless --path . --export-release "macOS"           build/macos/game.zip
godot --headless --path . --export-release "Linux/X11"       build/linux/game.x86_64
godot --headless --path . --export-release "Web"             build/web/index.html

# 5. Upload to itch.io
butler push build/windows  user/game:windows --userversion 0.2.0
butler push build/macos    user/game:macos   --userversion 0.2.0
butler push build/linux    user/game:linux   --userversion 0.2.0
butler push build/web      user/game:html    --userversion 0.2.0
```

### Staging vs prod

- **Staging:** `user/game-beta` itch.io project (or unlisted Steam branch).
- **Prod:** `user/game` published.
- Build flag: `application/config/build=staging|prod` set in `project.godot` per branch and read at runtime by `GameState`.

### Rollback

```
butler push build/<platform>-old user/game:<channel> --userversion 0.1.9
```

Max safe rollback window: indefinite on itch.io (versions retained); 90 days on Steam.

### Health check

- Local: `godot --headless --path . scenes/main/main.tscn` exits 0 within 5 s with no `ERROR:` in output.
- Hosted web: `curl -I https://user.itch.io/game/` returns 200.

### Versioning

`MAJOR.MINOR.PATCH`. Stored in `project.godot` `application/config/version`. Read at runtime: `ProjectSettings.get_setting("application/config/version")`.

### Auto-update

- Steam: Steamworks handles patching automatically when player launches.
- itch.io: itch desktop app prompts on new version.
- No in-app updater; ship via store.

### Cost (1k MAU)

- itch.io: free; revenue-share opt-in (default 10%).
- Steam: $100 one-time per app, 30% revenue share.
- Hosting (web export): itch.io free; CDN ~$5/mo for high traffic.

### macOS codesign + notarize

In Godot's macOS export preset:

- Codesign → Codesign: `Xcode codesign`.
- Codesign → Identity: output of `security find-identity -v -p codesigning` (e.g. `Developer ID Application: Studio Name (TEAMID)`).
- Codesign → Apple Team ID: your Team ID.
- Codesign → Entitlements: leave defaults; uncheck Debugging for release.
- Notarization → Notarization: `Xcode notarytool`.
- Notarization → API UUID, API Key, API Key ID: from App Store Connect → Users and Access → Keys.

Verify after export:

```
xcrun notarytool history --key AuthKey_XXXXX.p8 --key-id XXXXX --issuer YYYY
xcrun stapler validate build/macos/game.app
```

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Project — Claude Rules

This project follows /opt/Loopa/rulebooks/godot4.md. Read it before any non-trivial task.

## Stack
- Godot 4.6.2 + GDScript 2.0
- Forward+ desktop, Compatibility web, Mobile mobile
- gdUnit4 for tests
- gdtoolkit (gdformat + gdlint) for style
- itch.io / Steam deployment

## Commands you will run constantly
- `godot --headless --quit --check-only --path .` — parse all scripts.
- `gdformat scripts/ tests/` — autoformat.
- `gdlint scripts/ tests/` — lint.
- `godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue` — full test suite.
- `godot --headless --path . --export-release "Linux/X11" build/linux/game.x86_64` — export smoke.

## Banned patterns
- `class_name` on every script — only when reused across scripts.
- `print("...")` for production logs — use `Logger` autoload.
- `assert(...)` for runtime checks — stripped from release builds.
- `get_node("../../...")` — pass `@export` or use signals.
- `OS.delay_msec` on main thread — `await` a Timer.
- `_process` for physics — use `_physics_process`.
- Forward+ in the Web export preset — must be Compatibility.
- Modifying `project.godot` or `export_presets.cfg` in parallel agent fan-outs.

## Definition of Done
1. `gdformat --check` clean.
2. `gdlint` clean.
3. `--check-only` parses.
4. Test suite green.
5. Export smoke for one platform succeeds.
6. Manual boot test of `scenes/main/main.tscn` for 5 s, no errors in output.

## Recommended skills
- `/test-driven-development` — write the gdUnit4 test before the feature script.
- `/systematic-debugging` — for runtime errors, especially "freed instance" and signal mismatches.
- `/verification-before-completion` — always run section 8.5 before claiming done.
- `/ship` — version bump + tag + push.
- `/review` — pre-merge sanity check.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(godot --headless *)",
      "Bash(godot --version)",
      "Bash(godot --path . *)",
      "Bash(gdformat *)",
      "Bash(gdlint *)",
      "Bash(git status)",
      "Bash(git diff*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git log*)",
      "Bash(git lfs *)",
      "Bash(gh *)",
      "Bash(butler push *)",
      "Bash(butler status *)",
      "Bash(timeout 5 godot *)",
      "Bash(ls *)",
      "Bash(cat project.godot)",
      "Bash(cat export_presets.cfg)",
      "Bash(du -sh build/*)"
    ]
  },
  "hooks": {
    "PostEdit": [
      {
        "matcher": "**/*.gd",
        "command": "gdformat \"$CLAUDE_FILE_PATH\" 2>&1 | head -20"
      }
    ],
    "PreCommit": [
      {
        "command": "gdformat --check scripts/ tests/ && gdlint scripts/ tests/ && godot --headless --quit --check-only --path ."
      }
    ],
    "Stop": [
      {
        "command": "godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/unit/ --continue 2>&1 | tail -20"
      }
    ]
  }
}
```

### Slash command shortcuts (on this stack)

- `/test-driven-development` — for any new feature, especially gameplay systems.
- `/systematic-debugging` — for `null instance`, signal mismatch, freed-node bugs.
- `/verification-before-completion` — runs section 8.5 recipe.
- `/ship` — version bump, tag, push, trigger build.yml.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# Codex Agent Rules

Read /opt/Loopa/rulebooks/godot4.md. It is the source of truth.

## Stack
Godot 4.6.2 + GDScript 2.0 + gdUnit4 + gdtoolkit. Targets: Windows, macOS, Linux, Web.

## Always
- Type-annotate every variable, parameter, return.
- Run `godot --headless --quit --check-only --path .` after editing scripts.
- Run gdUnit4 suite after any code change.
- Use `EventBus` autoload for cross-scene signals; direct connections within scenes.
- Use `WorkerThreadPool` for work >2 ms.
- Disconnect signals in `_exit_tree()`.
- Use Compatibility renderer in the Web export preset.

## Never
- Add `class_name` to scripts that aren't referenced by name.
- Use `print` for production logs.
- Use `assert` for runtime validation (release strips it).
- Modify `project.godot` or `export_presets.cfg` in parallel.
- Use Forward+ in the Web preset.
- Block the main thread with `OS.delay_msec`.

## Verify before done
gdformat --check / gdlint / --check-only / gdUnit4 suite / export smoke / 5 s boot smoke.

## Differences from Claude Code
- Codex defaults to no-network sandbox: enable network for `pipx install gdtoolkit` and `git submodule update`.
- Codex auto-applies edits more aggressively — keep diffs scoped; verify each edit with `--check-only`.
```

### `.codex/config.toml`

```toml
[default]
model = "claude-sonnet-4-6"
sandbox = "workspace-write"
approval_mode = "auto"

[hooks]
post_edit = "gdformat \"${file}\""
pre_commit = "gdformat --check scripts/ tests/ && gdlint scripts/ tests/ && godot --headless --quit --check-only --path ."

[allowed_commands]
patterns = [
  "godot --headless *",
  "gdformat *",
  "gdlint *",
  "git *",
  "gh *",
  "butler *"
]
```

### Where Codex differs

- Codex's parallel apply is risky for `project.godot` edits — serialize them.
- Codex sandbox blocks `~/.local/share/godot/export_templates` writes by default — install templates outside the sandbox or whitelist that path.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Cursor rules — Godot 4 + GDScript

Stack: Godot 4.6.2 stable, GDScript 2.0, gdUnit4 for tests, gdtoolkit (gdformat + gdlint).
Read /opt/Loopa/rulebooks/godot4.md before any non-trivial change.

ALWAYS
- Type-annotate every var, param, return: `var n: int`, `func f(x: String) -> bool:`.
- After editing any .gd, run `godot --headless --quit --check-only --path .`.
- Run `gdformat <file>` on every saved script.
- Disconnect signals in `_exit_tree()` when listener can outlive emitter.
- Use `queue_free()` in scene tree; never `free()`.
- Cross-scene events: `EventBus` autoload signal; intra-scene: direct connection.
- Heavy work: `WorkerThreadPool.add_task`, never inside `_process`.
- Compatibility renderer in Web export preset.
- Validate user-modifiable Resource fields after load.

NEVER
- `class_name` on every script.
- `print()` for prod logs (use `Logger` autoload).
- `assert(...)` for runtime checks — stripped in release.
- `get_node("../../X")` — pass `@export` reference or signal.
- Forward+ renderer in Web preset.
- Modify `project.godot` or `export_presets.cfg` in parallel branches.
- `OS.delay_msec` on main thread.
- `_process` for physics — use `_physics_process`.
- `add_child` before parent's `_ready` finished — use `call_deferred`.

VERIFY (run before declaring done)
1. gdformat --check scripts/ tests/
2. gdlint scripts/ tests/
3. godot --headless --quit --check-only --path .
4. godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue
5. godot --headless --path . --export-release "Linux/X11" build/linux/game.x86_64
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "geequlim.godot-tools",
    "alfish.godot-files",
    "razoric.gdscript-toolkit-formatter",
    "eamodio.gitlens",
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
      "name": "Launch (current scene)",
      "type": "godot",
      "request": "launch",
      "project": "${workspaceFolder}",
      "port": 6007,
      "address": "127.0.0.1",
      "additional_options": ""
    },
    {
      "name": "Launch (main scene, headless)",
      "type": "godot",
      "request": "launch",
      "project": "${workspaceFolder}",
      "port": 6007,
      "address": "127.0.0.1",
      "additional_options": "--headless"
    },
    {
      "name": "Run tests",
      "type": "godot",
      "request": "launch",
      "project": "${workspaceFolder}",
      "port": 6007,
      "address": "127.0.0.1",
      "additional_options": "--headless -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create the following files in order. After this, `git push` produces a deployable hello-world to itch.io via CI.

### 1. `project.godot`

```ini
; Engine configuration file.
config_version=5

[application]
config/name="My Game"
config/version="0.1.0"
run/main_scene="res://scenes/main/main.tscn"
config/features=PackedStringArray("4.6", "GL Compatibility")
config/icon="res://icon.svg"

[autoload]
Logger="*res://scripts/autoloads/logger.gd"
EventBus="*res://scripts/autoloads/event_bus.gd"
GameState="*res://scripts/autoloads/game_state.gd"
SaveSystem="*res://scripts/autoloads/save_system.gd"

[display]
window/size/viewport_width=1280
window/size/viewport_height=720
window/stretch/mode="canvas_items"

[input]
ui_accept={
"deadzone": 0.5,
"events": [Object(InputEventKey,"resource_local_to_scene":false,"resource_name":"","device":-1,"window_id":0,"alt_pressed":false,"shift_pressed":false,"ctrl_pressed":false,"meta_pressed":false,"pressed":false,"keycode":0,"physical_keycode":4194309,"key_label":0,"unicode":0,"location":0,"echo":false,"script":null)
]
}

[rendering]
renderer/rendering_method="forward_plus"
renderer/rendering_method.mobile="mobile"
renderer/rendering_method.web="gl_compatibility"
```

### 2. `.gitignore`

```
# Godot 4 generated
.godot/
.import/
*.translation

# Export artifacts
build/
*.exe
*.dmg
*.app
*.x86_64
*.pck
*.zip

# Editor secrets
.godot/export_credentials.cfg
*.gd_history

# OS noise
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Local env
.env
*.local
```

### 3. `.gitattributes`

```
# Normalize text line endings
* text=auto eol=lf
*.gd text eol=lf
*.tscn text eol=lf
*.tres text eol=lf
*.godot text eol=lf
*.cfg text eol=lf
*.gdshader text eol=lf
*.csv text eol=lf

# Treat binary
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.tga binary
*.webp binary
*.ogg binary
*.wav binary
*.mp3 binary
*.mp4 binary
*.glb binary
*.gltf binary
*.blend binary
*.fbx binary
*.ttf binary
*.otf binary
*.res binary

# Git LFS
*.png filter=lfs diff=lfs merge=lfs -text
*.jpg filter=lfs diff=lfs merge=lfs -text
*.jpeg filter=lfs diff=lfs merge=lfs -text
*.tga filter=lfs diff=lfs merge=lfs -text
*.webp filter=lfs diff=lfs merge=lfs -text
*.ogg filter=lfs diff=lfs merge=lfs -text
*.wav filter=lfs diff=lfs merge=lfs -text
*.mp3 filter=lfs diff=lfs merge=lfs -text
*.glb filter=lfs diff=lfs merge=lfs -text
*.gltf filter=lfs diff=lfs merge=lfs -text
*.blend filter=lfs diff=lfs merge=lfs -text
*.fbx filter=lfs diff=lfs merge=lfs -text
*.ttf filter=lfs diff=lfs merge=lfs -text
*.otf filter=lfs diff=lfs merge=lfs -text
```

### 4. `export_presets.cfg`

```ini
[preset.0]
name="Windows Desktop"
platform="Windows Desktop"
runnable=true
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="build/windows/game.exe"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.0.options]
custom_template/debug=""
custom_template/release=""
debug/export_console_wrapper=1
binary_format/embed_pck=false
texture_format/bptc=true
texture_format/s3tc=true
binary_format/architecture="x86_64"
codesign/enable=false
application/modify_resources=true
application/icon=""
application/console_wrapper_icon=""
application/icon_interpolation=4
application/file_version=""
application/product_version=""
application/company_name=""
application/product_name=""
application/file_description=""
application/copyright=""
application/trademarks=""
application/export_angle=0
application/export_d3d12=0
application/d3d12_agility_sdk_multiarch=true
ssh_remote_deploy/enabled=false

[preset.1]
name="macOS"
platform="macOS"
runnable=true
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="build/macos/game.zip"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.1.options]
export/distribution_type=2
binary_format/architecture="universal"
custom_template/debug=""
custom_template/release=""
debug/export_console_wrapper=1
application/icon=""
application/icon_interpolation=4
application/bundle_identifier="com.example.mygame"
application/signature=""
application/app_category="Games"
application/short_version="0.1.0"
application/version="0.1.0"
application/copyright=""
application/copyright_localized={}
application/min_macos_version="11.00"
display/high_res=true
xcode/platform_build="14C18"
xcode/sdk_version="13.1"
xcode/sdk_build="22C55"
xcode/sdk_name="macosx13.1"
xcode/xcode_version="1420"
xcode/xcode_build="14C18"
codesign/codesign=2
codesign/installer_identity=""
codesign/apple_team_id=""
codesign/identity=""
codesign/certificate_file=""
codesign/certificate_password=""
codesign/provisioning_profile=""
codesign/entitlements/custom_file=""
codesign/entitlements/allow_jit_code_execution=false
codesign/entitlements/allow_unsigned_executable_memory=false
codesign/entitlements/allow_dyld_environment_variables=false
codesign/entitlements/disable_library_validation=false
codesign/entitlements/audio_input=false
codesign/entitlements/camera=false
codesign/entitlements/location=false
codesign/entitlements/address_book=false
codesign/entitlements/calendars=false
codesign/entitlements/photos_library=false
codesign/entitlements/apple_events=false
codesign/entitlements/debugging=false
codesign/entitlements/app_sandbox/enabled=false
notarization/notarization=0
ssh_remote_deploy/enabled=false

[preset.2]
name="Linux/X11"
platform="Linux"
runnable=true
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="build/linux/game.x86_64"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.2.options]
custom_template/debug=""
custom_template/release=""
debug/export_console_wrapper=1
binary_format/embed_pck=false
binary_format/architecture="x86_64"
ssh_remote_deploy/enabled=false

[preset.3]
name="Web"
platform="Web"
runnable=true
custom_features=""
export_filter="all_resources"
include_filter=""
exclude_filter=""
export_path="build/web/index.html"
encryption_include_filters=""
encryption_exclude_filters=""
encrypt_pck=false
encrypt_directory=false

[preset.3.options]
custom_template/debug=""
custom_template/release=""
variant/extensions_support=false
variant/thread_support=true
vram_texture_compression/for_desktop=true
vram_texture_compression/for_mobile=false
html/export_icon=true
html/custom_html_shell=""
html/head_include=""
html/canvas_resize_policy=2
html/focus_canvas_on_start=true
html/experimental_virtual_keyboard=false
progressive_web_app/enabled=true
progressive_web_app/ensure_cross_origin_isolation_headers=true
progressive_web_app/offline_page=""
progressive_web_app/display=1
progressive_web_app/orientation=0
progressive_web_app/icon_144x144=""
progressive_web_app/icon_180x180=""
progressive_web_app/icon_512x512=""
progressive_web_app/background_color=Color(0, 0, 0, 1)
```

### 5. `scripts/autoloads/event_bus.gd`

```gdscript
extends Node

# Global signal-only autoload. State lives elsewhere; this only routes events.

signal scene_changed(from_path: String, to_path: String)
signal player_died
signal player_health_changed(new_value: int, previous: int)
signal score_changed(new_value: int)
signal save_completed(path: String)
signal save_failed(error: int)
```

### 6. `scripts/autoloads/game_state.gd`

```gdscript
extends Node

# Cross-scene mutable state. Setters emit on EventBus.

var score: int = 0:
    set(v):
        var prev := score
        score = v
        EventBus.score_changed.emit(score)

var player_health: int = 100:
    set(v):
        var prev := player_health
        player_health = clampi(v, 0, 100)
        EventBus.player_health_changed.emit(player_health, prev)
        if player_health == 0:
            EventBus.player_died.emit()

var current_level: String = "level_1"
```

### 7. `scripts/autoloads/save_system.gd`

```gdscript
extends Node

const SAVE_PATH := "user://save.res"

func save_game() -> void:
    var data := preload("res://scripts/resources/save_data.gd").new()
    data.score = GameState.score
    data.player_health = GameState.player_health
    data.current_level = GameState.current_level
    var err := ResourceSaver.save(data, SAVE_PATH)
    if err != OK:
        Logger.error("save.failed", {"err": err})
        EventBus.save_failed.emit(err)
        return
    Logger.info("save.completed", {"path": SAVE_PATH})
    EventBus.save_completed.emit(SAVE_PATH)

func load_game() -> bool:
    if not FileAccess.file_exists(SAVE_PATH):
        return false
    var data: Resource = ResourceLoader.load(SAVE_PATH, "", ResourceLoader.CACHE_MODE_IGNORE)
    if data == null:
        Logger.error("load.failed", {"path": SAVE_PATH})
        return false
    # Validate before applying.
    GameState.score = max(0, int(data.score))
    GameState.player_health = clampi(int(data.player_health), 0, 100)
    GameState.current_level = String(data.current_level) if data.current_level else "level_1"
    return true
```

### 8. `scripts/autoloads/logger.gd`

(See section 7.)

### 9. `scripts/resources/save_data.gd`

```gdscript
class_name SaveData
extends Resource

@export var score: int = 0
@export var player_health: int = 100
@export var current_level: String = "level_1"
@export var version: String = "0.1.0"
```

### 10. `scenes/main/main.tscn`

```
[gd_scene load_steps=2 format=3 uid="uid://b1main"]

[ext_resource type="Script" path="res://scenes/main/main.gd" id="1"]

[node name="Main" type="Node2D"]
script = ExtResource("1")

[node name="Label" type="Label" parent="."]
offset_left = 540.0
offset_top = 320.0
offset_right = 740.0
offset_bottom = 360.0
text = "Hello, Godot 4."
horizontal_alignment = 1
```

### 11. `scenes/main/main.gd`

```gdscript
extends Node2D

func _ready() -> void:
    Logger.info("main.ready", {"version": ProjectSettings.get_setting("application/config/version")})
```

### 12. `tests/unit/test_save_data.gd`

```gdscript
extends GdUnitTestSuite

const SaveData := preload("res://scripts/resources/save_data.gd")

func test_default_values() -> void:
    var d := SaveData.new()
    assert_int(d.score).is_equal(0)
    assert_int(d.player_health).is_equal(100)
    assert_str(d.current_level).is_equal("level_1")

func test_health_clamps_on_assign_via_state() -> void:
    GameState.player_health = 150
    assert_int(GameState.player_health).is_equal(100)
    GameState.player_health = -50
    assert_int(GameState.player_health).is_equal(0)
```

### 13. `.github/workflows/build.yml`

```yaml
name: Build & Export

on:
  push:
    branches: [main]
    tags: ['v*']
  pull_request:
    branches: [main]

env:
  GODOT_VERSION: 4.6.2
  EXPORT_NAME: my-game

jobs:
  test:
    runs-on: ubuntu-24.04
    container:
      image: barichello/godot-ci:4.6.2
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true
      - name: Install templates
        run: |
          mkdir -p ~/.local/share/godot/export_templates/${GODOT_VERSION}.stable
          mv /root/.local/share/godot/export_templates/${GODOT_VERSION}.stable/* ~/.local/share/godot/export_templates/${GODOT_VERSION}.stable/
      - name: Parse check
        run: godot --headless --quit --check-only --path .
      - name: Run tests
        run: godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue

  export:
    needs: test
    runs-on: ubuntu-24.04
    container:
      image: barichello/godot-ci:4.6.2
    strategy:
      matrix:
        preset:
          - { name: "Windows Desktop", out: "windows", file: "game.exe" }
          - { name: "Linux/X11",       out: "linux",   file: "game.x86_64" }
          - { name: "macOS",           out: "macos",   file: "game.zip" }
          - { name: "Web",             out: "web",     file: "index.html" }
    steps:
      - uses: actions/checkout@v4
        with:
          lfs: true
      - name: Install templates
        run: |
          mkdir -p ~/.local/share/godot/export_templates/${GODOT_VERSION}.stable
          mv /root/.local/share/godot/export_templates/${GODOT_VERSION}.stable/* ~/.local/share/godot/export_templates/${GODOT_VERSION}.stable/
      - name: Export
        run: |
          mkdir -p build/${{ matrix.preset.out }}
          godot --headless --path . --export-release "${{ matrix.preset.name }}" build/${{ matrix.preset.out }}/${{ matrix.preset.file }}
      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: ${{ matrix.preset.out }}
          path: build/${{ matrix.preset.out }}
```

### 14. `README.md`

```markdown
# My Game

Godot 4.6.2 + GDScript. Cross-platform 2D game.

## Run

```
godot project.godot
```

## Test

```
godot --headless --path . -s addons/gdUnit4/bin/GdUnitCmdTool.gd -- --add tests/ --continue
```

## Build

```
godot --headless --path . --export-release "Linux/X11" build/linux/game.x86_64
```

See `/opt/Loopa/rulebooks/godot4.md` for the full development rulebook.
```

### 15. `LICENSE`

(MIT or whatever the user picks; agent fills `[year] [name]`.)

### 16. `addons/gdUnit4/`

Add via git submodule:

```
git submodule add https://github.com/godot-gdunit-labs/gdUnit4 addons/gdUnit4
git -C addons/gdUnit4 checkout v6.0.0
git add .gitmodules addons/gdUnit4
```

After `git push` of all the above, GitHub Actions runs the workflow and uploads four platform artifacts.

---

## 17. Idea → MVP Path

Given a generic 2D platformer idea, ship in 5 phases.

### Phase 1 — Schema (1 session)
- Files: `scripts/resources/level_data.gd`, `scripts/resources/save_data.gd`, `scripts/resources/player_stats.gd`.
- Each `extends Resource` with `@export` fields.
- Exit: `gdUnit4` test loads/saves each resource type.

### Phase 2 — Backbone (2 sessions)
- Files: `scenes/main/main.tscn`, `scenes/main_menu/main_menu.tscn`, `scenes/level_1/level_1.tscn`, `scenes/player/player.tscn`.
- Scene swap via `get_tree().change_scene_to_packed`.
- Exit: title → menu → level → game-over loop runs without crashing.

### Phase 3 — Vertical slice (3 sessions)
- One playable level: player movement (`CharacterBody2D` + `move_and_slide`), one enemy with collision damage, coin pickup, HUD showing score + health.
- Tests: player damage math, coin pickup increments score, enemy AI patrols.
- Exit: full play-through of one level, save/load works mid-level.

### Phase 4 — Auth + multi-user (2 sessions; skip if single-player)
- For multiplayer: `MultiplayerSpawner` + `MultiplayerSynchronizer` on player scene; ENet peer.
- For single-player with cloud saves: HTTPRequest + server JWT.
- Exit: two clients can join one host and see each other.

### Phase 5 — Ship + monitor (1 session)
- Tag `v0.1.0`, push, CI exports four platforms.
- `butler push` to itch.io.
- Sentry SDK addon connected for error capture.
- Exit: live URL on itch.io, plays in browser, errors land in Sentry.

---

## 18. Feature Recipes

### 18.1 Authentication (HTTP + JWT)

`scripts/systems/auth.gd`:

```gdscript
class_name Auth
extends RefCounted

signal logged_in(user_id: String)
signal login_failed(error: String)

const ENDPOINT := "https://api.example.com/auth/login"

var _http: HTTPRequest

func _init(http: HTTPRequest) -> void:
    _http = http
    _http.request_completed.connect(_on_completed)

func login(email: String, password: String) -> void:
    var body := JSON.stringify({"email": email, "password": password})
    _http.request(ENDPOINT, ["Content-Type: application/json"], HTTPClient.METHOD_POST, body)

func _on_completed(_result: int, code: int, _headers: PackedStringArray, body: PackedByteArray) -> void:
    if code != 200:
        login_failed.emit("HTTP %d" % code)
        return
    var data: Variant = JSON.parse_string(body.get_string_from_utf8())
    if typeof(data) != TYPE_DICTIONARY or not data.has("token"):
        login_failed.emit("malformed response")
        return
    SaveSystem.store_token(data["token"])
    logged_in.emit(data.get("user_id", ""))
```

### 18.2 File upload (PNG to S3 presigned)

```gdscript
func upload_screenshot(presigned_url: String, png_bytes: PackedByteArray) -> int:
    var http := HTTPRequest.new()
    add_child(http)
    var err := http.request_raw(presigned_url, ["Content-Type: image/png"], HTTPClient.METHOD_PUT, png_bytes)
    if err != OK: return err
    var result: Array = await http.request_completed
    http.queue_free()
    return result[1]  # response code
```

### 18.3 Stripe / IAP payments (Steam IAP via GodotSteam)

Use `godotsteam` addon. Initialize in autoload:

```gdscript
func _ready() -> void:
    Steam.steamInit()
    Steam.microtxn_authorization_response.connect(_on_iap_response)
```

### 18.4 Push notifications (mobile)

Add the official `godot-firebase` addon. Register FCM in `_ready` of an autoload, handle the token, store server-side. Out of scope for desktop/web.

### 18.5 Background jobs / cron

Use `WorkerThreadPool`:

```gdscript
func warmup_assets() -> void:
    var task_id := WorkerThreadPool.add_task(_load_assets)
    while not WorkerThreadPool.is_task_completed(task_id):
        await get_tree().process_frame
    WorkerThreadPool.wait_for_task_completion(task_id)

func _load_assets() -> void:
    for path in ["res://assets/data/level_1.tres", "res://assets/data/level_2.tres"]:
        ResourceLoader.load(path)
```

### 18.6 Realtime updates (ENet WebSocket)

```gdscript
var peer := WebSocketMultiplayerPeer.new()

func host(port: int) -> void:
    peer.create_server(port)
    multiplayer.multiplayer_peer = peer

func join(url: String) -> void:
    peer.create_client(url)
    multiplayer.multiplayer_peer = peer
```

### 18.7 Search (in-memory fuzzy)

```gdscript
func fuzzy_match(query: String, items: Array[String]) -> Array[String]:
    query = query.to_lower()
    var matches: Array[String] = []
    for it in items:
        if query in it.to_lower():
            matches.append(it)
    return matches
```

### 18.8 Internationalization

Project Settings → Localization → CSV. `assets/data/i18n/strings.csv`:

```
keys,en,es,fr
greeting,Hello,Hola,Bonjour
play,Play,Jugar,Jouer
```

Use: `label.text = tr("greeting")`. Switch locale: `TranslationServer.set_locale("es")`.

### 18.9 Dark mode

Two Theme resources at `assets/data/theme/dark.tres` and `light.tres`. Apply on root Control: `theme = preload(...)`. Persist choice in `GameState`.

### 18.10 Analytics events

```gdscript
# scripts/systems/analytics.gd
extends Node

func track(event: String, props: Dictionary = {}) -> void:
    Logger.info("analytics.%s" % event, props)
    var http := HTTPRequest.new()
    add_child(http)
    http.request("https://api.example.com/events", ["Content-Type: application/json"],
        HTTPClient.METHOD_POST, JSON.stringify({"event": event, "props": props}))
    http.request_completed.connect(func(_r, _c, _h, _b): http.queue_free(), CONNECT_ONE_SHOT)
```

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Parse Error: Unexpected "Identifier"` | Run `gdformat <file>` then re-check; usually a missing `:` after `func`. |
| `Attempt to call function 'X' on a previously freed instance` | Check `is_instance_valid(node)` before use; disconnect signals in `_exit_tree`. |
| `Class "Foo" hides a global script class.` | Two scripts share `class_name`. Rename one. |
| `Resource file not found: res://...` | Re-import: Editor → Project → Tools → Reload Current Project. |
| `Vulkan: VK_ERROR_INITIALIZATION_FAILED` | Switch renderer to Compatibility (Project Settings → Rendering → Renderer). |
| `No export template found at <path>` | `godot --headless --install-export-templates` or copy templates to `~/.local/share/godot/export_templates/4.6.2.stable/`. |
| `Web export blank, console: SharedArrayBuffer is not defined` | Enable PWA + cross-origin isolation in Web preset, or host on itch.io with toggle. |
| `Tween's "finished" signal not found` | In Godot 4 Tween is not a Node — use `var t = create_tween()` then `t.finished.connect(...)`. |
| `Function "load_threaded_request" not found` | Check class — it's on `ResourceLoader`, not `Resource`. |
| `Add child after _ready` race | Wrap in `call_deferred("add_child", x)`. |
| `gdUnit4: No tests found` | Ensure test files extend `GdUnitTestSuite` and method names start with `test_`. |
| `Signal "X" is already connected` | Check if `connect` is in `_ready` of a re-added node; use `if not signal.is_connected(...)`. |
| `assert_*` not failing in release | `assert(...)` is stripped — use `if`+`push_error` for runtime guards. |
| `Cannot save Resource: cyclic reference` | Replace direct ref with `NodePath` or string id. |
| `change_scene_to_file: Already changing scene` | Don't call from `_ready`; use `call_deferred("change_scene_to_file", path)`. |
| `Editor unresponsive on opening scene` | Likely a `@tool` script doing work without `Engine.is_editor_hint()` guard. |
| `RID allocation, leaked` | Free physics shapes/textures with `RenderingServer.free_rid` or rely on owning node freeing. |
| `audio_thread crashed` | Don't call AudioStreamPlayer methods from non-main threads. |
| `Game runs in editor, crashes in export` | `assert(...)` was carrying logic; ResourceLoader hit a path that didn't get exported (check Filter list in preset). |
| `gdformat: invalid syntax` | Bad GDScript that the parser rejects — fix syntax, then format. |
| `Error: Compatibility: Direct3D 12 is not available` | On Windows old GPUs, force OpenGL: `--rendering-driver opengl3`. |
| `Web build crashes with WebGL2 error` | Compatibility renderer requires WebGL2 — older browsers fail. Document min browser. |
| `MultiplayerSpawner: scene must be in autospawn list` | Add the PackedScene path to spawn list, or call `spawn(data)` with a custom spawner func. |
| `Save game corrupted: Invalid Resource` | Save was tampered with — handle by deleting and starting fresh, never crash. |
| `Frozen UI on `await`` | `await` paused that function; check no infinite signal loop. |
| `Code coverage shows 0%` | gdUnit4 doesn't run in coverage mode by default; install `godot-code-coverage` addon. |
| `Cannot codesign: identity not found` | `security find-identity -v -p codesigning`; copy exact `Developer ID Application:` string. |
| `Notarization failed: ITMS-90562` | Enable App Sandbox or sign all sub-binaries; check `xcrun notarytool log <id>`. |
| `Web export 404 on .pck` | Server MIME types — add `application/octet-stream` for `.pck` and `.wasm`. |
| `itch.io upload too large` | Use butler (1 GB+ supported); zip first if regular upload. |
| `Mouse cursor stuck after pause` | `Input.mouse_mode` was set MODE_CAPTURED — reset on pause: `Input.mouse_mode = Input.MOUSE_MODE_VISIBLE`. |

---

## 20. Glossary

- **Autoload (singleton):** A script registered in Project Settings that is loaded once at game start and accessible by name from any scene.
- **Class_name:** A keyword that registers a script as a named global class (`class_name Player`); use sparingly.
- **CharacterBody2D:** Physics body for player/NPC movement; pairs with `move_and_slide`.
- **Compatibility renderer:** Godot's OpenGL 3.3 / WebGL 2 renderer; required for the web target.
- **EventBus:** A signal-only autoload pattern that decouples emitter and listener.
- **Forward+ renderer:** Vulkan-based renderer with the most features; default for desktop.
- **GDScript:** Godot's built-in scripting language; Python-like syntax.
- **gdUnit4:** Unit testing framework for GDScript and C#.
- **gdtoolkit:** Python package providing `gdformat` (formatter) and `gdlint` (linter).
- **MultiplayerSpawner / MultiplayerSynchronizer:** Built-in nodes that replicate scene instantiation and node properties across networked peers.
- **PackedScene:** A serialized scene asset (`.tscn` text or `.scn` binary).
- **process / physics_process:** `_process(delta)` runs every frame; `_physics_process(delta)` runs at fixed step (60 Hz default).
- **queue_free:** Marks a node for removal at the end of the frame (safe).
- **Resource:** A reference-counted data object that can be saved/loaded; the canonical save format.
- **ResourceSaver / ResourceLoader:** APIs for serializing Resource instances to disk.
- **SceneTree:** The runtime tree of all active nodes; root of every game.
- **Signal:** Godot's event mechanism; `signal_name.connect(method)`.
- **Tween:** A short-lived object for property animation; created via `create_tween()`.
- **Viewport:** The render target for a scene; the root viewport is the window.
- **WorkerThreadPool:** Godot's built-in thread pool for off-main-thread work.
- **`@tool`:** Annotation that makes a script run inside the editor.
- **`@export`:** Annotation that exposes a variable to the inspector and serializes it.
- **`user://`:** OS-specific writable user data path (`~/Library/Application Support/Godot/...` on macOS, `%APPDATA%\Godot\...` on Windows).
- **`res://`:** Read-only path rooted at project folder; baked into exports.
- **butler:** itch.io's CLI for uploading builds.
- **COOP / COEP:** Cross-Origin-Opener-Policy and Cross-Origin-Embedder-Policy HTTP headers required for SharedArrayBuffer (web export).
- **PWA:** Progressive Web App; Godot's web export can self-inject COOP/COEP via service worker.

---

## 21. Update Cadence

- This rulebook is valid for Godot 4.6.x. Re-run the generator on:
  - Major version bump (4.7, 5.0).
  - Renderer policy change (e.g. Vulkan default removed for some platform).
  - Security advisory affecting the engine or addons.
  - gdtoolkit or gdUnit4 major bump.
- Verify every quarter: run `godot --version` against the version pinned at top of this file.

Date stamped: 2026-04-27. Pinned engine: Godot 4.6.2 stable.
