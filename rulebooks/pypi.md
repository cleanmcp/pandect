# PyPI Package Rulebook (`stringfu` template)

Python library + optional CLI published to PyPI — uv-managed, hatchling backend, src/ layout, py.typed marker, Ruff format+lint, ty type checker (mypy fallback), pytest + coverage, OIDC trusted publishing via GitHub Actions.

---

## 1. Snapshot

**Tagline:** Ship a typed Python library to PyPI in one afternoon, with zero tokens, signed attestations, and a passing CI on day one.

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Python | Target ecosystem is PyPI |
| Runtime + version | CPython 3.11+ (3.14.4 dev default) | 3.11 floor balances reach and modern syntax |
| Package manager | uv 0.11.7 | Fastest resolver, lockfile, Python install, all-in-one |
| Build tool | hatchling 1.29.0 | PyPA-supported, src/ layout, fast wheels |
| Build backend frontend | `uv build` | Native uv, no separate `build` install |
| Version source | hatch-vcs (Git tag) | One source of truth, no manual bumps |
| Release automation | release-please (Google) | Conventional commits to tags + CHANGELOG |
| State mgmt | n/a (library) | Libraries hold no app state |
| Routing/Nav | n/a (library) | Not applicable |
| Data layer | n/a (library) | Not applicable |
| Auth | n/a (library) | Not applicable |
| Styling | n/a (library) | Not applicable |
| Forms + validation | n/a (library) | Not applicable |
| Unit test runner | pytest 9.0.3 | De-facto Python standard |
| E2E framework | pytest with `tmp_path` + subprocess | CLI integration tests use real CLI |
| Mocking strategy | `pytest-mock` for isolated unit; never mock public API | Real I/O at boundary, fakes for collaborators |
| Logger | stdlib `logging` with `NullHandler` | Library MUST NOT configure root logger |
| Error tracking | n/a (library raises) | App embeds its own tracker |
| Lint + format | Ruff 0.13 (lint + format both) | One tool, replaces black + isort + flake8 |
| Type checking | ty (Astral, beta) — mypy 1.18 fallback | Fastest checker; mypy stays as compatibility shim |
| Type information shipping | `py.typed` marker, inline annotations | PEP 561 requires marker for downstream type checking |
| Env vars + secrets | None at build time; `os.environ` at runtime | Libraries read env, never own secrets |
| CI provider | GitHub Actions | Tightest OIDC story for PyPI |
| Deploy target | PyPI (via Trusted Publisher) | OIDC, no tokens, signed attestations |
| Release flow | release-please PR → tag → publish workflow | Conventional commits drive the entire flow |
| Auto-update | `pip install -U` / `uv add` | Users opt in |
| Optional CLI | `[project.scripts]` entry point | Standard PEP 621 mechanism |
| README content-type | `text/markdown` (auto via `readme = "README.md"`) | PyPI renders Markdown when content-type is set |
| Dev dependencies location | `[dependency-groups].dev` (PEP 735) | Standard in 2026; not optional-dependencies |
| Distribution attestations | Sigstore via `gh-action-pypi-publish` | Default-on with Trusted Publishing |
| Lockfile in repo | `uv.lock` committed | Reproducible CI; ignored by sdist via Hatch defaults |
| Artifact upload action | `pypa/gh-action-pypi-publish@release/v1` | Pinned floating tag PyPA recommends |

### Versions Table (verified 2026-04-27 via WebSearch)

| Component | Version | Released | Link |
|---|---|---|---|
| Python (latest stable) | 3.14.4 | 2026-04-07 | https://www.python.org/downloads/release/python-3144/ |
| uv | 0.11.7 | 2026-04-15 | https://github.com/astral-sh/uv/releases |
| hatchling | 1.29.0 | 2026-02-23 | https://pypi.org/project/hatchling/ |
| hatch-vcs | latest | active | https://github.com/ofek/hatch-vcs |
| Ruff | 0.13.x (2026 style guide) | 2026-03-26 | https://docs.astral.sh/ruff/ |
| ty | beta (Astral) | 2026-04-15 | https://github.com/astral-sh/ty/releases |
| mypy (fallback) | 1.18.x | 2026 | https://pypi.org/project/mypy/ |
| pytest | 9.0.3 | 2026-04-07 | https://pypi.org/project/pytest/ |
| pytest-cov | 7.1.0 | 2026-03-21 | https://pypi.org/project/pytest-cov/ |
| coverage | 7.13.5 | 2026 | https://coverage.readthedocs.io/ |
| trove-classifiers | 2026.1.14.14 | 2026 | https://pypi.org/project/trove-classifiers/ |
| pypa/gh-action-pypi-publish | release/v1 | active | https://github.com/pypa/gh-action-pypi-publish |
| release-please-action | v4 | active | https://github.com/googleapis/release-please-action |

### Minimum Host Requirements

- macOS 13+, Windows 11, or Ubuntu 22.04+ (any Linux with glibc 2.35+).
- 2 GB RAM, 5 GB free disk for caches.
- Network access to https://pypi.org, https://files.pythonhosted.org, https://github.com.

### Cold-Start Estimate

`git clone` → all tests green: 90 seconds on a fresh machine (uv installs Python in ~5s; deps in ~3s; pytest in ~10s).

---

## 2. Zero-to-Running (Setup)

### macOS

```bash
# 1. Install uv (manages Python, deps, and venvs).
curl -LsSf https://astral.sh/uv/install.sh | sh
exec $SHELL -l

# 2. Install Git and gh CLI.
brew install git gh

# 3. Authenticate gh (only needed for releasing).
gh auth login

# 4. Bootstrap the library.
uv init --lib stringfu
cd stringfu
uv python pin 3.11
uv sync

# 5. Run tests.
uv run pytest
```

### Windows (PowerShell)

```powershell
# 1. Install uv.
powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"

# 2. Install Git and gh.
winget install --id Git.Git -e
winget install --id GitHub.cli -e

# 3. Authenticate gh.
gh auth login

# 4. Bootstrap.
uv init --lib stringfu
cd stringfu
uv python pin 3.11
uv sync

# 5. Run tests.
uv run pytest
```

### Linux (Ubuntu / Debian)

```bash
# 1. Install uv.
curl -LsSf https://astral.sh/uv/install.sh | sh
source $HOME/.local/bin/env

# 2. Install Git and gh.
sudo apt-get update
sudo apt-get install -y git
(type -p wget >/dev/null || (sudo apt update && sudo apt-get install wget -y)) \
  && sudo mkdir -p -m 755 /etc/apt/keyrings \
  && wget -qO- https://cli.github.com/packages/githubcli-archive-keyring.gpg | sudo tee /etc/apt/keyrings/githubcli-archive-keyring.gpg > /dev/null \
  && sudo chmod go+r /etc/apt/keyrings/githubcli-archive-keyring.gpg \
  && echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/githubcli-archive-keyring.gpg] https://cli.github.com/packages stable main" | sudo tee /etc/apt/sources.list.d/github-cli.list > /dev/null \
  && sudo apt update \
  && sudo apt install gh -y

# 3. Authenticate.
gh auth login

# 4. Bootstrap and test.
uv init --lib stringfu && cd stringfu
uv python pin 3.11
uv sync
uv run pytest
```

### Accounts to Create

| Account | URL | Used For |
|---|---|---|
| GitHub | https://github.com/join | Source repo + Actions |
| PyPI | https://pypi.org/account/register/ | Public package registry |
| TestPyPI | https://test.pypi.org/account/register/ | Pre-release smoke uploads |

### Trusted Publisher Configuration (one-time)

1. Push the empty repo to GitHub: `gh repo create stringfu --public --source=. --push`.
2. On PyPI: https://pypi.org/manage/account/publishing/ → "Add a new pending publisher".
3. Fill: PyPI Project Name=`stringfu`, Owner=`<your-gh-user>`, Repository=`stringfu`, Workflow=`release.yml`, Environment=`pypi`.
4. Repeat on TestPyPI: https://test.pypi.org/manage/account/publishing/ → environment `testpypi`.
5. Create environments in GitHub: Settings → Environments → `pypi` and `testpypi`. Mark `pypi` as protected (required reviewers = you).

### Expected First-Run Output

```
$ uv sync
Resolved 8 packages in 12ms
Prepared 7 packages in 320ms
Installed 7 packages in 18ms

$ uv run pytest
============================= test session starts ==============================
platform darwin -- Python 3.11.10, pytest-9.0.3, pluggy-1.5.0
rootdir: /Users/x/stringfu
configfile: pyproject.toml
collected 1 item

tests/test_basic.py .                                                    [100%]

============================== 1 passed in 0.02s ===============================
```

### First-Run Errors → Fix

| Error | Cause | Fix |
|---|---|---|
| `error: Distribution package metadata not found` | running `uv build` outside project root | `cd` into project, retry |
| `ModuleNotFoundError: No module named 'stringfu'` | tests imported wrong path; src/ not on sys.path | confirm `[tool.hatch.build.targets.wheel] packages = ["src/stringfu"]` |
| `WARNING: Sdist contains files outside src/` | committed `.venv` or `dist/` | add to `.gitignore`, run `git clean -fdX` |
| `ERROR  InvalidDistribution: README ... text/x-rst expected` | `readme` field missing or wrong content-type | set `readme = "README.md"` (auto-infers `text/markdown`) |
| `Unable to determine version from VCS` | new repo with no tags | run `git tag v0.0.0 && git push --tags`, or hard-pin `version = "0.0.0"` |
| `error: failed to find Python` | no compatible Python on PATH | `uv python install 3.11` |

---

## 3. Project Layout

