import { notFound } from './not_found.js';
import { RequestHandlerExecutor } from '../common/server/RequestHandlerExecutor.js';
import { Logger } from '../common/utils/logging/Logger.js';
import DataNavigator from '../models/DataNavigator.js';
import RouteParamsExtractor from '../routing/RouteParamsExtractor.js';

/**
 * Executes request-handling behaviour for data-fetching routes by navigating
 * in-memory data and writing a JSON response.
 */
class ContentHandlerExecutor extends RequestHandlerExecutor {
  #request;
  #response;
  #route;
  #data;
  #serializer;
  #extractorFactory;

  /**
   * @param {import('express').Request} request
   * @param {import('express').Response} response
   * @param {string} route
   * @param {Object} data
   * @param {import('../models/Serializer.js').default|null} serializer
   * @param {Function|null} [extractorFactory]
   */
  constructor(request, response, route, data, serializer, extractorFactory = null) {
    super();
    this.#request = request;
    this.#response = response;
    this.#route = route;
    this.#data = data;
    this.#serializer = serializer;
    this.#extractorFactory = extractorFactory ?? ((r, params) => new RouteParamsExtractor(r, params));
  }

  /**
   * Navigates the data and delegates to _respond. Responds 400 on extraction
   * errors and 404 when navigation returns null.
   * @returns {void}
   */
  handle() {
    try {
      const steps = this.#extractorFactory(this.#route, this.#request.params).steps();
      const result = new DataNavigator(this.#data, steps).navigate();
      if (result === null) return notFound(this.#response);
      this._respond(result, this.#request, this.#response);
    } catch (e) {
      Logger.warn(`ContentHandlerExecutor: extraction failed for route "${this.#route}" (url: ${this.#request.url}) — ${e.message}`);
      this.#response.status(400).json({ error: e.message });
    }
  }

  /**
   * Writes the navigation result as a JSON response, applying serialization
   * if a serializer was provided. Subclasses may override to add behaviour.
   * @param {*} result
   * @param {import('express').Request} _req
   * @param {import('express').Response} res
   */
  _respond(result, _req, res) {
    res.json(this.#serializer ? this.#serializer.serialize(result) : result);
  }

  /**
   * Returns the configured serializer, or null. Exposed for subclasses.
   * @returns {import('../models/Serializer.js').default|null}
   */
  get _serializer() {
    return this.#serializer;
  }
}

export default ContentHandlerExecutor;
