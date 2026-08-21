# Extract npm-publish-worker version check

The `npm-publish-worker` job currently runs its "already published?" check inline:

```yaml
command: |
  VERSION=$(node -p "require('./worker/package.json').version")
  if npm view deku-swarm@$VERSION version 2>/dev/null; then
    echo "deku-swarm@$VERSION already exists on npm — skipping publish"
    circleci-agent step halt
  fi
```

Move this into `scripts/ci/check-npm-version.sh`, taking the package name and the path to its `package.json` as args (`$1`, `$2`) so the script isn't hardcoded to `worker/` only:

```bash
#!/bin/bash
set -e

PACKAGE_NAME=$1
PACKAGE_JSON=$2

VERSION=$(node -p "require('$PACKAGE_JSON').version")
if npm view "$PACKAGE_NAME@$VERSION" version 2>/dev/null; then
  echo "$PACKAGE_NAME@$VERSION already exists on npm — skipping publish"
  circleci-agent step halt
fi
```

This still depends on `circleci-agent`, same as today — it only runs as a CircleCI step, not standalone.

Add the `check-npm-version` case to `scripts/ci.sh`:

```bash
check-npm-version) bash "$DIR/ci/check-npm-version.sh" "$@" ;;
```

Update the job's `run:` step in `.circleci/config.yml`:

```yaml
- run:
    name: Check if version already exists on npm
    command: scripts/ci.sh check-npm-version deku-swarm ./worker/package.json
```

## Files to Change

- `scripts/ci/check-npm-version.sh` — new script, `set -e`, positional `$1` (npm package name) / `$2` (path to `package.json`)
- `scripts/ci.sh` — add `check-npm-version` case
- `.circleci/config.yml` — `npm-publish-worker` job's version-check `run:` step now calls `scripts/ci.sh check-npm-version deku-swarm ./worker/package.json`
