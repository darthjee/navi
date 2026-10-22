# Feature: Release-Cycle Overhaul

This spec describes the release-cycle overhaul tracked by epic #977. Today several tag families (`X.Y.Z`, `client-X.Y.Z`, `worker-X.Y.Z`, `deku-sprout-X.Y.Z`) each drive their own CI chain. The target is a single trigger: only an `X.Y.Z` tag releases anything, and on that tag every package (`deku-sprout`, `deku-swarm`, `navi-hey`, `darthjee/navi-hey`, `navi-hey-client`, `darthjee/navi-hey-client`) releases itself only when its version is not yet published. A cascade-bump test keeps dependents' versions in step with their dependencies. The work is not implemented yet; see [Implementation](release/implementation.md) for the sub-issues that will deliver it.

| Topic | Description |
|---|---|
| [Overview](release/overview.md) | The current tag families and CI chains, the target in brief, and the objectives. |
| [Tags](release/tags.md) | Which tags trigger CI, the extra tags pushed after a release, and the old tags kept as history. |
| [Packages](release/packages.md) | The package/release table (folder, platform, dependencies, extra tag) and the root `release.yml` dependency tree. |
| [Detection](release/detection.md) | Per-package release detection (unpublished version) and the cascade-bump test. |
| [CI Flow](release/ci-flow.md) | The release job graph: always-run jobs in dependency order, no-op jobs, and the extra jobs following their image. |
| [Examples](release/examples.md) | Worked releases: `1.15.1` from `1.15.0`, and a logger-only release. |
| [Decisions](release/decisions.md) | Design decisions and their rationale. |
| [Gaps](release/gaps.md) | Open questions left for the implementation sub-issues. |
| [Implementation](release/implementation.md) | The ordered list of implementation sub-issues to create under #977. |
