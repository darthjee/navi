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
  #result = [];
  #i = 0;
  #j = 0;

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
   * @returns {Array} A new sorted array containing all elements from both arrays.
   */
  static merge(first, second, sortBy) {
    return new SortedArrayMerger(first, second, sortBy).merge();
  }

  /**
   * Returns a new sorted array containing all elements from both arrays.
   * @returns {Array} The merged sorted array.
   */
  merge() {
    this.#result = [];
    this.#i = 0;
    this.#j = 0;

    while (this.#bothHaveMore()) {
      this.#pickNext();
    }

    return this.#result.concat(this.#first.slice(this.#i), this.#second.slice(this.#j));
  }

  /**
   * Picks the next element from the first or second array based on sort order.
   * @returns {void}
   */
  #pickNext() {
    if (this.#firstComesFirst()) {
      this.#result.push(this.#first[this.#i++]);
    } else {
      this.#result.push(this.#second[this.#j++]);
    }
  }

  /**
   * Checks whether both arrays still have unprocessed elements.
   * @returns {boolean} True if both pointers are within bounds.
   */
  #bothHaveMore() {
    return this.#i < this.#first.length && this.#j < this.#second.length;
  }

  /**
   * Determines whether the current element of the first array should come before
   * the current element of the second array.
   * @returns {boolean} True if the first element comes first.
   */
  #firstComesFirst() {
    return this.#sortBy(this.#first[this.#i]) <= this.#sortBy(this.#second[this.#j]);
  }
}

export { SortedArrayMerger };
