# Issue: Crawler: define and implement EmitJob retry policy

## Description

Decide and implement an explicit retry policy for `EmitJob` (#676, `source/lib/jobs/EmitJob.js`) — its own default retry count/cooldown, a per-resource override in the YAML, a distinction between retryable and non-retryable failures, and honoring `Retry-After` on rate-limited responses. Part of #699 (Next Steps for Crawler Implementation).

## Problem

`EmitJob` sends extracted items to external endpoints and currently uses the same shared retry/dead-letter path as `AssetDownloadJob` — the global `workers.max-retries`/`retry_cooldown` (3 retries, 2000ms), with no distinction between failure modes. External endpoints may be rate-limited, temporarily unavailable, or return non-2xx status codes, and none of that is accounted for today: no per-resource control, no distinction between transient (5xx/timeouts) and permanent (4xx) failures, and no `Retry-After` awareness for 429s.

Investigating the fix also surfaced a related, pre-existing bug: `JobRegistryInstance#fail()` (`worker/lib/background/JobRegistryInstance.js:64-71`) always applies the registry's global `maxRetries`/cooldown to every job, ignoring any job-type's own `get maxRetries()` override. This means `ExtractionJob`, `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob`'s documented "no retry rights" (`get maxRetries() { return 1; }`) has never actually taken effect in production — and it's also what blocks a per-resource `EmitJob` override from working, so fixing it is a prerequisite for this issue.

## Expected Behavior

- `EmitJob` has its own default retry policy, distinct from the global `workers.max-retries`/`retry_cooldown`: **5 retries, 5000ms cooldown** — external endpoints are more likely to be transiently flaky than Navi's own crawl targets.
- That default is overridable per resource via `emit.retries`/`emit.cooldown` in the YAML (both optional).
- **Retryable**: 5xx responses, 429 (via `Retry-After`), 408 Request Timeout, and network-level errors with no HTTP response at all (timeouts, connection refused, DNS failures).
- **Not retryable** (dead-letter immediately after the first attempt): all other 4xx responses (400, 401, 403, 404, 422, etc.) — these won't resolve by waiting.
- A later non-retryable error always wins: exhaustion is decided by the *most recent* error, not cumulative history — e.g. a retryable 503 on attempt 1 followed by a non-retryable 404 on attempt 2 dead-letters immediately, even with retries remaining.
- 429 responses honor `Retry-After`, capped at 60000ms (60s); the wait still consumes a retry attempt like any other failure. A missing/non-numeric value, or an HTTP-date the parser doesn't handle, falls back to the normal cooldown.
- `retries: 0` is valid and means "one attempt, no retries."

## Solution

**YAML config** — add optional `retries`/`cooldown` keys inside the existing `emit:` block (`ResourceRequestEmit`, alongside `client`/`method`/`url`/`status`):

```yaml
emit:
  client: some_client
  method: POST
  url: /some/endpoint
  status: 200
  retries: 5       # optional — overrides EmitJob's default (5) for this resource
  cooldown: 5000   # optional — overrides EmitJob's default (5000ms) for this resource
```

Invalid values (negative, non-numeric) throw a config-time error, following the existing one-exception-per-validation pattern in `ResourceRequestEmit.js` (`InvalidEmitMethod`, `MissingEmitUrl`): new `InvalidEmitRetries`/`InvalidEmitCooldown` exceptions.

**`EmitJob`** overrides `get maxRetries()` to inspect `this.lastError` — when it's a `RequestFailed` with a non-retryable status, it returns `this._attempts` (forcing immediate exhaustion regardless of the configured retry count); otherwise it returns the configured value (resource override, or the 5/5000ms default).

**`deku-swarm` (`worker/`) redesign** — a real change to a published, independently-versioned npm package (`worker/package.json`, currently `1.8.2`), not a Navi-only tweak:

- `Job`'s constructor gains optional `{ maxRetries, cooldown } = {}` params, stored privately, defaulting to the existing hardcoded values (`3` for `maxRetries`) when omitted — the public default stays unchanged. A subclass's own `get maxRetries()` getter override still takes precedence over whatever was injected at construction.
- `JobFactory`/`RegistriesBuilder` inject the registry's configured global values when building each job instance, for job types that don't hardcode their own override.
- `JobRegistryInstance#fail()` simplifies to `job.exhausted()` (no argument) and `job.applyCooldown(job.cooldown)`, since the job itself now carries the correct effective value either way.
- Additive and backward-compatible for existing `deku-swarm` consumers (defaults unchanged when the new constructor params are omitted), but a real behavior change once in effect — warrants a `deku-swarm` version bump and a Navi version bump once its dependency is updated (the user will handle both before release).
- Docs to update: `docs/guides/deku-swarm/defining-jobs.md`, `docs/guides/deku-swarm/reference.md`, and Navi's own `docs/agents/flow/failure-handling.md`.

**Document the decision** in `docs/agents/future/crawler/decisions.md`, appending:

| # | Decision | Rationale |
|---|---------|-----------|
| 14 | `EmitJob` gets its own default retry policy — **5 retries, 5000ms cooldown** — distinct from the global `workers.max-retries`/`retry_cooldown` (3/2000ms) | External endpoints are more likely to be transiently flaky than Navi's own crawl targets |
| 15 | `EmitJob`'s retry policy is overridable per resource via `emit.retries`/`emit.cooldown` (both optional, short-named since already scoped under `emit:`) | Lets specific resources tune retry behavior without a global change |
| 16 | `EmitJob` retries on 5xx, 429, 408, and network-level errors (no HTTP response); dead-letters immediately on all other 4xx | These represent bad requests/config/auth issues that won't resolve by waiting |
| 17 | 429 responses honor `Retry-After` (capped at 60s), consuming a retry attempt like any other failure; malformed/missing values fall back to the normal cooldown | Respects server-signaled backoff without risking unbounded waits |
| 18 | `deku-swarm`'s `Job`/`JobRegistryInstance` redesigned so per-job `maxRetries`/cooldown actually take effect (constructor-injected, subclass getter override still wins), instead of being silently shadowed by the registry's global config | Fixes a pre-existing gap where per-job-type overrides (e.g. `ExtractionJob`'s "no retry rights") were never honored by the real failure path; also what makes #14/#15 possible |

**Out of scope**: changing the configured retry values for `ResourceRequestJob`/`AssetDownloadJob`/other existing job types (only the underlying `fail()` enforcement gap is fixed, their own values are untouched); general client-computed exponential-backoff strategies (only the server-provided `Retry-After` header is honored); any dead-letter-queue UI/inspection changes.

**Known accepted risk**: retrying a timed-out POST/PUT/PATCH could re-apply an external mutation that actually succeeded server-side before the response was lost — Navi has no idempotency-key mechanism today. Accepted, not solved by this issue.

**Ownership**: spans both the `engine` specialist (`EmitJob` itself) and the `worker` specialist (`deku-swarm`'s `Job`/`JobRegistryInstance`/`JobFactory`).

**Tests**: coverage for the new `EmitJob` retry behavior (default/override, 4xx-vs-5xx, `Retry-After` handling) and for the `JobRegistryInstance.fail()` fix (per-job override now actually respected, including the existing "no retry rights" job types).

## Benefits

- Clearer, more resilient handling of flaky or rate-limited external endpoints, without wasting retry cycles on permanent 4xx failures.
- Fixes a real dormant bug in `deku-swarm`'s retry machinery, making the documented "no retry rights" behavior for `ExtractionJob`/`HtmlParseJob`/`ActionProcessingJob`/`PaginatedActionProcessingJob` actually work in production, and making the web UI's `remainingAttempts` display accurate.
- Establishes a reusable per-job retry/cooldown override pattern in `deku-swarm` that future job types can build on.
