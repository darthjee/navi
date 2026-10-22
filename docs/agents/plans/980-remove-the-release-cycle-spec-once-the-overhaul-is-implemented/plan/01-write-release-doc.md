# Write docs/agents/release.md
Create a permanent, architect-owned agent doc describing the release cycle *as implemented*. Base it on the spec's lasting topics, each checked against the real CI config and scripts:

- `overview.md`
- `tags.md`
- `packages.md`
- `detection.md`
- `ci-flow.md`
- the relevant part of `examples.md`

It should cover:

- **Releases:** only `X.Y.Z` tags trigger a release. `X.Y.Z` is the `navi-hey` version.
- **History-only tags:** `sprout-`, `swarm-` and `node_client-` start no pipeline. Neither do the legacy `worker-`, `deku-sprout-` and `client-` tags.
- **PRs and branches:** they run tests only.
- **Packages:**
  - `navi-hey`, `deku-sprout`, `deku-swarm` and `navi-hey-client`, with the Docker images built from them.
  - Their dependencies.
  - The root `release.yml` dependency tree and its validator.
- **Detection:** a package or image is released when its version is not yet published on npm or Docker Hub. Otherwise its job no-ops. Every job always runs, in dependency order.
- **Extra jobs:** `update-description`, the demo deploys and `navi-hey-test` follow their image.
- **Cascade-bump test:** what it checks, and that it runs on PRs and on `X.Y.Z` tags.
- **How to cut a release:** a worked example, with `bump_version.sh` usage.

Leave out the spec's `decisions.md`, `gaps.md` and `implementation.md`. Link `release-token.md` for the credential. Add a row to the `AGENTS.md` documentation table.

## Files to Change
- `docs/agents/release.md` — new permanent release-cycle doc.
- `AGENTS.md` — add a `[Release Cycle](docs/agents/release.md)` row to the documentation table, and update the Release Token row's description (old tag prefixes).
