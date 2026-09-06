# oak_home: css parser over <head> asset tags + emit

Attach a `parser` + `emit` block to the single request entry of `oak_home` (`url: /`,
`client: oak`, `status: 200`) in `dockerfiles/demo_navi_hey/navi-config.yml`. Leave the existing
`assets:` block on that entry untouched — the `css` parser and the asset warmer run independently.

Oak is a SPA: `GET /` returns only a shell. The only repeated markup is the `<head>` `<link>` tags
(`<link rel="icon" ... href="/assets/favicon-<hash>.png">` and
`<link rel="stylesheet" ... href="/assets/index-<hash>.css">`). Use them as the repeated container
for a multi-field `css` extraction — selector `link[href]`, reading the `rel` and `href` attributes.
This yields ~2 items, satisfying the non-zero `itemCount` requirement.

```yaml
  oak_home:
    - url: /
      client: oak
      status: 200
      assets:
        - selector: 'link[rel="stylesheet"]'
          attribute: href
        - selector: 'script[src]'
          attribute: src
      parser:
        type: css
        match: 'link[href]'
        fields:
          rel:
            attribute: rel
          href:
            attribute: href
      emit:
        client: collector
        method: POST
        url: /collector/oak-home
```

Each matched `<link>` is emitted as `POST $COLLECTOR_BASE_URL/collector/oak-home` with body
`{ "rel": "icon" | "stylesheet", "href": "/assets/..." }`.

Re-fetch `https://oak.ffavs.net/` at implementation time and confirm `link[href]` still matches ≥ 1
element; adjust the selector if Oak's shell markup has changed. Do **not** hard-code an asset hash.

## Files to Change

- `dockerfiles/demo_navi_hey/navi-config.yml` — add `parser` + `emit` to the `oak_home` entry.
