import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../registry/JobRegistry.js';

/**
 * Handles GET /stats.json requests.
 * @author darthjee
 */
class StatsRequestHandler extends RequestHandler {
  #workersRegistry;

  /**
   * @param {object} params - Options for initializing the StatsRequestHandler.
   * @param {object} params.workersRegistry - The workers registry instance.
   */
  constructor({ workersRegistry }) {
    super();
    this.#workersRegistry = workersRegistry;
  }

  /**
   * Responds with combined job and worker stats.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   */
  handle(_req, res) {
    res.json({
      jobs:    JobRegistry.stats(),
      workers: this.#workersRegistry.stats(),
    });
  }
}

export { StatsRequestHandler };
