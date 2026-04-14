import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;
  let collection;

  beforeEach(() => {
    collection = new SortedCollection([], { sortBy });
  });

  describe('#push', () => {
    it('increases size by 1', () => {
      collection.push({ value: 5 });
      expect(collection.size()).toEqual(1);
    });

    it('defers sorting until list() is called', () => {
      collection.push({ value: 3 });
      collection.push({ value: 1 });
      collection.push({ value: 2 });
      expect(collection.size()).toEqual(3);
    });
  });
});
