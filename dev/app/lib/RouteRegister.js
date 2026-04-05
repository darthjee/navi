import RequestHandler from './RequestHandler.js';
import Serializer from './Serializer.js';

/**
 * Registers individual GET routes on an Express router, wiring each route
 * to a {@link RequestHandler} and an optional {@link Serializer}.
 */
class RouteRegister {
  #router;
  #data;

  /**
   * @param {import('express').Router} router - Express router instance.
   * @param {Object} data - Root data structure shared across all handlers.
   */
  constructor(router, data) {
    this.#router = router;
    this.#data = data;
  }

  /**
   * Registers a GET route.
   * @param {Object} options
   * @param {string} options.route - Express route pattern
   * @param {string[]} [options.attributes] - If provided, response is projected to these fields
   */
  register({ route, attributes } = {}) {
    const serializer = attributes ? new Serializer(attributes) : null;
    const handler = new RequestHandler(route, this.#data, serializer);
    this.#router.get(route, (req, res) => handler.handle(req, res));
  }
}

export default RouteRegister;
