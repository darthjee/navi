# Record extractions and link emissions

Wire `ExtractionJob` to record an extraction, then thread that extraction's `id` through `EmitEnqueuer` → `EmitJob` → the emission record, so every emission carries `extractionId`.

## ExtractionJob.perform()

In `source/lib/jobs/ExtractionJob.js`, after `const items = parserImpl.extract(...)` and the existing debug log:

```js
EmissionRegistry.incExtracted(items.length); // keep as-is
const extraction = ExtractionRegistry.recordExtraction({
  parserType: this.#parser.type,
  originUrl: this.#originUrl,
  itemCount: items.length,
});
const extractionId = extraction?.id ?? null;

if (this.#emit) {
  new EmitEnqueuer(items, this.#emit, this.#parameters, this.#jobRegistry, extractionId).enqueue();
}
```

`ExtractionRegistry.recordExtraction` no-ops (returns `undefined`) when the registry is not built, so `extractionId` falls back to `null` — jobs and their existing specs keep working without building the registry.

## EmitEnqueuer

In `source/lib/enqueuers/EmitEnqueuer.js`, add a trailing `extractionId` constructor parameter (after `jobRegistry`), store it, and include it in each enqueue call:

```js
this.#jobRegistry.enqueue('Emit', {
  item, emit: this.#emit, parameters: this.#parameters, extractionId: this.#extractionId,
});
```

## EmitJob

In `source/lib/jobs/EmitJob.js`:
- Accept `extractionId` in the constructor params object; store `#extractionId` (default `null`).
- Pass `extractionId: this.#extractionId` into **both** `EmissionRegistry.recordEmission({ ... })` calls (the success branch and the failure branch).

## EmissionRecord / EmissionStore / EmissionRecordFactory

Thread `extractionId` (default `null`) through the record:
- `source/lib/utils/emissions/EmissionRecord.js` — new private `#extractionId`, constructor param `extractionId = null`, getter, and `extractionId` key in `toJSON()`.
- `source/lib/utils/emissions/EmissionRecordFactory.js` — accept `extractionId` in `build({ ... })` and forward to `new EmissionRecord(id, { ..., extractionId })`.
- `source/lib/utils/emissions/EmissionStore.js` — `recordEmission({ ..., extractionId })` forwards `extractionId` to `this.#factory.build(...)`. Counters unchanged.
- `EmissionRegistryInstance` / `EmissionRegistry` already forward the whole `details` object — no change needed beyond confirming.

## EmissionSerializer

`source/lib/serializers/EmissionSerializer.js` — add `extractionId: record.extractionId` to `_serializeObject` output (place it right after `id`).

## RegistriesBuilder check

`source/lib/services/builders/RegistriesBuilder.js:41` builds the `'Emit'` `JobFactory` with static `attributes`. Confirm per-enqueue params (`item`, `emit`, `parameters`) are merged into the constructor args by `JobFactory` and add `extractionId` to whatever mechanism carries them (a new static attribute is **not** wanted — `extractionId` is per-enqueue). If `JobFactory` passes the enqueue payload straight through, no change is required here.

## Files to Change

- `source/lib/jobs/ExtractionJob.js` — record an extraction, pass `extractionId` to `EmitEnqueuer`.
- `source/lib/enqueuers/EmitEnqueuer.js` — accept and forward `extractionId`.
- `source/lib/jobs/EmitJob.js` — accept `extractionId`, stamp it on both `recordEmission` calls.
- `source/lib/utils/emissions/EmissionRecord.js` — add `extractionId`.
- `source/lib/utils/emissions/EmissionRecordFactory.js` — forward `extractionId`.
- `source/lib/utils/emissions/EmissionStore.js` — forward `extractionId` in `recordEmission`.
- `source/lib/serializers/EmissionSerializer.js` — serialize `extractionId`.
- `source/lib/services/builders/RegistriesBuilder.js` — only if the `'Emit'` factory needs `extractionId` whitelisted.
