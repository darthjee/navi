# Bump versions

New public API → minor bump of deku-swarm (1.13.0 → 1.14.0) and, per the cascade-bump rule in `docs/agents/release.md`, a patch bump of the app (1.14.2 → 1.14.3):

```bash
scripts/bump_version.sh deku-swarm 1.14.0
scripts/bump_version.sh app
scripts/ci.sh cascade-bump-check
```

Use the script output to confirm every touched manifest/lockfile; commit them all.

## Files to Change
- `deku-swarm/package.json`, `deku-swarm/package-lock.json` — version 1.14.0.
- `source/package.json`, `source/package-lock.json` and any other files the bump script updates — app patch bump and the deku-swarm dependency.
