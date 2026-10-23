# 03 — CircleCI tag jobs

- `skip-unless-released` command: rename the `image` parameter to `name` and call `sh scripts/ci/released.sh <<parameters.name>>`; update the five existing callers (`image: darthjee/...` → `name: darthjee/...`).
- `release-deku-sprout`, `release-deku-swarm`, `release-navi-hey-client` jobs: add `persist_to_workspace` (`root: .`, `paths: [released/<package>]`).
- New jobs, `executor: node-ci`, each: `checkout`, `skip-unless-released: {name: <package>}`, then `scripts/ci.sh push-tag <package>`:
  - `push-tag-deku-sprout` (requires `release-deku-sprout`);
  - `push-tag-deku-swarm` (requires `release-deku-swarm`);
  - `push-tag-navi-hey-client` (requires `release-navi-hey-client`).
- Workflow entries with `filters: *version-tag-filters`, plus a short comment above them like the Docker block's (always run, halt when the package did not publish, push `<tag_prefix><version>`).
- No tag job for `navi-hey` or the images.

## Files to Change

- `.circleci/config.yml` — command parameter, three `persist_to_workspace` steps, three jobs, three workflow entries.
