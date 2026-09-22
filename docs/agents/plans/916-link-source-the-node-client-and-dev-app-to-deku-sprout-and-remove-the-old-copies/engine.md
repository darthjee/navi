# Engine Plan: Link source, the Node client and dev/app to deku-sprout and remove the old copies

Main plan: [plan.md](plan.md)

## Shared contracts

- `source/package.json` declares `"deku-sprout": "file:../logger"` (matching the existing `"deku-swarm": "file:../worker"` entry) — a local monorepo path, not a published-npm range.
- Every import of `BaseLogger`/`ConsoleLogger`/`LoggerGroup`/`Logger` switches to `import { ... } from 'deku-sprout'`, the package's root entrypoint.
- Relies on `docker` adding a `./logger:/home/node/logger` mount (mirroring the existing `./worker:/home/node/worker` one) to the `base` service anchor in `docker-compose.yml`, and the equivalent `COPY ./logger/` step in `dockerfiles/navi-hey-test/Dockerfile`, for the new dependency to actually resolve in local dev and the test-harness image.

## Implementation Steps

### Step 1 — Add the deku-sprout dependency

Add `"deku-sprout": "file:../logger"` to `source/package.json`'s `dependencies`, alongside the existing `deku-swarm` entry.

### Step 2 — Switch imports to the package and delete the local copies

Update every import of `BaseLogger`, `ConsoleLogger`, `LoggerGroup` or `Logger` from the local `utils/logging/` path to `import { ... } from 'deku-sprout'` — across `source/lib` (call sites in `WebServer.js`, `RouteRegister.js`, `SecuredRequestHandler.js`, `extensions/ExtensionRoutesLoader.js`, `configs/MenuConfig.js`, `registry/instances/LogRegistryInstance.js`, `services/config/ConfigIncluder.js`, `parsers/css_selector_parser/FilterMatcher.js`), `source/lib/common/utils/logging/buffer/BufferedLogger.js` (imports `BaseLogger`), and the corresponding spec files and spec-support test utilities (`source/spec/support/utils/LoggerUtils.js`, `RouteRegisterUtils.js`, `RegistryCleanupUtils.js`, and every `*_spec.js` under `source/spec/lib` that currently imports one of these four classes).

Leave `Log.js`, `LogContext.js`, `LogFactory.js`, `LogFilter.js` and `buffer/LogBuffer.js`/`buffer/LogBufferCollection.js` in place in `source/lib/common/utils/logging/` — none of them import the four migrated classes except `buffer/BufferedLogger.js` (handled above).

Delete `source/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}.js` and their specs `source/spec/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}_spec.js`.

## Files to Change

- `source/package.json` — add the `deku-sprout` dependency
- `source/lib/common/utils/logging/buffer/BufferedLogger.js` — import `BaseLogger` from `deku-sprout`
- `source/lib/server/WebServer.js`, `RouteRegister.js`, `SecuredRequestHandler.js`, `extensions/ExtensionRoutesLoader.js` — import `Logger` (and any of the other three) from `deku-sprout`
- `source/lib/models/configs/MenuConfig.js`, `source/lib/registry/instances/LogRegistryInstance.js`, `source/lib/services/config/ConfigIncluder.js`, `source/lib/parsers/css_selector_parser/FilterMatcher.js` — same import switch
- `source/spec/support/utils/LoggerUtils.js`, `RouteRegisterUtils.js`, `RegistryCleanupUtils.js` — same import switch
- All `*_spec.js` files under `source/spec/lib` currently importing `BaseLogger`/`ConsoleLogger`/`LoggerGroup`/`Logger` from the local path — same import switch
- `source/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}.js` — delete
- `source/spec/lib/common/utils/logging/{BaseLogger,ConsoleLogger,LoggerGroup,Logger}_spec.js` — delete

## CI Checks

- `source`: `npm run coverage` (job: `jasmine`), `scripts/ci.sh lint-and-report source` (job: `checks`)

## Notes

- `source/lib/common/utils/logging/{Log,LogContext,LogFactory,LogFilter}.js` and the rest of `buffer/` stay in `source/` unchanged — they are not part of `deku-sprout`'s public surface (confirmed against `logger/lib/index.js`, which only exports `BaseLogger`/`ConsoleLogger`/`LoggerGroup`/`Logger`).
- Verify `npm run coverage` and lint pass locally against the `file:../logger` dependency before relying on CI, since a local `file:` dependency needs `yarn`/`npm install` re-run after the `package.json` change.
