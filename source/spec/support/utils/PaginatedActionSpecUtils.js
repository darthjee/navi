import { ResourceActionUtils } from './ResourceActionUtils.js';

/**
 * Test utility holding the shared fixtures for the ResourceRequestPaginatedAction specs.
 */
class PaginatedActionSpecUtils {
  /**
   * Returns a fresh basic pagination config reading the page count from `parsedBody.total_pages`.
   * @returns {Array<object>} The pagination config.
   */
  static get pagination() {
    return [{ pages: 'parsedBody.total_pages', page_key: 'page' }];
  }

  /**
   * Returns a fresh response wrapper reporting 3 total pages.
   * @returns {{ parsedBody: object, headers: object, parameters: object }} The response wrapper.
   */
  static get responseWrapper() {
    return {
      parsedBody: { total_pages: 3 },
      headers: {},
      parameters: {},
    };
  }

  /**
   * Registers the given ResourceRequests under the `products` resource.
   * @param {...object} resourceRequests - The ResourceRequests to register.
   * @returns {*} The result of `ResourceActionUtils.registerResource`.
   */
  static registerProductsResource(...resourceRequests) {
    return ResourceActionUtils.registerResource('products', resourceRequests);
  }
}

export { PaginatedActionSpecUtils };
