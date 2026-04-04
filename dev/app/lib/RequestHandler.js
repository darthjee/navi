import DataNavigator from './DataNavigator.js';
import { notFound } from './not_found.js';
import RouteParamsExtractor from './RouteParamsExtractor.js';

/**
 * Handles an incoming Express request by navigating the in-memory data,
 * optionally serializing the result, and writing the JSON response.
 */
class RequestHandler {
  /**
   * @param {string} route - Express route pattern used to derive navigation steps.
   * @param {Object} data - Root data structure.
   * @param {import('./Serializer.js').default|null} [serializer] - Optional serializer to project the result.
   */
  constructor(route, data, serializer = null) {
    this._route = route;
    this._data = data;
    this._serializer = serializer;
  }

  /**
   * Navigates the data for the given route/params, serializes the result,
   * and writes the JSON response. Responds 404 if navigation returns null.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    const steps = new RouteParamsExtractor(this._route, req.params).steps();
    const result = new DataNavigator(this._data, steps).navigate();
    if (result === null) return notFound(res);
    res.json(this._serializer ? this._serializer.serialize(result) : result);
  }
}

export default RequestHandler;
