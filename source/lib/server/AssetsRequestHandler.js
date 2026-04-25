import path from 'path';
import { fileURLToPath } from 'url';
import { PathValidator } from './PathValidator.js';
import { RequestHandler } from './RequestHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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
    this.assetsDir = path.resolve(__dirname, '../../static/assets');
    this.validator = new PathValidator(this.assetsDir);
  }

  /**
   * Serves the requested asset file, rejecting any path traversal attempt.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    const assetPath = req.params.path;
    const resolved = path.resolve(this.assetsDir, assetPath);

    if (!this.validator.isValid(resolved)) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.sendFile(resolved);
  }
}

export { AssetsRequestHandler };
