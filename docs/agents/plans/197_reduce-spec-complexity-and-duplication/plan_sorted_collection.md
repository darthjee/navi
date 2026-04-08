# Plan: SortedCollection_spec.js

## File
`source/spec/utils/SortedCollection_spec.js` (271 lines)

## Problem

Five consecutive `describe` blocks — `#select`, `#after`, `#from`, `#before`, `#upTo` — each
contain an identical `beforeEach`:

```js
beforeEach(() => {
  collection = new SortedCollection(
    [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
    { sortBy }
  );
});
```

This setup is duplicated verbatim 5 times. Each block also implicitly repeats the same
four-element fixture.

## Current structure

```
describe('SortedCollection')
  describe('constructor') ...
  describe('#push')
    beforeEach → empty collection
    ...
  describe('#list')
    beforeEach → empty collection
    ...
  describe('#size') ...

  describe('#select')
    beforeEach → 4-element collection   ← duplicated
    ...
  describe('#after')
    beforeEach → 4-element collection   ← duplicated
    ...
  describe('#from')
    beforeEach → 4-element collection   ← duplicated
    ...
  describe('#before')
    beforeEach → 4-element collection   ← duplicated
    ...
  describe('#upTo')
    beforeEach → 4-element collection   ← duplicated
    ...

  describe('#hasAny / #hasItem') ...
```

## Solution

Wrap the five filter-method `describe` blocks inside a shared parent `describe` that owns the
single `beforeEach`:

```js
describe('with a 4-element collection', () => {
  beforeEach(() => {
    collection = new SortedCollection(
      [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
      { sortBy }
    );
  });

  describe('#select', () => { ... });
  describe('#after',  () => { ... });
  describe('#from',   () => { ... });
  describe('#before', () => { ... });
  describe('#upTo',   () => { ... });
});
```

All other `describe` blocks (`constructor`, `#push`, `#list`, `#size`, `#hasAny / #hasItem`)
remain unchanged — they use empty or ad-hoc collections and are not affected.

## Expected outcome

- File shrinks from ~271 lines to ~240 lines (removes 4 duplicate `beforeEach` blocks).
- The four-element fixture is defined in exactly one place.
- Adding a new filter method only requires a new `describe` inside the wrapper, not a new `beforeEach`.
