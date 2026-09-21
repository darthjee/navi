# Migration

This page describes the mechanisms and the decisions; the sub-issues that carry out the move ([Rollout](rollout.md)) hold the concrete file and job lists.

## Move map

- `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` move from `source/lib/common/utils/logging/` to `logger/lib/`.
- Their specs move from `source/spec/lib/common/utils/logging/` to `logger/spec/`.
- `clients/node/lib/logging/` and its specs are removed.

## Consumers

### `source/`

Depends on the package through `file:../logger` in development, the same way it already does for `deku-swarm`. The files that stay (`Log*`, `buffer/`) import the base classes from `deku-sprout`.

### `clients/node/`

Gains a runtime dependency on the **published** package and stops being self-contained; this is accepted in #888 as the price of removing the duplication. It uses the group-aware `Logger`, replacing its own single-logger version.

### `dev/app`

Only imports `Logger`. It stops receiving the logging files through the `source/lib/common/` copy mechanism, which today is spread over:

- `scripts/ci/setup-dev.sh` and the CircleCI "Copy common code from source" steps;
- the `docker-compose.yml` mounts of `source/lib/common` and `source/spec/lib/common`;
- `dockerfiles/demo_dev_app/Dockerfile`.

It also drops the jasmine exclusion of the copied logging specs (`!lib/common/utils/logging/**` in `dev/app/package.json` and `dev/app/spec/support/jasmine.json`), and depends on `deku-sprout` instead.

## Docker

Images and compose services that install the dependencies of `source/` or `dev/app` must make `logger/` available, the way `worker/` is handled today: `dockerfiles/navi-hey-test/Dockerfile` copies the folder and replaces the `node_modules/deku-swarm` symlink with a real copy, and `docker-compose.yml` mounts `./worker`. The same applies to `./logger`.