```
stringfu/
├── .github/
│   └── workflows/
│       ├── ci.yml                 # lint + typecheck + tests on PR/push
│       ├── release.yml            # builds + uploads on tag push
│       └── release-please.yml     # opens release PR from conventional commits
├── .claude/
│   └── settings.json              # Claude Code hooks + allowlist
├── .cursor/
│   └── rules                      # Cursor agent rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── src/
│   └── stringfu/
│       ├── __init__.py            # public API re-exports
│       ├── _internal.py           # private helpers (underscore prefix)
│       ├── cli.py                 # optional CLI entry point
│       └── py.typed               # PEP 561 marker (empty file)
├── tests/
│   ├── __init__.py                # empty; makes tests/ importable
│   ├── conftest.py                # shared fixtures
│   ├── test_basic.py              # smoke tests for public API
│   └── test_cli.py                # subprocess tests for the CLI
├── docs/                          # optional: mkdocs source
├── .gitignore
├── .python-version                # `3.11` — uv reads this
├── AGENTS.md                      # for Codex
├── CHANGELOG.md                   # release-please writes this
├── CLAUDE.md                      # for Claude Code
├── LICENSE                        # MIT
├── README.md                      # rendered on PyPI
├── pyproject.toml                 # the only config file that matters
├── release-please-config.json
├── .release-please-manifest.json
└── uv.lock                        # committed
```

### Naming Conventions

| Artifact | Convention | Example |
|---|---|---|
| Module file | `snake_case.py` | `string_ops.py` |
| Public class | `PascalCase` | `StringBuilder` |
| Public function | `snake_case` | `to_snake_case` |
| Private helper | `_leading_underscore` | `_normalize` |
| Test file | `test_*.py` | `test_string_ops.py` |
| Test function | `test_*` | `test_to_snake_case_handles_unicode` |
| Fixture | `snake_case` | `tmp_repo` |
| CLI command | `kebab-case` | `stringfu to-snake` |
| Const | `UPPER_SNAKE` | `DEFAULT_LOCALE` |

### "If you're adding X, it goes in Y"

| Adding | Location |
|---|---|
| New public function | `src/stringfu/<topic>.py`, re-export from `src/stringfu/__init__.py` |
| Internal helper | `src/stringfu/_internal.py` (or `_<topic>.py`) |
| Type alias / Protocol | same module as the API that uses it |
| CLI subcommand | `src/stringfu/cli.py`, register on the `argparse`/`click` app |
| Unit test | `tests/test_<module>.py` |
| Integration test | `tests/integration/test_<flow>.py` |
| Shared fixture | `tests/conftest.py` |
| Test data | `tests/data/<name>.json` |
| Runtime dependency | `pyproject.toml` → `[project].dependencies` |
| Dev-only tool | `pyproject.toml` → `[dependency-groups].dev` |
| Optional install extra | `pyproject.toml` → `[project.optional-dependencies]` |
| Python-version-specific dep | `[project].dependencies` with `; python_version < "3.12"` marker |
| Documentation page | `docs/<slug>.md` |
| Example script | `examples/<name>.py` |
| Issue template | `.github/ISSUE_TEMPLATE/<name>.md` |
| Workflow | `.github/workflows/<name>.yml` |

---

## 4. Architecture

### Process Boundary (library mode)

```
+--------------------------------------------------+
|  Consumer App (someone else's code)              |
|                                                  |
|  >>> from stringfu import to_snake               |
|  >>> to_snake("HelloWorld")                      |
|                                                  |
+----------------------|---------------------------+
                       |  in-process function call
                       v
+--------------------------------------------------+
|  stringfu (our library)                          |
|                                                  |
|  __init__.py  --re-exports->  string_ops.py      |
|       ^                              |           |
|       |                              v           |
|  cli.py (subprocess)         _internal.py        |
|                                                  |
+--------------------------------------------------+
```

### Process Boundary (CLI mode)

```
+-----------+  exec  +-----------------------+  imports  +----------+
| user term |------> | stringfu (entry pt)   |---------> | stringfu |
+-----------+        | src/stringfu/cli.py   |           | core API |
                     |   main() -> argparse  |           +----------+
                     +-----------------------+
```

### Data Flow (typical call)

```
caller --> public function --> validate input --> _internal helper --> return value
   ^                                                                       |
   |---------------------------- raises typed exception <------------------|
```

### Auth Flow

n/a — libraries do not own auth. If your library *uses* a service, accept credentials as function arguments; never read env vars implicitly.

### State Management Flow

```
Library is stateless by default.
If a function needs config, accept a `Config` dataclass argument.
Never use module-level mutable globals; never call `logging.basicConfig`.
```

### Entry-point Files

| File | Responsibility |
|---|---|
| `src/stringfu/__init__.py` | Public surface area. Imports + `__all__` + `__version__`. Nothing else. |
| `src/stringfu/_internal.py` | Private helpers. Never imported by consumers. |
| `src/stringfu/cli.py` | Argparse/click entrypoint. Calls public API. Returns int exit code. |
| `pyproject.toml` | Build config, deps, scripts, lint, test config. |
| `tests/conftest.py` | Shared pytest fixtures. |

### Where Business Logic Lives / Doesn't Live

- **Lives in:** modules under `src/stringfu/`, with public functions in `__init__.__all__`.
- **Does NOT live in:** `cli.py` (which only parses argv and calls the library), `tests/` (which only verifies), or `pyproject.toml`.

---

## 5. Dev Workflow

### Start Dev "Server" (REPL + watcher)

```bash
uv run python -i -c "from stringfu import *"          # interactive REPL with library loaded
uv run pytest --looponfail                             # auto-rerun tests on change (with pytest-xdist)
```

### Hot Reload Behavior

- Libraries don't hot-reload; tests do. `uv run pytest -f` re-runs on file change (requires `pytest-watch` in dev group). Stale bytecode in `__pycache__/` rarely bites; if it does, `find . -name __pycache__ -exec rm -rf {} +`.

### Attach a Debugger

**VS Code / Cursor (`.vscode/launch.json` snippet, full file in §15):**

```json
{
  "name": "Pytest: current file",
  "type": "debugpy",
  "request": "launch",
  "module": "pytest",
  "args": ["${file}", "-x", "-s"],
  "console": "integratedTerminal",
  "justMyCode": false
}
```

**PyCharm:** Right-click the test → "Debug 'pytest in test_x'". Set interpreter to `.venv/bin/python`.

**Plain pdb:** `uv run python -m pdb -m pytest tests/test_basic.py::test_to_snake`.

### Inspect Network / Storage / State at Runtime

- Network: libraries should accept an injected client (e.g. `httpx.Client`). Inspect via the consumer app, not the library.
- Storage: `tmp_path` fixture in pytest gives an isolated dir. Inspect with `pytest -s` to keep stdout.
- State: stateless library — capture inputs/outputs in tests; do not introspect at runtime.

### Pre-commit Checks (script)

`uv run ruff format && uv run ruff check --fix && uv run ty check && uv run pytest -q`

Wired into Claude Code's `Stop` hook (see §13).

### Branch + Commit Conventions

- Trunk = `main`. Feature branches: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`.
- Commits MUST follow Conventional Commits (release-please reads them):
  - `feat: add to_snake_case helper`
  - `fix: handle empty string in to_camel_case`
  - `feat!: rename main_func to do_thing` (`!` = breaking → major bump)
  - `chore: bump dev deps`
  - `docs: clarify usage in README`

---

## 6. Testing & Parallelization

### Unit Tests

```bash
uv run pytest                                          # full run
uv run pytest tests/test_basic.py                      # one file
uv run pytest tests/test_basic.py::test_to_snake       # one test
uv run pytest -k snake                                 # by name pattern
uv run pytest --lf                                     # last-failed only
uv run pytest -x -vv                                   # stop on first failure, verbose
```

Tests live in `tests/`. Files: `test_*.py`. Functions: `test_*`. Classes: `Test*`.

### Integration Tests

`tests/integration/` — slower tests that exercise multiple modules or the CLI as a subprocess. Marked `@pytest.mark.integration`. Run with `uv run pytest -m integration`.

### "E2E" (CLI subprocess test)

CLI integration uses `subprocess.run` against the installed entry point. `pytest-xdist` runs them in parallel:

```bash
uv add --group dev pytest-xdist
uv run pytest -n auto                                  # parallel by default in CI
```

`pyproject.toml` snippet (full in §16):

```toml
[tool.pytest.ini_options]
addopts = "-ra --strict-markers --strict-config"
testpaths = ["tests"]
markers = [
  "integration: slower tests that shell out or hit the filesystem heavily",
]
```

### Mocking Rules

- **Mock:** outbound network adapters, system clock (`freezegun`), randomness (`monkeypatch.setattr(random, "random", ...)`).
- **Never mock:** the public API of `stringfu` itself; the filesystem (use `tmp_path`); `subprocess` when testing the CLI (run it for real).
- Use `pytest-mock` for `mocker.patch(...)`. Avoid `unittest.mock` directly.

### Coverage Target

`uv run pytest --cov=stringfu --cov-report=term-missing --cov-fail-under=85`

Fail the build under 85%. Configure in `pyproject.toml`:

```toml
[tool.coverage.run]
source = ["src/stringfu"]
branch = true

