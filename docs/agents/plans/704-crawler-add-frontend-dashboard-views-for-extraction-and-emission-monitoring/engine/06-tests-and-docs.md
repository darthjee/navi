# Tests and docs

Add specs for every new and changed file, mirroring the existing #703 emission specs, and update the engine-facing documentation.

## Tests

Locate the #703 emission specs (`source/spec/**` — e.g. `EmissionStore_spec.js`, `EmissionRecord_spec.js`, `EmissionRecordFactory_spec.js`, `EmissionRegistry_spec.js`, `EmissionsHandler_spec.js`, `EmissionSerializer_spec.js`) and create the extraction equivalents:

- `ExtractionRecord`, `ExtractionRecordFactory`, `ExtractionStore` — construction, `recordExtraction`, retention/eviction, `counts.extracted` accumulation, `clear`, `toJSON`, oldest-first ordering.
- `ExtractionRegistry` / `ExtractionRegistryInstance` — no-op-when-unbuilt for `recordExtraction`, throw-when-unbuilt for reads, `build`/`reset`, `lastId` filtering via `LogFilter`.
- `ExtractionConfig` — default `size` 100, `fromObject(undefined)`, `fromObject({ size })`.
- `ConfigParser` / `ConfigLoader` / `Config` — `extractionConfig` parsed from the `extraction:` key and defaulted.
- `ExtractionsHandler` — `{ counts, extractions }` shape, `last_id` cursor, `pageSize` cap.
- `ExtractionSerializer` — single object and array serialization, `timestamp` ISO string.
- `Router` spec — `/extractions.json` route registered.

Update the **changed** emission specs to cover the new `extractionId`:
- `EmissionRecord` / `EmissionRecordFactory` / `EmissionStore` — `extractionId` defaults to `null`, is stored, and appears in `toJSON`.
- `EmissionSerializer` — output includes `extractionId`.
- `EmitJob` spec — both success and failure `recordEmission` calls carry `extractionId`.
- `EmitEnqueuer` spec — `extractionId` forwarded into each enqueue payload.
- `ExtractionJob` spec — calls `ExtractionRegistry.recordExtraction` with `{ parserType, originUrl, itemCount }` and passes the resulting id to `EmitEnqueuer`; still calls `EmissionRegistry.incExtracted`.
- `ApplicationConfigurator` / `EngineController` specs — `ExtractionRegistry.build` on load, `ExtractionRegistry.clear` on engine `stop`.

Run `npm run test` and `npm run lint` in `source/`; `npm run check_docs` for JSDoc completeness.

## Docs

- `docs/agents/web-server.md` — add a `GET /extractions.json` subsection (request/response, `last_id`, cap, `counts.extracted` semantics) mirroring the `GET /emissions.json` one; add `extractionId` to the `/emissions.json` field description; add `extractions/ExtractionsHandler.js` to the handler tree; add the route to the endpoint table.
- `docs/agents/future/crawler/overview.md` and `docs/agents/future/crawler/decisions.md` — extend the observability description to note the per-extraction store, the emission→extraction link, and `GET /extractions.json` (reference this issue number).

## Files to Change

- `source/spec/**` — new extraction specs; updated emission / job / configurator specs (paths mirror the source tree).
- `docs/agents/web-server.md` — `/extractions.json` docs, `extractionId` field, handler tree, route table.
- `docs/agents/future/crawler/overview.md` — observability surface update.
- `docs/agents/future/crawler/decisions.md` — observability surface update.
