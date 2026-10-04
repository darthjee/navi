# Release Token (`GITHUB_TOKEN`)

The release pipeline publishes `worker/` (`deku-swarm`) and `logger/` (`deku-sprout`) to npm through `scripts/ci/check-and-publish-package.sh`, and then pushes the matching git tag (`worker-X.Y.Z` / `deku-sprout-X.Y.Z`). Pushing that tag needs a GitHub credential, read from the `GITHUB_TOKEN` environment variable.

## Who needs it

| CircleCI job | Script | Tag pushed |
|---|---|---|
| `check-and-publish-worker` | `scripts/ci.sh check-and-publish-worker` | `worker-X.Y.Z` |
| `check-and-publish-deku-sprout` | `scripts/ci.sh check-and-publish-deku-sprout` | `deku-sprout-X.Y.Z` |

Both run `scripts/ci/check-and-publish-package.sh`, which pushes the tag with:

```bash
git push "https://x-access-token:${GITHUB_TOKEN}@github.com/darthjee/navi.git" "$TAG"
```

The script checks `GITHUB_TOKEN` **first**, before the version-bump check and before any `npm publish`, and exits 1 with `GITHUB_TOKEN is required to push release tags` when it is empty. This keeps npm and the git tags from getting out of sync. The check is skipped under `DRY_RUN=1`, and it runs on every non-dry run (even when the tag already exists), so a missing credential is caught on every release. The token is never echoed and the script never uses `set -x`.

`npm-publish` (the `navi-hey` release) requires both `check-and-publish-*` jobs, so a missing or broken token blocks the whole Navi release.

## Creating the token

Create a **fine-grained personal access token** in GitHub (Settings → Developer settings → Personal access tokens → Fine-grained tokens):

- **Name:** something traceable, e.g. `circleci-navi-release`.
- **Resource owner:** `darthjee`.
- **Repository access:** *Only select repositories* → `darthjee/navi`.
- **Repository permissions:** **Contents: Read and write** (Metadata: Read-only is added automatically). Nothing else.
- **Expiration:** a fixed date. Set a reminder to rotate it before it expires.

## Storing it in CircleCI

CircleCI → Project Settings (`darthjee/navi`) → Environment Variables → add `GITHUB_TOKEN` with the token value.

Keep **"Pass secrets to builds from forked pull requests"** disabled, so the token never reaches builds from forks.

The old `GH_PUSH_TOKEN` variable is no longer read and can be deleted.

## Rotation

1. Regenerate the token in GitHub (or create a new one with the same settings).
2. Replace the `GITHUB_TOKEN` value in the CircleCI project environment variables.
3. Re-run the last tag build to confirm the push works.
4. Revoke the old token if a new one was created.

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `GITHUB_TOKEN is required to push release tags` | The variable is not set in CircleCI. | Add it (see above). |
| `remote: Invalid username or token` / `fatal: Authentication failed` (HTTP 401) | Token expired, revoked or mistyped. | Rotate the token. |
| `403` / `Permission to darthjee/navi.git denied` | Token lacks **Contents: Read and write**. | Edit the token's repository permissions. |
| `Repository not found` (HTTP 404) | Token is not scoped to `darthjee/navi` (or wrong resource owner). | Add `darthjee/navi` to the token's selected repositories. |

## Recovering a half-done release

If a release failed after the npm publish but before the tag push (e.g. `deku-swarm@1.11.1` on npm without a `worker-1.11.1` tag), fix the token and re-run the release workflow. The npm publish and the tag push are each idempotent: the script skips the publish when the version is already on npm, pushes the missing tag, and `npm-publish` then proceeds.
