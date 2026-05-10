import { RequestHandler } from '../common/server/RequestHandler.js';
import ContentHandlerExecutor from './ContentHandlerExecutor.js';
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
   * Delegates to ContentHandlerExecutor.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    new ContentHandlerExecutor(req, res, this._route, this._data, this._serializer, this._extractorFactory).handle();
  }

  /**
   * Returns the route pattern. Exposed for subclasses.
   * @returns {string}
   */
  get _route() {
    return this.#route;
  }

  /**
   * Returns the root data structure. Exposed for subclasses.
   * @returns {Object}
   */
  get _data() {
    return this.#data;
  }

  /**
   * Returns the configured serializer, or null. Exposed for subclasses.
   * @returns {import('./Serializer.js').default|null}
   */
  get _serializer() {
    return this.#serializer;
  }

  /**
   * Returns the extractor factory. Exposed for subclasses.
   * @returns {Function}
   */
  get _extractorFactory() {
    return this.#extractorFactory;
  }
}

export default ContentHandler;
