# Issue: Unify Collections

## Description

The classes `IdentifiableCollection` and `Queue` share several similar methods and could be unified through a common base class `Collection`.

## Problem

- `IdentifiableCollection` and `Queue` both implement similar methods (`hasAny`, `hasItem`, `push`, `size`) independently.
- This duplication violates DRY principles and increases the maintenance surface.

## Expected Behavior

- A base class `Collection` is introduced, containing the shared logic.
- `IdentifiableCollection` and `Queue` extend `Collection`, inheriting the common methods.
- Each subclass retains only the behavior specific to its own purpose.

## Solution

- Identify all shared methods between `IdentifiableCollection` and `Queue` (`hasAny`, `hasItem`, `push`, `size`).
- Extract those methods into a new base class `Collection`.
- Make `IdentifiableCollection` and `Queue` extend `Collection`.
- Ensure existing tests continue to pass and add tests for the new base class if applicable.

## Benefits

- Reduces code duplication.
- Simplifies future maintenance: changes to shared behavior only need to happen in one place.
- Establishes a clear class hierarchy for collection-type structures in the codebase.
- Paves the way for introducing new collection types (e.g., `SortedCollection`) by providing a stable base to extend.

---
See issue for details: https://github.com/darthjee/navi/issues/171
