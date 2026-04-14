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
});
