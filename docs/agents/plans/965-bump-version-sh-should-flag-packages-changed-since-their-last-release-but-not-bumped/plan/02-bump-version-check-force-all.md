# Add the stale-package check, --force and `all` to bump_version.sh
Update `scripts/bump_version.sh`:

1. **Argument parsing.** Accept an optional `--force` flag anywhere in the arguments: strip it out before the existing 0–2 positional handling. Add `all` to the target regex. New usage line: `Usage: $0 [--force] [app|all|client|worker|deku-sprout] [version]`.
2. **Source the helper** (`source "$SCRIPT_DIR/lib/package_bump_check.sh"`) and add `find_stale_packages`. It runs `package_bump_check <folder> <prefix> HEAD` (no compare ref, so it compares against the working tree) for `worker`/`worker-` and `logger`/`deku-sprout-`, and collects the stale *targets* (`worker`, `deku-sprout`) together with their last tags.
3. **`app` target.** Before any file is edited, run `find_stale_packages`. If any are stale and `--force` was not given, print to stderr one line per stale package (`<target> (<folder>/) changed since <tag> but version <v> was not bumped`), plus a hint: "bump it with `bump_version.sh <target>`, use `bump_version.sh all`, or pass `--force`; run `git fetch --tags` if release tags may be missing". Then exit 1 without touching any file. With `--force`, print the same lines as warnings and continue.
4. **`all` target.** Run `find_stale_packages`. Bump the app to `[version]`, or to the next app patch when no version is given. For each stale package, patch-bump it from its own current version. Each bump function currently reads the globals `TARGET`/`VERSION`/`NEXT_VERSION`, so refactor the version computation into a small `bump_target <target> [version]` routine. It resolves the version (explicit or next patch of that target's `package.json`), computes the next version and calls the matching `bump_*` function. `all` then calls it once for the app and once per stale package. Print one `Bumped <target> to <version> (next release: <next>)` line per bump. Unchanged or already-bumped packages are left alone. `--force` has no effect on `all`.
5. `client`, `worker`, `deku-sprout` targets keep today's behavior (no check).

Manual scenarios to verify (on a scratch branch, reverting edits afterwards):
- Clean tree, no package changes since their tags: `app` bumps normally.
- Edit a file under `worker/lib`: `app` refuses, exit 1, no file modified; `app --force` bumps with a warning; `all` bumps the app plus `worker`.
- After `bump_version.sh worker` (uncommitted), `app` succeeds.
- `bash -n scripts/bump_version.sh scripts/lib/package_bump_check.sh scripts/ci/check-and-publish-package.sh`.

## Files to Change
- `scripts/bump_version.sh` — `--force` parsing, `all` target, cross-package check on `app`, `bump_target` refactor, new usage line.
