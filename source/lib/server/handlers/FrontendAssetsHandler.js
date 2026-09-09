import path from 'node:path';
import { RequestHandler } from '../../common/server/RequestHandler.js';
import { NotFoundError } from '../../exceptions/http/NotFoundError.js';
import { ExtensionsEnv } from '../extensions/ExtensionsEnv.js';
import { PathValidator } from '../PathValidator.js';

/**
 * Serves `GET /extensions/frontend/*path`, streaming the `.js` / `.css` bundle
 * files straight from the mounted `<NAVI_EXTENSIONS_DIR>/frontend/` folder.
 * Modeled on `AssetsHandler` with two differences: it short-circuits to
 * `NotFoundError` (404) when extensions are disabled, and it derives its base
 * directory from `ExtensionsEnv` per request rather than from a frozen
 * module-scope constant.
 * @author darthjee
 */
class FrontendAssetsHandler extends RequestHandler {
  #request;
  #response;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   */
  constructor(request, response) {
    super();
    this.#request = request;
    this.#response = response;
  }

  /**
   * Serves the requested frontend bundle file, rejecting any path traversal
   * attempt with 403 and any request while extensions are disabled with 404.
   * @returns {void}
   * @throws {NotFoundError} When extensions are disabled.
   * @throws {import('../../exceptions/http/ForbiddenError.js').ForbiddenError} On path traversal.
   */
  handle() {
    if (!ExtensionsEnv.enabled) throw new NotFoundError();

    const baseDir = ExtensionsEnv.frontendDir;
    const rel = [].concat(this.#request.params.path).join(path.sep);
    const resolved = path.resolve(baseDir, rel);

    new PathValidator(baseDir).validate(resolved);

    this.#response.sendFile(resolved);
  }
}

export { FrontendAssetsHandler };
