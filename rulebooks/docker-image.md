# RULEBOOK — Docker Image (Multi-Arch, Signed, GHCR + Docker Hub)

A signed, multi-arch (linux/amd64 + linux/arm64) container image — Chainguard distroless base, multi-stage Dockerfile, BuildKit + Buildx + bake.hcl, Trivy + Grype + syft, cosign keyless OIDC, Renovate digest pinning, semver tags. Reference app: `echo-api` (Node 22 + Hono).

---

## 1. Snapshot

### Decisions Table

| Axis | Pick | Why (≤12 words) |
|---|---|---|
| Language | TypeScript 5.7 | Type-safe, AI-friendly, native Node 22 strip-types support |
| Runtime + version | Node.js 22.13.0 LTS | Active LTS until April 2027, Hono-supported |
| Base image (final) | `cgr.dev/chainguard/node:latest` (distroless) | Zero-CVE, no shell, minimal attack surface |
| Base image (builder) | `cgr.dev/chainguard/node:latest-dev` | Has package manager + shell for install |
| Package manager | pnpm 9.15.0 | Deterministic, fast, smaller layer than npm |
| Web framework | Hono 4.12.14 | Web-standards, fast, multi-runtime |
| Build tool | Docker Buildx 0.26.1 + bake.hcl | Multi-platform, declarative, cacheable |
| Backend | BuildKit (containerd image store) | Default in Docker Engine 29, OCI 1.1 native |
| Container engine | Docker Engine 29.0 (containerd store on) | Manifest list + provenance support |
| Multi-arch strategy | Buildx `--platform linux/amd64,linux/arm64` | Single manifest, two architectures |
| QEMU emulation | `tonistiigi/binfmt:qemu-v9.2.0` (CI) | Cross-build arm64 from amd64 runners |
| Registry primary | `ghcr.io/<owner>/echo-api` | Free for public, OIDC-native, GitHub-coupled |
| Registry mirror | `docker.io/<owner>/echo-api` | Discoverability, public ecosystem reach |
| Tag scheme | semver + sha (`v1.2.3`, `v1.2`, `v1`, `latest`, `sha-abc1234`) | Floating + immutable + traceable |
| Digest pinning | Required for `FROM` and CI base images | Reproducible builds, immutable |
| Signing | cosign 3.0.6 keyless OIDC (Sigstore Fulcio + Rekor) | No key management, transparent log |
| SBOM | syft 1.42.0 → SPDX-JSON, attached as attestation | Supply-chain transparency |
| Vulnerability scan (CI) | Trivy 0.70.0 (image + config) | Fast, OS + lang ecosystems, SARIF output |
| Vulnerability scan (cron) | Grype 0.92.0 weekly | Cross-validate against second DB |
| Lint | hadolint 2.12.1-beta + ShellCheck | AST-aware Dockerfile + RUN bash linting |
| .dockerignore | Required, mirrors `.gitignore` + adds `node_modules`, `.git` | Smaller context, faster builds |
| Healthcheck | `HEALTHCHECK CMD wget -qO- http://localhost:8080/healthz \|\| exit 1` | Distroless ships busybox-wget |
| User | `USER nonroot:nonroot` (uid 65532) | Never run as root in final image |
| Workdir | `/app` | Predictable, conventional |
| Process | `CMD ["dist/server.js"]` (entrypoint = node) | Direct exec, no shell wrapper |
| Cache backend | `type=gha` (GitHub Actions cache) | Native to runners, no external infra |
| CI provider | GitHub Actions | Native OIDC for cosign + GHCR |
| Renovate | `docker:pinDigests` + `helpers:pinGitHubActionDigests` | Auto-PRs for base + action bumps |
| Release flow | Tag-triggered (`v*.*.*`) workflow | Conventional, audit-trail clear |
| Auto-update | Renovate (base image + actions) + Dependabot (npm) | Two complementary scopes |
| Secret strategy | `--secret id=npm,src=$NPM_TOKEN_FILE` BuildKit secrets | Never via `--build-arg` |
| Provenance | `--provenance=mode=max` | Full SLSA build attestation |
| Manifest format | OCI 1.1 (default in BuildKit ≥0.13) | Future-proof, attestation support |

### Versions Table

| Lib | Version | Date | Link |
|---|---|---|---|
| Docker Engine | 29.0 | 2026-04-20 | https://docs.docker.com/engine/release-notes/29/ |
| Docker Buildx | 0.26.1 (stable) / 0.33.0-rc1 (RC) | 2026-03-31 | https://github.com/docker/buildx/releases |
| BuildKit | 0.18.0 | 2026-03 | https://github.com/moby/buildkit/releases |
| Node.js | 22.13.0 LTS | 2026-01 | https://nodejs.org/en/about/previous-releases |
| Hono | 4.12.14 | 2026-04-21 | https://www.npmjs.com/package/hono |
| pnpm | 9.15.0 | 2026-01 | https://pnpm.io |
| Chainguard node:latest | rolling | daily | https://images.chainguard.dev/directory/image/node/overview |
| cosign | 3.0.6 | 2026-04-06 | https://github.com/sigstore/cosign/releases |
| cosign-installer (Action) | v4.1.0 | 2026 | https://github.com/sigstore/cosign-installer |
| Trivy | 0.70.0 | 2026-04-17 | https://github.com/aquasecurity/trivy/releases |
| trivy-action | v0.36.0 | 2026 | https://github.com/aquasecurity/trivy-action |
| Grype | 0.92.0 | 2026-04 | https://github.com/anchore/grype/releases |
| syft | 1.42.0 | 2026-02 | https://github.com/anchore/syft/releases |
| sbom-action | v0.22.0 | 2026 | https://github.com/anchore/sbom-action |
| docker/setup-buildx-action | v4 | 2026 | https://github.com/docker/setup-buildx-action |
| docker/setup-qemu-action | v4 | 2026 | https://github.com/docker/setup-qemu-action |
| docker/build-push-action | v6 | 2026 | https://github.com/docker/build-push-action |
| docker/login-action | v4 | 2026 | https://github.com/docker/login-action |
| docker/metadata-action | v5 | 2026 | https://github.com/docker/metadata-action |
| docker/bake-action | v5 | 2026 | https://github.com/docker/bake-action |
| hadolint | 2.12.1-beta | 2026-01-27 | https://github.com/hadolint/hadolint |
| Renovate | 39.x | rolling | https://docs.renovatebot.com |
| QEMU binfmt | v9.2.0 | 2026 | https://github.com/tonistiigi/binfmt |

### Minimum Host Requirements

| Host | Min Spec |
|---|---|
| macOS | Sonoma 14 or newer; Apple Silicon (M1+) recommended; 8 GB RAM; 20 GB free disk |
| Windows | Windows 10/11 22H2+ with WSL2; 8 GB RAM; 20 GB free disk |
| Linux | kernel ≥5.15; cgroups v2; 4 GB RAM; 20 GB free disk |

### Cold-Start Estimate

- `git clone` → first signed multi-arch image pushed to GHCR + Docker Hub: **~45 min on first run** (registry account setup + Apple Silicon QEMU + first cache miss build), **~6 min on subsequent runs** (warm cache, OIDC ready).

---

## 2. Zero-to-running (Setup)

### macOS

```bash
# 1. Homebrew (install if missing)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 2. Docker Desktop (latest, ≥4.40 ships Engine 29)
brew install --cask docker
open -a Docker
# Wait for Docker whale icon to stabilize (≈30s)
docker version
# Expected: Server Engine: Version: 29.x.x, Containerd image store: enabled

# 3. CLI tools
brew install gh node@22 pnpm cosign syft grype hadolint
brew install --cask trivy

# 4. Verify
docker buildx version
# Expected: github.com/docker/buildx v0.26.1 ...
cosign version
# Expected: GitVersion: v3.0.6
trivy --version
# Expected: Version: 0.70.0
syft version
# Expected: Version: 1.42.0
grype version
# Expected: Version: 0.92.0

# 5. GitHub login (for OIDC + GHCR push)
gh auth login --web --scopes 'repo,write:packages'
gh auth status
# Expected: Logged in to github.com as <user>

# 6. Apple Silicon: enable Rosetta x86_64 emulation (if M1/M2/M3/M4)
# Docker Desktop → Settings → General → "Use Rosetta for x86_64/amd64 emulation on Apple Silicon" → ON
# This is ~10x faster than QEMU for amd64 builds locally.
```

### Windows

```powershell
# 1. WSL2 + Ubuntu 24.04
wsl --install -d Ubuntu-24.04
# Reboot, set up unix user.

# 2. Docker Desktop (Windows)
winget install -e --id Docker.DockerDesktop
# Settings → Resources → WSL Integration → enable for Ubuntu-24.04
# Settings → General → "Use the WSL 2 based engine" → ON

# 3. From WSL Ubuntu shell:
sudo apt-get update
sudo apt-get install -y curl gh

# 4. Node 22 + pnpm via Volta
curl https://get.volta.sh | bash
volta install node@22 pnpm@9

# 5. Cosign, syft, grype, trivy, hadolint
curl -O -L "https://github.com/sigstore/cosign/releases/download/v3.0.6/cosign-linux-amd64"
sudo install -m 755 cosign-linux-amd64 /usr/local/bin/cosign
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin v1.42.0
curl -sSfL https://raw.githubusercontent.com/anchore/grype/main/install.sh | sh -s -- -b /usr/local/bin v0.92.0
curl -sSfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin v0.70.0
sudo curl -L -o /usr/local/bin/hadolint https://github.com/hadolint/hadolint/releases/download/v2.12.1-beta/hadolint-Linux-x86_64
sudo chmod +x /usr/local/bin/hadolint

# 6. Verify
docker version
docker buildx version
cosign version
gh auth login --web --scopes 'repo,write:packages'
```

### Linux (Ubuntu 24.04 / Debian 12)

```bash
# 1. Docker Engine 29 (official repo)
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 2. Allow current user to use docker without sudo
sudo usermod -aG docker $USER
newgrp docker

# 3. Enable containerd image store (Engine 29 default but verify)
sudo mkdir -p /etc/docker
echo '{"features":{"containerd-snapshotter":true}}' | sudo tee /etc/docker/daemon.json
sudo systemctl restart docker

# 4. binfmt for arm64 cross-build on amd64 host
docker run --privileged --rm tonistiigi/binfmt:qemu-v9.2.0 --install all

# 5. CLI tools
sudo apt-get install -y gh
curl -fsSL https://get.pnpm.io/install.sh | sh -
# (then install cosign, trivy, grype, syft, hadolint same as Windows above)

# 6. Verify multi-arch capability
docker buildx ls
# Expected: at least one builder shows "linux/amd64*, linux/arm64*"
```

### Required Accounts

| Service | URL | What you need |
|---|---|---|
| GitHub | https://github.com | Account + 2FA + a public/private repo |
| GitHub Packages (GHCR) | https://github.com/<user>?tab=packages | Free, automatic. No separate signup. |
| Docker Hub | https://hub.docker.com | Free account; create access token at https://hub.docker.com/settings/security |
| Sigstore (Fulcio + Rekor) | https://sigstore.dev | Free, automatic via OIDC. No signup. |

### CLI auth steps

```bash
# GitHub Container Registry (uses GitHub PAT or token from gh)
echo "$(gh auth token)" | docker login ghcr.io -u "$(gh api user -q .login)" --password-stdin

# Docker Hub (use Access Token, NEVER your password)
# Create at https://hub.docker.com/settings/security
docker login docker.io -u <hub-username> --password-stdin <<< "$DOCKERHUB_TOKEN"

# Verify
docker info | grep -A2 Username
```

### Bootstrap commands (greenfield `echo-api`)

```bash
mkdir echo-api && cd echo-api
git init -b main
pnpm init
pnpm add hono@4.12.14
pnpm add -D typescript@5.7 @types/node@22 tsx@4
pnpm pkg set scripts.build="tsc -p tsconfig.json"
pnpm pkg set scripts.start="node dist/server.js"
pnpm pkg set scripts.dev="tsx watch src/server.ts"

# Create the source (see section 16 for exact contents)
mkdir -p src
# ... (write src/server.ts, tsconfig.json, Dockerfile, .dockerignore, etc.)

# First local build
docker buildx create --name multiarch --use --bootstrap
docker buildx build --platform linux/amd64,linux/arm64 --tag echo-api:dev --load .
# Note: --load with multi-platform requires containerd image store (Engine 29 default).
docker run --rm -p 8080:8080 echo-api:dev
# In another shell:
curl -sf http://localhost:8080/healthz
# Expected: {"ok":true}
```

### Expected first-run output (excerpt)

```
[+] Building 38.4s (24/24) FINISHED                              docker:multiarch
 => [internal] load build definition from Dockerfile                        0.0s
 => => transferring dockerfile: 1.32kB                                      0.0s
 => [linux/arm64 internal] load metadata for cgr.dev/chainguard/node:lat... 1.3s
 => [linux/amd64 internal] load metadata for cgr.dev/chainguard/node:lat... 1.3s
 => [linux/amd64 builder 1/5] FROM cgr.dev/chainguard/node:latest-dev@sh... 0.0s
 => [linux/arm64 builder 1/5] FROM cgr.dev/chainguard/node:latest-dev@sh... 0.0s
 => [linux/amd64 builder 2/5] WORKDIR /build                                0.1s
 ...
 => exporting to image                                                      2.1s
 => => exporting manifest list sha256:c4f3...                               0.0s
 => => naming to docker.io/library/echo-api:dev                             0.0s
```

### Common first-run errors

