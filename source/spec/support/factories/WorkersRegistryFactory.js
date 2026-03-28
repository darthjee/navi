import { JobRegistryFactory } from './JobRegistryFactory.js';
import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';

/**
 * Factory for creating WorkersRegistry instances in tests.
 */
class WorkersRegistryFactory {
  /**
   * Builds a WorkersRegistry instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {JobRegistry} [params.jobRegistry] - The job registry. Defaults to JobRegistryFactory.build().
   * @param {number} [params.quantity=1] - Number of workers.
   * @returns {WorkersRegistry} A new WorkersRegistry instance.
   */
  static build({ jobRegistry = JobRegistryFactory.build(), quantity = 1 } = {}) {
    return new WorkersRegistry({ jobRegistry, quantity });
  }
}

export { WorkersRegistryFactory };
