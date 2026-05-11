import path from 'path';
import { RequestHandler } from '../../common/server/RequestHandler.js';

/**
 * Executes request-handling behaviour for static asset routes.
 * Rejects path traversal attempts with 403 Forbidden.
 * @author darthjee
 */
class AssetsHandler extends RequestHandler {
  #request;
  #response;
  #assetsDir;
  #validator;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {string} assetsDir - Absolute path to the assets directory.
   * @param {import('../PathValidator.js').PathValidator} validator - Path validator instance.
   */
  constructor(request, response, assetsDir, validator) {
    super();
    this.#request = request;
    this.#response = response;
    this.#assetsDir = assetsDir;
    this.#validator = validator;
  }

  /**
   * Serves the requested asset file, rejecting any path traversal attempt.
   * @returns {void}
   */
  handle() {
    const assetPath = [].concat(this.#request.params.path).join(path.sep);
    const resolved = this.#resolveAssetPath(assetPath);
    this.#response.sendFile(resolved);
  }

  /**
   * Resolves and validates the asset path.
   * @param {string} assetPath
   * @returns {string}
   */
  #resolveAssetPath(assetPath) {
    const resolved = path.resolve(this.#assetsDir, assetPath);
    this.#validator.validate(resolved);
    return resolved;
  }
}

export { AssetsHandler };
