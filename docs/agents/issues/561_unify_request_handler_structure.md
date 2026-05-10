# Issue: Unify Request Handler Structure

## Description

Both `dev/app` and `source` have their own independent implementations of a base `RequestHandler`. The goal is to unify them by moving the shared base class into the `common/` module so that both applications can reuse it, then remove the now-redundant implementation from `dev/app`.

## Problem

- `dev/app` and `source` each maintain a separate `RequestHandler` base class with duplicated logic.
- Keeping two implementations in sync increases maintenance burden and risks divergence.

## Expected Behavior

- A single base `RequestHandler` lives in the shared `common/` module (under the appropriate subfolder).
- Both `source` and `dev/app` import and extend the shared base class.
- The standalone `RequestHandler` in `dev/app` (and its dedicated tests) is removed.
- Tests from `source` that cover the shared base are also applied to `dev/app` to maintain coverage.

## Solution

1. Move the base `RequestHandler` from `source` into `common/` under the correct subfolder.
2. Update `source` to import `RequestHandler` from `common/` instead of its local copy.
3. Update `dev/app` to import `RequestHandler` from `common/` and remove its own implementation.
4. Delete the now-redundant `RequestHandler` file and tests from `dev/app`.
5. Add the relevant `source` tests to `dev/app`'s test suite to preserve coverage.
6. Update `docs/agents` to reflect the new location of `RequestHandler`.

## Benefits

- Eliminates code duplication between `source` and `dev/app`.
- Single source of truth for request handler base logic.
- Easier maintenance: changes to the base class propagate to both applications automatically.

---
See issue for details: https://github.com/darthjee/navi/issues/561
