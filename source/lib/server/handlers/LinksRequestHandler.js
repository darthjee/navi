import { RequestHandler } from '../RequestHandler.js';

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
   * Responds with configured links.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    res.json({ links: this.#links.map((link) => link.toJSON()) });
  }
}

export { LinksRequestHandler };
