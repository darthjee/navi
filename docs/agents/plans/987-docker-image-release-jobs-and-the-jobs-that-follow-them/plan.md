# Plan: Docker image release jobs and the jobs that follow them

Issue: [987-docker-image-release-jobs-and-the-jobs-that-follow-them.md](../../issues/987-docker-image-release-jobs-and-the-jobs-that-follow-them.md)

## Overview

Add two always-run Docker image release jobs, `release-darthjee-navi-hey` and `release-darthjee-navi-hey-client`. Each one releases its image only when `<image>:<version>` is missing on Docker Hub, and records whether it released in a CircleCI workspace file. The jobs after each image (`update-description`, the two demo deploys, `build-and-release-navi-hey-test`, `update-description-client`) read that file and halt early, as a successful no-op, when their image did not release.

## Context

- #986 (merged) added `release-deku-sprout`, `release-deku-swarm`, `release-navi-hey` and `release-navi-hey-client` (`scripts/ci.sh release-npm <pkg>`). Today `build-and-release` (`make release TAG=$CIRCLE_TAG`) always runs after `release-navi-hey`. The four follower jobs require it.
- `build-and-release-client` (`make release-client TAG=<client- tag stripped>`) and `update-description-client` are defined in `.circleci/config.yml` but are not in any workflow.
- `make release` / `make release-client` build with `--build-arg NAVI_VERSION` / `CLIENT_VERSION` = `TAG` (the image runs `npm install -g <pkg>@<TAG>`). They push `:<TAG>` and `:latest`. Their npm package is already visible on npm when the image job starts, because the `release-npm` jobs wait for their own version.
- Spec: `docs/agents/specs/release/ci-flow.md`, `detection.md` (Docker Hub: release when the tag is missing), `gaps.md` (Docker Hub check method, now decided: the public Hub API, no login).
- Decisions from the discussion:
  - The Docker Hub check uses the Hub API through `curl`.
  - The released signal is a workspace file.
  - The client image is tagged from `clients/node/package.json`.
  - The unused `build-and-release-client` definition is dropped.
  - Only the agent docs are updated.

## Steps

- [01 — Docker Hub tag check and image release script](plan/01-image-release-script.md)
- [02 — Released guard script](plan/02-released-guard.md)
- [03 — CircleCI image jobs and followers](plan/03-circleci-image-jobs.md)
- [04 — Update agent docs](plan/04-update-agent-docs.md)

## CI Checks

- `scripts/`: `bash -n scripts/ci/*.sh`, plus shellcheck if it is available locally (no dedicated CI job; the scripts are exercised on `X.Y.Z` tags).
- `.circleci/config.yml`: `circleci config validate` if the CLI is available, otherwise a YAML parse (`node -e "require('js-yaml').load(require('fs').readFileSync('.circleci/config.yml','utf8'))"` from `scripts/release`).
- Branch CI (tests, `validate-release-yml`, `cascade-bump-check`) must stay green; the new jobs only run on `X.Y.Z` tags.

## Notes

- **Machine executor tools.** The image jobs run on `machine: true`, which has `docker`, `curl` and `node`. Read the version with `node -p` on the folder's `package.json`; do not depend on `scripts/release` deps there.
- **Workspace file names.** Image names contain `/`, so the files are `released/darthjee-navi-hey` and `released/darthjee-navi-hey-client`. Each file holds `true` or `false`.
- **Halting.** Followers stop with `circleci-agent step halt`, which ends the job successfully. This works on both docker and machine executors.
- **Hub API answers.** 200 means the tag exists and 404 means it is missing. Any other status, or a curl failure, must fail the job. A transient error must never be read as "missing", because that would re-push an existing tag.
- **navi-hey-test tag.** It keeps `TAG=$CIRCLE_TAG`, which `check-version-tag` guarantees equals `source/package.json`'s version. Using the package.json version would also be acceptable; keep it unchanged.
- **Demo deploys.** `scripts/deploy.sh` keeps its own `checkLastVersion` guard; the new halt step just runs before it.
- **Not in scope.** Extra git tags (#988) and user-facing docs (#989) are left to their own issues.
