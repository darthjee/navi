import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;
  let collection;

  beforeEach(() => {
    collection = new SortedCollection(
      [{ value: 1 }, { value: 2 }, { value: 3 }, { value: 4 }],
      { sortBy }
    );
  });

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
});
