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
}

export { Collection };
