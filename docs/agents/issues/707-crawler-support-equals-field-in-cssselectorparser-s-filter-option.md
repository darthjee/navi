# Issue: Crawler: support `equals_field` in CssSelectorParser's `filter` option

## Context

#700 adds a `css` parser (`CssSelectorParser`) to `ParserRegistry`, including a `filter` option for excluding matched containers before field mapping — mirroring `JsonPathParser`'s `filter`. That issue scopes `filter` conditions to literal `equals` comparisons only (`{ selector, attribute, trim, equals }`), deferring `JsonPathParser`'s other comparator, `equals_field` (comparing two fields on the same item), to this follow-up.

## Description

`JsonPathParser`'s `equals_field` condition (`{ field, equals_field }`) compares two keys already present on the same raw matched item — cheap, since both sides are plain object lookups. For `CssSelectorParser`, there's no equivalent "raw keys" on a DOM element: each side of the comparison needs its own full selector resolution (`{ selector, attribute, trim }`) relative to the same container.

This issue designs the exact condition shape (naming of the two sides, whether `trim`/`array` apply independently to each side) and implements it as an addition to `CssSelectorParser`'s `filter` option from #700. The resolved design is below.

## Condition shape

The left side stays **inline** on the condition object (exactly as `#700` shipped it for literal `equals`); the right side is a **nested `ValueResolver` config** under the key `equals_field`:

```js
{
  match: '.product',
  filter: [
    {
      selector: 'a.primary', attribute: 'href',                    // left side — inline, unchanged from #700
      equals_field: { selector: 'a.canonical', attribute: 'href' } // right side — nested { selector, attribute, trim, ... }
    }
  ]
}
// keeps only .product containers where a.primary[href] === a.canonical[href]
```

Rationale (Option A of the design discussion):

- **Purely additive** — literal-`equals` conditions from `#700` (`{ selector, attribute, trim, equals }`) are unchanged byte-for-byte.
- **Parity with `JsonPathParser`** — same `equals_field` key name and the same "compare against another extracted value" mental model; `ConditionMatcher.matches` dispatches on a single `equals_field`-present check, mirroring the JsonPath sibling (the exact guard is `!= null` — see below).
- **Reuses `ValueResolver`** — the right side is resolved with `new ValueResolver(this.equalsField).resolve(container)` against the same container, the same class already used for the left side.
- The inline-left / nested-right asymmetry is the same asymmetry `JsonPathParser`'s condition already has (`field` vs. `equals_field`).

Decisions:

