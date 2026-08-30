# Simplify JobRegistryInstance.fail()

`fail()` currently always applies the registry's own configured `maxRetries`/cooldown to every job, ignoring any per-job override (the bug this issue depends on fixing). Change it to trust the job's own effective values, added in step 01, falling back to the registry's configured global only when the job doesn't declare its own.

- Exhaustion check becomes `job.exhausted()` (no argument) instead of `job.exhausted(this.#maxRetries)` — `exhausted()`'s own default parameter (`maxRetries = this.maxRetries`) now does the right thing since `job.maxRetries` is meaningful per step 01.
- Cooldown application becomes `job.applyCooldown(job.cooldown ?? this.#cooldown)` instead of `job.applyCooldown(this.#cooldown)` — falls back to the registry's configured global when the job's own `cooldown` getter returns `undefined`.

## Files to Change

- `worker/lib/background/JobRegistryInstance.js` — update `fail()` as described above (lines currently at `64-71`).
- `docs/agents/flow/failure-handling.md` (Navi-internal, not user-facing) — currently states `ResourceRequestJob retries up to max-retries times. ActionProcessingJob, PaginatedActionProcessingJob, and HtmlParseJob are exhausted after the first failure` as already-true; update it to reflect that this is now genuinely enforced (rather than silently ignored by `fail()`), and mention `EmitJob`'s own policy is documented in the crawler decisions log instead of here.
