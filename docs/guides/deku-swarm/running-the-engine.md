# Running the Engine

`Engine` drives the main processing loop: on every tick it promotes cooling-down jobs that are ready to retry, allocates ready jobs to idle workers, and (optionally) watches for sustained idleness. Build one after [Setup](./setup.md) has registered your factories and built the registries.

## Constructing an `Engine`

```js
import { Engine } from 'deku-swarm';

const engine = new Engine({
  sleepMs: 500,
});
```

Omitting `jobRegistry` / `workersRegistry` (as above) wires the `JobRegistry` / `WorkersRegistry` static facades automatically; pass them — or your own instances — explicitly only when you want that dependency injection to be visible at the call site.

| Option | Description |
|--------|-------------|
| `jobRegistry` / `workersRegistry` | Optional. Default to the `JobRegistry` / `WorkersRegistry` static facades when omitted. Pass any object exposing the same method names — the static facades directly, or your own instances for explicit dependency injection. |
| `allocator` | Optional `WorkersAllocator`. Defaults to one built from `jobRegistry`/`workersRegistry`; most consumers never need to override this. |
| `sleepMs` | Milliseconds to wait between loop ticks. Defaults to `500`. A negative value disables sleeping entirely — useful in tests, where you want ticks to run back-to-back with no real delay. |
| `keepAlive` | When `true`, the loop never exits on its own — only an explicit `stop()` call ends it. Use this for a long-lived process (e.g. a server that accepts new work over time). Defaults to `false`. |
| `idleTimeoutMs` | Milliseconds of sustained idleness (no jobs pending and no busy workers) before `onIdleTimeout` fires. `0` (the default) disables idle tracking entirely. |
| `onIdleTimeout` | Callback invoked (without being awaited) at most once per idle window, once `idleTimeoutMs` is crossed. Any activity resets the window and re-arms the callback for the next idle stretch. |

## Controlling the loop

