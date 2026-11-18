# Issue: Navi: run summary after shutdown reports zero jobs because stop() clears queues before finish

## Problem

When Navi is shut down while the engine is running, `EngineController#shutdown()` calls `stop()`, which runs `JobRegistry.clearQueues()` — resetting every collection **and** the `pruned` counters — before `finishRun()` emits `finish`. `RunReporter` then reads an empty registry, so the final run summary reports `Total: 0` / `Failed: 0 (0%)` and `FailureChecker` returns early on its `total === 0` guard.

The run's real counts are lost: a run that had a high dead-job ratio exits 0 and logs a misleading summary.

Surfaced while refining #1023 (edge-case analysis of `RunReporter`/`FailureChecker`).

## Expected Behavior

The run summary and failure-threshold check after a shutdown reflect the jobs processed during the run, not an emptied registry.

## Solution

**Don't clear the queues on shutdown.** Split `EngineController#stop()` into a private `#drain()` (set `stopping`, `engine.pause()`, wait for workers to go idle) followed by `JobRegistry.clearQueues()` + `stopped` + `emit('stop')`. `shutdown()`, when running, calls `#drain()` and transitions to `stopped` (still emitting `stop`, so log/emission/extraction buffers are cleared as today) but **never calls `clearQueues()`**. The registry keeps its counts, and the `finish` listener's `RunReporter.report()` reads them live.

`stop()`, `restart()` and `reload()` keep clearing queues exactly as today.

### Alternatives considered

- **Report before clearing** (`shutdown()` calls the reporter itself): rejected. It moves reporting out of the `finish` listener (double-report risk) and reports before workers drain.
- **Snapshot `JobRegistry.stats()` before `clearQueues()`** on the shutdown path and feed it to the reporter: works, but adds snapshot state, first-capture-wins logic and a flag on `stop()`. Clearing on shutdown has no value since the process is exiting, so skipping it is simpler.

Verified: `EngineController#shutdown()` is only reached via `Application.shutdown()` (from `EngineShutdownHandler`) and the engine's `onIdleTimeout`; after it, `finishRun()` runs and the app exits, so nothing reuses the registry in-process.

### Scope

"The run" keeps its current, documented meaning: **jobs processed since the last `clearQueues()`** (the current segment). The fix only ensures the clear triggered *by shutdown itself* no longer erases the counts before `finish` is reported. Process-lifetime reporting across stop/restart/reload is out of scope.

| Exit path | Today | In this issue |
|---|---|---|
| Running → shutdown (`PATCH /engine/shutdown`) | Reports 0 | **Fix** |
| Running → idle-timeout auto-shutdown (same `shutdown()` path) | Reports 0 | **Fix** (same change) |
| Paused → shutdown (`stop()` skipped, queues intact) | Correct | Regression test only |
| Stopped (Stop button) → shutdown | Reports 0 (queues cleared by the earlier Stop) | **Intended**: nothing ran since the stop, so 0 is correct under this scope |
| Natural finish (no web server, engine drains) | Correct | Regression test only |

Out of scope:

- Counting jobs across stop/restart/reload segments (lifetime-of-process counters surviving `clearQueues()`).

### Single stats read for reporter and checker

Today `RunReporter.report()` and `FailureChecker#loadStats()` each call `JobRegistry.stats()` independently. Unify them so a run is reported from **one** stats object:

- `RunReporter.report({ failureConfig })` reads `LifetimeJobStats.fromStats(JobRegistry.stats())` once (signature unchanged).
- It passes that same object to `new FailureChecker({ failureConfig, stats })`.
- `FailureChecker` no longer imports or reads `JobRegistry`; it works purely on the injected stats.

This guarantees the summary and the threshold check agree, and makes `FailureChecker` a pure function of its inputs (simpler specs).

### Edge cases

Rules the fix must satisfy (all hold with the chosen no-clear-on-shutdown solution):

1. **Workers still finishing jobs at shutdown.** Shutdown drains (waits for idle workers) before `finish` is reported, so jobs that complete during the drain are counted.
2. **Stale counts from an earlier restart or reload.** `restart()`/`reload()` still clear via `stop()`; no snapshot state exists, so a previous segment's counts can never be reported.
3. **Shutdown while a stop/restart/reload is in progress (state `stopping`).** `shutdown()` skips its own `stop()`, and the in-flight stop clears the queues, so the summary reports 0. **Accepted as intended**: per the Scope section, an explicit stop resets the counts. No coordination with the in-flight stop is added.
4. **Two shutdown requests (button + idle timeout, or repeated API calls).** Neither clears the queues, so a second call can't wipe the counts. `finish` still fires once, from `finishRun()`.
5. **Shutdown while paused.** No drain or clear happens; the live registry is correct. Regression test only.
6. **Shutdown with zero jobs processed.** Summary shows `Total: 0` and `FailureChecker` returns early on its `total === 0` guard. Correct; regression test only.
7. **Jobs still failed or in the retry queue at shutdown (`unresolved`).** The registry is not cleared, so `failed` + `retryQueue` remain and are included in the summary's `failedJobs`. Whether they belong in the failure ratio stays in #1029.

