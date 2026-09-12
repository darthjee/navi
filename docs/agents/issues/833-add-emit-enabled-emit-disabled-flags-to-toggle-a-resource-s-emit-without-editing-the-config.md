# Issue: Add emit.enabled / emit.disabled flags to toggle a resource's emit without editing the config

## Description

Add two optional per-resource `emit` config keys — `enabled` and `disabled` —
so an operator can turn a resource's follow-up emit HTTP call on or off
**through the existing `$VAR` / `${VAR}` environment-variable substitution**
already applied to every config file, with no code change and no redeploy of
the resource definition itself. The combination rule deliberately mirrors an
existing precedent already in this codebase at the *resource* level (see
Problem below), applied here one level down, inside the `emit:` block.

## Problem

Today (`ResourceRequestEmit`, `source/lib/models/request/resource_request/ResourceRequestEmit.js`)
an `emit` block, once declared under a resource, always fires: there is no way
to keep the block defined (so `parser`/`url`/`body_template` etc. stay
documented and validated) while temporarily silencing the actual HTTP calls it
makes — e.g. to disable a downstream analytics/webhook call in a given
environment, or during an incident, without deleting or commenting out the
`emit:` block and redeploying.

Every config file already goes through `EnvStringResolver` on its raw text
before YAML parsing (`ConfigIncluder#readYaml`,
`source/lib/services/config/ConfigIncluder.js:120-132`) — `$VAR`/`${VAR}`
tokens anywhere in the file resolve from `process.env` at load time. This
already lets a resource author write `enabled: $EMIT_ENABLED` today for any
new boolean-shaped key; no new resolution mechanism is needed, only the two
new keys and the logic to combine them.

The codebase already has this exact "two keys, one combination rule" pattern
**one level up**, at the resource-request level, unrelated to `emit`
(`ResourceRequest.js:37-62`, `resources.<name>[].enabled` /
`resources.<name>[].disabled`, gating whether the whole request is ever
enqueued):

```js
this.#disabled = disabled === true || enabled === false;
```

That single line already produces exactly the behavior wanted here — "both
absent → enabled", "an explicit `disabled: true` or `enabled: false` →
disabled", "both given and effectively agreeing → that verdict", "both given
and effectively disagreeing in a way that isn't a clean override → disabled"
— checked against all 9 combinations of
`{true, false, absent} × {true, false, absent}`. This issue reuses that exact
formula inside `emit:` rather than inventing a new one, for consistency: no
lenient string/number truthy-coercion, just the same strict `=== true` /
`=== false` checks.

## Expected Behavior

### Config shape

Two new optional keys under `resources.<name>[].emit`, siblings of `method`/
`url`/`headers`/etc. — and namespaced under `emit:` so they never collide
with the pre-existing, unrelated `resources.<name>[].enabled` /
`resources.<name>[].disabled` pair that gates the whole request:

```yaml
resources:
  products:
    - url: /products.json
      parser: { ... }
      emit:
        method: POST
        url: /events
        enabled: $EMIT_ENABLED     # optional, boolean
        disabled: $EMIT_DISABLED   # optional, boolean
```

Both are literal booleans in the common case; because they ride the existing
raw-text `$VAR` substitution, an author can instead write `enabled: $SOME_VAR`
and flip behavior per environment purely by setting/unsetting that env var to
the literal text `true`/`false` — no change to the resource file. An
undefined env var resolves to an empty string, which YAML parses as `null`,
i.e. neither `true` nor `false` — see Resolution rule below.

### Resolution rule

Reuses, verbatim, the existing resource-level formula
(`ResourceRequest.js:62`):

```js
disabled === true || enabled === false
```

In words (mirroring that getter's own JSDoc): the emit is disabled when
`disabled: true` was given (regardless of `enabled`), or when
`enabled: false` was given. Otherwise it is enabled — the default when both
are omitted, and also whenever a value isn't a literal boolean (an omitted
key, or a `$VAR` that resolved to `null`/some other non-`true`/`false`
YAML value) — that value simply fails both `=== true` and `=== false`
checks and is inert. No lenient string/number coercion, no new exception
type: this only recognizes exactly `true` and `false`.

For reference, the full 9-combination table:

| `enabled` | `disabled` | Effective | Why |
|---|---|---|---|
| absent | absent | **enabled** | default |
| `true` | absent | enabled | single vote |
| `false` | absent | disabled | `enabled === false` |
| absent | `true` | disabled | `disabled === true` |
| absent | `false` | enabled | neither check trips |
| `true` | `false` | enabled | neither check trips |
| `false` | `true` | disabled | both checks trip |
| `true` | `true` | **disabled** | `disabled === true` wins outright |
| `false` | `false` | **disabled** | `enabled === false` trips |

### Effect of "disabled"

