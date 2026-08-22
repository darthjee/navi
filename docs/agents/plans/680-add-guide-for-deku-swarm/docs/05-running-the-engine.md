# Running the engine sub-page

Create `docs/guides/deku-swarm/running-the-engine.md` covering `Engine` (`worker/lib/services/Engine.js`):

- Constructor options: `jobRegistry`/`workersRegistry` (required — any object exposing the same method names as the static facades), `allocator` (optional `WorkersAllocator`, defaults to one built from the two registries), `sleepMs` (ms between loop ticks, default `500`; negative disables sleeping — useful in tests), `keepAlive` (default `false`; when `true` the loop never exits on its own, only `stop()` ends it — for long-lived processes like a web UI), `idleTimeoutMs` (ms of sustained idleness before `onIdleTimeout` fires; `0` default disables tracking), `onIdleTimeout` (callback invoked at most once per idle window).
- `async start()` — runs the loop until it should stop or `stop()` is called.
- `stop()` — requests the loop exit after the current iteration.
- `pause()` / `resume()` — suspend/resume job allocation without exiting the loop.
- One-shot vs. keepAlive mode: contrast the default (`keepAlive: false`, loop exits once there are no jobs and no busy workers — good for CLI/batch use) against `keepAlive: true` (good for a long-lived server process waiting for new work to be enqueued from elsewhere).
- The `#shouldContinue()` internal loop-continuation logic — explain conceptually (what makes the engine decide to keep ticking) so readers can predict when their process will/won't exit, without exposing it as callable API.
- Two runnable examples: a one-shot run (`await engine.start()` until drained) and a `keepAlive: true` run paired with `stop()` from elsewhere (e.g. on process shutdown).

## Files to Change

- `docs/guides/deku-swarm/running-the-engine.md` — new sub-page.
