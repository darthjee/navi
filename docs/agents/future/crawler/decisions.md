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
