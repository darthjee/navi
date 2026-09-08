# Backend specs

Extend the existing Jasmine specs. Use the fixtures under
`source/spec/support/fixtures/menu/` (add new fixture files as needed).

## `source/spec/lib/models/configs/MenuConfig_spec.js`

- **Change the existing case** at "when entries is an explicit empty list" — it
  currently asserts "returns an empty menu". It must now assert the two default
  entries (Logs, Memory) are returned.
- Add cases:
  - merge: custom entries render after Logs + Memory, in file order.
  - `defaults: false`: only the operator entries render; with no `entries` key
    and `defaults: false` → empty list.
  - `defaults:` non-boolean → warns and behaves as `true`.
  - `hidden: true` on `/logs` → Memory + customs only; the hidden entry never
    appears.
  - `hidden: true` on a non-default route → dropped, `Logger.warn`, rest intact.
  - reposition: `[{route:/dashboard},{route:/logs}]` → `Memory, Dashboard, Logs`;
    `text` override relabels; bare re-list keeps `Logs`.
  - duplicate non-default `route` → first wins, later dropped with a
    `Logger.warn` whose indices are merged-list positions.
  - text collision on a different route (`{route:/audit,text:Logs}`) → allowed,
    no warn.
  - env-var interpolation still works alongside `defaults:` (regression).
- Assert `Logger.warn` call args precisely for the new warning strings.

## `source/spec/lib/models/configs/MenuEntry_spec.js`

- Adjust/extend for whatever step 03 changes (resolved-`text` path). `toJSON`
  stays `{ route, text }`; the "never serializes hidden" spec must still pass.

## `MenuHandler` / `MenuSerializer` / `Router` specs

- No behavioural change expected; run them to confirm the frozen `/menu.json`
  shape still holds with a resolved list.

## Files to Change

- `source/spec/lib/models/configs/MenuConfig_spec.js` — rewrite the `entries: []`
  expectation; add merge/defaults/hidden/reposition/dedup/collision cases.
- `source/spec/lib/models/configs/MenuEntry_spec.js` — align with step 03.
- `source/spec/support/fixtures/menu/` — new fixture YAML files for the added
  cases.
