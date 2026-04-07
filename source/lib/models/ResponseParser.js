import { InvalidResponseBody } from '../exceptions/InvalidResponseBody.js';

/**
 * Parses a raw JSON response body string into a JavaScript value.
 *
 * Parsing is intentionally kept separate from normalisation (array vs object)
 * and from action dispatching — each concern lives in its own class.
 * @author darthjee
 */
class ResponseParser {
  #raw;

  /**
   * @param {string} raw The raw response body string.
   */
  constructor(raw) {
    this.#raw = raw;
  }

  /**
   * Parses the raw body and returns the resulting JavaScript value.
   * The return value may be an object, an array, or any other valid JSON type.
   * Normalisation to an array is the caller's responsibility.
   * @returns {*} The parsed value.
   * @throws {InvalidResponseBody} If the body cannot be parsed as JSON.
   */
  parse() {
    try {
      return JSON.parse(this.#raw);
    } catch (cause) {
      throw new InvalidResponseBody(this.#raw, cause);
    }
  }
}

export { ResponseParser };
