# Logger Plan: Extract the shared logging classes and specs into deku-sprout

Main plan: [plan.md](plan.md)

## Overview

`source/lib/common/utils/logging/` and `clients/node/lib/logging/` both keep duplicated copies of `BaseLogger`, `ConsoleLogger` and `Logger` (18% Codacy repository duplication vs. a 10% goal). This plan gives `logger/` (the `deku-sprout` package, scaffolded in #913) its own copy of `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger`, ported byte-for-byte from `source/`'s versions, with matching specs.

This is **copy, not move**: `source/lib/common/utils/logging/buffer/BufferedLogger.js` and `source/lib/registry/instances/LogRegistryInstance.js` still import these four files by relative path within `source/`, and `clients/node/lib/{NaviApiClient,ConfigFileParser,CliRunner,EnvStringResolver}.js` still import `clients/node/lib/logging/` locally — none of that is switched to `deku-sprout` here. Deleting the originals now would break those imports; the actual consumer switch-over and deletion of the old duplicates is sub-issue #916. `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` are Navi-specific and stay in `source/` regardless (owned by `engine`).

## Implementation Steps

### Step 1 — Port the four classes into `logger/lib/`

Copy `BaseLogger.js`, `ConsoleLogger.js`, `LoggerGroup.js` and `Logger.js` from `source/lib/common/utils/logging/` into `logger/lib/` verbatim (no behaviour change — these four files only import each other, so no import-path edits are needed inside them). Use `source/`'s `Logger` (group-aware); `clients/node/lib/logging/Logger.js` (single-logger) is **not** ported — it is dropped only once `clients/node` switches to the package in #916. Export all four from `logger/lib/index.js`, replacing its current empty placeholder comment.

### Step 2 — Port the specs into `logger/spec/` and verify

Copy `BaseLogger_spec.js`, `ConsoleLogger_spec.js`, `LoggerGroup_spec.js` and `Logger_spec.js` from `source/spec/lib/common/utils/logging/` into `logger/spec/`, updating each spec's import path to point at the new sibling `logger/lib/*.js` location (e.g. `../lib/BaseLogger.js` instead of the old five-levels-up relative path). `Logger_spec.js` calls `LoggerUtils.stubConsoleMethods()` from `source/spec/support/utils/LoggerUtils.js` — that helper also has a Navi-specific `stubLoggerMethods()` (imports `source/`'s `LogRegistry`), so don't port the whole file. Instead add a small package-local `logger/spec/support/utils/LoggerSpecUtils.js` exposing only `stubConsoleMethods()` (spies on `console.debug/info/warn/error`), and have `Logger_spec.js` use that instead. Strengthen `logger/spec/index_spec.js`'s placeholder assertion to check that `BaseLogger`, `ConsoleLogger`, `LoggerGroup` and `Logger` are all exported from `lib/index.js`, now that there's a real API surface to check. Run `cd logger && yarn install && yarn lint && yarn coverage` and confirm everything is green.

## Files to Change

- `logger/lib/BaseLogger.js` — new, copied verbatim from `source/lib/common/utils/logging/BaseLogger.js`
- `logger/lib/ConsoleLogger.js` — new, copied verbatim from `source/lib/common/utils/logging/ConsoleLogger.js`
- `logger/lib/LoggerGroup.js` — new, copied verbatim from `source/lib/common/utils/logging/LoggerGroup.js`
- `logger/lib/Logger.js` — new, copied verbatim from `source/lib/common/utils/logging/Logger.js`
- `logger/lib/index.js` — export `BaseLogger`, `ConsoleLogger`, `LoggerGroup`, `Logger`
- `logger/spec/BaseLogger_spec.js` — new, ported from `source/spec/lib/common/utils/logging/BaseLogger_spec.js` with updated import path
- `logger/spec/ConsoleLogger_spec.js` — new, ported from `source/spec/lib/common/utils/logging/ConsoleLogger_spec.js` with updated import path
- `logger/spec/LoggerGroup_spec.js` — new, ported from `source/spec/lib/common/utils/logging/LoggerGroup_spec.js` with updated import path
- `logger/spec/Logger_spec.js` — new, ported from `source/spec/lib/common/utils/logging/Logger_spec.js`, using the new local spec-support helper instead of `LoggerUtils`
- `logger/spec/support/utils/LoggerSpecUtils.js` — new, package-local console-stubbing helper (`stubConsoleMethods()` only)
- `logger/spec/index_spec.js` — strengthen the placeholder assertion to check the four named exports

## Notes

- Do **not** touch `source/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}.js` or their specs, and do not touch anything under `clients/node/lib/logging/` — those stay until #916.
- `Log`, `LogContext`, `LogFactory`, `LogFilter` and `buffer/` are out of scope (owned by `engine`, stay in `source/`).
- No CI job exists yet for `logger/` (that's #915); the verification in Step 2 is local (`yarn coverage`, `yarn lint`) only.
- `logger/README.md` (owned by `docs`) already says the package "is still being scaffolded — no logging classes are published yet," which stays accurate after this issue since nothing is published to npm here (that's also #915) — no README change needed.
