/**
 * Unified registry that registers routes on an Express router.
 *
 * Any object that implements `handle(req, res)` can be registered —
 * including {@link HandlerConfig} instances. Each registration targets a
 * single HTTP method (defaulting to `get`).
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
   * Registers a route wired to the given handler for the given HTTP method.
   * @param {string} route - Express route pattern.
   * @param {{ handle(req: object, res: object): void }} handler - Any object with a `handle(req, res)` method.
   * @param {string} [method='get'] - HTTP method to bind (e.g. `'get'`, `'post'`).
   * @throws {Error} If the same method/route pair has already been registered.
   */
  register(route, handler, method = 'get') {
    const key = `${method} ${route}`;
    if (this.#routes.includes(key)) {
      throw new Error(`RouteRegister: duplicate route "${route}"`);
    }
    this.#routes.push(key);
    this.#router[method](route, (req, res) => handler.handle(req, res));
  }

  /**
   * Returns a copy of the registered `"<method> <route>"` keys in registration order.
   * @returns {string[]}
   */
  routes() {
    return [...this.#routes];
  }
}

export default RouteRegister;
