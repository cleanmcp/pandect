# Homebrew Formula Distribution — RULEBOOK

Distribute a CLI as `brew install yourtap/cli/supercli` via your own homebrew-tap repo, with pre-built bottles for darwin-arm64, darwin-amd64, and linuxbrew, livecheck, automated bumps from upstream releases, and the optional path to homebrew-core.

> Audience: a non-coder + their AI coding agent. The agent owns one binary release artifact. This rulebook tells the agent how to wrap that artifact in a Ruby formula, host it in a tap, build bottles in CI, publish them to GitHub Releases, and keep the formula version current automatically.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Ruby (Homebrew DSL) | Required by Homebrew; no alternative exists |
| Runtime + version | Homebrew 5.1.6 (portable Ruby 3.3.x bundled) | Brew bundles Ruby; never use system Ruby |
| Package manager | Homebrew itself | Self-hosted; tap is a git repo |
| Build tool | brew test-bot (CI bottling) | Official; produces uploadable bottle artifacts |
| Distribution model | Tap (`yourorg/homebrew-tap`) | Faster ship cycle than homebrew-core review |
| Formula DSL | Ruby class extending Formula | Only DSL Homebrew supports |
| Build strategy | Pre-built binaries via per-arch `url`+`sha256` | CLI ships compiled artifacts; no source compile |
| Bottle architectures | arm64_sequoia, sonoma, ventura, x86_64_linux, arm64_linux | Tier 1 platforms in Homebrew 5.x |
| Livecheck source | `:github_latest` strategy on releases | Releases are the source of truth |
| Tap repo name | `homebrew-tap` (org-prefixed) | `homebrew-` prefix is mandatory |
| Bottle hosting | GitHub Releases assets | Free, redundant, official pattern |
| CI provider | GitHub Actions | Official `Homebrew/actions/setup-homebrew` |
| Release flow | Tag upstream → dispatch → PR bumps formula | One source of truth = upstream release |
| Auth for bumps | Fine-grained PAT with `public_repo` scope | dawidd6 action needs repo write |
| Lint + format | `brew style` (RuboCop preset) | Ships with brew; matches homebrew-core style |
| Audit | `brew audit --strict --new --online` | Mandatory before merging any formula PR |
| Test command | `brew test supercli` | Runs the formula's `test do` block |
| Versioning | Semver from upstream tags | Strip leading `v` for url interpolation |
| Auto-update | `repository_dispatch` from upstream on `release: published` | Cross-repo trigger keeps formula current |
| README install command | `brew install yourtap/cli/supercli` | Three-segment form unambiguous in docs |
| homebrew-core path | Reserved for >75 stars + 30 days stable | Core has notability + stability bars |

### Versions Table

| Component | Version | Released | Link |
|---|---|---|---|
| Homebrew | 5.1.6 | 2026-04-13 | https://github.com/Homebrew/brew/releases |
| Homebrew (last major) | 5.1.0 | 2026-03-10 | https://brew.sh/2026/03/10/homebrew-5.1.0/ |
| Homebrew (last LTS-ish) | 5.0.0 | 2025-11-12 | https://brew.sh/2025/11/12/homebrew-5.0.0/ |
| Homebrew/actions/setup-homebrew | `@main` (rolling) | 2026 | https://github.com/Homebrew/actions/tree/master/setup-homebrew |
| dawidd6/action-homebrew-bump-formula | v4 | 2025-12 | https://github.com/dawidd6/action-homebrew-bump-formula |
| brew test-bot | bundled with brew 5.1.6 | 2026-04-13 | https://github.com/Homebrew/homebrew-test-bot |
| Portable Ruby (used by brew) | 3.3.x | 2026 | https://github.com/Homebrew/homebrew-portable-ruby |

### Minimum host requirements

- **macOS**: Sonoma (14) or newer for arm64 bottle install; Ventura (13) minimum overall.
- **Linux**: glibc 2.13+ (Ubuntu 16.04+, Debian 9+, RHEL 7+); kernel 3.2+; works on x86_64 and aarch64.
- **Windows**: NOT supported. WSL2 with Ubuntu 22.04+ is the only path.
- RAM: 1 GB free during install. Disk: 1 GB headroom for cellar + cache.
- Network: GitHub.com reachable (formula source + bottle download).

### Cold-start time

From `brew install yourtap/cli/supercli` on a fresh machine with brew already installed: **8–20 seconds** (bottle download + extract + caveats). With no bottle (source build of a Ruby formula that only downloads a binary): **5–10 seconds** (just untar).

From scratch (no brew yet) → installed: **~3 minutes** (brew install script ~2min, formula ~10s).

---

## 2. Zero-to-running (Setup)

This rulebook produces the **distribution side**: a tap repo containing `Formula/supercli.rb`. Your CLI source code lives in a separate repo that already produces release tarballs (e.g. `supercli-1.0.0-darwin-arm64.tar.gz`). Wire the two together as below.

### Prerequisites — macOS

```bash
# 1. Install Homebrew (if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Verify
brew --version
# Expected: Homebrew 5.1.6 (or newer)

# 3. GitHub CLI
brew install gh
gh auth login
# Choose: GitHub.com → HTTPS → Y (authenticate Git) → Login with web browser

# 4. Verify auth
gh auth status
# Expected: Logged in to github.com account <you> (keyring)

# 5. Create the tap directory locally (also creates a starter repo)
brew tap-new yourorg/tap --no-git --pull-label=pr-pull
# Note: this creates /opt/homebrew/Library/Taps/yourorg/homebrew-tap/ with starter workflows
```

### Prerequisites — Linux (Debian/Ubuntu/Fedora/Arch)

```bash
# 1. Install build prereqs (Homebrew on Linux needs these)
sudo apt-get update && sudo apt-get install -y build-essential procps curl file git
# Fedora: sudo dnf groupinstall 'Development Tools' && sudo dnf install procps-ng curl file git
# Arch:   sudo pacman -S base-devel procps-ng curl file git

# 2. Install Homebrew
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 3. Add brew to PATH (the installer prints these — paste them)
echo 'eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"' >> ~/.bashrc
eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"

# 4. Verify
brew --version
# Expected: Homebrew 5.1.6 (or newer)

# 5. GitHub CLI + auth (same as macOS)
brew install gh
gh auth login
```

### Prerequisites — Windows

**Homebrew has no native Windows support and there is no plan to add it.** Two options:

1. **WSL2** (the only supported path): Install WSL2 with Ubuntu 22.04+, then follow the Linux steps above inside WSL.
2. **Use a different package manager for Windows users**: ship `winget` and Scoop manifests as a separate distribution. This rulebook does not cover that. Tell Windows users in your README to use WSL or your alternative installer.

```powershell
# In PowerShell as Administrator (one-time WSL setup):
wsl --install -d Ubuntu-22.04
# Reboot, set up user, then inside WSL follow Linux steps.
```

### Required GitHub accounts/resources

| Resource | Required | What's needed |
|---|---|---|
| GitHub account | Yes | The tap repo lives there |
| Tap repository (`yourorg/homebrew-tap`) | Yes | Public repo, name MUST start with `homebrew-` |
| Upstream CLI repository | Yes | Must publish GitHub Releases with binary tarballs |
| Personal Access Token (fine-grained) | Yes | For dispatch + bump action; scope: `Contents: read/write` on tap repo |
| Apple Developer / signing | No | Not required for brew distribution |

### Create the PAT

1. https://github.com/settings/personal-access-tokens/new
2. Name: `homebrew-tap-bump-yourorg`
3. Expiration: 90 days (calendar a renewal task)
4. Repository access: Only `yourorg/homebrew-tap`
5. Permissions: Contents → Read and write; Metadata → Read; Pull requests → Read and write
6. Generate, copy. Save as repo secret in **upstream CLI repo** named `HOMEBREW_TAP_PAT`.

### Bootstrap the tap repo (commands)

```bash
# 1. Create the GitHub repo (must be public for free GH Actions, must start with homebrew-)
gh repo create yourorg/homebrew-tap --public --description "Homebrew tap for yourorg CLIs"

# 2. Clone and lay out files
gh repo clone yourorg/homebrew-tap
cd homebrew-tap
mkdir -p Formula .github/workflows

# 3. Copy in: Formula/supercli.rb, .github/workflows/tests.yml, .github/workflows/publish.yml,
#    README.md, LICENSE, CLAUDE.md, AGENTS.md, .cursor/rules
#    (Full contents in section 16)

# 4. First commit
git add .
git commit -m "Initial tap with supercli formula"
git push -u origin main

# 5. Tap it locally to confirm it's resolvable
brew tap yourorg/tap
# Expected: ==> Tapping yourorg/tap ... Tapped 1 formula (X files, Y KB)

# 6. Smoke install
brew install yourorg/tap/supercli
# Expected: ==> Fetching ... ==> Pouring ... 🍺  /opt/homebrew/Cellar/supercli/1.0.0: 5 files

# 7. Smoke test
brew test supercli
# Expected: Testing supercli ... Done

# 8. Audit (must pass with zero output before pushing changes)
brew audit --strict --new --online --tap=yourorg/tap supercli
# Expected: (no output = pass)
```

### First-run errors → exact fixes

| Error | Fix |
|---|---|
| `Error: Invalid tap name 'yourorg/tap': it must be in form '<user>/<repo>'` | Repo must be named `homebrew-tap` on GitHub; the `homebrew-` prefix is dropped in the tap name. |
| `Error: SHA256 mismatch` | Re-run `brew fetch --force <url>`; copy the printed SHA into the formula. |
| `Error: undefined method 'on_arm' for ...` (in `def install`) | `on_arm`/`on_intel` blocks are not allowed inside `def install` or `test do`. Use `if Hardware::CPU.arm?` instead. |
| `Warning: Calling bottle :unneeded is deprecated! There is no replacement.` | Delete the `bottle :unneeded` line. Pre-built binary formulas need no bottle stanza at all. |
| `fatal: could not read Username for 'https://github.com'` (in CI) | The `GITHUB_TOKEN` permissions are insufficient for cross-repo push. Use the PAT secret, not the default token. |
| `Error: yourorg/tap/supercli's homepage seems unreachable` | `--online` audit failed. Make sure the `homepage` URL returns 200 on a clean machine. |
| `Error: No available formula with the name "supercli".` | You forgot `brew tap yourorg/tap` first, or the formula filename doesn't match the class name (case-sensitive on Linux). |

---

## 3. Project Layout

```
homebrew-tap/                          # GitHub repo: yourorg/homebrew-tap
├── Formula/                           # All formulas live here. Brew auto-discovers.
│   └── supercli.rb                    # One file per formula. Filename = lowercased class name.
├── .github/
│   └── workflows/
│       ├── tests.yml                  # PR CI: brew test-bot (style + audit + test + bottle build)
│       └── publish.yml                # workflow_dispatch + repository_dispatch: bump formula PR
├── .cursor/
│   └── rules                          # Editor rules (Always/Never)
├── CLAUDE.md                          # Claude Code instructions
├── AGENTS.md                          # Codex instructions
├── README.md                          # User-facing install instructions
├── LICENSE                            # MIT or Apache-2.0
└── .gitignore                         # Standard Ruby ignore + .DS_Store
```

