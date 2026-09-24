# Document the release-time pinning

Update the architecture docs that describe the `file:` links, so readers know the links are rewritten at release:

- `docs/agents/worker.md`: where it says `source/` consumes `"deku-swarm": "file:../worker"`, add that `scripts/ci/pin-local-deps.sh` pins it to the exact `worker/package.json` version in the `npm-publish` job before `navi-hey` is published.
- `docs/agents/logger.md`: in the release/publish table, add a matching row or sentence for `deku-sprout` (`file:../logger` is pinned to the exact `logger/package.json` version, and publishing fails if any `file:` dependency remains).

## Files to Change
- `docs/agents/worker.md` — mention release-time pinning of `deku-swarm`.
- `docs/agents/logger.md` — mention release-time pinning of `deku-sprout` and the `file:` guard.
