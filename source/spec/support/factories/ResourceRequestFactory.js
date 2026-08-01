import { ResourceRequest } from '../../../lib/models/request/ResourceRequest.js';

/**
 * Factory for creating ResourceRequest instances in tests.
 */
class ResourceRequestFactory {
  /**
   * Builds a ResourceRequest instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.url='/categories.json'] - The URL template.
   * @param {number} [params.status=200] - The expected HTTP status code.
   * @param {string|{name: string, namespace: string}} [params.clientName] - The client reference to use for this request.
   * @param {Array} [params.actions] - List of raw action config objects.
   * @param {string} [params.namespace='default'] - The namespace of the owning Resource.
   * @param {boolean} [params.enabled] - Whether the request is enabled.
   * @param {boolean} [params.disabled] - Whether the request is disabled.
   * @returns {ResourceRequest} A new ResourceRequest instance.
   */
  static build({
    url = '/categories.json',
    status = 200,
    clientName = undefined,
    actions = [],
    namespace = 'default',
    enabled = undefined,
    disabled = undefined,
  } = {}) {
    return new ResourceRequest({ url, status, clientName, actions, namespace, enabled, disabled });
  }
}

export { ResourceRequestFactory };
