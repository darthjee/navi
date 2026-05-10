# Issue: Refactor Request Handlers

## Description

Now that all `RequestHandler` subclasses have been removed and only `RequestHandlerExecutor` subclasses remain, the executor classes can be renamed back to `RequestHandler`. This rename, combined with the fact that `handle()` no longer receives `req` and `res` as arguments (they are stored as instance variables in the constructor), opens the opportunity to refactor the `handle()` implementations to be more readable.

## Problem

- `RequestHandlerExecutor` is now the only handler abstraction, but its name still reflects the old two-layer design.
- The `handle()` method signature is clean (no arguments), but internal code may still be written as if arguments were passed — reducing clarity.
- The naming inconsistency between the old intent and the new structure makes the codebase harder to follow.

## Expected Behavior

- All `RequestHandlerExecutor` subclasses in `source` and `dev/app` are renamed to `RequestHandler` (e.g., `IndexHandlerExecutor` → `IndexHandler`).
- The base class `RequestHandlerExecutor` is renamed to `RequestHandler`.
- The `handle()` method implementations are refactored where applicable to improve readability now that `req` and `res` are instance variables rather than arguments.
- Documentation in `docs/agents` is updated to reflect the new naming.

## Solution

1. Rename the base class `RequestHandlerExecutor` to `RequestHandler` in `source/lib/common/server/`.
2. Rename all `*HandlerExecutor` subclasses in `source/lib/server/handlers/` and `dev/app/lib/handlers/` to `*Handler`.
3. Update all imports and references throughout `source` and `dev/app`.
4. Refactor `handle()` methods where readability can be improved by leveraging instance variables.
5. Update `docs/agents` to reflect the new class names and architecture.

## Benefits

- Simpler, more intuitive naming — `RequestHandler` better describes the role of these classes.
- Removes the "Executor" suffix that was introduced to distinguish the two-layer design, which no longer exists.
- Improved readability of `handle()` implementations.

---
See issue for details: https://github.com/darthjee/navi/issues/581
