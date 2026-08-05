# Plan: Add release of client

Issue: [624-add-release-of-client.md](../../issues/624-add-release-of-client.md)

## Overview

Add a CircleCI release flow for `navi-hey-client` (`clients/node/`), mirroring the app's existing `check-version-tag` → `npm-publish` pattern but scoped to a dedicated `client-X.Y.Z` tag, fully independent of the app's `X.Y.Z` release cadence.

## Context

`clients/node/` currently has no release flow — `docs/agents/client-node.md` already flagged this as an explicit gap ("A future issue will need to define a tagging scheme... and a corresponding publish job"). The app's release flow (`.circleci/config.yml`) already does this for `source/`: `check-version-tag` validates a pushed `X.Y.Z` tag against `source/package.json`'s version and README's `**Current Version:**` line, then `npm-publish` publishes to npm, gated on that check plus the full app test/lint suite. `scripts/bump_version.sh` already supports an `app|client` target argument and keeps README's `**Client Current Version:**` line in sync for the client, so the version-bumping half of this workflow already exists — only the tag-triggered CI half is missing.

Decided during discussion (see the issue file): use a dedicated `client-X.Y.Z` tag (not the app's `X.Y.Z` tag), and skip any "diff against the previous tag" logic — since `client-X.Y.Z` tags are only ever pushed deliberately for a release, a straight tag-equals-`package.json` check (the same pattern `check_tag_version.sh` already uses) is sufficient.

This entire issue falls within the architect's own cross-cutting scope (`.circleci/config.yml`, `scripts/`, `docs/agents/`) — no specialist agent owns any of the touched files, so there is no agent split.

## Implementation Steps

### Step 1 — Add `scripts/check_client_tag_version.sh`

New script, parallel to the existing `scripts/check_tag_version.sh`. It must:
- Strip the `client-` prefix from `$CIRCLE_TAG` to get the bare `X.Y.Z`.
- Read `clients/node/package.json`'s `version` (e.g. via `node -p "require('./clients/node/package.json').version"`, matching how `check_tag_version.sh` reads `source/package.json`).
- Read README.md's `**Client Current Version:**` line version (same `grep -oP` pattern `check_tag_version.sh` uses for `**Current Version:**`, adapted to the `Client Current Version` label).
- Fail (`exit 1`) with a clear `ERROR:` message, same style as `check_tag_version.sh`, if either doesn't match the stripped tag; otherwise print a success line and exit 0.

### Step 2 — Wire the two new CircleCI jobs

In `.circleci/config.yml`:

- **New job `check-client-version-tag`** — same shape as `check-version-tag` (`darthjee/circleci_node:0.2.1` image, `checkout`, then a `run` step invoking `bash scripts/check_client_tag_version.sh`).
- **New job `npm-publish-client`** — same shape as `npm-publish` but scoped to `clients/node`: `checkout`, `cd clients/node; yarn install --frozen-lockfile`, then publish using the existing `NPM_TOKEN` (`echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc; cd clients/node; npm publish --access public`). No frontend build/copy step (that's app-specific, not needed for the client package).
- **Workflow wiring** (`workflows.test-and-release.jobs`): add both jobs, each filtered to tags matching `client-\d+\.\d+\.\d+` with `branches: ignore: /.*/` (same filter shape the app's release jobs use, just a different tag pattern so the two release cadences never trigger each other). `npm-publish-client` requires `[check-client-version-tag, jasmine-client, checks-client]` — reusing the client's existing test/lint jobs already in the workflow, not the app/dev/frontend suite.

### Step 3 — Update `docs/agents/client-node.md`

Remove the stale note: *"Publishing/tagging `navi-hey-client` to npm is out of scope for now — there is no `npm-publish-client` job yet... A future issue will need to define a tagging scheme..."*. Replace it with a short description of the new flow: pushing a `client-X.Y.Z` tag runs `check-client-version-tag` then `npm-publish-client`, matching how the existing "Both are wired into the `test-and-release` workflow..." sentence already describes `jasmine-client`/`checks-client`.

## Files to Change

- `scripts/check_client_tag_version.sh` — new script; validates a `client-X.Y.Z` tag against `clients/node/package.json` and README's Client Current Version line.
- `.circleci/config.yml` — add `check-client-version-tag` and `npm-publish-client` jobs, plus their workflow entries with `client-\d+\.\d+\.\d+` tag filters.
- `docs/agents/client-node.md` — remove the "out of scope"/"future issue" note; document the new release flow and jobs.

## CI Checks

- root: `bash scripts/check_client_tag_version.sh` (CI job: `check-client-version-tag`) — sanity-check locally by exporting `CIRCLE_TAG=client-<version matching clients/node/package.json>` before running.
- `clients/node`: `yarn install --frozen-lockfile && npm publish --dry-run --access public` (CI job: `npm-publish-client`) — `--dry-run` avoids an actual publish when verifying locally.
- `clients/node`: existing `jasmine-client`/`checks-client` jobs (`npm run coverage`, `npm run lint`, `npm run report`) are unaffected by this change but gate `npm-publish-client` via `requires`.

## Notes

- No "diff against the previous tag" logic is implemented — deliberately decided against during discussion (see issue). If that ever changes, `check_client_tag_version.sh` is the file to extend.
- The `NPM_TOKEN` CircleCI env var already exists (used by `npm-publish`) and is reused as-is for `npm-publish-client` — same npm account, no new secret needed.
- Cutting an actual first client release (running `scripts/bump_version.sh client <version>`, committing, tagging `client-<version>`, and pushing) is a maintainer action outside this issue's scope — this issue only builds the CI flow.
