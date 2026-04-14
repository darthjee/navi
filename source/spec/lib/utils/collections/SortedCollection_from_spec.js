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
});
