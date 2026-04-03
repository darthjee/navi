import { RequestHandler } from './RequestHandler.js';

/**
 * Handles GET /stats.json requests.
 * @author darthjee
 */
class StatsRequestHandler extends RequestHandler {
  #jobRegistry;
  #workersRegistry;

  /**
   * @param {object} params
   * @param {object} params.jobRegistry - The job registry instance.
   * @param {object} params.workersRegistry - The workers registry instance.
   */
  constructor({ jobRegistry, workersRegistry }) {
    super();
    this.#jobRegistry = jobRegistry;
    this.#workersRegistry = workersRegistry;
  }

  /**
   * Responds with combined job and worker stats.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   */
  handle(_req, res) {
    res.json({
      jobs:    this.#jobRegistry.stats(),
      workers: this.#workersRegistry.stats(),
    });
  }
}

export { StatsRequestHandler };
