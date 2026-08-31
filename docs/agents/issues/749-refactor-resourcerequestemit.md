# Issue: Refactor ResourceRequestEmit

## Description

Our `ResourceRequestEmit` (`source/lib/models/request/ResourceRequestEmit.js`) is too big and needs some refactoring: it mixes construction/validation with URL resolution and a full body-template rendering pipeline (template walk, string interpolation, token resolution).

## Problem

`ResourceRequestEmit` currently owns validation, URL token resolution, and the entire body-template rendering pipeline (template walk, string interpolation, token resolution) as private methods on a single class. This makes each concern hard to test in isolation and hard to reason about independently.

`resolveUrl`'s logic is also duplicated verbatim in `ResourceRequest.js` (`str.replace(/\{:(\w+)\}/g, ...)`), so the same fix needs to land in two places today whenever URL-token resolution changes.

## Expected Behavior

This is a pure refactor — no behavior change is expected. The following existing behaviors are easy to accidentally break during extraction and should be explicitly covered by tests on the new classes:

- **Whole-token vs. partial-token distinction** — a template string that is *only* a `{:key}` token resolves to the value **verbatim, unstringified** (may be an object, array, number, boolean). The same token embedded in a longer string gets `String(value)`-coerced. These must remain genuinely different code paths, not unified.
- **`undefined` vs. falsy-but-defined values** — only `value === undefined` triggers the "leave the token unresolved" fallback. `null`, `0`, `false`, `''` are real resolved values and get rendered (e.g. `null` stringifies to `"null"` in partial interpolation). Don't broaden this into a general falsy-check.
- **Non-plain-object template nodes** (e.g. a `Date` in the template) — currently falls into the "plain object" branch (`typeof === 'object'`) and gets flattened via `Object.entries` (e.g. a `Date` becomes `{}`). Preserve this as current behavior; changing it would be a separate, explicit decision.
- **Missing intermediate path segments** — dot-path resolution uses optional chaining (`current?.[segment]`), so e.g. `{:a.b.c}` against `{a: null}` resolves to `undefined` rather than throwing. Must survive the move to `TokenResolver`.

## Solution

Extract responsibilities into dedicated, single-responsibility classes living alongside the existing models in `source/lib/models/request/` — following the precedent already set by `ClientReference.js` (a small static-method class shared between `ResourceRequest` and `ResourceRequestEmit`).

All extracted classes follow the existing `ClientReference.parse(...)` convention: stateless, static-method classes — no instantiation, since none of them hold any state.

### URL resolution

- Extract a shared class (e.g. `UrlTokenResolver`, with a static `resolve(url, parameters)`) that both `ResourceRequestEmit` and `ResourceRequest` delegate to, eliminating the duplication rather than just moving it inside `ResourceRequestEmit`.

### Body template rendering

The four related private methods (`resolveBody`, `#renderTemplate`, `#renderString`, `#resolveToken`) become a small composed hierarchy of static-method classes — each with a single responsibility, rather than one monolithic class or four independently-called classes:

- **`TokenResolver`** (static `resolve(path, item)`) — dot-path resolution against an item (`#resolveToken`'s job): resolves `key`/`nested.path`/`.` tokens.
- **`TemplateStringRenderer`** (static `render(str, item)`) — whole-token vs. interpolation logic (`#renderString`'s job); calls into `TokenResolver`.
- **`BodyTemplateRenderer`** (static `render(node, item)`) — walks the template (array/object recursion, `#renderTemplate`'s job) and exposes the public entrypoint used by `resolveBody`; calls into `TemplateStringRenderer` for string nodes.

`ResourceRequestEmit#resolveBody` becomes a thin delegation to `BodyTemplateRenderer.render(...)`.

`TokenResolver` (dot-path, used by body templates) and `UrlTokenResolver` (flat key lookup, used by URLs) stay **separate** classes — they have different lookup semantics (dot-path vs. flat key, different regexes, different fallback behavior for unresolved tokens) and merging them would overload a single class with two resolution strategies.

Other extractions may surface during implementation as long as they follow the same single-responsibility-class pattern.

## Benefits

- Each concern (URL token resolution, dot-path resolution, string interpolation, template walking) becomes independently unit-testable.
- Removes the verbatim `resolveUrl` duplication between `ResourceRequestEmit` and `ResourceRequest`.
- `ResourceRequestEmit` shrinks to construction/validation plus thin delegation, matching the existing `ClientReference.js` extraction pattern already used elsewhere in `source/lib/models/request/`.
