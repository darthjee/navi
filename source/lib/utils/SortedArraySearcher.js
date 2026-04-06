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

  /**
   * @param {Array} array - The sorted array to search.
   * @param {Function} sortBy - Function that extracts a comparable value from an element.
   */
  constructor(array, sortBy) {
    this.#array = array;
    this.#sortBy = sortBy;
  }

  /**
   * Returns the boundary index for slicing based on the range mode.
   * @param {*} value - The boundary value to search for.
   * @param {'after'|'from'|'before'|'upTo'} mode - The range mode.
   * @returns {number} The boundary index.
   */
  search(value, mode) {
    let lo = 0, hi = this.#array.length;

    while (lo < hi) {
      const mid = (lo + hi) >> 1;
      const item = this.#sortBy(this.#array[mid]);

      if (mode === 'after' || mode === 'upTo') {
        if (item <= value) lo = mid + 1;
        else hi = mid;
      } else { // 'from' or 'before'
        if (item < value) lo = mid + 1;
        else hi = mid;
      }
    }

    return lo;
  }
}

export { SortedArraySearcher };
