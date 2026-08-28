# Add clearBuffers to the log registry and drop LogBufferCollection's self-subscription

`LogBufferCollection` currently subscribes itself to `EngineEvents.on('stop', () => this.clear())` in its own constructor. It's built inside `LogRegistryInstance`'s constructor, which runs during `ApplicationConfigurator.load()` — before `Engine` exists — so it can no longer reach a specific `engine` instance from its own constructor. Move the "clear on stop" decision up to `LogRegistryInstance`/`LogRegistry`, which already owns both `LogBufferCollection` instances (`#jobLogs`, `#workerLogs`), and let `ApplicationInstance` (step 03) wire the actual `engine.on('stop', ...)` call once the engine exists.

- `LogBufferCollection` (`source/lib/common/utils/logging/LogBufferCollection.js`): remove the `EngineEvents` import and the `EngineEvents.on('stop', () => this.clear())` line from the constructor. Its public `clear()` method is unchanged and still needed (now called from `LogRegistryInstance`, not internally).
- `LogRegistryInstance` (`source/lib/registry/LogRegistryInstance.js`): add a public `clearBuffers()` method that calls `this.#jobLogs.clear()` and `this.#workerLogs.clear()`.
- `LogRegistry` (`source/lib/registry/LogRegistry.js`): add a matching static `clearBuffers()` delegating to `LogRegistry.#getInstance().clearBuffers()`, following the same pattern as its other static delegates (`debug`, `info`, etc.).

## Files to Change

- `source/lib/common/utils/logging/LogBufferCollection.js` — drop the `EngineEvents` import and self-subscription.
- `source/lib/registry/LogRegistryInstance.js` — add `clearBuffers()`.
- `source/lib/registry/LogRegistry.js` — add static `clearBuffers()`.
