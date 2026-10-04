# Update docs
Describe the new rule wherever the old change-detection/force behavior is documented.

- `README.md` (line ~23, `docs` agent's scope): replace "whenever `worker/` changed since the last worker release (or `force_worker_build` …)" and the `force_worker_build` sentence. New text: tagging a navi release publishes `deku-swarm` (and `deku-sprout`) whenever the version in its `package.json` isn't on npm yet, and pushes the matching tag. The release **fails** if the published files (`lib/`, `package.json`) changed since the previous release without a version bump. Keep the `bump_version.sh worker [version]` guidance.
- `docs/agents/logger.md` (lines ~77–78):
  - **Auto-publish job row:** publishes when `logger/package.json`'s version isn't on npm, fails on a forgotten bump (`lib/`/`package.json` changed with an unchanged version), no `force_deku_sprout_build`.
  - **Standalone tag workflow row:** the same publish script with `SKIP_BUMP_CHECK=true` instead of "forced".
- Optionally mention `scripts/ci/wait-for-npm.sh` where the release flow is described, if there is a natural spot. Don't add new doc pages.

## Files to Change
- `README.md` — release paragraph for deku-swarm.
- `docs/agents/logger.md` — Auto-publish job and Standalone tag workflow rows.
