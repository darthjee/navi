# Plan: Navi: wire onWorkerIdle to Engine#wake()

Issue: [1017-navi-wire-onworkeridle-to-engine-wake.md](../../issues/1017-navi-wire-onworkeridle-to-engine-wake.md)

## Overview
Wire deku-swarm's `onWorkerIdle` worker hook, added in #1010 (deku-swarm 1.16.0, merged to main), to the `wake()` method of navi's engine:

- `RegistriesBuilder.build` gains an optional `onWorkerIdle` that it passes to `WorkerFactory`.
- `ApplicationInstance#loadConfig` hands it `() => this.#engineController?.engine?.wake()`.

The whole change is inside `source/`, so it is owned by the `engine` agent.

See [engine.md](engine.md) for the full plan.
