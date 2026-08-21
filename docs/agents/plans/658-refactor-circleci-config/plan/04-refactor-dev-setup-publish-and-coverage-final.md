# Refactor dev-setup, publish, and coverage-final jobs

Rewrite the remaining jobs that need more than the plain `install-deps`/`run-tests`/`lint-and-report` pattern: `jasmine-dev`, `checks-dev` (need the copy-common-code setup), `npm-publish`, `npm-publish-client`, `npm-publish-worker` (need the auth+publish script), and `coverage-final` (needs the final Codacy call). Depends on step 1 (the sub-scripts must exist) and step 2 (the executor/commands must exist).

## `jasmine-dev` / `checks-dev`

Replace the inline "Copy common code from source" step with a call to the new router script, keep everything else on the shared commands:

```yaml
jasmine-dev:
  executor: node-ci
  steps:
    - checkout
    - run:
        name: Copy common code from source
        command: scripts/ci.sh setup-dev
    - install-deps:
        path: dev/app
    - run-tests:
        path: dev/app
```

(`checks-dev` follows the same shape with `lint-and-report` instead of `run-tests`.)

## `npm-publish` / `npm-publish-client` / `npm-publish-worker`

Switch to `executor: node-ci`, use `install-deps` with `frozen: true`, and replace the inline npm-auth + `npm publish` step with `scripts/ci.sh publish <path>`. `npm-publish` keeps its frontend-build-specific steps (installing/building `frontend/`, copying `frontend/dist` into `source/static`, the `sed` swap of the local `deku-swarm` dependency) unchanged — those are not part of the duplicated auth+publish pattern and stay inline. `npm-publish-worker` keeps its pre-publish "already exists on npm" check (`circleci-agent step halt`) unchanged — it is CircleCI-specific control flow, not shell duplicated elsewhere.

```yaml
npm-publish-client:
  executor: node-ci
  steps:
    - checkout
    - install-deps:
        path: clients/node
        frozen: true
    - run:
        name: Publish to npm
        command: scripts/ci.sh publish clients/node
```

## `coverage-final`

```yaml
coverage-final:
  executor: node-ci
  steps:
    - run:
        name: Finalize coverage on Codacy
        command: scripts/ci.sh coverage-final
```

## Files to Change

- `.circleci/config.yml` — rewrite `jasmine-dev`, `checks-dev`, `npm-publish`, `npm-publish-client`, `npm-publish-worker`, `coverage-final` per the shapes above, preserving `npm-publish`'s frontend-build steps and `npm-publish-worker`'s existing-version check as-is.
