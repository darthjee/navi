import IndexHandlerExecutor from './IndexHandlerExecutor.js';
import { RequestHandler } from '../common/server/RequestHandler.js';

/**
 * Handles GET / and SPA catch-all requests by serving index.html.
 */
class IndexRequestHandler extends RequestHandler {
  /**
   * Delegates to IndexHandlerExecutor.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @returns {void}
   */
  handle(req, res) {
    new IndexHandlerExecutor(req, res).handle();
  }
}

export default IndexRequestHandler;