| Error | Cause | Exact fix |
|---|---|---|
| `ERROR: failed to solve: rpc error ... pull access denied for cgr.dev/chainguard/node` | Anonymous rate limit | `docker pull cgr.dev/chainguard/node:latest` once with retries; or sign in to Chainguard registry (`docker login cgr.dev -u <username> -p <token>`). |
| `ERROR: multiple platforms feature is currently not supported for docker driver` | Default `docker` builder, not `docker-container` | `docker buildx create --name multiarch --driver docker-container --use --bootstrap` |
| `failed to load builder ... no match for platform in manifest` | QEMU binfmt missing on Linux host | `docker run --privileged --rm tonistiigi/binfmt:qemu-v9.2.0 --install all` |
| `EACCES: permission denied, open '/app/...'` at runtime | App writes to `/app` but runs as `nonroot` | `RUN chown -R nonroot:nonroot /app` BEFORE `USER nonroot:nonroot` (in builder), OR write to `/tmp` |
| `exec /usr/bin/node: exec format error` | Built amd64-only, ran on arm64 (or vice versa) | Always pass `--platform`; pull manifest list, not single-arch image |
| `error: failed to push: unexpected status: 401 Unauthorized` | GHCR token lacks `write:packages` | Re-run `gh auth refresh -s write:packages` |
| `cosign: ... no matching signatures` on verify | Signed image's digest changed (rebuilt) | Verify against the digest you signed, not the tag |
| `Error response from daemon: error parsing HTTP 408 response body` (Apple Silicon) | QEMU emulation hang on long npm install | Enable Rosetta in Docker Desktop Settings → General |
| `no space left on device` mid-build | BuildKit cache + image store on small partition | `docker buildx prune -af && docker system prune -af` |
| `signal: killed` during `pnpm install` in arm64 build on amd64 host | QEMU OOM or slow | Increase Docker Desktop memory to ≥6 GB; use Rosetta on Mac |

---

## 3. Project Layout

```
echo-api/
├── .dockerignore              # context exclusions, MUST exist
├── .editorconfig
├── .github/
│   ├── workflows/
│   │   ├── release.yml        # tag-triggered: build + sign + push
│   │   ├── pr.yml             # PR: build (no push), trivy, hadolint
│   │   ├── scan.yml           # weekly Trivy + Grype on latest tag
│   │   └── verify-sigs.yml    # nightly: cosign verify of latest tags
│   └── dependabot.yml         # npm-only; base images via Renovate
├── .hadolint.yaml             # Dockerfile lint rules
├── renovate.json              # base image digest pins + action pins
├── Dockerfile                 # multi-stage, distroless final
├── docker-bake.hcl            # build target definitions
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── src/
│   ├── server.ts              # Hono app entrypoint
│   ├── routes/
│   │   └── health.ts
│   └── lib/
│       └── logger.ts
├── test/
│   └── server.test.ts
├── scripts/
│   ├── build-local.sh         # devbox build (single-arch, --load)
│   ├── verify-sig.sh          # cosign verify wrapper
│   └── healthcheck.sh         # ad-hoc curl /healthz
├── CLAUDE.md
├── AGENTS.md
├── .cursor/
│   └── rules
├── .vscode/
│   ├── extensions.json
│   └── launch.json
├── README.md
├── LICENSE
└── VERSION                    # source of truth for the tag
```

### Naming conventions

| Artifact | Pattern | Example |
|---|---|---|
| Dockerfile stages | `<purpose>` lowercase | `deps`, `builder`, `runtime` |
| Image tags (release) | `vMAJOR.MINOR.PATCH`, `vMAJOR.MINOR`, `vMAJOR`, `latest` | `v1.2.3`, `v1.2`, `v1`, `latest` |
| Image tags (CI / PR) | `pr-<number>-sha-<7chars>` | `pr-42-sha-a1b2c3d` |
| Image tags (digest) | `<image>@sha256:<64hex>` | `ghcr.io/foo/echo-api@sha256:abcd...` |
| Bake targets | snake_case | `default`, `release`, `local_dev` |
| Env files | `.env`, `.env.example` | never commit `.env` |
| Workflow files | `<event>.yml` | `release.yml`, `pr.yml`, `scan.yml` |

### "If you're adding X, it goes in Y"

| Add this | Goes here | Notes |
|---|---|---|
| New build stage | `Dockerfile` (between existing stages) | Update `docker-bake.hcl` `target` if you reference it |
| New build target | `docker-bake.hcl` | Inherits from `_common` |
| Base image bump | `Dockerfile` `FROM` line + Renovate manages digest | Never bump in workflow YAML |
| New scan rule ignore | `.trivyignore` (cve ID per line) | Document why above each line |
| New hadolint rule disable | `.hadolint.yaml` `ignored:` | Document why |
| New runtime env var | `Dockerfile` `ENV` (default) + `docker run -e` (override) | Never `--build-arg` for runtime |
| Build secret | BuildKit `--secret id=...` mounted at `/run/secrets/...` | Never `--build-arg`, never copied into image |
| New registry mirror | `docker-bake.hcl` `tags = [...]` + `release.yml` login + push | Both registries get the same digest |
| Healthcheck command | `Dockerfile` `HEALTHCHECK` instruction | Use distroless's busybox tools only |
| New file copied into image | `COPY --chown=nonroot:nonroot src/X /app/X` | Always specify ownership |
| New label | `LABEL org.opencontainers.image.<key>=<value>` | OCI annotation namespace required |
| Custom platform | `docker-bake.hcl` `platforms` array | Add to `release.yml` matrix if separate runners |
| New Action pin | `.github/workflows/*.yml` action `@<sha256>` | Renovate manages |
| New npm dep | `package.json` (Dependabot manages) | Lockfile must be in commit |
| Migration / data | NOT in image. Use init container or sidecar. | Image is read-only at runtime |

---

## 4. Architecture

### Build-time process boundaries

```
┌────────────────────────────────────────────────────────────────────┐
│  Developer host (macOS / Win / Linux)                              │
│                                                                    │
│  git push ───────────────────► GitHub                              │
│                                  │                                 │
│                                  ▼                                 │
│                          GitHub Actions runner (ubuntu-latest)     │
│                                  │                                 │
│      ┌───────────────────────────┼───────────────────────────┐     │
│      │                           ▼                           │     │
│      │   ┌──── BuildKit (docker-container driver) ──────┐    │     │
│      │   │  builder (cgr.dev/chainguard/node:latest-dev)│    │     │
│      │   │       │                                      │    │     │
│      │   │       ▼                                      │    │     │
│      │   │  pnpm install + tsc → /app/dist              │    │     │
│      │   │       │                                      │    │     │
│      │   │       ▼  COPY --from=builder ...             │    │     │
│      │   │  runtime (cgr.dev/chainguard/node:latest)    │    │     │
│      │   └────────────────────────────────────────────┬─┘    │     │
│      │                                                │      │     │
│      │           OCI manifest list (amd64+arm64)      │      │     │
│      │                                                │      │     │
│      │   ┌── syft ──► SBOM (SPDX-JSON)                │      │     │
│      │   ┌── trivy ─► SARIF + json                    │      │     │
│      │   └── cosign sign (keyless, OIDC token)        │      │     │
│      └────────────┼────────────────────────────────────┼──────┘    │
│                   ▼                                    ▼           │
│          ghcr.io/<owner>/echo-api          docker.io/<owner>/echo-api│
│                   │                                    │           │
│                   └──────────► Sigstore Rekor ◄────────┘           │
│                                (transparency log)                  │
└────────────────────────────────────────────────────────────────────┘
```

### Image runtime boundaries

```
┌──────────────────────────────────────────────┐
│  Container (image: ghcr.io/foo/echo-api:v1)  │
│  user: nonroot (uid 65532)                   │
│  workdir: /app                               │
│  filesystem: read-only except /tmp + /run    │
│  expose: 8080/tcp                            │
│                                              │
│  ┌──────────────────────────────────────┐    │
│  │ /app/dist/server.js  (node 22 PID 1) │    │
│  │   └─ Hono app                        │    │
│  │       ├─ GET /healthz                │    │
│  │       └─ POST /echo                  │    │
│  └──────────────────────────────────────┘    │
│                                              │
│  HEALTHCHECK: wget /healthz every 30s        │
└──────────────────────────────────────────────┘
```

### Request flow

```
client ──HTTP/1.1──► docker daemon (8080) ──► container :8080
                                                    │
                                                    ▼
                                          Hono router
                                                    │
                                            ┌───────┴───────┐
                                            ▼               ▼
                                        /healthz         /echo
                                            │               │
                                            ▼               ▼
                                       200 {ok}      200 echo body
                                                    + log line (pino) → stdout
                                                                          │
                                                                          ▼
                                                                Docker JSON log
                                                                  driver → host
```

### Signing / verification flow

```
release.yml run:
  GitHub OIDC token (id-token: write)
        │
        ▼
  cosign sign --yes <image>@sha256:<digest>
        │
        ├── POST OIDC → Fulcio → short-lived cert
        ├── POST signature + cert → Rekor (transparency log entry)
        └── PUT signature artifact → registry (sha256-<digest>.sig OCI 1.1 referrer)

verify (anyone, anytime):
  cosign verify <image> \
    --certificate-identity-regexp "https://github.com/<owner>/<repo>/.github/workflows/release.yml@refs/tags/v.+" \
    --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
        │
        ├── fetch signature from registry
        ├── verify cert chain to Fulcio root
        ├── verify cert subject = expected workflow
        └── verify Rekor inclusion proof
```

### File-to-responsibility map

| File | Responsibility |
|---|---|
| `Dockerfile` | The single source of truth for image contents. No external scripts copy files in. |
| `docker-bake.hcl` | Multi-target build matrix (`default` for CI, `local` for dev, `release` for tags). |
| `.dockerignore` | What is NOT sent to the build daemon. Mirrors `.gitignore` plus build artifacts. |
| `.hadolint.yaml` | Dockerfile lint rule overrides. |
| `renovate.json` | Renovate digest pin + action update behavior. |
| `.github/workflows/release.yml` | Build + scan + sign + push on tag push. |
| `.github/workflows/pr.yml` | Build + scan + lint on PR (no push). |
| `.github/workflows/scan.yml` | Weekly Trivy + Grype scan on `:latest`. |
| `src/server.ts` | App entrypoint. Logs structured JSON. Listens on 8080. |
| `src/routes/health.ts` | `/healthz` returns 200 always. |

### Where business logic lives, where it does NOT

- **Lives in:** `src/`. TypeScript files compiled to `/app/dist`.
- **Does NOT live in:** `Dockerfile` (no build-time computation), shell scripts inside `RUN`, `ENTRYPOINT` shell wrappers, init containers.

---

## 5. Dev Workflow

### Local dev (no Docker)

```bash
pnpm install
pnpm dev
# Expected: tsx watcher starts; "Listening on http://localhost:8080" in stdout
curl -sf http://localhost:8080/healthz
# Expected: {"ok":true}
```

### Local dev (Docker, single-arch, fast)

```bash
./scripts/build-local.sh
# Internally: docker buildx build --platform linux/amd64 --target runtime --tag echo-api:dev --load .
docker run --rm -p 8080:8080 echo-api:dev
```

### Multi-arch local build (validate CI parity)

```bash
docker buildx bake default
# Builds linux/amd64 + linux/arm64 to local containerd image store.
docker buildx imagetools inspect echo-api:dev
# Expected: Manifests: 2 (one per arch, sha256:...)
```

### Hot reload behavior

- `pnpm dev` (tsx watch) reloads on `src/**/*.ts` change. ~0.4s reload.
- Hot reload **does not** apply inside Docker: rebuild required for changes to image.
- For "edit-then-test inside container" loop, mount source: `docker run --rm -p 8080:8080 -v "$PWD/src:/app/src:ro" echo-api:dev` — but this only helps for non-compiled JS; for TS, run `pnpm dev` outside the container.

### Debugger attach

#### VS Code / Cursor — `.vscode/launch.json` (full file in §15)

- "Run Hono (host)" — `node --inspect=9229 -r tsx/cjs src/server.ts`. Set breakpoints in `src/`.
- "Attach to running container" — `address: localhost`, `port: 9229`. Run container with `-p 9229:9229 -e NODE_OPTIONS=--inspect=0.0.0.0:9229`.

### Inspect at runtime

```bash
# All running containers
docker ps

# Stream logs (JSON)
docker logs -f <container-id> | jq .

# Exec a shell — IMPOSSIBLE in distroless (no /bin/sh).
# Workaround: run a debug image alongside:
docker run --rm -it --network container:<container-id> cgr.dev/chainguard/wolfi-base sh
# Then: curl localhost:8080/healthz, etc.

# Inspect image filesystem without running:
docker run --rm -it --entrypoint="" cgr.dev/chainguard/wolfi-base sh
# Or use `dive`: brew install dive && dive ghcr.io/foo/echo-api:v1
```

### Pre-commit checks (`./scripts/precommit.sh`)

```bash
#!/usr/bin/env bash
set -euo pipefail
pnpm install --frozen-lockfile
pnpm run typecheck
pnpm run lint
pnpm run test
hadolint Dockerfile
docker buildx bake default --print > /dev/null   # validate bake.hcl
```

### Branch + commit conventions

- Branch: `feat/<slug>`, `fix/<slug>`, `chore/<slug>`, `deps/renovate/*`.
- Commit: Conventional Commits. `feat:`, `fix:`, `chore(deps):`, `ci:`, `docs:`.
- Tag: `v<MAJOR>.<MINOR>.<PATCH>`. `v0.x` = pre-1.0; breaking changes allowed in minor.
- Tags trigger `release.yml`. **Tag must be on `main` after PR merge**, never on a feature branch.

---

## 6. Testing & Parallelization

### Unit tests

- Runner: **Node 22 built-in test runner** (`node --test`).
- Location: `test/**/*.test.ts`.
- Naming: `<file-under-test>.test.ts`.

```bash
pnpm test
# Expected:
# ▶ tests 7
# ▶ pass 7
# ▶ fail 0
# ▶ duration_ms 412
```

### Integration tests

- The container itself IS the integration boundary.
- After `docker buildx build --load`, run:
  ```bash
  CID=$(docker run -d -p 8080:8080 echo-api:dev)
  trap "docker stop $CID" EXIT
  sleep 1
  curl -sf http://localhost:8080/healthz | jq -e '.ok == true'
  ```
- Lives in `test/integration/*.sh`. Run via `pnpm test:integration`.

### E2E

- For an HTTP service this thin, no separate E2E framework is warranted; the integration script IS E2E. If the project grows multi-service, switch to **Testcontainers for Node 10.x**.

### Single test, file, watch

```bash
node --test test/server.test.ts                # one file
node --test --test-name-pattern="health" test/  # one test
node --test --watch test/                      # watch mode
```

### Mocking rules

