import { RequestHandler } from '../../common/server/RequestHandler.js';
import { MenuSerializer } from '../../serializers/MenuSerializer.js';

/**
 * Executes request-handling behaviour for GET /menu.json.
 * @author darthjee
 */
class MenuHandler extends RequestHandler {
  #response;
  #entries;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {Array<import('../../models/configs/MenuEntry.js').MenuEntry>} entries - Configured menu entries.
   */
  constructor(_request, response, entries) {
    super();
    this.#response = response;
    this.#entries = entries;
  }

  /**
   * Responds with the configured menu entries.
   * @returns {void}
   */
  handle() {
    this.#response.json({ entries: MenuSerializer.serialize(this.#entries) });
  }
}

export { MenuHandler };
