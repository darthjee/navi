import { ClientRegistry } from '../../registry/ClientRegistry.js';
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
    const links = this.#links.map((link) => link.toJSON());
    const clientsLinks = ClientRegistry.all().map((client) => ({
      url: client.baseUrl,
      text: client.linkText ?? client.name,
    }));

    res.json({ links: [...links, ...clientsLinks] });
  }
}

export { LinksRequestHandler };
