# Bump versions

This is new public API in deku-swarm, so it takes a minor bump. The app depends on it via `file:../deku-swarm`, so `scripts/ci.sh cascade-bump-check` requires a matching app patch bump. Use `scripts/bump_version.sh` if it fits; otherwise edit the files directly, including lockfiles if they record the version.

- `deku-swarm` 1.15.0 → 1.16.0
- app (`source/`) 1.14.4 → 1.14.5

## Files to Change
- `deku-swarm/package.json`: version 1.16.0.
- `source/package.json` (and lockfile entries for `deku-swarm`, if versioned): version 1.14.5.
