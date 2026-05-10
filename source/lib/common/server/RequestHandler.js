/**
 * Base class for request handlers.
 * @author darthjee
 */
class RequestHandler {
  /**
   * Handles an incoming HTTP request.
   * @param {object} _req - The Express request object.
   * @param {object} _res - The Express response object.
   * @returns {void}
   */
  handle(_req, _res) {}
}

export { RequestHandler };
