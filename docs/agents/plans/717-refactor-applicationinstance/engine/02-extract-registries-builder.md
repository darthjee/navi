# Extract RegistriesBuilder

Move the large `#initRegistries()` bootstrap block out of `ApplicationInstance` into its own collaborator — it's currently the biggest single chunk of unrelated logic in the class.

- New file `source/lib/services/RegistriesBuilder.js`.
- Expose a single method, e.g. `build({ config, workers })`, containing exactly the current body of `ApplicationInstance#initRegistries()` (`source/lib/services/ApplicationInstance.js:327-352`): the six `JobFactory.build(...)` calls, constructing `ParserRegistry`, `JobRegistry.build(...)`, and `WorkersRegistry.build(...)` + `initWorkers()`.
- `config` and `workers` must be passed into `build()` as arguments, not captured on the collaborator at construction time — `ApplicationInstance`'s constructor runs before `loadConfig()`, so a `RegistriesBuilder` built in the constructor cannot yet know `config`.
- No return value needed (the current method doesn't return anything); it just performs the registrations as a side effect, same as today.
- Do not wire this into `ApplicationInstance` yet — that happens in step 05.

## Files to Change
- `source/lib/services/RegistriesBuilder.js` (new)
- `source/spec/lib/services/RegistriesBuilder_spec.js` (new) — cover that `build()` registers each job factory, builds the parser/job/workers registries, and calls `initWorkers()`, mirroring the coverage implicit in `ApplicationInstance_spec.js`/`Application_spec.js` today.
