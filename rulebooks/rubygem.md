# RubyGems Library Rulebook

Stack: Ruby gem published to RubyGems.org — gemspec, Bundler + Rake, Minitest (Rails-aligned default; RSpec noted as alternative), RuboCop with `rubocop-rake` + `rubocop-minitest`, OIDC Trusted Publishing via GitHub Actions, release-please for SemVer, Ruby 3.3+. Pure-Ruby and C/Rust native-extension gems both covered.

Tagline: One file that takes a non-coder from `bundle gem stringops` to `gem install stringops` v1.0.0 with zero credentials, zero leaks, zero guessing.

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | Ruby | Native gem language. |
| Runtime + version | Ruby 3.4.x (min `>= 3.3`) | Stable, fast YJIT, supported through 2028. |
| Package manager | Bundler 2.6+ (4.0 latest) | Official; ships with modern Ruby. |
| Build tool | Rake 13.4 | De-facto Ruby build tool; gemspec-aware. |
| State mgmt | n/a | Library code stays pure functions. |
| Routing/Nav | n/a | Library, not application. |
| Data layer | n/a | Library, not application. |
| Auth | OIDC Trusted Publishing (RubyGems.org) | No API keys, short-lived tokens. |
| Styling | n/a | Library. |
| Forms + validation | n/a | Library. |
| Unit test runner | Minitest 5.x | Rails-aligned, zero deps, fast. |
| E2E framework | n/a | Library — integration via Minitest. |
| Mocking strategy | Minitest::Mock + stubs | Built-in; mock at adapter boundary. |
| Logger | `Logger` stdlib | Zero-dep; `Logger.new($stdout)`. |
| Error tracking | Re-raise; consumer's choice | Libraries don't capture; surface errors. |
| Lint + format | RuboCop 1.86 + rubocop-minitest + rubocop-rake | Official, opinionated. |
| Type checking | RBS `sig/` (optional) + Steep | Ruby-native, gradual. |
| Env vars + secrets | NEVER in gem; consumer-supplied | Libraries don't read env. |
| CI provider | GitHub Actions | OIDC required for Trusted Publishing. |
| Deploy target | RubyGems.org | The registry. |
| Release flow | release-please + rubygems/release-gem | Conventional commits → tag → publish. |
| Auto-update | `gem update <name>` | Consumers run themselves. |
| Version source | `lib/<gem>/version.rb` | release-please default; gemspec reads it. |
| Publish auth | OIDC Trusted Publisher (no `RUBYGEMS_API_KEY`) | Short-lived, audit-logged. |
| Native extension toolchain | rake-compiler 1.3 (+ rb-sys 0.9 for Rust) | Standard for C/Rust gems. |
| Security scan | `bundler-audit` + RuboCop | CVE check + lint. |
| MFA flag | `rubygems_mfa_required => "true"` in gemspec | Forces MFA on releases. |

### Versions Table (verified 2026-04-27)

| Item | Version | Released | Link |
|---|---|---|---|
| Ruby (stable) | 3.4.x (minimum supported) | 2024-12-25 | https://www.ruby-lang.org/en/downloads/releases/ |
| Ruby (current) | 4.0.2 | 2026-03-16 | https://www.ruby-lang.org/en/downloads/releases/ |
| Ruby 3.3 EOL | 2027-03 | — | https://endoflife.date/ruby |
| Ruby 3.4 EOL | 2028-03 | — | https://endoflife.date/ruby |
| Bundler | 4.0.10 | 2026-04-08 | https://rubygems.org/gems/bundler |
| Rake | 13.4.2 | 2026-04-16 | https://rubygems.org/gems/rake |
| Minitest | 5.25.x | 2025 | https://rubygems.org/gems/minitest |
| RuboCop | 1.86.1 | 2026-04-09 | https://rubygems.org/gems/rubocop |
| rubocop-minitest | latest | — | https://github.com/rubocop/rubocop-minitest |
| rubocop-rake | latest | — | https://github.com/rubocop/rubocop-rake |
| rake-compiler | 1.3.x | — | https://rubygems.org/gems/rake-compiler |
| rb-sys | 0.9.x | — | https://github.com/oxidize-rb/rb-sys |
| magnus | 0.7.x | — | https://github.com/matsadler/magnus |
| bundler-audit | 0.9.x | — | https://github.com/rubysec/bundler-audit |
| RBS | 3.x | — | https://github.com/ruby/rbs |
| Steep | 1.x | — | https://github.com/soutaro/steep |
| rubygems/release-gem | v1 | — | https://github.com/rubygems/release-gem |
| googleapis/release-please-action | v4 | — | https://github.com/googleapis/release-please-action |

### Minimum Host

- macOS 13+, Windows 10+ (with WSL2 strongly preferred), Ubuntu 22.04+
- 4 GB RAM, 2 GB disk
- Cold start `git clone` to running tests on a fresh machine: 4–7 minutes.

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Install Homebrew (if absent)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Install rbenv + ruby-build
brew install rbenv ruby-build
echo 'eval "$(rbenv init -)"' >> ~/.zshrc
exec zsh

# 3. Install Ruby 3.4 (latest patch)
rbenv install 3.4.4
rbenv global 3.4.4
ruby -v
# => ruby 3.4.4 (...) [arm64-darwin23]

# 4. Install Bundler + Rake (rbenv ships gem)
gem install bundler rake
bundler -v
# => Bundler version 2.6.x (or 4.0.x)

# 5. Install gh + git
brew install gh git
gh auth login
```

### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install -y build-essential libssl-dev libreadline-dev zlib1g-dev libyaml-dev libffi-dev git curl
git clone https://github.com/rbenv/rbenv.git ~/.rbenv
git clone https://github.com/rbenv/ruby-build.git ~/.rbenv/plugins/ruby-build
echo 'export PATH="$HOME/.rbenv/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(rbenv init -)"' >> ~/.bashrc
exec bash
rbenv install 3.4.4 && rbenv global 3.4.4
gem install bundler rake
sudo apt install -y gh
gh auth login
```

### Windows (WSL2 required for native extensions)

```powershell
# 1. Enable WSL2 + install Ubuntu
wsl --install -d Ubuntu-22.04
# Reboot, then open Ubuntu and follow the Linux block above.
```

For pure-Ruby gems on native Windows: install RubyInstaller from https://rubyinstaller.org/ (pick the latest x64 with DevKit). For native-extension gems (C/Rust), use WSL2 — RubyInstaller's MSYS2 toolchain works but causes 80% of the support issues for AI-generated gems.

### Accounts to create (one-time)

1. **RubyGems.org** — https://rubygems.org/sign_up
   - Enable MFA: `gem signin`, then on the website Profile → "Edit profile" → "Multifactor authentication" → set up TOTP. **Required.**
2. **GitHub** — https://github.com — for repo + Actions OIDC issuer.
3. (Optional) **Trusted Publisher** is configured later via the RubyGems.org UI after you push the first manual release; see §12.

### Bootstrap a new gem

```bash
bundle gem stringops --test=minitest --linter=rubocop --ci=github --mit --coc
cd stringops
bundle install
bundle exec rake test
# Expected: "1 runs, 1 assertions, 0 failures, 0 errors, 0 skips"
bundle exec rake
# Runs test + rubocop. Both pass on a fresh skeleton.
```

Flags explained:
- `--test=minitest` — Rails-aligned default, fastest, zero deps.
- `--linter=rubocop` — official linter.
- `--ci=github` — generates `.github/workflows/main.yml` (we will replace it).
- `--mit` — MIT license.
- `--coc` — adds CODE_OF_CONDUCT.md.

### Common first-run errors

| Error | Fix |
|---|---|
| `Your Ruby version is X, but your Gemfile specified Y` | `rbenv install Y && rbenv local Y` |
| `Could not find rake-X in any of the sources` | `bundle install` (Gemfile.lock out of sync) |
| `bundler: failed to load command: rake` | Run `bundle exec rake`, not bare `rake` |
| `LoadError: cannot load such file -- mkmf` | macOS: `xcode-select --install`. Linux: `apt install ruby-dev` |
| `An error occurred while installing nokogiri` | Native extension: `bundle config build.nokogiri --use-system-libraries` |

---

## 3. Project Layout

```
stringops/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # test + rubocop + audit on PR
│       └── release.yml             # release-please + rubygems/release-gem
├── bin/
│   ├── console                     # `bin/console` → IRB with gem loaded
│   └── setup                       # `bin/setup` → bundle install + extras
├── exe/                            # CLI executables (only if gem ships a CLI)
├── ext/                            # C/Rust extension source (only for native gems)
│   └── stringops/
│       ├── extconf.rb              # C: mkmf script
│       └── stringops.c             # C source
├── lib/
│   ├── stringops.rb                # main entry — `require "stringops"`
│   └── stringops/
│       ├── version.rb              # VERSION constant — release-please bumps this
│       └── *.rb                    # internal modules
├── sig/
│   └── stringops.rbs               # optional RBS type signatures
├── test/
│   ├── test_helper.rb              # Minitest setup
│   └── test_*.rb                   # one file per lib/ file
├── .rubocop.yml                    # RuboCop config
├── .ruby-version                   # rbenv/asdf — pinned Ruby
├── .gitignore                      # excludes pkg/, *.gem, coverage/
├── CHANGELOG.md                    # release-please-managed
├── CODE_OF_CONDUCT.md
├── Gemfile                         # dev dependencies only
├── Gemfile.lock                    # **commit for apps, NOT for gems** (see §8.2)
├── LICENSE.txt                     # MIT default
├── README.md
├── Rakefile                        # default task = test + rubocop
└── stringops.gemspec               # gem manifest — runtime deps live here
```

