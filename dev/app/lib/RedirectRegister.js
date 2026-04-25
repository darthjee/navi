import RedirectHandler from './RedirectHandler.js';

/**
 * Registers individual GET redirect routes on an Express router, wiring each
 * route to a {@link RedirectHandler} that issues an HTTP 302 to the target URL.
 */
class RedirectRegister {
  #router;
  #routes = [];

  /**
   * @param {import('express').Router} router - Express router instance.
   */
  constructor(router) {
    this.#router = router;
  }

  /**
   * Registers a GET redirect route.
   * @param {Object} options
   * @param {string} options.route - Express route pattern to match.
   * @param {string} options.target - Hash-based target template (e.g. '/#/categories/:id').
   * @throws {Error} If the same route pattern has already been registered.
   */
  register({ route, target } = {}) {
    this.#assertUnique(route);
    this.#routes.push(route);
    const handler = new RedirectHandler(target);
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }

  /**
   * Returns a copy of the registered route patterns in registration order.
   * @returns {string[]}
   */
  routes() {
    return [...this.#routes];
  }

  /**
   * @param {string} route
   * @throws {Error} If the route has already been registered.
   */
  #assertUnique(route) {
    if (this.#routes.includes(route)) {
      throw new Error(`RedirectRegister: duplicate route "${route}"`);
    }
  }
}

export default RedirectRegister;
