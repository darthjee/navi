# Correct the engine-shutdown spec
The spec is the source of truth, and #1009 changed one of its pinned rules.
- `edge-cases.md`: replace the "While `#stopped` is already set — drains using the same rules; `stop()` state does not abort an in-progress drain" row with: "Resolves immediately with `!hasBusyWorker()`, like the loop-already-exited case, and never restarts the loop." Add a row: "`stop()` during a drain: the loop ends at the next tick, and the pending `shutdown()` resolves with `!hasBusyWorker()` at that moment."
- `open-questions.md`: resolve **Drain-observation granularity (#1009)**. Tick granularity is accepted, the timeout overshoots by at most one `sleepMs`, and #1010's hook tightens the drained case.
- `testing.md`: add the two `stop()` cases and the `timeoutMs: 0` case to the `Engine (#1009)` list.

## Files to Change
- `docs/agents/specs/engine-shutdown/edge-cases.md`
- `docs/agents/specs/engine-shutdown/open-questions.md`
- `docs/agents/specs/engine-shutdown/testing.md`
