# Decisions

[Back to the release spec](../release.md)

| # | Decision | Rationale |
|---|---------|-----------|
| 1 | Use the **real names**: `deku-sprout`, `deku-swarm`, `navi-hey`, `darthjee/navi-hey`, `navi-hey-client`, `darthjee/navi-hey-client` | The `hey-navi` names in #977 are a typo |
| 2 | **Dependencies come from each `package.json`**: `deku-swarm` has none, `navi-hey` depends on `deku-sprout` and `deku-swarm`, `navi-hey-client` on `deku-sprout` only, each image on its npm package | The manifests are what actually gets installed; #977's table (swarm on sprout) does not match `worker/package.json` |
| 3 | **`X.Y.Z` is the `navi-hey` version** and must match `source/package.json` | Keeps the existing `check-version-tag` contract; one tag family for every release |
| 4 | **Other tags trigger nothing**, not even tests; PR branches run tests only | A single release trigger; history tags should not cost CI time |
| 5 | **Tests run on the `X.Y.Z` tag and gate every release job** | Nothing is published from an untested commit |
| 6 | New extra tag prefixes **`sprout-`, `swarm-`, `node_client-`**, pushed by a separate job after a release; old `deku-sprout-`, `worker-`, `client-` tags remain as history | Keeps a per-package release history on GitHub; `swarm-<logger version>` in #977 is a typo for the worker version |
| 7 | A package releases when its **version is not yet published** on its platform (npm, Docker Hub) | Generalizes `scripts/ci/check-and-publish-package.sh`; idempotent, so a re-run never double-publishes |
| 8 | **Every release job always runs, in dependency order**, no-oping when nothing is new | A fixed job graph is simple to reason about, and dependents never start before their dependencies are published |
| 9 | **Extra jobs follow their image**: description, demo, demo-app and navi-hey-test act only when `darthjee/navi-hey` released; `update-description-client` only when `darthjee/navi-hey-client` released | They only make sense for a newly published image |
| 10 | A root **`release.yml`** lists each package's folder, platform, `depends_on` and tag prefix, validated against each `package.json` | Many scripts need the tree; one shared source avoids drift |
| 11 | A **cascade-bump test** runs on PRs and `X.Y.Z` tags: bumping a package requires bumping every dependent | A dependency fix always reaches its consumers in the same release |