| Subject | Rule |
|---|---|
| Database | NEVER mock. Use a real ephemeral container. |
| Network egress to internal services | Mock at the adapter boundary (one wrapper module). |
| File system | NEVER mock. Use `os.tmpdir()` + cleanup. |
| Time | Mock via `node:test` timer mocks (`mock.timers.enable()`). |
| Random | Inject a seed; never mock `Math.random` globally. |
| The image itself | NEVER mock. Build a tiny variant if you need to test failure modes. |

### Coverage

- Built-in `node --test --experimental-test-coverage`. Target: **≥80% lines on `src/`**.
- Below threshold = CI red.

```bash
node --test --experimental-test-coverage test/
# Expected tail:
# all files          | ... | 84.21
```

### Visual regression

- N/A for a JSON API. If the project gains a UI, add Playwright + Chromatic.

### Parallelization patterns for AI agents

| Safe to fan out as parallel subagents | Must be sequential |
|---|---|
| Add a new route in `src/routes/*` (each route = own file) | Modifying `package.json` (single file, lockfile contention) |
| Add a new test in `test/*` | Modifying `Dockerfile` |
| Update `README.md`, `CHANGELOG.md` | Modifying `pnpm-lock.yaml` |
| Add a new label to `Dockerfile` (1 line each) | Bumping a base image (involves digest discovery) |
| Generate SBOM in different formats from same image | Pushing to two registries with same tag (sequential is safer) |
| Write integration tests for separate endpoints | Renovate config changes (re-runs whole bot) |

---

## 7. Logging

### Logger setup

- **pino 9.5.0** — JSON-only, fast, drop-in for Hono.

```ts
// src/lib/logger.ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'echo-api',
    version: process.env.APP_VERSION ?? 'dev',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level: (label) => ({ level: label }),
  },
});
```

### Log levels

| Level | When |
|---|---|
| `trace` | Wire-level, never enable in prod |
| `debug` | Local dev / smoke; reveals internal branch decisions |
| `info` | Boot, request in/out, scheduled events |
| `warn` | Recoverable anomaly (retry succeeded, fallback used) |
| `error` | Request failed, dependency unreachable |
| `fatal` | Process must exit; followed by `process.exit(1)` |

### Required fields

Every log line MUST include: `time`, `level`, `service`, `version`, `event`, `request_id` (when in request context), `module`.

### Sample log lines

```json
{"time":"2026-04-27T18:00:00.000Z","level":"info","service":"echo-api","version":"v1.2.3","event":"boot","module":"server","port":8080}
{"time":"2026-04-27T18:00:01.123Z","level":"info","service":"echo-api","version":"v1.2.3","event":"request_in","request_id":"01HX...","module":"http","method":"GET","path":"/healthz"}
{"time":"2026-04-27T18:00:01.124Z","level":"info","service":"echo-api","version":"v1.2.3","event":"request_out","request_id":"01HX...","module":"http","status":200,"duration_ms":1}
{"time":"2026-04-27T18:00:02.500Z","level":"warn","service":"echo-api","version":"v1.2.3","event":"slow_request","request_id":"01HX...","module":"http","duration_ms":1480}
{"time":"2026-04-27T18:00:03.000Z","level":"error","service":"echo-api","version":"v1.2.3","event":"echo_validation_failed","request_id":"01HX...","module":"echo","reason":"body_too_large"}
```

### Where logs go

