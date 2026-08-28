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
| `stop()` | Requests the loop exit after the current iteration completes — it doesn't interrupt an iteration already in progress. |
| `pause()` / `resume()` | Suspend or resume job allocation without exiting the loop. While paused, the engine keeps ticking (still promoting ready jobs, still tracking idle timeout) but stops handing new jobs to workers. |

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

process.on('SIGTERM', () => {
  engine.stop();
});

await runPromise;
```

## What keeps the loop ticking

Each iteration, the engine decides whether to keep going based on a simple rule: in `keepAlive` mode it always continues; otherwise it continues exactly as long as there's a job somewhere in the system or a worker still busy. This is why, in one-shot mode, `start()` resolves as soon as the last job settles and the last worker goes idle — there's nothing left that could still produce more work — while in `keepAlive` mode the same condition has no effect on the loop, since only `stop()` can end it.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
