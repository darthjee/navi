# Issue: Use Variables When Requesting

## Description

When `ResourceRequestAction` enqueues a new `ResourceRequestJob`, it passes along parameters (variables) extracted from a parent resource's response. However, when `ResourceRequestJob` performs the request, it ignores those parameters and does not interpolate them into the URL path.

## Problem

- `ResourceRequestAction` correctly enqueues `ResourceRequestJob` with variables (e.g., `id: 1`, `id: 2`)
- `ResourceRequestJob` performs the HTTP request using the raw URL template (e.g., `/categories/{:id}.json`) instead of interpolating the variables
- As a result, the request is made to `/categories/{:id}.json` instead of `/categories/1.json` and `/categories/2.json`

## Example

Given a resource that returns a list:

```json
[
  { "id": 1, "name": "some category" },
  { "id": 2, "name": "some other category" }
]
```

And a chained resource configured as:

```yaml
category:
  - url: /categories/{:id}.json
    status: 200
```

Currently, both enqueued jobs request `/categories/{:id}.json` (uninterpolated). They should request `/categories/1.json` and `/categories/2.json` respectively.

## Expected Behavior

- `ResourceRequestJob` interpolates the variables passed by `ResourceRequestAction` into the URL path before making the HTTP request
- Each job uses its own set of variables to resolve path parameters (e.g., `{:id}`)

## Solution

- In `ResourceRequestJob`, apply variable interpolation to the URL before performing the request
- Use the variables passed during enqueueing to replace named path parameters (`{:param}`) in the URL template

## Benefits

- Enables proper resource chaining where child resources depend on dynamic path parameters from parent responses
- Makes the cache-warmer fully functional for nested/parameterized endpoints

---
See issue for details: https://github.com/darthjee/navi/issues/228
