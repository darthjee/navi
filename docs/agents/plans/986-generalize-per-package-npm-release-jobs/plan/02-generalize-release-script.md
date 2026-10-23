# Generalize the npm release script

Rename `scripts/ci/check-and-publish-package.sh` to `scripts/ci/release-npm-package.sh` (with `git mv`) and change its interface to `release-npm-package.sh <release.yml package name>`.

Behavior, in order:

1. **Resolve.**
   - Install `scripts/release` deps (`install-deps.sh scripts/release true`, as `validate-release-yml.sh` does).
   - Run `node scripts/release/bin/release-package-info.js "$PACKAGE"` and read `FOLDER`, `PLATFORM`, `TAG_PREFIX` and `DEPENDS_ON` from its output (no `eval` of arbitrary text: parse line by line).
   - Fail when `PLATFORM` is not `npm`.
   - Read `VERSION` from `$FOLDER/package.json` (`package_bump_read_version`).
2. **Forgotten-bump check.** Keep `check_version_bump` as-is (`package_bump_check "$FOLDER" "$TAG_PREFIX" HEAD^ HEAD`, `SKIP_BUMP_CHECK=true` to skip). See the `scripts/lib/package_bump_check.sh` change below.
3. **Wait for dependencies.** For each name in `DEPENDS_ON`:
   - resolve its folder with the same helper;
   - read that folder's `package.json` version;
   - run `wait-for-npm.sh <dep> <version>`.

   With `DRY_RUN=1`, only print `would wait for <dep>@<version>`.
4. **Publish decision + publish.** Keep `needs_publish` and `publish` unchanged: the same `npm view` handling (nothing or a 404 means publish, the version already there means skip, any other error fails), and the same `DRY_RUN=1` behavior.
5. **Wait for self.** Only after an actual publish (not in `DRY_RUN`), run `wait-for-npm.sh "$PACKAGE" "$VERSION"`.

Remove `check_token`, `push_tag`, the `GITHUB_TOKEN` env doc and the `<tag-prefix>` positional argument. Update the header comment to describe the new flow, and note that tag pushing moved to the tag-push job (#988).

`scripts/lib/package_bump_check.sh`:
- In `package_bump_last_tag`, when `tag_prefix` is empty, call `git describe` with only `--match='[0-9]*.[0-9]*.[0-9]*'`, because `--match='*'` would match any tag.
- Update the header's "Used by" line and the package list in its first comment line, since it now covers every npm package.

`scripts/ci.sh`:
- Add `release-npm) bash "$DIR/ci/release-npm-package.sh" "$@" ;;`.
- Remove the `check-and-publish-worker` and `check-and-publish-deku-sprout` entries.

Delete `scripts/ci/check-and-publish-worker.sh` and `scripts/ci/check-and-publish-deku-sprout.sh`.

Check `scripts/bump_version.sh` still sources `package_bump_check.sh` correctly. It passes explicit prefixes (`worker-`, `deku-sprout-`), so it is unaffected by the empty-prefix branch.

## Files to Change
- `scripts/ci/check-and-publish-package.sh` → `scripts/ci/release-npm-package.sh` — generalized as above.
- `scripts/lib/package_bump_check.sh` — empty-prefix handling; header comment.
- `scripts/ci.sh` — new `release-npm` entry; remove the two old entries.
- `scripts/ci/check-and-publish-worker.sh` — delete.
- `scripts/ci/check-and-publish-deku-sprout.sh` — delete.
