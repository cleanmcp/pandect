# Security policy

## Supported versions

Only the latest published version on npm receives security updates.

| Version | Supported |
|---|---|
| Latest published `pandect@x.y.z` | yes |
| Earlier versions | no |

## Reporting a vulnerability

**Please do not file public GitHub issues for vulnerabilities.**

Instead, open a private security advisory at https://github.com/cleanmcp/pandect/security/advisories/new and include:

- A description of the issue
- Reproduction steps
- The npm version affected
- Your proposed fix (optional)

We aim to acknowledge new reports within 72 hours.

## Threat model

`pandect` is a CLI that:

- Reads `.md` files bundled inside the npm package
- Writes one `.md` file to the current working directory

It does **not**:

- Make network requests at runtime (the package is fully self-contained — `npx` downloads it once)
- Execute any of the rulebook contents (rulebooks are inert markdown)
- Read or modify files outside the current working directory (other than the bundled rulebooks inside `node_modules/pandect/rulebooks/`)
- Have any runtime dependencies

The realistic risks are:

1. **A malicious version of `pandect` is published.** Mitigated by npm provenance attestation (every published version is signed via Sigstore and tied to the cleanmcp/pandect GitHub Actions workflow). Verify with `npm view pandect dist.signatures`.
2. **A rulebook recommends a malicious dependency.** Each rulebook cites its dependencies' published versions on the day of generation. Always run `npm audit` / `cargo audit` / `pip-audit` after applying a rulebook.
3. **A typosquat package on npm.** The official package is `pandect` — no scopes, no variants. If you see `pandec`, `pendect`, `@something/pandect`, etc., it's not us.

## Disclosure

We follow coordinated disclosure: once a fix is published, we'll publicly credit the reporter (unless they prefer to remain anonymous) and document the issue in the GitHub security advisory.
