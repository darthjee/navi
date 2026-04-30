import { ConflictError } from '../exceptions/ConflictError.js';
import { ForbiddenError } from '../exceptions/ForbiddenError.js';
import { NotFoundError } from '../exceptions/NotFoundError.js';
import { Logger } from '../utils/logging/Logger.js';

/**
 * Registers a route on an Express router by binding the handler's handle method.
 * @author darthjee
 */
class RouteRegister {
  #router;

  /**
   * @param {object} router - An Express Router instance.
   */
  constructor(router) {
    this.#router = router;
  }

  /**
   * Registers a GET route on the router.
   * Catches ForbiddenError → 403, NotFoundError → 404, and any other error → 500.
   * @param {object} params - Options for registering a route.
   * @param {string} params.route - The route path (e.g. '/stats.json').
   * @param {object} params.handler - The handler whose handle method is called.
   * @returns {void}
   */
  register({ route, handler }) {
    this.#router.get(route, (req, res) => {
      try {
        handler.handle(req, res);
        Logger.debug(`${req.method} ${req.path} ${res.statusCode}`);
      } catch (e) {
        this.#handleError(e, req, res);
      }
    });
  }

  /**
   * Registers a PATCH route on the router.
   * Catches ForbiddenError → 403, NotFoundError → 404, and any other error → 500.
   * @param {object} params - Options for registering a route.
   * @param {string} params.route - The route path (e.g. '/engine/pause').
   * @param {object} params.handler - The handler whose handle method is called.
   * @returns {void}
   */
  registerPatch({ route, handler }) {
    this.#router.patch(route, async (req, res) => {
      try {
        await handler.handle(req, res);
        Logger.debug(`${req.method} ${req.path} ${res.statusCode}`);
      } catch (e) {
        this.#handleError(e, req, res);
      }
    });
  }

  /**
   * Maps a caught exception to an HTTP error response and logs the access entry.
   * @param {Error} e - The caught exception.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  #handleError(e, req, res) {
    let statusCode;
    if (e instanceof ConflictError) {
      statusCode = 409;
      res.status(409).json({ error: 'Conflict' });
    } else if (e instanceof ForbiddenError) {
      statusCode = 403;
      res.status(403).json({ error: 'Forbidden' });
    } else if (e instanceof NotFoundError) {
      statusCode = 404;
      res.status(404).json({ error: e.message });
    } else {
      statusCode = 500;
      res.status(500).json({ error: 'Internal Server Error' });
    }
    Logger.debug(`${req.method} ${req.path} ${statusCode}`);
  }
}

export { RouteRegister };
