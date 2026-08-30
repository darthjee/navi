# Plan: Crawler: support a custom body template for emit (wrap/re-shape the extracted item)

Issue: [742-crawler--support-a-custom-body-template-for-emit--wrap-re-shape-the-extracted-item.md](../issues/742-crawler--support-a-custom-body-template-for-emit--wrap-re-shape-the-extracted-item.md)

## Overview

Add an optional `emit.body_template` config that reshapes the extracted item before `EmitJob` sends it as the request body, instead of always sending the bare item. `ResourceRequestEmit` gains a `bodyTemplate` attribute (validated eagerly) and a `resolveBody(item)` method that renders the template using `{:key}`/`{:nested.path}` tokens against the item — the same token family as URL placeholder resolution (`resolveUrl`), extended with dot-paths and whole-token object/array splicing. `EmitJob#perform` sends the rendered body; with no `body_template` configured, behavior is unchanged.

## Agents involved

- [engine](engine.md)
- [docs](docs.md)

## Shared contracts

The `emit.body_template` config key and its token semantics, which `docs` must describe exactly as `engine` implements them:

- **Key**: `emit.body_template` (optional), a sibling of `emit.headers` / `emit.method` / `emit.url` / `emit.client` / `emit.status` / `emit.retries` / `emit.cooldown`.
- **Shape**: a plain object or array — the desired JSON body shape, with `{:...}` tokens embedded in its string leaf values. Any other type (string, number, boolean, `null`) is invalid.
- **Token syntax**: `{:key}` or `{:nested.path}`, referencing a field on the extracted item by dot-path (e.g. `{:id}`, `{:address.city}`). The special path `{:.}` refers to the whole item (its root), for the common "wrap the whole item" case.
- **Whole-token splice**: a template string value that is *exactly* one token (nothing else in the string) resolves to the actual value at that path in the item, preserving its type — object, array, number, boolean, string, or `null`. This is what makes envelope wrapping possible, e.g. `{ "event": "item.extracted", "data": "{:.}" }` → `{ "event": "item.extracted", "data": { ...item } }`.
- **String interpolation**: a token embedded inside a longer string (e.g. `"note {:id} extracted"`) is replaced by the field's value stringified; other tokens in the same string are resolved independently.
- **Missing field**: a token whose dot-path doesn't resolve on the item at emit time is left as the literal `{:...}` text in the output — consistent with `resolveUrl`'s existing behavior for unresolved URL placeholders.
- **No template**: when `body_template` is not configured, `EmitJob` sends the bare item exactly as it does today — no behavior change.
- **Invalid template**: a `body_template` that isn't a plain object or array throws `InvalidEmitBodyTemplate` eagerly, at `ResourceRequestEmit` construction (config load time), mirroring `InvalidEmitHeaders`.
