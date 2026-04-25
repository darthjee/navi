import DataNavigator from './DataNavigator.js';
import { notFound } from './not_found.js';
import RouteParamsExtractor from './RouteParamsExtractor.js';

/**
 * Base class for all request handlers. Defines the common API that every handler
 * must implement: a single `handle(req, res)` method.
 *
 * This class also provides the default content-handler behaviour — navigating
 * the in-memory data, optionally serializing the result, and writing the JSON
 * response. Subclasses may override `handle` to provide different behaviour
 * (e.g. HTTP redirects).
 */
class RequestHandler {
  #route;
  #data;
  #serializer;
  #extractorFactory;

  /**
   * @param {string|null} [route] - Express route pattern used to derive navigation steps.
   * @param {Object|null} [data] - Root data structure.
   * @param {import('./Serializer.js').default|null} [serializer] - Optional serializer to project the result.
   * @param {Function|null} [extractorFactory] - Optional factory `(route, params) => { steps() }`.
   *   Defaults to creating a real {@link RouteParamsExtractor}.
   */
  constructor(route = null, data = null, serializer = null, extractorFactory = null) {
    this.#route = route;
    this.#data = data;
    this.#serializer = serializer;
    this.#extractorFactory = extractorFactory
      ?? ((r, params) => new RouteParamsExtractor(r, params));
  }

  /**
   * Navigates the data for the given route/params, serializes the result,
   * and writes the JSON response. Responds 404 if navigation returns null.
   *
   * Subclasses must override this method to implement their own request handling.
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
      console.warn(`RequestHandler: extraction failed for route "${this.#route}" (url: ${req.url}) — ${e.message}`);
      res.status(400).json({ error: e.message });
    }
  }
}

export default RequestHandler;
