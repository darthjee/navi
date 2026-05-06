/**
 * Abstract base class for all request handlers. Defines the common API that
 * every handler must implement: a single `handle(req, res)` method.
 *
 * Subclasses must override `handle` to provide their own request-handling
 * behaviour (e.g. data fetching via {@link ContentHandler}, or HTTP redirects
 * via {@link RedirectHandler}).
 */
class RequestHandler {
  /**
   * Handles the incoming Express request and writes a response.
   * Subclasses must override this method.
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @throws {Error} Always — subclasses must override this method.
   */
  // eslint-disable-next-line no-unused-vars
  handle(_req, _res) {
    throw new Error('RequestHandler#handle must be implemented by subclass');
  }
}

export default RequestHandler;
