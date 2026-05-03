import path from 'path';
import { fileURLToPath } from 'url';
import RequestHandler from './RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../static');

/**
 * Handles GET / and SPA catch-all requests by serving index.html.
 */
class IndexRequestHandler extends RequestHandler {
  /**
   * Responds by sending static/index.html.
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   * @returns {void}
   */
  handle(_req, res) {
    res.sendFile(path.join(staticDir, 'index.html'));
  }
}

export default IndexRequestHandler;
