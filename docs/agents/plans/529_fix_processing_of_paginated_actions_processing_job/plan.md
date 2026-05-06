# Plan: Fix Processing of Paginated Actions Processing Job

## Overview

Fix the `MissingMappingVariable` error that occurs when using header-based pagination in the sample config, and add clear documentation that HTTP response header names must be referenced in **lowercase** in all path expressions.

## Context

Node.js normalizes all incoming HTTP response header names to lowercase. The sample config uses `headers['PAGE']` (uppercase), but the actual key stored in the response headers object is `'page'`. When `PathSegmentTraverser#ensureKey` checks `'PAGE' in response.headers`, it returns `false` and throws `MissingMappingVariable`.

All existing documentation examples already use lowercase (e.g. `headers['page']`, `headers['x-next-page']`), so only the sample config and some docs need a clarifying note.

## Implementation Steps

### Step 1 — Fix the sample config

In `docker_volumes/config/navi_config.yml.sample`, change the `pages` path expression from uppercase to lowercase:

```yaml
# before
- pages: headers['PAGE']

# after
- pages: headers['page']
```

### Step 2 — Add lowercase note to `docs/agents/flow.md`

The file already has a path-expression namespace note at line 90–91:

```
> **Path expression namespace: `parsedBody` is camelCase.**
> Always write `parsedBody.field` — never `parsed_body.field`. Valid namespaces: `parsedBody`, `headers`, `parameters`.
```

Extend that note to also explain header case normalization:

```
> **Header names are always lowercase.**
> Node.js normalizes HTTP response header names to lowercase before they reach Navi. Always use lowercase when referencing headers (e.g. `headers['x-total-pages']`, not `headers['X-Total-Pages']`).
```

### Step 3 — Add lowercase note to user-facing docs

Add a brief clarifying sentence to each of the following files, near the path expression / `headers` reference:

- `README.md`
- `source/README.md`
- `DOCKERHUB_DESCRIPTION.md`
- `docs/HOW_TO_USE_NAVI.md`

The note should be consistent across all files, e.g.:

> **Note:** HTTP response header names are always lowercase after Node.js normalization. Use lowercase keys in path expressions (e.g. `headers['x-total-pages']`), regardless of how the server set them.

## Files to Change

- `docker_volumes/config/navi_config.yml.sample` — fix `headers['PAGE']` → `headers['page']`
- `docs/agents/flow.md` — extend the path-expression namespace note with header case clarification
- `README.md` — add header case note near path expression docs
- `source/README.md` — same as above
- `DOCKERHUB_DESCRIPTION.md` — same as above
- `docs/HOW_TO_USE_NAVI.md` — same as above

## Notes

- No code changes are required. The `PathSegmentTraverser` behavior is correct; the problem is purely in the sample config and missing documentation.
- The dev app's `CollectionHandler` sets headers in uppercase (`res.set('PAGE', ...)`), which is valid on the server side — Express/HTTP allows any casing. The normalization happens on the **receiving** side (Navi/axios/Node.js). No change needed in the dev app.
- All existing documentation examples already use lowercase header keys, so no example snippets need correction — only the sample YAML and explicit clarifying notes.
