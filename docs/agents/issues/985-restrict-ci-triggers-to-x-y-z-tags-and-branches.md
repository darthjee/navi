# Issue: Restrict CI triggers to `X.Y.Z` tags and branches

## Description

Part of Epic #977 (release-cycle overhaul). CI should run only on branches and on `X.Y.Z` tags. Every other tag triggers nothing.

## Problem

Today `client-X.Y.Z` tags run their own release pipeline, and the test jobs need an explicit ignore for `worker-…` / `deku-sprout-…` tags. Under the new cycle only `X.Y.Z` tags release anything, and every other tag is kept only as history.

## Expected Behavior

- PR branches run only the tests (and the cascade-bump test), never release jobs.
- `X.Y.Z` tags run the tests and the tag/version check, and these gate every release job.
- Any other tag triggers nothing, not even tests. That covers `client-…`, `worker-…` and `deku-sprout-…`, plus the new `sprout-…`, `swarm-…` and `node_client-…`.
- The `client-` pipeline is gone from the workflow:
  - `check-client-version-tag` and `npm-publish-client` are deleted as job definitions, along with `scripts/check_client_tag_version.sh`.
  - `build-and-release-client` and `update-description-client` are removed from the workflow, but their job definitions stay, unwired, for #987 to reuse.
- Until #986/#987 land, `navi-hey-client` cannot be released. This gap is accepted.

## Solution

- In `.circleci/config.yml`:
  - Replace the `all-tags` filter (`only: /.*/` + `ignore: /^(deku-sprout|worker)-.*/`) with a filter that runs on all branches and only on `X.Y.Z` tags (`/^\d+\.\d+\.\d+$/`).
  - Keep the release-only filter (`X.Y.Z` tags, no branches).
  - Drop the `client-tag-filters` anchor and every workflow entry that uses it.
- `X.Y.Z` must still match `source/package.json`'s `version`. `scripts/check_tag_version.sh` keeps checking this, unchanged.
- The README "Client Current Version" check goes away with `check_client_tag_version.sh`. Where a README version check should live stays an open gap (`docs/agents/specs/release/gaps.md`) for #986.
- Rewrite the release paragraph in `docs/agents/client-node.md` to match the new triggers. Leave `specs/release/overview.md` (it documents the old flow on purpose) and the user-facing docs (#989) alone.
- See `docs/agents/specs/release/tags.md` and `ci-flow.md`.

## Ownership

architect (`.circleci/config.yml`, `scripts/`, `docs/agents/`).

## Dependencies

None.
