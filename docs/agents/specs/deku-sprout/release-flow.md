# Release Flow

`deku-sprout` gets the equivalent of everything `deku-swarm` has today.

## What exists for `worker/`

| Piece | Where |
|---|---|
| Spec and lint jobs | CircleCI `jasmine-worker` and `checks-worker`, both required by the pipeline's gating jobs. |
| Auto-publish job | CircleCI `check-and-publish-worker`, running `scripts/ci.sh check-and-publish-worker` (`scripts/ci/check-and-publish-worker.sh`). It publishes when `worker/` changed since the last release tag, or when the `force_worker_build` pipeline parameter is set. Publish and tag push are independently idempotent. |
| Version bump | `scripts/bump_version.sh` with the `worker` target, which also rewrites the "Worker Current/Next Version" lines of `README.md`. |
| Tags | `worker-X.Y.Z`. |

## What `deku-sprout` gets

- Its own version, in `logger/package.json`.
- `jasmine-logger` and `checks-logger` jobs, and a `check-and-publish-logger` job that publishes automatically when `logger/` changes since the last release tag.
- Its own force parameter, `force_deku_sprout_build`, and a publish script mirroring `scripts/ci/check-and-publish-worker.sh`.
- A `logger` target in `scripts/bump_version.sh`, with the matching "Current/Next Version" lines in `README.md`.
- Release tags `logger-X.Y.Z` (named after the folder, like `worker-X.Y.Z`).

## Version coordination

A change to `deku-sprout` does **not** force a release of `navi-hey` or `navi-hey-client`: each of them bumps only when it chooses to adopt a new version of the package.

The first release of `deku-sprout` must be published to npm **before** the client links to it. `navi-hey-client` consumers install from the registry, where a `file:` dependency cannot resolve.
