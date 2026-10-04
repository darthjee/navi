# Issue: Release fails pushing worker/deku-sprout tag: GitHub authentication failed in CI

## Description
The release workflow publishes `worker/` (deku-swarm) and `logger/` (deku-sprout) through `scripts/ci/check-and-publish-package.sh`, which then pushes a `<prefix><version>` git tag. On the latest release, the tag push failed:

```
worker/ changed since 1.13.0 and version was bumped (1.11.0 -> 1.11.1)
deku-swarm@1.11.1 already on npm — skipping publish
Creating and pushing tag worker-1.11.1
remote: Invalid username or token. Password authentication is not supported for Git operations.
fatal: Authentication failed for 'https://github.com/darthjee/navi.git/'
```

## Problem
`push_tag` runs `git push "https://x-access-token:${GH_PUSH_TOKEN}@github.com/darthjee/navi.git" "$TAG"`. `GH_PUSH_TOKEN` is referenced nowhere else and is never validated, so an unset, expired or under-privileged token only surfaces as a git auth error at the very end — after npm may already have been published. Because `npm-publish` requires `check-and-publish-worker` and `check-and-publish-deku-sprout`, the whole Navi release is blocked. `deku-swarm@1.11.1` is on npm but the `worker-1.11.1` tag does not exist.

## Expected Behavior
- Tag creation in CI authenticates with a valid fine-grained PAT (Contents: Read and write on `darthjee/navi`) read from `GITHUB_TOKEN`.
- The script fails fast, before any npm publish, with a clear message when the token is missing.
- Re-running the release creates the missing `worker-1.11.1` tag and lets `npm-publish` proceed.

## Solution
1. **Token (manual):** create a fine-grained PAT — owner `darthjee`, only `darthjee/navi`, Repository → Contents: Read and write, fixed expiry — and store it as the CircleCI project environment variable `GITHUB_TOKEN`. Keep "Pass secrets to builds from forked pull requests" disabled.
2. **Script (`scripts/ci/check-and-publish-package.sh`):**
   - Rename `GH_PUSH_TOKEN` → `GITHUB_TOKEN` (matching Tent's convention).
   - Keep tag creation via `git push` over HTTPS (no switch to the REST API).
   - Validate `GITHUB_TOKEN` is non-empty at the start of the run (skipped under `DRY_RUN=1`), **before** `needs_publish`/`publish`, so npm publish and the tag can't get out of sync; exit 1 with `GITHUB_TOKEN is required to push release tags`.
   - Never echo the token or `set -x` around it.
3. **Docs:** add a doc under `docs/agents/` describing the release tag push: the required `GITHUB_TOKEN` env var, the PAT settings (owner, repo, Contents: Read and write, expiry), how to store it in CircleCI, rotation steps and troubleshooting (401 expired/invalid, 403 missing permission, 404 repo not visible).
4. **Recovery:** after the token is set, re-run the release; the script is idempotent (skips the npm publish already done, pushes the missing tag).

## Benefits
- Unblocks releases.
- Clear, early failure instead of a cryptic git auth error after a partial publish.
- Least-privilege, documented, rotatable credential with a name consistent across darthjee's repos.
