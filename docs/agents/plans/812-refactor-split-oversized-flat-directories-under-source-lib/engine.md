# engine Plan: Refactor: split oversized flat directories under source/lib/

Main plan: [plan.md](plan.md)

## Overview

All work is inside `source/lib/**` and `source/spec/lib/**` (engine scope). Six independent
commits, each self-contained and green on its own. Order below puts the logging dedup first
(the biggest win — deletes 11 files outright) and keeps the two logging commits adjacent; the
three plain splits and the deferrable `models/configs/` follow.

Conventions to follow for every split (established by `parsers/`, `server/handlers/`,
`services/config/`, `exceptions/http|config|registry/`):

- Subfolder names are lowercase `snake_case`.
- A few cohesive peer files may stay flat at the parent — the root aggregate / base class
  stays flat.
- No path alias in this repo: every `import` / `export` / jsdoc `import('...')` reference is
  edited at its call site.
- **No compatibility re-export barrels** — match the clean-move style of #527 / #723.
- Moved files' own relative imports gain or lose a `../` level; fix each.
- `source/spec/lib/**` mirrors `source/lib/**` exactly (see
  `docs/agents/architecture/testing.md`): create the mirrored spec subfolders and move the
  `*_spec.js` files, fixing their `../` depth.
- Keep each commit atomic: one directory per commit, code + specs + doc update together.

## Steps

- [01 — Remove the utils/logging re-export barrel](engine/01-dedup-logging-barrel.md)
- [02 — Sub-group common/utils/logging](engine/02-subgroup-common-logging.md)
- [03 — Split exceptions/config](engine/03-split-exceptions-config.md)
- [04 — Split registry](engine/04-split-registry.md)
- [05 — Split models/request](engine/05-split-models-request.md)
- [06 — Split or defer models/configs](engine/06-split-or-defer-models-configs.md)

## CI Checks

- `source`: `cd source && npm test` (CI job: `jasmine` — runs `npm run coverage`)
- `source`: `cd source && npm run lint` (CI job: `checks` — `eslint lib spec`)
- `source`: `cd source && npm run check_docs` (CI job: `checks` — `jsdoc --pedantic`; run
  locally, this is what catches broken `@param {import('...')}` paths)

After each commit, all three must be clean, plus:
`git grep -n "<old-path>/" source/lib source/spec` returns only updated paths.

## Notes

- Current `source/lib/` state was verified against the issue: `exceptions/config/` 19,
  `registry/` 14, `models/request/` 12, `models/configs/` 11, `common/utils/logging/` 11.
  All match.
- `source/lib/utils/logging/` is confirmed to be **only** 11 one-line barrels
  (`export * from '../../common/utils/logging/<Name>.js';`). The real implementation is
  `source/lib/common/utils/logging/`. ~25 call sites import through the barrel.
- Spec trees are not always full mirrors and already contain unrelated drift — only move the
  `*_spec.js` files that correspond to files this refactor actually moves:
  - `source/spec/lib/registry/` also holds 11 `JobRegistry_*_spec.js` files whose subject
    (`JobRegistry`) lives in the `worker/` package, not `source/lib/registry/`. Leave them
    untouched — out of scope.
  - `source/spec/lib/exceptions/config/` mirrors only 6 of the 19 exceptions; that's fine,
    move the specs that exist.
  - `source/spec/lib/models/configs/` holds several `Config_*_spec.js` scenario files for the
    root `Config.js`, which stays flat — they do not move.
- `docs/agents/architecture/source-layout.md` and `docs/agents/architecture/testing.md`
  describe several of these directories' contents and the spec mirror. Update the relevant
  section in the same commit as the corresponding move. These docs are already stale in other
  places (e.g. they predate `services/application/`, `services/engine/`, `server/handlers/api/`)
  — do not attempt a broader cleanup here; touch only the lines about the directory being moved.
- No new top-level folder is introduced; no cross-agent contract. `models/configs/` (step 06)
  may be deferred with a one-line rationale in the commit message if the churn isn't justified.
