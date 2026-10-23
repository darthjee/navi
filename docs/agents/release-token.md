# Release Token (`GITHUB_TOKEN`)

`GITHUB_TOKEN` is the GitHub credential CI uses to push release git tags. **It currently has no user.** The per-package npm release jobs (`release-deku-sprout`, `release-deku-swarm`, `release-navi-hey`, `release-navi-hey-client`, all running `scripts/ci/release-npm-package.sh`) no longer push any tag, since #986 moved tag pushing out of the release script. The separate tag-push job (#988) will be its consumer. Until it lands, no `sprout-` / `swarm-` / `node_client-` tags are pushed (accepted gap).

The settings, storage and rotation below still apply, so the token is ready once #988 lands.

## Who will need it

| CircleCI job | Tags pushed |
|---|---|
| tag-push job (#988, not wired yet) | the `<tag_prefix>X.Y.Z` tag of every package released from `release.yml` |

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
3. Once the tag-push job (#988) exists, re-run the last tag build to confirm the push works.
4. Revoke the old token if a new one was created.

## Troubleshooting

These apply to the tag push once #988 wires it.

| Symptom | Cause | Fix |
|---|---|---|
| `remote: Invalid username or token` / `fatal: Authentication failed` (HTTP 401) | Token expired, revoked or mistyped. | Rotate the token. |
| `403` / `Permission to darthjee/navi.git denied` | Token lacks **Contents: Read and write**. | Edit the token's repository permissions. |
| `Repository not found` (HTTP 404) | Token is not scoped to `darthjee/navi` (or wrong resource owner). | Add `darthjee/navi` to the token's selected repositories. |

## Re-running a release

Every `release-<pkg>` job is idempotent: it skips the npm publish when its version is already on npm, so a failed release workflow can simply be re-run.
