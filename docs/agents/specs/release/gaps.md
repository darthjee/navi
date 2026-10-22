# Gaps

[Back to the release spec](../release.md)

Open questions left for the implementation sub-issues.

- **Docker Hub "already published" check.** How to test that `<image>:<version>` exists (Docker Hub API, `docker manifest inspect`), and which credentials it needs.
- **`deku-swarm` and `deku-sprout`.** `deku-swarm` declares no dependency on `deku-sprout` today. Should it? If it ever does, `release.yml` and the cascade rules change with it.
- **README version checks.** `scripts/check_tag_version.sh` and `scripts/check_client_tag_version.sh` also check README versions. With `check-client-version-tag` gone, where does the client's README check move to, and should the other packages get one?
- **Passing "released or not" downstream.** No-op jobs must tell their dependents and the extra jobs whether they released (CircleCI workspace, an output file, or re-running detection in each job).
- **Waiting for npm.** `npm-publish` already waits for pinned dependencies (`scripts/ci.sh wait-for-npm`). The generalized jobs need the same wait for every released dependency.
- **`GITHUB_TOKEN` for the tag-push job.** The token today is used by `check-and-publish-package.sh` (see [`release-token.md`](../../release-token.md)); it moves to the separate tag-push job.
- **Forgotten-bump check prefixes.** `scripts/lib/package_bump_check.sh` finds the last release by tag prefix (`worker-`, `deku-sprout-`). With the new `swarm-` / `sprout-` prefixes, it must also fall back to the old ones until a new tag exists.
- **Cascade-bump comparison base.** The exact refs the test compares (last `X.Y.Z` tag on tags, merge base with `main` on PRs).
