# Add StartupCoordinator

Introduce a new `StartupCoordinator` class that owns a `PromiseAggregator` internally and exposes `startAll(controllers)`/`wait()`, mirroring how `ServerController` wraps `WebServer`. `PromiseAggregator` itself is not modified — it stays a generic, domain-agnostic "collect and wait" primitive with no knowledge of controllers.

- `StartupCoordinator` constructs its own `PromiseAggregator` (private field), no dependency injection needed beyond the default (match the style of `ApplicationInstance`'s other collaborators, which accept an optional injected instance for testing — same pattern here: `constructor({ aggregator } = {}) { this.#aggregator = aggregator ?? new PromiseAggregator(); }`).
- `startAll(controllers)`: iterates the given array in order with a plain `for...of` loop (no try/catch swallowing — a synchronous throw from one controller's `start()` should propagate immediately, matching today's fail-fast behavior), calling `controller.start()` and passing the result straight to the internal aggregator's `add()` (which already silently ignores `null`/`undefined`, so no special-casing needed for `ServerController#start()` returning `undefined` when there's no web server). Returns `void`.
- `wait()`: delegates to the internal aggregator's `wait()`.
- An empty `controllers` array is a valid no-op call.

## Files to Change

- `source/lib/services/application/StartupCoordinator.js` — new file implementing the class described above.
- `source/spec/lib/services/application/StartupCoordinator_spec.js` — new spec file. Cover: `startAll` calls `.start()` on each controller in order and registers non-null results with the aggregator; `null`/`undefined` return values from a controller's `start()` are tolerated; an empty controller list is a no-op; `wait()` delegates to (and resolves only after) the internal aggregator's `wait()`; a synchronous throw from one controller's `start()` propagates and prevents later controllers in the list from starting.
