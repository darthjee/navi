# Issue: Crawler: support parser and emit sections in the YAML config

## Context

Part of the crawler feature (#671), which turns Navi into a data-extraction tool. Before any extraction/emission job can run, the YAML config and the request models need to understand two new sections: `parser` (how to extract structured data from a response body) and `emit` (where to send each extracted item). This sub-issue only covers parsing/validating this config — no extraction/emission logic runs yet.

Following the existing pattern used by `client`/`actions`/`assets`, `parser` and `emit` are declared **per `ResourceRequest`** (i.e. under each entry of a resource's list in `source/lib/models/request/ResourceRequest.js`), not per `Resource` — `Resource` itself is just a name plus a list of `ResourceRequest`s and holds none of this config today.

## What needs to be done

- Extend the `ResourceRequest` YAML schema to accept an optional `parser` section: `type` (`regex` | `json_path`), plus a generic bag of type-specific keys (`match`, `filter`, `fields`, `field` for regex). This issue validates shape loosely — `type` plus whatever extra keys are present are stored as-is; validating which keys are valid/required for a given `type` is deferred to the parser-specific sub-issues (#674 regex, #675 json_path) that actually interpret them.
  - `type: json_path` reuses the existing `PathResolver` dot/bracket-notation mini-language (already used by `actions`/`pagination`, e.g. `parsedBody.id`) rather than introducing real JSONPath syntax/dependency — this issue does not need to validate path expressions, just note the naming intent for the sub-issue that implements it.
- Extend the `ResourceRequest` YAML schema to accept an optional `emit` section: `client` (name of an existing client), `method` (`POST`|`PUT`|`PATCH`), `url`.
  - `emit.client` accepts the same two forms the existing top-level `client:` field supports — a bare name string, or a cross-namespace `{name, namespace}` object — reusing `ResourceRequest#parseClient`'s parsing.
- Add new typed model classes for `parser` and `emit` (e.g. `ResourceRequestParser`/`ResourceRequestEmit`), following the plain-constructor + `fromObject`/`fromListObject` pattern used by `AssetRequest` (`source/lib/models/request/AssetRequest.js`) — the closest existing precedent for a simple, non-behavioral nested config object.
- Wire `ResourceRequest`'s constructor to destructure `parser`/`emit` off the raw attrs, the same way it already does for `actions`/`assets`/`paginated_actions`.
- Validate `emit.client` references an existing declared `client`, by extending `NamespaceMapBuilder#validateReferences`/`#validateClient` (`source/lib/services/NamespaceMapBuilder.js`) — the existing eager, fail-fast-at-load-time mechanism used for the top-level `client:` field today (throws `ClientNotFound`).
- Malformed `parser`/`emit` blocks (missing/unknown `type`, invalid `emit.method`, unresolvable `emit.client`) are fatal — thrown synchronously at config-load time, mirroring `AssetRequest`/`Client` (not the skip-and-log behavior used by `actions`/`paginated_actions`).
- Backward compatibility: resources without `parser`/`emit` behave exactly as before.
- Add specs under `source/spec/lib/models/request/` mirroring existing `ResourceRequest`/`AssetRequest` spec patterns.

## Acceptance criteria

- [ ] A `ResourceRequest` can declare `parser` and/or `emit` in its YAML and the config loads without error
- [ ] `ResourceRequest` exposes the parsed `parser`/`emit` data to consumers (jobs) in a structured form
- [ ] Invalid/missing `emit.client` references produce a clear config validation error, consistent with existing validation conventions (mirrors `ClientNotFound`)
- [ ] `emit.client` accepts both a bare name and a `{name, namespace}` object, same as the top-level `client:` field
- [ ] Malformed `parser`/`emit` blocks (unknown `type`, invalid `emit.method`) raise a config error at load time rather than being silently skipped
- [ ] Existing configs without `parser`/`emit` are unaffected
- [ ] Specs cover both sections being present, absent, and combined with `actions`/`assets`

## Related

Part of #671 (see that issue for the full feature design and rationale). Foundation for the `ExtractionJob`/parser sub-issue and the `EmitJob` sub-issue.
