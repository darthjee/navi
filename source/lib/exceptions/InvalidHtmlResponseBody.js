import { AppError } from './AppError.js';

/**
 * Thrown when an HTML response body cannot be parsed.
 * @author darthjee
 */
class InvalidHtmlResponseBody extends AppError {
  /**
   * @param {string} raw The raw HTML response body string that failed to parse.
   * @param {Error} cause The original parse error.
   */
  constructor(raw, cause) {
    super(`Invalid HTML response body: ${cause.message}`);
    this.raw = raw;
    this.cause = cause;
  }
}

export { InvalidHtmlResponseBody };
