# Extract npm-publish frontend build step

The `npm-publish` job currently runs four separate inline `run:` steps to build the frontend and prep `source/` for publish:

```yaml
- run:
    name: Install frontend dependencies
    command: cd frontend && yarn install
- run:
    name: Build frontend
    command: cd frontend && yarn build
- run:
    name: Copy frontend build to source/static
    command: cp -r frontend/dist/. source/static/
- run:
    name: Replace local file dependency with npm version
    command: |
      sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json
```

Move this into `scripts/ci/build-frontend.sh` (no positional args — always operates on the checked-out repo root):

```bash
#!/bin/bash
set -e

cd frontend && yarn install
yarn build
cd - > /dev/null
cp -r frontend/dist/. source/static/
sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json
```

Add the `build-frontend` case to `scripts/ci.sh`:

```bash
build-frontend) bash "$DIR/ci/build-frontend.sh" "$@" ;;
```

Collapse the four `run:` steps in the `npm-publish` job into one, matching the "one action → one script" pattern used elsewhere in this issue:

```yaml
- run:
    name: Build frontend
    command: scripts/ci.sh build-frontend
```

Leave the job's other steps (`install-deps`, the final `scripts/ci.sh publish source` step) untouched.

## Files to Change

- `scripts/ci/build-frontend.sh` — new script, `set -e`, no args, runs `yarn install`/`yarn build` in `frontend/`, copies the build into `source/static/`, then rewrites `source/package.json`'s `deku-swarm` dependency
- `scripts/ci.sh` — add `build-frontend` case
- `.circleci/config.yml` — `npm-publish` job's four frontend-build `run:` steps collapse into one `- run: { name: Build frontend, command: scripts/ci.sh build-frontend }`