### Naming conventions

- Gem name: `lowercase-with-hyphens` on RubyGems.org, but `snake_case` for the Ruby module (`Stringops`, not `String-Ops`).
- File names: `snake_case.rb`. One module/class per file. Path mirrors module nesting: `Stringops::Reverse` lives at `lib/stringops/reverse.rb`.
- Test files: `test_<thing>.rb` for Minitest. Test class: `class TestThing < Minitest::Test`.
- Constants in `SCREAMING_SNAKE_CASE`. Methods in `snake_case`. Predicates end in `?`. Mutators end in `!`.

### "If you're adding X, it goes in Y" decision table

| Adding | Goes in | Notes |
|---|---|---|
| New public API method | `lib/<gem>/<topic>.rb` | One concern per file. |
| Internal helper | `lib/<gem>/internal/*.rb` | Document `# @api private` |
| Constant | Top of relevant module file | Not a separate `constants.rb` |
| CLI command | `exe/<gem>` + `lib/<gem>/cli.rb` | Add to gemspec `executables` |
| C extension | `ext/<gem>/<name>.c` + extconf.rb | Add `extensions` in gemspec |
| Rust extension | `ext/<gem>/Cargo.toml` + `src/lib.rs` | Use rb-sys + magnus |
| Type signature | `sig/<file>.rbs` | Mirror lib/ tree |
| Unit test | `test/test_<file>.rb` | Mirror lib/ filename |
| Integration test | `test/integration/test_*.rb` | Hits real subprocesses/files |
| Rake task | `lib/tasks/*.rake` (consumer-facing) or `Rakefile` | Keep dev tasks in Rakefile |
| Dev-only dep | `Gemfile` `gem "x"` | Not in gemspec |
| Runtime dep | `<gem>.gemspec` `add_dependency` | NEVER in Gemfile alone |
| Fixture data | `test/fixtures/*.txt` | Plain files |
| Benchmark | `bench/*.rb` (run via `rake bench`) | Use stdlib `benchmark/ips` |
| Doc example | `README.md` + tested in `test/test_readme.rb` | Catches drift |
| Migration note | `CHANGELOG.md` | release-please appends |
| Generated files | gitignored, regenerated | Never commit `pkg/` or `tmp/` |

---

## 4. Architecture

### Process boundaries (a gem has none, but consumer/library is the line)

```
┌──────────────────────────┐         ┌──────────────────────────┐
│  Consumer Application    │         │  Your Gem (stringops)    │
│  (Rails app, CLI, lib)   │ require │                          │
│                          │ ───────►│  lib/stringops.rb        │
│  Gemfile: gem "stringops"│         │  └─ Stringops module     │
│  Bundler installs        │         │     ├─ ::reverse(s)      │
│                          │         │     ├─ ::shout(s)        │
│  Calls Stringops.reverse │         │     └─ VERSION           │
└──────────────────────────┘         └──────────────────────────┘
        ▲                                        │
        │                                        │
        │     RubyGems.org registry              │
        │     (`gem install stringops`)          │
        └────────────────────────────────────────┘
```

### Data flow for `require "stringops"`

```
consumer:  require "stringops"
            │
            ▼
Bundler resolves → site-packages path → loads lib/stringops.rb
            │
            ▼
lib/stringops.rb: `require_relative "stringops/version"`
            │
            ▼
defines `module Stringops; ... end`
            │
            ▼
consumer calls: Stringops.reverse("hi") => "ih"
```

### Auth flow (publish-time only — there is no runtime auth)

```
PR merged ──► release-please-action sees `feat:` / `fix:`
               │
               ├──► creates "release PR" bumping lib/stringops/version.rb + CHANGELOG.md
               │
PR merged ──►  release-please tags `v1.2.3` and creates GitHub Release
               │
               ▼
release.yml triggered by `release: created`
               │
               ▼
job: actions/checkout + ruby/setup-ruby + permissions: id-token: write
               │
               ▼
rubygems/release-gem@v1
               │
               ├──► requests OIDC token from GitHub (audience=rubygems)
               ├──► exchanges with RubyGems.org for short-lived API key
               ├──► gem build + gem push
               └──► RubyGems.org verifies trusted publisher matches repo+workflow+ref
```

### File-to-responsibility map (entry points)

| File | Owns |
|---|---|
| `<gem>.gemspec` | Manifest: name, version, deps, files, required_ruby_version, MFA flag |
| `lib/<gem>.rb` | Public API surface — what `require "<gem>"` exposes |
| `lib/<gem>/version.rb` | The single source of truth for the version string |
| `Rakefile` | `rake test`, `rake rubocop`, default = both; `rake build` (via Bundler) |
| `Gemfile` | DEV-ONLY deps; runtime deps go in gemspec |
| `test/test_helper.rb` | Minitest config, requires gem, sets up assertions |
| `.github/workflows/ci.yml` | Ruby version matrix; runs test + lint + audit |
| `.github/workflows/release.yml` | Tag → build → push to RubyGems.org via OIDC |

### Where business logic lives

- ✅ `lib/<gem>/*.rb` — pure Ruby, side-effect-free where possible.
- ❌ Not in `Rakefile`, not in `bin/console`, not in `test/`.
- ❌ No top-level monkey-patches of Ruby core classes (e.g. `class String; def reverse_words; …`). If patching is the gem's purpose, scope via `refine` (refinements).

---

## 5. Dev Workflow

### Start a dev console

```bash
bin/console
# IRB with `require "stringops"` already done.
# >> Stringops::VERSION
# => "0.1.0"
```

### Run tests on file change (no extra dep needed)

```bash
bundle exec rake test
# One-shot. For watch mode, install:
gem install rerun
rerun -d lib,test -- bundle exec rake test
```

### Attach a debugger

- **VS Code / Cursor**: install "Ruby LSP" (Shopify) and "Ruby" extensions. `.vscode/launch.json` is in §15.
- **RubyMine**: built-in debugger; Run → Debug 'rake test'.
- **CLI (any editor)**: `gem "debug"` is in Gemfile (group :development). Insert `binding.break` at any line, then `bundle exec rake test` — drops into a `debug>` prompt.

### Inspect at runtime

```bash
bin/console               # poke the API
bundle exec rake build    # → pkg/stringops-0.1.0.gem
gem unpack pkg/stringops-0.1.0.gem -o /tmp/inspect   # see exactly what got packaged
```

If a file you expect is missing from the unpacked dir, your `gemspec`'s `files` glob is wrong — see §9 pitfall #3.

### Pre-commit checks

`bin/check` (create this; called from CI and the Claude Stop hook):

```bash
#!/usr/bin/env bash
set -euo pipefail
bundle exec rubocop
bundle exec rake test
bundle exec bundle-audit check --update
```

### Branch + commit conventions

- `main` is the default branch.
- Branches: `feat/<short-desc>`, `fix/<short-desc>`, `chore/<short-desc>`.
- Commits use **Conventional Commits** (release-please depends on this):
  - `feat: add Stringops.shout` → minor bump
  - `fix: handle nil input in reverse` → patch bump
  - `feat!: rename Stringops.upper to Stringops.shout` → major bump
  - `chore:`, `docs:`, `test:`, `refactor:` → no version bump
- One concern per PR. Squash-merge.

---

## 6. Testing & Parallelization

### Unit test command

```bash
bundle exec rake test
# Discovers test/**/test_*.rb
# Default Rakefile (from `bundle gem`) sets:
#   t.libs << "test"
#   t.libs << "lib"
#   t.test_files = FileList["test/**/test_*.rb"]
```

### Run a single test

```bash
bundle exec ruby -Ilib -Itest test/test_stringops.rb
# Single test method:
bundle exec ruby -Ilib -Itest test/test_stringops.rb -n test_reverses_string
# By name regex:
bundle exec ruby -Ilib -Itest test/test_stringops.rb -n /reverse/
```

### Watch mode

```bash
gem install minitest-watch  # or use rerun above
bundle exec minitest-watch
```

### Parallelize Minitest (built-in since 5.6)

In `test/test_helper.rb`:

```ruby
require "minitest/autorun"
Minitest.parallel_executor = Minitest::Parallel::Executor.new(Etc.nprocessors)
```

Each test class runs concurrently; tests within a class run serially. **Do not parallelize tests that touch the same temp file or env var** — scope each test to a unique tempdir via `Dir.mktmpdir`.

### Mocking rules

- ✅ Mock at the **adapter boundary**: HTTP clients (use WebMock or `stub_request`), shell exec (`Open3.popen3` stubs), filesystem reads (use `Dir.mktmpdir` + real files).
- ❌ Never mock methods on the gem-under-test itself in unit tests for the gem-under-test. That's tautological.
- ❌ Never mock `Minitest::Mock.new.expect` beyond 1–2 expectations per test — refactor instead.
- For HTTP: `gem "webmock"` in `Gemfile`, `WebMock.disable_net_connect!` in `test_helper`.
- For time: `Time.stub :now, fixed_time do ... end` (Minitest stub, no extra gem).

### Coverage

```ruby
# test/test_helper.rb (top of file, before any require)
require "simplecov"
SimpleCov.start do
  add_filter "/test/"
  enable_coverage :branch
  minimum_coverage line: 90, branch: 80
end
```

Add `gem "simplecov", require: false` to Gemfile. Coverage report at `coverage/index.html`.

### RSpec alternative (noted, not the default)

If the project explicitly chose RSpec:

```bash
bundle gem stringops --test=rspec
```

Tests live in `spec/`, files end `_spec.rb`, run via `bundle exec rspec`. Everything else in this rulebook (CI, release, gemspec) is unchanged. `rubocop-rspec` replaces `rubocop-minitest`. Default to Minitest unless the user has a strong preference.

