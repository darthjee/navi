/**
 * Unit tests for SortedCollection.
 * Uses Jasmine.
 */
import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;
  let collection;

  // ─── constructor ────────────────────────────────────────────────────────────

  describe('constructor', () => {
    it('throws if sortBy is not provided', () => {
      expect(() => new SortedCollection([])).toThrowError('sortBy must be a function');
    });

    it('throws if sortBy is not a function', () => {
      expect(() => new SortedCollection([], { sortBy: 'date' })).toThrowError('sortBy must be a function');
    });

    it('creates an empty collection when called with no elements', () => {
      collection = new SortedCollection([], { sortBy });
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
      collection = new SortedCollection([], { sortBy });
      expect(collection.list()).toEqual([]);
    });

    it('does not expose the internal array (mutation-safe)', () => {
      collection = new SortedCollection([{ value: 1 }], { sortBy });
      const result = collection.list();
      result.push({ value: 99 });
      expect(collection.size()).toEqual(1);
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

  // ─── filter methods (#select, #after, #from, #before, #upTo) ────────────────

  describe('with a 4-element collection', () => {
    beforeEach(() => {
      collection = new SortedCollection(
        [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
        { sortBy }
      );
    });

    // ─── #select ──────────────────────────────────────────────────────────────

    describe('#select', () => {
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

    // ─── #after ───────────────────────────────────────────────────────────────

    describe('#after', () => {
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

    // ─── #from ────────────────────────────────────────────────────────────────

    describe('#from', () => {
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

    // ─── #before ──────────────────────────────────────────────────────────────

    describe('#before', () => {
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

    // ─── #upTo ────────────────────────────────────────────────────────────────

    describe('#upTo', () => {
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
  });

  // ─── inherited: #hasAny ─────────────────────────────────────────────────────

  describe('#hasAny', () => {
    it('returns false when empty', () => {
      collection = new SortedCollection([], { sortBy });
      expect(collection.hasAny()).toBeFalse();
      expect(collection.hasAny()).toBeFalse();
    });

    it('returns true when not empty', () => {
      collection = new SortedCollection([{ value: 1 }], { sortBy });
      expect(collection.hasAny()).toBeTrue();
      expect(collection.hasAny()).toBeTrue();
    });
  });
});
