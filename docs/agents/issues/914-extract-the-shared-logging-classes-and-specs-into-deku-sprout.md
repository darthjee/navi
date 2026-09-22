# Issue: Extract the shared logging classes and specs into deku-sprout

## Description
Part 4 of 7 of #888. Copy the shared logging classes and their specs into `deku-sprout`, without yet switching any consumer over to the package.

## Problem
`source/lib/common/utils/logging/` and `clients/node/lib/logging/` carry duplicated copies of `BaseLogger`, `ConsoleLogger` and `Logger` (Codacy repository duplication is 18% against a 10% goal), and their specs are duplicated as well (`ConsoleLogger_spec.js`, `Logger_spec.js`).

## Solution
- Add `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` to `logger/lib/`, copied from `source/lib/common/utils/logging/` (these four only import each other), export them from `logger/lib/index.js`, and add matching specs under `logger/spec/`. The engine's `Logger` (group-aware) is the one copied; the client's single-logger version is not ported.
- Behaviour must not change.
- This sub-issue does **not** switch any consumer to the package — that is sub-issue #916. Leave `source/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}.js` and their specs, and all of `clients/node/lib/logging/` (implementation and specs), untouched — `source/lib/common/utils/logging/buffer/BufferedLogger.js` and `source/lib/registry/instances/LogRegistryInstance.js` still import these files by relative path, and `clients/node/lib/{NaviApiClient,ConfigFileParser,CliRunner,EnvStringResolver}.js` still import `clients/node/lib/logging/` locally, so deleting the originals now would break those imports.
- `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` stay in `source/` (Navi-specific) regardless.

## Benefits
- `deku-sprout` now holds its own copy of the shared logging code, with the package's own test suite green — ready for sub-issue #916 to switch `source/` and `clients/node/` onto the package and delete the old duplicated copies.
