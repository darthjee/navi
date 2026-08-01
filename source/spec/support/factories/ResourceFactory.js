import { ResourceRequestFactory } from './ResourceRequestFactory.js';
import { Resource } from '../../../lib/models/request/Resource.js';

/**
 * Factory for creating Resource instances in tests.
 */
class ResourceFactory {
  /**
   * Builds a Resource instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.name='categories'] - The resource name.
   * @param {Array} [params.resourceRequests] - List of ResourceRequest instances. Defaults to one default ResourceRequestFactory.build().
   * @param {string} [params.namespace='default'] - The namespace this resource was declared in.
   * @returns {Resource} A new Resource instance.
   */
  static build({ name = 'categories', resourceRequests = [ResourceRequestFactory.build()], namespace = 'default' } = {}) {
    return new Resource({ name, resourceRequests, namespace });
  }
}

export { ResourceFactory };
