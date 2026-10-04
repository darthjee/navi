# Update the docs
Document the new behavior wherever `bump_version.sh` usage is described:

- `README.md` (release section, around lines 23–25): say that `bump_version.sh` (app) refuses when `worker/` or `logger/` changed without a bump, that `--force` overrides the refusal, and that `bump_version.sh all` bumps everything in one go. Also replace the stale line saying `deku-sprout` "is released independently: pushing a `deku-sprout-x.y.z` tag publishes it". Since #964, it is published only by the app release, like `deku-swarm`. This README part falls in the `docs` agent's scope.
- `docs/agents/logger.md` (Version bump row) and `docs/agents/client-node.md` (bump_version paragraph, which still lists only `[app|client]`): list the full `[--force] [app|all|client|worker|deku-sprout] [version]` usage and the app-target check.
- `docs/agents/logger.md` (Auto-publish job row): mention that the forgotten-bump detection now lives in `scripts/lib/package_bump_check.sh`, shared with `bump_version.sh`.
- `.claude/agents/worker.md` and `.claude/agents/logger.md` versioning bullets: add that an app bump refuses while the package is stale, and that `bump_version.sh all` exists.

## Files to Change
- `README.md` — release section: new check, `--force`, `all`; fix the stale standalone deku-sprout sentence.
- `docs/agents/logger.md` — version bump usage and shared-helper mention.
- `docs/agents/client-node.md` — full usage line.
- `.claude/agents/worker.md`, `.claude/agents/logger.md` — versioning bullets.
