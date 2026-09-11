# navi-client Plan: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

Main plan: [plan.md](plan.md)

## Shared contracts

You rely on, but do not implement, the request/response contract described in
the main plan's "Shared contracts" section. `client.js`'s `engineStart(payload)`
is a thin pass-through that forwards `payload` verbatim to
`POST /api/engine/start` — no code change is needed for the new `parameters`
key to work, since it's just more JSON nested inside `payload.targets`.

## Implementation Steps

### Step 1 — Document parameterized `targets` in `engineStart`'s JSDoc

Update `engineStart`'s JSDoc `@param {object} [payload={}]` line to mention that
`targets[]` entries may now carry per-resource `parameters` (and a target-level
`parameters` default) in addition to `namespace`/`resources`, and that this
package requires no changes to support it — the payload is forwarded as-is. Do
not change `engineStart`'s implementation or add a spec for this: there is no
new behavior to test, only new documentation of an existing pass-through.

## Files to Change

- `clients/node/client.js` — JSDoc-only touch on `engineStart`'s `@param`
  description.

## Notes

- If a docstring example is added, keep it consistent with the worked example
  in the main plan's "Shared contracts" section and with `architect`'s
  `docs/agents/web-server.md` update — do not invent a different shape.
