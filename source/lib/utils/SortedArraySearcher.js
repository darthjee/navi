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
    let lo = 0, hi = this.#array.length;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const item = this.#array[mid];

      if (this.#mode === 'after' || this.#mode === 'upTo') {
        if (this.#sortBy(item) <= this.#value) lo = mid + 1;
        else hi = mid;
      } else { // 'from' or 'before'
        if (this.#sortBy(item) < this.#value) lo = mid + 1;
        else hi = mid;
      }
    }

    return lo;
  }
}

export { SortedArraySearcher };
