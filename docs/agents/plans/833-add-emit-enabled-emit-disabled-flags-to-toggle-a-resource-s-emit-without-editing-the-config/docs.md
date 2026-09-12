# Docs Plan: Add emit.enabled / emit.disabled flags to toggle a resource's emit without editing the config

Main plan: [plan.md](plan.md)

## Shared contracts

- Config keys `resources.<name>[].emit.enabled` / `.disabled` (booleans, or
  a `$VAR`/`${VAR}` reference resolving to the literal text `true`/`false`).
- Resolution rule to document verbatim: disabled when `disabled: true` was
  given (regardless of `enabled`), or when `enabled: false` was given;
  otherwise enabled (the default, including when both are omitted, and when
  either resolves to something other than a literal boolean).
- The `emit` block is still fully validated (bad `method`, missing `url`,
  invalid `headers`/`body_template`) regardless of the resolved value.
- Disabling only skips the follow-up emit HTTP call — parsing/extraction is
  unaffected.

## Implementation Steps

### Step 1 — Document `enabled`/`disabled` in the emit configuration guide

In `docs/guides/navi/emit-configuration.md`:

- Add `enabled`/`disabled` to the documented `emit:` key list, alongside
  `client`/`method`/`url`/`status`/`retries`/`cooldown`/`headers`/`body_template`.
- Document the resolution rule from Shared contracts above, including the
  9-combination truth table from the issue
  (`{true, false, absent} × {true, false, absent}` → effective enabled/disabled).
- Add a worked example resource whose `emit.enabled` (or `.disabled`) is set
  to a `$VAR` reference, showing how setting/unsetting that env var toggles
  the emit per environment without editing the resource.
- Add an explicit callout distinguishing this from the pre-existing,
  unrelated resource-level `enabled`/`disabled` (same combination rule, but
  gates the whole resource request, not just its emit) — so a reader who
  already knows one doesn't assume the other silently exists too.

## Files to Change

- `docs/guides/navi/emit-configuration.md` — document the new keys, the
  resolution rule/table, a `$VAR` worked example, and the callout above.

## Notes

- No other user-facing doc (`README.md`, `docs/guides/how_to_use_navi.md`,
  etc.) references per-resource `emit` config in enough detail to need a
  matching update.
