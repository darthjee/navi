# Docs Plan: Update user-facing docs for the new release flow

Main plan: [plan.md](plan.md)

## Overview
The only user-facing text describing releases is the two paragraphs under `## Versions` in `README.md` (before `### Navi`). A grep of `docs/guides/**`, `DOCKERHUB_DESCRIPTION.md`, `clients/node/README.md`, `logger/README.md` and `worker/` docs found no release-tag or release-mechanics mentions, so they stay untouched.

## Context
Source of truth: `release.yml` (root) and `docs/agents/specs/release/*.md` (`overview.md`, `tags.md`, `ci-flow.md`, `detection.md`).

`release.yml` artifacts:

| Artifact | Platform | Folder | History tag prefix |
|---|---|---|---|
| `deku-sprout` | npm | `logger` | `sprout-` |
| `deku-swarm` | npm | `worker` | `swarm-` |
| `navi-hey` | npm | `source` | — |
| `darthjee/navi-hey` | Docker Hub | `source` | — |
| `navi-hey-client` | npm | `clients/node` | `node_client-` |
| `darthjee/navi-hey-client` | Docker Hub | `clients/node` | — |

## Implementation Steps

### Step 1 — Rewrite the first "Versions" paragraph
Replace the paragraph starting "Tagging a navi release automatically publishes `deku-swarm` and `deku-sprout`…" with text stating:
- only tags in the `X.Y.Z` format (e.g. `1.14.1`) trigger a release; any other tag (old `client-`, `worker-`, `deku-sprout-` tags and the new history tags) triggers nothing — no release, no tests;
- on an `X.Y.Z` release, each artifact listed above publishes only when the version in its folder's `package.json` isn't on its platform yet (npm or Docker Hub); there is no separate release track per package;
- after an actual npm publish of `deku-sprout`, `deku-swarm` or `navi-hey-client`, the matching history tag `sprout-x.y.z`, `swarm-x.y.z` or `node_client-x.y.z` is pushed (history only; nothing is pushed when the version was already published);
- keep the existing sentence that the release fails when a package's published files (`lib/` or `package.json`) changed since its previous release without a version bump, and that specs/lint/README/`yarn.lock` changes alone don't need one.

Keep it short (a paragraph or a compact bullet list) in the README's existing tone.

### Step 2 — Touch up the `bump_version.sh` paragraph
Keep the paragraph, updating only what no longer matches:
- list all package targets the script accepts: `client`, `worker`, `deku-sprout` (currently only `worker`/`deku-sprout` are mentioned);
- leave the `--force`, `all` and `git fetch --tags` wording as is.

Do **not** change the version badges/links under `### Navi`, `### Client`, `### Worker (Deku Swarm)`, `### Lib (Deku Sprout)`: the old tags still exist, and `bump_version.sh` (after #988) switches each link to its new prefix on the package's next bump.

## Files to Change
- `README.md` — the two intro paragraphs under `## Versions` only.

## Notes
- Agent docs (`docs/agents/**`, `AGENTS.md`) are out of scope (#988 / #980).
- If #988's prefix change to `bump_version.sh` hasn't merged yet when this runs, still describe the new prefixes — the epic lands them together.
