# Rewrite docs/agents/logger.md as a permanent subsystem doc

`docs/agents/logger.md` is 11 lines long and still says "No logging classes exist yet". Rewrite it as the class-by-class reference for `deku-sprout`, using the structure of `docs/agents/worker.md`:

- **Overview**: what the package is, that it is generic (it only builds and routes log messages, with no knowledge of HTTP, jobs or caching), and who consumes it and how (see the shared contracts).
- **Core classes**: one subsection per class, each with its file path. Describe the behaviour from `logger/lib/*.js`, not from the specs:
  - `BaseLogger` (`logger/lib/BaseLogger.js`): level filtering (`debug`/`info`/`warn`/`error`/`silent`) and the hook subclasses override.
  - `ConsoleLogger` (`logger/lib/ConsoleLogger.js`)
  - `LoggerGroup` (`logger/lib/LoggerGroup.js`): fan-out to several loggers.
  - `Logger` (`logger/lib/Logger.js`): the static facade, including `setLogger`/`addLogger`.
- **Public API**: `logger/lib/index.js`.
- **What stays in Navi**: `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` in `source/lib/common/utils/logging/`, with `BufferedLogger` extending `BaseLogger`. Link to [Source Layout](architecture/source-layout.md).
- **Release flow**: the CI jobs, the `force_deku_sprout_build` parameter, the standalone tag workflow, `deku-sprout-X.Y.Z` tags, and `scripts/bump_version.sh deku-sprout`. Copy these from the shared contracts. The spec's `release-flow.md` has the wrong names. Note that a `deku-sprout` release does not force a `navi-hey` or `navi-hey-client` release; each one adopts a new version when it chooses to.
- **Design decisions**: a short section summarizing `docs/agents/specs/deku-sprout/decisions.md`:
  - why a new package (and not `deku-swarm`, and not keeping two copies)
  - why it is public on npm
  - why the name `deku-sprout`
  - why all four classes are included
  - why `dev/app` is a consumer
  - why `navi-hey-client` now has a runtime dependency
- Remove the "Current status" section and the link to `specs/deku-sprout.md`.

Also read `docs/agents/specs/deku-sprout/package.md`, `migration.md` and `overview.md`, and keep anything still true and useful that the new page doesn't cover yet.

## Files to Change
- `docs/agents/logger.md`: full rewrite into a permanent subsystem reference
