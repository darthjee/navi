import { RequestHandler } from '../../common/server/RequestHandler.js';
import { Link } from '../../models/configs/Link.js';
import { ClientRegistry } from '../../registry/ClientRegistry.js';
import { LinksSerializer } from '../../serializers/LinksSerializer.js';

/**
 * Executes request-handling behaviour for GET /links.json.
 * @author darthjee
 */
class LinksHandler extends RequestHandler {
  #response;
  #links;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {Array<object>} links - Configured web links.
   */
  constructor(_request, response, links) {
    super();
    this.#response = response;
    this.#links = links;
  }

  /**
   * Responds with the combined configured and client-derived links.
   * @returns {void}
   */
  handle() {
    this.#response.json({ links: LinksSerializer.serialize(this.#allLinks()) });
  }

  /**
   * @returns {Array<Link>}
   */
  #allLinks() {
    return [...this.#links, ...this.#clientLinks()];
  }

  /**
   * @returns {Array<Link>}
   */
  #clientLinks() {
    return ClientRegistry.all().map((client) => (
      new Link({ url: client.baseUrl, text: client.linkText ?? client.name })
    ));
  }
}

export { LinksHandler };
