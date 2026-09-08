# MenuConfig: defaults switch + known-default identity

Give `MenuConfig` the two primitives the resolution algorithm (step 02) needs:
a notion of which routes are *known defaults*, and handling for the top-level
`defaults` key.

- Add a `DEFAULT_ROUTES` (or equivalent) derived from `DEFAULT_ENTRIES`
  (`['/logs', '/memory/status']`) plus a helper that maps a default `route` to
  its shipped label (`/logs` → `Logs`, `/memory/status` → `Memory`), so a bare
  re-list can restore the default label later.
- In `fromFile`, after the existing parse + `MissingTopLevelConfigKey`-style
  guards, read `parsed.defaults`:
  - `defaults === false` → the shipped default block is empty for this load.
  - `defaults` absent or `=== true` → shipped default block is
    `DEFAULT_ENTRIES` (current behaviour).
  - `defaults` present but not a boolean → `Logger.warn`
    (`[menu] ignoring non-boolean "defaults" value; treating as true`) and treat
    as `true`.
- The `defaults` key must **not** trip the existing
  `!('entries' in parsed)` → `DEFAULT_ENTRIES` fallback: a document that has
  `defaults: false` but no `entries` key is still a valid, intentional
  "empty menu" request. Adjust the guard so the fallback only fires when the
  document carries neither `entries` nor `defaults`.
- `entries: []` (a present, empty list) must now flow into the step-02 merge as
  an empty custom list — it no longer short-circuits to `[]`.

## Files to Change

- `source/lib/models/configs/MenuConfig.js` — add `DEFAULT_ROUTES` + default-label
  lookup; parse and validate the top-level `defaults` key; stop treating a
  missing `entries` key as an unconditional defaults fallback when `defaults` is
  present; let `entries: []` fall through to the merge.
