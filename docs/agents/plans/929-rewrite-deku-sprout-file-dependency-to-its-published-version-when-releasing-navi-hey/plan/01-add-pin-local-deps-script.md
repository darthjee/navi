# Add the pin-local-deps CI script

Create `scripts/ci/pin-local-deps.sh` (`#!/bin/bash`, `set -e`, same style as the other `scripts/ci/*.sh`). It runs from the repo root and:

1. Reads `WORKER_VERSION` from `worker/package.json` and `DEKU_SPROUT_VERSION` from `logger/package.json`, both with `node -p "require('./<pkg>/package.json').version"`.
2. Rewrites `"deku-swarm": "file:[^"]*"` to `"deku-swarm": "$WORKER_VERSION"` in `source/package.json`, reusing the existing `sed -i` expression from `build-frontend.sh`.
3. Rewrites `"deku-sprout": "file:[^"]*"` to `"deku-sprout": "$DEKU_SPROUT_VERSION"` the same way. Both pins are exact versions, with no `^` or `~`.
4. Echoes each pinned version, for example `Pinned deku-swarm to 1.9.0`.
5. Guard: if `grep -q '"file:' source/package.json` still matches, prints the offending lines to stderr with an error that names `source/package.json`, then runs `exit 1`.

Register the action in `scripts/ci.sh`: `pin-local-deps) bash "$DIR/ci/pin-local-deps.sh" "$@" ;;`.

Local verification: in a throwaway clone or Linux container, run `scripts/ci.sh pin-local-deps` and confirm `source/package.json` shows `"deku-sprout": "0.1.0"` and `"deku-swarm": "<worker version>"`. Then add a fake `"x": "file:../x"` entry and confirm the script exits non-zero.

## Files to Change
- `scripts/ci/pin-local-deps.sh` — new script: pin both local deps to exact versions, then guard against leftover `file:` deps.
- `scripts/ci.sh` — register the `pin-local-deps` action.
