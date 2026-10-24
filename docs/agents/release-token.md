# Release Token (`GITHUB_TOKEN`)

`GITHUB_TOKEN` is the GitHub credential CI uses to push release git tags. Its only consumer is `scripts/ci/push-release-tag.sh` (`scripts/ci.sh push-tag <package>`), run by the `push-tag-<package>` jobs. The per-package npm release jobs (`release-deku-sprout`, `release-deku-swarm`, `release-navi-hey`, `release-navi-hey-client`, all running `scripts/ci/release-npm-package.sh`) push no tag and do not need the token; they write `released/<package>` (`true`/`false`) to the CircleCI workspace instead. See [Release Cycle](release.md) for the overall flow.

## Who needs it

| CircleCI job | Runs after | Tag pushed |
|---|---|---|
| `push-tag-deku-sprout` | `release-deku-sprout` | `sprout-<deku-sprout/package.json version>` |
| `push-tag-deku-swarm` | `release-deku-swarm` | `swarm-<deku-swarm/package.json version>` |
| `push-tag-navi-hey-client` | `release-navi-hey-client` | `node_client-<clients/node/package.json version>` |

The prefix is the package's `tag_prefix` in `release.yml`; `navi-hey` (tagged `X.Y.Z`) and the Docker images get no extra tag. Each job always runs, but halts as a no-op (the `skip-unless-released` command, `scripts/ci/released.sh`) unless its package actually published, and fails when the `released/<package>` file is missing. Otherwise it fails fast without `GITHUB_TOKEN`, skips when the tag already exists locally or on `origin`, and creates an annotated tag on the commit being built (the `X.Y.Z` tagged commit), pushing only that tag. `DRY_RUN=1` prints the tag instead of pushing it. The old `deku-sprout-…`, `worker-…` and `client-…` tags stay as history; nothing creates new ones.

The token must never be echoed, and no release script uses `set -x`.

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
3. Re-run a `push-tag-<package>` job of the last tag build that published a package to confirm the push works (it skips when the tag already exists, so a fresh push needs a release that has no tag yet).
4. Revoke the old token if a new one was created.

## Troubleshooting

These apply to the `push-tag-<package>` jobs.

| Symptom | Cause | Fix |
|---|---|---|
| `remote: Invalid username or token` / `fatal: Authentication failed` (HTTP 401) | Token expired, revoked or mistyped. | Rotate the token. |
| `403` / `Permission to darthjee/navi.git denied` | Token lacks **Contents: Read and write**. | Edit the token's repository permissions. |
| `Repository not found` (HTTP 404) | Token is not scoped to `darthjee/navi` (or wrong resource owner). | Add `darthjee/navi` to the token's selected repositories. |

## Re-running a release

Every `release-<pkg>` job is idempotent: it skips the npm publish when its version is already on npm, so a failed release workflow can simply be re-run. Re-running only a failed `push-tag-<package>` job is safe too: it re-reads the workspace flag of its release job and skips a tag that already exists.
