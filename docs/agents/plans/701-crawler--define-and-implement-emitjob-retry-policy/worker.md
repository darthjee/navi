# worker Plan: Crawler: define and implement EmitJob retry policy

Main plan: [plan.md](plan.md)

## Shared contracts

- Produces: `Job` constructor gains optional `{ maxRetries, cooldown } = {}` params (stored privately); `get maxRetries()` keeps returning `this.#maxRetries ?? 3` (public default unchanged, existing subclass getter overrides still win outright); a new `get cooldown()` returns `this.#cooldown` (`undefined` when not passed at construction).
- Produces: `JobRegistryInstance#fail()` calls `job.exhausted()` (no argument) and `job.applyCooldown(job.cooldown ?? this.#cooldown)`.
- `engine` depends on both of the above to give `EmitJob` its own per-instance retry/cooldown policy, and to keep `ResourceRequestJob`/`AssetDownloadJob` behaving as they do today by having `RegistriesBuilder` explicitly pass the registry's configured global values into their job factories.
- `docs` depends on the exact param names/defaults here for the `deku-swarm` guide.
- This is a real behavior/API change to the published `deku-swarm` package (`worker/package.json`, currently `1.8.2`) — additive and backward-compatible (defaults unchanged when the new constructor params are omitted), but warrants a version bump before release. The user is handling the `worker/package.json` (and later `source/package.json`'s `deku-swarm` dependency) version bump directly — not part of this plan's steps.

## Steps

- [01 — Thread maxRetries/cooldown through Job's constructor](worker/01-job-constructor-params.md)
- [02 — Simplify JobRegistryInstance.fail()](worker/02-simplify-fail.md)
- [03 — Spec coverage for the new behavior](worker/03-spec-coverage.md)

## CI Checks

- `worker`: `npm run coverage` (CI job: Unit tests (Jasmine), parametrized by `path: worker` in `.circleci/config.yml`)
- `worker`: `npm run lint` (CI job: Lint and report)

## Notes

- Do not touch `JobFactory.js` — it already merges arbitrary `attributes` into build-time params (`build(params) { return super.build({ ...this.#attributes, ...params }); }`), so no change is needed there for `RegistriesBuilder` to inject `maxRetries`/`cooldown`.
- `ExtractionJob`, `HtmlParseJob`, `ActionProcessingJob`, and `PaginatedActionProcessingJob` (engine, `source/lib/jobs/`) need no code changes — their existing `get maxRetries() { return 1; }` overrides will simply start being honored for real once `fail()` is fixed. Worth a quick sanity check against their specs after the fix lands, in case any spec asserted the old (buggy) 3-retry behavior through the full registry path rather than the getter in isolation.
