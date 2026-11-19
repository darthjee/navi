# Engine Plan: Navi: report pending (enqueued/processing) jobs in the run summary

Main plan: [plan.md](plan.md)

## Overview

Expose never-attempted / never-completed work in the final run summary. `JobRegistry.stats()` already returns `enqueued` and `processing`. `LifetimeJobStats` gains a `pending` field computed from them, and `RunSummary` prints `Pending: N` when it is > 0. `FailureChecker`, `RunReporter` (production code) and the exit code are unchanged.

## Context

- #1029 added `LifetimeJobStats.unresolved` (`failed + retryQueue`) and the conditional `Unresolved: N` line in `RunSummary` (`#unresolvedLines()`). This change mirrors that pattern exactly.
- `processing` is folded into `Pending` (no separate label): `pause()`/`shutdown()` wait for workers to go idle, so it is normally 0 at shutdown.
- All job collections in `JobRegistryInstance` are disjoint, so nothing is double-counted.

## Steps

- [01 — Add `pending` to LifetimeJobStats](engine/01-lifetime-job-stats-pending.md)
- [02 — Print the `Pending:` line in RunSummary](engine/02-run-summary-pending-line.md)
- [03 — RunReporter regression spec](engine/03-run-reporter-spec.md)
- [04 — Update agent docs](engine/04-agent-docs.md)

## CI Checks

- `source`: `cd source && npm test` (CI job: `jasmine`)
- `source`: `cd source && npm run lint` and `npm run report` (CI job: `checks`)
- `source`: `cd source && npm run check_docs` (JSDoc must stay pedantic-clean)

## Notes

- `pending` must default to `0` in the constructor so existing callers/specs that build `new LifetimeJobStats({ total, dead, unresolved })` keep working (e.g. `RunSummary_spec`'s `build` helper, `FailureChecker_spec`).
- No user-facing guide documents the summary output, so the `docs` agent has no work.
