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

## Problem

- `ResourceRequestPaginatedAction#execute` receives a `ResponseWrapper` that is missing the `headers` property (or it is not properly exposed/mapped).
- The sample configuration using `pagination: pages: headers['PAGE']` fails at runtime.
- The `PAGE` header is correctly set by `CollectionHandler` in the dev application, so the issue is in how the response wrapper is constructed or how its properties are accessed.

## Expected Behavior

- The `ResponseWrapper` passed to paginated actions should expose `headers`, `params`, and `parsedBody` correctly.
- The sample paginated action configuration should resolve `headers['PAGE']` without error.
- Pagination driven by response headers should work end-to-end.

## Solution

- Inspect how `ResourceRequestJob` builds the `ResponseWrapper` and verify that response headers are included.
- Verify that `ResourceRequestPaginatedAction` correctly reads the `headers` property from the wrapper when resolving mapping variables.
- Add or update tests covering the full paginated flow with header-based pagination.

## Benefits

- Enables header-based pagination, which is a documented feature of Navi.
- Aligns runtime behavior with the sample configuration shipped with the project.
- Reduces confusion for users who follow the sample YAML and encounter this error.

---
See issue for details: https://github.com/darthjee/navi/issues/529
