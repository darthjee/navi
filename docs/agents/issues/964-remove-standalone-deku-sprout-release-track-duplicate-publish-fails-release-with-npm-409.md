# Issue: Remove standalone deku-sprout release track: duplicate publish fails release with npm 409

## Description
After releasing `1.13.3`, the `publish-deku-sprout-standalone` job failed:

```
SKIP_BUMP_CHECK=true — skipping bump check
Publishing deku-sprout@0.2.3 to npm
...
npm error code E409
npm error 409 Conflict - PUT https://registry.npmjs.org/deku-sprout - Cannot publish over previously staged version "0.2.3".
```

`deku-sprout@0.2.3` **is** on npm. The `1.13.3` pipeline published it correctly. The failing job was a second, duplicate publish attempt.

## Problem
CircleCI job logs and timings (UTC, 2026-10-04) confirm a duplicate publish race:

| Time | Event |
|---|---|
| 19:03:13 | `1.13.3` pipeline: `check-and-publish-deku-sprout` (#29580) starts |
| ~19:03:22 | It publishes `deku-sprout@0.2.3`. npm replies: *"Your package is being processed and may take a few minutes to become available."* |
| ~19:03:24 | The same job pushes the `deku-sprout-0.2.3` tag, which starts a **new pipeline** |
| 19:03:59 | `publish-deku-sprout-standalone` (#29625): `npm view` does not find 0.2.3 yet, so it tries to publish again |
| 19:04:03 | npm rejects it with **E409** "Cannot publish over previously staged version" |
| 19:04:17 | npm finishes processing 0.2.3 (its `time` entry on the registry) |

Both tarballs have the same shasum (`42050e2f…`), so the second attempt was a pure duplicate.

The failure has three layers:

1. **Duplicate trigger (the actual cause).** The main `X.Y.Z` release pushes `deku-sprout-X.Y.Z` itself. The standalone workflow (added in #923) runs on any tag matching that pattern and can't tell a CI-pushed tag from a hand-pushed one, so every app release that bumps `logger/` publishes deku-sprout twice. `worker-*` tags have no publish workflow, so deku-swarm is not affected.
2. **The npm check misses versions still being processed.** npm accepts a publish and then processes it, which took about 55 s here. During that time `npm view` doesn't return the version, so `needs_publish` decides to publish.
3. **A 409 fails the job.** `publish()` treats every npm error as fatal.

## Expected Behavior
- An app `X.Y.Z` release publishes `deku-sprout` and `deku-swarm` when their versions are not on npm yet, and fails when published files changed without a version bump (as today).
- CI still pushes `deku-sprout-X.Y.Z` and `worker-X.Y.Z` tags, but only as release markers. They start no pipeline at all.
- A release that bumps `logger/` finishes without any failed job.
- Re-running a release stays a passing no-op for versions already on npm.

## Solution
### Decision
Fix layer 1 by removing the standalone deku-sprout release track. The app `X.Y.Z` tag becomes the only trigger that publishes `deku-sprout` and `deku-swarm`. The `client-X.Y.Z` track stays separate and unchanged. `check-and-publish-package.sh` already handles this path: the bump check fails the release when `logger/lib` or `logger/package.json` changed without a version bump, and `needs_publish` skips versions already on npm.

Accepted trade-off: this partly reverts #923. `deku-sprout` can no longer be released on its own. If `navi-hey-client` needs a new `deku-sprout` version, an app `X.Y.Z` release has to publish it first.

Layers 2 and 3 are out of scope. With a single publisher per release, they can only be hit by re-running a pipeline within the roughly one minute npm needs to process a publish.

### Scope
**In scope:** removing the standalone `deku-sprout` release track, stopping marker-tag pipelines, and the related docs.

**Out of scope:**
- The `client-X.Y.Z` release track (unchanged).
- Layers 2 and 3 of the root cause (npm processing lag in `needs_publish`, and 409 handling in `publish()`).
- When the marker tag is pushed relative to npm finishing processing (cosmetic only now).
- The `deku-swarm` release flow (already single-trigger).

### Edge Cases
- **Package changed without a version bump:** the app release fails at the existing bump check in `check-and-publish-package.sh`. In practice the maintainer always bumps the packages; #965 makes `scripts/bump_version.sh` flag a forgotten bump before tagging.
- **Package bumped, no app release yet:** it stays unpublished until the next `X.Y.Z` (accepted trade-off).
- **Version already on npm:** `needs_publish` skips the publish, and `push_tag` pushes the marker only if it's missing.
- **Marker tag pushed by hand:** it starts no pipeline and publishes nothing. A later app release still publishes, and `push_tag` skips the existing tag. Documented in `docs/agents/logger.md` (Solution step 4).
- **`ignore` regex:** `^(deku-sprout|worker)-` matches neither `X.Y.Z` nor `client-X.Y.Z`, and tag filters don't affect branches.
- **Accepted, out of scope:** re-running the `X.Y.Z` pipeline within npm's roughly one-minute processing window, or pushing two app tags almost together, can still hit the 409 (root-cause layers 2 and 3). Re-running fixes it.

### Changes
1. `.circleci/config.yml`: remove the `check-deku-sprout-version-tag` and `publish-deku-sprout-standalone` jobs (definitions and workflow entries) and the `deku-sprout-tag-filters` anchor.
2. `.circleci/config.yml`: add `ignore: /^(deku-sprout|worker)-.*/` to the `&all-tags` filter anchor, so CI-pushed marker tags no longer start a test-only pipeline that re-tests the commit the `X.Y.Z` pipeline already tested (about 19 jobs each, e.g. #29601–#29630 on this release).
3. Delete `scripts/check_deku_sprout_tag_version.sh` (unused after step 1).
4. `docs/agents/logger.md`: remove the "Standalone tag workflow" row, describe `deku-sprout-X.Y.Z` tags as CI-pushed markers, and replace the statement that a `deku-sprout` release does not force a `navi-hey` release with the new coupling (including the client implication above). State that pushing `deku-sprout-X.Y.Z` by hand does nothing: to publish, bump `logger/package.json` and cut an app `X.Y.Z` release.
5. `docs/agents/release-token.md`: remove the `publish-deku-sprout-standalone` row from the jobs table.

## Benefits
- Removes the duplicate publish, so `logger/` bumps no longer leave a red pipeline.
- `deku-sprout` and `deku-swarm` follow the same single release path.
- Each release runs one pipeline instead of three.
- Less CI configuration and one fewer script to maintain.
