# Issue: Refactor JobFactory to use static registry, get, and reset methods

## Description

Refactor the `JobFactory` class to centralize job factory management through three static methods,
removing the need to pass factory references as constructor dependencies across the codebase.

## Problem

- `Application` manages its own `jobRegistry` attribute and passes the factory as a parameter to consumers.
- Classes that need a job factory must receive it as a dependency injection, creating tight coupling.
- There is no centralized place to register or retrieve job factories.

## Expected Behavior

- `JobFactory` exposes three static methods:
  - `registry(name, factory)` — registers a factory under the given name.
  - `get(name)` — retrieves a previously registered factory by name.
  - `reset()` — clears all registered factories.
- `Application` no longer holds a `jobRegistry` attribute; instead it registers the resource job factory globally via `JobFactory.registry("ResourceRequestJob", factory)`.
- Any class that previously received the factory as a parameter calls `JobFactory.get("ResourceRequestJob")` internally when it needs the factory.

## Solution

- Add `static registry(name, factory)`, `static get(name)`, and `static reset()` methods to `JobFactory`.
- Update `Application` to remove the `jobRegistry` attribute and use `JobFactory.registry(...)` to register the factory on startup.
- Update all consumers to call `JobFactory.get(...)` instead of using injected factory references.
- Add/update tests to cover the new static methods and the updated integration points.

## Benefits

- Centralized factory management — no need to thread factory references through constructors.
- Simpler `Application` class with fewer responsibilities.
- Easier to extend: new job types can register their own factories without changing call sites.

---
See issue for details: https://github.com/darthjee/navi/issues/203
