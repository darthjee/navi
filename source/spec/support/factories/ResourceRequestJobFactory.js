import { ClientRegistryFactory } from './ClientRegistryFactory.js';
import { ResourceRequestFactory } from './ResourceRequestFactory.js';
import { ResourceRequestJob } from '../../../lib/jobs/ResourceRequestJob.js';

/**
 * Factory for creating ResourceRequestJob instances in tests.
 */
class ResourceRequestJobFactory {
  /**
   * Builds a ResourceRequestJob instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {string} [params.id='id'] - The job ID.
   * @param {ResourceRequest} [params.resourceRequest] - The resource request. Defaults to ResourceRequestFactory.build().
   * @param {ClientRegistry} [params.clients] - The client registry. Defaults to ClientRegistryFactory.build().
   * @param {object} [params.parameters={}] - The job parameters.
   * @returns {ResourceRequestJob} A new ResourceRequestJob instance.
   */
  static build({
    id = 'id',
    resourceRequest = ResourceRequestFactory.build(),
    clients = ClientRegistryFactory.build(),
    parameters = {},
  } = {}) {
    return new ResourceRequestJob({ id, resourceRequest, clients, parameters });
  }
}

export { ResourceRequestJobFactory };
