# Released guard script

Add the guard every follower job runs first.

**`scripts/ci/image-released.sh <image>`**
- Reads `released/<image with / replaced by ->`.
- Exits `0` when the file holds `true`.
- Exits `1` when it holds `false`, printing `<image> was not released — nothing to do`.
- Exits `2` with an error when the file is missing, meaning the workspace was not attached. This must fail the job rather than silently skip it.

Followers call it as:

```bash
set +e
scripts/ci.sh image-released darthjee/navi-hey
status=$?
set -e
if [ "$status" = "1" ]; then circleci-agent step halt; exit 0; fi
[ "$status" = "0" ]
```

To avoid repeating that block, define it once as a CircleCI `command` in step 3 (`skip-unless-released`, parameter `image`).

Add `image-released) bash "$DIR/ci/image-released.sh" "$@" ;;` to `scripts/ci.sh`.

## Files to Change
- `scripts/ci/image-released.sh` — new: reads the workspace flag.
- `scripts/ci.sh` — add the `image-released` action.
