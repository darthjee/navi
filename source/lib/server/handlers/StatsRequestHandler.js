import { RequestHandler } from '../../common/server/RequestHandler.js';
import { StatsHandlerExecutor } from './StatsHandlerExecutor.js';

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
   * Delegates to StatsHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new StatsHandlerExecutor(req, res).handle();
  }
}

export { StatsRequestHandler };