### Parallelization patterns for AI agents

Safe parallel subagent tasks:
- Adding `lib/stringops/foo.rb` + `lib/stringops/bar.rb` + their respective `test/test_foo.rb` / `test/test_bar.rb` (disjoint files).
- Generating RBS signatures in `sig/foo.rbs` while another subagent edits `README.md`.
- Updating `.rubocop.yml` while another adds an unrelated test.

NOT safe — must be sequential:
- Anything touching `<gem>.gemspec` (single source of truth for files glob and deps).
- Anything touching `lib/<gem>/version.rb` (release-please owns this).
- Anything touching `Gemfile`/`Gemfile.lock` (lock contention; bundle install conflicts).
- `CHANGELOG.md` (release-please owns; don't hand-edit on main).

---

## 7. Logging

A library MUST NOT log to stdout/stderr by default. Accept an injected logger.

```ruby
# lib/stringops.rb
require "logger"

module Stringops
  class << self
    attr_writer :logger
    def logger
      @logger ||= Logger.new(IO::NULL)  # silent by default
    end
  end
end
```

Consumer opts in:

```ruby
Stringops.logger = Logger.new($stdout, level: :debug)
```

### Log levels

| Level | Use for |
|---|---|
| `DEBUG` | Diagnostic detail — argument shapes, branch taken |
| `INFO` | Significant lifecycle events — "loaded config from X" |
| `WARN` | Recoverable anomaly — fallback path triggered |
| `ERROR` | Failed operation, exception about to be raised/re-raised |
| `FATAL` | Library shutting down due to unrecoverable state (rare for libs) |

### Required fields on every log line

`module:`, `event:`, plus context-specific kvs. Use tagged or structured form:

```ruby
logger.info("stringops: event=reverse input_len=#{s.length}")
```

### Sample lines

```
I, [2026-04-27T10:00:00.123 #12345]  INFO -- : stringops: event=load version=0.1.0
D, [2026-04-27T10:00:00.124 #12345] DEBUG -- : stringops: event=reverse input_len=5
W, [2026-04-27T10:00:00.125 #12345]  WARN -- : stringops: event=reverse fallback=true reason=non_utf8
E, [2026-04-27T10:00:00.126 #12345] ERROR -- : stringops: event=reverse error=ArgumentError msg="cannot reverse nil"
```

### Where logs go

- Dev: wherever the consumer points the Logger (typically `$stdout`).
- Prod: consumer's choice; the gem doesn't decide.

### Grep locally

```bash
bundle exec rake test 2>&1 | grep -E "stringops: event=(error|warn)"
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always run `bundle exec rubocop` and `bundle exec rake test` before declaring a task done. Both must exit 0.
2. Always bump `lib/<gem>/version.rb` AND prepend a `CHANGELOG.md` entry in the same PR if you ship behavior change — release-please does this if you use Conventional Commits, but verify the release PR exists before merging features.
3. Always set `spec.required_ruby_version = ">= 3.3.0"` (or the actual minimum tested in CI).
4. Always set `spec.metadata["rubygems_mfa_required"] = "true"` in the gemspec.
5. Always set `spec.metadata["source_code_uri"]`, `["homepage_uri"]`, `["changelog_uri"]`, `["bug_tracker_uri"]`.
6. Always populate `spec.files` from `git ls-files -z` so the `.gem` contains exactly what's tracked.
7. Always declare runtime deps in the gemspec via `add_dependency`; declare dev deps in the Gemfile.
8. Always pin `add_dependency` to a permissive but bounded range, e.g. `"~> 2.0"` not `"= 2.0.1"`.
9. Always re-run `bundle install` after editing the gemspec or Gemfile.
10. Always add a Minitest test for every public method on every public class — coverage minimum 90% lines, 80% branches.
11. Always use `require_relative` within the gem; reserve `require` for stdlib and external gems.
12. Always namespace under your gem's top-level module (`Stringops::Reverse`); never define top-level constants.
13. Always raise specific error subclasses defined under your namespace (`Stringops::Error < StandardError`); never raise bare `RuntimeError`.
14. Always close files, sockets, and subprocesses — use blocks (`File.open(p) { |f| ... }`) over manual `.close`.
15. Always frozen-string-literal-pragma: `# frozen_string_literal: true` at the top of every `.rb` file in `lib/` and `test/`.
16. Always commit using Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `feat!:` for breaking).
17. Always tag releases with the `v` prefix (`v1.2.3`); release-please does this — don't tag manually.
18. Always run `bundle exec bundle-audit check --update` before any release.
19. Always ensure `.github/workflows/release.yml` has `permissions: id-token: write` at the job level for OIDC trusted publishing.
20. Always test the gem against a CI matrix of `ruby: [3.3, 3.4, head]`.
21. Always validate the built `.gem` locally with `gem build *.gemspec && gem unpack *.gem -o /tmp/x` before relying on CI.
22. Always document every public method with a YARD `# @param` / `# @return` block.
23. Always use `Dir.mktmpdir` for temp files in tests — never hardcoded `/tmp/foo`.

### 8.2 NEVER

1. Never commit `Gemfile.lock` for a gem (libraries; the consumer locks). **Exception**: applications-shipped-as-gems (CLIs with a single deploy target) may commit it. Default: gemignore it via `.gitignore`.
2. Never commit `*.gem` files. Always gitignore `pkg/` and `*.gem`.
3. Never put runtime deps in the Gemfile only — they MUST be in the gemspec or consumers won't get them.
4. Never put dev-only deps (rake, rubocop, minitest) in the gemspec's runtime deps.
5. Never store `RUBYGEMS_API_KEY` as a GitHub secret. Use OIDC Trusted Publishing.
6. Never use `gem push` from a developer laptop for a release — releases go through the OIDC workflow only.
7. Never monkey-patch Ruby core or stdlib at the top level. Use refinements (`refine String do ... end`) if patching is essential.
8. Never use `require "<gem>"` inside the gem itself — use `require_relative`.
9. Never shell out to system tools without `Open3` and explicit error handling.
10. Never call `eval`, `class_eval`, `instance_eval` with user-provided strings.
11. Never use `Kernel#system` or `Kernel#\``without sanitizing input — prefer `Open3.capture3([cmd, *args])` (array form is shell-safe).
12. Never hand-edit `CHANGELOG.md` on `main` — release-please owns it.
13. Never hand-edit `lib/<gem>/version.rb` on `main` if release-please is configured — merge the release PR instead.
14. Never bump major version without a `feat!:` commit AND a documented migration in CHANGELOG.
15. Never hardcode a Ruby ABI version in C-extension `extconf.rb`; use the helpers from `mkmf` / `rb-sys`.
16. Never assume bundler version — pin via `BUNDLED WITH` in `Gemfile.lock` if you commit it, otherwise leave it floating for libraries.
17. Never call out to network services in unit tests. Stub at the adapter boundary.
18. Never use `puts` for diagnostics in lib code — use the injected logger.

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `<gem>.gemspec` | Manifest, install, publish, deps | `bundle install && bundle exec rake build && gem install pkg/*.gem` |
| `lib/<gem>/version.rb` | Published version, release-please | `bundle exec rake build && grep VERSION pkg/*.gemspec` |
| `lib/<gem>.rb` | Public API surface | Full test suite + README example |
| `lib/<gem>/*.rb` | Internal API | Targeted `test/test_<file>.rb` + full suite |
| `Gemfile` | Dev environment only | `bundle install` |
| `Gemfile.lock` | Reproducible dev install | Don't commit for libs (see 8.2) |
| `Rakefile` | All `rake` tasks | `bundle exec rake -T && bundle exec rake` |
| `.rubocop.yml` | Lint behavior | `bundle exec rubocop` |
| `.ruby-version` | Local Ruby switch | `ruby -v` matches |
| `test/test_helper.rb` | All test runs | Full test suite |
| `.github/workflows/ci.yml` | CI gate on every PR | Push branch, watch Actions tab |
| `.github/workflows/release.yml` | Publishing pipeline | Inspect `permissions: id-token: write`; dry-run on tag in fork |
| `ext/<gem>/extconf.rb` | C-extension build | `bundle exec rake compile` on each platform |
| `ext/<gem>/Cargo.toml` | Rust extension | `bundle exec rake compile && cargo build --release` |
| `sig/*.rbs` | Type signatures | `bundle exec steep check` |
| `CHANGELOG.md` | User-visible release notes | `git diff CHANGELOG.md` matches release-please PR |
| `README.md` | First impression + RubyGems.org page | `bundle exec rake build && check unpacked .gem readme` |
| `LICENSE.txt` | Legal | Don't change without intent |
| `bin/console` | Interactive dev only | `bin/console`, run a method |
| `bin/setup` | Onboarding script | Fresh clone → `bin/setup` succeeds |
| `exe/<gem>` | CLI entrypoint | `bundle exec exe/<gem> --help` |
| `.gitignore` | What lands in git → what lands in gem | `git ls-files | grep -E '\.gem$'` is empty |

### 8.4 Definition of Done

**Bug fix**
- [ ] Failing test added that reproduces the bug.
- [ ] Fix makes the test pass.
- [ ] `bundle exec rake test` and `bundle exec rubocop` both green.
- [ ] CHANGELOG entry under `### Fixed` (or use `fix:` commit; release-please handles it).
- [ ] No version bump in same commit (release-please owns version).

**New feature**
- [ ] Test coverage for every public path of the new code.
- [ ] README updated with an example.
- [ ] Public method has a YARD doc block.
- [ ] `feat:` commit; release-please will minor-bump.
- [ ] `bundle exec rake test`, `rubocop`, `bundle-audit` all green.
- [ ] `gem build` succeeds and the unpacked `.gem` contains the new files.

