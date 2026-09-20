# Issue: Reduce Codacy duplication in CSS selector parser specs

## Description
Codacy reports 18% code duplication for the repository (the project goal is 10%). This issue tackles the two CSS selector parser specs, which enumerate many selector cases with hand-written, near-identical `it` blocks.

Figures below come from Codacy's analysis of `main` at `f25bf98`.

## Problem
| File | Lines | Clones | Duplicated lines |
| --- | ---: | ---: | ---: |
| `source/spec/lib/parsers/css_selector_parser/ConditionMatcher_spec.js` | 197 | 27 | 255 |
| `source/spec/lib/parsers/CssSelectorParser_spec.js` | 347 | 26 | 183 |

- `ConditionMatcher_spec.js` (27 clones): the `equals_field` block (lines 52-212) holds seven scenarios that each rebuild the same `querySelector` spy returning the primary or canonical element by selector; only the element stubs and the expected boolean differ
- `CssSelectorParser_spec.js` (26 clones): the same two-product `primary`/`canonical` HTML is repeated (lines 262-273, 327-338, 357-363), and the `.product` container with a single `.tag`/`.stock` child is repeated across the array, default and filter blocks; most cases share the shape `(rawBody, attributes) -> toEqual(...)`
- Scenarios of that shape (fixture in, expected value out) are a natural fit for a data table

## Expected Behavior
Codacy reports markedly fewer duplication clones for the files above, and behaviour is unchanged (the affected specs still pass and still verify the same scenarios).

## Solution
- Add one helper per spec under `source/spec/support/utils/` (where shared spec helpers such as `JobRegistryUtils`, `LoggerUtils` and `JobRegistryScenarios` already live):
  - a stub builder for `ConditionMatcher_spec.js` (element and container spies)
  - an HTML fixture builder for `CssSelectorParser_spec.js`
  - the two helpers are not shared between the specs, since they build different kinds of fixtures
- Table-drive only cases that differ solely by inputs and expectation (an array of cases looped over `it`, following the `JobRegistryScenarios` precedent from #871):
  - `ConditionMatcher_spec.js`: the `equals_field` cases
  - `CssSelectorParser_spec.js`: the same-shape `extract` cases (fallback mode, array true/false, null/empty cases)
- Leave cases with a unique setup hand-written (e.g. the `Logger.warn` spy case and the fallback-vs-multi-field `equals_field` case)
- Keep each case's description meaningful so failures still identify the case that broke
- Keep every existing assertion and scenario: the refactor must not reduce what the specs verify or change any production code
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read

## Out of Scope
- The other specs in `source/spec/lib/parsers/css_selector_parser/` (`FilterMatcher`, `FieldsMapper`, `ValueExtractor`, `ValueResolver`, `ArrayValueResolver`) are not part of this issue

## Benefits
- Lowers the repository duplication percentage reported by Codacy
- Makes the affected files shorter and easier to extend, so new scenarios need one line instead of a copied block
