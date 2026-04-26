import path from 'path';
import { fileURLToPath } from 'url';
import { RequestHandler } from './RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const staticDir = path.resolve(__dirname, '../../static');

/**
 * Handles GET / and SPA catch-all requests by serving index.html.
 * @author darthjee
 */
class IndexRequestHandler extends RequestHandler {
  /**
   * Creates a new IndexRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Responds by sending source/static/index.html.
   * @param {object} _req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(_req, res) {
    res.sendFile(path.join(staticDir, 'index.html'));
  }
}

export { IndexRequestHandler };
