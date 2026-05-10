# Issue: Extract Common RequestHandlerExecutor

## Description

A new concept — `RequestHandlerExecutor` — was introduced in commit `bebce3ffdbd53c1075c74132bd650e9b7665a66c`, first applied as `RedirectHandlerExecutor` in `dev/app`. The goal is to extract a shared base class `RequestHandlerExecutor` into `common/`, and then refactor all existing `RequestHandler` implementations in both `dev/app` and `source` to delegate their execution logic into a corresponding `*HandlerExecutor` subclass.

## Problem

- The executor pattern exists in `dev/app` (`RedirectHandlerExecutor`) but has no shared base class yet.
- `RequestHandler` implementations in both `dev/app` and `source` still contain inline execution logic that should be extracted.
- Without a common base, future refactoring and extension of the executor pattern is harder.

## Expected Behavior

- A base `RequestHandlerExecutor` class lives in `common/` (under the appropriate subfolder).
- All `RequestHandler` classes in both `dev/app` and `source` extract their execution logic into a dedicated `*HandlerExecutor` subclass of `RequestHandlerExecutor`.
- The existing `RedirectHandlerExecutor` in `dev/app` is updated to extend the new shared base.

## Solution

1. Create the base `RequestHandlerExecutor` class in `common/` under the correct subfolder.
2. Update `RedirectHandlerExecutor` in `dev/app` to extend `common/RequestHandlerExecutor`.
3. For each `RequestHandler` in `dev/app` and `source`, extract the execution logic into a new `*HandlerExecutor` class that extends `RequestHandlerExecutor`.
4. Update tests in both `dev/app` and `source` to cover the new executor classes.
5. Update `docs/agents` to document the executor pattern and the new base class location.

## Benefits

- Establishes a consistent executor pattern across the entire codebase.
- Enables future refactoring by providing a single, well-defined extension point.
- Reduces logic inside `RequestHandler` classes, keeping them focused on routing concerns.

---
See issue for details: https://github.com/darthjee/navi/issues/569