**Refactor**
- [ ] Zero behavior change.
- [ ] Existing tests unchanged or only renamed.
- [ ] `chore:` or `refactor:` commit; no version bump.
- [ ] Lint + tests green.

**Dependency bump**
- [ ] Update gemspec version range OR Gemfile.
- [ ] `bundle update <gem-name>` (not `bundle update`).
- [ ] Full test suite + `bundle-audit` green.
- [ ] Note in CHANGELOG if it's a runtime dep with user-visible impact.

**Schema change** (n/a for libs unless gem ships a generator that writes schemas in consumer projects — then treat as breaking)
- [ ] Consider whether this is a `feat!:` (major) bump.
- [ ] Provide migration notes in CHANGELOG.

**Copy change** (README, comments)
- [ ] `docs:` commit.
- [ ] `bundle exec rubocop` green (Layout cops can fire on README code blocks if `--require rubocop-md`).

### 8.5 Self-Verification Recipe

```bash
# 1. Install
bundle install
# Expected last line: "Bundle complete! N Gemfile dependencies, M gems now installed."

# 2. Lint
bundle exec rubocop
# Expected: "X files inspected, no offenses detected"

# 3. Test
bundle exec rake test
# Expected: "N runs, M assertions, 0 failures, 0 errors, 0 skips"

# 4. Audit
bundle exec bundle-audit check --update
# Expected: "No vulnerabilities found"

# 5. Build smoke
bundle exec rake build
# Expected: "stringops 0.1.0 built to pkg/stringops-0.1.0.gem."

# 6. Install built gem locally and require it
gem install pkg/stringops-0.1.0.gem
ruby -e "require 'stringops'; puts Stringops::VERSION"
# Expected: "0.1.0"

# 7. Type check (if sig/ exists)
bundle exec steep check
# Expected: "No type errors detected"
```

If any step's actual output differs from expected, do not declare done.

### 8.6 Parallelization Patterns

| Pattern | Safe? | Why |
|---|---|---|
| 3 subagents each adding a new module + its test | ✅ | Disjoint files |
| 2 subagents editing `<gem>.gemspec` | ❌ | Single manifest |
| Subagent writes test while another writes implementation | ⚠️ | OK if files are decided; bad if both edit `lib/<gem>.rb` requires |
| Subagent edits README, another runs benchmarks | ✅ | No file overlap |
| Two subagents both run `bundle install` | ❌ | Lockfile race |
| One adds a runtime dep to gemspec; another adds a dev dep to Gemfile | ❌ | Both touch `bundle install` outcome — sequence them |
| Subagent compiles C ext, another runs lint | ✅ | `ext/` vs lint |

---

## 9. Stack-Specific Pitfalls

1. **Forgot to bump `version.rb` AND CHANGELOG together.** Symptom: published `0.1.0` after `0.1.0` is already on RubyGems → push fails with "Repushing of gem versions is not allowed." Fix: let release-please own both files; don't hand-edit. Detect: release-please opens a "release-please--..." PR — if you don't see one after merging a `feat:`, your workflow is misconfigured.

2. **`spec.files` lists files not in git.** Symptom: `gem build` warns or includes wrong files; consumer reports `LoadError: cannot load such file -- stringops/foo`. Fix: `spec.files = Dir.chdir(__dir__) { `git ls-files -z`.split("\x0").reject { |f| f.match?(%r{\A(?:test|spec|features)/}) || f.match?(%r{\A\.}) || f == "Gemfile" } }`. Detect: `gem unpack pkg/*.gem -o /tmp/x && ls /tmp/x/<gem>-<v>/lib/`.

3. **Missing `required_ruby_version`.** Symptom: gem installs on Ruby 2.7, then crashes with `SyntaxError` from a 3.x feature. Fix: `spec.required_ruby_version = ">= 3.3.0"` and CI matrix matches. Detect: install on the lowest declared Ruby and run tests.

4. **`rake release` after Trusted Publishing migration leaks tokens.** Symptom: `rake release` tries to read `~/.gem/credentials` and either fails on CI (no creds) or uploads with stale long-lived key. Fix: do NOT run `rake release` from CI. Use `rubygems/release-gem@v1` action; locally only run `rake build`. Detect: `grep -r RUBYGEMS_API_KEY .github/` should return nothing.

5. **`RUBYGEMS_API_KEY` accidentally added to repo secrets.** Symptom: long-lived credential in CI; bypasses Trusted Publishing audit. Fix: delete the secret; configure Trusted Publisher in RubyGems.org UI; verify workflow uses `permissions: id-token: write`. Detect: RubyGems.org → gem → "Trusted publishers" section is populated.

6. **Top-level monkey-patching.** Symptom: gem A and gem B both define `String#shout` differently → second one wins; users debug for hours. Fix: use refinements scoped to your namespace, or define methods on your own classes. Detect: `grep -nE "^class (String|Array|Hash|Integer|Object)\b" lib/`.

7. **Dev deps leaked into runtime.** Symptom: consumer pulls in `rubocop` and `minitest` transitively, bloats their bundle. Fix: development deps go in Gemfile, not gemspec. The gemspec's `add_development_dependency` is deprecated as of Bundler 2.0+ — use Gemfile. Detect: `gem dependency stringops` should show only true runtime deps.

8. **`require "stringops/version"` fails because `lib/` isn't on the load path.** Symptom: works in dev (Bundler adds lib/), fails when installed. Fix: in `<gem>.gemspec`: `spec.require_paths = ["lib"]` (Bundler adds this; verify it's still there). Detect: `gem install pkg/*.gem && ruby -e 'require "stringops"'`.

9. **Native extension fails on Apple Silicon.** Symptom: `make: command not found` or `ld: symbol not found for architecture arm64`. Fix: `xcode-select --install`; in extconf.rb don't hardcode `-arch x86_64`. Detect: CI matrix includes `macos-latest` (arm64).

10. **Frozen string literal mutation.** Symptom: `RuntimeError: can't modify frozen String` after adding `# frozen_string_literal: true`. Fix: use `String.new("…")` for mutable strings, or `+"…"` (the unary plus dups). Detect: failing test on the relevant method.

11. **Trusted Publisher misconfigured: workflow file path mismatch.** Symptom: `Error: Forbidden — trusted publisher does not match`. Fix: the path in RubyGems.org's trusted publisher config must match `.github/workflows/release.yml` exactly (case-sensitive). Detect: failed `release-gem` step shows the rejected token claim.

12. **`gem build` warns about HOMEPAGE/TODO placeholders.** Symptom: `bundle gem` template leaves `TODO: Set the homepage` in gemspec. Fix: replace every `TODO:` line in the gemspec. Detect: `grep -n TODO *.gemspec` returns nothing.

13. **Conventional Commits ignored on squash-merge.** Symptom: release-please sees only `Merge pull request #...` titles → no version bump. Fix: configure GitHub to use the PR title as the squash commit message, AND lint PR titles to match Conventional Commits. Detect: `git log --oneline main` shows `feat:`/`fix:` prefixes.

14. **`Gemfile.lock` committed for a library.** Symptom: consumer reports `Bundler could not find compatible versions for gem "rake"`. Fix: add `Gemfile.lock` to `.gitignore` for libraries; lock files belong to applications. Detect: `git ls-files | grep Gemfile.lock` should return empty for a library.

15. **Test loaded the gem from the system, not the working tree.** Symptom: change code, tests pass — but you fixed nothing. Fix: `test/test_helper.rb` uses `$LOAD_PATH.unshift File.expand_path("../lib", __dir__)` (or rely on `rake test` setting `t.libs`). Detect: `ruby -Ilib -Itest test/test_*.rb`.

16. **MFA flag set, but maintainer's account doesn't have MFA.** Symptom: `gem push` rejected with "Multifactor authentication is required". Fix: enable MFA on RubyGems.org; or ensure all maintainers have it. Detect: try `gem push pkg/*.gem` from a logged-in account.

17. **rake-compiler not declared, but `extensions` is set.** Symptom: `gem install` errors `extconf failed`. Fix: `add_development_dependency "rake-compiler"` (Gemfile in modern style: `gem "rake-compiler"`); `Rakefile` requires `rake/extensiontask`. Detect: `bundle exec rake compile` succeeds on a fresh clone.

18. **Release workflow lacks `id-token: write`.** Symptom: `rubygems/release-gem` errors "missing OIDC token". Fix: `permissions: { id-token: write, contents: write }` at the job level. Detect: failed action log mentions OIDC.

---

## 10. Performance Budgets

A library budget is its **cost to load** plus its **cost per call**.

| Metric | Budget | Measure |
|---|---|---|
| `require "<gem>"` time | < 50 ms cold | `ruby -e 'require "benchmark"; puts Benchmark.realtime { require "stringops" }'` |
| Memory at require | < 1 MB resident | `ruby -rstringops -e 'puts \`ps -o rss= -p #{$$}\`'` |
| Public method call (hot) | < 1 µs / call (pure Ruby) | `bench/*.rb` with `benchmark/ips` |
| `.gem` size | < 100 KB for pure Ruby | `ls -lh pkg/*.gem` |
| Test suite wall time | < 5 s (unit) / < 30 s (integration) | `time bundle exec rake test` |

When exceeded:
- Slow `require`: lazy-load with `autoload :Module, "stringops/module"`.
- Slow methods: profile with `stackprof`, optimize hot loops, consider C/Rust extension.
- Big `.gem`: audit `spec.files` — exclude tests, fixtures, screenshots from the build.

