import { Collection } from '../../../../lib/utils/collections/Collection.js';

describe('Collection', () => {
  let collection;

  class TestCollection extends Collection {
    constructor(size) {
      super();
      this._size = size;
    }

    size() {
      return this._size;
    }
  }

  describe('#hasAny', () => {
    it('returns false when size is 0', () => {
      collection = new TestCollection(0);
      expect(collection.hasAny()).toBeFalse();
    });

    it('returns true when size is greater than 0', () => {
      collection = new TestCollection(1);
      expect(collection.hasAny()).toBeTrue();
    });
  });

});
