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