---

## 11. Security

### Secret storage

A library MUST NOT read environment variables for its own auth. Consumers pass secrets in. The only secret the gem itself ever handles is the **OIDC token at publish time**, which is short-lived and never written to disk.

NEVER put in the gem:
- API keys
- `~/.gem/credentials`
- `RUBYGEMS_API_KEY`, `BUNDLE_RUBYGEMS__*`
- `.env` files
- Real customer data fixtures

### Auth threat model (publish-time)

- Read access to RubyGems.org page: anyone (it's a public registry).
- Write access (push new version): GitHub Actions running on `main` of the configured repo, on a tag matching the trusted-publisher pattern, exchanging a short-lived OIDC token. Compromise vector: a malicious push to `main` that triggers release.yml → mitigation: protect `main` with required reviews; restrict `release` workflow to trusted-publisher tag pattern only.
- MFA enforced on the account via `rubygems_mfa_required` in gemspec metadata — interactive `gem push` from any account requires TOTP/WebAuthn.

### Input validation boundary

Every public method that accepts user data validates type at entry:

```ruby
def self.reverse(s)
  raise ArgumentError, "expected String, got #{s.class}" unless s.is_a?(String)
  s.reverse
end
```

### Output escaping

Library returns plain Ruby objects; consumer escapes for their context (HTML, SQL, shell). The library MUST NOT inject HTML/SQL into return values.

### Permissions config

Libraries don't ship permissions config. The CI workflow declares minimal permissions:

```yaml
# .github/workflows/release.yml job-level
permissions:
  contents: write   # to create the GitHub release
  id-token: write   # for OIDC trusted publishing
```

The `ci.yml` workflow uses `permissions: contents: read` only.

### Dependency audit

```bash
bundle exec bundle-audit check --update
# Cadence: every PR (CI), every release, weekly via Dependabot.
```

Add `.github/dependabot.yml`:

```yaml
version: 2
updates:
  - package-ecosystem: bundler
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

### Top 5 stack-specific risks

1. **Leaked `RUBYGEMS_API_KEY` in CI logs or repo.** Mitigation: use OIDC Trusted Publishing exclusively; never set this secret.
2. **Top-level monkey-patching collisions.** Mitigation: refinements only.
3. **`eval` / `class_eval` with user input.** Mitigation: never accept code-as-string from external sources.
4. **`Kernel#system` / backticks with user input.** Mitigation: `Open3.capture3([cmd, *args])` with array form (no shell).
5. **YAML.load with untrusted input.** Mitigation: `YAML.safe_load` (default since Ruby 3.1) or `Psych.safe_load`.

---

## 12. Deploy (Publish to RubyGems.org)

### One-time setup (per gem)

1. **Reserve the name** with a manual first push (this is how Trusted Publishing claims the name):

   ```bash
   gem signin   # interactive, MFA prompt
   bundle exec rake build
   gem push pkg/stringops-0.1.0.gem
   ```

   This creates the gem on RubyGems.org under your account.

2. **Configure the Trusted Publisher** in the RubyGems.org UI:
   - Go to https://rubygems.org/gems/stringops/trusted_publishers
   - Click "Create"
   - Provider: GitHub Actions
   - Repository owner: `<your-gh-handle>`
   - Repository name: `stringops`
   - Workflow filename: `release.yml`
   - Environment (optional): leave blank, or set to `release` if you've configured one
   - Save.

3. From here on, **never run `gem push` from your laptop again** for this gem. CI does it via OIDC.

### Continuous release flow

```
write feat: / fix: commits → merge to main
      │
      ▼
release-please-action sees Conventional Commits → opens "release PR" bumping
   - lib/stringops/version.rb (e.g. 0.1.0 → 0.2.0)
   - CHANGELOG.md
      │
review + merge release PR
      │
      ▼
release-please tags v0.2.0 + creates GitHub Release
      │
      ▼
release.yml triggers on `release: published`
      │
      ▼
job builds gem, exchanges OIDC for short-lived RubyGems token, gem push
      │
      ▼
RubyGems.org displays new version within ~30s
```

### Staging vs prod

There is no staging registry by convention. To test a publish flow without polluting production, push to **GitHub Packages** (a separate registry):

```bash
gem push --host https://rubygems.pkg.github.com/<owner> pkg/*.gem
```

Use this for internal/private gems or as a dry run.

### Rollback

You **cannot** unpublish a published gem version from RubyGems.org after 30 days, and even within 30 days you can only **yank**:

```bash
gem yank stringops -v 0.2.0
```

Yanking removes it from default install but keeps it accessible by explicit version. Consumers see "yanked" warnings. Rule: ship a `0.2.1` patch instead of yanking unless 0.2.0 is actively malicious or broken.

Max safe rollback window: yank within 24 hours of publish. After that, ship a fix-forward release.

### Health check

```bash
gem install stringops
ruby -e "require 'stringops'; puts Stringops::VERSION"
# Expected: the version you just published.
```

For RubyGems.org availability:

```bash
curl -sI https://rubygems.org/api/v1/versions/stringops.json | head -1
# HTTP/2 200
```

### Versioning scheme

SemVer 2.0.0. The single source of truth is `lib/<gem>/version.rb`:

```ruby
# frozen_string_literal: true

module Stringops
  VERSION = "0.1.0"
end
```

`<gem>.gemspec` reads `Stringops::VERSION`. release-please owns the bumps.

### Cost estimate

RubyGems.org publishing: **free** (no quotas for normal gem sizes; absurdly large gems may be limited). GitHub Actions: free for public repos. CI for a typical gem: <500 minutes/month, well within the GitHub free tier.

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste-ready)

