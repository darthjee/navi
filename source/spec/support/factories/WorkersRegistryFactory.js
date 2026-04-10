import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';

/**
 * Factory for creating WorkersRegistry instances in tests.
 */
class WorkersRegistryFactory {
  /**
   * Builds a WorkersRegistry instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {number} [params.quantity=1] - Number of workers.
   * @returns {WorkersRegistry} A new WorkersRegistry instance.
   */
  static build({ quantity = 1 } = {}) {
    return new WorkersRegistry({ quantity });
  }
}

export { WorkersRegistryFactory };
