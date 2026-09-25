# Plan: Reduce the size of Engine_spec.js

Issue: [954-reduce-the-size-of-engine-spec-js.md](../../issues/954-reduce-the-size-of-engine-spec-js.md)

## Overview
Spec-only refactor in `worker/`. Shared Engine spec setup moves into a new `EngineSpecUtils`, and the keepAlive / idle-timeout suite moves out of `Engine_spec.js` into `Engine_keep_alive_spec.js`. `Engine_async_spec.js` switches to the shared setup. All work is in the `worker` agent's scope.

See [worker.md](worker.md) for the full plan.
