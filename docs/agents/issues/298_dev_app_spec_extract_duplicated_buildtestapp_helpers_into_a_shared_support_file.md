# Issue: dev/app/spec — Extract duplicated buildTestApp helpers into a shared support file

## Description

Three spec files each define their own `buildTestApp` function with similar but slightly different signatures, constructing minimal Express apps in the same pattern. This duplication makes maintenance fragile and confuses new contributors about which variant to use.

## Problem

- `spec/lib/RequestHandler_spec.js` defines `buildTestApp(route, data, serializer, factory)`
- `spec/lib/RouteRegister_spec.js` defines `buildTestApp(routes, data)`
- `spec/lib/Router_spec.js` defines `buildTestApp(routerData)`
- Any change to app-wiring logic must be applied in three places independently
- Inconsistent signatures with the same function name across files causes confusion
- New spec files are likely to introduce a fourth variant, compounding the problem

## Expected Behavior

- A single shared support file exports named builder functions, one per spec context
- Each spec file imports the appropriate function and removes its local definition
- App-wiring logic lives in one place, making changes simple and consistent

## Solution

- Create `dev/app/spec/support/utils/AppFactory.js` exporting named builders:
  ```js
  export const buildRequestHandlerApp = (route, data, serializer = null, factory = null) => { ... };
  export const buildRouteRegisterApp  = (routes, data) => { ... };
  export const buildRouterApp         = (data) => { ... };
  ```
- Update `dev/app/spec/lib/RequestHandler_spec.js` to import `buildRequestHandlerApp`
- Update `dev/app/spec/lib/RouteRegister_spec.js` to import `buildRouteRegisterApp`
- Update `dev/app/spec/lib/Router_spec.js` to import `buildRouterApp`
- Remove all three local `buildTestApp` definitions

## Benefits

- Single source of truth for Express app construction in tests
- Reduces maintenance cost when app-wiring logic changes
- Eliminates naming confusion — each builder has a descriptive, unambiguous name
- Sets a clear pattern for future spec files to follow

## Affected Files

- `dev/app/spec/lib/RequestHandler_spec.js`
- `dev/app/spec/lib/RouteRegister_spec.js`
- `dev/app/spec/lib/Router_spec.js`
- `dev/app/spec/support/utils/AppFactory.js` (new)

---
See issue for details: https://github.com/darthjee/navi/issues/298
