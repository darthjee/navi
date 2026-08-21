# Extract check-worker-changes job

The `check-worker-changes` job currently runs its `git describe`/`git diff` logic inline:

```yaml
command: |
  LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
  if [ -z "$LAST_TAG" ]; then
    echo "No previous release tag found — worker release recommended"
    exit 0
  fi
  if git diff --quiet "$LAST_TAG"..HEAD -- worker/; then
    echo "No changes in worker/ since $LAST_TAG — skipping"
    exit 0
  else
    echo "WARNING: worker/ has changes since $LAST_TAG"
    echo "A worker release (worker-x.y.z tag) should be created before or alongside this navi release"
    echo "Run: scripts/bump_version.sh worker [version]"
    exit 0
  fi
```

Move this verbatim into `scripts/ci/check-worker-changes.sh` (no positional args needed — it always operates on the checked-out repo):

```bash
#!/bin/bash
set -e

LAST_TAG=$(git describe --tags --abbrev=0 --match='worker-*' --match='[0-9]*.[0-9]*.[0-9]*' 2>/dev/null || echo "")
if [ -z "$LAST_TAG" ]; then
  echo "No previous release tag found — worker release recommended"
  exit 0
fi
if git diff --quiet "$LAST_TAG"..HEAD -- worker/; then
  echo "No changes in worker/ since $LAST_TAG — skipping"
  exit 0
else
  echo "WARNING: worker/ has changes since $LAST_TAG"
  echo "A worker release (worker-x.y.z tag) should be created before or alongside this navi release"
  echo "Run: scripts/bump_version.sh worker [version]"
  exit 0
fi
```

Add the `check-worker-changes` case to `scripts/ci.sh`:

```bash
check-worker-changes) bash "$DIR/ci/check-worker-changes.sh" "$@" ;;
```

Update the job's `run:` step in `.circleci/config.yml`:

```yaml
- run:
    name: Check if worker/ changed since last release
    command: scripts/ci.sh check-worker-changes
```

## Files to Change

- `scripts/ci/check-worker-changes.sh` — new script, `set -e`, no args, moves the `git describe`/`git diff` block verbatim
- `scripts/ci.sh` — add `check-worker-changes` case
- `.circleci/config.yml` — `check-worker-changes` job's `run:` step now calls `scripts/ci.sh check-worker-changes`
