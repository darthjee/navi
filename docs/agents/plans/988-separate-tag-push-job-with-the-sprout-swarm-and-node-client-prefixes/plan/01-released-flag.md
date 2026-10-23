# 01 — Released flag for npm packages and a generic guard

`scripts/ci/release-npm-package.sh` writes `released/<package>` after the publish decision:

- `true` when it published (after `wait_for_self`), also with `DRY_RUN=1` when the version is missing (same as `release-docker-image.sh`);
- `false` when the version was already on npm.

Use the same naming rule as `release-docker-image.sh` (`/` → `-`) so any name works. Update the script header (flow list, drop the "tag pushing moves to #988" sentence).

Generalize the guard from #987:

- Rename `scripts/ci/image-released.sh` to `scripts/ci/released.sh <name>` (same exit codes 0/1/2, still POSIX sh for the Alpine image). Update its messages from "image" to "release".
- `scripts/ci.sh`: replace the `image-released` action with `released`.
- `scripts/ci/release-docker-image.sh`: header comment references `released.sh`.

Extract the `release.yml` lookup (`read_package_info`, the KEY=value parsing of `scripts/release/bin/release-package-info.js`) from `release-npm-package.sh` into a sourced `scripts/lib/release_package_info.sh`, so step 02 and step 04 reuse it instead of copying it. Keep the function name and the `INFO_*` variables.

## Files to Change

- `scripts/ci/release-npm-package.sh` — write the flag; source the extracted helper.
- `scripts/lib/release_package_info.sh` — new, sourced helper (`read_package_info <name> <repo_root>`).
- `scripts/ci/image-released.sh` → `scripts/ci/released.sh` — rename and reword.
- `scripts/ci.sh` — `released` action instead of `image-released`.
- `scripts/ci/release-docker-image.sh` — comment only.
