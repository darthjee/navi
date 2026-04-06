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
   * Merges two sorted arrays into a single sorted array.
   * @param {Array} first - The first sorted array.
   * @param {Array} second - The second sorted array.
   * @param {Function} sortBy - Function that extracts a comparable value from an element.
   * @returns {Array}
   */
  static merge(first, second, sortBy) {
    return new SortedArrayMerger(first, second, sortBy).merge();
  }

  /**
   * Returns a new sorted array containing all elements from both arrays.
   * @returns {Array}
   */
  merge() {
    const result = [];
    let i = 0, j = 0;

    while (i < this.#first.length && j < this.#second.length) {
      if (this.#firstComesFirst(i, j)) {
        result.push(this.#first[i++]);
      } else {
        result.push(this.#second[j++]);
      }
    }

    return result.concat(this.#first.slice(i), this.#second.slice(j));
  }

  #firstComesFirst(i, j) {
    return this.#sortBy(this.#first[i]) <= this.#sortBy(this.#second[j]);
  }
}

export { SortedArrayMerger };
