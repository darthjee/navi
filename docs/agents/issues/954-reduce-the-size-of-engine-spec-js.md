# Issue: Reduce the size of Engine_spec.js

## Description
The spec size check reports `worker/spec/services/Engine_spec.js` as **WARN** with 338 lines.

## Problem
- The `when keepAlive is true` block (lines ~134–268, about 135 lines) holds keepAlive, pause/resume and the `idle timeout` sub-suite. It is a separate concern from the basic `#start` behavior.
- Every keepAlive / idle-timeout test rebuilds the engine by hand with `new Engine({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, keepAlive: true, sleepMs: -1, ... })`. The idle-timeout tests also repeat the same "count iterations in `promoteReadyJobs`, stop at `SAFETY_NET_ITERATIONS`" safety-net spy.
- The file-local setup (`enqueueJobs`, `buildEngineContext`, which builds the `finished`/`dead`/`busy` collections, the `DummyJobFactory`/`DummyWorkerFactory` and the `JobRegistry`/`WorkersRegistry` build) is duplicated almost word for word in `worker/spec/services/Engine_async_spec.js`.

## Expected Behavior
- Every resulting spec file is under 300 lines (the size check reports no WARN/ERROR for it).
- No test coverage is lost: the same behaviors are asserted, and `yarn spec` and `yarn lint` stay green in `worker/`.
- New shared helpers live in `worker/spec/support/` (`utils/` or `dummies/`), following the style of the existing ones (`RegistryCleanupUtils`, `DummyJobFactory`, `DummyWorkerFactory`, ...).
- `Engine_async_spec.js` uses the same shared setup instead of its own copy.

## Solution
- Move the `when keepAlive is true` block (keepAlive, pause/resume, `idle timeout`) into `worker/spec/services/Engine_keep_alive_spec.js`. `Engine_spec.js` keeps the basic `#start` cases, `registry defaults` and `#on / #emit`.
- Extract the shared setup into `worker/spec/support/utils/EngineSpecUtils.js`: `enqueueJobs(count)`, and a `setup()`/`buildEngineContext({ cooldown, sleepMs, ... })` that returns a context (`engine`, `finished`, `dead`, `busy`, `workerFactory`) and is refreshed on every `beforeEach`. Use it from `Engine_spec.js`, `Engine_keep_alive_spec.js` and `Engine_async_spec.js`.
- Add a small engine builder (e.g. `buildEngine({ keepAlive, idleTimeoutMs, onIdleTimeout, allocator })` that fills in `jobRegistry`/`workersRegistry`/`sleepMs: -1` by default) to replace the repeated `new Engine({...})` calls.
- Extract the idle-timeout safety-net spy (count `promoteReadyJobs` iterations, stop the engine at a limit, plus an optional per-iteration callback) into a helper.

The split and file names above are suggestions. The implementer can pick a different split, or extract helpers, whichever keeps the specs readable.

## Benefits
- Specs that are easier to read and navigate
- Reusable setup instead of long local helpers, shared by all Engine specs
- The spec size check stops flagging this file

