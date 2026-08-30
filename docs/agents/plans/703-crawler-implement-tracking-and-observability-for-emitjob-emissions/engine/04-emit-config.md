# EmitConfig (top-level `emit.size`)

Add a top-level `emit:` config block carrying the emission-store retention limit, modelled
exactly on `source/lib/models/configs/LogConfig.js`.

`EmitConfig` — `#size`, `constructor({ size = 100 } = {})`, `get size()`, static
`fromObject(obj)` → `new EmitConfig(obj ?? {})`. JSDoc, `@author darthjee`. Validation:
match whatever `LogConfig` does today (it currently does no positive-integer validation, so
`EmitConfig` should not add any either — keep the two parallel; if a follow-up hardens
`LogConfig`, do both together).

Wire it through the same path `logConfig` takes:

- `source/lib/services/config/ConfigParser.js` — add a `#emitConfig()` private method
  (`EmitConfig.fromObject(this.config.emit)`), include `emitConfig: this.#emitConfig()` in
  the object returned by `parse()`, and update the `parse()` JSDoc `@returns` block.
- `source/lib/models/configs/Config.js` — accept `emitConfig` in the constructor params and
  set `this.emitConfig = emitConfig ?? new EmitConfig()` (mirrors `this.logConfig`). Import
  `EmitConfig`. Update the constructor JSDoc.

Note the naming: this top-level `emit:` key is a sibling of `resources` / `web` / `log`,
**distinct from** the per-resource `resources.*.emit` block parsed by
`ResourceRequestEmit` — the same pattern by which top-level `log:` coexists with
per-context logging.

Specs: `EmitConfig_spec.js` mirroring `source/spec/lib/models/configs/LogConfig_spec.js`
(default size 100, custom size, `fromObject(null)` / `fromObject(undefined)`). Extend
`ConfigParser_spec.js` (parses `emit.size`, defaults when the key is absent) and
`Config_spec.js` (`emitConfig` defaults to an `EmitConfig` when omitted, is kept when
passed). 100% diff coverage.

## Files to Change

- `source/lib/models/configs/EmitConfig.js` — new config model.
- `source/lib/services/config/ConfigParser.js` — parse `emit:` into `emitConfig`.
- `source/lib/models/configs/Config.js` — hold `emitConfig`, default to `new EmitConfig()`.
- `source/spec/lib/models/configs/EmitConfig_spec.js` — new spec.
- `source/spec/lib/services/config/ConfigParser_spec.js` — cover `emit.size` parsing.
- `source/spec/lib/models/configs/Config_spec.js` — cover `emitConfig` default/passthrough.
