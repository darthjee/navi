# Plan: Create shared test factories for common domain objects

## Overview

Create `ResourceRequestJobFactory.js` in `source/spec/support/factories/` and replace all inline
`new ResourceRequestJob(...)` constructions in the affected spec files with calls to
`ResourceRequestJobFactory.build(overrides)`.

## Context

The issue originally proposed creating `JobFactory.js`, `ResourceFactory.js`, and `ClientFactory.js`.
Analysis of the codebase shows that `ClientFactory.js`, `ResourceFactory.js`,
`ResourceRequestFactory.js`, `ClientRegistryFactory.js`, and `JobRegistryFactory.js` already exist
and are in active use.

The remaining gap is a test support factory for `ResourceRequestJob` instances. The following
inline constructions remain in the spec suite:

- `source/spec/lib/models/ResourceRequestJob_spec.js` — 3 occurrences of
  `new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters })`
- `source/spec/lib/models/Worker_spec.js` — 1 occurrence of the same pattern

Note: the duplicated `beforeEach`/`afterEach` setup blocks in the 8 `JobRegistry_*_spec.js` files
are a shared-context problem, not a factory problem — they are covered by issue #259 and are
excluded from this plan.

## Implementation Steps

### Step 1 — Create `ResourceRequestJobFactory.js`

Create `source/spec/support/factories/ResourceRequestJobFactory.js` following the existing factory
convention (static `build(overrides)` method with JSDoc):

```js
import { ResourceRequestJob } from '../../../lib/models/ResourceRequestJob.js';
import { ClientRegistryFactory } from './ClientRegistryFactory.js';
import { ResourceRequestFactory } from './ResourceRequestFactory.js';

class ResourceRequestJobFactory {
  static build({
    id = 'id',
    resourceRequest = ResourceRequestFactory.build(),
    clients = ClientRegistryFactory.build(),
    parameters = {}
  } = {}) {
    return new ResourceRequestJob({ id, resourceRequest, clients, parameters });
  }
}

export { ResourceRequestJobFactory };
```

Defaults:
- `id`: `'id'` — matches the value used in every current inline construction.
- `resourceRequest`: `ResourceRequestFactory.build()` — the canonical default request.
- `clients`: `ClientRegistryFactory.build()` — the canonical default client registry.
- `parameters`: `{}` — empty parameters, overridden when specific values are needed.

### Step 2 — Update `ResourceRequestJob_spec.js`

Add an import for `ResourceRequestJobFactory` and replace the 3 inline constructions:

| Location | Current | Factory call |
|----------|---------|--------------|
| Top-level `beforeEach` (line 31) | `new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters })` | `ResourceRequestJobFactory.build({ resourceRequest, clients, parameters })` |
| Parameterized URL `beforeEach` (line 119) | `new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters })` | `ResourceRequestJobFactory.build({ resourceRequest, clients, parameters })` |
| Empty parameters `beforeEach` (line 140) | `new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters })` | `ResourceRequestJobFactory.build({ resourceRequest, clients, parameters })` |

The `clients` variable is constructed from `ClientRegistryFactory.build({ default: client })` in
the top-level `beforeEach`. Since it differs from the factory default, it must be passed explicitly.

### Step 3 — Update `Worker_spec.js`

Add an import for `ResourceRequestJobFactory` and replace the 1 inline construction:

| Location | Current | Factory call |
|----------|---------|--------------|
| `#process` `beforeEach` (line 78) | `new ResourceRequestJob({ id: 'id', resourceRequest, clients, parameters })` | `ResourceRequestJobFactory.build({ resourceRequest, clients, parameters })` |

## Files to Change

- `source/spec/support/factories/ResourceRequestJobFactory.js` — **create**: new factory class
- `source/spec/lib/models/ResourceRequestJob_spec.js` — add import, replace 3 inline constructions
- `source/spec/lib/models/Worker_spec.js` — add import, replace 1 inline construction

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `jasmine`)
- `source/`: `yarn lint` (CircleCI job: `checks`)
- `source/`: `yarn report` (CircleCI job: `checks` — JSCPD duplication report)

## Notes

- No production code changes — this is purely a test-support refactor.
- The `id: 'id'` default is intentional: the current test suite always uses the literal string
  `'id'` for `ResourceRequestJob` instances built directly. Tests that need a specific ID can
  override it.
- `ResourceRequestJob_spec.js` is the spec for `ResourceRequestJob` itself, so the subject under
  test is still explicit — the factory only removes the repetitive constructor call.