[tool.coverage.report]
exclude_lines = ["pragma: no cover", "if TYPE_CHECKING:", "raise NotImplementedError"]
```

### Visual Regression

n/a — text library.

### Parallelization Patterns for AI Agents

| Safe to fan out (parallel subagents) | Must be sequential (one agent) |
|---|---|
| Add 5 unrelated public functions in 5 separate modules | Anything editing `pyproject.toml` |
| Write tests for already-merged functions | Anything editing `uv.lock` |
| Update a docstring per file | Bumping the version (release-please owns it) |
| Add a new submodule + its tests | Adding/removing a runtime dependency |
| Refactor `_internal.py` AND write `tests/test_x.py` for unrelated module | Adding a CLI subcommand (touches `cli.py` + `__init__.py`) |

Rule: any file in this set is a *serialization point* — never two subagents at once: `pyproject.toml`, `uv.lock`, `src/stringfu/__init__.py`, `src/stringfu/cli.py`, `.github/workflows/*.yml`.

---

## 7. Logging

### Library Logger Setup

A library MUST NOT call `logging.basicConfig`, MUST NOT add handlers other than `NullHandler`, and MUST NOT set a level on the root logger.

```python
# src/stringfu/__init__.py
import logging
logging.getLogger(__name__).addHandler(logging.NullHandler())
```

In each module:

```python
import logging
log = logging.getLogger(__name__)        # __name__ = "stringfu.string_ops"
log.debug("normalizing %r", s)
```

### Levels and When to Use Each

| Level | Meaning | Example |
|---|---|---|
| `DEBUG` | Developer-only diagnostic, frequent | "matched regex %r at offset %d" |
| `INFO` | High-signal lifecycle | "loaded %d translation rules" |
| `WARNING` | Recoverable surprise; caller probably wants to know | "input contained NUL bytes; stripping" |
| `ERROR` | Operation failed but library kept running | "failed to read locale db; using fallback" |
| `CRITICAL` | Library unusable | rarely used in libraries; prefer raising |

### Required Fields per Log Line

For libraries, structlog/JSON is overkill. Use stdlib `%`-style formatting and let the consumer app structure logs. Required: a real exception via `log.exception(...)` for every caught error.

### Sample Log Lines

```
DEBUG    stringfu.string_ops:string_ops.py:14 normalizing 'HelloWorld'
INFO     stringfu.cli:cli.py:42 transformed 1 input(s) in 0.001s
WARNING  stringfu.string_ops:string_ops.py:88 input had unicode combining marks; NFC-normalizing
ERROR    stringfu._internal:_internal.py:12 failed to load codec table: FileNotFoundError(2, 'No such file')
```

### Where Logs Go

- **Dev:** stdout (consumer's terminal). Test runner captures via `caplog` fixture: `caplog.set_level(logging.DEBUG, logger="stringfu")`.
- **Prod:** the consumer app's logging config. Library is silent by default.

### Grep Logs Locally

n/a for the library. For the test suite: `uv run pytest -o log_cli=true -o log_cli_level=DEBUG | grep stringfu`.

---

## 8. AI Rules

### 8.1 ALWAYS

1. ALWAYS use the **src/ layout** — `src/stringfu/` — never put the package at the repo root. Prevents accidental imports of the working tree.
2. ALWAYS commit `uv.lock`. CI uses it for reproducibility.
3. ALWAYS run the self-verification recipe (§8.5) before declaring a task done.
4. ALWAYS use `uv add <pkg>` to add a runtime dep. Never edit `pyproject.toml` deps by hand.
5. ALWAYS use `uv add --group dev <pkg>` for dev tools (Ruff, pytest, ty, mypy). Never put dev tools in `[project].dependencies`.
6. ALWAYS include a `py.typed` empty marker file inside `src/stringfu/` for any library that ships type hints.
7. ALWAYS set `readme = "README.md"` in `[project]`. Hatchling auto-infers `text/markdown` content-type.
8. ALWAYS use Conventional Commits in commit messages — `feat:`, `fix:`, `feat!:`, `chore:`, `docs:`, `test:`, `refactor:`. release-please depends on them.
9. ALWAYS run `uv build && uv run twine check --strict dist/*` locally before tagging a release.
10. ALWAYS publish via PyPI Trusted Publisher (OIDC). The publish job MUST have `permissions: id-token: write`.
11. ALWAYS test against the lowest supported Python (3.11) AND the latest (3.14) in the CI matrix.
12. ALWAYS pin `pypa/gh-action-pypi-publish@release/v1` (the floating tag PyPA recommends).
13. ALWAYS expose the public surface from `src/stringfu/__init__.py` with an explicit `__all__`.
14. ALWAYS define `__version__` via `from importlib.metadata import version; __version__ = version("stringfu")`. Never hardcode it.
15. ALWAYS add a `NullHandler` on the package logger and never call `logging.basicConfig` from library code.
16. ALWAYS treat warnings as errors in CI: `pytest -W error`.
17. ALWAYS run `ruff format` then `ruff check --fix` (in that order) before committing.
18. ALWAYS verify type-correctness with `uv run ty check` (or `uv run mypy src` if ty fails on a stack you depend on).
19. ALWAYS keep the `[project.scripts]` entry point pointing at a `main()` function returning `int` for CLI exit codes.
20. ALWAYS `git tag` only via release-please-action's PR merge — never tag manually on main.
21. ALWAYS validate `pyproject.toml` after edits: `uv sync --check`.
22. ALWAYS add a row to `CHANGELOG.md` *via a `feat:`/`fix:` commit* — release-please rewrites the file; do not hand-edit.

### 8.2 NEVER

1. NEVER ship a `setup.py`, `setup.cfg`, or `MANIFEST.in`. `pyproject.toml` is the only config.
2. NEVER add packages to `[tool.uv.dev-dependencies]` (that section is legacy/uv-only). Use `[dependency-groups].dev` (PEP 735).
3. NEVER hardcode the version string in `__init__.py` or `pyproject.toml` if `hatch-vcs` is configured. Pick one source.
4. NEVER call `logging.basicConfig()`, `logging.getLogger().setLevel()`, or `logging.getLogger().addHandler()` (root logger) from library code.
5. NEVER `print(...)` from library code (CLI is allowed; library functions return values or raise).
6. NEVER import from `tests/` in `src/`. Tests depend on the library, not the reverse.
7. NEVER commit `dist/`, `build/`, `*.egg-info/`, `.venv/`, `__pycache__/`, or `.pytest_cache/`. They are in `.gitignore`.
8. NEVER use `pip install` directly inside the project — always `uv add` / `uv sync`.
9. NEVER store a PyPI API token in GitHub secrets. Use Trusted Publishing.
10. NEVER push a tag manually. release-please owns version + tag.
11. NEVER skip `twine check --strict` before publishing.
12. NEVER omit `py.typed` for a typed library — type checkers will silently ignore your hints.
13. NEVER catch `Exception` and swallow. Re-raise or raise a domain-specific exception.
14. NEVER use `from x import *` in library modules. Explicit names only.
15. NEVER write to a path outside `tmp_path` in tests.
16. NEVER modify `sys.path` from library or test code.
17. NEVER add Ruff `noqa` without a comment justifying it.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `pyproject.toml` | every command, every CI job, the wheel itself | `uv sync && uv run pytest && uv build && uv run twine check --strict dist/*` |
| `uv.lock` | reproducible installs in CI | `uv sync --frozen && uv run pytest` |
| `src/stringfu/__init__.py` | public API surface | full pytest + import-from-built-wheel smoke (§8.5 step 7) |
| `src/stringfu/cli.py` | CLI consumers | `uv run stringfu --help` exits 0; `uv run pytest tests/test_cli.py` |
| `src/stringfu/py.typed` | downstream type checking works | `uv run ty check` on a tiny consumer project; mypy verbose import logs |
| `.github/workflows/ci.yml` | every PR | open a draft PR; CI must go green |
| `.github/workflows/release.yml` | publishing | tag a `v0.0.0-rc1` on a fork, dry-run to TestPyPI |
| `.github/workflows/release-please.yml` | release PR generation | merge a `feat:` commit; release PR appears within 60s |
| `release-please-config.json` | next version computed | edit, push, watch the release PR diff |
| `.release-please-manifest.json` | pinned current version | hand-edit ONLY when re-bootstrapping |
| `tests/conftest.py` | every test | full pytest run |
| `[project.dependencies]` | runtime install on user machines | `uv pip install dist/*.whl` in a fresh venv; import package |
| `[project.optional-dependencies]` | extras users opt into | `uv pip install 'dist/*.whl[extra]'`; run extras tests |
| `[dependency-groups].dev` | dev/CI only | `uv sync --group dev`; full quality bar |
| `[project.scripts]` | the CLI entry point | reinstall, then `which stringfu && stringfu --help` |
| `[tool.hatch.version]` | how the build computes version | `uv build` and `tar tzf dist/stringfu-*.tar.gz | head` |
| `[tool.ruff]` | every file's lint state | `uv run ruff check . && uv run ruff format --check .` |
| `[tool.pytest.ini_options]` | every test run | `uv run pytest --collect-only` lists every test |
| `[tool.coverage.run]` | coverage numbers | `uv run pytest --cov` then read `coverage report` |
| `.python-version` | which Python uv picks | `uv run python -V` matches |
| `README.md` | PyPI listing page | `uv build && uv run twine check --strict dist/*` |
| `LICENSE` | metadata + legal | confirm classifier matches license file |
| `.gitignore` | repo cleanliness; what hits sdist | `git status` is clean post-build; `tar tzf dist/*.tar.gz` is small |

### 8.4 Definition of Done (per Task Type)

**Bug fix**
- [ ] Failing test reproduces the bug; commit it FIRST.
- [ ] Fix; re-run; test passes.
- [ ] `uv run ruff check && uv run ty check && uv run pytest --cov`.
- [ ] Commit message starts with `fix: `.

**New feature**
- [ ] Public API exported from `__init__.py` `__all__`.
- [ ] Type hints on every parameter and return.
- [ ] `tests/test_<feature>.py` with happy path + at least one edge case.
- [ ] README usage example added under "Usage".
- [ ] Commit `feat: `.

**Refactor**
- [ ] No public API change. If there is, it is a `feat!:` (major bump).
- [ ] All existing tests still pass with no edits.
- [ ] Coverage does not drop.
- [ ] Commit `refactor: `.

**Dependency bump**
- [ ] `uv lock --upgrade-package <name>` and commit the new `uv.lock`.
- [ ] Full quality bar passes.
- [ ] CI matrix still green on min and max Python.
- [ ] Commit `chore(deps): bump <name> to <ver>`.

**Schema change** — n/a for a stateless library. If a config dataclass changes shape, treat as a breaking change: `feat!:`.

**Copy change** (README, docstrings, error messages)
- [ ] `uv run twine check --strict dist/*` (README still renders).
- [ ] No tests need updates unless they assert on exact message strings (avoid that).
- [ ] Commit `docs: `.

### 8.5 Self-Verification Recipe

The agent MUST run this exact sequence before saying "done":

```bash
# 1. Install / sync.
uv sync --all-extras --group dev
# Expected: "Resolved N packages" and "Installed N packages" or "Audited N packages".

# 2. Format.
uv run ruff format --check .
# Expected: "N files already formatted" with exit 0.

# 3. Lint.
uv run ruff check .
# Expected: "All checks passed!" with exit 0.

# 4. Typecheck.
uv run ty check
# Expected: "Found 0 errors" or equivalent zero-error output. If ty trips on a 3rd-party stub gap, fall back: uv run mypy src

# 5. Unit + integration tests with coverage gate.
uv run pytest --cov=stringfu --cov-fail-under=85
# Expected: "N passed" and "Required test coverage of 85% reached."

# 6. Build sdist + wheel.
uv build
# Expected: dist/stringfu-<ver>.tar.gz and dist/stringfu-<ver>-py3-none-any.whl

# 7. Strict metadata + README check.
uv run --with twine twine check --strict dist/*
# Expected: "Checking dist/...: PASSED" for every file.

# 8. Smoke install in a throwaway env, then import.
uv venv .smoke && uv pip install --python .smoke/bin/python dist/*.whl
.smoke/bin/python -c "import stringfu; print(stringfu.__version__); stringfu.to_snake('HelloWorld')"
# Expected: prints version then "hello_world".
rm -rf .smoke
```

If any step is non-zero exit, STOP and fix. Do not skip.

### 8.6 Parallelization Patterns

Safe parallel fan-outs:

- "Add 3 helpers in 3 separate modules + tests" — three subagents, one per module pair.
- "Update docstrings across 10 files" — one subagent per 3-4 files.
- "Translate README to README.fr.md, README.de.md, README.es.md" — one subagent per language.

Unsafe (must be a single agent):

- Anything that edits `pyproject.toml` or `uv.lock`.
- Adding a CLI subcommand (touches `cli.py` AND `__init__.py`).
- Bumping a dependency.
- Refactoring the public surface.

---

## 9. Stack-Specific Pitfalls

1. **Flat layout shadows installed package.** Symptom: tests pass locally but a freshly-installed wheel fails `import stringfu`. Cause: `stringfu/` lives at the repo root, so `pytest` imports the source dir; the wheel is never exercised. Fix: move to `src/stringfu/`. Detect early: `uv build && uv pip install --python /tmp/v/bin/python dist/*.whl && /tmp/v/bin/python -c "import stringfu"`.

2. **Forgot `py.typed` marker.** Symptom: downstream `mypy`/`pyright` users see `error: Skipping analyzing "stringfu": module is installed, but missing library stubs or py.typed marker [import-untyped]`. Cause: PEP 561 requires the empty file. Fix: `touch src/stringfu/py.typed` and ensure hatchling includes it (it does for files inside the package). Detect: build the wheel and `unzip -l dist/*.whl | grep py.typed`.

3. **Hardcoded version drifts from Git tag.** Symptom: PyPI says 0.4.2, code says 0.3.1. Cause: someone wrote `__version__ = "0.3.1"` while `hatch-vcs` is also enabled. Fix: pick ONE source — `hatch-vcs` (recommended). In `__init__.py` use `from importlib.metadata import version; __version__ = version("stringfu")`. Detect: `python -c "import stringfu; print(stringfu.__version__)"` matches `git describe --tags`.

4. **README renders as "????" on PyPI.** Symptom: PyPI page shows raw markdown or `text/x-rst` parse errors. Cause: missing or wrong content-type. Fix: in `[project]`, `readme = "README.md"`. Hatchling infers `text/markdown` from the `.md` extension. Detect: `twine check --strict dist/*` BEFORE publishing.

5. **Runtime dep accidentally in dev group.** Symptom: users install the package, import it, and get `ModuleNotFoundError`. Cause: ran `uv add --group dev <pkg>` instead of `uv add <pkg>`. Detect: `uv pip install dist/*.whl` in a fresh venv, then `python -c "import stringfu"` — fails fast.

6. **Dev tools in `[project.dependencies]`.** Symptom: end users transitively install pytest, ruff, ty. Cause: lazy `uv add ruff` instead of `uv add --group dev ruff`. Detect: `tar tzf dist/*.tar.gz | grep PKG-INFO | xargs -I {} tar -xOf dist/*.tar.gz {} | grep Requires-Dist`.

7. **`dist/` committed to git.** Symptom: massive PRs, sdist contains stale `dist/` recursively. Cause: missing `.gitignore` line. Fix: add `dist/`, `build/`, `*.egg-info/` to `.gitignore`; run `git rm -r --cached dist build *.egg-info`. Detect: `git ls-files | grep -E '(^|/)dist/'` returns nothing.

8. **Publishing to PyPI without configuring Trusted Publisher first.** Symptom: GitHub Action exits with `403 Forbidden` from PyPI. Cause: PyPI doesn't know about your repo/workflow. Fix: pre-create a "pending publisher" on PyPI (project name, owner, repo, workflow filename, environment) before the first release. Detect: read the action error; the URL in the error points at the right config page.

9. **Using legacy `setup.py upload` or `twine upload` with an API token.** Symptom: works once, then leaks if the repo goes public. Fix: switch to `pypa/gh-action-pypi-publish@release/v1` with `id-token: write`. Detect: a token in `secrets` that starts with `pypi-` is a smell.

10. **Forgetting to test on Python 3.11 (the floor).** Symptom: a 3.12-only syntax (`type X = ...`) sneaks in; users on 3.11 get `SyntaxError`. Fix: matrix CI on `[3.11, 3.12, 3.13, 3.14]`. Detect: CI fails the moment the bad syntax lands.

11. **`uv.lock` not committed.** Symptom: CI installs different versions than your laptop; flaky failures. Fix: commit `uv.lock`. Add `uv sync --frozen` to CI. Detect: `git status` shows `uv.lock` as untracked.

12. **CLI not installable.** Symptom: `pip install stringfu && stringfu --help` → "command not found". Cause: forgot `[project.scripts]`. Fix: `[project.scripts] stringfu = "stringfu.cli:main"`. Detect: install in a fresh venv and run.

13. **Logging configured at import time.** Symptom: consumer apps see double log output, or your logs land in their stderr at INFO. Cause: `logging.basicConfig()` in `__init__.py`. Fix: use `NullHandler` only. Detect: `caplog`-based test that asserts no handlers other than `NullHandler` are added.

14. **Ruff format vs lint conflict.** Symptom: format keeps re-introducing changes that lint rejects, or vice-versa. Cause: outdated config. Fix: `uv run ruff format` first, `uv run ruff check --fix` second; never the reverse. Detect: pre-commit hook in §13 enforces order.

15. **Wheel includes tests.** Symptom: bloated wheel; consumer's site-packages has `tests/` directory. Cause: tests live next to the package or hatchling globs include them. Fix: keep tests outside `src/`; hatchling defaults exclude `tests/`. Detect: `unzip -l dist/*.whl | grep tests/` is empty.

16. **TestPyPI publish blocked because version already used.** Symptom: 400 "File already exists". Cause: PyPI/TestPyPI never allow re-uploading the same version. Fix: bump version (let release-please do it) or use post-releases for testing on TestPyPI. Detect: the action's error message is explicit.

---

## 10. Performance Budgets

- **Cold import time:** `< 50 ms` for `import stringfu` on Python 3.13. Measure: `uv run python -X importtime -c "import stringfu" 2>&1 | tail -1`. If exceeded: defer heavy imports inside the functions that need them.
- **CLI startup:** `< 100 ms` for `stringfu --help`. Measure: `hyperfine 'uv run stringfu --help'`. If exceeded: lazy-import; avoid argparse subparsers fanning out at import time.
- **Wheel size:** `< 100 KB` for a small util. Measure: `ls -la dist/*.whl`. If exceeded: audit `[tool.hatch.build]` for accidentally-included data files; ensure `tests/` and `docs/` are not packaged.
- **Sdist size:** `< 200 KB`. Measure: `ls -la dist/*.tar.gz`. If exceeded: same audit.
- **Memory at idle import:** baseline + `< 5 MB`. Measure: `mprof run --include-children python -c "import stringfu; input()"`.

---

## 11. Security

### Secret Storage

- The library has NO secrets at build time. There MUST NOT be any token in this repo.
- The runtime's caller is responsible for any credentials. Functions accept them as arguments.
- GitHub Actions never holds a PyPI token. Trusted Publishing handles auth via OIDC short-lived tokens (≤15 min lifetime).

### Auth Threat Model

n/a. The library has no users, sessions, or roles.

### Input Validation Boundary

Validate at the public-function boundary (`src/stringfu/__init__.py` exports). Inside `_internal.py`, trust inputs (you wrote both ends).

```python
def to_snake(value: str) -> str:
    if not isinstance(value, str):
        raise TypeError(f"to_snake expected str, got {type(value).__name__}")
    return _internal._normalize_to_snake(value)
```

### Output Escaping Rules

- If your library produces SQL, HTML, shell, etc., document the escaping responsibility in the docstring. Default: return raw strings; do not "be smart" with escaping.

### Permissions / Capabilities

n/a — pure Python library, no native syscalls beyond what stdlib does.

### Dependency Audit

```bash
uv run --with pip-audit pip-audit -r <(uv export --no-hashes)
```

Cadence: on every dependency bump and weekly via Dependabot (configured in §16).

### Top 5 Risks

1. **Credential leakage via bad token storage.** Mitigation: Trusted Publishing only.
2. **Typosquatting (`stringfu` vs `stringfoo`).** Mitigation: claim related names; pin in CI when consuming similar libs.
3. **Supply chain via dev deps.** Mitigation: `pip-audit` weekly; `uv sync --frozen` in CI.
4. **Malicious post-release modification.** Mitigation: Sigstore attestations are on by default in 2026 trusted publishing; verify on consumer side.
5. **`pickle` / `eval` in user-controlled paths.** Mitigation: never use them; lint rule `S301`/`S307` (Bandit via Ruff `S` prefix).

---

## 12. Deploy (Publish to PyPI)

### Full Release Flow, Command-by-Command

The flow is fully automated. The human only merges a PR.

1. Developer commits with Conventional Commits and pushes to `main`.
2. `release-please.yml` opens (or updates) a "Release PR" titled `chore(main): release stringfu 1.4.0`. The PR bumps `.release-please-manifest.json` and rewrites `CHANGELOG.md`.
3. Reviewer merges the Release PR.
4. `release-please.yml` re-runs, sees the merged release commit, and pushes the tag `v1.4.0`.
5. The tag push triggers `release.yml`:
   1. Builds the project with `uv build`.
   2. Runs `twine check --strict`.
   3. Uploads to PyPI via `pypa/gh-action-pypi-publish@release/v1` using OIDC. Sigstore attestations are generated automatically.
6. Done. Within ~30s the release is on PyPI.

### Manual Override (rarely needed — emergencies only)

```bash
# Only if release-please is broken AND you have a tag-permissioned env.
uv build
uv run --with twine twine check --strict dist/*
uv run --with twine twine upload dist/*    # requires API token; avoid this path
```

### Staging vs Prod

- **TestPyPI (staging):** the `release.yml` workflow has a manual `workflow_dispatch` that publishes to TestPyPI environment.
- **PyPI (prod):** triggered only by tag push from release-please.

### Rollback

PyPI does NOT allow deleting a release in a way that lets you re-upload the same version number (yanking removes from default resolution but version is permanently consumed). To roll back:

```bash
# 1. Yank the bad release.
gh api -X POST /repos/<owner>/stringfu/releases ...     # via web UI: pypi.org/manage/project/stringfu/release/<ver>/
# OR: pip install pypi-cli && pypi-cli yank stringfu 1.4.0 --reason "broken on Python 3.11"

# 2. Bump and re-release a fixed version.
# Append a fix: commit; merge release PR; new tag fires.
```

Max safe rollback window: until the first user installs it. After that, treat the bad version as poisoned and ship a patch.

### Health Check

```bash
# After publish, verify the release is installable.
uv venv .check && uv pip install --python .check/bin/python --index-url https://pypi.org/simple/ stringfu==<new-version>
.check/bin/python -c "import stringfu; assert stringfu.__version__ == '<new-version>'"
rm -rf .check
```

### Versioning Scheme

- Semver via release-please: `feat:` → minor, `fix:` → patch, `feat!:` or `BREAKING CHANGE:` footer → major. Pre-1.0, breaking changes bump minor unless `bump-minor-pre-major: false` is set.
- Source of truth at runtime: `importlib.metadata.version("stringfu")`.

### Auto-Update / Store Submission

- PyPI is the "store". Trusted Publishing means store submission is a `git push` of a tag.
- Users update via `pip install -U stringfu` or `uv add stringfu --upgrade`.

### DNS / Domain

n/a. PyPI handles `https://pypi.org/project/stringfu/`.

### Cost per 1k MAU

$0. PyPI hosting is free. GitHub Actions free tier covers the publishing workflow (~30s per release).

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# CLAUDE.md — stringfu

This is a Python library published to PyPI. Read `pypi-package.md` (the rulebook) for the full ruleset. The summary:

## Source of Truth
- ALL config lives in `pyproject.toml`. No setup.py, setup.cfg, or MANIFEST.in.
- Versions come from Git tags via `hatch-vcs`. Never hardcode a version.

## Daily Commands
- Install / sync deps: `uv sync --group dev`
- Run tests: `uv run pytest`
- Run a single test: `uv run pytest tests/test_basic.py::test_to_snake`
- Format + lint: `uv run ruff format . && uv run ruff check --fix .`
- Typecheck: `uv run ty check`  (fallback `uv run mypy src`)
- Build: `uv build`
- Strict check: `uv run --with twine twine check --strict dist/*`

## ALWAYS
- src/ layout. Package lives at `src/stringfu/`.
- `py.typed` empty marker file inside the package.
- Conventional Commits (`feat:`, `fix:`, `feat!:`, `chore:`, `docs:`, `test:`).
- Run the §8.5 self-verification recipe before saying "done".

## NEVER
- Never call `logging.basicConfig` in library code.
- Never `pip install` directly. Use `uv add`.
- Never tag manually. release-please owns versions.
- Never put dev tools in `[project.dependencies]`.
- Never add a PyPI API token to GitHub. Use Trusted Publishing.

## Banned Patterns (grep before commit)
- `print(` in `src/` (CLI may print; library may not)
- `logging.basicConfig` anywhere in `src/`
- `setup(` (no setup.py)
- `noqa` without an inline justification

## Skills to Use
- `/test-driven-development` before adding any function.
- `/systematic-debugging` for bug fixes.
- `/verification-before-completion` before marking a task done.
- `/ship` to open the PR.
```

### `.claude/settings.json` (paste-ready)

```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "uv run ruff format $CLAUDE_FILE_PATHS 2>/dev/null; uv run ruff check --fix $CLAUDE_FILE_PATHS 2>/dev/null; true"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "uv run ruff format --check . && uv run ruff check . && uv run ty check && uv run pytest -q"
          }
        ]
      }
    ]
  },
  "permissions": {
    "allow": [
      "Bash(uv sync*)",
      "Bash(uv run pytest*)",
      "Bash(uv run ruff*)",
      "Bash(uv run ty*)",
      "Bash(uv run mypy*)",
      "Bash(uv run python*)",
      "Bash(uv add*)",
      "Bash(uv remove*)",
      "Bash(uv lock*)",
      "Bash(uv build*)",
      "Bash(uv venv*)",
      "Bash(uv pip*)",
      "Bash(uv export*)",
      "Bash(uv tree*)",
      "Bash(uv python*)",
      "Bash(git status*)",
      "Bash(git diff*)",
      "Bash(git log*)",
      "Bash(git add*)",
      "Bash(git commit*)",
      "Bash(git push*)",
      "Bash(git branch*)",
      "Bash(git checkout*)",
      "Bash(gh pr*)",
      "Bash(gh repo*)",
      "Bash(gh run*)",
      "Bash(ls*)",
      "Bash(cat*)",
      "Bash(rg*)",
      "Bash(find*)",
      "Bash(tar*)",
      "Bash(unzip -l*)"
    ]
  }
}
```

### Recommended Skills

- `/test-driven-development` — write the failing test first when adding any public function.
- `/systematic-debugging` — for bug fixes; commit a failing test before the fix.
- `/verification-before-completion` — run the §8.5 recipe before claiming done.
- `/ship` — open the PR with conventional-commit title.
- `/review` — pre-merge review of the diff against `main`.

### Slash Command Shortcuts

- `/build-and-check` — runs `uv build && uv run --with twine twine check --strict dist/*`.
- `/release-dry-run` — opens a PR with a `feat:` commit on a throwaway branch to preview release-please's bump.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# AGENTS.md — stringfu

## Stack
Python library. uv-managed. hatchling build backend. src/ layout. Published to PyPI via OIDC trusted publishing. See `pypi-package.md` for full rules.

## Run-Anything Recipes
- Install: `uv sync --group dev`
- Test: `uv run pytest`
- Lint+Format: `uv run ruff format . && uv run ruff check --fix .`
- Typecheck: `uv run ty check`
- Build: `uv build`
- Strict metadata: `uv run --with twine twine check --strict dist/*`
- Self-verification recipe: §8.5 of pypi-package.md (in this repo).

## Hard Rules
1. Use `uv add` and `uv add --group dev`. Never edit `[project.dependencies]` by hand.
2. Conventional commits required. release-please reads them.
3. Never hardcode `__version__`. Source it from `importlib.metadata`.
4. `py.typed` marker file MUST be present in `src/stringfu/`.
5. The library MUST NOT call `logging.basicConfig`.

## Codex-Specific Notes
- Codex's network sandbox is fine for `uv sync` — uv resolves from PyPI only on first run.
- Disable `--full-auto` for `uv add` and any `git push`/`git tag` commands. Approve them.
- Codex: prefer `python -m pytest` over `uv run pytest` only if uv is unavailable.
```

### `.codex/config.toml`

```toml
model = "gpt-5-codex"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[mcp_servers]

[shell_environment_policy]
inherit = "core"

[[projects]]
trust_level = "trusted"
path = "."
```

### Codex vs Claude Code Differences

- Codex defaults to a more aggressive sandbox; you may need to approve `uv sync` once.
- Codex does not have built-in slash commands like `/ship`; replicate via shell scripts under `scripts/`.
- Codex tends to forget `uv` and reach for `pip`. Hard rule in `AGENTS.md` above.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# stringfu — Cursor rules

ALWAYS:
- Use `uv add <pkg>` for runtime deps; `uv add --group dev <pkg>` for dev tools.
- Use src/ layout. Package source under src/stringfu/.
- Type-annotate every public function. py.typed marker is shipped.
- Use Conventional Commits (feat:, fix:, feat!:, chore:, docs:, test:, refactor:).
- Run `uv run ruff format . && uv run ruff check --fix .` before any commit.
- Run `uv run ty check` before any commit.
- Run `uv run pytest --cov=stringfu --cov-fail-under=85` before any commit.
- Use `tmp_path` fixture in tests; never write outside it.
- Source __version__ from `importlib.metadata.version("stringfu")`.

NEVER:
- Never write a setup.py, setup.cfg, or MANIFEST.in.
- Never call `logging.basicConfig` in library code (src/).
- Never `print(` in library modules. CLI is allowed (src/stringfu/cli.py).
- Never hardcode the version string.
- Never push tags manually — release-please owns version + tag.
- Never use `pip install` directly inside the project.
- Never store a PyPI API token in GitHub Secrets.
- Never put dev tools (pytest, ruff, ty, mypy) in [project.dependencies].
- Never use `from X import *` in library modules.
- Never modify `sys.path`.

WHEN ASKED TO ADD A FEATURE:
1. Add the public function to a new or existing module under src/stringfu/.
2. Re-export from src/stringfu/__init__.py and add to __all__.
3. Add tests in tests/test_<module>.py covering happy path + at least one edge.
4. Add a usage snippet to README.md under "## Usage".
5. Commit with `feat: <one-line description>`.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ms-python.python",
    "ms-python.vscode-pylance",
    "charliermarsh.ruff",
    "astral-sh.ty",
    "tamasfe.even-better-toml",
    "github.vscode-github-actions",
    "github.vscode-pull-request-github"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Pytest: current file",
      "type": "debugpy",
      "request": "launch",
      "module": "pytest",
      "args": ["${file}", "-x", "-s"],
      "console": "integratedTerminal",
      "justMyCode": false
    },
    {
      "name": "Pytest: all",
      "type": "debugpy",
      "request": "launch",
      "module": "pytest",
      "args": ["-q"],
      "console": "integratedTerminal",
      "justMyCode": false
    },
    {
      "name": "CLI: stringfu --help",
      "type": "debugpy",
      "request": "launch",
      "module": "stringfu.cli",
      "args": ["--help"],
      "console": "integratedTerminal"
    }
  ]
}
```

### `.vscode/settings.json`

```json
{
  "python.defaultInterpreterPath": ".venv/bin/python",
  "[python]": {
    "editor.formatOnSave": true,
    "editor.defaultFormatter": "charliermarsh.ruff",
    "editor.codeActionsOnSave": {
      "source.fixAll.ruff": "explicit",
      "source.organizeImports.ruff": "explicit"
    }
  }
}
```

---

## 16. First-PR Scaffold

Create these files in order. After the last one, `git push` and CI goes green.

### 1. `.gitignore`

```gitignore
# Build artifacts
dist/
build/
*.egg-info/
*.egg

# Bytecode + caches
__pycache__/
*.py[cod]
*$py.class

# Test / tool caches
.pytest_cache/
.ruff_cache/
.mypy_cache/
.ty_cache/
htmlcov/
.coverage
.coverage.*
coverage.xml

# Virtual envs
.venv/
venv/
env/

# uv
.uv-cache/

# IDEs
.idea/
.vscode/*
!.vscode/extensions.json
!.vscode/launch.json
!.vscode/settings.json
*.swp
.DS_Store

# Environment
.env
.env.local
.envrc
```

### 2. `.python-version`

```
3.11
```

### 3. `pyproject.toml`

```toml
[build-system]
requires = ["hatchling>=1.29", "hatch-vcs>=0.4"]
build-backend = "hatchling.build"

[project]
name = "stringfu"
description = "Tiny string utilities for Python."
readme = "README.md"
license = { file = "LICENSE" }
authors = [{ name = "Your Name", email = "you@example.com" }]
requires-python = ">=3.11"
dynamic = ["version"]
keywords = ["string", "utilities", "snake-case", "kebab-case"]
classifiers = [
  "Development Status :: 4 - Beta",
  "Intended Audience :: Developers",
  "License :: OSI Approved :: MIT License",
  "Operating System :: OS Independent",
  "Programming Language :: Python",
  "Programming Language :: Python :: 3",
  "Programming Language :: Python :: 3 :: Only",
  "Programming Language :: Python :: 3.11",
  "Programming Language :: Python :: 3.12",
  "Programming Language :: Python :: 3.13",
  "Programming Language :: Python :: 3.14",
  "Topic :: Software Development :: Libraries",
  "Typing :: Typed",
]
dependencies = []

[project.optional-dependencies]
# User-facing extras go here, e.g. `pip install 'stringfu[fast]'`.
fast = []

[project.urls]
Homepage = "https://github.com/youruser/stringfu"
Issues = "https://github.com/youruser/stringfu/issues"
Changelog = "https://github.com/youruser/stringfu/blob/main/CHANGELOG.md"

[project.scripts]
stringfu = "stringfu.cli:main"

[dependency-groups]
dev = [
  "pytest>=9.0.3",
  "pytest-cov>=7.1.0",
  "pytest-mock>=3.14",
  "pytest-xdist>=3.6",
  "ruff>=0.13",
  "ty>=0.0.1a1; python_version >= '3.11'",
  "mypy>=1.18",
  "twine>=5.0",
  "coverage[toml]>=7.13",
]

[tool.hatch.version]
source = "vcs"

[tool.hatch.build.hooks.vcs]
version-file = "src/stringfu/_version.py"

[tool.hatch.build.targets.wheel]
packages = ["src/stringfu"]

[tool.hatch.build.targets.sdist]
include = [
  "src/",
  "tests/",
  "README.md",
  "LICENSE",
  "CHANGELOG.md",
  "pyproject.toml",
]
exclude = [
  "**/*.pyc",
  "**/__pycache__",
  "dist",
  "build",
  ".venv",
  ".github",
]

