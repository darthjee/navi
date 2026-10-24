# Scripts

Update the script paths and rename the `bump_version.sh` target from `worker` to `deku-swarm`.

- `scripts/bump_version.sh`:
  - Usage text and `TARGETS_REGEX` become `app|all|client|deku-swarm|deku-sprout`.
  - `WORKER_README` / `WORKER_PACKAGE_JSON` become `DEKU_SWARM_README` / `DEKU_SWARM_PACKAGE_JSON`, pointing at `deku-swarm/README.md` / `deku-swarm/package.json`.
  - In the `case` branches of `package_json_for`, `release_package_for` and `bump_target`, `worker)` becomes `deku-swarm)`. `CHECKED_PACKAGES` entry `"worker deku-swarm"` becomes `"deku-swarm deku-swarm"`. `bump_worker` becomes `bump_deku_swarm` (inside it, `tag_prefix_for worker` becomes `tag_prefix_for deku-swarm`).
  - Keep the `update_readme_row "Worker (Deku Swarm)"` label as is.
- `scripts/ci/pin-local-deps.sh`: `require('./worker/package.json')` becomes `require('./deku-swarm/package.json')`, and `WORKER_VERSION` becomes `DEKU_SWARM_VERSION`.
- `scripts/lib/package_bump_check.sh`: in the header comment, `worker/ -> deku-swarm` becomes `deku-swarm/ -> deku-swarm`.
- `scripts/release/spec/validateReleaseTree_spec.js`: fixtures `'file:../worker'` (and any `folder: 'worker'`) become `deku-swarm`.
- Grep `scripts/` once more for `worker` path references (`git grep -n worker -- scripts`).

## Files to Change
- `scripts/bump_version.sh`
- `scripts/ci/pin-local-deps.sh`
- `scripts/lib/package_bump_check.sh`
- `scripts/release/spec/validateReleaseTree_spec.js`
