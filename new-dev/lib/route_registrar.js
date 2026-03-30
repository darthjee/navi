import DataNavigator from './data_navigator.js';
import { notFound } from './not_found.js';
import RouteParamsExtractor from './route_params_extractor.js';

class RouteRegistrar {
  constructor(router, data) {
    this._router = router;
    this._data = data;
  }

  /**
   * Registers a GET route that navigates the data and responds with JSON.
   * Responds with 404 if the navigation result is null.
   * @param {string} route - Express route pattern (e.g. '/categories/:id.json')
   */
  register(route) {
    this._router.get(route, (req, res) => {
      const steps = new RouteParamsExtractor(route, req.params).steps();
      const result = new DataNavigator(this._data, steps).navigate();
      if (result === null) return notFound(res);
      res.json(result);
    });
  }
}

export default RouteRegistrar;
