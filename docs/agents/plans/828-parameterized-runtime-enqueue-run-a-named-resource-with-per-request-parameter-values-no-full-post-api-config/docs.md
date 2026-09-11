# docs Plan: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

Main plan: [plan.md](plan.md)

## Shared contracts

You document a one-line pointer to the request/response contract described in
the main plan's "Shared contracts" section — the full shape stays owned by
`architect`'s `docs/agents/web-server.md`, which this doc already links to and
defers to; do not duplicate the full contract here.

## Implementation Steps

### Step 1 — Note parameterized enqueue in `docs/guides/navi-client/reference.md`

Extend the `/api/engine/start` row's description in the `/api/*` namespace table
to mention that `targets[]` entries (and a target-level default) may carry
per-resource `parameters` values bound to the resource's `{:token}` placeholders
for that enqueue only, e.g.: "Starts a warming run, scoped per namespace via
`targets`; entries may carry per-resource `parameters` values for the resource's
`{:token}` placeholders." Keep the existing "For the full request/response
shape... see the `/api` namespace documentation" pointer immediately below the
table as the place a reader goes for the complete contract — don't inline it
here.

## Files to Change

- `docs/guides/navi-client/reference.md` — the `/api/engine/start` table row.

## Notes

- No other guide needs a change: `docs/guides/navi/reference.md` doesn't
  describe `/api/engine/start`'s request shape directly, and
  `docs/agents/overview.md`/`docs/agents/flow/*` describe the config-time
  chaining mechanism, which is unchanged by this feature.
