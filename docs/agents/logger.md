# Logger Subsystem

## Overview

The logger subsystem is the small set of classes that build and route log messages: a level-filtering `BaseLogger`, a console-backed `ConsoleLogger`, a fan-out `LoggerGroup`, and the static `Logger` facade that the rest of the code calls. It ships as a standalone, generic npm package, `deku-sprout` (`logger/`), following the same model as `deku-swarm` (`worker/`, see [Worker Subsystem](worker.md)). The package has no knowledge of HTTP, jobs, caching or resources. It only filters messages by level and dispatches them to one or more destinations.

- **Package:** `deku-sprout`, public and unscoped on npm. ESM (`"type": "module"`), `main: lib/index.js`, and `files: ["lib"]` (only `lib/` is published). The version lives in `logger/package.json`.
- **Owner:** the `logger` agent owns `logger/`. The npm-facing [`logger/README.md`](../../logger/README.md) is owned by the `docs` agent.
- **Tooling:** the same jasmine, c8, eslint and jscpd scripts and configuration as `worker/`.

### Consumers

| Consumer | Dependency | Notes |
|---|---|---|
| `source/` | `"deku-sprout": "file:../logger"` | Imports `Logger` everywhere it logs. The Navi-specific classes build on `BaseLogger` (see "What stays in Navi" below). |
| `dev/app` | `"deku-sprout": "file:../logger"` | Imports `Logger` directly instead of receiving the logging files through the `source/lib/common/` copy. |
| `clients/node/` | `"deku-sprout": "^0.1.0"` (published) | Uses the group-aware `Logger`. `navi-hey-client` consumers install from the registry, where a `file:` dependency cannot resolve, so the client depends on the published version. |

Because `source/` and `dev/app` use a `file:` dependency, every image and compose service that installs their dependencies must make `logger/` available, the same way `worker/` is handled: `docker-compose.yml` mounts `./logger` at `/home/node/logger`, and `dockerfiles/navi-hey-test/Dockerfile` and `dockerfiles/demo_dev_app/Dockerfile` copy the folder into the image.

## Core classes

### `BaseLogger` (`logger/lib/BaseLogger.js`)

Base class holding the level handling and the four logging methods. It never writes anything itself.

- `constructor(level)`: the threshold defaults to `process.env.LOG_LEVEL`, then to `'info'`.
- Levels, in order: `debug` (0), `info` (1), `warn` (2), `error` (3), `silent` (4). A message is emitted when its level is greater than or equal to the threshold, so `silent` drops everything.
- `debug/info/warn/error(message, attributes = {})`: when the message passes the level check and the logger is not suppressed, they call `_output(level, message, attributes)`.
- `_output(level, message, attributes)` *(protected hook)*: a no-op in the base class. Subclasses override it to send the message somewhere.
- `suppress(value = true)`: turns all output on or off for this instance, whatever the level.
- `setLevel(level)`: changes the threshold, and throws on an unknown level name.

### `ConsoleLogger` (`logger/lib/ConsoleLogger.js`)

Extends `BaseLogger`. Its `_output` calls `console[level](message, attributes)`. This is the default destination of `Logger`.

### `LoggerGroup` (`logger/lib/LoggerGroup.js`)

Broadcasts every call to a list of loggers. It is not a `BaseLogger` subclass and does no level filtering itself. Each member applies its own threshold.

- `constructor(loggers = [])`
- `addLogger(logger)` / `removeLogger(logger)`: both return `this` for chaining. `getLoggers()` returns a copy of the list.
- `debug/info/warn/error(message, attributes)`, `suppress(value)`, `setLevel(level)`: forwarded to every member.

### `Logger` (`logger/lib/Logger.js`)

Static facade over a singleton `LoggerGroup`. This is what application code calls (`Logger.info(...)`).

- `Logger.default()`: returns the singleton group, creating it with a single `ConsoleLogger` on first access.
- `Logger.debug/info/warn/error(message, attributes)`, `Logger.suppress(value)`, `Logger.setLevel(level)`: delegate to the default group.
- `Logger.setLogger(logger)`: replaces the default group with a new `LoggerGroup([logger])`, so the console logger is dropped.
- `Logger.addLogger(logger)`: adds another destination to the default group, next to the existing ones.
- `Logger.reset()`: clears the singleton so the next call rebuilds it. This is used in spec teardown.

