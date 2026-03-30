# Plan: Reduce Spec Duplication (Issue #66)

## Overview

Reduce copy-paste duplication across the main application spec files in `source/spec/`.
Changes are grouped by file, from highest to lowest impact.

---

## 1. `spec/registry/WorkersRegistry_spec.js`

**Problem:** Six `describe` blocks (`#setBusy`, `#setIdle`, `#hasBusyWorker`, `#hasIdleWorker`,
`#getIdleWorker`) each declare their own `let workers / busy / idle` variables and contain nearly
identical `beforeEach` blocks.

**Fix:**
- Move `let workers; let busy; let idle;` to the outer `describe('WorkersRegistry')` scope.
- Expand the outer `beforeEach` to initialise all five collections, create a `quantity: 1`
  `WorkersRegistry` with explicit `busy`/`idle`, call `initWorkers()`, and resolve `worker` and
  `worker_id` from `workers.byIndex(0)`.
- Remove the now-redundant `beforeEach` from `#setBusy`, `#hasBusyWorker`, `#hasIdleWorker`,
  and `#getIdleWorker`.
- Reduce `#setIdle`'s `beforeEach` to just `workerRegistry.setBusy(worker_id)`.
- Keep `#constructor` and `#initWorkers` with their own overriding `beforeEach` blocks (they
  need quantity=3 and an uninitialised registry).

**Reduction:** ~30 lines removed (three identical 7-line `beforeEach` blocks become zero;
one 7-line block becomes one line).

---

## 2. `spec/registry/ClientRegistry_spec.js`

**Problem:** The `#getClient` section has eight `describe` blocks that each declare their own
`let clientRegistry` and set it up in a local `beforeEach`. Three of them create an identical
`new ClientRegistry({ default: defaultClient, other: otherClient })`. Two create
`new ClientRegistry({ other: otherClient })`. Two create a registry with three clients.

**Fix:**
- Group the three identical-registry describes under a single parent `describe` with one shared
  `beforeEach`.
- Group the two `{ other: otherClient }` describes under a single parent `describe` with one
  shared `beforeEach`.
- Group the two three-client describes under a single parent `describe` with one shared
  `beforeEach`.
- Remove all the now-redundant local `let clientRegistry` declarations and `beforeEach` blocks.

**Reduction:** ~18 lines removed.

---

## 3. `spec/models/Config_spec.js` — `#getClient`

**Problem:** Identical pattern to `ClientRegistry_spec.js`. The `#getClient` tests have six
`describe` blocks that each build a `new Config({ resources: {}, clients: {...} })`. Three use
the same client map.

**Fix:** Same grouping approach as `ClientRegistry_spec.js`.

**Reduction:** ~12 lines removed.

---

## 4. `spec/services/ConfigLoader_spec.js`

**Problem:** In the `'when the yaml file is valid'` and `'when the yaml misses workers
definition'` describes, the same `configFilePath` and `config` are constructed once inside every
`it` block (3 times each).

**Fix:**
- Extract `let config;` and `let configFilePath;` into each `describe` scope.
- Add a `beforeEach` that builds `configFilePath` and calls `ConfigLoader.fromFile(configFilePath)`.
- Simplify each `it` block to just the assertion.

**Reduction:** ~12 lines removed.

---

## 5. `spec/models/Job_spec.js`

**Problem:** In `describe('#process') > 'when the client request is successful'`, the second
`it` block ("increments attempts and sets lastError on failure") is an **exact copy** of the
first `it` block. Same body, same assertions, but a misleading description that implies a
different scenario.

**Fix:** Remove the duplicate `it` block entirely.

**Reduction:** ~9 lines removed.

---

## 6. `spec/models/Worker_spec.js`

**Problem:** `spyOn(console, 'error').and.stub()` appears in both
`'when the client request is successful'` and `'when the client request fails'` `beforeEach`
blocks inside `describe('#process')`.

**Fix:** Move `spyOn(console, 'error').and.stub()` to the `describe('#process')` `beforeEach`
that already sets up `resourceRequest`, `client`, `clients`, `parameters`, and `job`.

**Reduction:** ~1 line removed (small but removes a copy-paste risk).

---

## Implementation Order

1. `WorkersRegistry_spec.js` — largest change, most mechanical
2. `ClientRegistry_spec.js` — straightforward grouping
3. `Config_spec.js` — same pattern as ClientRegistry
4. `ConfigLoader_spec.js` — lift `beforeEach` within two describes
5. `Job_spec.js` — delete duplicate `it` block
6. `Worker_spec.js` — move `spyOn` up one level

## Verification

After each file change, run the affected spec inside the tests container:
```bash
npx jasmine spec/registry/WorkersRegistry_spec.js
npx jasmine spec/registry/ClientRegistry_spec.js
npx jasmine spec/models/Config_spec.js
npx jasmine spec/services/ConfigLoader_spec.js
npx jasmine spec/models/Job_spec.js
npx jasmine spec/models/Worker_spec.js
```

Then run the full suite: `yarn spec`.
