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
   * @param {string} [params.clientName] - The name of the client to use for this request.
   * @returns {ResourceRequest} A new ResourceRequest instance.
   */
  static build({ url = '/categories.json', status = 200, clientName = undefined } = {}) {
    return new ResourceRequest({ url, status, clientName });
  }
}

export { ResourceRequestFactory };
