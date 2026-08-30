# Add ExtractionConfig and bootstrap/reset wiring

Give the extraction store its own retention config, mirroring `EmitConfig` exactly, and wire the registry into application bootstrap and the engine `stop` reset — right next to the existing `EmissionRegistry` calls.

## ExtractionConfig

Copy `source/lib/models/configs/EmitConfig.js`: a top-level `extraction:` YAML key (sibling of `resources` / `web` / `log` / `emit`) carrying only `size` (default `100`). `static fromObject(obj)` returns `new ExtractionConfig(obj ?? {})`.

Wire it through config parsing exactly as `emitConfig` is wired:
- `source/lib/services/config/ConfigParser.js` — add `#extractionConfig() { return ExtractionConfig.fromObject(this.config.extraction); }` and include `extractionConfig: this.#extractionConfig()` in the parser output object (next to `emitConfig` at line ~79).
- `source/lib/services/config/ConfigLoader.js` — pass `extractionConfig: entryConfig.extractionConfig` through (next to `emitConfig` at line ~68).
- `source/lib/models/configs/Config.js` — accept `extractionConfig` in the constructor and set `this.extractionConfig = extractionConfig ?? new ExtractionConfig()` (mirror line ~32).

## Bootstrap and reset

- `source/lib/services/application/ApplicationConfigurator.js` — after `EmissionRegistry.build(...)` (line 27), add `ExtractionRegistry.build({ retention: config.extractionConfig.size });`.
- `source/lib/services/engine/EngineController.js` — in the `engine.on('stop', ...)` listener in `bind()` (line ~98-101), add `ExtractionRegistry.clear();` next to `EmissionRegistry.clear();`.

## Files to Change

- `source/lib/models/configs/ExtractionConfig.js` — new; copy of `EmitConfig.js`.
- `source/lib/services/config/ConfigParser.js` — add `#extractionConfig()` and include `extractionConfig` in output.
- `source/lib/services/config/ConfigLoader.js` — forward `extractionConfig`.
- `source/lib/models/configs/Config.js` — accept and default `extractionConfig`.
- `source/lib/services/application/ApplicationConfigurator.js` — `ExtractionRegistry.build(...)`.
- `source/lib/services/engine/EngineController.js` — `ExtractionRegistry.clear()` in the stop listener.
- `docker_volumes/config/navi_config.yml` — optional: add a commented `extraction:\n  size: 100` example next to the `emit:` block if one is present there.
