# Remove the client- pipeline

- Remove these four workflow entries, along with the `&client-tag-filters` anchor they use: `check-client-version-tag`, `npm-publish-client`, `build-and-release-client` and `update-description-client`.
- Delete the `check-client-version-tag` and `npm-publish-client` job definitions under `jobs:`.
- Keep the `build-and-release-client` and `update-description-client` job definitions, unwired. CircleCI allows defined but unused jobs. #987 reuses them.
- Delete `scripts/check_client_tag_version.sh`. Only `check-client-version-tag` called it.
- Leave `scripts/check_tag_version.sh` and `check-version-tag` unchanged. `X.Y.Z` must still match `source/package.json`'s `version`.
- Check that nothing else references the deleted names: `grep -rn "check_client_tag_version\|check-client-version-tag\|npm-publish-client"`, ignoring `docs/agents/issues`, `docs/agents/plans` and `docs/agents/specs/release`.

## Files to Change
- `.circleci/config.yml` — remove the client workflow entries, the anchor, and the two npm-side job definitions.
- `scripts/check_client_tag_version.sh` — delete.
