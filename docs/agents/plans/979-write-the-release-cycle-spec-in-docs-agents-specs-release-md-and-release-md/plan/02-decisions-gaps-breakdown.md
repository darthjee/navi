# Write decisions, gaps and the implementation breakdown

- **`release/decisions.md`**: a numbered `| # | Decision | Rationale |` table, one row per decision in the issue:
  - real names;
  - dependencies taken from `package.json`;
  - `X.Y.Z` equals the `navi-hey` version;
  - other tags trigger nothing;
  - tests gate releases on `X.Y.Z`;
  - the new tag prefixes;
  - detection by unpublished version;
  - always-run, no-op jobs in dependency order;
  - extra jobs follow their image;
  - a root `release.yml`;
  - the cascade-bump test on PRs and tags.
- **`release/gaps.md`**: open questions found while writing. For example:
  - how Docker Hub "already published" is checked;
  - whether `deku-swarm` should declare `deku-sprout`;
  - README version checks for packages other than `navi-hey`;
  - how no-op jobs pass "released or not" downstream (CircleCI workspace or an output file);
  - the `GITHUB_TOKEN` needed by the tag-push job.
- **`release/implementation.md`**: the ordered list of implementation sub-issues to create under #977. Each gets a title, a scope line, an owner and dependencies. For example:
  - add `release.yml` and a validator;
  - the cascade-bump test in CI;
  - restrict CI triggers to `X.Y.Z` and branches, removing the `client-` pipeline;
  - generalize per-package release jobs (npm);
  - Docker image release jobs, plus the extra jobs following their image;
  - the separate tag-push job with the new prefixes;
  - the user-facing docs update (docs agent).

  End with a note that #980 (cleanup) comes last.

## Files to Change
- `docs/agents/specs/release/decisions.md`: new.
- `docs/agents/specs/release/gaps.md`: new.
- `docs/agents/specs/release/implementation.md`: new.
