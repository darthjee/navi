# ApplicationConfigurator returns ConfigStore

`load(configPath)` currently returns `{ config, bufferedLogger }`. Change it to
return a `ConfigStore` instance instead.

- Keep the `!configPath` guard that throws `ConfigurationFileNotProvided` — it must
  still fire **before** any `ConfigStore` is constructed.
- Keep building the `LogRegistry` here (`LogRegistry.build({ retention: config.logConfig.size })`);
  `ConfigStore` is only a data holder.
- Construct `new ConfigStore({ config, bufferedLogger: logRegistry.bufferedLogger, entryFilePath: configPath })`
  and return it. `entryFilePath` is the `configPath` argument passed straight through.
- Update the JSDoc `@returns` to `{ConfigStore}`.

Update `ApplicationConfigurator_spec.js`:

- Assertions that destructure `{ config, bufferedLogger }` from the result now read
  `result.config` / `result.bufferedLogger` off the `ConfigStore`.
- Add an assertion that `result.entryFilePath` equals the path argument passed in.
- Keep the `ConfigurationFileNotProvided` / `ConfigurationFileNotFound` throw cases.

## Files to Change

- `source/lib/services/application/ApplicationConfigurator.js` — return `ConfigStore`.
- `source/spec/lib/services/application/ApplicationConfigurator_spec.js` — adjust for the new return type, add `entryFilePath` assertion.
