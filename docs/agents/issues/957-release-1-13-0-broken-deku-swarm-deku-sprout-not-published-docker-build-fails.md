# Issue: Release 1.13.0 broken: deku-swarm/deku-sprout not published, Docker build fails

## Description

Release `1.13.0` bumped navi-hey (1.13.0), deku-swarm (worker, 1.11.0) and deku-sprout (logger, 0.2.0). The `build-and-release` job failed while building the Docker image ([CircleCI job 29137](https://app.circleci.com/pipelines/github/darthjee/navi/2903/workflows/def66b80-ec48-4ccb-a704-5947a4f71a07/jobs/29137)):

```
 > [2/5] RUN npm install -g navi-hey@1.13.0:
0.636 npm error code ETARGET
0.636 npm error notarget No matching version found for navi-hey@1.13.0.
Dockerfile:21
  21 | >>> RUN npm install -g navi-hey@${NAVI_VERSION}
make: *** [Makefile:78: release] Error 2
```

(CircleCI masks the package name as `********` in the log.)

## Problem

### 1. deku-swarm and deku-sprout were never published (confirmed)

Current state of the npm registry:

| Package | Version in repo | Latest on npm |
|---|---|---|
| navi-hey | 1.13.0 | 1.13.0 (published 2026-10-04T00:13:50Z) |
| deku-swarm | 1.11.0 | **1.9.0** |
| deku-sprout | 0.2.0 | **0.1.0** |

The published `navi-hey@1.13.0` pins `"deku-swarm": "1.11.0"` and `"deku-sprout": "0.2.0"` (through `scripts/ci/pin-local-deps.sh`). Neither version exists on npm, so **`npm install navi-hey@1.13.0` can't succeed at the moment**, even if the job is re-run. deku-swarm 1.10.0 was also skipped on earlier releases. No `worker-1.10.0`, `worker-1.11.0` or `deku-sprout-0.2.0` tag exists.

Root cause: `scripts/ci/check-and-publish-worker.sh` and `scripts/ci/check-and-publish-deku-sprout.sh` look for the previous release with:

```bash
LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*')
```

These jobs run on the version tag itself (`1.13.0`), so `HEAD` already carries a tag matching `[0-9]*.[0-9]*.[0-9]*`. `git describe` returns the **current** tag:

```
$ git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 1.13.0
1.13.0
```

This makes `git diff 1.13.0..HEAD -- worker/` always empty. The script prints "No changes in worker/ since 1.13.0" and exits 0 without publishing. deku-sprout has the same bug. The job still passes, so `npm-publish` publishes navi-hey with dependency pins that can't be resolved.

### 2. npm propagation race (confirmed)

Job timings from the CircleCI API for this workflow:

| Event | Time (UTC) |
|---|---|
| `npm-publish` finishes (success) | 00:12:56 |
| `build-and-release` starts | 00:12:58 |
| Docker `npm install -g navi-hey@1.13.0` fails with ETARGET | 00:13:14 |
| npm records navi-hey 1.13.0 as published | 00:13:50 |

`npm publish` returned successfully, but npm only started serving the version about a minute later. 1.13.0 therefore failed for two independent reasons: this race, and the missing deku-swarm/deku-sprout versions behind it. Fixing either one alone would still leave the release broken or failing some of the time.

## Expected Behavior

- [ ] On a version-tag pipeline, the worker and deku-sprout jobs publish when the package version isn't already on npm, whatever git tags exist.
- [ ] The worker / deku-sprout job fails if `lib/` or `package.json` changed since the previous release while the `package.json` version is unchanged since that release; changes to specs/config only don't trigger it.
- [ ] The `force_worker_build` / `force_deku_sprout_build` parameters and `FORCE_*` variables no longer exist; the standalone `deku-sprout-*` tag still publishes, without the bump check.
- [ ] `README.md` and `docs/agents/logger.md` describe the version-based rule.
- [ ] Both check scripts support `DRY_RUN=1`, and the PR documents the manual scenarios that were run.
- [ ] Re-running a release pipeline whose packages are already published succeeds.
- [ ] An `npm view` error other than "not found" fails the job instead of attempting a publish.
- [ ] The previous-release lookup never returns the tag currently being built.
- [ ] `npm-publish` waits for the pinned deku-swarm/deku-sprout versions (10 s × 5 min) and fails if they never appear on npm.
- [ ] `npm-publish` ends only once npm serves `navi-hey@$TAG`, and `npm-publish-client` only once npm serves `navi-hey-client@<version>`; a timeout fails the job with a clear message.
- [ ] The next release (after 1.13.0) publishes deku-swarm, deku-sprout and navi-hey, and its Docker images build and push successfully.

## Solution

1. **Decide whether to publish by version, not by change detection** (option B, agreed). This applies to both `scripts/ci/check-and-publish-worker.sh` and `scripts/ci/check-and-publish-deku-sprout.sh`:
   - **Publish rule:** publish whenever the version in `worker/package.json` / `logger/package.json` is not on npm yet (`npm view <pkg>@<version>`). The decision doesn't depend on git tags, so re-runs and missing `worker-*` / `deku-sprout-*` tags don't matter.
   - **Safety check for a forgotten bump (git-only):** find the previous release with `git describe` starting from `HEAD^` (or otherwise exclude the tag currently being built), so it never returns the current tag. **Fail the job** if the published files changed since that release **and** the `version` in `package.json` is the same as at the previous release tag. The message should say the folder changed but its version was not bumped. This check doesn't ask npm, so it gives the same result on a first run and on a re-run of the same pipeline.
   - **Watched paths:** only what ends up on npm. `worker/package.json` and `logger/package.json` declare `"files": ["lib"]`, so watch `lib/` + `package.json`. Changes to specs, lint config, README or `yarn.lock` must not trigger the check. The 1.12.1→1.13.0 diff in `worker/` was all specs.
   - Keep pushing the `worker-<version>` / `deku-sprout-<version>` git tags after a publish; that step stays idempotent.
   - Option A (only switching `git describe` to `HEAD^` and keeping change detection as the publish trigger) was rejected. A change without a version bump would skip the publish without failing.
   - **Remove the `force_*` parameters.** Under this rule they have no effect: npm refuses to publish an existing version, and a missing version is published anyway. Remove:
     - the `force_worker_build` / `force_deku_sprout_build` pipeline parameters (`.circleci/config.yml:4-9`);
     - the variables passed to the release jobs (`.circleci/config.yml:318`, `:327`);
     - the `FORCE_*` handling in both scripts;
     - `FORCE_DEKU_SPROUT_BUILD=true` in `publish-deku-sprout-standalone` (`.circleci/config.yml:345`).
   - **Standalone `deku-sprout-*` tag run:** still publishes when the version isn't on npm, and **skips the forgotten-bump check**. `check-deku-sprout-version-tag` already guarantees the tag matches `logger/package.json`. How the script tells it's a standalone run (an argument, an env var, or the tag pattern) is up to the implementation.
2. **Add a reusable wait script** `scripts/ci/wait-for-npm.sh <pkg> <version>`. It polls `npm view <pkg>@<version> version --prefer-online` every **10 s** for up to **5 min**, and fails with a clear message ("<pkg>@<version> published but not visible on npm after 5 min") if the version never shows up.
3. **Check pinned versions before `npm-publish`:** before publishing navi-hey, run `wait-for-npm.sh` for the pinned `deku-swarm` and `deku-sprout` versions, so a release can't ship with dependencies that can't be resolved. Waiting instead of checking once also covers the propagation race for packages published by the earlier jobs.
4. **Wait for visibility at the end of `npm-publish`:** add a final step running `wait-for-npm.sh navi-hey $TAG`, so `npm-publish` only goes green once the version can be installed. This covers `build-and-release` and every job after it.
5. **Same for the client flow:** add a final step to `npm-publish-client` running `wait-for-npm.sh navi-hey-client <version>`. `build-and-release-client` installs `navi-hey-client@${CLIENT_VERSION}` in its Dockerfile and has the same race.

### Edge cases

| Case | Expected behavior |
|---|---|
| Pipeline re-run after deku-swarm/deku-sprout were already published | Version on npm → skip publish. The git-only bump check passes because the version differs from the previous release. |
| Only specs / lint config / README / `yarn.lock` changed | Not watched → no bump required. |
| `lib/` or `package.json` changed but version equal to the previous release | Job fails: "changed but version not bumped". |
| No previous release tag found | Skip the bump check and apply only the publish rule. |
| Version bumped with no code changes | Publish. |
| Previous release is a standalone `deku-sprout-X` tag | Accepted as the previous release (the lookup matches `deku-sprout-*` and plain version tags). |
| deku-sprout version already published by the standalone workflow | Skip publish, no failure. |
| `npm view` fails for a reason other than "not found" (network, registry outage) | Fail the job. Only a real E404 / "not found" means "needs publishing". |
| Version lowered or set to an already-published version | Version on npm → skip publish. Rare; not guarded against. |

### Backward compatibility

- **Removing `force_*` breaks manual triggers that pass them:** CircleCI rejects unknown pipeline parameters on "Trigger Pipeline" / API calls. No known callers rely on them.
- **New rule for whoever releases:** changing `worker/lib`, `logger/lib` or their `package.json` without bumping the version now **fails** the release, where it used to release silently with a stale pin. Spec-only changes still release without a bump.
- **Unchanged:** the `worker-x.y.z` / `deku-sprout-x.y.z` tag pushes, the result of the standalone `deku-sprout-*` workflow, and the client release flow.
- **Docs to update** (part of this issue):
  - `README.md:23`: describes publishing "whenever `worker/` changed … (or `force_worker_build` …)".
  - `docs/agents/logger.md:77-78`: describes "`logger/` changed … or `force_deku_sprout_build`" and the standalone job as "the same publish script, forced".

### Scope

**In scope**
- The version-based publish rule and the forgotten-bump check for worker / deku-sprout (item 1).
- The `wait-for-npm.sh` script (item 2).
- Checking the pinned deku-swarm/deku-sprout versions before `npm-publish` (item 3).
- Waiting for npm to serve the new navi-hey version at the end of `npm-publish` (item 4), and the same for `navi-hey-client` in `npm-publish-client` (item 5).
- Removing the `force_*` pipeline parameters and updating `README.md` / `docs/agents/logger.md` to describe the new rule.

**Out of scope**
- Recovering 1.13.0. That version is abandoned; the fix ships in the next release, which publishes the pending deku-swarm/deku-sprout versions through the fixed pipeline.
- Any other change to the client release flow (`client-*` tags) beyond the wait step in item 5.
- The standalone `deku-sprout-*` tag workflow (`publish-deku-sprout-standalone`), except that it must keep working.
- Reordering or restructuring the release jobs beyond the checks above.

### Testing

Manual verification only; no new shell test framework or CI job.
- `check-and-publish-worker.sh` / `check-and-publish-deku-sprout.sh` support a `DRY_RUN=1` mode that prints what they would do (`would publish <pkg>@<version>`, `would push tag <tag>`) without publishing or pushing.
- The PR description lists the scenarios run locally with `DRY_RUN=1`, using throwaway local tags and versions that don't exist on npm:
  - version not on npm → would publish;
  - version on npm → skip;
  - `lib/` changed without a version bump → fails;
  - spec-only change → no failure;
  - no previous release tag → bump check skipped;
  - `npm view` failure other than "not found" → fails.
- `wait-for-npm.sh` is checked against an existing version (returns immediately) and a non-existent one with a short timeout (fails with the expected message).
- The next real release is the end-to-end check.

### Delivery

A single issue and a single PR. Items 1–5 together make up the release fix. Both root causes (missing deku-swarm/deku-sprout publishes and the npm propagation race) have to be fixed before the next release, and the change is small enough to review as one unit. A split into "version-based publish rule" and "wait for npm visibility" was considered and rejected.

## Benefits

- Releases publish deku-swarm / deku-sprout whenever their version isn't on npm yet, so navi-hey can't be published pinned to versions that don't exist.
- Forgetting to bump the worker/logger version after changing published code fails the release instead of silently shipping stale code.
- Release pipelines can be re-run safely, and npm propagation delays no longer break the Docker image builds (server and client).
- The `force_*` parameters, which no longer do anything, are gone, so there is less release machinery to maintain.
