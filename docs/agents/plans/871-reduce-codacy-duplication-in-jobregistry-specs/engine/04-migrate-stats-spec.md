# Migrate and table-drive the stats spec
Replace the hand-built `ClientRegistry`, queues and collections in `JobRegistry_stats_spec.js` with `JobRegistryUtils.setup()` (confirm the specs pass without `clients`), and iterate the scenarios from step 02, asserting each scenario's expected `stats()` object. Build each expected object from a zero-count base (`{ enqueued: 0, processing: 0, failed: 0, retryQueue: 0, finished: 0, dead: 0, total: 0 }`) plus overrides, instead of six fully spelled-out literals. Keep the "no jobs added" case and every current expected value, including `total` (1 for finished and dead, 0 for the others).

## Files to Change
- `source/spec/lib/registry/JobRegistry_stats_spec.js` — migrate setup, table-drive scenarios
