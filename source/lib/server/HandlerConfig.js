/**
 * Holds the configuration for a route handler and lazily instantiates it on each request.
 * @author darthjee
 */
class HandlerConfig {
  #handlerClass;
  #parameters;

  /**
   * Creates a new HandlerConfig.
   * @param {Function} handlerClass - The request handler class to instantiate.
   * @param {object} [parameters={}] - Parameters to pass to the handler constructor.
   */
  constructor(handlerClass, parameters = {}) {
    this.#handlerClass = handlerClass;
    this.#parameters = parameters;
  }

  /**
   * Instantiates the handler class with the stored parameters and delegates the request to it.
   * @param {object} req - The Express request object.
   * @param {object} res - The Express response object.
   * @returns {void}
   */
  handle(req, res) {
    new this.#handlerClass(this.#parameters).handle(req, res);
  }
}

export { HandlerConfig };
