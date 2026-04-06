# Plan: Add SortedCollection

## Overview

Implement a `SortedCollection` class that extends `Collection` and maintains elements in sorted order using a deferred merge strategy. New elements are buffered in a non-sorted list and merged into the sorted list only when iteration is needed.

## Context

The project already has a `Collection` base class (`source/lib/utils/Collection.js`) that provides `hasAny()` and `hasItem()` based on `size()`, and an `IdentifyableCollection` subclass that follows the private-field (`#`) pattern. `SortedCollection` should follow the same structure and conventions.

The merge strategy chosen is:
1. **Sort `#nonSorted`** using the `sortBy` function — O(m log m)
2. **Merge two sorted arrays** using a two-pointer algorithm — O(n + m)

This is optimal because the `#sorted` array is already sorted and does not need to be re-sorted.

For the range methods (`after`, `from`, `before`, `upTo`), **binary search** is used to find the cut-off index — O(log n) — then only the relevant slice is returned.

## Implementation Steps

### Step 1 — Create `SortedCollection` class

Create `source/lib/utils/SortedCollection.js` extending `Collection`.

```js
import { Collection } from './Collection.js';

class SortedCollection extends Collection {
  #sorted = [];
  #nonSorted = [];
  #sortBy;

  constructor(initialSet = [], { sortBy } = {}) {
    super();
    this.#sortBy = sortBy;
    this.#nonSorted = [...initialSet];
  }

  push(item) {
    this.#nonSorted.push(item);
  }

  list() {
    this.#flush();
    return this.#sorted;
  }

  size() {
    return this.#sorted.length + this.#nonSorted.length;
  }

  select(fn) {
    this.#flush();
    return this.#sorted.filter(fn);
  }

  after(value) {
    this.#flush();
    const i = this.#binarySearch(value, 'after');
    return this.#sorted.slice(i);
  }

  from(value) {
    this.#flush();
    const i = this.#binarySearch(value, 'from');
    return this.#sorted.slice(i);
  }

  before(value) {
    this.#flush();
    const i = this.#binarySearch(value, 'before');
    return this.#sorted.slice(0, i);
  }

  upTo(value) {
    this.#flush();
    const i = this.#binarySearch(value, 'upTo');
    return this.#sorted.slice(0, i);
  }

  #flush() {
    if (this.#nonSorted.length === 0) return;

    this.#nonSorted.sort((a, b) => {
      const va = this.#sortBy(a);
      const vb = this.#sortBy(b);
      return va < vb ? -1 : va > vb ? 1 : 0;
    });

    this.#sorted = this.#merge(this.#sorted, this.#nonSorted);
    this.#nonSorted = [];
  }

  #merge(sorted, incoming) {
    const result = [];
    let i = 0, j = 0;

    while (i < sorted.length && j < incoming.length) {
      if (this.#sortBy(sorted[i]) <= this.#sortBy(incoming[j])) {
        result.push(sorted[i++]);
      } else {
        result.push(incoming[j++]);
      }
    }

    return result.concat(sorted.slice(i), incoming.slice(j));
  }

  // Returns the boundary index for slicing #sorted based on the range method.
  // 'after'  → first index where sortBy(el) > value
  // 'from'   → first index where sortBy(el) >= value
  // 'before' → first index where sortBy(el) >= value  (exclusive upper bound)
  // 'upTo'   → first index where sortBy(el) > value   (exclusive upper bound)
  #binarySearch(value, mode) {
    let lo = 0, hi = this.#sorted.length;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const v = this.#sortBy(this.#sorted[mid]);

      if (mode === 'after' || mode === 'upTo') {
        if (v <= value) lo = mid + 1;
        else hi = mid;
      } else { // 'from' or 'before'
        if (v < value) lo = mid + 1;
        else hi = mid;
      }
    }

    return lo;
  }
}

export { SortedCollection };
```

**Notes on `#binarySearch`:**

| Method   | Finds first index where… | Slice direction |
|----------|--------------------------|-----------------|
| `after`  | `sortBy(el) > value`     | `slice(i)`      |
| `from`   | `sortBy(el) >= value`    | `slice(i)`      |
| `before` | `sortBy(el) >= value`    | `slice(0, i)`   |
| `upTo`   | `sortBy(el) > value`     | `slice(0, i)`   |

`after` and `upTo` share the same binary search condition (`v <= value → go right`); `from` and `before` share the other (`v < value → go right`). The difference is only in which side of the boundary is returned.

### Step 2 — Write specs

Create `source/spec/utils/SortedCollection_spec.js`.

Each `describe` block below maps to a method or behaviour group.

