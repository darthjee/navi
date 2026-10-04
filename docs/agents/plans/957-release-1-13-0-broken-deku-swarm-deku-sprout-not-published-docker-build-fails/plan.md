# Plan: Release 1.13.0 broken: deku-swarm/deku-sprout not published, Docker build fails

Issue: [957-release-1-13-0-broken-deku-swarm-deku-sprout-not-published-docker-build-fails.md](../../issues/957-release-1-13-0-broken-deku-swarm-deku-sprout-not-published-docker-build-fails.md)

## Overview
Fix the two causes of the broken 1.13.0 release in one PR:
- `check-and-publish-worker.sh` / `check-and-publish-deku-sprout.sh` publish based on whether the version is on npm, plus a git-only check that fails when published files changed without a version bump. The `force_*` parameters are removed.
- A new `wait-for-npm.sh` makes `npm-publish` and `npm-publish-client` wait until npm serves the pinned dependencies and the freshly published package, so the Docker builds don't race npm propagation.
- The docs are updated to describe the new rule.

## Context
- On the `1.13.0` tag, `git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*'` returns `1.13.0` itself. The change check compared the tag with itself and skipped publishing deku-swarm 1.11.0 and deku-sprout 0.2.0. navi-hey 1.13.0 was published pinned to both (via `scripts/ci/pin-local-deps.sh`).
- `npm-publish` finished at 00:12:56. `build-and-release` hit ETARGET at 00:13:14, but npm only recorded navi-hey 1.13.0 at 00:13:50.
- `scripts/` and `.circleci/config.yml` are architect-owned (shared infrastructure). `README.md` is owned by `docs`. `docs/agents/logger.md` is architect-owned documentation.
- Only `lib/` is published (`"files": ["lib"]` in `worker/package.json` and `logger/package.json`).
- 1.13.0 is not recovered; the next release ships the fix.

## Steps

- [01 — Add wait-for-npm.sh](plan/01-add-wait-for-npm.md)
- [02 — Rewrite the worker/deku-sprout publish rule](plan/02-version-based-publish-rule.md)
- [03 — Update the CircleCI config](plan/03-circleci-config.md)
- [04 — Update docs](plan/04-update-docs.md)
- [05 — Manual verification](plan/05-manual-verification.md)

## CI Checks
- No spec/lint job covers `scripts/ci/`. Validate the config with `circleci config validate .circleci/config.yml` if the CLI is available, and run `bash -n` on every changed script (also `shellcheck` if installed).
- The release jobs (`check-and-publish-*`, `npm-publish`, `npm-publish-client`, `publish-deku-sprout-standalone`) only run on tags, so the PR pipeline does not exercise them. Step 05 covers them manually.

## Notes
- Step 04's `README.md` change is in the `docs` agent's scope. Everything else is architect-owned. If the work is dispatched, give the README paragraph to `docs`.
- `CIRCLE_TAG` is the plain version for navi tags (e.g. `1.14.0`) and `client-X.Y.Z` for client tags. Strip `client-` the same way `build-and-release-client` does.
- Keep the two check scripts structurally identical (same functions and order) so they stay easy to compare. Extracting a shared helper is optional and only worth it if it stays simple.
- Don't attempt to recover 1.13.0 (out of scope). Optionally, once the next release is out, the user may run `npm deprecate navi-hey@1.13.0` by hand.
