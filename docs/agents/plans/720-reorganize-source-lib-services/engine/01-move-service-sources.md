# Move service source files into subfolders

Create five subfolders under `source/lib/services/` and move the 15
non-`Client.js` files into them by responsibility, using `git mv` to preserve
history. Then fix every relative import broken by the move — imports between
files that stay in the same new subfolder are unaffected; only imports that
now cross a subfolder boundary need a path update.

`ConfigParser.js` also imports `Client.js` (`import { Client } from
'./Client.js'`) — leave that import as-is here; it is fixed in Step 02 when
`Client.js` moves. Do not run the test suite between this step and Step 02,
since it will be red in between.

## Files to Change

- `source/lib/services/Application.js` → `source/lib/services/application/Application.js` — no import changes (its only import, `ApplicationInstance.js`, stays in the same subfolder)
- `source/lib/services/ApplicationConfigurator.js` → `source/lib/services/application/ApplicationConfigurator.js` — no import changes
- `source/lib/services/ApplicationInstance.js` → `source/lib/services/application/ApplicationInstance.js` — update: `'./ConfigIncluder.js'` → `'../config/ConfigIncluder.js'`; `'./EngineEvents.js'` → `'../engine/EngineEvents.js'`; `'./EngineState.js'` → `'../engine/EngineState.js'`; `'./RegistriesBuilder.js'` → `'../builders/RegistriesBuilder.js'`; `'./RunReporter.js'` → `'../execution/RunReporter.js'`; leave `'./ApplicationConfigurator.js'` unchanged (same subfolder)
- `source/lib/services/ArgumentsParser.js` → `source/lib/services/application/ArgumentsParser.js` — no import changes
- `source/lib/services/ConfigIncluder.js` → `source/lib/services/config/ConfigIncluder.js` — no import changes
- `source/lib/services/ConfigLoader.js` → `source/lib/services/config/ConfigLoader.js` — update: `'./NamespaceMapBuilder.js'` → `'../builders/NamespaceMapBuilder.js'`; leave `'./ConfigIncluder.js'` and `'./ConfigParser.js'` unchanged (same subfolder)
- `source/lib/services/ConfigParser.js` → `source/lib/services/config/ConfigParser.js` — no changes in this step (see note above; `'./Client.js'` is fixed in Step 02)
- `source/lib/services/EngineEvents.js` → `source/lib/services/engine/EngineEvents.js` — no import changes
- `source/lib/services/EngineState.js` → `source/lib/services/engine/EngineState.js` — no import changes
- `source/lib/services/EngineStopService.js` → `source/lib/services/engine/EngineStopService.js` — update: `'./Application.js'` → `'../application/Application.js'`
- `source/lib/services/RunReporter.js` → `source/lib/services/execution/RunReporter.js` — no import changes (`FailureChecker.js` and `RunSummary.js` stay in the same subfolder)
- `source/lib/services/RunSummary.js` → `source/lib/services/execution/RunSummary.js` — no import changes
- `source/lib/services/FailureChecker.js` → `source/lib/services/execution/FailureChecker.js` — no import changes
- `source/lib/services/RegistriesBuilder.js` → `source/lib/services/builders/RegistriesBuilder.js` — no import changes
- `source/lib/services/NamespaceMapBuilder.js` → `source/lib/services/builders/NamespaceMapBuilder.js` — update: `'./ConfigParser.js'` → `'../config/ConfigParser.js'`
