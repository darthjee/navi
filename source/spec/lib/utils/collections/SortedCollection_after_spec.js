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
});
