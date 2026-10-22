# Update agent docs

- `docs/agents/client-node.md` (line 65): rewrite the release paragraph. `client-X.Y.Z` tags no longer trigger anything, and `check-client-version-tag` and `npm-publish-client` are gone. Releasing `navi-hey-client` will move into the `X.Y.Z` release (#986/#987). Until then it has no CI release path. Point to `docs/agents/specs/release.md`.
- `docs/agents/logger.md` (line 80): drop the sentence "`npm-publish-client` ends with the same wait for `navi-hey-client`."
- Do not touch `docs/agents/specs/release/overview.md` (it documents the old flow on purpose) or the user-facing docs (#989).

## Files to Change
- `docs/agents/client-node.md` — the release paragraph matches the new triggers.
- `docs/agents/logger.md` — the reference to the removed `npm-publish-client` job is gone.