[tool.ruff]
target-version = "py311"
line-length = 100
src = ["src", "tests"]

[tool.ruff.lint]
select = [
  "E", "W",        # pycodestyle
  "F",             # pyflakes
  "I",             # isort
  "B",             # flake8-bugbear
  "UP",            # pyupgrade
  "S",             # bandit
  "RUF",           # ruff-specific
  "SIM",           # flake8-simplify
  "TCH",           # flake8-type-checking
]
ignore = [
  "S101",          # asserts are fine in tests
]

[tool.ruff.lint.per-file-ignores]
"tests/**" = ["S101", "S603", "S607"]

[tool.ruff.format]
quote-style = "double"
indent-style = "space"
docstring-code-format = true

[tool.pytest.ini_options]
addopts = "-ra --strict-markers --strict-config -W error"
testpaths = ["tests"]
markers = [
  "integration: slower tests that shell out or hit the filesystem heavily",
]
xfail_strict = true

[tool.coverage.run]
source = ["src/stringfu"]
branch = true

[tool.coverage.report]
exclude_lines = [
  "pragma: no cover",
  "if TYPE_CHECKING:",
  "raise NotImplementedError",
  "if __name__ == .__main__.:",
]
show_missing = true
skip_covered = false

[tool.ty.src]
include = ["src", "tests"]

