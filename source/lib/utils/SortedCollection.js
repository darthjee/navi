import { Collection } from './Collection.js';
import { SortedArrayMerger } from './SortedArrayMerger.js';
import { SortedArraySearcher } from './SortedArraySearcher.js';

/**
 * A collection that maintains elements in sorted order.
 *
 * New elements are buffered in a non-sorted list and merged into the sorted
 * list only when iteration is needed (deferred / lazy flush strategy).
 *
 * The merge strategy is:
 *   1. Sort `#nonSorted` using `sortBy` — O(m log m)
 *   2. Merge two sorted arrays via two-pointer algorithm — O(n + m)
 *
 * Range methods (`after`, `from`, `before`, `upTo`) use binary search to
 * find the cut-off index — O(log n) — avoiding a full scan.
 */
class SortedCollection extends Collection {
  #sorted = [];
  #nonSorted = [];
  #sortBy;

  /**
   * @param {Array} initialSet - Optional initial elements (default `[]`).
   * @param {object} options
   * @param {Function} options.sortBy - Function that extracts a comparable value from an element.
   * @throws {Error} If `sortBy` is not a function.
   */
  constructor(initialSet = [], { sortBy } = {}) {
    super();
    if (typeof sortBy !== 'function') throw new Error('sortBy must be a function');
    this.#sortBy = sortBy;
    this.#nonSorted = [...initialSet];
  }

  /**
   * Adds an element to the pending (non-sorted) list.
   * @param {*} item - The element to add.
   */
  push(item) {
    this.#nonSorted.push(item);
  }

  /**
   * Returns a copy of all elements in sorted order.
   * Triggers a flush of pending elements first.
   * @returns {Array} Sorted shallow copy.
   */
  list() {
    return [...this.#flushedSorted()];
  }

  /**
   * Returns the total number of elements (sorted + pending).
   * @returns {number}
   */
  size() {
    return this.#sorted.length + this.#nonSorted.length;
  }

  /**
   * Returns elements for which `fn(element)` is truthy.
   * Triggers a flush first.
   * @param {Function} fn - Predicate function.
   * @returns {Array}
   */
  select(fn) {
    return this.#flushedSorted().filter(fn);
  }

  /**
   * Returns elements whose sort field is strictly greater than `value`.
   * Uses binary search for O(log n) cut-off detection.
   * @param {*} value - The exclusive lower bound.
   * @returns {Array}
   */
  after(value) {
    const i = this.#binarySearch(value, 'after');
    return this.#sorted.slice(i);
  }

  /**
   * Returns elements whose sort field is greater than or equal to `value`.
   * Uses binary search for O(log n) cut-off detection.
   * @param {*} value - The inclusive lower bound.
   * @returns {Array}
   */
  from(value) {
    const i = this.#binarySearch(value, 'from');
    return this.#sorted.slice(i);
  }

  /**
   * Returns elements whose sort field is strictly less than `value`.
   * Uses binary search for O(log n) cut-off detection.
   * @param {*} value - The exclusive upper bound.
   * @returns {Array}
   */
  before(value) {
    const i = this.#binarySearch(value, 'before');
    return this.#sorted.slice(0, i);
  }

  /**
   * Returns elements whose sort field is less than or equal to `value`.
   * Uses binary search for O(log n) cut-off detection.
   * @param {*} value - The inclusive upper bound.
   * @returns {Array}
   */
  upTo(value) {
    const i = this.#binarySearch(value, 'upTo');
    return this.#sorted.slice(0, i);
  }

  #flushedSorted() {
    this.#flush();
    return this.#sorted;
  }

  #flush() {
    if (this.#nonSorted.length === 0) return;

    this.#sortNonSorted();
    this.#sorted = this.#merge();
    this.#nonSorted = [];
  }

  #sortNonSorted() {
    this.#nonSorted.sort((a, b) => {
      const va = this.#sortBy(a);
      const vb = this.#sortBy(b);
      return va < vb ? -1 : va > vb ? 1 : 0;
    });
  }

  #merge() {
    return SortedArrayMerger.merge(this.#sorted, this.#nonSorted, this.#sortBy);
  }

  #binarySearch(value, mode) {
    return SortedArraySearcher.search(this.#flushedSorted(), this.#sortBy, value, mode);
  }
}

export { SortedCollection };
