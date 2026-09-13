# Emit Configuration

`emit` declares a follow-up HTTP call that sends onward the items produced by the resource's [`parser`](extraction-configuration.md) — instead of (or in addition to) chaining into another resource via `actions`/`paginated_actions`, each extracted item is sent to an external endpoint. It lives under a resource entry's `emit:` key. `emit` is **not** automatic: it does nothing unless the same resource entry also declares a `parser:` block (see [Extraction Configuration](extraction-configuration.md)) — there is no extraction, and therefore nothing to emit, without one.

### Fields

| Field | Description |
|-------|-------------|
| `emit.client` | The client to use for this emit request. Either a bare client name (shorthand, resolved in the resource's own namespace, falling back to `default`), or an object with an explicit target `namespace` — same shape as a resource's top-level `client` (see [Splitting Configuration Across Files](splitting-configuration.md)). Defaults to the `default` client when omitted. |
| `emit.method` | The HTTP method used for the emit request. Must be one of `POST`, `PUT`, `PATCH`. Required. |
| `emit.url` | The URL to emit the request to. Supports `{:placeholder}` tokens resolved from the parameters inherited by the item's chain. Required. |
| `emit.status` | The expected status code of the emit response. |
| `emit.retries` | The maximum number of retries for this emit, overriding the built-in default of `5`. Must be a non-negative number when given. |
| `emit.cooldown` | The cooldown, in milliseconds, applied between emit retries, overriding the built-in default of `5000`. Must be a non-negative number when given. |
| `emit.headers` | A map of extra HTTP headers to send with this emit request, merged over the client's own headers. Values must be strings, numbers, or booleans. Defaults to no extra headers when omitted. |
| `emit.enabled` / `emit.disabled` | Optional. Toggles this emit on/off without editing the rest of the resource's config — see [Enabling/Disabling an Emit](#enablingdisabling-an-emit) below. Defaults to enabled when both are omitted. |

### Body Template

By default, `emit` sends the bare extracted item as the request body, unchanged. `emit.body_template` lets you reshape or wrap that item into a different JSON shape before it's sent — useful for wrapping the item in an envelope, renaming fields, or dropping fields the endpoint doesn't need.

`body_template` is a plain object or array — the desired JSON body shape — with `{:...}` tokens embedded in its string leaf values:

- **`{:key}`** — resolves to the value of `key` on the extracted item.
- **`{:nested.path}`** — resolves to a nested field, following the dot-path (e.g. `{:address.city}`).
- **`{:.}`** — the special path referring to the whole item (its root). This is what makes wrapping the entire item straightforward.

A template string value that is *exactly* one token (nothing else in the string) splices in the real value at that path, preserving its type — object, array, number, boolean, string, or `null`. A token embedded inside a longer string (e.g. `"note {:id} extracted"`) is replaced by the field's value stringified instead. A token whose path doesn't resolve on the item is left as the literal `{:...}` text in the output.

### Enabling/Disabling an Emit

`emit.enabled` and `emit.disabled` let you toggle a resource's emit on/off without touching the rest of its config. Since every Navi config file already runs through `$VAR`/`${VAR}` environment variable substitution before YAML parsing (see [Reference](reference.md)), pointing one of these keys at an env var reference is enough to flip a resource's emit per environment — no new mechanism, just the same substitution used everywhere else in the config.

Both keys are optional booleans. Only a literal `true`/`false` participates in the resolution — an omitted key, or a value that resolves to anything else (e.g. an unset env var, which substitutes to an empty string), is inert and has no effect either way. The resolved effective state is:

- **Disabled** when `disabled` resolves to `true` (regardless of what `enabled` resolves to), or when `enabled` resolves to `false`.
- **Enabled** otherwise — including when both keys are omitted (today's default), and when either key resolves to something other than a literal `true`/`false`.

| `enabled` | `disabled` | Effective |
|-----------|------------|-----------|
| *(absent)* | *(absent)* | enabled |
| *(absent)* | `true` | disabled |
| *(absent)* | `false` | enabled |
| `true` | *(absent)* | enabled |
| `true` | `true` | disabled |
| `true` | `false` | enabled |
| `false` | *(absent)* | disabled |
| `false` | `true` | disabled |
| `false` | `false` | disabled |

Disabling an emit only skips its follow-up HTTP call — the resource's `parser` still runs and items are still extracted, they simply aren't sent onward. The `emit` block is still fully validated at config-load time regardless of the resolved value: a bad `method`, a missing `url`, or invalid `headers`/`body_template` all still throw, even for a disabled emit.

> **Not the same as the resource-level `disabled`/`enabled`.** A resource-request entry's own top-level `disabled`/`enabled` (see [Configuration Schema](configuration-schema.md)) is resolved with the identical combination rule, but it gates the *entire request*, excluding it from every enqueue path (startup, manual/API trigger, and as an `actions`/`paginated_actions` target). `emit.enabled`/`emit.disabled` only scopes down to the emit itself — the request still runs and still parses/extracts; only its follow-up emit call is skipped.

#### Example — toggling emit per environment

```yaml
resources:
  products:
    - url: /products.json
      status: 200
      parser:
        type: json_path
        fields:
          id: id
          name: name
      emit:
        client: analytics_api
        method: POST
        url: /events
        status: 202
        enabled: $ANALYTICS_EMIT_ENABLED
```

With `ANALYTICS_EMIT_ENABLED=false` in the environment, `products`' emit is skipped entirely — nothing is ever sent to `analytics_api` — while the resource keeps extracting items normally. Unset the variable (or set it to anything other than the literal text `false`) to fall back to the default, enabled. No edit to the resource's YAML is needed to flip this per environment (e.g. off in staging, on in production).

### Example

```yaml
resources:
  products:
    - url: /products.json
      status: 200
      parser:
        type: json_path
        # match omitted — the whole response body is the array of items
        fields:
          id: id
          name: name
      emit:
        client: analytics_api
        method: POST
        url: /events
        status: 202
        body_template:
          event: item.extracted
          data: "{:.}"
```

For an extracted item `{ "id": 1, "name": "Widget" }`, Navi sends:

```json
{
  "event": "item.extracted",
  "data": { "id": 1, "name": "Widget" }
}
```

If `emit` had no `body_template`, the bare item (`{ "id": 1, "name": "Widget" }`) would be sent as-is.

**Related:** [Extraction Configuration](extraction-configuration.md) — declaring the `parser:` block that produces the items `emit` sends.

**Related sample:** [Emit every extracted item to an external endpoint](samples/emit-extracted-items.md), [Reshape the emitted body with a template](samples/emit-body-template.md)

**See it live:** the public [`navi-hey` demo](https://navi-hey-demo.tamanduati.tech/) emits extracted items from four Oak resources — one per parser type — to a `collector` client backed by a logging endpoint on the demo app; watch it on the [Emissions dashboard](https://navi-hey-demo.tamanduati.tech/#/emissions).

[← Back to How to Use Navi](../how_to_use_navi.md)
