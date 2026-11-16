# README Engine section

The `### Engine` section of `deku-swarm/README.md` lists only `start` / `stop` / `pause` / `resume`. Bring it up to date with everything that shipped in Epic #1004. Keep each row short and link to the guide for details. Use absolute GitHub URLs if the README already links guides that way, since it is published to npm; otherwise use relative links.

- `shutdown({ timeoutMs })`: the graceful drain, resolving `true` or `false`. Mention that `start()` can resolve with work still in flight after a `false` result.
- `wake()`: ends the current sleep early. Pair it with `WorkerFactory`'s `onWorkerIdle`.
- `status` getter: the list of states.
- `snapshot()`: `{ status, startedAt, stoppedAt, lastTickAt, lastError }`.
- `on(eventName, handler)` with the `'crash'` event.
- Update the `stop()` row to say it is immediate and does not drain.

Also check the README's `WorkerFactory` / `JobRegistry` tables for the `onWorkerIdle` option and `prune()` / `retention` (shipped in #1010 / #1006). Add them only if they are missing, and keep the rows terse.

## Files to Change
- `deku-swarm/README.md` — `Engine` method table (plus `WorkerFactory` / `JobRegistry` rows if they are missing).