### Naming conventions

- **Formula filename**: lowercase, hyphens only, `.rb` extension, no underscores. `super-cli.rb` → class `SuperCli`.
- **Class name**: PascalCase derived from filename: `super-cli.rb` → `class SuperCli < Formula`.
- **Resource names**: lowercase symbols `:linux_arm64`, `:darwin_amd64` — never strings.
- **Bottle root URL**: always `https://github.com/yourorg/homebrew-tap/releases/download/<formula>-<version>` for tap-built bottles.

### "If you're adding X, it goes in Y" — decision table

| Adding | Goes in | Notes |
|---|---|---|
| New CLI to distribute | `Formula/<name>.rb` | One file, class name = filename in PascalCase |
| Bottle for new arch | `bottle do` block in formula | Add one `sha256 cellar: :any_skip_relocation, <arch>: "..."` line |
| New livecheck rule | Inside formula's `livecheck do` block | One block per formula |
| Per-OS install branch | Inside `def install` using `OS.mac?` / `OS.linux?` | Never `on_macos` here — that block is install-time-only outside `def install` |
| Per-arch download URL | At top level via `on_macos`/`on_linux` + `on_arm`/`on_intel` blocks | These ARE allowed at formula top level |
| Custom shell completion | Inside `def install` after `bin.install` | `bash_completion.install`, `zsh_completion.install`, `fish_completion.install` |
| Test invocation | `test do` block | Must exercise actual functionality, not just `--version` |
| Caveats / post-install message | `def caveats` method | One paragraph max; brew prints after install |
| Dependency on another formula | `depends_on "name"` at top of class | Use `:build`/`:test`/`:optional` qualifiers when relevant |
| Service (launchd/systemd) | `service do` block | For daemons; rare for CLIs |
| Deprecation notice | `deprecate! date: "YYYY-MM-DD", because: "..."` | At top of class |
| Pre-1.0 / unstable channel | `head` URL block | Allows `brew install --HEAD supercli` |
| Cask (GUI app `.app`) | `Casks/<name>.rb` | Different DSL; not in scope here |
| Custom brew command | `cmd/brew-foo.rb` | Rare; for tap-extending commands |
| Shared Ruby helpers | NOT supported in tap; inline into each formula | Brew taps don't load arbitrary files |

---

## 4. Architecture

### Distribution flow (formula → tap → bottles)

```
+-------------------+        +-------------------+        +-------------------+
|  Upstream Repo    |        |  yourorg/         |        |  End User's       |
|  (CLI source)     | ------>|  homebrew-tap     | ------>|  Mac/Linux        |
|                   |  tag   |  (this repo)      |  brew  |                   |
|  releases v1.0.0  |        |                   |  inst  |  /opt/homebrew/   |
|  + binary tarballs|        |  Formula/         |        |  Cellar/supercli  |
+-------------------+        |  supercli.rb      |        |  /1.0.0/bin/      |
        |                    |                   |        |                   |
        | release: published |  bottle URLs ---> | tests  |                   |
        v                    +-------------------+        +-------------------+
+-------------------+                  ^                          ^
|  GitHub Actions   |                  |                          |
|  publish.yml      |  bump-formula-pr |                          |
|  (dispatch from   |------------------+                          |
|   upstream)       |                                             |
+-------------------+                                             |
        |                                                         |
        |  bottle build CI in tap (tests.yml on PR)                |
        +---------------------------------------------------------+
                          uploads bottles to GitHub Releases
```

### Per-install data flow

```
$ brew install yourorg/tap/supercli
        |
        v
1. brew resolves "yourorg/tap" -> $(brew --repository)/Library/Taps/yourorg/homebrew-tap (clones if absent)
        |
        v
2. brew loads Formula/supercli.rb -> instantiates Supercli class
        |
        v
3. brew checks bottle DSL -> finds matching arm64_sequoia/x86_64_linux/etc.
        |
        v
4. Bottle hit:                          Bottle miss (no matching arch):
   - download <root_url>/<bottle.tar.gz>   - download formula `url`
   - verify SHA256                          - run `def install`
   - extract into /opt/homebrew/Cellar/     - link into bin/
        |                                       |
        +-----------------+---------------------+
                          v
5. brew runs post-install link to /opt/homebrew/bin/supercli (symlink)
        |
        v
6. (If invoked) brew test supercli runs the `test do` block in a sandboxed temp dir
```

### Where logic lives, where it does NOT

| Lives in | Does NOT live in |
|---|---|
| `def install` — file moves, symlink creation, completion install | The CLI binary itself (that's the upstream repo's job) |
| `test do` — exercising the installed binary | Network-dependent assertions (no internet during `brew test`) |
| `bottle do` — pre-built binary refs | Hand-edited SHA256s (CI generates these) |
| `livecheck do` — version polling | Rate-limited GitHub API calls in default regex (use `:github_latest` strategy) |
| `caveats` — post-install message | Critical info (users miss caveats; bake into install instead) |
| Top-level `on_macos`/`on_linux`/`on_arm` blocks — per-platform `url`/`sha256`/`resource` | Same blocks inside `def install` (ILLEGAL) |

### Entry-point file map

| File | Purpose |
|---|---|
| `Formula/supercli.rb` | The formula. Single source of truth for what gets installed. |
| `.github/workflows/tests.yml` | PR CI. Runs `brew test-bot` against changed formulas. |
| `.github/workflows/publish.yml` | Bump trigger. Runs on `repository_dispatch` from upstream + manual `workflow_dispatch`. |
| `README.md` | User install docs. First impression. |
| `CLAUDE.md` / `AGENTS.md` / `.cursor/rules` | Agent guardrails. |

---

## 5. Dev Workflow

### Editing a formula locally

```bash
# 1. Tap your own repo (so brew can find the formula by short name)
brew tap yourorg/tap

# 2. Open the formula in your tap (brew --repo points at the tap directory)
$EDITOR "$(brew --repository yourorg/tap)/Formula/supercli.rb"
# or the symlinked path: $(brew --repo yourorg/tap)/Formula/supercli.rb

# 3. Re-install from local edits (uses your modified ruby file)
brew reinstall --build-from-source yourorg/tap/supercli

# 4. Run brew test against your local install
brew test yourorg/tap/supercli

# 5. Style check (RuboCop preset)
brew style yourorg/tap

# 6. Full audit (do this before pushing — CI will run the same)
brew audit --strict --new --online --tap=yourorg/tap supercli
```

### Editing in your own working clone (preferred for PRs)

```bash
# Work in your git clone, NOT the brew-managed tap copy:
cd ~/code/homebrew-tap
$EDITOR Formula/supercli.rb

# Point brew at your working clone:
brew tap --force-auto-update yourorg/tap "$(pwd)"   # rare; usually:
brew untap yourorg/tap
ln -s "$(pwd)" "$(brew --repository)/Library/Taps/yourorg/homebrew-tap"

# Now `brew install yourorg/tap/supercli` uses your live edits.
```

### Pre-commit checks

```bash
# Run all of these before `git push`:
brew style yourorg/tap                                                    # ~2s
brew audit --strict --new --online --tap=yourorg/tap supercli             # ~5s
brew install --build-from-source --verbose yourorg/tap/supercli           # ~10s
brew test yourorg/tap/supercli                                            # ~3s
brew livecheck --tap=yourorg/tap supercli                                 # ~5s
```

### Hot reload behavior

There is none. Brew loads formulas on each invocation. After editing the `.rb`, the next `brew install/reinstall/audit` picks up the change immediately. No daemon to restart.

### Branch + commit conventions

- Branch: `bump-supercli-1.2.3` (matches what `brew bump-formula-pr` generates).
- Commit subject: `supercli 1.2.3` (lowercase formula name + new version, nothing else). This matches homebrew-core convention and is what the bump action emits.
- One formula change per PR. Don't bundle.
- Body is optional but include the upstream release URL.

### Debugger / inspection

- `brew install --debug --verbose <formula>` drops into pry on errors. `q` exits.
- `brew livecheck --debug --tap=yourorg/tap supercli` shows every URL tried.
- `brew --env` prints brew's environment.
- `brew config` prints OS, brew version, paths — paste this into bug reports.
- Inspect the loaded formula: `brew info --json=v2 yourorg/tap/supercli | jq`.

---

## 6. Testing & Parallelization

### Where tests live

In the formula itself: `test do ... end` block. There is no separate test directory.

### What `brew test` does

1. Creates a fresh temp dir; sets `HOME=testpath`.
2. Adds `<prefix>/bin` to PATH.
3. Runs the test block.
4. Tears down the temp dir.
5. Exits 0 on success, non-zero on any uncaught error or assertion failure.

### Test best practices (homebrew-core enforced)

- DO test actual command output: `assert_match "expected", shell_output("supercli render input.txt")`.
- DO test config file generation: write a fixture, run the binary, assert side effect.
- DO NOT test only `--version` or `--help` — `brew audit --strict` flags this.
- DO NOT require network — sandbox blocks it inconsistently.
- DO use `testpath` (a Pathname) for any file you write.

### Single-formula commands

```bash
brew test yourorg/tap/supercli           # run just the test block
brew test --verbose --debug supercli     # show stdout + drop to pry on failure
```

### What to mock vs not

| Thing | Rule |
|---|---|
| Network calls | Don't make them in `test do`. If the CLI needs network, test the offline subcommand. |
| External binaries (`git`, `curl`) | OK to call IF they're declared `depends_on`. |
| Filesystem | Always work in `testpath`; never write to `/tmp` or `$HOME` directly. |
| Stdin | Use `Open3.popen3` or pipe via shell heredoc inside `shell_output`. |

### Coverage

There is no formal coverage. The bar is: **the test block must fail loudly if the binary is broken, missing, or links incorrectly**.

### CI parallelization (test-bot)

- `tests.yml` matrix: macos-15, macos-14, ubuntu-24.04, ubuntu-24.04-arm.
- Each runner builds + tests + bottles the changed formula independently.
- Bottles upload as artifacts; `pr-pull` workflow merges + publishes.

### Parallelization patterns for AI agents

| Safe to fan out | Must be sequential |
|---|---|
| Editing two unrelated formulas in `Formula/<a>.rb` and `Formula/<b>.rb` simultaneously | Anything touching `.github/workflows/*.yml` (one workflow change at a time) |
| Updating different `sha256` lines in different formulas | Updating the same formula twice (lockstep) |
| Adding a new formula while another formula is being audited | `brew bump-formula-pr` runs (it pushes branches; concurrent runs collide) |
| Running `brew style` and `brew audit` in parallel | `brew install --build-from-source` (locks the cellar) |

