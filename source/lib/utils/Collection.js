/**
 * Abstract base class for collection types.
 *
 * Provides shared interface methods (`hasAny`, `hasItem`) that delegate
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
   * Checks if the collection has any items.
   * Alias for `hasAny()` for backward compatibility.
   * @returns {boolean} True if the collection has any items, false otherwise.
   */
  hasItem() {
    return this.size() > 0;
  }
}

export { Collection };