## Public API

`logger/lib/index.js` exports exactly the four classes:

```js
import { BaseLogger, ConsoleLogger, LoggerGroup, Logger } from 'deku-sprout';
```

They only import each other, which is what made them extractable without taking any Navi-specific code with them.

## What stays in Navi

`Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` (`BufferedLogger`, `LogBuffer`, `LogBufferCollection`) are Navi-specific. They stay in `source/lib/common/utils/logging/` (see [Source Layout](architecture/source-layout.md)) and import the base classes from `deku-sprout`. For example, `BufferedLogger` extends `BaseLogger` and overrides `_output` to feed the web UI's log buffer, and it is registered with `Logger.addLogger(...)` so messages go to both the console and the buffer.

## Release flow

`deku-sprout` has its own version, CI jobs and tags, independent from `navi-hey` and `navi-hey-client`.

| Piece | Where |
|---|---|
| Spec and lint jobs | CircleCI `jasmine-deku-sprout` and `checks-deku-sprout`, both required by the pipeline's gating jobs. |
| Auto-publish job | CircleCI `check-and-publish-deku-sprout`, running `scripts/ci.sh check-and-publish-deku-sprout` (`scripts/ci/check-and-publish-deku-sprout.sh`). It publishes when `logger/` changed since the last release tag, or when the `force_deku_sprout_build` pipeline parameter is set. The npm publish and the tag push are each idempotent on their own. |
| Standalone tag workflow | Pushing a `deku-sprout-X.Y.Z` tag runs `check-deku-sprout-version-tag` (`scripts/check_deku_sprout_tag_version.sh`, which checks the tag against `logger/package.json`), then `publish-deku-sprout-standalone` (the same publish script, forced). |
| Version bump | `scripts/bump_version.sh deku-sprout [version]`. It updates `logger/package.json` and rewrites (or adds) the `**Deku Sprout Current Version:**` / `**Deku Sprout Next Version:**` lines in `README.md`. |
| Tags | `deku-sprout-X.Y.Z`. These are decoupled from the main `navi-hey` release tag (#923). |
| Pinning in `navi-hey` releases | The `npm-publish` job runs `scripts/ci.sh pin-local-deps` (`scripts/ci/pin-local-deps.sh`) before `navi-hey` is published. It rewrites `"deku-sprout": "file:../logger"` in `source/package.json` to the exact `logger/package.json` version (no `^`/`~`), does the same for `deku-swarm`, and fails the release if any `file:` dependency is left. |

A `deku-sprout` release does **not** force a release of `navi-hey` or `navi-hey-client`. Each of them adopts a new version of the package when it chooses to: `source/` and `dev/app` pick up `logger/` changes immediately through `file:`, while `clients/node/` moves only when its `^` range or pinned version is bumped. Any change the client needs must be published to npm before the client can depend on it.

## Design decisions

These summarize the reasoning behind the extraction (#888).

- **A new package.** The logging classes used to be duplicated between `source/lib/common/utils/logging/` and `clients/node/lib/logging/`, kept in sync by hand and flagged by Codacy as clones. Two alternatives were rejected: putting the code in `deku-swarm`, because logging is unrelated to a queue/worker package, and keeping both copies, because the duplication and the manual syncing would remain.
- **Public on npm.** `navi-hey-client` consumers install from the registry, where a `file:` dependency cannot resolve. A private registry would require credentials from every client user, and a `private: true` package (like `navi-spec-support`) would need custom bundling in the client's release.
- **The name `deku-sprout`.** Unscoped, like `deku-swarm`. `deku-tree`, `sheikah` and `hylia` were already taken on npm.
- **All four classes.** `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` only depend on each other. Having the client use the group-aware `Logger` removed all of its duplicated files, including its own single-logger `Logger`.
- **`dev/app` is a consumer.** It only imports `Logger`, so it depends on the package instead of getting the logging files through the `source/lib/common/` copy mechanism.
- **The client has a runtime dependency.** `navi-hey-client` is no longer self-contained. This was accepted as the cost of removing the duplication.
- **No behaviour change.** The extraction did not change the logging API or output.
