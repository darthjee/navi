# Issue: Update user-facing docs for the new release flow

## Description
Part of Epic #977 (release-cycle overhaul). Update the user-facing docs to describe the new release flow and tags.

## Problem
The "Versions" section of `README.md` describes the old flow:
- tagging a navi release publishes only `deku-swarm` and `deku-sprout`;
- it pushes `worker-x.y.z` / `deku-sprout-x.y.z` tags.

It says nothing about `navi-hey-client` or the Docker images. A grep of the other user-facing docs (`docs/guides/**`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`, `logger/README.md`, `worker/` docs) found no mention of release tags or release mechanics.

## Expected Behavior
- The `README.md` "Versions" intro paragraph describes the new flow:
  - only `X.Y.Z` tags trigger a release; other tags are history only;
  - each released artifact publishes when its version isn't on its platform yet: `navi-hey-client`, `deku-swarm` and `deku-sprout` on npm, the Docker images on Docker Hub;
  - after an actual publish, the history tags `node_client-`, `swarm-` and `sprout-` are pushed;
  - the release still fails when a package's published files changed without a version bump (existing wording kept).
- The `bump_version.sh` paragraph stays, updated only where it no longer matches the new flow.
- The per-package version badges/links (`client-0.2.4`, `worker-1.12.0`, `deku-sprout-0.3.0`) are left as they are. The old tags still exist, and `bump_version.sh` (after #988) switches each link to the new prefix on that package's next bump.
- Nothing else in the user-facing docs changes.

## Solution
- Rewrite the README "Versions" intro paragraph(s). Use `release.yml` and `docs/agents/specs/release/*.md` as the source of truth for the artifact list and prefixes.
- Agent docs (`docs/agents/*.md`, `AGENTS.md`) are out of scope: #988 and the cleanup sub-issue #980 handle them.

## Ownership
docs.

## Dependencies
Sub-issues 3 to 6 of #977 (#985–#988).
