# Status specs

Add `deku-swarm/spec/services/Engine_status_spec.js`, using `EngineSpecUtils` (`buildEngine`, `enqueueJobs`, `setup`) like `Engine_shutdown_spec.js`. Cases:

- `status` is `idle` and `snapshot()` has all timestamps and `lastError` `null` before `start()`.
- `running` while the loop runs (keepAlive, small positive `sleepMs`); `startedAt` and `lastTickAt` set, `stoppedAt` null.
- `paused` after `pause()` while running; back to `running` after `resume()`.
- `draining` during `shutdown({ timeoutMs })` with a busy worker (spy `WorkersRegistry.hasBusyWorker`).
- `stopping` right after `stop()` while the loop is still running.
- `stopped` after natural exit (no jobs, not keepAlive) and after `stop()`; `stoppedAt` set.
- `crashed` when a stubbed `JobRegistry.promoteReadyJobs` (or `allocator.allocate`) throws: `start()` rejects with the same error; `lastError` has `name`, `message`, numeric `at`; `'crash'` listener receives the original error.
- A throwing `'crash'` listener does not change the rejection reason.
- Restart after a crash: status `running`, `startedAt` refreshed, `lastError` kept.
- `snapshot()` is JSON round-trippable (`JSON.parse(JSON.stringify(s))` deep-equals `s`) and returns a fresh object each call (mutating it does not affect the next).

## Files to Change
- `deku-swarm/spec/services/Engine_status_spec.js` — new spec file.
