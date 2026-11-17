import { Collection } from './Collection.js';

/**
 * An identifiable collection that stores items keyed by their id property.
 * @author darthjee
 */
class IdentifyableCollection extends Collection {
  #items;
  #size = null;

  /**
   * @param {object|Map} items - Optional initial items, keyed by id (plain object or Map).
   */
  constructor(items = {}) {
    super();
    this.#items = items instanceof Map ? new Map(items) : new Map(Object.entries(items));
  }

  /**
   * Adds an item to the collection.
   * @param {object} item - The item to add, must have a unique id.
   * @returns {void}
   */
  push(item) {
    this.#size = null;
    this.#items.set(item.id, item);
  }

  /**
   * Removes an item from the collection by id.
   * @param {string|number} id - The id of the item to remove.
   * @returns {void}
   */
  remove(id) {
    this.#size = null;
    this.#items.delete(id);
  }

  /**
   * Removes the oldest `n` items (insertion order) from the collection.
   * @param {number} n - The maximum number of items to remove.
   * @returns {number} - The number of items actually removed.
   */
  removeOldest(n) {
    if (!(n > 0) || this.#items.size === 0) return 0;

    const ids = [];
    for (const id of this.#items.keys()) {
      if (ids.length >= n) break;
      ids.push(id);
    }

    ids.forEach((id) => this.#items.delete(id));
    this.#size = null;
    return ids.length;
  }

  /**
   * Retrieves an item from the collection by id.
   * @param {string} id - The id of the item to retrieve.
   * @returns {object | undefined} - The item if found, otherwise undefined.
   */
  get(id) {
    return this.#items.get(id);
  }

  /**
   * Checks if the collection has an item with the specified id.
   * @param {string|number} id - The id of the item to check.
   * @returns {boolean} - True if the item exists, false otherwise.
   */
  has(id) {
    return this.#items.has(id);
  }

  /**
   * Searches for an item with the given id.
   * @param {string} id - The id to search for.
   * @returns {object|null} The matching item, or null if not found.
   */
  findById(id) {
    return this.get(id) ?? null;
  }

  /**
   * Retrieves an item from the collection by index.
   * @param {number} index - The index of the item to retrieve.
   * @returns {object | undefined} - The item if found, otherwise undefined.
   */
  byIndex(index) {
    return this.list()[index];
  }

  /**
   * Retrieves all items in the collection.
   * @returns {object[]} - An array of all items in the collection.
   */
  list() {
    return [...this.#items.values()];
  }

  /**
   * Retrieves the number of items in the collection.
   * @returns {number} - The number of items in the collection.
   */
  size() {
    if (this.#size === null) {
      this.#size = this.#items.size;
    }
    return this.#size;
  }
}

export { IdentifyableCollection };
