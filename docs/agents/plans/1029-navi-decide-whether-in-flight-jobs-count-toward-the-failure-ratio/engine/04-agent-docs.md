# Update agent docs
Bring the agent-facing docs in line with the new single ratio source:

- `docs/agents/flow/failure-handling.md` — replace the "`RunSummary` uses the same lifetime counts, so `RunSummary.failedJobs` includes `pruned.dead`" note: both `RunSummary` and `FailureChecker` read the ratio from `LifetimeJobStats.percentage`; in-flight jobs (`failed + retryQueue`) are excluded from the ratio and shown on an `Unresolved: N` summary line when N > 0.
- `docs/agents/deku-swarm.md` — in the auxiliary-services table, `FailureChecker` reads the ratio from `LifetimeJobStats.percentage` (it no longer computes it), and `RunSummary` takes a `LifetimeJobStats` and prints the optional `Unresolved` line; mention `LifetimeJobStats.percentage` where `LifetimeJobStats` is listed.

No user-facing guide documents the summary output, so none changes.

## Files to Change
- `docs/agents/flow/failure-handling.md` — ratio source + `Unresolved` line.
- `docs/agents/deku-swarm.md` — `FailureChecker` / `RunSummary` / `LifetimeJobStats` descriptions.
