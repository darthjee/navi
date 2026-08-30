# Wire the global default into RegistriesBuilder

Now that `JobRegistryInstance.fail()` (worker) no longer implicitly applies the registry's global `maxRetries`/cooldown to every job, `ResourceRequestJob` and `AssetDownloadJob` — which don't override `get maxRetries()` and have no concept of their own cooldown — need the global config injected explicitly at construction time to keep their current effective behavior.

- Add `attributes: { maxRetries: config.workersConfig.maxRetries, cooldown: config.workersConfig.retryCooldown }` to the `JobFactory.build(...)` calls for `ResourceRequestJob` and `AssetDownload` at minimum. Adding it to the other non-`Emit` factories (`Action`, `PaginatedAction`, `HtmlParse`, `Extraction`) is harmless — their subclass `get maxRetries()` overrides win regardless — and keeps the builder uniform; do it for all of them unless it reads worse than special-casing just the two that need it.
- Do **not** add it to the `Emit` factory — `EmitJob` computes its own effective values (step 03).

## Files to Change

- `source/lib/services/builders/RegistriesBuilder.js` — extend the relevant `JobFactory.build(...)` calls as above.
