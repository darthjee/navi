import { ResourceRequest } from '../../../lib/models/ResourceRequest.js';

/**
 * Factory for creating ResourceRequest instances in tests.
 */
class ResourceRequestFactory {
  /**
   * Builds a ResourceRequest instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.url='/categories.json'] - The URL template.
   * @param {number} [params.status=200] - The expected HTTP status code.
   * @returns {ResourceRequest} A new ResourceRequest instance.
   */
  static build({ url = '/categories.json', status = 200 } = {}) {
    return new ResourceRequest({ url, status });
  }
}

export { ResourceRequestFactory };
