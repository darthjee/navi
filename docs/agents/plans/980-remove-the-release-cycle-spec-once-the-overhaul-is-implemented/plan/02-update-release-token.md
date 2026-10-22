# Update release-token.md
`docs/agents/release-token.md` still describes the old jobs (`check-and-publish-worker`, `check-and-publish-deku-sprout`), the old `check-and-publish-package.sh` tag push, and the old `worker-X.Y.Z` / `deku-sprout-X.Y.Z` tags. Implementation sub-issue 6 should already have updated it, so verify it against the implemented tag-push job and fix anything left over:
- the "Who needs it" table: the job and the script;
- the tag prefixes `sprout-`, `swarm-` and `node_client-`;
- the troubleshooting and half-done-release recovery.

Keep the doc focused on `GITHUB_TOKEN`, and link `release.md` for the overall flow.

## Files to Change
- `docs/agents/release-token.md` — align it with the implemented jobs, scripts and tag prefixes.
