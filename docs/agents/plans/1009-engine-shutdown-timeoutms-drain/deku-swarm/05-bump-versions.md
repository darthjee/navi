# Bump versions
This is an additive public API, so it gets a minor bump. Never edit versions by hand.
- `scripts/bump_version.sh deku-swarm 1.13.0`: updates `deku-swarm/package.json`, its README Versions-table row and its badges.
- The cascade-bump test requires a `navi-hey` bump whenever `deku-swarm` bumps (`docs/agents/release.md`), so also run `scripts/bump_version.sh app` (patch, 1.14.1 → 1.14.2).
- Confirm locally with `scripts/ci.sh cascade-bump-check`.

## Files to Change
- `deku-swarm/package.json`, plus the README Versions table and badges touched by the script.
- `source/package.json`, plus the app rows, badges and `dockerfiles/demo_navi_hey/Dockerfile` touched by the script.
