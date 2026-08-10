import { PathResolver } from '../response/PathResolver.js';

/**
 * Parses the pagination block from YAML and resolves the total page count
 * against a response wrapper.
 * @author darthjee
 */
class PaginationConfig {
  #pagesResolver;
  #pageKey;
  #zeroIndexed;

  /**
   * @param {object} params Pagination configuration attributes.
   * @param {string} params.pages Path expression to resolve the total page count.
   * @param {string} params.page_key The parameter name to inject the page number.
   * @param {boolean} [params.zero_indexed=false] Whether pages are zero-indexed.
   */
  constructor({ pages, page_key, zero_indexed = false }) {
    this.#pagesResolver = PathResolver.fromExpression(pages);
    this.#pageKey = page_key;
    this.#zeroIndexed = zero_indexed;
  }

  /**
   * @returns {string} The parameter name used to inject the page number.
   */
  get pageKey() {
    return this.#pageKey;
  }

  /**
   * @returns {boolean} Whether pages are zero-indexed.
   */
  get zeroIndexed() {
    return this.#zeroIndexed;
  }

  /**
   * Evaluates the `pages` expression against the response wrapper.
   * @param {ResponseWrapper} responseWrapper The response wrapper to resolve against.
   * @returns {number} Total number of pages.
   */
  resolvePages(responseWrapper) {
    return this.#pagesResolver.resolve(responseWrapper);
  }

  /**
   * Creates a PaginationConfig from a raw YAML list entry.
   * @param {Array<object>} list List of single-key maps from YAML.
   * @returns {PaginationConfig} A new PaginationConfig instance.
   */
  static fromList(list) {
    const attrs = Object.assign({}, ...list);
    return new PaginationConfig(attrs);
  }
}

export { PaginationConfig };
