import { JobsHandlerExecutor } from './JobsHandlerExecutor.js';
import { RequestHandler } from '../../../common/server/RequestHandler.js';

/**
 * Handles GET /jobs/:status.json requests.
 * @author darthjee
 */
class JobsRequestHandler extends RequestHandler {
  /**
   * Creates a new JobsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to JobsHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new JobsHandlerExecutor(req, res).handle();
  }
}

export { JobsRequestHandler };
