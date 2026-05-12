import path from 'path';
import { fileURLToPath } from 'url';
import { RequestHandler } from '../common/server/RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../../static');

/**
 * Executes request-handling behaviour for the SPA index route.
 */
class IndexHandler extends RequestHandler {
  #response;

  /**
   * @param {import('express').Request} _request
   * @param {import('express').Response} response
   */
  constructor(_request, response) {
    super();
    this.#response = response;
  }

  /**
   * Serves static/index.html.
   * @returns {void}
   */
  handle() {
    this.#response.sendFile(path.join(staticDir, 'index.html'));
  }
}

export default IndexHandler;
