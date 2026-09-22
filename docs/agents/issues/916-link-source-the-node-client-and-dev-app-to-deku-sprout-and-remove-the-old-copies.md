# Issue: Link source, the Node client and dev/app to deku-sprout and remove the old copies

## Description
Part 6 of 7 of #888. Make `source/`, `navi-hey-client` and `dev/app` consume `deku-sprout` and delete the duplicated copies.

## Solution
- `source/`: add `"deku-sprout": "file:../logger"` (as done for `deku-swarm`), switch the imports of `BaseLogger`/`ConsoleLogger`/`LoggerGroup`/`Logger` (including those in `Log*`/`buffer/` files) to the package, delete `source/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}.js` and their specs. `source/lib/common/utils/logging/{Log,LogContext,LogFactory,LogFilter}.js` and `buffer/` stay in `source/` — only their internal imports of the migrated classes change.
- `clients/node/`: add the published `deku-sprout` as a runtime dependency (the client stops being fully self-contained, which was accepted in #888), switch its imports, delete `clients/node/lib/logging/` and its specs; the client uses the same group-aware `Logger` as the engine (its current `Logger`/`BaseLogger`/`ConsoleLogger` are self-contained ports and get replaced outright).
- `dev/app`: add `"deku-sprout": "file:../logger"` as a dependency, matching `source/`'s local `file:` pattern rather than the client's published-npm pattern (decided during discussion, since `dev/app` is part of this same monorepo checkout). Update its `Logger` imports (`lib/config/AppConfig.js`, `lib/handlers/CollectorHandler.js`, `lib/handlers/ContentHandler.js` — it only imports `Logger`) to the package, stop delivering `lib/common/utils/logging/` through the copy mechanism (`scripts/ci/setup-dev.sh`, the CircleCI "Copy common code from source" step, the `docker-compose.yml` `lib/common` mounts for `navi_dev_app`), and drop its jasmine exclusion of the copied logging specs (`!lib/common/utils/logging/**` in `dev/app/package.json`). Wiring needed for the new `file:` dependency:
  - `docker-compose.yml`: add a `./logger:/home/node/logger` mount to the `navi_dev_app` service, mirroring the `base` service's existing `./worker:/home/node/worker` mount.
  - `dockerfiles/dev_app/Dockerfile`: no change expected — it only warms the yarn cache from `package.json`/`yarn.lock` at build time (same as `dockerfiles/dev_navi_hey/Dockerfile`, which today builds fine without copying `worker/` in for `deku-swarm`); the actual install happens later against the compose-mounted sibling folder.
  - `dockerfiles/demo_dev_app/Dockerfile`: **does** need a change — it runs `yarn install --production` directly against `dev/app/` in the build, so it needs a `COPY --chown=node:node ./logger/ /home/node/logger/` (sibling to `/home/node/app/`) before that install, plus the same symlink-to-real-copy fix `dockerfiles/navi-hey-test/Dockerfile` applies for `deku-swarm` (a `file:` dependency resolves to a symlink that would otherwise break in the `COPY --from=builder` final stage).
- Dockerfiles / `docker-compose.yml`: copy or mount `./logger` where needed and replace the `node_modules/deku-sprout` symlink with a real copy in `dockerfiles/navi-hey-test/Dockerfile`'s `backend_builder` stage, as done for `deku-swarm`. Check the other images that install `source/` or `dev/app` dependencies: `production_navi_hey` and `production_navi_client` install `navi-hey`/`navi-hey-client` from the npm registry and pick up `deku-sprout` transitively as a normal dependency, so no Dockerfile change is expected there — verify during implementation.
- No change in logging behaviour for any consumer; Codacy no longer reports these files as clones.

Depends on sub-issues 4 (code in the package) and 5 (package published on npm) — parts 4 and 5 of #888, already merged to `main`.

## Benefits
- Removes the duplicated logging code and specs; fixes to the shared classes are made once
