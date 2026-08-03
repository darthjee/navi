import { RequestHandler } from '../../common/server/RequestHandler.js';
import { Link } from '../../models/configs/Link.js';
import { NamespaceMap } from '../../registry/NamespaceMap.js';
import { LinksSerializer } from '../../serializers/LinksSerializer.js';

const DEFAULT_NAMESPACE = 'default';

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
   * Returns links derived from the `default` namespace's clients only, so a
   * namespace added later (e.g. via a future config-addition endpoint) does not
   * silently leak its clients into the public `/links.json` response.
   * @returns {Array<Link>}
   */
  #clientLinks() {
    return NamespaceMap.getNamespace(DEFAULT_NAMESPACE).clientRegistry.filter(() => true).map((client) => (
      new Link({ url: client.baseUrl, text: client.linkText ?? client.name })
    ));
  }
}

export { LinksHandler };
