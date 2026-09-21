# Engine Plan: Reduce Codacy duplication in emission and extraction store/record/registry specs

Main plan: [plan.md](plan.md)

## Overview
The six spec files under `source/spec/` mirror each other one to one (same structure and scenarios; only class names and the record field differ: `itemRef` for emissions, `originUrl` for extractions). Extract the common scenarios into three static "shared examples" classes, following the convention of `source/spec/support/utils/JobLifecycleExamples.js` and `ActionJobExamples.js`:

- each method registers `it` blocks in the `describe` currently being defined, so it must be called from inside the caller's `describe`;
- the objects under test are received through getters/callbacks, so values built in the caller's `beforeEach` are the ones used;
- the caller keeps its own `describe` hierarchy and its own `beforeEach` arrangement, so the full spec names (describe path + `it` text) stay identical to today's;
- the class name (and field name) is passed in where it appears in an `it` text (e.g. `'creates an EmissionStore'`).

## Context
Codacy reports 18% duplication for the repository (goal: 10%). This issue covers the following files:

- `source/spec/lib/utils/emissions/EmissionStore_spec.js` and `source/spec/lib/utils/extractions/ExtractionStore_spec.js`
- `source/spec/lib/utils/emissions/EmissionRecord_spec.js` and `source/spec/lib/utils/extractions/ExtractionRecord_spec.js`
- `source/spec/lib/registry/instances/EmissionRegistryInstance_spec.js` and `source/spec/lib/registry/instances/ExtractionRegistryInstance_spec.js`

Confirmed by reading the specs:

- Shared Store scenarios: constructor (empty store, default retention 100, custom retention), retention-limit eviction (size stays at limit, oldest removed, newest kept), `#getRecords` (empty, oldest-first, returns a copy), `#getRecordById`, `#clear` (removes records, empty `getRecords`), `#size`, `#retention`, `#counts` returns a copy, `#toJSON` records oldest-first with string timestamp.
- Class-specific Store scenarios (stay in the spec files): counter contents (`{ extracted, emitted, failed, dead }` vs `{ extracted }`), `recordEmission` / `recordExtraction`, `extractionId` forwarding, `incExtracted`, "keeps counters exact past retention", counter reset after `#clear`, counters in `#toJSON`.
- Shared Record scenarios: `id`, `timestamp` is a `Date`, `#timestamp` window check, `toJSON().id` and `toJSON().timestamp` ISO string. Per-field scenarios and the "optional fields omitted" defaults are class-specific.
- Shared RegistryInstance scenarios: constructor (`store` instance of the store class, default retention 100, forwarded custom retention), `#getRecords` (oldest-first, `lastId` filter, unknown `lastId`), `#getRecordById` (match, unknown id). `#recordEmission` / `#recordExtraction`, `#incExtracted`, `#counts` and `#clear` are class-specific.

## Steps

- [01 — Add StoreExamples](engine/01-add-store-examples.md)
- [02 — Add RecordExamples](engine/02-add-record-examples.md)
- [03 — Add RegistryInstanceExamples](engine/03-add-registry-instance-examples.md)
- [04 — Verify spec count, lint and coverage](engine/04-verify.md)

## CI Checks
- `source`: `yarn test` (CI job: `jasmine`)
- `source`: `yarn lint` (CI job: `checks`)

## Notes
- Before editing anything, record the number of specs reported by `yarn test` in `source/` (jasmine prints `N specs, 0 failures`). It must be identical after the refactor. This is the acceptance check inside the PR; the Codacy reduction itself is verified manually by the issue author after merge.
- Prefer readability over maximal de-duplication: if parameterising a scenario makes a failing spec harder to read, leave it inline in the spec file.
- Do not reduce any assertion and do not change production code under `source/lib/`.
- Keep the generated `it` names identical to today's. Only `EmissionStore` / `ExtractionStore` need the article "an" (both start with a vowel), so pass the class name and build `` `creates an ${storeName}` ``.
- Each helper's JSDoc should follow the style of `JobLifecycleExamples.js` (class-level description of the convention plus `@param` docs per method).
- Emission vs extraction record identification: emissions use `itemRef`, extractions use `originUrl`; the helpers take this field name as a parameter (`keyField`) instead of hard-coding either.
