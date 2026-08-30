# engine Plan: Crawler: support a custom body template for emit (wrap/re-shape the extracted item)

Main plan: [plan.md](plan.md)

## Shared contracts

Implements the `emit.body_template` contract described in [plan.md](plan.md#shared-contracts):
- `emit.body_template` (optional) — a plain object or array; anything else throws `InvalidEmitBodyTemplate` at construction.
- `{:key}` / `{:nested.path}` tokens, `{:.}` for the whole item.
- Whole-token string values splice the real typed value; tokens embedded in a longer string are stringified; unresolved tokens are left as literal text.
- No template ⇒ current behavior (send the bare item) is unchanged.

`docs` relies on this exact behavior to write accurate documentation — do not change the token syntax or missing-field behavior without updating [plan.md](plan.md#shared-contracts) and notifying `docs`.

## Steps

- [01 — Add InvalidEmitBodyTemplate exception](engine/01-add-invalid-emit-body-template-exception.md)
- [02 — ResourceRequestEmit: bodyTemplate attribute and resolveBody rendering](engine/02-resource-request-emit-body-template.md)
- [03 — EmitJob: send the rendered body](engine/03-emit-job-send-rendered-body.md)
- [04 — Tests: factory and specs](engine/04-tests-factory-and-specs.md)

## CI Checks

- `source`: `npm run coverage` (CI job: Unit tests (Jasmine)); `npm run lint` (CI job: Lint and report)

## Notes

- `resolveUrl` (`ResourceRequestEmit#resolveUrl` / `ResourceRequest#resolveUrl`) uses `/\{:(\w+)\}/g` against a flat `parameters` object — deliberately left untouched by this issue. `resolveBody`'s token regex is a separate, dot-path-aware pattern (`/\{:([.\w]+)\}/g` or similar) since item shapes are nested; do not try to unify the two into one shared regex/method, their input shapes differ (flat parameters vs. arbitrarily nested item).
- `EmitJob#arguments` (used for job serialization) only carries `{ url, method }`, not the body — no change needed there; the rendered body is computed fresh in `#perform` each time from `this.#item`, same as today.
