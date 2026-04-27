<!-- Thanks for the PR. A few quick checks before we merge: -->

## What changed

<!-- One sentence. -->

## Type

- [ ] New stack rulebook
- [ ] Update to existing rulebook (major version, deprecation, new gotcha)
- [ ] CLI / packaging change
- [ ] Meta-prompt (`RULEBOOK_GENERATOR.md`) change
- [ ] Docs / README

## Closes

<!-- Closes #123 -->

## Checklist

- [ ] Files in `rulebooks/` follow the 21-section spec from the meta-prompt
- [ ] Versions in any rulebook are cited via live WebSearch (today's date), not training cutoffs
- [ ] Zero banned phrases (`depending on`, `you could`, `consider using`, `feel free to`, etc.)
- [ ] If a new stack: short name added to README table + `bin/pandect.mjs` `ALIASES` (if long-form alias needed)
- [ ] CLI smoke test passes locally: `node bin/pandect.mjs <stack>` produces a `RULEBOOK.md`
- [ ] No new runtime dependencies in `package.json`
