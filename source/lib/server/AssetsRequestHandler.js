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
    const assetPath = [].concat(req.params.path).join(path.sep);
    const resolved = this.#resolveAssetPath(assetPath);
    res.sendFile(resolved);
  }

  /**
   * Resolves and validates the asset path, throwing if a traversal attempt is detected.
   * @param {string} assetPath - The raw asset path from the request.
   * @returns {string} The resolved absolute path.
   * @throws {ForbiddenError} If the path attempts to escape the assets directory.
   */
  #resolveAssetPath(assetPath) {
    const resolved = path.resolve(this.assetsDir, assetPath);

    this.validator.validate(resolved);

    return resolved;
  }
}

export { AssetsRequestHandler };
