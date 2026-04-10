import { WorkersRegistry } from '../../../lib/registry/WorkersRegistry.js';

/**
 * Factory for creating WorkersRegistry instances in tests.
 */
class WorkersRegistryFactory {
  /**
   * Builds a WorkersRegistry singleton instance.
   * @param {object} [params={}] - Optional attributes.
   * @param {number} [params.quantity=1] - Number of workers.
   * @returns {WorkersRegistryInstance} The singleton instance.
   */
  static build({ quantity = 1 } = {}) {
    return WorkersRegistry.build({ quantity });
  }
}

export { WorkersRegistryFactory };
