# Setup

Wiring `deku-swarm` into your application happens once, at startup: register a factory for every `Job` subclass you have, build the two singleton registries, then spin up the worker pool. This page walks through each piece; see [Running the Engine](./running-the-engine.md) for what comes after.

## Registering a `JobFactory`

```js
import { JobFactory } from 'deku-swarm';
import { GreetJob } from './jobs/GreetJob.js';

JobFactory.build('greet', { klass: GreetJob });
```

`JobFactory.build(name, options)` creates a `JobFactory` and registers it under `name`, so later code can enqueue jobs by that name (`JobRegistry.enqueue('greet', { name: 'World' })` — see [Job Lifecycle](./job-lifecycle.md)). `options` accepts:

| Option | Description |
|--------|-------------|
| `klass` | The `Job` subclass to instantiate. Defaults to the generic `Job` base class, which can't do any real work on its own — pass your own subclass explicitly. |
| `attributesGenerator` | An object exposing a `generate(attributes)` method, called on every `build()` before instantiation. Defaults to a fresh `IdGenerator`, which fills in a unique `id` when one isn't already given. Only override this if you need custom per-build attribute generation beyond unique IDs. |
| `attributes` | A fixed object merged into every job this factory builds (e.g. shared dependencies like a database client) — present alongside whatever params the caller supplies per job. |

Two more static methods round out the registry side:

- `JobFactory.get(name)` — retrieves a previously registered factory (used internally by `JobRegistry.enqueue`).
- `JobFactory.reset()` — clears every registered factory. Call this in test teardown to isolate examples from each other.

You register one `JobFactory` per distinct kind of work — call `JobFactory.build` once for each `Job` subclass your application defines.

## Building the `JobRegistry`

```js
import { JobRegistry } from 'deku-swarm';

JobRegistry.build({ cooldown: 2000, maxRetries: 3 });
```

`JobRegistry` is a static singleton facade managing every job queue (enqueued, processing, failed/cooling-down, retry, finished, dead — see [Job Lifecycle](./job-lifecycle.md)). Call `JobRegistry.build(options)` exactly once at startup:

| Option | Description |
|--------|-------------|
| `cooldown` | Milliseconds a failed job waits before it's eligible for retry. Defaults to `5000`. |
| `maxRetries` | Default retry ceiling applied to every job, unless a `Job` subclass overrides its own `get maxRetries()` (see [Defining Jobs](./defining-jobs.md)). Defaults to `3`. |

Calling `build()` a second time without an intervening `reset()` throws — use `JobRegistry.reset()` between test examples to destroy the singleton and allow a fresh `build()`. If your bootstrap path can run more than once per process, call `JobRegistry.ensureBuild(options)` instead: it builds on the first call and is a pure no-op (options ignored) afterwards, returning the existing instance.

## Building the `WorkersRegistry`

```js
import { WorkerFactory, WorkersRegistry } from 'deku-swarm';

WorkersRegistry.build({
  quantity: 5,
  factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry }),
});
WorkersRegistry.initWorkers();
```

`WorkersRegistry` is the equivalent static singleton facade for the worker pool. `WorkersRegistry.build(options)`:

| Option | Description |
|--------|-------------|
| `quantity` | The number of workers in the pool — i.e. how many jobs can run concurrently. |
| `factory` | Optional `WorkerFactory` instance. If omitted, a default one is built for you (with no logging — see below for why you'll usually want to inject your own). |

`WorkersRegistry.initWorkers()` then builds `quantity` workers via the factory and marks every one of them idle, ready to be handed jobs once the engine starts; it's idempotent, so a repeated call once the pool is populated does nothing. As with `JobRegistry`, `WorkersRegistry.reset()` destroys the singleton for test teardown. `WorkersRegistry.ensureBuild(options)` mirrors `JobRegistry.ensureBuild` — the idempotent variant to reach for when bootstrap may run more than once, building on the first call and a pure no-op (options ignored) after that.

## Wiring a `WorkerFactory`

The default `WorkerFactory` built internally by `WorkersRegistry` has no `loggerFactory`, so `perform()`'s `logContext` argument (see [Defining Jobs](./defining-jobs.md)) would be missing. In practice, inject your own:

```js
const loggerFactory = ({ workerId, jobId }) => ({
  debug: (msg) => console.debug(`[worker ${workerId}] [job ${jobId}]`, msg),
  info:  (msg) => console.info(`[worker ${workerId}] [job ${jobId}]`, msg),
  warn:  (msg) => console.warn(`[worker ${workerId}] [job ${jobId}]`, msg),
  error: (msg) => console.error(`[worker ${workerId}] [job ${jobId}]`, msg),
});

const workerFactory = new WorkerFactory({
  jobRegistry: JobRegistry,
  workersRegistry: WorkersRegistry,
  loggerFactory,
});

WorkersRegistry.build({ quantity: 5, factory: workerFactory });
WorkersRegistry.initWorkers();
```

`new WorkerFactory({ klass, attributesGenerator, jobRegistry, workersRegistry, loggerFactory })`:

| Option | Description |
|--------|-------------|
| `klass` | The `Worker` subclass to build. Defaults to the base `Worker` class — most consumers never need to subclass it. |
| `attributesGenerator` | Same role as on `JobFactory`: generates a unique `id` per worker by default. |
| `jobRegistry` / `workersRegistry` | Injected into every built worker, so it can report job outcomes and idle status back. |
| `loggerFactory` | A `({ workerId, jobId }) => logger` function; the returned logger must expose `debug`/`info`/`warn`/`error`. |

`jobRegistry`/`workersRegistry` here (and everywhere else `deku-swarm` accepts them — including `Engine`, covered in [Running the Engine](./running-the-engine.md)) don't have to be the static facade classes. Any object exposing the same method names works, so you can pass plain instances instead of singletons if your application prefers explicit dependency injection over global state.

## Putting it together

```js
import { Job, JobFactory, JobRegistry, WorkerFactory, WorkersRegistry } from 'deku-swarm';

class GreetJob extends Job {
  constructor({ id, name }) {
    super({ id });
    this.name = name;
  }

  async perform(logContext) {
    logContext.info(`Hello, ${this.name}!`);
  }
}

// 1. Register a factory that builds GreetJob instances under a lookup key
JobFactory.build('greet', { klass: GreetJob });

// 2. Build the singleton registries (once per process)
JobRegistry.build({ cooldown: 2000, maxRetries: 3 });
WorkersRegistry.build({
  quantity: 5,
  factory: new WorkerFactory({
    jobRegistry: JobRegistry,
    workersRegistry: WorkersRegistry,
    loggerFactory: ({ workerId, jobId }) => console,
  }),
});
WorkersRegistry.initWorkers();

// 3. Enqueue work
JobRegistry.enqueue('greet', { name: 'World' });
```

At this point the pool is idle and one job is waiting — nothing runs until you start the engine. Continue to [Running the Engine](./running-the-engine.md) for `Engine`, the loop that actually drives jobs to completion.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