[tool.mypy]
python_version = "3.11"
strict = true
warn_unreachable = true
warn_redundant_casts = true
warn_unused_ignores = true
files = ["src", "tests"]
```

### 4. `src/stringfu/__init__.py`

```python
"""stringfu — tiny string utilities."""

from __future__ import annotations

import logging
from importlib.metadata import PackageNotFoundError, version

from stringfu._internal import _normalize_to_snake

__all__ = ["__version__", "to_snake"]

logging.getLogger(__name__).addHandler(logging.NullHandler())

try:
    __version__: str = version("stringfu")
except PackageNotFoundError:
    __version__ = "0.0.0+unknown"


def to_snake(value: str) -> str:
    """Convert ``value`` to ``snake_case``.

    >>> to_snake("HelloWorld")
    'hello_world'
    """
    if not isinstance(value, str):
        raise TypeError(f"to_snake expected str, got {type(value).__name__}")
    return _normalize_to_snake(value)
```

### 5. `src/stringfu/_internal.py`

```python
"""Internal helpers — not part of the public API."""

from __future__ import annotations

import re

_CAMEL_BOUNDARY = re.compile(r"(?<=[a-z0-9])(?=[A-Z])|(?<=[A-Z])(?=[A-Z][a-z])")


def _normalize_to_snake(value: str) -> str:
    if not value:
        return value
    parts = _CAMEL_BOUNDARY.split(value)
    return "_".join(p.lower() for p in parts if p)
