# Issue: Remove the release-cycle spec once the overhaul is implemented

## Description
Final sub-issue of the release-cycle overhaul epic (#977). After every implementation sub-issue of #977 is merged, the release spec has served its purpose. Specs are kept only while their work is in development (see `docs/agents/specs.md`), so this one gets removed. Its lasting knowledge moves into a permanent agent doc first.

## Problem
- `docs/agents/specs/release.md` and `docs/agents/specs/release/*.md` will describe behavior that has already shipped.
- Leaving them in place breaks the specs-hub convention and keeps two sources of truth.
- Some of the spec's knowledge (the tag rules, per-package detection, dependency order, `release.yml`, the cascade-bump test) is lasting. It must live on in permanent agent docs.
- Agent docs may still describe the old pipeline after the implementation sub-issues land:
  - `release-token.md` still names the old jobs and the `worker-X.Y.Z` / `deku-sprout-X.Y.Z` tags.
  - Other docs still mention the `client-` tags.

## Expected Behavior
- A new permanent agent doc, `docs/agents/release.md`, describes the release cycle as implemented:
  - Releases are triggered only by `X.Y.Z` tags, which carry the `navi-hey` version.
  - The other tags (`sprout-`, `swarm-`, `node_client-`) exist for history only.
  - Each package and image is released when its version is not yet published.
  - Jobs run in dependency order from `release.yml`, and `release.yml` is validated against each `package.json`.
  - The cascade-bump test runs on PRs and on `X.Y.Z` tags.
  - The doc is owned by the architect and linked from `AGENTS.md`.
- `docs/agents/release-token.md` stays focused on `GITHUB_TOKEN`, but matches the new jobs and tag prefixes.
- `docs/agents/*.md` and `AGENTS.md` no longer describe the old pipeline. That means no `client-` tag triggers, no old `check-and-publish-*` jobs and no old tag prefixes presented as current. User-facing docs are out of scope; implementation sub-issue 7 handles them.
- `docs/agents/specs/release.md` and the `docs/agents/specs/release/` folder are deleted.
- The Release row is removed from the table in `docs/agents/specs.md`. The hub itself stays, and so does the Crawler row.
- No doc outside `docs/agents/issues/` and `docs/agents/plans/` links to the removed files. Those two folders are historical and are left untouched.

## Solution
1. Write `docs/agents/release.md` from the spec's lasting content (overview, tags, packages and `release.yml`, detection, CI flow), checked against the real `.circleci/config.yml` and `scripts/`. Do not copy the spec's decisions, gaps or implementation breakdown. Link the new doc from `AGENTS.md`.
2. Check `docs/agents/release-token.md` against the implemented jobs and tags, and fix anything left over.
3. Sweep `docs/agents/*.md` (including `logger.md`, `worker.md`, `client-node.md`) and `AGENTS.md` for old-pipeline references, and update them or point them to `release.md`.
4. Delete `docs/agents/specs/release.md` and `docs/agents/specs/release/`, and remove the Release row from `docs/agents/specs.md` in the same change.
5. Grep for `specs/release` and fix any link left outside `docs/agents/issues/` and `docs/agents/plans/`.

### Ownership
- architect (agent docs, root `AGENTS.md`).

### Dependencies
- This is the last sub-issue of #977. It stays blocked until implementation sub-issues 1 to 7 (listed in `docs/agents/specs/release/implementation.md`) are merged.
