# Reduce complexity and duplication in spec files

## Description

Several spec files in `source/spec/` and `dev/app/spec/` have grown large and contain significant duplication or complexity. This makes tests harder to read, maintain, and extend. We should refactor these specs to reduce duplication and simplify the test setup.

## Top Offenders

### `source/spec/`

#### `source/spec/utils/BaseLogger_spec.js` (214 lines)

Each log level (`info`, `debug`, `warn`, `error`, `silent`) has its own `describe` block with a `beforeEach` that creates a new logger and sets up the spy identically, followed by 4 near-identical tests checking which log methods are suppressed or forwarded. This results in ~20 essentially identical test bodies repeated with minor variations.

**Suggested fix:** introduce a parameterized helper or a shared factory that receives the level and the expected visibility matrix, and iterate over the level/outcome combinations instead of repeating them.

#### `source/spec/utils/SortedCollection_spec.js` (271 lines)

The `beforeEach` block:
```js
collection = new SortedCollection(
  [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
  { sortBy }
);
```
is duplicated verbatim in five consecutive `describe` blocks (`#select`, `#after`, `#from`, `#before`, `#upTo`). Each of those blocks also repeats the same four-element fixture.

**Suggested fix:** hoist the shared `beforeEach` to the outer `describe`, or extract a `buildCollection` factory and call it from a single shared `beforeEach`.

#### `source/spec/services/Engine_spec.js` (181 lines)

Multiple `describe` blocks repeat `jobRegistry.enqueue({ resourceRequest: {}, parameters: {} })` one or more times, and several recreate the same registry/worker/engine setup inline. The outer `beforeEach` is already complex; individual sub-describes add more setup on top of it in inconsistent ways.

**Suggested fix:** extract an `enqueueJobs(n)` helper and consolidate the per-describe setup into shared `beforeEach` blocks that compose with the outer setup.

#### `source/spec/services/ConfigLoader_spec.js` (108 lines)

Two `describe` blocks (`when the yaml file is valid` and `when the yaml misses workers definition`) both independently rebuild `expectedResources`, `expectedClients`, and `expectedWorkersConfig`. The resource and client factory calls are nearly identical between them.

**Suggested fix:** extract shared factory helpers or a `buildExpectedConfig` utility so the two blocks only override the differing values.

---

### `dev/app/spec/`

#### `dev/app/spec/app_spec.js` and `dev/app/spec/lib/Router_spec.js`

Both files test the same four HTTP routes (`GET /categories.json`, `GET /categories/:id.json`, `GET /categories/:id/items.json`, `GET /categories/:id/items/:item_id.json`) with largely identical assertions. The only structural difference is that `app_spec.js` builds the app via `buildApp()` while `Router_spec.js` wraps `new Router(data).build()` in a test Express app.

**Suggested fix:** consider whether both test files are needed, or if one tests a higher level of integration while the other tests a lower level. If so, document the distinction clearly. Either way, extract shared request assertions into a helper to eliminate the literal duplication of assertion blocks.

#### `dev/app/spec/lib/RouteRegister_spec.js` (82 lines) and `dev/app/spec/lib/RequestHandler_spec.js` (49 lines)

Both files define a local `buildTestApp` helper with a slightly different signature, then test overlapping routes (`/categories/:id/items/:item_id.json`, `/categories/:id.json`) with identical expected responses.

**Suggested fix:** share a test-app factory from a support utility, and avoid repeating expected response payloads inline.

---

## Acceptance Criteria

- Duplicated `beforeEach` setups in `SortedCollection_spec.js` are consolidated.
- Repetitive level-by-level blocks in `BaseLogger_spec.js` are replaced by a data-driven or parameterized approach.
- `Engine_spec.js` and `ConfigLoader_spec.js` use shared helpers for repeated setup.
- Overlapping route assertions between `app_spec.js` and `Router_spec.js` are deduplicated.
- `RouteRegister_spec.js` and `RequestHandler_spec.js` share fixture/app-building utilities.
- All existing tests continue to pass after refactoring.
- JSCPD (`yarn report`) shows no regressions in copy-paste detection for the affected spec files.

## Benefits

- Easier to add new tests without copy-pasting large blocks.
- Failures pinpoint the exact broken behaviour instead of breaking dozens of near-identical tests.
- Reduced cognitive overhead when reading the specs.
