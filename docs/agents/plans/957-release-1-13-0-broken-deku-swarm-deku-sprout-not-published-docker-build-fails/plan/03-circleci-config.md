# Update the CircleCI config
Wire the new behavior into `.circleci/config.yml`.

- **Remove the pipeline parameters** `force_worker_build` and `force_deku_sprout_build` (the `parameters:` block at the top). If no other parameter remains, drop the whole `parameters:` key.
- **`check-and-publish-worker` job:** command becomes `scripts/ci.sh check-and-publish-worker` (no `FORCE_WORKER_BUILD=…`).
- **`check-and-publish-deku-sprout` job:** command becomes `scripts/ci.sh check-and-publish-deku-sprout` (no `FORCE_DEKU_SPROUT_BUILD=…`).
- **`publish-deku-sprout-standalone` job:** command becomes `SKIP_BUMP_CHECK=true scripts/ci.sh check-and-publish-deku-sprout`. `check-deku-sprout-version-tag` already guarantees the tag matches `logger/package.json`, so the bump check is skipped there.
- **`npm-publish` job:**
  - Add a step **after** "Pin local dependencies" and **before** "Publish to npm", named "Wait for pinned dependencies on npm". It reads the pinned versions from `worker/package.json` / `logger/package.json` (the same source `pin-local-deps.sh` uses) and runs `scripts/ci.sh wait-for-npm deku-swarm <v>` and `scripts/ci.sh wait-for-npm deku-sprout <v>`. Keep it a single `command:` line or a small inline block.
  - Add a final step "Wait for navi-hey on npm": `scripts/ci.sh wait-for-npm navi-hey "$CIRCLE_TAG"`.
- **`npm-publish-client` job:** add a final step "Wait for navi-hey-client on npm": `scripts/ci.sh wait-for-npm navi-hey-client "$(echo $CIRCLE_TAG | sed 's/^client-//')"`.

Leave job ordering, filters and the other jobs untouched.

## Files to Change
- `.circleci/config.yml` — parameter removal, three command changes, three new steps.
