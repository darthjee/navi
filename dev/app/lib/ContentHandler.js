import DataNavigator from './DataNavigator.js';
import { notFound } from './not_found.js';
import RequestHandler from './RequestHandler.js';
import RouteParamsExtractor from './RouteParamsExtractor.js';

/**
 * Handles an incoming Express request by navigating the in-memory data,
 * optionally serializing the result, and writing the JSON response.
 *
 * Extends {@link RequestHandler} to implement the unified handler API for
 * data-fetching routes.
 */
class ContentHandler extends RequestHandler {
  #route;
  #data;
  #serializer;
  #extractorFactory;

  /**
   * @param {string} route - Express route pattern used to derive navigation steps.
   * @param {Object} data - Root data structure.
   * @param {import('./Serializer.js').default|null} [serializer] - Optional serializer to project the result.
   * @param {Function|null} [extractorFactory] - Optional factory `(route, params) => { steps() }`.
   *   Defaults to creating a real {@link RouteParamsExtractor}.
   */
  constructor(route, data, serializer = null, extractorFactory = null) {
    super();
    this.#route = route;
    this.#data = data;
    this.#serializer = serializer;
    this.#extractorFactory = extractorFactory
      ?? ((r, params) => new RouteParamsExtractor(r, params));
  }

  /**
   * Navigates the data for the given route/params, serializes the result,
   * and writes the JSON response. Responds 404 if navigation returns null.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    try {
      const steps = this.#extractorFactory(this.#route, req.params).steps();
      const result = new DataNavigator(this.#data, steps).navigate();
      if (result === null) return notFound(res);
      res.json(this.#serializer ? this.#serializer.serialize(result) : result);
    } catch (e) {
      console.warn(`ContentHandler: extraction failed for route "${this.#route}" (url: ${req.url}) — ${e.message}`);
      res.status(400).json({ error: e.message });
    }
  }
}

export default ContentHandler;
