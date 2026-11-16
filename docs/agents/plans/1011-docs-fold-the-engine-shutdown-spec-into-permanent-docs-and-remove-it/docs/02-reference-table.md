# Reference table

In the `Engine` method table of `docs/guides/deku-swarm/reference.md`, add a row after `stop()`:

`shutdown({ timeoutMs })`: returns `Promise<boolean>`. It stops promotion, allocation and idle tracking, then waits until no worker is busy (`true`) or `timeoutMs` elapses (`false`). `start()` resolves in both cases. In-flight jobs are never cancelled and queued jobs are kept. `timeoutMs` omitted or `0` resolves immediately with the current pool state, and repeated calls share one promise. Link to `./running-the-engine.md#graceful-shutdown`.

Also clarify that the `start()` row's "until it should stop" includes a `shutdown()` drain ending.

## Files to Change
- `docs/guides/deku-swarm/reference.md` — add the `shutdown()` row and adjust the `start()` row.
