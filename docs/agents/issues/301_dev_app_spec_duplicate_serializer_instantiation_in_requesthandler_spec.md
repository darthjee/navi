# Issue: dev/app/spec — Duplicate Serializer instantiation in RequestHandler_spec

## Description

`spec/lib/RequestHandler_spec.js` creates two separate `new Serializer(['id', 'name'])` instances with identical configuration in two different `describe` blocks. If the attribute list changes, both lines must be updated independently, risking test drift if only one is updated.

## Problem

- `new Serializer(['id', 'name'])` appears twice in the same spec file:
  - Inside `describe('with a custom extractorFactory')`
  - Inside `describe('with a serializer')`
- Same configuration expressed twice with no shared reference
- One instance may be updated while the other is missed, silently causing divergence

## Expected Behavior

- A single shared constant holds the `Serializer` instance at the top of the `describe('RequestHandler')` block
- Both inner `describe` blocks reference the same constant

## Solution

- Extract a shared constant at the top of the outer `describe` block:
  ```js
  const defaultSerializer = new Serializer(['id', 'name']);
  ```
- Replace both local `serializer` declarations with references to `defaultSerializer`

## Benefits

- Single source of truth for the serializer configuration used in tests
- Eliminates the risk of one instance being updated while the other is missed

## Affected Files

- `dev/app/spec/lib/RequestHandler_spec.js`

---
See issue for details: https://github.com/darthjee/navi/issues/301
