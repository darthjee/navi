/**
 * Abstract base class for collection types.
 *
 * Provides shared interface methods (`hasAny`) that delegate
 * to `size()`, which concrete subclasses must implement.
 */
class Collection {
  /**
   * Checks if the collection has any items.
   * @returns {boolean} True if the collection has any items, false otherwise.
   */
  hasAny() {
    return this.size() > 0;
  }

  /**
   * Searches for an item with the given id.
   * @param {string} id - The id to search for.
   * @returns {object|null} The matching item, or null if not found.
   */
  findById(id) {
    return this.list().find(item => item.id === id) ?? null;
  }
}

export { Collection };
