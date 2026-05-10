import { JobHandlerExecutor } from './JobHandlerExecutor.js';
import { RequestHandler } from '../../../common/server/RequestHandler.js';

/**
 * Handles GET /job/:id.json requests.
 * @author darthjee
 */
class JobRequestHandler extends RequestHandler {
  /**
   * Creates a new JobRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to JobHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new JobHandlerExecutor(req, res).handle();
  }
}

export { JobRequestHandler };
