import { AssetRequest } from '../../../lib/models/AssetRequest.js';

/**
 * Factory for creating AssetRequest instances in tests.
 */
class AssetRequestFactory {
  /**
   * Builds an AssetRequest instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.selector] - The CSS selector. Defaults to 'link[rel="stylesheet"]'.
   * @param {string} [params.attribute] - The attribute name. Defaults to 'href'.
   * @param {string} [params.client] - Optional client name.
   * @param {number} [params.status=200] - Expected HTTP status.
   * @returns {AssetRequest} A new AssetRequest instance.
   */
  static build({ selector = 'link[rel="stylesheet"]', attribute = 'href', client = undefined, status = 200 } = {}) {
    return new AssetRequest({ selector, attribute, client, status });
  }
}

export { AssetRequestFactory };
