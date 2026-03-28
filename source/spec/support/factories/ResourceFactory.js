import { Resource } from '../../../lib/models/Resource.js';
import { ResourceRequestFactory } from './ResourceRequestFactory.js';

/**
 * Factory for creating Resource instances in tests.
 */
class ResourceFactory {
  /**
   * Builds a Resource instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.name='categories'] - The resource name.
   * @param {Array} [params.resourceRequests] - List of ResourceRequest instances. Defaults to one default ResourceRequestFactory.build().
   * @returns {Resource} A new Resource instance.
   */
  static build({ name = 'categories', resourceRequests = [ResourceRequestFactory.build()] } = {}) {
    return new Resource({ name, resourceRequests });
  }
}

export { ResourceFactory };
