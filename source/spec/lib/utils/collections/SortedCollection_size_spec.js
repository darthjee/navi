import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;

  describe('#size', () => {
    it('counts elements from both sorted and non-sorted lists', () => {
      const collection = new SortedCollection([{ value: 1 }], { sortBy });
      collection.list(); // flush: moves 1 element to sorted
      collection.push({ value: 2 }); // goes to nonSorted
      expect(collection.size()).toEqual(2);
    });
  });
});
