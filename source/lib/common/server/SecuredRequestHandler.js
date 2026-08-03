import { RequestHandler } from './RequestHandler.js';
import { ForbiddenError } from '../../exceptions/http/ForbiddenError.js';

/**
 * Base class for token-secured request handlers (the `/api/*` namespace).
 *
 * Concrete subclasses implement {@link SecuredRequestHandler#process} instead of
 * `handle()`; `handle()` itself always checks the request's bearer token against
 * the configured token first, throwing `ForbiddenError` on any mismatch (including
 * when no token is configured at all, which rejects every request by design).
 * @author darthjee
 */
class SecuredRequestHandler extends RequestHandler {
  #request;
  #response;
  #token;

  /**
   * @param {object} request - The Express request object.
   * @param {object} response - The Express response object.
   * @param {string|null} token - The configured token to check the request against.
   */
  constructor(request, response, token) {
    super();
    this.#request = request;
    this.#response = response;
    this.#token = token;
  }

  /**
   * Checks the bearer token, then delegates to {@link SecuredRequestHandler#process}.
   * @returns {Promise<void>}
   * @throws {ForbiddenError} When the provided token is missing/invalid, or no token is configured.
   */
  async handle() {
    this.#authorize();
    return this.process();
  }

  /**
   * Template method: concrete subclasses implement the actual request handling here.
   * @returns {void|Promise<void>} Nothing, or a promise resolving once handling completes.
   */
  process() {}

  /**
   * The Express request object.
   * @returns {object} The request.
   */
  get request() {
    return this.#request;
  }

  /**
   * The Express response object.
   * @returns {object} The response.
   */
  get response() {
    return this.#response;
  }

  /**
   * Validates the request's bearer token against the configured token.
   * @returns {void}
   * @throws {ForbiddenError} When the provided token is missing/invalid, or no token is configured.
   * @private
   */
  #authorize() {
    if (!this.#token || this.#bearerToken() !== this.#token) {
      throw new ForbiddenError();
    }
  }

  /**
   * Extracts the bearer token from the request's `Authorization` header.
   * @returns {string|null} The extracted token, or null when absent/malformed.
   * @private
   */
  #bearerToken() {
    const header = this.#request?.headers?.authorization;
    if (!header) return null;

    const [scheme, token] = header.split(' ');
    if (scheme !== 'Bearer' || !token) return null;

    return token;
  }
}

export { SecuredRequestHandler };