```markdown
# CLAUDE.md — stringops

This is a Ruby gem published to RubyGems.org. The single source of truth for every decision is `RULEBOOK.md` (rubygem rulebook). Read it before starting any task.

## Quick commands

- Install deps: `bundle install`
- Run tests: `bundle exec rake test`
- Lint: `bundle exec rubocop`
- Audit: `bundle exec bundle-audit check --update`
- Build: `bundle exec rake build`
- Console: `bin/console`

## Banned

- Never run `gem push` or `rake release` from local machine. Releases go through the OIDC workflow only.
- Never hand-edit `lib/stringops/version.rb` — release-please owns it.
- Never hand-edit `CHANGELOG.md` on `main` — release-please owns it.
- Never add `RUBYGEMS_API_KEY` to GitHub secrets.
- Never put runtime deps in the Gemfile only — they live in the gemspec.
- Never put dev deps (rake, rubocop, minitest) in the gemspec runtime section.
- Never monkey-patch Ruby core at top level — use refinements.
- Never commit `Gemfile.lock`, `pkg/`, or `*.gem`.

## Conventions

- Conventional Commits: `feat:`, `fix:`, `chore:`, `docs:`, `feat!:` for breaking.
- Frozen string literal pragma at top of every `.rb` file.
- One module per file; path mirrors namespace.
- Tests live in `test/`; one `test_*.rb` per `lib/*.rb`.

## Self-verify before declaring done

Run §8.5 of `RULEBOOK.md` end-to-end. Every step's actual output must match expected.

## Skills to invoke

- `/test-driven-development` for any new feature.
- `/systematic-debugging` for any bug.
- `/verification-before-completion` before claiming a task done.
- `/ship` only for non-release commits — releases go through release-please.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(bundle install)",
      "Bash(bundle exec rake test)",
      "Bash(bundle exec rake test:*)",
      "Bash(bundle exec rake build)",
      "Bash(bundle exec rake compile)",
      "Bash(bundle exec rake)",
      "Bash(bundle exec rubocop)",
      "Bash(bundle exec rubocop -A)",
      "Bash(bundle exec rubocop --autocorrect)",
      "Bash(bundle exec ruby -Ilib -Itest test/*)",
      "Bash(bundle exec bundle-audit check --update)",
      "Bash(bundle exec steep check)",
      "Bash(ruby -v)",
      "Bash(bundler -v)",
      "Bash(gem build *.gemspec)",
      "Bash(gem unpack pkg/*.gem*)",
      "Bash(git status)",
      "Bash(git diff *)",
      "Bash(git log *)",
      "Bash(git add *)",
      "Bash(bin/console)",
      "Bash(bin/setup)",
      "Bash(bin/check)"
    ],
    "deny": [
      "Bash(gem push *)",
      "Bash(rake release *)",
      "Bash(bundle exec rake release *)",
      "Bash(gem yank *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "bundle exec rubocop -A --no-color $CLAUDE_FILE_PATHS 2>/dev/null || true" }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          { "type": "command", "command": "bin/check" }
        ]
      }
    ]
  }
}
```

### Slash command shortcuts

- `/test-driven-development` — write the test in `test/test_<topic>.rb` first, watch it fail, implement in `lib/<gem>/<topic>.rb`, watch it pass.
- `/systematic-debugging` — for failing test in CI matrix.
- `/verification-before-completion` — runs §8.5.
- `/codex` — second opinion before opening a release PR.

---

## 14. Codex Integration

### `AGENTS.md` (paste-ready)

```markdown
# AGENTS.md — stringops

Authoritative file: `RULEBOOK.md`. Every decision is locked there.

## Build & test

```
bundle install
bundle exec rake test
bundle exec rubocop
bundle exec bundle-audit check --update
bundle exec rake build
```

All four must exit 0 before declaring a task done.

## Code conventions

- Ruby 3.3+ syntax. `# frozen_string_literal: true` at top of every `.rb`.
- Modules namespaced under `Stringops::`. One module per file.
- `require_relative` inside the gem; `require` for stdlib + external gems.
- Errors inherit from `Stringops::Error < StandardError`.

## Release

- Conventional Commits.
- release-please opens release PRs automatically. Merge them; CI publishes via OIDC.
- Never run `gem push` or `rake release` locally. Never set `RUBYGEMS_API_KEY`.

## Files Codex must NEVER edit

- `lib/stringops/version.rb` (release-please owns)
- `CHANGELOG.md` on main (release-please owns)
- `.github/workflows/release.yml` without explicit user approval
```

### `.codex/config.toml`

```toml
model = "gpt-5"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[sandbox_workspace_write]
network_access = false

[shell_environment_policy]
inherit = "core"
exclude = ["RUBYGEMS_API_KEY", "GEM_HOST_API_KEY", "BUNDLE_RUBYGEMS__*"]
```

### Codex vs Claude differences

- Codex defaults to less aggressive auto-formatting; explicitly request `bundle exec rubocop -A` after edits.
- Codex sandbox blocks network by default — fine for unit tests, but `bundle install` and `bundle-audit --update` need approval. Pre-warm the cache before the session.
- Codex doesn't have native Stop-hook equivalents; rely on the AGENTS.md instructions to prompt the agent to run `bin/check`.

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
You are working in a Ruby gem published to RubyGems.org. The authoritative reference is RULEBOOK.md.

ALWAYS:
- Add `# frozen_string_literal: true` to every new .rb file in lib/ and test/.
- Run `bundle exec rake test` and `bundle exec rubocop` after every change.
- Put runtime deps in the gemspec, dev deps in the Gemfile.
- Use Minitest (`class TestX < Minitest::Test`), not RSpec, unless the project already uses RSpec.
- Use `require_relative` inside the gem, `require` for stdlib/external.
- Namespace classes under the gem's top-level module.
- Conventional Commits: feat:, fix:, chore:, docs:, feat!:.
- Use Open3.capture3([cmd, *args]) for any shell exec — never backticks with user input.

NEVER:
- Run `gem push`, `rake release`, or set RUBYGEMS_API_KEY.
- Hand-edit lib/<gem>/version.rb or CHANGELOG.md on main — release-please owns them.
- Monkey-patch Ruby core/stdlib at top level — use refinements.
- Commit Gemfile.lock, pkg/, or *.gem.
- Use eval/class_eval/instance_eval with user-provided strings.
- Log to stdout from library code — accept an injected Logger.
- Mock the gem-under-test in its own tests.

When editing the gemspec, do not introduce TODO placeholders. When editing version.rb, stop and ask whether release-please is configured (it usually is).
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "Shopify.ruby-lsp",
    "rebornix.ruby",
    "misogi.ruby-rubocop",
    "vortizhe.simple-ruby-erb",
    "redhat.vscode-yaml",
    "github.vscode-github-actions",
    "eamodio.gitlens"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug: rake test",
      "type": "rdbg",
      "request": "launch",
      "command": "bundle",
      "args": ["exec", "rake", "test"],
      "askParameters": false
    },
    {
      "name": "Debug: current test file",
      "type": "rdbg",
      "request": "launch",
      "command": "bundle",
      "args": ["exec", "ruby", "-Ilib", "-Itest", "${file}"],
      "askParameters": false
    },
    {
      "name": "Debug: bin/console",
      "type": "rdbg",
      "request": "launch",
      "command": "bin/console",
      "askParameters": false
    }
  ]
}
```

(Requires `gem "debug"` in the `:development` group, which `bundle gem` adds by default.)

---

## 16. First-PR Scaffold

Create these files in this order. After the last file, `git push` yields a CI-green, deployable hello-world gem.

### `.ruby-version`

```
3.4.4
```

### `.gitignore`

```
/.bundle/
/.yardoc
/_yardoc/
/coverage/
/doc/
/pkg/
/spec/reports/
/tmp/
*.gem
*.rbc
.rspec_status
.byebug_history
.idea/
.vscode/.ropeproject/

# Library: do not commit Gemfile.lock
/Gemfile.lock

# Native ext build artifacts
/lib/**/*.so
/lib/**/*.bundle
/lib/**/*.dylib
/tmp/x86_64-linux/
/tmp/arm64-darwin*/
*.o
```

### `Gemfile`

```ruby
# frozen_string_literal: true

source "https://rubygems.org"

# Specify your gem's dependencies in stringops.gemspec
gemspec

group :development, :test do
  gem "rake", "~> 13.4"
  gem "minitest", "~> 5.25"
  gem "rubocop", "~> 1.86"
  gem "rubocop-minitest", "~> 0.38"
  gem "rubocop-rake", "~> 0.7"
  gem "bundler-audit", "~> 0.9"
  gem "simplecov", "~> 0.22", require: false
  gem "debug", ">= 1.0.0"
  # Optional typing:
  # gem "rbs"
  # gem "steep"
end
```

### `stringops.gemspec`

```ruby
# frozen_string_literal: true

require_relative "lib/stringops/version"

Gem::Specification.new do |spec|
  spec.name          = "stringops"
  spec.version       = Stringops::VERSION
  spec.authors       = ["Your Name"]
  spec.email         = ["you@example.com"]

  spec.summary       = "Tiny string utilities."
  spec.description   = "stringops provides reverse, shout, and other small string transforms with no runtime dependencies."
  spec.homepage      = "https://github.com/yourname/stringops"
  spec.license       = "MIT"
  spec.required_ruby_version = ">= 3.3.0"

  spec.metadata["homepage_uri"]      = spec.homepage
  spec.metadata["source_code_uri"]   = spec.homepage
  spec.metadata["changelog_uri"]     = "#{spec.homepage}/blob/main/CHANGELOG.md"
  spec.metadata["bug_tracker_uri"]   = "#{spec.homepage}/issues"
  spec.metadata["rubygems_mfa_required"] = "true"

  spec.files = Dir.chdir(__dir__) do
    `git ls-files -z`.split("\x0").reject do |f|
      (File.expand_path(f) == __FILE__) ||
        f.start_with?(*%w[bin/ test/ spec/ features/ .git .github appveyor Gemfile])
    end
  end
  spec.bindir        = "exe"
  spec.executables   = spec.files.grep(%r{\Aexe/}) { |f| File.basename(f) }
  spec.require_paths = ["lib"]

  # Runtime deps go here. Example:
  # spec.add_dependency "some_runtime_dep", "~> 1.0"

  # Dev deps live in Gemfile, NOT here.
end
```

### `lib/stringops.rb`

```ruby
# frozen_string_literal: true

require_relative "stringops/version"

# stringops — tiny string utilities.
module Stringops
  # Base error class for the gem.
  class Error < StandardError; end

  # Reverses a string.
  #
  # @param str [String]
  # @return [String]
  # @raise [ArgumentError] if str is not a String
  def self.reverse(str)
    raise ArgumentError, "expected String, got #{str.class}" unless str.is_a?(String)

    str.reverse
  end

  # Returns an upper-cased version of the string.
  #
  # @param str [String]
  # @return [String]
  def self.shout(str)
    raise ArgumentError, "expected String, got #{str.class}" unless str.is_a?(String)

    str.upcase
  end
end
```

### `lib/stringops/version.rb`

```ruby
# frozen_string_literal: true

module Stringops
  VERSION = "0.1.0"
end
```

### `Rakefile`

```ruby
# frozen_string_literal: true

require "bundler/gem_tasks"
require "rake/testtask"

Rake::TestTask.new(:test) do |t|
  t.libs << "test"
  t.libs << "lib"
  t.test_files = FileList["test/**/test_*.rb"]
  t.warning = false
end

require "rubocop/rake_task"
RuboCop::RakeTask.new

task default: %i[test rubocop]
```

### `.rubocop.yml`

```yaml
plugins:
  - rubocop-minitest
  - rubocop-rake

AllCops:
  TargetRubyVersion: 3.3
  NewCops: enable
  SuggestExtensions: false
  Exclude:
    - "vendor/**/*"
    - "tmp/**/*"
    - "pkg/**/*"

Style/StringLiterals:
  EnforcedStyle: double_quotes

Style/StringLiteralsInInterpolation:
  EnforcedStyle: double_quotes

Layout/LineLength:
  Max: 120

Metrics/MethodLength:
  Max: 25

Metrics/BlockLength:
  Exclude:
    - "test/**/*"
    - "*.gemspec"
    - "Rakefile"

Gemspec/RequireMFA:
  Enabled: true
```

### `test/test_helper.rb`

```ruby
# frozen_string_literal: true

$LOAD_PATH.unshift File.expand_path("../lib", __dir__)

require "simplecov"
SimpleCov.start do
  add_filter "/test/"
  enable_coverage :branch
end

require "stringops"
require "minitest/autorun"
```

### `test/test_stringops.rb`

```ruby
# frozen_string_literal: true

require "test_helper"

class TestStringops < Minitest::Test
  def test_that_it_has_a_version_number
    refute_nil ::Stringops::VERSION
  end

  def test_reverse_returns_reversed_string
    assert_equal "olleh", Stringops.reverse("hello")
  end

  def test_reverse_handles_empty_string
    assert_equal "", Stringops.reverse("")
  end

  def test_reverse_raises_on_non_string
    assert_raises(ArgumentError) { Stringops.reverse(nil) }
    assert_raises(ArgumentError) { Stringops.reverse(123) }
  end

  def test_shout_returns_uppercase
    assert_equal "HELLO", Stringops.shout("hello")
  end

  def test_shout_raises_on_non_string
    assert_raises(ArgumentError) { Stringops.shout(nil) }
  end
end
```

### `bin/setup`

```bash
#!/usr/bin/env bash
set -euo pipefail
IFS=$'\n\t'
set -vx

