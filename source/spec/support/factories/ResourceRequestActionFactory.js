import { ResourceRequestAction } from '../../../lib/models/ResourceRequestAction.js';

/**
 * Factory for creating ResourceRequestAction instances in tests.
 */
class ResourceRequestActionFactory {
  /**
   * Builds a ResourceRequestAction instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.resource='products'] - The resource name.
   * @param {object} [params.variables_map={}] - The variables map.
   * @returns {ResourceRequestAction} A new ResourceRequestAction instance.
   */
  static build({ resource = 'products', variables_map = {} } = {}) {
    return new ResourceRequestAction({ resource, variables_map });
  }
}

export { ResourceRequestActionFactory };
