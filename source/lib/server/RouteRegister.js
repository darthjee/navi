import { ConflictError } from '../exceptions/ConflictError.js';
import { ForbiddenError } from '../exceptions/ForbiddenError.js';
import { NotFoundError } from '../exceptions/NotFoundError.js';

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
      } catch (e) {
        this.#handleError(e, res);
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
      } catch (e) {
        this.#handleError(e, res);
      }
    });
  }

  /**
   * Maps a caught exception to an HTTP error response.
   * @param {Error} e - The caught exception.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  #handleError(e, res) {
    if (e instanceof ConflictError) {
      res.status(409).json({ error: 'Conflict' });
    } else if (e instanceof ForbiddenError) {
      res.status(403).json({ error: 'Forbidden' });
    } else if (e instanceof NotFoundError) {
      res.status(404).json({ error: e.message });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

export { RouteRegister };
