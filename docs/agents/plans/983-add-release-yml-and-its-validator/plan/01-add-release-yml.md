# Add `release.yml`
Create the root `release.yml` as the single source of truth for the release tree. Use a top-level `packages:` map keyed by the release name, with these fields:

- `folder`: path relative to the repo root, with no trailing slash;
- `platform`: `npm` or `docker`;
- `depends_on`: a list of release keys, empty for none;
- `tag_prefix`: optional; only the three packages that get an extra GitHub tag have it.

Entries, in dependency order:

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

Add a short header comment saying what reads the file, that a Docker entry's version is the `version` of the `package.json` in its folder, and that `scripts/ci.sh validate-release-yml` checks it.

## Files to Change
- `release.yml` — new file at the repo root.
