import { Collection } from '../../../../lib/utils/collections/Collection.js';

describe('Collection', () => {
  let collection;

  class TestCollection extends Collection {
    constructor(items = [], size = 0) {
      super();
      this._items = items;
      this._size = size;
    }

    size() {
      return this._size;
    }

    list() {
      return this._items;
    }
  }

  describe('#hasAny', () => {
    it('returns false when size is 0', () => {
      collection = new TestCollection([], 0);
      expect(collection.hasAny()).toBeFalse();
    });

    it('returns true when size is greater than 0', () => {
      collection = new TestCollection([], 1);
      expect(collection.hasAny()).toBeTrue();
    });
  });

  describe('#findById', () => {
    const itemA = { id: 'a', value: 1 };
    const itemB = { id: 'b', value: 2 };

    beforeEach(() => {
      collection = new TestCollection([itemA, itemB], 2);
    });

    it('returns the item with the matching id', () => {
      expect(collection.findById('a')).toBe(itemA);
    });

    it('returns null when no item matches', () => {
      expect(collection.findById('z')).toBeNull();
    });
  });
});
