# Issue: Add SortedCollection

## Description

A new `SortedCollection` class is needed that maintains elements in sorted order based on a configurable sorting function. It is optimized for frequent insertions by deferring the sort of new elements until iteration is required.

## Expected Behavior

- `SortedCollection` is initialized with an optional initial set (default `[]`) and an options object `{ sortBy: fn }`.
- `sortBy` is a function that extracts a comparable value from an element (e.g. `(obj) => obj.date`).
- Internally, it maintains two lists: a sorted list and a non-sorted (pending) list.
- Any newly added element (including those from the initial set) goes into the non-sorted list.
- When elements are accessed or iterated, the non-sorted elements are sorted and merged into the sorted list before returning results.
- All iteration methods operate over the fully merged and sorted array.

## Solution

- Implement the `SortedCollection` class with:
  - Constructor: `new SortedCollection(initialSet = [], { sortBy })` — throws if `sortBy` is not a function
  - Internal state: `_sorted[]` and `_nonSorted[]`
  - A flush/merge step triggered before any iteration that sorts `_nonSorted` and merges it into `_sorted` (e.g. using a merge-sort-style algorithm to combine two already-sorted arrays efficiently)
  - `list()` — returns a copy of the sorted array (not the internal reference, to prevent external mutation)
  - `select(fn)` — returns a new collection (or array) of elements for which `fn(element)` returns `true`
  - `after(value)` — short-circuits, returns elements whose sort field is `> value`
  - `from(value)` — short-circuits, returns elements whose sort field is `>= value`
  - `before(value)` — short-circuits, returns elements whose sort field is `< value`
  - `upTo(value)` — short-circuits, returns elements whose sort field is `<= value`

## Benefits

- Efficient sorted access with deferred sorting of new inserts.
- Short-circuit range methods avoid scanning the full collection when only a subset is needed.
- Useful for time-ordered or priority-ordered data (e.g. scheduling, date-based filtering).

---
See issue for details: https://github.com/darthjee/navi/issues/174
