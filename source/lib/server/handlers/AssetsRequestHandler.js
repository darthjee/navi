import path from 'path';
import { fileURLToPath } from 'url';
import { RequestHandler } from '../../common/server/RequestHandler.js';
import { PathValidator } from '../PathValidator.js';
import { AssetsHandlerExecutor } from './AssetsHandlerExecutor.js';

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
    this.assetsDir = path.resolve(__dirname, '../../../static/assets');
    this.validator = new PathValidator(this.assetsDir);
  }

  /**
   * Delegates to AssetsHandlerExecutor.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new AssetsHandlerExecutor(req, res, this.assetsDir, this.validator).handle();
  }
}

export { AssetsRequestHandler };
