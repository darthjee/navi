import { ResponseParser } from './ResponseParser.js';

/**
 * Wraps an HTTP response object, providing convenient access to the
 * parsed JSON body and response headers for use in parameter mapping.
 *
 * Can represent either a full response or a per-item view where
 * `parsed_body` is a single element from the response array.
 * @author darthjee
 */
class ResponseWrapper {
  #response;
  #parsedBody;
  #headers;

  /**
   * @param {object} response The raw HTTP response object (e.g. from axios).
   * @param {string} response.data The raw response body string.
   * @param {object} response.headers The response headers map.
   */
  constructor(response) {
    this.#response = response;
    this.#headers = response.headers;
  }

  /**
   * Returns the lazily-parsed JSON body of the response.
   * The result is cached after the first call.
   * @returns {*} The parsed response body.
   */
  get parsed_body() {
    if (this.#parsedBody === undefined) {
      this.#parsedBody = new ResponseParser(this.#response.data).parse();
    }

    return this.#parsedBody;
  }

  /**
   * Returns the response headers map.
   * @returns {object} The raw headers from the HTTP response.
   */
  get headers() {
    return this.#headers;
  }

  /**
   * Returns an array of per-item ResponseWrapper instances.
   * If the parsed body is an array, one wrapper is created per element.
   * If it is a single object, a single-element array is returned.
   * Each per-item wrapper shares the same headers as this wrapper.
   * @returns {Array<ResponseWrapper>} List of per-item wrappers.
   */
  toItemWrappers() {
    const body = this.parsed_body;
    const items = Array.isArray(body) ? body : [body];

    return items.map((item) => ResponseWrapper.#fromItem(item, this.#headers));
  }

  /**
   * Creates a per-item ResponseWrapper with a pre-parsed body and shared headers.
   * @param {*} parsedBody The already-parsed item value.
   * @param {object} headers The response headers to share.
   * @returns {ResponseWrapper} A wrapper whose parsed_body is the given item.
   */
  static #fromItem(parsedBody, headers) {
    const wrapper = new ResponseWrapper({ data: null, headers });
    wrapper.#parsedBody = parsedBody;
    return wrapper;
  }
}

export { ResponseWrapper };
