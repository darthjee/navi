import { ResourceRequestAction } from '../../../lib/models/ResourceRequestAction.js';

/**
 * Factory for creating ResourceRequestAction instances in tests.
 */
class ResourceRequestActionFactory {
  /**
   * Builds a ResourceRequestAction instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.resource='products'] - The resource name.
   * @param {object} [params.parameters={}] - The parameters map.
   * @returns {ResourceRequestAction} A new ResourceRequestAction instance.
   */
  static build({ resource = 'products', parameters = {} } = {}) {
    return new ResourceRequestAction({ resource, parameters });
  }
}

export { ResourceRequestActionFactory };
