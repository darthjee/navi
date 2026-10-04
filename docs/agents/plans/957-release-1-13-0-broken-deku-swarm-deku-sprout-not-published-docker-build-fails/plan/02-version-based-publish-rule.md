# Rewrite the worker/deku-sprout publish rule
Replace the change-detection trigger in both check scripts with a rule based on whether the version is on npm, plus a git-only check for a forgotten version bump. Apply the same structure to both scripts. Worker uses `worker/`, `deku-swarm` and the `worker-` tag prefix; deku-sprout uses `logger/`, `deku-sprout` and the `deku-sprout-` tag prefix.

New flow for each script:

1. **Read the version** from `<folder>/package.json` (as today).
2. **Forgotten-bump check** (git-only; skipped when `SKIP_BUMP_CHECK=true`):
   - Find the previous release, excluding the tag being built, by starting from `HEAD^`: `git describe --tags --abbrev=0 --match='<prefix>*' --match='[0-9]*.[0-9]*.[0-9]*' HEAD^ 2>/dev/null`.
   - If none is found, print `No previous release tag found — skipping bump check` and continue.
   - Otherwise, if `git diff --quiet "$LAST_TAG"..HEAD -- <folder>/lib <folder>/package.json` reports changes **and** the `version` in `<folder>/package.json` at `$LAST_TAG` (`git show "$LAST_TAG:<folder>/package.json" | node -p "JSON.parse(require('fs').readFileSync(0)).version"`, or equivalent) equals the current version, print `<folder>/ published files changed since $LAST_TAG but version <v> was not bumped` to stderr and exit 1.
   - Changes outside `lib/` and `package.json` (specs, eslint config, README, yarn.lock) are ignored.
3. **Publish decision:** run `npm view "<pkg>@<version>" version`, capturing stdout, stderr and the exit code.
   - Success with matching output → `already on npm — skipping publish`.
   - Failure whose output contains `E404` / `404` / "is not in this registry" → publish, using the existing `install-deps` + `publish` calls.
   - Any other failure (network, auth, registry outage) → print the npm error to stderr and exit 1.
4. **Tag push:** unchanged (idempotent `<prefix><version>` tag creation and push).
5. **`DRY_RUN=1`:** when set, print `would publish <pkg>@<version>` / `would push tag <tag>` instead of publishing or pushing. All checks still run.

Remove the `CHANGED` logic, the `FORCE_WORKER_BUILD` / `FORCE_DEKU_SPROUT_BUILD` handling and the "Skipping … no changes and force build not requested" exit.

## Files to Change
- `scripts/ci/check-and-publish-worker.sh` — new flow as above.
- `scripts/ci/check-and-publish-deku-sprout.sh` — same flow for `logger/` / `deku-sprout`.
