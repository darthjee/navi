import path from 'path';
import { fileURLToPath } from 'url';
import { RequestHandler } from '../../common/server/RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../../../static');

/**
 * Executes request-handling behaviour for the SPA index route.
 * @author darthjee
 */
class IndexHandler extends RequestHandler {
  #response;

  /**
   * @param {object} _request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Serves source/static/index.html.
   * @returns {void}
   */
  handle() {
    this.#response.sendFile(path.join(staticDir, 'index.html'));
  }
}

export { IndexHandler };
