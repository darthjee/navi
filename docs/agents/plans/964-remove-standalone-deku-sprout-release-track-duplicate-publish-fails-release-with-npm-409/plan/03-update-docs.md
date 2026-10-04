# Update the release docs
Make the docs describe the single-trigger flow.

**`docs/agents/logger.md`, "Release flow" section:**
- Change the intro line (`deku-sprout` has its own version, CI jobs and tags, independent from `navi-hey`…). It keeps its own version and tags, but it is published only by the app `X.Y.Z` release.
- Remove the "Standalone tag workflow" row.
- "Tags" row: describe `deku-sprout-X.Y.Z` as a release marker pushed by `check-and-publish-deku-sprout` after publishing. Pushing it by hand does nothing (marker tags are ignored by CI). To publish, bump `logger/package.json` with `scripts/bump_version.sh deku-sprout` and cut an app `X.Y.Z` release. Replace the "decoupled from the main `navi-hey` release tag (#923)" wording, mentioning that #964 removed the standalone track.
- Rewrite the paragraph after the table ("A `deku-sprout` release does **not** force a release of `navi-hey`…"). Publishing `deku-sprout` now requires an app `X.Y.Z` release. `source/` and `dev/app` still pick up `logger/` changes through `file:`. `clients/node/` moves only when its `^` range or pinned version is bumped, so a new `deku-sprout` version the client needs must first be published by an app release.

**`docs/agents/release-token.md`:**
- Remove the `publish-deku-sprout-standalone` row from the "Who needs it" table, and change "All three run…" to "Both run…".

**`.claude/agents/logger.md` (line ~57):**
- "Releases are tagged `deku-sprout-X.Y.Z`" → note that `deku-sprout` is published by the app `X.Y.Z` release, and that `deku-sprout-X.Y.Z` is a CI-pushed marker tag.

Check `docs/agents/worker.md` and `.claude/agents/worker.md` for any statement that `worker-X.Y.Z` tags trigger CI, and adjust if present. No change is expected, since there was never a worker standalone track.

## Files to Change
- `docs/agents/logger.md` — release flow: drop the standalone row, update the tags row and the coupling paragraph.
- `docs/agents/release-token.md` — drop the `publish-deku-sprout-standalone` row, change "All three" to "Both".
- `.claude/agents/logger.md` — describe the release/tag flow correctly.
