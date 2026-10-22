# Packages

[Back to the release spec](../release.md)

## Package and release table

| Package / release | Folder | Platform | Depends on | Extra tag |
|---|---|---|---|---|
| `deku-sprout` | `logger/` | npm | - | `sprout-<version>` |
| `deku-swarm` | `worker/` | npm | - | `swarm-<version>` |
| `navi-hey` | `source/` | npm | `deku-sprout`, `deku-swarm` | - (the `X.Y.Z` tag) |
| `darthjee/navi-hey` | `source/` | Docker Hub | `navi-hey` | - |
| `navi-hey-client` | `clients/node/` | npm | `deku-sprout` | `node_client-<version>` |
| `darthjee/navi-hey-client` | `clients/node/` | Docker Hub | `navi-hey-client` | - |

Dependencies come from each `package.json`:

- `worker/package.json` (`deku-swarm`) declares no dependencies.
- `source/package.json` (`navi-hey`) depends on `deku-sprout` (`file:../logger`) and `deku-swarm` (`file:../worker`).
- `clients/node/package.json` (`navi-hey-client`) depends on `deku-sprout` only.
- Each Docker image depends on its npm package, and takes its version.

This differs from the table in #977, which uses the typo names `hey-navi` / `darthjee/hey-navi` and lists `deku-swarm` as depending on `deku-sprout`. The table above is the source of truth.

## Dependency tree: `release.yml`

A root `release.yml` describes the tree, so that the release and cascade scripts share one source instead of each hardcoding it. Each entry gives the package's folder, platform, dependencies and extra-tag prefix. The format is now settled in the root `release.yml` (#983), and `scripts/ci.sh validate-release-yml` (package `scripts/release/`) checks it in CI. Current content:

```yaml
packages:
  deku-sprout:
    folder: logger
    platform: npm
    depends_on: []
    tag_prefix: sprout-
  deku-swarm:
    folder: worker
    platform: npm
    depends_on: []
    tag_prefix: swarm-
  navi-hey:
    folder: source
    platform: npm
    depends_on: [deku-sprout, deku-swarm]
  darthjee/navi-hey:
    folder: source
    platform: docker
    depends_on: [navi-hey]
  navi-hey-client:
    folder: clients/node
    platform: npm
    depends_on: [deku-sprout]
    tag_prefix: node_client-
  darthjee/navi-hey-client:
    folder: clients/node
    platform: docker
    depends_on: [navi-hey-client]
```

Rules:

- The release scripts and the cascade-bump test read `release.yml`.
- A validator checks the npm `depends_on` entries against each `package.json`: every listed dependency must be declared there, and every local package declared there must be listed.
- A Docker entry's version is the `version` of the `package.json` in its folder.
