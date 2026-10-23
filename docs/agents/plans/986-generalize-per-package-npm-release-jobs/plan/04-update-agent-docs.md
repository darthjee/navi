# Update agent docs

Bring the agent-facing docs in line with the new jobs. Don't touch `docs/agents/specs/release/` or the user-facing docs (#989).

- **`docs/agents/release-token.md`**: rewrite the intro and job table.
  - `GITHUB_TOKEN` no longer has a user: tag pushing was removed from the release script, and the separate tag-push job (#988) will be its new consumer.
  - Drop the `npm-publish requires both check-and-publish-*` sentence and the "fails first when the token is empty" behavior.
  - Keep the PAT settings/rotation sections, since they still apply once #988 lands.
  - Adjust or drop the troubleshooting rows about the tag push.
- **`docs/agents/logger.md`**:
  - Auto-publish row (line ~77): `deku-sprout` is now released by `release-deku-sprout` (`scripts/ci.sh release-npm deku-sprout`, `scripts/ci/release-npm-package.sh`). The bump check, the `npm view` decision, `SKIP_BUMP_CHECK` and `DRY_RUN` stay. There is no tag push and no `GITHUB_TOKEN`.
  - Tags row (line ~79): CI no longer pushes the `deku-sprout-X.Y.Z` marker. The new `sprout-` tag arrives with #988. All non-`X.Y.Z` tags trigger nothing.
  - Pinning row (line ~80): `release-navi-hey` (not `npm-publish`) runs `pin-local-deps`, and the waits for its deps happen inside the release script.
- **`docs/agents/client-node.md`** (release paragraph, line ~65): `navi-hey-client` is published to npm on `X.Y.Z` tags by `release-navi-hey-client` when its version is new, after `release-deku-sprout`. The image jobs stay unwired until #987.
- **`AGENTS.md`** (line ~30, the Release Token row): reword the description so it no longer claims the token pushes `worker-X.Y.Z` / `deku-sprout-X.Y.Z` tags today.

## Files to Change
- `docs/agents/release-token.md` — as above.
- `docs/agents/logger.md` — rows 77, 79, 80.
- `docs/agents/client-node.md` — release paragraph.
- `AGENTS.md` — Release Token row description.
