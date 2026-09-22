# Plan: Link source, the Node client and dev/app to deku-sprout and remove the old copies

Issue: [916-link-source-the-node-client-and-dev-app-to-deku-sprout-and-remove-the-old-copies.md](../issues/916-link-source-the-node-client-and-dev-app-to-deku-sprout-and-remove-the-old-copies.md)

## Overview

`source/`, `clients/node/` and `dev/app` each carry their own copy of the shared logging classes (`BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`), which now live in the published `deku-sprout` package (`logger/`). This plan switches all three consumers over to `deku-sprout` and deletes the duplicated code and specs. `source` and `dev/app` depend on the package via a local `file:../logger` monorepo reference (the same pattern `source` already uses for `deku-swarm`); `clients/node` depends on the published npm package instead, since it ships standalone. The `docker` agent wires the new `file:../logger` dependency into `docker-compose.yml` and the Dockerfiles that build from a bare checkout.

## Agents involved

- [engine](engine.md)
- [navi-client](navi-client.md)
- [dev](dev.md)
- [docker](docker.md)

## Shared contracts

1. **Package entrypoint.** `deku-sprout` exports `{ BaseLogger, ConsoleLogger, LoggerGroup, Logger }` from its root (`logger/lib/index.js`). All three consumers import from this exact entrypoint (`import { Logger } from 'deku-sprout'`, etc.), replacing their previous relative-path imports of the now-deleted local copies.

2. **Dependency declaration shape.** `engine` (`source/package.json`) and `dev` (`dev/app/package.json`) both declare `"deku-sprout": "file:../logger"` — a local path relative to their own `package.json`. `navi-client` (`clients/node/package.json`) instead declares a published npm semver range (e.g. `"deku-sprout": "^0.1.0"`), matching how it already depends on `axios`/`yaml`, since the client ships standalone and cannot rely on a sibling folder existing inside a consumer's install.

3. **Docker/compose infrastructure, produced by `docker`, relied on by `engine` and `dev`.**
   - `docker-compose.yml`'s `base` service already mounts `./worker:/home/node/worker` for `source`'s existing `file:../worker` dependency (inherited by `base_build`, `navi_app`, `navi_extensions_app`, `navi_tests` via the `&base` anchor); `docker` adds the equivalent `./logger:/home/node/logger` mount to that same anchor, and a separate one to the `navi_dev_app` service for `dev/app`'s new dependency.
   - `dockerfiles/navi-hey-test/Dockerfile`'s `backend_builder` stage and `dockerfiles/demo_dev_app/Dockerfile` each need a `COPY ./logger/ /home/node/logger/` plus the symlink-to-real-copy fix already applied there for `deku-swarm` — `engine`'s and `dev`'s new dependency entries are inert without this.
   - `dockerfiles/dev_app/Dockerfile` and `dockerfiles/dev_navi_hey/Dockerfile` need **no** change — precedent: they already build fine today without copying `worker/` in for `deku-swarm`, since they only warm the yarn cache from `package.json`/`yarn.lock` at build time; the actual `file:` install happens later against the compose-mounted sibling folder.

`engine`, `dev` and `docker`'s changes are mutually dependent for the build to actually work end to end, but not order-dependent — each package.json/import change is independently valid; `docker`'s wiring is what makes `yarn install`/the affected Docker builds actually resolve it.
