# Split registry

`source/lib/registry/` has 14 flat `.js` files. Break off the per-instance singletons and the
namespace primitives; leave the seven public `*Registry` classes flat.

- `instances/` — `EmissionRegistryInstance.js`, `ExtractionRegistryInstance.js`,
  `LogRegistryInstance.js`, `MemoryRegistryInstance.js`
- `namespace/` — `Namespace.js`, `NamespaceMap.js`, `NamedRegistry.js`
- stay flat — `ClientRegistry.js`, `EmissionRegistry.js`, `ExtractionRegistry.js`,
  `LogRegistry.js`, `MemoryRegistry.js`, `ParserRegistry.js`, `ResourceRegistry.js`

Note on `NamedRegistry`: it is the base class the flat `*Registry` classes extend, so the flat
files will each import `./namespace/NamedRegistry.js`. If that coupling feels wrong on
inspection, `NamedRegistry.js` may instead stay flat — decide by what reads cleaner, but keep
`Namespace` + `NamespaceMap` grouped.

Largest resulting flat listing: 7 files + 2 folders (was 14).

## What to do

1. Create `source/lib/registry/instances/` and `source/lib/registry/namespace/`; move the
   seven files in.
2. Fix moved files' own relative imports:
   - the `*Instance` files import their sibling `*Registry` classes and `common/` utils — add
     one `../`.
   - `Namespace`, `NamespaceMap`, `NamedRegistry` cross-import each other (stay same-folder)
     and import `exceptions/` — add one `../` for the outward ones.
   - the flat `*Registry` classes that extend `NamedRegistry` now import
     `./namespace/NamedRegistry.js`.
3. Repoint external importers of the seven moved classes (verify with
   `git grep -n -E "registry/(EmissionRegistryInstance|ExtractionRegistryInstance|LogRegistryInstance|MemoryRegistryInstance|Namespace|NamespaceMap|NamedRegistry)" source/lib source/spec`):
   - `source/lib/`: `models/configs/Config.js`, `models/request/ResourceRequestAction.js`,
     `models/request/ResourceRequestPaginatedAction.js`, `server/handlers/LinksHandler.js`,
     `server/handlers/api/ApiConfigHandler.js`, `services/builders/NamespaceMapBuilder.js`,
     `services/engine/EngineController.js`, `utils/ResourceEnqueuer.js`
   - `source/spec/`: `lib/exceptions/registry/NamespaceNotFound_spec.js`,
     `lib/jobs/ExtractionEmitFlow_spec.js`, the six `lib/models/configs/Config_*_spec.js`,
     `lib/models/request/ResourceRequestAction_spec.js`,
     `lib/models/request/ResourceRequestPaginatedAction_spec.js`,
     `lib/server/handlers/LinksHandler_spec.js`,
     `lib/server/handlers/api/ApiConfigHandler_spec.js`,
     `lib/server/handlers/api/ApiEngineStartHandler_spec.js`,
     `lib/services/application/ApplicationConfigurator_spec.js`,
     `lib/services/builders/NamespaceMapBuilder_spec.js`,
     `lib/services/config/ConfigLoader_spec.js`,
     `lib/services/engine/EngineController_spec.js`, `lib/utils/ResourceEnqueuer_spec.js`,
     `support/factories/NamespaceMapFactory.js`, `support/utils/RegistryCleanupUtils.js`,
     `support/utils/ResourceActionUtils.js`
4. Mirror the spec tree: create `instances/` and `namespace/` under
   `source/spec/lib/registry/` and move `EmissionRegistryInstance_spec.js`,
   `ExtractionRegistryInstance_spec.js`, `LogRegistryInstance_spec.js`,
   `MemoryRegistryInstance_spec.js` → `instances/`; `Namespace_spec.js`,
   `NamespaceMap_spec.js`, `NamedRegistry_spec.js` → `namespace/`. Fix `../` depth (+1).
   **Do not touch** the 11 `JobRegistry_*_spec.js` files in that directory — their subject is
   in the `worker/` package, not this refactor's concern.
5. Update `docs/agents/architecture/source-layout.md` (`registry/` section) and
   `docs/agents/architecture/testing.md` (mirror tree — add `instances/`, `namespace/` under
   `registry/`).
6. Validate: `npm test`, `npm run lint`, `npm run check_docs` clean; `git grep` for the seven
   moved class paths returns only updated references.

Commit: `refactor(registry): group instance singletons and namespace primitives`.

## Files to Change

- `source/lib/registry/{EmissionRegistryInstance,ExtractionRegistryInstance,LogRegistryInstance,MemoryRegistryInstance}.js`
  — **moved** into `instances/`
- `source/lib/registry/{Namespace,NamespaceMap,NamedRegistry}.js` — **moved** into `namespace/`
- `source/lib/registry/{ClientRegistry,EmissionRegistry,ExtractionRegistry,LogRegistry,MemoryRegistry,ParserRegistry,ResourceRegistry}.js`
  — `NamedRegistry` import path updated (if it moved)
- `source/spec/lib/registry/{...Instance_spec,Namespace_spec,NamespaceMap_spec,NamedRegistry_spec}.js`
  — **moved** into mirrored subfolders, relative imports fixed
- 8 `source/lib/` importers + ~20 `source/spec/` importers/support files listed above
- `docs/agents/architecture/source-layout.md`, `docs/agents/architecture/testing.md`
