# Gaps

The following points are **not fully defined** in this feature and are left open for future discussion or incremental implementation:

1. **External parser plugin system** — how npm packages or local files would be registered, discovered, and versioned. The architecture should allow extension, but the mechanism is not defined here. **Status: future, leave as idea.**

2. **Parser contract for external plugins** — the exact interface: what the parser receives (raw body string? response wrapper with headers?), what it returns (array of objects? object with fields? stream?). Tied to gap #1. **Status: open, part of future plugin system.**

3. **Expanded CSS selector parser** — the current `HtmlParser` extracts URLs from attributes (`href`, `src`). Extending it to extract text and arbitrary attributes as data (not URLs) is a natural extension, but outside the initial scope. Regex covers simple HTML cases. **Status: future.**

4. **Batch emission** — currently one `EmitJob` per item. For large catalogs (e.g., 28 miniatures = 28 POSTs), batching may be desirable. **Status: future. The architecture should allow adding this later.**

5. **Deduplication / visit tracking** — if the same resource is processed multiple times (e.g., multiple Navi runs), the same items will be emitted repeatedly. No idempotency control. **Status: future. To be determined whether this is Navi's responsibility or the receiving endpoint's.**

6. **Multi-condition filter syntax** — the Loot Studios use case requires filtering `obj_type == "miniature"` AND `bnd_inid == bundle_inid`. The filter syntax for multiple conditions is not fully defined. **Status: to be defined.**

7. **Custom headers per `emit`** — the `client` already provides base headers. It may be necessary to add specific headers per `emit` (e.g., explicit `Content-Type: application/json`). **Status: to be defined.**
