class IdentifyableCollection {
  #items;
  #size = null;

  /**
   * @param {object} items - Optional initial items, keyed by id.
   */
  constructor(items = {}) {
    this.#items = items;
  }

  /**
   * Adds an item to the collection.
   * @param {object} item - The item to add, must have a unique id.
   */
  push(item) {
    this.#size = null;
    this.#items[item.id] = item;
  }

  /**
   * Removes an item from the collection by id.
   * @param {string|number} id - The id of the item to remove.
   */
  remove(id) {
    this.#size = null;
    delete this.#items[id];
  }

  /**
   * Retrieves an item from the collection by id.
   * @param {string} id - The id of the item to retrieve.
   * @returns {object | undefined} - The item if found, otherwise undefined.
   */
  get(id) {
    return this.#items[id];
  }

  /**
   * Checks if the collection has an item with the specified id.
   * @param {string|number} id - The id of the item to check.
   * @returns {boolean} - True if the item exists, false otherwise.
   */
  has(id) {
    return this.#items[id] !== undefined;
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
    return Object.values(this.#items);
  }

  /**
   * Retrieves the number of items in the collection.
   * @returns {number} - The number of items in the collection.
   */
  size() {
    if (this.#size === null) {
      this.#size = this.list().length;
    }
    return this.#size;
  }

  /**
   * Checks if the collection has any items.
   * @returns {boolean} - True if the collection has any items, false otherwise.
   */
  hasAny() {
    return this.size() > 0;
  }
}

export { IdentifyableCollection };
