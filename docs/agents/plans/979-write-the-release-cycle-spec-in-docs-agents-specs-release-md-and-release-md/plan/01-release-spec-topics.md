# Write the release spec hub and topic files

Create the hub and the descriptive topic files from the issue's "Decisions" section.

- **`release.md` (hub)**: an intro paragraph on the overhaul and epic #977, then a `| Topic | Description |` table linking every topic file (including the step 02 files).
- **`release/overview.md`**:
  - The current tag families and CI chains, as described in the issue's Problem section.
  - The target in brief.
  - The objectives:
    - a single release trigger;
    - per-package releases;
    - enforced cascade bumps.
- **`release/tags.md`**:
  - Only `X.Y.Z` triggers CI, and it equals the `navi-hey` version in `source/package.json`.
  - Every other tag triggers nothing, not even tests.
  - PR branches run tests only.
  - Tests on `X.Y.Z` gate every release job.
  - The new extra tags `sprout-<v>`, `swarm-<v>` and `node_client-<v>` are pushed by a separate job after a release. The old `deku-sprout-`, `worker-` and `client-` tags remain as history.
  - A release that only changes another package still requires a `navi-hey` bump.
- **`release/packages.md`**:
  - The package and release table: package, folder, platform, dependencies, extra tag.
    - `deku-sprout`: `logger/`, npm, no dependencies, `sprout-`.
    - `deku-swarm`: `worker/`, npm, no dependencies, `swarm-`.
    - `navi-hey`: `source/`, npm, depends on sprout and swarm, no extra tag.
    - `darthjee/navi-hey`: Docker, depends on `navi-hey`.
    - `navi-hey-client`: `clients/node/`, npm, depends on sprout, `node_client-`.
    - `darthjee/navi-hey-client`: Docker, depends on `navi-hey-client`.
  - Note that dependencies come from each `package.json`, and that the #977 table differs (it lists swarm depending on sprout, and the `hey-navi` names).
  - The `release.yml` (repo root) format: an illustrative YAML example with folder, platform, `depends_on` and `tag_prefix` per package. Scripts read it, and its `depends_on` is validated against each `package.json`.
- **`release/detection.md`**:
  - A package releases when its version is not yet published on its platform (npm via `npm view`, Docker Hub for images), generalizing `scripts/ci/check-and-publish-package.sh`. Otherwise its job no-ops.
  - The cascade-bump test runs on PRs and on `X.Y.Z` tags. A version bump of a package requires bumps of all its dependents, with the sprout and swarm examples. Mention `scripts/lib/package_bump_check.sh` as related precedent.
- **`release/ci-flow.md`**:
  - The job graph, as a mermaid or ASCII diagram. Every release job always runs and waits for its dependencies' jobs, whether those released or no-oped.
  - The extra jobs follow their image: `update-description`, the demo and demo-app deploys and `navi-hey-test` act only when `darthjee/navi-hey` released; `update-description-client` only when `darthjee/navi-hey-client` did.
- **`release/examples.md`**: the `1.15.1` from `1.15.0` example from #977, corrected so that `navi-hey-client` waits only for `deku-sprout`. Add a second example where only `logger/` changed (a sprout bump cascades to `navi-hey` and `navi-hey-client`).

## Files to Change
- `docs/agents/specs/release.md`: new hub.
- `docs/agents/specs/release/overview.md`: new.
- `docs/agents/specs/release/tags.md`: new.
- `docs/agents/specs/release/packages.md`: new.
- `docs/agents/specs/release/detection.md`: new.
- `docs/agents/specs/release/ci-flow.md`: new.
- `docs/agents/specs/release/examples.md`: new.
