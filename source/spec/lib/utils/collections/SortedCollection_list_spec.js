import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;
  let collection;

  beforeEach(() => {
    collection = new SortedCollection([], { sortBy });
  });

  describe('#list', () => {
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
});
