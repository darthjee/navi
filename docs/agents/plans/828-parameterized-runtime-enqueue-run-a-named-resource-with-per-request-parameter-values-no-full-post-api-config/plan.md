# Plan: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

Issue: [828-parameterized-runtime-enqueue-run-a-named-resource-with-per-request-parameter-values-no-full-post-api-config.md](../issues/828-parameterized-runtime-enqueue-run-a-named-resource-with-per-request-parameter-values-no-full-post-api-config.md)

## Overview

Add per-request `{:token}` parameter values to `POST /api/engine/start` only, so
a token-secured caller can run an already-defined named resource against
call-time values without pushing a one-off resource definition through
`POST /api/config`. `resources[]` entries become a bare string (unchanged) or an
object `{ name, parameters }`; a target may also carry a target-level
`parameters` default that per-resource maps shallow-merge over. The merged map
rides through the existing `parameters`-consuming machinery (URL/emit-URL token
resolution, downstream action chaining, pagination) with no new substitution
sites, and a resource is skipped as `needs_params` only when a token is still
unresolved after the merge. Fully backward compatible.

## Agents involved

- [engine](engine.md)
- [architect](architect.md)
- [navi-client](navi-client.md)
- [docs](docs.md)

## Shared contracts

**`POST /api/engine/start` request** — `targets[]` entries:

```json
{
  "namespace": "crawler",
  "parameters": { "region": "eu", "slug": "default" },
  "resources": [
    "collection",
    { "name": "collection", "parameters": { "slug": "tidal-aberrations" } }
  ]
}
```

- `target.parameters` (optional): plain object, default parameter set for every
  resource in the target.
- `target.resources[]` entries: a non-empty string (unchanged), or an object
  `{ name: <non-empty string>, parameters?: <plain object> }`. Unknown keys on
  the object are ignored.
- Per-resource `parameters` shallow-merge **over** the target-level default
  (per-resource wins on key conflict). A bare string entry gets the target-level
  map as-is (or `{}` if none).
- Parameter values: `string`, `number`, `boolean`, or `null` (`null` = treated
  as missing). Empty string is a *present* value, substituted as-is. Object/array
  values are rejected.
- Structural violations (non-object `target.parameters`, a resource entry that
  is neither a valid string nor a valid object) → `400 { "error": "<message>" }`,
  nothing enqueued. This is on top of today's existing `targets` validation
  (missing/blank `namespace`, etc.).

**`POST /api/engine/start` response** — unchanged envelope
`{ status, enqueued, skippedResources }`:

- `enqueued`: still a plain `string[]`, one entry per accepted resource entry,
  duplicates allowed. No parameters echoed.
- `skippedResources[]`: unchanged `{ name, reason }` shape, **plus an optional
  `parameters` key** echoing the *merged* map, present only when the skipped
  entry carried one:
  ```json
  { "name": "collection", "reason": "needs_params", "parameters": { "slug": "b" } }
  ```
- Skip reasons are unchanged: `not_found`, `disabled`, `needs_params` (now also
  covers "still has an unresolved token after the merge" — no new reason).

**Resolution scope** — the merged parameters reach the request `url`, `emit.url`,
the `parameters.*` path-expression namespace available to downstream `actions`,
and `paginated_actions`' page merge. They do **not** reach `emit.body_template`
(resolves against the extracted item) or client `headers` (no substitution
mechanism there). Values are substituted verbatim (not URL-encoded); the
token-secured caller is responsible for sanitizing any untrusted input it
forwards.

`engine` owns and implements this contract; `architect`, `navi-client`, and
`docs` each document their slice of it and must not describe it differently
from what's above.
