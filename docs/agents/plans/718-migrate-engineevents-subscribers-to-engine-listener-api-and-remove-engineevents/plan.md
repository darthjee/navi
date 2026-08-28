# Plan: Migrate EngineEvents subscribers to Engine listener API and remove EngineEvents

Issue: [718-migrate-engineevents-subscribers-to-engine-listener-api-and-remove-engineevents.md](../issues/718-migrate-engineevents-subscribers-to-engine-listener-api-and-remove-engineevents.md)

## Overview

`deku-swarm`'s `Engine` gains a generic, instance-scoped `on(eventName, handler)` / `emit(eventName, ...args)` API (composing Node's `EventEmitter`, with no opinion on event names). Navi's `EngineController` switches from the global `EngineEvents` singleton to emitting on `this.engine` directly, and adds a new `'finish'` event distinct from `'stop'` so the run-completion report can't accidentally fire on a routine mid-run stop. `LogBufferCollection`'s buffer-clearing and `RunReporter`'s run-completion report both move from self-subscribing/direct-calling to being wired explicitly once `ApplicationInstance` builds the engine. `EngineEvents` and all references to it are then deleted, and `worker.md`'s stale notes are corrected.

## Agents involved

- [worker](worker.md)
- [engine](engine.md)
- [architect](architect.md)

## Shared contracts

- `Engine#on(eventName, handler)` / `Engine#emit(eventName, ...args)` — two new public instance methods on `worker/lib/services/Engine.js`'s `Engine` class, composing an internal `EventEmitter`. `worker` treats event names as opaque strings (no enum, no validation) and guarantees: multiple `on()` calls for the same name fire in registration order; `emit()` with zero listeners is a safe no-op (these aren't Node's reserved `'error'` event); a listener that throws stops later listeners for that same `emit()` call (matches `EventEmitter`'s native behavior).
- `engine` (Navi) is the sole consumer of that API for this issue: `EngineController` calls `this.engine.emit('stop')` (in `stop()` and `finishRun()`), `this.engine.emit('start')` (in `start()`), and `this.engine.emit('finish')` (new, in `finishRun()` only). `ApplicationInstance` calls `this.engine.on('stop', ...)` and `this.engine.on('finish', ...)` once, right after building the engine. `worker` does not need to know these specific event names — they're Navi's choice, not baked into `Engine`.
- `architect`'s `worker.md` update only starts once both `worker`'s and `engine`'s changes have landed, since it documents the finished state of both.
