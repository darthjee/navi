import { ClientRegistryFactory } from './ClientRegistryFactory.js';
import { JobRegistry } from '../../../lib/registry/JobRegistry.js';

/**
 * Factory for creating JobRegistry instances in tests.
 */
class JobRegistryFactory {
  /**
   * Builds a JobRegistry instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {ClientRegistry} [params.clients] - The client registry. Defaults to ClientRegistryFactory.build().
   * @returns {JobRegistry} A new JobRegistry instance.
   */
  static build({ clients = ClientRegistryFactory.build() } = {}) {
    return new JobRegistry({ clients });
  }
}

export { JobRegistryFactory };
