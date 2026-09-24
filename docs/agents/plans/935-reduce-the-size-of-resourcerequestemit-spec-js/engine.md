# Engine Plan: Reduce the size of ResourceRequestEmit_spec.js

Main plan: [plan.md](plan.md)

## Overview
Shrink `source/spec/lib/models/request/resource_request/ResourceRequestEmit_spec.js` from 457 lines to under 300. Every resulting file must be under 300 lines, with the same behaviors asserted.

## Context
- `constructor` (lines 10–242, ~235 lines): about 170 of these lines are repeated validation cases for `retries`, `cooldown`, `headers` and `body_template`. `retries` and `cooldown` are identical apart from the attribute name, the error class, and the sample values.
- `#disabled` (lines 244–321, ~80 lines) is already table-driven. It stays as is.
- `#resolveBody` (lines 323–447, ~125 lines) has independent cases with no shared setup.
- Table-driving the constructor alone saves roughly 100 lines, which still leaves ~340. The `#resolveBody` split is therefore needed, not optional.
- Sibling splits for #932 (`ResourceRequest_*_spec.js`) and #933 (`emit_job/EmitJob_*_spec.js`) set the naming convention: `<Class>_<topic>_spec.js` in the same folder.

## Implementation Steps

### Step 1 — Table-drive the constructor validation cases
In `ResourceRequestEmit_spec.js`:
- Replace the `retries` and `cooldown` blocks with one shared loop over `[{ attr: 'retries', error: InvalidEmitRetries, positive: 5, nonNumeric: 'five' }, { attr: 'cooldown', error: InvalidEmitCooldown, positive: 5000, nonNumeric: 'five thousand' }]`. Inside `describe(attr, ...)` keep the same five cases: not given → `undefined`; positive → value; `0` → `0`; negative → throws; non-numeric → throws.
- For `headers` and `body_template`, keep the "not given" and valid-value cases as they are. Collapse the invalid cases into `[{ description, value }].forEach(...)` tables, each asserting that the constructor throws the right error class. For `headers` that covers array, primitive and nested object; for `body_template` it covers string, number, explicit `null` and a class instance.
- A small local helper is optional, e.g. `const build = (attrs) => new ResourceRequestEmit({ method: 'POST', url: '/emit', ...attrs })`. `ResourceRequestEmitFactory.build` already exists in `source/spec/support/factories/`, but it passes explicit `undefined`s. Only use it where that does not change behavior: for `body_template: null` the literal constructor call must stay.
- Keep the `client`/`method`/`url` cases and `.fromObject` unchanged.

### Step 2 — Move `#resolveBody` to its own spec file
- Create `source/spec/lib/models/request/resource_request/ResourceRequestEmit_resolveBody_spec.js` with `describe('ResourceRequestEmit', () => { describe('#resolveBody', ...) })`. Move every `#resolveBody` case into it verbatim, importing only `ResourceRequestEmit`.
- Remove the block from `ResourceRequestEmit_spec.js`, along with any imports left unused.
- Expected sizes: `ResourceRequestEmit_spec.js` ~220 lines, `ResourceRequestEmit_resolveBody_spec.js` ~130 lines.

## Files to Change
- `source/spec/lib/models/request/resource_request/ResourceRequestEmit_spec.js` — table-drive the constructor validations and remove `#resolveBody`.
- `source/spec/lib/models/request/resource_request/ResourceRequestEmit_resolveBody_spec.js` — new file holding the `#resolveBody` cases.

## CI Checks
- `source`: `yarn spec` / `npm run coverage` (CI job: coverage for `source`)
- `source`: `yarn lint` (CI job: `lint-and-report` for `source`)

## Notes
- Compare the number of specs Jasmine reports for these files before and after the change, to confirm that no examples were dropped. Table-driven `it`s expand at runtime, so grepping for `it(` is not reliable.
- Do not touch production code in `source/lib/`.
