import { AppError } from './AppError.js';

/**
 * Thrown when a response body cannot be parsed as JSON.
 * @author darthjee
 */
class InvalidResponseBody extends AppError {
  /**
   * @param {string} raw The raw response body string that failed to parse.
   * @param {Error} cause The original parse error.
   */
  constructor(raw, cause) {
    super(`Invalid response body: ${cause.message}`);
    this.raw = raw;
    this.cause = cause;
  }
}

export { InvalidResponseBody };
