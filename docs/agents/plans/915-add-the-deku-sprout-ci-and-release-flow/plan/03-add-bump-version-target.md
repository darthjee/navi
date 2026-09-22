# Add a deku-sprout target to bump_version.sh

Add `deku-sprout` as a fourth target to `scripts/bump_version.sh` (alongside `app`, `client`, `worker`), mirroring `bump_worker()`: it updates `logger/package.json`'s `"version"` field and maintains a "Deku Sprout Current Version" / "Deku Sprout Next Version" pair of lines in the root `README.md`, using the `deku-sprout-X.Y.Z` release-tag URL pattern, inserted right after the existing "Worker Next Version" line (creating both lines on first run if absent, the same insert-if-missing/replace-if-present logic `bump_worker()` uses).

## Files to Change

- `scripts/bump_version.sh`:
  - add `LOGGER_PACKAGE_JSON="$ROOT_DIR/logger/package.json"`.
  - extend the target validation regex/usage (`^(app|client|worker)$` → `^(app|client|worker|deku-sprout)$`) and `package_json_for()`'s case statement with a `deku-sprout` branch.
  - add a `bump_deku_sprout()` function mirroring `bump_worker()`: bumps `"version"` in `$LOGGER_PACKAGE_JSON`; inserts/updates `**Deku Sprout Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/deku-sprout-$VERSION)` and `**Deku Sprout Next Version:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/deku-sprout-$VERSION...main)` in `$README`, anchored after the "Worker Next Version" line.
  - add a `deku-sprout) bump_deku_sprout ;;` case to the final `case "$TARGET" in ... esac` dispatch.
