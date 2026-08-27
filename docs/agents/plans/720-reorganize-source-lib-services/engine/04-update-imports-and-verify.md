# Update remaining external imports and verify green

Every other file under `source/` that imports one of the 16 moved files
(~52 files, at varying relative depths — e.g. `'../lib/services/Application.js'`,
`'../../../lib/services/Application.js'`, `'../../../services/Application.js'`)
needs its import path updated to insert the new subfolder segment (or, for
`Client.js`, to swap `services` for `client`), leaving the rest of the
relative-path prefix untouched. Search `source/` (excluding
`node_modules` and `coverage`) for any import whose path contains
`services/<Filename>.js` or ends in `client` for `Client.js`, and apply the
mapping below by filename — the number of leading `../` segments does not
matter, only the filename → subfolder mapping does.

## Filename → new subfolder mapping

- `Application.js`, `ApplicationConfigurator.js`, `ApplicationInstance.js`, `ArgumentsParser.js` → insert `application/` before the filename
- `ConfigIncluder.js`, `ConfigLoader.js`, `ConfigParser.js` → insert `config/` before the filename
- `EngineEvents.js`, `EngineState.js`, `EngineStopService.js` → insert `engine/` before the filename
- `RunReporter.js`, `RunSummary.js`, `FailureChecker.js` → insert `execution/` before the filename
- `RegistriesBuilder.js`, `NamespaceMapBuilder.js` → insert `builders/` before the filename
- `Client.js` → replace the `services` path segment with `client` (no subfolder underneath; `Client.js` sits directly in `source/lib/client/`)

Example: `'../../../lib/services/Application.js'` → `'../../../lib/services/application/Application.js'`; `'../../../lib/services/Client.js'` → `'../../../lib/client/Client.js'`.

## Files to Change

- All files across `source/` (excluding `node_modules`, `coverage`) whose
  imports resolve to any of the 16 moved files — found via `grep -rn
  "services/\(Application\|ApplicationConfigurator\|ApplicationInstance\|ArgumentsParser\|Client\|ConfigIncluder\|ConfigLoader\|ConfigParser\|EngineEvents\|EngineState\|EngineStopService\|FailureChecker\|NamespaceMapBuilder\|RegistriesBuilder\|RunReporter\|RunSummary\)\.js" source
  --include="*.js"` (run from the repo root) after Steps 01–03 are complete,
  to enumerate the exact remaining call sites (do not rely on the ~52 count
  found during planning — re-run the grep, since Steps 01–03 already fixed
  the internal service-to-service and spec imports).

## Verification

Run from `source/`:

- `yarn test` — must be green (Jasmine + coverage)
- `yarn lint` — must be green (ESLint over `lib` and `spec`)
- `yarn report` — must run clean (jscpd duplication report)

Fix any residual broken import or lint violation surfaced by these commands
before considering the issue done.
