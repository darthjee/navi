# Issue: Pass Parameters from Resource Request to Action

## Description

When a resource request has actions, the system maps parameters using the response object. However, the original parameters of the resource request are lost during this process. It should be possible to access the parameters from the previous request when mapping new parameters for an action.

## Problem

- When an action maps new parameters from a response, the original request parameters are discarded.
- There is no way to reference `parameters.<key>` from the triggering request inside an action's parameter mapping.
- Chained resource requests that need to carry forward a parameter (e.g., a parent ID) from an earlier request cannot do so.

## Expected Behavior

- The action's parameter mapping should be able to reference `parameters.<key>` to access parameters from the originating resource request.
- Example flow:
  - `categories` returns a list and triggers `category_items` with `id: parsed_body.id`.
  - `category_items` returns a list and triggers `category_item` with `id: parsed_body.id` and `category_id: parameters.id` (carried from the previous request's `id` parameter).
  - `category_item` requests `/categories/{:category_id}/items/{:id}.json` correctly using both parameters.

## Solution

- The wrapper around the response object must also hold a reference to the request parameters.
- When evaluating path expressions for action parameter mappings, expose a `parameters` namespace that resolves to the triggering request's parameters.
- Update the parameter expression engine to support `parameters.<key>` alongside `parsed_body.<key>`.

## Benefits

- Enables multi-level resource chaining where parent identifiers must be propagated across chain links.
- Makes Navi more expressive for real-world API traversal scenarios (e.g., nested resources).

---
See issue for details: https://github.com/darthjee/navi/issues/239
