# Plan: Rewrite deku-sprout file: dependency to its published version when releasing navi-hey

Issue: [929-rewrite-deku-sprout-file-dependency-to-its-published-version-when-releasing-navi-hey.md](../../issues/929-rewrite-deku-sprout-file-dependency-to-its-published-version-when-releasing-navi-hey.md)

## Overview
Move the release-time rewrite of local `file:` dependencies in `source/package.json` out of `scripts/ci/build-frontend.sh` and into a dedicated CI script. The new script pins both `deku-swarm` and `deku-sprout` to exact versions and fails if any `file:` dependency is left. It runs as its own step in the CircleCI `npm-publish` job.

## Context
`source/package.json` depends on `"deku-swarm": "file:../worker"` and, since #916, on `"deku-sprout": "file:../logger"`. Today only `deku-swarm` is rewritten, by a `sed` line in `scripts/ci/build-frontend.sh`. The next `navi-hey` release would therefore ship with a `file:../logger` dependency that can't be installed. The user chose:
- exact version pins, not caret ranges;
- a new dedicated script, used from the CircleCI flow;
- a guard that fails the release if any `file:` dependency remains.

This work covers only CI scripts and CircleCI config, which have no specialist owner. The architect owns it.

## Steps

- [01 — Add the pin-local-deps CI script](plan/01-add-pin-local-deps-script.md)
- [02 — Drop the rewrite from build-frontend and wire the new step into CircleCI](plan/02-wire-into-circleci.md)
- [03 — Document the release-time pinning](plan/03-update-docs.md)

## CI Checks
- There are no unit tests for `scripts/`. Verify locally with `bash -n scripts/ci/pin-local-deps.sh`, then run the script against a scratch copy of the repo and inspect `source/package.json` (see step 01).
- `.circleci/config.yml`: validate with `circleci config validate` if the CLI is available.

## Notes
- The `sed -i` form used in CI (GNU sed on the Linux image) differs from BSD sed on macOS. Keep the existing GNU `sed -i` form, since the script only runs in CI. Local verification on macOS should use a Linux container or `gsed`.
- No extra job ordering is needed. `npm-publish` already requires `check-and-publish-worker` and `check-and-publish-deku-sprout`. When those skip publishing, the version in the package's `package.json` is expected to already be on npm.
- The rewrite must happen after `install-deps` for `source` (which relies on the `file:` links and the frozen lockfile) and before `publish source`. Placing it between "Build frontend" and "Publish to npm" meets both constraints.
