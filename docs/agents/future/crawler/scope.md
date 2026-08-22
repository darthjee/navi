# Scope

## Included in this feature

- New `parser` section in the YAML configuration of each resource, declaring the parser type and match/filter/fields rules
- New `emit` section in the YAML configuration, declaring the destination for extracted data (client, method, url)
- New job type: **`ExtractionJob`** — receives the raw body of the response, invokes the configured parser, produces structured items
- New job type: **`EmitJob`** — receives one extracted item and makes an HTTP request to the configured endpoint
- Built-in parser: **regex standalone** — applied directly on the raw body, returns captured groups as fields
- Built-in parser: **json_path** — navigates the parsed JSON, filters items by conditions, maps fields
- `EmitJob` enqueued **one per extracted item** (no batching)
- `EmitJob` uses an existing `client` from the YAML (with `base_url`, `headers`, `timeout`, etc.)
- `EmitJob` supports multiple HTTP methods: **POST, PUT, PATCH** (for upsert scenarios)
- `EmitJob` retry policy follows the **same pattern as `ResourceRequestJob`** (retries via `max-retries` and `retry_cooldown`)
- `ExtractionJob` has **no retry rights** — exhausted on first failure (same as `ActionProcessingJob` and `HtmlParseJob`)

## Out of scope (future)

- **External parser plugin system** (npm packages, local files, programmatic registration) — the architecture should allow future extension, but the mechanism is not defined in this feature
- **Parser contract for external plugins** — the input/output interface for plugins — left open
- **Batch emission** (multiple items in a single payload) — currently one `EmitJob` per item; the architecture should allow adding this later
- **Visit tracking / deduplication** between executions — no persistence of visited URLs
- **Post-processing of parser output** (e.g., regex applied on top of CSS selector result) — not supported in this version
- **Expanded CSS selector parser** for HTML data extraction (beyond what `HtmlParser` already does for assets) — future; regex covers simple HTML cases for now
