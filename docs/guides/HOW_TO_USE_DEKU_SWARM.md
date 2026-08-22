# How to Use deku-swarm

[`deku-swarm`](https://www.npmjs.com/package/deku-swarm) is a zero-dependency, queue-based worker pool for Node.js, with cooldown-based automatic retry and support for job chaining. It has no domain knowledge of HTTP requests or caching — you subclass `Job` with your own `perform()` logic, and `deku-swarm` takes care of queuing, worker allocation, cooldown-based retry, and dead-lettering.

`deku-swarm` was originally built as [Navi](https://github.com/darthjee/navi)'s cache-warming job-processing engine, then extracted into a standalone, reusable package. This guide is intended for developers and AI agents who want to integrate `deku-swarm` into their own Node.js projects as an npm dependency, independent of Navi.

---

## Table of Contents

- [Installation](./deku-swarm/installation.md) — installing `deku-swarm` from npm, ES Module requirements, and Node.js version constraints.
- [Defining Jobs](./deku-swarm/defining-jobs.md) — subclassing `Job` and implementing `perform()`, retry/cooldown behavior.
- [Setup](./deku-swarm/setup.md) — registering job factories and building the registries at application startup.
- [Running the Engine](./deku-swarm/running-the-engine.md) — starting, stopping, pausing, and resuming the main processing loop.
- [Job Lifecycle](./deku-swarm/job-lifecycle.md) — how a job moves between statuses, from enqueued through to finished or dead.
- [Collections](./deku-swarm/collections.md) — the queue/collection building blocks used internally, and when to reach for them yourself.
- [Reference](./deku-swarm/reference.md) — the full public API surface, with option and method tables.
