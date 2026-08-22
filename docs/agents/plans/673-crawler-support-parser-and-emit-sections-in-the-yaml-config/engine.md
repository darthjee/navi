# Engine Plan: Crawler: support parser and emit sections in the YAML config

Main plan: [plan.md](plan.md)

## Overview

`parser` and `emit` are declared per `ResourceRequest` (matching the existing `client`/`actions`/`assets` pattern — `Resource` itself holds no per-request config today). Both are new, simple, non-behavioral typed value objects following `AssetRequest`'s `fromObject`/`fromListObject` shape. `emit.client` is validated eagerly against declared clients by extending `NamespaceMapBuilder`'s existing `#validateClient` mechanism (mirrors `ClientNotFound`). Malformed `parser`/`emit` blocks (missing/unknown `type`, invalid `emit.method`) throw synchronously at construction time, mirroring `MissingActionResource`'s style — not the skip-and-log behavior used by `actions`/`paginated_actions`. `parser.type: json_path` is expected to reuse the existing `PathResolver` dot/bracket mini-language later (sub-issue #675) — this issue does not interpret parser content, it only stores `type` plus whatever extra keys (`match`, `filter`, `fields`, `field`) are present, unvalidated beyond shape (an object).

## Steps

- [01 — Extract shared client-reference parsing helper](engine/01-extract-client-reference-helper.md)
- [02 — Add ResourceRequestParser and ResourceRequestEmit models](engine/02-add-parser-and-emit-models.md)
- [03 — Wire parser/emit into ResourceRequest](engine/03-wire-into-resource-request.md)
- [04 — Validate emit.client in NamespaceMapBuilder](engine/04-validate-emit-client.md)
- [05 — Specs](engine/05-specs.md)

## CI Checks

- `source`: `npm test` (CI job: `jasmine`)
- `source`: `npm run lint` (CI job: `checks`)

## Notes

- `emit.client` must accept the same two forms the top-level `client:` field does today — a bare name string, or a `{name, namespace}` object — so the client-reference parsing logic in `ResourceRequest`'s private `#parseClient` needs to become shared/reusable rather than duplicated (Step 01).
- `parser`'s type-specific keys (`match`, `filter`, `fields`, `field`) are intentionally *not* validated per-`type` in this issue — that's the job of the `regex` (#674) and `json_path` (#675) parser sub-issues that actually interpret them. Only `type` itself is validated (must be `regex` or `json_path`).
- `emit.method` must be one of `POST`, `PUT`, `PATCH` — validated here even though no HTTP call happens yet, since it's part of the config shape. No `HTTP_METHODS`-style enum exists yet in the codebase; introduce one scoped to this validation (or a plain array constant) rather than inlining the check twice.
