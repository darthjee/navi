# Document the decisions

Record the final decisions in the crawler's own decision log, and note that the "no retry rights" job types now actually work as documented (the accompanying `deku-swarm`-side doc update lives in `worker`'s scope via `docs`, not here).

Append to `docs/agents/future/crawler/decisions.md`:

| # | Decision | Rationale |
|---|---------|-----------|
| 14 | `EmitJob` gets its own default retry policy — **5 retries, 5000ms cooldown** — distinct from the global `workers.max-retries`/`retry_cooldown` (3/2000ms) | External endpoints are more likely to be transiently flaky than Navi's own crawl targets |
| 15 | `EmitJob`'s retry policy is overridable per resource via `emit.retries`/`emit.cooldown` (both optional, short-named since already scoped under `emit:`) | Lets specific resources tune retry behavior without a global change |
| 16 | `EmitJob` retries on 5xx, 429, 408, and network-level errors (no HTTP response); dead-letters immediately on all other 4xx | These represent bad requests/config/auth issues that won't resolve by waiting |
| 17 | 429 responses honor `Retry-After` (capped at 60s), consuming a retry attempt like any other failure; malformed/missing values fall back to the normal cooldown | Respects server-signaled backoff without risking unbounded waits |
| 18 | `deku-swarm`'s `Job`/`JobRegistryInstance` redesigned so per-job `maxRetries`/cooldown actually take effect (constructor-injected, subclass getter override still wins), instead of being silently shadowed by the registry's global config | Fixes a pre-existing gap where per-job-type overrides (e.g. `ExtractionJob`'s "no retry rights") were never honored by the real failure path; also what makes #14/#15 possible |

## Files to Change

- `docs/agents/future/crawler/decisions.md` — append the table above.
