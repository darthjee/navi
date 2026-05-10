import RedirectHandlerExecutor from './RedirectHandlerExecutor.js';
import RequestHandler from './RequestHandler.js';

/**
 * Handles an incoming Express request by issuing an HTTP 302 redirect to
 * the hash-based equivalent path, substituting any route parameters into
 * the target template.
 *
 * Extends {@link RequestHandler} to share the unified handler API.
 */
class RedirectHandler extends RequestHandler {
  #target;

  /**
   * @param {string} target - Hash-based redirect target template (e.g. '/#/categories/:id').
   *   Named segments (`:param`) are replaced with the corresponding values from `req.params`.
   */
  constructor(target) {
    super();
    this.#target = target;
  }

  /**
   * Delegates redirect processing to RedirectHandlerExecutor.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   */
  handle(req, res) {
    new RedirectHandlerExecutor(req, res, this.#target).handle();
  }
}

export default RedirectHandler;
