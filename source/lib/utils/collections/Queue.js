import { Collection } from './Collection.js';

/**
 * A simple queue implementation for managing items in a first-in-first-out (FIFO) manner.
 *
 * The Queue class provides methods to add items to the queue, retrieve items from the queue, and check if the queue has any items.
 * It uses an array to store the items and provides a simple interface for managing the queue.
 */
class Queue extends Collection {
  /**
   * Creates an instance of Queue.
   *
   * This constructor initializes an empty array to store the items in the queue.
   */
  constructor() {
    super();
    this.items = [];
  }

  /**
   * Adds an item to the end of the queue.
   * @param {*} item - The item to be added to the queue.
   */
  push(item) {
    this.items.push(item);
  }

  /**
   * Removes and returns the item at the front of the queue.
   * @returns {*} The item at the front of the queue.
   */
  pick() {
    return this.items.shift();
  }

  /**
   *  Returns the number of items currently in the queue.
   * @returns {number} The number of items currently in the queue.
   */
  size() {
    return this.items.length;
  }

  /**
   * Returns a shallow copy of all items in the queue, preserving FIFO order.
   * @returns {Array} A copy of all items.
   */
  list() {
    return [...this.items];
  }
}

export { Queue };
