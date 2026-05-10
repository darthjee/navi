import { IndexHandlerExecutor } from './IndexHandlerExecutor.js';
import { RequestHandler } from '../../common/server/RequestHandler.js';

/**
 * Handles GET / and SPA catch-all requests by serving index.html.
 * @author darthjee
 */
class IndexRequestHandler extends RequestHandler {
  /**
   * Creates a new IndexRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Delegates to IndexHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new IndexHandlerExecutor(req, res).handle();
  }
}

export { IndexRequestHandler };
