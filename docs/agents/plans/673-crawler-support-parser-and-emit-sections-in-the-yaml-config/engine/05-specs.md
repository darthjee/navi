# Specs

Cover the new models, the `ResourceRequest` wiring, and the `NamespaceMapBuilder` validation, mirroring the structure/style of the existing specs for `AssetRequest`, `ResourceRequest`, and `NamespaceMapBuilder`:

- `ResourceRequestParser`: valid `type: regex` and `type: json_path` construction (extra keys preserved as-is); missing/unknown `type` throws `InvalidParserType`.
- `ResourceRequestEmit`: valid construction with a bare-name `client` and with a `{name, namespace}` `client`; missing/invalid `method` throws `InvalidEmitMethod`; missing `url` throws.
- `ResourceRequest`:
  - `parser`/`emit` both absent — unaffected, existing behavior preserved (regression coverage for backward compatibility).
  - `parser` present, `emit` absent, and vice versa.
  - both `parser` and `emit` present together, and combined with `actions`/`assets` on the same request.
- `NamespaceMapBuilder`:
  - `emit.client` resolving successfully against a declared client.
  - `emit.client` referencing an undeclared client raises `ClientNotFound`, same as the existing top-level `client:` case.
  - a `ResourceRequest` with no `emit` is unaffected by the new validation path.

## Files to Change

- `source/spec/lib/models/request/ResourceRequestParser_spec.js` — new.
- `source/spec/lib/models/request/ResourceRequestEmit_spec.js` — new.
- `source/spec/lib/models/request/ResourceRequest_spec.js` — extend with `parser`/`emit` cases.
- `source/spec/lib/services/NamespaceMapBuilder_spec.js` — extend with `emit.client` validation cases.
