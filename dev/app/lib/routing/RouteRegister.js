/**
 * Unified registry that registers GET routes on an Express router.
 *
 * Any object that implements `handle(req, res)` can be registered —
 * including {@link HandlerConfig} instances.
 */
class RouteRegister {
  #router;
  #routes;

  /**
   * @param {import('express').Router} router - Express router instance.
   */
  constructor(router) {
    this.#router = router;
    this.#routes = [];
  }

  /**
   * Registers a GET route wired to the given handler.
   * @param {string} route - Express route pattern.
   * @param {{ handle(req: object, res: object): void }} handler - Any object with a `handle(req, res)` method.
   * @throws {Error} If the same route pattern has already been registered.
   */
  register(route, handler) {
    if (this.#routes.includes(route)) {
      throw new Error(`RouteRegister: duplicate route "${route}"`);
    }
    this.#routes.push(route);
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }

  /**
   * Returns a copy of the registered route patterns in registration order.
   * @returns {string[]}
   */
  routes() {
    return [...this.#routes];
  }
}

export default RouteRegister;
