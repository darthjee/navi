# Issue: Fix Processing of Paginated Actions Processing Job

## Description

`PaginatedActionProcessingJob` calls `ResourceRequestPaginatedAction#execute`, which chains the passing of a `ResponseWrapper` instance as parameters. This wrapper is supposed to contain three things:

- the original parameters from the initial request
- the response headers from the initial request
- the parsed body from the initial request

The original request is executed inside `ResourceRequestJob`, and the response is then wrapped into a `ResponseWrapper`. However, the paginated action configured in the sample YAML fails to resolve headers, raising:

```
MissingMappingVariable: Missing variable in response: headers['PAGE']
```

The root cause appears to be that the `headers` key itself is not found in the `ResponseWrapper`, not merely the specific header value.

## Root Cause

The failure chain is:

1. `CollectionHandler` (dev app) sets `res.set('PAGE', String(page))` — uppercase header name.
2. `Client.js` performs the request via **axios**, which uses Node.js's `http` module under the hood. Node.js normalizes all incoming HTTP header names to **lowercase**, so the header arrives in `response.headers` as `page`, not `PAGE`.
3. `ResourceRequestJob#handleResponse` wraps the response: `new ResponseWrapper(response, parameters)`. The `headers` getter returns `response.headers` — the lowercase-keyed object.
4. The `ResponseWrapper` is enqueued to `PaginatedActionsEnqueuer` → `PaginatedActionEnqueuer` → `PaginatedActionProcessingJob` → `ResourceRequestPaginatedAction#execute`.
5. Inside `execute`, `PaginationConfig#resolvePages` calls `PathResolver#resolve(responseWrapper)`, which traverses `headers['PAGE']` as two segments: `headers` then `PAGE`.
6. **First traversal (`headers`)**: `'headers' in responseWrapper` → `true` — the getter is on `ResponseWrapper.prototype`, so this succeeds.
7. **Second traversal (`PAGE`)**: `'PAGE' in response.headers` → **`false`** — the actual key in the headers object is lowercase `'page'`. `PathSegmentTraverser#ensureKey` throws `MissingMappingVariable`.

The error message `Missing variable in response: headers['PAGE']` is the same regardless of which segment fails (the full path expression is used), which led to the misdiagnosis that `headers` itself was missing.

## Problem

- `PathSegmentTraverser#ensureKey` uses the `in` operator, which is case-sensitive.
- HTTP response headers received through Node.js are always lowercased, regardless of how the server set them.
- The sample YAML uses `headers['PAGE']` (uppercase) but the actual key in `response.headers` is `'page'` (lowercase).

## Expected Behavior

- The `ResponseWrapper` passed to paginated actions correctly exposes `headers` (it does).
- The path resolver should be able to resolve `headers['PAGE']` even when the underlying key is lowercase `'page'`, OR the system should document/enforce that header keys in YAML config must be lowercase.
- Pagination driven by response headers should work end-to-end.

## Solution

Options (pick one):

1. **Fix the sample config** — change `headers['PAGE']` to `headers['page']` in `navi_config.yml.sample`. Simple but requires users to know headers are lowercase.
2. **Case-insensitive header lookup in `ResponseWrapper`** — override the `headers` getter to return a Proxy that normalizes key access (case-insensitive), so `headers['PAGE']` and `headers['page']` both work.
3. **Case-insensitive key check in `PathSegmentTraverser`** — make `#ensureKey` do a case-insensitive search, but only this is too broad and could hide bugs in non-header paths.

Option 2 is the most robust user-facing fix; option 1 is the minimal correct fix.

## Benefits

- Enables header-based pagination, which is a documented feature of Navi.
- Aligns runtime behavior with the sample configuration shipped with the project.
- Reduces confusion for users who follow the sample YAML and encounter this error.

---
See issue for details: https://github.com/darthjee/navi/issues/529
