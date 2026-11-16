# ApplicationInstance: wire the hook to the current engine

In `ApplicationInstance#loadConfig`, pass a late-bound wake callback to the registries builder:

```js
loadConfig(configPath, menuPath) {
  this.#configStore = this.#configurator.load(configPath, menuPath);
  this.#registriesBuilder.build({
    config: this.config,
    onWorkerIdle: () => this.#engineController?.engine?.wake(),
  });
}
```

How it behaves:

- **Before `run()`:** `#engineController` is undefined, so the hook is a no-op.
- **After `run()`:** it wakes the single engine built by `EngineController.build`.
- **Guards:** none beyond the optional chaining. deku-swarm's `wake()` is already a no-op when the loop isn't running, and harmless while paused.

Optionally extract the arrow function into a private method such as `#wakeEngine()` for readability, and update `loadConfig`'s JSDoc to mention the idle hook.

Specs in `ApplicationInstance_spec.js`, in a new `describe('#loadConfig onWorkerIdle wiring')`:

- **Capture the callback:** inject `registriesBuilder = jasmine.createSpyObj('RegistriesBuilder', ['build'])` and a `configurator` stub whose `load` returns a configStore `{ config: {...} }`. Call `instance.loadConfig('path')` and read the callback from `registriesBuilder.build.calls.mostRecent().args[0].onWorkerIdle`.
- **Before `run()`:** invoking it doesn't throw.
- **After `run()`:**
  - Use the existing `#run` setup with `buildFakeEngine({ wake: jasmine.createSpy('wake') })`, returned from the spied `EngineController.prototype.buildEngine`, and `await instance.run()`.
  - Invoke the captured callback and expect `engine.wake` to have been called.
  - The run resolves immediately with the fake engine, so the controller is still set afterwards.
- **Combining the setups:** `loadConfig` sets `#configStore`, so build the instance with injected `registriesBuilder` and `configurator`, call `loadConfig`, then run with the stubs the `#run` describe uses (`ServerController.prototype.buildWebServer`/`buildSampler` → null, `enqueueFirstJobs` stubbed, `ExtensionRoutesLoader.load` if needed).

## Files to Change
- `source/lib/services/application/ApplicationInstance.js`: pass `onWorkerIdle: () => this.#engineController?.engine?.wake()` to `RegistriesBuilder#build` in `loadConfig`; update the JSDoc.
- `source/spec/lib/services/application/ApplicationInstance_spec.js`: specs for the callback as a no-op before `run()` and as a call to `engine.wake()` after `run()`.
