# Issue: Parameterized runtime enqueue: run a named resource with per-request parameter values (no full POST /api/config)

## Description

Add per-request parameter values to `POST /api/engine/start` so a caller can run
an already-defined named resource with `{:token}` placeholder values chosen at
call time — without redefining the resource through `POST /api/config`.

Concrete consumer: the Majora "Lootstudios crawler" is adding an operator page
with a collection-URL input and an Enqueue button (darthjee/majora#1291 /
darthjee/majora#1292). Each Enqueue should run one already-defined "crawl a
single collection" resource with that URL. This is the "do it properly"
follow-up to the `POST /api/config`-per-click workaround that ships
darthjee/majora#1291 (spec: darthjee/majora#1292); it does **not** block that
work.

## Problem

Today (`docs/agents/web-server.md`) the runtime controls are:

- `POST /api/config` — merges a whole `resources`/`clients` definition into a
  namespace, stored literally (no `$VAR` resolution).
- `POST /api/engine/start` / `PATCH /engine/start` — accept resource **names**
  only, no parameter values.

A consumer that wants to run one resource against a value chosen at call time
(a URL, a slug, an id substituted into the resource's `url` — and, downstream,
its `emit.url` — `{:token}` placeholders) has to synthesise and push a full
one-off resource definition via `POST /api/config` on every call. That means
duplicating the parser/emit blocks, managing namespace/resource-name uniqueness
to avoid clobbering an in-flight run, and re-supplying client credentials
because `/api/config` does no env-var resolution.

## Expected Behavior

### Endpoint surface

Parameter values are added to **`POST /api/engine/start` only** — the
token-secured `/api/*` endpoint whose `targets[]` shape already matches this
need, and the natural fit for an external, token-holding operator page hitting a
specific namespace.

Explicit non-goals:

- **`PATCH /engine/start`** — no parity. It has no `targets` structure, so
  parameters would need a separate flat/top-level shape, and there is no
  consumer on that UI-facing surface. A follow-up could add a flat `parameters`
  form there for SPA use; deliberately out of scope, not an oversight.
- **`POST /api/config`** — untouched; avoiding the config-push-per-call is the
  whole point.

### Request shape

`POST /api/engine/start` keeps its `targets[]` array, with two additions:

1. **`resources[]` entries may be a bare string (unchanged) *or* an object
   `{ "name": "<resource>", "parameters": { ... } }`.** Bare strings behave
   exactly as today. Mixed arrays are allowed. Repeating the same resource name
   with different `parameters` is how one resource is enqueued against several
   values in a single request (see Batching).
2. **A target may carry a target-level `parameters` object**, a default set for
   every resource in that target. Per-resource `parameters` are **shallow-merged
   over** the target-level map, per-resource winning on key conflict. A
   bare-string entry under a target with target-level `parameters` receives that
   map as-is.

```json
{
  "targets": [
    {
      "namespace": "crawler",
      "parameters": { "region": "eu", "slug": "default" },
      "resources": [
        "collection",
        { "name": "collection", "parameters": { "slug": "tidal-aberrations" } },
        { "name": "bundle", "parameters": { "slug": "x", "region": "us" } }
      ]
    }
  ]
}
```

Effective parameters: first `collection` → `{region: eu, slug: default}`;
second `collection` → `{region: eu, slug: tidal-aberrations}`; `bundle` →
`{region: us, slug: x}`.

The key is `parameters` at both levels, matching `actions[].parameters` in the
config; values follow the same resolution/merge rules chaining already uses.

### Batching

Repetition is the single mechanism (no `parameters_list` shorthand in v1).

- **Non-atomic at the entry level**, as today. A structural/schema violation
  400s the whole request with nothing enqueued; an entry-level problem
  (`not_found`, `disabled`, or still `needs_params` after the merge) skips only
  that entry and reports it, and every valid sibling entry is still enqueued.
- **Enqueue follows array order; execution order is not guaranteed** — workers
  pull concurrently, as on every enqueue path. No sequencing.
- **No de-duplication** — two identical entries enqueue two `ResourceRequestJob`s.
- **No per-request entry cap in v1** — a future safeguard could add one.

### Placeholder resolution scope

The merged `parameters` map is **injected as the enqueued `ResourceRequestJob`'s
`parameters`** — the exact slot a chained action's mapped parameters occupy.
**No new `{:token}` substitution sites are added.** Everything that already
consumes a request's `parameters` picks it up:

- the request `url` (`ResourceRequest.resolveUrl` → `UrlTokenResolver`), and
  therefore the job's `arguments.url` and the `originUrl` threaded to child jobs;
- `emit.url`, since `enqueueExtraction` forwards the same `parameters` to the
  `EmitJob`;
- the `parameters.*` path-expression namespace on `ResponseWrapper`, so a
  downstream `action` can forward a value into a child request **opt-in**
  (`child_param: parameters.slug`) — no automatic deep merge, matching today's
  chaining;
- `paginated_actions`, which merge the page number into the same `parameters`
  object.

Explicitly **not** substituted (unchanged):

- `emit` `body_template` — its `{:key}` / `{:nested.path}` tokens resolve against
  the **extracted item**, not request parameters.
- Client `headers` — no `{:token}` mechanism there today; this does not add one.

### Missing / extra parameters

`UrlTokenResolver` leaves an unmatched `{:key}` token **literally in the URL**,
so an under-parameterized request would fire an HTTP call against a garbage URL.
The new path must prevent that.

- **Missing required placeholder** — the resource URL has `{:slug}` and the
  merged `parameters` has no `slug`, or `slug` is `null`: the entry is
  **skipped, not enqueued, and reported** with reason **`needs_params`** (the
  existing reason is reused — no new `missing_params` reason, no `missing: [...]`
  key). Resource-level all-or-nothing, mirroring today's `ResourceEnqueuer`:
  if *any* request in the resource still has an unresolved token after the merge,
  the whole entry is skipped. Only `null` or an absent key counts as missing —
  an **empty string is a present value** and is substituted as-is
  (`/bundle/{:slug}/` → `/bundle//`).
- **Extra / unknown parameters** — keys with no matching `{:token}` anywhere in
  the resource are **accepted silently, ignored for URL substitution, and still
  threaded into the job's `parameters`** (so downstream `actions` can read them).
  Required for the target-level-default pattern.
- **Parameters for an already param-free resource** — same: accepted, ignored
  for the URL, threaded through.
- **Empty `parameters: {}`** — identical to omitting it.

### Response reporting

The response keeps its shape (`{ status, enqueued, skippedResources }`, flat
cross-target aggregation):

- **`enqueued` stays a plain `string[]`** — one entry per accepted resource
  entry, **duplicates allowed** (`["collection", "collection"]` for two
  successful slugs). No parameters echoed on the success side; byte-identical
  contract for existing callers. A multi-request resource still contributes its
  name once.
- **`skippedResources` entries gain an optional `parameters` key**, present only
  when the skipped entry carried a parameter map, echoing the **merged** map —
  i.e. exactly what the enqueuer evaluated against the token gate:

  ```json
  { "name": "collection", "reason": "needs_params", "parameters": { "slug": "b" } }
  ```

  Name-only skips are unchanged (`{ name, reason }`). Purely additive field.

### Validation & 400s

Extends `ApiEngineStartHandler#validTarget` (today: `resources` must be
`Array<string>`).

**Structural → 400, nothing enqueued:**

- `target.parameters`, when present, must be a **plain object** (not
  array / null / scalar).
- Each `resources[]` entry must be a **non-empty string** *or* an **object**
  with a required non-empty / non-blank `name` (string) and an optional
  plain-object `parameters`. Unknown keys on the object are **ignored silently**
  (codebase-consistent; the cost is a typo surfacing as a `needs_params` skip).
- Other `targets` malformations (missing `namespace`, …) 400 as today.

**Parameter values:** accept `string`, `number`, `boolean`, and `null`
(`null` = treated as missing), matching the chaining path where `ParametersMapper`
already feeds `UrlTokenResolver` non-string scalars. **400 on object / array
values** (they stringify to `[object Object]` / `a,b` garbage in the URL).

**Token-substitution safety:** values are substituted **verbatim into the URL
path, not URL-encoded** — identical to chaining; encoding would diverge and could
break `{:token}` uses that intentionally carry path segments. No
control-character / whitespace rejection in code. `docs/agents/web-server.md`
documents that values are substituted as-is and that the `web.api.token`-secured
caller owns sanitizing any untrusted end-user input it forwards. The token
boundary is the real control.

### Lifecycle & client resolution (unchanged)

- Rides the existing stopped→start / running→enqueue / paused-pausing-stopping→409
  state machine. No new engine states, no change to 409 conditions.
- The resource's configured `client` is used as-is; `parameters` never select or
  override a client.

## Solution

### Engine (`source/`)

1. **Parameter-aware token gate.** Add `ResourceRequest.hasUnresolvedTokens(parameters)`
   alongside the existing zero-arg `needsParams()` — true when the URL still
   contains a `{:key}` token whose `key` is absent or `null` in `parameters`
   (an empty string is a present value and resolves normally).
   `needsParams()` is left intact.
2. **`ResourceEnqueuer`** — the name-only `enqueue(names)` path grows a
   parameters-carrying variant (or an optional per-name parameter map): it
   applies the target-level + per-resource merge, checks
   `hasUnresolvedTokens(merged)` instead of `needsParams()`, and enqueues
   `JobRegistry.enqueue('ResourceRequestJob', { resourceRequest, parameters: merged })`
   instead of the hardcoded `{}`. `disabled` / `not_found` checks keep their
   current precedence (before the token gate). `enqueueAll()` and
   `requestsNeedingNoParams()` are untouched — bulk enqueue stays
   param-free-only; a target-level `parameters` map applies only to *named*
   entries.
3. **`ApiEngineStartHandler`** — extend `#validTarget` for the string-or-object
   `resources[]` entries and the target-level `parameters` object (validation
   rules above); thread the merged parameters into the per-target
   `ResourceEnqueuer` call inside `#aggregate`; add the optional `parameters`
   key to skipped-entry results. `#start` / `#enqueue` state logic and the
   response envelope are otherwise unchanged.

Because `hasUnresolvedTokens({})` is equivalent to `needsParams()`, every
existing enqueue path (boot `enqueueFirstJobs()`, `PATCH /engine/start`,
`POST /api/config` enqueue-on-running, `POST /api/engine/start` without
`parameters`) behaves identically.

### Client (`clients/node/`)

No code change — `client.js`'s `startEngine` is a thin pass-through that forwards
`targets` verbatim, so the new `parameters` key rides along. One-line JSDoc touch
on `startEngine`, plus a note in `docs/guides/navi-client/reference.md` (which
already defers to `web-server.md` for the full shape).

### Docs

`docs/agents/web-server.md`, `### POST /api/engine/start` subsection: object form
of `resources[]` entries + target-level `parameters` and the merge rule; a
worked example carrying `parameters`; `needs_params` now meaning "unresolved
after merge"; the additive `skippedResources` `parameters` key; `enqueued`
staying `string[]` with duplicates; the validation / 400 additions; the
verbatim-substitution / caller-sanitizes note; "bulk enqueue stays
param-free-only".

Not touched: `docs/agents/flow/*`, `docs/agents/overview.md`,
`docs/guides/navi/reference.md`, `README.md`, `DOCKERHUB_DESCRIPTION.md`.

### Testing

- **Unit** — `ResourceRequest.hasUnresolvedTokens` (present / absent / `null` /
  empty-string / extra keys); `ResourceEnqueuer` with a merged map (enqueues a token-bearing resource
  when satisfied, skips as `needs_params` when not, `disabled`/`not_found`
  precedence, extras threaded through, bulk stays param-free); `ApiEngineStartHandler`
  validation (object entries, target-level `parameters`, non-object/array values
  → 400, unknown keys ignored).
- **Integration** — `POST /api/engine/start` with `parameters`: single
  parameterized enqueue resolves the URL; batch with one satisfied + one
  missing-param entry returns the mixed `enqueued` / `skippedResources` (with the
  `parameters` echo); an existing bare-string payload is byte-for-byte
  unchanged.

### Backward compatibility

No breaking changes. Existing `POST /api/engine/start` callers with bare-string
`resources` and no `parameters` get a byte-identical response. All other enqueue
paths, `UrlTokenResolver` / `resolveUrl`, `ResourceRequestJob` construction, the
config file format, and the node client are untouched.

One behaviour widening: a payload that *today* sends `parameters` on a target has
it silently ignored, and an object-form `resources[]` entry 400s. After this
change both become meaningful — that exact payload may now enqueue a resource
previously skipped, or resolve it to a different URL. The pre-change behaviour
was "params ignored / object rejected", so honouring them is the intended fix,
not a regression.

## Benefits

- An operator page or external caller triggers a parameterized run with a single
  token-secured `POST /api/engine/start` request instead of a `POST /api/config`
  push per call.
- No resource-definition duplication, no namespace/resource-name juggling to
  avoid clobbering an in-flight run, no client-credential re-supply.
- Stored resource definitions stay immutable — parameterized enqueue is purely a
  per-enqueue runtime value; nothing is persisted, remembered, or replayable.
- One request can fan a resource out over many values (batch of URLs/slugs), with
  per-entry success/skip reporting.
- Fully backward compatible: existing callers, every other enqueue path, and the
  node client are unaffected.
