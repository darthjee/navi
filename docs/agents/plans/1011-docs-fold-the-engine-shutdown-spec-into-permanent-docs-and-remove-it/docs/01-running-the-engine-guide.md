# Running-the-engine guide

In `docs/guides/deku-swarm/running-the-engine.md`:

1. **"Controlling the loop" table.** Add a `shutdown({ timeoutMs })` row: an awaitable graceful drain that resolves `true` when drained and `false` on timeout, linking to [Graceful shutdown](#graceful-shutdown). Update the `stop()` row to say it is the immediate, non-draining exit.
2. **New `## Graceful shutdown` section.** Add it after "One-shot vs. `keepAlive` mode" or right after "Controlling the loop", whichever reads better. It covers:
   - a short usage snippet (`const drained = await engine.shutdown({ timeoutMs: 10000 });`);
   - what happens during the drain: the loop keeps ticking but stops promoting, allocating and tracking idle timeout; `status` is `'draining'`;
   - guarantees: `true` means no job is mid-`perform()`; pending jobs in `enqueued` / `retryQueue` / `failed` are kept; the process may exit after `start()` resolves without calling `stop()`.
   - **caveats** as a clearly marked list:
     - `start()` resolves even after a timed-out drain, with jobs still running, so "loop ended" does not mean "all jobs finished";
     - running `perform()` calls are never cancelled;
     - retry promotion is frozen, so a cooling job stays in `failed` until a later run (intended);
     - the timeout can overshoot by up to one `sleepMs`. Link to [Waking the loop early](#waking-the-loop-early) for the `onWorkerIdle` → `wake()` wiring.
   - an edge-case table: before `start()` / after exit / after `stop()`; a second call; `timeoutMs` omitted or `0`; `stop()` during a drain.
3. **`keepAlive` example.** Change the `SIGTERM` handler to drain gracefully. For example:

   ```js
   process.on('SIGTERM', async () => {
     const drained = await engine.shutdown({ timeoutMs: 10000 });
     if (!drained) console.warn('shutdown timed out with jobs still running');
   });
   ```

   Keep `await runPromise;`. Add one sentence saying `stop()` is still available for an immediate exit that does not wait for in-flight jobs.
4. **"What keeps the loop ticking".** Add one sentence: during a drain the rule is replaced by "continue only while a worker is busy and the timeout has not elapsed", regardless of `keepAlive` or queued jobs.

## Files to Change
- `docs/guides/deku-swarm/running-the-engine.md` — the method row, the new Graceful shutdown section, the SIGTERM example and the loop-rule note.
- `docs/guides/HOW_TO_USE_DEKU_SWARM.md` — optional: mention graceful shutdown in the Running the Engine index entry.
