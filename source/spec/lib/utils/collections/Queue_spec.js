import { Queue } from '../../../../lib/utils/collections/Queue.js';

describe('Queue', () => {
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });

  describe('#push', () => {
    it('adds an item to the end of the queue', () => {
      expect(queue.hasAny()).toBeFalse();
      queue.push(1);
      queue.push(2);
      expect(queue.hasAny()).toBeTrue();
    });
  });

  describe('#pick', () => {
    beforeEach(() => {
      queue.push(1);
      queue.push(2);
    });

    it('removes and returns the first item from the queue', () => {
      expect(queue.pick()).toEqual(1);
      expect(queue.hasAny()).toBeTrue();
    });

    it('removes in order and returns the first item from the queue', () => {
      queue.pick();
      expect(queue.pick()).toEqual(2);
      expect(queue.hasAny()).toBeFalse();
    });
  });

  describe('#hasAny', () => {
    it('returns whether the queue has any items', () => {
      expect(queue.hasAny()).toBeFalse();
      queue.push(1);
      expect(queue.hasAny()).toBeTrue();
      queue.pick();
      expect(queue.hasAny()).toBeFalse();
    });
  });

  describe('#size', () => {
    it('returns 0 for a new queue', () => {
      expect(queue.size()).toBe(0);
    });

    it('returns the number of items in the queue', () => {
      queue.push(1);
      queue.push(2);
      expect(queue.size()).toBe(2);
    });

    it('decreases when items are picked', () => {
      queue.push(1);
      queue.push(2);
      queue.pick();
      expect(queue.size()).toBe(1);
      queue.pick();
      expect(queue.size()).toBe(0);
    });
  });

  describe('#findById', () => {
    it('returns the item with the matching id', () => {
      const item = { id: 'x', value: 10 };
      queue.push(item);

      expect(queue.findById('x')).toBe(item);
    });

    it('returns null when no item matches', () => {
      expect(queue.findById('missing')).toBeNull();
    });
  });
});