```

### 6. `src/stringfu/cli.py`

```python
"""Optional CLI for stringfu."""

from __future__ import annotations

import argparse
import sys
from collections.abc import Sequence

from stringfu import __version__, to_snake


def main(argv: Sequence[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="stringfu", description="String utilities.")
    parser.add_argument("--version", action="version", version=f"stringfu {__version__}")
    sub = parser.add_subparsers(dest="cmd", required=True)

    snake = sub.add_parser("to-snake", help="convert to snake_case")
    snake.add_argument("text")

    args = parser.parse_args(argv)

    if args.cmd == "to-snake":
        sys.stdout.write(to_snake(args.text) + "\n")
        return 0
    return 1
```

### 7. `src/stringfu/py.typed`

(empty file — required by PEP 561)

### 8. `tests/__init__.py`

(empty file)

### 9. `tests/conftest.py`

```python
"""Shared pytest fixtures."""

from __future__ import annotations

import pytest


@pytest.fixture(autouse=True)
def _no_stray_handlers(caplog: pytest.LogCaptureFixture) -> None:
    """Library MUST NOT add handlers other than NullHandler."""
    import logging

    handlers = logging.getLogger("stringfu").handlers
    assert all(
        isinstance(h, (logging.NullHandler, type(caplog.handler))) for h in handlers
    ), f"unexpected handlers on stringfu logger: {handlers!r}"
```

### 10. `tests/test_basic.py`

```python
"""Smoke tests for the public API."""

from __future__ import annotations

import pytest

import stringfu


def test_version_is_a_string() -> None:
    assert isinstance(stringfu.__version__, str)
    assert len(stringfu.__version__) > 0


@pytest.mark.parametrize(
    ("given", "expected"),
    [
        ("HelloWorld", "hello_world"),
        ("helloWorld", "hello_world"),
        ("HTTPServer", "http_server"),
        ("simple", "simple"),
        ("", ""),
    ],
)
def test_to_snake(given: str, expected: str) -> None:
    assert stringfu.to_snake(given) == expected


def test_to_snake_rejects_non_string() -> None:
    with pytest.raises(TypeError, match="expected str"):
        stringfu.to_snake(123)  # type: ignore[arg-type]
```

### 11. `tests/test_cli.py`

```python
"""Subprocess tests for the CLI entry point."""

from __future__ import annotations

import subprocess
import sys


def test_cli_help() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "stringfu.cli", "--help"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0
    assert "stringfu" in result.stdout.lower()


def test_cli_to_snake() -> None:
    result = subprocess.run(
        [sys.executable, "-m", "stringfu.cli", "to-snake", "HelloWorld"],
        capture_output=True,
        text=True,
        check=False,
    )
    assert result.returncode == 0
    assert result.stdout.strip() == "hello_world"
```

### 12. `README.md`

```markdown
# stringfu

Tiny, well-typed string utilities for Python 3.11+.

## Install

```bash
pip install stringfu
# or with uv
uv add stringfu
```

## Usage

```python
from stringfu import to_snake

to_snake("HelloWorld")    # -> 'hello_world'
to_snake("HTTPServer")    # -> 'http_server'
```

## CLI

```bash
stringfu to-snake HelloWorld
# hello_world
```

## License

MIT.
```

### 13. `LICENSE` (MIT)

```
MIT License

Copyright (c) <year> <owner>

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

### 14. `CHANGELOG.md`

```markdown
# Changelog

All notable changes documented here. Generated by release-please.
```

### 15. `release-please-config.json`

```json
{
  "release-type": "python",
  "bump-minor-pre-major": true,
  "bump-patch-for-minor-pre-major": false,
  "draft": false,
  "prerelease": false,
  "include-component-in-tag": false,
  "include-v-in-tag": true,
  "packages": {
    ".": {
      "package-name": "stringfu",
      "changelog-path": "CHANGELOG.md"
    }
  }
}
```

### 16. `.release-please-manifest.json`

```json
{
  ".": "0.1.0"
}
```

### 17. `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches: [main]

permissions:
  contents: read

concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  quality:
    runs-on: ubuntu-latest
    strategy:
      fail-fast: false
      matrix:
        python: ["3.11", "3.12", "3.13", "3.14"]
    steps:
      - uses: actions/checkout@v4
      - uses: astral-sh/setup-uv@v6
        with:
          enable-cache: true
      - run: uv python install ${{ matrix.python }}
      - run: uv sync --frozen --group dev
      - run: uv run ruff format --check .
      - run: uv run ruff check .
      - run: uv run ty check
        continue-on-error: true
      - run: uv run mypy src
      - run: uv run pytest --cov=stringfu --cov-report=xml --cov-fail-under=85 -n auto
      - run: uv build
      - run: uv run --with twine twine check --strict dist/*
```

### 18. `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    tags:
      - "v*"
  workflow_dispatch:
    inputs:
      target:
        description: "Where to publish"
        required: true
        default: "testpypi"
        type: choice
        options:
          - testpypi
          - pypi

permissions:
  contents: read

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: astral-sh/setup-uv@v6
      - run: uv python install 3.12
      - run: uv build
      - run: uv run --with twine twine check --strict dist/*
      - uses: actions/upload-artifact@v4
        with:
          name: dist
          path: dist/

  publish-testpypi:
    needs: build
    if: github.event_name == 'workflow_dispatch' && inputs.target == 'testpypi'
    runs-on: ubuntu-latest
    environment:
      name: testpypi
      url: https://test.pypi.org/p/stringfu
    permissions:
      id-token: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - uses: pypa/gh-action-pypi-publish@release/v1
        with:
          repository-url: https://test.pypi.org/legacy/

  publish-pypi:
    needs: build
    if: github.event_name == 'push' && startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    environment:
      name: pypi
      url: https://pypi.org/p/stringfu
    permissions:
      id-token: write
    steps:
      - uses: actions/download-artifact@v4
        with:
          name: dist
          path: dist/
      - uses: pypa/gh-action-pypi-publish@release/v1
```

### 19. `.github/workflows/release-please.yml`

```yaml
name: release-please

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    steps:
      - uses: googleapis/release-please-action@v4
        with:
          config-file: release-please-config.json
          manifest-file: .release-please-manifest.json
```

### 20. `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "pip"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "chore(deps)"
  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
    commit-message:
      prefix: "chore(deps)"
```

After all 20 files exist:

```bash
git init
git add .
git commit -m "chore: initial scaffold"
gh repo create stringfu --public --source=. --push
git tag v0.1.0
git push --tags
```

CI goes green. The `Release` workflow uploads to PyPI (after Trusted Publisher is configured).

---

## 17. Idea → MVP Path (using `stringfu` as the example product)

### Phase 1 — Schema (1 AI session, ~30 min)

- Files touched: `src/stringfu/__init__.py`, `src/stringfu/_internal.py`.
- Define the public surface: `to_snake`, `to_camel`, `to_kebab`, `to_pascal`, all `(str) -> str`.
- Define internal helper signature (`_normalize_to_snake`).
- Exit criteria: `__all__` lists every function; type checker green; no implementations yet (use `raise NotImplementedError`).

### Phase 2 — Backbone (1 session)

- Files touched: `src/stringfu/cli.py`, `tests/test_basic.py`, `tests/test_cli.py`.
- Add CLI subcommands matching every public function.
- Add one passing test per function asserting on `NotImplementedError` (so Phase 3 can flip them).
- Exit criteria: `uv run stringfu --help` lists every subcommand; CI green.

### Phase 3 — Vertical Slice (2 sessions)

- Files touched: `src/stringfu/_internal.py`, `tests/test_basic.py`, `README.md`.
- Implement `to_snake` end-to-end with full unicode + edge case test coverage (≥10 cases).
- Update README "Usage" to reflect `to_snake` is real.
- Exit criteria: `to_snake` is fully tested, the rest still raise. Coverage ≥85% on shipped code.

### Phase 4 — Auth + Multi-User

n/a for a stateless library. Reframe as: **Stability Hardening.**

- Add `pyproject.toml` Python matrix CI (3.11–3.14).
- Add `pytest -W error`, `ruff` strict rules, `coverage --fail-under=85`.
- Run `pip-audit` once.
- Exit criteria: CI matrix all green; security audit clean.

### Phase 5 — Ship + Monitor (1 session)

- Configure Trusted Publisher on PyPI and TestPyPI (one-time, manual).
- Tag `v0.1.0`. Watch the release workflow run.
- Verify install: `uv venv /tmp/v && uv pip install --python /tmp/v/bin/python stringfu`.
- Set up Dependabot.
- Exit criteria: package on PyPI; install works; README renders; Sigstore attestation visible.

---

## 18. Feature Recipes

### Recipe 1 — Add a New Public Function

1. `uv run python -c "import stringfu; print(stringfu.__all__)"` — confirm current surface.
2. Create or edit `src/stringfu/<topic>.py`.
3. Edit `src/stringfu/__init__.py`: add `from stringfu.<topic> import new_func`; append `"new_func"` to `__all__`.
4. Add `tests/test_<topic>.py` with happy + edge cases.
5. Update `README.md` "Usage".
6. Commit `feat: add <new_func>`.

### Recipe 2 — Add a CLI Subcommand

```python
# src/stringfu/cli.py — inside main()
kebab = sub.add_parser("to-kebab", help="convert to kebab-case")
kebab.add_argument("text")
# ... and dispatch:
if args.cmd == "to-kebab":
    sys.stdout.write(to_kebab(args.text) + "\n")
    return 0
```

Add a subprocess test in `tests/test_cli.py` mirroring `test_cli_to_snake`.

### Recipe 3 — Add an Optional Dependency Group

```bash
uv add 'regex>=2024.0' --optional fast
```

Then in `pyproject.toml`:

```toml
[project.optional-dependencies]
fast = ["regex>=2024.0"]
```

User installs via `pip install 'stringfu[fast]'`.

### Recipe 4 — Add a Dev Tool

```bash
uv add --group dev pre-commit
```

### Recipe 5 — Pin to a Specific Python at Build Time

```toml
[project]
requires-python = ">=3.11,<3.15"
```

### Recipe 6 — File Upload / Storage

n/a for a string-utility library. Use case: a wrapper around `pathlib.Path`. Keep file I/O at the API boundary; never inside `_internal.py`.

### Recipe 7 — Stripe / IAP Payments

n/a — libraries don't take payments.

### Recipe 8 — Push Notifications

n/a — libraries don't push.

### Recipe 9 — Background Jobs / Cron

n/a — caller's responsibility. If you need to schedule periodic work *inside the library*, you're building an app; reframe.

### Recipe 10 — Realtime / Search / i18n / Dark Mode / Analytics

All n/a for a pure utility library. Add concrete recipes when extending into a domain-specific library (e.g. an HTTP client).

### Recipe 11 — Add a Pre-commit Hook

`.pre-commit-config.yaml`:

```yaml
repos:
  - repo: https://github.com/astral-sh/ruff-pre-commit
    rev: v0.13.0
    hooks:
      - id: ruff-format
      - id: ruff
        args: [--fix]
  - repo: local
    hooks:
      - id: ty
        name: ty
        entry: uv run ty check
        language: system
        types: [python]
        pass_filenames: false
      - id: pytest
        name: pytest
        entry: uv run pytest -q
        language: system
        types: [python]
        pass_filenames: false
        stages: [pre-push]
```

Then: `uv run pre-commit install && uv run pre-commit install --hook-type pre-push`.

### Recipe 12 — Generate Docs with mkdocs

```bash
uv add --group dev mkdocs mkdocs-material mkdocstrings[python]
uv run mkdocs new .
```

Add `mkdocs.yml`:

```yaml
site_name: stringfu
theme:
  name: material
plugins:
  - search
  - mkdocstrings
nav:
  - Home: index.md
  - API: api.md
```

Build with `uv run mkdocs build`. Deploy with `uv run mkdocs gh-deploy`.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `error: Failed to spawn: 'python'` | `uv python install 3.11`, then `uv sync` |
| `ModuleNotFoundError: No module named 'stringfu'` (in tests) | confirm `[tool.hatch.build.targets.wheel] packages = ["src/stringfu"]`; run `uv pip install -e .` |
| `ImportError: cannot import name '__version__' from 'stringfu'` | `git tag v0.0.0 && git push --tags`, or run from a checkout WITH `.git` |
| `error: failed to determine version` (hatch-vcs) | repo has no tags AND no fallback. Set `[tool.hatch.version] fallback-version = "0.0.0+local"` |
| `twine: Description has syntax errors in markup` | bad RST. Set `readme = "README.md"` (auto-infers markdown) |
| `pypi-publish: 403 Forbidden` | Trusted Publisher not configured for this exact owner+repo+workflow. Fix the pending publisher entry on PyPI. |
| `pypi-publish: 400 File already exists` | version already used on PyPI. Bump and retry. |
| `ruff: E501 line too long` | Adjust `line-length`, or wrap. Don't `noqa` without a comment. |
| `ty: Found 1 error: ...` | fix it. If ty is wrong (rare in beta), report upstream and fall back to mypy for that file with `# pyright: ignore[ ... ]` is NOT a ty annotation; use `# type: ignore[<rule>]` only. |
| `mypy: Skipping analyzing "X": module is installed, but missing library stubs or py.typed marker` | install `types-X`, or set `[[tool.mypy.overrides]] ignore_missing_imports = true` for that module |
| `pytest: collected 0 items` | tests not in `testpaths`. Confirm `[tool.pytest.ini_options] testpaths = ["tests"]` |
| `pytest: AttributeError: module ... has no attribute ...` | stale `__pycache__`; `find . -name __pycache__ -exec rm -rf {} +` |
| `uv: error: failed to read project: pyproject.toml is not a project` | missing `[project]` table. Add it. |
| `uv sync --frozen failed` (CI) | `uv.lock` out of date. Locally: `uv lock`, commit, push. |
| `Coverage failure: total of 80% is less than fail-under=85%` | write more tests, or lower the threshold (with justification). |
| `release-please: no release created` | commits since last release are all `chore:`/`docs:`. Add a `feat:` or `fix:` to release. |
| `release-please: created PR with wrong version` | `.release-please-manifest.json` is wrong. Edit, commit `chore: fix manifest version`, push. |
| `gh-action-pypi-publish: ... could not exchange token` | the publish job missing `permissions: id-token: write`. |
| `actions/upload-artifact: artifact name dist already exists` | concurrent runs collided. Add `concurrency:` to release.yml. |
| `pip-audit: vulnerability found in <pkg>` | bump that dep with `uv lock --upgrade-package <pkg>`. |
| `ImportError while loading conftest` | `tests/__init__.py` missing or test-only import in conftest is broken. |
| `RuntimeError: dict changed size during iteration` | non-issue from a noisy logger; usually points at `logging.basicConfig` being called twice. |
| `coverage: No data was collected` | `[tool.coverage.run] source = ["src/stringfu"]` is wrong. Confirm path. |
| `pytest-xdist: NUMPROCESSES must be > 0` | `-n auto` requires `pytest-xdist`. `uv add --group dev pytest-xdist`. |
| `python: command not found` | uv-managed Pythons live under `uv python list` — use `uv run python` instead. |
| `Permission denied: '/usr/local/lib/python3.11'` | you're trying to install globally. Always `uv venv` and `uv sync`. |
| `error: source directory './src/stringfu' does not contain any Python files` | new package; create `__init__.py`. |
| `WARN  Found different sdist contents from the wheel` | hatchling can't reconcile globs. Simplify `[tool.hatch.build.targets.sdist] include`. |
| `ImportError: attempted relative import with no known parent package` | tests imported from `src/`. Use absolute `from stringfu import ...`. |
| `git push: src refspec v0.1.0 does not match any` | tag not pushed. `git push origin v0.1.0`. |
| `CalledProcessError: ...stringfu --help` (CLI test) | the CLI isn't installed. `uv pip install -e .`. |

---

## 20. Glossary

- **PyPI** — The Python Package Index (https://pypi.org). Where `pip install <name>` looks up packages.
- **TestPyPI** — A staging clone of PyPI at https://test.pypi.org. Use it to verify uploads without polluting prod.
- **sdist** — Source distribution. A `.tar.gz` containing your source files.
- **wheel** — A pre-built distribution file (`.whl`). What `pip install` prefers over sdists.
- **uv** — A Rust-written, fast Python package + project manager from Astral. Drop-in for `pip` + `virtualenv` + `pyenv` + `pip-tools`.
- **hatchling** — A PyPA-supported build backend. The thing that turns your source into wheels.
- **hatch-vcs** — A hatchling plugin that reads the version from your Git tag.
- **PEP 517** — The standard interface between build frontends (uv build) and build backends (hatchling).
- **PEP 518** — Defines `pyproject.toml`'s `[build-system]` table.
- **PEP 561** — Defines how to ship type information (the `py.typed` marker).
- **PEP 621** — Defines the `[project]` table in `pyproject.toml`.
- **PEP 735** — Defines `[dependency-groups]` for non-runtime deps (e.g. `dev`).
- **OIDC (OpenID Connect)** — A protocol that exchanges short-lived identity tokens between two services (here: GitHub Actions ↔ PyPI).
- **Trusted Publisher** — PyPI's name for OIDC-based publishing. No long-lived API tokens.
- **Sigstore** — A free-to-use signing service. PyPI auto-attaches Sigstore attestations on Trusted-Published releases.
- **Conventional Commits** — A commit message format (`type(scope): subject`) that automation can read to compute version bumps.
- **release-please** — Google's tool that reads conventional commits and opens a "release PR" with version + CHANGELOG bumps.
- **Ruff** — Astral's Rust-written linter and formatter. Replaces black, isort, flake8, and more.
- **ty** — Astral's Rust-written type checker (beta in 2026). The Pyright/mypy alternative.
- **mypy** — Python's most established type checker. Used here as a fallback.
- **pytest** — The de facto Python test runner.
- **pytest-cov** — A pytest plugin for code coverage reporting.
- **coverage.py** — The underlying coverage tool that pytest-cov drives.
- **pytest-xdist** — A pytest plugin for parallel test execution.
- **`pyproject.toml`** — The single config file for modern Python projects.
- **src/ layout** — Convention of putting your package under `src/<package>/` instead of at the repo root. Prevents accidental imports of the dev tree.
- **`py.typed`** — An empty marker file inside your package that tells type checkers "I ship hints, please use them".
- **`__all__`** — A module-level list of public names. What `from package import *` imports.
- **`importlib.metadata.version`** — The standard library function to read a package's version at runtime from its installed metadata.
- **classifiers** — Tags on PyPI that describe your package (Python version, license, status). The valid set is in `trove-classifiers`.
- **Trove classifiers** — The canonical list of valid PyPI classifiers, maintained at https://github.com/pypa/trove-classifiers.
- **`twine`** — The legacy uploader. We only call it for `twine check --strict` (metadata validation).
- **`uv build`** — uv's wrapper around the build backend (hatchling). Produces `dist/*.whl` and `dist/*.tar.gz`.
- **`uv publish`** — uv's wrapper for uploading to PyPI. Used here only as a fallback to `pypa/gh-action-pypi-publish`.
- **`Dependabot`** — GitHub's automated dependency updater.
- **`uv.lock`** — uv's reproducible lockfile. Commit it.
- **`.python-version`** — A one-line file with the Python version uv should use.
- **`workflow_dispatch`** — A GitHub Actions trigger letting you run a workflow on demand from the UI.
- **`environment:` (GitHub Actions)** — A protected gate that can require approval before a job runs (used here to gate `pypi`).
- **`id-token: write`** — The GitHub Actions permission needed to obtain an OIDC token (required for Trusted Publishing).

---

## 21. Update Cadence

This rulebook is valid for:
- Python: 3.11 through 3.14
- uv: 0.10 through 0.11.x
- hatchling: 1.27 through 1.29
- Ruff: 0.12 through 0.13 (2026 style guide)
- pytest: 8.x and 9.x
- ty: beta (Astral) — recheck once 1.0 ships
- pypa/gh-action-pypi-publish: floating tag `release/v1`

Re-run the generator when:
- Python 3.15 ships (expected October 2026 — bump `requires-python` floor only after 3.11 EOL).
- uv exits the 0.x series.
- ty reaches stable (drop mypy fallback).
- `pypa/gh-action-pypi-publish` cuts a `release/v2`.
- A security advisory affects hatchling, hatch-vcs, or any release-time tool.

Last updated: 2026-04-27.
