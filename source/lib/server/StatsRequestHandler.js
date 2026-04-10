import { RequestHandler } from './RequestHandler.js';
import { JobRegistry } from '../registry/JobRegistry.js';
import { WorkersRegistry } from '../registry/WorkersRegistry.js';

/**
 * Handles GET /stats.json requests.
 * @author darthjee
 */
class StatsRequestHandler extends RequestHandler {
  /**
   * Creates a new StatsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds with combined job and worker stats.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   */
  handle(_req, res) {
    res.json({
      jobs:    JobRegistry.stats(),
      workers: WorkersRegistry.stats(),
    });
  }
}

export { StatsRequestHandler };
