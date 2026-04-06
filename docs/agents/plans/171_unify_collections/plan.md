# Plan: Unify Collections

## Overview

Introduce a `Collection` base class that extracts the shared interface between `Queue` and `IdentifyableCollection`, reducing duplication and providing a stable foundation for future collection types (e.g., `SortedCollection`).

## Context

Both `Queue` (`source/lib/utils/Queue.js`) and `IdentifyableCollection` (`source/lib/utils/IdentifyableCollection.js`) share overlapping behaviour:

| Method | Queue | IdentifyableCollection | Notes |
|---|---|---|---|
| `push(item)` | adds to array | adds to object keyed by `item.id` | different implementations |
| `size()` | `this.items.length` | cached `this.list().length` | different implementations |
| `hasItem()` | `this.size() > 0` | — | same logic |
| `hasAny()` | — | `this.size() > 0` | same logic |

`hasItem()` and `hasAny()` are functionally identical — both delegate to `this.size() > 0`. These are the clearest candidates for extraction.

`push()` and `size()` share the same name/role but have incompatible implementations; they remain in each subclass.

## Implementation Steps

### Step 1 — Create `Collection` base class

Create `source/lib/utils/Collection.js` with the shared methods:

- `hasAny()` — returns `this.size() > 0`
- `hasItem()` — alias for `hasAny()` (keeps backward compatibility with `Queue` callers)

Both delegate to `size()`, which subclasses must implement.

### Step 2 — Make `Queue` extend `Collection`

- Import and extend `Collection`.
- Remove `hasItem()` (now inherited from base).
- Keep `push()`, `pick()`, and `size()` as-is.

### Step 3 — Make `IdentifyableCollection` extend `Collection`

- Import and extend `Collection`.
- Remove `hasAny()` (now inherited from base).
- Keep all other methods (`push()`, `remove()`, `get()`, `has()`, `byIndex()`, `list()`, `size()`) as-is.

### Step 4 — Add spec for `Collection`

Create `source/spec/utils/Collection_spec.js` to test the base class behaviour in isolation. Use a minimal concrete subclass (test double) that implements `size()`.

Test:
- `#hasAny()` returns `false` when `size()` is `0`, `true` otherwise.
- `#hasItem()` returns `false` when `size()` is `0`, `true` otherwise.

### Step 5 — Verify existing specs pass

Run the full test suite to confirm no regressions in `Queue` or `IdentifyableCollection`.

## Files to Change

- `source/lib/utils/Collection.js` — **new**: base class with `hasAny()` and `hasItem()`
- `source/lib/utils/Queue.js` — extend `Collection`, remove `hasItem()`
- `source/lib/utils/IdentifyableCollection.js` — extend `Collection`, remove `hasAny()`
- `source/spec/utils/Collection_spec.js` — **new**: spec for the base class

## Notes

- `hasItem()` is kept on `Collection` (not just `Queue`) so any future collection subclass can use either name interchangeably.
- `push()` and `size()` are intentionally **not** moved to `Collection` — their implementations are too different to share, and abstracting them without a concrete contract adds unnecessary complexity.
- The `SortedCollection` planned for the future should also extend `Collection`.