```js
import { SortedCollection } from '../../lib/utils/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;
  let collection;

  // ─── constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('creates an empty collection when called with no arguments', () => {
      collection = new SortedCollection();
      expect(collection.size()).toEqual(0);
    });

    it('accepts an initial set', () => {
      collection = new SortedCollection([{ value: 3 }, { value: 1 }], { sortBy });
      expect(collection.size()).toEqual(2);
    });

    it('does not sort on construction (deferred)', () => {
      // size is correct without triggering a flush
      collection = new SortedCollection([{ value: 3 }, { value: 1 }], { sortBy });
      expect(collection.size()).toEqual(2);
    });
  });

  // ─── #push ──────────────────────────────────────────────────────────────────

  describe('#push', () => {
    beforeEach(() => {
      collection = new SortedCollection([], { sortBy });
    });

    it('increases size by 1', () => {
      collection.push({ value: 5 });
      expect(collection.size()).toEqual(1);
    });

    it('defers sorting until list() is called', () => {
      collection.push({ value: 3 });
      collection.push({ value: 1 });
      collection.push({ value: 2 });
      // size is correct without triggering a flush
      expect(collection.size()).toEqual(3);
    });
  });

  // ─── #list ──────────────────────────────────────────────────────────────────

  describe('#list', () => {
    beforeEach(() => {
      collection = new SortedCollection([], { sortBy });
    });

    it('returns elements sorted ascending', () => {
      collection.push({ value: 3 });
      collection.push({ value: 1 });
      collection.push({ value: 2 });
      expect(collection.list().map(e => e.value)).toEqual([1, 2, 3]);
    });

    it('merges new pushes into already-sorted list', () => {
      collection.push({ value: 1 });
      collection.push({ value: 3 });
      collection.list(); // flush

      collection.push({ value: 2 }); // goes into nonSorted
      expect(collection.list().map(e => e.value)).toEqual([1, 2, 3]);
    });

    it('handles duplicate sort values', () => {
      collection.push({ value: 2 });
      collection.push({ value: 2 });
      collection.push({ value: 1 });
      expect(collection.list().map(e => e.value)).toEqual([1, 2, 2]);
    });

    it('returns empty array for empty collection', () => {
      collection = new SortedCollection();
      expect(collection.list()).toEqual([]);
    });

    it('sorts elements from the initial set', () => {
      collection = new SortedCollection(
        [{ value: 5 }, { value: 2 }, { value: 8 }],
        { sortBy }
      );
      expect(collection.list().map(e => e.value)).toEqual([2, 5, 8]);
    });
  });

  // ─── #size ──────────────────────────────────────────────────────────────────

  describe('#size', () => {
    it('counts elements from both sorted and non-sorted lists', () => {
      collection = new SortedCollection([{ value: 1 }], { sortBy });
      collection.list(); // flush: moves 1 element to sorted
      collection.push({ value: 2 }); // goes to nonSorted
      expect(collection.size()).toEqual(2);
    });
  });

  // ─── #select ────────────────────────────────────────────────────────────────

  describe('#select', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    it('returns elements matching the predicate', () => {
      const result = collection.select(e => e.value % 2 === 0);
      expect(result.map(e => e.value)).toEqual([2, 4]);
    });

    it('returns empty array when nothing matches', () => {
      const result = collection.select(e => e.value > 10);
      expect(result).toEqual([]);
    });

    it('returns all elements when all match', () => {
      const result = collection.select(e => e.value > 0);
      expect(result.map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── #after ─────────────────────────────────────────────────────────────────

  describe('#after', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    it('returns elements strictly greater than the value', () => {
      expect(collection.after(2).map(e => e.value)).toEqual([3, 4]);
    });

    it('excludes the element equal to the value', () => {
      expect(collection.after(3).map(e => e.value)).toEqual([4]);
    });

    it('returns empty when value is >= max', () => {
      expect(collection.after(4)).toEqual([]);
    });

    it('returns all when value is < min', () => {
      expect(collection.after(0).map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── #from ──────────────────────────────────────────────────────────────────

  describe('#from', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    it('returns elements greater than or equal to the value', () => {
      expect(collection.from(2).map(e => e.value)).toEqual([2, 3, 4]);
    });

    it('includes the element equal to the value', () => {
      expect(collection.from(4).map(e => e.value)).toEqual([4]);
    });

    it('returns empty when value is > max', () => {
      expect(collection.from(5)).toEqual([]);
    });

    it('returns all when value is <= min', () => {
      expect(collection.from(1).map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── #before ────────────────────────────────────────────────────────────────

  describe('#before', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    it('returns elements strictly less than the value', () => {
      expect(collection.before(3).map(e => e.value)).toEqual([1, 2]);
    });

    it('excludes the element equal to the value', () => {
      expect(collection.before(2).map(e => e.value)).toEqual([1]);
    });

    it('returns empty when value is <= min', () => {
      expect(collection.before(1)).toEqual([]);
    });

    it('returns all when value is > max', () => {
      expect(collection.before(5).map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── #upTo ──────────────────────────────────────────────────────────────────

  describe('#upTo', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    it('returns elements less than or equal to the value', () => {
      expect(collection.upTo(3).map(e => e.value)).toEqual([1, 2, 3]);
    });

    it('includes the element equal to the value', () => {
      expect(collection.upTo(1).map(e => e.value)).toEqual([1]);
    });

    it('returns empty when value is < min', () => {
      expect(collection.upTo(0)).toEqual([]);
    });

    it('returns all when value is >= max', () => {
      expect(collection.upTo(4).map(e => e.value)).toEqual([1, 2, 3, 4]);
    });
  });

  // ─── inherited: #hasAny / #hasItem ──────────────────────────────────────────

  describe('#hasAny / #hasItem', () => {
    it('returns false when empty', () => {
      collection = new SortedCollection();
      expect(collection.hasAny()).toBeFalse();
      expect(collection.hasItem()).toBeFalse();
    });

    it('returns true when not empty', () => {
      collection = new SortedCollection([{ value: 1 }], { sortBy });
      expect(collection.hasAny()).toBeTrue();
      expect(collection.hasItem()).toBeTrue();
    });
  });
});
```

## Files to Change

- `source/lib/utils/SortedCollection.js` — new file, the implementation
- `source/spec/utils/SortedCollection_spec.js` — new file, the specs

## Notes

- Use private fields (`#`) consistent with `IdentifyableCollection`.
- `sortBy` extracts a comparable value; comparison uses `<=` / `<` on the extracted values directly.
- `select` and range methods return plain arrays, not a new `SortedCollection`.
- The range methods short-circuit via binary search, not by breaking a loop.
- `#binarySearch` is shared by all four range methods; the `mode` argument controls which boundary condition is applied.
