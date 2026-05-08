import { JobFactory } from '../../../lib/background/JobFactory.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { WorkersRegistry } from '../../../lib/background/WorkersRegistry.js';
import { ClientRegistry } from '../../../lib/registry/ClientRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { Application } from '../../../lib/services/Application.js';
import { EngineEvents } from '../../../lib/services/EngineEvents.js';
import { Logger } from '../../../lib/utils/logging/Logger.js';

/**
 * Test utility for resetting shared registries between specs.
 */
class RegistryCleanupUtils {
  /**
   * Resets the registries used by Application specs.
   * @returns {void}
   */
  static resetApplicationState() {
    Logger.reset();
    ClientRegistry.reset();
    JobRegistry.reset();
    JobFactory.reset();
    LogRegistry.reset();
    WorkersRegistry.reset();
    ResourceRegistry.reset();
    Application.reset();
    EngineEvents.reset();
  }

  /**
   * Resets the registries used by engine execution specs.
   * @returns {void}
   */
  static resetEngineState() {
    JobRegistry.reset();
    JobFactory.reset();
    WorkersRegistry.reset();
  }

  /**
   * Resets the JobRegistry only.
   * @returns {void}
   */
  static resetJobRegistry() {
    JobRegistry.reset();
  }
}

export { RegistryCleanupUtils };
