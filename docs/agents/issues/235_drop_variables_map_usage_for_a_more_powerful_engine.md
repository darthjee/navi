# Issue: Drop variables_map Usage for a More Powerful Engine

## Description

The current configuration supports a `variables_map` field on actions, which maps variables to be passed to the next job. This approach is limited and needs to be replaced with a more robust mechanism that gives full access to the HTTP response object.

## Problem

- `variables_map` only supports simple variable mapping and lacks access to the full response.
- There is no way to extract data from the response body (parsed JSON) or response headers using the current approach.
- The mapping class does not receive the full response object, limiting what can be extracted.

## Expected Behavior

- The mapping class receives the entire HTTP response object (or a wrapper around it).
- The response object (or wrapper) exposes a `parsed_body` method that deserializes the JSON body into an object.
- The configuration key is renamed from `variables_map` to `parameters`.
- The new mapping syntax allows extracting values from both the body and headers:

```yaml
parameters: # former variables_map
  id: parsed_body.id
  page: headers['page']
```

## Solution

- Rename `variables_map` to `parameters` in the config schema and all related code.
- Update the mapping class to accept the full response object instead of a flat variables hash.
- Implement a `parsed_body` method on the response object/wrapper that parses the JSON string.
- Support header access via `headers['<header-name>']` syntax in the mapping expressions.
- Update README, DockerHub descriptions, and docs under `docs/agents/` to reflect the new API.

## Benefits

- More expressive and powerful variable extraction from HTTP responses.
- Enables chaining of resources that depend on JSON body fields or response headers.
- Cleaner, more consistent configuration API.

---
See issue for details: https://github.com/darthjee/navi/issues/235
