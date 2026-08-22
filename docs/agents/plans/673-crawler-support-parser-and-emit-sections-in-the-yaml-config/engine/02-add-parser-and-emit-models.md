# Add ResourceRequestParser and ResourceRequestEmit models

Add two new plain, non-behavioral typed value classes, following `AssetRequest`'s shape (constructor + `static fromObject`/`fromListObject`, no private fields, no registry/job dependencies):

**`ResourceRequestParser`** — `{ type, ...rest }`:
- `type` is required and must be either `'regex'` or `'json_path'`; anything else (including missing) throws a new `InvalidParserType` error at construction time.
- Every other key present (`match`, `filter`, `fields`, `field`, or anything else) is stored as-is, unvalidated — interpreting them belongs to the parser-specific sub-issues (#674 regex, #675 json_path). Store them as a single `attributes`/`options` object rather than hardcoding each key name, so future parser types don't require changes here.

**`ResourceRequestEmit`** — `{ client, method, url }`:
- `client` is parsed via the shared helper from Step 01 (accepts bare name or `{name, namespace}` object) into `clientName`/`clientNamespace`, mirroring `ResourceRequest`'s own getters.
- `method` is required and must be one of `'POST'`, `'PUT'`, `'PATCH'` (case-sensitive, matching the issue's YAML examples); anything else throws a new `InvalidEmitMethod` error at construction time. Define the allowed set as a small exported constant rather than inlining the check, since sub-issue #676 (`EmitJob`) will need the same set.
- `url` is required (no runtime request is made in this issue, but a missing `url` is still a malformed config); reuse the `MissingActionResource`-style pattern (throw synchronously) — either a new dedicated error or a small shared "missing required field" helper if one doesn't already exist.

Add the two new exception classes under `source/lib/exceptions/config/` (sibling to `MissingClientsConfig`/`MissingResourceConfig`), extending `AppError` directly the way `MissingActionResource` does — a short, clear message naming the invalid value/field.

## Files to Change

- `source/lib/models/request/ResourceRequestParser.js` — new.
- `source/lib/models/request/ResourceRequestEmit.js` — new; uses the Step 01 shared client-reference helper.
- `source/lib/exceptions/config/InvalidParserType.js` — new.
- `source/lib/exceptions/config/InvalidEmitMethod.js` — new.
