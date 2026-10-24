import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';

/**
 * Test utility for resetting shared registries between specs.
 */
class RegistryCleanupUtils {
  /**
   * Resets the registries used by engine execution specs.
   * @returns {void}
   */
  static resetEngineState() {
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
  }
}

export { RegistryCleanupUtils };
