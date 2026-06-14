# Plan: Do Not Run Web Server When No Web Port Is Defined

## Overview

Fix `ConfigParser#webConfig()` to return `null` when the `web.port` value in the YAML config is `null`, `""`, `false`, or `"false"`, so that no web server is started and the process exits cleanly in those cases.

## Context

When the YAML config contains a `web:` section with a falsy `port` (e.g. `port: null`), the parser still constructs a `WebConfig` object because `this.config.web` is a truthy object `{ port: null }`. This non-null `WebConfig` causes:

1. `WebServer.build()` to create and start a WebServer (listening on `null`/`undefined` port).
2. `ApplicationInstance.buildEngine()` to set `keepAlive: true`, preventing the engine from ever stopping.

As a result, in CI environments the process never exits after tests complete.

## Implementation Steps

### Step 1 — Guard against falsy port in `ConfigParser#webConfig()`

In `source/lib/services/ConfigParser.js`, update the private `#webConfig()` method to check whether the port is a valid (truthy, non-`"false"`) value after confirming the `web` section exists. Return `null` if the port is absent or falsy.

```js
#webConfig() {
  if (!this.config.web) return null;
  const { port } = this.config.web;
  if (!port || port === 'false') return null;
  return new WebConfig(this.config.web);
}
```

Values treated as "no port":
- `null`
- `''` (blank string)
- `false` (boolean)
- `'false'` (string)

### Step 2 — Add YAML fixture(s) for falsy port configs

Add fixture files under `source/spec/support/fixtures/config/` to cover each falsy port variant, for example:

- `sample_config_with_null_web_port.yml` — `web: { port: null }`
- `sample_config_with_false_web_port.yml` — `web: { port: false }` (also covers `'false'` via separate test)
- `sample_config_with_blank_web_port.yml` — `web: { port: '' }`

All other fields can mirror `sample_config.yml`.

### Step 3 — Add tests to `ConfigParser_spec.js`

In `source/spec/lib/services/ConfigParser_spec.js`, add cases inside the existing `.fromObject` describe block:

```
when web.port is null      → webConfig is null
when web.port is ''        → webConfig is null
when web.port is false     → webConfig is null
when web.port is 'false'   → webConfig is null
```

## Files to Change

- `source/lib/services/ConfigParser.js` — add port guard in `#webConfig()`
- `source/spec/lib/services/ConfigParser_spec.js` — add tests for each falsy port value
- `source/spec/support/fixtures/config/sample_config_with_null_web_port.yml` — new fixture
- `source/spec/support/fixtures/config/sample_config_with_false_web_port.yml` — new fixture
- `source/spec/support/fixtures/config/sample_config_with_blank_web_port.yml` — new fixture

## Notes

- No changes are needed to `WebConfig`, `WebServer`, or `ApplicationInstance` — the fix is purely in the parsing layer.
- The `Engine`'s `keepAlive` flag derives from `!!this.config.webConfig`, so returning `null` from `#webConfig()` automatically prevents keepAlive mode too.
- YAML parses `port: null` as the JavaScript value `null`, `port: false` as `false`, and `port: ''` as `''` — all naturally falsy and covered by `!port`.
- The string `"false"` requires an explicit `=== 'false'` check because it is a truthy string.

## CI Checks

Before opening a PR, run the following checks for the folders being modified:

- `source/`: `yarn test` (CircleCI job: `test`)
- `source/`: `yarn lint` (CircleCI job: `lint`)