| Method | Description |
|--------|-------------|
| `async start()` | Runs the loop until it decides to stop (see below) or `stop()` is called. Resolves once the loop actually exits. |
| `stop()` | Immediate, non-draining exit: requests the loop exit after the current iteration completes — it doesn't interrupt an iteration already in progress, and doesn't wait for busy workers. |
| `async shutdown({ timeoutMs })` | Awaitable graceful drain. Resolves `true` when no worker is busy any more, `false` on timeout. See [Graceful shutdown](#graceful-shutdown). |
| `pause()` / `resume()` | Suspend or resume job allocation without exiting the loop. While paused, the engine keeps ticking (still promoting ready jobs, still tracking idle timeout) but stops handing new jobs to workers. |
| `wake()` | Ends the current sleep right away so the next tick runs immediately. A no-op when the loop is not running. See [Waking the loop early](#waking-the-loop-early). |

## Waking the loop early

After each tick the engine sleeps `sleepMs`, so a job freed by a finished worker can wait up to that long before the next allocation. To avoid the wait, have the worker call `engine.wake()` as soon as it goes idle. `WorkerFactory` accepts an `onWorkerIdle` hook (no arguments, called right after the worker is marked idle), and since the engine is usually built after the factory, wire it through a late-bound closure:

```js
let engine;

const workerFactory = new WorkerFactory({
  jobRegistry: JobRegistry,
  workersRegistry: WorkersRegistry,
  onWorkerIdle: () => engine?.wake(),
});

WorkersRegistry.build({ quantity: 5, factory: workerFactory });
WorkersRegistry.initWorkers();

engine = new Engine({ sleepMs: 500 });
```

`wake()` ends the current sleep immediately in every mode (running, paused, draining), so the next tick runs right away. If it is called while a tick is in progress, the next sleep returns immediately once. Calling it when the loop is not running does nothing, and it never starts the loop. This speeds up both allocation and a `shutdown()` drain. An error thrown by `onWorkerIdle` is caught and logged at `warn`; it never affects the job result.

Nothing is subscribed automatically: without this wiring the engine keeps plain `sleepMs` polling.

## One-shot vs. `keepAlive` mode

By default (`keepAlive: false`), the loop is **one-shot**: it keeps ticking only while there's at least one job somewhere in the system (enqueued, cooling down, or in the retry queue) or at least one worker still busy. Once every job has finished or died and every worker has gone idle, `start()` resolves on its own — no `stop()` call needed. This is the right mode for CLI tools and batch jobs: enqueue everything up front, `await engine.start()`, and the process naturally winds down when the work is done.

```js
JobRegistry.enqueue('greet', { name: 'World' });
JobRegistry.enqueue('greet', { name: 'Navi' });

await engine.start(); // resolves once both jobs have finished (or died)
```

With `keepAlive: true`, the loop never exits by itself — it's meant for a long-lived process where new work can be enqueued at any time from elsewhere (a web server handling incoming requests, for example). You stop it explicitly, typically on shutdown:

```js
const engine = new Engine({
  jobRegistry: JobRegistry,
  workersRegistry: WorkersRegistry,
  keepAlive: true,
});

const runPromise = engine.start(); // does not resolve until stop() is called

process.on('SIGTERM', async () => {
  const drained = await engine.shutdown({ timeoutMs: 10000 });
  if (!drained) console.warn('shutdown timed out with jobs still running');
});

await runPromise;
```

`stop()` is still available for an immediate exit that does not wait for in-flight jobs. See [Graceful shutdown](#graceful-shutdown) for the drain.

## Graceful shutdown

`shutdown({ timeoutMs })` stops the engine without abandoning work that is already running. It waits for busy workers to finish and resolves a `Promise<boolean>`: `true` when no worker is busy any more, `false` when `timeoutMs` elapsed with work still in flight.

```js
const drained = await engine.shutdown({ timeoutMs: 10000 });
```

While draining, the loop keeps ticking but skips promoting ready jobs, allocating jobs to workers and idle-timeout tracking. `engine.status` is `'draining'`. `keepAlive` is never modified: the drain overrides it only for the loop-exit decision.

Guarantees:

- `true` means no job is mid-`perform()`.
- Jobs in `enqueued`, `retryQueue` and `failed` are kept untouched, not lost.
- `start()` resolves when the drain ends, so the process may exit without calling `stop()`.

Caveats:

- **`start()` resolves even after a timed-out drain**, with jobs still running. "The loop ended" does not mean "all jobs finished".
- Running `perform()` calls are never cancelled or interrupted.
- Retry promotion is frozen: a `failed` job whose cooldown elapses during the drain stays in `failed` until a later run. This is intended, not a lost retry.
- The timeout is checked once per tick, so it can overshoot by up to one `sleepMs`. Wire `onWorkerIdle` to `wake()` (see [Waking the loop early](#waking-the-loop-early)) so the loop notices a drained pool right away.

Edge cases:

| Situation | Result |
|-----------|--------|
| Before `start()`, after the loop exited, or after `stop()` | Resolves immediately with `!hasBusyWorker()`. Never throws and never starts the loop. |
| A second call while draining | Returns the same promise; the timeout is not reset. |
| `timeoutMs` omitted, `0` or negative | No wait: resolves immediately with the current pool state, and the loop exits at its next tick. |
| `stop()` during a drain | The loop ends at the next tick and the pending `shutdown()` resolves with `!hasBusyWorker()` at that moment. |
| The loop crashes during a drain | The pending promise still resolves with `!hasBusyWorker()`. |

## What keeps the loop ticking

Each iteration, the engine decides whether to keep going based on a simple rule: in `keepAlive` mode it always continues; otherwise it continues exactly as long as there's a job somewhere in the system or a worker still busy. This is why, in one-shot mode, `start()` resolves as soon as the last job settles and the last worker goes idle — there's nothing left that could still produce more work — while in `keepAlive` mode the same condition has no effect on the loop, since only `stop()` can end it.

During a [graceful shutdown](#graceful-shutdown) this rule is replaced by "continue only while a worker is busy and the timeout has not elapsed", regardless of `keepAlive` or queued jobs.

## Observing engine status

The engine exposes its state so you can report it (for example from a health endpoint) without reaching into its internals.

`engine.status` is a getter returning one of:

| Status | When it applies |
|--------|-----------------|
| `'idle'` | `start()` was never called. |
| `'running'` | The loop is running normally. |
| `'paused'` | The loop is running but `pause()` was called (no new jobs are allocated). |
| `'draining'` | `shutdown()` is in progress. |
| `'stopping'` | `stop()` was called and the loop has not yet exited. |
| `'stopped'` | The loop exited and the last run did not throw. |
| `'crashed'` | The loop exited because the last run threw. |

While the loop is running, precedence is `stopping` (after `stop()`) > `draining` (during `shutdown()`) > `paused` > `running`.

`engine.snapshot()` returns a fresh plain, serializable object on every call:

```js
app.get('/health', (req, res) => {
  res.json(engine.snapshot());
});

// {
//   status: 'running',
//   startedAt: 1700000000000,   // epoch ms, or null if never started
//   stoppedAt: null,            // null while running or never run
//   lastTickAt: 1700000005000,  // epoch ms of the last loop tick, or null
//   lastError: null             // or { name, message, at }
// }
```

When the loop throws, the engine records the error in `lastError` (`{ name, message, at }`, with `at` in epoch ms), moves to `'crashed'`, and emits a `'crash'` event with the original `Error`:

```js
engine.on('crash', (error) => {
  console.error('engine crashed', error);
});

try {
  await engine.start();
} catch (error) {
  // start() still rejects with the same error that 'crash' listeners received
}
```

A listener that throws never replaces the rejection reason of `start()`.

Calling `start()` again moves the engine back to `'running'`, refreshes `startedAt` and clears `stoppedAt`. `lastError` is kept across the restart until a new crash overwrites it.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
