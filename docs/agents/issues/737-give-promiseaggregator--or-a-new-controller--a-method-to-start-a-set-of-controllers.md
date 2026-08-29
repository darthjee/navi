# Issue: Give PromiseAggregator (or a new controller) a method to start a set of controllers

## Description

Introduce a `StartupCoordinator` collaborator (owning a `PromiseAggregator` internally) that exposes `startAll(controllers)` and `wait()`, replacing the manual per-controller promise wiring currently done by hand in `ApplicationInstance.run()`. Achieving this also requires aligning `EngineController` and `ServerController` on a uniform, argument-free `start()` contract.

## Problem

`ApplicationInstance.run()` currently builds and registers each controller's start promise by hand:

```javascript
this.#aggregator.add(this.#serverController.start());
this.#enginePromise = this.#engineController.launch(this.#shouldAutostart());
this.#aggregator.add(this.#enginePromise);
```

This couples `ApplicationInstance` to the specific shape of each controller's start call. `ServerController#start()` and `EngineController#launch(shouldAutostart)` also don't share a uniform contract today — different names, and `launch` takes a required arg — so there's no way to iterate over a list of controllers and start them uniformly.

Additionally, `ApplicationInstance` keeps a `#enginePromise` private field purely to pass the engine's start promise into the aggregator; a grep across `source/` (code and specs) confirms it's never read anywhere else, so it's dead weight.

## Expected Behavior

- `ApplicationInstance` hands a list of controllers to a coordinator and lets it start each one and register the resulting promises, instead of manually building/adding each promise itself.
- `EngineController` and `ServerController` both expose a `start()` method with no arguments that returns a promise (or `undefined`), so they can be started uniformly by the coordinator regardless of which controller it is.
- `#enginePromise` no longer exists on `ApplicationInstance`.

## Solution

**New class — `StartupCoordinator`** (likely `source/lib/services/application/StartupCoordinator.js`, alongside `ApplicationInstance`'s other collaborators):
- Owns a `PromiseAggregator` internally, mirroring how `ServerController` wraps `WebServer`.
- Exposes `startAll(controllers)`, which calls `.start()` on each controller in the given order and registers the resulting promise via the internal aggregator's `add()`.
- Exposes `wait()`, delegating to the internal aggregator's `wait()`.
- `PromiseAggregator` itself stays untouched — a generic, domain-agnostic "collect and wait" primitive with no knowledge of controllers.
- `ApplicationInstance` replaces its `#aggregator` field with a `#startupCoordinator` (or similar) and calls `startAll([...])` then `await ...wait()` instead of manually building/adding each promise.

**Start contract alignment** — `EngineController#launch(shouldAutostart)` and `ServerController#start()` currently differ in both name and signature (`launch` requires an arg, `start` takes none):
- Move the `shouldAutostart` decision to build-time: `EngineController.build({ ..., shouldAutostart })` receives and stores the flag (still computed by `ApplicationInstance` via its existing `#shouldAutostart()`).
- Rename `launch(shouldAutostart)` → `start()`, reading the stored flag internally instead of taking it as a parameter.
- Result: both `EngineController#start()` and `ServerController#start()` take no args and return a promise — a uniform contract `StartupCoordinator` can call on any controller.
- This touches `EngineController_spec.js`, which currently tests `#launch` by passing `true`/`false` at call time — those specs move to asserting behavior based on the flag passed at `build()` time instead.

**`#enginePromise` removal** — deleted from `ApplicationInstance` once `StartupCoordinator.startAll()` takes over registering that promise; confirmed unused anywhere else in `source/` (code or specs).

**Scope**

In scope:
- `StartupCoordinator` and its `startAll`/`wait` methods.
- Updating `ApplicationInstance.run()` to use it.
- The `EngineController`/`ServerController` start-contract alignment described above (required for this issue to work at all, not optional polish).
- Removing `#enginePromise`.

Out of scope (candidates for separate issues if needed):
- Any broader refactor of `EngineController`/`ServerController` internals beyond what's needed for a consistent start contract.
- Changes to `PromiseAggregator#wait()`'s draining/rejection logic.
- Stop/shutdown/pause/etc. lifecycle methods — this issue is about starting only.

**Edge cases**
- **Null/undefined return from `start()`** — `ServerController#start()` returns `undefined` when there's no web server configured. `PromiseAggregator#add()` already silently ignores `null`/`undefined`, so `startAll()` needs no special-casing: pass each `controller.start()` result straight through to `add()`.
- **Ordering and synchronous throws** — current code starts server then engine, sequentially and inline; if one throws synchronously, the next never runs. `startAll(controllers)` iterates the given array in order with a plain loop (no try/catch swallowing), preserving that same fail-fast behavior — parity with today, not a new risk.
- **Empty controller list** — `startAll([])` is a no-op; `wait()` on an aggregator with nothing registered resolves immediately.
- **Return value of `startAll`** — `void`, mirroring `add()`. The caller still calls `wait()` separately to block.

## Benefits

- `ApplicationInstance` no longer needs to know the specific shape of each controller's start call — it just hands over a list.
- Adding a future controller to the startup sequence becomes a one-line addition to that list, with no changes needed to the aggregation/wait logic.
- `PromiseAggregator` stays a clean, reusable, domain-agnostic primitive.
- Removes a dead field (`#enginePromise`) and an inconsistent method signature (`launch(shouldAutostart)`) from the codebase.
