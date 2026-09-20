# Engine Plan: Reduce Codacy duplication in CSS selector parser specs

Main plan: [plan.md](plan.md)

## Overview
Codacy reports 27 clones in `ConditionMatcher_spec.js` and 26 in `CssSelectorParser_spec.js`. Both are spec-only refactors under `source/spec/`; no file under `source/lib/` changes. The approach follows the #871 precedent (`source/spec/support/utils/JobRegistryScenarios.js`): shared fixture builders in `source/spec/support/utils/`, plus arrays of cases looped over `it`.

## Context
- `ConditionMatcher_spec.js`: the `equals_field` block (lines 52-212) has seven scenarios that each rebuild the same `querySelector` spy returning the primary or canonical element by selector; only the element stubs and the expected boolean differ.
- `CssSelectorParser_spec.js`: the two-product `primary`/`canonical` HTML repeats (lines 262-273, 327-338, 357-363), and the `.product` container with a single `.tag`/`.stock` child repeats across the array, default and filter blocks. Most cases share the shape `(rawBody, attributes) -> toEqual(...)`.
- The two helpers are not shared between the specs: they build different kinds of fixtures.
- Out of scope: the other specs in `source/spec/lib/parsers/css_selector_parser/` (`FilterMatcher`, `FieldsMapper`, `ValueExtractor`, `ValueResolver`, `ArrayValueResolver`).

## Implementation Steps

### Step 1 — Refactor `ConditionMatcher_spec.js`
Add a stub-builder helper in `source/spec/support/utils/` (e.g. `ConditionMatcherUtils.js`, static methods with JSDoc, same style as `LoggerUtils`/`JobRegistryScenarios`) that builds:
- an element stub reading an attribute (`getAttribute` spy) or text (`{ text }`),
- a container stub whose `querySelector` spy returns the primary or canonical element by selector (or `null`).

Then table-drive the `equals_field` cases (both sides equal, different, both null, one null, right side `trim: false`, attribute-vs-text, right side omits selector, `equals` also present) as an array of `{ description, ... , expected }` looped over `it`, keeping the `describe('when equals_field is given')` wrapper and a meaningful description per case. Cases needing a different container shape (e.g. right side omits selector, where the container itself carries `text`) may stay hand-written or accept an optional container override in the helper — pick whichever reads better. Leave the non-`equals_field` scenarios (literal equals, selector absent, trim false, `equals_field` null) as they are unless a tiny use of the helper removes obvious duplication.

### Step 2 — Refactor `CssSelectorParser_spec.js`
Add an HTML fixture-builder helper in `source/spec/support/utils/` (e.g. `CssSelectorHtmlFixtures.js`) providing the repeated markup: the `.product` container with optional tags/stock/category/title children, and the two-product `primary`/`canonical` link markup.

Then table-drive the same-shape `extract` cases (`(rawBody, attributes) -> toEqual(...)`): fallback mode (attribute given / absent / trim false / empty / missing attribute), array true/false (multiple matches, no matches, trim false), and the null/empty cases. Keep hand-written the cases with a unique setup: the two error-throwing cases, the `Logger.warn` spy case (`equals` + `equals_field`), the fallback-vs-multi-field `equals_field` case, and the invalid-HTML case. Keep each case's description meaningful so a failure still names the scenario.

## Files to Change
- `source/spec/support/utils/ConditionMatcherUtils.js` (new) — element/container stub builders for `ConditionMatcher_spec.js`
- `source/spec/support/utils/CssSelectorHtmlFixtures.js` (new) — HTML fixture builders for `CssSelectorParser_spec.js`
- `source/spec/lib/parsers/css_selector_parser/ConditionMatcher_spec.js` — use the stub builders; table-drive the `equals_field` cases
- `source/spec/lib/parsers/CssSelectorParser_spec.js` — use the HTML fixtures; table-drive the same-shape `extract` cases

## CI Checks
- `source`: `cd source && npm test` (CI job: source test job in `.circleci/config.yml`)
- `source`: `cd source && npm run lint` (CI job: source lint job in `.circleci/config.yml`)

## Notes
- Every existing scenario and assertion must remain: count `it` cases before and after (the table-driven ones must expand to the same number) and confirm coverage of `ConditionMatcher.js`/`CssSelectorParser.js` does not drop.
- No production code changes.
- Prefer readability over maximal de-duplication; do not introduce abstractions that make a failing spec harder to read.
- New helper files need JSDoc (the repo lints `jsdoc`) and must follow `sort-class-members` ordering.
- Codacy's post-merge figures are the real measure of success; the file names above are suggestions and can change if a clearer name emerges.
