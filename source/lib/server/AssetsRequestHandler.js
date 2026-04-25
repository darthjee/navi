import path from 'path';
import { fileURLToPath } from 'url';
import { RequestHandler } from './RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const assetsDir = path.resolve(__dirname, '../../static/assets');

/**
 * Handles GET /assets/* requests by serving static asset files.
 * Rejects path traversal attempts with 403 Forbidden.
 * @author darthjee
 */
class AssetsRequestHandler extends RequestHandler {
  /**
   * Creates a new AssetsRequestHandler instance.
   */
  constructor() {
    super();
  }

  /**
   * Serves the requested asset file, rejecting any path traversal attempt.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const assetPath = req.params.path;
    const resolved = path.resolve(assetsDir, assetPath);

    if (!resolved.startsWith(assetsDir + path.sep) && resolved !== assetsDir) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.sendFile(resolved);
  }
}

export { AssetsRequestHandler };