`disabled` (effective) means only that the **emit HTTP call is skipped** —
parsing/extraction for that resource is untouched; items are still extracted
by the resource's `parser`, they're just never turned into `EmitJob`s. The
`emit` block is still fully validated at config-load time (bad `method`,
missing `url`, invalid `headers`/`body_template` still throw immediately)
regardless of the resolved value, so flipping the env var back on later
can't surface a config error that should have been caught at deploy time —
this also mirrors the existing resource-level `disabled`, whose `parser`/
`emit` are likewise still constructed and validated when the request itself
is disabled (`ResourceRequest.js:72-73`).

Scope: **per-resource `emit` only** — no top-level/global default in this
issue.

## Solution

### `source/lib/models/request/resource_request/ResourceRequestEmit.js`

- Constructor destructures two new optional attributes, `enabled` and
  `disabled` (raw config values).
- New private `#disabled` field, computed once at construction, reusing the
  existing formula verbatim:
  ```js
  this.#disabled = disabled === true || enabled === false;
  ```
- New public getter `get disabled()` returning `this.#disabled`, with JSDoc
  mirroring `ResourceRequest#disabled`'s wording adapted to "this emit".
- No new exception class, no new helper module — this is a one-line rule
  duplicated inline from `ResourceRequest.js`, not extracted into a shared
  utility (too small to be worth an abstraction; `yarn report` (jscpd) is
  in no danger of flagging a single duplicated boolean expression).
- JSDoc on the constructor's new params, matching the existing style for
  `retries`/`cooldown`.

### `source/lib/models/request/resource_request/ResourceRequest.js`

- `hasEmit()` (currently `return !!this.emit;`, line ~204-206) becomes:
  ```js
  hasEmit() {
    return !!this.emit && !this.emit.disabled;
  }
  ```
- This is the single gate: `enqueueExtraction()` (line ~184-190) only attaches
  `params.emit` to the enqueued `Extraction` job when `hasEmit()` is true, so a
  disabled emit means the `Extraction`/`ExtractionJob` pipeline never builds an
  `EmitEnqueuer` for that item — no other file changes needed.
  `EmitEnqueuer`/`EmitJob`/`EmissionRegistry` are untouched.

### Docs

- `docs/guides/navi/emit-configuration.md` — document `enabled`/`disabled`,
  the truth table, the "validated even when disabled" behavior, a worked
  example using `$VAR` to toggle per environment, and an explicit callout
  distinguishing this from the pre-existing resource-level `enabled`/
  `disabled` (same rule, different scope: whole request vs. just its emit).
- `docs/agents/flow/actions-and-assets.md` — note that `hasEmit()` now also
  depends on the resolved `disabled` flag, not just whether the block is
  declared.

### Testing

- **Unit** (`ResourceRequestEmit`): `disabled` getter across the
  9-row truth table above (using only literal `true`/`false`/omitted —
  no string/number coercion cases, since none is implemented); one test
  confirming a non-boolean value (`null`, `''`, arbitrary string) on either
  key is inert on its own; confirm `method`/`url`/`headers`/`body_template`
  validation still throws regardless of the resolved `disabled` value.
- **Unit** (`ResourceRequest`): `hasEmit()` returns `false` when `emit` is
  declared but resolves disabled, `true` when declared and enabled (including
  the no-`enabled`/no-`disabled` default), `false` when no `emit` block at
  all (unchanged existing case).
- **Integration**: a resource with `parser` + `emit: { disabled: true, ... }`
  extracts items but enqueues zero `Emit` jobs; the same resource with
  `enabled: $VAR` toggles behavior when the env var is set/unset across two
  engine runs, exercising the real `EnvStringResolver` substitution path (no
  new resolution code to test directly, since that mechanism is generic and
  already covered — this is here to confirm the two layers compose).

## Benefits

- Turn a resource's emit off (e.g. a downstream webhook during an incident,
  or per-environment) by setting one env var — no resource file edit, no
  redeploy, no risk of a typo in a commented-out/re-enabled `emit:` block.
- The `emit` block stays fully declared and validated even while disabled, so
  turning it back on is just flipping the env var back, not restoring config.
- Reuses a proven, already-tested combination rule instead of inventing a new
  one — smaller diff, no new edge-case behavior for reviewers to reason
  about, and the same mental model as the resource-level `enabled`/`disabled`
  a reader already knows.
- Fully backward compatible: no existing resource declares `enabled`/
  `disabled` under `emit:`, so every existing config resolves to the same
  default (`enabled: true`) it has today.

### Backward compatibility

No breaking changes. `enabled`/`disabled` are new, optional keys under
`emit:`; their absence (today's universal case) resolves to enabled, i.e.
identical to current always-on behavior. `EmitEnqueuer`, `EmitJob`,
`EmissionRegistry`, and the emit HTTP-call path are untouched.
