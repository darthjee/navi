# Version bump

Bump the navi app patch version with `scripts/bump_version.sh` (target `app`, auto-increment). Never edit versions by hand. No `deku-swarm`, `deku-sprout` or client bump — `deku-swarm/` is untouched. If the script refuses because a package is stale on `main`, stop and report it rather than passing `--force`.

Run `scripts/ci.sh cascade-bump-check` afterwards.

## Files to Change
- `source/package.json` — patch bump (via script).
- `README.md`, `source/README.md`, `dockerfiles/demo_navi_hey/Dockerfile` — versions table / badges / `FROM` line (via script).
