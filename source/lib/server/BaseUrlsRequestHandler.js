import { RequestHandler } from './RequestHandler.js';
import { ClientRegistry } from '../registry/ClientRegistry.js';
import { BaseUrlsSerializer } from '../serializers/BaseUrlsSerializer.js';

/**
 * Handles GET /clients/base_urls.json requests.
 * Responds with the list of all unique client base URLs.
 * @author darthjee
 */
class BaseUrlsRequestHandler extends RequestHandler {
  /**
   * Creates a new BaseUrlsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds with all unique client base URLs.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    const clients = ClientRegistry.all();
    const allUrls = BaseUrlsSerializer.serialize(clients);
    const base_urls = [...new Set(allUrls)];

    res.json({ base_urls });
  }
}

export { BaseUrlsRequestHandler };
