# Move matching specs alongside their sources

Move every spec in `source/spec/lib/services/` into the same subfolder its
source file moved into in Steps 01–02, using `git mv` to preserve history.
Moving a spec one level deeper adds one directory level to *every* relative
import in that file (not just the import of the file under test) — e.g. a
spec's `'../../../lib/exceptions/...'` becomes `'../../../../lib/exceptions/...'`
and its `'../../support/...'` becomes `'../../../support/...'`. Apply that
extra `../` uniformly across all imports in each moved file, in addition to
inserting the subfolder segment (and, for `Client_spec.js`, the folder
rename) needed for the import of the file under test itself, per Steps 01–02.

## Files to Change

- `source/spec/lib/services/Application_spec.js` → `source/spec/lib/services/application/Application_spec.js`
- `source/spec/lib/services/Application_threshold_spec.js` → `source/spec/lib/services/application/Application_threshold_spec.js`
- `source/spec/lib/services/Application_webServer_spec.js` → `source/spec/lib/services/application/Application_webServer_spec.js`
- `source/spec/lib/services/ApplicationConfigurator_spec.js` → `source/spec/lib/services/application/ApplicationConfigurator_spec.js`
- `source/spec/lib/services/ApplicationInstance_spec.js` → `source/spec/lib/services/application/ApplicationInstance_spec.js`
- `source/spec/lib/services/ArgumentsParser_spec.js` → `source/spec/lib/services/application/ArgumentsParser_spec.js`
- `source/spec/lib/services/ConfigIncluder_spec.js` → `source/spec/lib/services/config/ConfigIncluder_spec.js`
- `source/spec/lib/services/ConfigLoader_spec.js` → `source/spec/lib/services/config/ConfigLoader_spec.js`
- `source/spec/lib/services/ConfigParser_spec.js` → `source/spec/lib/services/config/ConfigParser_spec.js`
- `source/spec/lib/services/EngineEvents_spec.js` → `source/spec/lib/services/engine/EngineEvents_spec.js`
- `source/spec/lib/services/EngineState_spec.js` → `source/spec/lib/services/engine/EngineState_spec.js`
- `source/spec/lib/services/EngineStopService_spec.js` → `source/spec/lib/services/engine/EngineStopService_spec.js`
- `source/spec/lib/services/FailureChecker_spec.js` → `source/spec/lib/services/execution/FailureChecker_spec.js`
- `source/spec/lib/services/RunReporter_spec.js` → `source/spec/lib/services/execution/RunReporter_spec.js`
- `source/spec/lib/services/RunSummary_spec.js` → `source/spec/lib/services/execution/RunSummary_spec.js`
- `source/spec/lib/services/RegistriesBuilder_spec.js` → `source/spec/lib/services/builders/RegistriesBuilder_spec.js`
- `source/spec/lib/services/NamespaceMapBuilder_spec.js` → `source/spec/lib/services/builders/NamespaceMapBuilder_spec.js`
- `source/spec/lib/services/Client_spec.js` → `source/spec/lib/client/Client_spec.js` — this one moves sideways (into a new top-level `client/` spec folder, mirroring Step 02), not one level deeper, so its other relative imports (e.g. `'../../support/...'`) keep their existing depth; only the import of `Client.js` itself changes, from `'../../../lib/services/Client.js'` to `'../../../lib/client/Client.js'`
