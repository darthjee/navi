# Engine Plan: Reduce the size of EmitJob_spec.js

Main plan: [plan.md](plan.md)

## Overview
`source/spec/lib/jobs/EmitJob_spec.js` (588 lines) covers `#constructor`, `#arguments`, `#perform` (~200 lines), emission tracking (~170 lines), `#maxRetries` and `#cooldown`. Its helpers (`rebuildJob`, `performIgnoringFailure`, `firstRecord`, `itForwardsToClientEmit`) close over the spec's `let` variables (`emit`, `clients`, `client`, `parameters`, `job`, `logContext`), so they must be turned into a shared, context-based support util before the file can be split.

Follow the approach from #932 (`ResourceRequest_spec.js` → `source/spec/lib/models/request/resource_request/ResourceRequest_<topic>_spec.js` + `ResourceRequestSpecUtils`).

## Context
- ESLint `max-lines` is `warn` at 300 in `source/eslint.config.mjs`; `yarn lint` must report no warning for the new files.
- `jscpd` (`yarn report`) checks duplication across `lib` and `spec`, so the shared `beforeEach` setup must live in the util instead of being copied into each file.
- Behaviour covered must be identical: same `describe`/`it` cases, same expectations.

## Steps

- [01 — Extract EmitJobSpecUtils](engine/01-extract-emit-job-spec-utils.md)
- [02 — Split the spec into three files](engine/02-split-the-spec.md)
- [03 — Verify size, lint and coverage](engine/03-verify.md)

## CI Checks
- `source`: `yarn spec` / `npm run coverage` (CI job: `jasmine`)
- `source`: `yarn lint` and `yarn report` via `scripts/ci.sh lint-and-report source` (CI job: `checks`)

## Notes
- File names and the split are suggestions from the issue; a different split is fine as long as each file stays under 300 lines and stays readable.
- `#perform` plus `#constructor`/`#arguments` and imports should land around 250–280 lines. If it gets close to 300, move `namespace-aware client resolution` and/or the `emit headers forwarding`/`body_template` blocks into a separate `EmitJob_perform_request_spec.js`.
