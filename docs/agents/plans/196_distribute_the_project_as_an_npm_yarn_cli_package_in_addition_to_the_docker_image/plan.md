# Plan: Distribute the Project as an npm/yarn CLI Package in Addition to the Docker Image

## Overview

Configure the project to be publishable as an npm package (available via `npx navi`), add an automated `npm-publish` CI job to CircleCI, update the production Dockerfile to install from the published package, and document the new usage in `README.md`.

## Context

- `source/bin/navi.js` already exists with the correct shebang (`#!/usr/bin/env node`).
- `source/package.json` currently has no `bin` or `files` fields.
- `react`, `react-dom`, and related packages are listed as `dependencies` but must be removed for this release — the frontend bundle is out of scope here.
- The CircleCI pipeline already has a `build-and-release` job triggered only on version tags (`\d+\.\d+\.\d+`); the new `npm-publish` job must follow the same pattern.
- npm and yarn share the same registry (npmjs.com); a single publish covers both package managers.

## Implementation Steps

### Step 1 — Configure `package.json` for npm publishing

In `source/package.json`:

- Add a `bin` field to expose the `navi` CLI command:
  ```json
  "bin": {
    "navi": "bin/navi.js"
  }
  ```
- Add a `files` field to include only `lib/` and `bin/` in the published package:
  ```json
  "files": ["bin", "lib"]
  ```
- Remove the following from `dependencies` (frontend — out of scope for this release):
  - `react`
  - `react-dom`
  - `react-bootstrap`
  - `@types/react` (move to `devDependencies` or remove)
  - `@types/react-dom` (move to `devDependencies` or remove)
  - `babel-plugin-react-compiler` (move to `devDependencies` or remove)

### Step 2 — Add tag/version consistency check script

Add a script `scripts/check_tag_version.sh` that:

- Reads the `version` field from `source/package.json`.
- Compares it against the CircleCI tag (`$CIRCLE_TAG`).
- Exits with a non-zero status and a clear error message if they do not match, causing the job to fail.

Example logic:
```bash
#!/bin/bash
set -e
PACKAGE_VERSION=$(node -p "require('./source/package.json').version")
if [ "$CIRCLE_TAG" != "$PACKAGE_VERSION" ]; then
  echo "ERROR: Git tag ($CIRCLE_TAG) does not match package.json version ($PACKAGE_VERSION)"
  exit 1
fi
echo "Tag and package.json version match: $CIRCLE_TAG"
```

### Step 3 — Add `check-version-tag` job to CircleCI

Add a dedicated `check-version-tag` job in `.circleci/config.yml` that:

- Uses a Node-capable Docker image (e.g., `darthjee/circleci_node:0.2.1`).
- Runs `scripts/check_tag_version.sh`.
- Is triggered only on version tags matching `\d+\.\d+\.\d+`, ignoring all branches.
- Does **not** require any other job — it runs as soon as a matching tag is pushed.

Wire it into the `test-and-release` workflow:
```yaml
- check-version-tag:
    filters:
      tags:
        only: /\d+\.\d+\.\d+/
      branches:
        ignore: /.*/
```

Both `build-and-release` and `npm-publish` must declare `check-version-tag` as a requirement, alongside the existing test/check jobs:
```yaml
- build-and-release:
    requires: [check-version-tag, jasmine, jasmine-dev, jasmine-frontend, checks, checks-dev, checks-frontend]
    ...
- npm-publish:
    requires: [check-version-tag, jasmine, jasmine-dev, jasmine-frontend, checks, checks-dev, checks-frontend]
    ...
```

### Step 4 — Add `npm-publish` job to CircleCI

Add a new `npm-publish` job that:

- Uses a Node-capable Docker image (e.g., `darthjee/circleci_node:0.2.1`).
- Runs `cd source && npm publish --access public` using the `NPM_TOKEN` environment variable for authentication (set `//registry.npmjs.org/:_authToken=${NPM_TOKEN}` in `.npmrc` or via `npm config set`).
- Is triggered only on version tags matching `\d+\.\d+\.\d+`, ignoring all branches.
- Requires `check-version-tag` and all test/check jobs (see Step 3).

### Step 3 — Update the production Dockerfile

In `dockerfiles/production_navi/Dockerfile`:

- Instead of copying `source/` directly, install the published npm package:
  ```dockerfile
  RUN npm install -g navi
  ```
  or, if a specific version is needed at build time:
  ```dockerfile
  RUN npm install -g navi@${VERSION}
  ```

### Step 4 — Update `README.md`

Add a section documenting the new npm/yarn distribution option:

- How to run via `npx navi` (no install required).
- How to install globally: `npm install -g navi` / `yarn global add navi`.
- Mention that Docker distribution is still available alongside the npm package.

## Files to Change

- `source/package.json` — add `bin` and `files` fields; remove React-related dependencies
- `scripts/check_tag_version.sh` — new script to assert git tag matches `package.json` version
- `.circleci/config.yml` — add `check-version-tag` job (gate for both release jobs) and `npm-publish` job; update `build-and-release` to require `check-version-tag`
- `dockerfiles/production_navi/Dockerfile` — install from published npm package instead of copying source
- `README.md` — document `npx navi` and global install usage

## Notes

- **Required CI secret:** The `NPM_TOKEN` environment variable must be set in the CircleCI project settings. This is an npm access token generated from [npmjs.com](https://www.npmjs.com) with publish permissions. Since npm and yarn share the same registry, this single token covers both package managers.
- The `npm publish` step should be mentioned explicitly in the PR description so the reviewer knows to verify that `NPM_TOKEN` is configured in CircleCI before merging.
- The `check-version-tag` job acts as a shared gate: both `build-and-release` and `npm-publish` depend on it, so a tag/version mismatch blocks all releases atomically.
- React/frontend dependencies removal may affect `eslint.config.mjs` (which may reference React ESLint plugins) — check if any lint rules need to be scoped or removed alongside the dependency removal.
- The `public/` folder (React SPA static files) is currently served by `WebServer`. With React removed from deps, `source/public/` can remain in place for the Docker image but will not be part of the npm package (excluded by the `files` field).
