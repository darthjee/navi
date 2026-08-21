# Cut the first deku-swarm release

Once `engine`, `docker`, `docs`, and the earlier `architect` steps have all landed on `main`, cut the first `deku-swarm` release so the CI jobs from step 01 actually publish it.

## Steps

1. Run `scripts/bump_version.sh worker 1.6.2` (sets `worker/package.json`'s version and the README badges — should already read `1.6.2` if `docs`'s step already put the initial badges in place at that version, in which case this is a no-op verification rather than a real bump).
2. Commit and push.
3. `git tag worker-1.6.2 && git push origin worker-1.6.2` — triggers `npm-publish-worker` (from step 01).
4. Confirm CI: `check-worker-version-tag` passes, `npm-publish-worker` checks npm for `deku-swarm@1.6.2` and publishes since it doesn't exist yet.
5. On Navi's next release, the swap step (from step 01) replaces `file:../worker` with `^1.6.2` in the published `source/package.json` — no manual action needed here, just confirm it fires correctly on the next Navi version tag.

## Files to Change

- `worker/package.json`, `README.md` — version bump (only if not already at `1.6.2` from earlier steps).
- No other files — this step is mostly git/CI operations (tag + push), not code changes.

## Notes

- Tag creation for worker releases is manual (`scripts/bump_version.sh worker` + `git tag`), not automated — matches the issue's explicit out-of-scope note.
- This is the last step of the entire plan; nothing else depends on it landing first.
