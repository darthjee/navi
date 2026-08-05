# Issue: Add release of client

## Description
`clients/node/` (the `navi-hey-client` npm package) has no release flow. `docs/agents/client-node.md` already flags this: "Publishing/tagging `navi-hey-client` to npm is out of scope for now — there is no `npm-publish-client` job yet... A future issue will need to define a tagging scheme (e.g. a `client-X.Y.Z` prefix) and a corresponding publish job before the package can be released." This issue closes that gap.

## Problem
The app (`source/`) already has a full CircleCI release flow: `check-version-tag` validates that a pushed `X.Y.Z` tag matches `source/package.json`'s version and README's `**Current Version:**` line, then `npm-publish` publishes to npm, gated on that check plus the full test/lint suite. The client has no equivalent — `clients/node/package.json`'s version can drift arbitrarily far from what's actually published (or from whether anything has ever been published at all), with no CI safety net and no automated path to cut a release.

## Expected Behavior
Pushing a `client-X.Y.Z` tag triggers a CI-driven release of `navi-hey-client` to npm, but only after confirming the tag's version genuinely matches what's in `clients/node/package.json` (and README's `**Client Current Version:**` line) — mirroring the safety the app's release flow already has. This is a release cadence fully independent of the app's: a `client-X.Y.Z` tag never touches `source`'s npm-publish flow, and a plain `X.Y.Z` app tag never touches the client.

## Solution
Mirror the existing app release pattern (`check-version-tag` → `npm-publish`) with a client-scoped equivalent in `.circleci/config.yml`:

- **Trigger scheme**: a dedicated `client-X.Y.Z` tag — matching what README.md's "Client Current Version" link and `scripts/bump_version.sh` (which already has an `app|client` target argument) already assume. New jobs are filtered to tags matching `client-\d+\.\d+\.\d+`, independent of the app's `\d+\.\d+\.\d+` filter.
- **Version check** (`scripts/check_client_tag_version.sh`, new, parallel to `scripts/check_tag_version.sh`): strips the `client-` prefix from `$CIRCLE_TAG` and checks it matches both `clients/node/package.json`'s `version` and README's `**Client Current Version:**` line — the same two-part validation the app's script already does. No "diff against the previous tag" logic is needed: since `client-X.Y.Z` tags are only ever pushed deliberately for a release, a straight tag-equals-package.json check is sufficient to prevent publishing a stale/mismatched build.
- **New job `check-client-version-tag`**: same shape as `check-version-tag`, runs the new script.
- **New job `npm-publish-client`**: same shape as `npm-publish` but scoped to `clients/node` (`yarn install`, then `npm publish --access public` using the existing `NPM_TOKEN`). No frontend build/copy step — that's app-specific.
- **Workflow wiring**: both new jobs filtered to `client-\d+\.\d+\.\d+` tags with branches ignored. `npm-publish-client` requires `[check-client-version-tag, jasmine-client, checks-client]` — only the client's own existing test/lint jobs, not the full app/dev/frontend suite, since the client is an independent package.
- Update `docs/agents/client-node.md` to remove the now-stale "out of scope" note once the flow exists.

## Benefits
- `navi-hey-client` gets an automated, tag-driven release path, consistent with how the rest of the project ships.
- The version-match check prevents an accidental or stale publish (tag pushed without bumping `clients/node/package.json`, or vice versa).
- The client's release cadence stays fully decoupled from the app's, so client-only changes don't require an app version bump (or a tag) to ship, and vice versa.
