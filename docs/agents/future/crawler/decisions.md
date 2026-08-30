# Decisions

| # | Decision | Rationale |
|---|---------|-----------|
| 1 | Parser is selected **explicitly** in the YAML per resource | Full user control; does not assume content-type automatically |
| 2 | Regex is a **standalone parser** | Applied directly on the raw body; not a post-processor of another parser |
| 3 | Parser receives the **raw body** (string) as input | Simplicity; the parser decides how to interpret the content |
| 4 | `ExtractionJob` is a **new job type**, parallel in the chain | Does not couple extraction with chaining; allows free combination |
| 5 | `EmitJob` is a **new job type**, one per extracted item | Granular retry control and tracking; each item is independent |
| 6 | Children processing **reuses existing chaining** (`ActionProcessingJob`) | Does not invent a new discovery mechanism; uses what already works |
| 7 | `emit` uses **existing `clients`** from the YAML | Reuses authentication, timeout, and headers infrastructure |
| 8 | Job name: **`EmitJob`** | "Emits" data out of Navi; clean and descriptive |
| 9 | `EmitJob` retry policy follows **`ResourceRequestJob` pattern** | Retries via `max-retries` and `retry_cooldown`; consistent with existing HTTP job behavior |
| 10 | `ExtractionJob` has **no retry rights** | Exhausted on first failure; same as `ActionProcessingJob` and `HtmlParseJob` — parser failures are configuration errors, not transient |
| 11 | `EmitJob` supports **POST, PUT, and PATCH** methods | Covers create, upsert, and partial update scenarios |
| 12 | `json_path` `filter` conditions support **field-to-field comparison** via `equals_field` (in addition to the existing `equals` literal comparison), all conditions AND'ed | Covers cases like `bnd_inid == bundle_inid` where both sides come from the same item, without inventing a join mechanism |
| 13 | `json_path` `match` supports **dot-notation nested paths** (e.g. `data.items`), not just a flat top-level key | Real-world APIs commonly nest the target array; matches the existing dot-notation convention used elsewhere in the config |
| 14 | `EmitJob` gets its own default retry policy — **5 retries, 5000ms cooldown** — distinct from the global `workers.max-retries`/`retry_cooldown` (3/2000ms) | External endpoints are more likely to be transiently flaky than Navi's own crawl targets |
| 15 | `EmitJob`'s retry policy is overridable per resource via `emit.retries`/`emit.cooldown` (both optional, short-named since already scoped under `emit:`) | Lets specific resources tune retry behavior without a global change |
| 16 | `EmitJob` retries on 5xx, 429, 408, and network-level errors (no HTTP response); dead-letters immediately on all other 4xx | These represent bad requests/config/auth issues that won't resolve by waiting |
| 17 | 429 responses honor `Retry-After` (capped at 60s), consuming a retry attempt like any other failure; malformed/missing values fall back to the normal cooldown | Respects server-signaled backoff without risking unbounded waits |
| 18 | `deku-swarm`'s `Job`/`JobRegistryInstance` redesigned so per-job `maxRetries`/cooldown actually take effect (constructor-injected, subclass getter override still wins), instead of being silently shadowed by the registry's global config | Fixes a pre-existing gap where per-job-type overrides (e.g. `ExtractionJob`'s "no retry rights") were never honored by the real failure path; also what makes #14/#15 possible |
| 19 | Optional per-emit `emit.headers` map is **merged over** the resolved client headers, with `emit.headers` winning on key collision (never a full override); values resolve `$VAR` at config load like client headers | Per-emit auth/routing (e.g. a distinct `Authorization` or `Content-Type`) without cloning a whole client just to change one header |
| 20 | Emission tracking (#703) uses a `LogRegistry`-style static **`EmissionRegistry`** over a `MemoryDataStore`-style (#698) ring buffer, sized by the top-level **`emit.size`** (default 100). Per-emission records carry `status` ∈ {`success`, `failed`, `dead`}; `emitted`/`failed`/`dead`/`extracted` counters stay exact for the run even past ring-buffer eviction. Write helpers (`incExtracted`/`recordEmission`) **no-op when the registry is unbuilt**; read helpers stay strict. Data resets on engine stop, alongside the log buffers. Exposed at `GET /emissions.json` (`{ counts, emissions }`, `?last_id=` cursor, `web.logs_page_size` page size) and summarised under `emissions` in `GET /stats.json` | Reuses the proven `LogRegistry`/`MemoryDataStore` patterns; the unbuilt no-op keeps the core `EmitJob`/`ExtractionJob` flow decoupled from observability so existing specs need no registry setup |
