import { Queue } from '../../lib/utils/Queue.js';

describe('Queue', () => {
  let queue;

  beforeEach(() => {
    queue = new Queue();
  });

  describe('#push', () => {
    it('adds an item to the end of the queue', () => {
      expect(queue.hasItem()).toBeFalse();
      queue.push(1);
      queue.push(2);
      expect(queue.hasItem()).toBeTrue();
    });
  });

  describe('#pick', () => {
    beforeEach(() => {
      queue.push(1);
      queue.push(2);
    });

    it('removes and returns the first item from the queue', () => {
      expect(queue.pick()).toEqual(1);
      expect(queue.hasItem()).toBeTrue();
    });

    it('removes in order and returns the first item from the queue', () => {
      queue.pick();
      expect(queue.pick()).toEqual(2);
      expect(queue.hasItem()).toBeFalse();
    });
  });

  describe('#hasItem', () => {
    it('returns whether the queue has any items', () => {
      expect(queue.hasItem()).toBeFalse();
      queue.push(1);
      expect(queue.hasItem()).toBeTrue();
      queue.pick();
      expect(queue.hasItem()).toBeFalse();
    });
  });
});