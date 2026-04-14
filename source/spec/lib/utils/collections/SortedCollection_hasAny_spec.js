import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;

  describe('#hasAny', () => {
    it('returns false when empty', () => {
      const collection = new SortedCollection([], { sortBy });
      expect(collection.hasAny()).toBeFalse();
    });

    it('returns true when not empty', () => {
      const collection = new SortedCollection([{ value: 1 }], { sortBy });
      expect(collection.hasAny()).toBeTrue();
    });
  });
});
