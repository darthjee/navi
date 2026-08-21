# Add worker to bump_version.sh and tag-check scripts

Add a `worker` target to `scripts/bump_version.sh`, mirroring the existing `client` target, and a new `scripts/check_worker_tag_version.sh`, mirroring `scripts/check_client_tag_version.sh` exactly (same `CIRCLE_TAG` prefix convention, same bold-markdown README badge format — **not** the plain-text `Worker Current Version:` format the original issue draft used; match `**Client Current Version:**`'s exact bold syntax).

`scripts/bump_version.sh` additions:

```bash
WORKER_PACKAGE_JSON="$ROOT_DIR/worker/package.json"

# package_json_for():
worker) echo "$WORKER_PACKAGE_JSON" ;;

# usage validation: extend the [app|client] regex to [app|client|worker]

bump_worker() {
  sed -i '' "s|\"version\": \".*\"|\"version\": \"$VERSION\"|" "$WORKER_PACKAGE_JSON"
  if grep -q '\*\*Worker Current Version:\*\*' "$README"; then
    sed -i '' \
      "s|\*\*Worker Current Version:\*\* \[.*\](https://github.com/darthjee/navi/releases/tag/worker-.*)|**Worker Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/worker-$VERSION)|" \
      "$README"
  else
    sed -i '' "/\*\*Client Next Version:\*\*/a\\
\\
**Worker Current Version:** [$VERSION](https://github.com/darthjee/navi/releases/tag/worker-$VERSION)" \
      "$README"
  fi
  if grep -q '\*\*Worker Next Version:\*\*' "$README"; then
    sed -i '' \
      "s|\*\*Worker Next Version:\*\* \[.*\](https://github.com/darthjee/navi/compare/worker-.*)|**Worker Next Version:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/worker-$VERSION...main)|" \
      "$README"
  else
    sed -i '' "/\*\*Worker Current Version:\*\*/a\\
\\
**Worker Next Version:** [$NEXT_VERSION](https://github.com/darthjee/navi/compare/worker-$VERSION...main)" \
      "$README"
  fi
}

# dispatch:
worker) bump_worker ;;
```

`scripts/check_worker_tag_version.sh` (new file, copy `scripts/check_client_tag_version.sh` and adjust):

```bash
#!/bin/bash
set -e

WORKER_VERSION="${CIRCLE_TAG#worker-}"
PACKAGE_VERSION=$(node -p "require('./worker/package.json').version")
README_VERSION=$(grep -oP '(?<=\*\*Worker Current Version:\*\* \[)[\d.]+' README.md)

FAILED=0

if [ "$WORKER_VERSION" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match worker/package.json version ($PACKAGE_VERSION)"
  FAILED=1
fi

if [ "$WORKER_VERSION" != "$README_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match README.md version ($README_VERSION)"
  FAILED=1
fi

if [ "$FAILED" = "1" ]; then
  exit 1
fi

echo "All versions match: $CIRCLE_TAG"
```

## Files to Change

- `scripts/bump_version.sh` — add `WORKER_PACKAGE_JSON`, the `worker` case in `package_json_for()`, `bump_worker()`, the dispatch case, and extend the usage/validation regex to accept `worker`.
- `scripts/check_worker_tag_version.sh` — new file, as shown above (`chmod +x`).

## Notes

- The README badge insertion anchor (`**Client Next Version:**`) assumes the client badges already exist above where the worker ones get inserted — verify against the current `README.md` layout at implementation time rather than assuming the exact surrounding lines.
