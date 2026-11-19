# Plan: Navi: exclude in-flight jobs from the failure ratio and report them separately

Issue: [1029-navi-decide-whether-in-flight-jobs-count-toward-the-failure-ratio.md](../../issues/1029-navi-decide-whether-in-flight-jobs-count-toward-the-failure-ratio.md)

## Overview
Make the run summary and the exit decision share one failure-ratio definition (terminal jobs only: `dead / (finished + dead)`, lifetime). The ratio moves to a `LifetimeJobStats.percentage` getter consumed by both `RunSummary` and `FailureChecker`; jobs left in `failed`/`retryQueue` are reported on a separate `Unresolved: N` line (only when N > 0).

See [engine.md](engine.md) for the full plan.
