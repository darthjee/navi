# Engine Plan: Crawler: support `equals_field` in CssSelectorParser's `filter` option

Main plan: [plan.md](plan.md)

## Overview

Extend `CssSelectorParser`'s `filter` conditions (added in #700) with an
`equals_field` comparator that compares two independently-resolved values on the
same matched container. Two production files change (`ConditionMatcher`,
`FilterMatcher`) plus a small hoist in `CssSelectorParser`; the rest is spec work.
No changes outside `source/lib/parsers/css_selector_parser/` and
`source/lib/parsers/CssSelectorParser.js` — `ResourceRequestParser`,
`PARSER_TYPES`, `InvalidParserType`, `JsonPathParser`, and the asset-discovery
`HtmlParser`/`HtmlElementParser` are all untouched. No new npm dependency, no new
exception class.

## Context

From the issue (see the linked issue file for full rationale and edge-case tables):

- **Condition shape.** Left side stays inline on the condition object (as #700's
  literal `equals`). Right side is a nested resolver config under key
  `equals_field`, e.g.
  ```js
  {
    match: '.product',
    filter: [
      {
        selector: 'a.primary', attribute: 'href',
        equals_field: { selector: 'a.canonical', attribute: 'href' }
      }
    ]
  }
  // keeps only .product containers where a.primary[href] === a.canonical[href]
  ```
