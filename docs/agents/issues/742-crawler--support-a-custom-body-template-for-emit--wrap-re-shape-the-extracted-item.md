# Issue: Crawler: support a custom body template for emit (wrap/re-shape the extracted item)

## Description
Part of #699 (Next Steps for Crawler Implementation). Split out of the #702 discussion (custom headers per `emit`), which was deliberately scoped to headers + auth only.

`EmitJob` (#676) currently sends the raw extracted item as the JSON request body of every emit POST/PUT/PATCH (`Client#emit(method, url, this.#item, ...)`). Some receiving endpoints expect the item nested inside an envelope (e.g. `{ "event": "item.extracted", "data": { ...item } }`), a fixed set of sibling fields, or a renamed/re-shaped payload.

Add an optional `emit.body_template` (name TBD) to the `emit` YAML config describing how to wrap/re-shape the extracted item before it is sent, instead of always sending the bare item.

## Solution
- `ResourceRequestEmit` gains a `bodyTemplate` attribute, validated eagerly (mirroring `headers`'s `#parseHeaders`).
- `EmitJob#perform` renders `bodyTemplate` against `this.#item` and sends the rendered result as the body instead of the bare item.
- No `body_template` configured ⇒ current behavior (send the bare item) is unchanged.

### Template language (decided)
- Reuse the existing `{:key}` token style from URL placeholder resolution (`ResourceRequestEmit#resolveUrl`), extended to support dot-paths for nested item fields, e.g. `{:address.city}`.
- A template value that is *exactly* one token (e.g. `"data": "{:address}"`) splices in the actual value from the item at that path, preserving its type (object, array, number, boolean, etc.) — not just a stringified value. This is what makes envelope-style wrapping (`{ "data": { ...item } }`) possible.
- A token embedded inside a longer string (e.g. `"note": "item {:id} extracted"`) is interpolated as a string (stringifying non-string values).
- A token whose path is missing from the item at emit time is left as the literal token in the output — consistent with `resolveUrl`'s existing behavior for unresolved URL placeholders.

### Remaining work
- `bodyTemplate` recurses through the configured template structure (objects/arrays) applying the substitution rules above to every string value found.
- Docs: crawler emit docs (`docs/guides/navi/prerequisites.md` config table + related crawler emit guide) need a `body_template` entry, documenting the token/dot-path syntax and the whole-token-splice vs interpolation distinction.

Suggested owner: `engine` specialist (`source/`).

## Benefits
- Lets a resource's `emit` target receiving endpoints that require an envelope or reshaped payload, without a bespoke client/adapter.
- Keeps the "no template ⇒ bare item" default, so existing emit configs are unaffected.
