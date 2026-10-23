# 05 — Agent docs

Describe the tag jobs and drop the "accepted gap" wording:

- `docs/agents/release-token.md` — `GITHUB_TOKEN`'s consumer is now `scripts/ci/push-release-tag.sh` in the `push-tag-*` jobs; remove the gap sentence.
- `docs/agents/logger.md` and `docs/agents/client-node.md` — release rows/paragraphs: the release job writes `released/<package>`, and `push-tag-<package>` pushes `sprout-` / `node_client-` after an actual publish. Do the same for the worker's agent doc if it has a release row (grep for `release-deku-swarm`).
- `AGENTS.md` and anything else mentioning `image-released.sh` or `skip-unless-released`'s `image` parameter — rename to `released.sh` / `name`.
- `docs/agents/specs/release/gaps.md` — mark the extra-tags gap as resolved, if listed.

## Files to Change

- `docs/agents/release-token.md`
- `docs/agents/logger.md`
- `docs/agents/client-node.md`
- `AGENTS.md`
- `docs/agents/specs/release/gaps.md`
