# Plan: Reduce Codacy duplication in EngineController spec

Issue: [875-reduce-codacy-duplication-in-enginecontroller-spec.md](../../issues/875-reduce-codacy-duplication-in-enginecontroller-spec.md)

## Overview
`EngineController_spec.js` repeats setup and expectation blocks across its per-method `describe`s. Collapse them into tables and spec-local helpers so every scenario is still verified but each variation costs one line instead of a copied block. Only spec code changes; `source/lib/` is untouched.

## Context
Codacy reports 18 clones / 190 duplicated lines in this file (project goal: 10% repository duplication). The top-level `beforeEach` already builds the shared `controller`, so the duplication lives in the per-method blocks. Prior sibling refactors (#870–#874) put reusable helpers in `source/spec/support/utils/` or `support/factories/`; helpers used only by this spec stay local to the file.

## Implementation Steps

### Step 1 — Deduplicate `#buildEngine`, `#bind`, `#start` and `.build`
- `#buildEngine`: the three idle-timeout scenarios share `localController` construction, `spyOn(localController, 'shutdown')`, the `promoteReadyJobs` iteration-counter fake and `await engine.start()`. Extract a local helper, e.g. `runEngineUntil({ config, stopWhen })`, that builds the controller from a given `config`, spies on `shutdown`, stops the engine when `stopWhen(iterations, localController)` is true, runs `engine.start()` and returns the controller. Keep the three `it`s (they differ in `webConfig` and expectation) but reduce each to config + expectation. Preserve the 20000-iteration safety net in the first scenario and the 5-iteration stop in the others.
- `#bind`: replace the three "clears … when the engine emits stop" scenarios with a single table, one row per store (log buffers, emission store, extraction store), each with a description, a `seed` function (no-op for the log-buffers row) and an `assert` function; generate one `it` per row via `forEach`. Each row's `it` binds the reporter, emits `stop`, then runs its `assert`. Keep the standalone `finish` scenario as is.
- `#start`: parameterise the two scenarios (`shouldAutostart` true/false) into a table with the expected state and whether `pause` is called, sharing the controller / fake-engine construction. Preserve the `pause`-called-before-state-`stopped` semantics of the `false` row and the `start-result` return assertion.
- `.build`: extract the shared `configStore` / `reporter` construction into a local factory used by both scenarios.

### Step 2 — Deduplicate lifecycle, `#shutdown` and `#finishRun` blocks, then verify
- `#continue` / `#resumeProcessing` / `#resumeProcessing { enqueue: false }`: fold the repeated "does nothing / returns undefined when not <state>" scenarios and the repeated `await controller.stop(); spyOn(controller.engine, 'emit')` preambles into small local helpers or tables. Keep the distinct assertions (engine not replaced, `resume` called, state, `enqueueResources` calls, return value, emitted `start`).
- `#restart` / `#reload`: share the "stops then resumes, in order" and "does nothing when not running" blocks via a table keyed by method name (`restart`, `reload`); keep the `reloadConfig`-specific scenarios (`toHaveBeenCalledBefore` ordering and the not-called assertion when not running) explicit.
- `#shutdown`: the "stops the engine" scenario is duplicated in both the "server controller present" and "no server controller" contexts — hoist it into a shared example run in each context (or a `forEach` over the two contexts) so it appears once.
- `#finishRun`: leave as is unless a clone remains after re-running the analysis.
- Verify: run the spec, lint and duplication report (see CI Checks), confirm the scenario count and assertions are unchanged (compare `it` count / `expect` set before and after, expanding tables), and confirm Codacy-relevant duplicated lines dropped.

## Files to Change
- `source/spec/lib/services/engine/EngineController_spec.js` — replace repeated blocks with tables and local helpers, keeping every scenario and assertion
- `source/spec/support/utils/` — only if a helper turns out to be reusable by other specs; otherwise no change

## CI Checks
- `source`: `cd source && npm run spec` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` (CI job: `lint-and-report`)
- `source`: `cd source && npm run report` — jscpd duplication report, to confirm fewer clones for this file

## Notes
- No production code changes; if a refactor needs one, stop and reconsider rather than change `source/lib/`.
- Line numbers cited in the issue come from `main` at `f25bf98`; the spec has since grown (531 lines), so locate blocks by `describe` name.
- Prefer readability over maximal de-duplication: if a table makes a failing spec harder to read (e.g. the `#reload`-specific `reloadConfig` ordering), keep that scenario explicit.
- Table-generated `it` names must stay unique and descriptive so a failing row is identifiable from the output.
