# Issue: Separate tag-push job with the `sprout-`, `swarm-` and `node_client-` prefixes

## Description
Part of Epic #977 (release-cycle overhaul). After a package actually released, a separate CircleCI job pushes its extra GitHub tag with the new prefix from `release.yml` (`tag_prefix`).

## Problem
Since #986, `scripts/ci/release-npm-package.sh` pushes no git tag, so no `sprout-` / `swarm-` / `node_client-` tags are created (accepted gap, see `docs/agents/release-token.md`). `scripts/bump_version.sh` still hardcodes the old `worker-` / `deku-sprout-` prefixes and writes README "Current Version" links to `client-` / `worker-` / `deku-sprout-` tags.

## Expected Behavior
- After `release-deku-sprout` released, a job pushes `sprout-<logger version>`.
- After `release-deku-swarm` released, a job pushes `swarm-<worker version>`.
- After `release-navi-hey-client` released, a job pushes `node_client-<client version>`.
- When the package no-oped, its tag job runs but exits early as a no-op.
- `navi-hey` gets no extra tag (its tag is `X.Y.Z`), and the Docker images get none.
- The tag is an annotated tag on the commit being built (the `X.Y.Z` tagged commit), pushed with `GITHUB_TOKEN`. The push is idempotent: an existing tag is skipped.
- The old `deku-sprout-…`, `worker-…` and `client-…` tags stay in the repository as history; nothing creates new ones.
- `scripts/bump_version.sh` reads each package's prefix from `release.yml`, and its README version links point to the new `sprout-` / `swarm-` / `node_client-` tags.

## Solution
- **Released signal (workspace file):** `release-npm-package.sh` writes `released/<package>` (`true` when it published, `false` when it no-oped), like the Docker jobs from #987. The release jobs persist it to the workspace.
- **Tag jobs:** one per package with a `tag_prefix` (`deku-sprout`, `deku-swarm`, `navi-hey-client`), each requiring its release job. Each attaches the workspace, halts early through the same released guard when the file says `false`, and fails when the file is missing. Otherwise it creates and pushes `<tag_prefix><version>`, reading the prefix and folder from `release.yml`. `DRY_RUN=1` prints the tag instead of pushing. The released guard from #987 (`image-released.sh` / `skip-unless-released`) is generalized to packages, not only images.
- **Bump check:** `scripts/lib/package_bump_check.sh` needs no fallback to the old prefixes. `package_bump_last_tag` already falls back to the `X.Y.Z` tags, and `1.14.1` is newer than every old prefixed tag, so until a package has a tag with its new prefix, the nearest `X.Y.Z` tag is its baseline. `release-npm-package.sh` already passes the `release.yml` prefix.
- **`scripts/bump_version.sh`:** take the prefixes from `release.yml` instead of the hardcoded `worker-` / `deku-sprout-`, and update the README "Current Version" link rewrites to the new prefixes.
- **Docs:** update the agent docs that mention the gap (`docs/agents/release-token.md`, `docs/agents/logger.md` and the other package docs) to describe the tag jobs.
- See `docs/agents/specs/release/tags.md#extra-tags` and `docs/agents/specs/release/ci-flow.md`.

Ownership: architect (`scripts/`, `.circleci/config.yml`). Depends on #986 and #987 (both merged).
