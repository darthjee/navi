# Remove dead scripts and validate

1. Delete `scripts/ci/check-worker-changes.sh` (superseded by
   `scripts/ci/check-and-publish-worker.sh`).
2. Delete `scripts/check_worker_tag_version.sh` (its only consumer was the
   now-removed `check-worker-version-tag` job).
3. Decide whether `scripts/ci/check-npm-version.sh` is still needed: it was
   only consumed by the now-removed `npm-publish-worker` job. If nothing
   else in `.circleci/config.yml` calls `scripts/ci.sh check-npm-version`
   after this plan's changes, remove it too (and its `check-npm-version)
   ...` case in `scripts/ci.sh`) for consistency with the rest of this
   cleanup — otherwise leave it in place if still reused.
4. Validate the restructured `.circleci/config.yml`: run
   `circleci config validate .circleci/config.yml` if the CLI is available
   locally; otherwise sanity-check the YAML structure with a parser (e.g.
   `node -e "require('js-yaml').load(require('fs').readFileSync('.circleci/config.yml','utf8'))"`
   or `python3 -c "import yaml; yaml.safe_load(open('.circleci/config.yml'))"`)
   to catch anchor/reference mistakes without needing a real pipeline run.
5. Exercise `scripts/ci/check-and-publish-worker.sh`'s detection logic
   manually against a scratch clone (or a temp branch): simulate "no
   `worker/` changes, not forced" (expect a clean no-op `exit 0`), "changes
   present", and "`FORCE_WORKER_BUILD=true`" (both expected to proceed past
   the change-detection gate to the npm/tag checks). Do not actually run
   the real `npm publish`/`git push` calls locally — confirm the branch
   taken via `echo` output or by reading the script's control flow instead.

## Files to Change

- `scripts/ci/check-worker-changes.sh` — removed.
- `scripts/check_worker_tag_version.sh` — removed.
- `scripts/ci/check-npm-version.sh` and its `scripts/ci.sh` case — removed
  only if step 3 above confirms it's unused after this change.
