# CircleCI image jobs and followers

Rewire `.circleci/config.yml`.

**Commands** (under `commands:`):
- `skip-unless-released` (parameter `image`): `attach_workspace: { at: . }`, then the guard block from step 2 with `<<parameters.image>>`.

**Jobs:**
- `release-darthjee-navi-hey` (`machine: true`). It replaces `build-and-release`:
  - `checkout`;
  - `run: scripts/ci.sh release-docker darthjee/navi-hey source release`;
  - `persist_to_workspace: { root: ., paths: [released/darthjee-navi-hey] }`.
- `release-darthjee-navi-hey-client` (`machine: true`). It replaces `build-and-release-client`, and has the same three steps with `darthjee/navi-hey-client clients/node release-client`.
- `update-description`, `build-and-release-demo`, `build-and-release-demo-app` and `build-and-release-navi-hey-test` each run `checkout` and then `skip-unless-released: { image: darthjee/navi-hey }` before their existing step.
- `update-description-client` runs `checkout` and then `skip-unless-released: { image: darthjee/navi-hey-client }` before its existing step.
- Delete the `build-and-release` and `build-and-release-client` job definitions.

**Workflow `test-and-release`:**
- Replace `build-and-release` with `release-darthjee-navi-hey`, `requires: [release-navi-hey]`.
- Add `release-darthjee-navi-hey-client`, `requires: [release-navi-hey-client]`.
- Point `update-description`, `build-and-release-demo`, `build-and-release-demo-app` and `build-and-release-navi-hey-test` at `requires: [release-darthjee-navi-hey]`.
- Add `update-description-client`, `requires: [release-darthjee-navi-hey-client]`.
- Every new or changed entry uses `filters: *version-tag-filters`.
- Extend the comment above the release jobs: each image job follows its npm package (`release.yml` `depends_on`), and the followers act only when their image released.

## Files to Change
- `.circleci/config.yml` — new `skip-unless-released` command, two image jobs, guarded followers, workflow rewiring, removal of `build-and-release` and `build-and-release-client`.
