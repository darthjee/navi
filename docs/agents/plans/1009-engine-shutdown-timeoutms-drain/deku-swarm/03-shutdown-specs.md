# Jasmine specs for shutdown()
Add a new spec file. Follow the existing `Engine_spec.js` / `Engine_keep_alive_spec.js` patterns: DI'd `JobRegistry`/`WorkersRegistry` instances and the dummies under `spec/support/dummies`.

Cover:
- drain with `keepAlive: true`: the busy worker finishes, `shutdown()` → `true`, and `start()` resolves;
- timeout with a job still in `perform()` (a never-settling stub): `shutdown()` → `false`, and `start()` resolves anyway;
- an already-idle pool → `true` immediately;
- `#enqueued`, `#retryQueue` and `#failed` contents are unchanged after the drain;
- a cooling-down job is not promoted during the drain window;
- a second call returns the same result with a single drain, and the timeout is not reset;
- a call before `start()` resolves without throwing and does not start the loop;
- `start()` resolves while the queues still hold jobs;
- `timeoutMs` omitted or `0` resolves with the current pool state;
- `shutdown()` after `stop()` resolves immediately with `!hasBusyWorker()`;
- `stop()` during a drain resolves the pending `shutdown()` with the pool state at that moment.

Use small positive `sleepMs` values (e.g. `1`), or stubs that settle synchronously, so the timer-based `perform()` stubs can settle (see the Notes in the index). Keep the files under jscpd's duplication threshold by extracting shared setup into `spec/support/utils` if needed.

## Files to Change
- `deku-swarm/spec/services/Engine_shutdown_spec.js`: new.
- `deku-swarm/spec/support/utils/*`: shared helpers, only if needed.
