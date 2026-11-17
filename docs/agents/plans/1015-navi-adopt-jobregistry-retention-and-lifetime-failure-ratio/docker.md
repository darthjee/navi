# Docker Plan: Navi: adopt JobRegistry retention and lifetime failure ratio

Main plan: [plan.md](plan.md)

## Shared contracts

- Env vars `RETENTION_FINISHED`, `RETENTION_DEAD`, defined **empty** by default → `workers.retention.finished` / `.dead`. Empty interpolates to YAML `null`, which the engine treats as "no cap"; defining them (vs. leaving them undefined) avoids the `Environment variable not defined` boot warning.
- YAML shape: `workers.retention: { finished, dead }`.

## Implementation Steps

### Step 1 — Production image env vars

- `dockerfiles/production_navi_hey/Dockerfile`: add `ENV RETENTION_FINISHED=` and `ENV RETENTION_DEAD=` next to `MAX_RETRIES`.
- `dockerfiles/production_navi_hey/config/web.yml`: under `workers:` add

  ```yaml
    retention:
      finished: $RETENTION_FINISHED
      dead: $RETENTION_DEAD
  ```

### Step 2 — Dev sample config

`docker_volumes/config/navi_config.yml.sample` (data owned by architect; edited here as part of the same config change): add a small cap so pruning is visible locally:

```yaml
workers:
  ...
  retention:
    finished: 20
    dead: 20
```

## Files to Change
- `dockerfiles/production_navi_hey/Dockerfile` — two empty `ENV`s.
- `dockerfiles/production_navi_hey/config/web.yml` — `retention` block.
- `docker_volumes/config/navi_config.yml.sample` — small retention caps.

## Notes
- Manual verification (from the issue), after building the image from the branch:
  - no retention vars → boots with no undefined-variable warning, no Pruned group on the dashboard;
  - `RETENTION_FINISHED=5 RETENTION_DEAD=5` → after a run with >5 finished jobs, Pruned group shows and `/stats.json` reports `jobs.pruned.finished > 0`;
  - `RETENTION_FINISHED=abc` → boot fails with deku-swarm's `Invalid retention.finished` error.
- No new automated image smoke tests (out of scope).
