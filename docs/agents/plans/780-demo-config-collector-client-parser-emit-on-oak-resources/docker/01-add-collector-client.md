# Add the collector client

Add a dedicated `collector` client to the `clients:` map in
`dockerfiles/demo_navi_hey/navi-config.yml`, alongside the existing `default` and `oak` clients. It
is the emit target for every `parser` added in the later steps and points at `$COLLECTOR_BASE_URL`
(normally set to the same URL as `$BASE_URL` — the demo dev app).

```yaml
clients:
  default:
    linkText: Target Host
    base_url: $BASE_URL
    timeout: $TIMOUT
  oak:
    linkText: Oak Application
    base_url: $OAK_BASE_URL
    timeout: $TIMOUT
  collector:
    linkText: Crawl Collector
    base_url: $COLLECTOR_BASE_URL
    timeout: $TIMOUT
```

Match the existing keys exactly: `linkText` (capital `T`), `base_url`, and the pre-existing
`$TIMOUT` spelling. Do not touch the `default` / `oak` entries.

## Files to Change

- `dockerfiles/demo_navi_hey/navi-config.yml` — add the `collector` client under `clients:`.
