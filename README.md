<div align="center">

# pandect

### Stop setting up. Start shipping.

33 production-tuned stack rulebooks for AI coding agents. One markdown file per stack — every decision pre-made, every version cited, every config inlined. Hand it to **Claude Code**, **Codex**, or **Cursor** and skip the 50 setup questions.

[![npm version](https://img.shields.io/npm/v/pandect?color=cb3837&labelColor=000)](https://www.npmjs.com/package/pandect)
[![npm downloads](https://img.shields.io/npm/dm/pandect?color=44cc11&labelColor=000)](https://www.npmjs.com/package/pandect)
[![release](https://img.shields.io/github/actions/workflow/status/cleanmcp/pandect/release.yml?label=release&labelColor=000)](https://github.com/cleanmcp/pandect/actions/workflows/release.yml)
[![license](https://img.shields.io/npm/l/pandect?color=blue&labelColor=000)](./LICENSE)
[![stars](https://img.shields.io/github/stars/cleanmcp/pandect?color=ffd700&labelColor=000&style=flat)](https://github.com/cleanmcp/pandect/stargazers)
[![provenance](https://img.shields.io/badge/npm-provenance-blueviolet?labelColor=000)](https://docs.npmjs.com/generating-provenance-statements)

</div>

```sh
$ npx pandect nextjs
wrote RULEBOOK.md (nextjs, 2401 lines, 91 KB)
hand this file + your idea to Claude Code, Codex, or Cursor.
```

---

## What gets killed

Tired of:

- Burning a Saturday on `package.json`, `tsconfig.json`, and `.eslintrc` before writing a single feature
- Your AI agent asking *"which test framework?"* for the 100th time this month
- Choosing between five ORMs that all look identical at the docs level
- Re-implementing auth, file uploads, and Stripe checkout from scratch every project
- Hitting prod with a config nobody reviewed because nobody had time to review it

Hand your AI a pandect rulebook and every one of those bullets is gone. That's the entire pitch.

## The problem

Every new project starts with the same 50 questions: *which package manager? which test runner? how do I deploy? how does auth work? what's the right way to structure routes? what does my AI agent need to know about all of this?*

If you're a **non-coder** with an idea, you don't know the answers. Your AI agent guesses, often wrong, and you ship something fragile.

If you're a **senior engineer**, you know the answers — but you're still typing them out for the 100th time, this time for the AI.

Either way, you waste hours. The AI keeps asking. You keep deciding. The fight is the same.

## The fix

`pandect` is a single markdown file per stack — pre-decided, pre-cited, pre-configured. Every package version is verified live. Every config file is inlined. Every command is copy-pasteable. The agent reads it once and stops asking.

The name comes from the legal term **pandect**: a comprehensive single-volume treatise that covers an entire body of law. That's exactly what each rulebook is — a complete code for one stack.

## Quickstart

```sh
# 1. Drop a rulebook into your folder
npx pandect nextjs

# 2. Open Claude Code / Codex / Cursor in that folder
# 3. Tell the agent:
#    "Read RULEBOOK.md. We're building <your idea>. Bootstrap and ship."
```

That's it. No clone, no scaffold, no install — just one file your AI now knows by heart.

Or download via curl, no Node required:

```sh
curl -fsSL https://raw.githubusercontent.com/cleanmcp/pandect/main/rulebooks/nextjs.md -o RULEBOOK.md
```

## What you get

Every rulebook is **2,000–2,800 lines** following the same 21-section spec — so an agent that knows one rulebook knows them all.

| Section | Why it matters |
|---|---|
| **1. Snapshot** | Versions table. Every lib pinned to a real, current release date. |
| **2. Zero-to-running** | Setup steps for macOS / Windows / Linux. Even `brew install` levels of detail. |
| **3. Project Layout** | ASCII tree + "if you're adding X, it goes in Y" decision table. |
| **4. Architecture** | Process boundaries. Data flow. Auth flow. Where business logic lives. |
| **5. Dev Workflow** | How to start the dev server, attach a debugger, run pre-commit checks. |
| **6. Testing & Parallelization** | Unit, integration, E2E. Parallelization patterns for AI agents. |
| **7. Logging** | Structured logger setup + sample log lines for every event class. |
| **8. AI Rules** | At least 20 ALWAYS, 15 NEVER, 20 blast-radius rows, 15 pitfalls. The heart of the file. |
| **9. Stack-Specific Pitfalls** | Common AI-coder failure modes for *this* stack, with detection + fix. |
| **10. Performance Budgets** | Cold start, TTI, bundle size, memory — and how to measure each. |
| **11. Security** | Threat model, auth boundary, secret storage, dependency audit cadence. |
| **12. Deploy / Publish** | Full release flow command-by-command + rollback. |
| **13. Claude Code Integration** | Full `CLAUDE.md` + `.claude/settings.json` paste-ready. |
| **14. Codex Integration** | Full `AGENTS.md` + `.codex/config.toml` paste-ready. |
| **15. Cursor / VS Code** | `.cursor/rules`, `extensions.json`, `launch.json` paste-ready. |
| **16. First-PR Scaffold** | Every file to create on a brand-new repo, in order, full contents. |
| **17. Idea-to-MVP Path** | 5-phase plan: schema, backbone, vertical slice, auth, ship. |
| **18. Feature Recipes** | Auth, file upload, payments, push, jobs, realtime, search, i18n, dark mode, analytics. |
| **19. Troubleshooting** | Top 30 errors verbatim with the exact fix command. |
| **20. Glossary** | Plain-English definitions of every jargon term used in the file. |
| **21. Update Cadence** | When to regenerate this rulebook. |

If it's not in the rulebook, the agent will guess. So nothing is missing.

## Available stacks

```sh
npx pandect --list
```

### Apps

| Stack | Stack details |
|---|---|
| `ios` | SwiftUI + SwiftData (iPhone/iPad) |
| `mac` | SwiftUI + SwiftData (native Mac app) |
| `android` | Kotlin + Jetpack Compose + Room + Hilt |
| `expo` | React Native + Expo + EAS + expo-router |
| `flutter` | Flutter + Firebase + Riverpod + go_router |
| `electron` | Electron + electron-vite + React + SQLite + Drizzle |
| `tauri` | Tauri 2 + Svelte 5 + Rust + sqlx |
| `unity` | Unity 6 + C# + URP |
| `godot` | Godot 4 + GDScript |

### Web

| Stack | Stack details |
|---|---|
| `nextjs` | Next.js App Router + Supabase + Stripe + Vercel |
| `vite` | Vite + React SPA + TanStack Router/Query |
| `astro` | Astro + Cloudflare Workers/Pages |
| `sveltekit` | SvelteKit + Svelte 5 + Drizzle + Vercel |
| `remix` | React Router 7 (framework mode) + Drizzle + Vercel |
| `chrome` | Chrome MV3 extension + WXT + side panel |

### Backend

| Stack | Stack details |
|---|---|
| `fastapi` | FastAPI + Postgres + uv + Alembic + SQLAlchemy 2 |
| `hono` | Hono + Bun + Drizzle + Cloudflare D1/R2/KV |
| `rails` | Rails 8 + Hotwire + Postgres + SolidQueue + Kamal 2 |
| `phoenix` | Phoenix LiveView + Elixir + Ecto + Fly.io |
| `workers` | Cloudflare Workers + D1 + KV + R2 + Durable Objects |

### Distribution and publishing

| Stack | What you ship |
|---|---|
| `npm` | TypeScript library to npmjs (tshy + changesets + OIDC) |
| `brew` | Homebrew tap for a CLI |
| `pypi` | Python library/CLI to PyPI (uv + trusted publisher) |
| `cargo` | Rust library + CLI to crates.io (cargo-dist) |
| `gem` | Ruby gem to RubyGems (OIDC trusted publishing) |
| `docker` | Multi-arch image to GHCR + Docker Hub (signed via cosign) |
| `action` | GitHub Action to Marketplace |
| `bun` | Single-binary CLI via `bun build --compile` |
| `vscode` | VS Code Marketplace + Open VSX |
| `jetbrains` | JetBrains IDE plugin |
| `raycast` | Raycast store |
| `obsidian` | Obsidian community plugins |
| `lokus` | Lokus plugins |

The original long names (`swiftui-ios`, `nextjs-supabase`, `chrome-extension-mv3`, etc.) still work as aliases — nothing breaks for anyone scripting against earlier versions.

## CLI reference

```sh
npx pandect <stack>              # writes ./RULEBOOK.md
npx pandect <stack> -o foo.md    # writes ./foo.md
npx pandect --list               # one stack per line
npx pandect --version
npx pandect --help
```

Or install globally for a shorter command:

```sh
npm i -g pandect
pandect nextjs
```

## Why does this exist

Most "starter templates" are repos you clone and inherit *forever* — including their abandonment, their unmaintained dependencies, and their author's personal taste. You can't update them without merge conflicts.

`pandect` is the opposite: it's not a template, it's a **decision document**. You delete `RULEBOOK.md` whenever you want. The advice was authoritative on the day it shipped (every version cited via live web search) and you regenerate it whenever a major version of the stack drops.

Three principles every rulebook follows:

1. **One pick per axis.** No "you could either..." anywhere in the file. Indecision strands a non-coder; wrong choice is recoverable via search-and-replace.
2. **Cited, not memorized.** Versions come from live WebSearch on the day the rulebook was generated, not from training cutoffs.
3. **AI-first prose.** Every section answers: *what does the agent do, what's the blast radius, how does the agent verify itself.*

## Contributing

To **add a new stack**:

1. Open an issue using the [New stack](https://github.com/cleanmcp/pandect/issues/new?template=new_stack.yml) template
2. We feed `RULEBOOK_GENERATOR.md` (the meta-prompt that produced every existing rulebook) into a fresh AI session with your stack as input
3. The output is a new `<stack>.md` file — open the PR

To **update an existing stack** (major version bump, deprecated dep, new gotcha):

1. Open an issue using the [Update stack](https://github.com/cleanmcp/pandect/issues/new?template=update_stack.yml) template
2. Regenerate via the meta-prompt against the new versions
3. PR the diff

See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.

## Roadmap

- [ ] Embeddings index across all rulebooks (so an agent can answer "which stack has the lightest deploy?" without reading 33 files)
- [ ] CLI flag `npx pandect <stack> --section 8` to extract a single section
- [ ] Diff mode: `npx pandect <stack> --since 0.1.0` shows what changed
- [ ] Cursor / Continue / Aider rulebook variants per stack
- [ ] Hosted MCP server that lets any IDE pull rulebooks live
- [ ] Translations (zh, ja, es, pt — the rulebooks are large but mostly tables)

## Star history

[![Star History Chart](https://api.star-history.com/svg?repos=cleanmcp/pandect&type=Date)](https://star-history.com/#cleanmcp/pandect&Date)

## License

[MIT](./LICENSE) — use it however you want.

---

<div align="center">

**Built for the agent that does the typing.**

[npm](https://www.npmjs.com/package/pandect) · [GitHub](https://github.com/cleanmcp/pandect) · [Issues](https://github.com/cleanmcp/pandect/issues) · [Releases](https://github.com/cleanmcp/pandect/releases)

</div>