- **Key name:** `equals_field` (retained for cross-parser familiarity; the nested-object value already signals it is a selector config, not a literal).
- **Mutual exclusivity with `equals`:** a condition carries *either* `equals` *or* `equals_field`, never both. If both are present, `equals_field` takes precedence (matches JsonPath's `if (equalsField !== undefined)` ordering). Whether to instead hard-reject a condition carrying both is left to the validation topic.

Rejected alternatives:

- **Symmetric `{ left: {...}, equals_field: {...} }`** — reads better in isolation but introduces a second way to express the left side within one `filter` array (inline for `equals`, nested `left` for `equals_field`), making `ConditionMatcher` detect which shape it got. Inconsistent within a single feature.
- **Fully symmetric, always-nested (`{ left, equals }` / `{ left, right }`)** — cleanest long-term but a breaking change to `#700`'s just-shipped literal condition and all its specs; this issue is scoped as additive.
- **Referencing a pre-computed `fields` output key** — impossible: `#700` runs `filter` *before* `fields` mapping, so no output keys exist at filter time.

## Dispatch & interaction with literal `equals`

`ConditionMatcher.matches` resolves the left side once (unconditionally), then a single branch decides the right-hand operand:

```js
matches(container) {
  const left = new ValueResolver({
    selector: this.selector, attribute: this.attribute, trim: this.trim,
  }).resolve(container);

  if (this.equalsField != null) {
    const right = new ValueResolver(this.equalsField).resolve(container);
    return left === right;
  }

  return left === this.equals;
}
```

- **Guard is `!= null`, not `!== undefined`** (JsonPath's check). Config is JSON-parsed and admin-authored, so `undefined` can never appear — only `null`. `new ValueResolver(null)` throws on destructuring, so under `!== undefined` a `{ equals_field: null }` condition would crash; `!= null` degrades it to literal-`equals` mode instead. A small, deliberate divergence from `JsonPathParser`.
- **Both `equals` and `equals_field` present:** `equals_field` wins silently at match time (the `if` branch gives this for free, matching JsonPath's precedence). Additionally, a **one-time `Logger.warn`** is emitted per offending condition from an `extract()`-level scan of the `filter` array — *not* from `matches()`, which runs once per container. `Logger` here is the static `source/lib/utils/logging/Logger.js` (already used without a `logContext` in `WebServer`/`RouteRegister`/`EnvStringResolver`), so this does not reintroduce the `logContext` dependency `#700` deliberately avoided. This clash is a static config error, never a normal runtime event, so surfacing it does not conflict with `#700`'s "silent on zero matches" rule.
- **Neither `equals` nor `equals_field` present:** unchanged pre-existing `#700` behavior — `left === undefined` is never true (`ValueResolver` returns `null`, never `undefined`), so the condition excludes every container. Out of scope to change here; noted for the validation topic.

The `extract()`-level filter scan that locates the `equals` + `equals_field` clash is the same place a stricter variant would `throw` a config exception (cf. `MissingParserMatch`/`MissingParserField`) instead of warning — see the validation topic for the warn-vs-throw decision.

## Per-side `trim` and `array`

**`trim` — independent per side, no design needed.** The left side reads `this.trim`; the right side reads `this.equalsField.trim`. Each is handed to its own `new ValueResolver(...)`, where `trim = true` is the default. The two are fully independent:

```js
{ selector: '.a', equals_field: { selector: '.b', trim: false } }
// left trimmed (default), right compared untrimmed
```

**`array` — not supported in `filter` conditions, either side.**

- `#700` scopes `array` as a `fields`-multi-field-mode-only option; its `filter` conditions are scalar-only (`ValueResolver`, never `ArrayValueResolver`). `#707` stays consistent.
- Keeps `===` a valid comparison — no array-equality semantics to define. `equals_field` compares two resolved **scalars**, mirroring `JsonPathParser`'s `item[a] === item[b]`.
- Array-shaped matching (any element matches / all match / set equality) is a distinct comparator, deferred (see scope).
- If `array: true` appears inside a filter condition it is **inert** — `ValueResolver` never reads the key, so both sides resolve as scalars (`querySelector` semantics: first match, `null` when none). Whether to warn on an ignored `array` in a filter is left to the validation topic.

## Config validation

Baseline: `ResourceRequestParser` (`source/lib/models/request/ResourceRequestParser.js`) stores parser-specific keys (`filter`, `fields`, `field`) *unvalidated* by design — the parser layer interprets them at `extract()` time, throwing `AppError` subclasses (`MissingParserMatch`, `MissingParserField`) for config errors. `#700` does **no** structural validation of `filter` condition shapes. `#707` keeps validation minimal and consistent with that.

- **`equals` + `equals_field` on one condition:** no new exception. Silent `equals_field` precedence at match time, plus the one-time `Logger.warn` from the `extract()`-level filter scan (as described above). Deliberately *not* upgraded to a thrown config error — non-fatal, the crawl still runs with defined precedence, and it matches `JsonPathParser`'s actual behavior (its `ConditionMatcher` silently lets `equals_field` win).
- **Inert `array` in a filter condition:** silent. `#700` ignores extraneous keys everywhere; a per-condition warn would be noise and it is not wrong enough to fail.
- **Neither `equals` nor `equals_field`:** unchanged pre-existing `#700` behavior (condition excludes every container). Out of scope for `#707`.
- **Malformed `equals_field` value** (a string/number/array instead of an object): no type validation added. `new ValueResolver(x)` destructures all of these without throwing and degrades to "container itself / text content"; only `null` throws, and that is already handled by the `!= null` guard. `#700` does not type-check `selector`/`attribute` either — adding checks only for `equals_field` would be inconsistent. A "validate all filter conditions" effort is a separate, broader ticket.

## Scope boundaries

Out of scope for `#707`:

- **Non-equality comparators** — `not_equals`, `contains`, regex `matches`, `greater_than`/`less_than`, `in` (membership). `#707` is strictly field-to-field `===`; both `JsonPathParser` and `CssSelectorParser` filters are equality-only today.
- **Array-shaped matching** — "any element matches", "all match", set equality, "left contains right". Needs `ArrayValueResolver` in the filter path plus array-equality semantics. A separate comparator, deferred.
- **Cross-container / document-level comparison** — both sides of `equals_field` resolve relative to the *same* matched container. Comparing against an element outside the `match` set is out.
- **Type coercion** — `===` only. Resolved values are always `string | null` (from `ValueExtractor`), so no "compare as number/boolean".
- **Referencing `fields` output keys** — impossible (`filter` runs before field mapping).
- **OR / multiple right-hand sides in one condition** — a condition is one left, one right, AND'ed across the `filter` array.

In scope for free: `equals_field` works in **both** multi-field and fallback single-field mode, since `filter` is mode-independent in `#700` and `ConditionMatcher` only sees the container.

## Edge cases

Comparison is `left === right`, each side `string | null`.

- **Both sides `null`** (neither side's selector/attribute resolves) → `null === null` → `true` → container kept. **No special guard** — `JsonPathParser` already treats "both keys absent" as equal (`undefined === undefined`); Css matches for parity. Intended behavior.
- **One side `null`, other a string** → `false` → container excluded.
- **Attribute `""` vs. attribute absent** → `"" === null` → `false`. Inherits `#700`'s found-empty (`""`) vs. not-found (`null`) distinction via `ValueExtractor`.
- **Attribute `""` on both sides** → `"" === ""` → `true`.
- **Trim mismatch** (`"  x  "` vs `"x"` with `trim: false` on one side) → `false`. Independent per-side `trim` (see above).
- **Either selector matches multiple elements** → first match (`querySelector` semantics), same as `#700`'s literal-`equals` left side. No `array` in filters.
- **Self-comparison** (`.a` vs `.a`, same `attribute`/`trim`) → always `true`. Valid-but-pointless config; left silent, no warn.
- **`equals_field: {}`** (empty object) → `!= null` → field mode; resolves the container's own text content. Valid. Contrast `equals_field: null` → literal mode → compares `left` against `undefined` → always `false`.

## Testing strategy

Follows `#700`'s two-layer pattern: spy-based unit specs per helper class plus real-HTML integration specs through `CssSelectorParser#extract`.

**`ConditionMatcher_spec.js`** (unit, spy containers):

- `equals_field` present → both sides resolved relative to the container; `true` when equal, `false` when not.
- Both sides `null` → `true` (parity behavior).
- One side `null` → `false`.
- Per-side `trim` independence — right side `trim: false` vs. left trimmed.
- Right side `attribute` vs. text content; right side selector absent → container itself.
- `equals` and `equals_field` both present → `equals_field` branch taken.
- `equals_field: null` → falls through to literal `equals` mode (the `!= null` guard).

**`FilterMatcher_spec.js`** (unit, spy containers):

- Mixed `equals` + `equals_field` conditions AND'ed → `true` when all pass, `false` when the `equals_field` one fails.
- The one-time `Logger.warn` on an `equals` + `equals_field` clash, with a `Logger` spy.

**`CssSelectorParser_spec.js`** (integration, real HTML), under the existing `describe('filter', …)`:

- `equals_field` with real HTML: two `.product`s, one where `a.primary[href] === a.canonical[href]`, one where they differ → only the match returned.
- The same `equals_field` condition exercised in both multi-field and fallback mode (proves mode-independence).
- Container missing both sides' selectors → kept (both-`null` case).
- `equals` + `equals_field` on one condition → `equals_field` wins and `Logger.warn` fired once (`Logger` spy).
- Inert `array` inside a filter condition → ignored, no throw.

No new exception class, so no exception spec.

**Structural change — one-time clash scan.** `CssSelectorParser.extract` currently does `new FilterMatcher(filter)` per container (inside the `.filter()` callback), so a constructor-side warn would fire once per container. Hoist `new FilterMatcher(filter)` to a single construction in `extract`, then call an explicit `filterMatcher.warnConflicts()` (or similar) once before iterating. `FilterMatcher` is stateless, so hoisting is a pure refactor that also removes a per-container allocation and gives the warn a clean, testable seam.

## Backward compatibility

Purely additive:

- Existing literal-`equals` conditions are untouched — no pre-`#707` config uses `equals_field`, so `this.equalsField != null` is always false for them and `ConditionMatcher.matches` still hits `return left === this.equals`.
- The `FilterMatcher` hoist is a pure internal refactor (stateless class, identical inputs/outputs, no config or API surface change).
- The new `Logger.warn` cannot fire for existing configs — it triggers only on an `equals` + `equals_field` clash on one condition, which no pre-`#707` config can express.
- No changes to `ResourceRequestParser` / `PARSER_TYPES` / `InvalidParserType` (`css` already registered by `#700`), no new npm dependency (`ValueResolver` + `node-html-parser` already present), no `JsonPathParser` changes — `#707` only touches `source/lib/parsers/css_selector_parser/` and `CssSelectorParser.js`.
- Stored configs deserialize identically — `filter` is stored as-is by `ResourceRequestParser`; adding an optional key is compatible.

## Performance & security

- `equals_field` adds one more `ValueResolver.resolve` (one `querySelector` + one attr/text read) per such condition per container — same order of work as the left side already does and as a `#700` `fields` entry. Complexity stays `O(containers x conditions)`; a ~2x constant on conditions using `equals_field` (two resolutions vs. one).
- No new limits gap: `#700` already noted no response-size or match-count bound exists in the parser layer; `equals_field` does not introduce one.
- Right side uses `querySelector` (single), not `querySelectorAll` — no `array` in filters, so no fan-out.
- `FilterMatcher` short-circuits via `.every()`, and `filter` runs before `fields` mapping, so excluded containers cost nothing downstream.
- Trust boundary unchanged: both sides' `selector`/`attribute` are admin-authored config, same as `#700`'s `match`/`fields`/`filter` and `RegexParser`'s regex. The untrusted response body is only ever the target of selectors. CSS selectors carry no ReDoS risk.
- No new attack surface: no eval/dynamic code, no new dependency, no new IO. The one-time conflict scan is `O(conditions)` per `extract`.

## Suggested owner

`engine` specialist.
