/**
 * Iterates over a range of page numbers, honoring zero-indexing and an optional cap.
 * @author darthjee
 */
class PageRange {
  #count;
  #zeroIndexed;
  #maxPage;

  /**
   * @param {object} params Range parameters.
   * @param {number} params.count Total number of pages available.
   * @param {boolean} [params.zeroIndexed=false] Whether pages start at 0 instead of 1.
   * @param {number|null} [params.maxPage=null] Caps iteration to the first `maxPage` pages. `null` means unlimited.
   */
  constructor({ count, zeroIndexed = false, maxPage = null }) {
    this.#count = count;
    this.#zeroIndexed = zeroIndexed;
    this.#maxPage = maxPage;
  }

  /**
   * Invokes callback once per page number, in order, honoring zeroIndexed and maxPage.
   * @param {Function} callback Called with each page number.
   * @returns {void}
   */
  each(callback) {
    const start = this.#zeroIndexed ? 0 : 1;
    const total = this.#maxPage !== null ? Math.min(this.#count, this.#maxPage) : this.#count;

    for (let i = 0; i < total; i++) {
      callback(start + i);
    }
  }
}

export { PageRange };
