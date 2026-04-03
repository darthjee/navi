# Plan: Fix Lint

## Overview

`yarn lint` passes with 0 errors but reports 28 warnings. All warnings should be resolved to keep the codebase clean.

## Lint Output (branch: stats-endpoint)

```
/home/node/app/lib/registry/JobRegistry.js
  129:1  warning  Missing JSDoc @returns description  jsdoc/require-returns-description

/home/node/app/lib/registry/WorkersRegistry.js
  114:1  warning  Missing JSDoc @returns description  jsdoc/require-returns-description

/home/node/app/lib/server/RouteRegister.js
  17:1  warning  Missing JSDoc @param "params" description  jsdoc/require-param-description

/home/node/app/lib/server/Router.js
  16:1  warning  Missing JSDoc @param "params" description  jsdoc/require-param-description

/home/node/app/lib/server/StatsRequestHandler.js
  12:1  warning  Missing JSDoc @param "params" description  jsdoc/require-param-description

/home/node/app/lib/server/WebServer.js
  13:1  warning  Missing JSDoc @param "params" description  jsdoc/require-param-description
  35:1  warning  Missing JSDoc @param "params" description  jsdoc/require-param-description
  39:1  warning  Missing JSDoc @returns description

/home/node/app/lib/utils/Logger.js
  18:1   warning  Missing JSDoc @param "level" description
  19:1   warning  Missing JSDoc @returns description
  27:1   warning  Missing JSDoc @param "message" description  (×4 methods)
  31:35  warning  Unexpected console statement  no-console
  40:34  warning  Unexpected console statement  no-console

/home/node/app/spec/registry/JobRegistry_spec.js
  301:1  warning  File has too many lines (412). Maximum allowed is 300  max-lines

/home/node/app/spec/utils/Logger_spec.js
   20:14  warning  Unexpected console statement  no-console  (×11 occurrences)
```

## Warning Categories

### 1. JSDoc `@param` and `@returns` missing descriptions
Files: `JobRegistry.js`, `WorkersRegistry.js`, `RouteRegister.js`, `Router.js`, `StatsRequestHandler.js`, `WebServer.js`, `Logger.js`

Add the missing description text to each flagged `@param` and `@returns` tag.

### 2. `no-console` in `Logger.js`
`Logger` intentionally delegates to `console.debug` and `console.info`. Since these calls are the explicit purpose of the class, suppress with inline ESLint disable comments:

```js
debug(message) {
  if (this.#shouldLog('debug')) console.debug(message); // eslint-disable-line no-console
}

info(message) {
  if (this.#shouldLog('info')) console.info(message); // eslint-disable-line no-console
}
```

### 3. `no-console` in `Logger_spec.js`
The spec uses `spyOn(console, 'debug')` etc. — these are not real console calls but ESLint flags them. Add a file-level disable at the top of the spec:

```js
/* eslint-disable no-console */
```

### 4. `max-lines` in `JobRegistry_spec.js` (412 lines > 300)
Split the spec file into two files by concern, for example:
- `JobRegistry_spec.js` — core behaviour (enqueue, pick, fail, finish, lock)
- `JobRegistry_stats_spec.js` — stats method specs

## Implementation Steps

### Step 1 — Fix JSDoc descriptions
Add description text to all flagged `@param` and `@returns` tags in:
- `source/lib/registry/JobRegistry.js`
- `source/lib/registry/WorkersRegistry.js`
- `source/lib/server/RouteRegister.js`
- `source/lib/server/Router.js`
- `source/lib/server/StatsRequestHandler.js`
- `source/lib/server/WebServer.js`
- `source/lib/utils/Logger.js`

### Step 2 — Suppress `no-console` in Logger.js
Add `// eslint-disable-line no-console` to the `console.debug` and `console.info` lines.

### Step 3 — Suppress `no-console` in Logger_spec.js
Add `/* eslint-disable no-console */` at the top of the file.

### Step 4 — Split `JobRegistry_spec.js`
Extract the `#stats` describe block into a separate file to bring the main file under 300 lines.

### Step 5 — Re-run `yarn lint`
```bash
docker-compose run --rm navi_tests yarn lint
```
Must exit with 0 warnings and 0 errors.

## Files to Change

- `source/lib/registry/JobRegistry.js` — add JSDoc descriptions
- `source/lib/registry/WorkersRegistry.js` — add JSDoc descriptions
- `source/lib/server/RouteRegister.js` — add JSDoc descriptions
- `source/lib/server/Router.js` — add JSDoc descriptions
- `source/lib/server/StatsRequestHandler.js` — add JSDoc descriptions
- `source/lib/server/WebServer.js` — add JSDoc descriptions
- `source/lib/utils/Logger.js` — add JSDoc descriptions; suppress `no-console`
- `source/spec/utils/Logger_spec.js` — suppress `no-console`
- `source/spec/registry/JobRegistry_spec.js` — extract stats specs to reduce line count
- `source/spec/registry/JobRegistry_stats_spec.js` — **new**: extracted stats specs

## Notes

- `yarn lint` already passes (0 errors). These are warnings only.
- All `no-console` suppressions in Logger are intentional — the class exists specifically to wrap console calls.
