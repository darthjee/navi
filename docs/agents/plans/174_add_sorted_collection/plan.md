# Plan: Add SortedCollection

## Overview

Implement a `SortedCollection` class that extends `Collection` and maintains elements in sorted order using a deferred merge strategy. New elements are buffered in a non-sorted list and merged into the sorted list only when iteration is needed.

## Context

The project already has a `Collection` base class (`source/lib/utils/Collection.js`) that provides `hasAny()` and `hasItem()` based on `size()`, and an `IdentifyableCollection` subclass that follows the private-field (`#`) pattern. `SortedCollection` should follow the same structure and conventions.

The merge strategy chosen is:
1. **Sort `_nonSorted`** using the `sortBy` function — O(m log m)
2. **Merge two sorted arrays** using a two-pointer algorithm — O(n + m)

This is optimal because the `_sorted` array is already sorted and does not need to be re-sorted.

For the range methods (`after`, `from`, `before`, `upTo`), **binary search** is used to find the cut-off index — O(log n) — then only the relevant slice is returned.

## Implementation Steps

### Step 1 — Create `SortedCollection` class

Create `source/lib/utils/SortedCollection.js` extending `Collection`.

- Constructor: `constructor(initialSet = [], { sortBy } = {})`
- Private fields: `#sorted = []`, `#nonSorted = []`, `#sortBy`
- All elements from `initialSet` go into `#nonSorted`
- Implement a private `#flush()` method that:
  1. If `#nonSorted` is empty, returns immediately
  2. Sorts `#nonSorted` using `#sortBy`
  3. Merges `#nonSorted` into `#sorted` using two-pointer merge
  4. Clears `#nonSorted`
- Implement `push(item)` — appends to `#nonSorted`
- Implement `list()` — calls `#flush()`, returns `#sorted`
- Implement `size()` — returns `#sorted.length + #nonSorted.length`
- Implement `select(fn)` — calls `#flush()`, returns `#sorted.filter(fn)`

### Step 2 — Implement range methods with binary search

All four range methods call `#flush()` first, then use binary search on `#sorted` to locate the boundary index and slice:

- `after(value)` — elements where `sortBy(el) > value`
- `from(value)` — elements where `sortBy(el) >= value`
- `before(value)` — elements where `sortBy(el) < value`
- `upTo(value)` — elements where `sortBy(el) <= value`

Binary search finds the first index that satisfies the boundary condition, making each range method O(log n) for the lookup + O(k) for the slice, where k is the result size.

### Step 3 — Write specs

Create `source/spec/utils/SortedCollection_spec.js` covering:

- Constructor with and without initial elements
- `push` defers sorting (non-sorted list grows)
- `list()` triggers flush and returns sorted elements
- `size()` returns correct count before and after flush
- `select(fn)` filters correctly
- `after`, `from`, `before`, `upTo` with boundary values
- Edge cases: empty collection, duplicate sort values, single element

## Files to Change

- `source/lib/utils/SortedCollection.js` — new file, the implementation
- `source/spec/utils/SortedCollection_spec.js` — new file, the specs

## Notes

- Use private fields (`#`) consistent with `IdentifyableCollection`.
- `sortBy` extracts a comparable value; comparison uses `<=` / `<` on the extracted values directly.
- The `select` method returns a plain array (like `filter`), not a new `SortedCollection`, unless there is a reason to wrap it later.
- The range methods also return plain arrays; they short-circuit via binary search, not by breaking a loop.
