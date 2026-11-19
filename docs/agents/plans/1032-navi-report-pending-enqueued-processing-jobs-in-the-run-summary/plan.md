# Plan: Navi: report pending (enqueued/processing) jobs in the run summary

Issue: [1032-navi-report-pending-enqueued-processing-jobs-in-the-run-summary.md](../../issues/1032-navi-report-pending-enqueued-processing-jobs-in-the-run-summary.md)

## Overview

Add a `pending` count (`enqueued + processing`) to `LifetimeJobStats` and print it in `RunSummary` as a `Pending: N` line (only when N > 0, after the optional `Unresolved:` line). It stays outside the failure ratio and the exit code.

See [engine.md](engine.md) for the full plan.
