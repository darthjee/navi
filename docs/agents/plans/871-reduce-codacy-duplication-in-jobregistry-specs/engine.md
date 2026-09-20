# Engine Plan: Reduce Codacy duplication in JobRegistry specs

Main plan: [plan.md](plan.md)

## Overview
All the work is in `source/spec/`, which the `engine` agent owns. No production code changes. The same six job-lifecycle scenarios (enqueued, processing, finished, failed, retryQueue, dead) are re-declared in `jobsByStatus`, `jobById` and `stats`, and the three-line "exhaust a job" `try { job._fail(new Error()); } catch {}` block is copied in several specs. The plan adds two helpers under `source/spec/support/utils/` and rewrites the specs to use them, keeping every assertion.

## Context
Codacy reports 18% duplication (goal 10%); the five files below carry the most clones. See the issue for the per-file figures. Recent sibling issues (#868, #869, #870) took the same approach — extending helpers in `source/spec/support/utils/` — so follow that style.

## Steps

- [01 — Add exhaust helper and apply it](engine/01-add-exhaust-helper.md)
- [02 — Add shared job scenarios helper](engine/02-add-job-scenarios-helper.md)
- [03 — Rewrite jobsByStatus / jobById specs](engine/03-rewrite-jobsbystatus-jobbyid.md)
- [04 — Migrate and table-drive the stats spec](engine/04-migrate-stats-spec.md)
- [05 — Trim pick, retryJob and fail specs](engine/05-trim-pick-retryjob-fail.md)

## CI Checks
- `source`: `docker compose run --rm navi_tests bash -c "yarn coverage && yarn lint && yarn report"` (CI jobs: `jasmine`, `checks`; the `yarn report` JSCPD run is the local proxy for the Codacy duplication metric)

## Notes
- Prefer readability over maximal de-duplication: a failing table-driven case must still name its scenario in the `describe`/`it` text.
- Do not reduce coverage of scenarios or assertions; verify by comparing the spec/expectation counts before and after (`yarn spec` output).
- The exhaust helper must be applied everywhere `_fail(...)` is wrapped in `try/catch` in `source/spec` (decided in the issue discussion): `JobRegistry_jobsByStatus_spec.js`, `_stats_spec.js`, `_fail_spec.js`, `_retryJob_spec.js` and `lib/services/execution/FailureChecker_spec.js`. `EmitJob_spec.js` defines its own local `fail` arrow (a single call with a custom error) — fold it into the helper only if the signature fits cleanly; otherwise leave it. `support/dummies/models/DummyJob.js` is production-like dummy code, not a spec idiom — leave it.
- `JobRegistry_stats_spec.js` currently passes a `ClientRegistry` to the job factory attributes; confirm the migrated specs pass without `clients` (its `enqueue` calls only pass `parameters`).
