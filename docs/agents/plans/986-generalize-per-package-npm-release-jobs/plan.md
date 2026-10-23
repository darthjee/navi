# Plan: Generalize per-package npm release jobs

Issue: [986-generalize-per-package-npm-release-jobs.md](../../issues/986-generalize-per-package-npm-release-jobs.md)

## Overview

Replace `check-and-publish-worker`, `check-and-publish-deku-sprout` and `npm-publish` with four always-run `release-<pkg>` jobs (`deku-sprout`, `deku-swarm`, `navi-hey`, `navi-hey-client`). They all run one generalized script that reads the package's folder, tag prefix and dependencies from `release.yml`. Each job publishes only when its version is not on npm yet. Tag pushing is removed (it comes back in #988).

## Context

- `scripts/ci/check-and-publish-package.sh <folder> <npm-package> <tag-prefix>` does four things today, in order: a `GITHUB_TOKEN` check, the forgotten-bump check, an `npm view` publish decision plus publish, and a tag push. Only `deku-swarm` (`worker-`) and `deku-sprout` (`deku-sprout-`) use it, through two thin wrappers.
- `npm-publish` installs `source`, then runs `build-frontend`, `pin-local-deps` and `wait-for-npm` for both deps, then publishes `navi-hey` unconditionally and waits for it.
- Since #985, `navi-hey-client` has no release job.
- `release.yml` (root) is loaded by `scripts/release/lib/loadReleaseTree.js`, which normalizes entries to `{folder, platform, dependsOn, tagPrefix}`.
- `navi-hey-client` depends on `deku-sprout` from npm (`^0.3.0`), so it needs no pinning.
- Decisions from the discussion:
  - static job graph in `config.yml`;
  - the bump check runs for every package;
  - each job waits for its deps on npm before publishing and for itself after;
  - the missing-tags gap until #988 is accepted;
  - agent docs are updated, while specs and user-facing docs are left alone.

## Steps

- [01 — Add the release.yml package-info helper](plan/01-package-info-helper.md)
- [02 — Generalize the npm release script](plan/02-generalize-release-script.md)
- [03 — Rework the CircleCI release jobs](plan/03-circleci-release-jobs.md)
- [04 — Update agent docs](plan/04-update-agent-docs.md)

## CI Checks

- `scripts/release`: `cd scripts/release && npm run coverage` and `npm run lint` (CI jobs: `jasmine-release`, `checks-release`)
- `release.yml`: `scripts/ci.sh validate-release-yml` (CI job: `validate-release-yml`)
- `.circleci/config.yml`: `circleci config validate` (or at least a YAML parse)
- Script dry run: `DRY_RUN=1 SKIP_BUMP_CHECK=true scripts/ci.sh release-npm <pkg>` for each of the four packages. It should print "already on npm — skipping publish" or "would publish …", and it must not push anything.

## Notes

- Until #988 lands, no `sprout-` / `swarm-` / `node_client-` tags are pushed, and `GITHUB_TOKEN` is unused (accepted gap).
- `package_bump_last_tag` builds `--match="${tag_prefix}*"`. With an empty prefix (`navi-hey`) that would match **every** tag, so the empty-prefix case must match only `X.Y.Z` tags (see step 02).
- The bump check watches `<folder>/lib` and `<folder>/package.json` only. For `clients/node` it therefore misses `client.js` and `bin/`. That is acceptable for now; widening it is out of scope.
- Today the `check-and-publish-*` jobs have no `requires`. In the new graph, every release job waits for the full test set, which is stricter than before and intended.
- `build-and-release-client` / `update-description-client` stay unwired (#987).
