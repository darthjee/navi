import { JobFactory, JobRegistry, WorkersRegistry } from 'deku-swarm';
import { EmissionRegistry } from '../../../lib/registry/EmissionRegistry.js';
import { ExtractionRegistry } from '../../../lib/registry/ExtractionRegistry.js';
import { LogRegistry } from '../../../lib/registry/LogRegistry.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
import { Application } from '../../../lib/services/application/Application.js';
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
    EmissionRegistry.reset();
    ExtractionRegistry.reset();
    WorkersRegistry.reset();
    NamespaceMap.reset();
    Application.reset();
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
