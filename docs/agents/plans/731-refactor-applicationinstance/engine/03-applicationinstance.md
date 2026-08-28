# ApplicationInstance: #configStore + drop #workers

Rework the state that this refactor targets.

## Constructor

- Remove the `workers` param and the `#workers` field. Remove its JSDoc `@param`
  line.
- Add a `configStore` param to the existing DI destructuring
  (`{ state, registriesBuilder, configurator, reporter, resourceQueueFacade }`) →
  add `configStore`. When provided, assign it to `#configStore` (test seam,
  consistent with the other injected collaborators). Document it as
  `@param {ConfigStore} [params.configStore]`.

## Fields

- Remove `#configPath` and `#bufferedLogger`.
- Add `#configStore` (holds a `ConfigStore`).

## `loadConfig(configPath)`

```js
loadConfig(configPath) {
  this.#configStore = this.#configurator.load(configPath);
  this.#registriesBuilder.build({ config: this.config });
}
```

- No more `this.#configPath = configPath`.
- No more `this.config = config` / `this.#bufferedLogger = bufferedLogger` — those
  become getters (below).
- `RegistriesBuilder.build` is now called with `{ config }` only (no `workers`).

## Getters

- `get config()` → `return this.#configStore?.config;` — **optional chaining**, so a
  read before `loadConfig()` (or after one that threw) yields `undefined`, matching
  today's behaviour (edge case E2). No setter.
- `get bufferedLogger()` → `return this.#configStore?.bufferedLogger;`

The existing `run()` / `buildEngine()` call sites (`this.config.workersConfig`,
`this.config.webConfig`, `this.config.failureConfig`) are unchanged — they resolve
through the getter.

## `buildEngine()`

- Drop `jobRegistry: JobRegistry` and `workersRegistry: WorkersRegistry` from the
  `new Engine({...})` call. Keep `sleepMs`, `keepAlive`, `idleTimeoutMs`,
  `onIdleTimeout`.
- Narrow the import at the top of the file from
  `import { Engine, JobRegistry, WorkersRegistry } from 'deku-swarm';` to
  `import { Engine } from 'deku-swarm';` — **only if** `JobRegistry` /
  `WorkersRegistry` are not referenced elsewhere in the file (they are not, after
  the `reloadConfig` change below).

## `run()` — reloadConfig callback

The `EngineController` is constructed with
`reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(this.#configPath))`.
Change to
`reloadConfig: () => NamespaceMap.include(ConfigIncluder.resolve(this.#configStore.entryFilePath))`.

Without this the reload path breaks (there is no `#configPath` anymore).
`ConfigIncluder` itself is untouched.

## Files to Change

- `source/lib/services/application/ApplicationInstance.js` — fields, constructor,
  `loadConfig`, `config` / `bufferedLogger` getters, `buildEngine`, `run`'s
  `reloadConfig` callback, imports, JSDoc.
