# Plan: Consolidate repeated afterEach registry-reset blocks to top-level describe

## Overview

Remove three identical `afterEach(() => { ResourceRegistry.reset(); })` blocks from sibling
`describe` blocks in `Config_spec.js` and replace them with a single `afterEach` at the outermost
`describe('Config', ...)` level.

## Context

The issue listed four files as affected. After reading each file, three are already correctly
structured:

| File | Status |
|------|--------|
| `Router_spec.js` | Single `afterEach` at top-level — already correct |
| `WebServer_spec.js` | Single `afterEach` at top-level — already correct |
| `ResourceRequestAction_spec.js` | Single `afterEach` inside `#execute` only — correct, since other describes do not use registries |
| `Config_spec.js` | Three `afterEach` blocks calling `ResourceRegistry.reset()` at the same sibling level — **needs change** |

Only `Config_spec.js` needs a change.

## Current state of `Config_spec.js`

```js
describe('Config', () => {
  describe('#getResource', () => {
    afterEach(() => { ResourceRegistry.reset(); });  // line 22
    ...
  });

  describe('#getClient', () => {
    afterEach(() => { ResourceRegistry.reset(); });  // line 51
    ...
  });

  describe('.fromFile', () => {
    afterEach(() => { ResourceRegistry.reset(); });  // line 152
    ...
  });
});
```

All three `afterEach` blocks are identical and guard against `ResourceRegistry` state leaking
between tests. Jasmine executes parent `afterEach` hooks after each test regardless of nesting
depth, so moving the reset to the outer `describe` is equivalent and eliminates the repetition.

## Implementation Steps

### Step 1 — Add a single top-level `afterEach` to `Config_spec.js`

Add one `afterEach(() => { ResourceRegistry.reset(); })` immediately inside the outermost
`describe('Config', ...)` block, before the first nested `describe`.

### Step 2 — Remove the three nested `afterEach` blocks

Delete the individual `afterEach` from `describe('#getResource')` (line 22),
`describe('#getClient')` (line 51), and `describe('.fromFile')` (line 152).

## Target state

```js
describe('Config', () => {
  afterEach(() => {
    ResourceRegistry.reset();
  });

  describe('#getResource', () => { ... });
  describe('#getClient', () => { ... });
  describe('.fromFile', () => { ... });
});
```

## Files to Change

- `source/spec/lib/models/Config_spec.js` — remove 3 `afterEach` blocks, add 1 at top level

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)
- `source/`: `yarn report` (CircleCI job: `checks` — JSCPD duplication report)

## Notes

- No production code changes — this is purely a test cleanup.
- Jasmine's `afterEach` propagates from outer to inner scopes, so a top-level `afterEach` runs
  after every `it` in every nested `describe`, making it functionally identical to three separate
  inner `afterEach` blocks that all do the same thing.
- `Router_spec.js`, `WebServer_spec.js`, and `ResourceRequestAction_spec.js` require no changes.
