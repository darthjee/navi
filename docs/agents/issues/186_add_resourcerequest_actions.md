# Issue: Add ResourceRequest Actions

## Description

Currently, after a resource request is made, nothing happens with the response. We need to introduce an `actions` configuration key inside `ResourceRequest` that defines what to do with the response data.

## Problem

- The response from a `ResourceRequest` is received but completely ignored.
- There is no mechanism to extract values from the response and map them into variables for follow-up processing.

## Expected Behavior

- `ResourceRequest` accepts an optional `actions` list in its configuration.
- Each action in the list has:
  - `resource`: the name of a resource to associate the action with.
  - `variables_map`: a key-value mapping where each key is a field from the response and its value is the new variable name it should be mapped to.
    - Example: `id: 'category_id'` → takes the `id` field from the response and exposes it as `category_id`.
- When the response is received, for each action, log:
  ```
  Executing action <resource_name> for <object_with_transformed_variables>
  ```
- If the response body is an array, each action is executed once per element in the array.

## Solution

1. Add `actions` as an optional key in the `ResourceRequest` configuration schema.
2. Parse and validate each action entry (`resource` + `variables_map`) during config loading.
3. After a successful response, iterate over `actions`:
   - Apply `variables_map` to the response object (or each element if the response is an array) to produce a transformed variables object.
   - Log `"Executing action <resource_name> for <transformed_variables>"` for each action (and each array element).

## Benefits

- Enables response-driven chaining: data returned from one request can be mapped into variables for subsequent requests.
- Lays the groundwork for future enhancements where actions trigger actual resource enqueuing instead of just logging.

---
See issue for details: https://github.com/darthjee/navi/issues/186