---

## 7. Logging

Brew's own commands log to stdout/stderr. Your formula does NOT log; the **installed CLI** does. Inside the formula:

- Use `ohai "Description"` for user-visible status during `def install`.
- Use `opoo "Warning text"` for warnings (yellow).
- Use `odie "Fatal: ..."` to fail the install with a message (kills the process).
- NEVER use `puts` — output gets swallowed in normal install mode.

Example:

```ruby
def install
  ohai "Installing supercli #{version} for #{Hardware::CPU.arch}"
  bin.install "supercli"
  opoo "Run `supercli init` to create your config" if (bin/"supercli").exist?
end
```

Brew's verbose output:

```bash
brew install --verbose --debug yourorg/tap/supercli
# Shows every shell command, every download, every install step.
```

Where logs land in dev:

- Install logs: `~/Library/Logs/Homebrew/<formula>/` on macOS, `~/.cache/Homebrew/Logs/<formula>/` on Linux.
- `brew gist-logs <formula>` uploads them to a private gist for sharing.

---

## 8. AI Rules

### 8.1 ALWAYS

1. **Always run** `brew style yourorg/tap` and `brew audit --strict --new --online --tap=yourorg/tap <formula>` before claiming a formula change is done.
2. **Always declare** the formula `class` name as PascalCase of the filename: `super-cli.rb` → `class SuperCli < Formula`.
3. **Always use** three-segment installs in user docs: `brew install yourtap/cli/supercli` (or `yourorg/tap/supercli`) so the tap is unambiguous.
4. **Always use** `on_macos do` / `on_linux do` / `on_arm do` / `on_intel do` blocks at the **top level** of the class for per-platform `url`/`sha256`/`resource` selection.
5. **Always use** `if OS.mac?` / `if Hardware::CPU.arm?` plain conditionals **inside** `def install` and `test do` — the `on_*` blocks are NOT valid there.
6. **Always pin** every `url` to a specific tag or commit SHA, never a branch.
7. **Always include** a `sha256` next to every `url` (formula will refuse to load without it).
8. **Always include** a `livecheck do` block so `brew livecheck` can detect upstream releases.
9. **Always include** a meaningful `test do` block that exercises real functionality, not `--version`.
10. **Always use** `bin.install "supercli"` (or `bin.install Dir["bin/*"]`) — never `cp` or `mv` manually.
11. **Always use** `version` interpolation (`"v#{version}"`) inside the `url` so a version bump only requires changing one line.
12. **Always strip** the leading `v` from upstream tags when setting `version`: `version "1.2.3"`, not `"v1.2.3"`.
13. **Always run** `brew bump-formula-pr` (or the dawidd6 action) to bump versions — it computes the new SHA256s, opens the PR, and runs the same audits as homebrew-core.
14. **Always store** the bump PAT as a repo secret named `HOMEBREW_TAP_PAT`; never inline it in workflows.
15. **Always use** `Homebrew/actions/setup-homebrew@main` in CI — it provides the correct portable Ruby and brew checkout.
16. **Always use** `actions/checkout` with `fetch-depth: 0` in CI when running test-bot — it needs full history to detect changed formulas.
17. **Always set** the formula `homepage` to a real, reachable URL (audit fails if not 200).
18. **Always set** `license "MIT"` (or whatever applies) — homebrew-core requires SPDX identifiers; tap formulas should match the convention.
19. **Always exit cleanly** from `def install` — return value is ignored, but raised exceptions abort.
20. **Always use** the `:any_skip_relocation` cellar value for pre-built binary bottles (the binary doesn't reference the cellar path).
21. **Always commit** the `Formula/<name>.rb` change as a single commit titled `<formula> <version>` — matches homebrew-core convention and what bump tools emit.
22. **Always update** the `bottle do` block atomically with the `version` and `url` — never half-update.

### 8.2 NEVER

1. **Never** put `on_macos`/`on_linux`/`on_arm`/`on_intel` blocks inside `def install` or `test do`. Use `if OS.mac?` etc. there.
2. **Never** use `bottle :unneeded` — it's been deprecated since 2021 and is a hard error in newer brew. For binary-only formulas, omit the bottle stanza entirely or use `bottle do ... end` once you have CI building real bottles.
3. **Never** depend on system Ruby. Brew bundles its own portable Ruby. CI must use `Homebrew/actions/setup-homebrew@main` — never `actions/setup-ruby`.
4. **Never** hardcode `/opt/homebrew` or `/usr/local` in install paths. Use `prefix`, `bin`, `lib`, `share`, etc.
5. **Never** use `Dir.chdir` in `def install`. Build steps run in the unpacked archive's root by default; if you need to switch dirs, use `cd "subdir" do ... end`.
6. **Never** check the binary into the tap repo. The tap holds the formula; the binary lives in upstream's GitHub Releases.
7. **Never** push directly to the tap's `main` branch from CI. Always go through a PR (the bump action does this).
8. **Never** use `${{ secrets.GITHUB_TOKEN }}` for cross-repo bumps — it has no access to other repos. Use the fine-grained PAT.
9. **Never** echo a secret in CI logs (`echo $HOMEBREW_TAP_PAT`). Anyone with read access to the run can scrape it.
10. **Never** use a 4-component version like `1.2.3.4` unless upstream uses it. Brew expects semver-ish; deviation breaks `brew livecheck`.
11. **Never** put architecture-specific paths inside the binary tarball name when you can avoid it — but if upstream emits `supercli-darwin-arm64`, that's fine; just match it in the formula's `url`.
12. **Never** rely on `head do` for end-user install instructions. `head` is for `--HEAD`-flag installs only.
13. **Never** add `revision N` unless you're shipping a fix to the same upstream version (forces re-bottling).
14. **Never** use absolute paths in `url`. Use `https://github.com/yourorg/supercli/releases/download/v#{version}/supercli-#{version}-<arch>.tar.gz`.
15. **Never** bottle on a runner with the wrong image — `arm64_sequoia` bottles must build on `macos-15` (Apple Silicon), not Intel runners.
16. **Never** publish a formula to homebrew-core before it has 30 days of stability + the notability bar (>=75 stars or >=30 forks/watchers; 3x for self-submitted: >=225 stars or >=90 forks/watchers).
17. **Never** include broad globs like `bin.install Dir["**/*"]` — be precise so you don't ship docs/tests/sources into `bin/`.
18. **Never** call `system` for setup that brew handles (e.g. `system "chmod +x"` after `bin.install` — `bin.install` already chmod's 0755).
19. **Never** edit `Formula/<name>.rb` and CI workflows in the same PR — separate concerns, easier review.

### 8.3 Blast Radius Reference

| Path | Who depends on it | Verify if you change it |
|---|---|---|
| `Formula/supercli.rb` | every install, every CI run, every livecheck | `brew style && brew audit --strict --new --online --tap=yourorg/tap supercli && brew install --build-from-source yourorg/tap/supercli && brew test yourorg/tap/supercli` |
| `Formula/supercli.rb` `url` line | bottle bot, source installs, livecheck regex | `brew fetch --force yourorg/tap/supercli` (download succeeds, SHA matches) |
| `Formula/supercli.rb` `sha256` line | install integrity | `shasum -a 256 <downloaded.tar.gz>` matches |
| `Formula/supercli.rb` `bottle do` block | bottle hits for all users | `brew install yourorg/tap/supercli` does NOT trigger source build |
| `Formula/supercli.rb` `livecheck` block | bump automation | `brew livecheck --tap=yourorg/tap supercli` returns expected version |
| `Formula/supercli.rb` `test do` block | CI, every release | `brew test yourorg/tap/supercli` exits 0 |
| `Formula/supercli.rb` class name | brew loader (filename↔class match) | `brew info yourorg/tap/supercli` resolves |
| `Formula/supercli.rb` `version` line | every URL interpolation, bottle filename, cellar path | full reinstall + test |
| `Formula/supercli.rb` `homepage` line | `brew audit --online` | `curl -fsSI <homepage>` returns 200 |
| `Formula/supercli.rb` `license` line | homebrew-core eligibility, audits | SPDX validator passes |
| `Formula/supercli.rb` `depends_on` lines | install resolution | `brew deps --tree yourorg/tap/supercli` shows expected graph |
| `Formula/supercli.rb` `bin.install` line | binary-on-PATH expectation | `which supercli && supercli --help` after install |
| `.github/workflows/tests.yml` | every PR's CI | open a draft PR, watch checks |
| `.github/workflows/publish.yml` | upstream-triggered bumps | manually fire via `gh workflow run publish.yml -f formula=supercli -f tag=v1.2.3` |
| `secrets.HOMEBREW_TAP_PAT` (in upstream repo) | cross-repo bump dispatch | dispatch a test event; PR opens in tap |
| Tap repo name (must be `homebrew-<x>`) | `brew tap` resolution | `brew tap yourorg/tap` succeeds |
| Tap repo visibility (public) | bottle download via GH Releases (private requires auth) | `curl -fsSI <release-asset-url>` returns 200 |
| GitHub Release on upstream | bottle download, formula `url` | release asset URLs are stable, immutable |
| `Formula/<name>.rb` filename casing | Linux case-sensitivity | matches the lowercase short name used in `brew install` |
| README.md install command | user trust | actually copy-paste-runnable on a clean machine |
| CLAUDE.md / AGENTS.md / .cursor/rules | agent behavior | agent reads them before editing formula |

### 8.4 Definition of Done (per task type)

#### Bug fix in a formula

- [ ] Reproduce: `brew install yourorg/tap/supercli` exhibits the bug.
- [ ] `brew style yourorg/tap` clean.
- [ ] `brew audit --strict --new --online --tap=yourorg/tap supercli` clean.
- [ ] `brew test yourorg/tap/supercli` exits 0 and the test block actually exercises the broken path.
- [ ] `brew install --build-from-source yourorg/tap/supercli` succeeds on the AI's host.
- [ ] PR title: `supercli: <one-line bug summary>`.
- [ ] No version bump unless the upstream release fixed it.

#### Version bump (most common)

- [ ] Use `brew bump-formula-pr --version=<new> yourorg/tap/supercli` OR rely on the `dawidd6` action.
- [ ] All four bottle `sha256` lines updated (or removed if pending CI rebottling).
- [ ] `livecheck` confirms upstream version matches: `brew livecheck --tap=yourorg/tap supercli`.
- [ ] CI green on the PR (test-bot built bottles for all four platforms).
- [ ] Pull-merge by labeling with `pr-pull` (or whatever label the workflow expects).

#### New formula in the tap

- [ ] Filename matches lowercase class name.
- [ ] `homepage`, `url`, `sha256`, `license`, `version` all set.
- [ ] At least one `depends_on` if needed, none if pure binary.
- [ ] `livecheck do` block.
- [ ] `test do` block exercising real functionality.
- [ ] `brew audit --strict --new --online --tap=yourorg/tap <formula>` clean (note: `--new` is mandatory for new formulas).
- [ ] README install line added.

#### Refactor (e.g. consolidating duplicate per-arch blocks)

- [ ] Diff produces semantically identical install: `brew install --build-from-source` then `find $(brew --prefix yourorg/tap/supercli) -type f` matches before/after.
- [ ] All commands from the verification recipe (8.5) pass.
- [ ] Bottle SHAs are unchanged unless the binary is repackaged (revision bump if so).

#### Schema change (adding bottle architectures)

- [ ] Each new arch has a CI runner that can produce that bottle.
- [ ] `tests.yml` matrix includes the runner image.
- [ ] First successful CI run produces the new bottle artifact.
- [ ] `pr-pull` workflow uploads it to GitHub Releases.

#### Copy change (caveats, README, comments)

- [ ] `brew style` clean.
- [ ] No SHA / URL / version changes.
- [ ] README copy compiles (lint-as-prose: no broken brew install examples).

### 8.5 Self-Verification Recipe

Run every command. Each must produce the expected output.

```bash
# 1. Style (RuboCop)
brew style yourorg/tap
# Expected: (no output) or "X files inspected, no offenses detected"

# 2. Audit (strict, online — same as homebrew-core)
brew audit --strict --new --online --tap=yourorg/tap supercli
# Expected: (no output = pass)

# 3. Source install (forces evaluating def install, ignores bottle)
brew uninstall --ignore-dependencies supercli 2>/dev/null
brew install --build-from-source yourorg/tap/supercli
# Expected: ==> Pouring or ==> Installing supercli ... 🍺  /opt/homebrew/Cellar/supercli/<v>: ... files

# 4. Test (runs `test do` block)
brew test yourorg/tap/supercli
# Expected: Testing supercli ... (no failure output)

# 5. Livecheck (must report current or newer version)
brew livecheck --tap=yourorg/tap supercli
# Expected: supercli : 1.2.3 ==> 1.2.3   (versions match)
# OR:       supercli : 1.2.3 ==> 1.2.4   (a bump is available — open PR)

# 6. Bottle install smoke (after CI publishes bottles)
brew uninstall --ignore-dependencies supercli
brew install yourorg/tap/supercli
# Expected: ==> Pouring supercli--<v>.<arch>.bottle.tar.gz   (NOT "Installing")

# 7. Linkage check
brew linkage --test yourorg/tap/supercli
# Expected: (no output, exit 0)

# 8. Reinstall round-trip
brew reinstall yourorg/tap/supercli && supercli --version
# Expected: <semver string matching the formula version>
```

### 8.6 Parallelization Patterns

**Safe parallel subagent fan-outs:**

- Spawn one subagent per formula when bumping multiple at once (each touches `Formula/<name>.rb` and nothing else).
- Spawn one subagent for the formula and one for documentation in the same PR (touches `Formula/<x>.rb` and `README.md`).
- Spawn one subagent per arch to compute SHA256 for new release tarballs (each is `curl <url> | shasum`).

**Must be sequential (single agent, lockstep):**

- Editing the same formula twice (the file is small; serialize).
- Editing CI workflows (one workflow change per PR, by convention).
- Running `brew install --build-from-source` and `brew test` (the cellar's per-formula lock prevents concurrent installs).
- Running `brew bump-formula-pr` for the same formula (each invocation pushes a branch).

**Anti-pattern:** never have two agents independently compute and update SHA256 for the same `url`. Pick one agent, computed once, written once.

---

## 9. Stack-Specific Pitfalls

1. **`on_arm` inside `def install` silently no-ops.** Symptom: install ignores the arch-specific branch. Cause: `on_*` blocks are only valid at the top level of the class. Fix: replace with `if Hardware::CPU.arm?` / `if OS.mac?` inside `def install` and `test do`. Detect early: `brew audit --strict` flags this in newer versions.

2. **`bottle :unneeded` causes a hard error on brew 5.x.** Symptom: `Error: Calling bottle :unneeded is disabled!` Cause: line was emitted by older goreleaser/brew tooling. Fix: delete the line; pre-built binary formulas need no bottle stanza until you have CI bottling. Detect early: `brew audit` errors immediately.

3. **Tap repo named `tap`, not `homebrew-tap`.** Symptom: `brew tap yourorg/tap` errors with "Invalid tap name". Cause: GitHub repo MUST start with `homebrew-`. Fix: rename the repo. Detect early: `brew tap-new` enforces this; manual repos forget.

4. **SHA256 mismatch after upstream re-tagged.** Symptom: install fails mid-download. Cause: GitHub serves a new tarball when a tag is force-pushed. Fix: re-fetch (`brew fetch --force`), update SHA, bump `revision` if version unchanged. Detect early: never force-push tags upstream.

5. **`bin.install` clobbers existing files in cellar.** Symptom: weird interactions between formulas. Cause: two formulas install a binary with the same name. Fix: check `brew uses --installed supercli`; rename the conflicting binary or use `keg_only` if internal. Detect early: `brew audit --strict` flags collisions.

6. **`livecheck` regex returns the wrong version.** Symptom: `brew livecheck` returns `0.0.1` or `latest`. Cause: default GitHub Git strategy on a repo that uses non-standard tag format (e.g. `release-v1.2.3`). Fix: switch to `strategy :github_latest` or `strategy :github_releases` and a custom `regex`. Detect early: run `brew livecheck --debug --tap=yourorg/tap supercli` after every bump.

7. **`def install` runs in the wrong working directory.** Symptom: `bin.install "bin/supercli"` says "no such file". Cause: upstream tarball has a top-level dir; brew un-tars into that dir and runs `def install` there. Fix: use the actual path inside the tarball, or `Dir["**/supercli"].first`. Detect early: extract the tarball locally and `ls`.

8. **CI runner doesn't match the bottle arch.** Symptom: `brew test-bot` builds a bottle but you can't install it on the target. Cause: built `arm64_sequoia` on `macos-14` (Sonoma Apple Silicon) but tagged it for `arm64_sequoia`. Fix: match the matrix to the bottle arch one-to-one. Use `macos-15` for `arm64_sequoia`. Detect early: `brew install` fails on a fresh user's machine.

9. **Leaking `HOMEBREW_TAP_PAT` in CI logs.** Symptom: GitHub revokes the PAT after security scan. Cause: someone added `set -x` or `env | grep TAP_PAT` to a workflow. Fix: regenerate the PAT, add `add-mask::` directives, never echo. Detect early: GitHub's secret scanning emails on every commit; pay attention.

10. **`brew audit` fails because of deprecated license string.** Symptom: `Error: License "MIT/X11" is invalid.` Cause: not an SPDX identifier. Fix: use canonical SPDX ID like `"MIT"`, `"Apache-2.0"`, `"GPL-3.0-or-later"`. Detect early: list at https://spdx.org/licenses/.

11. **Bumping with `brew bump-formula-pr` from a stale clone.** Symptom: PR doesn't include `bottle do` updates. Cause: ran from a tap clone where main has diverged. Fix: `git pull --rebase` first, or use the dawidd6 action which always works on a fresh checkout. Detect early: CI on the PR diffs against latest main.

12. **`Hardware::CPU.intel?` true on Apple Silicon under Rosetta.** Symptom: wrong binary downloaded on M-series Macs. Cause: brew detects Rosetta and adapts; if a user runs an Intel Terminal under Rosetta, brew treats them as Intel. Fix: do not rely on `Hardware::CPU.intel?` to gate Apple Silicon binaries; rely on the bottle DSL which targets `arm64_sequoia` directly. Detect early: install in both native and Rosetta terminals during release dry-run.

13. **`fetch-depth: 1` in `actions/checkout` breaks test-bot.** Symptom: test-bot reports "no formulas changed". Cause: it diffs against `main`'s history. Fix: set `fetch-depth: 0`. Detect early: empty test runs in CI on a known formula edit.

14. **`pr-pull` label not configured.** Symptom: bottles build but never publish to the release. Cause: tap was created without `--pull-label=pr-pull` or the workflow doesn't listen for that label. Fix: add the label to GitHub repo settings; check `publish.yml` listens for `labeled` events. Detect early: PR sits with green checks but no release artifacts.

15. **GitHub's API rate limit hits during livecheck.** Symptom: `brew livecheck` returns "GitHub API rate limit exceeded". Cause: unauthenticated checks at scale. Fix: set `HOMEBREW_GITHUB_API_TOKEN` env var to a read-only PAT. Detect early: 60 unauthenticated requests/hour is the default ceiling.

16. **`test do` requires network and CI sandbox blocks it.** Symptom: green locally, red in CI. Cause: the test block makes an HTTPS call. Fix: test offline functionality only; mock with a fixture file via `testpath`. Detect early: `brew test --HEAD` and `brew test` in `--debug` mode show outbound connection attempts.

17. **`pre-release` flagged tags trip up `:github_latest`.** Symptom: livecheck never advances past 1.0.0 even though 1.2.0 exists. Cause: `:github_latest` queries the `latest` API endpoint, which excludes prereleases. Fix: switch to `:github_releases` strategy with a regex that includes/excludes prerelease as desired. Detect early: tag a 1.0.1-rc and watch livecheck stall.

18. **Wrong SHA256 after manual edit.** Symptom: install fails. Cause: human typo while pasting the hex string. Fix: NEVER hand-edit SHA256; always use `brew fetch --force` (prints SHA), `shasum -a 256 <file>`, or the bump action. Detect early: `brew audit --strict` doesn't catch this; install fails at runtime.

19. **`HOMEBREW_NO_AUTO_UPDATE=1` left set in dev environment.** Symptom: dev's brew is on an old version, formula uses a feature only in newer brew. Fix: unset the env var; `brew update` once. Detect early: `brew --version` mismatch between dev and CI.

20. **Linux ARM64 install pulls macOS bottle.** Symptom: "Exec format error" running the binary on ARM Linux. Cause: only `on_arm` was used, not combined with `on_linux`. Fix: nest `on_arm` inside `on_linux` and vice versa for full coverage. Detect early: test on ARM Linux runner before publishing.

21. **`url` references a moving asset.** Symptom: tarball contents change without version bump, SHA mismatch. Cause: linked to `latest` URL or unstable redirect. Fix: pin to `releases/download/v1.2.3/<file>`. Detect early: `--strict` audit flags non-versioned URLs.

22. **Trying to `brew install` a private tap without the PAT.** Symptom: `fatal: could not read Username`. Cause: brew can't auth to a private repo. Fix: keep the tap public, OR set `HOMEBREW_GITHUB_API_TOKEN` to a PAT with `repo` scope. Detect early: try `git clone` to the tap URL on a clean machine.

---

## 10. Performance Budgets

| Metric | Budget | How to measure |
|---|---|---|
| Bottle install time (warm cache) | < 5 s | `time brew install yourorg/tap/supercli` |
| Bottle install time (cold) | < 20 s | first install on fresh machine |
| Source install time | < 30 s | `brew install --build-from-source` |
| `brew test` runtime | < 10 s | `time brew test yourorg/tap/supercli` |
| `brew audit --strict --new --online` | < 15 s | `time brew audit ...` |
| Bottle file size | < 50 MB compressed | `ls -lh bottle.tar.gz` |
| Cellar footprint | < 200 MB | `du -sh $(brew --cellar)/supercli` |
| Tap clone size | < 5 MB | `du -sh $(brew --repo yourorg/tap)` |
| `brew livecheck` runtime | < 10 s | `time brew livecheck --tap=yourorg/tap supercli` |

**When a budget is exceeded:**

- Bottle too large: ship per-platform bottles instead of fat binaries. Strip debug symbols upstream.
- Test slow: split into unit-style (in `test do`) + smoke-only here; full integration belongs in upstream's CI.
- Source install slow: ship more bottles; the source path should be the fallback, not the norm.
- Tap clone large: don't commit binaries; check `.gitignore` includes `*.tar.gz`, `*.bottle.*`.

---

## 11. Security

### Secret storage

- **Never commit:** PATs, signing keys, anything ending in `_TOKEN`/`_KEY`/`_SECRET`.
- **Where they live:** GitHub repo secrets only (`Settings → Secrets and variables → Actions`).
- **Names:**
  - `HOMEBREW_TAP_PAT` — fine-grained PAT on upstream repo, used to dispatch into the tap.
  - The tap itself rarely needs secrets; CI uses the default `GITHUB_TOKEN` for in-repo actions.

### Auth threat model

| Actor | Can do |
|---|---|
| Anonymous user | Read formula, install bottle, see release URLs |
| Tap maintainer | Merge PRs, label `pr-pull`, manage CI |
| Upstream release author | Trigger formula bump via `repository_dispatch` |
| Stolen `HOMEBREW_TAP_PAT` | Push branches, open PRs in tap (cannot merge unless CODEOWNERS allows) |

**Critical:** PR merge into the tap is a TRUSTED action. Anyone who can merge a malicious formula edit can poison every install. Require code review on `main`.

### Input validation boundary

Brew evaluates the Ruby formula file. **Treat every formula as code from a trusted source.** Validate at PR review:

- `url` points to your domain or upstream's domain — never `attacker.com`.
- `sha256` matches what `brew fetch --force` printed.
- `def install` only moves files; no `system "curl ..."` shenanigans.

### Output escaping

Inside `def install` and `test do`, prefer Ruby's Pathname API (`bin.install`, `share.install`) over shell strings. If you must `system`, use the multi-arg form: `system "supercli", "init", testpath`, NOT `system "supercli init #{testpath}"` (shell injection).

### Permissions / capabilities

Brew formulas run with the user's permissions. They cannot:

- Touch `/etc`, `/usr` (outside `/usr/local/Cellar`), `/System`.
- Install kernel extensions.
- Run as root (don't `sudo`; brew refuses).

But they CAN:

- Read `~/.ssh`, `~/.aws`, etc. — keep that in mind when accepting third-party formulas into your tap.

### Dependency audit

```bash
# Show what supercli depends on
brew deps --tree yourorg/tap/supercli

# Check for outdated dependencies (run weekly)
brew outdated --tap=yourorg/tap

# Audit the formula's Ruby source
brew style yourorg/tap
brew audit --strict --new --online --tap=yourorg/tap supercli
```

### Top 5 stack-specific risks

1. **Compromised PAT pushes a poisoned formula PR + auto-merges via Actions.** Mitigation: require human approval on merge; CODEOWNERS on `Formula/`; protect `main`.
2. **Upstream release tarball replaced (force-push tag).** Mitigation: pin `url` to `/releases/download/<tag>/`; trust the SHA256 in the formula; never auto-trust new SHAs.
3. **Malicious dependency pulled via `depends_on`.** Mitigation: depend only on `homebrew/core` formulas, never other taps unless audited.
4. **`livecheck` regex matches a malicious tag.** Mitigation: anchor regex; review every bump PR.
5. **Tap repo deleted/transferred — users get install errors but no warning.** Mitigation: avoid org renames; if necessary, leave a redirect formula that errors loudly with migration instructions.

---

## 12. Deploy

### Full release flow (assume upstream just tagged v1.2.3)

```bash
# === ON THE UPSTREAM CLI REPO (yourorg/supercli) ===

# 1. Tag the release
git tag v1.2.3
git push origin v1.2.3

# 2. CI builds binaries for all four platforms and uploads to GitHub Releases:
#    supercli-1.2.3-darwin-arm64.tar.gz
#    supercli-1.2.3-darwin-amd64.tar.gz
#    supercli-1.2.3-linux-arm64.tar.gz
#    supercli-1.2.3-linux-amd64.tar.gz
# (This is the upstream's job — out of scope for this rulebook beyond the contract.)

# 3. The upstream's release.yml dispatches to the tap (see workflow content in section 16):
#    - event_type: bump-formula
#    - payload: { formula: supercli, tag: v1.2.3 }

# === IN THE TAP REPO (yourorg/homebrew-tap) — automated ===

# 4. publish.yml workflow_dispatch handler runs:
#    - Calls dawidd6/action-homebrew-bump-formula
#    - It computes new SHA256s for all 4 tarballs
#    - Opens a PR titled "supercli 1.2.3"

# 5. tests.yml runs on the bump PR:
#    - brew style + brew audit
#    - brew install --build-from-source on macos-15 / macos-14 / ubuntu-24.04 / ubuntu-24.04-arm
#    - brew test on each
#    - brew test-bot uploads bottle artifacts (per-platform .tar.gz)

# 6. Maintainer reviews PR, labels with `pr-pull`.

# 7. publish.yml's pr-pull handler runs:
#    - Downloads bottle artifacts
#    - Uploads them to a GitHub Release on the tap (e.g. `supercli-1.2.3`)
#    - Commits the bottle DSL update to main

# 8. End users get the new bottle on next `brew update && brew upgrade`.
```

### Manual fallback (when automation fails)

```bash
# From a clone of the tap on your machine:
cd ~/code/homebrew-tap
git pull
brew bump-formula-pr \
  --version=1.2.3 \
  --message="release v1.2.3" \
  yourorg/tap/supercli
# Review the diff, push the branch, open the PR.
```

### Staging vs prod

- **No staging tap.** Brew has no concept. Use a separate branch + `brew tap yourorg/tap --branch=staging` for testing, then merge to `main`.
- For pre-release testing: tag upstream `v1.2.3-rc1`, push to a draft GitHub release, run `brew install --HEAD yourorg/tap/supercli` if you've defined a `head` block.

### Rollback

```bash
# 1. Revert the formula commit on main
git -C "$(brew --repo yourorg/tap)" log --oneline Formula/supercli.rb
git revert <sha-of-bad-bump>
git push origin main

# 2. Users on the bad version self-heal by:
brew update && brew reinstall yourorg/tap/supercli

# 3. Delete the bad GitHub Release on the tap (so bottle URL is dead)
gh release delete supercli-1.2.3 --repo yourorg/homebrew-tap --yes

# Max safe rollback window: any time. Brew always pulls the formula at HEAD.
```

### Health check

```bash
# Run on a fresh container:
docker run --rm -it homebrew/brew bash -c '
  brew tap yourorg/tap &&
  brew install yourorg/tap/supercli &&
  supercli --version
'
# Expected output: 1.2.3
```

### Versioning scheme

- Semver: `MAJOR.MINOR.PATCH`. Strip leading `v`.
- Stored in:
  - `Formula/supercli.rb` `url` (interpolated via `#{version}`)
  - `Formula/supercli.rb` `sha256` lines (one per arch)
  - `Formula/supercli.rb` `bottle do` block (per-arch SHAs after CI bottling)
  - GitHub Release on tap: `supercli-1.2.3`

### Auto-update path

Users get new versions automatically on `brew upgrade` (or daily auto-update if they haven't disabled it). No app-side update logic needed.

### Cost estimate per 1k MAU

- GitHub free tier handles tap repo + Releases hosting at zero cost up to 1 GB total assets.
- Bottle assets: ~10 MB each × 4 archs × 12 versions/year = ~500 MB/year. Free.
- GitHub Actions minutes: ~10 min per release × 12 releases = 120 min/year. Free tier covers 2000 min/month for public repos.
- **Total: $0/yr for any tap < ~1 GB cumulative bottle storage.**

### Optional: Submitting to homebrew-core

Only after:

- 30+ days of stable releases.
- 75+ GitHub stars (3x = 225+ if self-submitted by maintainer).
- Already in your tap, working, well-tested.
- Has a homepage that explains what it does to a non-developer.

```bash
# 1. Fork homebrew-core
gh repo fork Homebrew/homebrew-core --clone

# 2. Copy your formula in
cp ~/code/homebrew-tap/Formula/supercli.rb \
   ~/code/homebrew-core/Formula/s/supercli.rb
# Note: homebrew-core uses sharded subdirs by first letter.

# 3. Strip the bottle DSL — homebrew-core's BrewTestBot rebottles
$EDITOR Formula/s/supercli.rb   # remove `bottle do ... end`

# 4. Audit (--new is mandatory)
brew audit --strict --new --online supercli

# 5. Test
brew install --build-from-source supercli && brew test supercli

# 6. PR
git checkout -b new-formula-supercli
git add Formula/s/supercli.rb
git commit -m "supercli 1.2.3 (new formula)"
git push origin new-formula-supercli
gh pr create --title "supercli 1.2.3 (new formula)" --body "..."

# 7. Wait for maintainer review (days to weeks). Address feedback.
```

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# Claude Code Rules — homebrew-tap

This is a Homebrew tap repo. The single source of truth for behavior is `RULEBOOK.md` (or wherever this project's rulebook lives). Read it before making any changes.

## What this repo is
A GitHub repo named `homebrew-tap` (NOT `tap`) containing `Formula/<name>.rb` files that brew evaluates when users run `brew install yourorg/tap/<name>`.

## Always
- Run `brew style yourorg/tap` before claiming any formula change is done.
- Run `brew audit --strict --new --online --tap=yourorg/tap <formula>` before claiming any formula change is done.
- Run `brew install --build-from-source yourorg/tap/<formula>` and `brew test yourorg/tap/<formula>` to verify the formula loads and works.
- Use `bin.install` / `man1.install` etc. — never `cp` or `mv`.
- Use `OS.mac?` / `Hardware::CPU.arm?` inside `def install` and `test do`.
- Use `on_macos do` / `on_arm do` blocks at the top level of the class.
- Match formula filename to lowercased class name (super-cli.rb ↔ class SuperCli).
- Strip leading `v` from upstream tags when setting `version`.
- Pin `url` to `/releases/download/v#{version}/` paths.
- Include `livecheck do` and `test do` in every formula.

## Never
- Never use `bottle :unneeded` (deprecated, hard error).
- Never put `on_macos` / `on_arm` etc. inside `def install` or `test do`.
- Never hand-edit a SHA256. Use `brew fetch --force` or `brew bump-formula-pr`.
- Never depend on system Ruby. Brew bundles its own.
- Never echo or log secrets.
- Never use `sudo` in a formula.
- Never mix workflow edits and formula edits in the same PR.

## Verification recipe
```bash
brew style yourorg/tap
brew audit --strict --new --online --tap=yourorg/tap <formula>
brew install --build-from-source yourorg/tap/<formula>
brew test yourorg/tap/<formula>
brew livecheck --tap=yourorg/tap <formula>
```

## Slash commands to invoke
- `/test-driven-development` before adding a new formula.
- `/systematic-debugging` when an install fails.
- `/verification-before-completion` before claiming done.
- `/ship` when ready to push and open a PR.
```

### `.claude/settings.json`

```json
{
  "$schema": "https://json.schemastore.org/claude-code-settings.json",
  "permissions": {
    "allow": [
      "Bash(brew style:*)",
      "Bash(brew audit:*)",
      "Bash(brew install:*)",
      "Bash(brew uninstall:*)",
      "Bash(brew reinstall:*)",
      "Bash(brew test:*)",
      "Bash(brew livecheck:*)",
      "Bash(brew tap:*)",
      "Bash(brew untap:*)",
      "Bash(brew fetch:*)",
      "Bash(brew info:*)",
      "Bash(brew deps:*)",
      "Bash(brew --repo:*)",
      "Bash(brew --repository:*)",
      "Bash(brew --prefix:*)",
      "Bash(brew --cellar:*)",
      "Bash(brew --version)",
      "Bash(brew bump-formula-pr:*)",
      "Bash(brew linkage:*)",
      "Bash(shasum:*)",
      "Bash(curl -fsSL:*)",
      "Bash(curl -fsSI:*)",
      "Bash(gh repo view:*)",
      "Bash(gh release list:*)",
      "Bash(gh release view:*)",
      "Bash(gh workflow list:*)",
      "Bash(gh workflow view:*)",
      "Bash(gh workflow run:*)",
      "Bash(gh pr list:*)",
      "Bash(gh pr view:*)",
      "Bash(gh pr create:*)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git push:*)",
      "Bash(git pull:*)",
      "Bash(git checkout:*)",
      "Bash(git branch:*)"
    ],
    "deny": [
      "Bash(sudo:*)",
      "Bash(rm -rf /:*)",
      "Bash(rm -rf /opt/homebrew:*)",
      "Bash(rm -rf /home/linuxbrew:*)",
      "Bash(brew upgrade)",
      "Bash(brew update)",
      "Bash(echo *HOMEBREW_TAP_PAT*)",
      "Bash(env)"
    ]
  },
  "hooks": {
    "PreToolUse": [],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT_FILE_PATH\" | grep -q 'Formula/.*\\.rb$'; then brew style \"$CLAUDE_TOOL_INPUT_FILE_PATH\" || true; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "cd \"$CLAUDE_PROJECT_DIR\" && (test ! -d Formula || for f in Formula/*.rb; do brew style \"$f\" 2>&1; done)"
          }
        ]
      }
    ]
  }
}
```

### Recommended skills + when to invoke

| Skill | When |
|---|---|
| `/test-driven-development` | Adding a new formula or new bottle arch |
| `/systematic-debugging` | `brew install` fails for a user |
| `/verification-before-completion` | Before any commit to `main` |
| `/ship` | After review-ready, before PR |
| `/review` | Before merging the bump PR |
| `/codex` | Second opinion on a formula refactor |

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# Codex Agent Rules — homebrew-tap

You are working in a Homebrew tap repository. The full rulebook is `RULEBOOK.md`. Read it first.

## Repo layout
- `Formula/<name>.rb` — Ruby formulas. One per CLI we distribute.
- `.github/workflows/` — CI for testing and publishing bottles.
- `README.md` — user-facing install instructions.

## Required checks (run all before claiming done)
1. `brew style yourorg/tap`
2. `brew audit --strict --new --online --tap=yourorg/tap <formula>`
3. `brew install --build-from-source yourorg/tap/<formula>`
4. `brew test yourorg/tap/<formula>`
5. `brew livecheck --tap=yourorg/tap <formula>`

All must pass. Do not amend output.

## Differences from a typical software project
- There is no compile step. Brew evaluates the `.rb` file directly.
- There is no test directory; tests live in `test do` blocks inside the formula.
- The class name MUST match the filename (PascalCase ↔ kebab-lowercase).
- You cannot use `on_macos` / `on_arm` inside `def install`. Use `if OS.mac?` / `if Hardware::CPU.arm?` plain conditionals there.
- `bottle :unneeded` is a hard error in brew 5.x. Never write it.

## Sandbox + approval
- Network: needed for `brew audit --online` and `brew livecheck`. Allow.
- Filesystem: brew writes to `$HOME/Library/Caches/Homebrew` (macOS) or `$HOME/.cache/Homebrew` (Linux). Allow read+write.
- Approval mode: `on-failure` is fine; brew commands are deterministic.
```

### `.codex/config.toml`

```toml
[default]
model = "gpt-5"
sandbox = "workspace-write"
approval = "on-failure"

[[default.tools]]
name = "shell"
[default.tools.shell]
allow_network = true

[default.commands]
pre_commit = [
  "brew style yourorg/tap",
  "brew audit --strict --new --online --tap=yourorg/tap supercli",
  "brew install --build-from-source yourorg/tap/supercli",
  "brew test yourorg/tap/supercli"
]

[ignore]
paths = [
  ".bundle/",
  "vendor/",
  "*.bottle.tar.gz"
]
```

### Where Codex differs from Claude Code

- Codex is more aggressive about running shell commands; the network allowlist matters more.
- Codex tends to emit minimal commits — fine for bumps, watch out for missed test updates.
- Codex doesn't have hooks; replicate the Claude `PostToolUse` style check by adding a pre-commit step.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# Cursor rules for homebrew-tap

This is a Homebrew tap. Files in Formula/*.rb are Ruby DSL evaluated by brew.

## Always
- Match filename to class name: super-cli.rb ↔ class SuperCli.
- Use `bin.install`, `man1.install`, `bash_completion.install` — never raw cp/mv.
- Use `on_macos` / `on_linux` / `on_arm` / `on_intel` blocks at TOP level only.
- Use `if OS.mac?` / `if Hardware::CPU.arm?` inside `def install` and `test do`.
- Run `brew style` and `brew audit --strict --new --online` before declaring done.
- Pin URLs to /releases/download/v#{version}/ paths.
- Include `livecheck` and `test` blocks in every formula.

## Never
- Never write `bottle :unneeded` — it is deprecated and a hard error.
- Never use `on_macos` etc. inside `def install` or `test do`.
- Never hand-edit a sha256. Use `brew fetch --force` or `brew bump-formula-pr`.
- Never echo secrets or `env` in CI workflows.
- Never `sudo` in a formula.
- Never depend on system Ruby — brew bundles its own.
- Never mix CI workflow edits with formula edits in one PR.

## Verification
brew style yourorg/tap
brew audit --strict --new --online --tap=yourorg/tap <formula>
brew install --build-from-source yourorg/tap/<formula>
brew test yourorg/tap/<formula>
brew livecheck --tap=yourorg/tap <formula>
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "rebornix.ruby",
    "wingrunr21.vscode-ruby",
    "github.vscode-github-actions",
    "redhat.vscode-yaml",
    "DavidAnson.vscode-markdownlint",
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
      "name": "brew install (build from source, current formula)",
      "type": "node-terminal",
      "request": "launch",
      "command": "brew uninstall --ignore-dependencies $(basename ${file} .rb) 2>/dev/null; brew install --build-from-source --verbose --debug yourorg/tap/$(basename ${file} .rb)",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "brew test (current formula)",
      "type": "node-terminal",
      "request": "launch",
      "command": "brew test --verbose --debug yourorg/tap/$(basename ${file} .rb)",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "brew audit (current formula)",
      "type": "node-terminal",
      "request": "launch",
      "command": "brew audit --strict --new --online --tap=yourorg/tap $(basename ${file} .rb)",
      "cwd": "${workspaceFolder}"
    },
    {
      "name": "brew livecheck (current formula)",
      "type": "node-terminal",
      "request": "launch",
      "command": "brew livecheck --debug --tap=yourorg/tap $(basename ${file} .rb)",
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

---

## 16. First-PR Scaffold

Create the following files in order. After the last file, `git push` yields a tap that responds to `brew install yourorg/tap/supercli` (modulo upstream having published the binary releases referenced).

### 1. `.gitignore`

```
.DS_Store
.bundle/
vendor/
*.bottle.tar.gz
*.bottle.json
node_modules/
.idea/
.vscode/*.local
```

### 2. `LICENSE` (MIT example)

```
MIT License

Copyright (c) 2026 Your Org

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

### 3. `README.md`

````markdown
# yourorg/homebrew-tap

Homebrew formulas for yourorg's CLI tools. Works on macOS (Sonoma+) and Linux (x86_64 + ARM64).

Windows is not supported by Homebrew. Use WSL2 with Ubuntu 22.04+.

## Install

```sh
brew install yourorg/tap/supercli
```

That's it. Run `supercli --help` to confirm.

## What's included

| Formula | Description | Install |
|---|---|---|
| `supercli` | A generic example CLI | `brew install yourorg/tap/supercli` |

## Updating

```sh
brew update
brew upgrade yourorg/tap/supercli
```

## Uninstalling

```sh
brew uninstall yourorg/tap/supercli
brew untap yourorg/tap
```

## For maintainers

See `RULEBOOK.md` for the full distribution flow.

Quick-start:

```sh
brew style yourorg/tap
brew audit --strict --new --online --tap=yourorg/tap supercli
brew install --build-from-source yourorg/tap/supercli
brew test yourorg/tap/supercli
brew livecheck --tap=yourorg/tap supercli
```

## License

MIT — see [LICENSE](LICENSE).
````

### 4. `Formula/supercli.rb` — full inline content

```ruby
class Supercli < Formula
  desc "Example CLI distributed via this Homebrew tap"
  homepage "https://github.com/yourorg/supercli"
  version "1.0.0"
  license "MIT"

  on_macos do
    on_arm do
      url "https://github.com/yourorg/supercli/releases/download/v#{version}/supercli-#{version}-darwin-arm64.tar.gz"
      sha256 "0000000000000000000000000000000000000000000000000000000000000000"
    end
    on_intel do
      url "https://github.com/yourorg/supercli/releases/download/v#{version}/supercli-#{version}-darwin-amd64.tar.gz"
      sha256 "1111111111111111111111111111111111111111111111111111111111111111"
    end
  end

  on_linux do
    on_arm do
      url "https://github.com/yourorg/supercli/releases/download/v#{version}/supercli-#{version}-linux-arm64.tar.gz"
      sha256 "2222222222222222222222222222222222222222222222222222222222222222"
    end
    on_intel do
      url "https://github.com/yourorg/supercli/releases/download/v#{version}/supercli-#{version}-linux-amd64.tar.gz"
      sha256 "3333333333333333333333333333333333333333333333333333333333333333"
    end
  end

  livecheck do
    url :stable
    strategy :github_latest
    regex(/^v?(\d+(?:\.\d+)+)$/i)
  end

  # bottle do is populated by CI (brew test-bot) after the first successful build.
  # Once bottles exist, this block looks like:
  #
  # bottle do
  #   root_url "https://github.com/yourorg/homebrew-tap/releases/download/supercli-1.0.0"
  #   sha256 cellar: :any_skip_relocation, arm64_sequoia: "aaaa...."
  #   sha256 cellar: :any_skip_relocation, sonoma:        "bbbb...."
  #   sha256 cellar: :any_skip_relocation, ventura:       "cccc...."
  #   sha256 cellar: :any_skip_relocation, arm64_linux:   "dddd...."
  #   sha256 cellar: :any_skip_relocation, x86_64_linux:  "eeee...."
  # end

  def install
    bin.install "supercli"

    # Shell completions, if upstream ships them.
    bash_completion.install "completions/supercli.bash" => "supercli" if File.exist?("completions/supercli.bash")
    zsh_completion.install  "completions/_supercli"                   if File.exist?("completions/_supercli")
    fish_completion.install "completions/supercli.fish"               if File.exist?("completions/supercli.fish")

    # Manpage, if shipped.
    man1.install "man/supercli.1" if File.exist?("man/supercli.1")
  end

  test do
    # Real functionality — not just --version.
    (testpath/"input.txt").write("hello world\n")
    output = shell_output("#{bin}/supercli render #{testpath}/input.txt")
    assert_match "hello world", output
    assert_predicate testpath/"input.txt", :exist?

    # Verify the binary is the expected version.
    assert_match version.to_s, shell_output("#{bin}/supercli --version")
  end
end
```

### 5. `.github/workflows/tests.yml` — full inline content

```yaml
name: tests

on:
  push:
    branches: [main]
  pull_request:

concurrency:
  group: "${{ github.workflow }}-${{ github.ref }}"
  cancel-in-progress: ${{ github.event_name == 'pull_request' }}

jobs:
  test-bot:
    strategy:
      fail-fast: false
      matrix:
        os:
          - macos-15      # arm64_sequoia bottle
          - macos-14      # arm64_sonoma bottle
          - ubuntu-24.04  # x86_64_linux bottle
          - ubuntu-24.04-arm  # arm64_linux bottle
    runs-on: ${{ matrix.os }}
    steps:
      - name: Set up Homebrew
        id: setup-homebrew
        uses: Homebrew/actions/setup-homebrew@main

      - name: Cache Homebrew Bundler RubyGems
        uses: actions/cache@v4
        with:
          path: ${{ steps.setup-homebrew.outputs.gems-path }}
          key: ${{ matrix.os }}-rubygems-${{ steps.setup-homebrew.outputs.gems-hash }}
          restore-keys: ${{ matrix.os }}-rubygems-

      - name: Install Homebrew Bundler RubyGems
        run: brew install-bundler-gems

      - name: Run brew test-bot --only-cleanup-before
        run: brew test-bot --only-cleanup-before

      - name: Run brew test-bot --only-setup
        run: brew test-bot --only-setup

      - name: Run brew test-bot --only-tap-syntax
        run: brew test-bot --only-tap-syntax

      - name: Run brew test-bot --only-formulae
        if: github.event_name == 'pull_request'
        run: brew test-bot --only-formulae --root-url="https://github.com/${{ github.repository }}/releases/download/bottles"

      - name: Upload bottles as artifact
        if: always() && github.event_name == 'pull_request'
        uses: actions/upload-artifact@v4
        with:
          name: bottles_${{ matrix.os }}
          path: '*.bottle.*'
```

### 6. `.github/workflows/publish.yml` — full inline content

```yaml
name: publish

on:
  workflow_dispatch:
    inputs:
      formula:
        description: "Formula name (e.g. supercli)"
        required: true
        default: "supercli"
      tag:
        description: "Upstream tag to bump to (e.g. v1.2.3)"
        required: true
  repository_dispatch:
    types: [bump-formula]

jobs:
  pr-pull:
    if: github.event_name == 'pull_request_target' && github.event.label.name == 'pr-pull'
    runs-on: ubuntu-24.04
    steps:
      - name: Set up Homebrew
        uses: Homebrew/actions/setup-homebrew@main
      - name: Configure Git user
        uses: Homebrew/actions/git-user-config@main
      - name: Pull bottles
        env:
          HOMEBREW_GITHUB_API_TOKEN: ${{ secrets.HOMEBREW_TAP_PAT }}
          PULL_REQUEST: ${{ github.event.pull_request.number }}
        run: brew pr-pull --debug --tap="$GITHUB_REPOSITORY" "$PULL_REQUEST"
      - name: Push commits
        env:
          GIT_COMMITTER_NAME: BrewTestBot
          GIT_COMMITTER_EMAIL: 1589480+BrewTestBot@users.noreply.github.com
          HOMEBREW_GITHUB_API_TOKEN: ${{ secrets.HOMEBREW_TAP_PAT }}
        run: git push https://x-access-token:${HOMEBREW_GITHUB_API_TOKEN}@github.com/${GITHUB_REPOSITORY}.git HEAD:main

  bump:
    if: github.event_name == 'workflow_dispatch' || github.event_name == 'repository_dispatch'
    runs-on: ubuntu-24.04
    steps:
      - name: Determine inputs
        id: vars
        run: |
          if [ "${{ github.event_name }}" = "repository_dispatch" ]; then
            echo "formula=${{ github.event.client_payload.formula }}" >> "$GITHUB_OUTPUT"
            echo "tag=${{ github.event.client_payload.tag }}" >> "$GITHUB_OUTPUT"
          else
            echo "formula=${{ inputs.formula }}" >> "$GITHUB_OUTPUT"
            echo "tag=${{ inputs.tag }}" >> "$GITHUB_OUTPUT"
          fi

      - name: Bump formula via dawidd6 action
        uses: dawidd6/action-homebrew-bump-formula@v4
        with:
          token: ${{ secrets.HOMEBREW_TAP_PAT }}
          tap: ${{ github.repository }}
          formula: ${{ steps.vars.outputs.formula }}
          tag: ${{ steps.vars.outputs.tag }}
          force: false
          livecheck: false
```

### 7. Upstream repo's `release.yml` (lives in `yourorg/supercli`, NOT in tap — informational)

```yaml
# Save as: yourorg/supercli/.github/workflows/release.yml
name: release-and-bump-tap

on:
  release:
    types: [published]

jobs:
  bump:
    runs-on: ubuntu-24.04
    steps:
      - name: Dispatch bump to tap
        uses: peter-evans/repository-dispatch@v3
        with:
          token: ${{ secrets.HOMEBREW_TAP_PAT }}
          repository: yourorg/homebrew-tap
          event-type: bump-formula
          client-payload: |
            {
              "formula": "supercli",
              "tag": "${{ github.event.release.tag_name }}"
            }
```

### 8. `CLAUDE.md`, `AGENTS.md`, `.cursor/rules`

(Use the contents from sections 13, 14, 15.)

After all files exist:

```bash
git add .
git commit -m "Initial tap with supercli formula and CI"
git push -u origin main

# Add the PAT secret in upstream repo:
gh secret set HOMEBREW_TAP_PAT --repo yourorg/supercli --body "<paste-pat>"

# Smoke:
brew tap yourorg/tap
brew install yourorg/tap/supercli
brew test yourorg/tap/supercli
```

---

## 17. Idea → MVP Path

**Goal:** from your CLI binary to `brew install yourtap/cli/supercli` working on a clean machine.

Assumes upstream CLI repo (yourorg/supercli) already exists and produces release tarballs of the form `supercli-X.Y.Z-<os>-<arch>.tar.gz` containing a `supercli` binary at the root.

### Phase 1 — Tap repo skeleton (1 AI session)

**Files:** `Formula/supercli.rb` (with placeholder SHAs), `README.md`, `LICENSE`, `.gitignore`, `.cursor/rules`, `CLAUDE.md`, `AGENTS.md`.

**Exit criteria:**
- Repo created on GitHub as `yourorg/homebrew-tap`.
- `brew tap yourorg/tap` succeeds locally.
- Formula loads (`brew info yourorg/tap/supercli` returns metadata; SHAs may still be placeholders).

### Phase 2 — Real binaries + working install (1 session)

**Files:** update `Formula/supercli.rb` with real `url` + `sha256` per arch.

**Steps:**
1. Trigger upstream release of v1.0.0 (or use existing release).
2. For each arch, run `curl -fsSL <url> | shasum -a 256` to get the SHA.
3. Paste into the formula.
4. `brew install --build-from-source yourorg/tap/supercli` — must succeed.
5. `supercli --version` — must print `1.0.0`.

**Exit criteria:**
- Source install works on AT LEAST one platform from the AI's machine.
- `brew test yourorg/tap/supercli` exits 0.
- `brew audit --strict --new --online --tap=yourorg/tap supercli` exits 0.

### Phase 3 — CI bottling on PR (1 session)

**Files:** `.github/workflows/tests.yml`.

**Steps:**
1. Open a draft PR with a no-op formula change.
2. Watch all four matrix jobs go green.
3. Confirm bottle artifacts uploaded.

**Exit criteria:**
- `tests.yml` matrix all green on PR.
- Bottle artifacts (`*.bottle.tar.gz`) visible in the run summary.

### Phase 4 — Auto-bump on upstream release (1 session)

**Files:** `.github/workflows/publish.yml` (in tap), `.github/workflows/release.yml` (in upstream).

**Steps:**
1. Create fine-grained PAT named `HOMEBREW_TAP_PAT`.
2. Add as repo secret in BOTH the upstream repo (for dispatch) and the tap (for pr-pull).
3. Tag a fresh upstream release (`v1.0.1`).
4. Watch the tap repo for an auto-opened PR titled `supercli 1.0.1`.
5. Label the PR `pr-pull` after CI green; bottles publish.

**Exit criteria:**
- Tag → PR opens within 2 min.
- PR auto-merges (or after manual `pr-pull` label) within 10 min.
- Released bottles visible at `https://github.com/yourorg/homebrew-tap/releases/tag/supercli-1.0.1`.

### Phase 5 — Livecheck + monitoring (1 session)

**Files:** none new — verify only.

**Steps:**
1. `brew livecheck --tap=yourorg/tap supercli` returns the expected version.
2. Set up a weekly GitHub Action that runs `brew livecheck` against your whole tap and opens an issue if any formula falls behind upstream by more than 7 days.
3. Document the install command in your README + your CLI docs.

**Exit criteria:**
- New end users can install with one command, no caveats.
- Bumps happen without human intervention from upstream tag → installable bottle.

---

## 18. Feature Recipes

Common formula patterns with full inline content.

### Recipe 1 — Add shell completion

```ruby
def install
  bin.install "supercli"
  generate_completions_from_executable(bin/"supercli", "completion")
end
```

### Recipe 2 — Add manpage

```ruby
def install
  bin.install "supercli"
  man1.install "man/supercli.1"
end
```

### Recipe 3 — Multi-binary install

```ruby
def install
  bin.install "supercli", "supercli-helper"
  # or:
  # bin.install Dir["bin/*"]
end
```

### Recipe 4 — Add a service (daemon)

```ruby
service do
  run [opt_bin/"supercli", "daemon"]
  keep_alive true
  log_path var/"log/supercli.log"
  error_log_path var/"log/supercli.log"
end
```

User starts with `brew services start supercli`.

### Recipe 5 — Depend on another formula

```ruby
depends_on "git" => :build      # available during install only
depends_on "openssl@3"          # runtime
depends_on "ripgrep" => :test   # only used in test do
depends_on macos: ">= :ventura" # OS minimum
```

### Recipe 6 — Conditional install for one platform

```ruby
def install
  bin.install "supercli"

  # macOS-only post-install (e.g. plist)
  if OS.mac?
    (prefix/"share/supercli/Info.plist").write <<~XML
      <?xml version="1.0" encoding="UTF-8"?>
      <!-- ... -->
    XML
  end

  # Linux-only
  if OS.linux?
    (prefix/"share/supercli/supercli.service").write <<~UNIT
      [Unit]
      Description=supercli
      [Service]
      ExecStart=#{opt_bin}/supercli daemon
    UNIT
  end
end
```

### Recipe 7 — `head` block for development install

```ruby
head do
  url "https://github.com/yourorg/supercli.git", branch: "main"
  depends_on "go" => :build
end

def install
  if build.head?
    system "go", "build", "-o", bin/"supercli", "./cmd/supercli"
  else
    bin.install "supercli"
  end
end
```

### Recipe 8 — Custom livecheck (non-GitHub source)

```ruby
livecheck do
  url "https://example.com/supercli/releases/"
  regex(/href=.*?supercli[._-]v?(\d+(?:\.\d+)+)\.tar\.gz/i)
end
```

### Recipe 9 — Pinned dependency version

```ruby
depends_on "node@20"          # always exactly Node 20
depends_on "python@3.12"      # always exactly Python 3.12
```

### Recipe 10 — Caveats (post-install message)

```ruby
def caveats
  <<~EOS
    To start using supercli, run:
      supercli init

    Config file location:
      #{ENV["HOME"]}/.config/supercli/config.toml

    Documentation:
      https://github.com/yourorg/supercli#readme
  EOS
end
```

---

## 19. Troubleshooting

| Verbatim error | Exact fix |
|---|---|
| `Error: Invalid tap name 'yourorg/tap'` | GitHub repo must be named `homebrew-tap`, not `tap`. Rename via `gh repo rename homebrew-tap`. |
| `Error: SHA256 mismatch` | Re-fetch: `brew fetch --force <formula>`. Copy printed SHA into formula. |
| `Error: undefined method 'on_arm' for ...` (line in `def install`) | Replace `on_arm do ... end` with `if Hardware::CPU.arm? ... end` inside `def install`. |
| `Error: Calling bottle :unneeded is disabled!` | Delete the `bottle :unneeded` line. |
| `fatal: could not read Username for 'https://github.com'` (CI) | Workflow uses `GITHUB_TOKEN` for cross-repo write. Switch to `${{ secrets.HOMEBREW_TAP_PAT }}`. |
| `Error: License "MIT/X11" is invalid.` | Use SPDX ID: `license "MIT"`. |
| `Error: yourorg/tap/supercli's homepage seems unreachable.` | Make sure the homepage URL responds 200 with no auth. |
| `Error: No available formula with the name "supercli".` | Run `brew tap yourorg/tap` first, or check the filename matches the lowercase short name. |
| `Error: Cannot tap yourorg/tap: invalid syntax in tap!` | Run `brew style yourorg/tap` to find the syntax error in the .rb file. |
| `Error: yourorg/tap/supercli has no formula objects` | Class name must inherit `< Formula` and match the filename in PascalCase. |
| `Error: Failed to load tap` | Stale tap cache. `brew untap yourorg/tap && brew tap yourorg/tap`. |
| `Error: yourorg/tap is empty!` | The tap repo has no `Formula/` dir or no `.rb` files. |
| `Warning: undefined method 'bottle' for ...` | You wrote `bottle :unneeded` instead of a `bottle do ... end` block. Remove it. |
| `Error: yourorg/tap/supercli: wrong number of arguments` | A method was called with the wrong arity. Run `ruby -c Formula/supercli.rb` to check syntax. |
| `Error: Permission denied` (during install) | You ran `sudo brew install`. Don't. Brew refuses to run as root. |
| `==> Pouring supercli--<v>.bottle.tar.gz` followed by `Error: Empty installation` | Bottle was built on the wrong runner image. Match `os` matrix to bottle arch. |
| `Error: Resource "X" did not match the expected SHA256` | Same as plain SHA mismatch. Refetch + repaste. |
| `Error: Formulae found in invalid locations` | Formula is at the repo root or in `Formulas/` (with s). Move to `Formula/`. |
| `Error: Unknown command: pr-pull` | You're missing `homebrew/test-bot` tap. `brew tap homebrew/test-bot`. |
| `error: pathspec 'main' did not match any file(s) known to git` | Default branch is named differently. Use `master` or update the workflow. |
| `Error: Calling 'depends_on :macos' is deprecated.` | Use `depends_on macos: :ventura` syntax. |
| `Error: GitHub release notes asset not found` | Upstream release missing the binary tarball. Re-upload. |
| `livecheck: --HEAD-only formula has no version to check` | Add a stable `url`. `head do` alone isn't enough for livecheck. |
| `brew test-bot: error: Cannot find an installed formula` | The formula isn't in `Formula/`. Check directory casing on Linux. |
| `Error: Cannot install in Homebrew on ARM processor in Intel default prefix` | User is on Apple Silicon but using Intel `/usr/local`. Tell them to install brew at `/opt/homebrew`. |
| `Error: Could not load Formula yourorg/tap/supercli` | Syntax error. `ruby -c Formula/supercli.rb` then `brew style`. |
| `Error: Cask 'X' is unavailable` | You ran `brew install --cask` against a formula. Drop `--cask`. |
| `Error: ENOENT: no such file or directory, open 'Formula/supercli.rb'` | Filename mismatch (case). On Linux, must be exact lowercase. |
| `bash: brew: command not found` | Brew not on PATH. macOS Apple Silicon: `eval "$(/opt/homebrew/bin/brew shellenv)"`; Linux: `eval "$(/home/linuxbrew/.linuxbrew/bin/brew shellenv)"`. |
| `Error: brew update failed!` | Stale tap. `cd $(brew --repo) && git fetch --all --prune && brew update-reset`. |
| `error: GH006: Protected branch update failed` (CI push to main) | `main` is protected. The PAT needs to bypass branch protection or you need to allow PR-based merges only. |

---

## 20. Glossary

- **Bottle** — A pre-built binary tarball Homebrew can extract instead of compiling from source. Produced by `brew test-bot` in CI.
- **Brew** — Homebrew's CLI, executable as `brew`.
- **Cellar** — The directory where brew installs everything: `/opt/homebrew/Cellar` on Apple Silicon Mac, `/usr/local/Cellar` on Intel Mac, `/home/linuxbrew/.linuxbrew/Cellar` on Linux.
- **Cask** — A different Homebrew artifact for distributing GUI macOS apps (`.app` bundles). Not the focus here.
- **DSL (Domain-Specific Language)** — Homebrew's Ruby class with methods like `url`, `sha256`, `bin.install` that define a formula.
- **Formula** — A Ruby file describing how to install a piece of software. The thing you write.
- **GitHub Action** — A reusable CI step (e.g. `Homebrew/actions/setup-homebrew@main`).
- **homebrew-core** — The official tap with thousands of curated formulas. High notability bar.
- **homebrew-cask** — The official tap for GUI apps (Cask).
- **Linuxbrew** — The Linux port of Homebrew. Now merged; the same `brew` works on both.
- **livecheck** — A `brew` subcommand that checks whether your formula's `version` is behind upstream.
- **Pour** — Installing from a pre-built bottle (`==> Pouring`). Faster than building from source.
- **PR-pull** — A workflow that, on a labeled PR, downloads bottle artifacts from CI and uploads them to a GitHub Release on the tap.
- **PAT (Personal Access Token)** — A GitHub auth token for scripts. Fine-grained PATs scope to specific repos.
- **Prefix** — The root of brew's installation. macOS Apple Silicon: `/opt/homebrew`. Inside a formula, `prefix` is the per-formula prefix.
- **Resource** — An auxiliary download declared with a `resource "name" do ... end` block.
- **SHA256** — A 64-hex-char checksum verifying a downloaded file is what you expected.
- **Tap** — A third-party Homebrew repository; just a GitHub repo named `homebrew-<x>`.
- **`test do`** — A block inside the formula that `brew test` runs to verify the install works.
- **`livecheck do`** — A block telling `brew livecheck` how to find the latest upstream version.
- **`bottle do`** — A block declaring per-arch SHA256s for pre-built bottles.
- **WSL2** — Windows Subsystem for Linux 2. The only path to use Homebrew on Windows.
- **Workflow dispatch** — A GitHub Actions trigger that runs a workflow on demand (button or API call).
- **repository_dispatch** — A GitHub Actions trigger fired from another repo via the GitHub API.

---

## 21. Update Cadence

- This rulebook is valid for Homebrew **5.1.x** and forward-compatible with **5.x**.
- Re-run the generator when:
  - Homebrew major version bumps to 6.x (DSL changes are likely).
  - GitHub Actions deprecates the `actions/upload-artifact@v4` API in use.
  - Apple ships a new macOS major release (add a new bottle arch — e.g. `arm64_<codename>`).
  - Linux ARM64 bottle conventions change (already shifted in November 2025).
  - The `dawidd6/action-homebrew-bump-formula` action ships a v5.

- Last validated: **2026-04-27** against Homebrew 5.1.6.

---
