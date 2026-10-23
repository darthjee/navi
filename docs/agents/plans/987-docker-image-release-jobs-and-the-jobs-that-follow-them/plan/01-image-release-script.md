# Docker Hub tag check and image release script

Add the scripts that decide whether an image needs releasing and do the release, wired through `scripts/ci.sh`.

1. **`scripts/ci/docker-hub-tag-exists.sh <image> <tag>`**
   - Runs `curl -s -o /dev/null -w '%{http_code}' "https://hub.docker.com/v2/repositories/<image>/tags/<tag>"`.
   - Exits `0` on 200 (exists) and `1` on 404 (missing).
   - Exits `2` with an error on stderr for any other status or a curl failure.
   - Usage errors (missing args) exit `2`.
2. **`scripts/ci/release-docker-image.sh <image> <folder> <make target>`**
   - Reads `VERSION` with `node -p "require('./<folder>/package.json').version"`, run from the repo root.
   - Calls `docker-hub-tag-exists.sh <image> $VERSION`:
     - exists: print `<image>:<VERSION> already on Docker Hub — skipping` and set `RELEASED=false`;
     - missing: run `make <make target> TAG=$VERSION` and set `RELEASED=true`;
     - error (exit 2): fail.
   - Writes `RELEASED` into `released/<image with / replaced by ->`, creating `released/` under the repo root.
   - Supports `DRY_RUN=1` like `release-npm-package.sh`: it prints `would release <image>:<VERSION>` instead of running `make`, and still writes `true`.
   - Header comment in the same style as `release-npm-package.sh` (usage, flow, env).
3. **`scripts/ci.sh`**: add `release-docker) bash "$DIR/ci/release-docker-image.sh" "$@" ;;` and `docker-hub-tag-exists) ...`.

## Files to Change
- `scripts/ci/docker-hub-tag-exists.sh` — new: Docker Hub API tag-exists check.
- `scripts/ci/release-docker-image.sh` — new: version lookup, check, `make` release, workspace file.
- `scripts/ci.sh` — add the `release-docker` and `docker-hub-tag-exists` actions.