| Env | Sink |
|---|---|
| Local dev (`pnpm dev`) | stdout, pretty-printed via `pino-pretty` |
| Container (any) | stdout (Docker captures via JSON log driver) |
| Prod (orchestrator's job) | Whichever the deployer wires (CloudWatch, Loki, Axiom). Image is sink-agnostic. |

### Grep locally

```bash
docker logs -f <cid> | jq 'select(.level == "error")'
docker logs <cid> | jq 'select(.event == "request_out" and .duration_ms > 1000)'
docker logs <cid> | jq -r 'select(.request_id == "01HX...") | "\(.time) \(.event)"'
```

---

## 8. AI Rules

### 8.1 ALWAYS

1. Always pin the base image to a digest, not a tag. Format: `FROM cgr.dev/chainguard/node:latest@sha256:<64hex> AS runtime`. Renovate manages bumps.
2. Always use multi-stage builds. Builder stage gets `:latest-dev`; final stage gets `:latest` (distroless).
3. Always set `WORKDIR /app` BEFORE the first `COPY` so file ownership and relative paths are predictable.
4. Always pass `--platform=$BUILDPLATFORM` on the builder stage `FROM` to keep build-time tooling on the host arch (faster than emulating).
5. Always run as non-root in the final stage: `USER nonroot:nonroot`. Never `USER root`. Never omit it (Docker default is root).
6. Always copy artifacts with `--chown=nonroot:nonroot` on the COPY into the final image.
7. Always include a `HEALTHCHECK` instruction that exercises a real endpoint (`/healthz`).
8. Always include the OCI annotations: `org.opencontainers.image.source`, `.revision`, `.version`, `.licenses`, `.title`, `.description`. metadata-action emits these in CI.
9. Always run `hadolint Dockerfile` before committing. CI fails red on any warning.
10. Always run `trivy image --severity HIGH,CRITICAL --exit-code 1 <image>` before pushing in CI.
11. Always sign with `cosign sign --yes <registry>/<image>@sha256:<digest>` (keyless, OIDC). Sign the digest, never the tag.
12. Always attach the SBOM as an attestation: `cosign attest --predicate sbom.spdx.json --type spdxjson --yes <image>@<digest>`.
13. Always pass `--provenance=mode=max` and `--sbom=true` to buildx so OCI 1.1 attestations land in the registry alongside the image.
14. Always push the same digest to both GHCR and Docker Hub (use `tags` array in `docker-bake.hcl` so one build = both registries).
15. Always tag with the floating tags (`v1`, `v1.2`, `latest`) AND the immutable tag (`v1.2.3`, `sha-<7chars>`). Consumers who care pin to digest.
16. Always run `pnpm install --frozen-lockfile` (never `--no-frozen-lockfile`) inside the builder stage.
17. Always use BuildKit secrets (`RUN --mount=type=secret,id=npm,target=/root/.npmrc`) for credentials. Never `--build-arg`.
18. Always set `TINI_SUBREAPER=1` if you spawn child processes; for a single-process Hono app, ignore tini and use `CMD ["dist/server.js"]` directly.
19. Always commit `.dockerignore` and verify it excludes `node_modules`, `.git`, `*.md` (except `LICENSE`), `.github/`, `test/`, `.env*`.
20. Always re-run `cosign verify` (with `--certificate-identity-regexp` matching your release workflow) before deploying anywhere.
21. Always use `docker buildx imagetools inspect <image>` to confirm the manifest list is multi-arch BEFORE marking a release done.
22. Always set `LABEL org.opencontainers.image.source="https://github.com/<owner>/<repo>"` so GHCR auto-links the package to the repo (UI feature + auto-private-when-repo-private).

### 8.2 NEVER

1. Never run as root in the final image. `USER nonroot:nonroot` is mandatory.
2. Never use `latest` as a base image tag without a digest pin. (`FROM node:22` alone is banned.)
3. Never put secrets in `--build-arg`. Build args are baked into image history and `docker history` reveals them.
4. Never `COPY .` blindly. Either `COPY package.json pnpm-lock.yaml ./` first then `COPY src ./src`, or trust a hardened `.dockerignore`.
5. Never install dev dependencies in the runtime stage. Use `pnpm install --prod` or copy only `node_modules/.pnpm/...` referenced by production deps.
6. Never bake a node_modules folder from the host into the image (e.g. `COPY node_modules`). Always `pnpm install` inside the builder stage on the target arch.
7. Never use `apt-get install` without `--no-install-recommends && rm -rf /var/lib/apt/lists/*`. Distroless avoids this entirely.
8. Never publish without scanning. Trivy + Grype must be green (or explicitly allowlisted with justification).
9. Never sign the tag. Tags are mutable. Sign `image@sha256:<digest>`.
10. Never hand-edit `pnpm-lock.yaml`.
11. Never enable Docker `experimental` features in the daemon for this project; everything we use is GA in Engine 29.
12. Never use Docker Compose `version:` field — it's deprecated and ignored since Compose v2.
13. Never expose ports below 1024 inside the container (would require root). Use 8080.
14. Never write to the rootfs at runtime. Mount a `tmpfs` for `/tmp` if needed; everything else is read-only.
15. Never use `ADD` for local files; use `COPY`. `ADD` only for tarballs and remote URLs (and we don't need either).
16. Never build amd64 only on Apple Silicon and forget to add `--platform`. Manifest will be arm64 surprise on release.
17. Never push to `latest` from a feature branch or PR build.
18. Never delete or overwrite a published tag. (GHCR allows it; Docker Hub allows it; both are bad ideas.)

### 8.3 Blast Radius Reference

| Path | Blast | Verify |
|---|---|---|
| `Dockerfile` | every build, every layer cache, every consumer | `hadolint Dockerfile && docker buildx bake default` |
| `docker-bake.hcl` | CI build matrix, local build, release build | `docker buildx bake default --print` |
| `.dockerignore` | every build context size, layer hashes | `docker build --no-cache -t ctx-test .` then `docker image inspect ctx-test --format '{{.Size}}'` |
| `package.json` | dependency surface, image size, CVE surface | `pnpm install --frozen-lockfile && pnpm test` |
| `pnpm-lock.yaml` | every build's reproducibility | `pnpm install --frozen-lockfile` (must succeed without changes) |
| `tsconfig.json` | typecheck, build output shape | `pnpm tsc -p tsconfig.json --noEmit` |
| `src/server.ts` | runtime entrypoint behavior | `pnpm test && pnpm dev` then curl /healthz |
| `.github/workflows/release.yml` | every published image, every signature | manually `gh workflow run release.yml -r v0.0.1-test` and verify outputs |
| `.github/workflows/pr.yml` | every PR's gate | open a no-op PR and confirm green checks |
| `.github/workflows/scan.yml` | weekly drift detection | `gh workflow run scan.yml` |
| `.hadolint.yaml` | which Dockerfile lint warnings fire | `hadolint Dockerfile` |
| `renovate.json` | base image bump cadence, PR noise | dry-run: https://developer.mend.io/github/<owner>/<repo> |
| `.github/dependabot.yml` | npm-only update PRs | wait for next schedule, inspect PR |
| `VERSION` file | release tag value | `cat VERSION; git tag -l "v$(cat VERSION)"` |
| Base image (`FROM ...`) | every byte in final image | rebuild from scratch, run trivy, run integration test |
| `USER` directive | every fs access at runtime | `docker run --rm <img> sh -c 'id'` (won't work in distroless; use a `cgr.dev/chainguard/wolfi-base` debug sidecar) |
| `EXPOSE` directive | metadata only; orchestrators read it | `docker inspect <img> --format '{{.Config.ExposedPorts}}'` |
| `HEALTHCHECK` directive | docker daemon's auto-restart logic, k8s liveness compat | `docker inspect --format '{{.State.Health.Status}}' <cid>` after 30s |
| `CMD` / `ENTRYPOINT` | what runs at PID 1, signal handling | `docker run --rm <img>` (must exit cleanly on Ctrl+C) |
| `ENV` directives | runtime config defaults | `docker run --rm <img> env` (won't work in distroless; inspect via `docker image inspect`) |
| `LABEL org.opencontainers.image.source` | GHCR auto-links package to repo, follows repo visibility | `docker image inspect <img> | jq '.[0].Config.Labels'` |
| `tags` in `docker-bake.hcl` | which registries receive the push | `docker buildx imagetools inspect <full-tag>` |
| Cosign signature artifact | downstream verifiers' trust path | `cosign verify ... <image>@<digest>` |

### 8.4 Definition of Done (per task type)

#### Bug fix
- [ ] Failing test added FIRST that reproduces the bug.
- [ ] Fix applied; test now passes.
- [ ] `pnpm typecheck && pnpm lint && pnpm test` green.
- [ ] `hadolint Dockerfile` green if Dockerfile changed.
- [ ] `docker buildx bake default` builds without error.
- [ ] If runtime behavior changed: integration test (`scripts/integration.sh`) passes.
- [ ] Conventional commit: `fix: <scope>: <subject>` ≤72 chars subject.

#### New feature
- [ ] All bug-fix items above.
- [ ] Public surface (new endpoint, new env var) documented in `README.md`.
- [ ] If a new label, env var, port, or healthcheck added: `Dockerfile` updated AND OCI annotation set.
- [ ] If new dependency: `pnpm-lock.yaml` committed; `pnpm audit --prod` shows no high/critical.

#### Refactor
- [ ] Tests unchanged (or strengthened, never weakened).
- [ ] No new public surface.
- [ ] Image digest may change but image SIZE must not increase by >5% without justification noted in PR.

#### Dependency bump
- [ ] Renovate or Dependabot PR (do not bump by hand without one).
- [ ] CI green including Trivy.
- [ ] If base image: `docker buildx imagetools inspect` shows expected new digest; image size diff noted.
- [ ] No banned phrases; PR body cites the upstream changelog.

#### Schema change
- N/A for stateless image. If you find yourself adding state, the answer is: "this image stays stateless; mount a volume / use a real database; the image does not change."

#### Copy change (README, labels, descriptions)
- [ ] Markdown lints clean.
- [ ] `LABEL org.opencontainers.image.description` updated if user-visible copy changed.
- [ ] No image rebuild needed unless a `LABEL` was edited.

### 8.5 Self-Verification Recipe

The exact sequence the AI runs before claiming done:

```bash
# 1. Install
pnpm install --frozen-lockfile
# Expected: "Lockfile is up to date" + "Done in <Ns>"

# 2. Typecheck
pnpm tsc -p tsconfig.json --noEmit
# Expected: (no output) + exit 0

# 3. Lint code
pnpm lint
# Expected: "Checked N files" + 0 problems

# 4. Lint Dockerfile
hadolint Dockerfile
# Expected: (no output) + exit 0

# 5. Unit tests
pnpm test
# Expected: tests N / pass N / fail 0

# 6. Validate bake plan
docker buildx bake default --print
# Expected: a JSON object with "target" object including "default"

# 7. Multi-arch build (no push, no load)
docker buildx bake default --set "*.output=type=cacheonly"
# Expected: "[+] Building ... FINISHED" + 0 errors, 2 platforms

# 8. Single-arch local build (loadable)
docker buildx build --platform "linux/$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')" --tag echo-api:verify --load .
# Expected: image loaded; `docker images echo-api:verify` shows it.

# 9. Integration smoke
CID=$(docker run -d -p 8080:8080 echo-api:verify) ; sleep 2
curl -sf http://localhost:8080/healthz | jq -e '.ok == true'
docker stop "$CID" >/dev/null
# Expected: jq -e exit 0 (i.e. {"ok":true})

# 10. Trivy scan
trivy image --severity HIGH,CRITICAL --exit-code 1 echo-api:verify
# Expected: "Total: 0 (HIGH: 0, CRITICAL: 0)"

# 11. Hadolint clean (re-run)
hadolint Dockerfile
# Expected: silent

# 12. SBOM generation (sanity)
syft echo-api:verify -o spdx-json > /tmp/sbom.json && jq -e '.packages | length > 0' /tmp/sbom.json
# Expected: integer > 0
```

Every step must exit 0 and the printed expected output must match. Anything else → not done.

### 8.6 Parallelization Patterns

**Safe parallel:**
- Adding three independent routes in `src/routes/{a,b,c}.ts` simultaneously.
- Generating SBOM in three formats (`spdx-json`, `cyclonedx-json`, `syft-table`) from the same image.
- Trivy scan + Grype scan + hadolint (read-only, distinct outputs).
- Running tests on different test files via `node --test test/file-a.test.ts` & `node --test test/file-b.test.ts` (no shared state).

**Unsafe / must be sequential:**
- Anything writing `package.json` or `pnpm-lock.yaml`.
- Anything bumping the `FROM` line (digest discovery requires a single source of truth).
- `docker buildx bake` with `--load` from two terminals targeting the same tag (image store contention).
- Pushing two different artifacts to the same `<image>:<tag>` (last write wins).
- `cosign sign` and `cosign attest` against the same digest in parallel — Rekor entries serialize fine, but Sigstore rate-limits make this slower than serial.

---

## 9. Stack-Specific Pitfalls

1. **Apple Silicon QEMU OOM during `pnpm install` for amd64.**
   - Symptom: `signal: killed` halfway through install of a large transitive dep tree.
   - Cause: QEMU emulating amd64 on arm64 is memory-hungry.
   - Fix: enable Rosetta in Docker Desktop → Settings → General. Or run the amd64 build in CI only and only build native arch locally.
   - Detect early: `docker buildx inspect | grep Driver` should mention `docker-container`; check Docker Desktop "Use Rosetta" is checked on Apple hardware.

2. **`--load` + multi-platform fails on legacy Docker image store.**
   - Symptom: `ERROR: docker exporter does not currently support exporting manifest lists`.
   - Cause: Default image store (overlay2 without containerd) only supports single-platform `--load`.
   - Fix: enable containerd image store. Engine 29 default; older: `daemon.json` with `{"features":{"containerd-snapshotter":true}}` and `systemctl restart docker`.
   - Detect early: `docker info | grep -E 'storage driver|containerd'`.

3. **`COPY` before `WORKDIR` causes wrong path.**
   - Symptom: `not found: /app/dist/server.js` even though build succeeded.
   - Cause: `COPY src ./src` runs in `/`, not `/app`, when WORKDIR is set later.
   - Fix: `WORKDIR /app` is the FIRST instruction after `FROM`. Always.
   - Detect early: hadolint rule DL3043.

4. **Running as root is the default, silently.**
   - Symptom: container works fine, but a security scanner flags "user is root."
   - Cause: missing `USER` directive; Docker runs UID 0.
   - Fix: always end final stage with `USER nonroot:nonroot`.
   - Detect early: `docker inspect <image> --format '{{.Config.User}}'` must be non-empty.

5. **Build secrets leaked via `--build-arg`.**
   - Symptom: `docker history --no-trunc <image>` reveals `NPM_TOKEN=npm_xxx`.
   - Cause: `ARG NPM_TOKEN` + `RUN echo "$NPM_TOKEN" > .npmrc` bakes the value into the layer.
   - Fix: use BuildKit secrets: `RUN --mount=type=secret,id=npm,target=/root/.npmrc pnpm install`.
   - Detect early: `docker history --no-trunc <image> | grep -i token` returns nothing.

6. **No `HEALTHCHECK` → orchestrator never restarts a wedged container.**
   - Symptom: container "running" but `/healthz` returns 500 forever; k8s never restarts.
   - Cause: missing `HEALTHCHECK`; or k8s probe not configured separately.
   - Fix: add `HEALTHCHECK CMD wget -qO- http://localhost:8080/healthz || exit 1` to the Dockerfile AND configure liveness/readiness in k8s.
   - Detect early: `docker inspect --format '{{.Config.Healthcheck}}' <image>` must be non-nil.

7. **Forgetting `--provenance` + `--sbom` on buildx → registries lack supply-chain metadata.**
   - Symptom: `docker buildx imagetools inspect ... --format '{{json .SBOM}}'` is empty.
   - Cause: BuildKit only emits attestations when explicitly asked.
   - Fix: in `docker-bake.hcl`, set `attest = ["type=provenance,mode=max", "type=sbom"]`.
   - Detect early: `cosign tree <image>` shows zero referenced artifacts.

8. **Building amd64-only on Apple Silicon and pushing as `:latest`.**
   - Symptom: x86 servers pull and run, but ARM users get `exec format error`.
   - Cause: forgot `--platform`; Docker default = host arch.
   - Fix: bake.hcl pins `platforms = ["linux/amd64", "linux/arm64"]`.
   - Detect early: `docker buildx imagetools inspect <image>` must show 2+ Manifests.

9. **`node_modules` from host leaks into image.**
   - Symptom: image is 800 MB instead of 80 MB; native modules built for wrong arch crash at start.
   - Cause: `.dockerignore` missing `node_modules`.
   - Fix: ensure `.dockerignore` lists `node_modules` and `.pnpm-store`.
   - Detect early: `docker image inspect <image> --format '{{.Size}}'` is suspiciously large.

10. **Distroless image has no shell, scripts that `RUN sh -c '...'` break.**
    - Symptom: `OCI runtime exec failed: exec: "/bin/sh": stat /bin/sh: no such file or directory`.
    - Cause: putting shell-form `CMD echo hi` in a distroless final image.
    - Fix: use exec-form: `CMD ["dist/server.js"]`. For build-time logic, do it in the builder stage.
    - Detect early: hadolint rule DL3025 (use exec form for CMD).

11. **`HEALTHCHECK` uses `curl`, but distroless ships only `wget`.**
    - Symptom: healthcheck always reports unhealthy; logs say `curl: not found`.
    - Cause: assuming curl exists.
    - Fix: use `wget -qO- http://localhost:8080/healthz` (busybox-wget ships with chainguard distroless).
    - Detect early: `docker run --rm --entrypoint="" <image> wget --version` should succeed.

12. **Tag mutation: `:v1.0.0` re-pushed with new content.**
    - Symptom: customers report "image we tested is not what we deployed."
    - Cause: someone re-tagged and re-pushed `v1.0.0` after the original release.
    - Fix: pin to digest in production. Set GHCR/Hub to "immutable tags" if available; if not, treat tags as advisory and digests as authoritative.
    - Detect early: `cosign verify` with the original digest fails after mutation.

13. **`pnpm install` in builder runs as root, then `USER nonroot` in runtime can't read `/app/node_modules`.**
    - Symptom: `Error: EACCES: permission denied, open '/app/node_modules/...'`.
    - Cause: COPY-from-builder preserves builder's root ownership.
    - Fix: `COPY --from=builder --chown=nonroot:nonroot /build/node_modules /app/node_modules`.
    - Detect early: `docker run --rm <image> ls -la /app/node_modules` (won't work in distroless; inspect with `dive`).

14. **`pnpm fetch` cache layer invalidates on every package.json edit.**
    - Symptom: every PR rebuilds all node_modules from scratch.
    - Cause: cache key includes `package.json` content.
    - Fix: use `RUN --mount=type=bind,source=package.json,target=package.json --mount=type=bind,source=pnpm-lock.yaml,target=pnpm-lock.yaml --mount=type=cache,id=pnpm,target=/pnpm/store pnpm install --frozen-lockfile`.
    - Detect early: time builds; lock-only changes should be <30s.

15. **Renovate's `docker:pinDigests` not enabled, so base image floats invisibly.**
    - Symptom: Friday's build differs from Monday's even with no commits.
    - Cause: `FROM cgr.dev/chainguard/node:latest` without digest.
    - Fix: add `"docker:pinDigests"` to `renovate.json` extends; commit the resulting digest-pinned `FROM`.
    - Detect early: `grep -E '^FROM .+@sha256' Dockerfile` must match every FROM line.

16. **Cosign verify fails because signature was made against a different digest.**
    - Symptom: `cosign verify ... --certificate-identity-regexp ...` errors with "no matching signatures."
    - Cause: signed `image@<old-digest>`, then rebuilt → new digest, signature still points at old.
    - Fix: always re-sign on every push. The release workflow does this automatically; manual pushes lose the sig.
    - Detect early: `cosign tree <image>:<tag>` should list one signature for the manifest list AND one per-arch (per OCI 1.1 referrer).

17. **`docker/login-action` token has wrong scopes.**
    - Symptom: `unauthorized: failed to authorize: failed to fetch oauth token`.
    - Cause: GITHUB_TOKEN lacks `packages: write`; or PAT lacks `write:packages`.
    - Fix: in workflow YAML, add `permissions: { packages: write, id-token: write, contents: read }`.
    - Detect early: a no-op `docker pull ghcr.io/<owner>/<image>:dev` from CI succeeds but push fails.

18. **`HEALTHCHECK` runs `curl localhost` at boot but server isn't up yet → unhealthy then healthy thrash.**
    - Symptom: orchestrator restart loop.
    - Cause: missing `--start-period`.
    - Fix: `HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 CMD ...`.
    - Detect early: `docker inspect --format '{{.State.Health}}' <cid>` shows multiple `unhealthy` early.

19. **GHCR package "private" by default; downstream pulls fail with 401.**
    - Symptom: `docker pull ghcr.io/foo/echo-api:v1` returns "unauthorized" for the public.
    - Cause: GHCR creates package as private; you must change visibility.
    - Fix: GitHub UI → repository → Packages → echo-api → Settings → "Change visibility" → Public. OR set `LABEL org.opencontainers.image.source` so GHCR auto-links to the repo and inherits its visibility on first push.
    - Detect early: `curl -fsSI https://ghcr.io/v2/<owner>/<image>/manifests/v1` from a logged-out shell.

20. **Trivy DB out of date in CI cache.**
    - Symptom: scan misses a recent CVE that's already in upstream advisories.
    - Cause: cached `~/.cache/trivy/db` from days ago.
    - Fix: `trivy --download-db-only` first, OR pass `--ignore-unfixed --skip-db-update=false` (default).
    - Detect early: `trivy --version` prints DB date; if >24h old, refresh.

---

## 10. Performance Budgets

| Budget | Target | How to measure |
|---|---|---|
| Image size (compressed) | ≤ 80 MB per arch | `docker manifest inspect <image>:<tag>` then sum `size` per layer |
| Image size (uncompressed) | ≤ 220 MB per arch | `docker image inspect <image> --format '{{.Size}}'` |
| Build time (cold, single arch, CI) | ≤ 4 min | GitHub Actions step duration |
| Build time (warm, single arch) | ≤ 60 s | same |
| Build time (multi-arch cold) | ≤ 8 min | same |
| Cold start (container start to first 200) | ≤ 800 ms on 1 vCPU | `time (docker run -d ... && wait-for-200)` |
| Memory at idle | ≤ 90 MB RSS | `docker stats --no-stream <cid>` |
| Layers count | ≤ 12 | `docker history <image> | wc -l` |
| Number of HIGH/CRITICAL CVEs | 0 | `trivy image --severity HIGH,CRITICAL --exit-code 1` |

### What to do when over budget

- Image size: switch from `chainguard/node:latest-dev` to multi-stage with distroless final; remove dev deps with `pnpm install --prod` in a dedicated stage; use `--mount=type=cache` for pnpm store (cache lives outside layers).
- Build time: enable GHA cache exporter; ensure `COPY package.json pnpm-lock.yaml` is in its own layer ABOVE `COPY src`.
- Cold start: trim transitive deps; consider Bun if Node startup becomes the bottleneck.
- CVEs: `renovate` already auto-PRs base bumps; for a stale runtime, `--pull` and rebuild.

---

## 11. Security

### Secret storage

- Build-time secrets: BuildKit `--secret id=<name>` flag, value in `$(cat /tmp/file)` or stdin.
- Runtime secrets: `docker run --env-file <(some-vault get)` or k8s `Secret` mounted as env / file.
- Never put: API keys, tokens, private keys, DB URLs in `Dockerfile`, `--build-arg`, or `LABEL`.

### Auth threat model

- The image runs as `nonroot` (UID 65532). It can read its own `/app/dist`, write only to `/tmp` (if mounted tmpfs) and `/run`.
- The container does not need network egress to function; if your app calls outward, document the egress allowlist in `README.md`.
- Anyone who can `docker push` to your tag can poison consumers. Only CI (via GitHub OIDC) should push prod tags. Branch-protect `main`; require signed commits if you can.

### Input validation boundary

- All HTTP input goes through Hono's typed handlers. Validate body with `zod` (or equivalent) at the route boundary; reject unknown fields.
- Output: never echo raw user input into JSON without escaping; for error responses, return shape `{"error":"...","code":"..."}` with no stack.

### Permissions / capabilities

- The image declares no explicit Linux capabilities. Run with `--cap-drop=ALL --security-opt=no-new-privileges:true` at the orchestrator level.
- Read-only rootfs at runtime: `docker run --read-only --tmpfs /tmp ...` works because the image writes nothing during normal operation.

### Dependency audit

```bash
# npm side (Dependabot also handles automatically)
pnpm audit --prod --audit-level=high

# Image side (in CI)
trivy image --severity HIGH,CRITICAL --exit-code 1 <image>
grype <image> --fail-on high
```

Cadence: **on every push** for Trivy in CI; **weekly** for Grype + Trivy in `scan.yml`.

### Top 5 risks (this stack)

1. **Compromised CI step** publishes a tag. Mitigation: cosign keyless OIDC means signature ties image to the exact GitHub workflow + ref. A tampered image cannot fake the OIDC subject.
2. **Base image upstream compromise** (e.g., the Trivy 2026-03 incident). Mitigation: pin to digest; weekly scan.yml against an independent DB (Grype) flags drift.
3. **Build secret leak via `docker history`**. Mitigation: BuildKit secrets, never `--build-arg`. Verified by `docker history --no-trunc <image> | grep -iE 'token|secret|key' || echo OK`.
4. **Tag mutation by attacker with leaked Docker Hub token**. Mitigation: prefer GHCR (uses GitHub OIDC, no long-lived token); on Docker Hub, use access tokens scoped to the single repo and rotate quarterly.
5. **Supply chain via npm dep**. Mitigation: `pnpm audit` in CI; SBOM published; consumers can `cosign verify-attestation --type spdxjson` and run their own diff vs. the previous release.

---

## 12. Deploy

### Release flow (command-by-command)

The release IS the workflow. Manual fallback:

```bash
# 1. Confirm clean tree on main
git checkout main
git pull --ff-only

# 2. Bump version
echo "1.2.3" > VERSION
pnpm version 1.2.3 --no-git-tag-version
git add VERSION package.json
git commit -m "chore(release): v1.2.3"

# 3. Tag
git tag -a v1.2.3 -m "release v1.2.3"
git push origin main
git push origin v1.2.3

# 4. CI takes over (release.yml triggered by tag).
# Monitor:
gh run watch
# Expected steps to all turn green:
#   ✓ Setup QEMU
#   ✓ Setup Buildx
#   ✓ Login to GHCR
#   ✓ Login to Docker Hub
#   ✓ Lint Dockerfile
#   ✓ Build & push (bake)
#   ✓ Trivy scan
#   ✓ Generate SBOM (syft)
#   ✓ Sign image (cosign keyless)
#   ✓ Attest SBOM
#   ✓ Smoke test pulled image

# 5. Verify (anywhere)
cosign verify ghcr.io/<owner>/echo-api:v1.2.3 \
  --certificate-identity-regexp "https://github.com/<owner>/<repo>/.github/workflows/release.yml@refs/tags/v.+" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"

docker buildx imagetools inspect ghcr.io/<owner>/echo-api:v1.2.3
# Expected: Manifests: 2 (linux/amd64, linux/arm64) + Attestations: provenance + sbom
```

### Staging vs prod

- This rulebook publishes ONE image. Staging = `:latest` (head of main). Prod = `vX.Y.Z` semver tag.
- Prod consumers pin to digest (`@sha256:...`), not tag.
- For a true staging environment, push a separate tag from a `staging` branch in a follow-up workflow; out of scope for this rulebook.

### Rollback

```bash
# Roll a consumer back to the previous version:
docker pull ghcr.io/<owner>/echo-api:v1.2.2
# or pin by digest in your deployment manifest.

# To "unpublish" v1.2.3 (DANGEROUS — DO NOT delete from registry; instead, push v1.2.4 = v1.2.2 contents):
git revert <release-commit>
# bump VERSION to 1.2.4 → tag → push → CI publishes 1.2.4 = old code.
```

Max safe rollback window: **infinite** (digests are immutable). But consumers pinned to `:v1` get the next floating-tag-update, which CI updates on every `vX.Y.Z` push.

### Health check / smoke

```bash
# Pull and smoke (any consumer, anywhere)
docker run --rm -d -p 8080:8080 --name smoke ghcr.io/<owner>/echo-api:v1.2.3
sleep 2
curl -fsS http://localhost:8080/healthz | jq -e '.ok == true'
docker stop smoke
# Exit 0 = green.
```

### Versioning scheme

- Source of truth: **`VERSION` file** (one line, `MAJOR.MINOR.PATCH`).
- Mirrored in: `package.json` `version`, git tag `v<value>`, image tags `v<value>`, `LABEL org.opencontainers.image.version=<value>`.
- Bump rules: **SemVer 2.0.0**. Removing a route, changing healthcheck path, or changing the runtime user is MAJOR.

### Auto-update

| Channel | Tool | Cadence |
|---|---|---|
| Base image (`FROM`) | Renovate, `docker:pinDigests` | Daily polling |
| GitHub Actions versions | Renovate, `helpers:pinGitHubActionDigests` | Daily |
| npm deps | Dependabot | Weekly |
| Trivy DB | Trivy itself (auto on each run) | Per CI run |
| Sigstore root | bundled in cosign 3.x | Per cosign release |

### DNS / domain

- N/A — image artifact, not a hosted service. Consumers pull from `ghcr.io/<owner>/echo-api` or `docker.io/<owner>/echo-api`.

### Cost per 1k MAU

| Item | Cost |
|---|---|
| GHCR storage | $0 (free for public images, included with paid plans for private) |
| GHCR egress | $0 (unmetered) |
| Docker Hub | $0 for unlimited public pulls (anonymous limit applies to pullers, not publisher) |
| GitHub Actions minutes | ~3 min build × monthly tag pushes = trivial. ubuntu-latest = $0.008/min on private repos; free on public. |
| Sigstore (Fulcio + Rekor) | $0 (public good) |
| Renovate (cloud app) | $0 (free for OSS, generous for private) |
| Total | **$0–$2 / month** for a typical solo project |

---

## 13. Claude Code Integration

### `CLAUDE.md` (paste this at repo root)

```markdown
# CLAUDE.md — echo-api

This project is a published Docker image. The full rulebook is `docker-image.md` in the repo root (or vendored from /opt/Loopa/rulebooks/docker-image.md).

## Hard rules

- ALWAYS read `docker-image.md` Sections 8.1 and 8.2 before any change to `Dockerfile`, `docker-bake.hcl`, or `.github/workflows/*`.
- Run the full Self-Verification Recipe (§8.5) before claiming a task done.
- Pin every base image to a digest. Renovate manages bumps — never hand-edit a digest.
- Never run as root in the final image. `USER nonroot:nonroot` is mandatory.
- Never put secrets in `--build-arg`. Use BuildKit `--secret`.
- Never push from a feature branch. Releases are tag-triggered on `main`.

## Common commands

| Task | Command |
|---|---|
| Install | `pnpm install --frozen-lockfile` |
| Typecheck | `pnpm tsc -p tsconfig.json --noEmit` |
| Lint code | `pnpm lint` |
| Lint Dockerfile | `hadolint Dockerfile` |
| Test | `pnpm test` |
| Local single-arch build | `./scripts/build-local.sh` |
| Multi-arch build (no push) | `docker buildx bake default` |
| Trivy scan | `trivy image --severity HIGH,CRITICAL --exit-code 1 echo-api:dev` |
| SBOM | `syft echo-api:dev -o spdx-json` |
| Verify a published signature | `./scripts/verify-sig.sh ghcr.io/<owner>/echo-api:vX.Y.Z` |
| Cut a release | `echo "X.Y.Z" > VERSION && git commit -am "release: vX.Y.Z" && git tag vX.Y.Z && git push --tags` |

## Banned phrases

Do not use any of: "depending on", "either... or", "you could", "consider using", "feel free to", "best practices suggest".

## Skills to invoke

- Before any non-trivial change: `/test-driven-development`.
- When debugging a build: `/systematic-debugging`.
- Before claiming done: `/verification-before-completion`.
- Before tagging: `/ship`.
- For production deploys / verifying live signatures: `/careful`.

## Where things go

- `Dockerfile` — image definition. Multi-stage. Builder = `chainguard/node:latest-dev`. Runtime = `chainguard/node:latest` (distroless).
- `docker-bake.hcl` — build matrix. `default` target = multi-arch. `local` target = single-arch.
- `.github/workflows/release.yml` — tag-triggered build + sign + push.
- `.github/workflows/pr.yml` — PR gate (build, scan, lint; no push).
- `.github/workflows/scan.yml` — weekly Trivy + Grype on `:latest`.
- `src/` — TS source. `dist/` — `tsc` output (built inside builder stage; not committed).
- `test/` — node:test files.
```

### `.claude/settings.json`

```json
{
  "permissions": {
    "allow": [
      "Bash(pnpm:*)",
      "Bash(node:*)",
      "Bash(npx:*)",
      "Bash(tsc:*)",
      "Bash(docker:*)",
      "Bash(docker buildx:*)",
      "Bash(docker compose:*)",
      "Bash(hadolint:*)",
      "Bash(trivy:*)",
      "Bash(grype:*)",
      "Bash(syft:*)",
      "Bash(cosign:*)",
      "Bash(gh:*)",
      "Bash(git:*)",
      "Bash(curl:*)",
      "Bash(jq:*)",
      "Bash(wget:*)",
      "Bash(./scripts/*)"
    ],
    "deny": [
      "Bash(rm -rf /*)",
      "Bash(docker login *)",
      "Bash(docker push *)",
      "Bash(git push --force*)",
      "Bash(git tag -d *)"
    ]
  },
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "if [ -f Dockerfile ] && git diff --name-only HEAD | grep -qE '^(Dockerfile|.dockerignore|docker-bake.hcl)$'; then hadolint Dockerfile; fi"
          }
        ]
      }
    ],
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "if echo \"$CLAUDE_TOOL_INPUT\" | grep -qE 'docker push|git push (--force|-f)'; then echo 'BLOCKED: pushes belong in CI. Tag and let release.yml handle it.' >&2; exit 1; fi"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "pnpm tsc -p tsconfig.json --noEmit && hadolint Dockerfile && pnpm test --silent"
          }
        ]
      }
    ]
  }
}
```

### Slash command shortcuts

- `/build` — `docker buildx bake local --set "*.output=type=docker,dest=-"` then `docker load`.
- `/scan` — `trivy image --severity HIGH,CRITICAL echo-api:dev && grype echo-api:dev`.
- `/release X.Y.Z` — bumps VERSION, commits, tags, pushes.
- `/verify` — runs `./scripts/verify-sig.sh` on the latest published tag.

---

## 14. Codex Integration

### `AGENTS.md` (repo root)

```markdown
# AGENTS.md — echo-api (Docker image)

You are working on a published, signed, multi-arch Docker image. The authoritative spec is `docker-image.md` in the repo root.

## Required reading before any change
1. `docker-image.md` §8.1 ALWAYS
2. `docker-image.md` §8.2 NEVER
3. `docker-image.md` §8.5 Self-Verification Recipe

## Defaults
- Language: TypeScript 5.7
- Runtime: Node.js 22.13.0 LTS
- Package manager: pnpm 9.15.0 (`pnpm install --frozen-lockfile`)
- Final base image: `cgr.dev/chainguard/node:latest` (distroless)
- Builder base image: `cgr.dev/chainguard/node:latest-dev`
- Final user: `nonroot:nonroot` (uid 65532)
- Port: 8080
- Healthcheck path: `/healthz`

## What you can change
- `src/`, `test/`, `scripts/` — freely.
- `Dockerfile`, `docker-bake.hcl`, `.github/workflows/*` — only with `/test-driven-development` mindset; run the verification recipe.
- `package.json` deps — open a PR; let Dependabot/Renovate do the heavy lifting.

## What you cannot change
- The signing flow (`cosign sign --yes ... <image>@<digest>`).
- The OIDC issuer (`https://token.actions.githubusercontent.com`).
- The user (`USER nonroot:nonroot`).
- The base image without going through Renovate (do not edit a digest by hand).

## Done = all of these green
1. `pnpm install --frozen-lockfile`
2. `pnpm tsc -p tsconfig.json --noEmit`
3. `pnpm lint`
4. `pnpm test`
5. `hadolint Dockerfile`
6. `docker buildx bake default --print`
7. `docker buildx build --platform "linux/$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/')" --tag echo-api:verify --load .`
8. Smoke: `curl -sf http://localhost:8080/healthz | jq -e '.ok == true'`
9. `trivy image --severity HIGH,CRITICAL --exit-code 1 echo-api:verify`

If any step fails, the task is not done.
```

### `.codex/config.toml`

```toml
[model]
provider = "openai"
name = "gpt-5-codex"

[sandbox]
mode = "workspace-write"
network = "allowlist"
network_allowlist = [
  "registry.npmjs.org",
  "ghcr.io",
  "registry-1.docker.io",
  "auth.docker.io",
  "cgr.dev",
  "fulcio.sigstore.dev",
  "rekor.sigstore.dev",
  "tuf-repo-cdn.sigstore.dev",
  "github.com",
  "api.github.com",
  "objects.githubusercontent.com",
  "uploads.github.com",
  "raw.githubusercontent.com",
  "registry.k8s.io"
]

[approval]
mode = "on-failure"
auto_run = ["pnpm", "node", "tsc", "hadolint", "trivy", "syft", "grype", "docker buildx", "docker run", "docker images", "git status", "git diff"]

[hooks]
pre_command = "test -f docker-image.md || (echo 'docker-image.md missing' >&2; exit 1)"
post_edit = "if git diff --name-only | grep -qE '^Dockerfile$'; then hadolint Dockerfile; fi"
```

### Where Codex differs from Claude Code

| Aspect | Difference | How to compensate |
|---|---|---|
| Multi-file fan-out | Codex parallelizes more aggressively | Add explicit "do these sequentially" in the prompt for `package.json`, `Dockerfile`, `pnpm-lock.yaml`. |
| Network sandbox | Codex blocks egress unless allowlisted | Allowlist above is exhaustive for the build flow. |
| Approval cadence | `on-failure` rather than per-command | Set `auto_run` for safe commands (no push, no login). |
| Ambient secrets | Codex has no `gh auth token` access by default | Use `gh-cli` permission flag, or pass `GITHUB_TOKEN` via env file. |

---

## 15. Cursor / Other Editors

### `.cursor/rules`

```
# echo-api Cursor rules

You are editing a Docker image project. Source of truth: `docker-image.md`.

ALWAYS:
- Run `pnpm tsc -p tsconfig.json --noEmit && hadolint Dockerfile && pnpm test` before claiming a change is complete.
- Pin every `FROM` to a digest. Let Renovate manage bumps.
- Use multi-stage builds. Builder = `cgr.dev/chainguard/node:latest-dev`. Final = `cgr.dev/chainguard/node:latest` (distroless).
- Set `WORKDIR /app` as the FIRST instruction after each `FROM`.
- Use `USER nonroot:nonroot` in the final stage.
- Pass `--chown=nonroot:nonroot` on `COPY` into the final stage.
- Include a `HEALTHCHECK` using `wget` (distroless has no curl).
- Use BuildKit `--secret` for credentials at build time. Never `--build-arg`.
- Use `pnpm install --frozen-lockfile` always.
- Use exec-form `CMD ["dist/server.js"]` (distroless has no shell).
- Tag with both floating (`v1`, `v1.2`, `latest`) AND immutable (`v1.2.3`, `sha-abc1234`) tags.
- Push to BOTH `ghcr.io/<owner>/echo-api` and `docker.io/<owner>/echo-api`.
- Sign with cosign keyless OIDC against the digest, never the tag.
- Attest SBOM with `cosign attest --type spdxjson`.

NEVER:
- Run as root in the final image.
- Use `latest` tag without a digest pin.
- Use `--build-arg` for any secret.
- `COPY .` without a hardened `.dockerignore`.
- Install dev deps in the runtime stage.
- `docker push` from a feature branch or PR.
- Re-push the same tag with different content.
- Sign a tag (sign the digest).
- Use `ADD` for local files.
- Bake amd64-only on Apple Silicon and forget `--platform`.
- Hand-edit `pnpm-lock.yaml`.
- Mock the database in tests; never mock filesystem.
- Use `/bin/sh` form for CMD or ENTRYPOINT.

When suggesting changes to Dockerfile, output the FULL new file. Do not show "..." in any layer.
```

### `.vscode/extensions.json`

```json
{
  "recommendations": [
    "ms-azuretools.vscode-docker",
    "exiasr.hadolint",
    "redhat.vscode-yaml",
    "github.vscode-github-actions",
    "biomejs.biome",
    "dbaeumer.vscode-eslint",
    "github.copilot",
    "anthropic.claude-code",
    "esbenp.prettier-vscode"
  ]
}
```

### `.vscode/launch.json`

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Run Hono (host)",
      "type": "node",
      "request": "launch",
      "runtimeArgs": ["--import", "tsx"],
      "args": ["${workspaceFolder}/src/server.ts"],
      "skipFiles": ["<node_internals>/**"],
      "console": "integratedTerminal",
      "env": { "LOG_LEVEL": "debug" }
    },
    {
      "name": "Attach to running container",
      "type": "node",
      "request": "attach",
      "address": "localhost",
      "port": 9229,
      "localRoot": "${workspaceFolder}/src",
      "remoteRoot": "/app/src"
    },
    {
      "name": "node:test (current file)",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/node_modules/tsx/dist/cli.mjs",
      "args": ["--test", "${file}"],
      "console": "integratedTerminal"
    }
  ]
}
```

---

## 16. First-PR Scaffold

In order, create each file with the exact contents below. After the last file is committed, `git push origin main && git tag v0.1.0 && git push origin v0.1.0` triggers a deployable hello-world signed multi-arch image.

### `VERSION`

```
0.1.0
```

### `.gitignore`

```
node_modules/
dist/
.pnpm-store/
.env
.env.local
*.log
coverage/
.DS_Store
.vscode/*.local.json
```

### `.dockerignore`

```
# Source control
.git
.gitignore
.gitattributes

# Dependencies & build artifacts (re-built inside image)
node_modules
dist
.pnpm-store
coverage

# Editor / OS
.vscode
.cursor
.idea
.DS_Store
Thumbs.db

# CI / docs (not needed in image context)
.github
.claude
.codex
docs
*.md
!LICENSE
README.md

# Local config / secrets
.env
.env.*
!.env.example

# Tests (re-run in CI, not packaged)
test
**/*.test.ts
**/*.spec.ts

# Lint / format configs (not needed at runtime)
.editorconfig
.hadolint.yaml
biome.json
renovate.json
```

### `.editorconfig`

```ini
root = true

[*]
charset = utf-8
end_of_line = lf
indent_size = 2
indent_style = space
insert_final_newline = true
trim_trailing_whitespace = true

[*.md]
trim_trailing_whitespace = false
```

### `package.json`

```json
{
  "name": "echo-api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "engines": {
    "node": ">=22.13.0",
    "pnpm": ">=9.15.0"
  },
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/server.ts",
    "start": "node dist/server.js",
    "typecheck": "tsc -p tsconfig.json --noEmit",
    "lint": "biome check src test",
    "format": "biome format --write src test",
    "test": "node --test --import tsx 'test/**/*.test.ts'",
    "test:integration": "bash scripts/integration.sh"
  },
  "dependencies": {
    "@hono/node-server": "1.13.7",
    "hono": "4.12.14",
    "pino": "9.5.0"
  },
  "devDependencies": {
    "@biomejs/biome": "1.9.4",
    "@types/node": "22.10.5",
    "tsx": "4.19.2",
    "typescript": "5.7.2"
  }
}
```

### `pnpm-lock.yaml`

(generated by `pnpm install`; commit it)

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": false,
    "sourceMap": false,
    "removeComments": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

### `biome.json`

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "style": { "noNonNullAssertion": "warn" }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

### `src/server.ts`

```ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { logger as pinoLogger } from './lib/logger.js';
import { health } from './routes/health.js';

const app = new Hono();

app.use('*', async (c, next) => {
  const reqId = crypto.randomUUID();
  const start = Date.now();
  pinoLogger.info({ event: 'request_in', request_id: reqId, module: 'http', method: c.req.method, path: c.req.path });
  await next();
  pinoLogger.info({ event: 'request_out', request_id: reqId, module: 'http', status: c.res.status, duration_ms: Date.now() - start });
});

app.route('/healthz', health);

app.post('/echo', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  return c.json({ echo: body });
});

const port = Number(process.env.PORT ?? 8080);
serve({ fetch: app.fetch, port }, (info) => {
  pinoLogger.info({ event: 'boot', module: 'server', port: info.port });
});
```

### `src/routes/health.ts`

```ts
import { Hono } from 'hono';

export const health = new Hono();

health.get('/', (c) => c.json({ ok: true }));
```

### `src/lib/logger.ts`

```ts
import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  base: {
    service: 'echo-api',
    version: process.env.APP_VERSION ?? 'dev',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: { level: (label) => ({ level: label }) },
});
```

### `test/server.test.ts`

```ts
import { strict as assert } from 'node:assert';
import { test } from 'node:test';
import { Hono } from 'hono';
import { health } from '../src/routes/health.js';

test('GET /healthz returns ok', async () => {
  const app = new Hono().route('/healthz', health);
  const res = await app.request('/healthz');
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.deepEqual(body, { ok: true });
});
```

### `Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1.10

# ---- builder ----
FROM --platform=$BUILDPLATFORM cgr.dev/chainguard/node:latest-dev@sha256:0000000000000000000000000000000000000000000000000000000000000000 AS builder
# ^ Renovate replaces this digest. Do NOT edit by hand.
WORKDIR /build

# Install pnpm via corepack (chainguard node-dev includes corepack)
USER root
RUN corepack enable && corepack prepare pnpm@9.15.0 --activate

# Copy lockfiles first to maximize layer cache
COPY --link package.json pnpm-lock.yaml ./

# pnpm fetch warms the store; --mount=type=cache survives between builds
RUN --mount=type=cache,id=pnpm-store,target=/build/.pnpm-store \
    pnpm config set store-dir /build/.pnpm-store && \
    pnpm install --frozen-lockfile --prefer-offline

# Copy source and build
COPY --link tsconfig.json ./
COPY --link src ./src
RUN pnpm run build

# Prune to production deps only
RUN --mount=type=cache,id=pnpm-store,target=/build/.pnpm-store \
    pnpm install --frozen-lockfile --prod --prefer-offline

# ---- runtime (distroless) ----
FROM cgr.dev/chainguard/node:latest@sha256:1111111111111111111111111111111111111111111111111111111111111111 AS runtime
# ^ Renovate replaces this digest. Do NOT edit by hand.

WORKDIR /app

# Bring over only what runs at runtime
COPY --from=builder --chown=nonroot:nonroot /build/dist /app/dist
COPY --from=builder --chown=nonroot:nonroot /build/node_modules /app/node_modules
COPY --from=builder --chown=nonroot:nonroot /build/package.json /app/package.json

USER nonroot:nonroot

ENV NODE_ENV=production \
    PORT=8080 \
    LOG_LEVEL=info

EXPOSE 8080

# distroless ships busybox-wget, no curl
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["wget","-qO-","http://localhost:8080/healthz"]

# OCI annotations (also injected by metadata-action in CI; these are baseline defaults)
LABEL org.opencontainers.image.title="echo-api" \
      org.opencontainers.image.description="Tiny Hono echo service. Multi-arch, signed, distroless." \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.source="https://github.com/OWNER/echo-api"

CMD ["dist/server.js"]
```

### `docker-bake.hcl`

```hcl
variable "REGISTRY_GHCR" { default = "ghcr.io/OWNER/echo-api" }
variable "REGISTRY_HUB"  { default = "docker.io/OWNER/echo-api" }
variable "TAGS"          { default = ["dev"] }
variable "REVISION"      { default = "" }
variable "VERSION"       { default = "0.0.0" }

group "default" {
  targets = ["image"]
}

target "_common" {
  context    = "."
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  attest = [
    "type=provenance,mode=max",
    "type=sbom"
  ]
  labels = {
    "org.opencontainers.image.title"       = "echo-api"
    "org.opencontainers.image.description" = "Tiny Hono echo service. Multi-arch, signed, distroless."
    "org.opencontainers.image.licenses"    = "MIT"
    "org.opencontainers.image.version"     = "${VERSION}"
    "org.opencontainers.image.revision"    = "${REVISION}"
    "org.opencontainers.image.source"      = "https://github.com/OWNER/echo-api"
  }
  cache-from = ["type=gha"]
  cache-to   = ["type=gha,mode=max"]
}

target "image" {
  inherits = ["_common"]
  tags = flatten([
    [for t in TAGS : "${REGISTRY_GHCR}:${t}"],
    [for t in TAGS : "${REGISTRY_HUB}:${t}"]
  ])
}

# Single-arch loadable image for local dev
target "local" {
  inherits  = ["_common"]
  platforms = ["linux/amd64"]
  attest    = []
  cache-from = ["type=gha"]
  cache-to   = []
  tags       = ["echo-api:dev"]
  output     = ["type=docker"]
}
```

### `.hadolint.yaml`

```yaml
ignored:
  - DL3018  # apk add without version pin (we use distroless / chainguard daily-rebuilt)
  - DL3007  # using latest tag (Renovate pins by digest, which IS the lock)
trustedRegistries:
  - cgr.dev
  - ghcr.io
  - docker.io
override:
  error:
    - DL3025  # exec form for CMD/ENTRYPOINT
    - DL3002  # never run as root
    - DL3009  # delete apt-get cache (n/a, distroless)
failure-threshold: warning
no-fail: false
no-color: false
```

### `.trivyignore`

```
# Format: <CVE-ID>
# Document EVERY entry with a comment above it (date, reason, expiry).
# Entries reviewed quarterly. Anything older than 90 days is removed.
```

### `renovate.json`

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    "docker:pinDigests",
    "helpers:pinGitHubActionDigests",
    ":separateMajorReleases",
    ":semanticCommits"
  ],
  "timezone": "UTC",
  "schedule": ["before 4am on monday"],
  "labels": ["dependencies"],
  "rangeStrategy": "pin",
  "packageRules": [
    {
      "matchManagers": ["dockerfile"],
      "matchUpdateTypes": ["digest", "patch", "minor"],
      "automerge": true,
      "automergeType": "branch"
    },
    {
      "matchManagers": ["github-actions"],
      "matchUpdateTypes": ["digest", "patch", "minor"],
      "automerge": true,
      "automergeType": "branch"
    },
    {
      "matchManagers": ["npm"],
      "matchDepTypes": ["devDependencies"],
      "automerge": true,
      "automergeType": "pr"
    },
    {
      "matchManagers": ["npm"],
      "matchDepTypes": ["dependencies"],
      "matchUpdateTypes": ["major"],
      "automerge": false,
      "addLabels": ["major-bump"]
    }
  ],
  "vulnerabilityAlerts": {
    "enabled": true,
    "labels": ["security"],
    "assignees": ["@OWNER"]
  },
  "lockFileMaintenance": {
    "enabled": true,
    "schedule": ["before 4am on the first day of the month"]
  }
}
```

### `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5
    labels:
      - "dependencies"
      - "npm"
    groups:
      production:
        dependency-type: "production"
      development:
        dependency-type: "development"
```

### `.github/workflows/release.yml`

```yaml
name: release

on:
  push:
    tags:
      - "v*.*.*"

permissions:
  contents: read
  id-token: write   # cosign keyless OIDC
  packages: write   # GHCR push
  attestations: write

env:
  REGISTRY_GHCR: ghcr.io/${{ github.repository }}
  REGISTRY_HUB:  docker.io/${{ github.repository_owner }}/echo-api

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Read VERSION
        id: ver
        run: echo "version=$(cat VERSION)" >> "$GITHUB_OUTPUT"

      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v4

      - name: Login to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Login to Docker Hub
        uses: docker/login-action@v4
        with:
          registry: docker.io
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}

      - name: Extract metadata (tags + labels)
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: |
            ${{ env.REGISTRY_GHCR }}
            ${{ env.REGISTRY_HUB }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=semver,pattern={{major}}
            type=raw,value=latest
            type=sha,format=short,prefix=sha-

      - name: Build and push (multi-arch)
        id: build
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          provenance: mode=max
          sbom: true
          build-args: |
            VERSION=${{ steps.ver.outputs.version }}
            REVISION=${{ github.sha }}

      - name: Trivy scan (fail on HIGH/CRITICAL)
        uses: aquasecurity/trivy-action@0.36.0
        with:
          image-ref: ${{ env.REGISTRY_GHCR }}@${{ steps.build.outputs.digest }}
          severity: HIGH,CRITICAL
          exit-code: "1"
          ignore-unfixed: true
          format: sarif
          output: trivy.sarif

      - name: Upload Trivy SARIF
        if: always()
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy.sarif

      - name: Generate SBOM (syft)
        uses: anchore/sbom-action@v0.22.0
        with:
          image: ${{ env.REGISTRY_GHCR }}@${{ steps.build.outputs.digest }}
          format: spdx-json
          output-file: sbom.spdx.json
          upload-artifact: true
          upload-release-assets: true

      - name: Install cosign
        uses: sigstore/cosign-installer@v4.1.0
        with:
          cosign-release: "v3.0.6"

      - name: Sign image (keyless, both registries)
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
        run: |
          set -euo pipefail
          for img in "${REGISTRY_GHCR}" "${REGISTRY_HUB}"; do
            cosign sign --yes "${img}@${DIGEST}"
          done

      - name: Attest SBOM (both registries)
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
        run: |
          set -euo pipefail
          for img in "${REGISTRY_GHCR}" "${REGISTRY_HUB}"; do
            cosign attest --yes \
              --predicate sbom.spdx.json \
              --type spdxjson \
              "${img}@${DIGEST}"
          done

      - name: Verify signature (sanity)
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
        run: |
          cosign verify "${REGISTRY_GHCR}@${DIGEST}" \
            --certificate-identity-regexp "https://github.com/${{ github.repository }}/.github/workflows/release.yml@refs/tags/v.+" \
            --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
            --output text

      - name: Smoke test pulled image
        env:
          DIGEST: ${{ steps.build.outputs.digest }}
        run: |
          set -euo pipefail
          docker pull "${REGISTRY_GHCR}@${DIGEST}"
          CID=$(docker run -d -p 8080:8080 "${REGISTRY_GHCR}@${DIGEST}")
          for i in 1 2 3 4 5 6 7 8 9 10; do
            if curl -fsS http://localhost:8080/healthz | jq -e '.ok == true' >/dev/null; then
              echo "OK on try $i"; docker stop "$CID"; exit 0
            fi
            sleep 1
          done
          docker logs "$CID"; docker stop "$CID"; exit 1
```

### `.github/workflows/pr.yml`

```yaml
name: pr

on:
  pull_request:
    branches: [main]

permissions:
  contents: read
  pull-requests: read

jobs:
  lint-build-scan:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.0

      - uses: actions/setup-node@v4
        with:
          node-version: 22.13.0
          cache: pnpm

      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test

      - name: Lint Dockerfile
        uses: hadolint/hadolint-action@v3.1.0
        with:
          dockerfile: Dockerfile

      - uses: docker/setup-qemu-action@v4
      - uses: docker/setup-buildx-action@v4

      - name: Build (no push, single-arch loadable)
        uses: docker/build-push-action@v6
        with:
          context: .
          file: Dockerfile
          platforms: linux/amd64
          push: false
          load: true
          tags: echo-api:pr-${{ github.event.number }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Trivy scan
        uses: aquasecurity/trivy-action@0.36.0
        with:
          image-ref: echo-api:pr-${{ github.event.number }}
          severity: HIGH,CRITICAL
          exit-code: "1"
          ignore-unfixed: true
```

### `.github/workflows/scan.yml`

```yaml
name: weekly-scan

on:
  schedule:
    - cron: "17 6 * * 1"   # Mondays 06:17 UTC
  workflow_dispatch: {}

permissions:
  contents: read
  security-events: write

jobs:
  trivy-grype:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Trivy on :latest
        uses: aquasecurity/trivy-action@0.36.0
        with:
          image-ref: ghcr.io/${{ github.repository }}:latest
          severity: HIGH,CRITICAL
          exit-code: "0"
          format: sarif
          output: trivy.sarif

      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: trivy.sarif
          category: trivy-weekly

      - name: Grype on :latest
        uses: anchore/scan-action@v5
        with:
          image: ghcr.io/${{ github.repository }}:latest
          severity-cutoff: high
          fail-build: false
          output-format: sarif

      - uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: results.sarif
          category: grype-weekly
```

### `.github/workflows/verify-sigs.yml`

```yaml
name: verify-sigs

on:
  schedule:
    - cron: "0 8 * * *"  # daily 08:00 UTC
  workflow_dispatch: {}

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: sigstore/cosign-installer@v4.1.0
        with:
          cosign-release: "v3.0.6"

      - run: |
          for img in \
            ghcr.io/${{ github.repository }}:latest \
            docker.io/${{ github.repository_owner }}/echo-api:latest ; do
            echo "Verifying $img"
            cosign verify "$img" \
              --certificate-identity-regexp "https://github.com/${{ github.repository }}/.github/workflows/release.yml@refs/tags/v.+" \
              --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
          done
```

### `scripts/build-local.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
ARCH=$(uname -m | sed 's/x86_64/amd64/;s/aarch64/arm64/;s/arm64/arm64/')
docker buildx build \
  --platform "linux/${ARCH}" \
  --tag echo-api:dev \
  --load \
  .
echo "Built echo-api:dev for linux/${ARCH}. Run: docker run --rm -p 8080:8080 echo-api:dev"
```

### `scripts/integration.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
IMG="${1:-echo-api:dev}"
CID=$(docker run -d -p 8080:8080 "$IMG")
trap 'docker stop "$CID" >/dev/null' EXIT
for i in 1 2 3 4 5 6 7 8 9 10; do
  if curl -fsS http://localhost:8080/healthz | jq -e '.ok == true' >/dev/null; then
    echo "PASS on try $i"; exit 0
  fi
  sleep 1
done
echo "FAIL"
docker logs "$CID"
exit 1
```

### `scripts/verify-sig.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
IMG="${1:?usage: $0 <image:tag-or-digest>}"
REPO="${GITHUB_REPOSITORY:-$(git config --get remote.origin.url | sed -E 's#.*github.com[:/]([^/]+/[^/.]+).*#\1#')}"
cosign verify "$IMG" \
  --certificate-identity-regexp "https://github.com/${REPO}/.github/workflows/release.yml@refs/tags/v.+" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
  --output text
echo "OK: $IMG signature valid for github.com/${REPO} release workflow"
```

### `scripts/healthcheck.sh`

```bash
#!/usr/bin/env bash
exec curl -fsS "http://localhost:${PORT:-8080}/healthz"
```

### `LICENSE`

```
MIT License

Copyright (c) 2026 OWNER

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

### `README.md`

```markdown
# echo-api

A tiny Hono service built into a multi-arch (amd64+arm64), distroless, signed Docker image. Published to GHCR and Docker Hub.

## Pull

```bash
docker pull ghcr.io/OWNER/echo-api:latest
# or pin to a digest:
docker pull ghcr.io/OWNER/echo-api@sha256:<digest>
```

## Verify the signature

```bash
cosign verify ghcr.io/OWNER/echo-api:latest \
  --certificate-identity-regexp "https://github.com/OWNER/echo-api/.github/workflows/release.yml@refs/tags/v.+" \
  --certificate-oidc-issuer "https://token.actions.githubusercontent.com"
```

## Run

```bash
docker run --rm -p 8080:8080 ghcr.io/OWNER/echo-api:latest
curl http://localhost:8080/healthz   # → {"ok":true}
curl -d '{"hi":"there"}' http://localhost:8080/echo  # → {"echo":{"hi":"there"}}
```

See `docker-image.md` for the full operating manual.
```

### `.env.example`

```
LOG_LEVEL=info
PORT=8080
APP_VERSION=dev
```

After committing all files, run:

```bash
chmod +x scripts/*.sh
pnpm install
git add -A
git commit -m "feat: initial echo-api docker image scaffold"
git push -u origin main
git tag v0.1.0
git push origin v0.1.0
```

The `release.yml` workflow takes over and produces a signed multi-arch image at `ghcr.io/OWNER/echo-api:v0.1.0`.

---

## 17. Idea → MVP Path: From Dockerfile to First Signed Multi-Arch v1.0.0

### Phase 1 — Schema (1 AI session, 30 min)

The "schema" of an image: its surface contract. Decide and freeze:

- **Inputs**: env vars, ports, mounts, args.
- **Outputs**: stdout (JSON logs), stderr (panics).
- **Healthcheck endpoint**: `/healthz` returning `{"ok":true}` HTTP 200.
- **Working directory**: `/app`.
- **User**: `nonroot:nonroot` (uid 65532).
- **Filesystem expectation**: read-only rootfs with a `tmpfs` for `/tmp`.

Files touched: `README.md` (contract section), `Dockerfile` (`EXPOSE`, `HEALTHCHECK`, `USER`, `ENV`).

Exit criteria: `docker inspect <image>` shows `Config.User=nonroot:nonroot`, `Config.ExposedPorts`, `Config.Healthcheck` populated.

### Phase 2 — Backbone (1 AI session, 1 hour)

Stand up the build pipeline:

1. Write `Dockerfile` (multi-stage; both base images digest-pinned via Renovate placeholder).
2. Write `.dockerignore`.
3. Write `docker-bake.hcl` with `default` and `local` targets.
4. Write `pr.yml` workflow.
5. Run `docker buildx bake local` locally and confirm it builds.

Files touched: `Dockerfile`, `.dockerignore`, `docker-bake.hcl`, `.github/workflows/pr.yml`, `scripts/build-local.sh`.

Exit criteria: PR workflow runs green on a `chore: scaffold` PR.

### Phase 3 — Vertical slice (1 AI session, 1 hour)

Build the smallest publishable image end-to-end:

1. Implement `/echo` route.
2. Add `test/server.test.ts` with two tests (healthz + echo).
3. Add `scripts/integration.sh`.
4. Wire `pr.yml` to run `pnpm test` + integration smoke against the loaded image.
5. Verify: open a PR, see all checks green.

Files touched: `src/server.ts`, `src/routes/health.ts`, `test/server.test.ts`, `scripts/integration.sh`, `pr.yml`.

Exit criteria: PR shows all five checks green; reviewer can `docker pull` an artifact (CI-attached).

### Phase 4 — Auth + multi-user (push + sign + multi-registry)

The image is itself stateless; "auth" here means **registry credentials and signing identity**.

1. Add `release.yml` (multi-arch buildx + bake, push GHCR + Docker Hub, Trivy scan, syft SBOM, cosign keyless sign + attest).
2. Add `DOCKERHUB_USERNAME` + `DOCKERHUB_TOKEN` repo secrets.
3. Add `verify-sigs.yml` and `scan.yml`.
4. First tag: `git tag v0.1.0 && git push origin v0.1.0` → release workflow runs.
5. Verify locally: `cosign verify ghcr.io/OWNER/echo-api:v0.1.0 ...`.

Files touched: `.github/workflows/release.yml`, `verify-sigs.yml`, `scan.yml`, `scripts/verify-sig.sh`.

Exit criteria:
- `docker buildx imagetools inspect ghcr.io/OWNER/echo-api:v0.1.0` shows 2 manifests + provenance + sbom.
- `cosign verify` returns OK against both GHCR and Docker Hub copies.
- Trivy scan in CI returns 0 HIGH/CRITICAL.

### Phase 5 — Ship + monitor (cut v1.0.0)

1. Confirm Renovate is enabled (commit `renovate.json` and visit https://github.com/apps/renovate to install).
2. Wait for first Renovate PR — typically a digest pin update for both base images.
3. Merge that PR. Confirm `pr.yml` is green.
4. Bump VERSION to `1.0.0`, commit, tag `v1.0.0`, push.
5. Monitor `release.yml` end-to-end (~6 minutes warm).
6. Run `verify-sigs.yml` manually: `gh workflow run verify-sigs.yml`. Confirm green.
7. Pin to digest in any consumer: `docker pull ghcr.io/OWNER/echo-api@sha256:<digest from imagetools inspect>`.

Exit criteria: `cosign tree ghcr.io/OWNER/echo-api:v1.0.0` shows: 1 image manifest list + 2 signatures (one per registry push) + 2 SBOM attestations + 1 provenance attestation. The first signed multi-arch v1.0.0 is live.

---

## 18. Feature Recipes

### Recipe 1 — Add a new HTTP route

1. Create `src/routes/<name>.ts`:
   ```ts
   import { Hono } from 'hono';
   export const <name> = new Hono();
   <name>.get('/', (c) => c.json({ ok: true }));
   ```
2. Mount in `src/server.ts`: `app.route('/<name>', <name>);`
3. Add `test/<name>.test.ts` mirroring `test/server.test.ts`.
4. `pnpm test && pnpm dev && curl http://localhost:8080/<name>`.
5. Run §8.5 verification recipe.

### Recipe 2 — Add a runtime env var

1. `Dockerfile`: add `ENV NEW_VAR=defaultvalue` in the runtime stage near the other ENV.
2. `src/server.ts`: read via `process.env.NEW_VAR ?? 'defaultvalue'`.
3. `.env.example`: add `NEW_VAR=defaultvalue`.
4. `README.md`: document under "Configuration."
5. Verify: `docker run --rm -e NEW_VAR=test echo-api:dev` (won't echo in distroless; confirm via behavior or a debug log).

### Recipe 3 — Add a build secret

```dockerfile
# In builder stage:
RUN --mount=type=secret,id=npm,target=/root/.npmrc,required=true \
    pnpm install --frozen-lockfile
```

CLI:
```bash
docker buildx build \
  --secret id=npm,src=$HOME/.npmrc \
  --tag echo-api:dev .
```

CI: pass via `build-args` is NOT enough; use the GitHub Action's `secret-files`:
```yaml
- uses: docker/build-push-action@v6
  with:
    secret-files: |
      "npm=${{ runner.temp }}/.npmrc"
```

### Recipe 4 — Add a third-architecture (linux/arm/v7)

1. `docker-bake.hcl`: extend `_common.platforms`:
   ```hcl
   platforms = ["linux/amd64", "linux/arm64", "linux/arm/v7"]
   ```
2. `release.yml` `setup-qemu-action`: pass `platforms: arm64,arm`.
3. CI build time grows ~30%. Test pull on a Raspberry Pi 4 32-bit OS.

### Recipe 5 — Multi-stage cache split (faster CI)

Already implemented via `--mount=type=cache,id=pnpm-store`. To further split:

1. Dedicate a `deps` stage:
   ```dockerfile
   FROM ... AS deps
   COPY package.json pnpm-lock.yaml ./
   RUN --mount=type=cache,id=pnpm-store,target=/root/.pnpm-store \
       pnpm install --frozen-lockfile
   ```
2. Builder copies from `deps`: `COPY --from=deps /app/node_modules ./node_modules`.
3. Code edits invalidate only the builder layer, not deps.

### Recipe 6 — Switch Docker Hub from access-token to OIDC

Docker Hub OIDC support is in beta as of 2026-04. To opt in:

1. Hub UI → Account → Security → "Trusted publishers (beta)" → "Add" → GitHub Actions → repo `<owner>/<repo>` → workflow `.github/workflows/release.yml`.
2. In `release.yml`, replace the Docker Hub `docker/login-action` step with:
   ```yaml
   - name: Login to Docker Hub (OIDC)
     uses: docker/login-action@v4
     with:
       registry: docker.io
       username: ${{ vars.DOCKERHUB_USERNAME }}
       # password omitted; relies on id-token: write
   ```
3. Remove `DOCKERHUB_TOKEN` repo secret.

If OIDC isn't yet GA when you read this, keep token-based auth.

### Recipe 7 — Sign and verify with a public key (offline)

For consumers who don't trust Sigstore Rekor, ALSO publish a key-based signature:

1. `cosign generate-key-pair` → commit `cosign.pub` to repo.
2. Store `COSIGN_PRIVATE_KEY` + `COSIGN_PASSWORD` as repo secrets.
3. In `release.yml`, after the keyless `cosign sign`:
   ```yaml
   - name: Key-based sign (additional)
     env:
       COSIGN_PRIVATE_KEY: ${{ secrets.COSIGN_PRIVATE_KEY }}
       COSIGN_PASSWORD: ${{ secrets.COSIGN_PASSWORD }}
       DIGEST: ${{ steps.build.outputs.digest }}
     run: |
       echo "$COSIGN_PRIVATE_KEY" > /tmp/cosign.key
       cosign sign --key /tmp/cosign.key --yes "${REGISTRY_GHCR}@${DIGEST}"
       rm -f /tmp/cosign.key
   ```
4. Verify: `cosign verify --key cosign.pub ghcr.io/OWNER/echo-api:v1.0.0`.

Keyless is still the default and primary; this is belt-and-suspenders.

### Recipe 8 — Generate CycloneDX SBOM alongside SPDX

```yaml
- uses: anchore/sbom-action@v0.22.0
  with:
    image: ${{ env.REGISTRY_GHCR }}@${{ steps.build.outputs.digest }}
    format: cyclonedx-json
    output-file: sbom.cyclonedx.json
    upload-release-assets: true
```

Then attest both:
```bash
cosign attest --predicate sbom.spdx.json --type spdxjson --yes "$IMG@$DIGEST"
cosign attest --predicate sbom.cyclonedx.json --type cyclonedx --yes "$IMG@$DIGEST"
```

### Recipe 9 — Add a debug variant alongside the distroless one

The "debug" image is a development convenience: same /app, but with a shell.

1. `docker-bake.hcl`:
   ```hcl
   target "debug" {
     inherits  = ["_common"]
     target    = "runtime-debug"
     tags      = ["${REGISTRY_GHCR}:debug"]
   }
   ```
2. `Dockerfile` add a stage:
   ```dockerfile
   FROM cgr.dev/chainguard/wolfi-base:latest@sha256:... AS runtime-debug
   WORKDIR /app
   RUN apk add --no-cache nodejs-22 wget curl
   COPY --from=builder --chown=nonroot:nonroot /build/dist /app/dist
   COPY --from=builder --chown=nonroot:nonroot /build/node_modules /app/node_modules
   USER nonroot:nonroot
   EXPOSE 8080
   HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost:8080/healthz
   CMD ["node", "dist/server.js"]
   ```
3. Push only on demand: `docker buildx bake debug --push`.

### Recipe 10 — Renovate auto-merge for digest patches only

Already in `renovate.json`. To disable auto-merge for everything but digest pins:

```json
{
  "packageRules": [
    {
      "matchManagers": ["dockerfile"],
      "matchUpdateTypes": ["digest"],
      "automerge": true
    },
    {
      "matchManagers": ["dockerfile"],
      "matchUpdateTypes": ["minor", "major"],
      "automerge": false,
      "addLabels": ["needs-review"]
    }
  ]
}
```

---

## 19. Troubleshooting (Top 30 errors → exact fix)

1. `ERROR: failed to solve: rpc error: code = Unavailable desc = error reading from server: EOF` → Buildx daemon crashed; `docker buildx rm multiarch && docker buildx create --name multiarch --use --bootstrap`.
2. `ERROR: Multi-platform build is not supported for the docker driver. Switch to a different driver` → `docker buildx create --name multiarch --driver docker-container --use --bootstrap`.
3. `unknown flag: --provenance` → Buildx <0.10. Update: `docker buildx version` should report ≥0.13. Update Docker Desktop.
4. `failed to compute cache key: "/app/dist" not found` → COPY from a stage that didn't run. Check stage names in `--target` and `--from=`.
5. `ERROR [internal] load metadata for cgr.dev/chainguard/node:latest` (timeout) → network issue or rate limit. `docker pull cgr.dev/chainguard/node:latest` separately to surface real error.
6. `Error: spawn /usr/bin/node EACCES` → file copied with root perms then run as nonroot. Add `--chown=nonroot:nonroot` on COPY into runtime.
7. `EACCES: permission denied, open '/app/.npmrc'` → tried to write to read-only fs at runtime; move to `/tmp` or remove the call.
8. `cosign: ERROR: signing [...]: getting signer: getting fulcio signer: ... no token provided` → workflow missing `permissions: id-token: write`. Add it at the job or workflow level.
9. `cosign: no matching signatures` → verifying tag instead of digest, or signed against a different digest. Re-pull and re-verify with `@sha256:...`.
10. `Error: error during connect: Get "http://...": context deadline exceeded` (BuildKit GC) → `docker buildx prune -af`.
11. `Error response from daemon: pull access denied for ghcr.io/...` → not logged into GHCR or PAT lacks `read:packages`. `gh auth refresh -s read:packages,write:packages`.
12. `denied: requested access to the resource is denied` (push) → wrong namespace or token scope. Confirm `<owner>/<image>` matches your token.
13. `npm ERR! enoent ENOENT: no such file or directory, open '/app/package.json'` → forgot to `COPY package.json` to the right stage. Audit Dockerfile.
14. `tsx: command not found` (in container) → tsx is a dev dep; runtime stage prunes them. Use `node dist/server.js`, never tsx, in production.
15. `WARN: Health check for container ... is in unhealthy state` → app not listening on `0.0.0.0:8080`. Hono's `serve` binds to all interfaces by default; if customized, check.
16. `Error: failed to import: failed to make image mount: failed to make-data-mount` → containerd image store toggle didn't take effect. Restart docker daemon.
17. `unknown flag: --load` → very old Docker. Update to ≥20.10 (we require 29).
18. `Error: ENOENT: no such file or directory, scandir '/build/.pnpm-store'` → pnpm cache mount path mismatch. Match `pnpm config set store-dir` to the mount target.
19. `error mounting "/var/lib/docker/...": file exists` → leftover from killed build. `docker buildx rm --all-inactive`.
20. `Error: Process completed with exit code 1` (Trivy) → CVE found at HIGH/CRITICAL. Run locally: `trivy image --severity HIGH,CRITICAL <image>` to see which CVE; bump base image (Renovate auto-PRs daily).
21. `panic: assignment to entry in nil map` (cosign) → very old cosign. Use ≥3.0.6.
22. `Error: failed to solve: error from sender: open .git: permission denied` → tried to add `.git` to context; ensure `.dockerignore` excludes `.git`.
23. `CMD ["dist/server.js"]` runs but Node says `Cannot find module ...` → workdir mismatch; ensure `WORKDIR /app` and `dist` is at `/app/dist`.
24. `Error: Cannot find module 'pino'` → pruned to `--prod` but pino is in `dependencies` not `devDependencies` — verify `package.json`.
25. `pnpm: command not found` (builder) → forgot `corepack enable && corepack prepare pnpm@9.15.0 --activate`.
26. `panic: open /etc/passwd: no such file or directory` (rare, custom-from-scratch) → use chainguard, not `scratch`. Distroless ships /etc/passwd with `nonroot` entry.
27. `ENOSPC: no space left on device` mid-CI → `docker/setup-buildx-action` runners share disk. Add a step `df -h` and `docker system prune -af` early.
28. `failed to read dockerfile: open Dockerfile: no such file or directory` → context misconfigured; ensure `context: .` and `file: Dockerfile` in build-push-action.
29. `error parsing reference: "echo-api:" is not a valid reference` → empty tag from a misformed metadata-action output. Use `tags: ${{ steps.meta.outputs.tags }}` exactly; never interpolate empty values.
30. `error: cosign attest --predicate: file does not exist` → SBOM step ran in different working dir than attest step. Use `${{ runner.temp }}/sbom.spdx.json` or `${{ github.workspace }}/sbom.spdx.json` consistently.

---

## 20. Glossary

- **AMD64 / ARM64**: CPU architectures. amd64 = x86_64 (Intel/AMD). arm64 = aarch64 (Apple Silicon, AWS Graviton, Raspberry Pi 4 64-bit). Different binaries; a multi-arch image bundles both under one tag.
- **Attestation**: A signed statement about an image (SBOM, build provenance, vuln scan). Stored in the registry as an OCI 1.1 referrer.
- **Bake (`docker buildx bake`)**: Declarative build runner. One file (`docker-bake.hcl`) defines targets, platforms, tags, attestations.
- **Base image**: The image you `FROM`. Determines OS layer, shell, language runtime.
- **BuildKit**: The build engine inside modern Docker. Implements layer caching, secrets, attestations.
- **Buildx**: The Docker CLI plugin that drives BuildKit. Adds multi-platform, bake, and cache exporters.
- **Chainguard / Wolfi**: A Linux undistro built specifically for containers. "Distroless" final image (no shell, no package manager); daily-rebuilt to incorporate CVE fixes.
- **Containerd image store**: The default in Engine 29. Required for `--load` of multi-platform images.
- **Cosign**: Sigstore's CLI for signing and verifying container images. Supports keyless OIDC (recommended) or key-based.
- **Digest**: SHA-256 hash of an image manifest. Immutable. Format: `sha256:<64hex>`.
- **Distroless**: Image that contains only the application + runtime dependencies. No shell, no package manager. Smaller, fewer CVEs.
- **`.dockerignore`**: File listing what NOT to send to the Docker daemon as build context.
- **Fulcio**: Sigstore's CA. Issues short-lived (10-minute) certs based on OIDC identity.
- **GHCR**: GitHub Container Registry (`ghcr.io`). Free for public images, OIDC-native.
- **hadolint**: Dockerfile linter. AST-aware. Includes ShellCheck for `RUN` Bash.
- **HEALTHCHECK**: Dockerfile instruction. Daemon runs the command on a schedule; container reports healthy/unhealthy.
- **Image (vs container)**: Image = blueprint. Container = running instance.
- **Keyless signing**: Cosign mode that uses OIDC identity (e.g. GitHub workflow ID) instead of a stored private key.
- **Layer**: A diff from the previous filesystem state. Cached, reused across builds.
- **Manifest list**: An OCI/Docker manifest pointing to multiple per-arch images. Lets one tag be multi-arch.
- **Multi-stage build**: Dockerfile with multiple `FROM` instructions. Earlier stages build; later stages copy artifacts. Final image is small.
- **Non-root**: Running the container process as a UID other than 0. `nonroot` (UID 65532) is the chainguard convention.
- **OCI**: Open Container Initiative. The spec governing image and runtime formats.
- **OIDC**: OpenID Connect. GitHub Actions can mint OIDC tokens that prove a workflow identity to third parties (Sigstore, AWS, etc.).
- **pnpm**: Node package manager. Faster than npm, deterministic, hard-link-based.
- **Provenance**: A SLSA-spec attestation describing how/where an image was built. `--provenance=mode=max` includes full build instructions.
- **QEMU**: User-mode CPU emulator. Lets BuildKit cross-build for foreign architectures.
- **Rekor**: Sigstore's transparency log. Append-only record of every keyless signature. Lets anyone audit "what was signed by whom when."
- **Renovate**: Automated dependency-update bot. Knows about Docker base images, GitHub Actions, npm, etc. Issues PRs.
- **SBOM**: Software Bill of Materials. Inventory of every package in an image. Formats: SPDX, CycloneDX.
- **SemVer**: `MAJOR.MINOR.PATCH`. Major = breaking; minor = feature; patch = bug fix.
- **Sigstore**: The umbrella project (Cosign + Fulcio + Rekor) for keyless signing.
- **SLSA**: Supply-chain Levels for Software Artifacts. Spec graded 1–4 for build integrity.
- **syft**: Anchore's SBOM generator. Reads container images and filesystems, outputs SPDX/CycloneDX.
- **Trivy / Grype**: Vulnerability scanners for container images. Trivy = Aqua. Grype = Anchore. Use both for cross-validation.
- **WORKDIR**: The container's process working directory. Must exist; created if absent.

---

## 21. Update Cadence

- This rulebook is valid for **Docker Engine 29.x**, **Buildx 0.26.x–0.33.x**, **BuildKit 0.18+**, **cosign 3.0.x**, **Trivy 0.70.x**, **Syft 1.42.x**, **Grype 0.92.x**, **Node.js 22 LTS**.
- Re-run the generator when:
  - Docker Engine major version bumps (30+).
  - Cosign major bumps (4.x).
  - Sigstore root of trust rotates (rare; cosign release notes will say).
  - Chainguard distroless variant deprecated or replaced.
  - GHCR or Docker Hub auth model changes (e.g., OIDC GA on Docker Hub).
  - A security advisory affects any tool in the versions table.
- Last reviewed: **2026-04-27**.
