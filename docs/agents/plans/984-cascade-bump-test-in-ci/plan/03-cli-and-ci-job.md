# CLI, ci.sh action and CI job

- `scripts/release/bin/check-cascade-bumps.js`, mirroring `bin/validate-release-yml.js`:
  - args: `[rootDir] [baseRef]`; `rootDir` defaults to the repo root as in the validator.
  - load the tree, resolve the base ref (explicit arg or `resolveBaseRef(runGit, process.env)`);
  - no base → print `No comparison base found — skipping cascade-bump check` and exit 0;
  - collect base and `HEAD` versions, run `checkCascadeBumps`;
  - errors → print `Missing cascade bumps (base <ref>):` plus one `  - <error>` line each, exit 1;
  - else print `Cascade bumps OK (base <ref>)` and exit 0.
- Add the bin to `package.json` `bin` (`check-cascade-bumps`).
- `scripts/ci/cascade-bump-check.sh`, same shape as `scripts/ci/validate-release-yml.sh`: install deps for `scripts/release`, `git fetch origin main --tags || true`, then run the CLI with the repo root.
- `scripts/ci.sh`: add `cascade-bump-check) bash "$DIR/ci/cascade-bump-check.sh" "$@" ;;`.
- `.circleci/config.yml`:
  - workflow: `- cascade-bump-check: filters: *all-tags`, next to `validate-release-yml`;
  - job `cascade-bump-check` (executor `node-ci`, `checkout`, run `scripts/ci.sh cascade-bump-check`).
- Sanity check locally on `issue-984`: `scripts/ci.sh cascade-bump-check` passes (no versions changed vs. `origin/main`), and `node bin/check-cascade-bumps.js ../.. <ref-before-a-sprout-bump>` reports the expected errors where applicable.

## Files to Change
- `scripts/release/bin/check-cascade-bumps.js` — new CLI.
- `scripts/release/package.json` — add the bin entry.
- `scripts/ci/cascade-bump-check.sh` — new CI wrapper.
- `scripts/ci.sh` — new `cascade-bump-check` action.
- `.circleci/config.yml` — new workflow entry and job.
