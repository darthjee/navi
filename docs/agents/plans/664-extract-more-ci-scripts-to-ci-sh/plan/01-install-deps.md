# Extract install-deps command

The `install-deps` CircleCI command currently runs its `yarn install` logic inline:

```yaml
command: |
  cd <<parameters.path>>
  if [ "<<parameters.frozen>>" = "true" ]; then
    yarn install --frozen-lockfile
  else
    yarn install
  fi
```

Move this into `scripts/ci/install-deps.sh`, taking the target path as `$1` and a frozen flag as `$2` (`"true"`/`"false"`, defaulting to `"false"` when omitted — mirrors the command's `frozen: type: boolean, default: false` parameter):

```bash
#!/bin/bash
set -e

DIR=$1
FROZEN=${2:-false}

cd "$DIR"
if [ "$FROZEN" = "true" ]; then
  yarn install --frozen-lockfile
else
  yarn install
fi
```

Add the `install-deps` case to `scripts/ci.sh`:

```bash
install-deps) bash "$DIR/ci/install-deps.sh" "$@" ;;
```

Update the `install-deps` command's `command:` in `.circleci/config.yml` to call it instead of the inline block:

```yaml
command: scripts/ci.sh install-deps <<parameters.path>> <<parameters.frozen>>
```

The command still keeps its `path`/`frozen` parameters and `name: Install dependencies` — only the `command:` body changes.

## Files to Change

- `scripts/ci/install-deps.sh` — new script, `set -e`, positional `$1` (path) / `$2` (frozen flag)
- `scripts/ci.sh` — add `install-deps` case
- `.circleci/config.yml` — `install-deps` command's `command:` now calls `scripts/ci.sh install-deps <<parameters.path>> <<parameters.frozen>>`
