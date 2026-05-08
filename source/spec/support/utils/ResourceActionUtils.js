import { LoggerUtils } from './LoggerUtils.js';
import { JobRegistry } from '../../../lib/background/JobRegistry.js';
import { ResourceRegistry } from '../../../lib/registry/ResourceRegistry.js';
import { ResourceFactory } from '../factories/ResourceFactory.js';

/**
 * Test utility for specs covering action-driven ResourceRequest enqueueing.
 */
class ResourceActionUtils {
  /**
   * Installs the shared logger and JobRegistry setup used by action specs.
   * @returns {void}
   */
  static setup() {
    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      JobRegistry.reset();
      ResourceRegistry.reset();
    });
  }

  /**
   * Builds a ResourceRegistry entry for the given resource name.
   * @param {string} name - Resource name.
   * @param {Array} resourceRequests - Resource requests to register.
   * @returns {object} Registered resource.
   */
  static registerResource(name, resourceRequests) {
    const resource = ResourceFactory.build({ name, resourceRequests });

    ResourceRegistry.build({ [name]: resource });

    return resource;
  }
}

export { ResourceActionUtils };
