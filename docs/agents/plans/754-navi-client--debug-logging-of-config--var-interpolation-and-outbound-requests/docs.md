# docs Plan: navi-client: debug logging of config $VAR interpolation and outbound requests

Main plan: [plan.md](plan.md)

## Shared contracts

- CLI flag `--log-level <level>` (no short form) and env var `LOG_LEVEL`, both accepting `debug`/`info`/`warn`/`error`/`silent`; flag wins when both are given; default `info`.
- Under `debug`: interpolation logging reports resolved value **length + hash only, never the raw value**; outbound-request logging reports method/URL/body and **never** the `Authorization` header/bearer token.

## Implementation Steps

### Step 1 — Document `--log-level`/`LOG_LEVEL` in the CLI usage section

Add a row to the existing options table in `clients/node/README.md`'s `## CLI usage` section (after `--payload`, before the `--file`/`--json`/`--yaml` rows, matching the existing table's ordering by general-purpose-then-config-specific flags):

```markdown
| `--log-level` | | One of `debug`, `info`, `warn`, `error`, `silent`. Defaults to the `LOG_LEVEL` env var, or `info`. Takes precedence over `LOG_LEVEL` when both are given. |
```

Add a short paragraph right after the options table (before the existing usage-example code blocks) explaining what `debug` surfaces, in the same terse style as the existing prose in that section:

> Setting `LOG_LEVEL=debug` (or `--log-level debug`) additionally logs each `$VAR`/`${VAR}` resolved while parsing a config file (name, set/unset status, and — when set — the resolved value's length and a short hash, never the raw value) and every outbound HTTP request the CLI makes (method, URL, body) — request headers, including the bearer token, are never logged at any level.

### Step 2 — Cross-check the library-usage section stays consistent

Re-read the `## Library usage` section (above `## CLI usage`) — it already documents `${VAR}`/`$VAR` env resolution (line ~62) without mentioning logging, since the `Logger` module and `--log-level` are CLI-only wiring per the plan (`NaviClient`'s library API itself doesn't gain a `logLevel` constructor option). Confirm no change is needed there; only touch it if `navi-client`'s implementation ends up exposing logging configuration through the library API too (not planned as of this write-up).

## Files to Change

- `clients/node/README.md` — add the `--log-level` row + explanatory paragraph to `## CLI usage`, as above.

## Notes

- Wait for `navi-client`'s Step 02 (wire `LOG_LEVEL`/`--log-level`) to land first, so the flag name and precedence documented here matches the implementation exactly — don't guess ahead of it.