- **Dispatch guard is `!= null`**, not `!== undefined` (JsonPath's check). Config
  is JSON-parsed, so `undefined` never appears; `new ValueResolver(null)` throws on
  destructuring, so `!= null` degrades `{ equals_field: null }` to literal-`equals`
  mode instead of crashing. Deliberate, documented divergence from
  `JsonPathParser`.
- **Both `equals` and `equals_field` on one condition:** `equals_field` wins
  silently at match time (the `if` branch gives this for free), plus a **one-time**
  `Logger.warn` per offending condition emitted from an `extract()`-level scan of
  the `filter` array — never from `matches()`, which runs once per container.
- **`trim` is independent per side**, each defaulting `true` via its own
  `ValueResolver`. **`array` is not supported** in filter conditions and is inert
  if present (`ValueResolver` never reads the key).
- **`===` on `string | null`.** Both sides `null` → `true` (parity with
  `JsonPathParser`). `""` (attribute found-empty) vs `null` (not found) stay
  distinct via `ValueExtractor`.
- **Config validation stays minimal** (matching #700): no new exception, no
  type-checking of the `equals_field` value, "neither `equals` nor `equals_field`"
  quirk left as-is.
- Scope out: non-equality comparators, array-shaped matching, cross-container
  comparison, type coercion, referencing `fields` output keys, OR-in-condition.

Relevant existing files:

- `source/lib/parsers/css_selector_parser/ConditionMatcher.js` — currently
  destructures `{ selector, attribute, trim, equals }`, resolves the left value
  via `ValueResolver`, returns `value === this.equals`.
- `source/lib/parsers/css_selector_parser/FilterMatcher.js` — stateless; `matches`
  short-circuits via `this.filter.every(cond => new ConditionMatcher(cond).matches(container))`.
- `source/lib/parsers/CssSelectorParser.js` — `extract()` currently does
  `.filter((container) => new FilterMatcher(filter).matches(container))`, i.e.
  constructs `FilterMatcher` **once per container**.
- `source/lib/parsers/css_selector_parser/ValueResolver.js` — constructor is
  `({ selector, attribute, trim = true } = {})`; `new ValueResolver(this.equalsField)`
  works directly when `equalsField` is `{ selector, attribute, trim }`.
- `source/lib/parsers/json_path/ConditionMatcher.js` — the sibling: destructures
  `equals_field: equalsField`, branches on `this.equalsField !== undefined`. Use as
  the naming reference (config `equals_field` → code `equalsField`).
- `source/lib/utils/logging/Logger.js` — static facade, `Logger.warn(message, attributes = {})`.
  Already used without a `logContext` in `WebServer`/`RouteRegister`/`EnvStringResolver`.
  Import path from `css_selector_parser/`: `../../utils/logging/Logger.js`.

## Implementation Steps

### Step 1 — Add `equals_field` resolution to css `ConditionMatcher`

In `source/lib/parsers/css_selector_parser/ConditionMatcher.js`:

- Destructure `equals_field: equalsField` in the constructor (snake_case config key
  → camelCase field, matching `json_path/ConditionMatcher.js`), and store
  `this.equalsField = equalsField`.
- In `matches(container)`, keep resolving `left` (the existing `value`) via
  `ValueResolver` unconditionally, then, **before** the existing literal return:
  ```js
  if (this.equalsField != null) {
    const right = new ValueResolver(this.equalsField).resolve(container);
    return left === right;
  }
  return left === this.equals;
  ```
  (Rename the local `value` → `left` for readability, or leave it — either is fine.)
- Update the JSDoc: document `condition.equals_field` as an optional
  `{ selector, attribute, trim }` config resolved relative to the same container;
  note that when present it takes precedence over `equals`, and that the guard is
  `!= null` so `equals_field: null` falls back to literal mode.

Spec additions in
`source/spec/lib/parsers/css_selector_parser/ConditionMatcher_spec.js` (spy
containers, same style as existing cases):

- `equals_field` present, both sides resolve equal → `true`; unequal → `false`.
- Both sides resolve `null` (container `querySelector` returns `null` / attribute
  absent) → `true`.
- One side `null`, other a string → `false`.
- Per-side `trim`: right side `{ ..., trim: false }` vs left trimmed → asserts the
  two `trim`s are independent.
- Right side with `attribute` vs right side without (`text` content); right side
  with absent `selector` → resolves the container itself.
- `equals` **and** `equals_field` both present → the `equals_field` branch is taken
  (result driven by the two resolutions, not by `equals`).
- `equals_field: null` → falls through to literal `equals` comparison (the `!= null`
  guard).

### Step 2 — One-time conflict warning in css `FilterMatcher` + hoist in `CssSelectorParser`

In `source/lib/parsers/css_selector_parser/FilterMatcher.js`:

- `import { Logger } from '../../utils/logging/Logger.js';`
- Add a `warnConflicts()` method (pick a name that fits the file's style if this
  one reads oddly — e.g. `warnAmbiguousConditions()`): iterate `this.filter` once
  (guard `if (!this.filter) return;`) and, for each condition where
  `condition.equals !== undefined && condition.equals_field != null`, emit a single
  `Logger.warn(...)` naming the offending condition's `selector` (and that
  `equals_field` takes precedence). No return value.
- `matches()` is unchanged.

In `source/lib/parsers/CssSelectorParser.js` `extract()`:

- Hoist the `FilterMatcher` construction out of the `.filter()` callback:
  ```js
  const filterMatcher = new FilterMatcher(filter);
  filterMatcher.warnConflicts();

  return containers
    .filter((container) => filterMatcher.matches(container))
    .map((container) => ( ... unchanged ... ));
  ```
- `FilterMatcher` is stateless, so this is a behaviour-preserving refactor that
  also removes a per-container allocation and makes the warn fire exactly once per
  `extract()` call.

Spec additions:

- `source/spec/lib/parsers/css_selector_parser/FilterMatcher_spec.js`:
  - a `filter` mixing an `equals` condition and an `equals_field` condition, AND'ed
    → `matches` returns `true` when all pass, `false` when the `equals_field` one
    fails.
  - `warnConflicts()` with a `spyOn(Logger, 'warn')`: called once per condition
    carrying both `equals` and `equals_field`; not called for clean conditions or
    when `filter` is absent/empty.
- `source/spec/lib/parsers/CssSelectorParser_spec.js`, under the existing
  `describe('filter', …)` (real HTML through `parser.extract`):
  - `equals_field` with real HTML: two `.product`s, one where
    `a.primary[href] === a.canonical[href]` and one where they differ → only the
    matching container is returned.
  - the same `equals_field` condition exercised in **both** multi-field
    (`fields: {...}`) and fallback (`field: '...'`) mode → proves mode-independence.
  - a container missing both sides' selectors → kept (both-`null` case).
  - `equals` + `equals_field` on one condition → `equals_field` wins **and**
    `Logger.warn` fired once (`spyOn(Logger, 'warn')`).
  - `array: true` inside a filter condition → ignored, no throw, scalar comparison.

## Files to Change

- `source/lib/parsers/css_selector_parser/ConditionMatcher.js` — store
  `equals_field` as `this.equalsField`; in `matches()`, when `this.equalsField != null`
  resolve the right side with `new ValueResolver(this.equalsField)` and compare
  `left === right`; JSDoc.
- `source/spec/lib/parsers/css_selector_parser/ConditionMatcher_spec.js` — cases
  listed in Step 1.
- `source/lib/parsers/css_selector_parser/FilterMatcher.js` — import `Logger`; add
  `warnConflicts()` that scans `this.filter` once and warns per condition carrying
  both `equals` and `equals_field`.
- `source/spec/lib/parsers/css_selector_parser/FilterMatcher_spec.js` — mixed
  condition + `warnConflicts` cases.
- `source/lib/parsers/CssSelectorParser.js` — hoist `new FilterMatcher(filter)` to
  a single `filterMatcher`, call `filterMatcher.warnConflicts()` before iterating,
  reuse it in the `.filter()` callback.
- `source/spec/lib/parsers/CssSelectorParser_spec.js` — integration cases under
  `describe('filter', …)`.

## CI Checks

- `source`: `cd source && npm run spec` (CI job: `jasmine`, which runs `npm run coverage`)
- `source`: `cd source && npm run lint` (CI job: `checks`, via `scripts/ci.sh lint-and-report source`)
- `source`: `cd source && npm run check_docs` — all classes carry pedantic JSDoc; keep the new/updated doc blocks clean.

## Notes

- `warnConflicts()` is a provisional name — rename to whatever matches
  `FilterMatcher`'s conventions.
- Config key is `equals_field` (snake_case); code field is `equalsField`, matching
  `json_path/ConditionMatcher.js`.
- The `!= null` guard is intentional and differs from `JsonPathParser`'s
  `!== undefined` — see the issue's "Dispatch & interaction with literal `equals`"
  section. Do not "align" it with the sibling.
- No changes to `ResourceRequestParser` / `PARSER_TYPES` / `InvalidParserType` —
  `css` filter conditions are stored unvalidated by design; validation stays at
  `extract()` time and, for this clash, is warn-only (no thrown exception).
- Existing `describe('filter', …)` block in `CssSelectorParser_spec.js` already has
  `equals` and multi-condition-AND cases — add the new cases alongside, don't
  restructure.
- If specs need to silence real console output while spying, follow whatever the
  existing suite does; `spyOn(Logger, 'warn')` alone is enough to assert calls.
