import { ResourceRequestAction } from '../../../lib/models/request/ResourceRequestAction.js';

/**
 * Factory for creating ResourceRequestAction instances in tests.
 */
class ResourceRequestActionFactory {
  /**
   * Builds a ResourceRequestAction instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.resource='products'] - The resource name.
   * @param {string|null} [params.namespace] - Explicit target namespace for the resource lookup.
   * @param {string} [params.originNamespace='default'] - The namespace of the resource that owns this action.
   * @param {object} [params.parameters={}] - The parameters map.
   * @returns {ResourceRequestAction} A new ResourceRequestAction instance.
   */
  static build({ resource = 'products', namespace = null, originNamespace = 'default', parameters = {} } = {}) {
    return new ResourceRequestAction({ resource, namespace, originNamespace, parameters });
  }
}

export { ResourceRequestActionFactory };
