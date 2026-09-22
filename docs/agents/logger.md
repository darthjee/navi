# Logger Subsystem

## Overview

The logger subsystem provides the shared logging classes used across the project — currently duplicated between `source/` and `clients/node/` — as a standalone, generic npm package: `deku-sprout` (`logger/`), following the same model as `deku-swarm` (`worker/`). `source/`, `clients/node/`, and `dev/app` are all meant to consume it as a regular dependency once the migration lands.

## Current status

`logger/` is now scaffolded — `package.json`, ESLint config, Jasmine + `c8` setup, `.gitignore`, and a `lib/index.js` entrypoint with a smoke spec proving the pipeline runs end-to-end. **No logging classes exist yet**: `lib/index.js` exports nothing. The real `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, and `Logger` classes — and the class-by-class reference that will live on this page, mirroring [Worker Subsystem](worker.md) — land in [#914](https://github.com/darthjee/navi/issues/914).

See [`logger/README.md`](../../logger/README.md) for the package's npm-facing readme, and [Feature: `deku-sprout`](specs/deku-sprout.md) for the full spec driving this and the remaining sub-issues of #888.
