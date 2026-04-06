import { ResourceRequestFactory } from './ResourceRequestFactory.js';
import { Resource } from '../../../lib/models/Resource.js';

/**
 * Factory for creating Resource instances in tests.
 */
class ResourceFactory {
  /**
   * Builds a Resource instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.name='categories'] - The resource name.
   * @param {string} [params.client] - The name of the client to use for requests.
   * @param {Array} [params.resourceRequests] - List of ResourceRequest instances. Defaults to one default ResourceRequestFactory.build().
   * @returns {Resource} A new Resource instance.
   */
  static build({ name = 'categories', client = undefined, resourceRequests = [ResourceRequestFactory.build()] } = {}) {
    return new Resource({ name, client, resourceRequests });
  }
}

export { ResourceFactory };
