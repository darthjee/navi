import { AppError } from '../../common/exceptions/AppError.js';

/**
 * RequestFailed is a custom error class that represents a failed HTTP request.
 * It includes the status code, URL, and response headers of the failed request for better
 * error handling and debugging (e.g. reading a `Retry-After` header for retry policies).
 * @author darthjee
 */
class RequestFailed extends AppError {
  /**
   * @param {number} statusCode The HTTP status code received (or that triggered the failure).
   * @param {string} url The URL that was requested.
   * @param {string} [message='Request failed'] A custom error message prefix.
   * @param {object} [headers={}] The response headers received, when available.
   */
  constructor(statusCode, url, message = 'Request failed', headers = {}) {
    super(`${message}: ${statusCode} for ${url}`);
    this.statusCode = statusCode;
    this.url = url;
    this.headers = headers;
  }
}

export { RequestFailed };
