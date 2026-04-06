/**
 * Merges two already-sorted arrays into a single sorted array using
 * a two-pointer algorithm — O(n + m).
 *
 * The relative order of elements with equal sort values preserves the
 * order of the first array before the second.
 */
class SortedArrayMerger {
  #first;
  #second;
  #sortBy;

  /**
   * @param {Array} first - The first sorted array.
   * @param {Array} second - The second sorted array.
   * @param {Function} sortBy - Function that extracts a comparable value from an element.
   */
  constructor(first, second, sortBy) {
    this.#first = first;
    this.#second = second;
    this.#sortBy = sortBy;
  }

  /**
   * Returns a new sorted array containing all elements from both arrays.
   * @returns {Array}
   */
  merge() {
    const result = [];
    let i = 0, j = 0;
    const first = this.#first;
    const second = this.#second;

    while (i < first.length && j < second.length) {
      if (this.#sortBy(first[i]) <= this.#sortBy(second[j])) {
        result.push(first[i++]);
      } else {
        result.push(second[j++]);
      }
    }

    return result.concat(first.slice(i), second.slice(j));
  }
}

export { SortedArrayMerger };
