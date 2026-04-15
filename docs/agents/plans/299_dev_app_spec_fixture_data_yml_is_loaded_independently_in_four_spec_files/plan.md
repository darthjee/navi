# Plan: dev/app/spec — Fixture data.yml is loaded independently in four spec files

## Overview

Consolidate four independent `FixturesUtils.loadYamlFixture('data.yml')` calls (one per spec file) into a single shared module `dev/app/spec/support/fixtures/testData.js` that exports the loaded data constant.

## Context

Four spec files each load the same YAML fixture at the top level:

```js
const data = FixturesUtils.loadYamlFixture('data.yml');
```

- `spec/lib/DataNavigator_spec.js`
- `spec/lib/RequestHandler_spec.js`
- `spec/lib/RouteRegister_spec.js`
- `spec/lib/Router_spec.js`

There is no single source of truth: if the fixture path or loading approach ever changes, all four files must be updated. New spec files are also likely to add a fifth independent load.

## Implementation Steps

### Step 1 — Create `testData.js`

Create `dev/app/spec/support/fixtures/testData.js`:

```js
import { FixturesUtils } from '../utils/FixturesUtils.js';

export const testData = FixturesUtils.loadYamlFixture('data.yml');
```

### Step 2 — Update `DataNavigator_spec.js`

- Add `import { testData } from '../support/fixtures/testData.js'`.
- Replace `const data = FixturesUtils.loadYamlFixture('data.yml')` with a usage of `testData`.
- Remove the `FixturesUtils` import if it is no longer used in the file.

### Step 3 — Update `RequestHandler_spec.js`

- Add `import { testData } from '../support/fixtures/testData.js'`.
- Replace `const data = FixturesUtils.loadYamlFixture('data.yml')` with a usage of `testData`.
- Remove the `FixturesUtils` import if it is no longer used in the file.

### Step 4 — Update `RouteRegister_spec.js`

- Add `import { testData } from '../support/fixtures/testData.js'`.
- Replace `const data = FixturesUtils.loadYamlFixture('data.yml')` with a usage of `testData`.
- Remove the `FixturesUtils` import if it is no longer used in the file.

### Step 5 — Update `Router_spec.js`

- Add `import { testData } from '../support/fixtures/testData.js'`.
- Replace `const data = FixturesUtils.loadYamlFixture('data.yml')` with a usage of `testData`.
- Remove the `FixturesUtils` import if it is no longer used in the file.

### Step 6 — Verify

Run `yarn lint` and `yarn test` inside `dev/app/` (via Docker) to confirm all tests pass and no linting errors are introduced.

## Files to Change

- `dev/app/spec/support/fixtures/testData.js` — new file; exports the loaded `testData` constant
- `dev/app/spec/lib/DataNavigator_spec.js` — import `testData`; remove local fixture load
- `dev/app/spec/lib/RequestHandler_spec.js` — import `testData`; remove local fixture load
- `dev/app/spec/lib/RouteRegister_spec.js` — import `testData`; remove local fixture load
- `dev/app/spec/lib/Router_spec.js` — import `testData`; remove local fixture load

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `dev/app/`: `docker-compose run --rm navi_dev_app yarn test` (CircleCI job: `jasmine-dev`)
- `dev/app/`: `docker-compose run --rm navi_dev_app yarn lint` (CircleCI job: `checks-dev`)

## Notes

- `testData.js` lives under `spec/support/fixtures/` alongside the existing `expectedResponses.js`, which is the natural home for fixture data.
- The new file must not be discovered by the test runner as a spec — it follows the support convention already in place.
- Import paths must include the `.js` extension (ESM requirement).
- Each spec file's local `data` variable should be replaced by the imported `testData` throughout — including any call sites that reference `data` by name.
