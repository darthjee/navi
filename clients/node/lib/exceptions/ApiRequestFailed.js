/**
 * Error raised when a request to Navi's `/api/*` namespace fails,
 * either because the HTTP status indicates an error (>= 400) or
 * because the underlying request itself could not be completed.
 *
 * @author darthjee
 */
class ApiRequestFailed extends Error {
  /**
   * @param {string} message Human-readable description of the failure.
   * @param {object} [attributes={}] Extra attributes describing the failure.
   * @param {number} [attributes.statusCode] HTTP status code returned by the server, when available.
   * @param {string} [attributes.url] The full URL that was requested.
   * @param {*} [attributes.body] The parsed response body, when available.
   */
  constructor(message, { statusCode, url, body } = {}) {
    super(message);
    this.name = 'ApiRequestFailed';
    this.statusCode = statusCode;
    this.url = url;
    this.body = body;
  }
}

export { ApiRequestFailed };
