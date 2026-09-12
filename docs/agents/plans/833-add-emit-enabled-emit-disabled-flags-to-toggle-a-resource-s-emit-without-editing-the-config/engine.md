# Engine Plan: Add emit.enabled / emit.disabled flags to toggle a resource's emit without editing the config

Main plan: [plan.md](plan.md)

## Shared contracts

- Config keys `resources.<name>[].emit.enabled` / `.disabled` (booleans).
- Resolution rule: effective-disabled = `disabled === true || enabled === false`
  (verbatim reuse of `ResourceRequest.js:62`'s formula). Both omitted →
  enabled. A non-literal-boolean value on either key is inert.
- `emit` block validation (`method`/`url`/`headers`/`body_template`) is
  unaffected by the resolved value — it always runs.
- Disabling an emit only skips the `EmitJob`; parsing/extraction and
  `EmitEnqueuer`/`EmitJob`/`EmissionRegistry` are untouched.

## Implementation Steps

### Step 1 — Resolve `enabled`/`disabled` on `ResourceRequestEmit` and gate `ResourceRequest#hasEmit()`

In `source/lib/models/request/resource_request/ResourceRequestEmit.js`:

- Destructure two new optional constructor attributes, `enabled` and
  `disabled` (raw config values), documented with JSDoc in the same style as
  the existing `retries`/`cooldown` params.
- Add a private `#disabled` field, set once in the constructor:
  ```js
  this.#disabled = disabled === true || enabled === false;
  ```
- Add a public getter `get disabled()` returning `this.#disabled`, with
  JSDoc mirroring `ResourceRequest#disabled`'s wording
  ("disabled when `disabled: true` was given (regardless of `enabled`), or
  when `enabled: false` was given. Otherwise it is enabled (the default).")
  adapted to say "this emit" instead of "this request".
- No new exception class, no shared helper module extracted for the
  one-line formula — it's duplicated inline from `ResourceRequest.js`, same
  as that class already does it.

In `source/lib/models/request/resource_request/ResourceRequest.js`:

- Change `hasEmit()` (currently `return !!this.emit;`) to:
  ```js
  hasEmit() {
    return !!this.emit && !this.emit.disabled;
  }
  ```
  Update its JSDoc to mention the new dependency on the resolved `disabled`
  flag. No other call site changes: `enqueueExtraction()` already only
  attaches `params.emit` when `hasEmit()` is true, so this single change is
  the entire gate — a disabled emit means the `Extraction` job never
  receives an `emit` param, and `ExtractionJob` never builds an
  `EmitEnqueuer` for it.

Also update `source/spec/support/factories/ResourceRequestEmitFactory.js`
to accept and forward optional `enabled`/`disabled` params (both
`undefined` by default, matching `retries`/`cooldown`'s existing pattern),
so specs can build a disabled emit without hand-constructing
`ResourceRequestEmit`.

**Unit specs** (same step — small enough to land together):

- `source/spec/lib/models/request/resource_request/ResourceRequestEmit_spec.js`
  — a `#disabled` (or `describe('#disabled', ...)`) block covering the full
  9-combination table from the issue (`{true, false, absent} × {true, false, absent}`),
  plus a case confirming a non-boolean value (`null`, `''`, an arbitrary
  string) on either key does not trip either check, plus a case confirming
  `method`/`url`/`headers`/`body_template` validation still throws
  regardless of the resolved value (e.g. missing `url` + `disabled: true`
  still throws `MissingEmitUrl`).
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js`
  — extend the existing `#hasEmit` describe block: returns `false` when
  `emit` is declared with an effectively-disabled config, `true` when
  declared and effectively-enabled (including the no-`enabled`/no-`disabled`
  default, i.e. today's existing passing case), `false` when no `emit`
  block at all (existing case, unchanged).

## Files to Change

- `source/lib/models/request/resource_request/ResourceRequestEmit.js` — new
  `enabled`/`disabled` constructor params, `#disabled` field, `get disabled()`.
- `source/lib/models/request/resource_request/ResourceRequest.js` —
  `hasEmit()` gains the `&& !this.emit.disabled` check; JSDoc update.
- `source/spec/support/factories/ResourceRequestEmitFactory.js` — forward
  `enabled`/`disabled` params.
- `source/spec/lib/models/request/resource_request/ResourceRequestEmit_spec.js`
  — new coverage for `#disabled`.
- `source/spec/lib/models/request/resource_request/ResourceRequest_spec.js`
  — extended `#hasEmit` coverage.

### Step 2 — Integration coverage in the real Extraction → Emit flow

Extend `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` (the existing
end-to-end `ResourceRequestJob` → `ExtractionJob` → `EmitEnqueuer` →
`EmitJob` spec, built by constructing a real `ResourceRequest` directly,
mocking only the HTTP boundary) with a case where the resource's `emit`
config carries `disabled: true` (or `enabled: false`): assert the resource
still extracts items (the parser runs, the extraction succeeds) but zero
`EmitJob`s are enqueued and no emit POST is ever made (the emit HTTP mock
receives no calls). Follows this spec file's existing style — no YAML file
or `$VAR` substitution involved here; that generic substitution mechanism
already has its own coverage (`EnvStringResolver_spec.js` /
`ConfigIncluder_spec.js`) and needs no new emit-specific case, since
`ResourceRequestEmit` never sees anything but the already-substituted,
already-YAML-parsed value.

## Files to Change

- `source/spec/lib/jobs/ExtractionEmitFlow_spec.js` — add the
  disabled-emit end-to-end case.

## CI Checks

- `source`: `yarn test` (CI job: `jasmine`)
- `source`: `yarn lint` / `yarn report` (CI job: `checks`)

## Notes

- No new exception type, no new config-loading code, no changes to
  `EmitEnqueuer`, `EmitJob`, or `EmissionRegistry`.
