# Issue: dev/app/spec — Fixture data.yml is loaded independently in four spec files

## Description

Four spec files each call `FixturesUtils.loadYamlFixture('data.yml')` at the top level with no shared abstraction. The fixture is always loaded the same way, but each file independently declares the same constant with no single source of truth.

## Problem

- `spec/lib/DataNavigator_spec.js` loads the fixture independently
- `spec/lib/RequestHandler_spec.js` loads the fixture independently
- `spec/lib/RouteRegister_spec.js` loads the fixture independently
- `spec/lib/Router_spec.js` loads the fixture independently
- If the fixture path or loading approach changes, all four files must be updated
- New spec files are likely to add a fifth independent load instead of reusing a shared constant

## Expected Behavior

- A single shared module exports the loaded fixture data
- Each spec file imports the shared constant instead of loading the fixture independently
- The fixture loading logic lives in one place

## Solution

- Create `dev/app/spec/support/fixtures/testData.js` exporting the loaded fixture:
  ```js
  import { FixturesUtils } from '../utils/FixturesUtils.js';
  export const testData = FixturesUtils.loadYamlFixture('data.yml');
  ```
- Replace the four independent `FixturesUtils.loadYamlFixture('data.yml')` calls with `import { testData } from '../support/fixtures/testData.js'`
- Remove the now-unused `FixturesUtils` imports from files that no longer use it directly

## Benefits

- Single source of truth for fixture loading
- Reduces maintenance cost if the fixture path or loading approach changes
- Sets a clear pattern for future spec files to follow

## Affected Files

- `dev/app/spec/lib/DataNavigator_spec.js`
- `dev/app/spec/lib/RequestHandler_spec.js`
- `dev/app/spec/lib/RouteRegister_spec.js`
- `dev/app/spec/lib/Router_spec.js`
- `dev/app/spec/support/fixtures/testData.js` (new)

---
See issue for details: https://github.com/darthjee/navi/issues/299
