# Plan: Release fails pushing worker/deku-sprout tag: GitHub authentication failed in CI

Issue: [960-release-fails-pushing-worker-deku-sprout-tag-github-authentication-failed-in-ci.md](../../issues/960-release-fails-pushing-worker-deku-sprout-tag-github-authentication-failed-in-ci.md)

## Overview
Make the release tag push in `scripts/ci/check-and-publish-package.sh` read its credential from `GITHUB_TOKEN` (instead of `GH_PUSH_TOKEN`), validate it before anything is published to npm, and document the fine-grained PAT the CI needs. Tag creation keeps using `git push` over HTTPS.

## Context
`check-and-publish-worker` and `check-and-publish-deku-sprout` both run `scripts/ci/check-and-publish-package.sh`, whose `push_tag` does:

```bash
git push "https://x-access-token:${GH_PUSH_TOKEN}@github.com/darthjee/navi.git" "$TAG"
```

`GH_PUSH_TOKEN` is never validated, so an unset/invalid token fails only at the very end (after a possible npm publish) with `remote: Invalid username or token`. This blocked the release: `deku-swarm@1.11.1` is on npm, but tag `worker-1.11.1` was never created, and `npm-publish` (which requires both jobs) never ran.

Decisions taken in the issue discussion:
- Env var renamed to `GITHUB_TOKEN` (Tent's convention).
- Keep `git push` (no switch to the REST API).
- Token check runs at the start of the script, before `needs_publish`/`publish`.
- Docs go under `docs/agents/`.

## Implementation Steps

### Step 1 — Harden `check-and-publish-package.sh`
- Update the header comment's `Env:` block to list `GITHUB_TOKEN` (required unless `DRY_RUN=1`: fine-grained PAT with Contents: Read and write on `darthjee/navi`, used to push the release tag).
- Add a `check_token` function and call it right after argument validation / before `check_version_bump`, so it runs before any npm publish:

  ```bash
  check_token() {
    if [ "$DRY_RUN" = "1" ]; then
      return 0
    fi

    if [ -z "${GITHUB_TOKEN:-}" ]; then
      echo "GITHUB_TOKEN is required to push release tags" >&2
      exit 1
    fi
  }
  ```

- In `push_tag`, replace `${GH_PUSH_TOKEN}` with `${GITHUB_TOKEN}`. Keep the `git push` over HTTPS. Do not echo the token and do not add `set -x`.
- No other file references `GH_PUSH_TOKEN` (verified with grep), so no further renames are needed in the repo.

### Step 2 — Document the release token
- Create `docs/agents/release-token.md` describing:
  - Which jobs need it (`check-and-publish-worker`, `check-and-publish-deku-sprout`, `publish-deku-sprout-standalone`) and why (pushing `worker-X.Y.Z` / `deku-sprout-X.Y.Z` tags via `git push https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git`), and that the script fails fast before publishing when it is missing.
  - Creating the fine-grained PAT: resource owner `darthjee`, *Only select repositories* → `darthjee/navi`, Repository permissions → **Contents: Read and write** (Metadata: read is automatic), fixed expiry with a rotation reminder, traceable name (e.g. `circleci-navi-release`).
  - Storing it in CircleCI: Project Settings → Environment Variables → `GITHUB_TOKEN`; keep "Pass secrets to builds from forked pull requests" disabled.
  - Rotation steps (regenerate in GitHub, replace the CircleCI variable, re-run the last tag build).
  - Troubleshooting: `GITHUB_TOKEN is required…` (variable missing); `Invalid username or token` / `Authentication failed` (expired, revoked or mistyped token); `403` / `Permission … denied` (Contents not writable); repository not found (token not scoped to `darthjee/navi`).
  - Recovering a half-done release: re-run the workflow — the npm publish and the tag push are each idempotent.
- Add a row for it to the documentation table in `AGENTS.md`.
- In `docs/agents/logger.md`'s "Release flow" table (Auto-publish job row) add a short mention that the tag push needs `GITHUB_TOKEN`, linking to `release-token.md`.

## Files to Change
- `scripts/ci/check-and-publish-package.sh` — rename `GH_PUSH_TOKEN` → `GITHUB_TOKEN`, add early `check_token`, update header comment.
- `docs/agents/release-token.md` — new doc: PAT settings, CircleCI storage, rotation, troubleshooting, recovery.
- `AGENTS.md` — link the new doc in the documentation table.
- `docs/agents/logger.md` — reference the token requirement in the release flow.

## CI Checks
- `scripts/`: no dedicated lint/test job covers the shell scripts; sanity-check locally with `bash -n scripts/ci/check-and-publish-package.sh` and a dry run, e.g. `DRY_RUN=1 SKIP_BUMP_CHECK=true bash scripts/ci/check-and-publish-package.sh worker deku-swarm worker-` (should not require `GITHUB_TOKEN`), and the same without `DRY_RUN` and without `GITHUB_TOKEN` (should exit 1 with the new message before any npm call).

## Notes
- **Manual, outside the repo (owner action):** create the fine-grained PAT and add it to CircleCI as `GITHUB_TOKEN`; the old `GH_PUSH_TOKEN` variable (if present) can then be deleted. The fix does not work until this is done.
- **Recovery:** after merge and token setup, re-run the release workflow for the failed version; the script skips the npm publish for `deku-swarm@1.11.1` and pushes `worker-1.11.1`.
- The token check runs even when the tag already exists, so every non-dry run of these jobs requires the token — intentional, so a missing credential is caught on every release rather than only when a new tag is due.
