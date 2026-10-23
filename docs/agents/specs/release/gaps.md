# Gaps

[Back to the release spec](../release.md)

Open questions left for the implementation sub-issues.

- **Docker Hub "already published" check.** How to test that `<image>:<version>` exists (Docker Hub API, `docker manifest inspect`), and which credentials it needs.
- **`deku-swarm` and `deku-sprout`.** `deku-swarm` declares no dependency on `deku-sprout` today. Should it? If it ever does, `release.yml` and the cascade rules change with it.
- **README version checks.** `scripts/check_tag_version.sh` and `scripts/check_client_tag_version.sh` also check README versions. With `check-client-version-tag` gone, where does the client's README check move to, and should the other packages get one?
- **Passing "released or not" downstream.** Resolved (#987, #988): every release job writes `released/<name>` (`true`/`false`) to the CircleCI workspace, read by `scripts/ci/released.sh` through the `skip-unless-released` command.
- **Waiting for npm.** `npm-publish` already waits for pinned dependencies (`scripts/ci.sh wait-for-npm`). The generalized jobs need the same wait for every released dependency.
- **`GITHUB_TOKEN` for the tag-push job.** Resolved (#988): its only consumer is `scripts/ci/push-release-tag.sh` in the `push-tag-<package>` jobs (see [`release-token.md`](../../release-token.md)).
- **Forgotten-bump check prefixes.** Resolved (#988) without a fallback to the old prefixes: `package_bump_last_tag` already falls back to the `X.Y.Z` tags, which are newer than every old `worker-` / `deku-sprout-` / `client-` tag, so until a package has a `swarm-` / `sprout-` / `node_client-` tag, the nearest `X.Y.Z` tag is its baseline.
- **Cascade-bump comparison base.** The exact refs the test compares (last `X.Y.Z` tag on tags, merge base with `main` on PRs).
