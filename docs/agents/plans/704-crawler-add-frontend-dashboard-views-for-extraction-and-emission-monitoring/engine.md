# Engine Plan: Crawler: add frontend dashboard views for extraction and emission monitoring

Main plan: [plan.md](plan.md)

## Shared contracts

This agent **produces** all three contracts in [plan.md](plan.md#shared-contracts):

1. Add `extractionId: number | null` to every emission record and to `GET /emissions.json` entries (`EmissionSerializer` output: `{ id, extractionId, status, url, method, httpStatus, error, itemRef, timestamp }`).
2. Add `GET /extractions.json` returning `{ counts: { extracted }, extractions: [{ id, parserType, originUrl, itemCount, timestamp }] }`, oldest-first, `?last_id=` cursor, capped at `web.logs_page_size`.
3. No change to `GET /stats.json` — it already exposes `emissions: { extracted, emitted, failed, dead }`.

Mirror the #703 emission-tracking implementation everywhere: the new extraction code is a structural copy of `source/lib/utils/emissions/*` and `source/lib/registry/EmissionRegistry*.js`, adapted to extraction fields.

## Steps

- [01 — Add the extraction record store](engine/01-add-extraction-store.md)
- [02 — Add the ExtractionRegistry facade](engine/02-add-extraction-registry.md)
- [03 — Add ExtractionConfig and bootstrap/reset wiring](engine/03-add-extraction-config.md)
- [04 — Record extractions and link emissions](engine/04-record-extractions-and-link-emissions.md)
- [05 — Add the GET /extractions.json endpoint](engine/05-add-extractions-endpoint.md)
- [06 — Tests and docs](engine/06-tests-and-docs.md)

## CI Checks

- `source`: `npm run test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)
- `source`: `npm run check_docs` — every new class needs complete JSDoc, matching the #703 files.

## Notes

- Keep the existing `EmissionRegistry.incExtracted(items.length)` call in `ExtractionJob.perform()` — do not remove it. The new extraction store's counter is additional, not a replacement (see [plan.md](plan.md#notes)).
- `LogFilter` (`source/lib/utils/logging/LogFilter.js`) is reused by `EmissionRegistryInstance.getRecords` for the `lastId` cursor — reuse it identically in `ExtractionRegistryInstance`.
- `originUrl` is the only resource identifier available in `ExtractionJob` (private `#originUrl`, already used by its `arguments` getter). Threading a real resource name/namespace is out of scope.
- Confirm per-enqueue `extractionId` reaches the `EmitJob` constructor through `RegistriesBuilder`'s `JobFactory.build('Emit', …)` the same way `item` / `emit` / `parameters` do; if the factory whitelists constructor keys, add `extractionId`.
