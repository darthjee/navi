# Frontend Plan: Reduce Codacy duplication in EngineControls spec

Main plan: [plan.md](plan.md)

## Overview
`frontend/spec/components/EngineControls_spec.js` (179 lines) has four `describe`s — running, paused, stopped, transitioning — that each repeat the same `beforeEach` (stub `fetch` with `{ status: '<state>' }`, render, flush) and the same per-button `it` blocks (`renders the X button` / `does not render the X button`). Codacy reports 18 clones / 178 duplicated lines for it. The fix is spec-only: no production code changes.

## Context
- The spec renders `EngineControls` (`frontend/src/components/elements/EngineControls.jsx`, view logic in `controllers/EngineControlsController.jsx`, markup in `helpers/EngineControlsHelper.jsx`) and looks up buttons by visible text through a local `findButtonByText`.
- Current expectations per fetched `status`:

  | status | rendered buttons | not rendered |
  | --- | --- | --- |
  | `running` | Pause, Stop, Restart, Reload, Shut Down | Continue, Start |
  | `paused` | Stop, Restart, Reload, Continue, Shut Down | Pause, Start |
  | `stopped` | Start, Shut Down | Pause, Stop, Restart, Reload, Continue |
  | `pausing` (transitioning) | Shut Down (plus a `[role="status"]` spinner) | Pause, Stop, Restart, Reload, Continue, Start |

  Additionally: `running` also asserts `Engine` label text; the `fetch fails` (`{ ok: false, status: 500 }`) describe asserts only the `Engine` label.
- `frontend/spec/support/async.js` already exports `flushAsync` (same body as the spec's local copy); `frontend/spec/support/fetch.js` exports `stubFetchSuccess(data)` (same stub as the inline `spyOn(globalThis, 'fetch')` in each `beforeEach`) and `mockFetchFailure(status)`. `support/` is where any new shared helper belongs.
- Sibling refactors (#879–#882) followed the same approach; see `frontend/spec/support/dropdown.js` / `fetched_menu.js` from #882 for the house style of table/helper-driven specs.

## Implementation Steps

### Step 1 — Table-drive the per-state button scenarios
Replace the running / paused / stopped `describe`s with a single table-driven block, e.g. a `scenarios` map keyed by state name (`running`, `paused`, `stopped`, `transitioning`) with `{ status, rendered: [...], absent: [...] }`, and generate for each entry:
- one `describe('when engine is <state>')` whose `beforeEach` uses `stubFetchSuccess({ status })`, `renderControls(state.root)` and the shared `flushAsync`;
- one `it('renders the <X> button')` per name in `rendered` (asserting `findButtonByText(...)` is not null) and one `it('does not render the <X> button')` per name in `absent` (asserting it is null) — keeping today's descriptions exactly so failures read the same.

Keep every assertion that exists today (including the `Engine` label check under `running` and `renders the Shut Down button` under every state, which becomes a `rendered` entry rather than a hand-written `it`). The transitioning state may join the same table for its button assertions, but the `renders a spinner` check and the single `does not render action buttons` `it` (six assertions) must be preserved — either as an extra hook on the entry or as a small hand-written `describe` — whichever reads clearer. Do not collapse per-button `it`s into one loop inside a single `it`, so each state/button pair stays individually reported.

### Step 2 — Reuse shared helpers and tidy the fetch-failure case
Drop the spec's local `flushAsync` in favour of `import { flushAsync } from '../support/async.js'`, and use `stubFetchSuccess` / `mockFetchFailure(500)` from `../support/fetch.js` instead of the inline `spyOn(globalThis, 'fetch')` blocks. Keep the `when fetch fails` describe with its `Engine` label assertion. Only add a new helper under `frontend/spec/support/` if a piece is genuinely reusable by other specs; otherwise keep the table and generator local to the spec. Afterwards confirm the number of `it`s is unchanged (or intentionally identical in name and assertion) by comparing `yarn spec` output before and after, and check via Codacy (or `yarn report` / jscpd if useful) that the clone count for the file dropped.

## Files to Change
- `frontend/spec/components/EngineControls_spec.js` — replace hand-copied per-state `describe`/`it` blocks with a table-driven generator; reuse `flushAsync`, `stubFetchSuccess`, `mockFetchFailure` from `support/`
- `frontend/spec/support/*.js` — only if a genuinely shared helper emerges (not expected; the existing helpers should suffice)

## CI Checks
- `frontend`: `cd frontend && yarn lint` (CI job: `checks-frontend`)
- `frontend`: `cd frontend && yarn test` (CI job: `jasmine-frontend`)

## Notes
- Spec-only change: no edits to `frontend/src/` and no change to what is verified.
- Readability wins over maximal de-duplication: if a table entry needs special hooks that make it hard to follow, keep that state (e.g. transitioning) as a small explicit `describe` instead.
- Codacy's figures (144 lines) are from `f25bf98`; the file is now 179 lines, so exact clone counts will differ — the goal is a markedly lower count, not a specific number.
