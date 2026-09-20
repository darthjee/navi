# Issue: Reduce Codacy duplication in EngineController spec

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles `EngineController_spec.js`, a 403-line spec with 18 clones.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/services/engine/EngineController_spec.js` | 403 | 18 | 190 |

The top-level `beforeEach` already builds the shared `controller`, so the duplication is mostly in the per-method blocks:

- `#buildEngine`: the three idle-timeout scenarios each repeat the same `localController` construction, `spyOn(shutdown)`, `promoteReadyJobs` iteration-counter fake and `engine.start()`; they differ only in the `webConfig` and the expectation
- `#bind`: the three "clears ... when the engine emits stop" scenarios repeat the `bind` + `emit('stop')` steps and differ only in which store is seeded and asserted
- `#start`: the two scenarios repeat the same controller/fake-engine construction and assertions, differing only in `shouldAutostart`
- `#continue` / `#resumeProcessing` / `#restart` / `#reload`: repeated "does nothing when not <state>" and "stops then resumes, in order" blocks
- `#shutdown`: the "stops the engine" scenario is copied into both the "server controller present" and "no server controller" contexts
- `.build`: both scenarios rebuild the same `configStore`/`reporter` setup

## Expected Behavior
Codacy reports markedly fewer duplication clones for the file above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Refactor all the duplicated blocks listed above, not only `#bind`
- Collapse the three `#bind` stop scenarios (log buffers, emission store, extraction store) into a single table with a per-row seed and assertion (a no-op seed where none is needed), generating one `it` per row
- Extract the repeated idle-timeout setup in `#buildEngine` into a helper parameterised by `webConfig`
- Fold the other repeated blocks (`#start`, `#shutdown`, `.build`, the "does nothing when not <state>" pairs, `#restart`/`#reload`) into helpers or tables where it reads better
- Helpers that are only useful to this spec (idle-timeout runner, `#bind` table, ...) stay local to the spec file; only helpers genuinely reusable by other specs go in `source/spec/support/utils/` (which already hosts `JobRegistryUtils`, `LoggerUtils`, ...)
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected file shorter and easier to extend, so new scenarios need one line instead of a copied block
