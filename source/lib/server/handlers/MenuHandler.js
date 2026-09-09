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
   * Responds with the configured menu entries plus the always-present `hidden`
   * array of non-default routes flagged `hidden: true` in the menu file.
   * @returns {void}
   */
  handle() {
    const visible = this.#entries.filter((entry) => !entry.hidden);
    const hidden = this.#entries.filter((entry) => entry.hidden).map((entry) => entry.route);

    this.#response.json({ entries: MenuSerializer.serialize(visible), hidden });
  }
}

export { MenuHandler };
