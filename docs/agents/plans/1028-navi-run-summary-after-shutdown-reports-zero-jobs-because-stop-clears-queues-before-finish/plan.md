# Plan: Navi: run summary after shutdown reports zero jobs because stop() clears queues before finish

Issue: [1028-navi-run-summary-after-shutdown-reports-zero-jobs-because-stop-clears-queues-before-finish.md](../../issues/1028-navi-run-summary-after-shutdown-reports-zero-jobs-because-stop-clears-queues-before-finish.md)

## Overview

On shutdown of a running engine, `EngineController#shutdown()` calls `stop()`, which runs `JobRegistry.clearQueues()` before `finishRun()` emits `finish`, so `RunReporter` and `FailureChecker` read an empty registry. The fix extracts a private `#drain()` from `stop()` and makes `shutdown()` drain without clearing, so the `finish` listener reports real counts. `RunReporter` also reads stats once and injects them into `FailureChecker`. Docs gain one line noting that `failure.threshold` applies on auto-shutdown.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

Behavioral contract (the docs agent documents what the engine agent implements):

- A shutdown of a **running** engine — `PATCH /engine/shutdown`, the UI shutdown button, or `web.idle_timeout` auto-shutdown — no longer clears the job queues. The final run summary and the `failure.threshold` check therefore reflect the jobs processed in the current segment (since the last `clearQueues()`), and the process exits 1 when the dead-job ratio exceeds `failure.threshold`.
- `stop()`, `restart()`, `reload()` (Stop/Restart/Reload buttons and their endpoints) still clear the queues, so a stop followed by a shutdown still reports 0 jobs (intended).

PR description (whoever opens the PR) must include a **Behavior change** paragraph:

> **Behavior change:** shutting down a running engine (`PATCH /engine/shutdown`, the UI button, or `web.idle_timeout`) now honors `failure.threshold`. These exits used to always return 0; they now exit 1 when the dead-job ratio exceeds the threshold.
