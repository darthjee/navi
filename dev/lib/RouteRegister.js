import RequestHandler from './RequestHandler.js';
import Serializer from './Serializer.js';

class RouteRegister {
  constructor(router, data) {
    this._router = router;
    this._data = data;
  }

  /**
   * Registers a GET route.
   * @param {Object} options
   * @param {string} options.route - Express route pattern
   * @param {string[]} [options.attributes] - If provided, response is projected to these fields
   */
  register({ route, attributes } = {}) {
    const serializer = attributes ? new Serializer(attributes) : null;
    const handler = new RequestHandler(route, this._data, serializer);
    this._router.get(route, (req, res) => handler.handle(req, res));
  }
}

export default RouteRegister;
