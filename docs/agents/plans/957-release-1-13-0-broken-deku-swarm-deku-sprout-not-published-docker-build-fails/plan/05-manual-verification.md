# Manual verification
There is no shell test suite (agreed in the issue), so verify by hand and record the results in the PR description.

Run from a scratch clone or branch, using throwaway **local** tags (never pushed) and `DRY_RUN=1`:
1. Worker version not on npm (e.g. temporarily set `worker/package.json` to an unpublished version) → `would publish deku-swarm@<v>`.
2. Version already on npm (e.g. `1.9.0`) with no `lib/` changes since the previous tag → skip publish, no failure.
3. Change a file under `worker/lib/` after a local release tag without bumping the version → the job fails with the "not bumped" message.
4. Change only a file under `worker/spec/` → no failure.
5. No matching previous tag (e.g. in a temporary repo with no tags, or `HEAD^` before any release) → "skipping bump check".
6. Simulate an `npm view` failure other than "not found" (e.g. `npm_config_registry=http://127.0.0.1:9`) → the job fails without trying to publish.
7. `SKIP_BUMP_CHECK=true` with scenario 3 → no failure.
8. Repeat scenarios 1–3 for `check-and-publish-deku-sprout.sh`.
9. `scripts/ci.sh wait-for-npm navi-hey 1.12.1` → returns immediately. `WAIT_FOR_NPM_TIMEOUT=15 WAIT_FOR_NPM_INTERVAL=5 scripts/ci.sh wait-for-npm navi-hey 0.0.0-does-not-exist` → fails with the timeout message after ~15 s.

Delete every local throwaway tag afterwards. The end-to-end check is the next real release.

## Files to Change
- None (verification only; results go in the PR description).