### Backward compatibility

Treated as a **bug fix**, not a breaking change:

- **Exit code after shutdown.** A shutdown of a running engine (`PATCH /engine/shutdown`, UI button, or `web.idle_timeout`) currently always exits 0, even with `failure.threshold` set. After the fix it exits 1 when the dead-job ratio exceeds the threshold. This aligns the code with what `configuration-schema.md` already documents for `failure.threshold`, but CI setups ending web-mode runs via `idle_timeout` may start failing, so:
  - Add a **"Behavior change"** paragraph to the PR description (the repo has no CHANGELOG; the PR description feeds the GitHub release notes), e.g.:
    > **Behavior change:** shutting down a running engine (`PATCH /engine/shutdown`, the UI button, or `web.idle_timeout`) now honors `failure.threshold`. These exits used to always return 0; they now exit 1 when the dead-job ratio exceeds the threshold.
  - Add one line to the `web.idle_timeout` row in `docs/guides/navi/configuration-schema.md` (and the equivalent rows in `prerequisites.md` / `reference.md` where present) stating that `failure.threshold` still applies on auto-shutdown.
- **Run summary log** after a shutdown now shows real `Total`/`Failed` numbers instead of 0. No action needed.

No impact:

- `FailureChecker`'s constructor gains `stats`. `RunReporter`/`FailureChecker` are internal (not exported from the package).
- The registry stays populated after shutdown. The web server is already going down and the process exits after `finishRun()`, so nothing observes it.
- `stop()`, `restart()`, `reload()` and the Stop button are unchanged.

### Testing strategy

**1. `EngineController` unit specs** (`source/spec/lib/services/engine/EngineController_lifecycle_spec.js`)

- `#shutdown` when running: does **not** call `JobRegistry.clearQueues()`; still pauses and waits for idle workers; ends in state `stopped` and emits `stop`; calls `engine.stop()`.
- `#shutdown` when paused: no drain, no clear, `engine.stop()` called (edge case 5).
- `#shutdown` called twice: the second call doesn't clear anything (edge case 4).
- `#shutdown` while a `stop()` is in progress (state `stopping`): skips its own drain; the in-flight stop's clear still happens. Documents the accepted behavior of edge case 3.
- Regression: `#stop`, `#restart`, `#reload` **still** call `clearQueues()`.

**2. `FailureChecker` unit specs** (`source/spec/lib/services/execution/FailureChecker_spec.js`)

- Rewrite to inject a `LifetimeJobStats` instead of seeding `JobRegistry`: over threshold → exit 1; within → no exit; `total === 0` → no exit; no `failureConfig` → no exit.
- Assert it never reads `JobRegistry` (e.g. with an empty registry it still uses the injected stats).

**3. `RunReporter` unit specs** (`source/spec/lib/services/execution/RunReporter_spec.js`)

- Reads `JobRegistry.stats()` **exactly once** per `report()`.
- Passes the same stats object to `FailureChecker`, so the summary line and the threshold verdict come from the same counts.

**4. Integration: the bug itself** (`source/spec/lib/services/application/Application_threshold_spec.js`, or a sibling `Application_shutdown_threshold_spec.js`)

- Web mode (`keepAlive`) with `failure.threshold`, jobs processed with a dead ratio above the threshold, then `Application.shutdown()`: the run summary shows the real `Total`/`Failed` (not 0) and `process.exit(1)` is called.
- Same setup with the ratio within the threshold: no exit, and the summary shows the real counts.
- Idle-timeout variant: auto-shutdown via `idle_timeout` yields the same outcome.
- Shutdown with zero jobs processed: summary `Total: 0`, no exit (edge case 6).

## Benefits

- The final run summary and the `failure.threshold` verdict reflect the jobs actually processed, including runs ended via shutdown or `web.idle_timeout`.
- CI pipelines that end web-mode runs by shutdown/idle timeout get a correct exit code instead of a silent 0.
- `FailureChecker` becomes a pure function of injected stats, and summary and verdict can never disagree.
