# Plan: dev/app/spec — Extract duplicated buildTestApp helpers into a shared support file

## Overview

Consolidate three nearly-identical `buildTestApp` local helper functions (one per spec file) into a single shared support module `dev/app/spec/support/utils/AppFactory.js` that exports distinctly-named builder functions.

## Context

Three spec files each define a local `buildTestApp` function that constructs a minimal Express app for testing purposes:

- `spec/lib/RequestHandler_spec.js` — `buildTestApp(route, data, serializer, factory)`
- `spec/lib/RouteRegister_spec.js` — `buildTestApp(routes, data)`
- `spec/lib/Router_spec.js` — `buildTestApp(routerData)`

All three follow the same basic pattern but with different signatures and wiring details. This forces any future change to app construction logic to be applied in three places, and the shared function name creates confusion about which variant applies in a given context.

## Implementation Steps

### Step 1 — Create `AppFactory.js`

Create `dev/app/spec/support/utils/AppFactory.js` exporting three named builder functions, one per spec context:

```js
export const buildRequestHandlerApp = (route, data, serializer = null, factory = null) => { ... };
export const buildRouteRegisterApp  = (routes, data) => { ... };
export const buildRouterApp         = (data) => { ... };
```

Each function should contain exactly the logic currently in the corresponding local `buildTestApp`.

### Step 2 — Update `RequestHandler_spec.js`

- Add an import for `buildRequestHandlerApp` from `../support/utils/AppFactory.js`.
- Replace every call to the local `buildTestApp(...)` with `buildRequestHandlerApp(...)`.
- Remove the local `buildTestApp` definition.

### Step 3 — Update `RouteRegister_spec.js`

- Add an import for `buildRouteRegisterApp` from `../support/utils/AppFactory.js`.
- Replace every call to the local `buildTestApp(...)` with `buildRouteRegisterApp(...)`.
- Remove the local `buildTestApp` definition.

### Step 4 — Update `Router_spec.js`

- Add an import for `buildRouterApp` from `../support/utils/AppFactory.js`.
- Replace every call to the local `buildTestApp(...)` with `buildRouterApp(...)`.
- Remove the local `buildTestApp` definition.

### Step 5 — Verify

Run `yarn lint` and `yarn test` inside `dev/app/` (via Docker) to confirm all tests pass and no linting errors are introduced.

## Files to Change

- `dev/app/spec/support/utils/AppFactory.js` — new file; exports the three named builder functions
- `dev/app/spec/lib/RequestHandler_spec.js` — import `buildRequestHandlerApp`; remove local helper
- `dev/app/spec/lib/RouteRegister_spec.js` — import `buildRouteRegisterApp`; remove local helper
- `dev/app/spec/lib/Router_spec.js` — import `buildRouterApp`; remove local helper

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app/`: `docker-compose run --rm navi_dev_app yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app/`: `docker-compose run --rm navi_dev_app yarn lint` (CircleCI job: `checks-dev`)

## Notes

- The new `AppFactory.js` is a support utility — it must not be discovered by the test runner as a spec. Place it under `spec/support/utils/` which is the existing convention for non-spec helpers (e.g. `FixturesUtils.js` already lives there).
- Import paths must include the `.js` extension (ESM requirement).
- The three builder function bodies should be extracted verbatim from the current local definitions — no logic changes in this PR.
