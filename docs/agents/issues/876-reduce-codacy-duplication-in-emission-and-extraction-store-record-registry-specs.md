# Issue: Reduce Codacy duplication in emission and extraction store/record/registry specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the emission and extraction spec pairs, which mirror each other almost one to one.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/utils/emissions/EmissionStore_spec.js` | 195 | 16 | 157 |
| `source/spec/lib/utils/extractions/ExtractionStore_spec.js` | 155 | 13 | 133 |
| `source/spec/lib/utils/emissions/EmissionRecord_spec.js` | 108 | 5 | 52 |
| `source/spec/lib/utils/extractions/ExtractionRecord_spec.js` | 66 | 5 | 52 |
| `source/spec/lib/registry/instances/EmissionRegistryInstance_spec.js` | 90 | 6 | 60 |
| `source/spec/lib/registry/instances/ExtractionRegistryInstance_spec.js` | 75 | 5 | 48 |

- The Emission* and Extraction* specs are parallel: same structure, same scenarios, different class and field names (Store: 16 and 13 clones; Record: 5 each; RegistryInstance: 6 and 5)

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass, still verify the same scenarios, and the total number of specs is the same before and after).

## Solution
- Introduce shared examples parameterised by the class under test and its record factory, invoked from each of the mirrored spec files
- Follow the existing shared-examples convention (see `JobLifecycleExamples` and `ActionJobExamples`): a static class whose methods register `it` blocks inside the caller's `describe`, receiving the objects under test through getters so values built in the caller's `beforeEach` are the ones used
- Create one helper per spec kind in `source/spec/support/utils/`: `StoreExamples.js`, `RecordExamples.js` and `RegistryInstanceExamples.js`
  - Store: constructor retention, retention-limit eviction, `getRecords`, `getRecordById`, `clear`, `size`, `retention`, `counts` copy and `toJSON` records scenarios
  - Record: `id`, `timestamp` and `toJSON` id/timestamp scenarios
  - RegistryInstance: constructor, `getRecords` (including `lastId`) and `getRecordById` scenarios
- Keep the class-specific scenarios in their own files (counters, `recordEmission` vs `recordExtraction`, `extractionId`, field defaults)
- Keep the generated `it` names identical to today's (e.g. `'creates an EmissionStore'`, `'returns all records oldest-first'`) by passing the class name and the field used to tell records apart (`itemRef` vs `originUrl`) into the helpers, so failures read the same and before/after spec counts are easy to compare
- Verification of the Codacy reduction is done manually by the issue author after merge; within the PR, `yarn test` must show the same number of passing specs before and after
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block

