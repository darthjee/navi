/**
 * A simple queue implementation for managing items in a first-in-first-out (FIFO) manner.
 *
 * The Queue class provides methods to add items to the queue, retrieve items from the queue, and check if the queue has any items.
 * It uses an array to store the items and provides a simple interface for managing the queue.
 */
class Queue {
  /**
   * Creates an instance of Queue.
    *
    * This constructor initializes an empty array to store the items in the queue.
   */
  constructor() {
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
   * Checks if the queue has any items.
   * @returns {boolean} True if the queue has items, false otherwise.
   */
  hasItem() {
    return this.items.length > 0;
  }
}

export { Queue };