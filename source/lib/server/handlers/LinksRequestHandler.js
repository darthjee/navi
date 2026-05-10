import { RequestHandler } from '../../common/server/RequestHandler.js';
import { LinksHandlerExecutor } from './LinksHandlerExecutor.js';

/**
 * Handles GET /links.json requests.
 * Responds with the configured web links.
 * @author darthjee
 */
class LinksRequestHandler extends RequestHandler {
  #links;

  /**
   * Creates a new LinksRequestHandler instance.
   * @param {object} [params={}] - Constructor params.
   * @param {Array<object>} [params.links=[]] - Links from web configuration.
   */
  constructor({ links = [] } = {}) {
    super();
    this.#links = links;
  }

  /**
   * Delegates to LinksHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new LinksHandlerExecutor(req, res, this.#links).handle();
  }
}

export { LinksRequestHandler };
