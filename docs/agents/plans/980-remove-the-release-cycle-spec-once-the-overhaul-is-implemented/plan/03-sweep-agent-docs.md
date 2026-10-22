# Sweep agent docs for old-pipeline references
Update every agent doc that still presents the old pipeline as current. Replace detailed release text with a short summary and a link to `release.md`, so release rules live in one place. Known spots:

- `docs/agents/client-node.md` (lines ~63–69):
  - the standalone `client-X.Y.Z` flow (`check-client-version-tag`, `npm-publish-client`);
  - "A plain `X.Y.Z` app tag never touches this flow";
  - the `client` bump target described as a separate track.
- `docs/agents/logger.md` "Release flow" section:
  - `check-and-publish-deku-sprout`;
  - the `deku-sprout-X.Y.Z` tags;
  - the ignored `deku-sprout-*` / `worker-*` tags;
  - the `client-X.Y.Z` release mention.
- `docs/agents/worker.md`: the `npm-publish` pin step wording, if the job was renamed.
- `AGENTS.md`: the Logger Subsystem row mentions "its release flow".

Also run `grep -rn -i "client-X\|deku-sprout-X\|worker-X\|check-and-publish\|check-client-version-tag\|npm-publish-client" docs/agents AGENTS.md`. Fix each remaining hit outside `docs/agents/issues/`, `docs/agents/plans/` and `docs/agents/specs/`. User-facing docs (README, `docs/guides/`) are out of scope; sub-issue 7 handles them.

## Files to Change
- `docs/agents/client-node.md` — replace the old `client-` release flow with the new one, or a link to `release.md`.
- `docs/agents/logger.md` — update the Release flow section to the new jobs and tags.
- `docs/agents/worker.md` — fix release-job wording if it is stale.
- `AGENTS.md` — fix stale descriptions.
