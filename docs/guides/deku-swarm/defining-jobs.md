# Defining Jobs

Every unit of work `deku-swarm` processes is a `Job` subclass. `Job` itself is abstract — it carries the bookkeeping the queue/retry machinery needs, and expects you to override `perform()` with the actual work.

## Subclassing `Job`

```js
import { Job } from 'deku-swarm';

class GreetJob extends Job {
  constructor({ id, name }) {
    super({ id });
    this.name = name;
  }

  async perform(logContext) {
    logContext.info(`Hello, ${this.name}!`);
  }
}
```

- `constructor({ id })` — `id` is the job's unique identifier. Subclasses must call `super({ id })`, then attach whatever attributes their own `perform()` needs (here, `name`). You rarely construct a job directly with `new` — see [Setup](./setup.md) for registering a `JobFactory` that builds instances (and generates `id`s) for you.
- `async perform(logContext)` — the method you override with the job's actual work. Resolving marks the job **finished**; throwing marks it **failed** (and, depending on retry state, either re-queued for a later attempt or moved to the dead collection — see [Job Lifecycle](./job-lifecycle.md)).

## The `logContext` argument

`perform()` receives a `logContext` — a logger-like object exposing `debug`, `info`, `warn`, and `error`. It comes from the `loggerFactory` function you supply when building your `WorkerFactory` (`({ workerId, jobId }) => logger`, see [Setup](./setup.md)); `deku-swarm` never assumes a particular logging library, so use `logContext` for anything you'd otherwise reach for `console` to do.

## Retry behavior

```js
class FlakyJob extends Job {
  get maxRetries() {
    return 1; // fail once and the job goes straight to dead
  }

  async perform() {
    // ...
  }
}
```

- `constructor({ id, maxRetries, cooldown })` — besides `id`, a job can also carry its own `maxRetries`/`cooldown`, both optional. Pass them when you need a *per-instance* retry policy (e.g. computed from the job's own attributes) rather than one fixed per job class.
- `get maxRetries()` — the maximum number of failed attempts allowed before the job is considered exhausted. Defaults to `3` (also the default when the constructor's `maxRetries` param is omitted); override the getter in a subclass to raise or lower it per job type, or pass `maxRetries` to the constructor to set it per instance. A `maxRetries` of `1` means the very first failure exhausts the job.
- `get cooldown()` — this job's own cooldown override, in milliseconds, or `undefined` if none was passed to the constructor. When set, the registry uses it instead of its own globally-configured cooldown when this job fails (see [`JobRegistry.fail(job)`](./reference.md)).
- `applyCooldown(ms)` — marks the job not ready for retry until `ms` milliseconds from now. This is called internally by the registry when a job fails (see [Job Lifecycle](./job-lifecycle.md)); you generally don't call it yourself, but knowing it exists explains why a failed job doesn't retry instantly.
- `isReadyBy(currentTime)` — returns whether the job's cooldown has elapsed as of `currentTime`. An internal scheduling hook, exposed as reference for readers building custom registries or tooling around jobs.
- `exhausted(maxRetries)` — returns whether the job has used up its allotted retries. Also internal-but-public, used by the registry to decide between re-queuing and dead-lettering a failed job.

A subclass's own `get maxRetries()` (or `get cooldown()`) override always takes full precedence — it's a plain method override, so it wins regardless of whatever was passed to the constructor. Constructor params are for jobs that don't override the getter but still need a value that varies per instance.

### How retry math works under the hood

Each `Job` instance privately tracks two things you don't interact with directly:

- An **attempt counter**, incremented every time the job fails.
- A **cooldown timestamp**, set by `applyCooldown(ms)` to `now + ms` whenever the job fails and isn't yet exhausted.

Together these are what let the registry decide, on every engine tick, which failed jobs are still cooling down and which are ready to be promoted back into the retry queue. You don't need to manage either value yourself — just implement `perform()` and let the registry apply cooldown/exhaustion on your job's behalf.

## Job chaining

A job's `perform()` can enqueue further jobs of its own, which is how job chaining works — one job's success can kick off the next step in a pipeline:

```js
async perform(logContext) {
  logContext.info(`Hello, ${this.name}!`);
  JobRegistry.enqueue('greet', { name: 'again' });
}
```

See [Job Lifecycle](./job-lifecycle.md) for the full detail on `JobRegistry.enqueue()` and everything else that moves a job through its lifecycle.

[← Back to How to Use deku-swarm](../HOW_TO_USE_DEKU_SWARM.md)
