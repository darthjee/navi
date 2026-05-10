import { JobRegistry } from '../../background/JobRegistry.js';
import { WorkersRegistry } from '../../background/WorkersRegistry.js';
import { RequestHandlerExecutor } from '../../common/server/RequestHandlerExecutor.js';

/**
 * Executes request-handling behaviour for GET /stats.json.
 * @author darthjee
 */
class StatsHandlerExecutor extends RequestHandlerExecutor {
  #response;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Responds with combined job and worker stats.
   * @returns {void}
   */
  handle() {
    this.#response.json({
      jobs:    JobRegistry.stats(),
      workers: WorkersRegistry.stats(),
    });
  }
}

export { StatsHandlerExecutor };
