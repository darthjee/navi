# Issue: Navi: adopt JobRegistry retention and lifetime failure ratio

## Description

Wire deku-swarm's terminal-job retention (#1006) into navi: a new optional `workers.retention: { finished, dead }` config block (also exposed as `RETENTION_FINISHED` / `RETENTION_DEAD` env vars in the `navi-hey` production image) bounds how many finished and dead jobs stay in memory, while `FailureChecker` and `RunSummary` switch to lifetime counts (resident + pruned) so pruning never distorts the `failure.threshold` verdict or the final run log. The dashboard gains a Pruned counters group.

Follow-up of [#1006](https://github.com/darthjee/navi/issues/1006), which is scoped to the deku-swarm package only. Part of the deku-swarm adoption track alongside [#1017](https://github.com/darthjee/navi/issues/1017) (wiring `onWorkerIdle` to `Engine#wake()`), which established the pattern of a config/plumbing change in `source/` plus a doc update.

Affected package: navi app (`source/`), the SPA (`frontend/`) and the production image (`dockerfiles/production_navi_hey/`). Reference docs: `docs/agents/deku-swarm.md` (worker subsystem, `JobRegistryInstance` collections), `docs/agents/flow/failure-handling.md` (`failure.threshold` ratio), `docs/agents/web-server.md` (`/stats.json` and the job serializers), `docs/agents/architecture/source-layout.md` (`services/` and `serializers/` layout).

Documentation to update alongside the code: `docs/agents/flow/startup-and-config.md` (add the `workers.retention` block, including the history-for-memory trade-off and that a previously ignored `workers.retention` key is now validated), `docs/agents/flow/failure-handling.md` (state that the ratio is now lifetime-based, where lifetime means since the last stop/`clearQueues()`), and `docs/agents/web-server.md` (document `jobs.pruned` in the `/stats.json` payload). User-facing docs are listed under *User-facing documentation* above.

## Problem

Deku-swarm #1006 added terminal-job pruning to `JobRegistry` (`build({ retention })`, `prune()`, `Job#endedAt`, `stats().pruned`), but navi's own `source/` does not consume any of it.

Navi builds the registry in `source/lib/services/builders/RegistriesBuilder.js`, where `JobRegistry.ensureBuild` is called with only `cooldown` and `maxRetries`:

```
JobRegistry.ensureBuild({ cooldown: config.workersConfig.retryCooldown, maxRetries: config.workersConfig.maxRetries });
```

`JobRegistryInstance` keeps `#finished` and `#dead` as unbounded `IdentifyableCollection`s. In a long-lived process — the normal case when `web.port` is set and `Engine` runs with `keepAlive: true` — every completed and every dead job stays resident for the whole process lifetime. The only current way to release that memory is `clearQueues()`, which also drops `#enqueued`, `#retryQueue` and `#failed`, so pending work would be lost.

A second, independent problem appears as soon as retention is enabled. `FailureChecker` derives its exit-code ratio from the in-memory counters:

```
#loadStats() {
  const { dead, total } = JobRegistry.stats();
  this.#dead = dead;
  this.#total = total;
}
#ratio() {
  this.#cachedRatio ??= (this.#dead / this.#total) * 100;
}
```

Because `stats().total` is `dead + finished`, the ratio is `dead / (dead + finished)` over whatever survived in memory. With a retention cap, a run of 1000 jobs where 50 died reports `dead: 10, finished: 10` and a 50% ratio instead of the real 5% — `failure.threshold` would call `process.exit(1)` on a healthy run. Pruning must never distort the failure signal.

### Current behaviour (reference)

| Location | Behaviour today |
| --- | --- |
| `source/lib/services/builders/RegistriesBuilder.js` | Calls `JobRegistry.ensureBuild({ cooldown, maxRetries })`; no `retention` is forwarded, so `#finished` and `#dead` grow without bound. |
| `source/lib/models/configs/WorkersConfig.js` | Exposes `quantity`, `retryCooldown`, `sleep`, `maxRetries`. No retention key is parsed. |
| `source/lib/services/config/ConfigParser.js` | `#workersConfig()` returns `new WorkersConfig(this.config.workers)`; `#failureConfig()` returns `FailureConfig.fromObject(this.config.failure)`. No retention section is read. |
| `source/lib/models/configs/Config.js` | Holds `workersConfig`, `webConfig`, `logConfig`, `emitConfig`, `extractionConfig`, `failureConfig`. No retention field. |
| `source/lib/services/execution/FailureChecker.js` | Computes `dead / total` from `stats()`, memoizes it in `#cachedRatio`, and calls `process.exit(1)` when the ratio exceeds `failureConfig.threshold`. |
| `source/lib/services/execution/RunReporter.js` | Reads `stats()` and builds `RunSummary` with `totalJobs: stats.total` and `failedJobs: stats.failed + stats.retryQueue + stats.dead`, then runs `FailureChecker`. |
| `source/lib/services/execution/RunSummary.js` | Formats `Total`, `Failed`, `Threshold` and `Result` lines from the injected counts. |
| `source/lib/server/handlers/StatsHandler.js` | Responds with `{ jobs: JobRegistry.stats(), workers: WorkersRegistry.stats(), emissions: EmissionRegistry.counts }`, so `jobs.pruned` is already present in the payload once `stats()` reports it. |
| `frontend/src/components/elements/StatsDisplay.jsx` | Renders Workers (idle, busy), Jobs (enqueued, processing, failed, finished, dead) and Emissions (extracted, emitted, failed, dead) groups. No `pruned` group. |
| `deku-swarm/lib/background/JobRegistry.js` | Already forwards `retention` to `JobRegistryInstance`, exposes `prune(options)` and returns `pruned: { finished, dead }` from `stats()`. |
| `deku-swarm/lib/background/Job.js` | Already exposes `endedAt`, `markEnded()` and `clearEnded()`. |

## Expected Behavior

- With no retention keys, `JobRegistry.ensureBuild` is called exactly as before and terminal collections stay unbounded.
- With `workers.retention.finished: N`, at most N finished jobs remain resident; the oldest are evicted as new jobs finish.
- With `workers.retention.dead: M`, at most M dead jobs remain resident.
- `WorkersRegistry.ensureBuild` receives `factory` and `quantity` explicitly — no `WorkersConfig` spread.
- A typo'd key inside `workers.retention` fails at boot with deku-swarm's `Invalid retention key` error.
- `failure.threshold` produces the same verdict for the same run whether or not retention is configured.
- `RunSummary` reports lifetime total and lifetime failed counts, never counts shrunk by pruning, and its `Result` line agrees with `FailureChecker`'s exit decision.
- `GET /stats.json` includes `jobs.pruned`.
- The dashboard shows the pruned counters.
- `docker_volumes/config/navi_config.yml.sample` sets small retention caps under `workers:`.
- The `navi-hey` production image accepts `RETENTION_FINISHED` / `RETENTION_DEAD`; with neither set, it behaves exactly as today and logs no undefined-variable warning.
- User-facing docs (`configuration-schema.md`, `prerequisites.md`, `reference.md`, `README.md`, `DOCKERHUB_DESCRIPTION.md`) document the retention keys and env vars.
- `yarn test` and `yarn lint` pass in `source/` and in `frontend/`.

## Solution

Configuration, in the `workers:` block:

```
workers:
  quantity: 5
  retry_cooldown: 2000
  sleep: 500
  max-retries: 3
  retention:                # optional block
    finished: 100           # optional; max finished jobs kept in memory
    dead: 100               # optional; max dead jobs kept in memory
```

The nested block mirrors `deku-swarm`'s `retention: { finished, dead }` contract 1:1, and leaves room for future retention options without new top-level `workers:` keys.

`WorkersConfig` gains a `retention` field, normalized in the constructor:

```
constructor({ quantity = 1, retry_cooldown: retryCooldown = 2000, sleep = 500, 'max-retries': maxRetries = 3, retention } = {}) {
  ...
  this.retention = WorkersConfig.#normalizeRetention(retention);
}

static #normalizeRetention(retention) {
  if (retention == null) return undefined;
  const entries = Object.entries(retention).filter(([, value]) => value != null);
  return entries.length ? Object.fromEntries(entries) : undefined;
}
```

Normalization only drops `null`/`undefined` values; every other key is forwarded as-is, so a typo such as `retention: { finshed: 100 }` reaches `JobRegistryInstance#validateRetention` and fails at boot with `Invalid retention key: finshed` instead of being silently ignored.

`RegistriesBuilder` forwards it to `JobRegistry`, and passes `quantity` explicitly to `WorkersRegistry` instead of spreading the whole `WorkersConfig`:

```
JobRegistry.ensureBuild({
  cooldown: config.workersConfig.retryCooldown,
  maxRetries: config.workersConfig.maxRetries,
  ...(config.workersConfig.retention ? { retention: config.workersConfig.retention } : {}),
});

WorkersRegistry.ensureBuild({
  factory: new WorkerFactory({ jobRegistry: JobRegistry, workersRegistry: WorkersRegistry, loggerFactory, onWorkerIdle }),
  quantity: config.workersConfig.quantity,
});
```

`WorkersRegistryInstance`'s constructor only reads `quantity`, `factory`, `workers`, `busy`, `idle`, `jobRegistry` and `workersRegistry`; the current `...config.workersConfig` spread already passes `retryCooldown`, `sleep` and `maxRetries`, which it ignores. Replacing the spread with an explicit `quantity` makes the real input visible and means no future `WorkersConfig` field ever needs to be stripped.

### Semantics

1. Both keys are optional and independent. Omitting both leaves today's behaviour untouched: `JobRegistry.ensureBuild` receives no `retention` key and the terminal collections stay unbounded.
2. Setting only one key caps only that status. An omitted status stays unbounded, matching `deku-swarm`'s per-status contract. `WorkersConfig` must **omit** the unset key rather than pass it as `undefined`: `JobRegistryInstance#validateRetention` iterates `Object.entries(retention)` and rejects any present key whose value is not a non-negative integer, so `{ finished: N, dead: undefined }` would throw `Invalid retention.dead` at boot.
2a. A `null` value (e.g. `dead: $RETENTION_DEAD` with the env var unset — interpolation runs on raw text before `YAML.parse`, so an empty substitution parses as `null`) is treated exactly like an absent key: no cap for that status. The same applies to an empty `retention:` block (parses as `null`) or one whose values are all `null` — `WorkersConfig#retention` is `undefined`. Default destructuring does not replace `null`, so `#normalizeRetention`'s `!= null` filter is what enforces this.
3. `retention.finished` / `retention.dead` accept non-negative integers, including `0` (evict on arrival, still counted in `pruned`). Negative or non-integer values, and unknown keys, are rejected by `JobRegistryInstance`'s own validation and surface as a boot-time failure, so navi adds no duplicate validation.
4. Retention never touches `#enqueued`, `#processing`, `#failed` or `#retryQueue`. Pending and in-flight work is preserved.
5. A pruned job is gone: `jobById(id)` and `retryJob(id)` return `null` for it, so `GET /job/:id.json` returns 404 and the retry route reports a not-found job for an evicted id.

### Failure ratio

`FailureChecker` switches to lifetime counts:

```
#loadStats() {
  const { dead, total, pruned } = JobRegistry.stats();
  this.#dead = dead + pruned.dead;
  this.#total = total + pruned.finished + pruned.dead;
}
```

`#ratio()` keeps its `#dead / this.#total * 100` shape and its memoization; only the inputs change. When `pruned` is `{ finished: 0, dead: 0 }` — every run without retention configured — the divisor reduces to `total + 0 + 0`, which is `dead + finished`, so the formula is identical to today's. The `#total === 0` early return in `check()` keeps guarding division by zero.

### Run summary

`RunReporter` includes the pruned counters so the final log does not shrink under retention:

```
const stats = JobRegistry.stats();
const summary = new RunSummary({
  totalJobs: stats.total + stats.pruned.finished + stats.pruned.dead,
  failedJobs: stats.failed + stats.retryQueue + stats.dead + stats.pruned.dead,
  threshold: failureConfig?.threshold,
});
```

Both counts move to lifetime values. `RunSummary` computes and prints its own `Result: Success/Failure` line (`percentage() > threshold`) independently of `FailureChecker`, so correcting only `totalJobs` would make the log contradict the exit code. Worked example — 1000 jobs, 50 dead, `retention: { finished: 10, dead: 10 }`, `threshold: 3`: `stats()` reports `finished: 10, dead: 10, total: 20, pruned: { finished: 940, dead: 40 }`. `FailureChecker` computes (10 + 40) / (20 + 980) = 5% and exits 1; with `failedJobs` left as `failed + retryQueue + dead` the summary would print 10 / 1000 = 1% and `Result: Success`. Adding `pruned.dead` gives 50 / 1000 = 5% and `Result: Failure`, matching the exit code.

`failed + retryQueue` stay in `failedJobs` as today (they are normally `0` at the end of a run). With no retention `pruned.dead` is `0`, so the summary of every existing run is unchanged. `RunSummary` itself needs no change — it is a pure formatter over the injected counts.

The two lifetime formulas (`FailureChecker#loadStats` and `RunReporter`) are duplicated inline in this issue; extracting a shared lifetime-stats helper is deferred to [#1023](https://github.com/darthjee/navi/issues/1023). Until then a consistency spec (see Testing) guards them against drift.

### Observability

- `GET /stats.json`: no handler change is required. `StatsHandler` returns `jobs: JobRegistry.stats()` verbatim, so `jobs.pruned: { finished, dead }` flows through as soon as the registry reports it. The spec must assert the field is present.
- `frontend/src/components/elements/StatsDisplay.jsx`: add a separate `Pruned` group (own `vr` divider and `fw-semibold small` heading, placed right after the Jobs group, before Emissions) with two items, `Finished` (`jobs.pruned.finished`) and `Dead` (`jobs.pruned.dead`):
  - **Plain `StatItem`, no `to`** — not `JobStatItem`. Evicted jobs cannot be listed, and linking to `/jobs/finished` / `/jobs/dead` would show resident jobs under a pruned count.
  - **Muted `light` variant** for both cards, so they are not mistaken for the resident `success` Finished / `dark` Dead cards; the group heading carries the meaning.
  - **Visibility:** the whole group (divider, heading, items) renders only when `jobs.pruned` is present **and** `finished + dead > 0`. Without retention (the default) it never appears; with retention it appears on the first eviction and stays until a stop resets the counters. Absent `pruned` (older backend) renders nothing and never throws.

```
Workers [Idle][Busy] | Jobs [Enqueued][Processing][Failed][Finished][Dead] | Pruned [Finished][Dead] | Emissions [...]
```

### Production image

`darthjee/navi-hey` (`dockerfiles/production_navi_hey/`) runs a long-lived web server — the main deployment that needs retention — and its `config/web.yml` is entirely env-var driven. It gains two env vars:

- `dockerfiles/production_navi_hey/Dockerfile`: `ENV RETENTION_FINISHED=` and `ENV RETENTION_DEAD=` (defined but empty by default).
- `dockerfiles/production_navi_hey/config/web.yml`:

```
workers:
  ...
  retention:
    finished: $RETENTION_FINISHED
    dead: $RETENTION_DEAD
```

An empty value interpolates to `''`, which YAML parses as `null`, which `WorkersConfig` treats as absent (Semantics 2a) — so the default image stays unbounded, exactly as today. Defining the vars as empty (rather than leaving them undefined) avoids `EnvStringResolver`'s `Environment variable not defined` warning on every boot.

### User-facing documentation

- `docs/guides/navi/configuration-schema.md` and `docs/guides/navi/prerequisites.md`: add the `retention:` block to the annotated `workers:` YAML sample and rows for `workers.retention.finished` / `workers.retention.dead` in the key table, stating: optional and independent; omitted, empty or `null` means unbounded; non-negative integers, unknown keys rejected at boot; evicted jobs disappear from job lists, return 404 and cannot be retried (history traded for memory); moderate caps recommended (eviction cost, see #1022); recommended for long-lived servers (`web:` configured), where it also bounds memory growth from crawls fanned out by remote content. Extend the `failure.threshold` row: the ratio counts pruned jobs, so retention never changes the verdict.
- `docs/guides/navi/reference.md`: add `RETENTION_FINISHED` / `RETENTION_DEAD` (default empty = unbounded → `workers.retention.finished` / `.dead`) to the env var table, and mention the Pruned counters in the Dashboard row.
- `README.md` and `DOCKERHUB_DESCRIPTION.md`: add the same two rows to their env var tables.
- No new `docs/guides/navi/samples/` page; the schema docs cover it.

### Dev environment

`docker_volumes/config/navi_config.yml.sample` (the tracked sample for the local dev stack) gains a small `workers.retention: { finished, dead }` block — low enough that pruning visibly kicks in during a local run, so the dashboard's Pruned counters and the lifetime ratio can be exercised by hand.

### Backward compatibility

- **No retention configured:** behaviour is identical to today. `WorkersConfig#retention` is `undefined`, `JobRegistry.ensureBuild` receives today's arguments, `pruned` stays `{ 0, 0 }`, so `FailureChecker`'s verdict and `RunSummary`'s lines are unchanged.
- **`WorkersRegistry` spread removal:** no behaviour change — `WorkersRegistryInstance` only ever read `quantity`; `retryCooldown`, `sleep` and `maxRetries` were already ignored.
- **`GET /stats.json`:** `jobs.pruned` is already present today (deku-swarm #1006 is merged and `StatsHandler` passes `stats()` through). Not an API change in this issue; only a spec assertion is added. `navi-hey-client` does not consume stats.
- **Pre-existing `workers.retention:` key:** previously silently ignored, now validated — an invalid value fails at boot. Practically unlikely; the config docs mention it.
- **Opt-in history loss:** with a cap configured, `GET /jobs/finished.json` / `GET /jobs/dead.json` list only resident jobs and evicted ids return 404 on `GET /job/:id.json` / retry. The config docs state explicitly that a retention cap trades job history for memory.
- **Version:** navi app patch bump via `scripts/bump_version.sh` (project convention), no `deku-swarm` / client bump.

### Performance & security

- **No retention configured:** zero added cost — `#enforceRetention` returns immediately when `keep` is `undefined`.
- **Retention configured:** deku-swarm's `#evict` copies the whole collection (`collection.list()`) on every finished/dead transition, so each job end costs O(cap). Negligible for moderate caps (hundreds to ~10k); noticeable CPU/GC pressure for very large caps on high-throughput runs. The fix belongs to deku-swarm and is tracked in [#1022](https://github.com/darthjee/navi/issues/1022); this issue only documents moderate caps as the recommendation in the config docs.
- **Memory:** resident terminal jobs (with their arguments, responses and errors) are bounded at `retention.finished + retention.dead` — the purpose of this issue.
- **`FailureChecker` / `RunReporter`:** a few extra integer additions; negligible.
- **Attack surface:** none added — no new endpoint, route or request input; retention is config-only.
- **Memory-exhaustion mitigation:** crawls fanned out by remote content (HTML parse → asset downloads, extraction → emits) can grow terminal collections without bound today; a cap bounds them. The config docs mention this as a reason to set retention on long-lived servers.
- **Information exposure:** `jobs.pruned` carries counts only (and is already in `/stats.json`). Evicted ids return the same 404 / not-found as unknown ids, so eviction is indistinguishable from non-existence.

### Out of scope

- `Job#endedAt` in `JobIndexSerializer` and `JobShowSerializer`. Deku-swarm exposes it; this issue deliberately does not surface it through the API. Tracked separately in [#1021](https://github.com/darthjee/navi/issues/1021).
- Any manual prune endpoint or `PATCH`/`POST` route calling `prune()`. Retention is config-driven only; no follow-up is planned.
- Optimizing deku-swarm's eviction cost — tracked in [#1022](https://github.com/darthjee/navi/issues/1022).
- Exposing the configured retention caps (e.g. in `/stats.json` or engine status). Operators infer an active cap from `pruned > 0`.
- `prune({ olderThan })` — the age-based mode is available in deku-swarm but navi configures only count caps; no follow-up is planned.
- `FailureChecker`'s exit path, `process.exit(1)` semantics, and the `failure.threshold` meaning.
- Redefining `RunSummary#failedJobs` to exclude `failed` / `retryQueue` (only `pruned.dead` is added).
- Extracting a shared lifetime-stats helper for `FailureChecker` and `RunReporter` — tracked in [#1023](https://github.com/darthjee/navi/issues/1023).

### Design decisions

| Decision | Choice | Rationale |
| --- | --- | --- |
| Where the retention keys live | Nested block `workers.retention: { finished, dead }` | `WorkersConfig` is already the aggregate for job-lifecycle settings and is already parsed by `ConfigParser#workersConfig()`. Alternatives rejected: flat `retention_finished` / `retention_dead` keys (needs a reshaping getter and leaves no room for future retention options such as age-based pruning without more flat keys); a top-level `retention:` section (needs a new model in `models/configs/`, a `Config` field and a `#retentionConfig()` parser method for a single option pair). |
| Forwarding shape | `WorkersConfig#retention` normalized in the constructor: `null`/`undefined` values dropped, `undefined` when nothing is left, every other key forwarded as-is | Matches `JobRegistry.ensureBuild`'s `retention` contract 1:1. Dropping nulls avoids deku-swarm's present-but-undefined rejection; forwarding the rest unfiltered lets deku-swarm's validation catch typos. `undefined` keeps the no-retention path identical to today. |
| `WorkersRegistry` input | Pass `quantity` explicitly; drop the `...config.workersConfig` spread | `WorkersRegistryInstance` only reads `quantity` (plus injected collaborators) and ignores unknown keys, so the spread never caused harm — but it hid the real input. Alternative rejected: destructuring retention fields out before the spread, which every future `WorkersConfig` field would have to repeat. |
| Failure ratio base | Always lifetime: `dead + pruned.dead` over `total + pruned.finished + pruned.dead` | One formula, no conditional branch. Without pruning it collapses algebraically to today's `dead / (dead + finished)`, so no existing behaviour changes. The conditional alternative only wins by preserving the old expression literally, at the cost of two code paths producing the same number. |
| Where the ratio math lives | Inside `FailureChecker#loadStats()`, leaving `#ratio()` untouched | Keeps the memoized percentage and the `#total === 0` guard intact; only the counters feeding them change. |
| `RunSummary` scope | Include it | With retention, `stats.total` under-reports the run and the final log would contradict the exit code. A known-wrong log line is not a smaller scope, it is a second bug. |
| `failedJobs` definition | `failed + retryQueue + dead + pruned.dead` | `RunSummary` prints its own `Result` verdict; leaving `failedJobs` on resident `dead` understates the percentage under pruning and can print `Success` while `FailureChecker` exits 1. Adding `pruned.dead` is additive and a no-op without retention, so existing runs' summaries are unchanged. |
| Deduplicating the lifetime formula | Inline in both classes now; refactor in #1023 | Keeps this issue focused on behaviour; a consistency spec bridges the gap until the shared helper lands. |
| Pruned dashboard group | Separate group, plain non-linked `StatItem`s, `light` variant, hidden when absent or all zero | Keeps resident and evicted counts visually distinct; no link because evicted jobs cannot be listed; hiding avoids a permanent `0 0` group for the default no-retention setup. Rejected: items inside the Jobs group (blurs resident vs evicted), folding `+N pruned` into the Finished/Dead cards (changes the shared `StatItem`). |
| Observed surfaces | `/stats.json` passthrough plus `StatsDisplay` | Both come free or near-free once `stats().pruned` exists, and both are the primary way an operator sees whether pruning is active. |
| `endedAt` exposure | Not in scope | Chosen by the issue author. Spun off as #1021. |
| Issue shape | Single issue (not an Epic): backend and dashboard ship together | The `StatsDisplay` group is a few lines; splitting it into a separate frontend sub-issue would add coordination overhead without reducing risk. |
| Manual prune / age-based retention | Dropped, no follow-up | Count caps from config cover the memory-growth problem; no current use case for operator-triggered or time-based pruning. |
| Production image env vars | `RETENTION_FINISHED` / `RETENTION_DEAD`, empty by default | The env-driven `navi-hey` image is the main long-lived deployment; without wiring, its users could not enable retention without mounting a custom config. Empty → `null` → unbounded reuses Semantics 2a. |
| Dev sample config | In scope | Lets the feature be exercised locally on the dashboard without hand-editing config. |

#### Edge cases (pinned)

- Both retention keys absent: `WorkersConfig#retention` is `undefined`, `JobRegistry.ensureBuild` gets no `retention` key, behaviour is exactly today's.
- Only `retention.finished` set: `retention` is `{ finished: N }` — the `dead` key is omitted, not `undefined` (a present `undefined` fails deku-swarm's validation). Dead jobs stay unbounded.
- A retention key resolving to `null` (unset env var in `$VAR` interpolation): treated as absent, no cap for that status, no boot failure.
- Engine stop from the dashboard (`EngineController#stop` → `JobRegistry.clearQueues()`) resets `pruned` to `{ 0, 0 }` together with `finished` and `dead`. "Lifetime" therefore means "since the last stop/clear", not "since process start". The ratio stays self-consistent because numerator and denominator reset together. Documented, no code change.
- A dead job retried via the retry route leaves `#dead` (`retryJob` → `clearEnded()` → retry queue); if it dies again it re-enters `#dead` and can be pruned a second time. `pruned.dead` counts evictions, not distinct jobs — the same counting `dead` already uses without retention. Documented, no code change.
- Retention of `0` for a status: every push evicts the job that just arrived; it is still counted in `pruned` and therefore still counted in the lifetime ratio.
- Retention configured but the run produces fewer terminal jobs than the cap: nothing is evicted, `pruned` stays `{ 0, 0 }`, ratio identical to today's.
- Retention evicting a job that a UI page is currently showing: `GET /job/:id.json` returns 404 and the retry route reports the job as not found. Documented, not guarded.
- `stats()` read before any prune: `pruned` is `{ 0, 0 }` and `FailureChecker` reduces to the current formula.
- `#total === 0` after adding pruned counts (no jobs and no prunes): `check()` returns early, no exit.
- `StatsDisplay` receiving a payload without `pruned`: the Pruned group is not rendered, no throw.
- `StatsDisplay` with `pruned: { finished: 0, dead: 0 }`: the Pruned group is not rendered (no clutter when retention is off). A small layout shift when the group first appears is accepted.

### Implementation notes

- `retention` is metadata for `JobRegistry` only. `WorkersRegistry.ensureBuild` gets `factory` and `quantity` explicitly; removing the `...config.workersConfig` spread is part of this change.
- `sleep` is consumed by `Engine`, not `WorkersRegistry` — verify no other caller relies on the spread before removing it.
- No new exception classes are needed: deku-swarm validates `retention` at construction and throws on negative or non-integer values and unknown keys. Navi relies on that validation, so a bad `workers.retention` value fails at boot with the package's error rather than a navi-specific one.
- `FailureChecker`'s `#cachedRatio` memoization must be preserved; only `#loadStats()` changes.
- `RunReporter` is the single place that constructs `RunSummary`, so `totalJobs` and `failedJobs` are corrected there.
- `StatsHandler` needs no production change; only its spec gains an assertion on `jobs.pruned`.
- `StatsDisplay` follows the existing three-file split: rendering helpers belong in the `helpers/` companion if the group grows beyond two items; the current `StatsDisplay` inlines its groups, so a two-item group stays inline.
- No `deku-swarm` version bump is required — the contract already exists in the linked package (`"deku-swarm": "file:../deku-swarm"`). The navi app takes the patch bump per the repo's cascade rules.

### Testing

`source/spec/lib/models/configs/WorkersConfig_spec.js`
- Defaults: `retention` is `undefined` when neither key is given.
- `retention: { finished: N }` yields exactly `{ finished: N }` (no `dead` key — assert with `toEqual` and on `Object.keys`).
- `retention: { dead: M }` yields exactly `{ dead: M }`.
- `retention: null` (empty block) → `undefined`.
- `null` values are treated as absent: `{ finished: null, dead: null }` → `undefined`; `{ finished: N, dead: null }` → `{ finished: N }`.
- Unknown keys are preserved (`{ finshed: 1 }` → `{ finshed: 1 }`) so deku-swarm can reject them.
- Both keys yield `{ finished: N, dead: M }`.
- `retention: 0` is preserved as `0`, not coerced to `undefined`.

`source/spec/lib/services/builders/RegistriesBuilder_spec.js`
- `JobRegistry.ensureBuild` receives a `retention` key when the config sets it.
- `JobRegistry.ensureBuild` receives no `retention` key when the config omits it.
- With only `retention.finished` set, the real `JobRegistry.ensureBuild` does not throw (guards the omitted-key contract end to end).
- `WorkersRegistry.ensureBuild` receives exactly `{ factory, quantity }` (no `retention`, `retryCooldown`, `sleep`, `maxRetries`).
- A typo'd retention key makes `build()` throw deku-swarm's `Invalid retention key` error.
- A built worker still receives `jobRegistry`, `workersRegistry` and `loggerFactory` exactly as before.

`source/spec/lib/services/execution/FailureChecker_spec.js`
- Ratio uses `dead + pruned.dead` over `total + pruned.finished + pruned.dead`.
- With `pruned: { finished: 0, dead: 0 }` the result equals the pre-change `dead / total`.
- A run where pruning removed most finished jobs still reports the lifetime ratio below the threshold and does not call `process.exit`.
- The `#total === 0` path still returns without exiting.
- The ratio stays memoized across repeated `check()` calls on the same instance.

`source/spec/lib/services/execution/RunReporter_spec.js`
- `RunSummary` receives the lifetime `totalJobs` (`total + pruned.finished + pruned.dead`).
- `failedJobs` receives `failed + retryQueue + dead + pruned.dead`.
- Consistency: with the worked-example stats (`finished: 10, dead: 10, pruned: { finished: 940, dead: 40 }`, `threshold: 3`) the logged summary reports `Result: Failure` and `FailureChecker` calls `process.exit(1)`; with `threshold: 6` both report success and no exit. The summary's verdict must always match `FailureChecker`'s.
- `FailureChecker` is still invoked after the summary is logged.

`source/spec/lib/server/handlers/StatsHandler_spec.js`
- The response body's `jobs` object includes `pruned` with `finished` and `dead`.
- `workers` and `emissions` keys are unchanged.

`frontend/spec/components/elements/StatsDisplay_spec.js`
- With `pruned: { finished: 940, dead: 40 }` the Pruned group renders `940` and `40` with labels `Finished` / `Dead`.
- The pruned cards are not links (no `<a>` wrapping them) and use the `text-bg-light` class.
- With `pruned: { finished: 0, dead: 0 }` no Pruned heading or items are rendered.
- With only one non-zero counter (e.g. `{ finished: 5, dead: 0 }`) the group renders, showing both items.
- A payload without `pruned` renders without throwing and without the Pruned group.

`source/spec/lib/services/config/ConfigParser_spec.js` + fixture `source/spec/support/fixtures/config/sample_config_with_retention.yml`
- `workersConfig.retention` equals `{ finished: 100, dead: 50 }` for a `workers.retention: { finished: 100, dead: 50 }` block.

`source/spec/lib/services/config/ConfigLoader_spec.js` + fixture `source/spec/support/fixtures/config/sample_config_with_retention_env_vars.yml` (`finished: $NAVI_TEST_RETENTION_FINISHED`, `dead: $NAVI_TEST_RETENTION_DEAD`), following the existing `sample_config_with_env_vars.yml` set-up/tear-down of `process.env`:
- Vars set to `"100"` / `"50"`: values arrive as numbers (`typeof === 'number'`), so deku-swarm's integer validation accepts them.
- Vars set to `''`: `workersConfig.retention` is `undefined` and no `Environment variable not defined` warning is logged — the production image's default path.
- Vars unset: `workersConfig.retention` is `undefined` and the warning is logged (documents why the Dockerfile defines them as empty).

Real-registry integration (in `RunReporter_spec.js` or a dedicated spec next to it), with no stubbed `stats()`:
- Build the real `JobRegistry` with `retention: { finished: 2, dead: 2 }`, drive jobs to finished and dead through the registry's public API until evictions occur, then run `RunReporter`.
- Assert the logged `Total` / `Failed` lines use lifetime counts and that the summary's `Result` matches `FailureChecker`'s exit decision. Guards against drift in deku-swarm's `stats()` / `pruned` shape that mocked specs would not catch.

#### Gates

- `yarn test` and `yarn lint` pass in `source/` and `frontend/`, with no coverage regression.
- No `deku-swarm` spec changes.

#### Manual verification

No automated image smoke-test infrastructure exists; adding one is out of scope. Verify by hand before merging:

- `docker run darthjee/navi-hey` (built from the branch) with no retention env vars: boots without an undefined-variable warning; dashboard shows no Pruned group; behaviour unchanged.
- With `RETENTION_FINISHED=5 RETENTION_DEAD=5`: after a run with more than 5 finished jobs, the dashboard shows the Pruned group and `GET /stats.json` reports `jobs.pruned.finished > 0`.
- Dev stack with the updated `docker_volumes/config/navi_config.yml.sample`: same check locally.
- `RETENTION_FINISHED=abc`: boot fails with deku-swarm's `Invalid retention.finished` validation error.

## Benefits

- Long-lived navi servers (web UI, `keepAlive`) stop accumulating every finished and dead job for the whole process lifetime; memory is bounded by configurable caps, including under crawls fanned out by remote content.
- The `failure.threshold` exit code and the `RunSummary` log stay correct and mutually consistent whether or not retention is enabled.
- Zero behaviour change by default: without `workers.retention`, navi behaves exactly as today.
- Operators see pruning activity directly on the dashboard and in `/stats.json`, and can enable it on the production image with two env vars.
