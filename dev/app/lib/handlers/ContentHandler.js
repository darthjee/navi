import { notFound } from './not_found.js';
import RequestHandler from './RequestHandler.js';
import DataNavigator from '../models/DataNavigator.js';
import RouteParamsExtractor from '../routing/RouteParamsExtractor.js';

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
   * Navigates the data for the given route/params and delegates to
   * {@link _respond} to write the response. Responds 404 if navigation
   * returns null.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    try {
      const steps = this.#extractorFactory(this.#route, req.params).steps();
      const result = new DataNavigator(this.#data, steps).navigate();
      if (result === null) return notFound(res);
      this._respond(result, req, res);
    } catch (e) {
      console.warn(`ContentHandler: extraction failed for route "${this.#route}" (url: ${req.url}) — ${e.message}`);
      res.status(400).json({ error: e.message });
    }
  }

  /**
   * Writes the navigation result as a JSON response. Applies serialization
   * if a serializer was provided. Subclasses may override this method to
   * add extra behaviour (e.g. pagination headers).
   *
   * @param {*} result - The raw navigation result.
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   */
  _respond(result, _req, res) {
    res.json(this.#serializer ? this.#serializer.serialize(result) : result);
  }

  /**
   * Returns the serializer configured on this handler, or `null`.
   * Exposed for use by subclasses.
   * @returns {import('./Serializer.js').default|null}
   */
  get _serializer() {
    return this.#serializer;
  }
}

export default ContentHandler;
