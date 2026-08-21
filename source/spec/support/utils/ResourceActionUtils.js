import { JobRegistry } from 'deku-swarm';
import { LoggerUtils } from './LoggerUtils.js';
import { Namespace } from '../../../lib/registry/Namespace.js';
import { NamespaceMap } from '../../../lib/registry/NamespaceMap.js';
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
      NamespaceMap.reset();
    });
  }

  /**
   * Builds a NamespaceMap singleton containing a single namespace with the given resource registered.
   * @param {string} name - Resource name.
   * @param {Array} resourceRequests - Resource requests to register.
   * @param {object} [options={}] - Additional options.
   * @param {string} [options.namespace='default'] - The namespace to register the resource under.
   * @returns {object} Registered resource.
   */
  static registerResource(name, resourceRequests, { namespace = 'default' } = {}) {
    const resource = ResourceFactory.build({ name, resourceRequests, namespace });

    NamespaceMap.build({
      [namespace]: new Namespace({ name: namespace, resources: { [name]: resource } }),
    });

    return resource;
  }
}

export { ResourceActionUtils };