bundle install

# Add any other automated setup here:
# - download fixtures
# - install git hooks
```

`chmod +x bin/setup`.

### `bin/console`

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require "bundler/setup"
require "stringops"

require "irb"
IRB.start(__FILE__)
```

`chmod +x bin/console`.

### `bin/check`

```bash
#!/usr/bin/env bash
set -euo pipefail

bundle exec rubocop
bundle exec rake test
bundle exec bundle-audit check --update
```

`chmod +x bin/check`.

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions:
  contents: read

jobs:
  test:
    name: Test on Ruby ${{ matrix.ruby }} (${{ matrix.os }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        os: [ubuntu-latest, macos-latest]
        ruby: ["3.3", "3.4", "head"]
    steps:
      - uses: actions/checkout@v4
      - name: Set up Ruby ${{ matrix.ruby }}
        uses: ruby/setup-ruby@v1
        with:
          ruby-version: ${{ matrix.ruby }}
          bundler-cache: true
      - name: Run tests
        run: bundle exec rake test

  lint:
    name: RuboCop
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.4"
          bundler-cache: true
      - run: bundle exec rubocop --no-color

  audit:
    name: bundle-audit
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.4"
          bundler-cache: true
      - run: bundle exec bundle-audit check --update
```

### `.github/workflows/release.yml`

```yaml
name: Release

on:
  push:
    branches: [main]

permissions:
  contents: write
  pull-requests: write
  id-token: write

jobs:
  release-please:
    runs-on: ubuntu-latest
    outputs:
      release_created: ${{ steps.release.outputs.release_created }}
      tag_name: ${{ steps.release.outputs.tag_name }}
    steps:
      - uses: googleapis/release-please-action@v4
        id: release
        with:
          release-type: ruby
          package-name: stringops
          version-file: lib/stringops/version.rb
          bump-minor-pre-major: true
          changelog-types: |
            [
              {"type":"feat","section":"Features","hidden":false},
              {"type":"fix","section":"Bug Fixes","hidden":false},
              {"type":"perf","section":"Performance","hidden":false},
              {"type":"docs","section":"Documentation","hidden":false},
              {"type":"chore","section":"Maintenance","hidden":true}
            ]

  publish:
    needs: release-please
    if: ${{ needs.release-please.outputs.release_created == 'true' }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - uses: ruby/setup-ruby@v1
        with:
          ruby-version: "3.4"
          bundler-cache: true
      - name: Push to RubyGems via OIDC
        uses: rubygems/release-gem@v1
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: bundler
    directory: "/"
    schedule:
      interval: weekly
  - package-ecosystem: github-actions
    directory: "/"
    schedule:
      interval: weekly
```

### `release-please-config.json`

```json
{
  "release-type": "ruby",
  "packages": {
    ".": {
      "package-name": "stringops",
      "version-file": "lib/stringops/version.rb",
      "changelog-path": "CHANGELOG.md",
      "bump-minor-pre-major": true
    }
  }
}
```

### `.release-please-manifest.json`

```json
{ ".": "0.1.0" }
```

### `CHANGELOG.md`

```markdown
# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-27

### Added

- Initial release. `Stringops.reverse` and `Stringops.shout`.
```

### `LICENSE.txt` — standard MIT license, fill in name + year.

### `README.md`

```markdown
# stringops

[![CI](https://github.com/yourname/stringops/actions/workflows/ci.yml/badge.svg)](https://github.com/yourname/stringops/actions/workflows/ci.yml)
[![Gem Version](https://badge.fury.io/rb/stringops.svg)](https://rubygems.org/gems/stringops)

Tiny string utilities.

## Install

```ruby
# Gemfile
gem "stringops"
```

```bash
bundle install
```

Or:

```bash
gem install stringops
```

## Usage

```ruby
require "stringops"

Stringops.reverse("hello")  # => "olleh"
Stringops.shout("hello")    # => "HELLO"
```

## Development

```bash
bin/setup
bundle exec rake test
bundle exec rubocop
```

## License

MIT.
```

### `CODE_OF_CONDUCT.md` — Contributor Covenant 2.1, drop in unmodified.

After all of the above, `git init && git add -A && git commit -m "feat: initial gem skeleton"`, push, and CI passes.

---

## 17. Idea → MVP Path (Skeleton → v1.0.0)

For the generic `stringops` example. Adapt to actual gem.

### Phase 1 — Skeleton (1 AI session, ~30 min)

Files: every file in §16.
Exit: `bundle exec rake` green, CI green on a fresh repo, gem builds locally, `gem install pkg/*.gem && ruby -e 'require "stringops"; puts Stringops::VERSION'` works.

### Phase 2 — First public API (1–2 sessions)

Files: `lib/stringops/<feature>.rb` + `test/test_<feature>.rb`. Update `lib/stringops.rb` to require the new file.
Exit: ≥3 public methods, each with YARD docs and full Minitest coverage. README updated with examples. `feat:` commit triggers release-please to open a 0.2.0 PR.

### Phase 3 — First public release (1 session)

Files: merge release-please PR. `0.1.0` is your reservation push from §12; `0.2.0` is the first OIDC-published release.
Exit: gem visible at `https://rubygems.org/gems/stringops/versions/0.2.0`. `gem install stringops` works for any user. Trusted Publisher visible on the gem's RubyGems.org page.

### Phase 4 — Hardening (2 sessions)

- Add error subclasses: `Stringops::ArgumentError`, `Stringops::Error`.
- Add RBS signatures in `sig/`. Run `bundle exec steep check`.
- Add `bench/*.rb` + `rake bench` task.
- Verify the gem against Ruby 3.3, 3.4, head on macOS + Linux (already in CI).
- Add `bundler-audit` to CI (already in §16).
Exit: every public method has RBS + benchmark; CI matrix all green.

### Phase 5 — v1.0.0 (1 session)

- Cut a `feat!:` commit (or use the release-please `Release-As: 1.0.0` footer) when API is stable enough to commit to.
- Update README with stability statement.
- Write a 1.0.0 announcement (blog/Mastodon).
Exit: `gem install stringops` returns 1.0.0; downloads visible on RubyGems.org dashboard.

---

## 18. Feature Recipes

### Recipe 1: Add a CLI executable

`exe/stringops`:

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

require "stringops"
require "stringops/cli"

exit Stringops::CLI.new(ARGV).run
```

`chmod +x exe/stringops`.

`lib/stringops/cli.rb`:

```ruby
# frozen_string_literal: true

require "optparse"

module Stringops
  class CLI
    def initialize(argv)
      @argv = argv
    end

    def run
      command = @argv.shift
      case command
      when "reverse" then puts Stringops.reverse(@argv.join(" ")); 0
      when "shout"   then puts Stringops.shout(@argv.join(" ")); 0
      when nil, "-h", "--help" then puts help; 0
      else
        warn "Unknown command: #{command}"
        warn help
        1
      end
    end

    def help
      <<~HELP
        Usage: stringops <command> <args>
        Commands:
          reverse  <string>   Reverse a string
          shout    <string>   Uppercase a string
      HELP
    end
  end
end
```

In `stringops.gemspec` — `spec.executables` is auto-populated from `exe/`.

### Recipe 2: Optional dev dependency (e.g. coverage threshold)

In `Gemfile`:

```ruby
gem "simplecov", "~> 0.22", require: false
```

In `test/test_helper.rb`:

```ruby
require "simplecov"
SimpleCov.start do
  add_filter "/test/"
  enable_coverage :branch
  minimum_coverage line: 90, branch: 80
end
```

### Recipe 3: Add an HTTP-using runtime dep (with WebMock for tests)

Gemspec runtime:

```ruby
spec.add_dependency "faraday", "~> 2.0"
```

Gemfile dev:

```ruby
gem "webmock", "~> 3.0"
```

Test:

```ruby
require "webmock/minitest"
WebMock.disable_net_connect!

class TestApiClient < Minitest::Test
  def setup
    stub_request(:get, "https://example.com/data").to_return(status: 200, body: '{"ok":true}')
  end

  def test_fetches
    assert Stringops::ApiClient.new.ok?
  end
end
```

### Recipe 4: C native extension

`ext/stringops/extconf.rb`:

```ruby
# frozen_string_literal: true

require "mkmf"
create_makefile("stringops/stringops_native")
```

`ext/stringops/stringops_native.c`:

```c
#include "ruby.h"

static VALUE rb_stringops_fast_reverse(VALUE self, VALUE str) {
    Check_Type(str, T_STRING);
    long len = RSTRING_LEN(str);
    char *src = RSTRING_PTR(str);
    VALUE out = rb_str_new(NULL, len);
    char *dst = RSTRING_PTR(out);
    for (long i = 0; i < len; i++) dst[i] = src[len - 1 - i];
    return out;
}

void Init_stringops_native(void) {
    VALUE mod = rb_define_module("Stringops");
    rb_define_singleton_method(mod, "fast_reverse", rb_stringops_fast_reverse, 1);
}
```

In `Rakefile`:

```ruby
require "rake/extensiontask"
Rake::ExtensionTask.new("stringops") do |ext|
  ext.lib_dir = "lib/stringops"
end

task test: :compile
```

In `<gem>.gemspec`:

```ruby
spec.extensions = ["ext/stringops/extconf.rb"]
```

In Gemfile:

```ruby
gem "rake-compiler", "~> 1.3"
```

### Recipe 5: Rust native extension via rb-sys + magnus

`ext/stringops/extconf.rb`:

```ruby
# frozen_string_literal: true

require "mkmf"
require "rb_sys/mkmf"

create_rust_makefile("stringops/stringops_native")
```

`ext/stringops/Cargo.toml`:

```toml
[package]
name = "stringops_native"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
magnus = "0.7"
```

`ext/stringops/src/lib.rs`:

```rust
use magnus::{define_module, function, prelude::*, Error};

fn fast_reverse(s: String) -> String {
    s.chars().rev().collect()
}

#[magnus::init]
fn init(ruby: &magnus::Ruby) -> Result<(), Error> {
    let module = define_module("Stringops")?;
    module.define_singleton_method("fast_reverse", function!(fast_reverse, 1))?;
    Ok(())
}
```

In Gemfile:

```ruby
gem "rake-compiler", "~> 1.3"
gem "rb_sys", "~> 0.9"
```

In Rakefile:

```ruby
require "rb_sys/extensiontask"
RbSys::ExtensionTask.new("stringops_native") do |ext|
  ext.lib_dir = "lib/stringops"
end
```

Gemspec:

```ruby
spec.extensions = ["ext/stringops/extconf.rb"]
```

### Recipe 6: Cross-compiled native gems (precompiled binaries on RubyGems)

Use `oxidize-rb/cross-gem-action` for Rust, or `rake-compiler-dock` for C. Add a job to release.yml that runs after `publish` to build and push platform-specific gems (e.g. `stringops-0.2.0-x86_64-linux.gem`). Out of scope for v1; add when consumers report compile-time pain.

### Recipe 7: RBS type signatures

`sig/stringops.rbs`:

```rbs
module Stringops
  VERSION: String

  class Error < StandardError
  end

  def self.reverse: (String) -> String
  def self.shout: (String) -> String
end
```

In Gemfile:

```ruby
gem "rbs"
gem "steep"
```

`Steepfile`:

```ruby
target :lib do
  signature "sig"
  check "lib"
  library "logger"
end
```

Run: `bundle exec steep check`.

### Recipe 8: Deprecation warnings

```ruby
def self.upper(str)
  warn "[DEPRECATION] `Stringops.upper` is deprecated. Use `Stringops.shout` instead. (called from #{caller(1..1).first})"
  shout(str)
end
```

### Recipe 9: Multi-version gemspec metadata for funding

```ruby
spec.metadata["funding_uri"] = "https://github.com/sponsors/yourname"
```

RubyGems.org displays a Sponsor button.

### Recipe 10: Gem signing (low-priority; OIDC + MFA cover most threats)

```bash
gem cert --build you@example.com
```

In gemspec:

```ruby
spec.cert_chain  = ["certs/yourname.pem"]
spec.signing_key = File.expand_path("~/.ssh/gem-private_key.pem") if $PROGRAM_NAME =~ /gem\z/
```

Most gems do not sign; OIDC + MFA is the modern baseline.

---

## 19. Troubleshooting

| Error | Fix |
|---|---|
| `Your Ruby version is X, but your Gemfile specified Y` | `rbenv install Y && rbenv local Y` (or update `.ruby-version`) |
| `Gem::Ext::BuildError: ERROR: Failed to build gem native extension` | macOS: `xcode-select --install`. Linux: `sudo apt install ruby-dev build-essential` |
| `LoadError: cannot load such file -- mkmf` | Linux: `sudo apt install ruby-dev` |
| `bundler: failed to load command: rake` | Use `bundle exec rake`, not bare `rake` |
| `Could not locate Gemfile or .bundle/ directory` | `cd` into the gem directory before running |
| `repushing of gem versions is not allowed` | Bump `lib/<gem>/version.rb` (or merge release-please PR) and rebuild |
| `Multifactor authentication is required` | Enable MFA on RubyGems.org; ensure all maintainers have it |
| `Forbidden: trusted publisher does not match` | Verify workflow file path, repo, branch in RubyGems.org Trusted Publisher config |
| `Error: missing OIDC token` | Add `permissions: id-token: write` at the job level in release.yml |
| `Could not find <dep> in any of the sources` | Runtime dep missing from gemspec; add and `bundle install` |
| `LoadError: cannot load such file -- stringops/foo` | gemspec `files` excludes `lib/stringops/foo.rb`; verify with `gem unpack` |
| `frozen string error: can't modify frozen String` | Use `String.new("x")` or `+"x"` for mutable strings |
| `Rubocop offenses detected` | `bundle exec rubocop -A` to auto-fix; review diff |
| `Bundler::GemNotFound: Could not find gem 'X' in locally installed gems` | `bundle install` again |
| `WebMock::NetConnectNotAllowedError` | Add `stub_request` for the URL in `setup` |
| `gem build: warning: open-ended dependency on X` | Pin to a major: `"~> 2.0"` |
| `release-please: no release created` | Check commits use Conventional Commits; check default branch is `main` |
| `release-please: nothing to release` | No `feat:` / `fix:` since last release; expected |
| `Steep: type errors detected` | Update `sig/*.rbs` to match new method signatures |
| `BUNDLE_PATH ./vendor/bundle` ate disk | `bundle config set path 'vendor/bundle'` is fine; gitignore it |
| `ld: library not found for -lcrypt` | Linux: `sudo apt install libcrypt-dev` |
| `psych.so: undefined symbol` | Reinstall Ruby; libyaml mismatch |
| `cannot load such file -- bundler/setup` | `gem install bundler` |
| `dyld: Library not loaded: @rpath/libruby` | Reinstall Ruby with rbenv after a macOS upgrade |
| `Net::ReadTimeout from RubyGems.org` | Retry; check status.rubygems.org |
| CI fails on `head` Ruby only | Add `continue-on-error: true` to the head matrix entry |
| `Cargo.lock` keeps changing | Add `Cargo.lock` to `.gitignore` for library crates inside the gem |
| `warning: already initialized constant Stringops::VERSION` | Two require paths loading version.rb; use `require_relative` consistently |
| `gem yank` requires confirmation | Add `--platform=ruby` and `-v <version>` |
| `bundle update` regressed an unrelated dep | Use `bundle update <name>` for the specific gem |

---

## 20. Glossary

- **Bundler** — The Ruby dependency manager. Reads `Gemfile`, writes `Gemfile.lock`, ensures consistent installs.
- **Gem** — A packaged Ruby library, distributed as a `.gem` file. The unit of distribution.
- **Gemspec** — The manifest file (`<gem>.gemspec`) describing a gem: name, version, files, deps, metadata.
- **RubyGems** — The official Ruby package registry (https://rubygems.org) and the `gem` CLI tool that installs from it.
- **Rake** — Ruby's "make"; defines build/test/release tasks in a `Rakefile`.
- **Minitest** — Ruby's standard-library test framework. Default for Rails 8 and the `bundle gem` template.
- **RSpec** — A behavior-driven test framework with a DSL syntax. The popular alternative to Minitest.
- **RuboCop** — The Ruby linter and formatter. Enforces style and catches common bugs.
- **Trusted Publishing** — RubyGems.org's OIDC-based scheme: CI exchanges a short-lived GitHub identity token for a one-shot publish credential. Replaces long-lived API keys.
- **OIDC (OpenID Connect)** — A standard for issuing short-lived identity tokens; GitHub Actions issues them, RubyGems.org accepts them.
- **release-please** — A Google-maintained GitHub Action that reads Conventional Commits, opens release PRs, and tags releases.
- **Conventional Commits** — A commit message convention: `feat:`, `fix:`, `chore:`, etc. Drives automated SemVer bumps.
- **SemVer (Semantic Versioning)** — Major.Minor.Patch versioning: breaking → major, additive → minor, fix → patch.
- **MFA (Multi-Factor Authentication)** — A second auth factor (TOTP/WebAuthn) required to publish or yank gems on accounts that opt in.
- **Yank** — Mark a published gem version as unavailable for new installs (but it remains for existing pinned consumers).
- **Native extension** — A gem with C or Rust source compiled at install time. Provides speed but adds complexity.
- **rake-compiler** — A Rake plugin that compiles native extensions and builds platform-specific gems.
- **rb-sys** — A toolkit that makes Rust-based Ruby extensions ergonomic.
- **magnus** — A Rust crate giving idiomatic Rust bindings to the Ruby C API.
- **RBS** — Ruby's official type signature language (separate `.rbs` files).
- **Steep** — The static type checker that consumes RBS signatures.
- **Refinement** — A scoped Ruby language feature for adding methods to existing classes without monkey-patching globally.
- **`require` vs `require_relative`** — `require` searches the load path; `require_relative` resolves relative to the current file. Use `require_relative` inside the gem.
- **`Gemfile.lock`** — The exact resolved versions for an environment. Commit for apps; gitignore for libs.
- **CHANGELOG** — A human-readable log of notable changes per version. release-please maintains it.
- **`.ruby-version`** — A plain-text file containing the Ruby version; rbenv/asdf read it.
- **CI matrix** — Running tests across multiple Ruby versions / OSes in parallel.
- **OIDC trusted publisher** — A RubyGems.org config row mapping a (repo, workflow, ref) tuple to a gem; only that exact combination can publish.
- **`exe/`** — The directory where gem CLI executables live (Bundler convention; older gems used `bin/`).

---

## 21. Update Cadence

- This rulebook is valid for **Ruby 3.3 through 3.4**, **Bundler 2.6+ through 4.0.x**, **RuboCop 1.86+**, **rubygems/release-gem v1**, **release-please-action v4**.
- Re-run the generator when:
  - Ruby major bump (4.0 → 4.x) lands in a CI matrix.
  - RubyGems.org changes the Trusted Publishing protocol or `release-gem` action major-bumps.
  - A security advisory affects `bundler`, `rubygems`, `rake`, or any default dev gem.
  - release-please-action v5 lands.
- Last verified: **2026-04-27**.
