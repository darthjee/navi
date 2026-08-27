import { JobFactory, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
import { Application } from '../../../lib/services/application/Application.js';
import { EngineEvents } from '../../../lib/services/engine/EngineEvents.js';
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
    JobRegistry.reset();
    JobFactory.reset();
    LogRegistry.reset();
    WorkersRegistry.reset();
    NamespaceMap.reset();
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
