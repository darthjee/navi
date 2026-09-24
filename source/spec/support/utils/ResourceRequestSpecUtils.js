import { JobRegistry } from 'deku-swarm';
import { ResponseWrapper } from '../../../lib/models/response/ResponseWrapper.js';
import { LoggerUtils } from './LoggerUtils.js';
import { RegistryCleanupUtils } from './RegistryCleanupUtils.js';

/**
 * Test utility shared by the ResourceRequest spec files.
 */
class ResourceRequestSpecUtils {
  /**
   * Builds a ResponseWrapper around the given raw body with empty headers.
   * @param {string} data Raw response body.
   * @returns {ResponseWrapper} The wrapped response.
   */
  static buildResponseWrapper(data) {
    return new ResponseWrapper({ data, headers: {} });
  }

  /**
   * Installs a beforeEach that stubs logger methods, builds the JobRegistry and
   * stubs JobRegistry.enqueue, and an afterEach that resets the JobRegistry.
   * @returns {void}
   */
  static setupJobRegistrySpy() {
    beforeEach(() => {
      LoggerUtils.stubLoggerMethods();
      JobRegistry.build({ cooldown: -1 });
      spyOn(JobRegistry, 'enqueue').and.stub();
    });

    afterEach(() => {
      RegistryCleanupUtils.resetJobRegistry();
    });
  }
}

export { ResourceRequestSpecUtils };
