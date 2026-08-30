import { JobRegistry, WorkersRegistry } from 'deku-swarm';
import { RequestHandler } from '../../common/server/RequestHandler.js';
import { EmissionRegistry } from '../../registry/EmissionRegistry.js';

/**
 * Executes request-handling behaviour for GET /stats.json.
 * @author darthjee
 */
class StatsHandler extends RequestHandler {
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
   * Responds with combined job, worker and emission stats.
   * @returns {void}
   */
  handle() {
    this.#response.json({
      jobs:      JobRegistry.stats(),
      workers:   WorkersRegistry.stats(),
      emissions: EmissionRegistry.counts,
    });
  }
}

export { StatsHandler };
