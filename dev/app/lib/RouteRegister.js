import RequestHandler from './RequestHandler.js';
import Serializer from './Serializer.js';

/**
 * Registers individual GET routes on an Express router, wiring each route
 * to a {@link RequestHandler} and an optional {@link Serializer}.
 */
class RouteRegister {
  #router;
  #data;
  #routes;

  /**
   * @param {import('express').Router} router - Express router instance.
   * @param {Object} data - Root data structure shared across all handlers.
   */
  constructor(router, data) {
    this.#router = router;
    this.#data = data;
    this.#routes = [];
  }

  /**
   * Registers a GET route.
   * @param {Object} options
   * @param {string} options.route - Express route pattern
   * @param {string[]} [options.attributes] - If provided, response is projected to these fields
   * @throws {Error} If the same route pattern has already been registered.
   */
  register({ route, attributes } = {}) {
    if (this.#routes.includes(route)) {
      throw new Error(`RouteRegister: duplicate route "${route}"`);
    }
    this.#routes.push(route);
    const serializer = attributes ? new Serializer(attributes) : null;
    const handler = new RequestHandler(route, this.#data, serializer);
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
