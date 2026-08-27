# Extract ApplicationConfigurator

Move the config-loading half of `ApplicationInstance#loadConfig()` into its own collaborator, isolating `Config.fromFile` + `LogRegistry`/buffered-logger setup from the rest of the class.

- New file `source/lib/services/ApplicationConfigurator.js`.
- Expose a method, e.g. `load(configPath)`, that: throws `ConfigurationFileNotProvided` when `configPath` is falsy, builds `Config.fromFile(configPath)`, builds `LogRegistry.build({ retention: config.logConfig.size })`, and returns `{ config, bufferedLogger: logRegistry.bufferedLogger }`.
- `configPath` itself (`#configPath`) stays a field on `ApplicationInstance`, not on this collaborator — `reload()` needs it directly for `ConfigIncluder.resolve(this.#configPath)`, and that's lifecycle logic that stays in the coordinator.
- Do not wire this into `ApplicationInstance` yet — that happens in step 05.

## Files to Change
- `source/lib/services/ApplicationConfigurator.js` (new)
- `source/spec/lib/services/ApplicationConfigurator_spec.js` (new) — cover the missing-`configPath` error, a successful load returning `{ config, bufferedLogger }`, and that `LogRegistry` is built with the config's log retention.
