# oak_templates: regex parser over the JS bundle name + emit

Attach a `parser` + `emit` block to the **first** request entry of `oak_templates`
(`url: /?ajax=true`, `client: oak`, `status: 200`) in `dockerfiles/demo_navi_hey/navi-config.yml`.
Leave the remaining `oak_templates` entries untouched.

`GET /?ajax=true` returns the same SPA shell as `GET /`, including
`<script type="module" crossorigin src="/assets/index-<hash>.js"></script>`. A `regex` parser
captures the hashed bundle filename into a single field. `regex` requires `parser.match` (first
capture group is the value) and `parser.field` (the output key name).

```yaml
  oak_templates:
    - url: /?ajax=true
      client: oak
      status: 200
      parser:
        type: regex
        match: 'src="/assets/(index-[^"]+\.js)"'
        field: bundle
      emit:
        client: collector
        method: POST
        url: /collector/oak-templates
    - url: /categories?ajax=true
      client: oak
      status: 200
    # ... remaining entries unchanged
```

Emits one `POST $COLLECTOR_BASE_URL/collector/oak-templates` with body
`{ "bundle": "index-<hash>.js" }`.

The pattern uses a wildcard for the hash (`index-[^"]+\.js`) — never a literal hash, which changes
on every Oak deploy. `match` is a YAML single-quoted string so the `\.` and `"` are literal;
re-fetch and confirm the pattern still matches at implementation time.

## Files to Change

- `dockerfiles/demo_navi_hey/navi-config.yml` — add `parser` + `emit` to the first `oak_templates`
  entry.
