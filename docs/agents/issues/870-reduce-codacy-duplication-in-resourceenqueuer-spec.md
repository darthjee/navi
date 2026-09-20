# Issue: Reduce Codacy duplication in ResourceEnqueuer spec

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles `ResourceEnqueuer_spec.js`, whose scenarios repeat the same setup and expectations several times.

Figures below come from Codacy's analysis of `main` at `f25bf98`; the file has since grown (currently 296 lines), so line numbers are approximate.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/utils/ResourceEnqueuer_spec.js` | 236 (at `f25bf98`) | 27 | 184 |

- Every scenario builds its own `ResourceRequest` → `Resource` → `Namespace` → `NamespaceMap` fixture by hand, repeating the same 3-4 lines (e.g. the `home_page` and `categories` resources appear verbatim in several `it` blocks)
- The 'skips …' scenarios (`not_found`, `needs_params`, `disabled`, disabled + needs params) only differ in the fixture and the expected reason, yet each repeats the whole enqueue + `not.toHaveBeenCalled` + `toEqual` skeleton
- The `toHaveBeenCalledWith('ResourceRequestJob', { resourceRequest, parameters })` expectation is repeated across scenarios
- Some blocks were also shared with `ApiEngineStartHandler_spec.js`; that duplication was addressed by #869 (merged), which added `NamespaceMapUtils` and `ApplicationStateUtils` under `source/spec/support/utils/`

## Expected Behavior
Codacy reports markedly fewer duplication clones for `ResourceEnqueuer_spec.js`, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Reuse `NamespaceMapUtils.build` (added by #869) for the namespace/resource/request fixtures instead of hand-building them in each scenario
- `NamespaceMapUtils` only supports one enabled request per resource today; extend it (backwards-compatibly, keeping #869's specs untouched) so a resource can also be described as disabled, rather than adding a second helper with the same purpose
- Collapse the near-identical 'skips …' scenarios into parameterised cases, keeping each scenario's descriptive title
- Extract the repeated `ResourceRequestJob` enqueue expectation into a helper if it removes meaningful duplication
- New or extended helpers belong in `source/spec/support/utils/`, alongside `JobRegistryUtils`, `LoggerUtils`, etc.
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected file shorter and easier to extend, so new scenarios need one line instead of a copied block
- Consolidates fixture-building on the shared `NamespaceMapUtils` helper
