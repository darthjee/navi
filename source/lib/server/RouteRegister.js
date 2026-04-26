import { ForbiddenError } from '../exceptions/ForbiddenError.js';

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
   * Catches ForbiddenError from the handler and responds with 403 Forbidden.
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
        if (e instanceof ForbiddenError) {
          res.status(403).json({ error: 'Forbidden' });
        } else {
          throw e;
        }
      }
    });
  }
}

export { RouteRegister };
