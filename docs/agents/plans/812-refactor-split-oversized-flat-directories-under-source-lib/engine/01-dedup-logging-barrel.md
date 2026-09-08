# Remove the utils/logging re-export barrel

`source/lib/utils/logging/` is a dead compatibility layer: 11 files, each a single
`export * from '../../common/utils/logging/<Name>.js';`. The real implementation already lives
in `source/lib/common/utils/logging/` (`BaseLogger`, `BufferedLogger`, `ConsoleLogger`, `Log`,
`LogBuffer`, `LogBufferCollection`, `LogContext`, `LogFactory`, `LogFilter`, `Logger`,
`LoggerGroup`). Delete the barrel and repoint every consumer at the real path. Do **not** add
anything in its place.

Do this first — it removes 11 files outright, a bigger win than nesting them.

## What to do

1. Repoint every reference from `.../utils/logging/<Name>.js` to
   `.../common/utils/logging/<Name>.js` (one extra path segment; adjust the `../` prefix
   accordingly). Covers `import`, `export`, and jsdoc `@returns {import('...')}` /
   `@param {import('...')}` comments. ~25 call sites:
   - `source/lib/`: `parsers/css_selector_parser/FilterMatcher.js`,
     `registry/EmissionRegistryInstance.js`, `registry/ExtractionRegistryInstance.js`,
     `registry/LogRegistry.js` (5 jsdoc refs), `registry/LogRegistryInstance.js` (5 imports +
     4 jsdoc refs), `registry/MemoryRegistryInstance.js`, `serializers/LogSerializer.js`
     (jsdoc), `server/RouteRegister.js`, `server/SecuredRequestHandler.js`,
     `server/WebServer.js`, `services/builders/RegistriesBuilder.js`,
     `services/config/ConfigIncluder.js`
   - `source/spec/`: `lib/parsers/CssSelectorParser_spec.js`,
     `lib/parsers/css_selector_parser/FilterMatcher_spec.js`,
     `lib/registry/LogRegistryInstance_spec.js`, `lib/registry/LogRegistry_spec.js`,
     `lib/server/RouteRegister_patch_spec.js`, `lib/server/RouteRegister_post_spec.js`,
     `lib/server/RouteRegister_spec.js`, `lib/server/Router_spec.js`,
     `lib/server/SecuredRequestHandler_spec.js`, `lib/server/WebServer_spec.js`,
     `lib/server/handlers/LogsHandler_spec.js`,
     `lib/server/handlers/jobs/JobLogsHandler_spec.js`,
     `lib/services/application/Application_spec.js`,
     `lib/services/application/Application_threshold_spec.js`,
     `lib/services/application/Application_webServer_spec.js`,
     `lib/services/config/ConfigIncluder_spec.js`, `lib/services/config/ConfigLoader_spec.js`,
     `support/utils/LoggerUtils.js`, `support/utils/RegistryCleanupUtils.js`
   - Re-run `git grep -n "utils/logging/" source/lib source/spec | grep -v common/utils/logging`
     to confirm nothing but the barrel files themselves remains before deleting.
2. Delete all 11 files in `source/lib/utils/logging/` and remove the now-empty directory.
3. Move the 11 logging spec files from `source/spec/lib/utils/logging/` to
   `source/spec/lib/common/utils/logging/` (new directory). Each was at depth
   `source/spec/lib/utils/logging/` and imported `from '../../../../lib/utils/logging/...'`;
   at the new depth `source/spec/lib/common/utils/logging/` the impl import becomes
   `from '../../../../../lib/common/utils/logging/...'` (one extra `../`). Fix every relative
   import in each moved spec.
4. Update docs in the same commit:
   - `docs/agents/architecture/source-layout.md` — `utils/` section: drop the
     "`utils/logging/` — compatibility re-exports to `common/utils/logging/*`, plus
     `LogContext`" bullet; `LogContext` now lives under `common/utils/logging/` like the rest.
   - `docs/agents/architecture/testing.md` — the `utils/` block in the mirror tree: remove the
     `logging/` child under `utils/` and add `logging/` under `common/utils/`.
5. Validate: `npm test`, `npm run lint`, `npm run check_docs` all clean;
   `git grep -n "utils/logging/" source/lib source/spec` returns only `common/utils/logging/`.

Commit: `refactor(logging): drop dead utils/logging re-export barrel`.

## Files to Change

- `source/lib/utils/logging/*.js` (11 files) — **deleted**
- `source/spec/lib/utils/logging/*_spec.js` (11 files) — **moved** to
  `source/spec/lib/common/utils/logging/`, relative imports fixed (+1 `../`)
- `source/lib/parsers/css_selector_parser/FilterMatcher.js`,
  `source/lib/registry/EmissionRegistryInstance.js`,
  `source/lib/registry/ExtractionRegistryInstance.js`,
  `source/lib/registry/LogRegistry.js`, `source/lib/registry/LogRegistryInstance.js`,
  `source/lib/registry/MemoryRegistryInstance.js`, `source/lib/serializers/LogSerializer.js`,
  `source/lib/server/RouteRegister.js`, `source/lib/server/SecuredRequestHandler.js`,
  `source/lib/server/WebServer.js`, `source/lib/services/builders/RegistriesBuilder.js`,
  `source/lib/services/config/ConfigIncluder.js` — import/jsdoc path repointed to
  `common/utils/logging/`
- ~17 spec/support files listed above — import path repointed to `common/utils/logging/`
- `docs/agents/architecture/source-layout.md`, `docs/agents/architecture/testing.md` — remove
  the barrel/`utils/logging` mirror references
