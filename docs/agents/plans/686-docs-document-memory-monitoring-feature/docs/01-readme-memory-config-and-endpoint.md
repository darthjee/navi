# Document `web.memory` config and `GET /memory/status.json` in README.md

Add the `web.memory` configuration block to the `## Configuration File` section, and document the new monitoring endpoint.

In `### Structure` (the big YAML example), extend the existing `web:` block with a `memory:` sub-block, matching the existing comment style:

```yaml
web:
  port: 3000
  autostart: true
  idle_timeout: 900
  memory:
    maximum: 2147483648        # optional: memory ceiling in bytes (default: resolved automatically)
    thresholds:                # optional: percentage-of-maximum boundaries for the reported status
      low: 25.0
      medium: 50.0
      high: 75.0
      over: 100.0
```

In `### Fields`, add rows right after the existing `web.idle_timeout` row:

| Field | Description |
|-------|-------------|
| `web.memory.maximum` | Optional. Memory ceiling in bytes used to compute the usage percentage exposed by `GET /memory/status.json`. When omitted, resolved automatically via a fallback chain: configured value → cgroup v2 limit → cgroup v1 limit → OS total memory. |
| `web.memory.thresholds.low` / `.medium` / `.high` / `.over` | Optional. Percentage-of-maximum boundaries used to derive the reported `status` (`low`/`medium`/`high`/`over`), checked from the top down with inclusive (`>=`) boundaries. Default `{low: 25, medium: 50, high: 75, over: 100}`. Must be strictly ascending (`low < medium < high < over`) or the config is rejected at startup. |

Then, near the existing `PATCH /engine/start`/`PATCH /engine/shutdown` mentions (or as a new short paragraph under `### Fields`), document the endpoint itself:

- `GET /memory/status.json` — unauthenticated, like the other `GET` monitoring endpoints (no `web.api.token` involved). Responds with:
  ```json
  { "current": 134217728, "maximum": 2147483648, "percentage": 6.25, "status": "low" }
  ```
  `current`/`maximum` are byte counts (`current` is the process RSS); `percentage` is `current / maximum * 100`; `status` is one of `low`/`medium`/`high`/`over`, derived from `percentage` against `web.memory.thresholds`.

## Files to Change

- `README.md` — extend the `web:` YAML example and `### Fields` table with `web.memory.*`; document `GET /memory/status.json`'s response shape.
