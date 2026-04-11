# Issue: Make ResourceRegistry Static

## Description

`ResourceRegistry` currently follows a plain instance-based pattern, being instantiated directly inside `Config`'s constructor. Unlike `JobRegistry` and `WorkersRegistry` — which already implement a singleton pattern with static delegation methods — `ResourceRegistry` has no static interface, no centralized `build()` entry point, and no `reset()` method for test isolation.

## Problem

- `ResourceRegistry` is instantiated with `new ResourceRegistry(resources)` inside `Config`, requiring callers to either hold a `Config` reference or receive the instance explicitly.
- No static `build()` method to create and register a globally accessible singleton.
- No static accessors (`getItem`, `filter`, `size`) — only instance methods are available.
- No static `reset()` method, making test isolation harder and inconsistent with other registries.
- This inconsistency with `JobRegistry` and `WorkersRegistry` makes the codebase harder to maintain and understand.

## Expected Behavior

- `ResourceRegistry` exposes a `static #instance` field.
- `ResourceRegistry.build(items)` creates and stores the singleton instance.
- `ResourceRegistry.getItem(name)`, `ResourceRegistry.filter(predicate)`, and `ResourceRegistry.size()` delegate to the stored instance.
- `ResourceRegistry.reset()` clears the instance, enabling clean test isolation.
- `Config` calls `ResourceRegistry.build(resources)` instead of `new ResourceRegistry(resources)`.
- All tests touching `ResourceRegistry` call `ResourceRegistry.reset()` in `afterEach`.

## Solution

1. Add `static #instance` field to `ResourceRegistry`.
2. Implement `static build(items)` — creates and assigns the singleton.
3. Implement `static getItem(name)` — delegates to instance.
4. Implement `static filter(predicate)` — delegates to instance.
5. Implement `static size()` — delegates to instance.
6. Implement `static reset()` — sets `#instance = null`.
7. Add JSDoc to all new static methods.
8. Update `Config.js` to use `ResourceRegistry.build()` instead of `new ResourceRegistry()`.
9. Update `ResourceRequestCollector` if it needs to use static access.
10. Update all affected specs to include `ResourceRegistry.reset()` in `afterEach`.

## Benefits

- Consistent singleton pattern across all registries (`JobRegistry`, `WorkersRegistry`, `ResourceRegistry`).
- Components can access resources via static methods without needing an injected instance.
- Proper test isolation through a standardized `reset()` method.
- Reduced coupling: fewer components need to receive a registry instance explicitly.

---
See issue for details: https://github.com/darthjee/navi/issues/221
