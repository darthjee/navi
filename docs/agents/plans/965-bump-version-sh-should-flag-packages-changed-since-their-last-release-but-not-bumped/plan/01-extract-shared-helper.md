# Extract the shared bump-check helper
Create `scripts/lib/package_bump_check.sh`, a file meant to be **sourced** (no `set -e`/`exit` at top level; functions `return` codes). It holds the detection logic from `check_version_bump`, parameterized so both CI and local callers can use it:

- `package_bump_last_tag <tag_prefix> <base_ref>`: echoes the last release tag found with `git describe --tags --abbrev=0 --match="<tag_prefix>*" --match='[0-9]*.[0-9]*.[0-9]*' <base_ref>`, or an empty string.
- `package_bump_check <folder> <tag_prefix> <base_ref> [<compare_ref>]`: when `<compare_ref>` is given (CI: `HEAD`), diffs `<tag>..<compare_ref>` and reads the current version from `<compare_ref>`'s working copy of `<folder>/package.json` (same as today: the checked-out file). When omitted (local), diffs `<tag>` against the **working tree** (`git diff --quiet <tag> -- <folder>/lib <folder>/package.json`) and reads the version from the working-tree `<folder>/package.json`. It prints the same messages CI prints today and returns:
  - `0`: no previous tag (skip), nothing changed, or changed and bumped.
  - `1`: stale (changed, same version). The `"... changed since <tag> but version <v> was not bumped"` message goes to stderr.
  It sets `PACKAGE_BUMP_LAST_TAG` / `PACKAGE_BUMP_VERSION` so callers can build their own messages.
- Read versions with `node -p` from stdin, exactly like `read_version` today, so CI parsing doesn't change.

Then change `scripts/ci/check-and-publish-package.sh` to source the helper (`source "$DIR/../lib/package_bump_check.sh"`) and turn `check_version_bump` into a thin wrapper: keep the `SKIP_BUMP_CHECK=true` short-circuit and its message, call `package_bump_check "$FOLDER" "$TAG_PREFIX" HEAD^ HEAD`, and `exit 1` on a non-zero return. CI output and exit codes must stay identical.

## Files to Change
- `scripts/lib/package_bump_check.sh` — new sourced helper holding the detection logic.
- `scripts/ci/check-and-publish-package.sh` — source the helper; `check_version_bump` delegates to it.
