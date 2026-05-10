import { RequestHandler } from '../../common/server/RequestHandler.js';
import { Link } from '../../models/configs/Link.js';
import { ClientRegistry } from '../../registry/ClientRegistry.js';
import { LinksSerializer } from '../../serializers/LinksSerializer.js';

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
    res.json({ links: LinksSerializer.serialize(this.#allLinks()) });
  }

  /**
   * Returns configured and client-derived links as Link instances.
   * @returns {Array<Link>} All links for endpoint response.
   */
  #allLinks() {
    return [...this.#links, ...this.#clientLinks()];
  }

  /**
   * Converts clients into Link instances.
   * @returns {Array<Link>} Client-derived links.
   */
  #clientLinks() {
    return ClientRegistry.all().map((client) => (
      new Link({ url: client.baseUrl, text: client.linkText ?? client.name })
    ));
  }
}

export { LinksRequestHandler };
