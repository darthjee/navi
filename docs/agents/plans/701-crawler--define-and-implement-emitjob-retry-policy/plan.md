# Plan: Crawler: define and implement EmitJob retry policy

Issue: [701-crawler--define-and-implement-emitjob-retry-policy.md](../issues/701-crawler--define-and-implement-emitjob-retry-policy.md)

## Overview

Give `EmitJob` its own retry policy (5 retries / 5000ms default, overridable per resource via `emit.retries`/`emit.cooldown`), distinguish retryable failures (5xx, 429 via `Retry-After`, 408, network errors) from non-retryable ones (other 4xx, dead-lettered immediately), and — as a prerequisite — redesign `deku-swarm`'s `Job`/`JobRegistryInstance` so a job's own `maxRetries`/cooldown actually take effect instead of being silently shadowed by the registry's global config.

## Agents involved

- [worker](worker.md)
- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

- **`Job` constructor** (`worker/lib/background/Job.js`) gains optional `{ maxRetries, cooldown } = {}` params, stored privately. `get maxRetries()` returns `this.#maxRetries ?? 3` (public default unchanged); a new `get cooldown()` returns `this.#cooldown` (`undefined` when not set at construction). A subclass's own getter override (e.g. `ExtractionJob`'s `get maxRetries() { return 1; }`) still fully replaces the base getter and wins regardless of what was passed to the constructor — no changes needed to `ExtractionJob`/`HtmlParseJob`/`ActionProcessingJob`/`PaginatedActionProcessingJob`.
- **`JobRegistryInstance#fail()`** (`worker/lib/background/JobRegistryInstance.js`) simplifies to `job.exhausted()` (no argument — uses the job's own `maxRetries`) and `job.applyCooldown(job.cooldown ?? this.#cooldown)` (job's own cooldown, falling back to the registry's configured global when the job doesn't declare one).
- **`RegistriesBuilder`** (`source/lib/services/builders/RegistriesBuilder.js`, engine) must pass `attributes: { maxRetries: config.workersConfig.maxRetries, cooldown: config.workersConfig.retryCooldown }` into the job factories that previously relied on the registry's implicit global (at minimum `ResourceRequestJob` and `AssetDownload`, harmlessly also the others), so those job types keep their current effective retry/cooldown behavior once `fail()` no longer applies the global implicitly.
- **`EmitJob`** (engine) does *not* receive the global `maxRetries`/`cooldown` from `RegistriesBuilder` — it computes its own effective values per instance (resource's `emit.retries`/`emit.cooldown` override, else its own 5/5000ms default) and overrides `get maxRetries()`/`get cooldown()` dynamically based on `this.lastError` (immediate exhaustion on non-retryable 4xx; capped `Retry-After` cooldown on 429).
- **`docs`**'s `deku-swarm` guide updates must describe the exact constructor param names/defaults worker implements — cross-check against `worker.md` before writing.

Full design rationale, numbers, and edge cases are already captured in the issue file linked above — this plan focuses on translating those decisions into concrete file-level work.
