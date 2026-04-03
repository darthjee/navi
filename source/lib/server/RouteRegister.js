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
   * @param {object} params - Options for registering a route.
   * @param {string} params.route - The route path (e.g. '/stats.json').
   * @param {object} params.handler - The handler whose handle method is called.
   */
  register({ route, handler }) {
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }
}

export { RouteRegister };
