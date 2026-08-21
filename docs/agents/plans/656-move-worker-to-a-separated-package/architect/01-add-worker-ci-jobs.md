# Add worker CI jobs

Add `.circleci/config.yml` jobs for `worker/`, mirroring the existing `*-client` jobs (`jasmine-client`, `checks-client`, `check-client-version-tag`, `npm-publish-client`) since `worker/` follows the exact same monorepo-package shape. Unlike the client package, `worker/` has no Docker image, so there's no `build-and-release-worker`/`update-description-worker` equivalent.

## New test/check jobs (parallel to client)

```yaml
jasmine-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd worker; yarn install
    - run:
        name: Unit tests (Jasmine + c8 coverage)
        command: cd worker; npm run coverage
    - run:
        name: Upload coverage to Codacy (partial)
        command: cd worker; bash <(curl -Ls https://coverage.codacy.com/get.sh) report --partial -r coverage/lcov.info

checks-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Install dependencies
        command: cd worker; yarn install
    - run:
        name: Lint
        command: cd worker; npm run lint
    - run:
        name: Duplication report (JSCPD)
        command: cd worker; npm run report
```

## Version check and publish jobs

```yaml
check-worker-version-tag:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check tag matches worker/package.json and README versions
        command: bash scripts/check_worker_tag_version.sh

npm-publish-worker:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check if version already exists on npm
        command: |
          VERSION=$(node -p "require('./worker/package.json').version")
          if npm view deku-swarm@$VERSION version 2>/dev/null; then
            echo "deku-swarm@$VERSION already exists on npm — skipping publish"
            circleci-agent step halt
          fi
    - run:
        name: Install dependencies
        command: cd worker; yarn install --frozen-lockfile
    - run:
        name: Publish to npm
        command: |
          echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc
          cd worker; npm publish --access public
```

## Cross-check before Navi release

New job that runs before Navi's `npm-publish`, checking if `worker/` changed since the last worker release:

```yaml
check-worker-changes:
  docker:
    - image: darthjee/circleci_node:0.2.1
  steps:
    - checkout
    - run:
        name: Check if worker/ changed since last release
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

## Swap step in Navi's npm-publish job

Add, before the actual `npm publish` step of Navi's own `npm-publish` job:

```yaml
- run:
    name: Replace local file dependency with npm version
    command: |
      sed -i 's/"deku-swarm": "file:..\//"deku-swarm": "^/' source/package.json
```

## Wire the workflow

Following the `*-client` jobs' wiring (`.circleci/config.yml`'s `workflows:` section):

- Add `jasmine-worker` and `checks-worker` alongside `jasmine-client`/`checks-client`.
- Add `check-worker-version-tag` and `npm-publish-worker` with a tag filter `only: /worker-\d+\.\d+\.\d+/`, matching `check-client-version-tag`/`npm-publish-client`'s shape; `npm-publish-worker` requires `[check-worker-version-tag, jasmine-worker, checks-worker]`.
- Add `check-worker-changes` as a dependency of Navi's `npm-publish` job (so it runs before, not gating — it only warns).

## Files to Change

- `.circleci/config.yml` — add the six jobs above (`jasmine-worker`, `checks-worker`, `check-worker-version-tag`, `npm-publish-worker`, `check-worker-changes`, plus the swap step inside the existing `npm-publish` job) and wire them into the `workflows:` section.
