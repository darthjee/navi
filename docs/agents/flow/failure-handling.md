# Failure Handling

## Failure Handling

1. Job failure counter is incremented; last exception stored.
2. If not exhausted: `job.applyCooldown(cooldown)` sets `readyBy = Date.now() + cooldown`. Job goes to the `failed` `SortedCollection`.
3. If exhausted: job moves to `dead`.
4. `JobRegistry.promoteReadyJobs()` (each engine tick) moves jobs with `readyBy ≤ Date.now()` back to `retryQueue`.

`ResourceRequestJob` retries up to `max-retries` times. `ActionProcessingJob`, `PaginatedActionProcessingJob`, and `HtmlParseJob` are exhausted after the **first** failure.

---

## Failure Threshold

After `Application.run()` finishes, if the config has a `failure:` key:

- `ratio = (dead / (dead + finished)) * 100`
- If `ratio > threshold`, `process.exit(1)` is called so CI pipelines detect partial failure.
