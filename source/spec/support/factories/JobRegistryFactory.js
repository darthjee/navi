import { NamespaceMapFactory } from './NamespaceMapFactory.js';
import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';

/**
 * Factory for creating JobRegistry instances in tests.
 */
class JobRegistryFactory {
  /**
   * Builds a JobRegistry instance.
   * The factory is passed explicitly to bypass the global JobFactory registry,
   * keeping each test instance self-contained and free from global state.
   * @param {object} [params={}] - Optional attributes.
   * @param {NamespaceMap} [params.clients] - The namespace map. Defaults to NamespaceMapFactory.build().
   * @returns {JobRegistry} A new JobRegistry instance.
   */
  static build({ clients = NamespaceMapFactory.build() } = {}) {
    const factory = new JobFactory({ attributes: { clients } });
    return new JobRegistry({ factory });
  }
}

export { JobRegistryFactory };
