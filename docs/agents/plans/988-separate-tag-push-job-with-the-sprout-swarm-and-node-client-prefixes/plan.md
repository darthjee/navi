# Plan: Separate tag-push job with the `sprout-`, `swarm-` and `node_client-` prefixes

Issue: [988-separate-tag-push-job-with-the-sprout-swarm-and-node-client-prefixes.md](../../issues/988-separate-tag-push-job-with-the-sprout-swarm-and-node-client-prefixes.md)

## Overview

After an npm package with a `tag_prefix` in `release.yml` actually publishes, a dedicated CircleCI job pushes the annotated `<tag_prefix><version>` tag (`sprout-`, `swarm-`, `node_client-`) on the commit being built. The release job records whether it published in a workspace file (`released/<package>`), exactly like the Docker jobs from #987, and the tag job halts as a no-op when it did not. `scripts/bump_version.sh` switches to the `release.yml` prefixes and its README links point to the new tags.

## Context

- Since #986, `scripts/ci/release-npm-package.sh` pushes no tag; `docs/agents/release-token.md` records the gap and says the tag job is `GITHUB_TOKEN`'s future consumer.
- #987 added `scripts/ci/image-released.sh` and the `skip-unless-released` CircleCI command (attach workspace, halt on `false`, fail on a missing file). This plan generalizes both from images to any released name.
- `scripts/lib/package_bump_check.sh` needs no change: `package_bump_last_tag` already matches `<prefix>*` **or** `X.Y.Z` tags, and `1.14.1` is newer than every old `deku-sprout-` / `worker-` / `client-` tag, so the nearest `X.Y.Z` tag is the baseline until a new-prefix tag exists. No fallback to the old prefixes (decided in the issue).
- The old tag-push logic (removed in #986, see `git show f6a6009^:scripts/ci/check-and-publish-package.sh`) is the model for the push: skip when the tag exists locally or on `origin`, `git tag -a`, push to `https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git`.

## Steps

- [01 — Released flag for npm packages and a generic guard](plan/01-released-flag.md)
- [02 — Tag-push script](plan/02-tag-push-script.md)
- [03 — CircleCI tag jobs](plan/03-circleci-tag-jobs.md)
- [04 — `bump_version.sh` prefixes and README links](plan/04-bump-version.md)
- [05 — Agent docs](plan/05-agent-docs.md)

## CI Checks

- `scripts/release`: `cd scripts/release && npm run coverage` and `scripts/ci.sh lint-and-report scripts/release` (CI jobs: `jasmine-release`, `checks-release`) — only if the helper in `scripts/release/` is touched.
- Shell scripts: `bash -n` / `shellcheck` on every touched script; `DRY_RUN=1 scripts/ci.sh push-tag deku-sprout` locally.
- `.circleci/config.yml`: `circleci config validate` if the CLI is available.

## Notes

- Workspace files: `released/deku-sprout`, `released/deku-swarm`, `released/navi-hey-client` (npm names, no `/`), next to the existing `released/darthjee-navi-hey` and `released/darthjee-navi-hey-client`. `released/navi-hey` is written too (the script is generic) but nothing reads it.
- The tag goes on `HEAD` of the `X.Y.Z` build (`CIRCLE_SHA1`), not on `main`'s tip.
- `GITHUB_TOKEN` is required unless `DRY_RUN=1`; a missing token must fail the job before anything else.
- A failed `npm publish` fails the release job before the flag is written, so the tag job then fails on the missing file (never pushes a tag for an unpublished version).
- First real run after merge: only packages that actually publish get a tag; e.g. `sprout-0.3.0` is never created retroactively.
