/**
 * Performs binary search on a sorted array to find boundary indices
 * for range queries — O(log n).
 *
 * Supports four modes that correspond to the four range methods of
 * `SortedCollection`:
 *
 * | Mode     | Finds first index where… |
 * |----------|--------------------------|
 * | `after`  | `sortBy(el) > value`     |
 * | `from`   | `sortBy(el) >= value`    |
 * | `before` | `sortBy(el) >= value`    |
 * | `upTo`   | `sortBy(el) > value`     |
 *
 * `after` and `upTo` share the same condition; `from` and `before` share
 * the other. The caller decides which side of the boundary to slice.
 */
class SortedArraySearcher {
  #array;
  #sortBy;
  #value;
  #mode;
  #lo = 0;
  #hi;
  #mid;

  /**
   * @param {Array} array - The sorted array to search.
   * @param {Function} sortBy - Function that extracts a comparable value from an element.
   * @param {*} value - The boundary value to search for.
   * @param {'after'|'from'|'before'|'upTo'} mode - The range mode.
   */
  constructor(array, sortBy, value, mode) {
    this.#array = array;
    this.#sortBy = sortBy;
    this.#value = value;
    this.#mode = mode;
  }

  /**
   * Returns the boundary index for slicing based on the range mode.
   * @param {Array} array - The sorted array to search.
   * @param {Function} sortBy - Function that extracts a comparable value from an element.
   * @param {*} value - The boundary value to search for.
   * @param {'after'|'from'|'before'|'upTo'} mode - The range mode.
   * @returns {number} The boundary index.
   */
  static search(array, sortBy, value, mode) {
    return new SortedArraySearcher(array, sortBy, value, mode).search();
  }

  /**
   * Returns the boundary index for slicing based on the range mode.
   * @returns {number} The boundary index.
   */
  search() {
    this.#lo = 0;
    this.#hi = this.#array.length;

    while (this.#lo < this.#hi) {
      this.#mid = (this.#lo + this.#hi) >> 1;
      this.#step();
    }

    return this.#lo;
  }

  /**
   * Performs one binary search step, narrowing the search range.
   * @returns {void}
   */
  #step() {
    if (this.#shouldAdvanceLo()) {
      this.#lo = this.#mid + 1;
    } else {
      this.#hi = this.#mid;
    }
  }

  /**
   * Determines whether the lower bound should advance past the midpoint.
   * @returns {boolean} True if the lower bound should be moved forward.
   */
  #shouldAdvanceLo() {
    const item = this.#array[this.#mid];
    const sortedValue = this.#sortBy(item);
    if (sortedValue < this.#value) return true;
    if (sortedValue > this.#value) return false;
    return this.#isExclusiveMode();
  }

  /**
   * Checks whether the current mode is exclusive ('after' or 'upTo').
   * @returns {boolean} True if the mode is exclusive.
   */
  #isExclusiveMode() {
    return this.#mode === 'after' || this.#mode === 'upTo';
  }
}

export { SortedArraySearcher };
