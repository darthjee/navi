# Add ConfigStore

Introduce a small class that holds the config-load output currently scattered
across `ApplicationInstance` as `#configPath`, `#bufferedLogger`, and the public
`this.config` field.

Requirements:

- Constructor takes `{ config, bufferedLogger, entryFilePath }` and stores each on a
  private field.
- Three named getters: `config`, `bufferedLogger`, `entryFilePath`.
- No passthrough getters (callers reach `workersConfig` etc. via `.config`).
- `entryFilePath` is stored **verbatim** — the exact string passed in, never run
  through `path.resolve()` or otherwise normalized (edge case E1: `ConfigIncluder`
  does its own resolution and resolves relative `include:` paths against the entry
  file's directory).
- Full JSDoc, `@author darthjee`, matching the style of neighbouring classes in
  `source/lib/services/application/`.

Add a spec covering: getters return what was passed; `entryFilePath` is returned
unchanged (pass a relative path, assert it comes back identical).

## Files to Change

- `source/lib/services/application/ConfigStore.js` — new class.
- `source/spec/lib/services/application/ConfigStore_spec.js` — new spec.
