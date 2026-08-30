import { ResourceRequestEmit } from '../../../lib/models/request/ResourceRequestEmit.js';

/**
 * Factory for creating ResourceRequestEmit instances in tests.
 */
class ResourceRequestEmitFactory {
  /**
   * Builds a ResourceRequestEmit instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string|{name: string, namespace: string}} [params.client] - The client reference to use for this emit.
   * @param {string} [params.method='POST'] - The HTTP method used for the emit request.
   * @param {string} [params.url='/emit'] - The URL to emit the request to.
   * @param {number} [params.status] - The expected status code of the emit response.
   * @param {number} [params.retries] - Optional per-resource retries override.
   * @param {number} [params.cooldown] - Optional per-resource cooldown override.
   * @param {object} [params.headers] - Optional map of extra HTTP headers for this emit.
   * @returns {ResourceRequestEmit} A new ResourceRequestEmit instance.
   */
  static build({
    client = undefined,
    method = 'POST',
    url = '/emit',
    status = undefined,
    retries = undefined,
    cooldown = undefined,
    headers = undefined,
  } = {}) {
    return new ResourceRequestEmit({ client, method, url, status, retries, cooldown, headers });
  }
}

export { ResourceRequestEmitFactory };
