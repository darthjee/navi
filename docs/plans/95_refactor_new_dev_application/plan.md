# Plan: Refactor `new-dev` Application (Issue #95)

## Problems

1. **`router.js` acts as a script, not a class declarer.** It creates a `Router` instance at module level and exports it directly, instead of exporting a class.
2. **`router.js` has duplicated logic.** Every route handler repeats the same pattern: extract a param, look up a record, return 404 if missing, respond with JSON.
3. **`router.js` has poorly named variables.** For example, the lambda parameter `i` (in `category.items.find((i) => ...)`) should be named `item` or another meaningful name.
4. **`data.js` acts as a script, not a class declarer.** It reads the YAML file at import time (a side effect), coupling data loading to the module system. Data should instead be loaded at the entrypoint (`server.js`) and injected as a dependency — following the same pattern as `source/bin/navi.js`, which passes the config file path to `Application` at startup.

---

## Goal

Refactor `new-dev/` so that:

- Every file under `lib/` is a class declarer (exports a class or pure function; no side effects at import time).
- `server.js` is the only script: it loads data and starts the HTTP listener.
- Route logic is DRY: a single `DataNavigator` class handles data traversal for all routes.
- All existing tests continue to pass; new unit tests cover `DataNavigator` and `Router`.

---

## New Architecture

### `DataNavigator` class (`new-dev/lib/data_navigator.js`)

Navigates a nested data object by following a sequence of steps derived from a URL path.

- A **string step** accesses a property by key: `data['categories']`.
- An **integer step** finds an element by `id`: `collection.find(item => item.id === integer)`.

Example: navigating `['categories', 1, 'items']` against the data object traverses `data.categories`, finds the entry with `id === 1`, then returns its `items` array.

The class exposes a single method:

```js
class DataNavigator {
  constructor(data, steps) { ... }

  // Returns the value reached by following steps, or null if any step fails.
  navigate() { ... }
}
```

### `Router` class (`new-dev/lib/router.js`)

Receives the loaded data object on construction and returns a configured Express `Router`.

```js
class Router {
  constructor(data) { ... }

  // Builds and returns the Express Router with all routes registered.
  build() { ... }
}
```

Each route handler delegates traversal to `DataNavigator` — no inline lookup logic.

### `app.js` (`new-dev/app.js`)

Becomes a factory function (or class) that accepts the data object and returns a configured Express app. It must not load data itself.

```js
// Option A — factory function
export default function buildApp(data) {
  const app = express();
  app.use(new Router(data).build());
  app.use((_req, res) => notFound(res));
  return app;
}
```

### `server.js` (`new-dev/server.js`) — entrypoint, remains a script

Loads data from `data.yml` and passes it to the app factory before calling `listen`.

```js
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import buildApp from './app.js';

const data = load(readFileSync('./data.yml', 'utf8'));
const app = buildApp(data);
app.listen(80);
```

### `data.js`

**Delete this file.** Its responsibility moves to `server.js`.

---

## Implementation Steps

Each step below is one atomic commit (implementation + tests together).

### Step 1 — Create `DataNavigator` class

- Create `new-dev/lib/data_navigator.js` exporting the `DataNavigator` class.
- A string step performs property access (`object[step]`).
- An integer step performs a find-by-id lookup (`array.find(item => item.id === step)`).
- `navigate()` returns `null` if any step yields `undefined` or `null`.
- Create `new-dev/spec/lib/data_navigator_spec.js` with unit tests covering:
  - Single string step (property access).
  - Single integer step (find by id).
  - Chained steps (e.g., `['categories', 1, 'items']`).
  - Returns `null` when a step fails (unknown key, id not found).

### Step 2 — Refactor `Router` into a class; inject data

- Rewrite `new-dev/lib/router.js` to export a `Router` class.
- The constructor receives the data object.
- `build()` creates and returns an Express `Router` with all route handlers.
- Each handler uses `DataNavigator` to traverse data; no inline lookup logic.
- All variable names in callbacks must be meaningful (`item`, `category`, etc.); single-letter names are not allowed.
- Create `new-dev/spec/lib/router_spec.js` with unit tests for each route using a fixture data object (do not read from disk).
- Delete `new-dev/lib/data.js`.

### Step 3 — Update `app.js` and `server.js` to use dependency injection

- Rewrite `new-dev/app.js` as a factory function (or class) that accepts the data object and returns the Express app. It must not import `data.js` or read any file.
- Update `new-dev/server.js` to load `data.yml` and pass the result to `app.js`.
- Update `new-dev/spec/app_spec.js`: construct the app by passing a fixture data object instead of importing a side-effectful module. All existing test cases must continue to pass.

---

## Acceptance Criteria

- [ ] `new-dev/lib/data.js` no longer exists.
- [ ] Every file under `new-dev/lib/` exports a class or pure function and has no side effects at import time.
- [ ] `DataNavigator` is covered by unit tests (all step types and failure cases).
- [ ] `Router` is covered by unit tests using fixture data (no disk I/O in tests).
- [ ] All existing `app_spec.js` tests pass unchanged (or updated only to inject fixture data).
- [ ] `yarn test` passes with no regressions.
- [ ] `yarn lint` passes with no errors.
