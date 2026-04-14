import { SortedCollection } from '../../../../lib/utils/collections/SortedCollection.js';

describe('SortedCollection', () => {
  const sortBy = (obj) => obj.value;

  describe('constructor', () => {
    it('throws if sortBy is not provided', () => {
      expect(() => new SortedCollection([])).toThrowError('sortBy must be a function');
    });

    it('throws if sortBy is not a function', () => {
      expect(() => new SortedCollection([], { sortBy: 'date' })).toThrowError('sortBy must be a function');
    });

    it('creates an empty collection when called with no elements', () => {
      const collection = new SortedCollection([], { sortBy });
      expect(collection.size()).toEqual(0);
    });

    it('accepts an initial set', () => {
      const collection = new SortedCollection([{ value: 3 }, { value: 1 }], { sortBy });
      expect(collection.size()).toEqual(2);
    });

    it('does not sort on construction (deferred)', () => {
      const collection = new SortedCollection([{ value: 3 }, { value: 1 }], { sortBy });
      expect(collection.size()).toEqual(2);
    });
  });
});
